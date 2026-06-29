import { MaterialIcon } from "@/components/base/MaterialIcon";
import { ThemedText } from "@/components/themed/ThemedText";
import { useTheme } from "@/hooks/use-theme";
import { getAllSchedule } from "@/service/hubt/AllSchedule";
import { getSemesterList } from "@/service/hubt/CurrentSemester";
import { getCurrentWeek } from "@/service/hubt/CurrentWeek";
import { getExtroInfo } from "@/service/hubt/ExtroInfo";
import { getAllWeek } from "@/service/hubt/GetAllWeek";
import { getTimeTable } from "@/service/hubt/GetTimeTable";
import { login } from "@/service/hubt/login";
import userManager from "@/service/userInfo";
import { runtimeLogger } from "@/utils/runtimeLogger";
import type { CourseCleaned } from "@/utils/hbut/courseHelper";
import type { ClassTime } from "@/utils/hbut/timeHelper";
import { useToast } from "@/utils/toast";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function getHashCode(str: string): number {
  let hash = 0;
  for (const ch of str) {
    hash = (hash << 5) - hash + ch.charCodeAt(0);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getColorFromName(courseName: string): string {
  const hue = getHashCode(courseName) % 360;
  return `hsl(${String(hue)}, 70%, 55%)`;
}

function getBgFromColor(color: string): string {
  const result = /hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/.exec(color);
  if (!result) return "rgba(200,200,200,0.2)";
  const hue = parseInt(result[1]);
  return `hsl(${String(hue)}, 80%, 85%)`;
}

interface GridCourse {
  id: string;
  name: string;
  room: string;
  teacher: string;
  col: number;
  row: number;
  rowSpan: number;
  color: string;
  kcxz: string;
  xf: string;
  jxbzc: string;
  weeks: string;
  periods: string;
  weekDay: string;
}

interface PracticeItem {
  jxbzc: string;
  kcmc: string;
  xkrs: string;
  zcstr: string;
  zjname: string;
}

function computeWeekDates(
  currentWeek: number | null,
  weekDataList: Array<{ zc: string; rqfw?: string }>,
): {
  currentMonth: number;
  weekDates: Array<{ date: number; month: number; weekStr: string }>;
} {
  const weekStrMap = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

  // Find the matching week entry by currentWeek to get rqfw
  const entry =
    currentWeek !== null
      ? weekDataList.find((w) => Number(w.zc) === currentWeek)
      : undefined;

  if (entry?.rqfw) {
    // Parse rqfw like "03.02-03.08" → { month: 3, day: 2 }
    const [startStr] = entry.rqfw.split("-");
    const parts = startStr.split(".");
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = new Date().getFullYear();
    const startDate = new Date(year, month - 1, day);

    const dates: Array<{ date: number; month: number; weekStr: string }> = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dates.push({
        date: d.getDate(),
        month: d.getMonth() + 1,
        weekStr: weekStrMap[i],
      });
    }
    return { currentMonth: month, weekDates: dates };
  }

  // Fallback: use today's dates (when no rqfw available)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysToMonday);

  const fallbackDates: Array<{ date: number; month: number; weekStr: string }> =
    [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    fallbackDates.push({
      date: d.getDate(),
      month: d.getMonth() + 1,
      weekStr: weekStrMap[i],
    });
  }
  return { currentMonth: monday.getMonth() + 1, weekDates: fallbackDates };
}

// Week picker modal
function WeekPickerModal({
  visible,
  weekList,
  currentWeek,
  onSelect,
  onClose,
}: {
  visible: boolean;
  weekList: number[];
  currentWeek: number;
  onSelect: (week: number) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={wpm.backdrop}>
        <Pressable style={wpm.backdropTap} onPress={onClose} />
        <View style={wpm.centered}>
          <View style={wpm.content}>
            <Text style={wpm.title}>选择周数</Text>
            <ScrollView style={wpm.scrollArea}>
              <View style={wpm.grid}>
                {weekList.map((week) => {
                  const isSelected = currentWeek === week;
                  return (
                    <TouchableOpacity
                      key={week}
                      style={[
                        wpm.weekItem,
                        { backgroundColor: isSelected ? "#fff" : "#47a5fd" },
                        isSelected ? wpm.weekItemSel : undefined,
                      ]}
                      onPress={() => {
                        onSelect(week);
                      }}
                    >
                      <Text
                        style={[
                          wpm.weekText,
                          { color: isSelected ? "#47a5fd" : "#fff" },
                        ]}
                      >
                        {week}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const wpm = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    pointerEvents: "box-none",
  },
  content: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: "60%",
  },
  title: {
    textAlign: "center",
    padding: 16,
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  scrollArea: { maxHeight: 400 },
  grid: { flexDirection: "row", flexWrap: "wrap", padding: 16, gap: 12 },
  weekItem: {
    width: "14%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  weekItemSel: { borderWidth: 2, borderColor: "#47a5fd" },
  weekText: { fontSize: 16, fontWeight: "bold" },
});

// Semester picker modal
function SemesterPickerModal({
  visible,
  semesterList,
  currentSemester,
  onSelect,
  onClose,
}: {
  visible: boolean;
  semesterList: string[];
  currentSemester: string;
  onSelect: (sem: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={sp.backdrop}>
        <Pressable style={sp.backdropTap} onPress={onClose} />
        <View style={sp.centered}>
          <View style={sp.content}>
            <Text style={sp.title}>选择学期</Text>
            <ScrollView style={sp.scrollArea}>
              {semesterList.map((sem) => {
                const selected = currentSemester === sem;
                return (
                  <TouchableOpacity
                    key={sem}
                    style={[sp.item, selected && { backgroundColor: "#e8f4fd" }]}
                    onPress={() => {
                      onSelect(sem);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        sp.itemText,
                        selected && { color: "#47a5fd", fontWeight: "700" },
                      ]}
                    >
                      {sem}
                    </Text>
                    {selected ? <Text style={sp.check}>✓</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const sp = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    pointerEvents: "box-none",
  },
  content: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: "60%",
  },
  title: {
    textAlign: "center",
    padding: 16,
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  scrollArea: { maxHeight: 400 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  itemText: { fontSize: 16, color: "#333" },
  check: { fontSize: 18, color: "#47a5fd", fontWeight: "700" },
});

// Week header
function WeekHeader({
  currentMonth,
  weekDates,
  dayWidth,
}: {
  currentMonth: number;
  weekDates: Array<{ date: number; month: number; weekStr: string }>;
  dayWidth: number;
}) {
  const theme = useTheme();
  const todayDate = new Date();
  const isToday = (item: { date: number; month: number }): boolean =>
    item.date === todayDate.getDate() &&
    item.month === todayDate.getMonth() + 1;

  return (
    <View style={wh.container}>
      <View style={wh.row}>
        {/* Left spacer matching TimeColumn width */}
        <View style={[wh.monthBox, { width: 40 }]}>
          <Text style={[wh.monthNum, { color: theme.text }]}>
            {currentMonth}
          </Text>
          <Text style={[wh.monthUnit, { color: theme.text }]}>月</Text>
        </View>
        {weekDates.map((item) => {
          const today = isToday(item);
          return (
            <View
              key={item.weekStr}
              style={[
                wh.dayBox,
                { width: dayWidth },
                today
                  ? { backgroundColor: theme.surface, borderRadius: 8 }
                  : undefined,
              ]}
            >
              <Text
                style={[
                  wh.dayNum,
                  today ? { color: "#007aff" } : { color: theme.text },
                ]}
              >
                {item.date}
              </Text>
              <Text
                style={[
                  wh.dayWeek,
                  today ? { color: "#007aff" } : { color: theme.text },
                ]}
              >
                {item.weekStr}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const wh = StyleSheet.create({
  container: { width: "100%", marginBottom: 4 },
  row: { flexDirection: "row", backgroundColor: "transparent" },
  monthBox: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  monthNum: { fontSize: 18, fontWeight: "bold" },
  monthUnit: { fontSize: 11, fontWeight: "bold" },
  dayBox: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 0,
  },
  dayNum: { fontSize: 18, fontWeight: "bold" },
  dayWeek: { fontSize: 12 },
});

// Course detail modal
function CourseDetailModal({
  visible,
  course,
  onClose,
}: {
  visible: boolean;
  course: GridCourse | null;
  onClose: () => void;
}) {
  if (!course) return null;
  const details = [
    { label: "课程名称", value: course.name },
    { label: "教师", value: course.teacher },
    { label: "教室", value: course.room },
    { label: "课程性质", value: course.kcxz },
    { label: "学分", value: course.xf },
    { label: "教学班组成", value: course.jxbzc },
    { label: "周次", value: course.weeks },
    { label: "节次", value: course.periods },
    { label: "星期", value: `星期${course.weekDay}` },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={cdm.backdrop}>
        <Pressable style={cdm.backdropTap} onPress={onClose} />
        <View style={cdm.centered}>
          <View style={cdm.content}>
            <Text style={cdm.title}>课程信息</Text>
            <ScrollView style={cdm.scrollBody}>
              {details.map((d) => (
                <View key={d.label} style={cdm.row}>
                  <Text style={cdm.label}>{d.label}：</Text>
                  <Text style={cdm.value}>{d.value || "未知"}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={cdm.closeBtn} onPress={onClose}>
              <Text style={cdm.closeText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const cdm = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    pointerEvents: "box-none",
  },
  content: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    maxHeight: "80%",
  },
  title: {
    textAlign: "center",
    padding: 12,
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  scrollBody: { flexShrink: 1 },
  closeBtn: {
    marginTop: 10,
    paddingTop: 10,
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eee",
  },
  closeText: { color: "#47a5fd", fontSize: 16, fontWeight: "600" },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
  },
  label: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
    width: 80,
    flexShrink: 0,
  },
  value: { fontSize: 14, color: "#555", flex: 1, textAlign: "right" },
});

function TimeColumn({ timeTable }: { timeTable: ClassTime[] }) {
  const theme = useTheme();
  return (
    <View style={tc.column}>
      {timeTable.map((item) => (
        <View
          key={`time-${item.jc}`}
          style={[tc.cell, { borderBottomColor: theme.backgroundElement }]}
        >
          <Text
            style={[tc.time, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {item.startTime}
          </Text>
          <Text style={[tc.order, { color: theme.text }]}>{item.jc}</Text>
          <Text
            style={[tc.time, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {item.endTime}
          </Text>
        </View>
      ))}
    </View>
  );
}

const tc = StyleSheet.create({
  column: { width: 40, flexShrink: 0 },
  cell: {
    height: 62,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    overflow: "hidden",
  },
  time: {
    fontSize: 10,
  },
  order: {
    fontSize: 15,
    fontWeight: "bold",
  },
});

// Practice notes card
function PracticeCard({ data }: { data: PracticeItem[] }) {
  const theme = useTheme();
  if (!data || data.length === 0) {
    return (
      <View style={[pc.card, { backgroundColor: theme.surface }]}>
        <Text style={pc.empty}>无</Text>
      </View>
    );
  }

  return (
    <View style={[pc.card, { backgroundColor: theme.surface }]}>
      {data.map((item, idx) => (
        <View
          key={`${item.kcmc}-${String(idx)}`}
          style={[pc.item, { borderBottomColor: theme.backgroundElement }]}
        >
          <View style={pc.itemLeft}>
            <Text
              style={{ fontSize: 14, fontWeight: "600", color: theme.text }}
            >
              {item.kcmc}
            </Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>
              指导老师: {item.zjname}
            </Text>
          </View>
          <View style={pc.itemRight}>
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>
              周次: {item.zcstr}
            </Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>
              人数: {item.xkrs}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const pc = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 8,
  },
  empty: { fontSize: 14, color: "#999", textAlign: "center", padding: 8 },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemLeft: { flex: 1 },
  itemRight: { alignItems: "flex-end" },
  name: { fontSize: 14, fontWeight: "600", color: "#333" },
  zj: { fontSize: 12, color: "#888", marginTop: 2 },
  meta: { fontSize: 12, color: "#888" },
});

function computeGridCourses(
  currentWeek: number,
  courses: CourseCleaned[],
  timeTable: ClassTime[],
): GridCourse[] {
  const periodIndexMap: Record<number, number> = {};
  timeTable.forEach((item, idx) => {
    periodIndexMap[parseInt(item.jc)] = idx;
  });

  const weekCourses = courses.filter((course) =>
    course.zcstr.some((weekNum) => weekNum === currentWeek),
  );

  const items: GridCourse[] = [];
  for (const [idx, course] of weekCourses.entries()) {
    const weekDay = parseInt(course.xingqi);
    const colIndex = weekDay - 1;
    const periods = course.djc;
    if (!periods.length) continue;
    const startPeriod = Math.min(...periods);
    const endPeriod = Math.max(...periods);
    const startRow = periodIndexMap[startPeriod];
    const endRow = periodIndexMap[endPeriod];
    if (startRow === undefined || endRow === undefined) continue;

    items.push({
      id: `${course.kcmc}_${course.xingqi}_${String(startPeriod)}_${String(idx)}`,
      name: course.kcmc,
      room: course.croommc,
      teacher: course.tmc,
      col: colIndex,
      row: startRow,
      rowSpan: endRow - startRow + 1,
      color: getColorFromName(course.kcmc),
      kcxz: course.kcxz || "未知",
      xf: course.xf || "未知",
      jxbzc: course.jxbzc || "未知",
      weeks: course.zcstr.join(","),
      periods: course.djc.join(","),
      weekDay: course.xingqi,
    });
  }
  return items;
}

export default function CourseScreen() {
  const theme = useTheme();
  const { showToast } = useToast();
  const isDark = theme.background === "#000000";
  const gradientColors: [string, ...string[]] = isDark
    ? ["rgb(26,29,46)", "rgb(35,39,64)", "rgb(26,29,46)"]
    : ["#47a5fd", "#cce5ff", "#f2f5f9"];

  const [isLoggedIn, setIsLoggedIn] = useState(userManager.checkLogin());
  const [semesterList, setSemesterList] = useState<string[]>([]);
  const [currentSemester, setCurrentSemester] = useState("");
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);
  const [realCurrentWeek, setRealCurrentWeek] = useState<number | null>(null); // 当前真实的周数，用于"返回本周"
  const [isCurrentSemester, setIsCurrentSemester] = useState(false);
  const [weekList, setWeekList] = useState<number[]>([]);
  interface WeekDataItem {
    zc: string;
    rqfw?: string;
  }
  const [weekDataList, setWeekDataList] = useState<WeekDataItem[]>([]);
  const [courses, setCourses] = useState<CourseCleaned[]>([]);
  const [timeTable, setTimeTable] = useState<ClassTime[]>([]);
  const [practiceData, setPracticeData] = useState<PracticeItem[]>([]);
  const [gridCourses, setGridCourses] = useState<GridCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<GridCourse | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [showSemesterPicker, setShowSemesterPicker] = useState(false);
  const initialized = useRef(false);

  // Keep swipe-accessible refs in sync
  const weekListRef = useRef<number[]>([]);
  weekListRef.current = weekList;
  const currentWeekRef = useRef<number | null>(null);
  currentWeekRef.current = currentWeek;
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  // PanResponder for horizontal swipe to change weeks
  const weekSwipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, gs) => {
        return Math.abs(gs.dx) > 20 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5;
      },
      onPanResponderRelease: (_e, gs) => {
        const list = weekListRef.current;
        const week = currentWeekRef.current;
        if (list.length === 0 || week === null) return;
        const curIdx = list.indexOf(week);
        if (gs.dx < -40) {
          if (curIdx < list.length - 1) {
            setCurrentWeek(list[curIdx + 1]);
          } else {
            showToastRef.current({ message: '已到达最后一周', type: 'warning' });
          }
        } else if (gs.dx > 40) {
          if (curIdx > 0) {
            setCurrentWeek(list[curIdx - 1]);
          } else {
            showToastRef.current({ message: '已到达第一周', type: 'warning' });
          }
        }
      },
    }),
  ).current;

  // Refresh login status on focus
  useFocusEffect(
    useCallback(() => {
      const loggedIn = userManager.checkLogin();
      setIsLoggedIn(loggedIn);
    }, []),
  );

  // Initialize: load semester list
  useEffect(() => {
    if (!isLoggedIn) return;
    if (initialized.current) return;
    initialized.current = true;

    void (async () => {
      try {
        const list = await getSemesterList();
        setSemesterList(list);
        if (list.length > 0) {
          const latest = list[list.length - 1];
          setCurrentSemester(latest);
          setIsCurrentSemester(true);
        }
      } catch (err) {
        runtimeLogger.error('Course', '获取学期列表失败', err);
      }
    })();
  }, [isLoggedIn]);

  // Load week list when semester changes
  useEffect(() => {
    if (!isLoggedIn || !currentSemester) return;
    void (async () => {
      try {
        const [week, weeksRaw] = await Promise.all([
          getCurrentWeek(),
          getAllWeek(currentSemester),
        ]);
        const weeksNum = weeksRaw.map((w) => parseInt(w.zc, 10));
        setWeekList(weeksNum);
        setWeekDataList(weeksRaw as WeekDataItem[]);
        const weekNum = Number(week); // defensive: getCurrentWeek may return string from old cache
        // 只有当前学期才用实际周数，非当前学期默认第一周
        if (isCurrentSemester) {
          setRealCurrentWeek(weekNum);
          const validWeek = weeksNum.includes(weekNum)
            ? weekNum
            : (weeksNum[0] ?? 1);
          setCurrentWeek(validWeek);
        } else {
          setRealCurrentWeek(null);
          setCurrentWeek(weeksNum[0] ?? 1);
        }
      } catch (err) {
        runtimeLogger.error('Course', '获取当前周数/周次列表失败', err);
      }
    })();
  }, [isLoggedIn, currentSemester]);

  // Load schedule, timetable, practice data when semester changes
  useEffect(() => {
    if (!isLoggedIn || !currentSemester) return;
    setLoading(true);
    void (async () => {
      try {
        const [scheduleData, timeData, extroData] = await Promise.all([
          getAllSchedule(false, currentSemester),
          getTimeTable(currentSemester),
          getExtroInfo(currentSemester),
        ]);
        setCourses(scheduleData);
        setTimeTable(timeData);
        setPracticeData(extroData);
      } catch (err) {
        runtimeLogger.error('Course', '加载课表/时间表/备注失败', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoggedIn, currentSemester]);

  // Compute grid courses
  useEffect(() => {
    if (loading || currentWeek === null || !timeTable.length || !courses.length)
      return;
    const items = computeGridCourses(currentWeek, courses, timeTable);
    setGridCourses(items);
  }, [currentWeek, courses, timeTable, loading]);

  const handleRefresh = useCallback(() => {
    if (!isLoggedIn || !currentSemester) return;
    setLoading(true);
    void (async () => {
      try {
        const [scheduleData, timeData, extroData] = await Promise.all([
          getAllSchedule(true, currentSemester),
          getTimeTable(currentSemester),
          getExtroInfo(currentSemester, true),
        ]);
        setCourses(scheduleData);
        setTimeTable(timeData);
        setPracticeData(extroData);
        showToast({ message: "刷新成功", type: "success" });
      } catch (err) {
        runtimeLogger.error('Course', '刷新课表失败', err);

        // Try auto re-login — session cookies may have expired
        const { stuId, password } = userManager.getAccount();
        if (stuId && password) {
          runtimeLogger.info('Course', '检测到请求失败，尝试自动重新登录恢复会话...');
          try {
            const loginResult = await login(stuId, password);
            if (loginResult.success) {
              runtimeLogger.info('Course', '自动重新登录成功，重试刷新课表');
              try {
                const [scheduleData, timeData, extroData] = await Promise.all([
                  getAllSchedule(true, currentSemester),
                  getTimeTable(currentSemester),
                  getExtroInfo(currentSemester, true),
                ]);
                setCourses(scheduleData);
                setTimeTable(timeData);
                setPracticeData(extroData);
                showToast({ message: "刷新成功", type: "success" });
                return;
              } catch (retryErr) {
                runtimeLogger.error('Course', '重新登录后刷新仍失败', retryErr);
              }
            } else {
              runtimeLogger.warn('Course', `自动重新登录失败: ${loginResult.message}`);
            }
          } catch (reloginErr) {
            runtimeLogger.error('Course', '自动重新登录异常', reloginErr);
          }
        } else {
          runtimeLogger.warn('Course', '无可用登录凭据（App 重启后需手动登录），无法自动恢复会话');
        }

        showToast({ message: "刷新失败，请尝试重新登录", type: "error" });
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoggedIn, currentSemester, showToast]);

  if (!isLoggedIn) {
    return (
      <View style={st.container}>
        <LinearGradient
          colors={gradientColors}
          locations={[0, 0.28, 1]}
          style={st.gradient}
        >
          <SafeAreaView style={st.safeArea} edges={["top"]}>
            <View style={st.center}>
              <ThemedText style={st.loadText} themeColor="textSecondary">
                请先登录
              </ThemedText>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  if (loading && !courses.length) {
    return (
      <View style={st.container}>
        <LinearGradient
          colors={gradientColors}
          locations={[0, 0.28, 1]}
          style={st.gradient}
        >
          <SafeAreaView style={st.safeArea} edges={["top"]}>
            <View style={st.center}>
              <ThemedText style={st.loadText} themeColor="textSecondary">
                加载课表中...
              </ThemedText>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  if (loading && gridCourses.length === 0) {
    return (
      <View style={st.container}>
        <LinearGradient
          colors={gradientColors}
          locations={[0, 0.28, 1]}
          style={st.gradient}
        >
          <SafeAreaView style={st.safeArea} edges={["top"]}>
            <View style={st.center}>
              <ThemedText style={st.loadText} themeColor="textSecondary">
                加载中...
              </ThemedText>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  const dayWidth = (SCREEN_WIDTH - 40) / 7;
  const { currentMonth, weekDates } = computeWeekDates(
    currentWeek,
    weekDataList,
  );
  const CELL_H = 62;
  const gridHeight = timeTable.length * CELL_H;

  return (
    <View style={st.container}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.28, 1]}
        style={st.gradient}
      >
        <SafeAreaView style={st.safeArea} edges={["top"]}>
          {/* Header: semester, week, refresh in one row */}
          <View style={st.header}>
            <TouchableOpacity
              style={[st.btn, { backgroundColor: theme.surface }]}
              onPress={handleRefresh}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#47a5fd" />
              ) : (
                <MaterialIcon name="refresh" size={20} color="#47a5fd" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                st.btn,
                st.semesterBtn,
                { backgroundColor: theme.surface },
              ]}
              onPress={() => setShowSemesterPicker(true)}
            >
              <ThemedText style={st.btnText} numberOfLines={1}>
                {currentSemester || "学期"}
              </ThemedText>
              <MaterialIcon
                name="chevron-down"
                size={14}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[st.btn, st.weekBtn, { backgroundColor: theme.surface }]}
              onPress={() => setShowWeekPicker(true)}
            >
              <ThemedText style={st.btnText}>第{currentWeek}周</ThemedText>
              <MaterialIcon
                name="chevron-down"
                size={14}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <WeekHeader
            currentMonth={currentMonth}
            weekDates={weekDates}
            dayWidth={dayWidth}
          />

          {/* Outer vertical scroll containing both grid and notes */}
          <ScrollView
            style={st.outerScroll}
            contentContainerStyle={st.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Horizontal scroll for the grid (7 cols) — swipe left/right to change week */}
            <View style={st.tableH}>
              <View style={{ flexDirection: "row" }}>
                <TimeColumn timeTable={timeTable} />
                {/* Swipe detector — PanResponder handles horizontal swipes, taps pass through */}
                <View
                  style={{
                    width: dayWidth * 7,
                    height: gridHeight,
                    position: "relative",
                  }}
                  {...weekSwipeResponder.panHandlers}
                >
                  {/* Course cards */}
                  {gridCourses.map((course) => (
                    <TouchableOpacity
                      key={course.id}
                      style={[
                        st.courseCard,
                        {
                          left: course.col * dayWidth + 2,
                          top: course.row * CELL_H + 2,
                          width: dayWidth - 4,
                          height: course.rowSpan * CELL_H - 4,
                          backgroundColor: getBgFromColor(course.color),
                        },
                      ]}
                      onPress={() => {
                        setSelectedCourse(course);
                        setShowDetail(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[st.courseName, { color: course.color }]}
                        numberOfLines={3}
                      >
                        {course.name}
                      </Text>
                      <Text
                        style={[st.courseRoom, { color: course.color }]}
                        numberOfLines={2}
                      >
                        {course.room}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Practice notes / 备注 */}
            <View style={st.remarkSection}>
              <ThemedText style={st.remarkTitle}>备注</ThemedText>
              <PracticeCard data={practiceData} />
            </View>
          </ScrollView>

          <WeekPickerModal
            visible={showWeekPicker}
            weekList={weekList}
            currentWeek={currentWeek}
            onSelect={(week) => {
              setShowWeekPicker(false);
              setCurrentWeek(week);
            }}
            onClose={() => setShowWeekPicker(false)}
          />
          <SemesterPickerModal
            visible={showSemesterPicker}
            semesterList={semesterList}
            currentSemester={currentSemester}
            onSelect={(sem) => {
              setShowSemesterPicker(false);
              setIsCurrentSemester(
                sem === semesterList[semesterList.length - 1],
              );
              setCurrentSemester(sem);
            }}
            onClose={() => setShowSemesterPicker(false)}
          />
          <CourseDetailModal
            visible={showDetail}
            course={selectedCourse}
            onClose={() => setShowDetail(false)}
          />
          {/* 悬浮返回本周按钮 */}
          {isCurrentSemester &&
          realCurrentWeek !== null &&
          currentWeek !== null &&
          currentWeek !== realCurrentWeek &&
          weekList.includes(realCurrentWeek) ? (
            <TouchableOpacity
              style={st.fabBtn}
              onPress={() => setCurrentWeek(realCurrentWeek)}
              activeOpacity={0.8}
            >
              <MaterialIcon name="arrow-left" size={18} color="#fff" />
            </TouchableOpacity>
          ) : null}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const st = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadText: { marginTop: 12, fontSize: 16 },
  header: {
    flexDirection: "row",
    paddingHorizontal: 4,
    paddingVertical: 6,
    marginBottom: 8,
    gap: 8,
    alignItems: "center",
  },
  btn: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  semesterBtn: { flexShrink: 1, minWidth: 0 },
  weekBtn: { flexShrink: 0 },
  btnText: { fontSize: 14, fontWeight: "bold", flexShrink: 1 },
  outerScroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  tableH: { flexGrow: 0 },
  courseCard: {
    position: "absolute",
    borderRadius: 2,
    padding: 5,
    overflow: "hidden",
    zIndex: 2,
  },
  courseName: {
    fontWeight: "bold",
    fontSize: 8,
    lineHeight: 12,
    marginBottom: 4,
  },
  courseRoom: { fontSize: 8, marginTop: "auto" },
  remarkSection: { paddingHorizontal: 12, paddingVertical: 20 },
  fabBtn: {
    position: "absolute",
    bottom: 100,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#47a5fd",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  remarkTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
});
