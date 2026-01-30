/**
 * AppleStyleRaceCard Component
 *
 * A refined, Apple HIG-compliant race card with:
 * - Clear visual hierarchy (title → countdown → meta → conditions)
 * - Full title display (no truncation)
 * - Unified badge styling
 * - Elegant countdown as hero element
 * - iOS system colors and typography
 * - Proper depth with multi-layer shadows
 */

import { IOS_COLORS } from '@/components/cards/constants';
import { CardMenu, type CardMenuItem } from '@/components/shared/CardMenu';
import { calculateCountdown } from '@/constants/mockData';
import { Calendar, Clock, MapPin, Play, Radio, Trophy, Waves, Wind } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { RaceTypeBadge, type RaceType } from './RaceTypeSelector';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================

export interface AppleStyleRaceCardProps {
  id: string;
  name: string;
  venue: string;
  date: string;
  startTime: string;
  raceType?: RaceType;
  raceStatus?: 'past' | 'next' | 'future';
  /** Wind conditions */
  wind?: {
    direction: string;
    speedMin: number;
    speedMax: number;
  } | null;
  /** Tide conditions */
  tide?: {
    state: 'flooding' | 'ebbing' | 'slack' | 'rising' | 'falling' | 'high' | 'low';
    height: number;
    direction?: string;
  } | null;
  /** VHF radio channel */
  vhfChannel?: string | null;
  results?: {
    position: number;
    fleetSize: number;
    points?: number;
  };
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onHide?: () => void;
  cardWidth?: number;
  cardHeight?: number;
  /** Show loading overlay when race is being deleted */
  isDeleting?: boolean;
  /** Whether the race is sample data */
  isSample?: boolean;
}

// =============================================================================
// STATUS CONFIG - iOS System Colors
// =============================================================================

const STATUS_CONFIG = {
  past: {
    label: 'Completed',
    color: IOS_COLORS.green,
    bgColor: `${IOS_COLORS.green}1F`,
  },
  next: {
    label: 'Today',
    color: IOS_COLORS.orange,
    bgColor: `${IOS_COLORS.orange}1F`,
  },
  future: {
    label: 'Upcoming',
    color: IOS_COLORS.gray,
    bgColor: `${IOS_COLORS.gray}1F`,
  },
};

// Countdown urgency colors
function getCountdownStyle(days: number, hours: number, isPast: boolean) {
  if (isPast) {
    return { bg: `${IOS_COLORS.green}1A`, text: IOS_COLORS.green, accent: IOS_COLORS.green };
  }
  if (days === 0 && hours < 2) {
    return { bg: `${IOS_COLORS.red}1A`, text: IOS_COLORS.red, accent: IOS_COLORS.red }; // Red - imminent
  }
  if (days === 0) {
    return { bg: `${IOS_COLORS.orange}1A`, text: IOS_COLORS.orange, accent: IOS_COLORS.orange }; // Orange - today
  }
  if (days <= 2) {
    return { bg: `${IOS_COLORS.yellow}1A`, text: IOS_COLORS.yellow, accent: IOS_COLORS.orange }; // Yellow - soon
  }
  return { bg: `${IOS_COLORS.blue}14`, text: IOS_COLORS.blue, accent: IOS_COLORS.blue }; // Blue - default
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AppleStyleRaceCard({
  id,
  name,
  venue,
  date,
  startTime,
  raceType = 'fleet',
  raceStatus = 'future',
  wind,
  tide,
  vhfChannel,
  results,
  onPress,
  onEdit,
  onDelete,
  onHide,
  cardWidth: propCardWidth,
  cardHeight: propCardHeight,
  isDeleting = false,
  isSample = false,
}: AppleStyleRaceCardProps) {
  const cardWidth = propCardWidth ?? Math.min(SCREEN_WIDTH - 32, 375);
  const cardHeight = propCardHeight ?? 520;

  // Calculate live countdown
  const [countdown, setCountdown] = useState(() => calculateCountdown(date, startTime));

  useEffect(() => {
    if (raceStatus === 'past') return;

    const interval = setInterval(() => {
      setCountdown(calculateCountdown(date, startTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [date, startTime, raceStatus]);

  const isPast = raceStatus === 'past';
  const statusConfig = STATUS_CONFIG[raceStatus];
  const countdownStyle = getCountdownStyle(countdown.days, countdown.hours, isPast);

  // Sample badge config
  const sampleBadgeConfig = {
    label: 'SAMPLE',
    color: '#9333EA', // Purple
    bgColor: '#F3E8FF', // Light Purple
  };

  // Format date
  const formattedDate = useMemo(() => {
    const raceDate = new Date(date);
    return raceDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [date]);

  // Format countdown display
  const countdownDisplay = useMemo(() => {
    if (isPast) return null;

    const { days, hours, minutes, seconds } = countdown;

    if (days > 0) {
      return {
        primary: days.toString(),
        unit: days === 1 ? 'day' : 'days',
        secondary: `${hours}h ${minutes}m`,
      };
    }

    // Race day - show hours:minutes:seconds
    return {
      primary: `${hours.toString().padStart(2, '0')}`,
      separator: ':',
      minutes: `${minutes.toString().padStart(2, '0')}`,
      separator2: ':',
      seconds: `${seconds.toString().padStart(2, '0')}`,
      unit: null,
      secondary: 'until start',
    };
  }, [countdown, isPast]);

  // Build menu items
  const menuItems = useMemo((): CardMenuItem[] => {
    const items: CardMenuItem[] = [];
    if (onEdit) {
      items.push({ label: 'Edit Race', icon: 'create-outline', onPress: onEdit });
    }
    if (onHide) {
      items.push({ label: 'Hide from Timeline', icon: 'eye-off-outline', onPress: onHide });
    }
    if (onDelete) {
      items.push({ label: 'Delete Race', icon: 'trash-outline', onPress: onDelete, variant: 'destructive' });
    }
    return items;
  }, [onEdit, onHide, onDelete]);

  // Position ordinal for results
  const positionOrdinal = useMemo(() => {
    if (!results?.position) return '';
    const pos = results.position;
    if (pos === 1) return '1st';
    if (pos === 2) return '2nd';
    if (pos === 3) return '3rd';
    return `${pos}th`;
  }, [results?.position]);

  // Format tide state for display
  const tideLabel = useMemo(() => {
    if (!tide) return null;
    const stateMap: Record<string, string> = {
      flooding: 'Rising',
      ebbing: 'Falling',
      rising: 'Rising',
      falling: 'Falling',
      slack: 'Slack',
      high: 'High',
      low: 'Low',
    };
    return stateMap[tide.state] || tide.state;
  }, [tide]);

  // Check if we have any conditions to show
  const hasConditions = wind || tide || vhfChannel;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { width: cardWidth, height: cardHeight },
        pressed && styles.cardPressed,
        isPast && styles.cardPast,
      ]}
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${name} race at ${venue}`}
    >
      {/* ─────────────────────────────────────────────────────────────────────
          TOP ROW: Race Type Badge + Status Pill + Menu
      ───────────────────────────────────────────────────────────────────── */}
      <View style={styles.topRow}>
        <RaceTypeBadge type={raceType} size="small" />

        <View style={styles.topRowRight}>
          <View style={[styles.statusPill, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>

          {isSample && (
            <View style={[styles.statusPill, { backgroundColor: sampleBadgeConfig.bgColor }]}>
              <Text style={[styles.statusLabel, { color: sampleBadgeConfig.color }]}>
                {sampleBadgeConfig.label}
              </Text>
            </View>
          )}

          {menuItems.length > 0 && (
            <CardMenu items={menuItems} iconSize={20} iconColor={IOS_COLORS.gray} />
          )}
        </View>
      </View>

      {/* ─────────────────────────────────────────────────────────────────────
          TITLE SECTION: Full race name (no truncation)
      ───────────────────────────────────────────────────────────────────── */}
      <View style={styles.titleSection}>
        <Text style={styles.raceName} numberOfLines={3}>
          {name}
        </Text>
        <View style={styles.locationRow}>
          <MapPin size={14} color={IOS_COLORS.gray} strokeWidth={2} />
          <Text style={styles.locationText} numberOfLines={1}>
            {venue}
          </Text>
        </View>
      </View>

      {/* ─────────────────────────────────────────────────────────────────────
          COUNTDOWN / RESULTS HERO SECTION
      ───────────────────────────────────────────────────────────────────── */}
      {isPast && results ? (
        // Results display for completed races
        <View style={styles.resultsSection}>
          <View style={styles.resultsRow}>
            {results.position <= 3 && (
              <Trophy
                size={28}
                color={results.position === 1 ? '#FFD700' : results.position === 2 ? '#C0C0C0' : '#CD7F32'}
                fill={results.position === 1 ? '#FFD700' : results.position === 2 ? '#C0C0C0' : '#CD7F32'}
              />
            )}
            <Text style={styles.resultPosition}>{positionOrdinal}</Text>
            <Text style={styles.resultFleet}>of {results.fleetSize}</Text>
          </View>
          {results.points !== undefined && (
            <Text style={styles.resultPoints}>{results.points} points</Text>
          )}
        </View>
      ) : countdownDisplay && (
        // Countdown timer for upcoming races
        <View style={[styles.countdownSection, { backgroundColor: countdownStyle.bg }]}>
          <View style={styles.countdownRow}>
            {countdownDisplay.unit ? (
              // Days display
              <>
                <Text style={[styles.countdownPrimary, { color: countdownStyle.text }]}>
                  {countdownDisplay.primary}
                </Text>
                <Text style={[styles.countdownUnit, { color: countdownStyle.text }]}>
                  {countdownDisplay.unit}
                </Text>
              </>
            ) : (
              // Time display (HH:MM:SS)
              <View style={styles.timeDisplay}>
                <Text style={[styles.countdownTime, { color: countdownStyle.text }]}>
                  {countdownDisplay.primary}
                </Text>
                <Text style={[styles.countdownSeparator, { color: countdownStyle.text }]}>h</Text>
                <Text style={[styles.countdownTime, { color: countdownStyle.text }]}>
                  {countdownDisplay.minutes}
                </Text>
                <Text style={[styles.countdownSeparator, { color: countdownStyle.text }]}>m</Text>
                <Text style={[styles.countdownTime, { color: countdownStyle.text }]}>
                  {countdownDisplay.seconds}
                </Text>
                <Text style={[styles.countdownSeparator, { color: countdownStyle.text }]}>s</Text>
              </View>
            )}
          </View>
          <Text style={styles.countdownHint}>
            {countdownDisplay.secondary || 'Tap when ready to start'}
          </Text>

          {/* Play button indicator */}
          <View style={[styles.playButton, { backgroundColor: countdownStyle.accent }]}>
            <Play size={20} color={IOS_COLORS.systemBackground} fill={IOS_COLORS.systemBackground} />
          </View>
        </View>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          DATE & TIME ROW
      ───────────────────────────────────────────────────────────────────── */}
      <View style={styles.dateTimeRow}>
        <View style={styles.dateTimeItem}>
          <Calendar size={16} color={IOS_COLORS.gray} strokeWidth={2} />
          <Text style={styles.dateTimeText}>{formattedDate}</Text>
        </View>
        <View style={styles.dateTimeSeparator} />
        <View style={styles.dateTimeItem}>
          <Clock size={16} color={IOS_COLORS.gray} strokeWidth={2} />
          <Text style={styles.dateTimeText}>{startTime}</Text>
        </View>
      </View>

      {/* ─────────────────────────────────────────────────────────────────────
          CONDITIONS PREVIEW ROW
      ───────────────────────────────────────────────────────────────────── */}
      {hasConditions && (
        <View style={styles.conditionsRow}>
          {/* Wind */}
          {wind && (
            <View style={styles.conditionItem}>
              <Wind size={14} color={IOS_COLORS.blue} strokeWidth={2.5} />
              <Text style={styles.conditionValue}>
                {wind.speedMin}-{wind.speedMax} kts {wind.direction}
              </Text>
            </View>
          )}

          {/* Tide */}
          {tide && (
            <View style={styles.conditionItem}>
              <Waves size={14} color={IOS_COLORS.teal} strokeWidth={2.5} />
              <Text style={styles.conditionValue}>
                {tideLabel} {tide.height.toFixed(1)}m
              </Text>
            </View>
          )}

          {/* VHF Channel */}
          {vhfChannel && (
            <View style={styles.conditionItem}>
              <Radio size={14} color={IOS_COLORS.purple} strokeWidth={2.5} />
              <Text style={styles.conditionValue}>Ch {vhfChannel}</Text>
            </View>
          )}
        </View>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          DELETING OVERLAY
      ───────────────────────────────────────────────────────────────────── */}
      {isDeleting && (
        <View style={styles.deletingOverlay} pointerEvents="box-only">
          <ActivityIndicator size="large" color={IOS_COLORS.blue} />
          <Text style={styles.deletingText}>Deleting...</Text>
        </View>
      )}

    </Pressable>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.08)',
        cursor: 'pointer',
        userSelect: 'none' as any,
        transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
      },
      ios: {
        shadowColor: IOS_COLORS.label,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    ...Platform.select({
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.06)',
      },
      ios: {
        shadowOpacity: 0.06,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardPast: {
    backgroundColor: IOS_COLORS.gray6,
  },

  // Top Row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  topRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // Title Section
  titleSection: {
    marginBottom: 20,
  },
  raceName: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: -0.5,
    lineHeight: 28,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    letterSpacing: -0.2,
  },

  // Countdown Section
  countdownSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    position: 'relative',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  countdownPrimary: {
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 60,
  },
  countdownUnit: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.5,
    marginLeft: 4,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  countdownTime: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  countdownSeparator: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 2,
    opacity: 0.7,
  },
  countdownHint: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    marginTop: 8,
  },
  playButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      },
      ios: {
        shadowColor: IOS_COLORS.label,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // Results Section
  resultsSection: {
    backgroundColor: `${IOS_COLORS.gray}14`,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultPosition: {
    fontSize: 32,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: -1,
  },
  resultFleet: {
    fontSize: 17,
    fontWeight: '400',
    color: IOS_COLORS.gray,
  },
  resultPoints: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    marginTop: 8,
  },

  // Date/Time Row
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTimeText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: -0.2,
  },
  dateTimeSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: IOS_COLORS.gray4,
  },

  // Conditions Row
  conditionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: `${IOS_COLORS.gray}0F`,
    borderRadius: 12,
    marginTop: 12,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conditionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: -0.2,
  },

  // Deleting Overlay
  deletingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  deletingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    letterSpacing: -0.2,
  },

});

export default AppleStyleRaceCard;
