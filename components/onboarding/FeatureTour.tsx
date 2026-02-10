/**
 * FeatureTour — Orchestrates the feature tour experience
 *
 * This component manages the overall tour flow, including:
 * - Tour progress indicator
 * - Skip tour button
 * - Coordination between tour steps
 */

import React, { createContext, useContext, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useFeatureTour, type TourStep } from '@/hooks/useFeatureTour';

// Tour context for child components
interface TourContextValue {
  currentStep: TourStep | null;
  currentStepIndex: number;
  totalSteps: number;
  isTourActive: boolean;
  advanceStep: () => Promise<void>;
  skipTour: () => Promise<void>;
  isCurrentStep: (step: TourStep) => boolean;
}

const TourContext = createContext<TourContextValue | null>(null);

/**
 * Hook to access tour context from child components
 */
export function useTourContext() {
  const context = useContext(TourContext);
  if (!context) {
    return {
      currentStep: null,
      currentStepIndex: 0,
      totalSteps: 0,
      isTourActive: false,
      advanceStep: async () => {},
      skipTour: async () => {},
      isCurrentStep: () => false,
    };
  }
  return context;
}

export interface FeatureTourProps {
  children: React.ReactNode;
  /** Callback when tour completes */
  onComplete?: () => void;
  /** Callback when tour is skipped */
  onSkip?: () => void;
  /** Whether to auto-start the tour */
  autoStart?: boolean;
  /** Custom style for the progress overlay */
  overlayStyle?: ViewStyle;
  /** Whether to show the skip button */
  showSkipButton?: boolean;
  /** Whether to show the progress indicator */
  showProgressIndicator?: boolean;
}

/**
 * FeatureTour component - wraps content and provides tour functionality
 */
export function FeatureTour({
  children,
  onComplete,
  onSkip,
  autoStart = true,
  overlayStyle,
  showSkipButton = true,
  showProgressIndicator = true,
}: FeatureTourProps) {
  const {
    isLoading,
    isTourActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    advanceStep,
    skipTour,
    isCurrentStep,
    shouldShowTour,
  } = useFeatureTour({
    autoStart,
    onComplete,
    onSkip,
  });

  // Context value for child components
  const contextValue = useMemo<TourContextValue>(
    () => ({
      currentStep,
      currentStepIndex,
      totalSteps,
      isTourActive,
      advanceStep,
      skipTour,
      isCurrentStep,
    }),
    [currentStep, currentStepIndex, totalSteps, isTourActive, advanceStep, skipTour, isCurrentStep]
  );

  if (isLoading) {
    return <>{children}</>;
  }

  return (
    <TourContext.Provider value={contextValue}>
      {children}

      {/* Tour overlay with progress and skip button */}
      {isTourActive && shouldShowTour && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[styles.overlay, overlayStyle]}
          pointerEvents="box-none"
        >
          {/* Progress indicator at top */}
          {showProgressIndicator && (
            <View style={styles.progressContainer}>
              <View style={styles.progressInner}>
                <View style={styles.progressDots}>
                  {Array.from({ length: totalSteps }).map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.progressDot,
                        index < currentStepIndex
                          ? styles.progressDotCompleted
                          : index === currentStepIndex - 1
                            ? styles.progressDotCurrent
                            : styles.progressDotUpcoming,
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.progressText}>
                  {currentStepIndex} of {totalSteps}
                </Text>
              </View>
            </View>
          )}

          {/* Skip button at bottom */}
          {showSkipButton && (
            <View style={styles.skipContainer}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={skipTour}
                activeOpacity={0.7}
              >
                <Text style={styles.skipText}>Skip Tour</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      )}
    </TourContext.Provider>
  );
}

/**
 * TourOverlay — Standalone overlay component for tour UI
 *
 * Can be used separately when FeatureTour wrapper isn't suitable
 */
export interface TourOverlayProps {
  visible: boolean;
  currentStepIndex: number;
  totalSteps: number;
  onSkip: () => void;
  showSkipButton?: boolean;
  showProgressIndicator?: boolean;
  style?: ViewStyle;
}

export function TourOverlay({
  visible,
  currentStepIndex,
  totalSteps,
  onSkip,
  showSkipButton = true,
  showProgressIndicator = true,
  style,
}: TourOverlayProps) {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[styles.overlay, style]}
      pointerEvents="box-none"
    >
      {showProgressIndicator && (
        <View style={styles.progressContainer}>
          <View style={styles.progressInner}>
            <View style={styles.progressDots}>
              {Array.from({ length: totalSteps }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index < currentStepIndex
                      ? styles.progressDotCompleted
                      : index === currentStepIndex - 1
                        ? styles.progressDotCurrent
                        : styles.progressDotUpcoming,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.progressText}>
              {currentStepIndex} of {totalSteps}
            </Text>
          </View>
        </View>
      )}

      {showSkipButton && (
        <View style={styles.skipContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip Tour</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    pointerEvents: 'box-none',
    zIndex: 999,
  },
  progressContainer: {
    alignItems: 'center',
    paddingTop: 60, // Account for safe area
    paddingHorizontal: 20,
    pointerEvents: 'none',
  },
  progressInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressDotCompleted: {
    backgroundColor: '#3B82F6',
  },
  progressDotCurrent: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  progressDotUpcoming: {
    backgroundColor: '#E5E7EB',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  skipContainer: {
    alignItems: 'center',
    paddingBottom: 120, // Account for tab bar and safe area
    paddingHorizontal: 20,
    pointerEvents: 'auto',
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});

export default FeatureTour;
