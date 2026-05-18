// pages/course/index.jsx (完整修改版)
import { useState, useEffect, useCallback, useRef } from "react";
import { View, Swiper, SwiperItem, ScrollView, Text } from "@tarojs/components";
import { useRouter, useDidShow } from "@tarojs/taro";
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
import { getCurrentSemester } from "../../service/hubt/CurrentSemester";
import userManager from "../../service/userInfo";
import "./index.css";

const DetailRow = ({ label, value }) => {
  const displayValue = value && value !== "undefined" ? value : "未知";
  return (
    <View style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
      <Text style={{ fontWeight: "bold", fontSize: "16px", color: "#333", flexShrink: 0 }}>{label}：</Text>
      <Text style={{ fontSize: "16px", color: "#555", flex: 1, textAlign: "left", wordBreak: "break-word", whiteSpace: "normal" }}>{displayValue}</Text>
    </View>
  );
};

export default function Index() {
  const router = useRouter();
  const currentPath = router.path.split("?")[0];

  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [semester, setSemester] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [weekList, setWeekList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeTable, setTimeTable] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weeksData, setWeeksData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);

  const openModal = useCallback((course) => {
    setCurrentCourse(course);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setCurrentCourse(null);
  }, []);

  // 重置所有课表数据（清空内存）
  const resetCourseData = useCallback(() => {
    setSemester(null);
    setCurrentWeek(null);
    setWeekList([]);
    setCurrentIndex(0);
    setTimeTable([]);
    setCourses([]);
    setLoading(true);
    setWeeksData({});
    setModalVisible(false);
    setCurrentCourse(null);
  }, []);

  // 检测登录状态
  const checkLoginStatus = useCallback(() => {
    try {
      const loggedIn = userManager.checkLogin();
      if (loggedIn && !isLoggedIn) {
        // 从未登录/未知 变为 已登录：清空旧数据，等待 useEffect 重新加载
        resetCourseData();
        setIsLoggedIn(true);
      } else if (!loggedIn && isLoggedIn === true) {
        // 从已登录变为未登录：清空数据，切换界面
        resetCourseData();
        setIsLoggedIn(false);
      } else if (isLoggedIn === null) {
        setIsLoggedIn(loggedIn);
        if (!loggedIn) resetCourseData();
      }
    } catch (error) {
      console.error("获取登录状态失败", error);
      if (isLoggedIn === true) resetCourseData();
      setIsLoggedIn(false);
    }
  }, [isLoggedIn, resetCourseData]);

  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  useDidShow(() => {
    checkLoginStatus();
  });

  // 以下是原有依赖 isLoggedIn 的各个 useEffect，保持不变
  useEffect(() => {
    if (!isLoggedIn) return;
    getCurrentSemester()
      .then((currentSemester) => setSemester(currentSemester))
      .catch((err) => {
        console.error("获取学期失败", err);
        setSemester("");
      });
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    Promise.all([getCurrentWeek(), getAllWeek()])
      .then(([week, weeks]) => {
        setWeekList(weeks);
        setCurrentWeek(week);
        const idx = weeks.indexOf(week);
        setCurrentIndex(idx >= 0 ? idx : 0);
      })
      .catch((err) => {
        console.error("获取周次失败", err);
        setWeekList([]);
      });
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || semester === null) return;
    setLoading(true);
    Promise.all([getAllSchedule(false, semester), getTimeTable(semester)])
      .then(([scheduleData, timeData]) => {
        setCourses(scheduleData || []);
        setTimeTable(timeData || []);
      })
      .catch((err) => {
        console.error("获取课表失败", err);
        setCourses([]);
        setTimeTable([]);
      })
      .finally(() => setLoading(false));
  }, [isLoggedIn, semester]);

  useEffect(() => {
    if (!isLoggedIn || loading || weekList.length === 0 || timeTable.length === 0 || courses.length === 0) return;
    const periodIndexMap = {};
    timeTable.forEach((item, idx) => { periodIndexMap[parseInt(item.jc)] = idx; });
    const newData = {};
    for (const week of weekList) {
      const weekCourses = courses.filter((course) => course.zcstr?.some((w) => parseInt(w) === parseInt(week)));
      const gridItems = weekCourses.map((course, idx) => {
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
          rowSpan,
          color: getColorFromName(course.kcmc),
          kcxz: course.kcxz || "未知",
          xf: course.xf || "未知",
          jxbzc: course.jxbzc || "未知",
          weeks: course.zcstr ? course.zcstr.join(",") : "未知",
          periods: course.djc.join(","),
          weekDay: course.xingqi,
        };
      }).filter(item => item !== null);
      newData[week] = gridItems;
    }
    setWeeksData(newData);
  }, [isLoggedIn, loading, weekList, timeTable, courses]);

  const handleWeekChange = useCallback((week) => {
    const idx = weekList.indexOf(week);
    if (idx !== -1 && idx !== currentIndex) {
      setCurrentIndex(idx);
      setCurrentWeek(week);
    }
  }, [weekList, currentIndex]);

  const onSwiperChange = useCallback((e) => {
    const idx = e.detail.current;
    const week = weekList[idx];
    if (week && week !== currentWeek) {
      setCurrentIndex(idx);
      setCurrentWeek(week);
    }
  }, [weekList, currentWeek]);

  if (isLoggedIn === null) {
    return (
      <SafeAreaView currentPath={currentPath}>
        <View className="loading-container"><View className="loading-text">加载中...</View></View>
      </SafeAreaView>
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView currentPath={currentPath}>
        <View style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center"}}>
          <Text style={{ fontSize: "80px", fontWeight: "bold", textAlign: "center", color: "#333" }}>请先登录!</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isLoading = loading || semester === null || !currentWeek || weekList.length === 0 || timeTable.length === 0;
  if (isLoading) {
    return (
      <SafeAreaView currentPath={currentPath}>
        <View className="loading-container"><View className="loading-text">加载中...</View></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView currentPath={currentPath}>
      <CourseHeader currentWeek={currentWeek} onWeekChange={handleWeekChange} />
      <WeekHeader currentWeek={currentWeek} />
      <ScrollView scrollY className="outer-scroll">
        <View className="schedule-row">
          <View className="time-col-fixed"><TimeColumn timeTable={timeTable} /></View>
          <View className="swiper-col">
            <Swiper current={currentIndex} onChange={onSwiperChange} className="week-swiper" circular={false} autoplay={false} indicatorDots={false}>
              {weekList.map((week) => (
                <SwiperItem key={week}>
                  <CourseGrid gridCourses={weeksData[week] || []} rowCount={timeTable.length} onCardClick={openModal} />
                </SwiperItem>
              ))}
            </Swiper>
          </View>
        </View>
      </ScrollView>
      {modalVisible && currentCourse && (
        <View className="course-info" onClick={closeModal}>
          <View style={{ width: "80%", maxWidth: "500px", backgroundColor: "#fff", borderRadius: "16px", overflow: "hidden", padding: "10px" }} onClick={(e) => e.stopPropagation()}>
            <View style={{ textAlign: "center", padding: "16px", fontSize: "30px", fontWeight: "bold", color: "#000" }}>课程信息</View>
            <ScrollView scrollY style={{ maxHeight: "60vh", padding: "5px" }}>
              <View style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
