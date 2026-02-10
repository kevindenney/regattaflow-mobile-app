/**
 * NextRaceFocusSection - Review Tab Component
 *
 * Three sub-sections:
 * 1. Previous Focus Evaluation - rate 1-5 how the focus went (if one exists for this race)
 * 2. Focus Intent Picker - pick one AI suggestion or write your own
 * 3. Progress Snapshot - one-line summary of focus practice history
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { Target, ChevronRight, TrendingUp, TrendingDown, Minus, Plus, Pencil, X, Check, History, Star } from 'lucide-react-native';

import {
  useActiveFocusIntent,
  useFocusIntentFromRace,
  useFocusSuggestions,
  useFocusProgress,
  useFocusHistory,
  useSetFocusIntent,
  useEvaluateFocusIntent,
} from '@/hooks/useFocusIntent';
import type { FocusSuggestion, FocusIntent } from '@/types/focusIntent';

// iOS System Colors - matching AfterRaceContent
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
  teal: '#0D9488',
};

interface NextRaceFocusSectionProps {
  raceId: string;
  userId?: string;
  isExpanded?: boolean;
}

/**
 * Rating button row for evaluating previous focus (1-5)
 */
function RatingButtons({
  selectedRating,
  onSelect,
  disabled,
}: {
  selectedRating: number | null;
  onSelect: (rating: number) => void;
  disabled?: boolean;
}) {
  return (
    <View style={ratingStyles.container}>
      {[1, 2, 3, 4, 5].map((rating) => {
        const isSelected = selectedRating === rating;
        return (
          <Pressable
            key={rating}
            style={[
              ratingStyles.button,
              isSelected && ratingStyles.buttonSelected,
              disabled && ratingStyles.buttonDisabled,
            ]}
            onPress={() => !disabled && onSelect(rating)}
            disabled={disabled}
          >
            <Text
              style={[
                ratingStyles.buttonText,
                isSelected && ratingStyles.buttonTextSelected,
              ]}
            >
              {rating}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * A single suggestion item in the picker
 */
function SuggestionItem({
  suggestion,
  isSelected,
  onSelect,
}: {
  suggestion: FocusSuggestion;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      style={[pickerStyles.suggestionItem, isSelected && pickerStyles.suggestionItemSelected]}
      onPress={onSelect}
    >
      <View style={[pickerStyles.radio, isSelected && pickerStyles.radioSelected]}>
        {isSelected && <View style={pickerStyles.radioInner} />}
      </View>
      <View style={pickerStyles.suggestionContent}>
        <Text style={[pickerStyles.suggestionText, isSelected && pickerStyles.suggestionTextSelected]}>
          {suggestion.text}
        </Text>
      </View>
    </Pressable>
  );
}

export function NextRaceFocusSection({
  raceId,
  userId,
  isExpanded = true,
}: NextRaceFocusSectionProps) {
  // Hooks
  const { activeIntent, isLoading: isLoadingActive } = useActiveFocusIntent();
  const { intent: intentFromThisRace, isLoading: isLoadingFromRace } = useFocusIntentFromRace(raceId);
  const { suggestions, isLoading: isLoadingSuggestions } = useFocusSuggestions(raceId);
  const { progress, isLoading: isLoadingProgress } = useFocusProgress();
  const { history, isLoading: isLoadingHistory } = useFocusHistory(10);
  const { setFocus, isPending: isSettingFocus } = useSetFocusIntent();
  const { evaluate, isPending: isEvaluating } = useEvaluateFocusIntent();

  // Local state
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number | null>(null);
  const [customFocusText, setCustomFocusText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [evaluationRating, setEvaluationRating] = useState<number | null>(null);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [hasSetFocus, setHasSetFocus] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingFocusText, setEditingFocusText] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Derived state
  const hasPreviousFocus = activeIntent && activeIntent.status === 'active' && activeIntent.sourceRaceId !== raceId;
  const alreadySetFromThisRace = !!intentFromThisRace;
  const isLoading = (isLoadingActive || isLoadingFromRace) && !activeIntent && !intentFromThisRace;

  // Evaluate the previous focus
  const handleEvaluate = useCallback(async (rating: number) => {
    if (!activeIntent) return;
    setEvaluationRating(rating);
    try {
      await evaluate({ intentId: activeIntent.id, rating });
      setHasEvaluated(true);
    } catch (err) {
      console.error('[NextRaceFocusSection] Failed to evaluate:', err);
      setEvaluationRating(null);
    }
  }, [activeIntent, evaluate]);

  // Set a new focus from suggestion
  const handleSelectSuggestion = useCallback(async (index: number) => {
    const suggestion = suggestions[index];
    if (!suggestion) return;
    setSelectedSuggestionIndex(index);
    try {
      await setFocus({
        sourceRaceId: raceId,
        focusText: suggestion.text,
        phase: suggestion.phase,
        source: 'ai_suggested',
      });
      setHasSetFocus(true);
    } catch (err) {
      console.error('[NextRaceFocusSection] Failed to set focus:', err);
      setSelectedSuggestionIndex(null);
    }
  }, [suggestions, raceId, setFocus]);

  // Set a custom focus
  const handleSetCustomFocus = useCallback(async () => {
    const text = customFocusText.trim();
    if (!text) return;
    try {
      await setFocus({
        sourceRaceId: raceId,
        focusText: text,
        source: 'manual',
      });
      setHasSetFocus(true);
      setShowCustomInput(false);
    } catch (err) {
      console.error('[NextRaceFocusSection] Failed to set custom focus:', err);
    }
  }, [customFocusText, raceId, setFocus]);

  // Start editing the current focus
  const handleStartEdit = useCallback(() => {
    const currentText = intentFromThisRace?.focusText || customFocusText || suggestions[selectedSuggestionIndex ?? -1]?.text || '';
    setEditingFocusText(currentText);
    setIsEditing(true);
  }, [intentFromThisRace, customFocusText, suggestions, selectedSuggestionIndex]);

  // Save edited focus
  const handleSaveEdit = useCallback(async () => {
    const text = editingFocusText.trim();
    if (!text) return;
    try {
      await setFocus({
        sourceRaceId: raceId,
        focusText: text,
        source: 'manual',
      });
      setHasSetFocus(true);
      setIsEditing(false);
    } catch (err) {
      console.error('[NextRaceFocusSection] Failed to update focus:', err);
    }
  }, [editingFocusText, raceId, setFocus]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditingFocusText('');
  }, []);

  // Compute completion state for parent
  const focusItemsCompleted =
    (hasPreviousFocus && (hasEvaluated || evaluationRating !== null) ? 1 : 0) +
    (hasSetFocus || alreadySetFromThisRace ? 1 : 0);
  const focusItemsTotal =
    (hasPreviousFocus ? 1 : 0) + 1; // Always count "set focus" as 1

  return (
    <View style={styles.section}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Target size={16} color={IOS_COLORS.teal} />
        <Text style={styles.sectionLabel}>NEXT RACE FOCUS</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={IOS_COLORS.teal} />
        ) : (
          <Text style={styles.sectionCount}>
            {focusItemsCompleted}/{focusItemsTotal}
          </Text>
        )}
      </View>

      {/* Sub-section 1: Previous Focus Evaluation */}
      {hasPreviousFocus && !hasEvaluated && (
        <View style={styles.evaluationCard}>
          <View style={styles.evaluationHeader}>
            <View style={[styles.checkbox, hasEvaluated && styles.checkboxDone]}>
              {hasEvaluated && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.evaluationTitle}>Rate your focus from last race</Text>
          </View>
          <View style={styles.evaluationContent}>
            <Text style={styles.focusQuote}>"{activeIntent.focusText}"</Text>
            <Text style={styles.evaluationPrompt}>How did it go?</Text>
            <RatingButtons
              selectedRating={evaluationRating}
              onSelect={handleEvaluate}
              disabled={isEvaluating}
            />
          </View>
        </View>
      )}

      {/* Evaluated confirmation */}
      {hasPreviousFocus && hasEvaluated && (
        <View style={styles.evaluatedCard}>
          <View style={[styles.checkbox, styles.checkboxDone]}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          <View style={styles.evaluatedContent}>
            <Text style={styles.evaluatedText}>
              Focus rated {evaluationRating}/5
            </Text>
            <Text style={styles.evaluatedFocus} numberOfLines={1}>
              {activeIntent?.focusText}
            </Text>
          </View>
        </View>
      )}

      {/* Sub-section 2: Focus Intent Picker */}
      {!alreadySetFromThisRace && !hasSetFocus && isExpanded && (
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <View style={[styles.checkbox, styles.checkboxEmpty]}>
              {/* empty checkbox */}
            </View>
            <Text style={styles.pickerTitle}>Set focus for next race</Text>
          </View>

          {isLoadingSuggestions ? (
            <View style={styles.suggestionsLoading}>
              <ActivityIndicator size="small" color={IOS_COLORS.teal} />
              <Text style={styles.suggestionsLoadingText}>Generating suggestions...</Text>
            </View>
          ) : (
            <View style={styles.suggestionsList}>
              {suggestions.map((suggestion, index) => (
                <SuggestionItem
                  key={index}
                  suggestion={suggestion}
                  isSelected={selectedSuggestionIndex === index}
                  onSelect={() => handleSelectSuggestion(index)}
                />
              ))}

              {/* Custom input toggle */}
              {!showCustomInput ? (
                <Pressable
                  style={pickerStyles.customToggle}
                  onPress={() => setShowCustomInput(true)}
                >
                  <Plus size={14} color={IOS_COLORS.teal} />
                  <Text style={pickerStyles.customToggleText}>Write your own focus...</Text>
                </Pressable>
              ) : (
                <View style={pickerStyles.customInputContainer}>
                  <TextInput
                    style={pickerStyles.customInput}
                    placeholder="e.g., Hold the boat flat through tacks"
                    placeholderTextColor={IOS_COLORS.gray3}
                    value={customFocusText}
                    onChangeText={setCustomFocusText}
                    returnKeyType="done"
                    onSubmitEditing={handleSetCustomFocus}
                    autoFocus
                  />
                  {customFocusText.trim().length > 0 && (
                    <Pressable
                      style={pickerStyles.customSubmitButton}
                      onPress={handleSetCustomFocus}
                      disabled={isSettingFocus}
                    >
                      {isSettingFocus ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={pickerStyles.customSubmitText}>Set</Text>
                      )}
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Focus already set confirmation - with edit option */}
      {(alreadySetFromThisRace || hasSetFocus) && !isEditing && (
        <View style={styles.focusSetCard}>
          <View style={[styles.checkbox, styles.checkboxDone]}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          <View style={styles.focusSetContent}>
            <Text style={styles.focusSetText}>Focus set for next race</Text>
            <Text style={styles.focusSetValue} numberOfLines={2}>
              {intentFromThisRace?.focusText || customFocusText || suggestions[selectedSuggestionIndex ?? -1]?.text || ''}
            </Text>
          </View>
          <Pressable style={styles.editButton} onPress={handleStartEdit}>
            <Pencil size={14} color={IOS_COLORS.teal} />
          </Pressable>
        </View>
      )}

      {/* Edit focus mode */}
      {isEditing && (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.editInput}
            value={editingFocusText}
            onChangeText={setEditingFocusText}
            placeholder="Enter your focus..."
            placeholderTextColor={IOS_COLORS.gray3}
            multiline
            autoFocus
          />
          <View style={styles.editActions}>
            <Pressable style={styles.editCancelButton} onPress={handleCancelEdit}>
              <X size={16} color={IOS_COLORS.gray} />
              <Text style={styles.editCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.editSaveButton, !editingFocusText.trim() && styles.editSaveButtonDisabled]}
              onPress={handleSaveEdit}
              disabled={!editingFocusText.trim() || isSettingFocus}
            >
              {isSettingFocus ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.editSaveText}>Save</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      )}

      {/* Sub-section 3: Progress Snapshot */}
      {isExpanded && progress && progress.totalEvaluated > 0 && (
        <Pressable style={styles.progressSnapshot} onPress={() => setShowHistoryModal(true)}>
          <View style={styles.progressSnapshotContent}>
            {progress.trend === 'improving' && <TrendingUp size={14} color={IOS_COLORS.green} />}
            {progress.trend === 'declining' && <TrendingDown size={14} color={IOS_COLORS.red} />}
            {progress.trend === 'stable' && <Minus size={14} color={IOS_COLORS.gray} />}
            <Text style={styles.progressSnapshotText}>
              {Math.round((progress.averageRating / 5) * 100)}% avg
              {' · '}
              {progress.totalEvaluated} {progress.totalEvaluated === 1 ? 'race' : 'races'}
              {progress.trend === 'improving' ? ' · improving' : progress.trend === 'declining' ? ' · declining' : ''}
            </Text>
          </View>
          <ChevronRight size={14} color={IOS_COLORS.gray} />
        </Pressable>
      )}

      {/* Focus History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={historyStyles.container}>
          <View style={historyStyles.header}>
            <Text style={historyStyles.title}>Focus History</Text>
            <Pressable style={historyStyles.closeButton} onPress={() => setShowHistoryModal(false)}>
              <X size={24} color={IOS_COLORS.gray} />
            </Pressable>
          </View>

          <ScrollView style={historyStyles.content} contentContainerStyle={historyStyles.contentContainer}>
            {isLoadingHistory ? (
              <View style={historyStyles.loadingContainer}>
                <ActivityIndicator size="large" color={IOS_COLORS.teal} />
              </View>
            ) : history.length === 0 ? (
              <View style={historyStyles.emptyState}>
                <History size={48} color={IOS_COLORS.gray3} />
                <Text style={historyStyles.emptyTitle}>No Focus History Yet</Text>
                <Text style={historyStyles.emptyDescription}>
                  After each race, set a focus for your next race and rate how well you executed it.
                  {'\n\n'}
                  Your history will show:
                </Text>
                <View style={historyStyles.emptyFeatures}>
                  <Text style={historyStyles.emptyFeature}>• Past focus areas you've worked on</Text>
                  <Text style={historyStyles.emptyFeature}>• Your self-ratings (1-5) for each</Text>
                  <Text style={historyStyles.emptyFeature}>• Trends in your deliberate practice</Text>
                  <Text style={historyStyles.emptyFeature}>• Average success rate over time</Text>
                </View>
              </View>
            ) : (
              <>
                {/* Summary stats */}
                {progress && (
                  <View style={historyStyles.summaryCard}>
                    <Text style={historyStyles.summaryTitle}>Your Progress</Text>
                    <View style={historyStyles.summaryStats}>
                      <View style={historyStyles.statItem}>
                        <Text style={historyStyles.statValue}>{progress.totalEvaluated}</Text>
                        <Text style={historyStyles.statLabel}>Races</Text>
                      </View>
                      <View style={historyStyles.statItem}>
                        <Text style={historyStyles.statValue}>{Math.round((progress.averageRating / 5) * 100)}%</Text>
                        <Text style={historyStyles.statLabel}>Avg Rating</Text>
                      </View>
                      <View style={historyStyles.statItem}>
                        <View style={historyStyles.trendBadge}>
                          {progress.trend === 'improving' && <TrendingUp size={16} color={IOS_COLORS.green} />}
                          {progress.trend === 'declining' && <TrendingDown size={16} color={IOS_COLORS.red} />}
                          {progress.trend === 'stable' && <Minus size={16} color={IOS_COLORS.gray} />}
                        </View>
                        <Text style={historyStyles.statLabel}>
                          {progress.trend === 'improving' ? 'Improving' : progress.trend === 'declining' ? 'Declining' : 'Stable'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* History list */}
                <Text style={historyStyles.sectionTitle}>Past Focus Areas</Text>
                {history.map((intent: FocusIntent, index: number) => (
                  <View key={intent.id} style={historyStyles.historyItem}>
                    <View style={historyStyles.historyHeader}>
                      <Text style={historyStyles.historyFocus} numberOfLines={2}>
                        {intent.focusText}
                      </Text>
                      {intent.evaluationRating && (
                        <View style={historyStyles.ratingBadge}>
                          <Star size={12} color={IOS_COLORS.orange} fill={IOS_COLORS.orange} />
                          <Text style={historyStyles.ratingText}>{intent.evaluationRating}/5</Text>
                        </View>
                      )}
                    </View>
                    <Text style={historyStyles.historyDate}>
                      {intent.evaluatedAt ? new Date(intent.evaluatedAt).toLocaleDateString() : ''}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// Main section styles
const styles = StyleSheet.create({
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
  loadingContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },

  // Checkbox (matching AfterRaceContent pattern)
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
  checkboxEmpty: {
    borderColor: IOS_COLORS.gray3,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Evaluation card
  evaluationCard: {
    gap: 8,
  },
  evaluationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  evaluationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  evaluationContent: {
    marginLeft: 32,
    gap: 8,
  },
  focusQuote: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.teal,
    fontStyle: 'italic',
  },
  evaluationPrompt: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },

  // Evaluated confirmation
  evaluatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  evaluatedContent: {
    flex: 1,
    gap: 2,
  },
  evaluatedText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textDecorationLine: 'line-through',
  },
  evaluatedFocus: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
  },

  // Picker container
  pickerContainer: {
    gap: 8,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pickerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  suggestionsList: {
    marginLeft: 32,
    gap: 8,
  },
  suggestionsLoading: {
    marginLeft: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  suggestionsLoadingText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
  },

  // Focus set confirmation
  focusSetCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  focusSetContent: {
    flex: 1,
    gap: 2,
  },
  focusSetText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textDecorationLine: 'line-through',
  },
  focusSetValue: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.teal,
    fontStyle: 'italic',
  },
  editButton: {
    padding: 8,
    marginLeft: 4,
  },

  // Edit mode
  editContainer: {
    gap: 12,
    marginLeft: 32,
  },
  editInput: {
    fontSize: 15,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 10,
    padding: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  editCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  editCancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  editSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.teal,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  editSaveButtonDisabled: {
    opacity: 0.5,
  },
  editSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Progress snapshot
  progressSnapshot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  progressSnapshotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressSnapshotText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
});

// Rating button styles
const ratingStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  buttonSelected: {
    backgroundColor: `${IOS_COLORS.teal}15`,
    borderColor: IOS_COLORS.teal,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  buttonTextSelected: {
    color: IOS_COLORS.teal,
  },
});

// Picker styles
const pickerStyles = StyleSheet.create({
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  suggestionItemSelected: {
    backgroundColor: `${IOS_COLORS.teal}10`,
    borderColor: IOS_COLORS.teal,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: IOS_COLORS.gray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: IOS_COLORS.teal,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: IOS_COLORS.teal,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  suggestionTextSelected: {
    color: IOS_COLORS.teal,
    fontWeight: '600',
  },
  customToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  customToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.teal,
  },
  customInputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  customInput: {
    flex: 1,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: IOS_COLORS.label,
    minHeight: 44,
  },
  customSubmitButton: {
    backgroundColor: IOS_COLORS.teal,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 56,
  },
  customSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

// History modal styles
const historyStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyFeatures: {
    alignSelf: 'stretch',
    marginTop: 8,
    gap: 6,
  },
  emptyFeature: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
  },

  // Summary card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: IOS_COLORS.teal,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  trendBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // History list
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  historyFocus: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  historyDate: {
    fontSize: 12,
    color: IOS_COLORS.gray,
  },
});

export default NextRaceFocusSection;
