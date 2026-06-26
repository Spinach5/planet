import { useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';

const foodGroups = [
  { name: '东区食堂', items: ['一楼自选餐', '二楼小炒', '麻辣香锅', '兰州拉面', '黄焖鸡米饭'] },
  { name: '西区食堂', items: ['一楼大众餐', '二楼特色菜', '煲仔饭', '炸鸡汉堡', '麻辣烫'] },
  { name: '北区食堂', items: ['教师餐厅', '学生食堂', '饺子馆', '面馆'] },
  { name: '周边美食', items: ['南门小吃街', '西门夜市', '烧烤店', '火锅店', '奶茶店'] },
];

export default function FoodPage() {
  const theme = useTheme();
  const navigateBack = useCallback(() => router.back(), []);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} themeColor="onPrimary">美食指南</ThemedText>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scrollView}>
        {foodGroups.map((group) => (
          <View key={group.name} style={styles.group}>
            <ThemedText style={styles.groupTitle}>{group.name}</ThemedText>
            <View style={styles.itemsList}>
              {group.items.map((item) => (
                <View key={item} style={[styles.itemCard, { backgroundColor: theme.surfaceVariant }]}>
                  <MaterialIcon name="food-variant" size={20} color={theme.primary} />
                  <ThemedText style={styles.itemText}>{item}</ThemedText>
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
  itemText: { fontSize: 15 },
  bottomSpacer: { height: 40 },
});
