/**
 * RaceCardContentSections Component
 *
 * Collapsible content sections for the full-screen race card.
 * Displays:
 * - Strategy Brief (race intention, notes)
 * - Rig Settings (tuning data)
 * - Sail Selection
 * - Conditions (forecast snapshots)
 *
 * Uses AccordionSection for collapsible behavior.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Target,
  Wrench,
  Wind,
  CloudSun,
  FileText,
  CheckCircle,
  Lightbulb,
} from 'lucide-react-native';
import { AccordionSection } from '@/components/races/AccordionSection';
import { ReadOnlyStrategyBrief } from './read-only/ReadOnlyStrategyBrief';
import { ReadOnlyRigSettings } from './read-only/ReadOnlyRigSettings';
import { ReadOnlySailSelection } from './read-only/ReadOnlySailSelection';
import { ReadOnlyForecastSnapshots } from './read-only/ReadOnlyForecastSnapshots';
import { ReadOnlyPostRace } from './read-only/ReadOnlyPostRace';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import type { RaceIntentions } from '@/types/raceIntentions';
import type { TuningSettings } from '@/hooks/useRegattaContent';

interface RaceCardContentSectionsProps {
  intentions?: RaceIntentions | null;
  tuningSettings?: TuningSettings | null;
  prepNotes?: string | null;
  postRaceNotes?: string | null;
  lessonsLearned?: string[] | null;
  isPastRace?: boolean;
}

export function RaceCardContentSections({
  intentions,
  tuningSettings,
  prepNotes,
  postRaceNotes,
  lessonsLearned,
  isPastRace = false,
}: RaceCardContentSectionsProps) {
  // Determine which sections have content
  const hasStrategy = Boolean(
    intentions?.strategyBrief?.raceIntention ||
    intentions?.strategyNotes ||
    prepNotes
  );
  const hasRig = Boolean(
    tuningSettings && Object.keys(tuningSettings).length > 0 ||
    intentions?.rigIntentions
  );
  const hasSails = Boolean(intentions?.sailSelection);
  const hasForecast = Boolean(
    intentions?.forecastCheck?.snapshots?.length
  );
  const hasPostRace = Boolean(postRaceNotes || (lessonsLearned && lessonsLearned.length > 0));

  // If no content at all, show empty state
  if (!hasStrategy && !hasRig && !hasSails && !hasForecast && !hasPostRace) {
    return (
      <View style={styles.emptyContainer}>
        <FileText size={32} color={IOS_COLORS.systemGray3} />
        <Text style={styles.emptyText}>
          No race preparation details shared yet
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Strategy Brief Section */}
      {hasStrategy && (
        <AccordionSection
          title="Strategy Brief"
          icon={<Target size={18} color={IOS_COLORS.systemBlue} />}
          defaultExpanded={true}
        >
          <ReadOnlyStrategyBrief
            strategyBrief={intentions?.strategyBrief}
            strategyNotes={intentions?.strategyNotes}
            prepNotes={prepNotes ?? undefined}
          />
        </AccordionSection>
      )}

      {/* Rig Settings Section */}
      {hasRig && (
        <AccordionSection
          title="Rig Settings"
          icon={<Wrench size={18} color={IOS_COLORS.systemOrange} />}
          defaultExpanded={false}
        >
          <ReadOnlyRigSettings
            rigNotes={intentions?.rigIntentions?.overallNotes}
            rigIntentions={intentions?.rigIntentions}
            tuningSettings={tuningSettings ?? undefined}
          />
        </AccordionSection>
      )}

      {/* Sail Selection Section */}
      {hasSails && (
        <AccordionSection
          title="Sail Selection"
          icon={<Wind size={18} color={IOS_COLORS.systemGreen} />}
          defaultExpanded={false}
        >
          <ReadOnlySailSelection
            sailSelection={intentions?.sailSelection}
          />
        </AccordionSection>
      )}

      {/* Conditions/Forecast Section */}
      {hasForecast && (
        <AccordionSection
          title="Conditions"
          icon={<CloudSun size={18} color={IOS_COLORS.systemCyan} />}
          defaultExpanded={false}
        >
          <ReadOnlyForecastSnapshots
            forecastCheck={intentions?.forecastCheck}
          />
        </AccordionSection>
      )}

      {/* Post Race Section (for past races) */}
      {isPastRace && hasPostRace && (
        <>
          {postRaceNotes && (
            <AccordionSection
              title="Race Analysis"
              icon={<CheckCircle size={18} color={IOS_COLORS.systemGreen} />}
              defaultExpanded={true}
            >
              <View style={styles.postRaceContent}>
                <Text style={styles.postRaceText}>{postRaceNotes}</Text>
              </View>
            </AccordionSection>
          )}

          {lessonsLearned && lessonsLearned.length > 0 && (
            <AccordionSection
              title="Key Learnings"
              icon={<Lightbulb size={18} color={IOS_COLORS.systemYellow} />}
              defaultExpanded={false}
              count={lessonsLearned.length}
            >
              <View style={styles.lessonsContainer}>
                {lessonsLearned.map((lesson, index) => (
                  <View key={index} style={styles.lessonItem}>
                    <Text style={styles.lessonNumber}>{index + 1}.</Text>
                    <Text style={styles.lessonText}>{lesson}</Text>
                  </View>
                ))}
              </View>
            </AccordionSection>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
  },
  postRaceContent: {
    padding: 4,
  },
  postRaceText: {
    fontSize: 15,
    color: IOS_COLORS.label,
    lineHeight: 22,
  },
  lessonsContainer: {
    gap: 12,
  },
  lessonItem: {
    flexDirection: 'row',
    gap: 8,
  },
  lessonNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.systemYellow,
    width: 20,
  },
  lessonText: {
    fontSize: 14,
    color: IOS_COLORS.label,
    lineHeight: 20,
    flex: 1,
  },
});

export default RaceCardContentSections;
