/**
 * Practice Create Screen - Tufte Redesign
 *
 * Single unified scroll view following Tufte principles:
 * - Suggestions at top (if available)
 * - Inline log form in middle
 * - Schedule link at bottom
 * - No tabs, typography-driven hierarchy
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { TUFTE_BACKGROUND, IOS_COLORS } from '@/components/cards/constants';
import {
  TUFTE_FORM_COLORS,
  TUFTE_FORM_SPACING,
} from '@/components/races/AddRaceDialog/tufteFormStyles';
import { TufteSuggestionRow } from '@/components/practice/TufteSuggestionRow';
import { TuftePracticeLogForm } from '@/components/practice/TuftePracticeLogForm';
import type { LogPracticeData } from '@/components/practice/TuftePracticeLogForm';
import { usePracticeSuggestions } from '@/hooks/usePracticeSuggestions';
import { practiceSessionService } from '@/services/PracticeSessionService';
import { useAuth } from '@/providers/AuthProvider';
import type { PracticeSuggestion } from '@/types/practice';

export default function PracticeCreateScreen() {
  const { user } = useAuth();
  const { suggestions, isLoading } = usePracticeSuggestions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(
    new Set()
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/races');
    }
  };

  // Tap suggestion - go to wizard with pre-filled data
  const handleSuggestionPress = (suggestion: PracticeSuggestion) => {
    router.push({
      pathname: '/practice/create-wizard',
      params: {
        mode: 'schedule',
        fromSuggestion: 'true',
        skillArea: suggestion.skillArea,
        drillIds: suggestion.suggestedDrills.map((d) => d.drill.id).join(','),
        aiReasoning: suggestion.reason,
        contextualNotes: suggestion.contextualNotes || '',
        estimatedDuration: suggestion.estimatedDuration.toString(),
      },
    });
  };

  // Log ad-hoc practice
  const handleLogPractice = async (data: LogPracticeData) => {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      const session = await practiceSessionService.createSession({
        createdBy: user.id,
        sailorId: user.id,
        sessionType: 'logged',
        status: 'completed',
        actualDurationMinutes: data.durationMinutes,
        reflectionNotes: data.notes || null,
      });

      // Add focus areas
      if (data.focusAreas.length > 0) {
        await practiceSessionService.addFocusAreas(
          session.id,
          data.focusAreas.map((area, index) => ({
            skillArea: area,
            priority: index + 1,
          }))
        );
      }

      router.push({
        pathname: '/practice/[id]',
        params: { id: session.id },
      });
    } catch (error) {
      console.error('Failed to log practice:', error);
      alert('Failed to log practice session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigate to schedule wizard
  const handleSchedulePress = () => {
    router.push({
      pathname: '/practice/create-wizard',
      params: { mode: 'schedule' },
    });
  };

  // Filter out dismissed suggestions
  const activeSuggestions = suggestions.filter(
    (s) => !dismissedSuggestions.has(s.id)
  );
  const hasSuggestions = activeSuggestions.length > 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ChevronLeft size={24} color={TUFTE_FORM_COLORS.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Practice</Text>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* SUGGESTIONS SECTION */}
            {isLoading ? (
              <View style={styles.loadingSection}>
                <ActivityIndicator size="small" color={TUFTE_FORM_COLORS.primary} />
                <Text style={styles.loadingText}>Checking recommendations...</Text>
              </View>
            ) : hasSuggestions ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>SUGGESTED FOR YOU</Text>
                <Text style={styles.sectionSubtext}>
                  Based on your recent races
                </Text>
                <View style={styles.suggestionsCard}>
                  {activeSuggestions.map((suggestion, index) => (
                    <TufteSuggestionRow
                      key={suggestion.id}
                      suggestion={suggestion}
                      onPress={handleSuggestionPress}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {/* SEPARATOR */}
            {hasSuggestions && <View style={styles.separator} />}

            {/* LOG SECTION */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>LOG A PRACTICE</Text>
              <Text style={styles.sectionSubtext}>
                Record what you worked on today
              </Text>
              <View style={styles.logFormCard}>
                <TuftePracticeLogForm
                  onSubmit={handleLogPractice}
                  isSubmitting={isSubmitting}
                />
              </View>
            </View>

            {/* SEPARATOR */}
            <View style={styles.separator} />

            {/* SCHEDULE SECTION */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SCHEDULE A SESSION</Text>
              <TouchableOpacity
                style={styles.scheduleRow}
                onPress={handleSchedulePress}
                activeOpacity={0.7}
              >
                <View style={styles.scheduleContent}>
                  <Text style={styles.scheduleTitle}>Plan a structured practice</Text>
                  <Text style={styles.scheduleSubtext}>
                    Select drills, assign crew tasks, set goals
                  </Text>
                </View>
                <ChevronRight size={20} color={TUFTE_FORM_COLORS.secondaryLabel} />
              </TouchableOpacity>
            </View>

            {/* Bottom spacing */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: TUFTE_FORM_SPACING.lg,
    paddingVertical: TUFTE_FORM_SPACING.md,
    backgroundColor: TUFTE_BACKGROUND,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TUFTE_FORM_COLORS.separator,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backText: {
    fontSize: 17,
    color: TUFTE_FORM_COLORS.primary,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.label,
  },
  headerSpacer: {
    width: 70,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: TUFTE_FORM_SPACING.lg,
  },
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: TUFTE_FORM_SPACING.xl,
  },
  loadingText: {
    fontSize: 14,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  section: {
    paddingHorizontal: TUFTE_FORM_SPACING.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.sectionLabel,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  sectionSubtext: {
    fontSize: 13,
    color: TUFTE_FORM_COLORS.secondaryLabel,
    marginBottom: TUFTE_FORM_SPACING.md,
  },
  suggestionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: TUFTE_FORM_COLORS.separator,
    marginVertical: TUFTE_FORM_SPACING.xl,
    marginHorizontal: TUFTE_FORM_SPACING.lg,
  },
  logFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: TUFTE_FORM_SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
  },
  scheduleContent: {
    flex: 1,
    gap: 2,
  },
  scheduleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.label,
  },
  scheduleSubtext: {
    fontSize: 13,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  bottomSpacer: {
    height: 40,
  },
});
