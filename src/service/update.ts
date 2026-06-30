import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";
import { runtimeLogger } from "@/utils/runtimeLogger";
import Constants from "expo-constants";
import packageJson from "../../package.json";

// ============================================================
// Config
// ============================================================

const GITEE_CONFIG = {
  owner: "damn_2",
  repo: "planet",
};

const RELEASES_URL = `https://gitee.com/api/v5/repos/${GITEE_CONFIG.owner}/${GITEE_CONFIG.repo}/releases/latest`;

const CACHED_APK_KEY = "cached_apk";
const UPDATE_CHECK_CACHE_KEY = "update_check_cache";

/** TTL for update check: 30 min — prevent Gitee 403 rate limiting */
const CHECK_TTL_MS = 30 * 60 * 1000;

// ============================================================
// Types
// ============================================================

export interface CheckResult {
  hasUpdate: boolean;
  name?: string;
  body?: string;
  zipUrl?: string;
  remoteVersion?: string;
}

interface GiteeRelease {
  tag_name: string;
  name: string;
  body: string;
  assets: Array<{
    browser_download_url: string;
    name: string;
  }>;
}

interface CachedApk {
  version: string;
  apkPath: string;
}

interface UpdateCheckCache {
  checkedAt: number; // Date.now()
  result: CheckResult;
}

// ============================================================
// Path helpers — use cache dir (Expo FileProvider serves from here)
// ============================================================

const updateDir = new FileSystem.Directory(
  FileSystem.Paths.cache,
  "app_updates",
);
const zipFile = new FileSystem.File(updateDir, "update.zip");
const extractDir = new FileSystem.Directory(updateDir, "extracted");

function ensureDir(dir: FileSystem.Directory): void {
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}

// ============================================================
// Version utils — single source: package.json
// ============================================================

/** Strip 'v' prefix and '-beta*' / '-alpha*' suffix, keep only X.Y.Z */
function normalizeVersion(ver: string): string {
  return ver.replace(/^v/, "").replace(/-.*$/, "");
}

/** Parse "X.Y.Z" into comparable number: major*10000 + minor*100 + patch */
function versionToCode(ver: string): number {
  const parts = ver.split(".");
  const major = parseInt(parts[0] ?? "0", 10);
  const minor = parseInt(parts[1] ?? "0", 10);
  const patch = parseInt(parts[2] ?? "0", 10);
  return major * 10000 + minor * 100 + patch;
}

/** Local version — uses package.json as single source of truth */
function getLocalVersion(): string {
  return packageJson.version ?? "0.0.0";
}

// ============================================================
// TTL cache for update check
// ============================================================

async function getCachedCheck(): Promise<UpdateCheckCache | null> {
  try {
    const raw = await AsyncStorage.getItem(UPDATE_CHECK_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UpdateCheckCache;
  } catch {
    return null;
  }
}

async function setCachedCheck(result: CheckResult): Promise<void> {
  try {
    const entry: UpdateCheckCache = { checkedAt: Date.now(), result };
    await AsyncStorage.setItem(UPDATE_CHECK_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // non-critical
  }
}

// ============================================================
// 1. 检查更新
// ============================================================

export async function checkUpdate(): Promise<CheckResult> {
  runtimeLogger.info("Update", "开始检查更新...");

  const cached = await getCachedApk();
  const localVersion = getLocalVersion();

  // TTL check: return cached result if within 30 min
  const cachedCheck = await getCachedCheck();
  if (cachedCheck && Date.now() - cachedCheck.checkedAt < CHECK_TTL_MS) {
    runtimeLogger.info("Update", "命中 TTL 缓存，跳过网络请求");
    return cachedCheck.result;
  }

  let release: GiteeRelease;
  try {
    const resp = await fetch(RELEASES_URL);
    if (!resp.ok) {
      runtimeLogger.error(
        "Update",
        `Gitee API 返回非 200: ${String(resp.status)}`,
      );
      // If rate limited but have stale cache, use it
      if (resp.status === 403 && cachedCheck) {
        runtimeLogger.warn("Update", "被限流，使用过期缓存");
        return cachedCheck.result;
      }
      throw new Error(`服务器返回 ${String(resp.status)}`);
    }
    release = (await resp.json()) as GiteeRelease;
  } catch (err) {
    runtimeLogger.error("Update", "获取 Release 信息失败", err);
    // Network error with stale cache → use it
    if (cachedCheck) {
      runtimeLogger.warn("Update", "网络错误，使用过期缓存");
      return cachedCheck.result;
    }
    throw err;
  }

  const remoteRaw = release.tag_name;
  const remoteVersion = normalizeVersion(remoteRaw);
  const localNorm = normalizeVersion(localVersion);

  runtimeLogger.info(
    "Update",
    `版本比较: 本地=${localVersion} (${localNorm}) vs 远程=${remoteRaw} (${remoteVersion})`,
  );

  if (versionToCode(remoteVersion) <= versionToCode(localNorm)) {
    if (cached) {
      await cleanupFiles();
    }
    runtimeLogger.info("Update", "已是最新版本");
    const result: CheckResult = { hasUpdate: false };
    await setCachedCheck(result);
    return result;
  }

  // Find download asset: prefer zip, fallback to apk
  const zipAsset = release.assets.find(
    (a) => a.name.endsWith(".zip") && !a.name.includes("archive"),
  );
  const apkAsset = release.assets.find((a) => a.name.endsWith(".apk"));
  const downloadAsset = zipAsset ?? apkAsset;

  if (!downloadAsset) {
    runtimeLogger.error("Update", "Release 中未找到下载文件");
    throw new Error("未找到下载文件");
  }

  // Same version already cached → install directly
  if (cached?.version === remoteVersion) {
    const cachedFile = new FileSystem.File(cached.apkPath);
    if (cachedFile.exists) {
      runtimeLogger.info(
        "Update",
        `版本 ${remoteVersion} 已有缓存 APK，直接安装`,
      );
      const result: CheckResult = {
        hasUpdate: true,
        name: release.name,
        body: release.body,
        remoteVersion,
      };
      await setCachedCheck(result);
      return result;
    }
  }

  runtimeLogger.info("Update", `发现新版本: ${remoteVersion}`);
  const result: CheckResult = {
    hasUpdate: true,
    name: release.name,
    body: release.body,
    zipUrl: downloadAsset.browser_download_url,
    remoteVersion,
  };
  await setCachedCheck(result);
  return result;
}

// ============================================================
// 2. 下载（支持进度回调 + 取消）
// ============================================================

let currentDownloadTask: FileSystem.DownloadTask | null = null;

export function cancelDownload(): void {
  if (currentDownloadTask) {
    currentDownloadTask.cancel();
    currentDownloadTask = null;
  }
}

export async function downloadZip(
  url: string,
  onProgress: (pct: number, status: string) => void,
): Promise<string> {
  ensureDir(updateDir);

  // Clean up previous download
  cleanupFilesSync();

  runtimeLogger.info("Update", `开始下载: ${url}`);
  onProgress(0, "准备下载...");

  const task = FileSystem.File.createDownloadTask(url, zipFile, {
    onProgress: ({ bytesWritten, totalBytes }) => {
      const pct =
        totalBytes > 0 ? Math.round((bytesWritten / totalBytes) * 100) : 0;
      if (pct >= 100) {
        onProgress(100, "下载完成，准备安装...");
      } else if (pct > 0) {
        onProgress(pct, `下载中 ${String(pct)}%`);
      }
    },
  });

  currentDownloadTask = task;

  try {
    const result = await task.downloadAsync();
    if (!result) {
      throw new Error("下载被暂停");
    }
    runtimeLogger.info("Update", `下载完成: ${result.uri}`);
    onProgress(100, "下载完成，准备安装...");
    currentDownloadTask = null;
    return result.uri;
  } catch (err) {
    currentDownloadTask = null;
    runtimeLogger.error("Update", "下载失败", err);
    throw err;
  }
}

// ============================================================
// 3. 解压 ZIP → APK
// ============================================================

export async function extractApk(zipPath: string): Promise<string> {
  runtimeLogger.info("Update", `开始解压: ${zipPath}`);

  const fflate = await import("fflate");

  const zipFileObj = new FileSystem.File(zipPath);
  const bytes = await zipFileObj.bytes();

  const unzipped = fflate.unzipSync(bytes);

  ensureDir(extractDir);

  let apkPath = "";

  for (const [filename, data] of Object.entries(unzipped)) {
    const apkFile = new FileSystem.File(extractDir, filename);

    // Ensure parent directory exists for nested paths
    const parentDir = apkFile.parentDirectory;
    if (parentDir.uri !== extractDir.uri) {
      ensureDir(parentDir);
    }

    apkFile.write(data as Uint8Array);

    if (filename.toLowerCase().endsWith(".apk")) {
      apkPath = apkFile.uri;
      runtimeLogger.info(
        "Update",
        `找到 APK: ${filename} (${String(apkFile.size)} bytes)`,
      );
    }
  }

  if (!apkPath) {
    runtimeLogger.error("Update", "ZIP 中未找到 APK 文件");
    const extracted = extractDir
      .list()
      .map((f) => (f instanceof FileSystem.File ? f.uri : f.uri));
    runtimeLogger.error("Update", `解压内容: ${extracted.join(", ")}`);
    throw new Error("安装包不存在");
  }

  runtimeLogger.info("Update", `解压完成，APK: ${apkPath}`);
  return apkPath;
}

// ============================================================
// 4. APK 缓存
// ============================================================

export async function cacheApk(
  apkPath: string,
  version: string,
): Promise<void> {
  if (!version) return;
  const data: CachedApk = { version, apkPath };
  await AsyncStorage.setItem(CACHED_APK_KEY, JSON.stringify(data));
}

async function getCachedApk(): Promise<CachedApk | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHED_APK_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedApk;
    const cachedFile = new FileSystem.File(data.apkPath);
    if (!cachedFile.exists) {
      await AsyncStorage.removeItem(CACHED_APK_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export async function getCachedApkPath(): Promise<string | null> {
  const cached = await getCachedApk();
  return cached?.apkPath ?? null;
}

// ============================================================
// 5. 权限引导
// ============================================================

/**
 * 跳转到系统「安装未知应用」权限设置页
 */
export async function openInstallPermissionSettings(): Promise<void> {
  if (Platform.OS !== "android") return;

  const packageName =
    Constants.expoConfig?.android?.package ?? "com.anonymous.Project";

  try {
    await IntentLauncher.startActivityAsync(
      "android.settings.MANAGE_UNKNOWN_APP_SOURCES",
      { data: `package:${packageName}` },
    );
    runtimeLogger.info("Update", "已跳转安装权限设置页");
  } catch {
    runtimeLogger.warn("Update", "MANAGE_UNKNOWN_APP_SOURCES 失败，尝试应用详情");
    try {
      await IntentLauncher.startActivityAsync(
        "android.settings.APPLICATION_DETAILS_SETTINGS",
        { data: `package:${packageName}` },
      );
    } catch (err) {
      runtimeLogger.error("Update", "打开设置页失败", err);
      throw new Error("请手动前往设置 → 应用 → 允许安装未知应用");
    }
  }
}

// ============================================================
// 6. 调起系统安装器
// ============================================================

export async function installApk(apkPath: string): Promise<void> {
  runtimeLogger.info("Update", `调起安装: ${apkPath}`);

  if (Platform.OS !== "android") {
    throw new Error("仅支持 Android 安装");
  }

  const apkFile = new FileSystem.File(apkPath);

  if (!apkFile.exists) {
    throw new Error("APK 文件不存在");
  }

  const fileSize = apkFile.size ?? 0;
  runtimeLogger.info("Update", `APK 大小: ${String(fileSize)} bytes`);

  if (fileSize < 1024 * 1024) {
    throw new Error(`APK 文件异常，大小仅 ${String(fileSize)} bytes`);
  }

  const contentUri = apkFile.contentUri;

  if (!contentUri) {
    throw new Error("无法获取 contentUri，FileProvider 未正确配置");
  }

  runtimeLogger.info("Update", `Content URI: ${contentUri}`);

  const FLAG_GRANT_READ_URI_PERMISSION = 1;
  const FLAG_ACTIVITY_NEW_TASK = 268435456;

  try {
    await IntentLauncher.startActivityAsync(
      "android.intent.action.VIEW",
      {
        data: contentUri,
        type: "application/vnd.android.package-archive",
        flags: FLAG_GRANT_READ_URI_PERMISSION | FLAG_ACTIVITY_NEW_TASK,
        extra: {
          "android.intent.extra.NOT_UNKNOWN_SOURCE": true,
        },
      },
    );
    runtimeLogger.info("Update", "安装器已调起");
  } catch (err) {
    runtimeLogger.error("Update", "调起安装器失败", err);
    throw new Error("无法打开安装程序，请检查是否已授予安装未知应用权限");
  }
}

// ============================================================
// 7. 清理
// ============================================================

function cleanupFilesSync(): void {
  if (updateDir.exists) {
    updateDir.delete();
  }
}

export async function cleanupFiles(): Promise<void> {
  try {
    cleanupFilesSync();
    await AsyncStorage.removeItem(CACHED_APK_KEY);
    runtimeLogger.info("Update", "临时文件已清理");
  } catch (err) {
    runtimeLogger.warn("Update", "清理临时文件失败", err);
  }
}
