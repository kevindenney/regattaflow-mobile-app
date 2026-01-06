/**
 * RaceCountdownTimer Component
 *
 * Unified countdown timer for race cards with race-type-specific behavior:
 * - Fleet & Team: StartSequenceTimer (5-4-1-0 with haptics) + GPS tracking
 * - Distance & Match: Simple countdown → GPS tracking
 *
 * Features:
 * - Live countdown with 1-second updates
 * - GPS tracking integration (creates race_timer_sessions)
 * - Distance races: Show elapsed time vs time limit
 * - Haptic alerts for fleet/team start sequences
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Vibration } from 'react-native';
import { Play, Square, Navigation, Timer, RotateCcw } from 'lucide-react-native';
import { IOS_COLORS } from '@/components/cards/constants';
import { gpsTracker } from '@/services/GPSTracker';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';

// =============================================================================
// TYPES
// =============================================================================

export type RaceType = 'fleet' | 'distance' | 'match' | 'team';

export interface RaceCountdownTimerProps {
  raceId: string;
  raceName: string;
  raceDate: string;
  raceTime: string;
  raceType: RaceType;
  timeLimitHours?: number;
  onRaceComplete: (sessionId: string) => void;
}

type TimerState = 'pre-race' | 'race-day' | 'start-sequence' | 'racing' | 'completed';

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_RACE_TIME = '10:00';
const START_SEQUENCE_SECONDS = 5 * 60; // 5 minutes
const ALERT_INTERVALS = [300, 240, 60, 30, 10, 5, 4, 3, 2, 1, 0];

// =============================================================================
// HELPERS
// =============================================================================

function normalizeRaceTime(time: string): string | null {
  if (!time) return null;

  const trimmed = time.trim();
  const sanitized = trimmed.replace(/([+-]\d{2}:?\d{2}|Z)$/i, '');

  // 24-hour format
  const twentyFourHourMatch = sanitized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (twentyFourHourMatch) {
    const hours = Number.parseInt(twentyFourHourMatch[1], 10);
    const minutes = Number.parseInt(twentyFourHourMatch[2], 10);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // AM/PM format
  const amPmMatch = sanitized.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (amPmMatch) {
    let hours = Number.parseInt(amPmMatch[1], 10);
    const minutes = amPmMatch[2] ? Number.parseInt(amPmMatch[2], 10) : 0;
    const meridiem = amPmMatch[3].toUpperCase();

    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  return null;
}

function getRaceDateTime(raceDate: string, raceTime: string): Date | null {
  if (!raceDate) return null;

  const normalizedTime = normalizeRaceTime(raceTime) || DEFAULT_RACE_TIME;

  let date = new Date(raceDate);
  if (Number.isNaN(date.getTime())) {
    const base = raceDate.includes('T') ? raceDate : `${raceDate}T00:00:00`;
    date = new Date(base.replace(' ', 'T'));
  }

  if (Number.isNaN(date.getTime())) return null;

  const [hours, minutes] = normalizedTime.split(':').map((value) => Number.parseInt(value, 10));
  if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
    date.setHours(hours, minutes, 0, 0);
  }

  return date;
}

function formatElapsedTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatElapsedVsLimit(elapsedSeconds: number, limitHours: number): string {
  const elapsedHours = Math.floor(elapsedSeconds / 3600);
  const elapsedMins = Math.floor((elapsedSeconds % 3600) / 60);
  return `${elapsedHours}h ${elapsedMins}m / ${limitHours}h limit`;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RaceCountdownTimer({
  raceId,
  raceName,
  raceDate,
  raceTime,
  raceType,
  timeLimitHours,
  onRaceComplete,
}: RaceCountdownTimerProps) {
  const { user } = useAuth();

  // Timer state
  const [timerState, setTimerState] = useState<TimerState>('pre-race');
  const [timeUntilRace, setTimeUntilRace] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // GPS tracking state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [gpsPointCount, setGpsPointCount] = useState(0);

  // Start sequence state (for fleet/team races)
  const [sequenceSecondsRemaining, setSequenceSecondsRemaining] = useState(START_SEQUENCE_SECONDS);
  const [lastAlert, setLastAlert] = useState<number | null>(null);

  // Determine if this race type uses start sequence
  const usesStartSequence = raceType === 'fleet' || raceType === 'team';
  const isDistanceRace = raceType === 'distance';

  // Memoize race date time
  const raceDateTimeMs = useMemo(() => {
    if (!raceDate || !raceTime) return null;
    const dt = getRaceDateTime(raceDate, raceTime);
    return dt ? dt.getTime() : null;
  }, [raceDate, raceTime]);

  // Vibrate for haptic alerts
  const vibrate = useCallback((pattern?: number | number[]) => {
    try {
      Vibration.vibrate(pattern || 200);
    } catch (error) {
      console.error('Error vibrating:', error);
    }
  }, []);

  // Announce time remaining with vibration (start sequence)
  const announceTime = useCallback((seconds: number) => {
    if (lastAlert === seconds) return;
    setLastAlert(seconds);

    if (seconds === 0) {
      vibrate([0, 200, 100, 200, 100, 200]); // Triple for START
    } else if (seconds === 60) {
      vibrate(500); // Long for 1 minute
    } else if (seconds === 30) {
      vibrate([0, 200, 100, 200]); // Double for 30 seconds
    } else if (seconds === 10) {
      vibrate(300); // Single long for 10 seconds
    } else if (seconds <= 5 && seconds > 0) {
      vibrate(100); // Short for final 5 seconds
    }
  }, [lastAlert, vibrate]);

  // Calculate countdown
  useEffect(() => {
    if (raceDateTimeMs === null || timerState === 'racing' || timerState === 'start-sequence') return;

    const calculateCountdown = () => {
      const now = Date.now();
      const diff = raceDateTimeMs - now;

      if (diff <= 0) {
        setTimeUntilRace({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeUntilRace({ days, hours, minutes, seconds });
      setTimerState(days === 0 ? 'race-day' : 'pre-race');
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [raceDateTimeMs, timerState]);

  // Start sequence countdown (fleet/team races)
  useEffect(() => {
    if (timerState !== 'start-sequence') return;

    const interval = setInterval(() => {
      setSequenceSecondsRemaining((prev) => {
        const newValue = prev - 1;

        if (ALERT_INTERVALS.includes(newValue)) {
          announceTime(newValue);
        }

        if (newValue <= 0) {
          // Start sequence complete - auto-start GPS tracking
          handleStartGPS();
          return 0;
        }

        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState, announceTime]);

  // Update elapsed time and GPS point count during racing
  useEffect(() => {
    if (timerState !== 'racing') return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      const status = gpsTracker.getTrackingStatus();
      setGpsPointCount(status.pointCount);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState]);

  // Reset last alert when not in start sequence
  useEffect(() => {
    if (timerState !== 'start-sequence') {
      setLastAlert(null);
    }
  }, [timerState]);

  // Start the start sequence (fleet/team) or GPS directly (distance/match)
  const handleStartRace = useCallback(() => {
    if (usesStartSequence) {
      setTimerState('start-sequence');
      setSequenceSecondsRemaining(START_SEQUENCE_SECONDS);
    } else {
      handleStartGPS();
    }
  }, [usesStartSequence]);

  // Reset start sequence
  const handleResetSequence = useCallback(() => {
    setTimerState('race-day');
    setSequenceSecondsRemaining(START_SEQUENCE_SECONDS);
    setLastAlert(null);
  }, []);

  // Start GPS tracking
  const handleStartGPS = useCallback(async () => {
    if (!user) return;

    try {
      // Create timer session
      const { data: session, error: sessionError } = await supabase
        .from('race_timer_sessions')
        .insert({
          sailor_id: user.id,
          regatta_id: raceId,
          start_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (sessionError || !session) {
        throw new Error('Failed to create timer session');
      }

      // Start GPS tracking
      const trackingStarted = await gpsTracker.startTracking(session.id);

      if (!trackingStarted) {
        Alert.alert(
          'GPS Permission Required',
          'Please enable location permissions to track your race.'
        );
        await supabase.from('race_timer_sessions').delete().eq('id', session.id);
        return;
      }

      setSessionId(session.id);
      setTimerState('racing');
      setElapsedSeconds(0);
      setGpsPointCount(0);

    } catch (error: any) {
      console.error('Error starting race timer:', error);
      Alert.alert('Error', 'Failed to start race timer. Please try again.');
    }
  }, [user, raceId]);

  // Stop race and trigger post-race flow
  const handleStopRace = useCallback(async () => {
    if (!sessionId) return;

    try {
      await gpsTracker.stopTracking();
      setTimerState('completed');
      onRaceComplete(sessionId);
    } catch (error: any) {
      console.error('Error stopping race timer:', error);
      Alert.alert('Error', 'Failed to stop race timer.');
    }
  }, [sessionId, onRaceComplete]);

  // Get timer color based on sequence time remaining
  const getSequenceColor = (): string => {
    if (sequenceSecondsRemaining > 60) return IOS_COLORS.blue;
    if (sequenceSecondsRemaining > 30) return IOS_COLORS.orange;
    if (sequenceSecondsRemaining > 10) return IOS_COLORS.red;
    return IOS_COLORS.red; // Critical
  };

  // Calculate time limit progress for distance races
  const timeLimitProgress = useMemo(() => {
    if (!isDistanceRace || !timeLimitHours) return 0;
    const limitSeconds = timeLimitHours * 3600;
    return Math.min((elapsedSeconds / limitSeconds) * 100, 100);
  }, [isDistanceRace, timeLimitHours, elapsedSeconds]);

  if (!timeUntilRace && timerState === 'pre-race') {
    return null;
  }

  // =========================================================================
  // RENDER: Racing state (GPS tracking active)
  // =========================================================================
  if (timerState === 'racing') {
    return (
      <View style={styles.trackingContainer}>
        <View style={styles.rowSpaceBetween}>
          <View style={styles.trackingInfo}>
            <View style={styles.rowCenter}>
              <Navigation color="white" size={16} />
              <Text style={styles.elapsedTime}>
                {isDistanceRace && timeLimitHours
                  ? formatElapsedVsLimit(elapsedSeconds, timeLimitHours)
                  : formatElapsedTime(elapsedSeconds)}
              </Text>
            </View>
            <View style={styles.rowCenter}>
              <Text style={styles.gpsLabel}>GPS:</Text>
              <Text style={styles.gpsCount}>{gpsPointCount}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleStopRace}
            style={styles.stopButton}
            accessibilityLabel="Stop race timer"
          >
            <Square color="white" size={18} fill="white" />
          </TouchableOpacity>
        </View>

        {/* Progress bar for distance races */}
        {isDistanceRace && timeLimitHours && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${timeLimitProgress}%` },
                  timeLimitProgress > 80 && styles.progressBarWarning,
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(timeLimitProgress)}%</Text>
          </View>
        )}
      </View>
    );
  }

  // =========================================================================
  // RENDER: Start sequence state (fleet/team races)
  // =========================================================================
  if (timerState === 'start-sequence') {
    const mins = Math.floor(sequenceSecondsRemaining / 60);
    const secs = sequenceSecondsRemaining % 60;

    return (
      <View style={[styles.sequenceContainer, { borderColor: getSequenceColor() }]}>
        <View style={styles.rowSpaceBetween}>
          <View style={styles.sequenceInfo}>
            <View style={styles.rowCenter}>
              <Timer size={20} color={getSequenceColor()} />
              <Text style={[styles.sequenceTime, { color: getSequenceColor() }]}>
                {mins}:{String(secs).padStart(2, '0')}
              </Text>
            </View>
            <Text style={styles.sequenceLabel}>Start Sequence</Text>
          </View>

          <TouchableOpacity
            onPress={handleResetSequence}
            style={styles.resetButton}
            accessibilityLabel="Reset start sequence"
          >
            <RotateCcw size={18} color={IOS_COLORS.secondaryLabel} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // =========================================================================
  // RENDER: Pre-race countdown state
  // =========================================================================
  const { days, hours, minutes, seconds } = timeUntilRace || { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const isRaceDay = days === 0;
  const isReadyToStart = isRaceDay && hours === 0 && minutes <= 5;

  return (
    <TouchableOpacity
      onPress={handleStartRace}
      style={[
        styles.countdownContainer,
        isReadyToStart ? styles.bgGreen : isRaceDay ? styles.bgSky : styles.bgGray,
      ]}
      accessibilityLabel={`Race countdown: ${days} days, ${hours} hours, ${minutes} minutes`}
      accessibilityHint="Tap to start race timer"
    >
      <View style={styles.rowSpaceBetween}>
        <View style={styles.flex1}>
          {isReadyToStart ? (
            <Text style={styles.readyText}>
              {usesStartSequence ? 'Start Sequence Ready!' : 'Ready to Race!'}
            </Text>
          ) : (
            <View style={styles.countdownRow}>
              {days > 0 && (
                <>
                  <Text style={styles.countdownNumber}>{days}</Text>
                  <Text style={styles.countdownUnit}>d</Text>
                </>
              )}
              <Text style={styles.countdownNumber}>{hours}</Text>
              <Text style={styles.countdownUnit}>h</Text>
              <Text style={styles.countdownNumber}>{minutes}</Text>
              <Text style={styles.countdownUnit}>m</Text>
              {isRaceDay && (
                <>
                  <Text style={styles.countdownNumber}>{seconds}</Text>
                  <Text style={styles.countdownUnit}>s</Text>
                </>
              )}
            </View>
          )}
          <Text style={styles.tapHint}>
            {isReadyToStart
              ? usesStartSequence
                ? 'Tap to start 5-min sequence'
                : 'Tap to start GPS tracking'
              : 'Tap when ready to start'}
          </Text>
        </View>

        <View style={[styles.playButton, isReadyToStart ? styles.playButtonReady : styles.playButtonDefault]}>
          {usesStartSequence ? (
            <Timer color={isReadyToStart ? IOS_COLORS.green : 'white'} size={18} />
          ) : (
            <Play color={isReadyToStart ? IOS_COLORS.green : 'white'} size={18} fill={isReadyToStart ? IOS_COLORS.green : 'transparent'} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  // Tracking state
  trackingContainer: {
    backgroundColor: IOS_COLORS.green,
    borderRadius: 12,
    padding: 12,
  },
  trackingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  elapsedTime: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  gpsLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginRight: 4,
  },
  gpsCount: {
    color: 'white',
    fontWeight: '700',
  },
  stopButton: {
    backgroundColor: IOS_COLORS.red,
    borderRadius: 999,
    padding: 10,
  },

  // Progress bar (distance races)
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  progressBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  progressBarWarning: {
    backgroundColor: IOS_COLORS.yellow,
  },
  progressText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },

  // Start sequence state
  sequenceContainer: {
    backgroundColor: IOS_COLORS.systemGroupedBackground,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
  },
  sequenceInfo: {
    flex: 1,
  },
  sequenceTime: {
    fontSize: 32,
    fontWeight: '700',
    marginLeft: 8,
    fontVariant: ['tabular-nums'],
  },
  sequenceLabel: {
    color: IOS_COLORS.secondaryLabel,
    fontSize: 12,
    marginTop: 2,
  },
  resetButton: {
    backgroundColor: IOS_COLORS.gray5,
    borderRadius: 999,
    padding: 10,
  },

  // Pre-race countdown state
  countdownContainer: {
    borderRadius: 12,
    padding: 12,
  },
  bgGreen: {
    backgroundColor: IOS_COLORS.green,
  },
  bgSky: {
    backgroundColor: IOS_COLORS.teal,
  },
  bgGray: {
    backgroundColor: IOS_COLORS.gray2,
  },
  readyText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  countdownNumber: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  countdownUnit: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginRight: 6,
  },
  tapHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  playButton: {
    borderRadius: 999,
    padding: 10,
  },
  playButtonReady: {
    backgroundColor: 'white',
  },
  playButtonDefault: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Common
  rowSpaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
});

export default RaceCountdownTimer;
