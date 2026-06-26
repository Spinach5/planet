import AsyncStorage from '@react-native-async-storage/async-storage';
import { runtimeLogger } from '@/utils/runtimeLogger';

// WMO weather code → [description, icon]
const WMO_CODE_MAP: Record<number, [string, string]> = {
  0: ['晴天', 'weather-sunny'],
  1: ['大部晴朗', 'weather-sunny'],
  2: ['多云', 'weather-partly-cloudy'],
  3: ['阴天', 'weather-cloudy'],
  45: ['有雾', 'weather-fog'],
  48: ['有雾凇', 'weather-fog'],
  51: ['小毛毛雨', 'weather-rainy'],
  53: ['毛毛雨', 'weather-rainy'],
  55: ['大毛毛雨', 'weather-rainy'],
  61: ['小雨', 'weather-rainy'],
  63: ['中雨', 'weather-pouring'],
  65: ['大雨', 'weather-pouring'],
  71: ['小雪', 'weather-snowy'],
  73: ['中雪', 'weather-snowy'],
  75: ['大雪', 'weather-snowy'],
  80: ['阵雨', 'weather-rainy'],
  81: ['中阵雨', 'weather-pouring'],
  82: ['大阵雨', 'weather-pouring'],
  85: ['小阵雪', 'weather-snowy'],
  86: ['大阵雪', 'weather-snowy'],
  95: ['雷暴', 'weather-lightning'],
  96: ['雷暴伴小冰雹', 'weather-lightning-rainy'],
  99: ['雷暴伴大冰雹', 'weather-hail'],
};

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
    cloud_cover: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    precipitation: number;
    pressure_msl: number;
    time: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

interface CacheEntry {
  latitude: number;
  longitude: number;
  province: string;
  city: string;
  locality: string;
  weatherData: WeatherData | null;
  fetchTime: number;
}

class WeatherManager {
  latitude: number | null = null;
  longitude: number | null = null;
  province = '-';
  city = '-';
  locality = '-';
  weatherData: WeatherData | null = null;
  fetchTime: number | null = null;

  private cacheKey = 'weatherInfo_v2';
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 min

  /** Save current state to cache */
  private async saveToCache(): Promise<void> {
    const data: CacheEntry = {
      latitude: this.latitude ?? 0,
      longitude: this.longitude ?? 0,
      province: this.province,
      city: this.city,
      locality: this.locality,
      weatherData: this.weatherData,
      fetchTime: this.fetchTime ?? 0,
    };
    await AsyncStorage.setItem(this.cacheKey, JSON.stringify(data));
  }

  /** Load from cache */
  async loadFromCache(): Promise<boolean> {
    try {
      const raw = await AsyncStorage.getItem(this.cacheKey);
      if (!raw) return false;
      const cached = JSON.parse(raw) as CacheEntry;
      this.latitude = cached.latitude || null;
      this.longitude = cached.longitude || null;
      this.province = cached.province || '-';
      this.city = cached.city || '-';
      this.locality = cached.locality || '-';
      this.weatherData = cached.weatherData ?? null;
      this.fetchTime = cached.fetchTime || null;
      runtimeLogger.info('WeatherManager', '从缓存加载天气数据');
      return true;
    } catch {
      return false;
    }
  }

  isCacheValid(): boolean {
    if (!this.fetchTime) return false;
    return Date.now() - this.fetchTime < this.CACHE_TTL;
  }

  static getWeatherInfo(code: number): { description: string; icon: string } {
    const entry = WMO_CODE_MAP[code];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return entry ? { description: entry[0], icon: entry[1] } : { description: '未知', icon: 'weather-cloudy-alert' };
  }

  getCurrentWeather() {
    if (!this.weatherData?.current) return null;
    const c = this.weatherData.current;
    const info = WeatherManager.getWeatherInfo(c.weather_code);
    return {
      temperature: c.temperature_2m,
      humidity: c.relative_humidity_2m,
      weatherCode: c.weather_code,
      weatherDescription: info.description,
      weatherIcon: info.icon,
      windSpeed: c.wind_speed_10m,
      precipitation: c.precipitation,
      time: c.time,
    };
  }

  getCurrentArea() {
    return { city: this.city, locality: this.locality, province: this.province };
  }

  get24HourForecast() {
     
    if (!this.weatherData?.hourly) return [];
    const { time, temperature_2m, weather_code } = this.weatherData.hourly;
    if (!time.length) return [];
    const now = new Date();
    let start = 0;
    for (let i = 0; i < time.length; i++) {
      if (new Date(time[i]) >= now) { start = i; break; }
    }
    const result: Array<{ time: string; temperature: number; weatherDescription: string; weatherIcon: string }> = [];
    for (let i = start; i < Math.min(start + 24, time.length); i++) {
      const info = WeatherManager.getWeatherInfo(weather_code[i]);
      result.push({ time: time[i], temperature: temperature_2m[i], weatherDescription: info.description, weatherIcon: info.icon });
    }
    return result;
  }

  getDailyForecast() {
     
    if (!this.weatherData?.daily) return [];
    const { time, weather_code, temperature_2m_max, temperature_2m_min } = this.weatherData.daily;
    if (!time.length) return [];
    return time.map((_, i) => {
      const info = WeatherManager.getWeatherInfo(weather_code[i]);
      return { time: time[i], weatherDescription: info.description, weatherIcon: info.icon, tempMax: temperature_2m_max[i], tempMin: temperature_2m_min[i] };
    });
  }

  /** Try GPS, fallback to IP geolocation */
  private async getLocation(): Promise<{ latitude: number; longitude: number }> {
    // Try GPS first
    try {
      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === Location.PermissionStatus.GRANTED) {
        const loc = await Location.getCurrentPositionAsync({});
        runtimeLogger.info('WeatherManager', `GPS定位成功: ${loc.coords.latitude}, ${loc.coords.longitude}`);
        return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      }
    } catch { /* GPS not available */ }

    // Fallback: IP geolocation via ipapi.co
    try {
      runtimeLogger.info('WeatherManager', 'GPS不可用，使用IP定位...');
      const resp = await fetch('https://ipapi.co/json/', {
        headers: { Referer: 'https://ipapi.co', Origin: 'https://ipapi.co' },
      });
      const data = (await resp.json()) as Record<string, unknown>;
      if (data.error) throw new Error(String(data.reason ?? data.message));
      const lat = data.latitude as number;
      const lon = data.longitude as number;
      if (typeof lat !== 'number' || typeof lon !== 'number') throw new Error('IP定位返回无效坐标');
      runtimeLogger.info('WeatherManager', `IP定位成功: ${lat}, ${lon}`);
      return { latitude: lat, longitude: lon };
    } catch (e) {
      runtimeLogger.error('WeatherManager', 'IP定位失败', e);
      // Ultimate fallback: Wuhan
      runtimeLogger.warn('WeatherManager', '使用默认坐标: 武汉');
      return { latitude: 30.48, longitude: 114.41 };
    }
  }

  /** Reverse geocode coordinates to area info */
  private async getArea(lat: number, lon: number): Promise<{ province: string; city: string; locality: string }> {
    try {
      const resp = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${String(lat)}&longitude=${String(lon)}&localityLanguage=zh-Hans`,
      );
      const data = (await resp.json()) as Record<string, string>;
      return {
        province: data.principalSubdivision || '-',
        city: data.city || '-',
        locality: data.locality || '-',
      };
    } catch {
      return { province: '-', city: '-', locality: '-' };
    }
  }

  /** Fetch weather from Open-Meteo */
  private async getWeather(lat: number, lon: number): Promise<WeatherData> {
    const params = new URLSearchParams({
      latitude: String(lat), longitude: String(lon),
      current: 'temperature_2m,relative_humidity_2m,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,precipitation,pressure_msl',
      hourly: 'precipitation_probability,weather_code,temperature_2m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min',
      timezone: 'Asia/Shanghai', past_days: '1',
    });
    const resp = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!resp.ok) throw new Error(`Weather API HTTP ${String(resp.status)}`);
    const data = await resp.json() as WeatherData;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!data || typeof data !== 'object') throw new Error('天气数据格式异常');
    return data;
  }

  /** Initialize / refresh weather data */
  async init(forceRefresh = false) {
    if (!forceRefresh) {
      await this.loadFromCache();
      if (this.isCacheValid()) return this.getCurrentWeather();
    }

    // Get location (GPS → IP → default)
    const loc = await this.getLocation();
    this.latitude = loc.latitude;
    this.longitude = loc.longitude;

    // Fetch area and weather in parallel
    const [area, weather] = await Promise.allSettled([
      this.getArea(loc.latitude, loc.longitude),
      this.getWeather(loc.latitude, loc.longitude),
    ]);

    if (area.status === 'fulfilled') {
      this.province = area.value.province;
      this.city = area.value.city;
      this.locality = area.value.locality;
    }

    if (weather.status === 'fulfilled') {
      this.weatherData = weather.value;
      this.fetchTime = Date.now();
    } else if (!this.weatherData) {
      throw new Error('天气数据获取失败，且无缓存可用');
    }

    await this.saveToCache();
    return this.getCurrentWeather();
  }

  async update() { return this.init(true); }
}

export const weatherManager = new WeatherManager();
void weatherManager.loadFromCache();

/** Convenience export for getting weather icon from code */
export function getWeatherInfo(code: number): { description: string; icon: string } {
  return WeatherManager.getWeatherInfo(code);
}
