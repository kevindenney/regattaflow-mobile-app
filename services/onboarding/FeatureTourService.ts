/**
 * FeatureTourService — Manages feature tour state for first-time users
 *
 * Tracks which tutorial steps the user has completed in the races tab tour.
 * The tour teaches core interface patterns: race cards, add race, phase tabs,
 * and social features.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('FeatureTourService');

const TOUR_COMPLETED_KEY = 'regattaflow_feature_tour_completed';
const TOUR_STEP_KEY = 'regattaflow_feature_tour_step';
const TOUR_STARTED_KEY = 'regattaflow_feature_tour_started';

/**
 * Tour step identifiers in order
 */
export const TOUR_STEPS = [
  'race_cards_navigation',    // Step 1: Swipe race cards
  'add_race_button',          // Step 2: Add Race CTA
  'phase_tabs',               // Step 3: Before/Racing/Review
  'follow_tab',               // Step 4: Follow tab intro
  'community_tab',            // Step 5: Community/Discuss
] as const;

export type TourStep = typeof TOUR_STEPS[number];

/**
 * Tour step configuration with display properties
 */
export interface TourStepConfig {
  id: TourStep;
  title: string;
  description: string;
  position: 'top' | 'bottom';
  targetElement: string; // CSS-like identifier for the target element
}

/**
 * Configuration for each tour step
 */
export const TOUR_STEP_CONFIGS: Record<TourStep, TourStepConfig> = {
  race_cards_navigation: {
    id: 'race_cards_navigation',
    title: 'Swipe to Navigate',
    description: 'Swipe left and right to see your upcoming and past races',
    position: 'bottom',
    targetElement: 'race-cards-carousel',
  },
  add_race_button: {
    id: 'add_race_button',
    title: 'Add Your First Race',
    description: 'Tap here to add your first race — paste a notice of race or enter details manually',
    position: 'top',
    targetElement: 'add-race-button',
  },
  phase_tabs: {
    id: 'phase_tabs',
    title: 'Race Phases',
    description: 'Each race has three phases: prepare before, execute during, and review after',
    position: 'bottom',
    targetElement: 'phase-tabs',
  },
  follow_tab: {
    id: 'follow_tab',
    title: 'Follow Sailors',
    description: 'Tap Follow to discover sailors and share your race insights',
    position: 'top',
    targetElement: 'follow-tab',
  },
  community_tab: {
    id: 'community_tab',
    title: 'Join the Community',
    description: 'Tap Discuss to join communities and conversations about tactics and venues',
    position: 'top',
    targetElement: 'community-tab',
  },
};

interface TourState {
  completed: boolean;
  currentStep: TourStep | null;
  startedAt: string | null;
  completedAt: string | null;
}

export class FeatureTourService {
  private static cache: TourState | null = null;

  /**
   * Load tour state from storage
   */
  private static async loadState(): Promise<TourState> {
    if (this.cache) return this.cache;

    try {
      const [completed, currentStep, startedAt] = await Promise.all([
        AsyncStorage.getItem(TOUR_COMPLETED_KEY),
        AsyncStorage.getItem(TOUR_STEP_KEY),
        AsyncStorage.getItem(TOUR_STARTED_KEY),
      ]);

      this.cache = {
        completed: completed === 'true',
        currentStep: currentStep as TourStep | null,
        startedAt: startedAt,
        completedAt: null,
      };

      return this.cache;
    } catch (error) {
      logger.error('[FeatureTourService] Failed to load state', error);
      this.cache = {
        completed: false,
        currentStep: null,
        startedAt: null,
        completedAt: null,
      };
      return this.cache;
    }
  }

  /**
   * Check if the user has completed the feature tour
   */
  static async hasCompletedTour(): Promise<boolean> {
    const state = await this.loadState();
    return state.completed;
  }

  /**
   * Check if the tour has been started
   */
  static async hasTourStarted(): Promise<boolean> {
    const state = await this.loadState();
    return state.startedAt !== null;
  }

  /**
   * Get the current tour step
   * Returns null if tour not started or already completed
   */
  static async getCurrentStep(): Promise<TourStep | null> {
    const state = await this.loadState();
    if (state.completed) return null;
    return state.currentStep;
  }

  /**
   * Get the current step index (1-based for display)
   */
  static async getCurrentStepIndex(): Promise<number> {
    const state = await this.loadState();
    if (!state.currentStep) return 0;
    const index = TOUR_STEPS.indexOf(state.currentStep);
    return index + 1;
  }

  /**
   * Get total number of steps
   */
  static getTotalSteps(): number {
    return TOUR_STEPS.length;
  }

  /**
   * Get step configuration for the current step
   */
  static async getCurrentStepConfig(): Promise<TourStepConfig | null> {
    const currentStep = await this.getCurrentStep();
    if (!currentStep) return null;
    return TOUR_STEP_CONFIGS[currentStep];
  }

  /**
   * Start the feature tour
   */
  static async startTour(): Promise<void> {
    try {
      const startedAt = new Date().toISOString();
      const firstStep = TOUR_STEPS[0];

      await Promise.all([
        AsyncStorage.setItem(TOUR_STARTED_KEY, startedAt),
        AsyncStorage.setItem(TOUR_STEP_KEY, firstStep),
        AsyncStorage.removeItem(TOUR_COMPLETED_KEY),
      ]);

      this.cache = {
        completed: false,
        currentStep: firstStep,
        startedAt: startedAt,
        completedAt: null,
      };

      logger.debug('[FeatureTourService] Tour started');
    } catch (error) {
      logger.error('[FeatureTourService] Failed to start tour', error);
    }
  }

  /**
   * Advance to the next tour step
   * Returns the next step, or null if tour is complete
   */
  static async advanceToNextStep(): Promise<TourStep | null> {
    try {
      const state = await this.loadState();
      if (state.completed || !state.currentStep) return null;

      const currentIndex = TOUR_STEPS.indexOf(state.currentStep);
      const nextIndex = currentIndex + 1;

      if (nextIndex >= TOUR_STEPS.length) {
        // Tour complete
        await this.completeTour();
        return null;
      }

      const nextStep = TOUR_STEPS[nextIndex];
      await AsyncStorage.setItem(TOUR_STEP_KEY, nextStep);

      if (this.cache) {
        this.cache.currentStep = nextStep;
      }

      logger.debug('[FeatureTourService] Advanced to step:', nextStep);
      return nextStep;
    } catch (error) {
      logger.error('[FeatureTourService] Failed to advance step', error);
      return null;
    }
  }

  /**
   * Skip the tour entirely
   */
  static async skipTour(): Promise<void> {
    await this.completeTour();
    logger.debug('[FeatureTourService] Tour skipped');
  }

  /**
   * Mark the tour as completed
   */
  static async completeTour(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(TOUR_COMPLETED_KEY, 'true'),
        AsyncStorage.removeItem(TOUR_STEP_KEY),
      ]);

      if (this.cache) {
        this.cache.completed = true;
        this.cache.currentStep = null;
        this.cache.completedAt = new Date().toISOString();
      }

      logger.debug('[FeatureTourService] Tour completed');
    } catch (error) {
      logger.error('[FeatureTourService] Failed to complete tour', error);
    }
  }

  /**
   * Reset the tour (for testing/dev purposes)
   */
  static async resetTour(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(TOUR_COMPLETED_KEY),
        AsyncStorage.removeItem(TOUR_STEP_KEY),
        AsyncStorage.removeItem(TOUR_STARTED_KEY),
      ]);

      this.cache = null;
      logger.debug('[FeatureTourService] Tour reset');
    } catch (error) {
      logger.error('[FeatureTourService] Failed to reset tour', error);
    }
  }

  /**
   * Check if a specific step is the current step
   */
  static async isCurrentStep(step: TourStep): Promise<boolean> {
    const currentStep = await this.getCurrentStep();
    return currentStep === step;
  }

  /**
   * Get the step config for a specific step
   */
  static getStepConfig(step: TourStep): TourStepConfig {
    return TOUR_STEP_CONFIGS[step];
  }

  /**
   * Clear the cache (useful when user signs out)
   */
  static clearCache(): void {
    this.cache = null;
  }
}
