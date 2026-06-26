import { useState, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';

interface Book {
  id: string;
  name: string;
  price: number;
  publisher: string;
  image: string;
  tags: string[];
}

const mockBooks: Book[] = [
  { id: '1', name: '数据结构（C语言版）', price: 15, publisher: '清华大学出版社', image: '', tags: ['教材', '计算机'] },
  { id: '2', name: '高等数学（第七版）上册', price: 12, publisher: '高等教育出版社', image: '', tags: ['教材', '数学'] },
  { id: '3', name: '大学英语综合教程1', price: 8, publisher: '上海外语教育出版社', image: '', tags: ['教材', '英语'] },
  { id: '4', name: 'C程序设计（第五版）', price: 20, publisher: '清华大学出版社', image: '', tags: ['教材', '计算机'] },
];

export default function BooksPage() {
  const theme = useTheme();
  // eslint-disable-next-line react/hook-use-state
  const [books] = useState<Book[]>(mockBooks);
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filteredBooks = searchText
    ? books.filter((b) => b.name.includes(searchText) || b.publisher.includes(searchText))
    : books;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} themeColor="onPrimary">二手书</ThemedText>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/books-edit')} style={styles.actionBtn}>
            <MaterialIcon name="plus" size={24} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/chat-list')} style={styles.actionBtn}>
            <MaterialIcon name="message-text-outline" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.surfaceVariant }]}>
        <MaterialIcon name="magnify" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="搜索书名或出版社"
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />}
      >
        <View style={styles.bookGrid}>
          {filteredBooks.map((book) => (
            <TouchableOpacity key={book.id}
              style={[styles.bookCard, { backgroundColor: theme.surfaceVariant }]}
              onPress={() => router.push(`/books-detail?id=${book.id}`)}>
              <View style={[styles.bookCover, { backgroundColor: theme.primaryContainer }]}>
                <MaterialIcon name="book-open-page-variant" size={32} color={theme.primary} />
              </View>
              <ThemedText style={styles.bookName} numberOfLines={2}>{book.name}</ThemedText>
              <View style={styles.bookBottom}>
                <ThemedText style={[styles.bookPrice, { color: '#e74c3c' }]}>
                  ¥{book.price}
                </ThemedText>
                <ThemedText style={styles.bookPublisher} numberOfLines={1} themeColor="textSecondary">
                  {book.publisher}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#ffffff' },
  headerActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', margin: 12, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  scrollView: { flex: 1, padding: 16 },
  bookGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bookCard: { borderRadius: 12, padding: 10, width: '47%' },
  bookCover: { height: 120, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  bookName: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  bookBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookPrice: { fontSize: 16, fontWeight: '700' },
  bookPublisher: { fontSize: 11, flex: 1, marginLeft: 6, textAlign: 'right' },
});
