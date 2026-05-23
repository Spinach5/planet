import { View, ScrollView } from "@tarojs/components";
import { useState, useEffect } from "react";
import { getCurrentWeek, getAllWeek, getSemesterList } from "../service";
import "./WeekSelectorModal.css";

export default function WeekSelectorModal({
  visible,
  semester,
  onSelect,
  onClose,
}) {
  const [currentWeek, setCurrentWeek] = useState(null);
  const [weekList, setWeekList] = useState([]);
  const [isCurrentSemester, setIsCurrentSemester] = useState(false);

  useEffect(() => {
    if (!visible || !semester) return;
    Promise.all([getCurrentWeek(), getAllWeek(semester), getSemesterList()])
      .then(([week, weeks, semesters]) => {
        setCurrentWeek(week);
        setWeekList(weeks);
        const latestSemester = semesters[semesters.length - 1];
        setIsCurrentSemester(semester === latestSemester);
      })
      .catch((err) => {
        console.error("获取周选择数据失败", err);
      });
  }, [visible, semester]);

  if (!visible) return null;

  return (
    <View className="modal-mask" onClick={onClose}>
      <View className="modal-container" onClick={(e) => e.stopPropagation()}>
        <View className="modal-title">选择周数</View>
        <ScrollView
          scrollY
          enhanced
          showScrollbar={false}
          style={{ maxHeight: "400px" }}
        >
            <View className="week-grid-modal">
              {weekList.map((week) => {
                const isSelected =
                  currentWeek === week && isCurrentSemester;
                return (
                  <View
                    key={week}
                    className={`week-item ${isSelected ? "selected" : ""}`}
                    onClick={() => onSelect(week)}
                  >
                    {week}
                  </View>
                );
              })}
            </View>
        </ScrollView>
      </View>
    </View>
  );
}
