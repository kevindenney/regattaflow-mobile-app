import { coachingService } from '@/services/CoachingService';
import { supabase } from '@/services/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
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
import { showAlert, showAlertWithButtons } from '@/lib/utils/crossPlatformAlert';

interface CustomCharge {
  id: string;
  label: string;
  amount_cents: number;
  description?: string;
  is_active: boolean;
  session_types?: string[];
}

interface CoachPricing {
  hourly_rate: number | null;
  currency: string;
  session_type_rates: Record<string, number>;
  custom_charges: CustomCharge[];
}

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

  // Custom charges state
  const [coachPricing, setCoachPricing] = useState<CoachPricing | null>(null);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [selectedChargeIds, setSelectedChargeIds] = useState<string[]>([]);

  useEffect(() => {
    loadVenues();
    loadCoachPricing();
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

  const loadCoachPricing = async () => {
    if (!params.coachId) return;

    try {
      setPricingLoading(true);
      const pricing = await coachingService.getCoachPricing(params.coachId);
      if (pricing) {
        setCoachPricing({
          hourly_rate: pricing.hourly_rate,
          currency: pricing.currency,
          session_type_rates: pricing.session_type_rates,
          custom_charges: pricing.custom_charges,
        });
      }
    } catch (error) {
      console.error('Error loading coach pricing:', error);
    } finally {
      setPricingLoading(false);
    }
  };

  // Get applicable custom charges for the selected session type
  const applicableCharges = useMemo(() => {
    if (!coachPricing?.custom_charges) return [];

    return coachPricing.custom_charges.filter(charge => {
      if (!charge.is_active) return false;
      // If session_types is specified, only show for those types
      if (charge.session_types && charge.session_types.length > 0) {
        // Map our session type to the coach's session types
        const sessionTypeMap: Record<string, string> = {
          'one_on_one': 'on_water',
          'video_analysis': 'video_review',
          'race_debrief': 'strategy',
          'group': 'on_water',
        };
        const mappedType = sessionTypeMap[sessionType] || sessionType;
        return charge.session_types.includes(mappedType);
      }
      return true;
    });
  }, [coachPricing, sessionType]);

  const toggleCharge = (chargeId: string) => {
    setSelectedChargeIds(prev =>
      prev.includes(chargeId)
        ? prev.filter(id => id !== chargeId)
        : [...prev, chargeId]
    );
  };

  const calculateSessionCost = () => {
    if (!params.startTime || !params.endTime) return { base: 0, charges: 0, total: 0 };

    const start = new Date(params.startTime);
    const end = new Date(params.endTime);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    // Get the rate for this session type, or fall back to hourly rate from params
    let rateInCents = parseInt(params.hourlyRate) || 0;

    if (coachPricing) {
      // Check for session-type-specific rate
      const sessionTypeMap: Record<string, string> = {
        'one_on_one': 'on_water',
        'video_analysis': 'video_review',
        'race_debrief': 'strategy',
        'group': 'on_water',
      };
      const mappedType = sessionTypeMap[sessionType] || sessionType;
      const typeRate = coachPricing.session_type_rates[mappedType];

      if (typeRate) {
        rateInCents = typeRate;
      } else if (coachPricing.hourly_rate) {
        rateInCents = coachPricing.hourly_rate;
      }
    }

    const baseCost = (rateInCents / 100) * hours;

    // Calculate custom charges
    let chargesCost = 0;
    selectedChargeIds.forEach(chargeId => {
      const charge = coachPricing?.custom_charges?.find(c => c.id === chargeId);
      if (charge) {
        chargesCost += charge.amount_cents / 100;
      }
    });

    return {
      base: baseCost,
      charges: chargesCost,
      total: baseCost + chargesCost,
    };
  };

  const costs = calculateSessionCost();

  const handleSubmitBooking = async () => {
    try {
      setLoading(true);

      const sessionCosts = calculateSessionCost();
      const totalCostCents = Math.round(sessionCosts.total * 100);

      // Get selected custom charges for the booking
      const selectedCharges = selectedChargeIds
        .map(id => coachPricing?.custom_charges?.find(c => c.id === id))
        .filter(Boolean);

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
          customCharges: selectedCharges,
        }
      );

      // Show success message
      showAlertWithButtons(
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
      showAlert('Error', error.message || 'Failed to send booking request. Please try again.');
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
            <Text style={styles.detailLabel}>Base Rate</Text>
            <Text style={styles.detailValue}>
              ${costs.base.toFixed(2)}
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

        {/* Custom Charges / Add-ons */}
        {!pricingLoading && applicableCharges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add-ons (Optional)</Text>
            <Text style={styles.addonsSubtitle}>
              Select any additional services you need for your session
            </Text>
            <View style={styles.chargesContainer}>
              {applicableCharges.map((charge) => (
                <TouchableOpacity
                  key={charge.id}
                  style={[
                    styles.chargeCard,
                    selectedChargeIds.includes(charge.id) && styles.chargeCardActive,
                  ]}
                  onPress={() => toggleCharge(charge.id)}
                >
                  <View style={styles.chargeHeader}>
                    <View style={styles.chargeCheckbox}>
                      {selectedChargeIds.includes(charge.id) && (
                        <Ionicons name="checkmark" size={16} color="#007AFF" />
                      )}
                    </View>
                    <View style={styles.chargeInfo}>
                      <Text style={styles.chargeLabel}>{charge.label}</Text>
                      {charge.description && (
                        <Text style={styles.chargeDescription}>{charge.description}</Text>
                      )}
                    </View>
                    <Text style={styles.chargeAmount}>
                      +${(charge.amount_cents / 100).toFixed(2)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

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
          {costs.charges > 0 && (
            <View style={styles.costBreakdown}>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Base Rate</Text>
                <Text style={styles.costValue}>${costs.base.toFixed(2)}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Add-ons</Text>
                <Text style={styles.costValue}>${costs.charges.toFixed(2)}</Text>
              </View>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>${costs.total.toFixed(2)}</Text>
          </View>
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
    ...Platform.select({
      web: {
        boxShadow: '0px -2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
      },
    }),
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
  addonsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  chargesContainer: {
    gap: 8,
  },
  chargeCard: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  chargeCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E8F4FD',
  },
  chargeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  chargeCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chargeInfo: {
    flex: 1,
    marginRight: 12,
  },
  chargeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  chargeDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  chargeAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  costBreakdown: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  costLabel: {
    fontSize: 14,
    color: '#666',
  },
  costValue: {
    fontSize: 14,
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
