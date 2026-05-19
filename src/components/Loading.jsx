import { View, Text } from "@tarojs/components";
import { AtIcon } from "taro-ui";

export default function Loading({ text = "加载中..." }) {
	return (
		<View
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				position: "fixed", // 固定定位，覆盖全屏
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				zIndex: 9999,
			}}
		>
			<AtIcon
				value="loading"
				size="99"
				className="spin-icon"
				style={{ marginBottom: "12px" }}
			/>
			<Text style={{ fontSize: "28px", color: "#333" }}>{text}</Text>
		</View>
	);
}
