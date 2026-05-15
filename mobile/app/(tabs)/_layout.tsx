import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const { bottom } = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1a4a2e',
        tabBarInactiveTintColor: '#a0b8a4',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0.5,
          borderTopColor: '#e2e8df',
          height: 60 + bottom,
          paddingBottom: Math.max(bottom, 8),
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} /> }} />
      <Tabs.Screen name="map" options={{ title: 'Map', tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? 'map' : 'map-outline'} size={22} color={color} /> }} />
      <Tabs.Screen name="fertilizer" options={{ title: 'Fertilizer', tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? 'flask' : 'flask-outline'} size={22} color={color} /> }} />
      <Tabs.Screen name="yield" options={{ title: 'Yield', tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? 'trending-up' : 'trending-up-outline'} size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} /> }} />
    </Tabs>
  );
}
