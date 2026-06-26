import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { Colors, BottomTabInset } from '@/constants/theme';
import { MaterialIcon } from '@/components/MaterialIcon';
import type { IconName } from '@/components/MaterialIcon';

function TabIcon({ name, color, size = 24 }: { name: IconName; color: string; size?: number }) {
  return <MaterialIcon name={name} size={size} color={color} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: isDark ? '#333' : '#e0e0e0',
          borderTopWidth: 0.5,
          paddingBottom: Platform.OS === 'ios' ? BottomTabInset / 2 : 4,
          paddingTop: 4,
          height: Platform.OS === 'ios' ? BottomTabInset + 50 : 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="course"
        options={{
          title: '课程',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="book-open-page-variant" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="test"
        options={{
          title: '测试',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="test-tube" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="user"
        options={{
          title: '我的',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="account" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
