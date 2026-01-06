/**
 * StartStrategyCard - Position 2
 *
 * Start strategy including:
 * - Line bias analysis
 * - Favored end recommendation
 * - Timing approach
 * - Traffic/fleet positioning
 * - Bail-out options
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Rocket } from 'lucide-react-native';

import { CardContentProps } from '../types';
import { START_STRATEGY_TEMPLATE } from '../templates/defaultTemplates';
import { StrategyTemplateRenderer } from '../templates/StrategyTemplateRenderer';

export function StartStrategyCard({
  race,
  cardType,
  isActive,
  dimensions,
}: CardContentProps) {
  const [enhancedData, setEnhancedData] = useState(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhance = useCallback(async () => {
    setIsEnhancing(true);
    // TODO: Integrate with RaceStrategyEngine for AI enhancement
    setTimeout(() => {
      setIsEnhancing(false);
      // Mock enhanced data for now
    }, 2000);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Rocket size={20} color="#22C55E" />
        <Text style={styles.title}>Start Strategy</Text>
      </View>

      {/* Template Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <StrategyTemplateRenderer
          template={START_STRATEGY_TEMPLATE}
          race={race}
          enhancedData={enhancedData}
          isEnhancing={isEnhancing}
          onEnhance={handleEnhance}
          showEnhanceButton={true}
        />
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
});

export default StartStrategyCard;
