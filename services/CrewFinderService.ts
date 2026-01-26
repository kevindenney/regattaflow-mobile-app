/**
 * CrewFinderService
 *
 * Service for crew discovery and search:
 * - Searching for users by name
 * - Getting members of fleets the user belongs to
 * - Getting public fleets to browse/join
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('CrewFinderService');

/**
 * User profile data for crew finder
 */
export interface SailorProfileSummary {
  userId: string;
  fullName: string;
  avatarEmoji?: string;
  avatarColor?: string;
  sailingExperience?: string;
  email?: string;
}

/**
 * Fleet with members for crew finder
 */
export interface FleetWithMembers {
  id: string;
  name: string;
  description?: string;
  boatClassName?: string;
  memberCount: number;
  members: SailorProfileSummary[];
}

/**
 * Public fleet for browsing
 */
export interface PublicFleet {
  id: string;
  name: string;
  description?: string;
  boatClassName?: string;
  region?: string;
  memberCount: number;
  isJoined: boolean;
}

/**
 * User follow relationship
 */
export interface UserFollow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

/**
 * Extended user profile for discovery with club info
 */
export interface DiscoverableUser extends SailorProfileSummary {
  clubName?: string;
  boatClassName?: string;
  isFollowing: boolean;
}

class CrewFinderServiceClass {
  /**
   * Search for users by name
   */
  async searchUsers(query: string, limit: number = 50): Promise<SailorProfileSummary[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    console.log('[CrewFinderService] searchUsers called with query:', query);

    // Query profiles first (no FK join with sailor_profiles)
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .ilike('full_name', `%${query.trim()}%`)
      .limit(limit);

    if (error) {
      logger.error('Failed to search users:', error);
      throw error;
    }

    if (!profiles || profiles.length === 0) {
      return [];
    }

    // Fetch sailor_profiles separately (no FK relationship)
    const userIds = profiles.map((p) => p.id);
    const { data: sailorProfiles } = await supabase
      .from('sailor_profiles')
      .select('user_id, avatar_emoji, avatar_color, experience_level')
      .in('user_id', userIds);

    const sailorProfilesMap: Record<string, any> = {};
    if (sailorProfiles) {
      sailorProfiles.forEach((sp: any) => {
        sailorProfilesMap[sp.user_id] = sp;
      });
    }

    console.log('[CrewFinderService] searchUsers found', profiles.length, 'profiles');

    return profiles.map((profile: any) => {
      const sailorProfile = sailorProfilesMap[profile.id];
      return {
        userId: profile.id,
        fullName: profile.full_name || 'Unknown',
        avatarEmoji: sailorProfile?.avatar_emoji,
        avatarColor: sailorProfile?.avatar_color,
        sailingExperience: sailorProfile?.experience_level,
        email: profile.email,
      };
    });
  }

  /**
   * Get all users (for browsing when no search query)
   */
  async getAllUsers(limit: number = 50, offset: number = 0): Promise<SailorProfileSummary[]> {
    console.log('[CrewFinderService] getAllUsers called with limit:', limit, 'offset:', offset);

    // Query profiles first (no FK join with sailor_profiles)
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .not('full_name', 'is', null)
      .order('full_name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to get users:', error);
      throw error;
    }

    if (!profiles || profiles.length === 0) {
      return [];
    }

    // Fetch sailor_profiles separately (no FK relationship)
    const userIds = profiles.map((p) => p.id);
    const { data: sailorProfiles } = await supabase
      .from('sailor_profiles')
      .select('user_id, avatar_emoji, avatar_color, experience_level')
      .in('user_id', userIds);

    const sailorProfilesMap: Record<string, any> = {};
    if (sailorProfiles) {
      sailorProfiles.forEach((sp: any) => {
        sailorProfilesMap[sp.user_id] = sp;
      });
    }

    console.log('[CrewFinderService] getAllUsers found', profiles.length, 'profiles');

    return profiles.map((profile: any) => {
      const sailorProfile = sailorProfilesMap[profile.id];
      return {
        userId: profile.id,
        fullName: profile.full_name || 'Unknown',
        avatarEmoji: sailorProfile?.avatar_emoji,
        avatarColor: sailorProfile?.avatar_color,
        sailingExperience: sailorProfile?.experience_level,
        email: profile.email,
      };
    });
  }

  /**
   * Get fleets with members that the current user belongs to
   */
  async getFleetMatesForUser(userId: string): Promise<FleetWithMembers[]> {
    console.log('[CrewFinderService] getFleetMatesForUser called with userId:', userId);

    // First get the fleet IDs the user is a member of
    const { data: userMemberships, error: membershipError } = await supabase
      .from('fleet_members')
      .select('fleet_id')
      .eq('user_id', userId);

    console.log('[CrewFinderService] getFleetMatesForUser - userMemberships:', userMemberships, 'error:', membershipError);

    if (membershipError) {
      logger.error('Failed to get user fleet memberships:', membershipError);
      throw membershipError;
    }

    if (!userMemberships || userMemberships.length === 0) {
      console.log('[CrewFinderService] getFleetMatesForUser - No fleet memberships found for user');
      return [];
    }

    const fleetIds = userMemberships.map((m: any) => m.fleet_id).filter(Boolean);

    // Fetch fleet details separately
    const { data: fleets, error: fleetsError } = await supabase
      .from('fleets')
      .select('id, name, description, class_id')
      .in('id', fleetIds);

    if (fleetsError) {
      logger.error('Failed to get user fleets:', fleetsError);
      throw fleetsError;
    }

    if (!fleets || fleets.length === 0) {
      return [];
    }

    // Get boat class names if needed
    const classIds = fleets.map((f: any) => f.class_id).filter(Boolean);
    let boatClassMap: Record<string, string> = {};
    if (classIds.length > 0) {
      const { data: boatClasses } = await supabase
        .from('boat_classes')
        .select('id, name')
        .in('id', classIds);
      if (boatClasses) {
        boatClassMap = Object.fromEntries(boatClasses.map((bc: any) => [bc.id, bc.name]));
      }
    }

    // Create fleet lookup
    const userFleets = fleets.map((f: any) => ({
      fleet_id: f.id,
      fleets: {
        id: f.id,
        name: f.name,
        description: f.description,
        boat_classes: f.class_id ? { name: boatClassMap[f.class_id] } : null,
      },
    }));

    console.log('[CrewFinderService] getFleetMatesForUser - querying fleet_members for fleetIds:', fleetIds);
    const { data: memberships, error: membersError } = await supabase
      .from('fleet_members')
      .select('fleet_id, user_id')
      .in('fleet_id', fleetIds);

    console.log('[CrewFinderService] getFleetMatesForUser - memberships result:', { membershipCount: memberships?.length, error: membersError });

    if (membersError) {
      logger.error('Failed to get fleet members:', membersError);
      throw membersError;
    }

    // Get unique user IDs to fetch profiles and sailor_profiles
    const memberUserIds = [...new Set((memberships || []).map((m: any) => m.user_id))];
    console.log('[CrewFinderService] getFleetMatesForUser - unique memberUserIds:', memberUserIds);
    let profilesMap: Record<string, any> = {};
    let sailorProfilesMap: Record<string, any> = {};

    if (memberUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', memberUserIds);

      if (profiles) {
        profilesMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
      }

      // Fetch sailor_profiles separately (no FK relationship)
      const { data: sailorProfiles } = await supabase
        .from('sailor_profiles')
        .select('user_id, avatar_emoji, avatar_color, experience_level')
        .in('user_id', memberUserIds);

      if (sailorProfiles) {
        sailorProfilesMap = Object.fromEntries(sailorProfiles.map((sp: any) => [sp.user_id, sp]));
      }
    }

    // Group members by fleet
    const membersByFleet = new Map<string, SailorProfileSummary[]>();
    (memberships || []).forEach((m: any) => {
      if (!membersByFleet.has(m.fleet_id)) {
        membersByFleet.set(m.fleet_id, []);
      }
      const sailorProfile = sailorProfilesMap[m.user_id];
      const profile = profilesMap[m.user_id];
      // Only include users who have a profile and are not the current user
      if (m.user_id !== userId && profile?.full_name) {
        membersByFleet.get(m.fleet_id)!.push({
          userId: m.user_id,
          fullName: profile.full_name,
          avatarEmoji: sailorProfile?.avatar_emoji,
          avatarColor: sailorProfile?.avatar_color,
          sailingExperience: sailorProfile?.experience_level,
        });
      }
    });

    // Build fleet with members array
    const result = userFleets
      .filter((uf: any) => uf.fleets)
      .map((uf: any) => ({
        id: uf.fleet_id,
        name: uf.fleets.name,
        description: uf.fleets.description,
        boatClassName: uf.fleets.boat_classes?.name,
        memberCount: (membersByFleet.get(uf.fleet_id) || []).length + 1, // +1 for current user
        members: membersByFleet.get(uf.fleet_id) || [],
      }));

    console.log('[CrewFinderService] getFleetMatesForUser - FINAL result:', result.map(f => ({ name: f.name, memberCount: f.members.length })));
    return result;
  }

  /**
   * Get public fleets for browsing
   */
  async getPublicFleets(
    userId: string,
    options?: { classId?: string; region?: string; limit?: number }
  ): Promise<PublicFleet[]> {
    let query = supabase
      .from('fleets')
      .select('id, name, description, region, class_id')
      .eq('is_public', true)
      .order('name', { ascending: true });

    if (options?.classId) {
      query = query.eq('class_id', options.classId);
    }

    if (options?.region) {
      query = query.ilike('region', `%${options.region}%`);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data: fleets, error: fleetsError } = await query;

    if (fleetsError) {
      logger.error('Failed to get public fleets:', fleetsError);
      throw fleetsError;
    }

    if (!fleets || fleets.length === 0) {
      return [];
    }

    const fleetIds = fleets.map((f: any) => f.id);

    // Get boat class names
    const classIds = fleets.map((f: any) => f.class_id).filter(Boolean);
    let boatClassMap: Record<string, string> = {};
    if (classIds.length > 0) {
      const { data: boatClasses } = await supabase
        .from('boat_classes')
        .select('id, name')
        .in('id', classIds);
      if (boatClasses) {
        boatClassMap = Object.fromEntries(boatClasses.map((bc: any) => [bc.id, bc.name]));
      }
    }

    // Get member counts per fleet
    const { data: memberCounts } = await supabase
      .from('fleet_members')
      .select('fleet_id')
      .in('fleet_id', fleetIds);

    const memberCountMap: Record<string, number> = {};
    (memberCounts || []).forEach((m: any) => {
      memberCountMap[m.fleet_id] = (memberCountMap[m.fleet_id] || 0) + 1;
    });

    // Get the fleets the user is already a member of
    const { data: userMemberships } = await supabase
      .from('fleet_members')
      .select('fleet_id')
      .eq('user_id', userId);

    const joinedFleetIds = new Set((userMemberships || []).map((m: any) => m.fleet_id));

    return fleets.map((fleet: any) => ({
      id: fleet.id,
      name: fleet.name,
      description: fleet.description,
      boatClassName: fleet.class_id ? boatClassMap[fleet.class_id] : undefined,
      region: fleet.region,
      memberCount: memberCountMap[fleet.id] || 0,
      isJoined: joinedFleetIds.has(fleet.id),
    }));
  }

  /**
   * Join a fleet
   */
  async joinFleet(userId: string, fleetId: string): Promise<void> {
    const { error } = await supabase
      .from('fleet_members')
      .insert({
        user_id: userId,
        fleet_id: fleetId,
        role: 'member',
      });

    if (error) {
      logger.error('Failed to join fleet:', error);
      throw error;
    }

    logger.info('Joined fleet', { userId, fleetId });
  }

  /**
   * Get fleet members for a specific race via race_participants
   * This finds which fleets are associated with a race and returns their members
   * Falls back to club-based fleet lookup if race_participants has no fleet associations
   */
  async getFleetMembersForRace(
    userId: string,
    regattaId: string
  ): Promise<{ members: SailorProfileSummary[]; fleetNames: string[] }> {
    console.log('[CrewFinderService] getFleetMembersForRace called with:', { userId, regattaId });

    // Step 1: Try to get fleet IDs via race_participants (primary approach)
    const { data: participants, error: participantsError } = await supabase
      .from('race_participants')
      .select('fleet_id')
      .eq('regatta_id', regattaId)
      .not('fleet_id', 'is', null);

    console.log('[CrewFinderService] Step 1 (race_participants):', { participants, error: participantsError });

    if (participantsError) {
      logger.error('Failed to get race fleet IDs:', participantsError);
      throw participantsError;
    }

    let fleetIds = [...new Set((participants || []).map((p: any) => p.fleet_id).filter(Boolean))];
    console.log('[CrewFinderService] Fleet IDs from race_participants:', fleetIds);

    // Step 2: Fallback - if no fleet associations, get fleets via regatta's club_id
    if (fleetIds.length === 0) {
      console.log('[CrewFinderService] No fleet IDs from race_participants, trying club-based fallback');
      logger.info('No fleet associations in race_participants, trying club-based fallback', { regattaId });

      // Get the regatta's club_id
      const { data: regatta, error: regattaError } = await supabase
        .from('regattas')
        .select('club_id')
        .eq('id', regattaId)
        .single();

      console.log('[CrewFinderService] Regatta club_id lookup:', { regatta, error: regattaError });

      if (regattaError) {
        logger.warn('Failed to get regatta club_id:', regattaError);
      }

      if (regatta?.club_id) {
        console.log('[CrewFinderService] Found club_id:', regatta.club_id, '- looking up club fleets');
        // Find fleets belonging to this club (public or club-visible)
        const { data: clubFleets, error: clubFleetsError } = await supabase
          .from('fleets')
          .select('id')
          .eq('club_id', regatta.club_id);

        console.log('[CrewFinderService] Club fleets lookup:', { clubFleets, error: clubFleetsError });

        if (clubFleetsError) {
          logger.warn('Failed to get club fleets:', clubFleetsError);
        } else {
          fleetIds = (clubFleets || []).map((f: any) => f.id);
          logger.info('Found club fleets for regatta', { clubId: regatta.club_id, fleetCount: fleetIds.length });
        }
      }
    }

    if (fleetIds.length === 0) {
      console.log('[CrewFinderService] No fleetIds found, returning empty');
      return { members: [], fleetNames: [] };
    }

    console.log('[CrewFinderService] Found fleetIds:', fleetIds);

    // Get fleet info for display
    const { data: fleets, error: fleetsError } = await supabase
      .from('fleets')
      .select('id, name')
      .in('id', fleetIds);

    console.log('[CrewFinderService] Fleet info lookup:', { fleets, error: fleetsError });

    if (fleetsError) {
      logger.error('Failed to get fleet info:', fleetsError);
    }

    const fleetNames = (fleets || []).map((f: any) => f.name);
    const fleetNameMap = new Map((fleets || []).map((f: any) => [f.id, f.name]));

    // Get members from these fleets via fleet_members
    const { data: memberships, error: membersError } = await supabase
      .from('fleet_members')
      .select('fleet_id, user_id')
      .in('fleet_id', fleetIds)
      .neq('user_id', userId);

    console.log('[CrewFinderService] Fleet memberships lookup:', { memberships, memberCount: memberships?.length, error: membersError });

    if (membersError) {
      logger.error('Failed to get fleet members:', membersError);
      throw membersError;
    }

    // Get unique user IDs to fetch profiles and sailor_profiles
    const memberUserIds = [...new Set((memberships || []).map((m: any) => m.user_id))];
    let profilesMap: Record<string, any> = {};
    let sailorProfilesMap: Record<string, any> = {};

    if (memberUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', memberUserIds);

      if (profiles) {
        profilesMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
      }

      // Fetch sailor_profiles separately (no FK relationship)
      const { data: sailorProfiles } = await supabase
        .from('sailor_profiles')
        .select('user_id, avatar_emoji, avatar_color, experience_level')
        .in('user_id', memberUserIds);

      if (sailorProfiles) {
        sailorProfilesMap = Object.fromEntries(sailorProfiles.map((sp: any) => [sp.user_id, sp]));
      }
    }

    // Build member list with fleet association
    const members: SailorProfileSummary[] = [];
    const seenUsers = new Set<string>();

    for (const m of memberships || []) {
      if (seenUsers.has(m.user_id)) continue;

      const sailorProfile = sailorProfilesMap[m.user_id];
      const profile = profilesMap[m.user_id];

      // Only include users who have a valid profile with a name
      if (!profile?.full_name) continue;

      seenUsers.add(m.user_id);
      const fleetName = fleetNameMap.get(m.fleet_id) || 'Fleet';

      members.push({
        userId: m.user_id,
        fullName: profile.full_name,
        avatarEmoji: sailorProfile?.avatar_emoji,
        avatarColor: sailorProfile?.avatar_color,
        sailingExperience: sailorProfile?.experience_level,
        email: profile?.email,
      });
    }

    console.log('[CrewFinderService] getFleetMembersForRace - FINAL result:', { memberCount: members.length, fleetNames, members: members.map(m => m.fullName) });
    return { members, fleetNames };
  }

  /**
   * Get suggested crew members for a user
   * Returns fleet mates and past race collaborators, deduplicated and ranked
   * Also boosts followed users higher in the results
   */
  async getSuggestedCrew(userId: string): Promise<SailorProfileSummary[]> {
    const suggestionsMap = new Map<string, SailorProfileSummary & { score: number; source: string }>();

    // 0. Get followed users to boost their scores
    let followingIds: string[] = [];
    try {
      followingIds = await this.getFollowingIds(userId);
    } catch (error) {
      logger.warn('Error fetching following IDs for suggestions:', error);
    }
    const followingSet = new Set(followingIds);

    // 1. Get fleet mates
    try {
      const fleets = await this.getFleetMatesForUser(userId);
      for (const fleet of fleets) {
        for (const member of fleet.members) {
          if (member.userId === userId) continue;

          const existing = suggestionsMap.get(member.userId);
          if (existing) {
            existing.score += 2; // Boost score for multiple fleet memberships
          } else {
            suggestionsMap.set(member.userId, {
              ...member,
              score: 3, // Base score for fleet mates
              source: `Fleet: ${fleet.name}`,
            });
          }
        }
      }
    } catch (error) {
      logger.warn('Error fetching fleet mates for suggestions:', error);
    }

    // 2. Get past race collaborators (from race_collaborators table)
    try {
      const { data: collaboratorRaces, error: collabError } = await supabase
        .from('race_collaborators')
        .select(`
          race_id,
          user_id,
          regattas!inner(
            id,
            name
          )
        `)
        .eq('user_id', userId);

      if (!collabError && collaboratorRaces && collaboratorRaces.length > 0) {
        // Get race IDs where the user has collaborated
        const raceIds = collaboratorRaces.map((c: any) => c.race_id);

        // Find other collaborators in those races
        const { data: otherCollaborators, error: othersError } = await supabase
          .from('race_collaborators')
          .select(`
            user_id,
            regattas!inner(
              id,
              name
            )
          `)
          .in('race_id', raceIds)
          .neq('user_id', userId);

        if (!othersError && otherCollaborators) {
          // Get unique user IDs
          const collabUserIds = [...new Set(otherCollaborators.map((c: any) => c.user_id))];

          if (collabUserIds.length > 0) {
            // Fetch profiles for these users
            const { data: profiles } = await supabase
              .from('profiles')
              .select(`
                id,
                full_name,
                email,
                sailor_profiles(
                  avatar_emoji,
                  avatar_color,
                  experience_level
                )
              `)
              .in('id', collabUserIds);

            if (profiles) {
              for (const profile of profiles) {
                // Skip current user and profiles without names
                if (profile.id === userId || !profile.full_name) continue;

                const existing = suggestionsMap.get(profile.id);
                const raceName = otherCollaborators.find((c: any) => c.user_id === profile.id)?.regattas?.name || 'past race';

                if (existing) {
                  existing.score += 1; // Boost for race collaboration
                } else {
                  suggestionsMap.set(profile.id, {
                    userId: profile.id,
                    fullName: profile.full_name,
                    avatarEmoji: (profile.sailor_profiles as any)?.avatar_emoji,
                    avatarColor: (profile.sailor_profiles as any)?.avatar_color,
                    sailingExperience: (profile.sailor_profiles as any)?.experience_level,
                    email: profile.email,
                    score: 2, // Base score for past collaborators
                    source: `Sailed with: ${raceName}`,
                  });
                }
              }
            }
          }
        }
      }
    } catch (error) {
      logger.warn('Error fetching past race collaborators for suggestions:', error);
    }

    // 3. Apply follow boost to all suggestions
    for (const [memberId, suggestion] of suggestionsMap) {
      if (followingSet.has(memberId)) {
        suggestion.score += 4; // Significant boost for followed users
        suggestion.source = `Following • ${suggestion.source}`;
      }
    }

    // 4. Sort by score (highest first) and return
    const suggestions = Array.from(suggestionsMap.values())
      .sort((a, b) => b.score - a.score)
      .map(({ score, source, ...profile }) => ({
        ...profile,
        source, // Keep source for display
      }));

    return suggestions as (SailorProfileSummary & { source?: string })[];
  }

  /**
   * Get suggested crew for a specific race
   * Prioritizes fleet members from the race's fleets, then user's fleets, then past collaborators
   * Also boosts followed users higher in the results
   */
  async getSuggestedCrewForRace(
    userId: string,
    regattaId?: string,
    regattaName?: string
  ): Promise<(SailorProfileSummary & { source?: string })[]> {
    console.log('[CrewFinderService] getSuggestedCrewForRace called with:', { userId, regattaId, regattaName });
    const suggestionsMap = new Map<string, SailorProfileSummary & { score: number; source: string }>();

    // 0. Get followed users to boost their scores
    let followingIds: string[] = [];
    try {
      followingIds = await this.getFollowingIds(userId);
      console.log('[CrewFinderService] User follows:', followingIds.length, 'users');
    } catch (error) {
      logger.warn('Error fetching following IDs:', error);
    }
    const followingSet = new Set(followingIds);

    // 1. If regattaId provided, get fleet members for this race (highest priority)
    if (regattaId) {
      try {
        console.log('[CrewFinderService] Step 1: Getting fleet members for race...');
        const { members, fleetNames } = await this.getFleetMembersForRace(userId, regattaId);
        console.log('[CrewFinderService] Step 1 result: members:', members.length, 'fleetNames:', fleetNames);
        const raceName = regattaName || 'this race';

        for (const member of members) {
          if (member.userId === userId) continue;

          suggestionsMap.set(member.userId, {
            ...member,
            score: 5, // Highest priority for race fleet members
            source: `Racing in: ${raceName}`,
          });
        }
      } catch (error) {
        console.error('[CrewFinderService] Step 1 error:', error);
        logger.warn('Error fetching race fleet members:', error);
      }
    }

    // 2. Get user's own fleet mates
    try {
      console.log('[CrewFinderService] Step 2: Getting user fleet mates...');
      const fleets = await this.getFleetMatesForUser(userId);
      console.log('[CrewFinderService] Step 2 result: fleets:', fleets.length, fleets.map(f => ({ name: f.name, memberCount: f.members.length })));
      for (const fleet of fleets) {
        for (const member of fleet.members) {
          if (member.userId === userId) continue;

          const existing = suggestionsMap.get(member.userId);
          if (existing) {
            existing.score += 2; // Boost score for multiple sources
          } else {
            suggestionsMap.set(member.userId, {
              ...member,
              score: 3, // Base score for user's fleet mates
              source: `Fleet: ${fleet.name}`,
            });
          }
        }
      }
    } catch (error) {
      console.error('[CrewFinderService] Step 2 error:', error);
      logger.warn('Error fetching fleet mates for suggestions:', error);
    }

    // 3. Get past race collaborators
    try {
      const { data: collaboratorRaces, error: collabError } = await supabase
        .from('race_collaborators')
        .select(`
          race_id,
          user_id,
          regattas!inner(
            id,
            name
          )
        `)
        .eq('user_id', userId);

      if (!collabError && collaboratorRaces && collaboratorRaces.length > 0) {
        const raceIds = collaboratorRaces.map((c: any) => c.race_id);

        const { data: otherCollaborators, error: othersError } = await supabase
          .from('race_collaborators')
          .select(`
            user_id,
            regattas!inner(
              id,
              name
            )
          `)
          .in('race_id', raceIds)
          .neq('user_id', userId);

        if (!othersError && otherCollaborators) {
          const collabUserIds = [...new Set(otherCollaborators.map((c: any) => c.user_id))];

          if (collabUserIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select(`
                id,
                full_name,
                email,
                sailor_profiles(
                  avatar_emoji,
                  avatar_color,
                  experience_level
                )
              `)
              .in('id', collabUserIds);

            if (profiles) {
              for (const profile of profiles) {
                // Skip current user and profiles without names
                if (profile.id === userId || !profile.full_name) continue;

                const existing = suggestionsMap.get(profile.id);
                const raceName = otherCollaborators.find((c: any) => c.user_id === profile.id)?.regattas?.name || 'past race';

                if (existing) {
                  existing.score += 1;
                } else {
                  suggestionsMap.set(profile.id, {
                    userId: profile.id,
                    fullName: profile.full_name,
                    avatarEmoji: (profile.sailor_profiles as any)?.avatar_emoji,
                    avatarColor: (profile.sailor_profiles as any)?.avatar_color,
                    sailingExperience: (profile.sailor_profiles as any)?.experience_level,
                    email: profile.email,
                    score: 2,
                    source: `Sailed with: ${raceName}`,
                  });
                }
              }
            }
          }
        }
      }
    } catch (error) {
      logger.warn('Error fetching past race collaborators for suggestions:', error);
    }

    // 4. Apply follow boost to all suggestions
    for (const [userId, suggestion] of suggestionsMap) {
      if (followingSet.has(userId)) {
        suggestion.score += 4; // Significant boost for followed users
        // Update source to indicate following
        suggestion.source = `Following • ${suggestion.source}`;
      }
    }

    // Sort by score (highest first) and return
    const suggestions = Array.from(suggestionsMap.values())
      .sort((a, b) => b.score - a.score)
      .map(({ score, source, ...profile }) => ({
        ...profile,
        source,
      }));

    console.log('[CrewFinderService] getSuggestedCrewForRace - FINAL result: suggestions count:', suggestions.length, suggestions.slice(0, 3).map(s => s.fullName));
    return suggestions;
  }

  // ===========================================================================
  // USER FOLLOW METHODS
  // ===========================================================================

  /**
   * Get all users for discovery (paginated)
   * Excludes the current user and includes follow status
   */
  async getAllUsersForDiscovery(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ users: DiscoverableUser[]; hasMore: boolean }> {
    console.log('[CrewFinderService] getAllUsersForDiscovery called with userId:', userId, 'limit:', limit, 'offset:', offset);

    // Get the user's following list first
    let followingIds: string[] = [];
    try {
      followingIds = await this.getFollowingIds(userId);
      console.log('[CrewFinderService] getAllUsersForDiscovery - got followingIds:', followingIds.length);
    } catch (followError) {
      console.warn('[CrewFinderService] getAllUsersForDiscovery - getFollowingIds failed (might be new table):', followError);
      // Continue without following data
    }
    const followingSet = new Set(followingIds);

    // Query profiles (base data)
    console.log('[CrewFinderService] getAllUsersForDiscovery - fetching profiles...');
    const { data: profiles, error, count } = await supabase
      .from('profiles')
      .select('id, full_name, email', { count: 'exact' })
      .not('full_name', 'is', null)
      .neq('id', userId)
      .order('full_name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[CrewFinderService] getAllUsersForDiscovery - profiles query failed:', error);
      logger.error('Failed to get users for discovery:', error);
      throw error;
    }

    console.log('[CrewFinderService] getAllUsersForDiscovery - got profiles:', profiles?.length, 'total count:', count);

    if (!profiles || profiles.length === 0) {
      return { users: [], hasMore: false };
    }

    const userIds = profiles.map((p) => p.id);

    // Fetch sailor_profiles separately (no FK relationship)
    console.log('[CrewFinderService] getAllUsersForDiscovery - fetching sailor_profiles...');
    const { data: sailorProfiles, error: sailorError } = await supabase
      .from('sailor_profiles')
      .select('user_id, avatar_emoji, avatar_color, experience_level')
      .in('user_id', userIds);

    if (sailorError) {
      console.warn('[CrewFinderService] getAllUsersForDiscovery - sailor_profiles query failed:', sailorError);
    }

    const sailorProfilesMap: Record<string, any> = {};
    if (sailorProfiles) {
      sailorProfiles.forEach((sp: any) => {
        sailorProfilesMap[sp.user_id] = sp;
      });
    }
    console.log('[CrewFinderService] getAllUsersForDiscovery - got sailor_profiles:', sailorProfiles?.length || 0);

    // Fetch club memberships separately (clubs FK exists on club_members)
    console.log('[CrewFinderService] getAllUsersForDiscovery - fetching club_members...');
    const { data: clubMemberships, error: clubError } = await supabase
      .from('club_members')
      .select('user_id, club_id')
      .in('user_id', userIds);

    if (clubError) {
      console.warn('[CrewFinderService] getAllUsersForDiscovery - club_members query failed:', clubError);
    }

    // Fetch club names separately if we have memberships
    const clubMap: Record<string, string> = {};
    if (clubMemberships && clubMemberships.length > 0) {
      const clubIds = [...new Set(clubMemberships.map((cm: any) => cm.club_id).filter(Boolean))];
      if (clubIds.length > 0) {
        const { data: clubs } = await supabase
          .from('clubs')
          .select('id, name')
          .in('id', clubIds);

        const clubNameMap: Record<string, string> = {};
        if (clubs) {
          clubs.forEach((c: any) => {
            clubNameMap[c.id] = c.name;
          });
        }

        clubMemberships.forEach((cm: any) => {
          // Only store first club for each user
          if (!clubMap[cm.user_id] && cm.club_id && clubNameMap[cm.club_id]) {
            clubMap[cm.user_id] = clubNameMap[cm.club_id];
          }
        });
      }
    }
    console.log('[CrewFinderService] getAllUsersForDiscovery - got club mappings:', Object.keys(clubMap).length);

    const users: DiscoverableUser[] = profiles.map((profile: any) => {
      const sailorProfile = sailorProfilesMap[profile.id];

      return {
        userId: profile.id,
        fullName: profile.full_name || 'Unknown',
        avatarEmoji: sailorProfile?.avatar_emoji,
        avatarColor: sailorProfile?.avatar_color,
        sailingExperience: sailorProfile?.experience_level,
        email: profile.email,
        clubName: clubMap[profile.id],
        isFollowing: followingSet.has(profile.id),
      };
    });

    console.log('[CrewFinderService] getAllUsersForDiscovery - returning', users.length, 'users, hasMore:', count !== null ? offset + limit < count : false);

    // Sort followed users to the top
    users.sort((a, b) => {
      if (a.isFollowing && !b.isFollowing) return -1;
      if (!a.isFollowing && b.isFollowing) return 1;
      return 0;
    });

    return {
      users,
      hasMore: count !== null ? offset + limit < count : false,
    };
  }

  /**
   * Follow a user
   */
  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    const { error } = await supabase
      .from('user_follows')
      .insert({
        follower_id: followerId,
        following_id: followingId,
      });

    if (error) {
      // Handle duplicate follow gracefully
      if (error.code === '23505') {
        logger.info('Already following user', { followerId, followingId });
        return;
      }
      logger.error('Failed to follow user:', error);
      throw error;
    }

    logger.info('Followed user', { followerId, followingId });
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      logger.error('Failed to unfollow user:', error);
      throw error;
    }

    logger.info('Unfollowed user', { followerId, followingId });
  }

  /**
   * Get list of user IDs that a user follows
   */
  async getFollowingIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (error) {
      logger.error('Failed to get following IDs:', error);
      throw error;
    }

    return (data || []).map((f: any) => f.following_id);
  }

  /**
   * Check if a user is following another user
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to check following status:', error);
      return false;
    }

    return !!data;
  }

  /**
   * Get follower count for a user
   */
  async getFollowerCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    if (error) {
      logger.error('Failed to get follower count:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get following count for a user
   */
  async getFollowingCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    if (error) {
      logger.error('Failed to get following count:', error);
      return 0;
    }

    return count || 0;
  }
}

// Export singleton instance
export const CrewFinderService = new CrewFinderServiceClass();

// Export type for dependency injection
export type CrewFinderServiceType = typeof CrewFinderService;
