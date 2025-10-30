/**
 * StartSequenceTimer Component
 *
 * Quick 5-minute countdown timer for sailing start sequences.
 * Shows button on upcoming races to help sailors time their approach to the line.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Vibration } from 'react-native';
import { Timer, Play, RotateCcw } from 'lucide-react-native';

interface StartSequenceTimerProps {
  compact?: boolean; // Use compact UI for smaller cards
}

const START_SEQUENCE_SECONDS = 5 * 60; // 5 minutes
const ALERT_INTERVALS = [300, 240, 60, 30, 10, 5, 4, 3, 2, 1, 0]; // Seconds to alert

export function StartSequenceTimer({ compact = false }: StartSequenceTimerProps) {
  const [isActive, setIsActive] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(START_SEQUENCE_SECONDS);
  const [lastAlert, setLastAlert] = useState<number | null>(null);

  // Vibrate for alerts (works on all platforms)
  const vibrate = useCallback((pattern?: number | number[]) => {
    try {
      Vibration.vibrate(pattern || 200);
    } catch (error) {
      console.error('Error vibrating:', error);
    }
  }, []);

  // Announce time remaining with vibration
  const announceTime = useCallback((seconds: number) => {
    // Prevent duplicate alerts
    if (lastAlert === seconds) return;
    setLastAlert(seconds);

    if (seconds === 0) {
      // Triple vibrate for START
      vibrate([0, 200, 100, 200, 100, 200]);
    } else if (seconds === 60) {
      // Long vibrate for 1 minute
      vibrate(500);
    } else if (seconds === 30) {
      // Double vibrate for 30 seconds
      vibrate([0, 200, 100, 200]);
    } else if (seconds === 10) {
      // Single long vibrate for final 10 seconds
      vibrate(300);
    } else if (seconds <= 5 && seconds > 0) {
      // Short vibrate for final 5 second countdown
      vibrate(100);
    }
  }, [lastAlert, vibrate]);

  // Start the countdown
  const handleStart = useCallback(() => {
    setIsActive(true);
    setSecondsRemaining(START_SEQUENCE_SECONDS);
  }, []);

  // Reset the countdown
  const handleReset = useCallback(() => {
    setIsActive(false);
    setSecondsRemaining(START_SEQUENCE_SECONDS);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        const newValue = prev - 1;

        // Check if we should announce this second
        if (ALERT_INTERVALS.includes(newValue)) {
          announceTime(newValue);
        }

        // Stop at 0
        if (newValue <= 0) {
          setIsActive(false);
          return 0;
        }

        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, announceTime]);

  // Reset last alert when timer resets
  useEffect(() => {
    if (!isActive) {
      setLastAlert(null);
    }
  }, [isActive]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Determine color based on time remaining
  const getTimerColor = (): string => {
    if (secondsRemaining > 60) return '#3B82F6'; // Blue
    if (secondsRemaining > 30) return '#F59E0B'; // Orange
    if (secondsRemaining > 10) return '#EF4444'; // Red
    return '#DC2626'; // Dark red
  };

  if (compact) {
    // Compact button for smaller cards
    if (!isActive) {
      return (
        <Pressable
          style={styles.compactButton}
          onPress={handleStart}
          accessibilityLabel="Start 5-minute countdown timer"
          accessibilityHint="Starts the racing start sequence countdown"
        >
          <Timer size={14} color="#3B82F6" />
          <Text style={styles.compactButtonText}>5min Start</Text>
        </Pressable>
      );
    }

    return (
      <View style={styles.compactActiveContainer}>
        <View style={styles.compactTimerDisplay}>
          <Timer size={12} color={getTimerColor()} />
          <Text style={[styles.compactTimerText, { color: getTimerColor() }]}>
            {formatTime(secondsRemaining)}
          </Text>
        </View>
        <Pressable onPress={handleReset} style={styles.compactResetButton}>
          <RotateCcw size={12} color="#64748B" />
        </Pressable>
      </View>
    );
  }

  // Full-size timer UI
  if (!isActive) {
    return (
      <Pressable
        style={styles.startButton}
        onPress={handleStart}
        accessibilityLabel="Start 5-minute countdown timer"
        accessibilityHint="Starts the racing start sequence countdown"
      >
        <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
        <Text style={styles.startButtonText}>Start 5-Min Sequence</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.activeTimerContainer}>
      <View style={styles.timerDisplay}>
        <Timer size={20} color={getTimerColor()} />
        <Text style={[styles.timerText, { color: getTimerColor() }]}>
          {formatTime(secondsRemaining)}
        </Text>
      </View>
      <Pressable onPress={handleReset} style={styles.resetButton}>
        <RotateCcw size={16} color="#64748B" />
        <Text style={styles.resetButtonText}>Reset</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Compact styles for small cards
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  compactButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3B82F6',
  },
  compactActiveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  compactTimerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flex: 1,
  },
  compactTimerText: {
    fontSize: 14,
    fontWeight: '700',
  },
  compactResetButton: {
    padding: 4,
  },

  // Full-size styles
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  startButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activeTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 8,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  timerText: {
    fontSize: 24,
    fontWeight: '700',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resetButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
});
