/**
 * Dashboard Tab - AI-Powered Sailing Intelligence Hub
 * Complete "OnX Maps for Sailing" experience with race strategy, venue detection, and 3D visualization
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useAuth } from '@/src/lib/contexts/AuthContext';
import RaceDashboard from '@/components/dashboard/RaceDashboard';
import { AppHeader } from '@/components/layout/AppHeader';

export default function DashboardScreen() {
  console.log('🎯 Dashboard: AI-Powered Sailing Intelligence Hub loading');
  const { user, userProfile, signOut, loading } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingTitle}>🧠 Loading AI Intelligence...</Text>
        <Text style={styles.loadingSubtitle}>Initializing race strategy engine</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🏁 RegattaFlow</Text>
        <Text style={styles.subtitle}>Please log in to access AI race strategy features</Text>
        <Text style={styles.description}>
          • AI-powered race strategy generation
          • 3D course visualization
          • Global venue intelligence
          • Real-time tactical guidance
        </Text>
      </View>
    );
  }

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of RegattaFlow?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
            }
          }
        }
      ]
    );
  };

  const dismissWelcome = () => {
    setShowWelcome(false);
  };

  if (showWelcome) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <AppHeader title="Dashboard" />
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>🏆 Welcome to RegattaFlow</Text>
        <Text style={styles.welcomeSubtitle}>
          The "OnX Maps for Sailing" Experience
        </Text>

        <View style={styles.featureList}>
          <Text style={styles.featureItem}>🧠 AI Race Strategy Generation</Text>
          <Text style={styles.featureItem}>🌍 Global Venue Intelligence (147+ locations)</Text>
          <Text style={styles.featureItem}>🗺️ 3D Course Visualization</Text>
          <Text style={styles.featureItem}>📱 Mobile Race Day Interface</Text>
          <Text style={styles.featureItem}>🎯 Real-time Tactical Guidance</Text>
          <Text style={styles.featureItem}>📊 Performance Analytics</Text>
        </View>

        <Text style={styles.welcomeDescription}>
          RegattaFlow transforms scattered sailing documents and conditions into winning race strategies.
          Just like OnX Maps revolutionized hunting, we&apos;re revolutionizing sailing with location-aware intelligence.
        </Text>

        <View style={styles.welcomeActions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={dismissWelcome}
          >
            <Text style={styles.primaryButtonText}>🚀 Launch Intelligence Hub</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSignOut}
          >
            <Text style={styles.secondaryButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userText}>⚓ Welcome aboard, {userProfile?.full_name || user.email}!</Text>
          <Text style={styles.tierText}>Plan: {userProfile?.subscription_tier || 'Free'}</Text>
        </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AppHeader title="Dashboard" />
      <RaceDashboard />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0066CC',
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  welcomeContainer: {
    flex: 1,
    backgroundColor: 'linear-gradient(135deg, #0066CC 0%, #004499 100%)',
    padding: 24,
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
    fontStyle: 'italic',
  },
  featureList: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  featureItem: {
    fontSize: 18,
    color: 'white',
    marginBottom: 12,
    fontWeight: '600',
  },
  welcomeDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  welcomeActions: {
    gap: 16,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#00FF88',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  userInfo: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  userText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  tierText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0066CC',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
});