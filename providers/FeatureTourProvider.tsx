/**
 * FeatureTourProvider — Global context for feature tour state
 *
 * This provider manages the feature tour across the entire app,
 * allowing any component to access tour state and control tour progression.
 */

import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import {
  FeatureTourService,
  TOUR_STEPS,
  TOUR_STEP_CONFIGS,
  FULLSCREEN_STEPS,
  type TourStep,
  type TourStepConfig,
  type TourRenderMode,
} from '@/services/onboarding/FeatureTourService';
import { OnboardingStateService } from '@/services/onboarding/OnboardingStateService';
import { useAuth } from '@/providers/AuthProvider';

export interface SpotlightBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FeatureTourContextValue {
  // Tour state
  isLoading: boolean;
  isTourActive: boolean;
  isTourComplete: boolean;
  shouldShowTour: boolean;
  currentStep: TourStep | null;
  currentStepIndex: number;
  totalSteps: number;
  currentStepConfig: TourStepConfig | null;

  // Spotlight
  spotlightBounds: SpotlightBounds | null;
  setSpotlightBounds: (bounds: SpotlightBounds | null) => void;

  // Tour actions
  startTour: () => Promise<void>;
  advanceStep: () => Promise<void>;
  previousStep: () => Promise<void>;
  goToStepIndex: (index: number) => Promise<void>;
  skipTour: () => Promise<void>;
  skipToPrice: () => Promise<void>;
  resetTour: () => Promise<void>;

  // Step-specific helpers
  isCurrentStep: (step: TourStep) => boolean;
  getStepConfig: (step: TourStep) => TourStepConfig;
  isFullscreenStep: boolean;
}

const defaultContextValue: FeatureTourContextValue = {
  isLoading: true,
  isTourActive: false,
  isTourComplete: false,
  shouldShowTour: false,
  currentStep: null,
  currentStepIndex: 0,
  totalSteps: TOUR_STEPS.length,
  currentStepConfig: null,
  spotlightBounds: null,
  setSpotlightBounds: () => {},
  startTour: async () => {},
  advanceStep: async () => {},
  previousStep: async () => {},
  goToStepIndex: async () => {},
  skipTour: async () => {},
  skipToPrice: async () => {},
  resetTour: async () => {},
  isCurrentStep: () => false,
  getStepConfig: (step) => TOUR_STEP_CONFIGS[step],
  isFullscreenStep: false,
};

const FeatureTourContext = createContext<FeatureTourContextValue>(defaultContextValue);

export interface FeatureTourProviderProps {
  children: React.ReactNode;
  /** Auto-start tour when conditions are met */
  autoStart?: boolean;
  /** Callback when tour completes */
  onComplete?: () => void;
  /** Callback when tour is skipped */
  onSkip?: () => void;
}

export function FeatureTourProvider({
  children,
  autoStart = true,
  onComplete,
  onSkip,
}: FeatureTourProviderProps) {
  const { isGuest } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isTourComplete, setIsTourComplete] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState<TourStep | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [spotlightBounds, setSpotlightBounds] = useState<SpotlightBounds | null>(null);

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
        console.error('[FeatureTourProvider] Failed to load state:', error);
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
    const canAutoStart = isGuest || hasSeenOnboarding;
    if (!autoStart || isLoading || isTourComplete || !canAutoStart) {
      return;
    }

    // Only auto-start if no tour is in progress
    if (currentStep === null) {
      const checkAndStart = async () => {
        const started = await FeatureTourService.hasTourStarted();
        if (!started) {
          await FeatureTourService.startTour();
        }

        let step = await FeatureTourService.getCurrentStep();
        if (step === null && !isTourComplete) {
          await FeatureTourService.startTour();
          step = await FeatureTourService.getCurrentStep();
        }

        setCurrentStep(step);
        setCurrentStepIndex(step ? TOUR_STEPS.indexOf(step) + 1 : 0);
      };

      checkAndStart();
    }
  }, [autoStart, isLoading, isTourComplete, hasSeenOnboarding, isGuest, currentStep]);

  // Computed properties
  const isTourActive = useMemo(() => {
    return !isTourComplete && currentStep !== null;
  }, [isTourComplete, currentStep]);

  const shouldShowTour = useMemo(() => {
    const canShow = isGuest || hasSeenOnboarding;
    return canShow && !isTourComplete && !isLoading;
  }, [hasSeenOnboarding, isGuest, isTourComplete, isLoading]);

  const currentStepConfig = useMemo(() => {
    if (!currentStep) return null;
    return TOUR_STEP_CONFIGS[currentStep];
  }, [currentStep]);

  const isFullscreenStep = useMemo(() => {
    if (!currentStep) return false;
    return (FULLSCREEN_STEPS as readonly string[]).includes(currentStep);
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

  const previousStep = useCallback(async () => {
    const prev = await FeatureTourService.goToPreviousStep();
    if (!prev) return;

    setCurrentStep(prev);
    const stepIndex = TOUR_STEPS.indexOf(prev);
    setCurrentStepIndex(stepIndex + 1);
  }, []);

  const goToStepIndex = useCallback(async (index: number) => {
    const step = await FeatureTourService.goToStepIndex(index);
    if (!step) return;

    setCurrentStep(step);
    setCurrentStepIndex(index);
    setIsTourComplete(false);
  }, []);

  const skipTour = useCallback(async () => {
    await FeatureTourService.skipTour();
    setCurrentStep(null);
    setCurrentStepIndex(0);
    setIsTourComplete(true);
    onSkip?.();
  }, [onSkip]);

  const skipToPrice = useCallback(async () => {
    const pricingIndex = TOUR_STEPS.indexOf('pricing_trial') + 1; // 1-based
    const step = await FeatureTourService.goToStepIndex(pricingIndex);
    if (!step) return;
    setCurrentStep(step);
    setCurrentStepIndex(pricingIndex);
    setIsTourComplete(false);
  }, []);

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

  const contextValue = useMemo<FeatureTourContextValue>(
    () => ({
      isLoading,
      isTourActive,
      isTourComplete,
      shouldShowTour,
      currentStep,
      currentStepIndex,
      totalSteps: TOUR_STEPS.length,
      currentStepConfig,
      spotlightBounds,
      setSpotlightBounds,
      startTour,
      advanceStep,
      previousStep,
      goToStepIndex,
      skipTour,
      skipToPrice,
      resetTour,
      isCurrentStep,
      getStepConfig,
      isFullscreenStep,
    }),
    [
      isLoading,
      isTourActive,
      isTourComplete,
      shouldShowTour,
      currentStep,
      currentStepIndex,
      currentStepConfig,
      spotlightBounds,
      startTour,
      advanceStep,
      previousStep,
      goToStepIndex,
      skipTour,
      skipToPrice,
      resetTour,
      isCurrentStep,
      getStepConfig,
      isFullscreenStep,
    ]
  );

  return (
    <FeatureTourContext.Provider value={contextValue}>
      {children}
    </FeatureTourContext.Provider>
  );
}

/**
 * Hook to access feature tour context
 */
export function useFeatureTourContext(): FeatureTourContextValue {
  return useContext(FeatureTourContext);
}

/**
 * Hook to check if a specific tour step is active
 */
export function useTourStepContext(step: TourStep) {
  const { isCurrentStep, currentStepConfig, advanceStep, skipToPrice, isTourActive } = useFeatureTourContext();

  const isActive = isCurrentStep(step);
  const config = isActive ? currentStepConfig : null;

  return {
    isActive,
    config,
    advance: advanceStep,
    skip: skipToPrice,
    isTourActive,
  };
}

export { TOUR_STEPS, FULLSCREEN_STEPS, type TourStep, type TourStepConfig, type TourRenderMode };
