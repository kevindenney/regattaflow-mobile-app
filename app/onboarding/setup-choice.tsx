/**
 * Setup Choice Screen
 * User chooses between Quick Start and Full Setup paths
 */

import { OnboardingStateService } from '@/services/onboarding/OnboardingStateService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SetupChoiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; avatarUrl?: string }>();
  const [loading, setLoading] = useState(false);

  const userName = params.name ? decodeURIComponent(params.name) : 'Sailor';
  const firstName = userName.split(' ')[0];

  const handleQuickStart = useCallback(async () => {
    setLoading(true);
    try {
      await OnboardingStateService.setSetupPath('quick');
      await OnboardingStateService.completeStep('setup-choice');
      // Quick start goes directly to complete screen which will seed sample data
      router.push({
        pathname: '/onboarding/complete',
        params: { name: params.name, avatarUrl: params.avatarUrl },
      });
    } finally {
      setLoading(false);
    }
  }, [router, params]);

  const handleFullSetup = useCallback(async () => {
    setLoading(true);
    try {
      await OnboardingStateService.setSetupPath('full');
      await OnboardingStateService.completeStep('setup-choice');
      router.push({
        pathname: '/onboarding/experience',
        params: { name: params.name, avatarUrl: params.avatarUrl },
      });
    } finally {
      setLoading(false);
    }
  }, [router, params]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>How would you like to get started, {firstName}?</Text>
            <Text style={styles.subtitle}>
              Choose your path - you can always customize later in Settings.
            </Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {/* Quick Start Option */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={handleQuickStart}
              activeOpacity={0.7}
              disabled={loading}
            >
              <View style={styles.optionHeader}>
                <View style={[styles.optionIcon, styles.quickIcon]}>
                  <Ionicons name="flash" size={28} color="#F59E0B" />
                </View>
                <View style={styles.optionTitleContainer}>
                  <Text style={styles.optionTitle}>Quick Start</Text>
                  <Text style={styles.optionTime}>30 seconds</Text>
                </View>
              </View>
              <Text style={styles.optionDescription}>
                Get sailing right away. We'll set up sensible defaults and you can personalize
                everything later.
              </Text>
              <View style={styles.optionFeatures}>
                <View style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.featureText}>Sample boat and races to explore</Text>
                </View>
                <View style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.featureText}>Ready to use immediately</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Full Setup Option */}
            <TouchableOpacity
              style={[styles.optionCard, styles.recommendedCard]}
              onPress={handleFullSetup}
              activeOpacity={0.7}
              disabled={loading}
            >
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>Recommended</Text>
              </View>
              <View style={styles.optionHeader}>
                <View style={[styles.optionIcon, styles.fullIcon]}>
                  <Ionicons name="compass" size={28} color="#3B82F6" />
                </View>
                <View style={styles.optionTitleContainer}>
                  <Text style={styles.optionTitle}>Full Setup</Text>
                  <Text style={styles.optionTime}>2-3 minutes</Text>
                </View>
              </View>
              <Text style={styles.optionDescription}>
                Personalize your experience for the best results. Tell us about your boat, club,
                and racing goals.
              </Text>
              <View style={styles.optionFeatures}>
                <View style={styles.featureRow}>
                  <Ionicons name="boat" size={16} color="#3B82F6" />
                  <Text style={styles.featureText}>Select your boat class</Text>
                </View>
                <View style={styles.featureRow}>
                  <Ionicons name="flag" size={16} color="#3B82F6" />
                  <Text style={styles.featureText}>Join your club</Text>
                </View>
                <View style={styles.featureRow}>
                  <Ionicons name="people" size={16} color="#3B82F6" />
                  <Text style={styles.featureText}>Find your fleet</Text>
                </View>
                <View style={styles.featureRow}>
                  <Ionicons name="calendar" size={16} color="#3B82F6" />
                  <Text style={styles.featureText}>Discover upcoming races</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Loading indicator */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#3B82F6" />
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 20,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  recommendedCard: {
    borderColor: '#3B82F6',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickIcon: {
    backgroundColor: '#FEF3C7',
  },
  fullIcon: {
    backgroundColor: '#EFF6FF',
  },
  optionTitleContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionTime: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  optionDescription: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 16,
  },
  optionFeatures: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#475569',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
});
