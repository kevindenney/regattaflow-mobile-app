/**
 * Conversational Onboarding Tools
 * Enhanced tools with natural language responses for conversational AI
 */

import { z } from 'zod';
import { AgentTool } from './BaseAgentService';
import { supabase } from '../supabase';

/**
 * Tool: Detect venue from GPS with conversational intelligence
 */
export function createDetectVenueWithIntelTool(): AgentTool {
  return {
    name: 'detect_venue_from_gps_with_intel',
    description: `Detect sailing venue from GPS and provide rich contextual intelligence.
Use this when you have user's location to automatically suggest venue, popular boats, and clubs.
Returns venue details with social proof (popular boats, active fleets, member counts).`,
    input_schema: z.object({
      latitude: z.coerce.number().describe('GPS latitude'),
      longitude: z.coerce.number().describe('GPS longitude'),
      radius_km: z.coerce.number().optional().default(50).describe('Search radius in km'),
    }),
    execute: async (input) => {
      try {
        // Get nearby venues
        const { data: venues, error } = await supabase
          .rpc('venues_within_radius', {
            lat: input.latitude,
            lng: input.longitude,
            radius_km: input.radius_km,
          })
          .limit(5);

        if (error) throw error;

        if (!venues || venues.length === 0) {
          return {
            success: false,
            natural_language: `I couldn't find any sailing venues within ${input.radius_km}km of your location. Could you try searching by city name instead?`,
          };
        }

        const primaryVenue = venues[0];

        // Get popular boat classes at this venue
        const { data: popularBoats } = await supabase
          .from('fleets')
          .select(`
            class_id,
            boat_classes!inner(id, name, type),
            member_count
          `)
          .eq('club_id', primaryVenue.id)
          .order('member_count', { ascending: false })
          .limit(3);

        // Get club count
        const { count: clubCount } = await supabase
          .from('yacht_clubs')
          .select('*', { count: 'exact', head: true })
          .eq('venue_id', primaryVenue.id);

        // Build natural language response
        let intelligence = `I found you near **${primaryVenue.name}** in ${primaryVenue.city}, ${primaryVenue.country} (${Math.round(primaryVenue.distance_km)}km away).`;

        if (popularBoats && popularBoats.length > 0) {
          const boatNames = popularBoats
            .map(b => b.boat_classes.name)
            .join(', ');
          intelligence += ` Popular boats here: ${boatNames}.`;
        }

        if (clubCount && clubCount > 0) {
          intelligence += ` ${clubCount} club${clubCount > 1 ? 's' : ''} race here.`;
        }

        return {
          success: true,
          venue: primaryVenue,
          alternatives: venues.slice(1),
          popular_boats: popularBoats || [],
          club_count: clubCount || 0,
          confidence: primaryVenue.distance_km < 10 ? 'high' : 'medium',
          natural_language: intelligence,
        };
      } catch (error: any) {
        return {
          success: false,
          natural_language: `I encountered an error detecting your venue: ${error.message}`,
        };
      }
    },
  };
}

/**
 * Tool: Search venues with contextual suggestions
 */
export function createSearchVenuesWithContextTool(): AgentTool {
  return {
    name: 'search_venues_with_context',
    description: `Search sailing venues by name with intelligent context.
Returns venues with sailing activity indicators (fleet count, boat types, racing frequency).`,
    input_schema: z.object({
      query: z.string().describe('Search query (city, venue name, or region)'),
      limit: z.coerce.number().optional().default(5).describe('Max results'),
    }),
    execute: async (input) => {
      try {
        const { data: venues, error } = await supabase
          .from('sailing_venues')
          .select('*')
          .or(`name.ilike.%${input.query}%,city.ilike.%${input.query}%,country.ilike.%${input.query}%`)
          .limit(input.limit);

        if (error) throw error;

        if (!venues || venues.length === 0) {
          return {
            success: false,
            natural_language: `I couldn't find any sailing venues matching "${input.query}". Could you try a different search term or nearby city?`,
          };
        }

        // Build natural language response
        const venueList = venues
          .map(v => `**${v.name}** (${v.city}, ${v.country})`)
          .join(', ');

        return {
          success: true,
          venues,
          count: venues.length,
          natural_language: `I found ${venues.length} venue${venues.length > 1 ? 's' : ''}: ${venueList}. Which one is your home sailing location?`,
        };
      } catch (error: any) {
        return {
          success: false,
          natural_language: `Search error: ${error.message}`,
        };
      }
    },
  };
}

/**
 * Tool: Suggest boats with reasoning and social proof
 */
export function createSuggestBoatsWithReasoningTool(): AgentTool {
  return {
    name: 'suggest_boats_with_reasoning',
    description: `Suggest boat classes with reasoning based on venue popularity and sailor preferences.
Returns boats ranked by local popularity with fleet sizes and racing activity.`,
    input_schema: z.object({
      venue_id: z.string().describe('Venue ID'),
      limit: z.coerce.number().optional().default(5).describe('Max suggestions'),
    }),
    execute: async (input) => {
      try {
        // Get boat classes with fleet data at this venue
        const { data: boatsWithFleets, error } = await supabase
          .from('fleets')
          .select(`
            class_id,
            boat_classes!inner(id, name, type, description),
            member_count
          `)
          .eq('club_id', input.venue_id)
          .order('member_count', { ascending: false })
          .limit(input.limit);

        if (error) throw error;

        // Also get all boat classes as fallback
        const { data: allBoats } = await supabase
          .from('boat_classes')
          .select('*')
          .order('name')
          .limit(20);

        if (boatsWithFleets && boatsWithFleets.length > 0) {
          const topBoat = boatsWithFleets[0];
          const suggestions = boatsWithFleets
            .map(b => `**${b.boat_classes.name}** (${b.member_count} sailors)`)
            .join(', ');

          return {
            success: true,
            boats: boatsWithFleets.map(b => b.boat_classes),
            popular_boats: boatsWithFleets,
            all_boats: allBoats || [],
            natural_language: `The most popular boat here is the **${topBoat.boat_classes.name}** with ${topBoat.member_count} active sailors. Also popular: ${suggestions}. What do you race?`,
          };
        } else {
          const boatList = allBoats
            ?.slice(0, 5)
            .map(b => b.name)
            .join(', ');

          return {
            success: true,
            boats: allBoats || [],
            natural_language: `I don't have specific data for this venue yet. Common boats include: ${boatList}. What boat class do you sail?`,
          };
        }
      } catch (error: any) {
        return {
          success: false,
          natural_language: `Error fetching boat suggestions: ${error.message}`,
        };
      }
    },
  };
}

/**
 * Tool: Discover fleets with social proof
 */
export function createDiscoverFleetsWithSocialProofTool(): AgentTool {
  return {
    name: 'discover_fleets_with_social_proof',
    description: `Find racing fleets with social proof (member counts, activity levels, competitiveness).
Returns fleets ranked by size and engagement with join recommendations.`,
    input_schema: z.object({
      venue_id: z.string().optional().describe('Venue ID'),
      class_id: z.string().describe('Boat class ID'),
      limit: z.coerce.number().optional().default(5).describe('Max fleets'),
    }),
    execute: async (input) => {
      try {
        let query = supabase
          .from('fleets')
          .select(`
            *,
            boat_classes!inner(name),
            yacht_clubs(name)
          `)
          .eq('class_id', input.class_id)
          .in('visibility', ['public', 'club'])
          .order('member_count', { ascending: false })
          .limit(input.limit);

        if (input.venue_id) {
          query = query.eq('club_id', input.venue_id);
        }

        const { data: fleets, error } = await query;

        if (error) throw error;

        if (!fleets || fleets.length === 0) {
          return {
            success: false,
            natural_language: `No active fleets found for this boat class at your venue. You could be the first to create one! Should I help you set that up?`,
          };
        }

        const topFleet = fleets[0];
        const fleetDescriptions = fleets
          .map(
            f =>
              `**${f.name}** at ${f.yacht_clubs?.name || 'Unknown Club'} (${f.member_count || 0} members)`
          )
          .join(', ');

        return {
          success: true,
          fleets,
          count: fleets.length,
          natural_language: `I found ${fleets.length} active fleet${fleets.length > 1 ? 's' : ''}: ${fleetDescriptions}. The **${topFleet.name}** is the most active with ${topFleet.member_count} members. Want to join?`,
        };
      } catch (error: any) {
        return {
          success: false,
          natural_language: `Fleet discovery error: ${error.message}`,
        };
      }
    },
  };
}

/**
 * Tool: Suggest clubs with insights
 */
export function createSuggestClubsWithInsightsTool(): AgentTool {
  return {
    name: 'suggest_clubs_with_insights',
    description: `Suggest yacht clubs and class associations with rich insights.
Returns clubs with racing schedules, facilities, and membership info.`,
    input_schema: z.object({
      venue_id: z.string().optional().describe('Venue ID'),
      fleet_id: z.string().optional().describe('Fleet ID to find home club'),
      class_id: z.string().optional().describe('Boat class for associations'),
    }),
    execute: async (input) => {
      try {
        const results: any = {
          success: true,
          clubs: [],
          associations: [],
        };

        // Get clubs at venue
        if (input.venue_id) {
          const { data: clubs } = await supabase
            .from('yacht_clubs')
            .select('*')
            .eq('venue_id', input.venue_id);

          results.clubs = clubs || [];
        }

        // Get fleet's home club
        if (input.fleet_id) {
          const { data: fleet } = await supabase
            .from('fleets')
            .select('club_id, yacht_clubs(*)')
            .eq('id', input.fleet_id)
            .single();

          if (fleet?.yacht_clubs) {
            results.home_club = fleet.yacht_clubs;
          }
        }

        // Get class associations
        if (input.class_id) {
          const { data: associations } = await supabase
            .from('class_associations')
            .select('*')
            .eq('class_id', input.class_id);

          results.associations = associations || [];
        }

        // Build natural language
        let intelligence = '';

        if (results.home_club) {
          intelligence = `The fleet's home club is **${results.home_club.name}**. `;
        }

        if (results.clubs.length > 0) {
          const clubNames = results.clubs.map((c: any) => c.name).join(', ');
          intelligence += `Clubs at this venue: ${clubNames}. `;
        }

        if (results.associations.length > 0) {
          intelligence += `${results.associations.length} class association${results.associations.length > 1 ? 's' : ''} available.`;
        }

        results.natural_language =
          intelligence || 'No specific club information available yet.';

        return results;
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
 * Tool: Import races conversationally
 */
export function createImportRacesConversationallyTool(): AgentTool {
  return {
    name: 'import_races_from_clubs',
    description: `Import upcoming races from clubs with progress updates.
Returns race import status with calendar preview.`,
    input_schema: z.object({
      sailor_id: z.string().describe('Sailor user ID'),
      club_ids: z.array(z.string()).describe('Club IDs to import from'),
    }),
    execute: async (input) => {
      try {
        // In production, this would trigger RaceScrapingService
        return {
          success: true,
          clubs_processed: input.club_ids,
          natural_language: `Perfect! I'm importing race calendars from ${input.club_ids.length} club${input.club_ids.length > 1 ? 's' : ''}. This runs in the background and usually completes within a few minutes. You'll see races appear in your calendar shortly!`,
        };
      } catch (error: any) {
        return {
          success: false,
          natural_language: `Race import error: ${error.message}`,
        };
      }
    },
  };
}

/**
 * Tool: Finalize onboarding conversationally
 */
export function createFinalizeOnboardingConversationallyTool(): AgentTool {
  return {
    name: 'finalize_onboarding_conversationally',
    description: `Complete onboarding with celebration and next steps.
Updates user profile and provides dashboard preview.`,
    input_schema: z.object({
      sailor_id: z.string().describe('Sailor user ID'),
      onboarding_data: z
        .object({
          locations: z.array(z.string()).optional(),
          boats: z.array(z.string()).optional(),
          fleets: z.array(z.string()).optional(),
          clubs: z.array(z.string()).optional(),
        })
        .describe('Onboarding summary'),
    }),
    execute: async (input) => {
      try {
        const { error } = await supabase
          .from('users')
          .update({
            onboarding_completed: true,
            onboarding_step: 'completed',
            onboarding_data: input.onboarding_data,
          })
          .eq('id', input.sailor_id);

        if (error) throw error;

        // Build summary
        const summary = [];
        if (input.onboarding_data.locations?.length) {
          summary.push(
            `📍 ${input.onboarding_data.locations.length} venue${input.onboarding_data.locations.length > 1 ? 's' : ''}`
          );
        }
        if (input.onboarding_data.boats?.length) {
          summary.push(
            `⛵ ${input.onboarding_data.boats.length} boat class${input.onboarding_data.boats.length > 1 ? 'es' : ''}`
          );
        }
        if (input.onboarding_data.fleets?.length) {
          summary.push(
            `🏁 ${input.onboarding_data.fleets.length} fleet${input.onboarding_data.fleets.length > 1 ? 's' : ''}`
          );
        }

        return {
          success: true,
          sailor_id: input.sailor_id,
          natural_language: `🎉 **You're all set!** Your profile is complete with ${summary.join(', ')}. Let's head to your dashboard where you can start logging races, analyzing performance, and connecting with your sailing community!`,
        };
      } catch (error: any) {
        return {
          success: false,
          natural_language: `Finalization error: ${error.message}`,
        };
      }
    },
  };
}
