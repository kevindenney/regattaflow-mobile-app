import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/Colors';
import { executionEvaluationService, ExecutionRatings, ExecutionNotes } from '@/services/ExecutionEvaluationService';
import { strategicPlanningService } from '@/services/StrategicPlanningService';

interface ExecutionEvaluationCardProps {
  raceId: string;
  sailorId: string;
  coachId?: string;
  onEvaluationUpdated?: () => void;
}

interface PhaseConfig {
  ratingKey: keyof ExecutionRatings;
  notesKey: keyof ExecutionNotes;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const RACE_PHASES: PhaseConfig[] = [
  {
    ratingKey: 'rigTuningExecutionRating',
    notesKey: 'rigTuningExecutionNotes',
    title: 'Rig Tuning',
    icon: 'settings-outline',
  },
  {
    ratingKey: 'prestartExecutionRating',
    notesKey: 'prestartExecutionNotes',
    title: 'Pre-Start',
    icon: 'time-outline',
  },
  {
    ratingKey: 'startExecutionRating',
    notesKey: 'startExecutionNotes',
    title: 'Start',
    icon: 'flag-outline',
  },
  {
    ratingKey: 'upwindExecutionRating',
    notesKey: 'upwindExecutionNotes',
    title: 'Upwind',
    icon: 'arrow-up-outline',
  },
  {
    ratingKey: 'windwardMarkExecutionRating',
    notesKey: 'windwardMarkExecutionNotes',
    title: 'Windward Mark',
    icon: 'navigate-circle-outline',
  },
  {
    ratingKey: 'downwindExecutionRating',
    notesKey: 'downwindExecutionNotes',
    title: 'Downwind',
    icon: 'arrow-down-outline',
  },
  {
    ratingKey: 'leewardMarkExecutionRating',
    notesKey: 'leewardMarkExecutionNotes',
    title: 'Leeward Mark',
    icon: 'navigate-circle-outline',
  },
  {
    ratingKey: 'finishExecutionRating',
    notesKey: 'finishExecutionNotes',
    title: 'Finish',
    icon: 'checkmark-circle-outline',
  },
];

export function ExecutionEvaluationCard({ raceId, sailorId, coachId, onEvaluationUpdated }: ExecutionEvaluationCardProps) {
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [strategicPlan, setStrategicPlan] = useState<Record<string, string>>({});
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [showPlanComparison, setShowPlanComparison] = useState(true);
  const [isShared, setIsShared] = useState(false);
  const [sharingWithCoach, setSharingWithCoach] = useState(false);

  useEffect(() => {
    loadData();
  }, [raceId, sailorId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load execution evaluation
      const analysis = await executionEvaluationService.getAnalysisWithExecution(raceId, sailorId);

      if (!analysis) {
        setRatings({});
        setNotes({});
        setStrategicPlan({});
        return;
      }

      // Map ratings
      const ratingsMap: Record<string, number> = {};
      RACE_PHASES.forEach((phase) => {
        const columnKey = phase.ratingKey.replace(/([A-Z])/g, '_$1').toLowerCase();
        const rating = (analysis as Record<string, number | null | undefined>)[columnKey];

        if (typeof rating === 'number') {
          ratingsMap[phase.ratingKey] = rating;
        }
      });
      setRatings(ratingsMap);

      // Map notes
      const notesMap: Record<string, string> = {};
      RACE_PHASES.forEach((phase) => {
        const columnKey = phase.notesKey.replace(/([A-Z])/g, '_$1').toLowerCase();
        const note = (analysis as Record<string, string | null | undefined>)[columnKey];

        if (typeof note === 'string' && note.trim().length > 0) {
          notesMap[phase.notesKey] = note;
        }
      });
      setNotes(notesMap);

      // Load strategic plan if linked
      let planData: Record<string, string> = {};
      if (analysis.preparation_id) {
        const prep = await strategicPlanningService.getPreparationById(analysis.preparation_id);

        if (prep) {
          const planFields: Record<string, string | null | undefined> = {
            rigTuningStrategy: prep.rig_tuning_strategy,
            prestartStrategy: prep.prestart_strategy,
            startStrategy: prep.start_strategy,
            upwindStrategy: prep.upwind_strategy,
            windwardMarkStrategy: prep.windward_mark_strategy,
            downwindStrategy: prep.downwind_strategy,
            leewardMarkStrategy: prep.leeward_mark_strategy,
            finishStrategy: prep.finish_strategy,
          };

          Object.entries(planFields).forEach(([key, value]) => {
            if (typeof value === 'string' && value.trim().length > 0) {
              planData[key] = value;
            }
          });
        }
      }
      setStrategicPlan(planData);
      setIsShared(analysis.execution_shared_with_coach || false);
    } catch (error) {
      console.error('Error loading execution data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRating = async (phaseKey: keyof ExecutionRatings, rating: number) => {
    try {
      setRatings((prev) => ({ ...prev, [phaseKey]: rating }));

      const success = await executionEvaluationService.updatePhaseExecutionRating(
        raceId,
        sailorId,
        phaseKey,
        rating
      );

      if (success && onEvaluationUpdated) {
        onEvaluationUpdated();
      }
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  const updateNotes = async (phaseKey: keyof ExecutionNotes, value: string) => {
    try {
      setNotes((prev) => ({ ...prev, [phaseKey]: value }));

      const success = await executionEvaluationService.updatePhaseExecutionNotes(
        raceId,
        sailorId,
        phaseKey,
        value
      );

      if (success && onEvaluationUpdated) {
        onEvaluationUpdated();
      }
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const getCompletionPercentage = (): number => {
    const completedRatings = Object.keys(ratings).length;
    return Math.round((completedRatings / RACE_PHASES.length) * 100);
  };

  const getAverageRating = (): number | null => {
    const ratingValues = Object.values(ratings).filter((r) => r !== null && r !== undefined);
    if (ratingValues.length === 0) return null;

    const sum = ratingValues.reduce((acc, rating) => acc + rating, 0);
    return Math.round((sum / ratingValues.length) * 10) / 10;
  };

  const togglePhase = (phaseKey: string) => {
    setExpandedPhase(expandedPhase === phaseKey ? null : phaseKey);
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 4) return colors.success.default;
    if (rating >= 3) return colors.warning.default;
    return colors.error.default;
  };

  const handleShareToggle = async () => {
    if (!coachId) {
      Alert.alert(
        'No Coach Assigned',
        'You need to assign a coach before sharing your execution evaluation.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setSharingWithCoach(true);

      if (isShared) {
        // Unshare
        const success = await executionEvaluationService.unshareFromCoach(raceId, sailorId);
        if (success) {
          setIsShared(false);
          Alert.alert('Success', 'Execution evaluation unshared from coach');
        }
      } else {
        // Share
        const success = await executionEvaluationService.shareWithCoach(raceId, sailorId, coachId);
        if (success) {
          setIsShared(true);
          Alert.alert('Success', 'Execution evaluation shared with your coach');
        }
      }
    } catch (error) {
      console.error('Error toggling share:', error);
      Alert.alert('Error', 'Failed to update sharing. Please try again.');
    } finally {
      setSharingWithCoach(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary.default} />
      </View>
    );
  }

  const completionPercentage = getCompletionPercentage();
  const averageRating = getAverageRating();
  const hasPlanDetails = Object.keys(strategicPlan).length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="clipboard-outline" size={20} color={colors.primary.default} />
          <Text style={styles.title}>Execution Evaluation</Text>
        </View>
        <View style={styles.headerRight}>
          {averageRating !== null && (
            <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(averageRating) }]}>
              <Text style={styles.ratingBadgeText}>{averageRating.toFixed(1)}/5</Text>
            </View>
          )}
          <View style={styles.completionBadge}>
            <Text style={styles.completionText}>{completionPercentage}%</Text>
          </View>
        </View>
      </View>

      <Text style={styles.description}>
        Rate how well you executed your planned strategy for each phase. Compare your plan vs what
        actually happened.
      </Text>

      {completionPercentage < 100 && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
        </View>
      )}

      {hasPlanDetails && (
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowPlanComparison(!showPlanComparison)}
        >
          <Ionicons
            name={showPlanComparison ? 'eye-off-outline' : 'eye-outline'}
            size={16}
            color={colors.primary.default}
          />
          <Text style={styles.toggleText}>
            {showPlanComparison ? 'Hide' : 'Show'} Original Plan
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.phasesContainer} showsVerticalScrollIndicator={false}>
        {RACE_PHASES.map((phase) => {
          const isExpanded = expandedPhase === phase.ratingKey;
          const hasRating = ratings[phase.ratingKey] !== undefined;
          const hasNotes = notes[phase.notesKey] && notes[phase.notesKey].trim().length > 0;
          const planKey = phase.notesKey.replace('ExecutionNotes', 'Strategy');
          const hasPlan = strategicPlan[planKey] && strategicPlan[planKey].trim().length > 0;

          return (
            <View key={phase.ratingKey} style={styles.phaseCard}>
              <TouchableOpacity
                style={styles.phaseHeader}
                onPress={() => togglePhase(phase.ratingKey)}
                activeOpacity={0.7}
              >
                <View style={styles.phaseHeaderLeft}>
                  <Ionicons
                    name={phase.icon}
                    size={18}
                    color={hasRating ? colors.primary.default : colors.text.tertiary}
                  />
                  <Text style={[styles.phaseTitle, hasRating && styles.phaseTitleCompleted]}>
                    {phase.title}
                  </Text>
                  {hasRating && (
                    <View
                      style={[
                        styles.phaseRatingBadge,
                        { backgroundColor: getRatingColor(ratings[phase.ratingKey]) },
                      ]}
                    >
                      <Text style={styles.phaseRatingText}>{ratings[phase.ratingKey]}</Text>
                    </View>
                  )}
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.phaseContent}>
                  {/* Show original plan if available */}
                  {showPlanComparison && hasPlan && (
                    <View style={styles.planBox}>
                      <View style={styles.planHeader}>
                        <Ionicons name="document-text-outline" size={14} color={colors.primary.default} />
                        <Text style={styles.planLabel}>Your Plan</Text>
                      </View>
                      <Text style={styles.planText}>{strategicPlan[planKey]}</Text>
                    </View>
                  )}

                  {/* Rating buttons */}
                  <Text style={styles.ratingLabel}>How well did you execute this?</Text>
                  <View style={styles.ratingButtons}>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <TouchableOpacity
                        key={rating}
                        style={[
                          styles.ratingButton,
                          ratings[phase.ratingKey] === rating && styles.ratingButtonSelected,
                          ratings[phase.ratingKey] === rating && {
                            backgroundColor: getRatingColor(rating),
                          },
                        ]}
                        onPress={() => updateRating(phase.ratingKey, rating)}
                      >
                        <Text
                          style={[
                            styles.ratingButtonText,
                            ratings[phase.ratingKey] === rating && styles.ratingButtonTextSelected,
                          ]}
                        >
                          {rating}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.ratingLegend}>
                    <Text style={styles.ratingLegendText}>1 = Poorly</Text>
                    <Text style={styles.ratingLegendText}>5 = Perfectly</Text>
                  </View>

                  {/* Execution notes */}
                  <Text style={styles.notesLabel}>What actually happened?</Text>
                  <TextInput
                    style={styles.input}
                    value={notes[phase.notesKey] || ''}
                    onChangeText={(value) => updateNotes(phase.notesKey, value)}
                    placeholder="Describe what you actually did and how it differed from your plan..."
                    placeholderTextColor={colors.text.tertiary}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              )}

              {!isExpanded && (hasRating || hasNotes) && (
                <View style={styles.phaseSummary}>
                  {hasRating && (
                    <Text style={styles.phaseSummaryText}>
                      Rating: {ratings[phase.ratingKey]}/5
                    </Text>
                  )}
                  {hasNotes && (
                    <Text style={styles.phasePreview} numberOfLines={2}>
                      {notes[phase.notesKey]}
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Share with Coach */}
      {completionPercentage > 0 && (
        <TouchableOpacity
          style={[styles.shareButton, isShared && styles.shareButtonActive]}
          onPress={handleShareToggle}
          disabled={sharingWithCoach}
        >
          {sharingWithCoach ? (
            <ActivityIndicator size="small" color={isShared ? colors.text.inverse : colors.primary.default} />
          ) : (
            <>
              <Ionicons
                name={isShared ? 'person-remove-outline' : 'share-social-outline'}
                size={16}
                color={isShared ? colors.text.inverse : colors.primary.default}
              />
              <Text style={[styles.shareButtonText, isShared && styles.shareButtonTextActive]}>
                {isShared ? 'Unshare from Coach' : 'Share with Coach'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = {
  container: {
    backgroundColor: colors.background.elevated,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text.primary,
  },
  ratingBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text.inverse,
  },
  completionBadge: {
    backgroundColor: colors.primary.default,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  completionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text.inverse,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border.light,
    borderRadius: 2,
    overflow: 'hidden' as const,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.default,
  },
  toggleButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.primary.default,
  },
  phasesContainer: {
    maxHeight: 600,
  },
  phaseCard: {
    backgroundColor: colors.background.default,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  phaseHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  phaseHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flex: 1,
  },
  phaseTitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text.secondary,
  },
  phaseTitleCompleted: {
    color: colors.text.primary,
    fontWeight: '600' as const,
  },
  phaseRatingBadge: {
    borderRadius: 10,
    width: 24,
    height: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  phaseRatingText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text.inverse,
  },
  phaseContent: {
    marginTop: 12,
  },
  planBox: {
    backgroundColor: colors.primary.light,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.default,
  },
  planHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 6,
  },
  planLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.primary.dark,
  },
  planText: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text.primary,
    marginBottom: 8,
  },
  ratingButtons: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 4,
  },
  ratingButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.background.elevated,
  },
  ratingButtonSelected: {
    borderColor: 'transparent',
  },
  ratingButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text.secondary,
  },
  ratingButtonTextSelected: {
    color: colors.text.inverse,
  },
  ratingLegend: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  ratingLegendText: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background.elevated,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text.primary,
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  phaseSummary: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  phaseSummaryText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.primary.default,
    marginBottom: 4,
  },
  phasePreview: {
    fontSize: 13,
    color: colors.text.tertiary,
    lineHeight: 18,
  },
  shareButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.primary.default,
  },
  shareButtonActive: {
    backgroundColor: colors.primary.default,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary.default,
  },
  shareButtonTextActive: {
    color: colors.text.inverse,
  },
};
