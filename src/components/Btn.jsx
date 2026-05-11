import { View } from "@tarojs/components"
import './Btn.scss'

export default function Btn({
  children,
  className = '',
  onClick = ()=>{},//默认为空函数
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
