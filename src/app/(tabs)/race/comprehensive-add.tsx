/**
 * Comprehensive Race Entry Screen
 * Full-featured race strategy planning interface
 */

import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ComprehensiveRaceEntry } from '@/src/components/races/ComprehensiveRaceEntry';

export default function ComprehensiveRaceAddScreen() {
  const router = useRouter();

  const handleSubmit = (raceId: string) => {
    // Navigate to race detail or dashboard
    router.push(`/(tabs)/race/${raceId}`);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View className="flex-1">
      <ComprehensiveRaceEntry onSubmit={handleSubmit} onCancel={handleCancel} />
    </View>
  );
}
