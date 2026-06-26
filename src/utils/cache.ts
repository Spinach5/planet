import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheData {
  data: unknown;
  timestamp: number;
  expireTime: number | null;
}

class CacheManager {
  private prefix: string;

  constructor(prefix = '') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  // Synchronous get is NOT available in AsyncStorage.
  // Kept for API compatibility only; always returns null.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  get<T>(_key: string): T | null {
    console.warn('[CacheManager] Use getAsync() instead of sync get() in React Native');
    return null;
  }

  async setAsync(key: string, value: unknown, expireTime: number | null = null): Promise<boolean> {
    try {
      const cacheData: CacheData = {
        data: value,
        timestamp: Date.now(),
        expireTime,
      };
      await AsyncStorage.setItem(this.getKey(key), JSON.stringify(cacheData));
      return true;
    } catch (_error) {
      console.error('异步设置缓存失败:', _error);
      return false;
    }
  }

  async getAsync<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(this.getKey(key));
      if (!raw) return null;

      const cacheData = JSON.parse(raw) as CacheData;

      if (cacheData.expireTime) {
        const now = Date.now();
        if (now - cacheData.timestamp > cacheData.expireTime) {
          await this.removeAsync(key);
          return null;
        }
      }

      return cacheData.data as T;
    } catch (_error) {
      console.error('异步获取缓存失败:', _error);
      return null;
    }
  }

  async removeAsync(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.getKey(key));
      return true;
    } catch (_error) {
      console.error('删除缓存失败:', _error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (_error) {
      console.error('清空缓存失败:', _error);
      return false;
    }
  }
}

export default new CacheManager();
