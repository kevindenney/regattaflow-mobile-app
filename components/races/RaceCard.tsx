/**
 * RaceCard Component
 * Mobile phone-sized race card showing critical race details with countdown timer
 * Dimensions: 375×667px (iPhone SE size) for primary card, scaled down for others
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Clock, MapPin, Wind, Waves, Radio, RefreshCw } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { calculateCountdown } from '@/constants/mockData';
import { RaceTimer } from './RaceTimer';
import { RaceWeatherService } from '@/services/RaceWeatherService';
import { supabase } from '@/services/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface RaceCardProps {
  id: string;
  name: string;
  venue: string;
  date: string; // ISO date
  startTime: string;
  wind: {
    direction: string;
    speedMin: number;
    speedMax: number;
  };
  tide: {
    state: 'flooding' | 'ebbing' | 'slack';
    height: number;
    direction?: string;
  };
  strategy: string;
  critical_details?: {
    vhf_channel?: string;
    warning_signal?: string;
    first_start?: string;
  };
  isPrimary?: boolean; // True for next race (largest card)
  isMock?: boolean; // True for mock data
  raceStatus?: 'past' | 'next' | 'future'; // Race timing status
  onRaceComplete?: (sessionId: string) => void; // Callback when race timer completes
  isSelected?: boolean; // True when card is selected for inline detail view
  onSelect?: () => void; // Callback when card is selected (replaces navigation for inline view)
}

export function RaceCard({
  id,
  name,
  venue,
  date,
  startTime,
  wind,
  tide,
  strategy,
  critical_details,
  isPrimary = false,
  isMock = false,
  raceStatus = 'future',
  onRaceComplete,
  isSelected = false,
  onSelect,
}: RaceCardProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(calculateCountdown(date));
  const [refreshingWeather, setRefreshingWeather] = useState(false);
  const [currentWind, setCurrentWind] = useState(wind);
  const [currentTide, setCurrentTide] = useState(tide);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(calculateCountdown(date));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [date]);

  // Refresh weather data
  const handleRefreshWeather = async () => {
    if (isMock || refreshingWeather) return;

    setRefreshingWeather(true);
    try {
      console.log(`[RaceCard] Refreshing weather for race ${id} at ${venue}`);

      // Fetch fresh weather data
      const weatherData = await RaceWeatherService.fetchWeatherByVenueName(venue, date);

      if (weatherData) {
        // Update local state
        setCurrentWind(weatherData.wind);
        setCurrentTide(weatherData.tide);

        // Get current metadata to preserve existing fields (especially strategy!)
        const { data: currentRace } = await supabase
          .from('regattas')
          .select('metadata')
          .eq('id', id)
          .single();

        // Update database - MERGE with existing metadata instead of replacing
        const { error } = await supabase
          .from('regattas')
          .update({
            metadata: {
              ...(currentRace?.metadata || {}),  // Preserve existing fields
              venue_name: venue,
              wind: weatherData.wind,
              tide: weatherData.tide,
              weather_provider: weatherData.provider,
              weather_fetched_at: weatherData.fetchedAt,
              weather_confidence: weatherData.confidence,
            }
          })
          .eq('id', id);

        if (error) {
          console.error('[RaceCard] Error updating weather:', error);
          Alert.alert('Error', 'Failed to update weather data');
        } else {
          console.log(`[RaceCard] Weather updated from ${weatherData.provider}`);
          Alert.alert('Success', `Weather updated from ${weatherData.provider}`);
        }
      } else {
        Alert.alert('No Data', 'Weather data not available for this race');
      }
    } catch (error: any) {
      console.error('[RaceCard] Error refreshing weather:', error);
      Alert.alert('Error', error.message || 'Failed to refresh weather');
    } finally {
      setRefreshingWeather(false);
    }
  };

  const handlePress = () => {
    // If onSelect callback provided, use inline selection instead of navigation
    if (onSelect) {
      console.log('[RaceCard] Card selected for inline view!', { id, name });
      onSelect();
      return;
    }

    // Otherwise, navigate to race detail page (for deep linking or standalone use)
    console.log('[RaceCard] Card clicked!', { id, name, isMock });
    console.log('[RaceCard] Router object:', router);
    console.log('[RaceCard] Navigating to:', `/(tabs)/race/${id}`);

    try {
      router.push(`/(tabs)/race/${id}`);
      console.log('[RaceCard] Navigation initiated successfully');
    } catch (error) {
      console.error('[RaceCard] Navigation failed:', error);
    }
  };

  // Card dimensions - consistent size for all cards
  const cardWidth = Math.min(SCREEN_WIDTH - 32, 375);
  const cardHeight = 580; // Consistent height for all cards

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          width: cardWidth,
          height: cardHeight,
          opacity: pressed ? 0.9 : (raceStatus === 'past' ? 0.7 : 1),
        },
        isPrimary && styles.primaryCard,
        isMock && styles.mockCard,
        raceStatus === 'past' && styles.pastCard,
        isSelected && styles.selectedCard,
      ]}
      onPress={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${name}`}
      testID={`race-card-${id}`}
      // Ensure touch events are captured
      pointerEvents="auto"
      hitSlop={{ top: 0, bottom: 0, left: 0, right: 0 }}
    >
      {/* Mock Badge */}
      {isMock && (
        <View style={styles.mockBadge}>
          <Text style={styles.mockBadgeText}>DEMO</Text>
        </View>
      )}

      {/* Race Status Badge */}
      {!isMock && raceStatus === 'next' && (
        <View style={styles.nextBadge}>
          <Text style={styles.nextBadgeText}>⚡ NEXT RACE</Text>
        </View>
      )}
      {!isMock && raceStatus === 'past' && (
        <View style={styles.pastBadge}>
          <Text style={styles.pastBadgeText}>✓ COMPLETED</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.raceName, isPrimary && styles.primaryRaceName]} numberOfLines={2}>
          {name}
        </Text>
        <View style={styles.venueRow}>
          <MapPin size={16} color="#64748B" />
          <Text style={styles.venueText}>{venue}</Text>
        </View>
      </View>

      {/* Race Timer (Countdown or Active Timer) */}
      {!isMock && onRaceComplete ? (
        <View style={styles.timerContainer}>
          <RaceTimer
            raceId={id}
            raceName={name}
            raceDate={date}
            raceTime={startTime}
            onRaceComplete={onRaceComplete}
          />
        </View>
      ) : (
        <View style={[styles.countdownSection, isPrimary && styles.primaryCountdownSection]}>
          <Text style={styles.countdownLabel}>STARTS IN</Text>
          <View style={styles.countdownRow}>
            <View style={styles.countdownBlock}>
              <Text style={[styles.countdownNumber, isPrimary && styles.primaryCountdownNumber]}>
                {countdown.days}
              </Text>
              <Text style={styles.countdownUnit}>DAYS</Text>
            </View>
            <Text style={[styles.countdownSeparator, isPrimary && styles.primaryCountdownSeparator]}>:</Text>
            <View style={styles.countdownBlock}>
              <Text style={[styles.countdownNumber, isPrimary && styles.primaryCountdownNumber]}>
                {String(countdown.hours).padStart(2, '0')}
              </Text>
              <Text style={styles.countdownUnit}>HRS</Text>
            </View>
            <Text style={[styles.countdownSeparator, isPrimary && styles.primaryCountdownSeparator]}>:</Text>
            <View style={styles.countdownBlock}>
              <Text style={[styles.countdownNumber, isPrimary && styles.primaryCountdownNumber]}>
                {String(countdown.minutes).padStart(2, '0')}
              </Text>
              <Text style={styles.countdownUnit}>MIN</Text>
            </View>
          </View>
        </View>
      )}

      {/* Critical Details - Enhanced with consistent visual hierarchy */}
      <View style={styles.detailsSection}>
        {/* Wind Conditions - Primary environmental data */}
        <View style={styles.environmentalCard}>
          <View style={styles.detailRowEnhanced}>
            <Wind size={24} color="#3B82F6" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>WIND</Text>
              <Text style={styles.detailValueLarge}>
                {currentWind.direction} {currentWind.speedMin}-{currentWind.speedMax}kts
              </Text>
            </View>
            {/* Weather Refresh Button (only for real races) */}
            {!isMock && raceStatus !== 'past' && (
              <Pressable onPress={handleRefreshWeather} disabled={refreshingWeather}>
                {refreshingWeather ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <RefreshCw size={20} color="#64748B" />
                )}
              </Pressable>
            )}
          </View>
        </View>

        {/* Tide Conditions - Primary environmental data */}
        <View style={styles.environmentalCard}>
          <View style={styles.detailRowEnhanced}>
            <Waves size={24} color="#0EA5E9" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>TIDE</Text>
              <Text style={styles.detailValueLarge}>
                {currentTide.state} {currentTide.height}m {currentTide.direction ? `→ ${currentTide.direction}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* VHF Channel - Secondary information */}
        {critical_details?.vhf_channel && (
          <View style={styles.detailRow}>
            <Radio size={20} color="#8B5CF6" />
            <Text style={styles.detailText}>Ch {critical_details.vhf_channel}</Text>
          </View>
        )}
      </View>

      {/* Strategy Summary */}
      <View style={styles.strategySection}>
        <Text style={styles.strategyLabel}>STRATEGY</Text>
        <Text style={styles.strategyText} numberOfLines={isPrimary ? 3 : 2}>
          {strategy}
        </Text>
      </View>

      {/* Footer - Start Time */}
      <View style={styles.footer}>
        <Clock size={16} color="#64748B" />
        <Text style={styles.startTimeText}>
          {critical_details?.first_start || startTime} • {new Date(date).toLocaleDateString()}
        </Text>
      </View>

      {/* Tap to expand hint */}
      <View style={styles.tapHint}>
        <Text style={styles.tapHintText}>Tap for full race strategy →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    // @ts-ignore - cursor is web-only
    cursor: 'pointer',
    // @ts-ignore - userSelect is web-only
    userSelect: 'none',
    // @ts-ignore - pointerEvents handled by prop
  },
  primaryCard: {
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  mockCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  pastCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 16,
  },
  mockBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  mockBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  nextBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pastBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#6B7280',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    zIndex: 10,
  },
  pastBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  header: {
    marginBottom: 16,
  },
  raceName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  primaryRaceName: {
    fontSize: 26,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  venueText: {
    fontSize: 14,
    color: '#64748B',
  },
  countdownSection: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  primaryCountdownSection: {
    backgroundColor: '#EFF6FF',
    padding: 20,
  },
  countdownLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countdownBlock: {
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
  },
  primaryCountdownNumber: {
    fontSize: 40,
    color: '#3B82F6',
  },
  countdownUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  countdownSeparator: {
    fontSize: 28,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  primaryCountdownSeparator: {
    color: '#93C5FD',
  },
  detailsSection: {
    marginBottom: 16,
    gap: 12,
  },
  environmentalCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailRowEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailValueLarge: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  strategySection: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  strategyLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 6,
  },
  strategyText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  startTimeText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  tapHint: {
    marginTop: 8,
    alignItems: 'center',
  },
  tapHintText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  timerContainer: {
    marginBottom: 16,
  },
});
