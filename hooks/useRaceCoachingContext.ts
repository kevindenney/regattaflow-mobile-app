/**
 * useRaceCoachingContext
 *
 * Provides coaching context for race cards, including:
 * - Whether the user has active coaches
 * - Coach details with specialties for matching to context
 * - Recent session activity to avoid nagging
 * - Dismissed state per race/context
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DISMISSED_COACHING_CARDS_KEY = 'dismissed_coaching_cards';

export interface CoachInfo {
  id: string;
  userId: string;
  displayName: string;
  profilePhotoUrl: string | null;
  specializations: string[];
  hourlyRate: number | null;
}

export type CoachingContext = 'prep' | 'review';

interface DismissedCards {
  [raceId: string]: {
    prep?: boolean;
    review?: boolean;
  };
}

// Specialty mapping for context relevance
const PREP_SPECIALTIES = ['racing_tactics', 'race_strategy', 'starting', 'match_racing', 'fleet_racing'];
const REVIEW_SPECIALTIES = ['fleet_racing', 'race_strategy', 'speed_tuning', 'boat_handling'];

export function useRaceCoachingContext() {
  const { user } = useAuth();
  const [dismissedCards, setDismissedCards] = useState<DismissedCards>({});

  // Load dismissed cards from storage
  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_COACHING_CARDS_KEY).then((value) => {
      if (value) {
        try {
          setDismissedCards(JSON.parse(value));
        } catch {
          // Ignore parse errors
        }
      }
    });
  }, []);

  // Get user's active coaches with details
  const { data: coaches, isLoading: loadingCoaches } = useQuery({
    queryKey: ['race-coaching-context', 'coaches', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get active coaching relationships
      const { data: relationships, error: relError } = await supabase
        .from('coaching_clients')
        .select('coach_id')
        .eq('sailor_id', user.id)
        .eq('status', 'active');

      if (relError || !relationships?.length) return [];

      const coachIds = relationships.map((r) => r.coach_id);

      // Get coach details
      const { data: coachProfiles, error: profileError } = await supabase
        .from('coach_profiles')
        .select('id, user_id, display_name, profile_photo_url:profile_image_url, specializations, hourly_rate')
        .in('id', coachIds);

      if (profileError || !coachProfiles) return [];

      return coachProfiles.map((coach) => ({
        id: coach.id,
        userId: coach.user_id,
        displayName: coach.display_name || 'Coach',
        profilePhotoUrl: coach.profile_photo_url,
        specializations: coach.specializations || [],
        hourlyRate: coach.hourly_rate,
      })) as CoachInfo[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Check for recent sessions (last 7 days) to avoid nagging
  const { data: recentSessions } = useQuery({
    queryKey: ['race-coaching-context', 'recent-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return { prep: false, review: false };

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: sessions } = await supabase
        .from('coaching_sessions')
        .select('session_type, scheduled_at')
        .eq('sailor_id', user.id)
        .in('status', ['completed', 'scheduled', 'confirmed'])
        .gte('scheduled_at', sevenDaysAgo.toISOString());

      if (!sessions?.length) return { prep: false, review: false };

      // Check if there are recent prep-related or review-related sessions
      const hasRecentPrepSession = sessions.some((s) =>
        ['strategy', 'on_water'].includes(s.session_type)
      );
      const hasRecentReviewSession = sessions.some((s) =>
        ['video_review', 'strategy'].includes(s.session_type)
      );

      return { prep: hasRecentPrepSession, review: hasRecentReviewSession };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Get the most relevant coach for a given context
  const getRelevantCoach = useCallback(
    (context: CoachingContext): CoachInfo | null => {
      if (!coaches?.length) return null;

      const relevantSpecialties = context === 'prep' ? PREP_SPECIALTIES : REVIEW_SPECIALTIES;

      // Score coaches by specialty match
      const scoredCoaches = coaches.map((coach) => {
        const score = (coach.specializations || []).reduce((acc, spec) => {
          return acc + (relevantSpecialties.includes(spec) ? 1 : 0);
        }, 0);
        return { coach, score };
      });

      // Sort by score and return the best match, or first coach if no matches
      scoredCoaches.sort((a, b) => b.score - a.score);
      return scoredCoaches[0]?.coach || null;
    },
    [coaches]
  );

  // Get other coaches (not the primary one for context)
  const getOtherCoaches = useCallback(
    (context: CoachingContext): CoachInfo[] => {
      if (!coaches?.length || coaches.length <= 1) return [];
      const primary = getRelevantCoach(context);
      return coaches.filter((c) => c.id !== primary?.id);
    },
    [coaches, getRelevantCoach]
  );

  // Check if a card is dismissed for a race/context
  const isCardDismissed = useCallback(
    (raceId: string, context: CoachingContext): boolean => {
      return dismissedCards[raceId]?.[context] === true;
    },
    [dismissedCards]
  );

  // Dismiss a card for a race/context
  const dismissCard = useCallback(
    async (raceId: string, context: CoachingContext) => {
      const updated = {
        ...dismissedCards,
        [raceId]: {
          ...dismissedCards[raceId],
          [context]: true,
        },
      };
      setDismissedCards(updated);
      await AsyncStorage.setItem(DISMISSED_COACHING_CARDS_KEY, JSON.stringify(updated));
    },
    [dismissedCards]
  );

  // Should show coaching card for a given race/context
  const shouldShowCard = useCallback(
    (raceId: string, context: CoachingContext): boolean => {
      // Don't show if dismissed
      if (isCardDismissed(raceId, context)) return false;

      // Don't show if user has had a recent session for this context
      if (context === 'prep' && recentSessions?.prep) return false;
      if (context === 'review' && recentSessions?.review) return false;

      return true;
    },
    [isCardDismissed, recentSessions]
  );

  const hasCoach = (coaches?.length || 0) > 0;
  const hasMultipleCoaches = (coaches?.length || 0) > 1;

  return {
    isLoading: loadingCoaches,
    hasCoach,
    hasMultipleCoaches,
    coaches: coaches || [],
    getRelevantCoach,
    getOtherCoaches,
    shouldShowCard,
    dismissCard,
    recentSessions,
  };
}
