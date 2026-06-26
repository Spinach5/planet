import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HeadStatus } from '@/components/HeadStatus';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';

const groups = [
  { name: '东区食堂', items: ['一楼自选餐','二楼小炒','麻辣香锅','兰州拉面','黄焖鸡米饭'] },
  { name: '西区食堂', items: ['一楼大众餐','二楼特色菜','煲仔饭','炸鸡汉堡','麻辣烫'] },
  { name: '周边美食', items: ['南门小吃街','西门夜市','烧烤店','火锅店','奶茶店'] },
];

export default function FoodPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets();
  const isDark = theme.background === '#000000';
  return (
    <ThemedView style={st.container}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[st.gradient,{paddingTop:insets.top+8}]}>
        <ScrollView style={st.scroll}>
          <View style={st.headerRow}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="美食指南" /></View>
          {groups.map((g) => (<View key={g.name} style={st.group}><ThemedText style={st.title}>{g.name}</ThemedText><View style={st.list}>{g.items.map((item)=>(<View key={item} style={[st.card,{backgroundColor:theme.surface}]}><MaterialIcon name="food-variant" size={18} color={theme.primary} /><ThemedText style={st.itemText}>{item}</ThemedText></View>))}</View></View>))}
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
  itemText:{fontSize:15},
});
