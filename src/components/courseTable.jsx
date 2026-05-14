import { View } from "@tarojs/components";
import { useEffect, useState } from "react";
import { getAllSchedule } from "../service/hubt/AllSchedule";
import { getTimeTable } from "../service/hubt/GetTimeTable";
import TimeColumn from "./courseTImeColumn.jsx";
import CourseGrid from "./courseGrid";
import "./courseTable.css";

// 工具函数：字符串哈希
function getHashCode(str) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
}

function getColorFromName(courseName) {
	const hue = getHashCode(courseName) % 360;
	return `hsl(${hue}, 70%, 55%)`;
}

export default function CourseTable({ currentWeek }) {
	const [courses, setCourses] = useState([]);
	const [timeTable, setTimeTable] = useState([]);
	const [gridCourses, setGridCourses] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Promise.all([
			getAllSchedule("2025-2026-2"),
			getTimeTable("2025-2026-2"),
		])
			.then(([scheduleData, timeData]) => {
				setCourses(scheduleData);
				setTimeTable(timeData);
			})
			.catch((err) => console.error("获取课表失败", err))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		if (loading || !currentWeek || !timeTable.length || !courses.length)
			return;

		const periodIndexMap = {};
		timeTable.forEach((item, idx) => {
			periodIndexMap[parseInt(item.jc)] = idx;
		});

		const weekCourses = courses.filter((course) =>
			course.zcstr?.some(
				(weekNum) => parseInt(weekNum) === parseInt(currentWeek),
			),
		);

		const gridItems = weekCourses
			.map((course, idx) => {
				const weekDay = parseInt(course.xingqi);
				const colIndex = weekDay - 1;
				const periods = course.djc.map((p) => parseInt(p));
				if (!periods.length) return null;
				const startPeriod = Math.min(...periods);
				const endPeriod = Math.max(...periods);
				const startRow = periodIndexMap[startPeriod];
				const endRow = periodIndexMap[endPeriod];
				if (startRow === undefined || endRow === undefined) return null;
				const rowSpan = endRow - startRow + 1;
				return {
					id: `${course.kcmc}_${course.xingqi}_${startPeriod}_${idx}`,
					name: course.kcmc,
					room: course.croommc,
					teacher: course.tmc,
					col: colIndex,
					row: startRow,
					rowSpan: rowSpan,
					color: getColorFromName(course.kcmc),
					kcxz: course.kcxz || "未知",
					xf: course.xf || "未知",
					jxbzc:course.jxbzc || "未知",
					weeks: course.zcstr ? course.zcstr.join(",") : "未知",
					periods: course.djc.join(","),
					weekDay: course.xingqi,
				};
			})
			.filter((item) => item !== null);

		setGridCourses(gridItems);
	}, [currentWeek, courses, timeTable, loading]);

	const rowCount = timeTable.length;

	if (loading || rowCount === 0) {
		return <View className="course-table-loading">加载课表中...</View>;
	}

	return (
		<View className="course-table">
			<View className="grid-container">
				<TimeColumn timeTable={timeTable} />
				<CourseGrid gridCourses={gridCourses} />
			</View>
		</View>
	);
}
