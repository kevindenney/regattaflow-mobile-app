/**
 * SelfAssessmentFlow Component
 *
 * Bottom-sheet-style modal where a student logs a competency attempt
 * after a clinical shift. Three-step flow:
 *   1. Self-Rating — pick one of four confidence levels
 *   2. Context & Notes — clinical context, reflections, optional preceptor
 *   3. Confirm — review summary and submit
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  Animated,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type {
  Competency,
  SelfRating,
  LogAttemptPayload,
} from '@/types/competency';
import { SELF_RATING_CONFIG } from '@/types/competency';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SelfAssessmentFlowProps {
  competency: Competency;
  eventId?: string;
  onSubmit: (payload: LogAttemptPayload) => Promise<void>;
  onClose: () => void;
  visible: boolean;
  accentColor?: string;
}

// ---------------------------------------------------------------------------
// Rating Card Descriptions
// ---------------------------------------------------------------------------

const RATING_DESCRIPTIONS: Record<SelfRating, string> = {
  needs_practice: "I couldn't perform this independently",
  developing: 'I performed with significant guidance',
  proficient: 'I performed with minimal guidance',
  confident: 'I could perform this independently',
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_ACCENT = '#0097A7';
const STEP_COUNT = 3;

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({
  current,
  total,
  accentColor,
}: {
  current: number;
  total: number;
  accentColor: string;
}) {
  return (
    <View style={styles.stepRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            i <= current
              ? { backgroundColor: accentColor }
              : { backgroundColor: '#E5E7EB' },
          ]}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Rating Card
// ---------------------------------------------------------------------------

function RatingCard({
  rating,
  selected,
  onSelect,
  accentColor,
}: {
  rating: SelfRating;
  selected: boolean;
  onSelect: (r: SelfRating) => void;
  accentColor: string;
}) {
  const config = SELF_RATING_CONFIG[rating];

  return (
    <Pressable
      style={[
        styles.ratingCard,
        selected && { borderColor: accentColor, borderWidth: 2 },
      ]}
      onPress={() => onSelect(rating)}
    >
      <View style={[styles.ratingIconWrap, { backgroundColor: `${config.color}14` }]}>
        <Ionicons
          name={config.icon as any}
          size={22}
          color={config.color}
        />
      </View>
      <View style={styles.ratingTextWrap}>
        <Text style={[styles.ratingLabel, { color: config.color }]}>
          {config.label}
        </Text>
        <Text style={styles.ratingDescription}>
          {RATING_DESCRIPTIONS[rating]}
        </Text>
      </View>
      {selected && (
        <Ionicons name="checkmark-circle" size={22} color={accentColor} />
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SelfAssessmentFlow({
  competency,
  eventId,
  onSubmit,
  onClose,
  visible,
  accentColor = DEFAULT_ACCENT,
}: SelfAssessmentFlowProps) {
  // Step state
  const [step, setStep] = useState(0);

  // Form state
  const [selfRating, setSelfRating] = useState<SelfRating | null>(null);
  const [clinicalContext, setClinicalContext] = useState('');
  const [selfNotes, setSelfNotes] = useState('');
  const [preceptorId, setPreceptorId] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation for step transitions
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateToStep = useCallback(
    (nextStep: number) => {
      const direction = nextStep > step ? 1 : -1;
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: direction * -30,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
      setStep(nextStep);
    },
    [step, slideAnim],
  );

  const handleNext = useCallback(() => {
    if (step < STEP_COUNT - 1) {
      animateToStep(step + 1);
    }
  }, [step, animateToStep]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      animateToStep(step - 1);
    }
  }, [step, animateToStep]);

  const handleSubmit = useCallback(async () => {
    if (!selfRating) return;
    setSubmitting(true);
    setError(null);

    const payload: LogAttemptPayload = {
      competency_id: competency.id,
      self_rating: selfRating,
      ...(eventId ? { event_id: eventId } : {}),
      ...(clinicalContext.trim() ? { clinical_context: clinicalContext.trim() } : {}),
      ...(selfNotes.trim() ? { self_notes: selfNotes.trim() } : {}),
      ...(preceptorId.trim() ? { preceptor_id: preceptorId.trim() } : {}),
    };

    try {
      await onSubmit(payload);
      handleReset();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  }, [selfRating, competency.id, eventId, clinicalContext, selfNotes, preceptorId, onSubmit, onClose]);

  const handleReset = useCallback(() => {
    setStep(0);
    setSelfRating(null);
    setClinicalContext('');
    setSelfNotes('');
    setPreceptorId('');
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [onClose, handleReset]);

  // Step validity
  const canAdvance = step === 0 ? selfRating !== null : true;

  // ---------------------------------------------------------------------------
  // Step Renderers
  // ---------------------------------------------------------------------------

  const renderStep0 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>How did it go?</Text>
      <Text style={styles.stepSubtitle}>Rate your performance for this competency</Text>
      <View style={styles.ratingList}>
        {(Object.keys(SELF_RATING_CONFIG) as SelfRating[]).map((rating) => (
          <RatingCard
            key={rating}
            rating={rating}
            selected={selfRating === rating}
            onSelect={setSelfRating}
            accentColor={accentColor}
          />
        ))}
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Context & Reflection</Text>
      <Text style={styles.stepSubtitle}>Help your preceptor understand the situation</Text>

      <Text style={styles.inputLabel}>Clinical Context</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Where did you practice this? e.g., Oncology 6N, patient with central line"
        placeholderTextColor="#9CA3AF"
        value={clinicalContext}
        onChangeText={setClinicalContext}
        returnKeyType="next"
      />

      <Text style={styles.inputLabel}>Self-Reflection</Text>
      <TextInput
        style={[styles.textInput, styles.textInputMultiline]}
        placeholder="What went well? What would you do differently?"
        placeholderTextColor="#9CA3AF"
        value={selfNotes}
        onChangeText={setSelfNotes}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Text style={styles.inputLabel}>Preceptor (optional)</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Preceptor name or ID"
        placeholderTextColor="#9CA3AF"
        value={preceptorId}
        onChangeText={setPreceptorId}
        returnKeyType="done"
      />
    </View>
  );

  const renderStep2 = () => {
    const ratingConfig = selfRating ? SELF_RATING_CONFIG[selfRating] : null;

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Confirm Submission</Text>
        <Text style={styles.stepSubtitle}>Review your self-assessment before submitting</Text>

        <View style={styles.summaryCard}>
          {/* Competency */}
          <View style={styles.summaryRow}>
            <Ionicons name="school-outline" size={18} color="#6B7280" />
            <View style={styles.summaryTextWrap}>
              <Text style={styles.summaryLabel}>Competency</Text>
              <Text style={styles.summaryValue}>{competency.title}</Text>
            </View>
          </View>

          {/* Rating */}
          {ratingConfig && (
            <View style={styles.summaryRow}>
              <Ionicons name={ratingConfig.icon as any} size={18} color={ratingConfig.color} />
              <View style={styles.summaryTextWrap}>
                <Text style={styles.summaryLabel}>Self-Rating</Text>
                <Text style={[styles.summaryValue, { color: ratingConfig.color }]}>
                  {ratingConfig.label}
                </Text>
              </View>
            </View>
          )}

          {/* Context */}
          {clinicalContext.trim() ? (
            <View style={styles.summaryRow}>
              <Ionicons name="location-outline" size={18} color="#6B7280" />
              <View style={styles.summaryTextWrap}>
                <Text style={styles.summaryLabel}>Clinical Context</Text>
                <Text style={styles.summaryValue}>{clinicalContext}</Text>
              </View>
            </View>
          ) : null}

          {/* Notes */}
          {selfNotes.trim() ? (
            <View style={styles.summaryRow}>
              <Ionicons name="document-text-outline" size={18} color="#6B7280" />
              <View style={styles.summaryTextWrap}>
                <Text style={styles.summaryLabel}>Notes</Text>
                <Text style={styles.summaryValue} numberOfLines={3}>
                  {selfNotes}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    );
  };

  const STEPS = [renderStep0, renderStep1, renderStep2];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.sheet}>
          {/* Drag handle */}
          <View style={styles.dragHandleWrap}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.competencyBadge, { backgroundColor: `${accentColor}14` }]}>
                <Text style={[styles.competencyBadgeText, { color: accentColor }]}>
                  #{competency.competency_number}
                </Text>
              </View>
              <Text style={styles.headerTitle} numberOfLines={2}>
                {competency.title}
              </Text>
            </View>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Ionicons name="close-circle" size={28} color="#9CA3AF" />
            </Pressable>
          </View>

          {/* Step indicator */}
          <StepIndicator current={step} total={STEP_COUNT} accentColor={accentColor} />

          {/* Step content */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
              {STEPS[step]()}
            </Animated.View>
          </ScrollView>

          {/* Footer buttons */}
          <View style={styles.footer}>
            {step > 0 ? (
              <Pressable style={styles.backButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={18} color="#6B7280" />
                <Text style={styles.backButtonText}>Back</Text>
              </Pressable>
            ) : (
              <View />
            )}

            {step < STEP_COUNT - 1 ? (
              <Pressable
                style={[
                  styles.primaryButton,
                  { backgroundColor: accentColor },
                  !canAdvance && styles.primaryButtonDisabled,
                ]}
                onPress={handleNext}
                disabled={!canAdvance}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
            ) : (
              <Pressable
                style={[
                  styles.primaryButton,
                  { backgroundColor: accentColor },
                  submitting && styles.primaryButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Submit Assessment</Text>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  </>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D1D5DB',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 12,
  },
  competencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  competencyBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.3,
  },

  // Step indicator
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Scroll
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  // Steps
  stepContent: {
    paddingTop: 8,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },

  // Rating cards
  ratingList: {
    gap: 10,
  },
  ratingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    gap: 12,
  },
  ratingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingTextWrap: {
    flex: 1,
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  ratingDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Inputs
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FAFAFA',
  },
  textInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Summary
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  summaryTextWrap: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    lineHeight: 20,
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SelfAssessmentFlow;
