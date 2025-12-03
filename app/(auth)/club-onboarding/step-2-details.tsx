/**
 * Club Onboarding Step 2: Details
 * Logo upload, description, and boat classes
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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, Image as ImageIcon, X, Plus, Sailboat } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_STORAGE_KEY = '@club_onboarding_draft';

// Popular boat classes for suggestions
const POPULAR_BOAT_CLASSES = [
  'Laser', 'Optimist', 'J/70', 'Dragon', '420', '49er',
  'Nacra 17', 'IRC', 'J/80', 'Etchells', 'Star', 'Finn',
];

interface OnboardingDraft {
  clubName: string;
  city: string;
  country: string;
  website: string;
  logo?: string;
  description?: string;
  boatClasses?: string[];
  contactEmail?: string;
  contactPhone?: string;
  userRole?: string;
}

export default function ClubOnboardingStep2() {
  const router = useRouter();
  
  const [logo, setLogo] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [boatClasses, setBoatClasses] = useState<string[]>([]);
  const [newClass, setNewClass] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [clubName, setClubName] = useState('');

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
        setLogo(data.logo || null);
        setDescription(data.description || '');
        setBoatClasses(data.boatClasses || []);
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

  const handlePickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload a logo.');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Store as base64 for now (will upload to storage on final submit)
        setLogo(asset.uri);
        await saveDraft({ logo: asset.uri });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleRemoveLogo = async () => {
    setLogo(null);
    await saveDraft({ logo: undefined });
  };

  const handleAddClass = (className: string) => {
    const trimmed = className.trim();
    if (trimmed && !boatClasses.includes(trimmed)) {
      const updated = [...boatClasses, trimmed];
      setBoatClasses(updated);
      saveDraft({ boatClasses: updated });
      setNewClass('');
    }
  };

  const handleRemoveClass = (className: string) => {
    const updated = boatClasses.filter(c => c !== className);
    setBoatClasses(updated);
    saveDraft({ boatClasses: updated });
  };

  const handleContinue = async () => {
    setIsSaving(true);
    try {
      // Save draft
      await saveDraft({
        logo: logo ?? undefined,
        description: description.trim(),
        boatClasses,
      });

      // Navigate to next step
      router.push('/(auth)/club-onboarding/step-3-contact');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter suggestions to exclude already selected
  const availableSuggestions = POPULAR_BOAT_CLASSES.filter(
    c => !boatClasses.includes(c)
  );

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
          <Text className="text-2xl font-bold text-gray-900 text-center">
            Customize your club
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            Add your logo and tell sailors what you're about
          </Text>
        </View>

        {/* Logo Upload */}
        <View className="mb-6">
          <Text className="text-gray-700 font-medium mb-3">Club Logo</Text>
          <View className="items-center">
            {logo ? (
              <View className="relative">
                <Image
                  source={{ uri: logo ?? '' }}
                  className="w-28 h-28 rounded-2xl"
                />
                <TouchableOpacity
                  onPress={handleRemoveLogo}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full items-center justify-center shadow-sm"
                >
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handlePickImage}
                className="w-28 h-28 bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl items-center justify-center"
              >
                <Camera size={28} color="#9ca3af" />
                <Text className="text-gray-500 text-xs mt-2">Add Logo</Text>
              </TouchableOpacity>
            )}
            {!logo && (
              <Text className="text-gray-400 text-xs mt-2 text-center">
                Square image works best (PNG or JPG)
              </Text>
            )}
          </View>
        </View>

        {/* Description */}
        <View className="mb-6">
          <Text className="text-gray-700 font-medium mb-2">
            About Your Club <Text className="text-gray-400">(optional)</Text>
          </Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 min-h-[100px]"
            placeholder="Tell sailors what makes your club special..."
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              saveDraft({ description: text });
            }}
            multiline
            textAlignVertical="top"
          />
          <Text className="text-gray-400 text-xs mt-1 text-right">
            {description.length}/500
          </Text>
        </View>

        {/* Boat Classes */}
        <View className="mb-6">
          <View className="flex-row items-center mb-2">
            <Sailboat size={18} color="#374151" />
            <Text className="text-gray-700 font-medium ml-2">
              Boat Classes You Race
            </Text>
          </View>
          
          {/* Selected classes */}
          {boatClasses.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-3">
              {boatClasses.map((className) => (
                <View
                  key={className}
                  className="flex-row items-center bg-sky-100 px-3 py-1.5 rounded-full"
                >
                  <Text className="text-sky-700 font-medium">{className}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveClass(className)}
                    className="ml-2"
                  >
                    <X size={14} color="#0369a1" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Add custom class */}
          <View className="flex-row items-center mb-3">
            <TextInput
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
              placeholder="Add a boat class..."
              value={newClass}
              onChangeText={setNewClass}
              onSubmitEditing={() => handleAddClass(newClass)}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={() => handleAddClass(newClass)}
              disabled={!newClass.trim()}
              className={`ml-2 w-11 h-11 rounded-xl items-center justify-center ${
                newClass.trim() ? 'bg-sky-600' : 'bg-gray-200'
              }`}
            >
              <Plus size={20} color={newClass.trim() ? '#fff' : '#9ca3af'} />
            </TouchableOpacity>
          </View>

          {/* Suggestions */}
          {availableSuggestions.length > 0 && (
            <View>
              <Text className="text-gray-500 text-sm mb-2">Popular classes:</Text>
              <View className="flex-row flex-wrap gap-2">
                {availableSuggestions.slice(0, 8).map((className) => (
                  <TouchableOpacity
                    key={className}
                    onPress={() => handleAddClass(className)}
                    className="bg-white border border-gray-200 px-3 py-1.5 rounded-full"
                  >
                    <Text className="text-gray-600">+ {className}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
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
        
        <TouchableOpacity
          onPress={handleContinue}
          className="py-3 items-center mt-2"
        >
          <Text className="text-gray-500">Skip for now</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

