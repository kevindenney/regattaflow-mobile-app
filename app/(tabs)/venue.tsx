/**
 * Venue Intelligence - 3-Segment Architecture
 *
 * TabScreenToolbar with IOSSegmentedControl (Overview | Feed | Map)
 * and conditionally mounted segment components.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useVenueIntelligence } from '@/hooks/useVenueIntelligence';
import { useSavedVenues } from '@/hooks/useSavedVenues';
import { useAuth } from '@/providers/AuthProvider';
import { venueDetectionService } from '@/services/location/VenueDetectionService';
import { VenueIntelligenceAgent } from '@/services/agents/VenueIntelligenceAgent';
import { VenueComparisonModal } from '@/components/venue/VenueComparisonModal';
import { PostComposer } from '@/components/venue/post/PostComposer';
import { useVenueLiveWeather } from '@/hooks/useVenueLiveWeather';
import { TabScreenToolbar } from '@/components/ui/TabScreenToolbar';
import { IOSSegmentedControl } from '@/components/ui/ios/IOSSegmentedControl';
import { VenueOverviewSegment } from '@/components/venue/segments/VenueOverviewSegment';
import { VenueFeedSegment } from '@/components/venue/segments/VenueFeedSegment';
import { VenueMapSegment } from '@/components/venue/segments/VenueMapSegment';
import type { ToolbarAction } from '@/components/ui/TabScreenToolbar';
import type { FeedPost, CurrentConditions } from '@/types/community-feed';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VenueSegment = 'overview' | 'feed' | 'map';

interface Venue {
  id: string;
  name: string;
  country: string;
  region: string;
  venue_type: string;
  coordinates_lat: number;
  coordinates_lng: number;
}

const SEGMENTS: { value: VenueSegment; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'feed', label: 'Feed' },
  { value: 'map', label: 'Map' },
];

// Helper to convert wind degrees to compass text
function degToCompass(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function VenueIntelligenceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ segment?: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { currentVenue: rawCurrentVenue, isDetecting, initializeDetection, setVenueManually } = useVenueIntelligence();
  const { savedVenueIds, saveVenue, unsaveVenue, refreshSavedVenues } = useSavedVenues();

  // Transform SailingVenue to Venue type
  const currentVenue = useMemo<Venue | null>(() => {
    if (!rawCurrentVenue) return null;
    return {
      id: rawCurrentVenue.id,
      name: rawCurrentVenue.name,
      country: rawCurrentVenue.country,
      region: rawCurrentVenue.region,
      venue_type: rawCurrentVenue.venueType,
      coordinates_lat: rawCurrentVenue.coordinates[1],
      coordinates_lng: rawCurrentVenue.coordinates[0],
    };
  }, [rawCurrentVenue]);

  // ----- Segment state -----
  const initialSegment = (params.segment as VenueSegment) || 'overview';
  const [segment, setSegment] = useState<VenueSegment>(initialSegment);

  // ----- Live weather -----
  const { weather: liveWeather, isLoading: isWeatherLoading } = useVenueLiveWeather(
    currentVenue?.coordinates_lat,
    currentVenue?.coordinates_lng,
    currentVenue?.id,
    currentVenue?.name,
  );

  // ----- Current conditions (for feed condition matching) -----
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

  // ----- Post composer -----
  const [showComposer, setShowComposer] = useState(false);

  // ----- Venue comparison -----
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [savedVenuesList] = useState<Venue[]>([]);

  // ----- AI Detection state -----
  const [_isDetectingVenue, setIsDetectingVenue] = useState(false);
  const [aiVenueResult, setAiVenueResult] = useState<any>(null);
  const [showVenueConfirmModal, setShowVenueConfirmModal] = useState(false);

  // ----- AI Analysis state -----
  const [loadingVenueAnalysis, setLoadingVenueAnalysis] = useState(false);
  const [venueAnalysis, setVenueAnalysis] = useState<any>(null);
  const [showVenueAnalysisModal, setShowVenueAnalysisModal] = useState(false);
  const [analysisCacheInfo, setAnalysisCacheInfo] = useState<{
    fromCache: boolean;
    cacheAge?: string;
    tokensUsed?: number;
  } | null>(null);

  // =====================================================================
  // Handlers (kept at screen level for modals)
  // =====================================================================

  const handleManualSelect = useCallback(() => {
    setShowVenueConfirmModal(false);
    Alert.alert('Manual Selection', 'Please select a venue from the map or sidebar.');
  }, []);

  // GPS fallback
  const detectVenueWithoutAI = useCallback(async (latitude: number, longitude: number) => {
    try {
      const { supabase } = await import('@/services/supabase');
      let { data: venues, error } = await supabase.rpc('venues_within_radius', {
        lat: latitude, lng: longitude, radius_km: 50,
      });
      if (error && (error as any)?.code?.startsWith?.('PGRST2')) {
        const radiusKm = 50;
        const latDelta = radiusKm / 111;
        const lngDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));
        const fallback = await supabase.rpc('venues_within_bbox', {
          min_lon: longitude - lngDelta, min_lat: latitude - latDelta,
          max_lon: longitude + lngDelta, max_lat: latitude + latDelta,
        });
        venues = fallback.data as any[] | null;
        error = fallback.error as any;
      }
      if (error) throw error;
      if (!venues || venues.length === 0) {
        return { success: false, message: 'No sailing venues found within 50km of your location' };
      }
      const closest = venues[0];
      return {
        success: true,
        venueId: closest.id,
        venueName: closest.name,
        distance: closest.distance_km,
        confidence: Math.max(0.1, Math.min(1.0, 1 - (closest.distance_km / 50))),
        coordinates: { lat: closest.coordinates.coordinates[1], lng: closest.coordinates.coordinates[0] },
        alternatives: venues.slice(1, 4).map((v: any) => ({ venueId: v.id, name: v.name, distance: v.distance_km })),
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }, []);

  const handleAIVenueDetection = useCallback(async () => {
    try {
      setIsDetectingVenue(true);
      setAiVenueResult(null);
      if (Platform.OS === 'web') {
        setIsDetectingVenue(false);
        Alert.alert('Not Available', 'Location detection is not available on web.');
        return;
      }
      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsDetectingVenue(false);
        Alert.alert('Permission Required', 'Location access is needed to detect your sailing venue.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      let venueData: any = null;
      let usedFallback = false;
      try {
        const agent = new VenueIntelligenceAgent();
        const agentResult = await agent.switchVenueByGPS({
          latitude: location.coords.latitude, longitude: location.coords.longitude,
        });
        if (agentResult.success && agentResult.toolResults?.detect_venue_from_gps) {
          venueData = agentResult.toolResults.detect_venue_from_gps;
        } else {
          usedFallback = true;
          venueData = await detectVenueWithoutAI(location.coords.latitude, location.coords.longitude);
        }
      } catch {
        usedFallback = true;
        venueData = await detectVenueWithoutAI(location.coords.latitude, location.coords.longitude);
      }
      setIsDetectingVenue(false);
      if (venueData?.success && venueData.venueId) {
        if (usedFallback) venueData.detectionMethod = 'GPS Fallback';
        setAiVenueResult(venueData);
        setShowVenueConfirmModal(true);
      } else {
        Alert.alert('No Venue Found', venueData?.message || 'No sailing venues found within 50km.', [
          { text: 'Manual Select', onPress: handleManualSelect },
          { text: 'OK', style: 'cancel' },
        ]);
      }
    } catch (err: any) {
      setIsDetectingVenue(false);
      Alert.alert('Detection Error', err.message || 'An unexpected error occurred.', [
        { text: 'Manual Select', onPress: handleManualSelect },
        { text: 'OK', style: 'cancel' },
      ]);
    }
  }, [detectVenueWithoutAI, handleManualSelect]);

  const handleConfirmVenue = useCallback(async () => {
    if (!aiVenueResult?.venueId) return;
    try {
      const success = await setVenueManually(aiVenueResult.venueId);
      setShowVenueConfirmModal(false);
      if (success) {
        Alert.alert('Venue Confirmed', `Successfully switched to ${aiVenueResult.venueName || 'selected venue'}`);
      } else {
        Alert.alert('Switch Failed', 'Could not switch to the detected venue.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to confirm venue selection');
    }
  }, [aiVenueResult, setVenueManually]);

  const handleAskAIAboutVenue = useCallback(async (forceRefresh = false) => {
    if (!currentVenue?.id) { Alert.alert('No Venue', 'Please select a venue first.'); return; }
    setLoadingVenueAnalysis(true);
    try {
      const agent = new VenueIntelligenceAgent();
      const result = await agent.analyzeVenue(currentVenue.id, user?.id, forceRefresh);
      setLoadingVenueAnalysis(false);
      if (result.success) {
        setVenueAnalysis(result.insights);
        setAnalysisCacheInfo({ fromCache: result.fromCache || false, cacheAge: result.cacheAge, tokensUsed: result.tokensUsed });
        setShowVenueAnalysisModal(true);
      } else {
        Alert.alert('Analysis Failed', result.error || 'Could not analyze venue');
      }
    } catch (err: any) {
      setLoadingVenueAnalysis(false);
      Alert.alert('Error', err.message || 'Failed to analyze venue');
    }
  }, [currentVenue, user]);

  const handleSaveVenue = useCallback(async () => {
    if (!currentVenue?.id) return;
    try {
      if (savedVenueIds.has(currentVenue.id)) {
        await unsaveVenue(currentVenue.id);
        Alert.alert('Removed', `${currentVenue.name} removed from saved venues`);
      } else {
        await saveVenue(currentVenue.id);
        Alert.alert('Saved!', `${currentVenue.name} added to your saved venues`);
      }
      refreshSavedVenues();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update saved venues');
    }
  }, [currentVenue, savedVenueIds, saveVenue, unsaveVenue, refreshSavedVenues]);

  const handlePostPress = useCallback((post: FeedPost) => {
    router.push(`/venue/post/${post.id}`);
  }, [router]);

  // =====================================================================
  // Initialization
  // =====================================================================

  useEffect(() => {
    const initVenue = async () => {
      if (Platform.OS === 'web') {
        const check = venueDetectionService.getCurrentVenue();
        if (!check) {
          try {
            const ok = await setVenueManually('hong-kong-victoria-harbor');
            if (!ok) await setVenueManually('newport-rhode-island');
          } catch { /* silent */ }
        }
        return;
      }
      try { await initializeDetection(); } catch { /* silent */ }
      setTimeout(async () => {
        const check = venueDetectionService.getCurrentVenue();
        if (!check) {
          try {
            const ok = await setVenueManually('hong-kong-victoria-harbor');
            if (!ok) await setVenueManually('newport-rhode-island');
          } catch { /* silent */ }
        }
      }, 500);
    };
    initVenue();
  }, [initializeDetection, setVenueManually]);

  // =====================================================================
  // Toolbar
  // =====================================================================

  const conditionsSubtitle = useMemo(() => {
    if (!liveWeather) return undefined;
    const parts: string[] = [];
    if (liveWeather.windSpeed != null) {
      parts.push(`${liveWeather.windSpeed}kt ${degToCompass(liveWeather.windDirection)}`);
    }
    if (liveWeather.tidalHeight != null) {
      parts.push(`${liveWeather.tidalHeight.toFixed(1)}m ${liveWeather.tidalState || ''}`);
    }
    return parts.join(' · ') || undefined;
  }, [liveWeather]);

  const venueToolbarActions: ToolbarAction[] = useMemo(() => {
    const actions: ToolbarAction[] = [
      {
        icon: 'create-outline',
        label: 'Compose post',
        onPress: () => setShowComposer(true),
      },
      {
        icon: 'navigate-outline',
        label: 'Detect venue via GPS',
        onPress: handleAIVenueDetection,
      },
    ];
    if (currentVenue) {
      actions.push({
        icon: savedVenueIds.has(currentVenue.id) ? 'bookmark' : 'bookmark-outline',
        label: savedVenueIds.has(currentVenue.id) ? 'Remove saved venue' : 'Save venue',
        isActive: savedVenueIds.has(currentVenue.id),
        onPress: handleSaveVenue,
      });
    }
    return actions;
  }, [currentVenue, savedVenueIds, handleAIVenueDetection, handleSaveVenue]);

  // =====================================================================
  // Render
  // =====================================================================

  if (isDetecting) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText style={styles.loadingText}>Detecting your sailing venue...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Toolbar + Segmented Control */}
      <TabScreenToolbar
        title={currentVenue?.name || 'Venue'}
        subtitle={conditionsSubtitle}
        topInset={insets.top}
        actions={venueToolbarActions}
      >
        <View style={styles.segmentContainer}>
          <IOSSegmentedControl
            segments={SEGMENTS}
            selectedValue={segment}
            onValueChange={setSegment}
          />
        </View>
      </TabScreenToolbar>

      {/* Segments */}
      {segment === 'overview' && currentVenue && (
        <VenueOverviewSegment
          venueId={currentVenue.id}
          venueName={currentVenue.name}
          venueCountry={currentVenue.country}
          latitude={currentVenue.coordinates_lat}
          longitude={currentVenue.coordinates_lng}
          liveWeather={liveWeather}
          isWeatherLoading={isWeatherLoading}
          currentConditions={currentConditions}
          onSwitchSegment={setSegment}
          onPostPress={handlePostPress}
        />
      )}

      {segment === 'feed' && currentVenue && (
        <VenueFeedSegment
          venueId={currentVenue.id}
          currentConditions={currentConditions}
          onPostPress={handlePostPress}
          onCreatePost={() => setShowComposer(true)}
        />
      )}

      {segment === 'map' && (
        <VenueMapSegment
          currentVenue={currentVenue}
          liveWeather={liveWeather}
          savedVenueIds={savedVenueIds}
          onSaveVenue={handleSaveVenue}
          onAskAI={() => handleAskAIAboutVenue()}
          loadingAI={loadingVenueAnalysis}
          onCompare={() => setShowComparisonModal(true)}
        />
      )}

      {/* No-venue fallback for overview/feed */}
      {segment !== 'map' && !currentVenue && (
        <View style={styles.noVenueContainer}>
          <ThemedText style={styles.noVenueTitle}>No Venue Selected</ThemedText>
          <ThemedText style={styles.noVenueText}>
            Switch to the Map tab to explore venues, or tap the GPS icon to detect your current venue.
          </ThemedText>
        </View>
      )}

      {/* ==================== MODALS ==================== */}

      {/* Post Composer */}
      <PostComposer
        visible={showComposer}
        venueId={currentVenue?.id || ''}
        onDismiss={() => setShowComposer(false)}
      />

      {/* AI Venue Analysis Modal */}
      <Modal
        visible={showVenueAnalysisModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowVenueAnalysisModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>AI Venue Intelligence</ThemedText>
              <TouchableOpacity onPress={() => setShowVenueAnalysisModal(false)}>
                <ThemedText style={styles.closeButton}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            {analysisCacheInfo && (
              <View style={[styles.cacheIndicator, { backgroundColor: analysisCacheInfo.fromCache ? '#FEF3C7' : '#D1FAE5' }]}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.cacheStatusText, { color: analysisCacheInfo.fromCache ? '#78350F' : '#065F46' }]}>
                    {analysisCacheInfo.fromCache ? `Cached ${analysisCacheInfo.cacheAge}` : 'Fresh analysis'}
                  </ThemedText>
                  {analysisCacheInfo.tokensUsed != null && (
                    <ThemedText style={styles.cacheMetaText}>{analysisCacheInfo.tokensUsed} tokens used</ThemedText>
                  )}
                </View>
                {analysisCacheInfo.fromCache && (
                  <TouchableOpacity onPress={() => handleAskAIAboutVenue(true)} disabled={loadingVenueAnalysis} style={styles.refreshButton}>
                    {loadingVenueAnalysis ? <ActivityIndicator size="small" color="#78350F" /> : <ThemedText style={styles.refreshButtonText}>Refresh</ThemedText>}
                  </TouchableOpacity>
                )}
              </View>
            )}

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {venueAnalysis && (
                <>
                  <View style={styles.venueInfoCard}>
                    <ThemedText style={styles.venueName}>{venueAnalysis.venueName}</ThemedText>
                    <ThemedText style={styles.venueDistance}>AI-Generated Intelligence</ThemedText>
                  </View>
                  {venueAnalysis.recommendations?.safety && (
                    <View style={[styles.recCard, { backgroundColor: '#FEE2E2' }]}>
                      <ThemedText style={[styles.recTitle, { color: '#991B1B' }]}>Safety Recommendations</ThemedText>
                      <ThemedText style={[styles.recBody, { color: '#7F1D1D' }]}>{venueAnalysis.recommendations.safety}</ThemedText>
                    </View>
                  )}
                  {venueAnalysis.recommendations?.racing && (
                    <View style={[styles.recCard, { backgroundColor: '#D1FAE5' }]}>
                      <ThemedText style={[styles.recTitle, { color: '#065F46' }]}>Racing Tips</ThemedText>
                      <ThemedText style={[styles.recBody, { color: '#047857' }]}>{venueAnalysis.recommendations.racing}</ThemedText>
                    </View>
                  )}
                  {venueAnalysis.recommendations?.cultural && (
                    <View style={styles.recCard}>
                      <ThemedText style={styles.recTitle}>Cultural Notes</ThemedText>
                      <ThemedText style={styles.recBody}>{venueAnalysis.recommendations.cultural}</ThemedText>
                    </View>
                  )}
                  {venueAnalysis.recommendations?.practice && (
                    <View style={[styles.recCard, { backgroundColor: '#FEF3C7' }]}>
                      <ThemedText style={[styles.recTitle, { color: '#78350F' }]}>Practice Areas</ThemedText>
                      <ThemedText style={[styles.recBody, { color: '#92400E' }]}>{venueAnalysis.recommendations.practice}</ThemedText>
                    </View>
                  )}
                  {venueAnalysis.recommendations?.timing && (
                    <View style={[styles.recCard, { backgroundColor: '#E0E7FF' }]}>
                      <ThemedText style={[styles.recTitle, { color: '#3730A3' }]}>Optimal Conditions</ThemedText>
                      <ThemedText style={[styles.recBody, { color: '#4338CA' }]}>{venueAnalysis.recommendations.timing}</ThemedText>
                    </View>
                  )}
                  {venueAnalysis.analysis && (
                    <View style={styles.analysisCard}>
                      <ThemedText style={styles.analysisLabel}>Complete AI Analysis</ThemedText>
                      <ThemedText style={styles.analysisBody}>{venueAnalysis.analysis}</ThemedText>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.confirmButton} onPress={() => setShowVenueAnalysisModal(false)}>
                <ThemedText style={styles.confirmButtonText}>Close</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* AI Venue Confirmation Modal */}
      <Modal
        visible={showVenueConfirmModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowVenueConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {aiVenueResult?.venueId ? 'Venue Detected' : 'No Venue Found'}
              </ThemedText>
              <TouchableOpacity onPress={() => setShowVenueConfirmModal(false)}>
                <ThemedText style={styles.closeButton}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {aiVenueResult ? (
                <>
                  <View style={styles.venueInfoCard}>
                    <ThemedText style={styles.venueName}>{aiVenueResult.venueName || 'Unknown Venue'}</ThemedText>
                    {aiVenueResult.distance !== undefined && (
                      <ThemedText style={styles.venueDistance}>{aiVenueResult.distance.toFixed(1)} km from your location</ThemedText>
                    )}
                  </View>
                  {aiVenueResult.confidence !== undefined && (
                    <View style={styles.confidenceCard}>
                      <ThemedText style={styles.confidenceLabel}>Detection Confidence</ThemedText>
                      <ThemedText style={styles.confidenceValue}>{(aiVenueResult.confidence * 100).toFixed(0)}%</ThemedText>
                    </View>
                  )}
                  {aiVenueResult.alternatives?.length > 0 && (
                    <View style={styles.alternativesCard}>
                      <ThemedText style={styles.alternativesTitle}>Nearby Alternatives</ThemedText>
                      {aiVenueResult.alternatives.map((alt: any, index: number) => (
                        <View key={index} style={styles.alternativeItem}>
                          <ThemedText style={styles.alternativeName}>{alt.name}</ThemedText>
                          <ThemedText style={styles.alternativeDistance}>{alt.distance.toFixed(1)} km</ThemedText>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.venueInfoCard}>
                  <ThemedText style={styles.venueName}>No venue detected</ThemedText>
                  <ThemedText style={styles.venueDistance}>Unable to detect a venue at your current location</ThemedText>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.manualButton} onPress={handleManualSelect}>
                <ThemedText style={styles.manualButtonText}>Manual Select</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, !aiVenueResult?.venueId && styles.confirmButtonDisabled]}
                onPress={handleConfirmVenue}
                disabled={!aiVenueResult?.venueId}
              >
                <ThemedText style={[styles.confirmButtonText, !aiVenueResult?.venueId && styles.confirmButtonTextDisabled]}>
                  Confirm
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Venue Comparison Modal */}
      <VenueComparisonModal
        visible={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        venues={savedVenuesList}
        currentVenueId={currentVenue?.id}
        onSelectVenue={(venue) => {
          setShowComparisonModal(false);
          setVenueManually(venue.id);
        }}
      />
    </ThemedView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  segmentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
  },

  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },

  // No venue
  noVenueContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  noVenueTitle: { fontSize: 20, fontWeight: '600', color: '#374151', marginBottom: 8 },
  noVenueText: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },

  // Modal shared
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 24, fontWeight: 'bold' },
  closeButton: { fontSize: 24, color: '#6B7280' },
  modalBody: { marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12 },

  // Venue info
  venueInfoCard: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, marginBottom: 12 },
  venueName: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  venueDistance: { fontSize: 14, color: '#6B7280' },

  // Confidence
  confidenceCard: { backgroundColor: '#D1FAE5', borderRadius: 12, padding: 16, marginBottom: 12 },
  confidenceLabel: { fontSize: 14, color: '#065F46', marginBottom: 4 },
  confidenceValue: { fontSize: 24, fontWeight: 'bold', color: '#059669' },

  // Alternatives
  alternativesCard: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 16, marginBottom: 12 },
  alternativesTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#78350F' },
  alternativeItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  alternativeName: { fontSize: 14, color: '#92400E' },
  alternativeDistance: { fontSize: 14, fontWeight: '600', color: '#D97706' },

  // Recommendation cards
  recCard: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, marginBottom: 12 },
  recTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#1E3A8A' },
  recBody: { fontSize: 14, fontWeight: '500', color: '#1E40AF' },

  // Analysis
  analysisCard: { marginTop: 8 },
  analysisLabel: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
  analysisBody: { fontSize: 14, color: '#374151' },

  // Buttons
  manualButton: { flex: 1, backgroundColor: '#E5E7EB', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  manualButtonText: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
  confirmButton: { flex: 1, backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  confirmButtonDisabled: { backgroundColor: '#CBD5E1', opacity: 0.6 },
  confirmButtonText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  confirmButtonTextDisabled: { color: '#94A3B8' },

  // Cache
  cacheIndicator: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 16 },
  cacheStatusText: { fontSize: 14, fontWeight: '600' },
  cacheMetaText: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  refreshButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.5)' },
  refreshButtonText: { fontSize: 13, fontWeight: '600', color: '#78350F' },
});
