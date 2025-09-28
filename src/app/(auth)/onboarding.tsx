import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/src/components/themed-text';
import { ThemedView } from '@/src/components/themed-view';
import { useAuth } from '@/src/lib/contexts/AuthContext';
import { getDashboardRoute } from '@/src/lib/utils/userTypeRouting';

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
  const { user, updateUserProfile, userProfile } = useAuth();
  const step = onboardingSteps[currentStep];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (selectedUserType) {
      handleCompleteOnboarding();
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!selectedUserType || !user) return;

    setIsCompleting(true);
    try {
      console.log('🔍 [ONBOARDING] Completing onboarding for user:', user.id, 'as:', selectedUserType);

      // Update user profile with selected type and mark onboarding as completed
      await updateUserProfile({
        user_type: selectedUserType,
        onboarding_completed: true,
      });

      console.log('✅ [ONBOARDING] Onboarding completed successfully');

      // Route to the appropriate dashboard
      const dashboardRoute = getDashboardRoute(selectedUserType);
      console.log('🔍 [ONBOARDING] Routing to:', dashboardRoute);
      router.replace(dashboardRoute);

    } catch (error: any) {
      console.error('🔴 [ONBOARDING] Failed to complete onboarding:', error);
      Alert.alert('Setup Error', 'Failed to complete setup. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSkip = async () => {
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    try {
      console.log('🔍 [ONBOARDING] Skipping onboarding, defaulting to sailor');

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