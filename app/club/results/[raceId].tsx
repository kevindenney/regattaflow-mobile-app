/**
 * Race Results Entry Screen
 * For race committees to enter finish times, penalties, and race results
 * Universal component (Web + Mobile)
 */

import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Card } from '@/components/ui/card';
import { Button, ButtonText } from '@/components/ui/button';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Input, InputField } from '@/components/ui/input';
import { Select, SelectTrigger, SelectInput, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox, CheckboxIndicator, CheckboxIcon, CheckboxLabel } from '@/components/ui/checkbox';
import { CheckIcon } from '@/components/ui/icon';
import { supabase } from '@/services/supabase';
import ResultsService from '@/services/ResultsService';
import { useClubWorkspace } from '@/hooks/useClubWorkspace';

type ScoreCode = 'DNC' | 'DNS' | 'DNF' | 'DSQ' | 'OCS' | 'RET' | 'RAF';

interface RaceEntry {
  id: string;
  entry_number: string;
  sail_number: string;
  entry_class: string;
  sailor: {
    full_name: string;
    club_name?: string;
  };
}

interface RaceResult {
  id?: string;
  entry_id: string;
  finish_time?: string;
  finish_position?: number;
  corrected_position?: number;
  status: string;
  time_penalty_minutes?: number;
  scoring_penalty?: number;
  score_code?: ScoreCode;
  notes?: string;
}

export default function RaceResultsEntryScreen() {
  const { raceId } = useLocalSearchParams<{ raceId: string }>();
  const router = useRouter();
  const { clubId, loading: personaLoading, refresh: refreshPersonaContext } = useClubWorkspace();

  const [race, setRace] = useState<any>(null);
  const [entries, setEntries] = useState<RaceEntry[]>([]);
  const [results, setResults] = useState<Map<string, RaceResult>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [startTime, setStartTime] = useState<string>('');
  const [useManualPositions, setUseManualPositions] = useState(false);

  useEffect(() => {
    if (raceId && clubId) {
      loadRaceData();
    }
  }, [raceId, clubId]);

  const loadRaceData = async () => {
    if (!raceId || !clubId) return;
    try {
      setLoading(true);

      // Get race details
      const { data: raceData, error: raceError } = await supabase
        .from('regatta_races')
        .select('*, regatta:regatta_id(name, venue)')
        .eq('id', raceId)
        .single();

      if (raceError) throw raceError;
      setRace(raceData);

      // Get race entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('race_entries')
        .select(`
          id,
          entry_number,
          sail_number,
          entry_class,
          sailor:sailor_id(full_name, club_name)
        `)
        .eq('regatta_id', raceData.regatta_id)
        .eq('status', 'confirmed')
        .order('entry_number');

      if (entriesError) throw entriesError;

      const normalizedEntries: RaceEntry[] = (entriesData || []).map((entry: any) => {
        const sailorRecord = Array.isArray(entry.sailor) ? entry.sailor[0] : entry.sailor;
        return {
          id: entry.id,
          entry_number: entry.entry_number ?? '',
          sail_number: entry.sail_number ?? '',
          entry_class: entry.entry_class ?? '',
          sailor: {
            full_name: sailorRecord?.full_name ?? 'Unknown Sailor',
            club_name: sailorRecord?.club_name ?? undefined,
          },
        };
      });

      setEntries(normalizedEntries);

      // Get existing results
      const { data: resultsData, error: resultsError } = await supabase
        .from('race_results')
        .select('*')
        .eq('regatta_id', raceData.regatta_id)
        .eq('race_number', raceData.race_number);

      if (resultsError) throw resultsError;

      // Build results map
      const resultsMap = new Map<string, RaceResult>();
      (resultsData || []).forEach(result => {
        resultsMap.set(result.entry_id, {
          id: result.id,
          entry_id: result.entry_id,
          finish_time: result.finish_time,
          finish_position: result.finish_position,
          corrected_position: result.corrected_position,
          status: result.status,
          time_penalty_minutes: result.time_penalty ? parseInt(result.time_penalty) / 60 : undefined,
          scoring_penalty: result.scoring_penalty,
          score_code: result.status.toUpperCase() as ScoreCode,
          notes: result.notes,
        });
      });

      setResults(resultsMap);

      // Set start time from race or first result
      if (raceData.start_time) {
        setStartTime(new Date(raceData.start_time).toISOString().slice(0, 16));
      }
    } catch (error) {
      console.error('Failed to load race data:', error);
      Alert.alert('Error', 'Failed to load race data');
    } finally {
      setLoading(false);
    }
  };

  const updateResult = (entryId: string, updates: Partial<RaceResult>) => {
    setResults(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(entryId) || {
        entry_id: entryId,
        status: 'racing',
      };
      newMap.set(entryId, { ...existing, ...updates });
      return newMap;
    });
  };

  const setFinishTime = (entryId: string, time: string) => {
    const trimmed = time.trim();

    if (!trimmed) {
      updateResult(entryId, {
        finish_time: undefined,
        status: 'racing',
      });
      return;
    }

    if (!startTime) {
      Alert.alert('Set Start Time', 'Please set the race start time first.');
      return;
    }

    const start = new Date(startTime);
    const finish = new Date(trimmed);

    if (Number.isNaN(start.getTime()) || Number.isNaN(finish.getTime())) {
      updateResult(entryId, {
        finish_time: trimmed,
      });
      return;
    }

    if (finish.getTime() < start.getTime()) {
      Alert.alert('Invalid Time', 'Finish time cannot be before the start time.');
      return;
    }

    updateResult(entryId, {
      finish_time: trimmed,
      status: 'finished',
      score_code: undefined,
    });
  };

  const setScoreCode = (entryId: string, code: ScoreCode | 'FINISHED') => {
    if (code === 'FINISHED') {
      updateResult(entryId, {
        status: 'finished',
        score_code: undefined,
      });
    } else {
      updateResult(entryId, {
        status: code.toLowerCase(),
        score_code: code,
        finish_time: undefined,
        finish_position: undefined,
      });
    }
  };

  const calculatePositions = () => {
    // Sort finishers by finish time
    const finishers = Array.from(results.entries())
      .filter(([_, r]) => r.status === 'finished' && r.finish_time)
      .sort((a, b) => {
        const timeA = new Date(a[1].finish_time!).getTime();
        const timeB = new Date(b[1].finish_time!).getTime();
        return timeA - timeB;
      });

    // Assign positions
    finishers.forEach(([entryId, result], index) => {
      updateResult(entryId, {
        finish_position: index + 1,
        corrected_position: index + 1, // TODO: Apply handicap correction
      });
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Calculate positions from times if not using manual positions
      if (!useManualPositions) {
        calculatePositions();
      }

      // Prepare results for save
      const resultsToSave = Array.from(results.entries()).map(([entryId, result]) => ({
        id: result.id,
        regatta_id: race.regatta_id,
        race_number: race.race_number,
        entry_id: entryId,
        start_time: startTime,
        finish_time: result.finish_time,
        finish_position: result.finish_position,
        corrected_position: result.corrected_position,
        status: result.status,
        time_penalty: result.time_penalty_minutes ? `${result.time_penalty_minutes} minutes` : null,
        scoring_penalty: result.scoring_penalty,
        notes: result.notes,
      }));

      // Upsert results
      const { error } = await supabase
        .from('race_results')
        .upsert(resultsToSave, {
          onConflict: 'regatta_id,race_number,entry_id',
        });

      if (error) throw error;

      // Update race start time
      if (startTime && race.start_time !== startTime) {
        await supabase
          .from('regatta_races')
          .update({ start_time: startTime })
          .eq('id', raceId);
      }

      // Mark race as completed
      await supabase
        .from('regatta_races')
        .update({ status: 'completed' })
        .eq('id', raceId);

      Alert.alert('Success', 'Results saved successfully');
      router.back();
    } catch (error) {
      console.error('Failed to save results:', error);
      Alert.alert('Error', 'Failed to save results');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (isoTime?: string) => {
    if (!isoTime) return '-';
    const date = new Date(isoTime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const calculateElapsed = (finishTime?: string) => {
    if (!finishTime || !startTime) return '-';
    const start = new Date(startTime);
    const finish = new Date(finishTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(finish.getTime())) {
      return '-';
    }

    const elapsed = Math.floor((finish.getTime() - start.getTime()) / 1000);

    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (personaLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!clubId) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-xl font-semibold text-gray-800 text-center mb-3">
          Connect Your Club Workspace
        </Text>
        <Text className="text-center text-gray-600 mb-6">
          Entering race results requires an active club connection. Finish onboarding or refresh your workspace to continue.
        </Text>
        <VStack space="sm" className="w-full max-w-xs">
          <Button onPress={refreshPersonaContext}>
            <ButtonText>Retry Connection</ButtonText>
          </Button>
          <Button variant="outline" onPress={() => router.push('/(auth)/club-onboarding-chat')}>
            <ButtonText>Open Club Onboarding</ButtonText>
          </Button>
        </VStack>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const scoreCodes: Array<{ label: string; value: ScoreCode | 'FINISHED' }> = [
    { label: 'Finished', value: 'FINISHED' },
    { label: 'DNS - Did Not Start', value: 'DNS' },
    { label: 'DNF - Did Not Finish', value: 'DNF' },
    { label: 'DSQ - Disqualified', value: 'DSQ' },
    { label: 'OCS - On Course Side', value: 'OCS' },
    { label: 'DNC - Did Not Compete', value: 'DNC' },
    { label: 'RET - Retired', value: 'RET' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <VStack space="md" className="p-4">
        {/* Header Card */}
        <Card className="p-6">
          <VStack space="md">
            <HStack className="justify-between items-center">
              <VStack space="xs">
                <Text className="text-2xl font-bold">
                  Race {race?.race_number} Results
                </Text>
                <Text className="text-gray-600">
                  {race?.regatta?.name} • {race?.regatta?.venue}
                </Text>
              </VStack>
              <Badge action="info" variant="solid">
                <BadgeText>{race?.status}</BadgeText>
              </Badge>
            </HStack>

            {/* Start Time */}
            <VStack space="sm">
              <Text className="font-semibold">Race Start Time</Text>
              <Input>
                <InputField
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="YYYY-MM-DDTHH:MM"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType={Platform.select({
                    ios: 'numbers-and-punctuation',
                    android: 'numbers-and-punctuation',
                    default: 'default',
                  })}
                />
              </Input>
            </VStack>

            {/* Options */}
            <HStack space="md" className="items-center">
              <Checkbox
                value="manual"
                isChecked={useManualPositions}
                onChange={setUseManualPositions}
              >
                <CheckboxIndicator>
                  <CheckboxIcon as={CheckIcon} />
                </CheckboxIndicator>
                <CheckboxLabel>Manual positions (override time calc)</CheckboxLabel>
              </Checkbox>
            </HStack>
          </VStack>
        </Card>

        {/* Results Entry Table */}
        <Card>
          <VStack space="xs">
            {/* Table Header */}
            <View className="p-4 bg-gray-100 border-b border-gray-300">
              <HStack className="gap-2">
                <Text className="font-bold w-16">Sail #</Text>
                <Text className="font-bold flex-1">Sailor</Text>
                <Text className="font-bold w-24">Status</Text>
                <Text className="font-bold w-32">Finish Time</Text>
                <Text className="font-bold w-20">Elapsed</Text>
                {useManualPositions && <Text className="font-bold w-16">Pos</Text>}
              </HStack>
            </View>

            {/* Table Rows */}
            {entries.map(entry => {
              const result = results.get(entry.id);
              const isFinished = result?.status === 'finished';

              return (
                <View
                  key={entry.id}
                  className="p-4 border-b border-gray-200"
                >
                  <VStack space="md">
                    {/* Row Header (Mobile) */}
                    <HStack className="gap-2 items-center">
                      <View className="w-16">
                        <Badge variant="outline">
                          <BadgeText>{entry.sail_number}</BadgeText>
                        </Badge>
                      </View>
                      <VStack className="flex-1">
                        <Text className="font-semibold">{entry.sailor?.full_name}</Text>
                        {entry.sailor?.club_name && (
                          <Text className="text-sm text-gray-600">{entry.sailor.club_name}</Text>
                        )}
                      </VStack>
                    </HStack>

                    {/* Result Entry Fields */}
                    <VStack space="sm">
                      {/* Status Selection */}
                      <HStack space="sm" className="items-center">
                        <Text className="w-20 text-sm text-gray-600">Status:</Text>
                        <Select
                          selectedValue={result?.score_code || (isFinished ? 'FINISHED' : '')}
                          onValueChange={(value) => setScoreCode(entry.id, value as ScoreCode | 'FINISHED')}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectInput placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {scoreCodes.map(code => (
                              <SelectItem key={code.value} label={code.label} value={code.value} />
                            ))}
                          </SelectContent>
                        </Select>
                      </HStack>

                      {/* Finish Time (only if finished) */}
                      {isFinished && (
                        <HStack space="sm" className="items-center">
                          <Text className="w-20 text-sm text-gray-600">Finish:</Text>
                          <Input className="flex-1">
                          <InputField
                            value={result?.finish_time || ''}
                            onChangeText={(value) => setFinishTime(entry.id, value)}
                            placeholder="YYYY-MM-DDTHH:MM"
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType={Platform.select({
                              ios: 'numbers-and-punctuation',
                              android: 'numbers-and-punctuation',
                              default: 'default',
                            })}
                          />
                          </Input>
                          <Text className="w-20 text-sm font-mono">
                            {calculateElapsed(result?.finish_time)}
                          </Text>
                        </HStack>
                      )}

                      {/* Manual Position (if enabled) */}
                      {useManualPositions && isFinished && (
                        <HStack space="sm" className="items-center">
                          <Text className="w-20 text-sm text-gray-600">Position:</Text>
                          <Input className="w-24">
                          <InputField
                            value={result?.finish_position?.toString() || ''}
                            onChangeText={(value) =>
                              updateResult(entry.id, {
                                finish_position: parseInt(value, 10) || undefined,
                                corrected_position: parseInt(value, 10) || undefined,
                              })
                            }
                            placeholder="Pos"
                            keyboardType="numeric"
                          />
                          </Input>
                        </HStack>
                      )}

                      {/* Penalties */}
                      <HStack space="sm" className="items-center">
                        <Text className="w-20 text-sm text-gray-600">Penalty:</Text>
                        <Input className="w-32">
                          <InputField
                            value={result?.time_penalty_minutes?.toString() || ''}
                            onChangeText={(value) =>
                              updateResult(entry.id, {
                                time_penalty_minutes: parseFloat(value) || undefined,
                              })
                            }
                            placeholder="Minutes"
                            keyboardType={Platform.select({
                              ios: 'decimal-pad',
                              android: 'decimal-pad',
                              default: 'numeric',
                            })}
                          />
                        </Input>
                        <Input className="w-32">
                          <InputField
                            value={result?.scoring_penalty?.toString() || ''}
                            onChangeText={(value) =>
                              updateResult(entry.id, {
                                scoring_penalty: parseInt(value, 10) || undefined,
                              })
                            }
                            placeholder="Points"
                            keyboardType="numeric"
                          />
                        </Input>
                      </HStack>

                      {/* Notes */}
                      <HStack space="sm" className="items-start">
                        <Text className="w-20 text-sm text-gray-600 pt-2">Notes:</Text>
                        <Input className="flex-1">
                          <InputField
                            value={result?.notes || ''}
                            onChangeText={(value) => updateResult(entry.id, { notes: value })}
                            placeholder="Optional notes"
                            multiline
                            numberOfLines={2}
                          />
                        </Input>
                      </HStack>
                    </VStack>
                  </VStack>
                </View>
              );
            })}
          </VStack>
        </Card>

        {/* Action Buttons */}
        <HStack space="md" className="pb-8">
          <Button
            variant="outline"
            onPress={() => router.back()}
            className="flex-1"
          >
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button
            action="positive"
            onPress={handleSave}
            disabled={saving || !startTime}
            className="flex-1"
          >
            <ButtonText>
              {saving ? 'Saving...' : 'Save Results'}
            </ButtonText>
          </Button>
        </HStack>

        {/* Instructions */}
        <Card className="p-4 bg-blue-50">
          <VStack space="sm">
            <Text className="font-semibold text-blue-900">
              Quick Start Guide
            </Text>
            <Text className="text-sm text-blue-800">
              1. Set the race start time{'\n'}
              2. For each boat, select their status (Finished, DNS, DNF, etc.){'\n'}
              3. For finishers, enter their finish time{'\n'}
              4. Add penalties if applicable (time or points){'\n'}
              5. Positions will be calculated automatically (or enter manually){'\n'}
              6. Save to store results and mark race as complete
            </Text>
          </VStack>
        </Card>
      </VStack>
    </ScrollView>
  );
}
