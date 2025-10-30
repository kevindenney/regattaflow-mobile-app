/**
 * Calendar Import Flow Component
 * Wizard-style flow for importing sailing calendars from CSV
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Calendar, Upload, CheckCircle, XCircle, AlertTriangle } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { CalendarImportService, CalendarRace } from '@/services/CalendarImportService';
import { BulkRaceCreationService } from '@/services/BulkRaceCreationService';
import { createLogger } from '@/lib/utils/logger';

interface CalendarImportFlowProps {
  onComplete: (createdCount: number) => void;
  onCancel: () => void;
  boatId?: string;
  defaultVenue?: string;
}

type Step = 'upload' | 'preview' | 'importing' | 'complete';

const logger = createLogger('CalendarImportFlow');
export function CalendarImportFlow({
  onComplete,
  onCancel,
  boatId,
  defaultVenue
}: CalendarImportFlowProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('upload');
  const [loading, setLoading] = useState(false);

  // Upload state
  const [fileName, setFileName] = useState('');

  // Preview state
  const [parsedRaces, setParsedRaces] = useState<CalendarRace[]>([]);
  const [skippedEntries, setSkippedEntries] = useState<any[]>([]);
  const [willCreate, setWillCreate] = useState<CalendarRace[]>([]);
  const [willSkip, setWillSkip] = useState<any[]>([]);

  // Import result state
  const [importResult, setImportResult] = useState<any>(null);

  const handleFileUpload = async () => {
    try {
      setLoading(true);

      // Pick CSV file
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        Alert.alert('Error', 'No file was selected');
        setLoading(false);
        return;
      }

      const file = result.assets[0];
      setFileName(file.name);

      logger.debug('[CalendarImportFlow] Reading CSV file:', file.name);

      // Read file content
      let csvContent: string;
      if (Platform.OS === 'web') {
        // Web: fetch the blob and read as text
        const response = await fetch(file.uri);
        const blob = await response.blob();
        csvContent = await blob.text();
      } else {
        // Native: read as string
        csvContent = await FileSystem.readAsStringAsync(file.uri);
      }

      logger.debug('[CalendarImportFlow] CSV content length:', csvContent.length);

      // Parse CSV
      const parseResult = CalendarImportService.parseCSV(csvContent);

      if (!parseResult.success) {
        Alert.alert('Parse Error', parseResult.error || 'Failed to parse CSV file');
        setLoading(false);
        return;
      }

      logger.debug(`[CalendarImportFlow] Parsed ${parseResult.races.length} races`);

      // Validate races
      const validation = CalendarImportService.validateRaces(parseResult.races);
      logger.debug(`[CalendarImportFlow] ${validation.valid.length} valid, ${validation.invalid.length} invalid`);

      setParsedRaces(validation.valid);
      setSkippedEntries([
        ...parseResult.skipped,
        ...validation.invalid.map(inv => ({
          row: 0,
          reason: inv.reason,
          data: { subject: inv.race.subject, startDate: inv.race.startDate }
        }))
      ]);

      // Preview what will be created
      if (!user) {
        Alert.alert('Error', 'You must be logged in to import races');
        setLoading(false);
        return;
      }

      const preview = await BulkRaceCreationService.previewImport(validation.valid, {
        userId: user.id,
        boatId,
        defaultVenue,
        skipExisting: true
      });

      setWillCreate(preview.willCreate);
      setWillSkip(preview.willSkip);

      setStep('preview');
      setLoading(false);

    } catch (error: any) {
      console.error('[CalendarImportFlow] Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload file');
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    try {
      setLoading(true);
      setStep('importing');

      logger.debug(`[CalendarImportFlow] Importing ${willCreate.length} races...`);

      const result = await BulkRaceCreationService.createRacesFromCalendar(willCreate, {
        userId: user.id,
        boatId,
        defaultVenue,
        skipExisting: true
      });

      logger.debug('[CalendarImportFlow] Import complete:', result);

      setImportResult(result);
      setStep('complete');
      setLoading(false);

    } catch (error: any) {
      console.error('[CalendarImportFlow] Import error:', error);
      Alert.alert('Import Error', error.message || 'Failed to import races');
      setLoading(false);
      setStep('preview'); // Go back to preview
    }
  };

  // Upload Step
  if (step === 'upload') {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="bg-sky-600 pt-12 pb-6 px-4">
          <Text className="text-white text-2xl font-bold">Import Race Calendar</Text>
          <Text className="text-white/90 text-sm mt-1">
            Upload a CSV file with your race schedule
          </Text>
        </View>

        <ScrollView className="flex-1 px-4 py-6">
          {/* Instructions */}
          <View className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Calendar size={20} color="#1e40af" />
              <Text className="text-lg font-bold text-blue-900">CSV Format</Text>
            </View>
            <Text className="text-sm text-blue-800 mb-2">
              Your CSV file should have these columns:
            </Text>
            <View className="bg-white rounded-lg p-3 mb-2">
              <Text className="text-xs font-mono text-gray-800">
                Subject, Start Date, Location, All Day Event, Private
              </Text>
            </View>
            <Text className="text-xs text-blue-700 mt-2">
              Example from RHKYC Dragon calendar:{'\n'}
              Croucher 3 & 4,19/10/2025,Port Shelter,TRUE,FALSE
            </Text>
          </View>

          {/* Upload Button */}
          <Pressable
            onPress={handleFileUpload}
            disabled={loading}
            className={`flex-row items-center justify-center gap-2 py-4 px-4 rounded-xl mb-4 ${
              loading ? 'bg-gray-300' : 'bg-sky-600'
            }`}
          >
            {loading ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-semibold text-base">Processing...</Text>
              </>
            ) : (
              <>
                <Upload size={20} color="white" />
                <Text className="text-white font-semibold text-base">Upload CSV File</Text>
              </>
            )}
          </Pressable>

          {/* What will happen */}
          <View className="bg-gray-100 rounded-lg p-4">
            <Text className="text-sm font-semibold text-gray-900 mb-2">
              What happens next:
            </Text>
            <Text className="text-sm text-gray-700 leading-relaxed">
              1. We'll parse your CSV and validate all races{'\n'}
              2. You'll see a preview of what will be imported{'\n'}
              3. Confirm to create all races at once{'\n'}
              4. Existing races will be skipped automatically
            </Text>
          </View>

          {/* Cancel Button */}
          <Pressable
            onPress={onCancel}
            className="mt-6 py-3 items-center"
          >
            <Text className="text-gray-600 font-semibold">Cancel</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // Preview Step
  if (step === 'preview') {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="bg-sky-600 pt-12 pb-6 px-4">
          <Text className="text-white text-2xl font-bold">Import Preview</Text>
          <Text className="text-white/90 text-sm mt-1">{fileName}</Text>
        </View>

        <ScrollView className="flex-1 px-4 py-6">
          {/* Summary */}
          <View className="bg-white border-2 border-sky-200 rounded-xl p-4 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Import Summary</Text>

            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 bg-green-500 rounded-full" />
                <Text className="text-sm text-gray-700">Will Create</Text>
              </View>
              <Text className="text-lg font-bold text-green-600">{willCreate.length}</Text>
            </View>

            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 bg-yellow-500 rounded-full" />
                <Text className="text-sm text-gray-700">Will Skip (Already exist)</Text>
              </View>
              <Text className="text-lg font-bold text-yellow-600">{willSkip.length}</Text>
            </View>

            {skippedEntries.length > 0 && (
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 bg-gray-400 rounded-full" />
                  <Text className="text-sm text-gray-700">Invalid/Skipped</Text>
                </View>
                <Text className="text-lg font-bold text-gray-600">{skippedEntries.length}</Text>
              </View>
            )}
          </View>

          {/* Races to Create */}
          {willCreate.length > 0 && (
            <View className="mb-6">
              <Text className="text-base font-bold text-gray-900 mb-3">
                Races to Create ({willCreate.length})
              </Text>
              {willCreate.slice(0, 10).map((race, idx) => (
                <View key={idx} className="bg-white border border-green-200 rounded-lg p-3 mb-2">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-2">
                      <Text className="text-sm font-semibold text-gray-900">{race.subject}</Text>
                      <Text className="text-xs text-gray-600 mt-1">
                        📅 {race.startDate} {race.location && `• 📍 ${race.location}`}
                      </Text>
                    </View>
                    <CheckCircle size={16} color="#22c55e" />
                  </View>
                </View>
              ))}
              {willCreate.length > 10 && (
                <Text className="text-sm text-gray-600 text-center mt-2">
                  ... and {willCreate.length - 10} more races
                </Text>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row gap-3 mt-6 mb-8">
            <Pressable
              onPress={() => setStep('upload')}
              className="flex-1 bg-gray-300 py-4 rounded-xl items-center justify-center"
            >
              <Text className="text-gray-700 font-semibold text-base">Back</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirmImport}
              disabled={loading || willCreate.length === 0}
              className={`flex-1 py-4 rounded-xl items-center justify-center ${
                loading || willCreate.length === 0 ? 'bg-gray-400' : 'bg-sky-600'
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Import {willCreate.length} Race{willCreate.length !== 1 ? 's' : ''}
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Importing Step
  if (step === 'importing') {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#0284c7" />
        <Text className="text-lg font-semibold text-gray-900 mt-4">
          Importing {willCreate.length} races...
        </Text>
        <Text className="text-sm text-gray-600 mt-2">
          This may take a moment
        </Text>
      </View>
    );
  }

  // Complete Step
  if (step === 'complete' && importResult) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="bg-green-600 pt-12 pb-6 px-4">
          <Text className="text-white text-2xl font-bold">Import Complete!</Text>
          <Text className="text-white/90 text-sm mt-1">
            Your races have been imported
          </Text>
        </View>

        <ScrollView className="flex-1 px-4 py-6">
          {/* Results Summary */}
          <View className="bg-white border-2 border-green-200 rounded-xl p-4 mb-6">
            <View className="flex-row items-center gap-2 mb-4">
              <CheckCircle size={24} color="#22c55e" />
              <Text className="text-lg font-bold text-gray-900">Import Results</Text>
            </View>

            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm text-gray-700">Created</Text>
              <Text className="text-lg font-bold text-green-600">{importResult.created}</Text>
            </View>

            {importResult.skipped > 0 && (
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm text-gray-700">Skipped</Text>
                <Text className="text-lg font-bold text-yellow-600">{importResult.skipped}</Text>
              </View>
            )}

            {importResult.failed > 0 && (
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-700">Failed</Text>
                <Text className="text-lg font-bold text-red-600">{importResult.failed}</Text>
              </View>
            )}
          </View>

          {/* Next Steps */}
          <View className="bg-blue-50 rounded-lg p-4 mb-6">
            <Text className="text-sm font-semibold text-blue-900 mb-2">
              What's Next?
            </Text>
            <Text className="text-sm text-blue-800 leading-relaxed">
              Your races are now in your calendar. You can:{'\n'}
              • Add race documents (NOR, SI){'\n'}
              • Set up race courses and marks{'\n'}
              • Create race strategies{'\n'}
              • Track your performance
            </Text>
          </View>

          {/* Done Button */}
          <Pressable
            onPress={() => onComplete(importResult.created)}
            className="bg-sky-600 py-4 rounded-xl items-center justify-center mb-8"
          >
            <Text className="text-white font-semibold text-base">Done</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return null;
}
