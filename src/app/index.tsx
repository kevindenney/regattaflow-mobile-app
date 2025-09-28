/**
 * RegattaFlow Landing Page - Beautiful 3-tab landing experience
 * Migrated from Next.js to React Native Universal
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/src/providers/AuthProvider';
import { getDashboardRoute, shouldCompleteOnboarding, getOnboardingRoute } from '@/src/lib/utils/userTypeRouting';
import { HeroTabs } from '@/src/components/landing/HeroTabs';
import { ScrollFix } from '@/src/components/landing/ScrollFix';

export default function LandingPage() {
  console.log('✅ [LANDING] LandingPage component loading with HeroTabs');

  const { signedIn, ready } = useAuth();

  console.log('🏠 [LANDING] ===== LANDING PAGE RENDER =====');
  console.log('🏠 [LANDING] Auth state:', { signedIn, ready });
  console.log('🏠 [LANDING] ===== LANDING PAGE RENDER COMPLETE =====');

  // Show landing page for unauthenticated users (or if loading takes too long)
  const Container = Platform.OS === 'web' ? View : SafeAreaView;
  return (
    <Container style={styles.container}>
      <ScrollFix />
      <HeroTabs />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    ...Platform.select({
      web: {
        minHeight: '100vh',
        width: '100%',
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});