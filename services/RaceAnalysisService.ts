/**
 * Race Analysis Service
 * Orchestrates RaceAnalysisAgent to provide post-race insights
 * Automatically triggers analysis when races complete
 */

import { RaceAnalysisAgent } from './agents/RaceAnalysisAgent';
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
  static async analyzeRaceSession(timerSessionId: string): Promise<AnalysisResult | null> {
    try {
      // Check if session exists and is completed
      const session = await RaceTimerService.getSession(timerSessionId);
      if (!session) {
        console.error('Race session not found');
        return null;
      }

      if (!session.end_time) {
        console.error('Cannot analyze incomplete race session');
        return null;
      }

      // Check if already analyzed
      const isAnalyzed = await RaceTimerService.isAnalyzed(timerSessionId);
      if (isAnalyzed) {
        logger.debug('Session already analyzed, returning existing analysis');
        return this.getAnalysis(timerSessionId);
      }

      // Trigger AI agent analysis
      logger.debug('Starting AI race analysis for session:', timerSessionId);
      const agent = new RaceAnalysisAgent();

      const result = await agent.analyzeRace({
        timerSessionId,
      });

      if (!result.success) {
        console.error('Agent analysis failed:', result.error);
        return null;
      }

      logger.debug('AI race analysis completed successfully');

      // Return the saved analysis
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

      // Check if full analysis exists
      const analysis = await this.getAnalysis(timerSessionId);
      if (analysis) {
        // Extract first 2 sentences from overall summary
        const sentences = analysis.overall_summary.match(/[^.!?]+[.!?]+/g) || [];
        return sentences.slice(0, 2).join(' ');
      }

      // Generate quick summary using agent
      const agent = new RaceAnalysisAgent();
      const result = await agent.quickSummary({
        timerSessionId,
      });

      if (result.success && result.result) {
        return result.result;
      }

      return null;
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
}
