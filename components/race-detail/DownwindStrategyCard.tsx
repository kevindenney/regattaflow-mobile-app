/**
 * Downwind Strategy Card
 * Dedicated card for downwind runs strategy - extracted from TacticalPlanCard
 * Shows favored sides, VMG optimization, shift detection for each run
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StrategyCard } from './StrategyCard';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';

interface RunRecommendation {
  leg: string; // 'Downwind Leg 1', 'Downwind Leg 2', etc.
  favoredSide: 'left' | 'right' | 'middle';
  reasoning: string;
  keyPoints: string[];
  confidence: number;
  theory?: string;
  execution?: string;
}

interface DownwindStrategyCardProps {
  raceId: string;
  raceName: string;
}

export function DownwindStrategyCard({
  raceId,
  raceName
}: DownwindStrategyCardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState<RunRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDownwindStrategy();

    // Subscribe to realtime changes for this race's strategy
    const subscription = supabase
      .channel(`race_strategy_downwind_${raceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'race_strategies',
          filter: `regatta_id=eq.${raceId}`,
        },
        (payload) => {
          console.log('[DownwindStrategyCard] Realtime update received:', payload);
          // Reload strategy when it changes
          loadDownwindStrategy();
        }
      )
      .subscribe();

    // Poll for strategy updates every 3 seconds if no data yet
    // This handles the case where strategy is generated after component mounts
    const pollInterval = setInterval(() => {
      if (runs.length === 0 && !loading) {
        console.log('[DownwindStrategyCard] Polling for strategy updates...');
        loadDownwindStrategy();
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearInterval(pollInterval);
    };
  }, [raceId, runs.length, loading]);

  const loadDownwindStrategy = async () => {
    console.log('[DownwindStrategyCard] Loading strategy for raceId:', raceId);
    console.log('[DownwindStrategyCard] Current user:', user?.id);

    if (!user) {
      console.log('[DownwindStrategyCard] No user found, skipping load');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[DownwindStrategyCard] Querying race_strategies table with:', {
        regatta_id: raceId,
        user_id: user.id
      });

      const { data, error: fetchError } = await supabase
        .from('race_strategies')
        .select('strategy_content')
        .eq('regatta_id', raceId)
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('[DownwindStrategyCard] Query result:', {
        data: data ? 'Data received' : 'No data',
        error: fetchError,
        hasStrategyContent: !!data?.strategy_content
      });

      if (fetchError) {
        console.error('[DownwindStrategyCard] Fetch error:', fetchError);
        throw fetchError;
      }

      if (data && data.strategy_content) {
        const strategyContent = data.strategy_content as any;
        console.log('[DownwindStrategyCard] Strategy content structure:', {
          hasTacticalPlan: !!strategyContent.tacticalPlan,
          hasRecommendations: !!strategyContent.tacticalPlan?.recommendations,
          recommendationsCount: strategyContent.tacticalPlan?.recommendations?.length || 0,
          hasFullAIStrategy: !!strategyContent.fullAIStrategy,
          hasRunStrategy: !!strategyContent.fullAIStrategy?.strategy?.runStrategy
        });

        let downwindRuns: RunRecommendation[] = [];

        // Try new structure first: tacticalPlan.recommendations
        if (strategyContent.tacticalPlan?.recommendations) {
          downwindRuns = strategyContent.tacticalPlan.recommendations.filter(
            (rec: RunRecommendation) => rec.leg.toLowerCase().includes('downwind')
          );
          console.log('[DownwindStrategyCard] Found downwind runs from tacticalPlan:', downwindRuns.length);
        }
        // Fallback to old structure: fullAIStrategy.strategy.runStrategy
        else if (strategyContent.fullAIStrategy?.strategy?.runStrategy) {
          console.log('[DownwindStrategyCard] Using fullAIStrategy.strategy.runStrategy (legacy format)');

          // Transform runStrategy to RunRecommendation format
          const runStrategy = strategyContent.fullAIStrategy.strategy.runStrategy;
          downwindRuns = runStrategy.map((run: any, index: number) => ({
            leg: `Downwind Leg ${index + 1}`,
            favoredSide: 'middle', // Default, could be extracted from action if needed
            reasoning: run.reasoning || run.theory || '',
            keyPoints: [
              run.execution,
              run.action,
              `Confidence: ${run.confidence}%`
            ].filter(Boolean),
            confidence: run.confidence || 70,
            theory: run.theory,
            execution: run.execution
          }));
          console.log('[DownwindStrategyCard] Transformed run strategy to downwind runs:', downwindRuns.length);
        }

        if (downwindRuns.length > 0) {
          console.log('[DownwindStrategyCard] Final downwind runs:', downwindRuns);
          setRuns(downwindRuns);
        } else {
          console.warn('[DownwindStrategyCard] No downwind strategy found in any format');
          setError('No downwind strategy found. Generate your tactical plan first.');
        }
      } else {
        console.warn('[DownwindStrategyCard] No data or strategy_content found');
        setError('No strategy found. Generate your tactical plan first.');
      }
    } catch (err) {
      console.error('[DownwindStrategyCard] Load error:', err);
      setError('Failed to load downwind strategy');
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
    if (runs.length === 0) return 'not_set';
    return 'ready';
  };

  const getStatusMessage = () => {
    if (loading) return 'Loading downwind strategy...';
    if (error) return error;
    if (runs.length === 0) return 'Generate tactical plan first';
    return `${runs.length} run${runs.length > 1 ? 's' : ''}`;
  };

  const renderDownwindContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      );
    }

    if (error || runs.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="run-fast" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>
            {error || 'No downwind strategy available yet'}
          </Text>
          <Text style={styles.emptyHint}>
            Generate your tactical plan to see downwind run recommendations
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.runsContainer}>
        {runs.map((run, index) => (
          <View key={index} style={styles.runCard}>
            {/* Run Header */}
            <View style={styles.runHeader}>
              <Text style={styles.runTitle}>{run.leg}</Text>
              <View style={[
                styles.favoredSideBadge,
                { backgroundColor: getSideColor(run.favoredSide) + '20' }
              ]}>
                <MaterialCommunityIcons
                  name={getSideIcon(run.favoredSide)}
                  size={16}
                  color={getSideColor(run.favoredSide)}
                />
                <Text style={[
                  styles.favoredSideText,
                  { color: getSideColor(run.favoredSide) }
                ]}>
                  {run.favoredSide.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Theory (What/Why) */}
            {run.theory && (
              <View style={styles.theorySection}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="lightbulb-on" size={16} color="#F59E0B" />
                  <Text style={styles.sectionLabel}>THEORY (What/Why)</Text>
                </View>
                <Text style={styles.theoryText}>{run.theory}</Text>
              </View>
            )}

            {/* Execution (How) */}
            {run.execution && (
              <View style={styles.executionSection}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="sail-boat" size={16} color="#06B6D4" />
                  <Text style={styles.sectionLabel}>EXECUTION (How)</Text>
                </View>
                <Text style={styles.executionText}>{run.execution}</Text>
              </View>
            )}

            {/* Reasoning (fallback if no theory/execution) */}
            {!run.theory && !run.execution && run.reasoning && (
              <Text style={styles.reasoningText}>{run.reasoning}</Text>
            )}

            {/* Key Points */}
            {run.keyPoints && run.keyPoints.length > 0 && (
              <View style={styles.keyPointsList}>
                {run.keyPoints.map((point, idx) => (
                  point && (
                    <View key={idx} style={styles.keyPoint}>
                      <MaterialCommunityIcons name="check-circle" size={14} color="#06B6D4" />
                      <Text style={styles.keyPointText}>{point}</Text>
                    </View>
                  )
                ))}
              </View>
            )}

            {/* Shift Detection Tip */}
            <View style={styles.tipBox}>
              <MaterialCommunityIcons name="waves" size={16} color="#8B5CF6" />
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Kevin's Tip:</Text> Apparent wind moves AFT without getting STRONGER = LIFT = JIBE!
              </Text>
            </View>

            {/* Confidence */}
            <View style={styles.confidenceRow}>
              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceFill,
                    {
                      width: `${run.confidence}%`,
                      backgroundColor: run.confidence > 70 ? '#10B981' :
                                     run.confidence > 50 ? '#F59E0B' : '#EF4444'
                    }
                  ]}
                />
              </View>
              <Text style={styles.confidenceText}>{run.confidence}%</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <StrategyCard
      icon="run-fast"
      title="Downwind Strategy"
      status={getCardStatus()}
      statusMessage={getStatusMessage()}
      expandable={false}
    >
      {renderDownwindContent()}
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
  runsContainer: {
    gap: 16,
  },
  runCard: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  runTitle: {
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
    backgroundColor: '#ECFEFF',
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
    color: '#0E7490',
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
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F5F3FF',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#5B21B6',
    lineHeight: 16,
  },
  tipBold: {
    fontWeight: '700',
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
