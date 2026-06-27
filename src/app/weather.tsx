import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HeadStatus } from '@/components/HeadStatus';
import { MaterialIcon } from '@/components/MaterialIcon';
import type { IconName } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';
import { Loading } from '@/components/Loading';
import { weatherManager } from '@/service/weatherInfo';
import { runtimeLogger } from '@/utils/runtimeLogger';

export default function WeatherPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets(); const { showToast } = useToast();
  const initialized = useRef(false);
  const [current, setCurrent] = useState<ReturnType<typeof weatherManager.getCurrentWeather>>(null);
  const [area, setArea] = useState<ReturnType<typeof weatherManager.getCurrentArea>>(null);
  const [hourly, setHourly] = useState<ReturnType<typeof weatherManager.get24HourForecast>>([]);
  const [daily, setDaily] = useState<ReturnType<typeof weatherManager.getDailyForecast>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      await weatherManager.init(false);
      setCurrent(weatherManager.getCurrentWeather());
      setArea(weatherManager.getCurrentArea());
      setHourly(weatherManager.get24HourForecast());
      setDaily(weatherManager.getDailyForecast());
      if (weatherManager.locationSource === 'default') {
        showToast({
          message: '定位失败，已使用默认城市',
          type: 'warning',
        });
      }
      runtimeLogger.info('Weather', '天气数据加载成功');
    } catch (e) {
      setError(true);
      runtimeLogger.error('Weather', '获取天气失败', e);
      showToast({ message: '获取天气失败', type: 'error' });
    } finally { setLoading(false); setRefreshing(false); }
  }, [showToast]);

  useEffect(() => {
    if (!initialized.current) { initialized.current = true; void fetchWeather(); }
  }, [fetchWeather]);

  const onRefresh = useCallback(() => { setRefreshing(true); void fetchWeather(); }, [fetchWeather]);

  const isDark = theme.background === '#000000';
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const locStr = area ? (area.city !== '-' ? area.city : (area.province !== '-' ? area.province : '定位中...')) : '定位中...';

  return (
    <ThemedView style={st.container}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[st.gradient, { paddingTop: insets.top + 8 }]}>
        <ScrollView style={st.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#47a5fd']} tintColor="#47a5fd" />}>
          <View style={st.headerRow}><TouchableOpacity onPress={() => router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="天气" /></View>
          {loading ? <Loading overlay={false} text="加载天气中..." /> :
          error ? <View style={[st.card, { backgroundColor: theme.surface }]}><View style={st.center}><MaterialIcon name="weather-cloudy-alert" size={48} color={theme.textSecondary} /><ThemedText style={{ marginTop: 12, fontSize: 16 }} themeColor="textSecondary">天气数据加载失败</ThemedText><TouchableOpacity style={[st.retry, { backgroundColor: theme.primary }]} onPress={onRefresh}><Text style={{ color: '#fff', fontWeight: '600' }}>重试</Text></TouchableOpacity></View></View> :
          current ? <>
            <View style={[st.card, { backgroundColor: theme.surface }]}>
              <View style={st.cardH}><View><ThemedText style={st.loc}>{locStr}</ThemedText><ThemedText style={st.time} themeColor="textSecondary">更新于 {new Date().toLocaleTimeString('zh-CN')}</ThemedText></View><MaterialIcon name={current.weatherIcon as IconName} size={48} color={theme.primary} /></View>
              <View style={st.tempRow}><ThemedText style={st.temp}>{Math.round(current.temperature)}°</ThemedText><View style={st.hilo}><Text style={{ fontSize: 14, fontWeight: '500', color: theme.text }}>{current.weatherDescription}</Text></View></View>
              <View style={st.details}>
                <View style={st.detail}><MaterialIcon name="water-percent" size={14} color={theme.textSecondary} /><ThemedText style={st.detailT} themeColor="textSecondary">{current.humidity}%</ThemedText></View>
                <View style={st.detail}><MaterialIcon name="weather-windy" size={14} color={theme.textSecondary} /><ThemedText style={st.detailT} themeColor="textSecondary">{current.windSpeed}km/h</ThemedText></View>
              </View>
            </View>
            {hourly.length > 0 && <><ThemedText style={st.sec}>逐时预报</ThemedText><ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.hScroll}>{hourly.map((h) => (<View key={h.time} style={[st.hItem, { backgroundColor: theme.surface }]}><Text style={{ fontSize: 11, color: theme.textSecondary }}>{h.time.slice(11, 16)}</Text><MaterialIcon name={h.weatherIcon as IconName} size={20} color={theme.primary} /><Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>{Math.round(h.temperature)}°</Text></View>))}</ScrollView></>}
            {daily.length > 0 && <><ThemedText style={st.sec}>未来预报</ThemedText><View style={st.dList}>{daily.map((d, i) => (<View key={d.time} style={[st.dItem, { backgroundColor: theme.surface }]}><Text style={{ fontSize: 14, fontWeight: '500', width: 50, color: theme.text }}>{i === 0 ? '今天' : i === 1 ? '明天' : d.time.slice(5)}</Text><MaterialIcon name={d.weatherIcon as IconName} size={20} color={theme.primary} /><Text style={{ fontSize: 14, flex: 1, color: theme.textSecondary }}>{d.weatherDescription}</Text><View style={{ flexDirection: 'row', gap: 8 }}><Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{Math.round(d.tempMax)}°</Text><Text style={{ fontSize: 14, color: theme.textSecondary }}>{Math.round(d.tempMin)}°</Text></View></View>))}</View></>}
          </> : null}
          <View style={{ height: 60 }} />
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 }, gradient: { flex: 1 }, scroll: { flex: 1, paddingHorizontal: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  center: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  card: { borderRadius: 16, padding: 20, marginBottom: 16, marginHorizontal: 8 },
  cardH: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  loc: { fontSize: 16, fontWeight: '600' }, time: { fontSize: 12, marginTop: 2 },
  tempRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 },
  temp: { fontSize: 56, fontWeight: '300', lineHeight: 60 },
  hilo: { flexDirection: 'row', gap: 8, marginLeft: 12, marginBottom: 8 },
  details: { flexDirection: 'row', gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.2)' },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 }, detailT: { fontSize: 13 },
  retry: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  sec: { fontSize: 18, fontWeight: '600', marginBottom: 10, marginTop: 8, marginHorizontal: 8 },
  hScroll: { marginBottom: 16 }, hItem: { borderRadius: 12, padding: 10, marginRight: 8, alignItems: 'center', minWidth: 64 },
  dList: { gap: 6, marginHorizontal: 8 }, dItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, gap: 10 },
});
