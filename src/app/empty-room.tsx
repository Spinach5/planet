import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { ActivityIndicator } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';
import { getEmptyClassRoom, getTeachBuilding } from '@/service/hubt/emptyClassRoom';
import { getAllWeek } from '@/service/hubt/GetAllWeek';
import { getTimeTable } from '@/service/hubt/GetTimeTable';
import userManager from '@/service/userInfo';

const WEEKDAYS = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

type PickerTarget = 'building' | 'week' | 'weekday' | 'period';

interface RoomResult {
  jsmc: string;
  classroom?: string;
  building?: string;
}

export default function EmptyRoomPage() {
  const theme = useTheme();
  const { showToast } = useToast();
  const initialized = useRef(false);
  const isLoggedIn = userManager.checkLogin();

  const [buildings, setBuildings] = useState<string[]>([]);
  const [weeks, setWeeks] = useState<number[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  const [buildingIdx, setBuildingIdx] = useState(0);
  const [weekIdx, setWeekIdx] = useState(0);
  const [weekdayIdx, setWeekdayIdx] = useState(0);
  const [periodIdx, setPeriodIdx] = useState(0);

  const [results, setResults] = useState<RoomResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searched, setSearched] = useState(false);

  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);

  const loadFilters = useCallback(async () => {
    try {
      const [buildingData, weekData, timeData] = await Promise.all([
        getTeachBuilding(),
        getAllWeek(),
        getTimeTable(),
      ]);
      setBuildings(Array.isArray(buildingData) ? buildingData : []);
      setWeeks(Array.isArray(weekData) ? weekData : []);
      const times: string[] = Array.isArray(timeData)
        ? timeData.map((t: { name?: string }) => t.name ?? '')
        : [];
      setTimeSlots(times.filter((t: string) => Boolean(t)));
    } catch {
      showToast({ message: '加载筛选条件失败', type: 'error' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(async () => {
    if (!buildings[buildingIdx] || !weeks[weekIdx] || !timeSlots[periodIdx]) {
      showToast({ message: '请完善筛选条件', type: 'warning' });
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const data = await getEmptyClassRoom(
        buildings[buildingIdx],
        weeks[weekIdx],
        weekdayIdx + 1,
        timeSlots[periodIdx],
      );
      setResults(Array.isArray(data) ? data : []);
    } catch {
      showToast({ message: '查询失败', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildings, buildingIdx, weeks, weekIdx, weekdayIdx, periodIdx, timeSlots]);

  useEffect(() => {
    if (isLoggedIn && !initialized.current) {
      initialized.current = true;
      void (async () => {
        await loadFilters();
        setTimeout(() => { void handleSearch(); }, 500);
      })();
    }
  }, [isLoggedIn, loadFilters, handleSearch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void handleSearch();
  }, [handleSearch]);

  const navigateBack = useCallback(() => router.back(), []);

  const getPickerOptions = (): string[] => {
    if (pickerTarget === 'building') return buildings;
    if (pickerTarget === 'week') return weeks.map(String);
    if (pickerTarget === 'weekday') return WEEKDAYS;
    if (pickerTarget === 'period') return timeSlots;
    return [];
  };

  const getPickerValue = (): number => {
    if (pickerTarget === 'building') return buildingIdx;
    if (pickerTarget === 'week') return weekIdx;
    if (pickerTarget === 'weekday') return weekdayIdx;
    if (pickerTarget === 'period') return periodIdx;
    return 0;
  };

  const applyPickerValue = (idx: number) => {
    if (pickerTarget === 'building') setBuildingIdx(idx);
    else if (pickerTarget === 'week') setWeekIdx(idx);
    else if (pickerTarget === 'weekday') setWeekdayIdx(idx);
    else if (pickerTarget === 'period') setPeriodIdx(idx);
    setPickerTarget(null);
  };

  const getDisplayValue = (target: PickerTarget): string => {
    if (target === 'building') return buildings[buildingIdx] ?? '教学楼';
    if (target === 'week') return weeks[weekIdx] ? `第${String(weeks[weekIdx])}周` : '周次';
    if (target === 'weekday') return WEEKDAYS[weekdayIdx];
    // target === 'period'
    return timeSlots[periodIdx] ?? '节次';
  };

  if (!isLoggedIn) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
            <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle} themeColor="onPrimary">空教室</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyView}>
          <MaterialIcon name="account-alert" size={48} color={theme.textSecondary} />
          <ThemedText style={styles.emptyText} themeColor="textSecondary">请先登录</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const filterKeys: PickerTarget[] = ['building', 'week', 'weekday', 'period'];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} themeColor="onPrimary">空教室</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filters */}
      <View style={styles.filterBar}>
        {filterKeys.map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterChip, { backgroundColor: theme.surfaceVariant }]}
            onPress={() => setPickerTarget(key)}
          >
            <ThemedText style={styles.filterChipText} numberOfLines={1}>
              {getDisplayValue(key)}
            </ThemedText>
            <MaterialIcon name="chevron-down" size={14} color={theme.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.searchBtn, { backgroundColor: theme.primary }]}
        onPress={() => { void handleSearch(); }}
      >
        <MaterialIcon name="magnify" size={20} color="#ffffff" />
        <ThemedText style={styles.searchBtnText} themeColor="onPrimary">查询</ThemedText>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            colors={[theme.primary]} tintColor={theme.primary} />
        }
      >
        {loading ? (
          <View style={styles.emptyView}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : searched && results.length === 0 ? (
          <View style={styles.emptyView}>
            <MaterialIcon name="door-open" size={48} color={theme.textSecondary} />
            <ThemedText style={styles.emptyText} themeColor="textSecondary">暂无空闲教室</ThemedText>
          </View>
        ) : (
          <View style={styles.roomList}>
            {results.map((room, idx) => (
              <View key={`${room.jsmc}-${String(idx)}`}
                style={[styles.roomCard, { backgroundColor: theme.surfaceVariant }]}>
                <MaterialIcon name="door-open" size={20} color={theme.primary} />
                <View style={styles.roomInfo}>
                  <ThemedText style={styles.roomName}>{room.jsmc}</ThemedText>
                  {room.building ? (
                    <ThemedText style={styles.roomMeta} themeColor="textSecondary">
                      {room.building}
                    </ThemedText>
                  ) : null}
                </View>
                <ThemedText style={[styles.roomStatus, { color: '#07c160' }]}>空闲</ThemedText>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Picker Modal */}
      {pickerTarget !== null ? (
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerModal, { backgroundColor: theme.surfaceVariant }]}>
            <ScrollView style={styles.pickerList}>
              {getPickerOptions().map((opt: string, idx: number) => (
                <TouchableOpacity key={opt}
                  style={[styles.pickerOption,
                    idx === getPickerValue() && { backgroundColor: theme.primaryContainer }]}
                  onPress={() => applyPickerValue(idx)}>
                  <ThemedText style={[styles.pickerOptionText,
                    idx === getPickerValue() && { color: theme.primary }]}>{opt}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.pickerCancel, { borderTopColor: theme.outlineVariant }]}
              onPress={() => setPickerTarget(null)}>
              <ThemedText style={styles.pickerCancelText}>取消</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#ffffff' },
  headerSpacer: { width: 40 },
  filterBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, width: '47%' },
  filterChipText: { fontSize: 13, flex: 1 },
  searchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginHorizontal: 12, paddingVertical: 12, borderRadius: 10 },
  searchBtnText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  scrollView: { flex: 1, padding: 16 },
  emptyView: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, marginTop: 12 },
  roomList: { gap: 10 },
  roomCard: { flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, padding: 14 },
  roomInfo: { flex: 1 },
  roomName: { fontSize: 15, fontWeight: '500' },
  roomMeta: { fontSize: 12, marginTop: 2 },
  roomStatus: { fontSize: 14, fontWeight: '600' },
  pickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', zIndex: 100 },
  pickerModal: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '50%' },
  pickerList: { paddingVertical: 8 },
  pickerOption: { paddingVertical: 14, paddingHorizontal: 20 },
  pickerOptionText: { fontSize: 16 },
  pickerCancel: { paddingVertical: 14, alignItems: 'center', borderTopWidth: 1 },
  pickerCancelText: { fontSize: 16, fontWeight: '600' },
});
