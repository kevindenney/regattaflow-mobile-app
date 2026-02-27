/**
 * CompetencyLogModule
 *
 * Review-phase module for nursing clinical shift event cards.
 * Shows competencies the student practiced during the shift,
 * grouped by category, and provides a quick-log CTA to record
 * a new attempt via the SelfAssessmentFlow.
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { IOS_COLORS } from '@/components/cards/constants';
import { useAuth } from '@/providers/AuthProvider';
import { useInterest } from '@/providers/InterestProvider';
import { useCompetencyProgress } from '@/hooks/useCompetencyProgress';
import { CompetencyProgressRingCompact } from '@/components/competency/CompetencyProgressRing';
import {
  COMPETENCY_STATUS_CONFIG,
  type CompetencyCategory,
  type CompetencyWithProgress,
} from '@/types/competency';
import type { ContentModuleProps } from '@/types/raceCardContent';
import type { CardRaceData } from '@/components/cards/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CompetencyLogModuleProps extends ContentModuleProps<CardRaceData> {}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive a status key from a CompetencyWithProgress item. */
function getStatus(c: CompetencyWithProgress) {
  return c.progress?.status ?? 'not_started';
}

/** Group competencies by their category, preserving insertion order. */
function groupByCategory(
  competencies: CompetencyWithProgress[],
): { category: CompetencyCategory; items: CompetencyWithProgress[] }[] {
  const map = new Map<CompetencyCategory, CompetencyWithProgress[]>();
  for (const c of competencies) {
    const existing = map.get(c.category);
    if (existing) {
      existing.push(c);
    } else {
      map.set(c.category, [c]);
    }
  }
  return Array.from(map.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}

/** Count competencies that are 'validated' or 'competent'. */
function countCompleted(competencies: CompetencyWithProgress[]): number {
  return competencies.filter((c) => {
    const s = getStatus(c);
    return s === 'validated' || s === 'competent';
  }).length;
}

/** Count competencies that are actively being practiced. */
function countPracticing(competencies: CompetencyWithProgress[]): number {
  return competencies.filter((c) => {
    const s = getStatus(c);
    return s === 'learning' || s === 'practicing' || s === 'checkoff_ready';
  }).length;
}

// ---------------------------------------------------------------------------
// Category color map (soft tints for category circle backgrounds)
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<CompetencyCategory, string> = {
  'Assessment Skills': '#0369A1',
  'Medication Administration': '#7C3AED',
  'Clinical Procedures': '#B45309',
  'Patient Care': '#15803D',
  'Critical Thinking': '#DC2626',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function CompetencyLogModule({
  race,
  phase,
  raceType,
  isCollapsed,
}: CompetencyLogModuleProps) {
  const { user } = useAuth();
  const { currentInterest } = useInterest();
  const { competencies, summary, isLoading } = useCompetencyProgress();

  const accentColor = currentInterest?.accent_color ?? '#0097A7';

  // Derived data
  const total = competencies.length;
  const completed = useMemo(() => countCompleted(competencies), [competencies]);
  const practicing = useMemo(() => countPracticing(competencies), [competencies]);
  const groups = useMemo(() => groupByCategory(competencies), [competencies]);

  if (isCollapsed) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading competencies...</Text>
      </View>
    );
  }

  // Empty state
  if (total === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="school-outline" size={28} color={IOS_COLORS.gray3} />
          <Text style={styles.emptyTitle}>No Competencies</Text>
          <Text style={styles.emptySubtitle}>
            Competencies will appear here once configured for your program.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ---- Summary Bar ---- */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryTextContainer}>
          <Text style={styles.summaryCount}>
            {completed} of {total}
          </Text>
          <Text style={styles.summaryLabel}> competencies</Text>
        </View>
        <CompetencyProgressRingCompact
          total={total}
          completed={completed}
          practicing={practicing}
          accentColor={accentColor}
        />
      </View>

      {/* ---- Competency List (grouped by category) ---- */}
      {groups.map(({ category, items }) => (
        <View key={category} style={styles.categoryGroup}>
          <Text style={styles.categoryHeader}>{category}</Text>
          {items.map((competency) => {
            const status = getStatus(competency);
            const statusConfig = COMPETENCY_STATUS_CONFIG[status];
            const circleColor =
              CATEGORY_COLORS[competency.category] ?? accentColor;

            return (
              <Pressable
                key={competency.id}
                style={({ pressed }) => [
                  styles.competencyRow,
                  pressed && styles.competencyRowPressed,
                ]}
                onPress={() =>
                  router.push(
                    `/competency-detail?competencyId=${competency.id}`,
                  )
                }
              >
                {/* Competency number circle */}
                <View
                  style={[
                    styles.numberCircle,
                    { backgroundColor: circleColor },
                  ]}
                >
                  <Text style={styles.numberText}>
                    {competency.competency_number}
                  </Text>
                </View>

                {/* Title (single line, truncated) */}
                <Text style={styles.competencyTitle} numberOfLines={1}>
                  {competency.title}
                </Text>

                {/* Status badge */}
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusConfig.bg },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: statusConfig.color },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusLabel,
                      { color: statusConfig.color },
                    ]}
                  >
                    {statusConfig.label}
                  </Text>
                </View>

                {/* Chevron */}
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={IOS_COLORS.gray3}
                />
              </Pressable>
            );
          })}
        </View>
      ))}

      {/* ---- Quick Log CTA ---- */}
      <Pressable
        style={({ pressed }) => [
          styles.logButton,
          { backgroundColor: accentColor },
          pressed && styles.logButtonPressed,
        ]}
        onPress={() =>
          router.push(
            `/self-assessment?eventId=${race.id}`,
          )
        }
      >
        <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
        <Text style={styles.logButtonText}>Log Attempt</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 16,
  },

  // Loading
  loadingText: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    paddingVertical: 24,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    maxWidth: 240,
  },

  // Summary bar
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  summaryCount: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    fontSize: 14,
    color: IOS_COLORS.gray,
  },

  // Category groups
  categoryGroup: {
    gap: 6,
  },
  categoryHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },

  // Competency row
  competencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  competencyRowPressed: {
    opacity: 0.7,
  },

  // Number circle
  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Title
  competencyTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },

  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Log button
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logButtonPressed: {
    opacity: 0.85,
  },
  logButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CompetencyLogModule;
