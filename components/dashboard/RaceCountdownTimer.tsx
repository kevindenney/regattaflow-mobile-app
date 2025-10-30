/**
 * Race Countdown Timer Component
 * GPS-tracked countdown timer with race conditions
 * Uses RaceTimerService for tracking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { RaceTimerService } from '@/services/RaceTimerService';

interface RaceCountdownTimerProps {
  regattaId?: string;
  startTime?: string;
}

export function RaceCountdownTimer({ regattaId, startTime }: RaceCountdownTimerProps) {
  const { user } = useAuth();

  const [isActive, setIsActive] = useState(false);
  const [countdown, setCountdown] = useState<number>(300); // 5 minutes default
  const [trackPoints, setTrackPoints] = useState(0);
  const [conditions, setConditions] = useState({
    wind_direction: 225,
    wind_speed: 15,
    wave_height: 0.5,
  });

  useEffect(() => {
    // Calculate countdown from start time
    if (startTime) {
      const start = new Date(startTime).getTime();
      const now = Date.now();
      const diff = Math.floor((start - now) / 1000);
      setCountdown(Math.max(0, diff));
    }
  }, [startTime]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, countdown]);

  useEffect(() => {
    // Update track points count
    const interval = setInterval(() => {
      if (isActive) {
        setTrackPoints(RaceTimerService.getTrackPointCount());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const handleStartTimer = async () => {
    if (!user) return;

    try {
      const session = await RaceTimerService.startSession(
        user.id,
        regattaId,
        conditions
      );

      if (session) {
        setIsActive(true);
        Alert.alert('Timer Started', 'GPS tracking active');
      }
    } catch (error) {
      console.error('Error starting timer:', error);
      Alert.alert('Error', 'Failed to start timer');
    }
  };

  const handleStopTimer = async () => {
    const sessionId = RaceTimerService.getActiveSessionId();
    if (!sessionId) return;

    Alert.alert(
      'Finish Race',
      'Enter your finishing position',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          onPress: async () => {
            try {
              await RaceTimerService.endSession(sessionId);
              setIsActive(false);
              setTrackPoints(0);
              Alert.alert('Race Complete', 'Session saved for analysis');
            } catch (error) {
              console.error('Error stopping timer:', error);
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCountdownColor = (seconds: number): string => {
    if (seconds <= 60) return '#d32f2f'; // Red - 1 min warning
    if (seconds <= 180) return '#ff9800'; // Orange - 3 min warning
    return '#0077be'; // Blue - normal
  };

  return (
    <View style={styles.container}>
      {/* Countdown Display */}
      <View style={styles.timerSection}>
        <Text style={styles.label}>Time to Start</Text>
        <Text style={[styles.countdown, { color: getCountdownColor(countdown) }]}>
          {formatTime(countdown)}
        </Text>
        {countdown === 0 && <Text style={styles.startText}>START!</Text>}
      </View>

      {/* Race Conditions */}
      <View style={styles.conditionsSection}>
        <View style={styles.conditionItem}>
          <Text style={styles.conditionLabel}>Wind</Text>
          <Text style={styles.conditionValue}>
            {conditions.wind_speed} kts @ {conditions.wind_direction}°
          </Text>
        </View>
        <View style={styles.conditionItem}>
          <Text style={styles.conditionLabel}>Waves</Text>
          <Text style={styles.conditionValue}>{conditions.wave_height}m</Text>
        </View>
        {isActive && (
          <View style={styles.conditionItem}>
            <Text style={styles.conditionLabel}>GPS Points</Text>
            <Text style={styles.conditionValue}>{trackPoints}</Text>
          </View>
        )}
      </View>

      {/* Timer Controls */}
      {!isActive ? (
        <TouchableOpacity style={styles.startButton} onPress={handleStartTimer}>
          <Text style={styles.startButtonText}>▶️ Start GPS Tracking</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.activeControls}>
          <View style={styles.trackingIndicator}>
            <View style={styles.trackingDot} />
            <Text style={styles.trackingText}>GPS Tracking Active</Text>
          </View>
          <TouchableOpacity style={styles.stopButton} onPress={handleStopTimer}>
            <Text style={styles.stopButtonText}>⏹️ Finish Race</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  countdown: {
    fontSize: 72,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  startText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4caf50',
    marginTop: 8,
  },
  conditionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  conditionItem: {
    alignItems: 'center',
  },
  conditionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  conditionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  startButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  activeControls: {
    gap: 12,
  },
  trackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 12,
  },
  trackingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4caf50',
    marginRight: 8,
  },
  trackingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0077be',
  },
  stopButton: {
    backgroundColor: '#d32f2f',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
