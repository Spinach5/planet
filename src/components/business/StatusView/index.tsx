import type { ReactNode } from 'react';
import { View, TouchableOpacity, type ViewStyle } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { ThemedText } from '@/components/themed/ThemedText';
import { MaterialIcon, type IconName } from '@/components/base/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { st } from './index.style';

type StatusType = 'loading' | 'empty' | 'error' | 'content';

interface StatusViewProps {
  /** Current status */
  status: StatusType;
  /** Content to render when status is 'content' */
  children?: ReactNode;
  /** Loading text (default: '加载中...') */
  loadingText?: string;
  /** Empty state text (default: '暂无数据') */
  emptyText?: string;
  /** Error text (default: '加载失败，点击重试') */
  errorText?: string;
  /** Retry handler for error state */
  onRetry?: () => void;
  /** Icon for empty state */
  emptyIcon?: IconName;
  /** Container style */
  style?: ViewStyle;
}

/**
 * Unified status view component for loading, empty, error, and content states.
 * Use in list pages and detail pages to standardize state presentation.
 */
export function StatusView({
  status,
  children,
  loadingText = '加载中...',
  emptyText = '暂无数据',
  errorText = '加载失败，点击重试',
  onRetry,
  emptyIcon,
  style,
}: StatusViewProps) {
  const theme = useTheme();

  if (status === 'content') {
    // eslint-disable-next-line react/jsx-no-useless-fragment -- children may be a single non-JSX node
    return <>{children}</>;
  }

  return (
    <View style={[st.container, style]}>
      {status === 'loading' ? (
        <>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={st.text} themeColor="textSecondary">
            {loadingText}
          </ThemedText>
        </>
      ) : status === 'empty' ? (
        <>
          {emptyIcon ? (
            <View style={st.icon}>
              <MaterialIcon
                name={emptyIcon}
                size={48}
                color={theme.textSecondary}
              />
            </View>
          ) : null}
          <ThemedText style={st.text} themeColor="textSecondary">
            {emptyText}
          </ThemedText>
        </>
      ) : (
        <TouchableOpacity onPress={onRetry} activeOpacity={0.7}>
          <ThemedText style={st.retryText} themeColor="textSecondary">
            {errorText}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}
