import { ActivityIndicator } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed/ThemedText';
import { useTheme } from '@/hooks/use-theme';

interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
}

/**
 * Full-screen loading overlay.
 * Replaces Taro's Taro.showLoading() / taro-ui AtActivityIndicator.
 * Uses react-native-paper ActivityIndicator with Material Design 3.
 */
export function LoadingOverlay({ visible, text = '加载中...' }: LoadingOverlayProps) {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surfaceVariant,
            borderRadius: 16,
          },
        ]}
      >
        <ActivityIndicator
          animating
          size="large"
          color={theme.primary}
        />
        {text ? (
          <ThemedText
            style={styles.text}
            themeColor="onSurfaceVariant"
          >
            {text}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  card: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    alignItems: 'center',
    minWidth: 120,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
  },
});
