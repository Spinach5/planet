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
