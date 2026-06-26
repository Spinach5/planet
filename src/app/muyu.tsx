import { useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Modal,
  ScrollView, Pressable,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Asset } from 'expo-asset';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { HeadStatus } from '@/components/HeadStatus';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';

const FLOAT_TEXTS = ['功德 +1', '+1', '咚~', '善哉'];

// Resolve SVG assets properly for both native and web
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const muyuAsset = Asset.fromModule(require('@/assets/images/muyu.svg'));
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const muyuStickAsset = Asset.fromModule(require('@/assets/images/muyu-stick.svg'));
const audioMuyu = require('@/assets/audio/muyu.mp3');
const audioMoo = require('@/assets/audio/moo.mp3');

interface AudioEntry {
  key: string;
  label: string;
  src: number;
}

const BUILTIN_AUDIOS: Record<string, AudioEntry> = {
  muyu: { key: 'muyu', label: '木鱼声', src: audioMuyu },
  moo: { key: 'moo', label: '牛叫声', src: audioMoo },
};

export default function MuYuPage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [merit, setMerit] = useState(0);
  const [isHitting, setIsHitting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentKey, setCurrentKey] = useState('muyu');
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [floatTexts, setFloatTexts] = useState<Array<{ id: number; text: string; left: number; top: number }>>([]);

  const scaleAnim = useMemo(() => new Animated.Value(1), []);
  const glowAnim = useMemo(() => new Animated.Value(0), []);
  const rippleAnim = useMemo(() => new Animated.Value(0), []);
  const stickAnim = useMemo(() => new Animated.Value(0), []);
  const hitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const floatId = useRef(0);
  const soundRef = useRef<{ play: () => void; pause: () => void } | null>(null);

  const audioEntry = BUILTIN_AUDIOS[currentKey];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const currentLabel = audioEntry ? audioEntry.label : '未知';

  const triggerHitEffect = useCallback(() => {
    if (hitTimer.current) clearTimeout(hitTimer.current);
    setIsHitting(true);
    hitTimer.current = setTimeout(() => setIsHitting(false), 400);

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.88, duration: 60, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1.06, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    glowAnim.setValue(0.8);
    Animated.timing(glowAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();

    rippleAnim.setValue(0.7);
    Animated.timing(rippleAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start();

    stickAnim.setValue(1);
    Animated.timing(stickAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  }, [scaleAnim, glowAnim, rippleAnim, stickAnim]);

  const addFloatText = useCallback(() => {
    const id = ++floatId.current;
    const text = FLOAT_TEXTS[Math.floor(Math.random() * FLOAT_TEXTS.length)];
    const left = 30 + Math.random() * 40;
    const top = 35 + Math.random() * 20;
    setFloatTexts((prev) => [...prev, { id, text, left, top }]);
    setTimeout(() => {
      setFloatTexts((prev) => prev.filter((f) => f.id !== id));
    }, 900);
  }, []);

  const playAudio = useCallback(async (key: string) => {
    const entry = BUILTIN_AUDIOS[key];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!entry) return;
    try {
      if (soundRef.current) {
        soundRef.current.pause();
        soundRef.current = null;
      }
      // Use Web Audio API
      const audio = new Audio(entry.src as unknown as string);
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);
      soundRef.current = audio;
      await audio.play();
    } catch {
      // audio may not be available
    }
  }, []);

  const handlePress = useCallback(() => {
    triggerHitEffect();
    addFloatText();
    setMerit((p) => p + 1);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void playAudio(currentKey);
  }, [triggerHitEffect, addFloatText, playAudio, currentKey]);

  const handleSelectAudio = useCallback((key: string) => {
    setCurrentKey(key);
    setShowAudioModal(false);
    void playAudio(key);
  }, [playAudio]);

  const isDark = theme.background === '#000000';
  const glowScale = glowAnim.interpolate({ inputRange: [0, 0.8], outputRange: [0.9, 1.5] });
  const rippleScale = rippleAnim.interpolate({ inputRange: [0, 0.7], outputRange: [0.85, 1.4] });
  const stickRotate = stickAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: ['50deg', '70deg', '50deg'] });
  const stickTransY = stickAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 15, 0] });

  return (
    <ThemedView style={st.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={isDark ? ['rgb(26,29,46)','rgb(35,39,64)','rgb(26,29,46)'] : ['#47a5fd','#cce5ff','#f2f5f9']}
        locations={[0,0.28,1]}
        style={[st.gradient, { paddingTop: insets.top + 8 }]}
      >
        <View style={st.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <HeadStatus text="电子木鱼" />
        </View>

        <ScrollView contentContainerStyle={st.body}>
          {/* Merit Card */}
          <View style={st.meritCard}>
            <Text style={st.meritLabel}>今日功德</Text>
            <Text style={st.meritValue}>{merit}</Text>
          </View>

          {/* Now Playing */}
          <View style={[st.nowPlaying, { backgroundColor: theme.surface }]}>
            <View style={[st.playingDot, isPlaying && st.playingDotActive]} />
            <Text style={[st.playingText, { color: theme.text }]} numberOfLines={1}>
              当前音频：{currentLabel}
            </Text>
            <Text style={st.playingStatus}>{isPlaying ? '播放中' : '待敲击'}</Text>
          </View>

          {/* Stage */}
          <View style={st.stage}>
            <Animated.View style={[st.glow, { opacity: glowAnim, transform: [{ scale: glowScale }] }]} />
            <Animated.View style={[st.ripple, { opacity: rippleAnim, transform: [{ scale: rippleScale }] }]} />
            <Pressable onPress={handlePress} style={isHitting ? [st.muyuContainer, st.muyuContainerHitting] : st.muyuContainer}>
              <Animated.Image
                source={{ uri: muyuStickAsset.uri }}
                style={[st.stick, { transform: [{ rotate: stickRotate }, { translateY: stickTransY }] }]}
                resizeMode="contain"
              />
              <Animated.Image
                source={{ uri: muyuAsset.uri }}
                style={[st.fish, { transform: [{ scale: scaleAnim }] }]}
                resizeMode="contain"
              />
              <View style={st.floatLayer}>
                {floatTexts.map((f) => (
                  <Text key={f.id} style={[st.floatText, { left: `${String(f.left)}%`, top: `${String(f.top)}%` }]}>
                    {f.text}
                  </Text>
                ))}
              </View>
            </Pressable>
          </View>

          {/* Choose Audio Button */}
          <TouchableOpacity
            style={[st.audioBtn, { backgroundColor: theme.surface }]}
            onPress={() => setShowAudioModal(true)}
          >
            <MaterialIcon name="music" size={20} color="#0069cc" />
            <Text style={st.audioBtnText}>选择音频</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>

      {/* Audio Select Modal */}
      <Modal visible={showAudioModal} transparent animationType="fade">
        <Pressable style={st.modalOverlay} onPress={() => setShowAudioModal(false)}>
          <Pressable style={[st.modalContent, { backgroundColor: theme.surface }]} onPress={undefined}>
            <Text style={[st.modalTitle, { color: theme.text }]}>选择音频</Text>
            <ScrollView style={st.modalList}>
              {Object.values(BUILTIN_AUDIOS).map((item) => {
                const isActive = currentKey === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[st.audioItem, isActive && { backgroundColor: theme.primaryContainer }]}
                    onPress={() => handleSelectAudio(item.key)}
                  >
                    <Text style={[st.audioItemLabel, { color: theme.text }]}>{item.label}</Text>
                    {isActive ? <MaterialIcon name="check" size={18} color={theme.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
              <View style={[st.audioItem, st.audioItemImport]}>
                <Text style={st.audioImportIcon}>+</Text>
                <Text style={{ color: theme.textSecondary }}>本地导入（开发中）</Text>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, paddingHorizontal: 8 },
  body: { alignItems: 'center', paddingBottom: 80 },

  meritCard: {
    width: '90%', maxWidth: 340, marginTop: 8, marginBottom: 12,
    paddingVertical: 20, paddingHorizontal: 24,
    backgroundColor: '#fff9e6', borderRadius: 16, alignItems: 'center',
    shadowColor: '#47a5fd', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  meritLabel: { fontSize: 14, color: '#888', letterSpacing: 2 },
  meritValue: { fontSize: 48, fontWeight: 'bold', color: '#f5a623', marginTop: 4, textShadowColor: 'rgba(245,166,35,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },

  nowPlaying: {
    width: '90%', maxWidth: 340, marginBottom: 12,
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(71,165,253,0.25)',
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  playingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#47a5fd' },
  playingDotActive: { opacity: 0.4 },
  playingText: { flex: 1, fontSize: 14 },
  playingStatus: { fontSize: 12, color: '#47a5fd' },

  stage: { position: 'relative', width: '100%', maxWidth: 320, height: 300, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(71,165,253,0.35)' },
  ripple: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 2, borderColor: 'rgba(71,165,253,0.5)' },
  muyuContainer: { alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2 },
  muyuContainerHitting: { opacity: 1 },
  fish: { width: 200, height: 200 },
  stick: { width: 160, height: 160, position: 'absolute', top: -60, right: 10, zIndex: 3 },
  floatLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 },
  floatText: { position: 'absolute', fontSize: 22, fontWeight: 'bold', color: '#f5a623', textShadowColor: 'rgba(255,200,50,0.8)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },

  audioBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 24, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(71,165,253,0.3)',
    shadowColor: '#47a5fd', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  audioBtnText: { fontSize: 15, color: '#0069cc' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 40 },
  modalContent: { borderRadius: 16, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  modalList: { maxHeight: 300 },
  audioItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, marginBottom: 4 },
  audioItemImport: { justifyContent: 'flex-start', gap: 10 },
  audioImportIcon: { fontSize: 20, fontWeight: 'bold', color: '#47a5fd' },
  audioItemLabel: { fontSize: 16 },
});
