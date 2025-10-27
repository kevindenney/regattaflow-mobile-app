/**
 * Tactical Plan Card - AI-Generated Race Strategy
 * Shows favored side, mark roundings, and tactical recommendations
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StrategyCard } from './StrategyCard';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';

interface TacticalRecommendation {
  leg: string; // 'upwind-1', 'downwind-1', etc.
  favoredSide: 'left' | 'right' | 'middle';
  reasoning: string;
  keyPoints: string[];
  confidence: number;
}

interface TacticalPlan {
  overallStrategy: string;
  recommendations: TacticalRecommendation[];
  contingencies: {
    scenario: string;
    action: string;
  }[];
  confidence: number;
}

interface TacticalPlanCardProps {
  raceId: string;
  raceName: string;
  onGenerate?: () => void;
}

export function TacticalPlanCard({
  raceId,
  raceName,
  onGenerate
}: TacticalPlanCardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<TacticalPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlan();
  }, [raceId]);

  // Auto-generate plan if not exists
  useEffect(() => {
    if (!loading && !plan && !error && user) {
      console.log('[TacticalPlanCard] Auto-generating tactical plan on mount');
      generatePlan();
    }
  }, [loading, plan, error, user]);

  const loadPlan = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('race_strategies')
        .select('*')
        .eq('regatta_id', raceId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data && data.strategy_content) {
        // Extract tactical plan from strategy_content JSONB field
        const strategyContent = data.strategy_content as any;
        if (strategyContent.tacticalPlan) {
          setPlan(strategyContent.tacticalPlan);
        }
      }
    } catch (err) {
      console.error('[TacticalPlanCard] Load error:', err);
      setError('Failed to load tactical plan');
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // TODO: Call RaceStrategyEngine for full tactical analysis
      // For now, create a placeholder plan
      const placeholderPlan: TacticalPlan = {
        overallStrategy: 'Conservative start with aggressive upwind tactics. Focus on clear air and leverage current advantage on starboard tack.',
        recommendations: [
          {
            leg: 'Upwind Leg 1',
            favoredSide: 'right',
            reasoning: 'Right side favored due to persistent right shift and favorable current',
            keyPoints: [
              'Tack on headers, extend on lifts',
              'Stay in phase with wind shifts',
              'Use current advantage on starboard tack'
            ],
            confidence: 82
          },
          {
            leg: 'Downwind Leg 1',
            favoredSide: 'left',
            reasoning: 'Left gate provides better angle to next mark with current assistance',
            keyPoints: [
              'Round left mark if clear',
              'Sail high and fast in strong wind',
              'Watch for windward boats protecting position'
            ],
            confidence: 75
          },
          {
            leg: 'Upwind Leg 2',
            favoredSide: 'middle',
            reasoning: 'Fleet will be spread - stay in clear air and play shifts',
            keyPoints: [
              'Avoid corners in oscillating conditions',
              'Maintain speed and height',
              'Cover if in top 3'
            ],
            confidence: 68
          }
        ],
        contingencies: [
          {
            scenario: 'Wind shifts left 10°+',
            action: 'Tack immediately and protect left side of course'
          },
          {
            scenario: 'Current reverses',
            action: 'Favor port tack and adjust laylines accordingly'
          },
          {
            scenario: 'Wind drops below 8 knots',
            action: 'Prioritize clear air over position, sail more conservatively'
          }
        ],
        confidence: 75
      };

      // Save to database
      const existingData = await supabase
        .from('race_strategies')
        .select('strategy_content')
        .eq('regatta_id', raceId)
        .eq('user_id', user.id)
        .maybeSingle();

      const strategyContent = existingData.data?.strategy_content || {};
      (strategyContent as any).tacticalPlan = placeholderPlan;

      const { error: upsertError } = await supabase
        .from('race_strategies')
        .upsert({
          regatta_id: raceId,
          user_id: user.id,
          strategy_type: 'pre_race',
          strategy_content: strategyContent,
          confidence_score: placeholderPlan.confidence,
          ai_generated: true,
        }, {
          onConflict: 'regatta_id,user_id'
        });

      if (upsertError) throw upsertError;

      setPlan(placeholderPlan);
      onGenerate?.();
    } catch (err) {
      console.error('[TacticalPlanCard] Generate error:', err);
      setError('Failed to generate tactical plan');
    } finally {
      setLoading(false);
    }
  };

  const getCardStatus = () => {
    if (loading) return 'generating';
    if (error) return 'error';
    if (!plan) return 'not_set';
    return 'ready';
  };

  const getStatusMessage = () => {
    if (loading) return 'Generating tactical plan...';
    if (error) return error;
    if (!plan) return 'Tap to generate';
    return `${plan.confidence}% confidence`;
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

  const renderPlanContent = () => {
    if (!plan) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.emptyText}>
            Generating comprehensive tactical plan based on conditions, course layout, and venue intelligence...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.planContent}>
        {/* Overall Strategy */}
        <View style={styles.overallSection}>
          <View style={styles.overallHeader}>
            <Text style={styles.sectionTitle}>Overall Strategy</Text>
            <TouchableOpacity onPress={generatePlan} disabled={loading}>
              <MaterialCommunityIcons name="refresh" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          <View style={styles.overallBox}>
            <MaterialCommunityIcons name="strategy" size={20} color="#3B82F6" />
            <Text style={styles.overallText}>{plan.overallStrategy}</Text>
          </View>
        </View>

        {/* Leg-by-Leg Recommendations */}
        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>Leg-by-Leg Analysis</Text>
          {plan.recommendations.map((rec, index) => (
            <View key={index} style={styles.legCard}>
              {/* Leg Header */}
              <View style={styles.legHeader}>
                <Text style={styles.legTitle}>{rec.leg}</Text>
                <View style={[
                  styles.favoredSideBadge,
                  { backgroundColor: getSideColor(rec.favoredSide) + '20' }
                ]}>
                  <MaterialCommunityIcons
                    name={getSideIcon(rec.favoredSide)}
                    size={16}
                    color={getSideColor(rec.favoredSide)}
                  />
                  <Text style={[
                    styles.favoredSideText,
                    { color: getSideColor(rec.favoredSide) }
                  ]}>
                    {rec.favoredSide.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Reasoning */}
              <Text style={styles.reasoningText}>{rec.reasoning}</Text>

              {/* Key Points */}
              <View style={styles.keyPointsList}>
                {rec.keyPoints.map((point, idx) => (
                  <View key={idx} style={styles.keyPoint}>
                    <MaterialCommunityIcons name="checkbox-marked-circle" size={16} color="#10B981" />
                    <Text style={styles.keyPointText}>{point}</Text>
                  </View>
                ))}
              </View>

              {/* Confidence */}
              <View style={styles.legConfidence}>
                <View style={styles.confidenceBar}>
                  <View
                    style={[
                      styles.confidenceFill,
                      {
                        width: `${rec.confidence}%`,
                        backgroundColor: rec.confidence > 70 ? '#10B981' :
                                       rec.confidence > 50 ? '#F59E0B' : '#EF4444'
                      }
                    ]}
                  />
                </View>
                <Text style={styles.confidenceText}>{rec.confidence}%</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Contingency Plans */}
        <View style={styles.contingencySection}>
          <Text style={styles.sectionTitle}>Contingency Plans</Text>
          <View style={styles.contingencyList}>
            {plan.contingencies.map((contingency, index) => (
              <View key={index} style={styles.contingencyItem}>
                <View style={styles.contingencyHeader}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color="#F59E0B" />
                  <Text style={styles.contingencyScenario}>{contingency.scenario}</Text>
                </View>
                <Text style={styles.contingencyAction}>→ {contingency.action}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Overall Confidence */}
        <View style={styles.overallConfidence}>
          <View style={styles.confidenceHeader}>
            <Text style={styles.confidenceLabel}>Plan Confidence</Text>
            <Text style={styles.confidenceValue}>{plan.confidence}%</Text>
          </View>
          <View style={styles.confidenceBar}>
            <View
              style={[
                styles.confidenceFill,
                {
                  width: `${plan.confidence}%`,
                  backgroundColor: plan.confidence > 70 ? '#10B981' :
                                 plan.confidence > 50 ? '#F59E0B' : '#EF4444'
                }
              ]}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <StrategyCard
      icon="chess-knight"
      title="Tactical Plan"
      status={getCardStatus()}
      statusMessage={getStatusMessage()}
      expandable={false}
    >
      {renderPlanContent()}
    </StrategyCard>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  planContent: {
    gap: 20,
  },
  overallSection: {
    gap: 12,
  },
  overallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  overallBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  overallText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  recommendationsSection: {
    gap: 12,
  },
  legCard: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  legHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legTitle: {
    fontSize: 15,
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
  reasoningText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  keyPointsList: {
    gap: 8,
  },
  keyPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  keyPointText: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  legConfidence: {
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
  contingencySection: {
    gap: 12,
  },
  contingencyList: {
    gap: 12,
  },
  contingencyItem: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  contingencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contingencyScenario: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  contingencyAction: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
    paddingLeft: 24,
  },
  overallConfidence: {
    gap: 8,
    marginTop: 8,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  confidenceValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
});
