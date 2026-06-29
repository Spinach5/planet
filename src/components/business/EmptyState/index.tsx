import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { ThemedText } from '@/components/themed/ThemedText';
import { MaterialIcon, type IconName } from '@/components/base/MaterialIcon';
import { st } from './index.style';

interface EmptyStateProps {
  /** Empty state text (default: '暂无数据') */
  text?: string;
  /** Icon to display */
  icon?: IconName;
  /** Icon size (default: 48) */
  iconSize?: number;
  /** Container style */
  style?: ViewStyle;
  /** Additional content below text */
  children?: ReactNode;
}

/**
 * Empty state display component.
 * Shows an optional icon, text message, and optional children.
 */
export function EmptyState({
  text = '暂无数据',
  icon,
  iconSize = 48,
  style,
  children,
}: EmptyStateProps) {
  return (
    <View style={[st.container, style]}>
      {icon ? (
        <View style={st.icon}>
          <MaterialIcon
            name={icon}
            size={iconSize}
            color="#ccc"
          />
        </View>
      ) : null}
      <ThemedText style={st.text} themeColor="textSecondary">
        {text}
      </ThemedText>
      {children}
    </View>
  );
}
