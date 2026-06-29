import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Modal } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ActivityIndicator } from 'react-native-paper';
import { ThemedView } from '@/components/themed/ThemedView';
import { ThemedText } from '@/components/themed/ThemedText';
import { HeadStatus } from '@/components/layout/HeadStatus';
import { MaterialIcon } from '@/components/base/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/utils/toast';
import cacheManager from '@/utils/cache';
import { createBook, updateBook, getBookDetail, getBookCategories, uploadBookImage } from '@/service/server/books';

const DRAFT_KEY = 'v1_book_draft';

const CONDITION_OPTIONS = ['全新', '几乎全新', '有笔记', '较旧'];

export default function BooksEditPage() {
  const theme = useTheme(); const insets = useSafeAreaInsets(); const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('几乎全新');
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isDelivery, setIsDelivery] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [showCat, setShowCat] = useState(false);
  // ISBN
  const [showIsbnModal, setShowIsbnModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isbnInput, setIsbnInput] = useState('');
  const [isbnFetching, setIsbnFetching] = useState(false);
  const [camPermission, requestCamPermission] = useCameraPermissions();
  const isDark = theme.background === '#000000';

  useEffect(() => {
    // Load draft if not editing (matches Taro)
    if (!isEdit) {
      void cacheManager.getAsync<Record<string, unknown>>(DRAFT_KEY).then((draft) => {
        if (!draft) return;
        if (draft.name) setName(String(draft.name));
        if (draft.author) setAuthor(String(draft.author));
        if (draft.publisher) setPublisher(String(draft.publisher));
        if (draft.isbn) setIsbn(String(draft.isbn));
        if (draft.category) setCategory(String(draft.category));
        if (draft.price) setPrice(String(draft.price));
        if (draft.condition) setCondition(String(draft.condition));
        if (draft.contact) setContact(String(draft.contact));
        if (draft.description) setDescription(String(draft.description));
        if (draft.isDelivery != null) setIsDelivery(Number(draft.isDelivery));
        if (Array.isArray(draft.images)) setImages(draft.images as string[]);
      });
    }
    void (async () => {
      try {
        const cats = await getBookCategories();
        setCategories(cats.filter((c) => c !== '全部'));
      } catch {/* */}
      if (isEdit) {
        try {
          const data = await getBookDetail(Number(id));
          if (data) {
            setName(data.name || ''); setAuthor(data.author || ''); setPublisher(data.publisher || '');
            setIsbn(data.isbn || ''); setCategory(data.category || ''); setPrice(String(data.price ?? ''));
            setCondition(data.condition || '几乎全新'); setContact(data.contact || '');
            setDescription(data.description || ''); setIsDelivery(data.isDelivery ?? 1);
            setImages((data.images || []).map((img) => img.url));
          }
        } catch { showToast({ message: '加载失败', type: 'error' }); }
      }
      setFetched(true);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveDraft = useCallback((silent = false) => {
    if (isEdit) return;
    const draft = { name, author, publisher, isbn, category, price, condition, contact, description, images, isDelivery };
    if (name || isbn || price || contact || images.length > 0) {
      void cacheManager.setAsync(DRAFT_KEY, draft);
      if (!silent) showToast({ message: '已保存为草稿', type: 'success' });
    }
  }, [isEdit, name, author, publisher, isbn, category, price, condition, contact, description, images, isDelivery, showToast]);

  const clearDraft = useCallback(() => { void cacheManager.removeAsync(DRAFT_KEY); }, []);

  const fetchIsbnInfo = useCallback(async (isbnCode: string) => {
    setIsbnFetching(true);
    try {
      const apiKey = 'ae1718d4587744b0b79f940fbef69e77';
      const resp = await fetch(`https://data.isbn.work/openApi/getInfoByIsbn?isbn=${encodeURIComponent(isbnCode)}&appKey=${encodeURIComponent(apiKey)}`);
      const json = (await resp.json()) as Record<string, unknown>;
      if (json.success && json.code === 0) {
        const data = json.data as Record<string, unknown>;
        if (data.bookName) setName(String(data.bookName));
        if (data.author) setAuthor(String(data.author));
        if (data.press) setPublisher(String(data.press));
        if (data.pictures) {
          let pics: string[] = [];
          try { pics = typeof data.pictures === 'string' ? JSON.parse(data.pictures) as string[] : data.pictures as string[]; } catch { /* */ }
          if (Array.isArray(pics) && pics.length > 0) setImages(pics.slice(0, 3));
        }
        setIsbn(isbnCode);
        setShowIsbnModal(false);
        showToast({ message: '信息已填入', type: 'success' });
      } else {
        showToast({ message: (json.msg as string) || '查询失败', type: 'error' });
      }
    } catch {
      showToast({ message: '查询失败，请重试', type: 'error' });
    } finally { setIsbnFetching(false); }
  }, [showToast]);

  const handleScan = useCallback(async () => {
    if (!camPermission?.granted) {
      const result = await requestCamPermission();
      if (!result.granted) { showToast({ message: '需要相机权限', type: 'warning' }); return; }
    }
    setShowScanner(true);
  }, [camPermission, requestCamPermission, showToast]);

  const handleBarcodeScanned = useCallback(({ data }: { data: string }) => {
    setShowScanner(false);
    setIsbn(data);
    void fetchIsbnInfo(data);
  }, [fetchIsbnInfo]);

  const handlePickImage = useCallback(async () => {
    if (images.length >= 3) { showToast({ message: '最多3张图片', type: 'warning' }); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  }, [images, showToast]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) { showToast({ message: '请输入书籍名称', type: 'warning' }); return; }
    if (!price.trim()) { showToast({ message: '请输入售价', type: 'warning' }); return; }
    if (!contact.trim()) { showToast({ message: '请输入联系方式', type: 'warning' }); return; }
    if (submitting) return;
    setSubmitting(true);
    try {
      // Upload images first
      const uploadedUrls: string[] = [];
      for (const uri of images) {
        if (uri.startsWith('http')) {
          uploadedUrls.push(uri);
        } else {
          const result = await uploadBookImage(uri);
          if (result?.url) uploadedUrls.push(result.url);
        }
      }
      const data: Record<string, unknown> = {
        name: name.trim(), author: author.trim(), publisher: publisher.trim(),
        isbn: isbn.trim(), category, price: price.trim(), condition,
        contact: contact.trim(), description: description.trim(),
        images: uploadedUrls,
        is_delivery: isDelivery, book_type: 1,
      };
      const res = isEdit
        ? await updateBook(Number(id), data)
        : await createBook(data);
      if (res?.success) {
        clearDraft();
        showToast({ message: isEdit ? '修改成功' : '发布成功', type: 'success' });
        setTimeout(() => router.back(), 1500);
      } else {
        showToast({ message: res?.message || '发布失败', type: 'error' });
      }
    } catch (e) {
      showToast({ message: (e as Error).message || '发布失败', type: 'error' });
    } finally { setSubmitting(false); }
  }, [name, author, publisher, isbn, category, price, condition, contact, description, images, isDelivery, submitting, showToast, isEdit, id]);

  if (!fetched) {
    return (
      <ThemedView style={st.outer}><Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[st.grad,{paddingTop:insets.top+8}]}>
          <View style={st.hdr}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text={isEdit?'编辑书籍':'发布书籍'} /></View>
          <View style={st.center}><ActivityIndicator size="large" color={theme.primary} /></View>
        </LinearGradient>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={st.outer}><Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']} locations={[0,0.28,1]} style={[st.grad,{paddingTop:insets.top+8}]}>
        <View style={st.hdr}><TouchableOpacity onPress={()=>router.back()}><MaterialIcon name="arrow-left" size={24} color="#fff" /></TouchableOpacity><HeadStatus text={isEdit?'编辑书籍':'发布书籍'} /></View>
        <ScrollView style={st.scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom:100}}>
          {/* Images */}
          <TouchableOpacity style={[st.card,{backgroundColor:theme.surface}]} onPress={handlePickImage}>
            <ThemedText style={st.label}>书籍图片</ThemedText>
            <View style={st.imgRow}>
              {images.map((uri, idx) => (
                <View key={idx} style={st.imgWrap}>
                  <Image source={{ uri }} style={st.img} />
                  <TouchableOpacity style={st.imgDel} onPress={()=>setImages((p)=>p.filter((_,i)=>i!==idx))}>
                    <MaterialIcon name="close-circle" size={22} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 3 && (
                <View style={[st.addImg,{backgroundColor:theme.backgroundElement}]}>
                  <MaterialIcon name="camera-plus-outline" size={24} color="#bbb" />
                  <Text style={[st.addText,{color:theme.textSecondary}]}>添加图片</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          {/* Name */}
          <View style={[st.card,{backgroundColor:theme.surface}]}>
            <ThemedText style={st.label}>书籍名称</ThemedText>
            <TextInput style={[st.input,{backgroundColor:theme.backgroundElement,color:theme.text,borderColor:theme.outlineVariant}]} value={name} onChangeText={setName} placeholder="请输入书籍名称" placeholderTextColor={theme.textSecondary} maxLength={100} />
          </View>
          {/* Author + Publisher */}
          <View style={[st.card,{backgroundColor:theme.surface}]}>
            <View style={st.row2}>
              <View style={{flex:1}}>
                <ThemedText style={st.label}>作者</ThemedText>
                <TextInput style={[st.input,{backgroundColor:theme.backgroundElement,color:theme.text,borderColor:theme.outlineVariant}]} value={author} onChangeText={setAuthor} placeholder="选填" placeholderTextColor={theme.textSecondary} maxLength={50} />
              </View>
              <View style={{flex:1}}>
                <ThemedText style={st.label}>出版社</ThemedText>
                <TextInput style={[st.input,{backgroundColor:theme.backgroundElement,color:theme.text,borderColor:theme.outlineVariant}]} value={publisher} onChangeText={setPublisher} placeholder="选填" placeholderTextColor={theme.textSecondary} maxLength={50} />
              </View>
            </View>
          </View>
          {/* ISBN — manual input + scan */}
          <View style={[st.card,{backgroundColor:theme.surface}]}>
            <ThemedText style={st.label}>ISBN</ThemedText>
            <View style={st.isbnBtnRow}>
              <TouchableOpacity style={st.isbnBtnManual} onPress={()=>{setIsbnInput('');setShowIsbnModal(true);}}>
                <MaterialIcon name="pencil-outline" size={20} color="#47a5fd" />
                <Text style={st.isbnBtnTextManual}>手动输入</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.isbnBtnScan} onPress={handleScan}>
                <MaterialIcon name="barcode-scan" size={20} color="#fff" />
                <Text style={st.isbnBtnTextScan}>扫码获取</Text>
              </TouchableOpacity>
            </View>
            {isbn ? (
              <View style={[st.isbnDisplay,{backgroundColor:theme.backgroundElement}]}>
                <Text style={[st.isbnDisplayText,{color:theme.text}]}>ISBN: {isbn}</Text>
                <TouchableOpacity onPress={()=>setIsbn('')}>
                  <MaterialIcon name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
          {/* Price */}
          <View style={[st.card,{backgroundColor:theme.surface}]}>
            <ThemedText style={st.label}>价格</ThemedText>
            <View style={{flexDirection:'row',alignItems:'center'}}>
              <Text style={{fontSize:18,color:'#e74c3c',marginRight:4}}>¥</Text>
              <TextInput style={[st.input,{flex:1,backgroundColor:theme.backgroundElement,color:theme.text,borderColor:theme.outlineVariant}]} value={price} onChangeText={setPrice} placeholder="请输入售价" placeholderTextColor={theme.textSecondary} keyboardType="numeric" />
            </View>
          </View>
          {/* Delivery */}
          <View style={[st.card,{backgroundColor:theme.surface}]}>
            <ThemedText style={st.label}>配送方式</ThemedText>
            <View style={st.pillRow}>
              {[{label:'可送',value:1},{label:'仅自提',value:0}].map((opt)=>(
                <TouchableOpacity key={opt.value} style={[st.pill,isDelivery===opt.value&&{backgroundColor:theme.primary}]} onPress={()=>setIsDelivery(opt.value)}>
                  <Text style={[st.pillText,isDelivery===opt.value&&{color:'#fff'}]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {/* Condition */}
          <View style={[st.card,{backgroundColor:theme.surface}]}>
            <ThemedText style={st.label}>成色</ThemedText>
            <View style={st.pillRow}>
              {CONDITION_OPTIONS.map((opt)=>(
                <TouchableOpacity key={opt} style={[st.pill,condition===opt&&{backgroundColor:theme.primary}]} onPress={()=>setCondition(opt)}>
                  <Text style={[st.pillText,condition===opt&&{color:'#fff'}]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {/* Category picker */}
          <View style={[st.card,{backgroundColor:theme.surface}]}>
            <ThemedText style={st.label}>种类</ThemedText>
            <TouchableOpacity style={[st.picker,{backgroundColor:theme.backgroundElement}]} onPress={()=>setShowCat(!showCat)}>
              <Text style={{color:theme.text}}>{category||'请选择种类'}</Text>
              <MaterialIcon name={showCat?'chevron-up':'chevron-down'} size={16} color="#999" />
            </TouchableOpacity>
            {showCat && categories.map((c)=>(
              <TouchableOpacity key={c} style={[st.pickerOpt,c===category&&{backgroundColor:theme.primaryContainer}]} onPress={()=>{setCategory(c);setShowCat(false);}}>
                <Text style={{color:theme.text}}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Contact */}
          <View style={[st.card,{backgroundColor:theme.surface}]}>
            <ThemedText style={st.label}>联系方式</ThemedText>
            <TextInput style={[st.input,{backgroundColor:theme.backgroundElement,color:theme.text,borderColor:theme.outlineVariant}]} value={contact} onChangeText={setContact} placeholder="请输入微信号或手机号" placeholderTextColor={theme.textSecondary} maxLength={50} />
            <Text style={[st.hint,{color:theme.textSecondary}]}>仅对登录用户可见</Text>
          </View>
          {/* Description */}
          <View style={[st.card,{backgroundColor:theme.surface}]}>
            <ThemedText style={st.label}>详细描述</ThemedText>
            <TextInput style={[st.ta,{backgroundColor:theme.backgroundElement,color:theme.text,borderColor:theme.outlineVariant}]} value={description} onChangeText={setDescription} placeholder="请描述书籍的新旧程度、使用情况..." placeholderTextColor={theme.textSecondary} multiline textAlignVertical="top" maxLength={500} />
          </View>
          {/* Bottom bar: draft + submit */}
          <View style={st.bottomBar}>
            {!isEdit ? (
              <TouchableOpacity style={[st.draftBtn,{backgroundColor:theme.backgroundElement}]} onPress={()=>saveDraft()}>
                <MaterialIcon name="content-save-outline" size={20} color="#999" />
                <Text style={[st.draftBtnText,{color:theme.textSecondary}]}>存为草稿</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={[st.btn,{flex:1,backgroundColor:theme.primary}]} onPress={handleSubmit} disabled={submitting}>
              <Text style={st.btnText}>{submitting?'发布中...':(isEdit?'保存修改':'发布')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* ISBN Manual Input Modal */}
      <Modal visible={showIsbnModal} transparent animationType="fade" onRequestClose={()=>setShowIsbnModal(false)}>
        <TouchableOpacity style={st.modalOverlay} activeOpacity={1} onPress={()=>setShowIsbnModal(false)}>
          <View style={[st.modalBox,{backgroundColor:theme.surface}]} onStartShouldSetResponder={()=>true}>
            <Text style={[st.modalTitle,{color:theme.text}]}>请输入图书ISBN</Text>
            <Text style={[st.modalHint,{color:theme.textSecondary}]}>请输入不含-符号的13位或10位ISBN编码</Text>
            <TextInput style={[st.modalInput,{backgroundColor:theme.backgroundElement,color:theme.text}]} placeholder="请输入ISBN" placeholderTextColor={theme.textSecondary} value={isbnInput} onChangeText={setIsbnInput} maxLength={20} autoFocus />
            <View style={st.modalBtns}>
              <TouchableOpacity style={st.modalCancel} onPress={()=>setShowIsbnModal(false)}>
                <Text style={[st.modalCancelText,{color:theme.textSecondary}]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.modalSubmit} onPress={()=>{if(!isbnFetching){const cleaned=isbnInput.replace(/-/g,'').trim();if(!cleaned){showToast({message:'请输入ISBN编码',type:'warning'});return;}void fetchIsbnInfo(cleaned);}}}>
                <Text style={st.modalSubmitText}>{isbnFetching?'查询中...':'提交'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Barcode Scanner Modal */}
      <Modal visible={showScanner} animationType="slide" onRequestClose={()=>setShowScanner(false)}>
        <View style={st.scannerContainer}>
          {showScanner ? (
            <CameraView style={StyleSheet.absoluteFill} onBarcodeScanned={handleBarcodeScanned} />
          ) : null}
          <TouchableOpacity style={st.scannerClose} onPress={()=>setShowScanner(false)}>
            <MaterialIcon name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={st.scannerHint}>
            <Text style={st.scannerHintText}>将条形码置于框内</Text>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const st = StyleSheet.create({
  outer:{flex:1},grad:{flex:1},scroll:{flex:1,paddingHorizontal:8},
  hdr:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4},center:{flex:1,alignItems:'center',justifyContent:'center'},
  card:{borderRadius:12,padding:16,marginHorizontal:8,marginBottom:12},
  label:{fontSize:15,fontWeight:'600',marginBottom:10},
  input:{borderRadius:8,borderWidth:1,padding:12,fontSize:15},
  ta:{borderRadius:8,borderWidth:1,padding:12,fontSize:15,minHeight:80},
  hint:{fontSize:12,marginTop:6},
  // Images
  imgRow:{flexDirection:'row',flexWrap:'wrap',gap:8},
  imgWrap:{width:80,height:80,borderRadius:8,overflow:'hidden'},
  img:{width:'100%',height:'100%'},
  imgDel:{position:'absolute',top:-4,right:-4},
  addImg:{width:80,height:80,borderRadius:8,alignItems:'center',justifyContent:'center'},
  addText:{fontSize:10,marginTop:2},
  // Pills
  pillRow:{flexDirection:'row',gap:8,flexWrap:'wrap'},
  pill:{paddingHorizontal:16,paddingVertical:8,borderRadius:16,backgroundColor:'#e8e8e8'},
  pillText:{fontSize:13,color:'#666'},
  // Picker
  picker:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderRadius:8,borderWidth:1,borderColor:'#ddd',padding:12},
  pickerOpt:{paddingVertical:12,paddingHorizontal:16,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:'#eee'},
  // Two col
  row2:{flexDirection:'row',gap:12},
  // Bottom bar
  bottomBar:{flexDirection:'row',alignItems:'center',gap:8,marginHorizontal:8,marginTop:12},
  draftBtn:{flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:14,paddingVertical:12,borderRadius:12},
  draftBtnText:{fontSize:14},
  // Submit
  // ISBN
  isbnBtnRow:{flexDirection:'row',gap:8},
  isbnBtnManual:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingVertical:10,borderRadius:8,borderWidth:1,borderColor:'#47a5fd'},
  isbnBtnTextManual:{fontSize:14,color:'#47a5fd',fontWeight:'600'},
  isbnBtnScan:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingVertical:10,borderRadius:8,backgroundColor:'#47a5fd'},
  isbnBtnTextScan:{fontSize:14,color:'#fff',fontWeight:'600'},
  isbnDisplay:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:10,paddingHorizontal:12,paddingVertical:8,borderRadius:8},
  isbnDisplayText:{fontSize:13},
  // ISBN Modal
  modalOverlay:{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',padding:30},
  modalBox:{borderRadius:16,padding:24},
  modalTitle:{fontSize:18,fontWeight:'700',marginBottom:8,textAlign:'center'},
  modalHint:{fontSize:13,marginBottom:16,textAlign:'center'},
  modalInput:{borderRadius:8,padding:12,fontSize:15,borderWidth:1,borderColor:'#ddd'},
  modalBtns:{flexDirection:'row',gap:12,marginTop:16},
  modalCancel:{flex:1,alignItems:'center',paddingVertical:12,borderRadius:8,backgroundColor:'#f0f0f0'},
  modalCancelText:{fontSize:15},
  modalSubmit:{flex:1,alignItems:'center',paddingVertical:12,borderRadius:8,backgroundColor:'#47a5fd'},
  modalSubmitText:{fontSize:15,color:'#fff',fontWeight:'600'},
  // Scanner
  scannerContainer:{flex:1,backgroundColor:'#000'},
  scannerClose:{position:'absolute',top:50,right:20,zIndex:10,width:40,height:40,borderRadius:20,backgroundColor:'rgba(0,0,0,0.5)',alignItems:'center',justifyContent:'center'},
  scannerHint:{position:'absolute',bottom:100,left:0,right:0,alignItems:'center'},
  scannerHintText:{color:'#fff',fontSize:15},
  // Submit
  btn:{alignItems:'center',paddingVertical:14,borderRadius:12},
  btnText:{fontSize:16,fontWeight:'600',color:'#fff'},
});
