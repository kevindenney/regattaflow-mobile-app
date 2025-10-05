/**
 * Results Card Component
 * Compact results display for dashboards
 * Universal component (Web + Mobile)
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { HStack } from '@/src/components/ui/hstack';
import { Card } from '@/src/components/ui/card';
import { Badge, BadgeText } from '@/src/components/ui/badge';
import { Button, ButtonText } from '@/src/components/ui/button';
import ResultsService from '@/src/services/ResultsService';
import { useRouter } from 'expo-router';

interface ResultsCardProps {
  regattaId: string;
  onViewFullResults?: () => void;
}

export function ResultsCard({ regattaId, onViewFullResults }: ResultsCardProps) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadSummary();
  }, [regattaId]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await ResultsService.getResultsSummary(regattaId);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load results summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFull = () => {
    if (onViewFullResults) {
      onViewFullResults();
    } else {
      // Navigate to results page
      router.push(`/regatta/${regattaId}/results`);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 m-4">
        <ActivityIndicator size="small" />
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  const progressPercent = Math.round(summary.progressPercentage);

  return (
    <Card className="m-4">
      <VStack space="md" className="p-6">
        {/* Header */}
        <HStack className="justify-between items-center">
          <Text className="text-lg font-bold">Series Standings</Text>
          <Badge
            variant={progressPercent === 100 ? 'solid' : 'outline'}
            action={progressPercent === 100 ? 'success' : 'info'}
          >
            <BadgeText>
              {summary.completedRaces}/{summary.totalRaces} Races
            </BadgeText>
          </Badge>
        </HStack>

        {/* Progress */}
        <View className="bg-gray-200 h-2 rounded-full overflow-hidden">
          <View
            className="bg-blue-500 h-full"
            style={{ width: `${progressPercent}%` }}
          />
        </View>

        {/* Top 5 Standings */}
        <VStack space="xs">
          <Text className="text-sm font-semibold text-gray-600 mb-2">
            Top Positions
          </Text>

          {summary.standings.map((standing: any) => (
            <HStack
              key={standing.entry.entry_id}
              className="justify-between items-center py-2 border-b border-gray-100"
            >
              <HStack space="md" className="items-center flex-1">
                {/* Rank */}
                <View className="w-8">
                  <Text className="font-bold text-center">
                    {standing.rank}
                    {standing.tied && 'T'}
                  </Text>
                </View>

                {/* Sail Number */}
                <View className="w-16">
                  <Text className="font-mono text-sm">
                    {standing.entry.sail_number}
                  </Text>
                </View>

                {/* Sailor Name */}
                <View className="flex-1">
                  <Text numberOfLines={1} className="text-sm">
                    {standing.entry.sailor_name}
                  </Text>
                  {standing.entry.club && (
                    <Text numberOfLines={1} className="text-xs text-gray-500">
                      {standing.entry.club}
                    </Text>
                  )}
                </View>
              </HStack>

              {/* Net Points */}
              <View className="w-16">
                <Text className="text-right font-semibold">
                  {standing.net_points.toFixed(1)}
                </Text>
                <Text className="text-xs text-gray-500 text-right">pts</Text>
              </View>
            </HStack>
          ))}
        </VStack>

        {/* Stats */}
        <HStack className="justify-around py-4 bg-gray-50 rounded-lg">
          <VStack className="items-center">
            <Text className="text-2xl font-bold">{summary.totalEntries}</Text>
            <Text className="text-xs text-gray-600">Entries</Text>
          </VStack>
          <VStack className="items-center">
            <Text className="text-2xl font-bold">{summary.completedRaces}</Text>
            <Text className="text-xs text-gray-600">Completed</Text>
          </VStack>
          <VStack className="items-center">
            <Text className="text-2xl font-bold">
              {summary.totalRaces - summary.completedRaces}
            </Text>
            <Text className="text-xs text-gray-600">Remaining</Text>
          </VStack>
        </HStack>

        {/* Actions */}
        <Button onPress={handleViewFull} variant="outline" size="sm">
          <ButtonText>View Full Standings</ButtonText>
        </Button>
      </VStack>
    </Card>
  );
}

export default ResultsCard;
