import { useState, useCallback, useRef } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';

interface Message {
  id: string;
  text: string;
  isMe: boolean;
  time: string;
}

export default function ChatDetailPage() {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: '你好，这本书还在吗？', isMe: false, time: '10:25' },
    { id: '2', text: '在的，要看看吗？', isMe: true, time: '10:26' },
    { id: '3', text: '好的，什么时候方便？', isMe: false, time: '10:28' },
  ]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const nextId = useRef(10);

  const sendMessage = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    const newMsg: Message = {
      id: String(nextId.current++),
      text,
      isMe: true,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [inputText]);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <ThemedText style={styles.headerTitle} themeColor="onPrimary">小明</ThemedText>
          <ThemedText style={styles.headerSub} themeColor="onPrimary">数据结构（C语言版）</ThemedText>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} style={styles.scrollView}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
          {messages.map((msg) => (
            <View key={msg.id} style={[styles.msgRow, msg.isMe ? styles.msgRowRight : styles.msgRowLeft]}>
              <View style={[styles.msgBubble, {
                backgroundColor: msg.isMe ? theme.primary : theme.surfaceVariant,
              }]}>
                <ThemedText style={[styles.msgText, msg.isMe && { color: '#ffffff' }]}>
                  {msg.text}
                </ThemedText>
              </View>
              <ThemedText style={styles.msgTime} themeColor="textSecondary">{msg.time}</ThemedText>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.inputBar, { backgroundColor: theme.surfaceVariant, borderTopColor: theme.outlineVariant }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="输入消息..."
            placeholderTextColor={theme.textSecondary}
            multiline
          />
          <TouchableOpacity onPress={sendMessage} style={[styles.sendBtn, { backgroundColor: theme.primary }]}>
            <MaterialIcon name="send" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#ffffff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerSpacer: { width: 40 },
  scrollView: { flex: 1, padding: 16 },
  msgRow: { marginBottom: 12, maxWidth: '75%' },
  msgRowLeft: { alignSelf: 'flex-start' },
  msgRowRight: { alignSelf: 'flex-end' },
  msgBubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  msgText: { fontSize: 15, lineHeight: 20 },
  msgTime: { fontSize: 11, marginTop: 2, marginHorizontal: 4 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, gap: 8, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});
