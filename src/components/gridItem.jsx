import { View, Text, Image } from "@tarojs/components"
import Taro from '@tarojs/taro'
import './gridItem.scss'

export default function GridItem({
  url,
  icon,
  text='无',
  className = '',
  onClick,
  navigate = true,
  navigateType = 'navigateTo'
}) {

const handleClick = async () => {
  if (onClick) {
    onClick()
    return
  }

  if (!navigate) return
  if (!url) {
    Taro.showToast({ title: `${text}暂无链接`, icon: 'none' })
    return
  }

  try {
    switch (navigateType) {
      case 'navigateTo':
        await Taro.navigateTo({ url })   // 加上 await
        break
      case 'redirectTo':
        await Taro.redirectTo({ url })
        break
      case 'reLaunch':
        await Taro.reLaunch({ url })
        break
      case 'switchTab':
        await Taro.switchTab({ url })
        break
      default:
        await Taro.navigateTo({ url })
    }
  } catch (error) {
    console.error('页面跳转失败:', error)
    // 如果页面不存在会进入这里
    Taro.showToast({
      title: '功能正在开发中',
      icon: 'none',
      duration: 1500
    })
  }
}
  return (
    <View className={`my-item ${className}`} onClick={handleClick}>
      <View className="icon-wrapper">
        <Image src={icon} className="grid-icon" />
      </View>
      <Text className="grid-text">{text}</Text>
    </View>
  )
}
