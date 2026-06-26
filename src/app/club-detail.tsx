import { useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';

export default function ClubDetailPage() {
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
        <ThemedText style={styles.headerTitle} themeColor="onPrimary">社团详情</ThemedText>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.card, { backgroundColor: theme.surfaceVariant }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primaryContainer }]}>
            <ThemedText style={[styles.avatarText, { color: theme.primary }]}>社</ThemedText>
          </View>
          <ThemedText style={styles.name}>社团名称</ThemedText>
          <ThemedText style={styles.meta} themeColor="textSecondary">学术科技 · 校级 · 计算机学院</ThemedText>
          <ThemedText style={styles.intro}>{`社团ID: ${id}\n\n这里是社团介绍内容。包含社团的宗旨、活动、历史等信息。`}</ThemedText>
        </View>
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
  card: { borderRadius: 12, padding: 20, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  meta: { fontSize: 13, marginBottom: 16 },
  intro: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
