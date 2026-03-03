/**
 * Enhanced Club Onboarding Route
 * Hybrid AI + structured form experience
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { EnhancedClubOnboarding } from '@/components/onboarding/EnhancedClubOnboarding';

export default function ClubOnboardingEnhancedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ domain?: string }>();
  const domainHint = Array.isArray(params.domain) ? params.domain[0] : params.domain;
  const normalizedDomainHint = String(domainHint || '').toLowerCase().trim();

  const handleComplete = (workspaceId: string) => {
    void workspaceId;
    router.replace('/(tabs)/programs' as any);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Organization Setup',
          headerShown: true,
          headerBackTitle: 'Back',
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView style={styles.container}>
        <EnhancedClubOnboarding
          domainHint={normalizedDomainHint || null}
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
