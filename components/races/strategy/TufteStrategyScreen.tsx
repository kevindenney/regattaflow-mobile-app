/**
 * TufteStrategyScreen - Full screen Tufte-style race strategy view
 *
 * A complete replacement for the traditional race strategy screen,
 * following Edward Tufte's principles of information design:
 *
 * - Collapsible accordion phases for focused viewing
 * - Typography-driven hierarchy (no icons or heavy decoration)
 * - Warm paper background for comfortable reading
 * - Sparklines for performance trends
 * - Marginalia-style inline editing for user plans
 * - Progress indicators showing planning completion
 *
 * "Above all else show the data" - Edward Tufte
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { TUFTE_BACKGROUND } from '@/components/cards/constants';
import {
  STRATEGY_SECTIONS,
  getSectionsForPhase,
  type StrategyPhase,
  type StrategySectionId,
  type RaceStrategyNotes,
  type StrategySectionNote,
} from '@/types/raceStrategy';
import { useAuth } from '@/providers/AuthProvider';
import { useStrategyRecommendations } from '@/hooks/useStrategyRecommendations';
import { useRaceStrategyNotes } from '@/hooks/useRaceStrategyNotes';
import { TufteAccordionPhaseHeader } from './TufteAccordionPhaseHeader';
import { TufteStrategySection } from './TufteStrategySection';

// Phase display order and labels
const PHASES: { key: StrategyPhase; label: string }[] = [
  { key: 'start', label: 'START' },
  { key: 'upwind', label: 'UPWIND' },
  { key: 'downwind', label: 'DOWNWIND' },
  { key: 'markRounding', label: 'MARK ROUNDING' },
  { key: 'finish', label: 'FINISH' },
];

// Tufte-inspired colors
const COLORS = {
  text: '#3D3832',
  secondaryText: '#6B7280',
  tertiaryText: '#9CA3AF',
};

export interface TufteStrategyScreenProps {
  /** Race ID for persisting strategy plans */
  raceId?: string;
  /** Race name to display in header */
  raceName?: string;
  /** Race date for header */
  raceDate?: Date;
  /** Existing strategy notes (for loading saved plans) */
  strategyNotes?: RaceStrategyNotes;
  /** Callback when a section's user plan is updated (in addition to auto-save) */
  onUpdateSection?: (sectionId: StrategySectionId, userPlan: string) => void;
  /** Venue name for contextual recommendations */
  venueName?: string;
  /** Expected wind speed for condition-based recommendations */
  windSpeed?: number;
}

/**
 * Format date for header display (e.g., "Jun 15")
 */
function formatHeaderDate(date?: Date): string {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get the note for a specific section from the strategy notes
 */
function getSectionNote(
  sectionId: StrategySectionId,
  notes?: RaceStrategyNotes
): StrategySectionNote | undefined {
  if (!notes) return undefined;

  const [phase, field] = sectionId.split('.') as [keyof RaceStrategyNotes, string];
  const phaseNotes = notes[phase];
  if (!phaseNotes || typeof phaseNotes !== 'object') return undefined;

  return (phaseNotes as Record<string, StrategySectionNote>)[field];
}

/**
 * Count items with user plans for a phase
 */
function getPlannedCount(
  phase: StrategyPhase,
  localNotes: Record<string, string>,
  savedPlans: Record<string, string>,
  strategyNotes?: RaceStrategyNotes
): number {
  const sections = getSectionsForPhase(phase);
  return sections.filter((section) => {
    const localPlan = localNotes[section.id];
    const persistedPlan = savedPlans[section.id];
    const savedNote = getSectionNote(section.id, strategyNotes);
    return (
      (localPlan && localPlan.trim()) ||
      (persistedPlan && persistedPlan.trim()) ||
      (savedNote?.userPlan && savedNote.userPlan.trim())
    );
  }).length;
}

/**
 * Hook to manage phase expansion with animations
 */
function usePhaseAnimations(defaultExpanded: StrategyPhase[] = ['start']) {
  const [expandedPhases, setExpandedPhases] = useState<Set<StrategyPhase>>(
    new Set(defaultExpanded)
  );

  // Create animation values for each phase
  const animations = useRef<Record<StrategyPhase, Animated.Value>>({
    start: new Animated.Value(defaultExpanded.includes('start') ? 1 : 0),
    upwind: new Animated.Value(defaultExpanded.includes('upwind') ? 1 : 0),
    downwind: new Animated.Value(defaultExpanded.includes('downwind') ? 1 : 0),
    markRounding: new Animated.Value(defaultExpanded.includes('markRounding') ? 1 : 0),
    finish: new Animated.Value(defaultExpanded.includes('finish') ? 1 : 0),
  }).current;

  // Content heights for each phase
  const contentHeights = useRef<Record<StrategyPhase, number>>({
    start: 0,
    upwind: 0,
    downwind: 0,
    markRounding: 0,
    finish: 0,
  }).current;

  const togglePhase = useCallback((phase: StrategyPhase) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      const isExpanding = !next.has(phase);

      if (isExpanding) {
        next.add(phase);
      } else {
        next.delete(phase);
      }

      // Animate
      Animated.spring(animations[phase], {
        toValue: isExpanding ? 1 : 0,
        useNativeDriver: false,
        tension: 100,
        friction: 12,
      }).start();

      return next;
    });
  }, [animations]);

  const setContentHeight = useCallback(
    (phase: StrategyPhase, height: number) => {
      if (height > 0 && height !== contentHeights[phase]) {
        contentHeights[phase] = height;
      }
    },
    [contentHeights]
  );

  const getContentStyle = useCallback(
    (phase: StrategyPhase) => {
      // Use measured height + extra padding to ensure all content including inputs is visible
      const measuredHeight = contentHeights[phase] || 600;
      const maxHeight = animations[phase].interpolate({
        inputRange: [0, 1],
        outputRange: [0, measuredHeight + 40], // Extra 40px for padding and input fields
      });

      const opacity = animations[phase].interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1],
      });

      return { maxHeight, opacity };
    },
    [animations, contentHeights]
  );

  return {
    expandedPhases,
    animations,
    togglePhase,
    setContentHeight,
    getContentStyle,
  };
}

export function TufteStrategyScreen({
  raceId,
  raceName = 'Race Strategy',
  raceDate,
  strategyNotes,
  onUpdateSection,
  venueName,
  windSpeed,
}: TufteStrategyScreenProps) {
  // Get current user for recommendations
  const { user } = useAuth();

  // Fetch personalized recommendations based on past race performance
  const { sectionData: recommendationData } = useStrategyRecommendations(
    user?.id,
    {
      venueName,
      windSpeed,
      enabled: !!user?.id,
    }
  );

  // Load and persist strategy plans to database
  const {
    plans: savedPlans,
    updatePlan: persistPlan,
    isLoading: isLoadingPlans,
  } = useRaceStrategyNotes(raceId);

  // Local state for immediate UI feedback (before debounced save completes)
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  // Phase expansion state and animations
  const {
    expandedPhases,
    animations,
    togglePhase,
    setContentHeight,
    getContentStyle,
  } = usePhaseAnimations(['start']);

  const handleUpdatePlan = useCallback(
    (sectionId: StrategySectionId, plan: string) => {
      // Update local state for immediate UI feedback
      setLocalNotes((prev) => ({ ...prev, [sectionId]: plan }));
      // Persist to database (debounced)
      persistPlan(sectionId, plan);
      // Also call parent callback if provided
      onUpdateSection?.(sectionId, plan);
    },
    [persistPlan, onUpdateSection]
  );

  const handleContentLayout = useCallback(
    (phase: StrategyPhase) => (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      setContentHeight(phase, height);
    },
    [setContentHeight]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Minimal header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>YOUR RACE PLAN</Text>
          <Text style={styles.headerDate}>{formatHeaderDate(raceDate)}</Text>
        </View>
        <Text style={styles.headerRaceName}>{raceName}</Text>
      </View>

      {/* Strategy content */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
        {PHASES.map((phase, phaseIndex) => {
          const sections = getSectionsForPhase(phase.key);
          const isExpanded = expandedPhases.has(phase.key);
          const plannedCount = getPlannedCount(phase.key, localNotes, savedPlans, strategyNotes);
          const contentStyle = getContentStyle(phase.key);

          return (
            <View key={phase.key} style={styles.phaseContainer}>
              <TufteAccordionPhaseHeader
                phase={phase.label}
                isExpanded={isExpanded}
                onToggle={() => togglePhase(phase.key)}
                plannedCount={plannedCount}
                totalCount={sections.length}
                isFirst={phaseIndex === 0}
                animationValue={animations[phase.key]}
              />

              {/* Animated collapsible content */}
              <Animated.View
                style={[
                  styles.contentWrapper,
                  {
                    maxHeight: contentStyle.maxHeight,
                    opacity: contentStyle.opacity,
                  },
                ]}
              >
                <View
                  style={styles.contentInner}
                  onLayout={handleContentLayout(phase.key)}
                >
                  {sections.map((section) => {
                    const savedNote = getSectionNote(section.id, strategyNotes);
                    const recommendation = recommendationData[section.id];
                    const localPlan = localNotes[section.id];
                    const persistedPlan = savedPlans[section.id];

                    // Merge saved notes with AI recommendations
                    // Priority: localPlan (typing) > persistedPlan (database) > savedNote (prop)
                    const mergedNote: StrategySectionNote = {
                      ...savedNote,
                      ...recommendation,
                      userPlan: localPlan ?? persistedPlan ?? savedNote?.userPlan,
                    };

                    return (
                      <TufteStrategySection
                        key={section.id}
                        section={section}
                        note={mergedNote}
                        onUpdatePlan={(plan) => handleUpdatePlan(section.id, plan)}
                      />
                    );
                  })}
                </View>
              </Animated.View>
            </View>
          );
        })}

        {/* Bottom padding for scroll and keyboard */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.tertiaryText,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerDate: {
    fontSize: 13,
    color: COLORS.secondaryText,
  },
  headerRaceName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  phaseContainer: {
    marginBottom: 4,
  },
  contentWrapper: {
    overflow: 'hidden',
  },
  contentInner: {
    paddingTop: 8,
    paddingBottom: 16, // Extra padding to ensure inputs are visible
  },
  bottomSpacer: {
    height: 120, // Extra space for keyboard and scrolling past last item
  },
});

export default TufteStrategyScreen;
