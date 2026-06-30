import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { runtimeLogger } from "@/utils/runtimeLogger";

const GITEE_CONFIG = {
  owner: "damn_2",
  repo: "planet",
};

const RELEASES_URL = `https://gitee.com/api/v5/repos/${GITEE_CONFIG.owner}/${GITEE_CONFIG.repo}/releases/latest`;

const CACHED_APK_KEY = "cached_apk_v2";
const CHECK_CACHE_KEY = "update_check_cache_v2";
const CHECK_TTL_MS = 30 * 60 * 1000;

export interface CheckResult {
  hasUpdate: boolean;
  name?: string;
  body?: string;
  downloadUrl?: string;
  remoteVersion?: string;
  isCached?: boolean;
}

interface GiteeRelease {
  tag_name: string;
  name: string;
  body: string;
  assets: Array<{
    browser_download_url: string;
    name: string;
    size?: number;
  }>;
}

interface CachedApkInfo {
  version: string;
  apkPath: string;
  size: number;
}

interface CheckCacheEntry {
  checkedAt: number;
  result: CheckResult;
}

const updateDir = new FileSystem.Directory(
  FileSystem.Paths.cache,
  "app_updates",
);
const dlFile = new FileSystem.File(updateDir, "update.bin");
const extractDir = new FileSystem.Directory(updateDir, "extracted");

function ensureDir(dir: FileSystem.Directory): void {
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}

function normalizeVersion(ver: string): string {
  return ver.replace(/^v/, "").replace(/-.*$/, "");
}

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

function getPackageName(): string {
  try {
    return Constants.expoConfig?.android?.package ?? "com.anonymous.Project";
  } catch {
    return "com.anonymous.Project";
  }
}

async function getCachedCheck(): Promise<CheckCacheEntry | null> {
  try {
    const raw = await AsyncStorage.getItem(CHECK_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CheckCacheEntry;
  } catch {
    return null;
  }
}

async function setCachedCheck(result: CheckResult): Promise<void> {
  try {
    const entry: CheckCacheEntry = { checkedAt: Date.now(), result };
    await AsyncStorage.setItem(CHECK_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

export async function checkUpdate(force = false): Promise<CheckResult> {
  runtimeLogger.info("Update", "[checkUpdate] start, force=" + String(force));

  const localVersion = getLocalVersion();
  runtimeLogger.info("Update", `[checkUpdate] local version=${localVersion}`);

  if (!force) {
    const cachedCheck = await getCachedCheck();
    if (cachedCheck && Date.now() - cachedCheck.checkedAt < CHECK_TTL_MS) {
      runtimeLogger.info("Update", "[checkUpdate] hit TTL cache");
      return cachedCheck.result;
    }
  }

  let release: GiteeRelease;
  try {
    const resp = await fetch(RELEASES_URL);
    if (!resp.ok) {
      runtimeLogger.error(
        "Update",
        `[checkUpdate] Gitee API status=${String(resp.status)}`,
      );
      if (resp.status === 403) {
        const cachedCheck = await getCachedCheck();
        if (cachedCheck) {
          runtimeLogger.warn("Update", "[checkUpdate] rate limited, use stale cache");
          return cachedCheck.result;
        }
      }
      throw new Error(`服务器返回 ${String(resp.status)}`);
    }
    release = (await resp.json()) as GiteeRelease;
  } catch (err) {
    runtimeLogger.error("Update", "[checkUpdate] fetch failed", err);
    const cachedCheck = await getCachedCheck();
    if (cachedCheck) {
      runtimeLogger.warn("Update", "[checkUpdate] network error, use stale cache");
      return cachedCheck.result;
    }
    throw err;
  }

  const remoteRaw = release.tag_name;
  const remoteVersion = normalizeVersion(remoteRaw);
  const localNorm = normalizeVersion(localVersion);

  runtimeLogger.info(
    "Update",
    `[checkUpdate] compare: local=${localNorm} remote=${remoteVersion}`,
  );

  if (versionToCode(remoteVersion) <= versionToCode(localNorm)) {
    runtimeLogger.info("Update", "[checkUpdate] already latest");
    const cached = await getCachedApk();
    if (cached) {
      runtimeLogger.info("Update", "[checkUpdate] cleaning stale cached apk");
      await cleanupFiles();
    }
    const result: CheckResult = { hasUpdate: false };
    await setCachedCheck(result);
    return result;
  }

  const zipAsset = release.assets.find(
    (a) => a.name.endsWith(".zip") && !a.name.includes("archive"),
  );
  const apkAsset = release.assets.find((a) => a.name.endsWith(".apk"));
  const downloadAsset = zipAsset ?? apkAsset;

  if (!downloadAsset) {
    runtimeLogger.error("Update", "[checkUpdate] no download asset found");
    throw new Error("未找到下载文件");
  }

  const cached = await getCachedApk();
  if (cached && cached.version === remoteVersion) {
    const cachedFile = new FileSystem.File(cached.apkPath);
    if (cachedFile.exists && (cachedFile.size ?? 0) > 0) {
      runtimeLogger.info(
        "Update",
        `[checkUpdate] cache hit for version ${remoteVersion}`,
      );
      const result: CheckResult = {
        hasUpdate: true,
        name: release.name,
        body: release.body,
        remoteVersion,
        isCached: true,
      };
      await setCachedCheck(result);
      return result;
    }
    runtimeLogger.warn("Update", "[checkUpdate] cache file missing, cleaning");
    await cleanupFiles();
  }

  runtimeLogger.info("Update", `[checkUpdate] new version available: ${remoteVersion}`);
  const result: CheckResult = {
    hasUpdate: true,
    name: release.name,
    body: release.body,
    downloadUrl: downloadAsset.browser_download_url,
    remoteVersion,
    isCached: false,
  };
  await setCachedCheck(result);
  return result;
}

let currentDownloadTask: FileSystem.DownloadTask | null = null;

export function cancelDownload(): void {
  if (currentDownloadTask) {
    try {
      currentDownloadTask.cancel();
    } catch {
      // ignore
    }
    currentDownloadTask = null;
  }
}

export async function downloadUpdate(
  url: string,
  onProgress: (percent: number, statusText: string) => void,
): Promise<string> {
  ensureDir(updateDir);

  if (updateDir.exists) {
    try {
      updateDir.delete();
    } catch {
      // ignore
    }
  }
  ensureDir(updateDir);

  runtimeLogger.info("Update", "[downloadUpdate] start");
  onProgress(0, "准备下载...");

  const task = FileSystem.File.createDownloadTask(url, dlFile, {
    onProgress: ({ bytesWritten, totalBytes }) => {
      if (totalBytes <= 0) return;
      const pct = Math.round((bytesWritten / totalBytes) * 100);
      if (pct >= 100) {
        onProgress(100, "下载完成");
      } else if (pct > 0) {
        onProgress(pct, `下载中 ${String(pct)}%`);
      }
    },
  });

  currentDownloadTask = task;

  try {
    const result = await task.downloadAsync();
    currentDownloadTask = null;
    if (!result) {
      throw new Error("下载被取消");
    }
    runtimeLogger.info("Update", `[downloadUpdate] done, size=${String(dlFile.size)}`);
    return result.uri;
  } catch (err) {
    currentDownloadTask = null;
    runtimeLogger.error("Update", "[downloadUpdate] failed", err);
    throw err;
  }
}

export async function extractApkIfNeeded(downloadedPath: string): Promise<string> {
  if (downloadedPath.toLowerCase().endsWith(".apk")) {
    runtimeLogger.info("Update", "[extractApkIfNeeded] already APK, skip extract");
    return downloadedPath;
  }

  runtimeLogger.info("Update", "[extractApkIfNeeded] extracting zip");

  const fflate = await import("fflate");

  const zipFileObj = new FileSystem.File(downloadedPath);
  const bytes = zipFileObj.bytesSync();

  const unzipped = fflate.unzipSync(bytes);

  ensureDir(extractDir);

  let apkPath = "";
  let apkSize = 0;

  for (const [filename, data] of Object.entries(unzipped)) {
    const file = new FileSystem.File(extractDir, filename);

    const parentDir = file.parentDirectory;
    if (parentDir.uri !== extractDir.uri) {
      ensureDir(parentDir);
    }

    file.write(data as Uint8Array);

    if (filename.toLowerCase().endsWith(".apk")) {
      apkPath = file.uri;
      apkSize = file.size ?? 0;
      runtimeLogger.info(
        "Update",
        `[extractApkIfNeeded] found APK: ${filename} (${String(apkSize)} bytes)`,
      );
    }
  }

  if (!apkPath) {
    runtimeLogger.error("Update", "[extractApkIfNeeded] no APK found in zip");
    throw new Error("安装包不存在");
  }

  if (apkSize < 1024 * 1024) {
    runtimeLogger.error(
      "Update",
      `[extractApkIfNeeded] APK too small: ${String(apkSize)} bytes`,
    );
    throw new Error("APK 文件损坏");
  }

  return apkPath;
}

async function getContentUri(apkPath: string): Promise<string> {
  try {
    const apkFile = new FileSystem.File(apkPath);
    const directUri = apkFile.contentUri;
    if (directUri && directUri.startsWith("content://")) {
      runtimeLogger.info("Update", `[getContentUri] new API success: ${directUri}`);
      return directUri;
    }
  } catch (err) {
    runtimeLogger.warn("Update", "[getContentUri] new API failed, try legacy", err);
  }

  try {
    const legacy = await import("expo-file-system/legacy");
    const legacyUri = await legacy.getContentUriAsync(apkPath);
    if (legacyUri) {
      runtimeLogger.info("Update", `[getContentUri] legacy API success: ${legacyUri}`);
      return legacyUri;
    }
  } catch (err) {
    runtimeLogger.error("Update", "[getContentUri] legacy API also failed", err);
  }

  throw new Error("无法获取文件访问 URI，请检查应用配置");
}

export async function installApk(apkPath: string): Promise<void> {
  if (Platform.OS !== "android") {
    throw new Error("仅支持 Android");
  }

  runtimeLogger.info("Update", "[installApk] start");

  const apkFile = new FileSystem.File(apkPath);
  if (!apkFile.exists) {
    runtimeLogger.error("Update", "[installApk] APK file not found");
    throw new Error("APK 文件不存在");
  }

  const fileSize = apkFile.size ?? 0;
  if (fileSize < 1024 * 1024) {
    runtimeLogger.error(
      "Update",
      `[installApk] APK too small: ${String(fileSize)} bytes`,
    );
    throw new Error("APK 文件损坏");
  }

  const contentUri = await getContentUri(apkPath);
  runtimeLogger.info("Update", `[installApk] contentUri=${contentUri}`);

  const FLAG_GRANT_READ_URI_PERMISSION = 1;
  const FLAG_ACTIVITY_NEW_TASK = 268435456;

  try {
    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: contentUri,
      type: "application/vnd.android.package-archive",
      flags: FLAG_GRANT_READ_URI_PERMISSION | FLAG_ACTIVITY_NEW_TASK,
      extra: {
        "android.intent.extra.NOT_UNKNOWN_SOURCE": true,
        "android.intent.extra.RETURN_RESULT": true,
      },
    });
    runtimeLogger.info("Update", "[installApk] installer launched");
  } catch (err) {
    runtimeLogger.error("Update", "[installApk] failed to launch installer", err);
    throw new Error("无法打开安装程序，请检查是否已授予安装未知应用权限");
  }
}

export async function openInstallPermissionSettings(): Promise<void> {
  if (Platform.OS !== "android") return;

  const packageName = getPackageName();

  try {
    await IntentLauncher.startActivityAsync(
      "android.settings.MANAGE_UNKNOWN_APP_SOURCES",
      { data: `package:${packageName}` },
    );
    runtimeLogger.info("Update", "[openInstallPermissionSettings] opened");
  } catch {
    runtimeLogger.warn(
      "Update",
      "[openInstallPermissionSettings] MANAGE_UNKNOWN_APP_SOURCES failed, try app details",
    );
    try {
      await IntentLauncher.startActivityAsync(
        "android.settings.APPLICATION_DETAILS_SETTINGS",
        { data: `package:${packageName}` },
      );
    } catch (err) {
      runtimeLogger.error(
        "Update",
        "[openInstallPermissionSettings] both failed",
        err,
      );
      throw new Error("请手动前往设置 → 应用 → 允许安装未知应用");
    }
  }
}

export async function cacheApk(
  apkPath: string,
  version: string,
): Promise<void> {
  if (!version || !apkPath) return;

  try {
    const file = new FileSystem.File(apkPath);
    const info: CachedApkInfo = {
      version,
      apkPath,
      size: file.size ?? 0,
    };
    await AsyncStorage.setItem(CACHED_APK_KEY, JSON.stringify(info));
    runtimeLogger.info(
      "Update",
      `[cacheApk] cached version=${version} path=${apkPath}`,
    );
  } catch (err) {
    runtimeLogger.warn("Update", "[cacheApk] failed", err);
  }
}

async function getCachedApk(): Promise<CachedApkInfo | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHED_APK_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedApkInfo;

    const file = new FileSystem.File(data.apkPath);
    if (!file.exists || (file.size ?? 0) === 0) {
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

export async function cleanupFiles(): Promise<void> {
  try {
    if (updateDir.exists) {
      updateDir.delete();
    }
    await AsyncStorage.removeItem(CACHED_APK_KEY);
    runtimeLogger.info("Update", "[cleanupFiles] done");
  } catch (err) {
    runtimeLogger.warn("Update", "[cleanupFiles] failed", err);
  }
}
