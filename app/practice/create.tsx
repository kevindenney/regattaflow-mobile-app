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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { usePracticeSuggestions } from '@/hooks/usePracticeSuggestions';
import { createStep, resolveInterestId } from '@/services/TimelineStepService';
import { useAuth } from '@/providers/AuthProvider';
import { useInterest } from '@/providers/InterestProvider';
import { SKILL_AREA_LABELS, buildSkillAreaLabelMap } from '@/types/practice';
import type { SkillArea } from '@/types/practice';
import { useInterestEventConfig } from '@/hooks/useInterestEventConfig';

// Ink-like color palette
const COLORS = {
  bg: '#faf9f7',
  ink: '#1a1a1a',
  muted: '#666666',
  faint: '#999999',
  accent: '#2c5282',
  rule: '#e5e5e5',
};

// Default suggestions per interest
type DefaultSuggestion = {
  id: string;
  skillArea: string;
  reason: string;
  drillName: string;
  estimatedDuration: number;
};

const SAILING_DEFAULTS: DefaultSuggestion[] = [
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

const NURSING_DEFAULTS: DefaultSuggestion[] = [
  {
    id: 'default-assessment',
    skillArea: 'assessment',
    reason: 'Systematic head-to-toe assessment is the foundation of clinical care.',
    drillName: 'Head-to-Toe Assessment',
    estimatedDuration: 30,
  },
  {
    id: 'default-meds',
    skillArea: 'medication_administration',
    reason: 'Safe medication practices prevent errors. Practice the 6 Rights consistently.',
    drillName: '6 Rights Verification',
    estimatedDuration: 20,
  },
  {
    id: 'default-iv',
    skillArea: 'iv_therapy',
    reason: 'IV insertion confidence comes from repetition and proper technique.',
    drillName: 'IV Insertion Simulation',
    estimatedDuration: 30,
  },
  {
    id: 'default-communication',
    skillArea: 'communication',
    reason: 'Clear SBAR handoffs improve patient safety and team coordination.',
    drillName: 'SBAR Handoff Practice',
    estimatedDuration: 15,
  },
];

const INTEREST_DEFAULTS: Record<string, DefaultSuggestion[]> = {
  'sail-racing': SAILING_DEFAULTS,
  nursing: NURSING_DEFAULTS,
};

const INTEREST_VOCABULARY: Record<string, { loadingText: string; aiSubtitle: string; defaultSubtitle: string }> = {
  'sail-racing': {
    loadingText: 'Analyzing your races...',
    aiSubtitle: 'Based on your recent race analysis',
    defaultSubtitle: 'Suggestions improve as you complete races',
  },
  nursing: {
    loadingText: 'Analyzing your clinical activity...',
    aiSubtitle: 'Based on your recent clinical performance',
    defaultSubtitle: 'Suggestions improve as you complete shifts',
  },
  drawing: {
    loadingText: 'Analyzing your sessions...',
    aiSubtitle: 'Based on your recent session analysis',
    defaultSubtitle: 'Suggestions improve as you complete sessions',
  },
  fitness: {
    loadingText: 'Analyzing your workouts...',
    aiSubtitle: 'Based on your recent workout analysis',
    defaultSubtitle: 'Suggestions improve as you complete workouts',
  },
};

export default function PracticeCreateScreen() {
  const { user } = useAuth();
  const { currentInterest } = useInterest();
  const { suggestions, isLoading } = usePracticeSuggestions();
  const eventConfig = useInterestEventConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slug = eventConfig.interestSlug;
  const vocab = INTEREST_VOCABULARY[slug] ?? INTEREST_VOCABULARY['sail-racing'];
  const defaultSuggestions = INTEREST_DEFAULTS[slug] ?? SAILING_DEFAULTS;
  const skillLabels = buildSkillAreaLabelMap(eventConfig.skillAreas);

  // Use AI suggestions if available, otherwise interest-specific defaults
  const hasAISuggestions = suggestions.length > 0;
  const displaySuggestions = hasAISuggestions
    ? suggestions.map((s) => ({
        id: s.id,
        skillArea: s.skillArea,
        reason: s.reason,
        drillName: s.suggestedDrills[0]?.drill.name || '',
        estimatedDuration: s.estimatedDuration,
      }))
    : defaultSuggestions;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/races');
    }
  };

  const handleSelect = async (suggestion: (typeof displaySuggestions)[0]) => {
    if (!user?.id || isSubmitting) return;

    const label = skillLabels[suggestion.skillArea]
      ?? SKILL_AREA_LABELS[suggestion.skillArea as SkillArea]
      ?? suggestion.skillArea;

    setIsSubmitting(true);
    try {
      const interestId = currentInterest?.id ?? await resolveInterestId(slug);
      if (!interestId) throw new Error('Could not resolve interest');

      const drillInfo = suggestion.drillName ? `\nTry: ${suggestion.drillName}` : '';

      const step = await createStep({
        user_id: user.id,
        interest_id: interestId,
        title: label,
        description: suggestion.reason,
        category: 'practice',
        status: 'pending',
        metadata: {
          plan: {
            what_will_you_do: `${suggestion.reason}${drillInfo}`,
          },
        },
      });

      router.replace({
        pathname: '/step/[id]',
        params: { id: step.id },
      });
    } catch (error) {
      console.error('Failed to create step:', error);
      alert('Failed to create practice step. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                {vocab.loadingText}
              </Text>
            </View>
          ) : (
            <>
              {/* Subtitle changes based on whether we have AI suggestions */}
              <Text style={styles.subtitle}>
                {hasAISuggestions
                  ? vocab.aiSubtitle
                  : vocab.defaultSubtitle}
              </Text>

              {/* Suggestions list */}
              <View style={styles.suggestionsList}>
                {displaySuggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.id}
                    style={styles.suggestionRow}
                    onPress={() => handleSelect(suggestion)}
                    disabled={isSubmitting}
                    activeOpacity={0.7}
                  >
                    <View style={styles.suggestionContent}>
                      <Text style={styles.suggestionSkill}>
                        {skillLabels[suggestion.skillArea] ?? SKILL_AREA_LABELS[suggestion.skillArea as SkillArea] ?? suggestion.skillArea}
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

              {isSubmitting && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.muted} />
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
});
