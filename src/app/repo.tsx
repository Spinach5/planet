import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, Stack } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { ActivityIndicator } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';

interface RepoInfo {
  name: string;
  url: string;
  contributors: number;
  commits: number;
  latestCommit: { message: string; author: string; date: string };
}

export default function RepoPage() {
  const theme = useTheme();
  const { showToast } = useToast();
  const [repo, setRepo] = useState<RepoInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated fetch - in production, fetch from Gitee API
    const timer = setTimeout(() => {
      setRepo({
        name: '炖仔鸡',
        url: 'https://gitee.com/spinach/ysx',
        contributors: 5,
        commits: 128,
        latestCommit: { message: 'feat: migrate to Expo SDK 56', author: 'Spinach', date: '2026-06-25' },
      });
      setLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const copyUrl = useCallback(async () => {
    if (repo) {
      await Clipboard.setStringAsync(repo.url);
      showToast({ message: '链接已复制', type: 'success' });
    }
  }, [repo, showToast]);

  const navigateBack = useCallback(() => router.back(), []);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} themeColor="onPrimary">开源仓库</ThemedText>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scrollView}>
        {loading ? (
          <View style={styles.emptyView}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : !repo ? null : (
          <>
            <View style={[styles.card, { backgroundColor: theme.surfaceVariant }]}>
              <ThemedText style={styles.repoName}>{repo.name}</ThemedText>
              <TouchableOpacity onPress={copyUrl} style={styles.urlRow}>
                <ThemedText style={styles.repoUrl} themeColor="textSecondary">{repo.url}</ThemedText>
                <MaterialIcon name="content-copy" size={16} color={theme.primary} />
              </TouchableOpacity>
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <ThemedText style={styles.statValue}>{repo.contributors}</ThemedText>
                  <ThemedText style={styles.statLabel} themeColor="textSecondary">贡献者</ThemedText>
                </View>
                <View style={styles.stat}>
                  <ThemedText style={styles.statValue}>{repo.commits}</ThemedText>
                  <ThemedText style={styles.statLabel} themeColor="textSecondary">提交</ThemedText>
                </View>
              </View>
            </View>

            <ThemedText style={styles.sectionTitle}>最新提交</ThemedText>
            <View style={[styles.card, { backgroundColor: theme.surfaceVariant }]}>
              <ThemedText style={styles.commitMsg}>{repo.latestCommit.message}</ThemedText>
              <ThemedText style={styles.commitMeta} themeColor="textSecondary">
                {repo.latestCommit.author} · {repo.latestCommit.date}
              </ThemedText>
            </View>
          </>
        )}
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
  emptyView: { alignItems: 'center', paddingTop: 80 },
  card: { borderRadius: 12, padding: 16, marginBottom: 12 },
  repoName: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  urlRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  repoUrl: { fontSize: 14, flex: 1 },
  stats: { flexDirection: 'row', gap: 32 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 8 },
  commitMsg: { fontSize: 14, fontWeight: '500' },
  commitMeta: { fontSize: 12, marginTop: 4 },
  bottomSpacer: { height: 40 },
});
