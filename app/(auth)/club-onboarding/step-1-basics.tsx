/**
 * Club Onboarding Step 1: Basics
 * Club name, location, and optional website for auto-fill
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Globe, Sparkles, Building2 } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_STORAGE_KEY = '@club_onboarding_draft';

// Popular sailing locations for quick selection
const POPULAR_LOCATIONS = [
  { city: 'Hong Kong', country: 'Hong Kong SAR' },
  { city: 'Sydney', country: 'Australia' },
  { city: 'San Francisco', country: 'USA' },
  { city: 'Auckland', country: 'New Zealand' },
  { city: 'Cowes', country: 'United Kingdom' },
  { city: 'Newport', country: 'USA' },
];

interface OnboardingDraft {
  clubName: string;
  city: string;
  country: string;
  website: string;
  // Step 2 fields
  logo?: string;
  description?: string;
  boatClasses?: string[];
  // Step 3 fields
  contactEmail?: string;
  contactPhone?: string;
  userRole?: string;
}

export default function ClubOnboardingStep1() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [clubName, setClubName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [website, setWebsite] = useState('');
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load draft on mount
  useEffect(() => {
    loadDraft();
  }, []);

  const loadDraft = async () => {
    try {
      const draft = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (draft) {
        const data: OnboardingDraft = JSON.parse(draft);
        setClubName(data.clubName || '');
        setCity(data.city || '');
        setCountry(data.country || '');
        setWebsite(data.website || '');
      }
    } catch (error) {
      console.warn('Failed to load onboarding draft:', error);
    }
  };

  const saveDraft = async (data: Partial<OnboardingDraft>) => {
    try {
      const existingDraft = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      const existing = existingDraft ? JSON.parse(existingDraft) : {};
      const updated = { ...existing, ...data };
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save onboarding draft:', error);
    }
  };

  const handleAutoFill = async () => {
    if (!website.trim()) {
      Alert.alert('Enter Website', 'Please enter your club website URL first.');
      return;
    }

    setIsAutoFilling(true);
    try {
      // Normalize URL
      let url = website.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      // Call the scrape edge function
      const { data, error } = await supabase.functions.invoke('club-scrape', {
        body: { url },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        const scraped = data.data;
        
        // Auto-fill fields
        if (scraped.club_name && !clubName) {
          setClubName(scraped.club_name);
        }
        if (scraped.venue?.city && !city) {
          setCity(scraped.venue.city);
        }
        if (scraped.venue?.country && !country) {
          setCountry(scraped.venue.country);
        }

        // Save scraped data for later steps
        await saveDraft({
          clubName: scraped.club_name || clubName,
          city: scraped.venue?.city || city,
          country: scraped.venue?.country || country,
          website: url,
          description: scraped.summary,
          contactEmail: scraped.contact?.email,
          contactPhone: scraped.contact?.phone,
          boatClasses: scraped.classes?.map((c: any) => c.name),
        });

        Alert.alert('✨ Auto-fill Complete', 'We found some information about your club!');
      } else {
        Alert.alert('No Data Found', "We couldn't find club information at that URL. Please fill in the details manually.");
      }
    } catch (error) {
      console.error('Auto-fill error:', error);
      Alert.alert('Auto-fill Failed', 'Unable to fetch club information. Please fill in the details manually.');
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleSelectLocation = (location: { city: string; country: string }) => {
    setCity(location.city);
    setCountry(location.country);
  };

  const handleContinue = async () => {
    // Validation
    if (!clubName.trim()) {
      Alert.alert('Club Name Required', 'Please enter your club name.');
      return;
    }
    if (!city.trim() || !country.trim()) {
      Alert.alert('Location Required', 'Please enter your club location.');
      return;
    }

    setIsSaving(true);
    try {
      // Save draft
      await saveDraft({
        clubName: clubName.trim(),
        city: city.trim(),
        country: country.trim(),
        website: website.trim(),
      });

      // Navigate to next step
      router.push('/(auth)/club-onboarding/step-2-details');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="items-center py-6">
          <View className="w-16 h-16 bg-sky-100 rounded-2xl items-center justify-center mb-4">
            <Building2 size={32} color="#0284c7" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 text-center">
            Tell us about your club
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            We'll use this to set up your club profile
          </Text>
        </View>

        {/* Website Auto-fill (Optional but prominent) */}
        <View className="bg-gradient-to-r from-violet-50 to-sky-50 border border-violet-100 rounded-2xl p-4 mb-6">
          <View className="flex-row items-center mb-2">
            <Sparkles size={18} color="#7c3aed" />
            <Text className="text-violet-700 font-semibold ml-2">Quick Start</Text>
          </View>
          <Text className="text-gray-600 text-sm mb-3">
            Have a club website? We can auto-fill your details.
          </Text>
          <View className="flex-row items-center">
            <View className="flex-1 bg-white rounded-xl border border-gray-200 flex-row items-center px-3">
              <Globe size={18} color="#9ca3af" />
              <TextInput
                className="flex-1 py-3 px-2 text-gray-900"
                placeholder="yourclub.com"
                value={website}
                onChangeText={setWebsite}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>
            <TouchableOpacity
              onPress={handleAutoFill}
              disabled={isAutoFilling}
              className={`ml-2 px-4 py-3 rounded-xl ${
                isAutoFilling ? 'bg-gray-300' : 'bg-violet-600'
              }`}
            >
              {isAutoFilling ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Auto-fill</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Club Name */}
        <View className="mb-5">
          <Text className="text-gray-700 font-medium mb-2">
            Club Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-base"
            placeholder="e.g., Royal Hong Kong Yacht Club"
            value={clubName}
            onChangeText={setClubName}
            autoCapitalize="words"
          />
        </View>

        {/* Location */}
        <View className="mb-5">
          <Text className="text-gray-700 font-medium mb-2">
            Location <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900"
                placeholder="City"
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View className="flex-1">
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900"
                placeholder="Country"
                value={country}
                onChangeText={setCountry}
              />
            </View>
          </View>
        </View>

        {/* Quick Location Selection */}
        <View className="mb-8">
          <Text className="text-gray-500 text-sm mb-2">Popular sailing locations:</Text>
          <View className="flex-row flex-wrap gap-2">
            {POPULAR_LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={`${loc.city}-${loc.country}`}
                onPress={() => handleSelectLocation(loc)}
                className={`flex-row items-center px-3 py-2 rounded-full border ${
                  city === loc.city && country === loc.country
                    ? 'bg-sky-50 border-sky-300'
                    : 'bg-white border-gray-200'
                }`}
              >
                <MapPin size={14} color={city === loc.city ? '#0284c7' : '#9ca3af'} />
                <Text
                  className={`ml-1.5 text-sm ${
                    city === loc.city ? 'text-sky-700 font-medium' : 'text-gray-600'
                  }`}
                >
                  {loc.city}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Spacer for button */}
        <View className="h-24" />
      </ScrollView>

      {/* Continue Button */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={isSaving}
          className={`py-4 rounded-2xl items-center ${
            isSaving ? 'bg-gray-300' : 'bg-sky-600'
          }`}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

