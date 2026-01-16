import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { OnboardingCompletion } from '@/components/onboarding';
import { useAuth } from '@/providers/AuthProvider';

export default function CoachOnboardingComplete() {
  const { user, refreshPersonaContext } = useAuth();
  const hasRefreshed = useRef(false);

  // Refresh capabilities when this screen loads to ensure tabs update
  useEffect(() => {
    if (!hasRefreshed.current && refreshPersonaContext) {
      hasRefreshed.current = true;
      refreshPersonaContext();
    }
  }, [refreshPersonaContext]);

  return (
    <View style={{ flex: 1 }}>
      <OnboardingCompletion
        userType="coach"
        userName={user?.user_metadata?.full_name || user?.email?.split('@')[0]}
        nextSteps={[
          {
            icon: 'people',
            title: 'Find Clients',
            description: 'Browse sailors looking for coaching',
            route: '/(tabs)/clients',
          },
          {
            icon: 'calendar',
            title: 'Set Availability',
            description: 'Manage your coaching schedule',
            route: '/(tabs)/schedule',
          },
          {
            icon: 'cash',
            title: 'View Earnings',
            description: 'Track your coaching income',
            route: '/(tabs)/earnings',
          },
        ]}
      />
    </View>
  );
}
