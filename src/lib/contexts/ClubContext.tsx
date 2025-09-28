/**
 * Club Context
 * Marine-grade club management state for yacht clubs and sailing organizations
 * Provides app-wide access to club data and race management functions
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  clubService,
  Club,
  ClubMember,
  RaceEvent,
  RaceRegistration,
} from '@/src/lib/clubs/clubService';
import { useAuth } from './AuthContext';

interface ClubContextType {
  // Club data
  userClubs: Club[];
  selectedClub: Club | null;
  clubMembers: ClubMember[];

  // Race management
  raceEvents: RaceEvent[];
  activeEvent: RaceEvent | null;

  // Dashboard stats
  dashboardStats: {
    total_members: number;
    active_events: number;
    upcoming_races: number;
    total_registrations: number;
  } | null;

  // Loading states
  loading: boolean;
  eventsLoading: boolean;

  // Club management functions
  selectClub: (club: Club) => void;
  refreshClubData: () => Promise<void>;
  refreshClubEvents: () => Promise<void>;

  // Race management functions
  createRaceEvent: (raceData: Omit<RaceEvent, 'id' | 'created_at' | 'updated_at'>) => Promise<RaceEvent | null>;
  updateRaceEvent: (raceId: string, updates: Partial<RaceEvent>) => Promise<RaceEvent | null>;
  publishRaceEvent: (raceId: string) => Promise<boolean>;

  // Race data distribution functions
  getRaceDistributionStatus: (raceId: string) => Promise<{
    is_distributed: boolean;
    distribution_time?: string;
    sailors_reached?: number;
    total_registered?: number;
  }>;
  retryRaceDataDistribution: (raceId: string) => Promise<boolean>;

  // Registration management
  getRaceRegistrations: (raceId: string) => Promise<RaceRegistration[]>;

  // Permissions
  hasAdminAccess: boolean;
  canManageRaces: boolean;
  canManageMembers: boolean;
}

const ClubContext = createContext<ClubContextType | undefined>(undefined);

interface ClubProviderProps {
  children: ReactNode;
}

export function ClubProvider({ children }: ClubProviderProps) {
  const [userClubs, setUserClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [raceEvents, setRaceEvents] = useState<RaceEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<RaceEvent | null>(null);
  const [dashboardStats, setDashboardStats] = useState<ClubContextType['dashboardStats']>(null);

  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  const { user } = useAuth();

  // Initialize club data when user changes
  useEffect(() => {
    if (user) {
      initializeClubData();
    } else {
      resetClubData();
    }
  }, [user]);

  // Refresh data when selected club changes
  useEffect(() => {
    if (selectedClub && user) {
      refreshClubSpecificData();
    }
  }, [selectedClub, user]);

  /**
   * Initialize club data for user
   */
  const initializeClubData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load user's clubs
      const clubs = await clubService.getUserClubs(user.id);
      setUserClubs(clubs);

      // Auto-select first club if available
      if (clubs.length > 0 && !selectedClub) {
        selectClub(clubs[0]);
      }

      console.log('✅ [CLUB_CONTEXT] Initialized with', clubs.length, 'clubs');
    } catch (error) {
      console.error('🔴 [CLUB_CONTEXT] Failed to initialize:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset club data (when user logs out)
   */
  const resetClubData = () => {
    setUserClubs([]);
    setSelectedClub(null);
    setClubMembers([]);
    setRaceEvents([]);
    setActiveEvent(null);
    setDashboardStats(null);
    setHasAdminAccess(false);
    setLoading(false);
  };

  /**
   * Refresh club-specific data
   */
  const refreshClubSpecificData = async () => {
    if (!selectedClub || !user) return;

    try {
      // Check admin access
      const adminAccess = await clubService.hasClubAdminAccess(user.id, selectedClub.id);
      setHasAdminAccess(adminAccess);

      // Load club members
      const members = await clubService.getClubMembers(selectedClub.id);
      setClubMembers(members);

      // Load dashboard stats
      const stats = await clubService.getClubDashboardStats(selectedClub.id);
      setDashboardStats(stats);

      // Load race events
      await refreshClubEvents();

      console.log('✅ [CLUB_CONTEXT] Refreshed data for', selectedClub.name);
    } catch (error) {
      console.error('🔴 [CLUB_CONTEXT] Failed to refresh club data:', error);
    }
  };

  /**
   * Select a club and load its data
   */
  const selectClub = (club: Club) => {
    setSelectedClub(club);
    console.log('🔍 [CLUB_CONTEXT] Selected club:', club.name);
  };

  /**
   * Refresh club data
   */
  const refreshClubData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const clubs = await clubService.getUserClubs(user.id);
      setUserClubs(clubs);

      // Update selected club if it's still in the list
      if (selectedClub) {
        const updatedSelectedClub = clubs.find(c => c.id === selectedClub.id);
        if (updatedSelectedClub) {
          setSelectedClub(updatedSelectedClub);
        }
      }
    } catch (error) {
      console.error('🔴 [CLUB_CONTEXT] Failed to refresh club data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh club events
   */
  const refreshClubEvents = async () => {
    if (!selectedClub) return;

    try {
      setEventsLoading(true);

      // Get upcoming and active events
      const events = await clubService.getClubRaceEvents(selectedClub.id, {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Include events from last week
        limit: 50,
      });

      setRaceEvents(events);

      // Set active event (next upcoming race)
      const upcomingEvents = events.filter(event =>
        new Date(event.start_date) > new Date() &&
        ['published', 'registration_open'].includes(event.status)
      );

      if (upcomingEvents.length > 0) {
        setActiveEvent(upcomingEvents[0]);
      } else {
        setActiveEvent(null);
      }

      console.log('✅ [CLUB_CONTEXT] Loaded', events.length, 'race events');
    } catch (error) {
      console.error('🔴 [CLUB_CONTEXT] Failed to refresh events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  /**
   * Create a new race event
   */
  const createRaceEvent = async (
    raceData: Omit<RaceEvent, 'id' | 'created_at' | 'updated_at'>
  ): Promise<RaceEvent | null> => {
    if (!selectedClub || !user) return null;

    try {
      const newEvent = await clubService.createRaceEvent(selectedClub.id, {
        ...raceData,
        created_by: user.id,
      });

      if (newEvent) {
        // Refresh events list
        await refreshClubEvents();

        // Refresh dashboard stats
        if (selectedClub) {
          const stats = await clubService.getClubDashboardStats(selectedClub.id);
          setDashboardStats(stats);
        }
      }

      return newEvent;
    } catch (error) {
      console.error('🔴 [CLUB_CONTEXT] Failed to create race event:', error);
      return null;
    }
  };

  /**
   * Update a race event
   */
  const updateRaceEvent = async (
    raceId: string,
    updates: Partial<RaceEvent>
  ): Promise<RaceEvent | null> => {
    try {
      const updatedEvent = await clubService.updateRaceEvent(raceId, updates);

      if (updatedEvent) {
        // Update local state
        setRaceEvents(prev =>
          prev.map(event =>
            event.id === raceId ? updatedEvent : event
          )
        );

        // Update active event if it's the one being updated
        if (activeEvent?.id === raceId) {
          setActiveEvent(updatedEvent);
        }
      }

      return updatedEvent;
    } catch (error) {
      console.error('🔴 [CLUB_CONTEXT] Failed to update race event:', error);
      return null;
    }
  };

  /**
   * Publish a race event (makes it available to sailors)
   */
  const publishRaceEvent = async (raceId: string): Promise<boolean> => {
    try {
      const success = await clubService.publishRaceEvent(raceId);

      if (success) {
        // Refresh events to get updated status
        await refreshClubEvents();

        console.log('✅ [CLUB_CONTEXT] Race event published and distributed');
      }

      return success;
    } catch (error) {
      console.error('🔴 [CLUB_CONTEXT] Failed to publish race event:', error);
      return false;
    }
  };

  /**
   * Get race data distribution status
   */
  const getRaceDistributionStatus = async (raceId: string) => {
    try {
      return await clubService.getRaceDistributionStatus(raceId);
    } catch (error) {
      console.error('🔴 [CLUB_CONTEXT] Failed to get distribution status:', error);
      return { is_distributed: false };
    }
  };

  /**
   * Retry failed race data distribution
   */
  const retryRaceDataDistribution = async (raceId: string): Promise<boolean> => {
    try {
      return await clubService.retryRaceDataDistribution(raceId);
    } catch (error) {
      console.error('🔴 [CLUB_CONTEXT] Failed to retry distribution:', error);
      return false;
    }
  };

  /**
   * Get race registrations
   */
  const getRaceRegistrations = async (raceId: string): Promise<RaceRegistration[]> => {
    try {
      return await clubService.getRaceRegistrations(raceId);
    } catch (error) {
      console.error('🔴 [CLUB_CONTEXT] Failed to get registrations:', error);
      return [];
    }
  };

  // Permission calculations
  const canManageRaces = hasAdminAccess;
  const canManageMembers = hasAdminAccess;

  const value: ClubContextType = {
    // Club data
    userClubs,
    selectedClub,
    clubMembers,

    // Race management
    raceEvents,
    activeEvent,

    // Dashboard stats
    dashboardStats,

    // Loading states
    loading,
    eventsLoading,

    // Club management functions
    selectClub,
    refreshClubData,
    refreshClubEvents,

    // Race management functions
    createRaceEvent,
    updateRaceEvent,
    publishRaceEvent,

    // Race data distribution functions
    getRaceDistributionStatus,
    retryRaceDataDistribution,

    // Registration management
    getRaceRegistrations,

    // Permissions
    hasAdminAccess,
    canManageRaces,
    canManageMembers,
  };

  return (
    <ClubContext.Provider value={value}>
      {children}
    </ClubContext.Provider>
  );
}

/**
 * Hook to use club context
 */
export function useClub() {
  const context = useContext(ClubContext);
  if (context === undefined) {
    throw new Error('useClub must be used within a ClubProvider');
  }
  return context;
}

/**
 * Hook for club admin features
 */
export function useClubAdmin() {
  const club = useClub();

  if (!club.hasAdminAccess) {
    throw new Error('User does not have admin access to this club');
  }

  return {
    ...club,
    isAdmin: true,
  };
}

/**
 * Hook for race management
 */
export function useRaceManagement() {
  const club = useClub();

  return {
    raceEvents: club.raceEvents,
    activeEvent: club.activeEvent,
    createRaceEvent: club.createRaceEvent,
    updateRaceEvent: club.updateRaceEvent,
    publishRaceEvent: club.publishRaceEvent,
    getRaceRegistrations: club.getRaceRegistrations,
    canManageRaces: club.canManageRaces,
    loading: club.eventsLoading,
  };
}

export default ClubContext;