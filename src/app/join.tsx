import { HeadStatus } from "@/components/layout/HeadStatus";
import { MaterialIcon } from "@/components/base/MaterialIcon";
import { ThemedText } from "@/components/themed/ThemedText";
import { ThemedView } from "@/components/themed/ThemedView";
import { useTheme } from "@/hooks/use-theme";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import {
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const techs = [
  "Expo SDK 56",
  "React Native 0.85",
  "TypeScript",
  "react-native-paper",
  "axios",
];

export default function JoinPage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme.background === "#000000";
  return (
    <ThemedView style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={
          isDark
            ? ["rgb(26,29,46)", "rgb(35,39,64)", "rgb(26,29,46)"]
            : ["#47a5fd", "#cce5ff", "#f2f5f9"]
        }
        locations={[0, 0.28, 1]}
        style={[s.gradient, { paddingTop: insets.top + 8 }]}
      >
        <ScrollView style={s.scroll}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcon name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <HeadStatus text="关于我们" />
          </View>
          <View style={[s.card, { backgroundColor: theme.surface }]}>
            <ThemedText style={s.name}>Planet课表</ThemedText>
            <ThemedText style={s.desc} themeColor="textSecondary">
              校园生活助手，提供课表查询、考试安排、成绩查看、空教室查询、天气、社团、二手书交易等功能。
            </ThemedText>
          </View>
          <ThemedText style={s.sec}>技术栈</ThemedText>
          <View style={s.techGrid}>
            {techs.map((t) => (
              <View
                key={t}
                style={[s.chip, { backgroundColor: theme.primaryContainer }]}
              >
                <ThemedText style={[s.chipText, { color: theme.primary }]}>
                  {t}
                </ThemedText>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={[s.btn, { backgroundColor: theme.primary }]}
            onPress={() => {
              void Linking.openURL("mailto:spinach@example.com");
            }}
          >
            <MaterialIcon name="email-outline" size={20} color="#fff" />
            <ThemedText style={s.btnText}>联系我们</ThemedText>
          </TouchableOpacity>
          <ThemedText style={s.footer} themeColor="textSecondary">
            MIT License
          </ThemedText>
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 8 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  name: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  desc: { fontSize: 15, lineHeight: 22 },
  sec: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    marginHorizontal: 8,
  },
  techGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginHorizontal: 8,
    marginBottom: 20,
  },
  chip: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 13, fontWeight: "500" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  btnText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  footer: { fontSize: 12, textAlign: "center", marginTop: 20 },
});
