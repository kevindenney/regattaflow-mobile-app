/**
 * Integrated Race Registration with Payment Flow
 * Complete workflow: Form → Payment → Confirmation
 */

import React, { useState } from 'react';
import { View, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { VStack, Text, Button, Card } from '@/components/ui';
import { CheckCircle } from 'lucide-react-native';
import { RaceRegistrationForm } from './RaceRegistrationForm';
import { PaymentFlowComponent } from './PaymentFlowComponent';
import { raceRegistrationService, RaceEntry } from '@/services/RaceRegistrationService';

interface RaceRegistrationWithPaymentProps {
  regattaId: string;
  userId: string;
  onComplete?: () => void;
}

type RegistrationStep = 'form' | 'payment' | 'confirmation';

export function RaceRegistrationWithPayment({
  regattaId,
  userId,
  onComplete,
}: RaceRegistrationWithPaymentProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('form');
  const [entryId, setEntryId] = useState<string | null>(null);
  const [entryNumber, setEntryNumber] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  /**
   * Step 1: Handle form submission - create draft entry
   */
  const handleFormSuccess = async (createdEntryId: string) => {
    try {
      setProcessing(true);

      // Get entry details to check if payment is required
      const entry = await raceRegistrationService.getEntry(createdEntryId);

      if (!entry) {
        throw new Error('Failed to load entry details');
      }

      setEntryId(createdEntryId);
      setEntryNumber(entry.entry_number || null);

      // If entry fee is 0, skip payment
      if (entry.entry_fee_amount === 0) {
        // Mark as confirmed without payment
        await raceRegistrationService.confirmPayment(createdEntryId, 'free_entry');
        setCurrentStep('confirmation');
      } else {
        // Proceed to payment
        setCurrentStep('payment');
      }
    } catch (error: any) {
      console.error('Error processing registration:', error);
      Alert.alert('Error', error.message || 'Failed to process registration');
    } finally {
      setProcessing(false);
    }
  };

  const handleFormQueued = (entry: RaceEntry) => {
    Alert.alert('Offline', 'Your entry will sync automatically once you are back online.');
    handleFormCancel();
  };

  /**
   * Step 2: Handle payment success
   */
  const handlePaymentSuccess = () => {
    setCurrentStep('confirmation');
  };

  /**
   * Handle form cancellation
   */
  const handleFormCancel = () => {
    if (onComplete) {
      onComplete();
    } else {
      router.back();
    }
  };

  /**
   * Handle payment cancellation
   */
  const handlePaymentCancel = () => {
    Alert.alert(
      'Cancel Registration',
      'Are you sure you want to cancel your registration? Your entry will be saved as a draft.',
      [
        {
          text: 'Continue Registration',
          style: 'cancel',
        },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            if (onComplete) {
              onComplete();
            } else {
              router.back();
            }
          },
        },
      ]
    );
  };

  /**
   * Handle completion
   */
  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    } else {
      router.back();
    }
  };

  /**
   * Render progress indicator
   */
  const renderProgress = () => {
    const steps = [
      { key: 'form', label: 'Registration' },
      { key: 'payment', label: 'Payment' },
      { key: 'confirmation', label: 'Confirmation' },
    ];

    const currentIndex = steps.findIndex(s => s.key === currentStep);

    return (
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {steps.map((step, index) => (
            <React.Fragment key={step.key}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: index <= currentIndex ? '#667eea' : '#e5e7eb',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: index <= currentIndex ? 'white' : '#6b7280',
                      fontWeight: '600',
                    }}
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text
                  size="xs"
                  style={{
                    marginTop: 4,
                    color: index <= currentIndex ? '#667eea' : '#6b7280',
                  }}
                >
                  {step.label}
                </Text>
              </View>
              {index < steps.length - 1 && (
                <View
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor: index < currentIndex ? '#667eea' : '#e5e7eb',
                    marginHorizontal: 8,
                    marginBottom: 20,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Progress Indicator */}
      {renderProgress()}

      {/* Step Content */}
      {currentStep === 'form' && (
        <RaceRegistrationForm
          regattaId={regattaId}
          userId={userId}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          onQueued={handleFormQueued}
        />
      )}

      {currentStep === 'payment' && entryId && (
        <PaymentFlowComponent
          entryId={entryId}
          userId={userId}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}

      {currentStep === 'confirmation' && (
        <View style={{ flex: 1, padding: 20 }}>
          <Card backgroundColor="$success50" padding="$6">
            <VStack space="lg" alignItems="center">
              <CheckCircle size={64} color="#059669" />

              <Text size="2xl" weight="bold" color="$success900" textAlign="center">
                Registration Confirmed!
              </Text>

              {entryNumber && (
                <Card backgroundColor="white" padding="$4" width="100%">
                  <VStack space="xs" alignItems="center">
                    <Text size="sm" color="$gray600">
                      Entry Number
                    </Text>
                    <Text size="2xl" weight="bold" color="$primary600">
                      {entryNumber}
                    </Text>
                  </VStack>
                </Card>
              )}

              <Text textAlign="center" color="$success800">
                Your race entry has been confirmed. You will receive a confirmation email shortly with all the details.
              </Text>

              <VStack space="sm" width="100%">
                <Text size="sm" weight="semibold" color="$success900">
                  Next Steps:
                </Text>
                <Text size="sm" color="$success800">
                  • Check your email for confirmation details
                </Text>
                <Text size="sm" color="$success800">
                  • Download sailing instructions when available
                </Text>
                <Text size="sm" color="$success800">
                  • Review race schedule and course information
                </Text>
                <Text size="sm" color="$success800">
                  • Prepare your boat and equipment
                </Text>
              </VStack>

              <Button onPress={handleComplete} width="100%" marginTop="$4">
                <Text color="white" weight="semibold">
                  Done
                </Text>
              </Button>
            </VStack>
          </Card>
        </View>
      )}
    </View>
  );
}
