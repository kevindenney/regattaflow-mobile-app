/**
 * Race Timer Screen - Live GPS Tracking & Tactical Display
 * Real-time countdown, GPS track recording, and tactical overlays
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '@/providers/AuthProvider';
import { RaceTimerService } from '@/services/RaceTimerService';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('[id]');
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RaceInfo {
  id: string;
  name: string;
  vhf_channel?: string;
  starting_sequence?: string;
  predicted_course_id?: string;
}

interface RaceCourse {
  id: string;
  name: string;
  marks: {
    name: string;
    latitude: number;
    longitude: number;
    type: 'start' | 'windward' | 'leeward' | 'gate' | 'finish';
  }[];
}

interface WindData {
  speed: number; // knots
  direction: number; // 0-360 degrees
  gust?: number;
}

interface CurrentData {
  speed: number; // knots
  direction: number; // 0-360 degrees
}

export default function RaceTimerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  // Race data
  const [race, setRace] = useState<RaceInfo | null>(null);
  const [raceCourse, setRaceCourse] = useState<RaceCourse | null>(null);

  // Timer state
  const [sequenceTime, setSequenceTime] = useState<number | null>(null); // seconds until start
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [isRacing, setIsRacing] = useState(false);
  const [raceTime, setRaceTime] = useState(0); // seconds since start

  // Session tracking
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [trackPointCount, setTrackPointCount] = useState(0);

  // GPS & Position
  const [currentPosition, setCurrentPosition] = useState<Location.LocationObject | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0); // knots
  const [currentHeading, setCurrentHeading] = useState<number>(0);

  // Tactical data
  const [windData, setWindData] = useState<WindData>({ speed: 12, direction: 45 });
  const [currentData, setCurrentData] = useState<CurrentData>({ speed: 0.5, direction: 180 });
  const [showLaylines, setShowLaylines] = useState(true);
  const [twaPort, setTwaPort] = useState<number>(45); // True Wind Angle Port
  const [twaStarboard, setTwaStarboard] = useState<number>(45); // True Wind Angle Starboard

  // Intervals
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const raceTimeInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const positionInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load race data
  useEffect(() => {
    loadRaceData();
    return () => {
      cleanup();
    };
  }, [id]);

  // Update position
  useEffect(() => {
    if (isRacing) {
      positionInterval.current = setInterval(() => {
        updatePosition();
        checkMarkRounding();
      }, 1000);
    } else {
      if (positionInterval.current) {
        clearInterval(positionInterval.current);
      }
    }

    return () => {
      if (positionInterval.current) {
        clearInterval(positionInterval.current);
      }
    };
  }, [isRacing]);

  const loadRaceData = async () => {
    try {
      // Load race info
      const { data: raceData, error: raceError } = await supabase
        .from('regattas')
        .select('*')
        .eq('id', id)
        .single();

      if (raceError) throw raceError;
      setRace(raceData);

      // Load race course if available
      if (raceData.predicted_course_id) {
        const { data: courseData, error: courseError } = await supabase
          .from('race_courses')
          .select('*')
          .eq('id', raceData.predicted_course_id)
          .single();

        if (!courseError && courseData) {
          setRaceCourse(courseData);
        }
      }
    } catch (error) {
      console.error('Error loading race data:', error);
      Alert.alert('Error', 'Could not load race information');
    }
  };

  const updatePosition = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCurrentPosition(location);

      // Convert m/s to knots (1 m/s = 1.94384 knots)
      const speedKnots = (location.coords.speed || 0) * 1.94384;
      setCurrentSpeed(speedKnots);

      if (location.coords.heading !== null) {
        setCurrentHeading(location.coords.heading);
      }

      // Update track point count from service
      setTrackPointCount(RaceTimerService.getTrackPointCount());
    } catch (error) {
      console.error('Error updating position:', error);
    }
  };

  const startCountdown = async (minutes: number = 5) => {
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is required for GPS tracking');
        return;
      }

      setSequenceTime(minutes * 60);
      setIsCountingDown(true);

      countdownInterval.current = setInterval(() => {
        setSequenceTime((prev) => {
          if (prev === null || prev <= 0) {
            if (countdownInterval.current) {
              clearInterval(countdownInterval.current);
            }
            startRace();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error starting countdown:', error);
      Alert.alert('Error', 'Could not start countdown');
    }
  };

  const startRace = async () => {
    try {
      if (!user) return;

      setIsCountingDown(false);
      setIsRacing(true);
      setRaceTime(0);

      // Start race timer session with GPS tracking
      const session = await RaceTimerService.startSession(
        user.id,
        id,
        {
          wind_direction: windData.direction,
          wind_speed: windData.speed,
        }
      );

      if (session) {
        setSessionId(session.id);
      }

      // Start race timer
      raceTimeInterval.current = setInterval(() => {
        setRaceTime((prev) => prev + 1);
      }, 1000);

      Alert.alert('Race Started', 'GPS tracking is now active');
    } catch (error) {
      console.error('Error starting race:', error);
      Alert.alert('Error', 'Could not start race timer');
    }
  };

  const stopRace = async () => {
    try {
      if (!sessionId) return;

      // Stop race timer
      setIsRacing(false);
      if (raceTimeInterval.current) {
        clearInterval(raceTimeInterval.current);
      }

      // Prompt for finishing position
      Alert.prompt(
        'Race Finished',
        'Enter your finishing position:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: async () => {
              await RaceTimerService.endSession(sessionId);
              setSessionId(null);
            },
          },
          {
            text: 'Save',
            onPress: async (position?: string) => {
              const positionNum = parseInt(position ?? '0', 10);
              await RaceTimerService.endSession(sessionId, positionNum > 0 ? positionNum : undefined);
              setSessionId(null);

              Alert.alert(
                'Session Saved',
                `Recorded ${trackPointCount} GPS track points`,
                [
                  {
                    text: 'View Analysis',
                    onPress: () => router.push(`/race/analysis/${sessionId}`),
                  },
                  { text: 'OK' },
                ]
              );
            },
          },
        ],
        'plain-text'
      );
    } catch (error) {
      console.error('Error stopping race:', error);
      Alert.alert('Error', 'Could not stop race timer');
    }
  };

  const checkMarkRounding = () => {
    if (!currentPosition || !raceCourse) return;

    const ROUNDING_DISTANCE = 50; // meters

    raceCourse.marks.forEach((mark) => {
      const distance = calculateDistance(
        currentPosition.coords.latitude,
        currentPosition.coords.longitude,
        mark.latitude,
        mark.longitude
      );

      if (distance < ROUNDING_DISTANCE) {
        // Mark rounded - could trigger haptic feedback or notification
        logger.debug(`Rounded mark: ${mark.name}`);
      }
    });
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const calculateLaylines = (): { port: number; starboard: number } => {
    const windDirection = windData.direction;
    return {
      port: (windDirection - twaPort + 360) % 360,
      starboard: (windDirection + twaStarboard) % 360,
    };
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (seconds <= 10) {
      return secs.toString();
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCountdownColor = (seconds: number | null): string => {
    if (seconds === null) return '#64748B';
    if (seconds <= 10) return '#EF4444';
    if (seconds <= 60) return '#F59E0B';
    return '#3B82F6';
  };

  const cleanup = () => {
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    if (raceTimeInterval.current) clearInterval(raceTimeInterval.current);
    if (positionInterval.current) clearInterval(positionInterval.current);
  };

  const laylines = calculateLaylines();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.raceName} numberOfLines={1}>
            {race?.name || 'Race Timer'}
          </Text>
          {race?.vhf_channel && (
            <Text style={styles.vhfChannel}>📻 VHF {race.vhf_channel}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.laylinesButton}
          onPress={() => setShowLaylines(!showLaylines)}
        >
          <MaterialCommunityIcons
            name="triangle-outline"
            size={24}
            color={showLaylines ? '#3B82F6' : '#64748B'}
          />
        </TouchableOpacity>
      </View>

      {/* Main Timer Display */}
      <View style={styles.timerSection}>
        {isCountingDown && sequenceTime !== null && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownLabel}>Starting in</Text>
            <Text style={[styles.countdownTime, { color: getCountdownColor(sequenceTime) }]}>
              {formatCountdown(sequenceTime)}
            </Text>
            {sequenceTime <= 10 && sequenceTime > 0 && (
              <MaterialCommunityIcons name="volume-high" size={32} color="#EF4444" />
            )}
          </View>
        )}

        {isRacing && (
          <View style={styles.raceTimeContainer}>
            <Text style={styles.raceTimeLabel}>Race Time</Text>
            <Text style={styles.raceTime}>{formatTime(raceTime)}</Text>
            <View style={styles.trackingIndicator}>
              <View style={styles.trackingDot} />
              <Text style={styles.trackingText}>{trackPointCount} GPS points</Text>
            </View>
          </View>
        )}

        {!isCountingDown && !isRacing && (
          <View style={styles.readyContainer}>
            <MaterialCommunityIcons name="timer-outline" size={64} color="#3B82F6" />
            <Text style={styles.readyTitle}>Ready to Start</Text>
            <Text style={styles.readyText}>
              Select starting sequence or tap Start Race
            </Text>
          </View>
        )}
      </View>

      {/* Tactical Data Display */}
      <View style={styles.tacticalSection}>
        {/* Speed & Heading */}
        <View style={styles.dataRow}>
          <View style={styles.dataCard}>
            <MaterialCommunityIcons name="speedometer" size={24} color="#3B82F6" />
            <Text style={styles.dataValue}>{currentSpeed.toFixed(1)}</Text>
            <Text style={styles.dataLabel}>knots</Text>
          </View>

          <View style={styles.dataCard}>
            <MaterialCommunityIcons name="compass-outline" size={24} color="#10B981" />
            <Text style={styles.dataValue}>{Math.round(currentHeading)}°</Text>
            <Text style={styles.dataLabel}>heading</Text>
          </View>
        </View>

        {/* Wind & Current */}
        <View style={styles.dataRow}>
          <View style={styles.dataCard}>
            <MaterialCommunityIcons name="weather-windy" size={24} color="#F59E0B" />
            <Text style={styles.dataValue}>{windData.speed}</Text>
            <Text style={styles.dataLabel}>kts @ {windData.direction}°</Text>
          </View>

          <View style={styles.dataCard}>
            <MaterialCommunityIcons name="waves" size={24} color="#06B6D4" />
            <Text style={styles.dataValue}>{currentData.speed.toFixed(1)}</Text>
            <Text style={styles.dataLabel}>kts @ {currentData.direction}°</Text>
          </View>
        </View>

        {/* Laylines Display */}
        {showLaylines && (
          <View style={styles.laylinesCard}>
            <View style={styles.laylinesHeader}>
              <MaterialCommunityIcons name="triangle-outline" size={20} color="#3B82F6" />
              <Text style={styles.laylinesTitle}>Laylines</Text>
            </View>
            <View style={styles.laylinesData}>
              <View style={styles.laylineItem}>
                <View style={[styles.laylineDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.laylineLabel}>Port:</Text>
                <Text style={styles.laylineValue}>{Math.round(laylines.port)}°</Text>
              </View>
              <View style={styles.laylineItem}>
                <View style={[styles.laylineDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.laylineLabel}>Starboard:</Text>
                <Text style={styles.laylineValue}>{Math.round(laylines.starboard)}°</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Control Buttons */}
      <View style={styles.controlSection}>
        {!isCountingDown && !isRacing && (
          <View style={styles.startOptions}>
            <TouchableOpacity
              style={styles.sequenceButton}
              onPress={() => startCountdown(5)}
            >
              <Text style={styles.sequenceButtonText}>5 Min</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sequenceButton}
              onPress={() => startCountdown(4)}
            >
              <Text style={styles.sequenceButtonText}>4 Min</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sequenceButton}
              onPress={() => startCountdown(1)}
            >
              <Text style={styles.sequenceButtonText}>1 Min</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sequenceButton, styles.startNowButton]}
              onPress={() => startRace()}
            >
              <Text style={[styles.sequenceButtonText, styles.startNowText]}>Start Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {isCountingDown && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setIsCountingDown(false);
              setSequenceTime(null);
              if (countdownInterval.current) {
                clearInterval(countdownInterval.current);
              }
            }}
          >
            <MaterialCommunityIcons name="close-circle" size={24} color="#EF4444" />
            <Text style={styles.cancelButtonText}>Cancel Countdown</Text>
          </TouchableOpacity>
        )}

        {isRacing && (
          <TouchableOpacity style={styles.finishButton} onPress={stopRace}>
            <MaterialCommunityIcons name="flag-checkered" size={24} color="#FFFFFF" />
            <Text style={styles.finishButtonText}>Finish Race</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Position Info */}
      {currentPosition && (
        <View style={styles.positionInfo}>
          <Text style={styles.positionText}>
            📍 {currentPosition.coords.latitude.toFixed(6)}, {currentPosition.coords.longitude.toFixed(6)}
          </Text>
          <Text style={styles.accuracyText}>
            Accuracy: ±{Math.round(currentPosition.coords.accuracy || 0)}m
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  raceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  vhfChannel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  laylinesButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  countdownContainer: {
    alignItems: 'center',
    gap: 8,
  },
  countdownLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  countdownTime: {
    fontSize: 72,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  raceTimeContainer: {
    alignItems: 'center',
    gap: 8,
  },
  raceTimeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  raceTime: {
    fontSize: 56,
    fontWeight: '700',
    color: '#3B82F6',
    fontVariant: ['tabular-nums'],
  },
  trackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  trackingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  readyContainer: {
    alignItems: 'center',
    gap: 12,
  },
  readyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  readyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  tacticalSection: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  dataRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dataCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  dataValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    fontVariant: ['tabular-nums'],
  },
  dataLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
  },
  laylinesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  laylinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  laylinesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  laylinesData: {
    gap: 8,
  },
  laylineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  laylineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  laylineLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    flex: 1,
  },
  laylineValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    fontVariant: ['tabular-nums'],
  },
  controlSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  startOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sequenceButton: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  sequenceButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  startNowButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  startNowText: {
    color: '#FFFFFF',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  positionInfo: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  positionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#E2E8F0',
    fontVariant: ['tabular-nums'],
  },
  accuracyText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
});
