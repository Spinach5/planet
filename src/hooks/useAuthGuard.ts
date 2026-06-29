import { useState, useCallback } from 'react';
import { router, useFocusEffect, type RelativePathString } from 'expo-router';
import userManager from '@/service/userInfo';

type AuthState = 'checking' | 'ok' | 'need-login' | 'need-register';

interface UseAuthGuardOptions {
  /** Whether login is required (default: true) */
  requireLogin?: boolean;
  /** Whether server token is required (default: false) */
  requireServerToken?: boolean;
  /** Redirect path for login (default: '/login') */
  redirectTo?: RelativePathString;
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
