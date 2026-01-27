/**
 * ReadOnlyStrategyBrief Component
 *
 * Displays sailor's race intention and strategy notes in read-only mode.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StrategyBriefIntention, StrategyNotes } from '@/types/raceIntentions';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

interface ReadOnlyStrategyBriefProps {
  strategyBrief?: StrategyBriefIntention;
  strategyNotes?: StrategyNotes;
  prepNotes?: string;
}

/**
 * Format strategy notes section titles
 */
function formatSectionTitle(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ReadOnlyStrategyBrief({
  strategyBrief,
  strategyNotes,
  prepNotes,
}: ReadOnlyStrategyBriefProps) {
  const hasRaceIntention = Boolean(strategyBrief?.raceIntention?.trim());
  const hasStrategyNotes = strategyNotes && Object.keys(strategyNotes).length > 0;
  const hasPrepNotes = Boolean(prepNotes?.trim());

  if (!hasRaceIntention && !hasStrategyNotes && !hasPrepNotes) {
    return (
      <Text style={styles.emptyText}>No strategy notes shared</Text>
    );
  }

  return (
    <View style={styles.container}>
      {/* Primary Race Intention */}
      {hasRaceIntention && (
        <View style={styles.intentionSection}>
          <Text style={styles.intentionLabel}>Race Focus</Text>
          <Text style={styles.intentionText}>{strategyBrief!.raceIntention}</Text>
          {strategyBrief?.intentionUpdatedAt && (
            <Text style={styles.timestamp}>
              Set {new Date(strategyBrief.intentionUpdatedAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      )}

      {/* Strategy Notes by Section */}
      {hasStrategyNotes && (
        <View style={styles.notesContainer}>
          {Object.entries(strategyNotes!).map(([key, value]) => {
            if (!value?.trim()) return null;
            return (
              <View key={key} style={styles.noteSection}>
                <Text style={styles.noteSectionTitle}>{formatSectionTitle(key)}</Text>
                <Text style={styles.noteText}>{value}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Legacy Prep Notes */}
      {hasPrepNotes && !hasStrategyNotes && (
        <View style={styles.prepNotesSection}>
          <Text style={styles.noteText}>{prepNotes}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  intentionSection: {
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: IOS_COLORS.systemBlue,
  },
  intentionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  intentionText: {
    fontSize: 16,
    fontWeight: '500',
    color: IOS_COLORS.label,
    lineHeight: 24,
  },
  timestamp: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 8,
  },
  notesContainer: {
    gap: 12,
  },
  noteSection: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.systemGray5,
  },
  noteSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 6,
  },
  noteText: {
    fontSize: 15,
    color: IOS_COLORS.label,
    lineHeight: 22,
  },
  prepNotesSection: {
    padding: 4,
  },
  emptyText: {
    fontSize: 14,
    color: IOS_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },
});

export default ReadOnlyStrategyBrief;
