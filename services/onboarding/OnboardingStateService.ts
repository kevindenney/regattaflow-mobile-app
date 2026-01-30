/**
 * Onboarding State Service
 * Manages onboarding flow state, tracks progress, and stores preferences
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  OnboardingState,
  OnboardingStep,
  OnboardingPreferences,
  ExperienceLevel,
  BoatClassSelection,
  ClubSelection,
  FleetSelection,
  RaceSelection,
} from '@/types/onboarding';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('OnboardingStateService');

const STORAGE_KEY = 'regattaflow_onboarding_state';

// Step order for the full setup path
const FULL_SETUP_STEPS: OnboardingStep[] = [
  'welcome',
  'features',
  'auth-choice',
  'register',
  'profile-setup',
  'setup-choice',
  'experience',
  'boat-class',
  'home-club',
  'primary-fleet',
  'find-races',
  'complete',
];

// Step order for the quick setup path
const QUICK_SETUP_STEPS: OnboardingStep[] = [
  'welcome',
  'features',
  'auth-choice',
  'register',
  'profile-setup',
  'setup-choice',
  'complete',
];

/**
 * Create initial onboarding state
 */
function createInitialState(): OnboardingState {
  return {
    currentStep: 'welcome',
    completedSteps: [],
    preferences: {},
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };
}

export class OnboardingStateService {
  private static state: OnboardingState | null = null;

  /**
   * Load onboarding state from storage
   */
  static async loadState(): Promise<OnboardingState> {
    try {
      if (this.state) {
        return this.state;
      }

      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.state = JSON.parse(stored) as OnboardingState;
        logger.debug('[OnboardingStateService] Loaded state from storage', {
          currentStep: this.state.currentStep,
          completedSteps: this.state.completedSteps.length,
        });
        return this.state;
      }

      this.state = createInitialState();
      return this.state;
    } catch (error) {
      logger.error('[OnboardingStateService] Failed to load state', error);
      this.state = createInitialState();
      return this.state;
    }
  }

  /**
   * Save onboarding state to storage
   */
  static async saveState(): Promise<void> {
    try {
      if (!this.state) {
        return;
      }

      this.state.lastUpdatedAt = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      logger.debug('[OnboardingStateService] Saved state to storage');
    } catch (error) {
      logger.error('[OnboardingStateService] Failed to save state', error);
    }
  }

  /**
   * Clear onboarding state (on completion or reset)
   */
  static async clearState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      this.state = null;
      logger.debug('[OnboardingStateService] Cleared onboarding state');
    } catch (error) {
      logger.error('[OnboardingStateService] Failed to clear state', error);
    }
  }

  /**
   * Get current step
   */
  static async getCurrentStep(): Promise<OnboardingStep> {
    const state = await this.loadState();
    return state.currentStep;
  }

  /**
   * Set current step
   */
  static async setCurrentStep(step: OnboardingStep): Promise<void> {
    const state = await this.loadState();
    state.currentStep = step;
    await this.saveState();
  }

  /**
   * Mark a step as completed
   */
  static async completeStep(step: OnboardingStep): Promise<void> {
    const state = await this.loadState();
    if (!state.completedSteps.includes(step)) {
      state.completedSteps.push(step);
    }
    await this.saveState();
  }

  /**
   * Check if a step is completed
   */
  static async isStepCompleted(step: OnboardingStep): Promise<boolean> {
    const state = await this.loadState();
    return state.completedSteps.includes(step);
  }

  /**
   * Get next step based on current path
   */
  static async getNextStep(currentStep: OnboardingStep): Promise<OnboardingStep | null> {
    const state = await this.loadState();
    const path = state.preferences.setupPath === 'quick' ? QUICK_SETUP_STEPS : FULL_SETUP_STEPS;
    const currentIndex = path.indexOf(currentStep);

    if (currentIndex === -1 || currentIndex === path.length - 1) {
      return null;
    }

    return path[currentIndex + 1];
  }

  /**
   * Get previous step based on current path
   */
  static async getPreviousStep(currentStep: OnboardingStep): Promise<OnboardingStep | null> {
    const state = await this.loadState();
    const path = state.preferences.setupPath === 'quick' ? QUICK_SETUP_STEPS : FULL_SETUP_STEPS;
    const currentIndex = path.indexOf(currentStep);

    if (currentIndex <= 0) {
      return null;
    }

    return path[currentIndex - 1];
  }

  /**
   * Get progress percentage
   */
  static async getProgress(): Promise<number> {
    const state = await this.loadState();
    const path = state.preferences.setupPath === 'quick' ? QUICK_SETUP_STEPS : FULL_SETUP_STEPS;
    const currentIndex = path.indexOf(state.currentStep);

    if (currentIndex === -1) {
      return 0;
    }

    return Math.round((currentIndex / (path.length - 1)) * 100);
  }

  /**
   * Get step number (1-indexed)
   */
  static async getStepNumber(step: OnboardingStep): Promise<{ current: number; total: number }> {
    const state = await this.loadState();
    const path = state.preferences.setupPath === 'quick' ? QUICK_SETUP_STEPS : FULL_SETUP_STEPS;
    const currentIndex = path.indexOf(step);

    return {
      current: currentIndex + 1,
      total: path.length,
    };
  }

  // ============================================================================
  // Preference Setters
  // ============================================================================

  /**
   * Set setup path (quick or full)
   */
  static async setSetupPath(path: 'quick' | 'full'): Promise<void> {
    const state = await this.loadState();
    state.preferences.setupPath = path;
    await this.saveState();
    logger.debug('[OnboardingStateService] Set setup path:', path);
  }

  /**
   * Set user info
   */
  static async setUserInfo(userId: string, userName: string, avatarUrl?: string): Promise<void> {
    const state = await this.loadState();
    state.preferences.userId = userId;
    state.preferences.userName = userName;
    state.preferences.avatarUrl = avatarUrl;
    await this.saveState();
  }

  /**
   * Set experience level
   */
  static async setExperienceLevel(level: ExperienceLevel): Promise<void> {
    const state = await this.loadState();
    state.preferences.experienceLevel = level;
    await this.saveState();
    logger.debug('[OnboardingStateService] Set experience level:', level);
  }

  /**
   * Set boat class selection
   */
  static async setBoatClass(boatClass: BoatClassSelection | null): Promise<void> {
    const state = await this.loadState();
    if (boatClass) {
      state.preferences.boatClass = boatClass;
      state.preferences.hasNoBoat = false;
    } else {
      state.preferences.boatClass = undefined;
      state.preferences.hasNoBoat = true;
    }
    await this.saveState();
    logger.debug('[OnboardingStateService] Set boat class:', boatClass?.name || 'none');
  }

  /**
   * Set home club selection
   */
  static async setHomeClub(club: ClubSelection | null): Promise<void> {
    const state = await this.loadState();
    if (club) {
      state.preferences.homeClub = club;
      state.preferences.hasNoClub = false;
    } else {
      state.preferences.homeClub = undefined;
      state.preferences.hasNoClub = true;
    }
    await this.saveState();
    logger.debug('[OnboardingStateService] Set home club:', club?.name || 'none');
  }

  /**
   * Set primary fleet selection
   */
  static async setPrimaryFleet(fleet: FleetSelection | null): Promise<void> {
    const state = await this.loadState();
    if (fleet) {
      state.preferences.primaryFleet = fleet;
      state.preferences.hasNoFleet = false;
    } else {
      state.preferences.primaryFleet = undefined;
      state.preferences.hasNoFleet = true;
    }
    await this.saveState();
    logger.debug('[OnboardingStateService] Set primary fleet:', fleet?.name || 'none');
  }

  /**
   * Set selected races
   */
  static async setSelectedRaces(races: RaceSelection[]): Promise<void> {
    const state = await this.loadState();
    state.preferences.selectedRaces = races;
    await this.saveState();
    logger.debug('[OnboardingStateService] Set selected races:', races.length);
  }

  /**
   * Add a race to selected races
   */
  static async addRace(race: RaceSelection): Promise<void> {
    const state = await this.loadState();
    const races = state.preferences.selectedRaces || [];
    if (!races.find((r) => r.id === race.id)) {
      races.push(race);
      state.preferences.selectedRaces = races;
      await this.saveState();
    }
  }

  /**
   * Remove a race from selected races
   */
  static async removeRace(raceId: string): Promise<void> {
    const state = await this.loadState();
    const races = state.preferences.selectedRaces || [];
    state.preferences.selectedRaces = races.filter((r) => r.id !== raceId);
    await this.saveState();
  }

  // ============================================================================
  // Preference Getters
  // ============================================================================

  /**
   * Get all preferences
   */
  static async getPreferences(): Promise<Partial<OnboardingPreferences>> {
    const state = await this.loadState();
    return state.preferences;
  }

  /**
   * Get complete preferences (throws if missing required fields)
   */
  static async getCompletePreferences(): Promise<OnboardingPreferences> {
    const state = await this.loadState();
    const prefs = state.preferences;

    if (!prefs.userId || !prefs.userName || !prefs.setupPath) {
      throw new Error('Missing required onboarding preferences');
    }

    return prefs as OnboardingPreferences;
  }
}
