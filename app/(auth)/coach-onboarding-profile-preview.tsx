/**
 * Coach Onboarding - Profile Preview Screen
 * Final review before publishing coach profile
 * Shows payment status and allows publishing
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import {
  ChevronRight,
  User,
  Award,
  Calendar,
  DollarSign,
  CheckCircle,
  CreditCard,
  AlertCircle,
  ArrowRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCoachOnboardingState } from '@/hooks/useCoachOnboardingState';
import { useAuth } from '@/providers/AuthProvider';
import { OnboardingProgress } from '@/components/onboarding';
import { StripeConnectService } from '@/services/StripeConnectService';
import { supabase } from '@/services/supabase';

const CoachOnboardingProfilePreview = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { state, publishProfile, loading, saving } = useCoachOnboardingState();

  const [stripeStatus, setStripeStatus] = useState<{
    connected: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    skipped: boolean;
  }>({
    connected: false,
    chargesEnabled: false,
    payoutsEnabled: false,
    skipped: false,
  });
  const [checkingStripe, setCheckingStripe] = useState(true);

  // Check Stripe status on mount
  useEffect(() => {
    checkStripeStatus();
  }, [user]);

  const checkStripeStatus = async () => {
    if (!user) {
      setCheckingStripe(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('coach_profiles')
        .select('id, stripe_account_id, stripe_onboarding_complete, stripe_onboarding_skipped, stripe_charges_enabled, stripe_payouts_enabled')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        // Check payment setup state
        const paymentSetup = state.paymentSetup;
        const isConnected = profile.stripe_onboarding_complete || paymentSetup?.stripeOnboardingComplete || false;
        const isSkipped = profile.stripe_onboarding_skipped || paymentSetup?.stripeOnboardingSkipped || false;

        setStripeStatus({
          connected: isConnected,
          chargesEnabled: profile.stripe_charges_enabled || paymentSetup?.chargesEnabled || false,
          payoutsEnabled: profile.stripe_payouts_enabled || paymentSetup?.payoutsEnabled || false,
          skipped: isSkipped,
        });
      } else {
        // Use local state if no profile yet
        setStripeStatus({
          connected: state.paymentSetup?.stripeOnboardingComplete || false,
          chargesEnabled: state.paymentSetup?.chargesEnabled || false,
          payoutsEnabled: state.paymentSetup?.payoutsEnabled || false,
          skipped: state.paymentSetup?.stripeOnboardingSkipped || false,
        });
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error);
    } finally {
      setCheckingStripe(false);
    }
  };

  const profileData = {
    fullName: state.welcome?.fullName || '',
    professionalTitle: state.welcome?.professionalTitle || '',
    experience: state.welcome?.experience || '',
    organization: state.welcome?.organization || '',
    email: user?.email || '',
    phone: state.welcome?.phone || '',
    languages: state.welcome?.languages || [],
    expertiseAreas: state.expertise?.areas || [],
    expertiseSpecialties: state.expertise?.specialties || [],
    availability: state.availability ? {
      monday: state.availability.monday,
      tuesday: state.availability.tuesday,
      wednesday: state.availability.wednesday,
      thursday: state.availability.thursday,
      friday: state.availability.friday,
      saturday: state.availability.saturday,
      sunday: state.availability.sunday,
    } : {},
    timeOfDay: state.availability ? [
      state.availability.morning && 'Morning',
      state.availability.afternoon && 'Afternoon',
      state.availability.evening && 'Evening'
    ].filter(Boolean) : [],
    locationPreference: state.availability?.locationPreference || 'in-person',
    remoteCoaching: state.availability?.remoteCoaching || false,
    maxDistance: state.availability?.maxDistance || 50,
    groupSizes: state.availability ? [
      state.availability.individualSessions && 'Individual Sessions',
      state.availability.smallGroup && 'Small Groups (2-4)',
      state.availability.largeGroup && 'Large Groups (5+)'
    ].filter(Boolean) : [],
    pricingModel: state.pricing?.pricingModel || 'hourly',
    hourlyRate: state.pricing?.hourlyRate || '',
    packagePrices: state.pricing?.packagePrices || {
      single: '',
      five: '',
      ten: ''
    },
    currency: state.pricing?.currency || 'USD',
    sessionDuration: state.pricing?.sessionDuration || '60'
  };

  const handlePublishProfile = async () => {
    // Validate that all steps are complete
    if (!state.welcome || !state.expertise || !state.availability || !state.pricing) {
      Alert.alert(
        'Incomplete Profile',
        'Please complete all onboarding steps before publishing your profile.'
      );
      return;
    }

    // Warn if payments not set up
    if (!stripeStatus.connected && !stripeStatus.skipped) {
      Alert.alert(
        'Payment Setup Incomplete',
        "You haven't set up payments yet. You won't be able to accept paid bookings until you complete payment setup.\n\nDo you want to continue anyway?",
        [
          { text: 'Set Up Payments', onPress: () => router.push('/(auth)/coach-onboarding-payment-setup') },
          { text: 'Continue Without', style: 'default', onPress: () => doPublishProfile() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    await doPublishProfile();
  };

  const doPublishProfile = async () => {
    try {
      const result = await publishProfile();

      if (!result.success) {
        Alert.alert(
          'Error',
          result.error || 'Failed to publish profile. Please try again.'
        );
        return;
      }

      // Navigate to completion screen
      router.replace('/(auth)/coach-onboarding-complete');
    } catch (error: any) {
      console.error('Error publishing profile:', error);
      Alert.alert(
        'Error',
        error.message || 'An unexpected error occurred. Please try again.'
      );
    }
  };

  const handleSetupPayments = () => {
    router.push('/(auth)/coach-onboarding-payment-setup');
  };

  const handleEditInformation = () => {
    router.back();
  };

  const getAvailableDays = () => {
    const days = [
      { key: 'monday', label: 'Mon' },
      { key: 'tuesday', label: 'Tue' },
      { key: 'wednesday', label: 'Wed' },
      { key: 'thursday', label: 'Thu' },
      { key: 'friday', label: 'Fri' },
      { key: 'saturday', label: 'Sat' },
      { key: 'sunday', label: 'Sun' }
    ];
    
    return days
      .filter(day => profileData.availability[day.key as keyof typeof profileData.availability])
      .map(day => day.label)
      .join(', ');
  };

  const isFormComplete = () => {
    return (
      state.welcome !== null &&
      state.expertise !== null &&
      state.availability !== null &&
      state.pricing !== null &&
      profileData.fullName.length > 0 &&
      profileData.professionalTitle.length > 0
    );
  };

  const getCompletionPercentage = () => {
    let completed = 0;
    if (state.welcome) completed += 20;
    if (state.expertise) completed += 20;
    if (state.availability) completed += 20;
    if (state.pricing) completed += 20;
    if (stripeStatus.connected) completed += 20;
    else if (stripeStatus.skipped) completed += 10; // Partial credit for skipping
    return completed;
  };

  if (loading || checkingStripe) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </View>
    );
  }

  const completionPercent = getCompletionPercentage();

  return (
    <View className="flex-1 bg-white">
      {/* Progress Indicator */}
      <View className="px-4 pt-4 bg-white">
        <OnboardingProgress
          currentStep={6}
          totalSteps={6}
          stepLabels={['Welcome', 'Expertise', 'Availability', 'Pricing', 'Payments', 'Review']}
          color="#059669"
          showStepLabels={false}
        />
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800">Profile Preview</Text>
          <Text className="text-gray-600 mt-1">Review your coaching profile before going live</Text>
        </View>
        
        {/* Profile Completion Status */}
        <View className={`rounded-2xl p-5 mb-6 ${completionPercent >= 100 ? 'bg-green-50' : 'bg-blue-50'}`}>
          <View className="flex-row items-center mb-3">
            <CheckCircle size={24} color={completionPercent >= 100 ? '#059669' : '#2563EB'} />
            <Text className="font-bold text-gray-800 text-lg ml-2">Profile Completion</Text>
          </View>
          <Text className="text-gray-600 mb-3">
            {completionPercent >= 100 
              ? "Your profile is complete and ready to go live!" 
              : `Your profile is ${completionPercent}% complete.`}
          </Text>
          <View className="h-2 bg-gray-200 rounded-full">
            <View 
              className={`h-2 rounded-full ${completionPercent >= 100 ? 'bg-green-500' : 'bg-blue-600'}`}
              style={{ width: `${completionPercent}%` }}
            />
          </View>
        </View>

        {/* Payment Status Card */}
        <View className={`rounded-2xl p-5 mb-6 ${
          stripeStatus.connected 
            ? 'bg-green-50 border border-green-200' 
            : stripeStatus.skipped 
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-orange-50 border border-orange-200'
        }`}>
          <View className="flex-row items-center mb-2">
            {stripeStatus.connected ? (
              <>
                <CheckCircle size={20} color="#059669" />
                <Text className="font-bold text-green-800 ml-2">Payments Enabled</Text>
              </>
            ) : stripeStatus.skipped ? (
              <>
                <AlertCircle size={20} color="#D97706" />
                <Text className="font-bold text-yellow-800 ml-2">Payments Skipped</Text>
              </>
            ) : (
              <>
                <CreditCard size={20} color="#EA580C" />
                <Text className="font-bold text-orange-800 ml-2">Payment Setup Required</Text>
              </>
            )}
          </View>
          
          <Text className={`text-sm mb-3 ${
            stripeStatus.connected ? 'text-green-700' : stripeStatus.skipped ? 'text-yellow-700' : 'text-orange-700'
          }`}>
            {stripeStatus.connected 
              ? "You're all set to receive payments from sailors!" 
              : stripeStatus.skipped
                ? "You skipped payment setup. You won't be able to accept paid bookings."
                : "Set up payments to start earning from your coaching sessions."}
          </Text>

          {!stripeStatus.connected && (
            <TouchableOpacity
              className={`flex-row items-center justify-center py-3 rounded-xl ${
                stripeStatus.skipped ? 'bg-yellow-600' : 'bg-orange-600'
              }`}
              onPress={handleSetupPayments}
            >
              <CreditCard size={18} color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">
                {stripeStatus.skipped ? 'Complete Payment Setup' : 'Set Up Payments'}
              </Text>
              <ArrowRight size={16} color="#FFFFFF" className="ml-1" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Personal Information */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <User size={18} color="#2563EB" />
            <Text className="font-bold text-gray-800 text-lg ml-2">Personal Information</Text>
          </View>
          
          <View className="border border-gray-200 rounded-xl p-4">
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Full Name</Text>
              <Text className="font-medium text-gray-800">{profileData.fullName}</Text>
            </View>
            
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Professional Title</Text>
              <Text className="font-medium text-gray-800">{profileData.professionalTitle}</Text>
            </View>
            
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Experience</Text>
              <Text className="font-medium text-gray-800">{profileData.experience}</Text>
            </View>
            
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Organization</Text>
              <Text className="font-medium text-gray-800">{profileData.organization || "Not specified"}</Text>
            </View>
            
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Email</Text>
              <Text className="font-medium text-gray-800">{profileData.email}</Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Phone</Text>
              <Text className="font-medium text-gray-800">{profileData.phone || "Not provided"}</Text>
            </View>
          </View>
        </View>

        {/* Expertise */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Award size={18} color="#2563EB" />
            <Text className="font-bold text-gray-800 text-lg ml-2">Sailing Expertise</Text>
          </View>

          <View className="border border-gray-200 rounded-xl p-4">
            {profileData.expertiseAreas.length > 0 && (
              <View className="mb-3">
                <Text className="text-gray-600 mb-2">Areas of Expertise</Text>
                <View className="flex-row flex-wrap">
                  {profileData.expertiseAreas.map((area: string) => (
                    <View key={area} className="bg-blue-100 rounded-full px-3 py-1 mr-2 mb-2">
                      <Text className="text-blue-700 text-sm">{area.replace(/_/g, ' ')}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {profileData.expertiseSpecialties.length > 0 && (
              <View>
                <Text className="text-gray-600 mb-2">Class Specialties</Text>
                <View className="flex-row flex-wrap">
                  {profileData.expertiseSpecialties.map((specialty: string) => (
                    <View key={specialty} className="bg-green-100 rounded-full px-3 py-1 mr-2 mb-2">
                      <Text className="text-green-700 text-sm">{specialty.replace(/_/g, ' ')}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {profileData.expertiseAreas.length === 0 && profileData.expertiseSpecialties.length === 0 && (
              <Text className="text-gray-500 italic">No expertise selected</Text>
            )}
          </View>
        </View>

        {/* Availability */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Calendar size={18} color="#2563EB" />
            <Text className="font-bold text-gray-800 text-lg ml-2">Availability</Text>
          </View>
          
          <View className="border border-gray-200 rounded-xl p-4">
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Available Days</Text>
              <Text className="font-medium text-gray-800">{getAvailableDays() || 'None selected'}</Text>
            </View>
            
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Time of Day</Text>
              <Text className="font-medium text-gray-800">{profileData.timeOfDay.join(', ') || 'None selected'}</Text>
            </View>
            
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Location Preference</Text>
              <Text className="font-medium text-gray-800">
                {profileData.locationPreference === 'in-person' ? 'In-Person' : 'Remote'}
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Remote Coaching</Text>
              <Text className="font-medium text-gray-800">
                {profileData.remoteCoaching ? 'Available' : 'Not Available'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Pricing */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <DollarSign size={18} color="#2563EB" />
            <Text className="font-bold text-gray-800 text-lg ml-2">Pricing</Text>
          </View>
          
          <View className="border border-gray-200 rounded-xl p-4">
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Pricing Model</Text>
              <Text className="font-medium text-gray-800">
                {profileData.pricingModel === 'hourly' ? 'Hourly Rate' : 'Session Packages'}
              </Text>
            </View>
            
            {profileData.pricingModel === 'hourly' ? (
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Hourly Rate</Text>
                <Text className="font-medium text-gray-800">
                  {profileData.currency} {profileData.hourlyRate}/hr
                </Text>
              </View>
            ) : (
              <View>
                {Object.entries(profileData.packagePrices).map(([key, value], index) => (
                  <View key={index} className="flex-row justify-between mb-2">
                    <Text className="text-gray-600 capitalize">{key} Session</Text>
                    <Text className="font-medium text-gray-800">
                      {profileData.currency} {value}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="px-4 pb-6 border-t border-gray-100 pt-4">
        <TouchableOpacity
          className={`flex-row items-center justify-center py-4 rounded-xl mb-3 ${
            isFormComplete() && !saving ? 'bg-blue-600' : 'bg-gray-300'
          }`}
          disabled={!isFormComplete() || saving}
          onPress={handlePublishProfile}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text className="text-white font-bold text-lg">
                {stripeStatus.connected ? 'Publish Profile' : 'Publish Profile Anyway'}
              </Text>
              <ChevronRight color="white" size={20} className="ml-2" />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="py-3 items-center"
          onPress={handleEditInformation}
          disabled={saving}
        >
          <Text className="text-blue-600 font-medium">Edit Information</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CoachOnboardingProfilePreview;
