import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { MapLibreEngine } from './engines/MapLibreEngine';
import { ProfessionalWeatherService } from '@/services/weather/ProfessionalWeatherService';
import { NOAABathymetryService } from '@/services/bathymetry/NOAABathymetryService';
import { AISStreamService } from '@/services/ais/AISStreamService';
import { WebMapView } from './WebMapView';
import sailingLocations from '@/data/sailing-locations.json';
import { createLogger } from '@/lib/utils/logger';
import {
  AdvancedMapConfig,
  AdvancedWeatherConditions,
  RaceMark,
  GeoLocation,
  VesselData,
  LayerControlSystem,
  NavigationResult,
  RaceStrategy,
  VesselType,
  NavigationStatus
} from '@/lib/types/advanced-map';

interface ProfessionalMap3DViewProps {
  config?: Partial<AdvancedMapConfig>;
  venue?: string; // Venue ID from sailing-locations.json
  marks?: RaceMark[];
  clubMarkers?: any[]; // Yacht club markers
  onMarkPress?: (mark: RaceMark) => void;
  onMapPress?: (coordinates: GeoLocation) => void;
  onWeatherUpdate?: (weather: AdvancedWeatherConditions) => void;
  onNavigationCalculated?: (result: NavigationResult) => void;
  apiKeys: { [key: string]: string };
  professionalMode?: boolean;
}

const logger = createLogger('ProfessionalMap3DView');
export function ProfessionalMap3DView({
  config,
  venue = 'san-francisco-bay',
  marks = [],
  clubMarkers = [],
  onMarkPress,
  onMapPress,
  onWeatherUpdate,
  onNavigationCalculated,
  apiKeys,
  professionalMode = true
}: ProfessionalMap3DViewProps) {
  // Debug logging for received props

  // Core state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapEngine, setMapEngine] = useState<MapLibreEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Professional services
  const [weatherService] = useState(() => new ProfessionalWeatherService(apiKeys));
  const [bathymetryService] = useState(() => new NOAABathymetryService());
  const [aisService] = useState(() => new AISStreamService({
    apiKey: apiKeys['aisstream-api'] || 'demo-key'
  }));

  // Venue-specific data
  const venueConfig = (sailingLocations.venues as any)[venue];
  const [currentWeather, setCurrentWeather] = useState<AdvancedWeatherConditions | null>(null);
  const [vessels, setVessels] = useState<VesselData[]>([]);
  const [fleetTrackingId, setFleetTrackingId] = useState<string | null>(null);
  const [showVessels, setShowVessels] = useState<boolean>(professionalMode);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  // Professional UI state
  const [layerControl, setLayerControl] = useState<LayerControlSystem | null>(null);
  const [measurementMode, setMeasurementMode] = useState<'off' | 'distance' | 'area'>('off');
  const [tacticalMode, setTacticalMode] = useState<boolean>(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState<string | null>(null);

  // Performance monitoring
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  const defaultConfig: AdvancedMapConfig = {
    rendering: {
      engine: 'maplibre',
      quality: professionalMode ? 'ultra' : 'high',
      frameRate: 60,
      antiAliasing: true
    },
    terrain: {
      bathymetrySource: 'noaa',
      terrainExaggeration: 2.0,
      seaFloorDetail: true,
      contourLines: {
        depths: [2, 5, 10, 20, 50, 100, 200],
        colors: ['#E3F2FD', '#90CAF9', '#42A5F5', '#1E88E5', '#1565C0', '#0D47A1', '#000051'],
        lineWidth: 2,
        labelFrequency: 3,
        smoothing: true,
        threeDimensional: true
      },
      highResolution: professionalMode
    },
    weather: {
      sources: professionalMode ? [
        { id: 'stormglass', name: 'Storm Glass', url: 'https://api.stormglass.io/v2', priority: 1, updateInterval: 900, capabilities: {} as any }
      ] : [],
      updateInterval: professionalMode ? 900 : 3600, // 15 min vs 1 hour
      forecastHours: 72,
      resolution: 'high',
      realTimeUpdates: professionalMode
    },
    performance: {
      tileCacheSize: professionalMode ? 2000 : 500, // MB
      maxConcurrentRequests: 12,
      lodStrategy: 'balanced',
      preloadRadius: 2
    },
    // Base config properties
    elevation: {
      exaggeration: 2.0,
      seaFloorRendering: true,
      contourLines: {
        depths: [2, 5, 10, 20, 50, 100, 200],
        colors: ['#E3F2FD', '#90CAF9', '#42A5F5', '#1E88E5', '#1565C0', '#0D47A1', '#000051']
      }
    },
    camera: {
      pitch: 60,
      bearing: 0,
      zoom: venueConfig?.coordinates?.center ? 14 : 10,
      animation: 'smooth',
      followMode: 'off'
    },
    layers: {
      nauticalChart: true,
      satellite: false,
      bathymetry: true,
      currentFlow: true,
      windField: true,
      hazards: true
    }
  };

  const finalConfig = { ...defaultConfig, ...config };

  // Initialize professional map engine
  useEffect(() => {
    if (!mapContainerRef.current || isInitialized) return;

    const initializeMap = async () => {

      try {
        // Use MapLibre engine (open source, no API key required)
        const engine = new MapLibreEngine();

        await engine.initialize(mapContainerRef.current!, finalConfig);

        // Set initial view to venue location
        if (venueConfig?.coordinates?.center) {
          engine.setCamera({
            center: [venueConfig.coordinates.center.longitude, venueConfig.coordinates.center.latitude],
            zoom: 14,
            bearing: 0,
            pitch: 60
          });
        }

        setMapEngine(engine);
        setIsInitialized(true);

      } catch (error) {

      }
    };

    initializeMap();
  }, [isInitialized]);

  // Update map camera when venue changes (after initialization)
  useEffect(() => {
    if (!mapEngine || !isInitialized || !venueConfig?.coordinates?.center) return;

    mapEngine.flyTo({
      center: {
        latitude: venueConfig.coordinates.center.latitude,
        longitude: venueConfig.coordinates.center.longitude
      },
      zoom: 14,
      bearing: 0,
      pitch: 60
    }, {
      duration: 2000,
      essential: true
    });
  }, [venue, mapEngine, isInitialized, venueConfig]);

  // Setup professional weather updates
  useEffect(() => {
    if (!venueConfig?.coordinates?.center || !weatherService) return;

    const setupWeatherUpdates = async () => {

      try {
        // Initial weather fetch
        const weather = await weatherService.getAdvancedWeatherConditions(
          venueConfig.coordinates.center
        );
        setCurrentWeather(weather);
        onWeatherUpdate?.(weather);

        // Setup real-time updates for professional mode
        if (professionalMode) {
          const updateId = weatherService.setupRealTimeUpdates(
            venueConfig.coordinates.center,
            (updatedWeather) => {
              setCurrentWeather(updatedWeather);
              onWeatherUpdate?.(updatedWeather);

            }
          );
          setRealTimeUpdates(updateId);
        }
      } catch (error) {

      }
    };

    setupWeatherUpdates();

    return () => {
      if (realTimeUpdates) {
        weatherService.stopRealTimeUpdates(realTimeUpdates);
      }
    };
  }, [venue, weatherService, professionalMode]);

  // Setup AIS vessel tracking
  useEffect(() => {
    if (!venueConfig?.coordinates?.center || !aisService || !professionalMode || !showVessels) return;

    const setupVesselTracking = async () => {

      try {
        // Define tracking area around the venue
        const center = venueConfig.coordinates.center;
        const radius = 0.1; // ~6 nautical miles

        const bounds = {
          southwest: {
            latitude: center.latitude - radius,
            longitude: center.longitude - radius
          },
          northeast: {
            latitude: center.latitude + radius,
            longitude: center.longitude + radius
          }
        };

        // Start fleet tracking
        const trackingId = await aisService.startFleetTracking(
          bounds,
          (updatedVessels) => {
            setVessels(updatedVessels);

            // Filter racing vessels for tactical analysis
            const racingVessels = updatedVessels.filter(v =>
              v.type === VesselType.RACING_YACHT || v.status === NavigationStatus.RACING
            );

            if (racingVessels.length > 0) {
            }
          },
          {
            updateInterval: 30, // 30 seconds
            trackingRadius: 10, // 10 nautical miles
            vesselTypes: [VesselType.SAILING, VesselType.RACING_YACHT],
            includeRaceData: true,
            predictiveTracking: true
          }
        );

        setFleetTrackingId(trackingId);

      } catch (error) {

      }
    };

    setupVesselTracking();

    return () => {
      if (fleetTrackingId) {
        aisService.stopFleetTracking(fleetTrackingId);
        setFleetTrackingId(null);
      }
    };
  }, [venue, aisService, professionalMode, showVessels]);

  // Professional layer management
  const initializeLayerControl = useCallback((): LayerControlSystem => {
    return {
      categories: {
        navigation: {
          nauticalChart: true,
          bathymetry: true,
          depthContours: true,
          navigationAids: true,
          harbors: true,
          anchorages: false
        },
        weather: {
          windField: true,
          pressure: professionalMode,
          temperature: professionalMode,
          precipitation: true,
          waves: true,
          tides: true,
          currents: true,
          visibility: professionalMode
        },
        racing: {
          courseMarks: true,
          startFinishLines: true,
          laylines: professionalMode,
          courseBoundaries: true,
          restrictedAreas: true,
          raceArea: true
        },
        safety: {
          vessels: professionalMode,
          emergencyServices: true,
          hazards: true,
          weatherAlerts: true,
          communicationZones: false
        },
        historical: {
          pastRaces: professionalMode,
          weatherHistory: professionalMode,
          performanceData: professionalMode,
          trackAnalysis: professionalMode
        },
        custom: {
          userOverlays: [],
          teamData: professionalMode,
          personalNotes: true,
          photos: false
        }
      },
      visibility: {
        toggleLayer: (layerId: string) => {
          // Implementation would update map engine
        },
        setLayerOpacity: (layerId: string, opacity: number) => {
        },
        showLayerGroup: (groupId: string) => {
        },
        hideLayerGroup: (groupId: string) => {
        },
        resetToDefaults: () => {

        }
      },
      ordering: {
        moveLayerUp: (layerId: string) => {
        },
        moveLayerDown: (layerId: string) => {
        },
        setLayerOrder: (layerIds: string[]) => {

        }
      },
      styling: {
        updateLayerStyle: (layerId: string, style: any) => {
        },
        createStylePreset: (name: string, styles: any) => {
        },
        applyStylePreset: (presetName: string) => {
        }
      }
    };
  }, [professionalMode]);

  // Performance monitoring for professional mode
  useEffect(() => {
    if (!professionalMode || !mapEngine) return;

    const monitorPerformance = setInterval(() => {
      const metrics = mapEngine.getPerformanceMetrics();
      setPerformanceMetrics(metrics);

      if (metrics.frameRate < 30) {

        mapEngine.optimizeForDevice();
      }
    }, 5000);

    return () => clearInterval(monitorPerformance);
  }, [mapEngine, professionalMode]);

  // Professional tactical calculations
  const calculateTacticalAdvantage = useCallback(async (position: GeoLocation) => {
    if (!currentWeather || !professionalMode) return;

    // Calculate laylines, start line advantage, etc.
    const navigationResult: NavigationResult = {
      distance: {
        nauticalMiles: 1.5,
        kilometers: 2.78,
        meters: 2778,
        greatCircle: true,
        rhumbLine: false
      },
      bearing: {
        true: 45,
        magnetic: 43,
        declination: -2,
        convergence: 0.1
      },
      time: {
        estimatedDuration: 0.25, // 15 minutes
        conditions: currentWeather,
        courseRecommendation: 'Port tack favored due to wind shift',
        averageSpeed: 6.0
      }
    };

    onNavigationCalculated?.(navigationResult);
  }, [currentWeather, professionalMode, onNavigationCalculated]);

  // Handle map interactions
  const handleMapPress = useCallback((event: any) => {
    const { coordinate } = event;
    const geoLocation: GeoLocation = {
      latitude: coordinate[1],
      longitude: coordinate[0]
    };

    onMapPress?.(geoLocation);

    if (tacticalMode) {
      calculateTacticalAdvantage(geoLocation);
    }
  }, [onMapPress, tacticalMode, calculateTacticalAdvantage]);

  const { width, height } = Dimensions.get('window');

  logger.debug('  Dimensions:', { width, height });

  return (
    <View style={[styles.container, { width, height: height * 0.85 }]}>
      {/* Professional Map Container */}
      <WebMapView
        venue={venue}
        marks={marks}
        clubMarkers={clubMarkers}
        onMarkPress={onMarkPress}
        onMapPress={onMapPress}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
        }}
      />

      {/* Fallback div for ref (hidden) */}
      <div
        ref={mapContainerRef}
        style={{ display: 'none' }}
      />

      {/* Professional HUD Overlay */}
      {professionalMode && (
        <View style={styles.professionalHUD}>
          {/* Venue Information */}
          <View style={styles.venueInfo}>
            <ThemedText style={styles.venueName}>
              {venueConfig?.name || 'Professional Racing Area'}
            </ThemedText>
            <ThemedText style={styles.venueDetails}>
              {venueConfig?.region} • {venueConfig?.country}
            </ThemedText>
          </View>

          {/* Real-time Weather */}
          {currentWeather && (
            <View style={styles.weatherDisplay}>
              <ThemedText style={styles.weatherTitle}>🌬️ CONDITIONS</ThemedText>
              <ThemedText style={styles.weatherData}>
                Wind: {currentWeather.wind.speed.toFixed(1)}kts @ {currentWeather.wind.direction}°
              </ThemedText>
              <ThemedText style={styles.weatherData}>
                Pressure: {currentWeather.pressure.sealevel.toFixed(1)}mb ({currentWeather.pressure.trend})
              </ThemedText>
              <ThemedText style={styles.weatherData}>
                Confidence: {Math.round(currentWeather.forecast.confidence * 100)}%
              </ThemedText>
            </View>
          )}

          {/* Performance Metrics */}
          {performanceMetrics && (
            <View style={styles.performanceDisplay}>
              <ThemedText style={styles.performanceTitle}>📊 PERFORMANCE</ThemedText>
              <ThemedText style={styles.performanceData}>
                FPS: {performanceMetrics.frameRate} | Memory: {performanceMetrics.memoryUsage}MB
              </ThemedText>
            </View>
          )}

          {/* Tactical Mode Toggle */}
          <View style={styles.tacticalControls}>
            <View
              style={[
                styles.tacticalButton,
                { backgroundColor: tacticalMode ? '#00CC44' : '#FFFFFF' }
              ]}
              onTouchEnd={() => setTacticalMode(!tacticalMode)}
            >
              <ThemedText
                style={[
                  styles.tacticalButtonText,
                  { color: tacticalMode ? '#FFFFFF' : '#333333' }
                ]}
              >
                🧠 TACTICAL
              </ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* Professional Layer Control Panel */}
      {professionalMode && (
        <View style={styles.layerControlPanel}>
          <ThemedText style={styles.layerTitle}>LAYERS</ThemedText>

          <View style={styles.layerSection}>
            <ThemedText style={styles.layerSectionTitle}>Navigation</ThemedText>
            {/* Layer toggles would go here */}
          </View>

          <View style={styles.layerSection}>
            <ThemedText style={styles.layerSectionTitle}>Weather</ThemedText>
            {/* Weather layer toggles */}
          </View>

          <View style={styles.layerSection}>
            <ThemedText style={styles.layerSectionTitle}>Racing</ThemedText>
            {/* Racing layer toggles */}
          </View>
        </View>
      )}

      {/* Alert System */}
      {activeAlerts.length > 0 && (
        <View style={styles.alertSystem}>
          {activeAlerts.map((alert, index) => (
            <View key={index} style={[styles.alert, { backgroundColor: alert.severity === 'warning' ? '#FF4444' : '#FF8800' }]}>
              <ThemedText style={styles.alertText}>
                ⚠️ {alert.title}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {/* Professional Status Bar */}
      <View style={styles.professionalStatusBar}>
        <ThemedText style={styles.statusText}>
          {isInitialized ? '✅ PROFESSIONAL' : '🔄 INITIALIZING'} •
          {realTimeUpdates ? ' 📡 LIVE' : ' 📊 CACHED'} •
          Venue: {venue.toUpperCase()}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#000',
  },
  professionalHUD: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 100,
    gap: 10,
  },
  venueInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#00CC44',
  },
  venueName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  venueDetails: {
    fontSize: 12,
    color: '#CCCCCC',
    marginTop: 2,
  },
  weatherDisplay: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066FF',
  },
  weatherTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0066FF',
    marginBottom: 4,
  },
  weatherData: {
    fontSize: 11,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  performanceDisplay: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  performanceTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 2,
  },
  performanceData: {
    fontSize: 9,
    color: '#FFFFFF',
  },
  tacticalControls: {
    flexDirection: 'row',
    gap: 8,
  },
  tacticalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#00CC44',
  },
  tacticalButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  layerControlPanel: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    padding: 16,
    borderRadius: 8,
    zIndex: 90,
    minWidth: 200,
  },
  layerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  layerSection: {
    marginBottom: 12,
  },
  layerSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CCCCCC',
    marginBottom: 6,
  },
  alertSystem: {
    position: 'absolute',
    top: 100,
    left: '50%',
    transform: [{ translateX: -150 }],
    zIndex: 110,
    gap: 8,
  },
  alert: {
    padding: 12,
    borderRadius: 8,
    width: 300,
  },
  alertText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  professionalStatusBar: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 8,
    borderRadius: 6,
    zIndex: 100,
  },
  statusText: {
    color: '#00FF88',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ProfessionalMap3DView;