/**
 * Comprehensive Race Entry Screen
 * Full-featured race strategy planning interface with CourseSetupPrompt (Phase 2)
 */

import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ComprehensiveRaceEntry,
  CourseSetupPrompt,
  type ExtractionMetadata
} from '@/components/races';

export default function ComprehensiveRaceAddScreen() {
  const router = useRouter();

  // CourseSetupPrompt state (Phase 2)
  const [showCourseSetup, setShowCourseSetup] = useState(false);
  const [courseSetupData, setCourseSetupData] = useState<{
    raceId: string;
    raceName: string;
    racingAreaName?: string;
    extractedMarks?: Array<{ name: string; type: string }>;
  } | null>(null);

  const handleSubmit = (raceId: string, metadata?: ExtractionMetadata) => {
    console.log('[ComprehensiveRaceAdd] ===== RACE CREATED =====');
    console.log('[ComprehensiveRaceAdd] Race ID received:', raceId);
    console.log('[ComprehensiveRaceAdd] Race ID type:', typeof raceId);
    console.log('[ComprehensiveRaceAdd] Race ID length:', raceId?.length);
    console.log('[ComprehensiveRaceAdd] Metadata:', metadata);

    // Show CourseSetupPrompt instead of immediate navigation
    const setupData = {
      raceId,
      raceName: metadata?.raceName || 'New Race',
      racingAreaName: metadata?.racingAreaName,
      extractedMarks: metadata?.extractedMarks,
    };

    console.log('[ComprehensiveRaceAdd] Setting courseSetupData:', setupData);
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
    console.log('[ComprehensiveRaceAdd] ===== QUICK DRAW SELECTED =====');
    console.log('[ComprehensiveRaceAdd] courseSetupData:', courseSetupData);
    console.log('[ComprehensiveRaceAdd] Race ID for navigation:', courseSetupData?.raceId);
    setShowCourseSetup(false);

    // Navigate to race detail page with Quick Draw mode
    if (courseSetupData) {
      const navPath = `/(tabs)/race/${courseSetupData.raceId}?tab=strategy&action=quickdraw`;
      console.log('[ComprehensiveRaceAdd] Navigating to:', navPath);
      router.replace(navPath);
    } else {
      console.error('[ComprehensiveRaceAdd] ERROR: courseSetupData is null!');
    }
  };

  const handleLoadTemplate = () => {
    console.log('[ComprehensiveRaceAdd] Load Template selected (Phase 4)');
    setShowCourseSetup(false);

    // Navigate to race detail page with template mode (Phase 4)
    if (courseSetupData) {
      router.replace(`/(tabs)/race/${courseSetupData.raceId}?tab=strategy&action=template`);
    }
  };

  const handleSkip = () => {
    console.log('[ComprehensiveRaceAdd] Skipped course setup');
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
      <ComprehensiveRaceEntry onSubmit={handleSubmit} onCancel={handleCancel} />

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
