import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, RefreshControl, useWindowDimensions } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useDebouncedPush } from '@/utils/useDebouncedPush';
import { ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HeadStatus } from '@/components/HeadStatus';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';
import { getBookList, getBookCategories, type BookItem } from '@/service/server/books';
import userManager from '@/service/userInfo';
import { getColorFromName } from '@/utils/color';

const BOOK_TYPE_OPTIONS = [
  { label: '全部', value: '' },
  { label: '出售', value: '1' },
  { label: '求购', value: '2' },
];

function sortBooks(list: BookItem[], sort: string): BookItem[] {
  return [...list].sort((a, b) => {
    const aTime = (a as Record<string,unknown>).publishTime as string ?? '';
    const bTime = (b as Record<string,unknown>).publishTime as string ?? '';
    if (sort === 'hot') return (b.wantCount || 0) - (a.wantCount || 0);
    return bTime.localeCompare(aTime);
  });
}

export default function BooksPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets(); const { width: sw } = useWindowDimensions();
  const push = useDebouncedPush(); const { showToast } = useToast();
  const [allBooks, setAllBooks] = useState<BookItem[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [bookType, setBookType] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sortMode, setSortMode] = useState<'time' | 'hot'>('time');
  const [loading, setLoading] = useState<'loading' | 'done' | 'empty' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  const fetchList = useCallback(async (force = false) => {
    try {
      const data = await getBookList(force);
      setAllBooks(data.books || []);
      setTotal(data.total || 0);
      const hasData = (data.books || []).length > 0;
      setLoading(hasData ? 'done' : 'empty');
    } catch {
      showToast({ message: '加载失败', type: 'error' });
      if (allBooks.length === 0) setLoading('error');
    } finally {
      setRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast]);

  const fetchCategories = useCallback(async () => {
    try { const cats = await getBookCategories(); setCategories((cats || []).filter((c: string) => c !== '全部')); } catch { /* */ }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchCategories();
      void fetchList();
    }, [fetchList, fetchCategories]),
  );

  const books = useMemo(() => {
    let list = [...allBooks];
    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter((b) => b.name.toLowerCase().includes(kw) || (b.publisher ?? '').toLowerCase().includes(kw));
    }
    if (bookType) {
      list = list.filter((b) => String((b as Record<string,unknown>).book_type ?? '1') === bookType);
    }
    if (selectedCats.length > 0) {
      list = list.filter((b) => selectedCats.includes(b.category));
    }
    return sortBooks(list, sortMode);
  }, [allBooks, keyword, bookType, selectedCats, sortMode]);

  const cardW = (sw - 16 - 8) / 2; // sw - padding(8*2) - gap(8)
  const isDark = theme.background === '#000000';

  const getTypeTag = (b: BookItem) => {
    if (String((b as Record<string,unknown>).book_type ?? '') === '2') return { label: '求购', cls: st.tagBuy };
    return { label: '出售', cls: st.tagSell };
  };

  return (
    <ThemedView style={st.outer}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[st.grad,{paddingTop:insets.top+8}]}>
        <View style={st.hdr}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text="书籍" /></View>
        <ScrollView
          style={st.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);void fetchList(true);}} colors={['#47a5fd']} tintColor="#47a5fd" />}
        >
          {/* Trade buttons */}
          <View style={st.tradeRow}>
            <TouchableOpacity style={st.tradeBtnSell} onPress={()=>push('/books-edit')} activeOpacity={0.85}>
              <MaterialIcon name="book-plus-multiple" size={22} color="#fff" />
              <Text style={st.tradeBtnText}>我要卖书</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.tradeBtnBuy} onPress={()=>push('/books-edit')} activeOpacity={0.85}>
              <MaterialIcon name="cart" size={22} color="#fff" />
              <Text style={st.tradeBtnText}>我要买书</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[st.searchWrap,{backgroundColor:theme.surface}]}>
            <MaterialIcon name="magnify" size={16} color="#999" />
            <TextInput style={[st.searchInput,{color:theme.text}]} value={keyword} onChangeText={setKeyword} placeholder="搜索书名/书号" placeholderTextColor="#999" />
          </View>

          {/* Type filter */}
          <View style={st.typeBar}>
            {BOOK_TYPE_OPTIONS.map((opt, idx) => {
              const active = bookType === opt.value;
              const isFirst = idx === 0;
              const isLast = idx === BOOK_TYPE_OPTIONS.length - 1;
              return (
                <TouchableOpacity key={opt.value} style={[st.typeChip, active&&st.typeChipActive, isFirst&&st.typeChipFirst, isLast&&st.typeChipLast]} onPress={()=>setBookType(opt.value)}>
                  <Text style={[st.typeText,active&&st.typeTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[st.divider,{backgroundColor:theme.backgroundElement}]} />

          {/* Category multi-select */}
          {categories.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.catScroll} contentContainerStyle={st.catContent}>
              {categories.map((cat) => {
                const active = selectedCats.includes(cat);
                return (
                  <TouchableOpacity key={cat} style={[st.catChip,active&&st.catChipActive]} onPress={()=>setSelectedCats((prev)=>prev.includes(cat)?prev.filter((c)=>c!==cat):[...prev,cat])}>
                    <Text style={[st.catText,active&&st.catTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}

          {/* Sort */}
          <View style={st.sortBar}>
            <View style={st.sortLeft}>
              <MaterialIcon name={sortMode==='time'?'clock':'fire'} size={18} color={theme.text} />
              <Text style={[st.sortLabel,{color:theme.text}]}>{sortMode==='time'?'最新书籍':'最热书籍'}</Text>
            </View>
            <TouchableOpacity style={st.sortRight} onPress={()=>setSortMode((p)=>p==='time'?'hot':'time')}>
              <MaterialIcon name="swap-vertical" size={16} color={theme.text} />
              <Text style={[st.sortToggle,{color:theme.text}]}>{sortMode==='time'?'按时间排序':'按热度排序'}</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading === 'loading' && allBooks.length === 0 ? (
            <View style={st.grid}>
              {[1,2,3,4].map((i)=>(<View key={i} style={[st.card,{width:cardW,backgroundColor:theme.backgroundElement}]}><View style={[st.cardImg,{backgroundColor:'#ddd'}]} /><View style={st.cardBody}><View style={st.skel} /><View style={[st.skel,{width:'60%'}]} /><View style={[st.skel,{width:'40%'}]} /></View></View>))}
            </View>
          ) : loading === 'error' ? (
            <TouchableOpacity style={st.retry} onPress={()=>{setLoading('loading');void fetchList();}}><Text style={[st.retryText,{color:theme.textSecondary}]}>加载失败，点击重试</Text></TouchableOpacity>
          ) : books.length === 0 ? (
            <View style={st.empty}><Text style={[st.emptyText,{color:theme.textSecondary}]}>{allBooks.length>0?'暂无匹配的书籍':'暂无书籍'}</Text></View>
          ) : (
            <View style={st.grid}>
              {books.map((book) => {
                const typeTag = getTypeTag(book);
                const imgUrl = book.images && book.images.length > 0 ? book.images[0].url : null;
                const hasImg = !!imgUrl && !imgErrors[book.id];
                return (
                  <TouchableOpacity key={String(book.id)} style={[st.card,{width:cardW,backgroundColor:theme.surface}]} onPress={()=>push(`/books-detail?id=${book.id}`)} activeOpacity={0.85}>
                    <View style={st.cardImg}>
                      {hasImg ? (
                        <Image source={{uri:imgUrl}} style={st.cardImgPic} onError={()=>setImgErrors((p)=>({...p,[book.id]:true}))} />
                      ) : (
                        <View style={[st.cardImgPlaceholder,{backgroundColor:getColorFromName(book.name||'书')}]}>
                          <Text style={st.imgPlaceholderText}>{(book.name||'书')[0]}</Text>
                        </View>
                      )}
                      <View style={[st.imgTag,typeTag.cls]}><Text style={st.imgTagText}>{typeTag.label}</Text></View>
                    </View>
                    <View style={st.cardBody}>
                      <Text style={[st.bookName,{color:theme.text}]} numberOfLines={1}>{book.name}</Text>
                      <Text style={[st.bookCat,{color:theme.textSecondary}]}>{book.category||'未分类'}</Text>
                      <View style={st.priceRow}>
                        <Text style={st.price}><Text style={st.priceSym}>¥</Text>{book.price}</Text>
                        <Text style={[st.want,{color:theme.textSecondary}]}>{book.wantCount||0}人想要</Text>
                      </View>
                      <View style={st.pubRow}>
                        <View style={[st.pubAvatar,{backgroundColor:getColorFromName(book.publisherName||'?')}]}>
                          <Text style={st.pubAvatarText}>{(book.publisherName||'?')[0]}</Text>
                        </View>
                        <Text style={[st.pubName,{color:theme.textSecondary}]} numberOfLines={1}>{book.publisherName||'未知'}</Text>
                      </View>
                      <View style={st.deliveryRow}>
                        <Text style={[st.deliveryTag,book.isDelivery===1?st.deliverySend:st.deliveryPickup]}>{book.isDelivery===1?'可送':'自提'}</Text>
                        {book.isPublisher ? <Text style={st.ownerTag}>自己</Text> : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {allBooks.length > 0 && allBooks.length >= total ? (
            <View style={st.footer}><Text style={st.footerText}>— 已加载全部 —</Text></View>
          ) : null}
          <View style={{height:100}} />
        </ScrollView>

        {/* FAB — messages */}
        <TouchableOpacity style={st.fab} onPress={()=>push('/chat-list')} activeOpacity={0.8}>
          <MaterialIcon name="message-text-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>
    </ThemedView>
  );
}

const st = StyleSheet.create({
  outer:{flex:1},grad:{flex:1},scroll:{flex:1},
  hdr:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4,paddingHorizontal:8},
  // Trade buttons
  tradeRow:{flexDirection:'row',gap:10,paddingHorizontal:12,paddingTop:8},
  tradeBtnSell:{flex:1,height:44,borderRadius:8,backgroundColor:'#f09819',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6},
  tradeBtnBuy:{flex:1,height:44,borderRadius:8,backgroundColor:'#47a5fd',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6},
  tradeBtnText:{fontSize:15,fontWeight:'700',color:'#fff'},
  // Search
  searchWrap:{flexDirection:'row',alignItems:'center',marginHorizontal:12,marginTop:8,borderRadius:18,paddingHorizontal:12,height:36,gap:8},
  searchInput:{flex:1,fontSize:14,paddingVertical:0},
  // Type filter
  typeBar:{flexDirection:'row',paddingHorizontal:12,paddingTop:8},
  typeChip:{flex:1,alignItems:'center',paddingVertical:10,backgroundColor:'#f0f1f4'},
  typeChipFirst:{borderTopLeftRadius:16,borderBottomLeftRadius:16},
  typeChipLast:{borderTopRightRadius:16,borderBottomRightRadius:16},
  typeChipActive:{backgroundColor:'#47a5fd'},
  typeText:{fontSize:14,fontWeight:'700',color:'#666'},
  typeTextActive:{color:'#fff'},
  divider:{height:1,marginHorizontal:12,marginTop:8},
  // Categories
  catScroll:{maxHeight:40,marginTop:6},
  catContent:{flexDirection:'row',gap:8,paddingHorizontal:12},
  catChip:{paddingHorizontal:14,paddingVertical:5,borderRadius:16,backgroundColor:'#e8e8e8'},
  catChipActive:{backgroundColor:'#47a5fd'},
  catText:{fontSize:13,color:'#666'},
  catTextActive:{color:'#fff'},
  // Sort
  sortBar:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:12,paddingVertical:6},
  sortLeft:{flexDirection:'row',alignItems:'center',gap:4},
  sortLabel:{fontSize:13,fontWeight:'700'},
  sortRight:{flexDirection:'row',alignItems:'center',gap:4},
  sortToggle:{fontSize:12},
  // Grid
  grid:{flexDirection:'row',flexWrap:'wrap',padding:4,gap:8},
  card:{borderRadius:8,overflow:'hidden',marginBottom:4},
  cardImg:{width:'100%',height:170,overflow:'hidden'},
  cardImgPic:{width:'100%',height:'100%'},
  cardImgPlaceholder:{width:'100%',height:'100%',alignItems:'center',justifyContent:'center'},
  imgPlaceholderText:{fontSize:40,color:'#fff',fontWeight:'700'},
  imgTag:{position:'absolute',top:6,left:6,paddingHorizontal:8,paddingVertical:2,borderRadius:4},
  imgTagText:{fontSize:11,fontWeight:'700',color:'#fff'},
  tagSell:{backgroundColor:'rgba(240,152,25,0.9)'},
  tagBuy:{backgroundColor:'rgba(71,165,253,0.9)'},
  // Card body
  cardBody:{padding:8,gap:3},
  bookName:{fontSize:14,fontWeight:'700'},
  bookCat:{fontSize:11},
  priceRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'baseline'},
  price:{color:'#e74c3c',fontWeight:'700',fontSize:15},
  priceSym:{fontSize:11},
  want:{fontSize:10},
  pubRow:{flexDirection:'row',alignItems:'center',gap:4,marginTop:2},
  pubAvatar:{width:20,height:20,borderRadius:10,alignItems:'center',justifyContent:'center'},
  pubAvatarText:{fontSize:10,color:'#fff',fontWeight:'700'},
  pubName:{fontSize:11,flex:1},
  deliveryRow:{marginTop:2,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  deliveryTag:{fontSize:10,paddingHorizontal:6,paddingVertical:1,borderRadius:3,overflow:'hidden'},
  deliveryPickup:{backgroundColor:'#fff3e0',color:'#e67e22'},
  deliverySend:{backgroundColor:'#e8f5e9',color:'#27ae60'},
  ownerTag:{fontSize:10,paddingHorizontal:6,paddingVertical:1,borderRadius:3,backgroundColor:'#e3f2fd',color:'#1565c0',overflow:'hidden'},
  // Skeleton
  skel:{height:10,backgroundColor:'#ddd',borderRadius:3,marginBottom:4},
  // Empty / error
  retry:{alignItems:'center',paddingTop:100},
  retryText:{fontSize:15},
  empty:{alignItems:'center',paddingTop:100},
  emptyText:{fontSize:15},
  footer:{alignItems:'center',paddingVertical:12},
  footerText:{fontSize:12,color:'#ccc'},
  // FAB
  fab:{position:'absolute',right:20,bottom:80,width:50,height:50,borderRadius:25,backgroundColor:'#47a5fd',alignItems:'center',justifyContent:'center',elevation:6,shadowColor:'#47a5fd',shadowOffset:{width:0,height:3},shadowOpacity:0.35,shadowRadius:12},
});
