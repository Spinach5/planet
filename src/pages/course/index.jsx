// pages/course/index.jsx
import { useState, useEffect } from "react";
import { View, Swiper, SwiperItem, ScrollView, Text} from "@tarojs/components";
import SafeAreaView from "../../components/safeView";
import CourseHeader from "../../components/courseHeader";
import WeekHeader from "../../components/courseWeek";
import TimeColumn from "../../components/courseTimeColumn";
import CourseGrid from "../../components/courseGrid";
import { getCurrentWeek } from "../../service/hubt/CurrentWeek";
import { getAllWeek } from "../../service/hubt/GetAllWeek";
import { getAllSchedule } from "../../service/hubt/AllSchedule";
import { getTimeTable } from "../../service/hubt/GetTimeTable";
import { getColorFromName } from "../../utils/getHashCode";
import "./index.css";

export default function Index() {
  const [currentWeek, setCurrentWeek] = useState(null);
  const [weekList, setWeekList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeTable, setTimeTable] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weeksData, setWeeksData] = useState({});
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

  // 获取周次
  useEffect(() => {
    Promise.all([getCurrentWeek(), getAllWeek()])
      .then(([week, weeks]) => {
        setWeekList(weeks);
        setCurrentWeek(week);
        const idx = weeks.indexOf(week);
        setCurrentIndex(idx >= 0 ? idx : 0);
      })
      .catch(err => console.error(err));
  }, []);

  // 获取基础数据
  useEffect(() => {
    Promise.all([
      getAllSchedule("2025-2026-2"),
      getTimeTable("2025-2026-2"),
    ])
      .then(([scheduleData, timeData]) => {
        setCourses(scheduleData);
        setTimeTable(timeData);
        setLoading(false);
      })
      .catch(err => {
        console.error("获取课表失败", err);
        setLoading(false);
      });
  }, []);

  // 预处理所有周的课程网格数据
  useEffect(() => {
    if (loading || weekList.length === 0 || timeTable.length === 0 || courses.length === 0) return;

    const periodIndexMap = {};
    timeTable.forEach((item, idx) => {
      periodIndexMap[parseInt(item.jc)] = idx;
    });

    const newData = {};
    weekList.forEach(week => {
      const weekCourses = courses.filter(course =>
        course.zcstr?.some(w => parseInt(w) === parseInt(week))
      );
      const gridItems = weekCourses
        .map((course, idx) => {
          const weekDay = parseInt(course.xingqi);
          const colIndex = weekDay - 1;
          const periods = course.djc.map(p => parseInt(p));
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
            jxbzc: course.jxbzc || "未知",
            weeks: course.zcstr ? course.zcstr.join(",") : "未知",
            periods: course.djc.join(","),
            weekDay: course.xingqi,
          };
        })
        .filter(item => item !== null);
      newData[week] = gridItems;
    });
    setWeeksData(newData);
  }, [loading, weekList, timeTable, courses]);

  const handleWeekChange = (week) => {
    const idx = weekList.indexOf(week);
    if (idx !== -1) {
      setCurrentIndex(idx);
      setCurrentWeek(week);
    }
  };

  const onSwiperChange = (e) => {
    const idx = e.detail.current;
    const week = weekList[idx];
    if (week && week !== currentWeek) {
      setCurrentIndex(idx);
      setCurrentWeek(week);
    }
  };

  if (loading || !currentWeek || weekList.length === 0 || timeTable.length === 0) {
    return <View>加载中...</View>;
  }

  return (
    <SafeAreaView>
      <CourseHeader currentWeek={currentWeek} onWeekChange={handleWeekChange} />
      <WeekHeader currentWeek={currentWeek} />

      {/* 外层垂直滚动容器，使时间列和课表同步滚动 */}
      <ScrollView scrollY className="outer-scroll">
        <View className="schedule-row">
          {/* 左侧固定时间列 */}
          <View className="time-col-fixed">
            <TimeColumn timeTable={timeTable} />
          </View>

          {/* 右侧可水平滑动的 Swiper */}
          <View className="swiper-col">
            <Swiper
              current={currentIndex}
              onChange={onSwiperChange}
              className="week-swiper"
            >
              {weekList.map(week => (
                <SwiperItem key={week}>
                  <CourseGrid
                    gridCourses={weeksData[week] || []}
                    rowCount={timeTable.length}
					onCardClick={openModal}
                  />
                </SwiperItem>
              ))}
            </Swiper>
          </View>
        </View>
      </ScrollView>
	        {modalVisible && currentCourse && (
        <View className="course-info" onClick={closeModal}>
          <View
            style={{
              width: "80%",
              maxWidth: "500px",
              backgroundColor: "#fff",
              borderRadius: "16px",
              overflow: "hidden",
              padding: "10px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
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
                <DetailRow label="课程名称" value={currentCourse.name} />
                <DetailRow label="教师" value={currentCourse.teacher} />
                <DetailRow label="教室" value={currentCourse.room} />
                <DetailRow label="课程性质" value={currentCourse.kcxz} />
                <DetailRow label="学分" value={currentCourse.xf} />
                <DetailRow label="教学班组成" value={currentCourse.jxbzc} />
                <DetailRow label="周次" value={currentCourse.weeks} />
                <DetailRow label="节次" value={currentCourse.periods} />
                <DetailRow label="星期" value={`星期${currentCourse.weekDay}`} />
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
function DetailRow({ label, value }) {
  const displayValue = value && value !== "undefined" ? value : "未知";
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <Text
        style={{
          fontWeight: "bold",
          fontSize: "16px",
          color: "#333",
          flexShrink: 0,
        }}
      >
        {label}：
      </Text>
      <Text
        style={{
          fontSize: "16px",
          color: "#555",
          flex: 1,
          textAlign: "left",
          wordBreak: "break-word",
          whiteSpace: "normal",
        }}
      >
        {displayValue}
      </Text>
    </View>
  );
}
