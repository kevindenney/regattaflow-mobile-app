import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/src/components/themed-text';
import { ThemedView } from '@/src/components/themed-view';
import { useAuth } from '@/src/providers/AuthProvider';
import { getDashboardRoute } from '@/src/lib/utils/userTypeRouting';
import { supabase } from '@/src/services/supabase';
import { logSession, dumpSbStorage } from '@/src/utils/authDebug';

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
    description: 'Teaching and instruction',
    emoji: '🎯',
  },
  {
    type: 'club' as const,
    title: 'Club/Organizer',
    description: 'Event management and results',
    emoji: '🏆',
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedUserType, setSelectedUserType] = useState<'sailor' | 'coach' | 'club' | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null); // null = checking, true/false = result
  const { user, updateUserProfile, userProfile, signedIn, ready } = useAuth();
  const step = onboardingSteps[currentStep];

  // Session validation on mount and auth changes
  useEffect(() => {
    const validateSession = async () => {
      console.log('🔐 [ONBOARDING] Starting session validation...');

      try {
        dumpSbStorage();
        await logSession(supabase, 'ONBOARDING_CHECK');

        const { data, error } = await supabase.auth.getSession();
        const hasValidSession = !error && !!data?.session?.user;

        console.log('🔐 [ONBOARDING] Session validation result:', {
          hasValidSession,
          error: error?.message,
          userId: data?.session?.user?.id,
          userEmail: data?.session?.user?.email
        });

        setSessionValid(hasValidSession);

        if (!hasValidSession) {
          console.log('🔐 [ONBOARDING] Invalid session - routing to login');
          router.replace('/(auth)/login');
          return;
        }

        console.log('🔐 [ONBOARDING] Session valid - proceeding with onboarding');
      } catch (error: any) {
        console.error('🔐 [ONBOARDING] Session validation error:', error);
        setSessionValid(false);
        router.replace('/(auth)/login');
      }
    };

    // Only validate when auth is ready
    if (ready) {
      validateSession();
    }
  }, [ready, router]);

  // Log auth state on mount and changes
  useEffect(() => {
    console.log('📱 [ONBOARDING] Component state updated');
    console.log('📱 [ONBOARDING] Auth state:', {
      ready,
      signedIn,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userProfile: userProfile,
      sessionValid
    });
  }, [user, signedIn, userProfile, ready, sessionValid]);

  const handleNext = () => {
    console.log('🎯 [ONBOARDING] handleNext called');
    console.log('🎯 [ONBOARDING] currentStep:', currentStep);
    console.log('🎯 [ONBOARDING] onboardingSteps.length:', onboardingSteps.length);
    console.log('🎯 [ONBOARDING] selectedUserType:', selectedUserType);

    if (currentStep < onboardingSteps.length - 1) {
      console.log('🎯 [ONBOARDING] Moving to next step');
      setCurrentStep(currentStep + 1);
    } else if (selectedUserType) {
      console.log('🎯 [ONBOARDING] Final step - calling handleCompleteOnboarding');
      handleCompleteOnboarding();
    } else {
      console.log('🎯 [ONBOARDING] No user type selected, doing nothing');
    }
  };

  const handleCompleteOnboarding = async () => {
    console.log('🚀 [ONBOARDING] handleCompleteOnboarding called');
    console.log('🚀 [ONBOARDING] selectedUserType:', selectedUserType);
    console.log('🚀 [ONBOARDING] user:', user);
    console.log('🚀 [ONBOARDING] sessionValid:', sessionValid);

    // Step 4: Session validation before profile operations
    if (sessionValid !== true) {
      console.error('🔴 [ONBOARDING] Session not validated - aborting onboarding completion');
      router.replace('/(auth)/login');
      return;
    }

    // Verify session is still active before proceeding
    try {
      console.log('🔐 [ONBOARDING] Re-validating session before profile update...');
      const { data, error } = await supabase.auth.getSession();

      if (error || !data?.session?.user) {
        console.error('🔴 [ONBOARDING] Session expired during onboarding:', error?.message);
        router.replace('/(auth)/login');
        return;
      }

      console.log('🔐 [ONBOARDING] Session re-validated successfully');
    } catch (error: any) {
      console.error('🔴 [ONBOARDING] Session re-validation failed:', error);
      router.replace('/(auth)/login');
      return;
    }

    if (!selectedUserType || !user) {
      console.error('🔴 [ONBOARDING] Missing required data:', { selectedUserType, hasUser: !!user });
      return;
    }

    setIsCompleting(true);
    console.log('🚀 [ONBOARDING] setIsCompleting(true) called');

    try {
      console.log('🔍 [ONBOARDING] Starting profile update...');
      console.log('🔍 [ONBOARDING] Completing onboarding for user:', user.id, 'as:', selectedUserType);

      // Update user profile with selected type and mark onboarding as completed
      console.log('🔍 [ONBOARDING] Calling updateUserProfile with:', {
        user_type: selectedUserType,
        onboarding_completed: true,
      });

      const result = await updateUserProfile({
        user_type: selectedUserType,
        onboarding_completed: true,
      });

      console.log('🔍 [ONBOARDING] updateUserProfile result:', result);
      console.log('✅ [ONBOARDING] Onboarding completed successfully');

      // Route to the appropriate dashboard
      const dashboardRoute = getDashboardRoute(selectedUserType);
      console.log('🔍 [ONBOARDING] Routing to:', dashboardRoute);
      router.replace(dashboardRoute);

    } catch (error: any) {
      console.error('🔴 [ONBOARDING] Failed to complete onboarding:', error);
      console.error('🔴 [ONBOARDING] Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack
      });
      Alert.alert('Setup Error', `Failed to complete setup: ${error?.message || 'Unknown error'}. Please try again.`);
    } finally {
      console.log('🚀 [ONBOARDING] setIsCompleting(false) called');
      setIsCompleting(false);
    }
  };

  const handleSkip = async () => {
    // Session validation before skip operation
    if (sessionValid !== true) {
      console.error('🔴 [ONBOARDING] Session not validated - aborting skip');
      router.replace('/(auth)/login');
      return;
    }

    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    try {
      console.log('🔍 [ONBOARDING] Skipping onboarding, defaulting to sailor');

      // Verify session before skip operation
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session?.user) {
        console.error('🔴 [ONBOARDING] Session expired during skip:', error?.message);
        router.replace('/(auth)/login');
        return;
      }

      // Default to sailor if skipping
      await updateUserProfile({
        user_type: 'sailor',
        onboarding_completed: true,
      });

      const dashboardRoute = getDashboardRoute('sailor');
      router.replace(dashboardRoute);

    } catch (error: any) {
      console.error('🔴 [ONBOARDING] Failed to skip onboarding:', error);
      router.replace('/(auth)/login');
    }
  };

  // Show loading state while session validation is in progress
  if (!ready || sessionValid === null) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.content, { justifyContent: 'center' }]}>
          <ThemedText style={styles.emoji}>🔐</ThemedText>
          <ThemedText type="title">Validating Session...</ThemedText>
          <ThemedText type="subtitle">Please wait while we verify your authentication</ThemedText>
        </View>
      </ThemedView>
    );
  }

  // If session validation failed, redirect should have already happened
  // But show error state as fallback
  if (sessionValid === false) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.content, { justifyContent: 'center' }]}>
          <ThemedText style={styles.emoji}>❌</ThemedText>
          <ThemedText type="title">Session Invalid</ThemedText>
          <ThemedText type="subtitle">Redirecting to login...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.emoji}>{step.emoji}</ThemedText>
          <ThemedText type="title">{step.title}</ThemedText>
          <ThemedText type="subtitle">{step.subtitle}</ThemedText>
        </View>

        <View style={styles.description}>
          <ThemedText type="default">{step.description}</ThemedText>
        </View>

        {/* User Type Selection */}
        {step.isUserTypeSelection && (
          <View style={styles.userTypeContainer}>
            {userTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.userTypeOption,
                  selectedUserType === option.type && styles.selectedUserType,
                ]}
                onPress={() => setSelectedUserType(option.type)}
              >
                <ThemedText style={styles.userTypeEmoji}>{option.emoji}</ThemedText>
                <ThemedText style={styles.userTypeTitle}>{option.title}</ThemedText>
                <ThemedText style={styles.userTypeDescription}>{option.description}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.indicators}>
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentStep && styles.activeIndicator,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <ThemedText style={styles.skipButtonText}>⏩ Skip</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextButton,
            (step.isUserTypeSelection && !selectedUserType) && styles.buttonDisabled,
            isCompleting && styles.buttonDisabled
          ]}
          onPress={handleNext}
          disabled={(step.isUserTypeSelection && !selectedUserType) || isCompleting}
        >
          <ThemedText style={styles.nextButtonText}>
            {isCompleting ? '⏳ Setting up...' :
             currentStep === onboardingSteps.length - 1 ? '🚀 Get Started' : '➡️ Next'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  description: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  userTypeContainer: {
    width: '100%',
    marginBottom: 40,
    gap: 16,
  },
  userTypeOption: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  selectedUserType: {
    backgroundColor: '#EBF8FF',
    borderColor: '#0066CC',
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
  indicators: {
    flexDirection: 'row',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  activeIndicator: {
    backgroundColor: '#0066CC',
    width: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 32,
    gap: 16,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});