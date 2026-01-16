import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { CoachProfile } from '@/services/CoachingService';

interface CoachWithScore extends CoachProfile {
  display_name?: string | null;
  compatibilityScore?: number;
  matchReasoning?: string;
}

interface TufteCoachRowProps {
  coach: CoachWithScore;
  onPress: () => void;
  showMatchInfo?: boolean;
}

/**
 * TufteCoachRow - A dense, data-focused coach row following Tufte principles
 *
 * Design principles applied:
 * - High data-ink ratio (no decorative elements)
 * - Typography-driven hierarchy
 * - Inline metrics separated by interpuncts
 * - Optional match reasoning on third line
 */
export function TufteCoachRow({ coach, onPress, showMatchInfo = false }: TufteCoachRowProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const displayName = coach.display_name || coach.based_at || 'Coach';
  const hourlyRate = coach.hourly_rate ? `$${(coach.hourly_rate / 100).toFixed(0)}/hr` : null;
  const rating = coach.average_rating?.toFixed(1) || '0.0';
  const sessions = coach.total_sessions ?? 0;

  // Format specialties for display
  const specialties = coach.specialties?.slice(0, 2).map(s =>
    s.replace(/_/g, ' ')
  ).join(', ') || '';

  // Match percentage for AI recommendations
  const matchPercent = coach.compatibilityScore
    ? Math.round(coach.compatibilityScore * 100)
    : null;

  return (
    <TouchableOpacity
      style={[
        styles.row,
        isTablet && styles.rowTablet,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      {...(Platform.OS === 'web' && {
        onMouseEnter: (e: any) => {
          e.currentTarget.style.backgroundColor = '#f9f9f9';
        },
        onMouseLeave: (e: any) => {
          e.currentTarget.style.backgroundColor = '#ffffff';
        },
      })}
    >
      {/* Line 1: Name and Rate */}
      <View style={styles.line1}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        <View style={styles.rateContainer}>
          {matchPercent && showMatchInfo && (
            <Text style={styles.matchPercent}>{matchPercent}%</Text>
          )}
          {hourlyRate && (
            <Text style={styles.rate}>{hourlyRate}</Text>
          )}
        </View>
      </View>

      {/* Line 2: Metrics (interpunct-separated) */}
      <View style={styles.line2}>
        <Text style={styles.metrics} numberOfLines={1}>
          {specialties && <Text style={styles.specialty}>{specialties}</Text>}
          {specialties && <Text style={styles.interpunct}>  ·  </Text>}
          <Text style={styles.ratingText}>{rating}</Text>
          <Text style={styles.star}>★</Text>
          <Text style={styles.interpunct}>  ·  </Text>
          <Text style={styles.sessionsText}>{sessions} sessions</Text>
        </Text>
      </View>

      {/* Line 3: Match reasoning (if AI mode) or Bio snippet */}
      {showMatchInfo && coach.matchReasoning ? (
        <Text style={styles.reasoning} numberOfLines={1}>
          {coach.matchReasoning}
        </Text>
      ) : coach.bio ? (
        <Text style={styles.bio} numberOfLines={1}>
          {coach.bio}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

// Tufte-aligned design tokens
const colors = {
  text: '#1a1a1a',
  textMuted: '#666666',
  textLight: '#999999',
  border: '#e5e5e5',
  background: '#ffffff',
  accent: '#2563eb',
  star: '#d4a418',
  match: '#059669',
};

const styles = StyleSheet.create({
  row: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'background-color 0.15s ease',
    }),
  } as any,
  rowTablet: {
    paddingVertical: 14,
  },

  // Line 1: Name + Rate
  line1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  matchPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.match,
  },
  rate: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },

  // Line 2: Metrics
  line2: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  metrics: {
    fontSize: 13,
    color: colors.textMuted,
  },
  specialty: {
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  interpunct: {
    color: colors.textLight,
  },
  ratingText: {
    color: colors.text,
    fontWeight: '500',
  },
  star: {
    color: colors.star,
    fontSize: 12,
  },
  sessionsText: {
    color: colors.textMuted,
  },

  // Line 3: Bio or Match reasoning
  bio: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 18,
  },
  reasoning: {
    fontSize: 13,
    color: colors.match,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});

export default TufteCoachRow;
