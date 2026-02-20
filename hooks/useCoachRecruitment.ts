/**
 * useCoachRecruitment
 *
 * Manages coaching recruitment prompts throughout the app.
 * Handles dismissal tracking with 30-day expiry.
 *
 * Contexts:
 * - 'coaches_tab' - Banner on Learn → Coaches tab
 * - 'course_completion' - Prompt after completing a course
 * - 'coach_profile' - Subtle link for coached users viewing coach profiles
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DISMISSAL_STORAGE_KEY = '@regattaflow/coach-recruitment-dismissals';
const DISMISSAL_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type RecruitmentContext = 'coaches_tab' | 'course_completion' | 'coach_profile';

export type CoachingRelationship = 'NO_RELATIONSHIP' | 'HAS_COACH' | 'IS_COACH';

interface DismissalRecord {
  [context: string]: number; // timestamp when dismissed
}

interface SailorProfile {
  boatClasses: string[];
  seasonCount: number;
  raceCount: number;
}

interface CoachRecruitmentData {
  relationship: CoachingRelationship;
  sailorProfile: SailorProfile;
  isLoading: boolean;
}

export function useCoachRecruitment() {
  const { user, capabilities } = useAuth();
  const [dismissals, setDismissals] = useState<DismissalRecord>({});
  const [dismissalsLoaded, setDismissalsLoaded] = useState(false);

  // Load dismissals from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem(DISMISSAL_STORAGE_KEY).then((value) => {
      if (value) {
        try {
          const parsed = JSON.parse(value);
          // Clean up expired dismissals
          const now = Date.now();
          const cleaned: DismissalRecord = {};
          Object.entries(parsed).forEach(([ctx, timestamp]) => {
            if (now - (timestamp as number) < DISMISSAL_DURATION_MS) {
              cleaned[ctx] = timestamp as number;
            }
          });
          setDismissals(cleaned);
        } catch {
          // Ignore parse errors
        }
      }
      setDismissalsLoaded(true);
    });
  }, []);

  // Check if user is a coach
  const { data: coachProfile, isLoading: loadingCoach } = useQuery({
    queryKey: ['coach-recruitment', 'is-coach', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('coach_profiles')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Check if user has active coaching relationships (as a sailor)
  const { data: coachingClient, isLoading: loadingClient } = useQuery({
    queryKey: ['coach-recruitment', 'has-coach', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('coaching_clients')
        .select('id')
        .eq('sailor_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && !coachProfile,
    staleTime: 5 * 60 * 1000,
  });

  // Get sailor profile data for personalized messaging
  const { data: sailorData, isLoading: loadingSailor } = useQuery({
    queryKey: ['coach-recruitment', 'sailor-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return { boatClasses: [], seasonCount: 0, raceCount: 0 };

      // Get user's boat classes and race history
      const [profileResult, seasonsResult, racesResult] = await Promise.all([
        supabase
          .from('sailor_profiles')
          .select('primary_boat_class, secondary_boat_classes')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('user_seasons')
          .select('id')
          .eq('user_id', user.id),
        supabase
          .from('race_entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);

      const boatClasses: string[] = [];
      if (profileResult.data?.primary_boat_class) {
        boatClasses.push(profileResult.data.primary_boat_class);
      }
      if (profileResult.data?.secondary_boat_classes) {
        boatClasses.push(...(profileResult.data.secondary_boat_classes || []));
      }

      return {
        boatClasses,
        seasonCount: seasonsResult.data?.length || 0,
        raceCount: racesResult.count || 0,
      };
    },
    enabled: !!user?.id && !coachProfile && !coachingClient,
    staleTime: 10 * 60 * 1000,
  });

  // Determine relationship status
  let relationship: CoachingRelationship = 'NO_RELATIONSHIP';
  if (coachProfile || capabilities?.hasCoaching) {
    relationship = 'IS_COACH';
  } else if (coachingClient) {
    relationship = 'HAS_COACH';
  }

  const isLoading = loadingCoach || loadingClient || loadingSailor || !dismissalsLoaded;

  // Check if a context is dismissed
  const isDismissed = useCallback(
    (context: RecruitmentContext): boolean => {
      const dismissedAt = dismissals[context];
      if (!dismissedAt) return false;
      return Date.now() - dismissedAt < DISMISSAL_DURATION_MS;
    },
    [dismissals]
  );

  // Should show prompt for a context
  const shouldShowPrompt = useCallback(
    (context: RecruitmentContext): boolean => {
      // Never show if user is a coach
      if (relationship === 'IS_COACH') return false;

      // Check dismissal
      if (isDismissed(context)) return false;

      // Context-specific rules
      switch (context) {
        case 'coaches_tab':
          // Show banner for NO_RELATIONSHIP users
          return relationship === 'NO_RELATIONSHIP';
        case 'course_completion':
          // Show for NO_RELATIONSHIP users
          return relationship === 'NO_RELATIONSHIP';
        case 'coach_profile':
          // Show subtle link for HAS_COACH users
          return relationship === 'HAS_COACH';
        default:
          return false;
      }
    },
    [relationship, isDismissed]
  );

  // Dismiss a context
  const dismiss = useCallback(
    async (context: RecruitmentContext) => {
      const updated = {
        ...dismissals,
        [context]: Date.now(),
      };
      setDismissals(updated);
      await AsyncStorage.setItem(DISMISSAL_STORAGE_KEY, JSON.stringify(updated));
    },
    [dismissals]
  );

  // Get personalized banner message
  const getBannerMessage = useCallback((): { title: string; subtitle: string } => {
    const profile = sailorData || { boatClasses: [], seasonCount: 0, raceCount: 0 };

    if (profile.boatClasses.length > 0 && profile.seasonCount > 0) {
      const boatClass = profile.boatClasses[0];
      return {
        title: 'Share Your Knowledge',
        subtitle: `You've been racing ${boatClass} for ${profile.seasonCount} season${profile.seasonCount === 1 ? '' : 's'}. Help others improve — become a RegattaFlow coach.`,
      };
    }

    if (profile.seasonCount > 0) {
      return {
        title: 'Share Your Knowledge',
        subtitle: `${profile.seasonCount} season${profile.seasonCount === 1 ? '' : 's'} of sailing experience? Help others improve — become a RegattaFlow coach.`,
      };
    }

    if (profile.raceCount > 0) {
      return {
        title: 'Share Your Knowledge',
        subtitle: 'Your racing experience could help others. Become a RegattaFlow coach.',
      };
    }

    return {
      title: 'Become a Coach',
      subtitle: 'Experienced sailor? Help others improve — become a RegattaFlow coach.',
    };
  }, [sailorData]);

  return {
    relationship,
    sailorProfile: sailorData || { boatClasses: [], seasonCount: 0, raceCount: 0 },
    isLoading,
    shouldShowPrompt,
    isDismissed,
    dismiss,
    getBannerMessage,
  };
}
