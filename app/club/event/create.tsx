/**
 * Event Creation Wizard
 * Multi-step form for creating club events with validation
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import EventService, { EventType, EventVisibility, CreateEventInput } from '@/services/eventService';

export default function CreateEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const defaultType = (params.type as EventType) || 'regatta';

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CreateEventInput>({
    club_id: '', // TODO: Get from user's club context
    title: '',
    description: '',
    event_type: defaultType,
    start_date: '',
    end_date: '',
    registration_opens: '',
    registration_closes: '',
    max_participants: undefined,
    min_participants: undefined,
    registration_fee: undefined,
    visibility: 'club',
    contact_email: '',
    contact_phone: '',
    requirements: [],
    boat_classes: [],
  });
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [refundPolicy, setRefundPolicy] = useState<'full' | 'partial' | 'none'>('partial');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'HKD'>('USD');
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof CreateEventInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    try {
      setLoading(true);

      // Validation
      if (!formData.title.trim()) {
        Alert.alert('Error', 'Please enter event title');
        return;
      }

      if (!formData.start_date || !formData.end_date) {
        Alert.alert('Error', 'Please select event dates');
        return;
      }

      // TODO: Get actual club_id from user context
      if (!formData.club_id) {
        formData.club_id = 'temp-club-id'; // Placeholder
      }

      // Include payment configuration
      const eventData: CreateEventInput = {
        ...formData,
        currency: currency,
        payment_required: paymentRequired,
        refund_policy: refundPolicy,
      };

      const event = await EventService.createEvent(eventData);
      Alert.alert('Success', 'Event created successfully', [
        {
          text: 'OK',
          onPress: () => router.replace(`/club/event/${event.id}`),
        },
      ]);
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Event Details</ThemedText>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Event Title *</ThemedText>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(text) => updateField('title', text)}
          placeholder="e.g., Spring Championship Regatta"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Event Type *</ThemedText>
        <View style={styles.typeSelector}>
          {(['regatta', 'race_series', 'training', 'social', 'meeting'] as EventType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                formData.event_type === type && styles.typeButtonActive,
              ]}
              onPress={() => updateField('event_type', type)}
            >
              <ThemedText
                style={[
                  styles.typeButtonText,
                  formData.event_type === type && styles.typeButtonTextActive,
                ]}
              >
                {type.replace('_', ' ')}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Description</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => updateField('description', text)}
          placeholder="Event description..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Visibility</ThemedText>
        <View style={styles.visibilitySelector}>
          {(['public', 'club', 'private'] as EventVisibility[]).map((vis) => (
            <TouchableOpacity
              key={vis}
              style={[
                styles.visibilityButton,
                formData.visibility === vis && styles.visibilityButtonActive,
              ]}
              onPress={() => updateField('visibility', vis)}
            >
              <Ionicons
                name={
                  vis === 'public'
                    ? 'globe-outline'
                    : vis === 'club'
                    ? 'people-outline'
                    : 'lock-closed-outline'
                }
                size={20}
                color={formData.visibility === vis ? '#007AFF' : '#64748B'}
              />
              <ThemedText
                style={[
                  styles.visibilityButtonText,
                  formData.visibility === vis && styles.visibilityButtonTextActive,
                ]}
              >
                {vis}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Schedule & Registration</ThemedText>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Start Date *</ThemedText>
        <TextInput
          style={styles.input}
          value={formData.start_date}
          onChangeText={(text) => updateField('start_date', text)}
          placeholder="YYYY-MM-DD HH:MM"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>End Date *</ThemedText>
        <TextInput
          style={styles.input}
          value={formData.end_date}
          onChangeText={(text) => updateField('end_date', text)}
          placeholder="YYYY-MM-DD HH:MM"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Registration Opens</ThemedText>
        <TextInput
          style={styles.input}
          value={formData.registration_opens}
          onChangeText={(text) => updateField('registration_opens', text)}
          placeholder="YYYY-MM-DD HH:MM (optional)"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Registration Closes</ThemedText>
        <TextInput
          style={styles.input}
          value={formData.registration_closes}
          onChangeText={(text) => updateField('registration_closes', text)}
          placeholder="YYYY-MM-DD HH:MM (optional)"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, styles.halfWidth]}>
          <ThemedText style={styles.label}>Max Participants</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.max_participants?.toString() || ''}
            onChangeText={(text) =>
              updateField('max_participants', text ? parseInt(text) : undefined)
            }
            placeholder="Optional"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
          />
        </View>

        <View style={[styles.formGroup, styles.halfWidth]}>
          <ThemedText style={styles.label}>Currency</ThemedText>
          <View style={styles.currencySelector}>
            {(['USD', 'EUR', 'GBP', 'HKD'] as const).map((curr) => (
              <TouchableOpacity
                key={curr}
                style={[
                  styles.currencyButton,
                  currency === curr && styles.currencyButtonActive,
                ]}
                onPress={() => setCurrency(curr)}
              >
                <ThemedText
                  style={[
                    styles.currencyButtonText,
                    currency === curr && styles.currencyButtonTextActive,
                  ]}
                >
                  {curr}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.formGroup}>
        <View style={styles.rowHeader}>
          <ThemedText style={styles.label}>Entry Fee</ThemedText>
          <View style={styles.switchContainer}>
            <ThemedText style={styles.switchLabel}>
              {paymentRequired ? 'Required' : 'Optional'}
            </ThemedText>
            <Switch
              value={paymentRequired}
              onValueChange={setPaymentRequired}
              trackColor={{ false: '#CBD5E1', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
        <View style={styles.feeInputContainer}>
          <ThemedText style={styles.currencySymbol}>
            {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : 'HK$'}
          </ThemedText>
          <TextInput
            style={styles.feeInput}
            value={formData.registration_fee?.toString() || ''}
            onChangeText={(text) =>
              updateField('registration_fee', text ? parseFloat(text) : undefined)
            }
            placeholder="0.00"
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {formData.registration_fee && formData.registration_fee > 0 && (
        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Refund Policy</ThemedText>
          <View style={styles.refundPolicySelector}>
            <TouchableOpacity
              style={[
                styles.policyButton,
                refundPolicy === 'full' && styles.policyButtonActive,
              ]}
              onPress={() => setRefundPolicy('full')}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={refundPolicy === 'full' ? '#10B981' : '#94A3B8'}
              />
              <View style={styles.policyTextContainer}>
                <ThemedText
                  style={[
                    styles.policyTitle,
                    refundPolicy === 'full' && styles.policyTitleActive,
                  ]}
                >
                  Full Refund
                </ThemedText>
                <ThemedText style={styles.policyDescription}>
                  100% refund up to 24h before
                </ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.policyButton,
                refundPolicy === 'partial' && styles.policyButtonActive,
              ]}
              onPress={() => setRefundPolicy('partial')}
            >
              <Ionicons
                name="time"
                size={20}
                color={refundPolicy === 'partial' ? '#F59E0B' : '#94A3B8'}
              />
              <View style={styles.policyTextContainer}>
                <ThemedText
                  style={[
                    styles.policyTitle,
                    refundPolicy === 'partial' && styles.policyTitleActive,
                  ]}
                >
                  Partial Refund
                </ThemedText>
                <ThemedText style={styles.policyDescription}>
                  50% refund 12-24h before
                </ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.policyButton,
                refundPolicy === 'none' && styles.policyButtonActive,
              ]}
              onPress={() => setRefundPolicy('none')}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={refundPolicy === 'none' ? '#EF4444' : '#94A3B8'}
              />
              <View style={styles.policyTextContainer}>
                <ThemedText
                  style={[
                    styles.policyTitle,
                    refundPolicy === 'none' && styles.policyTitleActive,
                  ]}
                >
                  No Refunds
                </ThemedText>
                <ThemedText style={styles.policyDescription}>
                  All sales final
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Additional Details</ThemedText>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Contact Email</ThemedText>
        <TextInput
          style={styles.input}
          value={formData.contact_email}
          onChangeText={(text) => updateField('contact_email', text)}
          placeholder="events@yacht-club.com"
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Contact Phone</ThemedText>
        <TextInput
          style={styles.input}
          value={formData.contact_phone}
          onChangeText={(text) => updateField('contact_phone', text)}
          placeholder="+1 234 567 8900"
          placeholderTextColor="#94A3B8"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Boat Classes (comma separated)</ThemedText>
        <TextInput
          style={styles.input}
          value={formData.boat_classes?.join(', ') || ''}
          onChangeText={(text) =>
            updateField(
              'boat_classes',
              text.split(',').map((c) => c.trim()).filter(Boolean)
            )
          }
          placeholder="e.g., Dragon, J/70, Laser"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Requirements (comma separated)</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.requirements?.join(', ') || ''}
          onChangeText={(text) =>
            updateField(
              'requirements',
              text.split(',').map((r) => r.trim()).filter(Boolean)
            )
          }
          placeholder="e.g., Life jacket required, Boat insurance"
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Create Event</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]} />
        <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]} />
        <View style={[styles.progressStep, step >= 3 && styles.progressStepActive]} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => setStep(step - 1)}
          >
            <ThemedText style={styles.buttonSecondaryText}>Back</ThemedText>
          </TouchableOpacity>
        )}

        {step < 3 ? (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, step === 1 && styles.buttonFull]}
            onPress={() => setStep(step + 1)}
          >
            <ThemedText style={styles.buttonPrimaryText}>Next</ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleCreate}
            disabled={loading}
          >
            <ThemedText style={styles.buttonPrimaryText}>
              {loading ? 'Creating...' : 'Create Event'}
            </ThemedText>
          </TouchableOpacity>
        )}
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
  progressBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#007AFF',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'capitalize',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  visibilitySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  visibilityButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#EFF6FF',
  },
  visibilityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'capitalize',
  },
  visibilityButtonTextActive: {
    color: '#007AFF',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFull: {
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonSecondary: {
    backgroundColor: '#F1F5F9',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  currencySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  currencyButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  currencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  currencyButtonTextActive: {
    color: '#FFFFFF',
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  feeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingLeft: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 4,
  },
  feeInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  refundPolicySelector: {
    gap: 12,
  },
  policyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  policyButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#EFF6FF',
  },
  policyTextContainer: {
    flex: 1,
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  policyTitleActive: {
    color: '#007AFF',
  },
  policyDescription: {
    fontSize: 12,
    color: '#64748B',
  },
});
