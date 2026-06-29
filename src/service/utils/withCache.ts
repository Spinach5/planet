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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
