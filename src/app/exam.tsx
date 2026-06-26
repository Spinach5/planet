import { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router, Stack } from 'expo-router';
import { ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HeadStatus } from '@/components/HeadStatus';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';
import { getExamInfo } from '@/service/hubt/ExamInfo';
import userManager from '@/service/userInfo';

interface ExamItem { kcmc: string; kspcmc: string; jsmc: string; kssj: string; ksfs: string; zwh: string; }

function getExamStatus(kssj: string): { text: string; color: string } {
  const [datePart, timePart] = kssj.split(' ');
  const [startTime, endTime] = timePart.split('~');
  const start = new Date(`${datePart}T${startTime}:00`).getTime();
  const end = new Date(`${datePart}T${endTime}:00`).getTime();
  const now = Date.now();
  if (now < start) return { text: '待开始', color: '#07c160' };
  if (now <= end) return { text: '进行中', color: '#f0ad4e' };
  return { text: '已结束', color: '#999' };
}

function formatExamDate(kssj: string): string {
  const [datePart, timePart] = kssj.split(' ');
  const [, month, day] = datePart.split('-');
  return `${month}-${day} ${timePart}`;
}

export default function ExamPage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const initialized = useRef(false);
  const isLoggedIn = userManager.checkLogin();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExams = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const data = await getExamInfo();
      setExams(Array.isArray(data) ? data as ExamItem[] : []);
    } catch {
      showToast({ message: '获取考试信息失败', type: 'error' });
    } finally { setLoading(false); setRefreshing(false); }
  }, [isLoggedIn, showToast]);

  useEffect(() => {
    if (isLoggedIn && !initialized.current) { initialized.current = true; void fetchExams(); }
  }, [isLoggedIn, fetchExams]);

  const onRefresh = useCallback(() => { setRefreshing(true); void fetchExams(); }, [fetchExams]);
  const isDark = theme.background === '#000000';

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)', 'rgb(35,39,64)', 'rgb(26,29,46)'] : ['#47a5fd', '#cce5ff', '#f2f5f9']} locations={[0, 0.28, 1]} style={[styles.gradient, { paddingTop: insets.top + 8 }]}>
        <ScrollView style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#47a5fd']} tintColor="#47a5fd" />}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()}><MaterialIcon name="arrow-left" size={24} color="#ffffff" /></TouchableOpacity>
            <HeadStatus text="考试" />
          </View>
          {!isLoggedIn ? (
            <View style={styles.empty}><MaterialIcon name="account-alert" size={48} color={theme.textSecondary} /><ThemedText style={styles.emptyText} themeColor="textSecondary">请先登录</ThemedText></View>
          ) : loading ? (
            <View style={styles.empty}><ActivityIndicator size="large" color={theme.primary} /></View>
          ) : exams.length === 0 ? (
            <View style={styles.empty}><MaterialIcon name="clipboard-text-outline" size={48} color={theme.textSecondary} /><ThemedText style={styles.emptyText} themeColor="textSecondary">暂无考试信息</ThemedText></View>
          ) : (
            <View style={styles.list}>
              {exams.map((exam, idx) => {
                const st = getExamStatus(exam.kssj);
                return (
                  <View key={`${exam.kcmc}-${String(idx)}`} style={[styles.card, { backgroundColor: theme.surface }]}>
                    <View style={styles.cardHeader}>
                      <ThemedText style={styles.subject}>{exam.kcmc}</ThemedText>
                      <View style={[styles.badge, { backgroundColor: st.color }]}><ThemedText style={styles.badgeText} themeColor="onPrimary">{st.text}</ThemedText></View>
                    </View>
                    <ThemedText style={styles.info} themeColor="textSecondary">考试批次: {exam.kspcmc}</ThemedText>
                    <ThemedText style={styles.info} themeColor="textSecondary">教室: {exam.jsmc}</ThemedText>
                    <ThemedText style={styles.info} themeColor="textSecondary">时间: {formatExamDate(exam.kssj)}</ThemedText>
                    <ThemedText style={styles.info} themeColor="textSecondary">方式: {exam.ksfs}</ThemedText>
                    <ThemedText style={styles.info} themeColor="textSecondary">座位: {exam.zwh}</ThemedText>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, gradient: { flex: 1 }, scrollView: { flex: 1, paddingHorizontal: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, marginTop: 12 },
  list: { padding: 12, gap: 10 },
  card: { borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  subject: { fontSize: 16, fontWeight: '600', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  info: { fontSize: 13, lineHeight: 20 },
});
