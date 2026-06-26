import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = 'theme_mode';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeSettingsContextType {
  /** Current theme mode: system / light / dark */
  themeMode: ThemeMode;
  /** Set theme mode */
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  /** Whether the preference has been loaded from storage */
  isLoaded: boolean;
}

const ThemeSettingsContext = createContext<ThemeSettingsContextType>({
  themeMode: 'system',
  setThemeMode: async (_mode: ThemeMode) => {
    // Default no-op, replaced by ThemeSettingsProvider
  },
  isLoaded: false,
});

/**
 * Hook to access theme mode preference.
 * Use this for toggling theme in settings.
 */
export function useThemeSettings(): ThemeSettingsContextType {
  return useContext(ThemeSettingsContext);
}

/**
 * Hook that returns the effective color scheme,
 * considering both system preference and manual override.
 */
export function useAppColorScheme(): 'light' | 'dark' {
  const { themeMode, isLoaded } = useThemeSettings();
  const systemScheme = useRNColorScheme();

  if (!isLoaded) {
    return 'light';
  }

  if (themeMode === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }

  return themeMode;
}

export function ThemeSettingsProvider({ children }: { children: ReactNode }) {
  // eslint-disable-next-line react/hook-use-state
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((value) => {
        if (value === 'light' || value === 'dark' || value === 'system') {
          setThemeModeState(value);
        }
      })
      .catch(() => {
        // ignore
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // ignore storage errors
    }
  }, []);

  return (
    <ThemeSettingsContext.Provider value={{ themeMode, setThemeMode, isLoaded }}>
      {children}
    </ThemeSettingsContext.Provider>
  );
}
