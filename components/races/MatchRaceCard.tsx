/**
 * MatchRaceCard Component
 *
 * Apple/Tufte-inspired card for match racing (1v1) format
 * Features:
 * - VS display with opponent info
 * - Series score tracking
 * - Opponent intel section
 * - Orange theme for visual differentiation
 */

import { calculateCountdown } from '@/constants/mockData';
import type { MatchRaceCardProps } from '@/types/matchRacing';
import { MATCH_RACING_COLORS } from '@/types/matchRacing';
import { useRouter } from 'expo-router';
import { AlertTriangle, MapPin, Radio, Target, Trophy, Wind } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function MatchRaceCard({
  id,
  eventName,
  venue,
  date,
  startTime,
  vhfChannel,
  opponent,
  bracket,
  seriesScore,
  umpireStatus,
  yourBoatColor = '#3B82F6',
  yourSkipperName = 'You',
  wind,
  tide,
  result,
  raceStatus,
  isSelected = false,
  onSelect,
  cardWidth: propCardWidth,
  cardHeight: propCardHeight,
}: MatchRaceCardProps) {
  const router = useRouter();

  // Calculate countdown
  const countdown = useMemo(() => {
    return calculateCountdown(date, startTime);
  }, [date, startTime]);

  const handlePress = () => {
    if (onSelect) {
      onSelect();
    } else {
      router.push(`/(tabs)/race/scrollable/${id}` as any);
    }
  };

  const cardWidth = propCardWidth ?? Math.min(SCREEN_WIDTH - 32, 375);
  const cardHeight = propCardHeight ?? 520;

  // Accent color based on status
  const getAccentColor = () => {
    if (raceStatus === 'completed') return '#9CA3AF'; // Gray
    if (countdown.days <= 1) return '#EF4444'; // Red - urgent
    if (countdown.days <= 3) return '#F59E0B'; // Amber - soon
    return MATCH_RACING_COLORS.primary; // Orange
  };
  const accentColor = getAccentColor();

  // Countdown colors
  const getCountdownColors = () => {
    if (raceStatus === 'completed') return { bg: '#F3F4F6', text: '#6B7280' };
    if (countdown.days > 7) return { bg: '#FFF7ED', text: '#C2410C' };
    if (countdown.days >= 2) return { bg: '#FEF3C7', text: '#92400E' };
    if (countdown.days >= 1) return { bg: '#FFEDD5', text: '#C2410C' };
    return { bg: '#FEE2E2', text: '#DC2626' };
  };
  const countdownColors = getCountdownColors();

  // Format series score display
  const seriesDisplay = useMemo(() => {
    if (!seriesScore) return null;
    const format =
      seriesScore.format === 'best_of_3'
        ? 'Bo3'
        : seriesScore.format === 'best_of_5'
          ? 'Bo5'
          : seriesScore.format === 'best_of_7'
            ? 'Bo7'
            : '';
    return `${seriesScore.yourWins}-${seriesScore.opponentWins}${format ? ` (${format})` : ''}`;
  }, [seriesScore]);

  // Format date
  const formattedDate = useMemo(() => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [date]);

  return (
    <View style={{ width: cardWidth, flexShrink: 0, flexGrow: 0 }}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          styles.cardApple,
          {
            width: '100%',
            height: cardHeight,
            opacity: pressed ? 0.98 : 1,
            transform: pressed ? [{ scale: 0.98 }] : isSelected ? [{ scale: 1.02 }] : [],
          },
          isSelected && styles.cardSelected,
        ]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Match race against ${opponent.name}`}
      >
        {/* Accent Line */}
        <View style={[styles.accentLine, { backgroundColor: accentColor }]} />

        {/* Content */}
        <View style={styles.content}>
          {/* Header: Badge Row */}
          <View style={styles.badgeRow}>
            <View style={styles.formatBadge}>
              <Target size={12} color={MATCH_RACING_COLORS.badgeText} />
              <Text style={styles.formatBadgeText}>MATCH RACING</Text>
            </View>
            {bracket && (
              <Text style={styles.roundText}>
                Round {bracket.roundNumber}
                {bracket.totalRounds ? ` of ${bracket.totalRounds}` : ''}
              </Text>
            )}
          </View>

          {/* VS Display */}
          <View style={styles.vsContainer}>
            <Text style={styles.vsLabel}>VS</Text>
            <View style={styles.vsRow}>
              {/* Your Side */}
              <View style={styles.vsCard}>
                <View style={[styles.boatColorDot, { backgroundColor: yourBoatColor }]} />
                <Text style={styles.vsName} numberOfLines={1}>
                  {yourSkipperName}
                </Text>
                {result && (
                  <View
                    style={[styles.resultBadge, result.winner === 'you' ? styles.winBadge : styles.lossBadge]}
                  >
                    <Text style={[styles.resultText, result.winner === 'you' ? styles.winText : styles.lossText]}>
                      {result.winner === 'you' ? 'WIN' : 'LOSS'}
                    </Text>
                  </View>
                )}
              </View>

              {/* VS Divider */}
              <View style={styles.vsDivider}>
                {result?.winner === 'you' ? (
                  <Trophy size={20} color="#10B981" />
                ) : result?.winner === 'opponent' ? (
                  <Trophy size={20} color="#EF4444" />
                ) : (
                  <Text style={styles.vsIcon}>⚔️</Text>
                )}
              </View>

              {/* Opponent Side */}
              <View style={styles.vsCard}>
                <View style={[styles.boatColorDot, { backgroundColor: opponent.boatColor || '#EF4444' }]} />
                <Text style={styles.vsName} numberOfLines={1}>
                  {opponent.skipperName || opponent.name}
                </Text>
                {result && (
                  <View
                    style={[styles.resultBadge, result.winner === 'opponent' ? styles.winBadge : styles.lossBadge]}
                  >
                    <Text
                      style={[styles.resultText, result.winner === 'opponent' ? styles.winText : styles.lossText]}
                    >
                      {result.winner === 'opponent' ? 'WIN' : 'LOSS'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Series Score */}
            {seriesDisplay && (
              <View style={styles.seriesRow}>
                <Text style={styles.seriesLabel}>Series:</Text>
                <Text style={styles.seriesScore}>{seriesDisplay}</Text>
              </View>
            )}
          </View>

          {/* Opponent Intel */}
          {opponent.seasonRecord && raceStatus !== 'completed' && (
            <View style={styles.intelContainer}>
              <Text style={styles.intelHeader}>📊 OPPONENT INTEL</Text>
              <View style={styles.intelRow}>
                <Text style={styles.intelText}>
                  Season: {opponent.seasonRecord.wins}W-{opponent.seasonRecord.losses}L (
                  {opponent.seasonRecord.winRate}%)
                </Text>
                {opponent.headToHeadRecord && (
                  <Text style={styles.intelText}>
                    H2H: You {opponent.headToHeadRecord.yourWins}-{opponent.headToHeadRecord.theirWins}
                  </Text>
                )}
              </View>
              {opponent.tacticalStyle && (
                <Text style={styles.intelStyle}>Style: {opponent.tacticalStyle}</Text>
              )}
            </View>
          )}

          {/* Venue & Time */}
          <View style={styles.venueRow}>
            <MapPin size={14} color="#64748B" />
            <Text style={styles.venueText}>
              {venue} · {formattedDate}
            </Text>
          </View>
          <Text style={styles.timeText}>
            Start: {startTime}
            {vhfChannel ? ` · VHF ${vhfChannel}` : ''}
          </Text>

          {/* Conditions */}
          <View style={styles.conditionsRow}>
            {wind && (
              <View style={styles.conditionChip}>
                <Wind size={14} color="#3B82F6" />
                <Text style={styles.conditionText}>
                  {wind.speedMin}-{wind.speedMax}kt {wind.direction}
                </Text>
              </View>
            )}
            {tide && (
              <View style={styles.conditionChip}>
                <Text style={styles.conditionText}>
                  🌊 {tide.state.charAt(0).toUpperCase() + tide.state.slice(1)}
                </Text>
              </View>
            )}
            {vhfChannel && (
              <View style={styles.conditionChip}>
                <Radio size={14} color="#7C3AED" />
                <Text style={styles.conditionText}>Ch {vhfChannel}</Text>
              </View>
            )}
          </View>

          {/* Umpire Status */}
          {umpireStatus?.onWaterUmpires && raceStatus !== 'completed' && (
            <View style={styles.umpireRow}>
              <AlertTriangle size={14} color="#F59E0B" />
              <Text style={styles.umpireText}>Umpire: On-water calls active</Text>
            </View>
          )}

          {/* Countdown (for upcoming) */}
          {raceStatus === 'upcoming' && (
            <View style={[styles.countdown, { backgroundColor: countdownColors.bg }]}>
              <Text style={[styles.countdownValue, { color: countdownColors.text }]}>
                {countdown.days > 0 ? `${countdown.days}d ${countdown.hours}h` : `${countdown.hours}h ${countdown.minutes}m`}
              </Text>
              <Text style={[styles.countdownLabel, { color: countdownColors.text }]}>until start</Text>
            </View>
          )}

          {/* Winning Margin (for completed) */}
          {result?.marginSeconds && raceStatus === 'completed' && (
            <View style={styles.marginRow}>
              <Text style={styles.marginLabel}>Margin:</Text>
              <Text style={styles.marginValue}>
                {Math.floor(result.marginSeconds / 60)}:{(result.marginSeconds % 60).toString().padStart(2, '0')} at
                finish
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'visible',
    borderWidth: 0,
    position: 'relative',
  },
  cardApple: {
    ...Platform.select({
      web: {
        boxShadow:
          '0 1px 3px rgba(234, 88, 12, 0.06), 0 6px 16px rgba(234, 88, 12, 0.1), 0 12px 32px rgba(0, 0, 0, 0.06)',
      },
      default: {
        borderWidth: 0.5,
        borderColor: 'rgba(234, 88, 12, 0.1)',
        shadowColor: MATCH_RACING_COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
  cardSelected: {
    backgroundColor: '#FFF7ED',
    ...Platform.select({
      web: {
        boxShadow:
          '0 2px 4px rgba(234, 88, 12, 0.1), 0 8px 20px rgba(234, 88, 12, 0.2), 0 16px 40px rgba(0, 0, 0, 0.08)',
      },
      default: {
        shadowColor: MATCH_RACING_COLORS.primary,
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 14,
      },
    }),
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    zIndex: 10,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  formatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: MATCH_RACING_COLORS.badgeBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  formatBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: MATCH_RACING_COLORS.badgeText,
    letterSpacing: 0.5,
  },
  roundText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  vsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  vsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 12,
  },
  vsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vsCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  boatColorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  vsName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  vsDivider: {
    paddingHorizontal: 12,
  },
  vsIcon: {
    fontSize: 20,
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  winBadge: {
    backgroundColor: '#D1FAE5',
  },
  lossBadge: {
    backgroundColor: '#FEE2E2',
  },
  resultText: {
    fontSize: 10,
    fontWeight: '700',
  },
  winText: {
    color: '#065F46',
  },
  lossText: {
    color: '#DC2626',
  },
  seriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  seriesLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  seriesScore: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  intelContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  intelHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  intelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  intelText: {
    fontSize: 12,
    color: '#78350F',
  },
  intelStyle: {
    fontSize: 12,
    color: '#78350F',
    fontStyle: 'italic',
    marginTop: 4,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  venueText: {
    fontSize: 13,
    color: '#64748B',
  },
  timeText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 12,
  },
  conditionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  conditionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  umpireRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  umpireText: {
    fontSize: 12,
    color: '#92400E',
  },
  countdown: {
    position: 'absolute',
    top: 24,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  countdownValue: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  countdownLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  marginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  marginLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  marginValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
});

export default MatchRaceCard;
