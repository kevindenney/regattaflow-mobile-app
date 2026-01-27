/**
 * SharedRaceContentView Component
 *
 * Read-only display of another sailor's shared race content:
 * - Strategy & Prep Notes
 * - Rig Tuning Settings
 * - Post-Race Analysis
 *
 * Used when viewing another sailor's timeline to show their shared content.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Compass, Sliders, Lightbulb } from 'lucide-react-native';
import { AccordionSection } from '@/components/races/AccordionSection';
import { IOS_COLORS } from '@/components/cards/constants';
import { TuningSettings } from '@/hooks/useRegattaContent';

interface SharedRaceContentViewProps {
  /** Race data with content fields */
  race: {
    id: string;
    name?: string;
    prep_notes?: string;
    tuning_settings?: TuningSettings | null;
    post_race_notes?: string;
    lessons_learned?: string[];
  };
  /** Sailor's name for attribution */
  sailorName: string;
}

/**
 * Format tuning setting key for display
 */
function formatTuningKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Check if tuning settings have any actual values
 */
function hasTuningContent(settings: TuningSettings | null | undefined): boolean {
  if (!settings) return false;
  return Object.entries(settings).some(([, value]) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  });
}

/**
 * Tuning setting row component
 */
function TuningRow({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.tuningRow}>
      <Text style={styles.tuningLabel}>{label}</Text>
      <Text style={styles.tuningValue}>{String(value)}</Text>
    </View>
  );
}

export function SharedRaceContentView({
  race,
  sailorName,
}: SharedRaceContentViewProps) {
  const hasStrategyNotes = Boolean(race.prep_notes?.trim());
  const hasTuning = hasTuningContent(race.tuning_settings);
  const hasPostRaceNotes = Boolean(race.post_race_notes?.trim());
  const hasLessons = Array.isArray(race.lessons_learned) && race.lessons_learned.length > 0;
  const hasPostRace = hasPostRaceNotes || hasLessons;

  // Filter and format tuning settings
  const tuningEntries = useMemo(() => {
    if (!race.tuning_settings) return [];
    return Object.entries(race.tuning_settings)
      .filter(([key, value]) => {
        // Skip empty values
        if (value === null || value === undefined) return false;
        if (typeof value === 'string' && !value.trim()) return false;
        // Skip legacy fields if newer equivalents exist
        if (key === 'shroud_tension' && (race.tuning_settings?.upper_shroud_tension || race.tuning_settings?.lower_shroud_tension)) {
          return false;
        }
        if (key === 'kicker' && race.tuning_settings?.vang) {
          return false;
        }
        return true;
      })
      .map(([key, value]) => ({
        key,
        label: formatTuningKey(key),
        value: String(value),
      }));
  }, [race.tuning_settings]);

  // Don't render if no content
  if (!hasStrategyNotes && !hasTuning && !hasPostRace) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>
        {sailorName}'s Race Content
      </Text>

      {/* Strategy & Prep Notes */}
      {hasStrategyNotes && (
        <AccordionSection
          title="Strategy Notes"
          icon={<Compass size={18} color={IOS_COLORS.blue} />}
          defaultExpanded={false}
        >
          <Text style={styles.notesText}>{race.prep_notes}</Text>
        </AccordionSection>
      )}

      {/* Rig Tuning Settings */}
      {hasTuning && (
        <AccordionSection
          title="Rig Tuning"
          icon={<Sliders size={18} color={IOS_COLORS.orange} />}
          count={tuningEntries.length}
          defaultExpanded={false}
        >
          <View style={styles.tuningGrid}>
            {tuningEntries.map((entry) => (
              <TuningRow
                key={entry.key}
                label={entry.label}
                value={entry.value}
              />
            ))}
          </View>
        </AccordionSection>
      )}

      {/* Post-Race Analysis */}
      {hasPostRace && (
        <AccordionSection
          title="Post-Race Analysis"
          icon={<Lightbulb size={18} color={IOS_COLORS.green} />}
          count={hasLessons ? race.lessons_learned!.length : undefined}
          defaultExpanded={false}
        >
          {hasPostRaceNotes && (
            <View style={styles.postRaceSection}>
              <Text style={styles.subSectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{race.post_race_notes}</Text>
            </View>
          )}

          {hasLessons && (
            <View style={[styles.postRaceSection, hasPostRaceNotes && styles.lessonsSection]}>
              <Text style={styles.subSectionTitle}>Lessons Learned</Text>
              {race.lessons_learned!.map((lesson, index) => (
                <View key={index} style={styles.lessonRow}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.lessonText}>{lesson}</Text>
                </View>
              ))}
            </View>
          )}
        </AccordionSection>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
    color: IOS_COLORS.label,
  },
  tuningGrid: {
    gap: 8,
  },
  tuningRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },
  tuningLabel: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    flex: 1,
  },
  tuningValue: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
    textAlign: 'right',
  },
  postRaceSection: {},
  lessonsSection: {
    marginTop: 16,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 8,
  },
  lessonRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bulletPoint: {
    fontSize: 15,
    color: IOS_COLORS.green,
    marginRight: 8,
    lineHeight: 22,
  },
  lessonText: {
    fontSize: 15,
    lineHeight: 22,
    color: IOS_COLORS.label,
    flex: 1,
  },
});

export default SharedRaceContentView;
