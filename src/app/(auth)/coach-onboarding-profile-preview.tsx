import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { ChevronRight, User, Award, Calendar, DollarSign, CheckCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCoachOnboardingState } from '@/src/hooks/useCoachOnboardingState';
import { useAuth } from '@/src/providers/AuthProvider';
import { OnboardingProgress } from '@/src/components/onboarding';
import { StripeConnectService } from '@/src/services/StripeConnectService';
import { supabase } from '@/src/services/supabase';

const CoachOnboardingProfilePreview = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { state, publishProfile, loading, saving } = useCoachOnboardingState();

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

    try {
      // Step 1: Save all coach profile data
      const result = await publishProfile();

      if (!result.success) {
        Alert.alert(
          'Error',
          result.error || 'Failed to save profile. Please try again.'
        );
        return;
      }

      // Step 2: Get the coach profile ID
      const { data: coachProfile, error: profileError } = await supabase
        .from('coach_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (profileError || !coachProfile) {
        Alert.alert(
          'Error',
          'Failed to retrieve coach profile. Please try again.'
        );
        return;
      }

      // Step 3: Start Stripe Connect onboarding
      const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const onboardingResult = await StripeConnectService.startOnboarding(
        coachProfile.id,
        `${appUrl}/(auth)/coach-onboarding-stripe-callback`,
        `${appUrl}/(auth)/coach-onboarding-profile-preview`
      );

      if (!onboardingResult.success || !onboardingResult.url) {
        Alert.alert(
          'Error',
          onboardingResult.error || 'Failed to start payment setup. Please try again.'
        );
        return;
      }

      // Step 4: Redirect to Stripe onboarding
      await Linking.openURL(onboardingResult.url);
    } catch (error: any) {
      console.error('Error publishing profile:', error);
      Alert.alert(
        'Error',
        error.message || 'An unexpected error occurred. Please try again.'
      );
    }
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
          totalSteps={5}
          stepLabels={['Welcome', 'Expertise', 'Availability', 'Pricing', 'Review']}
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
        <View className="bg-blue-50 rounded-2xl p-5 mb-6">
          <View className="flex-row items-center mb-3">
            <CheckCircle size={24} color="#2563EB" className="mr-2" />
            <Text className="font-bold text-gray-800 text-lg">Profile Completion</Text>
          </View>
          <Text className="text-gray-600 mb-3">
            Your profile is 95% complete. One final step to go live!
          </Text>
          <View className="h-2 bg-gray-200 rounded-full">
            <View 
              className="h-2 bg-blue-600 rounded-full" 
              style={{ width: '95%' }}
            />
          </View>
        </View>
        
        {/* Personal Information */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <User size={18} color="#2563EB" className="mr-2" />
            <Text className="font-bold text-gray-800 text-lg">Personal Information</Text>
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
            <Award size={18} color="#2563EB" className="mr-2" />
            <Text className="font-bold text-gray-800 text-lg">Sailing Expertise</Text>
          </View>

          <View className="border border-gray-200 rounded-xl p-4">
            {profileData.expertiseAreas.length > 0 && (
              <View className="mb-3">
                <Text className="text-gray-600 mb-2">Areas of Expertise</Text>
                <View className="flex-row flex-wrap">
                  {profileData.expertiseAreas.map((area: string) => (
                    <View key={area} className="bg-blue-100 rounded-full px-3 py-1 mr-2 mb-2">
                      <Text className="text-blue-700 text-sm">{area.replace('_', ' ')}</Text>
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
                      <Text className="text-green-700 text-sm">{specialty.replace('_', ' ')}</Text>
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
            <Calendar size={18} color="#2563EB" className="mr-2" />
            <Text className="font-bold text-gray-800 text-lg">Availability</Text>
          </View>
          
          <View className="border border-gray-200 rounded-xl p-4">
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Available Days</Text>
              <Text className="font-medium text-gray-800">{getAvailableDays()}</Text>
            </View>
            
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Time of Day</Text>
              <Text className="font-medium text-gray-800">{profileData.timeOfDay.join(', ')}</Text>
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
            <DollarSign size={18} color="#2563EB" className="mr-2" />
            <Text className="font-bold text-gray-800 text-lg">Pricing</Text>
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
      <View className="px-4 pb-6">
        <TouchableOpacity
          className={`flex-row items-center justify-center py-4 rounded-xl mb-4 ${
            isFormComplete() && !saving ? 'bg-blue-600' : 'bg-gray-300'
          }`}
          disabled={!isFormComplete() || saving}
          onPress={handlePublishProfile}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text className="text-white font-bold text-lg">Publish Profile</Text>
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