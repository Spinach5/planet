// components/courseGrid.jsx
import { View, Text } from "@tarojs/components";
import "./courseGrid.css";
import { getBgFromColor } from "../utils/getHashCode";

export default function CourseGrid({ gridCourses, rowCount = 1, onCardClick }) {
  // 不再需要内部 modal 状态，直接通过 props 传递点击事件
  return (
    <View
      className="course-grid-container"
    >
      {gridCourses.map((course) => (
        <View
          key={course.id}
          className="course-card"
          style={{
            gridColumn: course.col + 1,
            gridRow: `${course.row + 1} / span ${course.rowSpan}`,
            backgroundColor: getBgFromColor(course.color),
          }}
          onClick={() => onCardClick && onCardClick(course)} // 调用父组件传入的回调
        >
          <Text className="course-name" style={{ color: course.color }}>
            {course.name}
          </Text>
          <Text className="course-room" style={{ color: course.color }}>
            {course.room}
          </Text>
        </View>
      ))}
    </View>
  );
}
