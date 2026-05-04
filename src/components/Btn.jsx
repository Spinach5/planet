import { View } from "@tarojs/components"
import './Btn.scss'
import Taro from '@tarojs/taro'

export default function Btn({
  children,
  className = '',
  onClick=() => {Taro.showActionSheet({ itemList: ['拍照', '从相册选择'] })},
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
