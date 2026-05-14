import { View } from "@tarojs/components";
import TimeSlot from "./courseTimeSlot";

export default function TimeColumn({ timeTable }) {
  return (
    <>
      {timeTable.map((item, idx) => (
        <View
          key={`time-${idx}`}
          style={{
            gridColumn: 1,
            gridRow: idx + 1,
          }}
        >
          <TimeSlot
            startTime={item.startTime}
            endTime={item.endTime}
            order={`${item.jc}`}
          />
        </View>
      ))}
    </>
  );
}
