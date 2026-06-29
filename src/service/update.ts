import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { getContentUriAsync } from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";
import { runtimeLogger } from "@/utils/runtimeLogger";
import Constants from "expo-constants";

// ============================================================
// Config
// ============================================================

const GITEE_CONFIG = {
  owner: "damn_2",
  repo: "planet",
};

const RELEASES_URL = `https://gitee.com/api/v5/repos/${GITEE_CONFIG.owner}/${GITEE_CONFIG.repo}/releases/latest`;

const CACHED_APK_KEY = "cached_apk_info";

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

interface CachedApkInfo {
  version: string;
  apkPath: string;
  size: number;
}

// ============================================================
// Path helpers
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
// Version utils
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

function getLocalVersion(): string {
  try {
    return Constants.expoConfig?.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

// ============================================================
// 1. 检查更新
// ============================================================

export async function checkUpdate(): Promise<CheckResult> {
  runtimeLogger.info("Update", "开始检查更新...");

  const cached = await getCachedApk();
  const localVersion = getLocalVersion();

  let release: GiteeRelease;
  try {
    const resp = await fetch(RELEASES_URL);
    if (!resp.ok) {
      runtimeLogger.error(
        "Update",
        `Gitee API 返回非 200: ${String(resp.status)}`,
      );
      throw new Error(`服务器返回 ${String(resp.status)}`);
    }
    release = (await resp.json()) as GiteeRelease;
  } catch (err) {
    runtimeLogger.error("Update", "获取 Release 信息失败", err);
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
    // Already up-to-date — clean up any stale cache
    if (cached) {
      await cleanupFiles();
    }
    runtimeLogger.info("Update", "已是最新版本");
    return { hasUpdate: false };
  }

  // Find download asset: prefer zip (non-archive), fallback to apk
  const zipAsset = release.assets.find(
    (a) => a.name.endsWith(".zip") && !a.name.includes("archive"),
  );
  const apkAsset = release.assets.find((a) => a.name.endsWith(".apk"));
  const downloadAsset = zipAsset ?? apkAsset;

  if (!downloadAsset) {
    runtimeLogger.error("Update", "Release 中未找到下载文件");
    throw new Error("未找到下载文件");
  }

  // If we already have this version cached, return without zipUrl
  if (cached?.version === remoteVersion) {
    const cachedFile = new FileSystem.File(cached.apkPath);
    if (cachedFile.exists) {
      runtimeLogger.info(
        "Update",
        `版本 ${remoteVersion} 已有缓存 APK，直接安装`,
      );
      return {
        hasUpdate: true,
        name: release.name,
        body: release.body,
        remoteVersion,
      };
    }
  }

  runtimeLogger.info("Update", `发现新版本: ${remoteVersion}`);
  return {
    hasUpdate: true,
    name: release.name,
    body: release.body,
    zipUrl: downloadAsset.browser_download_url,
    remoteVersion,
  };
}

// ============================================================
// 2. 下载（支持进度回调 + 取消 + 直接下载 .apk）
// ============================================================

let currentDownloadTask: FileSystem.DownloadTask | null = null;

export function cancelDownload(): void {
  if (currentDownloadTask) {
    currentDownloadTask.cancel();
    currentDownloadTask = null;
  }
}

export async function downloadUpdate(
  url: string,
  onProgress: (percent: number, statusText: string) => void,
): Promise<string> {
  ensureDir(updateDir);

  // Clean up previous download files
  if (updateDir.exists) {
    updateDir.delete();
  }
  ensureDir(updateDir);

  const isApk = url.toLowerCase().endsWith(".apk");
  const targetFile = isApk
    ? new FileSystem.File(updateDir, "update.apk")
    : zipFile;

  runtimeLogger.info("Update", `开始下载: ${url}`);
  onProgress(0, "准备下载...");

  const task = FileSystem.File.createDownloadTask(url, targetFile, {
    onProgress: ({ bytesWritten, totalBytes }) => {
      const percent =
        totalBytes > 0
          ? Math.round((bytesWritten / totalBytes) * 100)
          : 0;
      if (percent >= 100) {
        onProgress(100, "下载完成，准备安装...");
      } else if (percent > 0) {
        onProgress(percent, `下载中 ${String(percent)}%`);
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
// 3. 解压（如果下载的是 ZIP 包；APK 直接返回）
// ============================================================

export async function extractApkIfNeeded(
  downloadedPath: string,
): Promise<string> {
  // If it's already an APK, no extraction needed
  if (downloadedPath.toLowerCase().endsWith(".apk")) {
    runtimeLogger.info("Update", `直接使用 APK: ${downloadedPath}`);
    return downloadedPath;
  }

  runtimeLogger.info("Update", `开始解压: ${downloadedPath}`);

  const fflate = await import("fflate");

  const zipFileObj = new FileSystem.File(downloadedPath);
  const bytes = await zipFileObj.bytes();

  const unzipped = fflate.unzipSync(bytes);

  ensureDir(extractDir);

  let apkPath = "";

  for (const [filename, data] of Object.entries(unzipped)) {
    const file = new FileSystem.File(extractDir, filename);

    // Ensure parent directory exists for nested paths
    const parentDir = file.parentDirectory;
    if (parentDir.uri !== extractDir.uri) {
      ensureDir(parentDir);
    }

    file.write(data as Uint8Array);

    if (filename.toLowerCase().endsWith(".apk")) {
      apkPath = file.uri;
      runtimeLogger.info(
        "Update",
        `找到 APK: ${filename} (${String(file.size)} bytes)`,
      );
    }
  }

  if (!apkPath) {
    runtimeLogger.error("Update", "ZIP 中未找到 APK 文件");
    // List what was extracted for debugging
    const extracted = extractDir.list().map((f) =>
      f instanceof FileSystem.File ? f.uri : f.uri,
    );
    runtimeLogger.error("Update", `解压内容: ${extracted.join(", ")}`);
    throw new Error("安装包不存在");
  }

  runtimeLogger.info("Update", `解压完成，APK: ${apkPath}`);
  return apkPath;
}

// ============================================================
// 4. 安装权限引导
// ============================================================

/**
 * 跳转到系统设置的「安装未知应用」页面
 */
export async function openInstallPermissionSettings(): Promise<void> {
  if (Platform.OS !== "android") return;

  const packageName = Constants.expoConfig?.android?.package ?? "";

  try {
    await IntentLauncher.startActivityAsync(
      "android.settings.MANAGE_UNKNOWN_APP_SOURCES",
      { data: `package:${packageName}` },
    );
    runtimeLogger.info("Update", "已跳转安装权限设置页");
  } catch {
    // Fallback: generic app settings page
    runtimeLogger.warn("Update", "MANAGE_UNKNOWN_APP_SOURCES 失败，尝试通用设置页");
    try {
      await IntentLauncher.startActivityAsync(
        "android.settings.APPLICATION_DETAILS_SETTINGS",
        { data: `package:${packageName}` },
      );
    } catch (err) {
      runtimeLogger.error("Update", "无法打开设置页面", err);
      throw new Error("请手动前往系统设置开启「安装未知应用」权限");
    }
  }
}

// ============================================================
// 5. 调起系统安装器
// ============================================================

export async function installApk(apkPath: string): Promise<void> {
  runtimeLogger.info("Update", `调起安装: ${apkPath}`);

  if (Platform.OS !== "android") {
    throw new Error("仅支持 Android 安装");
  }

  const apkFile = new FileSystem.File(apkPath);

  if (!apkFile.exists) {
    runtimeLogger.error("Update", `APK 文件不存在: ${apkPath}`);
    throw new Error("安装包不存在，请重新下载");
  }

  runtimeLogger.info("Update", `APK 文件大小: ${String(apkFile.size)} bytes`);

  // contentUri: try new API getter first, fallback to legacy async
  let contentUri = apkFile.contentUri as string | undefined;

  if (!contentUri) {
    runtimeLogger.info("Update", "contentUri getter 为空，尝试 legacy API");
    contentUri = await getContentUriAsync(apkFile.uri);
  }

  if (!contentUri) {
    runtimeLogger.error("Update", "无法获取 contentUri");
    throw new Error("无法获取安装包访问权限");
  }

  runtimeLogger.info("Update", `Content URI: ${contentUri}`);

  // ACTION_VIEW with RETURN_RESULT extra — this tells the package installer
  // to call setResult(), which prevents startActivityForResult from returning
  // RESULT_CANCELED immediately.
  await IntentLauncher.startActivityAsync(
    "android.intent.action.VIEW",
    {
      data: contentUri,
      type: "application/vnd.android.package-archive",
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      extra: {
        "android.intent.extra.NOT_UNKNOWN_SOURCE": true,
        "android.intent.extra.RETURN_RESULT": true,
      },
    },
  );

  runtimeLogger.info("Update", "安装器已调起");
}

// ============================================================
// 6. APK 缓存管理
// ============================================================

export async function cacheApk(
  apkPath: string,
  version: string,
): Promise<void> {
  if (!version) return;

  try {
    const file = new FileSystem.File(apkPath);
    const info: CachedApkInfo = {
      version,
      apkPath,
      size: file.size ?? 0,
    };
    await AsyncStorage.setItem(CACHED_APK_KEY, JSON.stringify(info));
    runtimeLogger.info("Update", `APK 已缓存: ${apkPath}`);
  } catch (err) {
    runtimeLogger.warn("Update", "缓存 APK 信息失败", err);
  }
}

async function getCachedApk(): Promise<CachedApkInfo | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHED_APK_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedApkInfo;

    // Verify file still exists
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
// 7. 清理临时文件
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
