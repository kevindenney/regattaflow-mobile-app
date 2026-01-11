/**
 * AfterRaceContent - After Race Phase Content
 *
 * Content shown when selectedPhase === 'after_race'
 * Includes:
 * - Result entry (Tufte "absence as interface")
 * - 6 phase ratings (structured debrief)
 * - Equipment notes (flows to next race)
 * - AI analysis status
 * - Coach feedback
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ActivityIndicator, Animated } from 'react-native';
import { Trophy, Wrench, Brain, MessageSquare, RefreshCw, Check, ChevronRight, ClipboardList } from 'lucide-react-native';

import { CardRaceData } from '../../types';
import { useRaceAnalysisState } from '@/hooks/useRaceAnalysisState';
import { useRaceAnalysisData } from '@/hooks/useRaceAnalysisData';
import { useEquipmentFlow } from '@/hooks/useEquipmentFlow';
import { useDebriefInterview } from '@/hooks/useDebriefInterview';
import { Marginalia } from '@/components/ui/Marginalia';
import { RaceAnalysisService } from '@/services/RaceAnalysisService';
import { StructuredDebriefInterview } from '@/components/races/review/StructuredDebriefInterview';

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
  onOpenDetailedReview?: () => void;
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

/**
 * ReviewChecklistItem - Checklist item wrapper for review sections
 */
function ReviewChecklistItem({
  icon: Icon,
  label,
  isCompleted,
  isDisabled,
  onPress,
  iconColor,
  children,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  isCompleted: boolean;
  isDisabled?: boolean;
  onPress?: () => void;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.checklistSection}>
      <Pressable
        style={styles.checklistHeader}
        onPress={onPress}
        disabled={isDisabled || !onPress}
      >
        <View style={[
          styles.checkbox,
          isCompleted && styles.checkboxDone,
          isDisabled && styles.checkboxDisabled
        ]}>
          {isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Icon size={18} color={isCompleted ? iconColor : IOS_COLORS.gray3} />
        <Text style={[
          styles.checklistLabel,
          isCompleted && styles.checklistLabelDone
        ]}>
          {label}
        </Text>
      </Pressable>
      <View style={styles.checklistContent}>
        {children}
      </View>
    </View>
  );
}

export function AfterRaceContent({
  race,
  userId,
  onOpenPostRaceInterview,
  onOpenDetailedReview,
  isExpanded = true,
}: AfterRaceContentProps) {
  // Analysis state and data
  const { state: analysisState, refetch: refetchState } = useRaceAnalysisState(race.id, race.date, userId);
  const { analysisData, refetch: refetchData } = useRaceAnalysisData(race.id, userId);

  // Structured debrief interview
  const {
    progress: debriefProgress,
    isComplete: debriefComplete,
  } = useDebriefInterview({
    raceId: race.id,
    userId,
  });

  // Modal state for interview
  const [showInterviewModal, setShowInterviewModal] = useState(false);

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

  // ==========================================================================
  // RENDER
  // ==========================================================================

  // Calculate progress (3 main items: 1 result + 1 debrief + 1 equipment)
  const hasEquipmentNote = equipmentNotes.trim().length > 0;
  // Count: 1 (result) + 1 (debrief complete) + 1 (equipment if set)
  const completedCount = (hasResult ? 1 : 0) + (debriefComplete ? 1 : 0) + (hasEquipmentNote ? 1 : 0);
  const totalItems = 3;
  // AI enabled when result + debrief complete
  const canGenerateAI = hasResult && debriefComplete;

  return (
    <View style={styles.container}>
      {/* Result Section */}
      <ReviewChecklistItem
        icon={Trophy}
        label="Record result"
        isCompleted={!!hasResult}
        onPress={!hasResult ? onOpenPostRaceInterview : undefined}
        iconColor={IOS_COLORS.green}
      >
        {hasResult ? (
          <Text style={styles.resultValue}>{resultText}</Text>
        ) : (
          <Text style={styles.absenceHint}>Tap to record your finishing position</Text>
        )}
        {coachAnnotations.find(a => a.field === 'result') && (
          <Marginalia
            author="Coach"
            comment={coachAnnotations.find(a => a.field === 'result')!.comment}
            isNew={!coachAnnotations.find(a => a.field === 'result')!.isRead}
            variant="compact"
          />
        )}
      </ReviewChecklistItem>

      {/* Structured Debrief Section */}
      <ReviewChecklistItem
        icon={ClipboardList}
        label="Structured debrief"
        isCompleted={debriefComplete}
        onPress={() => setShowInterviewModal(true)}
        iconColor={IOS_COLORS.orange}
      >
        {debriefComplete ? (
          <View style={styles.debriefCompleteContainer}>
            <Text style={styles.debriefCompleteText}>
              {debriefProgress.answeredCount} questions answered
            </Text>
            <Pressable
              style={styles.debriefEditButton}
              onPress={() => setShowInterviewModal(true)}
            >
              <Text style={styles.debriefEditText}>Review / Edit</Text>
            </Pressable>
          </View>
        ) : debriefProgress.answeredCount > 0 ? (
          <View style={styles.debriefProgressContainer}>
            <Text style={styles.debriefProgressText}>
              {debriefProgress.answeredCount} of {debriefProgress.total} answered
            </Text>
            <Pressable
              style={styles.debriefContinueButton}
              onPress={() => setShowInterviewModal(true)}
            >
              <Text style={styles.debriefContinueText}>Continue</Text>
              <ChevronRight size={16} color={IOS_COLORS.blue} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.debriefStartButton}
            onPress={() => setShowInterviewModal(true)}
          >
            <Text style={styles.debriefStartText}>Start debrief</Text>
            <ChevronRight size={16} color="#FFFFFF" />
          </Pressable>
        )}
      </ReviewChecklistItem>

      {/* Equipment Notes Section (expanded only) */}
      {isExpanded && (
        <ReviewChecklistItem
          icon={Wrench}
          label="Note equipment issues"
          isCompleted={hasEquipmentNote}
          iconColor={IOS_COLORS.blue}
        >
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
          {showSavedConfirmation && (
            <Animated.View style={[styles.savedConfirmation, { opacity: savedConfirmationOpacity }]}>
              <Check size={14} color={IOS_COLORS.green} />
              <Text style={styles.savedText}>Saved to next race</Text>
            </Animated.View>
          )}
          {equipmentNotes.trim().length > 0 && !showSavedConfirmation && (
            <Text style={styles.flowHint}>
              Will appear in "Days Before" checklist for next race
            </Text>
          )}
        </ReviewChecklistItem>
      )}

      {/* AI Analysis Section */}
      <ReviewChecklistItem
        icon={Brain}
        label="Review with AI"
        isCompleted={!!hasAIAnalysis}
        isDisabled={!canGenerateAI && !hasAIAnalysis}
        onPress={canGenerateAI && !hasAIAnalysis && !isGeneratingAnalysis ? triggerAnalysis : undefined}
        iconColor={IOS_COLORS.purple}
      >
        {hasAIAnalysis ? (
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
        ) : isGeneratingAnalysis ? (
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
          <Text style={[styles.absenceHint, !canGenerateAI && styles.disabledHint]}>
            {canGenerateAI
              ? 'Tap to generate AI analysis'
              : 'Complete result and all phase ratings first'}
          </Text>
        )}
      </ReviewChecklistItem>

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

      {/* Detailed Review Entry Point */}
      {hasResult && debriefComplete && onOpenDetailedReview && isExpanded && (
        <Pressable style={styles.detailedReviewButton} onPress={onOpenDetailedReview}>
          <View style={styles.detailedReviewContent}>
            <Text style={styles.detailedReviewTitle}>Debrief complete</Text>
            <Text style={styles.detailedReviewSubtitle}>
              Want to go deeper? Add tactical details, tack counts, and more.
            </Text>
          </View>
          <ChevronRight size={20} color={IOS_COLORS.blue} />
        </Pressable>
      )}

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>{completedCount}/{totalItems} completed</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(completedCount / totalItems) * 100}%` }]} />
        </View>
      </View>

      {/* Structured Debrief Interview Modal */}
      {userId && (
        <StructuredDebriefInterview
          visible={showInterviewModal}
          raceId={race.id}
          userId={userId}
          raceName={race.name}
          onClose={() => setShowInterviewModal(false)}
          onComplete={() => {
            setShowInterviewModal(false);
            // Refetch state to update UI
            refetchState();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },

  // Checklist
  checklistSection: {
    gap: 8,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checklistContent: {
    marginLeft: 30,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: IOS_COLORS.gray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: IOS_COLORS.green,
    borderColor: IOS_COLORS.green,
  },
  checkboxDisabled: {
    opacity: 0.4,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  checklistLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  checklistLabelDone: {
    textDecorationLine: 'line-through',
    color: IOS_COLORS.gray,
  },

  // Section (for coach feedback)
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
    marginTop: 4,
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

  // Structured Debrief Section
  debriefCompleteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  debriefCompleteText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.green,
  },
  debriefEditButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: `${IOS_COLORS.blue}15`,
    borderRadius: 8,
  },
  debriefEditText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  debriefProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  debriefProgressText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  debriefContinueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: `${IOS_COLORS.blue}15`,
    borderRadius: 8,
    gap: 2,
  },
  debriefContinueText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  debriefStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IOS_COLORS.orange,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 4,
  },
  debriefStartText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
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
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  disabledHint: {
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
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

  // Progress
  progressContainer: {
    marginTop: 8,
    gap: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: IOS_COLORS.gray5,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: IOS_COLORS.green,
    borderRadius: 2,
  },

  // Detailed Review Button
  detailedReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${IOS_COLORS.blue}10`,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.blue}30`,
  },
  detailedReviewContent: {
    flex: 1,
    gap: 2,
  },
  detailedReviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  detailedReviewSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },
});

export default AfterRaceContent;
