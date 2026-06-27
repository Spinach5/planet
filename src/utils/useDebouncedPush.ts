import { useCallback, useRef } from 'react';
import { router } from 'expo-router';

/**
 * Wraps router.push with a cooldown to prevent rapid duplicate navigations
 * when users tap buttons repeatedly.
 */
export function useDebouncedPush(cooldownMs = 500) {
  const lastPush = useRef(0);

  const push = useCallback(
    (route: string) => {
      const now = Date.now();
      if (now - lastPush.current < cooldownMs) return;
      lastPush.current = now;
      router.push(route);
    },
    [cooldownMs],
  );

  return push;
}
