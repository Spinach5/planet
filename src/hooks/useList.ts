import { useState, useCallback, useRef, useEffect } from 'react';

type ListLoadingState = 'idle' | 'loading' | 'loading-more' | 'success' | 'error' | 'empty';

interface UseListOptions<T> {
  /** Items per page (default: 20) */
  defaultPageSize?: number;
  /** Whether to load immediately on mount (default: true) */
  immediate?: boolean;
  /** Key in response object that holds the list. Auto-detected if not set. */
  dataKey?: string;
  /** Callback on successful load */
  onSuccess?: (data: T[]) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

interface FetchParams {
  page: number;
  pageSize: number;
}

type FetchResult<T> = { list: T[]; total: number } | T[];

interface UseListResult<T> {
  data: T[];
  total: number;
  page: number;
  loading: ListLoadingState;
  error: Error | null;
  refreshing: boolean;
  load: (page?: number, force?: boolean) => Promise<void>;
  loadMore: () => void;
  refresh: () => Promise<void>;
  setData: (data: T[] | ((prev: T[]) => T[])) => void;
  reset: () => void;
}

/**
 * Hook for managing list data with pagination, pull-to-refresh, and load-more.
 *
 * @param fetchFn - Async function that fetches list data
 * @param options - Configuration options
 * @returns Object with list state and actions
 */
export function useList<T>(
  fetchFn: (params: FetchParams, forceRefresh?: boolean) => Promise<FetchResult<T>>,
  options: UseListOptions<T> = {},
): UseListResult<T> {
  const {
    defaultPageSize = 20,
    immediate = true,
    dataKey,
    onSuccess,
    onError,
  } = options;

  // eslint-disable-next-line react/hook-use-state
  const [data, setDataState] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState<ListLoadingState>(immediate ? 'loading' : 'idle');
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  const extractData = useCallback(
    (result: FetchResult<T>): { items: T[]; count: number } => {
      if (Array.isArray(result)) {
        return { items: result, count: result.length };
      }
      // Try dataKey first if provided, then common keys
      const obj = result as Record<string, unknown>;
      const items = (dataKey
        ? (obj[dataKey] as T[])
        : (obj.list ?? obj.data ?? obj.books ?? obj.items ?? [])) as T[];
      const count = (obj.total ?? obj.count ?? items.length) as number;
      return { items, count };
    },
    [dataKey],
  );

  const load = useCallback(
    async (targetPage = 1, forceRefresh = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;

      const isLoadingMore = targetPage > 1;
      if (mountedRef.current) {
        setLoading(isLoadingMore ? 'loading-more' : 'loading');
        setError(null);
      }

      try {
        const result = await fetchFn(
          { page: targetPage, pageSize: defaultPageSize },
          forceRefresh,
        );
        const { items, count } = extractData(result);

        if (mountedRef.current) {
          if (targetPage === 1) {
            setDataState(items);
          } else {
            setDataState((prev) => [...prev, ...items]);
          }
          setTotal(count);
          setPage(targetPage);
          setLoading(items.length === 0 && targetPage === 1 ? 'empty' : 'success');
        }
        onSuccess?.(items);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (mountedRef.current) {
          setError(error);
          setLoading('error');
        }
        onError?.(error);
      } finally {
        loadingRef.current = false;
      }
    },
    [fetchFn, defaultPageSize, extractData, onSuccess, onError],
  );

  const loadMore = useCallback(() => {
    if (loadingRef.current) return;
    if (data.length >= total) return;
    void load(page + 1);
  }, [data.length, total, page, load]);

  const refresh = useCallback(async () => {
    if (mountedRef.current) {
      setRefreshing(true);
    }
    try {
      await load(1, true);
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [load]);

  const setData = useCallback((value: T[] | ((prev: T[]) => T[])) => {
    if (typeof value === 'function') {
      setDataState(value);
    } else {
      setDataState(value);
    }
  }, []);

  const reset = useCallback(() => {
    setDataState([]);
    setTotal(0);
    setPage(1);
    setLoading('idle');
    setError(null);
    setRefreshing(false);
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (immediate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void load(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    total,
    page,
    loading,
    error,
    refreshing,
    load,
    loadMore,
    refresh,
    setData,
    reset,
  };
}
