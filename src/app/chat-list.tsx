import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useDebouncedPush } from '@/utils/useDebouncedPush';
import { ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HeadStatus } from '@/components/HeadStatus';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';
import { getConversations, type Conversation } from '@/service/server/chat';

function getColorFromName(name: string): string {
  let hash = 0; for (let i=0;i<name.length;i++){hash=(hash<<5)-hash+name.charCodeAt(i);hash|=0;}
  return `hsl(${String(Math.abs(hash)%360)},70%,55%)`;
}

function formatTime(t: string): string {
  if (!t) return '';
  const d = new Date(t);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
  return `${d.getMonth()+1}/${d.getDate()}`;
}

export default function ChatListPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets();
  const push = useDebouncedPush(); const { showToast } = useToast();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const isDark = theme.background === '#000000';

  const fetchList = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const data = await getConversations();
      setConvs(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
    } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { void fetchList(); }, [fetchList]));

  return (
    <ThemedView style={s.container}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[s.gradient,{paddingTop:insets.top+8}]}>
        <View style={s.headerRow}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="消息" /></View>
        <ScrollView style={s.scroll}>
          {loading ? (
            <View style={s.center}><ActivityIndicator size="large" color={theme.primary} /></View>
          ) : error ? (
            <View style={s.center}>
              <ThemedText style={s.emptyText} themeColor="textSecondary">加载失败</ThemedText>
              <TouchableOpacity style={s.retryBtn} onPress={()=>{void fetchList();}}>
                <Text style={s.retryText}>重试</Text>
              </TouchableOpacity>
            </View>
          ) : convs.length === 0 ? (
            <View style={s.center}>
              <Text style={s.emptyIcon}>💬</Text>
              <ThemedText style={s.emptyText} themeColor="textSecondary">暂无消息</ThemedText>
              <ThemedText style={s.emptySub} themeColor="textSecondary">去书籍广场逛逛吧</ThemedText>
            </View>
          ) : (
            convs.map((conv, idx) => {
              const convId = conv.conversation_id || idx;
              const otherName = conv.other_user?.nickName || conv.otherName || '?';
              const bookName = conv.book_title || '';
              const bookImage = conv.book_image || '';
              const bookPrice = conv.price && conv.price !== 0 ? String(conv.price) : '';
              const isDelivery = conv.isDelivery ?? 0;
              const msg = conv.last_message;
              const msgContent = msg && typeof msg === 'object' ? (msg as Record<string,unknown>).content as string : (typeof msg === 'string' ? msg : '暂无消息');
              const msgTime = (msg && typeof msg === 'object' ? (msg as Record<string,unknown>).created_at as string : '') || conv.last_message_time || '';
              const unread = conv.unreadCount || 0;
              return (
                <TouchableOpacity
                  key={String(convId)}
                  style={[s.item,{borderBottomColor:theme.backgroundElement}]}
                  onPress={()=>push(`/chat-detail?conversationId=${convId}&name=${encodeURIComponent(otherName)}&bookName=${encodeURIComponent(bookName)}&bookImage=${encodeURIComponent(bookImage)}&bookPrice=${encodeURIComponent(String(bookPrice))}&isDelivery=${isDelivery}`)}
                >
                  <View style={s.avatarWrap}>
                    <View style={[s.avatar,{backgroundColor:getColorFromName(otherName)}]}>
                      <Text style={s.avatarText}>{otherName[0]}</Text>
                    </View>
                    {unread > 0 && <View style={s.badge}><Text style={s.badgeText}>{unread}</Text></View>}
                  </View>
                  <View style={s.info}>
                    <View style={s.hdr}>
                      <View style={{flexDirection:'row',alignItems:'center',flex:1}}>
                        <Text style={[s.name,{color:theme.text}]} numberOfLines={1}>{otherName}</Text>
                        {bookName ? <Text style={s.bookTag} numberOfLines={1}>{bookName.length > 6 ? bookName.slice(0,6)+'...' : bookName}</Text> : null}
                      </View>
                      <Text style={[s.time,{color:theme.textSecondary}]}>{formatTime(msgTime)}</Text>
                    </View>
                    <Text style={[s.lastMsg,{color:theme.textSecondary}]} numberOfLines={1}>{msgContent}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  container:{flex:1},gradient:{flex:1},scroll:{flex:1},
  headerRow:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4,paddingHorizontal:8},
  center:{alignItems:'center',paddingTop:80},
  emptyIcon:{fontSize:48,marginBottom:8},
  emptyText:{fontSize:15},emptySub:{fontSize:13,marginTop:4},
  retryBtn:{marginTop:12,backgroundColor:'#47a5fd',paddingHorizontal:24,paddingVertical:10,borderRadius:8},
  retryText:{color:'#fff',fontWeight:'600'},
  item:{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:14,borderBottomWidth:StyleSheet.hairlineWidth,gap:12},
  avatarWrap:{position:'relative'},
  avatar:{width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center'},
  avatarText:{fontSize:18,fontWeight:'700',color:'#fff'},
  badge:{position:'absolute',top:-2,right:-2,backgroundColor:'#e74c3c',borderRadius:9,minWidth:18,height:18,alignItems:'center',justifyContent:'center',paddingHorizontal:4},
  badgeText:{fontSize:10,fontWeight:'700',color:'#fff'},
  info:{flex:1},hdr:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:4},
  name:{fontSize:15,fontWeight:'600'},bookTag:{fontSize:11,backgroundColor:'#e8f4fd',color:'#47a5fd',paddingHorizontal:6,paddingVertical:1,borderRadius:4,marginLeft:6},
  time:{fontSize:11},lastMsg:{fontSize:13},
});
