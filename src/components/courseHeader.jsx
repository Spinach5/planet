// components/CourseHeader.jsx
import { View, Text, Picker } from "@tarojs/components";
import { useState, useEffect } from "react";
import Btn from "./Btn";
import { AtIcon } from "taro-ui";
import WeekSelectorModal from "./WeekSelectorModal";
import AddCourseModal from "./AddCourseModal";
import SemesterPicker from "./SemesterSelector";
import "./courseHeader.css";

export default function CourseHeader({
	currentSemester,
	currentWeek,
	onWeekChange,
	onRefresh,
	onAddCourseConfirm, // 添加课程确认回调，接收 schedule 对象，返回 Promise
	semesterList = [], // 新增：学期列表
	onSemesterChange, // 新增：学期切换回调
}) {
	const [showWeekPicker, setShowWeekPicker] = useState(false);
	const [showFunctionMenu, setShowFunctionMenu] = useState(false);
	const [showAddModal, setShowAddModal] = useState(false);

	// 获取学期列表（用于选择学期）
	useEffect(() => {
		if (!currentSemester) return;
		// 假设父组件已经传入学期列表或自己获取，这里为了简洁，在点击选择学期时动态获取
	}, []);

	const handleSelectWeek = (week) => {
		setShowWeekPicker(false);
		onWeekChange?.(week);
	};

	const handleFunctionClick = (funcName) => {
		if (funcName === "刷新课表") onRefresh?.();
		// 移除原有的“选择学期”分支，因为现在由 SemesterPicker 直接处理
		else if (funcName === "添加课程") setShowAddModal(true);
		setShowFunctionMenu(false);
	};

	const handleAddCourse = async (schedule) => {
		if (onAddCourseConfirm) {
			await onAddCourseConfirm(schedule);
		}
	};

	return (
		<>
			<View className="header-content">
				<Btn onClick={() => setShowFunctionMenu(true)}>
					<AtIcon value="bullet-list" size={20} />
				</Btn>
				<SemesterPicker
					semesterList={semesterList}
					currentSemester={currentSemester}
					onChange={onSemesterChange}
				>
					<Btn>
						<Text>{currentSemester ?? "选择学期"}</Text>
						<AtIcon value="chevron-down" size={20} />
					</Btn>
				</SemesterPicker>
				<Btn onClick={() => setShowWeekPicker(true)}>
					<Text>第{currentWeek ?? "?"}周</Text>
					<AtIcon value="chevron-down" size={20} />
				</Btn>
			</View>
			{/* 功能菜单 */}
			{showFunctionMenu && (
				<View
					className="menu-mask"
					onClick={() => setShowFunctionMenu(false)}
				>
					<View
						className="menu-popup"
						onClick={(e) => e.stopPropagation()}
					>
						{[
							{ func: "刷新课表", icon: "repeat-play" },
							{ func: "添加课程", icon: "add" },
						].map((item, index) => (
							<View
								key={index}
								className="menu-item"
								onClick={() => handleFunctionClick(item.func)}
							>
								<AtIcon
									value={item.icon}
									size={20}
									style={{ width: "24px" }}
								/>
								<Text className="menu-text">{item.func}</Text>
							</View>
						))}
					</View>
				</View>
			)}

			{/* 周数选择弹窗 */}
			<WeekSelectorModal
				visible={showWeekPicker}
				semester={currentSemester}
				onSelect={handleSelectWeek}
				onClose={() => setShowWeekPicker(false)}
			/>

			{/* 添加课程弹窗 */}
			<AddCourseModal
				visible={showAddModal}
				onClose={() => setShowAddModal(false)}
				onConfirm={handleAddCourse}
				semester={currentSemester}
			/>
		</>
	);
}
