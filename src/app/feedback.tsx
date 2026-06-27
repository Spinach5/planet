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

export default function FeedbackPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets(); const { showToast } = useToast();
  const [content, setContent] = useState(''); const [contact, setContact] = useState('');
  const [sub, setSub] = useState(false);

  const submit = useCallback(() => {
    if (!content.trim()) { showToast({ message: '请输入反馈内容', type: 'warning' }); return; }
    setSub(true);
    setTimeout(() => { showToast({ message: '反馈提交成功，感谢！', type: 'success' }); setContent(''); setContact(''); setSub(false); }, 1000);
  }, [content, showToast]);

  const isDark = theme.background === '#000000';
  return (
    <ThemedView style={s.container}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[s.gradient,{paddingTop:insets.top+8}]}>
        <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.headerRow}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="反馈" /></View>
          <View style={[s.card,{backgroundColor:theme.surface}]}>
            <ThemedText style={s.label}>反馈内容</ThemedText>
            <TextInput style={[s.ta,{backgroundColor:theme.backgroundElement,color:theme.text,borderColor:theme.outlineVariant}]} value={content} onChangeText={setContent} placeholder="请输入反馈（500字以内）" placeholderTextColor={theme.textSecondary} multiline numberOfLines={6} maxLength={500} textAlignVertical="top" />
          </View>
          <View style={[s.card,{backgroundColor:theme.surface}]}>
            <ThemedText style={s.label}>联系方式（选填）</ThemedText>
            <TextInput style={[s.input,{backgroundColor:theme.backgroundElement,color:theme.text,borderColor:theme.outlineVariant}]} value={contact} onChangeText={setContact} placeholder="QQ/微信/邮箱" placeholderTextColor={theme.textSecondary} />
          </View>
          <TouchableOpacity style={[s.btn,{backgroundColor:sub?theme.textSecondary:theme.primary}]} onPress={submit} disabled={sub}>
            <MaterialIcon name="send" size={20} color="#fff" /><ThemedText style={s.btnText}>{sub?'提交中...':'提交反馈'}</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  container:{flex:1},gradient:{flex:1},scroll:{flex:1,paddingHorizontal:8},
  headerRow:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4},
  card:{borderRadius:12,padding:16,marginHorizontal:8,marginBottom:16},
  label:{fontSize:15,fontWeight:'600',marginBottom:10},
  ta:{borderRadius:12,borderWidth:1,padding:12,fontSize:15,minHeight:120},
  input:{borderRadius:12,borderWidth:1,padding:12,fontSize:15},
  btn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:14,borderRadius:12,marginHorizontal:8},
  btnText:{fontSize:16,fontWeight:'600',color:'#fff'},
});
