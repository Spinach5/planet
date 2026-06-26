import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentWeek } from '@/service/hubt/CurrentWeek';
import { getAllWeek } from '@/service/hubt/GetAllWeek';
import { getAllSchedule } from '@/service/hubt/AllSchedule';
import { getTimeTable } from '@/service/hubt/GetTimeTable';
import type { ClassTime } from '@/utils/hbut/timeHelper';
import type { CourseCleaned } from '@/utils/hbut/courseHelper';
import userManager from '@/service/userInfo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  if (!result) return 'rgba(200,200,200,0.2)';
  const hue = parseInt(result[1]);
  return `hsl(${String(hue)}, 90%, 85%)`;
}

interface GridCourse {
  id: string; name: string; room: string; teacher: string;
  col: number; row: number; rowSpan: number; color: string;
  kcxz: string; xf: string; jxbzc: string;
  weeks: string; periods: string; weekDay: string;
}

function computeWeekDates(): { currentMonth: number; weekDates: Array<{ date: number; month: number; weekStr: string }> } {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysToMonday);
  const targetMonday = new Date(monday);

  const weekStrMap = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const weekDates: Array<{ date: number; month: number; weekStr: string }> = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(targetMonday);
    day.setDate(targetMonday.getDate() + i);
    weekDates.push({ date: day.getDate(), month: day.getMonth() + 1, weekStr: weekStrMap[i] });
  }

  return { currentMonth: targetMonday.getMonth() + 1, weekDates };
}

// Week picker modal
function WeekPickerModal({
  visible,
  weekList,
  currentWeek: _currentWeek,
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={wpm.overlay} activeOpacity={1} onPress={onClose}>
        <View style={wpm.content} onStartShouldSetResponder={() => true}>
          <Text style={wpm.title}>选择周数</Text>
          <ScrollView style={wpm.scrollArea}>
            <View style={wpm.grid}>
              {weekList.map((week) => {
                const isSelected = _currentWeek === week;
                return (
                  <TouchableOpacity
                    key={week}
                    style={[
                      wpm.weekItem,
                      { backgroundColor: isSelected ? '#fff' : '#47a5fd' },
                      isSelected ? wpm.weekItemSel : undefined,
                    ]}
                    onPress={() => { onSelect(week); }}
                  >
                    <Text style={[wpm.weekText, { color: isSelected ? '#47a5fd' : '#fff' }]}>
                      {week}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const wpm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  content: { width: '80%', maxWidth: 500, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', maxHeight: '60%' },
  title: { textAlign: 'center', padding: 16, fontSize: 18, fontWeight: 'bold', color: '#000' },
  scrollArea: { maxHeight: 400 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  weekItem: { width: '14%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  weekItemSel: { borderWidth: 2, borderColor: '#47a5fd' },
  weekText: { fontSize: 16, fontWeight: 'bold' },
});

// Week header - receives pre-computed data
function WeekHeader({
  currentMonth,
  weekDates,
}: {
  currentMonth: number;
  weekDates: Array<{ date: number; month: number; weekStr: string }>;
}) {
  const todayDate = new Date();
  const isToday = (item: { date: number; month: number }): boolean =>
    item.date === todayDate.getDate() && item.month === todayDate.getMonth() + 1;

  return (
    <View style={wh.container}>
      <View style={wh.row}>
        <View style={wh.monthBox}>
          <Text style={wh.monthNum}>{currentMonth}</Text>
          <Text style={wh.monthUnit}>月</Text>
        </View>
        {weekDates.map((item) => {
          const today = isToday(item);
          return (
            <View key={item.weekStr} style={[wh.dayBox, today ? wh.todayBox : undefined]}>
              <Text style={[wh.dayNum, today ? wh.todayText : undefined]}>{item.date}</Text>
              <Text style={[wh.dayWeek, today ? wh.todayText : undefined]}>{item.weekStr}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const wh = StyleSheet.create({
  container: { width: '100%', marginBottom: 10 },
  row: { flexDirection: 'row', backgroundColor: 'transparent' },
  monthBox: { width: '12.5%' as unknown as number, height: 80, justifyContent: 'center', alignItems: 'center' },
  monthNum: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  monthUnit: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  dayBox: { flex: 1, height: 80, justifyContent: 'center', alignItems: 'center' },
  todayBox: { backgroundColor: '#fff', borderRadius: 8 },
  dayNum: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  dayWeek: { fontSize: 13, color: '#000' },
  todayText: { color: '#007aff' },
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
    { label: '课程名称', value: course.name },
    { label: '教师', value: course.teacher },
    { label: '教室', value: course.room },
    { label: '课程性质', value: course.kcxz },
    { label: '学分', value: course.xf },
    { label: '教学班组成', value: course.jxbzc },
    { label: '周次', value: course.weeks },
    { label: '节次', value: course.periods },
    { label: '星期', value: `星期${course.weekDay}` },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={cdm.overlay} activeOpacity={1} onPress={onClose}>
        <View style={cdm.content} onStartShouldSetResponder={() => true}>
          <Text style={cdm.title}>课程信息</Text>
          <ScrollView style={cdm.scroll}>
            {details.map((d) => (
              <View key={d.label} style={cdm.row}>
                <Text style={cdm.label}>{d.label}：</Text>
                <Text style={cdm.value}>{d.value || '未知'}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const cdm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  content: { width: '80%', maxWidth: 500, backgroundColor: '#fff', borderRadius: 16, padding: 10, maxHeight: '70%' },
  title: { textAlign: 'center', padding: 16, fontSize: 18, fontWeight: 'bold', color: '#000' },
  scroll: { maxHeight: '60%' as unknown as number, padding: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  label: { fontWeight: 'bold', fontSize: 16, color: '#333', flexShrink: 0 },
  value: { fontSize: 16, color: '#555', flex: 1, textAlign: 'right' },
});

// Time column (left side)
function TimeColumn({ timeTable }: { timeTable: ClassTime[] }) {
  return (
    <View style={tc.column}>
      {timeTable.map((item) => (
        <View key={`time-${item.jc}`} style={tc.cell}>
          <Text style={tc.time}>{item.startTime}</Text>
          <Text style={tc.order}>{item.jc}</Text>
          <Text style={tc.time}>{item.endTime}</Text>
        </View>
      ))}
    </View>
  );
}

const tc = StyleSheet.create({
  column: { width: 50, flexShrink: 0 },
  cell: { height: 130, justifyContent: 'center', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  time: { fontSize: 11, color: '#999' },
  order: { fontSize: 15, fontWeight: 'bold', color: '#000', marginVertical: 4 },
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
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
      kcxz: course.kcxz || '未知',
      xf: course.xf || '未知',
      jxbzc: course.jxbzc || '未知',
      weeks: course.zcstr.join(','),
      periods: course.djc.join(','),
      weekDay: course.xingqi,
    });
  }
  return items;
}

export default function CourseScreen() {
  // Check login before any hooks (synchronous, no state dependency)
  const isLoggedIn = userManager.checkLogin();

  const [currentWeek, setCurrentWeek] = useState<number | null>(null);
  const [weekList, setWeekList] = useState<number[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [courses, setCourses] = useState<CourseCleaned[]>([]);
  const [timeTable, setTimeTable] = useState<ClassTime[]>([]);
  const [gridCourses, setGridCourses] = useState<GridCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<GridCourse | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [week, weeks] = await Promise.all([getCurrentWeek(), getAllWeek()]);
        setCurrentWeek(week);
        setWeekList(weeks);
      } catch (err: unknown) {
        console.error('获取周数失败', err);
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const [scheduleData, timeData] = await Promise.all([
          getAllSchedule('2025-2026-2'),
          getTimeTable(),
        ]);
        setCourses(scheduleData);
        setTimeTable(timeData);
      } catch (err: unknown) {
        console.error('获取课表失败', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (loading || currentWeek === null || !timeTable.length || !courses.length) return;
    const items = computeGridCourses(currentWeek, courses, timeTable);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGridCourses(items);
  }, [currentWeek, courses, timeTable, loading]);

  // Show login prompt if not logged in
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={st.container} edges={['top']}>
        <View style={st.center}>
          <Text style={st.loadText}>请先登录</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={st.container} edges={['top']}>
        <View style={st.center}>
          <ActivityIndicator size="large" color="#47a5fd" />
          <Text style={st.loadText}>加载课表中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (currentWeek === null) {
    return (
      <SafeAreaView style={st.container} edges={['top']}>
        <View style={st.center}><Text>加载中...</Text></View>
      </SafeAreaView>
    );
  }

  const dayWidth = (SCREEN_WIDTH - 50) / 7;
  const { currentMonth, weekDates } = computeWeekDates();

  return (
    <SafeAreaView style={st.container} edges={['top']}>
      <View style={st.header}>
        <TouchableOpacity style={st.btn}>
          <Text style={st.btnText}>📋</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.btn} onPress={() => { setShowPicker(true); }}>
          <Text style={st.btnText}>第{currentWeek}周 ▾</Text>
        </TouchableOpacity>
      </View>

      <WeekHeader currentMonth={currentMonth} weekDates={weekDates} />

      <ScrollView style={st.tableOuter}>
        <ScrollView horizontal style={st.tableH}>
          <View style={{ flexDirection: 'row' }}>
            <TimeColumn timeTable={timeTable} />
            <View style={{ width: dayWidth * 7, position: 'relative' }}>
              {timeTable.map((_, idx) => (
                <View
                  key={`row-${String(idx)}`}
                  style={[st.gridRow, { top: idx * 130 }]}
                />
              ))}
              {Array.from({ length: 8 }).map((_, idx) => (
                <View
                  key={`col-${String(idx)}`}
                  style={[st.gridCol, { left: idx * dayWidth }]}
                />
              ))}
              {gridCourses.map((course) => (
                <TouchableOpacity
                  key={course.id}
                  style={[
                    st.courseCard,
                    {
                      left: course.col * dayWidth + 2,
                      top: course.row * 130 + 2,
                      width: dayWidth - 4,
                      height: course.rowSpan * 130 - 4,
                      backgroundColor: getBgFromColor(course.color),
                    },
                  ]}
                  onPress={() => { setSelectedCourse(course); setShowDetail(true); }}
                  activeOpacity={0.7}
                >
                  <Text style={[st.courseName, { color: course.color }]} numberOfLines={3}>
                    {course.name}
                  </Text>
                  <Text style={[st.courseRoom, { color: course.color }]} numberOfLines={2}>
                    {course.room}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </ScrollView>

      <WeekPickerModal
        visible={showPicker}
        weekList={weekList}
        currentWeek={currentWeek}
        onSelect={(week) => { setShowPicker(false); setCurrentWeek(week); }}
        onClose={() => { setShowPicker(false); }}
      />
      <CourseDetailModal
        visible={showDetail}
        course={selectedCourse}
        onClose={() => { setShowDetail(false); }}
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadText: { marginTop: 12, color: '#666', fontSize: 16 },
  header: { flexDirection: 'row', padding: 4, marginBottom: 8, gap: 18, alignItems: 'center' },
  btn: { backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 6, flexDirection: 'row', alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  tableOuter: { flex: 1 },
  tableH: { flex: 1 },
  gridRow: { position: 'absolute', left: 0, right: 0, height: 130, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e0e0e0' },
  gridCol: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: '#e0e0e0' },
  courseCard: {
    position: 'absolute',
    borderRadius: 20,
    padding: 10,
    overflow: 'hidden',
    zIndex: 2,
  },
  courseName: { fontWeight: 'bold', fontSize: 13, lineHeight: 18, marginBottom: 4 },
  courseRoom: { fontSize: 12, marginTop: 'auto' },
});
