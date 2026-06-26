import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HeadStatus } from '@/components/HeadStatus';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';

export default function BooksDetailPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = theme.background === '#000000';
  return (
    <ThemedView style={s.container}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[s.gradient,{paddingTop:insets.top+8}]}>
        <ScrollView style={s.scroll}>
          <View style={s.headerRow}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="书籍详情" /></View>
          <View style={[s.cover,{backgroundColor:theme.primaryContainer}]}><MaterialIcon name="book-open-page-variant" size={60} color={theme.primary} /></View>
          <ThemedText style={s.title}>数据结构（C语言版）</ThemedText>
          <ThemedText style={s.price} themeColor="error">¥15.00</ThemedText>
          <View style={[s.card,{backgroundColor:theme.surface}]}>
            <ThemedText style={s.meta}>出版社: 清华大学出版社</ThemedText>
            <ThemedText style={s.meta}>作者: 严蔚敏</ThemedText>
            <ThemedText style={s.meta}>ISBN: 978-7-302-14751-0</ThemedText>
            <ThemedText style={s.meta}>分类: 教材·计算机</ThemedText>
            <ThemedText style={s.meta}>成色: 九成新</ThemedText>
            <ThemedText style={s.meta}>配送: 可送货</ThemedText>
            <ThemedText style={s.meta}>书籍ID: {id}</ThemedText>
          </View>
          <TouchableOpacity style={[s.btn,{backgroundColor:theme.primary}]} onPress={()=>router.push('/chat-detail')}>
            <MaterialIcon name="message-text-outline" size={20} color="#fff" /><ThemedText style={s.btnText}>联系卖家</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}
const s = StyleSheet.create({
  container:{flex:1},gradient:{flex:1},scroll:{flex:1,paddingHorizontal:8},
  headerRow:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4},
  cover:{height:180,borderRadius:12,justifyContent:'center',alignItems:'center',marginHorizontal:8,marginBottom:12},
  title:{fontSize:20,fontWeight:'700',marginBottom:2,marginHorizontal:8},price:{fontSize:28,fontWeight:'700',marginBottom:12,marginHorizontal:8},
  card:{borderRadius:12,padding:16,marginHorizontal:8,marginBottom:16,gap:6},meta:{fontSize:14},
  btn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:14,borderRadius:12,marginHorizontal:8},
  btnText:{fontSize:16,fontWeight:'600',color:'#fff'},
});
