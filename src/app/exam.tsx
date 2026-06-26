import { useState, useCallback, useRef, useEffect } from 'react';
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
import { getExamInfo } from '@/service/hubt/ExamInfo';
import userManager from '@/service/userInfo';

interface ExamItem {
  kcmc: string;
  kspcmc: string;
  jsmc: string;
  kssj: string;
  ksfs: string;
  zwh: string;
}

function parseExamTime(kssj: string): { start: Date; end: Date } {
  const [datePart, timePart] = kssj.split(' ');
  const [startTime, endTime] = timePart.split('~');
  const start = new Date(`${datePart}T${startTime}:00`);
  const end = new Date(`${datePart}T${endTime}:00`);
  return { start, end };
}

function getExamStatus(kssj: string): { text: string; color: string } {
  const { start, end } = parseExamTime(kssj);
  const now = Date.now();
  if (now < start.getTime()) return { text: '待开始', color: '#07c160' };
  if (now <= end.getTime()) return { text: '进行中', color: '#f0ad4e' };
  return { text: '已结束', color: '#999' };
}

function formatExamDate(kssj: string): string {
  const [datePart, timePart] = kssj.split(' ');
  const [, month, day] = datePart.split('-');
  return `${month}-${day} ${timePart}`;
}

export default function ExamPage() {
  const theme = useTheme();
  const { showToast } = useToast();
  const isLoggedIn = userManager.checkLogin();
  const initialized = useRef(false);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(isLoggedIn);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExams = useCallback(async () => {
    if (!userManager.checkLogin()) return;
    setLoading(true);
    try {
      const data = await getExamInfo();
      const examList = Array.isArray(data) ? data : [];
      setExams(examList as ExamItem[]);
    } catch {
      showToast({ message: '获取考试信息失败', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLoggedIn && !initialized.current) {
      initialized.current = true;
      void fetchExams();
    }
  }, [isLoggedIn, fetchExams]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchExams();
  }, [fetchExams]);

  const navigateBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} themeColor="onPrimary">
          考试
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

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
        {!isLoggedIn ? (
          <View style={styles.emptyView}>
            <MaterialIcon name="account-alert" size={48} color={theme.textSecondary} />
            <ThemedText style={styles.emptyText} themeColor="textSecondary">
              请先登录
            </ThemedText>
          </View>
        ) : loading ? (
          <View style={styles.loadingView}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText style={styles.loadingText} themeColor="textSecondary">
              加载中...
            </ThemedText>
          </View>
        ) : exams.length === 0 ? (
          <View style={styles.emptyView}>
            <MaterialIcon name="clipboard-text-outline" size={48} color={theme.textSecondary} />
            <ThemedText style={styles.emptyText} themeColor="textSecondary">
              暂无考试信息
            </ThemedText>
          </View>
        ) : (
          <View style={styles.examList}>
            {exams.map((exam, index) => {
              const status = getExamStatus(exam.kssj);
              return (
                <View
                  key={`${exam.kcmc}-${exam.kssj}-${String(index)}`}
                  style={[styles.examCard, { backgroundColor: theme.surfaceVariant }]}
                >
                  <View style={styles.examHeader}>
                    <ThemedText style={styles.examSubject}>{exam.kcmc}</ThemedText>
                    <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                      <ThemedText style={styles.statusText} themeColor="onPrimary">
                        {status.text}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.examInfo}>
                    <ThemedText style={styles.infoItem} themeColor="textSecondary">
                      考试批次: {exam.kspcmc}
                    </ThemedText>
                    <ThemedText style={styles.infoItem} themeColor="textSecondary">
                      教室: {exam.jsmc}
                    </ThemedText>
                    <ThemedText style={styles.infoItem} themeColor="textSecondary">
                      时间: {formatExamDate(exam.kssj)}
                    </ThemedText>
                    <ThemedText style={styles.infoItem} themeColor="textSecondary">
                      方式: {exam.ksfs}
                    </ThemedText>
                    <ThemedText style={styles.infoItem} themeColor="textSecondary">
                      座位: {exam.zwh}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  loadingView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  examList: {
    gap: 12,
  },
  examCard: {
    borderRadius: 12,
    padding: 16,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  examSubject: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  examInfo: {
    gap: 4,
  },
  infoItem: {
    fontSize: 13,
    lineHeight: 20,
  },
});
