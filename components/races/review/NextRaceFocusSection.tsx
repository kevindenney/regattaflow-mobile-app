/**
 * NextRaceFocusSection - Review Tab Component
 *
 * Three sub-sections:
 * 1. Previous Focus Evaluation - rate 1-5 how the focus went (if one exists for this race)
 * 2. Focus Intent Picker - pick one AI suggestion or write your own
 * 3. Progress Snapshot - one-line summary of focus practice history
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Target, ChevronRight, TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react-native';

import {
  useActiveFocusIntent,
  useFocusIntentFromRace,
  useFocusSuggestions,
  useFocusProgress,
  useSetFocusIntent,
  useEvaluateFocusIntent,
} from '@/hooks/useFocusIntent';
import type { FocusSuggestion } from '@/types/focusIntent';

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
  const { setFocus, isPending: isSettingFocus } = useSetFocusIntent();
  const { evaluate, isPending: isEvaluating } = useEvaluateFocusIntent();

  // Local state
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number | null>(null);
  const [customFocusText, setCustomFocusText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [evaluationRating, setEvaluationRating] = useState<number | null>(null);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [hasSetFocus, setHasSetFocus] = useState(false);

  // Derived state
  const hasPreviousFocus = activeIntent && activeIntent.status === 'active' && activeIntent.sourceRaceId !== raceId;
  const alreadySetFromThisRace = !!intentFromThisRace;
  const isLoading = isLoadingActive || isLoadingFromRace;

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

  // Compute completion state for parent
  const focusItemsCompleted =
    (hasPreviousFocus && (hasEvaluated || evaluationRating !== null) ? 1 : 0) +
    (hasSetFocus || alreadySetFromThisRace ? 1 : 0);
  const focusItemsTotal =
    (hasPreviousFocus ? 1 : 0) + 1; // Always count "set focus" as 1

  if (isLoading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Target size={16} color={IOS_COLORS.teal} />
          <Text style={styles.sectionLabel}>NEXT RACE FOCUS</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={IOS_COLORS.teal} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Target size={16} color={IOS_COLORS.teal} />
        <Text style={styles.sectionLabel}>NEXT RACE FOCUS</Text>
        <Text style={styles.sectionCount}>
          {focusItemsCompleted}/{focusItemsTotal}
        </Text>
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

      {/* Focus already set confirmation */}
      {(alreadySetFromThisRace || hasSetFocus) && (
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
        </View>
      )}

      {/* Sub-section 3: Progress Snapshot */}
      {isExpanded && progress && progress.totalEvaluated > 0 && (
        <Pressable style={styles.progressSnapshot}>
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

export default NextRaceFocusSection;
