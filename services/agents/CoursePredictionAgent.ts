/**
 * Course Prediction Agent
 * Autonomous AI agent for predicting race courses from weather forecasts
 * Uses AI reasoning to select the most likely course based on conditions
 */

import { z } from 'zod';
import { BaseAgentService, AgentTool } from './BaseAgentService';
import { supabase } from '../supabase';

export class CoursePredictionAgent extends BaseAgentService {
  constructor() {
    super({
      model: 'claude-3-5-haiku-latest',
      maxTokens: 4096,
      temperature: 0.7,
      systemPrompt: `You are an expert race course predictor for sailing regattas. Your goal is to predict which race course the race committee will use based on weather conditions, typical patterns, and course characteristics.

Your prediction should consider:
1. Wind direction and speed ranges for each course
2. Historical course usage patterns
3. Safety considerations (wave height, current)
4. Venue-specific preferences and traditions
5. Practical race committee logistics

Provide clear reasoning for your predictions and include confidence scores. If multiple courses are viable, explain the probability of each. Be specific about wind conditions that favor each course.`,
    });

    // Register course prediction tools
    this.registerTool(this.createGetVenueCourses());
    this.registerTool(this.createGetWeatherForecast());
    this.registerTool(this.createMatchCoursesToConditions());
    this.registerTool(this.createSavePrediction());
  }

  /**
   * Tool: Get all race courses for a venue
   */
  private createGetVenueCourses(): AgentTool {
    return {
      name: 'get_venue_race_courses',
      description: 'Get all race courses available at a venue. Use this to see what courses the race committee can choose from.',
      input_schema: z.object({
        venue_id: z.string().describe('The sailing venue ID'),
        club_id: z.string().optional().describe('Optional club ID to filter courses'),
      }),
      execute: async (input) => {
        try {
          let query = supabase
            .from('race_courses')
            .select('*')
            .eq('venue_id', input.venue_id);

          if (input.club_id) {
            query = query.eq('club_id', input.club_id);
          }

          const { data: courses, error } = await query;

          if (error) throw error;

          return {
            success: true,
            courses: courses || [],
            count: courses?.length || 0,
            venue_id: input.venue_id,
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
   * Tool: Get weather forecast for race date
   */
  private createGetWeatherForecast(): AgentTool {
    return {
      name: 'get_weather_forecast_for_race',
      description: 'Get weather forecast (wind, waves, current) for a specific race date and venue. Use this to understand the conditions.',
      input_schema: z.object({
        venue_id: z.string().describe('The sailing venue ID'),
        race_date: z.string().describe('Race date in ISO format (YYYY-MM-DD)'),
      }),
      execute: async (input) => {
        try {
          // Get venue coordinates
          const { data: venue } = await supabase
            .from('sailing_venues')
            .select('latitude, longitude, name')
            .eq('id', input.venue_id)
            .single();

          if (!venue) {
            return {
              success: false,
              error: 'Venue not found',
            };
          }

          // In production, this would call WeatherAggregationService
          // For now, return mock forecast
          const forecast = {
            date: input.race_date,
            wind_direction: 180, // SW
            wind_speed: 15, // knots
            wind_gusts: 20,
            wave_height: 1.5, // meters
            wave_period: 6, // seconds
            current_direction: 270,
            current_speed: 0.5, // knots
            confidence: 85, // 0-100
            source: 'Weather API (mock)',
          };

          return {
            success: true,
            forecast,
            venue: venue.name,
            coordinates: {
              lat: venue.latitude,
              lng: venue.longitude,
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
   * Tool: Match courses to weather conditions
   */
  private createMatchCoursesToConditions(): AgentTool {
    return {
      name: 'match_courses_to_conditions',
      description: 'Filter race courses that match the forecasted wind conditions. Use this to narrow down course options.',
      input_schema: z.object({
        courses: z.array(z.any()).describe('Array of race courses'),
        wind_direction: z.number().describe('Forecasted wind direction (0-360)'),
        wind_speed: z.number().describe('Forecasted wind speed in knots'),
      }),
      execute: async (input) => {
        try {
          const matchingCourses = input.courses.filter((course: any) => {
            // Check wind direction range
            const directionMatch =
              (!course.min_wind_direction && !course.max_wind_direction) || // No restrictions
              (course.min_wind_direction <= input.wind_direction &&
                input.wind_direction <= course.max_wind_direction);

            // Check wind speed range
            const speedMatch =
              (!course.min_wind_speed && !course.max_wind_speed) || // No restrictions
              (course.min_wind_speed <= input.wind_speed &&
                input.wind_speed <= course.max_wind_speed);

            return directionMatch && speedMatch;
          });

          return {
            success: true,
            matching_courses: matchingCourses,
            all_courses: input.courses,
            wind_direction: input.wind_direction,
            wind_speed: input.wind_speed,
            match_count: matchingCourses.length,
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
   * Tool: Save course prediction to database
   */
  private createSavePrediction(): AgentTool {
    return {
      name: 'save_prediction_to_database',
      description: 'Save the course prediction to the database. Use this after analyzing and selecting the most likely course.',
      input_schema: z.object({
        regatta_id: z.string().describe('The regatta ID'),
        predicted_course_id: z.string().describe('The predicted course ID'),
        prediction_confidence: z.number().min(0).max(100).describe('Confidence score 0-100'),
        prediction_reasoning: z.string().describe('AI reasoning for this prediction'),
        forecast_wind_direction: z.number().describe('Wind direction used for prediction'),
        forecast_wind_speed: z.number().describe('Wind speed used for prediction'),
        forecast_confidence: z.number().describe('Weather forecast confidence'),
        alternative_courses: z.array(z.object({
          course_id: z.string(),
          course_name: z.string(),
          probability: z.number(),
        })).optional().describe('Alternative courses with probabilities'),
        predicted_for_date: z.string().describe('Race date in ISO format'),
      }),
      execute: async (input) => {
        try {
          const { data: prediction, error } = await supabase
            .from('race_predictions')
            .insert({
              regatta_id: input.regatta_id,
              predicted_course_id: input.predicted_course_id,
              prediction_confidence: input.prediction_confidence,
              prediction_reasoning: input.prediction_reasoning,
              forecast_wind_direction: input.forecast_wind_direction,
              forecast_wind_speed: input.forecast_wind_speed,
              forecast_confidence: input.forecast_confidence,
              alternative_courses: input.alternative_courses || [],
              predicted_for_date: input.predicted_for_date,
            })
            .select()
            .single();

          if (error) throw error;

          // Also update the regatta with predicted course
          await supabase
            .from('regattas')
            .update({
              predicted_course_id: input.predicted_course_id,
              weather_confidence: input.forecast_confidence,
            })
            .eq('id', input.regatta_id);

          return {
            success: true,
            prediction_id: prediction.id,
            message: 'Course prediction saved successfully',
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
   * Check if cached prediction exists for a race
   */
  async getCachedPrediction(raceId: string, userId: string): Promise<{
    prediction: any;
    generatedAt: string;
    expiresAt: string;
    tokensUsed: number;
    toolsUsed: string[];
  } | null> {
    try {
      const { data, error } = await supabase
        .from('venue_intelligence_cache')
        .select('*')
        .eq('venue_id', raceId) // Using venue_id field for race_id
        .eq('user_id', userId)
        .eq('agent_type', 'course_prediction')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      return {
        prediction: data.insights,
        generatedAt: data.generated_at,
        expiresAt: data.expires_at,
        tokensUsed: data.tokens_used || 0,
        toolsUsed: data.tools_used || [],
      };
    } catch (error: any) {

      return null;
    }
  }

  /**
   * Save prediction to cache with performance tracking
   */
  async savePredictionToCache(
    raceId: string,
    userId: string,
    prediction: any,
    metadata: {
      tokensUsed?: number;
      toolsUsed?: string[];
      generationTimeMs?: number;
    } = {}
  ) {
    try {
      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(); // 12 hours (shorter TTL for weather-dependent)

      await supabase.from('venue_intelligence_cache').upsert({
        venue_id: raceId, // Using venue_id field for race_id
        user_id: userId,
        agent_type: 'course_prediction',
        insights: prediction,
        expires_at: expiresAt,
        tokens_used: metadata.tokensUsed || null,
        tools_used: metadata.toolsUsed || null,
        generation_time_ms: metadata.generationTimeMs || null,
      });

    } catch (error: any) {

    }
  }

  /**
   * Get course prediction with cache-first strategy
   */
  async getCoursePrediction(
    raceId: string,
    userId: string,
    raceOptions: {
      regattaId: string;
      venueId: string;
      clubId?: string;
      raceDate: string;
    },
    options: { forceRefresh?: boolean } = {}
  ): Promise<{
    prediction: any;
    cached: boolean;
    cacheAge?: string;
    accuracy?: number;
    tokensUsed?: number;
    toolsUsed?: string[];
    generationTimeMs?: number;
  }> {
    try {
      // Check cache first (unless force refresh)
      if (!options.forceRefresh) {
        const cached = await this.getCachedPrediction(raceId, userId);
        if (cached) {
          const ageHours = Math.floor(
            (Date.now() - new Date(cached.generatedAt).getTime()) / (1000 * 60 * 60)
          );

          // Calculate accuracy from historical predictions
          const accuracy = await this.calculatePredictionAccuracy(userId);

          return {
            prediction: cached.prediction,
            cached: true,
            cacheAge: `${ageHours}h ago`,
            accuracy,
            tokensUsed: cached.tokensUsed,
            toolsUsed: cached.toolsUsed,
          };
        }
      }

      // Generate fresh prediction
      const startTime = Date.now();
      const result = await this.predictCourse(raceOptions);
      const generationTime = Date.now() - startTime;

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate prediction');
      }

      // Save to cache
      await this.savePredictionToCache(raceId, userId, result.result, {
        tokensUsed: result.tokensUsed,
        toolsUsed: result.toolsUsed,
        generationTimeMs: generationTime,
      });

      return {
        prediction: result.result,
        cached: false,
        generationTimeMs: generationTime,
        tokensUsed: result.tokensUsed,
        toolsUsed: result.toolsUsed,
      };
    } catch (error: any) {

      throw error;
    }
  }

  /**
   * Calculate prediction accuracy by comparing past predictions with actual results
   */
  async calculatePredictionAccuracy(userId: string): Promise<number> {
    try {
      // Get past predictions from race_predictions table
      const { data: predictions, error } = await supabase
        .from('race_predictions')
        .select(`
          id,
          predicted_course_id,
          regatta_id,
          prediction_confidence,
          predicted_for_date,
          regattas!inner(
            actual_course_id,
            race_date
          )
        `)
        .eq('regattas.user_id', userId)
        .not('regattas.actual_course_id', 'is', null)
        .order('predicted_for_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!predictions || predictions.length === 0) return 0;

      // Compare predicted vs actual
      let correctPredictions = 0;
      for (const pred of predictions as any[]) {
        if (pred.predicted_course_id === pred.regattas.actual_course_id) {
          correctPredictions++;
        }
      }

      const accuracy = (correctPredictions / predictions.length) * 100;
      return Math.round(accuracy * 10) / 10; // Round to 1 decimal
    } catch (error: any) {

      return 0;
    }
  }

  /**
   * Convenience method: Predict course for a regatta
   */
  async predictCourse(options: {
    regattaId: string;
    venueId: string;
    clubId?: string;
    raceDate: string;
  }) {
    return this.run({
      userMessage: `Predict the race course for this regatta on ${options.raceDate}. Consider wind direction, wind speed, and venue-specific patterns.`,
      context: {
        regattaId: options.regattaId,
        venueId: options.venueId,
        clubId: options.clubId,
        raceDate: options.raceDate,
      },
      maxIterations: 10,
    });
  }

  /**
   * Convenience method: Explain why a course was predicted
   */
  async explainPrediction(options: {
    predictionId: string;
  }) {
    return this.run({
      userMessage: 'Explain why this course was predicted and what conditions favor it.',
      context: {
        predictionId: options.predictionId,
      },
      maxIterations: 5,
    });
  }
}
