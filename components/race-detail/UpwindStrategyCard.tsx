/**
 * Upwind Strategy Card
 * Dedicated card for upwind beats strategy - extracted from TacticalPlanCard
 * Shows favored sides, shift playing tactics, theory + execution for each beat
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StrategyCard } from './StrategyCard';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { strategicPlanningService } from '@/services/StrategicPlanningService';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('UpwindStrategyCard');

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
  sailorId?: string;
  raceEventId?: string;
}

const extractSideFromAction = (action: string): 'left' | 'right' | 'middle' | null => {
  if (!action) return null;
  const lowerAction = action.toLowerCase();
  if (lowerAction.includes('right') || lowerAction.includes('starboard')) return 'right';
  if (lowerAction.includes('left') || lowerAction.includes('port')) return 'left';
  if (lowerAction.includes('middle') || lowerAction.includes('center')) return 'middle';
  return null;
};

const extractSideFromBias = (favoredEnd: string): 'left' | 'right' | 'middle' | null => {
  if (!favoredEnd) return null;
  const lower = favoredEnd.toLowerCase();
  if (lower === 'pin' || lower === 'left') return 'left';
  if (lower === 'boat' || lower === 'committee' || lower === 'right') return 'right';
  if (lower === 'middle') return 'middle';
  return null;
};

export function UpwindStrategyCard({
  raceId,
  raceName,
  sailorId,
  raceEventId
}: UpwindStrategyCardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [beats, setBeats] = useState<BeatRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userStrategy, setUserStrategy] = useState('');
  const [savingUserStrategy, setSavingUserStrategy] = useState(false);

  // Use refs to track state for polling without triggering re-renders
  const beatsRef = useRef<BeatRecommendation[]>([]);
  const loadingRef = useRef(true);

  // Update refs when state changes
  useEffect(() => {
    beatsRef.current = beats;
  }, [beats]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const loadUpwindStrategy = useCallback(async () => {
    console.log('[UpwindStrategyCard] Loading strategy for raceId:', raceId);
    console.log('[UpwindStrategyCard] Current user:', user?.id);

    if (!user) {
      console.log('[UpwindStrategyCard] No user found, skipping load');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[UpwindStrategyCard] Querying race_strategies table with:', {
        regatta_id: raceId,
        user_id: user.id
      });

      const { data, error: fetchError } = await supabase
        .from('race_strategies')
        .select('strategy_content')
        .eq('regatta_id', raceId)
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('[UpwindStrategyCard] Query result:', {
        data: data ? 'Data received' : 'No data',
        error: fetchError,
        hasStrategyContent: !!data?.strategy_content
      });

      if (fetchError) {
        console.error('[UpwindStrategyCard] Fetch error:', fetchError);
        throw fetchError;
      }

      if (data && data.strategy_content) {
        const strategyContent = data.strategy_content as any;
        console.log('[UpwindStrategyCard] Strategy content structure:', {
          hasTacticalPlan: !!strategyContent.tacticalPlan,
          hasRecommendations: !!strategyContent.tacticalPlan?.recommendations,
          recommendationsCount: strategyContent.tacticalPlan?.recommendations?.length || 0,
          hasFullAIStrategy: !!strategyContent.fullAIStrategy,
          hasBeatStrategy: !!strategyContent.fullAIStrategy?.strategy?.beatStrategy
        });

        let upwindBeats: BeatRecommendation[] = [];

        // Try new structure first: tacticalPlan.recommendations
        if (strategyContent.tacticalPlan?.recommendations) {
          upwindBeats = strategyContent.tacticalPlan.recommendations.filter(
            (rec: BeatRecommendation) => rec.leg.toLowerCase().includes('upwind')
          );
          console.log('[UpwindStrategyCard] Found upwind beats from tacticalPlan:', upwindBeats.length);
        }
        // Fallback to old structure: fullAIStrategy.strategy.beatStrategy
        else if (strategyContent.fullAIStrategy?.strategy?.beatStrategy) {
          console.log('[UpwindStrategyCard] Using fullAIStrategy.strategy.beatStrategy (legacy format)');

          // Transform beatStrategy to BeatRecommendation format
          const beatStrategy = strategyContent.fullAIStrategy.strategy.beatStrategy;
          upwindBeats = beatStrategy.map((beat: any, index: number) => ({
            leg: `Upwind Leg ${index + 1}`,
            favoredSide: extractSideFromAction(beat.action) || 'middle',
            reasoning: beat.reasoning || beat.theory || '',
            keyPoints: [
              beat.execution,
              beat.action,
              `Confidence: ${beat.confidence}%`
            ].filter(Boolean),
            confidence: beat.confidence || 70,
            theory: beat.theory,
            execution: beat.execution
          }));
          console.log('[UpwindStrategyCard] Transformed beat strategy to upwind beats:', upwindBeats.length);
        }
        // Also check startStrategy as a fallback
        else if (strategyContent.startStrategy) {
          console.log('[UpwindStrategyCard] Only startStrategy found, creating single beat from start');

          // Create a single beat recommendation from start strategy
          upwindBeats = [{
            leg: 'First Upwind Leg',
            favoredSide: extractSideFromBias(strategyContent.startStrategy.favoredEnd) || 'middle',
            reasoning: strategyContent.startStrategy.reasoning || '',
            keyPoints: [
              strategyContent.startStrategy.approach,
              `Line bias: ${strategyContent.startStrategy.lineBias || 0}°`,
              `Favored end: ${strategyContent.startStrategy.favoredEnd}`
            ].filter(Boolean),
            confidence: strategyContent.startStrategy.confidence || 70,
            theory: strategyContent.startStrategy.reasoning,
            execution: strategyContent.startStrategy.approach
          }];
          console.log('[UpwindStrategyCard] Created beat from startStrategy');
        }

        if (upwindBeats.length > 0) {
          console.log('[UpwindStrategyCard] Final upwind beats:', upwindBeats);
          setBeats(upwindBeats);
        } else {
          console.warn('[UpwindStrategyCard] No upwind strategy found in any format');
          setError('No upwind strategy found. Generate your tactical plan first.');
        }
      } else {
        console.warn('[UpwindStrategyCard] No data or strategy_content found');
        setError('No strategy found. Generate your tactical plan first.');
      }
    } catch (err) {
      console.error('[UpwindStrategyCard] Load error:', err);
      setError('Failed to load upwind strategy');
    } finally {
      setLoading(false);
    }
  }, [user, raceId]);

  useEffect(() => {
    loadUpwindStrategy();

    // Subscribe to realtime changes for this race's strategy
    const subscription = supabase
      .channel(`race_strategy_${raceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'race_strategies',
          filter: `regatta_id=eq.${raceId}`,
        },
        (payload) => {
          console.log('[UpwindStrategyCard] Realtime update received:', payload);
          // Reload strategy when it changes
          loadUpwindStrategy();
        }
      )
      .subscribe();

    // Poll for strategy updates every 3 seconds if no data yet
    // This handles the case where strategy is generated after component mounts
    const pollInterval = setInterval(() => {
      if (beatsRef.current.length === 0 && !loadingRef.current) {
        console.log('[UpwindStrategyCard] Polling for strategy updates...');
        loadUpwindStrategy();
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearInterval(pollInterval);
    };
  }, [raceId, loadUpwindStrategy]); // Only depend on raceId and loadUpwindStrategy

  // Load user's manual strategy
  useEffect(() => {
    if (!sailorId || !raceEventId) return;

    const loadUserStrategy = async () => {
      try {
        const prep = await strategicPlanningService.getPreparationWithStrategy(
          raceEventId,
          sailorId
        );
        if (prep?.upwind_strategy) {
          setUserStrategy(prep.upwind_strategy);
        }
      } catch (err) {
        logger.error('[UpwindStrategyCard] Error loading user strategy', err);
      }
    };

    loadUserStrategy();
  }, [sailorId, raceEventId]);

  // Auto-save user's strategy on change
  const handleUserStrategyChange = async (text: string) => {
    setUserStrategy(text);
    if (!sailorId || !raceEventId) return;

    setSavingUserStrategy(true);
    try {
      await strategicPlanningService.updatePhaseStrategy(
        raceEventId,
        sailorId,
        'upwindStrategy',
        text
      );
    } catch (err) {
      logger.error('[UpwindStrategyCard] Error saving user strategy', err);
    } finally {
      setSavingUserStrategy(false);
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

        {/* User Strategy Input Section */}
        {sailorId && raceEventId && (
          <View style={styles.userStrategySection}>
            <View style={styles.userStrategyHeader}>
              <Text style={styles.userStrategyLabel}>Your Strategy Notes</Text>
              {savingUserStrategy && (
                <ActivityIndicator size="small" color="#3B82F6" />
              )}
            </View>
            <TextInput
              style={styles.userStrategyInput}
              value={userStrategy}
              onChangeText={handleUserStrategyChange}
              placeholder="Add your own strategy notes for upwind legs... (e.g., side preference, shift plan, tacking)"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        )}
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
  userStrategySection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  userStrategyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userStrategyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userStrategyInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    lineHeight: 20,
  },
});
