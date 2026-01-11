/**
 * ReviewPhaseNudges Component
 *
 * Shows personalized nudges from past races relevant to the review phase.
 * Displays before the detailed review wizard to remind sailors of past learnings.
 *
 * Categories surfaced:
 * - performance_issue: Past struggles to reflect on
 * - successful_strategy: Tactics that worked
 * - venue_learning: Venue-specific insights
 * - decision_outcome: Results of morning decisions
 * - equipment_issue: Equipment learnings
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { History, Lightbulb, MapPin, Target, Wrench } from 'lucide-react-native';
import { usePersonalizedNudges } from '@/hooks/useAdaptiveLearning';
import { NudgeList } from '@/components/checklist-tools/NudgeBanner';
import type { PersonalizedNudge, LearnableEventType } from '@/types/adaptiveLearning';

// iOS System Colors
const IOS_COLORS = {
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C434A',
  purple: '#AF52DE',
  green: '#34C759',
  orange: '#FF9500',
  gray: '#8E8E93',
  background: '#F2F2F7',
};

// Review-relevant categories
const REVIEW_CATEGORIES: LearnableEventType[] = [
  'performance_issue',
  'successful_strategy',
  'venue_learning',
  'decision_outcome',
  'equipment_issue',
  'weather_adaptation',
];

interface ReviewPhaseNudgesProps {
  raceEventId: string;
  venueId?: string;
  conditions?: {
    windSpeed?: number;
    windDirection?: number;
  };
  maxNudges?: number;
}

/**
 * Group nudges by category for organized display
 */
function groupNudgesByCategory(nudges: PersonalizedNudge[]) {
  const groups: Record<string, PersonalizedNudge[]> = {
    reflections: [], // performance_issue, decision_outcome
    successes: [], // successful_strategy
    venue: [], // venue_learning
    equipment: [], // equipment_issue, weather_adaptation
  };

  nudges.forEach((nudge) => {
    if (nudge.category === 'performance_issue' || nudge.category === 'decision_outcome') {
      groups.reflections.push(nudge);
    } else if (nudge.category === 'successful_strategy') {
      groups.successes.push(nudge);
    } else if (nudge.category === 'venue_learning') {
      groups.venue.push(nudge);
    } else {
      groups.equipment.push(nudge);
    }
  });

  return groups;
}

export function ReviewPhaseNudges({
  raceEventId,
  venueId,
  conditions,
  maxNudges = 6,
}: ReviewPhaseNudgesProps) {
  // Fetch personalized nudges
  const {
    allNudges,
    isLoading,
    recordDelivery,
  } = usePersonalizedNudges(raceEventId, {
    venueId,
    forecast: conditions?.windSpeed && conditions?.windDirection
      ? { windSpeed: conditions.windSpeed, windDirection: conditions.windDirection }
      : undefined,
  });

  // Filter to review-relevant categories
  const reviewNudges = useMemo(() => {
    return allNudges
      .filter((n) => REVIEW_CATEGORIES.includes(n.category as LearnableEventType))
      .slice(0, maxNudges);
  }, [allNudges, maxNudges]);

  // Group nudges for display
  const groupedNudges = useMemo(() => {
    return groupNudgesByCategory(reviewNudges);
  }, [reviewNudges]);

  // Check if any nudges are available
  const hasNudges = reviewNudges.length > 0;
  const hasReflections = groupedNudges.reflections.length > 0;
  const hasSuccesses = groupedNudges.successes.length > 0;
  const hasVenue = groupedNudges.venue.length > 0;
  const hasEquipment = groupedNudges.equipment.length > 0;

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading insights from your past races...</Text>
      </View>
    );
  }

  // Empty state
  if (!hasNudges) {
    return (
      <View style={styles.emptyContainer}>
        <Lightbulb size={24} color={IOS_COLORS.gray} />
        <Text style={styles.emptyTitle}>No Past Learnings Yet</Text>
        <Text style={styles.emptyText}>
          As you complete more race reviews, personalized insights will appear here
          to help you reflect on patterns and improvements.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Reflections section - things to think about */}
      {hasReflections && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={16} color={IOS_COLORS.orange} />
            <Text style={styles.sectionTitle}>Things to Reflect On</Text>
          </View>
          <NudgeList
            nudges={groupedNudges.reflections}
            channel="briefing"
            onRecordDelivery={recordDelivery}
            maxVisible={2}
            showMatchReasons
          />
        </View>
      )}

      {/* Successes section - what worked */}
      {hasSuccesses && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lightbulb size={16} color={IOS_COLORS.green} />
            <Text style={styles.sectionTitle}>What Worked Well</Text>
          </View>
          <NudgeList
            nudges={groupedNudges.successes}
            channel="briefing"
            onRecordDelivery={recordDelivery}
            maxVisible={2}
            showMatchReasons
          />
        </View>
      )}

      {/* Venue insights */}
      {hasVenue && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={16} color={IOS_COLORS.purple} />
            <Text style={styles.sectionTitle}>Venue Insights</Text>
          </View>
          <NudgeList
            nudges={groupedNudges.venue}
            channel="briefing"
            onRecordDelivery={recordDelivery}
            maxVisible={2}
            showMatchReasons
          />
        </View>
      )}

      {/* Equipment & conditions */}
      {hasEquipment && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Wrench size={16} color={IOS_COLORS.gray} />
            <Text style={styles.sectionTitle}>Equipment & Conditions</Text>
          </View>
          <NudgeList
            nudges={groupedNudges.equipment}
            channel="briefing"
            onRecordDelivery={recordDelivery}
            maxVisible={2}
            showMatchReasons
          />
        </View>
      )}

      {/* Summary count */}
      <View style={styles.summaryContainer}>
        <History size={14} color={IOS_COLORS.tertiaryLabel} />
        <Text style={styles.summaryText}>
          {reviewNudges.length} insight{reviewNudges.length !== 1 ? 's' : ''} from your past races
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: IOS_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: IOS_COLORS.background,
    borderRadius: 12,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptyText: {
    fontSize: 14,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    marginTop: 8,
  },
  summaryText: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },
});

export default ReviewPhaseNudges;
