import { Tabs } from 'expo-router';
import { useColorScheme, Platform, Text } from 'react-native';
import { Colors, BottomTabInset } from '@/constants/theme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: '#666666',
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
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="course"
        options={{
          title: '课程',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>📚</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="test"
        options={{
          title: '测试',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>🧪</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="user"
        options={{
          title: '我的',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}
