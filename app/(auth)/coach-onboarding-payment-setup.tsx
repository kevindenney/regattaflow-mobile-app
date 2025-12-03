/**
 * Coach Onboarding - Payment Setup Screen
 * Guides coaches through Stripe Connect setup to receive payments
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import {
  ChevronRight,
  CreditCard,
  Shield,
  Zap,
  Globe,
  DollarSign,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCoachOnboardingState } from '@/hooks/useCoachOnboardingState';
import { useAuth } from '@/providers/AuthProvider';
import { OnboardingProgress } from '@/components/onboarding';
import { StripeConnectService } from '@/services/StripeConnectService';
import { supabase } from '@/services/supabase';

type PaymentSetupStatus = 'not_started' | 'in_progress' | 'complete' | 'error';

const CoachOnboardingPaymentSetup = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { state, updatePaymentSetup, loading } = useCoachOnboardingState();

  const [setupStatus, setSetupStatus] = useState<PaymentSetupStatus>('not_started');
  const [stripeStatus, setStripeStatus] = useState<{
    connected: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
  } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [coachProfileId, setCoachProfileId] = useState<string | null>(null);

  // Check for existing Stripe status on mount
  useEffect(() => {
    checkStripeStatus();
  }, [user]);

  const checkStripeStatus = async () => {
    if (!user) return;

    try {
      // First, check if we have a coach profile
      const { data: profile } = await supabase
        .from('coach_profiles')
        .select('id, stripe_account_id, stripe_onboarding_complete, stripe_onboarding_skipped')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setCoachProfileId(profile.id);

        if (profile.stripe_onboarding_complete) {
          setSetupStatus('complete');
          setStripeStatus({
            connected: true,
            chargesEnabled: true,
            payoutsEnabled: true,
            detailsSubmitted: true,
          });
        } else if (profile.stripe_account_id) {
          // Check actual Stripe status
          const status = await StripeConnectService.getConnectStatus(profile.id);
          setStripeStatus({
            connected: status.connected,
            chargesEnabled: status.chargesEnabled || false,
            payoutsEnabled: status.payoutsEnabled || false,
            detailsSubmitted: status.detailsSubmitted || false,
          });

          if (status.detailsSubmitted && status.chargesEnabled) {
            setSetupStatus('complete');
          } else if (status.connected) {
            setSetupStatus('in_progress');
          }
        }
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error);
    }
  };

  const handleStartStripeConnect = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to continue');
      return;
    }

    setIsConnecting(true);

    try {
      // First, ensure we have a coach profile saved
      let profileId = coachProfileId;

      if (!profileId) {
        // Save the profile data first
        const { data: profile, error: profileError } = await supabase
          .from('coach_profiles')
          .upsert({
            user_id: user.id,
            full_name: state.welcome?.fullName || user.user_metadata?.full_name || 'Coach',
            professional_title: state.welcome?.professionalTitle || 'Sailing Coach',
            experience_level: state.welcome?.experience || '1-2 years',
            organization: state.welcome?.organization || null,
            phone: state.welcome?.phone || null,
            languages: state.welcome?.languages || ['English'],
            profile_completed: false,
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (profileError || !profile) {
          throw new Error('Failed to create coach profile');
        }

        profileId = profile.id;
        setCoachProfileId(profileId);
      }

      // Start Stripe Connect onboarding
      const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://regattaflow.com';
      const result = await StripeConnectService.startOnboarding(
        profileId,
        `${appUrl}/(auth)/coach-onboarding-stripe-callback?fromPaymentSetup=true`,
        `${appUrl}/(auth)/coach-onboarding-payment-setup`
      );

      if (!result.success || !result.url) {
        throw new Error(result.error || 'Failed to start Stripe onboarding');
      }

      // Update local state
      updatePaymentSetup({ stripeOnboardingStarted: true });

      // Redirect to Stripe
      if (typeof window !== 'undefined') {
        window.location.href = result.url;
      } else {
        await Linking.openURL(result.url);
      }
    } catch (error: any) {
      console.error('Error starting Stripe Connect:', error);
      Alert.alert('Error', error.message || 'Failed to start payment setup');
      setSetupStatus('error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSkipForNow = async () => {
    Alert.alert(
      'Skip Payment Setup?',
      "You won't be able to accept paid bookings until you complete payment setup. You can always set this up later from your dashboard.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip for Now',
          style: 'default',
          onPress: async () => {
            try {
              // Mark as skipped in database
              if (coachProfileId) {
                await supabase
                  .from('coach_profiles')
                  .update({
                    stripe_onboarding_skipped: true,
                    stripe_onboarding_skipped_at: new Date().toISOString(),
                  })
                  .eq('id', coachProfileId);
              }

              // Update local state
              updatePaymentSetup({ stripeOnboardingSkipped: true });

              // Navigate to profile preview
              router.push('/(auth)/coach-onboarding-profile-preview');
            } catch (error) {
              console.error('Error skipping payment setup:', error);
              router.push('/(auth)/coach-onboarding-profile-preview');
            }
          },
        },
      ]
    );
  };

  const handleContinue = () => {
    router.push('/(auth)/coach-onboarding-profile-preview');
  };

  // Get pricing info from state for the preview
  const getPricingDisplay = () => {
    if (!state.pricing) return { rate: '$0', fee: '$0', youReceive: '$0' };

    const rate = state.pricing.pricingModel === 'hourly'
      ? parseFloat(state.pricing.hourlyRate || '0')
      : parseFloat(state.pricing.packagePrices?.single || '0');

    const platformFee = rate * 0.15;
    const youReceive = rate - platformFee;

    const symbol = state.pricing.currency === 'USD' ? '$' :
                   state.pricing.currency === 'EUR' ? '€' :
                   state.pricing.currency === 'GBP' ? '£' : '$';

    return {
      rate: `${symbol}${rate.toFixed(2)}`,
      fee: `${symbol}${platformFee.toFixed(2)}`,
      youReceive: `${symbol}${youReceive.toFixed(2)}`,
    };
  };

  const pricing = getPricingDisplay();

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Progress Indicator */}
      <View className="px-4 pt-4 bg-white">
        <OnboardingProgress
          currentStep={5}
          totalSteps={6}
          stepLabels={['Welcome', 'Expertise', 'Availability', 'Pricing', 'Payments', 'Review']}
          color="#059669"
          showStepLabels={false}
        />
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="items-center mb-6">
          <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4">
            <CreditCard size={32} color="#2563EB" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 text-center">
            Get Paid for Your Coaching
          </Text>
          <Text className="text-gray-600 mt-2 text-center">
            Connect with Stripe to receive payments directly to your bank account
          </Text>
        </View>

        {/* Stripe Status Card */}
        {setupStatus === 'complete' && (
          <View className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6">
            <View className="flex-row items-center mb-3">
              <CheckCircle size={24} color="#059669" />
              <Text className="font-bold text-green-800 text-lg ml-2">
                Payments Enabled!
              </Text>
            </View>
            <Text className="text-green-700">
              Your Stripe account is connected and ready to receive payments from sailors.
            </Text>
          </View>
        )}

        {setupStatus === 'in_progress' && (
          <View className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mb-6">
            <View className="flex-row items-center mb-3">
              <AlertCircle size={24} color="#D97706" />
              <Text className="font-bold text-yellow-800 text-lg ml-2">
                Setup In Progress
              </Text>
            </View>
            <Text className="text-yellow-700 mb-3">
              Your Stripe account needs a few more details to be fully activated.
            </Text>
            <TouchableOpacity
              className="bg-yellow-600 py-3 px-4 rounded-xl flex-row items-center justify-center"
              onPress={handleStartStripeConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text className="text-white font-semibold">Complete Setup</Text>
                  <ArrowRight size={18} color="#FFFFFF" className="ml-2" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Value Props */}
        {setupStatus !== 'complete' && (
          <View className="mb-6">
            <View className="flex-row items-center bg-gray-50 rounded-xl p-4 mb-3">
              <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                <Shield size={20} color="#059669" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-800">Secure Payments</Text>
                <Text className="text-gray-600 text-sm">
                  Industry-leading payment security by Stripe
                </Text>
              </View>
            </View>

            <View className="flex-row items-center bg-gray-50 rounded-xl p-4 mb-3">
              <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-3">
                <Zap size={20} color="#EA580C" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-800">Fast Payouts</Text>
                <Text className="text-gray-600 text-sm">
                  Get paid within 2-7 business days
                </Text>
              </View>
            </View>

            <View className="flex-row items-center bg-gray-50 rounded-xl p-4">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                <Globe size={20} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-800">Global Support</Text>
                <Text className="text-gray-600 text-sm">
                  Accept payments from sailors worldwide
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Platform Fee Disclosure */}
        <View className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">
          <View className="flex-row items-center mb-3">
            <DollarSign size={20} color="#2563EB" />
            <Text className="font-bold text-gray-800 text-lg ml-2">
              How Payments Work
            </Text>
          </View>

          <Text className="text-gray-600 mb-4">
            RegattaFlow charges a 15% service fee on each booking to cover payment processing, 
            platform maintenance, and customer support.
          </Text>

          {/* Pricing Example */}
          <View className="bg-white rounded-xl p-4">
            <Text className="text-gray-500 text-sm mb-3 font-medium">
              EXAMPLE BASED ON YOUR PRICING
            </Text>

            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-700">Session Rate</Text>
              <Text className="font-semibold text-gray-800">{pricing.rate}</Text>
            </View>

            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-700">Platform Fee (15%)</Text>
              <Text className="font-semibold text-red-600">-{pricing.fee}</Text>
            </View>

            <View className="border-t border-gray-200 my-2" />

            <View className="flex-row justify-between items-center">
              <Text className="font-semibold text-gray-800">You Receive</Text>
              <Text className="font-bold text-green-600 text-lg">{pricing.youReceive}</Text>
            </View>
          </View>
        </View>

        {/* What You'll Need */}
        {setupStatus === 'not_started' && (
          <View className="bg-gray-50 rounded-2xl p-5 mb-6">
            <Text className="font-bold text-gray-800 mb-3">What You'll Need</Text>
            <View className="space-y-2">
              <View className="flex-row items-center">
                <CheckCircle size={16} color="#6B7280" />
                <Text className="text-gray-600 ml-2">Bank account details</Text>
              </View>
              <View className="flex-row items-center mt-2">
                <CheckCircle size={16} color="#6B7280" />
                <Text className="text-gray-600 ml-2">Government-issued ID</Text>
              </View>
              <View className="flex-row items-center mt-2">
                <CheckCircle size={16} color="#6B7280" />
                <Text className="text-gray-600 ml-2">About 5 minutes to complete</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View className="px-4 pb-6 border-t border-gray-100 pt-4">
        {setupStatus === 'complete' ? (
          <TouchableOpacity
            className="flex-row items-center justify-center py-4 rounded-xl bg-blue-600"
            onPress={handleContinue}
          >
            <Text className="text-white font-bold text-lg">Continue to Profile Preview</Text>
            <ChevronRight color="white" size={20} className="ml-2" />
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              className={`flex-row items-center justify-center py-4 rounded-xl mb-3 ${
                isConnecting ? 'bg-gray-400' : 'bg-blue-600'
              }`}
              onPress={handleStartStripeConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <CreditCard size={20} color="#FFFFFF" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Connect with Stripe
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="py-3 items-center"
              onPress={handleSkipForNow}
              disabled={isConnecting}
            >
              <Text className="text-gray-500 font-medium">I'll set this up later</Text>
            </TouchableOpacity>

            {/* Skip Warning */}
            <View className="flex-row items-center justify-center mt-2 px-4">
              <AlertCircle size={14} color="#9CA3AF" />
              <Text className="text-gray-400 text-xs ml-1 text-center">
                You won't be able to accept paid bookings without payment setup
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

export default CoachOnboardingPaymentSetup;

