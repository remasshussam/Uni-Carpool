import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function DriverTabLayout() {
  return (
    <>
    <StatusBar style="light" />
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00A878',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="home" color={focused ? '#00A878' : '#6B7280'} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-rides"
        options={{
          title: 'My Rides',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="car" color={focused ? '#00A878' : '#6B7280'} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="person" color={focused ? '#00A878' : '#6B7280'} size={size} />
          ),
        }}
      />
    </Tabs>
    </>
  );
}
