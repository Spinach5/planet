import { View } from "@tarojs/components";
import GridItem from "./GridItem";

// 功能入口配置数据
const gridItems = [
	{ url: "/modules/pages/student/index", icon: "school", text: "学生会" },
	{ url: "/modules/pages/club/index", icon: "account-group", text: "社团" },
	{ url: "/modules/pages/food/index", icon: "food-variant", text: "美食" },
	{ url: "/modules/pages/affair/index", icon: "office-building", text: "行政事务" },
	{ url: "/modules/pages/muyu/index", icon: "music-circle", text: "电子木鱼" },
	{ url: "/modules/pages/daily/index", icon: "clipboard-text-outline", text: "考试" },
	{ url: "/modules/pages/map/index", icon: "map", text: "地图" },
	{ url: "/modules/pages/book/index", icon: "book-open-page-variant", text: "书籍" },
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
