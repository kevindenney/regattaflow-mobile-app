import {
  CardGrid,
  TUFTE_BACKGROUND,
  calculateCardDimensions,
  getCardContentComponent,
  type CardRaceData,
  type CardType
} from '@/components/cards';
import { IOS_COLORS } from '@/components/cards/constants';

import {
  PreRaceStrategySection,
  RaceConditionsCard,
  RacePhaseHeader,
} from '@/components/race-detail';
import type { RaceDocument as RaceDocumentsCardDocument } from '@/components/race-detail/RaceDocumentsCard';
import {
  AIVenueInsightsCard,
  BoatSetupSection,
  ClassExpertsSection,
  CourseOutlineCard,
  DemoNotice,
  DemoRacesCarousel,
  DistanceRaceContentSection,
  FleetActivityFeed,
  FleetRaceContentSection,
  FleetStrategySection,
  PostRaceAnalysisSection,
  RaceModalsSection,
  RacesFloatingHeader,
  RealRacesCarousel,
  RegulatoryDigestCard,
  SocialTimelineView,
  TeamLogisticsSection,
} from '@/components/races';
import { RaceListSection } from '@/components/races/RaceListSection';
import { SeasonArchive } from '@/components/seasons/SeasonArchive';
import { IOSRacesScreen } from '@/components/races/ios';
import { AIPatternDetection } from '@/components/races/debrief/AIPatternDetection';
import { OnWaterTrackingView } from '@/components/races/OnWaterTrackingView';
import { calculatePerformanceMetrics } from '@/components/races/PerformanceMetrics';
import { PlanModeContent } from '@/components/races/plan';
import { TacticalCalculations } from '@/components/races/TacticalDataOverlay';
import { SeasonHeader } from '@/components/seasons/SeasonHeader';
import { SeasonPickerModal } from '@/components/seasons/SeasonPickerModal';
import { SeasonSettingsModal } from '@/components/seasons/SeasonSettingsModal';
import SignupPromptModal from '@/components/auth/SignupPromptModal';
import { OnboardingTour, TourStep } from '@/components/onboarding/OnboardingTour';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { ErrorMessage } from '@/components/ui/error';
import { DashboardSkeleton } from '@/components/ui/loading';
import { MOCK_RACES } from '@/constants/mockData';
import { useRaceBriefSync } from '@/hooks/ai/useRaceBriefSync';
import { useActiveRaceSummary } from '@/hooks/useActiveRaceSummary';
import { useAddRace } from '@/hooks/useAddRace';
import { useCoachContext } from '@/hooks/useCoachContext';
import { useDashboardData } from '@/hooks/useData';
import { useEnrichedRaces } from '@/hooks/useEnrichedRaces';
import { useFollowedTimelines } from '@/hooks/useFollowedTimelines';
import { useGuestRaces } from '@/hooks/useGuestRaces';
import { useNextMarkData } from '@/hooks/useNextMarkData';
import { useOffline } from '@/hooks/useOffline';
import { usePostRaceInterview } from '@/hooks/usePostRaceInterview';
import { usePracticeSessions } from '@/hooks/usePracticeSessions';
import { useRaceBriefData } from '@/hooks/useRaceBriefData';
import { useRaceClassSelection } from '@/hooks/useRaceClassSelection';
import { useRaceCourse } from '@/hooks/useRaceCourse';
import { useRaceDebriefData } from '@/hooks/useRaceDebriefData';
import { useRaceDocuments } from '@/hooks/useRaceDocuments';
import { useRaceLayoutData } from '@/hooks/useRaceLayoutData';
import { DEMO_RACE, useRaceListData } from '@/hooks/useRaceListData';
import { useRaceMarks } from '@/hooks/useRaceMarks';
import { useRacePhaseDetection } from '@/hooks/useRacePhaseDetection';
import { useRacePhaseInput } from '@/hooks/useRacePhaseInput';
import { useRacePreparation } from '@/hooks/useRacePreparation';
import { useRacePreparationData } from '@/hooks/useRacePreparationData';
import { useLiveRaces, useUserRaceResults, withdrawFromRace } from '@/hooks/useRaceResults';
import { useRaceTuningRecommendation } from '@/hooks/useRaceTuningRecommendation';
import { useRaceWeather } from '@/hooks/useRaceWeather';
import { useSailorProfile } from '@/hooks/useSailorProfile';
import { useCurrentSeason, useUserSeasons, useSeasonRegattas } from '@/hooks/useSeason';
import { useStrategySharing } from '@/hooks/useStrategySharing';
import { useTacticalSnapshots } from '@/hooks/useTacticalSnapshots';
import { useTideDepthSnapshots } from '@/hooks/useTideDepthSnapshots';
import { useVenueCenter } from '@/hooks/useVenueCenter';
import { useVenueCoordinates } from '@/hooks/useVenueCoordinates';
import { useVenueDetection } from '@/hooks/useVenueDetection';
import { useVenueInsights } from '@/hooks/useVenueInsights';
import { useScrollToolbarHide } from '@/hooks/useScrollToolbarHide';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import {
  ADD_RACE_CARD_DISMISSED_KEY,
  SAMPLE_RACE_DISMISSED_KEY,
  normalizeDocumentType as normalizeDocumentTypeUtil,
  type RegulatoryAcknowledgements
} from '@/lib/races';
import { createLogger } from '@/lib/utils/logger';
import { useAuth } from '@/providers/AuthProvider';
import { DemoRaceService } from '@/services/DemoRaceService';
import { isDemoRaceId } from '@/lib/demo/demoRaceData';
import { createSailorSampleData } from '@/services/onboarding/SailorSampleDataService';
import type { RaceDocumentWithDetails } from '@/services/RaceDocumentService';
import { supabase } from '@/services/supabase';
import { TacticalZoneGenerator } from '@/services/TacticalZoneGenerator';
import { useRaceConditions } from '@/stores/raceConditionsStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, Animated, Dimensions, LayoutRectangle, Modal, Platform, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const logger = createLogger('RacesScreen');

// Destructure tactical calculations for easy access
const { calculateDistance, calculateBearing } = TacticalCalculations;

// Types, constants, and utilities imported from @/lib/races:
// - ActiveRaceSummary, RaceBriefData, RigPreset, RegulatoryDigestData, RegulatoryAcknowledgements
// - TacticalWindSnapshot, TacticalCurrentSnapshot, GPSPoint, DebriefSplitTime
// - DOCUMENT_TYPE_OPTIONS, ADD_RACE_CARD_DISMISSED_KEY, MOCK_GPS_TRACK, MOCK_SPLIT_TIMES
// - normalizeDirection, pickNumeric, normalizeCurrentType, extractWindSnapshot
// - extractCurrentSnapshot, parseGpsTrack, parseSplitTimes, detectRaceType

// Local helper for RaceDocumentsCard type conversion
const normalizeDocumentType = (
  type: RaceDocumentWithDetails['documentType']
): RaceDocumentsCardDocument['type'] => {
  return normalizeDocumentTypeUtil(type) as RaceDocumentsCardDocument['type'];
};

export default function RacesScreen() {
  const auth = useAuth();
  const { user, userProfile, signedIn, ready, isDemoSession, userType, isGuest } = auth;

  // Safe area insets for proper header spacing
  const insets = useSafeAreaInsets();

  // State for dismissing the demo notice
  const [demoNoticeDismissed, setDemoNoticeDismissed] = useState(false);

  // Season archive modal
  const [showFullArchive, setShowFullArchive] = useState(false);

  // Season state and hooks
  const [showSeasonSettings, setShowSeasonSettings] = useState(false);
  const [showSeasonPicker, setShowSeasonPicker] = useState(false);
  // filterSeasonId: null = "All Races", undefined = use current season, string = specific season
  const [filterSeasonId, setFilterSeasonId] = useState<string | null | undefined>(undefined);
  const { data: currentSeason, isLoading: loadingCurrentSeason, refetch: refetchCurrentSeason } = useCurrentSeason();
  const { data: userSeasons, refetch: refetchSeasons } = useUserSeasons();

  // Use demo season for guest users
  const effectiveSeason = useMemo(() => {
    if (isGuest) {
      return DemoRaceService.getDemoSeason() as any; // Cast to match SeasonWithSummary type
    }
    return currentSeason;
  }, [isGuest, currentSeason]);

  // Determine the actual season to use for filtering
  // If filterSeasonId is undefined, use current season (default behavior)
  // If filterSeasonId is null, show all races (no filter)
  // If filterSeasonId is a string, filter by that specific season
  const activeFilterSeasonId = filterSeasonId === undefined
    ? effectiveSeason?.id ?? null // Default to current season, or null if no current season
    : filterSeasonId;

  // Get the display season for the header (either the filter season or current season)
  const displaySeason = useMemo(() => {
    if (activeFilterSeasonId === null) {
      // "All Races" mode - no specific season
      return null;
    }
    if (activeFilterSeasonId === effectiveSeason?.id) {
      return effectiveSeason;
    }
    // Find the season in userSeasons
    const found = userSeasons?.find(s => s.id === activeFilterSeasonId);
    if (found) {
      // Convert SeasonListItem to SeasonWithSummary-like structure for SeasonHeader
      return {
        ...found,
        summary: {
          regatta_count: found.regatta_count,
          total_races: found.race_count,
          completed_races: found.completed_count,
          upcoming_races: found.race_count - found.completed_count,
        },
      } as any;
    }
    return effectiveSeason;
  }, [activeFilterSeasonId, effectiveSeason, userSeasons]);

  // Get regattas linked to the filter season for filtering
  const { data: seasonRegattas } = useSeasonRegattas(activeFilterSeasonId || undefined);
  const seasonRegattaIds = useMemo(() => {
    if (!seasonRegattas) return new Set<string>();
    return new Set(seasonRegattas.map(sr => sr.regatta_id));
  }, [seasonRegattas]);

  const fetchUserProfileRef = useRef(auth.fetchUserProfile);
  useEffect(() => {
    fetchUserProfileRef.current = auth.fetchUserProfile;
  }, [auth.fetchUserProfile]);
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ selected?: string }>();
  const [showCalendarImport, setShowCalendarImport] = useState(false);
  const mainScrollViewRef = useRef<ScrollView>(null); // Main vertical ScrollView
  const raceCardsScrollViewRef = useRef<ScrollView>(null); // Horizontal race cards ScrollView
  const demoRaceCardsScrollViewRef = useRef<ScrollView>(null); // Horizontal demo race cards ScrollView
  const hasAutoCenteredNextRace = useRef(false);
  const hasTriedSampleCreation = useRef(false);
  const [creatingSampleData, setCreatingSampleData] = useState(false);
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

  // Mobile detection - only actual native mobile platforms (not web at any size)
  const isMobileNative = Platform.OS === 'ios' || Platform.OS === 'android';

  // Two-zone layout constants: 70% hero (race cards), 30% detail cards
  // Cards should dominate the screen for easy viewing and swiping
  const HEADER_HEIGHT = Platform.OS === 'ios' ? 140 : 120; // Including safe area, nav header, and venue display
  const TAB_BAR_HEIGHT = 80; // Bottom tab bar
  const AVAILABLE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - TAB_BAR_HEIGHT;
  const HERO_ZONE_HEIGHT = Math.floor(AVAILABLE_HEIGHT * 0.72); // 72% for race card + timeline dots
  const DETAIL_ZONE_HEIGHT = AVAILABLE_HEIGHT - HERO_ZONE_HEIGHT; // Remaining 28% for detail cards
  const RACE_CARD_HEIGHT = HERO_ZONE_HEIGHT - 50; // Leave room for timeline dots only (header moved outside)

  // Full-screen card dimensions - cards take up most of the screen
  // Calculate centering padding so cards snap to center of screen
  const MOBILE_CARD_WIDTH = Math.min(SCREEN_WIDTH - 32, 375); // Card width
  const MOBILE_CARD_GAP = 16; // Gap between cards (Apple HIG: sufficient space for shadows to breathe)
  const MOBILE_CENTERING_PADDING = (SCREEN_WIDTH - MOBILE_CARD_WIDTH) / 2; // Padding to center cards
  const MOBILE_SNAP_INTERVAL = MOBILE_CARD_WIDTH + MOBILE_CARD_GAP;

  // Web dimensions - also use full-screen cards
  const DESKTOP_RACE_CARD_WIDTH = Math.min(SCREEN_WIDTH - 32, 375);
  const DESKTOP_RACE_CARD_TOTAL_WIDTH = DESKTOP_RACE_CARD_WIDTH + MOBILE_CARD_GAP;

  // Dynamic values - same for all platforms now (full-screen cards)
  const RACE_CARD_WIDTH = MOBILE_CARD_WIDTH;
  const RACE_CARD_TOTAL_WIDTH = MOBILE_SNAP_INTERVAL;

  // State for horizontal scroll arrows
  const [scrollX, setScrollX] = useState(0);
  const [scrollContentWidth, setScrollContentWidth] = useState(0);

  const [regulatorySectionY, setRegulatorySectionY] = useState(0);
  const [logisticsSectionY, setLogisticsSectionY] = useState(0);

  // Add race state is now provided by useAddRace hook below
  // Post-race interview state is now provided by usePostRaceInterview hook below

  // Toolbar measured height for content padding
  const [toolbarHeight, setToolbarHeight] = useState(0);
  // SeasonHeader compact height: paddingVertical: 8 * 2 + text ~18px = ~34px
  const SEASON_HEADER_HEIGHT = 34;
  const { toolbarHidden, handleScroll: handleToolbarScroll } = useScrollToolbarHide();
  // Total header height including SeasonHeader (always visible now)
  const totalHeaderHeight = toolbarHeight + SEASON_HEADER_HEIGHT;

  // Selected race detail state
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const hasActiveRace = selectedRaceId !== null;
  const [selectedRaceData, setSelectedRaceData] = useState<any>(null);
  const [selectedRaceMarks, setSelectedRaceMarks] = useState<any[]>([]);
  const [loadingRaceDetail, setLoadingRaceDetail] = useState(false);
  // raceDocuments, loadingRaceDocuments, raceDocumentsError, upload handlers are now provided by useRaceDocuments hook below
  const [selectedDemoRaceId, setSelectedDemoRaceId] = useState<string | null>(MOCK_RACES[0]?.id ?? null);
  const [deletingRaceId, setDeletingRaceId] = useState<string | null>(null);
  const isDeletingRace = deletingRaceId !== null;
  const [raceDetailReloadKey, setRaceDetailReloadKey] = useState(0);
  // Trigger for AfterRaceContent to refetch data after PostRaceInterview completes
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const triggerRaceDetailReload = useCallback(() => {
    setRaceDetailReloadKey((prev) => prev + 1);
  }, []);
  const [hasManuallySelected, setHasManuallySelected] = useState(false);
  const hasAssignedFallbackRole = useRef(false);
  const initialSelectedRaceParam = useRef<string | null>(
    typeof searchParams?.selected === 'string' ? searchParams.selected : null
  );

  // Live race execution state
  const [gpsPosition, setGpsPosition] = useState<any>(null);
  const [gpsTrail, setGpsTrail] = useState<any[]>([]);
  const [drawerExpanded, setDrawerExpanded] = useState(false);
  const [isGPSTracking, setIsGPSTracking] = useState(false);
  const [gpsTrackSessionId, setGpsTrackSessionId] = useState<string | null>(null);
  // sailorId is now provided by useSailorProfile hook below
  // showCoachSelectionModal, sharingStrategy, sharingRaceEventId are now provided by useStrategySharing hook below
  const [showBoatClassSelector, setShowBoatClassSelector] = useState(false);
  const [addRaceCardDismissed, setAddRaceCardDismissed] = useState(false);
  const [sampleRaceDismissed, setSampleRaceDismissed] = useState(false);
  const updateRacePosition = useRaceConditions(state => state.updatePosition);
  const updateEnvironment = useRaceConditions(state => state.updateEnvironment);
  const updateCourse = useRaceConditions(state => state.updateCourse);
  const setTacticalZones = useRaceConditions(state => state.setTacticalZones);
  const resetRaceConditions = useRaceConditions(state => state.reset);
  const setDraft = useRaceConditions(state => state.setDraft);
  const currentDraft = useRaceConditions(state => state.draft);
  const lastHeadingRef = useRef<number | null>(null);
  const fallbackPositionInitializedRef = useRef(false);
  const previousCourseKeyRef = useRef<string | null>(null);
  const previousEnvironmentKeyRef = useRef<string | null>(null);
  const previousZonesKeyRef = useRef<string | null>(null);

  // Load AddRaceCard dismissal state from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem(ADD_RACE_CARD_DISMISSED_KEY).then((value) => {
      if (value === 'true') {
        setAddRaceCardDismissed(true);
      }
    });
  }, []);

  // Handler to dismiss the AddRaceCard
  const handleDismissAddRaceCard = useCallback(async () => {
    setAddRaceCardDismissed(true);
    await AsyncStorage.setItem(ADD_RACE_CARD_DISMISSED_KEY, 'true');
  }, []);

  // Load Sample Race dismissal state from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem(SAMPLE_RACE_DISMISSED_KEY).then((value) => {
      if (value === 'true') {
        setSampleRaceDismissed(true);
      }
    });
  }, []);

  // Handler to dismiss the Sample Race card
  const handleDismissSampleRace = useCallback(async () => {
    setSampleRaceDismissed(true);
    await AsyncStorage.setItem(SAMPLE_RACE_DISMISSED_KEY, 'true');
  }, []);

  // Tips dismissal state - TODO: implement when TufteTipsCarousel is created
  // const TIPS_DISMISSED_KEY = 'regattaflow_tips_dismissed';
  // const [tipsDismissed, setTipsDismissed] = useState(false);

  // Onboarding Tour - simple AsyncStorage-based state
  const { hasSeenTour, markTourComplete, resetTour } = useOnboardingTour('sailor');

  // Tour visibility state - show tour for first-time users
  const [tourVisible, setTourVisible] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  // Tour target layouts for spotlight effect
  const [headerLayout, setHeaderLayout] = useState<LayoutRectangle | null>(null);
  const [cardGridLayout, setCardGridLayout] = useState<LayoutRectangle | null>(null);
  const [addButtonLayout, setAddButtonLayout] = useState<LayoutRectangle | null>(null);
  const headerRef = useRef<View>(null);
  const cardGridRef = useRef<View>(null);

  // Measure tour target elements using platform-appropriate method
  const measureTourTargets = useCallback(() => {
    // On web, use getBoundingClientRect for accurate measurements
    if (Platform.OS === 'web') {
      const headerNode = headerRef.current as unknown as { getBoundingClientRect?: () => DOMRect };
      const cardGridNode = cardGridRef.current as unknown as { getBoundingClientRect?: () => DOMRect };

      if (headerNode?.getBoundingClientRect) {
        const rect = headerNode.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setHeaderLayout({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
        }
      }
      if (cardGridNode?.getBoundingClientRect) {
        const rect = cardGridNode.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setCardGridLayout({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
        }
      }
    } else {
      // On native, use measureInWindow
      headerRef.current?.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          setHeaderLayout({ x, y, width, height });
        }
      });
      cardGridRef.current?.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          setCardGridLayout({ x, y, width, height });
        }
      });
    }
  }, []);

  // Show tour if user hasn't seen it
  useEffect(() => {
    if (hasSeenTour === false) {
      // Delay to let screen render and elements to be measurable
      const timer = setTimeout(() => {
        measureTourTargets();
        setTourVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTour, measureTourTargets]);

  // Re-measure when tour step changes (for animation)
  useEffect(() => {
    if (tourVisible) {
      measureTourTargets();
    }
  }, [tourStepIndex, tourVisible, measureTourTargets]);

  // Tour step definitions with dynamic layouts - 5 steps total
  const tourSteps: TourStep[] = useMemo(() => [
    {
      id: 'timeline',
      title: 'Your Race Timeline',
      description: 'Swipe through your upcoming races. Each card shows countdown, weather, and prep status.',
      targetLayout: cardGridLayout,
      position: 'top',
      spotlightPadding: 12,
      spotlightBorderRadius: 16,
    },
    {
      id: 'add-race',
      title: 'Add New Races',
      description: 'Tap + to add a race. Upload a Notice of Race and AI extracts all the details for you.',
      targetLayout: addButtonLayout,
      position: 'bottom',
      spotlightPadding: 12,
      spotlightBorderRadius: 24,
    },
    {
      id: 'race-cards',
      title: 'Prepare & Compete',
      description: 'Each race has prep checklists, strategy tools, and post-race analysis. Tap any card to explore.',
      targetLayout: cardGridLayout,
      position: 'bottom',
      spotlightPadding: 16,
      spotlightBorderRadius: 20,
    },
    {
      id: 'explore-tabs',
      title: 'Explore the App',
      description: 'Use the tabs below to discover more: Learn for courses and tutorials, Discuss for venue insights, and Connect to find other sailors.',
      position: 'center',
    },
    {
      id: 'get-started',
      title: 'Ready to Sail!',
      description: "You're all set. Start by adding your first race or exploring a demo race.",
      position: 'center',
    },
  ], [cardGridLayout, addButtonLayout]);

  // Dynamic layout map - layouts resolved at render time by OnboardingTour
  const stepLayouts = useMemo(() => ({
    'timeline': cardGridLayout,
    'add-race': addButtonLayout,
    'race-cards': cardGridLayout,
  }), [cardGridLayout, addButtonLayout]);

  const handleDismissTour = useCallback(() => {
    setTourVisible(false);
    markTourComplete(); // Mark tour as completed in storage
  }, [markTourComplete]);

  const handleTourNext = useCallback(() => {
    const nextIndex = tourStepIndex + 1;

    if (nextIndex >= tourSteps.length) {
      handleDismissTour();
      return;
    }

    setTourStepIndex(nextIndex);
  }, [tourStepIndex, tourSteps, handleDismissTour]);

  // Clear any stuck loading states on mount

  useEffect(() => {
    resetRaceConditions();
    setTacticalZones([]);
  }, [selectedRaceId]);

  // documentTypeResolverRef cleanup is now handled by useRaceDocuments hook

  // Use race preparation hook for persistent storage
  const {
    rigNotes,
    setRigNotes,
    selectedRigPresetId: selectedRigBand,
    setSelectedRigPresetId: setSelectedRigBand,
    acknowledgements: regattaAcknowledgements,
    setAcknowledgements: setRegattaAcknowledgements,
    toggleAcknowledgement,
    updateRaceBrief,
    isLoading: isLoadingPreparation,
    isSaving: isSavingPreparation,
  } = useRacePreparation({
    regattaId: selectedRaceData?.id || null,
    autoSave: true,
    debounceMs: 1000,
  });

  // Real-time race updates - moved early to avoid hoisting issues with callbacks
  // For guests, use the guest races hook (demo races + local guest race)
  const guestRacesResult = useGuestRaces();
  const authenticatedRacesResult = useLiveRaces(user?.id);

  // Select the appropriate races based on auth state
  const {
    liveRaces,
    loading: liveRacesLoading,
    isRefreshing: liveRacesRefreshing,
    refresh: refetchRaces,
  } = isGuest
      ? {
        liveRaces: guestRacesResult.liveRaces,
        loading: guestRacesResult.loading,
        isRefreshing: false as boolean,
        refresh: guestRacesResult.refresh,
      }
      : authenticatedRacesResult;

  // Track if races have been loaded at least once to prevent flash of demo content
  const hasLoadedRacesOnce = useRef(false);
  useEffect(() => {
    if (!liveRacesLoading && liveRaces !== undefined) {
      hasLoadedRacesOnce.current = true;
    }
  }, [liveRacesLoading, liveRaces]);

  const scrollToPosition = useCallback((position: number) => {
    if (!mainScrollViewRef.current) {
      return;
    }

    const target = position > 0 ? Math.max(position - 24, 0) : 0;

    try {
      mainScrollViewRef.current.scrollTo?.({ y: target, animated: true });
    } catch (error) {
      logger.warn('Unable to scroll to position', { position, error });
    }
  }, [logger]);

  const handleShowRegulatoryDigest = useCallback(() => {
    scrollToPosition(regulatorySectionY);
  }, [regulatorySectionY, scrollToPosition]);

  const handleShowRigPlanner = useCallback(() => {
    scrollToPosition(logisticsSectionY);
  }, [logisticsSectionY, scrollToPosition]);

  // handleAddRaceNavigation, handleQuickAddRaceSubmit, handleAddRaceDialogSave
  // are now provided by useAddRace hook

  const handleOpenCalendarImport = useCallback(() => {
    setShowCalendarImport(true);
  }, []);

  const handleManageCrewNavigation = useCallback(
    ({
      raceId,
      classId,
      className,
      raceName,
      raceDate,
    }: {
      raceId: string;
      classId?: string | null;
      className?: string | null;
      raceName?: string | null;
      raceDate?: string | null;
    }) => {
      if (!raceId) {
        logger.warn('handleManageCrewNavigation called without raceId');
        return;
      }

      const params: Record<string, string> = {
        fromRaceId: raceId,
      };

      if (classId) {
        params.classId = String(classId);
      }
      if (className) {
        params.className = String(className);
      }
      if (raceName) {
        params.raceName = String(raceName);
      }
      if (raceDate) {
        params.raceDate = String(raceDate);
      }

      router.push({
        pathname: '/(tabs)/crew',
        params,
      });
    },
    [router]
  );

  // loadUserPostRaceSession, handleOpenPostRaceInterviewManually, and sailorId fetch
  // are now provided by usePostRaceInterview and useSailorProfile hooks

  // Racing area drawing state
  const [drawingRacingArea, setDrawingRacingArea] = useState<Array<{ lat: number, lng: number }>>([]);

  // Combined auth and onboarding check - prevents multiple re-renders
  React.useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      // Wait for auth to be ready
      if (!ready) return;

      // Redirect non-sailor users to their appropriate home page
      // This page is only for sailors
      if (userType === 'club') {
        logger.debug('Club user on races page, redirecting to events');
        router.replace('/(tabs)/events');
        return;
      }
      // Note: Coaches are now sailors with coaching capability, so they can access races
      // No redirect needed for coaches anymore

      if (isDemoSession) {
        logger.debug('Demo session detected, skipping Supabase onboarding checks');
        return;
      }

      // Redirect to login if not authenticated AND not in guest mode
      // BUT: Skip redirect if auth is not ready yet (prevents race condition during sign-out)
      if (!signedIn && !isGuest && ready) {
        logger.debug('User not authenticated, redirecting to login');
        router.replace('/(auth)/login');
        return;
      }

      // If not ready or signed out but not ready, don't redirect yet
      // This prevents redirecting to login during sign-out process
      if (!signedIn && !ready) {
        logger.debug('Auth not ready yet, skipping redirect');
        return;
      }

      // Check onboarding status
      if (!user?.id) return;

      try {
        const { data: userData } = await supabase
          .from('users')
          .select('onboarding_completed, user_type')
          .eq('id', user.id)
          .single();

        logger.debug('User onboarding status:', userData);

        // If no user type selected, redirect to persona selection
        if (!userData?.user_type && !hasAssignedFallbackRole.current) {
          logger.debug('No user type, assigning sailor persona fallback');
          hasAssignedFallbackRole.current = true;
          try {
            await supabase
              .from('users')
              .update({
                user_type: 'sailor',
                onboarding_completed: true,
              })
              .eq('id', user.id);
            await fetchUserProfileRef.current?.(user.id);
          } catch (assignError) {
            logger.error('Unable to assign default persona:', assignError);
          }
        }
      } catch (error) {
        logger.error('Error checking onboarding status:', error);
      }
    };

    checkAuthAndOnboarding();
  }, [ready, signedIn, isGuest, user?.id, router, isDemoSession, userType]);

  // Fetch data from API
  const {
    profile,
    nextRace,
    recentRaces,
    recentTimerSessions,
    performanceHistory,
    boats,
    fleets,
    loading,
    error,
    refreshing,
    onRefresh,
    refetch
  } = useDashboardData();

  // Log dashboard errors only when they change (not on every render)
  useEffect(() => {
    if (error) {
      logger.error('Dashboard error:', error?.message || error, { name: error?.name });
    }
  }, [error]);

  // Refetch races when dashboard comes into focus (after navigation back from race creation)
  // Skip the initial mount to prevent unnecessary refetch
  const isInitialMount = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      logger.debug('Screen focused - refetching races');
      refetch?.();
      refetchRaces?.(); // Also refresh live races list
      if (selectedRaceId) {
        logger.debug('Screen focused - refreshing selected race detail');
        triggerRaceDetailReload();
      }
    }, [refetch, refetchRaces, selectedRaceId, triggerRaceDetailReload])
  );

  // GPS Venue Detection
  const { currentVenue, isDetecting, confidence, error: venueError } = useVenueDetection();

  // Venue AI Insights (extracted to useVenueInsights hook)
  const {
    venueInsights,
    loadingInsights,
    showInsights,
    handleGetVenueInsights,
    handleDismissInsights,
  } = useVenueInsights({
    currentVenue,
    confidence,
  });

  // Offline support
  const { isOnline, cacheNextRace } = useOffline();

  // Enrich races with real weather data
  const { races: enrichedRaces, loading: weatherEnrichmentLoading } = useEnrichedRaces(liveRaces || []);

  // Social timeline: get all timelines (current user + followed users)
  const { allTimelines, isLoading: loadingFollowedTimelines } = useFollowedTimelines(enrichedRaces);
  // allTimelines[0] is always the current user - check if there are OTHER users to browse
  const hasFollowedUsers = allTimelines.length > 1;

  // Timeline switching state - 0 is your timeline, 1+ are followed users
  const [currentTimelineIndex, setCurrentTimelineIndex] = useState(0);
  const currentTimeline = allTimelines[currentTimelineIndex] || allTimelines[0];
  const isViewingOtherTimeline = currentTimelineIndex > 0 && currentTimeline?.user?.isCurrentUser === false;

  // Race list data (extracted to useRaceListData hook)
  const {
    pastRaceIds,
    normalizedLiveRaces,
    safeRecentRaces,
    safeNextRace,
    nextRacePreview,
    hasRealRaces,
    recentRace,
  } = useRaceListData({
    liveRaces,
    enrichedRaces,
    recentRaces,
  });

  // Track if we're showing the demo race (no real races)
  const isShowingDemoRace = safeRecentRaces.length === 0;

  // Auto-create sample data for existing users with no races
  useEffect(() => {
    const autoCreateSampleData = async () => {
      // Only for sailors with no races who haven't tried yet
      if (
        isShowingDemoRace &&
        user?.id &&
        userType === 'sailor' &&
        !creatingSampleData &&
        !hasTriedSampleCreation.current &&
        !liveRacesLoading // Wait for initial load to complete
      ) {
        hasTriedSampleCreation.current = true;
        setCreatingSampleData(true);
        logger.info('Auto-creating sample data for existing user with no races');
        try {
          await createSailorSampleData({
            userId: user.id,
            userName: userProfile?.full_name || 'Sailor',
          });
          // Refresh race list and season to show newly created data
          await Promise.all([
            refetchRaces(),
            refetchCurrentSeason(),
          ]);
          logger.info('Sample data created successfully');
        } catch (err: any) {
          // Silent fail - user can add races manually
          logger.warn('Auto sample data creation failed:', err?.message);
        } finally {
          setCreatingSampleData(false);
        }
      }
    };
    autoCreateSampleData();
  }, [isShowingDemoRace, user?.id, userType, liveRacesLoading, userProfile?.full_name, refetchRaces, refetchCurrentSeason, creatingSampleData]);

  // Fetch user results for past races
  const { results: userRaceResults } = useUserRaceResults(user?.id, pastRaceIds);

  // Fetch practice sessions for timeline
  const { upcomingSessions: practiceSessions } = usePracticeSessions();

  // Real-time weather for next race
  const { weather: raceWeather, loading: weatherLoading, error: weatherError } = useRaceWeather(
    currentVenue,
    nextRace?.date
  );

  // AI Venue Analysis state/handlers now provided by useVenueInsights hook above

  // Total race count (real or demo) for header
  const displayRaceCount = hasRealRaces ? safeRecentRaces.length : MOCK_RACES.length;

  // Count upcoming races (start date in the future)
  const upcomingRacesCount = useMemo(() => {
    const now = new Date();
    return safeRecentRaces.filter((race: any) => {
      const raceDate = new Date(race.start_date || race.date);
      return raceDate > now;
    }).length;
  }, [safeRecentRaces]);

  // Season-filtered race counts for display in header
  // When a season filter is active, show only races in that season
  const seasonFilteredRaces = useMemo(() => {
    if (!activeFilterSeasonId) {
      // "All Races" mode or no season filter - return all races
      return safeRecentRaces;
    }
    // Filter races that belong to the selected filter season
    return safeRecentRaces.filter((race: any) => {
      // Check if race has season_id matching the filter season (race_events)
      if (race.season_id === activeFilterSeasonId ||
          race.metadata?.season_id === activeFilterSeasonId) {
        return true;
      }
      // Check if regatta is linked to the season via season_regattas table
      if (seasonRegattaIds.has(race.id)) {
        return true;
      }
      return false;
    });
  }, [safeRecentRaces, activeFilterSeasonId, seasonRegattaIds]);

  const seasonFilteredRacesCount = seasonFilteredRaces.length;

  const seasonUpcomingRacesCount = useMemo(() => {
    const now = new Date();
    return seasonFilteredRaces.filter((race: any) => {
      const raceDate = new Date(race.start_date || race.date);
      return raceDate > now;
    }).length;
  }, [seasonFilteredRaces]);

  const selectedDemoRace = useMemo(
    () => selectedDemoRaceId ? MOCK_RACES.find(race => race.id === selectedDemoRaceId) ?? null : null,
    [selectedDemoRaceId]
  );

  // ==========================================================================
  // CARD GRID NAVIGATION (Feature Flag)
  // ==========================================================================

  // Calculate card dimensions for CardGrid
  const cardGridDimensions = useMemo(
    () => calculateCardDimensions(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT]
  );

  // Base race data for CardGrid (without detailed enrichment)
  // This is used initially; enrichment happens in cardGridRacesEnriched below
  // When no races exist, show a demo race so users can explore the UI
  // When viewing another user's timeline, use their races instead
  const baseCardGridRaces: CardRaceData[] = useMemo(() => {
    // When viewing another user's timeline, use their races
    const racesToShow = isViewingOtherTimeline && currentTimeline?.races
      ? currentTimeline.races
      : safeRecentRaces;

    // If no races and sample race not dismissed (only for own timeline), show demo race
    if (racesToShow.length === 0 && !sampleRaceDismissed && !isViewingOtherTimeline) {
      return [{
        id: DEMO_RACE.id || 'demo-race',
        name: 'Sample Race',
        venue: DEMO_RACE.venue || 'Your Local Yacht Club',
        date: DEMO_RACE.date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        startTime: DEMO_RACE.startTime || '10:00',
        boatClass: 'Your Boat Class',
        race_type: 'fleet' as const,
        isDemo: true,
        vhf_channel: 'Ch 72',
        // Sample weather data
        boat_id: 'demo-boat-j70', // Explicitly set demo boat ID
        class_id: 'demo-class-j70',
        wind: {
          direction: 'NE',
          speedMin: 12,
          speedMax: 18,
        },
        tide: {
          state: 'flooding' as const,
          height: 1.8,
          direction: 'NW',
        },
        // Sample regulatory documents
        regulatory: {
          documents: [
            { id: 'demo-nor', name: 'Notice of Race', type: 'nor', uploadedAt: new Date().toISOString() },
            { id: 'demo-si', name: 'Sailing Instructions', type: 'si', uploadedAt: new Date().toISOString() },
            { id: 'demo-course', name: 'Course Layout', type: 'course', uploadedAt: new Date().toISOString() },
          ],
          vhfChannel: 'Ch 72',
          protestDeadline: '30 min after finish',
        },
        // Sample fleet info
        fleet: {
          totalCompetitors: 24,
          fleetName: 'Main Fleet',
          isRegistered: false,
        },
        // No created_by so delete/edit menu won't appear
      }];
    }

    return racesToShow.map((race: any) => ({
      id: race.id,
      name: race.name || race.race_name || 'Unnamed Race',
      venue: race.venue || race.venue_name,
      date: race.start_date || race.date || new Date().toISOString(),
      startTime: race.start_time || race.startTime,
      boatClass: race.boat_class || race.boatClass,
      vhf_channel: race.vhf_channel || race.critical_details?.vhf_channel,
      race_type: race.race_type, // Preserve race type (fleet, distance, match, team)
      time_limit_hours: race.time_limit_hours, // Distance race duration
      wind: race.wind,
      tide: race.tide,
      waves: race.waves,
      temperature: race.temperature || race.waterTemperature,
      critical_details: race.critical_details,
      venueCoordinates: race.venueCoordinates,
      created_by: race.created_by,
      metadata: race.metadata, // Preserve metadata for sample detection
      boat_id: race.boat_id || (race as any).boatId,
      class_id: race.class_id || (race as any).classId,
      // Basic defaults for new cards (will be enriched for selected race later)
      rigSettings: race.rigSettings || race.tuningRecommendation,
      fleet: race.fleet || {
        totalCompetitors: race.competitor_count || race.entry_count || 0,
        fleetName: race.fleet_name,
        isRegistered: race.is_registered,
      },
      regulatory: race.regulatory || {
        documents: race.documents || [],
        vhfChannel: race.vhf_channel || race.critical_details?.vhf_channel,
        protestDeadline: race.protest_deadline || race.critical_details?.protest_deadline,
      },
    }));
  }, [safeRecentRaces, sampleRaceDismissed, isViewingOtherTimeline, currentTimeline]);

  // Calculate current season week (ISO week number with 'W' prefix)
  const currentSeasonWeek = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `W${weekNumber}`;
  }, []);

  // Render card content for CardGrid
  const renderCardGridContent = useCallback(
    (
      race: CardRaceData,
      cardType: CardType,
      isActive: boolean,
      isExpanded: boolean,
      onToggleExpand: () => void,
      canManage: boolean,
      onEdit?: () => void,
      onDelete?: () => void,
      onUploadDocument?: () => void,
      onRaceComplete?: (sessionId: string, raceName: string, raceId: string) => void,
      onOpenPostRaceInterview?: () => void,
      userId?: string,
      onDismiss?: () => void,
      raceIndex?: number,
      totalRaces?: number,
      // Timeline navigation props
      _timelineRaces?: any[],
      _currentRaceIndex?: number,
      _onSelectRace?: (index: number) => void,
      _nextRaceIndex?: number,
      // Handler for card press (navigation to this card when clicking partially visible cards)
      onCardPress?: () => void,
      // Refetch trigger for AfterRaceContent
      refetchTrigger?: number
    ) => {
      const ContentComponent = getCardContentComponent(cardType);
      return (
        <ContentComponent
          race={race}
          cardType={cardType}
          isActive={isActive}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          dimensions={cardGridDimensions}
          canManage={canManage}
          onEdit={onEdit}
          onDelete={onDelete}
          onUploadDocument={onUploadDocument}
          onRaceComplete={onRaceComplete}
          onOpenPostRaceInterview={onOpenPostRaceInterview}
          userId={userId}
          onDismiss={onDismiss}
          seasonWeek={currentSeasonWeek}
          raceNumber={raceIndex !== undefined ? raceIndex + 1 : undefined}
          totalRaces={totalRaces}
          onCardPress={onCardPress}
          refetchTrigger={refetchTrigger}
        />
      );
    },
    [cardGridDimensions, currentSeasonWeek]
  );

  // Handle race change from CardGrid
  const handleCardGridRaceChange = useCallback(
    (index: number, race: CardRaceData) => {
      setHasManuallySelected(true);
      setSelectedRaceId(race.id);
    },
    []
  );

  // Handle card (vertical) change from CardGrid
  const handleCardGridCardChange = useCallback(
    (cardType: CardType, cardIndex: number) => {
      logger.debug('Card changed:', { cardType, cardIndex });
    },
    []
  );

  // Active race summary (extracted to useActiveRaceSummary hook)
  const { activeRace } = useActiveRaceSummary({
    selectedRaceData,
    nextRace,
    selectedDemoRace,
    currentVenue,
  });

  // Race brief data (extracted to useRaceBriefData hook)
  const { raceBrief } = useRaceBriefData({
    activeRace,
    raceWeather,
    selectedRaceData,
    nextRace,
    selectedDemoRace,
  });

  // Sync race brief data to preparation service for AI context
  useEffect(() => {
    if (raceBrief && selectedRaceData?.id) {
      updateRaceBrief(raceBrief);
    }
  }, [raceBrief, selectedRaceData?.id]);

  // Use race brief sync for AI chat integration
  const { getAIContext, isStale: isRaceBriefStale, refreshContext } = useRaceBriefSync({
    regattaId: selectedRaceData?.id || null,
    raceBrief,
    enabled: true,
  });

  // Compute derived race preparation data
  const {
    rigPresets,
    isGenericDefaults: isGenericDefaultsFromMetadata,
    regulatoryDigest,
    courseOutlineGroups,
    hasStrategyGenerated,
    hasPostAnalysis,
    hasCrewReady,
    hasRegulatoryAcknowledged,
  } = useRacePreparationData({
    selectedRaceData,
    selectedRaceMarks,
    regattaAcknowledgements,
    activeRace,
  });

  // Sync state from race metadata
  useEffect(() => {
    if (!selectedRaceData) {
      setSelectedRigBand(null);
      setRigNotes('');
      setRegattaAcknowledgements({
        cleanRegatta: false,
        signOn: false,
        safetyBriefing: false,
      });
      return;
    }

    const metadata = (selectedRaceData.metadata || {}) as Record<string, any>;
    if (metadata.selected_rig_band) {
      setSelectedRigBand(metadata.selected_rig_band);
    } else {
      setSelectedRigBand(null);
    }
    if (typeof metadata.rig_notes === 'string') {
      setRigNotes(metadata.rig_notes);
    } else {
      setRigNotes('');
    }

    setRegattaAcknowledgements({
      cleanRegatta: metadata.clean_regatta_ack === true,
      signOn: metadata.sign_on_ack === true,
      safetyBriefing: metadata.safety_briefing_ack === true,
    });
  }, [selectedRaceData]);

  useEffect(() => {
    if (!rigPresets.length) {
      return;
    }

    if (selectedRigBand && rigPresets.some((preset) => preset.id === selectedRigBand)) {
      return;
    }

    const fallback = rigPresets.find((preset) => preset.id === 'medium') || rigPresets[0];
    setSelectedRigBand(fallback.id);
  }, [rigPresets, selectedRigBand]);

  // Status flags (hasStrategyGenerated, hasPostAnalysis, hasCrewReady, hasRegulatoryAcknowledged)
  // are now provided by useRacePreparationData hook above

  // Determine race status (past, next, future)
  const getRaceStatus = (raceDate: string, isNextRace: boolean, raceStartTime?: string): 'past' | 'next' | 'future' => {
    if (isNextRace) return 'next';

    // Compare full datetime including time to correctly identify past races
    const now = new Date();
    const raceDateTime = new Date(raceDate);

    // If we have a start time, use it for more accurate comparison
    if (raceStartTime && typeof raceStartTime === 'string') {
      const timeParts = raceStartTime.split(':');
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        if (!isNaN(hours) && !isNaN(minutes)) {
          raceDateTime.setHours(hours, minutes, 0, 0);
        }
      }
    }

    // Race is "past" if estimated end time (start + 3 hours) has passed
    const raceEndEstimate = new Date(raceDateTime.getTime() + 3 * 60 * 60 * 1000);
    if (raceEndEstimate < now) return 'past';

    return 'future';
  };

  // handleRaceComplete and handlePostRaceInterviewComplete are now provided by usePostRaceInterview hook

  const handleOpenChatFromRigPlanner = useCallback(async () => {
    try {
      // Get AI context with race preparation data before opening chat
      const context = await getAIContext('rig_planning');

      // TODO: Pass context to chat/messages screen via route params or global state
      // For now, just navigate to messages - the chat will use useRaceBriefSync to get context
      router.push('/messages' as any);

      logger.info('Opened chat with race context', {
        hasContext: !!context,
        isStale: isRaceBriefStale,
      });
    } catch (error) {
      logger.warn('Unable to navigate to chat from rig planner', error);
    }
  }, [router, getAIContext, isRaceBriefStale]);

  const handleToggleAcknowledgement = useCallback((key: keyof RegulatoryAcknowledgements) => {
    toggleAcknowledgement(key);
  }, [toggleAcknowledgement]);

  const handleEditRace = useCallback((raceId: string) => {
    if (!raceId) return;

    try {
      router.push(`/race/edit/${raceId}`);
    } catch (error) {
      logger.error('Error navigating to edit race:', error);
    }
  }, [logger, router]);

  // Navigate to the comprehensive edit flow for the selected race
  const handleEditSelectedRace = useCallback(() => {
    if (!selectedRaceId) return;
    handleEditRace(selectedRaceId);
  }, [handleEditRace, selectedRaceId]);

  // Practice session handlers
  const handleSelectPractice = useCallback((sessionId: string) => {
    router.push({
      pathname: '/practice/[id]',
      params: { id: sessionId },
    });
  }, [router]);

  const handleAddPractice = useCallback(() => {
    router.push('/practice/create');
  }, [router]);

  // Navigate to the next upcoming race when "X upcoming" is tapped
  const handleUpcomingPress = useCallback(() => {
    if (safeNextRace?.id) {
      setSelectedRaceId(safeNextRace.id);
    }
  }, [safeNextRace?.id]);

  // Open boat class selector modal
  const handleSetBoatClass = useCallback(() => {
    if (!selectedRaceId) return;
    setShowBoatClassSelector(true);
  }, [selectedRaceId]);

  // Handle boat class selection
  const handleBoatClassSelected = useCallback(async (classId: string, className: string) => {
    logger.info('Boat class selected:', { classId, className, raceId: selectedRaceId });

    // Refresh race data to show updated class
    if (selectedRaceId) {
      triggerRaceDetailReload();

      // Also update local state immediately for better UX
      setSelectedRaceData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          class_id: classId,
          metadata: {
            ...prev.metadata,
            class_id: classId,
            class_name: className,
          },
        };
      });
    }
  }, [selectedRaceId, triggerRaceDetailReload, logger]);

  const handleHideRace = useCallback(async (raceId: string, raceName?: string) => {
    if (!raceId || !user?.id) {
      return;
    }

    const friendlyName = raceName || 'this race';
    const confirmationMessage = `Hide "${friendlyName}" from your timeline? You can rejoin later from the race discovery page.`;

    Alert.alert(
      'Hide from Timeline',
      confirmationMessage,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Hide',
          onPress: async () => {
            const result = await withdrawFromRace(user.id, raceId);
            if (result.success) {
              // Clear selection if the hidden race was selected
              if (selectedRaceId === raceId) {
                setSelectedRaceId(null);
              }
              // Refresh the race list
              refetchRaces?.();
              Alert.alert('Hidden', `"${friendlyName}" has been removed from your timeline.`);
            } else {
              Alert.alert('Error', result.error || 'Failed to hide race');
            }
          },
        },
      ],
    );
  }, [refetchRaces, selectedRaceId, user?.id]);

  const handleDeleteRace = useCallback((raceId: string, raceName?: string) => {
    if (!raceId || isDeletingRace) {
      return;
    }

    const friendlyName = raceName || 'this race';
    const confirmationMessage = `Are you sure you want to delete "${friendlyName}"? This action cannot be undone.`;

    const performDelete = async () => {
      setDeletingRaceId(raceId);
      try {
        // First, try to delete race_events linked to this regatta (if it's a regatta)
        const { data: linkedRaceEvents, error: linkedEventsError } = await supabase
          .from('race_events')
          .select('id')
          .eq('regatta_id', raceId);

        if (linkedEventsError) {
          logger.warn('Error fetching linked race_events:', linkedEventsError);
        }

        const linkedEventIds = (linkedRaceEvents || []).map((event: { id: string }) => event.id);

        if (linkedEventIds.length > 0) {
          const { error: deleteLinkedError } = await supabase
            .from('race_events')
            .delete()
            .in('id', linkedEventIds);

          if (deleteLinkedError) {
            logger.warn('Error deleting linked race_events:', deleteLinkedError);
          }
        }

        // Also try to delete the race_event directly by ID (for races created via Add Race flow)
        // This handles the case where the raceId IS a race_event ID, not a regatta ID
        const { error: deleteDirectEventError } = await supabase
          .from('race_events')
          .delete()
          .eq('id', raceId);

        // Log but don't throw - the race might be in regattas table instead
        if (deleteDirectEventError) {
          logger.debug('Direct race_event delete result:', deleteDirectEventError.message);
        }

        // Try to delete from regattas table
        const { error: deleteRegattaError } = await supabase
          .from('regattas')
          .delete()
          .eq('id', raceId);

        // Log but don't throw - the race might be in race_events table instead
        if (deleteRegattaError) {
          logger.debug('Regatta delete result:', deleteRegattaError.message);
        }

        if (selectedRaceId === raceId) {
          setSelectedRaceId(null);
          setSelectedRaceData(null);
          setSelectedRaceMarks([]);
          setHasManuallySelected(false);
        }

        await refetchRaces();

        Alert.alert('Race deleted', `"${friendlyName}" has been removed.`);
      } catch (error: any) {
        logger.error('Error deleting race:', error);
        const message = error?.message || 'Unable to delete race. Please try again.';
        Alert.alert('Error', message);
      } finally {
        setDeletingRaceId(prev => (prev === raceId ? null : prev));
      }
    };

    if (Platform.OS === 'web') {
      const confirmed =
        typeof globalThis !== 'undefined' &&
          typeof (globalThis as any).confirm === 'function'
          ? (globalThis as any).confirm(confirmationMessage)
          : false;
      if (confirmed) {
        void performDelete();
      }
      return;
    }

    Alert.alert(
      'Delete race?',
      confirmationMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void performDelete();
          },
        },
      ],
    );
  }, [isDeletingRace, logger, refetchRaces, selectedRaceId]);

  // Delete the currently selected race with confirmation
  const handleDeleteSelectedRace = useCallback(() => {
    if (!selectedRaceId) {
      return;
    }

    handleDeleteRace(selectedRaceId, selectedRaceData?.name);
  }, [handleDeleteRace, selectedRaceData?.name, selectedRaceId]);

  // Handle racing area drawing
  const handleRacingAreaChange = useCallback((polygon: Array<{ lat: number, lng: number }>) => {
    setDrawingRacingArea(polygon);
  }, []);

  // Handle saving racing area to database
  const handleSaveRacingArea = useCallback(async (polygonPoints?: Array<{ lat: number, lng: number }>) => {
    // Use passed points or fall back to state
    const pointsToSave = polygonPoints || drawingRacingArea;

    logger.debug('[handleSaveRacingArea] Called with:', {
      selectedRaceId,
      passedPointsLength: polygonPoints?.length,
      statePointsLength: drawingRacingArea.length,
      usingPoints: pointsToSave.length
    });

    if (!selectedRaceId) {
      logger.warn('[handleSaveRacingArea] No selectedRaceId, aborting');
      Alert.alert('Error', 'No race selected');
      return;
    }

    if (pointsToSave.length < 3) {
      logger.warn('[handleSaveRacingArea] Not enough points:', pointsToSave.length);
      Alert.alert('Error', `Need at least 3 points to save racing area. Currently have ${pointsToSave.length} points.`);
      return;
    }

    try {
      logger.debug('Saving racing area:', pointsToSave);

      // Convert to GeoJSON format
      const coordinates = pointsToSave.map(point => [point.lng, point.lat]);
      const polygonGeoJSON = {
        type: 'Polygon',
        coordinates: [[...coordinates, coordinates[0]]] // Close the polygon
      };

      // Calculate centroid from the polygon for venue coordinates
      // This enables tide/weather APIs to fetch data for this location
      const centroidLat = pointsToSave.reduce((sum, p) => sum + p.lat, 0) / pointsToSave.length;
      const centroidLng = pointsToSave.reduce((sum, p) => sum + p.lng, 0) / pointsToSave.length;

      logger.debug('[handleSaveRacingArea] Extracted centroid:', { centroidLat, centroidLng });

      // Get current metadata to preserve existing fields
      const currentMetadata = selectedRaceData?.metadata || {};

      // Only update venue coordinates if not already set (don't override user-specified venue)
      const shouldUpdateVenueCoords = !currentMetadata.venue_lat || !currentMetadata.venue_lng;

      const updatedMetadata = shouldUpdateVenueCoords ? {
        ...currentMetadata,
        venue_lat: centroidLat,
        venue_lng: centroidLng,
        venue_coords_source: 'racing_area_centroid', // Track where coords came from
      } : currentMetadata;

      // Save racing area polygon AND update metadata with venue coordinates
      const { error } = await supabase
        .from('regattas')
        .update({
          racing_area_polygon: polygonGeoJSON,
          metadata: updatedMetadata
        })
        .eq('id', selectedRaceId);

      if (error) {
        logger.error('[handleSaveRacingArea] Supabase error:', error);
        Alert.alert('Error Saving', `Failed to save racing area: ${error.message}`);
        throw error;
      }

      logger.debug('Racing area saved successfully', {
        updatedVenueCoords: shouldUpdateVenueCoords,
        centroid: { lat: centroidLat, lng: centroidLng }
      });

      // Update local state immediately to prevent racing area from disappearing
      setSelectedRaceData((prev: any) => ({
        ...prev,
        racing_area_polygon: polygonGeoJSON,
        metadata: updatedMetadata
      }));

      // Clear drawing state
      setDrawingRacingArea([]);

      // Refresh race data in background
      refetch?.();

      const coordsMessage = shouldUpdateVenueCoords
        ? `\n\nVenue coordinates auto-detected from racing area center for tide/weather data.`
        : '';
      Alert.alert('Success', `Racing area saved!${coordsMessage}`);
    } catch (error) {
      logger.error('Error saving racing area:', error);
    }
  }, [selectedRaceId, drawingRacingArea, refetch]);

  const ensureRaceEventId = useCallback(async (): Promise<string | null> => {
    logger.debug('[ensureRaceEventId] START', { selectedRaceId });

    if (!selectedRaceId) {
      logger.warn('[ensureRaceEventId] Attempted to ensure race event without selected race');
      return null;
    }

    logger.debug('[ensureRaceEventId] Querying for existing race_event...');
    // Use .limit(1) to handle potential duplicates gracefully
    const { data: existingRaceEvents, error: existingRaceEventError } = await supabase
      .from('race_events')
      .select('id')
      .eq('regatta_id', selectedRaceId)
      .order('created_at', { ascending: false })
      .limit(1);

    logger.debug('[ensureRaceEventId] Query result', { existingRaceEvents, existingRaceEventError });

    if (existingRaceEventError) {
      logger.error('[ensureRaceEventId] Error querying existing race_event:', existingRaceEventError);
      throw existingRaceEventError;
    }

    if (existingRaceEvents && existingRaceEvents.length > 0) {
      const existingRaceEvent = existingRaceEvents[0];
      logger.debug('[ensureRaceEventId] Found existing race_event', { raceEventId: existingRaceEvent.id });
      return existingRaceEvent.id;
    }

    logger.debug('[ensureRaceEventId] No existing race_event found, creating new one', {
      selectedRaceId,
      raceName: selectedRaceData?.name,
    });

    const startDateObj = selectedRaceData?.start_date
      ? new Date(selectedRaceData.start_date)
      : null;

    const startTime = startDateObj && !Number.isNaN(startDateObj.getTime())
      ? startDateObj.toISOString().split('T')[1]?.split('Z')[0]?.split('.')[0] || '00:00:00'
      : '00:00:00';

    const eventDate = startDateObj && !Number.isNaN(startDateObj.getTime())
      ? startDateObj.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const insertPayload = {
      regatta_id: selectedRaceId,
      name: `${selectedRaceData?.name || 'Race'} - Event 1`,
      start_time: startTime,
      event_date: eventDate,
    };
    logger.debug('[ensureRaceEventId] Insert payload prepared', insertPayload);

    logger.debug('[ensureRaceEventId] Executing insert');
    const { data: newRaceEvent, error: createError } = await supabase
      .from('race_events')
      .insert(insertPayload)
      .select()
      .single();

    logger.debug('[ensureRaceEventId] Insert result', { newRaceEvent, createError });

    if (createError) {
      logger.error('[ensureRaceEventId] Error creating race_event:', createError);
      throw createError;
    }

    logger.debug('[ensureRaceEventId] Created new race_event', { raceEventId: newRaceEvent.id });
    return newRaceEvent.id;
  }, [selectedRaceData?.name, selectedRaceData?.start_date, selectedRaceId]);

  // Race marks handlers (extracted to useRaceMarks hook)
  const {
    handleMarkAdded,
    handleMarkUpdated,
    handleMarkDeleted,
    handleBulkMarksUpdate,
  } = useRaceMarks({
    selectedRaceId,
    ensureRaceEventId,
    setMarks: setSelectedRaceMarks,
  });

  // Venue coordinates (extracted to useVenueCoordinates hook)
  const { venueCoordinates: selectedRaceVenueCoordinates } = useVenueCoordinates({
    selectedRaceData,
    drawingRacingArea,
  });

  // handleOpenStrategySharing is now provided by useStrategySharing hook

  // Utility functions (normalizeCourseMarkType) imported from @/lib/races
  // Mark handlers and venue coordinates are now provided by extracted hooks above
  // - useRaceMarks: handleMarkAdded, handleMarkUpdated, handleMarkDeleted, handleBulkMarksUpdate
  // - useVenueCoordinates: selectedRaceVenueCoordinates

  // Get enriched weather data for the selected race from safeRecentRaces
  // This ensures RaceConditionsCard uses the same fresh weather data as RaceCard
  const selectedRaceEnrichedWeather = useMemo(() => {
    if (!selectedRaceId) return null;
    const enrichedRace = safeRecentRaces.find((r: any) => r.id === selectedRaceId);
    if (enrichedRace) {
      return {
        wind: enrichedRace.wind || null,
        tide: enrichedRace.tide || null,
        weatherFetchedAt: enrichedRace.weatherFetchedAt || null,
      };
    }
    return null;
  }, [selectedRaceId, safeRecentRaces]);

  // Memoized navigation handlers
  const handleVenuePress = useCallback(() => {
    router.push('/venue');
  }, [router]);

  // Venue insights handlers (loadCachedInsights, handleGetVenueInsights) and
  // related effects are now managed by useVenueInsights hook above

  // Cache next race for offline use when it loads
  React.useEffect(() => {
    if (nextRace && user) {
      cacheNextRace(nextRace.id, user.id).catch(err =>
        logger.error('Failed to cache race:', err)
      );
    }
  }, [nextRace, user]);

  // Auto-select first race when races load (only runs once when loading completes)
  // Using useRef to track if auto-selection has happened to prevent re-running
  const autoSelectDatasetKeyRef = useRef<string | null>(null);
  const autoSelectLastAppliedIdRef = useRef<string | null>(null);
  // Auto-select when data changes; omit selectedRaceId dependency to avoid loops when we set it here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (loading || safeRecentRaces.length === 0) {
      return;
    }

    const datasetKey = safeRecentRaces.map((race: any) => race?.id ?? 'unknown').join('|');
    const datasetChanged = autoSelectDatasetKeyRef.current !== datasetKey;
    if (datasetChanged) {
      autoSelectDatasetKeyRef.current = datasetKey;
    }

    // Keep current selection if it is still present in the latest dataset
    const selectionStillValid = selectedRaceId
      ? safeRecentRaces.some((race: any) => race?.id === selectedRaceId)
      : false;

    // If the user already has a valid selection, preserve it - don't override with auto-select
    if (selectionStillValid) {
      return;
    }

    // If dataset is unchanged and we're already on the desired target, no work needed.
    const routeTargetId = initialSelectedRaceParam.current;
    const raceToSelect =
      (routeTargetId && safeRecentRaces.find((race: any) => race?.id === routeTargetId)) ||
      (safeNextRace?.id && safeRecentRaces.find((race: any) => race?.id === safeNextRace.id)) ||
      safeRecentRaces[0];

    const targetId = raceToSelect?.id ?? null;

    if (!targetId) {
      return;
    }

    if (!datasetChanged && autoSelectLastAppliedIdRef.current === targetId) {
      return;
    }

    if (targetId === selectedRaceId) {
      autoSelectLastAppliedIdRef.current = targetId;
      return;
    }

    logger.debug('[races.tsx] Auto-selecting race:', raceToSelect?.name, targetId, {
      datasetChanged,
      selectionStillValid,
      previousKey: autoSelectDatasetKeyRef.current,
    });
    autoSelectLastAppliedIdRef.current = targetId;
    // Only mark as auto if we truly changed the selection here
    setHasManuallySelected(false);
    setSelectedRaceId(targetId);
  }, [loading, safeRecentRaces, nextRace]);

  useEffect(() => {
    if (selectedRaceId) {
      autoSelectLastAppliedIdRef.current = selectedRaceId;
    }
  }, [selectedRaceId]);

  // Handle deep links that request a specific race selection (e.g., after creation)
  useEffect(() => {
    const targetId = initialSelectedRaceParam.current;
    if (!targetId || loading) {
      return;
    }

    const matchingRace = safeRecentRaces.find((race: any) => race.id === targetId);
    if (!matchingRace) {
      return;
    }

    logger.debug('[races.tsx] Selecting race from route params:', targetId);
    setSelectedRaceId(targetId);
    setHasManuallySelected(true);
    initialSelectedRaceParam.current = null;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('selected');
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, [loading, safeRecentRaces]);

  useEffect(() => {
    if (hasRealRaces) {
      if (selectedDemoRaceId) {
        setSelectedDemoRaceId(null);
      }
      return;
    }

    if (!loading && !selectedDemoRaceId && MOCK_RACES.length > 0) {
      setSelectedDemoRaceId(MOCK_RACES[0].id);
    }
  }, [hasRealRaces, loading, selectedDemoRaceId]);

  // Scroll to race detail when a race is selected (but not on initial auto-select)
  React.useEffect(() => {
    if (hasManuallySelected && selectedRaceId && mainScrollViewRef.current) {
      // Simple scroll - just scroll down a fixed amount to show the detail section
      // This works reliably on both native and web
      setTimeout(() => {
        mainScrollViewRef.current?.scrollTo({
          y: 500, // Approximate position of race detail section
          animated: true,
        });
      }, 100);
    }
  }, [selectedRaceId, hasManuallySelected]);

  // Fetch race detail when selected race changes
  React.useEffect(() => {
    const fetchRaceDetail = async () => {
      // Track the selection value at the beginning of this fetch to prevent stale updates
      const selectionAtStart = selectedRaceId;
      logger.debug('=====================================');
      logger.debug('[races.tsx] 📥 FETCHING RACE DETAILS');
      logger.debug('[races.tsx] selectedRaceId:', selectedRaceId);

      if (!selectedRaceId) {
        logger.debug('[races.tsx] No selectedRaceId, clearing data');
        setSelectedRaceData(null);
        setSelectedRaceMarks([]);
        return;
      }

      // First check if this race is in our local safeRecentRaces (might be fallback data or race_event)
      const localRace = safeRecentRaces.find((r: any) => r.id === selectedRaceId);

      // If it's a race_event (user-created race), use local data directly
      if (localRace && localRace._source === 'race_events') {
        logger.debug('[races.tsx] 📦 Using race_event local data:', localRace.name);
        setLoadingRaceDetail(false);
        setSelectedRaceData(localRace);
        setSelectedRaceMarks([]);
        return;
      }

      if (localRace && isDemoRaceId(selectedRaceId)) {
        // If we have local race data and it's a demo race (not a real UUID)
        logger.debug('[races.tsx] 📦 Using local race data (demo race):', localRace.name);
        setLoadingRaceDetail(false);
        setSelectedRaceData(localRace);
        setSelectedRaceMarks([]);
        return;
      }

      setLoadingRaceDetail(true);
      try {
        logger.debug('[races.tsx] Querying database for race ID:', selectedRaceId);
        const { data, error } = await supabase
          .from('regattas')
          .select('*')
          .eq('id', selectedRaceId)
          .single();

        if (error) {
          logger.warn('[races.tsx] ⚠️ Regatta fetch failed, trying race_events');
          // If regatta query fails, try race_events table
          const { data: raceEventData, error: raceEventError } = await supabase
            .from('race_events')
            .select('*')
            .eq('id', selectedRaceId)
            .single();

          if (!raceEventError && raceEventData) {
            logger.debug('[races.tsx] 📦 Found in race_events:', raceEventData.name);
            // Normalize race_event data
            const normalizedData = {
              ...raceEventData,
              start_date: raceEventData.start_time || raceEventData.event_date,
              race_name: raceEventData.name,
              created_by: raceEventData.user_id,
              _source: 'race_events',
            };
            setSelectedRaceData(normalizedData);
            setSelectedRaceMarks([]);
            setLoadingRaceDetail(false);
            return;
          }

          // If both fail, try local data as last fallback
          if (localRace) {
            logger.debug('[races.tsx] 📦 Using local race data as fallback:', localRace.name);
            setLoadingRaceDetail(false);
            setSelectedRaceData(localRace);
            setSelectedRaceMarks([]);
            return;
          }
          throw error;
        }
        // If the selection changed during the fetch, ignore this result
        if (selectionAtStart !== selectedRaceId) {
          logger.debug(
            '[races.tsx] ⏭️ Ignoring stale fetch result for',
            data?.name,
            'selection changed to',
            selectedRaceId
          );
          return;
        }
        setSelectedRaceData(data);

        // Try to find associated race_event for marks
        const { data: raceEvent } = await supabase
          .from('race_events')
          .select('id')
          .eq('regatta_id', selectedRaceId)
          .maybeSingle();

        if (raceEvent) {
          // Load race marks
          const { data: marksData, error: marksError } = await supabase
            .from('race_marks')
            .select('*')
            .eq('race_id', raceEvent.id)
            .order('name', { ascending: true });

          if (!marksError && marksData) {
            // Convert race_marks format to component format
            const convertedMarks = marksData.map((mark: any) => ({
              id: mark.id,
              mark_name: mark.name,
              mark_type: mark.mark_type,
              latitude: mark.latitude,
              longitude: mark.longitude,
              sequence_order: 0,
            }));

            // Deduplicate marks: Keep only unique combinations of name + mark_type
            // This prevents rendering duplicate courses if the database has duplicates
            const uniqueMarks = convertedMarks.filter((mark, index, self) => {
              const markKey = `${mark.mark_name}:${mark.mark_type}`;
              return index === self.findIndex(m =>
                `${m.mark_name}:${m.mark_type}` === markKey
              );
            });

            if (uniqueMarks.length < convertedMarks.length) {
              logger.warn(
                `[races.tsx] ⚠️ Deduplicated marks: ${convertedMarks.length} -> ${uniqueMarks.length}`
              );
            }

            setSelectedRaceMarks(uniqueMarks);
            logger.debug('[races.tsx] Marks loaded:', uniqueMarks.length);
          }
        }
      } catch (error) {
        logger.error('[races.tsx] ❌ Error fetching race detail:', error);
        setSelectedRaceData(null);
        setSelectedRaceMarks([]);
      } finally {
        setLoadingRaceDetail(false);
        logger.debug('[races.tsx] 🏁 Fetch complete');
        logger.debug('=====================================');
      }
    };

    fetchRaceDetail();
  }, [selectedRaceId, raceDetailReloadKey]);

  // Race documents loading and upload are now handled by useRaceDocuments hook

  // Race class selection (extracted to useRaceClassSelection hook)
  const {
    selectedRaceClassId,
    selectedRaceClassName,
  } = useRaceClassSelection({
    selectedRaceData,
  });

  const matchedEnrichedRace = useMemo(() => {
    if (!selectedRaceId || !Array.isArray(enrichedRaces)) {
      return null;
    }
    return enrichedRaces.find((race: any) => race.id === selectedRaceId) ?? null;
  }, [selectedRaceId, enrichedRaces]);

  // Tactical snapshots (extracted to useTacticalSnapshots hook)
  const {
    selectedRaceWeather,
    windSnapshot,
    currentSnapshot,
    boatDraftValue,
    boatLengthValue,
    timeToStartMinutes,
    boatSpeedKnots,
  } = useTacticalSnapshots({
    selectedRaceData,
    matchedEnrichedRace,
    raceWeather,
    selectedDemoRace,
    gpsPosition,
  });

  // Post-race interview (extracted to usePostRaceInterview hook)
  const {
    showPostRaceInterview,
    completedSessionId,
    completedRaceName,
    completedRaceId,
    completedSessionGpsPoints,
    userPostRaceSession,
    loadingUserPostRaceSession,
    handleOpenPostRaceInterviewManually,
    handleRaceComplete,
    handlePostRaceInterviewComplete,
    handleClosePostRaceInterview,
    setShowPostRaceInterview,
    setCompletedRaceName,
  } = usePostRaceInterview({
    selectedRaceId,
    selectedRaceData,
    user,
    refetch,
  });

  // Wrapper to trigger AfterRaceContent refetch when PostRaceInterview completes
  const handlePostRaceInterviewCompleteWithRefetch = useCallback(() => {
    handlePostRaceInterviewComplete();
    // Increment trigger to cause AfterRaceContent to refetch its data
    setRefetchTrigger(prev => prev + 1);
  }, [handlePostRaceInterviewComplete]);

  // Sailor profile (extracted to useSailorProfile hook)
  const { sailorId } = useSailorProfile({ user });

  // Strategy sharing (extracted to useStrategySharing hook)
  const {
    showCoachSelectionModal,
    sharingStrategy,
    sharingRaceEventId,
    handleOpenStrategySharing,
    handleCloseStrategySharing,
  } = useStrategySharing({
    selectedRaceId,
    sailorId,
    selectedRaceData,
    ensureRaceEventId,
  });

  // Add race (extracted to useAddRace hook)
  const {
    showAddRaceSheet,
    isAddingRace,
    familyButtonExpanded,
    showSignupPrompt,
    handleShowAddRaceSheet,
    handleCloseAddRaceSheet,
    handleAddRaceNavigation,
    handleQuickAddRaceSubmit,
    handleAddRaceDialogSave,
    setFamilyButtonExpanded,
    setShowSignupPrompt,
  } = useAddRace({
    refetchRaces,
    onRaceCreated: (raceId) => {
      // Auto-select the newly created race to center on it
      setSelectedRaceId(raceId);
      setHasManuallySelected(true);
    },
  });

  // Race documents hook (handles fetching, uploading, and deleting)
  const {
    documents: raceDocuments,
    loading: loadingRaceDocuments,
    error: raceDocumentsError,
    isUploading: isUploadingRaceDocument,
    typePickerVisible: documentTypePickerVisible,
    refresh: handleRefreshRaceDocuments,
    upload: handleUploadRaceDocument,
    selectType: handleDocumentTypeOptionSelect,
    dismissTypePicker: handleDismissDocumentTypePicker,
  } = useRaceDocuments({
    raceId: selectedRaceId,
    userId: user?.id,
    isDemoSession,
  });

  // Track pending document upload (for race switching)
  const pendingDocumentUploadRef = useRef<boolean>(false);

  // Handle document upload from CardGrid
  // If uploading for a different race, select that race first
  const handleCardGridUploadDocument = useCallback(
    (raceId: string) => {
      // If this is a different race, select it first and mark upload pending
      if (raceId !== selectedRaceId) {
        setSelectedRaceId(raceId);
        setHasManuallySelected(true);
        pendingDocumentUploadRef.current = true;
      } else {
        handleUploadRaceDocument();
      }
    },
    [selectedRaceId, handleUploadRaceDocument]
  );

  // Trigger pending document upload after race selection changes
  useEffect(() => {
    if (pendingDocumentUploadRef.current && selectedRaceId) {
      pendingDocumentUploadRef.current = false;
      // Small delay to ensure hook has updated
      setTimeout(() => {
        handleUploadRaceDocument();
      }, 50);
    }
  }, [selectedRaceId, handleUploadRaceDocument]);

  // Transform raw documents into display format
  const raceDocumentsForDisplay = useMemo<RaceDocumentsCardDocument[]>(() => {
    if (!raceDocuments?.length) {
      return [];
    }

    return raceDocuments.map((doc) => {
      const mergedMetadata = ((doc.document?.metadata || doc.metadata) ?? {}) as Record<string, any>;

      const deriveName = (): string => {
        const candidates = [mergedMetadata.displayName, mergedMetadata.title, doc.document?.filename];
        const found = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
        return found ? (found as string) : 'Document';
      };

      const deriveSize = (): number => {
        const sizeCandidate =
          doc.document?.file_size ?? mergedMetadata.file_size ?? mergedMetadata.size ?? mergedMetadata.fileSize;
        return typeof sizeCandidate === 'number' && Number.isFinite(sizeCandidate) ? sizeCandidate : 0;
      };

      const uploadedTimestamp = (doc.document?.created_at as string) ?? doc.createdAt;

      return {
        id: doc.id,
        name: deriveName(),
        type: normalizeDocumentType(doc.documentType),
        size: deriveSize(),
        uploadedAt: uploadedTimestamp,
        uploadedBy: (doc.document?.user_id as string) ?? doc.userId,
        aiProcessed: Boolean(
          mergedMetadata.aiProcessed ??
          mergedMetadata.ai_processed ??
          mergedMetadata.course_extract_id ??
          mergedMetadata.course_extracted ??
          mergedMetadata.ai_ready
        ),
        hasExtractedCourse: Boolean(mergedMetadata.course_extract_id ?? mergedMetadata.course_extracted),
      } satisfies RaceDocumentsCardDocument;
    });
  }, [raceDocuments]);

  const initialConditionsSnapshot = useMemo(() => {
    if (!selectedRaceData && !matchedEnrichedRace) {
      return null;
    }

    const metadata = (selectedRaceData?.metadata || {}) as Record<string, any>;
    const enrichedWind =
      matchedEnrichedRace?.wind ??
      (selectedRaceData as any)?.wind ??
      metadata?.wind ??
      metadata?.weather?.wind ??
      null;
    const enrichedTide =
      matchedEnrichedRace?.tide ??
      (selectedRaceData as any)?.tide ??
      metadata?.tide ??
      metadata?.weather?.tide ??
      null;

    if (!enrichedWind && !enrichedTide) {
      return null;
    }

    return {
      wind: enrichedWind ?? undefined,
      tide: enrichedTide ?? undefined,
      fetchedAt: metadata?.weather_fetched_at ?? metadata?.weather?.fetched_at ?? undefined,
      provider: metadata?.weather_provider ?? metadata?.weather?.provider ?? undefined,
    };
  }, [matchedEnrichedRace, selectedRaceData]);

  // Tactical snapshots (selectedRaceWeather, windSnapshot, currentSnapshot, boatDraftValue,
  // boatLengthValue, timeToStartMinutes, boatSpeedKnots) are now provided by useTacticalSnapshots hook above

  // Venue center (extracted to useVenueCenter hook)
  const { venueCenter } = useVenueCenter({
    selectedRaceData,
    selectedRaceMarks,
  });

  // Race course (extracted to useRaceCourse hook)
  const { raceCourseForConsole } = useRaceCourse({
    selectedRaceId,
    selectedRaceData,
    selectedRaceMarks,
    windSnapshot,
  });

  // Layout data (extracted to useRaceLayoutData hook)
  const {
    courseHeading,
    layoutWindData,
    layoutCurrentData,
    vhfChannel,
  } = useRaceLayoutData({
    raceCourseForConsole,
    windSnapshot,
    currentSnapshot,
    selectedRaceData,
  });

  // Next mark calculations (extracted to useNextMarkData hook)
  const {
    nextMarkForCalculations,
    overlayNextMark,
    quickActionNextMark,
  } = useNextMarkData({
    raceMarks: selectedRaceMarks,
    gpsPosition,
  });

  // Tide and depth snapshots (extracted to useTideDepthSnapshots hook)
  const {
    effectiveDraft,
    tideSnapshot,
    depthSnapshot,
  } = useTideDepthSnapshots({
    selectedRaceData,
    boatDraftValue,
    currentDraft,
  });

  // Coach context (extracted to useCoachContext hook)
  const { coachContext } = useCoachContext({
    selectedRaceId,
    selectedRaceData,
    raceCourseForConsole,
    selectedRaceWeather,
    tideSnapshot,
    venueCenter,
    gpsPosition,
    boatLengthValue,
    effectiveDraft,
  });

  const fallbackPosition = useMemo(() => {
    if (venueCenter) {
      return {
        latitude: venueCenter.latitude,
        longitude: venueCenter.longitude,
        heading: raceCourseForConsole?.startLine?.heading,
      };
    }
    return null;
  }, [venueCenter, raceCourseForConsole]);

  useEffect(() => {
    fallbackPositionInitializedRef.current = false;
  }, [fallbackPosition?.latitude, fallbackPosition?.longitude, hasActiveRace]);

  // Race phase input (extracted to useRacePhaseInput hook)
  const { phaseDetectionMarks, racePhaseInput } = useRacePhaseInput({
    raceCourseForConsole,
    selectedRaceData,
    gpsPosition,
    fallbackPosition,
    lastHeadingRef,
    boatSpeedKnots,
  });

  const racePhaseContext = useRacePhaseDetection(racePhaseInput);

  // Debrief data (extracted to useRaceDebriefData hook)
  const {
    currentGpsTrack,
    currentSplitTimes,
    timeToStartSeconds,
  } = useRaceDebriefData({
    selectedRaceData,
    timeToStartMinutes,
  });

  useEffect(() => {
    if (typeof boatDraftValue === 'number' && Math.abs(boatDraftValue - currentDraft) > 0.01) {
      setDraft(boatDraftValue);
    }
  }, [boatDraftValue, currentDraft]);

  useEffect(() => {
    if (!hasActiveRace) {
      return;
    }

    const envUpdateBase: Record<string, any> = {};

    if (windSnapshot) {
      envUpdateBase.wind = {
        trueSpeed: windSnapshot.speed,
        trueDirection: windSnapshot.direction,
        apparentSpeed: windSnapshot.speed,
        apparentAngle: 0,
        speed: windSnapshot.speed,
        direction: windSnapshot.direction,
        gust: windSnapshot.gust,
        forecast: windSnapshot.forecast,
      };
    }

    if (currentSnapshot) {
      const strength = currentSnapshot.speed >= 1.5 ? 'strong' : currentSnapshot.speed >= 0.7 ? 'moderate' : 'weak';
      envUpdateBase.current = {
        speed: currentSnapshot.speed,
        direction: currentSnapshot.direction,
        phase: currentSnapshot.type ?? 'slack',
        strength,
        trend: 'slack',
        type: currentSnapshot.type,
      };
    }

    if (tideSnapshot) {
      envUpdateBase.tide = { ...tideSnapshot };
    }

    const depthPayload = depthSnapshot ?? {
      current: effectiveDraft + 3,
      minimum: effectiveDraft + 1,
      trend: 0,
      clearance: 3,
    };

    envUpdateBase.depth = {
      ...depthPayload,
      clearance:
        (depthPayload.current ?? depthPayload.minimum ?? (effectiveDraft + 3)) -
        effectiveDraft,
    };

    if (Object.keys(envUpdateBase).length > 0) {
      try {
        const serialized = JSON.stringify(envUpdateBase);
        if (previousEnvironmentKeyRef.current === serialized) {
          return;
        }
        previousEnvironmentKeyRef.current = serialized;
      } catch (error) {
        logger.warn('Failed to serialize environment update', error);
      }
      updateEnvironment(envUpdateBase);
    }
  }, [
    hasActiveRace,
    windSnapshot,
    currentSnapshot,
    tideSnapshot,
    depthSnapshot,
    effectiveDraft,
    updateEnvironment,
  ]);

  useEffect(() => {
    if (!hasActiveRace || !raceCourseForConsole) {
      return;
    }
    try {
      const serialized = JSON.stringify({
        id: raceCourseForConsole.id,
        marks: raceCourseForConsole.marks,
        legs: raceCourseForConsole.legs,
        startLine: raceCourseForConsole.startLine,
        laps: raceCourseForConsole.laps,
      });
      if (previousCourseKeyRef.current === serialized) {
        return;
      }
      previousCourseKeyRef.current = serialized;
    } catch (error) {
      logger.warn('Failed to serialize course for cache comparison', error);
    }
    updateCourse(raceCourseForConsole);
  }, [hasActiveRace, raceCourseForConsole, updateCourse]);

  useEffect(() => {
    if (!hasActiveRace) {
      return;
    }

    if (!windSnapshot || !currentSnapshot || !raceCourseForConsole || !venueCenter) {
      setTacticalZones([]);
      return;
    }

    const venueFeaturesRaw = (selectedRaceData?.metadata as Record<string, any> | undefined)?.venue_features;
    const venueFeatures = Array.isArray(venueFeaturesRaw)
      ? venueFeaturesRaw.map((feature: any) => String(feature))
      : typeof venueFeaturesRaw === 'string'
        ? venueFeaturesRaw.split(',').map((item: string) => item.trim()).filter(Boolean)
        : undefined;

    const zones = TacticalZoneGenerator.generateZones({
      wind: {
        speed: windSnapshot.speed,
        direction: windSnapshot.direction,
      } as any,
      current: {
        speed: currentSnapshot.speed,
        direction: currentSnapshot.direction,
        phase: currentSnapshot.type ?? 'slack',
      } as any,
      tide: tideSnapshot ?? undefined,
      depth: depthSnapshot ?? undefined,
      course: raceCourseForConsole as any,
      venue: venueCenter
        ? {
          center: venueCenter,
          features: venueFeatures,
        }
        : undefined,
    });

    try {
      const serialized = JSON.stringify(zones);
      if (previousZonesKeyRef.current === serialized) {
        return;
      }
      previousZonesKeyRef.current = serialized;
    } catch (error) {
      logger.warn('Failed to serialize tactical zones', error);
    }

    setTacticalZones(zones);
  }, [
    hasActiveRace,
    windSnapshot,
    currentSnapshot,
    tideSnapshot,
    depthSnapshot,
    raceCourseForConsole,
    venueCenter,
    selectedRaceData,
    setTacticalZones,
  ]);

  useEffect(() => {
    if (!hasActiveRace) return;
    if (Platform.OS !== 'web') return;
    if (gpsPosition) return;
    if (!fallbackPosition) return;
    if (fallbackPositionInitializedRef.current) return;

    updateRacePosition({
      latitude: fallbackPosition.latitude,
      longitude: fallbackPosition.longitude,
      speed: 0,
      heading: fallbackPosition.heading ?? 0,
      timestamp: new Date(),
    });
    fallbackPositionInitializedRef.current = true;
  }, [hasActiveRace, fallbackPosition, gpsPosition]);

  const handleShareRaceAnalysis = useCallback(async () => {
    const raceName =
      selectedRaceData?.name ||
      selectedRaceData?.metadata?.race_name ||
      selectedDemoRace?.name ||
      'Race Analysis';

    const raceStartIso = selectedRaceData?.start_date || selectedDemoRace?.date;
    const raceDate =
      raceStartIso && !Number.isNaN(new Date(raceStartIso).valueOf())
        ? new Date(raceStartIso)
        : null;
    const raceDateLabel = raceDate
      ? raceDate.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
      : null;

    const venueName =
      selectedRaceData?.metadata?.venue_name ||
      selectedRaceData?.venue_name ||
      selectedDemoRace?.venue ||
      currentVenue?.name ||
      null;

    const metrics = calculatePerformanceMetrics(
      currentGpsTrack,
      selectedRaceWeather?.wind?.direction
    );

    const finishSplit =
      currentSplitTimes.length > 0
        ? currentSplitTimes[currentSplitTimes.length - 1]
        : null;
    const startSplit = currentSplitTimes.length > 0 ? currentSplitTimes[0] : null;
    const positionsDelta =
      finishSplit && startSplit ? startSplit.position - finishSplit.position : null;

    let windLine: string | null = null;
    if (selectedRaceWeather?.wind) {
      const baseSpeed =
        typeof selectedRaceWeather.wind.speed === 'number'
          ? selectedRaceWeather.wind.speed.toFixed(1)
          : selectedRaceWeather.wind.speed?.toString?.() ?? '';
      const gustPart =
        typeof selectedRaceWeather.wind.gust === 'number'
          ? ` (gusts ${selectedRaceWeather.wind.gust.toFixed(1)} kts)`
          : '';
      windLine = baseSpeed
        ? `Wind: ${baseSpeed} kts${gustPart} @ ${Math.round(selectedRaceWeather.wind.direction)}°`
        : null;
    }

    const lines = [
      `${raceName} – Race Debrief`,
      raceDateLabel ? `When: ${raceDateLabel}` : null,
      venueName ? `Venue: ${venueName}` : null,
      `Duration: ${metrics.totalTime}`,
      `Average Speed: ${metrics.avgSpeed} kts (max ${metrics.maxSpeed} kts)`,
      `Distance Sailed: ${metrics.totalDistance} nm`,
      `VMG Efficiency: ${metrics.vmgEfficiency}%`,
      positionsDelta !== null
        ? `Positions gained: ${positionsDelta > 0 ? `+${positionsDelta}` : positionsDelta}`
        : null,
      finishSplit ? `Finish Position: ${finishSplit.position}` : null,
      windLine,
    ].filter(Boolean) as string[];

    if (lines.length === 0) {
      Alert.alert('Share', 'Nothing to share yet—run a race first!');
      return;
    }

    const message = lines.join('\n');
    const shareTitle = `${raceName} – Race Debrief`;

    try {
      if (Platform.OS === 'web') {
        const nav: any = typeof navigator !== 'undefined' ? navigator : undefined;
        const shareUrl =
          typeof window !== 'undefined' && window.location
            ? window.location.href
            : undefined;

        if (nav?.share) {
          await nav.share({
            title: shareTitle,
            text: message,
            url: shareUrl,
          });
        } else if (nav?.clipboard?.writeText) {
          await nav.clipboard.writeText(message);
          Alert.alert('Copied', 'Race summary copied to your clipboard for easy sharing.');
        } else {
          Alert.alert('Race Debrief', message);
        }
      } else {
        await Share.share({
          title: shareTitle,
          message,
        });
      }

      logger.info('[races.tsx] Race analysis shared');
    } catch (error) {
      logger.error('[races.tsx] Failed to share race analysis', error);
      Alert.alert('Share failed', 'Unable to share race analysis right now. Please try again later.');
    }
  }, [
    selectedRaceData,
    selectedDemoRace,
    currentVenue?.name,
    currentGpsTrack,
    currentSplitTimes,
    selectedRaceWeather,
  ]);

  const handlePositionUpdate = useCallback((position: any) => {
    const speedKnots =
      typeof position.speed === 'number'
        ? position.speed * 1.94384
        : null;

    setGpsPosition({
      ...position,
      speed: speedKnots !== null && Number.isFinite(speedKnots) ? speedKnots : null,
    });

    if (!hasActiveRace) {
      return;
    }

    const heading =
      typeof position.heading === 'number'
        ? position.heading
        : lastHeadingRef.current ?? 0;

    if (typeof position.heading === 'number') {
      lastHeadingRef.current = position.heading;
    }

    updateRacePosition({
      latitude: position.latitude,
      longitude: position.longitude,
      speed: speedKnots !== null && Number.isFinite(speedKnots) ? speedKnots : 0,
      heading,
      timestamp: position.timestamp ? new Date(position.timestamp) : new Date(),
    });
  }, [hasActiveRace, updateRacePosition]);

  // Extract weather data for rig tuning
  // selectedRaceWeather has a different structure: { wind: { speed, direction, gust }, current: {...} }
  const wind = selectedRaceWeather?.wind;
  const current = selectedRaceWeather?.current;

  // Calculate wind range - if we have speed and gust, use those as min/max
  const windSpeed = wind?.speed;
  const windGust = wind?.gust;
  const windMin = windSpeed ? Math.round(windSpeed * 0.9) : undefined; // Estimate min as 90% of speed
  const windMax = windGust || (windSpeed ? Math.round(windSpeed * 1.1) : undefined); // Use gust or 110% of speed
  const averageWindSpeed = windSpeed;

  const {
    recommendation: selectedRaceTuningRecommendation,
    loading: selectedRaceTuningLoading,
    refresh: refreshSelectedRaceTuning,
  } = useRaceTuningRecommendation({
    classId: selectedRaceClassId,
    className: selectedRaceClassName,
    averageWindSpeed,
    windMin,
    windMax,
    windDirection: wind?.direction,
    gusts: windGust,
    currentSpeed: current?.speed,
    currentDirection: current?.direction,
    pointsOfSail: 'upwind',
    enabled: !!(selectedRaceClassId || selectedRaceClassName),
  });

  // Enriched CardGrid races - merges detailed data for the selected race
  const cardGridRaces: CardRaceData[] = useMemo(() => {
    return baseCardGridRaces.map((race) => {
      // Only enrich the selected race with detailed data from hooks
      if (race.id === selectedRaceId) {
        return {
          ...race,
          // Rig settings from tuning recommendation hook
          rigSettings: selectedRaceTuningRecommendation ? {
            boatClassName: selectedRaceClassName,
            conditionSummary: selectedRaceTuningRecommendation.conditionSummary,
            settings: selectedRaceTuningRecommendation.settings,
            isAIGenerated: selectedRaceTuningRecommendation.isAIGenerated,
            confidence: selectedRaceTuningRecommendation.confidence,
            guideName: selectedRaceTuningRecommendation.guideTitle,
          } : race.rigSettings,
          // Fleet data from selected race detail
          fleet: {
            totalCompetitors: selectedRaceData?.entry_count || selectedRaceData?.competitor_count || race.fleet?.totalCompetitors || 0,
            confirmedCount: selectedRaceData?.confirmed_count || race.fleet?.confirmedCount || 0,
            fleetName: selectedRaceData?.fleet?.name || race.fleet?.fleetName,
            isRegistered: selectedRaceData?.is_registered ?? race.fleet?.isRegistered,
            competitors: selectedRaceData?.competitors || race.fleet?.competitors || [],
          },
          // Regulatory data from documents hook and race metadata
          regulatory: {
            documents: raceDocumentsForDisplay?.length > 0
              ? raceDocumentsForDisplay.map(doc => ({
                id: doc.id,
                name: doc.name,
                type: doc.type as any,
                uploadedAt: doc.uploadedAt,
              }))
              : race.regulatory?.documents || [],
            vhfChannel: selectedRaceData?.metadata?.vhf_channel || race.regulatory?.vhfChannel,
            protestDeadline: selectedRaceData?.metadata?.protest_deadline || race.regulatory?.protestDeadline,
          },
        };
      }
      return race;
    });
  }, [baseCardGridRaces, selectedRaceId, selectedRaceData, selectedRaceTuningRecommendation, selectedRaceClassName, raceDocumentsForDisplay]);

  const profileOnboardingStep = (profile as { onboarding_step?: string } | null | undefined)?.onboarding_step;

  const isDemoProfile = (profileOnboardingStep ?? '').toString().startsWith('demo');

  const handleClaimWorkspace = useCallback(() => {
    router.push('/(tabs)/settings' as any);
  }, [router]);

  // Clear old details immediately on selection change to avoid showing stale details
  React.useEffect(() => {
    logger.debug('[races.tsx] 🔄 Selection changed, clearing previous details for ID:', selectedRaceId);
    setSelectedRaceData(null);
    setSelectedRaceMarks([]);
  }, [selectedRaceId]);

  // Auto-scroll to center on next race
  useEffect(() => {
    // Skip auto-centering once the user has manually interacted or after the first center
    if (
      loading ||
      !nextRace ||
      safeRecentRaces.length === 0 ||
      hasManuallySelected ||
      hasAutoCenteredNextRace.current
    ) {
      return;
    }

    const nextRaceIndex = safeRecentRaces.findIndex((race: any) => race.id === safeNextRace?.id);
    if (nextRaceIndex === -1) {
      return;
    }

    const scrollX =
      nextRaceIndex * RACE_CARD_TOTAL_WIDTH - SCREEN_WIDTH / 2 + RACE_CARD_WIDTH / 2;

    const timer = setTimeout(() => {
      if (raceCardsScrollViewRef.current) {
        raceCardsScrollViewRef.current.scrollTo({
          x: Math.max(0, scrollX),
          y: 0,
          animated: true,
        });
        hasAutoCenteredNextRace.current = true;
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [nextRace, safeRecentRaces, loading, hasManuallySelected, SCREEN_WIDTH]);

  // Keep the selected race visible by centering it when selection changes
  useEffect(() => {
    if (!selectedRaceId || !raceCardsScrollViewRef.current || safeRecentRaces.length === 0) {
      return;
    }

    const selectedIndex = safeRecentRaces.findIndex((race: any) => race.id === selectedRaceId);
    if (selectedIndex === -1) {
      return;
    }

    const scrollX =
      selectedIndex * RACE_CARD_TOTAL_WIDTH - SCREEN_WIDTH / 2 + RACE_CARD_WIDTH / 2;

    raceCardsScrollViewRef.current.scrollTo({
      x: Math.max(0, scrollX),
      y: 0,
      animated: true,
    });
  }, [selectedRaceId, safeRecentRaces, SCREEN_WIDTH]);

  // Auth loading state - show while auth is being initialized
  if (!ready) {
    return <DashboardSkeleton />;
  }

  // Loading state - AFTER all hooks
  // Show skeleton if:
  // 1. Dashboard is loading and no profile yet, OR
  // 2. User is signed in but races haven't loaded yet (prevents flash of demo content)
  if ((loading && !profile) || (signedIn && liveRacesLoading && !hasLoadedRacesOnce.current)) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (error && !profile) {
    return (
      <View className="flex-1 bg-background-0 items-center justify-center">
        <ErrorMessage
          title="Unable to load dashboard"
          message={error.message || 'Please check your connection and try again'}
          type="network"
          onRetry={onRefresh}
        />
      </View>
    );
  }

  // iOS Races Screen - Full-screen immersive design
  if (FEATURE_FLAGS.USE_IOS_RACES_SCREEN && Platform.OS !== 'web') {
    // Transform race data for IOSRacesScreen
    const iosRaces = safeRecentRaces.map((race: any) => {
      const now = new Date();
      const raceDate = new Date(race.start_date || race.date);
      const diffMs = raceDate.getTime() - now.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      // Determine status
      let status: 'upcoming' | 'today' | 'past' = 'upcoming';
      if (diffDays < 0) {
        status = 'past';
      } else if (diffDays === 0) {
        status = 'today';
      }

      return {
        id: race.id,
        name: race.name || race.regatta_name || 'Untitled Race',
        venue: race.venue || race.location,
        date: race.start_date || race.date,
        startTime: race.start_time || race.startTime || '10:00',
        raceType: race.race_type as 'fleet' | 'distance' | 'match' | 'team' | undefined,
        status,
        daysUntil: Math.max(0, diffDays),
        hoursUntil: status === 'today' ? Math.max(0, diffHours) : undefined,
        minutesUntil: status === 'today' && diffHours < 1 ? Math.max(0, diffMinutes) : undefined,
        wind: race.wind_speed ? { direction: race.wind_direction || 'N', speed: race.wind_speed } : undefined,
        numberOfRaces: race.number_of_races,
        progress: race.prepProgress || 0,
      };
    });

    return (
      <IOSRacesScreen
        races={iosRaces}
        onRacePress={(race) => {
          setSelectedRaceId(race.id);
          setHasManuallySelected(true);
          // Navigate to race detail
          router.push(`/race/${race.id}`);
        }}
        onAddRace={handleShowAddRaceSheet}
        isLoading={loading || liveRacesLoading}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: TUFTE_BACKGROUND }}>
      {/* Main Content first — flows behind absolutely-positioned toolbar */}
      {/* Show loading state when creating sample data for new users */}
      {creatingSampleData ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: TUFTE_BACKGROUND }}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#64748B', textAlign: 'center' }}>
            Setting up your first race...
          </Text>
        </View>
      ) : FEATURE_FLAGS.USE_RACE_LIST_VIEW ? (
        // Grouped vertical list view — progressive disclosure design
        <RaceListSection
          races={cardGridRaces}
          onRacePress={(raceId) => {
            setSelectedRaceId(raceId);
            setHasManuallySelected(true);
            router.push(`/race/${raceId}`);
          }}
          onRaceMorePress={(raceId) => {
            const options = ['Race Courses', 'Race Detail', 'Cancel'];
            const cancelButtonIndex = 2;

            if (Platform.OS === 'ios') {
              ActionSheetIOS.showActionSheetWithOptions(
                { options, cancelButtonIndex },
                (buttonIndex) => {
                  if (buttonIndex === 0) {
                    router.push('/race-courses');
                  } else if (buttonIndex === 1) {
                    router.push(`/race/${raceId}`);
                  }
                },
              );
            } else {
              Alert.alert('Race Options', undefined, [
                { text: 'Race Courses', onPress: () => router.push('/race-courses') },
                { text: 'Race Detail', onPress: () => router.push(`/race/${raceId}`) },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }
          }}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      ) : FEATURE_FLAGS.USE_CARD_GRID_NAVIGATION ? (
        // New CardGrid 2D navigation system - wrapped for tour spotlight
        <View
          ref={cardGridRef}
          collapsable={false}
          style={{ flex: 1 }}
        >
          {/* Timeline header when viewing another user */}
          {isViewingOtherTimeline && currentTimeline && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: '#E2E8F0',
            }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: currentTimeline?.user?.avatar?.color || '#3B82F6',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}>
                <Text style={{ fontSize: 18 }}>{currentTimeline?.user?.avatar?.emoji || '⛵'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1E293B' }}>
                  {currentTimeline?.user?.name || 'Timeline'}'s Timeline
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>
                  {currentTimeline?.races?.length || 0} {(currentTimeline?.races?.length || 0) === 1 ? 'race' : 'races'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setCurrentTimelineIndex(0)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: '#F1F5F9',
                  borderRadius: 16,
                }}
              >
                <Text style={{ fontSize: 13, color: '#3B82F6', fontWeight: '500' }}>Back to Mine</Text>
              </TouchableOpacity>
            </View>
          )}

          <CardGrid
            races={cardGridRaces}
            renderCardContent={renderCardGridContent}
            onRaceChange={handleCardGridRaceChange}
            onCardChange={handleCardGridCardChange}
            initialRaceIndex={Math.max(0, cardGridRaces.findIndex(r => r.id === (selectedRaceId || safeNextRace?.id)))}
            nextRaceIndex={!isViewingOtherTimeline && safeNextRace?.id ? cardGridRaces.findIndex(r => r.id === safeNextRace.id) : null}
            enableHaptics={FEATURE_FLAGS.ENABLE_CARD_HAPTICS}
            persistState={FEATURE_FLAGS.PERSIST_CARD_NAVIGATION && !isViewingOtherTimeline}
            style={{ flex: 1 }}
            userId={user?.id}
            topInset={totalHeaderHeight}
            safeAreaTop={insets.top}
            toolbarHidden={toolbarHidden}
            onContentScroll={handleToolbarScroll}
            onEditRace={isViewingOtherTimeline ? undefined : handleEditRace}
            onDeleteRace={isViewingOtherTimeline ? undefined : handleDeleteRace}
            deletingRaceId={deletingRaceId}
            onUploadDocument={isViewingOtherTimeline ? undefined : handleCardGridUploadDocument}
            onRaceComplete={isViewingOtherTimeline ? undefined : handleRaceComplete}
            onOpenPostRaceInterview={isViewingOtherTimeline ? undefined : (raceId, _raceName) => {
              // Find the race data from cardGridRaces to pass directly (avoids stale closure issues)
              const raceData = cardGridRaces.find(r => r.id === raceId);
              // Select the race if different
              if (raceId !== selectedRaceId) {
                setSelectedRaceId(raceId);
                setHasManuallySelected(true);
              }
              // Pass raceId and raceData directly to avoid stale closure issues with setTimeout
              handleOpenPostRaceInterviewManually(raceId, raceData ? { name: raceData.name, start_date: raceData.start_date || raceData.date } : undefined);
            }}
            onDismissSample={isViewingOtherTimeline ? undefined : handleDismissSampleRace}
            refetchTrigger={refetchTrigger}
          />
        </View>
      ) : (
        <ScrollView
          ref={mainScrollViewRef}
          className="flex-1 px-4 py-4"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2563EB"
            />
          }
          showsVerticalScrollIndicator={false}
          onScroll={handleToolbarScroll}
          scrollEventThrottle={16}
        >
          {/* Demo notice */}
          <DemoNotice
            visible={isDemoProfile && !demoNoticeDismissed}
            onDismiss={() => setDemoNoticeDismissed(true)}
            onClaimWorkspace={handleClaimWorkspace}
          />

          {/* Fleet Activity Feed - Auto-surfaces fleet mates' race prep (Inner Circle discovery) */}
          {!isGuest && hasRealRaces && (
            <FleetActivityFeed
              maxItems={6}
              onRaceSelect={(race) => {
                // Navigate to view the fleet mate's race
                logger.info('Fleet activity race selected:', race.name, race.userId);
              }}
            />
          )}

          {/* Class Experts Section - Discover top sailors in your boat class */}
          {!isGuest && hasRealRaces && (
            <ClassExpertsSection
              limit={5}
              onExpertSelect={(expert) => {
                logger.info('Class expert selected:', expert.userName, expert.expertScore);
              }}
            />
          )}

          {/* RACE CARDS - MULTIPLE RACES SIDE-BY-SIDE */}
          {hasRealRaces ? (
            // Legacy carousel with detail zone
            <>
              <RealRacesCarousel
                races={safeRecentRaces}
                practiceSessions={practiceSessions}
                onSelectPractice={handleSelectPractice}
                nextRace={safeNextRace}
                selectedRaceId={selectedRaceId}
                onSelectRace={(id) => {
                  setHasManuallySelected(true);
                  setSelectedRaceId(id);
                }}
                selectedRaceData={selectedRaceData}
                selectedRaceMarks={selectedRaceMarks}
                raceDocuments={raceDocuments}
                userRaceResults={userRaceResults}
                userId={user?.id}
                hasActiveRace={hasActiveRace}
                isMobileNative={isMobileNative}
                getRaceStatus={getRaceStatus}
                onEditRace={handleEditRace}
                onDeleteRace={handleDeleteRace}
                deletingRaceId={deletingRaceId}
                useTimelineLayout={true}
                useAppleStyle={FEATURE_FLAGS.USE_APPLE_STYLE_CARDS}
                useRefinedStyle={FEATURE_FLAGS.USE_REFINED_STYLE_CARDS}
                pastRaceIds={pastRaceIds}
                onAddDebrief={(raceId) => {
                  // Find the race data to pass directly (avoids stale closure issues)
                  const raceData = safeRecentRaces.find(r => r.id === raceId);
                  // Ensure the race is selected
                  if (raceId !== selectedRaceId) {
                    setSelectedRaceId(raceId);
                  }
                  // Pass raceId and raceData directly to avoid stale closure issues with setTimeout
                  handleOpenPostRaceInterviewManually(raceId, raceData ? { name: raceData.name, start_date: raceData.start_date || raceData.date } : undefined);
                }}
              />

              {/* Inline Comprehensive Race Detail Section */}
              {loadingRaceDetail && !selectedRaceData && (
                <View className="items-center justify-center py-8">
                  <ActivityIndicator size="large" color="#2563EB" />
                  <Text className="text-gray-500 mt-2">Loading race details...</Text>
                </View>
              )}

              {selectedRaceData && (() => {
                // Compute race status for the selected race
                const isNextRace = safeNextRace?.id === selectedRaceData.id;
                const selectedRaceStatus = getRaceStatus(
                  selectedRaceData.start_date || selectedRaceData.date || new Date().toISOString(),
                  isNextRace,
                  selectedRaceData.start_time || selectedRaceData.startTime
                );
                const isRacePast = selectedRaceStatus === 'past';
                const isRaceFuture = selectedRaceStatus === 'future' || selectedRaceStatus === 'next';

                return (
                  <PlanModeContent
                    raceData={selectedRaceData}
                    raceId={selectedRaceData.id}
                    raceStatus={isRacePast ? 'completed' : 'upcoming'}
                    hasPostRaceData={isRacePast}
                    sections={{
                      courseAndStrategy: (
                        <>

                          {/* Distance Racing vs Fleet Racing Content */}
                          {selectedRaceData.race_type === 'distance' ? (
                            <DistanceRaceContentSection
                              raceData={selectedRaceData}
                              isRaceFuture={isRaceFuture}
                              userId={user?.id}
                              enrichedWeather={selectedRaceEnrichedWeather}
                              onRaceDataUpdate={setSelectedRaceData}
                              onEditRoute={() => router.push(`/race/edit/${selectedRaceData.id}`)}
                            />
                          ) : (
                            <FleetRaceContentSection
                              raceData={selectedRaceData}
                              marks={selectedRaceMarks}
                              drawingRacingArea={drawingRacingArea}
                              onMarksUpdate={setSelectedRaceMarks}
                              onRaceDataUpdate={setSelectedRaceData}
                              ensureRaceEventId={ensureRaceEventId}
                              onRacingAreaChange={handleRacingAreaChange}
                              onSaveRacingArea={handleSaveRacingArea}
                              onMarkAdded={handleMarkAdded}
                              onMarkUpdated={handleMarkUpdated}
                              onMarkDeleted={handleMarkDeleted}
                              onMarksBulkUpdate={handleBulkMarksUpdate}
                            />
                          )}

                          {/* ============================================ */}
                          {/*  PRE-RACE STRATEGY SECTION                 */}
                          {/* ============================================ */}
                          {/* Fleet Racing AI Coach - Only for fleet races AND future races */}
                          {/* Hide AI strategy guidance for past races - no longer actionable */}
                          {selectedRaceData.race_type !== 'distance' && isRaceFuture && (
                            <>
                              <RacePhaseHeader
                                icon="chess-knight"
                                title="Pre-Race Strategy"
                                subtitle="AI-generated plan based on conditions"
                                badge="Ready"
                                phase="upcoming"
                              />

                              {/* AI Race Coach - Unified Strategy Section (Redesigned) */}
                              <PreRaceStrategySection
                                raceId={selectedRaceData.id}
                                raceData={{
                                  name: selectedRaceData.name,
                                  startTime: selectedRaceData.start_date,
                                  fleetSize: selectedRaceData.metadata?.fleet_size,
                                  course: selectedRaceData.metadata?.course_type,
                                  marks: selectedRaceMarks,
                                  weather: {
                                    windSpeed: selectedRaceData.metadata?.expected_wind_speed,
                                    windDirection: selectedRaceData.metadata?.expected_wind_direction,
                                  },
                                  venue: selectedRaceData.metadata?.venue_name ? {
                                    name: selectedRaceData.metadata.venue_name,
                                    lat: selectedRaceData.metadata.venue_lat,
                                    lng: selectedRaceData.metadata.venue_lng,
                                  } : undefined,
                                }}
                                racePhase={
                                  selectedRaceData.raceStatus === 'in_progress' ? 'racing' :
                                    selectedRaceData.raceStatus === 'completed' ? 'post-race' :
                                      'pre-race'
                                }
                                onSkillInvoked={(skillId, advice) => {
                                  logger.info('AI Skill invoked:', skillId, advice.primary);
                                }}
                              />
                            </>
                          )}

                          {/* Fleet Racing Strategy Cards */}
                          <FleetStrategySection
                            isRaceFuture={isRaceFuture}
                            raceData={selectedRaceData}
                            sailorId={sailorId}
                          />

                          {/* Learning Patterns - For Future Races: Inform Strategy Planning */}
                          {isRaceFuture && (
                            <View className="mt-4">
                              <Text className="text-sm font-semibold text-gray-700 mb-2 px-4">
                                📊 Learning from Past Races
                              </Text>
                              <AIPatternDetection />
                            </View>
                          )}

                          {/* Share Strategy - only for future races */}
                          {isRaceFuture && sailorId && selectedRaceData?.id && (
                            <View style={{ marginTop: 16, marginBottom: 8 }}>
                              <TouchableOpacity
                                style={{
                                  backgroundColor: '#3B82F6',
                                  paddingVertical: 14,
                                  paddingHorizontal: 20,
                                  borderRadius: 12,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 8,
                                }}
                                onPress={handleOpenStrategySharing}
                                disabled={sharingStrategy}
                              >
                                <MaterialCommunityIcons name="share-variant" size={20} color="white" />
                                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                                  Share Strategy
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </>
                      ),
                      conditions: (
                        <>
                          {/* Unified Race Conditions - Wind, Tide & Waves Timeline */}
                          <RaceConditionsCard
                            raceId={selectedRaceData.id}
                            raceTime={selectedRaceData.start_date}
                            venueCoordinates={selectedRaceVenueCoordinates}
                            venue={selectedRaceVenueCoordinates ? {
                              id: `venue-${selectedRaceVenueCoordinates.lat}-${selectedRaceVenueCoordinates.lng}`,
                              name: selectedRaceData.metadata?.venue_name || 'Race Venue',
                              coordinates: {
                                latitude: selectedRaceVenueCoordinates.lat,
                                longitude: selectedRaceVenueCoordinates.lng
                              },
                              region: 'asia_pacific',
                              country: 'HK'
                            } : undefined}
                            warningSignalTime={selectedRaceData.warning_signal_time}
                            expectedDurationMinutes={
                              // For distance races: use time_limit_hours (in minutes) or estimate from distance
                              // For fleet races: use time_limit_minutes or default 90 min
                              selectedRaceData.race_type === 'distance'
                                ? (selectedRaceData.time_limit_hours
                                  ? selectedRaceData.time_limit_hours * 60
                                  : selectedRaceData.total_distance_nm
                                    ? Math.round(selectedRaceData.total_distance_nm / 5 * 60) // ~5 knots avg speed
                                    : 360) // Default 6 hours for distance races
                                : (selectedRaceData.time_limit_minutes || 90)
                            }
                            savedWind={selectedRaceEnrichedWeather?.wind || selectedRaceData.metadata?.wind}
                            savedTide={selectedRaceEnrichedWeather?.tide || selectedRaceData.metadata?.tide}
                            savedWeatherFetchedAt={selectedRaceEnrichedWeather?.weatherFetchedAt || selectedRaceData.metadata?.weather_fetched_at}
                            raceStatus={selectedRaceData.raceStatus}
                          />
                        </>
                      ),
                      boatSetup: (
                        <BoatSetupSection
                          isRaceFuture={isRaceFuture}
                          raceId={selectedRaceData.id}
                          selectedRaceClassId={selectedRaceClassId}
                          selectedRaceClassName={selectedRaceClassName}
                          onSetBoatClass={handleSetBoatClass}
                          rigPresets={rigPresets}
                          selectedRigBand={selectedRigBand}
                          onSelectBand={(bandId) => setSelectedRigBand(bandId)}
                          rigNotes={rigNotes}
                          onChangeNotes={setRigNotes}
                          selectedRaceTuningRecommendation={selectedRaceTuningRecommendation}
                          selectedRaceTuningLoading={selectedRaceTuningLoading}
                          onRefreshTuning={selectedRaceClassId ? refreshSelectedRaceTuning : undefined}
                          onOpenChat={handleOpenChatFromRigPlanner}
                          isGenericDefaults={isGenericDefaultsFromMetadata && !selectedRaceTuningRecommendation}
                          onAddTuningGuide={() => {
                            router.push('/(tabs)/tuning-guides');
                          }}
                        />
                      ),
                      teamAndLogistics: (
                        <TeamLogisticsSection
                          raceId={selectedRaceData.id}
                          classId={selectedRaceData.class_id || selectedRaceData.metadata?.class_id}
                          className={selectedRaceData.metadata?.class_name}
                          raceDate={selectedRaceData.start_date}
                          raceName={selectedRaceData.name || selectedRaceData.race_name}
                          venueId={selectedRaceData.metadata?.venue_id}
                          onManageCrew={() =>
                            handleManageCrewNavigation({
                              raceId: selectedRaceData.id,
                              classId: selectedRaceData.class_id || selectedRaceData.metadata?.class_id,
                              className: selectedRaceClassName || selectedRaceData.metadata?.class_name,
                              raceName: selectedRaceData.name || selectedRaceData.race_name,
                              raceDate: selectedRaceData.start_date,
                            })
                          }
                          onLayout={(y) => setLogisticsSectionY((prev) => (Math.abs(prev - y) > 4 ? y : prev))}
                        />
                      ),
                      regulatory: (
                        <>
                          <View
                            onLayout={({ nativeEvent }) => {
                              const positionY = nativeEvent.layout.y;
                              setRegulatorySectionY((prev) => (Math.abs(prev - positionY) > 4 ? positionY : prev));
                            }}
                            className="mt-6"
                          >
                            <RegulatoryDigestCard
                              digest={regulatoryDigest}
                              acknowledgements={regattaAcknowledgements}
                              onToggle={handleToggleAcknowledgement}
                            />

                            <CourseOutlineCard groups={courseOutlineGroups} />
                          </View>
                        </>
                      ),
                      raceExecution: (
                        <>
                          {/* Timer removed - use the timer in the Race Card above */}
                          <View style={{ height: 600 }}>
                            <OnWaterTrackingView
                              sessionId={gpsTrackSessionId || selectedRaceData?.id}
                              isTracking={isGPSTracking}
                              courseMarks={selectedRaceMarks}
                              initialRegion={
                                selectedRaceData?.venue ? {
                                  latitude: selectedRaceData.venue.coordinates_lat || 22.3193,
                                  longitude: selectedRaceData.venue.coordinates_lng || 114.1694,
                                  latitudeDelta: 0.05,
                                  longitudeDelta: 0.05,
                                } : undefined
                              }
                            />
                          </View>
                        </>
                      ),
                      // Only show Post-Race Analysis for past/completed races
                      postRaceAnalysis: isRacePast ? (
                        <PostRaceAnalysisSection
                          raceId={selectedRaceData.id}
                          raceName={selectedRaceData.name}
                          raceStartTime={selectedRaceData.start_date}
                          currentUserId={user?.id}
                          gpsTrack={currentGpsTrack}
                          weather={selectedRaceWeather}
                          splitTimes={currentSplitTimes}
                          onShareAnalysis={handleShareRaceAnalysis}
                          onViewSession={(sessionId) =>
                            router.push({
                              pathname: '/(tabs)/race-session/[sessionId]',
                              params: { sessionId },
                            })
                          }
                        />
                      ) : undefined,
                    }}
                  />
                );
              })()}
            </>
          ) : (
            // User has no races - show mock race cards horizontally with fixed hero height
            <DemoRacesCarousel
              selectedDemoRaceId={selectedDemoRaceId}
              onSelectDemoRace={setSelectedDemoRaceId}
              selectedDemoRace={selectedDemoRace}
              onAddRace={handleShowAddRaceSheet}
              onAddRaceNavigation={handleAddRaceNavigation}
              onLogisticsSectionLayout={(y) => setLogisticsSectionY((prev) => (Math.abs(prev - y) > 4 ? y : prev))}
              onRegulatorySectionLayout={(y) => setRegulatorySectionY((prev) => (Math.abs(prev - y) > 4 ? y : prev))}
            />
          )}

          {/* AI Venue Insights Card */}
          {showInsights && venueInsights && (
            <AIVenueInsightsCard
              venueInsights={venueInsights}
              loadingInsights={loadingInsights}
              onDismiss={handleDismissInsights}
              onViewFullIntelligence={handleVenuePress}
              onRefreshInsights={() => handleGetVenueInsights(true)}
            />
          )}
        </ScrollView>
      )}

      {/* Floating Header rendered last — absolutely positioned over content */}
      <View
        ref={headerRef}
        collapsable={false}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}
        pointerEvents="box-none"
      >
        <RacesFloatingHeader
          topInset={insets.top}
          loadingInsights={loadingInsights}
          weatherLoading={weatherLoading}
          isOnline={isOnline}
          onAddRace={handleShowAddRaceSheet}
          onAddPractice={handleAddPractice}
          onNewSeason={() => setShowSeasonSettings(true)}
          onBrowseCatalog={() => router.push('/catalog-race')}
          onAddButtonLayout={setAddButtonLayout}
          measureTrigger={tourVisible}
          totalRaces={enrichedRaces?.length || 0}
          upcomingRaces={upcomingRacesCount}
          currentRaceIndex={selectedRaceId ? (enrichedRaces?.findIndex((r: any) => r.id === selectedRaceId) ?? -1) + 1 : undefined}
          onUpcomingPress={handleUpcomingPress}
          onMeasuredHeight={setToolbarHeight}
          hidden={toolbarHidden}
        />
      </View>

      {/* Season Header - separately positioned below the floating header */}
      {!toolbarHidden && toolbarHeight > 0 && (
        <Pressable
          style={{
            position: 'absolute',
            top: toolbarHeight,
            left: 0,
            right: 0,
            zIndex: 99,
            backgroundColor: 'rgba(242, 242, 247, 0.92)',
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: IOS_COLORS.separator,
          }}
          onPress={() => setShowSeasonPicker(true)}
          onLongPress={() => setShowFullArchive(true)}
        >
          <SeasonHeader
            season={displaySeason}
            totalRaces={seasonFilteredRacesCount}
            onSeasonPress={() => setShowSeasonPicker(true)}
            onArchivePress={() => setShowFullArchive(true)}
            showAllRaces={!activeFilterSeasonId}
            compact
          />
        </Pressable>
      )}

      <RaceModalsSection
        // Document Type Picker
        documentTypePickerVisible={documentTypePickerVisible}
        onDismissDocumentTypePicker={handleDismissDocumentTypePicker}
        onDocumentTypeSelect={handleDocumentTypeOptionSelect}
        isUploadingDocument={isUploadingRaceDocument}
        // Calendar Import
        showCalendarImport={showCalendarImport}
        onCalendarImportClose={() => setShowCalendarImport(false)}
        onCalendarImportComplete={() => onRefresh()}
        // Post-Race Interview
        showPostRaceInterview={showPostRaceInterview}
        completedSessionId={completedSessionId}
        completedRaceName={completedRaceName}
        completedRaceId={completedRaceId}
        completedSessionGpsPoints={completedSessionGpsPoints}
        onPostRaceInterviewClose={handleClosePostRaceInterview}
        onPostRaceInterviewComplete={handlePostRaceInterviewCompleteWithRefetch}
        // Strategy Sharing
        showCoachSelectionModal={showCoachSelectionModal}
        sailorId={sailorId}
        sharingRaceEventId={sharingRaceEventId}
        selectedRaceData={selectedRaceData}
        selectedRaceEnrichedWeather={selectedRaceEnrichedWeather}
        onStrategySharingClose={handleCloseStrategySharing}
        // Boat Class Selector
        showBoatClassSelector={showBoatClassSelector}
        selectedRaceId={selectedRaceId}
        onBoatClassSelectorClose={() => setShowBoatClassSelector(false)}
        onBoatClassSelected={handleBoatClassSelected}
      />

      {/* Season Picker Modal - Select which season to filter by */}
      <SeasonPickerModal
        visible={showSeasonPicker}
        selectedSeasonId={activeFilterSeasonId}
        currentSeason={effectiveSeason}
        allSeasons={userSeasons ?? []}
        isLoading={loadingCurrentSeason}
        onClose={() => setShowSeasonPicker(false)}
        onSelectSeason={(seasonId) => {
          logger.info('[RacesScreen] Season filter changed', { seasonId });
          setFilterSeasonId(seasonId);
        }}
        onManageSeasons={() => setShowSeasonSettings(true)}
      />

      {/* Season Settings Modal - Create/Edit/End Season */}
      <SeasonSettingsModal
        visible={showSeasonSettings}
        season={currentSeason ?? null}
        onClose={() => setShowSeasonSettings(false)}
        onSeasonCreated={(seasonId) => {
          logger.info('[RacesScreen] Season created', { seasonId });
          refetchCurrentSeason();
          refetchSeasons();
          // Set the filter to the newly created season
          setFilterSeasonId(seasonId);
        }}
        onSeasonUpdated={(seasonId) => {
          logger.info('[RacesScreen] Season updated', { seasonId });
          refetchCurrentSeason();
          refetchSeasons();
        }}
        onSeasonEnded={(seasonId) => {
          logger.info('[RacesScreen] Season ended', { seasonId });
          refetchCurrentSeason();
          refetchSeasons();
          // Reset filter to undefined (will use next current season)
          setFilterSeasonId(undefined);
        }}
      />

      {/* Full Season Archive Modal - shown from Progress segment */}
      <Modal
        visible={showFullArchive}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFullArchive(false)}
      >
        <SeasonArchive
          seasons={userSeasons ?? []}
          isLoading={false}
          onRefresh={() => refetchSeasons()}
          onSeasonPress={(seasonId) => {
            // Set the filter to view races from the selected season
            setFilterSeasonId(seasonId);
            setShowFullArchive(false);
          }}
          onBackPress={() => setShowFullArchive(false)}
        />
      </Modal>

      {/* Signup Prompt Modal - shown when guest tries to add 2nd race */}
      <SignupPromptModal
        visible={showSignupPrompt}
        onClose={() => setShowSignupPrompt(false)}
        feature="multiple_races"
      />

      {/* Onboarding Tour - shown for first-time users */}
      <OnboardingTour
        visible={tourVisible}
        steps={tourSteps}
        currentStepIndex={tourStepIndex}
        onNext={handleTourNext}
        onDismiss={handleDismissTour}
        stepLayouts={stepLayouts}
      />

      {/* </PlanModeLayout> - temporarily removed */}
    </View>
  );
}
