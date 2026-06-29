import { HeadStatus } from "@/components/layout/HeadStatus";
import { MaterialIcon } from "@/components/base/MaterialIcon";
import { ThemedText } from "@/components/themed/ThemedText";
import { ThemedView } from "@/components/themed/ThemedView";
import { useTheme } from "@/hooks/use-theme";
import type { CourseScoreItem } from "@/service/hubt/CourseScores";
import { getCourseScores } from "@/service/hubt/CourseScores";
import { getSemesterList } from "@/service/hubt/CurrentSemester";
import type { ScoresData } from "@/service/hubt/Scores";
import { getScores } from "@/service/hubt/Scores";
import userManager from "@/service/userInfo";
import { useToast } from "@/utils/toast";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function scoreColor(s: number): string {
  if (Number.isNaN(s)) return "#999";
  if (s >= 80) return "#07c160";
  if (s >= 60) return "#f0ad4e";
  return "#e74c3c";
}

const PASS_OPTIONS = ["全部", "及格", "不及格"];
const SORT_OPTIONS = ["默认", "高→低", "低→高"];

export default function ScoresPage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const initialized = useRef(false);
  const [isLoggedIn, setIsLoggedIn] = useState(userManager.checkLogin());
  const [semesterList, setSemesterList] = useState<string[]>([]);
  const [overview, setOverview] = useState<ScoresData | null>(null);
  const [courseScores, setCourseScores] = useState<CourseScoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [passIdx, setPassIdx] = useState(0);
  const [sortIdx, setSortIdx] = useState(0);
  const [showSemesterPicker, setShowSemesterPicker] = useState(false);
  const semesterOptions = useMemo(
    () => ["全部", ...semesterList],
    [semesterList],
  );
  const [semesterIdx, setSemesterIdx] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setIsLoggedIn(userManager.checkLogin());
    }, []),
  );

  useEffect(() => {
    if (!isLoggedIn) return;
    if (initialized.current) return;
    initialized.current = true;
    void (async () => {
      try {
        const list = await getSemesterList();
        setSemesterList(list);
      } catch {
        /* ignore */
      }
    })();
  }, [isLoggedIn]);

  const fetch = useCallback(
    async (force = false) => {
      if (!isLoggedIn) return;
      setLoading(true);
      try {
        const [ov, cs] = await Promise.all([
          getScores(force),
          getCourseScores(
            semesterList.length > 0
              ? semesterList[semesterList.length - 1]
              : "",
            force,
          ),
        ]);
        setOverview(ov);
        setCourseScores(cs);
      } catch {
        showToast({ message: "获取成绩失败", type: "error" });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isLoggedIn, semesterList, showToast],
  );

  useEffect(() => {
    if (!isLoggedIn || semesterList.length === 0) return;
    void fetch();
  }, [isLoggedIn, semesterList, fetch]);

  const filtered = useMemo(() => {
    let list = [...courseScores];
    if (semesterIdx > 0) {
      const target = semesterList[semesterIdx - 1];
      list = list.filter((s) => s.xnxq === target);
    }
    if (passIdx === 1) list = list.filter((s) => s.zhcj >= 60);
    if (passIdx === 2) list = list.filter((s) => s.zhcj < 60);
    if (sortIdx === 1) list.sort((a, b) => b.zhcj - a.zhcj);
    if (sortIdx === 2) list.sort((a, b) => a.zhcj - b.zhcj);
    return list;
  }, [courseScores, passIdx, sortIdx, semesterIdx, semesterList]);

  const isDark = theme.background === "#000000";
  const gradientColors: [string, ...string[]] = isDark
    ? ["rgb(26,29,46)", "rgb(35,39,64)", "rgb(26,29,46)"]
    : ["#47a5fd", "#cce5ff", "#f2f5f9"];

  const stats = overview
    ? [
        {
          label: "学分绩点",
          value: overview.gpa.toFixed(2),
          icon: "school" as const,
          warn: false,
        },
        {
          label: "平均成绩",
          value: overview.averageScore.toFixed(2),
          icon: "chart-bar" as const,
          warn: false,
        },
        {
          label: "不及格",
          value: String(overview.notPass),
          icon: "alert-circle" as const,
          warn: overview.notPass > 0,
        },
        {
          label: "获得学分",
          value: String(overview.gottenCredits),
          icon: "check-circle" as const,
          warn: false,
        },
        {
          label: "已选课程",
          value: String(overview.chosenClass),
          icon: "book-open-variant" as const,
          warn: false,
        },
        {
          label: "绩点排名",
          value: overview.gpaRank || "-",
          icon: "trophy" as const,
          warn: false,
        },
      ]
    : [];

  return (
    <ThemedView style={st.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.28, 1]}
        style={[st.gradient, { paddingTop: insets.top + 8 }]}
      >
        <ScrollView
          style={st.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void fetch(true);
              }}
              colors={["#47a5fd"]}
              tintColor="#47a5fd"
            />
          }
        >
          <View style={st.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
            </TouchableOpacity>
            <HeadStatus text="成绩" />
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
          ) : loading && !overview ? (
            <View style={st.empty}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : (
            <>
              {/* Overview stat cards */}
              {overview ? (
                <View style={st.statsGrid}>
                  {stats.map((item) => (
                    <View
                      key={item.label}
                      style={[st.statCard, { backgroundColor: theme.surface }]}
                    >
                      <MaterialIcon
                        name={item.icon}
                        size={22}
                        color={item.warn ? "#e74c3c" : "#47a5fd"}
                      />
                      <ThemedText
                        style={[
                          st.statValue,
                          item.warn && { color: "#e74c3c" },
                        ]}
                      >
                        {item.value}
                      </ThemedText>
                      <ThemedText
                        style={st.statLabel}
                        themeColor="textSecondary"
                      >
                        {item.label}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Course scores filter bar */}
              <View style={st.filterBar}>
                <TouchableOpacity
                  style={[st.filterChip, { backgroundColor: theme.surface }]}
                  onPress={() => setShowSemesterPicker(true)}
                >
                  <ThemedText style={st.filterText}>
                    {semesterOptions[semesterIdx]}
                  </ThemedText>
                  <MaterialIcon
                    name="chevron-down"
                    size={14}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
                {PASS_OPTIONS.map((l, i) => (
                  <TouchableOpacity
                    key={l}
                    style={[
                      st.filterChip,
                      {
                        backgroundColor:
                          passIdx === i ? theme.primary : theme.surface,
                      },
                    ]}
                    onPress={() => setPassIdx(i)}
                  >
                    <ThemedText
                      style={[
                        st.filterText,
                        passIdx === i && { color: "#fff" },
                      ]}
                    >
                      {l}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[st.filterChip, { backgroundColor: theme.surface }]}
                  onPress={() => setSortIdx((sortIdx + 1) % 3)}
                >
                  <ThemedText style={st.filterText}>
                    {SORT_OPTIONS[sortIdx]}
                  </ThemedText>
                  <MaterialIcon
                    name="swap-vertical"
                    size={14}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Course scores list */}
              {filtered.length === 0 ? (
                <View style={st.empty}>
                  <ThemedText style={st.emptyText} themeColor="textSecondary">
                    暂无课程成绩
                  </ThemedText>
                </View>
              ) : (
                <View style={st.list}>
                  {filtered.map((item, idx) => (
                    <View
                      key={`${item.kcmc}-${String(idx)}`}
                      style={[st.card, { backgroundColor: theme.surface }]}
                    >
                      <View style={st.cardLeft}>
                        <ThemedText style={st.courseName}>
                          {item.kcmc}
                        </ThemedText>
                        <ThemedText style={st.meta} themeColor="textSecondary">
                          {item.xnxq} | {item.xf}学分 |{" "}
                          {item.sfbk === "1" ? "补考" : "正考"}
                        </ThemedText>
                      </View>
                      <ThemedText
                        style={[st.score, { color: scoreColor(item.zhcj) }]}
                      >
                        {Number.isNaN(item.zhcj) ? "--" : String(item.zhcj)}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </LinearGradient>

      {/* Semester picker modal */}
      {showSemesterPicker ? <View style={st.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowSemesterPicker(false)}
          />
          <View style={[st.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[st.modalTitle, { color: theme.text }]}>选择学期</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {semesterOptions.map((sem, idx) => {
                const sel = semesterIdx === idx;
                return (
                  <TouchableOpacity
                    key={sem}
                    style={[
                      st.semItem,
                      sel && { backgroundColor: theme.backgroundSelected },
                    ]}
                    onPress={() => {
                      setSemesterIdx(idx);
                      setShowSemesterPicker(false);
                    }}
                  >
                    <MaterialIcon
                      name={sel ? "radiobox-marked" : "radiobox-blank"}
                      size={22}
                      color={sel ? "#47a5fd" : theme.textSecondary}
                    />
                    <Text style={[st.semItemText, { color: theme.text }]}>
                      {sem}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View> : null}
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  statCard: {
    width: "47%",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: { fontSize: 24, fontWeight: "700", marginTop: 8 },
  statLabel: { fontSize: 12, marginTop: 4 },
  filterBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexWrap: "wrap",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterText: { fontSize: 13, fontWeight: "500" },
  list: { paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLeft: { flex: 1, marginRight: 12 },
  courseName: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 4 },
  score: { fontSize: 28, fontWeight: "700" },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 40,
    zIndex: 100,
  },
  modalContent: { borderRadius: 16, padding: 20 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  semItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  semItemText: { fontSize: 16 },
});
