/**
 * TeamRaceCard Component
 *
 * Apple/Tufte-inspired card for team racing format (3v3 or 4v4)
 * Features:
 * - Team roster display with sail numbers
 * - Scoring reference section
 * - Result display for completed races
 * - Teal theme for visual differentiation
 *
 * Note: This is for pre-race preparation only (not used while racing)
 */

import { calculateCountdown } from '@/constants/mockData';
import type { TeamRaceCardProps } from '@/types/teamRacing';
import { TEAM_RACING_COLORS, calculateTeamScore } from '@/types/teamRacing';
import { useRouter } from 'expo-router';
import { MapPin, Radio, Trophy, Users, Wind } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function TeamRaceCard({
  id,
  eventName,
  venue,
  date,
  startTime,
  vhfChannel,
  yourTeam,
  opponentTeam,
  heat,
  scoring,
  wind,
  tide,
  result,
  raceStatus,
  isSelected = false,
  onSelect,
  cardWidth: propCardWidth,
  cardHeight: propCardHeight,
}: TeamRaceCardProps) {
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
  const cardHeight = propCardHeight ?? 560;

  // Accent color based on status
  const getAccentColor = () => {
    if (raceStatus === 'completed') return '#9CA3AF'; // Gray
    if (countdown.days <= 1) return '#EF4444'; // Red - urgent
    if (countdown.days <= 3) return '#F59E0B'; // Amber - soon
    return TEAM_RACING_COLORS.primary; // Teal
  };
  const accentColor = getAccentColor();

  // Countdown colors
  const getCountdownColors = () => {
    if (raceStatus === 'completed') return { bg: '#F3F4F6', text: '#6B7280' };
    if (countdown.days > 7) return { bg: '#F0FDFA', text: '#0F766E' };
    if (countdown.days >= 2) return { bg: '#CCFBF1', text: '#115E59' };
    if (countdown.days >= 1) return { bg: '#99F6E4', text: '#0D9488' };
    return { bg: '#FEE2E2', text: '#DC2626' };
  };
  const countdownColors = getCountdownColors();

  // Format date
  const formattedDate = useMemo(() => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [date]);

  // Scoring info based on team size
  const scoringInfo = useMemo(() => {
    if (scoring.teamSize === 3) {
      return {
        threshold: 10,
        best: '1+2+3=6',
        worst: '4+5+6=15',
      };
    }
    return {
      threshold: 17,
      best: '1+2+3+4=10',
      worst: '5+6+7+8=26',
    };
  }, [scoring.teamSize]);

  // Determine winner for completed races
  const raceWinner = useMemo(() => {
    if (!result) return null;
    if (result.yourTeam.isWinner) return 'you';
    if (result.opponentTeam.isWinner) return 'opponent';
    return 'tie';
  }, [result]);

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
        accessibilityLabel={`Team race: ${yourTeam.name} vs ${opponentTeam.name}`}
      >
        {/* Accent Line */}
        <View style={[styles.accentLine, { backgroundColor: accentColor }]} />

        {/* Content */}
        <View style={styles.content}>
          {/* Header: Badge Row */}
          <View style={styles.badgeRow}>
            <View style={styles.formatBadge}>
              <Users size={12} color={TEAM_RACING_COLORS.badgeText} />
              <Text style={styles.formatBadgeText}>TEAM RACING</Text>
            </View>
            {heat && (
              <Text style={styles.heatText}>
                Heat {heat.heatNumber}
                {heat.totalHeats ? ` of ${heat.totalHeats}` : ''}
                {raceStatus === 'completed' && ' ✓'}
              </Text>
            )}
          </View>

          {/* Teams Display */}
          <View style={styles.teamsContainer}>
            {raceStatus === 'completed' && result ? (
              // Completed Race View
              <>
                <Text style={styles.resultHeader}>FINAL RESULT</Text>
                <View style={styles.teamsRow}>
                  {/* Your Team */}
                  <View style={styles.teamCard}>
                    <View style={[styles.teamColorBar, { backgroundColor: yourTeam.teamColor }]} />
                    <Text style={styles.teamName} numberOfLines={1}>
                      {yourTeam.name}
                    </Text>
                    <View
                      style={[
                        styles.resultBadge,
                        raceWinner === 'you' ? styles.winBadge : styles.lossBadge,
                      ]}
                    >
                      {raceWinner === 'you' && <Trophy size={12} color="#065F46" />}
                      <Text
                        style={[
                          styles.resultText,
                          raceWinner === 'you' ? styles.winText : styles.lossText,
                        ]}
                      >
                        {raceWinner === 'you' ? 'WIN' : 'LOSS'}
                      </Text>
                    </View>
                    <View style={styles.positionsContainer}>
                      <Text style={styles.positionsLabel}>Positions:</Text>
                      <Text style={styles.positionsValue}>
                        {result.yourTeam.positions.join('-')}
                      </Text>
                    </View>
                    <Text style={styles.scoreText}>Score: {result.yourTeam.totalScore}</Text>
                  </View>

                  {/* VS Divider */}
                  <View style={styles.vsDivider}>
                    <Text style={styles.vsText}>VS</Text>
                  </View>

                  {/* Opponent Team */}
                  <View style={styles.teamCard}>
                    <View style={[styles.teamColorBar, { backgroundColor: opponentTeam.teamColor }]} />
                    <Text style={styles.teamName} numberOfLines={1}>
                      {opponentTeam.name}
                    </Text>
                    <View
                      style={[
                        styles.resultBadge,
                        raceWinner === 'opponent' ? styles.winBadge : styles.lossBadge,
                      ]}
                    >
                      {raceWinner === 'opponent' && <Trophy size={12} color="#065F46" />}
                      <Text
                        style={[
                          styles.resultText,
                          raceWinner === 'opponent' ? styles.winText : styles.lossText,
                        ]}
                      >
                        {raceWinner === 'opponent' ? 'WIN' : 'LOSS'}
                      </Text>
                    </View>
                    <View style={styles.positionsContainer}>
                      <Text style={styles.positionsLabel}>Positions:</Text>
                      <Text style={styles.positionsValue}>
                        {result.opponentTeam.positions.join('-')}
                      </Text>
                    </View>
                    <Text style={styles.scoreText}>Score: {result.opponentTeam.totalScore}</Text>
                  </View>
                </View>
              </>
            ) : (
              // Upcoming Race View - Show Rosters
              <>
                <View style={styles.teamsHeaderRow}>
                  <Text style={styles.teamsHeader}>YOUR TEAM</Text>
                  <Text style={styles.teamsHeader}>OPPONENT</Text>
                </View>
                <View style={styles.teamsRow}>
                  {/* Your Team */}
                  <View style={styles.teamCard}>
                    <View style={[styles.teamColorBar, { backgroundColor: yourTeam.teamColor }]} />
                    <Text style={styles.teamName} numberOfLines={1}>
                      {yourTeam.name}
                    </Text>
                    <View style={styles.rosterList}>
                      {yourTeam.members.map((member, index) => (
                        <View key={member.id} style={styles.rosterItem}>
                          <Text style={styles.memberName} numberOfLines={1}>
                            {member.name}
                          </Text>
                          <Text style={styles.sailNumber}>#{member.sailNumber}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* VS Divider */}
                  <View style={styles.vsDivider}>
                    <Text style={styles.vsText}>VS</Text>
                  </View>

                  {/* Opponent Team */}
                  <View style={styles.teamCard}>
                    <View style={[styles.teamColorBar, { backgroundColor: opponentTeam.teamColor }]} />
                    <Text style={styles.teamName} numberOfLines={1}>
                      {opponentTeam.name}
                    </Text>
                    <View style={styles.rosterList}>
                      {opponentTeam.members.map((member, index) => (
                        <View key={member.id} style={styles.rosterItem}>
                          <Text style={styles.memberName} numberOfLines={1}>
                            {member.name}
                          </Text>
                          <Text style={styles.sailNumber}>#{member.sailNumber}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>

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

          {/* Scoring Reference (for upcoming races) */}
          {raceStatus === 'upcoming' && (
            <View style={styles.scoringContainer}>
              <Text style={styles.scoringHeader}>💡 SCORING: Sum ≤ {scoringInfo.threshold} = WIN</Text>
              <View style={styles.scoringRow}>
                <Text style={styles.scoringText}>Best: {scoringInfo.best}</Text>
                <Text style={styles.scoringText}>Worst: {scoringInfo.worst}</Text>
              </View>
            </View>
          )}

          {/* Conditions */}
          <View style={styles.conditionsRow}>
            {wind && (
              <View style={styles.conditionChip}>
                <Wind size={14} color="#0D9488" />
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

          {/* Countdown (for upcoming) */}
          {raceStatus === 'upcoming' && (
            <View style={[styles.countdown, { backgroundColor: countdownColors.bg }]}>
              <Text style={[styles.countdownValue, { color: countdownColors.text }]}>
                {countdown.days > 0
                  ? `${countdown.days}d ${countdown.hours}h`
                  : `${countdown.hours}h ${countdown.minutes}m`}
              </Text>
              <Text style={[styles.countdownLabel, { color: countdownColors.text }]}>until start</Text>
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
          '0 1px 3px rgba(13, 148, 136, 0.06), 0 6px 16px rgba(13, 148, 136, 0.1), 0 12px 32px rgba(0, 0, 0, 0.06)',
      },
      default: {
        borderWidth: 0.5,
        borderColor: 'rgba(13, 148, 136, 0.1)',
        shadowColor: TEAM_RACING_COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
  cardSelected: {
    backgroundColor: '#F0FDFA',
    ...Platform.select({
      web: {
        boxShadow:
          '0 2px 4px rgba(13, 148, 136, 0.1), 0 8px 20px rgba(13, 148, 136, 0.2), 0 16px 40px rgba(0, 0, 0, 0.08)',
      },
      default: {
        shadowColor: TEAM_RACING_COLORS.primary,
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
    backgroundColor: TEAM_RACING_COLORS.badgeBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  formatBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: TEAM_RACING_COLORS.badgeText,
    letterSpacing: 0.5,
  },
  heatText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  teamsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  teamsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  teamsHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    flex: 1,
  },
  resultHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  teamsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  teamCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  teamColorBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  rosterList: {
    width: '100%',
    gap: 4,
  },
  rosterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  memberName: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
  sailNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0D9488',
  },
  vsDivider: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  vsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  winBadge: {
    backgroundColor: '#D1FAE5',
  },
  lossBadge: {
    backgroundColor: '#FEE2E2',
  },
  resultText: {
    fontSize: 11,
    fontWeight: '700',
  },
  winText: {
    color: '#065F46',
  },
  lossText: {
    color: '#DC2626',
  },
  positionsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  positionsLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  positionsValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
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
  scoringContainer: {
    backgroundColor: '#F0FDFA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  scoringHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  scoringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoringText: {
    fontSize: 12,
    color: '#115E59',
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
});

export default TeamRaceCard;
