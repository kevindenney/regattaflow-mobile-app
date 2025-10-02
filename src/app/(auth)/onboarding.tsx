import { ThemedText } from '@/src/components/themed-text';
import { ThemedView } from '@/src/components/themed-view';
import { getDashboardRoute } from '@/src/lib/utils/userTypeRouting';
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/services/supabase';
import { errToText } from '@/src/utils/errToText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const onboardingSteps = [
  {
    title: 'Welcome to RegattaFlow',
    subtitle: 'Smart sailing strategy at your fingertips',
    description: 'Experience the future of sail racing with 3D maps, AI insights, and real-time weather data.',
    emoji: '🌊',
  },
  {
    title: '3D Nautical Charts',
    subtitle: 'Navigate like never before',
    description: 'Explore race areas with detailed 3D bathymetry, wind patterns, and tidal flows.',
    emoji: '🗺️',
  },
  {
    title: 'AI Race Strategy',
    subtitle: 'Powered by advanced AI',
    description: 'Get personalized race recommendations based on conditions, course layout, and your sailing style.',
    emoji: '🧠',
  },
  {
    title: 'Real-time Weather',
    subtitle: 'Stay ahead of the wind',
    description: 'Access live weather updates, forecasts, and visualizations to make informed tactical decisions.',
    emoji: '🌬️',
  },
  {
    title: 'Choose Your Role',
    subtitle: 'How do you use RegattaFlow?',
    description: 'Select your primary role to customize your experience.',
    emoji: '⛵',
    isUserTypeSelection: true,
  },
];

const userTypeOptions = [
  {
    type: 'sailor' as const,
    title: 'Sailor',
    description: 'Racing and performance tracking',
    emoji: '🏁',
  },
  {
    type: 'coach' as const,
    title: 'Coach',
    description: 'Team management and instruction',
    emoji: '👨‍🏫',
  },
  {
    type: 'club' as const,
    title: 'Club',
    description: 'Regatta management and operations',
    emoji: '🏛️',
  },
];

const SELECTED_ROLE_CACHE_KEY = 'regattaflow.selectedUserType';

export default function OnboardingScreen() {
  const { fetchUserProfile, userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedUserType, setSelectedUserType] = useState<'sailor' | 'coach' | 'club' | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  // Verify session on mount
  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        setMsg('No active session. Please sign in again.');
        setTimeout(() => router.replace('/(auth)/login'), 2000);
      } else {
        setHasSession(true);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const cachedRole = await AsyncStorage.getItem(SELECTED_ROLE_CACHE_KEY);
      if (cachedRole === 'sailor' || cachedRole === 'coach' || cachedRole === 'club') {
        setSelectedUserType(cachedRole);
      }
    })();
  }, []);

  useEffect(() => {
    if (userProfile?.user_type && !selectedUserType) {
      setSelectedUserType(userProfile.user_type);
      AsyncStorage.setItem(SELECTED_ROLE_CACHE_KEY, userProfile.user_type).catch((error) => {
        console.warn('[ONBOARD] Failed to cache selected user type:', error);
      });
    }
  }, [userProfile, selectedUserType]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleUserTypeSelect = (type: 'sailor' | 'coach' | 'club') => {
    setSelectedUserType(type);
    AsyncStorage.setItem(SELECTED_ROLE_CACHE_KEY, type).catch((error) => {
      console.warn('[ONBOARD] Failed to cache selected user type:', error);
    });
  };

  const handleGetStarted = async () => {
    if (busy) return;
    setBusy(true);
    setMsg(null);

    try {
      const { data: uRes, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;

      const user = uRes?.user;
      if (!user) {
        setMsg('You are not signed in.');
        setTimeout(() => router.replace('/(auth)/login'), 2000);
        return;
      }

      // Ensure profile exists with upsert (RLS-safe: id = auth.uid())
      const { error: upsertErr } = await supabase
        .from('users')
        .upsert(
          {
            id: user.id,
            email: user.email || null,
            user_type: selectedUserType,
            onboarding_completed: true,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            updated_at: new Date().toISOString()
          },
          { onConflict: 'id' }
        );

      if (upsertErr) {
        console.warn('[ONBOARD] upsert blocked (RLS?):', upsertErr);
        setMsg(`Profile creation failed: ${errToText(upsertErr)}`);
        return;
      }

      try {
        await fetchUserProfile(user.id);
        if (selectedUserType) {
          await AsyncStorage.setItem(SELECTED_ROLE_CACHE_KEY, selectedUserType);
        }
      } catch (profileError) {
        console.warn('[ONBOARD] Failed to refresh profile after onboarding:', profileError);
      }

      // Navigate to appropriate dashboard using unified routing
      const dashboardRoute = getDashboardRoute(selectedUserType);
      console.log('[ONBOARD] Navigating to dashboard:', dashboardRoute);
      router.replace(dashboardRoute);
    } catch (e: any) {
      console.error('[ONBOARD] error:', e);
      setMsg(errToText(e));
    } finally {
      setBusy(false);
    }
  };

  const currentStepData = onboardingSteps[currentStep];

  if (!hasSession) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <ThemedText style={styles.loadingText}>Checking session...</ThemedText>
          {msg && <ThemedText style={styles.errorText}>{msg}</ThemedText>}
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {onboardingSteps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentStep && styles.progressDotActive,
                  index < currentStep && styles.progressDotCompleted,
                ]}
              />
            ))}
          </View>

          {/* Step Content */}
          <View style={styles.stepContent}>
            <ThemedText style={styles.emoji}>{currentStepData.emoji}</ThemedText>
            <ThemedText style={styles.title}>{currentStepData.title}</ThemedText>
            <ThemedText style={styles.subtitle}>{currentStepData.subtitle}</ThemedText>
            <ThemedText style={styles.description}>{currentStepData.description}</ThemedText>

            {/* User Type Selection */}
            {currentStepData.isUserTypeSelection && (
              <View style={styles.userTypeContainer}>
                {userTypeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.type}
                    style={[
                      styles.userTypeOption,
                      selectedUserType === option.type && styles.userTypeOptionSelected,
                    ]}
                    onPress={() => handleUserTypeSelect(option.type)}
                  >
                    <ThemedText style={styles.userTypeEmoji}>{option.emoji}</ThemedText>
                    <ThemedText style={styles.userTypeTitle}>{option.title}</ThemedText>
                    <ThemedText style={styles.userTypeDescription}>
                      {option.description}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Error Message */}
          {msg && (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorMessage}>{msg}</ThemedText>
            </View>
          )}

          {/* Navigation Buttons */}
          <View style={styles.buttonContainer}>
            {currentStep > 0 && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handlePrevious}
                disabled={busy}
              >
                <ThemedText style={styles.secondaryButtonText}>Previous</ThemedText>
              </TouchableOpacity>
            )}

            {currentStep < onboardingSteps.length - 1 ? (
              <TouchableOpacity
                style={[styles.primaryButton, currentStep === 0 && styles.fullWidthButton]}
                onPress={handleNext}
                disabled={busy}
              >
                <ThemedText style={styles.primaryButtonText}>
                  {currentStep === 0 ? 'Get Started' : 'Next'}
                </ThemedText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!selectedUserType || busy) && styles.buttonDisabled,
                ]}
                onPress={handleGetStarted}
                disabled={!selectedUserType || busy}
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.primaryButtonText}>
                    Start Using RegattaFlow
                  </ThemedText>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 40,
    marginBottom: 40,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  progressDotActive: {
    backgroundColor: '#0066CC',
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: '#0066CC',
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#0066CC',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 400,
  },
  userTypeContainer: {
    marginTop: 32,
    gap: 12,
    width: '100%',
    maxWidth: 400,
  },
  userTypeOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  userTypeOptionSelected: {
    borderColor: '#0066CC',
    backgroundColor: '#F0F9FF',
  },
  userTypeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  userTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  userTypeDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  errorMessage: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#DC2626',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#0066CC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  fullWidthButton: {
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 0.4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
});