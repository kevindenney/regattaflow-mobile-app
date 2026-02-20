/**
 * Session Completion Screen
 *
 * Allows coaches to complete a session with:
 * - Confirm/edit duration
 * - Structured session notes
 * - Private engagement rating
 * - Option to send summary to sailor
 */

import { coachingService } from '@/services/CoachingService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showAlert, showConfirm } from '@/lib/utils/crossPlatformAlert';
import { format } from 'date-fns';

interface SessionDetails {
  id: string;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  sessionType: string;
  feeAmountCents: number;
  sailor: { id: string; name: string; email: string } | null;
  coach: { id: string; name: string } | null;
}

export default function CompleteSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    sessionId: string;
    sailorName?: string;
    scheduledDuration?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<SessionDetails | null>(null);

  // Form state
  const [actualDuration, setActualDuration] = useState(60);
  const [whatWasCovered, setWhatWasCovered] = useState('');
  const [whatWentWell, setWhatWentWell] = useState('');
  const [areasToWorkOn, setAreasToWorkOn] = useState('');
  const [homeworkNextSteps, setHomeworkNextSteps] = useState('');
  const [engagementRating, setEngagementRating] = useState<number>(0);

  useEffect(() => {
    loadSessionDetails();
  }, [params.sessionId]);

  const loadSessionDetails = async () => {
    if (!params.sessionId) {
      showAlert('Error', 'No session ID provided');
      router.back();
      return;
    }

    try {
      setLoading(true);
      const details = await coachingService.getSessionDetails(params.sessionId);

      if (!details) {
        showAlert('Error', 'Session not found');
        router.back();
        return;
      }

      setSession(details);
      setActualDuration(details.durationMinutes || 60);
    } catch (error) {
      console.error('Error loading session:', error);
      showAlert('Error', 'Failed to load session details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!params.sessionId) return;

    // Validate at least some notes
    if (!whatWasCovered && !whatWentWell && !areasToWorkOn) {
      showAlert('Missing Notes', 'Please add at least some session notes before completing.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await coachingService.completeSessionWithNotes(params.sessionId, {
        actualDurationMinutes: actualDuration,
        structuredNotes: {
          what_was_covered: whatWasCovered.trim() || undefined,
          what_went_well: whatWentWell.trim() || undefined,
          areas_to_work_on: areasToWorkOn.trim() || undefined,
          homework_next_steps: homeworkNextSteps.trim() || undefined,
        },
        sailorEngagementRating: engagementRating > 0 ? engagementRating : undefined,
      });

      if (!result.success) {
        showAlert('Error', result.error || 'Failed to complete session');
        setSubmitting(false);
        return;
      }

      // Ask if they want to send summary to sailor
      const sailorName = session?.sailor?.name || params.sailorName || 'the sailor';

      showConfirm(
        'Session Completed',
        `Would you like to send a summary to ${sailorName}?`,
        async () => {
          // Send summary
          await coachingService.sendSessionSummaryToSailor(params.sessionId);
          showAlert('Summary Sent', `A summary has been sent to ${sailorName}.`);
          router.back();
        },
        {
          confirmText: 'Send Summary',
          cancelText: 'Not Now',
          onCancel: () => router.back(),
        }
      );
    } catch (error: any) {
      console.error('Error completing session:', error);
      showAlert('Error', error.message || 'Failed to complete session');
    } finally {
      setSubmitting(false);
    }
  };

  const renderEngagementRating = () => {
    const ratings = [1, 2, 3, 4, 5];
    const labels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingLabel}>
          Sailor Engagement <Text style={styles.privateLabel}>(Private)</Text>
        </Text>
        <View style={styles.ratingStars}>
          {ratings.map((rating) => (
            <TouchableOpacity
              key={rating}
              onPress={() => setEngagementRating(rating)}
              style={styles.starButton}
            >
              <Ionicons
                name={rating <= engagementRating ? 'star' : 'star-outline'}
                size={32}
                color={rating <= engagementRating ? '#F59E0B' : '#CBD5E1'}
              />
            </TouchableOpacity>
          ))}
        </View>
        {engagementRating > 0 && (
          <Text style={styles.ratingText}>{labels[engagementRating - 1]}</Text>
        )}
      </View>
    );
  };

  const adjustDuration = (delta: number) => {
    setActualDuration((prev) => Math.max(15, Math.min(480, prev + delta)));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading session...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Complete Session</Text>
            <Text style={styles.subtitle}>
              {session?.sailor?.name || params.sailorName || 'Session'}
            </Text>
          </View>
        </View>

        {/* Session Info Card */}
        {session && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color="#64748B" />
              <Text style={styles.infoText}>
                {format(new Date(session.scheduledAt), 'EEEE, MMMM d, yyyy')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={18} color="#64748B" />
              <Text style={styles.infoText}>
                {format(new Date(session.scheduledAt), 'h:mm a')} ({session.durationMinutes} min scheduled)
              </Text>
            </View>
          </View>
        )}

        {/* Duration Adjustment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actual Duration</Text>
          <View style={styles.durationPicker}>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => adjustDuration(-15)}
            >
              <Ionicons name="remove" size={24} color="#4F46E5" />
            </TouchableOpacity>
            <View style={styles.durationDisplay}>
              <Text style={styles.durationValue}>{actualDuration}</Text>
              <Text style={styles.durationUnit}>minutes</Text>
            </View>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => adjustDuration(15)}
            >
              <Ionicons name="add" size={24} color="#4F46E5" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Session Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Notes</Text>
          <Text style={styles.sectionSubtitle}>
            These notes will be visible to the sailor
          </Text>

          <View style={styles.noteField}>
            <Text style={styles.noteLabel}>What was covered</Text>
            <TextInput
              style={styles.noteInput}
              value={whatWasCovered}
              onChangeText={setWhatWasCovered}
              placeholder="Topics, drills, techniques practiced..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.noteField}>
            <Text style={styles.noteLabel}>What went well</Text>
            <TextInput
              style={styles.noteInput}
              value={whatWentWell}
              onChangeText={setWhatWentWell}
              placeholder="Improvements, breakthroughs, strengths..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.noteField}>
            <Text style={styles.noteLabel}>Areas to work on</Text>
            <TextInput
              style={styles.noteInput}
              value={areasToWorkOn}
              onChangeText={setAreasToWorkOn}
              placeholder="Skills needing improvement, focus areas..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.noteField}>
            <Text style={styles.noteLabel}>Homework / Next Steps</Text>
            <TextInput
              style={styles.noteInput}
              value={homeworkNextSteps}
              onChangeText={setHomeworkNextSteps}
              placeholder="Practice assignments, drills to do before next session..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Engagement Rating */}
        <View style={styles.section}>
          {renderEngagementRating()}
        </View>

        {/* Payment Note */}
        <View style={styles.paymentNote}>
          <Ionicons name="card-outline" size={20} color="#059669" />
          <Text style={styles.paymentNoteText}>
            Payment will be processed when you complete this session
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitBar}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Complete Session</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#475569',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  durationPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  durationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationDisplay: {
    alignItems: 'center',
    marginHorizontal: 32,
  },
  durationValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#4F46E5',
  },
  durationUnit: {
    fontSize: 14,
    color: '#64748B',
    marginTop: -4,
  },
  noteField: {
    marginBottom: 16,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    minHeight: 80,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  privateLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#94A3B8',
  },
  ratingStars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
  },
  paymentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  paymentNoteText: {
    flex: 1,
    fontSize: 14,
    color: '#059669',
  },
  submitBar: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
