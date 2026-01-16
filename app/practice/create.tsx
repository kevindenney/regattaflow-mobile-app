/**
 * Practice Screen - Single Page Tufte Design
 *
 * Shows AI-suggested practices based on race analysis.
 * Shows default suggestions for new users.
 * Tap a suggestion to log it. Simple.
 */

import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { usePracticeSuggestions } from '@/hooks/usePracticeSuggestions';
import { practiceSessionService } from '@/services/PracticeSessionService';
import { useAuth } from '@/providers/AuthProvider';
import { SKILL_AREA_LABELS } from '@/types/practice';
import type { PracticeSuggestion, SkillArea } from '@/types/practice';

// Ink-like color palette
const COLORS = {
  bg: '#faf9f7',
  ink: '#1a1a1a',
  muted: '#666666',
  faint: '#999999',
  accent: '#2c5282',
  rule: '#e5e5e5',
};

// Default suggestions for new users
const DEFAULT_SUGGESTIONS: Array<{
  id: string;
  skillArea: SkillArea;
  reason: string;
  drillName: string;
  estimatedDuration: number;
}> = [
  {
    id: 'default-starts',
    skillArea: 'start-execution',
    reason: 'The start often determines the race. Practice timing and line positioning.',
    drillName: 'Rabbit Start Drill',
    estimatedDuration: 30,
  },
  {
    id: 'default-upwind',
    skillArea: 'upwind-execution',
    reason: 'Upwind legs are where races are won. Focus on pointing and VMG.',
    drillName: 'Tacking on Shifts',
    estimatedDuration: 45,
  },
  {
    id: 'default-marks',
    skillArea: 'windward-rounding',
    reason: 'Clean mark roundings maintain momentum and position.',
    drillName: 'Mark Rounding Circuit',
    estimatedDuration: 30,
  },
  {
    id: 'default-downwind',
    skillArea: 'downwind-speed',
    reason: 'Downwind speed separates good sailors from great ones.',
    drillName: 'VMG Downwind Run',
    estimatedDuration: 30,
  },
];

export default function PracticeCreateScreen() {
  const { user } = useAuth();
  const { suggestions, isLoading } = usePracticeSuggestions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use AI suggestions if available, otherwise default suggestions
  const hasAISuggestions = suggestions.length > 0;
  const displaySuggestions = hasAISuggestions
    ? suggestions.map((s) => ({
        id: s.id,
        skillArea: s.skillArea,
        reason: s.reason,
        drillName: s.suggestedDrills[0]?.drill.name || '',
        estimatedDuration: s.estimatedDuration,
      }))
    : DEFAULT_SUGGESTIONS;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/races');
    }
  };

  const handleSelectSuggestion = (suggestion: (typeof displaySuggestions)[0]) => {
    if (selectedId === suggestion.id) {
      setSelectedId(null);
    } else {
      setSelectedId(suggestion.id);
      setDuration(suggestion.estimatedDuration);
    }
  };

  const handleLog = async () => {
    if (!user?.id || !selectedId) return;

    const suggestion = displaySuggestions.find((s) => s.id === selectedId);
    if (!suggestion) return;

    setIsSubmitting(true);
    try {
      const session = await practiceSessionService.createSession({
        createdBy: user.id,
        sailorId: user.id,
        sessionType: 'logged',
        status: 'completed',
        actualDurationMinutes: duration,
        reflectionNotes: notes || null,
        aiSuggested: hasAISuggestions,
        aiReasoning: suggestion.reason,
      });

      await practiceSessionService.addFocusAreas(session.id, [
        { skillArea: suggestion.skillArea, priority: 1 },
      ]);

      router.replace({
        pathname: '/practice/[id]',
        params: { id: session.id },
      });
    } catch (error) {
      console.error('Failed to log practice:', error);
      alert('Failed to log practice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSuggestion = displaySuggestions.find((s) => s.id === selectedId);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ChevronLeft size={20} color={COLORS.muted} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Practice</Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.muted} />
              <Text style={styles.loadingText}>
                Analyzing your races...
              </Text>
            </View>
          ) : (
            <>
              {/* Subtitle changes based on whether we have AI suggestions */}
              <Text style={styles.subtitle}>
                {hasAISuggestions
                  ? 'Based on your recent race analysis'
                  : 'Suggestions improve as you complete races'}
              </Text>

              {/* Suggestions list */}
              <View style={styles.suggestionsList}>
                {displaySuggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.id}
                    style={styles.suggestionRow}
                    onPress={() => handleSelectSuggestion(suggestion)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.suggestionContent}>
                      <Text
                        style={[
                          styles.suggestionSkill,
                          selectedId === suggestion.id &&
                            styles.suggestionSkillSelected,
                        ]}
                      >
                        {SKILL_AREA_LABELS[suggestion.skillArea]}
                      </Text>
                      <Text style={styles.suggestionReason}>
                        {suggestion.reason}
                      </Text>
                      {suggestion.drillName && (
                        <Text style={styles.suggestionDrill}>
                          Try: {suggestion.drillName}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.suggestionDuration}>
                      {suggestion.estimatedDuration}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Log form - appears when suggestion selected */}
              {selectedSuggestion && (
                <View style={styles.logForm}>
                  <View style={styles.rule} />

                  <Text style={styles.logPrompt}>
                    Log {SKILL_AREA_LABELS[selectedSuggestion.skillArea]} practice
                  </Text>

                  {/* Duration selector */}
                  <View style={styles.durationRow}>
                    <Text style={styles.durationLabel}>Duration</Text>
                    <View style={styles.durationOptions}>
                      {[15, 30, 45, 60].map((mins) => (
                        <TouchableOpacity
                          key={mins}
                          onPress={() => setDuration(mins)}
                          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                        >
                          <Text
                            style={[
                              styles.durationOption,
                              duration === mins && styles.durationSelected,
                            ]}
                          >
                            {mins}m
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Notes */}
                  <View style={styles.notesRow}>
                    <TextInput
                      style={styles.notesInput}
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="What did you learn?"
                      placeholderTextColor={COLORS.faint}
                      multiline
                    />
                  </View>

                  {/* Submit */}
                  <TouchableOpacity
                    style={styles.logButton}
                    onPress={handleLog}
                    disabled={isSubmitting}
                    activeOpacity={0.6}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={COLORS.accent} />
                    ) : (
                      <Text style={styles.logButtonText}>Log Practice →</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  backText: {
    fontSize: 15,
    color: COLORS.muted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: COLORS.ink,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.faint,
    marginBottom: 32,
    fontStyle: 'italic',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.muted,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.muted,
    lineHeight: 22,
  },
  suggestionsList: {
    gap: 0,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.rule,
  },
  suggestionContent: {
    flex: 1,
    gap: 4,
  },
  suggestionSkill: {
    fontSize: 17,
    fontWeight: '500',
    color: COLORS.ink,
  },
  suggestionSkillSelected: {
    color: COLORS.accent,
    textDecorationLine: 'underline',
  },
  suggestionReason: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  },
  suggestionDrill: {
    fontSize: 13,
    color: COLORS.faint,
    fontStyle: 'italic',
    marginTop: 4,
  },
  suggestionDuration: {
    fontSize: 14,
    color: COLORS.faint,
    fontVariant: ['tabular-nums'],
    marginLeft: 16,
  },
  logForm: {
    marginTop: 8,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.rule,
    marginVertical: 24,
  },
  logPrompt: {
    fontSize: 16,
    color: COLORS.ink,
    marginBottom: 20,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  durationLabel: {
    fontSize: 15,
    color: COLORS.muted,
    marginRight: 16,
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 20,
  },
  durationOption: {
    fontSize: 15,
    color: COLORS.faint,
    fontVariant: ['tabular-nums'],
  },
  durationSelected: {
    color: COLORS.ink,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textDecorationColor: COLORS.accent,
  },
  notesRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.rule,
    marginBottom: 24,
    paddingBottom: 8,
  },
  notesInput: {
    fontSize: 15,
    color: COLORS.ink,
    padding: 0,
    minHeight: 40,
  },
  logButton: {
    alignItems: 'flex-end',
  },
  logButtonText: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '500',
  },
});
