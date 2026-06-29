import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed/ThemedText';
import type { ReactNode } from 'react';

interface HeadStatusProps {
  text: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Page header title bar component.
 * Replaces Taro's HeadStatus — white bold title with optional children on the right.
 * Matches original design: 44rpx bold white text with text shadow.
 */
export function HeadStatus({ text, children }: HeadStatusProps) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title} themeColor="onPrimary">
        {text}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 22,
    marginRight: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
