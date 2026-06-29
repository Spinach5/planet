# Phase 2: Service Layer Cache Optimization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate repeated cache boilerplate across 15+ service files by introducing `withCache` HOF and enhancing `CacheManager`.

**Architecture:** A `withCache` higher-order-function wraps any async fetch function, automatically handling cache read/write/invalidate. `CacheManager` gets 7 new utility methods. Existing service functions are refactored to use `withCache`, reducing ~10 lines of cache boilerplate per function to ~2 lines.

**Tech Stack:** TypeScript, AsyncStorage, existing CacheManager pattern.

## Global Constraints

- Import alias: `@/*` → `./src/*`
- TypeScript strict mode
- Do NOT change function signatures or behavior — same inputs, same outputs
- `withCache` must handle the `forceRefresh` parameter pattern used across all services
- Cache keys and TTLs must remain identical to current values
- Write operations must call `.invalidate()` to clear corresponding cache
- Fire-and-forget cache writes (`void cacheManager.setAsync(...)`)

---

### Task 1: Enhance CacheManager with new methods

**Files:**
- Modify: `src/utils/cache.ts`

**Interfaces:**
- Produces: `removeByPrefix`, `has`, `getRemainingTime`, `mset`, `mget`, `keys`, `cleanExpired`

- [ ] **Step 1: Add new methods to CacheManager**

Add these methods to the `CacheManager` class in `src/utils/cache.ts`:

```typescript
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
    const pairs: [string, string][] = entries.map((e) => [
      this.getKey(e.key),
      JSON.stringify({
        data: e.value,
        timestamp: Date.now(),
        expireTime: e.expireTime ?? null,
      } as CacheData),
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
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | grep "cache.ts"`
Expected: no errors from cache.ts

- [ ] **Step 3: Commit**

```bash
git add src/utils/cache.ts
git commit -m "feat: enhance CacheManager with removeByPrefix, has, getRemainingTime, mset, mget, keys, cleanExpired"
```

---

### Task 2: Create withCache HOF

**Files:**
- Create: `src/service/utils/withCache.ts`

**Interfaces:**
- Produces: `withCache<T>(fn, options): T & { invalidate }`

- [ ] **Step 1: Create the service/utils directory**

```bash
mkdir -p src/service/utils
```

- [ ] **Step 2: Create `src/service/utils/withCache.ts`**

```typescript
import cacheManager from '@/utils/cache';

interface WithCacheOptions<T> {
  /** Cache key prefix */
  cacheKey: string;
  /** TTL in ms (default: 5 minutes) */
  ttl?: number;
  /** Build cache key suffix from arguments */
  keyBuilder?: (args: unknown[]) => string;
  /** Index of the forceRefresh boolean parameter (default: last) */
  forceRefreshArgIndex?: number;
  /** Only cache if this returns true */
  resultValidator?: (result: T) => boolean;
}

/**
 * Higher-order function that wraps an async function with caching.
 *
 * Convention: the wrapped function's last parameter (or forceRefreshArgIndex)
 * is a boolean `forceRefresh`. When true, cache is bypassed.
 * Cache write is fire-and-forget (does not block the return).
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: WithCacheOptions<Awaited<ReturnType<T>>>,
): T & { invalidate: (keySuffix?: string) => Promise<void> } {
  const {
    cacheKey,
    ttl = 5 * 60 * 1000,
    keyBuilder,
    forceRefreshArgIndex = -1,
    resultValidator,
  } = options;

  const getFullKey = (args: unknown[]): string => {
    if (keyBuilder) {
      return `${cacheKey}_${keyBuilder(args)}`;
    }
    return cacheKey;
  };

  const getForceRefresh = (args: unknown[]): boolean => {
    const idx = forceRefreshArgIndex < 0 ? args.length + forceRefreshArgIndex : forceRefreshArgIndex;
    return args[idx] === true;
  };

  const wrapped = async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const fullKey = getFullKey(args);
    const forceRefresh = getForceRefresh(args);

    // Read from cache
    if (!forceRefresh) {
      const cached = await cacheManager.getAsync<Awaited<ReturnType<T>>>(fullKey);
      if (cached !== null) {
        if (!resultValidator || resultValidator(cached)) {
          return cached;
        }
      }
    }

    // Fetch fresh data
    const result = await fn(...args);

    // Write to cache (fire-and-forget)
    if (!resultValidator || resultValidator(result)) {
      void cacheManager.setAsync(fullKey, result, ttl);
    }

    return result;
  };

  const invalidate = async (keySuffix?: string): Promise<void> => {
    if (keySuffix) {
      await cacheManager.removeAsync(`${cacheKey}_${keySuffix}`);
    } else {
      await cacheManager.removeByPrefix(cacheKey);
    }
  };

  // Attach invalidate to the wrapped function
  const result = wrapped as T & { invalidate: (keySuffix?: string) => Promise<void> };
  result.invalidate = invalidate;

  return result;
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | grep "withCache"`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/service/utils/withCache.ts
git commit -m "feat: add withCache HOF for automatic cache management"
```

---

### Task 3: Create service/utils barrel export

**Files:**
- Create: `src/service/utils/index.ts`

- [ ] **Step 1: Create `src/service/utils/index.ts`**

```typescript
export { withCache } from './withCache';
```

- [ ] **Step 2: Commit**

```bash
git add src/service/utils/index.ts
git commit -m "feat: add service/utils barrel export"
```

---

### Task 4: Refactor books.ts to use withCache

**Files:**
- Modify: `src/service/server/books.ts`

**Interfaces:**
- No external interface changes — same exported functions

- [ ] **Step 1: Refactor books.ts**

Replace the cache boilerplate in `getBookList` and `getBookCategories` with `withCache`.

Current pattern:
```typescript
export async function getBookList(forceRefresh = false): Promise<...> {
  if (!forceRefresh) {
    const cached = await cacheManager.getAsync<...>(CACHE_KEY_BOOKS);
    if (cached?.books) return cached;
  }
  // ... fetch logic ...
  void cacheManager.setAsync(CACHE_KEY_BOOKS, data, CACHE_TTL);
  return data;
}
```

New pattern:
```typescript
export const getBookList = withCache(
  async (): Promise<{ books: BookItem[]; total: number }> => {
    // ... fetch logic (same as before) ...
    return { books, total: books.length };
  },
  { cacheKey: 'v1_books', ttl: 5 * 60 * 1000 }
);
```

For write operations (createBook, updateBook, deleteBook), add `void getBookList.invalidate();` after success.

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | grep "books.ts"`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/service/server/books.ts
git commit -m "refactor: use withCache in books.ts"
```

---

### Task 5: Refactor clubs.ts to use withCache

**Files:**
- Modify: `src/service/server/clubs.ts`

- [ ] **Step 1: Refactor clubs.ts**

`getAllClub` fetches two endpoints and caches both. This is a special case — `withCache` wraps single-function caching. For `getAllClub`, keep the manual pattern but use `removeByPrefix` for invalidation, OR wrap the inner logic.

Best approach: wrap the combined fetch as a single `withCache` call, caching the combined `{ clubs, categories }` result.

- [ ] **Step 2: Verify TypeScript**
- [ ] **Step 3: Commit**

```bash
git add src/service/server/clubs.ts
git commit -m "refactor: use withCache in clubs.ts"
```

---

### Task 6: Refactor hubt/Banner.ts to use withCache

**Files:**
- Modify: `src/service/hubt/Banner.ts`

- [ ] **Step 1: Refactor Banner.ts**

Note: `getBanner` has a fallback-on-error pattern (returns cached on network failure). The `withCache` HOF doesn't handle this — keep the try/catch but use `withCache` for the happy path, OR keep manual caching for this file since it has custom error handling.

Best approach: keep manual caching for Banner since it has custom fallback logic that `withCache` doesn't model.

- [ ] **Step 2: Commit** (if changed)

---

### Task 7: Refactor hubt/CurrentWeek.ts to use withCache

**Files:**
- Modify: `src/service/hubt/CurrentWeek.ts`

Note: `getCurrentWeek` does NOT take a `forceRefresh` parameter — it always checks cache first. `withCache` expects a `forceRefresh` param. We can still use it by wrapping with `forceRefreshArgIndex: -1` and just not passing the arg.

Actually, looking more carefully: `getCurrentWeek` has no `forceRefresh` param at all. The `withCache` HOF's `getForceRefresh` will look at the last arg and find `undefined`, which is falsy — so it will always check cache. This is correct behavior.

But the issue is `getCurrentWeek` normalizes the cached value with `Number(cached)`. The `withCache` HOF doesn't do this. We'd need to keep the manual pattern or add a `resultTransformer` option.

Best approach: keep manual caching for `getCurrentWeek` since it has custom value normalization.

---

### Task 8: Refactor hubt/Scores.ts to use withCache

**Files:**
- Modify: `src/service/hubt/Scores.ts`

- [ ] **Step 1: Refactor Scores.ts**

```typescript
export const getScores = withCache(
  async (): Promise<ScoresData> => {
    // ... fetch logic ...
    return result;
  },
  { cacheKey: 'ScoresData', ttl: 60 * 60 * 1000 }
);
```

- [ ] **Step 2: Verify TypeScript**
- [ ] **Step 3: Commit**

---

### Task 9: Refactor hubt/CurrentSemester.ts to use withCache

**Files:**
- Modify: `src/service/hubt/CurrentSemester.ts`

Note: `getCurrentSemester` has no `forceRefresh` param. `getSemesterList` also has no `forceRefresh`. Both always check cache first. Use `withCache` with no `forceRefresh` handling.

- [ ] **Step 1: Refactor CurrentSemester.ts**
- [ ] **Step 2: Verify TypeScript**
- [ ] **Step 3: Commit**

---

### Task 10: Refactor hubt/ExamInfo.ts to use withCache

**Files:**
- Modify: `src/service/hubt/ExamInfo.ts`

Note: `getExamInfo(semester, forceRefresh)` — the cache key is dynamic (`CACHE_KEY_PREFIX + semester`). Use `keyBuilder`.

```typescript
export const getExamInfo = withCache(
  async (semester: string): Promise<ExamResult> => {
    // ... fetch logic ...
  },
  { cacheKey: 'ExamInfoData', ttl: 30 * 60 * 1000, keyBuilder: (args) => args[0] as string }
);
```

- [ ] **Step 1: Refactor ExamInfo.ts**
- [ ] **Step 2: Verify TypeScript**
- [ ] **Step 3: Commit**

---

### Task 11: Refactor hubt/StuInfo.ts to use withCache

**Files:**
- Modify: `src/service/hubt/StuInfo.ts`

Note: `getStuInfo` has no `forceRefresh` param.

- [ ] **Step 1: Refactor StuInfo.ts**
- [ ] **Step 2: Verify TypeScript**
- [ ] **Step 3: Commit**

---

### Task 12: Refactor hubt/ExtroInfo.ts to use withCache

**Files:**
- Modify: `src/service/hubt/ExtroInfo.ts`

Note: `getExtroInfo(semester, forceRefresh)` — dynamic cache key.

- [ ] **Step 1: Refactor ExtroInfo.ts**
- [ ] **Step 2: Verify TypeScript**
- [ ] **Step 3: Commit**

---

### Task 13: Refactor hubt/AllSchedule.ts to use withCache

**Files:**
- Modify: `src/service/hubt/AllSchedule.ts`

Note: Complex signature — `getAllSchedule(forceRefreshOrSemester?, semester?)`. Dynamic cache key based on semester. The `withCache` HOF needs `keyBuilder` to extract the semester.

This is a tricky case — the first param can be boolean OR string. Best approach: refactor the internal logic to have a clean `fetchFn(semester)` and wrap that with `withCache`.

- [ ] **Step 1: Refactor AllSchedule.ts**
- [ ] **Step 2: Verify TypeScript**
- [ ] **Step 3: Commit**

---

### Task 14: Refactor hubt/GetAllWeek.ts to use withCache

**Files:**
- Modify: `src/service/hubt/GetAllWeek.ts`

Note: Complex — two different code paths based on whether semester is provided. Dynamic cache key. Keep manual caching for this file since the branching logic doesn't fit `withCache` cleanly.

---

### Task 15: Final verification

- [ ] TypeScript check
- [ ] Lint
- [ ] Build verification
- [ ] Verify all cache keys/TTLs unchanged
