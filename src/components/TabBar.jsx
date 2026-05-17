// src/components/TabBar/index.jsx
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './TabBar.css'

const TAB_LIST = [
  { pagePath: '/pages/index/index', text: '首页', iconClass: 'fa fa-paper-plane' },
  { pagePath: '/pages/course/index', text: '课程', iconClass: 'fa fa-table' },
  { pagePath: '/pages/test/index', text: '测试', iconClass: 'fa fa-bug' },
  { pagePath: '/pages/user/index', text: '我的', iconClass: 'fa fa-user' }
]

export default function TabBar({ currentPath }) {
  // 根据外部传入的 currentPath 计算高亮索引
  const selectedIndex = TAB_LIST.findIndex(item => item.pagePath === currentPath)

  const switchTab = (index, pagePath) => {
    if (selectedIndex === index) return
    Taro.switchTab({ url: pagePath })
  }

  return (
    <View className='tab-bar'>
      {TAB_LIST.map((item, index) => (
        <View
          key={index}
          className='tab-bar-item'
          onClick={() => switchTab(index, item.pagePath)}
        >
          <View
            className={`${item.iconClass} tab-bar-icon`}
            style={{ color: selectedIndex === index ? '#47a5fd' : '#000000' }}
          />
          <Text
            className='tab-bar-text'
            style={{ color: selectedIndex === index ? '#47a5fd' : '#000000' }}
          >
            {item.text}
          </Text>
        </View>
      ))}
    </View>
  )
}
