/**
 * Onboarding Tour Hook
 *
 * Manages persona-specific onboarding tour state using AsyncStorage.
 * Simple state management without external library dependencies.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

// Tour types based on user persona
export type TourType = 'sailor' | 'coach' | 'club';

// Storage keys for each tour type (versioned for future migrations)
export const TOUR_STORAGE_KEYS: Record<TourType, string> = {
  sailor: 'regattaflow_sailor_tour_v1',
  coach: 'regattaflow_coach_tour_v1',
  club: 'regattaflow_club_tour_v1',
};

/**
 * Hook for managing onboarding tour state and lifecycle
 *
 * @param tourType - The type of tour to show (sailor, coach, or club)
 * @returns Tour state and control functions
 */
export function useOnboardingTour(tourType: TourType) {
  const [hasSeenTour, setHasSeenTour] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check AsyncStorage for completion status on mount
  useEffect(() => {
    const checkTourStatus = async () => {
      try {
        const value = await AsyncStorage.getItem(TOUR_STORAGE_KEYS[tourType]);
        setHasSeenTour(value === 'true');
      } catch (error) {
        console.warn('[OnboardingTour] Failed to read tour status:', error);
        setHasSeenTour(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkTourStatus();
  }, [tourType]);

  // Mark tour as completed
  const markTourComplete = useCallback(async () => {
    try {
      await AsyncStorage.setItem(TOUR_STORAGE_KEYS[tourType], 'true');
      setHasSeenTour(true);
      console.log(`[OnboardingTour] Tour completed: ${tourType}`);
    } catch (error) {
      console.warn('[OnboardingTour] Failed to save tour status:', error);
    }
  }, [tourType]);

  // Reset tour (useful for testing or settings)
  const resetTour = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(TOUR_STORAGE_KEYS[tourType]);
      setHasSeenTour(false);
      console.log(`[OnboardingTour] Tour reset: ${tourType}`);
    } catch (error) {
      console.warn('[OnboardingTour] Failed to reset tour:', error);
    }
  }, [tourType]);

  return {
    hasSeenTour,
    isLoading,
    markTourComplete,
    resetTour,
  };
}

export default useOnboardingTour;
