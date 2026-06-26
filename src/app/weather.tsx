import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { ActivityIndicator } from 'react-native-paper';
import * as Location from 'expo-location';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcon } from '@/components/MaterialIcon';
import type { IconName } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';

interface WeatherCurrent {
  temperature: number;
  weatherCode: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  hi: number;
  lo: number;
  location: string;
  updateTime: string;
}

interface HourlyForecast {
  time: string;
  temperature: number;
  weatherCode: number;
}

interface DailyForecast {
  date: string;
  weatherCode: number;
  hi: number;
  lo: number;
}

function getWeatherIcon(code: number): IconName {
  if (code <= 3) return 'weather-sunny';
  if (code <= 49) return 'weather-partly-cloudy';
  if (code <= 59) return 'weather-rainy';
  if (code <= 69) return 'weather-snowy';
  if (code <= 79) return 'weather-snowy-heavy';
  if (code <= 99) return 'weather-lightning';
  return 'weather-cloudy';
}

function getWeatherDesc(code: number): string {
  if (code === 0) return '晴朗';
  if (code <= 3) return '多云';
  if (code <= 49) return '阴天';
  if (code <= 59) return '小雨';
  if (code <= 69) return '雪';
  if (code <= 79) return '大雪';
  if (code <= 99) return '雷暴';
  return '未知';
}

export default function WeatherPage() {
  const theme = useTheme();
  const { showToast } = useToast();
  const initialized = useRef(false);

  const [current, setCurrent] = useState<WeatherCurrent | null>(null);
  const [hourly, setHourly] = useState<HourlyForecast[]>([]);
  const [daily, setDaily] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    try {
      // Get location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        showToast({ message: '需要位置权限获取天气', type: 'warning' });
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      // Fetch weather from Open-Meteo
      const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation',
        hourly: 'temperature_2m,weather_code',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        timezone: 'Asia/Shanghai',
        forecast_days: '7',
      });

      const resp = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
      const data = (await resp.json()) as Record<string, unknown>;

      // Parse current
      const cur = data.current as Record<string, number> | undefined;
      const dailyData = data.daily as Record<string, unknown[]> | undefined;
      const hourlyData = data.hourly as Record<string, unknown[]> | undefined;

      if (cur) {
        setCurrent({
          temperature: Math.round(cur.temperature_2m),
          weatherCode: cur.weather_code,
          humidity: cur.relative_humidity_2m,
          windSpeed: cur.wind_speed_10m,
          precipitation: cur.precipitation,
          hi: dailyData ? Math.round(dailyData.temperature_2m_max[0] as number) : 0,
          lo: dailyData ? Math.round(dailyData.temperature_2m_min[0] as number) : 0,
          location: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
          updateTime: new Date().toLocaleTimeString('zh-CN'),
        });
      }

      // Parse hourly
      if (hourlyData) {
        const times = hourlyData.time as string[];
        const temps = hourlyData.temperature_2m as number[];
        const codes = hourlyData.weather_code as number[];
        const now = new Date();
        const hourList: HourlyForecast[] = [];
        for (let i = 0; i < Math.min(times.length, 24); i++) {
          const d = new Date(times[i]);
          if (d >= now || hourList.length < 12) {
            hourList.push({
              time: `${String(d.getHours())}:00`,
              temperature: Math.round(temps[i]),
              weatherCode: codes[i],
            });
          }
        }
        setHourly(hourList.slice(0, 24));
      }

      // Parse daily
      if (dailyData) {
        const dates = dailyData.time as string[];
        const his = dailyData.temperature_2m_max as number[];
        const los = dailyData.temperature_2m_min as number[];
        const codes = dailyData.weather_code as number[];
        const dayList: DailyForecast[] = [];
        for (let i = 0; i < dates.length; i++) {
          dayList.push({
            date: dates[i],
            weatherCode: codes[i],
            hi: Math.round(his[i]),
            lo: Math.round(los[i]),
          });
        }
        setDaily(dayList);
      }
    } catch {
      showToast({ message: '获取天气失败', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const navigateBack = useCallback(() => router.back(), []);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} themeColor="onPrimary">天气</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            colors={[theme.primary]} tintColor={theme.primary} />
        }
      >
        {loading ? (
          <View style={styles.emptyView}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : !current ? null : (
          <>
            {/* Current Weather Card */}
            <View style={[styles.currentCard, { backgroundColor: theme.surfaceVariant }]}>
              <View style={styles.currentHeader}>
                <View>
                  <ThemedText style={styles.location}>{current.location}</ThemedText>
                  <ThemedText style={styles.updateTime} themeColor="textSecondary">
                    更新于 {current.updateTime}
                  </ThemedText>
                </View>
                <MaterialIcon name={getWeatherIcon(current.weatherCode)} size={48} color={theme.primary} />
              </View>
              <View style={styles.tempRow}>
                <ThemedText style={styles.temp}>{current.temperature}°</ThemedText>
                <View style={styles.hilo}>
                  <ThemedText style={styles.hiText}>H:{current.hi}°</ThemedText>
                  <ThemedText style={styles.loText}>L:{current.lo}°</ThemedText>
                </View>
              </View>
              <ThemedText style={styles.weatherDesc}>
                {getWeatherDesc(current.weatherCode)}
              </ThemedText>
              <View style={styles.details}>
                <View style={styles.detailItem}>
                  <MaterialIcon name="water-percent" size={16} color={theme.textSecondary} />
                  <ThemedText style={styles.detailText} themeColor="textSecondary">
                    {current.humidity}%
                  </ThemedText>
                </View>
                <View style={styles.detailItem}>
                  <MaterialIcon name="weather-windy" size={16} color={theme.textSecondary} />
                  <ThemedText style={styles.detailText} themeColor="textSecondary">
                    {current.windSpeed} km/h
                  </ThemedText>
                </View>
                <View style={styles.detailItem}>
                  <MaterialIcon name="weather-rainy" size={16} color={theme.textSecondary} />
                  <ThemedText style={styles.detailText} themeColor="textSecondary">
                    {current.precipitation} mm
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Hourly Forecast */}
            {hourly.length > 0 ? (
              <>
                <ThemedText style={styles.sectionTitle}>逐时预报</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyScroll}>
                  {hourly.map((h) => (
                    <View key={h.time}
                      style={[styles.hourlyItem, { backgroundColor: theme.surfaceVariant }]}>
                      <ThemedText style={styles.hourlyTime}>{h.time}</ThemedText>
                      <MaterialIcon name={getWeatherIcon(h.weatherCode)} size={22} color={theme.primary} />
                      <ThemedText style={styles.hourlyTemp}>{h.temperature}°</ThemedText>
                    </View>
                  ))}
                </ScrollView>
              </>
            ) : null}

            {/* Daily Forecast */}
            {daily.length > 0 ? (
              <>
                <ThemedText style={styles.sectionTitle}>未来预报</ThemedText>
                <View style={styles.dailyList}>
                  {daily.map((d, idx) => (
                    <View key={d.date}
                      style={[styles.dailyItem, { backgroundColor: theme.surfaceVariant }]}>
                      <ThemedText style={styles.dailyDate}>
                        {idx === 0 ? '今天' : idx === 1 ? '明天' : d.date.slice(5)}
                      </ThemedText>
                      <MaterialIcon name={getWeatherIcon(d.weatherCode)} size={22} color={theme.primary} />
                      <ThemedText style={styles.dailyDesc}>
                        {getWeatherDesc(d.weatherCode)}
                      </ThemedText>
                      <View style={styles.dailyTemps}>
                        <ThemedText style={styles.dailyHi}>{d.hi}°</ThemedText>
                        <ThemedText style={styles.dailyLo} themeColor="textSecondary">{d.lo}°</ThemedText>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#ffffff' },
  headerSpacer: { width: 40 },
  scrollView: { flex: 1, padding: 16 },
  emptyView: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  currentCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
  currentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  location: { fontSize: 16, fontWeight: '600' },
  updateTime: { fontSize: 12, marginTop: 2 },
  tempRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  temp: { fontSize: 56, fontWeight: '300', lineHeight: 60 },
  hilo: { flexDirection: 'row', gap: 8, marginLeft: 12, marginBottom: 8 },
  hiText: { fontSize: 14, fontWeight: '500' },
  loText: { fontSize: 14, fontWeight: '500' },
  weatherDesc: { fontSize: 16, marginBottom: 16 },
  details: { flexDirection: 'row', gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.2)' },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, marginTop: 8 },
  hourlyScroll: { marginBottom: 20 },
  hourlyItem: { borderRadius: 12, padding: 12, marginRight: 8, alignItems: 'center', minWidth: 70 },
  hourlyTime: { fontSize: 12, marginBottom: 6 },
  hourlyTemp: { fontSize: 14, fontWeight: '600', marginTop: 6 },
  dailyList: { gap: 8, marginBottom: 20 },
  dailyItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, gap: 12 },
  dailyDate: { fontSize: 14, fontWeight: '500', width: 50 },
  dailyDesc: { fontSize: 14, flex: 1 },
  dailyTemps: { flexDirection: 'row', gap: 8 },
  dailyHi: { fontSize: 14, fontWeight: '600' },
  dailyLo: { fontSize: 14 },
  bottomSpacer: { height: 40 },
});
