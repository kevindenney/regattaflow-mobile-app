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
import { ActivityIndicator, Alert, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
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
              minHeight: cardHeight,
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

      {/* Menu in upper right corner - absolute positioned */}
      {menuItems.length > 0 && (
        <View style={styles.menuContainer}>
          <CardMenu items={menuItems} />
        </View>
      )}

      {isSelected && (
        <View style={styles.selectedPill}>
          <CheckCircle2 size={12} color="#1D4ED8" />
          <Text style={styles.selectedPillText}>Viewing</Text>
        </View>
      )}

      {/* Fleet Race Type Badge - positioned below Viewing pill when selected */}
      <View style={[
        styles.fleetBadge, 
        isSelected && styles.fleetBadgeWithSelection
      ]}>
        <Sailboat size={10} color="#0369A1" />
        <Text style={styles.fleetBadgeText}>FLEET</Text>
      </View>

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
      <View style={[styles.header, hasTopBadges && styles.headerWithBadges]}>
        <Text
          style={[styles.raceName, isPrimary && styles.primaryRaceName]}
          numberOfLines={2}
        >
          {name}
        </Text>
        <View style={styles.venueRow}>
          <MapPin size={12} color="#64748B" />
          <Text style={styles.venueText}>{venue}</Text>
        </View>
        {/* Course Name - show if selected */}
        {courseName && (
          <View style={styles.courseRow}>
            <Route size={12} color="#7C3AED" />
            <Text style={styles.courseText}>{courseName}</Text>
          </View>
        )}
        {/* Race Date & Time - only show when RaceTimer is NOT displayed */}
        {(isMock || raceStatus === 'past' || !onRaceComplete) && (
          <View style={styles.dateTimeRow}>
            <Text style={styles.dateTimeText}>
              {new Date(date).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })} at {startTime?.substring(0, 5) || startTime}
            </Text>
          </View>
        )}
      </View>

      {/* Race Timer (Countdown or Active Timer) - Only show on upcoming races */}
      {/* Fixed height container ensures consistent countdown positioning across cards */}
      <View style={styles.countdownContainer}>
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
        ) : raceStatus === 'past' ? (
        /* Past race - show results or completion status */
        <View style={[styles.countdownSection, styles.pastCountdownSection]}>
          {results ? (
            /* Show race results */
            <>
              <Text style={styles.pastCountdownLabel}>YOUR RESULT</Text>
              <View style={styles.resultsContainer}>
                {/* Position with medal/trophy */}
                <View style={styles.positionDisplay}>
                  {results.position === 1 ? (
                    <Trophy size={28} color="#FFD700" fill="#FFD700" />
                  ) : results.position === 2 ? (
                    <Medal size={28} color="#C0C0C0" />
                  ) : results.position === 3 ? (
                    <Award size={28} color="#CD7F32" />
                  ) : (
                    <View style={styles.positionCircle}>
                      <Text style={styles.positionNumber}>{results.position}</Text>
                    </View>
                  )}
                  <Text style={[
                    styles.positionText,
                    results.position <= 3 && styles.positionTextPodium
                  ]}>
                    {results.position === 1 ? '1st' : 
                     results.position === 2 ? '2nd' : 
                     results.position === 3 ? '3rd' : 
                     `${results.position}th`}
                    {results.status && results.status !== 'finished' && (
                      <Text style={styles.statusCode}> ({results.status.toUpperCase()})</Text>
                    )}
                  </Text>
                </View>
                
                {/* Fleet size and points */}
                <View style={styles.resultsStats}>
                  <View style={styles.resultStat}>
                    <Text style={styles.resultStatValue}>{results.fleetSize}</Text>
                    <Text style={styles.resultStatLabel}>boats</Text>
                  </View>
                  <View style={styles.resultStatDivider} />
                  <View style={styles.resultStat}>
                    <Text style={styles.resultStatValue}>{results.points}</Text>
                    <Text style={styles.resultStatLabel}>pts</Text>
                  </View>
                  {results.seriesPosition && (
                    <>
                      <View style={styles.resultStatDivider} />
                      <View style={styles.resultStat}>
                        <Text style={styles.resultStatValue}>
                          {results.seriesPosition}/{results.totalRaces || '?'}
                        </Text>
                        <Text style={styles.resultStatLabel}>series</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </>
          ) : (
            /* No results yet - show completion status */
            <>
              <Text style={styles.pastCountdownLabel}>RACE COMPLETED</Text>
              <View style={styles.pastRaceInfo}>
                <CheckCircle2 size={24} color="#10B981" />
                <Text style={styles.pastRaceDate}>
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </View>
              <Text style={styles.noResultsHint}>Results not yet entered</Text>
            </>
          )}
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
      </View>

      {/* Critical Details - Enhanced with consistent visual hierarchy */}
      {/* Flex: 1 ensures this section expands to fill remaining space */}
      <View style={styles.detailsSection}>
        {/* Section Label based on data source - fixed height wrapper for consistency */}
        <View style={styles.forecastHeaderWrapper}>
          {raceStatus === 'past' ? (
            <View style={styles.conditionsHeader}>
              <Text style={styles.conditionsHeaderText}>RACE CONDITIONS</Text>
            </View>
          ) : !shouldUseLiveForecast && currentWind ? (
            <View style={styles.savedForecastHeader}>
              <Pin size={10} color="#64748B" />
              <Text style={styles.savedForecastText}>Saved forecast</Text>
            </View>
          ) : isLiveForecast ? (
            <View style={styles.liveForecastHeader}>
              <View style={styles.liveDot} />
              <Text style={styles.liveForecastText}>Live forecast</Text>
            </View>
          ) : (
            /* Placeholder when no header to maintain consistent spacing */
            <View style={styles.forecastHeaderPlaceholder} />
          )}
        </View>
        
        {/* Wind Conditions - Primary environmental data */}
        <View style={styles.environmentalCard}>
          <View style={styles.detailRowEnhanced}>
            <Wind size={18} color="#3B82F6" strokeWidth={2.5} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>
                {raceStatus === 'past' ? 'WIND (RECORDED)' : 'WIND'}
              </Text>
              {liveForecastLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text style={styles.detailValueMessage}>Loading forecast...</Text>
                </View>
              ) : currentWind ? (
                <Text style={styles.detailValueLarge}>
                  {currentWind.direction} {Math.min(currentWind.speedMin, currentWind.speedMax)}-{Math.max(currentWind.speedMin, currentWind.speedMax)}kts
                </Text>
              ) : (
                <Text style={styles.detailValueMessage}>
                  {raceStatus === 'past' ? 'No conditions recorded' : getWeatherStatusMessage(currentWeatherStatus)}
                </Text>
              )}
            </View>
            {/* Weather Refresh Button (only for real upcoming races) */}
            {!isMock && raceStatus !== 'past' && (
              <Pressable 
                onPress={shouldUseLiveForecast ? fetchLiveForecast : handleRefreshWeather} 
                disabled={refreshingWeather || liveForecastLoading}
              >
                {(refreshingWeather || liveForecastLoading) ? (
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
              <Text style={styles.detailLabel}>{raceStatus === 'past' ? 'TIDE (RECORDED)' : 'TIDE'}</Text>
              {liveForecastLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#0EA5E9" />
                  <Text style={styles.detailValueMessage}>Loading...</Text>
                </View>
              ) : currentTide ? (
                <Text style={styles.detailValueLarge}>
                  {currentTide.state} {currentTide.height}m {currentTide.direction ? `→ ${currentTide.direction}` : ''}
                </Text>
              ) : (
                <Text style={styles.detailValueMessage}>
                  {raceStatus === 'past' ? 'No conditions recorded' : getWeatherStatusMessage(currentWeatherStatus)}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* VHF Channel - Styled card for visibility */}
        {(critical_details?.vhf_channel || vhf_channel) && (
          <View style={styles.vhfCard}>
            <View style={styles.vhfContent}>
              <Radio size={14} color="#8B5CF6" strokeWidth={2.5} />
              <View style={styles.vhfTextContainer}>
                <Text style={styles.vhfLabel}>VHF CHANNEL</Text>
                <Text style={styles.vhfValue}>Ch {critical_details?.vhf_channel || vhf_channel}</Text>
              </View>
            </View>
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
  menuContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 20,
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
  fleetBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: 0.5,
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
