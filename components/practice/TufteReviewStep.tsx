/**
 * TufteReviewStep
 *
 * Combined WHY + HOW step following Tufte principles:
 * - Session summary
 * - AI reasoning (read-only if present)
 * - User notes
 * - Drill instructions (defaults, tap to customize)
 * - Typography-driven hierarchy
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { TUFTE_BACKGROUND } from '@/components/cards/constants';
import {
  TUFTE_FORM_COLORS,
  TUFTE_FORM_SPACING,
} from '@/components/races/AddRaceDialog/tufteFormStyles';
import type {
  Drill,
  WhatStepDrill,
  WhoStepMember,
  WhyStepData,
  HowStepData,
} from '@/types/practice';
import { DRILL_CATEGORY_META } from '@/types/practice';

interface TufteReviewStepProps {
  // Summary data
  drills: WhatStepDrill[];
  availableDrills: Drill[];
  members: WhoStepMember[];
  estimatedDuration: number;
  // WHY data
  whyData: WhyStepData;
  onUserRationaleChange: (rationale: string) => void;
  // HOW data
  howData: HowStepData;
  onDrillInstructionsChange: (drillId: string, instructions: string) => void;
  onSessionNotesChange: (notes: string) => void;
}

export function TufteReviewStep({
  drills,
  availableDrills,
  members,
  estimatedDuration,
  whyData,
  onUserRationaleChange,
  howData,
  onDrillInstructionsChange,
  onSessionNotesChange,
}: TufteReviewStepProps) {
  const [expandedDrillId, setExpandedDrillId] = useState<string | null>(null);

  // Get drill info by ID
  const getDrillInfo = (drillId: string) => {
    return availableDrills.find((d) => d.id === drillId);
  };

  // Get custom instructions for a drill
  const getDrillInstructions = (drillId: string) => {
    return howData.drillInstructions.find((i) => i.drillId === drillId);
  };

  const hasAIReasoning = !!whyData.aiReasoning;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* SESSION SUMMARY */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>SESSION SUMMARY</Text>
        <Text style={styles.summaryText}>
          {drills.length} drill{drills.length !== 1 ? 's' : ''} · {estimatedDuration} min
          {members.length > 0 && ` · ${members.length} crew`}
        </Text>
      </View>

      {/* WHY SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>WHY THIS PRACTICE</Text>

        {hasAIReasoning && (
          <View style={styles.aiReasoningCard}>
            <Text style={styles.aiReasoningText}>
              <Text style={styles.connector}>└─ </Text>
              {whyData.aiReasoning}
            </Text>
          </View>
        )}

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Your notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={whyData.userRationale || ''}
            onChangeText={onUserRationaleChange}
            placeholder="What do you want to focus on?"
            placeholderTextColor={TUFTE_FORM_COLORS.placeholder}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* DRILL INSTRUCTIONS */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DRILL INSTRUCTIONS</Text>
        <Text style={styles.sectionSubtext}>
          Using defaults · Tap to customize
        </Text>

        <View style={styles.drillList}>
          {drills.map((drill, index) => {
            const drillInfo = getDrillInfo(drill.drillId);
            if (!drillInfo) return null;

            const instructions = getDrillInstructions(drill.drillId);
            const isExpanded = expandedDrillId === drill.drillId;
            const hasCustom = !!instructions?.customInstructions;
            const categoryMeta = DRILL_CATEGORY_META[drillInfo.category];

            return (
              <View key={drill.drillId} style={styles.drillCard}>
                <TouchableOpacity
                  style={styles.drillHeader}
                  onPress={() =>
                    setExpandedDrillId(isExpanded ? null : drill.drillId)
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.drillHeaderContent}>
                    <Text style={styles.drillIndex}>#{index + 1}</Text>
                    <View style={styles.drillHeaderText}>
                      <Text style={styles.drillName}>{drillInfo.name}</Text>
                      <Text style={styles.drillMeta}>
                        {drill.durationMinutes || drillInfo.durationMinutes} min · {categoryMeta?.label || drillInfo.category}
                        {hasCustom && ' · Custom'}
                      </Text>
                    </View>
                  </View>
                  {isExpanded ? (
                    <ChevronUp size={16} color={TUFTE_FORM_COLORS.secondaryLabel} />
                  ) : (
                    <ChevronDown size={16} color={TUFTE_FORM_COLORS.secondaryLabel} />
                  )}
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.drillExpandedContent}>
                    {/* Default instructions */}
                    {drillInfo.instructions && (
                      <View style={styles.defaultInstructions}>
                        <Text style={styles.defaultLabel}>Default:</Text>
                        <Text style={styles.defaultText}>
                          {drillInfo.instructions}
                        </Text>
                      </View>
                    )}

                    {/* Custom instructions input */}
                    <View style={styles.customInstructionsSection}>
                      <Text style={styles.inputLabel}>Custom instructions</Text>
                      <TextInput
                        style={styles.instructionsInput}
                        value={instructions?.customInstructions || ''}
                        onChangeText={(text) =>
                          onDrillInstructionsChange(drill.drillId, text)
                        }
                        placeholder="Override default instructions..."
                        placeholderTextColor={TUFTE_FORM_COLORS.placeholder}
                        multiline
                        numberOfLines={2}
                        textAlignVertical="top"
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* SESSION NOTES */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SESSION NOTES</Text>
        <TextInput
          style={styles.sessionNotesInput}
          value={howData.sessionNotes || ''}
          onChangeText={onSessionNotesChange}
          placeholder="Any additional notes or reminders..."
          placeholderTextColor={TUFTE_FORM_COLORS.placeholder}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Ready indicator */}
      <View style={styles.readyCard}>
        <Text style={styles.readyText}>Ready to create your practice session</Text>
      </View>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },
  content: {
    paddingTop: TUFTE_FORM_SPACING.lg,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: TUFTE_FORM_SPACING.md,
    paddingHorizontal: TUFTE_FORM_SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TUFTE_FORM_COLORS.separator,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.sectionLabel,
    letterSpacing: 1,
    marginBottom: 2,
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.label,
    fontVariant: ['tabular-nums'],
  },
  section: {
    paddingHorizontal: TUFTE_FORM_SPACING.lg,
    paddingVertical: TUFTE_FORM_SPACING.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.sectionLabel,
    letterSpacing: 1.2,
    marginBottom: TUFTE_FORM_SPACING.xs,
  },
  sectionSubtext: {
    fontSize: 12,
    color: TUFTE_FORM_COLORS.secondaryLabel,
    marginBottom: TUFTE_FORM_SPACING.sm,
  },
  aiReasoningCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: TUFTE_FORM_SPACING.md,
    marginBottom: TUFTE_FORM_SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: TUFTE_FORM_COLORS.aiAccent,
  },
  aiReasoningText: {
    fontSize: 13,
    color: TUFTE_FORM_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  connector: {
    color: '#D1D5DB',
  },
  inputSection: {
    gap: TUFTE_FORM_SPACING.xs,
  },
  inputLabel: {
    fontSize: 12,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: TUFTE_FORM_COLORS.label,
    minHeight: 60,
  },
  drillList: {
    gap: 8,
  },
  drillCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
    overflow: 'hidden',
  },
  drillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: TUFTE_FORM_SPACING.md,
  },
  drillHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  drillIndex: {
    fontSize: 12,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.secondaryLabel,
    minWidth: 20,
  },
  drillHeaderText: {
    flex: 1,
    gap: 2,
  },
  drillName: {
    fontSize: 14,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.label,
  },
  drillMeta: {
    fontSize: 12,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  drillExpandedContent: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TUFTE_FORM_COLORS.separator,
    padding: TUFTE_FORM_SPACING.md,
    gap: TUFTE_FORM_SPACING.md,
  },
  defaultInstructions: {
    backgroundColor: TUFTE_BACKGROUND,
    borderRadius: 6,
    padding: TUFTE_FORM_SPACING.sm,
  },
  defaultLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.sectionLabel,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  defaultText: {
    fontSize: 13,
    color: TUFTE_FORM_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  customInstructionsSection: {
    gap: TUFTE_FORM_SPACING.xs,
  },
  instructionsInput: {
    backgroundColor: TUFTE_BACKGROUND,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: TUFTE_FORM_COLORS.label,
    minHeight: 50,
  },
  sessionNotesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: TUFTE_FORM_COLORS.label,
    minHeight: 80,
  },
  readyCard: {
    marginHorizontal: TUFTE_FORM_SPACING.lg,
    marginTop: TUFTE_FORM_SPACING.md,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: TUFTE_FORM_SPACING.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  readyText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#15803D',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default TufteReviewStep;
