import { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HeadStatus } from '@/components/HeadStatus';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';

interface Conv { id:string;name:string;lastMsg:string;time:string;unread:number;bookName:string; }

export default function ChatListPage() {
  // eslint-disable-next-line react/hook-use-state
  const [convs] = useState<Conv[]>([
    { id:'1',name:'小明',lastMsg:'这本书还在吗？',time:'10:30',unread:2,bookName:'数据结构' },
    { id:'2',name:'小红',lastMsg:'好的，明天见',time:'昨天',unread:0,bookName:'高等数学' },
  ]);
  const theme = useTheme(); const insets = useSafeAreaInsets();
  const isDark = theme.background === '#000000';
  return (
    <ThemedView style={s.container}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[s.gradient,{paddingTop:insets.top+8}]}>
        <ScrollView style={s.scroll}>
          <View style={s.headerRow}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="消息" /></View>
          {convs.map((c)=>(<TouchableOpacity key={c.id} style={[s.item,{borderBottomColor:theme.outlineVariant}]} onPress={()=>router.push('/chat-detail')}><View style={[s.avatar,{backgroundColor:theme.primaryContainer}]}><ThemedText style={[s.avText,{color:theme.primary}]}>{c.name.charAt(0)}</ThemedText></View><View style={s.info}><View style={s.hdr}><ThemedText style={s.name}>{c.name}</ThemedText><ThemedText style={s.time} themeColor="textSecondary">{c.time}</ThemedText></View><View style={s.meta}><ThemedText style={s.book} themeColor="textSecondary">[{c.bookName}]</ThemedText><ThemedText style={s.msg} numberOfLines={1} themeColor="textSecondary">{c.lastMsg}</ThemedText></View></View>{c.unread>0?<View style={[s.badge,{backgroundColor:theme.error}]}><ThemedText style={s.badgeText}>{c.unread}</ThemedText></View>:null}</TouchableOpacity>))}
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}
const s = StyleSheet.create({
  container:{flex:1},gradient:{flex:1},scroll:{flex:1},
  headerRow:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4,paddingHorizontal:8},
  item:{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:14,borderBottomWidth:StyleSheet.hairlineWidth,gap:12},
  avatar:{width:44,height:44,borderRadius:22,justifyContent:'center',alignItems:'center'},avText:{fontSize:18,fontWeight:'700'},
  info:{flex:1},hdr:{flexDirection:'row',justifyContent:'space-between',marginBottom:4},name:{fontSize:15,fontWeight:'600'},time:{fontSize:12},
  meta:{flexDirection:'row',gap:4},book:{fontSize:12},msg:{fontSize:12,flex:1},
  badge:{borderRadius:10,minWidth:18,height:18,justifyContent:'center',alignItems:'center',paddingHorizontal:5},
  badgeText:{fontSize:11,fontWeight:'700',color:'#fff'},
});
