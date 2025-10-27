import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { coachingService } from '@/services/CoachingService';

export default function MyBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const statusFilter = filter === 'all' ? undefined : filter;
      const results = await coachingService.getSailorBookingRequests(statusFilter);
      setBookings(results);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await coachingService.cancelBookingRequest(bookingId, 'Cancelled by sailor');
              loadBookings();
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const renderStatusBadge = (status: string) => {
    const statusColors: any = {
      pending: '#F59E0B',
      accepted: '#10B981',
      rejected: '#EF4444',
      cancelled: '#6B7280',
    };

    return (
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: statusColors[status] || '#6B7280' },
        ]}
      >
        <Text style={styles.statusText}>{status.toUpperCase()}</Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <Text style={styles.subtitle}>Track your coaching session requests</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {['all', 'pending', 'accepted', 'rejected'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterTab,
              filter === status && styles.filterTabActive,
            ]}
            onPress={() => setFilter(status)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === status && styles.filterTabTextActive,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bookings List */}
      <ScrollView
        style={styles.bookingsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No bookings found</Text>
            <TouchableOpacity
              style={styles.findCoachButton}
              onPress={() => router.push('/coach/discover')}
            >
              <Text style={styles.findCoachText}>Find a Coach</Text>
            </TouchableOpacity>
          </View>
        ) : (
          bookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <Text style={styles.coachName}>
                  {booking.coach?.display_name || 'Coach'}
                </Text>
                {renderStatusBadge(booking.status)}
              </View>

              <View style={styles.bookingDetails}>
                <Text style={styles.sessionType}>
                  {booking.session_type?.replace('_', ' ') || 'Session'}
                </Text>
                <Text style={styles.datetime}>
                  {new Date(booking.requested_start_time).toLocaleDateString(
                    'en-US',
                    {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    }
                  )}
                </Text>
                <Text style={styles.amount}>
                  ${(booking.total_amount_cents / 100).toFixed(2)}
                </Text>
              </View>

              {booking.sailor_message && (
                <View style={styles.messageContainer}>
                  <Text style={styles.messageLabel}>Your message:</Text>
                  <Text style={styles.messageText}>
                    {booking.sailor_message}
                  </Text>
                </View>
              )}

              {booking.coach_response && (
                <View style={styles.responseContainer}>
                  <Text style={styles.responseLabel}>Coach response:</Text>
                  <Text style={styles.responseText}>
                    {booking.coach_response}
                  </Text>
                </View>
              )}

              {booking.status === 'pending' && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancelBooking(booking.id)}
                >
                  <Text style={styles.cancelButtonText}>Cancel Request</Text>
                </TouchableOpacity>
              )}

              {booking.status === 'accepted' && booking.session_id && (
                <TouchableOpacity
                  style={styles.viewSessionButton}
                  onPress={() =>
                    router.push(`/coach/session/${booking.session_id}`)
                  }
                >
                  <Text style={styles.viewSessionText}>View Session</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  bookingsList: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 16,
    marginBottom: 20,
  },
  findCoachButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  findCoachText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  coachName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bookingDetails: {
    marginBottom: 12,
  },
  sessionType: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  datetime: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  messageContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  responseContainer: {
    backgroundColor: '#E8F4FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  responseLabel: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    color: '#333',
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  viewSessionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewSessionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
