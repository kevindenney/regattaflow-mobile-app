/**
 * Dashboard Tab - Main user dashboard with stats and recent events
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/src/lib/contexts/AuthContext';

export default function DashboardScreen() {
  console.log('📊 Dashboard: Component loading - PROTECTED VERSION');
  console.log('🔍 Dashboard: Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');

  const { user, userProfile, signOut, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Please log in</Text>
        <Text style={styles.subtitle}>You need to be authenticated to access this page</Text>
      </View>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Welcome back, {userProfile?.full_name || user.email}!</Text>
      <Text style={styles.text}>Auth Status: ✅ Authenticated</Text>
      <Text style={styles.text}>User: {user.email}</Text>
      <Text style={styles.text}>Profile: {userProfile?.full_name || 'Loading...'}</Text>
      <Text style={styles.text}>Subscription: {userProfile?.subscription_tier || 'Free'}</Text>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  signOutButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});