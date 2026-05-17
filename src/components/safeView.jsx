import { View } from "@tarojs/components";
import { getSafeArea } from "../service/safeArea";
import TabBar from "./TabBar";

export default function SaveAreaView({ children, currentPath }) {
	const safeArea = (() => {
		const { top, bottom } = getSafeArea();
		console.log("全局安全距离获取一次:", { top, bottom });
		return { top, bottom };
	})();
	console.log(currentPath);
	return (
		<>
			<View
				style={{
					height: "100vh",
					// overflow: "hidden", // 防止页面本身滚动
					display: "flex",
					flexDirection: "column",
					paddingTop: `${safeArea.top}px`,
					paddingBottom: `${safeArea.bottom}px`,
					paddingLeft: "8px",
					paddingRight: "8px",
					background: `linear-gradient(to bottom, rgb(71,165,253) 0%, rgb(255,255,255) 40%)`,
					boxSizing: "border-box",
				}}
			>
				{children}
			</View>
			<TabBar currentPath={currentPath} />
		</>
	);
}
