/**
 * On-Water Tracking View Component
 * Main component for the On-Water Execution section
 * Integrates GPS tracking with map display and stats
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { GPSTrackMapView } from './GPSTrackMapView';
import { TrackStatsPanel } from './TrackStatsPanel';
import { TrackModeToggle, TrackMode } from './TrackModeToggle';
import { gpsTracker, GPSTrackPoint } from '@/services/GPSTracker';

interface OnWaterTrackingViewProps {
  // Timer session ID
  sessionId?: string;

  // Whether tracking is currently active
  isTracking: boolean;

  // Course marks to display on map
  courseMarks?: Array<{
    name: string;
    latitude: number;
    longitude: number;
  }>;

  // Fleet tracks for comparison
  fleetTracks?: Array<{
    sailorName: string;
    color: string;
    trackPoints: GPSTrackPoint[];
  }>;

  // Initial map region
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

export function OnWaterTrackingView({
  sessionId,
  isTracking,
  courseMarks = [],
  fleetTracks = [],
  initialRegion,
}: OnWaterTrackingViewProps) {
  const { width } = useWindowDimensions();
  const [trackMode, setTrackMode] = useState<TrackMode>('live');
  const [trackPoints, setTrackPoints] = useState<GPSTrackPoint[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Calculate stats from track points
  const stats = calculateTrackStats(trackPoints, startTime);

  // Poll GPS tracker for updates
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      const currentTrack = gpsTracker.getTrackPoints();
      setTrackPoints(currentTrack);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isTracking]);

  // Reset when tracking starts
  useEffect(() => {
    if (isTracking) {
      setStartTime(Date.now());
      setTrackMode('live');
    }
  }, [isTracking]);

  // Determine if we should use auto-follow
  const shouldAutoFollow = trackMode === 'live' && isTracking;

  // Responsive layout: side-by-side on larger screens, stacked on mobile
  const isLargeScreen = width >= 768;

  return (
    <View style={styles.container}>
      {/* Track Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TrackModeToggle
          mode={trackMode}
          onModeChange={setTrackMode}
          isTracking={isTracking}
        />
      </View>

      {/* Main Content */}
      <View style={[
        styles.content,
        isLargeScreen ? styles.contentRow : styles.contentColumn,
      ]}>
        {/* Map View */}
        <View style={[
          styles.mapContainer,
          isLargeScreen && styles.mapContainerLarge,
        ]}>
          <GPSTrackMapView
            trackPoints={trackPoints}
            autoFollow={shouldAutoFollow}
            fleetTracks={fleetTracks}
            initialRegion={initialRegion}
            courseMarks={courseMarks}
          />
        </View>

        {/* Stats Panel */}
        <View style={[
          styles.statsContainer,
          isLargeScreen && styles.statsContainerLarge,
        ]}>
          <TrackStatsPanel
            currentSpeed={stats.currentSpeed}
            distanceSailed={stats.distanceSailed}
            averageSpeed={stats.averageSpeed}
            maxSpeed={stats.maxSpeed}
            timeElapsed={stats.timeElapsed}
            currentHeading={stats.currentHeading}
          />
        </View>
      </View>
    </View>
  );
}

// Helper function to calculate track statistics
function calculateTrackStats(
  trackPoints: GPSTrackPoint[],
  startTime: number
): {
  currentSpeed: number;
  distanceSailed: number;
  averageSpeed: number;
  maxSpeed: number;
  timeElapsed: number;
  currentHeading: number;
} {
  if (trackPoints.length === 0) {
    return {
      currentSpeed: 0,
      distanceSailed: 0,
      averageSpeed: 0,
      maxSpeed: 0,
      timeElapsed: Math.floor((Date.now() - startTime) / 1000),
      currentHeading: 0,
    };
  }

  // Current speed from last point
  const lastPoint = trackPoints[trackPoints.length - 1];
  const currentSpeed = (lastPoint.speed || 0) * 1.94384; // m/s to knots

  // Calculate distance sailed
  let distanceSailed = 0;
  for (let i = 1; i < trackPoints.length; i++) {
    const dist = haversineDistance(
      trackPoints[i - 1].lat,
      trackPoints[i - 1].lng,
      trackPoints[i].lat,
      trackPoints[i].lng
    );
    distanceSailed += dist;
  }
  distanceSailed = distanceSailed / 1852; // meters to nautical miles

  // Calculate average speed
  const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
  const averageSpeed = timeElapsed > 0
    ? (distanceSailed / (timeElapsed / 3600))
    : 0;

  // Calculate max speed
  const maxSpeed = trackPoints.reduce((max, point) => {
    const speed = (point.speed || 0) * 1.94384;
    return Math.max(max, speed);
  }, 0);

  // Current heading
  const currentHeading = lastPoint.heading || 0;

  return {
    currentSpeed,
    distanceSailed,
    averageSpeed,
    maxSpeed,
    timeElapsed,
    currentHeading,
  };
}

// Haversine distance calculation
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  toggleContainer: {
    padding: 12,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
  },
  contentRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  contentColumn: {
    flexDirection: 'column',
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapContainerLarge: {
    flex: 6,
    height: 'auto',
  },
  statsContainer: {
    minHeight: 200,
  },
  statsContainerLarge: {
    flex: 4,
  },
});
