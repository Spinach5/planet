import { useCallback, useRef, useState } from "react";
import {
  cacheApk,
  cancelDownload,
  checkUpdate,
  cleanupFiles,
  downloadUpdate,
  extractApkIfNeeded,
  getCachedApkPath,
  installApk,
  openInstallPermissionSettings,
  type CheckResult,
} from "@/service/update";
import { runtimeLogger } from "@/utils/runtimeLogger";

export type UpdateStep =
  | "idle"
  | "checking"
  | "hasUpdate"
  | "downloading"
  | "extracting"
  | "installing"
  | "error";

export function useAppUpdate() {
  const [step, setStep] = useState<UpdateStep>("idle");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState("");
  const [updateInfo, setUpdateInfo] = useState<CheckResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const updateInfoRef = useRef<CheckResult | null>(null);

  const handleCheck = useCallback(async (force = false) => {
    setStep("checking");
    setErrorMessage("");

    try {
      const result = await checkUpdate(force);
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
      runtimeLogger.error("Update", "[useAppUpdate] check failed", err);
      setErrorMessage(msg);
      setStep("error");
      return null;
    }
  }, []);

  const handleStartUpdate = useCallback(async () => {
    const info = updateInfoRef.current;
    if (!info?.hasUpdate) return;

    if (info.isCached) {
      const cachedPath = await getCachedApkPath();
      if (cachedPath) {
        setStep("installing");
        setDownloadStatus("正在调起安装器...");
        try {
          await installApk(cachedPath);
          return;
        } catch (installErr) {
          runtimeLogger.warn(
            "Update",
            "[useAppUpdate] cached install failed, fall back to download",
            installErr,
          );
          await cleanupFiles();
          if (!info.downloadUrl) {
            const msg =
              installErr instanceof Error
                ? installErr.message
                : "安装失败";
            setErrorMessage(msg);
            setStep("error");
            return;
          }
        }
      }
    }

    if (!info.downloadUrl) {
      setErrorMessage("下载地址无效");
      setStep("error");
      return;
    }

    setStep("downloading");
    setDownloadProgress(0);
    setDownloadStatus("准备下载...");

    try {
      const downloadedPath = await downloadUpdate(
        info.downloadUrl,
        (pct, status) => {
          setDownloadProgress(pct);
          setDownloadStatus(status);
        },
      );

      setStep("extracting");
      setDownloadStatus("正在解压安装包...");
      const apkPath = await extractApkIfNeeded(downloadedPath);

      if (info.remoteVersion) {
        await cacheApk(apkPath, info.remoteVersion);
      }

      setStep("installing");
      setDownloadStatus("正在调起安装器...");
      await installApk(apkPath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "更新失败";
      runtimeLogger.error("Update", "[useAppUpdate] update failed", err);

      if (msg.includes("cancel") || msg.includes("取消")) {
        setStep("hasUpdate");
        return;
      }

      setErrorMessage(msg);
      setStep("error");
    }
  }, []);

  const handleCancel = useCallback(() => {
    cancelDownload();
    void cleanupFiles();
    setStep("idle");
    setDownloadProgress(0);
    setDownloadStatus("");
    setErrorMessage("");
  }, []);

  const handleRetry = useCallback(() => {
    void handleCheck(true);
  }, [handleCheck]);

  const handleOpenPermissionSettings = useCallback(() => {
    void openInstallPermissionSettings();
  }, []);

  const handleReset = useCallback(() => {
    setStep("idle");
    setErrorMessage("");
    setDownloadProgress(0);
    setDownloadStatus("");
  }, []);

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
    reset: handleReset,
  };
}
