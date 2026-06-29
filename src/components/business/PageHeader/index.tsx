import type { ReactNode } from 'react';
import { View, Text, TouchableOpacity, type ViewStyle, type TextStyle } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcon, type IconName } from '@/components/base/MaterialIcon';
import { st } from './index.style';

interface PageHeaderProps {
  /** Title text */
  title: string;
  /** Whether to show back button (default: true) */
  showBack?: boolean;
  /** Back button press handler. Default: router.back() */
  onBack?: () => void;
  /** Right-side content */
  right?: ReactNode;
  /** Extra container style */
  style?: ViewStyle;
  /** Title text style override */
  titleStyle?: TextStyle;
  /** Back icon name (default: 'arrow-left') */
  backIcon?: IconName;
}

/**
 * Standard page header with back button, title, and optional right-side content.
 * Renders a single row: [back] [title] [right]
 * Designed to be used inside GradientScreen's header prop.
 *
 * Usage:
 * ```tsx
 * <GradientScreen header={<PageHeader title="书籍" />}>
 *   ...
 * </GradientScreen>
 * ```
 */
export function PageHeader({
  title,
  showBack = true,
  onBack,
  right,
  style,
  titleStyle,
  backIcon = 'arrow-left',
}: PageHeaderProps) {
  const handleBack = onBack ?? (() => router.back());

  return (
    <View style={[st.container, style]}>
      {showBack ? (
        <TouchableOpacity onPress={handleBack} style={st.backButton}>
          <MaterialIcon name={backIcon} size={24} color="#fff" />
        </TouchableOpacity>
      ) : null}
      <Text
        style={[
          st.title,
          titleStyle,
        ]}
      >
        {title}
      </Text>
      {right ? <View style={st.rightArea}>{right}</View> : null}
    </View>
  );
}
