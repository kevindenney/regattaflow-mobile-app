/**
 * RegattaFlow Landing Page - Beautiful 3-tab landing experience
 * Migrated from Next.js to React Native Universal
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/src/providers/AuthProvider';
import { getDashboardRoute, shouldCompleteOnboarding, getOnboardingRoute } from '@/src/lib/utils/userTypeRouting';
import { HeroPhones } from '@/src/components/landing/HeroPhones';
import { ScrollFix } from '@/src/components/landing/ScrollFix';

export default function LandingPage() {
  const { signedIn, ready } = useAuth();

  // Show landing page for unauthenticated users
  const Container = Platform.OS === 'web' ? View : SafeAreaView;
  return (
    <Container style={styles.container}>
      <ScrollFix />
      <HeroPhones />
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
