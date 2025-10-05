/**
 * Results Approval Panel
 * Interface for race committees to approve and publish results
 * Universal component (Web + Mobile)
 */

import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { HStack } from '@/src/components/ui/hstack';
import { Card } from '@/src/components/ui/card';
import { Button, ButtonText } from '@/src/components/ui/button';
import { Badge, BadgeText } from '@/src/components/ui/badge';
import { Checkbox, CheckboxIndicator, CheckboxLabel } from '@/src/components/ui/checkbox';
import ResultsService from '@/src/services/ResultsService';

interface ResultsApprovalPanelProps {
  regattaId: string;
}

export function ResultsApprovalPanel({ regattaId }: ResultsApprovalPanelProps) {
  const [races, setRaces] = useState<any[]>([]);
  const [regatta, setRegatta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    loadData();
  }, [regattaId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [racesData, regattaData] = await Promise.all([
        ResultsService.getRaces(regattaId),
        ResultsService.getRegattaWithResults(regattaId),
      ]);
      setRaces(racesData);
      setRegatta(regattaData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRace = async (raceNumber: number) => {
    try {
      setApproving(raceNumber);
      await ResultsService.approveRaceResults(regattaId, raceNumber);
      await loadData();
    } catch (err) {
      console.error('Failed to approve race:', err);
    } finally {
      setApproving(null);
    }
  };

  const handlePublishResults = async () => {
    try {
      setPublishing(true);
      await ResultsService.publishResults(regattaId, {
        notifyParticipants: true,
      });
      await loadData();
    } catch (err) {
      console.error('Failed to publish results:', err);
    } finally {
      setPublishing(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      await ResultsService.calculateStandings(regattaId);
      await loadData();
    } catch (err) {
      console.error('Failed to recalculate:', err);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 m-4">
        <ActivityIndicator size="large" />
      </Card>
    );
  }

  const approvedRaces = races.filter(r => r.results_approved).length;
  const completedRaces = races.filter(r => r.status === 'completed').length;
  const allApproved = completedRaces > 0 && approvedRaces === completedRaces;

  return (
    <VStack space="md" className="p-4">
      {/* Header Card */}
      <Card className="p-6">
        <VStack space="md">
          <HStack className="justify-between items-center">
            <Text className="text-xl font-bold">Results Approval</Text>
            {regatta?.results_published && (
              <Badge action="success" variant="solid">
                <BadgeText>Published</BadgeText>
              </Badge>
            )}
          </HStack>

          {/* Progress */}
          <VStack space="sm">
            <HStack className="justify-between">
              <Text className="text-sm text-gray-600">
                Race Approval Progress
              </Text>
              <Text className="text-sm font-semibold">
                {approvedRaces}/{completedRaces} Approved
              </Text>
            </HStack>
            <View className="bg-gray-200 h-2 rounded-full overflow-hidden">
              <View
                className={`h-full ${allApproved ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{
                  width: completedRaces > 0
                    ? `${(approvedRaces / completedRaces) * 100}%`
                    : '0%',
                }}
              />
            </View>
          </VStack>

          {/* Actions */}
          {allApproved && !regatta?.results_published && (
            <Button
              onPress={handlePublishResults}
              disabled={publishing}
              action="positive"
            >
              <ButtonText>
                {publishing ? 'Publishing...' : 'Publish Results & Notify Sailors'}
              </ButtonText>
            </Button>
          )}

          {regatta?.results_published && (
            <HStack space="md">
              <Button onPress={handleRecalculate} variant="outline" size="sm">
                <ButtonText>Recalculate</ButtonText>
              </Button>
              <Button
                onPress={async () => {
                  const csv = await ResultsService.exportResults(regattaId, 'csv');
                  // Handle download
                }}
                variant="outline"
                size="sm"
              >
                <ButtonText>Export CSV</ButtonText>
              </Button>
            </HStack>
          )}
        </VStack>
      </Card>

      {/* Race List */}
      <Card>
        <VStack space="xs">
          {/* Header */}
          <View className="p-4 bg-gray-100 border-b border-gray-300">
            <Text className="font-bold">Races Requiring Approval</Text>
          </View>

          {/* Race Items */}
          <ScrollView>
            {races.map((race) => (
              <View
                key={race.id}
                className="p-4 border-b border-gray-200"
              >
                <HStack className="justify-between items-center">
                  <VStack space="xs" className="flex-1">
                    <HStack space="md" className="items-center">
                      <Text className="font-semibold">
                        Race {race.race_number}
                      </Text>
                      <Badge
                        variant="outline"
                        action={
                          race.status === 'completed'
                            ? race.results_approved
                              ? 'success'
                              : 'warning'
                            : 'muted'
                        }
                      >
                        <BadgeText>
                          {race.status === 'completed'
                            ? race.results_approved
                              ? 'Approved'
                              : 'Pending Approval'
                            : race.status}
                        </BadgeText>
                      </Badge>
                    </HStack>

                    {race.race_date && (
                      <Text className="text-sm text-gray-600">
                        {new Date(race.race_date).toLocaleDateString()}
                      </Text>
                    )}

                    {race.results_approved && race.results_approved_at && (
                      <Text className="text-xs text-gray-500">
                        Approved {new Date(race.results_approved_at).toLocaleString()}
                      </Text>
                    )}
                  </VStack>

                  {/* Actions */}
                  {race.status === 'completed' && !race.results_approved && (
                    <Button
                      onPress={() => handleApproveRace(race.race_number)}
                      disabled={approving === race.race_number}
                      size="sm"
                      action="positive"
                    >
                      <ButtonText>
                        {approving === race.race_number ? 'Approving...' : 'Approve'}
                      </ButtonText>
                    </Button>
                  )}

                  {race.results_approved && (
                    <View className="w-8 h-8 bg-green-500 rounded-full items-center justify-center">
                      <Text className="text-white font-bold">✓</Text>
                    </View>
                  )}
                </HStack>
              </View>
            ))}

            {races.length === 0 && (
              <View className="p-8">
                <Text className="text-center text-gray-600">
                  No races scheduled yet
                </Text>
              </View>
            )}
          </ScrollView>
        </VStack>
      </Card>

      {/* Instructions */}
      <Card className="p-4 bg-blue-50">
        <VStack space="sm">
          <Text className="font-semibold text-blue-900">
            Approval Workflow
          </Text>
          <Text className="text-sm text-blue-800">
            1. Complete and verify race results{'\n'}
            2. Approve each race individually{'\n'}
            3. Once all races are approved, publish the series standings{'\n'}
            4. Sailors will be notified via email
          </Text>
        </VStack>
      </Card>
    </VStack>
  );
}

export default ResultsApprovalPanel;
