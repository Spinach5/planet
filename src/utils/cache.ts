// In React Native, there's no `window` — use `global` check instead.
// In SSR (Node.js), AsyncStorage isn't available.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _AsyncStorage: any = null;

try {
  // React Native uses `global`, Web uses `window`. Check both.
  if (typeof global !== 'undefined' || typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    _AsyncStorage = require('@react-native-async-storage/async-storage').default;
  }
} catch { /* SSR or module not available */ }

function getStorage() {
  return _AsyncStorage as {
    setItem: (key: string, value: string) => Promise<void>;
    getItem: (key: string) => Promise<string | null>;
    removeItem: (key: string) => Promise<void>;
    clear: () => Promise<void>;
    getAllKeys: () => Promise<string[]>;
    multiRemove: (keys: string[]) => Promise<void>;
    multiSet: (keyValuePairs: Array<[string, string]>) => Promise<void>;
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

  /** Get all cache keys (with prefix applied) */
  async keys(): Promise<string[]> {
    const storage = getStorage();
    if (!storage) return [];
    try {
      const allKeys = await storage.getAllKeys();
      return allKeys.filter((k) => k.startsWith(this.prefix));
    } catch {
      return [];
    }
  }

  /** Check if a cached value exists and is not expired */
  async has(key: string): Promise<boolean> {
    const value = await this.getAsync(key);
    return value !== null;
  }

  /** Get remaining TTL in ms. Returns -1 if not found, Infinity if no expiry */
  async getRemainingTime(key: string): Promise<number> {
    const storage = getStorage();
    if (!storage) return -1;
    try {
      const raw = await storage.getItem(this.getKey(key));
      if (!raw) return -1;
      const cacheData = JSON.parse(raw) as CacheData;
      if (!cacheData.expireTime) return Infinity;
      const elapsed = Date.now() - cacheData.timestamp;
      const remaining = cacheData.expireTime - elapsed;
      return remaining > 0 ? remaining : -1;
    } catch {
      return -1;
    }
  }

  /** Remove all cached entries whose key starts with the given prefix */
  async removeByPrefix(prefix: string): Promise<boolean> {
    const storage = getStorage();
    if (!storage) return false;
    try {
      const allKeys = await storage.getAllKeys();
      const fullPrefix = this.getKey(prefix);
      const keysToRemove = allKeys.filter((k) => k.startsWith(fullPrefix));
      if (keysToRemove.length > 0) {
        await storage.multiRemove(keysToRemove);
      }
      return true;
    } catch {
      return false;
    }
  }

  /** Batch set multiple cache entries */
  async mset(entries: Array<{ key: string; value: unknown; expireTime?: number }>): Promise<boolean> {
    const storage = getStorage();
    if (!storage) return false;
    try {
      const pairs: Array<[string, string]> = entries.map((e) => [
        this.getKey(e.key),
        JSON.stringify({
          data: e.value,
          timestamp: Date.now(),
          expireTime: e.expireTime ?? null,
        }),
      ]);
      await storage.multiSet(pairs);
      return true;
    } catch {
      return false;
    }
  }

  /** Batch get multiple cache entries */
  async mget<T = unknown>(keys: string[]): Promise<Array<T | null>> {
    const results: Array<T | null> = [];
    for (const key of keys) {
      results.push(await this.getAsync<T>(key));
    }
    return results;
  }

  /** Remove all expired cache entries. Returns count of removed entries. */
  async cleanExpired(): Promise<number> {
    const storage = getStorage();
    if (!storage) return 0;
    try {
      const allKeys = await storage.getAllKeys();
      const prefixedKeys = allKeys.filter((k) => k.startsWith(this.prefix));
      let removed = 0;
      for (const fullKey of prefixedKeys) {
        const raw = await storage.getItem(fullKey);
        if (!raw) continue;
        try {
          const cacheData = JSON.parse(raw) as CacheData;
          if (cacheData.expireTime) {
            const elapsed = Date.now() - cacheData.timestamp;
            if (elapsed > cacheData.expireTime) {
              await storage.removeItem(fullKey);
              removed++;
            }
          }
        } catch {
          // invalid JSON, skip
        }
      }
      return removed;
    } catch {
      return 0;
    }
  }
}

export default new CacheManager();
