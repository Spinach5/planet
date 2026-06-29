import { useState, useCallback, useRef } from "react";
import {
  checkUpdate,
  downloadUpdate,
  extractApkIfNeeded,
  installApk,
  cancelDownload,
  cacheApk,
  cleanupFiles,
  getCachedApkPath,
  openInstallPermissionSettings,
  type CheckResult,
} from "@/service/update";
import { runtimeLogger } from "@/utils/runtimeLogger";

// ============================================================
// Types
// ============================================================

export type UpdateStep =
  | "idle"
  | "checking"
  | "hasUpdate"
  | "downloading"
  | "extracting"
  | "installing"
  | "error";

// ============================================================
// Hook
// ============================================================

export function useAppUpdate() {
  const [step, setStep] = useState<UpdateStep>("idle");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState("");
  const [updateInfo, setUpdateInfo] = useState<CheckResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const updateInfoRef = useRef<CheckResult | null>(null);

  // ---- 检查更新 ----------------------------------------------------------

  const handleCheck = useCallback(async () => {
    setStep("checking");
    setErrorMessage("");

    try {
      const result = await checkUpdate();
      updateInfoRef.current = result;
      setUpdateInfo(result);

      if (result.hasUpdate) {
        setStep("hasUpdate");
      } else {
        setStep("idle");
      }
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "检查更新失败";
      setErrorMessage(msg);
      setStep("error");
      runtimeLogger.error("Update", msg, err);
      return null;
    }
  }, []);

  // ---- 开始更新 ----------------------------------------------------------

  const handleStartUpdate = useCallback(async () => {
    const info = updateInfoRef.current;
    if (!info) return;

    // 1. 如果有缓存 APK，先尝试直接安装
    if (!info.zipUrl) {
      const cachedPath = await getCachedApkPath();
      if (cachedPath) {
        setStep("installing");
        try {
          await installApk(cachedPath);
          return; // 安装成功
        } catch {
          // 缓存 APK 安装失败 — 清理并 fallback 到下载
          runtimeLogger.warn(
            "Update",
            "缓存 APK 安装失败，清理后重新下载",
          );
          await cleanupFiles();

          // 如果原始 info 里也没有 zipUrl，无法重试
          if (!info.zipUrl) {
            setErrorMessage("缓存安装失败且无下载地址，请稍后重试");
            setStep("error");
            return;
          }
          // fall through to download
        }
      } else {
        setErrorMessage("下载地址无效");
        setStep("error");
        return;
      }
    }

    if (!info.zipUrl) {
      setErrorMessage("下载地址无效");
      setStep("error");
      return;
    }

    // 2. 下载
    setStep("downloading");
    setDownloadProgress(0);

    try {
      const downloadedPath = await downloadUpdate(
        info.zipUrl,
        (pct, status) => {
          setDownloadProgress(pct);
          setDownloadStatus(status);
        },
      );

      // 3. 解压（如果需要）
      setStep("extracting");
      setDownloadStatus("正在解压...");
      const apkPath = await extractApkIfNeeded(downloadedPath);

      // 4. 安装
      setStep("installing");
      setDownloadStatus("正在调起安装器...");
      await installApk(apkPath);

      // 5. 安装成功后缓存
      if (info.remoteVersion) {
        await cacheApk(apkPath, info.remoteVersion);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "更新失败";

      // 用户主动取消不算错误
      if (msg.includes("cancel") || msg.includes("取消")) {
        setStep("hasUpdate");
        return;
      }

      setErrorMessage(msg);
      setStep("error");
      runtimeLogger.error("Update", msg, err);
    }
  }, []);

  // ---- 取消 --------------------------------------------------------------

  const handleCancel = useCallback(() => {
    cancelDownload();
    void cleanupFiles();
    setStep("idle");
    setDownloadProgress(0);
  }, []);

  // ---- 重试 --------------------------------------------------------------

  const handleRetry = useCallback(() => {
    void handleCheck();
  }, [handleCheck]);

  // ---- 权限设置 ----------------------------------------------------------

  const handleOpenPermissionSettings = useCallback(() => {
    void openInstallPermissionSettings();
  }, []);

  // ============================================================

  return {
    step,
    downloadProgress,
    downloadStatus,
    updateInfo,
    errorMessage,
    checkUpdate: handleCheck,
    startUpdate: handleStartUpdate,
    cancelUpdate: handleCancel,
    retry: handleRetry,
    openPermissionSettings: handleOpenPermissionSettings,
  };
}
