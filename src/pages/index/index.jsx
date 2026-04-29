import {
	View,
	Swiper,
	SwiperItem,
	Image,
	Text,
	Navigator,
} from "@tarojs/components";
import defaultPic from "../../assets/tower.jpeg";
import "./index.scss";
// import SafeAreaView from "../../components/safeView";
import BasePage from "../../components/basePage";

export default function Index() {
	const bannerList = [
		{ id: 1, imageUrl: defaultPic },
		{ id: 2, imageUrl: defaultPic },
		{ id: 3, imageUrl: defaultPic },
	];

	return (
		<BasePage>
			<Swiper
				indicatorDots
				autoplay
				interval={3000}
				duration={500}
				circular
			>
				{bannerList.map((item) => (
					<SwiperItem key={item.id}>
						<Image
							src={item.imageUrl}
							mode="aspectFit"
							className="swiperPic"
						/>
					</SwiperItem>
				))}
			</Swiper>

			<View className="grid">
				<Navigator
					url="/pages/students/students"
					className="bora list item center yellow-bg"
				>
					<View className="icon">🏫</View>
					<Text>学生会</Text>
				</Navigator>
				<Navigator
					url="/pages/clubs/clubs"
					className="bora list item center yellow-bg"
				>
					<View className="icon">🎪</View>
					<Text>社团</Text>
				</Navigator>
				<Navigator
					url="/pages/food/food"
					className="bora list item center yellow-bg"
				>
					<View className="icon">🍔</View>
					<Text>美食</Text>
				</Navigator>
				<Navigator
					url="/pages/affairs/affairs"
					className="bora list item center yellow-bg"
				>
					<View className="icon">📋</View>
					<Text>行政事务</Text>
				</Navigator>
				<Navigator
					url="/pages/affairs/affairs"
					className="bora list item center yellow-bg"
				>
					<View className="icon">💡</View>
					<Text>技巧</Text>
				</Navigator>
			</View>

			<View className="bora card list">
				<View className="item">最终可能展示公告或活动</View>
			</View>
		</BasePage>
	);
}
