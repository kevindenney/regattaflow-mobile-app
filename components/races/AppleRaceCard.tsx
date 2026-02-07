/**
 * AppleRaceCard Component
 *
 * Apple Human Interface Guidelines (HIG) compliant race card:
 * - iOS system colors from shared constants
 * - Single status indicator (no redundancy)
 * - Clear visual hierarchy with race name/result as primary
 * - Compact inline conditions
 * - State-aware adaptive layout
 * - Semantic colors for status
 */

import { CardMenu, type CardMenuItem } from '@/components/shared/CardMenu';
import { TinySparkline } from '@/components/shared/charts';
import { calculateCountdown } from '@/constants/mockData';
import { IOS_COLORS } from '@/components/cards/constants';
import { MapPin, Trophy, Wind, Waves, Radio, MessageCircle, Heart } from 'lucide-react-native';
import React, { useMemo, useState, useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, Dimensions, ActivityIndicator } from 'react-native';
import { RaceTypeBadge, type RaceType } from './RaceTypeSelector';
import { TruncatedText } from '@/components/ui/TruncatedText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface AppleRaceCardProps {
  id: string;
  name: string;
  venue: string;
  clubName?: string;
  date: string;
  startTime: string;
  wind?: {
    direction: string;
    speedMin: number;
    speedMax: number;
  } | null;
  tide?: {
    state: 'flooding' | 'ebbing' | 'slack' | 'rising' | 'falling' | 'high' | 'low';
    height: number;
    direction?: string;
  } | null;
  vhfChannel?: string | null;
  raceStatus?: 'past' | 'next' | 'future';
  results?: {
    position: number;
    fleetSize: number;
    points?: number;
    status?: 'finished' | 'dnf' | 'dns' | 'dsq' | 'ocs' | 'ret';
  };
  isLoading?: boolean;
  onPress?: () => void;
  cardWidth?: number;
  cardHeight?: number;
  /** Callback when edit is requested */
  onEdit?: () => void;
  /** Callback when delete is requested */
  onDelete?: () => void;
  /** Callback when duplicate is requested */
  onDuplicate?: () => void;
  /** Whether to show management actions (only for race owner) */
  canManage?: boolean;
  /** Race type: fleet, distance, match, or team */
  raceType?: RaceType;
  /** Wind forecast data for sparkline (6-12 hourly values) */
  windForecast?: number[];
  /** Tide forecast data for sparkline (6-12 hourly values) */
  tideForecast?: number[];
  /** Index of "now" in forecast arrays (0 = first point) */
  forecastNowIndex?: number;
  /** Number of community discussions linked to this race's catalog entry */
  discussionCount?: number;
  /** Callback when discussion badge is pressed */
  onDiscussionPress?: () => void;
  /** Whether the current user has liked this race */
  isLiked?: boolean;
  /** Number of likes on this race */
  likeCount?: number;
  /** Callback when like button is pressed */
  onLikePress?: () => void;
  /** Number of comments on this race */
  commentCount?: number;
  /** Callback when comment button is pressed */
  onCommentPress?: () => void;
}

// Status configuration with iOS semantic colors
const STATUS_CONFIG = {
  past: {
    color: IOS_COLORS.green,
    bgColor: `${IOS_COLORS.green}15`,
    label: 'Done',
  },
  next: {
    color: IOS_COLORS.blue,
    bgColor: `${IOS_COLORS.blue}15`,
    label: 'Next',
  },
  future: {
    color: IOS_COLORS.gray,
    bgColor: IOS_COLORS.gray6,
    label: 'Upcoming',
  },
};

// Urgency colors for countdown (iOS semantic colors)
function getUrgencyColor(days: number, isPast: boolean) {
  if (isPast) return { accent: IOS_COLORS.green, bg: `${IOS_COLORS.green}15` };
  if (days <= 1) return { accent: IOS_COLORS.red, bg: `${IOS_COLORS.red}15` }; // Urgent
  if (days <= 3) return { accent: IOS_COLORS.orange, bg: `${IOS_COLORS.orange}15` }; // Soon
  if (days <= 7) return { accent: IOS_COLORS.yellow, bg: `${IOS_COLORS.yellow}20` }; // This week
  return { accent: IOS_COLORS.green, bg: `${IOS_COLORS.green}15` }; // Good
}

export function AppleRaceCard({
  id,
  name,
  venue,
  clubName,
  date,
  startTime,
  wind,
  tide,
  vhfChannel,
  raceStatus = 'future',
  results,
  isLoading = false,
  onPress,
  cardWidth: propCardWidth,
  cardHeight: propCardHeight,
  onEdit,
  onDelete,
  onDuplicate,
  canManage = false,
  raceType = 'fleet',
  windForecast,
  tideForecast,
  forecastNowIndex = 0,
  discussionCount,
  onDiscussionPress,
  isLiked,
  likeCount,
  onLikePress,
  commentCount,
  onCommentPress,
}: AppleRaceCardProps) {
  const cardWidth = propCardWidth ?? Math.min(SCREEN_WIDTH - 32, 375);

  // Calculate countdown
  const countdown = useMemo(() => calculateCountdown(date, startTime), [date, startTime]);
  const isPast = raceStatus === 'past';
  const urgencyColors = getUrgencyColor(countdown.days, isPast);
  const statusConfig = STATUS_CONFIG[raceStatus];

  // Format date nicely
  const formattedDate = useMemo(() => {
    const raceDate = new Date(date);
    return raceDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [date]);

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

  // Format position ordinal
  const positionOrdinal = useMemo(() => {
    if (!results?.position) return '';
    const pos = results.position;
    if (pos === 1) return '1st';
    if (pos === 2) return '2nd';
    if (pos === 3) return '3rd';
    return `${pos}th`;
  }, [results?.position]);

  // Build menu items for card management
  const menuItems = useMemo((): CardMenuItem[] => {
    const items: CardMenuItem[] = [];
    if (onEdit) {
      items.push({ label: 'Edit Race', icon: 'create-outline', onPress: onEdit });
    }
    if (onDuplicate) {
      items.push({ label: 'Duplicate', icon: 'copy-outline', onPress: onDuplicate });
    }
    if (onDelete) {
      items.push({ label: 'Delete Race', icon: 'trash-outline', onPress: onDelete, variant: 'destructive' });
    }
    return items;
  }, [onEdit, onDuplicate, onDelete]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { width: cardWidth, ...(propCardHeight ? { height: propCardHeight } : {}) },
        pressed && styles.cardPressed,
      ]}
      onPress={onPress ?? undefined}
      disabled={!onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${name} race at ${venue}`}
    >
      {/* Top Row: Name + Status Pill + Menu */}
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <TruncatedText
            text={name}
            numberOfLines={2}
            style={styles.raceName}
          />
          <View style={styles.metaRow}>
            {clubName && (
              <>
                <Text style={styles.clubName} numberOfLines={1}>{clubName}</Text>
                <Text style={styles.metaDot}>·</Text>
              </>
            )}
            <MapPin size={12} color={IOS_COLORS.gray} strokeWidth={2} />
            <Text style={styles.venueText} numberOfLines={1}>{venue}</Text>
          </View>
        </View>

        <View style={styles.topRowActions}>
          {/* Race Type Badge */}
          <RaceTypeBadge type={raceType} size="small" />

          {/* Status Pill */}
          <View style={[styles.statusPill, { backgroundColor: statusConfig.bgColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>

          {/* Management Menu */}
          {canManage && menuItems.length > 0 && (
            <CardMenu items={menuItems} iconSize={18} iconColor={IOS_COLORS.gray} />
          )}
        </View>
      </View>

      {/* Result Banner (for completed races) OR Countdown (for upcoming) */}
      {isPast && results ? (
        <View style={styles.resultBanner}>
          <View style={styles.resultMain}>
            {results.position <= 3 && (
              <Trophy
                size={20}
                color={results.position === 1 ? '#FFD700' : results.position === 2 ? '#C0C0C0' : '#CD7F32'}
                fill={results.position === 1 ? '#FFD700' : results.position === 2 ? '#C0C0C0' : '#CD7F32'}
              />
            )}
            <Text style={styles.resultPosition}>{positionOrdinal}</Text>
            <Text style={styles.resultFleet}>of {results.fleetSize}</Text>
          </View>
          {results.points !== undefined && (
            <Text style={styles.resultPoints}>{results.points} pts</Text>
          )}
        </View>
      ) : !isPast && (
        <View style={styles.countdownRow}>
          <View style={[styles.countdownBadge, { backgroundColor: urgencyColors.bg }]}>
            {/* Tufte compact format: "2d 5h" or "2h 47m" */}
            <Text style={[styles.countdownCompact, { color: urgencyColors.accent }]}>
              {countdown.days > 0
                ? `${countdown.days}d ${countdown.hours}h`
                : `${countdown.hours}h ${countdown.minutes}m`}
            </Text>
          </View>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.dateText}>{formattedDate}</Text>
            <Text style={styles.timeText}>{startTime}</Text>
          </View>
        </View>
      )}

      {/* Date for past races */}
      {isPast && (
        <Text style={styles.pastDateText}>{formattedDate} · {startTime}</Text>
      )}

      {/* Conditions Row - Inline */}
      <View style={styles.conditionsRow}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={IOS_COLORS.gray} />
            <Text style={styles.loadingText}>Loading conditions...</Text>
          </View>
        ) : (
          <>
            {/* Wind + sparkline */}
            <View style={styles.conditionItem}>
              <Wind size={14} color={IOS_COLORS.blue} strokeWidth={2.5} />
              {wind ? (
                <>
                  <Text style={styles.conditionValue}>
                    {wind.direction} {wind.speedMin}-{wind.speedMax}kt
                  </Text>
                  {windForecast && windForecast.length >= 2 && (
                    <TinySparkline
                      data={windForecast}
                      width={40}
                      height={14}
                      color={IOS_COLORS.blue}
                      nowIndex={forecastNowIndex}
                      showNowDot
                      variant="line"
                    />
                  )}
                </>
              ) : (
                <Text style={styles.conditionEmpty}>--</Text>
              )}
            </View>

            {/* Tide + sparkline */}
            <View style={styles.conditionItem}>
              <Waves size={14} color={IOS_COLORS.teal} strokeWidth={2.5} />
              {tide ? (
                <>
                  <Text style={styles.conditionValue}>
                    {tideLabel} {tide.height}m
                  </Text>
                  {tideForecast && tideForecast.length >= 2 && (
                    <TinySparkline
                      data={tideForecast}
                      width={40}
                      height={14}
                      color={IOS_COLORS.teal}
                      nowIndex={forecastNowIndex}
                      showNowDot
                      highlightPeak
                      variant="area"
                    />
                  )}
                </>
              ) : (
                <Text style={styles.conditionEmpty}>--</Text>
              )}
            </View>

            {/* VHF (optional) */}
            {vhfChannel && (
              <View style={styles.conditionItem}>
                <Radio size={14} color={IOS_COLORS.purple} strokeWidth={2.5} />
                <Text style={styles.conditionValue}>Ch {vhfChannel}</Text>
              </View>
            )}

            {/* Discussion count badge */}
            {discussionCount != null && discussionCount > 0 && (
              <Pressable
                style={styles.conditionItem}
                onPress={(e) => {
                  e.stopPropagation?.();
                  onDiscussionPress?.();
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <MessageCircle size={14} color={IOS_COLORS.blue} strokeWidth={2.5} />
                <Text style={[styles.conditionValue, { color: IOS_COLORS.blue }]}>
                  {discussionCount}
                </Text>
              </Pressable>
            )}

            {/* Like button */}
            {onLikePress && (
              <Pressable
                style={styles.conditionItem}
                onPress={(e) => {
                  e.stopPropagation?.();
                  onLikePress();
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Heart
                  size={14}
                  color={isLiked ? IOS_COLORS.red : IOS_COLORS.gray}
                  fill={isLiked ? IOS_COLORS.red : 'transparent'}
                  strokeWidth={2.5}
                />
                {(likeCount ?? 0) > 0 && (
                  <Text style={[styles.conditionValue, isLiked && { color: IOS_COLORS.red }]}>
                    {likeCount}
                  </Text>
                )}
              </Pressable>
            )}

            {/* Comment count */}
            {onCommentPress && (
              <Pressable
                style={styles.conditionItem}
                onPress={(e) => {
                  e.stopPropagation?.();
                  onCommentPress();
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <MessageCircle size={14} color={IOS_COLORS.gray} strokeWidth={2.5} />
                {(commentCount ?? 0) > 0 && (
                  <Text style={styles.conditionValue}>{commentCount}</Text>
                )}
              </Pressable>
            )}
          </>
        )}
      </View>
    </Pressable>
  );
}

// =============================================================================
// STYLES (Apple HIG Compliant)
// =============================================================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    ...Platform.select({
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
      },
      ios: {
        shadowOpacity: 0.04,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // Top Row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  topRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  raceName: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.4,
    lineHeight: 22,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  clubName: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    opacity: 0.8,
  },
  metaDot: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    opacity: 0.5,
  },
  venueText: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    opacity: 0.8,
    marginLeft: 2,
  },

  // Status Pill
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },

  // Result Banner (completed races)
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  resultMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultPosition: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: -0.5,
  },
  resultFleet: {
    fontSize: 15,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    opacity: 0.8,
  },
  resultPoints: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },

  // Countdown (upcoming races)
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  countdownBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 60,
  },
  countdownNumber: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  // Tufte compact countdown: "2d 5h" or "2h 47m"
  countdownCompact: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  countdownUnit: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'lowercase',
    marginTop: -2,
  },
  dateTimeContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.2,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    opacity: 0.8,
    marginTop: 2,
  },

  // Past date
  pastDateText: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    opacity: 0.8,
    marginBottom: 12,
  },

  // Conditions Row
  conditionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray4,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conditionValue: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.label,
    letterSpacing: -0.1,
  },
  conditionEmpty: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    opacity: 0.8,
  },
});

export default AppleRaceCard;
