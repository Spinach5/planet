import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useSystemColorScheme } from 'react-native';

const THEME_STORAGE_KEY = 'theme_dark_mode';

interface ThemeSettingsContextType {
  /** Whether dark mode is manually overridden */
  darkMode: boolean;
  /** Toggle dark mode. Pass a boolean to set explicitly, or omit to toggle. */
  toggleDarkMode: (value?: boolean) => Promise<void>;
  /** Whether the override has been loaded from storage */
  isLoaded: boolean;
}

const ThemeSettingsContext = createContext<ThemeSettingsContextType>({
  darkMode: false,
  toggleDarkMode: async (_value?: boolean) => {
    // Default no-op, replaced by ThemeSettingsProvider
  },
  isLoaded: false,
});

/**
 * Hook to access manual dark mode override.
 * Use this for toggling dark mode in settings.
 * For reading the effective color scheme, continue using useColorScheme().
 */
export function useThemeSettings(): ThemeSettingsContextType {
  return useContext(ThemeSettingsContext);
}

/**
 * Hook that returns the effective color scheme,
 * considering both system preference and manual override.
 */
export function useAppColorScheme(): 'light' | 'dark' {
  const systemScheme = useSystemColorScheme();
  const { darkMode, isLoaded } = useThemeSettings();

  // Before hydration, fall back to system
  if (!isLoaded) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return systemScheme ? systemScheme : 'light';
  }

  return darkMode ? 'dark' : 'light';
}

export function ThemeSettingsProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((value) => {
        if (value !== null) {
          setDarkMode(value === 'true');
        }
      })
      .catch(() => {
        // ignore
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  const toggleDarkMode = useCallback(async (value?: boolean) => {
    const newValue = value ?? !darkMode;
    setDarkMode(newValue);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, String(newValue));
    } catch {
      // ignore storage errors
    }
  }, [darkMode]);

  return (
    <ThemeSettingsContext.Provider value={{ darkMode, toggleDarkMode, isLoaded }}>
      {children}
    </ThemeSettingsContext.Provider>
  );
}
