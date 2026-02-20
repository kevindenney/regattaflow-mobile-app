/**
 * Session Cancellation Screen
 *
 * Allows coaches to cancel a session with:
 * - Clear refund policy display
 * - Required cancellation reason
 * - Confirmation before proceeding
 */

import { coachingService } from '@/services/CoachingService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
}

interface RefundInfo {
  hoursUntilSession: number;
  refundPercentage: number;
  refundAmountCents: number;
  policy: string;
}

const CANCELLATION_REASONS = [
  { id: 'weather', label: 'Weather conditions', icon: 'cloud-outline' },
  { id: 'personal', label: 'Personal emergency', icon: 'person-outline' },
  { id: 'schedule', label: 'Schedule conflict', icon: 'calendar-outline' },
  { id: 'illness', label: 'Illness', icon: 'medkit-outline' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

export default function CancelSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    sessionId: string;
    sailorName?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [refundInfo, setRefundInfo] = useState<RefundInfo | null>(null);

  // Form state
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');

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

      // Calculate refund
      const refund = coachingService.calculateRefundAmount(
        details.scheduledAt,
        details.feeAmountCents
      );
      setRefundInfo(refund);
    } catch (error) {
      console.error('Error loading session:', error);
      showAlert('Error', 'Failed to load session details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getReasonText = () => {
    if (selectedReason === 'other') {
      return customReason.trim();
    }
    const reason = CANCELLATION_REASONS.find((r) => r.id === selectedReason);
    return reason?.label || '';
  };

  const handleCancel = async () => {
    if (!params.sessionId) return;

    const reasonText = getReasonText();
    if (!reasonText) {
      showAlert('Missing Reason', 'Please select or enter a cancellation reason.');
      return;
    }

    const sailorName = session?.sailor?.name || params.sailorName || 'the sailor';
    const refundText = refundInfo
      ? refundInfo.refundPercentage === 100
        ? 'Full refund will be issued.'
        : refundInfo.refundPercentage === 50
          ? '50% refund will be issued.'
          : 'No refund will be issued (less than 12 hours notice).'
      : '';

    showConfirm(
      'Cancel Session?',
      `Are you sure you want to cancel this session with ${sailorName}? ${refundText}`,
      async () => {
        setSubmitting(true);

        try {
          await coachingService.cancelSession(params.sessionId, 'coach', reasonText);

          showAlert(
            'Session Cancelled',
            `The session has been cancelled. ${sailorName} has been notified.`
          );
          router.back();
        } catch (error: any) {
          console.error('Error cancelling session:', error);
          showAlert('Error', error.message || 'Failed to cancel session');
        } finally {
          setSubmitting(false);
        }
      },
      {
        confirmText: 'Cancel Session',
        destructive: true,
      }
    );
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={styles.loadingText}>Loading session...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Cancel Session</Text>
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
                {format(new Date(session.scheduledAt), 'h:mm a')} ({session.durationMinutes} min)
              </Text>
            </View>
          </View>
        )}

        {/* Refund Policy */}
        {refundInfo && (
          <View style={styles.refundCard}>
            <View style={styles.refundHeader}>
              <Ionicons
                name={refundInfo.refundPercentage === 100 ? 'checkmark-circle' : 'warning'}
                size={24}
                color={refundInfo.refundPercentage === 100 ? '#059669' : refundInfo.refundPercentage > 0 ? '#F59E0B' : '#EF4444'}
              />
              <Text style={styles.refundTitle}>Refund Policy</Text>
            </View>

            <View style={styles.refundPolicyList}>
              <View style={[styles.policyItem, refundInfo.hoursUntilSession >= 24 && styles.policyItemActive]}>
                <View style={[styles.policyDot, refundInfo.hoursUntilSession >= 24 && styles.policyDotActive]} />
                <Text style={[styles.policyText, refundInfo.hoursUntilSession >= 24 && styles.policyTextActive]}>
                  24+ hours notice: <Text style={styles.policyBold}>Full refund</Text>
                </Text>
              </View>
              <View style={[styles.policyItem, refundInfo.hoursUntilSession >= 12 && refundInfo.hoursUntilSession < 24 && styles.policyItemActive]}>
                <View style={[styles.policyDot, refundInfo.hoursUntilSession >= 12 && refundInfo.hoursUntilSession < 24 && styles.policyDotActive]} />
                <Text style={[styles.policyText, refundInfo.hoursUntilSession >= 12 && refundInfo.hoursUntilSession < 24 && styles.policyTextActive]}>
                  12-24 hours notice: <Text style={styles.policyBold}>50% refund</Text>
                </Text>
              </View>
              <View style={[styles.policyItem, refundInfo.hoursUntilSession < 12 && styles.policyItemActive]}>
                <View style={[styles.policyDot, refundInfo.hoursUntilSession < 12 && styles.policyDotActive]} />
                <Text style={[styles.policyText, refundInfo.hoursUntilSession < 12 && styles.policyTextActive]}>
                  Less than 12 hours: <Text style={styles.policyBold}>No refund</Text>
                </Text>
              </View>
            </View>

            <View style={styles.refundSummary}>
              <Text style={styles.refundSummaryLabel}>Time until session:</Text>
              <Text style={styles.refundSummaryValue}>
                {refundInfo.hoursUntilSession.toFixed(1)} hours
              </Text>
            </View>

            {session && session.feeAmountCents > 0 && (
              <View style={styles.refundAmount}>
                <Text style={styles.refundAmountLabel}>
                  {refundInfo.refundPercentage > 0 ? 'Refund amount:' : 'No refund will be issued'}
                </Text>
                {refundInfo.refundPercentage > 0 && (
                  <Text style={styles.refundAmountValue}>
                    {formatCurrency(refundInfo.refundAmountCents)}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Cancellation Reason */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reason for Cancellation</Text>
          <Text style={styles.sectionSubtitle}>
            This will be shared with the sailor
          </Text>

          <View style={styles.reasonList}>
            {CANCELLATION_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonItem,
                  selectedReason === reason.id && styles.reasonItemSelected,
                ]}
                onPress={() => setSelectedReason(reason.id)}
              >
                <Ionicons
                  name={reason.icon as any}
                  size={22}
                  color={selectedReason === reason.id ? '#4F46E5' : '#64748B'}
                />
                <Text
                  style={[
                    styles.reasonText,
                    selectedReason === reason.id && styles.reasonTextSelected,
                  ]}
                >
                  {reason.label}
                </Text>
                {selectedReason === reason.id && (
                  <Ionicons name="checkmark-circle" size={22} color="#4F46E5" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {selectedReason === 'other' && (
            <TextInput
              style={styles.customReasonInput}
              value={customReason}
              onChangeText={setCustomReason}
              placeholder="Please describe the reason..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          )}
        </View>

        {/* Warning */}
        <View style={styles.warningCard}>
          <Ionicons name="alert-circle" size={24} color="#EF4444" />
          <Text style={styles.warningText}>
            Cancelling sessions may affect your coach rating. Please only cancel when necessary.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitBar}>
        <TouchableOpacity
          style={styles.keepButton}
          onPress={() => router.back()}
        >
          <Text style={styles.keepButtonText}>Keep Session</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.cancelButton,
            (!selectedReason || submitting) && styles.cancelButtonDisabled,
          ]}
          onPress={handleCancel}
          disabled={!selectedReason || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="close-circle" size={20} color="#FFFFFF" />
              <Text style={styles.cancelButtonText}>Cancel Session</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  refundCard: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  refundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  refundTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  refundPolicyList: {
    marginBottom: 12,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  policyItemActive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  policyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  policyDotActive: {
    backgroundColor: '#059669',
  },
  policyText: {
    fontSize: 14,
    color: '#78716C',
  },
  policyTextActive: {
    color: '#0F172A',
    fontWeight: '500',
  },
  policyBold: {
    fontWeight: '600',
  },
  refundSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FCD34D',
  },
  refundSummaryLabel: {
    fontSize: 14,
    color: '#92400E',
  },
  refundSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  refundAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  refundAmountLabel: {
    fontSize: 14,
    color: '#92400E',
  },
  refundAmountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
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
  reasonList: {
    gap: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  reasonItemSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  reasonText: {
    flex: 1,
    fontSize: 16,
    color: '#475569',
  },
  reasonTextSelected: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  customReasonInput: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    minHeight: 80,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
  },
  submitBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
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
  keepButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  keepButtonText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 6,
  },
  cancelButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
