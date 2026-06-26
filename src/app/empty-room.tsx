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
import { getEmptyClassRoom, getTeachBuilding } from '@/service/hubt/emptyClassRoom';
import { getAllWeek } from '@/service/hubt/GetAllWeek';
import { getTimeTable } from '@/service/hubt/GetTimeTable';
import userManager from '@/service/userInfo';

const WEEKDAYS = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

function FilterChip({ label, bgColor, onPress }: { label: string; bgColor: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, { backgroundColor: bgColor }]} onPress={onPress} disabled={!onPress}>
      <ThemedText style={styles.chipText} numberOfLines={1}>{label}</ThemedText>
      <MaterialIcon name="chevron-down" size={14} color="#888" />
    </TouchableOpacity>
  );
}

export default function EmptyRoomPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets(); const { showToast } = useToast();
  const initialized = useRef(false); const isLoggedIn = userManager.checkLogin();
  const [buildings, setBuildings] = useState<string[]>([]);
  const [weeks, setWeeks] = useState<number[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  // eslint-disable-next-line react/hook-use-state
  const [bIdx] = useState(0); const [wIdx, setWIdx] = useState(0);
  const [wdIdx, setWdIdx] = useState(0); const [pIdx, setPIdx] = useState(0);
  const [results, setResults] = useState<Array<{ jsmc: string }>>([]);
  const [loading, setLoading] = useState(false); const [refreshing, setRefreshing] = useState(false);
  const [searched, setSearched] = useState(false);

  const loadFilters = useCallback(async () => {
    try {
      const [b, w, t] = await Promise.all([getTeachBuilding(), getAllWeek(), getTimeTable()]);
      setBuildings(Array.isArray(b) ? b : []);
      setWeeks(Array.isArray(w) ? w : []);
      const times: string[] = Array.isArray(t) ? t.map((x: { name?: string }) => x.name ?? '') : [];
      setTimeSlots(times.filter(Boolean));
      if (w.length > 0) setWIdx(w.length - 1);
    } catch { showToast({ message: '加载筛选条件失败', type: 'error' }); }
  }, [showToast]);

  const search = useCallback(async () => {
    if (!buildings[bIdx] || !timeSlots[pIdx]) { showToast({ message: '请完善筛选条件', type: 'warning' }); return; }
    setLoading(true); setSearched(true);
    try { const d = await getEmptyClassRoom(buildings[bIdx], weeks[wIdx], wdIdx + 1, timeSlots[pIdx]); setResults(Array.isArray(d) ? d : []); }
    catch { showToast({ message: '查询失败', type: 'error' }); }
    finally { setLoading(false); setRefreshing(false); }
  }, [buildings, bIdx, weeks, wIdx, wdIdx, pIdx, timeSlots, showToast]);

  useEffect(() => { if (isLoggedIn && !initialized.current) { initialized.current = true; void loadFilters(); } }, [isLoggedIn, loadFilters]);

  const isDark = theme.background === '#000000';

  return (
    <ThemedView style={styles.container}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)', 'rgb(35,39,64)', 'rgb(26,29,46)'] : ['#47a5fd', '#cce5ff', '#f2f5f9']} locations={[0, 0.28, 1]} style={[styles.gradient, { paddingTop: insets.top + 8 }]}>
        <ScrollView style={styles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void search(); }} colors={['#47a5fd']} tintColor="#47a5fd" />}>
          <View style={styles.headerRow}><TouchableOpacity onPress={() => router.back()}><MaterialIcon name="arrow-left" size={24} color="#ffffff" /></TouchableOpacity><HeadStatus text="空教室" /></View>
          {!isLoggedIn ? (<View style={styles.empty}><MaterialIcon name="account-alert" size={48} color={theme.textSecondary} /><ThemedText style={styles.emptyText} themeColor="textSecondary">请先登录</ThemedText></View>) : (
            <>
              <View style={styles.filterRow}>
                <FilterChip label={buildings[bIdx] ?? '教学楼'} bgColor={theme.surface} />
                <FilterChip label={`第${String(weeks[wIdx] ?? '?')}周`} bgColor={theme.surface} onPress={() => setWIdx((wIdx + 1) % Math.max(weeks.length, 1))} />
                <FilterChip label={WEEKDAYS[wdIdx]} onPress={() => setWdIdx((wdIdx + 1) % 7)} />
                <FilterChip label={timeSlots[pIdx] ?? '节次'} onPress={() => setPIdx((pIdx + 1) % Math.max(timeSlots.length, 1))} />
              </View>
              <TouchableOpacity style={[styles.searchBtn, { backgroundColor: theme.primary }]} onPress={() => { void search(); }}>
                <MaterialIcon name="magnify" size={20} color="#fff" /><ThemedText style={styles.searchText} themeColor="onPrimary">查询</ThemedText>
              </TouchableOpacity>
              {loading ? (<ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />) :
              searched && results.length === 0 ? (<View style={styles.empty}><MaterialIcon name="door-open" size={48} color={theme.textSecondary} /><ThemedText style={styles.emptyText} themeColor="textSecondary">暂无空闲教室</ThemedText></View>) : (
                <View style={styles.roomList}>{results.map((r, i) => (
                  <View key={`${r.jsmc}-${String(i)}`} style={[styles.roomCard, { backgroundColor: theme.surface }]}>
                    <MaterialIcon name="door-open" size={20} color={theme.primary} />
                    <ThemedText style={styles.roomName}>{r.jsmc}</ThemedText>
                    <ThemedText style={{ color: '#07c160', fontWeight: '600', fontSize: 14 }}>空闲</ThemedText>
                  </View>
                ))}</View>
              )}
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, gradient: { flex: 1 }, scrollView: { flex: 1, paddingHorizontal: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  empty: { alignItems: 'center', paddingTop: 80 }, emptyText: { fontSize: 16, marginTop: 12 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { fontSize: 13, maxWidth: 80 },
  searchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 12, paddingVertical: 12, borderRadius: 10 },
  searchText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  roomList: { padding: 12, gap: 8 },
  roomCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 14 },
  roomName: { fontSize: 15, fontWeight: '500', flex: 1 },
});
