import type { ReactNode } from 'react';
import { ScrollView, type ViewStyle, type NativeSyntheticEvent, type NativeScrollEvent, type RefreshControlProps } from 'react-native';
import { LinearGradient, type LinearGradientProps } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed/ThemedView';
import { useTheme } from '@/hooks/use-theme';
import { st } from './index.style';

interface GradientScreenProps {
  children: ReactNode;
  /** Extra style for the outer container */
  style?: ViewStyle;
  /** Extra style for the content area */
  contentStyle?: ViewStyle;
  /** Whether content is scrollable (default: false) */
  scrollable?: boolean;
  /** RefreshControl element (only used when scrollable=true) */
  refreshControl?: ReactNode;
  /** Scroll event handler (only used when scrollable=true) */
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Header content rendered above the scrollable area, inside the gradient */
  header?: ReactNode;
  /** Top padding override. Default: insets.top + 8 */
  paddingTop?: number;
}

/**
 * Standard page container with gradient background.
 * Encapsulates SafeAreaView insets, LinearGradient, and optional ScrollView.
 * Matches the common page pattern used across the app.
 */
export function GradientScreen({
  children,
  style,
  contentStyle,
  scrollable = false,
  refreshControl,
  onScroll,
  header,
  paddingTop,
}: GradientScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme.background === '#000000';

  const gradientColors: LinearGradientProps['colors'] = isDark
    ? (['rgb(26,29,46)', 'rgb(35,39,64)', 'rgb(26,29,46)'] as const)
    : (['#47a5fd', '#cce5ff', '#f2f5f9'] as const);

  const topPadding = paddingTop ?? insets.top + 8;

  return (
    <ThemedView style={[st.container, style]}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.28, 1]}
        style={[st.gradient, { paddingTop: topPadding }]}
      >
        {header}
        {scrollable ? (
          <ScrollView
            style={[st.scrollView, contentStyle]}
            onScroll={onScroll}
            refreshControl={refreshControl as React.ReactElement<RefreshControlProps>}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </LinearGradient>
    </ThemedView>
  );
}
