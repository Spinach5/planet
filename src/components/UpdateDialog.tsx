import { useTheme } from "@/hooks/use-theme";
import type { UpdateStep } from "@/hooks/useAppUpdate";
import type { CheckResult } from "@/service/update";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ============================================================
// Props
// ============================================================

interface UpdateDialogProps {
  visible: boolean;
  step: UpdateStep;
  updateInfo: CheckResult | null;
  downloadProgress: number;
  downloadStatus: string;
  errorMessage: string;
  onStartUpdate: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onOpenPermissionSettings: () => void;
}

// ============================================================
// Component
// ============================================================

export default function UpdateDialog({
  visible,
  step,
  updateInfo,
  downloadProgress,
  downloadStatus,
  errorMessage,
  onStartUpdate,
  onCancel,
  onRetry,
  onOpenPermissionSettings,
}: UpdateDialogProps) {
  const theme = useTheme();

  if (!visible) return null;

  // ---- 下载/解压进度弹窗 ------------------------------------------------

  if (step === "downloading" || step === "extracting") {
    return (
      <Modal visible transparent animationType="fade">
        <View style={s.overlay}>
          <View style={[s.box, { backgroundColor: theme.surface }]}>
            <Text style={[s.title, { color: theme.text }]}>
              正在下载更新
            </Text>
            <Text style={[s.message, { color: theme.textSecondary }]}>
              {downloadStatus}
            </Text>

            {/* Progress bar */}
            <View style={s.progressBg}>
              <View
                style={[s.progressFill, { width: `${String(downloadProgress)}%` } as never]}
              />
            </View>

            <Text
              style={{
                textAlign: "center",
                fontSize: 14,
                color: theme.textSecondary,
                marginBottom: 16,
              }}
            >
              {String(downloadProgress)}%
            </Text>

            <TouchableOpacity style={s.btn} onPress={onCancel}>
              <Text style={{ fontSize: 16, color: "#ff4d4f", fontWeight: "600" }}>
                取消
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // ---- 错误弹窗 ----------------------------------------------------------

  if (step === "error") {
    return (
      <Modal visible transparent animationType="fade">
        <View style={s.overlay}>
          <View style={[s.box, { backgroundColor: theme.surface }]}>
            <Text style={[s.title, { color: theme.text }]}>更新失败</Text>
            <Text style={[s.message, { color: theme.textSecondary }]}>
              {errorMessage}
            </Text>

            <View style={s.btnRow}>
              <TouchableOpacity style={s.btn} onPress={onCancel}>
                <Text style={{ fontSize: 16, color: theme.text }}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btn} onPress={onRetry}>
                <Text
                  style={{ fontSize: 16, color: "#47a5fd", fontWeight: "600" }}
                >
                  重试
                </Text>
              </TouchableOpacity>
            </View>

            {/* Permission-related errors: show settings shortcut */}
            <TouchableOpacity
              style={[s.permissionBtn]}
              onPress={onOpenPermissionSettings}
            >
              <Text style={{ fontSize: 14, color: theme.textSecondary }}>
                前往设置开启「安装未知应用」权限
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // ---- 更新确认弹窗 (hasUpdate) ------------------------------------------

  if (step === "hasUpdate") {
    return (
      <Modal visible transparent animationType="fade">
        <View style={s.overlay}>
          <View style={[s.box, { backgroundColor: theme.surface }]}>
            <Text style={[s.title, { color: theme.text }]}>
              发现新版本 v{updateInfo?.remoteVersion ?? ""}
            </Text>

            <Text style={[s.message, { color: theme.textSecondary }]}>
              {updateInfo?.name ?? ""}
            </Text>
            {updateInfo?.body ? (
              <Text
                style={[s.body, { color: theme.textSecondary }]}
                numberOfLines={10}
              >
                {updateInfo.body}
              </Text>
            ) : null}

            <View style={s.btnRow}>
              <TouchableOpacity style={s.btn} onPress={onCancel}>
                <Text style={{ fontSize: 16, color: theme.text }}>稍后</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btn} onPress={onStartUpdate}>
                <Text
                  style={{ fontSize: 16, color: "#47a5fd", fontWeight: "600" }}
                >
                  立即更新
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // ---- 安装中（极短时间，显示轻量提示） ----------------------------------

  if (step === "installing") {
    return (
      <Modal visible transparent animationType="fade">
        <View style={s.overlay}>
          <View style={[s.box, { backgroundColor: theme.surface }]}>
            <Text style={[s.title, { color: theme.text }]}>
              正在安装
            </Text>
            <Text style={[s.message, { color: theme.textSecondary }]}>
              请在弹出的安装界面中确认安装
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return null;
}

// ============================================================
// Styles
// ============================================================

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
  message: {
    fontSize: 15,
    marginBottom: 20,
    textAlign: "center",
  },
  body: {
    fontSize: 13,
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20,
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
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  permissionBtn: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
});
