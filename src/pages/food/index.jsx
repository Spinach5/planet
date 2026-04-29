import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import './index.scss'

export default function Food () {
  useLoad(() => {
    console.log('Page loaded.')
  })

  return (
    <View className='food'>
      <Text>Hello world!</Text>
    </View>
  )
}
