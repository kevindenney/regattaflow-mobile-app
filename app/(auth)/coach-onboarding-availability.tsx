import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { ChevronRight, MapPin, Clock, Calendar, Users, Globe } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCoachOnboardingState } from '@/hooks/useCoachOnboardingState';
import { OnboardingProgress } from '@/components/onboarding';

const CoachOnboardingAvailability = () => {
  const router = useRouter();
  const { state, updateAvailability, loading } = useCoachOnboardingState();

  const [availability, setAvailability] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: false,
    saturday: true,
    sunday: false
  });

  const [selectedHours, setSelectedHours] = useState({
    morning: true,
    afternoon: true,
    evening: false
  });

  const [locationPreference, setLocationPreference] = useState<'in-person' | 'remote'>('in-person');
  const [remoteCoaching, setRemoteCoaching] = useState(true);
  const [maxDistance, setMaxDistance] = useState(50);
  const [groupSizes, setGroupSizes] = useState({
    individual: true,
    smallGroup: true,
    largeGroup: false
  });

  // Load saved state
  useEffect(() => {
    if (state.availability) {
      setAvailability({
        monday: state.availability.monday,
        tuesday: state.availability.tuesday,
        wednesday: state.availability.wednesday,
        thursday: state.availability.thursday,
        friday: state.availability.friday,
        saturday: state.availability.saturday,
        sunday: state.availability.sunday,
      });
      setSelectedHours({
        morning: state.availability.morning,
        afternoon: state.availability.afternoon,
        evening: state.availability.evening,
      });
      setLocationPreference(state.availability.locationPreference);
      setRemoteCoaching(state.availability.remoteCoaching);
      setMaxDistance(state.availability.maxDistance);
      setGroupSizes({
        individual: state.availability.individualSessions,
        smallGroup: state.availability.smallGroup,
        largeGroup: state.availability.largeGroup,
      });
    }
  }, [state.availability]);

  const toggleDay = (day: string) => {
    setAvailability({
      ...availability,
      [day]: !availability[day]
    });
  };

  const toggleHour = (hour: string) => {
    setSelectedHours({
      ...selectedHours,
      [hour]: !selectedHours[hour]
    });
  };

  const toggleGroupSize = (size: string) => {
    setGroupSizes({
      ...groupSizes,
      [size]: !groupSizes[size]
    });
  };

  const isFormValid = () => {
    const hasDaySelected = Object.values(availability).some(day => day);
    const hasHourSelected = Object.values(selectedHours).some(hour => hour);
    const hasGroupSizeSelected = Object.values(groupSizes).some(size => size);

    return hasDaySelected && hasHourSelected && hasGroupSizeSelected;
  };

  const handleContinue = () => {
    if (!isFormValid()) return;

    // Save to state
    updateAvailability({
      monday: availability.monday,
      tuesday: availability.tuesday,
      wednesday: availability.wednesday,
      thursday: availability.thursday,
      friday: availability.friday,
      saturday: availability.saturday,
      sunday: availability.sunday,
      morning: selectedHours.morning,
      afternoon: selectedHours.afternoon,
      evening: selectedHours.evening,
      locationPreference,
      remoteCoaching,
      maxDistance,
      individualSessions: groupSizes.individual,
      smallGroup: groupSizes.smallGroup,
      largeGroup: groupSizes.largeGroup,
    });

    // Navigate to next step
    router.push('/(auth)/coach-onboarding-pricing');
  };

  const handleCompleteLater = () => {
    // Save current progress
    updateAvailability({
      monday: availability.monday,
      tuesday: availability.tuesday,
      wednesday: availability.wednesday,
      thursday: availability.thursday,
      friday: availability.friday,
      saturday: availability.saturday,
      sunday: availability.sunday,
      morning: selectedHours.morning,
      afternoon: selectedHours.afternoon,
      evening: selectedHours.evening,
      locationPreference,
      remoteCoaching,
      maxDistance,
      individualSessions: groupSizes.individual,
      smallGroup: groupSizes.smallGroup,
      largeGroup: groupSizes.largeGroup,
    });

    // Navigate back to main app
    router.replace('/(tabs)/dashboard');
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </View>
    );
  }

  const days = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' }
  ];

  const hours = [
    { key: 'morning', label: 'Morning (6am - 12pm)' },
    { key: 'afternoon', label: 'Afternoon (12pm - 6pm)' },
    { key: 'evening', label: 'Evening (6pm - 10pm)' }
  ];

  const groupOptions = [
    { key: 'individual', label: 'Individual Sessions' },
    { key: 'smallGroup', label: 'Small Groups (2-4)' },
    { key: 'largeGroup', label: 'Large Groups (5+)' }
  ];

  return (
    <View className="flex-1 bg-white">
      {/* Progress Indicator */}
      <View className="px-4 pt-4 bg-white">
        <OnboardingProgress
          currentStep={3}
          totalSteps={5}
          stepLabels={['Welcome', 'Expertise', 'Availability', 'Pricing', 'Review']}
          color="#059669"
          showStepLabels={false}
        />
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <View className="mb-2">
          <Text className="text-2xl font-bold text-gray-800">Availability & Location</Text>
          <Text className="text-gray-600 mt-1">Set your preferred coaching times and locations</Text>
        </View>
        
        {/* Availability Days */}
        <View className="mt-6">
          <View className="flex-row items-center mb-3">
            <Calendar size={18} color="#2563EB" className="mr-2" />
            <Text className="font-bold text-gray-800 text-lg">Available Days</Text>
          </View>
          <Text className="text-gray-600 text-sm mb-3">Select the days you're available for coaching</Text>
          
          <View className="flex-row flex-wrap justify-between">
            {days.map((day) => (
              <TouchableOpacity
                key={day.key}
                className={`border rounded-xl px-4 py-3 mb-2 ${availability[day.key] ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
                style={{ width: '30%' }}
                onPress={() => toggleDay(day.key)}
              >
                <Text className={`text-center ${availability[day.key] ? 'text-white' : 'text-gray-700'}`}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Time of Day */}
        <View className="mt-6">
          <View className="flex-row items-center mb-3">
            <Clock size={18} color="#2563EB" className="mr-2" />
            <Text className="font-bold text-gray-800 text-lg">Time of Day</Text>
          </View>
          <Text className="text-gray-600 text-sm mb-3">When are you available for coaching sessions?</Text>
          
          <View>
            {hours.map((hour) => (
              <TouchableOpacity
                key={hour.key}
                className={`flex-row items-center justify-between border rounded-xl px-4 py-3 mb-2 ${selectedHours[hour.key] ? 'border-blue-300 bg-blue-50' : 'border-gray-300'}`}
                onPress={() => toggleHour(hour.key)}
              >
                <Text className={selectedHours[hour.key] ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                  {hour.label}
                </Text>
                <View className={`w-5 h-5 rounded-full border ${selectedHours[hour.key] ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                  {selectedHours[hour.key] && <View className="w-3 h-3 bg-white rounded-full m-1" />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Location Preferences */}
        <View className="mt-6">
          <View className="flex-row items-center mb-3">
            <MapPin size={18} color="#2563EB" className="mr-2" />
            <Text className="font-bold text-gray-800 text-lg">Location Preferences</Text>
          </View>
          
          <View className="border border-gray-300 rounded-xl p-4 mb-4">
            <TouchableOpacity 
              className={`flex-row items-center justify-between py-2 ${locationPreference === 'in-person' ? 'border-b border-gray-200 pb-4 mb-3' : ''}`}
              onPress={() => setLocationPreference('in-person')}
            >
              <Text className={locationPreference === 'in-person' ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                In-Person Coaching
              </Text>
              <View className={`w-5 h-5 rounded-full border ${locationPreference === 'in-person' ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                {locationPreference === 'in-person' && <View className="w-3 h-3 bg-white rounded-full m-1" />}
              </View>
            </TouchableOpacity>
            
            {locationPreference === 'in-person' && (
              <View className="mt-3">
                <Text className="text-gray-600 text-sm mb-2">Maximum Travel Distance</Text>
                <View className="flex-row items-center">
                  <Text className="text-gray-700 mr-2">0 km</Text>
                  <View className="flex-1 h-2 bg-gray-200 rounded-full">
                    <View 
                      className="h-2 bg-blue-600 rounded-full" 
                      style={{ width: `${(maxDistance / 100) * 100}%` }}
                    />
                  </View>
                  <Text className="text-gray-700 ml-2">100 km</Text>
                </View>
                <Text className="text-center text-blue-600 font-medium mt-1">{maxDistance} km</Text>
              </View>
            )}
            
            <TouchableOpacity 
              className="flex-row items-center justify-between py-2 mt-3"
              onPress={() => setLocationPreference('remote')}
            >
              <Text className={locationPreference === 'remote' ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                Remote Coaching (Video Calls)
              </Text>
              <View className={`w-5 h-5 rounded-full border ${locationPreference === 'remote' ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                {locationPreference === 'remote' && <View className="w-3 h-3 bg-white rounded-full m-1" />}
              </View>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row items-center justify-between bg-blue-50 rounded-xl p-4">
            <View className="flex-row items-center">
              <Globe size={18} color="#2563EB" className="mr-2" />
              <Text className="text-gray-800 font-medium">Available for remote coaching</Text>
            </View>
            <Switch
              value={remoteCoaching}
              onValueChange={setRemoteCoaching}
              trackColor={{ false: "#d1d5db", true: "#2563eb" }}
              thumbColor={remoteCoaching ? "#ffffff" : "#f4f4f5"}
            />
          </View>
        </View>
        
        {/* Group Sizes */}
        <View className="mt-6">
          <View className="flex-row items-center mb-3">
            <Users size={18} color="#2563EB" className="mr-2" />
            <Text className="font-bold text-gray-800 text-lg">Group Sizes</Text>
          </View>
          <Text className="text-gray-600 text-sm mb-3">What session sizes can you accommodate?</Text>
          
          <View>
            {groupOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                className={`flex-row items-center justify-between border rounded-xl px-4 py-3 mb-2 ${groupSizes[option.key] ? 'border-blue-300 bg-blue-50' : 'border-gray-300'}`}
                onPress={() => toggleGroupSize(option.key)}
              >
                <Text className={groupSizes[option.key] ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                  {option.label}
                </Text>
                <View className={`w-5 h-5 rounded-full border ${groupSizes[option.key] ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                  {groupSizes[option.key] && <View className="w-3 h-3 bg-white rounded-full m-1" />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
      
      {/* Action Buttons */}
      <View className="px-4 pb-6">
        <TouchableOpacity
          className={`flex-row items-center justify-center py-4 rounded-xl mb-4 ${
            isFormValid() ? 'bg-blue-600' : 'bg-gray-300'
          }`}
          disabled={!isFormValid()}
          onPress={handleContinue}
        >
          <Text className="text-white font-bold text-lg">Continue to Pricing</Text>
          <ChevronRight color="white" size={20} className="ml-2" />
        </TouchableOpacity>

        <TouchableOpacity className="py-3 items-center" onPress={handleCompleteLater}>
          <Text className="text-blue-600 font-medium">Complete later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CoachOnboardingAvailability;