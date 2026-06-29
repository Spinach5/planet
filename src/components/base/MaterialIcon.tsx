import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/hooks/use-theme';
import type { ThemeColor } from '@/constants/theme';

export type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface MaterialIconProps {
  name: IconName;
  size?: number;
  color?: string;
  themeColor?: ThemeColor;
}

/**
 * Material Design icon component.
 * Wraps @expo/vector-icons MaterialCommunityIcons with theme support.
 * Replaces taro-ui's AtIcon and taro-icons' MaterialCommunityIcons.
 */
export function MaterialIcon({
  name,
  size = 24,
  color,
  themeColor,
}: MaterialIconProps) {
  const theme = useTheme();
  const iconColor = color ?? theme[themeColor ?? 'text'];

  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={iconColor}
      suppressHighlighting
    />
  );
}
