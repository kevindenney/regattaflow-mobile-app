/**
 * Monte Carlo Race Simulation Results Screen
 *
 * Displays comprehensive simulation results:
 * - Position probability distribution
 * - Success factors breakdown
 * - Alternative strategies comparison
 * - Risk/reward analysis
 * - Confidence intervals
 *
 * TIER GATING: Championship subscribers only
 */

import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Card } from '@/components/ui/card';
import { Button, ButtonText } from '@/components/ui/button';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Divider } from '@/components/ui/divider';
import { LockIcon } from '@/components/ui/icon';
import { monteCarloService, SimulationResults } from '@/services/monteCarloService';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';

export default function SimulationResultsScreen() {
  const { id: strategyId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [strategyId]);

  const loadData = async () => {
    if (!user || !strategyId) return;

    setLoading(true);

    try {
      // Check subscription tier
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      setSubscription(subData);

      // Championship tier required
      if (subData?.tier !== 'championship') {
        setLoading(false);
        return;
      }

      // Try to load existing simulation
      const { data: simData } = await supabase
        .from('monte_carlo_simulations')
        .select('results')
        .eq('race_strategy_id', strategyId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (simData?.results) {
        setResults(simData.results as SimulationResults);
      }
    } catch (error) {
      console.error('Error loading simulation:', error);
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async () => {
    if (!user || !strategyId) return;

    setSimulating(true);

    try {
      // Run Monte Carlo simulation
      const simulationResults = await monteCarloService.runSimulation({
        raceStrategyId: strategyId,
        iterations: 1000,
      });

      // Save results
      await monteCarloService.saveSimulation(
        strategyId,
        simulationResults,
        user.id
      );

      setResults(simulationResults);

      Alert.alert(
        'Simulation Complete',
        `Analyzed ${simulationResults.totalIterations} race scenarios`
      );
    } catch (error) {
      console.error('Error running simulation:', error);
      Alert.alert('Error', 'Failed to run simulation. Please try again.');
    } finally {
      setSimulating(false);
    }
  };

  // Paywall for non-Championship users
  if (!loading && subscription?.tier !== 'championship') {
    return (
      <ScrollView className="flex-1 bg-white">
        <VStack space="lg" className="p-6">
          <Card className="p-6 border-2 border-amber-500">
            <VStack space="md">
              <HStack space="sm" className="items-center">
                <LockIcon className="text-amber-600 w-5 h-5" />
                <Heading size="lg">Championship Feature</Heading>
              </HStack>

              <Text className="text-gray-600">
                Monte Carlo race simulation is available exclusively to Championship
                subscribers.
              </Text>

              <Divider className="my-2" />

              <Heading size="sm" className="mb-2">
                What you'll get:
              </Heading>
              <VStack space="sm">
                <HStack space="xs" className="items-start">
                  <Text className="text-green-600">✓</Text>
                  <Text className="flex-1">1,000+ race simulations per strategy</Text>
                </HStack>
                <HStack space="xs" className="items-start">
                  <Text className="text-green-600">✓</Text>
                  <Text className="flex-1">
                    Position probability distribution
                  </Text>
                </HStack>
                <HStack space="xs" className="items-start">
                  <Text className="text-green-600">✓</Text>
                  <Text className="flex-1">Success factors analysis</Text>
                </HStack>
                <HStack space="xs" className="items-start">
                  <Text className="text-green-600">✓</Text>
                  <Text className="flex-1">
                    Alternative strategy comparisons
                  </Text>
                </HStack>
                <HStack space="xs" className="items-start">
                  <Text className="text-green-600">✓</Text>
                  <Text className="flex-1">Risk/reward optimization</Text>
                </HStack>
              </VStack>

              {subscription?.tier === 'pro' && (
                <Card className="p-4 bg-blue-50 mt-4">
                  <VStack space="sm">
                    <Heading size="sm">Pro Subscriber Preview</Heading>
                    <Text className="text-sm">
                      As a Pro subscriber, here's a sample result from a Monte Carlo
                      simulation:
                    </Text>
                    <VStack space="xs" className="mt-2">
                      <HStack className="justify-between">
                        <Text className="text-sm">Expected finish:</Text>
                        <Text className="font-semibold">3.2 (median: 3rd)</Text>
                      </HStack>
                      <HStack className="justify-between">
                        <Text className="text-sm">Podium probability:</Text>
                        <Text className="font-semibold">57%</Text>
                      </HStack>
                      <HStack className="justify-between">
                        <Text className="text-sm">Win probability:</Text>
                        <Text className="font-semibold">15%</Text>
                      </HStack>
                    </VStack>
                  </VStack>
                </Card>
              )}

              <Button
                className="mt-4 bg-amber-600"
                onPress={() => router.push('/subscription')}
              >
                <ButtonText>Upgrade to Championship</ButtonText>
              </Button>

              <Button
                variant="outline"
                onPress={() => router.back()}
              >
                <ButtonText>Back to Strategy</ButtonText>
              </Button>
            </VStack>
          </Card>
        </VStack>
      </ScrollView>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0284c7" />
        <Text className="mt-4 text-gray-600">Loading simulation...</Text>
      </View>
    );
  }

  if (!results) {
    return (
      <ScrollView className="flex-1 bg-white">
        <VStack space="lg" className="p-6">
          <Card className="p-6">
            <VStack space="md">
              <Heading size="lg">Monte Carlo Simulation</Heading>
              <Text className="text-gray-600">
                Run 1,000+ race simulations to predict outcomes and optimize your
                strategy.
              </Text>

              <Divider className="my-2" />

              <Heading size="sm" className="mb-2">
                Simulation Parameters:
              </Heading>
              <VStack space="xs">
                <Text className="text-sm text-gray-600">
                  • Wind shifts (±15° variation)
                </Text>
                <Text className="text-sm text-gray-600">
                  • Current variation (±20%)
                </Text>
                <Text className="text-sm text-gray-600">
                  • Fleet behavior (conservative/aggressive)
                </Text>
                <Text className="text-sm text-gray-600">
                  • Equipment performance
                </Text>
                <Text className="text-sm text-gray-600">
                  • Tactical decision points
                </Text>
              </VStack>

              <Button
                className="mt-4 bg-sky-600"
                onPress={runSimulation}
                disabled={simulating}
              >
                {simulating ? (
                  <HStack space="sm" className="items-center">
                    <ActivityIndicator color="white" />
                    <ButtonText>Running Simulation...</ButtonText>
                  </HStack>
                ) : (
                  <ButtonText>Run Simulation (1,000 iterations)</ButtonText>
                )}
              </Button>
            </VStack>
          </Card>
        </VStack>
      </ScrollView>
    );
  }

  // Display results
  return (
    <ScrollView className="flex-1 bg-white">
      <VStack space="lg" className="p-6">
        {/* Header */}
        <Card className="p-6 bg-gradient-to-r from-sky-50 to-blue-50">
          <VStack space="sm">
            <HStack className="justify-between items-start">
              <Heading size="lg">Simulation Results</Heading>
              <Badge className="bg-sky-600">
                <BadgeText className="text-white">
                  {results.totalIterations} iterations
                </BadgeText>
              </Badge>
            </HStack>
            <Text className="text-gray-600">
              Based on Monte Carlo analysis of race conditions
            </Text>
          </VStack>
        </Card>

        {/* Key Metrics */}
        <Card className="p-6">
          <VStack space="md">
            <Heading size="md">Expected Performance</Heading>

            <HStack className="flex-wrap gap-4">
              <Card className="flex-1 min-w-[140px] p-4 bg-green-50">
                <VStack space="xs">
                  <Text className="text-sm text-gray-600">Expected Finish</Text>
                  <Heading size="xl" className="text-green-700">
                    {results.expectedFinish.toFixed(1)}
                  </Heading>
                  <Text className="text-xs text-gray-500">
                    Median: {results.medianFinish}
                  </Text>
                </VStack>
              </Card>

              <Card className="flex-1 min-w-[140px] p-4 bg-blue-50">
                <VStack space="xs">
                  <Text className="text-sm text-gray-600">Podium Chance</Text>
                  <Heading size="xl" className="text-blue-700">
                    {(results.podiumProbability * 100).toFixed(0)}%
                  </Heading>
                  <Text className="text-xs text-gray-500">Top 3 finish</Text>
                </VStack>
              </Card>

              <Card className="flex-1 min-w-[140px] p-4 bg-amber-50">
                <VStack space="xs">
                  <Text className="text-sm text-gray-600">Win Chance</Text>
                  <Heading size="xl" className="text-amber-700">
                    {(results.winProbability * 100).toFixed(0)}%
                  </Heading>
                  <Text className="text-xs text-gray-500">1st place</Text>
                </VStack>
              </Card>
            </HStack>

            <Card className="p-4 bg-gray-50">
              <HStack className="justify-between">
                <Text className="text-sm text-gray-600">
                  95% Confidence Interval
                </Text>
                <Text className="font-semibold">
                  {results.confidenceInterval.lower} - {results.confidenceInterval.upper}
                </Text>
              </HStack>
            </Card>
          </VStack>
        </Card>

        {/* Position Distribution */}
        <Card className="p-6">
          <VStack space="md">
            <Heading size="md">Position Probability</Heading>

            <VStack space="sm">
              {Object.entries(results.positionDistribution)
                .slice(0, 10)
                .map(([position, probability]) => (
                  <HStack key={position} space="sm" className="items-center">
                    <Text className="w-8 text-right font-semibold">
                      {position}
                    </Text>
                    <View className="flex-1 h-8 bg-gray-100 rounded overflow-hidden">
                      <View
                        style={{
                          width: `${probability * 100}%`,
                          height: '100%',
                          backgroundColor:
                            Number(position) <= 3
                              ? '#22c55e'
                              : Number(position) <= 10
                              ? '#3b82f6'
                              : '#94a3b8',
                        }}
                      />
                    </View>
                    <Text className="w-12 text-right text-sm">
                      {(probability * 100).toFixed(1)}%
                    </Text>
                  </HStack>
                ))}
            </VStack>
          </VStack>
        </Card>

        {/* Success Factors */}
        <Card className="p-6">
          <VStack space="md">
            <Heading size="md">Success Factors</Heading>
            <Text className="text-sm text-gray-600">
              Ranked by impact on finish position
            </Text>

            <VStack space="sm">
              {results.successFactors.map((factor, index) => (
                <Card key={index} className="p-4 bg-gray-50">
                  <VStack space="xs">
                    <HStack className="justify-between items-center">
                      <Heading size="sm">{factor.factor}</Heading>
                      <Badge
                        className={
                          factor.impact > 0.3
                            ? 'bg-red-600'
                            : factor.impact > 0.15
                            ? 'bg-amber-600'
                            : 'bg-blue-600'
                        }
                      >
                        <BadgeText className="text-white">
                          {(factor.impact * 100).toFixed(0)}% impact
                        </BadgeText>
                      </Badge>
                    </HStack>
                    <Text className="text-sm text-gray-600">
                      {factor.description}
                    </Text>
                  </VStack>
                </Card>
              ))}
            </VStack>
          </VStack>
        </Card>

        {/* Alternative Strategies */}
        <Card className="p-6">
          <VStack space="md">
            <Heading size="md">Alternative Strategies</Heading>
            <Text className="text-sm text-gray-600">
              Compare different tactical approaches
            </Text>

            <VStack space="sm">
              {results.alternativeStrategies.map((strategy, index) => (
                <Card key={index} className="p-4 border border-gray-200">
                  <VStack space="sm">
                    <HStack className="justify-between items-start">
                      <VStack space="xs" className="flex-1">
                        <Heading size="sm">{strategy.name}</Heading>
                        <Text className="text-sm text-gray-600">
                          {strategy.description}
                        </Text>
                      </VStack>
                      <Badge
                        className={
                          strategy.riskLevel === 'high'
                            ? 'bg-red-100 border-red-600'
                            : strategy.riskLevel === 'medium'
                            ? 'bg-amber-100 border-amber-600'
                            : 'bg-green-100 border-green-600'
                        }
                      >
                        <BadgeText
                          className={
                            strategy.riskLevel === 'high'
                              ? 'text-red-700'
                              : strategy.riskLevel === 'medium'
                              ? 'text-amber-700'
                              : 'text-green-700'
                          }
                        >
                          {strategy.riskLevel.toUpperCase()} RISK
                        </BadgeText>
                      </Badge>
                    </HStack>

                    <HStack className="gap-4">
                      <VStack space="xs" className="flex-1">
                        <Text className="text-xs text-gray-500">
                          Expected Finish
                        </Text>
                        <Text className="font-semibold">
                          {strategy.expectedFinish.toFixed(1)}
                        </Text>
                      </VStack>
                      <VStack space="xs" className="flex-1">
                        <Text className="text-xs text-gray-500">
                          Podium Chance
                        </Text>
                        <Text className="font-semibold">
                          {(strategy.podiumProbability * 100).toFixed(0)}%
                        </Text>
                      </VStack>
                    </HStack>

                    {strategy.expectedFinish < results.expectedFinish && (
                      <Card className="p-2 bg-green-50 border border-green-200">
                        <Text className="text-sm text-green-700 text-center">
                          ↑ Improvement:{' '}
                          {(results.expectedFinish - strategy.expectedFinish).toFixed(1)}{' '}
                          positions
                        </Text>
                      </Card>
                    )}
                  </VStack>
                </Card>
              ))}
            </VStack>
          </VStack>
        </Card>

        {/* Actions */}
        <VStack space="sm">
          <Button
            variant="outline"
            onPress={runSimulation}
            disabled={simulating}
          >
            {simulating ? (
              <HStack space="sm" className="items-center">
                <ActivityIndicator color="#0284c7" />
                <ButtonText>Running...</ButtonText>
              </HStack>
            ) : (
              <ButtonText>Run New Simulation</ButtonText>
            )}
          </Button>

          <Button variant="outline" onPress={() => router.back()}>
            <ButtonText>Back to Strategy</ButtonText>
          </Button>
        </VStack>
      </VStack>
    </ScrollView>
  );
}
