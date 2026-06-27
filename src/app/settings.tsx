import { HeadStatus } from "@/components/HeadStatus";
import { Loading } from "@/components/Loading";
import { MaterialIcon } from "@/components/MaterialIcon";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import type { ThemeMode } from "@/hooks/use-theme-settings";
import { useThemeSettings } from "@/hooks/use-theme-settings";
import userManager from "@/service/userInfo";
import encryptPassword from "@/utils/hbut/loginEncrypt";
import { serverGet, serverPost } from "@/utils/serverRequest";
import { runtimeLogger } from "@/utils/runtimeLogger";
import { useToast } from "@/utils/toast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STORAGE_KEY_FORCE = "settings_force_update";
const STORAGE_KEY_FEATURES = "settings_feature_toggles";

interface FeatureToggles {
  expand: boolean;
  club: boolean;
  food: boolean;
  book: boolean;
  other: boolean;
}
const DEFAULT_FEATURES: FeatureToggles = {
  expand: false,
  club: false,
  food: false,
  book: false,
  other: false,
};
function isServerConnected(): boolean {
  return !!userManager.getServerToken();
}

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(2)} KB`;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

async function getFeatures(): Promise<FeatureToggles> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_FEATURES);
    if (raw)
      return {
        ...DEFAULT_FEATURES,
        ...(JSON.parse(raw) as Partial<FeatureToggles>),
      };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_FEATURES };
}

function SettingRow({
  label,
  desc,
  value,
  onToggle,
  disabled,
}: {
  label: string;
  desc: string;
  value: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[s.row, disabled && s.rowDisabled]}
      onPress={disabled ? undefined : onToggle}
    >
      <View style={s.rowLeft}>
        <ThemedText style={[s.rowLabel, disabled && s.labelDisabled]}>
          {label}
        </ThemedText>
        <ThemedText style={s.rowDesc} themeColor="textSecondary">
          {desc}
        </ThemedText>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ true: "#47a5fd" }}
      />
    </TouchableOpacity>
  );
}

export default function SettingsPage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { themeMode, setThemeMode } = useThemeSettings();
  const { showToast } = useToast();
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [features, setFeatures] = useState<FeatureToggles>(DEFAULT_FEATURES);
  const [expandLoading, setExpandLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [cacheSize, setCacheSize] = useState("计算中...");

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY_FORCE).then((v) =>
      setForceUpdate(v === "true"),
    );
    void getFeatures().then(setFeatures);
    void (async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        let totalBytes = 0;
        for (const key of keys) {
          const val = await AsyncStorage.getItem(key);
          if (val)
            totalBytes += val.length + key.length;
        }
        setCacheSize(formatBytes(totalBytes));
      } catch {
        setCacheSize("计算失败");
      }
    })();
  }, []);

  const doClearCache = useCallback(async () => {
    setShowClearConfirm(false);
    const ud = await userManager.getFromCache();
    // Clear in-memory logs first, otherwise next log write restores them from memory
    await runtimeLogger.clear();
    await AsyncStorage.clear();
    if (ud) await userManager.saveToCache();
    await AsyncStorage.setItem(STORAGE_KEY_FORCE, String(forceUpdate));
    await AsyncStorage.setItem(STORAGE_KEY_FEATURES, JSON.stringify(features));
    setCacheSize("0.00 GB");
    showToast({ message: "缓存已清除", type: "success" });
  }, [showToast, forceUpdate, features]);

  const updateFeature = useCallback(
    (key: keyof FeatureToggles, value: boolean) => {
      setFeatures((prev) => {
        const next =
          key === "expand"
            ? value
              ? {
                  expand: true,
                  club: prev.club,
                  food: prev.food,
                  book: prev.book,
                  other: prev.other,
                }
              : DEFAULT_FEATURES
            : { ...prev, [key]: value };
        void AsyncStorage.setItem(STORAGE_KEY_FEATURES, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const handleForceUpdate = useCallback(async () => {
    const nv = !forceUpdate;
    setForceUpdate(nv);
    await AsyncStorage.setItem(STORAGE_KEY_FORCE, String(nv));
  }, [forceUpdate]);

  const handleClearCache = useCallback(() => {
    setShowClearConfirm(true);
  }, []);

  const handleExpandToggle = useCallback(async () => {
    const target = !features.expand;

    // 关闭：直接更新
    if (!target) {
      updateFeature("expand", false);
      return;
    }

    // 本次会话已连接过服务器，直接开启
    if (isServerConnected()) {
      updateFeature("expand", true);
      return;
    }

    // 前置校验
    const stuId = userManager.stuId;
    if (!stuId || !userManager.password) {
      showToast({ message: "请先登录教务系统", type: "warning" });
      return;
    }

    let ep = userManager.getEncryptedPassword();
    if (!ep) {
      try {
        ep = encryptPassword(userManager.password);
        userManager.setEncryptedPassword(ep);
      } catch {
        showToast({ message: "密码加密失败", type: "error" });
        return;
      }
    }

    const sid = userManager.getSchoolId() || "hbut";
    setExpandLoading(true);

    try {
      // 1. 检查用户是否已注册
      const checkRes = await serverGet<{ exists: boolean }>(
        "/api/v1/auth/check-user",
        { stuId, schoolId: sid },
      );

      if (checkRes.success && checkRes.data?.exists) {
        // 已注册，调用幂等 register 获取 token
        const regRes = await serverPost<{ token: string }>(
          "/api/v1/auth/register",
          { stuId, password: ep, schoolId: sid, nickName: userManager.realName },
        );
        if (regRes.success && regRes.data?.token) {
          userManager.setServerToken(regRes.data.token);
          if (!userManager.getSchoolId()) userManager.setSchoolId(sid);
        }
        // token saved, isServerConnected() returns true now
        updateFeature("expand", true);
        return;
      }

      // 2. 未注册，隐藏 loading 后弹窗确认
      setExpandLoading(false);
      const confirmed = await new Promise<boolean>((r) =>
        Alert.alert(
          "用户注册",
          "使用拓展功能需要将你的个人信息上传到服务器，是否同意？",
          [
            { text: "取消", onPress: () => r(false) },
            { text: "同意", onPress: () => r(true) },
          ],
        ),
      );
      if (!confirmed) return;

      // 3. 同意后，显示 loading 并注册
      setExpandLoading(true);
      const regRes = await serverPost<{ token: string }>(
        "/api/v1/auth/register",
        { stuId, password: ep, schoolId: sid, nickName: userManager.realName },
      );
      if (regRes.success && regRes.data?.token) {
        userManager.setServerToken(regRes.data.token);
        if (!userManager.getSchoolId()) userManager.setSchoolId(sid);
        // token saved, isServerConnected() returns true now
        updateFeature("expand", true);
        showToast({ message: "注册成功", type: "success" });
      } else {
        showToast({
          message: regRes.message ?? "注册失败，请稍后重试",
          type: "error",
        });
      }
    } catch (e) {
      showToast({
        message: e instanceof Error ? e.message : "网络连接失败，请稍后重试",
        type: "error",
      });
    } finally {
      setExpandLoading(false);
    }
  }, [features.expand, updateFeature, showToast]);

  const isDark = theme.background === "#000000";

  const getThemeModeLabel = (mode: ThemeMode): string => {
    if (mode === "system") return "跟随系统";
    if (mode === "dark") return "深色";
    return "浅色";
  };

  const handleSelectTheme = (mode: ThemeMode) => {
    setShowThemeModal(false);
    void setThemeMode(mode);
  };

  return (
    <ThemedView style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={
          isDark
            ? ["rgb(26,29,46)", "rgb(35,39,64)", "rgb(26,29,46)"]
            : ["#47a5fd", "#cce5ff", "#f2f5f9"]
        }
        locations={[0, 0.28, 1]}
        style={[s.gradient, { paddingTop: insets.top + 8 }]}
      >
        <ScrollView
          style={s.scrollView}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
            </TouchableOpacity>
            <HeadStatus text="设置" />
          </View>
          <View style={[s.group, { backgroundColor: theme.surface }]}>
            <TouchableOpacity
              style={s.row}
              onPress={() => setShowThemeModal(true)}
            >
              <View style={s.rowLeft}>
                <ThemedText style={s.rowLabel}>外观</ThemedText>
                <ThemedText style={s.rowDesc} themeColor="textSecondary">
                  {getThemeModeLabel(themeMode)}
                </ThemedText>
              </View>
              <MaterialIcon
                name="chevron-right"
                size={16}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
            <View
              style={[s.divider, { backgroundColor: theme.backgroundElement }]}
            />
            <SettingRow
              label="数据更新"
              desc="开启后每次启动强制刷新数据"
              value={forceUpdate}
              onToggle={() => {
                void handleForceUpdate();
              }}
            />
          </View>
          <View
            style={[s.group, { backgroundColor: theme.surface, marginTop: 12 }]}
          >
            <View style={s.row}>
              <View style={s.rowLeft}>
                <ThemedText style={s.rowLabel}>拓展</ThemedText>
                <ThemedText style={s.rowDesc} themeColor="textSecondary">
                  开启后可在首页显示更多功能入口
                </ThemedText>
              </View>
              <Switch
                value={features.expand}
                disabled={expandLoading}
                onValueChange={() => {
                  void handleExpandToggle();
                }}
                trackColor={{ true: "#47a5fd" }}
              />
            </View>
            <View
              style={[s.divider, { backgroundColor: theme.backgroundElement }]}
            />
            <SettingRow
              label="社团"
              desc="首页显示社团入口"
              value={features.club}
              onToggle={() => updateFeature("club", !features.club)}
              disabled={!features.expand}
            />
            <View
              style={[s.divider, { backgroundColor: theme.backgroundElement }]}
            />
            <SettingRow
              label="美食"
              desc="首页显示美食入口"
              value={features.food}
              onToggle={() => updateFeature("food", !features.food)}
              disabled={!features.expand}
            />
            <View
              style={[s.divider, { backgroundColor: theme.backgroundElement }]}
            />
            <SettingRow
              label="书籍"
              desc="首页显示书籍入口"
              value={features.book}
              onToggle={() => updateFeature("book", !features.book)}
              disabled={!features.expand}
            />
            <View
              style={[s.divider, { backgroundColor: theme.backgroundElement }]}
            />
            <SettingRow
              label="其他"
              desc="首页显示其他入口"
              value={features.other}
              onToggle={() => updateFeature("other", !features.other)}
              disabled={!features.expand}
            />
          </View>
          <View style={[s.cacheSizeRow, { backgroundColor: theme.surface }]}>
            <ThemedText style={s.cacheSizeLabel} themeColor="textSecondary">
              缓存占用空间
            </ThemedText>
            <ThemedText style={s.cacheSizeValue}>{cacheSize}</ThemedText>
          </View>
          <TouchableOpacity
            style={[s.clearBtn, { backgroundColor: theme.surface }]}
            onPress={handleClearCache}
          >
            <ThemedText style={s.clearText} themeColor="error">
              清除缓存
            </ThemedText>
            <MaterialIcon name="chevron-right" size={16} color="#ff4d4f" />
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>

      {/* Clear Cache Confirm Modal */}
      <Modal visible={showClearConfirm} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, { backgroundColor: theme.surface }]}>
            <Text style={[s.modalTitle, { color: theme.text }]}>提示</Text>
            <Text style={[s.modalMsg, { color: theme.textSecondary }]}>
              是否清除所有缓存？用户信息将会保留。
            </Text>
            <View style={s.modalBtns}>
              <TouchableOpacity
                style={s.modalBtn}
                onPress={() => setShowClearConfirm(false)}
              >
                <Text style={{ fontSize: 16, color: theme.text }}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalBtn}
                onPress={() => {
                  void doClearCache();
                }}
              >
                <Text
                  style={{ fontSize: 16, color: "#ff4d4f", fontWeight: "600" }}
                >
                  确定
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Theme Selection Modal */}
      <Modal visible={showThemeModal} transparent animationType="fade">
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowThemeModal(false)}
        >
          <View style={[s.modalBox, { backgroundColor: theme.surface }]}>
            <Text style={[s.modalTitle, { color: theme.text }]}>外观</Text>
            {(["system", "light", "dark"] as ThemeMode[]).map((mode) => {
              const selected = themeMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    s.themeOption,
                    selected && { backgroundColor: theme.backgroundSelected },
                  ]}
                  onPress={() => handleSelectTheme(mode)}
                >
                  <MaterialIcon
                    name={selected ? "radiobox-marked" : "radiobox-blank"}
                    size={22}
                    color={selected ? "#47a5fd" : theme.textSecondary}
                  />
                  <Text style={[s.themeOptionText, { color: theme.text }]}>
                    {getThemeModeLabel(mode)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Server connecting loading overlay — matches Taro showLoading */}
      {expandLoading ? <Loading overlay text="正在连接远程服务器..." /> : null}
    </ThemedView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollView: { flex: 1, paddingHorizontal: 8 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  group: {
    marginHorizontal: 12,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowDisabled: { opacity: 0.4 },
  rowLeft: { flex: 1, marginRight: 12 },
  rowLabel: { fontSize: 15, fontWeight: "500" },
  labelDisabled: { opacity: 0.5 },
  rowDesc: { fontSize: 12, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  cacheSizeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 12,
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cacheSizeLabel: { fontSize: 15 },
  cacheSizeValue: { fontSize: 15, fontWeight: "600", color: "#47a5fd" },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  clearText: { fontSize: 15, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 40,
  },
  modalBox: { borderRadius: 16, padding: 24 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMsg: { fontSize: 15, marginBottom: 20, textAlign: "center" },
  modalBtns: { flexDirection: "row", justifyContent: "space-around" },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 30 },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  themeOptionText: { fontSize: 16 },
});
