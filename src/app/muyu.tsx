import { useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Text } from 'react-native';
import { router, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HeadStatus } from '@/components/HeadStatus';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';

export default function MuYuPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets();
  const [merit, setMerit] = useState(0);
  const [fts, setFts] = useState<Array<{id:number;x:number;a:Animated.Value}>>([]);
  const sv = useMemo(() => new Animated.Value(1), []);
  const nid = useRef(0);

  const hit = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMerit((p) => p + 1);
    Animated.sequence([Animated.timing(sv, { toValue: 0.9, duration: 50, useNativeDriver: true }), Animated.timing(sv, { toValue: 1, duration: 150, useNativeDriver: true })]).start();
    const id = nid.current++; const x = Math.random() * 100 - 50; const a = new Animated.Value(0);
    setFts((p) => [...p.slice(-5), { id, x, a }]);
    Animated.timing(a, { toValue: -100, duration: 800, useNativeDriver: true }).start(() => setFts((p) => p.filter((f) => f.id !== id)));
  }, [sv]);

  const isDark = theme.background === '#000000';

  return (
    <ThemedView style={st.container}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[st.gradient,{paddingTop:insets.top+8}]}>
        <View style={st.headerRow}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="电子木鱼" /></View>
        <View style={st.content}>
          <View style={[st.meritCard,{backgroundColor:theme.surface}]}>
            <ThemedText style={st.meritLabel} themeColor="textSecondary">功德</ThemedText>
            <ThemedText style={st.meritValue}>{merit}</ThemedText>
          </View>
          <View style={st.fishContainer}>
            {fts.map((f) => (<Animated.View key={f.id} style={[st.floating,{transform:[{translateX:f.x},{translateY:f.a}],opacity:f.a.interpolate({inputRange:[-100,-50,0],outputRange:[0,0.8,1]})}]}><Text style={[st.ftText,{color:theme.primary}]}>+1</Text></Animated.View>))}
            <Animated.View style={{ transform: [{ scale: sv }] }}>
              <TouchableOpacity onPress={hit} activeOpacity={0.8}>
                <View style={[st.fish,{backgroundColor:theme.primaryContainer,borderColor:theme.primary}]}>
                  <MaterialIcon name="cards-heart" size={60} color={theme.primary} />
                </View>
              </TouchableOpacity>
            </Animated.View>
            <ThemedText style={st.hint} themeColor="textSecondary">敲击木鱼，积累功德</ThemedText>
          </View>
        </View>
      </LinearGradient>
    </ThemedView>
  );
}

const st = StyleSheet.create({
  container:{flex:1},gradient:{flex:1},
  headerRow:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4,paddingHorizontal:8},
  content:{flex:1,alignItems:'center',justifyContent:'center',paddingBottom:80},
  meritCard:{borderRadius:16,paddingHorizontal:32,paddingVertical:16,alignItems:'center',marginBottom:40},
  meritLabel:{fontSize:14,marginBottom:4},meritValue:{fontSize:48,fontWeight:'300'},
  fishContainer:{alignItems:'center'},
  fish:{width:140,height:140,borderRadius:70,justifyContent:'center',alignItems:'center',borderWidth:3},
  hint:{fontSize:14,marginTop:24},
  floating:{position:'absolute',zIndex:10},ftText:{fontSize:24,fontWeight:'700'},
});
