/**
 * Enhanced Club Onboarding Route
 * Hybrid AI + structured form experience
 */

import React from 'react';
import { View, SafeAreaView, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { EnhancedClubOnboarding } from '@/components/onboarding/EnhancedClubOnboarding';

export default function ClubOnboardingEnhancedScreen() {
  const router = useRouter();

  const handleComplete = (clubId: string) => {
    // Navigate to club dashboard or event creation
    router.replace({
      pathname: '/club/event/create',
      params: { clubId },
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Club Setup',
          headerShown: true,
          headerBackTitle: 'Back',
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView style={styles.container}>
        <EnhancedClubOnboarding
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});
