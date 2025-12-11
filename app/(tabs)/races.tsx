import {
  ContingencyPlansCard,
  CourseSelector,
  CrewEquipmentCard,
  DownwindStrategyCard,
  FleetRacersCard,
  MarkRoundingCard,
  PostRaceAnalysisCard,
  PreRaceStrategySection,
  RaceConditionsCard,
  RaceDetailMapHero,
  RacePhaseHeader,
  RigTuningCard,
  RouteMapCard,
  StartStrategyCard,
  UpwindStrategyCard,
  WeatherAlongRouteCard
} from '@/components/race-detail';
import type { RaceDocument as RaceDocumentsCardDocument } from '@/components/race-detail/RaceDocumentsCard';
import { AIPatternDetection } from '@/components/races/debrief/AIPatternDetection';
import { PlanModeLayout } from '@/components/races/modes';
import { PerformanceMetrics, calculatePerformanceMetrics } from '@/components/races/PerformanceMetrics';
import { SplitTimesAnalysis } from '@/components/races/SplitTimesAnalysis';
import { TacticalInsights } from '@/components/races/TacticalInsights';
// LiveRaceTimer removed - timer is now only in the Race Card
import { StrategySharingModal } from '@/components/coaching/StrategySharingModal';
import { CommunityTipsCard } from '@/components/venue/CommunityTipsCard';
import { CalendarImportFlow } from '@/components/races/CalendarImportFlow';
import { DemoRaceDetail } from '@/components/races/DemoRaceDetail';
import { DistanceRaceCard } from '@/components/races/DistanceRaceCard';
import { FleetPostRaceInsights } from '@/components/races/FleetPostRaceInsights';
import { OnWaterTrackingView } from '@/components/races/OnWaterTrackingView';
import { PlanModeContent } from '@/components/races/plan';
import { PostRaceInterview } from '@/components/races/PostRaceInterview';
import { PreRaceBriefingCard } from '@/components/races/PreRaceBriefingCard';
import { RaceCard } from '@/components/races/RaceCard';
import { TacticalCalculations } from '@/components/races/TacticalDataOverlay';
import { AccessibleTouchTarget } from '@/components/ui/AccessibleTouchTarget';
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
import { useRacePhaseDetection } from '@/hooks/useRacePhaseDetection';
import { useRacePreparation } from '@/hooks/useRacePreparation';
import { useLiveRaces, useUserRaceResults, withdrawFromRace } from '@/hooks/useRaceResults';
import { useRaceTuningRecommendation } from '@/hooks/useRaceTuningRecommendation';
import { useRaceWeather } from '@/hooks/useRaceWeather';
import { useVenueDetection } from '@/hooks/useVenueDetection';
import { createLogger } from '@/lib/utils/logger';
import { useAuth } from '@/providers/AuthProvider';
import { VenueIntelligenceAgent } from '@/services/agents/VenueIntelligenceAgent';
import type { RaceDocumentType, RaceDocumentWithDetails } from '@/services/RaceDocumentService';
import { raceDocumentService } from '@/services/RaceDocumentService';
import { documentStorageService } from '@/services/storage/DocumentStorageService';
import { supabase } from '@/services/supabase';
import { TacticalZoneGenerator } from '@/services/TacticalZoneGenerator';
import { venueIntelligenceService } from '@/services/VenueIntelligenceService';
import type { Course } from '@/stores/raceConditionsStore';
import { useRaceConditions } from '@/stores/raceConditionsStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertTriangle,
  Bell,
  Calendar,
  ChevronRight,
  MapPin,
  Navigation,
  Plus,
  TrendingUp,
  Users,
  X
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, Platform, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

const logger = createLogger('RacesScreen');

// Destructure tactical calculations for easy access
const { calculateDistance, calculateBearing } = TacticalCalculations;

const DOCUMENT_TYPE_OPTIONS: Array<{ label: string; description: string; value: RaceDocumentType }> = [
  {
    label: 'Sailing Instructions',
    description: 'Standard SI packets and updates',
    value: 'sailing_instructions',
  },
  {
    label: 'Notice of Race',
    description: 'NORs or addenda',
    value: 'nor',
  },
  {
    label: 'Course Diagram',
    description: 'Course charts or layouts',
    value: 'course_diagram',
  },
  {
    label: 'Amendment',
    description: 'Rule changes after publication',
    value: 'amendment',
  },
  {
    label: 'NOTAM',
    description: 'Notices to mariners / harbor ops',
    value: 'notam',
  },
  {
    label: 'Other',
    description: 'Anything else worth sharing',
    value: 'other',
  },
];

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

interface RigPreset {
  id: string;
  label: string;
  windRange: string;
  uppers: string;
  lowers: string;
  runners: string;
  ram: string;
  notes: string;
}

interface RegulatoryDigestData {
  seriesName: string;
  venueArea: string;
  cleanRegatta: boolean;
  signOnWindow: string;
  entryNotes: string[];
  courseSelection: string;
  safetyNotes: string[];
  reference: string;
}

interface RegulatoryAcknowledgements {
  cleanRegatta: boolean;
  signOn: boolean;
  safetyBriefing: boolean;
}

interface CourseOutlineGroup {
  group: string;
  description: string;
  courses: Array<{
    name: string;
    sequence: string;
  }>;
}

interface TacticalWindSnapshot {
  speed: number;
  direction: number;
  gust?: number;
}

interface TacticalCurrentSnapshot {
  speed: number;
  direction: number;
  type?: 'flood' | 'ebb' | 'slack';
}

const CARDINAL_TO_DEGREES: Record<string, number> = {
  N: 0,
  NNE: 22.5,
  NE: 45,
  ENE: 67.5,
  E: 90,
  ESE: 112.5,
  SE: 135,
  SSE: 157.5,
  S: 180,
  SSW: 202.5,
  SW: 225,
  WSW: 247.5,
  W: 270,
  WNW: 292.5,
  NW: 315,
  NNW: 337.5,
};

const DEGREE_PATTERN = /(-?\d+(?:\.\d+)?)/;

function normalizeDirection(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const normalized = value % 360;
    return normalized < 0 ? normalized + 360 : normalized;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const degreeMatch = trimmed.match(DEGREE_PATTERN);
    if (degreeMatch) {
      const parsed = Number.parseFloat(degreeMatch[1]);
      if (!Number.isNaN(parsed)) {
        const normalized = parsed % 360;
        return normalized < 0 ? normalized + 360 : normalized;
      }
    }

    const lettersOnly = trimmed.replace(/[^A-Za-z]/g, '').toUpperCase();
    if (lettersOnly && CARDINAL_TO_DEGREES[lettersOnly] !== undefined) {
      return CARDINAL_TO_DEGREES[lettersOnly];
    }
  }

  return null;
}

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

function pickNumeric(values: Array<unknown>): number | null {
  for (const candidate of values) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }
  }
  return null;
}

function normalizeCurrentType(value: unknown): 'flood' | 'ebb' | 'slack' | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const lower = value.toLowerCase();
  if (lower.includes('flood')) {
    return 'flood';
  }
  if (lower.includes('ebb')) {
    return 'ebb';
  }
  if (lower.includes('slack')) {
    return 'slack';
  }
  return undefined;
}

function extractWindSnapshot(source: any): TacticalWindSnapshot | null {
  if (!source) {
    return null;
  }

  const direction = normalizeDirection(
    source.direction ??
      source.directionDegrees ??
      source.direction_degrees ??
      source.directionCardinal ??
      source.direction_cardinal ??
      source.heading ??
      source.bearing
  );

  let speed = pickNumeric([
    source.speed,
    source.speedAvg,
    source.average,
    source.knots,
    source.value,
    source.mean,
  ]);

  const min = pickNumeric([source.speedMin, source.speed_min, source.min]);
  const max = pickNumeric([source.speedMax, source.speed_max, source.max, source.gust, source.gusts]);

  if (speed === null) {
    if (min !== null && max !== null) {
      speed = (min + max) / 2;
    } else if (min !== null) {
      speed = min;
    } else if (max !== null) {
      speed = max;
    }
  }

  const gust = pickNumeric([source.gust, source.gusts, source.speedMax, source.speed_max]);

  if (direction === null || speed === null) {
    return null;
  }

  return {
    speed,
    direction,
    ...(gust !== null ? { gust } : {}),
  };
}

function extractCurrentSnapshot(source: any): TacticalCurrentSnapshot | null {
  if (!source) {
    return null;
  }

  const direction = normalizeDirection(
    source.direction ??
      source.directionDegrees ??
      source.direction_degrees ??
      source.heading ??
      source.bearing ??
      source.cardinal ??
      source.flow
  );

  const speed = pickNumeric([
    source.speed,
    source.speedKnots,
    source.knots,
    source.rate,
    source.velocity,
    source.strength,
  ]);

  if (direction === null || speed === null) {
    return null;
  }

  const type =
    normalizeCurrentType(source.type) ??
    normalizeCurrentType(source.state) ??
    normalizeCurrentType(source.flow);

  return {
    speed,
    direction,
    ...(type ? { type } : {}),
  };
}

function parseGpsTrack(rawTrack: unknown): GPSPoint[] | null {
  if (!Array.isArray(rawTrack)) {
    return null;
  }

  const parsed: GPSPoint[] = [];

  for (const point of rawTrack) {
    if (typeof point !== 'object' || point === null) {
      continue;
    }

    const latitude = typeof (point as any).latitude === 'number'
      ? (point as any).latitude
      : typeof (point as any).lat === 'number'
        ? (point as any).lat
        : null;

    const longitude = typeof (point as any).longitude === 'number'
      ? (point as any).longitude
      : typeof (point as any).lng === 'number'
        ? (point as any).lng
        : null;

    const timestampValue = (point as any).timestamp ?? (point as any).time ?? (point as any).recorded_at;
    const timestamp = timestampValue ? new Date(timestampValue) : null;

    if (
      latitude === null ||
      longitude === null ||
      !(timestamp instanceof Date) ||
      Number.isNaN(timestamp.valueOf())
    ) {
      continue;
    }

    const speed = typeof (point as any).speed === 'number'
      ? (point as any).speed
      : typeof (point as any).sog === 'number'
        ? (point as any).sog
        : 0;

    const heading = typeof (point as any).heading === 'number'
      ? (point as any).heading
      : typeof (point as any).cog === 'number'
        ? (point as any).cog
        : 0;

    const accuracy = typeof (point as any).accuracy === 'number'
      ? (point as any).accuracy
      : undefined;

    parsed.push({
      latitude,
      longitude,
      timestamp,
      speed,
      heading,
      accuracy,
    });
  }

  return parsed.length > 0 ? parsed : null;
}

function parseSplitTimes(rawSplits: unknown): DebriefSplitTime[] | null {
  if (!Array.isArray(rawSplits)) {
    return null;
  }

  const parsed: DebriefSplitTime[] = [];

  for (const split of rawSplits) {
    if (typeof split !== 'object' || split === null) {
      continue;
    }

    const markId = typeof (split as any).markId === 'string'
      ? (split as any).markId
      : typeof (split as any).mark_id === 'string'
        ? (split as any).mark_id
        : null;

    const markName = typeof (split as any).markName === 'string'
      ? (split as any).markName
      : typeof (split as any).mark_name === 'string'
        ? (split as any).mark_name
        : null;

    const timestampValue = (split as any).time ?? (split as any).timestamp ?? (split as any).recorded_at;
    const time = timestampValue ? new Date(timestampValue) : null;

    const position = typeof (split as any).position === 'number'
      ? (split as any).position
      : typeof (split as any).fleet_position === 'number'
        ? (split as any).fleet_position
        : null;

    const roundingRaw = (split as any).roundingType ?? (split as any).rounding_type ?? (split as any).rounding;
    const roundingType = roundingRaw === 'starboard' || roundingRaw === 'port'
      ? roundingRaw
      : roundingRaw === 'stbd'
        ? 'starboard'
        : roundingRaw === 'prt'
          ? 'port'
          : 'port';

    const roundingTime = typeof (split as any).roundingTime === 'number'
      ? (split as any).roundingTime
      : typeof (split as any).rounding_time === 'number'
        ? (split as any).rounding_time
        : 0;

    if (
      !markId ||
      !markName ||
      !(time instanceof Date) ||
      Number.isNaN(time.valueOf()) ||
      typeof position !== 'number'
    ) {
      continue;
    }

    parsed.push({
      markId,
      markName,
      time,
      position,
      roundingType: roundingType as DebriefSplitTime['roundingType'],
      roundingTime,
    });
  }

  return parsed.length > 0 ? parsed : null;
}

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

export default function RacesScreen() {
  const auth = useAuth();
  const { user, signedIn, ready, isDemoSession, userType } = auth;
  const fetchUserProfileRef = useRef(auth.fetchUserProfile);
  useEffect(() => {
    fetchUserProfileRef.current = auth.fetchUserProfile;
  }, [auth.fetchUserProfile]);
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ selected?: string }>();
  const [showCalendarImport, setShowCalendarImport] = useState(false);
  const mainScrollViewRef = useRef<ScrollView>(null); // Main vertical ScrollView
  const raceCardsScrollViewRef = useRef<ScrollView>(null); // Horizontal race cards ScrollView
  const hasAutoCenteredNextRace = useRef(false);
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  // Maintain card dimension constants in sync with RaceCard.tsx to keep scroll math accurate
  const RACE_CARD_WIDTH = 170;
  const RACE_CARD_TOTAL_WIDTH = RACE_CARD_WIDTH + 8; // width + combined horizontal margin (4px each side)

  const [regulatorySectionY, setRegulatorySectionY] = useState(0);
  const [logisticsSectionY, setLogisticsSectionY] = useState(0);

  // Post-race interview state
  const [showPostRaceInterview, setShowPostRaceInterview] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [completedRaceName, setCompletedRaceName] = useState<string>('');
  const [completedRaceId, setCompletedRaceId] = useState<string | null>(null);
  const [completedSessionGpsPoints, setCompletedSessionGpsPoints] = useState<number>(0);
  const [userPostRaceSession, setUserPostRaceSession] = useState<any | null>(null);
  const [loadingUserPostRaceSession, setLoadingUserPostRaceSession] = useState(false);

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
  const [sailorId, setSailorId] = useState<string | null>(null);
  const [showCoachSelectionModal, setShowCoachSelectionModal] = useState(false);
  const [sharingStrategy, setSharingStrategy] = useState(false);
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

  const loadUserPostRaceSession = useCallback(async () => {
    if (!selectedRaceId || !user?.id) {
      setUserPostRaceSession(null);
      return;
    }

    setLoadingUserPostRaceSession(true);
    try {
      const { data, error } = await supabase
        .from('race_timer_sessions')
        .select('*')
        .eq('regatta_id', selectedRaceId)
        .eq('sailor_id', user.id)
        .order('end_time', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        logger.warn('[races.tsx] Unable to load user race session', {
          error,
          selectedRaceId,
        });
        setUserPostRaceSession(null);
        return;
      }

      setUserPostRaceSession(data && data.length > 0 ? data[0] : null);
    } catch (error) {
      logger.warn('[races.tsx] Unexpected error loading user race session', error);
      setUserPostRaceSession(null);
    } finally {
      setLoadingUserPostRaceSession(false);
    }
  }, [logger, selectedRaceId, user?.id]);

  useEffect(() => {
    loadUserPostRaceSession();
  }, [loadUserPostRaceSession]);

  // Fetch sailor profile ID for strategy cards
  useEffect(() => {
    const fetchSailorId = async () => {
      if (!user?.id) {
        setSailorId(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('sailor_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          logger.warn('[races.tsx] Error fetching sailor profile', error);
          setSailorId(null);
          return;
        }

        setSailorId(data?.id || null);
      } catch (error) {
        logger.warn('[races.tsx] Unexpected error fetching sailor profile', error);
        setSailorId(null);
      }
    };

    fetchSailorId();
  }, [user?.id, logger]);

  const handleOpenPostRaceInterviewManually = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Post-Race Interview', 'You need to be signed in to add post-race notes.');
      return;
    }

    if (!selectedRaceId || !selectedRaceData) {
      Alert.alert('Post-Race Interview', 'Select a race first to add your post-race interview.');
      return;
    }

    setLoadingUserPostRaceSession(true);
    try {
      let session = userPostRaceSession;

      if (!session) {
        const nowIso = new Date().toISOString();
        const startTime = selectedRaceData.start_date || nowIso;

        const { data: createdSession, error } = await supabase
          .from('race_timer_sessions')
          .insert({
            sailor_id: user.id,
            regatta_id: selectedRaceId,
            start_time: startTime,
            end_time: nowIso,
            duration_seconds: 0,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        session = createdSession;
        setUserPostRaceSession(createdSession);
      }

      if (!session?.id) {
        throw new Error('Missing race timer session');
      }

      setCompletedSessionId(session.id);
      setCompletedRaceName(selectedRaceData.name ?? 'Race');
      setCompletedRaceId(selectedRaceId);
      setShowPostRaceInterview(true);
    } catch (error: any) {
      logger.error('[races.tsx] Failed to open post-race interview manually', error);
      Alert.alert(
        'Post-Race Interview',
        error?.message
          ? `Unable to open interview: ${error.message}`
          : 'We could not open the post-race interview. Please try again.'
      );
    } finally {
      setLoadingUserPostRaceSession(false);
    }
  }, [
    logger,
    selectedRaceData,
    selectedRaceId,
    setCompletedRaceName,
    setShowPostRaceInterview,
    user?.id,
    userPostRaceSession,
  ]);

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
      if (!signedIn) {
        logger.debug('User not authenticated, redirecting to login');
        router.replace('/(auth)/login');
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

const addRaceTimelineStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 400,
    marginRight: 16,
  },
  timelineColumn: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  timelineBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  timelineBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
    letterSpacing: 0.5,
  },
  timelineBar: {
    width: 6,
    flex: 1,
    borderRadius: 999,
    backgroundColor: '#10B981',
    shadowColor: '#059669',
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  card: {
    width: 240,
    height: '100%',
    backgroundColor: '#F8FFFB',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    marginLeft: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 4,
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F766E',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#042F2E',
    marginTop: 6,
  },
  copy: {
    fontSize: 13,
    color: '#0F172A',
    marginTop: 8,
    lineHeight: 18,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  chip: {
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 999,
    paddingVertical: 12,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    paddingVertical: 11,
    marginTop: 10,
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});

const documentTypePickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
    padding: 24,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#475467',
    marginTop: 4,
    marginBottom: 12,
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  lastOption: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  cancelButton: {
    marginTop: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
});

interface AddRaceTimelineCardProps {
  onAddRace: () => void;
  onImportCalendar: () => void;
  hasRealRaces: boolean;
}

function AddRaceTimelineCard({ onAddRace, onImportCalendar, hasRealRaces }: AddRaceTimelineCardProps) {
  return (
    <View style={addRaceTimelineStyles.wrapper}>
      <View style={addRaceTimelineStyles.timelineColumn}>
        <View style={addRaceTimelineStyles.timelineBadge}>
          <Text style={addRaceTimelineStyles.timelineBadgeText}>
            {hasRealRaces ? 'NOW' : 'START'}
          </Text>
        </View>
        <View style={addRaceTimelineStyles.timelineBar} />
      </View>
      <View style={addRaceTimelineStyles.card}>
        <View>
          <Text style={addRaceTimelineStyles.eyebrow}>Race timeline</Text>
          <Text style={addRaceTimelineStyles.title}>Add your next race</Text>
          <Text style={addRaceTimelineStyles.copy}>
            Drop NOR / SI files, draw a racing box, and unlock tactical overlays instantly.
          </Text>
          <View style={addRaceTimelineStyles.chipsRow}>
            <View style={addRaceTimelineStyles.chip}>
              <Text style={addRaceTimelineStyles.chipText}>Auto-plan docs</Text>
            </View>
            <View style={addRaceTimelineStyles.chip}>
              <Text style={addRaceTimelineStyles.chipText}>Draw race area</Text>
            </View>
            <View style={addRaceTimelineStyles.chip}>
              <Text style={addRaceTimelineStyles.chipText}>Share with crew</Text>
            </View>
          </View>
        </View>
        <View>
          <TouchableOpacity
            style={addRaceTimelineStyles.primaryButton}
            onPress={onAddRace}
            accessibilityRole="button"
            accessibilityLabel="Add a new race"
            activeOpacity={0.9}
          >
            <Plus color="#FFFFFF" size={18} />
            <Text style={addRaceTimelineStyles.primaryButtonText}>Add race</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={addRaceTimelineStyles.secondaryButton}
            onPress={onImportCalendar}
            accessibilityRole="button"
            accessibilityLabel="Import race calendar"
            activeOpacity={0.85}
          >
            <Calendar color="#047857" size={18} />
            <Text style={addRaceTimelineStyles.secondaryButtonText}>Import calendar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

interface RigPlannerCardProps {
  presets: RigPreset[];
  selectedBand: string | null;
  onSelectBand: (bandId: string) => void;
  notes: string;
  onChangeNotes: (value: string) => void;
  onOpenChat: () => void;
}

function RigPlannerCard({ presets, selectedBand, onSelectBand, notes, onChangeNotes, onOpenChat }: RigPlannerCardProps) {
  if (!presets || presets.length === 0) {
    return null;
  }

  const activePreset = presets.find((preset) => preset.id === selectedBand) ?? presets[0];

  return (
    <View className="bg-white border border-slate-200 rounded-2xl p-4 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-semibold text-slate-900">Rig &amp; Sail Planner</Text>
        <TouchableOpacity
          onPress={onOpenChat}
          accessibilityRole="button"
          className="flex-row items-center"
        >
          <MaterialCommunityIcons name="chat-processing-outline" size={16} color="#2563EB" />
          <Text className="text-xs font-semibold text-blue-600 ml-1">Review chat</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row flex-wrap gap-2 mb-3">
        {presets.map((preset) => {
          const isActive = preset.id === activePreset.id;
          return (
            <TouchableOpacity
              key={preset.id}
              onPress={() => onSelectBand(preset.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              className={`px-3 py-2 rounded-full border ${isActive ? 'bg-blue-600 border-blue-600' : 'bg-blue-50 border-blue-200'}`}
            >
              <Text className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-blue-700'}`}>
                {preset.label} • {preset.windRange}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="bg-blue-50 border border-blue-100 rounded-2xl p-3 mb-3">
        <RigPlannerDetailRow label="Uppers" value={activePreset.uppers} />
        <RigPlannerDetailRow label="Lowers" value={activePreset.lowers} />
        <RigPlannerDetailRow label="Runners" value={activePreset.runners} />
        <RigPlannerDetailRow label="Mast Ram" value={activePreset.ram} />
        <Text className="text-[11px] text-blue-900 mt-2">{activePreset.notes}</Text>
      </View>

      <TextInput
        value={notes}
        onChangeText={onChangeNotes}
        placeholder="Notes or adjustments (e.g., traveller +1 cm, jib lead aft ½ hole)"
        multiline
        numberOfLines={3}
        className="border border-slate-200 rounded-2xl px-3 py-2 text-sm text-slate-700"
        placeholderTextColor="#94A3B8"
      />
      <Text className="text-[11px] text-slate-500 mt-2">
        Track tweaks made dockside so the crew can sync after racing.
      </Text>
    </View>
  );
}

function RigPlannerDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between mt-1">
      <Text className="text-xs font-semibold text-blue-900">{label}</Text>
      <Text className="text-xs text-blue-800 text-right ml-3 flex-1">{value}</Text>
    </View>
  );
}

interface RegulatoryDigestCardProps {
  digest: RegulatoryDigestData;
  acknowledgements: RegulatoryAcknowledgements;
  onToggle: (key: keyof RegulatoryAcknowledgements) => void;
}

function RegulatoryDigestCard({ digest, acknowledgements, onToggle }: RegulatoryDigestCardProps) {
  const ackItems: Array<{ key: keyof RegulatoryAcknowledgements; label: string; description: string }> = [
    {
      key: 'cleanRegatta',
      label: 'Clean Regatta commitments noted',
      description: digest.cleanRegatta ? 'Event flagged as Sailors for the Sea Clean Regatta.' : 'Not designated Clean Regatta.',
    },
    {
      key: 'signOn',
      label: 'Sign-on window understood',
      description: digest.signOnWindow,
    },
    {
      key: 'safetyBriefing',
      label: 'Safety briefing complete',
      description: 'Required video briefing and quiz submitted in SailSys.',
    },
  ];

  return (
    <View className="bg-white border border-purple-200 rounded-2xl p-4 mb-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-base font-semibold text-purple-900">Notice of Race Digest</Text>
          <Text className="text-xs text-purple-600 mt-1">
            {digest.seriesName} • {digest.venueArea}
          </Text>
        </View>
        <Text className="text-[10px] font-semibold text-purple-500">{digest.reference}</Text>
      </View>

      <View className="mt-3">
        <Text className="text-sm font-semibold text-slate-900">Entry &amp; Compliance</Text>
        {digest.entryNotes.map((note, index) => (
          <View key={`${note}-${index}`} className="flex-row items-start gap-2 mt-2">
            <View className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1" />
            <Text className="text-xs text-slate-700 flex-1">{note}</Text>
          </View>
        ))}
      </View>

      <View className="mt-3">
        <Text className="text-sm font-semibold text-slate-900">Acknowledgements</Text>
        {ackItems.map((item) => (
          <AcknowledgementRow
            key={item.key}
            label={item.label}
            description={item.description}
            checked={acknowledgements[item.key]}
            onPress={() => onToggle(item.key)}
          />
        ))}
      </View>

      <View className="mt-4">
        <Text className="text-sm font-semibold text-slate-900">Course Selection</Text>
        <Text className="text-xs text-slate-600 mt-1">{digest.courseSelection}</Text>
      </View>

      <View className="mt-4">
        <Text className="text-sm font-semibold text-slate-900">Safety Notes</Text>
        {digest.safetyNotes.map((note, index) => (
          <View key={`${note}-${index}`} className="flex-row items-start gap-2 mt-2">
            <MaterialCommunityIcons name="shield-alert-outline" size={16} color="#F97316" />
            <Text className="text-xs text-slate-700 flex-1">{note}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AcknowledgementRow({
  label,
  description,
  checked,
  onPress,
}: {
  label: string;
  description: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-start gap-3 mt-3"
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <MaterialCommunityIcons
        name={checked ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
        size={20}
        color={checked ? '#2563EB' : '#CBD5F5'}
      />
      <View className="flex-1">
        <Text className="text-xs font-semibold text-slate-800">{label}</Text>
        <Text className="text-[11px] text-slate-500 mt-1">{description}</Text>
      </View>
    </TouchableOpacity>
  );
}

function CourseOutlineCard({ groups }: { groups: CourseOutlineGroup[] }) {
  if (!groups || groups.length === 0) {
    return null;
  }

  return (
    <View className="bg-white border border-slate-200 rounded-2xl p-4 mb-4">
      <Text className="text-base font-semibold text-slate-900">Course Outlines</Text>
      {groups.map((group) => (
        <View key={group.group} className="mt-4">
          <Text className="text-sm font-semibold text-slate-800">{group.group}</Text>
          <Text className="text-xs text-slate-500 mt-1">{group.description}</Text>
          <View className="mt-2">
            {group.courses.map((course) => (
              <View key={course.name} className="flex-row items-start gap-3 mt-1">
                <Text className="text-[11px] font-semibold text-slate-700 w-20">{course.name}</Text>
                <Text className="flex-1 text-[11px] text-slate-600">{course.sequence}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

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

  // Offline support
  const { isOnline, cacheNextRace } = useOffline();

  // Real-time race updates
  const { liveRaces, loading: liveRacesLoading, refresh: refetchRaces } = useLiveRaces(user?.id);
  
  // Track if races have been loaded at least once to prevent flash of demo content
  const hasLoadedRacesOnce = useRef(false);
  useEffect(() => {
    if (!liveRacesLoading && liveRaces !== undefined) {
      hasLoadedRacesOnce.current = true;
    }
  }, [liveRacesLoading, liveRaces]);

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

  // AI Venue Analysis
  const [venueInsights, setVenueInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  // Create agent instance once using useMemo - MUST be before any returns
  const venueAgent = useMemo(() => new VenueIntelligenceAgent(), []);

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

  const rigPresets = useMemo<RigPreset[]>(() => {
    const metadataPresets = selectedRaceData?.metadata?.rig_presets as RigPreset[] | undefined;
    if (Array.isArray(metadataPresets) && metadataPresets.length > 0) {
      return metadataPresets;
    }

    return [
      {
        id: 'light',
        label: 'Light Air',
        windRange: '< 8 kn',
        uppers: '12–13 Loos',
        lowers: 'Slack (0–1 turn off)',
        runners: 'Ease for visible sag',
        ram: '+2 cm forward',
        notes: 'Power on: ease lowers and runners to maintain depth and acceleration.',
      },
      {
        id: 'medium',
        label: 'Today',
        windRange: '8–14 kn',
        uppers: '14–16 Loos',
        lowers: 'Mast straight athwartships',
        runners: '≈30 Loos – stay just taut',
        ram: 'Neutral to +1 cm',
        notes: 'Baseline Port Shelter tune; traveller slightly weather, maintain twist in chop.',
      },
      {
        id: 'fresh',
        label: 'Fresh Breeze',
        windRange: '15–20 kn',
        uppers: '17–18 Loos',
        lowers: '+½ turn',
        runners: '35–40 Loos',
        ram: '+3 cm forward',
        notes: 'Flatten sails, move lead aft ½ hole, ease traveller down in gusts.',
      },
    ];
  }, [selectedRaceData]);

  const regulatoryDigest = useMemo<RegulatoryDigestData>(() => {
    const metadata = (selectedRaceData?.metadata || {}) as Record<string, any>;
    return {
      seriesName: metadata.series_name || metadata.event_name || activeRace?.series || 'Corinthian Series',
      venueArea: metadata.venue_area || 'Port Shelter / Clearwater Bay',
      cleanRegatta: metadata.clean_regatta !== false,
      signOnWindow: metadata.sign_on_window || 'Sign-on via SailSys ≥10 minutes before warning signal',
      entryNotes: metadata.entry_requirements || [
        'Single season entry through SailSys for Dragon class',
        'Complete mandatory safety briefing video and quiz',
        'Acknowledge boat safety responsibilities and Club Bye-Laws',
      ],
      courseSelection: metadata.course_reference || 'Courses selected from RHKYC Attachment B (Geometric Courses)',
      safetyNotes: metadata.safety_notes || [
        'Keep clear of commercial traffic; breaches may result in DSQ without hearing',
        'Race Committee may bar future entry for serious safety violations',
      ],
      reference: metadata.nor_reference || 'RHKYC Dragon Class NoR 2025–2026',
    };
  }, [selectedRaceData, activeRace]);

  const courseOutlineGroups = useMemo<CourseOutlineGroup[]>(() => {
    const metadataCourses = selectedRaceData?.metadata?.course_outline as CourseOutlineGroup[] | undefined;
    if (Array.isArray(metadataCourses) && metadataCourses.length > 0) {
      return metadataCourses;
    }

    return [
      {
        group: 'Group 1',
        description: 'All marks rounded to port',
        courses: [
          { name: 'Course 1', sequence: 'Start – A – C – A – C – Finish at A' },
          { name: 'Course 2', sequence: 'Start – A – C – A – B – C – Finish at A' },
          { name: 'Course 3', sequence: 'Start – A – C – A – C – A – C – Finish at A' },
          { name: 'Course 4', sequence: 'Start – A – B – C – A – C – A – C – Finish at A' },
          { name: 'Course 5', sequence: 'Start – A – B – C – A – C – A – B – C – Finish at A' },
          { name: 'Course 6', sequence: 'Start – A – B – C – A – B – C – A – B – C – Finish at A' },
          { name: 'Course 7', sequence: 'Start – A – Finish at C' },
          { name: 'Course 8', sequence: 'Start – A – C – A – Finish at C' },
          { name: 'Course 9', sequence: 'Start – A – B – C – A – Finish at C' },
          { name: 'Course 10', sequence: 'Start – A – C – A – C – A – Finish at C' },
          { name: 'Course 11', sequence: 'Start – A – C – A – B – C – A – Finish at C' },
        ],
      },
      {
        group: 'Group 2',
        description: 'Gate C1/C2 (if replaced by single mark, round to port)',
        courses: [
          { name: 'Course 12', sequence: 'Start – A – Finish' },
          { name: 'Course 13', sequence: 'Start – A – C1/C2 – A – Finish' },
          { name: 'Course 14', sequence: 'Start – A – C1/C2 – A – C1/C2 – A – Finish' },
          { name: 'Course 15', sequence: 'Start – A – C1/C2 – A – B – Finish' },
          { name: 'Course 16', sequence: 'Start – A – C1/C2 – A – B – C2 – A – Finish' },
        ],
      },
    ];
  }, [selectedRaceData]);

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

  const hasStrategyGenerated = Boolean(
    selectedRaceData?.metadata?.strategy_generated_at ||
    selectedRaceData?.metadata?.ai_strategy_ready ||
    selectedRaceData?.metadata?.start_strategy_summary
  );

  const hasPostAnalysis = Boolean(
    selectedRaceData?.metadata?.post_race_notes ||
    selectedRaceData?.metadata?.analysis_completed_at
  );

  const hasCrewReady = Boolean(
    selectedRaceData?.metadata?.crew_ready ||
    selectedRaceMarks.length > 0
  );

  const hasRegulatoryAcknowledged =
    regattaAcknowledgements.cleanRegatta &&
    regattaAcknowledgements.signOn &&
    regattaAcknowledgements.safetyBriefing;

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

  // Handle race completion - trigger post-race interview
  const handleRaceComplete = useCallback(async (sessionId: string, raceName: string, raceId?: string) => {
    logger.debug('Race completed:', sessionId, raceName, raceId);

    // Fetch GPS point count from the session
    try {
      const { data: session } = await supabase
        .from('race_timer_sessions')
        .select('track_points')
        .eq('id', sessionId)
        .single();

      const pointCount = Array.isArray(session?.track_points) ? session.track_points.length : 0;
      setCompletedSessionGpsPoints(pointCount);
    } catch (error) {
      logger.warn('Failed to fetch GPS points count', error);
      setCompletedSessionGpsPoints(0);
    }

    setCompletedSessionId(sessionId);
    setCompletedRaceName(raceName);
    setCompletedRaceId(raceId || null);
    setShowPostRaceInterview(true);
  }, []);

  // Handle post-race interview completion
  const handlePostRaceInterviewComplete = useCallback(() => {
    logger.debug('Post-race interview completed');
    setShowPostRaceInterview(false);
    setCompletedSessionId(null);
    setCompletedRaceName('');
    setCompletedRaceId(null);
    setCompletedSessionGpsPoints(0);
    loadUserPostRaceSession();
    // Refresh races data to show updated analysis
    refetch?.();
  }, [loadUserPostRaceSession, refetch]);

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

  const normalizeCourseMarkType = (type?: string | null): string => {
    if (!type) return 'custom';

    switch (type) {
      case 'start_pin':
      case 'pin':
        return 'pin';
      case 'start_boat':
      case 'committee':
      case 'committee_boat':
        return 'committee_boat';
      case 'gate_port':
      case 'gate_left':
        return 'gate_left';
      case 'gate_starboard':
      case 'gate_right':
        return 'gate_right';
      case 'windward_mark':
        return 'windward';
      case 'leeward_mark':
        return 'leeward';
      default:
        return type;
    }
  };

  // Handle adding a new mark
  const handleMarkAdded = useCallback(async (mark: Omit<any, 'id'>) => {
    if (!selectedRaceId) return;

    try {
      logger.debug('Adding new mark:', mark);

      const raceEventId = await ensureRaceEventId();
      if (!raceEventId) {
        throw new Error('Unable to resolve race event ID');
      }

      const markName = mark.name || mark.mark_name || 'Custom Mark';
      const markType = mark.mark_type || 'custom';

      // Check if mark already exists to prevent duplicates
      const { data: existingMarks } = await supabase
        .from('race_marks')
        .select('id')
        .eq('race_id', raceEventId)
        .eq('name', markName)
        .eq('mark_type', markType)
        .limit(1);

      if (existingMarks && existingMarks.length > 0) {
        logger.debug('Mark already exists, skipping insert:', markName);
        return;
      }

      // Prepare insert payload using only supported columns
      const insertPayload: any = {
        race_id: raceEventId,
        name: markName,
        mark_type: markType,
        latitude: mark.latitude,
        longitude: mark.longitude,
        sequence_order: typeof mark.sequence_order === 'number' ? mark.sequence_order : 0,
        is_custom: true,
      };

      const { data: newMark, error } = await supabase
        .from('race_marks')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        // If it's a duplicate key error, silently ignore it
        if (error.code === '23505') {
          logger.debug('Mark already exists (race condition), ignoring:', markName);
          return;
        }
        throw error;
      }

      logger.debug('Mark added successfully:', newMark);

      // Update local state
      setSelectedRaceMarks((prev: any[]) => [
        ...prev,
        {
          id: newMark.id,
          mark_name: newMark.name,
          mark_type: newMark.mark_type,
          latitude: newMark.latitude,
          longitude: newMark.longitude,
          sequence_order: 0,
        }
      ]);
    } catch (error) {
      logger.error('Error adding mark:', error);
    }
  }, [ensureRaceEventId, selectedRaceId]);

  // Handle updating a mark's position
  const handleMarkUpdated = useCallback(async (mark: any) => {
    try {
      logger.debug('Updating mark:', mark.id);

      const { error } = await supabase
        .from('race_marks')
        .update({
          latitude: mark.latitude,
          longitude: mark.longitude,
        })
        .eq('id', mark.id);

      if (error) throw error;

      logger.debug('Mark updated successfully');

      // Update local state
      setSelectedRaceMarks((prev: any[]) =>
        prev.map((m: any) =>
          m.id === mark.id
            ? {
                ...m,
                latitude: mark.latitude,
                longitude: mark.longitude,
              }
            : m
        )
      );
    } catch (error) {
      logger.error('Error updating mark:', error);
    }
  }, []);

  // Handle deleting a mark
  const handleMarkDeleted = useCallback(async (markId: string) => {
    try {
      logger.debug('Deleting mark:', markId);

      const { error } = await supabase
        .from('race_marks')
        .delete()
        .eq('id', markId);

      if (error) throw error;

      logger.debug('Mark deleted successfully');

      // Update local state
      setSelectedRaceMarks((prev: any[]) => prev.filter((m: any) => m.id !== markId));
    } catch (error) {
      logger.error('Error deleting mark:', error);
    }
  }, []);

  const handleBulkMarksUpdate = useCallback(async (updatedMarks: any[]) => {
    if (!updatedMarks || updatedMarks.length === 0) {
      return;
    }

    try {
      logger.debug('Bulk updating marks:', updatedMarks.length);

      const updates = updatedMarks.map((mark) => {
        const lat = mark.latitude ?? mark.coordinates_lat;
        const lng = mark.longitude ?? mark.coordinates_lng;
        return supabase
          .from('race_marks')
          .update({
            latitude: lat,
            longitude: lng,
          })
          .eq('id', mark.id);
      });

      const results = await Promise.allSettled(updates);
      const rejected = results.filter(result => result.status === 'rejected');
      if (rejected.length > 0) {
        throw new Error(`${rejected.length} mark updates failed`);
      }

      setSelectedRaceMarks(
        updatedMarks.map((mark) => ({
          ...mark,
          latitude: mark.latitude ?? mark.coordinates_lat,
          longitude: mark.longitude ?? mark.coordinates_lng,
        }))
      );
    } catch (error) {
      logger.error('Error bulk updating marks:', error);
    }
  }, []);

  const selectedRaceVenueCoordinates = useMemo(() => {
    // 1. First check explicit venue_lat/venue_lng
    if (selectedRaceData?.metadata?.venue_lat && selectedRaceData?.metadata?.venue_lng) {
      return {
        lat: selectedRaceData.metadata.venue_lat,
        lng: selectedRaceData.metadata.venue_lng,
      };
    }

    // 2. Check racing_area_coordinates (common format from race creation)
    const racingAreaCoords = selectedRaceData?.metadata?.racing_area_coordinates;
    if (racingAreaCoords?.lat && racingAreaCoords?.lng) {
      return {
        lat: racingAreaCoords.lat,
        lng: racingAreaCoords.lng,
      };
    }

    // 3. Check venue_coordinates (alternate format)
    const venueCoords = selectedRaceData?.metadata?.venue_coordinates;
    if (venueCoords?.lat && venueCoords?.lng) {
      return {
        lat: venueCoords.lat,
        lng: venueCoords.lng,
      };
    }

    // 4. Check route_waypoints (distance racing) - use first waypoint or centroid
    const waypoints = selectedRaceData?.route_waypoints;
    if (Array.isArray(waypoints) && waypoints.length > 0) {
      // Filter to waypoints with valid coordinates
      const validWaypoints = waypoints.filter(
        (wp: any) => typeof wp.latitude === 'number' && typeof wp.longitude === 'number'
      );
      if (validWaypoints.length > 0) {
        // Use centroid of all waypoints for weather (covers the race area)
        const lat = validWaypoints.reduce((sum: number, wp: any) => sum + wp.latitude, 0) / validWaypoints.length;
        const lng = validWaypoints.reduce((sum: number, wp: any) => sum + wp.longitude, 0) / validWaypoints.length;
        return { lat, lng };
      }
    }

    // 5. Check currently drawing racing area
    if (drawingRacingArea.length > 0) {
      const lat = drawingRacingArea.reduce((sum, point) => sum + point.lat, 0) / drawingRacingArea.length;
      const lng = drawingRacingArea.reduce((sum, point) => sum + point.lng, 0) / drawingRacingArea.length;
      return { lat, lng };
    }

    // 6. Calculate centroid from saved racing_area_polygon
    const polygon = selectedRaceData?.racing_area_polygon?.coordinates?.[0];
    if (Array.isArray(polygon) && polygon.length > 0) {
      const coords = polygon
        .filter((coord: any) => Array.isArray(coord) && coord.length >= 2)
        .map((coord: number[]) => ({ lat: coord[1], lng: coord[0] }));
      if (coords.length > 0) {
        const lat = coords.reduce((sum, point) => sum + point.lat, 0) / coords.length;
        const lng = coords.reduce((sum, point) => sum + point.lng, 0) / coords.length;
        return { lat, lng };
      }
    }

    // 7. No coordinates found - return undefined (don't fallback to default Hong Kong coords)
    return undefined;
  }, [drawingRacingArea, selectedRaceData]);

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

  // Load cached insights from database
  const loadCachedInsights = useCallback(async (venueId: string) => {
    try {
      const cachedInsights = await venueIntelligenceService.getVenueInsights(venueId);

      if (cachedInsights) {
        logger.info('Loaded cached venue insights from database');
        setVenueInsights(cachedInsights);
        setShowInsights(true);
      } else {
        logger.debug('No cached insights found for venue:', venueId);
        // Insights will be null, triggering auto-generation if GPS confidence is high
      }
    } catch (error: any) {
      logger.error('Error loading cached insights:', error);
    }
  }, []);

  // Get AI insights for current venue (force regenerate)
  const handleGetVenueInsights = useCallback(async (forceRegenerate = false) => {
    if (!currentVenue?.id) return;

    // If forcing regenerate, delete old insights first
    if (forceRegenerate) {
      await venueIntelligenceService.deleteInsights(currentVenue.id);
    }

    setLoadingInsights(true);
    try {
      const result = await venueAgent.analyzeVenue(currentVenue.id);

      if (result.success) {
        setVenueInsights(result.insights);
        setShowInsights(true);
      } else {
        logger.error('Failed to get venue insights:', result.error);
      }
    } catch (error: any) {
      logger.error('Error getting venue insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  }, [currentVenue?.id, venueAgent]);

  // Cache next race for offline use when it loads
  React.useEffect(() => {
    if (nextRace && user) {
      cacheNextRace(nextRace.id, user.id).catch(err =>
        logger.error('Failed to cache race:', err)
      );
    }
  }, [nextRace, user]);

  // Load cached insights from database when venue changes
  React.useEffect(() => {
    if (currentVenue?.id) {
      // Clear old insights immediately when venue changes
      setVenueInsights(null);
      setShowInsights(false);

      // Load cached insights for new venue
      loadCachedInsights(currentVenue.id);
    }
  }, [currentVenue?.id, loadCachedInsights]);

  // Trigger AI venue analysis when venue is detected (only if no cached insights)
  React.useEffect(() => {
    if (currentVenue && confidence > 0.5 && !venueInsights) {
      handleGetVenueInsights();
    }
  }, [currentVenue, confidence, venueInsights, handleGetVenueInsights]);

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

  const selectedRaceWeather = useMemo(() => {
    const metadata = (selectedRaceData?.metadata || {}) as Record<string, any>;

    const windCandidates: any[] = [];
    const currentCandidates: any[] = [];
    const tideCandidates: any[] = [];

    if (metadata.weather?.wind) windCandidates.push(metadata.weather.wind);
    if (metadata.wind) windCandidates.push(metadata.wind);
    if (metadata.expected_wind_direction || metadata.expected_wind_speed) {
      windCandidates.push({
        direction: metadata.expected_wind_direction,
        speed: metadata.expected_wind_speed,
        speedMin:
          metadata.expected_wind_speed_min ??
          metadata.expected_wind_min ??
          metadata.wind_speed_min,
        speedMax:
          metadata.expected_wind_speed_max ??
          metadata.expected_wind_max ??
          metadata.wind_speed_max,
        gust: metadata.expected_wind_gust ?? metadata.wind_gust,
      });
    }
    if ((selectedRaceData as any)?.wind) windCandidates.push((selectedRaceData as any).wind);
    if (matchedEnrichedRace?.wind) windCandidates.push(matchedEnrichedRace.wind);
    if (raceWeather?.wind) {
      windCandidates.push({
        direction: raceWeather.wind.direction,
        speedMin: raceWeather.wind.speedMin,
        speedMax: raceWeather.wind.speedMax,
      });
    }
    if (!selectedRaceData && selectedDemoRace?.wind) {
      windCandidates.push(selectedDemoRace.wind);
    }

    if (metadata.weather?.current) currentCandidates.push(metadata.weather.current);
    if (metadata.current) currentCandidates.push(metadata.current);
    if (metadata.current_conditions) currentCandidates.push(metadata.current_conditions);
    if ((selectedRaceData as any)?.current) currentCandidates.push((selectedRaceData as any).current);
    if (matchedEnrichedRace?.current) currentCandidates.push(matchedEnrichedRace.current);
    if (!selectedRaceData && selectedDemoRace?.current) {
      currentCandidates.push(selectedDemoRace.current);
    }
    if (metadata.expected_current_direction || metadata.expected_current_speed) {
      currentCandidates.push({
        direction: metadata.expected_current_direction,
        speed: metadata.expected_current_speed,
        type: metadata.expected_current_state,
      });
    }

    if (metadata.weather?.tide) tideCandidates.push(metadata.weather.tide);
    if (metadata.tide) tideCandidates.push(metadata.tide);
    if (matchedEnrichedRace?.tide) tideCandidates.push(matchedEnrichedRace.tide);
    if (raceWeather?.tide) {
      tideCandidates.push({
        direction: raceWeather.tide.direction,
        state: raceWeather.tide.state,
      });
    }
    if (!selectedRaceData && selectedDemoRace?.tide) {
      tideCandidates.push(selectedDemoRace.tide);
    }
    if (metadata.expected_tide_direction || metadata.expected_tide_state) {
      tideCandidates.push({
        direction: metadata.expected_tide_direction,
        state: metadata.expected_tide_state,
      });
    }

    // Allow tide metadata to act as a fallback current reference
    tideCandidates.forEach((tide) => {
      if (!tide) return;
      currentCandidates.push({
        direction: tide.direction,
        type: tide.type ?? tide.state,
        speed: tide.speed ?? tide.knots ?? tide.rate,
      });
    });

    let windSnapshot: TacticalWindSnapshot | undefined;
    for (const candidate of windCandidates) {
      const snapshot = extractWindSnapshot(candidate);
      if (snapshot) {
        windSnapshot = snapshot;
        break;
      }
    }

    let currentSnapshot: TacticalCurrentSnapshot | undefined;
    for (const candidate of currentCandidates) {
      const snapshot = extractCurrentSnapshot(candidate);
      if (snapshot) {
        currentSnapshot = snapshot;
        break;
      }
    }

    if (!windSnapshot && !currentSnapshot) {
      return null;
    }

    return {
      wind: windSnapshot,
      current: currentSnapshot,
    };
  }, [
    matchedEnrichedRace,
    raceWeather?.wind,
    raceWeather?.tide,
    selectedDemoRace,
    selectedRaceData,
  ]);

  const windSnapshot = useMemo(() => {
    if (!selectedRaceWeather?.wind) {
      return null;
    }

    const speed = pickNumeric([
      selectedRaceWeather.wind.speed,
      (selectedRaceWeather.wind as any).speedMin,
      (selectedRaceWeather.wind as any).speedMax,
    ]);
    const direction = normalizeDirection(selectedRaceWeather.wind.direction);

    if (speed === null || direction === null) {
      return null;
    }

    return {
      speed,
      direction,
      gust: pickNumeric([
        selectedRaceWeather.wind.gust,
        (selectedRaceWeather.wind as any).gustMax,
        (selectedRaceWeather.wind as any).speedMax,
      ]) ?? undefined,
      forecast: (selectedRaceWeather.wind as any).forecast,
    };
  }, [selectedRaceWeather]);

  const currentSnapshot = useMemo(() => {
    if (!selectedRaceWeather?.current) {
      return null;
    }

    const speed = pickNumeric([
      selectedRaceWeather.current.speed,
      (selectedRaceWeather.current as any).knots,
      (selectedRaceWeather.current as any).speedMin,
      (selectedRaceWeather.current as any).speedMax,
    ]);
    const direction = normalizeDirection(selectedRaceWeather.current.direction);

    if (speed === null || direction === null) {
      return null;
    }

    return {
      speed,
      direction,
      type: normalizeCurrentType(selectedRaceWeather.current.type),
    };
  }, [selectedRaceWeather]);

  const boatDraftValue = useMemo(() => {
    const metadata = selectedRaceData?.metadata;
    if (!metadata) return null;

    return pickNumeric([
      metadata.boat_draft,
      metadata.draft,
      metadata.keel_depth,
      metadata.draft_meters,
    ]);
  }, [selectedRaceData]);

  const boatLengthValue = useMemo(() => {
    const metadata = selectedRaceData?.metadata;
    if (!metadata) return null;

    return pickNumeric([
      metadata.boat_length,
      metadata.loa,
      metadata.length_overall,
      metadata.lwl,
    ]);
  }, [selectedRaceData]);

  const timeToStartMinutes = useMemo(() => {
    if (!selectedRaceData?.start_date) return null;
    const startTime = new Date(selectedRaceData.start_date).getTime();
    if (!Number.isFinite(startTime)) {
      return null;
    }
    const diffMinutes = (startTime - Date.now()) / (1000 * 60);
    return Number.isFinite(diffMinutes) ? diffMinutes : null;
  }, [selectedRaceData?.start_date]);

  const boatSpeedKnots = useMemo(() => {
    if (!gpsPosition || typeof gpsPosition.speed !== 'number') {
      return undefined;
    }
    return gpsPosition.speed;
  }, [gpsPosition]);

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
    logger.debug('Waiting for auth to be ready');
    return <DashboardSkeleton />;
  }

  // Loading state - AFTER all hooks
  // Show skeleton if: 
  // 1. Dashboard is loading and no profile yet, OR
  // 2. User is signed in but races haven't loaded yet (prevents flash of demo content)
  if ((loading && !profile) || (signedIn && liveRacesLoading && !hasLoadedRacesOnce.current)) {
    logger.debug('Loading skeleton', { loading, hasProfile: !!profile, signedIn, liveRacesLoading, hasLoadedOnce: hasLoadedRacesOnce.current });
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

  return (
    <View className="flex-1 bg-gray-50">
      <PlanModeLayout
        raceId={selectedRaceId}
        raceData={selectedRaceData}
      >
            {/* Header */}
            <View className="bg-primary-500 pt-10 pb-2 px-4">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-white text-lg font-bold">Races</Text>
          <View className="flex-row gap-2 items-center">
            {!isOnline && <OfflineIndicator />}
            <AccessibleTouchTarget
              onPress={() => router.push('/notifications')}
              accessibilityLabel="Notifications"
              accessibilityHint="View your notifications and alerts"
              className="bg-primary-600 rounded-full p-1"
            >
              <Bell color="white" size={18} />
            </AccessibleTouchTarget>
          </View>
        </View>

        {/* Venue Display */}
        {currentVenue && (
          <TouchableOpacity
            className="flex-row items-center"
            onPress={handleVenuePress}
            accessibilityLabel={`Current venue: ${currentVenue.name}`}
            accessibilityHint="Tap to view venue details or change venue"
            accessibilityRole="button"
            style={{ minHeight: 32 }}
          >
            <MapPin color="white" size={12} />
            <View className="flex-row items-center flex-1">
              <Text className="text-white text-xs ml-1">{currentVenue.name}</Text>
              {(loadingInsights || weatherLoading) && (
                <ActivityIndicator size="small" color="white" className="ml-1" />
              )}
              {!weatherLoading && raceWeather && (
                <Text className="text-white/70 text-[10px] ml-1">
                  (HKO)
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>


      {/* Main Content */}
      <ScrollView
        ref={mainScrollViewRef}
        className="px-4 py-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isDemoProfile && (
          <View className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-4">
            <Text className="text-indigo-900 text-sm font-semibold">
              You’re exploring a demo workspace
            </Text>
            <Text className="text-indigo-700 text-xs mt-1 leading-4">
              All races, boats, and analytics below are sample data. Add your own boat or claim your workspace to start syncing real results.
            </Text>
            <Button
              size="sm"
              className="mt-3 self-start"
              onPress={handleClaimWorkspace}
            >
              <ButtonText>Claim my workspace</ButtonText>
            </Button>
          </View>
        )}
        {/* RACE CARDS - MULTIPLE RACES SIDE-BY-SIDE */}
        {hasRealRaces ? (
          // User has real races - show all upcoming races
          <>
            <View className="mb-3 flex-row items-center justify-between">
              <View>
                <Text className="text-base font-bold text-gray-800">All Races</Text>
                <Text className="text-xs text-gray-500">Swipe to view all races chronologically</Text>
              </View>
              <View className="bg-blue-100 px-3 py-1 rounded-full">
                <Text className="text-blue-800 font-semibold text-sm">
                  {safeRecentRaces.length} races
                </Text>
              </View>
            </View>
            <ScrollView
              ref={raceCardsScrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerStyle={{ paddingRight: 16 }}
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
            >
              {(() => {
                let addRaceCardInserted = false;
                const cardElements: React.ReactNode[] = [];

                safeRecentRaces.forEach((race: any, index: number) => {
                  const isNextRace = !!(safeNextRace?.id && race.id === safeNextRace.id);
                  const raceStatus = getRaceStatus(race.date || new Date().toISOString(), isNextRace);
                  const shouldInsertAddCardBefore = !addRaceCardInserted && isNextRace;

                  if (shouldInsertAddCardBefore) {
                    cardElements.push(
                      <AddRaceTimelineCard
                        key="add-race-cta"
                        onAddRace={handleAddRaceNavigation}
                        onImportCalendar={handleOpenCalendarImport}
                        hasRealRaces={hasRealRaces}
                      />,
                    );
                    addRaceCardInserted = true;
                  }

                  // Get results for this race if it's past
                  const raceResult = raceStatus === 'past' && race.id ? userRaceResults.get(race.id) : undefined;
                  const resultsData = raceResult ? {
                    position: raceResult.position,
                    points: raceResult.points,
                    fleetSize: raceResult.fleetSize,
                    status: raceResult.status,
                    seriesPosition: raceResult.seriesPosition,
                    totalRaces: raceResult.totalRaces,
                  } : undefined;

                  // Auto-detect distance races based on name patterns if race_type not set
                  // Patterns: "Around...", "Round...", "Circumnavigation", "Offshore", "Distance Race", "Passage Race"
                  const isDistanceRace = race.race_type === 'distance' || (
                    race.name && (
                      /\baround\b/i.test(race.name) ||           // "Around the Island", "Around Hong Kong"
                      /\bround\s+the\b/i.test(race.name) ||      // "Round the Island"
                      /circumnavigation/i.test(race.name) ||
                      /\boffshore\b/i.test(race.name) ||
                      /distance\s*race/i.test(race.name) ||
                      /passage\s*race/i.test(race.name) ||
                      /point.*to.*point/i.test(race.name) ||
                      /ocean\s*race/i.test(race.name) ||
                      /coastal\s*race/i.test(race.name)
                    )
                  );

                  // Render DistanceRaceCard for distance races, RaceCard for fleet races
                  if (isDistanceRace) {
                    cardElements.push(
                      <DistanceRaceCard
                        key={race.id || index}
                        id={race.id}
                        name={race.name}
                        date={race.date || new Date().toISOString()}
                        startTime={race.startTime || '10:00'}
                        startVenue={race.venue || 'Unknown Venue'}
                        finishVenue={race.start_finish_same_location === false ? race.finish_venue : undefined}
                        totalDistanceNm={race.total_distance_nm}
                        timeLimitHours={race.time_limit_hours}
                        routeWaypoints={race.route_waypoints}
                        courseName={race.metadata?.selected_course_name}
                        wind={race.wind}
                        vhf_channel={race.vhf_channel || race.critical_details?.vhf_channel}
                        isPrimary={isNextRace}
                        raceStatus={raceStatus}
                        isSelected={selectedRaceId === race.id}
                        onSelect={() => {
                          setHasManuallySelected(true);
                          setSelectedRaceId(race.id);
                        }}
                        onEdit={race.created_by === user?.id ? () => handleEditRace(race.id) : undefined}
                        onDelete={race.created_by === user?.id ? () => handleDeleteRace(race.id, race.name) : undefined}
                        isDimmed={hasActiveRace && selectedRaceId !== race.id}
                      />,
                    );
                  } else {
                    // Default: Fleet racing card
                    cardElements.push(
                      <RaceCard
                        key={race.id || index}
                        id={race.id}
                        name={race.name}
                        venue={race.venue || 'Unknown Venue'}
                        date={race.date || new Date().toISOString()}
                        startTime={race.startTime || '10:00'}
                        courseName={race.metadata?.selected_course_name}
                        wind={race.wind}
                        tide={race.tide}
                        weatherStatus={race.weatherStatus}
                        weatherError={race.weatherError}
                        strategy={race.strategy || 'Race strategy will be generated based on conditions.'}
                        critical_details={race.critical_details}
                        vhf_channel={race.vhf_channel}
                        venueCoordinates={race.venueCoordinates}
                        isPrimary={isNextRace}
                        raceStatus={raceStatus}
                        onRaceComplete={(sessionId) => handleRaceComplete(sessionId, race.name, race.id)}
                        isSelected={selectedRaceId === race.id}
                        onSelect={() => {
                          setHasManuallySelected(true);
                          setSelectedRaceId(race.id);
                        }}
                        onEdit={race.created_by === user?.id ? () => handleEditRace(race.id) : undefined}
                        onDelete={race.created_by === user?.id ? () => handleDeleteRace(race.id, race.name) : undefined}
                        onHide={race.created_by !== user?.id ? () => handleHideRace(race.id, race.name) : undefined}
                        isDimmed={hasActiveRace && selectedRaceId !== race.id}
                        results={resultsData}
                      />,
                    );
                  }
                });

                if (!addRaceCardInserted) {
                  cardElements.unshift(
                    <AddRaceTimelineCard
                      key="add-race-cta"
                      onAddRace={handleAddRaceNavigation}
                      onImportCalendar={handleOpenCalendarImport}
                      hasRealRaces={hasRealRaces}
                    />,
                  );
                }

                return cardElements;
              })()}
            </ScrollView>

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

                {/* ============================================ */}
                {/* DISTANCE RACING vs FLEET RACING CONTENT    */}
                {/* ============================================ */}
                {selectedRaceData.race_type === 'distance' ? (
                  <>
                    {/* Distance Racing: Course Selection */}
                    <View style={{ marginBottom: 16, marginHorizontal: 16 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Course Setup
                      </Text>
                      <CourseSelector
                        venueId={selectedRaceData.metadata?.venue_id}
                        venueName={selectedRaceData.metadata?.venue_name}
                        venueCoordinates={selectedRaceData.metadata?.venue_lat && selectedRaceData.metadata?.venue_lng ? {
                          lat: selectedRaceData.metadata.venue_lat,
                          lng: selectedRaceData.metadata.venue_lng,
                        } : undefined}
                        currentWindDirection={selectedRaceData.metadata?.expected_wind_direction}
                        currentWindSpeed={selectedRaceData.metadata?.expected_wind_speed}
                        onCourseSelected={async (marks, courseName) => {
                          // Convert marks to route waypoints format for distance racing
                          // Preserve the original type from the mark (gate, start, finish, etc.)
                          const waypoints = marks.map((mark) => {
                            // Map mark types to waypoint types
                            let waypointType: 'start' | 'waypoint' | 'gate' | 'finish' = 'waypoint';
                            const markType = mark.type?.toLowerCase() || '';
                            
                            if (markType === 'committee_boat' || markType.includes('start')) {
                              waypointType = 'start';
                            } else if (markType === 'finish' || markType.includes('finish')) {
                              waypointType = 'finish';
                            } else if (markType.includes('gate')) {
                              waypointType = 'gate';
                            }
                            
                            return {
                              name: mark.name,
                              latitude: mark.latitude,
                              longitude: mark.longitude,
                              type: waypointType,
                              required: true,
                              passingSide: mark.passingSide,
                              notes: mark.notes,
                            };
                          });
                          
                          // Update route waypoints and course name in selectedRaceData (local state)
                          setSelectedRaceData((prev: any) => ({
                            ...prev,
                            route_waypoints: waypoints,
                            metadata: {
                              ...prev?.metadata,
                              selected_course_name: courseName,
                            },
                          }));
                          
                          // Persist waypoints and course name to database
                          if (selectedRaceData?.id) {
                            try {
                              const { error } = await supabase
                                .from('regattas')
                                .update({ 
                                  route_waypoints: waypoints,
                                  metadata: {
                                    ...selectedRaceData.metadata,
                                    selected_course_name: courseName,
                                  },
                                  updated_at: new Date().toISOString(),
                                })
                                .eq('id', selectedRaceData.id);
                              
                              if (error) {
                                logger.error('[races] Error saving waypoints to database:', error);
                              } else {
                                logger.info('[races] Waypoints and course name saved to database for race:', selectedRaceData.id, courseName);
                              }
                            } catch (err) {
                              logger.error('[races] Exception saving waypoints:', err);
                            }
                          }
                          
                          logger.info('[races] Course template selected for distance race:', marks.length, 'waypoints, courseName:', courseName);
                        }}
                        raceType="distance"
                      />
                    </View>

                    {/* Distance Racing: Pre-Race Briefing - only for future races */}
                    {isRaceFuture && (
                      <PreRaceBriefingCard
                        raceId={selectedRaceData.id}
                        raceName={selectedRaceData.name}
                        raceDate={selectedRaceData.start_date}
                        venueName={selectedRaceData.metadata?.venue_name}
                        boatClassName={selectedRaceData.metadata?.class_name}
                        routeWaypoints={selectedRaceData.route_waypoints}
                        totalDistanceNm={selectedRaceData.total_distance_nm}
                      />
                    )}

                    {/* Distance Racing: Route Map with Waypoints */}
                    <RouteMapCard
                      waypoints={selectedRaceData.route_waypoints || []}
                      totalDistanceNm={selectedRaceData.total_distance_nm}
                      raceId={selectedRaceData.id}
                      onEditRoute={selectedRaceData.created_by === user?.id ? () => {
                        router.push(`/race/edit/${selectedRaceData.id}`);
                      } : undefined}
                    />

                    {/* Distance Racing: Weather Along Route */}
                    <WeatherAlongRouteCard
                      waypoints={selectedRaceData.route_waypoints || []}
                      raceDate={selectedRaceData.start_date}
                    />
                  </>
                ) : (
                  <>
                    {/* Fleet Racing: Course Selection */}
                    <View style={{ marginBottom: 16, marginHorizontal: 16 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Course Setup
                      </Text>
                      <CourseSelector
                        venueId={selectedRaceData.metadata?.venue_id}
                        venueName={selectedRaceData.metadata?.venue_name}
                        venueCoordinates={selectedRaceData.metadata?.venue_lat && selectedRaceData.metadata?.venue_lng ? {
                          lat: selectedRaceData.metadata.venue_lat,
                          lng: selectedRaceData.metadata.venue_lng,
                        } : undefined}
                        currentWindDirection={selectedRaceData.metadata?.expected_wind_direction}
                        currentWindSpeed={selectedRaceData.metadata?.expected_wind_speed}
                        onCourseSelected={async (marks, courseName) => {
                          // Update marks state
                          setSelectedRaceMarks(marks);
                          logger.info('[races] Course template selected with marks:', marks.length, 'courseName:', courseName);
                          
                          // Update local state with course name
                          if (courseName) {
                            setSelectedRaceData((prev: any) => ({
                              ...prev,
                              metadata: {
                                ...prev?.metadata,
                                selected_course_name: courseName,
                              },
                            }));
                          }
                          
                          // Save marks to database for fleet racing
                          if (selectedRaceData?.id && marks.length > 0) {
                            try {
                              // Ensure race_event_id exists
                              const raceEventId = await ensureRaceEventId();
                              if (!raceEventId) {
                                logger.error('[races] Could not get race_event_id for saving marks');
                                return;
                              }
                              
                              // Delete existing marks for this race first
                              const { error: deleteError } = await supabase
                                .from('race_marks')
                                .delete()
                                .eq('race_event_id', raceEventId);
                              
                              if (deleteError) {
                                logger.error('[races] Error deleting old marks:', deleteError);
                              }
                              
                              // Insert new marks
                              const marksToInsert = marks.map((mark, index) => ({
                                race_event_id: raceEventId,
                                name: mark.name || `Mark ${index + 1}`,
                                mark_type: mark.type || 'custom',
                                latitude: mark.latitude,
                                longitude: mark.longitude,
                                sequence_order: index + 1,
                              }));
                              
                              const { error: insertError } = await supabase
                                .from('race_marks')
                                .insert(marksToInsert);
                              
                              if (insertError) {
                                logger.error('[races] Error saving marks to database:', insertError);
                              } else {
                                logger.info('[races] Marks saved to database for race:', selectedRaceData.id);
                              }
                              
                              // Save course name to race metadata
                              if (courseName) {
                                const { error: metadataError } = await supabase
                                  .from('regattas')
                                  .update({
                                    metadata: {
                                      ...selectedRaceData.metadata,
                                      selected_course_name: courseName,
                                    },
                                    updated_at: new Date().toISOString(),
                                  })
                                  .eq('id', selectedRaceData.id);
                                
                                if (metadataError) {
                                  logger.error('[races] Error saving course name to metadata:', metadataError);
                                } else {
                                  logger.info('[races] Course name saved to metadata:', courseName);
                                }
                              }
                            } catch (err) {
                              logger.error('[races] Exception saving marks:', err);
                            }
                          }
                        }}
                        raceType="fleet"
                      />
                    </View>

                    {/* Fleet Racing: Tactical Race Map */}
                    <RaceDetailMapHero
                      race={{
                        id: selectedRaceData.id,
                        race_name: selectedRaceData.name,
                        start_time: selectedRaceData.start_date,
                        venue: selectedRaceData.metadata?.venue_name ? {
                          name: selectedRaceData.metadata.venue_name,
                          coordinates_lat: selectedRaceData.metadata?.venue_lat || 22.2650,
                          coordinates_lng: selectedRaceData.metadata?.venue_lng || 114.2620,
                        } : undefined,
                        racing_area_polygon: selectedRaceData.racing_area_polygon,
                        boat_class: selectedRaceData.metadata?.class_name ? {
                          name: selectedRaceData.metadata.class_name
                        } : undefined,
                      }}
                      marks={selectedRaceMarks}
                      compact={false}
                      racingAreaPolygon={
                        drawingRacingArea.length > 0
                          ? drawingRacingArea
                          : selectedRaceData.racing_area_polygon?.coordinates?.[0]?.map((coord: number[]) => ({
                              lat: coord[1],
                              lng: coord[0]
                            }))
                      }
                      onRacingAreaChange={handleRacingAreaChange}
                      onSaveRacingArea={handleSaveRacingArea}
                      onMarkAdded={handleMarkAdded}
                      onMarkUpdated={handleMarkUpdated}
                      onMarkDeleted={handleMarkDeleted}
                      onMarksBulkUpdate={handleBulkMarksUpdate}
                    />
                  </>
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

                {/* Fleet Racing Strategy Cards - Only shown for fleet races AND future races */}
                {/* For past races: hide AI strategy guidance - no longer actionable */}
                {selectedRaceData.race_type !== 'distance' && isRaceFuture && (
                  <>
                    {/* Start Strategy */}
                    <StartStrategyCard
                      raceId={selectedRaceData.id}
                      raceName={selectedRaceData.name}
                      raceStartTime={selectedRaceData.start_date}
                      venueId={selectedRaceData.metadata?.venue_id}
                      venueName={selectedRaceData.metadata?.venue_name}
                      venueCoordinates={selectedRaceData.metadata?.venue_lat ? {
                        lat: selectedRaceData.metadata.venue_lat,
                        lng: selectedRaceData.metadata.venue_lng
                      } : undefined}
                      racingAreaPolygon={
                        Array.isArray(selectedRaceData.racing_area_polygon?.coordinates?.[0]) &&
                        selectedRaceData.racing_area_polygon.coordinates[0].length >= 3
                          ? selectedRaceData.racing_area_polygon.coordinates[0]
                              .slice(
                                0,
                                selectedRaceData.racing_area_polygon.coordinates[0].length - 1
                              )
                              .map((coord: number[]) => ({ lat: coord[1], lng: coord[0] }))
                          : undefined
                      }
                      sailorId={sailorId}
                      raceEventId={selectedRaceData.id}
                    />

                    {/* Upwind Strategy - Dedicated Beats Card */}
                    <UpwindStrategyCard
                      raceId={selectedRaceData.id}
                      raceName={selectedRaceData.name}
                      sailorId={sailorId}
                      raceEventId={selectedRaceData.id}
                      venueId={selectedRaceData.metadata?.venue_id}
                      venueName={selectedRaceData.metadata?.venue_name}
                    />

                    {/* Downwind Strategy - Dedicated Runs Card */}
                    <DownwindStrategyCard
                      raceId={selectedRaceData.id}
                      raceName={selectedRaceData.name}
                      sailorId={sailorId}
                      raceEventId={selectedRaceData.id}
                    />

                    {/* Community Local Knowledge */}
                    {selectedRaceData.metadata?.venue_id && selectedRaceData.metadata?.venue_name && (
                      <CommunityTipsCard
                        venueId={selectedRaceData.metadata.venue_id}
                        venueName={selectedRaceData.metadata.venue_name}
                        compact={true}
                      />
                    )}

                    {/* Mark Rounding Strategy */}
                    <MarkRoundingCard
                      raceId={selectedRaceData.id}
                      raceName={selectedRaceData.name}
                      sailorId={sailorId}
                      raceEventId={selectedRaceData.id}
                    />

                    {/* Contingency Plans - What-if scenarios */}
                    <ContingencyPlansCard
                      raceId={selectedRaceData.id}
                    />
                  </>
                )}

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
                            onPress={() => setShowCoachSelectionModal(true)}
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
                        expectedDurationMinutes={selectedRaceData.time_limit_minutes || 90}
                        savedWind={selectedRaceEnrichedWeather?.wind || selectedRaceData.metadata?.wind}
                        savedTide={selectedRaceEnrichedWeather?.tide || selectedRaceData.metadata?.tide}
                        savedWeatherFetchedAt={selectedRaceEnrichedWeather?.weatherFetchedAt || selectedRaceData.metadata?.weather_fetched_at}
                        raceStatus={selectedRaceData.raceStatus}
                      />
                    </>
                  ),
                  boatSetup: (
                    <>
                      {/* Class not set warning - only show for future races */}
                      {isRaceFuture && !selectedRaceClassId && (
                        <View className="flex-row items-start gap-2 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                          <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#b45309" style={{ marginTop: 2 }} />
                          <View className="flex-1">
                            <Text className="text-xs font-semibold text-amber-700">Class not set yet</Text>
                            <Text className="text-xs text-amber-600 mt-1">
                              Select a boat class to unlock rig tuning checklists and class-based start sequences.
                            </Text>
                            <Pressable onPress={handleEditSelectedRace} className="flex-row items-center gap-1 mt-2">
                              <MaterialCommunityIcons name="pencil" size={14} color="#b45309" />
                              <Text className="text-xs font-semibold text-amber-700">Set class</Text>
                            </Pressable>
                          </View>
                        </View>
                      )}

                      {/* AI Rig Tuning Guidance - only show for future races */}
                      {isRaceFuture && (
                        <RigTuningCard
                          raceId={selectedRaceData.id}
                          boatClassName={selectedRaceClassName}
                          recommendation={selectedRaceTuningRecommendation}
                          loading={selectedRaceTuningLoading}
                          onRefresh={selectedRaceClassId ? refreshSelectedRaceTuning : undefined}
                        />
                      )}

                      {/* User's Rig & Sail Planner Notes - always show */}
                      <RigPlannerCard
                        presets={rigPresets}
                        selectedBand={selectedRigBand}
                        onSelectBand={(bandId) => setSelectedRigBand(bandId)}
                        notes={rigNotes}
                        onChangeNotes={setRigNotes}
                        onOpenChat={isRaceFuture ? handleOpenChatFromRigPlanner : undefined}
                      />
                    </>
                  ),
                  teamAndLogistics: (
                    <>
                      <View
                        onLayout={({ nativeEvent }) => {
                          const positionY = nativeEvent.layout.y;
                          setLogisticsSectionY((prev) => (Math.abs(prev - positionY) > 4 ? positionY : prev));
                        }}
                      >
                        <CrewEquipmentCard
                          raceId={selectedRaceData.id}
                          classId={selectedRaceData.class_id || selectedRaceData.metadata?.class_id}
                          raceDate={selectedRaceData.start_date}
                          onManageCrew={() =>
                            handleManageCrewNavigation({
                              raceId: selectedRaceData.id,
                              classId: selectedRaceData.class_id || selectedRaceData.metadata?.class_id,
                              className: selectedRaceClassName || selectedRaceData.metadata?.class_name,
                              raceName: selectedRaceData.name || selectedRaceData.race_name,
                              raceDate: selectedRaceData.start_date,
                            })
                          }
                        />

                        <FleetRacersCard
                          raceId={selectedRaceData.id}
                          classId={selectedRaceData.metadata?.class_name}
                          venueId={selectedRaceData.metadata?.venue_id}
                          onJoinFleet={(fleetId) => {
                            logger.debug('Joined fleet:', fleetId);
                          }}
                        />

                        {/* Documents card disabled - requires authentication
                        <RaceDocumentsCard
                          raceId={selectedRaceData.id}
                          documents={isDemoSession ? undefined : raceDocumentsForDisplay}
                          isLoading={!isDemoSession && (loadingRaceDocuments || isUploadingRaceDocument)}
                          error={isDemoSession ? null : raceDocumentsError}
                          onRetry={isDemoSession ? undefined : handleRefreshRaceDocuments}
                          onUpload={handleUploadRaceDocument}
                          onDocumentPress={(doc) => {
                            logger.debug('Document pressed:', doc);
                          }}
                          onShareWithFleet={(docId) => {
                            logger.debug('Share document with fleet:', docId);
                          }}
                        />
                        */}
                      </View>
                    </>
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
                    <>
                      <PostRaceAnalysisCard
                        raceId={selectedRaceData.id}
                        raceName={selectedRaceData.name}
                        raceStartTime={selectedRaceData.start_date}
                      />
                      <View className="flex-row flex-wrap gap-2 mt-4">
                        <Pressable
                          className="flex-row items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200"
                          onPress={handleShareRaceAnalysis}
                        >
                          <Text className="text-sm font-semibold text-blue-700">Share summary</Text>
                        </Pressable>
                        <Pressable
                          className="flex-row items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200"
                          onPress={() => {
                            logger.debug('[races.tsx] Export race analysis');
                            Alert.alert('Export', 'Race analysis export coming soon!');
                          }}
                        >
                          <Text className="text-sm font-semibold text-slate-700">Export data</Text>
                        </Pressable>
                      </View>
                      <View className="mt-4">
                        <FleetPostRaceInsights
                          raceId={selectedRaceData.id}
                          currentUserId={user?.id}
                          onViewSession={(sessionId) =>
                            router.push({
                              pathname: '/(tabs)/race-session/[sessionId]',
                              params: { sessionId },
                            })
                          }
                        />
                      </View>
                      <View className="mt-4">
                        <PerformanceMetrics
                          gpsTrack={currentGpsTrack}
                          weather={selectedRaceWeather}
                        />
                      </View>
                      <View className="mt-4">
                        <SplitTimesAnalysis
                          splitTimes={currentSplitTimes}
                          raceStartTime={currentSplitTimes[0]?.time}
                        />
                      </View>
                      <View className="mt-4">
                        <TacticalInsights
                          gpsTrack={currentGpsTrack}
                          splitTimes={currentSplitTimes}
                          raceResult={{
                            position: 3,
                            totalBoats: 15,
                          }}
                        />
                      </View>
                      {/* Learning Patterns - For Past Races: Analyze Performance */}
                      <View className="mt-4">
                        <AIPatternDetection />
                      </View>
                    </>
                  ) : undefined,
                }}
              />
              );
            })()}
          </>
        ) : (
          // User has no races - show mock race cards horizontally
          <>
            <View className="mb-3">
              <Text className="text-base font-bold text-gray-800">Demo Races</Text>
              <Text className="text-xs text-gray-500">
                📋 Example races to get you started – use the Add Race card to drop your first real event.
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerStyle={{ paddingRight: 16, pointerEvents: 'box-none' }}
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
            >
              <AddRaceTimelineCard
                key="add-race-cta-demo"
                onAddRace={handleAddRaceNavigation}
                onImportCalendar={handleOpenCalendarImport}
                hasRealRaces={hasRealRaces}
              />
              {MOCK_RACES.map((race, index) => (
                <RaceCard
                  key={race.id}
                  id={race.id}
                  name={race.name}
                  venue={race.venue}
                  date={race.date}
                  startTime={race.startTime}
                  wind={race.wind}
                  tide={race.tide}
                  strategy={race.strategy}
                  critical_details={race.critical_details}
                  isPrimary={index === 0}
                  isMock={true}
                  isSelected={selectedDemoRaceId === race.id}
                  isDimmed={selectedDemoRaceId !== race.id}
                  onSelect={() => setSelectedDemoRaceId(race.id)}
                />
              ))}
            </ScrollView>
            {selectedDemoRace && (
              <DemoRaceDetail
                race={selectedDemoRace}
                onAddRace={handleAddRaceNavigation}
                onLogisticsSectionLayout={(y) => {
                  setLogisticsSectionY((prev) => (Math.abs(prev - y) > 4 ? y : prev));
                }}
                onRegulatorySectionLayout={(y) => {
                  setRegulatorySectionY((prev) => (Math.abs(prev - y) > 4 ? y : prev));
                }}
              />
            )}
          </>
        )}

        {/* AI Venue Insights Card */}
        {showInsights && venueInsights && (
          <Card className="mb-4 p-4 border-2 border-purple-500" variant="elevated">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Navigation color="#8B5CF6" size={20} />
                <Text className="text-lg font-bold ml-2">🤖 AI Venue Intelligence</Text>
              </View>
              <AccessibleTouchTarget
                onPress={() => setShowInsights(false)}
                accessibilityLabel="Dismiss AI venue intelligence"
                accessibilityHint="Hide this card"
              >
                <X color="#6B7280" size={20} />
              </AccessibleTouchTarget>
            </View>

            <Text className="font-bold text-purple-700 mb-1">{venueInsights.venueName}</Text>
            {venueInsights.generatedAt && (
              <Text className="text-xs text-gray-500 mb-2">
                Generated {new Date(venueInsights.generatedAt).toLocaleDateString()} at{' '}
                {new Date(venueInsights.generatedAt).toLocaleTimeString()}
              </Text>
            )}

            {/* Safety Recommendations */}
            {venueInsights.recommendations?.safety && (
              <View className="mb-3">
                <View className="flex-row items-center mb-1">
                  <AlertTriangle color="#EF4444" size={16} />
                  <Text className="font-bold text-red-600 ml-1">Safety</Text>
                </View>
                <Text className="text-sm text-gray-700 ml-5">
                  {venueInsights.recommendations.safety.split('\n')[0]}
                </Text>
              </View>
            )}

            {/* Racing Tips */}
            {venueInsights.recommendations?.racing && (
              <View className="mb-3">
                <View className="flex-row items-center mb-1">
                  <TrendingUp color="#10B981" size={16} />
                  <Text className="font-bold text-green-600 ml-1">Racing Tips</Text>
                </View>
                <Text className="text-sm text-gray-700 ml-5">
                  {venueInsights.recommendations.racing.split('\n')[0]}
                </Text>
              </View>
            )}

            {/* Cultural Notes */}
            {venueInsights.recommendations?.cultural && (
              <View className="mb-3">
                <View className="flex-row items-center mb-1">
                  <Users color="#3B82F6" size={16} />
                  <Text className="font-bold text-blue-600 ml-1">Cultural</Text>
                </View>
                <Text className="text-sm text-gray-700 ml-5">
                  {venueInsights.recommendations.cultural.split('\n')[0]}
                </Text>
              </View>
            )}

            <View className="flex-row gap-2 mt-2">
              <Button
                action="secondary"
                variant="outline"
                size="sm"
                className="flex-1"
                onPress={handleVenuePress}
              >
                <ButtonText>View Full Intelligence</ButtonText>
                <ButtonIcon as={ChevronRight} />
              </Button>
              <Button
                action="primary"
                variant="outline"
                size="sm"
                onPress={() => handleGetVenueInsights(true)}
                disabled={loadingInsights}
              >
                {loadingInsights ? (
                  <ActivityIndicator size="small" color="#8B5CF6" />
                ) : (
                  <ButtonText>🔄</ButtonText>
                )}
              </Button>
            </View>
          </Card>
        )}
      </ScrollView>

      <Modal
        visible={documentTypePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={handleDismissDocumentTypePicker}
      >
        <Pressable style={documentTypePickerStyles.overlay} onPress={handleDismissDocumentTypePicker}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={documentTypePickerStyles.sheet}>
              <Text style={documentTypePickerStyles.title}>Choose document type</Text>
              <Text style={documentTypePickerStyles.subtitle}>
                Pick the category that best matches what you are uploading.
              </Text>
              {DOCUMENT_TYPE_OPTIONS.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    documentTypePickerStyles.option,
                    index === DOCUMENT_TYPE_OPTIONS.length - 1 && documentTypePickerStyles.lastOption,
                  ]}
                  onPress={() => handleDocumentTypeOptionSelect(option.value)}
                  disabled={isUploadingRaceDocument}
                >
                  <Text style={documentTypePickerStyles.optionLabel}>{option.label}</Text>
                  <Text style={documentTypePickerStyles.optionDescription}>{option.description}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={documentTypePickerStyles.cancelButton}
                onPress={handleDismissDocumentTypePicker}
                disabled={isUploadingRaceDocument}
              >
                <Text style={documentTypePickerStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </Pressable>
      </Modal>

      {/* Calendar Import Modal */}
      <Modal
        visible={showCalendarImport}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCalendarImport(false)}
      >
        <CalendarImportFlow
          onComplete={(count) => {
            setShowCalendarImport(false);
            onRefresh(); // Refresh the race list
          }}
          onCancel={() => setShowCalendarImport(false)}
        />
      </Modal>

      {/* Post-Race Interview Modal */}
      {completedSessionId && (
        <PostRaceInterview
          visible={showPostRaceInterview}
          sessionId={completedSessionId}
          raceName={completedRaceName}
          raceId={completedRaceId || undefined}
          gpsPointCount={completedSessionGpsPoints}
          onClose={() => {
            setShowPostRaceInterview(false);
            setCompletedSessionId(null);
            setCompletedRaceName('');
            setCompletedRaceId(null);
            setCompletedSessionGpsPoints(0);
          }}
          onComplete={handlePostRaceInterviewComplete}
        />
      )}

      {/* Strategy Sharing Modal */}
      {sailorId && selectedRaceData && (
        <StrategySharingModal
          visible={showCoachSelectionModal}
          onClose={() => setShowCoachSelectionModal(false)}
          onShareComplete={(shareType, recipientName) => {
            logger.info('Strategy shared:', { shareType, recipientName });
          }}
          sailorId={sailorId}
          raceId={selectedRaceData.id}
          raceInfo={{
            id: selectedRaceData.id,
            name: selectedRaceData.name || 'Race',
            date: selectedRaceData.start_date,
            venue: selectedRaceData.metadata?.venue_name,
            boatClass: selectedRaceData.metadata?.class_name,
            weather: selectedRaceData.metadata?.wind ? {
              windSpeed: selectedRaceData.metadata.wind.speedMin,
              windSpeedMax: selectedRaceData.metadata.wind.speedMax,
              windDirection: selectedRaceData.metadata.wind.direction,
              tideState: selectedRaceData.metadata.tide?.state,
              tideHeight: selectedRaceData.metadata.tide?.height,
              currentSpeed: selectedRaceData.metadata.current?.speed,
              currentDirection: selectedRaceData.metadata.current?.direction,
              waveHeight: selectedRaceData.metadata.waves?.height,
              temperature: selectedRaceData.metadata.weather?.temperature,
            } : undefined,
            rigTuning: selectedRaceData.metadata?.rigTuning ? {
              preset: selectedRaceData.metadata.rigTuning.preset,
              windRange: selectedRaceData.metadata.rigTuning.windRange,
              settings: selectedRaceData.metadata.rigTuning.settings,
              notes: selectedRaceData.metadata.rigTuning.notes,
            } : undefined,
          }}
        />
      )}

      </PlanModeLayout>
    </View>
  );
}
