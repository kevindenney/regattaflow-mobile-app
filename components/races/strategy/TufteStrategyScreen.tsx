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
 * Supports race-type-specific strategy sections:
 * - Fleet racing: START, UPWIND, DOWNWIND, MARK ROUNDING, FINISH
 * - Distance racing: Passage planning, weather routing, crew management, leg-by-leg strategy
 * - Match racing: Pre-start, dial-up, control, coverage tactics
 * - Team racing: Team coordination, combinations, passing plays
 *
 * "Above all else show the data" - Edward Tufte
 */

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { TUFTE_BACKGROUND } from '@/components/cards/constants';
import { CourseMapPreview } from '@/components/races/CourseMapPreview';
import type { PositionedCourse, CourseType } from '@/types/courses';
import { supabase } from '@/services/supabase';
import { isUuid } from '@/utils/uuid';
import {
  type StrategySectionId,
  type RaceStrategyNotes,
  type StrategySectionNote,
  type RaceType,
  type PhaseInfo,
  type StrategySectionMeta,
  type DynamicPhaseKey,
  type StrategyPhase,
} from '@/types/raceStrategy';
import { getSectionsForPhaseFromList } from '@/lib/strategy';
import { useAuth } from '@/providers/AuthProvider';
import { useStrategyRecommendations } from '@/hooks/useStrategyRecommendations';
import { useRaceStrategyNotes } from '@/hooks/useRaceStrategyNotes';
import { useRaceTypeStrategy } from '@/hooks/useRaceTypeStrategy';
import { TufteAccordionPhaseHeader } from './TufteAccordionPhaseHeader';
import { TufteStrategySection } from './TufteStrategySection';

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
  /** Override race type (if not provided, will be fetched from database) */
  raceType?: RaceType;
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
 * Works with both legacy fleet racing notes and dynamic section IDs
 */
function getSectionNote(
  sectionId: string,
  notes?: RaceStrategyNotes
): StrategySectionNote | undefined {
  if (!notes) return undefined;

  // Legacy fleet racing: section ID is 'phase.field' format
  const parts = sectionId.split('.');
  if (parts.length === 2) {
    const [phase, field] = parts as [keyof RaceStrategyNotes, string];
    const phaseNotes = notes[phase];
    if (phaseNotes && typeof phaseNotes === 'object') {
      return (phaseNotes as Record<string, StrategySectionNote>)[field];
    }
  }

  // For dynamic sections (leg.1.navigation, peak.lantau.climb, etc.)
  // These won't have pre-existing notes in the legacy structure
  return undefined;
}

/**
 * Count items with user plans for a phase
 */
function getPlannedCount(
  phaseKey: string,
  allSections: StrategySectionMeta[],
  localNotes: Record<string, string>,
  savedPlans: Record<string, string>,
  strategyNotes?: RaceStrategyNotes
): number {
  const sections = getSectionsForPhaseFromList(phaseKey, allSections);
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
 * Supports dynamic phases for different race types
 */
function useDynamicPhaseAnimations(
  phases: PhaseInfo[],
  defaultExpandedKey?: string
) {
  // Expand first phase by default
  const defaultExpanded = defaultExpandedKey || (phases[0]?.key as string);

  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    new Set([defaultExpanded])
  );

  // Dynamic animation values - keyed by phase key string
  const animationsRef = useRef<Record<string, Animated.Value>>({});
  const contentHeightsRef = useRef<Record<string, number>>({});

  // Initialize animations for new phases
  useEffect(() => {
    phases.forEach((phase) => {
      const key = phase.key as string;
      if (!animationsRef.current[key]) {
        animationsRef.current[key] = new Animated.Value(
          expandedPhases.has(key) ? 1 : 0
        );
        contentHeightsRef.current[key] = 0;
      }
    });
  }, [phases, expandedPhases]);

  const togglePhase = useCallback((phaseKey: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      const isExpanding = !next.has(phaseKey);

      if (isExpanding) {
        next.add(phaseKey);
      } else {
        next.delete(phaseKey);
      }

      // Ensure animation value exists
      if (!animationsRef.current[phaseKey]) {
        animationsRef.current[phaseKey] = new Animated.Value(0);
      }

      // Animate
      Animated.spring(animationsRef.current[phaseKey], {
        toValue: isExpanding ? 1 : 0,
        useNativeDriver: false,
        tension: 100,
        friction: 12,
      }).start();

      return next;
    });
  }, []);

  const setContentHeight = useCallback((phaseKey: string, height: number) => {
    if (height > 0 && height !== contentHeightsRef.current[phaseKey]) {
      contentHeightsRef.current[phaseKey] = height;
    }
  }, []);

  const getContentStyle = useCallback((phaseKey: string) => {
    // Ensure animation value exists
    if (!animationsRef.current[phaseKey]) {
      animationsRef.current[phaseKey] = new Animated.Value(0);
    }

    const animation = animationsRef.current[phaseKey];
    const measuredHeight = contentHeightsRef.current[phaseKey] || 600;

    const maxHeight = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, measuredHeight + 40],
    });

    const opacity = animation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0, 1],
    });

    return { maxHeight, opacity };
  }, []);

  const getAnimationValue = useCallback((phaseKey: string) => {
    if (!animationsRef.current[phaseKey]) {
      animationsRef.current[phaseKey] = new Animated.Value(0);
    }
    return animationsRef.current[phaseKey];
  }, []);

  return {
    expandedPhases,
    togglePhase,
    setContentHeight,
    getContentStyle,
    getAnimationValue,
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
  raceType: propRaceType,
}: TufteStrategyScreenProps) {
  // Get current user for recommendations
  const { user } = useAuth();

  // Fetch race type and generate phases/sections
  const {
    raceType,
    phases,
    sections,
    isLoading: isLoadingRaceType,
  } = useRaceTypeStrategy(raceId, raceName);

  // Use prop race type if provided, otherwise use fetched type
  const effectiveRaceType = propRaceType || raceType;

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

  // Positioned course for map overlay
  const [positionedCourse, setPositionedCourse] = useState<PositionedCourse | null>(null);
  const [positionedCourseLoading, setPositionedCourseLoading] = useState(false);

  // Fetch positioned course if available
  useEffect(() => {
    async function fetchPositionedCourse() {
      // Skip query for demo races or invalid UUIDs to prevent 400 errors
      if (!raceId || !isUuid(raceId)) return;

      setPositionedCourseLoading(true);
      try {
        // Get the regatta_id for this race
        const { data: raceData, error: raceError } = await supabase
          .from('races')
          .select('regatta_id')
          .eq('id', raceId)
          .single();

        if (raceError || !raceData?.regatta_id) {
          setPositionedCourseLoading(false);
          return;
        }

        // Fetch positioned course for this regatta
        const { data, error } = await supabase
          .from('race_positioned_courses')
          .select('*')
          .eq('regatta_id', raceData.regatta_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          // No positioned course found, that's okay
          setPositionedCourse(null);
        } else if (data) {
          // Convert database format to PositionedCourse
          setPositionedCourse({
            id: data.id,
            regattaId: data.regatta_id,
            sourceDocumentId: data.source_document_id,
            userId: data.user_id,
            courseType: data.course_type as CourseType,
            marks: data.marks || [],
            startLine: {
              pin: { lat: data.start_pin_lat, lng: data.start_pin_lng },
              committee: { lat: data.start_committee_lat, lng: data.start_committee_lng },
            },
            windDirection: data.wind_direction,
            legLengthNm: parseFloat(data.leg_length_nm),
            hasManualAdjustments: data.has_manual_adjustments,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          });
        }
      } catch (err) {
        console.error('Error fetching positioned course:', err);
      } finally {
        setPositionedCourseLoading(false);
      }
    }

    fetchPositionedCourse();
  }, [raceId]);

  // Phase expansion state and animations - using dynamic phases
  const {
    expandedPhases,
    togglePhase,
    setContentHeight,
    getContentStyle,
    getAnimationValue,
  } = useDynamicPhaseAnimations(phases);

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
    (phaseKey: string) => (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      setContentHeight(phaseKey, height);
    },
    [setContentHeight]
  );

  // Show loading state while fetching race type
  if (isLoadingRaceType) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.text} />
          <Text style={styles.loadingText}>Loading strategy...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          {/* Course Map Section */}
          {positionedCourse && (
            <View style={styles.courseMapSection}>
              <Text style={styles.courseMapLabel}>COURSE MAP</Text>
              <CourseMapPreview
                course={positionedCourse}
                height={180}
                showControls={true}
                compact={false}
              />
            </View>
          )}

        {phases.map((phase, phaseIndex) => {
          const phaseKey = phase.key as string;
          const phaseSections = getSectionsForPhaseFromList(phaseKey, sections);
          const isExpanded = expandedPhases.has(phaseKey);
          const plannedCount = getPlannedCount(
            phaseKey,
            sections,
            localNotes,
            savedPlans,
            strategyNotes
          );
          const contentStyle = getContentStyle(phaseKey);

          return (
            <View key={phaseKey} style={styles.phaseContainer}>
              <TufteAccordionPhaseHeader
                phase={phase.label}
                isExpanded={isExpanded}
                onToggle={() => togglePhase(phaseKey)}
                plannedCount={plannedCount}
                totalCount={phaseSections.length}
                isFirst={phaseIndex === 0}
                animationValue={getAnimationValue(phaseKey)}
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
                  onLayout={handleContentLayout(phaseKey)}
                >
                  {phaseSections.map((section) => {
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
                        onUpdatePlan={(plan) => handleUpdatePlan(section.id as StrategySectionId, plan)}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.secondaryText,
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
  courseMapSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  courseMapLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.tertiaryText,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
});

export default TufteStrategyScreen;
