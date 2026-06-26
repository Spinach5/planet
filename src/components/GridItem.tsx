import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcon } from '@/components/MaterialIcon';
import type { IconName } from '@/components/MaterialIcon';

interface GridItemProps {
  url: string;
  icon: IconName;
  text: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_PADDING = 30; // 15px * 2 sides
const GRID_GAPS = 30; // 3 gaps * 10px
const ITEM_W = (SCREEN_WIDTH - GRID_PADDING - GRID_GAPS) / 4;
const ICON_SZ = Math.min(ITEM_W * 0.65, 80);

/**
 * Feature grid item for the home page.
 * Responsive sizing adapts to screen width.
 */
export function GridItem({ url, icon, text }: GridItemProps) {
  const handlePress = () => {
    try { router.push(url); } catch { /* page may not exist */ }
  };

  return (
    <TouchableOpacity
      style={[st.container, { width: ITEM_W }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[st.iconWrapper, { width: ICON_SZ, height: ICON_SZ }]}>
        <MaterialIcon name={icon} size={ICON_SZ * 0.45} color="#47a5fd" />
      </View>
      <ThemedText style={st.label}>{text}</ThemedText>
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  iconWrapper: {
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8, backgroundColor: '#ffffff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  label: { fontSize: 11, fontWeight: '700', color: '#333333', letterSpacing: 0.5 },
});
