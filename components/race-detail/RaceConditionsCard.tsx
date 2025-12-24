/**
 * Race Conditions Card - Tufte-inspired Design
 * High data density with sparklines and minimal chrome
 * Maximizes data-ink ratio following Edward Tufte's principles
 */

import { useRaceWeather } from '@/hooks/useRaceWeather';
import { useTidalIntel } from '@/hooks/useTidalIntel';
import { TidalCurrentEstimator } from '@/services/tides/TidalCurrentEstimator';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { StrategyCard } from './StrategyCard';

interface ConditionsTimelinePoint {
  time: Date;
  label: string;
  shortLabel: string;
  isRaceEvent?: boolean;
  eventType?: 'warning' | 'start' | 'finish';
  windSpeed: number;
  windDirection: number;
  windGusts?: number;
  tidePhase: 'flood' | 'ebb' | 'slack' | 'high' | 'low';
  tideHeight?: number;
  currentSpeed?: number;
  waveHeight?: number;
  wavePeriod?: number;
}

interface RaceConditionsCardProps {
  raceId: string;
  raceTime?: string;
  venueCoordinates?: {
    lat: number;
    lng: number;
  };
  venue?: {
    id: string;
    name: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    region: string;
    country: string;
  };
  warningSignalTime?: string;
  expectedDurationMinutes?: number;
  /** Saved wind data from race metadata (shown on RaceCard) */
  savedWind?: {
    direction: string;
    speedMin: number;
    speedMax: number;
  } | null;
  /** Saved tide data from race metadata (shown on RaceCard) */
  savedTide?: {
    state: string;
    height: number;
    direction?: string;
  } | null;
  /** When the saved data was fetched */
  savedWeatherFetchedAt?: string | null;
  /** Race status - past races show historical snapshot */
  raceStatus?: 'past' | 'next' | 'future';
}

// Sparkline component - word-sized inline chart
function Sparkline({ 
  data, 
  width = 80, 
  height = 20,
  color = '#3B82F6',
  showDots = false,
  highlightMax = false,
  highlightMin = false,
}: { 
  data: number[]; 
  width?: number; 
  height?: number;
  color?: string;
  showDots?: boolean;
  highlightMax?: boolean;
  highlightMin?: boolean;
}) {
  if (data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return { x, y, value };
  });
  
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
  
  const maxIndex = data.indexOf(max);
  const minIndex = data.indexOf(min);
  
  return (
    <Svg width={width} height={height}>
      <Path
        d={pathD}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots && points.map((p, i) => (
        <Circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={2}
          fill={color}
          opacity={0.5}
        />
      ))}
      {highlightMax && (
        <Circle
          cx={points[maxIndex].x}
          cy={points[maxIndex].y}
          r={3}
          fill={color}
        />
      )}
      {highlightMin && (
        <Circle
          cx={points[minIndex].x}
          cy={points[minIndex].y}
          r={3}
          fill="#94A3B8"
        />
      )}
    </Svg>
  );
}

// Wind direction arrow - tiny inline compass
function WindArrow({ direction, size = 12 }: { direction: number; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2L12 22M12 2L8 8M12 2L16 8"
        stroke="#64748B"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        transform={`rotate(${direction}, 12, 12)`}
      />
    </Svg>
  );
}

export function RaceConditionsCard({
  raceId,
  raceTime,
  venueCoordinates,
  venue,
  warningSignalTime,
  expectedDurationMinutes = 90,
  savedWind,
  savedTide,
  savedWeatherFetchedAt,
  raceStatus,
}: RaceConditionsCardProps) {
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);
  
  // Determine if this is a past race
  const isPastRace = useMemo(() => {
    if (raceStatus === 'past') return true;
    if (!raceTime) return false;
    const raceDate = new Date(raceTime);
    const now = new Date();
    // Consider race "past" if it ended more than 3 hours ago
    const raceEndEstimate = new Date(raceDate.getTime() + expectedDurationMinutes * 60 * 1000 + 3 * 60 * 60 * 1000);
    return now > raceEndEstimate;
  }, [raceTime, raceStatus, expectedDurationMinutes]);

  // Determine if race is too far in the future for reliable forecasts (>10 days / 240 hours)
  // This matches the limit in useRaceWeather, useEnrichedRaces, and RaceWeatherService
  const isTooFarInFuture = useMemo(() => {
    if (isPastRace) return false;
    if (!raceTime) return false;
    const raceDate = new Date(raceTime);
    const now = new Date();
    const hoursUntil = (raceDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil > 240; // 10 days
  }, [raceTime, isPastRace]);

  // For past races, skip live fetching and use saved data only
  // For upcoming races within forecast window, fetch live weather data
  // For races too far in future, don't fetch (forecasts not reliable)
  const shouldFetchLive = !isPastRace && !isTooFarInFuture;

  // Fetch weather data (only for non-past races)
  const { weather: realWeather, loading: weatherLoading, refetch: loadWeather } = useRaceWeather(
    shouldFetchLive ? (venue || (venueCoordinates ? {
      id: `venue-${venueCoordinates.lat}-${venueCoordinates.lng}`,
      name: 'Race Venue',
      coordinates: {
        latitude: venueCoordinates.lat,
        longitude: venueCoordinates.lng
      },
      region: 'unknown',
      country: 'unknown'
    } as any : null)) : null,
    shouldFetchLive ? raceTime : null
  );

  // Fetch tidal intel (only for non-past races)
  const intelCoordinates = useMemo(() => {
    if (!shouldFetchLive) return null;
    if (venue?.coordinates) {
      return { lat: venue.coordinates.latitude, lng: venue.coordinates.longitude };
    }
    return venueCoordinates || null;
  }, [venue?.coordinates, venueCoordinates, shouldFetchLive]);

  const { intel: tidalIntel, loading: tidalLoading } = useTidalIntel({
    coordinates: intelCoordinates,
    referenceTime: shouldFetchLive ? (raceTime || null) : null
  });

  const loading = shouldFetchLive && (weatherLoading || tidalLoading);
  // For far-future races, don't consider saved data as valid (forecasts aren't reliable yet)
  // For past races, use saved data. For upcoming races within window, use live or saved data.
  const hasData = isPastRace 
    ? (savedWind || savedTide) 
    : isTooFarInFuture 
      ? false // Don't show saved data for far-future races
      : (realWeather || tidalIntel || savedWind || savedTide);

  useEffect(() => {
    if (hasData) setHasAutoLoaded(true);
  }, [hasData]);

  // Build timeline data
  const conditionsTimeline = useMemo((): ConditionsTimelinePoint[] => {
    if (!raceTime) return [];
    
    const raceDate = new Date(raceTime);
    if (Number.isNaN(raceDate.getTime())) return [];
    
    let warningTime: Date;
    if (warningSignalTime) {
      const [hours, minutes] = warningSignalTime.split(':').map(Number);
      warningTime = new Date(raceDate);
      warningTime.setHours(hours, minutes, 0, 0);
    } else {
      warningTime = raceDate;
    }
    
    const startTime = new Date(warningTime.getTime() + 5 * 60 * 1000);
    const finishTime = new Date(startTime.getTime() + expectedDurationMinutes * 60 * 1000);
    const timelineStart = new Date(warningTime.getTime() - 30 * 60 * 1000);
    
    const points: ConditionsTimelinePoint[] = [];
    
    // Use savedWind as primary source for consistency with summary/RaceCard display
    // Fall back to realWeather only if savedWind is not available
    // This ensures timeline matches the displayed wind range (e.g., 9-26 kts)
    const windSource = savedWind || realWeather?.wind;
    const baseWind = windSource ? 
      Math.round((Math.min(windSource.speedMin, windSource.speedMax) + Math.max(windSource.speedMin, windSource.speedMax)) / 2) : 12;
    const baseDirection = windSource ? 
      cardinalToDegrees(windSource.direction) : 225;
    const baseGusts = windSource ? Math.max(windSource.speedMin, windSource.speedMax) : undefined;
    
    // For past races, use saved tide data; for upcoming races, use live tidal intel
    const tideSource = isPastRace ? savedTide : tidalIntel?.current;
    const highTideTime = isPastRace ? undefined : tidalIntel?.extremes?.nextHigh?.time;
    const highTideHeight = isPastRace ? savedTide?.height : tidalIntel?.extremes?.nextHigh?.height;
    const lowTideTime = isPastRace ? undefined : tidalIntel?.extremes?.nextLow?.time;
    const lowTideHeight = isPastRace ? undefined : tidalIntel?.extremes?.nextLow?.height;
    const tideRange = tidalIntel?.range ?? 2.0;
    const baseTideHeight = tideSource?.height ?? savedTide?.height ?? 1.5;
    const baseTideState = (tideSource as any)?.state ?? savedTide?.state ?? 'slack';
    
    const forecasts = isPastRace ? [] : (realWeather?.raw?.forecast || []);
    const marineConditions = isPastRace ? undefined : realWeather?.raw?.marineConditions;
    
    // Estimation helpers (same as before, condensed)
    // Get wind range for synthesizing variation when no forecast data
    const windMin = windSource?.speedMin ?? baseWind;
    const windMax = windSource?.speedMax ?? baseWind;
    const hasWindRange = windMax - windMin >= 3;
    
    const estimateWindAtTime = (time: Date, timelinePosition?: number) => {
      // PRIORITY 1: If savedWind has a meaningful range, synthesize variation using that
      // This ensures timeline matches the displayed wind range on the card (e.g., 9-26 kts)
      // and avoids mismatch when live forecast differs from saved data
      if (savedWind && hasWindRange && timelinePosition !== undefined) {
        // Create a smooth wave pattern: starts at min, peaks mid-race, drops toward end
        // Wave reaches full range so timeline matches the displayed header (e.g., 9-26 kts)
        const waveValue = Math.sin(timelinePosition * Math.PI);
        const speed = Math.round(windMin + (windMax - windMin) * waveValue);
        return { 
          speed, 
          direction: baseDirection, 
          gusts: speed < windMax ? Math.round(speed * 1.15) : undefined 
        };
      }
      
      // PRIORITY 2: Use live forecast data if available and no savedWind
      if (forecasts.length > 0 && !savedWind) {
        const timeMs = time.getTime();
        let before = forecasts[0], after = forecasts[forecasts.length - 1];
        for (let i = 0; i < forecasts.length - 1; i++) {
          const ft = forecasts[i].timestamp || new Date(forecasts[i].time);
          const nt = forecasts[i + 1].timestamp || new Date(forecasts[i + 1].time);
          if (ft.getTime() <= timeMs && nt.getTime() >= timeMs) {
            before = forecasts[i]; after = forecasts[i + 1]; break;
          }
        }
        const bt = (before.timestamp || new Date(before.time)).getTime();
        const at = (after.timestamp || new Date(after.time)).getTime();
        const p = at !== bt ? (timeMs - bt) / (at - bt) : 0;
        return {
          speed: Math.round(before.windSpeed + (after.windSpeed - before.windSpeed) * p),
          direction: Math.round(before.windDirection + (after.windDirection - before.windDirection) * p),
          gusts: before.windGusts || after.windGusts ? Math.round((before.windGusts || before.windSpeed * 1.2) + ((after.windGusts || after.windSpeed * 1.2) - (before.windGusts || before.windSpeed * 1.2)) * p) : undefined
        };
      }
      
      // PRIORITY 3: Basic fallback with thermal effects
      const h = time.getHours();
      const thermal = h >= 10 && h <= 16 ? 1.15 : 1.0;
      const v = Math.sin(time.getTime() / (30 * 60 * 1000)) * 0.1;
      return { speed: Math.round(baseWind * thermal * (1 + v)), direction: Math.round(baseDirection + v * 15), gusts: baseGusts ? Math.round(baseGusts * thermal) : undefined };
    };
    
    const interpolateTideHeight = (time: Date): number | undefined => {
      if (!highTideTime || !lowTideTime || !Number.isFinite(highTideHeight) || !Number.isFinite(lowTideHeight)) return tidalIntel?.current?.height;
      const timeMs = time.getTime(), highMs = highTideTime.getTime(), lowMs = lowTideTime.getTime();
      const halfPeriod = 372.5 * 60 * 1000;
      if (highMs < lowMs) {
        if (timeMs <= highMs) { const p = (timeMs - (highMs - halfPeriod)) / halfPeriod; return lowTideHeight + (highTideHeight - lowTideHeight) * (1 - Math.cos(p * Math.PI)) / 2; }
        if (timeMs <= lowMs) { const p = (timeMs - highMs) / (lowMs - highMs); return highTideHeight - (highTideHeight - lowTideHeight) * (1 - Math.cos(p * Math.PI)) / 2; }
        const p = (timeMs - lowMs) / halfPeriod; return lowTideHeight + (highTideHeight - lowTideHeight) * (1 - Math.cos(p * Math.PI)) / 2;
      } else {
        if (timeMs <= lowMs) { const p = (timeMs - (lowMs - halfPeriod)) / halfPeriod; return highTideHeight - (highTideHeight - lowTideHeight) * (1 - Math.cos(p * Math.PI)) / 2; }
        if (timeMs <= highMs) { const p = (timeMs - lowMs) / (highMs - lowMs); return lowTideHeight + (highTideHeight - lowTideHeight) * (1 - Math.cos(p * Math.PI)) / 2; }
        const p = (timeMs - highMs) / halfPeriod; return highTideHeight - (highTideHeight - lowTideHeight) * (1 - Math.cos(p * Math.PI)) / 2;
      }
    };
    
    const estimateCurrentSpeed = (time: Date): number => {
      // Use sophisticated TidalCurrentEstimator for accurate current estimates
      // Handles Hong Kong-specific patterns and spring/neap cycles
      const coords = venueCoordinates || (venue?.coordinates ? {
        lat: venue.coordinates.latitude,
        lng: venue.coordinates.longitude
      } : null);
      
      if (coords) {
        const highTideExtreme = highTideTime && highTideHeight !== undefined
          ? { type: 'high' as const, time: highTideTime, height: highTideHeight }
          : null;
        const lowTideExtreme = lowTideTime && lowTideHeight !== undefined
          ? { type: 'low' as const, time: lowTideTime, height: lowTideHeight }
          : null;
        
        const estimate = TidalCurrentEstimator.estimateCurrent(
          coords.lat,
          coords.lng,
          time,
          highTideExtreme,
          lowTideExtreme,
          tidalIntel?.current?.speed || null
        );
        
        return estimate.speed;
      }
      
      // Fallback to basic estimation if no coordinates
      const base = (tidalIntel?.current?.speed && tidalIntel.current.speed > 0) 
        ? tidalIntel.current.speed 
        : 0.5;
      if (!highTideTime || !lowTideTime) return base;
      const timeMs = time.getTime();
      const minToHigh = Math.abs(highTideTime.getTime() - timeMs) / 60000;
      const minToLow = Math.abs(lowTideTime.getTime() - timeMs) / 60000;
      const minToNearest = Math.min(minToHigh, minToLow);
      const mult = Math.sin(Math.min(minToNearest / 372, 1) * Math.PI);
      return Math.round(base * mult * (tideRange / 2) * 10) / 10;
    };
    
    const estimateTidePhase = (time: Date): 'flood' | 'ebb' | 'slack' | 'high' | 'low' => {
      // Use TidalCurrentEstimator for consistent phase calculation
      const coords = venueCoordinates || (venue?.coordinates ? {
        lat: venue.coordinates.latitude,
        lng: venue.coordinates.longitude
      } : null);
      
      if (coords) {
        const highTideExtreme = highTideTime && highTideHeight !== undefined
          ? { type: 'high' as const, time: highTideTime, height: highTideHeight }
          : null;
        const lowTideExtreme = lowTideTime && lowTideHeight !== undefined
          ? { type: 'low' as const, time: lowTideTime, height: lowTideHeight }
          : null;
        
        const estimate = TidalCurrentEstimator.estimateCurrent(
          coords.lat,
          coords.lng,
          time,
          highTideExtreme,
          lowTideExtreme,
          null
        );
        
        // Map the phase to the expected format
        if (estimate.phase === 'slack_high') return 'high';
        if (estimate.phase === 'slack_low') return 'low';
        return estimate.phase;
      }
      
      // Fallback to basic calculation
      if (!highTideTime || !lowTideTime) return tidalIntel?.current?.flow || 'slack';
      const timeMs = time.getTime(), highMs = highTideTime.getTime(), lowMs = lowTideTime.getTime();
      if (highMs < lowMs) {
        const minToHigh = (highMs - timeMs) / 60000;
        if (minToHigh < 15 && minToHigh > -15) return 'high';
        return minToHigh > 0 ? 'flood' : 'ebb';
      } else {
        const minToLow = (lowMs - timeMs) / 60000;
        if (minToLow < 15 && minToLow > -15) return 'low';
        return minToLow > 0 ? 'ebb' : 'flood';
      }
    };
    
    const estimateWaves = (time: Date, timelinePosition?: number) => {
      if (forecasts.length > 0) {
        const timeMs = time.getTime();
        let before = forecasts[0], after = forecasts[forecasts.length - 1];
        for (let i = 0; i < forecasts.length - 1; i++) {
          const ft = forecasts[i].timestamp || new Date(forecasts[i].time);
          const nt = forecasts[i + 1].timestamp || new Date(forecasts[i + 1].time);
          if (ft.getTime() <= timeMs && nt.getTime() >= timeMs) { before = forecasts[i]; after = forecasts[i + 1]; break; }
        }
        const bt = (before.timestamp || new Date(before.time)).getTime();
        const at = (after.timestamp || new Date(after.time)).getTime();
        const p = at !== bt ? (timeMs - bt) / (at - bt) : 0;
        return { height: Math.round(((before.waveHeight ?? 0.5) + ((after.waveHeight ?? 0.5) - (before.waveHeight ?? 0.5)) * p) * 10) / 10, period: before.wavePeriod || after.wavePeriod };
      }
      const wind = estimateWindAtTime(time, timelinePosition);
      return { height: Math.round((0.5 + wind.speed / 20 * 0.3) * 10) / 10, period: marineConditions?.swellPeriod ?? 5 };
    };
    
    // Calculate timeline position (0-1) for a given time
    const timelineSpan = finishTime.getTime() - timelineStart.getTime();
    const getTimelinePosition = (time: Date) => {
      return Math.max(0, Math.min(1, (time.getTime() - timelineStart.getTime()) / timelineSpan));
    };
    
    const addPoint = (time: Date, label: string, shortLabel: string, isRaceEvent?: boolean, eventType?: 'warning' | 'start' | 'finish') => {
      const position = getTimelinePosition(time);
      const wind = estimateWindAtTime(time, position);
      const waves = estimateWaves(time, position);
      points.push({
        time, label, shortLabel, isRaceEvent, eventType,
        windSpeed: wind.speed, windDirection: wind.direction, windGusts: wind.gusts,
        tidePhase: estimateTidePhase(time), tideHeight: interpolateTideHeight(time), currentSpeed: estimateCurrentSpeed(time),
        waveHeight: waves.height, wavePeriod: waves.period,
      });
    };
    
    addPoint(timelineStart, '30 min before', '-30m');
    addPoint(warningTime, 'Warning Signal', 'Warn', true, 'warning');
    addPoint(startTime, 'Race Start', 'Start', true, 'start');
    addPoint(new Date(startTime.getTime() + (expectedDurationMinutes / 2) * 60 * 1000), 'Mid-race', 'Mid');
    addPoint(finishTime, 'Expected Finish', 'Finish', true, 'finish');
    
    // Add tide extremes
    if (tidalIntel?.extremes) {
      const { nextHigh, nextLow } = tidalIntel.extremes;
      if (nextHigh?.time && nextHigh.time >= timelineStart && nextHigh.time <= finishTime) {
        if (!points.find(p => Math.abs(p.time.getTime() - nextHigh.time.getTime()) < 600000)) {
          addPoint(nextHigh.time, 'High Tide', 'HT');
        }
      }
      if (nextLow?.time && nextLow.time >= timelineStart && nextLow.time <= finishTime) {
        if (!points.find(p => Math.abs(p.time.getTime() - nextLow.time.getTime()) < 600000)) {
          addPoint(nextLow.time, 'Low Tide', 'LT');
        }
      }
    }
    
    points.sort((a, b) => a.time.getTime() - b.time.getTime());
    return points;
  }, [raceTime, warningSignalTime, expectedDurationMinutes, realWeather, tidalIntel, isPastRace, savedWind, savedTide]);

  // Extract data arrays for sparklines
  const rawWindSpeeds = conditionsTimeline.map(p => p.windSpeed);
  const currentSpeeds = conditionsTimeline.map(p => p.currentSpeed ?? 0);
  const waveHeights = conditionsTimeline.map(p => p.waveHeight ?? 0);
  const tideHeights = conditionsTimeline.map(p => p.tideHeight ?? 0);
  
  // If wind speeds have no variation but savedWind has a range, synthesize variation
  // This prevents flat sparklines when showing saved min/max range but computed average
  const windSpeeds = useMemo(() => {
    if (rawWindSpeeds.length < 2) return rawWindSpeeds;
    
    const rawMin = Math.min(...rawWindSpeeds);
    const rawMax = Math.max(...rawWindSpeeds);
    const hasRealVariation = rawMax - rawMin >= 2;
    
    // If we have real variation in the data, use it as-is
    if (hasRealVariation) return rawWindSpeeds;
    
    // If savedWind has a meaningful range but computed data is flat, 
    // synthesize a realistic variation pattern using the savedWind range
    const savedMin = savedWind?.speedMin;
    const savedMax = savedWind?.speedMax;
    
    if (savedMin !== undefined && savedMax !== undefined && savedMax - savedMin >= 3) {
      const midpoint = (savedMin + savedMax) / 2;
      const amplitude = (savedMax - savedMin) / 2;
      
      return rawWindSpeeds.map((_, index) => {
        // Create a smooth wave pattern across the timeline
        // Starts lower, builds to peak in middle, then drops
        const progress = index / (rawWindSpeeds.length - 1);
        const waveValue = Math.sin(progress * Math.PI);
        return Math.round(midpoint - amplitude * 0.5 + amplitude * waveValue);
      });
    }
    
    return rawWindSpeeds;
  }, [rawWindSpeeds, savedWind]);

  // Get Hong Kong area profile for the venue (if applicable)
  const hkAreaProfile = useMemo(() => {
    const coords = venueCoordinates || (venue?.coordinates ? {
      lat: venue.coordinates.latitude,
      lng: venue.coordinates.longitude
    } : null);
    
    if (!coords) return null;
    return TidalCurrentEstimator.getNearestAreaProfile(coords.lat, coords.lng);
  }, [venueCoordinates, venue?.coordinates]);

  // Calculate spring/neap factor for display
  const springNeapFactor = useMemo(() => {
    if (!raceTime) return null;
    return TidalCurrentEstimator.calculateSpringNeapFactor(new Date(raceTime));
  }, [raceTime]);

  const getWindDir = (deg: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  const getCardStatus = () => {
    if (loading && !hasData) return 'generating';
    if (!hasData && !hasAutoLoaded) return 'not_set';
    return 'ready';
  };

  const renderContent = () => {
    if (loading && !hasData) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color="#64748B" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (!hasData && !hasAutoLoaded) {
      // Show appropriate message based on why data isn't available
      if (isTooFarInFuture) {
        return (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Forecast not yet available</Text>
            <Text style={[styles.emptyText, { fontSize: 12, marginTop: 8, opacity: 0.7 }]}>
              Weather forecasts are only available for races within 10 days
            </Text>
          </View>
        );
      }
      
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No venue coordinates set</Text>
          <TouchableOpacity style={styles.loadButton} onPress={loadWeather}>
            <Text style={styles.loadButtonText}>Load Conditions</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (conditionsTimeline.length === 0) {
      return <Text style={styles.emptyText}>Set race time to view conditions</Text>;
    }

    const first = conditionsTimeline[0];
    const last = conditionsTimeline[conditionsTimeline.length - 1];
    
    // Use savedWind/savedTide for summary display (to match race card which uses the same data)
    // This ensures both components show consistent data from the same source
    // For past races: use saved snapshot. For future races: savedWind should contain live data from useEnrichedRaces
    const windMin = savedWind?.speedMin !== undefined 
      ? Math.min(savedWind.speedMin, savedWind.speedMax)
      : Math.min(...windSpeeds);
    const windMax = savedWind?.speedMax !== undefined 
      ? Math.max(savedWind.speedMin, savedWind.speedMax)
      : Math.max(...windSpeeds);
    const windRange = `${windMin}–${windMax}`;
    
    // Use saved wind direction to match race card
    const summaryWindDirection = savedWind?.direction
      ? savedWind.direction
      : getWindDir(first.windDirection);
    
    const currentRange = `${Math.min(...currentSpeeds).toFixed(1)}–${Math.max(...currentSpeeds).toFixed(1)}`;
    const waveRange = `${Math.min(...waveHeights).toFixed(1)}–${Math.max(...waveHeights).toFixed(1)}`;

    // Format race date for display
    const raceDate = raceTime ? new Date(raceTime) : null;
    const raceDateStr = raceDate ? raceDate.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }) : '';
    
    // Check if saved data differs from live data
    const savedWindSpeed = savedWind ? Math.round((savedWind.speedMin + savedWind.speedMax) / 2) : null;
    const liveWindSpeed = first?.windSpeed;
    const windDiffers = savedWindSpeed !== null && Math.abs(savedWindSpeed - liveWindSpeed) > 2;
    
    const savedTideState = savedTide?.state;
    const liveTideState = first?.tidePhase;
    const tideDiffers = savedTideState && savedTideState !== liveTideState;

    return (
      <View style={styles.content}>
        {/* Date/Time Header */}
        <View style={styles.dateHeader}>
          <View style={styles.dateHeaderLeft}>
            <Text style={styles.dateText}>{raceDateStr}</Text>
            {isPastRace && (
              <View style={styles.historicalBadge}>
                <Text style={styles.historicalBadgeText}>HISTORICAL</Text>
              </View>
            )}
          </View>
          <Text style={styles.timeRangeText}>
            {first.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            {' → '}
            {last.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </Text>
        </View>

        {/* Data Source Note - for past races or if saved data differs */}
        {isPastRace ? (
          <View style={styles.dataSourceNoteHistorical}>
            <Text style={styles.dataSourceNoteTextHistorical}>
              📋 Showing conditions as they were during the race
              {savedWeatherFetchedAt && ` • Data recorded ${new Date(savedWeatherFetchedAt).toLocaleDateString()}`}
            </Text>
          </View>
        ) : (windDiffers || tideDiffers) && (
          <View style={styles.dataSourceNote}>
            <Text style={styles.dataSourceNoteText}>
              ⚠ Live forecast differs from saved data on race card
              {savedWeatherFetchedAt && ` (saved ${new Date(savedWeatherFetchedAt).toLocaleDateString()})`}
            </Text>
            {savedWind && (
              <Text style={styles.savedDataText}>
                Card shows: {savedWind.direction} {savedWind.speedMin}–{savedWind.speedMax} kts
                {savedTide ? `, ${savedTide.state}` : ''}
              </Text>
            )}
          </View>
        )}

        {/* Summary Row with Sparklines */}
        <View style={styles.summarySection}>
          {/* Wind Summary */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryLabel}>
              <Text style={styles.labelText}>Wind</Text>
            </View>
            <View style={styles.summarySparkline}>
              <Sparkline data={windSpeeds} color="#3B82F6" width={100} height={24} highlightMax />
            </View>
            <View style={styles.summaryValues}>
              <Text style={styles.valueMain}>{windRange}</Text>
              <Text style={styles.valueUnit}>kts</Text>
            </View>
            <View style={styles.summaryDirection}>
              <WindArrow direction={first.windDirection} />
              <Text style={styles.directionText}>{summaryWindDirection}</Text>
              {first.windDirection !== last.windDirection && !realWeather?.wind?.direction && (
                <>
                  <Text style={styles.directionArrow}>→</Text>
                  <Text style={styles.directionText}>{getWindDir(last.windDirection)}</Text>
                </>
              )}
            </View>
          </View>

          {/* Current Summary */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryLabel}>
              <Text style={styles.labelText}>Current</Text>
              {hkAreaProfile && (
                <Text style={styles.areaHint}>{hkAreaProfile.name.split(' ')[0]}</Text>
              )}
            </View>
            <View style={styles.summarySparkline}>
              <Sparkline data={currentSpeeds} color="#10B981" width={100} height={24} highlightMax />
            </View>
            <View style={styles.summaryValues}>
              <Text style={styles.valueMain}>{currentRange}</Text>
              <Text style={styles.valueUnit}>kts</Text>
            </View>
            <View style={styles.summaryDirection}>
              <Text style={styles.phaseText}>{first.tidePhase}</Text>
              {first.tidePhase !== last.tidePhase && (
                <>
                  <Text style={styles.directionArrow}>→</Text>
                  <Text style={styles.phaseText}>{last.tidePhase}</Text>
                </>
              )}
            </View>
          </View>
          
          {/* Spring/Neap indicator for HK waters */}
          {hkAreaProfile && springNeapFactor !== null && (
            <View style={styles.tidalInfoRow}>
              <Text style={styles.tidalInfoText}>
                🌙 {springNeapFactor > 0.7 ? 'Spring tide' : springNeapFactor < 0.3 ? 'Neap tide' : 'Mid-cycle'} 
                {' • Max current: ~'}{(hkAreaProfile.maxNeapCurrent + (hkAreaProfile.maxSpringCurrent - hkAreaProfile.maxNeapCurrent) * springNeapFactor).toFixed(1)} kts
              </Text>
            </View>
          )}

          {/* Waves Summary */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryLabel}>
              <Text style={styles.labelText}>Waves</Text>
            </View>
            <View style={styles.summarySparkline}>
              <Sparkline data={waveHeights} color="#0EA5E9" width={100} height={24} highlightMax />
            </View>
            <View style={styles.summaryValues}>
              <Text style={styles.valueMain}>{waveRange}</Text>
              <Text style={styles.valueUnit}>m</Text>
            </View>
            <View style={styles.summaryDirection}>
              <Text style={styles.periodText}>{first.wavePeriod?.toFixed(0) ?? '–'}s</Text>
            </View>
          </View>

          {/* Tide Height (if available) */}
          {tideHeights.some(h => h > 0) && (
            <View style={styles.summaryRow}>
              <View style={styles.summaryLabel}>
                <Text style={styles.labelText}>Tide</Text>
              </View>
              <View style={styles.summarySparkline}>
                <Sparkline data={tideHeights} color="#6366F1" width={100} height={24} highlightMax highlightMin />
              </View>
              <View style={styles.summaryValues}>
                <Text style={styles.valueMain}>
                  {Math.min(...tideHeights.filter(h => h > 0)).toFixed(1)}–{Math.max(...tideHeights).toFixed(1)}
                </Text>
                <Text style={styles.valueUnit}>m</Text>
              </View>
              <View style={styles.summaryDirection}>
                <Text style={styles.rangeText}>Δ{(Math.max(...tideHeights) - Math.min(...tideHeights.filter(h => h > 0))).toFixed(1)}m</Text>
              </View>
            </View>
          )}
        </View>

        {/* Compact Data Table */}
        <View style={styles.tableSection}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.timeCol]}>Time</Text>
            <Text style={[styles.tableHeaderCell, styles.eventCol]}>Event</Text>
            <Text style={[styles.tableHeaderCell, styles.dataCol]}>Wind</Text>
            <Text style={[styles.tableHeaderCell, styles.dataCol]}>Current</Text>
            <Text style={[styles.tableHeaderCell, styles.dataCol]}>Waves</Text>
          </View>

          {/* Data Rows */}
          {conditionsTimeline.map((point, index) => (
            <View 
              key={index} 
              style={[
                styles.tableRow,
                point.isRaceEvent && styles.tableRowHighlight,
                index === conditionsTimeline.length - 1 && styles.tableRowLast
              ]}
            >
              <Text style={[styles.tableCell, styles.timeCol, styles.timeText]}>
                {point.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </Text>
              <View style={[styles.eventCol]}>
                <Text style={[styles.tableCell, styles.eventText, point.isRaceEvent && styles.eventTextBold]}>
                  {point.shortLabel}
                </Text>
              </View>
              <View style={[styles.dataCol, styles.dataCell]}>
                <Text style={styles.dataValue}>{point.windSpeed}</Text>
                <WindArrow direction={point.windDirection} size={10} />
                <Text style={styles.dataLabel}>{getWindDir(point.windDirection)}</Text>
              </View>
              <View style={[styles.dataCol, styles.dataCell]}>
                <Text style={[styles.dataValue, point.currentSpeed && point.currentSpeed > 0.3 && styles.dataValueStrong]}>
                  {point.currentSpeed?.toFixed(1) ?? '–'}
                </Text>
                <Text style={styles.dataLabel}>{point.tidePhase.slice(0, 3)}</Text>
              </View>
              <View style={[styles.dataCol, styles.dataCell]}>
                <Text style={styles.dataValue}>{point.waveHeight?.toFixed(1) ?? '–'}</Text>
                <Text style={styles.dataLabel}>{point.wavePeriod ? `${Math.round(point.wavePeriod)}s` : ''}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer with units */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Wind: knots • Current: knots • Waves: meters • Period: seconds</Text>
        </View>
      </View>
    );
  };

  return (
    <StrategyCard
      icon="weather-partly-cloudy"
      title={isPastRace ? "Race Conditions (Historical)" : "Race Conditions"}
      status={getCardStatus()}
      statusMessage={isPastRace ? 'Recorded conditions' : (hasData ? 'Data loaded' : 'Loading...')}
      expandable={false}
    >
      {renderContent()}
    </StrategyCard>
  );
}

function cardinalToDegrees(cardinal: string): number {
  const d: Record<string, number> = { N: 0, NNE: 22.5, NE: 45, ENE: 67.5, E: 90, ESE: 112.5, SE: 135, SSE: 157.5, S: 180, SSW: 202.5, SW: 225, WSW: 247.5, W: 270, WNW: 292.5, NW: 315, NNW: 337.5 };
  return d[cardinal?.toUpperCase()] ?? 0;
}

const styles = StyleSheet.create({
  loadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  loadButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  loadButtonText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  content: {
    gap: 12,
  },
  // Date header
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  timeRangeText: {
    fontSize: 12,
    color: '#64748B',
    fontVariant: ['tabular-nums'],
  },
  historicalBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historicalBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4338CA',
    letterSpacing: 0.5,
  },
  // Data source warning
  dataSourceNote: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    padding: 8,
    gap: 4,
  },
  dataSourceNoteText: {
    fontSize: 11,
    color: '#92400E',
  },
  savedDataText: {
    fontSize: 11,
    color: '#78716C',
    fontStyle: 'italic',
  },
  // Historical data note (for past races)
  dataSourceNoteHistorical: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 6,
    padding: 8,
  },
  dataSourceNoteTextHistorical: {
    fontSize: 11,
    color: '#0369A1',
  },
  // Summary section with sparklines
  summarySection: {
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    width: 52,
  },
  labelText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  summarySparkline: {
    flex: 1,
    maxWidth: 100,
  },
  summaryValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    minWidth: 60,
  },
  valueMain: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  valueUnit: {
    fontSize: 11,
    color: '#94A3B8',
  },
  summaryDirection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 70,
  },
  directionText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  directionArrow: {
    fontSize: 10,
    color: '#CBD5E1',
  },
  phaseText: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  periodText: {
    fontSize: 11,
    color: '#64748B',
  },
  areaHint: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '400',
  },
  tidalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    backgroundColor: '#F0FDF4',
    borderRadius: 4,
    marginTop: 4,
  },
  tidalInfoText: {
    fontSize: 10,
    color: '#166534',
  },
  rangeText: {
    fontSize: 11,
    color: '#6366F1',
    fontWeight: '500',
  },
  // Table section
  tableSection: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowHighlight: {
    backgroundColor: '#FFFBEB',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCell: {
    fontSize: 12,
    color: '#334155',
  },
  timeCol: {
    width: 48,
  },
  eventCol: {
    width: 50,
  },
  dataCol: {
    flex: 1,
    minWidth: 60,
  },
  timeText: {
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
    color: '#64748B',
  },
  eventText: {
    fontSize: 11,
    color: '#64748B',
  },
  eventTextBold: {
    fontWeight: '600',
    color: '#0F172A',
  },
  dataCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dataValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
    minWidth: 24,
  },
  dataValueStrong: {
    color: '#F59E0B',
  },
  dataLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  footer: {
    paddingTop: 4,
  },
  footerText: {
    fontSize: 10,
    color: '#CBD5E1',
    textAlign: 'center',
  },
});
