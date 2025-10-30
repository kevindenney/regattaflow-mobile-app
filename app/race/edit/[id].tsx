/**
 * Edit Race Screen - Uses ComprehensiveRaceEntry in edit mode
 */

import { useRouter, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { ComprehensiveRaceEntry } from '@/components/races';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('EditRaceScreen');

export default function EditRaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const handleSubmit = (raceId: string) => {
    logger.debug('[EditRaceScreen] Race updated:', raceId);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/races');
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
