import { useState, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';

export default function FeedbackPage() {
  const theme = useTheme();
  const { showToast } = useToast();
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!content.trim()) {
      showToast({ message: '请输入反馈内容', type: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      // In production, submit to Gitee Issues API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast({ message: '反馈提交成功，感谢！', type: 'success' });
      setContent('');
      setContact('');
    } catch {
      showToast({ message: '提交失败，请稍后重试', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }, [content, showToast]);

  const navigateBack = useCallback(() => router.back(), []);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} themeColor="onPrimary">反馈</ThemedText>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.card, { backgroundColor: theme.surfaceVariant }]}>
          <ThemedText style={styles.label}>反馈内容</ThemedText>
          <TextInput
            style={[styles.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.outlineVariant }]}
            value={content}
            onChangeText={setContent}
            placeholder="请输入您的反馈或建议（500字以内）"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={6}
            maxLength={500}
            textAlignVertical="top"
          />
          <ThemedText style={styles.charCount} themeColor="textSecondary">
            {content.length}/500
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surfaceVariant }]}>
          <ThemedText style={styles.label}>联系方式（选填）</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.outlineVariant }]}
            value={contact}
            onChangeText={setContact}
            placeholder="QQ/微信/邮箱，方便我们联系您"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: submitting ? theme.textSecondary : theme.primary }]}
          onPress={() => { void handleSubmit(); }}
          disabled={submitting}
        >
          <MaterialIcon name="send" size={20} color="#ffffff" />
          <ThemedText style={styles.submitText}>
            {submitting ? '提交中...' : '提交反馈'}
          </ThemedText>
        </TouchableOpacity>

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
  label: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
  textArea: { borderRadius: 8, borderWidth: 1, padding: 12, fontSize: 15, minHeight: 120 },
  charCount: { fontSize: 12, textAlign: 'right', marginTop: 4 },
  input: { borderRadius: 8, borderWidth: 1, padding: 12, fontSize: 15 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  submitText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  bottomSpacer: { height: 40 },
});
