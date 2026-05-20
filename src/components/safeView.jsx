// SaveAreaView.jsx
import { View } from "@tarojs/components";
import { getSafeArea } from "../service/safeArea";
import { useState, useEffect } from "react";
import Taro from "@tarojs/taro";
import TabBar from "./TabBar";

export default function SaveAreaView({ children, currentPath, className }) {
	const [tabBarHeight, setTabBarHeight] = useState(50); // 默认高度 50px，避免闪烁
	const safeArea = getSafeArea(); // { top, bottom }

	const getTabBarHeight = () => {
		const query = Taro.createSelectorQuery();
		query.select(".tab-bar").boundingClientRect();
		query.exec((res) => {
			if (res[0] && res[0].height) {
				setTabBarHeight(res[0].height);
			}
		});
	};

	useEffect(() => {
		setTimeout(getTabBarHeight, 100);
		Taro.eventCenter.on("resize", getTabBarHeight);
		return () => {
			Taro.eventCenter.off("resize", getTabBarHeight);
		};
	}, []);

	return (
		<>
			<View
				style={{
					height: "100%",
					width: "100%",
					minHeight: "100vh", // 占满视口
					display: "flex",
					flexDirection: "column",
					paddingTop: `${safeArea.top}px`,
					paddingBottom: `${tabBarHeight + (safeArea.bottom || 0)}px`, // 底部留出 TabBar 高度
					paddingLeft: "8px",
					paddingRight: "8px",
					background: `linear-gradient(to bottom, rgb(71,165,253) 0%, rgb(255,255,255) 40%)`,
					boxSizing: "border-box",
				}}
				className={`${className}`}
			>
				{children}
			</View>
			<TabBar currentPath={currentPath} />
		</>
	);
}
