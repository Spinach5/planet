import { View, Swiper, SwiperItem, Image, Text } from '@tarojs/components'
import defaultPic from '../../assets/tower.jpeg'
import img1 from '../../assets/p1.jpg'
import img2 from '../../assets/p2.jpg'
import img3 from '../../assets/p3.jpg'
import './index.scss'
// 👇 把 SafeAreaView 这行删掉！
// import SafeAreaView from "../../components/safeView"
import BasePage from "../../components/basePage";
import Taro from '@tarojs/taro'

// 顶部导入所有图标
import studentIcon from '../../assets/8个功能/Workgroup.png';
import clubIcon from '../../assets/8个功能/社团.png';
import foodIcon from '../../assets/8个功能/餐饮.png';
import adminIcon from '../../assets/8个功能/行政地标.png';
import bookIcon from '../../assets/8个功能/手绘书本.png';
import dailyIcon from '../../assets/8个功能/日常用品.png';
import mapIcon from '../../assets/8个功能/世界地图.png';
import secondHandIcon from '../../assets/8个功能/书本.png';

export default function Index() {
  const bannerList = [
    { id: 1, imageUrl: defaultPic },
    { id: 2, imageUrl: img1 },
    { id: 3, imageUrl: img2 },
    { id: 4, imageUrl: img3 }, 
  ]

  const goToPage = (page) => {
    switch(page) {
      case 'student-union':
        Taro.navigateTo({ url: '/pages/student-union/index' });
        break;
      case 'club':
        Taro.navigateTo({ url: '/pages/club/index' });
        break;
      case 'food':
        Taro.navigateTo({ url: '/pages/food/index' });
        break;
      case 'admin':
        Taro.navigateTo({ url: '/pages/admin/index' });
        break;
      case 'books':
        Taro.navigateTo({ url: '/pages/books/index' });
        break;
      case 'daily-goods':
        Taro.navigateTo({ url: '/pages/daily-goods/index' });
        break;
      case 'map':
        Taro.navigateTo({ url: '/pages/map/index' });
        break;
      case 'secondhand-book':
        Taro.navigateTo({ url: '/pages/secondhand-book/index' });
        break;
      default:
        Taro.showToast({ title: '功能开发中', icon: 'none' });
    }
  }

  return (
    // 👇 这里换成普通 View！！！！！
    <BasePage className=''>
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
        <View className="my-item" onClick={() => goToPage('student-union')}>
          <View className="icon-wrapper icon-1"><Image src={studentIcon} className="my-icon" /></View>
          <Text className="my-font">学生会</Text>
        </View>
        <View className="my-item" onClick={() => goToPage('club')}>
          <View className="icon-wrapper icon-2" ><Image src={clubIcon} className="my-icon" /></View>
          <Text className="my-font">社团</Text>
        </View>
        <View className="my-item" onClick={() => goToPage('food')}>
          <View className="icon-wrapper icon-3" ><Image src={foodIcon} className="my-icon" /></View>
          <Text className="my-font">美食</Text>
        </View>
        <View className="my-item" onClick={() => goToPage('admin')}>
          <View className="icon-wrapper icon-4" ><Image src={adminIcon} className="my-icon" /></View>
          <Text className="my-font">行政事务</Text>
        </View>
        <View className="my-item" onClick={() => goToPage('books')}>
          <View className="icon-wrapper icon-5"><Image src={bookIcon} className="my-icon" /></View>
          <Text className="my-font">书籍资料</Text>
        </View>
        <View className="my-item" onClick={() => goToPage('daily-goods')}>
          <View className="icon-wrapper icon-6"><Image src={dailyIcon} className="my-icon" /></View>
          <Text className="my-font">日常用品</Text>
        </View>
        <View className="my-item" onClick={() => goToPage('map')}>
          <View className="icon-wrapper icon-7"><Image src={mapIcon} className="my-icon" /></View>
          <Text className="my-font">地图</Text>
        </View>
        <View className="my-item" onClick={() => goToPage('secondhand-book')}>
          <View className="icon-wrapper icon-8"><Image src={secondHandIcon} className="my-icon" /></View>
          <Text className="my-font">二手书</Text>
        </View>
      </View>

      <View className='bora card list'>
        <View className='item'>最终可能展示公告或活动</View>
      </View>
    </BasePage>
  )
}