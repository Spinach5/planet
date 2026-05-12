import { View } from "@tarojs/components";
import "./TimeSlot.scss"; // 可选样式文件，也可直接使用内联样式

/**
 * 课程时间段组件
 * @param {string} className - 外部传入的样式类名
 * @param {string} startTime - 开始时间
 * @param {string} endTime   - 结束时间
 * @param {string|number} order - 课程次序
 */
export default function TimeSlot({
	className = "",
	startTime,
	endTime,
	order,
}) {
	return (
		<View
			className={`time-slot ${className}`}
		>
			<View
				className="start-time"
			>
				{startTime}
			</View>
			<View
				className="order"
			>
				{order}
			</View>
			<View
				className="end-time"
			>
				{endTime}
			</View>
		</View>
	);
}
