/**
 * RaceCard Component
 * Mobile phone-sized race card showing critical race details with countdown timer
 * Dimensions: 375×667px (iPhone SE size) for primary card, scaled down for others
 * 
 * Weather Display Logic:
 * - Past races: Show saved/historical data
 * - Races ≤7 days away: Show live forecast (auto-fetched)
 * - Races >7 days away: Show saved snapshot with "📌 Saved" indicator
 */

import { CardMenu, type CardMenuItem } from '@/components/shared/CardMenu';
import { calculateCountdown } from '@/constants/mockData';
import { createLogger } from '@/lib/utils/logger';
import { RaceWeatherService } from '@/services/RaceWeatherService';
import { supabase } from '@/services/supabase';
import { useRouter } from 'expo-router';
import { Award, CheckCircle2, MapPin, Medal, Pin, Radio, RefreshCw, Route, Sailboat, Trophy, Waves, Wind } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { RaceTimer } from './RaceTimer';
import { StartSequenceTimer } from './StartSequenceTimer';

// Number of days within which we show live forecast
const LIVE_FORECAST_DAYS = 7;

// Results data for completed races
export interface RaceResultData {
  position: number;
  points: number;
  fleetSize: number;
  status?: 'finished' | 'dnf' | 'dns' | 'dsq' | 'ocs' | 'ret';
  seriesPosition?: number;
  totalRaces?: number;
}

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
  courseName?: string | null; // Selected course name (e.g., "Course A", "Windward-Leeward")
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
  vhf_channel?: string | null; // VHF channel at top level (fallback)
  isPrimary?: boolean; // True for next race (largest card)
  isMock?: boolean; // True for mock data
  raceStatus?: 'past' | 'next' | 'future'; // Race timing status
  onRaceComplete?: (sessionId: string) => void; // Callback when race timer completes
  isSelected?: boolean; // True when card is selected for inline detail view
  onSelect?: () => void; // Callback when card is selected (replaces navigation for inline view)
  onEdit?: () => void;
  onDelete?: () => void;
  onHide?: () => void; // Callback to hide/withdraw from race (for registered races user didn't create)
  showTimelineIndicator?: boolean; // True to show the "now" timeline indicator on the left
  isDimmed?: boolean; // True when another race is selected and this one should recede
  results?: RaceResultData; // Results data for completed races
  venueCoordinates?: { lat: number; lng: number } | null; // Coordinates for weather fetching
  cardWidth?: number; // Custom card width for responsive layouts (default: 375)
  cardHeight?: number; // Custom card height for responsive layouts (default: 520)
  numberOfRaces?: number; // Number of races in the day/series
  startSequenceType?: 'standard' | 'pursuit' | 'rolling' | 'gate'; // Type of start sequence
  rigTension?: {
    uppers?: string; // e.g., "32" or "3.5T"
    lowers?: string;
    description?: string; // e.g., "Heavy air setup"
  } | null;
}

export function RaceCard({
  id,
  name,
  venue,
  date,
  startTime,
  courseName,
  wind,
  tide,
  weatherStatus,
  weatherError,
  critical_details,
  vhf_channel,
  isPrimary = false,
  isMock = false,
  raceStatus = 'future',
  onRaceComplete,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onHide,
  showTimelineIndicator = false,
  isDimmed = false,
  results,
  venueCoordinates,
  cardWidth: propCardWidth,
  cardHeight: propCardHeight,
  numberOfRaces,
  startSequenceType,
  rigTension,
}: RaceCardProps) {
  // Debug: Log VHF channel data sources
  React.useEffect(() => {
    logger.debug(`📻 ${name} VHF data:`, {
      'critical_details.vhf_channel': critical_details?.vhf_channel,
      'vhf_channel prop': vhf_channel,
      'displayed': critical_details?.vhf_channel || vhf_channel || 'NONE',
    });
  }, [name, critical_details, vhf_channel, logger]);

  const router = useRouter();
  const editHandler = onEdit ?? null;
  const deleteHandler = onDelete ?? null;
  const hideHandler = onHide ?? null;
  // Always has fleet badge at top-left, plus status badges at top-right
  const hasTopBadges = true; // Fleet badge is always shown
  const hasStatusBadge = isSelected || isMock || raceStatus === 'next' || raceStatus === 'past';

  const menuItems = useMemo<CardMenuItem[]>(() => {
    const items: CardMenuItem[] = [];
    if (editHandler) {
      items.push({
        label: 'Edit Race',
        icon: 'create-outline',
        onPress: editHandler,
      });
    }
    if (hideHandler) {
      items.push({
        label: 'Hide from Timeline',
        icon: 'eye-off-outline',
        onPress: hideHandler,
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
  }, [deleteHandler, editHandler, hideHandler]);
  const [refreshingWeather, setRefreshingWeather] = useState(false);
  const [currentWind, setCurrentWind] = useState(wind);
  const [currentTide, setCurrentTide] = useState(tide);
  const [currentWeatherStatus, setCurrentWeatherStatus] = useState(weatherStatus);
  const [isLiveForecast, setIsLiveForecast] = useState(false);
  const [liveForecastLoading, setLiveForecastLoading] = useState(false);

  // Calculate days until race
  const daysUntilRace = useMemo(() => {
    const raceDate = new Date(date);
    const now = new Date();
    const diffTime = raceDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [date]);

  // Determine if we should show live forecast (race within 7 days and not past)
  const shouldUseLiveForecast = useMemo(() => {
    if (raceStatus === 'past') return false;
    if (isMock) return false;
    return daysUntilRace >= 0 && daysUntilRace <= LIVE_FORECAST_DAYS;
  }, [raceStatus, isMock, daysUntilRace]);

  // Fetch live forecast for races within 7 days
  // Uses coordinates when available (same as RaceConditionsCard) for consistency
  const fetchLiveForecast = useCallback(async () => {
    if (!shouldUseLiveForecast || liveForecastLoading) return;
    // Need either coordinates or venue name to fetch weather
    if (!venueCoordinates && !venue) return;

    setLiveForecastLoading(true);
    try {
      logger.debug(`[RaceCard] Fetching live forecast for ${name} (${daysUntilRace} days away)`, {
        hasCoordinates: !!venueCoordinates,
        venue,
      });
      
      const warningSignalTime =
        critical_details?.warning_signal ||
        (typeof startTime === 'string' && startTime.includes(':') && startTime.length <= 8 ? startTime : null);

      let weatherData = null;

      // Prefer coordinates-based fetching (same method as RaceConditionsCard)
      if (venueCoordinates) {
        logger.debug(`[RaceCard] Using coordinates: ${venueCoordinates.lat}, ${venueCoordinates.lng}`);
        weatherData = await RaceWeatherService.fetchWeatherByCoordinates(
          venueCoordinates.lat,
          venueCoordinates.lng,
          date,
          venue,
          { warningSignalTime }
        );
      }

      // Fall back to venue name lookup if coordinates failed or weren't available
      if (!weatherData && venue) {
        logger.debug(`[RaceCard] Falling back to venue name lookup: ${venue}`);
        weatherData = await RaceWeatherService.fetchWeatherByVenueName(venue, date, {
          warningSignalTime,
        });
      }

      if (weatherData) {
        setCurrentWind(weatherData.wind);
        setCurrentTide(weatherData.tide);
        setCurrentWeatherStatus('available');
        setIsLiveForecast(true);
        logger.debug(`[RaceCard] Live forecast loaded for ${name}: ${weatherData.wind?.direction} ${weatherData.wind?.speedMin}-${weatherData.wind?.speedMax}kts`);
      } else {
        // Fall back to saved data if live fetch fails
        setCurrentWind(wind);
        setCurrentTide(tide);
        setCurrentWeatherStatus(weatherStatus || 'unavailable');
        setIsLiveForecast(false);
      }
    } catch (error) {
      logger.error(`[RaceCard] Error fetching live forecast for ${name}:`, error);
      // Fall back to saved data on error
      setCurrentWind(wind);
      setCurrentTide(tide);
      setCurrentWeatherStatus(weatherStatus || 'error');
      setIsLiveForecast(false);
    } finally {
      setLiveForecastLoading(false);
    }
  }, [shouldUseLiveForecast, venue, venueCoordinates, date, startTime, critical_details?.warning_signal, name, daysUntilRace, wind, tide, weatherStatus, liveForecastLoading]);

  // Auto-fetch live forecast on mount for races within 7 days
  // Uses props data directly when available (from useEnrichedRaces) to match RaceConditionsCard
  useEffect(() => {
    // For races within 7 days
    if (shouldUseLiveForecast) {
      // If we have valid weather data from props (from useEnrichedRaces), use it
      const hasValidProps = wind?.direction && wind?.speedMin !== undefined && wind?.speedMax !== undefined;
      if (hasValidProps) {
        // Use the enriched weather data from props (already live from useEnrichedRaces)
        setCurrentWind(wind);
        setCurrentTide(tide);
        setCurrentWeatherStatus('available');
        setIsLiveForecast(true);
      } else if (!isLiveForecast && !liveForecastLoading) {
        // Only fetch if we don't have valid props AND haven't already fetched
        fetchLiveForecast();
      }
    } else {
      // For races >7 days or past, use saved data from props
      setCurrentWind(wind);
      setCurrentTide(tide);
      setCurrentWeatherStatus(weatherStatus);
      setIsLiveForecast(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldUseLiveForecast, wind?.direction, wind?.speedMin, wind?.speedMax, tide?.state, tide?.height]);

  // Sync props to state when they change (for races NOT using live forecast)
  useEffect(() => {
    if (!shouldUseLiveForecast) {
      setCurrentWind(wind);
      setCurrentTide(tide);
      setCurrentWeatherStatus(weatherStatus);
    }
  }, [wind, tide, weatherStatus, shouldUseLiveForecast]);

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
          logger.error('Error updating weather:', error);
          Alert.alert('Error', 'Failed to update weather data');
        } else {
          logger.debug(`Weather updated from ${weatherData.provider}`);
          Alert.alert('Success', `Weather updated from ${weatherData.provider}`);
        }
      } else {
        setCurrentWeatherStatus('unavailable');
        Alert.alert('No Data', 'Weather data not available for this race');
      }
    } catch (error: any) {
      logger.error('Error refreshing weather:', error);
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
      logger.debug('Navigation initiated successfully');
    } catch (error) {
      logger.error('Navigation failed:', error);
    }
  };

  // Full-screen card dimensions for all platforms
  // Use passed width (full-screen minus padding) and taller height
  const cardWidth = propCardWidth ?? Math.min(SCREEN_WIDTH - 32, 375);
  const cardHeight = propCardHeight ?? 520;

  const hasRaceStartedOrPassed =
    raceStatus === 'past' ||
    (countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0);

  const showIndicatorLeft = showTimelineIndicator && !hasRaceStartedOrPassed;
  const showIndicatorRight = showTimelineIndicator && hasRaceStartedOrPassed;

  // Calculate countdown urgency color
  const getCountdownColor = () => {
    if (raceStatus === 'past') return { bg: '#F3F4F6', text: '#6B7280' };
    if (countdown.days > 7) return { bg: '#D1FAE5', text: '#065F46' }; // Green
    if (countdown.days >= 2) return { bg: '#FEF3C7', text: '#92400E' }; // Yellow
    if (countdown.days >= 1) return { bg: '#FFEDD5', text: '#C2410C' }; // Orange
    return { bg: '#FEE2E2', text: '#DC2626' }; // Red - less than 24 hours
  };
  const countdownColors = getCountdownColor();

  // Apple-style card accent color based on race status
  const getAccentColor = () => {
    if (raceStatus === 'past') return '#9CA3AF'; // Gray for completed
    if (countdown.days <= 1) return '#EF4444'; // Red - urgent
    if (countdown.days <= 3) return '#F59E0B'; // Amber - soon
    return '#10B981'; // Green - good conditions, upcoming
  };
  const accentColor = getAccentColor();

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
          const baseOpacity = raceStatus === 'past' ? 0.85 : 1;
          const selectionOpacity = isDimmed ? 0.65 : baseOpacity;
          const computedOpacity = pressed ? Math.max(selectionOpacity - 0.05, 0.7) : selectionOpacity;
          return [
            styles.card,
            styles.cardFullScreen,
            styles.cardApple,
            {
              width: cardWidth,
              height: cardHeight,
              opacity: computedOpacity,
              // Apple-style press animation
              transform: pressed
                ? [{ scale: 0.98 }]
                : isSelected
                  ? [{ translateY: -4 }, { scale: 1.02 }]
                  : [],
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
        pointerEvents="auto"
        hitSlop={{ top: 0, bottom: 0, left: 0, right: 0 }}
      >
      {/* Status Accent Line - Apple-style top indicator */}
      <View style={[styles.accentLine, { backgroundColor: accentColor }]} />

      {/* Menu in upper right corner */}
      {menuItems.length > 0 && (
        <View style={styles.menuContainer}>
          <CardMenu items={menuItems} />
        </View>
      )}

      {/* Top Badges Row - Race type, Course, Race Count */}
      <View style={styles.topBadgesRow}>
        {/* Fleet Badge */}
        <View style={styles.fleetBadgeNew}>
          <Sailboat size={10} color="#0369A1" />
          <Text style={styles.fleetBadgeText}>FLEET</Text>
        </View>

        {/* Course Badge */}
        {courseName && (
          <View style={styles.courseBadge}>
            <Route size={10} color="#059669" />
            <Text style={styles.courseBadgeText}>{courseName}</Text>
          </View>
        )}

        {/* Race Count Badge */}
        {numberOfRaces && numberOfRaces > 0 && (
          <View style={styles.raceCountBadge}>
            <Text style={styles.raceCountBadgeText}>{numberOfRaces} {numberOfRaces === 1 ? 'race' : 'races'}</Text>
          </View>
        )}
      </View>

      {/* Header Zone - Countdown left, Details right */}
      <View style={[styles.headerZone, styles.headerZoneFullScreen]}>
        {/* Countdown Box */}
        <View style={[
          styles.countdownBox,
          styles.countdownBoxFullScreen,
          { backgroundColor: countdownColors.bg }
        ]}>
          {raceStatus === 'past' ? (
            <>
              <CheckCircle2 size={32} color={countdownColors.text} />
              <Text style={[
                styles.countdownBoxLabel,
                styles.countdownBoxLabelFullScreen,
                { color: countdownColors.text }
              ]}>DONE</Text>
            </>
          ) : (
            <>
              <Text style={[
                styles.countdownBoxNumber,
                styles.countdownBoxNumberFullScreen,
                { color: countdownColors.text }
              ]}>
                {countdown.days}
              </Text>
              <Text style={[
                styles.countdownBoxLabel,
                styles.countdownBoxLabelFullScreen,
                { color: countdownColors.text }
              ]}>
                {countdown.days === 1 ? 'DAY' : 'DAYS'}
              </Text>
            </>
          )}
        </View>

        {/* Race Details */}
        <View style={[styles.headerDetails, styles.headerDetailsFullScreen]}>
          <Text style={[styles.raceNameNew, styles.raceNameFullScreen]} numberOfLines={3}>
            {name || '[No Race Name]'}
          </Text>
          <View style={styles.metaRow}>
            <MapPin size={11} color="#64748B" />
            <Text style={styles.metaText} numberOfLines={1}>
              {venue || '[No Venue]'}
            </Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>
              {new Date(date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </View>
          {/* Start Time Row */}
          <View style={styles.startTimeRow}>
            <Text style={styles.startTimeLabel}>
              {critical_details?.warning_signal ? 'Warning Signal' : 'Start'}:
            </Text>
            <Text style={styles.startTimeValue}>
              {critical_details?.warning_signal || startTime}
            </Text>
            {startSequenceType && (
              <View style={styles.startSequenceBadge}>
                <Text style={styles.startSequenceBadgeText}>
                  {startSequenceType === 'standard' ? '5-4-1-0' :
                   startSequenceType === 'pursuit' ? 'Pursuit' :
                   startSequenceType === 'rolling' ? 'Rolling' : 'Gate'}
                </Text>
              </View>
            )}
          </View>
          {/* Status indicators */}
          {isSelected && (
            <View style={styles.statusIndicator}>
              <CheckCircle2 size={10} color="#1D4ED8" />
              <Text style={styles.statusText}>Viewing</Text>
            </View>
          )}
          {isMock && !isSelected && (
            <View style={[styles.statusIndicator, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.statusText, { color: '#92400E' }]}>Demo</Text>
            </View>
          )}
        </View>
      </View>

      {/* Conditions Row - Horizontal chips */}
      <View style={[styles.conditionsRow, styles.conditionsRowFullScreen]}>
        {/* Wind Chip */}
        <View style={[styles.conditionChip, styles.conditionChipFullScreen]}>
          <Wind size={18} color="#3B82F6" strokeWidth={2.5} />
          {liveForecastLoading ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : currentWind ? (
            <Text style={[styles.conditionChipText, styles.conditionChipTextFullScreen]}>
              {currentWind.direction} {Math.min(currentWind.speedMin, currentWind.speedMax)}-{Math.max(currentWind.speedMin, currentWind.speedMax)}kt
            </Text>
          ) : (
            <Text style={[styles.conditionChipTextMuted, styles.conditionChipTextFullScreen]}>--</Text>
          )}
        </View>

        {/* Tide Chip */}
        <View style={[styles.conditionChip, styles.conditionChipFullScreen]}>
          <Waves size={18} color="#0EA5E9" strokeWidth={2.5} />
          {liveForecastLoading ? (
            <ActivityIndicator size="small" color="#0EA5E9" />
          ) : currentTide ? (
            <Text style={[styles.conditionChipText, styles.conditionChipTextFullScreen]}>
              {currentTide.height}m {currentTide.state}
            </Text>
          ) : (
            <Text style={[styles.conditionChipTextMuted, styles.conditionChipTextFullScreen]}>--</Text>
          )}
        </View>

        {/* VHF Chip */}
        {(critical_details?.vhf_channel || vhf_channel) && (
          <View style={[styles.conditionChip, styles.vhfChip, styles.conditionChipFullScreen]}>
            <Radio size={18} color="#8B5CF6" strokeWidth={2.5} />
            <Text style={[styles.conditionChipText, styles.conditionChipTextFullScreen]}>
              Ch {critical_details?.vhf_channel || vhf_channel}
            </Text>
          </View>
        )}
      </View>

      {/* Rig Tension Indicator - compact display */}
      {rigTension && raceStatus !== 'past' && (
        <View style={styles.rigTensionRow}>
          <View style={styles.rigTensionIndicator}>
            <Text style={styles.rigTensionLabel}>Uppers</Text>
            <Text style={styles.rigTensionValue}>{rigTension.uppers || '--'}</Text>
          </View>
          {rigTension.lowers && (
            <View style={styles.rigTensionIndicator}>
              <Text style={styles.rigTensionLabel}>Lowers</Text>
              <Text style={styles.rigTensionValue}>{rigTension.lowers}</Text>
            </View>
          )}
          {rigTension.description && (
            <Text style={styles.rigTensionDescription}>{rigTension.description}</Text>
          )}
        </View>
      )}

      {/* Race Timer for upcoming races - full countdown display */}
      {!isMock && raceStatus !== 'past' && onRaceComplete && (
        <View style={styles.timerContainerFullScreen}>
          <RaceTimer
            raceId={id}
            raceName={name}
            raceDate={date}
            raceTime={startTime}
            onRaceComplete={onRaceComplete}
          />
        </View>
      )}

      {/* Start Sequence Timer - for races without GPS tracking */}
      {!isMock && raceStatus !== 'past' && !onRaceComplete && (
        <View style={styles.startSequenceContainerFullScreen}>
          <StartSequenceTimer compact={false} />
        </View>
      )}

      {/* Results display for past races */}
      {raceStatus === 'past' && results && (
        <View style={styles.resultsContainerFullScreen}>
          <View style={styles.resultBadgeFullScreen}>
            {results.position <= 3 && <Trophy size={24} color="#FFD700" />}
            <Text style={styles.resultBadgeTextFullScreen}>
              {results.position === 1 ? '1st' : results.position === 2 ? '2nd' : results.position === 3 ? '3rd' : `${results.position}th`}
            </Text>
          </View>
          <Text style={styles.resultMetaFullScreen}>of {results.fleetSize} boats</Text>
          {results.points !== undefined && (
            <Text style={styles.resultPointsFullScreen}>{results.points} pts</Text>
          )}
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
    marginHorizontal: 8,
    marginVertical: 8,
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
    overflow: 'visible', // Allow shadow and accent to show
    borderWidth: 0,
    borderColor: 'transparent',
    // @ts-ignore - cursor is web-only
    cursor: 'pointer',
    // @ts-ignore - userSelect is web-only
    userSelect: 'none',
  },
  // Apple-style elevated card with soft multi-layer shadow
  cardApple: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
    ...Platform.select({
      web: {
        // Multi-layer shadow for depth (Apple style)
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 6px 16px rgba(0, 0, 0, 0.1), 0 12px 32px rgba(0, 0, 0, 0.06)',
      },
      default: {
        // More pronounced shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 12,
      },
    }),
  },
  // Status accent line at top of card
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    zIndex: 10,
  },
  cardFullScreen: {
    padding: 20,
    paddingTop: 24, // Extra padding for accent line
    borderRadius: 20,
    justifyContent: 'flex-start',
  },
  // Primary/next race - subtle blue tint and enhanced shadow
  primaryCard: {
    backgroundColor: '#FAFCFF',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.08), 0 6px 16px rgba(59, 130, 246, 0.12), 0 12px 32px rgba(0, 0, 0, 0.06)',
      },
      default: {
        shadowColor: '#3B82F6',
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  // Mock/demo card - subtle dashed indicator
  mockCard: {
    backgroundColor: '#FFFBF5',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(245, 158, 11, 0.08)',
      },
      default: {
        shadowColor: '#F59E0B',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  // Past/completed race - muted appearance
  pastCard: {
    backgroundColor: '#FAFAFA',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03), 0 2px 6px rgba(0, 0, 0, 0.04)',
      },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  // Selected/viewing card - elevated with blue accent
  selectedCard: {
    backgroundColor: '#F0F7FF',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.1), 0 8px 20px rgba(37, 99, 235, 0.15), 0 16px 40px rgba(0, 0, 0, 0.08)',
      },
      default: {
        shadowColor: '#2563EB',
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 12,
      },
    }),
  },
  menuContainer: {
    position: 'absolute',
    top: 8,
    right: 36,
    zIndex: 20,
  },
  // NEW: Redesigned card styles
  topBadgesRow: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    maxWidth: '60%',
  },
  fleetBadgeNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  fleetBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#0369A1',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  courseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  courseBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  raceCountBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  raceCountBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  startTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  startTimeLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  startTimeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  startSequenceBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  startSequenceBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#7C3AED',
  },
  rigTensionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rigTensionIndicator: {
    alignItems: 'center',
  },
  rigTensionLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  rigTensionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  rigTensionDescription: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    fontStyle: 'italic',
  },
  headerZone: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
    marginTop: 4,
  },
  headerZoneFullScreen: {
    gap: 16,
    marginBottom: 20,
    marginTop: 8,
  },
  countdownBox: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  countdownBoxFullScreen: {
    width: 90,
    height: 90,
    borderRadius: 16,
  },
  countdownBoxNumber: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
  },
  countdownBoxNumberFullScreen: {
    fontSize: 42,
    lineHeight: 48,
  },
  countdownBoxLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  countdownBoxLabelFullScreen: {
    fontSize: 12,
    letterSpacing: 0.8,
  },
  headerDetails: {
    flex: 1,
    paddingRight: 28,
  },
  headerDetailsFullScreen: {
    paddingRight: 32,
  },
  raceNameNew: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 20,
    marginBottom: 4,
  },
  raceNameFullScreen: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 11,
    color: '#94A3B8',
    marginHorizontal: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1D4ED8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  // Conditions container - Apple-style inset well
  conditionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  conditionsRowFullScreen: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    backgroundColor: '#F5F5F7', // Apple's signature warm gray
    borderRadius: 14,
    padding: 10,
    // Subtle inner shadow effect
    ...Platform.select({
      web: {
        boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.04)',
      },
      default: {},
    }),
  },
  conditionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 0,
    flex: 1,
    // Subtle shadow for chips inside inset well
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  conditionChipFullScreen: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  conditionChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  conditionChipTextFullScreen: {
    fontSize: 15,
    fontWeight: '600',
  },
  conditionChipTextMuted: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  // Full-screen timer and results styles
  timerContainerFullScreen: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  startSequenceContainerFullScreen: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  resultsContainerFullScreen: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    gap: 8,
  },
  resultBadgeFullScreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resultBadgeTextFullScreen: {
    fontSize: 24,
    fontWeight: '800',
    color: '#92400E',
  },
  resultMetaFullScreen: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  resultPointsFullScreen: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  vhfChip: {
    backgroundColor: '#FAF5FF', // Slightly purple tinted white
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  resultMeta: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  // Compact results for fixed-height cards
  resultsRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  resultBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultBadgeTextSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  resultMetaSmall: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  timerRowCompact: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  // Keep old styles for backward compatibility
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
  fleetBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    zIndex: 10,
  },
  fleetBadgeWithSelection: {
    top: 36, // Move below the "Viewing" pill
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
    maxWidth: '55%',
    alignSelf: 'flex-end',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
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
    maxWidth: '55%',
    alignSelf: 'flex-end',
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
  header: {
    marginBottom: 8,
    marginTop: 6,
    paddingRight: 30, // Space for menu
  },
  headerWithBadges: {
    paddingTop: 22,
  },
  raceName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 17,
  },
  primaryRaceName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E40AF',
    lineHeight: 19,
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
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  courseText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
  dateTimeRow: {
    marginTop: 4,
  },
  dateTimeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  countdownSection: {
    backgroundColor: '#334155',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  primaryCountdownSection: {
    backgroundColor: '#1E293B',
    padding: 12,
  },
  pastCountdownSection: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pastRaceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pastRaceDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  pastCountdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  // Results display styles for completed races
  resultsContainer: {
    alignItems: 'center',
    width: '100%',
  },
  positionDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  positionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  positionText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  positionTextPodium: {
    color: '#059669',
  },
  statusCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  resultsStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultStat: {
    alignItems: 'center',
  },
  resultStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  resultStatLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  noResultsHint: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 6,
    fontStyle: 'italic',
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
    flex: 1, // Fill remaining card space for consistent layouts
    marginBottom: 8,
    gap: 6,
  },
  // Fixed height wrapper for forecast headers ensures consistent card layouts
  forecastHeaderWrapper: {
    minHeight: 18, // Consistent height for all header states
    justifyContent: 'center',
    marginBottom: 2,
  },
  forecastHeaderPlaceholder: {
    height: 14, // Match header text line height
  },
  conditionsHeader: {
  },
  conditionsHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  savedForecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savedForecastText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  liveForecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveForecastText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#10B981',
    letterSpacing: 0.3,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  environmentalCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
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
  // Fixed height container for countdown/timer ensures consistent positioning across cards
  countdownContainer: {
    minHeight: 90, // Reserve consistent space for countdown/timer/results section
    justifyContent: 'center',
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
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
    zIndex: 5,
  },
  timelineIndicatorLeft: {
    marginRight: 12,
  },
  timelineIndicatorRight: {
    marginLeft: 12,
  },
  // VHF Channel card styles
  vhfCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  vhfContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vhfTextContainer: {
    flex: 1,
  },
  vhfLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: 0.5,
  },
  vhfValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B21B6',
  },
});
