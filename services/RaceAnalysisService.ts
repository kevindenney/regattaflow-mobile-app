/**
 * Race Analysis Service
 * Orchestrates RaceAnalysisAgent to provide post-race insights
 * Automatically triggers analysis when races complete
 */

import { RaceTimerService } from './RaceTimerService';
import { supabase } from './supabase';
import { createLogger } from '@/lib/utils/logger';

export interface AnalysisResult {
  id: string;
  timer_session_id: string;
  overall_summary: string;
  start_analysis: string;
  upwind_analysis: string;
  downwind_analysis: string;
  tactical_decisions: string;
  boat_handling: string;
  recommendations: string[];
  confidence_score: number;
  model_used: string;
  analysis_version: string;
  created_at: string;
}

const logger = createLogger('RaceAnalysisService');
export class RaceAnalysisService {
  /**
   * Analyze a completed race session
   */
  static async analyzeRaceSession(timerSessionId: string, options: { force?: boolean } = {}): Promise<AnalysisResult | null> {
    try {
      const session = await RaceTimerService.getSession(timerSessionId);
      if (!session) {
        console.error('Race session not found');
        return null;
      }

      if (!session.end_time) {
        console.error('Cannot analyze incomplete race session');
        return null;
      }

      const existing = await this.getAnalysis(timerSessionId);
      if (existing && !options.force) {
        return existing;
      }

      logger.debug('Requesting AI race analysis via API:', timerSessionId);
      const analysis = await this.invokeAnalysisEndpoint(timerSessionId, options.force ?? false);
      if (analysis) {
        return analysis;
      }

      // Fallback to fetching directly in case API responded without payload
      return this.getAnalysis(timerSessionId);
    } catch (error) {
      console.error('Error in analyzeRaceSession:', error);
      return null;
    }
  }

  /**
   * Get analysis for a race session
   */
  static async getAnalysis(timerSessionId: string): Promise<AnalysisResult | null> {
    try {
      const { data, error } = await supabase
        .from('ai_coach_analysis')
        .select('*')
        .eq('timer_session_id', timerSessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found - no analysis yet
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting race analysis:', error);
      return null;
    }
  }

  /**
   * Get quick summary (2-3 sentences) for a race session
   */
  static async getQuickSummary(timerSessionId: string): Promise<string | null> {
    try {
      const session = await RaceTimerService.getSession(timerSessionId);
      if (!session || !session.end_time) {
        return null;
      }

      const analysis =
        (await this.getAnalysis(timerSessionId)) ??
        (await this.analyzeRaceSession(timerSessionId));

      if (!analysis) {
        return null;
      }

      const sentences = analysis.overall_summary.match(/[^.!?]+[.!?]+/g) || [];
      return sentences.slice(0, 2).join(' ');
    } catch (error) {
      console.error('Error getting quick summary:', error);
      return null;
    }
  }

  /**
   * Auto-trigger analysis for unanalyzed sessions
   */
  static async analyzeUnanalyzedSessions(sailorId: string): Promise<void> {
    try {
      const unanalyzedSessions = await RaceTimerService.getUnanalyzedSessions(sailorId);

      logger.debug(`Found ${unanalyzedSessions.length} unanalyzed sessions`);

      for (const session of unanalyzedSessions) {
        logger.debug(`Analyzing session ${session.id}...`);
        await this.analyzeRaceSession(session.id);
      }
    } catch (error) {
      console.error('Error analyzing unanalyzed sessions:', error);
    }
  }

  /**
   * Get analysis status for a session
   */
  static async getAnalysisStatus(timerSessionId: string): Promise<{
    analyzed: boolean;
    analysisExists: boolean;
    canAnalyze: boolean;
  }> {
    try {
      const session = await RaceTimerService.getSession(timerSessionId);
      if (!session) {
        return { analyzed: false, analysisExists: false, canAnalyze: false };
      }

      const analyzed = session.auto_analyzed;
      const analysisExists = analyzed ? true : (await this.getAnalysis(timerSessionId)) !== null;
      const canAnalyze = !!session.end_time;

      return { analyzed, analysisExists, canAnalyze };
    } catch (error) {
      console.error('Error getting analysis status:', error);
      return { analyzed: false, analysisExists: false, canAnalyze: false };
    }
  }

  /**
   * Delete analysis for a session
   */
  static async deleteAnalysis(timerSessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_coach_analysis')
        .delete()
        .eq('timer_session_id', timerSessionId);

      if (error) throw error;

      // Reset auto_analyzed flag
      await supabase
        .from('race_timer_sessions')
        .update({ auto_analyzed: false })
        .eq('id', timerSessionId);

      return true;
    } catch (error) {
      console.error('Error deleting race analysis:', error);
      return false;
    }
  }

  private static async invokeAnalysisEndpoint(timerSessionId: string, force: boolean): Promise<AnalysisResult | null> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!session?.access_token) {
      throw new Error('You must be signed in to generate AI analysis.');
    }

    // Call Supabase Edge Function
    // Note: Supabase client automatically adds auth headers when using invoke()
    logger.debug('Calling race-analysis Edge Function for session:', timerSessionId);
    logger.debug('Session token exists:', !!session.access_token);
    logger.debug('Token preview:', session.access_token.substring(0, 20) + '...');

    const { data, error } = await supabase.functions.invoke('race-analysis', {
      body: { timerSessionId, force },
    });

    if (error) {
      console.error('Edge Function error details:', JSON.stringify(error, null, 2));
      console.error('Error message:', error.message);
      console.error('Error context:', error.context);

      // Try to get response body
      if (error.context?.body) {
        console.error('Response body:', error.context.body);
      }

      throw new Error(error.message || 'Failed to trigger AI analysis');
    }

    if (data?.error) {
      console.error('Edge Function returned error in data:', data.error);
      throw new Error(data.error);
    }

    console.log('Edge Function success, data:', data);

    return (data?.analysis ?? null) as AnalysisResult | null;
  }
}
