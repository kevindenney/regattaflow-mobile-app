/**
 * Venue Intelligence - Apple Maps-Style Interface
 * Full-screen map with collapsible sidebar and floating controls
 */

import React, { useState, useEffect } from 'react';
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
import { ThemedText } from '@/src/components/themed-text';
import { ThemedView } from '@/src/components/themed-view';
import { useVenueIntelligence } from '@/src/hooks/useVenueIntelligence';
import { useSavedVenues } from '@/src/hooks/useSavedVenues';
import { useAuth } from '@/src/providers/AuthProvider';
import { venueDetectionService } from '@/src/services/location/VenueDetectionService';
import { VenueMapView } from '@/src/components/venue/VenueMapView';
import { NetworkSidebar } from '@/src/components/venue/NetworkSidebar';
import { MapControls, MapLayers } from '@/src/components/venue/MapControls';
import { VenueDetailsSheet } from '@/src/components/venue/VenueDetailsSheet';
import { VenueIntelligenceAgent } from '@/src/services/agents/VenueIntelligenceAgent';
import * as Location from 'expo-location';

interface Venue {
  id: string;
  name: string;
  country: string;
  region: string;
  venue_type: string;
  coordinates_lat: number;
  coordinates_lng: number;
}

export default function VenueIntelligenceScreen() {
  const { user } = useAuth();
  const { currentVenue, isDetecting, initializeDetection, setVenueManually } = useVenueIntelligence();
  const { savedVenueIds, isLoading: savedVenuesLoading } = useSavedVenues();


  // UI State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedVenueForSheet, setSelectedVenueForSheet] = useState<Venue | null>(null);
  const [is3DEnabled, setIs3DEnabled] = useState(false);
  const [areLayersVisible, setAreLayersVisible] = useState(true);
  const [showOnlySavedVenues, setShowOnlySavedVenues] = useState(false);
  const [mapLayers, setMapLayers] = useState<MapLayers>({
    yachtClubs: true,
    sailmakers: false,
    riggers: false,
    coaches: false,
    chandlery: false,
    clothing: false,
    marinas: false,
    repair: false,
    engines: false,
  });

  // AI Venue Detection State
  const [isDetectingVenue, setIsDetectingVenue] = useState(false);
  const [aiVenueResult, setAiVenueResult] = useState<any>(null);
  const [showVenueConfirmModal, setShowVenueConfirmModal] = useState(false);

  // AI Venue Analysis State
  const [loadingVenueAnalysis, setLoadingVenueAnalysis] = useState(false);
  const [venueAnalysis, setVenueAnalysis] = useState<any>(null);
  const [showVenueAnalysisModal, setShowVenueAnalysisModal] = useState(false);
  const [analysisCacheInfo, setAnalysisCacheInfo] = useState<{
    fromCache: boolean;
    cacheAge?: string;
    tokensUsed?: number;
  } | null>(null);

  // Fallback GPS detection without AI (uses Supabase RPC)
  const detectVenueWithoutAI = async (latitude: number, longitude: number) => {
    try {
      const { supabase } = await import('@/src/services/supabase');

      // Try PostGIS function first
      let { data: venues, error } = await supabase.rpc('venues_within_radius', {
        lat: latitude,
        lng: longitude,
        radius_km: 50,
      });

      // Fallback to bounding box if RPC not available
      if (error && (error as any)?.code?.startsWith?.('PGRST2')) {
        const radiusKm = 50;
        const latDelta = radiusKm / 111;
        const lngDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

        const fallback = await supabase.rpc('venues_within_bbox', {
          min_lon: longitude - lngDelta,
          min_lat: latitude - latDelta,
          max_lon: longitude + lngDelta,
          max_lat: latitude + latDelta,
        });
        venues = fallback.data as any[] | null;
        error = fallback.error as any;
      }

      if (error) throw error;

      if (!venues || venues.length === 0) {
        return {
          success: false,
          message: `No sailing venues found within 50km of your location`,
        };
      }

      // Get the closest venue
      const closest = venues[0];
      const distanceKm = closest.distance_km;
      const confidence = Math.max(0.1, Math.min(1.0, 1 - (distanceKm / 50)));

      return {
        success: true,
        venueId: closest.id,
        venueName: closest.name,
        distance: distanceKm,
        confidence,
        coordinates: {
          lat: closest.coordinates.coordinates[1],
          lng: closest.coordinates.coordinates[0],
        },
        alternatives: venues.slice(1, 4).map((v: any) => ({
          venueId: v.id,
          name: v.name,
          distance: v.distance_km,
        })),
      };
    } catch (error: any) {
      console.error('❌ Fallback detection failed:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  };

  // Handle AI venue detection with fallback
  const handleAIVenueDetection = async () => {
    try {
      setIsDetectingVenue(true);
      setAiVenueResult(null); // Clear previous result

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsDetectingVenue(false);
        Alert.alert(
          'Permission Required',
          'Location access is needed to detect your sailing venue. Please enable location permissions in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log('📍 GPS Location:', location.coords);

      // Try AI detection first
      let venueData = null;
      let usedFallback = false;

      try {
        const agent = new VenueIntelligenceAgent();
        const agentResult = await agent.switchVenueByGPS({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        console.log('🤖 Venue Agent Result:', JSON.stringify(agentResult, null, 2));

        if (agentResult.success && agentResult.toolResults?.detect_venue_from_gps) {
          venueData = agentResult.toolResults.detect_venue_from_gps;
        } else {
          // AI failed, use fallback
          console.log('⚠️ AI detection failed, using GPS fallback');
          usedFallback = true;
          venueData = await detectVenueWithoutAI(location.coords.latitude, location.coords.longitude);
        }
      } catch (aiError: any) {
        // AI error, use fallback
        console.log('⚠️ AI error, using GPS fallback:', aiError.message);
        usedFallback = true;
        venueData = await detectVenueWithoutAI(location.coords.latitude, location.coords.longitude);
      }

      setIsDetectingVenue(false);

      // Check if detection found a venue
      if (venueData?.success && venueData.venueId) {
        if (usedFallback) {
          venueData.detectionMethod = 'GPS Fallback';
        }
        setAiVenueResult(venueData);
        setShowVenueConfirmModal(true);
      } else {
        // No venue found
        Alert.alert(
          'No Venue Found',
          venueData?.message || 'No sailing venues found within 50km of your location. Try manual selection or move closer to a registered venue.',
          [
            { text: 'Manual Select', onPress: handleManualSelect },
            { text: 'OK', style: 'cancel' }
          ]
        );
      }
    } catch (error: any) {
      setIsDetectingVenue(false);
      console.error('❌ Venue detection error:', error);

      Alert.alert(
        'Detection Error',
        error.message || 'An unexpected error occurred while detecting your venue.',
        [
          { text: 'Manual Select', onPress: handleManualSelect },
          { text: 'OK', style: 'cancel' }
        ]
      );
    }
  };

  // Confirm AI detected venue
  const handleConfirmVenue = async () => {
    if (!aiVenueResult?.venueId) {
      console.warn('⚠️ No venue ID to confirm');
      return;
    }

    try {
      const success = await setVenueManually(aiVenueResult.venueId);
      setShowVenueConfirmModal(false);

      if (success) {
        Alert.alert(
          'Venue Confirmed',
          `Successfully switched to ${aiVenueResult.venueName || 'selected venue'}`
        );
      } else {
        Alert.alert(
          'Switch Failed',
          'Could not switch to the detected venue. Please try manual selection.'
        );
      }
    } catch (error: any) {
      console.error('❌ Venue confirm error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to confirm venue selection'
      );
    }
  };

  // Manual venue selection fallback
  const handleManualSelect = () => {
    setShowVenueConfirmModal(false);
    Alert.alert('Manual Selection', 'Please select a venue from the map or sidebar.');
  };

  // Ask AI about current venue
  const handleAskAIAboutVenue = async (forceRefresh: boolean = false) => {
    if (!currentVenue?.id) {
      Alert.alert('No Venue', 'Please select a venue first.');
      return;
    }

    setLoadingVenueAnalysis(true);
    try {
      const agent = new VenueIntelligenceAgent();
      const result = await agent.analyzeVenue(
        currentVenue.id,
        user?.id, // Pass user ID for caching
        forceRefresh
      );

      console.log('🤖 Venue Analysis Result:', JSON.stringify(result, null, 2));

      setLoadingVenueAnalysis(false);

      if (result.success) {
        setVenueAnalysis(result.insights);
        setAnalysisCacheInfo({
          fromCache: result.fromCache || false,
          cacheAge: result.cacheAge,
          tokensUsed: result.tokensUsed,
        });
        setShowVenueAnalysisModal(true);
      } else {
        Alert.alert('Analysis Failed', result.error || 'Could not analyze venue');
      }
    } catch (error: any) {
      setLoadingVenueAnalysis(false);
      Alert.alert('Error', error.message || 'Failed to analyze venue');
    }
  };

  // Refresh venue analysis (bypass cache)
  const handleRefreshVenueAnalysis = async () => {
    await handleAskAIAboutVenue(true); // Force refresh
  };

  // Initialize venue detection
  useEffect(() => {
    const initVenue = async () => {
      try {
        await initializeDetection();
      } catch (error) {
        // Silent fail, user can select venue manually
      }

      // Auto-select default venue if no venue was detected
      setTimeout(async () => {
        const currentVenueCheck = venueDetectionService.getCurrentVenue();

        if (!currentVenueCheck) {
          try {
            const success = await setVenueManually('hong-kong-victoria-harbor');
            if (!success) {
              await setVenueManually('newport-rhode-island');
            }
          } catch (error) {
            // Silent fail, user can select venue manually
          }
        }
      }, 500);
    };

    initVenue();
  }, [initializeDetection, setVenueManually]);

  // Handle venue selection from sidebar
  const handleVenueSelect = async (venue: Venue) => {
    await setVenueManually(venue.id);
    setSelectedVenueForSheet(venue); // Show details sheet for selected venue
  };

  // Handle marker press on map
  const handleMarkerPress = (venue: Venue) => {
    setSelectedVenueForSheet(venue);
  };

  // Handle closing details sheet
  const handleCloseSheet = () => {
    setSelectedVenueForSheet(null);
  };

  if (isDetecting) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText style={styles.loadingText}>🌍 Detecting your sailing venue...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Full-Screen Map Background */}
      <View style={styles.mapContainer}>
        <VenueMapView
          currentVenue={currentVenue}
          onVenueSelect={handleVenueSelect}
          onMarkerPress={handleMarkerPress}
          showAllVenues={true}
          selectedVenue={selectedVenueForSheet}
          showOnlySavedVenues={showOnlySavedVenues}
          savedVenueIds={savedVenueIds}
          is3DEnabled={is3DEnabled}
          mapLayers={mapLayers}
        />
      </View>

      {/* Left Sidebar - Sailing Network */}
      <NetworkSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onPlacePress={(place) => {
          // Convert NetworkPlace to Venue for compatibility with existing map
          const venue = {
            id: place.id,
            name: place.name,
            country: place.country,
            region: place.location.region,
            venue_type: place.type,
            coordinates_lat: place.coordinates.lat,
            coordinates_lng: place.coordinates.lng,
          };
          setSelectedVenueForSheet(venue);
        }}
      />

      {/* Upper Right Map Controls */}
      <MapControls
        onToggle3D={() => setIs3DEnabled(!is3DEnabled)}
        onToggleLayers={() => setAreLayersVisible(!areLayersVisible)}
        onToggleSavedVenues={() => setShowOnlySavedVenues(!showOnlySavedVenues)}
        onSearchNearby={initializeDetection}
        is3DEnabled={is3DEnabled}
        areLayersVisible={areLayersVisible}
        showOnlySavedVenues={showOnlySavedVenues}
        savedVenuesCount={savedVenueIds.size}
        layers={mapLayers}
        onLayersChange={setMapLayers}
      />

      {/* Bottom Sheet - Venue Details */}
      <VenueDetailsSheet
        venue={selectedVenueForSheet}
        onClose={handleCloseSheet}
      />

      {/* AI Venue Buttons - Floating Bottom Center */}
      <View style={styles.floatingButtonContainer}>
        {/* Ask AI Button */}
        {currentVenue && (
          <TouchableOpacity
            style={[styles.aiDetectionButton, { backgroundColor: '#10B981', marginBottom: 12 }]}
            onPress={handleAskAIAboutVenue}
            disabled={loadingVenueAnalysis}
          >
            {loadingVenueAnalysis ? (
              <ActivityIndicator color="white" />
            ) : (
              <ThemedText style={styles.aiDetectionButtonText}>
                💡 Ask AI About This Venue
              </ThemedText>
            )}
          </TouchableOpacity>
        )}

        {/* Detect Venue Button */}
        <TouchableOpacity
          style={styles.aiDetectionButton}
          onPress={handleAIVenueDetection}
          disabled={isDetectingVenue}
        >
          {isDetectingVenue ? (
            <ActivityIndicator color="white" />
          ) : (
            <ThemedText style={styles.aiDetectionButtonText}>
              🤖 Detect Current Venue
            </ThemedText>
          )}
        </TouchableOpacity>
      </View>

      {/* AI Venue Analysis Modal */}
      <Modal
        visible={showVenueAnalysisModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVenueAnalysisModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>AI Venue Intelligence</ThemedText>
              <TouchableOpacity onPress={() => setShowVenueAnalysisModal(false)}>
                <ThemedText style={styles.closeButton}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Cache Status Indicator */}
            {analysisCacheInfo && (
              <View style={[
                styles.cacheIndicator,
                { backgroundColor: analysisCacheInfo.fromCache ? '#FEF3C7' : '#D1FAE5' }
              ]}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[
                    styles.cacheStatusText,
                    { color: analysisCacheInfo.fromCache ? '#78350F' : '#065F46' }
                  ]}>
                    {analysisCacheInfo.fromCache
                      ? `📦 Cached ${analysisCacheInfo.cacheAge}`
                      : '✨ Fresh analysis'
                    }
                  </ThemedText>
                  {analysisCacheInfo.tokensUsed && (
                    <ThemedText style={styles.cacheMetaText}>
                      {analysisCacheInfo.tokensUsed} tokens used
                    </ThemedText>
                  )}
                </View>
                {analysisCacheInfo.fromCache && (
                  <TouchableOpacity
                    onPress={handleRefreshVenueAnalysis}
                    disabled={loadingVenueAnalysis}
                    style={styles.refreshButton}
                  >
                    {loadingVenueAnalysis ? (
                      <ActivityIndicator size="small" color="#78350F" />
                    ) : (
                      <ThemedText style={styles.refreshButtonText}>🔄 Refresh</ThemedText>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {venueAnalysis && (
                <>
                  {/* Venue Name */}
                  <View style={styles.venueInfoCard}>
                    <ThemedText style={styles.venueName}>{venueAnalysis.venueName}</ThemedText>
                    <ThemedText style={styles.venueDistance}>
                      🤖 AI-Generated Intelligence
                    </ThemedText>
                  </View>

                  {/* Safety Recommendations */}
                  {venueAnalysis.recommendations?.safety && (
                    <View style={[styles.adaptationsCard, { backgroundColor: '#FEE2E2' }]}>
                      <ThemedText style={[styles.adaptationsTitle, { color: '#991B1B' }]}>
                        ⚠️ Safety Recommendations
                      </ThemedText>
                      <ThemedText style={[styles.adaptationValue, { color: '#7F1D1D' }]}>
                        {venueAnalysis.recommendations.safety}
                      </ThemedText>
                    </View>
                  )}

                  {/* Racing Tips */}
                  {venueAnalysis.recommendations?.racing && (
                    <View style={[styles.adaptationsCard, { backgroundColor: '#D1FAE5' }]}>
                      <ThemedText style={[styles.adaptationsTitle, { color: '#065F46' }]}>
                        🏆 Racing Tips
                      </ThemedText>
                      <ThemedText style={[styles.adaptationValue, { color: '#047857' }]}>
                        {venueAnalysis.recommendations.racing}
                      </ThemedText>
                    </View>
                  )}

                  {/* Cultural Notes */}
                  {venueAnalysis.recommendations?.cultural && (
                    <View style={styles.adaptationsCard}>
                      <ThemedText style={styles.adaptationsTitle}>
                        🌍 Cultural Notes
                      </ThemedText>
                      <ThemedText style={styles.adaptationValue}>
                        {venueAnalysis.recommendations.cultural}
                      </ThemedText>
                    </View>
                  )}

                  {/* Practice Areas */}
                  {venueAnalysis.recommendations?.practice && (
                    <View style={[styles.adaptationsCard, { backgroundColor: '#FEF3C7' }]}>
                      <ThemedText style={[styles.adaptationsTitle, { color: '#78350F' }]}>
                        📍 Practice Areas
                      </ThemedText>
                      <ThemedText style={[styles.adaptationValue, { color: '#92400E' }]}>
                        {venueAnalysis.recommendations.practice}
                      </ThemedText>
                    </View>
                  )}

                  {/* Optimal Conditions */}
                  {venueAnalysis.recommendations?.timing && (
                    <View style={[styles.adaptationsCard, { backgroundColor: '#E0E7FF' }]}>
                      <ThemedText style={[styles.adaptationsTitle, { color: '#3730A3' }]}>
                        ⏰ Optimal Conditions
                      </ThemedText>
                      <ThemedText style={[styles.adaptationValue, { color: '#4338CA' }]}>
                        {venueAnalysis.recommendations.timing}
                      </ThemedText>
                    </View>
                  )}

                  {/* Full Analysis */}
                  <View style={styles.toolsCard}>
                    <ThemedText style={styles.toolsLabel}>
                      Complete AI Analysis
                    </ThemedText>
                    <ThemedText style={{ fontSize: 14, color: '#374151', marginTop: 8 }}>
                      {venueAnalysis.analysis}
                    </ThemedText>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setShowVenueAnalysisModal(false)}
              >
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
        transparent={true}
        onRequestClose={() => setShowVenueConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {aiVenueResult?.venueId ? 'Venue Detected' : 'No Venue Found'}
              </ThemedText>
              <TouchableOpacity onPress={() => setShowVenueConfirmModal(false)}>
                <ThemedText style={styles.closeButton}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Detected Venue Info */}
              {aiVenueResult ? (
                <>
                  <View style={styles.venueInfoCard}>
                    <ThemedText style={styles.venueName}>
                      {aiVenueResult.venueName || 'Unknown Venue'}
                    </ThemedText>
                    {aiVenueResult.distance !== undefined && (
                      <ThemedText style={styles.venueDistance}>
                        📍 {aiVenueResult.distance.toFixed(1)} km from your location
                      </ThemedText>
                    )}
                  </View>

                  {/* Confidence Score */}
                  {aiVenueResult.confidence !== undefined && (
                    <View style={styles.confidenceCard}>
                      <ThemedText style={styles.confidenceLabel}>Detection Confidence</ThemedText>
                      <ThemedText style={styles.confidenceValue}>
                        {(aiVenueResult.confidence * 100).toFixed(0)}%
                      </ThemedText>
                    </View>
                  )}

                  {/* Alternative Venues */}
                  {aiVenueResult.alternatives && aiVenueResult.alternatives.length > 0 && (
                    <View style={styles.alternativesCard}>
                      <ThemedText style={styles.alternativesTitle}>Nearby Alternatives</ThemedText>
                      {aiVenueResult.alternatives.map((alt: any, index: number) => (
                        <View key={index} style={styles.alternativeItem}>
                          <ThemedText style={styles.alternativeName}>{alt.name}</ThemedText>
                          <ThemedText style={styles.alternativeDistance}>
                            {alt.distance.toFixed(1)} km
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.venueInfoCard}>
                  <ThemedText style={styles.venueName}>No venue detected</ThemedText>
                  <ThemedText style={styles.venueDistance}>
                    Unable to detect a venue at your current location
                  </ThemedText>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.manualButton} onPress={handleManualSelect}>
                <ThemedText style={styles.manualButtonText}>Manual Select</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (!aiVenueResult?.venueId) && styles.confirmButtonDisabled
                ]}
                onPress={handleConfirmVenue}
                disabled={!aiVenueResult?.venueId}
              >
                <ThemedText style={[
                  styles.confirmButtonText,
                  (!aiVenueResult?.venueId) && styles.confirmButtonTextDisabled
                ]}>
                  Confirm
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },

  // Floating AI Detection Button
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  aiDetectionButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  aiDetectionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
  },
  modalBody: {
    marginBottom: 16,
  },
  venueInfoCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  venueName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  venueDistance: {
    fontSize: 14,
    color: '#6B7280',
  },
  confidenceCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#065F46',
    marginBottom: 4,
  },
  confidenceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  adaptationsCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  adaptationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1E3A8A',
  },
  adaptationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  adaptationLabel: {
    fontSize: 14,
    color: '#3B82F6',
  },
  adaptationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  alternativesCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  alternativesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#78350F',
  },
  alternativeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  alternativeName: {
    fontSize: 14,
    color: '#92400E',
  },
  alternativeDistance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
  toolsCard: {
    marginTop: 8,
  },
  toolsLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  toolsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  toolBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  toolText: {
    fontSize: 12,
    color: '#374151',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  manualButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#CBD5E1',
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  confirmButtonTextDisabled: {
    color: '#94A3B8',
  },

  // Cache Indicator Styles
  cacheIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  cacheStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cacheMetaText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  refreshButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78350F',
  },
});
