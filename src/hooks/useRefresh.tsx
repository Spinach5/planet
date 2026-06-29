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
