import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import ProgramsExperience from './programs-experience';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { trackRaceManagementAliasUsage } from '@/lib/navigation/raceManagementAlias';

export default function RaceManagementAliasRoute() {
  const redirectOnly = isFeatureEnabled('RACE_MANAGEMENT_ALIAS_REDIRECT_ONLY');

  useEffect(() => {
    void trackRaceManagementAliasUsage();
  }, []);

  if (redirectOnly) {
    return <Redirect href="/(tabs)/programs" />;
  }

  return <ProgramsExperience />;
}
