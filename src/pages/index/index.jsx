import { View } from "@tarojs/components";
import "./index.scss";
import SafeAreaView from "../../components/safeView";
import HeadStatus from "../../components/headStatus";
import IndexSwiper from "../../components/IndexSwiper";
import GridContainer from "../../components/gridContainer";

export default function Index() {
	return (
		<SafeAreaView className="">
			<HeadStatus text="首页" />
			{/* 轮播图组件 */}
			<IndexSwiper />
			{/* 功能展示组件 */}
			<GridContainer />

			<View className="bora card list">
				<View className="item">最终可能展示公告或活动</View>
			</View>
		</SafeAreaView>
	);
}
