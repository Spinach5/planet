import { Stack } from 'expo-router';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { ToastProvider } from '@/utils/toast';
import { ThemeSettingsProvider, useAppColorScheme } from '@/hooks/use-theme-settings';
import { Colors } from '@/constants/theme';

/** Custom Material Design 3 theme based on our brand colors */
const customLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.light.primary,
    primaryContainer: Colors.light.primaryContainer,
    onPrimary: Colors.light.onPrimary,
    onPrimaryContainer: Colors.light.onPrimaryContainer,
    secondary: Colors.light.secondary,
    error: Colors.light.error,
    background: Colors.light.background,
    surface: Colors.light.surface,
    surfaceVariant: Colors.light.surfaceVariant,
    onSurface: Colors.light.onSurface,
    onSurfaceVariant: Colors.light.onSurfaceVariant,
    outline: Colors.light.outline,
    outlineVariant: Colors.light.outlineVariant,
  },
};

const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.dark.primary,
    primaryContainer: Colors.dark.primaryContainer,
    onPrimary: Colors.dark.onPrimary,
    onPrimaryContainer: Colors.dark.onPrimaryContainer,
    secondary: Colors.dark.secondary,
    error: Colors.dark.error,
    background: Colors.dark.background,
    surface: Colors.dark.surface,
    surfaceVariant: Colors.dark.surfaceVariant,
    onSurface: Colors.dark.onSurface,
    onSurfaceVariant: Colors.dark.onSurfaceVariant,
    outline: Colors.dark.outline,
    outlineVariant: Colors.dark.outlineVariant,
  },
};

function AppContent() {
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <PaperProvider theme={isDark ? customDarkTheme : customLightTheme}>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="login"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
      </ToastProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeSettingsProvider>
      <AppContent />
    </ThemeSettingsProvider>
  );
}
