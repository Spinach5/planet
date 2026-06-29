import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator } from 'react-native-paper';
import { ThemedView } from '@/components/themed/ThemedView';
import { ThemedText } from '@/components/themed/ThemedText';
import { HeadStatus } from '@/components/layout/HeadStatus';
import { MaterialIcon } from '@/components/base/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';
import { getClubDetail, type ClubItem } from '@/service/server/clubs';

const NATURE_MAP = ['社团', '学生会', '其他'];

function parseActivities(activities: unknown): string[] {
  if (!activities) return [];
  if (typeof activities === 'string') {
    try {
      const p = JSON.parse(activities) as unknown;
      return Array.isArray(p) ? p as string[] : [activities];
    } catch { return [activities]; }
  }
  if (Array.isArray(activities)) return activities as string[];
  return [];
}

export default function ClubDetailPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets(); const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [club, setClub] = useState<ClubItem | null>(null);
  const [loading, setLoading] = useState(true);
  const isDark = theme.background === '#000000';

  useEffect(() => {
    if (!id) { showToast({ message: '无效的社团ID', type: 'error' }); router.back(); return; }
    void (async () => {
      try {
        const data = await getClubDetail(Number(id));
        if (data) setClub(data);
        else { showToast({ message: '社团不存在', type: 'error' }); router.back(); }
      } catch { showToast({ message: '加载失败', type: 'error' }); }
      finally { setLoading(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <ThemedView style={s.outer}><Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[s.grad,{paddingTop:insets.top+8}]}>
          <View style={s.hdr}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="社团详情" /></View>
          <View style={s.center}><ActivityIndicator size="large" color={theme.primary} /></View>
        </LinearGradient>
      </ThemedView>
    );
  }

  if (!club) return null;
  const activities = parseActivities(club.activities);

  return (
    <ThemedView style={s.outer}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[s.grad,{paddingTop:insets.top+8}]}>
        <View style={s.hdr}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="社团详情" /></View>
        <ScrollView style={s.scroll} contentContainerStyle={{paddingBottom:60}}>
          <View style={[s.banner,{backgroundColor:theme.backgroundElement}]}>
            <Text style={[s.bannerText,{color:theme.textSecondary}]}>社团图片暂缺</Text>
          </View>
          <View style={[s.card,{backgroundColor:theme.surface}]}>
            <Text style={[s.name,{color:theme.text}]}>{club.name}</Text>
            <View style={s.metaRow}>
              <Text style={[s.metaItem,{color:theme.textSecondary}]}>学校：{club.schoolId ?? club.school}</Text>
              <Text style={[s.metaItem,{color:theme.textSecondary}]}>性质：{NATURE_MAP[club.nature] || '社团'}</Text>
              <Text style={[s.metaItem,{color:theme.textSecondary}]}>类型：{club.category || '未分类'}</Text>
            </View>
          </View>
          <View style={[s.card,{backgroundColor:theme.surface}]}>
            <Text style={[s.secTitle,{color:theme.text}]}>介绍</Text>
            <Text style={[s.body,{color:theme.textSecondary}]}>{club.introduction || '暂无介绍'}</Text>
          </View>
          <View style={[s.card,{backgroundColor:theme.surface}]}>
            <Text style={[s.secTitle,{color:theme.text}]}>活动</Text>
            {activities.length > 0 ? activities.map((act, idx) => (
              <View key={idx} style={s.actItem}>
                <Text style={[s.actDot,{color:theme.textSecondary}]}>•</Text>
                <Text style={[s.actText,{color:theme.textSecondary}]}>{typeof act === 'string' ? act : (act as Record<string,string>).title || (act as Record<string,string>).name || JSON.stringify(act)}</Text>
              </View>
            )) : <Text style={[s.body,{color:theme.textSecondary}]}>暂无活动</Text>}
          </View>
          <View style={[s.card,{backgroundColor:theme.surface}]}>
            <View style={s.infoRow}><Text style={[s.infoLabel,{color:theme.textSecondary}]}>负责人：</Text><Text style={{color:theme.text}}>{club.principal_name || '未知'}</Text></View>
            <View style={s.infoRow}><Text style={[s.infoLabel,{color:theme.textSecondary}]}>联系方式：</Text><Text style={{color:theme.text}}>{club.contact || '无'}</Text></View>
          </View>
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  outer:{flex:1},grad:{flex:1},scroll:{flex:1,paddingHorizontal:8},
  hdr:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4},center:{flex:1,alignItems:'center',justifyContent:'center'},
  banner:{height:180,marginHorizontal:8,borderRadius:12,alignItems:'center',justifyContent:'center',marginBottom:12},
  bannerText:{fontSize:15},
  card:{borderRadius:12,padding:16,marginHorizontal:8,marginBottom:12},
  name:{fontSize:20,fontWeight:'700',marginBottom:10},
  metaRow:{gap:4},metaItem:{fontSize:13,marginBottom:2},
  secTitle:{fontSize:16,fontWeight:'700',marginBottom:8},
  body:{fontSize:14,lineHeight:22},
  actItem:{flexDirection:'row',gap:8,marginBottom:4},actDot:{fontSize:14},actText:{fontSize:14,flex:1},
  infoRow:{flexDirection:'row',marginBottom:6},infoLabel:{fontSize:14},
});
