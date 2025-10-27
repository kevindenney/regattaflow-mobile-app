import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  clubMemberService,
  MembershipRequest,
} from '@/services/ClubMemberService';
import { supabase } from '@/services/supabase';

export default function MembershipRequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [clubId, setClubId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MembershipRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadClubAndRequests();
  }, []);

  const loadClubAndRequests = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      const { data: clubProfile } = await supabase
        .from('club_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (clubProfile) {
        setClubId(clubProfile.id);
        await loadRequests(clubProfile.id);
      }
    } catch (error) {
      console.error('Error loading club and requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async (id: string) => {
    try {
      const requestsData = await clubMemberService.getPendingRequests(id);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error loading requests:', error);
      Alert.alert('Error', 'Failed to load membership requests');
    }
  };

  const handleApprove = async (request: MembershipRequest) => {
    if (!currentUserId || !clubId) return;

    try {
      setProcessingId(request.id);

      Alert.alert(
        'Approve Membership',
        `Approve ${request.user?.full_name || request.user?.email}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Approve',
            onPress: async () => {
              try {
                await clubMemberService.approveRequest(
                  request.id,
                  currentUserId,
                  'member'
                );

                Alert.alert(
                  'Approved',
                  'Membership approved. Welcome email sent.'
                );

                // Reload requests
                await loadRequests(clubId);
              } catch (error) {
                console.error('Error approving request:', error);
                Alert.alert('Error', 'Failed to approve membership');
              } finally {
                setProcessingId(null);
              }
            },
          },
        ]
      );
    } catch (error) {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (request: MembershipRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedRequest || !currentUserId || !clubId) return;

    if (!rejectionReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for rejection');
      return;
    }

    try {
      setProcessingId(selectedRequest.id);
      setShowRejectionModal(false);

      await clubMemberService.rejectRequest(
        selectedRequest.id,
        currentUserId,
        rejectionReason
      );

      Alert.alert('Rejected', 'Membership request rejected');

      // Reload requests
      await loadRequests(clubId);
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'Failed to reject membership');
    } finally {
      setProcessingId(null);
      setSelectedRequest(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>Membership Requests</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle" size={64} color="#10B981" />
            <Text style={styles.emptyStateText}>All Caught Up!</Text>
            <Text style={styles.emptyStateSubtext}>
              No pending membership requests
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {requests.length} Pending Request{requests.length > 1 ? 's' : ''}
              </Text>
            </View>

            {requests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.avatarContainer}>
                    <Ionicons name="person-circle" size={60} color="#CBD5E1" />
                  </View>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>
                      {request.user?.full_name || 'No Name'}
                    </Text>
                    <Text style={styles.requestEmail}>
                      {request.user?.email}
                    </Text>
                    <View style={styles.dateBadge}>
                      <Ionicons name="calendar-outline" size={14} color="#64748B" />
                      <Text style={styles.dateText}>
                        Applied {formatDate(request.created_at)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.requestDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Membership Type:</Text>
                    <Text style={styles.detailValue}>
                      {request.requested_membership_type.charAt(0).toUpperCase() +
                        request.requested_membership_type.slice(1)}
                    </Text>
                  </View>

                  {request.sail_number && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Sail Number:</Text>
                      <Text style={styles.detailValue}>{request.sail_number}</Text>
                    </View>
                  )}

                  {request.boat_information && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Boat:</Text>
                      <Text style={styles.detailValue}>
                        {request.boat_information.class || 'N/A'}
                      </Text>
                    </View>
                  )}

                  {request.application_message && (
                    <View style={styles.messageContainer}>
                      <Text style={styles.messageLabel}>Message:</Text>
                      <Text style={styles.messageText}>
                        {request.application_message}
                      </Text>
                    </View>
                  )}

                  {request.references && request.references.length > 0 && (
                    <View style={styles.referencesContainer}>
                      <Text style={styles.messageLabel}>References:</Text>
                      {request.references.map((ref, idx) => (
                        <Text key={idx} style={styles.referenceText}>
                          • {ref}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.rejectButton,
                      processingId === request.id && styles.buttonDisabled,
                    ]}
                    onPress={() => handleRejectClick(request)}
                    disabled={processingId === request.id}
                  >
                    {processingId === request.id ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <>
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                        <Text style={styles.rejectButtonText}>Reject</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.approveButton,
                      processingId === request.id && styles.buttonDisabled,
                    ]}
                    onPress={() => handleApprove(request)}
                    disabled={processingId === request.id}
                  >
                    {processingId === request.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.approveButtonText}>Approve</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Membership</Text>
            <Text style={styles.modalSubtitle}>
              Please provide a reason for rejection:
            </Text>

            <TextInput
              style={styles.rejectionInput}
              multiline
              numberOfLines={4}
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChangeText={setRejectionReason}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowRejectionModal(false);
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleRejectConfirm}
              >
                <Text style={styles.modalConfirmText}>Confirm Rejection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
    borderRadius: 8,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  requestName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  requestEmail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  requestDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  messageContainer: {
    marginTop: 12,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
  },
  referencesContainer: {
    marginTop: 12,
  },
  referenceText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  rejectionInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
