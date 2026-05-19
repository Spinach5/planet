// components/CourseHeader.jsx
import { View, Text, ScrollView } from "@tarojs/components";
import { useState, useEffect } from "react";
import Btn from "./Btn";
import { getAllWeek } from "../service/hubt/GetAllWeek";
import { AtIcon } from "taro-ui";

export default function CourseHeader({
	currentSemester,
	currentWeek,
	onWeekChange,
	className = "",
	onRefresh,
	onSelectSemester,
	onAddCourse,
}) {
	const [weekList, setWeekList] = useState([]);
	const [showPicker, setShowPicker] = useState(false);
	const [showFunctionMenu, setShowFunctionMenu] = useState(false);

	useEffect(() => {
		getAllWeek(currentSemester).then((list) => setWeekList(list || []));
	}, [currentSemester]);

	const handleSelectWeek = (week) => {
		setShowPicker(false);
		onWeekChange?.(week);
	};

	const closePicker = () => setShowPicker(false);
	const closeFunctionMenu = () => setShowFunctionMenu(false);

	const functionList = [
		{ func: "刷新课表", icon: "repeat-play" },
		{ func: "选择学期", icon: "tag" },
		{ func: "添加课程", icon: "add" },
	];

	const handleFunctionClick = (funcName) => {
		if (funcName === "刷新课表") onRefresh?.();
		else if (funcName === "选择学期") onSelectSemester?.();
		else if (funcName === "添加课程") onAddCourse?.();
		closeFunctionMenu();
	};

	return (
		<>
			<View
				className={className}
				style={{
					padding: "4px",
					marginBottom: "16px",
					height: "40px",
					display: "flex",
					gap: "18px",
					alignItems: "center",
				}}
			>
				<Btn onClick={() => setShowFunctionMenu(true)}>
					<AtIcon value="bullet-list" size={20} />
				</Btn>
				<Btn onClick={() => setShowPicker(true)}>
					<Text>第{currentWeek ?? "?"}周</Text>
					<AtIcon value="chevron-down" size={20} />
				</Btn>
			</View>

			{/* 功能菜单 */}
			{showFunctionMenu && (
				<View
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "transparent",
						zIndex: 1000,
					}}
					onClick={closeFunctionMenu}
				>
					<View
						style={{
							position: "absolute",
							top: "60px",
							left: "16px",
							backgroundColor: "#fff",
							borderRadius: "12px",
							boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
							padding: "8px 0",
							minWidth: "140px",
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{functionList.map((item, index) => (
							<View
								key={index}
								style={{
									padding: "12px 16px",
									display: "flex",
									alignItems: "center",
									gap: "12px",
									borderBottom:
										index < functionList.length - 1
											? "1px solid #f0f0f0"
											: "none",
									cursor: "pointer",
								}}
								onClick={() => handleFunctionClick(item.func)}
							>
								<AtIcon
									value={item.icon}
									size={20}
									style={{ width: "24px" }}
								/>
								<View
									className={item.icon}
									style={{ fontSize: "20px", width: "24px" }}
								/>
								<Text
									style={{ fontSize: "28px", color: "#333" }}
								>
									{item.func}
								</Text>
							</View>
						))}
					</View>
				</View>
			)}

			{/* 周数选择弹窗 */}
			{showPicker && (
				<View
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "rgba(0,0,0,0.5)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 1001,
					}}
					onClick={closePicker}
				>
					<View
						style={{
							width: "80%",
							maxWidth: "500px",
							backgroundColor: "#fff",
							borderRadius: "16px",
							overflow: "hidden",
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<View
							style={{
								textAlign: "center",
								padding: "16px",
								fontSize: "30px",
								fontWeight: "bold",
								color: "#000",
							}}
						>
							选择周数
						</View>
						<ScrollView
							scrollY
							enhanced
							showScrollbar={false}
							style={{ maxHeight: "400px" }}
						>
							<View style={{ padding: "16px" }}>
								<View
									style={{
										display: "grid",
										gridTemplateColumns: "repeat(6, 1fr)",
										gap: "12px",
									}}
								>
									{weekList.map((week) => {
										const isSelected = currentWeek === week;
										return (
											<View
												key={week}
												onClick={() =>
													handleSelectWeek(week)
												}
												style={{
													aspectRatio: "1 / 1",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													borderRadius: "8px",
													backgroundColor: isSelected
														? "#fff"
														: "#47a5fd",
													border: isSelected
														? "2px solid #47a5fd"
														: "none",
													color: isSelected
														? "#47a5fd"
														: "#fff",
													fontSize: "20px",
													fontWeight: "bold",
													cursor: "pointer",
												}}
											>
												{week}
											</View>
										);
									})}
								</View>
							</View>
						</ScrollView>
					</View>
				</View>
			)}
		</>
	);
}
