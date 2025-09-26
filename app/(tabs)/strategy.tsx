import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Text
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { raceStrategyEngine, type RaceStrategy, type RaceConditions } from '@/src/services/ai/RaceStrategyEngine';

interface StrategyCard {
  title: string;
  icon: string;
  content: string[];
  priority: 'critical' | 'important' | 'consider';
}

export default function StrategyScreen() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState<RaceStrategy | null>(null);
  const [strategyCards, setStrategyCards] = useState<StrategyCard[]>([]);

  useEffect(() => {
    // Initialize with sample strategy cards
    setStrategyCards([
      {
        title: '🧠 AI Recommendations',
        icon: 'brain-outline',
        content: [
          'Start at committee boat end - better current',
          'Expect 15° right shift in 20 minutes',
          'Port tack favored on first beat'
        ],
        priority: 'critical'
      },
      {
        title: '🌊 Current Conditions',
        icon: 'water-outline',
        content: [
          'Wind: 12-15 kts SW',
          'Current: 0.8 kts flood',
          'Waves: 1-2 ft'
        ],
        priority: 'important'
      }
    ]);
  }, []);

  const generateDemoStrategy = async () => {
    setIsGenerating(true);

    try {
      // Demo conditions for Hong Kong
      const demoConditions: RaceConditions = {
        wind: {
          speed: 15,
          direction: 225,
          forecast: {
            nextHour: { speed: 16, direction: 230 },
            nextThreeHours: { speed: 18, direction: 240 }
          },
          confidence: 0.85
        },
        current: {
          speed: 1.2,
          direction: 90,
          tidePhase: 'flood'
        },
        waves: {
          height: 0.8,
          period: 4,
          direction: 220
        },
        visibility: 10,
        temperature: 24,
        weatherRisk: 'low'
      };

      const sailingInstructions = `
        RHKYC Spring Series Race 1
        Course: Windward-Leeward
        Start Time: 14:00 HKT

        The course will be set to windward with marks approximately 1 nautical mile apart.
        Start line between committee boat and pin buoy.
        Round all marks to port.

        Wind forecast: SW 12-18 knots
        Tidal conditions: Flood tide 0.8-1.2 knots

        Safety: All crew must wear PFDs
        VHF Channel 72 for race communication
      `;

      console.log('🎯 Generating demo race strategy...');

      const strategy = await raceStrategyEngine.generateRaceStrategy(
        sailingInstructions,
        demoConditions,
        'hong-kong',
        {
          raceName: 'RHKYC Spring Series R1',
          fleetSize: 25,
          boatType: 'Dragon',
          importance: 'series'
        }
      );

      setCurrentStrategy(strategy);
      updateStrategyCards(strategy);

      Alert.alert(
        '🎯 Strategy Generated!',
        `AI has analyzed the race and generated a comprehensive strategy with ${strategy.insights.length} insights and ${strategy.strategy.beatStrategy.length} tactical recommendations.`
      );

    } catch (error) {
      console.error('Strategy generation error:', error);
      Alert.alert('Strategy Error', 'Failed to generate strategy. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateStrategyCards = (strategy: RaceStrategy) => {
    const cards: StrategyCard[] = [
      {
        title: '🎯 Overall Approach',
        icon: 'target-outline',
        content: [strategy.strategy.overallApproach],
        priority: 'critical'
      },
      {
        title: '🏁 Start Strategy',
        icon: 'flag-outline',
        content: [
          strategy.strategy.startStrategy.action,
          `Rationale: ${strategy.strategy.startStrategy.rationale}`,
          `Risk Level: ${strategy.strategy.startStrategy.riskLevel}`
        ],
        priority: strategy.strategy.startStrategy.priority
      },
      {
        title: '⛵ Beat Strategy',
        icon: 'sail-outline',
        content: strategy.strategy.beatStrategy.map(beat =>
          `• ${beat.action} (${beat.priority})`
        ),
        priority: 'important'
      },
      {
        title: '🌊 Venue Intelligence',
        icon: 'location-outline',
        content: [
          `Venue: ${strategy.venue.name}`,
          `Wind Pattern: ${strategy.venue.localKnowledge.windPatterns.typical}`,
          `Expert Tip: ${strategy.venue.localKnowledge.expertTips[0] || 'Local knowledge available'}`
        ],
        priority: 'important'
      }
    ];

    if (strategy.simulationResults) {
      cards.push({
        title: '🎮 Race Simulation',
        icon: 'analytics-outline',
        content: [
          `Expected Finish: ${strategy.simulationResults.averageFinish}`,
          `Win Probability: ${Math.round(strategy.simulationResults.winProbability * 100)}%`,
          `Top 3 Probability: ${Math.round(strategy.simulationResults.topThreeProbability * 100)}%`
        ],
        priority: 'consider'
      });
    }

    setStrategyCards(cards);
  };

  const getCardStyle = (priority: string) => {
    switch (priority) {
      case 'critical':
        return [styles.card, styles.criticalCard];
      case 'important':
        return [styles.card, styles.importantCard];
      default:
        return [styles.card, styles.considerCard];
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">AI Strategy</ThemedText>
        <ThemedText type="subtitle">Professional sailing intelligence</ThemedText>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.generatingButton]}
          onPress={generateDemoStrategy}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="brain-outline" size={20} color="white" />
          )}
          <Text style={styles.buttonText}>
            {isGenerating ? 'Generating...' : 'Generate Strategy'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {strategyCards.map((card, index) => (
          <View key={index} style={getCardStyle(card.priority)}>
            <View style={styles.cardHeader}>
              <ThemedText type="subtitle">{card.title}</ThemedText>
              <View style={[styles.priorityBadge, styles[`${card.priority}Badge`]]}>
                <Text style={styles.badgeText}>{card.priority.toUpperCase()}</Text>
              </View>
            </View>
            {card.content.map((item, itemIndex) => (
              <ThemedText key={itemIndex} type="default" style={styles.cardContent}>
                {item.startsWith('•') ? item : `• ${item}`}
              </ThemedText>
            ))}
          </View>
        ))}

        {currentStrategy && (
          <View style={styles.card}>
            <ThemedText type="subtitle">📊 Strategy Confidence</ThemedText>
            <View style={styles.confidenceBar}>
              <View style={[
                styles.confidenceFill,
                { width: `${currentStrategy.confidence * 100}%` }
              ]} />
            </View>
            <ThemedText type="default" style={styles.confidenceText}>
              {Math.round(currentStrategy.confidence * 100)}% confidence
            </ThemedText>
            <ThemedText type="default" style={styles.timestampText}>
              Generated: {currentStrategy.generatedAt.toLocaleTimeString()}
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  generatingButton: {
    backgroundColor: '#004499',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  criticalCard: {
    backgroundColor: '#FFF5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#FF4444',
  },
  importantCard: {
    backgroundColor: '#F5F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  considerCard: {
    backgroundColor: '#F8FFF5',
    borderLeftWidth: 4,
    borderLeftColor: '#00CC44',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  criticalBadge: {
    backgroundColor: '#FF4444',
  },
  importantBadge: {
    backgroundColor: '#0066CC',
  },
  considerBadge: {
    backgroundColor: '#00CC44',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  cardContent: {
    marginLeft: 8,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 8,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#00CC44',
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  timestampText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});