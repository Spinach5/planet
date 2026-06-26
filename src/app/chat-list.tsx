import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';

interface Conversation {
  id: string;
  name: string;
  lastMsg: string;
  time: string;
  unread: number;
  bookName: string;
}

export default function ChatListPage() {
  const theme = useTheme();
  // eslint-disable-next-line react/hook-use-state
  const [conversations] = useState<Conversation[]>([
    { id: '1', name: '小明', lastMsg: '这本书还在吗？', time: '10:30', unread: 2, bookName: '数据结构' },
    { id: '2', name: '小红', lastMsg: '好的，明天见', time: '昨天', unread: 0, bookName: '高等数学' },
  ]);

  const navigateBack = useCallback(() => router.back(), []);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} themeColor="onPrimary">消息</ThemedText>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scrollView}>
        {conversations.length === 0 ? (
          <View style={styles.emptyView}>
            <ThemedText themeColor="textSecondary">暂无消息</ThemedText>
          </View>
        ) : (
          conversations.map((conv) => (
            <TouchableOpacity key={conv.id}
              style={[styles.convItem, { borderBottomColor: theme.outlineVariant }]}
              onPress={() => router.push('/chat-detail')}>
              <View style={[styles.avatar, { backgroundColor: theme.primaryContainer }]}>
                <ThemedText style={[styles.avatarText, { color: theme.primary }]}>
                  {conv.name.charAt(0)}
                </ThemedText>
              </View>
              <View style={styles.convInfo}>
                <View style={styles.convHeader}>
                  <ThemedText style={styles.convName}>{conv.name}</ThemedText>
                  <ThemedText style={styles.convTime} themeColor="textSecondary">{conv.time}</ThemedText>
                </View>
                <View style={styles.convMeta}>
                  <ThemedText style={styles.convBook} themeColor="textSecondary">[{conv.bookName}]</ThemedText>
                  <ThemedText style={styles.convMsg} numberOfLines={1} themeColor="textSecondary">{conv.lastMsg}</ThemedText>
                </View>
              </View>
              {conv.unread > 0 ? (
                <View style={[styles.badge, { backgroundColor: theme.error }]}>
                  <ThemedText style={styles.badgeText}>{conv.unread}</ThemedText>
                </View>
              ) : null}
            </TouchableOpacity>
          ))
        )}
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
  scrollView: { flex: 1 },
  emptyView: { alignItems: 'center', paddingTop: 80 },
  convItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700' },
  convInfo: { flex: 1 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  convName: { fontSize: 16, fontWeight: '600' },
  convTime: { fontSize: 12 },
  convMeta: { flexDirection: 'row', gap: 4 },
  convBook: { fontSize: 12 },
  convMsg: { fontSize: 12, flex: 1 },
  badge: { borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#ffffff' },
});
