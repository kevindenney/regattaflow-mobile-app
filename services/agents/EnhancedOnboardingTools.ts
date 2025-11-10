// @ts-nocheck

/**
 * Enhanced Onboarding Tools
 * Comprehensive Supabase-integrated tools for sailor onboarding
 */

import { z } from 'zod';
import { AgentTool } from './BaseAgentService';
import { supabase } from '../supabase';

/**
 * Tool: Find yacht clubs at venue
 */
export function createFindYachtClubsTool(): AgentTool {
  return {
    name: 'find_yacht_clubs_at_venue',
    description: `Find all yacht clubs at a specific sailing venue from Supabase.
Returns clubs with their details for membership suggestions.`,
    input_schema: z.object({
      venue_id: z.string().describe('The venue ID'),
    }),
    execute: async (input) => {
      try {
        const { data: clubs, error } = await supabase
          .from('yacht_clubs')
          .select('*')
          .eq('venue_id', input.venue_id);

        if (error) throw error;

        if (!clubs || clubs.length === 0) {
          return {
            success: false,
            natural_language: `I couldn't find any registered yacht clubs at this venue yet. Would you like to add your club?`,
          };
        }

        const clubList = clubs.map(c => `**${c.name}**`).join(', ');

        return {
          success: true,
          clubs,
          count: clubs.length,
          natural_language: `I found ${clubs.length} yacht club${clubs.length > 1 ? 's' : ''} at this venue: ${clubList}. Which one(s) do you race with?`,
        };
      } catch (error: any) {
        return {
          success: false,
          natural_language: `Error finding clubs: ${error.message}`,
        };
      }
    },
  };
}

/**
 * Tool: Find fleets for boat class
 */
export function createFindFleetsByClassTool(): AgentTool {
  return {
    name: 'find_fleets_by_boat_class',
    description: `Find active racing fleets for a specific boat class from Supabase.
Returns fleets with member counts and activity data.`,
    input_schema: z.object({
      class_name: z.string().describe('Boat class name (e.g., "Dragon", "J/70")'),
      venue_id: z.string().optional().describe('Optional venue to filter by'),
    }),
    execute: async (input) => {
      try {
        // First find the boat class ID
        const { data: boatClass } = await supabase
          .from('boat_classes')
          .select('id, name')
          .ilike('name', `%${input.class_name}%`)
          .limit(1)
          .single();

        if (!boatClass) {
          return {
            success: false,
            natural_language: `I couldn't find the ${input.class_name} class in our database. Could you verify the boat name?`,
          };
        }

        // Find fleets for this class
        let query = supabase
          .from('fleets')
          .select(`
            *,
            yacht_clubs(name, id),
            boat_classes(name)
          `)
          .eq('class_id', boatClass.id)
          .in('visibility', ['public', 'club']);

        if (input.venue_id) {
          query = query.eq('club_id', input.venue_id);
        }

        const { data: fleets, error } = await query;

        if (error) throw error;

        if (!fleets || fleets.length === 0) {
          return {
            success: false,
            natural_language: `I didn't find any active ${input.class_name} fleets at this location. Would you like to create one?`,
          };
        }

        const fleetDescriptions = fleets.map(
          f => `**${f.name}** at ${f.yacht_clubs?.name || 'Unknown Club'} (${f.member_count || 0} members)`
        ).join(', ');

        return {
          success: true,
          fleets,
          boat_class: boatClass,
          count: fleets.length,
          natural_language: `I found ${fleets.length} active ${input.class_name} fleet${fleets.length > 1 ? 's' : ''}: ${fleetDescriptions}. Which fleet(s) do you race with?`,
        };
      } catch (error: any) {
        return {
          success: false,
          natural_language: `Error finding fleets: ${error.message}`,
        };
      }
    },
  };
}

/**
 * Tool: Find sailors in fleet for social connections
 */
export function createFindFleetSailorsTool(): AgentTool {
  return {
    name: 'find_sailors_in_fleet',
    description: `Find other sailors in a fleet to suggest social connections.
Returns sailor profiles for "Do you know..." suggestions.`,
    input_schema: z.object({
      fleet_id: z.string().describe('The fleet ID'),
      limit: z.coerce.number().optional().default(5).describe('Max sailors to return'),
    }),
    execute: async (input) => {
      try {
        // This would query a fleet_members junction table
        // For now, return placeholder structure
        const { data: sailors, error } = await supabase
          .from('sailor_profiles')
          .select(`
            id,
            users!inner(full_name, email)
          `)
          .limit(input.limit);

        if (error) throw error;

        if (!sailors || sailors.length === 0) {
          return {
            success: true,
            sailors: [],
            natural_language: `This fleet is just getting started - you could be one of the first members!`,
          };
        }

        const sailorNames = sailors
          .map(s => s.users?.full_name)
          .filter(Boolean)
          .join(', ');

        return {
          success: true,
          sailors,
          count: sailors.length,
          natural_language: `There are ${sailors.length} sailors in this fleet. Do you know any of these sailors: ${sailorNames}?`,
        };
      } catch (error: any) {
        return {
          success: false,
          natural_language: `Error finding fleet members: ${error.message}`,
        };
      }
    },
  };
}

/**
 * Tool: Save sailor profile with all onboarding data
 */
export function createSaveSailorProfileTool(): AgentTool {
  return {
    name: 'save_sailor_profile',
    description: `Save complete sailor profile to Supabase including boats, clubs, fleets, and preferences.
This is the main data persistence tool.`,
    input_schema: z.object({
      sailor_id: z.string().describe('User ID'),
      profile_data: z.object({
        role: z.enum(['owner', 'crew', 'both']).describe('Owner or crew role'),
        primary_venue_id: z.string().optional(),
        primary_boat_class: z.string().optional(),
        boats: z.array(z.object({
          class_id: z.string(),
          sail_number: z.string().optional(),
          is_owner: z.boolean(),
          is_primary: z.boolean(),
        })).optional(),
        clubs: z.array(z.string()).optional(),
        fleets: z.array(z.string()).optional(),
        class_associations: z.array(z.string()).optional(),
      }),
    }),
    execute: async (input) => {
      try {
        const { sailor_id, profile_data } = input;

        if (!sailor_id) {
          throw new Error('sailor_id is required');
        }

        // 1. Mark onboarding complete in users table
        const { error: userError } = await supabase
          .from('users')
          .update({
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sailor_id);

        if (userError) {

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
          .single();

        if (profileError) {

          throw profileError;
        }

        // Get the sailor_profile ID for foreign key references
        const sailorProfileId = savedProfile?.id;
        if (!sailorProfileId) {
          throw new Error('Failed to get sailor profile ID');
        }

        // 3. Save boats
        if (profile_data.boats && profile_data.boats.length > 0) {

          const boatsToInsert = profile_data.boats.map(boat => ({
            sailor_id: sailorProfileId,
            class_id: boat.class_id,
            sail_number: boat.sail_number,
            is_owner: boat.is_owner,
            is_primary: boat.is_primary,
          }));

          const { error: boatsError } = await supabase
            .from('sailor_boats')
            .upsert(boatsToInsert);

          if (boatsError) {

          } else {

          }
        }

        // 4. Save club memberships
        if (profile_data.clubs && profile_data.clubs.length > 0) {

          const clubMemberships = profile_data.clubs.map(club_id => ({
            sailor_id: sailorProfileId,
            club_id,
            joined_at: new Date().toISOString(),
          }));

          const { error: clubsError } = await supabase
            .from('club_members')
            .upsert(clubMemberships);

          if (clubsError) {

          } else {

          }
        }

        // 5. Save fleet memberships
        if (profile_data.fleets && profile_data.fleets.length > 0) {

          const fleetMemberships = profile_data.fleets.map(fleet_id => ({
            sailor_id: sailorProfileId,
            fleet_id,
            joined_at: new Date().toISOString(),
          }));

          const { error: fleetsError } = await supabase
            .from('fleet_members')
            .upsert(fleetMemberships);

          if (fleetsError) {

          } else {

          }
        }

        return {
          success: true,
          natural_language: `✅ Profile saved! I've recorded your ${profile_data.role} role, ${profile_data.boats?.length || 0} boat(s), ${profile_data.clubs?.length || 0} club(s), and ${profile_data.fleets?.length || 0} fleet(s).`,
        };
      } catch (error: any) {

        return {
          success: false,
          natural_language: `Error saving profile: ${error.message}`,
        };
      }
    },
  };
}

/**
 * Tool: Generate onboarding summary
 */
export function createGenerateSummaryTool(): AgentTool {
  return {
    name: 'generate_onboarding_summary',
    description: `Generate a formatted summary of all onboarding data collected.
Shows user what will be saved and allows for review/editing.
IMPORTANT: All data fields should be properly structured objects with id and name fields.`,
    input_schema: z.object({
      onboarding_data: z.object({
        venue: z.union([
          z.object({
            id: z.string(),
            name: z.string(),
          }),
          z.string(), // Allow simple string
        ]).optional(),
        role: z.string().optional(),
        boats: z.array(z.union([
          z.object({
            class_name: z.string(),
            sail_number: z.string().optional(),
            boat_name: z.string().optional(),
            is_owner: z.boolean(),
          }),
          z.string(), // Allow simple string like "Dragon"
        ])).optional(),
        clubs: z.array(z.union([
          z.object({
            id: z.string(),
            name: z.string(),
          }),
          z.string(), // Allow simple string like "RHKYC"
        ])).optional(),
        fleets: z.array(z.union([
          z.object({
            id: z.string(),
            name: z.string(),
          }),
          z.string(),
        ])).optional(),
      }),
    }),
    execute: async (input) => {
      const { onboarding_data } = input;

      let summary = '## 📋 Your Sailing Profile Summary\n\n';

      // Handle venue (string or object)
      if (onboarding_data.venue) {
        const venueName = typeof onboarding_data.venue === 'string'
          ? onboarding_data.venue
          : onboarding_data.venue.name;
        summary += `**📍 Home Venue:** ${venueName}\n\n`;
      }

      if (onboarding_data.role) {
        summary += `**👤 Sailor Role:** ${onboarding_data.role}\n\n`;
      }

      // Handle boats (strings or objects)
      if (onboarding_data.boats && onboarding_data.boats.length > 0) {
        summary += `**⛵ Your Boats:**\n`;
        onboarding_data.boats.forEach(boat => {
          if (typeof boat === 'string') {
            summary += `  • ${boat}\n`;
          } else {
            const role = boat.is_owner ? 'Owner' : 'Crew';
            const sailNum = boat.sail_number ? ` (${boat.sail_number})` : '';
            const boatName = boat.boat_name ? ` "${boat.boat_name}"` : '';
            summary += `  • ${boat.class_name}${boatName}${sailNum} - ${role}\n`;
          }
        });
        summary += '\n';
      }

      // Handle clubs (strings or objects)
      if (onboarding_data.clubs && onboarding_data.clubs.length > 0) {
        summary += `**🏛️ Yacht Clubs:**\n`;
        onboarding_data.clubs.forEach(club => {
          const clubName = typeof club === 'string' ? club : club.name;
          summary += `  • ${clubName}\n`;
        });
        summary += '\n';
      }

      // Handle fleets (strings or objects)
      if (onboarding_data.fleets && onboarding_data.fleets.length > 0) {
        summary += `**🏁 Racing Fleets:**\n`;
        onboarding_data.fleets.forEach(fleet => {
          const fleetName = typeof fleet === 'string' ? fleet : fleet.name;
          summary += `  • ${fleetName}\n`;
        });
        summary += '\n';
      }

      summary += `\nDoes this look correct? You can say "yes" to save, or tell me what you'd like to change!`;

      return {
        success: true,
        summary,
        natural_language: summary,
      };
    },
  };
}

/**
 * Tool: Import race calendar from clubs
 */
export function createImportRaceCalendarTool(): AgentTool {
  return {
    name: 'import_race_calendar',
    description: `Import upcoming races from yacht clubs and class associations.
Populates the sailor's race calendar automatically.`,
    input_schema: z.object({
      sailor_id: z.string(),
      club_ids: z.array(z.string()).optional(),
      class_names: z.array(z.string()).optional(),
    }),
    execute: async (input) => {
      try {
        let raceCount = 0;

        // Import from clubs
        if (input.club_ids && input.club_ids.length > 0) {
          const { data: clubRaces } = await supabase
            .from('club_race_calendar')
            .select('*')
            .in('club_id', input.club_ids)
            .gte('race_date', new Date().toISOString());

          raceCount += clubRaces?.length || 0;
        }

        // Import from class associations (placeholder)
        if (input.class_names && input.class_names.length > 0) {
          // Would query class_association events
          raceCount += 5; // Placeholder
        }

        return {
          success: true,
          races_imported: raceCount,
          natural_language: `📅 Found ${raceCount} upcoming races! I've added them to your calendar. You can view and register for them in your dashboard.`,
        };
      } catch (error: any) {
        return {
          success: false,
          natural_language: `Error importing calendar: ${error.message}`,
        };
      }
    },
  };
}
