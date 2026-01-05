/**
 * Post-Race Analysis Section
 *
 * Displays analysis components for completed races including:
 * - PostRaceAnalysisCard with share/export buttons
 * - Fleet insights from other sailors
 * - Performance metrics from GPS track
 * - Split times analysis
 * - Tactical insights
 * - AI pattern detection for learning
 */

import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { PostRaceAnalysisCard } from '@/components/race-detail';
import { FleetPostRaceInsights } from '@/components/races/FleetPostRaceInsights';
import { PerformanceMetrics } from '@/components/races/PerformanceMetrics';
import { SplitTimesAnalysis } from '@/components/races/SplitTimesAnalysis';
import { TacticalInsights } from '@/components/races/TacticalInsights';
import { AIPatternDetection } from '@/components/races/debrief/AIPatternDetection';
import { createLogger } from '@/lib/utils/logger';
import type { GPSPoint, DebriefSplitTime } from '@/lib/races';

const logger = createLogger('PostRaceAnalysisSection');

export interface PostRaceAnalysisSectionProps {
  /** Race ID */
  raceId: string;
  /** Race name */
  raceName?: string;
  /** Race start time */
  raceStartTime?: string;
  /** Current user ID */
  currentUserId?: string;
  /** GPS track data for performance metrics */
  gpsTrack?: GPSPoint[];
  /** Weather data for performance metrics */
  weather?: any;
  /** Split times data */
  splitTimes?: DebriefSplitTime[];
  /** Callback to share race analysis */
  onShareAnalysis: () => void;
  /** Callback to view a session */
  onViewSession: (sessionId: string) => void;
}

/**
 * Post-Race Analysis Section Component
 */
export function PostRaceAnalysisSection({
  raceId,
  raceName,
  raceStartTime,
  currentUserId,
  gpsTrack,
  weather,
  splitTimes,
  onShareAnalysis,
  onViewSession,
}: PostRaceAnalysisSectionProps) {
  const handleExportData = () => {
    logger.debug('[PostRaceAnalysisSection] Export race analysis');
    Alert.alert('Export', 'Race analysis export coming soon!');
  };

  return (
    <>
      <PostRaceAnalysisCard
        raceId={raceId}
        raceName={raceName}
        raceStartTime={raceStartTime}
      />
      <View className="flex-row flex-wrap gap-2 mt-4">
        <Pressable
          className="flex-row items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200"
          onPress={onShareAnalysis}
        >
          <Text className="text-sm font-semibold text-blue-700">Share summary</Text>
        </Pressable>
        <Pressable
          className="flex-row items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200"
          onPress={handleExportData}
        >
          <Text className="text-sm font-semibold text-slate-700">Export data</Text>
        </Pressable>
      </View>
      <View className="mt-4">
        <FleetPostRaceInsights
          raceId={raceId}
          currentUserId={currentUserId}
          onViewSession={onViewSession}
        />
      </View>
      <View className="mt-4">
        <PerformanceMetrics
          gpsTrack={gpsTrack}
          weather={weather}
        />
      </View>
      <View className="mt-4">
        <SplitTimesAnalysis
          splitTimes={splitTimes}
          raceStartTime={splitTimes?.[0]?.time}
        />
      </View>
      <View className="mt-4">
        <TacticalInsights
          gpsTrack={gpsTrack}
          splitTimes={splitTimes}
          raceResult={{
            position: 3,
            totalBoats: 15,
          }}
        />
      </View>
      {/* Learning Patterns - For Past Races: Analyze Performance */}
      <View className="mt-4">
        <AIPatternDetection />
      </View>
    </>
  );
}

export default PostRaceAnalysisSection;
