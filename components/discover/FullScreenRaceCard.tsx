/**
 * FullScreenRaceCard Component
 *
 * TikTok-style full-screen race card for the vertical swipe feed.
 * Shows a preview of the sailor's race journey based on feed data.
 * Click "View Full Journey" to see detailed content.
 *
 * Layout:
 * ┌─────────────────────────────────────┐
 * │ [Avatar] Sarah Chen  •  J/105       │ ← Sailor header
 * │─────────────────────────────────────│
 * │ Round the Island Race               │ ← Race title
 * │ Sat, Jan 25, 2026                   │
 * │─────────────────────────────────────│
 * │                                     │
 * │  ✓ Strategy Notes                   │ ← Content indicators
 * │  ✓ Rig Settings                     │
 * │  ✓ Sail Selection                   │
 * │  ✓ Post-Race Analysis               │
 * │                                     │
 * │  Tap "View Full Journey" to see     │
 * │  detailed race preparation          │
 * │                                     │
 * │─────────────────────────────────────│
 * │ [View Full Journey]  [Use Template] │ ← Action buttons
 * └─────────────────────────────────────┘
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Calendar,
  MapPin,
  Target,
  Wrench,
  CheckCircle,
  Lightbulb,
  FileText,
  Clock,
  Trophy,
} from 'lucide-react-native';
import { RaceCardSailorHeader } from './RaceCardSailorHeader';
import { RaceCardActionBar } from './RaceCardActionBar';
import { TUFTE_BACKGROUND } from '@/components/cards';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

export interface FullScreenRaceCardData {
  id: string;
  name: string;
  startDate: string;
  venue?: string;
  userId: string;
  userName: string;
  avatarEmoji?: string;
  avatarColor?: string;
  boatClass?: string;
  hasPrepNotes: boolean;
  hasTuning: boolean;
  hasPostRaceNotes: boolean;
  hasLessons: boolean;
  isPast: boolean;
  daysUntil: number;
  isFollowing: boolean;
}

interface FullScreenRaceCardProps {
  race: FullScreenRaceCardData;
  cardHeight: number;
  onViewJourney: (sailorId: string, raceId: string) => void;
  onUseTemplate: (sailorId: string, raceId: string) => void;
  onToggleFollow: (userId: string) => void;
}

/**
 * Format date with relative display
 */
function formatRaceDate(dateStr: string, daysUntil: number): string {
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  if (daysUntil === -1) return 'Yesterday';
  if (daysUntil < -1 && daysUntil > -7) return `${Math.abs(daysUntil)} days ago`;
  if (daysUntil > 1 && daysUntil < 7) return `In ${daysUntil} days`;

  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Content indicator row
 */
function ContentIndicator({
  icon: Icon,
  color,
  label,
  available,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  available: boolean;
}) {
  if (!available) return null;

  return (
    <View style={styles.indicatorRow}>
      <View style={[styles.indicatorIcon, { backgroundColor: `${color}15` }]}>
        <Icon size={18} color={color} />
      </View>
      <Text style={styles.indicatorLabel}>{label}</Text>
      <View style={[styles.checkCircle, { backgroundColor: `${IOS_COLORS.systemGreen}15` }]}>
        <CheckCircle size={14} color={IOS_COLORS.systemGreen} />
      </View>
    </View>
  );
}

export function FullScreenRaceCard({
  race,
  cardHeight,
  onViewJourney,
  onUseTemplate,
  onToggleFollow,
}: FullScreenRaceCardProps) {
  // Format the race date
  const formattedDate = useMemo(
    () => formatRaceDate(race.startDate, race.daysUntil),
    [race.startDate, race.daysUntil]
  );

  // Callbacks
  const handleViewJourney = useCallback(() => {
    onViewJourney(race.userId, race.id);
  }, [onViewJourney, race.userId, race.id]);

  const handleUseTemplate = useCallback(() => {
    onUseTemplate(race.userId, race.id);
  }, [onUseTemplate, race.userId, race.id]);

  const handleToggleFollow = useCallback(() => {
    onToggleFollow(race.userId);
  }, [onToggleFollow, race.userId]);

  // Determine if there's template content
  const hasTemplateContent = race.hasPrepNotes || race.hasTuning;

  // Count available content
  const contentCount = [
    race.hasPrepNotes,
    race.hasTuning,
    race.hasPostRaceNotes,
    race.hasLessons,
  ].filter(Boolean).length;

  // Status message
  const statusMessage = useMemo(() => {
    if (race.isPast) {
      if (race.hasPostRaceNotes || race.hasLessons) {
        return 'Race completed with analysis';
      }
      return 'Race completed';
    }
    if (race.daysUntil === 0) {
      return 'Racing today!';
    }
    if (race.daysUntil === 1) {
      return 'Racing tomorrow';
    }
    if (race.daysUntil > 1 && race.daysUntil <= 7) {
      return `Racing in ${race.daysUntil} days`;
    }
    return 'Upcoming race';
  }, [race.isPast, race.daysUntil, race.hasPostRaceNotes, race.hasLessons]);

  return (
    <View style={[styles.container, { height: cardHeight }]}>
      {/* Sailor Header */}
      <RaceCardSailorHeader
        userName={race.userName}
        avatarEmoji={race.avatarEmoji}
        avatarColor={race.avatarColor}
        boatClass={race.boatClass}
        isFollowing={race.isFollowing}
        onToggleFollow={handleToggleFollow}
      />

      {/* Race Info Header */}
      <View style={styles.raceHeader}>
        <Text style={styles.raceName} numberOfLines={2}>
          {race.name}
        </Text>
        <View style={styles.raceMetaRow}>
          <View style={styles.metaItem}>
            <Calendar size={14} color={IOS_COLORS.secondaryLabel} />
            <Text style={styles.metaText}>{formattedDate}</Text>
          </View>
          {race.venue && (
            <View style={styles.metaItem}>
              <MapPin size={14} color={IOS_COLORS.secondaryLabel} />
              <Text style={styles.metaText} numberOfLines={1}>
                {race.venue}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {/* Status Badge */}
        <View style={[
          styles.statusBadge,
          race.isPast ? styles.statusBadgePast : styles.statusBadgeUpcoming,
        ]}>
          {race.isPast ? (
            <Trophy size={16} color={IOS_COLORS.systemGreen} />
          ) : (
            <Clock size={16} color={IOS_COLORS.systemBlue} />
          )}
          <Text style={[
            styles.statusText,
            race.isPast ? styles.statusTextPast : styles.statusTextUpcoming,
          ]}>
            {statusMessage}
          </Text>
        </View>

        {/* Content Indicators */}
        {contentCount > 0 ? (
          <View style={styles.indicatorsCard}>
            <Text style={styles.indicatorsTitle}>
              Race Preparation Shared
            </Text>
            <View style={styles.indicatorsList}>
              <ContentIndicator
                icon={Target}
                color={IOS_COLORS.systemBlue}
                label="Strategy Notes"
                available={race.hasPrepNotes}
              />
              <ContentIndicator
                icon={Wrench}
                color={IOS_COLORS.systemOrange}
                label="Rig Settings & Tuning"
                available={race.hasTuning}
              />
              <ContentIndicator
                icon={FileText}
                color={IOS_COLORS.systemGreen}
                label="Post-Race Analysis"
                available={race.hasPostRaceNotes}
              />
              <ContentIndicator
                icon={Lightbulb}
                color={IOS_COLORS.systemYellow}
                label="Key Learnings"
                available={race.hasLessons}
              />
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <FileText size={32} color={IOS_COLORS.systemGray3} />
            <Text style={styles.emptyTitle}>No details shared yet</Text>
            <Text style={styles.emptySubtitle}>
              This sailor hasn't shared their race preparation for this event
            </Text>
          </View>
        )}

        {/* Call to Action */}
        {contentCount > 0 && (
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>
              See {race.userName.split(' ')[0]}'s full race journey
            </Text>
            <Text style={styles.ctaSubtitle}>
              View detailed strategy notes, rig settings, and lessons learned
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Bar */}
      <RaceCardActionBar
        onViewJourney={handleViewJourney}
        onUseTemplate={handleUseTemplate}
        hasTemplateContent={hasTemplateContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },
  raceHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    backgroundColor: '#FFFFFF',
  },
  raceName: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  raceMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
    gap: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusBadgeUpcoming: {
    backgroundColor: `${IOS_COLORS.systemBlue}15`,
  },
  statusBadgePast: {
    backgroundColor: `${IOS_COLORS.systemGreen}15`,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusTextUpcoming: {
    color: IOS_COLORS.systemBlue,
  },
  statusTextPast: {
    color: IOS_COLORS.systemGreen,
  },
  indicatorsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  indicatorsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 14,
  },
  indicatorsList: {
    gap: 12,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  indicatorIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorLabel: {
    flex: 1,
    fontSize: 15,
    color: IOS_COLORS.label,
    fontWeight: '500',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaCard: {
    backgroundColor: `${IOS_COLORS.systemBlue}08`,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.systemBlue}20`,
  },
  ctaTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
});

export default FullScreenRaceCard;
