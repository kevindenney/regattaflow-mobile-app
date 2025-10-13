/**
 * Save Sailor Profile Service
 * Standalone function to save sailor onboarding data to Supabase
 */

import { supabase } from '@/src/services/supabase';

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

  console.log('💾 Saving sailor profile:', data);

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
      console.error('❌ User update error:', userError);
      throw userError;
    }
    console.log('✅ Marked onboarding complete');

    // 2. Create/update sailor profile
    const { data: existingProfiles } = await supabase
      .from('sailor_profiles')
      .select('id')
      .eq('user_id', sailor_id);

    const existingProfile = existingProfiles?.[0];

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
      console.error('❌ Sailor profile error:', profileError);
      throw profileError;
    }
    console.log('✅ Saved sailor profile');

    const sailorProfileId = savedProfile?.id;
    if (!sailorProfileId) {
      throw new Error('Failed to get sailor profile ID');
    }

    // 3. Save club if provided (find or create)
    if (club_name) {
      console.log('💾 Saving club:', club_name);

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
          console.error('❌ Club creation error:', clubError);
        } else {
          club_id = newClub?.id;
          console.log('✅ Created new club');
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
          console.error('❌ Club membership error:', membershipError);
        } else {
          console.log('✅ Saved club membership');
        }
      }
    }

    // 4. Save boat if provided
    if (boat_class) {
      console.log('💾 Saving boat:', boat_class, sail_number);

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
          console.error('❌ Boat class creation error:', classError);
        } else {
          class_id = newClass?.id;
          console.log('✅ Created new boat class');
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
          });

        if (boatError) {
          console.error('❌ Boat save error:', boatError);
        } else {
          console.log('✅ Saved boat');
        }
      }
    }

    // 5. Save fleet mates as suggested connections
    if (fleet_mates && fleet_mates.length > 0) {
      console.log('💾 Saving fleet mates as suggested connections:', fleet_mates.length);

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
        console.error('❌ Connections save error:', connectionsError);
      } else {
        console.log('✅ Saved suggested connections');
      }
    }

    // 6. Save next race if provided (CRITICAL for strategy)
    if (next_race) {
      console.log('💾 Saving next race:', next_race);

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
        console.error('❌ Race save error:', raceError);
      } else {
        console.log('✅ Saved next race');
      }
    }

    console.log('✅ All profile data saved successfully!');
    return {
      success: true,
      sailor_profile_id: sailorProfileId,
    };
  } catch (error: any) {
    console.error('❌ Profile save failed:', error);
    throw error;
  }
}
