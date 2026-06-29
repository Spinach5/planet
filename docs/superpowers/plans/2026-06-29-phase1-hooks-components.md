# Phase 1: Generic Hooks & Business Components — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract 7 generic hooks and 10 business components from repeated patterns across 20+ pages, reducing boilerplate by ~50%.

**Architecture:** New hooks live in `src/hooks/`, new components in `src/components/business/`. Existing components move to layered subdirectories (`base/`, `themed/`, `layout/`, `feature/`). No existing page code is modified — components are additive. A barrel `hooks/index.ts` re-exports everything.

**Tech Stack:** Expo SDK 56, React Native 0.85, TypeScript 6.0, react-native-reanimated 4.3, expo-linear-gradient, react-native-safe-area-context.

## Global Constraints

- Package manager: **Yarn** (`yarn add`, not npm)
- Import alias: `@/*` → `./src/*`
- Theme constants: always import from `@/constants/theme` (Colors, Spacing, Radius, Fonts)
- Naming: component files PascalCase, hook files camelCase, style files `*.style.ts`
- Styles: use `StyleSheet.create`, variable name `st` or `styles`
- TypeScript strict mode — no `any` unless unavoidable
- Existing pages must NOT break — all changes are additive
- Do NOT modify expo-router URL structure
- Follow existing code patterns (see `ThemedText`, `ThemedView`, `MaterialIcon` for reference)

---

### Task 1: Extract `getColorFromName` to `src/utils/color.ts`

**Files:**
- Create: `src/utils/color.ts`
- Modify: `src/app/books.tsx` (lines 17-24)
- Modify: `src/app/club.tsx` (lines 17-27)

**Interfaces:**
- Produces: `getHashCode(str: string): number` and `getColorFromName(name: string): string` in `@/utils/color`

- [ ] **Step 1: Create `src/utils/color.ts`**

```typescript
/**
 * Color utility functions.
 * Extracted from books.tsx and club.tsx to eliminate duplication.
 */

/** Generate a numeric hash code from a string */
export function getHashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Generate a consistent HSL color from a name string */
export function getColorFromName(name: string): string {
  return `hsl(${String(getHashCode(name) % 360)}, 70%, 55%)`;
}
```

- [ ] **Step 2: Update `src/app/books.tsx` — replace inline definitions with import**

Remove lines 17-24 (the two function definitions) and add at the top with other imports:

```typescript
import { getColorFromName } from '@/utils/color';
```

- [ ] **Step 3: Update `src/app/club.tsx` — replace inline definitions with import**

Remove lines 17-27 (the two function definitions) and add at the top with other imports:

```typescript
import { getColorFromName } from '@/utils/color';
```

- [ ] **Step 4: Verify no other files define these functions**

Run: `grep -rn "getHashCode\|getColorFromName" src/`
Expected: only `src/utils/color.ts`, `src/app/books.tsx`, `src/app/club.tsx` (as imports)

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/utils/color.ts src/app/books.tsx src/app/club.tsx
git commit -m "refactor: extract getColorFromName to utils/color.ts"
```

---

### Task 2: Create `useDebounce` hook

**Files:**
- Create: `src/hooks/useDebounce.ts`

**Interfaces:**
- Produces: `useDebounce<T>(value: T, delay?: number): T`

- [ ] **Step 1: Create `src/hooks/useDebounce.ts`**

```typescript
import { useState, useEffect } from 'react';

/**
 * Debounce a value. Returns the debounced value that updates after `delay` ms
 * of no changes to the input.
 *
 * @param value - The value to debounce
 * @param delay - Debounce delay in milliseconds (default 300)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDebounce.ts
git commit -m "feat: add useDebounce hook"
```

---

### Task 3: Create `useRequest` hook

**Files:**
- Create: `src/hooks/useRequest.ts`

**Interfaces:**
- Produces: `useRequest<T, Args>(requestFn, options?)` returning `{ data, loading, error, run, mutate, reset }`

- [ ] **Step 1: Create `src/hooks/useRequest.ts`**

```typescript
import { useState, useCallback, useRef } from 'react';

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

  // Auto-trigger on mount if not manual
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => {
    if (!manual) {
      void run(...((defaultParams ?? []) as Args));
    }
  });

  return { data, loading, error, run, mutate, reset };
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useRequest.ts
git commit -m "feat: add useRequest hook"
```

---

### Task 4: Create `useRefresh` hook

**Files:**
- Create: `src/hooks/useRefresh.ts`

**Interfaces:**
- Produces: `useRefresh(refreshFn)` returning `{ refreshing, onRefresh }`

- [ ] **Step 1: Create `src/hooks/useRefresh.ts`**

```typescript
import { useState, useCallback } from 'react';
import { RefreshControl, type RefreshControlProps } from 'react-native';

interface UseRefreshOptions {
  /** RefreshControl colors (Android) */
  colors?: string[];
  /** RefreshControl tintColor (iOS) */
  tintColor?: string;
}

interface UseRefreshResult {
  /** Whether currently refreshing */
  refreshing: boolean;
  /** Handler for RefreshControl.onRefresh */
  onRefresh: () => void;
  /** Create a RefreshControl element for use in ScrollView */
  createRefreshControl: (props?: Partial<RefreshControlProps>) => React.ReactElement<RefreshControlProps>;
}

/**
 * Hook for managing pull-to-refresh state.
 * Wraps an async refresh function with refreshing state management.
 *
 * @param refreshFn - Async function to call on refresh
 * @param options - RefreshControl styling options
 * @returns Object with refreshing state and handlers
 */
export function useRefresh(
  refreshFn: () => Promise<void>,
  options: UseRefreshOptions = {},
): UseRefreshResult {
  const [refreshing, setRefreshing] = useState(false);
  const { colors = ['#47a5fd'], tintColor = '#47a5fd' } = options;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refreshFn().finally(() => {
      setRefreshing(false);
    });
  }, [refreshFn]);

  const createRefreshControl = useCallback(
    (props?: Partial<RefreshControlProps>) => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        colors={colors}
        tintColor={tintColor}
        {...props}
      />
    ),
    [refreshing, onRefresh, colors, tintColor],
  );

  return { refreshing, onRefresh, createRefreshControl };
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useRefresh.ts
git commit -m "feat: add useRefresh hook"
```

---

### Task 5: Create `useAppState` hook

**Files:**
- Create: `src/hooks/useAppState.ts`

**Interfaces:**
- Produces: `useAppState(onChange?)` returning `AppStateStatus`

- [ ] **Step 1: Create `src/hooks/useAppState.ts`**

```typescript
import { useState, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Hook to track app foreground/background state.
 *
 * @param onChange - Optional callback when state changes.
 *   Receives (nextState, prevState).
 * @returns Current AppStateStatus: 'active' | 'background' | 'inactive' | 'unknown' | 'extension'
 */
export function useAppState(
  onChange?: (nextState: AppStateStatus, prevState: AppStateStatus) => void,
): AppStateStatus {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const prevAppStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prevState = prevAppStateRef.current;
      prevAppStateRef.current = nextState;
      setAppState(nextState);
      onChange?.(nextState, prevState);
    });

    return () => {
      subscription.remove();
    };
  }, [onChange]);

  return appState;
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAppState.ts
git commit -m "feat: add useAppState hook"
```

---

### Task 6: Create `useAuthGuard` hook

**Files:**
- Create: `src/hooks/useAuthGuard.ts`

**Interfaces:**
- Produces: `useAuthGuard(options?)` returning `{ authState, isAuthenticated, loginRedirect }`
- Consumes: `userManager` from `@/service/userInfo`

- [ ] **Step 1: Create `src/hooks/useAuthGuard.ts`**

```typescript
import { useState, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import userManager from '@/service/userInfo';

type AuthState = 'checking' | 'ok' | 'need-login' | 'need-register';

interface UseAuthGuardOptions {
  /** Whether login is required (default: true) */
  requireLogin?: boolean;
  /** Whether server token is required (default: false) */
  requireServerToken?: boolean;
  /** Redirect path for login (default: '/login') */
  redirectTo?: string;
  /** Whether to auto-redirect to login (default: false) */
  autoRedirect?: boolean;
}

interface UseAuthGuardResult {
  authState: AuthState;
  isAuthenticated: boolean;
  loginRedirect: () => void;
}

/**
 * Hook for page-level auth guard.
 * Checks login state on focus and provides redirect helpers.
 *
 * Note: Since userManager is a singleton (non-reactive), this hook
 * checks auth state on focus only. Will become fully reactive
 * after zustand migration in Phase 3.
 *
 * @param options - Auth guard configuration
 * @returns Object with auth state and helpers
 */
export function useAuthGuard(options: UseAuthGuardOptions = {}): UseAuthGuardResult {
  const {
    requireLogin = true,
    requireServerToken = false,
    redirectTo = '/login',
    autoRedirect = false,
  } = options;

  const [authState, setAuthState] = useState<AuthState>('checking');

  const checkAuth = useCallback((): AuthState => {
    if (requireLogin && !userManager.checkLogin()) {
      return 'need-login';
    }
    if (requireServerToken && !userManager.getServerToken()) {
      return 'need-register';
    }
    return 'ok';
  }, [requireLogin, requireServerToken]);

  useFocusEffect(
    useCallback(() => {
      const state = checkAuth();
      setAuthState(state);

      if (autoRedirect && state === 'need-login') {
        router.push(redirectTo);
      }
    }, [checkAuth, autoRedirect, redirectTo]),
  );

  const loginRedirect = useCallback(() => {
    router.push(redirectTo);
  }, [redirectTo]);

  return {
    authState,
    isAuthenticated: authState === 'ok',
    loginRedirect,
  };
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAuthGuard.ts
git commit -m "feat: add useAuthGuard hook"
```

---

### Task 7: Create `useList` hook

**Files:**
- Create: `src/hooks/useList.ts`

**Interfaces:**
- Produces: `useList<T>(fetchFn, options?)` returning `{ data, total, page, loading, error, refreshing, load, loadMore, refresh, setData, reset }`

- [ ] **Step 1: Create `src/hooks/useList.ts`**

```typescript
import { useState, useCallback, useRef } from 'react';

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
    onSuccess,
    onError,
  } = options;

  const [data, setDataState] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState<ListLoadingState>(immediate ? 'loading' : 'idle');
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const loadingRef = useRef(false);

  const extractData = useCallback((result: FetchResult<T>): { items: T[]; count: number } => {
    if (Array.isArray(result)) {
      return { items: result, count: result.length };
    }
    // Try common keys
    const obj = result as Record<string, unknown>;
    const items = (obj.list ?? obj.data ?? obj.books ?? obj.items ?? []) as T[];
    const count = (obj.total ?? obj.count ?? items.length) as number;
    return { items, count };
  }, []);

  const load = useCallback(
    async (targetPage: number = 1, forceRefresh: boolean = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;

      const isLoadingMore = targetPage > 1;
      setLoading(isLoadingMore ? 'loading-more' : 'loading');
      setError(null);

      try {
        const result = await fetchFn(
          { page: targetPage, pageSize: defaultPageSize },
          forceRefresh,
        );
        const { items, count } = extractData(result);

        if (targetPage === 1) {
          setDataState(items);
        } else {
          setDataState((prev) => [...prev, ...items]);
        }
        setTotal(count);
        setPage(targetPage);
        setLoading(items.length === 0 && targetPage === 1 ? 'empty' : 'success');
        onSuccess?.(items);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setLoading('error');
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
    setRefreshing(true);
    try {
      await load(1, true);
    } finally {
      setRefreshing(false);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => {
    if (immediate) {
      void load(1);
    }
  });

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
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useList.ts
git commit -m "feat: add useList hook"
```

---

### Task 8: Create `hooks/index.ts` barrel export

**Files:**
- Create: `src/hooks/index.ts`
- Modify: `src/hooks/useDebounce.ts` (no changes needed, just verify exists)
- Modify: `src/hooks/useRequest.ts` (no changes needed)
- Modify: `src/hooks/useRefresh.ts` (no changes needed)
- Modify: `src/hooks/useAppState.ts` (no changes needed)
- Modify: `src/hooks/useAuthGuard.ts` (no changes needed)
- Modify: `src/hooks/useList.ts` (no changes needed)

**Interfaces:**
- Produces: barrel export of all hooks from `@/hooks`

- [ ] **Step 1: Create `src/hooks/index.ts`**

```typescript
/**
 * Central export for all custom hooks.
 * Import from '@/hooks' instead of individual files.
 */

// Theme hooks
export { useTheme } from './use-theme';
export { useThemeSettings, useAppColorScheme } from './use-theme-settings';
export { useColorScheme } from './use-color-scheme';

// Generic hooks
export { useDebounce } from './useDebounce';
export { useRequest } from './useRequest';
export { useRefresh } from './useRefresh';
export { useAppState } from './useAppState';
export { useAuthGuard } from './useAuthGuard';
export { useList } from './useList';
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/index.ts
git commit -m "feat: add hooks barrel export"
```

---

### Task 9: Restructure component directories — move existing components

**Files:**
- Move: `src/components/Loading.tsx` → `src/components/base/Loading.tsx`
- Move: `src/components/LoadingOverlay.tsx` → `src/components/base/LoadingOverlay.tsx`
- Move: `src/components/MaterialIcon.tsx` → `src/components/base/MaterialIcon.tsx`
- Move: `src/components/themed-view.tsx` → `src/components/themed/ThemedView.tsx`
- Move: `src/components/themed-text.tsx` → `src/components/themed/ThemedText.tsx`
- Move: `src/components/GridContainer.tsx` → `src/components/layout/GridContainer.tsx`
- Move: `src/components/GridItem.tsx` → `src/components/layout/GridItem.tsx`
- Move: `src/components/HeadStatus.tsx` → `src/components/layout/HeadStatus.tsx`
- Move: `src/components/IndexSwiper.tsx` → `src/components/feature/IndexSwiper.tsx`
- Move: `src/components/animated-icon.tsx` → `src/components/feature/animated-icon.tsx`
- Move: `src/components/animated-icon.web.tsx` → `src/components/feature/animated-icon.web.tsx`
- Move: `src/components/external-link.tsx` → `src/components/feature/external-link.tsx`
- Move: `src/components/hint-row.tsx` → `src/components/feature/hint-row.tsx`
- Move: `src/components/web-badge.tsx` → `src/components/feature/web-badge.tsx`
- Move: `src/components/ui/collapsible.tsx` → `src/components/base/ui/collapsible.tsx`

**Interfaces:**
- All existing imports must continue to work via re-export barrel files

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p src/components/base/ui
mkdir -p src/components/themed
mkdir -p src/components/layout
mkdir -p src/components/feature
mkdir -p src/components/business
```

- [ ] **Step 2: Move files using git mv (preserves history)**

```bash
# Base components
git mv src/components/Loading.tsx src/components/base/Loading.tsx
git mv src/components/LoadingOverlay.tsx src/components/base/LoadingOverlay.tsx
git mv src/components/MaterialIcon.tsx src/components/base/MaterialIcon.tsx
git mv src/components/ui/collapsible.tsx src/components/base/ui/collapsible.tsx

# Themed components
git mv src/components/themed-view.tsx src/components/themed/ThemedView.tsx
git mv src/components/themed-text.tsx src/components/themed/ThemedText.tsx

# Layout components
git mv src/components/GridContainer.tsx src/components/layout/GridContainer.tsx
git mv src/components/GridItem.tsx src/components/layout/GridItem.tsx
git mv src/components/HeadStatus.tsx src/components/layout/HeadStatus.tsx

# Feature components
git mv src/components/IndexSwiper.tsx src/components/feature/IndexSwiper.tsx
git mv src/components/animated-icon.tsx src/components/feature/animated-icon.tsx
git mv src/components/animated-icon.web.tsx src/components/feature/animated-icon.web.tsx
git mv src/components/external-link.tsx src/components/feature/external-link.tsx
git mv src/components/hint-row.tsx src/components/feature/hint-row.tsx
git mv src/components/web-badge.tsx src/components/feature/web-badge.tsx
```

- [ ] **Step 3: Create barrel re-export files for backward compatibility**

Create `src/components/index.ts`:

```typescript
/**
 * Barrel re-export for backward compatibility.
 * New code should import from specific subdirectories.
 */

// Base
export { Loading } from './base/Loading';
export { LoadingOverlay } from './base/LoadingOverlay';
export { MaterialIcon } from './base/MaterialIcon';
export type { IconName } from './base/MaterialIcon';

// Themed
export { ThemedView } from './themed/ThemedView';
export type { ThemedViewProps } from './themed/ThemedView';
export { ThemedText } from './themed/ThemedText';
export type { ThemedTextProps } from './themed/ThemedText';

// Layout
export { GridContainer } from './layout/GridContainer';
export { GridItem } from './layout/GridItem';
export { HeadStatus } from './layout/HeadStatus';

// Feature
export { IndexSwiper } from './feature/IndexSwiper';
export { ExternalLink } from './feature/external-link';
```

- [ ] **Step 4: Update internal imports within moved files**

Files that import from other moved files need their imports updated. Check each moved file for imports like `@/components/themed-view` and update to new paths.

For example, in `src/components/base/Loading.tsx`, change:
```typescript
// Before
import { ThemedText } from "@/components/themed-text";
// After
import { ThemedText } from "@/components/themed/ThemedText";
```

Do this for all moved files that cross-reference each other.

- [ ] **Step 5: Update all consuming files to use new import paths**

Run global search for old import paths and update:
```bash
grep -rn "from '@/components/themed-view'" src/
grep -rn "from '@/components/themed-text'" src/
grep -rn "from '@/components/Loading'" src/
grep -rn "from '@/components/LoadingOverlay'" src/
grep -rn "from '@/components/MaterialIcon'" src/
grep -rn "from '@/components/GridContainer'" src/
grep -rn "from '@/components/GridItem'" src/
grep -rn "from '@/components/HeadStatus'" src/
grep -rn "from '@/components/IndexSwiper'" src/
grep -rn "from '@/components/animated-icon'" src/
grep -rn "from '@/components/external-link'" src/
grep -rn "from '@/components/hint-row'" src/
grep -rn "from '@/components/web-badge'" src/
grep -rn "from '@/components/ui/collapsible'" src/
```

Update each match to the new path. Example:
```typescript
// Before
import { ThemedView } from '@/components/themed-view';
// After
import { ThemedView } from '@/components/themed/ThemedView';
```

- [ ] **Step 6: Remove empty `src/components/ui/` directory if it exists**

```bash
rmdir src/components/ui 2>/dev/null || true
```

- [ ] **Step 7: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 8: Verify build**

Run: `yarn web` (or `npx expo start --web`)
Expected: app loads without errors

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: restructure component directories into base/themed/layout/feature layers"
```

---

### Task 10: Create `Avatar` component

**Files:**
- Create: `src/components/base/Avatar.tsx`
- Consumes: `getColorFromName` from `@/utils/color` (Task 1)

**Interfaces:**
- Produces: `Avatar` component with props `{ source?, name?, size?, backgroundColor?, textColor?, style? }`

- [ ] **Step 1: Create `src/components/base/Avatar.tsx`**

```typescript
import { View, Text, Image, StyleSheet, type ViewStyle, type ImageSourcePropType } from 'react-native';
import { getColorFromName } from '@/utils/color';

interface AvatarProps {
  /** Image source. If null/undefined, shows initial letter. */
  source?: ImageSourcePropType | null;
  /** Name for generating initial letter and background color */
  name?: string;
  /** Avatar size in dp (default: 40) */
  size?: number;
  /** Background color override. Auto-generated from name if not set. */
  backgroundColor?: string;
  /** Text color for initial letter (default: '#fff') */
  textColor?: string;
  /** Additional container style */
  style?: ViewStyle;
}

/**
 * Avatar component that displays an image, or falls back to an initial letter
 * with an auto-generated background color.
 */
export function Avatar({
  source,
  name = '',
  size = 40,
  backgroundColor,
  textColor = '#fff',
  style,
}: AvatarProps) {
  const bgColor = backgroundColor ?? (name ? getColorFromName(name) : '#ccc');
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const fontSize = size * 0.45;

  if (source) {
    return (
      <Image
        source={source}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize,
          fontWeight: '700',
          color: textColor,
        }}
      >
        {initial}
      </Text>
    </View>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/base/Avatar.tsx
git commit -m "feat: add Avatar component"
```

---

### Task 11: Create `GradientScreen` component

**Files:**
- Create: `src/components/business/GradientScreen/index.tsx`
- Create: `src/components/business/GradientScreen/index.style.ts`
- Consumes: `useTheme` from `@/hooks/use-theme`, `Colors` from `@/constants/theme`

**Interfaces:**
- Produces: `GradientScreen` component with props `{ children, style?, contentStyle?, scrollable?, refreshControl?, onScroll?, header?, paddingTop? }`

- [ ] **Step 1: Create `src/components/business/GradientScreen/index.style.ts`**

```typescript
import { StyleSheet } from 'react-native';

export const st = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});
```

- [ ] **Step 2: Create `src/components/business/GradientScreen/index.tsx`**

```typescript
import type { ReactNode } from 'react';
import { ScrollView, type ViewStyle, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed/ThemedView';
import { useTheme } from '@/hooks/use-theme';
import { st } from './index.style';

interface GradientScreenProps {
  children: ReactNode;
  /** Extra style for the outer container */
  style?: ViewStyle;
  /** Extra style for the content area */
  contentStyle?: ViewStyle;
  /** Whether content is scrollable (default: false) */
  scrollable?: boolean;
  /** RefreshControl element (only used when scrollable=true) */
  refreshControl?: ReactNode;
  /** Scroll event handler (only used when scrollable=true) */
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Header content rendered above the scrollable area, inside the gradient */
  header?: ReactNode;
  /** Top padding override. Default: insets.top + 8 */
  paddingTop?: number;
}

/**
 * Standard page container with gradient background.
 * Encapsulates SafeAreaView insets, LinearGradient, and optional ScrollView.
 * Matches the common page pattern used across the app.
 */
export function GradientScreen({
  children,
  style,
  contentStyle,
  scrollable = false,
  refreshControl,
  onScroll,
  header,
  paddingTop,
}: GradientScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme.background === '#000000';

  const gradientColors: [string, ...string[]] = isDark
    ? ['rgb(26,29,46)', 'rgb(35,39,64)', 'rgb(26,29,46)']
    : ['#47a5fd', '#cce5ff', '#f2f5f9'];

  const topPadding = paddingTop ?? insets.top + 8;

  return (
    <ThemedView style={[st.container, style]}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.28, 1]}
        style={[st.gradient, { paddingTop: topPadding }]}
      >
        {header}
        {scrollable ? (
          <ScrollView
            style={[st.scrollView, contentStyle]}
            onScroll={onScroll}
            refreshControl={refreshControl as React.ReactElement}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </LinearGradient>
    </ThemedView>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/business/GradientScreen/
git commit -m "feat: add GradientScreen component"
```

---

### Task 12: Create `PageHeader` component

**Files:**
- Create: `src/components/business/PageHeader/index.tsx`
- Create: `src/components/business/PageHeader/index.style.ts`
- Consumes: `MaterialIcon` from `@/components/base/MaterialIcon`

**Interfaces:**
- Produces: `PageHeader` component with props `{ title, showBack?, onBack?, right?, style?, titleStyle?, backIcon? }`

- [ ] **Step 1: Create `src/components/business/PageHeader/index.style.ts`**

```typescript
import { StyleSheet } from 'react-native';

export const st = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  rightArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
```

- [ ] **Step 2: Create `src/components/business/PageHeader/index.tsx`**

```typescript
import type { ReactNode } from 'react';
import { TouchableOpacity, type ViewStyle, type TextStyle } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcon, type IconName } from '@/components/base/MaterialIcon';
import { HeadStatus } from '@/components/layout/HeadStatus';
import { st } from './index.style';

interface PageHeaderProps {
  /** Title text */
  title: string;
  /** Whether to show back button (default: true) */
  showBack?: boolean;
  /** Back button press handler. Default: router.back() */
  onBack?: () => void;
  /** Right-side content */
  right?: ReactNode;
  /** Extra container style */
  style?: ViewStyle;
  /** Title text style override */
  titleStyle?: TextStyle;
  /** Back icon name (default: 'arrow-left') */
  backIcon?: IconName;
}

/**
 * Standard page header with back button, title, and optional right-side content.
 * Designed to be used inside GradientScreen's header prop.
 */
export function PageHeader({
  title,
  showBack = true,
  onBack,
  right,
  style,
  backIcon = 'arrow-left',
}: PageHeaderProps) {
  const handleBack = onBack ?? (() => router.back());

  return (
    <>
      <HeadStatus text={title} />
      {/* The PageHeader composes the back button + HeadStatus pattern.
          Layout is: [back] [title] [right] */}
    </>
  );
}
```

Wait — looking at the actual pattern in `books.tsx` and `club.tsx`, the header is:

```tsx
<View style={st.hdr}>
  <TouchableOpacity onPress={()=>router.back()}>
    <MaterialIcon name="arrow-left" size={24} color="#fff" />
  </TouchableOpacity>
  <HeadStatus text="书籍" />
</View>
```

Let me rewrite this properly:

- [ ] **Step 2: Create `src/components/business/PageHeader/index.tsx`**

```typescript
import type { ReactNode } from 'react';
import { View, Text, TouchableOpacity, type ViewStyle, type TextStyle } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcon, type IconName } from '@/components/base/MaterialIcon';
import { st } from './index.style';

interface PageHeaderProps {
  /** Title text */
  title: string;
  /** Whether to show back button (default: true) */
  showBack?: boolean;
  /** Back button press handler. Default: router.back() */
  onBack?: () => void;
  /** Right-side content */
  right?: ReactNode;
  /** Extra container style */
  style?: ViewStyle;
  /** Title text style override */
  titleStyle?: TextStyle;
  /** Back icon name (default: 'arrow-left') */
  backIcon?: IconName;
}

/**
 * Standard page header with back button, title, and optional right-side content.
 * Renders a single row: [back] [title] [right]
 * Designed to be used inside GradientScreen's header prop.
 *
 * Usage:
 * ```tsx
 * <GradientScreen header={<PageHeader title="书籍" />}>
 *   ...
 * </GradientScreen>
 * ```
 */
export function PageHeader({
  title,
  showBack = true,
  onBack,
  right,
  style,
  titleStyle,
  backIcon = 'arrow-left',
}: PageHeaderProps) {
  const handleBack = onBack ?? (() => router.back());

  return (
    <View style={[st.container, style]}>
      {showBack ? (
        <TouchableOpacity onPress={handleBack} style={st.backButton}>
          <MaterialIcon name={backIcon} size={24} color="#fff" />
        </TouchableOpacity>
      ) : null}
      <Text
        style={[
          st.title,
          titleStyle,
        ]}
      >
        {title}
      </Text>
      {right ? <View style={st.rightArea}>{right}</View> : null}
    </View>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/business/PageHeader/
git commit -m "feat: add PageHeader component"
```

---

### Task 13: Create `StatusView` component

**Files:**
- Create: `src/components/business/StatusView/index.tsx`
- Create: `src/components/business/StatusView/index.style.ts`
- Consumes: `ThemedText` from `@/components/themed/ThemedText`, `MaterialIcon` from `@/components/base/MaterialIcon`, `useTheme` from `@/hooks/use-theme`

**Interfaces:**
- Produces: `StatusView` component with props `{ status, children?, loadingText?, emptyText?, errorText?, onRetry?, emptyIcon?, style? }`

- [ ] **Step 1: Create `src/components/business/StatusView/index.style.ts`**

```typescript
import { StyleSheet } from 'react-native';

export const st = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  text: {
    fontSize: 15,
    marginTop: 12,
  },
  retryText: {
    fontSize: 15,
  },
  icon: {
    marginBottom: 8,
  },
});
```

- [ ] **Step 2: Create `src/components/business/StatusView/index.tsx`**

```typescript
import type { ReactNode } from 'react';
import { View, TouchableOpacity, type ViewStyle } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { ThemedText } from '@/components/themed/ThemedText';
import { MaterialIcon, type IconName } from '@/components/base/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { st } from './index.style';

type StatusType = 'loading' | 'empty' | 'error' | 'content';

interface StatusViewProps {
  /** Current status */
  status: StatusType;
  /** Content to render when status is 'content' */
  children?: ReactNode;
  /** Loading text (default: '加载中...') */
  loadingText?: string;
  /** Empty state text (default: '暂无数据') */
  emptyText?: string;
  /** Error text (default: '加载失败，点击重试') */
  errorText?: string;
  /** Retry handler for error state */
  onRetry?: () => void;
  /** Icon for empty state */
  emptyIcon?: IconName;
  /** Container style */
  style?: ViewStyle;
}

/**
 * Unified status view component for loading, empty, error, and content states.
 * Use in list pages and detail pages to standardize state presentation.
 */
export function StatusView({
  status,
  children,
  loadingText = '加载中...',
  emptyText = '暂无数据',
  errorText = '加载失败，点击重试',
  onRetry,
  emptyIcon,
  style,
}: StatusViewProps) {
  const theme = useTheme();

  if (status === 'content') {
    return <>{children}</>;
  }

  return (
    <View style={[st.container, style]}>
      {status === 'loading' ? (
        <>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={st.text} themeColor="textSecondary">
            {loadingText}
          </ThemedText>
        </>
      ) : status === 'empty' ? (
        <>
          {emptyIcon ? (
            <MaterialIcon
              name={emptyIcon}
              size={48}
              color={theme.textSecondary}
              style={st.icon}
            />
          ) : null}
          <ThemedText style={st.text} themeColor="textSecondary">
            {emptyText}
          </ThemedText>
        </>
      ) : status === 'error' ? (
        <TouchableOpacity onPress={onRetry} activeOpacity={0.7}>
          <ThemedText style={st.retryText} themeColor="textSecondary">
            {errorText}
          </ThemedText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/business/StatusView/
git commit -m "feat: add StatusView component"
```

---

### Task 14: Create `CategoryChipBar` component

**Files:**
- Create: `src/components/business/CategoryChipBar/index.tsx`
- Create: `src/components/business/CategoryChipBar/index.style.ts`
- Consumes: `useTheme` from `@/hooks/use-theme`

**Interfaces:**
- Produces: `CategoryChipBar` component with props `{ categories, value, onChange, mode?, style?, contentContainerStyle?, showScrollIndicator? }`

- [ ] **Step 1: Create `src/components/business/CategoryChipBar/index.style.ts`**

```typescript
import { StyleSheet } from 'react-native';

export const st = StyleSheet.create({
  scroll: {
    maxHeight: 48,
  },
  content: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e8e8e8',
  },
  chipActive: {
    backgroundColor: '#47a5fd',
  },
  chipText: {
    fontSize: 13,
    color: '#666',
  },
  chipTextActive: {
    color: '#fff',
  },
});
```

- [ ] **Step 2: Create `src/components/business/CategoryChipBar/index.tsx`**

```typescript
import { ScrollView, TouchableOpacity, Text, type ViewStyle } from 'react-native';
import { st } from './index.style';

type CategoryItem = string | { label: string; value: string };

interface CategoryChipBarProps {
  /** List of categories */
  categories: CategoryItem[];
  /** Currently selected value(s) */
  value: string | string[];
  /** Selection change callback */
  onChange: (value: string | string[]) => void;
  /** Selection mode (default: 'single') */
  mode?: 'single' | 'multi';
  /** Container style */
  style?: ViewStyle;
  /** Content container style */
  contentContainerStyle?: ViewStyle;
  /** Show scroll indicator (default: false) */
  showScrollIndicator?: boolean;
}

/**
 * Horizontal scrollable category chip bar.
 * Supports single-select and multi-select modes.
 */
export function CategoryChipBar({
  categories,
  value,
  onChange,
  mode = 'single',
  style,
  contentContainerStyle,
  showScrollIndicator = false,
}: CategoryChipBarProps) {
  const handlePress = (itemValue: string) => {
    if (mode === 'multi') {
      const currentValues = Array.isArray(value) ? value : [value];
      const newValues = currentValues.includes(itemValue)
        ? currentValues.filter((v) => v !== itemValue)
        : [...currentValues, itemValue];
      onChange(newValues);
    } else {
      onChange(itemValue);
    }
  };

  const isActive = (itemValue: string) => {
    if (Array.isArray(value)) {
      return value.includes(itemValue);
    }
    return value === itemValue;
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={showScrollIndicator}
      style={[st.scroll, style]}
      contentContainerStyle={[st.content, contentContainerStyle]}
    >
      {categories.map((cat) => {
        const label = typeof cat === 'string' ? cat : cat.label;
        const itemValue = typeof cat === 'string' ? cat : cat.value;
        const active = isActive(itemValue);

        return (
          <TouchableOpacity
            key={itemValue}
            style={[st.chip, active && st.chipActive]}
            onPress={() => handlePress(itemValue)}
          >
            <Text style={[st.chipText, active && st.chipTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/business/CategoryChipBar/
git commit -m "feat: add CategoryChipBar component"
```

---

### Task 15: Create `FAB` component

**Files:**
- Create: `src/components/business/FAB/index.tsx`
- Create: `src/components/business/FAB/index.style.ts`
- Consumes: `MaterialIcon` from `@/components/base/MaterialIcon`, `useTheme` from `@/hooks/use-theme`

**Interfaces:**
- Produces: `FAB` component with props `{ icon?, label?, onPress, position?, bottom?, color?, backgroundColor?, size?, visible? }`

- [ ] **Step 1: Create `src/components/business/FAB/index.style.ts`**

```typescript
import { StyleSheet } from 'react-native';

export const st = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  label: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 30,
  },
});
```

- [ ] **Step 2: Create `src/components/business/FAB/index.tsx`**

```typescript
import { TouchableOpacity, Text, type ViewStyle } from 'react-native';
import { MaterialIcon, type IconName } from '@/components/base/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { st } from './index.style';

interface FABProps {
  /** Icon name (default: 'plus') */
  icon?: IconName;
  /** Text label (shown instead of icon if set) */
  label?: string;
  /** Press handler */
  onPress: () => void;
  /** Position (default: 'right') */
  position?: 'right' | 'left';
  /** Distance from bottom in dp (default: 80) */
  bottom?: number;
  /** Icon/text color (default: '#fff') */
  color?: string;
  /** Background color (default: theme primary) */
  backgroundColor?: string;
  /** Button size (default: 50) */
  size?: number;
  /** Whether visible (default: true) */
  visible?: boolean;
}

/**
 * Floating Action Button (FAB).
 * Absolute-positioned button with shadow and press feedback.
 */
export function FAB({
  icon = 'plus',
  label,
  onPress,
  position = 'right',
  bottom = 80,
  color = '#fff',
  backgroundColor,
  size = 50,
  visible = true,
}: FABProps) {
  const theme = useTheme();
  const bgColor = backgroundColor ?? theme.primary;
  const shadowColor = backgroundColor ?? '#47a5fd';

  if (!visible) return null;

  const positionStyle: ViewStyle = position === 'right'
    ? { right: 20 }
    : { left: 20 };

  return (
    <TouchableOpacity
      style={[
        st.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          bottom,
          shadowColor,
          ...positionStyle,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {label ? (
        <Text style={st.label}>{label}</Text>
      ) : (
        <MaterialIcon name={icon} size={size * 0.48} color={color} />
      )}
    </TouchableOpacity>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/business/FAB/
git commit -m "feat: add FAB component"
```

---

### Task 16: Create `EmptyState` component

**Files:**
- Create: `src/components/business/EmptyState/index.tsx`
- Create: `src/components/business/EmptyState/index.style.ts`
- Consumes: `ThemedText` from `@/components/themed/ThemedText`, `MaterialIcon` from `@/components/base/MaterialIcon`

**Interfaces:**
- Produces: `EmptyState` component with props `{ text?, icon?, iconSize?, style?, children? }`

- [ ] **Step 1: Create `src/components/business/EmptyState/index.style.ts`**

```typescript
import { StyleSheet } from 'react-native';

export const st = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  icon: {
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
  },
});
```

- [ ] **Step 2: Create `src/components/business/EmptyState/index.tsx`**

```typescript
import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { ThemedText } from '@/components/themed/ThemedText';
import { MaterialIcon, type IconName } from '@/components/base/MaterialIcon';
import { st } from './index.style';

interface EmptyStateProps {
  /** Empty state text (default: '暂无数据') */
  text?: string;
  /** Icon to display */
  icon?: IconName;
  /** Icon size (default: 48) */
  iconSize?: number;
  /** Container style */
  style?: ViewStyle;
  /** Additional content below text */
  children?: ReactNode;
}

/**
 * Empty state display component.
 * Shows an optional icon, text message, and optional children.
 */
export function EmptyState({
  text = '暂无数据',
  icon,
  iconSize = 48,
  style,
  children,
}: EmptyStateProps) {
  return (
    <View style={[st.container, style]}>
      {icon ? (
        <MaterialIcon
          name={icon}
          size={iconSize}
          color="#ccc"
          style={st.icon}
        />
      ) : null}
      <ThemedText style={st.text} themeColor="textSecondary">
        {text}
      </ThemedText>
      {children}
    </View>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/business/EmptyState/
git commit -m "feat: add EmptyState component"
```

---

### Task 17: Create `RetryView` component

**Files:**
- Create: `src/components/business/RetryView/index.tsx`
- Create: `src/components/business/RetryView/index.style.ts`
- Consumes: `ThemedText` from `@/components/themed/ThemedText`

**Interfaces:**
- Produces: `RetryView` component with props `{ text?, onRetry, style? }`

- [ ] **Step 1: Create `src/components/business/RetryView/index.style.ts`**

```typescript
import { StyleSheet } from 'react-native';

export const st = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  text: {
    fontSize: 15,
  },
});
```

- [ ] **Step 2: Create `src/components/business/RetryView/index.tsx`**

```typescript
import { TouchableOpacity, type ViewStyle } from 'react-native';
import { ThemedText } from '@/components/themed/ThemedText';
import { st } from './index.style';

interface RetryViewProps {
  /** Error text (default: '加载失败，点击重试') */
  text?: string;
  /** Retry handler */
  onRetry: () => void;
  /** Container style */
  style?: ViewStyle;
}

/**
 * Error state with retry action.
 * The entire area is tappable to trigger retry.
 */
export function RetryView({
  text = '加载失败，点击重试',
  onRetry,
  style,
}: RetryViewProps) {
  return (
    <TouchableOpacity
      style={[st.container, style]}
      onPress={onRetry}
      activeOpacity={0.7}
    >
      <ThemedText style={st.text} themeColor="textSecondary">
        {text}
      </ThemedText>
    </TouchableOpacity>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/business/RetryView/
git commit -m "feat: add RetryView component"
```

---

### Task 18: Create `SearchBar` component

**Files:**
- Create: `src/components/business/SearchBar/index.tsx`
- Create: `src/components/business/SearchBar/index.style.ts`
- Consumes: `MaterialIcon` from `@/components/base/MaterialIcon`, `useTheme` from `@/hooks/use-theme`

**Interfaces:**
- Produces: `SearchBar` component with props `{ value, onChangeText, placeholder?, onSubmit?, showIcon?, style?, inputStyle?, variant? }`

- [ ] **Step 1: Create `src/components/business/SearchBar/index.style.ts`**

```typescript
import { StyleSheet } from 'react-native';

export const st = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    borderRadius: 18,
    paddingHorizontal: 12,
    height: 36,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
});
```

- [ ] **Step 2: Create `src/components/business/SearchBar/index.tsx`**

```typescript
import { View, TextInput, type ViewStyle, type TextStyle } from 'react-native';
import { MaterialIcon } from '@/components/base/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { st } from './index.style';

interface SearchBarProps {
  /** Current search value */
  value: string;
  /** Text change handler */
  onChangeText: (text: string) => void;
  /** Placeholder text (default: '搜索') */
  placeholder?: string;
  /** Submit handler */
  onSubmit?: (text: string) => void;
  /** Show search icon (default: true) */
  showIcon?: boolean;
  /** Container style */
  style?: ViewStyle;
  /** Input text style */
  inputStyle?: TextStyle;
  /** Visual variant (default: 'surface') */
  variant?: 'surface' | 'transparent';
}

/**
 * Search bar component with icon and text input.
 */
export function SearchBar({
  value,
  onChangeText,
  placeholder = '搜索',
  onSubmit,
  showIcon = true,
  style,
  inputStyle,
  variant = 'surface',
}: SearchBarProps) {
  const theme = useTheme();

  const backgroundColor = variant === 'transparent'
    ? 'transparent'
    : theme.surface;

  return (
    <View style={[st.container, { backgroundColor }, style]}>
      {showIcon ? (
        <MaterialIcon name="magnify" size={16} color="#999" />
      ) : null}
      <TextInput
        style={[st.input, { color: theme.text }, inputStyle]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        onSubmitEditing={onSubmit ? () => onSubmit(value) : undefined}
        returnKeyType="search"
      />
    </View>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/business/SearchBar/
git commit -m "feat: add SearchBar component"
```

---

### Task 19: Create `ListSkeleton` component

**Files:**
- Create: `src/components/business/ListSkeleton/index.tsx`
- Create: `src/components/business/ListSkeleton/index.style.ts`
- Consumes: `useTheme` from `@/hooks/use-theme`

**Interfaces:**
- Produces: `ListSkeleton` component with props `{ rows?, columns?, style? }`

- [ ] **Step 1: Create `src/components/business/ListSkeleton/index.style.ts`**

```typescript
import { StyleSheet } from 'react-native';

export const st = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 4,
    gap: 8,
  },
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 4,
  },
  imagePlaceholder: {
    width: '100%',
    height: 170,
    backgroundColor: '#ddd',
  },
  body: {
    padding: 8,
    gap: 4,
  },
  line: {
    height: 10,
    backgroundColor: '#ddd',
    borderRadius: 3,
  },
});
```

- [ ] **Step 2: Create `src/components/business/ListSkeleton/index.tsx`**

```typescript
import { View, useWindowDimensions, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { st } from './index.style';

interface ListSkeletonProps {
  /** Number of skeleton rows (default: 4) */
  rows?: number;
  /** Number of columns for grid layout (default: 2) */
  columns?: number;
  /** Container style */
  style?: ViewStyle;
}

/**
 * Skeleton loading placeholder for list/grid views.
 * Shows animated placeholder blocks while content loads.
 */
export function ListSkeleton({
  rows = 4,
  columns = 2,
  style,
}: ListSkeletonProps) {
  const { width: sw } = useWindowDimensions();
  const theme = useTheme();
  const cardW = (sw - 16 - 8 * (columns - 1)) / columns;

  return (
    <View style={[st.grid, style]}>
      {Array.from({ length: rows }, (_, i) => (
        <View
          key={i}
          style={[
            st.card,
            { width: cardW, backgroundColor: theme.backgroundElement },
          ]}
        >
          <View style={st.imagePlaceholder} />
          <View style={st.body}>
            <View style={st.line} />
            <View style={[st.line, { width: '60%' }]} />
            <View style={[st.line, { width: '40%' }]} />
          </View>
        </View>
      ))}
    </View>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/business/ListSkeleton/
git commit -m "feat: add ListSkeleton component"
```

---

### Task 20: Final verification — TypeScript, lint, and build

**Files:**
- No new files. Verify all existing code compiles.

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 2: Run lint**

Run: `yarn lint`
Expected: no new errors (existing warnings are OK)

- [ ] **Step 3: Run web build**

Run: `npx expo start --web`
Expected: app loads in browser, all pages accessible

- [ ] **Step 4: Manual smoke test checklist**

- [ ] Home page loads, gradient visible, feature grid shows
- [ ] Books page loads, search works, category chips work, FAB visible
- [ ] Club page loads, auth check works, category filter works
- [ ] Theme toggle works (if settings page accessible)
- [ ] Tab navigation works between Home/Course/User

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address build issues from Phase 1 restructuring"
```

---

## Task Dependency Graph

```
Task 1 (color.ts)
├── Task 10 (Avatar) — depends on color.ts
│
Task 2 (useDebounce)
Task 3 (useRequest)
Task 4 (useRefresh)
Task 5 (useAppState)
Task 6 (useAuthGuard)
Task 7 (useList)
│
Task 8 (hooks/index.ts) — depends on Tasks 2-7
│
Task 9 (directory restructure) — independent, can run in parallel with 2-8
├── Task 11 (GradientScreen) — depends on 9 (ThemedView moved)
├── Task 12 (PageHeader) — depends on 9 (MaterialIcon, HeadStatus moved)
├── Task 13 (StatusView) — depends on 9
├── Task 14 (CategoryChipBar) — independent after 9
├── Task 15 (FAB) — depends on 9
├── Task 16 (EmptyState) — depends on 9
├── Task 17 (RetryView) — depends on 9
├── Task 18 (SearchBar) — depends on 9
├── Task 19 (ListSkeleton) — depends on 9
│
Task 20 (final verification) — depends on all
```

## Summary

| Task | Deliverable | Files Created | Files Modified |
|------|-------------|---------------|----------------|
| 1 | `utils/color.ts` | 1 | 2 |
| 2 | `useDebounce` | 1 | 0 |
| 3 | `useRequest` | 1 | 0 |
| 4 | `useRefresh` | 1 | 0 |
| 5 | `useAppState` | 1 | 0 |
| 6 | `useAuthGuard` | 1 | 0 |
| 7 | `useList` | 1 | 0 |
| 8 | `hooks/index.ts` | 1 | 0 |
| 9 | Directory restructure | 1 (barrel) | 20+ (imports) |
| 10 | `Avatar` | 1 | 0 |
| 11 | `GradientScreen` | 2 | 0 |
| 12 | `PageHeader` | 2 | 0 |
| 13 | `StatusView` | 2 | 0 |
| 14 | `CategoryChipBar` | 2 | 0 |
| 15 | `FAB` | 2 | 0 |
| 16 | `EmptyState` | 2 | 0 |
| 17 | `RetryView` | 2 | 0 |
| 18 | `SearchBar` | 2 | 0 |
| 19 | `ListSkeleton` | 2 | 0 |
| 20 | Verification | 0 | 0 |

**Total:** ~24 new files, ~22 modified files, 20 commits.
