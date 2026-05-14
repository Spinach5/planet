import { useState } from 'react'
import {
  View,
  Image,
  Text,
  Input,
  Button,
} from "@tarojs/components"
import Taro from '@tarojs/taro'
import "./index.css"
import SafeAreaView from "../../components/safeView"
import img1 from '../../assets/tdjj.jpg'

export default function Index() {
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // 表单验证错误信息
  const [errors, setErrors] = useState({
    account: '',
    password: ''
  })

  // 验证账号
  const validateAccount = (value) => {
    if (!value.trim()) {
      return '请输入手机号或邮箱'
    }
    const phoneReg = /^1[3-9]\d{9}$/
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!phoneReg.test(value) && !emailReg.test(value)) {
      return '请输入正确的手机号或邮箱'
    }
    return ''
  }

  // 验证密码
  const validatePassword = (value) => {
    if (!value) {
      return '请输入密码'
    }
    if (value.length < 6) {
      return '密码长度不能小于6位'
    }
    return ''
  }

  // 账号输入变化
  const handleAccountChange = (e) => {
    const value = e.detail.value
    setAccount(value)
    setErrors(prev => ({
      ...prev,
      account: validateAccount(value)
    }))
  }

  // 密码输入变化
  const handlePasswordChange = (e) => {
    const value = e.detail.value
    setPassword(value)
    setErrors(prev => ({
      ...prev,
      password: validatePassword(value)
    }))
  }

  // 切换密码可见性
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // 返回首页
  const handleGoHome = () => {
    // 添加触感反馈（小程序环境）
    if (Taro.canIUse('getHapticManager')) {
      Taro.getHapticManager().impact({
        type: 'light'
      }).catch(() => {})
    }

    // 波纹效果动画
    const btn = document.querySelector('.home-btn')
    if (btn) {
      btn.classList.add('ripple-effect')
      setTimeout(() => {
        btn.classList.remove('ripple-effect')
      }, 300)
    }

    setTimeout(() => {
      Taro.switchTab({
        url: '/pages/user/index'
      }).catch(() => {
        Taro.reLaunch({
          url: '/pages/user/index'
        })
      })
    }, 50)
  }

  // 登录
  const handleLogin = async () => {
    const accountError = validateAccount(account)
    const passwordError = validatePassword(password)

    setErrors({
      account: accountError,
      password: passwordError
    })

    if (accountError || passwordError) {
      Taro.showToast({
        title: accountError || passwordError,
        icon: 'none',
        duration: 2000
      })
      return
    }

    if (loading) return

    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      console.log('登录成功', { account, password })
      Taro.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      })

      setTimeout(() => {
        Taro.switchTab({
          url: '/pages/index/index'
        })
      }, 1500)

    } catch (error) {
      Taro.showToast({
        title: '登录失败，请重试',
        icon: 'error',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = () => {
    console.log('注册')
    Taro.navigateTo({
      url: '/pages/register/index'
    }).catch(() => {
      Taro.showToast({
        title: '注册页面开发中',
        icon: 'none'
      })
    })
  }

  return (
    <SafeAreaView>
      <View className="login-container">
        {/* 返回首页按钮 - 高级版 */}
        <View className="home-btn" onClick={handleGoHome}>
          <View className="home-btn-inner">
            <View className="home-icon-wrapper">
              <Text className="home-icon">←</Text>
            </View>
            <Text className="home-text">返回首页</Text>
          </View>
          <View className="home-btn-bg" />
        </View>

        {/* 背景装饰 */}
        <View className="bg-decoration">
          <View className="circle circle-1" />
          <View className="circle circle-2" />
          <View className="circle circle-3" />
        </View>

        {/* Logo区域 - 使用您导入的图片 */}
        <View className="logo-section">
          <View className="logo-wrapper">
            <Image
              className="logo-image"
               src={img1}
              mode="aspectFill"
            />
          </View>
          <Text className="app-name">欢迎回来</Text>
          <Text className="app-slogan">请登录您的账号</Text>
        </View>

        {/* 表单区域 */}
        <View className="form-section">
          {/* 账号输入框 */}
          <View className={`input-group ${errors.account ? 'error' : ''}`}>
            <View className="input-icon">👤</View>
            <Input
              className="input-field"
              type="text"
              placeholder="手机号 / 邮箱"
              placeholderClass="placeholder"
              value={account}
              onInput={handleAccountChange}
            />
          </View>
          {errors.account && <Text className="error-tip">{errors.account}</Text>}

          {/* 密码输入框 */}
          <View className={`input-group ${errors.password ? 'error' : ''}`}>
            <View className="input-icon">🔒</View>
            <Input
              className="input-field"
              type={showPassword ? 'text' : 'password'}
              placeholder="密码"
              placeholderClass="placeholder"
              value={password}
              onInput={handlePasswordChange}
            />
            <View
              className="password-toggle"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? (
                <Text className="toggle-icon">👁️</Text>
              ) : (
                <Text className="toggle-icon">👁️‍🗨️</Text>
              )}
            </View>
          </View>
          {errors.password && <Text className="error-tip">{errors.password}</Text>}

          {/* 额外选项 */}
          <View className="options">
            <View className="remember">
              <View className="checkbox" />
              <Text>记住密码</Text>
            </View>
            <Text className="forgot">忘记密码？</Text>
          </View>

          {/* 登录按钮 */}
          <Button
            className={`login-btn ${loading ? 'loading' : ''}`}
            onClick={handleLogin}
            activeClass="btn-active"
            disabled={loading}
          >
            {loading ? (
              <View className="loading-content">
                <View className="loading-spinner" />
                <Text>登录中...</Text>
              </View>
            ) : (
              '登 录'
            )}
          </Button>

          {/* 注册引导 */}
          <View className="register-guide">
            <Text>还没有账号？</Text>
            <Text className="register-link" onClick={handleRegister}>
              立即注册
            </Text>
          </View>
        </View>

        {/* 第三方登录 */}
        <View className="third-party">
          <View className="divider">
            <View className="line" />
            <Text>其他登录方式</Text>
            <View className="line" />
          </View>
          <View className="icons">
            <View className="icon-item">🍎</View>
            <View className="icon-item">💬</View>
            <View className="icon-item">📱</View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}
