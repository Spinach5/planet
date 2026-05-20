import { View, ScrollView } from "@tarojs/components";
import Taro, { useLoad } from "@tarojs/taro";
import "./index.css";
import SafeAreaView from "../../../components/safeView";
import HeadStatus from "../../../components/headStatus";
import InputBar from "../../../components/InputBar";
import CategoryFilter from "../../../components/CategoryFilter";
import Loading from "../../../components/Loading";
import { useState, useEffect } from "react";
import { AtIcon } from "taro-ui";
import { getAllClub } from "../../../service/clubs";

export default function Index() {
	const [clubs, setClubs] = useState([]);
	const [clubcategory, setClubCategory] = useState([]);
	const [currentcategory, setCurrentCategory] = useState(-1);
	const [searchWhat, setSearchWhat] = useState("");
	const [clubsDataReady, setClubsDataReady] = useState(false);
	useLoad(async () => {
		const clubData = await getAllClub();
		setClubs(clubData.club);
		setClubCategory(clubData.clubcategory);
		setClubsDataReady(true);
	});
	// useEffect(() => {
	// 	console.log(clubs); // 当 clubs 更新时会打印最新值
	// }, [clubs]);

	const card = (club) => {
		return (
			<View key={club.id} className="club-card">
				<View>{club.name}</View>
				<View className="content-row">
					<View className="label">简介：</View>
					<View className="value">{club.introduction}</View>
				</View>
				<View className="content-row">
					<View className="label">活动：</View>
					<View className="value">{club.activities}</View>
				</View>
			</View>
		);
	};
	if (!clubsDataReady) {
				return (
					<SafeAreaView>
						<Loading text="加载社团数据中..." />
					</SafeAreaView>
				);
			}
	return (

		<SafeAreaView>
			{/* 返回按钮 */}
			<AtIcon
				value="arrow-left"
				color="#ffffff"
				onClick={() => Taro.switchTab({ url: "/pages/index/index" })}
			/>
			{/* 标题 */}
			<HeadStatus text="社团" />

			<View className="header">
				{/* 搜索组件 */}
				<InputBar
					placeholder="搜索社团"
					onInput={(input) => {
						setSearchWhat(input);
					}}
				></InputBar>
				{/* 分类选择器 */}
				<CategoryFilter
					allText="全部"
					categories={clubcategory}
					onChange={(category) => {
						setCurrentCategory(category);
					}}
				/>
			</View>

			{/* 卡片 */}
			<ScrollView
				scrollY
				showScrollbar={false}
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "10px",
				}}
				enhanced
				bounces={false}
			>
				{clubs.length > 0 ? (
					clubs.map(
						(club) =>
							(currentcategory == -1 ||
								currentcategory == club.category) &&
							club.name.includes(searchWhat) &&
							card(club),
					)
				) : (
					<View>暂无社团数据</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
