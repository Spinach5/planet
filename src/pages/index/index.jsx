import { View } from "@tarojs/components";
import "./index.css";
import SafeAreaView from "../../components/safeView";
import HeadStatus from "../../components/headStatus";
import IndexSwiper from "../../components/IndexSwiper";
import GridContainer from "../../components/gridContainer";
import { useLoad,  useDidShow, useDidHide, useRouter} from "@tarojs/taro";

export default function Index() {
	const router = useRouter();
	const currentPath = router.path.split('?')[0];
	// 页面加载时执行
	useLoad(() => {});

	// 页面显示时执行（每次切换到前台都会执行）
	useDidShow(() => {
	});

	// 页面隐藏时执行（切换到后台）
	useDidHide(() => {
	});
	return (
		<SafeAreaView currentPath={currentPath} >
			<HeadStatus text="首页" />
			{/* 轮播图组件 */}
			<IndexSwiper />
			{/* 功能展示组件 */}
			<GridContainer />

			<View className="bora card list">
				<View className="item">最终可能展示公告或活动</View>
			</View>
			{/* 设置旋转动画 */}

		</SafeAreaView>
	);
}
