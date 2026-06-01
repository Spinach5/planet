import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./GridItem.css";
import { AtIcon } from "taro-ui";
import { MaterialCommunityIcons } from "taro-icons";
import runtimeLogger from "../utils/runtimeLogger";

export default function GridItem({
  url,
  icon,
  text='无',
  className = '',
  onClick=()=>{},
  navigate = true,
  navigateType = 'navigateTo'
}) {

const handleClick = async () => {
  if (!navigate) return
  if (!url) {
    console.warn('url is required for navigate')
    Taro.showToast({title: '功能正在开发中', icon: 'none', duration: 1500})
    return
  }

		try {
			switch (navigateType) {
				case "navigateTo":
					await Taro.navigateTo({ url }); // 加上 await
					break;
				case "redirectTo":
					await Taro.redirectTo({ url });
					break;
				case "reLaunch":
					await Taro.reLaunch({ url });
					break;
				case "switchTab":
					await Taro.switchTab({ url });
					break;
				default:
					await Taro.navigateTo({ url });
			}
		} catch (error) {
			runtimeLogger.error("Navigate", `跳转失败: ${url}`, error);
			// 如果页面不存在会进入这里
			Taro.showToast({
				title: "功能正在开发中",
				icon: "none",
				duration: 1500,
			});
		}
	};
	return (
		<View className={`my-item ${className}`}>
			<View className="icon-wrapper" onClick={handleClick}>
				<MaterialCommunityIcons
					name={`${icon}`}
					className="grid-icon"
					color="#47a5fd"
					size={50}
				/>
			</View>
			<Text className="grid-text">{text}</Text>
		</View>
	);
}
