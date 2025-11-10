/**
 * Add Race Screen - Uses ComprehensiveRaceEntry (same as Edit Race)
 * Consolidated interface for adding new races with full AI extraction and validation
 */

import { useRouter, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { ComprehensiveRaceEntry } from '@/components/races';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('AddRaceScreen');

export default function AddRaceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ courseId?: string; courseName?: string }>();

  logger.debug('[AddRaceScreen] Rendered with params:', {
    courseId: params?.courseId,
    courseName: params?.courseName,
  });

  const handleSubmit = (raceId: string) => {
    logger.debug('[AddRaceScreen] Race created:', raceId);
    // Navigate to race detail
    router.push(`/(tabs)/race/scrollable/${raceId}` as any);
  };

  const handleCancel = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/races');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ComprehensiveRaceEntry
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        initialCourseId={params?.courseId as string | undefined}
        initialCourseName={params?.courseName as string | undefined}
      />
    </View>
  );
}
