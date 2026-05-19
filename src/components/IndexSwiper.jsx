import {Swiper,SwiperItem,Image } from "@tarojs/components";
import defaultPic from '../assets/tower.jpeg'
import './indexSwiper.css'
// 轮播图数据
const bannerList = [
  { id: 1, imageUrl: defaultPic },
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
