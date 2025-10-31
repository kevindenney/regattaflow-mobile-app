import {
    ContingencyPlansCard,
    CrewEquipmentCard,
    CurrentTideCard,
    DownwindStrategyCard,
    FleetRacersCard,
    MarkRoundingCard,
    PostRaceAnalysisCard,
    RaceDetailMapHero,
    RaceDocumentsCard,
    RaceOverviewCard,
    RacePhaseHeader,
    StartStrategyCard,
    UpwindStrategyCard,
    WindWeatherCard,
    RigTuningCard,
} from '@/components/race-detail';
import { CourseSelector } from '@/components/race-detail/CourseSelector';
import { CalendarImportFlow } from '@/components/races/CalendarImportFlow';
import { DemoRaceDetail } from '@/components/races/DemoRaceDetail';
import { PostRaceInterview } from '@/components/races/PostRaceInterview';
import { RaceCard } from '@/components/races/RaceCard';
import { AccessibleTouchTarget } from '@/components/ui/AccessibleTouchTarget';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorMessage } from '@/components/ui/error';
import { DashboardSkeleton } from '@/components/ui/loading';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { MOCK_RACES } from '@/constants/mockData';
import { useDashboardData } from '@/hooks/useData';
import { useOffline } from '@/hooks/useOffline';
import { useLiveRaces } from '@/hooks/useRaceResults';
import { useRaceWeather } from '@/hooks/useRaceWeather';
import { useVenueDetection } from '@/hooks/useVenueDetection';
import { createLogger } from '@/lib/utils/logger';
import { useAuth } from '@/providers/AuthProvider';
import { VenueIntelligenceAgent } from '@/services/agents/VenueIntelligenceAgent';
import { supabase } from '@/services/supabase';
import { venueIntelligenceService } from '@/services/VenueIntelligenceService';
import { useRaceTuningRecommendation } from '@/hooks/useRaceTuningRecommendation';
import { CourseLibraryService } from '@/services/CourseLibraryService';
import type { CourseScope, Mark } from '@/types/courses';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
    AlertTriangle,
    Bell,
    Calendar,
    ChevronRight,
    MapPin,
    Navigation,
    Pencil,
    Plus,
    Trash2,
    TrendingUp,
    Users,
    X
} from 'lucide-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, Platform, Pressable, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const logger = createLogger('RacesScreen');

export default function RacesScreen() {
  const auth = useAuth();
  const { user, signedIn, ready, isDemoSession } = auth;
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

  // Post-race interview state
  const [showPostRaceInterview, setShowPostRaceInterview] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [completedRaceName, setCompletedRaceName] = useState<string>('');

  // Selected race detail state
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [selectedRaceData, setSelectedRaceData] = useState<any>(null);
  const [selectedRaceMarks, setSelectedRaceMarks] = useState<any[]>([]);
  const [loadingRaceDetail, setLoadingRaceDetail] = useState(false);
  const [selectedDemoRaceId, setSelectedDemoRaceId] = useState<string | null>(MOCK_RACES[0]?.id ?? null);
  const [isDeletingRace, setIsDeletingRace] = useState(false);
  const [hasManuallySelected, setHasManuallySelected] = useState(false);
  const [isApplyingCourseTemplate, setIsApplyingCourseTemplate] = useState(false);
  const [savingCourseTemplate, setSavingCourseTemplate] = useState(false);
  const hasAssignedFallbackRole = useRef(false);
  const initialSelectedRaceParam = useRef<string | null>(
    typeof searchParams?.selected === 'string' ? searchParams.selected : null
  );

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

  // Racing area drawing state
  const [drawingRacingArea, setDrawingRacingArea] = useState<Array<{lat: number, lng: number}>>([]);

  // Combined auth and onboarding check - prevents multiple re-renders
  React.useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      // Wait for auth to be ready
      if (!ready) return;

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
        logger.error('Error checking onboarding:', error);
      }
    };

    checkAuthAndOnboarding();
  }, [ready, signedIn, user?.id, router, isDemoSession]);

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
    }, [refetch])
  );

  // GPS Venue Detection
  const { currentVenue, isDetecting, confidence, error: venueError } = useVenueDetection();

  // Offline support
  const { isOnline, cacheNextRace } = useOffline();

  // Real-time race updates
  const { liveRaces, loading: liveRacesLoading } = useLiveRaces(user?.id);

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

  // Get first recent race if available - MOVED UP before conditional returns
  const safeNextRace: any = (nextRace as any) || {};
  // Memoize safeRecentRaces to prevent unnecessary re-renders and effect triggers
  const safeRecentRaces: any[] = useMemo(
    () => Array.isArray(recentRaces as any[]) ? (recentRaces as any[]) : [],
    [recentRaces]
  );
  const recentRace = safeRecentRaces.length > 0 ? safeRecentRaces[0] : null;
  const hasRealRaces = safeRecentRaces.length > 0 || !!nextRace;
  const selectedDemoRace = useMemo(
    () => selectedDemoRaceId ? MOCK_RACES.find(race => race.id === selectedDemoRaceId) ?? null : null,
    [selectedDemoRaceId]
  );

  // Determine race status (past, next, future)
  const getRaceStatus = (raceDate: string, isNextRace: boolean): 'past' | 'next' | 'future' => {
    if (isNextRace) return 'next';

    // Compare dates only (ignore time) to avoid issues with races at midnight
    const now = new Date();
    const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const raceDateTime = new Date(raceDate);
    const raceDateOnly = new Date(raceDateTime.getFullYear(), raceDateTime.getMonth(), raceDateTime.getDate());

    if (raceDateOnly < todayDateOnly) return 'past';
    return 'future';
  };

  // Handle race completion - trigger post-race interview
  const handleRaceComplete = useCallback((sessionId: string, raceName: string) => {
    logger.debug('Race completed:', sessionId, raceName);
    setCompletedSessionId(sessionId);
    setCompletedRaceName(raceName);
    setShowPostRaceInterview(true);
  }, []);

  // Handle post-race interview completion
  const handlePostRaceInterviewComplete = useCallback(() => {
    logger.debug('Post-race interview completed');
    setShowPostRaceInterview(false);
    setCompletedSessionId(null);
    setCompletedRaceName('');
    // Refresh races data to show updated analysis
    refetch?.();
  }, [refetch]);

  const handleAddRaceNavigation = useCallback(() => {
    router.push('/(tabs)/race/add');
  }, [router]);

  // Navigate to the comprehensive edit flow for the selected race
  const handleEditSelectedRace = useCallback(() => {
    if (!selectedRaceId) return;

    try {
      router.push(`/race/edit/${selectedRaceId}`);
    } catch (error) {
      logger.error('Error navigating to edit race:', error);
    }
  }, [logger, router, selectedRaceId]);

  // Delete the currently selected race with confirmation
  const handleDeleteSelectedRace = useCallback(() => {
    if (!selectedRaceId || isDeletingRace) {
      return;
    }

    const raceName = selectedRaceData?.name || 'this race';
    const confirmationMessage = `Are you sure you want to delete "${raceName}"? This action cannot be undone.`;

    const performDelete = async () => {
      setIsDeletingRace(true);
      try {
        // Remove any race events associated with this regatta first to avoid FK conflicts
        const { data: raceEvents, error: raceEventsError } = await supabase
          .from('race_events')
          .select('id')
          .eq('regatta_id', selectedRaceId);

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

        // Delete the regatta itself
        const { error: deleteRegattaError } = await supabase
          .from('regattas')
          .delete()
          .eq('id', selectedRaceId);

        if (deleteRegattaError) {
          throw deleteRegattaError;
        }

        // Clear local selection and refresh dashboard data
        setSelectedRaceId(null);
        setSelectedRaceData(null);
        setSelectedRaceMarks([]);
        setHasManuallySelected(false);
        await refetch?.();

        Alert.alert('Race deleted', `"${raceName}" has been removed.`);
      } catch (error: any) {
        logger.error('Error deleting race:', error);
        const message = error?.message || 'Unable to delete race. Please try again.';
        Alert.alert('Error', message);
      } finally {
        setIsDeletingRace(false);
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
  }, [isDeletingRace, logger, refetch, selectedRaceData, selectedRaceId]);

  // Handle racing area drawing
  const handleRacingAreaChange = useCallback((polygon: Array<{lat: number, lng: number}>) => {
    setDrawingRacingArea(polygon);
  }, []);

  // Handle saving racing area to database
  const handleSaveRacingArea = useCallback(async () => {
    if (!selectedRaceId || drawingRacingArea.length < 3) return;

    try {
      logger.debug('Saving racing area:', drawingRacingArea);

      // Convert to GeoJSON format
      const coordinates = drawingRacingArea.map(point => [point.lng, point.lat]);
      const polygonGeoJSON = {
        type: 'Polygon',
        coordinates: [[...coordinates, coordinates[0]]] // Close the polygon
      };

      // Save to regattas table
      const { error } = await supabase
        .from('regattas')
        .update({ racing_area_polygon: polygonGeoJSON })
        .eq('id', selectedRaceId);

      if (error) throw error;

      logger.debug('Racing area saved successfully');

      // Update local state immediately to prevent racing area from disappearing
      setSelectedRaceData((prev: any) => ({
        ...prev,
        racing_area_polygon: polygonGeoJSON
      }));

      // Clear drawing state
      setDrawingRacingArea([]);

      // Refresh race data in background
      refetch?.();
    } catch (error) {
      logger.error('Error saving racing area:', error);
    }
  }, [selectedRaceId, drawingRacingArea, refetch]);

  const ensureRaceEventId = useCallback(async (): Promise<string | null> => {
    if (!selectedRaceId) {
      logger.warn('Attempted to ensure race event without selected race');
      return null;
    }

    const { data: existingRaceEvent, error: existingRaceEventError } = await supabase
      .from('race_events')
      .select('id')
      .eq('regatta_id', selectedRaceId)
      .maybeSingle();

    if (existingRaceEventError) {
      throw existingRaceEventError;
    }

    if (existingRaceEvent?.id) {
      return existingRaceEvent.id;
    }

    const startDateObj = selectedRaceData?.start_date
      ? new Date(selectedRaceData.start_date)
      : null;

    const startTime = startDateObj && !Number.isNaN(startDateObj.getTime())
      ? startDateObj.toISOString().split('T')[1]?.split('Z')[0]?.split('.')[0] || '00:00:00'
      : '00:00:00';

    const eventDate = startDateObj && !Number.isNaN(startDateObj.getTime())
      ? startDateObj.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const { data: newRaceEvent, error: createError } = await supabase
      .from('race_events')
      .insert({
        regatta_id: selectedRaceId,
        name: `${selectedRaceData?.name || 'Race'} - Event 1`,
        start_time: startTime,
        event_date: eventDate,
      })
      .select()
      .single();

    if (createError) throw createError;

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

      // Prepare insert payload using only supported columns
      const insertPayload: any = {
        race_id: raceEventId,
        name: mark.name || mark.mark_name || 'Custom Mark',
        mark_type: mark.mark_type || 'custom',
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

      if (error) throw error;

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

  const handleCourseTemplateSelected = useCallback(async (courseMarks: Mark[]) => {
    if (!selectedRaceId) {
      Alert.alert('Select a race first', 'Choose a race before applying a course template.');
      return;
    }

    setIsApplyingCourseTemplate(true);

    try {
      const raceEventId = await ensureRaceEventId();
      if (!raceEventId) {
        throw new Error('Missing race event ID');
      }

      // Clear any existing marks before applying the template
      await supabase
        .from('race_marks')
        .delete()
        .eq('race_id', raceEventId);

      if (!courseMarks || courseMarks.length === 0) {
        setSelectedRaceMarks([]);
        Alert.alert('Course cleared', 'Existing course marks have been removed.');
        return;
      }

      const insertPayload = courseMarks
        .filter((mark) => typeof mark.latitude === 'number' && typeof mark.longitude === 'number')
        .map((mark, index) => ({
          race_id: raceEventId,
          name: mark.name || `Mark ${index + 1}`,
          mark_type: normalizeCourseMarkType(mark.type),
          latitude: mark.latitude,
          longitude: mark.longitude,
          sequence_order: index,
          is_custom: false,
        }));

      if (insertPayload.length === 0) {
        setSelectedRaceMarks([]);
        Alert.alert('No usable marks', 'That course does not have coordinates we can plot.');
        return;
      }

      const { data: insertedMarks, error: insertError } = await supabase
        .from('race_marks')
        .insert(insertPayload)
        .select();

      if (insertError) throw insertError;

      const mappedMarks = (insertedMarks || []).map((mark: any) => ({
        id: mark.id,
        mark_name: mark.name,
        mark_type: mark.mark_type,
        latitude: mark.latitude,
        longitude: mark.longitude,
        sequence_order: mark.sequence_order ?? 0,
      }));

      setSelectedRaceMarks(mappedMarks);
      setDrawingRacingArea([]);
      refetch?.();

      Alert.alert('Course applied', 'The selected course has been laid onto the tactical map.');
    } catch (error) {
      logger.error('Error applying course template:', error);
      Alert.alert('Unable to apply course', 'We could not load that course. Please try again.');
    } finally {
      setIsApplyingCourseTemplate(false);
    }
  }, [ensureRaceEventId, normalizeCourseMarkType, refetch, selectedRaceId]);

  const handleSaveCourseTemplate = useCallback(async () => {
    if (savingCourseTemplate) {
      return;
    }

    if (!user?.id) {
      Alert.alert('Sign in required', 'You need to be signed in to save course templates.');
      return;
    }

    if (!selectedRaceMarks || selectedRaceMarks.length === 0) {
      Alert.alert('No marks to save', 'Add marks to the tactical map before saving a template.');
      return;
    }

    const defaultName =
      selectedRaceData?.name
        ? `${selectedRaceData.name} Course`
        : `Custom Course ${new Date().toLocaleDateString()}`;

    let courseName = defaultName;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const response = window.prompt('Name your course template', defaultName);
      if (!response) {
        return;
      }
      courseName = response;
    }

    const scope: CourseScope =
      selectedRaceData?.metadata?.club_id
        ? 'club'
        : selectedRaceData?.metadata?.venue_id
          ? 'venue'
          : 'personal';

    const courseDescription =
      selectedRaceData?.metadata?.venue_name
        ? `Saved from ${selectedRaceData.metadata.venue_name}`
        : 'Custom racing course';

    const marksPayload = selectedRaceMarks
      .filter((mark: any) => typeof mark.latitude === 'number' && typeof mark.longitude === 'number')
      .map((mark: any, index: number) => ({
        id: mark.id || `${courseName.replace(/\s+/g, '-').toLowerCase()}-${index}`,
        name: mark.mark_name || mark.name || `Mark ${index + 1}`,
        type: mark.mark_type || mark.type || 'custom',
        latitude: mark.latitude,
        longitude: mark.longitude,
        sequence_order: index,
      }));

    if (marksPayload.length === 0) {
      Alert.alert('Unable to save course', 'Could not detect mark positions to save.');
      return;
    }

    setSavingCourseTemplate(true);

    try {
      const savedCourse = await CourseLibraryService.saveCourse(
        {
          name: courseName,
          description: courseDescription,
          course_type: 'custom',
          marks: marksPayload,
          typical_length_nm: null,
          estimated_duration_minutes: null,
          min_wind_direction: selectedRaceData?.metadata?.expected_wind_direction ?? null,
          max_wind_direction: selectedRaceData?.metadata?.expected_wind_direction ?? null,
          min_wind_speed: selectedRaceData?.metadata?.expected_wind_speed ?? null,
          max_wind_speed: selectedRaceData?.metadata?.expected_wind_speed ?? null,
          venue_id: selectedRaceData?.metadata?.venue_id ?? undefined,
          club_id: selectedRaceData?.metadata?.club_id ?? undefined,
        },
        scope,
        user.id
      );

      if (!savedCourse) {
        throw new Error('Course could not be saved');
      }

      Alert.alert('Course saved', `${courseName} is now in your course library.`);
    } catch (error: any) {
      logger.error('Error saving course template:', error);
      Alert.alert('Save failed', error?.message || 'Could not save this course. Please try again.');
    } finally {
      setSavingCourseTemplate(false);
    }
  }, [logger, savingCourseTemplate, selectedRaceData, selectedRaceMarks, user?.id]);

  const selectedRaceVenueCoordinates = useMemo(() => {
    if (selectedRaceData?.metadata?.venue_lat && selectedRaceData?.metadata?.venue_lng) {
      return {
        lat: selectedRaceData.metadata.venue_lat,
        lng: selectedRaceData.metadata.venue_lng,
      };
    }

    if (drawingRacingArea.length > 0) {
      const lat = drawingRacingArea.reduce((sum, point) => sum + point.lat, 0) / drawingRacingArea.length;
      const lng = drawingRacingArea.reduce((sum, point) => sum + point.lng, 0) / drawingRacingArea.length;
      return { lat, lng };
    }

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

    if (selectedRaceData?.metadata?.venue_name) {
      return {
        lat: selectedRaceData?.metadata?.venue_lat ?? 22.2650,
        lng: selectedRaceData?.metadata?.venue_lng ?? 114.2620,
      };
    }

    return undefined;
  }, [drawingRacingArea, selectedRaceData]);

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
  const hasAutoSelected = useRef(false);
  React.useEffect(() => {
    if (!loading && safeRecentRaces.length > 0 && !hasAutoSelected.current) {
      // Select next race if available, otherwise first race
      const raceToSelect = nextRace || safeRecentRaces[0];
      logger.debug('[races.tsx] Auto-selecting race:', raceToSelect?.name, raceToSelect?.id);
      setSelectedRaceId(raceToSelect.id);
      hasAutoSelected.current = true;
    }
  }, [loading, safeRecentRaces, nextRace]); // Removed selectedRaceId from dependencies

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
    hasAutoSelected.current = true;
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

      setLoadingRaceDetail(true);
      try {
        logger.debug('[races.tsx] Querying database for race ID:', selectedRaceId);
        const { data, error } = await supabase
          .from('regattas')
          .select('*')
          .eq('id', selectedRaceId)
          .single();

        if (error) throw error;
        logger.debug('[races.tsx] ✅ Race data fetched:', data?.name);
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
            setSelectedRaceMarks(convertedMarks);
            logger.debug('[races.tsx] Marks loaded:', convertedMarks.length);
          }
        }
      } catch (error) {
        console.error('[races.tsx] ❌ Error fetching race detail:', error);
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
  }, [selectedRaceId]);

const selectedRaceClassId = useMemo(() => {
  if (!selectedRaceData) return null;
  return (
    selectedRaceData.class_id ||
    selectedRaceData.classId ||
    selectedRaceData.metadata?.class_id ||
    selectedRaceData.metadata?.classId ||
    null
  );
}, [selectedRaceData]);

const selectedRaceClassName = useMemo(() => {
  if (!selectedRaceData) return undefined;
  return (
    selectedRaceData.metadata?.class_name ||
    selectedRaceData.class_divisions?.[0]?.name ||
    undefined
  );
}, [selectedRaceData]);

  const {
    recommendation: selectedRaceTuningRecommendation,
    loading: selectedRaceTuningLoading,
    refresh: refreshSelectedRaceTuning,
  } = useRaceTuningRecommendation({
    classId: selectedRaceClassId,
    className: selectedRaceClassName,
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

    const nextRaceIndex = safeRecentRaces.findIndex((race: any) => race.id === nextRace.id);
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
  if (loading && !profile) {
    logger.debug('Loading skeleton');
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
      {/* Header */}
      <View className="bg-primary-500 pt-10 pb-2 px-4">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-white text-lg font-bold">Races</Text>
          <View className="flex-row gap-2 items-center">
            {!isOnline && <OfflineIndicator />}
            <AccessibleTouchTarget
              onPress={() => router.push('/notifications' as any)}
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
                {/* DEBUG: Show selected race */}
                {selectedRaceData && (
                  <Text className="text-xs text-purple-600 font-bold mt-1">
                    🔍 Selected: {selectedRaceData.name} (ID: {selectedRaceId?.slice(0, 8)}...)
                  </Text>
                )}
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
              {/* All races in chronological order */}
              {safeRecentRaces.map((race: any, index: number) => {
                const isNextRace = !!(nextRace && race.id === nextRace.id);
                const raceStatus = getRaceStatus(race.date || new Date().toISOString(), isNextRace);
                return (
                  <RaceCard
                    key={race.id || index}
                    id={race.id}
                    name={race.name}
                    venue={race.venue || 'Unknown Venue'}
                    date={race.date || new Date().toISOString()}
                    startTime={race.startTime || '10:00'}
                    wind={race.wind || { direction: 'Variable', speedMin: 8, speedMax: 15 }}
                    tide={race.tide || { state: 'slack' as const, height: 1.0 }}
                    strategy={race.strategy || 'Race strategy will be generated based on conditions.'}
                    critical_details={race.critical_details}
                    isPrimary={isNextRace}
                    raceStatus={raceStatus}
                    onRaceComplete={(sessionId) => handleRaceComplete(sessionId, race.name)}
                    isSelected={selectedRaceId === race.id}
                    onSelect={() => {
                      logger.debug('=====================================');
                      logger.debug('[RacesScreen] 🎯 RACE CARD CLICKED');
                      logger.debug('[RacesScreen] Race name:', race.name);
                      logger.debug('[RacesScreen] Race ID:', race.id);
                      logger.debug('[RacesScreen] Previous selectedRaceId:', selectedRaceId);
                      logger.debug('[RacesScreen] Will set selectedRaceId to:', race.id);
                      logger.debug('=====================================');
                      setHasManuallySelected(true);
                      setSelectedRaceId(race.id);
                    }}
                  />
                );
              })}
            </ScrollView>

            {/* Inline Comprehensive Race Detail Section */}
            {loadingRaceDetail && !selectedRaceData && (
              <View className="items-center justify-center py-8">
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="text-gray-500 mt-2">Loading race details...</Text>
              </View>
            )}

            {selectedRaceData && (
              <View className="mt-2 gap-4">
                <View className="flex-row gap-3">
                  <Button
                    action="secondary"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onPress={handleEditSelectedRace}
                  >
                    <ButtonIcon as={Pencil} />
                    <ButtonText>Edit Race</ButtonText>
                  </Button>
                  <Button
                    action="negative"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onPress={handleDeleteSelectedRace}
                    disabled={isDeletingRace}
                  >
                    <ButtonIcon as={Trash2} />
                    <ButtonText>{isDeletingRace ? 'Deleting...' : 'Delete Race'}</ButtonText>
                  </Button>
                </View>

                {/* Course Template Selector */}
                <View className="mt-3">
                  <View className="flex-row items-center gap-2">
                    <View style={{ flex: 1 }}>
                      <CourseSelector
                        venueId={selectedRaceData.metadata?.venue_id ?? undefined}
                        venueName={selectedRaceData.metadata?.venue_name ?? undefined}
                        venueCoordinates={selectedRaceVenueCoordinates}
                        currentWindDirection={
                          selectedRaceData.metadata?.expected_wind_direction ??
                          selectedRaceData.metadata?.wind_direction ??
                          undefined
                        }
                        currentWindSpeed={
                          selectedRaceData.metadata?.expected_wind_speed ??
                          selectedRaceData.metadata?.wind_speed ??
                          undefined
                        }
                        onCourseSelected={handleCourseTemplateSelected}
                      />
                    </View>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-[48px]"
                      disabled={
                        savingCourseTemplate ||
                        !selectedRaceMarks ||
                        selectedRaceMarks.length === 0
                      }
                      onPress={handleSaveCourseTemplate}
                    >
                      <ButtonIcon as={Plus} />
                      <ButtonText>
                        {savingCourseTemplate ? 'Saving...' : 'Save Template'}
                      </ButtonText>
                    </Button>
                  </View>

                  {(isApplyingCourseTemplate || savingCourseTemplate) && (
                    <View className="flex-row items-center gap-2 mt-2">
                      <ActivityIndicator size="small" color="#2563EB" />
                      <Text className="text-sm text-gray-600">
                        {isApplyingCourseTemplate
                          ? 'Applying course template...'
                          : 'Saving course to your library...'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Tactical Race Map */}
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

                {/* ============================================ */}
                {/*  PRE-RACE STRATEGY SECTION                 */}
                {/* ============================================ */}
                <RacePhaseHeader
                  icon="chess-knight"
                  title="Pre-Race Strategy"
                  subtitle="AI-generated plan based on conditions"
                  badge="Ready"
                  phase="upcoming"
                />

                {/* Race Overview - Quick Stats & Confidence */}
                <RaceOverviewCard
                  raceId={selectedRaceData.id}
                  raceName={selectedRaceData.name}
                  startTime={selectedRaceData.start_date}
                  venue={selectedRaceData.metadata?.venue_name
                    ? ({ name: selectedRaceData.metadata.venue_name } as { name?: string })
                    : undefined}
                  boatClass={selectedRaceData.metadata?.class_name}
                />

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
                />

                {/* Upwind Strategy - Dedicated Beats Card */}
                <UpwindStrategyCard
                  raceId={selectedRaceData.id}
                  raceName={selectedRaceData.name}
                />

                {/* Downwind Strategy - Dedicated Runs Card */}
                <DownwindStrategyCard
                  raceId={selectedRaceData.id}
                  raceName={selectedRaceData.name}
                />

                {/* Mark Rounding Strategy */}
                <MarkRoundingCard
                  raceId={selectedRaceData.id}
                  raceName={selectedRaceData.name}
                />

                {/* Weather & Conditions */}
                <WindWeatherCard
                  raceId={selectedRaceData.id}
                  raceTime={selectedRaceData.start_date}
                  venueCoordinates={selectedRaceData.metadata?.venue_lat ? {
                    lat: selectedRaceData.metadata.venue_lat,
                    lng: selectedRaceData.metadata.venue_lng
                  } : undefined}
                  venue={selectedRaceData.metadata?.venue_lat ? {
                    id: `venue-${selectedRaceData.metadata.venue_lat}-${selectedRaceData.metadata.venue_lng}`,
                    name: selectedRaceData.metadata?.venue_name || 'Race Venue',
                    coordinates: {
                      latitude: selectedRaceData.metadata.venue_lat,
                      longitude: selectedRaceData.metadata.venue_lng
                    },
                    region: 'asia_pacific',
                    country: 'HK'
                  } : undefined}
                />

                {!selectedRaceClassId && (
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

                <RigTuningCard
                  raceId={selectedRaceData.id}
                  boatClassName={selectedRaceClassName}
                  recommendation={selectedRaceTuningRecommendation}
                  loading={selectedRaceTuningLoading}
                  onRefresh={selectedRaceClassId ? refreshSelectedRaceTuning : undefined}
                />

                <CurrentTideCard
                  raceId={selectedRaceData.id}
                  raceTime={selectedRaceData.start_date}
                  venueCoordinates={selectedRaceData.metadata?.venue_lat ? {
                    lat: selectedRaceData.metadata.venue_lat,
                    lng: selectedRaceData.metadata.venue_lng
                  } : undefined}
                  venue={selectedRaceData.metadata?.venue_lat ? {
                    id: `venue-${selectedRaceData.metadata.venue_lat}-${selectedRaceData.metadata.venue_lng}`,
                    name: selectedRaceData.metadata?.venue_name || 'Race Venue',
                    coordinates: {
                      latitude: selectedRaceData.metadata.venue_lat,
                      longitude: selectedRaceData.metadata.venue_lng
                    },
                    region: 'asia_pacific',
                    country: 'HK'
                  } : undefined}
                />

                {/* Contingency Plans */}
                <ContingencyPlansCard
                  raceId={selectedRaceData.id}
                />

                {/* ============================================ */}
                {/*  POST-RACE ANALYSIS SECTION                 */}
                {/* ============================================ */}
                <RacePhaseHeader
                  icon="trophy"
                  title="Post-Race Analysis"
                  subtitle="Review performance and get coaching"
                  badge="Complete"
                  phase="completed"
                />
                <PostRaceAnalysisCard
                  raceId={selectedRaceData.id}
                  raceName={selectedRaceData.name}
                  raceStartTime={selectedRaceData.start_date}
                />

                {/* ============================================ */}
                {/*  LOGISTICS SECTION                         */}
                {/* ============================================ */}
                <RacePhaseHeader
                  icon="package-variant"
                  title="Logistics"
                  subtitle="Crew, equipment, and race details"
                  phase="upcoming"
                />

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

                <RaceDocumentsCard
                  raceId={selectedRaceData.id}
                  onUpload={() => {
                    logger.debug('Upload document tapped');
                  }}
                  onDocumentPress={(doc) => {
                    logger.debug('Document pressed:', doc);
                  }}
                  onShareWithFleet={(docId) => {
                    logger.debug('Share document with fleet:', docId);
                  }}
                />
              </View>
            )}
          </>
        ) : (
          // User has no races - show mock race cards horizontally
          <>
            <View className="mb-3">
              <Text className="text-base font-bold text-gray-800">Demo Races</Text>
              <Text className="text-xs text-gray-500">
                📋 Example races to get you started - tap "+" to add your first race!
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
                  onSelect={() => setSelectedDemoRaceId(race.id)}
                />
              ))}
            </ScrollView>
            {selectedDemoRace && (
              <DemoRaceDetail race={selectedDemoRace} onAddRace={handleAddRaceNavigation} />
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

      {/* FAB - Import Calendar Button */}
      <TouchableOpacity
        className="absolute bottom-28 right-6 w-14 h-14 bg-purple-600 rounded-full items-center justify-center shadow-lg"
        onPress={() => setShowCalendarImport(true)}
        accessibilityLabel="Import race calendar"
        accessibilityHint="Import multiple races from a CSV calendar file"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Calendar color="white" size={24} />
      </TouchableOpacity>

      {/* FAB - Add Race Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-16 h-16 bg-blue-600 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push('/(tabs)/race/comprehensive-add')}
        accessibilityLabel="Add new race"
        accessibilityHint="Create a new race with comprehensive race entry form"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Plus color="white" size={28} />
      </TouchableOpacity>

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
          onClose={() => setShowPostRaceInterview(false)}
          onComplete={handlePostRaceInterviewComplete}
        />
      )}
    </View>
  );
}
