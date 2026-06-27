import { HeadStatus } from "@/components/HeadStatus";
import { MaterialIcon } from "@/components/MaterialIcon";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { getSemesterList } from "@/service/hubt/CurrentSemester";
import { getExamInfo } from "@/service/hubt/ExamInfo";
import userManager from "@/service/userInfo";
import { useToast } from "@/utils/toast";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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

interface ExamItem {
  kcmc: string;
  kspcmc: string;
  jsmc: string;
  kssj: string;
  ksfs: string;
  zwh: string;
}

function getExamStatus(kssj: string): { text: string; color: string } {
  const [datePart, timePart] = kssj.split(" ");
  const [startTime, endTime] = timePart.split("~");
  const start = new Date(`${datePart}T${startTime}:00`).getTime();
  const end = new Date(`${datePart}T${endTime}:00`).getTime();
  const now = Date.now();
  if (now < start) return { text: "待开始", color: "#07c160" };
  if (now <= end) return { text: "进行中", color: "#f0ad4e" };
  return { text: "已结束", color: "#999" };
}

function formatExamDate(kssj: string): string {
  const [datePart, timePart] = kssj.split(" ");
  const [, month, day] = datePart.split("-");
  return `${month}-${day} ${timePart}`;
}

export default function ExamPage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const initialized = useRef(false);
  const [isLoggedIn, setIsLoggedIn] = useState(userManager.checkLogin());
  const [semesterList, setSemesterList] = useState<string[]>([]);
  const [currentSemester, setCurrentSemester] = useState("");
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSemesterPicker, setShowSemesterPicker] = useState(false);

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
        if (list.length > 0) setCurrentSemester(list[list.length - 1]);
      } catch {
        /* ignore */
      }
    })();
  }, [isLoggedIn]);

  const fetchExams = useCallback(
    async (forceRefresh = false) => {
      if (!isLoggedIn || !currentSemester) return;
      setLoading(true);
      try {
        const data = await getExamInfo(currentSemester, forceRefresh);
        setExams(data.exams || []);
      } catch {
        showToast({ message: "获取考试信息失败", type: "error" });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isLoggedIn, currentSemester, showToast],
  );

  useEffect(() => {
    if (!isLoggedIn || !currentSemester) return;
    void fetchExams();
  }, [isLoggedIn, currentSemester, fetchExams]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchExams(true);
  }, [fetchExams]);
  const isDark = theme.background === "#000000";

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={
          isDark
            ? ["rgb(26,29,46)", "rgb(35,39,64)", "rgb(26,29,46)"]
            : ["#47a5fd", "#cce5ff", "#f2f5f9"]
        }
        locations={[0, 0.28, 1]}
        style={[styles.gradient, { paddingTop: insets.top + 8 }]}
      >
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#47a5fd"]}
              tintColor="#47a5fd"
            />
          }
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
            </TouchableOpacity>
            <HeadStatus text="考试" />
          </View>

          {!isLoggedIn ? (
            <View style={styles.empty}>
              <MaterialIcon
                name="account-alert"
                size={48}
                color={theme.textSecondary}
              />
              <ThemedText style={styles.emptyText} themeColor="textSecondary">
                请先登录
              </ThemedText>
            </View>
          ) : (
            <>
              <View style={styles.semesterBar}>
                <ThemedText style={styles.semesterLabel}>学期选择:</ThemedText>
                <TouchableOpacity
                  style={[
                    styles.semesterBtn,
                    { backgroundColor: theme.surface },
                  ]}
                  onPress={() => setShowSemesterPicker(true)}
                >
                  <Text style={{ color: theme.text, fontSize: 14 }}>
                    {currentSemester || "选择学期"}
                  </Text>
                  <MaterialIcon
                    name="chevron-down"
                    size={18}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.empty}>
                  <ActivityIndicator size="large" color={theme.primary} />
                </View>
              ) : exams.length === 0 ? (
                <View style={styles.empty}>
                  <MaterialIcon
                    name="clipboard-text-outline"
                    size={48}
                    color={theme.textSecondary}
                  />
                  <ThemedText
                    style={styles.emptyText}
                    themeColor="textSecondary"
                  >
                    暂无考试信息
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.list}>
                  {exams.map((exam, idx) => {
                    const st = getExamStatus(exam.kssj);
                    return (
                      <View
                        key={`${exam.kcmc}-${String(idx)}`}
                        style={[
                          styles.card,
                          { backgroundColor: theme.surface },
                        ]}
                      >
                        <View style={styles.cardHeader}>
                          <ThemedText style={styles.subject}>
                            {exam.kcmc}
                          </ThemedText>
                          <View
                            style={[
                              styles.badge,
                              { backgroundColor: st.color },
                            ]}
                          >
                            <Text style={styles.badgeText}>{st.text}</Text>
                          </View>
                        </View>
                        <ThemedText
                          style={styles.info}
                          themeColor="textSecondary"
                        >
                          考试批次: {exam.kspcmc}
                        </ThemedText>
                        <ThemedText
                          style={styles.info}
                          themeColor="textSecondary"
                        >
                          教室: {exam.jsmc}
                        </ThemedText>
                        <ThemedText
                          style={styles.info}
                          themeColor="textSecondary"
                        >
                          时间: {formatExamDate(exam.kssj)}
                        </ThemedText>
                        <ThemedText
                          style={styles.info}
                          themeColor="textSecondary"
                        >
                          方式: {exam.ksfs}
                        </ThemedText>
                        <ThemedText
                          style={styles.info}
                          themeColor="textSecondary"
                        >
                          座位: {exam.zwh}
                        </ThemedText>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </LinearGradient>

      {showSemesterPicker ? (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowSemesterPicker(false)}
          />
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              选择学期
            </Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {semesterList.map((sem) => {
                const selected = currentSemester === sem;
                return (
                  <TouchableOpacity
                    key={sem}
                    style={[
                      styles.semItem,
                      selected && { backgroundColor: theme.backgroundSelected },
                    ]}
                    onPress={() => {
                      setCurrentSemester(sem);
                      setShowSemesterPicker(false);
                    }}
                  >
                    <MaterialIcon
                      name={selected ? "radiobox-marked" : "radiobox-blank"}
                      size={22}
                      color={selected ? "#47a5fd" : theme.textSecondary}
                    />
                    <Text style={[styles.semItemText, { color: theme.text }]}>
                      {sem}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
  semesterBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  semesterLabel: { fontSize: 14, fontWeight: "600" },
  semesterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  list: { padding: 12, gap: 10 },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  subject: { fontSize: 16, fontWeight: "600", flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: "600", color: "#fff" },
  info: { fontSize: 13, lineHeight: 20 },
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
  modalContent: { borderRadius: 12, padding: 20 },
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
