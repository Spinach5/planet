import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function UserScreen() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [nickname, setNickname] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [rawUsername, setRawUsername] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [username, setUsername] = useState('');
  const [isShowRawUname, setIsShowRawUname] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [xxtLastLoginTime, setXxtLastLoginTime] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [xxtLastGetDataTime, setXxtLastGetDataTime] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoggedinXxt, setIsLoggedinXxt] = useState(false);

  const switchIsShowRawUname = () => { setIsShowRawUname(!isShowRawUname); };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLogout = () => {
    Alert.alert('确认', '确定要清除所有缓存吗？这将同时清除登录状态。', [
      { text: '取消', style: 'cancel' },
      { text: '确定', style: 'destructive', onPress: () => { Alert.alert('提示', '缓存已清除'); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>我的</Text>
      </View>

      <ThemedView style={styles.userCard}>
        <View style={styles.nickName}>
          <Text style={styles.nickNameText}>{nickname || '昵称'}</Text>
        </View>
        <TouchableOpacity onPress={switchIsShowRawUname}>
          <Text style={styles.userName}>
            {rawUsername ? (isShowRawUname ? rawUsername : username) : '账号'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.descript}>
          上次登陆xxt时间{xxtLastLoginTime || '未知'}
          {'\n'}
          上次拉取xxt课表时间{xxtLastGetDataTime || '未知'}
        </Text>
      </ThemedView>

      <View style={styles.menuContainer}>
        {!isLoggedinXxt ? (
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginBtnText}>立即登录</Text>
          </TouchableOpacity>
        ) : null}

        <ThemedView style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings')}>
            <Text style={styles.menuItemText}>设置</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>账号管理</Text>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>向我们反馈</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>加入我们</Text>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>从xxt获取课表</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View>
              <Text style={[styles.menuItemText, { color: 'red' }]}>清除所有小程序缓存</Text>
              <Text style={styles.descript}>同时将会清除登录状态</Text>
            </View>
          </TouchableOpacity>
        </ThemedView>
      </View>

      <View style={styles.copyleft}>
        <Text style={styles.copyleftText}>copyleft</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  userCard: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    padding: Spacing.four,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  nickName: {
    marginBottom: 15,
  },
  nickNameText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  userName: {
    fontSize: 28,
    color: '#666',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  descript: {
    fontSize: 24,
    color: '#999',
    lineHeight: 34,
  },
  menuContainer: {
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.three,
  },
  loginBtn: {
    backgroundColor: '#667eea',
    paddingVertical: 28,
    borderRadius: 60,
    alignItems: 'center',
    marginBottom: Spacing.three,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '600',
  },
  menuSection: {
    borderRadius: 20,
    marginBottom: Spacing.three,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  menuItem: {
    padding: 30,
  },
  menuItemText: {
    fontSize: 28,
    color: '#333',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#f0f0f0',
    marginLeft: 30,
  },
  copyleft: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  copyleftText: {
    fontSize: 24,
    color: '#999',
  },
});
