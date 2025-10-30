/**
 * Upwind Strategy Card
 * Dedicated card for upwind beats strategy - extracted from TacticalPlanCard
 * Shows favored sides, shift playing tactics, theory + execution for each beat
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StrategyCard } from './StrategyCard';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';

interface BeatRecommendation {
  leg: string; // 'Upwind Leg 1', 'Upwind Leg 2', etc.
  favoredSide: 'left' | 'right' | 'middle';
  reasoning: string;
  keyPoints: string[];
  confidence: number;
  theory?: string;
  execution?: string;
}

interface UpwindStrategyCardProps {
  raceId: string;
  raceName: string;
}

export function UpwindStrategyCard({
  raceId,
  raceName
}: UpwindStrategyCardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [beats, setBeats] = useState<BeatRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUpwindStrategy();
  }, [raceId]);

  const loadUpwindStrategy = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('race_strategies')
        .select('strategy_content')
        .eq('regatta_id', raceId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data && data.strategy_content) {
        const strategyContent = data.strategy_content as any;

        // Extract upwind beats from tacticalPlan
        if (strategyContent.tacticalPlan?.recommendations) {
          const upwindBeats = strategyContent.tacticalPlan.recommendations.filter(
            (rec: BeatRecommendation) => rec.leg.toLowerCase().includes('upwind')
          );
          setBeats(upwindBeats);
        } else {
          setError('No upwind strategy found. Generate your tactical plan first.');
        }
      } else {
        setError('No strategy found. Generate your tactical plan first.');
      }
    } catch (err) {
      console.error('[UpwindStrategyCard] Load error:', err);
      setError('Failed to load upwind strategy');
    } finally {
      setLoading(false);
    }
  };

  const getSideIcon = (side: string) => {
    switch (side) {
      case 'left': return 'arrow-left-bold';
      case 'right': return 'arrow-right-bold';
      case 'middle': return 'minus';
      default: return 'help-circle';
    }
  };

  const getSideColor = (side: string) => {
    switch (side) {
      case 'left': return '#10B981';
      case 'right': return '#3B82F6';
      case 'middle': return '#F59E0B';
      default: return '#64748B';
    }
  };

  const getCardStatus = () => {
    if (loading) return 'generating';
    if (error) return 'error';
    if (beats.length === 0) return 'not_set';
    return 'ready';
  };

  const getStatusMessage = () => {
    if (loading) return 'Loading upwind strategy...';
    if (error) return error;
    if (beats.length === 0) return 'Generate tactical plan first';
    return `${beats.length} beat${beats.length > 1 ? 's' : ''}`;
  };

  const renderUpwindContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      );
    }

    if (error || beats.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="sail-boat" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>
            {error || 'No upwind strategy available yet'}
          </Text>
          <Text style={styles.emptyHint}>
            Generate your tactical plan to see upwind beat recommendations
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.beatsContainer}>
        {beats.map((beat, index) => (
          <View key={index} style={styles.beatCard}>
            {/* Beat Header */}
            <View style={styles.beatHeader}>
              <Text style={styles.beatTitle}>{beat.leg}</Text>
              <View style={[
                styles.favoredSideBadge,
                { backgroundColor: getSideColor(beat.favoredSide) + '20' }
              ]}>
                <MaterialCommunityIcons
                  name={getSideIcon(beat.favoredSide)}
                  size={16}
                  color={getSideColor(beat.favoredSide)}
                />
                <Text style={[
                  styles.favoredSideText,
                  { color: getSideColor(beat.favoredSide) }
                ]}>
                  {beat.favoredSide.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Theory (What/Why) */}
            {beat.theory && (
              <View style={styles.theorySection}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="lightbulb-on" size={16} color="#F59E0B" />
                  <Text style={styles.sectionLabel}>THEORY (What/Why)</Text>
                </View>
                <Text style={styles.theoryText}>{beat.theory}</Text>
              </View>
            )}

            {/* Execution (How) */}
            {beat.execution && (
              <View style={styles.executionSection}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="rocket-launch" size={16} color="#3B82F6" />
                  <Text style={styles.sectionLabel}>EXECUTION (How)</Text>
                </View>
                <Text style={styles.executionText}>{beat.execution}</Text>
              </View>
            )}

            {/* Reasoning (fallback if no theory/execution) */}
            {!beat.theory && !beat.execution && beat.reasoning && (
              <Text style={styles.reasoningText}>{beat.reasoning}</Text>
            )}

            {/* Key Points */}
            {beat.keyPoints && beat.keyPoints.length > 0 && (
              <View style={styles.keyPointsList}>
                {beat.keyPoints.map((point, idx) => (
                  point && (
                    <View key={idx} style={styles.keyPoint}>
                      <MaterialCommunityIcons name="check-circle" size={14} color="#10B981" />
                      <Text style={styles.keyPointText}>{point}</Text>
                    </View>
                  )
                ))}
              </View>
            )}

            {/* Confidence */}
            <View style={styles.confidenceRow}>
              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceFill,
                    {
                      width: `${beat.confidence}%`,
                      backgroundColor: beat.confidence > 70 ? '#10B981' :
                                     beat.confidence > 50 ? '#F59E0B' : '#EF4444'
                    }
                  ]}
                />
              </View>
              <Text style={styles.confidenceText}>{beat.confidence}%</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <StrategyCard
      icon="sail-boat"
      title="Upwind Strategy"
      status={getCardStatus()}
      statusMessage={getStatusMessage()}
      expandable={false}
    >
      {renderUpwindContent()}
    </StrategyCard>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  beatsContainer: {
    gap: 16,
  },
  beatCard: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  beatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  beatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  favoredSideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  favoredSideText: {
    fontSize: 12,
    fontWeight: '700',
  },
  theorySection: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  executionSection: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  theoryText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  executionText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  reasoningText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  keyPointsList: {
    gap: 6,
  },
  keyPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  keyPointText: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  confidenceBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    minWidth: 40,
    textAlign: 'right',
  },
});
