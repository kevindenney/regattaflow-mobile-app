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
import { View, Text, TouchableOpacity, Alert, StyleSheet, Vibration, Modal } from 'react-native';
import { Play, Square, Navigation, Timer, RotateCcw, RefreshCw, MapPin, Flag, X, ChartBar, FileText, RotateCw } from 'lucide-react-native';
import { IOS_COLORS } from '@/components/cards/constants';
import { gpsTracker } from '@/services/GPSTracker';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import {
  getTimerConfig,
  calculateSyncTime,
  usesStartSequence as checkUsesStartSequence,
  type RaceType as ConfigRaceType,
} from '@/lib/races/timerConfig';

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
  const router = useRouter();

  // Get race-type-specific timer configuration
  const timerConfig = useMemo(() => getTimerConfig(raceType), [raceType]);
  const usesStartSequence = checkUsesStartSequence(raceType);
  const isDistanceRace = raceType === 'distance';

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

  // Direct GPS recording state (without countdown)
  const [isDirectGpsMode, setIsDirectGpsMode] = useState(false);
  const [startMarkedAt, setStartMarkedAt] = useState<number | null>(null); // Elapsed seconds when start was marked

  // Stop recording summary modal
  const [showStopModal, setShowStopModal] = useState(false);
  const [finalStats, setFinalStats] = useState<{
    duration: number;
    gpsPoints: number;
    startMarked: boolean;
    raceTimeFromMark: number | null;
  } | null>(null);

  // Start sequence state (for fleet/team/match races)
  const [sequenceSecondsRemaining, setSequenceSecondsRemaining] = useState(timerConfig.durationSeconds);
  const [lastAlert, setLastAlert] = useState<number | null>(null);

  // Sync button state
  const [showSyncFlash, setShowSyncFlash] = useState(false);

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

  // Start sequence countdown (fleet/team/match races)
  useEffect(() => {
    if (timerState !== 'start-sequence') return;

    const interval = setInterval(() => {
      setSequenceSecondsRemaining((prev) => {
        const newValue = prev - 1;

        if (timerConfig.alertIntervals.includes(newValue)) {
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
  }, [timerState, announceTime, timerConfig.alertIntervals]);

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

  // Start the start sequence (fleet/team/match) or GPS directly (distance)
  const handleStartRace = useCallback(() => {
    if (usesStartSequence) {
      setTimerState('start-sequence');
      setSequenceSecondsRemaining(timerConfig.durationSeconds);
    } else {
      handleStartGPS();
    }
  }, [usesStartSequence, timerConfig.durationSeconds]);

  // Reset start sequence
  const handleResetSequence = useCallback(() => {
    setTimerState('race-day');
    setSequenceSecondsRemaining(timerConfig.durationSeconds);
    setLastAlert(null);
  }, [timerConfig.durationSeconds]);

  // Sync timer to nearest minute mark (rounds UP)
  const handleSync = useCallback(() => {
    if (timerState !== 'start-sequence') {
      // If not in sequence yet, start it at configured duration
      setTimerState('start-sequence');
      setSequenceSecondsRemaining(timerConfig.durationSeconds);
    } else {
      // Calculate sync time (round up to nearest minute)
      const syncedTime = calculateSyncTime(sequenceSecondsRemaining);
      setSequenceSecondsRemaining(syncedTime);
    }

    // Visual feedback
    setShowSyncFlash(true);
    setTimeout(() => setShowSyncFlash(false), 300);

    // Haptic feedback (quick double-tap feel)
    vibrate([0, 50, 50, 50]);
  }, [timerState, sequenceSecondsRemaining, timerConfig.durationSeconds, vibrate]);

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

  // Start GPS directly (without countdown) - for quick recording
  const handleStartGPSDirectly = useCallback(async () => {
    setIsDirectGpsMode(true);
    setStartMarkedAt(null);
    await handleStartGPS();
  }, [handleStartGPS]);

  // Mark the race start (when gun fires) during direct GPS recording
  const handleMarkStart = useCallback(() => {
    setStartMarkedAt(elapsedSeconds);
    // Triple vibration to confirm
    vibrate([0, 200, 100, 200, 100, 200]);
  }, [elapsedSeconds, vibrate]);

  // Stop race and show summary modal
  const handleStopRace = useCallback(async () => {
    if (!sessionId) return;

    try {
      await gpsTracker.stopTracking();

      // Calculate final stats
      const raceTimeFromMark = startMarkedAt !== null
        ? elapsedSeconds - startMarkedAt
        : null;

      setFinalStats({
        duration: elapsedSeconds,
        gpsPoints: gpsPointCount,
        startMarked: startMarkedAt !== null,
        raceTimeFromMark,
      });

      setShowStopModal(true);
    } catch (error: any) {
      console.error('Error stopping race timer:', error);
      Alert.alert('Error', 'Failed to stop race timer.');
    }
  }, [sessionId, elapsedSeconds, gpsPointCount, startMarkedAt]);

  // Handle modal actions
  const handleViewAnalysis = useCallback(() => {
    setShowStopModal(false);
    setTimerState('completed');
    if (sessionId) {
      // Navigate to the race session analysis page
      router.push(`/(tabs)/race-session/${sessionId}` as any);
      onRaceComplete(sessionId);
    }
  }, [sessionId, onRaceComplete, router]);

  const handleAddNotes = useCallback(() => {
    setShowStopModal(false);
    setTimerState('completed');
    if (sessionId) {
      // Pass a flag to indicate notes should be shown
      onRaceComplete(sessionId);
    }
  }, [sessionId, onRaceComplete]);

  const handleStartAnother = useCallback(() => {
    setShowStopModal(false);
    setTimerState('race-day');
    setSessionId(null);
    setElapsedSeconds(0);
    setGpsPointCount(0);
    setIsDirectGpsMode(false);
    setStartMarkedAt(null);
    setFinalStats(null);
  }, []);

  const handleDismissModal = useCallback(() => {
    setShowStopModal(false);
    setTimerState('completed');
  }, []);

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
  // RENDER: Stop Recording Summary Modal (can show from any state)
  // =========================================================================
  const stopModal = (
    <Modal
      visible={showStopModal}
      transparent
      animationType="fade"
      onRequestClose={handleDismissModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderIcon}>
              <Flag color={IOS_COLORS.green} size={24} />
            </View>
            <Text style={styles.modalTitle}>Recording Stopped</Text>
            <TouchableOpacity
              onPress={handleDismissModal}
              style={styles.modalCloseButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X color={IOS_COLORS.secondaryLabel} size={20} />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          {finalStats && (
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>{formatElapsedTime(finalStats.duration)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>GPS Points</Text>
                <Text style={styles.statValue}>{finalStats.gpsPoints.toLocaleString()}</Text>
              </View>
              {finalStats.startMarked && finalStats.raceTimeFromMark !== null && (
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Race Time</Text>
                  <Text style={styles.statValue}>{formatElapsedTime(finalStats.raceTimeFromMark)}</Text>
                </View>
              )}
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Track Saved</Text>
                <Text style={[styles.statValue, { color: IOS_COLORS.green }]}>✓</Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={handleViewAnalysis}
              style={styles.modalActionPrimary}
            >
              <ChartBar color="white" size={18} />
              <Text style={styles.modalActionPrimaryText}>View Track Analysis</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAddNotes}
              style={styles.modalActionSecondary}
            >
              <FileText color={IOS_COLORS.blue} size={18} />
              <Text style={styles.modalActionSecondaryText}>Add Race Notes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleStartAnother}
              style={styles.modalActionSecondary}
            >
              <RotateCw color={IOS_COLORS.blue} size={18} />
              <Text style={styles.modalActionSecondaryText}>Start Another Race</Text>
            </TouchableOpacity>
          </View>

          {/* Done button */}
          <TouchableOpacity
            onPress={handleDismissModal}
            style={styles.modalDoneButton}
          >
            <Text style={styles.modalDoneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // =========================================================================
  // RENDER: Racing state (GPS tracking active)
  // =========================================================================
  if (timerState === 'racing') {
    const showMarkStartButton = isDirectGpsMode && startMarkedAt === null;
    const raceElapsed = startMarkedAt !== null ? elapsedSeconds - startMarkedAt : null;

    return (
      <>
        {stopModal}
        <View style={styles.trackingContainer}>
        {/* Main tracking info row */}
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

        {/* Mark Start button - shown when GPS started directly without countdown */}
        {showMarkStartButton && (
          <TouchableOpacity
            onPress={handleMarkStart}
            style={styles.markStartButton}
            accessibilityLabel="Mark race start"
            accessibilityHint="Tap when the starting gun fires"
          >
            <Flag color="white" size={20} fill="white" />
            <Text style={styles.markStartText}>MARK START</Text>
            <Text style={styles.markStartHint}>Tap when gun fires</Text>
          </TouchableOpacity>
        )}

        {/* Show race time since start was marked */}
        {startMarkedAt !== null && raceElapsed !== null && (
          <View style={styles.raceTimeContainer}>
            <Flag color="white" size={14} />
            <Text style={styles.raceTimeLabel}>Race time:</Text>
            <Text style={styles.raceTimeValue}>{formatElapsedTime(raceElapsed)}</Text>
          </View>
        )}

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
      </>
    );
  }

  // =========================================================================
  // RENDER: Start sequence state (fleet/team/match races)
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
            <Text style={styles.sequenceLabel}>{timerConfig.label}</Text>
          </View>

          <View style={styles.sequenceButtons}>
            {/* Sync Button - PRIMARY ACTION */}
            {timerConfig.usesSync && (
              <TouchableOpacity
                onPress={handleSync}
                style={[
                  styles.syncButton,
                  showSyncFlash && styles.syncButtonFlash,
                ]}
                accessibilityLabel="Sync timer to RC signal"
                accessibilityHint="Rounds timer to nearest minute mark"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <RefreshCw size={18} color={IOS_COLORS.blue} />
                <Text style={styles.syncButtonText}>Sync</Text>
              </TouchableOpacity>
            )}

            {/* Reset Button */}
            <TouchableOpacity
              onPress={handleResetSequence}
              style={styles.resetButton}
              accessibilityLabel="Reset start sequence"
            >
              <RotateCcw size={18} color={IOS_COLORS.secondaryLabel} />
            </TouchableOpacity>
          </View>
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
    <>
      {stopModal}

      <View style={styles.preRaceContainer}>
        {/* Main countdown button */}
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
                    ? `Tap to start ${timerConfig.label.toLowerCase()}`
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

        {/* Record GPS Only option */}
        <TouchableOpacity
          onPress={handleStartGPSDirectly}
          style={styles.gpsOnlyButton}
          accessibilityLabel="Record GPS only"
          accessibilityHint="Start GPS tracking without countdown, mark start manually"
        >
          <MapPin color={IOS_COLORS.blue} size={16} />
          <Text style={styles.gpsOnlyText}>Record GPS Only</Text>
          <Text style={styles.gpsOnlyHint}>(mark start manually)</Text>
        </TouchableOpacity>
      </View>
    </>
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
  sequenceButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: IOS_COLORS.blue + '15',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: IOS_COLORS.blue + '30',
    minWidth: 80,
    minHeight: 44, // iOS HIG minimum tap target
  },
  syncButtonFlash: {
    backgroundColor: IOS_COLORS.blue + '40',
    borderColor: IOS_COLORS.blue,
  },
  syncButtonText: {
    color: IOS_COLORS.blue,
    fontSize: 15,
    fontWeight: '600',
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

  // Pre-race container
  preRaceContainer: {
    gap: 8,
  },

  // Mark Start button (during direct GPS recording)
  markStartButton: {
    backgroundColor: IOS_COLORS.orange,
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  markStartText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  markStartHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },

  // Race time since start marked
  raceTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  raceTimeLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  raceTimeValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  // GPS Only button
  gpsOnlyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.blue + '10',
    borderWidth: 1,
    borderColor: IOS_COLORS.blue + '30',
  },
  gpsOnlyText: {
    color: IOS_COLORS.blue,
    fontSize: 14,
    fontWeight: '600',
  },
  gpsOnlyHint: {
    color: IOS_COLORS.secondaryLabel,
    fontSize: 12,
  },

  // Stop recording modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 340,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: IOS_COLORS.green + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  modalCloseButton: {
    padding: 4,
  },

  // Stats
  statsContainer: {
    backgroundColor: IOS_COLORS.systemGroupedBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: IOS_COLORS.separator,
  },
  statLabel: {
    color: IOS_COLORS.secondaryLabel,
    fontSize: 14,
  },
  statValue: {
    color: IOS_COLORS.label,
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  // Modal actions
  modalActions: {
    gap: 10,
    marginBottom: 16,
  },
  modalActionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 12,
    padding: 14,
  },
  modalActionPrimaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: IOS_COLORS.blue + '10',
    borderRadius: 12,
    padding: 14,
  },
  modalActionSecondaryText: {
    color: IOS_COLORS.blue,
    fontSize: 16,
    fontWeight: '600',
  },
  modalDoneButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalDoneText: {
    color: IOS_COLORS.secondaryLabel,
    fontSize: 16,
  },
});

export default RaceCountdownTimer;
