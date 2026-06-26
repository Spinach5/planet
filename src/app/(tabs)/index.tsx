import { View, Text, StyleSheet, Dimensions, Image, ScrollView, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useCallback } from 'react';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 轮播图数据
const bannerList = [
  { id: 1, image: require('@/assets/images/tower.jpeg') },
  { id: 2, image: require('@/assets/images/p1.jpg') },
  { id: 3, image: require('@/assets/images/p2.jpg') },
  { id: 4, image: require('@/assets/images/p3.jpg') },
];

// 功能图标
const gridItems = [
  { icon: require('@/assets/images/functionIcons/Workgroup.png'), text: '学生会' },
  { icon: require('@/assets/images/functionIcons/社团.png'), text: '社团' },
  { icon: require('@/assets/images/functionIcons/餐饮.png'), text: '美食' },
  { icon: require('@/assets/images/functionIcons/行政地标.png'), text: '行政事务' },
  { icon: require('@/assets/images/functionIcons/手绘书本.png'), text: '书籍资料' },
  { icon: require('@/assets/images/functionIcons/日常用品.png'), text: '日常用品' },
  { icon: require('@/assets/images/functionIcons/世界地图.png'), text: '地图' },
  { icon: require('@/assets/images/functionIcons/书本.png'), text: '二手书' },
];

function SwiperBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    setActiveIndex(index);
  }, []);

  return (
    <View style={swiperStyles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={swiperStyles.scrollView}
      >
        {bannerList.map((item) => (
          <View key={item.id} style={swiperStyles.slide}>
            <Image source={item.image} style={swiperStyles.image} resizeMode="cover" />
          </View>
        ))}
      </ScrollView>
      <View style={swiperStyles.dots}>
        {bannerList.map((_, idx) => (
          <View
            key={`dot-${String(bannerList[idx].id)}`}
            style={[
              swiperStyles.dot,
              idx === activeIndex ? swiperStyles.dotActive : null,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const swiperStyles = StyleSheet.create({
  container: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#ddd',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH - Spacing.three * 2,
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 20,
  },
});

function GridContainer() {
  return (
    <ThemedView style={gridStyles.container}>
      {gridItems.map((item) => (
        <View key={item.text} style={gridStyles.item}>
          <View style={gridStyles.iconWrapper}>
            <Image source={item.icon} style={gridStyles.icon} resizeMode="contain" />
          </View>
          <Text style={gridStyles.text}>{item.text}</Text>
        </View>
      ))}
    </ThemedView>
  );
}

const gridStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
  },
  item: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: '#f0f0f3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  icon: {
    width: 28,
    height: 28,
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
});

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* 头部 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>首页</Text>
        </View>

        {/* 轮播图 */}
        <SwiperBanner />

        {/* 功能网格 */}
        <GridContainer />

        {/* 公告/活动区域 */}
        <ThemedView style={styles.card}>
          <View style={styles.cardInner}>
            <Text style={styles.cardText}>最终可能展示公告或活动</Text>
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  header: {
    paddingVertical: Spacing.two,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    borderRadius: 12,
    backgroundColor: '#fff',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardInner: {
    padding: Spacing.three,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
  },
});
