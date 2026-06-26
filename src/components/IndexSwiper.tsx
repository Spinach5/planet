import { useState, useRef, useCallback } from 'react';
import { View, Image, StyleSheet, useWindowDimensions, FlatList, Text } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

const SWIPER_HEIGHT = 180;

interface BannerItem {
  id: string;
  url?: string;
  label?: string;
}

const DEFAULT_BANNERS: BannerItem[] = [
  { id: 'default-1', label: '校园服务' },
];

interface IndexSwiperProps {
  bannerList?: string[];
}

/**
 * Home page banner carousel.
 * Replaces Taro's IndexSwiper with Swiper/SwiperItem.
 * Shows banner images or a placeholder with gradient background.
 */
export function IndexSwiper({ bannerList }: IndexSwiperProps) {
  const theme = useTheme();
  const { width: screenW } = useWindowDimensions();
  const flatListRef = useRef<FlatList<BannerItem>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const hasBanners = bannerList && bannerList.length > 0;
  const items: BannerItem[] = hasBanners
    ? bannerList.map((url, idx) => ({ id: `banner-${String(idx)}`, url }))
    : DEFAULT_BANNERS;

  const onScroll = useCallback((event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / screenW);
    setActiveIndex(index);
  }, [screenW]);

  const slideW = screenW - 16;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={items}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: slideW }]}>
            {item.url ? (
              <Image
                source={{ uri: item.url }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>{item.label}</Text>
              </View>
            )}
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
      {/* Dot indicators */}
      <View style={styles.dots}>
        {items.map((item, idx) => (
          <View
            key={item.id}
            style={[
              styles.dot,
              idx === activeIndex && { backgroundColor: theme.primary },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: SWIPER_HEIGHT,
    overflow: 'hidden',
    marginBottom: 10,
    marginHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  slide: {
    height: SWIPER_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#47a5fd',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 8,
    width: '100%',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
