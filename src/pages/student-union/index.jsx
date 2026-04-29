import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import './index.scss'

export default function StudentUnion () {
  useLoad(() => {
    console.log('Page loaded.')
  })

  return (
    <View className='student-union'>
      <Text>Hello world!</Text>
    </View>
  )
}
