import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { getScores } from '@/service/hubt/Scores';
import userManager from '@/service/userInfo';

interface ScoreItem { kcmc: string; zhcj: number; xnxq: string; xf: number; sfbk: string; }

function scoreColor(s: number): string { if (Number.isNaN(s)) return '#999'; if (s >= 80) return '#07c160'; if (s >= 60) return '#f0ad4e'; return '#e74c3c'; }

export default function ScoresPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets(); const { showToast } = useToast();
  const initialized = useRef(false); const isLoggedIn = userManager.checkLogin();
  const [allScores, setAllScores] = useState<ScoreItem[]>([]);
  const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState(0); // 0=all, 1=pass, 2=fail
  const [sortType, setSortType] = useState(0); // 0=none, 1=high-low, 2=low-high

  const fetch = useCallback(async () => {
    if (!isLoggedIn) return; setLoading(true);
    try { const d = await getScores(); setAllScores(Array.isArray(d) ? d as ScoreItem[] : []); }
    catch { showToast({ message: '获取成绩失败', type: 'error' }); }
    finally { setLoading(false); setRefreshing(false); }
  }, [isLoggedIn, showToast]);

  useEffect(() => { if (isLoggedIn && !initialized.current) { initialized.current = true; void fetch(); } }, [isLoggedIn, fetch]);

  const filtered = useMemo(() => {
    let list = [...allScores];
    if (filter === 1) list = list.filter((s) => s.zhcj >= 60);
    if (filter === 2) list = list.filter((s) => s.zhcj < 60);
    if (sortType === 1) list.sort((a, b) => b.zhcj - a.zhcj);
    if (sortType === 2) list.sort((a, b) => a.zhcj - b.zhcj);
    return list;
  }, [allScores, filter, sortType]);

  const isDark = theme.background === '#000000';

  return (
    <ThemedView style={st.container}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)', 'rgb(35,39,64)', 'rgb(26,29,46)'] : ['#47a5fd', '#cce5ff', '#f2f5f9']} locations={[0, 0.28, 1]} style={[st.gradient, { paddingTop: insets.top + 8 }]}>
        <ScrollView style={st.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void fetch(); }} colors={['#47a5fd']} tintColor="#47a5fd" />}>
          <View style={st.headerRow}><TouchableOpacity onPress={() => router.back()}><MaterialIcon name="arrow-left" size={24} color="#ffffff" /></TouchableOpacity><HeadStatus text="成绩" /></View>
          {!isLoggedIn ? (<View style={st.empty}><MaterialIcon name="account-alert" size={48} color={theme.textSecondary} /><ThemedText style={st.emptyText} themeColor="textSecondary">请先登录</ThemedText></View>) :
          loading && allScores.length === 0 ? (<View style={st.empty}><ActivityIndicator size="large" color={theme.primary} /></View>) : (
            <>
              <View style={st.filterBar}>
                {['全部', '及格', '不及格'].map((l, i) => (
                  <TouchableOpacity key={l} style={[st.filterChip, { backgroundColor: filter === i ? theme.primary : theme.surface }]} onPress={() => setFilter(i)}>
                    <ThemedText style={[st.filterText, filter === i && { color: '#fff' }]}>{l}</ThemedText>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[st.filterChip, { backgroundColor: theme.surface }]} onPress={() => setSortType((sortType + 1) % 3)}>
                  <ThemedText style={st.filterText}>{['排序', '高→低', '低→高'][sortType]}</ThemedText>
                  <MaterialIcon name="swap-vertical" size={14} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              {filtered.length === 0 ? (<View style={st.empty}><ThemedText style={st.emptyText} themeColor="textSecondary">暂无成绩</ThemedText></View>) : (
                <View style={st.list}>
                  {filtered.map((item, idx) => (
                    <View key={`${item.kcmc}-${String(idx)}`} style={[st.card, { backgroundColor: theme.surface }]}>
                      <View style={st.cardLeft}>
                        <ThemedText style={st.courseName}>{item.kcmc}</ThemedText>
                        <ThemedText style={st.meta} themeColor="textSecondary">{item.xnxq} | {item.xf}学分 | 补考:{item.sfbk === '1' ? '是' : '否'}</ThemedText>
                      </View>
                      <ThemedText style={[st.score, { color: scoreColor(item.zhcj) }]}>{Number.isNaN(item.zhcj) ? '--' : String(item.zhcj)}</ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 }, gradient: { flex: 1 }, scrollView: { flex: 1, paddingHorizontal: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  empty: { alignItems: 'center', paddingTop: 80 }, emptyText: { fontSize: 16, marginTop: 12 },
  filterBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 8, flexWrap: 'wrap' },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  filterText: { fontSize: 13, fontWeight: '500' },
  list: { padding: 12, gap: 8 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardLeft: { flex: 1, marginRight: 12 },
  courseName: { fontSize: 15, fontWeight: '600' }, meta: { fontSize: 12, marginTop: 4 },
  score: { fontSize: 28, fontWeight: '700' },
});
