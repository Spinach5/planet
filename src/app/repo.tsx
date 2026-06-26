import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, Stack } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HeadStatus } from '@/components/HeadStatus';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';

export default function RepoPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets(); const { showToast } = useToast();
  // eslint-disable-next-line react/hook-use-state
  const [repo] = useState({ name: '炖仔鸡', url: 'https://gitee.com/spinach/ysx', contributors: 5, commits: 128, latest: { msg: 'feat: migrate to Expo SDK 56', author: 'Spinach', date: '2026-06-25' } });
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 300); return () => clearTimeout(t); }, []);
  const copy = useCallback(async () => { await Clipboard.setStringAsync(repo.url); showToast({ message: '链接已复制', type: 'success' }); }, [repo.url, showToast]);
  const isDark = theme.background === '#000000';
  return (
    <ThemedView style={s.container}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[s.gradient,{paddingTop:insets.top+8}]}>
        <ScrollView style={s.scroll}>
          <View style={s.headerRow}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="开源仓库" /></View>
          {loading ? <ActivityIndicator size="large" color={theme.primary} style={{marginTop:60}} /> : (
            <>
              <View style={[s.card,{backgroundColor:theme.surface}]}>
                <ThemedText style={s.name}>{repo.name}</ThemedText>
                <TouchableOpacity onPress={()=>{void copy();}} style={s.urlRow}><ThemedText style={s.url} themeColor="textSecondary">{repo.url}</ThemedText><MaterialIcon name="content-copy" size={14} color={theme.primary} /></TouchableOpacity>
                <View style={s.stats}><View style={s.stat}><ThemedText style={s.statV}>{repo.contributors}</ThemedText><ThemedText style={s.statL} themeColor="textSecondary">贡献者</ThemedText></View><View style={s.stat}><ThemedText style={s.statV}>{repo.commits}</ThemedText><ThemedText style={s.statL} themeColor="textSecondary">提交</ThemedText></View></View>
              </View>
              <ThemedText style={s.sec}>最新提交</ThemedText>
              <View style={[s.card,{backgroundColor:theme.surface}]}><ThemedText style={s.msg}>{repo.latest.msg}</ThemedText><ThemedText style={s.meta} themeColor="textSecondary">{repo.latest.author} · {repo.latest.date}</ThemedText></View>
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  container:{flex:1},gradient:{flex:1},scroll:{flex:1,paddingHorizontal:8},
  headerRow:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4},
  card:{borderRadius:12,padding:16,marginHorizontal:8,marginBottom:12},
  name:{fontSize:22,fontWeight:'700',marginBottom:8},
  urlRow:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:16},url:{fontSize:14,flex:1},
  stats:{flexDirection:'row',gap:32},stat:{alignItems:'center'},statV:{fontSize:24,fontWeight:'700'},statL:{fontSize:12,marginTop:2},
  sec:{fontSize:16,fontWeight:'600',marginBottom:8,marginTop:8,marginHorizontal:8},
  msg:{fontSize:14,fontWeight:'500'},meta:{fontSize:12,marginTop:4},
});
