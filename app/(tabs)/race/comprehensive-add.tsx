/**
 * Comprehensive Race Entry Screen
 * Full-featured race strategy planning interface with CourseSetupPrompt (Phase 2)
 */

import React, { useState } from 'react';
import { View, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { createLogger } from '@/lib/utils/logger';
import {
  ComprehensiveRaceEntry,
  CourseSetupPrompt,
  type ExtractionMetadata
} from '@/components/races';

const logger = createLogger('ComprehensiveRaceAdd');

export default function ComprehensiveRaceAddScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();

  // CourseSetupPrompt state (Phase 2)
  const [showCourseSetup, setShowCourseSetup] = useState(false);
  const [courseSetupData, setCourseSetupData] = useState<{
    raceId: string;
    raceName: string;
    racingAreaName?: string;
    extractedMarks?: Array<{ name: string; type: string }>;
  } | null>(null);

  const handleSubmit = (raceId: string, metadata?: ExtractionMetadata) => {
    logger.debug('[ComprehensiveRaceAdd] ===== RACE CREATED =====');
    logger.debug('[ComprehensiveRaceAdd] Race ID received:', raceId);
    logger.debug('[ComprehensiveRaceAdd] Race ID type:', typeof raceId);
    logger.debug('[ComprehensiveRaceAdd] Race ID length:', raceId?.length);

    // On web, skip the modal and navigate directly (Modal doesn't work well on web)
    if (Platform.OS === 'web') {
      logger.debug('[ComprehensiveRaceAdd] Web platform detected - navigating directly');
      router.replace(`/(tabs)/races?selected=${raceId}`);
      return;
    }

    // Show CourseSetupPrompt instead of immediate navigation (mobile only)
    const setupData = {
      raceId,
      raceName: metadata?.raceName || 'New Race',
      racingAreaName: metadata?.racingAreaName,
      extractedMarks: metadata?.extractedMarks,
    };

    setCourseSetupData(setupData);
    setShowCourseSetup(true);
  };

  const handleCancel = () => {
    // Check if there's a screen to go back to
    if (router.canGoBack()) {
      router.back();
    } else {
      // Navigate to races list as fallback
      router.replace('/(tabs)/races');
    }
  };

  const handleQuickDraw = () => {
    logger.debug('[ComprehensiveRaceAdd] ===== QUICK DRAW SELECTED =====');
    logger.debug('[ComprehensiveRaceAdd] Race ID for navigation:', courseSetupData?.raceId);
    setShowCourseSetup(false);

    // Navigate to race detail page with Quick Draw mode
    if (courseSetupData) {
      const navPath = `/(tabs)/race/${courseSetupData.raceId}?tab=strategy&action=quickdraw`;
      logger.debug('[ComprehensiveRaceAdd] Navigating to:', navPath);
      router.replace(navPath as any);
    } else {
      console.error('[ComprehensiveRaceAdd] ERROR: courseSetupData is null!');
    }
  };

  const handleLoadTemplate = () => {
    logger.debug('[ComprehensiveRaceAdd] Load Template selected (Phase 4)');
    setShowCourseSetup(false);

    // Navigate to race detail page with template mode (Phase 4)
    if (courseSetupData) {
      router.replace(`/(tabs)/race/${courseSetupData.raceId}?tab=strategy&action=template` as any);
    }
  };

  const handleSkip = () => {
    logger.debug('[ComprehensiveRaceAdd] Skipped course setup');
    setShowCourseSetup(false);

    // Navigate to race detail page (Overview tab)
    if (courseSetupData) {
      router.replace(`/(tabs)/race/${courseSetupData.raceId}`);
    }
  };

  const handleClosePrompt = () => {
    // Same as skip - go to race detail
    handleSkip();
  };

  return (
    <View className="flex-1">
      <ComprehensiveRaceEntry
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        existingRaceId={editId}
      />

      {/* CourseSetupPrompt - Phase 2 */}
      {courseSetupData && (
        <CourseSetupPrompt
          visible={showCourseSetup}
          raceName={courseSetupData.raceName}
          raceId={courseSetupData.raceId}
          racingAreaName={courseSetupData.racingAreaName}
          extractedMarks={courseSetupData.extractedMarks}
          onQuickDraw={handleQuickDraw}
          onLoadTemplate={handleLoadTemplate}
          onSkip={handleSkip}
          onClose={handleClosePrompt}
        />
      )}
    </View>
  );
}
