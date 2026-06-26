import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router, Stack } from 'expo-router';
import { ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HeadStatus } from '@/components/HeadStatus';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';

const CATS = ['全部', '学术科技', '文化艺术', '体育竞技', '志愿服务', '创新创业'];

interface Club { id: string; name: string; category: string; nature: string; school: string; intro: string; }

const mockClubs: Club[] = [
  { id: '1', name: '计算机协会', category: '学术科技', nature: '校级', school: '计算机学院', intro: '学习编程知识' },
  { id: '2', name: '摄影社', category: '文化艺术', nature: '校级', school: '艺术设计学院', intro: '用镜头记录生活' },
  { id: '3', name: '篮球队', category: '体育竞技', nature: '院级', school: '计算机学院', intro: '热血篮球' },
  { id: '4', name: '志愿者协会', category: '志愿服务', nature: '校级', school: '校团委', intro: '奉献爱心' },
];

export default function ClubPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false);
  const [cat, setCat] = useState('全部');

  const fetch = useCallback(() => {
    setLoading(true);
    setTimeout(() => { setClubs(mockClubs); setLoading(false); setRefreshing(false); }, 300);
  }, []);

  useEffect(() => { const t = setTimeout(() => { fetch(); }, 0); return () => clearTimeout(t); }, [fetch]);

  const filtered = cat === '全部' ? clubs : clubs.filter((c) => c.category === cat);
  const isDark = theme.background === '#000000';

  return (
    <ThemedView style={st.container}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[st.gradient,{paddingTop:insets.top+8}]}>
        <ScrollView style={st.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);fetch();}} colors={['#47a5fd']} tintColor="#47a5fd" />}>
          <View style={st.headerRow}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="社团" /><TouchableOpacity onPress={()=>router.push('/club-add')}><MaterialIcon name="plus" size={24} color="#fff" /></TouchableOpacity></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.catScroll}>{CATS.map((c)=>(<TouchableOpacity key={c} style={[st.catChip,{backgroundColor:c===cat?theme.primary:theme.surface}]} onPress={()=>setCat(c)}><ThemedText style={[st.catText,c===cat&&{color:'#fff'}]}>{c}</ThemedText></TouchableOpacity>))}</ScrollView>
          {loading ? <ActivityIndicator size="large" color={theme.primary} style={{marginTop:40}} /> :
          filtered.length===0 ? <View style={st.empty}><MaterialIcon name="account-group" size={48} color={theme.textSecondary} /><ThemedText style={st.emptyT} themeColor="textSecondary">暂无社团</ThemedText></View> : (
            <View style={st.list}>{filtered.map((c)=>(<TouchableOpacity key={c.id} style={[st.card,{backgroundColor:theme.surface}]} onPress={()=>router.push(`/club-detail?id=${c.id}`)}><View style={[st.avatar,{backgroundColor:theme.primaryContainer}]}><ThemedText style={[st.avText,{color:theme.primary}]}>{c.name.charAt(0)}</ThemedText></View><View style={st.info}><ThemedText style={st.name}>{c.name}</ThemedText><ThemedText style={st.meta} themeColor="textSecondary">{c.category} · {c.nature} · {c.school}</ThemedText><ThemedText style={st.intro} numberOfLines={1} themeColor="textSecondary">{c.intro}</ThemedText></View><MaterialIcon name="chevron-right" size={18} color={theme.textSecondary} /></TouchableOpacity>))}</View>
          )}
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const st = StyleSheet.create({
  container:{flex:1},gradient:{flex:1},scroll:{flex:1,paddingHorizontal:8},
  headerRow:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4},
  catScroll:{maxHeight:44,paddingVertical:8},catChip:{borderRadius:16,paddingHorizontal:14,paddingVertical:6,marginRight:8},catText:{fontSize:13,fontWeight:'500'},
  empty:{alignItems:'center',paddingTop:80},emptyT:{fontSize:16,marginTop:12},
  list:{padding:8,gap:8},
  card:{flexDirection:'row',alignItems:'center',gap:12,borderRadius:12,padding:14},
  avatar:{width:44,height:44,borderRadius:22,justifyContent:'center',alignItems:'center'},avText:{fontSize:18,fontWeight:'700'},
  info:{flex:1},name:{fontSize:15,fontWeight:'600'},meta:{fontSize:12,marginTop:2},intro:{fontSize:12,marginTop:2},
});
