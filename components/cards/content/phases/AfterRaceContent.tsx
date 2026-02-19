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

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Animated, Platform, UIManager, Modal, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, X, CheckCircle2 } from 'lucide-react-native';

import { CardRaceData } from '../../types';
import { TileGrid } from '../TileGrid';
import { useRaceAnalysisState } from '@/hooks/useRaceAnalysisState';
import { useRaceAnalysisData } from '@/hooks/useRaceAnalysisData';
import { useEquipmentFlow } from '@/hooks/useEquipmentFlow';
import { useDebriefInterview } from '@/hooks/useDebriefInterview';
import { useEducationalChecklist } from '@/hooks/useEducationalChecklist';
import { Marginalia } from '@/components/ui/Marginalia';
import { RaceAnalysisService } from '@/services/RaceAnalysisService';
import { supabase } from '@/services/supabase';
import { StructuredDebriefInterview } from '@/components/races/review/StructuredDebriefInterview';
import { NextRaceFocusSection } from '@/components/races/review/NextRaceFocusSection';
import { GPSTrackTile } from '@/components/races/review/GPSTrackTile';
import { RaceContentActions } from '@/components/races/RaceContentActions';
import { RaceResultTile } from '@/components/races/review/RaceResultTile';
import { DebriefTile } from '@/components/races/review/DebriefTile';
import { AIAnalysisTile } from '@/components/races/review/AIAnalysisTile';
import { EquipmentTile } from '@/components/races/review/EquipmentTile';
import { EquipmentIssuesSheet } from '@/components/races/review/EquipmentIssuesSheet';
import { RaceResultDetailSheet } from '@/components/races/review/RaceResultDetailSheet';
import { NextRaceFocusTile } from '@/components/races/review/NextRaceFocusTile';
import { ShareInsightsTile } from '@/components/races/review/ShareInsightsTile';
import { PerformanceReviewTile } from '@/components/races/review/PerformanceReviewTile';
import { LearningCaptureTile } from '@/components/races/review/LearningCaptureTile';
import { CoachFeedbackTile } from '@/components/races/review/CoachFeedbackTile';
import { RaceSummaryTile } from '@/components/races/review/RaceSummaryTile';
import { EducationalChecklistSheet } from '@/components/races/review/EducationalChecklistSheet';
import { CoachingSuggestionTile, CoachSelectionSheet } from '@/components/races/coaching';
import { useSailorActiveCoaches } from '@/hooks/useSailorActiveCoaches';
import { coachingService } from '@/services/CoachingService';
import {
  POST_RACE_REVIEW_CONFIG,
  LEARNING_CAPTURE_CONFIG,
} from '@/lib/educationalChecklistConfig';
import { useAuth } from '@/providers/AuthProvider';
import {
  useActiveFocusIntent,
  useFocusIntentFromRace,
} from '@/hooks/useFocusIntent';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
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
  isExpanded?: boolean;
  /** Incrementing counter to trigger data refetch (e.g., after PostRaceInterview completes) */
  refetchTrigger?: number;
}

/**
 * Get ordinal suffix
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}


export function AfterRaceContent({
  race,
  userId: propsUserId,
  onOpenPostRaceInterview,
  isExpanded = true,
  refetchTrigger,
}: AfterRaceContentProps) {
  // Get current user if userId not provided
  const { user } = useAuth();
  const userId = propsUserId || user?.id;
  const router = useRouter();

  // Extract race location coordinates (available via useEnrichedRaces → venueCoordinates)
  const raceCoordinates = useMemo(() => {
    const vc = race.venueCoordinates as { lat: number; lng: number } | undefined;
    if (vc && typeof vc.lat === 'number' && typeof vc.lng === 'number') return vc;
    // Fallback: top-level latitude/longitude columns on regattas table
    const lat = race.latitude as number | undefined;
    const lng = race.longitude as number | undefined;
    if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng };
    // Fallback: check metadata sources
    const meta = race.metadata as Record<string, any> | undefined;
    if (meta?.venue_lat && meta?.venue_lng) return { lat: meta.venue_lat, lng: meta.venue_lng };
    if (meta?.venue_coordinates?.lat && meta?.venue_coordinates?.lng) return meta.venue_coordinates;
    if (meta?.start_coordinates?.lat && meta?.start_coordinates?.lng) return meta.start_coordinates;
    return null;
  }, [race.venueCoordinates, race.metadata, race.latitude, race.longitude]);

  // Analysis state and data
  const { state: analysisState, refetch: refetchState } = useRaceAnalysisState(race.id, race.date, userId);
  const { analysisData, refetch: refetchData } = useRaceAnalysisData(race.id, userId);

  // Structured debrief interview
  const {
    progress: debriefProgress,
    isComplete: debriefComplete,
    refetch: refetchDebrief,
  } = useDebriefInterview({
    raceId: race.id,
    userId,
  });

  // Refetch all data when refetchTrigger changes (e.g., after PostRaceInterview completes)
  useEffect(() => {
    if (refetchTrigger !== undefined && refetchTrigger > 0) {
      refetchState();
      refetchData();
      refetchDebrief();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchTrigger]); // Only trigger on refetchTrigger change, not callback changes

  // Modal state for interview
  const [showInterviewModal, setShowInterviewModal] = useState(false);

  // Result detail sheet state
  const [showResultSheet, setShowResultSheet] = useState(false);

  // Equipment sheet state
  const [showEquipmentSheet, setShowEquipmentSheet] = useState(false);

  // Next Race Focus modal
  const [showFocusModal, setShowFocusModal] = useState(false);

  // Share insights modal
  const [showShareModal, setShowShareModal] = useState(false);

  // Educational checklist sheets
  const [showPerformanceSheet, setShowPerformanceSheet] = useState(false);
  const [showLearningSheet, setShowLearningSheet] = useState(false);

  // Coach selection sheet
  const [showCoachSheet, setShowCoachSheet] = useState(false);

  // Active coaches for coaching suggestion tile
  const {
    hasCoach,
    primaryCoach,
    activeCoaches,
  } = useSailorActiveCoaches({
    raceBoatClass: race.boatClass,
    phase: 'review',
  });

  // Content status for share tile (loaded from Supabase)
  const [contentStatus, setContentStatus] = useState({ hasPrepNotes: false, hasPostRaceNotes: false });
  useEffect(() => {
    if (!race.id) return;
    supabase
      .from('regattas')
      .select('prep_notes, post_race_notes')
      .eq('id', race.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setContentStatus({
            hasPrepNotes: !!data.prep_notes,
            hasPostRaceNotes: !!data.post_race_notes,
          });
        }
      });
  }, [race.id]);

  // Focus intent hooks for tile status
  const { activeIntent } = useActiveFocusIntent();
  const { intent: intentFromThisRace } = useFocusIntentFromRace(race.id);

  // Equipment flow for cross-race issue tracking
  const {
    carryoverIssues,
    currentRaceIssues,
    addIssue,
    resolveIssue,
    removeIssue,
  } = useEquipmentFlow({
    userId,
    currentRaceId: race.id,
  });

  // Analysis generation state
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Track when AI analysis is newly generated (for visual highlight)
  const [isAIAnalysisNew, setIsAIAnalysisNew] = useState(false);

  // Toast notification for AI analysis completion
  const [showAIToast, setShowAIToast] = useState(false);
  const aiToastOpacity = useRef(new Animated.Value(0)).current;

  // Enable LayoutAnimation on Android
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  // Show AI analysis success feedback (toast + highlight)
  const showAIAnalysisSuccess = useCallback(() => {
    // Show toast notification
    setShowAIToast(true);
    Animated.sequence([
      Animated.timing(aiToastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(aiToastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setShowAIToast(false));

    // Mark as new for tile badge
    setIsAIAnalysisNew(true);
    setTimeout(() => setIsAIAnalysisNew(false), 6000);
  }, [aiToastOpacity]);

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
        // Show success feedback
        showAIAnalysisSuccess();
      } else {
        setAnalysisError('Analysis generation failed');
      }
    } catch (err) {
      console.error('Error generating analysis:', err);
      setAnalysisError('Failed to generate analysis');
    } finally {
      setIsGeneratingAnalysis(false);
    }
  }, [analysisData?.timerSessionId, refetchState, refetchData, showAIAnalysisSuccess]);

  // Derived data
  const hasResult = analysisState?.hasResult;
  const hasAIAnalysis = analysisState?.hasAIAnalysis;
  const coachAnnotations = analysisState?.coachAnnotations || [];

  // Auto-generate AI analysis when debrief is completed
  // Track the last raceId we triggered analysis for to avoid re-triggering
  const lastAutoTriggeredRaceId = useRef<string | null>(null);
  React.useEffect(() => {
    // Only auto-trigger when all conditions are met and we haven't triggered for this race yet
    const shouldTrigger =
      debriefComplete &&
      hasResult &&
      !hasAIAnalysis &&
      !isGeneratingAnalysis &&
      analysisData?.timerSessionId &&
      lastAutoTriggeredRaceId.current !== race.id;

    if (shouldTrigger) {
      lastAutoTriggeredRaceId.current = race.id;
      console.log('[AfterRaceContent] Auto-triggering AI analysis for race:', race.id);
      triggerAnalysis();
    }
  }, [debriefComplete, hasResult, hasAIAnalysis, isGeneratingAnalysis, analysisData?.timerSessionId, triggerAnalysis, race.id]);

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

  // Compute next uncompleted item labels for tiles
  const nextPerformanceItem = useMemo(() => {
    return POST_RACE_REVIEW_CONFIG.items.find(item => !isPerformanceItemCompleted(item.id));
  }, [isPerformanceItemCompleted]);

  const nextLearningItem = useMemo(() => {
    return LEARNING_CAPTURE_CONFIG.items.find(item => !isLearningItemCompleted(item.id));
  }, [isLearningItemCompleted]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  // Focus intent derived state for tile
  const hasPreviousFocus = !!activeIntent && activeIntent.status === 'active' && activeIntent.sourceRaceId !== race.id;
  const hasFocusSet = !!intentFromThisRace;

  // AI enabled when result + debrief complete
  const equipmentIssueCount = currentRaceIssues.length + carryoverIssues.length;
  const canGenerateAI = hasResult && debriefComplete;

  // Section completion states
  const debriefSectionComplete = debriefComplete;
  const reviewSectionComplete = !!hasAIAnalysis;
  const focusSectionComplete = hasFocusSet;

  return (
    <View style={styles.container}>

      {/* ================================================================ */}
      {/* SECTION 1: LOG YOUR RACE                                        */}
      {/* ================================================================ */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Log Your Race</Text>
            {hasResult && (
              <CheckCircle2 size={16} color={IOS_COLORS.green} />
            )}
          </View>
          <Text style={styles.sectionSubtitle}>Record results and equipment status</Text>
        </View>
        <TileGrid>
          <RaceResultTile
            position={analysisData?.selfReportedPosition}
            fleetSize={analysisData?.selfReportedFleetSize}
            raceCount={analysisData?.raceCount}
            userId={userId}
            raceId={race.id}
            onPress={() => setShowResultSheet(true)}
          />
          <EquipmentTile
            issueCount={equipmentIssueCount}
            issues={[...currentRaceIssues, ...carryoverIssues]}
            hasPendingNote={false}
            onPress={() => setShowEquipmentSheet(true)}
          />
        </TileGrid>
        {coachAnnotations.find(a => a.field === 'result') && (
          <Marginalia
            author="Coach"
            comment={coachAnnotations.find(a => a.field === 'result')!.comment}
            isNew={!coachAnnotations.find(a => a.field === 'result')!.isRead}
            variant="compact"
          />
        )}
      </View>

      {/* ================================================================ */}
      {/* SECTION 2: DEBRIEF                                              */}
      {/* ================================================================ */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Debrief</Text>
            {debriefSectionComplete && (
              <CheckCircle2 size={16} color={IOS_COLORS.green} />
            )}
          </View>
          <Text style={styles.sectionSubtitle}>
            {debriefComplete
              ? 'Debrief complete'
              : `Reflect on what happened — ${debriefProgress.answeredCount}/${debriefProgress.total} answered`}
          </Text>
        </View>
        <TileGrid>
          <DebriefTile
            answeredCount={debriefProgress.answeredCount}
            totalQuestions={debriefProgress.total}
            isComplete={debriefComplete}
            onPress={() => setShowInterviewModal(true)}
          />
          {/* Performance + Learning guide tiles (pre-debrief aids) */}
          {!debriefComplete ? (
            <PerformanceReviewTile
              completedCount={performanceCompletedCount}
              totalCount={performanceTotalCount}
              isComplete={performanceCompletedCount === performanceTotalCount && performanceTotalCount > 0}
              nextItemLabel={nextPerformanceItem?.label}
              onPress={() => setShowPerformanceSheet(true)}
            />
          ) : (
            <LearningCaptureTile
              completedCount={learningCompletedCount}
              totalCount={learningTotalCount}
              isComplete={learningCompletedCount === learningTotalCount && learningTotalCount > 0}
              nextItemLabel={nextLearningItem?.label}
              onPress={() => setShowLearningSheet(true)}
            />
          )}
        </TileGrid>
        {/* GPS Track as debrief visual aid — tile self-manages visibility via internal DB lookup */}
        {isExpanded && (
          <GPSTrackTile
            raceId={race.id}
            userId={userId}
            timerSessionId={analysisData?.timerSessionId}
            raceLatitude={raceCoordinates?.lat}
            raceLongitude={raceCoordinates?.lng}
            raceVenue={race.venue}
            onPress={() => {
              if (analysisData?.timerSessionId) {
                router.push(`/(tabs)/race-session/${analysisData.timerSessionId}` as any);
              }
            }}
          />
        )}
      </View>

      {/* ================================================================ */}
      {/* SECTION 3: RACE REVIEW                                          */}
      {/* ================================================================ */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Race Review</Text>
            {reviewSectionComplete && (
              <CheckCircle2 size={16} color={IOS_COLORS.green} />
            )}
          </View>
          <Text style={styles.sectionSubtitle}>
            {hasAIAnalysis
              ? 'AI insights and race summary'
              : canGenerateAI
                ? 'Generating AI analysis...'
                : 'Complete debrief to unlock AI analysis'}
          </Text>
        </View>
        {/* AI Analysis tile — full width when complete, small when locked */}
        {hasAIAnalysis ? (
          <AIAnalysisTile
            hasAnalysis={true}
            canGenerate={canGenerateAI}
            isGenerating={false}
            hasError={false}
            insightText={analysisData?.focusNextRace}
            strengthText={analysisData?.strengthIdentified}
            isNew={isAIAnalysisNew}
            onPress={() => {
              if (analysisData?.timerSessionId) {
                router.push(`/(tabs)/race-session/${analysisData.timerSessionId}` as any);
              }
            }}
          />
        ) : (
          <TileGrid>
            <AIAnalysisTile
              hasAnalysis={false}
              canGenerate={canGenerateAI}
              isGenerating={isGeneratingAnalysis}
              hasError={!!analysisError}
              insightText={analysisData?.focusNextRace}
              isNew={isAIAnalysisNew}
              onPress={
                analysisError
                  ? triggerAnalysis
                  : canGenerateAI && !isGeneratingAnalysis
                    ? triggerAnalysis
                    : () => {}
              }
            />
          </TileGrid>
        )}
        {/* Race Summary tile */}
        {isExpanded && (
          <RaceSummaryTile
            raceDate={race.date}
            resultText={resultText || undefined}
            hasResult={!!hasResult}
            wind={race.wind}
            tide={race.tide}
            keyLearning={analysisData?.keyLearning}
            debriefComplete={debriefComplete}
            hasAIAnalysis={!!hasAIAnalysis}
            onPress={() => {
              if (analysisData?.timerSessionId) {
                router.push(`/(tabs)/race-session/${analysisData.timerSessionId}` as any);
              }
            }}
          />
        )}
        {/* Coach Feedback */}
        {coachAnnotations.find(a => a.field === 'general') && (
          <TileGrid>
            <CoachFeedbackTile
              hasFeedback={true}
              isNew={!coachAnnotations.find(a => a.field === 'general')!.isRead}
              feedbackPreview={coachAnnotations.find(a => a.field === 'general')!.comment}
              onPress={() => {}}
            />
          </TileGrid>
        )}
        {/* Coaching Suggestion - show when debrief is complete */}
        {debriefComplete && (
          <TileGrid>
            <CoachingSuggestionTile
              hasCoach={hasCoach}
              primaryCoach={primaryCoach}
              hasMultipleCoaches={activeCoaches.length > 1}
              phase="review"
              raceBoatClass={race.boatClass}
              onPress={() => {
                if (hasCoach && activeCoaches.length === 1 && primaryCoach) {
                  // Single coach - share debrief directly
                  coachingService.shareDebriefWithCoach({
                    coachId: primaryCoach.coachId,
                    raceId: race.id,
                    sailorId: userId || '',
                    raceName: race.name,
                  });
                } else if (hasCoach && activeCoaches.length > 1) {
                  // Multiple coaches - show selection sheet
                  setShowCoachSheet(true);
                } else {
                  // No coach - navigate to coach discovery
                  router.push(`/coach/discover?boatClass=${encodeURIComponent(race.boatClass || '')}&source=review` as any);
                }
              }}
              onChooseAnotherCoach={() => setShowCoachSheet(true)}
            />
          </TileGrid>
        )}
      </View>

      {/* ================================================================ */}
      {/* SECTION 4: NEXT RACE FOCUS                                      */}
      {/* ================================================================ */}
      {isExpanded && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Next Race Focus</Text>
              {focusSectionComplete && (
                <CheckCircle2 size={16} color={IOS_COLORS.green} />
              )}
            </View>
            <Text style={styles.sectionSubtitle}>
              {hasFocusSet
                ? 'Focus set — ready for next race'
                : 'Set your intent for deliberate improvement'}
            </Text>
          </View>
          <TileGrid>
            <NextRaceFocusTile
              hasFocusSet={hasFocusSet}
              hasPreviousFocus={hasPreviousFocus}
              hasEvaluated={false}
              focusText={intentFromThisRace?.focusText}
              aiSuggestedFocus={analysisData?.focusNextRace}
              previousFocusText={activeIntent?.focusText}
              onPress={() => setShowFocusModal(true)}
            />
            <ShareInsightsTile
              hasPrepNotes={contentStatus.hasPrepNotes}
              hasPostRaceNotes={contentStatus.hasPostRaceNotes}
              keyLearning={analysisData?.keyLearning}
              strengthIdentified={analysisData?.strengthIdentified}
              debriefComplete={debriefComplete}
              onPress={() => setShowShareModal(true)}
            />
          </TileGrid>
        </View>
      )}

      {/* Equipment Issues Sheet */}
      <EquipmentIssuesSheet
        isOpen={showEquipmentSheet}
        onClose={() => setShowEquipmentSheet(false)}
        carryoverIssues={carryoverIssues}
        currentRaceIssues={currentRaceIssues}
        onAddIssue={(desc, priority) => addIssue(desc, priority, race.id, race.name)}
        onResolveIssue={(id) => resolveIssue(id, race.id)}
        onRemoveIssue={removeIssue}
        raceName={race.name}
      />

      {/* Race Result Detail Sheet */}
      <RaceResultDetailSheet
        isOpen={showResultSheet}
        onClose={() => setShowResultSheet(false)}
        raceId={race.id}
        raceName={race.name}
        raceDate={race.date}
        userId={userId}
        analysisData={analysisData}
        timerSessionId={analysisData?.timerSessionId}
        onSaveComplete={() => {
          refetchState();
          refetchData();
        }}
      />

      {/* Structured Debrief Interview Modal */}
      {/* Always render modal to prevent unmount/remount issues - control visibility only via visible prop */}
      <StructuredDebriefInterview
        visible={showInterviewModal && !!userId}
        raceId={race.id}
        userId={userId || ''}
        raceName={race.name}
        onClose={() => {
          setShowInterviewModal(false);
          // Refetch in case user answered questions before closing
          refetchDebrief();
          refetchData();
        }}
        onComplete={() => {
          setShowInterviewModal(false);
          // Refetch all data to update UI and trigger auto-analysis
          refetchDebrief();
          refetchState();
          refetchData(); // Needed to get timerSessionId for AI analysis
        }}
      />

      {/* Next Race Focus Modal */}
      <Modal
        visible={showFocusModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFocusModal(false)}
      >
        <View style={styles.focusModalContainer}>
          <View style={styles.focusModalHeader}>
            <Text style={styles.focusModalTitle}>Next Race Focus</Text>
            <Pressable
              style={styles.focusModalClose}
              onPress={() => setShowFocusModal(false)}
              hitSlop={8}
            >
              <X size={24} color={IOS_COLORS.gray} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.focusModalScroll}
            contentContainerStyle={styles.focusModalContent}
          >
            <NextRaceFocusSection
              raceId={race.id}
              userId={userId}
              isExpanded={true}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Share Insights Modal */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.focusModalContainer}>
          <View style={styles.focusModalHeader}>
            <Text style={styles.focusModalTitle}>Share Insights</Text>
            <Pressable
              style={styles.focusModalClose}
              onPress={() => setShowShareModal(false)}
              hitSlop={8}
            >
              <X size={24} color={IOS_COLORS.gray} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.focusModalScroll}
            contentContainerStyle={styles.focusModalContent}
          >
            <RaceContentActions
              regattaId={race.id}
              raceName={race.name}
              raceDate={race.date}
              variant="full"
              onContentSaved={() => {
                // Refresh content status for the tile
                supabase
                  .from('regattas')
                  .select('prep_notes, post_race_notes')
                  .eq('id', race.id)
                  .single()
                  .then(({ data }) => {
                    if (data) {
                      setContentStatus({
                        hasPrepNotes: !!data.prep_notes,
                        hasPostRaceNotes: !!data.post_race_notes,
                      });
                    }
                  });
              }}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Performance Review Checklist Sheet */}
      <EducationalChecklistSheet
        isOpen={showPerformanceSheet}
        onClose={() => setShowPerformanceSheet(false)}
        title="Performance Review"
        subtitle="Review each aspect of your race to identify areas for improvement. Tap items to expand and learn more."
        accentColor="#007AFF"
        items={POST_RACE_REVIEW_CONFIG.items}
        isItemCompleted={isPerformanceItemCompleted}
        toggleItem={togglePerformanceItem}
        completedCount={performanceCompletedCount}
        totalCount={performanceTotalCount}
      />

      {/* Learning Capture Checklist Sheet */}
      <EducationalChecklistSheet
        isOpen={showLearningSheet}
        onClose={() => setShowLearningSheet(false)}
        title="Learning & Improvement"
        subtitle="Capture your key learnings while they're fresh. Tap items to expand and see guidance."
        accentColor="#AF52DE"
        items={LEARNING_CAPTURE_CONFIG.items}
        isItemCompleted={isLearningItemCompleted}
        toggleItem={toggleLearningItem}
        completedCount={learningCompletedCount}
        totalCount={learningTotalCount}
      />

      {/* Coach Selection Sheet (for multiple coaches) */}
      <CoachSelectionSheet
        isOpen={showCoachSheet}
        onClose={() => setShowCoachSheet(false)}
        coaches={activeCoaches}
        phase="review"
        raceId={race.id}
        raceBoatClass={race.boatClass}
        onSelectCoach={(coach, action) => {
          if (action === 'share') {
            coachingService.shareDebriefWithCoach({
              coachId: coach.coachId,
              raceId: race.id,
              sailorId: userId || '',
              raceName: race.name,
            });
          } else {
            // Message action - navigate to coach messaging
            router.push(`/coach/${coach.coachId}?action=message&context=race_review&raceId=${race.id}` as any);
          }
        }}
      />

      {/* Toast notification for AI Analysis completion */}
      {showAIToast && (
        <Animated.View style={[styles.aiToast, { opacity: aiToastOpacity }]}>
          <View style={styles.aiToastContent}>
            <Sparkles size={16} color="#FFFFFF" />
            <Text style={styles.aiToastText}>AI Analysis ready!</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 24,
  },
  // Section grouping
  section: {
    gap: 12,
  },
  sectionHeader: {
    gap: 2,
    paddingBottom: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    lineHeight: 18,
  },
  tileRow: {
    flexDirection: 'row',
    gap: 12,
  },

  // Focus modal
  focusModalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  focusModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },
  focusModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  focusModalClose: {
    padding: 4,
  },
  focusModalScroll: {
    flex: 1,
  },
  focusModalContent: {
    padding: 16,
  },

  // Toast notification for AI Analysis
  aiToast: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  aiToastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: IOS_COLORS.purple,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  aiToastText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AfterRaceContent;
