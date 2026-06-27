import AsyncStorage from "@react-native-async-storage/async-storage";
import { runtimeLogger } from "@/utils/runtimeLogger";

// WMO weather code → [description, icon]
const WMO_CODE_MAP: Record<number, [string, string]> = {
  0: ["晴天", "weather-sunny"],
  1: ["大部晴朗", "weather-sunny"],
  2: ["多云", "weather-partly-cloudy"],
  3: ["阴天", "weather-cloudy"],
  45: ["有雾", "weather-fog"],
  48: ["有雾凇", "weather-fog"],
  51: ["小毛毛雨", "weather-rainy"],
  53: ["毛毛雨", "weather-rainy"],
  55: ["大毛毛雨", "weather-rainy"],
  61: ["小雨", "weather-rainy"],
  63: ["中雨", "weather-pouring"],
  65: ["大雨", "weather-pouring"],
  71: ["小雪", "weather-snowy"],
  73: ["中雪", "weather-snowy"],
  75: ["大雪", "weather-snowy"],
  80: ["阵雨", "weather-rainy"],
  81: ["中阵雨", "weather-pouring"],
  82: ["大阵雨", "weather-pouring"],
  85: ["小阵雪", "weather-snowy"],
  86: ["大阵雪", "weather-snowy"],
  95: ["雷暴", "weather-lightning"],
  96: ["雷暴伴小冰雹", "weather-lightning-rainy"],
  99: ["雷暴伴大冰雹", "weather-hail"],
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
  province = "-";
  city = "-";
  locality = "-";
  weatherData: WeatherData | null = null;
  fetchTime: number | null = null;
  locationSource: "ip" | "default" = "default";

  private cacheKey = "weatherInfo_v3";
  private readonly CACHE_TTL = 30 * 60 * 1000;

  private async saveToCache(): Promise<void> {
    try {
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
    } catch {}
  }

  async loadFromCache(): Promise<boolean> {
    try {
      const raw = await AsyncStorage.getItem(this.cacheKey);
      if (!raw) return false;
      const cached = JSON.parse(raw) as CacheEntry;
      this.latitude = cached.latitude || null;
      this.longitude = cached.longitude || null;
      this.province = cached.province || "-";
      this.city = cached.city || "-";
      this.locality = cached.locality || "-";
      this.weatherData = cached.weatherData ?? null;
      this.fetchTime = cached.fetchTime || null;
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
    return entry
      ? { description: entry[0], icon: entry[1] }
      : { description: "未知", icon: "weather-cloudy-alert" };
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
    const result: Array<{
      time: string;
      temperature: number;
      weatherDescription: string;
      weatherIcon: string;
    }> = [];
    for (let i = start; i < Math.min(start + 24, time.length); i++) {
      const info = WeatherManager.getWeatherInfo(weather_code[i]);
      result.push({
        time: time[i],
        temperature: temperature_2m[i],
        weatherDescription: info.description,
        weatherIcon: info.icon,
      });
    }
    return result;
  }

  getDailyForecast() {
    if (!this.weatherData?.daily) return [];
    const { time, weather_code, temperature_2m_max, temperature_2m_min } =
      this.weatherData.daily;
    if (!time.length) return [];
    return time.map((_, i) => {
      const info = WeatherManager.getWeatherInfo(weather_code[i]);
      return {
        time: time[i],
        weatherDescription: info.description,
        weatherIcon: info.icon,
        tempMax: temperature_2m_max[i],
        tempMin: temperature_2m_min[i],
      };
    });
  }

  /** IP geolocation */
  private async getLocationByIP(): Promise<{ latitude: number; longitude: number }> {
    // ipwhois — free, no key, returns JSON
    const resp = await fetch("https://ipwho.is/");
    const text = await resp.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error("IP定位返回非JSON: " + text.slice(0, 100));
    }
    if (!data.success) {
      throw new Error("IP定位API失败: " + String(data.message ?? ""));
    }
    const lat = data.latitude as number;
    const lon = data.longitude as number;
    if (typeof lat !== "number" || typeof lon !== "number") {
      throw new Error("IP定位无有效坐标");
    }
    return { latitude: lat, longitude: lon };
  }

  /** Reverse geocode */
  private async getArea(lat: number, lon: number): Promise<{
    province: string;
    city: string;
    locality: string;
  }> {
    const url =
      "https://api.bigdatacloud.net/data/reverse-geocode-client" +
      "?latitude=" + String(lat) +
      "&longitude=" + String(lon) +
      "&localityLanguage=zh-Hans";
    const resp = await fetch(url);
    const text = await resp.text();
    let data: Record<string, string>;
    try {
      data = JSON.parse(text) as Record<string, string>;
    } catch {
      return { province: "-", city: "-", locality: "-" };
    }
    return {
      province: data.principalSubdivision || "-",
      city: data.city || "-",
      locality: data.locality || "-",
    };
  }

  /** Fetch weather from Open-Meteo */
  private async getWeather(lat: number, lon: number): Promise<WeatherData> {
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + String(lat) +
      "&longitude=" + String(lon) +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
      "&hourly=precipitation_probability,weather_code,temperature_2m" +
      "&current=temperature_2m,relative_humidity_2m,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,precipitation,pressure_msl" +
      "&timezone=Asia/Shanghai&past_days=1";
    const resp = await fetch(url);
    const text = await resp.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error("天气API返回非JSON: " + text.slice(0, 100));
    }
    if (data.error) {
      throw new Error("天气API错误: " + String(data.reason ?? ""));
    }
    return data as WeatherData;
  }

  async init(forceRefresh = false) {
    // Check cache
    if (!forceRefresh) {
      await this.loadFromCache();
      if (this.isCacheValid()) {
        runtimeLogger.info("Weather", "缓存有效，跳过请求");
        return this.getCurrentWeather();
      }
    }

    runtimeLogger.info("Weather", "开始获取定位...");
    let lat: number;
    let lon: number;

    // IP geolocation
    try {
      const loc = await this.getLocationByIP();
      lat = loc.latitude;
      lon = loc.longitude;
      this.latitude = lat;
      this.longitude = lon;
      this.locationSource = "ip";
      runtimeLogger.info("Weather", "IP定位成功: " + String(lat) + ", " + String(lon));
    } catch (e) {
      runtimeLogger.warn("Weather", "IP定位失败，使用默认坐标", e);
      lat = 30.48;
      lon = 114.41;
      this.latitude = lat;
      this.longitude = lon;
      this.locationSource = "default";
    }

    // Area
    try {
      const area = await this.getArea(lat, lon);
      this.province = area.province;
      this.city = area.city;
      this.locality = area.locality;
      runtimeLogger.info("Weather", "区域解析成功: " + area.province + " " + area.city);
    } catch (e) {
      runtimeLogger.warn("Weather", "区域解析失败", e);
    }

    // Weather
    try {
      this.weatherData = await this.getWeather(lat, lon);
      this.fetchTime = Date.now();
      runtimeLogger.info("Weather", "天气数据获取成功");
    } catch (e) {
      runtimeLogger.error("Weather", "天气数据获取失败", e);
      if (!this.weatherData) {
        throw new Error("天气数据获取失败，且无缓存可用");
      }
    }

    await this.saveToCache();
    return this.getCurrentWeather();
  }

  async update() {
    return this.init(true);
  }
}

export const weatherManager = new WeatherManager();
void weatherManager.loadFromCache();

export function getWeatherInfo(code: number): { description: string; icon: string } {
  return WeatherManager.getWeatherInfo(code);
}
