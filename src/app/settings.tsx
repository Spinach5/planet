import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { router, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HeadStatus } from '@/components/HeadStatus';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useThemeSettings } from '@/hooks/use-theme-settings';
import { useToast } from '@/utils/toast';
import userManager from '@/service/userInfo';
import { serverGet, serverPost } from '@/utils/serverRequest';
import encryptPassword from '@/utils/hbut/loginEncrypt';

const STORAGE_KEY_FORCE = 'settings_force_update';
const STORAGE_KEY_FEATURES = 'settings_feature_toggles';

interface FeatureToggles { expand: boolean; club: boolean; food: boolean; book: boolean; other: boolean; }
const DEFAULT_FEATURES: FeatureToggles = { expand: false, club: false, food: false, book: false, other: false };
let serverConnected = false;

async function getFeatures(): Promise<FeatureToggles> {
  try { const raw = await AsyncStorage.getItem(STORAGE_KEY_FEATURES); if (raw) return { ...DEFAULT_FEATURES, ...JSON.parse(raw) as Partial<FeatureToggles> }; } catch { /* ignore */ }
  return { ...DEFAULT_FEATURES };
}

function SettingRow({ label, desc, value, onToggle, disabled }: { label: string; desc: string; value: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity style={[s.row, disabled && s.rowDisabled]} onPress={disabled ? undefined : onToggle}>
      <View style={s.rowLeft}>
        <ThemedText style={[s.rowLabel, disabled && s.labelDisabled]}>{label}</ThemedText>
        <ThemedText style={s.rowDesc} themeColor="textSecondary">{desc}</ThemedText>
      </View>
      <Switch value={value} onValueChange={onToggle} disabled={disabled} trackColor={{ true: '#47a5fd' }} />
    </TouchableOpacity>
  );
}

export default function SettingsPage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { darkMode, toggleDarkMode } = useThemeSettings();
  const { showToast } = useToast();
  const [forceUpdate, setForceUpdate] = useState(false);
  const [features, setFeatures] = useState<FeatureToggles>(DEFAULT_FEATURES);
  const [expandLoading, setExpandLoading] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY_FORCE).then((v) => setForceUpdate(v === 'true'));
    void getFeatures().then(setFeatures);
  }, []);

  const updateFeature = useCallback((key: keyof FeatureToggles, value: boolean) => {
    setFeatures((prev) => {
      const next = key === 'expand' ? (value ? { expand: true, club: prev.club, food: prev.food, book: prev.book, other: prev.other } : DEFAULT_FEATURES) : { ...prev, [key]: value };
      void AsyncStorage.setItem(STORAGE_KEY_FEATURES, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleForceUpdate = useCallback(async () => {
    const nv = !forceUpdate; setForceUpdate(nv);
    await AsyncStorage.setItem(STORAGE_KEY_FORCE, String(nv));
  }, [forceUpdate]);

  const handleClearCache = useCallback(() => {
    Alert.alert('提示', '是否清除所有缓存？用户信息将会保留。', [
      { text: '取消', style: 'cancel' },
      { text: '确定', onPress: () => {
        void (async () => {
          const ud = await userManager.getFromCache();
          await AsyncStorage.clear();
          if (ud) await userManager.saveToCache();
          await AsyncStorage.setItem(STORAGE_KEY_FORCE, String(forceUpdate));
          await AsyncStorage.setItem(STORAGE_KEY_FEATURES, JSON.stringify(features));
          showToast({ message: '缓存已清除', type: 'success' });
        })();
      } },
    ]);
  }, [showToast, forceUpdate, features]);

  const handleExpandToggle = useCallback(async () => {
    const target = !features.expand;
    if (!target) { updateFeature('expand', false); return; }
    if (serverConnected) { updateFeature('expand', true); return; }
    const stuId = userManager.stuId;
    if (!stuId || !userManager.password) { showToast({ message: '请先登录教务系统', type: 'warning' }); return; }
    let ep = userManager.getEncryptedPassword();
    if (!ep) { try { ep = encryptPassword(userManager.password); userManager.setEncryptedPassword(ep); } catch { showToast({ message: '密码加密失败', type: 'error' }); return; } }
    setExpandLoading(true);
    try {
      const sid = userManager.getSchoolId() || 'hbut';
      const checkRes = await serverGet<{ exists: boolean }>('/api/v1/auth/check-user', { stuId, schoolId: sid });
      if (checkRes.success && checkRes.data?.exists) {
        const regRes = await serverPost<{ token: string }>('/api/v1/auth/register', { stuId, password: ep, schoolId: sid, nickName: userManager.realName });
        if (regRes.success && regRes.data?.token) { userManager.setServerToken(regRes.data.token); if (!userManager.getSchoolId()) userManager.setSchoolId(sid); }
        serverConnected = true; updateFeature('expand', true); return;
      }
      const confirmed = await new Promise<boolean>((r) => Alert.alert('用户注册', '使用拓展功能需要将个人信息上传到服务器，是否同意？', [{ text: '取消', onPress: () => r(false) }, { text: '同意', onPress: () => r(true) }]));
      if (!confirmed) return;
      const regRes = await serverPost<{ token: string }>('/api/v1/auth/register', { stuId, password: ep, schoolId: sid, nickName: userManager.realName });
      if (regRes.success && regRes.data?.token) { userManager.setServerToken(regRes.data.token); serverConnected = true; updateFeature('expand', true); showToast({ message: '注册成功', type: 'success' }); }
      else showToast({ message: regRes.message ?? '注册失败', type: 'error' });
    } catch (e) { showToast({ message: e instanceof Error ? e.message : '网络错误', type: 'error' }); }
    finally { setExpandLoading(false); }
  }, [features.expand, updateFeature, showToast]);

  const isDark = theme.background === '#000000';

  return (
    <ThemedView style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)', 'rgb(35,39,64)', 'rgb(26,29,46)'] : ['#47a5fd', '#cce5ff', '#f2f5f9']} locations={[0, 0.28, 1]} style={[s.gradient, { paddingTop: insets.top + 8 }]}>
        <ScrollView style={s.scrollView}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()}><MaterialIcon name="arrow-left" size={24} color="#ffffff" /></TouchableOpacity>
            <HeadStatus text="设置" />
          </View>
          <View style={[s.group, { backgroundColor: theme.surface }]}>
            <SettingRow label="黑夜模式" desc="开启后应用主题变为深色" value={darkMode} onToggle={() => { void toggleDarkMode(!darkMode); }} />
            <View style={[s.divider, { backgroundColor: theme.backgroundElement }]} />
            <SettingRow label="数据更新" desc="开启后每次启动强制刷新数据" value={forceUpdate} onToggle={() => { void handleForceUpdate(); }} />
          </View>
          <View style={[s.group, { backgroundColor: theme.surface, marginTop: 12 }]}>
            <View style={s.row}>
              <View style={s.rowLeft}>
                <ThemedText style={s.rowLabel}>拓展</ThemedText>
                <ThemedText style={s.rowDesc} themeColor="textSecondary">开启后可在首页显示更多功能入口</ThemedText>
              </View>
              <Switch value={features.expand} disabled={expandLoading} onValueChange={() => { void handleExpandToggle(); }} trackColor={{ true: '#47a5fd' }} />
            </View>
            <View style={[s.divider, { backgroundColor: theme.backgroundElement }]} />
            <SettingRow label="社团" desc="首页显示社团入口" value={features.club} onToggle={() => updateFeature('club', !features.club)} disabled={!features.expand} />
            <View style={[s.divider, { backgroundColor: theme.backgroundElement }]} />
            <SettingRow label="美食" desc="首页显示美食入口" value={features.food} onToggle={() => updateFeature('food', !features.food)} disabled={!features.expand} />
            <View style={[s.divider, { backgroundColor: theme.backgroundElement }]} />
            <SettingRow label="书籍" desc="首页显示书籍入口" value={features.book} onToggle={() => updateFeature('book', !features.book)} disabled={!features.expand} />
            <View style={[s.divider, { backgroundColor: theme.backgroundElement }]} />
            <SettingRow label="其他" desc="首页显示其他入口" value={features.other} onToggle={() => updateFeature('other', !features.other)} disabled={!features.expand} />
          </View>
          <TouchableOpacity style={[s.clearBtn, { backgroundColor: theme.surface }]} onPress={handleClearCache}>
            <ThemedText style={s.clearText} themeColor="error">清除缓存</ThemedText>
            <MaterialIcon name="chevron-right" size={16} color="#ff4d4f" />
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 }, gradient: { flex: 1 }, scrollView: { flex: 1, paddingHorizontal: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  group: { marginHorizontal: 12, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  rowDisabled: { opacity: 0.4 },
  rowLeft: { flex: 1, marginRight: 12 },
  rowLabel: { fontSize: 15, fontWeight: '500' }, labelDisabled: { opacity: 0.5 },
  rowDesc: { fontSize: 12, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 12, marginTop: 16, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 16 },
  clearText: { fontSize: 15, fontWeight: '600' },
});
