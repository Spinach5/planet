import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import './index.scss'

export default function Map () {
  useLoad(() => {
    console.log('Page loaded.')
  })

  return (
    <View className='map'>
      <Text>Hello world!</Text>
    </View>
  )
}
