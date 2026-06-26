import { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router, Stack } from 'expo-router';
import { ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HeadStatus } from '@/components/HeadStatus';
import { MaterialIcon } from '@/components/MaterialIcon';
import type { IconName } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';

function weatherIcon(code: number): IconName { if (code<=3) return 'weather-sunny'; if (code<=49) return 'weather-partly-cloudy'; if (code<=59) return 'weather-rainy'; if (code<=69) return 'weather-snowy'; return 'weather-cloudy'; }
function weatherDesc(code: number): string { if (code===0) return '晴朗'; if (code<=3) return '多云'; if (code<=49) return '阴天'; if (code<=59) return '小雨'; return '--'; }

export default function WeatherPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets(); const { showToast } = useToast();
  const initialized = useRef(false);
  const [current, setCurrent] = useState<{temp:number;code:number;hum:number;wind:number;hi:number;lo:number;loc:string;time:string}|null>(null);
  const [hourly, setHourly] = useState<Array<{time:string;temp:number;code:number}>>([]);
  const [daily, setDaily] = useState<Array<{date:string;code:number;hi:number;lo:number}>>([]);
  const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) { showToast({ message: '需要位置权限', type: 'warning' }); setLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation', hourly: 'temperature_2m,weather_code', daily: 'weather_code,temperature_2m_max,temperature_2m_min', timezone: 'Asia/Shanghai', forecast_days: '7' });
      const resp = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
      const data = (await resp.json()) as Record<string, unknown>;
      const cur = data.current as Record<string, number> | undefined;
      const dailyData = data.daily as Record<string, unknown[]> | undefined;
      const hourlyData = data.hourly as Record<string, unknown[]> | undefined;
      if (cur) setCurrent({ temp: Math.round(cur.temperature_2m), code: cur.weather_code, hum: cur.relative_humidity_2m, wind: cur.wind_speed_10m, precipitation: cur.precipitation, hi: dailyData ? Math.round(dailyData.temperature_2m_max[0] as number) : 0, lo: dailyData ? Math.round(dailyData.temperature_2m_min[0] as number) : 0, loc: `${latitude.toFixed(1)},${longitude.toFixed(1)}`, time: new Date().toLocaleTimeString('zh-CN') });
      if (hourlyData) {
        const times = hourlyData.time as string[]; const temps = hourlyData.temperature_2m as number[]; const codes = hourlyData.weather_code as number[];
        setHourly(times.slice(0,24).map((_:string,i:number)=>({ time: `${String(new Date(times[i]).getHours())}:00`, temp: Math.round(temps[i]), code: codes[i] })));
      }
      if (dailyData) {
        const dates = dailyData.time as string[]; const his = dailyData.temperature_2m_max as number[]; const los = dailyData.temperature_2m_min as number[]; const codes = dailyData.weather_code as number[];
        setDaily(dates.map((_:string,i:number)=>({ date: dates[i], code: codes[i], hi: Math.round(his[i]), lo: Math.round(los[i]) })));
      }
    } catch { showToast({ message: '获取天气失败', type: 'error' }); }
    finally { setLoading(false); setRefreshing(false); }
  }, [showToast]);

  useEffect(() => { if (!initialized.current) { initialized.current = true; void fetchWeather(); } }, [fetchWeather]);

  const isDark = theme.background === '#000000';

  return (
    <ThemedView style={s.container}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[s.gradient,{paddingTop:insets.top+8}]}>
        <ScrollView style={s.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);void fetchWeather();}} colors={['#47a5fd']} tintColor="#47a5fd" />}>
          <View style={s.headerRow}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="天气" /></View>
          {loading ? <ActivityIndicator size="large" color={theme.primary} style={{marginTop:60}} /> : current ? <>
            <View style={[s.card,{backgroundColor:theme.surface}]}>
              <View style={s.cardH}><View><ThemedText style={s.loc}>{current.loc}</ThemedText><ThemedText style={s.time} themeColor="textSecondary">更新于 {current.time}</ThemedText></View><MaterialIcon name={weatherIcon(current.code)} size={48} color={theme.primary} /></View>
              <View style={s.tempRow}><ThemedText style={s.temp}>{current.temp}°</ThemedText><View style={s.hilo}><ThemedText>H:{current.hi}°</ThemedText><ThemedText>L:{current.lo}°</ThemedText></View></View>
              <ThemedText style={s.desc}>{weatherDesc(current.code)}</ThemedText>
              <View style={s.details}><View style={s.detail}><MaterialIcon name="water-percent" size={14} color={theme.textSecondary} /><ThemedText style={s.detailT} themeColor="textSecondary">{current.hum}%</ThemedText></View><View style={s.detail}><MaterialIcon name="weather-windy" size={14} color={theme.textSecondary} /><ThemedText style={s.detailT} themeColor="textSecondary">{current.wind}km/h</ThemedText></View></View>
            </View>
            {hourly.length>0 && <><ThemedText style={s.secTitle}>逐时预报</ThemedText><ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hourlyScroll}>{hourly.map((h)=>(<View key={h.time} style={[s.hourlyItem,{backgroundColor:theme.surface}]}><ThemedText style={s.hTime}>{h.time}</ThemedText><MaterialIcon name={weatherIcon(h.code)} size={20} color={theme.primary} /><ThemedText style={s.hTemp}>{h.temp}°</ThemedText></View>))}</ScrollView></>}
            {daily.length>0 && <><ThemedText style={s.secTitle}>未来预报</ThemedText><View style={s.dailyList}>{daily.map((d,i)=>(<View key={d.date} style={[s.dailyItem,{backgroundColor:theme.surface}]}><ThemedText style={s.dDate}>{i===0?'今天':i===1?'明天':d.date.slice(5)}</ThemedText><MaterialIcon name={weatherIcon(d.code)} size={20} color={theme.primary} /><ThemedText style={s.dDesc}>{weatherDesc(d.code)}</ThemedText><View style={s.dTemps}><ThemedText style={s.dHi}>{d.hi}°</ThemedText><ThemedText themeColor="textSecondary">{d.lo}°</ThemedText></View></View>))}</View></>}
          </> : null}
          <View style={{height:60}} />
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  container:{flex:1},gradient:{flex:1},scrollView:{flex:1,paddingHorizontal:8},
  headerRow:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4},
  card:{borderRadius:16,padding:20,marginBottom:16,marginHorizontal:8},cardH:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12},loc:{fontSize:16,fontWeight:'600'},time:{fontSize:12,marginTop:2},
  tempRow:{flexDirection:'row',alignItems:'flex-end',marginBottom:4},temp:{fontSize:56,fontWeight:'300',lineHeight:60},hilo:{flexDirection:'row',gap:8,marginLeft:12,marginBottom:8},
  desc:{fontSize:16,marginBottom:12},
  details:{flexDirection:'row',gap:16,paddingTop:12,borderTopWidth:1,borderTopColor:'rgba(128,128,128,0.2)'},detail:{flexDirection:'row',alignItems:'center',gap:4},detailT:{fontSize:13},
  secTitle:{fontSize:18,fontWeight:'600',marginBottom:10,marginTop:8,marginHorizontal:8},
  hourlyScroll:{marginBottom:16},hourlyItem:{borderRadius:12,padding:10,marginRight:8,alignItems:'center',minWidth:64},hTime:{fontSize:11,marginBottom:4},hTemp:{fontSize:13,fontWeight:'600',marginTop:4},
  dailyList:{gap:6,marginHorizontal:8},dailyItem:{flexDirection:'row',alignItems:'center',borderRadius:12,padding:12,gap:10},
  dDate:{fontSize:14,fontWeight:'500',width:50},dDesc:{fontSize:14,flex:1},dTemps:{flexDirection:'row',gap:8},dHi:{fontSize:14,fontWeight:'600'},
});
