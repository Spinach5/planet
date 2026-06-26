import { useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { router, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';

const techStack = ['Expo SDK 56', 'React Native 0.85', 'TypeScript', 'react-native-paper (MD3)', 'axios', 'AsyncStorage'];

export default function JoinPage() {
  const theme = useTheme();
  const navigateBack = useCallback(() => router.back(), []);

  const openEmail = useCallback(() => {
    void Linking.openURL('mailto:spinach@example.com');
  }, []);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} themeColor="onPrimary">加入我们</ThemedText>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.card, { backgroundColor: theme.surfaceVariant }]}>
          <ThemedText style={styles.appName}>炖仔鸡</ThemedText>
          <ThemedText style={styles.desc} themeColor="textSecondary">
            湖北工业大学校园生活助手，提供课表查询、考试安排、成绩查看、空教室查询、天气、社团、二手书交易等功能。
          </ThemedText>
        </View>

        <ThemedText style={styles.sectionTitle}>技术栈</ThemedText>
        <View style={styles.techGrid}>
          {techStack.map((tech) => (
            <View key={tech} style={[styles.techChip, { backgroundColor: theme.primaryContainer }]}>
              <ThemedText style={[styles.techText, { color: theme.primary }]}>{tech}</ThemedText>
            </View>
          ))}
        </View>

        <ThemedText style={styles.sectionTitle}>参与贡献</ThemedText>
        <View style={[styles.card, { backgroundColor: theme.surfaceVariant }]}>
          <ThemedText style={styles.desc} themeColor="textSecondary">
            欢迎通过以下方式参与项目：
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={styles.bullet} themeColor="textSecondary">· 在 Gitee 提交 Issue 或 PR</ThemedText>
            <ThemedText style={styles.bullet} themeColor="textSecondary">· 完善文档和翻译</ThemedText>
            <ThemedText style={styles.bullet} themeColor="textSecondary">· 反馈问题和建议</ThemedText>
          </View>
        </View>

        <TouchableOpacity style={[styles.contactBtn, { backgroundColor: theme.primary }]} onPress={openEmail}>
          <MaterialIcon name="email-outline" size={20} color="#ffffff" />
          <ThemedText style={styles.contactText}>联系我们</ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.footer} themeColor="textSecondary">
          MIT License · 鄂ICP备XXXXXXXX号
        </ThemedText>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#ffffff' },
  headerSpacer: { width: 40 },
  scrollView: { flex: 1, padding: 16 },
  card: { borderRadius: 12, padding: 16, marginBottom: 16 },
  appName: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  desc: { fontSize: 15, lineHeight: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10, marginTop: 4 },
  techGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  techChip: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  techText: { fontSize: 13, fontWeight: '500' },
  bulletList: { marginTop: 8, gap: 6 },
  bullet: { fontSize: 14, lineHeight: 20 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  contactText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 20 },
  bottomSpacer: { height: 40 },
});
