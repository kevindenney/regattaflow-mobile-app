/**
 * useReflectProfile - Hook for fetching profile data for the Reflect tab
 *
 * Provides user profile, career stats, venues visited, boats, achievements,
 * personal records, and challenges for Phases 2 & 3.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import { useReflectDataMock } from './useReflectData';

const logger = createLogger('useReflectProfile');

// =============================================================================
// TYPES
// =============================================================================

// Achievement types (matching SailorProfileService)
export type AchievementType =
  | 'first_race'
  | 'first_win'
  | 'first_podium'
  | 'race_milestone_10'
  | 'race_milestone_50'
  | 'race_milestone_100'
  | 'win_streak_3'
  | 'win_streak_5'
  | 'series_champion'
  | 'regatta_champion'
  | 'year_end_champion'
  | 'perfect_season'
  | 'comeback_victory'
  | 'most_improved';

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  relatedRegattaId?: string;
  relatedRegattaName?: string;
}

export interface PersonalRecord {
  id: string;
  label: string;
  value: string | number;
  detail?: string;
  date?: string;
  regattaName?: string;
  icon: string;
  color: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'race_count' | 'podium_count' | 'win_count' | 'streak' | 'venue_count' | 'custom';
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  completedAt?: string;
  reward?: string;
  icon: string;
}

export interface ProfileStats {
  // Career totals
  totalRaces: number;
  totalWins: number;
  totalPodiums: number;
  averageFinish: number | null;
  winRate: number | null;
  // Season (current year)
  seasonRaces: number;
  seasonWins: number;
  seasonPodiums: number;
  seasonAverageFinish: number | null;
  // Streaks
  currentStreak: number;
  longestStreak: number;
  // Time stats
  totalTimeOnWater: number; // Minutes
  memberSince: string | null;
}

export interface VenueVisited {
  id: string;
  name: string;
  location: string | null;
  raceCount: number;
  lastRaceDate: string;
  bestFinish: number | null;
  averageFinish: number | null;
}

export interface UserBoat {
  id: string;
  name: string | null;
  className: string;
  sailNumber: string | null;
  isPrimary: boolean;
  raceCount: number;
  winCount: number;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  avatarInitials: string;
  bio: string | null;
  location: string | null;
  homeClub: string | null;
  sailingSince: number | null;
  followerCount: number;
  followingCount: number;
}

// Phase 4: Recent Activity types
export type RecentActivityType =
  | 'race_completed'
  | 'achievement_earned'
  | 'new_follower'
  | 'followed_user'
  | 'comment_received'
  | 'liked_post'
  | 'shared_result';

export interface RecentActivity {
  id: string;
  type: RecentActivityType;
  title: string;
  description?: string;
  timestamp: string;
  relatedUserId?: string;
  relatedUserName?: string;
  relatedUserAvatar?: string;
  relatedRegattaId?: string;
  relatedRegattaName?: string;
  metadata?: Record<string, unknown>;
}

export interface ReflectProfileData {
  profile: UserProfile;
  stats: ProfileStats;
  venuesVisited: VenueVisited[];
  boats: UserBoat[];
  // Phase 3: Achievements
  achievements: Achievement[];
  personalRecords: PersonalRecord[];
  challenges: Challenge[];
  // Phase 4: Recent Activity
  recentActivity: RecentActivity[];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getOrdinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

function getDefaultAchievementTitle(type: AchievementType): string {
  const titles: Record<AchievementType, string> = {
    first_race: 'First Race',
    first_win: 'First Victory',
    first_podium: 'First Podium',
    race_milestone_10: '10 Races',
    race_milestone_50: '50 Races',
    race_milestone_100: '100 Races',
    win_streak_3: 'Hot Streak',
    win_streak_5: 'On Fire',
    series_champion: 'Series Champion',
    regatta_champion: 'Regatta Champion',
    year_end_champion: 'Year-End Champion',
    perfect_season: 'Perfect Season',
    comeback_victory: 'Comeback Victory',
    most_improved: 'Most Improved',
  };
  return titles[type] || type;
}

function getDefaultAchievementDescription(type: AchievementType): string {
  const descriptions: Record<AchievementType, string> = {
    first_race: 'Completed your first race',
    first_win: 'Won your first race',
    first_podium: 'Finished on the podium',
    race_milestone_10: 'Completed 10 races',
    race_milestone_50: 'Completed 50 races',
    race_milestone_100: 'Completed 100 races',
    win_streak_3: '3 consecutive wins',
    win_streak_5: '5 consecutive wins',
    series_champion: 'Won a race series',
    regatta_champion: 'Won a regatta championship',
    year_end_champion: 'Season champion',
    perfect_season: 'Won every race in a series',
    comeback_victory: 'Won from behind',
    most_improved: 'Most improved sailor',
  };
  return descriptions[type] || '';
}

function getDefaultAchievementIcon(type: AchievementType): string {
  const icons: Record<AchievementType, string> = {
    first_race: 'flag',
    first_win: 'trophy',
    first_podium: 'medal',
    race_milestone_10: 'star',
    race_milestone_50: 'star',
    race_milestone_100: 'star',
    win_streak_3: 'flame',
    win_streak_5: 'flame',
    series_champion: 'ribbon',
    regatta_champion: 'ribbon',
    year_end_champion: 'trophy',
    perfect_season: 'sparkles',
    comeback_victory: 'trending-up',
    most_improved: 'trending-up',
  };
  return icons[type] || 'star';
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function useReflectProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ReflectProfileData | null>(null);

  const userId = user?.id;

  const loadData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch sailor profile extensions
      const { data: sailorProfile } = await supabase
        .from('sailor_profiles')
        .select('display_name, avatar_url, bio, location, sailing_since, home_club_id')
        .eq('user_id', userId)
        .single();

      // Fetch home club name if exists
      let homeClubName: string | null = null;
      if (sailorProfile?.home_club_id) {
        const { data: club } = await supabase
          .from('clubs')
          .select('name')
          .eq('id', sailorProfile.home_club_id)
          .single();
        homeClubName = club?.name || null;
      }

      // Fetch follow counts
      const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
        supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId),
        supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId),
      ]);

      // Fetch all user regattas for stats calculation
      const { data: regattas, error: regattasError } = await supabase
        .from('regattas')
        .select('*')
        .eq('created_by', userId)
        .order('start_date', { ascending: false });

      if (regattasError) throw regattasError;

      // Fetch race results
      const { data: participants } = await supabase
        .from('race_participants')
        .select('regatta_id, finish_position, status')
        .eq('user_id', userId)
        .neq('status', 'withdrawn');

      // Fetch timer sessions for time on water
      const { data: sessions } = await supabase
        .from('race_timer_sessions')
        .select('start_time, end_time')
        .eq('sailor_id', userId);

      // Calculate stats
      const finishedRaces = (regattas || []).filter(
        (r: any) => new Date(r.start_date) <= now
      );
      const seasonRaces = finishedRaces.filter(
        (r: any) => new Date(r.start_date) >= yearStart
      );

      const participantsMap = new Map(
        (participants || []).map((p: any) => [p.regatta_id, p])
      );

      let totalWins = 0;
      let totalPodiums = 0;
      let seasonWins = 0;
      let seasonPodiums = 0;
      const allPositions: number[] = [];
      const seasonPositions: number[] = [];

      finishedRaces.forEach((race: any) => {
        const p = participantsMap.get(race.id);
        if (p?.finish_position) {
          allPositions.push(p.finish_position);
          if (p.finish_position === 1) totalWins++;
          if (p.finish_position <= 3) totalPodiums++;

          if (new Date(race.start_date) >= yearStart) {
            seasonPositions.push(p.finish_position);
            if (p.finish_position === 1) seasonWins++;
            if (p.finish_position <= 3) seasonPodiums++;
          }
        }
      });

      const averageFinish =
        allPositions.length > 0
          ? Math.round((allPositions.reduce((a, b) => a + b, 0) / allPositions.length) * 10) / 10
          : null;

      const seasonAverageFinish =
        seasonPositions.length > 0
          ? Math.round((seasonPositions.reduce((a, b) => a + b, 0) / seasonPositions.length) * 10) / 10
          : null;

      const winRate =
        finishedRaces.length > 0
          ? Math.round((totalWins / finishedRaces.length) * 100) / 100
          : null;

      // Calculate time on water
      let totalTimeOnWater = 0;
      (sessions || []).forEach((s: any) => {
        if (s.start_time && s.end_time) {
          const duration =
            (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000;
          totalTimeOnWater += duration;
        }
      });

      // Build venues visited from race data
      const venueMap = new Map<string, {
        name: string;
        location: string | null;
        races: { date: string; position: number | null }[];
      }>();

      (regattas || []).forEach((race: any) => {
        const venueName = race.metadata?.venue_name || race.venue_name;
        if (!venueName) return;

        const venueKey = venueName.toLowerCase();
        const p = participantsMap.get(race.id);

        if (!venueMap.has(venueKey)) {
          venueMap.set(venueKey, {
            name: venueName,
            location: race.metadata?.location || null,
            races: [],
          });
        }

        venueMap.get(venueKey)!.races.push({
          date: race.start_date,
          position: p?.finish_position || null,
        });
      });

      const venuesVisited: VenueVisited[] = Array.from(venueMap.entries())
        .map(([id, venue]) => {
          const positions = venue.races
            .filter((r) => r.position !== null)
            .map((r) => r.position!);
          const avgFinish =
            positions.length > 0
              ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
              : null;
          const bestFinish = positions.length > 0 ? Math.min(...positions) : null;

          return {
            id,
            name: venue.name,
            location: venue.location,
            raceCount: venue.races.length,
            lastRaceDate: venue.races[0]?.date || '',
            bestFinish,
            averageFinish: avgFinish,
          };
        })
        .sort((a, b) => b.raceCount - a.raceCount);

      // Fetch boats
      const { data: boatsData } = await supabase
        .from('boats')
        .select(`
          id,
          name,
          sail_number,
          status,
          is_primary,
          boat_classes(name)
        `)
        .eq('user_id', userId);

      // Count races per boat class (from race metadata)
      const boatClassRaces = new Map<string, { count: number; wins: number }>();
      (regattas || []).forEach((race: any) => {
        const boatClass = race.metadata?.boat_class;
        if (!boatClass) return;
        const p = participantsMap.get(race.id);
        if (!boatClassRaces.has(boatClass)) {
          boatClassRaces.set(boatClass, { count: 0, wins: 0 });
        }
        const stats = boatClassRaces.get(boatClass)!;
        stats.count++;
        if (p?.finish_position === 1) stats.wins++;
      });

      const boats: UserBoat[] = (boatsData || []).map((b: any) => {
        const className = b.boat_classes?.name || 'Unknown';
        const classStats = boatClassRaces.get(className) || { count: 0, wins: 0 };
        return {
          id: b.id,
          name: b.name,
          className,
          sailNumber: b.sail_number,
          isPrimary: b.is_primary || false,
          raceCount: classStats.count,
          winCount: classStats.wins,
        };
      });

      const displayName = sailorProfile?.display_name || profileData.full_name || 'Sailor';

      // Fetch achievements from database
      const { data: achievementsData } = await supabase
        .from('sailor_achievements')
        .select(`
          id,
          achievement_type,
          title,
          description,
          icon,
          earned_at,
          related_regatta_id,
          regattas(name)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      const achievements: Achievement[] = (achievementsData || []).map((a: any) => ({
        id: a.id,
        type: a.achievement_type,
        title: a.title || getDefaultAchievementTitle(a.achievement_type),
        description: a.description || getDefaultAchievementDescription(a.achievement_type),
        icon: a.icon || getDefaultAchievementIcon(a.achievement_type),
        earnedAt: a.earned_at,
        relatedRegattaId: a.related_regatta_id,
        relatedRegattaName: a.regattas?.name,
      }));

      // Calculate personal records from race data
      const personalRecords: PersonalRecord[] = [];

      // Best finish
      if (allPositions.length > 0) {
        const bestPosition = Math.min(...allPositions);
        const bestRace = finishedRaces.find((r: any) => {
          const p = participantsMap.get(r.id);
          return p?.finish_position === bestPosition;
        });
        personalRecords.push({
          id: 'pr-best-finish',
          label: 'Best Finish',
          value: getOrdinal(bestPosition),
          detail: bestRace?.metadata?.fleet_size ? `in ${bestRace.metadata.fleet_size} boat fleet` : undefined,
          date: bestRace?.start_date,
          regattaName: bestRace?.name,
          icon: 'trophy',
          color: 'systemYellow',
        });
      }

      // Most wins in a season (current year)
      if (seasonWins > 0) {
        personalRecords.push({
          id: 'pr-season-wins',
          label: 'Season Wins',
          value: seasonWins,
          detail: `${new Date().getFullYear()} season`,
          icon: 'ribbon',
          color: 'systemOrange',
        });
      }

      // Total podiums
      if (totalPodiums > 0) {
        personalRecords.push({
          id: 'pr-total-podiums',
          label: 'Career Podiums',
          value: totalPodiums,
          detail: `${Math.round((totalPodiums / finishedRaces.length) * 100)}% podium rate`,
          icon: 'medal',
          color: 'systemBlue',
        });
      }

      // Venues raced
      if (venuesVisited.length > 0) {
        personalRecords.push({
          id: 'pr-venues',
          label: 'Venues Raced',
          value: venuesVisited.length,
          detail: 'different clubs',
          icon: 'location',
          color: 'systemGreen',
        });
      }

      // For now, challenges are empty (would come from a challenges table)
      const challenges: Challenge[] = [];

      // For now, recent activity is empty (would come from activity feed)
      const recentActivity: RecentActivity[] = [];

      setData({
        profile: {
          userId,
          displayName,
          email: profileData.email,
          avatarUrl: sailorProfile?.avatar_url || null,
          avatarInitials: getInitials(displayName),
          bio: sailorProfile?.bio || null,
          location: sailorProfile?.location || null,
          homeClub: homeClubName,
          sailingSince: sailorProfile?.sailing_since || null,
          followerCount: followerCount || 0,
          followingCount: followingCount || 0,
        },
        stats: {
          totalRaces: finishedRaces.length,
          totalWins,
          totalPodiums,
          averageFinish,
          winRate,
          seasonRaces: seasonRaces.length,
          seasonWins,
          seasonPodiums,
          seasonAverageFinish,
          currentStreak: 0, // TODO: Calculate actual streak
          longestStreak: 0,
          totalTimeOnWater: Math.round(totalTimeOnWater),
          memberSince: profileData.created_at,
        },
        venuesVisited,
        boats,
        achievements,
        personalRecords,
        challenges,
        recentActivity,
      });
    } catch (err) {
      logger.error('Error loading profile data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refresh: loadData,
  };
}

// =============================================================================
// MOCK DATA HOOK (for demo purposes)
// =============================================================================

export function useReflectProfileMock(): {
  data: ReflectProfileData;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
} {
  const { data: reflectData } = useReflectDataMock();

  const mockData: ReflectProfileData = useMemo(() => ({
    profile: {
      userId: 'mock-user',
      displayName: 'Alex Chen',
      email: 'alex@sailing.com',
      avatarUrl: null,
      avatarInitials: 'AC',
      bio: 'Weekend warrior sailor based in Hong Kong. J/80 enthusiast.',
      location: 'Hong Kong',
      homeClub: 'Royal Hong Kong Yacht Club',
      sailingSince: 2018,
      followerCount: 42,
      followingCount: 38,
    },
    stats: {
      totalRaces: 87,
      totalWins: 12,
      totalPodiums: 28,
      averageFinish: 4.2,
      winRate: 0.14,
      seasonRaces: reflectData.stats.totalRacesThisYear,
      seasonWins: 3,
      seasonPodiums: reflectData.stats.totalPodiumsThisYear,
      seasonAverageFinish: 3.8,
      currentStreak: reflectData.stats.currentStreak,
      longestStreak: 8,
      totalTimeOnWater: reflectData.stats.totalTimeOnWaterThisYear,
      memberSince: '2018-03-15T00:00:00Z',
    },
    venuesVisited: [
      {
        id: 'rhkyc',
        name: 'Royal Hong Kong Yacht Club',
        location: 'Victoria Harbour',
        raceCount: 45,
        lastRaceDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        bestFinish: 1,
        averageFinish: 3.8,
      },
      {
        id: 'abc',
        name: 'Aberdeen Boat Club',
        location: 'Aberdeen',
        raceCount: 22,
        lastRaceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        bestFinish: 2,
        averageFinish: 4.5,
      },
      {
        id: 'hhyc',
        name: 'Hebe Haven Yacht Club',
        location: 'Sai Kung',
        raceCount: 12,
        lastRaceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        bestFinish: 1,
        averageFinish: 3.2,
      },
      {
        id: 'myc',
        name: 'Middle Island Yacht Club',
        location: 'Repulse Bay',
        raceCount: 8,
        lastRaceDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        bestFinish: 3,
        averageFinish: 5.1,
      },
    ],
    boats: [
      {
        id: 'boat-1',
        name: 'Wind Dancer',
        className: 'J/80',
        sailNumber: 'HKG 1234',
        isPrimary: true,
        raceCount: 65,
        winCount: 10,
      },
      {
        id: 'boat-2',
        name: 'Silver Arrow',
        className: 'Laser',
        sailNumber: 'HKG 567',
        isPrimary: false,
        raceCount: 22,
        winCount: 2,
      },
    ],
    // Phase 3: Achievements
    achievements: [
      {
        id: 'ach-1',
        type: 'first_win',
        title: 'First Victory',
        description: 'Won your first race',
        icon: 'trophy',
        earnedAt: '2019-06-15T14:30:00Z',
        relatedRegattaName: 'Summer Series Race 3',
      },
      {
        id: 'ach-2',
        type: 'race_milestone_50',
        title: '50 Races',
        description: 'Completed 50 races',
        icon: 'star',
        earnedAt: '2022-09-20T12:00:00Z',
      },
      {
        id: 'ach-3',
        type: 'series_champion',
        title: 'Series Champion',
        description: 'Won a race series',
        icon: 'ribbon',
        earnedAt: '2024-11-30T16:00:00Z',
        relatedRegattaName: 'Autumn Championship',
      },
      {
        id: 'ach-4',
        type: 'win_streak_3',
        title: 'Hot Streak',
        description: '3 consecutive wins',
        icon: 'flame',
        earnedAt: '2024-08-10T15:00:00Z',
      },
      {
        id: 'ach-5',
        type: 'first_podium',
        title: 'First Podium',
        description: 'Finished in top 3 for the first time',
        icon: 'medal',
        earnedAt: '2019-04-20T13:00:00Z',
        relatedRegattaName: 'Spring Opener',
      },
      {
        id: 'ach-6',
        type: 'first_race',
        title: 'Getting Started',
        description: 'Completed your first race',
        icon: 'flag',
        earnedAt: '2018-03-25T11:00:00Z',
        relatedRegattaName: 'Beginner Regatta',
      },
    ],
    personalRecords: [
      {
        id: 'pr-1',
        label: 'Best Finish',
        value: '1st',
        detail: 'in 45 boat fleet',
        date: '2024-11-30',
        regattaName: 'Autumn Championship Finals',
        icon: 'trophy',
        color: 'systemYellow',
      },
      {
        id: 'pr-2',
        label: 'Best Win Streak',
        value: 5,
        detail: 'consecutive wins',
        date: '2024-08-10',
        icon: 'flame',
        color: 'systemOrange',
      },
      {
        id: 'pr-3',
        label: 'Largest Fleet Win',
        value: '1st of 52',
        detail: 'Around the Island Race',
        date: '2023-10-15',
        regattaName: 'Around the Island Race',
        icon: 'people',
        color: 'systemBlue',
      },
      {
        id: 'pr-4',
        label: 'Best Season',
        value: '2024',
        detail: '8 wins, 67% podium rate',
        icon: 'calendar',
        color: 'systemGreen',
      },
      {
        id: 'pr-5',
        label: 'Best Average Finish',
        value: '2.3',
        detail: 'Winter Series 2024',
        date: '2024-02-28',
        icon: 'analytics',
        color: 'systemPurple',
      },
    ],
    challenges: [
      {
        id: 'ch-1',
        title: 'January Racing',
        description: 'Complete 5 races this month',
        type: 'race_count',
        targetValue: 5,
        currentValue: 3,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        isCompleted: false,
        icon: 'flag',
      },
      {
        id: 'ch-2',
        title: 'Podium Hunter',
        description: 'Finish on the podium 10 times',
        type: 'podium_count',
        targetValue: 10,
        currentValue: 10,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        isCompleted: true,
        completedAt: '2025-11-15',
        reward: 'Podium Pro Badge',
        icon: 'medal',
      },
      {
        id: 'ch-3',
        title: 'Venue Explorer',
        description: 'Race at 5 different venues',
        type: 'venue_count',
        targetValue: 5,
        currentValue: 4,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        isCompleted: false,
        icon: 'location',
      },
    ],
    // Phase 4: Recent Activity
    recentActivity: [
      {
        id: 'act-1',
        type: 'race_completed',
        title: 'Finished 2nd in Spring Series Race 4',
        description: 'Royal Hong Kong Yacht Club',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        relatedRegattaId: 'reg-123',
        relatedRegattaName: 'Spring Series Race 4',
      },
      {
        id: 'act-2',
        type: 'new_follower',
        title: 'Sarah Wong started following you',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        relatedUserId: 'user-456',
        relatedUserName: 'Sarah Wong',
        relatedUserAvatar: 'https://i.pravatar.cc/150?u=sarah',
      },
      {
        id: 'act-3',
        type: 'achievement_earned',
        title: 'Earned "Hot Streak" achievement',
        description: '3 consecutive wins',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
      {
        id: 'act-4',
        type: 'comment_received',
        title: 'Mike Lee commented on your race',
        description: '"Great finish! The start was amazing."',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        relatedUserId: 'user-789',
        relatedUserName: 'Mike Lee',
        relatedUserAvatar: 'https://i.pravatar.cc/150?u=mike',
      },
      {
        id: 'act-5',
        type: 'liked_post',
        title: 'Emma Chen liked your race result',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        relatedUserId: 'user-012',
        relatedUserName: 'Emma Chen',
        relatedUserAvatar: 'https://i.pravatar.cc/150?u=emma',
      },
      {
        id: 'act-6',
        type: 'followed_user',
        title: 'You started following James Tan',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        relatedUserId: 'user-345',
        relatedUserName: 'James Tan',
        relatedUserAvatar: 'https://i.pravatar.cc/150?u=james',
      },
    ],
  }), [reflectData]);

  return {
    data: mockData,
    loading: false,
    error: null,
    refresh: () => {},
  };
}
