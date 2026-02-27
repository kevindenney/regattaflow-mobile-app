/**
 * ClinicalObjectivesModule
 *
 * Shows learning objectives for the clinical shift, linked to the
 * competency framework. Includes checkbox-style toggles to mark
 * objectives as "focused on today" and a preceptor focus areas section.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Target,
  BookOpen,
  CheckSquare,
  Square,
  Star,
  Link2,
} from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import type { ContentModuleProps } from '@/types/raceCardContent';
import type { CardRaceData } from '@/components/cards/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClinicalObjectivesModuleProps extends ContentModuleProps<CardRaceData> {}

interface ObjectiveData {
  id: string;
  description: string;
  linkedCompetencyIds: string[];
  linkedCompetencyNumbers: string[];
  progressPercent: number;
}

interface PreceptorFocusArea {
  id: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_OBJECTIVES: ObjectiveData[] = [
  {
    id: 'obj-1',
    description: 'Perform a focused respiratory assessment and document findings using SBAR format',
    linkedCompetencyIds: ['comp-resp-assess', 'comp-sbar'],
    linkedCompetencyNumbers: ['AS-2.1', 'CT-1.3'],
    progressPercent: 65,
  },
  {
    id: 'obj-2',
    description: 'Administer IV push medications safely with independent double-check',
    linkedCompetencyIds: ['comp-iv-push', 'comp-med-safety'],
    linkedCompetencyNumbers: ['MA-3.1', 'MA-1.2'],
    progressPercent: 40,
  },
  {
    id: 'obj-3',
    description: 'Prioritize care for 2+ patients and manage time effectively during shift',
    linkedCompetencyIds: ['comp-prioritization'],
    linkedCompetencyNumbers: ['CT-2.4'],
    progressPercent: 20,
  },
];

const MOCK_PRECEPTOR_FOCUS: PreceptorFocusArea[] = [
  {
    id: 'pf-1',
    description: 'Practice delegating tasks to CNA while maintaining oversight',
  },
  {
    id: 'pf-2',
    description: 'Speak up if unsure about a medication dose - ask questions early',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACCENT_TEAL = '#0097A7';

function getProgressColor(percent: number): string {
  if (percent >= 80) return IOS_COLORS.green;
  if (percent >= 40) return '#0097A7';
  return IOS_COLORS.orange;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ClinicalObjectivesModule({
  race,
  phase,
  raceType,
  isCollapsed,
}: ClinicalObjectivesModuleProps) {
  const [focusedObjectives, setFocusedObjectives] = useState<Set<string>>(
    new Set(['obj-1']),
  );

  if (isCollapsed) return null;

  const toggleFocus = (objectiveId: string) => {
    setFocusedObjectives((prev) => {
      const next = new Set(prev);
      if (next.has(objectiveId)) {
        next.delete(objectiveId);
      } else {
        next.add(objectiveId);
      }
      return next;
    });
  };

  const objectives = MOCK_OBJECTIVES;
  const preceptorFocus = MOCK_PRECEPTOR_FOCUS;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Target size={14} color={ACCENT_TEAL} />
        <Text style={styles.headerTitle}>LEARNING OBJECTIVES</Text>
      </View>

      {/* Objectives List */}
      <View style={styles.objectivesList}>
        {objectives.map((obj) => {
          const isFocused = focusedObjectives.has(obj.id);
          const progressColor = getProgressColor(obj.progressPercent);

          return (
            <View key={obj.id} style={styles.objectiveCard}>
              {/* Checkbox + Description */}
              <Pressable
                style={styles.objectiveTopRow}
                onPress={() => toggleFocus(obj.id)}
              >
                {isFocused ? (
                  <CheckSquare size={18} color={ACCENT_TEAL} />
                ) : (
                  <Square size={18} color="#D1D5DB" />
                )}
                <Text
                  style={[
                    styles.objectiveDescription,
                    isFocused && styles.objectiveDescriptionFocused,
                  ]}
                >
                  {obj.description}
                </Text>
              </Pressable>

              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${obj.progressPercent}%`,
                        backgroundColor: progressColor,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[styles.progressText, { color: progressColor }]}
                >
                  {obj.progressPercent}%
                </Text>
              </View>

              {/* Linked Competencies */}
              <View style={styles.competenciesRow}>
                <Link2 size={10} color="#9CA3AF" />
                {obj.linkedCompetencyNumbers.map((compNum, idx) => (
                  <View key={idx} style={styles.compTag}>
                    <Text style={styles.compTagText}>{compNum}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {/* Preceptor Focus Areas */}
      <View style={styles.preceptorSection}>
        <View style={styles.preceptorHeader}>
          <Star size={13} color="#D97706" />
          <Text style={styles.preceptorTitle}>PRECEPTOR FOCUS AREAS</Text>
        </View>

        {preceptorFocus.map((focus) => (
          <View key={focus.id} style={styles.preceptorItem}>
            <BookOpen size={12} color="#D97706" />
            <Text style={styles.preceptorText}>{focus.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Objectives list
  objectivesList: {
    gap: 8,
  },
  objectiveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  // Top row
  objectiveTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  objectiveDescription: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: '#1F2937',
    lineHeight: 18,
  },
  objectiveDescriptionFocused: {
    fontWeight: '500',
    color: '#0097A7',
  },

  // Progress
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 26,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    minWidth: 30,
    textAlign: 'right',
  },

  // Linked competencies
  competenciesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 26,
  },
  compTag: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  compTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.3,
  },

  // Preceptor section
  preceptorSection: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FDE68A50',
  },
  preceptorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  preceptorTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#92400E',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  preceptorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingLeft: 2,
  },
  preceptorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    color: '#92400E',
    lineHeight: 17,
  },
});

export default ClinicalObjectivesModule;
