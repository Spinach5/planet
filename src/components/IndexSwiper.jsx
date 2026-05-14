import { View,Swiper,SwiperItem,Image } from "@tarojs/components";
import defaultPic from '../assets/tower.jpeg'
import img1 from '../assets/p1.jpg'
import img2 from '../assets/p2.jpg'
import img3 from '../assets/p3.jpg'
import './indexSwiper.css'
// 轮播图数据
const bannerList = [
  { id: 1, imageUrl: defaultPic },
  { id: 2, imageUrl: img1 },
  { id: 3, imageUrl: img2 },
  { id: 4, imageUrl: img3 },
]
export default function IndexSwiper({
    className = ''
}) {
    return (
    <Swiper
        indicatorDots
        autoplay
        interval={3000}
        duration={500}
        circular
        className={`swiper-box ${className}`}
    >
        {bannerList.map((item) => (
          <SwiperItem key={item.id}>
            <Image className="slide-image" src={item.imageUrl} mode="widthFix" />
          </SwiperItem>
        ))}
      </Swiper>
    )
}
