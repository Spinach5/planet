import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator } from 'react-native-paper';
import { ThemedView } from '@/components/themed/ThemedView';
import { ThemedText } from '@/components/themed/ThemedText';
import { HeadStatus } from '@/components/layout/HeadStatus';
import { MaterialIcon } from '@/components/base/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';
import cacheManager from '@/utils/cache';
import { getBookDetail, deleteBook, toggleWantBook, type BookItem } from '@/service/server/books';
import { createConversation } from '@/service/server/chat';

function getColorFromName(name: string): string {
  let hash = 0; for (let i=0;i<name.length;i++){hash=(hash<<5)-hash+name.charCodeAt(i);hash|=0;}
  return `hsl(${String(Math.abs(hash)%360)},70%,55%)`;
}

export default function BooksDetailPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets(); const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [book, setBook] = useState<BookItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [favLoading, setFavLoading] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<number,boolean>>({});
  const isDark = theme.background === '#000000';

  useEffect(() => {
    if (!id) { showToast({message:'无效的书籍',type:'error'}); router.back(); return; }
    void (async()=>{try{
      const data = await getBookDetail(Number(id));
      if(data){setBook(data);}else{showToast({message:'书籍不存在',type:'error'});router.back();}
    }catch{showToast({message:'加载失败',type:'error'});}finally{setLoading(false);}})();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const handleFav = useCallback(async()=>{
    if(favLoading||!book)return;setFavLoading(true);
    try{
      const result = await toggleWantBook(book.id);
      setIsFav(result.wanted);
      setBook({...book,wantCount:result.want_count});
      // Invalidate list cache so it fetches fresh data with updated want count
      void cacheManager.removeAsync('v1_books');
    }catch{
      showToast({message:'操作失败',type:'error'});
    }finally{setFavLoading(false);}
  },[favLoading,book,showToast]);

  const handleTalk = useCallback(async ()=>{
    try {
      const result = await createConversation(book!.id);
      const convId = result.id || result.conversation_id;
      if (!convId) { showToast({message:'发起会话失败',type:'error'}); return; }
      const coverUrl = book?.images?.[0]?.url ?? '';
      router.push(`/chat-detail?conversationId=${convId}&name=${encodeURIComponent(book?.publisherName||'')}&bookName=${encodeURIComponent(book?.name||'')}&bookImage=${encodeURIComponent(coverUrl)}&bookPrice=${encodeURIComponent(String(book?.price||''))}&isDelivery=${book?.isDelivery||0}`);
    } catch { showToast({message:'请先登录',type:'error'}); }
  },[book]);

  const handleDelete = useCallback(()=>{
    Alert.alert('确认删除',`是否删除《${book?.name}》？`,[
      {text:'取消',style:'cancel'},
      {text:'确定',style:'destructive',onPress:()=>{
        void (async()=>{
          try {
            const res = await deleteBook(book!.id);
            if (res?.success) {
              showToast({message:'已删除',type:'success'});
              setTimeout(()=>router.back(),1000);
            } else {
              showToast({message:res?.message||'删除失败',type:'error'});
            }
          } catch { showToast({message:'删除失败',type:'error'}); }
        })();
      }},
    ]);
  },[book,showToast]);

  if(loading){return(<ThemedView style={s.outer}><Stack.Screen options={{headerShown:false}}/><LinearGradient colors={isDark?['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)']:['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[s.grad,{paddingTop:insets.top+8}]}><View style={s.hdr}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff"/></TouchableOpacity><HeadStatus text="书籍详情"/></View><View style={s.center}><ActivityIndicator size="large" color={theme.primary}/></View></LinearGradient></ThemedView>);}
  if(!book)return null;
  const images=book.images||[];
  const isBuy=String(book.book_type)==='2';

  return(<ThemedView style={s.outer}><Stack.Screen options={{headerShown:false}}/><LinearGradient colors={isDark?['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)']:['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[s.grad,{paddingTop:insets.top+8}]}>
    <View style={s.hdr}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff"/></TouchableOpacity><HeadStatus text="书籍详情"/></View>
    <ScrollView style={s.scroll} contentContainerStyle={{paddingBottom:80}}>
      {/* Publisher card — avatar + name + type tag in rounded card */}
      <View style={[s.pubCard,{backgroundColor:theme.surface}]}>
        <View style={s.pubInfo}>
          <View style={[s.pubAvatar,{backgroundColor:getColorFromName(book.publisherName||'?')}]}><Text style={s.pubAvatarText}>{(book.publisherName||'?')[0]}</Text></View>
          <Text style={[s.pubName,{color:theme.text}]}>{book.publisherName||'未知'}</Text>
          <View style={[s.typeTag,isBuy?s.typeBuy:s.typeSell]}><Text style={s.typeTagText}>{isBuy?'求购':'出售'}</Text></View>
        </View>
      </View>
      <Text style={[s.pubTime,{color:theme.textSecondary}]}>发布于 {book.publishTime?.slice(0,10)||''}</Text>
      {/* Title + status */}
      <View style={s.titleRow}>
        <Text style={[s.title,{color:theme.text}]}>{book.name}</Text>
        {book.status!=null&&<Text style={[s.statusText,{color:theme.textSecondary}]}>交易状态：{['发布中','交易中','已下架'][book.status]||'未知'}</Text>}
      </View>
      {/* Price + delivery */}
      <View style={s.priceRow}>
        <View>
          <Text style={[s.priceLabel,{color:theme.textSecondary}]}>{isBuy?'期望价格':'预估售价'}</Text>
          <Text style={s.price}><Text style={s.priceSym}>¥</Text>{book.price}</Text>
          <Text style={[s.wantCount,{color:theme.textSecondary}]}>{isBuy?`${book.wantCount||0}人想卖`:`${book.wantCount||0}人想要`}</Text>
        </View>
        <View style={[s.deliveryBadge,book.isDelivery===1?s.deliverySend:s.deliveryPickup]}><Text style={[s.deliveryBadgeText,{color:book.isDelivery===1?'#27ae60':'#e67e22'}]}>{book.isDelivery===1?'可送':'自提'}</Text></View>
      </View>
      {/* Description */}
      {book.description?<Text style={[s.desc,{color:theme.textSecondary}]}>{book.description}</Text>:null}
      {/* Info sliders — single continuous bar with internal dividers */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.infoSlider} contentContainerStyle={s.infoSliderInner}>
        <View style={[s.infoBar,{backgroundColor:theme.surface}]}>
          <View style={s.infoItem}><Text style={[s.infoLabel,{color:theme.textSecondary}]}>种类</Text><Text style={[s.infoValue,{color:theme.text}]}>{book.category||'未分类'}</Text></View>
          <View style={[s.infoDiv,{backgroundColor:theme.backgroundElement}]}/>
          <View style={s.infoItem}><Text style={[s.infoLabel,{color:theme.textSecondary}]}>成色</Text><Text style={[s.infoValue,{color:theme.text}]}>{book.condition||'未知'}</Text></View>
          <View style={[s.infoDiv,{backgroundColor:theme.backgroundElement}]}/>
          <View style={s.infoItem}><Text style={[s.infoLabel,{color:theme.textSecondary}]}>作者</Text><Text style={[s.infoValue,{color:theme.text}]}>{book.author||'无'}</Text></View>
          <View style={[s.infoDiv,{backgroundColor:theme.backgroundElement}]}/>
          <View style={s.infoItem}><Text style={[s.infoLabel,{color:theme.textSecondary}]}>出版社</Text><Text style={[s.infoValue,{color:theme.text}]}>{book.publisher||'无'}</Text></View>
          <View style={[s.infoDiv,{backgroundColor:theme.backgroundElement}]}/>
          <View style={s.infoItem}><Text style={[s.infoLabel,{color:theme.textSecondary}]}>ISBN</Text><Text style={[s.infoValue,{color:theme.text}]}>{book.isbn||'暂无'}</Text></View>
        </View>
      </ScrollView>
      {/* Images */}
      {images.length>0?<View style={s.imgGrid}>{images.map((img,idx)=>imgErrors[idx]?null:<Image key={idx} source={{uri:img.url}} style={s.img} resizeMode="contain" onError={()=>setImgErrors(p=>({...p,[idx]:true}))}/>)}</View>:<View style={[s.noImg,{backgroundColor:theme.backgroundElement}]}><Text style={[s.noImgText,{color:theme.textSecondary}]}>暂无图片</Text></View>}
    </ScrollView>
    {/* Bottom bar */}
    <View style={[s.bottom,{backgroundColor:theme.surface,borderTopColor:theme.backgroundElement}]}>
      <TouchableOpacity style={[s.favBtn,isFav&&s.favBtnActive]} onPress={handleFav}>
        <MaterialIcon name={isFav?'heart':'heart-outline'} size={22} color={isFav?'#e74c3c':theme.text}/>
        <Text style={[s.favText,{color:isFav?'#e74c3c':theme.text}]}>{isFav?'已收藏':'收藏'}</Text>
      </TouchableOpacity>
      {book.isPublisher?<>
        <TouchableOpacity style={[s.editBtn,{backgroundColor:theme.primaryContainer}]} onPress={()=>router.push(`/books-edit?id=${book.id}`)}><Text style={[s.editBtnText,{color:theme.primary}]}>编辑</Text></TouchableOpacity>
        <TouchableOpacity style={[s.delBtn,{backgroundColor:'#fce4ec'}]} onPress={handleDelete}><Text style={{color:'#c62828',fontWeight:'600'}}>删除</Text></TouchableOpacity>
      </>:<TouchableOpacity style={[s.contactBtn,{backgroundColor:theme.primary}]} onPress={handleTalk}><Text style={s.contactBtnText}>联系</Text></TouchableOpacity>}
    </View>
  </LinearGradient></ThemedView>);
}

const s=StyleSheet.create({
  outer:{flex:1},grad:{flex:1},scroll:{flex:1},hdr:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4,paddingHorizontal:8},center:{flex:1,alignItems:'center',justifyContent:'center'},
  pubCard:{marginHorizontal:12,marginTop:8,borderRadius:12,padding:12},
  pubInfo:{flexDirection:'row',alignItems:'center',gap:8},pubAvatar:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center'},pubAvatarText:{fontSize:16,color:'#fff',fontWeight:'700'},pubName:{fontSize:15,fontWeight:'600',flex:1},
  typeTag:{paddingHorizontal:8,paddingVertical:2,borderRadius:4},typeTagText:{fontSize:11,fontWeight:'700',color:'#fff'},typeSell:{backgroundColor:'rgba(240,152,25,0.9)'},typeBuy:{backgroundColor:'rgba(71,165,253,0.9)'},
  pubTime:{fontSize:12,paddingHorizontal:20,marginTop:4},
  titleRow:{paddingHorizontal:12,paddingTop:8},title:{fontSize:22,fontWeight:'700'},statusText:{fontSize:13,marginTop:4},
  priceRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:12,paddingTop:12},
  priceLabel:{fontSize:13},price:{fontSize:32,fontWeight:'700',color:'#e74c3c'},priceSym:{fontSize:18},wantCount:{fontSize:12,marginTop:2},
  deliveryBadge:{paddingHorizontal:14,paddingVertical:6,borderRadius:16},deliveryBadgeText:{fontSize:13,fontWeight:'600'},
  deliveryPickup:{backgroundColor:'#fff3e0'},deliverySend:{backgroundColor:'#e8f5e9'},
  desc:{paddingHorizontal:12,paddingTop:12,fontSize:14,lineHeight:22},
  infoSlider:{marginTop:12,marginHorizontal:12},infoSliderInner:{paddingHorizontal:0},
  infoBar:{flexDirection:'row',alignItems:'center',borderRadius:12,overflow:'hidden'},
  infoItem:{paddingHorizontal:18,paddingVertical:10,alignItems:'center'},
  infoLabel:{fontSize:11,marginBottom:2},infoValue:{fontSize:13,fontWeight:'600'},
  infoDiv:{width:StyleSheet.hairlineWidth,height:24},
  imgGrid:{marginTop:12,gap:4},img:{width:'100%',aspectRatio:3/4,borderRadius:0},
  noImg:{margin:12,height:200,borderRadius:12,alignItems:'center',justifyContent:'center'},noImgText:{fontSize:15},
  bottom:{flexDirection:'row',alignItems:'center',position:'absolute',bottom:0,left:0,right:0,padding:10,paddingBottom:30,borderTopWidth:StyleSheet.hairlineWidth,gap:8},
  favBtn:{alignItems:'center',paddingHorizontal:10},favBtnActive:{},favText:{fontSize:12,marginTop:2},
  editBtn:{flex:1,alignItems:'center',paddingVertical:12,borderRadius:8},editBtnText:{fontSize:15,fontWeight:'600'},
  delBtn:{flex:1,alignItems:'center',paddingVertical:12,borderRadius:8},
  contactBtn:{flex:1,alignItems:'center',paddingVertical:14,borderRadius:10},contactBtnText:{fontSize:16,fontWeight:'700',color:'#fff'},
});
