import { TouchableOpacity, Text, type ViewStyle } from 'react-native';
import { MaterialIcon, type IconName } from '@/components/base/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { st } from './index.style';

interface FABProps {
  /** Icon name (default: 'plus') */
  icon?: IconName;
  /** Text label (shown instead of icon if set) */
  label?: string;
  /** Press handler */
  onPress: () => void;
  /** Position (default: 'right') */
  position?: 'right' | 'left';
  /** Distance from bottom in dp (default: 80) */
  bottom?: number;
  /** Icon/text color (default: '#fff') */
  color?: string;
  /** Background color (default: theme primary) */
  backgroundColor?: string;
  /** Button size (default: 50) */
  size?: number;
  /** Whether visible (default: true) */
  visible?: boolean;
}

/**
 * Floating Action Button (FAB).
 * Absolute-positioned button with shadow and press feedback.
 */
export function FAB({
  icon = 'plus',
  label,
  onPress,
  position = 'right',
  bottom = 80,
  color = '#fff',
  backgroundColor,
  size = 50,
  visible = true,
}: FABProps) {
  const theme = useTheme();
  const bgColor = backgroundColor ?? theme.primary;
  const shadowColor = backgroundColor ?? '#47a5fd';

  if (!visible) return null;

  const positionStyle: ViewStyle = position === 'right'
    ? { right: 20 }
    : { left: 20 };

  return (
    <TouchableOpacity
      style={[
        st.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          bottom,
          shadowColor,
          ...positionStyle,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {label ? (
        <Text style={st.label}>{label}</Text>
      ) : (
        <MaterialIcon name={icon} size={size * 0.48} color={color} />
      )}
    </TouchableOpacity>
  );
}
