/* eslint-disable react/jsx-indent-props */
import { View } from "@tarojs/components";
import { getSafeArea } from "../utils/safeArea";

export default function SafeAreaView({ children, className = "" }) {
	console.log("SafeAreaView 开始渲染");

	// getSafeArea 返回的是 { top, bottom } 直接对象
	const { top: cachedTop, bottom: cachedBottom } = getSafeArea();
	console.log("读取到的安全距离:", { cachedTop, cachedBottom });

	const top = cachedTop;
	const bottom = cachedBottom;

	return (
		<View
			className={className}
			style={{
				paddingTop: `${top}px`,
				paddingBottom: `${bottom}px`,
				paddingLeft: "8px",
				paddingRight: "8px",
				// minHeight: '100vh',
				background: `linear-gradient(to bottom, rgba(71,165,253,1.00) 0%, rgba(255,255,255,0) 40%)`,
			}}
		>
			{children}
		</View>
	);
}
