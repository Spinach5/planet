import { HeadStatus } from "@/components/HeadStatus";
import { MaterialIcon } from "@/components/MaterialIcon";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { getSemesterList } from "@/service/hubt/CurrentSemester";
import { getCurrentWeek } from "@/service/hubt/CurrentWeek";
import {
  getEmptyClassRoom,
  getTeachBuilding,
  getTeachBuildingCategory,
} from "@/service/hubt/emptyClassRoom";
import { getAllWeek } from "@/service/hubt/GetAllWeek";
import { getTimeTable } from "@/service/hubt/GetTimeTable";
import userManager from "@/service/userInfo";
import { useToast } from "@/utils/toast";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

interface RoomItem {
  jsmc: string;
  jslx: string;
  jxlmc: string;
  maxvolume: string;
}

function getHashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

function PickerModal({
  visible,
  title,
  options,
  selectedIndex,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selectedIndex: number;
  onSelect: (i: number) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={st.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[st.modalContent, { backgroundColor: theme.surface }]}>
          <Text style={[st.modalTitle, { color: theme.text }]}>{title}</Text>
          <ScrollView style={{ maxHeight: 300 }}>
            {options.map((opt, idx) => {
              const sel = selectedIndex === idx;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    st.pickerItem,
                    sel && { backgroundColor: theme.backgroundSelected },
                  ]}
                  onPress={() => {
                    onSelect(idx);
                  }}
                >
                  <Text
                    style={[
                      st.pickerText,
                      { color: theme.text, fontWeight: sel ? "700" : "400" },
                    ]}
                  >
                    {opt}
                  </Text>
                  {sel ? (
                    <MaterialIcon name="check" size={18} color="#47a5fd" />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function FilterChip({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      style={[st.chip, { backgroundColor: theme.surface }]}
      onPress={onPress}
    >
      <ThemedText style={st.chipText} numberOfLines={1}>
        {label}
      </ThemedText>
      <MaterialIcon name="chevron-down" size={14} color={theme.textSecondary} />
    </TouchableOpacity>
  );
}

export default function EmptyRoomPage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const initDone = useRef(false);
  const [isLoggedIn, setIsLoggedIn] = useState(userManager.checkLogin());
  const [buildingMap, setBuildingMap] = useState<Record<string, string>>({});
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [weekOptions, setWeekOptions] = useState<number[]>([]);
  const [sectionOptions, setSectionOptions] = useState<number[]>([]);
  const [bIdx, setBIdx] = useState(0);
  const [wIdx, setWIdx] = useState(0);
  const [wdIdx, setWdIdx] = useState<number>(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  });
  const [sectionStart, setSectionStart] = useState(0);
  const [sectionEnd, setSectionEnd] = useState(1);
  const [results, setResults] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [picker, setPicker] = useState<{
    title: string;
    options: string[];
    idx: number;
    cb: (i: number) => void;
  } | null>(null);
  const initLoading = useRef(true);

  const buildingList = useMemo(
    () => [
      { name: "全部", code: "" },
      ...Object.entries(buildingMap).map(([name, code]) => ({ name, code })),
    ],
    [buildingMap],
  );
  const buildingNames = useMemo(
    () => buildingList.map((b) => b.name),
    [buildingList],
  );
  const sectionLabels = useMemo(
    () =>
      sectionOptions.length >= 2
        ? sectionOptions.map((n) => String(n))
        : ["加载中"],
    [sectionOptions],
  );

  const init = useCallback(async () => {
    try {
      const semesterList = await getSemesterList();
      const semester = semesterList[semesterList.length - 1];
      const [buildings, weeks, timetable, categories, currentWeek] =
        await Promise.all([
          getTeachBuilding(),
          getAllWeek(semester),
          getTimeTable(semester),
          getTeachBuildingCategory(),
          getCurrentWeek(),
        ]);
      setBuildingMap(buildings || {});
      setCategoryMap(categories || {});
      const weekNums = (weeks || [])
        .map((w: Record<string, unknown>) => Number(w.zc))
        .sort((a, b) => a - b)
        .filter(Boolean);
      setWeekOptions(weekNums);
      const sectionNums = (timetable || [])
        .map((t: { jc: string }) => parseInt(t.jc))
        .filter(Boolean);
      setSectionOptions(sectionNums);
      const wkIdx = weekNums.indexOf(Number(currentWeek));
      if (wkIdx !== -1) setWIdx(wkIdx);
      if (sectionNums.length >= 2) {
        setSectionStart(0);
        setSectionEnd(1);
      }
    } catch {
      showToast({ message: "加载失败", type: "error" });
    } finally {
      initDone.current = true;
      initLoading.current = false;
    }
  }, [showToast]);

  useEffect(() => {
    if (isLoggedIn && !initDone.current) {
      void init();
    }
  }, [isLoggedIn, init]);

  const makePicker = useCallback(
    (
      title: string,
      options: string[],
      idx: number,
      cb: (i: number) => void,
    ) => {
      setPicker({ title, options, idx, cb });
    },
    [],
  );

  const doSearch = useCallback(async () => {
    const building = buildingList[bIdx];
    if (!building) {
      showToast({ message: "教学楼数据未加载", type: "warning" });
      return;
    }
    const weekNum = weekOptions[wIdx];
    const startJc = sectionOptions[sectionStart];
    const endJc = sectionOptions[sectionEnd];
    if (weekNum === undefined || !startJc || !endJc) return;
    const range: number[] = [];
    for (let i = startJc; i <= endJc; i++) range.push(i);
    setLoading(true);
    setSearched(true);
    try {
      setResults(
        await getEmptyClassRoom(
          building.code,
          weekNum,
          wdIdx + 1,
          range.join(","),
        ),
      );
    } catch {
      showToast({ message: "查询失败", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [
    buildingList,
    bIdx,
    weekOptions,
    wIdx,
    wdIdx,
    sectionOptions,
    sectionStart,
    sectionEnd,
    showToast,
  ]);

  const isDark = theme.background === "#000000";

  return (
    <ThemedView style={st.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={
          isDark
            ? ["rgb(26,29,46)", "rgb(35,39,64)", "rgb(26,29,46)"]
            : ["#47a5fd", "#cce5ff", "#f2f5f9"]
        }
        locations={[0, 0.28, 1]}
        style={[st.gradient, { paddingTop: insets.top + 8 }]}
      >
        <ScrollView
          style={st.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => void doSearch()}
              colors={["#47a5fd"]}
              tintColor="#47a5fd"
            />
          }
        >
          <View style={st.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
            </TouchableOpacity>
            <HeadStatus text="空教室" />
          </View>
          {!isLoggedIn ? (
            <View style={st.empty}>
              <MaterialIcon
                name="account-alert"
                size={48}
                color={theme.textSecondary}
              />
              <ThemedText style={st.emptyText} themeColor="textSecondary">
                请先登录
              </ThemedText>
            </View>
          ) : initLoading.current ? (
            <ActivityIndicator
              size="large"
              color={theme.primary}
              style={{ marginTop: 40 }}
            />
          ) : (
            <>
              <View style={st.filterRow}>
                <FilterChip
                  label={buildingNames[bIdx] ?? "教学楼"}
                  onPress={() =>
                    makePicker("选择教学楼", buildingNames, bIdx, setBIdx)
                  }
                />
                <FilterChip
                  label={
                    weekOptions[wIdx] !== undefined
                      ? `第${String(weekOptions[wIdx])}周`
                      : "周次"
                  }
                  onPress={() =>
                    makePicker(
                      "选择周次",
                      weekOptions.map((w) => `第${String(w)}周`),
                      wIdx,
                      setWIdx,
                    )
                  }
                />
                <FilterChip
                  label={WEEKDAYS[wdIdx]}
                  onPress={() =>
                    makePicker("选择星期", WEEKDAYS, wdIdx, setWdIdx)
                  }
                />
                <FilterChip
                  label={
                    sectionOptions.length >= 2
                      ? `${String(sectionOptions[sectionStart])}-${String(sectionOptions[sectionEnd])}节`
                      : "节次"
                  }
                  onPress={() =>
                    makePicker(
                      "选择起始节次",
                      sectionLabels,
                      sectionStart,
                      (i) => {
                        setSectionStart(i);
                        setTimeout(
                          () =>
                            makePicker(
                              "选择结束节次",
                              sectionLabels,
                              sectionEnd,
                              (j) => {
                                if (j >= i) setSectionEnd(j);
                                else {
                                  setSectionEnd(i);
                                  setSectionStart(j);
                                }
                                setPicker(null);
                              },
                            ),
                          100,
                        );
                      },
                    )
                  }
                />
              </View>
              <TouchableOpacity
                style={[st.searchBtn, { backgroundColor: theme.primary }]}
                onPress={() => void doSearch()}
              >
                <MaterialIcon name="magnify" size={20} color="#fff" />
                <ThemedText style={st.searchText} themeColor="onPrimary">
                  查询
                </ThemedText>
              </TouchableOpacity>
              {loading ? (
                <ActivityIndicator
                  size="large"
                  color={theme.primary}
                  style={{ marginTop: 40 }}
                />
              ) : !searched ? (
                <View style={st.empty}>
                  <MaterialIcon
                    name="door-open"
                    size={48}
                    color={theme.textSecondary}
                  />
                  <ThemedText style={st.emptyText} themeColor="textSecondary">
                    请选择筛选条件后点击查询
                  </ThemedText>
                </View>
              ) : results.length === 0 ? (
                <View style={st.empty}>
                  <MaterialIcon
                    name="door-open"
                    size={48}
                    color={theme.textSecondary}
                  />
                  <ThemedText style={st.emptyText} themeColor="textSecondary">
                    暂无空闲教室
                  </ThemedText>
                </View>
              ) : (
                <View style={st.roomList}>
                  {results.map((r, i) => (
                    <View
                      key={`${r.jsmc}-${String(i)}`}
                      style={[st.roomCard, { backgroundColor: theme.surface }]}
                    >
                      <View style={st.roomLeft}>
                        <ThemedText style={st.roomName}>{r.jsmc}</ThemedText>
                        <ThemedText
                          style={st.roomMeta}
                          themeColor="textSecondary"
                        >
                          教学楼: {r.jxlmc}
                        </ThemedText>
                        <ThemedText
                          style={st.roomMeta}
                          themeColor="textSecondary"
                        >
                          座位数: {r.maxvolume || "-"}
                        </ThemedText>
                      </View>
                      <ThemedText
                        style={[st.roomType, { color: getHashColor(r.jslx) }]}
                      >
                        {categoryMap[r.jslx] || r.jslx || "-"}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </LinearGradient>
      {picker ? (
        <PickerModal
          visible={true}
          title={picker.title}
          options={picker.options}
          selectedIndex={picker.idx}
          onSelect={(idx) => {
            picker.cb(idx);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      ) : null}
    </ThemedView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollView: { flex: 1, paddingHorizontal: 8 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyText: { fontSize: 16, marginTop: 12 },
  filterRow: { flexDirection: "row", gap: 4, padding: 8, alignItems: "center" },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  chipText: { fontSize: 12, maxWidth: 70 },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  searchText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  roomList: { padding: 8, gap: 8 },
  roomCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    padding: 14,
  },
  roomLeft: { flex: 1 },
  roomName: { fontSize: 15, fontWeight: "500" },
  roomMeta: { fontSize: 12, marginTop: 2 },
  roomType: { fontSize: 13, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 40,
  },
  modalContent: { borderRadius: 12, padding: 20 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  pickerText: { fontSize: 16 },
});
