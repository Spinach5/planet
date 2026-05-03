import { View } from "@tarojs/components"
import './Btn.scss'
import Taro from '@tarojs/taro'

export default function Btn({
  children,
  className = '',
  onClick=() => {Taro.showToast({title: '按钮被点击'})},
}) {
  return (
    <View
      className={`btn ${className}`}
      onClick={onClick}
    >
      {children}
    </View>
  )
}
