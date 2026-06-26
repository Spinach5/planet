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
import { runtimeLogger } from '@/utils/runtimeLogger';

function weatherIcon(code: number): IconName {
  if (code <= 3) return 'weather-sunny';
  if (code <= 49) return 'weather-partly-cloudy';
  if (code <= 59) return 'weather-rainy';
  if (code <= 69) return 'weather-snowy';
  return 'weather-cloudy';
}

function weatherDesc(code: number): string {
  if (code === 0) return '晴朗';
  if (code <= 3) return '多云';
  if (code <= 49) return '阴天';
  if (code <= 59) return '小雨';
  return '--';
}

export default function WeatherPage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const initialized = useRef(false);

  const [current, setCurrent] = useState<{
    temp: number; code: number; hum: number; wind: number;
    hi: number; lo: number; precipitation: number;
  } | null>(null);

  const [hourly, setHourly] = useState<Array<{ time: string; temp: number; code: number }>>([]);
  const [daily, setDaily] = useState<Array<{ date: string; code: number; hi: number; lo: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({
        latitude: '30.48', longitude: '114.41',
        current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation',
        hourly: 'temperature_2m,weather_code',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        timezone: 'Asia/Shanghai', forecast_days: '7',
      });
      const resp = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
      if (!resp.ok) throw new Error(`HTTP ${String(resp.status)}`);
      const data = (await resp.json()) as Record<string, unknown>;

      const cur = data.current as Record<string, number> | undefined;
      const dail = data.daily as Record<string, unknown[]> | undefined;
      const hour = data.hourly as Record<string, unknown[]> | undefined;

      if (cur) {
        setCurrent({
          temp: Math.round(cur.temperature_2m),
          code: cur.weather_code,
          hum: cur.relative_humidity_2m,
          wind: cur.wind_speed_10m,
          precipitation: cur.precipitation,
          hi: dail ? Math.round(dail.temperature_2m_max[0] as number) : 0,
          lo: dail ? Math.round(dail.temperature_2m_min[0] as number) : 0,
        });
      }

      if (hour && Array.isArray(hour.time)) {
        const times = hour.time as string[];
        const temps = hour.temperature_2m as number[];
        const codes = hour.weather_code as number[];
        setHourly(times.slice(0, 24).map((_, i) => ({
          time: `${String(new Date(times[i]).getHours())}:00`,
          temp: Math.round(temps[i]),
          code: codes[i],
        })));
      }

      if (dail && Array.isArray(dail.time)) {
        const dates = dail.time as string[];
        const his = dail.temperature_2m_max as number[];
        const los = dail.temperature_2m_min as number[];
        const codes = dail.weather_code as number[];
        setDaily(dates.map((_, i) => ({
          date: dates[i], code: codes[i],
          hi: Math.round(his[i]), lo: Math.round(los[i]),
        })));
      }
    } catch (e) {
      setError(true);
      runtimeLogger.error('Weather', '获取天气失败', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      void fetchWeather();
    }
  }, [fetchWeather]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchWeather();
  }, [fetchWeather]);

  const isDark = theme.background === '#000000';

  return (
    <ThemedView style={st.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={isDark ? ['rgb(26,29,46)', 'rgb(35,39,64)', 'rgb(26,29,46)'] : ['#47a5fd', '#cce5ff', '#f2f5f9']}
        locations={[0, 0.28, 1]}
        style={[st.gradient, { paddingTop: insets.top + 8 }]}
      >
        <ScrollView
          style={st.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#47a5fd']} tintColor="#47a5fd" />}
        >
          <View style={st.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcon name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <HeadStatus text="天气" />
          </View>

          {loading ? (
            <View style={st.center}>
              <Text style={{ color: '#fff', fontSize: 16 }}>加载天气数据中...</Text>
            </View>
          ) : error ? (
            <View style={[st.card, { backgroundColor: theme.surface }]}>
              <View style={st.center}>
                <MaterialIcon name="weather-cloudy-alert" size={48} color={theme.textSecondary} />
                <ThemedText style={{ marginTop: 12, fontSize: 16 }} themeColor="textSecondary">
                  天气数据加载失败
                </ThemedText>
                <TouchableOpacity style={[st.retryBtn, { backgroundColor: theme.primary }]} onPress={onRefresh}>
                  <Text style={{ color: '#fff', fontWeight: '600' }}>重试</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : current ? (
            <>
              {/* Current Weather */}
              <View style={[st.card, { backgroundColor: theme.surface }]}>
                <View style={st.cardHeader}>
                  <View>
                    <ThemedText style={st.loc}>湖北工业大学</ThemedText>
                    <ThemedText style={st.updateTime} themeColor="textSecondary">
                      更新于 {new Date().toLocaleTimeString('zh-CN')}
                    </ThemedText>
                  </View>
                  <MaterialIcon name={weatherIcon(current.code)} size={48} color={theme.primary} />
                </View>
                <View style={st.tempRow}>
                  <ThemedText style={st.temp}>{current.temp}°</ThemedText>
                  <View style={st.hilo}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: theme.text }}>H:{current.hi}°</Text>
                    <Text style={{ fontSize: 14, color: theme.textSecondary }}>L:{current.lo}°</Text>
                  </View>
                </View>
                <ThemedText style={st.desc}>{weatherDesc(current.code)}</ThemedText>
                <View style={st.details}>
                  <View style={st.detail}>
                    <MaterialIcon name="water-percent" size={14} color={theme.textSecondary} />
                    <ThemedText style={st.detailText} themeColor="textSecondary">{current.hum}%</ThemedText>
                  </View>
                  <View style={st.detail}>
                    <MaterialIcon name="weather-windy" size={14} color={theme.textSecondary} />
                    <ThemedText style={st.detailText} themeColor="textSecondary">{current.wind}km/h</ThemedText>
                  </View>
                </View>
              </View>

              {/* Hourly */}
              {hourly.length > 0 && (
                <>
                  <ThemedText style={st.sectionTitle}>逐时预报</ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.hourlyScroll}>
                    {hourly.map((h) => (
                      <View key={h.time} style={[st.hourlyItem, { backgroundColor: theme.surface }]}>
                        <Text style={{ fontSize: 11, color: theme.textSecondary }}>{h.time}</Text>
                        <MaterialIcon name={weatherIcon(h.code)} size={20} color={theme.primary} />
                        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>{h.temp}°</Text>
                      </View>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Daily */}
              {daily.length > 0 && (
                <>
                  <ThemedText style={st.sectionTitle}>未来预报</ThemedText>
                  <View style={st.dailyList}>
                    {daily.map((d, i) => (
                      <View key={d.date} style={[st.dailyItem, { backgroundColor: theme.surface }]}>
                        <Text style={{ fontSize: 14, fontWeight: '500', width: 50, color: theme.text }}>
                          {i === 0 ? '今天' : i === 1 ? '明天' : d.date.slice(5)}
                        </Text>
                        <MaterialIcon name={weatherIcon(d.code)} size={20} color={theme.primary} />
                        <Text style={{ fontSize: 14, flex: 1, color: theme.textSecondary }}>{weatherDesc(d.code)}</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{d.hi}°</Text>
                          <Text style={{ fontSize: 14, color: theme.textSecondary }}>{d.lo}°</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </>
          ) : null}

          <View style={{ height: 60 }} />
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  center: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },

  // Current card
  card: { borderRadius: 16, padding: 20, marginBottom: 16, marginHorizontal: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  loc: { fontSize: 16, fontWeight: '600' },
  updateTime: { fontSize: 12, marginTop: 2 },
  tempRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 },
  temp: { fontSize: 56, fontWeight: '300', lineHeight: 60 },
  hilo: { flexDirection: 'row', gap: 8, marginLeft: 12, marginBottom: 8 },
  desc: { fontSize: 16, marginBottom: 12 },
  details: { flexDirection: 'row', gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.2)' },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13 },

  // Retry
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },

  // Sections
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10, marginTop: 8, marginHorizontal: 8 },

  // Hourly
  hourlyScroll: { marginBottom: 16 },
  hourlyItem: { borderRadius: 12, padding: 10, marginRight: 8, alignItems: 'center', minWidth: 64 },

  // Daily
  dailyList: { gap: 6, marginHorizontal: 8 },
  dailyItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, gap: 10 },
});
