/**
 * RaceCard Component
 * Mobile phone-sized race card showing critical race details with countdown timer
 * Dimensions: 375×667px (iPhone SE size) for primary card, scaled down for others
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { MapPin, Wind, Waves, Radio, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { calculateCountdown } from '@/constants/mockData';
import { RaceTimer } from './RaceTimer';
import { StartSequenceTimer } from './StartSequenceTimer';
import { RaceWeatherService } from '@/services/RaceWeatherService';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import { CardMenu, type CardMenuItem } from '@/components/shared/CardMenu';

const logger = createLogger('RaceCard');
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Helper function to get weather status message
function getWeatherStatusMessage(status?: string): string {
  switch (status) {
    case 'loading':
      return 'Loading forecast...';
    case 'too_far':
      return 'Forecast not yet available';
    case 'past':
      return 'Race completed';
    case 'no_venue':
      return 'No venue specified';
    case 'unavailable':
      return 'Forecast unavailable';
    case 'error':
      return 'Unable to load forecast';
    case 'available':
      return ''; // Don't show message when data is available
    default:
      return 'Forecast pending';
  }
}

export interface RaceCardProps {
  id: string;
  name: string;
  venue: string;
  date: string; // ISO date
  startTime: string;
  wind?: {
    direction: string;
    speedMin: number;
    speedMax: number;
  } | null;
  tide?: {
    state: 'flooding' | 'ebbing' | 'slack';
    height: number;
    direction?: string;
  } | null;
  weatherStatus?: 'loading' | 'available' | 'unavailable' | 'error' | 'too_far' | 'past' | 'no_venue';
  weatherError?: string;
  strategy?: string;
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
  onEdit?: () => void;
  onDelete?: () => void;
  showTimelineIndicator?: boolean; // True to show the "now" timeline indicator on the left
  isDimmed?: boolean; // True when another race is selected and this one should recede
}

export function RaceCard({
  id,
  name,
  venue,
  date,
  startTime,
  wind,
  tide,
  weatherStatus,
  weatherError,
  critical_details,
  isPrimary = false,
  isMock = false,
  raceStatus = 'future',
  onRaceComplete,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  showTimelineIndicator = false,
  isDimmed = false,
}: RaceCardProps) {
  const router = useRouter();
  const editHandler = onEdit ?? null;
  const deleteHandler = onDelete ?? null;

  const menuItems = useMemo<CardMenuItem[]>(() => {
    const items: CardMenuItem[] = [];
    if (editHandler) {
      items.push({
        label: 'Edit Race',
        icon: 'create-outline',
        onPress: editHandler,
      });
    }
    if (deleteHandler) {
      items.push({
        label: 'Delete Race',
        icon: 'trash-outline',
        onPress: deleteHandler,
        variant: 'destructive',
      });
    }
    return items;
  }, [deleteHandler, editHandler]);
  const [refreshingWeather, setRefreshingWeather] = useState(false);
  const [currentWind, setCurrentWind] = useState(wind);
  const [currentTide, setCurrentTide] = useState(tide);
  const [currentWeatherStatus, setCurrentWeatherStatus] = useState(weatherStatus);

  // Sync props to state when they change (important for enrichment updates)
  useEffect(() => {
    setCurrentWind(wind);
    setCurrentTide(tide);
    setCurrentWeatherStatus(weatherStatus);
  }, [wind, tide, weatherStatus]);

  // Calculate countdown once per minute using useMemo
  // This prevents re-calculating on every render
  const currentMinute = useMemo(() => Math.floor(Date.now() / 60000), []);
  const [minuteTick, setMinuteTick] = useState(currentMinute);

  const countdown = useMemo(() => {
    return calculateCountdown(date, startTime);
  }, [date, startTime, minuteTick]);

  // Update countdown every minute (only for upcoming races to save CPU)
  useEffect(() => {
    // Don't run interval for past races
    if (raceStatus === 'past') return;

    const interval = setInterval(() => {
      setMinuteTick(Math.floor(Date.now() / 60000));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [raceStatus]);

  // Refresh weather data
  const handleRefreshWeather = async () => {
    if (isMock || refreshingWeather) return;

    setRefreshingWeather(true);
    try {
      logger.debug(`[RaceCard] Refreshing weather for race ${id} at ${venue}`);

      // Fetch fresh weather data
      const warningSignalTime =
        critical_details?.warning_signal ||
        (typeof startTime === 'string' && startTime.includes(':') && startTime.length <= 8 ? startTime : null);

      const weatherData = await RaceWeatherService.fetchWeatherByVenueName(venue, date, {
        warningSignalTime,
      });

      if (weatherData) {
        // Update local state
        setCurrentWind(weatherData.wind);
        setCurrentTide(weatherData.tide);
        setCurrentWeatherStatus('available');

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
          logger.debug(`[RaceCard] Weather updated from ${weatherData.provider}`);
          Alert.alert('Success', `Weather updated from ${weatherData.provider}`);
        }
      } else {
        setCurrentWeatherStatus('unavailable');
        Alert.alert('No Data', 'Weather data not available for this race');
      }
    } catch (error: any) {
      console.error('[RaceCard] Error refreshing weather:', error);
      setCurrentWeatherStatus('error');
      Alert.alert('Error', error.message || 'Failed to refresh weather');
    } finally {
      setRefreshingWeather(false);
    }
  };

  const handlePress = () => {
    // If onSelect callback provided, use inline selection instead of navigation
    if (onSelect) {
      logger.debug('[RaceCard] Card selected for inline view!', { id, name });
      onSelect();
      return;
    }

    // Otherwise, navigate to race detail page (for deep linking or standalone use)
    logger.debug('[RaceCard] Card clicked!', { id, name, isMock });
    logger.debug('[RaceCard] Router object:', router);
    logger.debug('[RaceCard] Navigating to:', `/(tabs)/race/scrollable/${id}`);

    try {
      router.push(`/(tabs)/race/scrollable/${id}`);
      logger.debug('[RaceCard] Navigation initiated successfully');
    } catch (error) {
      console.error('[RaceCard] Navigation failed:', error);
    }
  };

  // Card dimensions - modern mobile-friendly card style
  const cardWidth = 240; // Larger for better readability
  const cardHeight = 400; // More spacious layout with proper spacing

  const hasRaceStartedOrPassed =
    raceStatus === 'past' ||
    (countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0);

  const showIndicatorLeft = showTimelineIndicator && !hasRaceStartedOrPassed;
  const showIndicatorRight = showTimelineIndicator && hasRaceStartedOrPassed;

  return (
    <View
      style={[
        styles.cardWrapper,
        showTimelineIndicator && styles.cardWrapperWithTimeline,
        showIndicatorRight && styles.cardWrapperPast,
      ]}
    >
      {showIndicatorLeft && (
        <View style={[styles.timelineIndicator, styles.timelineIndicatorLeft]} />
      )}

      <Pressable
        style={({ pressed }) => {
          const baseOpacity = raceStatus === 'past' ? 0.7 : 1;
          const selectionOpacity = isDimmed ? 0.45 : baseOpacity;
          const computedOpacity = pressed ? Math.max(selectionOpacity - 0.1, 0.35) : selectionOpacity;
          return [
            styles.card,
            {
              width: cardWidth,
              height: cardHeight,
              opacity: computedOpacity,
            },
            isPrimary && styles.primaryCard,
            isMock && styles.mockCard,
            raceStatus === 'past' && styles.pastCard,
            isSelected && styles.selectedCard,
          ];
        }}
        onPress={handlePress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`View details for ${name}`}
        accessibilityState={{ selected: isSelected }}
        testID={`race-card-${id}`}
        // Ensure touch events are captured
        pointerEvents="auto"
        hitSlop={{ top: 0, bottom: 0, left: 0, right: 0 }}
      >

      {isSelected && (
        <View style={styles.selectedPill}>
          <CheckCircle2 size={12} color="#1D4ED8" />
          <Text style={styles.selectedPillText}>Viewing</Text>
        </View>
      )}

      {/* Mock Badge */}
      {isMock && (
        <View style={[styles.mockBadge, menuItems.length > 0 && styles.badgeShifted]}>
          <Text style={styles.mockBadgeText}>DEMO</Text>
        </View>
      )}

      {/* Race Status Badge */}
      {!isMock && raceStatus === 'next' && (
        <View style={[styles.nextBadge, menuItems.length > 0 && styles.badgeShifted]}>
          <Text style={styles.nextBadgeText}>⚡ NEXT RACE</Text>
        </View>
      )}
      {!isMock && raceStatus === 'past' && (
        <View style={[styles.pastBadge, menuItems.length > 0 && styles.badgeShifted]}>
          <Text style={styles.pastBadgeText}>✓ COMPLETED</Text>
        </View>
      )}

     {/* Header */}
     <View style={styles.header}>
       <Text style={[styles.raceName, isPrimary && styles.primaryRaceName]} numberOfLines={2}>
         {name}
       </Text>
        {menuItems.length > 0 && (
          <View style={styles.menuTrigger}>
            <CardMenu items={menuItems} />
          </View>
        )}
        <View style={styles.venueRow}>
          <MapPin size={12} color="#64748B" />
          <Text style={styles.venueText}>{venue}</Text>
        </View>
      </View>

      {/* Race Timer (Countdown or Active Timer) - Only show on upcoming races */}
      {!isMock && raceStatus !== 'past' && onRaceComplete ? (
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
              <Text style={styles.countdownUnit}>{countdown.days === 1 ? 'DAY' : 'DAYS'}</Text>
            </View>
            <Text style={[styles.countdownSeparator, isPrimary && styles.primaryCountdownSeparator]}> </Text>
            <View style={styles.countdownBlock}>
              <Text style={[styles.countdownNumber, isPrimary && styles.primaryCountdownNumber]}>
                {String(countdown.hours).padStart(2, '0')}
              </Text>
              <Text style={styles.countdownUnit}>{countdown.hours === 1 ? 'HR' : 'HRS'}</Text>
            </View>
            <Text style={[styles.countdownSeparator, isPrimary && styles.primaryCountdownSeparator]}> </Text>
            <View style={styles.countdownBlock}>
              <Text style={[styles.countdownNumber, isPrimary && styles.primaryCountdownNumber]}>
                {String(countdown.minutes).padStart(2, '0')}
              </Text>
              <Text style={styles.countdownUnit}>{countdown.minutes === 1 ? 'MIN' : 'MINS'}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Critical Details - Enhanced with consistent visual hierarchy */}
      <View style={styles.detailsSection}>
        {/* Wind Conditions - Primary environmental data */}
        <View style={styles.environmentalCard}>
          <View style={styles.detailRowEnhanced}>
            <Wind size={18} color="#3B82F6" strokeWidth={2.5} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>WIND</Text>
              {currentWind ? (
                <Text style={styles.detailValueLarge}>
                  {currentWind.direction} {currentWind.speedMin}-{currentWind.speedMax}kts
                </Text>
              ) : (
                <Text style={styles.detailValueMessage}>
                  {getWeatherStatusMessage(currentWeatherStatus)}
                </Text>
              )}
            </View>
            {/* Weather Refresh Button (only for real races) */}
            {!isMock && raceStatus !== 'past' && (
              <Pressable onPress={handleRefreshWeather} disabled={refreshingWeather}>
                {refreshingWeather ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <RefreshCw size={14} color="#64748B" />
                )}
              </Pressable>
            )}
          </View>
        </View>

        {/* Tide Conditions - Primary environmental data */}
        <View style={styles.environmentalCard}>
          <View style={styles.detailRowEnhanced}>
            <Waves size={18} color="#0EA5E9" strokeWidth={2.5} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>TIDE</Text>
              {currentTide ? (
                <Text style={styles.detailValueLarge}>
                  {currentTide.state} {currentTide.height}m {currentTide.direction ? `→ ${currentTide.direction}` : ''}
                </Text>
              ) : (
                <Text style={styles.detailValueMessage}>
                  {getWeatherStatusMessage(currentWeatherStatus)}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* VHF Channel - Secondary information */}
        {critical_details?.vhf_channel && (
          <View style={styles.detailRow}>
            <Radio size={12} color="#8B5CF6" />
            <Text style={styles.detailText}>Ch {critical_details.vhf_channel}</Text>
          </View>
        )}
      </View>

      {/* Start Sequence Timer - Only for upcoming races WITHOUT GPS tracking */}
      {!isMock && raceStatus !== 'past' && !onRaceComplete && (
        <View style={styles.startSequenceSection}>
          <StartSequenceTimer compact={!isPrimary} />
        </View>
      )}

      </Pressable>
      {showIndicatorRight && (
        <View style={[styles.timelineIndicator, styles.timelineIndicatorRight]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 6,
    marginVertical: 6,
  },
  cardWrapperWithTimeline: {
    alignItems: 'center',
  },
  cardWrapperPast: {
    flexDirection: 'row',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    // @ts-ignore - cursor is web-only
    cursor: 'pointer',
    // @ts-ignore - userSelect is web-only
    userSelect: 'none',
    // @ts-ignore - pointerEvents handled by prop
  },
  primaryCard: {
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: '#FAFBFF',
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
    borderWidth: 2,
    borderColor: '#1D4ED8',
    backgroundColor: '#E0ECFF',
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
    transform: [{ translateY: -4 }, { scale: 1.02 }],
  },
  selectedPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 12,
  },
  selectedPillText: {
    color: '#1E3A8A',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  mockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 10,
  },
  mockBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  nextBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  nextBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  pastBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#6B7280',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  pastBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  badgeShifted: {
    right: 44,
  },
  header: {
    marginBottom: 8,
    marginTop: 6,
    paddingRight: 90, // Space for NEXT RACE badge
  },
  menuTrigger: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  raceName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
    lineHeight: 20,
  },
  primaryRaceName: {
    fontSize: 18,
    color: '#1E40AF',
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venueText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  countdownSection: {
    backgroundColor: '#334155',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryCountdownSection: {
    backgroundColor: '#1E293B',
    padding: 12,
  },
  countdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countdownBlock: {
    alignItems: 'center',
    minWidth: 32,
  },
  countdownNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 32,
    fontVariant: ['tabular-nums'],
  },
  primaryCountdownNumber: {
    fontSize: 32,
    color: '#FFFFFF',
  },
  countdownUnit: {
    fontSize: 8,
    fontWeight: '700',
    color: '#CBD5E1',
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  countdownSeparator: {
    fontSize: 20,
    fontWeight: '300',
    color: '#64748B',
    opacity: 0.5,
    marginHorizontal: 2,
  },
  primaryCountdownSeparator: {
    fontSize: 24,
    color: '#64748B',
  },
  detailsSection: {
    marginBottom: 8,
    gap: 6,
  },
  environmentalCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailRowEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  detailValueLarge: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '700',
    lineHeight: 16,
  },
  detailValueMessage: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 10,
    color: '#1E293B',
    fontWeight: '500',
  },
  timerContainer: {
    marginBottom: 6,
  },
  startSequenceSection: {
    marginBottom: 6,
  },
  timelineIndicator: {
    width: 5,
    height: '75%',
    backgroundColor: '#10B981',  // Match "NEXT RACE" badge green
    borderRadius: 999,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 5,
  },
  timelineIndicatorLeft: {
    marginRight: 12,
  },
  timelineIndicatorRight: {
    marginLeft: 12,
  },
});
