import { View } from "@tarojs/components";
import "./index.css";
import SafeAreaView from "../../components/safeView";
import HeadStatus from "../../components/headStatus";
import IndexSwiper from "../../components/IndexSwiper";
import GridContainer from "../../components/gridContainer";
import { useLoad ,useLaunch, useDidShow, useDidHide} from "@tarojs/taro";
import { getStuInfo } from "../../service/hubt/StuInfo";


export default function Index() {
  // 页面加载时执行
  useLoad(() => {

  });

  // 页面显示时执行（每次切换到前台都会执行）
  useDidShow(() => {
    console.log("页面已显示");
  });

  // 页面隐藏时执行（切换到后台）
  useDidHide(() => {
    console.log("页面已隐藏");
  });
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
