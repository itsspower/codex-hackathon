import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { RelinkColors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: RelinkColors.primary,
        tabBarInactiveTintColor: RelinkColors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: RelinkColors.surface,
          borderTopColor: RelinkColors.border,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="opportunities"
        options={{
          title: 'Opportunities',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="work-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="alumni"
        options={{
          title: 'Alumni',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="groups" color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="notifications-none" color={color} />,
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Applications',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="assignment" color={color} />,
        }}
      />
      <Tabs.Screen
        name="mentorship"
        options={{
          title: 'Mentorship',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="school" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="person-outline" color={color} />,
        }}
      />
      <Tabs.Screen name="opportunities/[id]" options={{ href: null }} />
      <Tabs.Screen name="chatbot" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="profile-setup" options={{ href: null }} />
    </Tabs>
  );
}
