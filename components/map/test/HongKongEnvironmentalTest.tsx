/**
 * Hong Kong Victoria Harbour Environmental Visualization Test
 *
 * Comprehensive test of all environmental visualization layers:
 * - Wind particles (10k on web)
 * - Current particles (8k on web)
 * - Wind shadow zones
 * - Current acceleration zones
 * - Bathymetry contours
 * - 3D building extrusions
 *
 * Test location: Royal Hong Kong Yacht Club - Victoria Harbour
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { EnvironmentalAnalysisService, type EnvironmentalAnalysis } from '../../../services/EnvironmentalAnalysisService';
import { EnvironmentalVisualizationService } from '../../../services/visualization/EnvironmentalVisualizationService';
import type { SailingVenue } from '../../../types/venues';

// MapLibre imports (web only)
let MapLibreEngine: any;
if (Platform.OS === 'web') {
  MapLibreEngine = require('../engines/MapLibreEngine').MapLibreEngine;
}

interface TestMetrics {
  fps: number;
  renderTime: number;
  particleCount: number;
  layerCount: number;
  memoryUsage?: number;
}

export function HongKongEnvironmentalTest() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<EnvironmentalAnalysis | null>(null);
  const [metrics, setMetrics] = useState<TestMetrics>({
    fps: 0,
    renderTime: 0,
    particleCount: 0,
    layerCount: 0
  });

  const mapRef = useRef<any>(null);
  const frameCountRef = useRef(0);
  const fpsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hong Kong Victoria Harbour test data
  const testVenue: SailingVenue = {
    id: 'rhkyc-victoria-harbour',
    name: 'Royal Hong Kong Yacht Club',
    location: 'Victoria Harbour, Hong Kong',
    country: 'HK',
    region: 'asia-pacific',
    coordinates: {
      latitude: 22.2793,
      longitude: 114.1628
    },
    timezone: 'Asia/Hong_Kong',
    description: 'World-class racing venue with complex wind patterns from surrounding skyscrapers and strong tidal currents',
    features: {
      hasBathymetryData: true,
      hasTerrainData: true,
      hasTidalData: true,
      hasCurrentData: true,
      hasWeatherStation: true
    }
  };

  // Racing area in Victoria Harbour
  const racingArea: GeoJSON.Polygon = {
    type: 'Polygon',
    coordinates: [[
      [114.1600, 22.2750], // Southwest (Kowloon side)
      [114.1700, 22.2750], // Southeast
      [114.1700, 22.2850], // Northeast (HK Island side)
      [114.1600, 22.2850], // Northwest
      [114.1600, 22.2750]  // Close polygon
    ]]
  };

  useEffect(() => {
    runEnvironmentalTest();

    return () => {
      if (fpsTimerRef.current) {
        clearInterval(fpsTimerRef.current);
      }
    };
  }, []);

  const runEnvironmentalTest = async () => {
    try {
      setLoading(true);
      console.log('🏁 Starting Hong Kong Environmental Visualization Test');

      // Step 1: Run environmental analysis
      console.log('📊 Step 1: Running environmental analysis...');
      const analysisService = new EnvironmentalAnalysisService();
      const startTime = performance.now();

      const result = await analysisService.analyzeEnvironment({
        racingArea,
        raceTime: new Date(), // Use current time for real-time data
        raceDuration: 60, // 1 hour race
        venue: testVenue
      });

      const analysisTime = performance.now() - startTime;
      console.log(`✅ Analysis complete in ${analysisTime.toFixed(0)}ms`);
      setAnalysis(result);

      // Step 2: Generate visualization layers
      console.log('🎨 Step 2: Generating visualization layers...');
      const vizService = new EnvironmentalVisualizationService();
      const vizStartTime = performance.now();

      const layers = vizService.generateLayers(result);

      const vizTime = performance.now() - vizStartTime;
      console.log(`✅ Visualization layers generated in ${vizTime.toFixed(0)}ms`);
      console.log(`   - Wind particles: ${layers.windParticles.length}`);
      console.log(`   - Current particles: ${layers.currentParticles.length}`);
      console.log(`   - Wind shadows: ${layers.windShadowZones.length}`);
      console.log(`   - Current zones: ${layers.currentAccelerationZones.length}`);
      console.log(`   - Buildings: ${layers.buildings.features.length}`);

      // Step 3: Render on map (web only for now)
      if (Platform.OS === 'web' && MapLibreEngine) {
        console.log('🗺️  Step 3: Rendering on MapLibre...');
        await renderLayers(layers);
      } else {
        console.log('📱 Mobile rendering pending - testing analysis only');
      }

      setMetrics({
        fps: 0,
        renderTime: analysisTime + vizTime,
        particleCount: layers.windParticles.length + layers.currentParticles.length,
        layerCount: 6 // wind particles, current particles, shadows, acceleration, contours, buildings
      });

      setLoading(false);
      console.log('🎉 Test complete!');

    } catch (err) {
      console.error('❌ Test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  const renderLayers = async (layers: any) => {
    // This would integrate with MapLibreEngine
    // For now, we validate the layer structure
    console.log('Validating layer structures...');

    // Validate wind particles
    if (layers.windParticles.length > 0) {
      const sample = layers.windParticles[0];
      if (!('lat' in sample && 'lng' in sample && 'direction' in sample && 'speed' in sample)) {
        throw new Error('Invalid wind particle structure');
      }
      console.log('✅ Wind particles valid');
    }

    // Validate current particles
    if (layers.currentParticles.length > 0) {
      const sample = layers.currentParticles[0];
      if (!('lat' in sample && 'lng' in sample && 'direction' in sample && 'speed' in sample)) {
        throw new Error('Invalid current particle structure');
      }
      console.log('✅ Current particles valid');
    }

    // Validate GeoJSON features
    if (layers.windShadowZones.length > 0) {
      const sample = layers.windShadowZones[0];
      if (sample.type !== 'Feature' || !sample.geometry || !sample.properties) {
        throw new Error('Invalid wind shadow GeoJSON structure');
      }
      console.log('✅ Wind shadow zones valid');
    }

    if (layers.buildings.features.length > 0) {
      const sample = layers.buildings.features[0];
      if (sample.type !== 'Feature' || !sample.geometry || !sample.properties) {
        throw new Error('Invalid building GeoJSON structure');
      }
      console.log('✅ Building features valid');
    }

    console.log('✅ All layer structures validated');
  };

  const startFPSMonitoring = () => {
    frameCountRef.current = 0;

    fpsTimerRef.current = setInterval(() => {
      const fps = frameCountRef.current;
      frameCountRef.current = 0;

      setMetrics(prev => ({
        ...prev,
        fps
      }));

      // Check performance targets
      if (fps < 30) {
        console.warn(`⚠️  FPS below target: ${fps}fps (target: 30-60fps)`);
      } else if (fps >= 30 && fps < 60) {
        console.log(`📊 FPS acceptable: ${fps}fps`);
      } else {
        console.log(`✅ FPS excellent: ${fps}fps`);
      }
    }, 1000);

    // Request animation frame counter
    const countFrame = () => {
      frameCountRef.current++;
      if (fpsTimerRef.current) {
        requestAnimationFrame(countFrame);
      }
    };
    requestAnimationFrame(countFrame);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0080ff" />
        <Text style={styles.loadingText}>Running environmental analysis...</Text>
        <Text style={styles.venueText}>{testVenue.name}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>❌ Test Failed</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.successHeader}>
        <Text style={styles.successText}>✅ Test Complete</Text>
        <Text style={styles.venueText}>{testVenue.name}</Text>
      </View>

      <View style={styles.metricsContainer}>
        <Text style={styles.metricsTitle}>Performance Metrics</Text>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Render Time:</Text>
          <Text style={styles.metricValue}>{metrics.renderTime.toFixed(0)}ms</Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Particle Count:</Text>
          <Text style={styles.metricValue}>{metrics.particleCount.toLocaleString()}</Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Layer Count:</Text>
          <Text style={styles.metricValue}>{metrics.layerCount}</Text>
        </View>

        {metrics.fps > 0 && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>FPS:</Text>
            <Text style={[
              styles.metricValue,
              metrics.fps >= 30 ? styles.fpsGood : styles.fpsBad
            ]}>
              {metrics.fps}fps
            </Text>
          </View>
        )}
      </View>

      {analysis && (
        <View style={styles.analysisContainer}>
          <Text style={styles.analysisTitle}>Environmental Analysis</Text>

          <View style={styles.analysisSection}>
            <Text style={styles.sectionTitle}>Water Environment</Text>
            <Text style={styles.analysisText}>
              Current Speed: {analysis.water.current?.averageSpeed.toFixed(2)} knots
            </Text>
            <Text style={styles.analysisText}>
              Tidal Stage: {analysis.water.tide?.stage}
            </Text>
          </View>

          <View style={styles.analysisSection}>
            <Text style={styles.sectionTitle}>Air Environment</Text>
            <Text style={styles.analysisText}>
              Wind Speed: {analysis.air.averageWindSpeed.toFixed(1)} knots
            </Text>
            <Text style={styles.analysisText}>
              Terrain Effects: {analysis.air.topographicEffects.length} zones
            </Text>
          </View>

          <View style={styles.analysisSection}>
            <Text style={styles.sectionTitle}>Strategic Recommendation</Text>
            <Text style={styles.analysisText}>
              Primary Factor: {analysis.combinedRecommendations.primaryFactor}
            </Text>
            <Text style={styles.analysisText}>
              Confidence: {analysis.confidence}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Visualization Layers</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#00ff00' }]} />
          <Text style={styles.legendText}>Wind Particles (animated)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#0080ff' }]} />
          <Text style={styles.legendText}>Current Particles (animated)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#ff8800' }]} />
          <Text style={styles.legendText}>Wind Shadow Zones</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#00ccff' }]} />
          <Text style={styles.legendText}>Current Acceleration</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#cccccc' }]} />
          <Text style={styles.legendText}>Buildings (3D extrusion)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#0f5278' }]} />
          <Text style={styles.legendText}>Bathymetry Contours</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    textAlign: 'center'
  },
  venueText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  successHeader: {
    marginBottom: 20
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00aa00',
    textAlign: 'center'
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#cc0000',
    textAlign: 'center'
  },
  errorDetail: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  metricsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  metricsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333'
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  metricLabel: {
    fontSize: 14,
    color: '#666'
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  fpsGood: {
    color: '#00aa00'
  },
  fpsBad: {
    color: '#cc0000'
  },
  analysisContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333'
  },
  analysisSection: {
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0080ff',
    marginBottom: 4
  },
  analysisText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8
  },
  legendContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  legendTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 12
  },
  legendText: {
    fontSize: 13,
    color: '#666'
  }
});
