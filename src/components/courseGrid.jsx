import { View, Text } from "@tarojs/components";
import "./courseGrid.css";
import { getBgFromColor } from "../utils/getHashCode";

export default function CourseGrid({ gridCourses, rowCount = 1, onCardClick }) {
	const safeCourses = gridCourses || [];

	// 1. 生成所有空白单元格（7列 x rowCount行）
	const allCells = [];
	for (let row = 0; row < rowCount; row++) {
		for (let col = 0; col < 7; col++) {
			allCells.push(
				<View
					key={`cell-${row}-${col}`}
					className="grid-cell"
					style={{
						gridColumn: col + 1,
						gridRow: row + 1,
					}}
				/>,
			);
		}
	}

	// 2. 课程卡片（覆盖在空白单元格上）
	const cards = safeCourses.map((course) => (
		<View
			key={course.id}
			className="course-card"
			style={{
				gridColumn: course.col + 1,
				gridRow: `${course.row + 1} / span ${course.rowSpan}`,
				backgroundColor: getBgFromColor(course.color),
			}}
			onClick={() => onCardClick && onCardClick(course)}
		>
			<Text className="course-name" style={{ color: course.color }}>
				{course.name}
			</Text>
			<Text className="course-room" style={{ color: course.color }}>
				{course.room}
			</Text>
		</View>
	));

	return process.env.TARO_ENV === "h5" ? (
		<View
			className="course-grid-container"
			style={{
				gridTemplateColumns: "repeat(8, 1fr)",
			}}
		>
			{allCells}
			{cards}
		</View>
	) : (
		<View
			className="course-grid-container"
			style={{
				gridTemplateColumns: "repeat(7, 1fr)",
			}}
		>
			{allCells}
			{cards}
		</View>
	);
}
