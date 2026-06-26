import AsyncStorage from '@react-native-async-storage/async-storage';

/** Base64 decode implementation (no atob in Hermes) */
function base64Decode(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  str = str.replace(/[^A-Za-z0-9+/=]/g, '');
  while (i < str.length) {
    const a = chars.indexOf(str.charAt(i++));
    const b = chars.indexOf(str.charAt(i++));
    const c = chars.indexOf(str.charAt(i++));
    const d = chars.indexOf(str.charAt(i++));
    output += String.fromCharCode((a << 2) | (b >> 4));
    if (c !== 64) output += String.fromCharCode(((b & 15) << 4) | (c >> 2));
    if (d !== 64) output += String.fromCharCode(((c & 3) << 6) | d);
  }
  return output;
}

interface UserData {
  university: string;
  realName: string;
  stuId: string;
  encryptedPassword: string;
  xhid: string;
  grade: string;
  majority: string;
  class: string;
  college: string;
  schoolId: string;
  serverToken: string;
  isLoggedIn: boolean;
}

interface UserValues {
  university: string;
  realName: string;
  stuId: string;
  grade: string;
  majority: string;
  college: string;
  class: string;
  schoolId: string;
  isLoggedIn: boolean;
}

class UserManager {
  university = '?';
  realName = '帅哥';
  stuId = '';
  password = '';
  encryptedPassword = '';
  xhid = '';
  grade = '0';
  majority = '';
  class = '?';
  college = '?';
  schoolId = '';
  serverToken = '';
  isLoggedIn = false;

  private cacheKey = 'userInfo';
  private syncCache: UserValues | null = null;

  /** Save user data to AsyncStorage (excluding password) */
  async saveToCache(): Promise<void> {
    const userData: UserData = {
      university: this.university,
      realName: this.realName,
      stuId: this.stuId,
      encryptedPassword: this.encryptedPassword,
      xhid: this.xhid,
      grade: this.grade,
      majority: this.majority,
      class: this.class,
      college: this.college,
      schoolId: this.schoolId,
      serverToken: this.serverToken,
      isLoggedIn: this.isLoggedIn,
    };
    await AsyncStorage.setItem(this.cacheKey, JSON.stringify(userData));
  }

  /** Sync save (fire-and-forget) */
  saveToCacheSync(): void {
    this.saveToCache().catch((e: unknown) => {
      console.error('UserManager saveToCache failed:', e);
    });
  }

  /** Get cached user data */
  async getFromCache(): Promise<UserData | null> {
    try {
      const raw = await AsyncStorage.getItem(this.cacheKey);
      if (raw) {
        return JSON.parse(raw) as UserData;
      }
    } catch {
      // ignore
    }
    return null;
  }

  /** Load from cache and apply to instance */
  async loadFromCache(): Promise<boolean> {
    const cached = await this.getFromCache();
    if (cached?.isLoggedIn) {
      this.applyValues(cached);
      this.syncCache = this.getValues();
      this.isLoggedIn = true;
      return true;
    }
    return false;
  }

  /** Apply cached values to instance properties */
  private applyValues(values: Partial<UserData>): void {
    if (values.university !== undefined) this.university = values.university;
    if (values.realName !== undefined) this.realName = values.realName;
    if (values.stuId !== undefined) this.stuId = values.stuId;
    if (values.encryptedPassword !== undefined) this.encryptedPassword = values.encryptedPassword;
    if (values.xhid !== undefined) this.xhid = values.xhid;
    if (values.grade !== undefined) this.grade = values.grade;
    if (values.majority !== undefined) this.majority = values.majority;
    if (values.class !== undefined) this.class = values.class;
    if (values.college !== undefined) this.college = values.college;
    if (values.schoolId !== undefined) this.schoolId = values.schoolId;
    if (values.serverToken !== undefined) this.serverToken = values.serverToken;
    if (values.isLoggedIn !== undefined) this.isLoggedIn = values.isLoggedIn;
  }

  /** Get current values snapshot */
  getValues(): UserValues {
    return {
      university: this.university,
      realName: this.realName,
      stuId: this.stuId,
      grade: this.grade,
      majority: this.majority,
      college: this.college,
      class: this.class,
      schoolId: this.schoolId,
      isLoggedIn: this.isLoggedIn,
    };
  }

  getUserInfoSync(): UserValues {
    if (this.syncCache) return this.syncCache;
    this.syncCache = this.getValues();
    return this.syncCache;
  }

  getServerToken(): string { return this.serverToken; }
  setServerToken(token: string): void {
    this.serverToken = token;
    this.saveToCacheSync();
    this.syncCache = this.getValues();
  }

  /** Decode JWT to get user ID */
  getServerUserId(): number {
    try {
      if (!this.serverToken) return 0;
      const payload = this.serverToken.split('.')[1];
      const decoded = JSON.parse(base64Decode(payload)) as Record<string, unknown>;
      return (decoded.userId ?? decoded.user_id ?? decoded.id ?? 0) as number;
    } catch {
      return 0;
    }
  }

  getEncryptedPassword(): string { return this.encryptedPassword; }
  setEncryptedPassword(pwd: string): void {
    this.encryptedPassword = pwd;
    this.saveToCacheSync();
    this.syncCache = this.getValues();
  }

  getSchoolId(): string { return this.schoolId; }
  setSchoolId(id: string): void {
    this.schoolId = id;
    this.saveToCacheSync();
    this.syncCache = this.getValues();
  }

  setField(key: string, value: unknown): void {
    if (key in this) {
      (this as Record<string, unknown>)[key] = value;
      this.saveToCacheSync();
      this.syncCache = this.getValues();
    }
  }

  setFields(fields: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(fields)) {
      if (key in this) {
        (this as Record<string, unknown>)[key] = value;
      }
    }
    this.saveToCacheSync();
    this.syncCache = this.getValues();
  }

  checkLogin(): boolean { return this.isLoggedIn; }
  getUniversity(): string { return this.university; }
  getGrade(): string { return this.grade; }
  getAccount(): { stuId: string; password: string } {
    return { stuId: this.stuId, password: this.password };
  }

  /** Logout - clear all state */
  async logout(): Promise<void> {
    this.university = '';
    this.realName = '帅哥';
    this.stuId = '';
    this.grade = '0';
    this.majority = '';
    this.college = '';
    this.schoolId = '';
    this.serverToken = '';
    this.isLoggedIn = false;
    this.password = '';
    this.encryptedPassword = '';
    this.class = '';
    this.syncCache = null;

    await AsyncStorage.removeItem(this.cacheKey);
    await AsyncStorage.clear();
  }
}

export const userManager = new UserManager();

// Initialize on import
userManager.loadFromCache().catch((e: unknown) => {
  console.error('Failed to load user cache:', e);
});

export default userManager;
