import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { ToastProvider } from '@/utils/toast';
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

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <PaperProvider theme={isDark ? customDarkTheme : customLightTheme}>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
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
      </ThemeProvider>
    </PaperProvider>
  );
}
