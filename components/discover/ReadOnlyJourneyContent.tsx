/**
 * ReadOnlyJourneyContent Component
 *
 * Container for displaying read-only race journey content organized by phase:
 * - Days Before: Strategy brief, checklist progress, rig/sail selections, forecast
 * - On Water: Strategy notes, course notes
 * - After Race: Results, learnings, AI coaching feedback
 *
 * Uses AccordionSection for collapsible sections.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Compass,
  ClipboardCheck,
  Sliders,
  Anchor,
  Navigation,
  Cloud,
  Trophy,
  Lightbulb,
  Target,
} from 'lucide-react-native';
import { AccordionSection, AccordionGroup } from '@/components/races/AccordionSection';
import { JourneyPhase } from './JourneyPhaseSelector';
import { RaceData, RaceResult, ChecklistSummary } from '@/hooks/usePublicSailorRaceJourney';
import { SailorRacePreparation } from '@/services/SailorRacePreparationService';
import { RaceIntentions } from '@/types/raceIntentions';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

// Import read-only components
import {
  ReadOnlyStrategyBrief,
  ReadOnlyChecklistProgress,
  ReadOnlyRigSettings,
  ReadOnlySailSelection,
  ReadOnlyCourseNotes,
  ReadOnlyForecastSnapshots,
  ReadOnlyPostRace,
} from './read-only';

interface ReadOnlyJourneyContentProps {
  phase: JourneyPhase;
  race: RaceData;
  preparation: SailorRacePreparation | null;
  intentions: RaceIntentions | null;
  raceResults: RaceResult[] | null;
  checklistSummary: ChecklistSummary | null;
  sailorName: string;
}

/**
 * Days Before Phase Content
 */
function DaysBeforeContent({
  race,
  preparation,
  intentions,
  checklistSummary,
  sailorName,
}: Omit<ReadOnlyJourneyContentProps, 'phase' | 'raceResults'>) {
  const hasStrategyBrief = Boolean(intentions?.strategyBrief?.raceIntention);
  const hasChecklist = checklistSummary && checklistSummary.totalItems > 0;
  const hasRigSettings = Boolean(preparation?.selected_rig_preset_id || preparation?.rig_notes);
  const hasSailSelection = Boolean(
    intentions?.sailSelection?.mainsail ||
    intentions?.sailSelection?.jib ||
    intentions?.sailSelection?.spinnaker
  );
  const hasCourseNotes = Boolean(
    intentions?.courseSelection?.selectedCourseName ||
    intentions?.courseSelection?.notes
  );
  const hasForecast = Boolean(
    intentions?.forecastCheck?.snapshots && intentions.forecastCheck.snapshots.length > 0
  );

  // Also check for prep_notes and tuning_settings on the race itself (legacy/seed data)
  const hasPrepNotes = Boolean(race.prep_notes);
  const hasTuningSettings = Boolean(race.tuning_settings && Object.keys(race.tuning_settings).length > 0);

  const hasAnyContent = hasStrategyBrief || hasChecklist || hasRigSettings || hasSailSelection || hasCourseNotes || hasForecast || hasPrepNotes || hasTuningSettings;

  if (!hasAnyContent) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>
          {sailorName} hasn't shared pre-race planning for this event yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.phaseContent}>
      {/* Strategy Brief (from intentions) */}
      {hasStrategyBrief && (
        <AccordionSection
          title="Race Intention"
          icon={<Target size={18} color={IOS_COLORS.systemBlue} />}
          defaultExpanded={true}
        >
          <ReadOnlyStrategyBrief
            strategyBrief={intentions?.strategyBrief}
            strategyNotes={intentions?.strategyNotes}
          />
        </AccordionSection>
      )}

      {/* Prep Notes (from race record - fallback for seed/legacy data) */}
      {hasPrepNotes && !hasStrategyBrief && (
        <AccordionSection
          title="Race Plan"
          icon={<Target size={18} color={IOS_COLORS.systemBlue} />}
          defaultExpanded={true}
        >
          <Text style={styles.prepNotesText}>{race.prep_notes}</Text>
        </AccordionSection>
      )}

      {/* Checklist Progress */}
      {hasChecklist && checklistSummary && (
        <AccordionSection
          title="Preparation Progress"
          icon={<ClipboardCheck size={18} color={IOS_COLORS.systemGreen} />}
          subtitle={`${checklistSummary.percentage}% complete`}
          defaultExpanded={false}
        >
          <ReadOnlyChecklistProgress
            checklistSummary={checklistSummary}
            completions={intentions?.checklistCompletions}
          />
        </AccordionSection>
      )}

      {/* Sail Selection */}
      {hasSailSelection && (
        <AccordionSection
          title="Sail Selection"
          icon={<Anchor size={18} color={IOS_COLORS.systemTeal} />}
          defaultExpanded={false}
        >
          <ReadOnlySailSelection sailSelection={intentions?.sailSelection} />
        </AccordionSection>
      )}

      {/* Rig Settings (from intentions) */}
      {hasRigSettings && (
        <AccordionSection
          title="Rig Tuning"
          icon={<Sliders size={18} color={IOS_COLORS.systemOrange} />}
          defaultExpanded={false}
        >
          <ReadOnlyRigSettings
            rigNotes={preparation?.rig_notes}
            rigPresetId={preparation?.selected_rig_preset_id}
            rigIntentions={intentions?.rigIntentions}
            tuningSettings={race.tuning_settings}
          />
        </AccordionSection>
      )}

      {/* Tuning Settings (from race record - fallback for seed/legacy data) */}
      {hasTuningSettings && !hasRigSettings && (
        <AccordionSection
          title="Rig Tuning"
          icon={<Sliders size={18} color={IOS_COLORS.systemOrange} />}
          defaultExpanded={false}
        >
          <ReadOnlyRigSettings
            rigNotes={null}
            rigPresetId={null}
            rigIntentions={null}
            tuningSettings={race.tuning_settings}
          />
        </AccordionSection>
      )}

      {/* Course Notes */}
      {hasCourseNotes && (
        <AccordionSection
          title="Course Notes"
          icon={<Navigation size={18} color={IOS_COLORS.systemPurple} />}
          defaultExpanded={false}
        >
          <ReadOnlyCourseNotes courseSelection={intentions?.courseSelection} />
        </AccordionSection>
      )}

      {/* Forecast Snapshots */}
      {hasForecast && (
        <AccordionSection
          title="Weather Forecast"
          icon={<Cloud size={18} color={IOS_COLORS.systemIndigo} />}
          count={intentions?.forecastCheck?.snapshots?.length}
          defaultExpanded={false}
        >
          <ReadOnlyForecastSnapshots forecastCheck={intentions?.forecastCheck} />
        </AccordionSection>
      )}
    </View>
  );
}

/**
 * On Water Phase Content
 * Shows on-water strategy and pre-start specifications (NOT prep_notes - that's in Plan tab)
 */
function OnWaterContent({
  race,
  intentions,
  sailorName,
}: Pick<ReadOnlyJourneyContentProps, 'race' | 'intentions' | 'sailorName'>) {
  const hasStrategyNotes = Boolean(
    intentions?.strategyNotes && Object.keys(intentions.strategyNotes).length > 0
  );
  const hasPreStartSpecs = Boolean(
    intentions?.preStartSpecifications && Object.keys(intentions.preStartSpecifications).length > 0
  );

  // Note: prep_notes is shown in Plan tab, NOT here
  const hasAnyContent = hasStrategyNotes || hasPreStartSpecs;

  if (!hasAnyContent) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>
          {sailorName} hasn't shared on-water notes for this race.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.phaseContent}>
      {/* Strategy Notes (from intentions, NOT prep_notes) */}
      {hasStrategyNotes && (
        <AccordionSection
          title="Strategy Notes"
          icon={<Compass size={18} color={IOS_COLORS.systemBlue} />}
          defaultExpanded={true}
        >
          <ReadOnlyStrategyBrief
            strategyBrief={intentions?.strategyBrief}
            strategyNotes={intentions?.strategyNotes}
          />
        </AccordionSection>
      )}

      {/* Pre-Start Specifications */}
      {hasPreStartSpecs && (
        <AccordionSection
          title="Pre-Start Plan"
          icon={<Target size={18} color={IOS_COLORS.systemOrange} />}
          count={Object.keys(intentions?.preStartSpecifications || {}).length}
          defaultExpanded={false}
        >
          <View style={styles.preStartSpecs}>
            {Object.entries(intentions?.preStartSpecifications || {}).map(([id, spec]) => (
              <View key={id} style={styles.specRow}>
                <Text style={styles.specLabel}>{spec.itemId}</Text>
                <Text style={styles.specValue}>{spec.specification}</Text>
              </View>
            ))}
          </View>
        </AccordionSection>
      )}
    </View>
  );
}

/**
 * After Race Phase Content
 */
function AfterRaceContent({
  race,
  raceResults,
  intentions,
  sailorName,
}: Pick<ReadOnlyJourneyContentProps, 'race' | 'raceResults' | 'intentions' | 'sailorName'>) {
  const hasResults = raceResults && raceResults.length > 0;
  const hasPostRaceNotes = Boolean(race.post_race_notes);
  const hasLessons = Array.isArray(race.lessons_learned) && race.lessons_learned.length > 0;

  const hasAnyContent = hasResults || hasPostRaceNotes || hasLessons;

  if (!hasAnyContent) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>
          {sailorName} hasn't shared post-race analysis for this event yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.phaseContent}>
      {/* Race Results */}
      {hasResults && (
        <AccordionSection
          title="Race Results"
          icon={<Trophy size={18} color={IOS_COLORS.systemYellow} />}
          defaultExpanded={true}
        >
          <ReadOnlyPostRace
            results={raceResults}
            postRaceNotes={null}
            lessonsLearned={null}
          />
        </AccordionSection>
      )}

      {/* Post-Race Analysis */}
      {(hasPostRaceNotes || hasLessons) && (
        <AccordionSection
          title="Learnings"
          icon={<Lightbulb size={18} color={IOS_COLORS.systemGreen} />}
          count={hasLessons ? race.lessons_learned!.length : undefined}
          defaultExpanded={true}
        >
          <ReadOnlyPostRace
            results={null}
            postRaceNotes={race.post_race_notes}
            lessonsLearned={race.lessons_learned}
          />
        </AccordionSection>
      )}
    </View>
  );
}

/**
 * Main content renderer based on selected phase
 */
export function ReadOnlyJourneyContent(props: ReadOnlyJourneyContentProps) {
  const { phase, ...contentProps } = props;

  switch (phase) {
    case 'days_before':
      return <DaysBeforeContent {...contentProps} />;
    case 'on_water':
      return (
        <OnWaterContent
          race={contentProps.race}
          intentions={contentProps.intentions}
          sailorName={contentProps.sailorName}
        />
      );
    case 'after_race':
      return (
        <AfterRaceContent
          race={contentProps.race}
          raceResults={contentProps.raceResults}
          intentions={contentProps.intentions}
          sailorName={contentProps.sailorName}
        />
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  phaseContent: {
    gap: 8,
  },
  emptyState: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
  prepNotesText: {
    fontSize: 15,
    color: IOS_COLORS.label,
    lineHeight: 22,
  },
  preStartSpecs: {
    gap: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.systemGray5,
  },
  specLabel: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    flex: 1,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
    flex: 2,
    textAlign: 'right',
  },
});

export default ReadOnlyJourneyContent;
