import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import './index.scss'

export default function Admin () {
  useLoad(() => {
    console.log('Page loaded.')
  })

  return (
    <View className='admin'>
      <Text>Hello world!</Text>
    </View>
  )
}
