/**
 * RaceCardWithTuning Component
 * Wraps RaceCard with rig tuning recommendation fetching
 * Shows key tuning settings for the boat class based on forecasted conditions
 */

import React, { useMemo } from 'react';
import { RaceCard, type RaceCardProps, type RigTuningData } from './RaceCard';
import { useRaceTuningRecommendation } from '@/hooks/useRaceTuningRecommendation';

export interface RaceCardWithTuningProps extends Omit<RaceCardProps, 'rigTuning'> {
  /** Boat class ID for tuning lookup */
  classId?: string | null;
  /** Boat class name (fallback if no classId) */
  className?: string | null;
}

/**
 * Maps tuning recommendation settings to the compact RigTuningData format
 * Extracts the most important settings for display on race card:
 * - Upper shroud tension
 * - Lower shroud tension  
 * - Headstay/forestay length
 */
function mapTuningToCardFormat(
  settings: Array<{ key: string; label: string; value: string }>
): RigTuningData | undefined {
  if (!settings || settings.length === 0) return undefined;

  // Find key tuning values by their setting keys
  const findSetting = (keys: string[]): string | undefined => {
    for (const key of keys) {
      const setting = settings.find(
        s => s.key === key || s.key.toLowerCase().includes(key.toLowerCase())
      );
      if (setting?.value) return setting.value;
    }
    return undefined;
  };

  const upperShroudTension = findSetting([
    'upper_shrouds',
    'uppers',
    'upper_shroud_tension',
    'cap_shrouds',
    'caps',
  ]);

  const lowerShroudTension = findSetting([
    'lower_shrouds',
    'lowers',
    'lower_shroud_tension',
    'd1',
    'd2',
    'intermediates',
  ]);

  const headstayLength = findSetting([
    'forestay_length',
    'forestay',
    'headstay',
    'headstay_length',
    'jib_halyard',
    'forestay_tension',
  ]);

  // Also check for mast rake and backstay as alternative key settings
  const mastRake = findSetting([
    'mast_rake',
    'rake',
    'mast_position',
  ]);

  const backstay = findSetting([
    'backstay',
    'backstay_tension',
    'runner',
    'runners',
  ]);

  // Return if we have at least one meaningful setting
  if (!upperShroudTension && !lowerShroudTension && !headstayLength && !mastRake && !backstay) {
    return undefined;
  }

  return {
    upperShroudTension: upperShroudTension || mastRake,
    lowerShroudTension: lowerShroudTension || backstay,
    headstayLength,
  };
}

export function RaceCardWithTuning({
  classId,
  className,
  wind,
  raceStatus,
  critical_details,
  ...raceCardProps
}: RaceCardWithTuningProps) {
  // Determine average wind speed for tuning recommendation
  const averageWindSpeed = useMemo(() => {
    if (!wind?.speedMin && !wind?.speedMax) return null;
    const min = wind?.speedMin ?? 0;
    const max = wind?.speedMax ?? min;
    return (min + max) / 2;
  }, [wind?.speedMin, wind?.speedMax]);

  // Only fetch tuning for upcoming races with valid class info
  const shouldFetchTuning = useMemo(() => {
    if (raceStatus === 'past') return false;
    return !!(classId || className);
  }, [raceStatus, classId, className]);

  // Fetch rig tuning recommendation based on class and conditions
  const { settings: tuningSettings, loading: tuningLoading } = useRaceTuningRecommendation({
    classId,
    className,
    averageWindSpeed,
    windMin: wind?.speedMin ?? null,
    windMax: wind?.speedMax ?? null,
    pointsOfSail: 'upwind',
    limit: 1,
    enabled: shouldFetchTuning,
  });

  // Map tuning settings to card display format
  const rigTuning = useMemo(() => {
    return mapTuningToCardFormat(tuningSettings);
  }, [tuningSettings]);

  return (
    <RaceCard
      {...raceCardProps}
      wind={wind}
      raceStatus={raceStatus}
      critical_details={critical_details}
      rigTuning={rigTuning}
    />
  );
}

export default RaceCardWithTuning;

