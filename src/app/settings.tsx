import { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Switch, Divider, ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useThemeSettings } from '@/hooks/use-theme-settings';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';
import userManager from '@/service/userInfo';
import { serverGet, serverPost } from '@/utils/serverRequest';
import encryptPassword from '@/utils/hbut/loginEncrypt';

const STORAGE_KEY_FORCE = 'settings_force_update';
const STORAGE_KEY_FEATURES = 'settings_feature_toggles';

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

async function getStoredForceUpdate(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY_FORCE);
    return val === 'true';
  } catch {
    return false;
  }
}

async function getStoredFeatures(): Promise<FeatureToggles> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_FEATURES);
    if (raw) {
      const stored = JSON.parse(raw) as Partial<FeatureToggles>;
      return { ...DEFAULT_FEATURES, ...stored };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_FEATURES };
}

async function saveFeatures(features: FeatureToggles): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_FEATURES, JSON.stringify(features));
  } catch {
    // ignore
  }
}

// Track whether server has been connected this session
let serverConnected = false;

export default function SettingsPage() {
  const { darkMode, toggleDarkMode } = useThemeSettings();
  const theme = useTheme();
  const { showToast } = useToast();

  const [forceUpdate, setForceUpdate] = useState(false);
  const [expandLoading, setExpandLoading] = useState(false);
  const [features, setFeatures] = useState<FeatureToggles>(DEFAULT_FEATURES);

  useEffect(() => {
    void getStoredForceUpdate().then(setForceUpdate);
    void getStoredFeatures().then(setFeatures);
  }, []);

  const handleDarkMode = useCallback(() => {
    void toggleDarkMode(!darkMode);
  }, [darkMode, toggleDarkMode]);

  const handleForceUpdate = useCallback(async () => {
    const newVal = !forceUpdate;
    setForceUpdate(newVal);
    await AsyncStorage.setItem(STORAGE_KEY_FORCE, String(newVal));
  }, [forceUpdate]);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      '提示',
      '是否清除所有缓存？用户信息将会保留，不会注销登录。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const userData = await userManager.getFromCache();
              await AsyncStorage.clear();
              if (userData) {
                await userManager.saveToCache();
              }
              await AsyncStorage.setItem(STORAGE_KEY_FORCE, String(forceUpdate));
              await saveFeatures(features);
              showToast({ message: '缓存已清除', type: 'success' });
            })();
          },
        },
      ],
    );
  }, [forceUpdate, features, showToast]);

  const updateFeature = useCallback((key: keyof FeatureToggles, value: boolean) => {
    setFeatures((prev) => {
      let next: FeatureToggles;
      if (key === 'expand') {
        next = value
          ? { expand: true, club: prev.club, food: prev.food, book: prev.book, other: prev.other }
          : { ...DEFAULT_FEATURES };
      } else {
        next = { ...prev, [key]: value };
      }
      void saveFeatures(next);
      return next;
    });
  }, []);

  const handleExpandToggle = useCallback(async () => {
    const targetState = !features.expand;

    // Closing: just update
    if (!targetState) {
      updateFeature('expand', false);
      return;
    }

    // Session already connected
    if (serverConnected) {
      updateFeature('expand', true);
      return;
    }

    // Opening: check prereqs
    const stuId = userManager.stuId;
    const realName = userManager.realName;
    if (!stuId || !userManager.password) {
      showToast({ message: '请先登录教务系统', type: 'warning' });
      return;
    }

    // Get encrypted password
    let encodedPassword = userManager.getEncryptedPassword();
    if (!encodedPassword) {
      try {
        encodedPassword = encryptPassword(userManager.password);
        userManager.setEncryptedPassword(encodedPassword);
      } catch {
        showToast({ message: '密码加密失败，请重试', type: 'error' });
        return;
      }
    }

    setExpandLoading(true);

    try {
      const schoolId = userManager.getSchoolId() || 'hbut';

      // 1. Check if user exists on server
      const checkRes = await serverGet<{ exists: boolean }>('/api/v1/auth/check-user', {
        stuId,
        schoolId,
      });

      if (checkRes.success && checkRes.data?.exists) {
        // Already registered, call register to get token
        const regRes = await serverPost<{ token: string }>('/api/v1/auth/register', {
          stuId,
          password: encodedPassword,
          schoolId,
          nickName: realName,
        });
        if (regRes.success && regRes.data?.token) {
          userManager.setServerToken(regRes.data.token);
          if (!userManager.getSchoolId()) {
            userManager.setSchoolId(schoolId);
          }
        }
        serverConnected = true;
        updateFeature('expand', true);
        return;
      }

      // 2. Not registered - confirm with user
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          '用户注册',
          '使用拓展功能需要将你的个人信息上传到服务器，是否同意？',
          [
            { text: '取消', style: 'cancel', onPress: () => resolve(false) },
            { text: '同意', onPress: () => resolve(true) },
          ],
        );
      });

      if (!confirmed) return;

      // 3. Register
      const regRes = await serverPost<{ token: string }>('/api/v1/auth/register', {
        stuId,
        password: encodedPassword,
        schoolId,
        nickName: realName,
      });

      if (regRes.success && regRes.data?.token) {
        userManager.setServerToken(regRes.data.token);
        if (!userManager.getSchoolId()) {
          userManager.setSchoolId(schoolId);
        }
        serverConnected = true;
        updateFeature('expand', true);
        showToast({ message: '注册成功', type: 'success' });
      } else {
        showToast({
          message: regRes.message ?? '注册失败，请稍后重试',
          type: 'error',
        });
      }
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : '网络连接失败，请稍后重试',
        type: 'error',
      });
    } finally {
      setExpandLoading(false);
    }
  }, [features.expand, updateFeature, showToast]);

  const navigateBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} themeColor="onPrimary">
          设置
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Appearance Group */}
        <View style={[styles.group, { backgroundColor: theme.surfaceVariant, borderRadius: 12 }]}>
          {/* Dark Mode */}
          <TouchableOpacity style={styles.row} onPress={handleDarkMode}>
            <View style={styles.rowLeft}>
              <ThemedText style={styles.label}>黑夜模式</ThemedText>
              <ThemedText style={styles.desc} themeColor="textSecondary">
                开启后应用主题变为深色
              </ThemedText>
            </View>
            <Switch value={darkMode} onValueChange={handleDarkMode} color={theme.primary} />
          </TouchableOpacity>

          <Divider />

          {/* Force Update */}
          <TouchableOpacity style={styles.row} onPress={handleForceUpdate}>
            <View style={styles.rowLeft}>
              <ThemedText style={styles.label}>数据更新</ThemedText>
              <ThemedText style={styles.desc} themeColor="textSecondary">
                开启后每次启动强制刷新数据
              </ThemedText>
            </View>
            <Switch value={forceUpdate} onValueChange={handleForceUpdate} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Expand Features Group */}
        <View style={[styles.group, { backgroundColor: theme.surfaceVariant, borderRadius: 12 }]}>
          {/* Expand master toggle */}
          <TouchableOpacity
            style={styles.row}
            onPress={expandLoading ? undefined : () => void handleExpandToggle()}
          >
            <View style={styles.rowLeft}>
              <ThemedText style={styles.label}>拓展</ThemedText>
              <ThemedText style={styles.desc} themeColor="textSecondary">
                开启后可在首页显示更多功能入口
              </ThemedText>
            </View>
            <View style={styles.rowRight}>
              {expandLoading ? <ActivityIndicator size={20} style={styles.loadingIndicator} /> : null}
              <Switch
                value={features.expand}
                disabled={expandLoading}
                onValueChange={() => void handleExpandToggle()}
                color={theme.primary}
              />
            </View>
          </TouchableOpacity>

          <Divider />

          {/* Club */}
          <TouchableOpacity
            style={[styles.row, !features.expand && styles.rowDisabled]}
            onPress={() => {
              if (features.expand) updateFeature('club', !features.club);
            }}
          >
            <View style={styles.rowLeft}>
              <ThemedText style={[styles.label, !features.expand && styles.labelDisabled]}>
                社团
              </ThemedText>
              <ThemedText style={styles.desc} themeColor="textSecondary">
                首页显示社团入口
              </ThemedText>
            </View>
            <Switch
              value={features.club}
              disabled={!features.expand}
              onValueChange={() => updateFeature('club', !features.club)}
              color={theme.primary}
            />
          </TouchableOpacity>

          <Divider />

          {/* Food */}
          <TouchableOpacity
            style={[styles.row, !features.expand && styles.rowDisabled]}
            onPress={() => {
              if (features.expand) updateFeature('food', !features.food);
            }}
          >
            <View style={styles.rowLeft}>
              <ThemedText style={[styles.label, !features.expand && styles.labelDisabled]}>
                美食
              </ThemedText>
              <ThemedText style={styles.desc} themeColor="textSecondary">
                首页显示美食入口
              </ThemedText>
            </View>
            <Switch
              value={features.food}
              disabled={!features.expand}
              onValueChange={() => updateFeature('food', !features.food)}
              color={theme.primary}
            />
          </TouchableOpacity>

          <Divider />

          {/* Book */}
          <TouchableOpacity
            style={[styles.row, !features.expand && styles.rowDisabled]}
            onPress={() => {
              if (features.expand) updateFeature('book', !features.book);
            }}
          >
            <View style={styles.rowLeft}>
              <ThemedText style={[styles.label, !features.expand && styles.labelDisabled]}>
                书籍
              </ThemedText>
              <ThemedText style={styles.desc} themeColor="textSecondary">
                首页显示书籍入口
              </ThemedText>
            </View>
            <Switch
              value={features.book}
              disabled={!features.expand}
              onValueChange={() => updateFeature('book', !features.book)}
              color={theme.primary}
            />
          </TouchableOpacity>

          <Divider />

          {/* Other */}
          <TouchableOpacity
            style={[styles.row, !features.expand && styles.rowDisabled]}
            onPress={() => {
              if (features.expand) updateFeature('other', !features.other);
            }}
          >
            <View style={styles.rowLeft}>
              <ThemedText style={[styles.label, !features.expand && styles.labelDisabled]}>
                其他
              </ThemedText>
              <ThemedText style={styles.desc} themeColor="textSecondary">
                首页显示其他入口
              </ThemedText>
            </View>
            <Switch
              value={features.other}
              disabled={!features.expand}
              onValueChange={() => updateFeature('other', !features.other)}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Clear Cache */}
        <TouchableOpacity
          style={[styles.clearCacheRow, { backgroundColor: theme.surfaceVariant, borderRadius: 12 }]}
          onPress={handleClearCache}
        >
          <ThemedText style={styles.clearCacheText} themeColor="error">
            清除缓存
          </ThemedText>
          <MaterialIcon name="chevron-right" size={20} color="#d32f2f" />
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  group: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowDisabled: {
    opacity: 0.4,
  },
  rowLeft: {
    flex: 1,
    marginRight: 16,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingIndicator: {
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  labelDisabled: {
    opacity: 0.5,
  },
  desc: {
    fontSize: 13,
    marginTop: 2,
  },
  clearCacheRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  clearCacheText: {
    fontSize: 15,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 40,
  },
});
