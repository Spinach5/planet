import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import './index.scss'

export default function Books () {
  useLoad(() => {
    console.log('Page loaded.')
  })

  return (
    <View className='books'>
      <Text>Hello world!</Text>
    </View>
  )
}
