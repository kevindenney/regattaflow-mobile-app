/**
 * Time Slider Component
 *
 * Interactive time control for environmental forecast visualization.
 * Allows users to scrub through forecast data over a 24-hour period
 * and animate the progression of conditions.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Slider from '@react-native-community/slider';

export interface TimeSliderProps {
  /** Start time (typically race start or current time) */
  startTime: Date;

  /** Duration in hours to display (default: 24) */
  durationHours?: number;

  /** Current selected time */
  currentTime: Date;

  /** Callback when time changes */
  onTimeChange: (time: Date) => void;

  /** Auto-play enabled */
  autoPlay?: boolean;

  /** Playback speed (1x = real-time, 60x = 1 hour per second) */
  playbackSpeed?: number;

  /** Show forecast markers (race start, high/low tide, etc.) */
  showMarkers?: boolean;

  /** Forecast markers */
  markers?: Array<{
    time: Date;
    label: string;
    color: string;
  }>;
}

/**
 * Time Slider Component
 */
export function TimeSlider({
  startTime,
  durationHours = 24,
  currentTime,
  onTimeChange,
  autoPlay = false,
  playbackSpeed = 60, // 60x speed = 1 hour per second
  showMarkers = true,
  markers = []
}: TimeSliderProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [sliderValue, setSliderValue] = useState(0);
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Convert time to slider value (0-1)
  const timeToSliderValue = (time: Date): number => {
    const elapsed = time.getTime() - startTime.getTime();
    const total = durationHours * 60 * 60 * 1000; // hours to milliseconds
    return Math.max(0, Math.min(1, elapsed / total));
  };

  // Convert slider value to time
  const sliderValueToTime = (value: number): Date => {
    const elapsed = value * durationHours * 60 * 60 * 1000;
    return new Date(startTime.getTime() + elapsed);
  };

  // Initialize slider value from current time
  useEffect(() => {
    setSliderValue(timeToSliderValue(currentTime));
  }, [currentTime, startTime, durationHours]);

  // Handle auto-play animation
  useEffect(() => {
    if (isPlaying) {
      const frameInterval = 1000 / 30; // 30 fps
      const increment = (playbackSpeed / 3600) * (frameInterval / 1000); // fraction of slider per frame

      animationRef.current = setInterval(() => {
        setSliderValue((prev) => {
          const next = prev + increment;
          if (next >= 1) {
            setIsPlaying(false); // Stop at end
            return 1;
          }

          // Notify time change
          const newTime = sliderValueToTime(next);
          onTimeChange(newTime);

          return next;
        });
      }, frameInterval);
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, playbackSpeed]);

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    const newTime = sliderValueToTime(value);
    onTimeChange(newTime);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const skipBackward = () => {
    const newValue = Math.max(0, sliderValue - 0.042); // Skip back ~1 hour (1/24)
    setSliderValue(newValue);
    onTimeChange(sliderValueToTime(newValue));
  };

  const skipForward = () => {
    const newValue = Math.min(1, sliderValue + 0.042); // Skip forward ~1 hour
    setSliderValue(newValue);
    onTimeChange(sliderValueToTime(newValue));
  };

  const reset = () => {
    setSliderValue(0);
    setIsPlaying(false);
    onTimeChange(startTime);
  };

  // Format time for display
  const formatTime = (time: Date): string => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (time: Date): string => {
    return time.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate hours offset from start
  const hoursOffset = Math.floor(sliderValue * durationHours);
  const currentDisplayTime = sliderValueToTime(sliderValue);

  return (
    <View style={styles.container}>
      {/* Time Display */}
      <View style={styles.timeDisplay}>
        <View style={styles.timeInfo}>
          <Text style={styles.timeLabel}>Forecast Time</Text>
          <Text style={styles.timeValue}>{formatTime(currentDisplayTime)}</Text>
          <Text style={styles.dateValue}>{formatDate(currentDisplayTime)}</Text>
        </View>
        <View style={styles.offsetInfo}>
          <Text style={styles.offsetLabel}>
            {hoursOffset === 0 ? 'Now' : `+${hoursOffset}h`}
          </Text>
        </View>
      </View>

      {/* Slider */}
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          value={sliderValue}
          onValueChange={handleSliderChange}
          minimumValue={0}
          maximumValue={1}
          minimumTrackTintColor="#0080ff"
          maximumTrackTintColor="#cccccc"
          thumbTintColor="#0080ff"
        />

        {/* Time Markers */}
        {showMarkers && (
          <View style={styles.markersContainer}>
            <View style={styles.markerLabel}>
              <Text style={styles.markerText}>{formatTime(startTime)}</Text>
            </View>
            <View style={[styles.markerLabel, styles.markerLabelEnd]}>
              <Text style={styles.markerText}>
                {formatTime(new Date(startTime.getTime() + durationHours * 60 * 60 * 1000))}
              </Text>
            </View>

            {/* Custom markers (race start, tide changes, etc.) */}
            {markers.map((marker, idx) => {
              const position = timeToSliderValue(marker.time);
              if (position < 0 || position > 1) return null;

              return (
                <View
                  key={idx}
                  style={[
                    styles.customMarker,
                    { left: `${position * 100}%` }
                  ]}
                >
                  <View style={[styles.markerDot, { backgroundColor: marker.color }]} />
                  <Text style={styles.customMarkerLabel}>{marker.label}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable
          style={styles.controlButton}
          onPress={reset}
        >
          <Text style={styles.controlIcon}>⏮</Text>
        </Pressable>

        <Pressable
          style={styles.controlButton}
          onPress={skipBackward}
        >
          <Text style={styles.controlIcon}>⏪</Text>
        </Pressable>

        <Pressable
          style={[styles.controlButton, styles.playButton]}
          onPress={togglePlayPause}
        >
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </Pressable>

        <Pressable
          style={styles.controlButton}
          onPress={skipForward}
        >
          <Text style={styles.controlIcon}>⏩</Text>
        </Pressable>

        <View style={styles.speedIndicator}>
          <Text style={styles.speedText}>{playbackSpeed}x</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    ...Platform.select({
      web: {
        maxWidth: 600,
        width: '100%'
      }
    })
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  timeInfo: {
    flex: 1
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  timeValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0080ff'
  },
  dateValue: {
    fontSize: 14,
    color: '#888',
    marginTop: 2
  },
  offsetInfo: {
    alignItems: 'flex-end'
  },
  offsetLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0080ff',
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  sliderContainer: {
    marginBottom: 16,
    position: 'relative'
  },
  slider: {
    width: '100%',
    height: 40
  },
  markersContainer: {
    position: 'relative',
    height: 20,
    marginTop: -8
  },
  markerLabel: {
    position: 'absolute',
    left: 0
  },
  markerLabelEnd: {
    left: 'auto',
    right: 0
  },
  markerText: {
    fontSize: 10,
    color: '#888'
  },
  customMarker: {
    position: 'absolute',
    top: -8,
    alignItems: 'center'
  },
  markerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2
  },
  customMarkerLabel: {
    fontSize: 9,
    color: '#666',
    fontWeight: '600'
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0080ff'
  },
  controlIcon: {
    fontSize: 20,
    color: '#333'
  },
  playIcon: {
    fontSize: 24,
    color: '#ffffff'
  },
  speedIndicator: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 6
  },
  speedText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600'
  }
});
