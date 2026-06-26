import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { router, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';

export default function ClubAddPage() {
  const theme = useTheme();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [intro, setIntro] = useState('');

  const handleSubmit = useCallback(() => {
    if (!name.trim()) { showToast({ message: '请输入社团名称', type: 'warning' }); return; }
    showToast({ message: '社团创建成功', type: 'success' });
    router.back();
  }, [name, showToast]);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} themeColor="onPrimary">添加社团</ThemedText>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.card, { backgroundColor: theme.surfaceVariant }]}>
          <ThemedText style={styles.label}>社团名称</ThemedText>
          <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.outlineVariant }]}
            value={name} onChangeText={setName} placeholder="请输入社团名称" placeholderTextColor={theme.textSecondary} />
        </View>
        <View style={[styles.card, { backgroundColor: theme.surfaceVariant }]}>
          <ThemedText style={styles.label}>社团介绍</ThemedText>
          <TextInput style={[styles.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.outlineVariant }]}
            value={intro} onChangeText={setIntro} placeholder="请输入社团介绍" placeholderTextColor={theme.textSecondary}
            multiline numberOfLines={5} textAlignVertical="top" />
        </View>
        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.primary }]} onPress={handleSubmit}>
          <ThemedText style={styles.submitText}>提交</ThemedText>
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
  card: { borderRadius: 12, padding: 16, marginBottom: 16 },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
  input: { borderRadius: 8, borderWidth: 1, padding: 12, fontSize: 15 },
  textArea: { borderRadius: 8, borderWidth: 1, padding: 12, fontSize: 15, minHeight: 100 },
  submitBtn: { alignItems: 'center', paddingVertical: 14, borderRadius: 12 },
  submitText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
});
