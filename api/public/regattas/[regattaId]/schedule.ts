/**
 * Public Schedule API
 * Returns race schedule for a regatta - NO AUTH REQUIRED
 * 
 * GET /api/public/regattas/[regattaId]/schedule
 * 
 * Query params:
 *   - date: Filter by specific date (YYYY-MM-DD)
 */

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface ScheduledRace {
  id: string;
  race_number: number;
  division: string | null;
  scheduled_start: string;
  warning_signal: string | null;
  course_type: string | null;
  course_description: string | null;
  status: 'scheduled' | 'postponed' | 'abandoned' | 'completed' | 'in_progress';
  postponement_reason: string | null;
  new_start_time: string | null;
}

export interface ScheduleDay {
  date: string;
  day_name: string;
  races: ScheduledRace[];
  weather_forecast: {
    wind_speed: number | null;
    wind_direction: string | null;
    conditions: string | null;
  } | null;
  special_notices: string[];
}

export interface PublicScheduleResponse {
  regatta: {
    id: string;
    name: string;
    start_date: string;
    end_date: string | null;
    venue: string | null;
    club_name: string | null;
  };
  schedule: ScheduleDay[];
  metadata: {
    total_races: number;
    races_completed: number;
    last_updated: string;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for public access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { regattaId } = req.query;
  const dateFilter = req.query.date as string | undefined;

  if (!regattaId || typeof regattaId !== 'string') {
    return res.status(400).json({ error: 'Missing regattaId parameter' });
  }

  try {
    // Fetch regatta info
    const { data: regatta, error: regattaError } = await supabase
      .from('regattas')
      .select(`
        id,
        name,
        start_date,
        end_date,
        venue,
        updated_at,
        clubs (
          club_name
        )
      `)
      .eq('id', regattaId)
      .single();

    if (regattaError || !regatta) {
      return res.status(404).json({ error: 'Regatta not found' });
    }

    // Fetch scheduled races
    let racesQuery = supabase
      .from('race_events')
      .select(`
        id,
        race_number,
        division,
        event_date,
        start_time,
        warning_signal,
        course_type,
        course_description,
        status,
        postponement_reason,
        new_start_time
      `)
      .eq('regatta_id', regattaId)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (dateFilter) {
      racesQuery = racesQuery.eq('event_date', dateFilter);
    }

    const { data: races, error: racesError } = await racesQuery;

    if (racesError) {
      console.error('Error fetching schedule:', racesError);
      return res.status(500).json({ error: 'Failed to fetch schedule' });
    }

    // Group races by date
    const dateMap = new Map<string, ScheduleDay>();
    
    (races || []).forEach((race: any) => {
      const dateKey = race.event_date || regatta.start_date;
      
      if (!dateMap.has(dateKey)) {
        const date = new Date(dateKey);
        dateMap.set(dateKey, {
          date: dateKey,
          day_name: date.toLocaleDateString('en-US', { weekday: 'long' }),
          races: [],
          weather_forecast: null,
          special_notices: [],
        });
      }
      
      const day = dateMap.get(dateKey)!;
      day.races.push({
        id: race.id,
        race_number: race.race_number,
        division: race.division,
        scheduled_start: race.start_time || race.warning_signal,
        warning_signal: race.warning_signal,
        course_type: race.course_type,
        course_description: race.course_description,
        status: race.status || 'scheduled',
        postponement_reason: race.postponement_reason,
        new_start_time: race.new_start_time,
      });
    });

    const schedule = Array.from(dateMap.values());

    // Count completed races
    const completedCount = (races || []).filter((r: any) => r.status === 'completed').length;

    const response: PublicScheduleResponse = {
      regatta: {
        id: regatta.id,
        name: regatta.name,
        start_date: regatta.start_date,
        end_date: regatta.end_date,
        venue: regatta.venue,
        club_name: (regatta.clubs as any)?.club_name || null,
      },
      schedule,
      metadata: {
        total_races: (races || []).length,
        races_completed: completedCount,
        last_updated: regatta.updated_at || new Date().toISOString(),
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Public schedule API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

