import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';


export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FFF', // Color blanco para los íconos activos
        tabBarInactiveTintColor: 'gray', // Color gris para los íconos inactivos
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
            backgroundColor: '#F4A83D', // Fondo naranja
          },
          default: {
            backgroundColor: '#F4A83D', // Fondo naranja para otras plataformas
          },
        }),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="clipboard-text" size={28} color={color} />
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="map-marker" color={color} />,
        }}
      />
      <Tabs.Screen
        name="buscar"
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={30} name="magnify" color={color} />,
        }}
      />
    </Tabs>
  );
}