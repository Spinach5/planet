import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcon } from '@/components/MaterialIcon';
import type { IconName } from '@/components/MaterialIcon';

interface GridItemProps {
  url: string;
  icon: IconName;
  text: string;
}

/**
 * Feature grid item for the home page.
 * Replaces Taro's GridItem — icon with blue color, text label below.
 * Navigates to the target URL on press.
 * Matches original: 80x80 icon wrapper with shadow, blue icon, bold text.
 */
export function GridItem({ url, icon, text }: GridItemProps) {
  const handlePress = () => {
    try {
      router.push(url);
    } catch {
      // Silently fail — page may not exist yet
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrapper}>
        <MaterialIcon name={icon} size={25} color="#47a5fd" />
      </View>
      <ThemedText style={styles.label}>
        {text}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: '#ffffff',
    // Shadow matching original design
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333333',
    letterSpacing: 0.5,
  },
});
