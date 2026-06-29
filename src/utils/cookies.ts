import cacheManager from './cache';
import { parseCookiesToKeyValue, stringifyCookieObj } from './rex';

class CookiesManager {
  private prefix: string;
  private cacheKey: string;
  private cookies: Record<string, string>;
  private loaded = false;

  constructor(prefix = '') {
    this.prefix = prefix;
    this.cacheKey = `cookies_${prefix}`;
    this.cookies = {};
  }

  async init(): Promise<void> {
    if (this.loaded) return;
    await this.loadFromCache();
    this.loaded = true;
  }

  private async loadFromCache(): Promise<void> {
    const cached = await cacheManager.getAsync<Record<string, string>>(this.cacheKey);
    if (cached && typeof cached === 'object') {
      this.cookies = { ...cached };
    } else {
      this.cookies = {};
    }
  }

  private async saveToCache(): Promise<void> {
    await cacheManager.setAsync(this.cacheKey, { ...this.cookies }, null);
  }

  getAll(): Record<string, string> {
    return { ...this.cookies };
  }

  get(name: string): string | undefined {
    return Object.prototype.hasOwnProperty.call(this.cookies, name)
      ? this.cookies[name]
      : undefined;
  }

  async set(name: string, value: string): Promise<this> {
    this.cookies[name] = value;
    await this.saveToCache();
    return this;
  }

  async setAll(obj: Record<string, string>): Promise<this> {
    for (const [key, val] of Object.entries(obj)) {
      this.cookies[key] = val;
    }
    await this.saveToCache();
    return this;
  }

  async remove(name: string): Promise<this> {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this.cookies[name];
    await this.saveToCache();
    return this;
  }

  async clear(): Promise<this> {
    this.cookies = {};
    this.loaded = false;
    await this.saveToCache();
    return this;
  }

  async parseAndMerge(cookieStr: string): Promise<this> {
    const parsed = parseCookiesToKeyValue(cookieStr);
    await this.setAll(parsed);
    return this;
  }

  toString(): string {
    return stringifyCookieObj(this.cookies);
  }

  async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      await this.init();
    }
  }
}

export default CookiesManager;
