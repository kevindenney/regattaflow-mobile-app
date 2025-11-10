/**
 * Refresh Race Suggestions Edge Function
 * Runs daily to pre-compute race suggestions for active users
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RefreshStats {
  totalUsers: number;
  successCount: number;
  errorCount: number;
  totalSuggestions: number;
  processingTimeMs: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats: RefreshStats = {
    totalUsers: 0,
    successCount: 0,
    errorCount: 0,
    totalSuggestions: 0,
    processingTimeMs: 0,
  };

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[RefreshSuggestions] Starting refresh job...');

    // Get active users (users who have club or fleet memberships)
    const { data: clubMembers } = await supabase
      .from('club_members')
      .select('user_id')
      .eq('is_active', true);

    const { data: fleetMembers } = await supabase
      .from('fleet_members')
      .select('user_id')
      .eq('status', 'active');

    // Combine unique user IDs
    const userIds = new Set<string>();
    clubMembers?.forEach(m => userIds.add(m.user_id));
    fleetMembers?.forEach(m => userIds.add(m.user_id));

    const activeUsers = Array.from(userIds).map(id => ({ id })).slice(0, 1000);

    if (activeUsers.length === 0) {
      console.log('[RefreshSuggestions] No active users found');
      return new Response(
        JSON.stringify({ success: true, stats, message: 'No active users to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const usersError = null; // No error since we're not using .or() anymore

    if (usersError) {
      throw new Error(`Failed to fetch active users: ${usersError.message}`);
    }

    stats.totalUsers = activeUsers?.length || 0;
    console.log(`[RefreshSuggestions] Found ${stats.totalUsers} active users`);

    if (!activeUsers || activeUsers.length === 0) {
      console.log('[RefreshSuggestions] No active users to process');
      return new Response(
        JSON.stringify({ success: true, stats, message: 'No active users to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean up expired suggestions first
    const { data: cleanupResult } = await supabase.rpc('clean_expired_suggestions');
    console.log(`[RefreshSuggestions] Cleaned up ${cleanupResult || 0} expired suggestions`);

    // Process each user
    for (const user of activeUsers) {
      try {
        const userId = user.id;
        console.log(`[RefreshSuggestions] Processing user: ${userId}`);

        // Delete existing non-expired suggestions for this user
        await supabase
          .from('race_suggestions_cache')
          .delete()
          .eq('user_id', userId)
          .is('dismissed_at', null)
          .is('accepted_at', null);

        // Generate new suggestions
        const suggestions = await generateSuggestionsForUser(supabase, userId);

        if (suggestions.length > 0) {
          // Insert new suggestions
          const { error: insertError } = await supabase
            .from('race_suggestions_cache')
            .insert(suggestions);

          if (insertError) {
            console.error(`[RefreshSuggestions] Error inserting suggestions for user ${userId}:`, insertError);
            stats.errorCount++;
          } else {
            stats.successCount++;
            stats.totalSuggestions += suggestions.length;
            console.log(`[RefreshSuggestions] Generated ${suggestions.length} suggestions for user ${userId}`);
          }
        } else {
          stats.successCount++;
          console.log(`[RefreshSuggestions] No suggestions generated for user ${userId}`);
        }
      } catch (userError) {
        console.error(`[RefreshSuggestions] Error processing user ${user.id}:`, userError);
        stats.errorCount++;
      }
    }

    stats.processingTimeMs = Date.now() - startTime;

    console.log('[RefreshSuggestions] Job complete:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        message: `Processed ${stats.successCount} users successfully, ${stats.errorCount} errors`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[RefreshSuggestions] Fatal error:', error);

    stats.processingTimeMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stats,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Generate suggestions for a specific user
 */
async function generateSuggestionsForUser(supabase: any, userId: string): Promise<any[]> {
  const suggestions: any[] = [];
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // Cache for 24 hours

  try {
    // 1. Get club race suggestions
    const clubSuggestions = await getClubRaceSuggestions(supabase, userId, expiresAt);
    suggestions.push(...clubSuggestions);

    // 2. Get fleet race suggestions
    const fleetSuggestions = await getFleetRaceSuggestions(supabase, userId, expiresAt);
    suggestions.push(...fleetSuggestions);

    // 3. Get pattern-based suggestions
    const patternSuggestions = await getPatternSuggestions(supabase, userId, expiresAt);
    suggestions.push(...patternSuggestions);

    return suggestions;
  } catch (error) {
    console.error(`[generateSuggestionsForUser] Error for user ${userId}:`, error);
    return suggestions; // Return partial results
  }
}

/**
 * Get club race suggestions
 */
async function getClubRaceSuggestions(
  supabase: any,
  userId: string,
  expiresAt: Date
): Promise<any[]> {
  const suggestions: any[] = [];

  // Get user's clubs
  const { data: memberships } = await supabase
    .from('club_members')
    .select('club_id, clubs(id, name)')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (!memberships || memberships.length === 0) return suggestions;

  const clubIds = memberships.map((m: any) => m.club_id);

  // Get upcoming events from these clubs
  const { data: events } = await supabase
    .from('club_events')
    .select('*')
    .in('club_id', clubIds)
    .gte('start_date', new Date().toISOString())
    .in('status', ['published', 'registration_open'])
    .order('start_date', { ascending: true })
    .limit(20);

  if (!events) return suggestions;

  for (const event of events) {
    const club = memberships.find((m: any) => m.club_id === event.club_id)?.clubs;

    suggestions.push({
      user_id: userId,
      suggestion_type: 'club_event',
      confidence_score: 0.9,
      race_data: {
        raceName: event.title,
        venue: event.location_name,
        venueCoordinates: event.location_coordinates,
        startDate: event.start_date,
        endDate: event.end_date,
        boatClass: event.boat_classes?.[0],
        description: event.description,
        registrationUrl: event.website_url,
      },
      source_id: event.club_id,
      source_metadata: { name: club?.name, type: 'club' },
      suggestion_reason: `Upcoming event at ${club?.name || 'your club'}`,
      expires_at: expiresAt.toISOString(),
    });
  }

  return suggestions;
}

/**
 * Get fleet race suggestions
 */
async function getFleetRaceSuggestions(
  supabase: any,
  userId: string,
  expiresAt: Date
): Promise<any[]> {
  const suggestions: any[] = [];

  // Get user's fleets
  const { data: fleets } = await supabase
    .from('fleet_members')
    .select('fleet_id, fleets(id, name, class_id)')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (!fleets || fleets.length === 0) return suggestions;

  for (const fleetMember of fleets) {
    const fleet = fleetMember.fleets;
    if (!fleet?.class_id) continue;

    // Get races for this class
    const { data: races } = await supabase
      .from('race_events')
      .select('*')
      .contains('boat_classes', [fleet.class_id])
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(10);

    if (!races) continue;

    for (const race of races) {
      suggestions.push({
        user_id: userId,
        suggestion_type: 'fleet_race',
        confidence_score: 0.85,
        race_data: {
          raceName: race.name,
          venue: race.venue_name || race.location_name,
          startDate: race.event_date || race.start_time,
          boatClass: race.boat_classes?.[0] || race.boat_class,
          raceSeries: race.race_series,
        },
        source_id: fleet.id,
        source_metadata: { name: fleet.name, type: 'fleet' },
        suggestion_reason: `${fleet.name} fleet member is racing this`,
        expires_at: expiresAt.toISOString(),
      });
    }
  }

  return suggestions;
}

/**
 * Get pattern-based suggestions
 */
async function getPatternSuggestions(
  supabase: any,
  userId: string,
  expiresAt: Date
): Promise<any[]> {
  const suggestions: any[] = [];

  // Get high-confidence patterns
  const { data: patterns } = await supabase
    .from('race_patterns')
    .select('*')
    .eq('user_id', userId)
    .gte('confidence', 0.6)
    .order('confidence', { ascending: false })
    .limit(10);

  if (!patterns) return suggestions;

  for (const pattern of patterns) {
    const data = pattern.pattern_data;

    switch (pattern.pattern_type) {
      case 'seasonal':
      case 'temporal_annual':
        suggestions.push({
          user_id: userId,
          suggestion_type: 'pattern_match',
          confidence_score: pattern.confidence,
          race_data: {
            raceName: data.raceName || 'Seasonal Race',
            venue: data.venue,
            boatClass: data.boatClass,
            startDate: suggestDateForMonth(data.month),
          },
          source_id: pattern.id,
          source_metadata: { type: 'pattern' },
          suggestion_reason: `You typically race "${data.raceName}" in ${getMonthName(data.month)}`,
          expires_at: expiresAt.toISOString(),
        });
        break;
    }
  }

  return suggestions;
}

/**
 * Suggest a date for a given month
 */
function suggestDateForMonth(month: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const suggestedDate = new Date(year, month, 15); // Mid-month

  // If month has passed, suggest next year
  if (suggestedDate < now) {
    suggestedDate.setFullYear(year + 1);
  }

  return suggestedDate.toISOString();
}

/**
 * Get month name
 */
function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[month] || 'Unknown';
}
