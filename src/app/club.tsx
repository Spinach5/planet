import { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { ActivityIndicator } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';

const CATEGORIES = ['全部', '学术科技', '文化艺术', '体育竞技', '志愿服务', '创新创业'];

interface Club {
  id: string;
  name: string;
  category: string;
  nature: string;
  school: string;
  avatar: string;
  intro: string;
}

export default function ClubPage() {
  const theme = useTheme();
  const { showToast } = useToast();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('全部');

  const fetchClubs = useCallback(() => {
    setLoading(true);
    try {
      const mockClubs: Club[] = [
        { id: '1', name: '计算机协会', category: '学术科技', nature: '校级', school: '计算机学院', avatar: '', intro: '学习编程知识' },
        { id: '2', name: '摄影社', category: '文化艺术', nature: '校级', school: '艺术设计学院', avatar: '', intro: '用镜头记录生活' },
        { id: '3', name: '篮球队', category: '体育竞技', nature: '院级', school: '计算机学院', avatar: '', intro: '热血篮球' },
        { id: '4', name: '志愿者协会', category: '志愿服务', nature: '校级', school: '校团委', avatar: '', intro: '奉献爱心' },
      ];
      setClubs(mockClubs);
      setLoading(false);
      setRefreshing(false);
    } catch {
      showToast({ message: '获取社团列表失败', type: 'error' });
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = setTimeout(() => fetchClubs(), 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchClubs();
  }, [fetchClubs]);

  const filteredClubs = activeCategory === '全部'
    ? clubs
    : clubs.filter((c) => c.category === activeCategory);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} themeColor="onPrimary">社团</ThemedText>
        <TouchableOpacity onPress={() => router.push('/club-add')} style={styles.addBtn}>
          <MaterialIcon name="plus" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, { backgroundColor: cat === activeCategory ? theme.primary : theme.surfaceVariant }]}
            onPress={() => setActiveCategory(cat)}
          >
            <ThemedText style={[styles.categoryText, cat === activeCategory && { color: '#ffffff' }]}>
              {cat}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />}
      >
        {loading ? (
          <View style={styles.emptyView}><ActivityIndicator size="large" color={theme.primary} /></View>
        ) : filteredClubs.length === 0 ? (
          <View style={styles.emptyView}>
            <MaterialIcon name="account-group" size={48} color={theme.textSecondary} />
            <ThemedText style={styles.emptyText} themeColor="textSecondary">暂无社团</ThemedText>
          </View>
        ) : (
          <View style={styles.clubList}>
            {filteredClubs.map((club) => (
              <TouchableOpacity key={club.id}
                style={[styles.clubCard, { backgroundColor: theme.surfaceVariant }]}
                onPress={() => router.push(`/club-detail?id=${club.id}`)}>
                <View style={[styles.avatar, { backgroundColor: theme.primaryContainer }]}>
                  <ThemedText style={[styles.avatarText, { color: theme.primary }]}>
                    {club.name.charAt(0)}
                  </ThemedText>
                </View>
                <View style={styles.clubInfo}>
                  <ThemedText style={styles.clubName}>{club.name}</ThemedText>
                  <ThemedText style={styles.clubMeta} themeColor="textSecondary">
                    {club.category} · {club.nature} · {club.school}
                  </ThemedText>
                  <ThemedText style={styles.clubIntro} numberOfLines={1} themeColor="textSecondary">
                    {club.intro}
                  </ThemedText>
                </View>
                <MaterialIcon name="chevron-right" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#ffffff' },
  addBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  categoryScroll: { maxHeight: 48, paddingHorizontal: 12, paddingVertical: 8 },
  categoryChip: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8 },
  categoryText: { fontSize: 13, fontWeight: '500' },
  scrollView: { flex: 1, padding: 16 },
  emptyView: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, marginTop: 12 },
  clubList: { gap: 10 },
  clubCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, padding: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700' },
  clubInfo: { flex: 1 },
  clubName: { fontSize: 15, fontWeight: '600' },
  clubMeta: { fontSize: 12, marginTop: 2 },
  clubIntro: { fontSize: 12, marginTop: 2 },
});
