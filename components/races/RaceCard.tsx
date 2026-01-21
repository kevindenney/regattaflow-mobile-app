/**
 * RaceCard Component
 *
 * Apple Human Interface Guidelines (HIG) compliant race card:
 * - iOS system colors from shared constants
 * - Mobile phone-sized card showing critical race details
 * - Countdown timer with urgency colors
 *
 * Weather Display Logic:
 * - Past races: Show saved/historical data
 * - Races ≤7 days away: Show live forecast (auto-fetched)
 * - Races >7 days away: Show saved snapshot with "📌 Saved" indicator
 */

import { CardMenu, type CardMenuItem } from '@/components/shared/CardMenu';
import {
  IOS_COLORS,
  CARD_SHADOW_DRAMATIC,
  CARD_SHADOW_DRAMATIC_WEB,
  CARD_SHADOW_DRAMATIC_EXPANDED,
  CARD_SHADOW_DRAMATIC_EXPANDED_WEB,
} from '@/components/cards/constants';
import { calculateCountdown } from '@/constants/mockData';
import { createLogger } from '@/lib/utils/logger';
import { useRouter } from 'expo-router';
import { Award, CheckCircle2, MapPin, Medal, Pin, Radio, Route, Sailboat, Trophy, Wind, Waves } from 'lucide-react-native';
import { TinySparkline } from '@/components/shared/charts';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { RaceTimer } from './RaceTimer';
import { StartSequenceTimer } from './StartSequenceTimer';
import { RaceTypeBadge, type RaceType } from './RaceTypeSelector';
import { TruncatedText } from '@/components/ui/TruncatedText';
import { ExpandedContentZone } from './ExpandedContentZone';
import { getCurrentPhaseForRace, CardRaceData } from '@/components/cards/types';
import { CrewAvatarStack } from './CrewAvatarStack';
import { RaceCollaborator } from '@/types/raceCollaboration';

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
  /** Race type: fleet, distance, match, or team */
  raceType?: RaceType;
  /** Hourly wind forecast speeds (knots) for sparkline */
  windForecast?: number[];
  /** Hourly tide forecast values for sparkline */
  tideForecast?: number[];
  /** Index of "now" in forecast arrays (for dot indicator) */
  forecastNowIndex?: number;
  /** Whether this card is expanded to fill the screen */
  isExpanded?: boolean;
  /** Header offset for expanded card (e.g., header height above the card) */
  expandedHeaderOffset?: number;
  /** Crew collaborators for this race */
  collaborators?: RaceCollaborator[];
  /** Callback when crew avatars are pressed */
  onCollaboratorsPress?: () => void;
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
  raceType = 'fleet',
  windForecast,
  tideForecast,
  forecastNowIndex,
  isExpanded = false,
  expandedHeaderOffset = 120,
  collaborators,
  onCollaboratorsPress,
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

  // Get window dimensions for expanded mode
  const { height: windowHeight } = useWindowDimensions();

  // Full-screen card dimensions for all platforms
  // Use passed width (full-screen minus padding) and taller height
  const cardWidth = propCardWidth ?? Math.min(SCREEN_WIDTH - 32, 375);

  // Constants for expanded card layout
  const BOTTOM_MARGIN = 24;
  const HEADER_ZONE_HEIGHT = 280; // Fixed header portion

  // Calculate card height: expanded fills screen, normal is fixed 520px
  const cardHeight = propCardHeight ?? (
    isExpanded
      ? windowHeight - expandedHeaderOffset - BOTTOM_MARGIN
      : 520
  );

  // Available height for expanded content zone
  const expandedContentHeight = isExpanded
    ? cardHeight - HEADER_ZONE_HEIGHT - 40 // 40px for padding
    : 0;

  const hasRaceStartedOrPassed =
    raceStatus === 'past' ||
    (countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0);

  const showIndicatorLeft = showTimelineIndicator && !hasRaceStartedOrPassed;
  const showIndicatorRight = showTimelineIndicator && hasRaceStartedOrPassed;

  // Calculate countdown urgency color (iOS semantic colors)
  const getCountdownColor = () => {
    if (raceStatus === 'past') return { bg: IOS_COLORS.gray6, text: IOS_COLORS.gray };
    if (countdown.days > 7) return { bg: `${IOS_COLORS.green}20`, text: IOS_COLORS.green }; // Green
    if (countdown.days >= 2) return { bg: `${IOS_COLORS.yellow}25`, text: IOS_COLORS.orange }; // Yellow
    if (countdown.days >= 1) return { bg: `${IOS_COLORS.orange}20`, text: IOS_COLORS.orange }; // Orange
    return { bg: `${IOS_COLORS.red}20`, text: IOS_COLORS.red }; // Red - less than 24 hours
  };
  const countdownColors = getCountdownColor();

  // Apple-style card accent color based on race status (iOS colors)
  const getAccentColor = () => {
    if (raceStatus === 'past') return IOS_COLORS.gray; // Gray for completed
    if (countdown.days <= 1) return IOS_COLORS.red; // Red - urgent
    if (countdown.days <= 3) return IOS_COLORS.orange; // Orange - soon
    return IOS_COLORS.green; // Green - good conditions, upcoming
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

      {/* Menu in upper right corner - pointerEvents="box-none" prevents bubbling to parent */}
      {menuItems.length > 0 && (
        <View style={styles.menuContainer} pointerEvents="box-none">
          <CardMenu items={menuItems} />
        </View>
      )}

      {/* Top Badges Row - Race type, Course, Race Count */}
      <View style={styles.topBadgesRow}>
        {/* Race Type Badge */}
        <RaceTypeBadge type={raceType} size="small" />

        {/* Course Badge */}
        {courseName && (
          <View style={styles.courseBadge}>
            <Route size={10} color={IOS_COLORS.green} />
            <Text style={styles.courseBadgeText}>{courseName}</Text>
          </View>
        )}

        {/* Race Count Badge */}
        {numberOfRaces && numberOfRaces > 0 && (
          <View style={styles.raceCountBadge}>
            <Text style={styles.raceCountBadgeText}>{numberOfRaces} {numberOfRaces === 1 ? 'race' : 'races'}</Text>
          </View>
        )}

        {/* Crew Avatars */}
        {collaborators && collaborators.length > 0 && (
          <CrewAvatarStack
            collaborators={collaborators}
            maxVisible={3}
            size="xs"
            onPress={onCollaboratorsPress}
          />
        )}
      </View>

      {/* Header Zone - Countdown left, Details right */}
      <View style={[styles.headerZone, styles.headerZoneFullScreen]}>
        {/* Countdown Box - Tufte compact format */}
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
            <Text style={[
              styles.countdownBoxCompact,
              styles.countdownBoxCompactFullScreen,
              { color: countdownColors.text }
            ]}>
              {countdown.days > 0
                ? `${countdown.days}d ${countdown.hours}h`
                : `${countdown.hours}h ${countdown.minutes}m`}
            </Text>
          )}
        </View>

        {/* Race Details */}
        <View style={[styles.headerDetails, styles.headerDetailsFullScreen]}>
          <TruncatedText
            text={name || '[No Race Name]'}
            numberOfLines={3}
            style={[styles.raceNameNew, styles.raceNameFullScreen]}
          />
          <View style={styles.metaRow}>
            <MapPin size={11} color={IOS_COLORS.gray} />
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
              <CheckCircle2 size={10} color={IOS_COLORS.blue} />
              <Text style={styles.statusText}>Viewing</Text>
            </View>
          )}
          {isMock && !isSelected && (
            <View style={[styles.statusIndicator, { backgroundColor: `${IOS_COLORS.yellow}25` }]}>
              <Text style={[styles.statusText, { color: IOS_COLORS.orange }]}>Demo</Text>
            </View>
          )}
        </View>
      </View>

      {/* VHF Channel - if available */}
      {(critical_details?.vhf_channel || vhf_channel) && (
        <View style={[styles.conditionsRow, styles.conditionsRowFullScreen]}>
          <View style={[styles.conditionChip, styles.vhfChip, styles.conditionChipFullScreen]}>
            <Radio size={18} color={IOS_COLORS.purple} strokeWidth={2.5} />
            <Text style={[styles.conditionChipText, styles.conditionChipTextFullScreen]}>
              Ch {critical_details?.vhf_channel || vhf_channel}
            </Text>
          </View>
        </View>
      )}

      {/* Weather Sparklines - for upcoming races with forecast data */}
      {raceStatus !== 'past' && countdown.days <= 7 && (windForecast?.length ?? 0) >= 2 && (
        <View style={styles.sparklineRow}>
          {/* Wind sparkline */}
          {windForecast && windForecast.length >= 2 && (
            <View style={styles.sparklineItem}>
              <Wind size={14} color={IOS_COLORS.blue} strokeWidth={2} />
              <Text style={styles.sparklineLabel}>
                {Math.round(Math.min(...windForecast))}-{Math.round(Math.max(...windForecast))}kt
              </Text>
              <TinySparkline
                data={windForecast}
                width={50}
                height={14}
                color={IOS_COLORS.blue}
                nowIndex={forecastNowIndex}
                showNowDot
                variant="line"
              />
            </View>
          )}
          {/* Tide sparkline */}
          {tideForecast && tideForecast.length >= 2 && (
            <View style={styles.sparklineItem}>
              <Waves size={14} color={IOS_COLORS.teal} strokeWidth={2} />
              <Text style={styles.sparklineLabel}>Tide</Text>
              <TinySparkline
                data={tideForecast}
                width={50}
                height={14}
                color={IOS_COLORS.teal}
                nowIndex={forecastNowIndex}
                showNowDot
                variant="area"
              />
            </View>
          )}
        </View>
      )}

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

      {/* Expanded Content Zone - shows when card is expanded */}
      {isExpanded && expandedContentHeight > 0 && (
        <View style={[styles.expandedContentZone, { height: expandedContentHeight }]}>
          <ExpandedContentZone
            race={{
              id,
              name,
              venue,
              date,
              startTime,
              boatClass: undefined, // Add if available
              vhf_channel: critical_details?.vhf_channel || vhf_channel || undefined,
              race_type: raceType,
              wind: wind || undefined,
              tide: tide ? {
                state: tide.state as 'flooding' | 'ebbing' | 'slack' | 'high' | 'low',
                height: tide.height,
                direction: tide.direction,
              } : undefined,
            } as CardRaceData}
            phase={getCurrentPhaseForRace(date, startTime)}
            raceType={raceType}
            availableHeight={expandedContentHeight}
            raceId={id}
          />
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
    backgroundColor: IOS_COLORS.systemBackground,
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
  // Tufte-style elevated card with dramatic shadow for depth
  cardApple: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderWidth: 0,
    ...Platform.select({
      web: {
        // Dramatic multi-layer shadow (Tufte style - cards float above warm paper)
        boxShadow: CARD_SHADOW_DRAMATIC_WEB,
      },
      default: {
        // Dramatic shadow for native - strong 3D floating effect
        ...CARD_SHADOW_DRAMATIC,
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
  // Tufte: Removed primaryCard styling - trust timeline position to indicate next race
  // Mock/demo card - subtle dashed indicator
  mockCard: {
    backgroundColor: `${IOS_COLORS.orange}08`,
    ...Platform.select({
      web: {
        boxShadow: `0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px ${IOS_COLORS.orange}14`,
      },
      default: {
        shadowColor: IOS_COLORS.orange,
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  // Past/completed race - muted appearance
  pastCard: {
    backgroundColor: IOS_COLORS.gray6,
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
  // Selected/viewing card - dramatically elevated with blue accent
  selectedCard: {
    backgroundColor: `${IOS_COLORS.blue}10`,
    ...Platform.select({
      web: {
        // Dramatic expanded shadow with blue tint
        boxShadow: `0 6px 12px ${IOS_COLORS.blue}18, 0 16px 36px ${IOS_COLORS.blue}28, 0 32px 64px rgba(0, 0, 0, 0.12)`,
      },
      default: {
        shadowColor: IOS_COLORS.blue,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 28,
        elevation: 20,
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
    backgroundColor: `${IOS_COLORS.blue}15`,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  fleetBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: IOS_COLORS.blue,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  courseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${IOS_COLORS.green}15`,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  courseBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: IOS_COLORS.green,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  raceCountBadge: {
    backgroundColor: `${IOS_COLORS.yellow}25`,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  raceCountBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: IOS_COLORS.orange,
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
    color: IOS_COLORS.gray,
  },
  startTimeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  startSequenceBadge: {
    backgroundColor: `${IOS_COLORS.purple}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  startSequenceBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: IOS_COLORS.purple,
  },
  rigTensionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: IOS_COLORS.gray6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
  },
  rigTensionIndicator: {
    alignItems: 'center',
  },
  rigTensionLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  rigTensionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  rigTensionDescription: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
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
  // Tufte compact countdown: "2h 47m" format
  countdownBoxCompact: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  countdownBoxCompactFullScreen: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.8,
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
    color: IOS_COLORS.label,
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
    color: IOS_COLORS.gray,
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 11,
    color: IOS_COLORS.gray2,
    marginHorizontal: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${IOS_COLORS.blue}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: IOS_COLORS.blue,
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
    backgroundColor: IOS_COLORS.systemGroupedBackground,
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
    backgroundColor: IOS_COLORS.systemBackground,
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
    color: IOS_COLORS.secondaryLabel,
  },
  conditionChipTextFullScreen: {
    fontSize: 15,
    fontWeight: '600',
  },
  conditionChipTextMuted: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray2,
  },
  // Full-screen timer and results styles
  timerContainerFullScreen: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray5,
  },
  startSequenceContainerFullScreen: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray5,
  },
  resultsContainerFullScreen: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray5,
    alignItems: 'center',
    gap: 8,
  },
  resultBadgeFullScreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${IOS_COLORS.yellow}25`,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resultBadgeTextFullScreen: {
    fontSize: 24,
    fontWeight: '800',
    color: IOS_COLORS.orange,
  },
  resultMetaFullScreen: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    fontWeight: '500',
  },
  resultPointsFullScreen: {
    fontSize: 16,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  vhfChip: {
    backgroundColor: `${IOS_COLORS.purple}08`,
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray5,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${IOS_COLORS.yellow}25`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: IOS_COLORS.orange,
  },
  resultMeta: {
    fontSize: 11,
    color: IOS_COLORS.gray,
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
    backgroundColor: `${IOS_COLORS.yellow}25`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultBadgeTextSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: IOS_COLORS.orange,
  },
  resultMetaSmall: {
    fontSize: 10,
    color: IOS_COLORS.gray,
    fontWeight: '500',
  },
  timerRowCompact: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray5,
  },
  // Keep old styles for backward compatibility
  selectedPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${IOS_COLORS.blue}15`,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 12,
  },
  selectedPillText: {
    color: IOS_COLORS.blue,
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
    backgroundColor: `${IOS_COLORS.blue}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.blue}30`,
    zIndex: 10,
  },
  fleetBadgeWithSelection: {
    top: 36, // Move below the "Viewing" pill
  },
  mockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: IOS_COLORS.orange,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 10,
  },
  mockBadgeText: {
    color: IOS_COLORS.systemBackground,
    fontSize: 9,
    fontWeight: '700',
  },
  // Tufte: Removed nextBadge styles - timeline position indicates next race
  pastBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    maxWidth: '55%',
    alignSelf: 'flex-end',
    backgroundColor: IOS_COLORS.gray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  pastBadgeText: {
    color: IOS_COLORS.systemBackground,
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
    color: IOS_COLORS.label,
    marginBottom: 4,
    lineHeight: 17,
  },
  primaryRaceName: {
    fontSize: 15,
    fontWeight: '800',
    color: IOS_COLORS.blue,
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
    color: IOS_COLORS.gray,
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
    color: IOS_COLORS.purple,
  },
  dateTimeRow: {
    marginTop: 4,
  },
  dateTimeText: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray2,
  },
  countdownSection: {
    backgroundColor: IOS_COLORS.secondaryLabel,
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
    backgroundColor: IOS_COLORS.label,
    padding: 12,
  },
  pastCountdownSection: {
    backgroundColor: IOS_COLORS.gray6,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
  },
  pastRaceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pastRaceDate: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  pastCountdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: IOS_COLORS.gray,
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
    backgroundColor: IOS_COLORS.secondaryLabel,
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: IOS_COLORS.systemBackground,
  },
  positionText: {
    fontSize: 20,
    fontWeight: '800',
    color: IOS_COLORS.label,
  },
  positionTextPodium: {
    color: IOS_COLORS.green,
  },
  statusCode: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.red,
  },
  resultsStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
  },
  resultStat: {
    alignItems: 'center',
  },
  resultStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  resultStatLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: IOS_COLORS.gray5,
  },
  noResultsHint: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray2,
    marginTop: 6,
    fontStyle: 'italic',
  },
  countdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: IOS_COLORS.gray5,
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
    color: IOS_COLORS.systemBackground,
    lineHeight: 32,
    fontVariant: ['tabular-nums'],
  },
  primaryCountdownNumber: {
    fontSize: 32,
    color: IOS_COLORS.systemBackground,
  },
  countdownUnit: {
    fontSize: 8,
    fontWeight: '700',
    color: IOS_COLORS.gray3,
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  countdownSeparator: {
    fontSize: 20,
    fontWeight: '300',
    color: IOS_COLORS.gray,
    opacity: 0.5,
    marginHorizontal: 2,
  },
  primaryCountdownSeparator: {
    fontSize: 24,
    color: IOS_COLORS.gray,
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
    color: IOS_COLORS.gray,
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
    color: IOS_COLORS.gray,
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
    backgroundColor: IOS_COLORS.green,
  },
  liveForecastText: {
    fontSize: 9,
    fontWeight: '600',
    color: IOS_COLORS.green,
    letterSpacing: 0.3,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  environmentalCard: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
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
    color: IOS_COLORS.gray,
    letterSpacing: 0.5,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  detailValueLarge: {
    fontSize: 13,
    color: IOS_COLORS.label,
    fontWeight: '700',
    lineHeight: 16,
  },
  detailValueMessage: {
    fontSize: 11,
    color: IOS_COLORS.gray,
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
    color: IOS_COLORS.label,
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
    backgroundColor: IOS_COLORS.green,
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
    backgroundColor: `${IOS_COLORS.purple}08`,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.purple}20`,
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
    color: IOS_COLORS.purple,
    letterSpacing: 0.5,
  },
  vhfValue: {
    fontSize: 13,
    fontWeight: '700',
    color: IOS_COLORS.purple,
  },
  // Weather sparkline styles
  sparklineRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  sparklineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sparklineLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  // Expanded content zone styles
  expandedContentZone: {
    marginTop: 16,
    flex: 1,
  },
  expandedContentDivider: {
    height: 1,
    backgroundColor: IOS_COLORS.gray5,
    marginBottom: 12,
  },
  expandedScrollView: {
    flex: 1,
  },
  expandedScrollContent: {
    paddingBottom: 20,
    gap: 12,
  },
  expandedPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
    borderStyle: 'dashed',
  },
  expandedPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    marginBottom: 4,
  },
  expandedPlaceholderSubtext: {
    fontSize: 12,
    color: IOS_COLORS.gray2,
  },
});
