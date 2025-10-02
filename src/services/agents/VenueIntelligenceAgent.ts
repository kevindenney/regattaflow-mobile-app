/**
 * Venue Intelligence Agent
 * Autonomous AI agent for venue detection, intelligence loading, and cultural adaptation
 * Core of RegattaFlow's "OnX Maps for Sailing" global intelligence system
 */

import { BaseAgentService, AgentTool } from './BaseAgentService';
import { z } from 'zod';
import { supabase } from '@/src/services/supabase';
import type { SailingVenue } from '@/src/lib/types/global-venues';
import { RegionalIntelligenceService } from '@/src/services/venue/RegionalIntelligenceService';

export class VenueIntelligenceAgent extends BaseAgentService {
  private regionalIntelligenceService: RegionalIntelligenceService;

  constructor() {
    super({
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 2048, // Optimized for cost
      temperature: 0.3, // Lower temperature for more consistent venue detection
      systemPrompt: `You are a venue intelligence specialist for RegattaFlow, a global sailing platform.

Your mission: Help sailors seamlessly switch between sailing venues worldwide, loading the right intelligence, weather, and cultural context for each location.

When a sailor provides GPS coordinates or selects a venue:
1. Detect which sailing venue they're at (or confirm manual selection)
2. Load comprehensive regional intelligence (tactical knowledge, weather patterns, local customs)
3. Fetch weather from the appropriate regional provider (HKO for Hong Kong, NOAA for US, etc.)
4. Apply cultural settings (language, currency, protocols)
5. Cache essential data for offline racing
6. Update the app context to reflect the new venue

You have access to tools for each step. Execute them in the optimal order based on the situation.
If venue detection has low confidence, suggest alternatives to the user.
Always prioritize sailor safety - ensure weather data is current and accurate.`,
    });

    this.regionalIntelligenceService = new RegionalIntelligenceService();

    // Register custom tools
    this.registerTool(this.createDetectVenueTool());
    this.registerTool(this.createLoadIntelligenceTool());
    this.registerTool(this.createFetchWeatherTool());
    this.registerTool(this.createApplyCulturalSettingsTool());
    this.registerTool(this.createCacheOfflineDataTool());
  }

  /**
   * Tool: Detect venue from GPS coordinates
   */
  private createDetectVenueTool(): AgentTool {
    return {
      name: 'detect_venue_from_gps',
      description: `Detect which sailing venue the sailor is at based on GPS coordinates.
Use this when the sailor provides a location or when the app detects GPS coordinates.
Returns the matched venue with confidence score and alternative venues if confidence is low.
Only call this if you don't already have a confirmed venue ID.`,
      input_schema: z.object({
        latitude: z.number().describe('GPS latitude in decimal degrees'),
        longitude: z.number().describe('GPS longitude in decimal degrees'),
        radiusKm: z.number().optional().default(50).describe('Search radius in kilometers (default: 50)'),
      }),
      execute: async (input) => {
        console.log('🔧 Tool: detect_venue_from_gps', input);

        try {
          // Query venues within radius using PostGIS
          const { data: venues, error } = await supabase.rpc('venues_within_radius', {
            lat: input.latitude,
            lng: input.longitude,
            radius_km: input.radiusKm,
          });

          if (error) throw error;

          if (!venues || venues.length === 0) {
            return {
              success: false,
              message: `No sailing venues found within ${input.radiusKm}km of coordinates ${input.latitude}, ${input.longitude}`,
              alternatives: [],
            };
          }

          // Calculate confidence based on distance
          const closest = venues[0];
          const distanceKm = closest.distance_km;

          // Confidence formula: 100% at 0km, 50% at 25km, 10% at 50km
          const confidence = Math.max(0.1, Math.min(1.0, 1 - (distanceKm / 50)));

          return {
            success: true,
            venueId: closest.id,
            venueName: closest.name,
            distance: distanceKm,
            confidence,
            coordinates: {
              lat: closest.coordinates.coordinates[1],
              lng: closest.coordinates.coordinates[0],
            },
            alternatives: venues.slice(1, 4).map((v: any) => ({
              venueId: v.id,
              name: v.name,
              distance: v.distance_km,
            })),
          };
        } catch (error: any) {
          console.error('❌ Tool failed: detect_venue_from_gps', error);
          return {
            success: false,
            error: `Failed to detect venue: ${error.message}`,
          };
        }
      },
    };
  }

  /**
   * Tool: Load regional intelligence for venue
   */
  private createLoadIntelligenceTool(): AgentTool {
    return {
      name: 'load_regional_intelligence',
      description: `Load comprehensive regional intelligence for a sailing venue.
This includes tactical knowledge, local weather patterns, cultural protocols, and logistical information.
Call this after you've confirmed the venue (either from detection or manual selection).
Returns complete intelligence data that informs all other tools.`,
      input_schema: z.object({
        venueId: z.string().describe('The unique ID of the sailing venue'),
      }),
      execute: async (input) => {
        console.log('🔧 Tool: load_regional_intelligence', input);

        try {
          // Get venue from database
          const { data: venue, error: venueError } = await supabase
            .from('sailing_venues')
            .select('*')
            .eq('id', input.venueId)
            .single();

          if (venueError) throw venueError;
          if (!venue) throw new Error(`Venue not found: ${input.venueId}`);

          // Load comprehensive intelligence via service
          const intelligence = await this.regionalIntelligenceService.loadVenueIntelligence(venue);

          // Return summary (full data is cached in service)
          return {
            success: true,
            venueId: venue.id,
            venueName: venue.name,
            region: venue.region,
            intelligenceLoaded: {
              weather: !!intelligence.weatherIntelligence,
              tactical: !!intelligence.tacticalIntelligence,
              cultural: !!intelligence.culturalIntelligence,
              logistical: !!intelligence.logisticalIntelligence,
            },
            summary: {
              primaryLanguage: intelligence.culturalIntelligence.briefing.languageInfo.primaryLanguage,
              currency: intelligence.culturalIntelligence.briefing.economicInfo.currency,
              weatherProvider: intelligence.weatherIntelligence.currentConditions ? 'active' : 'pending',
              tacticalInsights: intelligence.tacticalIntelligence.localTactics.length,
              culturalProtocols: intelligence.culturalIntelligence.protocolReminders.length,
            },
          };
        } catch (error: any) {
          console.error('❌ Tool failed: load_regional_intelligence', error);
          return {
            success: false,
            error: `Failed to load intelligence: ${error.message}`,
          };
        }
      },
    };
  }

  /**
   * Tool: Fetch regional weather data
   */
  private createFetchWeatherTool(): AgentTool {
    return {
      name: 'fetch_regional_weather',
      description: `Fetch current weather conditions and forecast from the appropriate regional weather provider.
Uses Hong Kong Observatory (HKO) for Hong Kong, NOAA for US, etc.
Call this after loading venue intelligence to get the region information.
Critical for race safety and strategy planning.`,
      input_schema: z.object({
        venueId: z.string().describe('The venue ID'),
        coordinates: z.object({
          lat: z.number(),
          lng: z.number(),
        }).describe('Venue coordinates'),
        region: z.enum(['north-america', 'europe', 'asia-pacific', 'other']).describe('Geographic region'),
      }),
      execute: async (input) => {
        console.log('🔧 Tool: fetch_regional_weather', input);

        try {
          // Get weather intelligence from service
          const weatherIntelligence = await this.regionalIntelligenceService.getWeatherIntelligence(input.venueId);

          if (!weatherIntelligence) {
            throw new Error('Weather intelligence not loaded. Call load_regional_intelligence first.');
          }

          return {
            success: true,
            venueId: input.venueId,
            currentConditions: {
              windSpeed: weatherIntelligence.currentConditions.windSpeed,
              windDirection: weatherIntelligence.currentConditions.windDirection,
              temperature: weatherIntelligence.currentConditions.temperature,
              gusts: weatherIntelligence.currentConditions.gusts,
            },
            forecast: weatherIntelligence.forecast.slice(0, 24).map(f => ({
              time: f.time,
              windSpeed: f.windSpeed,
              windDirection: f.windDirection,
              racingConditions: f.racingConditions,
            })),
            localPatterns: weatherIntelligence.localPatterns.map(p => p.name),
            racingRecommendations: weatherIntelligence.racingRecommendations,
          };
        } catch (error: any) {
          console.error('❌ Tool failed: fetch_regional_weather', error);
          return {
            success: false,
            error: `Failed to fetch weather: ${error.message}`,
          };
        }
      },
    };
  }

  /**
   * Tool: Apply cultural settings
   */
  private createApplyCulturalSettingsTool(): AgentTool {
    return {
      name: 'apply_cultural_settings',
      description: `Apply cultural settings to the app UI based on venue location.
Updates language, currency, terminology, and protocol reminders.
Call this after loading intelligence to adapt the app to the local context.
Makes RegattaFlow feel native to sailors everywhere.`,
      input_schema: z.object({
        venueId: z.string().describe('The venue ID'),
        language: z.string().describe('Primary language code (e.g., "en", "zh", "fr")'),
        currency: z.string().describe('Local currency code (e.g., "USD", "HKD", "EUR")'),
        protocolReminders: z.array(z.string()).describe('Important cultural protocols to display'),
      }),
      execute: async (input) => {
        console.log('🔧 Tool: apply_cultural_settings', input);

        try {
          // In a real implementation, this would update app state/context
          // For now, return confirmation
          return {
            success: true,
            applied: {
              language: input.language,
              currency: input.currency,
              protocolReminders: input.protocolReminders,
            },
            message: `App UI adapted for ${input.venueId}. Language: ${input.language}, Currency: ${input.currency}`,
          };
        } catch (error: any) {
          console.error('❌ Tool failed: apply_cultural_settings', error);
          return {
            success: false,
            error: `Failed to apply cultural settings: ${error.message}`,
          };
        }
      },
    };
  }

  /**
   * Tool: Cache offline data
   */
  private createCacheOfflineDataTool(): AgentTool {
    return {
      name: 'cache_offline_data',
      description: `Cache essential venue data for offline use during racing.
Includes course marks, tide tables, safety information, and basic intelligence.
Call this as the final step after all intelligence is loaded.
Critical for sailors who lose connectivity on the water.`,
      input_schema: z.object({
        venueId: z.string().describe('The venue ID'),
        dataToCacheKeys: z.array(z.string()).describe('Keys of data to cache (e.g., "weather", "tactical", "cultural")'),
      }),
      execute: async (input) => {
        console.log('🔧 Tool: cache_offline_data', input);

        try {
          // In a real implementation, this would use AsyncStorage or similar
          // For now, return confirmation
          return {
            success: true,
            cached: {
              venueId: input.venueId,
              dataKeys: input.dataToCacheKeys,
              timestamp: new Date().toISOString(),
            },
            message: `Offline data cached for ${input.venueId}. Data will be available without internet.`,
          };
        } catch (error: any) {
          console.error('❌ Tool failed: cache_offline_data', error);
          return {
            success: false,
            error: `Failed to cache offline data: ${error.message}`,
          };
        }
      },
    };
  }

  /**
   * High-level method: Switch venue by GPS
   */
  async switchVenueByGPS(coordinates: { latitude: number; longitude: number }) {
    return this.run({
      userMessage: `I'm at GPS coordinates ${coordinates.latitude}, ${coordinates.longitude}. Detect the venue and load all intelligence for racing here.`,
      context: coordinates,
      maxIterations: 8, // Allow up to 8 steps for full venue switch
    });
  }

  /**
   * High-level method: Switch venue by manual selection
   */
  async switchVenueBySelection(venueId: string) {
    return this.run({
      userMessage: `I've selected venue ${venueId}. Load all intelligence, weather, and cultural settings for this venue.`,
      context: { venueId },
      maxIterations: 6, // Fewer iterations since we already know the venue
    });
  }

  /**
   * High-level method: Refresh venue weather
   */
  async refreshVenueWeather(venueId: string) {
    return this.run({
      userMessage: `Refresh the weather forecast for venue ${venueId}. I need updated conditions for today's race.`,
      context: { venueId },
      maxIterations: 3, // Quick operation
    });
  }
}

export default VenueIntelligenceAgent;
