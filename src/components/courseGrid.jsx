import { View, Text, ScrollView} from "@tarojs/components";
import "./courseGrid.css";
import { useState } from "react";
/**
 * 课表卡片背景,将颜色变淡（提高亮度、降低饱和度）
 * @param {string} color - 格式如 "hsl(120, 70%, 55%)"
 * @returns {string} 变淡后的颜色，格式 "hsl(hue, 30%, 85%)" 或带透明度
 */
function getBgFromColor(color) {
	// 匹配 hsl(数字, 数字%, 数字%)
	const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
	if (!match) return "rgba(200,200,200,0.2)"; // 降级

	const hue = parseInt(match[1]);
	// 原饱和度一般为70%，变淡后降到 30% 左右
	const sat = 90;
	// 原亮度一般为55%，变淡后提高到 85% 左右
	const light = 85;

	// 如果需要半透明背景，可以在后面加上 alpha，例如：
	// return `hsla(${hue}, ${sat}%, ${light}%, 0.8)`;
	// 如果不需透明，直接返回 hsl
	return `hsl(${hue}, ${sat}%, ${light}%)`;
}

export default function CourseGrid({ gridCourses }) {
	const [modalVisible, setModalVisible] = useState(false);
	const [currentCourse, setCurrentCourse] = useState(null);

	const openModal = (course) => {
		setCurrentCourse(course);
		setModalVisible(true);
	};

	const closeModal = () => {
		setModalVisible(false);
		setCurrentCourse(null);
	};
	return (
		<>
			{gridCourses.map((course) => (
				<View
					key={course.id}
					className="course-card"
					style={{
						gridColumn: course.col + 2,
						gridRow: `${course.row + 1} / span ${course.rowSpan}`,
						backgroundColor: getBgFromColor(course.color),
					}}
					onClick={() => openModal(course)}
				>
					<Text
						className="course-name"
						style={{
							color: course.color,
						}}
					>
						{course.name}
					</Text>
					<Text
						className="course-room"
						style={{
							color: course.color,
						}}
					>
						{course.room}
					</Text>
				</View>
			))}
			{/* 弹窗 */}
			{modalVisible && currentCourse && (
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
						zIndex: 1000,
					}}
					onClick={closeModal}
				>
					<View
						style={{
							width: "80%",
							maxWidth: "500px",
							backgroundColor: "#fff",
							borderRadius: "16px",
							overflow: "hidden",
							padding:"10px"
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{/* 标题 */}
						<View
							style={{
								textAlign: "center",
								padding: "16px",
								fontSize: "30px",
								fontWeight: "bold",
								color: "#000",
							}}
						>
							课程信息
						</View>

						{/* 可滚动内容 */}
						<ScrollView
							scrollY
							style={{
								maxHeight: "60vh",
								padding: "5px",
							}}
						>
							<View
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "12px",
								}}
							>
								<DetailRow
									label="课程名称"
									value={currentCourse.name}
								/>
								<DetailRow
									label="教师"
									value={currentCourse.teacher}
								/>
								<DetailRow
									label="教室"
									value={currentCourse.room}
								/>
								<DetailRow
									label="课程性质"
									value={currentCourse.kcxz}
								/>
								<DetailRow
									label="学分"
									value={currentCourse.xf}
								/>
								<DetailRow
									label="教学班组成"
									value={currentCourse.jxbzc}
								/>
								<DetailRow
									label="周次"
									value={currentCourse.weeks}
								/>
								<DetailRow
									label="节次"
									value={currentCourse.periods}
								/>
								<DetailRow
									label="星期"
									value={`星期${currentCourse.weekDay}`}
								/>
							</View>
						</ScrollView>
					</View>
				</View>
			)}
		</>
	);
}
function DetailRow({ label, value }) {
  const displayValue = value && value !== 'undefined' ? value : '未知';
  return (
    <View style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
      <Text style={{ fontWeight: "bold", fontSize: "16px", color: "#333", flexShrink: 0 }}>{label}：</Text>
      <Text style={{ fontSize: "16px", color: "#555", flex: 1, textAlign: "left", wordBreak: "break-word", whiteSpace: "normal",}}>{displayValue}</Text>
    </View>
  );
}
