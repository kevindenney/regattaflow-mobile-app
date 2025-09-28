import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { CoachProfile, CoachService, CoachingSession } from '../../../types/coach';
import { CoachMarketplaceService } from '../../../services/CoachService';
import PaymentService from '../../../services/PaymentService';
import BookingCalendar, { BookingSlot } from './BookingCalendar';
import PaymentConfirmation from '../PaymentConfirmation';

interface BookingFlowProps {
  coach: CoachProfile;
  service: CoachService;
  visible: boolean;
  onClose: () => void;
  onSuccess: (session: CoachingSession) => void;
}

type BookingStep = 'calendar' | 'details' | 'confirm' | 'payment';

export default function BookingFlow({ coach, service, visible, onClose, onSuccess }: BookingFlowProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<BookingStep>('calendar');
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [sessionDetails, setSessionDetails] = useState({
    goals: '',
    experience: '',
    questions: '',
  });
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [createdSession, setCreatedSession] = useState<CoachingSession | null>(null);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);

  const handleSlotSelection = (slot: BookingSlot) => {
    setSelectedSlot(slot);
    setCurrentStep('details');
  };

  const handleDetailsSubmit = () => {
    if (!sessionDetails.goals.trim()) {
      Alert.alert('Missing Information', 'Please describe your goals for this session.');
      return;
    }
    setCurrentStep('confirm');
  };

  const handleBookingConfirm = async () => {
    if (!user || !selectedSlot) {
      Alert.alert('Error', 'Missing booking information. Please try again.');
      return;
    }

    setLoading(true);
    try {
      // Create session booking
      const sessionStart = new Date(selectedSlot.date);
      const [startHour, startMin] = selectedSlot.startTime.split(':').map(Number);
      sessionStart.setHours(startHour, startMin, 0, 0);

      const sessionEnd = new Date(selectedSlot.date);
      const [endHour, endMin] = selectedSlot.endTime.split(':').map(Number);
      sessionEnd.setHours(endHour, endMin, 0, 0);

      const sessionData: Partial<CoachingSession> = {
        coach_id: coach.id,
        student_id: user.id,
        service_id: service.id,
        title: `${service.title} with ${coach.first_name} ${coach.last_name}`,
        description: service.description,
        scheduled_start: sessionStart.toISOString(),
        scheduled_end: sessionEnd.toISOString(),
        student_goals: sessionDetails.goals,
        status: 'pending',
        total_amount: service.base_price,
        platform_fee: Math.round(service.base_price * 0.15), // 15% platform fee
        coach_payout: Math.round(service.base_price * 0.85),
        currency: service.currency,
        payment_status: 'pending',
      };

      const session = await CoachMarketplaceService.bookSession(sessionData);
      setCreatedSession(session);
      setCurrentStep('payment');

      // Process payment immediately
      await handlePaymentProcess(session.id);
    } catch (error) {
      console.error('Error booking session:', error);
      Alert.alert('Booking Error', 'Failed to book the session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentProcess = async (sessionId: string) => {
    setPaymentProcessing(true);
    try {
      // Create payment intent
      const paymentIntent = await PaymentService.createPaymentIntent(sessionId);

      // Process payment using Stripe Payment Sheet
      const paymentResult = await PaymentService.processPayment(paymentIntent);

      if (paymentResult.success && paymentResult.payment_intent_id) {
        // Confirm payment and update session
        await PaymentService.confirmPayment(sessionId, paymentResult.payment_intent_id);

        // Show payment confirmation modal
        const updatedSession = { ...createdSession, payment_status: 'captured', status: 'confirmed' };
        setCreatedSession(updatedSession);
        setShowPaymentConfirmation(true);
        onSuccess(updatedSession);
      } else {
        // Payment failed or cancelled
        Alert.alert(
          'Payment Failed',
          paymentResult.error || 'Payment could not be processed. Please try again.',
          [
            {
              text: 'Try Again',
              onPress: () => setCurrentStep('confirm'),
            },
            {
              text: 'Cancel Booking',
              style: 'destructive',
              onPress: () => onClose(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      Alert.alert(
        'Payment Error',
        'There was an error processing your payment. Please try again.',
        [
          {
            text: 'Try Again',
            onPress: () => setCurrentStep('confirm'),
          },
          {
            text: 'Cancel Booking',
            style: 'destructive',
            onPress: () => onClose(),
          },
        ]
      );
    } finally {
      setPaymentProcessing(false);
    }
  };

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'calendar':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Select Date & Time</Text>
            <BookingCalendar
              coachId={coach.id}
              serviceId={service.id}
              onSlotSelected={handleSlotSelection}
            />
          </View>
        );

      case 'details':
        return (
          <ScrollView style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Session Details</Text>

            <View style={styles.selectedSlotCard}>
              <Text style={styles.selectedSlotLabel}>Selected Time</Text>
              <Text style={styles.selectedSlotText}>
                {selectedSlot?.date.toLocaleDateString()} at {selectedSlot?.startTime}
              </Text>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>What are your goals for this session? *</Text>
              <TextInput
                style={styles.textArea}
                value={sessionDetails.goals}
                onChangeText={(text) => setSessionDetails(prev => ({ ...prev, goals: text }))}
                placeholder="E.g., Improve spinnaker handling, race starts, tactical decisions..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Your sailing experience</Text>
              <TextInput
                style={styles.textArea}
                value={sessionDetails.experience}
                onChangeText={(text) => setSessionDetails(prev => ({ ...prev, experience: text }))}
                placeholder="E.g., 5 years racing Dragons, competed in 3 world championships..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Specific questions or topics</Text>
              <TextInput
                style={styles.textArea}
                value={sessionDetails.questions}
                onChangeText={(text) => setSessionDetails(prev => ({ ...prev, questions: text }))}
                placeholder="Any specific questions you'd like to discuss?"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setCurrentStep('calendar')}
              >
                <Text style={styles.buttonSecondaryText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleDetailsSubmit}
              >
                <Text style={styles.buttonPrimaryText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );

      case 'confirm':
        return (
          <ScrollView style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Confirm Booking</Text>

            <View style={styles.confirmationCard}>
              <Text style={styles.confirmationSection}>Coach</Text>
              <Text style={styles.confirmationText}>
                {coach.first_name} {coach.last_name}
              </Text>

              <Text style={styles.confirmationSection}>Service</Text>
              <Text style={styles.confirmationText}>{service.title}</Text>

              <Text style={styles.confirmationSection}>Date & Time</Text>
              <Text style={styles.confirmationText}>
                {selectedSlot?.date.toLocaleDateString()} at {selectedSlot?.startTime}
              </Text>

              <Text style={styles.confirmationSection}>Duration</Text>
              <Text style={styles.confirmationText}>{service.duration_minutes} minutes</Text>

              <Text style={styles.confirmationSection}>Your Goals</Text>
              <Text style={styles.confirmationText}>{sessionDetails.goals}</Text>

              <View style={styles.pricingSection}>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Service Fee</Text>
                  <Text style={styles.pricingValue}>{formatPrice(service.base_price)}</Text>
                </View>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Platform Fee (15%)</Text>
                  <Text style={styles.pricingValue}>
                    {formatPrice(Math.round(service.base_price * 0.15))}
                  </Text>
                </View>
                <View style={[styles.pricingRow, styles.pricingTotal]}>
                  <Text style={styles.pricingTotalLabel}>Total</Text>
                  <Text style={styles.pricingTotalValue}>
                    {formatPrice(service.base_price)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setCurrentStep('details')}
                disabled={loading}
              >
                <Text style={styles.buttonSecondaryText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleBookingConfirm}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonPrimaryText}>Confirm & Pay</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        );

      case 'payment':
        return (
          <View style={[styles.stepContainer, styles.paymentContainer]}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.paymentText}>
              {paymentProcessing ? 'Processing payment...' : 'Preparing payment...'}
            </Text>
            <Text style={styles.paymentSubtext}>
              {paymentProcessing
                ? 'Please complete your payment in the payment sheet.'
                : 'Setting up secure payment processing with Stripe.'}
            </Text>
            {!paymentProcessing && (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary, { marginTop: 24 }]}
                onPress={() => setCurrentStep('confirm')}
              >
                <Text style={styles.buttonSecondaryText}>Back to Confirmation</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Session</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, currentStep !== 'calendar' && styles.progressStepComplete]} />
          <View style={[styles.progressStep, ['confirm', 'payment'].includes(currentStep) && styles.progressStepComplete]} />
          <View style={[styles.progressStep, currentStep === 'payment' && styles.progressStepComplete]} />
        </View>

        {renderStep()}

        {/* Payment Confirmation Modal */}
        {createdSession && (
          <PaymentConfirmation
            session={createdSession}
            coach={coach}
            visible={showPaymentConfirmation}
            onClose={() => {
              setShowPaymentConfirmation(false);
              onClose();
            }}
            onViewSessions={() => {
              setShowPaymentConfirmation(false);
              onClose();
              router.push('/sessions');
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeButton: {
    fontSize: 16,
    color: '#666',
    width: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  progressBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  progressStepComplete: {
    backgroundColor: '#0066CC',
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 24,
  },
  selectedSlotCard: {
    backgroundColor: '#E6F3FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  selectedSlotLabel: {
    fontSize: 14,
    color: '#0066CC',
    marginBottom: 4,
  },
  selectedSlotText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#0066CC',
  },
  buttonSecondary: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmationCard: {
    backgroundColor: '#F8F8F8',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  confirmationSection: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    marginBottom: 4,
  },
  confirmationText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  pricingSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pricingLabel: {
    fontSize: 14,
    color: '#666',
  },
  pricingValue: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  pricingTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  pricingTotalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  pricingTotalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0066CC',
  },
  paymentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 24,
  },
  paymentSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});