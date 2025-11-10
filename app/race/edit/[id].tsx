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

  logger.debug('[EditRaceScreen] Rendered with ID:', {
    id,
    idType: typeof id,
    idLength: id?.length,
    isString: typeof id === 'string',
    isArray: Array.isArray(id)
  });

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
    logger.warn('[EditRaceScreen] No ID provided, returning null');
    return null;
  }

  // Validate UUID format (basic check)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const actualId = Array.isArray(id) ? id[0] : id;

  if (!uuidPattern.test(actualId)) {
    logger.error('[EditRaceScreen] Invalid UUID format:', {
      id: actualId,
      length: actualId.length
    });
  }

  return (
    <View style={{ flex: 1 }}>
      <ComprehensiveRaceEntry
        existingRaceId={actualId}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </View>
  );
}
