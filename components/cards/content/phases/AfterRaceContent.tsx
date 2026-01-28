/**
 * AfterRaceContent - After Race Phase Content
 *
 * Content shown when selectedPhase === 'after_race'
 * Tufte-inspired flat layout - all items visible, no hidden accordions.
 *
 * Includes:
 * - Race Result section
 * - Structured Debrief section
 * - Performance Analysis (flat checklist items)
 * - Learning & Improvement (flat checklist items)
 * - Equipment notes (flows to next race)
 * - AI analysis status
 * - Coach feedback
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ActivityIndicator, Animated } from 'react-native';
import {
  Trophy,
  Wrench,
  Brain,
  MessageSquare,
  RefreshCw,
  Check,
  ChevronRight,
  ClipboardList,
  Target,
  GraduationCap,
  Wind,
  Waves,
  Lightbulb,
  Calendar,
} from 'lucide-react-native';

import { CardRaceData } from '../../types';
import { useRaceAnalysisState } from '@/hooks/useRaceAnalysisState';
import { useRaceAnalysisData } from '@/hooks/useRaceAnalysisData';
import { useEquipmentFlow } from '@/hooks/useEquipmentFlow';
import { useDebriefInterview } from '@/hooks/useDebriefInterview';
import { useEducationalChecklist } from '@/hooks/useEducationalChecklist';
import { Marginalia } from '@/components/ui/Marginalia';
import { RaceAnalysisService } from '@/services/RaceAnalysisService';
import { StructuredDebriefInterview } from '@/components/races/review/StructuredDebriefInterview';
import { NextRaceFocusSection } from '@/components/races/review/NextRaceFocusSection';
import { RaceContentActions } from '@/components/races/RaceContentActions';
import {
  POST_RACE_REVIEW_CONFIG,
  LEARNING_CAPTURE_CONFIG,
} from '@/lib/educationalChecklistConfig';
import { useAuth } from '@/providers/AuthProvider';

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
 * Format wind data for display
 */
function formatWind(wind?: { direction: string; speedMin: number; speedMax: number }): string {
  if (!wind) return '—';
  const dir = wind.direction || '?';
  if (wind.speedMin === wind.speedMax) {
    return `${dir} ${wind.speedMin} kts`;
  }
  return `${dir} ${wind.speedMin}-${wind.speedMax} kts`;
}

/**
 * Format tide state for display
 */
function formatTide(tide?: { state: string; height?: number; direction?: string }): string {
  if (!tide || !tide.state) return '—';
  // Capitalize first letter
  const state = tide.state.charAt(0).toUpperCase() + tide.state.slice(1);
  return state;
}

/**
 * Format days ago for display
 */
function formatDaysAgo(dateStr: string): string {
  const raceDate = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - raceDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  return `${Math.floor(diffDays / 30)} months ago`;
}

/**
 * Simple checklist item - Square checkbox + label, matching DaysBeforeContent
 * No icon prop - Tufte principle: let the data speak, minimal chrome
 */
function SimpleChecklistItem({
  label,
  isCompleted,
  isDisabled,
  onPress,
  subtitle,
}: {
  label: string;
  isCompleted: boolean;
  isDisabled?: boolean;
  onPress?: () => void;
  subtitle?: string;
}) {
  return (
    <Pressable
      style={styles.checklistItem}
      onPress={onPress}
      disabled={isDisabled || !onPress}
    >
      {/* Square checkbox (22x22, borderRadius 6) matching DaysBeforeContent */}
      <View style={[
        styles.checkbox,
        isCompleted && styles.checkboxDone,
        isDisabled && styles.checkboxDisabled,
      ]}>
        {isCompleted && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.checklistItemContent}>
        <Text style={[
          styles.checklistLabel,
          isCompleted && styles.checklistLabelDone,
          isDisabled && styles.checklistLabelDisabled,
        ]}>
          {label}
        </Text>
        {subtitle && (
          <Text style={styles.checklistSubtitle}>{subtitle}</Text>
        )}
      </View>
    </Pressable>
  );
}

/**
 * ReviewChecklistItem - Extended item with children content area
 * Used for items that need to show additional content below the checkbox
 */
function ReviewChecklistItem({
  label,
  isCompleted,
  isDisabled,
  onPress,
  children,
}: {
  label: string;
  isCompleted: boolean;
  isDisabled?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.checklistItemRow}>
      <Pressable
        style={styles.checklistHeader}
        onPress={onPress}
        disabled={isDisabled || !onPress}
      >
        {/* Square checkbox (22x22, borderRadius 6) matching DaysBeforeContent */}
        <View style={[
          styles.checkbox,
          isCompleted && styles.checkboxDone,
          isDisabled && styles.checkboxDisabled,
        ]}>
          {isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[
          styles.checklistLabel,
          isCompleted && styles.checklistLabelDone,
          isDisabled && styles.checklistLabelDisabled
        ]}>
          {label}
        </Text>
      </Pressable>
      {children && (
        <View style={styles.checklistContent}>
          {children}
        </View>
      )}
    </View>
  );
}

export function AfterRaceContent({
  race,
  userId: propsUserId,
  onOpenPostRaceInterview,
  onOpenDetailedReview,
  isExpanded = true,
}: AfterRaceContentProps) {
  // Get current user if userId not provided
  const { user } = useAuth();
  const userId = propsUserId || user?.id;

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

    if (!trimmedNote) {
      return;
    }

    setIsSavingEquipment(true);
    try {
      await addIssue(trimmedNote, 'medium', race.id, race.name);
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
  // Educational checklist progress and toggles
  // ==========================================================================
  const {
    completedCount: performanceCompletedCount,
    totalCount: performanceTotalCount,
    isCompleted: isPerformanceItemCompleted,
    toggleCompletion: togglePerformanceItem,
  } = useEducationalChecklist({
    raceId: race.id,
    userId,
    sectionId: POST_RACE_REVIEW_CONFIG.id,
    items: POST_RACE_REVIEW_CONFIG.items,
  });

  const {
    completedCount: learningCompletedCount,
    totalCount: learningTotalCount,
    isCompleted: isLearningItemCompleted,
    toggleCompletion: toggleLearningItem,
  } = useEducationalChecklist({
    raceId: race.id,
    userId,
    sectionId: LEARNING_CAPTURE_CONFIG.id,
    items: LEARNING_CAPTURE_CONFIG.items,
  });

  // ==========================================================================
  // RENDER
  // ==========================================================================

  // Calculate progress
  const hasEquipmentNote = equipmentNotes.trim().length > 0;
  // Core items: result, debrief, equipment
  const coreCompleted = (hasResult ? 1 : 0) + (debriefComplete ? 1 : 0) + (hasEquipmentNote ? 1 : 0);
  const coreTotal = 3;
  // Total including educational items
  const totalCompleted = coreCompleted + performanceCompletedCount + learningCompletedCount;
  const totalItems = coreTotal + performanceTotalCount + learningTotalCount;
  // AI enabled when result + debrief complete
  const canGenerateAI = hasResult && debriefComplete;

  return (
    <View style={styles.container}>
      {/* Section 1: Race Result - Flat header */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Trophy size={16} color={IOS_COLORS.green} />
          <Text style={styles.sectionLabel}>RESULT</Text>
          {hasResult && <Text style={styles.sectionCount}>{resultText}</Text>}
        </View>
        <ReviewChecklistItem
          label="Record race result"
          isCompleted={!!hasResult}
          onPress={!hasResult ? onOpenPostRaceInterview : undefined}
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
      </View>

      {/* Section 2: Structured Debrief - Flat header */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ClipboardList size={16} color={IOS_COLORS.orange} />
          <Text style={styles.sectionLabel}>DEBRIEF</Text>
          <Text style={styles.sectionCount}>
            {debriefComplete ? `${debriefProgress.answeredCount} answered` : debriefProgress.answeredCount > 0 ? `${debriefProgress.answeredCount}/${debriefProgress.total}` : ''}
          </Text>
        </View>
        <ReviewChecklistItem
          label="Complete structured debrief"
          isCompleted={debriefComplete}
          onPress={() => setShowInterviewModal(true)}
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
      </View>

      {/* Section 3: Performance Analysis - Flat items directly rendered */}
      {isExpanded && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={16} color={IOS_COLORS.blue} />
            <Text style={styles.sectionLabel}>PERFORMANCE</Text>
            <Text style={styles.sectionCount}>{performanceCompletedCount}/{performanceTotalCount}</Text>
          </View>
          <View style={styles.checklistContainer}>
            {POST_RACE_REVIEW_CONFIG.items.map((item) => (
              <SimpleChecklistItem
                key={item.id}
                label={item.label}
                isCompleted={isPerformanceItemCompleted(item.id)}
                onPress={() => togglePerformanceItem(item.id)}
                subtitle={item.description}
              />
            ))}
          </View>
        </View>
      )}

      {/* Section 4: Learning & Improvement - Flat items directly rendered */}
      {isExpanded && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <GraduationCap size={16} color={IOS_COLORS.purple} />
            <Text style={styles.sectionLabel}>LEARNING</Text>
            <Text style={styles.sectionCount}>{learningCompletedCount}/{learningTotalCount}</Text>
          </View>
          <View style={styles.checklistContainer}>
            {LEARNING_CAPTURE_CONFIG.items.map((item) => (
              <SimpleChecklistItem
                key={item.id}
                label={item.label}
                isCompleted={isLearningItemCompleted(item.id)}
                onPress={() => toggleLearningItem(item.id)}
                subtitle={item.description}
              />
            ))}
          </View>
        </View>
      )}

      {/* Section 5: Next Race Focus - Deliberate practice loop */}
      {isExpanded && (
        <NextRaceFocusSection
          raceId={race.id}
          userId={userId}
          isExpanded={isExpanded}
        />
      )}

      {/* Section 6: Equipment & Maintenance - Flat header */}
      {isExpanded && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Wrench size={16} color={IOS_COLORS.blue} />
            <Text style={styles.sectionLabel}>EQUIPMENT</Text>
            {hasEquipmentNote && <Text style={styles.sectionCount}>Issues noted</Text>}
          </View>
          <ReviewChecklistItem
            label="Note equipment issues"
            isCompleted={hasEquipmentNote}
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
        </View>
      )}

      {/* Section 7: AI Analysis - Flat header */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Brain size={16} color={IOS_COLORS.purple} />
          <Text style={styles.sectionLabel}>AI ANALYSIS</Text>
          <Text style={styles.sectionCount}>
            {hasAIAnalysis ? 'Generated' : canGenerateAI ? 'Ready' : 'Complete debrief first'}
          </Text>
        </View>
        <ReviewChecklistItem
          label="Generate AI analysis"
          isCompleted={!!hasAIAnalysis}
          isDisabled={!canGenerateAI && !hasAIAnalysis}
          onPress={canGenerateAI && !hasAIAnalysis && !isGeneratingAnalysis ? triggerAnalysis : undefined}
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
                : 'Complete result and structured debrief first'}
            </Text>
          )}
        </ReviewChecklistItem>
      </View>

      {/* Coach Feedback (if any general feedback) - Flat header */}
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

      {/* Share Your Analysis - Flat header */}
      {isExpanded && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lightbulb size={16} color={IOS_COLORS.purple} />
            <Text style={styles.sectionLabel}>SHARE WITH FLEET</Text>
          </View>
          <RaceContentActions
            regattaId={race.id}
            raceName={race.name}
            raceDate={race.date}
            variant="full"
          />
        </View>
      )}

      {/* Race Summary - Bottom of Review */}
      {isExpanded && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>RACE SUMMARY</Text>
            <View style={styles.summaryDateBadge}>
              <Calendar size={12} color={IOS_COLORS.gray} />
              <Text style={styles.summaryDateText}>{formatDaysAgo(race.date)}</Text>
            </View>
          </View>
          <View style={styles.summaryGrid}>
            {/* Result */}
            <View style={styles.summaryItem}>
              <Trophy size={14} color={hasResult ? IOS_COLORS.green : IOS_COLORS.gray3} />
              <Text style={styles.summaryLabel}>Result</Text>
              <Text style={[styles.summaryValue, !hasResult && styles.summaryValueEmpty]}>
                {resultText || '—'}
              </Text>
            </View>
            {/* Wind */}
            <View style={styles.summaryItem}>
              <Wind size={14} color={race.wind ? IOS_COLORS.blue : IOS_COLORS.gray3} />
              <Text style={styles.summaryLabel}>Wind</Text>
              <Text style={[styles.summaryValue, !race.wind && styles.summaryValueEmpty]}>
                {formatWind(race.wind)}
              </Text>
            </View>
            {/* Tide */}
            <View style={styles.summaryItem}>
              <Waves size={14} color={race.tide ? IOS_COLORS.blue : IOS_COLORS.gray3} />
              <Text style={styles.summaryLabel}>Tide</Text>
              <Text style={[styles.summaryValue, !race.tide && styles.summaryValueEmpty]}>
                {formatTide(race.tide)}
              </Text>
            </View>
            {/* Key Learning - Full width */}
            <View style={styles.summaryItemFull}>
              <Lightbulb size={14} color={analysisData?.keyLearning ? IOS_COLORS.orange : IOS_COLORS.gray3} />
              <Text style={styles.summaryLabel}>Key Learning</Text>
              <Text
                style={[styles.summaryValueLarge, !analysisData?.keyLearning && styles.summaryValueEmpty]}
                numberOfLines={2}
              >
                {analysisData?.keyLearning || '—'}
              </Text>
            </View>
          </View>
          {/* Completion indicators */}
          <View style={styles.completionRow}>
            {hasResult && (
              <View style={[styles.completionBadge, styles.completionBadgeGreen]}>
                <Check size={10} color={IOS_COLORS.green} />
                <Text style={[styles.completionBadgeText, styles.completionBadgeTextGreen]}>Result</Text>
              </View>
            )}
            {debriefComplete && (
              <View style={[styles.completionBadge, styles.completionBadgeOrange]}>
                <Check size={10} color={IOS_COLORS.orange} />
                <Text style={[styles.completionBadgeText, styles.completionBadgeTextOrange]}>Debrief</Text>
              </View>
            )}
            {hasAIAnalysis && (
              <View style={[styles.completionBadge, styles.completionBadgePurple]}>
                <Check size={10} color={IOS_COLORS.purple} />
                <Text style={[styles.completionBadgeText, styles.completionBadgeTextPurple]}>AI Analysis</Text>
              </View>
            )}
            {!hasResult && !debriefComplete && !hasAIAnalysis && (
              <Text style={styles.completionEmptyText}>No review data yet</Text>
            )}
          </View>
        </View>
      )}

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>{totalCompleted}/{totalItems} completed</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(totalCompleted / totalItems) * 100}%` }]} />
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
    flex: 1,
    gap: 16,
  },

  // Section - Flat header pattern matching DaysBeforeContent
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },

  // Checklist container - Simple list of items
  checklistContainer: {
    gap: 10,
  },

  // Simple checklist item - Row layout matching DaysBeforeContent
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checklistItemContent: {
    flex: 1,
    gap: 2,
  },
  checklistSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.gray,
  },

  // Extended checklist item with children
  checklistItemRow: {
    gap: 8,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checklistContent: {
    marginLeft: 32,
  },

  // Square checkbox (22x22, borderRadius 6) matching DaysBeforeContent
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
    borderColor: IOS_COLORS.gray5,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  checklistLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  checklistLabelDone: {
    textDecorationLine: 'line-through',
    textDecorationColor: IOS_COLORS.gray,
    color: IOS_COLORS.gray,
  },
  checklistLabelDisabled: {
    color: IOS_COLORS.gray,
  },

  // Confirmation animation
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

  // Race Summary Section
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
  },
  summaryDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.gray6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  summaryDateText: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    width: '48%',
    gap: 4,
  },
  summaryItemFull: {
    width: '100%',
    gap: 4,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  summaryValueLarge: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.label,
    lineHeight: 18,
  },
  summaryValueEmpty: {
    color: IOS_COLORS.gray3,
    fontWeight: '400',
  },
  completionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray5,
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  completionBadgeGreen: {
    backgroundColor: `${IOS_COLORS.green}15`,
  },
  completionBadgeOrange: {
    backgroundColor: `${IOS_COLORS.orange}15`,
  },
  completionBadgePurple: {
    backgroundColor: `${IOS_COLORS.purple}15`,
  },
  completionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  completionBadgeTextGreen: {
    color: IOS_COLORS.green,
  },
  completionBadgeTextOrange: {
    color: IOS_COLORS.orange,
  },
  completionBadgeTextPurple: {
    color: IOS_COLORS.purple,
  },
  completionEmptyText: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
  },
});

export default AfterRaceContent;
