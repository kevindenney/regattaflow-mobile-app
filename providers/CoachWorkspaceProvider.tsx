/**
 * CoachWorkspaceProvider
 *
 * Dedicated provider for coach persona context that exposes:
 * - Coach profile and permissions
 * - Current roster (clients)
 * - Session management
 * - Cached responses from Supabase via React Query
 *
 * This ensures all coach screens (clients, schedule, earnings, coaching hub)
 * read from the same source of truth.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coachingService, CoachProfile, CoachingSession, CoachingClient, ClientStats } from '@/services/CoachingService';
import { useAuth } from './AuthProvider';

// Query keys for React Query cache management
export const COACH_QUERY_KEYS = {
  profile: (coachId: string) => ['coach', 'profile', coachId] as const,
  stats: (coachId: string) => ['coach', 'stats', coachId] as const,
  clients: (coachId: string, status?: string) => ['coach', 'clients', coachId, status] as const,
  sessions: (coachId: string, type: 'upcoming' | 'recent') => ['coach', 'sessions', coachId, type] as const,
  sessionDetails: (sessionId: string) => ['coach', 'session', sessionId] as const,
  earnings: (coachId: string) => ['coach', 'earnings', coachId] as const,
  metrics: (coachId: string) => ['coach', 'metrics', coachId] as const,
  coachSpotlights: () => ['coach', 'spotlights'] as const,
  resources: () => ['coach', 'resources'] as const,
};

interface CoachWorkspaceContextType {
  // Coach identity
  coachId: string | null;
  coachProfile: CoachProfile | null;
  isLoadingProfile: boolean;

  // Stats and metrics
  stats: ClientStats | null;
  isLoadingStats: boolean;

  // Data refresh
  refetchAll: () => Promise<void>;
}

const CoachWorkspaceContext = createContext<CoachWorkspaceContextType>({
  coachId: null,
  coachProfile: null,
  isLoadingProfile: false,
  stats: null,
  isLoadingStats: false,
  refetchAll: async () => {},
});

// Create a query client for the coach workspace
const coachQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

interface CoachWorkspaceProviderProps {
  children: React.ReactNode;
}

function CoachWorkspaceProviderInner({ children }: CoachWorkspaceProviderProps) {
  const { user, userType, coachProfile: authCoachProfile } = useAuth();

  // Determine if current user is a coach
  const isCoach = userType === 'coach';
  // Use user.id (which is the user_id in coach_profiles table) instead of authCoachProfile.id
  const coachId = isCoach && user?.id ? user.id : null;

  // Query: Coach Profile
  const {
    data: coachProfile,
    isLoading: isLoadingProfile,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: COACH_QUERY_KEYS.profile(coachId || ''),
    queryFn: async () => {
      if (!coachId || !user?.id) return null;
      return await coachingService.getCoachProfile(user.id);
    },
    enabled: !!coachId && !!user?.id,
  });

  // Query: Coach Stats
  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useQuery({
    queryKey: COACH_QUERY_KEYS.stats(coachId || ''),
    queryFn: async () => {
      if (!coachId) return null;
      return await coachingService.getCoachStats(coachId);
    },
    enabled: !!coachId,
  });

  // Refetch all coach data
  const refetchAll = async () => {
    await Promise.all([
      refetchProfile(),
      refetchStats(),
    ]);
  };

  const value = useMemo<CoachWorkspaceContextType>(
    () => ({
      coachId,
      coachProfile: coachProfile || authCoachProfile || null,
      isLoadingProfile,
      stats: stats || null,
      isLoadingStats,
      refetchAll,
    }),
    [coachId, coachProfile, authCoachProfile, isLoadingProfile, stats, isLoadingStats]
  );

  return (
    <CoachWorkspaceContext.Provider value={value}>
      {children}
    </CoachWorkspaceContext.Provider>
  );
}

// Wrap with QueryClientProvider
export function CoachWorkspaceProvider({ children }: CoachWorkspaceProviderProps) {
  return (
    <QueryClientProvider client={coachQueryClient}>
      <CoachWorkspaceProviderInner>
        {children}
      </CoachWorkspaceProviderInner>
    </QueryClientProvider>
  );
}

// Hook to use coach workspace context
export function useCoachWorkspace() {
  const context = useContext(CoachWorkspaceContext);
  if (!context) {
    throw new Error('useCoachWorkspace must be used within CoachWorkspaceProvider');
  }
  return context;
}
