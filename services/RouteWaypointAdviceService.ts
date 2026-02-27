/**
 * RouteWaypointAdviceService
 * Generates strategic and tactical advice for each waypoint along a distance race route
 * Uses Claude AI with long-distance-racing-analyst skill
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('RouteWaypointAdviceService');

export interface WaypointAdvice {
  strategic: string;  // High-level strategic advice
  tactical: string;   // Specific tactical actions
  keyConsiderations: string[];  // Important factors to watch
  riskLevel: 'low' | 'medium' | 'high';
  priority: 'critical' | 'important' | 'consider';
}

export interface WaypointContext {
  name: string;
  type: 'start' | 'waypoint' | 'gate' | 'finish';
  position: { lat: number; lng: number };
  index: number;
  totalWaypoints: number;
  weather: {
    wind?: {
      direction: string;
      speed: number;
      gusts?: number;
    };
    conditions?: string;
    temperature?: number;
    waveHeight?: number;
    currentDirection?: string;
    currentSpeed?: number;
  };
  raceDate: string;
  startTime: string;
  estimatedArrivalTime?: string;
  previousWaypoint?: {
    name: string;
    distance: number;  // nm
    bearing?: number;  // degrees
  };
  nextWaypoint?: {
    name: string;
    distance: number;  // nm
    bearing?: number;  // degrees
  };
  totalDistanceRemaining?: number;  // nm
}

export class RouteWaypointAdviceService {
  private static readonly LONG_DISTANCE_SKILL_ID = 'skill_01SKz4JZUgvufuxgkSMkVqXe';

  private static async invokeWaypointChat(prompt: string, maxTokens = 1024): Promise<string> {
    const { data, error } = await supabase.functions.invoke('race-coaching-chat', {
      body: {
        prompt,
        max_tokens: maxTokens,
      },
    });

    if (error) {
      throw new Error(error.message || 'Waypoint advice AI invocation failed');
    }

    const text = typeof data?.text === 'string' ? data.text : '';
    if (!text) {
      throw new Error('Waypoint advice AI returned empty response');
    }

    return text;
  }

  /**
   * Generate strategic and tactical advice for a waypoint
   */
  static async generateWaypointAdvice(
    context: WaypointContext
  ): Promise<WaypointAdvice> {
    try {
      const prompt = this.buildAdvicePrompt(context);
      const responseText = await this.invokeWaypointChat(prompt, 1024);

      return this.parseAdviceResponse(responseText, context);

    } catch (error) {
      logger.error('[RouteWaypointAdvice] Error generating advice:', error);
      return this.generateFallbackAdvice(context);
    }
  }

  /**
   * Generate advice for multiple waypoints in parallel
   */
  static async generateAdviceForAllWaypoints(
    contexts: WaypointContext[]
  ): Promise<Map<string, WaypointAdvice>> {
    const adviceMap = new Map<string, WaypointAdvice>();

    // Generate advice in parallel (with rate limiting consideration)
    const advicePromises = contexts.map(async (context) => {
      try {
        const advice = await this.generateWaypointAdvice(context);
        return { name: context.name, advice };
      } catch (error) {
        logger.error(`[RouteWaypointAdvice] Error for ${context.name}:`, error);
        return { 
          name: context.name, 
          advice: this.generateFallbackAdvice(context) 
        };
      }
    });

    const results = await Promise.all(advicePromises);
    results.forEach(({ name, advice }) => {
      adviceMap.set(name, advice);
    });

    return adviceMap;
  }

  private static buildAdvicePrompt(context: WaypointContext): string {
    const isStart = context.type === 'start';
    const isFinish = context.type === 'finish';
    const isMidPoint = !isStart && !isFinish;

    return `You are an expert long-distance sailing race strategist. Provide strategic and tactical advice for this waypoint along a distance race route.

WAYPOINT CONTEXT:
- Name: ${context.name}
- Type: ${context.type}
- Position: ${context.position.lat.toFixed(4)}, ${context.position.lng.toFixed(4)}
- Position in route: ${context.index + 1} of ${context.totalWaypoints}
${isStart ? '- This is the START of the race' : ''}
${isFinish ? '- This is the FINISH of the race' : ''}
${isMidPoint ? '- This is a mid-route waypoint' : ''}

WEATHER CONDITIONS AT THIS POINT:
${context.weather.wind ? `- Wind: ${context.weather.wind.speed} kts from ${context.weather.wind.direction}${context.weather.wind.gusts ? ` (gusts to ${context.weather.wind.gusts} kts)` : ''}` : '- Wind: Unknown'}
${context.weather.conditions ? `- Conditions: ${context.weather.conditions}` : ''}
${context.weather.temperature !== undefined ? `- Temperature: ${context.weather.temperature}°C` : ''}
${context.weather.waveHeight !== undefined ? `- Wave Height: ${context.weather.waveHeight}m` : ''}
${context.weather.currentSpeed ? `- Current: ${context.weather.currentSpeed} kts at ${context.weather.currentDirection}` : ''}

ROUTE CONTEXT:
${context.previousWaypoint ? `- Coming from: ${context.previousWaypoint.name} (${context.previousWaypoint.distance}nm away)${context.previousWaypoint.bearing ? `, bearing ${context.previousWaypoint.bearing}°` : ''}` : ''}
${context.nextWaypoint ? `- Next waypoint: ${context.nextWaypoint.name} (${context.nextWaypoint.distance}nm away)${context.nextWaypoint.bearing ? `, bearing ${context.nextWaypoint.bearing}°` : ''}` : ''}
${context.totalDistanceRemaining !== undefined ? `- Distance remaining: ${context.totalDistanceRemaining}nm` : ''}
${context.estimatedArrivalTime ? `- Estimated arrival: ${context.estimatedArrivalTime}` : ''}

RACE DETAILS:
- Race Date: ${context.raceDate}
- Start Time: ${context.startTime}

Provide comprehensive advice in this JSON format:
{
  "strategic": "High-level strategic approach for this waypoint (2-3 sentences). Consider: route optimization, timing, weather windows, risk management, pacing strategy.",
  "tactical": "Specific tactical actions to take at this waypoint (2-3 sentences). Consider: sail trim, boat handling, navigation, crew management, equipment changes.",
  "keyConsiderations": ["Important factor 1", "Important factor 2", "Important factor 3"],
  "riskLevel": "low|medium|high",
  "priority": "critical|important|consider"
}

${isStart ? 'Focus on: start strategy, initial route choice, early race positioning, weather window timing.' : ''}
${isFinish ? 'Focus on: final approach strategy, finish line tactics, energy management, final push vs. conservation.' : ''}
${isMidPoint ? 'Focus on: route optimization, weather changes, current effects, timing for next leg, equipment/sail changes if needed.' : ''}

Be specific and actionable. Reference the actual conditions and route context provided. Return ONLY valid JSON, no other text.`;
  }

  private static parseAdviceResponse(
    responseText: string,
    context: WaypointContext
  ): WaypointAdvice {
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          strategic: parsed.strategic || this.generateFallbackAdvice(context).strategic,
          tactical: parsed.tactical || this.generateFallbackAdvice(context).tactical,
          keyConsiderations: Array.isArray(parsed.keyConsiderations) 
            ? parsed.keyConsiderations 
            : this.generateFallbackAdvice(context).keyConsiderations,
          riskLevel: parsed.riskLevel || 'medium',
          priority: parsed.priority || 'important',
        };
      }
    } catch (error) {
      logger.warn('[RouteWaypointAdvice] Failed to parse JSON response:', error);
    }

    // Fallback if parsing fails
    return this.generateFallbackAdvice(context);
  }

  private static generateFallbackAdvice(context: WaypointContext): WaypointAdvice {
    const isStart = context.type === 'start';
    const isFinish = context.type === 'finish';

    if (isStart) {
      return {
        strategic: 'Focus on a clean start with clear air. Choose your initial route based on wind direction and current. Monitor weather conditions closely as they may change during the race.',
        tactical: 'Position for a clear start. Set up for optimal VMG on the first leg. Ensure all crew are ready and equipment is properly configured.',
        keyConsiderations: [
          'Wind direction and speed',
          'Current effects at start',
          'Initial route choice'
        ],
        riskLevel: 'medium',
        priority: 'critical',
      };
    }

    if (isFinish) {
      return {
        strategic: 'Manage energy and resources for the final push. Monitor weather changes that could affect the finish. Plan your approach to maximize speed while minimizing risk.',
        tactical: 'Optimize sail trim for final approach. Maintain boat speed and positioning. Be prepared for tactical situations near the finish line.',
        keyConsiderations: [
          'Final approach strategy',
          'Energy management',
          'Finish line positioning'
        ],
        riskLevel: 'low',
        priority: 'critical',
      };
    }

    return {
      strategic: 'Optimize route for VMG considering current conditions. Monitor weather changes and adjust strategy as needed. Balance speed with risk management.',
      tactical: 'Maintain optimal sail trim for conditions. Navigate efficiently toward next waypoint. Monitor boat systems and crew condition.',
      keyConsiderations: [
        'Route optimization',
        'Weather monitoring',
        'Current effects'
      ],
      riskLevel: 'medium',
      priority: 'important',
    };
  }
}
