/**
 * AI Race Analysis Dashboard - Complete AI-Powered Race Intelligence Hub
 * Combines strategy generation, voice notes, real-time analysis, and tactical insights
 * The core "OnX Maps for Sailing" AI experience
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import {
  raceStrategyEngine,
  type RaceStrategy,
  type RaceConditions,
  type VenueIntelligence
} from '@/src/services/ai/RaceStrategyEngine';
import {
  voiceNoteService,
  type VoiceNote,
  type TacticalInsight,
  type RaceContext
} from '@/src/services/ai/VoiceNoteService';
import { DocumentProcessingService } from '@/src/services/ai/DocumentProcessingService';

interface AnalysisDashboardState {
  activeStrategy: RaceStrategy | null;
  currentConditions: RaceConditions | null;
  venueIntelligence: VenueIntelligence | null;
  recentInsights: TacticalInsight[];
  isGeneratingStrategy: boolean;
  raceContext: RaceContext;
  analysisHistory: AnalysisEntry[];
}

interface AnalysisEntry {
  id: string;
  timestamp: Date;
  type: 'strategy_generated' | 'voice_insight' | 'condition_update' | 'document_analyzed';
  title: string;
  description: string;
  data?: any;
  confidence?: number;
}

interface AIRaceAnalysisDashboardProps {
  onStrategyGenerated?: (strategy: RaceStrategy) => void;
  onInsightGenerated?: (insight: TacticalInsight) => void;
  style?: object;
}

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth > 768;

export const AIRaceAnalysisDashboard: React.FC<AIRaceAnalysisDashboardProps> = ({
  onStrategyGenerated,
  onInsightGenerated,
  style
}) => {
  const [state, setState] = useState<AnalysisDashboardState>({
    activeStrategy: null,
    currentConditions: null,
    venueIntelligence: null,
    recentInsights: [],
    isGeneratingStrategy: false,
    raceContext: {
      racePhase: 'pre_start',
      currentLeg: 'Start Line',
      markName: 'Committee Boat',
      fleetPosition: undefined
    },
    analysisHistory: []
  });

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'strategy' | 'insights' | 'conditions' | 'history'>('strategy');

  useEffect(() => {
    initializeDemoData();
  }, []);

  const initializeDemoData = () => {
    // Demo conditions for testing
    const demoConditions: RaceConditions = {
      wind: {
        speed: 15,
        direction: 230,
        forecast: {
          nextHour: { speed: 18, direction: 225 },
          nextThreeHours: { speed: 20, direction: 220 }
        },
        confidence: 0.85
      },
      current: {
        speed: 1.2,
        direction: 45,
        tidePhase: 'flood'
      },
      waves: {
        height: 0.8,
        period: 4,
        direction: 240
      },
      visibility: 10,
      temperature: 22,
      weatherRisk: 'low'
    };

    // Demo venue intelligence
    const demoVenue: VenueIntelligence = {
      id: 'hong_kong_victoria_harbour',
      name: 'Hong Kong Victoria Harbour',
      region: 'asia-pacific',
      localKnowledge: {
        windPatterns: {
          typical: 'SW monsoon 10-20kt with building sea breeze',
          seasonal: 'Winter NE monsoon more consistent',
          microclimate: 'Harbor wind bends and thermal effects'
        },
        currentIntelligence: {
          tidalRange: '2.1m spring tides',
          currentStrength: 'Max 2kt during springs',
          timing: 'Ebb current favors eastern approaches'
        },
        tacticalZones: {
          favored: 'Right side typically favored in SW conditions',
          windShadows: 'Hong Kong Island creates significant wind shadow',
          startBias: 'Pin end often favored due to current'
        }
      },
      culturalContext: {
        languages: ['English', 'Cantonese', 'Mandarin'],
        traditions: 'British colonial sailing customs with Asian efficiency',
        protocols: 'RHKYC formal protocols, respectful competition'
      },
      weatherSources: {
        primary: 'Hong Kong Observatory',
        marine: 'HKO Marine Weather',
        local: 'RHKYC Weather Station'
      }
    };

    setState(prev => ({
      ...prev,
      currentConditions: demoConditions,
      venueIntelligence: demoVenue
    }));
  };

  const generateRaceStrategy = async () => {
    if (!state.currentConditions) {
      Alert.alert('Missing Data', 'Weather conditions required for strategy generation');
      return;
    }

    setState(prev => ({ ...prev, isGeneratingStrategy: true }));

    try {
      // Simulate strategy generation (in real app, this would call the AI service)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const strategy: RaceStrategy = {
        id: `strategy_${Date.now()}`,
        generatedAt: new Date(),
        confidence: 0.87,
        venue: state.venueIntelligence?.name || 'Unknown Venue',
        conditions: state.currentConditions,
        startStrategy: {
          recommendation: 'Pin end start',
          bias: 3, // degrees
          timing: 'Cross line at +5 seconds',
          approach: 'Port tack approach, tack to starboard 30 seconds before start',
          confidence: 0.85
        },
        tacticalPlan: {
          upwind: 'Favor right side for expected wind shift and current assistance',
          downwind: 'Conservative approach, stay between boats and marks',
          markApproach: 'Wide approach to weather mark, inside overlap at leeward mark'
        },
        equipmentRecommendations: {
          sails: 'Full main, #2 jib for current conditions',
          setup: 'Medium rig tension, ease for expected building breeze',
          backup: 'Have #3 jib ready if wind builds above 20kt'
        },
        contingencyPlans: [
          {
            scenario: 'Wind increases to 20+ knots',
            action: 'Change down to #3 jib, increase rig tension'
          },
          {
            scenario: 'Major wind shift right',
            action: 'Tack immediately to stay on lifted tack'
          }
        ],
        keyFactors: [
          'Current strength building with flood tide',
          'Expected right wind shift in next hour',
          'Fleet likely to favor left side - opportunity on right'
        ]
      };

      setState(prev => ({
        ...prev,
        activeStrategy: strategy,
        isGeneratingStrategy: false,
        analysisHistory: [
          {
            id: `analysis_${Date.now()}`,
            timestamp: new Date(),
            type: 'strategy_generated',
            title: 'AI Strategy Generated',
            description: `87% confidence strategy for ${strategy.venue}`,
            data: strategy,
            confidence: strategy.confidence
          },
          ...prev.analysisHistory
        ]
      }));

      onStrategyGenerated?.(strategy);
      console.log('✅ Race strategy generated successfully');

    } catch (error) {
      console.error('❌ Failed to generate race strategy:', error);
      Alert.alert('Strategy Error', 'Failed to generate race strategy. Please try again.');
    } finally {
      setState(prev => ({ ...prev, isGeneratingStrategy: false }));
    }
  };

  const handleVoiceInsight = (insights: TacticalInsight[]) => {
    setState(prev => ({
      ...prev,
      recentInsights: [...insights, ...prev.recentInsights].slice(0, 10),
      analysisHistory: [
        {
          id: `voice_${Date.now()}`,
          timestamp: new Date(),
          type: 'voice_insight',
          title: 'Voice Insight Captured',
          description: insights.map(i => i.description).join(', '),
          data: insights,
          confidence: insights[0]?.confidence
        },
        ...prev.analysisHistory
      ].slice(0, 50)
    }));

    insights.forEach(insight => {
      onInsightGenerated?.(insight);
    });
  };

  const updateRaceContext = (phase: RaceContext['racePhase']) => {
    setState(prev => ({
      ...prev,
      raceContext: {
        ...prev.raceContext,
        racePhase: phase
      }
    }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In real app, would refresh conditions and analysis
    setRefreshing(false);
  };

  const renderStrategyTab = () => (
    <View style={styles.tabContent}>
      {state.activeStrategy ? (
        <View style={styles.strategyContainer}>
          <View style={styles.strategyHeader}>
            <View style={styles.strategyTitleContainer}>
              <Text style={styles.strategyTitle}>Active Race Strategy</Text>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  {Math.round(state.activeStrategy.confidence * 100)}% confidence
                </Text>
              </View>
            </View>
            <Text style={styles.strategyVenue}>{state.activeStrategy.venue}</Text>
          </View>

          <ScrollView style={styles.strategyContent} showsVerticalScrollIndicator={false}>
            <View style={styles.strategySection}>
              <Text style={styles.sectionTitle}>🏁 Start Strategy</Text>
              <Text style={styles.sectionContent}>{state.activeStrategy.startStrategy.recommendation}</Text>
              <Text style={styles.sectionDetails}>{state.activeStrategy.startStrategy.approach}</Text>
            </View>

            <View style={styles.strategySection}>
              <Text style={styles.sectionTitle}>⛵ Tactical Plan</Text>
              <Text style={styles.sectionContent}>Upwind: {state.activeStrategy.tacticalPlan.upwind}</Text>
              <Text style={styles.sectionContent}>Downwind: {state.activeStrategy.tacticalPlan.downwind}</Text>
            </View>

            <View style={styles.strategySection}>
              <Text style={styles.sectionTitle}>🔧 Equipment Setup</Text>
              <Text style={styles.sectionContent}>{state.activeStrategy.equipmentRecommendations.sails}</Text>
              <Text style={styles.sectionDetails}>{state.activeStrategy.equipmentRecommendations.setup}</Text>
            </View>

            <View style={styles.strategySection}>
              <Text style={styles.sectionTitle}>🎯 Key Factors</Text>
              {state.activeStrategy.keyFactors.map((factor, index) => (
                <Text key={index} style={styles.keyFactor}>• {factor}</Text>
              ))}
            </View>
          </ScrollView>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="brain" size={64} color="#CCC" />
          <Text style={styles.emptyStateTitle}>No Strategy Generated</Text>
          <Text style={styles.emptyStateText}>
            Generate an AI-powered race strategy based on current conditions
          </Text>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={generateRaceStrategy}
            disabled={state.isGeneratingStrategy}
          >
            <LinearGradient
              colors={['#0066CC', '#4A90E2']}
              style={styles.generateButtonGradient}
            >
              {state.isGeneratingStrategy ? (
                <Ionicons name="refresh" size={20} color="white" />
              ) : (
                <Ionicons name="brain" size={20} color="white" />
              )}
              <Text style={styles.generateButtonText}>
                {state.isGeneratingStrategy ? 'Generating...' : 'Generate Strategy'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderInsightsTab = () => (
    <View style={styles.tabContent}>
      <VoiceNoteRecorder
        raceContext={state.raceContext}
        onInsightGenerated={handleVoiceInsight}
        style={styles.voiceRecorder}
      />

      {state.recentInsights.length > 0 && (
        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>Recent Insights</Text>
          {state.recentInsights.map((insight, index) => (
            <View key={index} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={[
                  styles.insightTypeBadge,
                  { backgroundColor: getInsightColor(insight.type) }
                ]}>
                  <Text style={styles.insightTypeText}>
                    {insight.type.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.insightTime}>
                  {insight.timestamp.toLocaleTimeString()}
                </Text>
              </View>
              <Text style={styles.insightDescription}>{insight.description}</Text>
              {insight.recommendation && (
                <Text style={styles.insightRecommendation}>
                  💡 {insight.recommendation}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const getInsightColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      wind_shift: '#FF9500',
      current_observation: '#007AFF',
      fleet_position: '#34C759',
      mark_approach: '#FF3B30',
      equipment_change: '#AF52DE',
      weather_change: '#FF2D92'
    };
    return colors[type] || '#8E8E93';
  };

  const renderTabButton = (
    tab: typeof selectedTab,
    icon: string,
    label: string,
    count?: number
  ) => (
    <TouchableOpacity
      style={[styles.tabButton, selectedTab === tab && styles.tabButtonActive]}
      onPress={() => setSelectedTab(tab)}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={selectedTab === tab ? '#0066CC' : '#8E8E93'}
      />
      <Text style={[
        styles.tabButtonText,
        selectedTab === tab && styles.tabButtonTextActive
      ]}>
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={styles.tabBadge}>
          <Text style={styles.tabBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Race Analysis</Text>
        <View style={styles.racePhaseSelector}>
          {(['pre_start', 'start_sequence', 'upwind', 'downwind'] as const).map(phase => (
            <TouchableOpacity
              key={phase}
              style={[
                styles.phaseButton,
                state.raceContext.racePhase === phase && styles.phaseButtonActive
              ]}
              onPress={() => updateRaceContext(phase)}
            >
              <Text style={[
                styles.phaseButtonText,
                state.raceContext.racePhase === phase && styles.phaseButtonTextActive
              ]}>
                {phase.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.tabBar}>
        {renderTabButton('strategy', 'brain', 'Strategy')}
        {renderTabButton('insights', 'mic', 'Voice Insights', state.recentInsights.length)}
        {renderTabButton('conditions', 'cloudy', 'Conditions')}
        {renderTabButton('history', 'time', 'History', state.analysisHistory.length)}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedTab === 'strategy' && renderStrategyTab()}
        {selectedTab === 'insights' && renderInsightsTab()}
        {selectedTab === 'conditions' && (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoon}>Conditions analysis coming soon...</Text>
          </View>
        )}
        {selectedTab === 'history' && (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoon}>Analysis history coming soon...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 16,
  },
  racePhaseSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  phaseButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  phaseButtonActive: {
    backgroundColor: 'white',
    boxShadow: '0px 1px',
    elevation: 2,
  },
  phaseButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  phaseButtonTextActive: {
    color: '#0066CC',
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#0066CC',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabButtonTextActive: {
    color: '#0066CC',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  strategyContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    boxShadow: '0px 2px',
  },
  strategyHeader: {
    padding: 20,
    backgroundColor: '#0066CC',
  },
  strategyTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strategyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  confidenceBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  strategyVenue: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  strategyContent: {
    maxHeight: 400,
  },
  strategySection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 4,
  },
  sectionDetails: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  keyFactor: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
    lineHeight: 20,
  },
  generateButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    boxShadow: '0px 2px',
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  voiceRecorder: {
    marginBottom: 20,
  },
  insightsContainer: {
    gap: 12,
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  insightTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  insightTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  insightDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  insightRecommendation: {
    fontSize: 13,
    color: '#059669',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  comingSoon: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 40,
  },
});