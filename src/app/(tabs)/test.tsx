import { ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { login } from '@/service/hubt/login';
import { getCurrentWeek } from '@/service/hubt/CurrentWeek';
import { getExtroInfo } from '@/service/hubt/ExtroInfo';
import { getDailySchedule } from '@/service/hubt/DailySchedule';
import { getAllWeek } from '@/service/hubt/GetAllWeek';
import { getXhid } from '@/service/hubt/GetXhid';
import { getCurrentSemester } from '@/service/hubt/CurrentSemester';
import { getAllSchedule } from '@/service/hubt/AllSchedule';
import { getExamInfo } from '@/service/hubt/ExamInfo';
import { getScores } from '@/service/hubt/Scores';
import { getTimeTable } from '@/service/hubt/GetTimeTable';
import { getStuInfo } from '@/service/hubt/StuInfo';

interface TestButton {
  label: string;
  color: string;
  onPress: () => Promise<void>;
}

export default function TestScreen() {
  const showResult = async (label: string, fn: () => Promise<unknown>) => {
    try {
      const result = await fn();
      Alert.alert(`${label} 成功`, JSON.stringify(result, null, 2));
      console.warn(label, result);
    } catch (error: unknown) {
      const err = error as { message?: string };
      Alert.alert(`${label} 失败`, err.message ?? '未知错误');
      console.error(label, err);
    }
  };

  const buttons: TestButton[] = [
    { label: '获取学生信息', color: '#17a2b8', onPress: async () => showResult('学生信息', getStuInfo) },
    { label: '获取课表', color: '#17a2b8', onPress: async () => showResult('课表', async () => getAllSchedule('2025-2026-2')) },
    { label: '获取课表时间', color: '#17a2b8', onPress: async () => showResult('课表时间', getTimeTable) },
    { label: '获取当前分数', color: '#17a2b8', onPress: async () => showResult('成绩', getScores) },
    { label: '获取考试信息', color: '#007bff', onPress: async () => showResult('考试信息', getExamInfo) },
    { label: '获取当前学期', color: '#007bff', onPress: async () => showResult('当前学期', getCurrentSemester) },
    { label: '登录', color: '#007bff', onPress: async () => login('2410321409', 'Spinach114514!').then(() => Alert.alert('登录', '完成')) },
    { label: '当前周数', color: '#17a2b8', onPress: async () => showResult('当前周数', getCurrentWeek) },
    { label: '实习信息', color: '#6c757d', onPress: async () => showResult('实习信息', getExtroInfo) },
    { label: '获取xhid', color: '#dc3545', onPress: async () => showResult('xhid', getXhid) },
    { label: '今日课表', color: '#ffc107', onPress: async () => showResult('今日课表', async () => getDailySchedule('2026-5-11')) },
    { label: '所有课表', color: '#ffc107', onPress: async () => showResult('所有课表', async () => getAllSchedule('2025-2026-1')) },
    { label: '所有周次', color: '#28a745', onPress: async () => showResult('所有周次', getAllWeek) },
    { label: '获取每天课程时间', color: '#28a745', onPress: async () => showResult('课程时间', async () => getTimeTable()) },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <ThemedText type="subtitle" style={styles.title}>API 测试面板</ThemedText>
        <ThemedView type="backgroundElement" style={styles.buttonContainer}>
          {buttons.map((btn) => (
            <ThemedView
              key={btn.label}
              style={[styles.button, { borderLeftColor: btn.color }]}
              onTouchEnd={() => { void btn.onPress(); }}
            >
              <ThemedText style={[styles.buttonText, { color: btn.color }]}>
                {btn.label}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  buttonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    borderLeftWidth: 3,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
