/**
 * Event Registration Screen
 * Register for club events (regattas, training, social, etc.)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import EventService, { ClubEvent, CreateRegistrationInput } from '@/services/eventService';
import { format } from 'date-fns';
import { useAuth } from '@/providers/AuthProvider';

export default function EventRegistrationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventId = id as string;
  const { user, userProfile } = useAuth();

  const [event, setEvent] = useState<ClubEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [participantPhone, setParticipantPhone] = useState('');
  const [boatClass, setBoatClass] = useState('');
  const [boatName, setBoatName] = useState('');
  const [sailNumber, setSailNumber] = useState('');
  const [crewCount, setCrewCount] = useState('1');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  useEffect(() => {
    // Pre-fill form with user data
    if (userProfile) {
      setParticipantName(userProfile.full_name || '');
      setParticipantEmail(user?.email || '');
    } else if (user?.email) {
      setParticipantEmail(user.email);
    }
  }, [userProfile, user]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const eventData = await EventService.getEvent(eventId);
      setEvent(eventData);

      // Set default boat class if only one option
      if (eventData?.boat_classes && eventData.boat_classes.length === 1) {
        setBoatClass(eventData.boat_classes[0]);
      }
    } catch (error) {
      console.error('Error loading event:', error);
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): string | null => {
    if (!participantName.trim()) return 'Please enter your name';
    if (!participantEmail.trim()) return 'Please enter your email';
    if (!participantEmail.includes('@')) return 'Please enter a valid email';
    if (event?.boat_classes && event.boat_classes.length > 0 && !boatClass) {
      return 'Please select a boat class';
    }
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Missing Information', error);
      return;
    }

    setSubmitting(true);
    try {
      const input: CreateRegistrationInput = {
        event_id: eventId,
        participant_name: participantName.trim(),
        participant_email: participantEmail.trim(),
        participant_phone: participantPhone.trim() || undefined,
        boat_class: boatClass || undefined,
        boat_name: boatName.trim() || undefined,
        sail_number: sailNumber.trim() || undefined,
        crew_count: parseInt(crewCount) || 1,
        emergency_contact_name: emergencyContactName.trim() || undefined,
        emergency_contact_phone: emergencyContactPhone.trim() || undefined,
        special_requirements: specialRequirements.trim() || undefined,
      };

      await EventService.createRegistration(input);

      Alert.alert(
        'Registration Submitted!',
        'Your registration has been submitted. You will receive a confirmation email once approved.',
        [{ text: 'OK', onPress: () => router.replace(`/event/${eventId}`) }]
      );
    } catch (error: any) {
      console.error('Error registering:', error);
      Alert.alert(
        'Registration Failed',
        error.message || 'Failed to submit registration. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centeredContainer}>
          <Ionicons name="lock-closed" size={48} color="#64748B" />
          <ThemedText style={styles.errorTitle}>Sign In Required</ThemedText>
          <ThemedText style={styles.errorText}>
            Please sign in to register for this event.
          </ThemedText>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <ThemedText style={styles.primaryButtonText}>Sign In</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <ThemedText style={styles.loadingText}>Loading event...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!event) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centeredContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <ThemedText style={styles.errorTitle}>Event Not Found</ThemedText>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
            <ThemedText style={styles.primaryButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Register</ThemedText>
          <ThemedText style={styles.headerSubtitle} numberOfLines={1}>
            {event.title}
          </ThemedText>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Event Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Ionicons name="calendar" size={18} color="#0EA5E9" />
              <ThemedText style={styles.summaryText}>
                {format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')}
              </ThemedText>
            </View>
            {event.registration_fee && event.registration_fee > 0 && (
              <View style={styles.summaryRow}>
                <Ionicons name="cash" size={18} color="#10B981" />
                <ThemedText style={styles.summaryText}>
                  Entry Fee: {event.currency} {event.registration_fee.toFixed(2)}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Personal Information</ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Full Name *</ThemedText>
              <TextInput
                style={styles.input}
                value={participantName}
                onChangeText={setParticipantName}
                placeholder="Enter your full name"
                placeholderTextColor="#94A3B8"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Email *</ThemedText>
              <TextInput
                style={styles.input}
                value={participantEmail}
                onChangeText={setParticipantEmail}
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Phone</ThemedText>
              <TextInput
                style={styles.input}
                value={participantPhone}
                onChangeText={setParticipantPhone}
                placeholder="Enter your phone number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Boat Information */}
          {(event.event_type === 'regatta' || event.event_type === 'race_series') && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Boat Information</ThemedText>

              {event.boat_classes && event.boat_classes.length > 0 && (
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Boat Class *</ThemedText>
                  <View style={styles.classOptions}>
                    {event.boat_classes.map((cls) => (
                      <TouchableOpacity
                        key={cls}
                        style={[
                          styles.classOption,
                          boatClass === cls && styles.classOptionSelected,
                        ]}
                        onPress={() => setBoatClass(cls)}
                      >
                        <ThemedText
                          style={[
                            styles.classOptionText,
                            boatClass === cls && styles.classOptionTextSelected,
                          ]}
                        >
                          {cls}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Boat Name</ThemedText>
                <TextInput
                  style={styles.input}
                  value={boatName}
                  onChangeText={setBoatName}
                  placeholder="Enter boat name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Sail Number</ThemedText>
                <TextInput
                  style={styles.input}
                  value={sailNumber}
                  onChangeText={setSailNumber}
                  placeholder="Enter sail number"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Crew Count</ThemedText>
                <TextInput
                  style={styles.input}
                  value={crewCount}
                  onChangeText={setCrewCount}
                  placeholder="1"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                />
              </View>
            </View>
          )}

          {/* Emergency Contact */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Emergency Contact</ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Contact Name</ThemedText>
              <TextInput
                style={styles.input}
                value={emergencyContactName}
                onChangeText={setEmergencyContactName}
                placeholder="Emergency contact name"
                placeholderTextColor="#94A3B8"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Contact Phone</ThemedText>
              <TextInput
                style={styles.input}
                value={emergencyContactPhone}
                onChangeText={setEmergencyContactPhone}
                placeholder="Emergency contact phone"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Special Requirements */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Additional Information</ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Special Requirements or Notes</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={specialRequirements}
                onChangeText={setSpecialRequirements}
                placeholder="Any dietary requirements, accessibility needs, or other notes..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Fee Notice */}
          {event.registration_fee && event.registration_fee > 0 && (
            <View style={styles.feeNotice}>
              <Ionicons name="information-circle" size={20} color="#0EA5E9" />
              <ThemedText style={styles.feeNoticeText}>
                Payment of {event.currency} {event.registration_fee.toFixed(2)} will be collected after your
                registration is approved.
              </ThemedText>
            </View>
          )}

          {/* Bottom spacing */}
          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <ThemedText style={styles.submitButtonText}>Submit Registration</ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  errorText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#EFF6FF',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 14,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E40AF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#1E293B',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  classOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  classOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  classOptionSelected: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  classOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  classOptionTextSelected: {
    color: '#FFFFFF',
  },
  feeNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  feeNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#0369A1',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0EA5E9',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

