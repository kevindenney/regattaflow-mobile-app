/**
 * PermissionScreen - Reusable permission request screen
 * Contextual permission requests with clear "why" explanations
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { OnboardingProgressDots } from './OnboardingProgressDots';

export interface PermissionScreenProps {
  /** Icon name from Ionicons */
  iconName: keyof typeof Ionicons.glyphMap;
  /** Main title */
  title: string;
  /** Explanation of why permission is needed */
  description: string;
  /** Benefit points shown as list */
  benefits: string[];
  /** Primary button text */
  allowText: string;
  /** Secondary button text */
  skipText: string;
  /** Route to navigate on allow */
  nextRoute: string;
  /** Current step index */
  currentStep: number;
  /** Total steps */
  totalSteps: number;
  /** Callback when allow is pressed */
  onAllow: () => Promise<boolean>;
  /** Optional callback when skip is pressed */
  onSkip?: () => void;
}

export function PermissionScreen({
  iconName,
  title,
  description,
  benefits,
  allowText,
  skipText,
  nextRoute,
  currentStep,
  totalSteps,
  onAllow,
  onSkip,
}: PermissionScreenProps) {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = React.useState(false);

  const handleAllow = async () => {
    setIsRequesting(true);
    try {
      const granted = await onAllow();
      // Navigate regardless of permission result
      router.push(nextRoute as any);
    } catch {
      // Still navigate on error
      router.push(nextRoute as any);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    onSkip?.();
    router.push(nextRoute as any);
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
            currentStep={currentStep}
            totalSteps={totalSteps}
            activeColor="#3B82F6"
            inactiveColor="#E2E8F0"
            completedColor="#93C5FD"
          />
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          {/* Icon Container */}
          <Animated.View
            entering={FadeIn.delay(100).duration(300)}
            style={styles.iconContainer}
          >
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={iconName} size={48} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>

          {/* Title & Description */}
          <Animated.Text
            entering={FadeInDown.delay(200).duration(400).springify()}
            style={styles.title}
          >
            {title}
          </Animated.Text>

          <Animated.Text
            entering={FadeInDown.delay(300).duration(400).springify()}
            style={styles.description}
          >
            {description}
          </Animated.Text>

          {/* Benefits List */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(400).springify()}
            style={styles.benefitsContainer}
          >
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name="checkmark" size={16} color="#22C55E" />
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Actions */}
        <Animated.View
          entering={FadeIn.delay(500).duration(300)}
          style={styles.actionsContainer}
        >
          <TouchableOpacity
            style={[styles.allowButton, isRequesting && styles.buttonDisabled]}
            onPress={handleAllow}
            disabled={isRequesting}
            activeOpacity={0.8}
          >
            <Text style={styles.allowButtonText}>
              {isRequesting ? 'Requesting...' : allowText}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>{skipText}</Text>
          </TouchableOpacity>
        </Animated.View>
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingTop: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  benefitsContainer: {
    width: '100%',
    gap: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  actionsContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 32,
    gap: 12,
  },
  allowButton: {
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
  buttonDisabled: {
    opacity: 0.7,
  },
  allowButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default PermissionScreen;
