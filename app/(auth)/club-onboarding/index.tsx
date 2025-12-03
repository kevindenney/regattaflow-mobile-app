/**
 * Club Onboarding Index
 * Redirects to the first step of the wizard
 */

import { Redirect } from 'expo-router';

export default function ClubOnboardingIndex() {
  return <Redirect href="/(auth)/club-onboarding/step-1-basics" />;
}

