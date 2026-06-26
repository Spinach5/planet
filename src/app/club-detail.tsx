import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HeadStatus } from '@/components/HeadStatus';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';

export default function ClubDetailPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = theme.background === '#000000';
  return (
    <ThemedView style={s.container}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[s.gradient,{paddingTop:insets.top+8}]}>
        <ScrollView style={s.scroll}>
          <View style={s.headerRow}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="社团详情" /></View>
          <View style={[s.card,{backgroundColor:theme.surface}]}>
            <View style={[s.avatar,{backgroundColor:theme.primaryContainer}]}><ThemedText style={[s.avText,{color:theme.primary}]}>社</ThemedText></View>
            <ThemedText style={s.name}>计算机协会</ThemedText>
            <ThemedText style={s.meta} themeColor="textSecondary">学术科技 · 校级 · 计算机学院</ThemedText>
            <ThemedText style={s.intro}>{`社团ID: ${id}\n\n这里是社团介绍内容。包含社团的宗旨、活动、历史等信息。`}</ThemedText>
          </View>
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  container:{flex:1},gradient:{flex:1},scroll:{flex:1,paddingHorizontal:8},
  headerRow:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4},
  card:{borderRadius:12,padding:20,alignItems:'center',marginHorizontal:8},
  avatar:{width:72,height:72,borderRadius:36,justifyContent:'center',alignItems:'center',marginBottom:12},
  avText:{fontSize:28,fontWeight:'700'},name:{fontSize:20,fontWeight:'700',marginBottom:4},
  meta:{fontSize:13,marginBottom:16},intro:{fontSize:15,lineHeight:22,textAlign:'center'},
});
