/**
 * Dashboard Route Handler
 * Redirects users to the appropriate dashboard based on their role
 *
 * - Sailors → /races (renamed from Dashboard in Phase 1)
 * - Coaches → /coach/dashboard (coach-specific dashboard)
 * - Clubs → /club/dashboard (club-specific dashboard)
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

export default function DashboardRedirect() {
  const { userProfile, loading, ready } = useAuth();

  useEffect(() => {
    // Wait for auth to be ready
    if (!ready || loading) return;

    // Redirect based on user type
    const userType = userProfile?.user_type;

    switch (userType) {
      case 'sailor':
        // Sailors use the Races tab instead of Dashboard (Phase 1 change)
        router.replace('/(tabs)/races');
        break;

      case 'coach':
        // TODO: Create coach-specific dashboard
        // For now, redirect to coaching tab
        router.replace('/(tabs)/courses');
        break;

      case 'club':
        // TODO: Create club-specific dashboard
        // For now, redirect to events management
        router.replace('/(tabs)/events');
        break;

      default:
        // Fallback to sailor experience when role is missing
        router.replace('/(tabs)/races');
    }
  }, [userProfile, loading, ready]);

  // Show loading while determining redirect
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.text}>Loading dashboard...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});
