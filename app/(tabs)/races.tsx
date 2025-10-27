import { RaceCard } from '@/components/races/RaceCard';
import { PostRaceInterview } from '@/components/races/PostRaceInterview';
import { MOCK_RACES } from '@/constants/mockData';
import { supabase } from '@/services/supabase';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorMessage } from '@/components/ui/error';
import { DashboardSkeleton } from '@/components/ui/loading';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { AccessibleTouchTarget } from '@/components/ui/AccessibleTouchTarget';
import { useDashboardData } from '@/hooks/useData';
import { useOffline } from '@/hooks/useOffline';
import { useLiveRaces } from '@/hooks/useRaceResults';
import { useVenueDetection } from '@/hooks/useVenueDetection';
import { useRaceWeather } from '@/hooks/useRaceWeather';
import { useAuth } from '@/providers/AuthProvider';
import { VenueIntelligenceAgent } from '@/services/agents/VenueIntelligenceAgent';
import { venueIntelligenceService } from '@/services/VenueIntelligenceService';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  AlertTriangle,
  Bell,
  Calendar,
  ChevronRight,
  Flag,
  MapPin,
  Navigation,
  Plus,
  TrendingUp,
  Trophy,
  Users,
  X
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { ActivityIndicator, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { CalendarImportFlow } from '@/components/races/CalendarImportFlow';

export default function RacesScreen() {
  console.error('🚨🚨🚨 RACES_SCREEN_RENDERING - CODE_VERSION: LIMIT_100_FIX 🚨🚨🚨');
  const { user, signedIn, ready } = useAuth();
  const router = useRouter();
  const [showCalendarImport, setShowCalendarImport] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { width: SCREEN_WIDTH } = Dimensions.get('window');

  // Post-race interview state
  const [showPostRaceInterview, setShowPostRaceInterview] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [completedRaceName, setCompletedRaceName] = useState<string>('');

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (ready && !signedIn) {
      console.log('[RacesScreen] User not authenticated, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [ready, signedIn, router]);

  // Check if user has completed onboarding
  React.useEffect(() => {
    const checkOnboarding = async () => {
      if (!ready || !signedIn || !user?.id) return;

      try {
        const { data: userData } = await supabase
          .from('users')
          .select('onboarding_completed, user_type')
          .eq('id', user.id)
          .single();

        console.log('[SailorDashboard] User onboarding status:', userData);

        // If no user type selected, redirect to persona selection
        if (!userData?.user_type) {
          console.log('[SailorDashboard] No user type, redirecting to persona selection');
          router.replace('/(auth)/persona-selection');
          return;
        }

        // If onboarding not completed, redirect to appropriate onboarding
        if (!userData?.onboarding_completed) {
          console.log('[SailorDashboard] Onboarding not completed, redirecting');
          if (userData.user_type === 'sailor') {
            router.replace('/(auth)/onboarding-redesign');
          } else if (userData.user_type === 'coach') {
            router.replace('/(auth)/coach-onboarding');
          } else if (userData.user_type === 'club') {
            router.replace('/(auth)/club-onboarding-chat');
          }
        }
      } catch (error) {
        console.error('[SailorDashboard] Error checking onboarding:', error);
      }
    };

    checkOnboarding();
  }, [ready, signedIn, user?.id, router]);

  // Fetch data from API
  console.log('[SailorDashboard] rendering start');
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
  useFocusEffect(
    useCallback(() => {
      console.log('[SailorDashboard] Screen focused - refetching races');
      refetch?.();
    }, [refetch])
  );

  // GPS Venue Detection
  const { currentVenue, isDetecting, confidence, error: venueError } = useVenueDetection();
  console.log('[SailorDashboard] venue state', { isDetecting, confidence, venueId: currentVenue?.id, venueError });

  // Offline support
  const { isOnline, cacheNextRace } = useOffline();
  console.log('[SailorDashboard] connection', { isOnline });

  // Real-time race updates
  const { liveRaces, loading: liveRacesLoading } = useLiveRaces(user?.id);
  console.log('[SailorDashboard] live races state', { userId: user?.id, liveRacesCount: liveRaces?.length, liveRacesLoading });

  // Real-time weather for next race
  const { weather: raceWeather, loading: weatherLoading, error: weatherError } = useRaceWeather(
    currentVenue,
    nextRace?.date
  );
  console.log('[SailorDashboard] race weather state', {
    venue: currentVenue?.name,
    raceDate: nextRace?.date,
    hasWeather: !!raceWeather,
    weatherLoading,
    weatherError: weatherError?.message
  });

  // AI Venue Analysis
  const [venueInsights, setVenueInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  // Create agent instance once using useMemo - MUST be before any returns
  const venueAgent = useMemo(() => new VenueIntelligenceAgent(), []);

  // Get first recent race if available - MOVED UP before conditional returns
  const safeNextRace: any = (nextRace as any) || {};
  const safeRecentRaces: any[] = Array.isArray(recentRaces as any[]) ? (recentRaces as any[]) : [];
  const recentRace = safeRecentRaces.length > 0 ? safeRecentRaces[0] : null;

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
    console.log('[RacesScreen] Race completed:', sessionId, raceName);
    setCompletedSessionId(sessionId);
    setCompletedRaceName(raceName);
    setShowPostRaceInterview(true);
  }, []);

  // Handle post-race interview completion
  const handlePostRaceInterviewComplete = useCallback(() => {
    console.log('[RacesScreen] Post-race interview completed');
    setShowPostRaceInterview(false);
    setCompletedSessionId(null);
    setCompletedRaceName('');
    // Refresh races data to show updated analysis
    refetch?.();
  }, [refetch]);

  // DEBUG LOGGING
  console.error('🎯🎯🎯 RACES_SCREEN RENDER DEBUG 🎯🎯🎯');
  console.error('🎯 User:', user?.email, 'ID:', user?.id);
  console.error('🎯 nextRace:', nextRace ? `${nextRace.name} (${nextRace.date})` : 'null');
  console.error('🎯 recentRaces received from hook (now contains ALL races):', recentRaces?.length);
  console.error('🎯 safeRecentRaces after Array check:', safeRecentRaces.length);
  console.error('🎯 Total races to render:', safeRecentRaces.length);
  console.error('🎯 First 10 races chronologically:', safeRecentRaces.slice(0, 10).map(r => `${r.name} (${r.date})`));

  // Memoized navigation handlers
  const handleVenuePress = useCallback(() => {
    router.push('/venue');
  }, [router]);

  // Load cached insights from database
  const loadCachedInsights = useCallback(async (venueId: string) => {
    try {
      const cachedInsights = await venueIntelligenceService.getVenueInsights(venueId);

      if (cachedInsights) {
        console.log('✅ Loaded cached venue insights from database');
        setVenueInsights(cachedInsights);
        setShowInsights(true);
      } else {
        console.log('ℹ️ No cached insights found for venue:', venueId);
        // Insights will be null, triggering auto-generation if GPS confidence is high
      }
    } catch (error: any) {
      console.error('Error loading cached insights:', error);
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
        console.error('Failed to get venue insights:', result.error);
      }
    } catch (error: any) {
      console.error('Error getting venue insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  }, [currentVenue?.id, venueAgent]);

  // Cache next race for offline use when it loads
  React.useEffect(() => {
    if (nextRace && user) {
      cacheNextRace(nextRace.id, user.id).catch(err =>
        console.error('Failed to cache race:', err)
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

  // Auto-scroll to center on next race
  useEffect(() => {
    console.error('🎬 Auto-scroll effect triggered');
    console.error('  - loading:', loading);
    console.error('  - scrollViewRef exists:', !!scrollViewRef.current);
    console.error('  - nextRace exists:', !!nextRace);
    console.error('  - nextRace name:', nextRace?.name);
    console.error('  - safeRecentRaces length:', safeRecentRaces.length);

    // Don't scroll while data is loading or if requirements aren't met
    if (loading || !nextRace || safeRecentRaces.length === 0) {
      console.error('  - Auto-scroll SKIPPED: missing requirements or still loading');
      return;
    }

    // Find index of next race in the array
    const nextRaceIndex = safeRecentRaces.findIndex((race: any) => race.id === nextRace.id);
    console.error('  - Next race index in array:', nextRaceIndex);

    if (nextRaceIndex === -1) {
      console.error('  - Auto-scroll SKIPPED: next race not found in array');
      return;
    }

    // Card dimensions (same as RaceCard component)
    const cardWidth = Math.min(SCREEN_WIDTH - 32, 375);
    const cardMargin = 8; // marginHorizontal from RaceCard
    const totalCardWidth = cardWidth + (cardMargin * 2);

    // Calculate scroll position to center the next race
    const scrollX = (nextRaceIndex * totalCardWidth) - (SCREEN_WIDTH / 2) + (cardWidth / 2);
    console.error(`  - Scrolling to x=${Math.max(0, scrollX)} to center race at index ${nextRaceIndex}`);

    // Scroll to position with a delay to ensure layout is ready
    // Use a longer delay to account for rendering time
    const timer = setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: Math.max(0, scrollX), // Don't scroll to negative values
          y: 0,
          animated: true
        });
        console.error('  - Auto-scroll EXECUTED');
      }
    }, 500);

    // Cleanup timeout on unmount
    return () => clearTimeout(timer);
  }, [nextRace, safeRecentRaces, SCREEN_WIDTH, loading]);

  // Auth loading state - show while auth is being initialized
  if (!ready) {
    console.log('[SailorDashboard] waiting for auth to be ready');
    return <DashboardSkeleton />;
  }

  // Loading state - AFTER all hooks
  if (loading && !profile) {
    console.log('[SailorDashboard] loading skeleton');
    return <DashboardSkeleton />;
  }

  // Error state
  if (error && !profile) {
    console.error('[SailorDashboard] top-level error', error);
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

  // Debug: Log what the hook returns
  console.log('Races Screen Data:', {
    profile,
    nextRace,
    recentRaces,
    performanceHistory,
    boats,
    fleets,
    loading,
    error
  });

  return (
    <View className="flex-1 bg-gray-50">
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
        className="px-4 py-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
          />
        }
        showsVerticalScrollIndicator={false}
        onTouchStart={() => console.log('[Dashboard] Vertical ScrollView touch started')}
        onTouchEnd={() => console.log('[Dashboard] Vertical ScrollView touch ended')}
      >
        {/* RACE CARDS - MULTIPLE RACES SIDE-BY-SIDE */}
        {nextRace || (safeRecentRaces && safeRecentRaces.length > 0) ? (
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
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerStyle={{ paddingRight: 16, pointerEvents: 'box-none' }}
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
              onTouchStart={() => console.log('[Dashboard] Upcoming races horizontal ScrollView touch started')}
              onTouchEnd={() => console.log('[Dashboard] Upcoming races horizontal ScrollView touch ended')}
            >
              {/* All races in chronological order */}
              {safeRecentRaces.map((race: any, index: number) => {
                const isNextRace = nextRace && race.id === nextRace.id;
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
                  />
                );
              })}
            </ScrollView>
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
              onTouchStart={(e) => {
                console.log('[Dashboard] 🟢 Demo races ScrollView touch started');
                console.log('[Dashboard] Touch target:', e.target);
              }}
              onTouchEnd={() => console.log('[Dashboard] 🟢 Demo races ScrollView touch ended')}
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
                />
              ))}
            </ScrollView>
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
