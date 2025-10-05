/**
 * Series Standings Component
 * Displays regatta series standings with RRS Appendix A scoring
 * Universal component (Web + Mobile)
 */

import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { HStack } from '@/src/components/ui/hstack';
import { Card } from '@/src/components/ui/card';
import { Button, ButtonText } from '@/src/components/ui/button';
import { SeriesStanding } from '@/src/services/scoring/ScoringEngine';
import ResultsService from '@/src/services/ResultsService';
import ResultsExportService from '@/src/services/results/ResultsExportService';

interface SeriesStandingsProps {
  regattaId: string;
  division?: string;
  showActions?: boolean;
  compact?: boolean;
}

export function SeriesStandings({
  regattaId,
  division,
  showActions = true,
  compact = false,
}: SeriesStandingsProps) {
  const [standings, setStandings] = useState<SeriesStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStandings();
  }, [regattaId, division]);

  const loadStandings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ResultsService.getStandings(regattaId, division);
      setStandings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load standings');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      await ResultsService.calculateStandings(regattaId, division);
      await loadStandings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recalculate');
    } finally {
      setRecalculating(false);
    }
  };

  const handlePublish = async () => {
    try {
      await ResultsService.publishResults(regattaId, {
        divisions: division ? [division] : undefined,
      });
      await loadStandings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish');
    }
  };

  const handleExport = async (format: 'csv' | 'pdf' | 'sailwave') => {
    try {
      const regatta = await ResultsService.getRegattaWithResults(regattaId);
      if (!regatta) throw new Error('Regatta not found');

      await ResultsExportService.exportAndDownload(regattaId, regatta.name, {
        format,
        includeRaceDetails: true,
        includeDiscards: true,
        includeTieBreakers: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-gray-600">Loading standings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <Card className="p-6 m-4 bg-red-50">
        <VStack space="md">
          <Text className="text-red-800 font-semibold">Error Loading Standings</Text>
          <Text className="text-red-600">{error}</Text>
          <Button onPress={loadStandings} variant="outline" size="sm">
            <ButtonText>Retry</ButtonText>
          </Button>
        </VStack>
      </Card>
    );
  }

  if (standings.length === 0) {
    return (
      <Card className="p-8 m-4">
        <VStack space="md" className="items-center">
          <Text className="text-gray-600 text-center">
            No standings available yet. Results will appear after races are completed and scored.
          </Text>
          {showActions && (
            <Button onPress={handleRecalculate} size="sm">
              <ButtonText>Calculate Standings</ButtonText>
            </Button>
          )}
        </VStack>
      </Card>
    );
  }

  // Get race numbers from first entry
  const raceNumbers = standings[0]?.race_scores.map(s => s.race_number) || [];

  return (
    <VStack space="md" className="flex-1">
      {/* Actions */}
      {showActions && (
        <Card className="p-4 m-4">
          <HStack space="md" className="flex-wrap">
            <Button
              onPress={handleRecalculate}
              variant="outline"
              size="sm"
              disabled={recalculating}
            >
              <ButtonText>
                {recalculating ? 'Recalculating...' : 'Recalculate'}
              </ButtonText>
            </Button>
            <Button onPress={handlePublish} size="sm">
              <ButtonText>Publish Results</ButtonText>
            </Button>
            <Button
              onPress={() => handleExport('csv')}
              variant="outline"
              size="sm"
            >
              <ButtonText>Export CSV</ButtonText>
            </Button>
            {Platform.OS === 'web' && (
              <Button
                onPress={() => handleExport('pdf')}
                variant="outline"
                size="sm"
              >
                <ButtonText>Export PDF</ButtonText>
              </Button>
            )}
            <Button
              onPress={() => handleExport('sailwave')}
              variant="outline"
              size="sm"
            >
              <ButtonText>Export Sailwave</ButtonText>
            </Button>
          </HStack>
        </Card>
      )}

      {/* Standings Table */}
      <Card className="m-4 overflow-hidden">
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <VStack space="xs">
            {/* Header */}
            <HStack className="bg-gray-100 border-b border-gray-300">
              <View className="w-16 p-3 border-r border-gray-300">
                <Text className="font-bold text-center">Rank</Text>
              </View>
              <View className="w-24 p-3 border-r border-gray-300">
                <Text className="font-bold text-center">Sail #</Text>
              </View>
              {!compact && (
                <>
                  <View className="w-48 p-3 border-r border-gray-300">
                    <Text className="font-bold">Name</Text>
                  </View>
                  <View className="w-32 p-3 border-r border-gray-300">
                    <Text className="font-bold">Club</Text>
                  </View>
                </>
              )}

              {/* Race columns */}
              {raceNumbers.map(num => (
                <View key={num} className="w-16 p-3 border-r border-gray-300">
                  <Text className="font-bold text-center">R{num}</Text>
                </View>
              ))}

              <View className="w-20 p-3 border-r border-gray-300">
                <Text className="font-bold text-center">Total</Text>
              </View>
              <View className="w-20 p-3">
                <Text className="font-bold text-center">Net</Text>
              </View>
            </HStack>

            {/* Data Rows */}
            <ScrollView showsVerticalScrollIndicator={true}>
              {standings.map((standing, idx) => (
                <HStack
                  key={standing.entry.entry_id}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  {/* Rank */}
                  <View className="w-16 p-3 border-r border-gray-200">
                    <Text className="text-center font-semibold">
                      {standing.rank}
                      {standing.tied && 'T'}
                    </Text>
                  </View>

                  {/* Sail Number */}
                  <View className="w-24 p-3 border-r border-gray-200">
                    <Text className="text-center font-mono">
                      {standing.entry.sail_number}
                    </Text>
                  </View>

                  {!compact && (
                    <>
                      {/* Sailor Name */}
                      <View className="w-48 p-3 border-r border-gray-200">
                        <Text numberOfLines={1}>
                          {standing.entry.sailor_name}
                        </Text>
                      </View>

                      {/* Club */}
                      <View className="w-32 p-3 border-r border-gray-200">
                        <Text numberOfLines={1} className="text-gray-600 text-sm">
                          {standing.entry.club || '-'}
                        </Text>
                      </View>
                    </>
                  )}

                  {/* Race Scores */}
                  {standing.race_scores.map(score => (
                    <View
                      key={score.race_number}
                      className="w-16 p-3 border-r border-gray-200"
                    >
                      <Text
                        className={`text-center ${
                          score.excluded ? 'text-gray-400 line-through' : ''
                        }`}
                      >
                        {score.excluded && '('}
                        {score.score_code || Math.round(score.points)}
                        {score.excluded && ')'}
                      </Text>
                    </View>
                  ))}

                  {/* Total Points */}
                  <View className="w-20 p-3 border-r border-gray-200">
                    <Text className="text-center text-gray-600">
                      {standing.total_points.toFixed(1)}
                    </Text>
                  </View>

                  {/* Net Points */}
                  <View className="w-20 p-3">
                    <Text className="text-center font-bold">
                      {standing.net_points.toFixed(1)}
                    </Text>
                  </View>
                </HStack>
              ))}
            </ScrollView>
          </VStack>
        </ScrollView>

        {/* Footer Notes */}
        <View className="p-4 bg-gray-50 border-t border-gray-300">
          <Text className="text-xs text-gray-600">
            Scoring: Low Point System (RRS Appendix A4) • Discards:{' '}
            {standings[0]?.discards_used || 0} • (Excluded scores shown in parentheses)
          </Text>
          {standings.some(s => s.tied) && (
            <Text className="text-xs text-gray-600 mt-1">
              T = Tied on points, separated by tie-breaking rules
            </Text>
          )}
        </View>
      </Card>
    </VStack>
  );
}

export default SeriesStandings;
