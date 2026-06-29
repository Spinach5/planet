import { HeadStatus } from "@/components/layout/HeadStatus";
import { MaterialIcon } from "@/components/base/MaterialIcon";
import { ThemedText } from "@/components/themed/ThemedText";
import { ThemedView } from "@/components/themed/ThemedView";
import { useTheme } from "@/hooks/use-theme";
import { login } from "@/service/hubt/login";
import { useToast } from "@/utils/toast";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginPage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [studentIdError, setStudentIdError] = useState(false);
  const [modalType, setModalType] = useState<
    "agreement" | "privacy" | "university" | null
  >(null);
  const [loading, setLoading] = useState(false);

  // University list (currently only HBUT)
  const universityList = [{ name: "湖北工业大学", id: "hbut" }];
  const [universityIdx, setUniversityIdx] = useState(0);

  const handleLogin = useCallback(async () => {
    if (!studentId || studentId.length < 6) {
      setStudentIdError(true);
      return;
    }
    if (!password) {
      showToast({ message: "请输入密码", type: "error" });
      return;
    }
    if (!agreed) {
      showToast({ message: "请阅读并同意用户协议和隐私政策", type: "warning" });
      return;
    }
    setLoading(true);
    try {
      const result = await login(studentId, password);
      if (result.success) {
        showToast({ message: result.message, type: "success" });
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        showToast({ message: result.message, type: "error" });
      }
    } catch {
      showToast({ message: "网络请求失败，请稍后重试", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [studentId, password, agreed, showToast]);

  const isDark = theme.background === "#000000";

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={
          isDark
            ? ["rgb(26,29,46)", "rgb(35,39,64)", "rgb(26,29,46)"]
            : ["#47a5fd", "#cce5ff", "#f2f5f9"]
        }
        locations={[0, 0.28, 1]}
        style={[styles.gradient, { paddingTop: insets.top + 8 }]}
      >
        <ScrollView
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
            </TouchableOpacity>
            <HeadStatus text="登录" />
          </View>

          {/* University Picker */}
          <TouchableOpacity
            style={[
              styles.universityPicker,
              { backgroundColor: theme.surface },
            ]}
            onPress={() => setModalType("university")}
          >
            <ThemedText style={styles.universityName}>
              {universityList[universityIdx].name}
            </ThemedText>
            <MaterialIcon
              name="chevron-down"
              size={18}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          <View style={[styles.formCard, { backgroundColor: theme.surface }]}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>学号</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundElement,
                    color: theme.text,
                    borderColor: studentIdError ? "#ff4d4f" : "transparent",
                  },
                ]}
                placeholder="请输入学号"
                placeholderTextColor={theme.textSecondary}
                value={studentId}
                onChangeText={(t) => {
                  setStudentId(t.replace(/\D/g, ""));
                  setStudentIdError(false);
                }}
                keyboardType="numeric"
                maxLength={20}
              />
              {studentIdError ? (
                <Text style={styles.errorText}>学号格式不正确</Text>
              ) : null}
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>密码</ThemedText>
              <View style={styles.pwdRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.pwdInput,
                    {
                      backgroundColor: theme.backgroundElement,
                      color: theme.text,
                      borderColor: "transparent",
                    },
                  ]}
                  placeholder="请输入密码"
                  placeholderTextColor={theme.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialIcon
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.6 }]}
              onPress={() => {
                void handleLogin();
              }}
              disabled={loading}
            >
              <Text style={styles.loginBtnText}>
                {loading ? "登录中..." : "登录"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.agreementRow}
              onPress={() => setAgreed(!agreed)}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={styles.agreementText}>
                我已阅读并同意{" "}
                <Text
                  style={styles.link}
                  onPress={() => setModalType("agreement")}
                >
                  用户协议
                </Text>{" "}
                和{" "}
                <Text
                  style={styles.link}
                  onPress={() => setModalType("privacy")}
                >
                  隐私政策
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
      <Modal visible={modalType !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            {modalType === "university" ? (
              <>
                <Text style={styles.modalTitle}>选择学校</Text>
                <ScrollView style={styles.modalBody}>
                  {universityList.map((uni, idx) => (
                    <TouchableOpacity
                      key={uni.id}
                      style={[
                        styles.uniOption,
                        idx === universityIdx && {
                          backgroundColor: theme.primaryContainer,
                        },
                      ]}
                      onPress={() => {
                        setUniversityIdx(idx);
                        setModalType(null);
                      }}
                    >
                      <ThemedText
                        style={[
                          styles.uniOptionText,
                          idx === universityIdx && {
                            color: theme.primary,
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {uni.name}
                      </ThemedText>
                      {idx === universityIdx ? (
                        <MaterialIcon
                          name="check"
                          size={20}
                          color={theme.primary}
                        />
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setModalType(null)}
                >
                  <Text style={styles.modalCloseText}>取消</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>
                  {modalType === "agreement" ? "用户协议" : "隐私政策"}
                </Text>
                <ScrollView style={styles.modalBody}>
                  <ThemedText style={styles.modalText}>
                    {modalType === "agreement"
                      ? '欢迎使用"Planet课表"校园助手。本应用通过您的教务系统账号代为查询课程、成绩等信息。所有数据缓存在本地，密码加密存储。请妥善保管账号，不得用于违法违规活动。'
                      : "我们重视您的隐私。账号信息仅用于代理登录教务系统，不会上传至第三方服务器。所有数据存储在您的设备本地。密码经过加密处理。您可以随时清除数据。"}
                  </ThemedText>
                </ScrollView>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setModalType(null)}
                >
                  <Text style={styles.modalCloseText}>我知道了</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Loading overlay — blocks all interaction during login */}
      {loading ? (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingBox, { backgroundColor: theme.surface }]}>
            <ActivityIndicator size="large" color="#47a5fd" />
            <Text style={styles.loadingText}>登录中...</Text>
          </View>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollView: { flex: 1, paddingHorizontal: 8 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  formCard: {
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 20,
    padding: 20,
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  pwdRow: { flexDirection: "row", alignItems: "center" },
  pwdInput: { flex: 1 },
  eyeBtn: { position: "absolute", right: 12 },
  errorText: { color: "#ff4d4f", fontSize: 12, marginTop: 4 },
  loginBtn: {
    backgroundColor: "#47a5fd",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  agreementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#47a5fd", borderColor: "#47a5fd" },
  checkmark: { color: "#fff", fontSize: 13, fontWeight: "700", lineHeight: 15 },
  agreementText: { fontSize: 13, color: "#666", flex: 1 },
  link: { color: "#47a5fd" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 30,
  },
  modalContent: { borderRadius: 16, padding: 20, maxHeight: "70%" },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  modalBody: { maxHeight: 300 },
  modalText: { fontSize: 14, lineHeight: 22 },
  modalCloseBtn: {
    backgroundColor: "#47a5fd",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  modalCloseText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  universityPicker: {
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  universityName: { fontSize: 16, fontWeight: "500" },
  uniOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  uniOptionText: { fontSize: 16 },
  loadingOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingBox: {
    borderRadius: 16,
    paddingHorizontal: 40,
    paddingVertical: 30,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
});
