/**
 * Strategy Detail Card
 * Compact view of tactical strategy notes for the detail zone
 */

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StrategyNote {
  id: string;
  category: 'start' | 'upwind' | 'downwind' | 'mark_rounding' | 'general';
  text: string;
}

interface StrategyDetailCardProps {
  raceId: string;
  primaryStrategy?: string;
  notes?: StrategyNote[];
  aiInsight?: string;
  startPreference?: 'pin' | 'boat' | 'middle';
  laylineApproach?: 'early' | 'late' | 'standard';
  onPress?: () => void;
  onGenerateStrategy?: () => void;
}

export function StrategyDetailCard({
  raceId,
  primaryStrategy,
  notes,
  aiInsight,
  startPreference,
  laylineApproach,
  onPress,
  onGenerateStrategy,
}: StrategyDetailCardProps) {
  const hasStrategy = primaryStrategy || notes?.length || aiInsight;

  const getCategoryIcon = (category: StrategyNote['category']) => {
    switch (category) {
      case 'start':
        return 'flag-checkered';
      case 'upwind':
        return 'arrow-up-bold';
      case 'downwind':
        return 'arrow-down-bold';
      case 'mark_rounding':
        return 'rotate-right';
      default:
        return 'lightbulb-outline';
    }
  };

  const getCategoryColor = (category: StrategyNote['category']) => {
    switch (category) {
      case 'start':
        return '#DC2626';
      case 'upwind':
        return '#2563EB';
      case 'downwind':
        return '#7C3AED';
      case 'mark_rounding':
        return '#059669';
      default:
        return '#64748B';
    }
  };

  const getStartPreferenceLabel = (pref?: string) => {
    switch (pref) {
      case 'pin':
        return 'Pin End';
      case 'boat':
        return 'Boat End';
      case 'middle':
        return 'Middle';
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="strategy" size={18} color="#7C3AED" />
        </View>
        <Text style={styles.headerTitle}>Strategy</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
      </View>

      <View style={styles.content}>
        {hasStrategy ? (
          <>
            {/* Primary Strategy */}
            {primaryStrategy && (
              <Text style={styles.primaryStrategy} numberOfLines={2}>
                {primaryStrategy}
              </Text>
            )}

            {/* Quick Settings */}
            {(startPreference || laylineApproach) && (
              <View style={styles.quickSettings}>
                {startPreference && (
                  <View style={styles.settingChip}>
                    <MaterialCommunityIcons name="flag-checkered" size={12} color="#DC2626" />
                    <Text style={styles.settingText}>
                      Start: {getStartPreferenceLabel(startPreference)}
                    </Text>
                  </View>
                )}
                {laylineApproach && (
                  <View style={styles.settingChip}>
                    <MaterialCommunityIcons name="vector-line" size={12} color="#2563EB" />
                    <Text style={styles.settingText}>
                      Layline: {laylineApproach}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Strategy Notes Preview */}
            {notes && notes.length > 0 && (
              <View style={styles.notesList}>
                {notes.slice(0, 2).map((note) => (
                  <View key={note.id} style={styles.noteRow}>
                    <MaterialCommunityIcons
                      name={getCategoryIcon(note.category) as any}
                      size={14}
                      color={getCategoryColor(note.category)}
                    />
                    <Text style={styles.noteText} numberOfLines={1}>
                      {note.text}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* AI Insight */}
            {aiInsight && (
              <View style={styles.aiInsight}>
                <MaterialCommunityIcons name="robot-outline" size={14} color="#7C3AED" />
                <Text style={styles.aiInsightText} numberOfLines={2}>
                  {aiInsight}
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="lightbulb-outline" size={24} color="#CBD5E1" />
            <Text style={styles.emptyText}>No strategy set</Text>
            {onGenerateStrategy && (
              <TouchableOpacity style={styles.generateButton} onPress={onGenerateStrategy}>
                <MaterialCommunityIcons name="auto-fix" size={14} color="#7C3AED" />
                <Text style={styles.generateButtonText}>Generate with AI</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  content: {
    gap: 10,
  },
  primaryStrategy: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    lineHeight: 20,
  },
  quickSettings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  settingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  settingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  notesList: {
    gap: 6,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
  },
  aiInsight: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F3E8FF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  aiInsightText: {
    flex: 1,
    fontSize: 12,
    color: '#5B21B6',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  generateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
});
