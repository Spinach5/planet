import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HeadStatus } from '@/components/HeadStatus';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';

const levelColors: Record<string, string> = { DEBUG: '#999', INFO: '#0288d1', WARN: '#ed6c02', ERROR: '#d32f2f' };
const mockLogs = [
  { level: 'INFO' as const, message: '[App] 应用启动成功', time: '10:00:01' },
  { level: 'INFO' as const, message: '[Cache] 从缓存加载用户信息成功', time: '10:00:02' },
  { level: 'WARN' as const, message: '[Request] 请求超时，正在重试', time: '10:01:00' },
  { level: 'ERROR' as const, message: '[Login] 登录失败: 密码错误', time: '10:02:00' },
];

export default function RuntimeLogPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets(); const { showToast } = useToast();
  // eslint-disable-next-line react/hook-use-state
  const [logs] = useState(mockLogs);

  const copyAll = useCallback(async () => {
    const text = logs.map((l) => `[${l.time}] [${l.level}] ${l.message}`).join('\n');
    await Clipboard.setStringAsync(text); showToast({ message: '日志已复制', type: 'success' });
  }, [logs, showToast]);

  const clear = useCallback(() => {
    Alert.alert('确认', '是否清除所有日志？', [{ text: '取消', style: 'cancel' }, { text: '确定', style: 'destructive', onPress: () => { showToast({ message: '日志已清除', type: 'success' }); } }]);
  }, [showToast]);

  const isDark = theme.background === '#000000';
  return (
    <ThemedView style={s.container}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[s.gradient,{paddingTop:insets.top+8}]}>
        <ScrollView style={s.scroll}>
          <View style={s.headerRow}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="运行日志" />
            <View style={s.actions}>
              <TouchableOpacity onPress={()=>{void copyAll();}}><MaterialIcon name="content-copy" size={20} color="#fff" /></TouchableOpacity>
              <TouchableOpacity onPress={clear}><MaterialIcon name="delete-outline" size={20} color="#fff" /></TouchableOpacity>
            </View>
          </View>
          {logs.map((l,i)=>(
            <View key={`${l.time}-${String(i)}`} style={[s.item,{borderLeftColor:levelColors[l.level]??'#999'}]}>
              <ThemedText style={s.time} themeColor="textSecondary">{l.time}</ThemedText>
              <View style={[s.badge,{backgroundColor:levelColors[l.level]??'#999'}]}><ThemedText style={s.badgeText}>{l.level}</ThemedText></View>
              <ThemedText style={s.msg} numberOfLines={2}>{l.message}</ThemedText>
            </View>
          ))}
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  container:{flex:1},gradient:{flex:1},scroll:{flex:1,paddingHorizontal:8},
  headerRow:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4},actions:{flexDirection:'row',gap:12,marginLeft:'auto'},
  item:{flexDirection:'row',alignItems:'flex-start',gap:8,paddingVertical:8,paddingLeft:10,borderLeftWidth:3,marginBottom:4},
  time:{fontSize:11,width:54},badge:{borderRadius:4,paddingHorizontal:4,paddingVertical:1},badgeText:{fontSize:10,fontWeight:'700',color:'#fff'},
  msg:{fontSize:13,flex:1,lineHeight:18},
});
