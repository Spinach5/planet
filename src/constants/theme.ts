/**
 * Theme constants for the Planet app.
 * Material Design 3 inspired color system, matching the original Taro app's blue theme.
 */

import '@/global.css';

import { Platform } from 'react-native';

/** Primary brand color from original Taro app design system */
const PRIMARY = '#47a5fd';
const PRIMARY_LIGHT = '#7cc4ff';
const PRIMARY_DARK = '#1a7fd4';

export const Colors = {
  light: {
    // Core
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',

    // Material Design 3
    primary: PRIMARY,
    primaryContainer: '#d6e9ff',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#001e31',

    secondary: '#5c6bc0',
    secondaryContainer: '#dde1ff',
    onSecondary: '#ffffff',
    onSecondaryContainer: '#121946',

    tertiary: '#00897b',
    tertiaryContainer: '#a7f3ec',
    onTertiary: '#ffffff',

    error: '#d32f2f',
    errorContainer: '#ffdad6',
    onError: '#ffffff',

    // Surface
    surface: '#ffffff',
    surfaceVariant: '#f5f5f5',
    onSurface: '#000000',
    onSurfaceVariant: '#49454f',

    // Outline
    outline: '#79747e',
    outlineVariant: '#cac4d0',

    // Status
    success: '#2e7d32',
    warning: '#ed6c02',
    info: '#0288d1',

    // Gradients
    gradientStart: PRIMARY,
    gradientEnd: PRIMARY_DARK,
  },
  dark: {
    // Core
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',

    // Material Design 3
    primary: PRIMARY_LIGHT,
    primaryContainer: '#004a6e',
    onPrimary: '#00344d',
    onPrimaryContainer: '#cce5ff',

    secondary: '#bcc2ff',
    secondaryContainer: '#424883',
    onSecondary: '#272e60',
    onSecondaryContainer: '#dde1ff',

    tertiary: '#4dd0e1',
    tertiaryContainer: '#00695c',
    onTertiary: '#003731',
    onTertiaryContainer: '#a7f3ec',

    error: '#f2b8b5',
    errorContainer: '#8c1d18',
    onError: '#601410',

    // Surface
    surface: '#1c1b1f',
    surfaceVariant: '#2b2930',
    onSurface: '#e6e1e5',
    onSurfaceVariant: '#cac4d0',

    // Outline
    outline: '#938f99',
    outlineVariant: '#49454f',

    // Status
    success: '#66bb6a',
    warning: '#ffa726',
    info: '#4fc3f7',

    // Gradients
    gradientStart: PRIMARY_DARK,
    gradientEnd: '#0a3060',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Border radius scale from original design system */
export const Radius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
