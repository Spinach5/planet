import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import './index.scss'

export default function SecondhandBook () {
  useLoad(() => {
    console.log('Page loaded.')
  })

  return (
    <View className='secondhand-book'>
      <Text>Hello world!</Text>
    </View>
  )
}
