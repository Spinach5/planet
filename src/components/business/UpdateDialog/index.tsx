import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcon } from "@/components/base/MaterialIcon";
import { useTheme } from "@/hooks/use-theme";
import type { UpdateStep } from "@/hooks/useAppUpdate";
import type { CheckResult } from "@/service/update";

interface UpdateDialogProps {
  step: UpdateStep;
  updateInfo: CheckResult | null;
  downloadProgress: number;
  downloadStatus: string;
  errorMessage: string;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onOpenPermissionSettings: () => void;
}

export function UpdateDialog({
  step,
  updateInfo,
  downloadProgress,
  downloadStatus,
  errorMessage,
  onConfirm,
  onCancel,
  onRetry,
  onOpenPermissionSettings,
}: UpdateDialogProps) {
  const theme = useTheme();

  const isPermissionError =
    errorMessage.includes("权限") ||
    errorMessage.includes("permission") ||
    errorMessage.includes("Permission");

  const visible =
    step === "hasUpdate" ||
    step === "downloading" ||
    step === "extracting" ||
    step === "installing" ||
    step === "error";

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={[s.box, { backgroundColor: theme.surface }]}>
          {step === "hasUpdate" && (
            <>
              <Text style={[s.title, { color: theme.text }]}>
                发现新版本 v{updateInfo?.remoteVersion ?? ""}
              </Text>
              {updateInfo?.name ? (
                <Text style={[s.subtitle, { color: theme.text }]}>
                  {updateInfo.name}
                </Text>
              ) : null}
              {updateInfo?.body ? (
                <Text
                  style={[s.body, { color: theme.textSecondary }]}
                  numberOfLines={8}
                >
                  {updateInfo.body}
                </Text>
              ) : null}
              {updateInfo?.isCached ? (
                <View style={s.cachedBadge}>
                  <MaterialIcon name="check-circle" size={14} color="#52c41a" />
                  <Text style={s.cachedText}>已缓存，点击直接安装</Text>
                </View>
              ) : null}
              <View style={s.btns}>
                <TouchableOpacity style={s.btn} onPress={onCancel}>
                  <Text style={[s.btnText, { color: theme.textSecondary }]}>
                    稍后
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.btn, s.btnPrimary]}
                  onPress={onConfirm}
                >
                  <Text style={s.btnPrimaryText}>立即更新</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {(step === "downloading" ||
            step === "extracting" ||
            step === "installing") && (
            <>
              <Text style={[s.title, { color: theme.text }]}>正在更新</Text>
              <Text style={[s.status, { color: theme.textSecondary }]}>
                {downloadStatus}
              </Text>
              <View style={s.progressBg}>
                <View
                  style={[
                    s.progressFill,
                    {
                      width: `${String(
                        step === "downloading" ? downloadProgress : 100,
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[s.progressText, { color: theme.textSecondary }]}>
                {step === "downloading"
                  ? `${String(downloadProgress)}%`
                  : ""}
              </Text>
              {step === "downloading" ? (
                <TouchableOpacity style={s.btn} onPress={onCancel}>
                  <Text style={{ fontSize: 16, color: "#ff4d4f", fontWeight: "600" }}>
                    取消下载
                  </Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}

          {step === "error" && (
            <>
              <View style={s.errorIcon}>
                <MaterialIcon name="error-outline" size={40} color="#ff4d4f" />
              </View>
              <Text style={[s.title, { color: theme.text }]}>更新失败</Text>
              <Text style={[s.status, { color: theme.textSecondary }]}>
                {errorMessage}
              </Text>
              <View style={s.btns}>
                <TouchableOpacity style={s.btn} onPress={onCancel}>
                  <Text style={[s.btnText, { color: theme.textSecondary }]}>
                    取消
                  </Text>
                </TouchableOpacity>
                {isPermissionError ? (
                  <TouchableOpacity
                    style={[s.btn, s.btnPrimary]}
                    onPress={onOpenPermissionSettings}
                  >
                    <Text style={s.btnPrimaryText}>去设置</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[s.btn, s.btnPrimary]}
                    onPress={onRetry}
                  >
                    <Text style={s.btnPrimaryText}>重试</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 40,
  },
  box: {
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 8,
    textAlign: "center",
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    maxHeight: 200,
    textAlign: "center",
  },
  cachedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 16,
  },
  cachedText: {
    fontSize: 13,
    color: "#52c41a",
  },
  status: {
    fontSize: 15,
    marginBottom: 20,
    textAlign: "center",
  },
  progressBg: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 8,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#47a5fd",
    borderRadius: 4,
  },
  progressText: {
    textAlign: "center",
    fontSize: 14,
    marginBottom: 16,
  },
  errorIcon: {
    alignItems: "center",
    marginBottom: 12,
  },
  btns: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  btnText: {
    fontSize: 16,
  },
  btnPrimary: {
    backgroundColor: "#47a5fd",
    borderRadius: 8,
  },
  btnPrimaryText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
