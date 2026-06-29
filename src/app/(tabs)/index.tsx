import { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, RefreshControl } from 'react-native';
import { useDebouncedPush } from '@/utils/useDebouncedPush';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed/ThemedView';
import { HeadStatus } from '@/components/layout/HeadStatus';
import { IndexSwiper } from '@/components/feature/IndexSwiper';
import { GridContainer } from '@/components/layout/GridContainer';
import { MaterialIcon } from '@/components/base/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import userManager from '@/service/userInfo';
import { getBanner } from '@/service/hubt/Banner';

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const push = useDebouncedPush();
  const [bannerList, setBannerList] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch banners only when logged in (original Taro logic)
  const fetchBanners = useCallback(async () => {
    if (!userManager.checkLogin()) return;
    try {
      const images = await getBanner();
      if (images.length > 0) setBannerList(images);
    } catch {
      // Keep existing banners
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { void fetchBanners(); }, 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear banners on logout (matching Taro useDidShow)
  const wasLoggedIn = useRef(userManager.checkLogin());
  useEffect(() => {
    const loggedIn = userManager.checkLogin();
    if (wasLoggedIn.current && !loggedIn) {
      setBannerList([]);
    }
    wasLoggedIn.current = loggedIn;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (!userManager.checkLogin()) { setRefreshing(false); return; }
    try {
      const images = await getBanner(true);
      if (images.length > 0) setBannerList(images);
    } catch {
      // Keep existing banners
    } finally {
      setRefreshing(false);
    }
  }, []);

  const isDark = theme.background === '#000000';
  // Match original Taro SafeAreaView gradient
  const gradientColors: [string, ...string[]] = isDark
    ? ['rgb(26,29,46)', 'rgb(35,39,64)', 'rgb(26,29,46)']
    : ['#47a5fd', '#cce5ff', '#f2f5f9'];

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.28, 1]}
        style={[styles.gradient, { paddingTop: insets.top + 8 }]}
      >
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              colors={['#47a5fd']} tintColor="#47a5fd" />
          }
        >
          {/* Header with weather */}
          <HeadStatus text="首页">
            <TouchableOpacity style={styles.weatherBtn} onPress={() => push('/weather')}>
              <MaterialIcon name="weather-sunny" color="#47a5fd" size={20} />
              <Text style={styles.weatherTemp}>天气</Text>
            </TouchableOpacity>
          </HeadStatus>

          {/* Banner */}
          <IndexSwiper bannerList={bannerList} />

          {/* Feature Grid */}
          <GridContainer />

          <View style={{ height: 120 }} />
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 8,
  },
  weatherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
    gap: 2,
  },
  weatherTemp: {
    fontSize: 15,
    color: '#47a5fd',
    fontWeight: '500',
  },
});
