import { useState, useCallback, useRef, useMemo } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Animated, Text,
} from 'react-native';
import { router, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';

export default function MuYuPage() {
  const theme = useTheme();
  const [merit, setMerit] = useState(0);
  const [floatingTexts, setFloatingTexts] = useState<Array<{ id: number; x: number; anim: Animated.Value }>>([]);
  const scaleValue = useMemo(() => new Animated.Value(1), []);
  const nextId = useRef(0);

  const playSound = useCallback(() => {
    // Sound is optional - will be implemented with expo-audio
  }, []);

  const handleHit = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setMerit((prev) => prev + 1);

    playSound();

    Animated.sequence([
      Animated.timing(scaleValue, { toValue: 0.9, duration: 50, useNativeDriver: true }),
      Animated.timing(scaleValue, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    const id = nextId.current++;
    const x = Math.random() * 100 - 50;
    const anim = new Animated.Value(0);

    setFloatingTexts((prev) => [...prev.slice(-5), { id, x, anim }]);

    Animated.timing(anim, { toValue: -100, duration: 800, useNativeDriver: true }).start(() => {
      setFloatingTexts((prev) => prev.filter((f) => f.id !== id));
    });
  }, [scaleValue, playSound]);

  const navigateBack = useCallback(() => router.back(), []);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <MaterialIcon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} themeColor="onPrimary">木鱼</ThemedText>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.content}>
        <View style={[styles.meritCard, { backgroundColor: theme.surfaceVariant }]}>
          <ThemedText style={styles.meritLabel} themeColor="textSecondary">功德</ThemedText>
          <ThemedText style={styles.meritValue}>{merit}</ThemedText>
        </View>
        <View style={styles.fishContainer}>
          {floatingTexts.map((ft) => (
            <Animated.View
              key={ft.id}
              style={[
                styles.floatingText,
                {
                  transform: [{ translateX: ft.x }, { translateY: ft.anim }],
                  opacity: ft.anim.interpolate({
                    inputRange: [-100, -50, 0],
                    outputRange: [0, 0.8, 1],
                  }),
                },
              ]}
            >
              <Text style={[styles.floatingTextContent, { color: theme.primary }]}>+1</Text>
            </Animated.View>
          ))}
          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <TouchableOpacity onPress={handleHit} activeOpacity={0.8}>
              <View style={[styles.fish, { backgroundColor: theme.primaryContainer, borderColor: theme.primary }]}>
                <MaterialIcon name="cards-heart" size={60} color={theme.primary} />
              </View>
            </TouchableOpacity>
          </Animated.View>
          <ThemedText style={styles.tapHint} themeColor="textSecondary">
            敲击木鱼，积累功德
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#ffffff' },
  headerSpacer: { width: 40 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  meritCard: { borderRadius: 16, paddingHorizontal: 32, paddingVertical: 16, alignItems: 'center', marginBottom: 40 },
  meritLabel: { fontSize: 14, marginBottom: 4 },
  meritValue: { fontSize: 48, fontWeight: '300' },
  fishContainer: { alignItems: 'center' },
  fish: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', borderWidth: 3 },
  tapHint: { fontSize: 14, marginTop: 24 },
  floatingText: { position: 'absolute', zIndex: 10 },
  floatingTextContent: { fontSize: 24, fontWeight: '700' },
});
