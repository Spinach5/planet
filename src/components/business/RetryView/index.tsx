import { TouchableOpacity, type ViewStyle } from 'react-native';
import { ThemedText } from '@/components/themed/ThemedText';
import { st } from './index.style';

interface RetryViewProps {
  /** Error text (default: '加载失败，点击重试') */
  text?: string;
  /** Retry handler */
  onRetry: () => void;
  /** Container style */
  style?: ViewStyle;
}

/**
 * Error state with retry action.
 * The entire area is tappable to trigger retry.
 */
export function RetryView({
  text = '加载失败，点击重试',
  onRetry,
  style,
}: RetryViewProps) {
  return (
    <TouchableOpacity
      style={[st.container, style]}
      onPress={onRetry}
      activeOpacity={0.7}
    >
      <ThemedText style={st.text} themeColor="textSecondary">
        {text}
      </ThemedText>
    </TouchableOpacity>
  );
}
