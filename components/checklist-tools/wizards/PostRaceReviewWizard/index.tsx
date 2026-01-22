/**
 * PostRaceReviewWizard
 *
 * Unified wizard component for all 9 post-race review checklist items.
 * Adapts its UI based on the reviewType prop to show:
 * - Past performance trends
 * - Rating input
 * - Topic-specific reflection prompts
 * - AI insights (if available)
 * - Save action
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, Info } from 'lucide-react-native';

import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';
import { usePostRaceReviewData } from '@/hooks/usePostRaceReviewData';
import {
  type PostRaceReviewType,
  getReviewConfig,
  TOOL_ID_TO_REVIEW_TYPE,
} from './reviewConfigs';
import { PastPerformanceCard } from './PastPerformanceCard';
import { ReviewForm } from './ReviewForm';
import { InsightsSection } from './InsightsSection';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
  secondaryBackground: '#FFFFFF',
  background: '#F2F2F7',
};

export interface PostRaceReviewWizardProps extends ChecklistToolProps {
  /** The review type to display */
  reviewType?: PostRaceReviewType;
}

export function PostRaceReviewWizard({
  item,
  regattaId,
  onComplete,
  onCancel,
  reviewType: propReviewType,
}: PostRaceReviewWizardProps) {
  // Determine review type from props or item toolId
  const reviewType = useMemo(() => {
    if (propReviewType) return propReviewType;
    if (item.toolId && TOOL_ID_TO_REVIEW_TYPE[item.toolId]) {
      return TOOL_ID_TO_REVIEW_TYPE[item.toolId];
    }
    return 'start'; // Default fallback
  }, [propReviewType, item.toolId]);

  // Get configuration for this review type
  const config = useMemo(() => getReviewConfig(reviewType), [reviewType]);

  // Data hook
  const {
    isLoading,
    error,
    getReviewData,
    aiInsights,
    saveReviewData,
  } = usePostRaceReviewData(regattaId);

  // Get review-specific data
  const reviewData = useMemo(() => getReviewData(reviewType), [getReviewData, reviewType]);

  // Form state
  const [rating, setRating] = useState<number | undefined>(reviewData.currentRating);
  const [responses, setResponses] = useState<Record<string, string>>(() => {
    // Initialize from current notes if available
    const initial: Record<string, string> = {};
    if (reviewData.currentNotes) {
      // Try to parse structured notes
      const lines = reviewData.currentNotes.split('\n\n');
      lines.forEach(line => {
        const match = line.match(/^\[([^\]]+)\]: (.*)$/s);
        if (match) {
          initial[match[1]] = match[2];
        }
      });
    }
    return initial;
  });

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Handle rating change
  const handleRatingChange = useCallback((newRating: number) => {
    setRating(newRating);
  }, []);

  // Handle response change
  const handleResponseChange = useCallback((promptId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [promptId]: value,
    }));
  }, []);

  // Check if form has any input
  const hasInput = useMemo(() => {
    return rating !== undefined || Object.values(responses).some(v => v.trim().length > 0);
  }, [rating, responses]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!hasInput) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      // Build notes from responses
      const notesContent = Object.entries(responses)
        .filter(([_, value]) => value.trim().length > 0)
        .map(([key, value]) => `[${key}]: ${value}`)
        .join('\n\n');

      const success = await saveReviewData(reviewType, rating, notesContent, responses);

      if (success) {
        onComplete();
      } else {
        setSaveError('Failed to save. Please try again.');
      }
    } catch (err) {
      console.error('[PostRaceReviewWizard] Save error:', err);
      setSaveError('An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  }, [hasInput, rating, responses, reviewType, saveReviewData, onComplete]);

  // Render icon
  const IconComponent = config.icon;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={config.color} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.closeButton}
          onPress={onCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={IOS_COLORS.gray} />
        </Pressable>
        <Text style={styles.headerTitle}>{config.title}</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentInner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Icon Header */}
          <View style={styles.iconHeader}>
            <View style={[styles.iconCircle, { backgroundColor: `${config.color}15` }]}>
              <IconComponent size={32} color={config.color} />
            </View>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>{config.subtitle}</Text>
          </View>

          {/* Past Performance Card */}
          <PastPerformanceCard
            pastTrends={reviewData.pastTrends}
            averageRating={reviewData.averageRating}
            trend={reviewData.trend}
            accentColor={config.color}
          />

          {/* Review Form */}
          <ReviewForm
            prompts={config.prompts}
            rating={rating}
            onRatingChange={handleRatingChange}
            responses={responses}
            onResponseChange={handleResponseChange}
            accentColor={config.color}
            showRating={!config.isRequest && !!config.ratingField}
          />

          {/* AI Insights Section */}
          {aiInsights && (
            <View style={styles.insightsSection}>
              <InsightsSection
                aiInsights={aiInsights}
                accentColor={config.color}
              />
            </View>
          )}

          {/* Tips */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Info size={16} color={config.color} />
              <Text style={styles.tipsTitle}>Tips</Text>
            </View>
            {config.tips.map((tip, index) => (
              <View key={index} style={styles.tipRow}>
                <View style={[styles.tipBullet, { backgroundColor: config.color }]} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Error message */}
          {(error || saveError) && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error || saveError}</Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Action */}
        <View style={styles.bottomAction}>
          <Pressable
            style={[
              styles.saveButton,
              { backgroundColor: config.color },
              !hasInput && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!hasInput || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {config.isRequest ? 'Request Feedback' : 'Save & Complete'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  closeButton: {
    padding: 4,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerRight: {
    minWidth: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    padding: 20,
    paddingBottom: 40,
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
  insightsSection: {
    marginTop: 24,
  },
  tipsCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#FF3B3015',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
  },
  bottomAction: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: IOS_COLORS.gray,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default PostRaceReviewWizard;
