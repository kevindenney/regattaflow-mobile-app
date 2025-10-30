/**
 * Onboarding Form Fields
 * Clean text entry fields with contextual help for collecting user data
 * Inspired by QuickPasteOptions design pattern
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { User, Sailboat, MapPin, Wrench } from 'lucide-react-native';

interface OnboardingFormFieldsProps {
  onSubmit: (data: SailorFormData) => void;
  initialData?: Partial<SailorFormData>;
}

export interface SailorFormData {
  // Personal Info
  name: string;
  sailorRole?: 'owner' | 'crew' | 'both';

  // Boat Details (optional)
  boatClass?: string;
  sailNumber?: string;
  boatName?: string;

  // Equipment (optional)
  hullMaker?: string;
  sailMaker?: string;
  rigMaker?: string;
  mastMaker?: string;

  // Clubs & Venues (optional)
  yachtClub?: string;
  homeVenue?: string;

  // Racing Calendar (optional)
  racingCalendar?: string;

  // Next Race Info (optional)
  nextRaceName?: string;
  nextRaceDate?: string;
  nextRaceLocation?: string;
  nextRaceTime?: string;
}

export function OnboardingFormFields({ onSubmit, initialData }: OnboardingFormFieldsProps) {
  const [formData, setFormData] = useState<Partial<SailorFormData>>(initialData || {});

  const updateField = (field: keyof SailorFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    // Only require name and sailor role
    return (
      formData.name?.trim() &&
      formData.sailorRole
    );
  };

  const handleSubmit = () => {
    if (isFormValid()) {
      onSubmit(formData as SailorFormData);
    }
  };

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="space-y-6">
        {/* Personal Information Section */}
        <View className="bg-white border border-sky-200 rounded-lg p-4">
          <View className="flex-row items-center gap-2 mb-3">
            <User size={20} color="#0284c7" />
            <Text className="text-lg font-bold text-sky-900">About You</Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-sky-900 mb-1">
              Your Name *
            </Text>
            <Text className="text-xs text-sky-700 mb-2">
              We'll use this to personalize your experience
            </Text>
            <TextInput
              value={formData.name || ''}
              onChangeText={(text) => updateField('name', text)}
              placeholder="e.g., Bram Van Olsen"
              className="bg-sky-50 border border-sky-300 rounded-lg p-3 text-base text-gray-900"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-sky-900 mb-1">
              Your Role *
            </Text>
            <Text className="text-xs text-sky-700 mb-2">
              Are you a boat owner, crew member, or both?
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => updateField('sailorRole', 'owner')}
                className={`flex-1 p-3 rounded-lg border-2 ${
                  formData.sailorRole === 'owner'
                    ? 'bg-sky-100 border-sky-600'
                    : 'bg-sky-50 border-sky-300'
                }`}
              >
                <Text className={`text-center font-semibold ${
                  formData.sailorRole === 'owner' ? 'text-sky-900' : 'text-sky-600'
                }`}>
                  Owner
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateField('sailorRole', 'crew')}
                className={`flex-1 p-3 rounded-lg border-2 ${
                  formData.sailorRole === 'crew'
                    ? 'bg-sky-100 border-sky-600'
                    : 'bg-sky-50 border-sky-300'
                }`}
              >
                <Text className={`text-center font-semibold ${
                  formData.sailorRole === 'crew' ? 'text-sky-900' : 'text-sky-600'
                }`}>
                  Crew
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateField('sailorRole', 'both')}
                className={`flex-1 p-3 rounded-lg border-2 ${
                  formData.sailorRole === 'both'
                    ? 'bg-sky-100 border-sky-600'
                    : 'bg-sky-50 border-sky-300'
                }`}
              >
                <Text className={`text-center font-semibold ${
                  formData.sailorRole === 'both' ? 'text-sky-900' : 'text-sky-600'
                }`}>
                  Both
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Boat Details Section */}
        <View className="bg-white border border-sky-200 rounded-lg p-4">
          <View className="flex-row items-center gap-2 mb-3">
            <Sailboat size={20} color="#0284c7" />
            <Text className="text-lg font-bold text-sky-900">Your Boat (Optional)</Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-sky-900 mb-1">
              Boat Class
            </Text>
            <Text className="text-xs text-sky-700 mb-2">
              Your racing class (e.g., Dragon, J/70, Laser)
            </Text>
            <TextInput
              value={formData.boatClass || ''}
              onChangeText={(text) => updateField('boatClass', text)}
              placeholder="e.g., Dragon"
              className="bg-sky-50 border border-sky-300 rounded-lg p-3 text-base text-gray-900"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-sky-900 mb-1">
              Sail Number
            </Text>
            <Text className="text-xs text-sky-700 mb-2">
              Your unique sail identification number
            </Text>
            <TextInput
              value={formData.sailNumber || ''}
              onChangeText={(text) => updateField('sailNumber', text)}
              placeholder="e.g., HKG 59 or D59"
              className="bg-sky-50 border border-sky-300 rounded-lg p-3 text-base text-gray-900"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-sky-900 mb-1">
              Boat Name
            </Text>
            <Text className="text-xs text-sky-700 mb-2">
              Optional: your boat's name (e.g., "Blue Lightning")
            </Text>
            <TextInput
              value={formData.boatName || ''}
              onChangeText={(text) => updateField('boatName', text)}
              placeholder="e.g., Blue Lightning"
              className="bg-sky-50 border border-sky-300 rounded-lg p-3 text-base text-gray-900"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Equipment Section */}
        <View className="bg-white border border-sky-200 rounded-lg p-4">
          <View className="flex-row items-center gap-2 mb-3">
            <Wrench size={20} color="#0284c7" />
            <Text className="text-lg font-bold text-sky-900">Equipment & Suppliers</Text>
          </View>
          <Text className="text-xs text-sky-700 mb-3">
            This helps us provide gear-specific insights and connect you with the right suppliers
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-sky-900 mb-1">
              Hull Maker
            </Text>
            <TextInput
              value={formData.hullMaker || ''}
              onChangeText={(text) => updateField('hullMaker', text)}
              placeholder="e.g., Petticrows, C&C Yachts"
              className="bg-sky-50 border border-sky-300 rounded-lg p-3 text-base text-gray-900"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-sky-900 mb-1">
              Sail Maker
            </Text>
            <TextInput
              value={formData.sailMaker || ''}
              onChangeText={(text) => updateField('sailMaker', text)}
              placeholder="e.g., North Sails, Quantum, UK Sailmakers"
              className="bg-sky-50 border border-sky-300 rounded-lg p-3 text-base text-gray-900"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-sky-900 mb-1">
              Rig Maker
            </Text>
            <TextInput
              value={formData.rigMaker || ''}
              onChangeText={(text) => updateField('rigMaker', text)}
              placeholder="e.g., Southern Spars, Hall Spars"
              className="bg-sky-50 border border-sky-300 rounded-lg p-3 text-base text-gray-900"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-sky-900 mb-1">
              Mast Maker
            </Text>
            <TextInput
              value={formData.mastMaker || ''}
              onChangeText={(text) => updateField('mastMaker', text)}
              placeholder="e.g., Selden, Z-Spars"
              className="bg-sky-50 border border-sky-300 rounded-lg p-3 text-base text-gray-900"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Yacht Club & Venue Section */}
        <View className="bg-white border border-sky-200 rounded-lg p-4">
          <View className="flex-row items-center gap-2 mb-3">
            <MapPin size={20} color="#0284c7" />
            <Text className="text-lg font-bold text-sky-900">Yacht Club & Home Venue (Optional)</Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-sky-900 mb-1">
              Yacht Club
            </Text>
            <Text className="text-xs text-sky-700 mb-2">
              Your primary sailing club or organization
            </Text>
            <TextInput
              value={formData.yachtClub || ''}
              onChangeText={(text) => updateField('yachtClub', text)}
              placeholder="e.g., Royal Hong Kong Yacht Club"
              className="bg-sky-50 border border-sky-300 rounded-lg p-3 text-base text-gray-900"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-sky-900 mb-1">
              Home Venue
            </Text>
            <Text className="text-xs text-sky-700 mb-2">
              Where you usually race (e.g., Victoria Harbour, San Francisco Bay)
            </Text>
            <TextInput
              value={formData.homeVenue || ''}
              onChangeText={(text) => updateField('homeVenue', text)}
              placeholder="e.g., Victoria Harbour, Hong Kong"
              className="bg-sky-50 border border-sky-300 rounded-lg p-3 text-base text-gray-900"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>


        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isFormValid()}
          className={`py-4 rounded-lg ${
            isFormValid() ? 'bg-sky-600' : 'bg-gray-300'
          }`}
        >
          <Text className="text-center text-base font-bold text-white">
            {isFormValid() ? 'Complete Setup' : 'Fill Required Fields'}
          </Text>
        </TouchableOpacity>

        {!isFormValid() && (
          <Text className="text-xs text-center text-gray-500 -mt-2">
            * Required fields: Name and Your Role
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

export default OnboardingFormFields;
