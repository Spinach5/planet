import { View } from "@tarojs/components";
import GridItem from "./gridItem";
// 功能图标统一导入
import studentIcon from "../assets/8个功能/Workgroup.png";
import clubIcon from "../assets/8个功能/社团.png";
import foodIcon from "../assets/8个功能/餐饮.png";
import adminIcon from "../assets/8个功能/行政地标.png";
import bookIcon from "../assets/8个功能/手绘书本.png";
import dailyIcon from "../assets/8个功能/日常用品.png";
import mapIcon from "../assets/8个功能/世界地图.png";
import secondHandIcon from "../assets/8个功能/书本.png";

// 功能入口配置数据
const gridItems = [
	{ url: "", icon: studentIcon, text: "学生会" },
	{ url: "", icon: clubIcon, text: "社团" },
	{ url: "", icon: foodIcon, text: "美食" },
	{ url: "", icon: adminIcon, text: "行政事务" },
	{ url: "", icon: bookIcon, text: "书籍资料" },
	{ url: "", icon: dailyIcon, text: "日常用品" },
	{ url: "", icon: mapIcon, text: "地图" },
	{ url: "", icon: secondHandIcon, text: "二手书" },
];

export default function GridContainer({ className = "" }) {
	return (
		<View
			className={`grid-container ${className}`}
			style={{
				display: "flex",
				flexWrap: "wrap",
				gap: "10px",
				padding: "15px",
				background: "#fff",
				borderRadius: "16px",
			}}
		>
			{gridItems.map((item, index) => (
				<GridItem
					key={index}
					url={item.url}
					icon={item.icon}
					text={item.text}
				/>
			))}
		</View>
	);
}
