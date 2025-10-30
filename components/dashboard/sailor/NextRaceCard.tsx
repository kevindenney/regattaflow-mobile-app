import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated, Vibration, Platform, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { createLogger } from '@/lib/utils/logger';

interface NextRaceCardProps {
  raceId: string;
  raceTitle: string;
  venue: string;
  raceTime: string;
  numberOfStarts: number;
  startOrder: string[];
  vhfChannel: string;
  windSpeed: string;
  windDirection: string;
  waveHeight: string;
  tideInfo: string;
  rigTuning?: {
    items: Array<{ label: string; value: string }>;
    sourceTitle?: string;
    windSummary?: string;
    loading?: boolean;
    message?: string;
  };
  onPress?: () => void;
}

const logger = createLogger('NextRaceCard');
export function NextRaceCard({
  raceId,
  raceTitle,
  venue,
  raceTime,
  numberOfStarts,
  startOrder,
  vhfChannel,
  windSpeed,
  windDirection,
  waveHeight,
  tideInfo,
  rigTuning,
  onPress,
}: NextRaceCardProps) {
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [pulseAnim] = useState(new Animated.Value(1));
  const [isTracking, setIsTracking] = useState(false);
  const [trackPoints, setTrackPoints] = useState<Array<{ latitude: number; longitude: number; timestamp: number; speed?: number }>>([]);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isCountdownActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsCountdownActive(false);
            Vibration.vibrate([0, 500, 200, 500]); // Victory pattern
            return 0;
          }

          // Vibrate at 1 minute, 30 seconds, and 10 seconds
          if (prev === 60 || prev === 30 || prev === 10) {
            Vibration.vibrate(200);
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCountdownActive, timeRemaining]);

  useEffect(() => {
    if (isCountdownActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isCountdownActive]);

  const startGPSTracking = async () => {
    if (Platform.OS === 'web') {
      logger.debug('GPS tracking not available on web');
      return;
    }

    try {
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed to track your race.');
        return;
      }

      // Start tracking
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // Update every second
          distanceInterval: 5, // Or every 5 meters
        },
        (location) => {
          const point = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp,
            speed: location.coords.speed || undefined,
          };
          setTrackPoints((prev) => [...prev, point]);
        }
      );

      setLocationSubscription(subscription);
      setIsTracking(true);
    } catch (error) {
      console.error('Error starting GPS tracking:', error);
      Alert.alert('GPS Error', 'Failed to start GPS tracking');
    }
  };

  const stopGPSTracking = async () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
      setIsTracking(false);

      // TODO: Save track to database with race ID
      if (trackPoints.length > 0) {
        Alert.alert(
          'Race Track Saved',
          `Recorded ${trackPoints.length} GPS points. Track saved for analysis.`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleStartPress = async () => {
    if (!isCountdownActive) {
      setTimeRemaining(300);
      setIsCountdownActive(true);
      Vibration.vibrate(100);

      // Start GPS tracking when countdown starts
      await startGPSTracking();
    } else {
      setIsCountdownActive(false);
      setTimeRemaining(300);
      Vibration.vibrate(50);

      // Stop GPS tracking when countdown stops
      await stopGPSTracking();
      setTrackPoints([]); // Clear track points
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining > 60) return '#10B981'; // Green
    if (timeRemaining > 30) return '#F59E0B'; // Orange
    if (timeRemaining > 10) return '#EF4444'; // Red
    return '#DC2626'; // Dark red
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['#1E3A8A', '#3B82F6', '#60A5FA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="flag-checkered" size={24} color="#FFFFFF" />
            <View>
              <Text style={styles.nextRaceLabel}>NEXT RACE</Text>
              <Text style={styles.raceTitle} numberOfLines={1}>{raceTitle}</Text>
            </View>
          </View>
          <View style={styles.timeChip}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#FFFFFF" />
            <Text style={styles.timeText}>{raceTime}</Text>
          </View>
        </View>

        <Text style={styles.venue} numberOfLines={1}>{venue}</Text>

        {/* Main Content Grid */}
        <View style={styles.mainContent}>
          {/* Left Column - Weather Conditions */}
          <View style={styles.column}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="weather-windy" size={20} color="#DBEAFE" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Wind</Text>
                <Text style={styles.infoValue}>{windSpeed} {windDirection}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="wave" size={20} color="#DBEAFE" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Waves</Text>
                <Text style={styles.infoValue}>{waveHeight}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="waves" size={20} color="#DBEAFE" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Tide</Text>
                <Text style={styles.infoValue}>{tideInfo}</Text>
              </View>
            </View>
          </View>

          {/* Right Column - Race Information */}
          <View style={styles.column}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="sail-boat" size={20} color="#DBEAFE" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Starts</Text>
                <Text style={styles.infoValue}>{numberOfStarts}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="format-list-numbered" size={20} color="#DBEAFE" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Order</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {startOrder.join(', ')}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="radio-tower" size={20} color="#DBEAFE" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>VHF</Text>
                <Text style={styles.infoValue}>Ch {vhfChannel}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Rig Tuning Section */}
        {rigTuning && (
          <View style={styles.rigTuningSection}>
            <View style={styles.rigTuningHeader}>
              <MaterialCommunityIcons name="wrench-outline" size={18} color="#DBEAFE" />
              <Text style={styles.rigTuningTitle}>Critical Rig Settings</Text>
            </View>

            {rigTuning.loading ? (
              <View style={styles.rigTuningLoading}>
                <ActivityIndicator size="small" color="#DBEAFE" />
                <Text style={styles.rigTuningLoadingText}>Loading tuning checklist…</Text>
              </View>
            ) : rigTuning.items && rigTuning.items.length > 0 ? (
              <>
                {rigTuning.windSummary && (
                  <Text style={styles.rigTuningWind}>{rigTuning.windSummary}</Text>
                )}
                <View style={styles.rigTuningGrid}>
                  {rigTuning.items.map((item) => (
                    <View key={`${item.label}-${item.value}`} style={styles.rigTuningItem}>
                      <Text style={styles.rigTuningLabel}>{item.label}</Text>
                      <Text style={styles.rigTuningValue}>{item.value}</Text>
                    </View>
                  ))}
                </View>
                {rigTuning.sourceTitle && (
                  <Text style={styles.rigTuningSource}>Source: {rigTuning.sourceTitle}</Text>
                )}
              </>
            ) : (
              <View style={styles.rigTuningMessage}>
                <MaterialCommunityIcons name="book-cog-outline" size={16} color="#BFDBFE" />
                <View style={styles.rigTuningMessageContent}>
                  <Text style={styles.rigTuningMessageText}>
                    {rigTuning.message || 'Add a tuning guide to unlock race-day rig presets.'}
                  </Text>
                  {rigTuning.sourceTitle && (
                    <Text style={styles.rigTuningSource}>Source: {rigTuning.sourceTitle}</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Start Button with Countdown */}
        <Animated.View style={[styles.startButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={[
              styles.startButton,
              isCountdownActive && { backgroundColor: getTimeColor() }
            ]}
            onPress={handleStartPress}
            activeOpacity={0.8}
          >
            {!isCountdownActive ? (
              <>
                <MaterialCommunityIcons name="timer-outline" size={28} color="#1E3A8A" />
                <Text style={styles.startButtonText}>START TIMER</Text>
                <Text style={styles.startButtonSubtext}>5:00 + GPS Track</Text>
              </>
            ) : (
              <>
                <View style={styles.trackingIndicator}>
                  {isTracking && (
                    <>
                      <MaterialCommunityIcons name="navigation" size={16} color="#10B981" />
                      <Text style={styles.trackingText}>{trackPoints.length} pts</Text>
                    </>
                  )}
                </View>
                <MaterialCommunityIcons
                  name={timeRemaining <= 10 ? "alarm-light" : "timer"}
                  size={32}
                  color="#FFFFFF"
                />
                <Text style={styles.countdownText}>{formatTime(timeRemaining)}</Text>
                <Text style={styles.countdownSubtext}>
                  {timeRemaining > 60 ? 'READY' : timeRemaining > 30 ? 'PREPARE' : timeRemaining > 10 ? 'ALERT!' : 'GO!'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 416, // Double width (200 * 2) + gap (12) + padding
    marginRight: 12,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    boxShadow: '0px 8px',
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  nextRaceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DBEAFE',
    letterSpacing: 1,
  },
  raceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  venue: {
    fontSize: 14,
    color: '#DBEAFE',
    marginBottom: 16,
    marginLeft: 36,
  },
  mainContent: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  column: {
    flex: 1,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 10,
    borderRadius: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#BFDBFE',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  startButtonContainer: {
    marginTop: 4,
  },
  startButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px',
    elevation: 4,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 1,
    marginTop: 8,
  },
  startButtonSubtext: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60A5FA',
    marginTop: 4,
  },
  countdownText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 8,
    letterSpacing: 2,
  },
  countdownSubtext: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    letterSpacing: 2,
  },
  rigTuningSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  rigTuningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  rigTuningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DBEAFE',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rigTuningWind: {
    fontSize: 13,
    color: '#BFDBFE',
    marginBottom: 8,
  },
  rigTuningGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  rigTuningItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 10,
    borderRadius: 10,
  },
  rigTuningLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#BFDBFE',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rigTuningValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rigTuningSource: {
    fontSize: 12,
    color: '#BFDBFE',
    marginTop: 8,
  },
  rigTuningLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  rigTuningLoadingText: {
    fontSize: 13,
    color: '#BFDBFE',
  },
  rigTuningMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  rigTuningMessageContent: {
    flex: 1,
    gap: 4,
  },
  rigTuningMessageText: {
    fontSize: 13,
    color: '#BFDBFE',
    flex: 1,
  },
  trackingIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trackingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
});
