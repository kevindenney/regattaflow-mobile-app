import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId: string;
    coachName: string;
    sessionType: string;
    startTime: string;
    endTime: string;
    totalCost: string;
    venueName?: string;
    locationNotes?: string;
  }>();

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleAddToCalendar = () => {
    // In a real implementation, this would use expo-calendar
    Alert.alert(
      'Add to Calendar',
      'Calendar integration coming soon. You can manually add this to your calendar.',
      [{ text: 'OK' }]
    );
  };

  const handleMessageCoach = () => {
    router.push('/messages');
  };

  const handleShareBooking = async () => {
    try {
      await Share.share({
        message: `Booked a sailing coaching session with ${params.coachName} on ${formatDateTime(params.startTime)}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleViewSessions = () => {
    router.push('/(tabs)/dashboard');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#34C759" />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your session has been booked with {params.coachName}
          </Text>
        </View>

        {/* Booking Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Details</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="person" size={20} color="#007AFF" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Coach</Text>
              <Text style={styles.detailValue}>{params.coachName}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar" size={20} color="#007AFF" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>
                {formatDateTime(params.startTime)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="time" size={20} color="#007AFF" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>
                Until {new Date(params.endTime).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="clipboard" size={20} color="#007AFF" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Session Type</Text>
              <Text style={styles.detailValue}>
                {params.sessionType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </View>
          </View>

          {params.venueName && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="location" size={20} color="#007AFF" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Venue</Text>
                <Text style={styles.detailValue}>{params.venueName}</Text>
                {params.locationNotes && (
                  <Text style={styles.locationNotes}>{params.locationNotes}</Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="card" size={20} color="#007AFF" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Total Paid</Text>
              <Text style={styles.totalPaid}>${params.totalCost}</Text>
            </View>
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          <View style={styles.nextStepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>
              Add the session to your calendar so you don't forget
            </Text>
          </View>
          <View style={styles.nextStepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>
              Message your coach to coordinate final details
            </Text>
          </View>
          <View style={styles.nextStepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>
              Arrive 15 minutes early to maximize your session time
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAddToCalendar}
          >
            <Ionicons name="calendar-outline" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Add to Calendar</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleMessageCoach}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Message Coach</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShareBooking}
          >
            <Ionicons name="share-outline" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Share Booking</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Done Button */}
      <View style={styles.doneBar}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleViewSessions}
        >
          <Text style={styles.doneButtonText}>View My Sessions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  successHeader: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1A1A1A',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  locationNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  totalPaid: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34C759',
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
    marginLeft: 12,
  },
  doneBar: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  doneButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
