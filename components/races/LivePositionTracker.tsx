/**
 * Live Position Tracker Component - Phase 2
 * Real-time GPS position display with breadcrumb trail
 *
 * Features:
 * - Current position marker (boat icon)
 * - Breadcrumb trail (last 30 seconds, fading)
 * - Speed over ground (SOG)
 * - Course over ground (COG)
 * - Accuracy indicator
 * - Distance/bearing to next mark
 * - Battery-efficient updates (1Hz)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Navigation, Signal, Battery } from 'lucide-react-native';
import * as Location from 'expo-location';

interface Position {
  latitude: number;
  longitude: number;
  speed: number | null; // m/s
  heading: number | null; // degrees
  accuracy: number | null; // meters
  timestamp: number;
}

interface LivePositionTrackerProps {
  onPositionUpdate?: (position: Position) => void;
  onTrailUpdate?: (trail: Position[]) => void;
  targetMark?: {
    latitude: number;
    longitude: number;
    name: string;
  };
  updateInterval?: number; // milliseconds (default 1000 = 1Hz)
  trailDuration?: number; // seconds (default 30)
}

export function LivePositionTracker({
  onPositionUpdate,
  onTrailUpdate,
  targetMark,
  updateInterval = 1000,
  trailDuration = 30,
}: LivePositionTrackerProps) {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [trail, setTrail] = useState<Position[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'unknown'>('unknown');
  const [isTracking, setIsTracking] = useState(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  // Request location permissions
  useEffect(() => {
    // Location tracking is only supported on native platforms
    if (Platform.OS === 'web') {
      setPermissionStatus('denied');
      return;
    }

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionStatus(status === 'granted' ? 'granted' : 'denied');
      } catch (error) {
        console.error('[LivePositionTracker] Permission request error:', error);
        setPermissionStatus('denied');
      }
    })();
  }, []);

  // Start GPS tracking
  useEffect(() => {
    if (Platform.OS === 'web') return; // Location not supported on web
    if (permissionStatus !== 'granted') return;

    const startTracking = async () => {
      try {
        // Start location updates
        subscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: updateInterval,
            distanceInterval: 0, // Update on every time interval
          },
          (location) => {
            const position: Position = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              speed: location.coords.speed, // m/s
              heading: location.coords.heading, // degrees
              accuracy: location.coords.accuracy, // meters
              timestamp: location.timestamp,
            };

            setCurrentPosition(position);
            onPositionUpdate?.(position);

            // Update breadcrumb trail
            setTrail((prevTrail) => {
              const newTrail = [...prevTrail, position];

              // Remove old positions (older than trailDuration)
              const cutoffTime = Date.now() - (trailDuration * 1000);
              const filteredTrail = newTrail.filter(p => p.timestamp > cutoffTime);

              onTrailUpdate?.(filteredTrail);
              return filteredTrail;
            });
          }
        );

        setIsTracking(true);
      } catch (error) {
        console.error('[LivePositionTracker] Tracking start error:', error);
      }
    };

    startTracking();

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        setIsTracking(false);
      }
    };
  }, [permissionStatus, updateInterval, trailDuration, onPositionUpdate, onTrailUpdate]);

  // Calculate distance to target mark (Haversine formula)
  const calculateDistance = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }, []);

  // Calculate bearing to target mark
  const calculateBearing = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x =
      Math.cos(φ1) * Math.sin(φ2) -
      Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);

    return ((θ * 180) / Math.PI + 360) % 360; // Bearing in degrees
  }, []);

  // Convert m/s to knots
  const metersPerSecondToKnots = (mps: number): number => {
    return mps * 1.94384;
  };

  // Convert meters to nautical miles
  const metersToNauticalMiles = (meters: number): number => {
    return meters / 1852;
  };

  // Calculate distance and bearing to target mark
  const targetInfo = currentPosition && targetMark ? {
    distance: calculateDistance(
      currentPosition.latitude,
      currentPosition.longitude,
      targetMark.latitude,
      targetMark.longitude
    ),
    bearing: calculateBearing(
      currentPosition.latitude,
      currentPosition.longitude,
      targetMark.latitude,
      targetMark.longitude
    ),
  } : null;

  // Permission denied
  if (permissionStatus === 'denied') {
    return (
      <View style={styles.errorContainer}>
        <Signal size={24} color="#EF4444" />
        <Text style={styles.errorText}>Location permission denied</Text>
        <Text style={styles.errorSubtext}>Enable location in settings to track position</Text>
      </View>
    );
  }

  // Waiting for GPS
  if (!currentPosition) {
    return (
      <View style={styles.loadingContainer}>
        <Signal size={24} color="#3B82F6" />
        <Text style={styles.loadingText}>Acquiring GPS signal...</Text>
      </View>
    );
  }

  // Get accuracy status color
  const getAccuracyColor = (accuracy: number | null): string => {
    if (!accuracy) return '#9CA3AF';
    if (accuracy <= 5) return '#10B981'; // Excellent
    if (accuracy <= 10) return '#3B82F6'; // Good
    if (accuracy <= 20) return '#F59E0B'; // Fair
    return '#EF4444'; // Poor
  };

  const accuracyColor = getAccuracyColor(currentPosition.accuracy);
  const speedKnots = currentPosition.speed ? metersPerSecondToKnots(currentPosition.speed) : 0;

  return (
    <View style={styles.container}>
      {/* GPS Status Indicator */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <Signal size={16} color={accuracyColor} />
          <Text style={[styles.statusText, { color: accuracyColor }]}>
            {currentPosition.accuracy ? `±${currentPosition.accuracy.toFixed(0)}m` : 'N/A'}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusText}>
            {trail.length} pts
          </Text>
        </View>
      </View>

      {/* Speed & Heading Display */}
      <View style={styles.mainInfo}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>SPEED (SOG)</Text>
          <Text style={styles.infoValue}>{speedKnots.toFixed(1)} kt</Text>
        </View>

        {currentPosition.heading !== null && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>HEADING (COG)</Text>
            <View style={styles.headingContainer}>
              <Navigation
                size={20}
                color="#3B82F6"
                style={{ transform: [{ rotate: `${currentPosition.heading}deg` }] }}
              />
              <Text style={styles.infoValue}>{Math.round(currentPosition.heading)}°</Text>
            </View>
          </View>
        )}
      </View>

      {/* Target Mark Info */}
      {targetInfo && targetMark && (
        <View style={styles.targetInfo}>
          <Text style={styles.targetLabel}>→ {targetMark.name}</Text>
          <View style={styles.targetDetails}>
            <Text style={styles.targetDistance}>
              {metersToNauticalMiles(targetInfo.distance).toFixed(2)} nm
            </Text>
            <Text style={styles.targetBearing}>
              @ {Math.round(targetInfo.bearing)}°
            </Text>
          </View>
        </View>
      )}

      {/* Position Coordinates (Debug) */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            {currentPosition.latitude.toFixed(6)}, {currentPosition.longitude.toFixed(6)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  mainInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  headingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  targetInfo: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3730A3',
    marginBottom: 4,
  },
  targetDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  targetDistance: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E40AF',
    fontVariant: ['tabular-nums'],
  },
  targetBearing: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    fontVariant: ['tabular-nums'],
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  errorSubtext: {
    fontSize: 12,
    color: '#991B1B',
    textAlign: 'center',
  },
  loadingContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  debugInfo: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  debugText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#6B7280',
  },
});
