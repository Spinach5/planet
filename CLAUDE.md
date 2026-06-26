# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Expo Version

Always reference **Expo SDK 56** docs at https://docs.expo.dev/versions/v56.0.0/ before writing code — SDK APIs change between versions.

## Commands

```bash
yarn start          # Start the Expo dev server
yarn android        # Start with Android emulator
yarn ios            # Start with iOS simulator
yarn web            # Start for web
yarn lint           # Run ESLint (expo lint)
yarn reset-project  # Move starter code to app-example/, create fresh src/app/
```

Package manager is **Yarn** — use `yarn add` / `yarn remove`, not npm.

## Architecture

### Routing (expo-router, file-based)

Routes live in `src/app/`. The root layout `src/app/_layout.tsx` wraps all routes with `ThemeProvider` (light/dark via `useColorScheme()`), the splash overlay, and the tab navigator. Two routes: `index` (Home) and `explore`.

### Platform adaptation

Two strategies are used in parallel:

1. **Platform file extensions** — `.web.tsx` / `.web.ts` files are auto-loaded on web:
   - `src/hooks/use-color-scheme.web.ts` — hydrates color scheme client-side to support static rendering
   - `src/components/animated-icon.web.tsx` — simplified web animations (splash overlay is null on web)
   - `src/components/app-tabs.web.tsx` — uses `expo-router/ui` Tabs for web (floating pill bar)
   - `src/components/app-tabs.tsx` — uses `expo-router/unstable-native-tabs` NativeTabs for native (system tab bar)

2. **`Platform.select()` / `Platform.OS` checks** — inline platform branching for smaller differences (font families, dev menu shortcuts, insets, SymbolView icon names).

### Theme system

- `src/constants/theme.ts` — `Colors` object with `light`/`dark` palettes (text, background, backgroundElement, backgroundSelected, textSecondary); `Fonts` per-platform font stacks; `Spacing` scale (half:2 → six:64); `BottomTabInset`; `MaxContentWidth`
- `src/hooks/use-color-scheme.ts` — wraps RN's `useColorScheme`; falls back to `'light'` before client hydration (for static web rendering). The `.web.ts` variant adds React state for rehydration.
- `src/hooks/use-theme.ts` — returns `Colors['light']` or `Colors['dark']` based on current scheme, defaulting unspecified to light
- `src/global.css` — CSS custom properties for web fonts (injected at root)

### Key components

- **`ThemedText`** / **`ThemedView`** — building blocks; accept a `type` or `themeColor` key and automatically resolve the current theme color. Prefer these over raw `<Text>` / `<View>`.
- **`Collapsible`** (`src/components/ui/collapsible.tsx`) — animated expandable section using `react-native-reanimated` (`FadeIn`)
- **`ExternalLink`** — wraps expo-router's `Link`; opens in-app browser on native, new tab on web
- **`AnimatedIcon`** / **`AnimatedSplashOverlay`** — logo animation and full-screen splash (native only; web splash is a no-op)

### Import aliases (tsconfig paths)

- `@/*` → `./src/*`
- `@/assets/*` → `./assets/*`

### Configuration

- `app.json` — Expo config: `expo-router` and `expo-splash-screen` plugins, `typedRoutes: true`, `reactCompiler: true`, web `output: "static"`
- `tsconfig.json` — extends `expo/tsconfig.base`, strict mode on
- `.vscode/settings.json` — auto-fix + organize imports on save; recommends `expo.vscode-expo-tools`

### Web output

The web build is configured for **static** output (`web.output: "static"` in app.json). The `use-color-scheme` hook accounts for this by returning `'light'` during server-side render and rehydrating on the client.
