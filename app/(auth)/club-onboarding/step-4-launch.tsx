/**
 * Club Onboarding Step 4: Launch
 * Final step - create club, start 30-day trial, optional first event
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Rocket, 
  Calendar, 
  Trophy, 
  CheckCircle, 
  Gift,
  ArrowRight,
  Sparkles,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';

const ONBOARDING_STORAGE_KEY = '@club_onboarding_draft';

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
  emailVerified?: boolean;
}

export default function ClubOnboardingStep4() {
  const router = useRouter();
  const { user, refreshPersonaContext } = useAuth();
  
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [clubCreated, setClubCreated] = useState(false);
  const [createdClubId, setCreatedClubId] = useState<string | null>(null);

  // Load draft on mount
  useEffect(() => {
    loadDraft();
  }, []);

  const loadDraft = async () => {
    try {
      const draftData = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (draftData) {
        setDraft(JSON.parse(draftData));
      }
    } catch (error) {
      console.warn('Failed to load onboarding draft:', error);
    }
  };

  const handleLaunchClub = async () => {
    if (!user?.id || !draft) {
      Alert.alert('Error', 'Missing user or club information. Please go back and complete all steps.');
      return;
    }

    setIsCreating(true);
    try {
      // 1. Create the club
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .insert({
          name: draft.clubName,
          website: draft.website || null,
          contact_email: draft.contactEmail || null,
          contact_phone: draft.contactPhone || null,
          description: draft.description || null,
          logo_url: draft.logo || null,
          owner_id: user.id,
          // Location fields
          city: draft.city,
          country: draft.country,
          // Trial info
          trial_started_at: new Date().toISOString(),
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          subscription_status: 'trial',
        })
        .select()
        .single();

      if (clubError) {
        console.error('Club creation error:', clubError);
        throw new Error(clubError.message || 'Failed to create club');
      }

      const clubId = club.id;
      setCreatedClubId(clubId);

      // 2. Add user as club admin
      const { error: memberError } = await supabase
        .from('club_members')
        .insert({
          club_id: clubId,
          user_id: user.id,
          role: 'admin',
          title: draft.userRole || 'admin',
          status: 'active',
        });

      if (memberError) {
        console.warn('Club member creation warning:', memberError);
        // Don't throw - club was created, membership is secondary
      }

      // 3. Update user profile with club_id
      const { error: profileError } = await supabase
        .from('users')
        .update({ 
          club_id: clubId,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (profileError) {
        console.warn('Profile update warning:', profileError);
      }

      // 4. Add boat classes if any
      if (draft.boatClasses && draft.boatClasses.length > 0) {
        // For each boat class, try to find or create it
        for (const className of draft.boatClasses) {
          try {
            // First try to find existing class
            const { data: existingClass } = await supabase
              .from('boat_classes')
              .select('id')
              .ilike('name', className)
              .single();

            const classId = existingClass?.id;
            
            if (classId) {
              // Link to club
              await supabase
                .from('club_boat_classes')
                .insert({
                  club_id: clubId,
                  boat_class_id: classId,
                })
                .select();
            }
          } catch (e) {
            // Ignore individual class errors
            console.warn(`Failed to add boat class ${className}:`, e);
          }
        }
      }

      // 5. Send welcome email (fire and forget)
      supabase.functions.invoke('send-welcome-email', {
        body: {
          email: draft.contactEmail || user.email,
          clubName: draft.clubName,
          trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      }).catch(e => console.warn('Welcome email error:', e));

      // 6. Clear the draft
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);

      // 7. Refresh auth context to pick up new club
      await refreshPersonaContext?.();

      // Show success!
      setClubCreated(true);

    } catch (error) {
      console.error('Launch club error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create club. Please try again.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateFirstEvent = () => {
    if (createdClubId) {
      router.replace({
        pathname: '/club/event/create',
        params: { clubId: createdClubId },
      });
    }
  };

  const handleGoToDashboard = () => {
    router.replace('/(tabs)/events');
  };

  // Success state
  if (clubCreated && draft) {
    return (
      <View className="flex-1 bg-white">
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 40 }}
        >
          {/* Success Icon */}
          <View className="w-24 h-24 bg-emerald-100 rounded-full items-center justify-center mb-6">
            <CheckCircle size={48} color="#22c55e" />
          </View>

          <Text className="text-3xl font-bold text-gray-900 text-center mb-2">
            🎉 Welcome aboard!
          </Text>
          <Text className="text-lg text-gray-600 text-center mb-2">
            {draft.clubName} is ready to sail
          </Text>

          {/* Trial Info */}
          <View className="bg-gradient-to-r from-sky-50 to-violet-50 border border-sky-100 rounded-2xl p-5 mt-6 mb-8 w-full">
            <View className="flex-row items-center mb-3">
              <Gift size={20} color="#7c3aed" />
              <Text className="text-violet-700 font-bold ml-2">
                30-Day Free Trial Active
              </Text>
            </View>
            <Text className="text-gray-600">
              You have full access to all features. No credit card required until your trial ends.
            </Text>
            <View className="flex-row items-center mt-3 pt-3 border-t border-sky-100">
              <Sparkles size={16} color="#0284c7" />
              <Text className="text-sky-700 text-sm ml-2">
                Trial ends: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* What's Next */}
          <Text className="text-gray-700 font-semibold mb-4">What would you like to do first?</Text>

          {/* Create Event Option */}
          <TouchableOpacity
            onPress={handleCreateFirstEvent}
            className="w-full bg-sky-600 p-5 rounded-2xl mb-3 flex-row items-center"
          >
            <View className="w-12 h-12 bg-sky-500 rounded-xl items-center justify-center">
              <Calendar size={24} color="#fff" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-white font-bold text-lg">Create First Event</Text>
              <Text className="text-sky-100 text-sm">Set up a race or regatta now</Text>
            </View>
            <ArrowRight size={20} color="#fff" />
          </TouchableOpacity>

          {/* Dashboard Option */}
          <TouchableOpacity
            onPress={handleGoToDashboard}
            className="w-full bg-white border border-gray-200 p-5 rounded-2xl flex-row items-center"
          >
            <View className="w-12 h-12 bg-gray-100 rounded-xl items-center justify-center">
              <Trophy size={24} color="#374151" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-gray-900 font-bold text-lg">Explore Dashboard</Text>
              <Text className="text-gray-500 text-sm">Set up your club at your own pace</Text>
            </View>
            <ArrowRight size={20} color="#9ca3af" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Pre-launch state
  return (
    <ScrollView
      className="flex-1 px-6"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 24 }}
    >
      {/* Header */}
      <View className="items-center py-6">
        <View className="w-20 h-20 bg-gradient-to-br from-sky-100 to-violet-100 rounded-full items-center justify-center mb-4">
          <Rocket size={40} color="#7c3aed" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 text-center">
          Ready to launch!
        </Text>
        <Text className="text-gray-500 text-center mt-2">
          Let's review your club details and get you started
        </Text>
      </View>

      {/* Summary Card */}
      {draft && (
        <View className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <Text className="text-gray-900 font-bold text-lg mb-4">Club Summary</Text>
          
          <View className="space-y-3">
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-500">Club Name</Text>
              <Text className="text-gray-900 font-medium">{draft.clubName}</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-500">Location</Text>
              <Text className="text-gray-900 font-medium">{draft.city}, {draft.country}</Text>
            </View>
            {draft.contactEmail && (
              <View className="flex-row justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-500">Email</Text>
                <Text className="text-gray-900 font-medium">{draft.contactEmail}</Text>
              </View>
            )}
            {draft.boatClasses && draft.boatClasses.length > 0 && (
              <View className="py-2">
                <Text className="text-gray-500 mb-2">Boat Classes</Text>
                <View className="flex-row flex-wrap gap-2">
                  {draft.boatClasses.map((c) => (
                    <View key={c} className="bg-sky-50 px-3 py-1 rounded-full">
                      <Text className="text-sky-700 text-sm">{c}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Trial Benefits */}
      <View className="bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-100 rounded-2xl p-5 mb-6">
        <View className="flex-row items-center mb-3">
          <Gift size={20} color="#059669" />
          <Text className="text-emerald-700 font-bold ml-2">
            Your 30-Day Free Trial Includes:
          </Text>
        </View>
        <View className="space-y-2">
          {[
            'Unlimited events & regattas',
            'Live race tracking',
            'Online entry management',
            'Results & scoring',
            'Member communications',
          ].map((feature, i) => (
            <View key={i} className="flex-row items-center">
              <CheckCircle size={16} color="#22c55e" />
              <Text className="text-gray-700 ml-2">{feature}</Text>
            </View>
          ))}
        </View>
        <Text className="text-gray-500 text-sm mt-3">
          No credit card required. Cancel anytime.
        </Text>
      </View>

      {/* Launch Button */}
      <TouchableOpacity
        onPress={handleLaunchClub}
        disabled={isCreating}
        className={`py-4 rounded-2xl items-center flex-row justify-center ${
          isCreating ? 'bg-gray-300' : 'bg-sky-600'
        }`}
      >
        {isCreating ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Rocket size={20} color="#fff" />
            <Text className="text-white font-bold text-lg ml-2">
              Launch My Club
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Back link */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="py-4 items-center"
        disabled={isCreating}
      >
        <Text className="text-gray-500">← Go back and edit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

