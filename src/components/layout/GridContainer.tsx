import { View, StyleSheet, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { GridItem } from './GridItem';
import type { IconName } from '@/components/base/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';

const STORAGE_KEY_FEATURES = 'settings_feature_toggles';

interface GridEntry {
  url: string;
  icon: IconName;
  text: string;
}

const ALWAYS_VISIBLE: GridEntry[] = [
  { url: '/exam', icon: 'clipboard-text-outline', text: '考试' },
  { url: '/scores', icon: 'finance', text: '成绩' },
  { url: '/empty-room', icon: 'door-open', text: '空教室' },
  { url: '/muyu', icon: 'instrument-triangle', text: '电子木鱼' },
];

const TOGGLEABLE: Array<GridEntry & { key: string }> = [
  { key: 'club', url: '/club', icon: 'account-supervisor-circle', text: '社团' },
  { key: 'food', url: '/food', icon: 'food-variant', text: '美食' },
  { key: 'book', url: '/books', icon: 'book-open-page-variant', text: '书籍' },
  { key: 'other', url: '/affair', icon: 'plus-box-multiple-outline', text: '其他' },
];

/**
 * Home page feature grid — 4 columns, always shows core items + optional toggles.
 * Replaces Taro's GridContainer.
 */
export function GridContainer() {
  const theme = useTheme();
  const [features, setFeatures] = useState<Record<string, boolean>>({});

  const loadFeatures = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_FEATURES);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, boolean>;
        setFeatures(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const timer = setTimeout(() => { void loadFeatures(); }, 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh when app comes to foreground (like Taro's useDidShow)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (/(?:inactive|background)/.test(appState.current) && nextAppState === 'active') {
        void loadFeatures();
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [loadFeatures]);

  // Refresh when tab gains focus (user returns from settings, etc.)
  useFocusEffect(
    useCallback(() => {
      void loadFeatures();
    }, [loadFeatures]),
  );

  const visibleItems = TOGGLEABLE.filter((item) => features[item.key]);
  const gridItems: GridEntry[] = [...ALWAYS_VISIBLE, ...visibleItems];

  return (
    <View
      style={[
        styles.grid,
        { backgroundColor: theme.backgroundElement },
      ]}
    >
      {gridItems.map((item) => (
        <GridItem
          key={item.url}
          url={item.url}
          icon={item.icon}
          text={item.text}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 15,
    borderRadius: 8,
    marginHorizontal: 8,
    alignSelf: 'center',
  },
});
