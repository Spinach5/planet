import { useState, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { router, Stack } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';

interface LogEntry {
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  time: string;
}

const mockLogs: LogEntry[] = [
  { level: 'INFO', message: '[App] 应用启动成功', time: '10:00:01' },
  { level: 'INFO', message: '[Cache] 从缓存加载用户信息成功', time: '10:00:02' },
  { level: 'DEBUG', message: '[Weather] 获取天气数据: 武汉, 晴, 28°C', time: '10:00:03' },
  { level: 'WARN', message: '[Request] 请求超时，正在重试: /admin/api/getXlzc', time: '10:01:00' },
  { level: 'ERROR', message: '[Login] 登录失败: 密码错误', time: '10:02:00' },
  { level: 'INFO', message: '[Course] 课表数据已更新: 第16周', time: '10:03:00' },
];

const levelColors: Record<string, string> = {
  DEBUG: '#999',
  INFO: '#0288d1',
  WARN: '#ed6c02',
  ERROR: '#d32f2f',
};

export default function RuntimeLogPage() {
  const theme = useTheme();
  const { showToast } = useToast();
  // eslint-disable-next-line react/hook-use-state
  const [logs] = useState<LogEntry[]>(mockLogs);

  const copyAll = useCallback(async () => {
    const text = logs.map((l) => `[${l.time}] [${l.level}] ${l.message}`).join('\n');
    await Clipboard.setStringAsync(text);
    showToast({ message: '日志已复制', type: 'success' });
  }, [logs, showToast]);

  const clearLogs = useCallback(() => {
    Alert.alert('确认', '是否清除所有日志？', [
      { text: '取消', style: 'cancel' },
      { text: '确定', style: 'destructive', onPress: () => { showToast({ message: '日志已清除', type: 'success' }); } },
    ]);
  }, [showToast]);

  const navigateBack = useCallback(() => router.back(), []);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} themeColor="onPrimary">运行日志</ThemedText>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => { void copyAll(); }} style={styles.actionBtn}>
            <MaterialIcon name="content-copy" size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={clearLogs} style={styles.actionBtn}>
            <MaterialIcon name="delete-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.scrollView}>
        {logs.length === 0 ? (
          <View style={styles.emptyView}>
            <ThemedText themeColor="textSecondary">暂无日志</ThemedText>
          </View>
        ) : (
          logs.map((log, idx) => (
            <View key={`${log.time}-${String(idx)}`} style={[styles.logItem, { borderLeftColor: levelColors[log.level] ?? '#999' }]}>
              <ThemedText style={styles.logTime} themeColor="textSecondary">{log.time}</ThemedText>
              <View style={[styles.levelBadge, { backgroundColor: levelColors[log.level] ?? '#999' }]}>
                <ThemedText style={styles.levelText}>{log.level}</ThemedText>
              </View>
              <ThemedText style={styles.logMsg} numberOfLines={2}>{log.message}</ThemedText>
            </View>
          ))
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
  headerActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1, padding: 16 },
  emptyView: { alignItems: 'center', paddingTop: 80 },
  logItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 8, paddingLeft: 10, borderLeftWidth: 3, marginBottom: 4 },
  logTime: { fontSize: 11, width: 54, fontVariant: ['tabular-nums'] },
  levelBadge: { borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  levelText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  logMsg: { fontSize: 13, flex: 1, lineHeight: 18 },
  bottomSpacer: { height: 40 },
});
