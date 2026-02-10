/**
 * useFeatureTour Hook
 *
 * React integration for the feature tour system.
 * Manages tour state, step progression, and provides
 * conditional visibility for tour components.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FeatureTourService,
  TOUR_STEPS,
  TOUR_STEP_CONFIGS,
  type TourStep,
  type TourStepConfig,
} from '@/services/onboarding/FeatureTourService';
import { OnboardingStateService } from '@/services/onboarding/OnboardingStateService';

export interface UseFeatureTourResult {
  // Tour state
  isLoading: boolean;
  isTourActive: boolean;
  isTourComplete: boolean;
  shouldShowTour: boolean;
  currentStep: TourStep | null;
  currentStepIndex: number;
  totalSteps: number;
  currentStepConfig: TourStepConfig | null;

  // Tour actions
  startTour: () => Promise<void>;
  advanceStep: () => Promise<void>;
  skipTour: () => Promise<void>;
  resetTour: () => Promise<void>;

  // Step-specific helpers
  isCurrentStep: (step: TourStep) => boolean;
  getStepConfig: (step: TourStep) => TourStepConfig;
}

export interface UseFeatureTourOptions {
  /** If true, will auto-start tour when conditions are met */
  autoStart?: boolean;
  /** Callback when tour completes */
  onComplete?: () => void;
  /** Callback when tour is skipped */
  onSkip?: () => void;
}

export function useFeatureTour(options: UseFeatureTourOptions = {}): UseFeatureTourResult {
  const { autoStart = false, onComplete, onSkip } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [isTourComplete, setIsTourComplete] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState<TourStep | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Load initial state
  useEffect(() => {
    let mounted = true;

    const loadState = async () => {
      try {
        const [completed, step, onboardingSeen] = await Promise.all([
          FeatureTourService.hasCompletedTour(),
          FeatureTourService.getCurrentStep(),
          OnboardingStateService.hasSeenOnboarding(),
        ]);

        if (!mounted) return;

        setIsTourComplete(completed);
        setCurrentStep(step);
        setHasSeenOnboarding(onboardingSeen);

        if (step) {
          const stepIndex = TOUR_STEPS.indexOf(step);
          setCurrentStepIndex(stepIndex + 1);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('[useFeatureTour] Failed to load state:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadState();

    return () => {
      mounted = false;
    };
  }, []);

  // Auto-start tour if conditions are met
  useEffect(() => {
    if (!autoStart || isLoading || isTourComplete || !hasSeenOnboarding) {
      return;
    }

    // Only auto-start if no tour is in progress
    if (currentStep === null) {
      const checkAndStart = async () => {
        const started = await FeatureTourService.hasTourStarted();
        if (!started) {
          await FeatureTourService.startTour();
          const step = await FeatureTourService.getCurrentStep();
          setCurrentStep(step);
          setCurrentStepIndex(1);
        }
      };

      checkAndStart();
    }
  }, [autoStart, isLoading, isTourComplete, hasSeenOnboarding, currentStep]);

  // Computed properties
  const isTourActive = useMemo(() => {
    return !isTourComplete && currentStep !== null;
  }, [isTourComplete, currentStep]);

  const shouldShowTour = useMemo(() => {
    return hasSeenOnboarding && !isTourComplete && !isLoading;
  }, [hasSeenOnboarding, isTourComplete, isLoading]);

  const currentStepConfig = useMemo(() => {
    if (!currentStep) return null;
    return TOUR_STEP_CONFIGS[currentStep];
  }, [currentStep]);

  // Actions
  const startTour = useCallback(async () => {
    await FeatureTourService.startTour();
    const step = await FeatureTourService.getCurrentStep();
    setCurrentStep(step);
    setCurrentStepIndex(1);
  }, []);

  const advanceStep = useCallback(async () => {
    const nextStep = await FeatureTourService.advanceToNextStep();

    if (nextStep === null) {
      // Tour complete
      setCurrentStep(null);
      setCurrentStepIndex(0);
      setIsTourComplete(true);
      onComplete?.();
    } else {
      setCurrentStep(nextStep);
      const stepIndex = TOUR_STEPS.indexOf(nextStep);
      setCurrentStepIndex(stepIndex + 1);
    }
  }, [onComplete]);

  const skipTour = useCallback(async () => {
    await FeatureTourService.skipTour();
    setCurrentStep(null);
    setCurrentStepIndex(0);
    setIsTourComplete(true);
    onSkip?.();
  }, [onSkip]);

  const resetTour = useCallback(async () => {
    await FeatureTourService.resetTour();
    setCurrentStep(null);
    setCurrentStepIndex(0);
    setIsTourComplete(false);
  }, []);

  // Step helpers
  const isCurrentStep = useCallback((step: TourStep) => {
    return currentStep === step;
  }, [currentStep]);

  const getStepConfig = useCallback((step: TourStep) => {
    return TOUR_STEP_CONFIGS[step];
  }, []);

  return {
    // State
    isLoading,
    isTourActive,
    isTourComplete,
    shouldShowTour,
    currentStep,
    currentStepIndex,
    totalSteps: TOUR_STEPS.length,
    currentStepConfig,

    // Actions
    startTour,
    advanceStep,
    skipTour,
    resetTour,

    // Helpers
    isCurrentStep,
    getStepConfig,
  };
}

/**
 * Hook to check if a specific tour step is active
 * Useful for individual components that need to show hints
 */
export function useTourStep(step: TourStep) {
  const { isCurrentStep, currentStepConfig, advanceStep, skipTour, isTourActive } = useFeatureTour();

  const isActive = isCurrentStep(step);
  const config = isActive ? currentStepConfig : null;

  return {
    isActive,
    config,
    advance: advanceStep,
    skip: skipTour,
    isTourActive,
  };
}

export { TOUR_STEPS, TOUR_STEP_CONFIGS, type TourStep, type TourStepConfig };
