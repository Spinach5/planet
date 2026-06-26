import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';

export default function LoginScreen() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ account: '', password: '' });

  const validateAccount = useCallback((value: string): string => {
    if (!value.trim()) return '请输入手机号或邮箱';
    const phoneReg = /^1[3-9]\d{9}$/;
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!phoneReg.test(value) && !emailReg.test(value)) return '请输入正确的手机号或邮箱';
    return '';
  }, []);

  const validatePassword = useCallback((value: string): string => {
    if (!value) return '请输入密码';
    if (value.length < 6) return '密码长度不能小于6位';
    return '';
  }, []);

  const handleAccountChange = (value: string) => {
    setAccount(value);
    setErrors((prev) => ({ ...prev, account: validateAccount(value) }));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
  };

  const handleGoHome = () => {
    router.back();
  };

  const handleLogin = async () => {
    const accountError = validateAccount(account);
    const passwordError = validatePassword(password);
    setErrors({ account: accountError, password: passwordError });

    if (accountError || passwordError) {
      Alert.alert('提示', accountError || passwordError);
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.warn('登录成功', { account, password });
      Alert.alert('成功', '登录成功', [
        { text: '确定', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (_error: unknown) {
      Alert.alert('错误', '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 返回首页按钮 */}
        <TouchableOpacity style={styles.homeBtn} onPress={handleGoHome}>
          <View style={styles.homeBtnInner}>
            <View style={styles.homeIconWrapper}>
              <Text style={styles.homeIcon}>←</Text>
            </View>
            <Text style={styles.homeText}>返回首页</Text>
          </View>
        </TouchableOpacity>

        {/* 背景装饰 */}
        <View style={styles.bgDecoration}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>

        {/* Logo区域 */}
        <View style={styles.logoSection}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('@/assets/images/tdjj.jpg')}
              style={styles.logoImage}
            />
          </View>
          <Text style={styles.appName}>欢迎回来</Text>
          <Text style={styles.appSlogan}>请登录您的账号</Text>
        </View>

        {/* 表单区域 */}
        <ThemedView style={styles.formSection}>
          {/* 账号输入框 */}
          <View style={[styles.inputGroup, errors.account ? styles.inputGroupError : null]}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.inputField}
              placeholder="手机号 / 邮箱"
              placeholderTextColor="#9ca3af"
              value={account}
              onChangeText={handleAccountChange}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          {errors.account ? <Text style={styles.errorTip}>{errors.account}</Text> : null}

          {/* 密码输入框 */}
          <View style={[styles.inputGroup, errors.password ? styles.inputGroupError : null]}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.inputField}
              placeholder="密码"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.toggleIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorTip}>{errors.password}</Text> : null}

          {/* 额外选项 */}
          <View style={styles.options}>
            <View style={styles.remember}>
              <View style={styles.checkbox} />
              <Text style={styles.rememberText}>记住密码</Text>
            </View>
            <Text style={styles.forgot}>忘记密码？</Text>
          </View>

          {/* 登录按钮 */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnLoading]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.loginBtnText}>登录中...</Text>
              </View>
            ) : (
              <Text style={styles.loginBtnText}>登 录</Text>
            )}
          </TouchableOpacity>

          {/* 注册引导 */}
          <View style={styles.registerGuide}>
            <Text style={styles.registerGuideText}>还没有账号？</Text>
            <TouchableOpacity onPress={() => Alert.alert('提示', '注册页面开发中')}>
              <Text style={styles.registerLink}>立即注册</Text>
            </TouchableOpacity>
          </View>
        </ThemedView>

        {/* 第三方登录 */}
        <View style={styles.thirdParty}>
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>其他登录方式</Text>
            <View style={styles.line} />
          </View>
          <View style={styles.icons}>
            <TouchableOpacity style={styles.iconItem}>
              <Text style={styles.iconItemText}>🍎</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconItem}>
              <Text style={styles.iconItemText}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconItem}>
              <Text style={styles.iconItemText}>📱</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  flex: {
    flex: 1,
  },
  homeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 8 : 16,
    left: 20,
    zIndex: 10,
    borderRadius: 40,
    overflow: 'hidden',
  },
  homeBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 5,
  },
  homeIconWrapper: {
    width: 24,
    height: 24,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeIcon: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  homeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  bgDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(99,102,241,0.06)',
  },
  circle1: { width: 300, height: 300, top: -150, right: -80 },
  circle2: { width: 200, height: 200, bottom: '20%', left: -100 },
  circle3: { width: 150, height: 150, bottom: -50, right: 20 },
  logoSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 100,
    marginBottom: 48,
  },
  logoWrapper: {
    width: 88,
    height: 88,
    backgroundColor: '#6366f1',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 35,
    elevation: 10,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  appName: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  appSlogan: {
    fontSize: 14,
    color: '#6b7280',
  },
  formSection: {
    marginHorizontal: 20,
    borderRadius: 32,
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.08,
    shadowRadius: 45,
    elevation: 8,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'transparent',
    height: 52,
  },
  inputGroupError: {
    borderColor: '#ef4444',
    backgroundColor: '#fff5f5',
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
    opacity: 0.6,
  },
  inputField: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: '#1f2937',
  },
  errorTip: {
    fontSize: 12,
    color: '#ef4444',
    marginLeft: 16,
    marginBottom: 14,
    marginTop: 6,
  },
  passwordToggle: {
    padding: 8,
    marginLeft: 8,
  },
  toggleIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  remember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  rememberText: {
    fontSize: 13,
    color: '#6b7280',
  },
  forgot: {
    fontSize: 13,
    color: '#6366f1',
  },
  loginBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#6366f1',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  loginBtnLoading: {
    opacity: 0.7,
  },
  loginBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  registerGuide: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerGuideText: {
    fontSize: 14,
    color: '#6b7280',
  },
  registerLink: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
    marginLeft: 4,
  },
  thirdParty: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  icons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  iconItem: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  iconItemText: {
    fontSize: 24,
  },
});
