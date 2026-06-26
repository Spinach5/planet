import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HeadStatus } from '@/components/HeadStatus';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';

export default function BooksEditPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets(); const { showToast } = useToast();
  const [name, setName] = useState(''); const [price, setPrice] = useState(''); const [desc, setDesc] = useState('');
  const submit = useCallback(() => {
    if (!name.trim()) { showToast({ message:'请输入书名',type:'warning' }); return; }
    if (!price.trim()) { showToast({ message:'请输入价格',type:'warning' }); return; }
    showToast({ message:'发布成功',type:'success' }); router.back();
  }, [name,price,showToast]);
  const isDark = theme.background === '#000000';
  return (
    <ThemedView style={st.container}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[st.gradient,{paddingTop:insets.top+8}]}>
        <ScrollView style={st.scroll}>
          <View style={st.headerRow}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="发布书籍" /></View>
          <View style={[st.card,{backgroundColor:theme.surface}]}><ThemedText style={st.label}>书名</ThemedText><TextInput style={[st.input,{backgroundColor:theme.backgroundElement,color:theme.text,borderColor:theme.outlineVariant}]} value={name} onChangeText={setName} placeholder="请输入书名" placeholderTextColor={theme.textSecondary} /></View>
          <View style={[st.card,{backgroundColor:theme.surface}]}><ThemedText style={st.label}>价格 (¥)</ThemedText><TextInput style={[st.input,{backgroundColor:theme.backgroundElement,color:theme.text,borderColor:theme.outlineVariant}]} value={price} onChangeText={setPrice} placeholder="请输入价格" placeholderTextColor={theme.textSecondary} keyboardType="numeric" /></View>
          <View style={[st.card,{backgroundColor:theme.surface}]}><ThemedText style={st.label}>描述</ThemedText><TextInput style={[st.ta,{backgroundColor:theme.backgroundElement,color:theme.text,borderColor:theme.outlineVariant}]} value={desc} onChangeText={setDesc} placeholder="请描述书籍状况" placeholderTextColor={theme.textSecondary} multiline numberOfLines={4} textAlignVertical="top" /></View>
          <TouchableOpacity style={[st.btn,{backgroundColor:theme.primary}]} onPress={submit}><ThemedText style={st.btnText}>发布</ThemedText></TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}
const st = StyleSheet.create({
  container:{flex:1},gradient:{flex:1},scroll:{flex:1,paddingHorizontal:8},
  headerRow:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4},
  card:{borderRadius:12,padding:16,marginHorizontal:8,marginBottom:16},
  label:{fontSize:15,fontWeight:'600',marginBottom:10},input:{borderRadius:8,borderWidth:1,padding:12,fontSize:15},
  ta:{borderRadius:8,borderWidth:1,padding:12,fontSize:15,minHeight:100},
  btn:{alignItems:'center',paddingVertical:14,borderRadius:12,marginHorizontal:8},
  btnText:{fontSize:16,fontWeight:'600',color:'#fff'},
});
