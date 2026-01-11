/**
 * Save Sailor Profile Service
 * Standalone function to save sailor onboarding data to Supabase
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('SaveSailorProfile');

export interface SaveSailorProfileData {
  sailor_id: string;
  role: 'owner' | 'crew' | 'both';
  club_name?: string;
  venue_name?: string;
  boat_class?: string;
  sail_number?: string;
  boat_name?: string;
  next_race?: {
    name: string;
    date: string;
    time: string;
    location: string;
  };
  fleet_mates?: Array<{
    boat_name: string;
    sail_number: string;
    owner_name: string;
  }>;
}

export async function saveSailorProfile(data: SaveSailorProfileData) {
  const { sailor_id, role, club_name, venue_name, boat_class, sail_number, boat_name, next_race, fleet_mates } = data;

  if (!sailor_id) {
    throw new Error('sailor_id is required');
  }

  try {
    // 1. Mark onboarding complete in users table
    const { error: userError } = await supabase
      .from('users')
      .update({
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sailor_id);

    if (userError) {
      logger.error('User update error:', userError);
      throw userError;
    }

    // 2. Create/update sailor profile
    const { data: existingProfile } = await supabase
      .from('sailor_profiles')
      .select('id')
      .eq('user_id', sailor_id)
      .maybeSingle();

    const profileData: any = {
      user_id: sailor_id,
      updated_at: new Date().toISOString(),
    };

    // Only set id if updating existing profile
    if (existingProfile) {
      profileData.id = existingProfile.id;
    }

    const { data: savedProfile, error: profileError } = await supabase
      .from('sailor_profiles')
      .upsert(profileData)
      .select()
      .maybeSingle();

    if (profileError) {
      logger.error('Sailor profile error:', profileError);
      throw profileError;
    }

    const sailorProfileId = savedProfile?.id;
    if (!sailorProfileId) {
      throw new Error('Failed to get sailor profile ID');
    }

    // 3. Save club if provided (find or create)
    if (club_name) {

      // Try to find existing club
      const { data: existingClubs } = await supabase
        .from('yacht_clubs')
        .select('id')
        .ilike('name', club_name)
        .limit(1);

      const existingClub = existingClubs?.[0];

      let club_id = existingClub?.id;

      // If club doesn't exist, create it
      if (!club_id) {
        const { data: newClub, error: clubError } = await supabase
          .from('yacht_clubs')
          .insert({
            name: club_name,
            created_at: new Date().toISOString(),
          })
          .select()
          .maybeSingle();

        if (clubError) {
          logger.error('Club creation error:', clubError);
        } else {
          club_id = newClub?.id;
        }
      }

      // Save club membership
      if (club_id) {
        const { error: membershipError } = await supabase
          .from('club_members')
          .upsert({
            sailor_id: sailorProfileId,
            club_id,
            joined_at: new Date().toISOString(),
          });

        if (membershipError) {
          logger.error('Club membership error:', membershipError);
        }
      }
    }

    // 4. Save boat if provided
    if (boat_class) {

      // Try to find existing boat class
      const { data: existingClasses } = await supabase
        .from('boat_classes')
        .select('id')
        .ilike('name', boat_class)
        .limit(1);

      const existingClass = existingClasses?.[0];

      let class_id = existingClass?.id;

      // If class doesn't exist, create it
      if (!class_id) {
        const { data: newClass, error: classError } = await supabase
          .from('boat_classes')
          .insert({
            name: boat_class,
            created_at: new Date().toISOString(),
          })
          .select()
          .maybeSingle();

        if (classError) {
          logger.error('Boat class creation error:', classError);
        } else {
          class_id = newClass?.id;
        }
      }

      // Save boat
      if (class_id) {
        const { error: boatError } = await supabase
          .from('sailor_boats')
          .upsert({
            sailor_id: sailorProfileId,
            class_id,
            sail_number: sail_number || null,
            boat_name: boat_name || null,
            is_owner: role === 'owner' || role === 'both',
            is_primary: true,
          }, {
            // Handle conflicts on the unique constraint (sailor_id, class_id, sail_number)
            onConflict: 'sailor_id,class_id,sail_number',
            ignoreDuplicates: false,
          });

        if (boatError) {
          logger.error('Boat save error:', boatError);
        }
      }
    }

    // 5. Save fleet mates as suggested connections
    if (fleet_mates && fleet_mates.length > 0) {
      const connections = fleet_mates.map(mate => ({
        sailor_id: sailorProfileId,
        suggested_sailor_name: mate.owner_name,
        boat_name: mate.boat_name,
        sail_number: mate.sail_number,
        boat_class: boat_class || null,
        source: 'onboarding_scrape',
        created_at: new Date().toISOString(),
      }));

      const { error: connectionsError } = await supabase
        .from('sailor_suggested_connections')
        .insert(connections);

      if (connectionsError) {
        logger.error('Connections save error:', connectionsError);
      }
    }

    // 6. Save next race if provided (CRITICAL for strategy)
    if (next_race) {
      const { error: raceError } = await supabase
        .from('sailor_race_calendar')
        .insert({
          sailor_id: sailorProfileId,
          name: next_race.name,
          race_date: next_race.date,
          start_time: next_race.time,
          location: next_race.location,
          notes: 'Added during onboarding',
          created_at: new Date().toISOString(),
        });

      if (raceError) {
        logger.error('Race save error:', raceError);
      }
    }

    return {
      success: true,
      sailor_profile_id: sailorProfileId,
    };
  } catch (error: any) {
    logger.error('Profile save failed:', error);
    throw error;
  }
}
