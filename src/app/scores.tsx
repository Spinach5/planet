import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { ActivityIndicator } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';
import { getScores } from '@/service/hubt/Scores';
import { getSemesterList } from '@/service/hubt/CurrentSemester';
import userManager from '@/service/userInfo';

const PASS_OPTIONS = ['全部', '及格', '不及格'];
const SORT_OPTIONS = ['请选择', '成绩从高到低', '成绩从低到高'];

interface ScoreItem {
  kcmc: string;
  zhcj: number;
  xnxq: string;
  xf: number;
  sfbk: string;
}

function getScoreColor(score: number): string {
  if (Number.isNaN(score)) return '#999';
  if (score >= 80) return '#07c160';
  if (score >= 60) return '#f0ad4e';
  return '#e74c3c';
}

function getScoreText(score: number): string {
  if (Number.isNaN(score)) return '--';
  return String(score);
}

export default function ScoresPage() {
  const theme = useTheme();
  const { showToast } = useToast();
  const initialized = useRef(false);
  const isLoggedIn = userManager.checkLogin();

  const [semesterList, setSemesterList] = useState<string[]>([]);
  const [allScores, setAllScores] = useState<ScoreItem[]>([]);
  const [loading, setLoading] = useState(isLoggedIn);
  const [refreshing, setRefreshing] = useState(false);
  const [initError, setInitError] = useState(false);

  const [semesterIdx, setSemesterIdx] = useState(0);
  const [passIdx, setPassIdx] = useState(0);
  const [sortIdx, setSortIdx] = useState(0);

  const semesterOptions = useMemo(() => ['全部', ...semesterList], [semesterList]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!isLoggedIn) return;
    setLoading(true);
    setInitError(false);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const semesters = await getSemesterList();
      const semList = (Array.isArray(semesters) ? semesters : []) as string[];
      setSemesterList(semList);

      const scores = await getScores();
      setAllScores((Array.isArray(scores) ? scores : []) as ScoreItem[]);
    } catch {
      showToast({ message: forceRefresh ? '刷新失败' : '获取成绩失败', type: 'error' });
      if (!forceRefresh) setInitError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLoggedIn && !initialized.current) {
      initialized.current = true;
      void fetchData();
    }
  }, [isLoggedIn, fetchData]);

  // Filter and sort
  const filteredScores = useMemo(() => {
    let list = [...allScores];

    if (semesterIdx > 0) {
      const target = semesterList[semesterIdx - 1];
      list = list.filter((s) => s.xnxq === target);
    }

    if (passIdx === 1) {
      list = list.filter((s) => s.zhcj >= 60);
    } else if (passIdx === 2) {
      list = list.filter((s) => s.zhcj < 60);
    }

    if (sortIdx === 1) {
      list.sort((a, b) => b.zhcj - a.zhcj);
    } else if (sortIdx === 2) {
      list.sort((a, b) => a.zhcj - b.zhcj);
    }

    return list;
  }, [allScores, semesterIdx, passIdx, sortIdx, semesterList]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchData(true);
  }, [fetchData]);

  const navigateBack = useCallback(() => {
    router.back();
  }, []);

  // Picker modal state
  const [pickerVisible, setPickerVisible] = useState<'semester' | 'pass' | 'sort' | null>(null);
  const pickerOptions = pickerVisible === 'semester' ? semesterOptions
    : pickerVisible === 'pass' ? PASS_OPTIONS
    : SORT_OPTIONS;
  const pickerValue = pickerVisible === 'semester' ? semesterIdx
    : pickerVisible === 'pass' ? passIdx
    : sortIdx;

  const handlePickerSelect = useCallback((_value: number) => {
    if (pickerVisible === 'semester') setSemesterIdx(_value);
    else if (pickerVisible === 'pass') setPassIdx(_value);
    else if (pickerVisible === 'sort') setSortIdx(_value);
    setPickerVisible(null);
  }, [pickerVisible]);

  if (!isLoggedIn) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
            <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle} themeColor="onPrimary">成绩</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyView}>
          <MaterialIcon name="account-alert" size={48} color={theme.textSecondary} />
          <ThemedText style={styles.emptyText} themeColor="textSecondary">请先登录</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} themeColor="onPrimary">成绩</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterItem, { backgroundColor: theme.surfaceVariant }]}
          onPress={() => setPickerVisible('semester')}
        >
          <ThemedText style={styles.filterLabel} themeColor="textSecondary">学期</ThemedText>
          <View style={styles.filterValue}>
            <ThemedText style={styles.filterText}>{semesterOptions[semesterIdx]}</ThemedText>
            <MaterialIcon name="chevron-down" size={16} color={theme.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterItem, { backgroundColor: theme.surfaceVariant }]}
          onPress={() => setPickerVisible('pass')}
        >
          <ThemedText style={styles.filterLabel} themeColor="textSecondary">是否及格</ThemedText>
          <View style={styles.filterValue}>
            <ThemedText style={styles.filterText}>{PASS_OPTIONS[passIdx]}</ThemedText>
            <MaterialIcon name="chevron-down" size={16} color={theme.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterItem, { backgroundColor: theme.surfaceVariant }]}
          onPress={() => setPickerVisible('sort')}
        >
          <ThemedText style={styles.filterLabel} themeColor="textSecondary">排序</ThemedText>
          <View style={styles.filterValue}>
            <ThemedText style={styles.filterText}>{SORT_OPTIONS[sortIdx]}</ThemedText>
            <MaterialIcon name="chevron-down" size={16} color={theme.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Simple Picker Modal */}
      {pickerVisible ? (
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerModal, { backgroundColor: theme.surfaceVariant }]}>
            <ScrollView style={styles.pickerList}>
              {pickerOptions.map((opt: string, idx: number) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.pickerOption,
                    idx === pickerValue && { backgroundColor: theme.primaryContainer },
                  ]}
                  onPress={() => handlePickerSelect(idx)}
                >
                  <ThemedText
                    style={[
                      styles.pickerOptionText,
                      idx === pickerValue && { color: theme.primary },
                    ]}
                  >
                    {opt}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.pickerCancel, { borderTopColor: theme.outlineVariant }]}
              onPress={() => setPickerVisible(null)}
            >
              <ThemedText style={styles.pickerCancelText}>取消</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Score List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {initError ? (
          <View style={styles.emptyView}>
            <ThemedText style={styles.emptyText} themeColor="textSecondary">加载失败</ThemedText>
          </View>
        ) : loading ? (
          <View style={styles.emptyView}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : filteredScores.length === 0 ? (
          <View style={styles.emptyView}>
            <ThemedText style={styles.emptyText} themeColor="textSecondary">暂无成绩</ThemedText>
          </View>
        ) : (
          <View style={styles.scoreList}>
            {filteredScores.map((item, index) => (
              <View
                key={`${item.kcmc}-${item.xnxq}-${String(index)}`}
                style={[styles.scoreCard, { backgroundColor: theme.surfaceVariant }]}
              >
                <View style={styles.scoreCardLeft}>
                  <ThemedText style={styles.courseName}>{item.kcmc}</ThemedText>
                  <ThemedText style={styles.scoreMeta} themeColor="textSecondary">
                    {item.xnxq} | {item.xf} 学分 | 补考：{item.sfbk === '1' ? '是' : '否'}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.scoreValue, { color: getScoreColor(item.zhcj) }]}>
                  {getScoreText(item.zhcj)}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#ffffff' },
  headerSpacer: { width: 40 },
  filterBar: {
    flexDirection: 'row', gap: 8, padding: 12,
  },
  filterItem: {
    flex: 1, borderRadius: 8, padding: 10,
  },
  filterLabel: { fontSize: 11, marginBottom: 2 },
  filterValue: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  filterText: { fontSize: 13, fontWeight: '500' },
  pickerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', zIndex: 100,
  },
  pickerModal: {
    borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '50%',
  },
  pickerList: { paddingVertical: 8 },
  pickerOption: { paddingVertical: 14, paddingHorizontal: 20 },
  pickerOptionText: { fontSize: 16 },
  pickerCancel: { paddingVertical: 14, alignItems: 'center', borderTopWidth: 1 },
  pickerCancelText: { fontSize: 16, fontWeight: '600' },
  scrollView: { flex: 1, padding: 16 },
  emptyView: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, marginTop: 12 },
  scoreList: { gap: 10 },
  scoreCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 12, padding: 14,
  },
  scoreCardLeft: { flex: 1, marginRight: 12 },
  courseName: { fontSize: 16, fontWeight: '600' },
  scoreMeta: { fontSize: 12, marginTop: 4 },
  scoreValue: { fontSize: 28, fontWeight: '700' },
});
