/**
 * FeatureTourProvider — Global context for feature tour state
 *
 * This provider manages the feature tour across the entire app,
 * allowing any component to access tour state and control tour progression.
 */

import React, { createContext, useContext, useMemo, useCallback, useState, useEffect, useRef } from 'react';
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
  stepReadinessIssue: TourStep | null;
  showResumeHint: boolean;

  // Spotlight
  spotlightBounds: SpotlightBounds | null;
  setSpotlightBounds: (bounds: SpotlightBounds | null) => void;
  markStepReady: (step: TourStep) => void;
  isStepReady: (step: TourStep) => boolean;

  // Tour actions
  startTour: () => Promise<void>;
  advanceStep: () => Promise<void>;
  previousStep: () => Promise<void>;
  goToStepIndex: (index: number) => Promise<void>;
  skipTour: () => Promise<void>;
  skipToPrice: () => Promise<void>;
  triggerPricingPrompt: () => Promise<void>;
  resetTour: () => Promise<void>;
  retryAdvanceStep: () => Promise<void>;
  dismissResumeHint: () => void;

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
  stepReadinessIssue: null,
  showResumeHint: false,
  spotlightBounds: null,
  setSpotlightBounds: () => {},
  markStepReady: () => {},
  isStepReady: () => false,
  startTour: async () => {},
  advanceStep: async () => {},
  previousStep: async () => {},
  goToStepIndex: async () => {},
  skipTour: async () => {},
  skipToPrice: async () => {},
  triggerPricingPrompt: async () => {},
  resetTour: async () => {},
  retryAdvanceStep: async () => {},
  dismissResumeHint: () => {},
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
  const [stepReadinessIssue, setStepReadinessIssue] = useState<TourStep | null>(null);
  const [showResumeHint, setShowResumeHint] = useState(false);
  const [hasSeenPricingPrompt, setHasSeenPricingPrompt] = useState(false);
  const [spotlightBounds, setSpotlightBounds] = useState<SpotlightBounds | null>(null);
  const [readySteps, setReadySteps] = useState<Set<TourStep>>(new Set());
  const readyStepsRef = useRef<Set<TourStep>>(new Set());

  useEffect(() => {
    readyStepsRef.current = readySteps;
  }, [readySteps]);

  // Load initial state
  useEffect(() => {
    let mounted = true;

    const loadState = async () => {
      try {
        const [completed, step, onboardingSeen, pricingSeen] = await Promise.all([
          FeatureTourService.hasCompletedTour(),
          FeatureTourService.getCurrentStep(),
          OnboardingStateService.hasSeenOnboarding(),
          FeatureTourService.hasSeenPricingPrompt(),
        ]);

        if (!mounted) return;

        setIsTourComplete(completed);
        setCurrentStep(step);
        setHasSeenOnboarding(onboardingSeen);
        setHasSeenPricingPrompt(pricingSeen);
        if (step && step !== 'welcome') {
          setShowResumeHint(true);
        }

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

  useEffect(() => {
    if (!showResumeHint) return;
    const timer = setTimeout(() => setShowResumeHint(false), 3500);
    return () => clearTimeout(timer);
  }, [showResumeHint]);

  // Auto-start tour if conditions are met (guests see welcome card instead)
  useEffect(() => {
    const canAutoStart = hasSeenOnboarding && !isGuest;
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
    // Guests see welcome card instead of tour
    if (isGuest) return false;
    return !isTourComplete && currentStep !== null;
  }, [isTourComplete, currentStep, isGuest]);

  const shouldShowTour = useMemo(() => {
    // Guests see welcome card instead of tour
    const canShow = hasSeenOnboarding && !isGuest;
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

  const markStepReady = useCallback((step: TourStep) => {
    setReadySteps((previous) => {
      if (previous.has(step)) {
        return previous;
      }
      const next = new Set(previous);
      next.add(step);
      return next;
    });
  }, []);

  const isStepReady = useCallback((step: TourStep) => {
    return readySteps.has(step);
  }, [readySteps]);

  const waitForStepReady = useCallback(async (step: TourStep, timeoutMs = 2500) => {
    if (TOUR_STEP_CONFIGS[step].renderMode !== 'spotlight') {
      return true;
    }

    if (readyStepsRef.current.has(step)) {
      return true;
    }

    const start = Date.now();
    const becameReady = await new Promise<boolean>((resolve) => {
      const timer = setInterval(() => {
        const elapsed = Date.now() - start;
        if (readyStepsRef.current.has(step)) {
          clearInterval(timer);
          resolve(true);
        } else if (elapsed >= timeoutMs) {
          clearInterval(timer);
          resolve(false);
        }
      }, 80);
    });

    return becameReady;
  }, []);

  // Actions
  const startTour = useCallback(async () => {
    await FeatureTourService.startTour();
    const step = await FeatureTourService.getCurrentStep();
    setCurrentStep(step);
    setCurrentStepIndex(1);
    setStepReadinessIssue(null);
    setShowResumeHint(false);
  }, []);

  const advanceStep = useCallback(async () => {
    if (currentStep === 'add_your_race') {
      await FeatureTourService.completeTour();
      setCurrentStep(null);
      setCurrentStepIndex(0);
      setIsTourComplete(true);
      setStepReadinessIssue(null);
      onComplete?.();
      return;
    }

    if (currentStep) {
      const currentIndex = TOUR_STEPS.indexOf(currentStep);
      const nextStep = TOUR_STEPS[currentIndex + 1];
      if (nextStep) {
        const isReady = await waitForStepReady(nextStep);
        if (!isReady) {
          setStepReadinessIssue(nextStep);
          return;
        }
        setStepReadinessIssue(null);
      }
    }

    const nextStep = await FeatureTourService.advanceToNextStep();

    if (nextStep === null) {
      // Tour complete
      setCurrentStep(null);
      setCurrentStepIndex(0);
      setIsTourComplete(true);
      setStepReadinessIssue(null);
      onComplete?.();
    } else {
      setCurrentStep(nextStep);
      const stepIndex = TOUR_STEPS.indexOf(nextStep);
      setCurrentStepIndex(stepIndex + 1);
    }
  }, [currentStep, onComplete, waitForStepReady]);

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
    setStepReadinessIssue(null);
    setShowResumeHint(false);
    onSkip?.();
  }, [onSkip]);

  const skipToPrice = useCallback(async () => {
    await FeatureTourService.markPricingPromptSeen();
    setHasSeenPricingPrompt(true);
    const pricingIndex = TOUR_STEPS.indexOf('pricing_trial') + 1; // 1-based
    const step = await FeatureTourService.goToStepIndex(pricingIndex);
    if (!step) return;
    setCurrentStep(step);
    setCurrentStepIndex(pricingIndex);
    setIsTourComplete(false);
  }, []);

  const triggerPricingPrompt = useCallback(async () => {
    if (hasSeenPricingPrompt) {
      return;
    }
    await FeatureTourService.markPricingPromptSeen();
    setHasSeenPricingPrompt(true);
    setCurrentStep('pricing_trial');
    setCurrentStepIndex(TOUR_STEPS.indexOf('pricing_trial') + 1);
    setIsTourComplete(false);
    setStepReadinessIssue(null);
    setShowResumeHint(false);
  }, [hasSeenPricingPrompt]);

  const resetTour = useCallback(async () => {
    await FeatureTourService.resetTour();
    setCurrentStep(null);
    setCurrentStepIndex(0);
    setIsTourComplete(false);
    setHasSeenPricingPrompt(false);
    setStepReadinessIssue(null);
  }, []);

  const retryAdvanceStep = useCallback(async () => {
    await advanceStep();
  }, [advanceStep]);

  const dismissResumeHint = useCallback(() => {
    setShowResumeHint(false);
  }, []);

  useEffect(() => {
    if (!stepReadinessIssue) return;
    if (readySteps.has(stepReadinessIssue)) {
      setStepReadinessIssue(null);
    }
  }, [readySteps, stepReadinessIssue]);

  useEffect(() => {
    if (!isTourActive && stepReadinessIssue) {
      setStepReadinessIssue(null);
    }
  }, [isTourActive, stepReadinessIssue]);

  useEffect(() => {
    if (isLoading || !isTourComplete || hasSeenPricingPrompt) {
      return;
    }

    triggerPricingPrompt();
  }, [hasSeenPricingPrompt, isLoading, isTourComplete, triggerPricingPrompt]);

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
      stepReadinessIssue,
      showResumeHint,
      spotlightBounds,
      setSpotlightBounds,
      markStepReady,
      isStepReady,
      startTour,
      advanceStep,
      previousStep,
      goToStepIndex,
      skipTour,
      skipToPrice,
      triggerPricingPrompt,
      resetTour,
      retryAdvanceStep,
      dismissResumeHint,
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
      stepReadinessIssue,
      showResumeHint,
      spotlightBounds,
      startTour,
      advanceStep,
      previousStep,
      goToStepIndex,
      skipTour,
      skipToPrice,
      triggerPricingPrompt,
      resetTour,
      retryAdvanceStep,
      dismissResumeHint,
      isCurrentStep,
      getStepConfig,
      isFullscreenStep,
      markStepReady,
      isStepReady,
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
  const { isCurrentStep, currentStepConfig, advanceStep, skipTour, isTourActive } = useFeatureTourContext();

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

export { TOUR_STEPS, FULLSCREEN_STEPS, type TourStep, type TourStepConfig, type TourRenderMode };
