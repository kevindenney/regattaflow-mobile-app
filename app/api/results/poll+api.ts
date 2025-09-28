/**
 * API endpoint for external racing results polling
 * Handles manual polling triggers and status checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import ExternalResultsService from '@/src/services/results/ExternalResultsService';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, sourceId } = body;

    switch (action) {
      case 'trigger_poll':
        await ExternalResultsService.triggerManualPoll(sourceId);
        return NextResponse.json({
          success: true,
          message: sourceId ? `Polling triggered for ${sourceId}` : 'Polling triggered for all sources'
        });

      case 'start_polling':
        await ExternalResultsService.startPolling();
        return NextResponse.json({
          success: true,
          message: 'Polling system started'
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in polling API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        const status = await ExternalResultsService.getPollingStatus();
        const sources = ExternalResultsService.getActiveSources();

        return NextResponse.json({
          sources,
          status,
          lastUpdated: new Date().toISOString()
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in polling status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}