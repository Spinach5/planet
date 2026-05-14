import { View, Text } from "@tarojs/components";
import { useEffect, useState } from "react";
import "./courseWeek.css";
import { getCurrentWeek } from "../service/hubt/CurrentWeek";

/**
 * 根据基准周一日期和目标周数偏移计算目标周一的日期
 * @param {Date} baseMonday 基准周一（今天的周一）
 * @param {number} diffWeeks 目标周数 - 实际周数
 * @returns {Date}
 */
const getTargetMonday = (baseMonday, diffWeeks) => {
	const target = new Date(baseMonday);
	target.setDate(baseMonday.getDate() + diffWeeks * 7);
	return target;
};

/**
 * 根据周一的日期，生成一周的日期数组
 * @param {Date} mondayDate 周一日期
 * @returns {Array<{ date: number, month: number, weekStr: string, fullDate: Date }>}
 */
const getWeekDatesFromMonday = (mondayDate) => {
	const weekDays = [];
	const weekStrMap = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
	for (let i = 0; i < 7; i++) {
		const day = new Date(mondayDate);
		day.setDate(mondayDate.getDate() + i);
		weekDays.push({
			date: day.getDate(),
			month: day.getMonth() + 1,
			weekStr: weekStrMap[i],
			fullDate: day,
		});
	}
	return weekDays;
};

export default function WeekHeader({ currentWeek, className = "" }) {
	const [currentMonth, setCurrentMonth] = useState(0);
	const [weekDates, setWeekDates] = useState([]);
	const [todayDate, setTodayDate] = useState(null);
	const [actualWeek, setActualWeek] = useState(null);

	useEffect(() => {
		getCurrentWeek().then((week) => setActualWeek(week));
		setTodayDate(new Date());
	}, []);

	useEffect(() => {
		if (actualWeek === null || currentWeek === undefined) return;
		const today = new Date();
		const dayOfWeek = today.getDay();
		const daysToMonday = (dayOfWeek + 6) % 7;
		const actualMonday = new Date(today);
		actualMonday.setDate(today.getDate() - daysToMonday);
		const diff = currentWeek - actualWeek;
		const targetMonday = new Date(actualMonday);
		targetMonday.setDate(actualMonday.getDate() + diff * 7);
		const weekData = getWeekDatesFromMonday(targetMonday);
		setWeekDates(weekData);
		setCurrentMonth(targetMonday.getMonth() + 1);
	}, [currentWeek, actualWeek]);

	const isToday = (dateItem) => {
		if (!todayDate) return false;
		return (
			dateItem.date === todayDate.getDate() &&
			dateItem.month === todayDate.getMonth() + 1 &&
			dateItem.fullDate.getFullYear() === todayDate.getFullYear()
		);
	};

	return (
		<View className="week-header">
			{/* 使用 Grid 布局，列宽定义与 CourseTable 完全一致 */}
			<View
				className="week-grid"
				style={{
					display: "grid",
					gridTemplateColumns: "12.5% repeat(7, 1fr)",
				}}
			>
				<View className="month-box">
					<Text className="month-number">{currentMonth}</Text>
					<Text className="month-unit">月</Text>
				</View>
				{weekDates.map((item, idx) => (
					<View
						key={idx}
						className={`week-day-box ${isToday(item) ? "today" : ""}`}
					>
						<Text className="day-number">{item.date}</Text>
						<Text className="day-week">{item.weekStr}</Text>
					</View>
				))}
			</View>
		</View>
	);
}
