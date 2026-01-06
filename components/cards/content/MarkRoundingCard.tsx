/**
 * MarkRoundingCard - Position 5
 *
 * Mark rounding strategy including:
 * - Windward mark approach
 * - Leeward mark approach
 * - Gate selection
 * - Zone rules
 * - Common mistakes to avoid
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { CornerDownRight } from 'lucide-react-native';

import { CardContentProps } from '../types';
import { MARK_ROUNDING_TEMPLATE } from '../templates/defaultTemplates';
import { StrategyTemplateRenderer } from '../templates/StrategyTemplateRenderer';

export function MarkRoundingCard({
  race,
  cardType,
  isActive,
  dimensions,
}: CardContentProps) {
  const [enhancedData, setEnhancedData] = useState(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhance = useCallback(async () => {
    setIsEnhancing(true);
    setTimeout(() => {
      setIsEnhancing(false);
    }, 2000);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <CornerDownRight size={20} color="#8B5CF6" />
        <Text style={styles.title}>Mark Rounding</Text>
      </View>

      {/* Template Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <StrategyTemplateRenderer
          template={MARK_ROUNDING_TEMPLATE}
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

export default MarkRoundingCard;
