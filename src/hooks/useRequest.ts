import { useState, useCallback, useEffect, useRef } from 'react';

interface UseRequestOptions<T, Args extends unknown[]> {
  /** If true, the request is not triggered automatically (default: false) */
  manual?: boolean;
  /** Default parameters for auto-trigger */
  defaultParams?: Args;
  /** Initial data value */
  initialData?: T;
  /** Callback on success */
  onSuccess?: (data: T) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

interface UseRequestResult<T, Args extends unknown[]> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  run: (...args: Args) => Promise<T>;
  mutate: (data: T | ((prev: T | undefined) => T)) => void;
  reset: () => void;
}

/**
 * Hook for managing a single async request.
 * Handles loading state, error state, and data caching.
 *
 * @param requestFn - The async function to call
 * @param options - Configuration options
 * @returns Object with data, loading, error, run, mutate, reset
 */
export function useRequest<T, Args extends unknown[] = []>(
  requestFn: (...args: Args) => Promise<T>,
  options: UseRequestOptions<T, Args> = {},
): UseRequestResult<T, Args> {
  const { manual = false, defaultParams, initialData, onSuccess, onError } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(!manual);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const run = useCallback(
    async (...args: Args): Promise<T> => {
      setLoading(true);
      setError(null);
      try {
        const result = await requestFn(...args);
        if (mountedRef.current) {
          setData(result);
          setLoading(false);
          onSuccess?.(result);
        }
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (mountedRef.current) {
          setError(error);
          setLoading(false);
          onError?.(error);
        }
        throw error;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requestFn],
  );

  const mutate = useCallback((value: T | ((prev: T | undefined) => T)) => {
    if (typeof value === 'function') {
      setData((prev) => (value as (prev: T | undefined) => T)(prev));
    } else {
      setData(value);
    }
  }, []);

  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
  }, [initialData]);

  // Set mountedRef to false on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Auto-trigger on mount if not manual
  useEffect(() => {
    if (!manual) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void run(...((defaultParams ?? []) as Args));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, run, mutate, reset };
}
