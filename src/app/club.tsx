import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
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
import { getAllClub, type ClubItem } from '@/service/server/clubs';
import userManager from '@/service/userInfo';

function getHashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
function getColorFromName(name: string): string {
  return `hsl(${String(getHashCode(name) % 360)}, 70%, 55%)`;
}

const NATURE_MAP = ['社团', '学生会', '其他'];

export default function ClubPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets();
  const push = useDebouncedPush(); const { showToast } = useToast();
  const [authState, setAuthState] = useState<'loading' | 'login' | 'register' | 'ok'>('loading');
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['全部']);
  const [activeCategory, setActiveCategory] = useState('全部');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const checkAuth = useCallback(() => {
    if (!userManager.checkLogin()) { setAuthState('login'); return false; }
    if (!userManager.getServerToken()) { setAuthState('register'); return false; }
    setAuthState('ok');
    return true;
  }, []);

  const fetchClubs = useCallback(async (forceRefresh = false) => {
    try {
      const { clubs: data, categories: cats } = await getAllClub(forceRefresh);
      setClubs(data);
      setCategories(cats);
    } catch {
      showToast({ message: '加载失败，请下拉刷新', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      if (checkAuth()) { void fetchClubs(true); }
    }, [checkAuth, fetchClubs]),
  );

  const filtered = activeCategory === '全部'
    ? clubs
    : clubs.filter((c) => c.category === activeCategory);

  const isDark = theme.background === '#000000';

  // Auth fail states
  if (authState === 'loading') {
    return (
      <ThemedView style={st.outer}><Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[st.grad,{paddingTop:insets.top+8}]}>
          <View style={st.hdr}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="社团" /></View>
          <View style={st.center}><ActivityIndicator size="large" color={theme.primary} /></View>
        </LinearGradient>
      </ThemedView>
    );
  }
  if (authState === 'login') {
    return (
      <ThemedView style={st.outer}><Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[st.grad,{paddingTop:insets.top+8}]}>
          <View style={st.hdr}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="社团" /></View>
          <View style={st.center}><ThemedText style={st.hint} themeColor="textSecondary">请先登录</ThemedText></View>
        </LinearGradient>
      </ThemedView>
    );
  }
  if (authState === 'register') {
    return (
      <ThemedView style={st.outer}><Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[st.grad,{paddingTop:insets.top+8}]}>
          <View style={st.hdr}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="社团" /></View>
          <View style={st.center}><ThemedText style={st.hint} themeColor="textSecondary">请先在设置中注册拓展功能</ThemedText></View>
        </LinearGradient>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={st.outer}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[st.grad,{paddingTop:insets.top+8}]}>
        <View style={st.hdr}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="社团" /></View>
        <ScrollView
          style={st.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);void fetchClubs(true);}} colors={['#47a5fd']} tintColor="#47a5fd" />}
        >
          {/* Banner placeholder */}
          <View style={st.banner}>
            <View style={st.bannerPlaceholder}>
              <Text style={st.bannerText}>轮播图区域</Text>
            </View>
          </View>

          {/* Category scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.catScroll} contentContainerStyle={st.catContent}>
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <TouchableOpacity key={cat} style={[st.catChip, active && st.catChipActive]} onPress={()=>setActiveCategory(cat)}>
                  <Text style={[st.catText, active && st.catTextActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Club list */}
          {loading ? (
            <View style={st.loadWrap}><ActivityIndicator size="large" color={theme.primary} /><Text style={[st.loadingText,{color:theme.textSecondary}]}>加载社团数据中...</Text></View>
          ) : filtered.length === 0 ? (
            <View style={st.empty}><ThemedText style={st.hint} themeColor="textSecondary">暂无社团数据</ThemedText></View>
          ) : (
            <View style={st.list}>
              {filtered.map((club) => (
                <TouchableOpacity key={club.id} style={[st.card,{backgroundColor:theme.surface}]} onPress={()=>push(`/club-detail?id=${club.id}`)}>
                  <View style={[st.avatar,{backgroundColor:getColorFromName(club.name)}]}>
                    <Text style={st.avatarText}>{club.name.charAt(0)}</Text>
                  </View>
                  <View style={st.info}>
                    <Text style={[st.cardName,{color:theme.text}]}>{club.name}</Text>
                    <View style={st.metaRow}>
                      <Text style={[st.metaTag,{backgroundColor:theme.primaryContainer,color:theme.textSecondary}]}>{club.category || '未分类'}</Text>
                      <Text style={[st.metaDot,{color:theme.textSecondary}]}>|</Text>
                      <Text style={[st.metaTag,{backgroundColor:theme.primaryContainer,color:theme.textSecondary}]}>{NATURE_MAP[Number(club.nature)] || '社团'}</Text>
                      <Text style={[st.metaDot,{color:theme.textSecondary}]}>|</Text>
                      <Text style={[st.metaTag,{backgroundColor:theme.primaryContainer,color:theme.textSecondary}]}>{club.school}</Text>
                    </View>
                  </View>
                  <MaterialIcon name="chevron-right" size={14} color="#ccc" />
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={{height:100}} />
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity style={st.fab} onPress={()=>push('/club-add')} activeOpacity={0.8}>
          <Text style={st.fabText}>+</Text>
        </TouchableOpacity>
      </LinearGradient>
    </ThemedView>
  );
}

const st = StyleSheet.create({
  outer:{flex:1},grad:{flex:1},scroll:{flex:1},
  hdr:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4,paddingHorizontal:8},
  center:{flex:1,alignItems:'center',justifyContent:'center'},
  hint:{fontSize:17,marginTop:12},
  // Banner
  banner:{height:110,marginHorizontal:12,marginTop:8,borderRadius:10,backgroundColor:'#e0e0e0',overflow:'hidden'},
  bannerPlaceholder:{flex:1,alignItems:'center',justifyContent:'center'},
  bannerText:{fontSize:15,color:'#999'},
  // Categories
  catScroll:{maxHeight:48,marginTop:8},
  catContent:{flexDirection:'row',gap:8,paddingHorizontal:12},
  catChip:{paddingHorizontal:16,paddingVertical:6,borderRadius:16,backgroundColor:'#e8e8e8'},
  catChipActive:{backgroundColor:'#47a5fd'},
  catText:{fontSize:13,color:'#666'},
  catTextActive:{color:'#fff'},
  // List
  loadWrap:{alignItems:'center',paddingTop:60},
  loadingText:{fontSize:14,marginTop:12},
  empty:{alignItems:'center',paddingTop:100},
  list:{padding:8},
  card:{flexDirection:'row',alignItems:'center',gap:12,borderRadius:8,padding:10,marginBottom:8},
  avatar:{width:40,height:40,borderRadius:20,alignItems:'center',justifyContent:'center'},
  avatarText:{fontSize:18,fontWeight:'700',color:'#fff'},
  info:{flex:1},
  cardName:{fontSize:15,fontWeight:'700'},
  metaRow:{flexDirection:'row',alignItems:'center',gap:4,marginTop:4,flexWrap:'wrap'},
  metaTag:{fontSize:11,paddingHorizontal:6,paddingVertical:2,borderRadius:4},
  metaDot:{fontSize:11},
  // FAB
  fab:{position:'absolute',right:20,bottom:80,width:50,height:50,borderRadius:25,backgroundColor:'#47a5fd',alignItems:'center',justifyContent:'center',elevation:6,shadowColor:'#47a5fd',shadowOffset:{width:0,height:3},shadowOpacity:0.35,shadowRadius:12},
  fabText:{fontSize:28,color:'#fff',lineHeight:30},
});
