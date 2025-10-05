import { AICoachCard } from '@/src/components/dashboard/AICoachCard';
import { SeasonStatsCard } from '@/src/components/dashboard/SeasonStatsCard';
import { Badge, BadgeIcon, BadgeText } from '@/src/components/ui/badge';
import { Button, ButtonIcon, ButtonText } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { EmptyState } from '@/src/components/ui/empty';
import { ErrorMessage } from '@/src/components/ui/error';
import { DashboardSkeleton } from '@/src/components/ui/loading';
import { OfflineIndicator } from '@/src/components/ui/OfflineIndicator';
import { RealtimeConnectionIndicator } from '@/src/components/ui/RealtimeConnectionIndicator';
import { AccessibleTouchTarget } from '@/src/components/ui/AccessibleTouchTarget';
import { useDashboardData } from '@/src/hooks/useData';
import { useOffline } from '@/src/hooks/useOffline';
import { useLiveRaces } from '@/src/hooks/useRaceResults';
import { useVenueDetection } from '@/src/hooks/useVenueDetection';
import { useAuth } from '@/src/providers/AuthProvider';
import { VenueIntelligenceAgent } from '@/src/services/agents/VenueIntelligenceAgent';
import { venueIntelligenceService } from '@/src/services/VenueIntelligenceService';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Flag,
  MapPin,
  Navigation,
  Plus,
  Search,
  Share2,
  Sun,
  TrendingUp,
  Trophy,
  Upload,
  Users,
  X
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// Memoized boat card component
const BoatCard = React.memo(({ boat, onPress }: { boat: any; onPress: () => void }) => (
  <TouchableOpacity
    className="mb-3 pb-3 border-b border-gray-100"
    onPress={onPress}
  >
    <Text className="font-bold">{boat.name}</Text>
    <Text className="text-gray-600 text-sm">{boat.boat_class}</Text>
  </TouchableOpacity>
));

// Memoized fleet card component
const FleetCard = React.memo(({ fleet, onPress }: { fleet: any; onPress: () => void }) => (
  <TouchableOpacity
    className="mb-3 pb-3 border-b border-gray-100"
    onPress={onPress}
  >
    <Text className="font-bold">{fleet.name}</Text>
    <Text className="text-gray-600 text-sm">{fleet.description || 'No description'}</Text>
  </TouchableOpacity>
));

export default function SailorDashboard() {
  const { user, signedIn, ready } = useAuth();
  const router = useRouter();
  const [countdown, setCountdown] = useState({ days: 3, hours: 14, minutes: 22 });

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (ready && !signedIn) {
      console.log('[SailorDashboard] User not authenticated, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [ready, signedIn, router]);

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
    onRefresh
  } = useDashboardData();

  // GPS Venue Detection
  const { currentVenue, isDetecting, confidence, error: venueError } = useVenueDetection();
  console.log('[SailorDashboard] venue state', { isDetecting, confidence, venueId: currentVenue?.id, venueError });

  // Offline support
  const { isOnline, cacheNextRace } = useOffline();
  console.log('[SailorDashboard] connection', { isOnline });

  // Real-time race updates
  const { liveRaces, loading: liveRacesLoading } = useLiveRaces(user?.id);
  console.log('[SailorDashboard] live races state', { userId: user?.id, liveRacesCount: liveRaces?.length, liveRacesLoading });

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

  // Memoized navigation handlers - MOVED UP before conditional returns
  const handleBoatPress = useCallback((boatId: string) => {
    router.push(`/boat/${boatId}`);
  }, [router]);

  const handleFleetPress = useCallback(() => {
    router.push('/fleet');
  }, [router]);

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
      <View className="bg-primary-500 pt-12 pb-4 px-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-white text-2xl font-bold">Sailor Dashboard</Text>
          <View className="flex-row gap-2 items-center">
            {!isOnline && <OfflineIndicator />}
            <AccessibleTouchTarget
              onPress={() => router.push('/notifications')}
              accessibilityLabel="Notifications"
              accessibilityHint="View your notifications and alerts"
              className="bg-primary-600 rounded-full"
            >
              <Bell color="white" size={24} />
            </AccessibleTouchTarget>
          </View>
        </View>

        {/* Venue Display */}
        <TouchableOpacity
          className="flex-row items-center"
          onPress={handleVenuePress}
          accessibilityLabel={currentVenue ? `Current venue: ${currentVenue.name}` : 'Set your sailing venue'}
          accessibilityHint="Tap to view venue details or change venue"
          accessibilityRole="button"
          style={{ minHeight: 44 }}
        >
          <MapPin color="white" size={14} />
          {isDetecting ? (
            <View className="flex-row items-center ml-2">
              <ActivityIndicator size="small" color="white" />
              <Text className="text-white text-sm ml-2">Detecting venue...</Text>
            </View>
          ) : currentVenue ? (
            <View className="flex-row items-center flex-1">
              <Text className="text-white text-sm ml-2">{currentVenue.name}</Text>
              {loadingInsights && (
                <ActivityIndicator size="small" color="white" className="ml-2" />
              )}
            </View>
          ) : (profile as any)?.home_venue ? (
            <Text className="text-white text-sm ml-2">{(profile as any).home_venue}</Text>
          ) : (
            <Text className="text-white text-sm ml-2">Tap to set venue</Text>
          )}
        </TouchableOpacity>
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
      >
        {/* Season Stats Card */}
        <SeasonStatsCard
          races={performanceHistory?.length || 0}
          venues={0}
          avgPosition={null}
          ranking={null}
          onRacesPress={() => router.push('/races')}
          onVenuesPress={() => router.push('/venue')}
          onAvgPositionPress={() => router.push('/analytics')}
          onRankingPress={() => router.push('/analytics')}
          onViewDetailsPress={() => router.push('/analytics')}
        />

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
        {/* Next Race Card */}
        {nextRace ? (
          <Card className="mb-4" variant="elevated">
            <View className="p-4">
              <View className="flex-row justify-between items-start mb-2">
                <View>
                  <Text className="text-lg font-bold text-typography-900">{nextRace.name}</Text>
                  <Text className="text-typography-500">{nextRace.boatClass}</Text>
                </View>
                <Flag color="rgb(37, 99, 235)" size={24} />
              </View>

              <View className="flex-row items-center mb-3">
                <MapPin color="rgb(107, 114, 128)" size={16} />
                <Text className="text-typography-500 ml-1">{safeNextRace.venue || '—'}</Text>
              </View>

              <View className="flex-row items-center mb-4">
                <Clock color="rgb(107, 114, 128)" size={16} />
                <Text className="text-typography-500 ml-1">Starts in:</Text>
                <Text className="text-primary-600 font-bold ml-1">
                  {countdown.days}d {countdown.hours}h {countdown.minutes}m
                </Text>
              </View>

              <View className="flex-row flex-wrap mb-4">
                {safeNextRace.documents && (
                  <Badge action="success" variant="solid" className="mr-2 mb-2">
                    <BadgeIcon as={CheckCircle} />
                    <BadgeText>Docs uploaded</BadgeText>
                  </Badge>
                )}
                {!safeNextRace.strategy && (
                  <Badge action="warning" variant="solid" className="mr-2 mb-2">
                    <BadgeIcon as={AlertTriangle} />
                    <BadgeText>Strategy pending</BadgeText>
                  </Badge>
                )}
                {safeNextRace.weather && (
                  <Badge action="success" variant="solid" className="mr-2 mb-2">
                    <BadgeIcon as={CheckCircle} />
                    <BadgeText>Weather: {safeNextRace.weather}%</BadgeText>
                  </Badge>
                )}
                {safeNextRace.tuningGuide && (
                  <Badge action="success" variant="solid" className="mr-2 mb-2">
                    <BadgeIcon as={CheckCircle} />
                    <BadgeText>Tuning guide</BadgeText>
                  </Badge>
                )}
                {safeNextRace.crewConfirmed !== undefined && safeNextRace.crewTotal && (
                  <Badge action="warning" variant="solid" className="mr-2 mb-2">
                    <BadgeIcon as={AlertTriangle} />
                    <BadgeText>Crew: {safeNextRace.crewConfirmed}/{safeNextRace.crewTotal}</BadgeText>
                  </Badge>
                )}
              </View>

            <View className="flex-row mb-4">
              <Button action="primary" variant="solid" size="md" className="flex-1 mr-2">
                <ButtonText>Plan Race Strategy</ButtonText>
              </Button>
              <Button action="primary" variant="outline" size="md" className="flex-1">
                <ButtonText>View Course</ButtonText>
              </Button>
            </View>

            <View className="flex-row justify-around pt-2 border-t border-outline-200">
              <AccessibleTouchTarget
                onPress={() => router.push('/upload-documents')}
                accessibilityLabel="Upload race documents"
                accessibilityHint="Upload sailing instructions and race documents"
              >
                <View className="items-center">
                  <Upload color="#6B7280" size={20} />
                  <Text className="text-gray-600 text-xs mt-1">Upload</Text>
                </View>
              </AccessibleTouchTarget>
              <AccessibleTouchTarget
                onPress={() => router.push('/weather')}
                accessibilityLabel="View weather forecast"
                accessibilityHint="Check weather conditions for the race"
              >
                <View className="items-center">
                  <Sun color="#6B7280" size={20} />
                  <Text className="text-gray-600 text-xs mt-1">Weather</Text>
                </View>
              </AccessibleTouchTarget>
              <AccessibleTouchTarget
                onPress={() => router.push('/crew')}
                accessibilityLabel="Manage crew"
                accessibilityHint="View and manage your crew members"
              >
                <View className="items-center">
                  <Users color="#6B7280" size={20} />
                  <Text className="text-gray-600 text-xs mt-1">Crew</Text>
                </View>
              </AccessibleTouchTarget>
            </View>
          </View>
        </Card>
        ) : (
          <Card className="mb-4" variant="elevated">
            <EmptyState
              variant="zero"
              icon={Calendar}
              title="No upcoming races"
              message="Add your next race to get AI-powered strategy and planning"
              actionLabel="Add Race"
              onAction={() => router.push('/races')}
            />
          </Card>
        )}

        {/* Recent Race Analysis */}
        {recentRace ? (
          <Card className="mb-4 p-4" variant="elevated">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold">Recent Race</Text>
              <TouchableOpacity>
                <ChevronRight color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center mb-3">
              <Trophy color="#F59E0B" size={20} />
              <Text className="font-bold ml-2">{recentRace.name || 'Race'}</Text>
            </View>

            {recentRace.position && (
              <View className="flex-row items-center mb-3">
                <Text className="text-2xl font-bold text-blue-600">{recentRace.position}</Text>
                <Text className="text-gray-600 ml-1">place</Text>
              </View>
            )}

            <View className="flex-row justify-around pt-3 border-t border-gray-100">
              <TouchableOpacity className="flex-row items-center">
                <Search color="#6B7280" size={16} />
                <Text className="text-gray-600 ml-1">View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center">
                <Share2 color="#6B7280" size={16} />
                <Text className="text-gray-600 ml-1">Share</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : !recentTimerSessions || recentTimerSessions.length === 0 ? (
          <Card className="mb-4" variant="elevated">
            <EmptyState
              variant="zero"
              icon={Trophy}
              title="No race history"
              message="Complete your first race to see performance analysis"
            />
          </Card>
        ) : null}

        {/* Boats Section */}
        {boats && boats.length > 0 ? (
          <Card className="mb-4 p-4" variant="elevated">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold">Your Boats</Text>
              <TouchableOpacity onPress={() => router.push('/boat')}>
                <ChevronRight color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            {(boats as any[]).slice(0, 2).map((boat: any) => (
              <BoatCard
                key={boat.id}
                boat={boat}
                onPress={() => handleBoatPress(boat.id)}
              />
            ))}

            {(boats as any[]).length > 2 && (
              <TouchableOpacity onPress={() => router.push('/boat')}>
                <Text className="text-blue-600 text-sm">View all {(boats as any[]).length} boats →</Text>
              </TouchableOpacity>
            )}
          </Card>
        ) : (
          <Card className="mb-4" variant="elevated">
            <EmptyState
              variant="zero"
              icon={Flag}
              title="No boats yet"
              message="Add your first boat to start tracking equipment and performance"
              actionLabel="Add Boat"
              onAction={() => router.push('/boat')}
            />
          </Card>
        )}

        {/* Fleets Section */}
        {fleets && fleets.length > 0 ? (
          <Card className="mb-4 p-4" variant="elevated">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold">Your Fleets</Text>
              <TouchableOpacity onPress={() => router.push('/fleet')}>
                <ChevronRight color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            {fleets.slice(0, 2).map((fleet: any) => (
              <FleetCard
                key={fleet.id}
                fleet={fleet}
                onPress={handleFleetPress}
              />
            ))}

            {fleets.length > 2 && (
              <TouchableOpacity onPress={() => router.push('/fleet')}>
                <Text className="text-blue-600 text-sm">View all {fleets.length} fleets →</Text>
              </TouchableOpacity>
            )}
          </Card>
        ) : (
          <Card className="mb-4" variant="elevated">
            <EmptyState
              variant="zero"
              icon={Users}
              title="No fleets yet"
              message="Join or create a fleet to connect with other sailors"
              actionLabel="Join Fleet"
              onAction={() => router.push('/fleet')}
            />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
