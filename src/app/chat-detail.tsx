import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native-paper';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';
import { MaterialIcon } from '@/components/MaterialIcon';
import { HeadStatus } from '@/components/HeadStatus';
import { getMessages, sendMessage, type Message } from '@/service/server/chat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatDetailPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets(); const { showToast } = useToast();
  const raw = useLocalSearchParams<{ conversationId: string; name: string; bookName: string; bookImage: string; bookPrice: string; isDelivery: string }>();
  const convId = Number(raw.conversationId ?? '0');
  const otherName = decodeURIComponent(raw.name ?? '');
  const bookName = decodeURIComponent(raw.bookName ?? '');
  const bookImage = decodeURIComponent(raw.bookImage ?? '');
  const bookPrice = raw.bookPrice ?? '';
  const isDelivery = Number(raw.isDelivery ?? '0');

  const [msgs, setMsgs] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await getMessages(convId);
        setMsgs(Array.isArray(data) ? data : []);
      } catch { showToast({ message: '加载失败', type: 'error' }); }
      finally { setLoading(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = useCallback(async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(convId, t);
      setMsgs((p) => [...p, msg]);
      setText('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch { showToast({ message: '发送失败', type: 'error' }); }
    finally { setSending(false); }
  }, [text, sending, convId, showToast]);

  return (
    <ThemedView style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[s.header, { backgroundColor: '#47a5fd', paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialIcon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={s.headerMid}>
          <Text style={s.headerTitle}>{otherName || '聊天'}</Text>
        </View>
        <View style={s.headerSpacer} />
      </View>
      {/* Book info bar — matches Taro layout */}
      <View style={[s.bookBar,{backgroundColor:theme.surface}]}>
        {bookImage ? (
          <Image source={{uri:bookImage}} style={s.bookCover} />
        ) : (
          <View style={[s.bookCoverPlaceholder,{backgroundColor:theme.backgroundElement}]}>
            <Text style={[s.bookCoverPHText,{color:theme.textSecondary}]}>暂无</Text>
          </View>
        )}
        <View style={s.bookInfo}>
          <Text style={s.bookPrice}><Text style={s.bookPriceSym}>¥</Text>{bookPrice && bookPrice !== '0' ? bookPrice : '?'}</Text>
          <Text style={[s.bookNameText,{color:theme.text}]} numberOfLines={1}>书名：{bookName||'未知书籍'}</Text>
          <Text style={[s.bookDelivery,{color:isDelivery===1?'#27ae60':'#e67e22'}]}>配送方式：{isDelivery===1?'可送':'自提'}</Text>
        </View>
      </View>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={theme.primary} /></View>
        ) : (
          <ScrollView ref={scrollRef} style={s.scroll} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
            {msgs.map((m, idx) => {
              const msgId = m.id || (m as Record<string,unknown>).message_id as number || idx;
              const isMe = m.is_me || m.sender_id !== 0;
              return (
                <View key={String(msgId)} style={[s.msgRow, isMe ? s.msgRight : s.msgLeft]}>
                  <View style={[s.bubble, { backgroundColor: isMe ? '#47a5fd' : theme.surface }]}>
                    <Text style={[s.msgText, { color: isMe ? '#fff' : theme.text }]}>{m.content}</Text>
                  </View>
                  <Text style={[s.msgTime, { color: theme.textSecondary }]}>
                    {m.created_at ? new Date(m.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}
        <View style={[s.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.backgroundElement }]}>
          <TextInput style={[s.input, { backgroundColor: theme.backgroundElement, color: theme.text }]} value={text} onChangeText={setText} placeholder="输入消息..." placeholderTextColor={theme.textSecondary} multiline />
          <TouchableOpacity onPress={() => { void handleSend(); }} style={[s.sendBtn, { backgroundColor: '#47a5fd' }]} disabled={sending}>
            <MaterialIcon name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 }, flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: 10, paddingHorizontal: 12 },
  backBtn: { padding: 4 },
  headerMid: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#fff' },
  headerSpacer: { width: 32 },
  // Book info bar
  bookBar: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e8e8e8' },
  bookCover: { width: 56, height: 56, borderRadius: 8 },
  bookCoverPlaceholder: { width: 56, height: 56, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  bookCoverPHText: { fontSize: 12 },
  bookInfo: { flex: 1, gap: 2 },
  bookPrice: { fontSize: 18, fontWeight: '700', color: '#e74c3c' },
  bookPriceSym: { fontSize: 12 },
  bookNameText: { fontSize: 13 },
  bookDelivery: { fontSize: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, padding: 16 },
  msgRow: { marginBottom: 12, maxWidth: '75%' },
  msgLeft: { alignSelf: 'flex-start' },
  msgRight: { alignSelf: 'flex-end' },
  bubble: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  msgText: { fontSize: 15, lineHeight: 20 },
  msgTime: { fontSize: 11, marginTop: 2, marginHorizontal: 4 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, paddingBottom: 24, gap: 8, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});
