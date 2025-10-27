/**
 * Results Management Dashboard
 * Main screen for race committees to manage series results
 * Universal component (Web + Mobile)
 */

import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Card } from '@/components/ui/card';
import { Button, ButtonText } from '@/components/ui/button';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Divider } from '@/components/ui/divider';
import { ResultsApprovalPanel } from '@/components/results/ResultsApprovalPanel';
import { SeriesStandings } from '@/components/results/SeriesStandings';
import ResultsService from '@/services/ResultsService';
import ResultsExportService from '@/services/results/ResultsExportService';

type TabType = 'approval' | 'standings' | 'export';

export default function ResultsManagementScreen() {
  const router = useRouter();
  const { regattaId } = useLocalSearchParams<{ regattaId: string }>();

  const [activeTab, setActiveTab] = useState<TabType>('approval');
  const [regatta, setRegatta] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<any>(null);

  useEffect(() => {
    if (regattaId) {
      loadData();
    }
  }, [regattaId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [regattaData, summaryData] = await Promise.all([
        ResultsService.getRegattaWithResults(regattaId!),
        ResultsService.getResultsSummary(regattaId!),
      ]);
      setRegatta(regattaData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateResults = async () => {
    try {
      setValidating(true);
      const result = await ResultsExportService.validateResults(regattaId!);
      setValidation(result);
    } catch (error) {
      console.error('Failed to validate:', error);
    } finally {
      setValidating(false);
    }
  };

  const handlePublishWithValidation = async () => {
    const result = await ResultsExportService.validateResults(regattaId!);

    if (!result.valid) {
      alert(`Cannot publish results:\n\n${result.errors.join('\n')}`);
      setValidation(result);
      return;
    }

    if (result.warnings.length > 0) {
      const proceed = confirm(
        `Warnings detected:\n\n${result.warnings.join('\n')}\n\nContinue with publishing?`
      );
      if (!proceed) return;
    }

    try {
      await ResultsService.publishResults(regattaId!, {
        notifyParticipants: true,
      });
      await loadData();
      alert('Results published successfully!');
    } catch (error) {
      alert('Failed to publish results');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!regatta) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-gray-600">Regatta not found</Text>
        <Button onPress={() => router.back()} className="mt-4">
          <ButtonText>Go Back</ButtonText>
        </Button>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <VStack space="md" className="p-4">
        {/* Header Card */}
        <Card className="p-6">
          <VStack space="md">
            <HStack className="justify-between items-start">
              <VStack space="xs" className="flex-1">
                <Text className="text-2xl font-bold">{regatta.name}</Text>
                <Text className="text-gray-600">{regatta.venue}</Text>
                <Text className="text-sm text-gray-500">
                  {new Date(regatta.start_date).toLocaleDateString()} -{' '}
                  {new Date(regatta.end_date).toLocaleDateString()}
                </Text>
              </VStack>
              {regatta.results_published && (
                <Badge action="success" variant="solid">
                  <BadgeText>Published</BadgeText>
                </Badge>
              )}
            </HStack>

            <Divider />

            {/* Summary Stats */}
            <HStack className="justify-around">
              <VStack className="items-center">
                <Text className="text-3xl font-bold text-blue-600">
                  {summary?.completedRaces || 0}/{summary?.totalRaces || 0}
                </Text>
                <Text className="text-sm text-gray-600">Races</Text>
              </VStack>
              <VStack className="items-center">
                <Text className="text-3xl font-bold text-green-600">
                  {summary?.totalEntries || 0}
                </Text>
                <Text className="text-sm text-gray-600">Entries</Text>
              </VStack>
              <VStack className="items-center">
                <Text className="text-3xl font-bold text-purple-600">
                  {summary?.progressPercentage.toFixed(0) || 0}%
                </Text>
                <Text className="text-sm text-gray-600">Complete</Text>
              </VStack>
            </HStack>

            {/* Quick Actions */}
            <Divider />
            <HStack space="md" className="flex-wrap">
              <Button
                onPress={handleValidateResults}
                variant="outline"
                size="sm"
                disabled={validating}
              >
                <ButtonText>
                  {validating ? 'Validating...' : 'Validate Results'}
                </ButtonText>
              </Button>
              {!regatta.results_published && (
                <Button
                  onPress={handlePublishWithValidation}
                  action="positive"
                  size="sm"
                >
                  <ButtonText>Publish Results</ButtonText>
                </Button>
              )}
            </HStack>

            {/* Validation Results */}
            {validation && (
              <Card className={`p-4 ${validation.valid ? 'bg-green-50' : 'bg-red-50'}`}>
                <VStack space="sm">
                  <Text className={`font-semibold ${validation.valid ? 'text-green-900' : 'text-red-900'}`}>
                    {validation.valid ? '✓ Results Valid' : '✗ Validation Failed'}
                  </Text>
                  {validation.errors.length > 0 && (
                    <VStack space="xs">
                      <Text className="text-sm font-semibold text-red-800">Errors:</Text>
                      {validation.errors.map((err: string, idx: number) => (
                        <Text key={idx} className="text-sm text-red-700">• {err}</Text>
                      ))}
                    </VStack>
                  )}
                  {validation.warnings.length > 0 && (
                    <VStack space="xs">
                      <Text className="text-sm font-semibold text-yellow-800">Warnings:</Text>
                      {validation.warnings.map((warn: string, idx: number) => (
                        <Text key={idx} className="text-sm text-yellow-700">• {warn}</Text>
                      ))}
                    </VStack>
                  )}
                </VStack>
              </Card>
            )}
          </VStack>
        </Card>

        {/* Tab Navigation */}
        <Card className="p-2">
          <HStack space="xs">
            <Button
              onPress={() => setActiveTab('approval')}
              variant={activeTab === 'approval' ? 'solid' : 'outline'}
              size="sm"
              className="flex-1"
            >
              <ButtonText>Race Approval</ButtonText>
            </Button>
            <Button
              onPress={() => setActiveTab('standings')}
              variant={activeTab === 'standings' ? 'solid' : 'outline'}
              size="sm"
              className="flex-1"
            >
              <ButtonText>Standings</ButtonText>
            </Button>
            <Button
              onPress={() => setActiveTab('export')}
              variant={activeTab === 'export' ? 'solid' : 'outline'}
              size="sm"
              className="flex-1"
            >
              <ButtonText>Export</ButtonText>
            </Button>
          </HStack>
        </Card>

        {/* Tab Content */}
        {activeTab === 'approval' && (
          <ResultsApprovalPanel regattaId={regattaId!} />
        )}

        {activeTab === 'standings' && (
          <SeriesStandings regattaId={regattaId!} showActions={true} />
        )}

        {activeTab === 'export' && (
          <Card className="p-6">
            <VStack space="md">
              <Text className="text-xl font-bold">Export Results</Text>
              <Text className="text-gray-600">
                Download results in various formats for sharing and archiving
              </Text>

              <Divider />

              <VStack space="sm">
                <Text className="font-semibold">Available Formats:</Text>

                <Button
                  onPress={async () => {
                    await ResultsExportService.exportAndDownload(regattaId!, regatta.name, {
                      format: 'csv',
                      includeRaceDetails: true,
                      includeDiscards: true,
                      includeTieBreakers: true,
                    });
                  }}
                  variant="outline"
                >
                  <ButtonText>📊 Export CSV (Excel Compatible)</ButtonText>
                </Button>

                <Button
                  onPress={async () => {
                    await ResultsExportService.exportAndDownload(regattaId!, regatta.name, {
                      format: 'pdf',
                      includeRaceDetails: true,
                      includeDiscards: true,
                      includeTieBreakers: true,
                    });
                  }}
                  variant="outline"
                >
                  <ButtonText>📄 Export PDF (Print/Share)</ButtonText>
                </Button>

                <Button
                  onPress={async () => {
                    await ResultsExportService.exportAndDownload(regattaId!, regatta.name, {
                      format: 'sailwave',
                      includeRaceDetails: true,
                    });
                  }}
                  variant="outline"
                >
                  <ButtonText>⛵ Export Sailwave (.blw)</ButtonText>
                </Button>
              </VStack>

              <Divider />

              <Card className="p-4 bg-blue-50">
                <VStack space="sm">
                  <Text className="font-semibold text-blue-900">Export Tips</Text>
                  <Text className="text-sm text-blue-800">
                    • CSV format works with Excel, Google Sheets, and other spreadsheet software{'\n'}
                    • PDF format is best for printing or sharing via email{'\n'}
                    • Sailwave format allows import into Sailwave scoring software{'\n'}
                    • All formats include race details, discards, and tie-breakers
                  </Text>
                </VStack>
              </Card>
            </VStack>
          </Card>
        )}

        {/* Help Card */}
        <Card className="p-4 bg-gray-100">
          <VStack space="sm">
            <Text className="font-semibold">Results Workflow</Text>
            <Text className="text-sm text-gray-700">
              1. Enter race results for each race{'\n'}
              2. Review and approve individual race results{'\n'}
              3. Validate all results before publishing{'\n'}
              4. Publish to make results visible to sailors{'\n'}
              5. Export results in your preferred format
            </Text>
          </VStack>
        </Card>
      </VStack>
    </ScrollView>
  );
}
