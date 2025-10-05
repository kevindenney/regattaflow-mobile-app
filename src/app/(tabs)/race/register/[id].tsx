/**
 * Race Registration Screen
 * Multi-step race entry registration with payment and document upload
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Badge,
  Spinner,
  SafeAreaView,
  StatusBar,
} from '@/src/components/ui';
import { ChevronLeft, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/src/providers/AuthProvider';
import { RaceRegistrationForm } from '@/src/components/registration/RaceRegistrationForm';
import { DocumentChecklistComponent } from '@/src/components/registration/DocumentChecklistComponent';
import { PaymentFlowComponent } from '@/src/components/registration/PaymentFlowComponent';
import { supabase } from '@/src/services/supabase';
import { raceRegistrationService } from '@/src/services/RaceRegistrationService';

type RegistrationStep = 'entry' | 'documents' | 'payment' | 'confirmation';

export default function RaceRegistrationScreen() {
  const { id: regattaId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<RegistrationStep>('entry');
  const [entryId, setEntryId] = useState<string | null>(null);
  const [regattaName, setRegattaName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [entryNumber, setEntryNumber] = useState<string>('');

  useEffect(() => {
    if (regattaId) {
      loadRegattaInfo();
    }
  }, [regattaId]);

  const loadRegattaInfo = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('club_race_calendar')
        .select('event_name')
        .eq('id', regattaId)
        .single();

      if (error) throw error;
      setRegattaName(data?.event_name || 'Race Registration');
    } catch (error) {
      console.error('Failed to load regatta info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEntryCreated = (newEntryId: string) => {
    setEntryId(newEntryId);
    setCurrentStep('documents');
  };

  const handleDocumentsComplete = () => {
    setCurrentStep('payment');
  };

  const handlePaymentComplete = async () => {
    // Load entry number and send confirmation email
    if (entryId) {
      const { data } = await supabase
        .from('race_entries')
        .select('entry_number')
        .eq('id', entryId)
        .single();

      if (data?.entry_number) {
        setEntryNumber(data.entry_number);
      }

      // Send confirmation email
      try {
        await raceRegistrationService.sendConfirmationEmail(entryId);
      } catch (error) {
        console.error('Failed to send confirmation email:', error);
        // Don't block the flow if email fails
      }
    }
    setCurrentStep('confirmation');
  };

  const handleBack = () => {
    if (currentStep === 'documents') {
      setCurrentStep('entry');
    } else if (currentStep === 'payment') {
      setCurrentStep('documents');
    } else {
      router.back();
    }
  };

  const handleComplete = () => {
    router.push('/(tabs)/races');
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text>Please sign in to register for races</Text>
          <Button onPress={() => router.push('/(auth)/login')} marginTop="$4">
            <Text color="white">Sign In</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Spinner size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const steps = [
    { key: 'entry', label: 'Entry Details', completed: currentStep !== 'entry' },
    { key: 'documents', label: 'Documents', completed: currentStep === 'payment' || currentStep === 'confirmation' },
    { key: 'payment', label: 'Payment', completed: currentStep === 'confirmation' },
    { key: 'confirmation', label: 'Confirmation', completed: false },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <VStack space="md" padding="$4" backgroundColor="white" borderBottomWidth={1} borderBottomColor="$gray200">
        <HStack space="md" alignItems="center">
          <Button variant="ghost" size="sm" onPress={handleBack}>
            <ChevronLeft size={24} color="#374151" />
          </Button>
          <VStack flex={1}>
            <Text size="lg" weight="bold">
              {regattaName}
            </Text>
            <Text size="sm" color="$gray600">
              Race Registration
            </Text>
          </VStack>
        </HStack>

        {/* Progress Steps */}
        <HStack space="xs" justifyContent="space-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.key}>
              <VStack flex={1} alignItems="center" space="xs">
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: step.completed
                      ? '#10b981'
                      : currentStep === step.key
                      ? '#3b82f6'
                      : '#e5e7eb',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {step.completed ? (
                    <CheckCircle size={20} color="white" />
                  ) : (
                    <Text
                      color={currentStep === step.key ? 'white' : '$gray500'}
                      weight="semibold"
                      size="sm"
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
                <Text
                  size="xs"
                  color={currentStep === step.key ? '$primary600' : '$gray500'}
                  weight={currentStep === step.key ? 'semibold' : 'normal'}
                  textAlign="center"
                >
                  {step.label}
                </Text>
              </VStack>
              {index < steps.length - 1 && (
                <View
                  style={{
                    width: 20,
                    height: 2,
                    backgroundColor: step.completed ? '#10b981' : '#e5e7eb',
                    alignSelf: 'center',
                    marginTop: -20,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </HStack>
      </VStack>

      {/* Content */}
      <ScrollView style={{ flex: 1 }}>
        {currentStep === 'entry' && (
          <RaceRegistrationForm
            regattaId={regattaId!}
            userId={user.id}
            onSuccess={handleEntryCreated}
            onCancel={() => router.back()}
          />
        )}

        {currentStep === 'documents' && entryId && (
          <VStack space="md" padding="$4">
            <Card backgroundColor="$blue50">
              <VStack space="sm" padding="$4">
                <Text size="sm" weight="semibold" color="$blue900">
                  Step 2: Upload Required Documents
                </Text>
                <Text size="xs" color="$blue800">
                  Upload all required documents to complete your registration
                </Text>
              </VStack>
            </Card>
            <DocumentChecklistComponent
              entryId={entryId}
              regattaId={regattaId!}
              onComplete={handleDocumentsComplete}
            />
            <HStack space="md" padding="$4">
              <Button flex={1} variant="outline" onPress={handleBack}>
                <Text>Back</Text>
              </Button>
              <Button flex={1} onPress={handleDocumentsComplete}>
                <Text color="white">Continue to Payment</Text>
              </Button>
            </HStack>
          </VStack>
        )}

        {currentStep === 'payment' && entryId && (
          <VStack space="md">
            <Card backgroundColor="$blue50" margin="$4">
              <VStack space="sm" padding="$4">
                <Text size="sm" weight="semibold" color="$blue900">
                  Step 3: Complete Payment
                </Text>
                <Text size="xs" color="$blue800">
                  Secure your race entry by completing payment
                </Text>
              </VStack>
            </Card>
            <PaymentFlowComponent
              entryId={entryId}
              userId={user.id}
              onSuccess={handlePaymentComplete}
              onCancel={handleBack}
            />
          </VStack>
        )}

        {currentStep === 'confirmation' && (
          <VStack space="lg" padding="$4" alignItems="center">
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#d1fae5',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 40,
              }}
            >
              <CheckCircle size={48} color="#059669" />
            </View>

            <VStack space="sm" alignItems="center">
              <Text size="2xl" weight="bold" textAlign="center">
                Registration Complete!
              </Text>
              <Text size="md" color="$gray600" textAlign="center">
                Your race entry has been successfully submitted
              </Text>
            </VStack>

            {entryNumber && (
              <Card backgroundColor="$primary50" padding="$6" alignItems="center">
                <Text size="sm" color="$gray600" marginBottom="$2">
                  Your Entry Number
                </Text>
                <Text size="3xl" weight="bold" color="$primary600">
                  {entryNumber}
                </Text>
              </Card>
            )}

            <Card backgroundColor="$gray50" padding="$4" width="100%">
              <VStack space="sm">
                <Text size="sm" weight="semibold">
                  What's Next?
                </Text>
                <Text size="xs" color="$gray600">
                  • You'll receive a confirmation email shortly
                </Text>
                <Text size="xs" color="$gray600">
                  • Check your race details in the Races tab
                </Text>
                <Text size="xs" color="$gray600">
                  • Download sailing instructions when available
                </Text>
                <Text size="xs" color="$gray600">
                  • Prepare your boat and crew for race day
                </Text>
              </VStack>
            </Card>

            <VStack space="md" width="100%" paddingTop="$4">
              <Button onPress={handleComplete} size="lg">
                <Text color="white" weight="semibold">
                  View My Races
                </Text>
              </Button>
              <Button variant="outline" onPress={() => router.push('/(tabs)/dashboard')}>
                <Text>Back to Dashboard</Text>
              </Button>
            </VStack>
          </VStack>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
