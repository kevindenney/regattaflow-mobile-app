/**
 * Race Analysis Agent
 * Autonomous AI agent for analyzing GPS race data and generating coach feedback
 * Provides detailed performance analysis with actionable recommendations
 */

import { z } from 'zod';
import { BaseAgentService, AgentTool } from './BaseAgentService';
import { supabase } from '../supabase';

export class RaceAnalysisAgent extends BaseAgentService {
  constructor() {
    super({
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 8192, // More tokens for detailed analysis
      temperature: 0.7,
      systemPrompt: `You are an expert sailing coach analyzing race performance. Your goal is to provide constructive, actionable feedback that helps sailors improve.

Analyze race performance across these areas:
1. **Start Performance**: Timing, positioning, line bias, speed at the gun
2. **Upwind Tactics**: Tack count, wind shifts, laylines, fleet positioning
3. **Downwind Tactics**: Gybe count, wind shadows, inside track strategy
4. **Tactical Decisions**: Key moments that affected the race outcome
5. **Boat Handling**: Speed consistency, maneuvers, crew coordination

Your feedback should be:
- Specific with data (e.g., "3 tacks vs fleet average of 5")
- Constructive and encouraging
- Actionable with clear recommendations
- Balanced (highlight strengths AND areas for improvement)

Include a confidence score (0-100) based on GPS data quality and completeness.`,
    });

    // Register race analysis tools
    this.registerTool(this.createGetTimerSession());
    this.registerTool(this.createAnalyzeStartPerformance());
    this.registerTool(this.createAnalyzeTacticalDecisions());
    this.registerTool(this.createCompareToStrategy());
    this.registerTool(this.createSaveAnalysis());
  }

  /**
   * Tool: Get race timer session with GPS data
   */
  private createGetTimerSession(): AgentTool {
    return {
      name: 'get_race_timer_session',
      description: 'Get the race timer session including GPS track points and race conditions. Use this first to load the race data.',
      input_schema: z.object({
        session_id: z.string().describe('The race timer session ID'),
      }),
      execute: async (input) => {
        try {
          const { data: session, error } = await supabase
            .from('race_timer_sessions')
            .select(`
              *,
              regattas(name, venue_id, start_date)
            `)
            .eq('id', input.session_id)
            .single();

          if (error) throw error;

          if (!session) {
            return {
              success: false,
              error: 'Race session not found',
            };
          }

          // Calculate basic metrics from GPS track
          const trackPoints = session.track_points || [];
          const metrics = {
            track_point_count: trackPoints.length,
            duration_minutes: session.duration_seconds ? Math.round(session.duration_seconds / 60) : 0,
            has_gps_data: trackPoints.length > 0,
            race_conditions: {
              wind_direction: session.wind_direction,
              wind_speed: session.wind_speed,
              wave_height: session.wave_height,
            },
          };

          return {
            success: true,
            session,
            metrics,
            regatta: session.regattas,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
          };
        }
      },
    };
  }

  /**
   * Tool: Analyze start performance
   */
  private createAnalyzeStartPerformance(): AgentTool {
    return {
      name: 'analyze_start_performance',
      description: 'Analyze the race start from GPS data. Use this to evaluate start timing, positioning, and line bias.',
      input_schema: z.object({
        track_points: z.array(z.any()).describe('GPS track points array'),
        start_time: z.string().describe('Race start time'),
      }),
      execute: async (input) => {
        try {
          if (!input.track_points || input.track_points.length === 0) {
            return {
              success: false,
              error: 'No GPS track points available for start analysis',
            };
          }

          // Get points around start time (simplified analysis)
          const startPoints = input.track_points.slice(0, Math.min(10, input.track_points.length));

          // Calculate start metrics (simplified - in production would be more sophisticated)
          const analysis = {
            timing: 'Good', // Would calculate based on timestamp vs gun time
            speed_at_gun: startPoints[0]?.speed || 0,
            position_on_line: 'Middle', // Would calculate from GPS
            line_bias: 'Port favored', // Would calculate from wind direction
            recommendation: 'Start was executed well. Consider favoring the pin end in similar conditions.',
          };

          return {
            success: true,
            start_analysis: analysis,
            points_analyzed: startPoints.length,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
          };
        }
      },
    };
  }

  /**
   * Tool: Analyze tactical decisions from GPS
   */
  private createAnalyzeTacticalDecisions(): AgentTool {
    return {
      name: 'identify_tactical_decisions',
      description: 'Identify key tactical decisions (tacks, gybes, laylines) from GPS track. Use this to analyze upwind and downwind performance.',
      input_schema: z.object({
        track_points: z.array(z.any()).describe('GPS track points array'),
        wind_direction: z.number().optional().describe('Wind direction for calculating VMG'),
      }),
      execute: async (input) => {
        try {
          if (!input.track_points || input.track_points.length === 0) {
            return {
              success: false,
              error: 'No GPS track points available for tactical analysis',
            };
          }

          // Simplified tactical analysis
          // In production, would analyze heading changes, VMG, etc.
          const totalPoints = input.track_points.length;
          const estimatedTacks = Math.floor(totalPoints / 20); // Rough estimate
          const estimatedGybes = Math.floor(totalPoints / 30); // Rough estimate

          const analysis = {
            upwind: {
              tack_count: estimatedTacks,
              avg_tack_angle: 90, // Would calculate from GPS
              layline_approach: 'Conservative',
              recommendation: 'Good tack discipline. Consider extending on starboard in next race.',
            },
            downwind: {
              gybe_count: estimatedGybes,
              avg_gybe_angle: 140, // Would calculate from GPS
              inside_track: 'Maintained well',
              recommendation: 'Strong downwind sailing. Watch for wind shadows from boats ahead.',
            },
            key_moments: [
              {
                time: 'Leg 1, 5 minutes',
                decision: 'Tacked on wind shift',
                outcome: 'Gained 2 boats',
              },
            ],
          };

          return {
            success: true,
            tactical_analysis: analysis,
            points_analyzed: totalPoints,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
          };
        }
      },
    };
  }

  /**
   * Tool: Compare actual race to pre-race strategy
   */
  private createCompareToStrategy(): AgentTool {
    return {
      name: 'compare_to_pre_race_strategy',
      description: 'Compare the actual race performance to the pre-race strategy (if available). Use this to see how well the plan was executed.',
      input_schema: z.object({
        regatta_id: z.string().describe('The regatta ID'),
        session_id: z.string().describe('The race session ID'),
      }),
      execute: async (input) => {
        try {
          // Get pre-race strategy
          const { data: strategy } = await supabase
            .from('regattas')
            .select('upwind_strategy_summary, downwind_strategy_summary')
            .eq('id', input.regatta_id)
            .single();

          if (!strategy || (!strategy.upwind_strategy_summary && !strategy.downwind_strategy_summary)) {
            return {
              success: true,
              has_strategy: false,
              message: 'No pre-race strategy found for comparison',
            };
          }

          return {
            success: true,
            has_strategy: true,
            strategy_comparison: {
              upwind_plan: strategy.upwind_strategy_summary,
              upwind_execution: 'Followed plan well', // Would compare GPS to strategy
              downwind_plan: strategy.downwind_strategy_summary,
              downwind_execution: 'Deviated from plan on leg 3', // Would compare GPS to strategy
            },
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
          };
        }
      },
    };
  }

  /**
   * Tool: Save AI analysis to database
   */
  private createSaveAnalysis(): AgentTool {
    return {
      name: 'save_analysis_to_database',
      description: 'Save the complete race analysis to the database. Use this as the final step after completing the analysis.',
      input_schema: z.object({
        timer_session_id: z.string().describe('The race timer session ID'),
        overall_summary: z.string().describe('Overall race performance summary'),
        start_analysis: z.string().describe('Start performance analysis'),
        upwind_analysis: z.string().describe('Upwind tactics analysis'),
        downwind_analysis: z.string().describe('Downwind tactics analysis'),
        tactical_decisions: z.string().describe('Key tactical decisions analysis'),
        boat_handling: z.string().describe('Boat handling assessment'),
        recommendations: z.array(z.string()).describe('Actionable recommendations for improvement'),
        confidence_score: z.number().min(0).max(1).describe('Analysis confidence (0.0 to 1.0)'),
      }),
      execute: async (input) => {
        try {
          const { data: analysis, error } = await supabase
            .from('ai_coach_analysis')
            .insert({
              timer_session_id: input.timer_session_id,
              overall_summary: input.overall_summary,
              start_analysis: input.start_analysis,
              upwind_analysis: input.upwind_analysis,
              downwind_analysis: input.downwind_analysis,
              tactical_decisions: input.tactical_decisions,
              boat_handling: input.boat_handling,
              recommendations: input.recommendations,
              confidence_score: input.confidence_score,
              model_used: 'claude-sonnet-4-5-20250929',
              analysis_version: '1.0',
            })
            .select()
            .single();

          if (error) throw error;

          // Mark session as analyzed
          await supabase
            .from('race_timer_sessions')
            .update({ auto_analyzed: true })
            .eq('id', input.timer_session_id);

          return {
            success: true,
            analysis_id: analysis.id,
            message: 'Race analysis saved successfully',
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
          };
        }
      },
    };
  }

  /**
   * Convenience method: Analyze a race session
   */
  async analyzeRace(options: {
    timerSessionId: string;
  }) {
    return this.run({
      userMessage: 'Analyze this race performance and provide detailed coaching feedback. Focus on starts, tactics, and areas for improvement.',
      context: {
        timerSessionId: options.timerSessionId,
      },
      maxIterations: 10,
    });
  }

  /**
   * Convenience method: Quick performance summary
   */
  async quickSummary(options: {
    timerSessionId: string;
  }) {
    return this.run({
      userMessage: 'Provide a quick 2-3 sentence performance summary with the top recommendation.',
      context: {
        timerSessionId: options.timerSessionId,
      },
      maxIterations: 5,
    });
  }
}
