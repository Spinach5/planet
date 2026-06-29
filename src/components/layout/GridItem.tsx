import { View, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { ThemedText } from '@/components/themed/ThemedText';
import { MaterialIcon } from '@/components/base/MaterialIcon';
import type { IconName } from '@/components/base/MaterialIcon';
import { useDebouncedPush } from '@/utils/useDebouncedPush';

interface GridItemProps {
  url: string;
  icon: IconName;
  text: string;
}

/**
 * Feature grid item. Fixed 4 per row, matching banner width.
 * Icon sizes adapt to screen width.
 */
export function GridItem({ url, icon, text }: GridItemProps) {
  const { width: screenW } = useWindowDimensions();
  // Grid is screenW - 16 (margins), 4 items per row
  const itemW = (screenW - 16) / 4;
  const iconSz = Math.min(itemW * 0.55, 72);
  const push = useDebouncedPush();

  const handlePress = () => {
    try { push(url); } catch { /* page may not exist */ }
  };

  return (
    <TouchableOpacity
      style={[st.container, { width: itemW }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[st.iconWrapper, { width: iconSz, height: iconSz }]}>
        <MaterialIcon name={icon} size={iconSz * 0.45} color="#47a5fd" />
      </View>
      <ThemedText style={st.label}>{text}</ThemedText>
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  iconWrapper: {
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    marginBottom: 6, backgroundColor: '#ffffff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  label: { fontSize: 11, fontWeight: '700', color: '#333333', letterSpacing: 0.5 },
});
