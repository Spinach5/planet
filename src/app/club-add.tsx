import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HeadStatus } from '@/components/HeadStatus';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';
import { addClub } from '@/service/server/clubs';
import userManager from '@/service/userInfo';

const ALL_CATEGORIES = ['学术科技类','创新创业类','文化艺术类','体育活动类','志愿公益类','思想政治类','其他'];
const NATURE_OPTIONS = [
  { label: '社团', value: 0 },
  { label: '学生会', value: 1 },
  { label: '其他', value: 2 },
];

export default function ClubAddPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets(); const { showToast } = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORIES[0]);
  const [nature, setNature] = useState(0);
  const [introduction, setIntroduction] = useState('');
  const [activities, setActivities] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCat, setShowCat] = useState(false);
  const [showNature, setShowNature] = useState(false);
  const isDark = theme.background === '#000000';

  const handleSubmit = async () => {
    if (!name.trim()) { showToast({ message: '请输入社团名称', type: 'warning' }); return; }
    setSubmitting(true);
    try {
      const schoolId = userManager.getSchoolId() || 'hbut';
      const res = await addClub({
        name: name.trim(), category, nature,
        introduction: introduction.trim() || null,
        activities: activities.trim() || null,
        contact: contact.trim() || null, schoolId,
      });
      if (res?.success) {
        showToast({ message: '创建成功', type: 'success' });
        setTimeout(() => router.back(), 1500);
      } else {
        showToast({ message: res?.message || '创建失败', type: 'error' });
      }
    } catch (e) {
      showToast({ message: (e as Error).message || '创建失败', type: 'error' });
    } finally { setSubmitting(false); }
  };

  return (
    <ThemedView style={st.outer}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[st.grad,{paddingTop:insets.top+8}]}>
        <View style={st.hdr}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="添加社团" /></View>
        <ScrollView style={st.scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom:60}}>
          {/* Name */}
          <View style={[st.card,{backgroundColor:theme.surface}]}>
            <ThemedText style={st.label}>社团名称 *</ThemedText>
            <TextInput style={[st.input,{backgroundColor:theme.backgroundElement,color:theme.text,borderColor:theme.outlineVariant}]} value={name} onChangeText={setName} placeholder="请输入社团名称" placeholderTextColor={theme.textSecondary} maxLength={50} />
          </View>
          {/* Category */}
          <View style={[st.card,{backgroundColor:theme.surface}]}>
            <ThemedText style={st.label}>种类 *</ThemedText>
            <TouchableOpacity style={[st.picker,{backgroundColor:theme.backgroundElement}]} onPress={()=>setShowCat(!showCat)}>
              <Text style={{color:theme.text}}>{category}</Text>
              <MaterialIcon name={showCat?'chevron-up':'chevron-down'} size={16} color="#999" />
            </TouchableOpacity>
            {showCat && ALL_CATEGORIES.map((c)=>(
              <TouchableOpacity key={c} style={[st.pickerOpt,c===category&&{backgroundColor:theme.primaryContainer}]} onPress={()=>{setCategory(c);setShowCat(false);}}>
                <Text style={{color:theme.text}}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Nature */}
          <View style={[st.card,{backgroundColor:theme.surface}]}>
            <ThemedText style={st.label}>性质 *</ThemedText>
            <TouchableOpacity style={[st.picker,{backgroundColor:theme.backgroundElement}]} onPress={()=>setShowNature(!showNature)}>
              <Text style={{color:theme.text}}>{NATURE_OPTIONS.find((n)=>n.value===nature)?.label}</Text>
              <MaterialIcon name={showNature?'chevron-up':'chevron-down'} size={16} color="#999" />
            </TouchableOpacity>
            {showNature && NATURE_OPTIONS.map((opt)=>(
              <TouchableOpacity key={opt.value} style={[st.pickerOpt,nature===opt.value&&{backgroundColor:theme.primaryContainer}]} onPress={()=>{setNature(opt.value);setShowNature(false);}}>
                <Text style={{color:theme.text}}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Intro */}
          <View style={[st.card,{backgroundColor:theme.surface}]}>
            <ThemedText style={st.label}>简介</ThemedText>
            <TextInput style={[st.ta,{backgroundColor:theme.backgroundElement,color:theme.text,borderColor:theme.outlineVariant}]} value={introduction} onChangeText={setIntroduction} placeholder="请输入社团简介" placeholderTextColor={theme.textSecondary} multiline textAlignVertical="top" maxLength={500} />
          </View>
          {/* Activities */}
          <View style={[st.card,{backgroundColor:theme.surface}]}>
            <ThemedText style={st.label}>活动</ThemedText>
            <TextInput style={[st.ta,{backgroundColor:theme.backgroundElement,color:theme.text,borderColor:theme.outlineVariant}]} value={activities} onChangeText={setActivities} placeholder="请输入社团活动（每行一个）" placeholderTextColor={theme.textSecondary} multiline textAlignVertical="top" maxLength={1000} />
          </View>
          {/* Contact */}
          <View style={[st.card,{backgroundColor:theme.surface}]}>
            <ThemedText style={st.label}>联系方式</ThemedText>
            <TextInput style={[st.input,{backgroundColor:theme.backgroundElement,color:theme.text,borderColor:theme.outlineVariant}]} value={contact} onChangeText={setContact} placeholder="请输入联系方式（选填）" placeholderTextColor={theme.textSecondary} maxLength={100} />
          </View>
          {/* Submit */}
          <TouchableOpacity style={[st.btn,{backgroundColor:theme.primary}]} onPress={submitting?undefined:handleSubmit}>
            <Text style={st.btnText}>{submitting?'提交中...':'提交'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const st = StyleSheet.create({
  outer:{flex:1},grad:{flex:1},scroll:{flex:1,paddingHorizontal:8},
  hdr:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4},
  card:{borderRadius:12,padding:16,marginHorizontal:8,marginBottom:12},
  label:{fontSize:15,fontWeight:'600',marginBottom:10},
  input:{borderRadius:8,borderWidth:1,padding:12,fontSize:15},
  ta:{borderRadius:8,borderWidth:1,padding:12,fontSize:15,minHeight:80},
  picker:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderRadius:8,borderWidth:1,borderColor:'#ddd',padding:12},
  pickerOpt:{paddingVertical:12,paddingHorizontal:16,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:'#eee'},
  btn:{alignItems:'center',paddingVertical:14,borderRadius:12,marginHorizontal:8,marginTop:8},
  btnText:{fontSize:16,fontWeight:'600',color:'#fff'},
});
