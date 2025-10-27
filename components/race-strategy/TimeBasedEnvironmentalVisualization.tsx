/**
 * Time-Based Environmental Visualization
 *
 * Complete integration example demonstrating:
 * 1. TimeSlider for 24-hour forecast scrubbing
 * 2. Time-based forecast data with interpolation
 * 3. Offline bathymetry tile caching
 * 4. Animated environmental layer updates
 * 5. Cache statistics and offline mode handling
 *
 * This component shows the complete workflow for race day preparation:
 * - Pre-download tiles for racing area → Cache for offline use
 * - Generate 24-hour forecast → Interpolate between points
 * - Scrub time slider → Update wind/current/tide visualizations
 * - Monitor cache status → Handle offline gracefully
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import { TimeSlider } from '../map/controls/TimeSlider';
import { TimeBasedForecastService } from '../../services/TimeBasedForecastService';
import { BathymetryTileCacheService } from '../../services/BathymetryTileCacheService';
import { EnvironmentalVisualizationService } from '../../services/visualization/EnvironmentalVisualizationService';
import type { SailingVenue } from '../../types/venues';
import type { ForecastTimeSeries, ForecastPoint } from '../../services/TimeBasedForecastService';
import type { CacheStats } from '../../services/BathymetryTileCacheService';
import type { EnvironmentalLayers } from '../../services/visualization/EnvironmentalVisualizationService';

export interface TimeBasedEnvironmentalVisualizationProps {
  /** Sailing venue */
  venue: SailingVenue;

  /** Racing area polygon */
  racingArea: GeoJSON.Polygon;

  /** Race start time (or current time for practice) */
  startTime: Date;

  /** Forecast duration in hours (default: 24) */
  forecastDuration?: number;

  /** Enable offline tile pre-download */
  enableOfflineCache?: boolean;

  /** Zoom levels to cache (default: [8, 9, 10, 11, 12]) */
  cacheZoomLevels?: number[];

  /** Callback when environmental layers update */
  onLayersUpdate?: (layers: EnvironmentalLayers) => void;
}

/**
 * Time-Based Environmental Visualization Component
 */
export function TimeBasedEnvironmentalVisualization({
  venue,
  racingArea,
  startTime,
  forecastDuration = 24,
  enableOfflineCache = true,
  cacheZoomLevels = [8, 9, 10, 11, 12],
  onLayersUpdate
}: TimeBasedEnvironmentalVisualizationProps) {
  // Services
  const [forecastService] = useState(() => new TimeBasedForecastService());
  const [cacheService] = useState(() => BathymetryTileCacheService.getInstance());
  const [vizService] = useState(() => new EnvironmentalVisualizationService());

  // State
  const [isInitializing, setIsInitializing] = useState(true);
  const [forecastSeries, setForecastSeries] = useState<ForecastTimeSeries | null>(null);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [currentForecast, setCurrentForecast] = useState<ForecastPoint | null>(null);
  const [currentLayers, setCurrentLayers] = useState<EnvironmentalLayers | null>(null);

  // Cache state
  const [isCaching, setIsCaching] = useState(false);
  const [cacheProgress, setCacheProgress] = useState({ downloaded: 0, total: 0 });
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);

  // Errors
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize forecast and cache
   */
  useEffect(() => {
    initializeVisualization();
  }, [venue.id, startTime]);

  const initializeVisualization = async () => {
    try {
      setIsInitializing(true);
      setError(null);

      console.log('🚀 Initializing time-based environmental visualization...');

      // Step 1: Generate forecast time series
      console.log('📊 Generating forecast series...');
      const series = await forecastService.generateForecastSeries(
        venue,
        racingArea,
        startTime,
        forecastDuration
      );
      setForecastSeries(series);
      console.log(`✅ Generated ${series.points.length} forecast points`);

      // Step 2: Get initial forecast
      const initialForecast = forecastService.getForecastAtTime(series, startTime);
      if (initialForecast) {
        setCurrentForecast(initialForecast);

        // Generate initial environmental layers
        const layers = vizService.generateLayers(initialForecast.analysis);
        setCurrentLayers(layers);
        onLayersUpdate?.(layers);
      }

      // Step 3: Pre-download bathymetry tiles for offline use
      // TEMPORARILY DISABLED - Tile caching has errors, will fix in Phase 4
      if (enableOfflineCache && false) {
        console.log('📥 Pre-downloading bathymetry tiles...');
        setIsCaching(true);

        try {
          await cacheService.preDownloadTiles(
            venue,
            racingArea,
            cacheZoomLevels,
            (progress) => {
              setCacheProgress(progress);
            }
          );

          console.log('✅ Tile caching complete');

          // Get cache statistics
          const stats = await cacheService.getCacheStats();
          setCacheStats(stats);
        } catch (error) {
          console.error('Tile caching failed (non-critical):', error);
        } finally {
          setIsCaching(false);
        }
      }

      setIsInitializing(false);
      console.log('✅ Visualization initialized');
    } catch (err) {
      console.error('❌ Initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Initialization failed');
      setIsInitializing(false);
    }
  };

  /**
   * Handle time change from slider
   */
  const handleTimeChange = useCallback(
    (newTime: Date) => {
      if (!forecastSeries) return;

      setCurrentTime(newTime);

      // Get forecast at new time (with interpolation if needed)
      const forecast = forecastService.getForecastAtTime(forecastSeries, newTime);

      if (forecast) {
        setCurrentForecast(forecast);

        // Generate environmental layers for new time
        const layers = vizService.generateLayers(forecast.analysis);
        setCurrentLayers(layers);
        onLayersUpdate?.(layers);
      }
    },
    [forecastSeries, forecastService, vizService, onLayersUpdate]
  );

  /**
   * Refresh cache statistics
   */
  const refreshCacheStats = async () => {
    try {
      const stats = await cacheService.getCacheStats();
      setCacheStats(stats);
    } catch (err) {
      console.error('Failed to get cache stats:', err);
    }
  };

  /**
   * Clear cache
   */
  const clearCache = async () => {
    try {
      await cacheService.clearVenueCache(venue);
      await refreshCacheStats();
    } catch (err) {
      console.error('Failed to clear cache:', err);
    }
  };

  // Loading state
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0080ff" />
        <Text style={styles.loadingText}>Initializing environmental forecast...</Text>
        {isCaching && (
          <View style={styles.cacheProgress}>
            <Text style={styles.cacheProgressText}>
              Downloading tiles: {cacheProgress.downloaded}/{cacheProgress.total}
            </Text>
            <Text style={styles.cacheProgressPercent}>
              {cacheProgress.percentage.toFixed(0)}%
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>❌ Initialization Failed</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={initializeVisualization}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // Get forecast markers for time slider
  const markers = forecastSeries ? forecastService.getForecastMarkers(forecastSeries) : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Current Forecast Display */}
      {currentForecast && (
        <View style={styles.forecastCard}>
          <Text style={styles.cardTitle}>Current Conditions</Text>

          <View style={styles.conditionRow}>
            <View style={styles.conditionItem}>
              <Text style={styles.conditionLabel}>Wind</Text>
              <Text style={styles.conditionValue}>
                {currentForecast.analysis.air.averageWindSpeed.toFixed(1)} kt
              </Text>
              <Text style={styles.conditionDetail}>
                {currentForecast.analysis.air.averageWindDirection.toFixed(0)}°
              </Text>
            </View>

            {currentForecast.analysis.water.current && (
              <View style={styles.conditionItem}>
                <Text style={styles.conditionLabel}>Current</Text>
                <Text style={styles.conditionValue}>
                  {currentForecast.analysis.water.current.averageSpeed.toFixed(2)} kt
                </Text>
                <Text style={styles.conditionDetail}>
                  {currentForecast.analysis.water.current.averageDirection.toFixed(0)}°
                </Text>
              </View>
            )}

            {currentForecast.analysis.water.tide && (
              <View style={styles.conditionItem}>
                <Text style={styles.conditionLabel}>Tide</Text>
                <Text style={styles.conditionValue}>
                  {currentForecast.analysis.water.tide.height.toFixed(1)}m
                </Text>
                <Text style={styles.conditionDetail}>
                  {currentForecast.analysis.water.tide.stage}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              Confidence: {(currentForecast.confidence * 100).toFixed(0)}%
            </Text>
          </View>
        </View>
      )}

      {/* Time Slider */}
      {forecastSeries && (
        <TimeSlider
          startTime={forecastSeries.startTime}
          durationHours={forecastDuration}
          currentTime={currentTime}
          onTimeChange={handleTimeChange}
          autoPlay={false}
          playbackSpeed={60}
          showMarkers={true}
          markers={markers}
        />
      )}

      {/* Environmental Layers Summary */}
      {currentLayers && (
        <View style={styles.layersCard}>
          <Text style={styles.cardTitle}>Active Environmental Layers</Text>

          <View style={styles.layerItem}>
            <Text style={styles.layerLabel}>Wind Particles</Text>
            <Text style={styles.layerCount}>{currentLayers.windParticles.length}</Text>
          </View>

          <View style={styles.layerItem}>
            <Text style={styles.layerLabel}>Current Particles</Text>
            <Text style={styles.layerCount}>{currentLayers.currentParticles.length}</Text>
          </View>

          {currentLayers.windShadowZones.length > 0 && (
            <View style={styles.layerItem}>
              <Text style={styles.layerLabel}>Wind Shadow Zones</Text>
              <Text style={styles.layerCount}>{currentLayers.windShadowZones.length}</Text>
            </View>
          )}

          {currentLayers.currentAccelerationZones.length > 0 && (
            <View style={styles.layerItem}>
              <Text style={styles.layerLabel}>Current Acceleration Zones</Text>
              <Text style={styles.layerCount}>
                {currentLayers.currentAccelerationZones.length}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Cache Statistics */}
      {cacheStats && (
        <View style={styles.cacheCard}>
          <View style={styles.cacheHeader}>
            <Text style={styles.cardTitle}>Offline Cache</Text>
            <Pressable style={styles.refreshButton} onPress={refreshCacheStats}>
              <Text style={styles.refreshButtonText}>🔄</Text>
            </Pressable>
          </View>

          <View style={styles.cacheStatsRow}>
            <View style={styles.cacheStat}>
              <Text style={styles.cacheStatLabel}>Tiles Cached</Text>
              <Text style={styles.cacheStatValue}>{cacheStats.tileCount}</Text>
            </View>

            <View style={styles.cacheStat}>
              <Text style={styles.cacheStatLabel}>Cache Size</Text>
              <Text style={styles.cacheStatValue}>
                {(cacheStats.totalSize / 1024 / 1024).toFixed(1)} MB
              </Text>
            </View>
          </View>

          <View style={styles.cacheStatsRow}>
            <View style={styles.cacheStat}>
              <Text style={styles.cacheStatLabel}>Venues</Text>
              <Text style={styles.cacheStatValue}>{cacheStats.venues.length}</Text>
            </View>

            <View style={styles.cacheStat}>
              <Text style={styles.cacheStatLabel}>Last Updated</Text>
              <Text style={styles.cacheStatValue}>
                {cacheStats.lastUpdated.toLocaleTimeString()}
              </Text>
            </View>
          </View>

          <Pressable style={styles.clearCacheButton} onPress={clearCache}>
            <Text style={styles.clearCacheButtonText}>Clear Cache</Text>
          </Pressable>
        </View>
      )}

      {/* Offline Caching Status */}
      {isCaching && (
        <View style={styles.cachingCard}>
          <ActivityIndicator size="small" color="#0080ff" />
          <Text style={styles.cachingText}>
            Downloading tiles for offline use...
          </Text>
          <Text style={styles.cachingProgress}>
            {cacheProgress.downloaded}/{cacheProgress.total} ({cacheProgress.percentage.toFixed(0)}%)
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  content: {
    padding: 16,
    gap: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  cacheProgress: {
    marginTop: 24,
    alignItems: 'center'
  },
  cacheProgressText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8
  },
  cacheProgressPercent: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0080ff'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff3333',
    marginBottom: 12
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24
  },
  retryButton: {
    backgroundColor: '#0080ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  forecastCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  conditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16
  },
  conditionItem: {
    alignItems: 'center'
  },
  conditionLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4
  },
  conditionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0080ff',
    marginBottom: 4
  },
  conditionDetail: {
    fontSize: 14,
    color: '#666'
  },
  confidenceBadge: {
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  confidenceText: {
    fontSize: 12,
    color: '#0080ff',
    fontWeight: '600'
  },
  layersCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  layerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  layerLabel: {
    fontSize: 14,
    color: '#666'
  },
  layerCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0080ff'
  },
  cacheCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  cacheHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  refreshButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center'
  },
  refreshButtonText: {
    fontSize: 20
  },
  cacheStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  cacheStat: {
    flex: 1,
    alignItems: 'center'
  },
  cacheStatLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4
  },
  cacheStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0080ff'
  },
  clearCacheButton: {
    backgroundColor: '#ff3333',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8
  },
  clearCacheButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  },
  cachingCard: {
    backgroundColor: '#e6f2ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  cachingText: {
    flex: 1,
    fontSize: 14,
    color: '#0080ff'
  },
  cachingProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0080ff'
  }
});
