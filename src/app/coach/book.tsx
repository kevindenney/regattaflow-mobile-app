import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { coachingService } from '@/src/services/CoachingService';
import { supabase } from '@/src/services/supabase';

export default function BookingFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    coachId: string;
    coachName: string;
    slotId: string;
    startTime: string;
    endTime: string;
    hourlyRate: string;
  }>();

  const [sessionType, setSessionType] = useState<
    'one_on_one' | 'group' | 'video_analysis' | 'race_debrief'
  >('one_on_one');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState<any[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [locationNotes, setLocationNotes] = useState('');

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('sailing_venues')
        .select('id, name, location')
        .order('name', { ascending: true })
        .limit(50);

      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      console.error('Error loading venues:', error);
    }
  };

  const calculateSessionCost = () => {
    if (!params.startTime || !params.endTime || !params.hourlyRate) return 0;

    const start = new Date(params.startTime);
    const end = new Date(params.endTime);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    return (parseInt(params.hourlyRate) / 100) * hours;
  };

  const handleSubmitBooking = async () => {
    try {
      setLoading(true);

      const totalCost = calculateSessionCost();
      const totalCostCents = Math.round(totalCost * 100);

      // Create the booking request (coach will accept/reject)
      const booking = await coachingService.createBookingRequest(
        params.coachId,
        new Date(params.startTime),
        new Date(params.endTime),
        {
          sessionType,
          message: message.trim() || undefined,
          availabilitySlotId: params.slotId,
          totalAmountCents: totalCostCents,
        }
      );

      // Show success message
      Alert.alert(
        'Booking Request Sent',
        `Your booking request has been sent to ${params.coachName}. You'll receive an email when they respond. Payment will be processed after the coach accepts your request.`,
        [
          {
            text: 'OK',
            onPress: () => router.push('/coach/my-bookings'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', error.message || 'Failed to send booking request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const sessionTypeOptions = [
    { value: 'one_on_one', label: 'One-on-One' },
    { value: 'group', label: 'Group Session' },
    { value: 'video_analysis', label: 'Video Analysis' },
    { value: 'race_debrief', label: 'Race Debrief' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Book Session</Text>
          <Text style={styles.coachName}>{params.coachName}</Text>
        </View>

        {/* Session Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>
              {formatDateTime(params.startTime)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>
              {new Date(params.endTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Cost</Text>
            <Text style={styles.detailValue}>
              ${calculateSessionCost().toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Session Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Type</Text>
          <View style={styles.sessionTypeContainer}>
            {sessionTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sessionTypeButton,
                  sessionType === option.value &&
                    styles.sessionTypeButtonActive,
                ]}
                onPress={() =>
                  setSessionType(
                    option.value as
                      | 'one_on_one'
                      | 'group'
                      | 'video_analysis'
                      | 'race_debrief'
                  )
                }
              >
                <Text
                  style={[
                    styles.sessionTypeText,
                    sessionType === option.value &&
                      styles.sessionTypeTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Venue/Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Venue/Location</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.venueScrollView}
          >
            {venues.map((venue) => (
              <TouchableOpacity
                key={venue.id}
                style={[
                  styles.venueCard,
                  selectedVenueId === venue.id && styles.venueCardActive,
                ]}
                onPress={() => setSelectedVenueId(venue.id)}
              >
                <Text
                  style={[
                    styles.venueName,
                    selectedVenueId === venue.id && styles.venueNameActive,
                  ]}
                >
                  {venue.name}
                </Text>
                {venue.location && (
                  <Text style={styles.venueLocation}>{venue.location}</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TextInput
            style={styles.locationNotesInput}
            placeholder="Additional location details (dock, meeting point, etc.)"
            value={locationNotes}
            onChangeText={setLocationNotes}
          />
        </View>

        {/* Message to Coach */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message to Coach (Optional)</Text>
          <TextInput
            style={styles.messageInput}
            multiline
            numberOfLines={4}
            placeholder="Tell the coach what you'd like to work on..."
            value={message}
            onChangeText={setMessage}
            textAlignVertical="top"
          />
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentText}>
              💳 This is a booking request. Payment will be processed only after {params.coachName} accepts your request. You'll receive an email with payment instructions.
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>
            ${calculateSessionCost().toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.submitButton,
            loading && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitBooking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Send Booking Request</Text>
          )}
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
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  coachName: {
    fontSize: 16,
    color: '#666',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  sessionTypeContainer: {
    gap: 8,
  },
  sessionTypeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  sessionTypeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E8F4FD',
  },
  sessionTypeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  sessionTypeTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  paymentInfo: {
    backgroundColor: '#E8F4FD',
    padding: 16,
    borderRadius: 8,
  },
  paymentText: {
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
  },
  submitBar: {
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
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  venueScrollView: {
    marginBottom: 12,
  },
  venueCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
    minWidth: 150,
  },
  venueCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E8F4FD',
  },
  venueName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  venueNameActive: {
    color: '#007AFF',
  },
  venueLocation: {
    fontSize: 12,
    color: '#666',
  },
  locationNotesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
});
