/**
 * FocusRecommendations Component (Tufte-Style)
 *
 * Dense prose-style focus area recommendations.
 * No cards, no icons - just prioritized text with marginalia.
 *
 * Tufte principles:
 * - Information-dense prose over bullet lists
 * - Marginalia for priority indicators
 * - No decorative elements
 * - Typography hierarchy only
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { FocusRecommendation } from '@/types/excellenceFramework';

interface FocusRecommendationsProps {
  recommendations: FocusRecommendation[];
  onDrillPress?: (drill: string) => void;
  onModulePress?: (moduleId: string) => void;
}

export function FocusRecommendations({
  recommendations,
  onDrillPress,
  onModulePress,
}: FocusRecommendationsProps) {
  if (recommendations.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionHeader}>FOCUS AREAS</Text>
        </View>
        <View style={styles.divider} />
        <Text style={styles.emptyText}>
          Complete more races to get personalized recommendations
        </Text>
      </View>
    );
  }

  // Priority indicator symbols
  const getPrioritySymbol = (priority: string) => {
    switch (priority) {
      case 'high':
        return '◆';
      case 'medium':
        return '◇';
      default:
        return '·';
    }
  };

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionHeader}>FOCUS AREAS</Text>
        <Text style={styles.marginalia}>
          {recommendations.filter(r => r.priority === 'high').length} priority
        </Text>
      </View>
      <View style={styles.divider} />

      {/* Recommendations as dense prose */}
      {recommendations.map((rec, index) => (
        <View key={`${rec.phase}-${index}`} style={styles.recommendationRow}>
          {/* Priority indicator in margin */}
          <Text style={[
            styles.priorityIndicator,
            rec.priority === 'high' && styles.priorityHigh,
          ]}>
            {getPrioritySymbol(rec.priority)}
          </Text>

          {/* Dense recommendation text */}
          <View style={styles.recommendationContent}>
            <Text style={styles.recommendationText}>
              <Text style={styles.phaseText}>{rec.phase}</Text>
              {' — '}
              {rec.reason}
              {rec.suggestedDrills && rec.suggestedDrills.length > 0 && (
                <Text style={styles.drillSuggestion}>
                  {' Try: '}
                  {rec.suggestedDrills.slice(0, 2).map((drill, i) => (
                    <Text key={i}>
                      {i > 0 && ', '}
                      <Text
                        style={styles.drillLink}
                        onPress={() => onDrillPress?.(drill)}
                      >
                        {drill}
                      </Text>
                    </Text>
                  ))}
                  {'.'}
                </Text>
              )}
            </Text>

            {/* Learning module link if available */}
            {rec.learningModuleId && (
              <TouchableOpacity
                onPress={() => onModulePress?.(rec.learningModuleId!)}
                activeOpacity={0.7}
              >
                <Text style={styles.moduleLink}>
                  → View module
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // No padding, no background
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  marginalia: {
    fontSize: 10,
    fontWeight: '400',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
    marginBottom: 12,
  },
  recommendationRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingRight: 8,
  },
  priorityIndicator: {
    width: 20,
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  priorityHigh: {
    color: '#d97706',
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationText: {
    fontSize: 13,
    color: '#4a4a4a',
    lineHeight: 20,
  },
  phaseText: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  drillSuggestion: {
    color: '#6b7280',
  },
  drillLink: {
    color: '#2563eb',
    fontStyle: 'italic',
  },
  moduleLink: {
    fontSize: 12,
    color: '#2563eb',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

export default FocusRecommendations;
