/**
 * ValueScreen - Reusable animated value showcase screen
 * Used for pre-signup screens that highlight app benefits
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export interface ValueScreenProps {
  /** Main title text */
  title: string;
  /** Subtitle/description text */
  subtitle: string;
  /** Icon or illustration component */
  illustration: React.ReactNode;
  /** Gradient colors for background */
  gradientColors: readonly [string, string, ...string[]];
  /** CTA button text */
  ctaText: string;
  /** Route to navigate to on CTA press */
  nextRoute: string;
  /** Optional skip button text */
  skipText?: string;
  /** Optional skip route */
  skipRoute?: string;
  /** Current step index (0-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Optional callback for CTA press */
  onContinue?: () => void;
  /** Optional callback for skip press */
  onSkip?: () => void;
}

export function ValueScreen({
  title,
  subtitle,
  illustration,
  gradientColors,
  ctaText,
  nextRoute,
  skipText,
  skipRoute,
  currentStep,
  totalSteps,
  onContinue,
  onSkip,
}: ValueScreenProps) {
  const router = useRouter();

  // Animation values
  const illustrationScale = useSharedValue(0.8);
  const illustrationOpacity = useSharedValue(0);

  useEffect(() => {
    // Animate illustration entrance
    illustrationScale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
    });
    illustrationOpacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.ease),
    });
  }, []);

  const illustrationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: illustrationScale.value }],
    opacity: illustrationOpacity.value,
  }));

  const handleContinue = () => {
    onContinue?.();
    router.push(nextRoute as any);
  };

  const handleSkip = () => {
    onSkip?.();
    if (skipRoute) {
      router.push(skipRoute as any);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Progress Dots */}
          <View style={styles.progressContainer}>
            {Array.from({ length: totalSteps }).map((_, index) => (
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

          {/* Illustration */}
          <Animated.View style={[styles.illustrationContainer, illustrationStyle]}>
            {illustration}
          </Animated.View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <Animated.Text
              entering={FadeInDown.delay(200).duration(400).springify()}
              style={styles.title}
            >
              {title}
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.delay(300).duration(400).springify()}
              style={styles.subtitle}
            >
              {subtitle}
            </Animated.Text>
          </View>

          {/* Actions */}
          <Animated.View
            entering={FadeIn.delay(400).duration(400)}
            style={styles.actionsContainer}
          >
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaText}>{ctaText}</Text>
            </TouchableOpacity>

            {skipText && skipRoute && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.skipText}>{skipText}</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    width: 24,
    backgroundColor: '#FFFFFF',
  },
  progressDotCompleted: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  textContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  actionsContainer: {
    gap: 16,
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default ValueScreen;
