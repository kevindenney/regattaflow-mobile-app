/**
 * VenueKnowledgeHubRedesigned
 *
 * Apple/Tufte-inspired venue knowledge hub with:
 * - Hero map with racing areas as first-class citizens
 * - Unified knowledge feed (discussions, docs, tips)
 * - Community racing area creation
 * - Conditions sparklines
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TufteTokens, colors } from '@/constants/designSystem';
import { VenueHeroMap } from './VenueHeroMap';
import { RacingAreaCard } from './RacingAreaCard';
import { TufteLiveConditions } from './TufteLiveConditions';
import { CommunityFeed } from './feed/CommunityFeed';
import { PostComposer } from './post/PostComposer';
import { UnknownAreaPrompt, UnknownAreaBanner } from './UnknownAreaPrompt';
import { CommunityAreaBadge } from './CommunityAreaBadge';
import {
  CommunityVenueCreationService,
  type VenueRacingArea,
  type CreateCommunityAreaParams,
} from '@/services/venue/CommunityVenueCreationService';
import { useVenueLiveWeather } from '@/hooks/useVenueLiveWeather';
import { useMapPinnedPosts } from '@/hooks/useCommunityFeed';
import type { FeedPost, CurrentConditions } from '@/types/community-feed';

// Dynamic import helper for expo-location (native only)
let LocationModule: typeof import('expo-location') | null = null;

async function getLocationModule() {
  if (Platform.OS === 'web') {
    return null;
  }
  if (!LocationModule) {
    LocationModule = await import('expo-location');
  }
  return LocationModule;
}

// Helper to convert wind degrees to compass text
function getWindDirectionText(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

interface VenueKnowledgeHubRedesignedProps {
  venueId: string;
  venueName: string;
  venueRegion?: string;
  venueCountry?: string;
  latitude: number;
  longitude: number;
  onShowMap?: () => void;
  onSaveVenue?: () => void;
  isSaved?: boolean;
  /** When true, suppress the built-in header (used when parent renders TabScreenToolbar) */
  hideHeader?: boolean;
}

export function VenueKnowledgeHubRedesigned({
  venueId,
  venueName,
  venueRegion: _venueRegion,
  venueCountry,
  latitude,
  longitude,
  onShowMap: _onShowMap,
  onSaveVenue,
  isSaved = false,
  hideHeader = false,
}: VenueKnowledgeHubRedesignedProps) {
  const router = useRouter();

  // State
  const [racingAreas, setRacingAreas] = useState<VenueRacingArea[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [isLoadingAreas, setIsLoadingAreas] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Unknown area detection
  const [showUnknownAreaPrompt, setShowUnknownAreaPrompt] = useState(false);
  const [isInUnknownArea, setIsInUnknownArea] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Manual pin placement (for creating areas without GPS)
  const [manualPinLocation, setManualPinLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Community feed composer
  const [showComposer, setShowComposer] = useState(false);

  // Map pinned posts for overlay
  const { data: mapPinnedPosts } = useMapPinnedPosts(venueId);

  // Get live weather
  const { weather: liveWeather } = useVenueLiveWeather(
    latitude,
    longitude,
    venueId,
    venueName
  );

  // Load racing areas
  const loadRacingAreas = useCallback(async () => {
    try {
      const { verified, pending } = await CommunityVenueCreationService.getRacingAreasForMap(venueId);
      setRacingAreas([...verified, ...pending]);
    } catch (error) {
      console.error('Failed to load racing areas:', error);
    } finally {
      setIsLoadingAreas(false);
    }
  }, [venueId]);

  // Check for unknown area
  const checkUnknownArea = useCallback(async () => {
    const Location = await getLocationModule();
    if (!Location) return;

    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const detection = await CommunityVenueCreationService.detectUnknownArea(
        location.coords.latitude,
        location.coords.longitude
      );

      setIsInUnknownArea(detection.shouldPromptCreation);
    } catch (error) {
      // Silent fail - location services may not be available
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadRacingAreas();
    checkUnknownArea();
  }, [loadRacingAreas, checkUnknownArea]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadRacingAreas(), checkUnknownArea()]);
    setIsRefreshing(false);
  }, [loadRacingAreas, checkUnknownArea]);

  // Area selection handler
  const handleAreaSelect = useCallback((area: VenueRacingArea) => {
    setSelectedAreaId((prev) => (prev === area.id ? null : area.id));
  }, []);

  // Handle long press on map to place a pin
  const handleMapLongPress = useCallback((coords: { latitude: number; longitude: number }) => {
    setManualPinLocation(coords);
    setSelectedAreaId(null); // Clear area selection when placing pin
  }, []);

  // Clear manual pin
  const handleClearManualPin = useCallback(() => {
    setManualPinLocation(null);
  }, []);

  // Open create area prompt (from either manual pin or GPS detection)
  const handleOpenCreateArea = useCallback(() => {
    setShowUnknownAreaPrompt(true);
  }, []);

  // Confirm community area
  const handleConfirmArea = useCallback(async (areaId: string) => {
    if (!userLocation) return;
    try {
      await CommunityVenueCreationService.confirmCommunityArea(
        areaId,
        userLocation.latitude,
        userLocation.longitude
      );
      await loadRacingAreas(); // Refresh to show updated confirmation count
    } catch (error) {
      console.error('Failed to confirm area:', error);
    }
  }, [userLocation, loadRacingAreas]);

  // Create community area
  const handleCreateArea = useCallback(
    async (params: CreateCommunityAreaParams) => {
      await CommunityVenueCreationService.createCommunityArea({
        ...params,
        venueId,
      });
      await loadRacingAreas();
    },
    [venueId, loadRacingAreas]
  );

  // Selected area
  const selectedArea = racingAreas.find((a) => a.id === selectedAreaId);

  // Wind data for sparklines (mock - would come from weather service)
  const windData = liveWeather
    ? Array.from({ length: 12 }, (_, i) => {
        const base = liveWeather.windSpeed || 10;
        return base + Math.sin(i * 0.5) * 3 + Math.random() * 2;
      })
    : [];

  // Current conditions for community feed condition matching
  const currentConditions: CurrentConditions | undefined = useMemo(() => {
    if (!liveWeather) return undefined;
    return {
      windSpeed: liveWeather.windSpeed,
      windDirection: liveWeather.windDirection,
      windGusts: liveWeather.windGusts,
      waveHeight: liveWeather.waveHeight,
      currentSpeed: liveWeather.currentSpeed,
      tidalState: liveWeather.tidalState as CurrentConditions['tidalState'],
    };
  }, [liveWeather]);

  // Navigation handlers for community feed
  const handlePostPress = useCallback((post: FeedPost) => {
    router.push(`/venue/post/${post.id}`);
  }, [router]);

  return (
    <View style={styles.container}>
      {/* Header (Tufte: minimal chrome, inline conditions) - hidden when parent provides toolbar */}
      {!hideHeader && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.venueName} numberOfLines={1}>{venueName}</Text>
            <Text style={styles.venueSubtitle}>
              {venueCountry}
              {liveWeather?.windSpeed && ` · ${liveWeather.windSpeed}kt ${getWindDirectionText(liveWeather.windDirection)}`}
            </Text>
          </View>
          {onSaveVenue && (
            <Pressable
              style={[styles.saveButton, isSaved && styles.saveButtonActive]}
              onPress={onSaveVenue}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isSaved ? '#2563EB' : '#6B7280'}
              />
            </Pressable>
          )}
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Hero Map (with data-rich fallback for Expo Go) */}
        <VenueHeroMap
          venueName={venueName}
          venueCountry={venueCountry}
          center={{ latitude, longitude }}
          racingAreas={racingAreas}
          selectedAreaId={selectedAreaId}
          onAreaSelect={handleAreaSelect}
          onMapLongPress={handleMapLongPress}
          isInUnknownArea={isInUnknownArea}
          userLocation={userLocation}
          manualPinLocation={manualPinLocation}
          onClearManualPin={handleClearManualPin}
          onCreateAreaPress={handleOpenCreateArea}
          height={220}
          isLoading={isLoadingAreas}
          // Weather data for preview card fallback
          windSpeed={liveWeather?.windSpeed}
          windDirection={liveWeather?.windDirection ? getWindDirectionText(liveWeather.windDirection) : undefined}
          windData={windData}
          tideHeight={liveWeather?.tidalHeight}
          tideState={liveWeather?.tidalState as any}
          currentSpeed={liveWeather?.currentSpeed}
          mapPinnedPosts={mapPinnedPosts}
          onPostMarkerPress={handlePostPress}
        />

        {/* Tufte Live Conditions - Dense data display */}
        <TufteLiveConditions
          latitude={latitude}
          longitude={longitude}
          venueId={venueId}
          venueName={venueName}
        />

        {/* Unknown Area Banner (inline) */}
        {isInUnknownArea && userLocation && !showUnknownAreaPrompt && (
          <UnknownAreaBanner
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
            onPress={() => setShowUnknownAreaPrompt(true)}
          />
        )}

        {/* Racing Areas Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Racing Areas</Text>
            <Text style={styles.sectionCount}>
              {racingAreas.length} area{racingAreas.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {isLoadingAreas ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6B7280" />
            </View>
          ) : racingAreas.length === 0 ? (
            <View style={styles.emptyAreas}>
              <Ionicons name="location-outline" size={24} color="#D1D5DB" />
              <Text style={styles.emptyAreasText}>No racing areas defined</Text>
              <Pressable
                style={styles.createAreaButton}
                onPress={() => setShowUnknownAreaPrompt(true)}
              >
                <Ionicons name="add" size={16} color="#2563EB" />
                <Text style={styles.createAreaButtonText}>Create First Area</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.areasScroll}
            >
              {racingAreas.map((area) => (
                <RacingAreaCard
                  key={area.id}
                  area={area}
                  isSelected={selectedAreaId === area.id}
                  onPress={() => handleAreaSelect(area)}
                  onConfirm={() => handleConfirmArea(area.id)}
                  windData={windData}
                  currentWindSpeed={liveWeather?.windSpeed}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Selected Area Details */}
        {selectedArea && (
          <View style={styles.selectedAreaSection}>
            <View style={styles.selectedAreaHeader}>
              <View style={styles.selectedAreaTitleRow}>
                <Text style={styles.selectedAreaTitle}>{selectedArea.name}</Text>
                <CommunityAreaBadge
                  source={selectedArea.source}
                  verificationStatus={selectedArea.verification_status}
                  confirmationCount={selectedArea.confirmation_count}
                  userHasConfirmed={selectedArea.user_has_confirmed}
                  onConfirm={() => handleConfirmArea(selectedArea.id)}
                />
              </View>
              {selectedArea.description && (
                <Text style={styles.selectedAreaDescription}>
                  {selectedArea.description}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Community Knowledge Feed */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Community Knowledge</Text>
            {selectedArea && (
              <Pressable onPress={() => setSelectedAreaId(null)}>
                <Text style={styles.clearFilter}>Show all</Text>
              </Pressable>
            )}
          </View>

          <CommunityFeed
            venueId={venueId}
            racingAreaId={selectedAreaId}
            currentConditions={currentConditions}
            onPostPress={handlePostPress}
            onCreatePost={() => setShowComposer(true)}
            emptyMessage={
              selectedArea
                ? `No knowledge shared for ${selectedArea.name} yet`
                : 'No local knowledge shared yet'
            }
          />
        </View>
      </ScrollView>

      {/* FAB for creating new posts */}
      <Pressable
        style={styles.fab}
        onPress={() => setShowComposer(true)}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </Pressable>

      {/* Post Composer Modal */}
      <PostComposer
        visible={showComposer}
        venueId={venueId}
        racingAreaId={selectedAreaId}
        onDismiss={() => setShowComposer(false)}
      />

      {/* Unknown Area Prompt Modal - Uses manual pin > user GPS > venue center as fallback */}
      <UnknownAreaPrompt
        visible={showUnknownAreaPrompt}
        latitude={manualPinLocation?.latitude ?? userLocation?.latitude ?? latitude}
        longitude={manualPinLocation?.longitude ?? userLocation?.longitude ?? longitude}
        nearestVenue={{ id: venueId, name: venueName, distanceKm: 0 }}
        onCreateArea={async (params) => {
          await handleCreateArea(params);
          setManualPinLocation(null); // Clear pin after creation
        }}
        onDismiss={() => {
          setShowUnknownAreaPrompt(false);
          setManualPinLocation(null); // Clear pin on dismiss
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TufteTokens.backgrounds.paper,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: TufteTokens.spacing.section,
    paddingVertical: TufteTokens.spacing.standard,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: TufteTokens.backgrounds.paper,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.colorSubtle,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  venueName: {
    ...TufteTokens.typography.primary,
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  venueSubtitle: {
    ...TufteTokens.typography.secondary,
    color: colors.text.secondary,
  },
  saveButton: {
    padding: TufteTokens.spacing.compact,
    borderRadius: TufteTokens.borderRadius.subtle,
  },
  saveButtonActive: {
    backgroundColor: colors.primary[50],
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Sections
  section: {
    paddingTop: TufteTokens.spacing.section,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: TufteTokens.spacing.section,
    marginBottom: TufteTokens.spacing.standard,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#8E8E93',
  },
  sectionCount: {
    ...TufteTokens.typography.micro,
    color: '#9CA3AF',
  },
  clearFilter: {
    ...TufteTokens.typography.micro,
    color: '#2563EB',
    fontWeight: '600',
  },

  // Racing areas
  areasScroll: {
    paddingHorizontal: TufteTokens.spacing.section,
    gap: TufteTokens.spacing.standard,
  },
  loadingContainer: {
    padding: TufteTokens.spacing.section,
    alignItems: 'center',
  },
  emptyAreas: {
    alignItems: 'center',
    padding: TufteTokens.spacing.section,
    gap: TufteTokens.spacing.compact,
  },
  emptyAreasText: {
    ...TufteTokens.typography.tertiary,
    color: '#9CA3AF',
  },
  createAreaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: TufteTokens.spacing.standard,
    paddingVertical: TufteTokens.spacing.compact,
    backgroundColor: '#EFF6FF',
    borderRadius: TufteTokens.borderRadius.subtle,
    marginTop: TufteTokens.spacing.compact,
  },
  createAreaButtonText: {
    ...TufteTokens.typography.tertiary,
    fontWeight: '600',
    color: '#2563EB',
  },

  // Selected area
  selectedAreaSection: {
    marginHorizontal: TufteTokens.spacing.section,
    marginTop: TufteTokens.spacing.standard,
    padding: TufteTokens.spacing.standard,
    backgroundColor: TufteTokens.backgrounds.subtle,
    borderRadius: TufteTokens.borderRadius.subtle,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  selectedAreaHeader: {
    gap: TufteTokens.spacing.tight,
  },
  selectedAreaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: TufteTokens.spacing.compact,
  },
  selectedAreaTitle: {
    ...TufteTokens.typography.primary,
    color: '#111827',
  },
  selectedAreaDescription: {
    ...TufteTokens.typography.tertiary,
    color: '#6B7280',
  },

  // FAB
  fab: {
    position: 'absolute',
    right: TufteTokens.spacing.section,
    bottom: Platform.OS === 'ios' ? 100 : 80,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    ...TufteTokens.shadows.subtle,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default VenueKnowledgeHubRedesigned;
