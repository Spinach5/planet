import { View, Swiper, SwiperItem, Image, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'
import SafeAreaView from "../../components/safeView"
import HeadStatus from '../../components/headStatus'
import GridItem from '../../components/gridItem'

// 轮播图图片统一导入
import defaultPic from '../../assets/tower.jpeg'
import img1 from '../../assets/p1.jpg'
import img2 from '../../assets/p2.jpg'
import img3 from '../../assets/p3.jpg'

// 功能图标统一导入
import studentIcon from '../../assets/8个功能/Workgroup.png'
import clubIcon from '../../assets/8个功能/社团.png'
import foodIcon from '../../assets/8个功能/餐饮.png'
import adminIcon from '../../assets/8个功能/行政地标.png'
import bookIcon from '../../assets/8个功能/手绘书本.png'
import dailyIcon from '../../assets/8个功能/日常用品.png'
import mapIcon from '../../assets/8个功能/世界地图.png'
import secondHandIcon from '../../assets/8个功能/书本.png'

// 轮播图数据
const bannerList = [
  { id: 1, imageUrl: defaultPic },
  { id: 2, imageUrl: img1 },
  { id: 3, imageUrl: img2 },
  { id: 4, imageUrl: img3 },
]

// 功能入口配置数据
const gridItems = [
  { url: "", icon: studentIcon, text: "学生会" },
  { url: "", icon: clubIcon, text: "社团" },
  { url: "", icon: foodIcon, text: "美食" },
  { url: "", icon: adminIcon, text: "行政事务" },
  { url: "", icon: bookIcon, text: "书籍资料" },
  { url: "", icon: dailyIcon, text: "日常用品" },
  { url: "", icon: mapIcon, text: "地图" },
  { url: "", icon: secondHandIcon, text: "二手书" },
]

export default function Index() {
  return (
    <SafeAreaView className=''>
      <HeadStatus text='首页' />

      <Swiper
        indicatorDots
        autoplay
        interval={3000}
        duration={500}
        circular
        className="swiper-box"
      >
        {bannerList.map((item) => (
          <SwiperItem key={item.id}>
            <Image className="slide-image" src={item.imageUrl} mode="widthFix" />
          </SwiperItem>
        ))}
      </Swiper>

      <View className="grid-container">
        {gridItems.map((item, index) => (
          <GridItem
            key={index}
            url={item.url}
            icon={item.icon}
            text={item.text}
          />
        ))}
      </View>

      <View className='bora card list'>
        <View className='item'>最终可能展示公告或活动</View>
      </View>
    </SafeAreaView>
  )
}
