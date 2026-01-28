/**
 * @deprecated This component is no longer rendered. Its content (clubs, racing
 * areas) has been moved to VenueDetailHeader which is rendered in the venue
 * detail screen (app/venue/[id].tsx). The venue tab now shows a directory
 * listing instead of a single-venue view.
 *
 * VenueOverviewSegment (DEPRECATED)
 *
 * Previously the default segment for the venue tab. Showed conditions bar,
 * compact hero map, racing area list, and community highlights.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import { ConditionsCompactBar } from '../ConditionsCompactBar';
import { VenueHeroMap } from '../VenueHeroMap';
import { PostPreviewCard } from '../feed/PostPreviewCard';
import { CommunityVenueCreationService, type VenueRacingArea } from '@/services/venue/CommunityVenueCreationService';
import { CommunityFeedService } from '@/services/venue/CommunityFeedService';
import { useMapPinnedPosts } from '@/hooks/useCommunityFeed';
import type { LiveWeatherData } from '@/hooks/useVenueLiveWeather';
import type { FeedPost, CurrentConditions } from '@/types/community-feed';

// Helper to convert wind degrees to compass text
function degToCompass(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

interface VenueOverviewSegmentProps {
  venueId: string;
  venueName: string;
  venueCountry?: string;
  latitude: number;
  longitude: number;
  liveWeather: LiveWeatherData | null;
  isWeatherLoading: boolean;
  currentConditions?: CurrentConditions;
  onSwitchSegment: (segment: 'feed' | 'map') => void;
  onPostPress: (post: FeedPost) => void;
  onAreaSelect?: (area: VenueRacingArea) => void;
}

export function VenueOverviewSegment({
  venueId,
  venueName,
  venueCountry,
  latitude,
  longitude,
  liveWeather,
  isWeatherLoading,
  currentConditions: _currentConditions,
  onSwitchSegment,
  onPostPress,
  onAreaSelect,
}: VenueOverviewSegmentProps) {
  const router = useRouter();

  // Racing areas
  const [racingAreas, setRacingAreas] = useState<VenueRacingArea[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(true);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  // Highlight posts
  const [highlightPosts, setHighlightPosts] = useState<FeedPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  // Map pinned posts
  const { data: mapPinnedPosts } = useMapPinnedPosts(venueId);

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Wind data for sparklines
  const windData = useMemo(() => {
    if (!liveWeather) return [];
    const base = liveWeather.windSpeed || 10;
    return Array.from({ length: 12 }, (_, i) => base + Math.sin(i * 0.5) * 3 + Math.random() * 2);
  }, [liveWeather]);

  // Load racing areas
  const loadRacingAreas = useCallback(async () => {
    try {
      const { verified, pending } = await CommunityVenueCreationService.getRacingAreasForMap(venueId);
      setRacingAreas([...verified, ...pending]);
    } catch {
      // Silent fail
    } finally {
      setIsLoadingAreas(false);
    }
  }, [venueId]);

  // Load highlight posts (pinned first, then recent)
  const loadHighlights = useCallback(async () => {
    try {
      const result = await CommunityFeedService.getFeed({
        venueId,
        sort: 'hot',
        limit: 5,
        page: 0,
      });
      setHighlightPosts(result.data);
    } catch {
      // Silent fail
    } finally {
      setIsLoadingPosts(false);
    }
  }, [venueId]);

  // Initial load
  useEffect(() => {
    loadRacingAreas();
    loadHighlights();
  }, [loadRacingAreas, loadHighlights]);

  // Refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadRacingAreas(), loadHighlights()]);
    setIsRefreshing(false);
  }, [loadRacingAreas, loadHighlights]);

  const handleAreaSelect = useCallback((area: VenueRacingArea) => {
    setSelectedAreaId(prev => (prev === area.id ? null : area.id));
    onAreaSelect?.(area);
  }, [onAreaSelect]);

  const handlePostPress = useCallback((post: FeedPost) => {
    onPostPress(post);
  }, [onPostPress]);

  const handlePostMarkerPress = useCallback((post: FeedPost) => {
    router.push(`/venue/post/${post.id}`);
  }, [router]);

  // Sort highlight posts: pinned first
  const sortedHighlights = useMemo(() => {
    return [...highlightPosts].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });
  }, [highlightPosts]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Conditions Compact Bar */}
      <ConditionsCompactBar
        weather={liveWeather}
        isLoading={isWeatherLoading}
      />

      {/* Hero Map (compact) */}
      <VenueHeroMap
        venueName={venueName}
        venueCountry={venueCountry}
        center={{ latitude, longitude }}
        racingAreas={racingAreas}
        selectedAreaId={selectedAreaId}
        onAreaSelect={handleAreaSelect}
        height={180}
        isLoading={isLoadingAreas}
        windSpeed={liveWeather?.windSpeed}
        windDirection={liveWeather?.windDirection ? degToCompass(liveWeather.windDirection) : undefined}
        windData={windData}
        tideHeight={liveWeather?.tidalHeight}
        tideState={liveWeather?.tidalState as any}
        currentSpeed={liveWeather?.currentSpeed}
        mapPinnedPosts={mapPinnedPosts}
        onPostMarkerPress={handlePostMarkerPress}
      />

      {/* Racing Areas Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RACING AREAS</Text>
          <Text style={styles.sectionCount}>
            {racingAreas.length} area{racingAreas.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {isLoadingAreas ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={IOS_COLORS.secondaryLabel} />
          </View>
        ) : racingAreas.length === 0 ? (
          <View style={styles.emptyRow}>
            <Ionicons name="location-outline" size={20} color={IOS_COLORS.tertiaryLabel} />
            <Text style={styles.emptyText}>No racing areas defined</Text>
          </View>
        ) : (
          <View style={styles.areasList}>
            {racingAreas.map((area, index) => (
              <React.Fragment key={area.id}>
                {index > 0 && <View style={styles.listSeparator} />}
                <Pressable
                  style={styles.areaRow}
                  onPress={() => handleAreaSelect(area)}
                >
                  <View style={styles.areaRowLeft}>
                    <Text style={styles.areaName} numberOfLines={1}>{area.name}</Text>
                    {area.description && (
                      <Text style={styles.areaDescription} numberOfLines={1}>
                        {area.description}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={IOS_COLORS.tertiaryLabel} />
                </Pressable>
              </React.Fragment>
            ))}
          </View>
        )}
      </View>

      {/* Community Highlights */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>COMMUNITY KNOWLEDGE</Text>
        </View>

        {isLoadingPosts ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={IOS_COLORS.secondaryLabel} />
          </View>
        ) : sortedHighlights.length === 0 ? (
          <View style={styles.emptyRow}>
            <Ionicons name="chatbubbles-outline" size={20} color={IOS_COLORS.tertiaryLabel} />
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
        ) : (
          <View style={styles.highlightsList}>
            {sortedHighlights.slice(0, 5).map((post, index) => (
              <React.Fragment key={post.id}>
                {index > 0 && <View style={styles.listSeparator} />}
                <PostPreviewCard post={post} onPress={() => handlePostPress(post)} />
              </React.Fragment>
            ))}
            {/* See All link */}
            <View style={styles.listSeparator} />
            <Pressable style={styles.seeAllRow} onPress={() => onSwitchSegment('feed')}>
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="arrow-forward" size={14} color={IOS_COLORS.systemBlue} />
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  contentContainer: {
    paddingBottom: 100,
  },

  // Sections
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: IOS_COLORS.secondaryLabel,
  },
  sectionCount: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
  },

  // Area list rows
  areasList: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  areaRowLeft: {
    flex: 1,
    gap: 2,
  },
  areaName: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
    letterSpacing: -0.24,
  },
  areaDescription: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: -0.08,
  },

  // Highlights list
  highlightsList: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
    letterSpacing: -0.24,
  },

  // Shared
  listSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginLeft: 16,
  },
  loadingRow: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    color: IOS_COLORS.tertiaryLabel,
  },
});

export default VenueOverviewSegment;
