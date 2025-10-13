/**
 * Redesigned Onboarding Screen
 * Three tabs (Sailor, Club, Coach) with clean text entry fields
 * Follows QuickPasteOptions design pattern
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/providers/AuthProvider';
import { PersonaTabBar, PersonaType } from '@/src/components/onboarding/PersonaTabBar';
import { OnboardingFormFields, SailorFormData } from '@/src/components/onboarding/OnboardingFormFields';
import { supabase } from '@/src/services/supabase';

export default function OnboardingRedesign() {
  const router = useRouter();
  const { user, updateUserProfile } = useAuth();
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('sailor');

  const handleSailorSubmit = async (data: SailorFormData) => {
    try {
      console.log('✅ Sailor data submitted:', data);

      if (!user?.id) {
        console.error('❌ No user ID available');
        alert('Error: No user session found. Please try logging in again.');
        return;
      }

      // Save user profile with onboarding data
      await updateUserProfile({
        full_name: data.name,
        user_type: 'sailor',
        onboarding_completed: true,
        onboarding_step: 'completed',
        onboarding_data: {
          sailorData: data, // Store all form data
        },
      });

      console.log('✅ User profile updated with onboarding data');

      // Create a boat record if boat class is provided
      if (data.boatClass) {
        // First, find or create the boat class
        let classId: string | null = null;

        // Try to find existing boat class
        const { data: existingClass } = await supabase
          .from('boat_classes')
          .select('id')
          .ilike('name', data.boatClass)
          .single();

        if (existingClass) {
          classId = existingClass.id;
          console.log('✅ Found existing boat class:', classId);
        } else {
          // Create new boat class if it doesn't exist
          const { data: newClass, error: classError } = await supabase
            .from('boat_classes')
            .insert({
              name: data.boatClass,
              boat_type: 'keelboat', // Default assumption
            })
            .select('id')
            .single();

          if (classError) {
            console.error('⚠️ Error creating boat class:', classError);
          } else {
            classId = newClass.id;
            console.log('✅ Created new boat class:', classId);
          }
        }

        // Now create the sailor boat with proper schema
        if (classId) {
          const { error: boatError } = await supabase
            .from('sailor_boats')
            .insert({
              sailor_id: user.id,
              class_id: classId,
              sail_number: data.sailNumber || null,
              is_owner: true,
              is_primary: true,
            });

          if (boatError) {
            console.error('⚠️ Error creating boat:', boatError);
            console.error('⚠️ Boat error details:', JSON.stringify(boatError));
            // Don't block onboarding if boat creation fails
          } else {
            console.log('✅ Boat created successfully');
          }
        }
      }

      // Parse and create regattas from racing calendar CSV
      if (data.racingCalendar) {
        try {
          const lines = data.racingCalendar.split('\n').filter(line => line.trim());
          const regattasToInsert = [];

          // Skip header line and process each race
          for (let i = 1; i < lines.length; i++) {
            const columns = lines[i].split('\t');
            if (columns.length >= 2) {
              const raceName = columns[0]?.trim();
              const dateStr = columns[1]?.trim();
              const location = columns[2]?.trim() || data.homeVenue || 'TBD';

              if (raceName && dateStr) {
                // Parse date (DD/MM/YYYY format)
                const [day, month, year] = dateStr.split('/');
                const raceDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

                regattasToInsert.push({
                  name: raceName,
                  start_date: raceDate,
                  created_by: user.id,
                  status: 'upcoming',
                  metadata: {
                    venue: location,
                    class_name: data.boatClass || 'TBD',
                    source: 'onboarding_calendar'
                  }
                });
              }
            }
          }

          if (regattasToInsert.length > 0) {
            const { error: calendarError } = await supabase
              .from('regattas')
              .insert(regattasToInsert);

            if (calendarError) {
              console.error('⚠️ Error creating calendar races:', calendarError);
            } else {
              console.log(`✅ Created ${regattasToInsert.length} races from calendar`);
            }
          }
        } catch (parseError) {
          console.error('⚠️ Error parsing racing calendar:', parseError);
        }
      }

      // Create a regatta record for next race if provided (and not already in calendar)
      if (data.nextRaceName && data.nextRaceDate && !data.racingCalendar) {
        const { error: regattaError } = await supabase
          .from('regattas')
          .insert({
            name: data.nextRaceName,
            start_date: data.nextRaceDate,
            created_by: user.id,
            status: 'upcoming',
            metadata: {
              venue: data.nextRaceLocation || 'TBD',
              class_name: data.boatClass || 'TBD',
              start_time: data.nextRaceTime || '00:00',
              source: 'onboarding'
            }
          });

        if (regattaError) {
          console.error('⚠️ Error creating regatta:', regattaError);
          // Don't block onboarding if regatta creation fails
        } else {
          console.log('✅ Next race created successfully');
        }
      }

      // Navigate to dashboard
      console.log('✅ Navigating to dashboard...');
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      console.error('❌ Error saving sailor profile:', error);
      alert(error.message || 'Failed to save profile. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="bg-sky-600 px-6 py-4">
          <Text className="text-white text-2xl font-bold mb-1">Welcome to RegattaFlow</Text>
          <Text className="text-sky-100 text-sm">Set up your sailing profile</Text>
        </View>

        {/* Persona Tabs */}
        <PersonaTabBar
          selectedPersona={selectedPersona}
          onPersonaChange={setSelectedPersona}
        />

        {/* Content */}
        <View className="flex-1 px-6 py-4">
          {selectedPersona === 'sailor' && (
            <OnboardingFormFields onSubmit={handleSailorSubmit} />
          )}

          {selectedPersona === 'club' && (
            <View className="flex-1 items-center justify-center p-6">
              <Text className="text-xl font-bold text-gray-700 mb-2">
                🏛️ Club Onboarding
              </Text>
              <Text className="text-sm text-gray-500 text-center">
                Club onboarding coming soon! You'll be able to manage regattas, entries, and results.
              </Text>
            </View>
          )}

          {selectedPersona === 'coach' && (
            <View className="flex-1 items-center justify-center p-6">
              <Text className="text-xl font-bold text-gray-700 mb-2">
                🎓 Coach Onboarding
              </Text>
              <Text className="text-sm text-gray-500 text-center">
                Coach onboarding coming soon! You'll be able to offer sessions and connect with sailors.
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
