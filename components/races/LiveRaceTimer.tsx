/**
 * Live Race Timer Component
 * Manual race clock for the On-Water Execution section.
 *
 * Features:
 * - Manual start/pause/resume/stop controls
 * - GPS tracking automatically tied to timer state
 * - Color-coded background for timer state
 * - Displays scheduled race time for quick reference
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Timer, Play, Pause, Square } from 'lucide-react-native';
import { gpsTracker } from '@/services/GPSTracker';

interface LiveRaceTimerProps {
  raceStartTime: string; // ISO 8601 format
  sessionId?: string; // Race timer session ID for GPS tracking
  sailorId?: string; // Sailor ID for GPS tracking
  regattaId?: string; // Regatta ID for GPS tracking
  onTimerStart?: () => void;
  onTimerPause?: () => void;
  onTimerStop?: () => void;
  onTrackingStart?: (sessionId: string) => void;
  onTrackingStop?: () => void;
  enableGPSTracking?: boolean;
}

type TimerState = 'pre-start' | 'racing' | 'paused' | 'stopped';

export function LiveRaceTimer({
  raceStartTime,
  sessionId,
  sailorId,
  regattaId,
  onTimerStart,
  onTimerPause,
  onTimerStop,
  onTrackingStart,
  onTrackingStop,
  enableGPSTracking = true,
}: LiveRaceTimerProps) {
  const [timerState, setTimerState] = useState<TimerState>('pre-start');
  const [elapsedTime, setElapsedTime] = useState<number>(0); // Seconds since race start
  const [gpsSessionId, setGpsSessionId] = useState<string | null>(null);

  const scheduledStartLabel = useMemo(() => {
    if (!raceStartTime) return null;
    const date = new Date(raceStartTime);
    if (Number.isNaN(date.getTime())) return null;

    const datePart = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${datePart} • ${timePart}`;
  }, [raceStartTime]);

  // Track elapsed time during race
  useEffect(() => {
    if (timerState !== 'racing') return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState]);

  // Manual timer controls
  const handleStart = useCallback(async () => {
    setTimerState('racing');
    setElapsedTime(0);

    // Start GPS tracking automatically
    if (enableGPSTracking && sessionId) {
      try {
        const started = await gpsTracker.startTracking(sessionId);
        if (started) {
          setGpsSessionId(sessionId);
          onTrackingStart?.(sessionId);
          console.log('[LiveRaceTimer] GPS tracking started');
        }
      } catch (error) {
        console.error('[LiveRaceTimer] Failed to start GPS tracking:', error);
      }
    }

    onTimerStart?.();
  }, [onTimerStart, enableGPSTracking, sessionId, onTrackingStart]);

  const handlePause = useCallback(() => {
    setTimerState('paused');
    onTimerPause?.();
    // Note: GPS tracking continues during pause
  }, [onTimerPause]);

  const handleResume = useCallback(() => {
    setTimerState('racing');
  }, []);

  const handleStop = useCallback(async () => {
    setTimerState('stopped');

    // Stop GPS tracking automatically
    if (enableGPSTracking && gpsSessionId) {
      try {
        await gpsTracker.stopTracking();
        setGpsSessionId(null);
        onTrackingStop?.();
        console.log('[LiveRaceTimer] GPS tracking stopped and saved');
      } catch (error) {
        console.error('[LiveRaceTimer] Failed to stop GPS tracking:', error);
      }
    }

    onTimerStop?.();
  }, [onTimerStop, enableGPSTracking, gpsSessionId, onTrackingStop]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine background color based on timer state
  const getBackgroundColor = (): string => {
    switch (timerState) {
      case 'racing':
        return '#10B981'; // Green - racing
      case 'paused':
        return '#F59E0B'; // Yellow - paused
      case 'stopped':
        return '#1F2937'; // Slate - stopped
      default:
        return '#0F172A'; // Dark - ready
    }
  };

  // Determine text to display
  const getDisplayText = (): string => {
    switch (timerState) {
      case 'racing':
        return 'RACING';
      case 'paused':
        return 'PAUSED';
      case 'stopped':
        return 'STOPPED';
      default:
        return 'START';
    }
  };

  const backgroundColor = getBackgroundColor();
  const displayText = getDisplayText();
  const timeDisplay = formatTime(elapsedTime);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Main Timer Display */}
      <View style={styles.timerSection}>
        <Timer size={24} color="#ffffff" />
        <View style={styles.timeDisplay}>
          <Text style={styles.timeText}>{timeDisplay}</Text>
          <Text style={styles.statusText}>{displayText}</Text>
          {timerState === 'pre-start' && scheduledStartLabel && (
            <Text style={styles.scheduledText}>{scheduledStartLabel}</Text>
          )}
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        {timerState === 'pre-start' && (
          <Pressable style={styles.controlButton} onPress={handleStart}>
            <Play size={18} color="#ffffff" />
          </Pressable>
        )}
        {timerState === 'racing' && (
          <>
            <Pressable style={styles.controlButton} onPress={handlePause}>
              <Pause size={18} color="#ffffff" />
            </Pressable>
            <Pressable style={[styles.controlButton, styles.stopButton]} onPress={handleStop}>
              <Square size={18} color="#ffffff" fill="#ffffff" />
            </Pressable>
          </>
        )}
        {timerState === 'paused' && (
          <>
            <Pressable style={styles.controlButton} onPress={handleResume}>
              <Play size={18} color="#ffffff" />
            </Pressable>
            <Pressable style={[styles.controlButton, styles.stopButton]} onPress={handleStop}>
              <Square size={18} color="#ffffff" fill="#ffffff" />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  timeDisplay: {
    flex: 1,
  },
  timeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
    lineHeight: 36,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  scheduledText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.8)', // Red tint for stop
  },
});
