/**
 * Race Registration Screen
 * Multi-step race entry registration with payment and document upload
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { RaceRegistrationForm } from '@/components/registration/RaceRegistrationForm';
import { DocumentChecklistComponent } from '@/components/registration/DocumentChecklistComponent';
import { PaymentFlowComponent } from '@/components/registration/PaymentFlowComponent';
import { supabase } from '@/services/supabase';
import { raceRegistrationService } from '@/services/RaceRegistrationService';

type RegistrationStep = 'entry' | 'documents' | 'payment' | 'confirmation';

interface StepDescriptor {
  key: RegistrationStep;
  label: string;
  completed: boolean;
}

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
      void loadRegattaInfo();
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
      setRegattaName('Race Registration');
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
    if (entryId) {
      const { data } = await supabase
        .from('race_entries')
        .select('entry_number')
        .eq('id', entryId)
        .single();

      if (data?.entry_number) {
        setEntryNumber(data.entry_number);
      }

      try {
        await raceRegistrationService.sendConfirmationEmail(entryId);
      } catch (error) {
        console.error('Failed to send confirmation email:', error);
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

  const steps: StepDescriptor[] = useMemo(
    () => [
      { key: 'entry', label: 'Entry Details', completed: currentStep !== 'entry' },
      {
        key: 'documents',
        label: 'Documents',
        completed: currentStep === 'payment' || currentStep === 'confirmation',
      },
      { key: 'payment', label: 'Payment', completed: currentStep === 'confirmation' },
      { key: 'confirmation', label: 'Confirmation', completed: false },
    ],
    [currentStep]
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.fullscreen}>
        <View style={styles.signInContainer}>
          <Text style={styles.signInTitle}>Please sign in to register for races</Text>
          <TouchableOpacity
            style={[styles.primaryButton, styles.signInButton]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.fullscreen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>{regattaName}</Text>
          <Text style={styles.headerSubtitle}>Race Registration</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            <View style={styles.progressItem}>
              <View
                style={[
                  styles.progressCircle,
                  step.completed
                    ? styles.progressCircleCompleted
                    : currentStep === step.key
                    ? styles.progressCircleActive
                    : styles.progressCircleInactive,
                ]}
              >
                {step.completed ? (
                  <CheckCircle size={20} color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.progressIndex,
                      currentStep === step.key && styles.progressIndexActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.progressLabel,
                  currentStep === step.key && styles.progressLabelActive,
                ]}
              >
                {step.label}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.progressConnector,
                  step.completed ? styles.progressConnectorCompleted : undefined,
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {currentStep === 'entry' && (
          <RaceRegistrationForm
            regattaId={regattaId!}
            userId={user.id}
            onSuccess={handleEntryCreated}
            onCancel={() => router.back()}
          />
        )}

        {currentStep === 'documents' && entryId && (
          <View style={styles.stepSection}>
            <View style={[styles.infoCard, styles.infoCardPrimary]}>
              <Text style={styles.infoTitle}>Step 2: Upload Required Documents</Text>
              <Text style={styles.infoSubtitle}>
                Upload all required documents to complete your registration
              </Text>
            </View>
            <DocumentChecklistComponent
              entryId={entryId}
              regattaId={regattaId!}
              onComplete={handleDocumentsComplete}
            />
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.secondaryButton, styles.flexButton]} onPress={handleBack}>
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, styles.flexButton]}
                onPress={handleDocumentsComplete}
              >
                <Text style={styles.primaryButtonText}>Continue to Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentStep === 'payment' && entryId && (
          <View style={styles.stepSection}>
            <View style={[styles.infoCard, styles.infoCardPrimary]}>
              <Text style={styles.infoTitle}>Step 3: Complete Payment</Text>
              <Text style={styles.infoSubtitle}>
                Secure your race entry by completing payment
              </Text>
            </View>
            <PaymentFlowComponent
              entryId={entryId}
              userId={user.id}
              onSuccess={handlePaymentComplete}
              onCancel={handleBack}
            />
          </View>
        )}

        {currentStep === 'confirmation' && (
          <View style={styles.confirmationSection}>
            <View style={styles.successBadge}>
              <CheckCircle size={48} color="#059669" />
            </View>

            <View style={styles.confirmationHeader}>
              <Text style={styles.confirmationTitle}>Registration Complete!</Text>
              <Text style={styles.confirmationSubtitle}>
                Your race entry has been successfully submitted
              </Text>
            </View>

            {entryNumber ? (
              <View style={[styles.infoCard, styles.entryNumberCard]}>
                <Text style={styles.entryNumberLabel}>Your Entry Number</Text>
                <Text style={styles.entryNumberValue}>{entryNumber}</Text>
              </View>
            ) : null}

            <View style={[styles.infoCard, styles.infoCardLight]}>
              <Text style={styles.infoTitle}>What's Next?</Text>
              <Text style={styles.infoSubtitle}>• You'll receive a confirmation email shortly</Text>
              <Text style={styles.infoSubtitle}>• Check your race details in the Races tab</Text>
              <Text style={styles.infoSubtitle}>• Download sailing instructions when available</Text>
              <Text style={styles.infoSubtitle}>• Prepare your boat and crew for race day</Text>
            </View>

            <View style={styles.confirmationActions}>
              <TouchableOpacity style={[styles.primaryButton, styles.flexButton]} onPress={handleComplete}>
                <Text style={styles.primaryButtonText}>View My Races</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, styles.flexButton]}
                onPress={() => router.push('/(tabs)/races')}
              >
                <Text style={styles.secondaryButtonText}>Back to Races</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleCompleted: {
    backgroundColor: '#10B981',
  },
  progressCircleActive: {
    backgroundColor: '#2563EB',
  },
  progressCircleInactive: {
    backgroundColor: '#E5E7EB',
  },
  progressIndex: {
    color: '#6B7280',
    fontWeight: '600',
  },
  progressIndexActive: {
    color: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
  progressLabelActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  progressConnector: {
    width: 24,
    height: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginTop: 15,
  },
  progressConnectorCompleted: {
    backgroundColor: '#10B981',
  },
  content: {
    flex: 1,
  },
  stepSection: {
    padding: 16,
    gap: 16,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
  },
  infoCardPrimary: {
    backgroundColor: '#EFF6FF',
  },
  infoCardLight: {
    backgroundColor: '#F9FAFB',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoSubtitle: {
    fontSize: 12,
    color: '#1E40AF',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  flexButton: {
    flex: 1,
  },
  confirmationSection: {
    padding: 24,
    alignItems: 'center',
    gap: 20,
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  confirmationHeader: {
    alignItems: 'center',
    gap: 8,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
  },
  entryNumberCard: {
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    paddingVertical: 24,
    width: '100%',
  },
  entryNumberLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  entryNumberValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2563EB',
  },
  confirmationActions: {
    width: '100%',
    gap: 12,
    marginTop: 12,
  },
  signInContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  signInTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  signInButton: {
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
