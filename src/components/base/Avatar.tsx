import { View, Text, Image, type ImageStyle, type ImageSourcePropType } from 'react-native';
import { getColorFromName } from '@/utils/color';

interface AvatarProps {
  /** Image source. If null/undefined, shows initial letter. */
  source?: ImageSourcePropType | null;
  /** Name for generating initial letter and background color */
  name?: string;
  /** Avatar size in dp (default: 40) */
  size?: number;
  /** Background color override. Auto-generated from name if not set. */
  backgroundColor?: string;
  /** Text color for initial letter (default: '#fff') */
  textColor?: string;
  /** Additional container style */
  style?: ImageStyle;
}

/**
 * Avatar component that displays an image, or falls back to an initial letter
 * with an auto-generated background color.
 */
export function Avatar({
  source,
  name = '',
  size = 40,
  backgroundColor,
  textColor = '#fff',
  style,
}: AvatarProps) {
  const bgColor = backgroundColor ?? (name ? getColorFromName(name) : '#ccc');
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const fontSize = size * 0.45;

  if (source) {
    return (
      <Image
        source={source}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize,
          fontWeight: '700',
          color: textColor,
        }}
      >
        {initial}
      </Text>
    </View>
  );
}
