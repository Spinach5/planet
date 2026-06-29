import { View, TextInput, type ViewStyle, type TextStyle } from 'react-native';
import { MaterialIcon } from '@/components/base/MaterialIcon';
import { useTheme } from '@/hooks/use-theme';
import { st } from './index.style';

interface SearchBarProps {
  /** Current search value */
  value: string;
  /** Text change handler */
  onChangeText: (text: string) => void;
  /** Placeholder text (default: '搜索') */
  placeholder?: string;
  /** Submit handler */
  onSubmit?: (text: string) => void;
  /** Show search icon (default: true) */
  showIcon?: boolean;
  /** Container style */
  style?: ViewStyle;
  /** Input text style */
  inputStyle?: TextStyle;
  /** Visual variant (default: 'surface') */
  variant?: 'surface' | 'transparent';
}

/**
 * Search bar component with icon and text input.
 */
export function SearchBar({
  value,
  onChangeText,
  placeholder = '搜索',
  onSubmit,
  showIcon = true,
  style,
  inputStyle,
  variant = 'surface',
}: SearchBarProps) {
  const theme = useTheme();

  const backgroundColor = variant === 'transparent'
    ? 'transparent'
    : theme.surface;

  return (
    <View style={[st.container, { backgroundColor }, style]}>
      {showIcon ? (
        <MaterialIcon name="magnify" size={16} color="#999" />
      ) : null}
      <TextInput
        style={[st.input, { color: theme.text }, inputStyle]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        onSubmitEditing={onSubmit ? () => onSubmit(value) : undefined}
        returnKeyType="search"
      />
    </View>
  );
}
