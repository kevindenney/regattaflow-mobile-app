/**
 * PreparePhaseContent
 *
 * Content for the Prepare phase (before session day):
 * - Equipment check
 * - Drill plan review
 * - Crew coordination
 * - Weather check
 * - Goal setting
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { IOS_COLORS, TUFTE_TEXT } from '@/components/cards/constants';
import { TufteChecklistSection } from '../tufte/TufteChecklistSection';
import { TufteDrillRow } from '../tufte/TufteDrillRow';
import { unicodeBar } from '@/lib/tufte';
import {
  getPracticeChecklistItems,
  getCategoriesForPracticePhase,
  getPracticeItemsGroupedByCategory,
  PracticeChecklistCompletion,
} from '@/lib/checklists/practiceChecklists';
import type { PracticeSession } from '@/types/practice';

interface PreparePhaseContentProps {
  session: PracticeSession;
  completions: Record<string, PracticeChecklistCompletion>;
  onToggleItem: (itemId: string) => void;
  onItemAction?: (itemId: string) => void;
  carryoverItems?: Array<{
    id: string;
    label: string;
    type: 'incomplete_drill' | 'equipment_issue' | 'learning_goal';
    sourceSessionDate?: string;
  }>;
}

export function PreparePhaseContent({
  session,
  completions,
  onToggleItem,
  onItemAction,
  carryoverItems = [],
}: PreparePhaseContentProps) {
  // Get checklist items for prepare phase
  const categories = getCategoriesForPracticePhase('practice_prepare');
  const itemsByCategory = getPracticeItemsGroupedByCategory('practice_prepare');

  // Calculate drill stats
  const drillCount = session.drills?.length || 0;
  const totalDuration = session.drills?.reduce(
    (sum, d) => sum + (d.plannedDurationMinutes || d.drill?.durationMinutes || 0),
    0
  ) || 0;

  // Crew stats
  const memberCount = session.members?.length || 0;
  const confirmedCount = session.members?.filter(
    (m) => m.rsvpStatus === 'accepted'
  ).length || 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Carryover Items (from previous sessions) */}
      {carryoverItems.length > 0 && (
        <View style={styles.carryoverSection}>
          <View style={styles.carryoverHeader}>
            <Text style={styles.carryoverLabel}>FROM LAST SESSION</Text>
          </View>
          {carryoverItems.map((item) => (
            <View key={item.id} style={styles.carryoverItem}>
              <View style={styles.carryoverDot} />
              <Text style={styles.carryoverText}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Drills Summary */}
      {drillCount > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>DRILL PLAN</Text>
            <Text style={styles.sectionMeta}>
              {drillCount} drills · {totalDuration} min
            </Text>
          </View>
          <View style={styles.drillsList}>
            {session.drills?.slice(0, 4).map((drill, index) => (
              <TufteDrillRow
                key={drill.id}
                drill={drill}
                index={index}
              />
            ))}
            {drillCount > 4 && (
              <Text style={styles.moreText}>
                +{drillCount - 4} more drills
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Crew Summary */}
      {memberCount > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>CREW</Text>
            <View style={styles.crewProgress}>
              <Text style={styles.progressBar}>
                {unicodeBar((confirmedCount / memberCount) * 100, 8)}
              </Text>
              <Text style={styles.crewCount}>
                {confirmedCount}/{memberCount} confirmed
              </Text>
            </View>
          </View>
          <View style={styles.crewList}>
            {session.members?.slice(0, 4).map((member) => (
              <View key={member.id} style={styles.crewRow}>
                <Text style={styles.crewName}>
                  {member.displayName || 'Crew member'}
                </Text>
                <Text
                  style={[
                    styles.crewStatus,
                    member.rsvpStatus === 'accepted' && styles.crewStatusConfirmed,
                    member.rsvpStatus === 'declined' && styles.crewStatusDeclined,
                  ]}
                >
                  {member.rsvpStatus === 'accepted'
                    ? 'Confirmed'
                    : member.rsvpStatus === 'declined'
                    ? 'Declined'
                    : 'Pending'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Checklist Sections */}
      {categories.map((category) => {
        const items = itemsByCategory[category];
        if (!items || items.length === 0) return null;

        return (
          <TufteChecklistSection
            key={category}
            category={category}
            items={items}
            completions={completions}
            onToggleItem={onToggleItem}
            onItemAction={(item) => onItemAction?.(item.id)}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  drillsList: {
    gap: 2,
  },
  moreText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.blue,
    textAlign: 'center',
    paddingVertical: 8,
  },
  crewProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: IOS_COLORS.gray,
  },
  crewCount: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  crewList: {
    gap: 4,
  },
  crewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  crewName: {
    fontSize: 15,
    fontWeight: '400',
    color: TUFTE_TEXT,
  },
  crewStatus: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  crewStatusConfirmed: {
    color: IOS_COLORS.green,
  },
  crewStatusDeclined: {
    color: IOS_COLORS.red,
  },
  carryoverSection: {
    backgroundColor: `${IOS_COLORS.orange}10`,
    borderLeftWidth: 3,
    borderLeftColor: IOS_COLORS.orange,
    borderRadius: 6,
    padding: 12,
    gap: 8,
  },
  carryoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  carryoverLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.orange,
    letterSpacing: 0.5,
  },
  carryoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  carryoverDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: IOS_COLORS.orange,
  },
  carryoverText: {
    fontSize: 14,
    fontWeight: '400',
    color: TUFTE_TEXT,
  },
});

export default PreparePhaseContent;
