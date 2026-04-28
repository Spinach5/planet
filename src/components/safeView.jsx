import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'

export default function SafeAreaView({ children, className = '' }) {
  console.log('SafeAreaView 开始渲染')  // 1️⃣ 确认组件被调用

  let top = 44
  let bottom = 0
  try {
    const cache = Taro.getStorageSync('safe_area_cache')
    console.log('读取到的缓存原始数据:', cache)  // 2️⃣ 看这里输出什么
    if (cache && cache.data) {
      top = cache.data.top
      bottom = cache.data.bottom
      console.log('成功从缓存读取安全距离:', { top, bottom })
    } else {
      console.warn('未找到安全距离缓存，使用默认值')
    }
  } catch (e) {
    console.error('读取安全距离缓存异常', e)
  }

  return (
    <View
      className={className}
      style={{
        paddingTop: `${top}px`,
        paddingBottom: `${bottom}px`,
        paddingLeft: '8px',
        paddingRight: '8px',
        minHeight: '100vh',
        background: `linear-gradient(to bottom, rgba(71,165,253,1.00) 0%, rgba(255,255,255,0) 40%)`,
      }}
    >
      {children}
    </View>
  )
}