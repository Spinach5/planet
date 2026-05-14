// TimeSlot.jsx
import { View } from "@tarojs/components";
import './courseTimeSlot.css'

export default function TimeSlot({ startTime, endTime, order}) {
  return (
    <View className="time-slot">
      <View className="class-time">
        {startTime}
      </View>
      <View className="order">
        {order}
      </View>
      <View className="class-time">
        {endTime}
      </View>
    </View>
  );
}
