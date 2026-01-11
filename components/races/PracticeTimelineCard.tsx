/**
 * PracticeTimelineCard Component
 *
 * A distinct card design for practice sessions in the races timeline.
 * Differentiates from race cards with:
 * - More rounded corners (borderRadius: 20)
 * - Purple accent color theme
 * - Dumbbell icon badge
 * - Slightly different layout emphasizing focus areas
 */

import { IOS_COLORS } from '@/components/cards/constants';
import {
  Dumbbell,
  Clock,
  Target,
  Users,
  Sparkles,
  MapPin,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { PracticeSession, PracticeFocusArea } from '@/types/practice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Practice-specific colors (matching existing practice theme)
const PRACTICE_COLORS = {
  primary: IOS_COLORS.purple,
  primaryBg: `${IOS_COLORS.purple}15`,
  ai: IOS_COLORS.cyan,
  aiBg: `${IOS_COLORS.cyan}15`,
} as const;

// Urgency colors for countdown
function getUrgencyColor(days: number, isPast: boolean) {
  if (isPast) return { accent: IOS_COLORS.gray, bg: IOS_COLORS.gray6 };
  if (days <= 1) return { accent: IOS_COLORS.orange, bg: `${IOS_COLORS.orange}15` };
  if (days <= 3) return { accent: PRACTICE_COLORS.primary, bg: PRACTICE_COLORS.primaryBg };
  return { accent: IOS_COLORS.green, bg: `${IOS_COLORS.green}15` };
}

// Calculate countdown from now to scheduled date/time
function calculateCountdown(date: string, time?: string): {
  days: number;
  hours: number;
  minutes: number;
  isPast: boolean;
} {
  const now = new Date();
  const targetDate = new Date(date);

  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    targetDate.setHours(hours, minutes, 0, 0);
  } else {
    targetDate.setHours(12, 0, 0, 0);
  }

  const diff = targetDate.getTime() - now.getTime();
  const isPast = diff < 0;
  const absDiff = Math.abs(diff);

  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, isPast };
}

export interface PracticeTimelineCardProps {
  session: PracticeSession;
  isSelected?: boolean;
  onPress: () => void;
  cardWidth?: number;
}

/**
 * PracticeTimelineCard
 * A compact card for displaying practice sessions in the timeline
 */
export function PracticeTimelineCard({
  session,
  isSelected = false,
  onPress,
  cardWidth: propCardWidth,
}: PracticeTimelineCardProps) {
  const cardWidth = propCardWidth ?? Math.min(SCREEN_WIDTH - 32, 375);

  // Calculate countdown
  const countdown = useMemo(
    () => calculateCountdown(session.scheduled_date, session.scheduled_start_time),
    [session.scheduled_date, session.scheduled_start_time]
  );
  const isPast = session.status === 'completed' || countdown.isPast;
  const urgencyColors = getUrgencyColor(countdown.days, isPast);

  // Format date nicely
  const formattedDate = useMemo(() => {
    const sessionDate = new Date(session.scheduled_date);
    return sessionDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [session.scheduled_date]);

  // Format time
  const formattedTime = useMemo(() => {
    if (!session.scheduled_start_time) return null;
    const [hours, minutes] = session.scheduled_start_time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, [session.scheduled_start_time]);

  // Format countdown text
  const countdownText = useMemo(() => {
    if (isPast) return 'Completed';
    if (session.status === 'in_progress') return 'In Progress';
    if (countdown.days === 0) {
      if (countdown.hours === 0) return `${countdown.minutes}m`;
      return `${countdown.hours}h ${countdown.minutes}m`;
    }
    if (countdown.days === 1) return 'Tomorrow';
    if (countdown.days <= 7) return `${countdown.days} days`;
    return `${countdown.days}d`;
  }, [countdown, isPast, session.status]);

  // Get focus areas to display (max 3)
  const displayFocusAreas = session.focus_areas?.slice(0, 3) || [];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width: cardWidth },
        isSelected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      {/* Top Row: Badge + Title */}
      <View style={styles.topRow}>
        {/* Practice badge */}
        <View style={styles.practiceBadge}>
          <Dumbbell size={14} color={PRACTICE_COLORS.primary} />
        </View>

        {/* Title & Meta */}
        <View style={styles.titleContainer}>
          <Text style={styles.sessionName} numberOfLines={1}>
            {session.name || 'Practice Session'}
          </Text>
          <View style={styles.metaRow}>
            {session.venue_name && (
              <>
                <MapPin size={12} color={IOS_COLORS.secondaryLabel} />
                <Text style={styles.venueText} numberOfLines={1}>
                  {session.venue_name}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* AI Suggested badge */}
        {session.is_ai_suggested && (
          <View style={styles.aiBadge}>
            <Sparkles size={12} color={PRACTICE_COLORS.ai} />
          </View>
        )}
      </View>

      {/* Countdown Row */}
      <View style={styles.countdownRow}>
        <View style={[styles.countdownBadge, { backgroundColor: urgencyColors.bg }]}>
          <Clock size={14} color={urgencyColors.accent} />
          <Text style={[styles.countdownText, { color: urgencyColors.accent }]}>
            {countdownText}
          </Text>
        </View>

        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          {formattedTime && <Text style={styles.timeText}>{formattedTime}</Text>}
        </View>
      </View>

      {/* Focus Areas */}
      {displayFocusAreas.length > 0 && (
        <View style={styles.focusSection}>
          <View style={styles.focusHeader}>
            <Target size={12} color={IOS_COLORS.secondaryLabel} />
            <Text style={styles.focusLabel}>Focus</Text>
          </View>
          <View style={styles.focusTags}>
            {displayFocusAreas.map((area, index) => (
              <View key={index} style={styles.focusTag}>
                <Text style={styles.focusTagText}>{area.skill_area}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Crew indicator */}
      {session.members && session.members.length > 0 && (
        <View style={styles.crewIndicator}>
          <Users size={12} color={IOS_COLORS.secondaryLabel} />
          <Text style={styles.crewText}>
            {session.members.length} crew member{session.members.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 20, // More rounded than race cards
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
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
  cardSelected: {
    borderColor: PRACTICE_COLORS.primary,
    ...Platform.select({
      web: {
        boxShadow: `0 0 0 2px ${PRACTICE_COLORS.primary}30, 0 2px 8px rgba(0, 0, 0, 0.08)`,
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
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  practiceBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PRACTICE_COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  sessionName: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.4,
    lineHeight: 22,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venueText: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },
  aiBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PRACTICE_COLORS.aiBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Countdown
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateTimeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },

  // Focus Areas
  focusSection: {
    marginBottom: 8,
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  focusLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  focusTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  focusTag: {
    backgroundColor: PRACTICE_COLORS.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  focusTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: PRACTICE_COLORS.primary,
  },

  // Crew
  crewIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  crewText: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },
});

export default PracticeTimelineCard;
