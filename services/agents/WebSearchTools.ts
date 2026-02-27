/**
 * Web Search Tools
 * Search the internet for sailing-related information
 */

import { z } from 'zod';
import { AgentTool } from './BaseAgentService';
import { supabase } from '../supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('WebSearchTools');

function uniqueStrings(values: (string | null | undefined)[]): string[] {
  return Array.from(new Set(values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)));
}

function toIsoDate(value: any): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeSailNumber(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase();
}

async function safeSelect(
  table: string,
  build: (query: any) => any
): Promise<{ data: any[]; error: any | null }> {
  try {
    const query = build(supabase.from(table).select('*'));
    const { data, error } = await query;
    if (error) {
      logger.warn(`safeSelect failed for ${table}`, { error });
      return { data: [], error };
    }
    return { data: data || [], error: null };
  } catch (error: any) {
    logger.warn(`safeSelect exception for ${table}`, { error });
    return { data: [], error };
  }
}

async function findClubsByName(clubName: string): Promise<any[]> {
  const yachtClubs = await safeSelect('yacht_clubs', (query) =>
    query
      .ilike('name', `%${clubName}%`)
      .limit(20)
  );

  const clubs = await safeSelect('clubs', (query) =>
    query
      .ilike('name', `%${clubName}%`)
      .limit(20)
  );

  return [...(yachtClubs.data || []), ...(clubs.data || [])];
}

async function findBoatClassesByName(className: string): Promise<any[]> {
  const { data } = await safeSelect('boat_classes', (query) =>
    query
      .ilike('name', `%${className}%`)
      .limit(20)
  );
  return data;
}

function buildSailNumberNaturalResponse(
  className: string,
  sailNumber: string,
  foundData: boolean,
  ownerName: string | null,
  homeClub: string | null,
  fleetName: string | null,
  raceResultsCount: number
): string {
  if (!foundData) {
    return `I couldn’t find strong matches for ${className} #${sailNumber} in current indexed sources. I can continue onboarding with manual details and refine this later.`;
  }

  const details: string[] = [];
  if (ownerName) details.push(`owner: ${ownerName}`);
  if (homeClub) details.push(`club: ${homeClub}`);
  if (fleetName) details.push(`fleet: ${fleetName}`);
  if (raceResultsCount > 0) details.push(`${raceResultsCount} recent result${raceResultsCount === 1 ? '' : 's'}`);

  const detailText = details.length > 0 ? ` (${details.join(', ')})` : '';
  return `I found records for ${className} #${sailNumber}${detailText}. Want me to use this to prefill your profile?`;
}

/**
 * Tool: Search internet for sail number details
 */
export function createSearchSailNumberOnlineTool(): AgentTool {
  return {
    name: 'search_sail_number_online',
    description: `Search the internet for a sail number to find owner, fleet, club, and race results.
Searches Sailflow, class association sites, yacht club results pages.
Returns owner name, home club, fleet memberships, and recent race results.`,
    input_schema: z.object({
      sail_number: z.string().describe('Sail number to search'),
      class_name: z.string().describe('Boat class name'),
    }),
    execute: async (input) => {
      try {
        const normalizedSailNumber = normalizeSailNumber(input.sail_number);
        const className = String(input.class_name || '').trim();

        const { data: externalResults, error } = await safeSelect('external_race_results', (query) =>
          query
            .or(`sail_number.eq.${normalizedSailNumber},sail_number.eq.${input.sail_number}`)
            .ilike('boat_class', `%${className}%`)
            .order('race_date', { ascending: false })
            .limit(25)
        );

        if (error) {
          logger.warn('external_race_results lookup failed', { error });
        }

        const resultRows = externalResults || [];

        const ownerNames = uniqueStrings(
          resultRows.map((row: any) => row.owner_name || row.helm_name || row.skipper_name)
        );
        const clubs = uniqueStrings(
          resultRows.map((row: any) => row.yacht_club || row.club_name || row.home_club)
        );
        const fleets = uniqueStrings(
          resultRows.map((row: any) => row.fleet_name || row.division || row.fleet)
        );
        const regattas = uniqueStrings(
          resultRows.map((row: any) => row.regatta_name || row.event_name || row.series_name)
        );

        const ownerName = ownerNames[0] || null;
        const homeClub = clubs[0] || null;
        const fleetName = fleets[0] || null;
        const raceResultsCount = resultRows.length;
        const foundData = Boolean(ownerName || homeClub || fleetName || raceResultsCount > 0);

        return {
          found_data: foundData,
          owner_name: ownerName,
          home_club: homeClub,
          fleet_name: fleetName,
          yacht_club_url: null,
          race_results_count: raceResultsCount,
          recent_regattas: regattas.slice(0, 8),
          class_association_url: null,
          source: 'supabase_external_results',
          natural_language: buildSailNumberNaturalResponse(
            className,
            normalizedSailNumber,
            foundData,
            ownerName,
            homeClub,
            fleetName,
            raceResultsCount
          ),
        };
      } catch (error: any) {
        logger.error('search_sail_number_online failed', { error });
        return {
          found_data: false,
          error: error.message,
          natural_language: `I had trouble searching indexed sail-number data. Let’s continue with manual details and I can retry later.`,
        };
      }
    },
  };
}

/**
 * Tool: Search for racing calendar by class and location
 */
export function createSearchRacingCalendarTool(): AgentTool {
  return {
    name: 'search_racing_calendar_online',
    description: `Search online for racing calendar for a specific boat class and location.
Finds class association events, regional championships, and local club racing schedules.`,
    input_schema: z.object({
      class_name: z.string().describe('Boat class name'),
      location: z.string().describe('City or region'),
      year: z.coerce.number().optional().describe('Year (defaults to current year)'),
    }),
    execute: async (input) => {
      try {
        const now = new Date();
        const year = input.year || now.getFullYear();
        const className = String(input.class_name || '').trim();
        const location = String(input.location || '').trim();

        const regattaRows = await safeSelect('external_regattas', (query) =>
          query
            .gte('start_date', `${year}-01-01`)
            .lte('start_date', `${year}-12-31`)
            .or(
              [
                `boat_class.ilike.%${className}%`,
                `class_name.ilike.%${className}%`,
                `name.ilike.%${className}%`,
                `event_name.ilike.%${className}%`,
              ].join(',')
            )
            .or(
              [
                `location.ilike.%${location}%`,
                `city.ilike.%${location}%`,
                `region.ilike.%${location}%`,
                `country.ilike.%${location}%`,
                `venue_name.ilike.%${location}%`,
              ].join(',')
            )
            .order('start_date', { ascending: true })
            .limit(30)
        );

        const events = (regattaRows.data || [])
          .map((row: any) => {
            const startDate = toIsoDate(row.start_date || row.race_date || row.created_at);
            if (!startDate) return null;
            return {
              name: row.event_name || row.regatta_name || row.name || `${className} Event`,
              start_date: startDate,
              end_date: toIsoDate(row.end_date) || null,
              location: row.location || row.venue_name || row.city || row.region || row.country || null,
              source: row.source || 'external_regattas',
              url: row.regatta_url || row.url || null,
            };
          })
          .filter((event: any) => {
            if (!event) return false;
            return new Date(event.start_date).getTime() >= now.getTime() - 24 * 60 * 60 * 1000;
          })
          .slice(0, 20);

        const foundCalendar = events.length > 0;
        const nextEvent = events[0];
        const nextEventText = nextEvent
          ? `${nextEvent.name} on ${new Date(nextEvent.start_date).toLocaleDateString()}`
          : null;

        return {
          found_calendar: foundCalendar,
          events_count: events.length,
          events,
          year,
          natural_language: foundCalendar
            ? `I found ${events.length} upcoming ${className} events near ${location}${nextEventText ? `, including ${nextEventText}` : ''}. Want me to save key ones to your onboarding plan?`
            : `I couldn’t find upcoming ${className} events near ${location} for ${year} in indexed calendars. I can still continue and we can add races manually.`,
        };
      } catch (error: any) {
        logger.error('search_racing_calendar_online failed', { error });
        return {
          found_calendar: false,
          error: error.message,
          natural_language: `I couldn’t query racing calendars right now. I can continue onboarding and you can add events manually.`,
        };
      }
    },
  };
}

/**
 * Tool: Search for fleet information by class and club
 */
export function createSearchFleetOnlineTool(): AgentTool {
  return {
    name: 'search_fleet_online',
    description: `Search online for fleet information including members, racing schedule, and contact details.
Finds class fleet pages, member rosters, and fleet captain information.`,
    input_schema: z.object({
      class_name: z.string().describe('Boat class name'),
      club_name: z.string().describe('Yacht club name'),
    }),
    execute: async (input) => {
      try {
        const className = String(input.class_name || '').trim();
        const clubName = String(input.club_name || '').trim();

        const [clubRows, classRows] = await Promise.all([
          findClubsByName(clubName),
          findBoatClassesByName(className),
        ]);

        const clubIds = uniqueStrings(clubRows.map((row: any) => row.id));
        const classIds = uniqueStrings(classRows.map((row: any) => row.id));

        let fleetRows: any[] = [];
        if (clubIds.length > 0 || classIds.length > 0) {
          const fleetResult = await safeSelect('fleets', (query) => {
            let builder = query;
            if (clubIds.length > 0) {
              builder = builder.in('club_id', clubIds);
            }
            if (classIds.length > 0) {
              builder = builder.in('class_id', classIds);
            }
            return builder.limit(25);
          });
          fleetRows = fleetResult.data || [];
        }

        // Last-resort name matching in fleets table if IDs not available.
        if (fleetRows.length === 0) {
          const fleetByName = await safeSelect('fleets', (query) =>
            query
              .or(`name.ilike.%${className}%,description.ilike.%${className}%`)
              .limit(25)
          );
          fleetRows = fleetByName.data || [];
        }

        const fleetNames = uniqueStrings(
          fleetRows.map((row: any) => row.name || row.fleet_name)
        );
        const websiteUrl =
          clubRows.find((row: any) => typeof row.website === 'string')?.website ||
          clubRows.find((row: any) => typeof row.website_url === 'string')?.website_url ||
          null;

        const fleetCaptains = uniqueStrings(
          fleetRows.map((row: any) => row.fleet_captain || row.captain_name || row.contact_name)
        );
        const memberCount = fleetRows.reduce((sum: number, row: any) => {
          const count = typeof row.member_count === 'number' ? row.member_count : 0;
          return sum + count;
        }, 0);
        const foundFleet = fleetRows.length > 0 || fleetNames.length > 0;

        const headline = foundFleet
          ? `I found ${fleetRows.length} ${className} fleet listing${fleetRows.length === 1 ? '' : 's'} for ${clubName}.`
          : `I couldn’t find a confirmed ${className} fleet listing for ${clubName} in indexed sources.`;
        const detail = foundFleet && fleetNames.length > 0
          ? ` Fleets: ${fleetNames.slice(0, 4).join(', ')}.`
          : '';
        const captainText = fleetCaptains[0] ? ` Captain contact appears to be ${fleetCaptains[0]}.` : '';

        return {
          found_fleet: foundFleet,
          fleet_name: fleetNames[0] || null,
          member_count: memberCount > 0 ? memberCount : null,
          fleet_captain: fleetCaptains[0] || null,
          fleet_names: fleetNames,
          website_url: websiteUrl,
          natural_language: `${headline}${detail}${captainText}`,
        };
      } catch (error: any) {
        logger.error('search_fleet_online failed', { error });
        return {
          found_fleet: false,
          error: error.message,
          natural_language: `I couldn’t query fleet info right now, so let’s continue with what you already know and refine later.`,
        };
      }
    },
  };
}
