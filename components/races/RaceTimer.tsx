/**
 * RaceTimer Component
 * Interactive countdown timer with GPS tracking for race cards
 * Tapping the countdown starts the timer and GPS tracking
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
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
      <View className="bg-green-600 rounded-lg p-3">
        <View className="flex-row items-center justify-between">
          {/* Left: elapsed time and GPS count */}
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center">
              <Navigation color="white" size={16} />
              <Text className="text-white text-xl font-bold ml-2">
                {formatElapsedTime(elapsedSeconds)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-white/80 text-xs mr-1">GPS:</Text>
              <Text className="text-white font-bold">{gpsPointCount}</Text>
            </View>
          </View>
          
          {/* Right: stop button */}
          <TouchableOpacity
            onPress={handleStopRace}
            className="bg-red-600 rounded-full p-2"
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
      className={`rounded-lg p-3 ${isReadyToStart ? 'bg-green-600' : isRaceDay ? 'bg-sky-600' : 'bg-gray-700'}`}
      accessibilityLabel={`Race countdown: ${days} days, ${hours} hours, ${minutes} minutes`}
      accessibilityHint="Tap to start race timer and GPS tracking"
    >
      <View className="flex-row items-center justify-between">
        {/* Left side: countdown or ready message */}
        <View className="flex-1">
          {isReadyToStart ? (
            <Text className="text-white font-bold text-base">Ready to Race!</Text>
          ) : (
            <View className="flex-row items-baseline gap-1">
              {days > 0 && (
                <>
                  <Text className="text-white text-xl font-bold">{days}</Text>
                  <Text className="text-white/80 text-xs mr-2">{days === 1 ? 'day' : 'days'}</Text>
                </>
              )}
              <Text className="text-white text-xl font-bold">{hours}</Text>
              <Text className="text-white/80 text-xs mr-1">h</Text>
              <Text className="text-white text-xl font-bold">{minutes}</Text>
              <Text className="text-white/80 text-xs mr-1">m</Text>
              {isRaceDay && (
                <>
                  <Text className="text-white text-xl font-bold">{seconds}</Text>
                  <Text className="text-white/80 text-xs">s</Text>
                </>
              )}
            </View>
          )}
          <Text className="text-white/70 text-xs mt-0.5">
            {isReadyToStart ? 'Tap to start GPS tracking' : 'Tap when ready to start'}
          </Text>
        </View>
        
        {/* Right side: play button */}
        <View className={`rounded-full p-2 ${isReadyToStart ? 'bg-white' : 'bg-white/20'}`}>
          <Play color={isReadyToStart ? '#16a34a' : 'white'} size={18} fill={isReadyToStart ? '#16a34a' : 'transparent'} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
