import { RaceCard } from '@/src/components/races/RaceCard';
import { MOCK_RACES } from '@/src/constants/mockData';
import { supabase } from '@/src/services/supabase';
import { Button, ButtonIcon, ButtonText } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { ErrorMessage } from '@/src/components/ui/error';
import { DashboardSkeleton } from '@/src/components/ui/loading';
import { OfflineIndicator } from '@/src/components/ui/OfflineIndicator';
import { AccessibleTouchTarget } from '@/src/components/ui/AccessibleTouchTarget';
import { useDashboardData } from '@/src/hooks/useData';
import { useOffline } from '@/src/hooks/useOffline';
import { useLiveRaces } from '@/src/hooks/useRaceResults';
import { useVenueDetection } from '@/src/hooks/useVenueDetection';
import { useRaceWeather } from '@/src/hooks/useRaceWeather';
import { useAuth } from '@/src/providers/AuthProvider';
import { VenueIntelligenceAgent } from '@/src/services/agents/VenueIntelligenceAgent';
import { venueIntelligenceService } from '@/src/services/VenueIntelligenceService';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  AlertTriangle,
  Bell,
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
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function SailorDashboard() {
  const { user, signedIn, ready } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (ready && !signedIn) {
      console.log('[SailorDashboard] User not authenticated, redirecting to login');
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
  console.log('Sailor Dashboard Data:', {
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
          <Text className="text-white text-lg font-bold">Sailor Dashboard [CODE UPDATED]</Text>
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
        <TouchableOpacity
          className="flex-row items-center mb-2"
          onPress={handleVenuePress}
          accessibilityLabel={currentVenue ? `Current venue: ${currentVenue.name}` : 'Set your sailing venue'}
          accessibilityHint="Tap to view venue details or change venue"
          accessibilityRole="button"
          style={{ minHeight: 32 }}
        >
          <MapPin color="white" size={12} />
          {isDetecting ? (
            <View className="flex-row items-center ml-1">
              <ActivityIndicator size="small" color="white" />
              <Text className="text-white text-xs ml-1">Detecting...</Text>
            </View>
          ) : currentVenue ? (
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
          ) : (profile as any)?.home_venue ? (
            <Text className="text-white text-xs ml-1">{(profile as any).home_venue}</Text>
          ) : (
            <Text className="text-white text-xs ml-1">Tap to set venue</Text>
          )}
        </TouchableOpacity>

        {/* Season Performance Stats */}
        <View className="flex-row justify-around pb-1">
          <TouchableOpacity
            className="items-center"
            onPress={() => router.push('/races')}
          >
            <Flag size={14} color="white" />
            <Text className="text-white text-base font-bold">{performanceHistory?.length || 0}</Text>
            <Text className="text-white/80 text-[10px]">Races</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center"
            onPress={() => router.push('/venue')}
          >
            <MapPin size={14} color="white" />
            <Text className="text-white text-base font-bold">—</Text>
            <Text className="text-white/80 text-[10px]">Venues</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center"
            onPress={() => router.push('/analytics')}
          >
            <TrendingUp size={14} color="white" />
            <Text className="text-white text-base font-bold">—</Text>
            <Text className="text-white/80 text-[10px]">Avg Pos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center"
            onPress={() => router.push('/analytics')}
          >
            <Trophy size={14} color="white" />
            <Text className="text-white text-base font-bold">—</Text>
            <Text className="text-white/80 text-[10px]">Ranking</Text>
          </TouchableOpacity>
        </View>
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
            <View className="mb-3">
              <Text className="text-base font-bold text-gray-800">Upcoming Races</Text>
              <Text className="text-xs text-gray-500">Swipe to view all races</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerStyle={{ paddingRight: 16, pointerEvents: 'box-none' }}
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
              onTouchStart={() => console.log('[Dashboard] Upcoming races horizontal ScrollView touch started')}
              onTouchEnd={() => console.log('[Dashboard] Upcoming races horizontal ScrollView touch ended')}
            >
              {/* Next Race (Primary) */}
              {nextRace && (
                <RaceCard
                  id={nextRace.id}
                  name={nextRace.name}
                  venue={safeNextRace.venue || 'Unknown Venue'}
                  date={nextRace.date || new Date().toISOString()}
                  startTime={nextRace.startTime || '10:00'}
                  wind={
                    raceWeather?.wind ||
                    safeNextRace.wind ||
                    { direction: 'Variable', speedMin: 8, speedMax: 15 }
                  }
                  tide={
                    raceWeather?.tide ||
                    safeNextRace.tide ||
                    { state: 'slack' as const, height: 1.0 }
                  }
                  strategy={safeNextRace.strategy || 'Race strategy will be generated based on conditions.'}
                  critical_details={safeNextRace.critical_details}
                  isPrimary={true}
                />
              )}
              {/* Recent/Other Races */}
              {safeRecentRaces.slice(nextRace ? 0 : 0, 5).map((race: any, index: number) => {
                // Skip the next race if it's also in recent races
                if (nextRace && race.id === nextRace.id) return null;

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
                    isPrimary={false}
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
    </View>
  );
}
