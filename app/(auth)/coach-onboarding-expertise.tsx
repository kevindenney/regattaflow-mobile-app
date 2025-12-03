import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ChevronRight, Award, Target, Anchor, Wind } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCoachOnboardingState } from '@/hooks/useCoachOnboardingState';
import { OnboardingProgress } from '@/components/onboarding';

const CoachOnboardingExpertise = () => {
  const router = useRouter();
  const { state, updateExpertise, loading } = useCoachOnboardingState();

  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  // Load saved state
  useEffect(() => {
    if (state.expertise) {
      setSelectedExpertise(state.expertise.areas || []);
      setSelectedSpecialties(state.expertise.specialties || []);
    }
  }, [state.expertise]);

  // Sailing-specific expertise areas
  const expertiseOptions = [
    { id: 'match_racing', title: 'Match Racing', description: 'One-on-one tactical racing', icon: Target },
    { id: 'fleet_racing', title: 'Fleet Racing', description: 'Multi-boat competition tactics', icon: Anchor },
    { id: 'boat_handling', title: 'Boat Handling', description: 'Sail trim and boat control', icon: Wind },
    { id: 'tactics', title: 'Racing Tactics', description: 'Strategic race planning', icon: Target },
    { id: 'speed_tuning', title: 'Speed & Tuning', description: 'Boat speed optimization', icon: Wind },
    { id: 'starting', title: 'Starting Techniques', description: 'Race start excellence', icon: Target },
    { id: 'strategy', title: 'Race Strategy', description: 'Course strategy & planning', icon: Award },
    { id: 'offshore', title: 'Offshore Racing', description: 'Long-distance racing', icon: Anchor },
  ];

  // Sailing class specialties
  const specialtiesOptions = [
    { id: 'dragon', title: 'Dragon Class', description: 'Keelboat racing' },
    { id: 'melges', title: 'Melges Classes', description: 'Melges 20/24/32' },
    { id: '470', title: '470 Class', description: 'Olympic two-person dinghy' },
    { id: 'laser', title: 'Laser/ILCA', description: 'Single-handed dinghy' },
    { id: 'swan', title: 'Swan Classes', description: 'Luxury racing yachts' },
    { id: 'j_boats', title: 'J/Boats', description: 'J/70, J/80, J/105, etc.' },
    { id: 'one_design', title: 'One-Design Racing', description: 'Identical boat racing' },
    { id: 'grand_prix', title: 'Grand Prix Racing', description: 'High-performance racing' },
  ];

  const toggleExpertise = (id: string) => {
    setSelectedExpertise(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const toggleSpecialty = (id: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const isFormValid = () => {
    return selectedExpertise.length > 0 || selectedSpecialties.length > 0;
  };

  const handleContinue = () => {
    if (!isFormValid()) return;

    // Save to state
    updateExpertise({
      areas: selectedExpertise,
      specialties: selectedSpecialties,
    });

    // Navigate to next step
    router.push('/(auth)/coach-onboarding-availability');
  };

  const handleCompleteLater = () => {
    // Save current progress
    if (selectedExpertise.length > 0 || selectedSpecialties.length > 0) {
      updateExpertise({
        areas: selectedExpertise,
        specialties: selectedSpecialties,
      });
    }

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

  return (
    <View className="flex-1 bg-white">
      {/* Progress Indicator */}
      <View className="px-4 pt-4 bg-white">
        <OnboardingProgress
          currentStep={2}
          totalSteps={6}
          stepLabels={['Welcome', 'Expertise', 'Availability', 'Pricing', 'Payments', 'Review']}
          color="#059669"
          showStepLabels={false}
        />
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <View className="mb-2">
          <Text className="text-2xl font-bold text-gray-800">Your Sailing Expertise</Text>
          <Text className="text-gray-600 mt-1">
            Select your areas of expertise to help sailors find the right coach
          </Text>
        </View>

        {/* Expertise Areas */}
        <View className="mt-6">
          <View className="flex-row items-center mb-3">
            <Award size={18} color="#2563EB" className="mr-2" />
            <Text className="font-bold text-gray-800 text-lg">Areas of Expertise</Text>
          </View>
          <Text className="text-gray-600 text-sm mb-3">
            What types of sailing coaching do you specialize in?
          </Text>

          <View className="flex-row flex-wrap -mx-1">
            {expertiseOptions.map((item) => {
              const IconComponent = item.icon;
              return (
                <View key={item.id} className="w-1/2 px-1 mb-2">
                  <TouchableOpacity
                    className={`bg-white border rounded-xl p-4 ${
                      selectedExpertise.includes(item.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                    onPress={() => toggleExpertise(item.id)}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <IconComponent
                        color={selectedExpertise.includes(item.id) ? '#2563EB' : '#6B7280'}
                        size={20}
                      />
                      {selectedExpertise.includes(item.id) && (
                        <View className="w-5 h-5 bg-blue-600 rounded-full items-center justify-center">
                          <Text className="text-white text-xs">✓</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      className={`font-medium ${
                        selectedExpertise.includes(item.id) ? 'text-blue-700' : 'text-gray-800'
                      }`}
                    >
                      {item.title}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1">{item.description}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Class Specialties */}
        <View className="mt-6">
          <View className="flex-row items-center mb-3">
            <Anchor size={18} color="#2563EB" className="mr-2" />
            <Text className="font-bold text-gray-800 text-lg">Class Specialties</Text>
          </View>
          <Text className="text-gray-600 text-sm mb-3">
            Which boat classes do you have experience coaching? (Optional)
          </Text>

          <View>
            {specialtiesOptions.map((item) => (
              <TouchableOpacity
                key={item.id}
                className={`flex-row items-center justify-between border rounded-xl px-4 py-3 mb-2 ${
                  selectedSpecialties.includes(item.id)
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200'
                }`}
                onPress={() => toggleSpecialty(item.id)}
              >
                <View className="flex-1">
                  <Text
                    className={`font-medium ${
                      selectedSpecialties.includes(item.id) ? 'text-blue-700' : 'text-gray-800'
                    }`}
                  >
                    {item.title}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1">{item.description}</Text>
                </View>
                <View
                  className={`w-5 h-5 rounded-full border ${
                    selectedSpecialties.includes(item.id)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedSpecialties.includes(item.id) && (
                    <View className="w-3 h-3 bg-white rounded-full m-0.5" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selection Summary */}
        {(selectedExpertise.length > 0 || selectedSpecialties.length > 0) && (
          <View className="mt-6 bg-blue-50 rounded-xl p-4">
            <Text className="font-bold text-gray-800 mb-2">Your Expertise Summary</Text>
            <Text className="text-gray-600 text-sm">
              {selectedExpertise.length > 0 && (
                <>
                  <Text className="font-medium">{selectedExpertise.length}</Text> area
                  {selectedExpertise.length !== 1 ? 's' : ''} of expertise
                </>
              )}
              {selectedExpertise.length > 0 && selectedSpecialties.length > 0 && ' • '}
              {selectedSpecialties.length > 0 && (
                <>
                  <Text className="font-medium">{selectedSpecialties.length}</Text> class{' '}
                  {selectedSpecialties.length !== 1 ? 'specialties' : 'specialty'}
                </>
              )}
            </Text>
          </View>
        )}
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
          <Text className="text-white font-bold text-lg">Continue to Availability</Text>
          <ChevronRight color="white" size={20} className="ml-2" />
        </TouchableOpacity>

        <TouchableOpacity className="py-3 items-center" onPress={handleCompleteLater}>
          <Text className="text-blue-600 font-medium">Complete later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CoachOnboardingExpertise;
