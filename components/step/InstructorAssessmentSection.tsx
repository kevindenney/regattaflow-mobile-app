/**
 * InstructorAssessmentSection — Lets blueprint authors assess student competencies
 * on completed steps. Shown in review tab when readOnly + competency_ids exist.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import { useStepDetail, useUpdateStepMetadata } from '@/hooks/useStepDetail';
import * as competencyService from '@/services/competencyService';
import type { Competency } from '@/types/competency';
import type { InstructorCompetencyAssessment, InstructorReviewStatus } from '@/types/step-detail';

type InstructorRating = 'needs_improvement' | 'satisfactory' | 'excellent';

const C = {
  pageBg: '#F5F4F1',
  cardBg: '#FFFFFF',
  cardBorder: '#E5E4E1',
  sectionLabel: '#9C9B99',
  labelDark: '#1A1918',
  labelMid: '#6D6C6A',
  labelLight: '#D1D0CD',
  accent: '#3D8A5A',
  accentBg: 'rgba(61,138,90,0.08)',
  coral: '#D89575',
  gold: '#D4A64A',
  red: '#D85050',
  radius: 12,
} as const;

const RATING_OPTIONS: { value: InstructorRating; label: string; color: string }[] = [
  { value: 'needs_improvement', label: 'Needs Improvement', color: C.red },
  { value: 'satisfactory', label: 'Satisfactory', color: C.gold },
  { value: 'excellent', label: 'Excellent', color: C.accent },
];

interface Props {
  stepId: string;
  competencies: Competency[];
  studentSelfRatings: Record<string, number>; // competency title -> dot rating (from review)
  existingAssessment?: Record<string, InstructorCompetencyAssessment>;
}

export function InstructorAssessmentSection({
  stepId,
  competencies,
  studentSelfRatings,
  existingAssessment,
}: Props) {
  const { user } = useAuth();
  const { data: step } = useStepDetail(stepId);
  const updateMetadata = useUpdateStepMetadata(stepId);

  const [ratings, setRatings] = useState<Record<string, InstructorRating>>(
    () => {
      const initial: Record<string, InstructorRating> = {};
      if (existingAssessment) {
        for (const [id, a] of Object.entries(existingAssessment)) {
          initial[id] = a.rating as InstructorRating;
        }
      }
      return initial;
    },
  );
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (existingAssessment) {
      for (const [id, a] of Object.entries(existingAssessment)) {
        initial[id] = a.notes ?? '';
      }
    }
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(Boolean(existingAssessment && Object.keys(existingAssessment).length > 0));
  const [reviewStatus, setReviewStatus] = useState<InstructorReviewStatus | undefined>(
    () => ((step?.metadata as any)?.review?.instructor_review_status as InstructorReviewStatus) ?? undefined,
  );
  const [reviewNote, setReviewNote] = useState(
    () => ((step?.metadata as any)?.review?.instructor_review_note as string) ?? '',
  );
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const handleRatingChange = useCallback((compId: string, rating: InstructorRating) => {
    setRatings((prev) => ({ ...prev, [compId]: rating }));
  }, []);

  const handleNotesChange = useCallback((compId: string, text: string) => {
    setNotes((prev) => ({ ...prev, [compId]: text }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!user?.id || !step || submitting) return;
    setSubmitting(true);

    try {
      // Build instructor assessment record
      const assessment: Record<string, InstructorCompetencyAssessment> = {};
      for (const comp of competencies) {
        const rating = ratings[comp.id];
        if (rating) {
          assessment[comp.id] = {
            rating,
            notes: notes[comp.id]?.trim() || undefined,
          };
        }
      }

      // Save assessment to step metadata
      const metadata = (step.metadata ?? {}) as any;
      updateMetadata.mutate({
        review: {
          ...(metadata.review ?? {}),
          instructor_assessment: assessment,
        },
      });

      // For each assessed competency, find most recent attempt and submit preceptor validation
      const stepOwnerId = step.user_id;
      for (const comp of competencies) {
        const rating = ratings[comp.id];
        if (!rating) continue;

        // Map to preceptor rating type (InstructorRating values match PreceptorRating subset)
        const preceptorRating = rating as any;

        try {
          // Find the most recent attempt for this student + competency
          const detail = await competencyService.getCompetencyDetail(stepOwnerId, comp.id);
          const latestAttempt = detail.attempts[0]; // sorted desc by created_at
          if (latestAttempt) {
            await competencyService.submitPreceptorValidation(user.id, {
              attempt_id: latestAttempt.id,
              preceptor_rating: preceptorRating,
              preceptor_notes: notes[comp.id]?.trim() || undefined,
            });
          }
        } catch (err) {
          console.warn(`[InstructorAssessment] Failed to validate competency ${comp.id}:`, err);
        }
      }

      setSubmitted(true);
    } catch (err) {
      console.error('[InstructorAssessment] Submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  }, [user?.id, step, competencies, ratings, notes, submitting, updateMetadata]);

  const handleReviewDecision = useCallback(async (status: InstructorReviewStatus) => {
    if (!user?.id || !step || reviewSubmitting) return;
    setReviewSubmitting(true);
    try {
      const metadata = (step.metadata ?? {}) as any;
      updateMetadata.mutate({
        review: {
          ...(metadata.review ?? {}),
          instructor_review_status: status,
          instructor_review_note: reviewNote.trim() || undefined,
          instructor_review_at: new Date().toISOString(),
        },
      });

      // When approving, advance assessed competencies to "validated"
      if (status === 'approved' && competencies.length > 0) {
        const stepOwnerId = step.user_id;
        const interestId = competencies[0].interest_id;
        try {
          const allProgress = await competencyService.getUserCompetencyProgress(stepOwnerId, interestId);
          for (const comp of competencies) {
            const rating = ratings[comp.id];
            if (!rating || rating === 'needs_improvement') continue;
            const withProgress = allProgress.find((p) => p.id === comp.id);
            const prog = withProgress?.progress;
            if (prog && prog.status !== 'validated' && prog.status !== 'competent') {
              await competencyService.validateCompetency(user.id, prog.id);
            }
          }
        } catch (err) {
          console.warn('[InstructorAssessment] Failed to validate competencies on approval:', err);
        }
      }

      setReviewStatus(status);
    } catch (err) {
      console.error('[InstructorAssessment] Review decision failed:', err);
    } finally {
      setReviewSubmitting(false);
    }
  }, [user?.id, step, competencies, ratings, reviewNote, reviewSubmitting, updateMetadata]);

  const selfRatingLabel = (dotValue: number): string => {
    if (dotValue >= 4) return 'Confident';
    if (dotValue >= 3) return 'Proficient';
    if (dotValue >= 2) return 'Developing';
    return 'Needs Practice';
  };

  return (
    <View style={s.container}>
      <Text style={s.sectionLabel}>INSTRUCTOR ASSESSMENT</Text>

      {competencies.map((comp) => {
        const selfDotRating = studentSelfRatings[comp.title] ?? 0;
        const selectedRating = ratings[comp.id];

        return (
          <View key={comp.id} style={s.compCard}>
            <Text style={s.compTitle}>{comp.title}</Text>

            {/* Student self-rating (read-only) */}
            {selfDotRating > 0 && (
              <View style={s.selfRatingRow}>
                <Text style={s.selfRatingLabel}>Student self-rating:</Text>
                <View style={s.dotRow}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <View
                      key={i}
                      style={[
                        s.dot,
                        { backgroundColor: i <= selfDotRating ? C.accent : '#EDECEA' },
                      ]}
                    />
                  ))}
                </View>
                <Text style={s.selfRatingValue}>{selfRatingLabel(selfDotRating)}</Text>
              </View>
            )}

            {/* Instructor rating picker */}
            <View style={s.ratingPickerRow}>
              {RATING_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    s.ratingPill,
                    selectedRating === opt.value && { backgroundColor: opt.color, borderColor: opt.color },
                  ]}
                  onPress={() => !submitted && handleRatingChange(comp.id, opt.value)}
                  disabled={submitted}
                >
                  <Text
                    style={[
                      s.ratingPillText,
                      selectedRating === opt.value && { color: '#FFFFFF' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Optional notes */}
            <TextInput
              style={s.notesInput}
              value={notes[comp.id] ?? ''}
              onChangeText={(text) => !submitted && handleNotesChange(comp.id, text)}
              placeholder="Optional feedback..."
              placeholderTextColor={C.labelLight}
              multiline
              editable={!submitted}
            />
          </View>
        );
      })}

      {/* Submit button */}
      {!submitted ? (
        <Pressable
          style={[s.submitButton, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting || Object.keys(ratings).length === 0}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
          )}
          <Text style={s.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </Text>
        </Pressable>
      ) : (
        <View style={s.submittedBadge}>
          <Ionicons name="checkmark-circle" size={16} color={C.accent} />
          <Text style={s.submittedText}>Assessment submitted</Text>
        </View>
      )}

      {/* Approve / Request Revision */}
      <Text style={[s.sectionLabel, { marginTop: 8 }]}>STEP REVIEW DECISION</Text>
      {reviewStatus ? (
        <View style={[s.reviewDecisionBadge, reviewStatus === 'approved' ? s.approvedBadge : s.revisionBadge]}>
          <Ionicons
            name={reviewStatus === 'approved' ? 'shield-checkmark' : 'refresh-circle'}
            size={18}
            color={reviewStatus === 'approved' ? C.accent : C.coral}
          />
          <Text style={[s.reviewDecisionText, { color: reviewStatus === 'approved' ? C.accent : C.coral }]}>
            {reviewStatus === 'approved' ? 'Approved' : 'Revision Requested'}
          </Text>
        </View>
      ) : (
        <View style={s.reviewDecisionCard}>
          <TextInput
            style={s.notesInput}
            value={reviewNote}
            onChangeText={setReviewNote}
            placeholder="Optional note to student..."
            placeholderTextColor={C.labelLight}
            multiline
          />
          <View style={s.reviewButtonRow}>
            <Pressable
              style={[s.revisionButton, reviewSubmitting && { opacity: 0.6 }]}
              onPress={() => handleReviewDecision('needs_revision')}
              disabled={reviewSubmitting}
            >
              <Ionicons name="refresh-circle" size={16} color={C.coral} />
              <Text style={[s.reviewButtonText, { color: C.coral }]}>Request Revision</Text>
            </Pressable>
            <Pressable
              style={[s.approveButton, reviewSubmitting && { opacity: 0.6 }]}
              onPress={() => handleReviewDecision('approved')}
              disabled={reviewSubmitting}
            >
              <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
              <Text style={[s.reviewButtonText, { color: '#FFFFFF' }]}>Approve</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    gap: 12,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.sectionLabel,
    letterSpacing: 1,
  },
  compCard: {
    backgroundColor: C.cardBg,
    borderRadius: C.radius,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  compTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.labelDark,
  },
  selfRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  selfRatingLabel: {
    fontSize: 12,
    color: C.labelMid,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  selfRatingValue: {
    fontSize: 12,
    fontWeight: '500',
    color: C.labelMid,
  },
  ratingPickerRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  ratingPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.cardBg,
  },
  ratingPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.labelMid,
  },
  notesInput: {
    fontSize: 13,
    color: C.labelDark,
    backgroundColor: '#FAFAF8',
    borderRadius: 8,
    padding: 10,
    minHeight: 40,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.accent,
    borderRadius: C.radius,
    paddingVertical: 14,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(61,138,90,0.25)' } as any,
    }),
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submittedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: C.accentBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  submittedText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.accent,
  },
  reviewDecisionCard: {
    backgroundColor: C.cardBg,
    borderRadius: C.radius,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  reviewButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  revisionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.coral,
    backgroundColor: 'rgba(216,149,117,0.08)',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: C.accent,
  },
  reviewButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  reviewDecisionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  approvedBadge: {
    backgroundColor: 'rgba(61,138,90,0.08)',
  },
  revisionBadge: {
    backgroundColor: 'rgba(216,149,117,0.08)',
  },
  reviewDecisionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
