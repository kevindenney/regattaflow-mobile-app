/**
 * RaceTimer Component
 * Interactive countdown timer with GPS tracking for race cards
 * Tapping the countdown starts the timer and GPS tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Play, Square, Navigation } from 'lucide-react-native';
import { gpsTracker } from '@/services/GPSTracker';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';

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

  // Calculate countdown
  useEffect(() => {
    const calculateCountdown = () => {
      // Validate inputs
      if (!raceDate || !raceTime) {
        console.warn('[RaceTimer] Missing race date or time:', { raceDate, raceTime });
        setTimeUntilRace({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      // Parse the race date and time
      // Handle both ISO format times (10:00:00) and date concatenation
      let raceDateTime: Date;

      // If raceDate already includes time, use it directly
      if (raceDate.includes('T')) {
        raceDateTime = new Date(raceDate);
      } else {
        // Concatenate date and time
        raceDateTime = new Date(`${raceDate}T${raceTime}`);
      }

      // Validate the resulting date
      if (isNaN(raceDateTime.getTime())) {
        console.warn('[RaceTimer] Invalid race date/time:', { raceDate, raceTime });
        setTimeUntilRace({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const now = new Date();
      const diff = raceDateTime.getTime() - now.getTime();

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
  }, [raceDate, raceTime]);

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
      const trackPoints = await gpsTracker.stopTracking();


      setIsTracking(false);

      // Trigger post-race interview
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
      <View className="bg-green-600 rounded-lg p-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <Navigation color="white" size={20} />
            <Text className="text-white font-bold text-lg ml-2">Race In Progress</Text>
          </View>
          <TouchableOpacity
            onPress={handleStopRace}
            className="bg-red-600 rounded-full p-2"
            accessibilityLabel="Stop race timer"
            accessibilityHint="Stop GPS tracking and complete the race"
          >
            <Square color="white" size={24} fill="white" />
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-3xl font-bold">
              {formatElapsedTime(elapsedSeconds)}
            </Text>
            <Text className="text-white/80 text-sm">Elapsed Time</Text>
          </View>
          <View className="items-end">
            <Text className="text-white text-2xl font-bold">{gpsPointCount}</Text>
            <Text className="text-white/80 text-sm">GPS Points</Text>
          </View>
        </View>
      </View>
    );
  }

  // Show countdown UI when race hasn't started
  const { days, hours, minutes, seconds } = timeUntilRace;
  const isRaceDay = days === 0;

  return (
    <TouchableOpacity
      onPress={handleStartRace}
      className={`rounded-lg p-4 ${isRaceDay ? 'bg-sky-600' : 'bg-gray-700'}`}
      accessibilityLabel={`Race countdown: ${days} days, ${hours} hours, ${minutes} minutes`}
      accessibilityHint="Tap to start race timer and GPS tracking"
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white font-bold text-lg">Race Countdown</Text>
        {isRaceDay && (
          <View className="bg-white rounded-full p-2">
            <Play color="#0284c7" size={20} />
          </View>
        )}
      </View>

      <View className="flex-row justify-around">
        {days > 0 && (
          <View className="items-center">
            <Text className="text-white text-3xl font-bold">{days}</Text>
            <Text className="text-white/80 text-sm">days</Text>
          </View>
        )}
        <View className="items-center">
          <Text className="text-white text-3xl font-bold">{hours}</Text>
          <Text className="text-white/80 text-sm">hours</Text>
        </View>
        <View className="items-center">
          <Text className="text-white text-3xl font-bold">{minutes}</Text>
          <Text className="text-white/80 text-sm">mins</Text>
        </View>
        {isRaceDay && (
          <View className="items-center">
            <Text className="text-white text-3xl font-bold">{seconds}</Text>
            <Text className="text-white/80 text-sm">secs</Text>
          </View>
        )}
      </View>

      {isRaceDay && (
        <Text className="text-white/90 text-center text-sm mt-2">
          Tap to start race timer →
        </Text>
      )}
    </TouchableOpacity>
  );
}
