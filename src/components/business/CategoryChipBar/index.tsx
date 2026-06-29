import { ScrollView, TouchableOpacity, Text, type ViewStyle } from 'react-native';
import { st } from './index.style';

type CategoryItem = string | { label: string; value: string };

interface CategoryChipBarProps {
  /** List of categories */
  categories: CategoryItem[];
  /** Currently selected value(s) */
  value: string | string[];
  /** Selection change callback */
  onChange: (value: string | string[]) => void;
  /** Selection mode (default: 'single') */
  mode?: 'single' | 'multi';
  /** Container style */
  style?: ViewStyle;
  /** Content container style */
  contentContainerStyle?: ViewStyle;
  /** Show scroll indicator (default: false) */
  showScrollIndicator?: boolean;
}

/**
 * Horizontal scrollable category chip bar.
 * Supports single-select and multi-select modes.
 */
export function CategoryChipBar({
  categories,
  value,
  onChange,
  mode = 'single',
  style,
  contentContainerStyle,
  showScrollIndicator = false,
}: CategoryChipBarProps) {
  const handlePress = (itemValue: string) => {
    if (mode === 'multi') {
      const currentValues = Array.isArray(value) ? value : [value];
      const newValues = currentValues.includes(itemValue)
        ? currentValues.filter((v) => v !== itemValue)
        : [...currentValues, itemValue];
      onChange(newValues);
    } else {
      onChange(itemValue);
    }
  };

  const isActive = (itemValue: string) => {
    if (Array.isArray(value)) {
      return value.includes(itemValue);
    }
    return value === itemValue;
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={showScrollIndicator}
      style={[st.scroll, style]}
      contentContainerStyle={[st.content, contentContainerStyle]}
    >
      {categories.map((cat) => {
        const label = typeof cat === 'string' ? cat : cat.label;
        const itemValue = typeof cat === 'string' ? cat : cat.value;
        const active = isActive(itemValue);

        return (
          <TouchableOpacity
            key={itemValue}
            style={[st.chip, active && st.chipActive]}
            onPress={() => handlePress(itemValue)}
          >
            <Text style={[st.chipText, active && st.chipTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
