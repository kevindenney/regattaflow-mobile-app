/**
 * Simple Club Onboarding Route (No API dependency)
 * For testing the enhanced onboarding UI
 */

import React from 'react';
import { View, SafeAreaView, StyleSheet, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { EnhancedClubOnboarding } from '@/components/onboarding/EnhancedClubOnboarding';

export default function ClubOnboardingSimpleScreen() {
  const router = useRouter();

  const handleComplete = (clubId: string) => {
    Alert.alert(
      'Success!',
      `Club onboarding completed! Club ID: ${clubId}`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Club Setup (Test)',
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
