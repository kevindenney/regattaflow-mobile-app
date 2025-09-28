/**
 * API endpoint for searching racing results across all external sources
 * Provides unified search interface for sailors, regattas, and venues
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import ExternalResultsService from '@/src/services/results/ExternalResultsService';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const searchType = searchParams.get('type');
    const query = searchParams.get('q');
    const venueId = searchParams.get('venue');
    const sailorName = searchParams.get('sailor');
    const sailNumber = searchParams.get('sail_number');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build date range if provided
    const dateRange = startDate && endDate ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : undefined;

    switch (searchType) {
      case 'sailor':
        if (!sailorName) {
          return NextResponse.json({ error: 'Sailor name required' }, { status: 400 });
        }

        const sailorResults = await ExternalResultsService.searchSailorResults(
          sailorName,
          sailNumber || undefined,
          dateRange
        );

        return NextResponse.json({
          results: sailorResults,
          totalCount: sailorResults.length,
          searchType: 'sailor',
          searchParams: { sailorName, sailNumber, dateRange }
        });

      case 'venue':
        if (!venueId) {
          return NextResponse.json({ error: 'Venue ID required' }, { status: 400 });
        }

        const venueRegattas = await ExternalResultsService.getRegattaResultsByVenue(
          venueId,
          dateRange
        );

        return NextResponse.json({
          results: venueRegattas,
          totalCount: venueRegattas.length,
          searchType: 'venue',
          searchParams: { venueId, dateRange }
        });

      case 'regatta':
        // Search for regattas by name
        if (!query) {
          return NextResponse.json({ error: 'Search query required' }, { status: 400 });
        }

        const { data: regattas, error } = await supabase
          .from('external_regattas')
          .select('*')
          .ilike('name', `%${query}%`)
          .order('start_date', { ascending: false })
          .limit(50);

        if (error) throw error;

        return NextResponse.json({
          results: regattas || [],
          totalCount: regattas?.length || 0,
          searchType: 'regatta',
          searchParams: { query }
        });

      default:
        return NextResponse.json({ error: 'Invalid search type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in results search API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}