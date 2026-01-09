/**
 * AfterRaceContent - After Race Phase Content
 *
 * Content shown when selectedPhase === 'after_race'
 * Includes:
 * - Result entry (Tufte "absence as interface")
 * - Key moment capture
 * - Equipment notes (flows to next race)
 * - AI analysis status
 * - Coach feedback
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ActivityIndicator, Animated } from 'react-native';
import { Trophy, Lightbulb, Wrench, Brain, MessageSquare, RefreshCw, Check } from 'lucide-react-native';

import { CardRaceData } from '../../types';
import { useRacePreparation } from '@/hooks/useRacePreparation';
import { useRaceAnalysisState } from '@/hooks/useRaceAnalysisState';
import { useRaceAnalysisData } from '@/hooks/useRaceAnalysisData';
import { useEquipmentFlow } from '@/hooks/useEquipmentFlow';
import { Marginalia } from '@/components/ui/Marginalia';
import { RaceAnalysisService } from '@/services/RaceAnalysisService';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
};

interface AfterRaceContentProps {
  race: CardRaceData;
  userId?: string;
  onOpenPostRaceInterview?: () => void;
  isExpanded?: boolean;
}

/**
 * Get ordinal suffix
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export function AfterRaceContent({
  race,
  userId,
  onOpenPostRaceInterview,
  isExpanded = true,
}: AfterRaceContentProps) {
  // Analysis state and data
  const { state: analysisState, refetch: refetchState } = useRaceAnalysisState(race.id, race.date, userId);
  const { analysisData, refetch: refetchData } = useRaceAnalysisData(race.id, userId);

  // Equipment flow for cross-race issue tracking
  // Note: Don't pass boatId so storage key matches useRaceChecklist
  const { addIssue, isLoading: isEquipmentLoading } = useEquipmentFlow({
    userId,
    currentRaceId: race.id,
  });

  // Equipment notes (for next race flow)
  const [equipmentNotes, setEquipmentNotes] = useState('');
  const [isSavingEquipment, setIsSavingEquipment] = useState(false);
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);
  const savedConfirmationOpacity = useRef(new Animated.Value(0)).current;

  // Analysis generation state
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Trigger AI analysis generation
  const triggerAnalysis = useCallback(async () => {
    const timerSessionId = analysisData?.timerSessionId;
    if (!timerSessionId) {
      setAnalysisError('No race session found');
      return;
    }

    setIsGeneratingAnalysis(true);
    setAnalysisError(null);

    try {
      const result = await RaceAnalysisService.analyzeRaceSession(timerSessionId, { force: true });
      if (result) {
        // Refresh both hooks to pick up the new analysis
        refetchState();
        refetchData();
      } else {
        setAnalysisError('Analysis generation failed');
      }
    } catch (err) {
      console.error('Error generating analysis:', err);
      setAnalysisError('Failed to generate analysis');
    } finally {
      setIsGeneratingAnalysis(false);
    }
  }, [analysisData?.timerSessionId, refetchState, refetchData]);

  // Save equipment note
  const saveEquipmentNote = useCallback(async () => {
    const trimmedNote = equipmentNotes.trim();
    console.log('[AfterRaceContent] saveEquipmentNote called:', {
      trimmedNote,
      userId,
      raceId: race.id,
      raceName: race.name,
    });

    if (!trimmedNote) {
      console.log('[AfterRaceContent] No note to save, skipping');
      return;
    }

    setIsSavingEquipment(true);
    try {
      console.log('[AfterRaceContent] Calling addIssue...');
      await addIssue(trimmedNote, 'medium', race.id, race.name);
      console.log('[AfterRaceContent] addIssue succeeded');
      setEquipmentNotes(''); // Clear after successful save

      // Show confirmation animation
      setShowSavedConfirmation(true);
      Animated.sequence([
        Animated.timing(savedConfirmationOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(savedConfirmationOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setShowSavedConfirmation(false));
    } catch (err) {
      console.error('[AfterRaceContent] Failed to save equipment note:', err);
    } finally {
      setIsSavingEquipment(false);
    }
  }, [equipmentNotes, addIssue, race.id, race.name, savedConfirmationOpacity, userId]);

  // Derived data
  const hasResult = analysisState?.hasResult;
  const hasKeyMoment = analysisState?.hasKeyMoment;
  const hasAIAnalysis = analysisState?.hasAIAnalysis;
  const coachAnnotations = analysisState?.coachAnnotations || [];

  // Format result
  const resultText = useMemo(() => {
    if (!hasResult) return null;
    if (analysisData?.selfReportedPosition && analysisData?.selfReportedFleetSize) {
      return `${analysisData.selfReportedPosition}${getOrdinalSuffix(analysisData.selfReportedPosition)} of ${analysisData.selfReportedFleetSize}`;
    }
    return 'Recorded';
  }, [hasResult, analysisData]);

  // Format key moment
  const keyMomentText = useMemo(() => {
    if (!hasKeyMoment) return null;
    return analysisData?.keyMoment || analysisData?.keyLearning || 'Recorded';
  }, [hasKeyMoment, analysisData]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <View style={styles.container}>
      {/* Result Section - Tufte "Absence as Interface" */}
      <Pressable
        style={styles.section}
        onPress={!hasResult ? onOpenPostRaceInterview : undefined}
      >
        <View style={styles.sectionHeader}>
          <Trophy size={18} color={hasResult ? IOS_COLORS.green : IOS_COLORS.gray3} />
          <Text style={styles.sectionLabel}>YOUR RESULT</Text>
        </View>
        {hasResult ? (
          <Text style={styles.resultValue}>{resultText}</Text>
        ) : (
          <View style={styles.absenceContainer}>
            <Text style={styles.absencePlaceholder}>_______________</Text>
            <Text style={styles.absenceHint}>Tap to record</Text>
          </View>
        )}
        {/* Coach marginalia for result */}
        {coachAnnotations.find(a => a.field === 'result') && (
          <Marginalia
            author="Coach"
            comment={coachAnnotations.find(a => a.field === 'result')!.comment}
            isNew={!coachAnnotations.find(a => a.field === 'result')!.isRead}
            variant="compact"
          />
        )}
      </Pressable>

      {/* Key Moment Section */}
      <Pressable
        style={styles.section}
        onPress={!hasKeyMoment ? onOpenPostRaceInterview : undefined}
      >
        <View style={styles.sectionHeader}>
          <Lightbulb size={18} color={hasKeyMoment ? IOS_COLORS.orange : IOS_COLORS.gray3} />
          <Text style={styles.sectionLabel}>KEY MOMENT</Text>
        </View>
        {hasKeyMoment ? (
          <Text style={styles.keyMomentValue} numberOfLines={isExpanded ? 4 : 2}>
            {keyMomentText}
          </Text>
        ) : (
          <View style={styles.absenceContainer}>
            <Text style={styles.absencePlaceholder}>_______________</Text>
            <Text style={styles.absenceHint}>Tap to record</Text>
          </View>
        )}
        {/* Coach marginalia for key moment */}
        {coachAnnotations.find(a => a.field === 'keyMoment') && (
          <Marginalia
            author="Coach"
            comment={coachAnnotations.find(a => a.field === 'keyMoment')!.comment}
            isNew={!coachAnnotations.find(a => a.field === 'keyMoment')!.isRead}
            variant="compact"
          />
        )}
      </Pressable>

      {/* Equipment Notes Section (expanded only) */}
      {isExpanded && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Wrench size={18} color={IOS_COLORS.blue} />
            <Text style={styles.sectionLabel}>EQUIPMENT FOR NEXT RACE</Text>
            {showSavedConfirmation && (
              <Animated.View style={[styles.savedConfirmation, { opacity: savedConfirmationOpacity }]}>
                <Check size={14} color={IOS_COLORS.green} />
                <Text style={styles.savedText}>Saved</Text>
              </Animated.View>
            )}
          </View>
          <View style={styles.equipmentInputRow}>
            <TextInput
              style={styles.equipmentInput}
              placeholder="Note any issues to fix before next race..."
              placeholderTextColor={IOS_COLORS.gray3}
              value={equipmentNotes}
              onChangeText={setEquipmentNotes}
              onSubmitEditing={saveEquipmentNote}
              returnKeyType="done"
              blurOnSubmit={true}
              multiline
              numberOfLines={2}
              editable={!isSavingEquipment}
            />
            {equipmentNotes.trim().length > 0 && (
              <Pressable
                style={[styles.addButton, isSavingEquipment && styles.addButtonDisabled]}
                onPress={saveEquipmentNote}
                disabled={isSavingEquipment}
              >
                {isSavingEquipment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.addButtonText}>Add</Text>
                )}
              </Pressable>
            )}
          </View>
          {equipmentNotes.trim().length > 0 && (
            <Text style={styles.flowHint}>
              Will appear in "Days Before" checklist for next race
            </Text>
          )}
        </View>
      )}

      {/* AI Analysis Status */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Brain size={18} color={hasAIAnalysis ? IOS_COLORS.purple : IOS_COLORS.gray3} />
          <Text style={styles.sectionLabel}>AI ANALYSIS</Text>
        </View>
        {hasAIAnalysis ? (
          <>
            <View style={styles.analysisCard}>
              {analysisData?.focusNextRace && (
                <View style={styles.analysisItem}>
                  <Text style={styles.analysisLabel}>Focus for next race</Text>
                  <Text style={styles.analysisValue} numberOfLines={2}>
                    {analysisData.focusNextRace}
                  </Text>
                </View>
              )}
              {analysisData?.strengthIdentified && (
                <View style={styles.analysisItem}>
                  <Text style={styles.analysisLabel}>Strength</Text>
                  <Text style={styles.analysisValue} numberOfLines={2}>
                    {analysisData.strengthIdentified}
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <Pressable
            style={[styles.pendingContainer, (hasResult && hasKeyMoment) && styles.pendingContainerTappable]}
            onPress={(hasResult && hasKeyMoment && !isGeneratingAnalysis) ? triggerAnalysis : undefined}
            disabled={isGeneratingAnalysis || !(hasResult && hasKeyMoment)}
          >
            {isGeneratingAnalysis ? (
              <View style={styles.generatingRow}>
                <ActivityIndicator size="small" color={IOS_COLORS.purple} />
                <Text style={styles.pendingText}>Generating analysis...</Text>
              </View>
            ) : analysisError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{analysisError}</Text>
                <Pressable onPress={triggerAnalysis} style={styles.retryButton}>
                  <RefreshCw size={14} color={IOS_COLORS.blue} />
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.pendingText}>
                {hasResult && hasKeyMoment
                  ? 'Tap to generate AI analysis'
                  : 'Complete result and key moment first'}
              </Text>
            )}
          </Pressable>
        )}
      </View>

      {/* Coach Feedback (if any general feedback) */}
      {coachAnnotations.find(a => a.field === 'general') && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageSquare size={18} color={IOS_COLORS.green} />
            <Text style={styles.sectionLabel}>COACH FEEDBACK</Text>
          </View>
          <Marginalia
            author="Coach"
            comment={coachAnnotations.find(a => a.field === 'general')!.comment}
            date={coachAnnotations.find(a => a.field === 'general')!.createdAt}
            isNew={!coachAnnotations.find(a => a.field === 'general')!.isRead}
          />
        </View>
      )}

      {/* Completeness Indicator */}
      <View style={styles.completenessContainer}>
        <View style={styles.completenessRow}>
          <View style={[styles.completenessItem, hasResult && styles.completenessItemDone]}>
            <Text style={styles.completenessLabel}>Result</Text>
          </View>
          <View style={[styles.completenessItem, hasKeyMoment && styles.completenessItemDone]}>
            <Text style={styles.completenessLabel}>Key Moment</Text>
          </View>
          <View style={[styles.completenessItem, hasAIAnalysis && styles.completenessItemDone]}>
            <Text style={styles.completenessLabel}>Analysis</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },

  // Section
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  savedConfirmation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  savedText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.green,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
  },

  // Result
  resultValue: {
    fontSize: 24,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: -0.5,
  },

  // Key Moment
  keyMomentValue: {
    fontSize: 16,
    fontWeight: '500',
    color: IOS_COLORS.label,
    lineHeight: 22,
  },

  // Absence (Tufte style)
  absenceContainer: {
    gap: 4,
  },
  absencePlaceholder: {
    fontSize: 16,
    fontWeight: '400',
    color: IOS_COLORS.gray3,
    letterSpacing: 2,
  },
  absenceHint: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },

  // Equipment Notes
  equipmentInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  equipmentInput: {
    flex: 1,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: IOS_COLORS.label,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  flowHint: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.orange,
    fontStyle: 'italic',
  },

  // Analysis
  analysisCard: {
    backgroundColor: `${IOS_COLORS.purple}10`,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: IOS_COLORS.purple,
    gap: 12,
  },
  analysisItem: {
    gap: 4,
  },
  analysisLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.purple,
    textTransform: 'uppercase',
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
    lineHeight: 20,
  },

  // Pending
  pendingContainer: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  pendingContainerTappable: {
    backgroundColor: `${IOS_COLORS.purple}10`,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.purple}30`,
    borderStyle: 'dashed',
  },
  pendingText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
  },
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorContainer: {
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.red,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: `${IOS_COLORS.blue}15`,
    borderRadius: 6,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },

  // Completeness
  completenessContainer: {
    marginTop: 8,
  },
  completenessRow: {
    flexDirection: 'row',
    gap: 8,
  },
  completenessItem: {
    flex: 1,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  completenessItemDone: {
    backgroundColor: `${IOS_COLORS.green}20`,
  },
  completenessLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
  },
});

export default AfterRaceContent;
