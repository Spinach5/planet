// AsyncStorage requires window/global which doesn't exist during SSR
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _AsyncStorage: any = null;

try {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    _AsyncStorage = require('@react-native-async-storage/async-storage').default;
  }
} catch { /* SSR - no AsyncStorage */ }

function getStorage() {
  return _AsyncStorage as {
    setItem: (key: string, value: string) => Promise<void>;
    getItem: (key: string) => Promise<string | null>;
    removeItem: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  } | null;
}

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

  // Synchronous get is NOT available in storage.
  // Kept for API compatibility only; always returns null.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  get<T>(_key: string): T | null {
    return null;
  }

  async setAsync(key: string, value: unknown, expireTime: number | null = null): Promise<boolean> {
    const storage = getStorage();
    if (!storage) return false;
    try {
      const cacheData: CacheData = {
        data: value,
        timestamp: Date.now(),
        expireTime,
      };
      await storage.setItem(this.getKey(key), JSON.stringify(cacheData));
      return true;
    } catch {
      return false;
    }
  }

  async getAsync<T>(key: string): Promise<T | null> {
    const storage = getStorage();
    if (!storage) return null;
    try {
      const raw = await storage.getItem(this.getKey(key));
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
    } catch {
      return null;
    }
  }

  async removeAsync(key: string): Promise<boolean> {
    const storage = getStorage();
    if (!storage) return false;
    try {
      await storage.removeItem(this.getKey(key));
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<boolean> {
    const storage = getStorage();
    if (!storage) return false;
    try {
      await storage.clear();
      return true;
    } catch {
      return false;
    }
  }
}

export default new CacheManager();
