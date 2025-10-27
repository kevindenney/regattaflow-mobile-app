/**
 * Edit Race Screen - Uses ComprehensiveRaceEntry in edit mode
 */

import { useRouter, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { ComprehensiveRaceEntry } from '@/components/races';

export default function EditRaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const handleSubmit = (raceId: string) => {
    console.log('[EditRaceScreen] Race updated:', raceId);
    // Navigate back to race detail
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/(tabs)/race/${raceId}`);
    }
  };

  const handleCancel = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/races');
    }
  };

  if (!id) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <ComprehensiveRaceEntry
        existingRaceId={id}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </View>
  );
}
