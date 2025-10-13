/**
 * Freeform Input Field
 * Smart input field that triggers AI extraction and shows inline results
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Sparkles, AlertCircle } from 'lucide-react-native';
import { ExtractedDataPreview, ExtractedEntity } from './ExtractedDataPreview';

interface FreeformInputFieldProps {
  label: string;
  placeholder: string;
  multiline?: boolean;
  onExtract: (text: string) => Promise<ExtractedEntity[]>;
  onConfirm: (entities: ExtractedEntity[]) => void;
  initialValue?: string;
  helpText?: string;
}

export function FreeformInputField({
  label,
  placeholder,
  multiline = true,
  onExtract,
  onConfirm,
  initialValue = '',
  helpText,
}: FreeformInputFieldProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedEntities, setExtractedEntities] = useState<ExtractedEntity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasExtracted, setHasExtracted] = useState(false);

  // Auto-extract when user stops typing (debounced)
  useEffect(() => {
    if (!inputValue.trim() || inputValue.length < 10) {
      setExtractedEntities([]);
      setHasExtracted(false);
      return;
    }

    const timer = setTimeout(() => {
      handleExtract();
    }, 1500); // Wait 1.5s after user stops typing

    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleExtract = async () => {
    if (!inputValue.trim()) return;

    setIsExtracting(true);
    setError(null);

    try {
      const entities = await onExtract(inputValue);
      setExtractedEntities(entities);
      setHasExtracted(true);
    } catch (err: any) {
      console.error('Extraction failed:', err);
      setError(err.message || 'Failed to extract data. Please try again.');
      setExtractedEntities([]);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirm = (entities: ExtractedEntity[]) => {
    onConfirm(entities);
    setInputValue(''); // Clear input after confirmation
    setExtractedEntities([]);
    setHasExtracted(false);
  };

  const handleReject = () => {
    setExtractedEntities([]);
    setHasExtracted(false);
  };

  return (
    <View className="space-y-2">
      {/* Label */}
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
        {isExtracting && (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator size="small" color="#0284c7" />
            <Text className="text-xs text-gray-500">Analyzing...</Text>
          </View>
        )}
      </View>

      {/* Help Text */}
      {helpText && (
        <Text className="text-xs text-gray-500">{helpText}</Text>
      )}

      {/* Input Field */}
      <View className="relative">
        <TextInput
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={placeholder}
          multiline={multiline}
          numberOfLines={multiline ? 6 : 1}
          className={`bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900 ${
            multiline ? 'min-h-[120px]' : ''
          } ${isExtracting ? 'border-sky-400' : ''}`}
          placeholderTextColor="#9ca3af"
          textAlignVertical={multiline ? 'top' : 'center'}
        />

        {/* AI Indicator */}
        {inputValue.length > 10 && !hasExtracted && (
          <View className="absolute top-3 right-3">
            <Sparkles size={16} color="#0284c7" />
          </View>
        )}
      </View>

      {/* Error Display */}
      {error && (
        <View className="flex-row items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle size={16} color="#dc2626" />
          <Text className="text-xs text-red-700 flex-1">{error}</Text>
        </View>
      )}

      {/* Extracted Data Preview */}
      {extractedEntities.length > 0 && (
        <ExtractedDataPreview
          entities={extractedEntities}
          onConfirm={handleConfirm}
          onReject={handleReject}
        />
      )}

      {/* Manual Extract Button (optional fallback) */}
      {inputValue.length > 10 && !isExtracting && extractedEntities.length === 0 && hasExtracted && (
        <TouchableOpacity
          onPress={handleExtract}
          className="bg-gray-100 border border-gray-300 rounded-lg p-3 flex-row items-center justify-center gap-2"
        >
          <Sparkles size={16} color="#6b7280" />
          <Text className="text-sm font-medium text-gray-700">Extract Data</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default FreeformInputField;
