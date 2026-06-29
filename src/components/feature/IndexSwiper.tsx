import { useTheme } from "@/hooks/use-theme";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
} from "react-native";

const SWIPER_HEIGHT = 180;
const AUTO_SCROLL_INTERVAL = 3000;

interface BannerItem {
  id: string;
  url?: string;
  label?: string;
}

const DEFAULT_BANNERS: BannerItem[] = [{ id: "default-1", label: "校园服务" }];

interface IndexSwiperProps {
  bannerList?: string[];
}

/**
 * Home page banner carousel with auto-scroll and loop.
 */
export function IndexSwiper({ bannerList }: IndexSwiperProps) {
  const theme = useTheme();
  const { width: screenW } = useWindowDimensions();
  const flatListRef = useRef<FlatList<BannerItem>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserScrolling = useRef(false);

  const hasBanners = bannerList && bannerList.length > 0;
  const items: BannerItem[] = hasBanners
    ? bannerList.map((url, idx) => ({ id: `banner-${String(idx)}`, url }))
    : DEFAULT_BANNERS;
  const itemCount = items.length;

  const slideW = screenW - 16;

  const scrollTo = useCallback((index: number, animated = true) => {
    flatListRef.current?.scrollToIndex({ index, animated });
  }, []);

  // Stop auto-scroll timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Start auto-scroll timer
  const startTimer = useCallback(() => {
    stopTimer();
    if (itemCount <= 1) return;
    timerRef.current = setInterval(() => {
      if (isUserScrolling.current) return;
      setActiveIndex((prev) => {
        const next = prev + 1;
        if (next >= itemCount) {
          // Loop back to first — no animation for seamless loop
          requestAnimationFrame(() => scrollTo(0, false));
          return 0;
        }
        scrollTo(next, true);
        return next;
      });
    }, AUTO_SCROLL_INTERVAL);
  }, [itemCount, scrollTo, stopTimer]);

  useEffect(() => {
    startTimer();
    return stopTimer;
  }, [startTimer, stopTimer]);

  const onScrollBeginDrag = useCallback(() => {
    isUserScrolling.current = true;
    stopTimer();
  }, [stopTimer]);

  const onScrollEndDrag = useCallback(() => {
    isUserScrolling.current = false;
    startTimer();
  }, [startTimer]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / slideW);
      if (index !== activeIndex) setActiveIndex(index);
    },
    [activeIndex, slideW],
  );

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / slideW);
      setActiveIndex(index);
    },
    [slideW],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: slideW,
      offset: slideW * index,
      index,
    }),
    [slideW],
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={items}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        getItemLayout={getItemLayout}
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
      {/* Dot indicators — only show for multiple items */}
      {itemCount > 1 && (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: SWIPER_HEIGHT,
    overflow: "hidden",
    marginBottom: 10,
    marginHorizontal: 8,
    borderRadius: 8,
    alignSelf: "center",
  },
  slide: {
    height: SWIPER_HEIGHT,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#47a5fd",
  },
  placeholderText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 4,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 8,
    width: "100%",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
});
