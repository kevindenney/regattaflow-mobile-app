/**
 * Find Sailors Screen - Social Connection (Optional)
 * Connect with other sailors - simplified optional step
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { OnboardingProgressDots } from '@/components/onboarding/OnboardingProgressDots';
import { OnboardingStateService } from '@/services/onboarding/OnboardingStateService';

// Mock data for suggested sailors
const SUGGESTED_SAILORS = [
  { id: '1', name: 'Sarah Mitchell', club: 'Bay Sailing Club', avatar: null },
  { id: '2', name: 'Mike Thompson', club: 'Marina Yacht Club', avatar: null },
  { id: '3', name: 'Emma Rodriguez', club: 'Harbor Masters', avatar: null },
  { id: '4', name: 'James Wilson', club: 'Bay Sailing Club', avatar: null },
];

export default function FindSailorsScreen() {
  const router = useRouter();
  const [selectedSailors, setSelectedSailors] = useState<string[]>([]);

  const handleToggleSailor = (sailorId: string) => {
    setSelectedSailors((prev) =>
      prev.includes(sailorId)
        ? prev.filter((id) => id !== sailorId)
        : [...prev, sailorId]
    );
  };

  const handleContinue = async () => {
    // Save selected sailors if any
    // TODO: Implement sailor following functionality
    await OnboardingStateService.completeStep('find-races');
    router.push('/onboarding/first-activity/race-calendar');
  };

  const handleSkip = async () => {
    await OnboardingStateService.completeStep('find-races');
    router.push('/onboarding/first-activity/race-calendar');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <OnboardingProgressDots
            currentStep={8}
            totalSteps={11}
            activeColor="#3B82F6"
            inactiveColor="#E2E8F0"
            completedColor="#93C5FD"
          />
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Title */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400).springify()}
            style={styles.titleContainer}
          >
            <Text style={styles.title}>Find Your Crew</Text>
            <Text style={styles.subtitle}>
              Follow sailors from your club to see their races and results.
            </Text>
          </Animated.View>

          {/* Sailor List */}
          <Animated.View
            entering={FadeIn.delay(200).duration(400)}
            style={styles.sailorList}
          >
            {SUGGESTED_SAILORS.map((sailor, index) => {
              const isSelected = selectedSailors.includes(sailor.id);
              return (
                <Animated.View
                  key={sailor.id}
                  entering={FadeIn.delay(250 + index * 50).duration(300)}
                >
                  <TouchableOpacity
                    style={[styles.sailorCard, isSelected && styles.sailorCardSelected]}
                    onPress={() => handleToggleSailor(sailor.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.avatarContainer}>
                      <View style={styles.avatar}>
                        <Ionicons name="person" size={20} color="#64748B" />
                      </View>
                    </View>
                    <View style={styles.sailorInfo}>
                      <Text style={styles.sailorName}>{sailor.name}</Text>
                      <Text style={styles.sailorClub}>{sailor.club}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.followButton,
                        isSelected && styles.followButtonSelected,
                      ]}
                      onPress={() => handleToggleSailor(sailor.id)}
                    >
                      <Text
                        style={[
                          styles.followButtonText,
                          isSelected && styles.followButtonTextSelected,
                        ]}
                      >
                        {isSelected ? 'Following' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </Animated.View>

          {/* Connect Contacts Card */}
          <Animated.View
            entering={FadeIn.delay(500).duration(400)}
            style={styles.connectCard}
          >
            <View style={styles.connectIconContainer}>
              <Ionicons name="people" size={24} color="#3B82F6" />
            </View>
            <View style={styles.connectContent}>
              <Text style={styles.connectTitle}>Find friends from contacts</Text>
              <Text style={styles.connectSubtitle}>
                See who you know that's already on RegattaFlow
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </Animated.View>
        </View>

        {/* Footer */}
        <Animated.View entering={FadeIn.delay(600).duration(300)} style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>
              {selectedSailors.length > 0
                ? `Follow ${selectedSailors.length} sailor${selectedSailors.length > 1 ? 's' : ''}`
                : 'Continue'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 22,
  },
  sailorList: {
    gap: 10,
    marginBottom: 24,
  },
  sailorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sailorCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sailorInfo: {
    flex: 1,
  },
  sailorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  sailorClub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  followButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  followButtonTextSelected: {
    color: '#FFFFFF',
  },
  connectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  connectIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  connectContent: {
    flex: 1,
  },
  connectTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  connectSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 32,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  continueButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
