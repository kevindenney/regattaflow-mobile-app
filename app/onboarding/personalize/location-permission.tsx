/**
 * Location Permission Screen
 * Contextual location request before showing nearby clubs
 */

import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { PermissionScreen } from '@/components/onboarding/PermissionScreen';
import { OnboardingStateService } from '@/services/onboarding/OnboardingStateService';

export default function LocationPermissionScreen() {
  const router = useRouter();

  const handleAllow = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request location permission:', error);
      return false;
    }
  };

  const handleSkip = async () => {
    // User chose to skip - we'll still let them search for clubs manually
  };

  return (
    <PermissionScreen
      iconName="location"
      title="Find Clubs Near You"
      description="Allow location access to discover sailing clubs and races in your area."
      benefits={[
        'See yacht clubs within sailing distance',
        'Get local race notifications',
        'Connect with sailors in your region',
        'Automatic venue weather updates',
      ]}
      allowText="Enable Location"
      skipText="Not now"
      nextRoute="/onboarding/personalize/club-nearby"
      currentStep={6}
      totalSteps={11}
      onAllow={handleAllow}
      onSkip={handleSkip}
    />
  );
}
