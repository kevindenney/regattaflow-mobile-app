/**
 * PreceptorValidationCard Component
 *
 * Card displayed in the preceptor's view for reviewing a student's
 * competency attempt. Shows the student's self-assessment and allows
 * the preceptor to submit their own rating and feedback.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type {
  CompetencyAttempt,
  PreceptorRating,
  PreceptorValidationPayload,
} from '@/types/competency';
import {
  SELF_RATING_CONFIG,
  PRECEPTOR_RATING_CONFIG,
} from '@/types/competency';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PreceptorValidationCardProps {
  attempt: CompetencyAttempt;
  competencyTitle: string;
  competencyNumber: number;
  studentName?: string;
  onSubmitRating: (payload: PreceptorValidationPayload) => Promise<void>;
  accentColor?: string;
}

// ---------------------------------------------------------------------------
// Preceptor Rating Icons
// ---------------------------------------------------------------------------

const PRECEPTOR_RATING_ICONS: Record<PreceptorRating, string> = {
  not_observed: 'eye-off-outline',
  needs_improvement: 'alert-circle-outline',
  satisfactory: 'thumbs-up-outline',
  excellent: 'star-outline',
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_ACCENT = '#0097A7';

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function PreceptorRatingCard({
  rating,
  selected,
  onSelect,
}: {
  rating: PreceptorRating;
  selected: boolean;
  onSelect: (r: PreceptorRating) => void;
}) {
  const config = PRECEPTOR_RATING_CONFIG[rating];
  const icon = PRECEPTOR_RATING_ICONS[rating];

  return (
    <Pressable
      style={[
        styles.preceptorRatingCard,
        selected && { borderColor: config.color, borderWidth: 2, backgroundColor: `${config.color}08` },
      ]}
      onPress={() => onSelect(rating)}
    >
      <Ionicons name={icon as any} size={20} color={selected ? config.color : '#9CA3AF'} />
      <Text
        style={[
          styles.preceptorRatingLabel,
          selected && { color: config.color, fontWeight: '600' },
        ]}
        numberOfLines={1}
      >
        {config.label}
      </Text>
      {selected && (
        <Ionicons name="checkmark-circle" size={18} color={config.color} />
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PreceptorValidationCard({
  attempt,
  competencyTitle,
  competencyNumber,
  studentName,
  onSubmitRating,
  accentColor = DEFAULT_ACCENT,
}: PreceptorValidationCardProps) {
  const [selectedRating, setSelectedRating] = useState<PreceptorRating | null>(null);
  const [preceptorNotes, setPreceptorNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selfRatingConfig = attempt.self_rating
    ? SELF_RATING_CONFIG[attempt.self_rating]
    : null;

  const handleSubmit = useCallback(async () => {
    if (!selectedRating) return;

    setSubmitting(true);
    setError(null);

    const payload: PreceptorValidationPayload = {
      attempt_id: attempt.id,
      preceptor_rating: selectedRating,
      ...(preceptorNotes.trim() ? { preceptor_notes: preceptorNotes.trim() } : {}),
    };

    try {
      await onSubmitRating(payload);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to submit evaluation');
    } finally {
      setSubmitting(false);
    }
  }, [selectedRating, preceptorNotes, attempt.id, onSubmitRating]);

  // ---------------------------------------------------------------------------
  // Submitted Confirmation
  // ---------------------------------------------------------------------------

  if (submitted) {
    return (
      <View style={[styles.card, { borderLeftColor: '#15803D' }]}>
        <View style={styles.confirmedWrap}>
          <View style={styles.confirmedIconWrap}>
            <Ionicons name="checkmark-circle" size={32} color="#15803D" />
          </View>
          <Text style={styles.confirmedTitle}>Evaluated</Text>
          <Text style={styles.confirmedSubtitle}>
            Your evaluation for {competencyTitle} has been submitted.
          </Text>
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={[styles.card, { borderLeftColor: accentColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.numberBadge, { backgroundColor: `${accentColor}14` }]}>
          <Text style={[styles.numberBadgeText, { color: accentColor }]}>
            #{competencyNumber}
          </Text>
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {competencyTitle}
          </Text>
          {studentName && (
            <View style={styles.studentRow}>
              <Ionicons name="person-outline" size={13} color="#6B7280" />
              <Text style={styles.studentName}>{studentName}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Student Self-Assessment */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Student Self-Assessment</Text>

        {selfRatingConfig && (
          <View style={[styles.selfRatingBadge, { backgroundColor: `${selfRatingConfig.color}14` }]}>
            <Ionicons
              name={selfRatingConfig.icon as any}
              size={16}
              color={selfRatingConfig.color}
            />
            <Text style={[styles.selfRatingText, { color: selfRatingConfig.color }]}>
              {selfRatingConfig.label}
            </Text>
          </View>
        )}

        {attempt.self_notes && (
          <Text style={styles.selfNotes}>{attempt.self_notes}</Text>
        )}
      </View>

      {/* Clinical Context */}
      {attempt.clinical_context && (
        <View style={styles.contextRow}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.contextText}>{attempt.clinical_context}</Text>
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Preceptor Rating */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Your Evaluation</Text>
        <View style={styles.preceptorRatingGrid}>
          {(Object.keys(PRECEPTOR_RATING_CONFIG) as PreceptorRating[]).map((rating) => (
            <PreceptorRatingCard
              key={rating}
              rating={rating}
              selected={selectedRating === rating}
              onSelect={setSelectedRating}
            />
          ))}
        </View>
      </View>

      {/* Preceptor Notes */}
      <TextInput
        style={styles.notesInput}
        placeholder="Feedback for the student..."
        placeholderTextColor="#9CA3AF"
        value={preceptorNotes}
        onChangeText={setPreceptorNotes}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={14} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Submit */}
      <Pressable
        style={[
          styles.submitButton,
          { backgroundColor: accentColor },
          (!selectedRating || submitting) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!selectedRating || submitting}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.submitButtonText}>Submit Evaluation</Text>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </>
        )}
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderLeftWidth: 4,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  numberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 2,
  },
  numberBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  studentName: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Section
  section: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },

  // Student self-rating
  selfRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  selfRatingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selfNotes: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Context
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  contextText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginBottom: 14,
  },

  // Preceptor rating grid
  preceptorRatingGrid: {
    gap: 8,
  },
  preceptorRatingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  preceptorRatingLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Notes input
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FAFAFA',
    minHeight: 80,
    marginBottom: 14,
    textAlignVertical: 'top',
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },

  // Submit button
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Confirmed state
  confirmedWrap: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  confirmedIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 4,
  },
  confirmedSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PreceptorValidationCard;
