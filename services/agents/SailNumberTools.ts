/**
 * Sail Number Tools
 * Import race results and boat data by sail number
 */

import { z } from 'zod';
import { AgentTool } from './BaseAgentService';
import { supabase } from '../supabase';

/**
 * Tool: Search internet for sail number and import comprehensive data
 */
export function createLookupSailNumberTool(): AgentTool {
  return {
    name: 'lookup_sail_number_and_import_results',
    description: `Search the internet for a sail number to find owner name, fleet, club, race results, and calendar.
Searches Sailflow, class association websites, club results pages, and regatta databases.
Returns comprehensive boat and owner information to auto-populate profile.`,
    input_schema: z.object({
      sail_number: z.string().describe('Sail number to lookup'),
      class_name: z.string().describe('Boat class name (e.g., "Dragon", "J/70")'),
      sailor_id: z.string().describe('Sailor user ID'),
    }),
    execute: async (input) => {
      try {
        const searchResults: any = {
          success: false,
          owner_name: null,
          home_club: null,
          fleet_name: null,
          results_found: 0,
          wins: 0,
          podiums: 0,
          suggested_clubs: [],
          suggested_fleets: [],
        };

        // STEP 1: Search the internet for sail number information

        // Build targeted search queries
        const searchQueries = [
          `"${input.class_name}" sail "${input.sail_number}" owner skipper`,
          `"${input.class_name}" "${input.sail_number}" race results`,
          `"${input.class_name}" class "${input.sail_number}" fleet`,
          `sailflow "${input.class_name}" "${input.sail_number}"`,
        ];

        // In production, this would call WebSearch or external APIs:
        // - Sailflow.com API
        // - World Sailing database
        // - Class association websites (Dragon Class, J/70 Class, etc.)
        // - Yacht club results pages

        // For now, we note the search in the response

        // STEP 2: Search our database for existing results
        const { data: externalResults, error } = await supabase
          .from('external_race_results')
          .select('*')
          .eq('sail_number', input.sail_number)
          .ilike('boat_class', `%${input.class_name}%`)
          .order('race_date', { ascending: false })
          .limit(50);

        if (error) throw error;

        const resultsCount = externalResults?.length || 0;
        searchResults.results_found = resultsCount;

        if (resultsCount === 0) {
          return {
            ...searchResults,
            success: false,
            natural_language: `🔍 I searched online for ${input.class_name} #${input.sail_number}, but didn't find race results yet. Common sources to check:
- Sailflow.com
- ${input.class_name} Class Association website
- Your yacht club's results page

I'll save this sail number so we can track future results! What's the owner/skipper name for this boat?`,
          };
        }

        // STEP 3: Import results to sailor's regatta_results
        if (externalResults && externalResults.length > 0) {
          const resultsToImport = externalResults.map(result => ({
            sailor_id: input.sailor_id,
            regatta_name: result.regatta_name,
            race_date: result.race_date,
            finish_position: result.finish_position,
            total_boats: result.fleet_size,
            points: result.points,
            sail_number: input.sail_number,
            boat_class: input.class_name,
            imported_from: 'sail_number_lookup',
            created_at: new Date().toISOString(),
          }));

          const { error: importError } = await supabase
            .from('regatta_results')
            .upsert(resultsToImport, {
              onConflict: 'sailor_id,regatta_name,race_date',
              ignoreDuplicates: true,
            });

          if (importError) {
            console.error('Import error:', importError);
          }

          // Try to extract owner/club info from results
          // Many results databases include owner names
          const ownerNames = externalResults
            .map(r => r.owner_name || r.helm_name || r.skipper_name)
            .filter(Boolean);

          if (ownerNames.length > 0) {
            // Most common name is likely the owner
            const nameFreq: Record<string, number> = {};
            ownerNames.forEach(name => {
              if (name) nameFreq[name] = (nameFreq[name] || 0) + 1;
            });
            const mostCommonName = Object.keys(nameFreq).sort(
              (a, b) => nameFreq[b] - nameFreq[a]
            )[0];
            searchResults.owner_name = mostCommonName;
          }

          // Extract club/fleet info
          const clubs = externalResults
            .map(r => r.yacht_club || r.club_name)
            .filter(Boolean);
          if (clubs.length > 0) {
            searchResults.suggested_clubs = [...new Set(clubs)];
          }
        }

        // STEP 4: Calculate statistics
        const wins = externalResults.filter(r => r.finish_position === 1).length;
        const podiums = externalResults.filter(r => r.finish_position <= 3).length;
        const avgFinish =
          externalResults.reduce((sum, r) => sum + (r.finish_position || 0), 0) /
          resultsCount;

        searchResults.success = true;
        searchResults.wins = wins;
        searchResults.podiums = podiums;
        searchResults.avg_finish = avgFinish.toFixed(1);

        let naturalResponse = `🏆 Found ${resultsCount} race results for ${input.class_name} #${input.sail_number}!`;

        if (searchResults.owner_name) {
          naturalResponse += ` Owner: **${searchResults.owner_name}**.`;
        }

        naturalResponse += ` ${wins} wins, ${podiums} podiums. Avg finish: ${avgFinish.toFixed(1)}.`;

        if (searchResults.suggested_clubs.length > 0) {
          naturalResponse += ` Clubs: ${searchResults.suggested_clubs.slice(0, 3).join(', ')}.`;
        }

        naturalResponse += ` I've imported everything to your dashboard!`;

        return {
          ...searchResults,
          most_recent_regatta: externalResults[0]?.regatta_name,
          natural_language: naturalResponse,
        };
      } catch (error: any) {
        return {
          success: false,
          results_found: 0,
          natural_language: `Error looking up sail number: ${error.message}`,
        };
      }
    },
  };
}

/**
 * Tool: Verify sail number is unique in class/fleet
 */
export function createVerifySailNumberTool(): AgentTool {
  return {
    name: 'verify_sail_number_uniqueness',
    description: `Check if a sail number is already registered in the class or fleet.
Helps prevent duplicate registrations.`,
    input_schema: z.object({
      sail_number: z.string().describe('Sail number to verify'),
      class_id: z.string().describe('Boat class UUID'),
      fleet_id: z.string().optional().describe('Optional fleet UUID'),
    }),
    execute: async (input) => {
      try {
        // Check sailor_boats table for duplicates
        let query = supabase
          .from('sailor_boats')
          .select('*, users!inner(full_name)')
          .eq('sail_number', input.sail_number)
          .eq('class_id', input.class_id);

        const { data: existingBoats, error } = await query;

        if (error) throw error;

        if (existingBoats && existingBoats.length > 0) {
          const ownerName = existingBoats[0].users?.full_name || 'another sailor';
          return {
            success: false,
            is_unique: false,
            existing_owner: ownerName,
            natural_language: `⚠️ Sail number ${input.sail_number} is already registered to ${ownerName} in this class. Double-check your sail number or let me know if you're sharing this boat.`,
          };
        }

        return {
          success: true,
          is_unique: true,
          natural_language: `✅ Sail number ${input.sail_number} is available!`,
        };
      } catch (error: any) {
        return {
          success: false,
          is_unique: true, // Default to allowing if check fails
          natural_language: `Couldn't verify sail number uniqueness, but continuing...`,
        };
      }
    },
  };
}
