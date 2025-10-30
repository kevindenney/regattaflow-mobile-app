/**
 * AddRaceModal Component
 * Simple race upload via text paste or document upload
 * AI extracts race details and saves to database
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Upload, FileText, Sparkles } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { RaceExtractionAgent } from '@/services/agents/RaceExtractionAgent';
import { BoatSelector } from './BoatSelector';
import { createLogger } from '@/lib/utils/logger';

interface AddRaceModalProps {
  visible: boolean;
  onClose: () => void;
  onRaceAdded: () => void;
}

interface ExtractedRaceData {
  name: string;
  venue: string;
  date: string;
  startTime: string;
  wind?: {
    direction: string;
    speedMin: number;
    speedMax: number;
  };
  tide?: {
    state: 'flooding' | 'ebbing' | 'slack';
    height: number;
  };
  strategy?: string;
  critical_details?: {
    vhf_channel?: string;
    warning_signal?: string;
    first_start?: string;
  };
}

const logger = createLogger('AddRaceModal');
export function AddRaceModal({ visible, onClose, onRaceAdded }: AddRaceModalProps) {
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadMode, setUploadMode] = useState<'text' | 'document'>('text');
  const [selectedBoatId, setSelectedBoatId] = useState<string | undefined>();

  const handleTextExtraction = async () => {
    if (!inputText.trim() || !user) return;

    setIsProcessing(true);

    try {
      logger.debug('[AddRaceModal] Starting AI extraction...');

      // Use Anthropic Agent SDK for intelligent extraction
      const agent = new RaceExtractionAgent();
      const result = await agent.extractRaceData(inputText);

      logger.debug('[AddRaceModal] Extraction result:', result);

      if (!result.success || !result.data) {
        Alert.alert(
          'Could Not Extract Race Details',
          result.error || 'Please include race name, venue, and date in your text.',
          [{ text: 'OK' }]
        );
        setIsProcessing(false);
        return;
      }

      const extracted = result.data;

      // Save to Supabase - match actual schema with created_by field
      const { data, error } = await supabase.from('regattas').insert({
        created_by: user.id,
        name: extracted.name,
        boat_id: selectedBoatId || null,
        location: null, // PostGIS geography type - set to null for now
        metadata: {
          venue_name: extracted.venue,
          wind: extracted.wind,
          tide: extracted.tide,
          strategy: extracted.strategy,
          critical_details: extracted.critical_details,
          startTime: extracted.startTime || '10:00',
        },
        start_date: extracted.date,
        end_date: extracted.date, // Single day race by default
        status: 'planned', // Valid enum value: planned, active, completed, cancelled
      });

      if (error) throw error;

      logger.debug('[AddRaceModal] Race saved successfully');

      // Clear input and close modal
      setInputText('');
      onRaceAdded();
      onClose();

      // Show success message (works better on web than Alert)
      setTimeout(() => {
        Alert.alert('Success', `Added: ${extracted.name} at ${extracted.venue}`);
      }, 300);
    } catch (error: any) {
      console.error('[AddRaceModal] Error:', error);
      Alert.alert('Error', error.message || 'Failed to add race. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDocumentUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setIsProcessing(true);

      // TODO: Integrate with AI document parsing
      // For now, show placeholder
      Alert.alert(
        'Coming Soon',
        'AI document parsing will be available in the next update. Please use text input for now.'
      );

      setIsProcessing(false);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to upload document.');
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-sky-600 pt-12 pb-4 px-4 flex-row items-center justify-between">
          <Text className="text-white text-2xl font-bold">Add Race</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* Mode Selector */}
        <View className="flex-row p-4 gap-2">
          <TouchableOpacity
            onPress={() => setUploadMode('text')}
            className={`flex-1 py-3 rounded-lg border-2 ${
              uploadMode === 'text'
                ? 'bg-sky-100 border-sky-600'
                : 'bg-gray-50 border-gray-300'
            }`}
          >
            <View className="flex-row items-center justify-center gap-2">
              <FileText
                size={20}
                color={uploadMode === 'text' ? '#0284c7' : '#6b7280'}
              />
              <Text
                className={`font-semibold ${
                  uploadMode === 'text' ? 'text-sky-900' : 'text-gray-600'
                }`}
              >
                Paste Text
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setUploadMode('document')}
            className={`flex-1 py-3 rounded-lg border-2 ${
              uploadMode === 'document'
                ? 'bg-sky-100 border-sky-600'
                : 'bg-gray-50 border-gray-300'
            }`}
          >
            <View className="flex-row items-center justify-center gap-2">
              <Upload
                size={20}
                color={uploadMode === 'document' ? '#0284c7' : '#6b7280'}
              />
              <Text
                className={`font-semibold ${
                  uploadMode === 'document' ? 'text-sky-900' : 'text-gray-600'
                }`}
              >
                Upload File
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4">
          {uploadMode === 'text' ? (
            <>
              {/* Text Input Mode */}
              <View className="bg-sky-50 rounded-lg p-4 mb-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Sparkles size={16} color="#0284c7" />
                  <Text className="text-sm font-semibold text-sky-900">
                    AI will extract race details
                  </Text>
                </View>
                <Text className="text-xs text-sky-700">
                  Paste race information, sailing instructions, or any text with race
                  details. AI will automatically extract name, venue, date, and more.
                </Text>
              </View>

              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Paste race details here... (e.g., Hong Kong Dragon Championship at RHKYC, October 15, 2025, First start 10:00)"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={12}
                className="bg-gray-100 rounded-lg p-4 text-base min-h-[300px]"
                textAlignVertical="top"
              />

              <Text className="text-xs text-gray-500 mt-2 mb-4">
                💡 Tip: Include race name, venue, date, and start time for best results
              </Text>

              {/* Boat Selection */}
              <View className="mb-4">
                <BoatSelector
                  selectedBoatId={selectedBoatId}
                  onSelect={setSelectedBoatId}
                  showQuickAdd={false}
                />
              </View>

              <TouchableOpacity
                onPress={handleTextExtraction}
                disabled={!inputText.trim() || isProcessing}
                className={`py-4 rounded-lg ${
                  inputText.trim() && !isProcessing
                    ? 'bg-sky-600'
                    : 'bg-gray-300'
                }`}
              >
                {isProcessing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center text-base font-bold text-white">
                    Extract & Add Race
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Document Upload Mode */}
              <View className="bg-sky-50 rounded-lg p-4 mb-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Sparkles size={16} color="#0284c7" />
                  <Text className="text-sm font-semibold text-sky-900">
                    AI Document Parsing
                  </Text>
                </View>
                <Text className="text-xs text-sky-700">
                  Upload sailing instructions (PDF), race documents, or photos. AI will
                  parse and extract all race details automatically.
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleDocumentUpload}
                disabled={isProcessing}
                className="bg-sky-600 py-16 rounded-lg items-center justify-center border-2 border-dashed border-sky-400"
              >
                {isProcessing ? (
                  <ActivityIndicator color="white" size="large" />
                ) : (
                  <>
                    <Upload size={48} color="white" />
                    <Text className="text-white font-bold text-lg mt-4">
                      Upload Document
                    </Text>
                    <Text className="text-sky-100 text-sm mt-2">
                      PDF, text file, or image
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <Text className="text-xs text-gray-500 mt-4 text-center">
                📄 Supported: PDF, TXT, JPG, PNG
              </Text>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
