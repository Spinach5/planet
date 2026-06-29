import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
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

const CACHED_APK_KEY = "cached_apk";

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

// ============================================================
// Path helpers
// ============================================================

const updateDir = new FileSystem.Directory(FileSystem.Paths.cache, "update");
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

/** Parse "X.Y.Z" into a comparable number */
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
// Public API
// ============================================================

export async function checkUpdate(): Promise<CheckResult> {
  runtimeLogger.info("Update", "开始检查更新...");

  const cached = await getCachedApk();
  const localVersion = getLocalVersion();

  let remoteData: GiteeRelease;
  try {
    const resp = await fetch(RELEASES_URL);
    if (!resp.ok) {
      runtimeLogger.error("Update", `Gitee API 返回非 200: ${String(resp.status)}`);
      throw new Error(`服务器返回 ${String(resp.status)}`);
    }
    remoteData = (await resp.json()) as GiteeRelease;
  } catch (err) {
    runtimeLogger.error("Update", "获取 Release 信息失败", err);
    throw err;
  }

  const remoteRaw = remoteData.tag_name;
  const remoteVersion = normalizeVersion(remoteRaw);
  const localNorm = normalizeVersion(localVersion);

  runtimeLogger.info(
    "Update",
    `版本比较: 本地=${localVersion} (${localNorm}) vs 远程=${remoteRaw} (${remoteVersion})`,
  );

  const remoteCode = versionToCode(remoteVersion);
  const localCode = versionToCode(localNorm);

  if (remoteCode <= localCode) {
    runtimeLogger.info("Update", "已是最新版本");
    return { hasUpdate: false };
  }

  // Find zip asset (non-archive zip)
  const zipAsset = remoteData.assets.find(
    (a) => a.name.endsWith(".zip") && !a.name.includes("archive"),
  );
  if (!zipAsset) {
    runtimeLogger.error("Update", "Release 中未找到 zip 下载文件");
    throw new Error("未找到下载文件");
  }

  // If we already have this version cached, skip download
  if (cached && cached.version === remoteVersion) {
    runtimeLogger.info("Update", `版本 ${remoteVersion} 已有缓存 APK，直接安装`);
    return {
      hasUpdate: true,
      name: remoteData.name,
      body: remoteData.body,
      remoteVersion,
    };
  }

  runtimeLogger.info("Update", `发现新版本: ${remoteVersion}`);
  return {
    hasUpdate: true,
    name: remoteData.name,
    body: remoteData.body,
    zipUrl: zipAsset.browser_download_url,
    remoteVersion,
  };
}

// ============================================================
// Download with progress + resume support
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
      const pct = totalBytes > 0 ? Math.round((bytesWritten / totalBytes) * 100) : 0;
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
      // Paused — won't happen unless we explicitly pause
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
// Extract APK from zip
// ============================================================

export async function extractApk(zipPath: string): Promise<string> {
  runtimeLogger.info("Update", `开始解压: ${zipPath}`);

  // Dynamic import fflate
  const fflate = await import("fflate");

  // Read zip file as Uint8Array
  const zipFileObj = new FileSystem.File(zipPath);
  const bytes = zipFileObj.bytesSync();

  // Unzip in memory
  const unzipped = fflate.unzipSync(bytes);

  // Ensure extract directory exists
  ensureDir(extractDir);

  let apkPath = "";

  for (const [filename, data] of Object.entries(unzipped)) {
    const apkFile = new FileSystem.File(extractDir, filename);

    // Ensure parent directory exists for nested paths
    const parentDir = apkFile.parentDirectory;
    if (parentDir.uri !== extractDir.uri) {
      ensureDir(parentDir);
    }

    // Write extracted file
    apkFile.write(data as Uint8Array);

    if (filename.toLowerCase().endsWith(".apk")) {
      apkPath = apkFile.uri;
      runtimeLogger.info("Update", `找到 APK: ${filename} (${String(apkFile.size)} bytes)`);
    }
  }

  if (!apkPath) {
    runtimeLogger.error("Update", "zip 中未找到 .apk 文件");
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
// APK cache
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
// Install
// ============================================================

export async function installApk(apkPath: string): Promise<void> {
  runtimeLogger.info("Update", `调起安装: ${apkPath}`);

  if (Platform.OS !== "android") {
    throw new Error("仅支持 Android 安装");
  }

  try {
    const apkFile = new FileSystem.File(apkPath);
    const contentUri = apkFile.contentUri;

    await IntentLauncher.startActivityAsync(
      "android.intent.action.VIEW",
      {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        type: "application/vnd.android.package-archive",
      },
    );
    runtimeLogger.info("Update", "安装器已调起");
  } catch (err) {
    runtimeLogger.error("Update", "调起安装器失败", err);
    throw new Error("无法打开安装程序，请检查系统设置");
  }
}

// ============================================================
// Cleanup
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
