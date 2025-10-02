/**
 * Race Detail Screen - Command Center for Individual Race
 * Comprehensive race management: strategy, documents, crew, equipment, tracks, results
 */

import { useAuth } from '@/src/providers/AuthProvider';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RaceCourseExtractor } from '@/src/services/ai/RaceCourseExtractor';
import { raceStrategyEngine, RaceStrategy, RaceConditions } from '@/src/services/ai/RaceStrategyEngine';
import type { RaceCourseExtraction } from '@/src/lib/types/ai-knowledge';
import { RaceMapView } from '@/src/components/race-strategy/RaceMapView';
import { VictoryLine, VictoryChart, VictoryTheme, VictoryAxis, VictoryArea } from 'victory';

interface RaceDetails {
  id: string;
  name: string;
  venue: string;
  startDate: string;
  endDate: string;
  classId: string;
  className: string;
  hasStrategy: boolean;
  hasDocuments: boolean;
  hasCrew: boolean;
  daysUntil: number;
}

type TabType = 'overview' | 'strategy' | 'documents' | 'crew' | 'equipment' | 'tracks' | 'results';

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: Date;
  extractionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  extraction?: RaceCourseExtraction;
}

export default function RaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [race, setRace] = useState<RaceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  // Mock document with extraction for demo
  const mockExtraction: RaceCourseExtraction = {
    courseLayout: {
      type: 'windward_leeward',
      description: 'Standard windward-leeward course with offset marks',
      confidence: 0.92
    },
    marks: [
      {
        name: 'Start Line - Committee Boat',
        type: 'start',
        position: { description: 'Committee boat at 22.2840°N, 114.1675°E', confidence: 0.95 }
      },
      {
        name: 'Start Line - Pin',
        type: 'start',
        position: { description: 'Pin end at 22.2838°N, 114.1673°E', confidence: 0.95 }
      },
      {
        name: 'Mark 1 - Windward',
        type: 'windward',
        position: { description: 'Windward mark at 22.2875°N, 114.1690°E', confidence: 0.88 }
      },
      {
        name: 'Mark 2 - Leeward/Gate',
        type: 'leeward',
        position: { description: 'Leeward gate at 22.2815°N, 114.1665°E', confidence: 0.85 }
      }
    ],
    boundaries: [],
    schedule: {
      firstWarning: '14:00',
      startTime: '14:05',
      confidence: 0.90
    },
    distances: {},
    startLine: {
      type: 'line',
      description: 'Committee boat to pin, approximately 100m length',
      length: { value: 100, unit: 'meters', confidence: 0.75 }
    },
    requirements: {
      equipment: ['Life jackets', 'VHF radio'],
      crew: [],
      safety: ['Safety boat on station', 'Weather briefing mandatory'],
      registration: ['Online registration closes 1 hour before start'],
      confidence: 0.80
    },
    communication: {
      vhfChannel: '72',
      confidence: 0.95
    },
    regulations: {
      specialFlags: ['P Flag', 'I Flag'],
      penaltySystem: 'Rule 44.1 Two-Turns Penalty',
      confidence: 0.85
    },
    weatherLimits: {
      confidence: 0.70
    },
    extractionMetadata: {
      documentType: 'sailing_instructions',
      source: 'Hong_Kong_Dragon_Championship_2025_SI.pdf',
      extractedAt: new Date(),
      overallConfidence: 0.87,
      processingNotes: ['Course extracted successfully', 'All critical information identified']
    }
  };

  const [documents, setDocuments] = useState<UploadedDocument[]>([
    {
      id: 'demo-doc-1',
      name: 'Hong_Kong_Dragon_Championship_2025_SI.pdf',
      type: 'application/pdf',
      uploadedAt: new Date(),
      extractionStatus: 'completed',
      extraction: mockExtraction
    }
  ]);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  // Strategy state
  const [strategy, setStrategy] = useState<RaceStrategy | null>(null);
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'course' | 'weather' | 'tide' | 'tactical' | 'bathymetry' | 'satellite'>('course');
  const [showLaylines, setShowLaylines] = useState(false);

  useEffect(() => {
    loadRaceDetails();
  }, [id]);

  const loadRaceDetails = async () => {
    try {
      setLoading(true);
      // TODO: Fetch race details from Supabase
      // For now, using mock data
      setRace({
        id: id || '',
        name: 'Hong Kong Dragon Championship 2025',
        venue: 'Royal Hong Kong Yacht Club',
        startDate: '2025-03-15',
        endDate: '2025-03-17',
        classId: 'dragon-1',
        className: 'Dragon',
        hasStrategy: false,
        hasDocuments: documents.length > 0,
        hasCrew: false,
        daysUntil: 42,
      });
    } catch (error) {
      console.error('Error loading race details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async () => {
    try {
      setUploading(true);

      // Pick document
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setUploading(false);
        return;
      }

      const file = result.assets[0];
      console.log('📄 Document selected:', file.name);

      // Create document entry
      const newDoc: UploadedDocument = {
        id: Date.now().toString(),
        name: file.name,
        type: file.mimeType || 'unknown',
        uploadedAt: new Date(),
        extractionStatus: 'pending',
      };

      setDocuments(prev => [...prev, newDoc]);
      setUploading(false);

      // Start AI extraction
      await extractDocumentContent(newDoc.id, file);

    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Upload Failed', 'Could not upload document. Please try again.');
      setUploading(false);
    }
  };

  const extractDocumentContent = async (docId: string, file: any) => {
    try {
      setExtracting(true);
      setDocuments(prev => prev.map(d =>
        d.id === docId ? { ...d, extractionStatus: 'processing' } : d
      ));

      // TODO: Read file content - for now using mock text
      const mockDocumentText = `
        SAILING INSTRUCTIONS
        Hong Kong Dragon Championship 2025
        Royal Hong Kong Yacht Club
        March 15-17, 2025

        COURSE:
        Windward-leeward course
        Mark 1: Windward mark at 22.2847°N, 114.1676°E
        Mark 2: Leeward mark at 22.2820°N, 114.1670°E

        SCHEDULE:
        First warning signal: 14:00
        Start sequence: 5-4-1-0

        FLAGS:
        P Flag: Penalty system in effect
        I Flag: Rule 30.1 in effect

        VHF CHANNEL: 72
        NUMBER OF RACES: 6 planned
      `;

      const extractor = new RaceCourseExtractor();
      const extraction = await extractor.extractRaceCourse(mockDocumentText, {
        filename: file.name,
        venue: race?.venue,
        documentType: 'sailing_instructions',
      });

      console.log('✅ Extraction completed:', extraction);

      // Update document with extraction
      setDocuments(prev => prev.map(d =>
        d.id === docId
          ? { ...d, extractionStatus: 'completed', extraction }
          : d
      ));

      // Auto-populate race data if not set
      if (extraction && race) {
        setRace({
          ...race,
          hasDocuments: true,
        });
      }

      Alert.alert(
        'Extraction Complete',
        `Found ${extraction.marks.length} marks and extracted course layout. View in Strategy tab for visualization.`,
        [{ text: 'View Strategy', onPress: () => setActiveTab('strategy') }, { text: 'OK' }]
      );

    } catch (error) {
      console.error('Error extracting document:', error);
      setDocuments(prev => prev.map(d =>
        d.id === docId ? { ...d, extractionStatus: 'failed' } : d
      ));
      Alert.alert('Extraction Failed', 'Could not extract course information. You can still view the document.');
    } finally {
      setExtracting(false);
    }
  };

  const generateStrategy = async () => {
    try {
      if (!race) return;

      setGeneratingStrategy(true);
      console.log('🧠 Generating AI race strategy...');

      // Get sailing instructions text from documents
      const docWithExtraction = documents.find(d => d.extraction);
      if (!docWithExtraction) {
        Alert.alert('No Documents', 'Please upload sailing instructions first.');
        setGeneratingStrategy(false);
        return;
      }

      // Mock current conditions - in production, fetch from weather API
      const mockConditions: RaceConditions = {
        wind: {
          speed: 15,
          direction: 45,
          forecast: {
            nextHour: { speed: 16, direction: 50 },
            nextThreeHours: { speed: 18, direction: 55 }
          },
          confidence: 0.85
        },
        current: {
          speed: 0.8,
          direction: 180,
          tidePhase: 'flood'
        },
        waves: {
          height: 0.5,
          period: 4,
          direction: 90
        },
        visibility: 10,
        temperature: 24,
        weatherRisk: 'low'
      };

      // Generate strategy using RaceStrategyEngine
      const generatedStrategy = await raceStrategyEngine.generateRaceStrategy(
        `Sailing Instructions for ${race.name}`,
        mockConditions,
        'hong-kong', // venue ID
        {
          raceName: race.name,
          fleetSize: 25,
          boatType: race.className,
          importance: 'championship'
        }
      );

      setStrategy(generatedStrategy);
      setRace(prev => prev ? { ...prev, hasStrategy: true } : null);

      console.log('✅ Strategy generated successfully');

    } catch (error) {
      console.error('Error generating strategy:', error);
      Alert.alert('Strategy Generation Failed', 'Could not generate race strategy. Please try again.');
    } finally {
      setGeneratingStrategy(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading race details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!race) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Race not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Race Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.countdownBadge}>
          <Text style={styles.countdownNumber}>{race.daysUntil}</Text>
          <Text style={styles.countdownLabel}>days</Text>
        </View>
        <View style={styles.raceHeaderInfo}>
          <Text style={styles.venueName}>{race.venue}</Text>
          <Text style={styles.dateRange}>
            {new Date(race.startDate).toLocaleDateString()} - {new Date(race.endDate).toLocaleDateString()}
          </Text>
          <View style={styles.classBadge}>
            <MaterialCommunityIcons name="sail-boat" size={14} color="#3B82F6" />
            <Text style={styles.classText}>{race.className}</Text>
          </View>
        </View>
      </View>

      {/* Quick Status */}
      <View style={styles.statusGrid}>
        <TouchableOpacity
          style={[styles.statusCard, !race.hasStrategy && styles.statusCardIncomplete]}
          onPress={() => setActiveTab('strategy')}
        >
          <MaterialCommunityIcons
            name={race.hasStrategy ? 'compass-outline' : 'compass-off-outline'}
            size={32}
            color={race.hasStrategy ? '#10B981' : '#EF4444'}
          />
          <Text style={styles.statusTitle}>Strategy</Text>
          <Text style={[styles.statusSubtitle, !race.hasStrategy && styles.statusSubtitleIncomplete]}>
            {race.hasStrategy ? 'Ready' : 'Not Planned'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusCard, !race.hasDocuments && styles.statusCardIncomplete]}
          onPress={() => setActiveTab('documents')}
        >
          <MaterialCommunityIcons
            name={race.hasDocuments ? 'file-check-outline' : 'file-alert-outline'}
            size={32}
            color={race.hasDocuments ? '#10B981' : '#F59E0B'}
          />
          <Text style={styles.statusTitle}>Documents</Text>
          <Text style={[styles.statusSubtitle, !race.hasDocuments && styles.statusSubtitleIncomplete]}>
            {race.hasDocuments ? 'Uploaded' : 'Missing'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusCard, !race.hasCrew && styles.statusCardIncomplete]}
          onPress={() => setActiveTab('crew')}
        >
          <MaterialCommunityIcons
            name={race.hasCrew ? 'account-group' : 'account-group-outline'}
            size={32}
            color={race.hasCrew ? '#10B981' : '#94A3B8'}
          />
          <Text style={styles.statusTitle}>Crew</Text>
          <Text style={[styles.statusSubtitle, !race.hasCrew && styles.statusSubtitleIncomplete]}>
            {race.hasCrew ? 'Assigned' : 'Not Set'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons name="weather-cloudy" size={20} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Check Weather</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#3B82F6" />
          <Text style={styles.actionButtonText}>View Venue Intel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons name="share-variant" size={20} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Share with Crew</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStrategy = () => {
    const docWithExtraction = documents.find(d => d.extraction);

    // No documents uploaded yet
    if (!docWithExtraction) {
      return (
        <View style={styles.tabContent}>
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="compass-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Course Data</Text>
            <Text style={styles.emptyText}>
              Upload sailing instructions in the Documents tab to generate a race strategy
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setActiveTab('documents')}
            >
              <MaterialCommunityIcons name="file-document-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Upload Documents</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Documents uploaded but no strategy yet
    if (!strategy && !generatingStrategy) {
      return (
        <View style={styles.tabContent}>
          <View style={styles.strategyPreview}>
            <MaterialCommunityIcons name="compass-outline" size={48} color="#3B82F6" />
            <Text style={styles.strategyPreviewTitle}>Ready to Generate Strategy</Text>
            <Text style={styles.strategyPreviewText}>
              Course extracted with {docWithExtraction.extraction!.marks.length} marks.{'\n'}
              Generate AI-powered race strategy with venue intelligence.
            </Text>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateStrategy}
            >
              <MaterialCommunityIcons name="brain" size={20} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Generate AI Strategy</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Generating strategy
    if (generatingStrategy) {
      return (
        <View style={styles.tabContent}>
          <View style={styles.generatingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.generatingTitle}>Generating Race Strategy</Text>
            <Text style={styles.generatingText}>
              AI is analyzing sailing instructions, conditions, and venue intelligence...
            </Text>
            <View style={styles.generatingSteps}>
              <Text style={styles.generatingStep}>✓ Extracting race course</Text>
              <Text style={styles.generatingStep}>✓ Loading venue intelligence</Text>
              <Text style={styles.generatingStep}>⟳ Generating tactical recommendations</Text>
              <Text style={styles.generatingStep}>⟳ Running Monte Carlo simulation</Text>
            </View>
          </View>
        </View>
      );
    }

    // Strategy generated - show full-screen map interface
    return (
      <View style={styles.strategyContainer}>
        {/* OnX Maps-style Layer Controls */}
        <View style={styles.layerControls}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.layerScrollContent}
          >
            {[
              { key: 'course', label: 'Course', icon: 'map-marker-path' },
              { key: 'weather', label: 'Weather', icon: 'weather-windy' },
              { key: 'tide', label: 'Tide', icon: 'waves' },
              { key: 'tactical', label: 'Tactical', icon: 'chess-knight' },
              { key: 'bathymetry', label: 'Depth', icon: 'chart-line' },
              { key: 'satellite', label: 'Satellite', icon: 'satellite-variant' }
            ].map(layer => (
              <TouchableOpacity
                key={layer.key}
                style={[
                  styles.layerButton,
                  activeLayer === layer.key && styles.layerButtonActive
                ]}
                onPress={() => setActiveLayer(layer.key as any)}
              >
                <MaterialCommunityIcons
                  name={layer.icon as any}
                  size={16}
                  color={activeLayer === layer.key ? '#FFFFFF' : '#64748B'}
                />
                <Text style={[
                  styles.layerButtonText,
                  activeLayer === layer.key && styles.layerButtonTextActive
                ]}>
                  {layer.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.laylinesToggle, showLaylines && styles.laylinesToggleActive]}
            onPress={() => setShowLaylines(!showLaylines)}
          >
            <MaterialCommunityIcons
              name="triangle-outline"
              size={16}
              color={showLaylines ? '#FFFFFF' : '#64748B'}
            />
          </TouchableOpacity>
        </View>

        {/* 3D Map Container with MapLibre GL */}
        <View style={styles.mapContainer}>
          <RaceMapView
            courseExtraction={docWithExtraction.extraction!}
            activeLayer={activeLayer}
            showLaylines={showLaylines}
            onMapLoad={() => console.log('🗺️ Map loaded and ready')}
          />

          {/* Confidence Badge Overlay */}
          <View style={styles.confidenceBadge}>
            <MaterialCommunityIcons name="shield-check" size={16} color="#10B981" />
            <Text style={styles.confidenceBadgeText}>
              {Math.round((strategy?.confidence || 0) * 100)}% Confidence
            </Text>
          </View>
        </View>

        {/* Strategy Panel */}
        <ScrollView style={styles.strategyPanel} showsVerticalScrollIndicator={false}>
          {/* Strategy Metrics */}
          <View style={styles.strategyMetricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Pred. Finish</Text>
              <Text style={styles.metricValue}>
                {strategy?.simulationResults?.averageFinish || 'N/A'}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Win Prob.</Text>
              <Text style={styles.metricValue}>
                {Math.round((strategy?.simulationResults?.winProbability || 0) * 100)}%
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Top 3</Text>
              <Text style={styles.metricValue}>
                {Math.round((strategy?.simulationResults?.topThreeProbability || 0) * 100)}%
              </Text>
            </View>
          </View>

          {/* Weather Intelligence Panel */}
          <View style={styles.weatherPanel}>
            <View style={styles.weatherHeader}>
              <MaterialCommunityIcons name="weather-partly-cloudy" size={24} color="#3B82F6" />
              <Text style={styles.weatherTitle}>Weather Intelligence</Text>
              <View style={styles.weatherConfidenceBadge}>
                <Text style={styles.weatherConfidenceText}>
                  {Math.round((strategy?.conditions.wind.confidence || 0) * 100)}%
                </Text>
              </View>
            </View>

            {/* Weather Trend Charts */}
            <View style={styles.weatherTrendsSection}>
              <Text style={styles.weatherSectionLabel}>Conditions Forecast</Text>

              {/* Wind Speed Trend */}
              <View style={styles.chartContainer}>
                <View style={styles.chartHeader}>
                  <MaterialCommunityIcons name="weather-windy" size={16} color="#3B82F6" />
                  <Text style={styles.chartTitle}>Wind Speed</Text>
                  <Text style={styles.chartCurrentValue}>{strategy?.conditions.wind.speed} kts</Text>
                </View>
                <VictoryChart
                  theme={VictoryTheme.material}
                  height={80}
                  padding={{ top: 5, bottom: 20, left: 30, right: 10 }}
                >
                  <VictoryAxis
                    style={{
                      axis: { stroke: '#E2E8F0' },
                      tickLabels: { fontSize: 8, fill: '#94A3B8' }
                    }}
                  />
                  <VictoryArea
                    data={[
                      { x: 'Now', y: strategy?.conditions.wind.speed || 15 },
                      { x: '+1h', y: strategy?.conditions.wind.forecast.nextHour.speed || 16 },
                      { x: '+3h', y: strategy?.conditions.wind.forecast.nextThreeHours.speed || 18 }
                    ]}
                    style={{
                      data: { fill: '#3B82F6', fillOpacity: 0.3, stroke: '#3B82F6', strokeWidth: 2 }
                    }}
                  />
                </VictoryChart>
              </View>

              {/* Current Speed Trend */}
              <View style={styles.chartContainer}>
                <View style={styles.chartHeader}>
                  <MaterialCommunityIcons name="waves" size={16} color="#10B981" />
                  <Text style={styles.chartTitle}>Current & Tide</Text>
                  <Text style={styles.chartCurrentValue}>{strategy?.conditions.current.speed} kts</Text>
                </View>
                <VictoryChart
                  theme={VictoryTheme.material}
                  height={80}
                  padding={{ top: 5, bottom: 20, left: 30, right: 10 }}
                >
                  <VictoryAxis
                    style={{
                      axis: { stroke: '#E2E8F0' },
                      tickLabels: { fontSize: 8, fill: '#94A3B8' }
                    }}
                  />
                  <VictoryLine
                    data={[
                      { x: 'Now', y: strategy?.conditions.current.speed || 0.8 },
                      { x: '+1h', y: 0.9 },
                      { x: '+3h', y: 1.1 }
                    ]}
                    style={{
                      data: { stroke: '#10B981', strokeWidth: 2 }
                    }}
                  />
                </VictoryChart>
              </View>

              {/* Wave Height Trend */}
              <View style={styles.chartContainer}>
                <View style={styles.chartHeader}>
                  <MaterialCommunityIcons name="wave" size={16} color="#06B6D4" />
                  <Text style={styles.chartTitle}>Wave Height</Text>
                  <Text style={styles.chartCurrentValue}>{strategy?.conditions.waves.height}m</Text>
                </View>
                <VictoryChart
                  theme={VictoryTheme.material}
                  height={80}
                  padding={{ top: 5, bottom: 20, left: 30, right: 10 }}
                >
                  <VictoryAxis
                    style={{
                      axis: { stroke: '#E2E8F0' },
                      tickLabels: { fontSize: 8, fill: '#94A3B8' }
                    }}
                  />
                  <VictoryLine
                    data={[
                      { x: 'Now', y: strategy?.conditions.waves.height || 0.5 },
                      { x: '+1h', y: 0.6 },
                      { x: '+3h', y: 0.7 }
                    ]}
                    style={{
                      data: { stroke: '#06B6D4', strokeWidth: 2 }
                    }}
                  />
                </VictoryChart>
              </View>
            </View>

            {/* Forecast Timeline */}
            <View style={styles.weatherForecastSection}>
              <Text style={styles.weatherSectionLabel}>Race Window Forecast</Text>
              <View style={styles.forecastTimeline}>
                {/* Now */}
                <View style={styles.forecastTimepoint}>
                  <View style={[styles.forecastMarker, styles.forecastMarkerNow]}>
                    <Text style={styles.forecastMarkerText}>NOW</Text>
                  </View>
                  <View style={styles.forecastDataPoint}>
                    <MaterialCommunityIcons name="weather-windy" size={16} color="#3B82F6" />
                    <Text style={styles.forecastValue}>
                      {strategy?.conditions.wind.speed} kts
                    </Text>
                  </View>
                </View>

                {/* +1 Hour */}
                <View style={styles.forecastTimepoint}>
                  <View style={styles.forecastMarker}>
                    <Text style={styles.forecastMarkerText}>+1h</Text>
                  </View>
                  <View style={styles.forecastDataPoint}>
                    <MaterialCommunityIcons name="weather-windy" size={16} color="#64748B" />
                    <Text style={styles.forecastValue}>
                      {strategy?.conditions.wind.forecast.nextHour.speed} kts
                    </Text>
                  </View>
                  <Text style={styles.forecastChange}>
                    {strategy && strategy.conditions.wind.forecast.nextHour.speed > strategy.conditions.wind.speed ? '↑' : '↓'}
                    {' '}{Math.abs((strategy?.conditions.wind.forecast.nextHour.speed || 0) - (strategy?.conditions.wind.speed || 0))} kts
                  </Text>
                </View>

                {/* +3 Hours */}
                <View style={styles.forecastTimepoint}>
                  <View style={styles.forecastMarker}>
                    <Text style={styles.forecastMarkerText}>+3h</Text>
                  </View>
                  <View style={styles.forecastDataPoint}>
                    <MaterialCommunityIcons name="weather-windy" size={16} color="#64748B" />
                    <Text style={styles.forecastValue}>
                      {strategy?.conditions.wind.forecast.nextThreeHours.speed} kts
                    </Text>
                  </View>
                  <Text style={styles.forecastChange}>
                    {strategy && strategy.conditions.wind.forecast.nextThreeHours.speed > strategy.conditions.wind.speed ? '↑' : '↓'}
                    {' '}{Math.abs((strategy?.conditions.wind.forecast.nextThreeHours.speed || 0) - (strategy?.conditions.wind.speed || 0))} kts
                  </Text>
                </View>
              </View>

              {/* Weather Risk Alert */}
              {strategy?.conditions.weatherRisk !== 'low' && (
                <View style={[
                  styles.weatherRiskAlert,
                  strategy?.conditions.weatherRisk === 'high' && styles.weatherRiskAlertHigh
                ]}>
                  <MaterialCommunityIcons
                    name="alert"
                    size={16}
                    color={strategy?.conditions.weatherRisk === 'high' ? '#EF4444' : '#F59E0B'}
                  />
                  <Text style={[
                    styles.weatherRiskText,
                    strategy?.conditions.weatherRisk === 'high' && styles.weatherRiskTextHigh
                  ]}>
                    {strategy?.conditions.weatherRisk === 'high' ? 'High' : 'Moderate'} weather risk - Monitor conditions closely
                  </Text>
                </View>
              )}
            </View>

            {/* Auto-Update Status */}
            <View style={styles.weatherAutoUpdate}>
              <View style={styles.autoUpdateIndicator}>
                <View style={styles.autoUpdateDot} />
                <Text style={styles.autoUpdateText}>Auto-updating strategy on weather changes</Text>
              </View>
              <Text style={styles.autoUpdateSubtext}>Last updated: {new Date().toLocaleTimeString()}</Text>
            </View>
          </View>

          {/* Overall Approach */}
          <View style={styles.strategySection}>
            <View style={styles.strategySectionHeader}>
              <MaterialCommunityIcons name="compass" size={20} color="#3B82F6" />
              <Text style={styles.strategySectionTitle}>Overall Approach</Text>
            </View>
            <Text style={styles.strategySectionText}>
              {strategy?.strategy.overallApproach}
            </Text>
          </View>

          {/* Start Strategy */}
          <View style={styles.strategySection}>
            <View style={styles.strategySectionHeader}>
              <MaterialCommunityIcons name="flag" size={20} color="#10B981" />
              <Text style={styles.strategySectionTitle}>Start Strategy</Text>
              <View style={[
                styles.priorityBadge,
                strategy?.strategy.startStrategy.priority === 'critical' && styles.priorityCritical
              ]}>
                <Text style={styles.priorityText}>{strategy?.strategy.startStrategy.priority}</Text>
              </View>
            </View>
            <Text style={styles.tacticalAction}>{strategy?.strategy.startStrategy.action}</Text>
            <Text style={styles.tacticalRationale}>{strategy?.strategy.startStrategy.rationale}</Text>
            {strategy?.strategy.startStrategy.alternatives && (
              <View style={styles.alternativesContainer}>
                <Text style={styles.alternativesTitle}>Alternatives:</Text>
                {strategy.strategy.startStrategy.alternatives.map((alt, i) => (
                  <Text key={i} style={styles.alternativeText}>• {alt}</Text>
                ))}
              </View>
            )}
          </View>

          {/* Beat Strategy */}
          {strategy?.strategy.beatStrategy.map((beat, index) => (
            <View key={index} style={styles.strategySection}>
              <View style={styles.strategySectionHeader}>
                <MaterialCommunityIcons name="arrow-up-bold" size={20} color="#F59E0B" />
                <Text style={styles.strategySectionTitle}>Upwind Strategy</Text>
              </View>
              <Text style={styles.tacticalAction}>{beat.action}</Text>
              <Text style={styles.tacticalRationale}>{beat.rationale}</Text>
            </View>
          ))}

          {/* Contingency Plans */}
          <View style={styles.strategySection}>
            <View style={styles.strategySectionHeader}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" />
              <Text style={styles.strategySectionTitle}>Contingencies</Text>
            </View>
            {strategy?.contingencies.windShift.length! > 0 && (
              <View style={styles.contingencyItem}>
                <Text style={styles.contingencyTitle}>Wind Shift:</Text>
                <Text style={styles.contingencyText}>{strategy?.contingencies.windShift[0].action}</Text>
              </View>
            )}
            {strategy?.contingencies.windDrop.length! > 0 && (
              <View style={styles.contingencyItem}>
                <Text style={styles.contingencyTitle}>Wind Drop:</Text>
                <Text style={styles.contingencyText}>{strategy?.contingencies.windDrop[0].action}</Text>
              </View>
            )}
          </View>

          {/* Regenerate Button */}
          <TouchableOpacity
            style={styles.regenerateButton}
            onPress={generateStrategy}
          >
            <MaterialCommunityIcons name="refresh" size={18} color="#3B82F6" />
            <Text style={styles.regenerateButtonText}>Regenerate Strategy</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const renderDocuments = () => (
    <View style={styles.tabContent}>
      {/* Upload Button */}
      <TouchableOpacity
        style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
        onPress={handleDocumentUpload}
        disabled={uploading || extracting}
      >
        <MaterialCommunityIcons
          name={uploading ? "loading" : "upload"}
          size={20}
          color="#FFFFFF"
        />
        <Text style={styles.uploadButtonText}>
          {uploading ? 'Uploading...' : extracting ? 'Extracting...' : 'Upload Document'}
        </Text>
      </TouchableOpacity>

      {documents.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="file-document-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Documents Yet</Text>
          <Text style={styles.emptyText}>
            Upload sailing instructions, NORs, and course diagrams.{'\n'}
            AI will automatically extract course information.
          </Text>
        </View>
      ) : (
        <View style={styles.documentsList}>
          {documents.map((doc) => (
            <View key={doc.id} style={styles.documentCard}>
              <View style={styles.documentHeader}>
                <MaterialCommunityIcons
                  name={doc.type.includes('pdf') ? 'file-pdf-box' : 'file-image'}
                  size={32}
                  color="#3B82F6"
                />
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName} numberOfLines={1}>{doc.name}</Text>
                  <Text style={styles.documentDate}>
                    {doc.uploadedAt.toLocaleDateString()} {doc.uploadedAt.toLocaleTimeString()}
                  </Text>
                </View>
              </View>

              {/* Extraction Status */}
              <View style={styles.extractionStatus}>
                {doc.extractionStatus === 'processing' && (
                  <>
                    <ActivityIndicator size="small" color="#3B82F6" />
                    <Text style={styles.extractionText}>Extracting course data...</Text>
                  </>
                )}
                {doc.extractionStatus === 'completed' && doc.extraction && (
                  <>
                    <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                    <Text style={styles.extractionTextSuccess}>
                      Extracted: {doc.extraction.courseLayout.type} | {doc.extraction.marks.length} marks
                    </Text>
                  </>
                )}
                {doc.extractionStatus === 'failed' && (
                  <>
                    <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" />
                    <Text style={styles.extractionTextError}>Extraction failed</Text>
                  </>
                )}
              </View>

              {/* Extraction Details */}
              {doc.extraction && (
                <View style={styles.extractionDetails}>
                  <Text style={styles.extractionDetailTitle}>Extracted Information:</Text>
                  {doc.extraction.schedule.startTime && (
                    <Text style={styles.extractionDetailText}>• Start: {doc.extraction.schedule.startTime}</Text>
                  )}
                  {doc.extraction.communication.vhfChannel && (
                    <Text style={styles.extractionDetailText}>• VHF: Ch {doc.extraction.communication.vhfChannel}</Text>
                  )}
                  {doc.extraction.marks.length > 0 && (
                    <Text style={styles.extractionDetailText}>
                      • Course: {doc.extraction.courseLayout.type}
                    </Text>
                  )}
                  {doc.extraction.regulations.specialFlags && doc.extraction.regulations.specialFlags.length > 0 && (
                    <Text style={styles.extractionDetailText}>
                      • Flags: {doc.extraction.regulations.specialFlags.join(', ')}
                    </Text>
                  )}
                  <View style={styles.confidenceBar}>
                    <Text style={styles.confidenceLabel}>Confidence:</Text>
                    <View style={styles.confidenceBarTrack}>
                      <View
                        style={[
                          styles.confidenceBarFill,
                          { width: `${(doc.extraction.extractionMetadata.overallConfidence * 100)}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.confidenceValue}>
                      {(doc.extraction.extractionMetadata.overallConfidence * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              )}

              {/* Actions */}
              <View style={styles.documentActions}>
                <TouchableOpacity style={styles.documentActionButton}>
                  <MaterialCommunityIcons name="eye" size={18} color="#3B82F6" />
                  <Text style={styles.documentActionText}>View</Text>
                </TouchableOpacity>
                {doc.extraction && (
                  <TouchableOpacity
                    style={styles.documentActionButton}
                    onPress={() => setActiveTab('strategy')}
                  >
                    <MaterialCommunityIcons name="map" size={18} color="#3B82F6" />
                    <Text style={styles.documentActionText}>View on Map</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.documentActionButton, styles.documentActionButtonDanger]}>
                  <MaterialCommunityIcons name="delete" size={18} color="#EF4444" />
                  <Text style={[styles.documentActionText, styles.documentActionTextDanger]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderCrew = () => (
    <View style={styles.tabContent}>
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="account-group-outline" size={64} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>No Crew Assigned</Text>
        <Text style={styles.emptyText}>
          Assign crew members and positions for this race
        </Text>
        <TouchableOpacity style={styles.primaryButton}>
          <MaterialCommunityIcons name="account-plus" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Assign Crew</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEquipment = () => (
    <View style={styles.tabContent}>
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="wrench-outline" size={64} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>No Equipment Setup</Text>
        <Text style={styles.emptyText}>
          Configure boat setup and tuning settings for race conditions
        </Text>
        <TouchableOpacity style={styles.primaryButton}>
          <MaterialCommunityIcons name="cog" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Setup Equipment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTracks = () => (
    <View style={styles.tabContent}>
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="map-marker-path" size={64} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>No GPS Tracks</Text>
        <Text style={styles.emptyText}>
          Practice tracks and race recordings will appear here
        </Text>
        <Text style={styles.emptyHint}>
          Use the countdown timer to automatically record race tracks
        </Text>
      </View>
    </View>
  );

  const renderResults = () => (
    <View style={styles.tabContent}>
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="trophy-outline" size={64} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>Race Not Complete</Text>
        <Text style={styles.emptyText}>
          Enter your results after the race finishes
        </Text>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'strategy': return renderStrategy();
      case 'documents': return renderDocuments();
      case 'crew': return renderCrew();
      case 'equipment': return renderEquipment();
      case 'tracks': return renderTracks();
      case 'results': return renderResults();
      default: return renderOverview();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIconButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.raceName} numberOfLines={1}>{race.name}</Text>
          <Text style={styles.raceClass}>{race.className}</Text>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons name="home" size={18} color={activeTab === 'overview' ? '#3B82F6' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Overview</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'strategy' && styles.tabActive]}
          onPress={() => setActiveTab('strategy')}
        >
          <MaterialCommunityIcons name="compass-outline" size={18} color={activeTab === 'strategy' ? '#3B82F6' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'strategy' && styles.tabTextActive]}>Strategy</Text>
          {!race.hasStrategy && <View style={styles.tabBadge} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'documents' && styles.tabActive]}
          onPress={() => setActiveTab('documents')}
        >
          <Ionicons name="document-text" size={18} color={activeTab === 'documents' ? '#3B82F6' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'documents' && styles.tabTextActive]}>Docs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'crew' && styles.tabActive]}
          onPress={() => setActiveTab('crew')}
        >
          <MaterialCommunityIcons name="account-group" size={18} color={activeTab === 'crew' ? '#3B82F6' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'crew' && styles.tabTextActive]}>Crew</Text>
          {!race.hasCrew && <View style={styles.tabBadge} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'equipment' && styles.tabActive]}
          onPress={() => setActiveTab('equipment')}
        >
          <MaterialCommunityIcons name="wrench" size={18} color={activeTab === 'equipment' ? '#3B82F6' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'equipment' && styles.tabTextActive]}>Setup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'tracks' && styles.tabActive]}
          onPress={() => setActiveTab('tracks')}
        >
          <MaterialCommunityIcons name="map-marker-path" size={18} color={activeTab === 'tracks' ? '#3B82F6' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'tracks' && styles.tabTextActive]}>Tracks</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'results' && styles.tabActive]}
          onPress={() => setActiveTab('results')}
        >
          <MaterialCommunityIcons name="trophy" size={18} color={activeTab === 'results' ? '#3B82F6' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'results' && styles.tabTextActive]}>Results</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  raceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  raceClass: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    maxHeight: 52,
  },
  tabBarContent: {
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  tabActive: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  tabBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    boxShadow: '0px 2px',
    elevation: 3,
  },
  countdownBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#D97706',
  },
  countdownLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  raceHeaderInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  dateRange: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  classBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  classText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    boxShadow: '0px 2px',
    elevation: 2,
  },
  statusCardIncomplete: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FFFBEB',
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 8,
  },
  statusSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusSubtitleIncomplete: {
    color: '#EF4444',
  },
  quickActions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
  emptyHint: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 300,
    marginTop: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    boxShadow: '0px 4px',
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    boxShadow: '0px 4px',
    elevation: 4,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  documentsList: {
    gap: 16,
  },
  documentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0px 2px',
    elevation: 2,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 12,
    color: '#64748B',
  },
  extractionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 12,
  },
  extractionText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  extractionTextSuccess: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
  },
  extractionTextError: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  extractionDetails: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  extractionDetailTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  extractionDetailText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  confidenceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  confidenceBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  documentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  documentActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  documentActionButtonDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  documentActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3B82F6',
  },
  documentActionTextDanger: {
    color: '#EF4444',
  },
  // Strategy Interface Styles
  strategyContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  layerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  layerScrollContent: {
    gap: 8,
  },
  layerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  layerButtonActive: {
    backgroundColor: '#3B82F6',
  },
  layerButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  layerButtonTextActive: {
    color: '#FFFFFF',
  },
  laylinesToggle: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  laylinesToggleActive: {
    backgroundColor: '#10B981',
  },
  mapContainer: {
    height: 840,
    backgroundColor: '#E3F2FD',
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  mapPlaceholderSubtext: {
    fontSize: 13,
    color: '#94A3B8',
  },
  confidenceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    boxShadow: '0px 2px',
    elevation: 3,
  },
  confidenceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  strategyPanel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  strategyMetricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  strategySection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  strategySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  strategySectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  strategySectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  priorityCritical: {
    backgroundColor: '#FEE2E2',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tacticalAction: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    lineHeight: 22,
  },
  tacticalRationale: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  alternativesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  alternativesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  alternativeText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    lineHeight: 18,
  },
  contingencyItem: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  contingencyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  contingencyText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  regenerateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  // Strategy Preview/Generation States
  strategyPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  strategyPreviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
  },
  strategyPreviewText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    boxShadow: '0px 4px',
    elevation: 4,
  },
  generateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  generatingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
    gap: 16,
  },
  generatingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
  },
  generatingText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  generatingSteps: {
    alignSelf: 'stretch',
    marginTop: 24,
    gap: 8,
  },
  generatingStep: {
    fontSize: 14,
    color: '#64748B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  // Weather Panel Styles
  weatherPanel: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  weatherTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  weatherConfidenceBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weatherConfidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  weatherTrendsSection: {
    marginBottom: 16,
  },
  weatherSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  chartCurrentValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  weatherForecastSection: {
    marginBottom: 16,
  },
  forecastTimeline: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  forecastTimepoint: {
    alignItems: 'center',
    gap: 8,
  },
  forecastMarker: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  forecastMarkerNow: {
    backgroundColor: '#3B82F6',
  },
  forecastMarkerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  forecastDataPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  forecastValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  forecastChange: {
    fontSize: 11,
    color: '#64748B',
  },
  weatherRiskAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  weatherRiskAlertHigh: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  weatherRiskText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#92400E',
    flex: 1,
  },
  weatherRiskTextHigh: {
    color: '#991B1B',
  },
  weatherAutoUpdate: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  autoUpdateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  autoUpdateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  autoUpdateText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E293B',
  },
  autoUpdateSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 16,
  },
});