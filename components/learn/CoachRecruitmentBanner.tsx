/**
 * CoachRecruitmentBanner
 *
 * A dismissable banner encouraging users to become coaches.
 * Personalized based on their sailing experience.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCoachRecruitment } from '@/hooks/useCoachRecruitment';
import { IOS_COLORS } from '@/components/cards/constants';

interface CoachRecruitmentBannerProps {
  /** Context for this banner (affects dismissal tracking) */
  context?: 'coaches_tab' | 'course_completion';
  /** Optional style override */
  style?: any;
}

export function CoachRecruitmentBanner({
  context = 'coaches_tab',
  style,
}: CoachRecruitmentBannerProps) {
  const router = useRouter();
  const { shouldShowPrompt, dismiss, getBannerMessage, isLoading } = useCoachRecruitment();

  if (isLoading || !shouldShowPrompt(context)) {
    return null;
  }

  const { title, subtitle } = getBannerMessage();

  const handleDismiss = () => {
    dismiss(context);
  };

  const handleGetStarted = () => {
    router.push('/(auth)/coach-onboarding-welcome');
  };

  return (
    <View style={[styles.container, style]}>
      {/* Dismiss button */}
      <TouchableOpacity
        style={styles.dismissButton}
        onPress={handleDismiss}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={18} color={IOS_COLORS.gray2} />
      </TouchableOpacity>

      <View style={styles.iconContainer}>
        <Ionicons name="school-outline" size={28} color="#7C3AED" />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <TouchableOpacity style={styles.ctaButton} onPress={handleGetStarted}>
        <Text style={styles.ctaText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

/**
 * Smaller inline prompt for course completion
 */
export function CourseCompletionCoachPrompt({
  courseName,
  onDismiss,
}: {
  courseName: string;
  onDismiss?: () => void;
}) {
  const router = useRouter();
  const { shouldShowPrompt, dismiss, isLoading } = useCoachRecruitment();

  if (isLoading || !shouldShowPrompt('course_completion')) {
    return null;
  }

  const handleDismiss = () => {
    dismiss('course_completion');
    onDismiss?.();
  };

  return (
    <View style={styles.inlineContainer}>
      <TouchableOpacity
        style={styles.inlineContent}
        onPress={() => router.push('/(auth)/coach-onboarding-welcome')}
      >
        <Text style={styles.inlineText}>
          Finished {courseName}? Help others learn this.
        </Text>
        <Ionicons name="arrow-forward" size={14} color={IOS_COLORS.systemBlue} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.inlineDismiss}
        onPress={handleDismiss}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={14} color={IOS_COLORS.gray3} />
      </TouchableOpacity>
    </View>
  );
}

/**
 * Subtle text link for coached users viewing coach profiles
 */
export function CoachProfileRecruitmentLink() {
  const router = useRouter();
  const { shouldShowPrompt, isLoading } = useCoachRecruitment();

  if (isLoading || !shouldShowPrompt('coach_profile')) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.subtleLink}
      onPress={() => router.push('/(auth)/coach-onboarding-welcome')}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={styles.subtleLinkText}>Interested in coaching others?</Text>
      <Ionicons name="arrow-forward" size={14} color={IOS_COLORS.systemBlue} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  dismissButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  content: {
    marginBottom: 16,
    paddingRight: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 6,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Inline prompt styles (for course completion)
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  inlineContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inlineText: {
    fontSize: 14,
    color: IOS_COLORS.systemBlue,
  },
  inlineDismiss: {
    padding: 4,
    marginLeft: 8,
  },

  // Subtle link styles (for coach profile)
  subtleLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  subtleLinkText: {
    fontSize: 14,
    color: IOS_COLORS.systemBlue,
  },
});

export default CoachRecruitmentBanner;
