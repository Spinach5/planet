import { View, useWindowDimensions, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { st } from './index.style';

interface ListSkeletonProps {
  /** Number of skeleton rows (default: 4) */
  rows?: number;
  /** Number of columns for grid layout (default: 2) */
  columns?: number;
  /** Container style */
  style?: ViewStyle;
}

/**
 * Skeleton loading placeholder for list/grid views.
 * Shows animated placeholder blocks while content loads.
 */
export function ListSkeleton({
  rows = 4,
  columns = 2,
  style,
}: ListSkeletonProps) {
  const { width: sw } = useWindowDimensions();
  const theme = useTheme();
  const cardW = (sw - 16 - 8 * (columns - 1)) / columns;

  return (
    <View style={[st.grid, style]}>
      {Array.from({ length: rows }, (_, i) => (
        <View
          key={i}
          style={[
            st.card,
            { width: cardW, backgroundColor: theme.backgroundElement },
          ]}
        >
          <View style={st.imagePlaceholder} />
          <View style={st.body}>
            <View style={st.line} />
            <View style={[st.line, { width: '60%' }]} />
            <View style={[st.line, { width: '40%' }]} />
          </View>
        </View>
      ))}
    </View>
  );
}
