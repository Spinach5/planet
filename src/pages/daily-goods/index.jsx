import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import './index.scss'

export default function DailyGoods () {
  useLoad(() => {
    console.log('Page loaded.')
  })

  return (
    <View className='daily-goods'>
      <Text>Hello world!</Text>
    </View>
  )
}
