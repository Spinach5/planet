import { View } from "@tarojs/components";
import GridItem from "./gridItem";

const IconClass = {
	studentIcon:"fa fa-users",
	clubIcon:"fa fa-binoculars",
	foodIcon:"fa fa-cutlery",
	bookIcon:"fa fa-book",
	adminIcon:"fa fa-archive",
	dailyIcon:"fa fa-cubes",
	mapIcon:"fa fa-map-marker",
	secondHandIcon:"fa fa-book"
};
// 功能图标统一导入


// 功能入口配置数据
const gridItems = [
	{ url: "", icon: "close-circle", text: "学生会" },
	{ url: "/modules/pages/club/index", icon: "close-circle", text: "社团" },
	{ url: "", icon: "close-circle", text: "美食" },
	{ url: "", icon: "close-circle", text: "行政事务" },
	{ url: "", icon: "close-circle", text: "书籍资料" },
	{ url: "", icon: "close-circle", text: "日常用品" },
	{ url: "", icon: "close-circle", text: "地图" },
	{ url: "", icon: "close-circle", text: "二手书" },
];

export default function GridContainer({ className = "" }) {
	return (
		<View
			className={`${className}`}
			style={{
				display: "grid",
				gridTemplateColumns: "repeat(4, 1fr)",
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
