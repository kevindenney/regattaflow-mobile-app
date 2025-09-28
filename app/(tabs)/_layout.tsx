import { Tabs, router } from 'expo-router';
import React, { useEffect } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/lib/contexts/AuthContext';

export default function TabLayout() {
  console.log('🔸 TabLayout: Starting to render');
  console.log('🔍 TabLayout: Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');
  console.log('🔍 TabLayout: Current pathname:', typeof window !== 'undefined' ? window.location.pathname : 'SSR');

  const colorScheme = useColorScheme();
  const { user, loading, signedIn } = useAuth();

  console.log('🎨 TabLayout: Color scheme:', colorScheme);
  console.log('🔐 TabLayout: Auth state DETAILED:', {
    user: !!user,
    userId: user?.id,
    email: user?.email,
    loading,
    signedIn,
    timestamp: new Date().toISOString()
  });

  // Auth guard: redirect to login if not authenticated
  useEffect(() => {
    console.log('🔐 TabLayout: Auth guard effect triggered', { user: !!user, loading, signedIn });

    if (!loading) {
      if (!user) {
        console.log('🚪 TabLayout: User not authenticated, will redirect to login');
        console.log('🔍 TabLayout: Current route before redirect:', window.location.pathname);

        setTimeout(() => {
          console.log('🚪 TabLayout: Executing redirect to login');
          router.replace('/(auth)/login');
        }, 100); // Small delay to avoid immediate redirect
      } else {
        console.log('✅ TabLayout: User authenticated, allowing tabs access');
      }
    } else {
      console.log('⏳ TabLayout: Still loading auth state, not redirecting yet');
    }
  }, [user, loading, signedIn]);

  // Add early return for loading state
  if (loading) {
    console.log('⏳ TabLayout: Rendering loading state');
    return null; // Don't render tabs while loading
  }

  if (!user) {
    console.log('🚫 TabLayout: No user, rendering nothing (redirect should happen)');
    return null; // Don't render tabs if no user
  }

  console.log('✅ TabLayout: Rendering tabs for authenticated user');

  const tabScreens = [
    'documents', 'dashboard', 'map', 'coaches', 'regattas', 'results', 'strategy', 'profile'
  ];
  console.log('📱 TabLayout: Configured tab screens (DOCUMENTS FIRST, COACHES ADDED):', tabScreens);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documents',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="doc.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="map.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="coaches"
        options={{
          title: 'Coaches',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="graduationcap.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="regattas"
        options={{
          title: 'Regattas',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="sailboat.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: 'Results',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="trophy.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="strategy"
        options={{
          title: 'Strategy',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="brain.head.profile" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
