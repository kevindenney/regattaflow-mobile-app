/**
 * Start Strategy Card - AI-Powered Start Line Analysis
 * Shows favored end, line bias, and recommended approach
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StrategyCard } from './StrategyCard';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { raceStrategyEngine } from '@/services/ai/RaceStrategyEngine';
import type { RaceConditions } from '@/services/ai/RaceStrategyEngine';
import { createLogger } from '@/lib/utils/logger';
import { strategicPlanningService } from '@/services/StrategicPlanningService';

interface StartStrategyData {
  favoredEnd: 'pin' | 'boat' | 'middle';
  lineBias: number; // degrees, positive = pin favored, negative = boat favored
  approach: string;
  reasoning: string;
  confidence: number; // 0-100
  windDirection?: number;
  currentDirection?: number;
}

interface StartStrategyCardProps {
  raceId: string;
  raceName: string;
  raceStartTime?: string;
  venueId?: string;
  venueName?: string;
  venueCoordinates?: { lat: number; lng: number };
  racingAreaPolygon?: Array<{ lat: number; lng: number }>;
  weather?: {
    wind?: {
      speed: number;
      direction: string;
      speedMin: number;
      speedMax: number;
    };
    current?: {
      speed: number;
      direction: number;
    };
  };
  onGenerate?: () => void;
  sailorId?: string;
  raceEventId?: string;
}

const logger = createLogger('StartStrategyCard');
export function StartStrategyCard({
  raceId,
  raceName,
  raceStartTime,
  venueId,
  venueName,
  venueCoordinates,
  racingAreaPolygon,
  weather,
  onGenerate,
  sailorId,
  raceEventId
}: StartStrategyCardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<StartStrategyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userStrategy, setUserStrategy] = useState('');
  const [savingUserStrategy, setSavingUserStrategy] = useState(false);

  const loadStrategy = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError, status, statusText } = await supabase
        .from('race_strategies')
        .select('*')
        .eq('regatta_id', raceId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        logger.warn('[StartStrategyCard] Supabase returned error when loading strategy', {
          raceId,
          userId: user.id,
          status,
          statusText,
          code: fetchError.code,
          details: fetchError.details
        });
        throw fetchError;
      }

      logger.debug('[StartStrategyCard] Supabase load response', {
        raceId,
        userId: user.id,
        status,
        hasData: Boolean(data)
      });

      if (data && data.favored_end) {
        // Extract start strategy from database
        setStrategy({
          favoredEnd: data.favored_end as 'pin' | 'boat' | 'middle',
          lineBias: parseFloat(data.start_line_bias) || 0,
          approach: data.layline_approach || '',
          reasoning: data.wind_strategy || '',
          confidence: data.confidence_score || 0,
        });
      }
    } catch (err) {
      console.error('[StartStrategyCard] Load error:', err);
      setError('Failed to load strategy');
    } finally {
      setLoading(false);
    }
  }, [user, raceId]);

  useEffect(() => {
    loadStrategy();
  }, [loadStrategy]);

  // Load user's manual strategy
  useEffect(() => {
    if (!sailorId || !raceEventId) return;

    const loadUserStrategy = async () => {
      try {
        const prep = await strategicPlanningService.getPreparationWithStrategy(
          raceEventId,
          sailorId
        );
        if (prep?.start_strategy) {
          setUserStrategy(prep.start_strategy);
        }
      } catch (err) {
        logger.error('[StartStrategyCard] Error loading user strategy', err);
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
        'startStrategy',
        text
      );
    } catch (err) {
      logger.error('[StartStrategyCard] Error saving user strategy', err);
    } finally {
      setSavingUserStrategy(false);
    }
  };

  // Auto-generate strategy if not exists
  useEffect(() => {
    if (!loading && !strategy && !error && user) {
      logger.debug('[StartStrategyCard] Auto-generating strategy on mount');
      generateStrategy();
    }
  }, [loading, strategy, error, user]);

  const generateStrategy = async () => {
    if (!user) {
      logger.error('[generateStrategy] No user - cannot generate');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      logger.info('[generateStrategy] Starting strategy generation', {
        raceId,
        userId: user.id,
        raceName,
        venueId,
        venueName,
        hasWeather: !!weather
      });

      // Prepare race conditions for AI
      const windDirectionDegrees = convertWindDirectionToDegrees(weather?.wind?.direction || 'SW');
      const conditions: RaceConditions = {
        wind: {
          speed: weather?.wind?.speed || ((weather?.wind?.speedMin || 0) + (weather?.wind?.speedMax || 0)) / 2 || 12,
          direction: windDirectionDegrees,
          forecast: {
            nextHour: { speed: weather?.wind?.speed || 12, direction: windDirectionDegrees },
            nextThreeHours: { speed: weather?.wind?.speed || 12, direction: windDirectionDegrees }
          },
          confidence: 0.8
        },
        current: {
          speed: weather?.current?.speed || 0.5,
          direction: weather?.current?.direction || 90,
          tidePhase: 'flood' as const
        },
        waves: {
          height: 0.8,
          period: 5,
          direction: windDirectionDegrees
        },
        visibility: 10,
        temperature: 22,
        weatherRisk: 'low' as const
      };

      logger.debug('[generateStrategy] Race conditions prepared', conditions);

      // Generate venue-based strategy using AI
      logger.info('[generateStrategy] Calling AI strategy engine');
      const aiStrategy = await raceStrategyEngine.generateVenueBasedStrategy(
        venueId || 'hong-kong', // Default to Hong Kong if no venue
        conditions,
        {
          raceName,
          raceDate: raceStartTime ? new Date(raceStartTime) : new Date(),
          raceTime: raceStartTime ? new Date(raceStartTime).toTimeString().split(' ')[0] : '11:00:00',
          boatType: 'Keelboat',
          fleetSize: 20,
          importance: 'series',
          racingAreaPolygon
        }
      );

      logger.info('[generateStrategy] AI strategy received', {
        hasStrategy: !!aiStrategy,
        hasStartStrategy: !!aiStrategy?.strategy?.startStrategy
      });

      // Extract start strategy from full AI strategy
      const startStrat = aiStrategy.strategy.startStrategy;
      const extractedStrategy: StartStrategyData = {
        favoredEnd: extractFavoredEnd(startStrat.action),
        lineBias: extractLineBias(startStrat.action),
        approach: startStrat.execution || startStrat.action,
        reasoning: `${startStrat.theory || ''}\n\n${startStrat.rationale || ''}`.trim(),
        confidence: startStrat.confidence || 75,
        windDirection: conditions.wind.direction,
        currentDirection: conditions.current.direction,
      };

      logger.debug('[generateStrategy] Extracted strategy', extractedStrategy);

      // Save to database
      // First, get existing strategy_content to preserve other data
      logger.info('[generateStrategy] Fetching existing strategy from database');
      const { data: existingData } = await supabase
        .from('race_strategies')
        .select('strategy_content')
        .eq('regatta_id', raceId)
        .eq('user_id', user.id)
        .maybeSingle();

      logger.debug('[generateStrategy] Existing data', { hasExisting: !!existingData });

      // Preserve existing strategy_content and add fullAIStrategy
      const strategyContent = existingData?.strategy_content || {};
      (strategyContent as any).fullAIStrategy = aiStrategy; // Save full AI strategy for other cards
      (strategyContent as any).startStrategy = extractedStrategy; // Also save extracted start strategy

      // IMPORTANT: Preserve tacticalPlan if it exists (from TacticalPlanCard)
      // This ensures multiple cards don't overwrite each other's data

      const upsertData = {
        regatta_id: raceId,
        user_id: user.id,
        strategy_type: 'pre_race',
        favored_end: extractedStrategy.favoredEnd,
        start_line_bias: extractedStrategy.lineBias.toString(),
        layline_approach: extractedStrategy.approach,
        wind_strategy: extractedStrategy.reasoning,
        confidence_score: extractedStrategy.confidence,
        strategy_content: strategyContent, // Include full AI strategy
        ai_generated: true,
        // Note: ai_model and generated_at columns don't exist yet - removed until migration runs
      };

      logger.info('[generateStrategy] Upserting to database', {
        regatta_id: upsertData.regatta_id,
        user_id: upsertData.user_id,
        strategy_type: upsertData.strategy_type,
        favored_end: upsertData.favored_end,
        hasStrategyContent: !!upsertData.strategy_content
      });

      const { error: upsertError } = await supabase
        .from('race_strategies')
        .upsert(upsertData, {
          onConflict: 'regatta_id,user_id'
        });

      if (upsertError) {
        logger.error('[generateStrategy] Database upsert error', {
          error: upsertError,
          message: upsertError.message,
          details: upsertError.details,
          hint: upsertError.hint,
          code: upsertError.code
        });
        throw upsertError;
      }

      logger.info('[generateStrategy] Strategy saved successfully');

      setStrategy(extractedStrategy);
      onGenerate?.();

    } catch (err) {
      logger.error('[StartStrategyCard] Generate error', {
        error: err,
        message: (err as Error)?.message,
        stack: (err as Error)?.stack
      });
      console.error('[StartStrategyCard] Generate error:', err);
      setError('Failed to generate strategy');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert wind direction string to degrees
  const convertWindDirectionToDegrees = (direction: string): number => {
    const directions: { [key: string]: number } = {
      'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
      'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
      'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
      'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
    };
    return directions[direction.toUpperCase()] || 225; // Default SW
  };

  // Helper to extract favored end from AI action text
  const extractFavoredEnd = (action: string): 'pin' | 'boat' | 'middle' => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('pin')) return 'pin';
    if (lowerAction.includes('boat') || lowerAction.includes('committee')) return 'boat';
    return 'middle';
  };

  // Helper to extract line bias from AI action text
  const extractLineBias = (action: string): number => {
    const match = action.match(/(\d+)°/);
    if (match) {
      const degrees = parseInt(match[1]);
      // If mentions pin, bias is positive; if boat, negative
      return action.toLowerCase().includes('pin') ? degrees : -degrees;
    }
    return 0;
  };

  const getCardStatus = () => {
    if (loading) return 'generating';
    if (error) return 'error';
    if (!strategy) return 'not_set';
    return 'ready';
  };

  const getStatusMessage = () => {
    if (loading) return 'Analyzing start line...';
    if (error) return error;
    if (!strategy) return 'Tap to generate';
    return `${strategy.confidence}% confidence`;
  };

  const getFavoredEndIcon = () => {
    switch (strategy?.favoredEnd) {
      case 'pin': return 'pin';
      case 'boat': return 'flag';
      case 'middle': return 'circle-outline';
      default: return 'help-circle';
    }
  };

  const getFavoredEndColor = () => {
    switch (strategy?.favoredEnd) {
      case 'pin': return '#10B981'; // Green
      case 'boat': return '#3B82F6'; // Blue
      case 'middle': return '#F59E0B'; // Yellow
      default: return '#64748B';
    }
  };

  const renderStrategyContent = () => {
    // Show error state
    if (error) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={generateStrategy}
            disabled={loading}
          >
            <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Show loading state
    if (!strategy) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.emptyText}>
            Generating AI-powered start strategy based on wind, current, and course layout...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.strategyContent}>
        {/* Favored End Indicator */}
        <View style={styles.favoredEndSection}>
          <View style={styles.favoredEndHeader}>
            <Text style={styles.sectionTitle}>Favored End</Text>
            <TouchableOpacity
              style={styles.regenerateButton}
              onPress={generateStrategy}
              disabled={loading}
            >
              <MaterialCommunityIcons name="refresh" size={16} color="#3B82F6" />
              <Text style={styles.regenerateButtonText}>Regenerate</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.favoredEndDisplay}>
            <View style={[
              styles.favoredEndBadge,
              { backgroundColor: getFavoredEndColor() + '20' }
            ]}>
              <MaterialCommunityIcons
                name={getFavoredEndIcon()}
                size={32}
                color={getFavoredEndColor()}
              />
              <Text style={[
                styles.favoredEndText,
                { color: getFavoredEndColor() }
              ]}>
                {strategy.favoredEnd.toUpperCase()} END
              </Text>
            </View>

            {strategy.lineBias !== 0 && (
              <View style={styles.lineBiasContainer}>
                <Text style={styles.lineBiasLabel}>Line Bias</Text>
                <Text style={styles.lineBiasValue}>
                  {Math.abs(strategy.lineBias)}° {strategy.lineBias > 0 ? '→ PIN' : '→ BOAT'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Recommended Approach */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Approach</Text>
          <View style={styles.approachBox}>
            <MaterialCommunityIcons name="compass" size={20} color="#3B82F6" />
            <Text style={styles.approachText}>{strategy.approach}</Text>
          </View>
        </View>

        {/* Reasoning */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analysis</Text>
          <Text style={styles.reasoningText}>{strategy.reasoning}</Text>
        </View>

        {/* Environmental Factors */}
        {(strategy.windDirection || strategy.currentDirection) && (
          <View style={styles.factorsRow}>
            {strategy.windDirection && (
              <View style={styles.factorBadge}>
                <MaterialCommunityIcons name="weather-windy" size={16} color="#64748B" />
                <Text style={styles.factorText}>Wind {strategy.windDirection}°</Text>
              </View>
            )}
            {strategy.currentDirection && (
              <View style={styles.factorBadge}>
                <MaterialCommunityIcons name="waves" size={16} color="#64748B" />
                <Text style={styles.factorText}>Current {strategy.currentDirection}°</Text>
              </View>
            )}
          </View>
        )}

        {/* Confidence Bar */}
        <View style={styles.confidenceSection}>
          <View style={styles.confidenceHeader}>
            <Text style={styles.confidenceLabel}>Confidence</Text>
            <Text style={styles.confidenceValue}>{strategy.confidence}%</Text>
          </View>
          <View style={styles.confidenceBar}>
            <View
              style={[
                styles.confidenceFill,
                {
                  width: `${strategy.confidence}%`,
                  backgroundColor: strategy.confidence > 70 ? '#10B981' :
                                 strategy.confidence > 50 ? '#F59E0B' : '#EF4444'
                }
              ]}
            />
          </View>
        </View>

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
              placeholder="Add your own strategy notes for the start... (e.g., favored end, timing, positioning)"
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
      icon="flag-checkered"
      title="Start Strategy"
      status={getCardStatus()}
      statusMessage={getStatusMessage()}
      expandable={false}
    >
      {renderStrategyContent()}
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
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginTop: 8,
    fontWeight: '500',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  strategyContent: {
    gap: 20,
  },
  favoredEndSection: {
    gap: 12,
  },
  favoredEndHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  regenerateButtonText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  favoredEndDisplay: {
    gap: 12,
  },
  favoredEndBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  favoredEndText: {
    fontSize: 18,
    fontWeight: '700',
  },
  lineBiasContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lineBiasLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  lineBiasValue: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
    marginTop: 4,
  },
  section: {
    gap: 8,
  },
  approachBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  approachText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  reasoningText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  factorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  factorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  factorText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  confidenceSection: {
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
  confidenceBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
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
