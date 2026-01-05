import {
    PreRaceStrategySection,
    RaceConditionsCard,
    RacePhaseHeader,
} from '@/components/race-detail';
import type { RaceDocument as RaceDocumentsCardDocument } from '@/components/race-detail/RaceDocumentsCard';
import { AIPatternDetection } from '@/components/races/debrief/AIPatternDetection';
import { PlanModeLayout } from '@/components/races/modes';
import { calculatePerformanceMetrics } from '@/components/races/PerformanceMetrics';
import { OnWaterTrackingView } from '@/components/races/OnWaterTrackingView';
import { PlanModeContent } from '@/components/races/plan';
import { AccordionSection } from '@/components/races/AccordionSection';
import { TacticalCalculations } from '@/components/races/TacticalDataOverlay';
import { QuickAddRaceForm } from '@/components/races/QuickAddRaceForm';
import {
  RegulatoryDigestCard,
  CourseOutlineCard,
  RacesFloatingHeader,
  DemoNotice,
  FleetStrategySection,
  BoatSetupSection,
  PostRaceAnalysisSection,
  DemoRacesCarousel,
  TeamLogisticsSection,
  RaceModalsSection,
  RealRacesCarousel,
  DistanceRaceContentSection,
  FleetRaceContentSection,
  AIVenueInsightsCard,
  type RaceFormData,
} from '@/components/races';
import {
  ADD_RACE_CARD_DISMISSED_KEY,
  type RigPreset,
  type RegulatoryDigestData,
  type RegulatoryAcknowledgements,
} from '@/lib/races';
import {
  normalizeDirection,
  pickNumeric,
  normalizeCurrentType,
  extractWindSnapshot,
  extractCurrentSnapshot,
  parseGpsTrack,
  parseSplitTimes,
  normalizeCourseMarkType,
  type TacticalWindSnapshot,
  type TacticalCurrentSnapshot,
  type GPSPoint,
  type DebriefSplitTime,
} from '@/lib/races';
import { AccessibleTouchTarget } from '@/components/ui/AccessibleTouchTarget';
import { FamilyButton } from '@/components/ui/FamilyButton';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorMessage } from '@/components/ui/error';
import { DashboardSkeleton } from '@/components/ui/loading';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { MOCK_RACES, calculateCountdown } from '@/constants/mockData';
import { useRaceBriefSync } from '@/hooks/ai/useRaceBriefSync';
import { useDashboardData } from '@/hooks/useData';
import { useEnrichedRaces } from '@/hooks/useEnrichedRaces';
import { useOffline } from '@/hooks/useOffline';
import { useRaceDocuments } from '@/hooks/useRaceDocuments';
import { useRacePhaseDetection } from '@/hooks/useRacePhaseDetection';
import { useRacePreparation } from '@/hooks/useRacePreparation';
import { useLiveRaces, useUserRaceResults, withdrawFromRace } from '@/hooks/useRaceResults';
import { useRaceSelection } from '@/hooks/useRaceSelection';
import { useRaceTuningRecommendation } from '@/hooks/useRaceTuningRecommendation';
import { useRaceWeather } from '@/hooks/useRaceWeather';
import { useVenueDetection } from '@/hooks/useVenueDetection';
import { useRacePreparationData } from '@/hooks/useRacePreparationData';
import { useRaceMarks } from '@/hooks/useRaceMarks';
import { useVenueCoordinates } from '@/hooks/useVenueCoordinates';
import { useVenueInsights } from '@/hooks/useVenueInsights';
import { useTacticalSnapshots } from '@/hooks/useTacticalSnapshots';
import { usePostRaceInterview } from '@/hooks/usePostRaceInterview';
import { useSailorProfile } from '@/hooks/useSailorProfile';
import { useStrategySharing } from '@/hooks/useStrategySharing';
import { createLogger } from '@/lib/utils/logger';
import { useAuth } from '@/providers/AuthProvider';
import type { RaceDocumentType, RaceDocumentWithDetails } from '@/services/RaceDocumentService';
import { raceDocumentService } from '@/services/RaceDocumentService';
import { RaceEventService } from '@/services/RaceEventService';
import { documentStorageService } from '@/services/storage/DocumentStorageService';
import { supabase } from '@/services/supabase';
import { TacticalZoneGenerator } from '@/services/TacticalZoneGenerator';
import type { Course } from '@/stores/raceConditionsStore';
import { useRaceConditions } from '@/stores/raceConditionsStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
    Bell,
    Calendar,
    ChevronLeft,
    Compass,
    FileText,
    Lightbulb,
    Plus,
    Settings,
    X
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, Platform, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const logger = createLogger('RacesScreen');

// Destructure tactical calculations for easy access
const { calculateDistance, calculateBearing } = TacticalCalculations;

// Types imported from @/lib/races:
// - RigPreset, RegulatoryDigestData, RegulatoryAcknowledgements
// - TacticalWindSnapshot, TacticalCurrentSnapshot, GPSPoint, DebriefSplitTime
// Constants imported from @/lib/races:
// - DOCUMENT_TYPE_OPTIONS, ADD_RACE_CARD_DISMISSED_KEY
// Utilities imported from @/lib/races:
// - normalizeDirection, pickNumeric, normalizeCurrentType
// - extractWindSnapshot, extractCurrentSnapshot, parseGpsTrack, parseSplitTimes

interface ActiveRaceSummary {
  id: string;
  name: string;
  series?: string;
  venue?: string;
  startTime?: string;
  warningSignal?: string;
  cleanRegatta?: boolean;
  lastUpdated?: string | null;
}

interface RaceBriefData extends ActiveRaceSummary {
  countdown?: {
    days: number;
    hours: number;
    minutes: number;
  };
  weatherSummary?: string;
  tideSummary?: string;
}

// CourseOutlineGroup type moved to useRacePreparationData hook

// normalizeDocumentType: local helper for RaceDocumentsCard type conversion
const normalizeDocumentType = (
  type: RaceDocumentWithDetails['documentType']
): RaceDocumentsCardDocument['type'] => {
  switch (type) {
    case 'sailing_instructions':
    case 'nor':
    case 'course_diagram':
    case 'amendment':
    case 'notam':
      return type;
    default:
      return 'other';
  }
};

// Utility functions imported from @/lib/races:
// - pickNumeric, normalizeCurrentType, extractWindSnapshot
// - extractCurrentSnapshot, parseGpsTrack, parseSplitTimes

// Mock GPS track data for DEBRIEF mode testing
const MOCK_GPS_TRACK = Array.from({ length: 100 }, (_, i) => {
  const t = i / 100;
  const baseTime = new Date('2024-06-15T14:00:00Z');

  return {
    latitude: 37.8 + Math.sin(t * Math.PI * 4) * 0.01 + t * 0.02,
    longitude: -122.4 + Math.cos(t * Math.PI * 4) * 0.01 + t * 0.015,
    timestamp: new Date(baseTime.getTime() + i * 30000), // 30 seconds apart
    speed: 5 + Math.random() * 3 + Math.sin(t * Math.PI * 2) * 2,
    heading: (t * 360) % 360,
    accuracy: 5 + Math.random() * 3,
  };
});

// Mock split times data for DEBRIEF mode testing
const MOCK_SPLIT_TIMES = [
  {
    markId: 'start',
    markName: 'Start Line',
    time: new Date('2024-06-15T14:00:00Z'),
    position: 8,
    roundingType: 'port' as const,
    roundingTime: 0,
  },
  {
    markId: 'mark1',
    markName: 'Windward Mark',
    time: new Date('2024-06-15T14:12:30Z'),
    position: 5,
    roundingType: 'port' as const,
    roundingTime: 4.2,
  },
  {
    markId: 'mark2',
    markName: 'Leeward Gate',
    time: new Date('2024-06-15T14:22:15Z'),
    position: 4,
    roundingType: 'starboard' as const,
    roundingTime: 6.8,
  },
  {
    markId: 'mark3',
    markName: 'Windward Mark',
    time: new Date('2024-06-15T14:34:45Z'),
    position: 3,
    roundingType: 'port' as const,
    roundingTime: 3.9,
  },
  {
    markId: 'finish',
    markName: 'Finish Line',
    time: new Date('2024-06-15T14:45:00Z'),
    position: 3,
    roundingType: 'port' as const,
    roundingTime: 0,
  },
];

/**
 * Detect race type based on name patterns, explicit type, or distance
 * Distance races have different strategic considerations than fleet races
 */
function detectRaceType(
  raceName: string | undefined,
  explicitType: 'fleet' | 'distance' | undefined,
  totalDistanceNm: number | undefined
): 'fleet' | 'distance' {
  // 1. Explicit type takes priority
  if (explicitType) {
    return explicitType;
  }

  // 2. Check distance threshold
  if (totalDistanceNm && totalDistanceNm > 10) {
    return 'distance';
  }

  // 3. Smart name detection for distance races
  if (raceName) {
    const lowerName = raceName.toLowerCase();
    const distanceKeywords = [
      'around',
      'island race',
      'offshore',
      'ocean race',
      'ocean racing',
      'coastal',
      'passage',
      'distance race',
      'long distance',
      'overnight',
      'multi-day',
      'transat',
      'transpac',
      'fastnet',
      'rolex',
      'sydney hobart',
      'bermuda',
      'nm race',
      'mile race',
    ];

    // Check for distance keywords
    for (const keyword of distanceKeywords) {
      if (lowerName.includes(keyword)) {
        return 'distance';
      }
    }

    // Check for distance patterns like "25nm", "50 mile", "100 nautical"
    if (/\d+\s*(nm|nautical|mile)/i.test(raceName)) {
      return 'distance';
    }
  }

  // Default to fleet racing
  return 'fleet';
}

export default function RacesScreen() {
  const auth = useAuth();
  const { user, userProfile, signedIn, ready, isDemoSession, userType } = auth;

  // Safe area insets for proper header spacing
  const insets = useSafeAreaInsets();

  // State for dismissing the demo notice
  const [demoNoticeDismissed, setDemoNoticeDismissed] = useState(false);

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

  // Add race sheet state (Tufte-style: bottom sheet instead of inline button)
  const [showAddRaceSheet, setShowAddRaceSheet] = useState(false);
  const [isAddingRace, setIsAddingRace] = useState(false);
  // FamilyButton inline form expanded state (lifted here to survive child remounts)
  const [familyButtonExpanded, setFamilyButtonExpanded] = useState(false);

  // Post-race interview state is now provided by usePostRaceInterview hook below

  // Selected race detail state
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const hasActiveRace = selectedRaceId !== null;
  const [selectedRaceData, setSelectedRaceData] = useState<any>(null);
  const [selectedRaceMarks, setSelectedRaceMarks] = useState<any[]>([]);
  const [loadingRaceDetail, setLoadingRaceDetail] = useState(false);
  const [raceDocuments, setRaceDocuments] = useState<RaceDocumentWithDetails[]>([]);
  const [loadingRaceDocuments, setLoadingRaceDocuments] = useState(false);
  const [raceDocumentsError, setRaceDocumentsError] = useState<string | null>(null);
  const [raceDocumentsReloadKey, setRaceDocumentsReloadKey] = useState(0);
  const [isUploadingRaceDocument, setIsUploadingRaceDocument] = useState(false);
  const [documentTypePickerVisible, setDocumentTypePickerVisible] = useState(false);
  const documentTypeResolverRef = useRef<((type: RaceDocumentType | null) => void) | null>(null);
  const [selectedDemoRaceId, setSelectedDemoRaceId] = useState<string | null>(MOCK_RACES[0]?.id ?? null);
  const [deletingRaceId, setDeletingRaceId] = useState<string | null>(null);
  const isDeletingRace = deletingRaceId !== null;
  const [raceDetailReloadKey, setRaceDetailReloadKey] = useState(0);
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

  // Clear any stuck loading states on mount

  useEffect(() => {
    resetRaceConditions();
    setTacticalZones([]);
  }, [selectedRaceId]);

  useEffect(() => {
    return () => {
      if (documentTypeResolverRef.current) {
        documentTypeResolverRef.current(null);
        documentTypeResolverRef.current = null;
      }
    };
  }, []);

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
    raceEventId: selectedRaceData?.id || null,
    autoSave: true,
    debounceMs: 1000,
  });

  // Real-time race updates - moved early to avoid hoisting issues with callbacks
  const { liveRaces, loading: liveRacesLoading, refresh: refetchRaces } = useLiveRaces(user?.id);

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

  const handleAddRaceNavigation = useCallback(() => {
    router.push('/(tabs)/race/add');
  }, [router]);

  // Handler for quick add race form (Tufte-style bottom sheet)
  const handleQuickAddRaceSubmit = useCallback(async (data: { name: string; dateTime: string }) => {
    setIsAddingRace(true);
    try {
      const { data: newRace, error } = await RaceEventService.createRaceEvent({
        race_name: data.name,
        start_time: data.dateTime,
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to create race');
        return;
      }

      // Success - close sheet and refresh
      setShowAddRaceSheet(false);
      refetchRaces?.();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create race');
    } finally {
      setIsAddingRace(false);
    }
  }, [refetchRaces]);

  // Handler for new AddRaceDialog form with race type support
  const handleAddRaceDialogSave = useCallback(async (formData: RaceFormData) => {
    setIsAddingRace(true);
    try {
      // Build start_time from date and time
      const startTime = `${formData.date}T${formData.time}:00`;

      // Prepare type-specific data
      const createParams: Parameters<typeof RaceEventService.createRaceEvent>[0] = {
        race_name: formData.name,
        start_time: startTime,
        race_type: formData.raceType,
        location: formData.location,
        vhf_channel: formData.vhfChannel,
        notes: formData.notes,
      };

      // Add type-specific fields
      if (formData.raceType === 'fleet' && formData.fleet) {
        createParams.course_type = formData.fleet.courseType;
        createParams.number_of_laps = formData.fleet.numberOfLaps ? parseInt(formData.fleet.numberOfLaps) : undefined;
        createParams.expected_fleet_size = formData.fleet.expectedFleetSize ? parseInt(formData.fleet.expectedFleetSize) : undefined;
        createParams.boat_class = formData.fleet.boatClass;
      } else if (formData.raceType === 'distance' && formData.distance) {
        createParams.total_distance_nm = formData.distance.totalDistanceNm ? parseFloat(formData.distance.totalDistanceNm) : undefined;
        createParams.time_limit_hours = formData.distance.timeLimitHours ? parseFloat(formData.distance.timeLimitHours) : undefined;
        createParams.start_finish_same_location = formData.distance.startFinishSameLocation;
        createParams.route_description = formData.distance.routeDescription;
      } else if (formData.raceType === 'match' && formData.match) {
        createParams.opponent_name = formData.match.opponentName;
        createParams.match_round = formData.match.matchRound ? parseInt(formData.match.matchRound) : undefined;
        createParams.total_rounds = formData.match.totalRounds ? parseInt(formData.match.totalRounds) : undefined;
        createParams.series_format = formData.match.seriesFormat;
        createParams.has_umpire = formData.match.hasUmpire;
      } else if (formData.raceType === 'team' && formData.team) {
        createParams.your_team_name = formData.team.yourTeamName;
        createParams.opponent_team_name = formData.team.opponentTeamName;
        createParams.heat_number = formData.team.heatNumber ? parseInt(formData.team.heatNumber) : undefined;
        createParams.team_size = formData.team.teamSize ? parseInt(formData.team.teamSize) : undefined;
        // Parse team members from string format
        if (formData.team.teamMembers) {
          const members = formData.team.teamMembers.split(',').map(m => {
            const parts = m.trim().match(/^(.+?)(?:\s*#(\d+))?$/);
            return {
              name: parts?.[1]?.trim() || m.trim(),
              sailNumber: parts?.[2] || '',
            };
          });
          createParams.team_members = members;
        }
      }

      const { data: newRace, error } = await RaceEventService.createRaceEvent(createParams);

      if (error) {
        Alert.alert('Error', error.message || 'Failed to create race');
        return;
      }

      // Success - close dialog and refresh
      setShowAddRaceSheet(false);
      refetchRaces?.();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create race');
    } finally {
      setIsAddingRace(false);
    }
  }, [refetchRaces]);

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
  const [drawingRacingArea, setDrawingRacingArea] = useState<Array<{lat: number, lng: number}>>([]);

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
      if (userType === 'coach') {
        logger.debug('Coach user on races page, redirecting to clients');
        router.replace('/(tabs)/clients');
        return;
      }

      if (isDemoSession) {
        logger.debug('Demo session detected, skipping Supabase onboarding checks');
        return;
      }

      // Redirect to login if not authenticated
      // BUT: Skip redirect if auth is not ready yet (prevents race condition during sign-out)
      if (!signedIn && ready) {
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
  }, [ready, signedIn, user?.id, router, isDemoSession, userType]);

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
      if (selectedRaceId) {
        logger.debug('Screen focused - refreshing selected race detail');
        triggerRaceDetailReload();
      }
    }, [refetch, selectedRaceId, triggerRaceDetailReload])
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

  // Get past race IDs for fetching results
  const pastRaceIds = useMemo(() => {
    const now = new Date();
    return (liveRaces || [])
      .filter((race: any) => {
        const raceDate = new Date(race.start_date || race.date);
        return raceDate < now;
      })
      .map((race: any) => race.id)
      .filter(Boolean);
  }, [liveRaces]);

  // Fetch user results for past races
  const { results: userRaceResults } = useUserRaceResults(user?.id, pastRaceIds);
  const normalizedLiveRaces = useMemo(
    () => {
      if (!liveRaces || liveRaces.length === 0) {
        return [];
      }

      return liveRaces.map((regatta: any) => {
        const metadata = regatta?.metadata ?? {};
        const derivedStartTime =
          regatta?.startTime ??
          regatta?.warning_signal_time ??
          (regatta?.start_date
            ? new Date(regatta.start_date).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : undefined);

        return {
          ...regatta,
          venue: regatta?.venue ?? metadata?.venue_name ?? 'Venue TBD',
          date: regatta?.date ?? regatta?.start_date,
          startTime: derivedStartTime,
          wind: regatta?.wind ?? metadata?.wind,
          tide: regatta?.tide ?? metadata?.tide,
          weatherStatus: regatta?.weatherStatus ?? metadata?.weatherStatus,
          weatherError: regatta?.weatherError ?? metadata?.weatherError,
          strategy: regatta?.strategy ?? metadata?.strategy,
          critical_details: regatta?.critical_details ?? metadata?.critical_details,
        };
      });
    },
    [liveRaces]
  );

  // Real-time weather for next race
  const { weather: raceWeather, loading: weatherLoading, error: weatherError } = useRaceWeather(
    currentVenue,
    nextRace?.date
  );

  // AI Venue Analysis state/handlers now provided by useVenueInsights hook above

  // Memoize safeRecentRaces to prevent unnecessary re-renders and effect triggers
  // Use enriched races with real weather data when available, fall back to recentRaces
  const safeRecentRaces: any[] = useMemo(() => {
    if (enrichedRaces && enrichedRaces.length > 0) {
      return enrichedRaces;
    }
    if (normalizedLiveRaces.length > 0) {
      return normalizedLiveRaces;
    }
    return Array.isArray(recentRaces as any[]) ? (recentRaces as any[]) : [];
  }, [enrichedRaces, normalizedLiveRaces, recentRaces]);

  // Calculate nextRace from safeRecentRaces (not from useDashboardData which may have stale/demo data)
  // This ensures nextRace comes from the same data source as the displayed race cards
  const safeNextRace: any = useMemo(() => {
    if (safeRecentRaces.length === 0) return {};
    
    const now = new Date();
    const nextRaceIndex = safeRecentRaces.findIndex((race: any) => {
      const raceDateTime = new Date(race.date || race.start_date);
      // Race is "upcoming" if estimated end time (start + 3 hours) is still in the future
      const raceEndEstimate = new Date(raceDateTime.getTime() + 3 * 60 * 60 * 1000);
      return raceEndEstimate > now;
    });
    
    return nextRaceIndex >= 0 ? safeRecentRaces[nextRaceIndex] : {};
  }, [safeRecentRaces]);

  const recentRace = safeRecentRaces.length > 0 ? safeRecentRaces[0] : null;
  const hasRealRaces = safeRecentRaces.length > 0 || !!safeNextRace?.id;

  // Calculate next race preview text for header
  const nextRacePreview = useMemo(() => {
    if (!safeNextRace?.date) return null;
    const daysUntil = Math.ceil((new Date(safeNextRace.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil > 0 && daysUntil <= 7) return `in ${daysUntil} days`;
    return null;
  }, [safeNextRace?.date]);

  // Total race count (real or demo) for header
  const displayRaceCount = hasRealRaces ? safeRecentRaces.length : MOCK_RACES.length;

  const selectedDemoRace = useMemo(
    () => selectedDemoRaceId ? MOCK_RACES.find(race => race.id === selectedDemoRaceId) ?? null : null,
    [selectedDemoRaceId]
  );

  const activeRace = useMemo<ActiveRaceSummary | null>(() => {
    if (selectedRaceData) {
      const metadata = selectedRaceData.metadata || {};
      const startTime = selectedRaceData.start_date || selectedRaceData.date || metadata?.start_time;
      return {
        id: selectedRaceData.id,
        name: selectedRaceData.name || metadata?.race_name || 'Upcoming Race',
        series: metadata?.series_name || metadata?.series || metadata?.event_name || 'Corinthian Series',
        venue: metadata?.venue_name || selectedRaceData.venue_name || currentVenue?.name || 'Port Shelter',
        startTime: typeof startTime === 'string' ? startTime : startTime ? new Date(startTime).toISOString() : undefined,
        warningSignal: metadata?.warning_signal || metadata?.first_warning || metadata?.signal_time || nextRace?.startTime || '13:36',
        cleanRegatta: metadata?.clean_regatta !== false,
        lastUpdated: metadata?.updated_at || selectedRaceData.updated_at || null,
      };
    }

    if (nextRace) {
      const nextRaceAny = nextRace as any;
      return {
        id: nextRaceAny.id || 'next-race',
        name: nextRaceAny.name || nextRaceAny.title || 'Upcoming Race',
        series: nextRaceAny.series || nextRaceAny.event || 'Corinthian Series',
        venue: nextRaceAny.venue || currentVenue?.name || 'Port Shelter',
        startTime: nextRaceAny.date || nextRaceAny.startTime,
        warningSignal: nextRaceAny.warningSignal || nextRaceAny.startTime || '13:36',
        cleanRegatta: nextRaceAny.cleanRegatta ?? true,
        lastUpdated: nextRaceAny.updated_at || null,
      };
    }

    if (selectedDemoRace) {
      return {
        id: selectedDemoRace.id,
        name: selectedDemoRace.name,
        series: 'Demo Series',
        venue: selectedDemoRace.venue,
        startTime: selectedDemoRace.date,
        warningSignal: selectedDemoRace.critical_details?.warning_signal || selectedDemoRace.startTime,
        cleanRegatta: true,
        lastUpdated: null,
      };
    }

    return null;
  }, [
    // Only depend on specific fields used in calculation, not entire objects
    selectedRaceData?.id,
    selectedRaceData?.name,
    selectedRaceData?.start_date,
    selectedRaceData?.date,
    selectedRaceData?.venue_name,
    selectedRaceData?.updated_at,
    // Extract only specific metadata fields to prevent unnecessary re-renders
    selectedRaceData?.metadata?.race_name,
    selectedRaceData?.metadata?.series_name,
    selectedRaceData?.metadata?.series,
    selectedRaceData?.metadata?.event_name,
    selectedRaceData?.metadata?.venue_name,
    selectedRaceData?.metadata?.warning_signal,
    selectedRaceData?.metadata?.first_warning,
    selectedRaceData?.metadata?.signal_time,
    selectedRaceData?.metadata?.clean_regatta,
    selectedRaceData?.metadata?.updated_at,
    selectedRaceData?.metadata?.start_time,
    // Next race fallbacks
    nextRace?.id,
    nextRace?.name,
    nextRace?.title,
    nextRace?.series,
    nextRace?.event,
    nextRace?.venue,
    nextRace?.date,
    nextRace?.startTime,
    nextRace?.warningSignal,
    nextRace?.cleanRegatta,
    nextRace?.updated_at,
    // Demo race fallbacks
    selectedDemoRace?.id,
    selectedDemoRace?.name,
    selectedDemoRace?.venue,
    selectedDemoRace?.date,
    selectedDemoRace?.startTime,
    selectedDemoRace?.critical_details?.warning_signal,
    currentVenue?.name
  ]);

  // Stabilize countdown - only update every minute to prevent constant re-renders
  const [currentMinute, setCurrentMinute] = useState(() => Math.floor(Date.now() / 60000));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMinute(Math.floor(Date.now() / 60000));
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const lastRaceBriefRef = useRef<RaceBriefData | null>(null);
  const lastRaceBriefKeyRef = useRef<string | null>(null);

  const raceBrief = useMemo<RaceBriefData | null>(() => {
    if (!activeRace) {
      return null;
    }

    const startISO = activeRace.startTime;
    const countdown = startISO ? calculateCountdown(startISO) : undefined;

    const weatherSummary = (() => {
      if (raceWeather?.wind) {
        const min = raceWeather.wind.speedMin ?? raceWeather.wind.speed ?? 0;
        const max = raceWeather.wind.speedMax ?? raceWeather.wind.speed ?? min;
        const direction = raceWeather.wind.direction ?? raceWeather.wind.directionCardinal;
        if (min && max) {
          return `${direction ?? ''} ${Math.round(min)}-${Math.round(max)} kt`.trim();
        }
        if (direction) {
          return `${direction}`;
        }
      }

      const metadata = (selectedRaceData?.metadata || nextRace as any || {}) as Record<string, any>;
      if (metadata?.wind_summary) {
        return metadata.wind_summary;
      }
      if (metadata?.wind_direction && metadata?.wind_speed) {
        return `${metadata.wind_direction} ${metadata.wind_speed}`;
      }

      if (selectedDemoRace) {
        return `${selectedDemoRace.wind.direction} ${selectedDemoRace.wind.speedMin}-${selectedDemoRace.wind.speedMax} kt`;
      }

      return undefined;
    })();

    const tideSummary = (() => {
      if (raceWeather?.tide) {
        const state = raceWeather.tide.state || raceWeather.tide.phase;
        const height = raceWeather.tide.height;
        if (state || height) {
          return `${state ? state.replace(/_/g, ' ') : ''}${height ? ` • ${height.toFixed(1)} m` : ''}`.trim();
        }
      }
      const metadata = (selectedRaceData?.metadata || {}) as Record<string, any>;
      if (metadata?.tide_summary) {
        return metadata.tide_summary;
      }
      if (selectedDemoRace) {
        return `${selectedDemoRace.tide.state} • ${selectedDemoRace.tide.height} m`;
      }
      return undefined;
    })();

    const nextBrief: RaceBriefData = {
      ...activeRace,
      countdown,
      weatherSummary,
      tideSummary,
    };

    const briefKey = JSON.stringify(nextBrief);
    if (lastRaceBriefKeyRef.current === briefKey && lastRaceBriefRef.current) {
      return lastRaceBriefRef.current;
    }

    lastRaceBriefKeyRef.current = briefKey;
    lastRaceBriefRef.current = nextBrief;
    return nextBrief;
  }, [
    // Depend on specific activeRace fields, not the whole object
    activeRace?.id,
    activeRace?.name,
    activeRace?.series,
    activeRace?.venue,
    activeRace?.startTime,
    activeRace?.warningSignal,
    activeRace?.cleanRegatta,
    activeRace?.lastUpdated,
    currentMinute,
    // Only depend on specific weather values, not the entire object
    raceWeather?.wind?.direction,
    raceWeather?.wind?.speedMin,
    raceWeather?.wind?.speedMax,
    raceWeather?.wind?.directionCardinal,
    raceWeather?.wind?.speed,
    raceWeather?.tide?.state,
    raceWeather?.tide?.height,
    raceWeather?.tide?.phase,
    // Only specific metadata fields used in weatherSummary and tideSummary
    selectedRaceData?.metadata?.wind_summary,
    selectedRaceData?.metadata?.wind_direction,
    selectedRaceData?.metadata?.wind_speed,
    selectedRaceData?.metadata?.tide_summary,
    // Demo race fallbacks
    selectedDemoRace?.wind?.direction,
    selectedDemoRace?.wind?.speedMin,
    selectedDemoRace?.wind?.speedMax,
    selectedDemoRace?.tide?.state,
    selectedDemoRace?.tide?.height,
    // Next race fallbacks
    nextRace?.wind_summary,
    nextRace?.wind_direction,
    nextRace?.wind_speed,
    nextRace?.tide_summary
  ]);

  // Sync race brief data to preparation service for AI context
  useEffect(() => {
    if (raceBrief && selectedRaceData?.id) {
      updateRaceBrief(raceBrief);
    }
  }, [raceBrief, selectedRaceData?.id]);

  // Use race brief sync for AI chat integration
  const { getAIContext, isStale: isRaceBriefStale, refreshContext } = useRaceBriefSync({
    raceEventId: selectedRaceData?.id || null,
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
        const { data: raceEvents, error: raceEventsError } = await supabase
          .from('race_events')
          .select('id')
          .eq('regatta_id', raceId);

        if (raceEventsError) {
          throw raceEventsError;
        }

        const eventIds = (raceEvents || []).map((event: { id: string }) => event.id);

        if (eventIds.length > 0) {
          const { error: deleteEventsError } = await supabase
            .from('race_events')
            .delete()
            .in('id', eventIds);

          if (deleteEventsError) {
            throw deleteEventsError;
          }
        }

        const { error: deleteRegattaError } = await supabase
          .from('regattas')
          .delete()
          .eq('id', raceId);

        if (deleteRegattaError) {
          throw deleteRegattaError;
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
  const handleRacingAreaChange = useCallback((polygon: Array<{lat: number, lng: number}>) => {
    setDrawingRacingArea(polygon);
  }, []);

  // Handle saving racing area to database
  const handleSaveRacingArea = useCallback(async (polygonPoints?: Array<{lat: number, lng: number}>) => {
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

      // First check if this race is in our local safeRecentRaces (might be fallback data)
      const localRace = safeRecentRaces.find((r: any) => r.id === selectedRaceId);
      if (localRace && !localRace.id?.includes('-')) {
        // If we have local race data and it's likely a fallback race (not a UUID)
        logger.debug('[races.tsx] 📦 Using local race data (fallback):', localRace.name);
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
          logger.warn('[races.tsx] ⚠️ Database fetch failed, checking local data');
          // If database fetch fails, try to use local race data as fallback
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
          const { data: marksData, error: marksError} = await supabase
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

  useEffect(() => {
    let isActive = true;

    if (!selectedRaceData?.id || isDemoSession) {
      setRaceDocuments([]);
      setRaceDocumentsError(null);
      setLoadingRaceDocuments(false);
      return () => {
        isActive = false;
      };
    }

    const loadRaceDocuments = async () => {
      setLoadingRaceDocuments(true);
      setRaceDocumentsError(null);

      try {
        const documents = await raceDocumentService.getRaceDocuments(selectedRaceData.id);
        if (!isActive) {
          return;
        }
        setRaceDocuments(documents);
      } catch (error) {
        if (!isActive) {
          return;
        }
        logger.warn('[races.tsx] Unable to load race documents', {
          error,
          raceId: selectedRaceData.id,
        });
        setRaceDocuments([]);
        setRaceDocumentsError('Unable to load race documents');
      } finally {
        if (isActive) {
          setLoadingRaceDocuments(false);
        }
      }
    };

    loadRaceDocuments();

    return () => {
      isActive = false;
    };
  }, [selectedRaceData?.id, raceDetailReloadKey, raceDocumentsReloadKey, isDemoSession]);

  const handleRefreshRaceDocuments = useCallback(() => {
    setRaceDocumentsReloadKey((prev) => prev + 1);
  }, []);

  const requestDocumentTypeSelection = useCallback(() => {
    return new Promise<RaceDocumentType | null>((resolve) => {
      documentTypeResolverRef.current = resolve;
      setDocumentTypePickerVisible(true);
    });
  }, []);

  const handleDocumentTypeOptionSelect = useCallback((type: RaceDocumentType) => {
    documentTypeResolverRef.current?.(type);
    documentTypeResolverRef.current = null;
    setDocumentTypePickerVisible(false);
  }, []);

  const handleDismissDocumentTypePicker = useCallback(() => {
    documentTypeResolverRef.current?.(null);
    documentTypeResolverRef.current = null;
    setDocumentTypePickerVisible(false);
  }, []);

  const handleUploadRaceDocument = useCallback(async () => {
    if (isUploadingRaceDocument) {
      return;
    }

    if (isDemoSession) {
      Alert.alert('Unavailable in demo mode', 'Sign in to upload race documents.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to upload documents.');
      return;
    }

    if (!selectedRaceData?.id) {
      Alert.alert('Select a race', 'Choose a race to attach documents to.');
      return;
    }

    const documentType = await requestDocumentTypeSelection();
    if (!documentType) {
      logger.debug('[races.tsx] Document upload cancelled before selecting type');
      return;
    }

    setIsUploadingRaceDocument(true);
    try {
      const uploadResult = await documentStorageService.pickAndUploadDocument(user.id);

      if (!uploadResult.success || !uploadResult.document) {
        const errorMessage = uploadResult.error || 'Unable to upload document. Please try again.';
        const isUserCancel = errorMessage.toLowerCase().includes('cancel');

        if (isUserCancel) {
          logger.debug('[races.tsx] Document picker cancelled by user');
        } else {
          Alert.alert('Upload failed', errorMessage);
        }
        return;
      }

      const linked = await raceDocumentService.linkDocumentToRace({
        regattaId: selectedRaceData.id,
        documentId: uploadResult.document.id,
        userId: user.id,
        documentType,
      });

      if (!linked) {
        Alert.alert('Upload failed', 'We uploaded the file but could not attach it to this race.');
        return;
      }

      Alert.alert('Document uploaded', 'Your document is now attached to this race.');
      handleRefreshRaceDocuments();
    } catch (error) {
      logger.error('[races.tsx] Document upload failed', error);
      Alert.alert('Upload failed', 'We could not upload that document. Please try again.');
    } finally {
      setIsUploadingRaceDocument(false);
    }
  }, [
    handleRefreshRaceDocuments,
    isDemoSession,
    isUploadingRaceDocument,
    logger,
    requestDocumentTypeSelection,
    selectedRaceData?.id,
    user?.id,
  ]);

const selectedRaceClassId = useMemo(() => {
  if (!selectedRaceData) return null;
  const classId = (
    selectedRaceData.class_id ||
    selectedRaceData.classId ||
    selectedRaceData.metadata?.class_id ||
    selectedRaceData.metadata?.classId ||
    null
  );
  logger.debug('[races.tsx] Computed selectedRaceClassId', { classId, hasRaceData: !!selectedRaceData });
  return classId;
}, [selectedRaceData]);

const selectedRaceClassName = useMemo(() => {
  if (!selectedRaceData) return undefined;
  const className = (
    selectedRaceData.metadata?.class_name ||
    selectedRaceData.class_divisions?.[0]?.name ||
    undefined
  );
  logger.debug('[races.tsx] Computed selectedRaceClassName', { className });
  return className;
}, [selectedRaceData]);

const raceDocumentsForDisplay = useMemo<RaceDocumentsCardDocument[]>(() => {
  if (!raceDocuments.length) {
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

  const venueCenter = useMemo(() => {
    const metadata = (selectedRaceData?.metadata || {}) as Record<string, any>;

    const lat = pickNumeric([
      metadata.venue_lat,
      metadata.latitude,
      metadata.venue?.lat,
      metadata.start_line?.center_lat,
      metadata.center_lat,
    ]);
    const lng = pickNumeric([
      metadata.venue_lng,
      metadata.longitude,
      metadata.venue?.lng,
      metadata.start_line?.center_lng,
      metadata.center_lng,
    ]);

    if (lat !== null && lng !== null) {
      return { latitude: lat, longitude: lng };
    }

    const markWithCoords = selectedRaceMarks.find((mark) => {
      const markLat = mark.latitude ?? mark.coordinates?.lat ?? mark.position?.lat;
      const markLng = mark.longitude ?? mark.coordinates?.lng ?? mark.position?.lng;
      return typeof markLat === 'number' && typeof markLng === 'number';
    });

    if (markWithCoords) {
      const markLat = markWithCoords.latitude ?? markWithCoords.coordinates?.lat ?? markWithCoords.position?.lat;
      const markLng = markWithCoords.longitude ?? markWithCoords.coordinates?.lng ?? markWithCoords.position?.lng;
      if (typeof markLat === 'number' && typeof markLng === 'number') {
        return { latitude: markLat, longitude: markLng };
      }
    }

    return null;
  }, [selectedRaceData, selectedRaceMarks]);

  const raceCourseForConsole = useMemo(() => {
    if (!selectedRaceData && (!selectedRaceMarks || selectedRaceMarks.length === 0)) {
      return null;
    }

    const metadata = (selectedRaceData?.metadata || {}) as Record<string, any>;

    const marks = (selectedRaceMarks || [])
      .map((mark, index) => {
        const lat = mark.latitude ?? mark.coordinates?.lat ?? mark.position?.lat;
        const lng = mark.longitude ?? mark.coordinates?.lng ?? mark.position?.lng;

        if (typeof lat !== 'number' || typeof lng !== 'number') {
          return null;
        }

        const rawType = (mark.mark_type || mark.type || mark.markType || '') as string;
        const lowerType = rawType.toLowerCase();
        const lowerName = (mark.mark_name || mark.name || '').toLowerCase();

        let normalizedType: 'start-pin' | 'start-boat' | 'windward' | 'leeward' | 'offset' | 'finish' = 'windward';

        if (lowerType.includes('start') && (lowerType.includes('pin') || lowerName.includes('pin'))) {
          normalizedType = 'start-pin';
        } else if (
          lowerType.includes('start') &&
          (lowerType.includes('boat') || lowerType.includes('committee') || lowerName.includes('committee'))
        ) {
          normalizedType = 'start-boat';
        } else if (lowerType.includes('leeward') || lowerType.includes('gate')) {
          normalizedType = 'leeward';
        } else if (lowerType.includes('offset')) {
          normalizedType = 'offset';
        } else if (lowerType.includes('finish')) {
          normalizedType = 'finish';
        } else if (lowerType.includes('windward') || lowerName.includes('weather')) {
          normalizedType = 'windward';
        }

        const rounding = (mark.rounding || mark.rounding_type || mark.roundingType) as 'port' | 'starboard' | undefined;

        return {
          id: mark.id ?? `mark-${index}`,
          name: mark.mark_name || mark.name || `Mark ${index + 1}`,
          position: { lat, lng },
          type: normalizedType,
          rounding,
        };
      })
      .filter(Boolean) as Array<{
        id: string;
        name: string;
        position: { lat: number; lng: number };
        type: 'start-pin' | 'start-boat' | 'windward' | 'leeward' | 'offset' | 'finish';
        rounding?: 'port' | 'starboard';
      }>;

    if (marks.length === 0) {
      return null;
    }

    let startLine: Course['startLine'] | undefined;
    const startLineMeta = (metadata.start_line || metadata.startLine) as Record<string, any> | undefined;

    const resolveCoordinate = (value: unknown) => {
      const candidate = value as any;
      return pickNumeric([
        candidate,
        candidate?.lat,
        candidate?.lng,
        candidate?.latitude,
        candidate?.longitude,
      ]);
    };

    if (startLineMeta && typeof startLineMeta === 'object') {
      const portLat = resolveCoordinate(startLineMeta.port_lat ?? startLineMeta.port?.lat ?? startLineMeta.port?.latitude);
      const portLng = resolveCoordinate(startLineMeta.port_lng ?? startLineMeta.port?.lng ?? startLineMeta.port?.longitude);
      const starboardLat = resolveCoordinate(
        startLineMeta.starboard_lat ?? startLineMeta.starboard?.lat ?? startLineMeta.starboard?.latitude
      );
      const starboardLng = resolveCoordinate(
        startLineMeta.starboard_lng ?? startLineMeta.starboard?.lng ?? startLineMeta.starboard?.longitude
      );

      if (
        portLat !== null &&
        portLng !== null &&
        starboardLat !== null &&
        starboardLng !== null
      ) {
        const heading = TacticalCalculations.calculateBearing(
          portLat,
          portLng,
          starboardLat,
          starboardLng
        );
        const lengthMeters = TacticalCalculations.calculateDistance(
          portLat,
          portLng,
          starboardLat,
          starboardLng
        );
        startLine = {
          port: { latitude: portLat, longitude: portLng },
          starboard: { latitude: starboardLat, longitude: starboardLng },
          centerLat: (portLat + starboardLat) / 2,
          centerLon: (portLng + starboardLng) / 2,
          heading,
          length: lengthMeters,
        };
      }
    }

    if (!startLine) {
      const portMark = marks.find(mark => mark.type === 'start-pin');
      const starboardMark = marks.find(mark => mark.type === 'start-boat');

      if (portMark && starboardMark) {
        const heading = TacticalCalculations.calculateBearing(
          portMark.position.lat,
          portMark.position.lng,
          starboardMark.position.lat,
          starboardMark.position.lng
        );
        const lengthMeters = TacticalCalculations.calculateDistance(
          portMark.position.lat,
          portMark.position.lng,
          starboardMark.position.lat,
          starboardMark.position.lng
        );

        startLine = {
          port: { latitude: portMark.position.lat, longitude: portMark.position.lng },
          starboard: { latitude: starboardMark.position.lat, longitude: starboardMark.position.lng },
          centerLat: (portMark.position.lat + starboardMark.position.lat) / 2,
          centerLon: (portMark.position.lng + starboardMark.position.lng) / 2,
          heading,
          length: lengthMeters,
        };
      }
    }

    const legs = marks.slice(0, -1).map((mark, index) => {
      const next = marks[index + 1];
      const heading = TacticalCalculations.calculateBearing(
        mark.position.lat,
        mark.position.lng,
        next.position.lat,
        next.position.lng
      );
      const distanceMeters = TacticalCalculations.calculateDistance(
        mark.position.lat,
        mark.position.lng,
        next.position.lat,
        next.position.lng
      );
      const distanceNm = distanceMeters / 1852;

      let type: 'upwind' | 'downwind' | 'reach' = 'reach';
      if (windSnapshot?.direction !== undefined && windSnapshot?.direction !== null) {
        const angleDiff = Math.abs((heading - windSnapshot.direction + 360) % 360);
        if (angleDiff < 60 || angleDiff > 300) {
          type = 'upwind';
        } else if (angleDiff > 120 && angleDiff < 240) {
          type = 'downwind';
        }
      } else if (index === 0) {
        type = 'upwind';
      } else if (index % 2 === 1) {
        type = 'downwind';
      }

      return {
        id: `leg-${index}`,
        name: `${mark.name} → ${next.name}`,
        from: mark.id,
        to: next.id,
        type,
        distance: Number.isFinite(distanceNm) ? distanceNm : 0,
        heading,
        estimatedTime: undefined,
      };
    });

    const totalDistance = legs.reduce((sum, leg) => sum + (leg.distance ?? 0), 0);
    const laps = pickNumeric([metadata.laps, metadata.course_laps, metadata.race_laps]) ?? undefined;

    return {
      id: selectedRaceId ?? 'race-course',
      name: selectedRaceData?.name ?? 'Race Course',
      marks,
      legs,
      startTime: selectedRaceData?.start_date ? new Date(selectedRaceData.start_date) : undefined,
      startLine,
      distance: totalDistance,
      laps,
    } as Course;
  }, [selectedRaceData, selectedRaceMarks, selectedRaceId, windSnapshot]);

  const courseHeading = useMemo(() => {
    if (!raceCourseForConsole) return undefined;
    if (raceCourseForConsole.legs && raceCourseForConsole.legs.length > 0) {
      return raceCourseForConsole.legs[0].heading;
    }
    return raceCourseForConsole.startLine?.heading;
  }, [raceCourseForConsole]);

  const layoutWindData = useMemo(() => {
    if (!windSnapshot) return undefined;
    return {
      speed: windSnapshot.speed,
      direction: windSnapshot.direction,
      gust: windSnapshot.gust,
    };
  }, [windSnapshot]);

  const layoutCurrentData = useMemo(() => {
    if (!currentSnapshot) return undefined;
    return {
      speed: currentSnapshot.speed,
      direction: currentSnapshot.direction,
      type: currentSnapshot.type,
    };
  }, [currentSnapshot]);

  const nextMarkForCalculations = useMemo(() => {
    if (!selectedRaceMarks || selectedRaceMarks.length === 0) {
      return null;
    }

    const mark = selectedRaceMarks[0];
    const lat = mark.latitude ?? mark.coordinates?.lat ?? mark.position?.lat;
    const lng = mark.longitude ?? mark.coordinates?.lng ?? mark.position?.lng;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return null;
    }

    return {
      name: mark.name || mark.mark_name || 'Mark 1',
      latitude: lat,
      longitude: lng,
    };
  }, [selectedRaceMarks]);

  const overlayNextMark = useMemo(() => {
    if (!nextMarkForCalculations) return undefined;
    return {
      latitude: nextMarkForCalculations.latitude,
      longitude: nextMarkForCalculations.longitude,
      name: nextMarkForCalculations.name,
    };
  }, [nextMarkForCalculations]);

  const quickActionNextMark = useMemo(() => {
    if (!nextMarkForCalculations) {
      return undefined;
    }

    if (!gpsPosition || typeof gpsPosition.latitude !== 'number' || typeof gpsPosition.longitude !== 'number') {
      return {
        name: nextMarkForCalculations.name,
        distance: 0,
        bearing: 0,
      };
    }

    const distanceMeters = calculateDistance(
      gpsPosition.latitude,
      gpsPosition.longitude,
      nextMarkForCalculations.latitude,
      nextMarkForCalculations.longitude
    );

    const bearing = calculateBearing(
      gpsPosition.latitude,
      gpsPosition.longitude,
      nextMarkForCalculations.latitude,
      nextMarkForCalculations.longitude
    );

    return {
      name: nextMarkForCalculations.name,
      distance: distanceMeters / 1852,
      bearing,
    };
  }, [gpsPosition, nextMarkForCalculations]);

  const vhfChannel = useMemo(() => {
    const metadata = selectedRaceData?.metadata as Record<string, any> | undefined;
    return (
      selectedRaceData?.vhf_channel ??
      selectedRaceData?.critical_details?.vhf_channel ??
      metadata?.vhf_channel ??
      metadata?.vhfChannel ??
      metadata?.communications?.vhf ??
      metadata?.critical_details?.vhf_channel ??
      null
    );
  }, [selectedRaceData]);

  const effectiveDraft = useMemo(() => boatDraftValue ?? currentDraft ?? 2.5, [boatDraftValue, currentDraft]);

  const tideSnapshot = useMemo(() => {
    const metadata = selectedRaceData?.metadata as Record<string, any> | undefined;
    if (!metadata) return null;

    const height = pickNumeric([
      metadata.tide_height,
      metadata.tide?.height,
      metadata.tideHeight,
    ]) ?? 0;

    const range = pickNumeric([
      metadata.tide_range,
      metadata.tide?.range,
    ]) ?? 0;

    const trendRaw = metadata.tide_trend ?? metadata.tide?.trend ?? metadata.tide_state;
    const trend = typeof trendRaw === 'string'
      ? trendRaw.toLowerCase().includes('rise')
        ? 'rising'
        : trendRaw.toLowerCase().includes('fall')
          ? 'falling'
          : 'slack'
      : 'slack';

    return {
      height,
      trend,
      rate: 0,
      range,
    };
  }, [selectedRaceData]);

  const depthSnapshot = useMemo(() => {
    const metadata = selectedRaceData?.metadata as Record<string, any> | undefined;
    const draft = boatDraftValue ?? currentDraft ?? 2.5;

    const depthCurrent = pickNumeric([
      metadata?.depth_current,
      metadata?.depth,
      metadata?.water_depth,
      metadata?.bathymetry_depth,
    ]);

    if (depthCurrent === null) {
      return null;
    }

    const depthMinimum = pickNumeric([
      metadata?.depth_minimum,
      metadata?.depth_min,
      metadata?.shoal_depth,
    ]) ?? depthCurrent - 1;

    return {
      current: depthCurrent,
      minimum: depthMinimum,
      trend: 0,
      clearance: depthCurrent - draft,
    };
  }, [selectedRaceData, boatDraftValue, currentDraft]);

  const coachContext = useMemo(() => {
    const metadata = (selectedRaceData?.metadata || {}) as Record<string, any>;
    return {
      race_id: selectedRaceId ?? undefined,
      date_time: selectedRaceData?.start_date,
      startTime: selectedRaceData?.start_date,
      fleet_size:
        metadata.fleet_size ??
        metadata.fleetSize ??
        selectedRaceData?.fleet_size ??
        selectedRaceData?.fleetSize,
      course: raceCourseForConsole,
      marks: raceCourseForConsole?.marks,
      weather: selectedRaceWeather,
      wind: selectedRaceWeather?.wind,
      current: selectedRaceWeather?.current,
      tidal: tideSnapshot,
      tidalIntel: tideSnapshot,
      location: venueCenter
        ? {
            name:
              metadata?.venue_name ??
              selectedRaceData?.venue_name ??
              selectedRaceData?.metadata?.venue_name ??
              'Race Venue',
            ...venueCenter,
          }
        : undefined,
      position: gpsPosition
        ? {
            lat: gpsPosition.latitude,
            lon: gpsPosition.longitude,
            speed: typeof gpsPosition.speed === 'number' ? gpsPosition.speed : undefined,
            heading:
              typeof gpsPosition.heading === 'number' ? gpsPosition.heading : undefined,
          }
        : undefined,
      boat: {
        length: boatLengthValue ?? undefined,
        draft: effectiveDraft,
      },
    };
  }, [
    selectedRaceId,
    selectedRaceData,
    raceCourseForConsole,
    selectedRaceWeather,
    tideSnapshot,
    venueCenter,
    gpsPosition,
    boatLengthValue,
    effectiveDraft,
  ]);

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

  const phaseDetectionMarks = useMemo(() => {
    const marks: Array<{
      name: string;
      type: 'start' | 'windward' | 'leeward' | 'jibe' | 'finish';
      coordinates: { lat: number; lon: number };
    }> = [];

    if (raceCourseForConsole?.startLine) {
      marks.push({
        name: 'Start Line',
        type: 'start',
        coordinates: {
          lat: raceCourseForConsole.startLine.centerLat,
          lon: raceCourseForConsole.startLine.centerLon,
        },
      });
    }

    for (const mark of raceCourseForConsole?.marks ?? []) {
      const lat = mark.position?.lat;
      const lon = mark.position?.lng;
      if (typeof lat !== 'number' || typeof lon !== 'number') {
        continue;
      }

      let type: 'start' | 'windward' | 'leeward' | 'jibe' | 'finish' = 'windward';
      switch (mark.type) {
        case 'start-boat':
        case 'start-pin':
          type = 'start';
          break;
        case 'leeward':
          type = 'leeward';
          break;
        case 'offset':
          type = 'jibe';
          break;
        case 'finish':
          type = 'finish';
          break;
        default:
          type = 'windward';
      }

      marks.push({
        name: mark.name,
        type,
        coordinates: { lat, lon },
      });
    }

    return marks;
  }, [raceCourseForConsole]);

  const racePhaseInput = useMemo(() => {
    const currentPosition = gpsPosition
      ? {
          lat: gpsPosition.latitude,
          lon: gpsPosition.longitude,
        }
      : fallbackPosition
        ? {
            lat: fallbackPosition.latitude,
            lon: fallbackPosition.longitude,
          }
        : undefined;

    return {
      startTime: selectedRaceData?.start_date,
      currentPosition,
      course: raceCourseForConsole,
      marks: phaseDetectionMarks,
      heading: gpsPosition?.heading ?? lastHeadingRef.current ?? undefined,
      speed: boatSpeedKnots,
    };
  }, [
    selectedRaceData?.start_date,
    gpsPosition,
    fallbackPosition,
    raceCourseForConsole,
    phaseDetectionMarks,
    boatSpeedKnots,
  ]);

  const racePhaseContext = useRacePhaseDetection(racePhaseInput);

  const timeToStartSeconds = useMemo(() => {
    if (timeToStartMinutes === null || timeToStartMinutes === undefined) {
      return null;
    }
    return Math.round(timeToStartMinutes * 60);
  }, [timeToStartMinutes]);

  const currentGpsTrack: GPSPoint[] = useMemo(() => {
    const metadataTrack = selectedRaceData?.metadata?.gps_track ?? selectedRaceData?.gps_track;
    const parsed = parseGpsTrack(metadataTrack);
    return parsed ?? []; // Don't show mock data - return empty array if no real track
  }, [selectedRaceData]);

  const currentSplitTimes: DebriefSplitTime[] = useMemo(() => {
    const metadataSplits = selectedRaceData?.metadata?.split_times ?? selectedRaceData?.split_times;
    const parsed = parseSplitTimes(metadataSplits);
    return parsed ?? []; // Don't show mock data - return empty array if no real splits
  }, [selectedRaceData]);

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
    logger.error('Top-level error', error);
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

  // User initial for avatar
  const userInitial = (userProfile?.full_name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <View className="flex-1" style={{ backgroundColor: '#EBEBED' }}>
      {/* Floating Header */}
      <RacesFloatingHeader
        topInset={insets.top}
        loadingInsights={loadingInsights}
        weatherLoading={weatherLoading}
        isOnline={isOnline}
        onAddRace={() => setShowAddRaceSheet(true)}
        onOpenSettings={() => router.push('/(tabs)/settings')}
        userInitial={userInitial}
      />

      {/* Main Content */}
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
      >
        {/* Demo notice */}
        <DemoNotice
          visible={isDemoProfile && !demoNoticeDismissed}
          onDismiss={() => setDemoNoticeDismissed(true)}
          onClaimWorkspace={handleClaimWorkspace}
        />
        {/* RACE CARDS - MULTIPLE RACES SIDE-BY-SIDE */}
        {hasRealRaces ? (
          // User has real races - show carousel with detail zone
          <>
            <RealRacesCarousel
              races={safeRecentRaces}
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
            onAddRace={() => setShowAddRaceSheet(true)}
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
        onPostRaceInterviewClose={() => {
          setShowPostRaceInterview(false);
          setCompletedSessionId(null);
          setCompletedRaceName('');
          setCompletedRaceId(null);
          setCompletedSessionGpsPoints(0);
        }}
        onPostRaceInterviewComplete={handlePostRaceInterviewComplete}
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
        // Add Race Dialog
        showAddRaceSheet={showAddRaceSheet}
        onAddRaceClose={() => setShowAddRaceSheet(false)}
        onAddRaceSave={handleAddRaceDialogSave}
      />

      {/* </PlanModeLayout> - temporarily removed */}
    </View>
  );
}
