import { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';

interface Msg { id:string;text:string;isMe:boolean;time:string; }

export default function ChatDetailPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets();
  const [msgs, setMsgs] = useState<Msg[]>([
    { id:'1',text:'你好，这本书还在吗？',isMe:false,time:'10:25' },
    { id:'2',text:'在的，要看看吗？',isMe:true,time:'10:26' },
    { id:'3',text:'好的，什么时候方便？',isMe:false,time:'10:28' },
  ]);
  const [text, setText] = useState(''); const nid = useRef(10); const scrollRef = useRef<ScrollView>(null);

  const send = useCallback(() => {
    const t = text.trim(); if (!t) return;
    setMsgs((p)=>[...p,{id:String(nid.current++),text:t,isMe:true,time:new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}]);
    setText(''); setTimeout(()=>scrollRef.current?.scrollToEnd({animated:true}),100);
  }, [text]);

  return (
    <ThemedView style={s.container}><Stack.Screen options={{ headerShown: false }} />
      <View style={[s.header,{backgroundColor:theme.primary,paddingTop:insets.top+8}]}>
        <TouchableOpacity onPress={()=>router.back()} style={s.backBtn}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity>
        <View style={s.headerMid}><ThemedText style={s.headerTitle} themeColor="onPrimary">小明</ThemedText><ThemedText style={s.headerSub} themeColor="onPrimary">数据结构（C语言版）</ThemedText></View><View style={s.headerSpacer} />
      </View>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS==='ios'?'padding':undefined}>
        <ScrollView ref={scrollRef} style={s.scroll} onContentSizeChange={()=>scrollRef.current?.scrollToEnd({animated:false})}>
          {msgs.map((m)=>(<View key={m.id} style={[s.msgRow,m.isMe?s.msgRight:s.msgLeft]}><View style={[s.bubble,{backgroundColor:m.isMe?theme.primary:theme.surfaceVariant}]}><ThemedText style={[s.msgText,m.isMe&&{color:'#fff'}]}>{m.text}</ThemedText></View><ThemedText style={s.msgTime} themeColor="textSecondary">{m.time}</ThemedText></View>))}
        </ScrollView>
        <View style={[s.inputBar,{backgroundColor:theme.surfaceVariant,borderTopColor:theme.outlineVariant}]}>
          <TextInput style={[s.input,{backgroundColor:theme.background,color:theme.text}]} value={text} onChangeText={setText} placeholder="输入消息..." placeholderTextColor={theme.textSecondary} multiline />
          <TouchableOpacity onPress={send} style={[s.sendBtn,{backgroundColor:theme.primary}]}><MaterialIcon name="send" size={18} color="#fff" /></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
const s = StyleSheet.create({
  container:{flex:1},flex:{flex:1},
  header:{flexDirection:'row',alignItems:'center',paddingBottom:8,paddingHorizontal:12},backBtn:{padding:4},headerMid:{flex:1,alignItems:'center'},headerTitle:{fontSize:17,fontWeight:'600',color:'#fff'},headerSub:{fontSize:11,color:'rgba(255,255,255,0.8)',marginTop:1},headerSpacer:{width:32},
  scroll:{flex:1,padding:16},
  msgRow:{marginBottom:12,maxWidth:'75%'},msgLeft:{alignSelf:'flex-start'},msgRight:{alignSelf:'flex-end'},
  bubble:{borderRadius:16,paddingHorizontal:14,paddingVertical:10},msgText:{fontSize:15,lineHeight:20},msgTime:{fontSize:11,marginTop:2,marginHorizontal:4},
  inputBar:{flexDirection:'row',alignItems:'flex-end',padding:10,gap:8,borderTopWidth:StyleSheet.hairlineWidth},
  input:{flex:1,borderRadius:20,paddingHorizontal:14,paddingVertical:8,fontSize:15,maxHeight:100},
  sendBtn:{width:36,height:36,borderRadius:18,justifyContent:'center',alignItems:'center'},
});
