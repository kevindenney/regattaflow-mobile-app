/**
 * TufteStrategyScreen - Full screen Tufte-style race strategy view
 *
 * A complete replacement for the traditional race strategy screen,
 * following Edward Tufte's principles of information design:
 *
 * - All 14 strategy sections visible at once (no accordions)
 * - Typography-driven hierarchy (no icons or heavy decoration)
 * - Warm paper background for comfortable reading
 * - Sparklines for performance trends
 * - Marginalia-style inline editing for user plans
 *
 * "Above all else show the data" - Edward Tufte
 */

import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { TUFTE_BACKGROUND } from '@/components/cards/constants';
import {
  STRATEGY_SECTIONS,
  getSectionsForPhase,
  type StrategyPhase,
  type StrategySectionId,
  type RaceStrategyNotes,
  type StrategySectionNote,
} from '@/types/raceStrategy';
import { TuftePhaseHeader } from './TuftePhaseHeader';
import { TufteStrategySection } from './TufteStrategySection';

// Phase display order and labels
const PHASES: { key: StrategyPhase; label: string }[] = [
  { key: 'start', label: 'START' },
  { key: 'upwind', label: 'UPWIND' },
  { key: 'downwind', label: 'DOWNWIND' },
  { key: 'markRounding', label: 'MARK ROUNDING' },
  { key: 'finish', label: 'FINISH' },
];

// Tufte-inspired colors
const COLORS = {
  text: '#3D3832',
  secondaryText: '#6B7280',
  tertiaryText: '#9CA3AF',
};

export interface TufteStrategyScreenProps {
  /** Race name to display in header */
  raceName?: string;
  /** Race date for header */
  raceDate?: Date;
  /** Existing strategy notes (for loading saved plans) */
  strategyNotes?: RaceStrategyNotes;
  /** Callback when a section's user plan is updated */
  onUpdateSection?: (sectionId: StrategySectionId, userPlan: string) => void;
}

/**
 * Format date for header display (e.g., "Jun 15")
 */
function formatHeaderDate(date?: Date): string {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get the note for a specific section from the strategy notes
 */
function getSectionNote(
  sectionId: StrategySectionId,
  notes?: RaceStrategyNotes
): StrategySectionNote | undefined {
  if (!notes) return undefined;

  const [phase, field] = sectionId.split('.') as [keyof RaceStrategyNotes, string];
  const phaseNotes = notes[phase];
  if (!phaseNotes || typeof phaseNotes !== 'object') return undefined;

  return (phaseNotes as Record<string, StrategySectionNote>)[field];
}

export function TufteStrategyScreen({
  raceName = 'Race Strategy',
  raceDate,
  strategyNotes,
  onUpdateSection,
}: TufteStrategyScreenProps) {
  // Local state for user plans (could be lifted to parent or persisted)
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  const handleUpdatePlan = useCallback(
    (sectionId: StrategySectionId, plan: string) => {
      setLocalNotes((prev) => ({ ...prev, [sectionId]: plan }));
      onUpdateSection?.(sectionId, plan);
    },
    [onUpdateSection]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Minimal header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>YOUR RACE PLAN</Text>
          <Text style={styles.headerDate}>{formatHeaderDate(raceDate)}</Text>
        </View>
        <Text style={styles.headerRaceName}>{raceName}</Text>
      </View>

      {/* Strategy content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {PHASES.map((phase, phaseIndex) => {
          const sections = getSectionsForPhase(phase.key);

          return (
            <View key={phase.key}>
              <TuftePhaseHeader phase={phase.label} isFirst={phaseIndex === 0} />

              {sections.map((section) => {
                const note = getSectionNote(section.id, strategyNotes);
                const localPlan = localNotes[section.id];

                return (
                  <TufteStrategySection
                    key={section.id}
                    section={section}
                    note={
                      localPlan !== undefined
                        ? { ...note, userPlan: localPlan }
                        : note
                    }
                    onUpdatePlan={(plan) => handleUpdatePlan(section.id, plan)}
                  />
                );
              })}
            </View>
          );
        })}

        {/* Bottom padding for scroll */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.tertiaryText,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerDate: {
    fontSize: 13,
    color: COLORS.secondaryText,
  },
  headerRaceName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default TufteStrategyScreen;
