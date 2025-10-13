/**
 * Comprehensive Onboarding Tools
 * Advanced data collection for equipment, social connections, racing areas, and more
 */

import { z } from 'zod';
import { AgentTool } from './BaseAgentService';
import { supabase } from '../supabase';

/**
 * Tool: Find class associations
 */
export function createFindClassAssociationsTool(): AgentTool {
  return {
    name: 'find_class_associations',
    description: `Ask if sailor is member of their boat class association.
This is a simple yes/no question - don't query database, just ask directly.`,
    input_schema: z.object({
      class_name: z.string().describe('Boat class name'),
    }),
    execute: async (input) => {
      // Simplified: just return a natural language question
      // The class_associations table may not have data yet
      return {
        success: true,
        natural_language: `Are you a member of the ${input.class_name} Class Association or your national ${input.class_name} organization?`,
      };
    },
  };
}

/**
 * Tool: Save equipment makers (hull, sail, mast, rig)
 */
export function createSaveEquipmentMakersTool(): AgentTool {
  return {
    name: 'save_equipment_makers',
    description: `Save equipment maker information for a boat.
Tracks hull maker, sail maker, mast maker, rig maker.`,
    input_schema: z.object({
      sailor_id: z.string(),
      boat_id: z.string().describe('sailor_boats table ID'),
      equipment: z.object({
        hull_maker: z.string().optional(),
        sail_maker: z.string().optional(),
        mast_maker: z.string().optional(),
        rig_maker: z.string().optional(),
      }),
    }),
    execute: async (input) => {
      try {
        // Note: boat_equipment table schema requires different fields
        // We'll store makers as custom_name or in specifications JSONB
        const { error } = await supabase
          .from('boat_equipment')
          .upsert([
            input.equipment.hull_maker && {
              sailor_id: input.sailor_id,
              boat_id: input.boat_id,
              category: 'hull',
              custom_name: input.equipment.hull_maker,
              status: 'active',
            },
            input.equipment.sail_maker && {
              sailor_id: input.sailor_id,
              boat_id: input.boat_id,
              category: 'sails',
              custom_name: input.equipment.sail_maker,
              subcategory: 'mainsail',
              status: 'active',
            },
            input.equipment.mast_maker && {
              sailor_id: input.sailor_id,
              boat_id: input.boat_id,
              category: 'mast',
              custom_name: input.equipment.mast_maker,
              status: 'active',
            },
            input.equipment.rig_maker && {
              sailor_id: input.sailor_id,
              boat_id: input.boat_id,
              category: 'rigging',
              custom_name: input.equipment.rig_maker,
              status: 'active',
            },
          ].filter(Boolean));

        if (error) throw error;

        const makers = [
          input.equipment.hull_maker && `Hull: ${input.equipment.hull_maker}`,
          input.equipment.sail_maker && `Sails: ${input.equipment.sail_maker}`,
          input.equipment.mast_maker && `Mast: ${input.equipment.mast_maker}`,
          input.equipment.rig_maker && `Rig: ${input.equipment.rig_maker}`,
        ].filter(Boolean).join(', ');

        return {
          success: true,
          natural_language: `✅ Saved equipment makers: ${makers}`,
        };
      } catch (error: any) {
        return {
          success: false,
          natural_language: `Error saving equipment: ${error.message}`,
        };
      }
    },
  };
}

/**
 * Tool: Save coaches
 */
export function createSaveCoachesTool(): AgentTool {
  return {
    name: 'save_coaches',
    description: `Save coach relationships for a sailor.
Tracks current and past coaches.`,
    input_schema: z.object({
      sailor_id: z.string(),
      coaches: z.array(z.object({
        coach_name: z.string(),
        coach_email: z.string().optional(),
        specialization: z.string().optional(),
        is_current: z.boolean().default(true),
      })),
    }),
    execute: async (input) => {
      try {
        const coachRecords = input.coaches.map(coach => ({
          sailor_id: input.sailor_id,
          coach_name: coach.coach_name,
          coach_email: coach.coach_email,
          specialization: coach.specialization,
          is_current: coach.is_current,
          created_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from('sailor_coaches')
          .upsert(coachRecords);

        if (error) throw error;

        const coachNames = input.coaches.map(c => c.coach_name).join(', ');

        return {
          success: true,
          natural_language: `✅ Saved coaches: ${coachNames}`,
        };
      } catch (error: any) {
        return {
          success: false,
          natural_language: `Error saving coaches: ${error.message}`,
        };
      }
    },
  };
}

/**
 * Tool: Save crew members
 */
export function createSaveCrewMembersTool(): AgentTool {
  return {
    name: 'save_crew_members',
    description: `Save regular crew members for a boat.
Tracks crew positions and relationships.
IMPORTANT: crew must be an array of objects with crew_name and optional position.
Example: [{"crew_name": "Glenn", "position": "bow"}, {"crew_name": "Kevin", "position": "main"}]`,
    input_schema: z.object({
      sailor_id: z.string(),
      boat_id: z.string(),
      crew: z.array(z.union([
        z.object({
          crew_name: z.string(),
          crew_email: z.string().optional(),
          position: z.string().optional(),
          is_regular: z.boolean().default(true),
        }),
        z.string(), // Allow string format like "Glenn - bow"
      ])),
    }),
    execute: async (input) => {
      try {
        // Normalize crew data from either object or string format
        const normalizedCrew = input.crew.map((member) => {
          if (typeof member === 'string') {
            // Parse "Name - position" or just "Name"
            const parts = member.split('-').map(s => s.trim());
            return {
              crew_name: parts[0],
              position: parts[1] || undefined,
              crew_email: undefined,
              is_regular: true,
            };
          }
          return member;
        });

        const crewRecords = normalizedCrew.map(member => ({
          sailor_id: input.sailor_id,
          boat_id: input.boat_id,
          crew_name: member.crew_name,
          crew_email: member.crew_email,
          position: member.position,
          is_regular: member.is_regular,
          created_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from('boat_crew_members')
          .upsert(crewRecords);

        if (error) throw error;

        const crewNames = normalizedCrew.map(c => `${c.crew_name} (${c.position || 'Crew'})`).join(', ');

        return {
          success: true,
          natural_language: `✅ Saved crew: ${crewNames}`,
        };
      } catch (error: any) {
        return {
          success: false,
          natural_language: `Error saving crew: ${error.message}`,
        };
      }
    },
  };
}

/**
 * Tool: Find sailors with public profiles in fleet
 */
export function createFindPublicSailorsInFleetTool(): AgentTool {
  return {
    name: 'find_public_sailors_in_fleet',
    description: `Find sailors with public profiles in a fleet for connection suggestions.
Returns sailors who have opted into public visibility.`,
    input_schema: z.object({
      fleet_id: z.string(),
      limit: z.coerce.number().optional().default(10),
    }),
    execute: async (input) => {
      try {
        const { data: sailors, error } = await supabase
          .from('fleet_members')
          .select(`
            sailor_id,
            users!inner(
              id,
              full_name,
              email
            ),
            sailor_profiles!inner(
              profile_visibility
            )
          `)
          .eq('fleet_id', input.fleet_id)
          .eq('sailor_profiles.profile_visibility', 'public')
          .limit(input.limit);

        if (error) throw error;

        if (!sailors || sailors.length === 0) {
          return {
            success: true,
            sailors: [],
            natural_language: `No public profiles found in this fleet yet. You'll be one of the first!`,
          };
        }

        const sailorNames = sailors.map(s => s.users?.full_name).filter(Boolean).join(', ');

        return {
          success: true,
          sailors,
          count: sailors.length,
          natural_language: `I found ${sailors.length} sailors with public profiles in this fleet: ${sailorNames}. Would you like to connect with any of them?`,
        };
      } catch (error: any) {
        return {
          success: false,
          natural_language: `Error finding public profiles: ${error.message}`,
        };
      }
    },
  };
}

/**
 * Tool: Save racing area for boat class
 */
export function createSaveRacingAreaTool(): AgentTool {
  return {
    name: 'save_racing_area',
    description: `Save primary racing area for a boat class.
Tracks geographic racing area, typical upwind distance, or race names.`,
    input_schema: z.object({
      sailor_id: z.string(),
      class_id: z.string(),
      racing_area: z.object({
        area_name: z.string().describe('Name of racing area (e.g., "Victoria Harbor Starting Area A")'),
        venue_id: z.string().optional(),
        typical_upwind_distance: z.string().optional().describe('e.g., "1.2 nautical miles"'),
        race_type: z.enum(['windward_leeward', 'distance', 'mixed']).optional(),
        distance_race_name: z.string().optional().describe('For distance races: race name'),
      }),
    }),
    execute: async (input) => {
      try {
        const { error } = await supabase
          .from('sailor_racing_areas')
          .upsert({
            sailor_id: input.sailor_id,
            class_id: input.class_id,
            area_name: input.racing_area.area_name,
            venue_id: input.racing_area.venue_id,
            typical_upwind_distance: input.racing_area.typical_upwind_distance,
            race_type: input.racing_area.race_type,
            distance_race_name: input.racing_area.distance_race_name,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;

        let description = `${input.racing_area.area_name}`;
        if (input.racing_area.typical_upwind_distance) {
          description += ` (${input.racing_area.typical_upwind_distance} upwind)`;
        }
        if (input.racing_area.distance_race_name) {
          description += ` - ${input.racing_area.distance_race_name}`;
        }

        return {
          success: true,
          natural_language: `✅ Saved racing area: ${description}`,
        };
      } catch (error: any) {
        return {
          success: false,
          natural_language: `Error saving racing area: ${error.message}`,
        };
      }
    },
  };
}

/**
 * Tool: Find racing series and regattas
 */
export function createFindRacingSeriesAndRegattasTool(): AgentTool {
  return {
    name: 'find_racing_series_and_regattas',
    description: `Find racing series and major regattas for a class and club.
Returns upcoming series and championship events.`,
    input_schema: z.object({
      class_id: z.string().optional(),
      club_id: z.string().optional(),
      venue_id: z.string().optional(),
      year: z.coerce.number().optional(),
    }),
    execute: async (input) => {
      try {
        const year = input.year || new Date().getFullYear();

        let query = supabase
          .from('racing_series')
          .select(`
            *,
            boat_classes(name),
            yacht_clubs(name),
            sailing_venues(name)
          `)
          .gte('start_date', `${year}-01-01`)
          .lte('start_date', `${year}-12-31`);

        if (input.class_id) {
          query = query.eq('class_id', input.class_id);
        }
        if (input.club_id) {
          query = query.eq('club_id', input.club_id);
        }
        if (input.venue_id) {
          query = query.eq('venue_id', input.venue_id);
        }

        const { data: series, error } = await query;

        if (error) throw error;

        if (!series || series.length === 0) {
          return {
            success: false,
            natural_language: `I couldn't find any registered racing series for ${year}. Are you planning to participate in any series or major regattas this year?`,
          };
        }

        const seriesList = series.map(s => `**${s.name}** (${s.race_count || '?'} races)`).join(', ');

        return {
          success: true,
          series,
          count: series.length,
          natural_language: `I found ${series.length} racing series for ${year}: ${seriesList}. Which ones are you planning to participate in?`,
        };
      } catch (error: any) {
        return {
          success: false,
          natural_language: `Are you planning to participate in any racing series or major regattas this year?`,
        };
      }
    },
  };
}

/**
 * Tool: Save sailor's racing participation plans
 */
export function createSaveRacingParticipationTool(): AgentTool {
  return {
    name: 'save_racing_participation',
    description: `Save sailor's planned racing participation for series and regattas.
Tracks which events the sailor plans to attend.`,
    input_schema: z.object({
      sailor_id: z.string(),
      participations: z.array(z.object({
        series_id: z.string().optional(),
        regatta_id: z.string().optional(),
        event_name: z.string(),
        participation_type: z.enum(['confirmed', 'interested', 'maybe']),
      })),
    }),
    execute: async (input) => {
      try {
        const participationRecords = input.participations.map(p => ({
          sailor_id: input.sailor_id,
          series_id: p.series_id,
          regatta_id: p.regatta_id,
          event_name: p.event_name,
          participation_type: p.participation_type,
          created_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from('sailor_racing_participation')
          .upsert(participationRecords);

        if (error) throw error;

        const eventNames = input.participations.map(p => p.event_name).join(', ');

        return {
          success: true,
          natural_language: `✅ Saved racing plans: ${eventNames}`,
        };
      } catch (error: any) {
        return {
          success: false,
          natural_language: `Error saving racing participation: ${error.message}`,
        };
      }
    },
  };
}

/**
 * Tool: Connect with other sailors
 */
export function createConnectWithSailorsTool(): AgentTool {
  return {
    name: 'connect_with_sailors',
    description: `Create connections with other sailors in fleets.
Establishes social network within RegattaFlow.`,
    input_schema: z.object({
      sailor_id: z.string(),
      connections: z.array(z.object({
        connected_sailor_id: z.string(),
        connection_type: z.enum(['friend', 'crew', 'competitor', 'coach']).default('friend'),
        notes: z.string().optional(),
      })),
    }),
    execute: async (input) => {
      try {
        const connectionRecords = input.connections.map(c => ({
          sailor_id: input.sailor_id,
          connected_sailor_id: c.connected_sailor_id,
          connection_type: c.connection_type,
          notes: c.notes,
          created_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from('sailor_connections')
          .upsert(connectionRecords);

        if (error) throw error;

        return {
          success: true,
          natural_language: `✅ Connected with ${input.connections.length} sailor${input.connections.length > 1 ? 's' : ''}!`,
        };
      } catch (error: any) {
        return {
          success: false,
          natural_language: `Error creating connections: ${error.message}`,
        };
      }
    },
  };
}
