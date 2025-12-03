/**
 * Public Results API
 * Returns race results for a regatta - NO AUTH REQUIRED
 * 
 * GET /api/public/regattas/[regattaId]/results
 * 
 * Query params:
 *   - division: Filter by division
 *   - race: Filter by specific race number
 *   - format: 'json' (default) | 'csv'
 */

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface PublicRegattaResult {
  regatta: {
    id: string;
    name: string;
    start_date: string;
    end_date: string | null;
    venue: string | null;
    club_name: string | null;
    status: string;
    results_published: boolean;
    results_published_at: string | null;
  };
  races: PublicRaceResult[];
  standings: PublicStanding[];
  metadata: {
    total_entries: number;
    races_completed: number;
    last_updated: string;
  };
}

export interface PublicRaceResult {
  race_number: number;
  race_date: string | null;
  division: string | null;
  results: {
    position: number;
    sail_number: string;
    boat_name: string | null;
    skipper_name: string | null;
    elapsed_time: string | null;
    corrected_time: string | null;
    points: number;
    status: string;
  }[];
}

export interface PublicStanding {
  position: number;
  sail_number: string;
  boat_name: string | null;
  skipper_name: string | null;
  division: string | null;
  total_points: number;
  net_points: number;
  races_sailed: number;
  discards: number[];
  race_results: { race: number; points: number; discarded: boolean }[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for public access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { regattaId } = req.query;
  const division = req.query.division as string | undefined;
  const raceNumber = req.query.race ? parseInt(req.query.race as string) : undefined;
  const format = (req.query.format as string) || 'json';

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
        status,
        results_published,
        results_published_at,
        clubs (
          club_name
        )
      `)
      .eq('id', regattaId)
      .single();

    if (regattaError || !regatta) {
      return res.status(404).json({ error: 'Regatta not found' });
    }

    // Check if results are published (public visibility)
    if (!regatta.results_published && regatta.status !== 'completed') {
      return res.status(403).json({ 
        error: 'Results not yet published',
        regatta: {
          id: regatta.id,
          name: regatta.name,
          status: regatta.status,
        }
      });
    }

    // Fetch race results
    let resultsQuery = supabase
      .from('race_results')
      .select(`
        id,
        race_number,
        position,
        sail_number,
        elapsed_time,
        corrected_time,
        points,
        status,
        division,
        race_entries (
          boat_name,
          skipper_name
        )
      `)
      .eq('regatta_id', regattaId)
      .order('race_number', { ascending: true })
      .order('position', { ascending: true });

    if (division) {
      resultsQuery = resultsQuery.eq('division', division);
    }

    if (raceNumber) {
      resultsQuery = resultsQuery.eq('race_number', raceNumber);
    }

    const { data: results, error: resultsError } = await resultsQuery;

    if (resultsError) {
      console.error('Error fetching results:', resultsError);
      return res.status(500).json({ error: 'Failed to fetch results' });
    }

    // Fetch series standings
    const { data: standings, error: standingsError } = await supabase
      .from('series_standings')
      .select(`
        position,
        sail_number,
        boat_name,
        skipper_name,
        division,
        total_points,
        net_points,
        races_sailed,
        discards,
        race_points
      `)
      .eq('regatta_id', regattaId)
      .order('position', { ascending: true });

    // Group results by race
    const raceMap = new Map<number, PublicRaceResult>();
    
    (results || []).forEach((result: any) => {
      if (!raceMap.has(result.race_number)) {
        raceMap.set(result.race_number, {
          race_number: result.race_number,
          race_date: null,
          division: result.division,
          results: [],
        });
      }
      
      const race = raceMap.get(result.race_number)!;
      race.results.push({
        position: result.position,
        sail_number: result.sail_number,
        boat_name: result.race_entries?.boat_name || null,
        skipper_name: result.race_entries?.skipper_name || null,
        elapsed_time: result.elapsed_time,
        corrected_time: result.corrected_time,
        points: result.points,
        status: result.status,
      });
    });

    const races = Array.from(raceMap.values());

    // Format standings
    const formattedStandings: PublicStanding[] = (standings || []).map((s: any) => ({
      position: s.position,
      sail_number: s.sail_number,
      boat_name: s.boat_name,
      skipper_name: s.skipper_name,
      division: s.division,
      total_points: s.total_points,
      net_points: s.net_points,
      races_sailed: s.races_sailed,
      discards: s.discards || [],
      race_results: (s.race_points || []).map((points: number, idx: number) => ({
        race: idx + 1,
        points,
        discarded: (s.discards || []).includes(idx + 1),
      })),
    }));

    const response: PublicRegattaResult = {
      regatta: {
        id: regatta.id,
        name: regatta.name,
        start_date: regatta.start_date,
        end_date: regatta.end_date,
        venue: regatta.venue,
        club_name: (regatta.clubs as any)?.club_name || null,
        status: regatta.status,
        results_published: regatta.results_published,
        results_published_at: regatta.results_published_at,
      },
      races,
      standings: formattedStandings,
      metadata: {
        total_entries: formattedStandings.length,
        races_completed: races.length,
        last_updated: regatta.results_published_at || new Date().toISOString(),
      },
    };

    // Return CSV format if requested
    if (format === 'csv') {
      const csv = generateCSV(response);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${regatta.name.replace(/[^a-z0-9]/gi, '_')}_results.csv"`);
      return res.status(200).send(csv);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Public results API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function generateCSV(data: PublicRegattaResult): string {
  const lines: string[] = [];
  
  // Header
  lines.push(`"${data.regatta.name} - Results"`);
  lines.push(`"Venue: ${data.regatta.venue || 'N/A'}"`);
  lines.push(`"Date: ${data.regatta.start_date}"`);
  lines.push('');
  
  // Series standings
  lines.push('"Series Standings"');
  lines.push('"Pos","Sail #","Boat","Skipper","Net Points","Total Points","Races"');
  
  data.standings.forEach(s => {
    lines.push(`${s.position},"${s.sail_number}","${s.boat_name || ''}","${s.skipper_name || ''}",${s.net_points},${s.total_points},${s.races_sailed}`);
  });
  
  lines.push('');
  
  // Individual race results
  data.races.forEach(race => {
    lines.push(`"Race ${race.race_number}"`);
    lines.push('"Pos","Sail #","Boat","Status","Points"');
    race.results.forEach(r => {
      lines.push(`${r.position},"${r.sail_number}","${r.boat_name || ''}","${r.status}",${r.points}`);
    });
    lines.push('');
  });
  
  return lines.join('\n');
}

