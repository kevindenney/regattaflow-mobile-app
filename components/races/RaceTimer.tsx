/**
 * RaceTimer Component
 * Interactive countdown timer with GPS tracking for race cards
 * Tapping the countdown starts the timer and GPS tracking
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Play, Square, Navigation } from 'lucide-react-native';
import { gpsTracker } from '@/services/GPSTracker';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';

const DEFAULT_RACE_TIME = '10:00';

function normalizeRaceTime(time: string): string | null {
  if (!time) return null;

  const trimmed = time.trim();
  const sanitized = trimmed.replace(/([+-]\d{2}:?\d{2}|Z)$/i, '');

  const twentyFourHourMatch = sanitized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (twentyFourHourMatch) {
    const hours = Number.parseInt(twentyFourHourMatch[1], 10);
    const minutes = Number.parseInt(twentyFourHourMatch[2], 10);
    const seconds = twentyFourHourMatch[3] ? Number.parseInt(twentyFourHourMatch[3], 10) : 0;

    if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) {
      return null;
    }

    return [hours, minutes, seconds]
      .map((value, index) => (index === 2 && value === 0 ? null : value.toString().padStart(2, '0')))
      .filter(Boolean)
      .join(':');
  }

  const amPmMatch = sanitized.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (amPmMatch) {
    let hours = Number.parseInt(amPmMatch[1], 10);
    const minutes = amPmMatch[2] ? Number.parseInt(amPmMatch[2], 10) : 0;
    const meridiem = amPmMatch[3].toUpperCase();

    if (meridiem === 'PM' && hours < 12) {
      hours += 12;
    }
    if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }

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

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const [hours, minutes] = normalizedTime.split(':').map((value) => Number.parseInt(value, 10));
  const timeMatch = raceDate.match(/T(\d{2}):(\d{2})/);
  const isoHours = timeMatch ? Number.parseInt(timeMatch[1], 10) : null;
  const isoMinutes = timeMatch ? Number.parseInt(timeMatch[2], 10) : null;
  const hasExplicitTime = isoHours !== null && isoMinutes !== null && !Number.isNaN(isoHours) && !Number.isNaN(isoMinutes);
  const isoIsMidnight = hasExplicitTime && isoHours === 0 && isoMinutes === 0;
  const currentHours = date.getHours();
  const currentMinutes = date.getMinutes();
  const shouldOverride =
    !hasExplicitTime ||
    isoIsMidnight ||
    (currentHours === 0 && currentMinutes === 0) ||
    Number.isNaN(currentHours) ||
    Number.isNaN(currentMinutes);

  if (!Number.isNaN(hours) && !Number.isNaN(minutes) && shouldOverride) {
    date.setHours(hours, minutes, 0, 0);
  }

  return date;
}

interface RaceTimerProps {
  raceId: string;
  raceName: string;
  raceDate: string;
  raceTime: string;
  onRaceComplete: (sessionId: string) => void;
}

export function RaceTimer({
  raceId,
  raceName,
  raceDate,
  raceTime,
  onRaceComplete,
}: RaceTimerProps) {
  const { user } = useAuth();
  const [timeUntilRace, setTimeUntilRace] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [gpsPointCount, setGpsPointCount] = useState(0);

  // Memoize race date time to prevent recalculation on every render
  const raceDateTimeMs = useMemo(() => {
    if (!raceDate || !raceTime) return null;
    const dt = getRaceDateTime(raceDate, raceTime);
    return dt ? dt.getTime() : null;
  }, [raceDate, raceTime]);

  // Calculate countdown
  useEffect(() => {
    // If we don't have a valid race date/time, don't start the countdown loop.
    // A missing/invalid timestamp was causing setState to run on every render, triggering
    // a maximum update depth error when races were created without a start time.
    if (raceDateTimeMs === null) return;

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
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [raceDateTimeMs]);

  // Update elapsed time and GPS point count during tracking
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);

      const status = gpsTracker.getTrackingStatus();
      setGpsPointCount(status.pointCount);
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking]);

  // Start race timer and GPS tracking
  const handleStartRace = useCallback(async () => {
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
        // Delete the session since tracking failed
        await supabase.from('race_timer_sessions').delete().eq('id', session.id);
        return;
      }

      setSessionId(session.id);
      setIsTracking(true);
      setElapsedSeconds(0);
      setGpsPointCount(0);

    } catch (error: any) {
      console.error('Error starting race timer:', error);
      Alert.alert('Error', 'Failed to start race timer. Please try again.');
    }
  }, [user, raceId]);

  // Stop race timer and GPS tracking
  const handleStopRace = useCallback(async () => {
    if (!sessionId) return;

    try {
      // Stop GPS tracking (this also saves track points)
      await gpsTracker.stopTracking();

      setIsTracking(false);

      // Always open post-race interview - user can skip from there
      onRaceComplete(sessionId);
    } catch (error: any) {
      console.error('Error stopping race timer:', error);
      Alert.alert('Error', 'Failed to stop race timer.');
    }
  }, [sessionId, onRaceComplete]);

  // Format elapsed time as MM:SS
  const formatElapsedTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!timeUntilRace) {
    return null;
  }

  // Show tracking UI when race is active
  if (isTracking) {
    return (
      <View style={styles.trackingContainer}>
        <View style={styles.rowSpaceBetween}>
          {/* Left: elapsed time and GPS count */}
          <View style={styles.rowCenterGap}>
            <View style={styles.rowCenter}>
              <Navigation color="white" size={16} />
              <Text style={styles.elapsedTime}>
                {formatElapsedTime(elapsedSeconds)}
              </Text>
            </View>
            <View style={styles.rowCenter}>
              <Text style={styles.gpsLabel}>GPS:</Text>
              <Text style={styles.gpsCount}>{gpsPointCount}</Text>
            </View>
          </View>

          {/* Right: stop button */}
          <TouchableOpacity
            onPress={handleStopRace}
            style={styles.stopButton}
            accessibilityLabel="Stop race timer"
            accessibilityHint="Stop GPS tracking and complete the race"
          >
            <Square color="white" size={18} fill="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show countdown UI when race hasn't started
  const { days, hours, minutes, seconds } = timeUntilRace;
  const isRaceDay = days === 0;
  const isReadyToStart = isRaceDay && hours === 0 && minutes === 0;

  return (
    <TouchableOpacity
      onPress={handleStartRace}
      style={[
        styles.countdownContainer,
        isReadyToStart ? styles.bgGreen : isRaceDay ? styles.bgSky : styles.bgGray
      ]}
      accessibilityLabel={`Race countdown: ${days} days, ${hours} hours, ${minutes} minutes`}
      accessibilityHint="Tap to start race timer and GPS tracking"
    >
      <View style={styles.rowSpaceBetween}>
        {/* Left side: countdown or ready message */}
        <View style={styles.flex1}>
          {isReadyToStart ? (
            <Text style={styles.readyText}>Ready to Race!</Text>
          ) : (
            <View style={styles.countdownRow}>
              {days > 0 && (
                <>
                  <Text style={styles.countdownNumber}>{days}</Text>
                  <Text style={styles.countdownUnit}>{days === 1 ? 'd' : 'd'}</Text>
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
            {isReadyToStart ? 'Tap to start GPS tracking' : 'Tap when ready to start'}
          </Text>
        </View>

        {/* Right side: play button */}
        <View style={[styles.playButton, isReadyToStart ? styles.playButtonReady : styles.playButtonDefault]}>
          <Play color={isReadyToStart ? '#16a34a' : 'white'} size={18} fill={isReadyToStart ? '#16a34a' : 'transparent'} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  trackingContainer: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    padding: 12,
  },
  rowSpaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowCenterGap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  elapsedTime: {
    color: 'white',
    fontSize: 20,
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
    backgroundColor: '#dc2626',
    borderRadius: 999,
    padding: 8,
  },
  countdownContainer: {
    borderRadius: 8,
    padding: 12,
  },
  bgGreen: {
    backgroundColor: '#16a34a',
  },
  bgSky: {
    backgroundColor: '#0284c7',
  },
  bgGray: {
    backgroundColor: '#374151',
  },
  flex1: {
    flex: 1,
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
    fontSize: 20,
    fontWeight: '700',
  },
  countdownUnit: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginRight: 6,
  },
  tapHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  playButton: {
    borderRadius: 999,
    padding: 8,
  },
  playButtonReady: {
    backgroundColor: 'white',
  },
  playButtonDefault: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
