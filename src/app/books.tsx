import { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HeadStatus } from '@/components/HeadStatus';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';

interface Book { id: string; name: string; price: number; publisher: string; category: string; }
const mockBooks: Book[] = [
  { id:'1',name:'数据结构（C语言版）',price:15,publisher:'清华大学出版社',category:'教材' },
  { id:'2',name:'高等数学第七版上册',price:12,publisher:'高等教育出版社',category:'教材' },
  { id:'3',name:'大学英语综合教程1',price:8,publisher:'上海外语教育出版社',category:'教材' },
  { id:'4',name:'C程序设计第五版',price:20,publisher:'清华大学出版社',category:'教材' },
];

export default function BooksPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const filtered = search ? mockBooks.filter((b) => b.name.includes(search)) : mockBooks;
  const isDark = theme.background === '#000000';
  return (
    <ThemedView style={s.container}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[s.gradient,{paddingTop:insets.top+8}]}>
        <ScrollView style={s.scroll}>
          <View style={s.headerRow}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="二手书" />
            <View style={s.actions}>
              <TouchableOpacity onPress={()=>router.push('/books-edit')}><MaterialIcon name="plus" size={24} color="#fff" /></TouchableOpacity>
              <TouchableOpacity onPress={()=>router.push('/chat-list')}><MaterialIcon name="message-text-outline" size={22} color="#fff" /></TouchableOpacity>
            </View>
          </View>
          <View style={[s.searchBar,{backgroundColor:theme.surface}]}><MaterialIcon name="magnify" size={18} color={theme.textSecondary} /><TextInput style={[s.searchInput,{color:theme.text}]} value={search} onChangeText={setSearch} placeholder="搜索书名或出版社" placeholderTextColor={theme.textSecondary} /></View>
          <View style={s.grid}>{filtered.map((b)=>(<TouchableOpacity key={b.id} style={[s.card,{backgroundColor:theme.surface}]} onPress={()=>router.push(`/books-detail?id=${b.id}`)}><View style={[s.cover,{backgroundColor:theme.primaryContainer}]}><MaterialIcon name="book-open-page-variant" size={30} color={theme.primary} /></View><ThemedText style={s.bName} numberOfLines={2}>{b.name}</ThemedText><ThemedText style={[s.price,{color:'#e74c3c'}]}>¥{b.price}</ThemedText></TouchableOpacity>))}</View>
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}
const s = StyleSheet.create({
  container:{flex:1},gradient:{flex:1},scroll:{flex:1,paddingHorizontal:8},
  headerRow:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4},actions:{flexDirection:'row',gap:8},
  searchBar:{flexDirection:'row',alignItems:'center',margin:12,borderRadius:10,paddingHorizontal:12,paddingVertical:8,gap:8},searchInput:{flex:1,fontSize:15},
  grid:{flexDirection:'row',flexWrap:'wrap',gap:8,padding:8},
  card:{borderRadius:12,padding:8,width:'47%'},cover:{height:110,borderRadius:8,justifyContent:'center',alignItems:'center',marginBottom:8},
  bName:{fontSize:13,fontWeight:'500',marginBottom:6},price:{fontSize:16,fontWeight:'700'},
});
