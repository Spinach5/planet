import { useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';

export default function BooksDetailPage() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigateBack = useCallback(() => router.back(), []);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} themeColor="onPrimary">书籍详情</ThemedText>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.cover, { backgroundColor: theme.primaryContainer }]}>
          <MaterialIcon name="book-open-page-variant" size={64} color={theme.primary} />
        </View>
        <ThemedText style={styles.title}>数据结构（C语言版）</ThemedText>
        <ThemedText style={styles.price} themeColor="error">¥15.00</ThemedText>
        <View style={[styles.card, { backgroundColor: theme.surfaceVariant }]}>
          <ThemedText style={styles.metaItem}>出版社: 清华大学出版社</ThemedText>
          <ThemedText style={styles.metaItem}>作者: 严蔚敏</ThemedText>
          <ThemedText style={styles.metaItem}>ISBN: 978-7-302-14751-0</ThemedText>
          <ThemedText style={styles.metaItem}>分类: 教材 · 计算机</ThemedText>
          <ThemedText style={styles.metaItem}>成色: 九成新</ThemedText>
          <ThemedText style={styles.metaItem}>配送: 可送货</ThemedText>
          <ThemedText style={styles.metaItem}>书籍ID: {id}</ThemedText>
        </View>
        <TouchableOpacity style={[styles.contactBtn, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/chat-detail')}>
          <MaterialIcon name="message-text-outline" size={20} color="#ffffff" />
          <ThemedText style={styles.contactText}>联系卖家</ThemedText>
        </TouchableOpacity>
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
  cover: { height: 200, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  price: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  card: { borderRadius: 12, padding: 16, marginBottom: 16, gap: 8 },
  metaItem: { fontSize: 14 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  contactText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
});
