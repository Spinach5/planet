import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HeadStatus } from '@/components/HeadStatus';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';

const cats = [
  { title: '学生证相关', items: ['学生证补办','学生证充磁','火车票优惠卡'] },
  { title: '选课相关', items: ['选课流程','退课申请','重修报名','辅修申请'] },
  { title: '奖学金', items: ['国家奖学金','国家励志奖学金','校级奖学金'] },
  { title: '宿舍相关', items: ['宿舍申请','调换宿舍','退宿手续'] },
  { title: '毕业相关', items: ['毕业论文','毕业实习','离校手续','学历认证'] },
];

export default function AffairPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets();
  const isDark = theme.background === '#000000';
  return (
    <ThemedView style={st.container}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[st.gradient,{paddingTop:insets.top+8}]}>
        <ScrollView style={st.scroll}>
          <View style={st.headerRow}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="办事指南" /></View>
          {cats.map((c) => (<View key={c.title} style={st.group}><ThemedText style={st.title}>{c.title}</ThemedText><View style={st.list}>{c.items.map((item)=>(<View key={item} style={[st.card,{backgroundColor:theme.surface}]}><MaterialIcon name="clipboard-text-outline" size={18} color={theme.primary} /><ThemedText style={st.itemText}>{item}</ThemedText><MaterialIcon name="chevron-right" size={16} color={theme.textSecondary} /></View>))}</View></View>))}
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const st = StyleSheet.create({
  container:{flex:1},gradient:{flex:1},scroll:{flex:1,paddingHorizontal:8},
  headerRow:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4},
  group:{marginHorizontal:8,marginBottom:20},title:{fontSize:18,fontWeight:'600',marginBottom:10},
  list:{gap:8},card:{flexDirection:'row',alignItems:'center',gap:10,borderRadius:10,padding:14},
  itemText:{fontSize:15,flex:1},
});
