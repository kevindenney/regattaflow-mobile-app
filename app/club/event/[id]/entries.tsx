/**
 * Event Entry Management Screen
 * View, approve, and manage event registrations
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import EventService, {
  EventRegistration,
  RegistrationStatus,
  EventRegistrationStats,
  ClubEvent,
  PaymentStatus,
} from '@/services/eventService';
import { supabase } from '@/services/supabase';
import { useClubWorkspace } from '@/hooks/useClubWorkspace';

export default function EventEntriesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventId = id as string;
  const { clubId, loading: personaLoading, refresh: refreshPersonaContext } = useClubWorkspace();

  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [stats, setStats] = useState<EventRegistrationStats | null>(null);
  const [event, setEvent] = useState<ClubEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RegistrationStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!clubId) return;
    loadRegistrations();
  }, [eventId, clubId]);

  const loadRegistrations = async () => {
    if (!clubId) return;
    try {
      setLoading(true);
      const [eventData, regs, statistics] = await Promise.all([
        EventService.getEvent(eventId),
        EventService.getEventRegistrations(eventId),
        EventService.getRegistrationStats(eventId),
      ]);
      setEvent(eventData);
      setRegistrations(regs);
      setStats(statistics);
    } catch (error) {
      console.error('Error loading registrations:', error);
      Alert.alert('Error', 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registrationId: string) => {
    try {
      await EventService.updateRegistrationStatus(registrationId, 'approved');
      await loadRegistrations();
      Alert.alert('Success', 'Registration approved');
    } catch (error) {
      console.error('Error approving registration:', error);
      Alert.alert('Error', 'Failed to approve registration');
    }
  };

  const handleReject = async (registrationId: string) => {
    Alert.prompt(
      'Reject Registration',
      'Please provide a reason for rejection:',
      async (reason) => {
        if (reason) {
          try {
            await EventService.updateRegistrationStatus(registrationId, 'rejected', reason);
            await loadRegistrations();
            Alert.alert('Success', 'Registration rejected');
          } catch (error) {
            console.error('Error rejecting registration:', error);
            Alert.alert('Error', 'Failed to reject registration');
          }
        }
      }
    );
  };

  const handleMoveToWaitlist = async (registrationId: string) => {
    try {
      await EventService.updateRegistrationStatus(registrationId, 'waitlist');
      await loadRegistrations();
      Alert.alert('Success', 'Moved to waitlist');
    } catch (error) {
      console.error('Error moving to waitlist:', error);
      Alert.alert('Error', 'Failed to move to waitlist');
    }
  };

  const handleMarkAsPaid = async (registrationId: string, registrationFee: number) => {
    Alert.prompt(
      'Mark as Paid',
      `Enter amount paid (registration fee: $${registrationFee.toFixed(2)}):`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Cash',
          onPress: async (amount) => {
            try {
              const paidAmount = parseFloat(amount || registrationFee.toString());
              await EventService.markRegistrationPaid(registrationId, paidAmount, 'cash');
              await loadRegistrations();
              Alert.alert('Success', 'Marked as paid');
            } catch (error) {
              console.error('Error marking as paid:', error);
              Alert.alert('Error', 'Failed to mark as paid');
            }
          },
        },
        {
          text: 'Check',
          onPress: async (amount) => {
            try {
              const paidAmount = parseFloat(amount || registrationFee.toString());
              await EventService.markRegistrationPaid(registrationId, paidAmount, 'check');
              await loadRegistrations();
              Alert.alert('Success', 'Marked as paid');
            } catch (error) {
              console.error('Error marking as paid:', error);
              Alert.alert('Error', 'Failed to mark as paid');
            }
          },
        },
      ],
      'plain-text',
      registrationFee.toString()
    );
  };

  const handleWaivePayment = async (registrationId: string) => {
    Alert.alert(
      'Waive Payment',
      'Are you sure you want to waive the payment for this registration?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Waive',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('event_registrations')
                .update({ payment_status: 'waived' })
                .eq('id', registrationId);

              if (error) throw error;
              await loadRegistrations();
              Alert.alert('Success', 'Payment waived');
            } catch (error) {
              console.error('Error waiving payment:', error);
              Alert.alert('Error', 'Failed to waive payment');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: RegistrationStatus) => {
    switch (status) {
      case 'approved':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'waitlist':
        return '#3B82F6';
      case 'rejected':
      case 'withdrawn':
      case 'cancelled':
        return '#EF4444';
      default:
        return '#64748B';
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return '#10B981';
      case 'unpaid':
        return '#F59E0B';
      case 'refunded':
        return '#3B82F6';
      case 'waived':
        return '#64748B';
      default:
        return '#94A3B8';
    }
  };

  const getPaymentStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return 'checkmark-circle';
      case 'unpaid':
        return 'time-outline';
      case 'refunded':
        return 'arrow-undo-outline';
      case 'waived':
        return 'gift-outline';
      default:
        return 'help-outline';
    }
  };

  if (personaLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      </ThemedView>
    );
  }

  if (!clubId) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.missingContainer}>
          <Ionicons name="people-circle-outline" size={48} color="#94A3B8" />
          <ThemedText style={styles.missingTitle}>Connect Your Club Workspace</ThemedText>
          <ThemedText style={styles.missingDescription}>
            You need an active club connection to manage event registrations. Finish onboarding or refresh your workspace.
          </ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={refreshPersonaContext}>
            <ThemedText style={styles.retryButtonText}>Retry Connection</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryLink}
            onPress={() => router.push('/(auth)/club-onboarding-chat')}
          >
            <ThemedText style={styles.secondaryLinkText}>Open Club Onboarding</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const filteredRegistrations = registrations.filter((reg) => {
    // Filter by status
    if (filter !== 'all' && reg.status !== filter) return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        reg.participant_name.toLowerCase().includes(query) ||
        reg.participant_email.toLowerCase().includes(query) ||
        reg.boat_name?.toLowerCase().includes(query) ||
        reg.sail_number?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Entry Management</ThemedText>
        <View style={styles.placeholder} />
      </View>

      {/* Stats Summary */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{stats.approved_count}</ThemedText>
            <ThemedText style={styles.statLabel}>Approved</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{stats.pending_count}</ThemedText>
            <ThemedText style={styles.statLabel}>Pending</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{stats.waitlist_count}</ThemedText>
            <ThemedText style={styles.statLabel}>Waitlist</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>${stats.total_paid.toFixed(2)}</ThemedText>
            <ThemedText style={styles.statLabel}>Collected</ThemedText>
          </View>
        </View>
      )}

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, boat..."
            placeholderTextColor="#94A3B8"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterTabs}
        >
          {(['all', 'pending', 'approved', 'waitlist', 'rejected'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterTab, filter === status && styles.filterTabActive]}
              onPress={() => setFilter(status)}
            >
              <ThemedText
                style={[
                  styles.filterTabText,
                  filter === status && styles.filterTabTextActive,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Registration List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredRegistrations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#CBD5E1" />
            <ThemedText style={styles.emptyText}>No registrations found</ThemedText>
          </View>
        ) : (
          filteredRegistrations.map((registration) => (
            <View key={registration.id} style={styles.registrationCard}>
              <View style={styles.registrationHeader}>
                <View style={styles.registrationInfo}>
                  <ThemedText style={styles.participantName}>
                    {registration.participant_name}
                  </ThemedText>
                  <ThemedText style={styles.participantEmail}>
                    {registration.participant_email}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(registration.status)}20` },
                  ]}
                >
                  <ThemedText
                    style={[styles.statusText, { color: getStatusColor(registration.status) }]}
                  >
                    {registration.status}
                  </ThemedText>
                </View>
              </View>

              {registration.boat_name && (
                <View style={styles.boatInfo}>
                  <Ionicons name="boat-outline" size={16} color="#64748B" />
                  <ThemedText style={styles.boatText}>
                    {registration.boat_name}
                    {registration.sail_number && ` (${registration.sail_number})`}
                  </ThemedText>
                </View>
              )}

              {registration.crew_count > 0 && (
                <View style={styles.crewInfo}>
                  <Ionicons name="people-outline" size={16} color="#64748B" />
                  <ThemedText style={styles.crewText}>
                    {registration.crew_count} crew members
                  </ThemedText>
                </View>
              )}

              {/* Payment Status */}
              {event?.registration_fee && event.registration_fee > 0 && (
                <View style={styles.paymentInfo}>
                  <View
                    style={[
                      styles.paymentStatusBadge,
                      { backgroundColor: `${getPaymentStatusColor(registration.payment_status)}20` },
                    ]}
                  >
                    <Ionicons
                      name={getPaymentStatusIcon(registration.payment_status)}
                      size={16}
                      color={getPaymentStatusColor(registration.payment_status)}
                    />
                    <ThemedText
                      style={[
                        styles.paymentStatusText,
                        { color: getPaymentStatusColor(registration.payment_status) },
                      ]}
                    >
                      {registration.payment_status}
                    </ThemedText>
                  </View>
                  {registration.amount_paid && (
                    <ThemedText style={styles.amountPaid}>
                      ${registration.amount_paid.toFixed(2)}
                      {registration.payment_method && ` (${registration.payment_method})`}
                    </ThemedText>
                  )}
                </View>
              )}

              {registration.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(registration.id)}
                  >
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    <ThemedText style={styles.actionButtonText}>Approve</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.waitlistButton]}
                    onPress={() => handleMoveToWaitlist(registration.id)}
                  >
                    <Ionicons name="time-outline" size={20} color="#FFFFFF" />
                    <ThemedText style={styles.actionButtonText}>Waitlist</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(registration.id)}
                  >
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                    <ThemedText style={styles.actionButtonText}>Reject</ThemedText>
                  </TouchableOpacity>
                </View>
              )}

              {/* Payment Actions */}
              {event?.registration_fee &&
                event.registration_fee > 0 &&
                registration.payment_status === 'unpaid' &&
                registration.status === 'approved' && (
                  <View style={styles.paymentActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.markPaidButton]}
                      onPress={() => handleMarkAsPaid(registration.id, event.registration_fee!)}
                    >
                      <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
                      <ThemedText style={styles.actionButtonText}>Mark as Paid</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.waiveButton]}
                      onPress={() => handleWaivePayment(registration.id)}
                    >
                      <Ionicons name="gift-outline" size={20} color="#FFFFFF" />
                      <ThemedText style={styles.actionButtonText}>Waive</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}

              {registration.rejection_reason && (
                <View style={styles.rejectionReason}>
                  <ThemedText style={styles.rejectionReasonText}>
                    Reason: {registration.rejection_reason}
                  </ThemedText>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F8FAFC',
  },
  missingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  missingDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0EA5E9',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryLink: {
    marginTop: 16,
  },
  secondaryLinkText: {
    color: '#0EA5E9',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#1E293B',
  },
  filterTabs: {
    flexDirection: 'row',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  registrationCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  registrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  registrationInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  participantEmail: {
    fontSize: 14,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  boatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  boatText: {
    fontSize: 14,
    color: '#475569',
  },
  crewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  crewText: {
    fontSize: 14,
    color: '#475569',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 6,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  waitlistButton: {
    backgroundColor: '#3B82F6',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rejectionReason: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
  },
  rejectionReasonText: {
    fontSize: 13,
    color: '#DC2626',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  paymentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  amountPaid: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  paymentActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  markPaidButton: {
    backgroundColor: '#10B981',
  },
  waiveButton: {
    backgroundColor: '#64748B',
  },
});
