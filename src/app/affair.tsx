import { useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';

const affairCategories = [
  { title: '学生证相关', items: ['学生证补办', '学生证充磁', '火车票优惠卡'] },
  { title: '选课相关', items: ['选课流程', '退课申请', '重修报名', '辅修申请'] },
  { title: '奖学金', items: ['国家奖学金', '国家励志奖学金', '校级奖学金', '企业奖学金'] },
  { title: '宿舍相关', items: ['宿舍申请', '调换宿舍', '退宿手续'] },
  { title: '医保相关', items: ['医保报销', '门诊就医', '住院流程'] },
  { title: '毕业相关', items: ['毕业论文', '毕业实习', '离校手续', '学历认证'] },
];

export default function AffairPage() {
  const theme = useTheme();
  const navigateBack = useCallback(() => router.back(), []);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} themeColor="onPrimary">办事指南</ThemedText>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scrollView}>
        {affairCategories.map((cat) => (
          <View key={cat.title} style={styles.group}>
            <ThemedText style={styles.groupTitle}>{cat.title}</ThemedText>
            <View style={styles.itemsList}>
              {cat.items.map((item) => (
                <View key={item} style={[styles.itemCard, { backgroundColor: theme.surfaceVariant }]}>
                  <MaterialIcon name="clipboard-text-outline" size={18} color={theme.primary} />
                  <ThemedText style={styles.itemText}>{item}</ThemedText>
                  <MaterialIcon name="chevron-right" size={18} color={theme.textSecondary} />
                </View>
              ))}
            </View>
          </View>
        ))}
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
  group: { marginBottom: 20 },
  groupTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  itemsList: { gap: 8 },
  itemCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, padding: 14 },
  itemText: { fontSize: 15, flex: 1 },
  bottomSpacer: { height: 40 },
});
