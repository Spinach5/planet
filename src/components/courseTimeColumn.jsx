import { View } from "@tarojs/components";
import TimeSlot from "./courseTimeSlot";
import "./courseTimeColumn.css"

export default function TimeColumn({ timeTable }) {
  return (
    <View className="time-container">
      {timeTable.map((item, idx) => (
        <TimeSlot
          key={`time-${idx}`}
          startTime={item.startTime}
          endTime={item.endTime}
          order={`${item.jc}`}
        />
      ))}
    </View>
  );
}
