import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HeadStatus } from '@/components/HeadStatus';
import { MaterialIcon } from '@/components/MaterialIcon';
import type { IconName } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';
import userManager from '@/service/userInfo';

interface MenuItem {
  text: string;
  icon: IconName;
  route: string;
}

const menuItems: MenuItem[] = [
  { text: '设置', icon: 'cog', route: '/settings' },
  { text: '运行日志', icon: 'bug', route: '/runtime-log' },
  { text: '项目仓库', icon: 'source-repository', route: '/repo' },
  { text: '关于我们', icon: 'account-plus', route: '/join' },
  { text: '反馈与建议', icon: 'comment-quote', route: '/feedback' },
];

function UserCardTag({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={[tagStyles.tag, { backgroundColor: theme.primaryContainer }]}>
      <ThemedText style={tagStyles.tagText}>{text}</ThemedText>
    </View>
  );
}

const tagStyles = StyleSheet.create({
  tag: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default function UserScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [avatar, setAvatar] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Load avatar on mount
  const loadAvatar = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem('user_avatar');
      if (cached) setAvatar(cached);
    } catch { /* ignore */ }
  }, []);

  // Load saved avatar on mount
  useEffect(() => { const t = setTimeout(() => { void loadAvatar(); }, 0); return () => clearTimeout(t); }, [loadAvatar]);

  const handleChooseAvatar = useCallback(() => {
    void (async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setAvatar(uri);
        await AsyncStorage.setItem('user_avatar', uri);
      }
    })();
  }, []);

  const isLoggedIn = userManager.checkLogin();
  const userInfo = isLoggedIn ? userManager.getUserInfoSync() : null;
  const username = userInfo?.realName ?? '昵称';
  const stuId = userInfo?.stuId ?? '未登录';

  const handleLogin = useCallback(() => {
    router.push('/login');
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert('提示', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定', style: 'destructive',
        onPress: () => {
          void (async () => {
            await userManager.logout();
            showToast({ message: '已退出登录', type: 'success' });
          })();
        },
      },
    ]);
  }, [showToast]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const isDark = theme.background === '#000000';
  const gradientColors: [string, ...string[]] = isDark
    ? ['rgb(26,29,46)', 'rgb(35,39,64)', 'rgb(26,29,46)']
    : ['#47a5fd', '#cce5ff', '#f2f5f9'];

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.28, 1]}
        style={[styles.gradient, { paddingTop: insets.top + 8 }]}
      >
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              colors={['#47a5fd']} tintColor="#47a5fd" />
          }
        >
          <HeadStatus text="我的" />

          {/* User Card */}
          <View style={[styles.userCard, { backgroundColor: theme.surface }]}>
            <TouchableOpacity style={styles.avatarCircle} onPress={handleChooseAvatar}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{username.charAt(0)}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.userInfo}>
              <ThemedText style={styles.nickname}>{username}</ThemedText>
              <ThemedText style={styles.stuId} themeColor="textSecondary">{stuId}</ThemedText>
            </View>

            {userInfo ? (
              <View style={styles.tags}>
                <UserCardTag text={userInfo.university} />
                <UserCardTag text={userInfo.college} />
                <UserCardTag text={userInfo.class} />
              </View>
            ) : null}
          </View>

          {/* Menu Items */}
          <View style={[styles.menuSection, { backgroundColor: theme.surface }]}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.text}
                style={[styles.menuItem, { borderBottomColor: theme.backgroundElement }]}
                onPress={() => router.push(item.route)}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconWrap, { backgroundColor: theme.primaryContainer }]}>
                    <MaterialIcon name={item.icon} size={15} color="#47a5fd" />
                  </View>
                  <ThemedText style={styles.menuText}>{item.text}</ThemedText>
                </View>
                <MaterialIcon name="chevron-right" size={14} color="#c0c0c0" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Login/Logout Button */}
          {!isLoggedIn ? (
            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
              <Text style={styles.loginBtnText}>立即登录</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <ThemedText style={styles.logoutBtnText} themeColor="error">退出登录</ThemedText>
            </TouchableOpacity>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollView: { flex: 1, paddingHorizontal: 8 },
  // User card
  userCard: {
    marginHorizontal: 12, marginTop: 12, padding: 20,
    borderRadius: 20, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  avatarCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#47a5fd', alignItems: 'center', justifyContent: 'center',
    marginBottom: 8, overflow: 'hidden',
    shadowColor: '#47a5fd', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  userInfo: { alignItems: 'center', marginBottom: 10 },
  nickname: { fontSize: 18, fontWeight: '700', marginBottom: 3 },
  stuId: { fontSize: 13 },
  tags: { flexDirection: 'row', gap: 6 },
  // Menu
  menuSection: {
    marginHorizontal: 12, marginTop: 12,
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuIconWrap: {
    width: 28, height: 28, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  menuText: { fontSize: 15, fontWeight: '500' },
  // Buttons
  loginBtn: {
    marginHorizontal: 12, marginTop: 16,
    backgroundColor: '#47a5fd', borderRadius: 20, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#47a5fd', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  logoutBtn: {
    marginHorizontal: 12, marginTop: 16,
    borderRadius: 20, borderWidth: 1, borderColor: '#ff4d4f',
    paddingVertical: 16, alignItems: 'center', backgroundColor: '#fff',
  },
  logoutBtnText: { fontSize: 16, fontWeight: '500' },
});
