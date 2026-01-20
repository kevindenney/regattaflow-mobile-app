/**
 * ExtractionProgress Component
 *
 * Shows extraction progress with status messages and spinner.
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { CheckCircle, AlertCircle, Sparkles } from 'lucide-react-native';
import { TUFTE_FORM_COLORS, TUFTE_FORM_SPACING } from '@/components/races/AddRaceDialog/tufteFormStyles';
import { IOS_COLORS } from '@/components/cards/constants';

export type ExtractionStatus = 'idle' | 'fetching' | 'extracting' | 'completed' | 'failed';

interface ExtractionProgressProps {
  status: ExtractionStatus;
  error?: string | null;
  /** Number of fields extracted (shown on completion) */
  extractedFieldCount?: number;
  /** Document type that was processed */
  documentType?: string;
}

const STATUS_MESSAGES: Record<ExtractionStatus, string> = {
  idle: '',
  fetching: 'Fetching document...',
  extracting: 'Analyzing with AI...',
  completed: 'Extraction complete',
  failed: 'Extraction failed',
};

export function ExtractionProgress({
  status,
  error,
  extractedFieldCount,
  documentType,
}: ExtractionProgressProps) {
  if (status === 'idle') {
    return null;
  }

  const isProcessing = status === 'fetching' || status === 'extracting';
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';

  return (
    <View style={[
      styles.container,
      isProcessing && styles.containerProcessing,
      isCompleted && styles.containerCompleted,
      isFailed && styles.containerFailed,
    ]}>
      <View style={styles.content}>
        {/* Icon/Spinner */}
        <View style={styles.iconContainer}>
          {isProcessing && (
            <ActivityIndicator
              size="small"
              color={TUFTE_FORM_COLORS.aiAccent}
            />
          )}
          {isCompleted && (
            <CheckCircle size={20} color={TUFTE_FORM_COLORS.success} />
          )}
          {isFailed && (
            <AlertCircle size={20} color={TUFTE_FORM_COLORS.error} />
          )}
        </View>

        {/* Text */}
        <View style={styles.textContainer}>
          <Text style={[
            styles.statusText,
            isCompleted && styles.statusTextSuccess,
            isFailed && styles.statusTextError,
          ]}>
            {STATUS_MESSAGES[status]}
          </Text>

          {isProcessing && (
            <Text style={styles.subText}>
              {status === 'fetching'
                ? 'Downloading and parsing content...'
                : 'Extracting race details, VHF channels, marks...'}
            </Text>
          )}

          {isCompleted && extractedFieldCount !== undefined && (
            <Text style={styles.subText}>
              {extractedFieldCount} fields extracted
              {documentType ? ` from ${documentType.toUpperCase()}` : ''}
            </Text>
          )}

          {isFailed && error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>
      </View>

      {/* AI Badge */}
      {isProcessing && (
        <View style={styles.aiBadge}>
          <Sparkles size={12} color={TUFTE_FORM_COLORS.aiAccent} />
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: TUFTE_FORM_COLORS.separator,
  },
  containerProcessing: {
    backgroundColor: '#FAF5FF', // Very light purple
    borderColor: '#DDD6FE', // Light purple border
  },
  containerCompleted: {
    backgroundColor: '#F0FDF4', // Very light green
    borderColor: '#BBF7D0', // Light green border
  },
  containerFailed: {
    backgroundColor: '#FEF2F2', // Very light red
    borderColor: '#FECACA', // Light red border
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.label,
  },
  statusTextSuccess: {
    color: TUFTE_FORM_COLORS.success,
  },
  statusTextError: {
    color: TUFTE_FORM_COLORS.error,
  },
  subText: {
    fontSize: 12,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  errorText: {
    fontSize: 12,
    color: TUFTE_FORM_COLORS.error,
    marginTop: 2,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE9FE', // Light purple
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.aiAccent,
  },
});

export default ExtractionProgress;
