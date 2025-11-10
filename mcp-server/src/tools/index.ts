/**
 * MCP Tools Registration
 *
 * Tools perform computations and actions based on inputs.
 * They're model-controlled and designed to solve specific problems.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createSupabaseClient } from '../utils/supabase.js';

/**
 * Calculate optimal race start positioning
 */
const analyzeStartLineSchema = z.object({
  raceId: z.string().describe('Race ID'),
  windDirection: z.number().describe('Current wind direction in degrees'),
  windSpeed: z.number().describe('Current wind speed in knots'),
  currentDirection: z.number().optional().describe('Current direction in degrees'),
  currentSpeed: z.number().optional().describe('Current speed in knots'),
});

/**
 * Analyze tidal opportunities during a race
 */
const analyzeTidalOpportunitiesSchema = z.object({
  raceId: z.string().describe('Race ID'),
  startTime: z.string().describe('Race start time (ISO format)'),
  duration: z.number().describe('Expected race duration in minutes'),
  location: z.string().describe('Venue location identifier'),
});

/**
 * Calculate optimal route considering wind and current
 */
const calculateOptimalRouteSchema = z.object({
  startLat: z.number().describe('Start latitude'),
  startLon: z.number().describe('Start longitude'),
  endLat: z.number().describe('End latitude'),
  endLon: z.number().describe('End longitude'),
  windDirection: z.number().describe('Wind direction in degrees'),
  windSpeed: z.number().describe('Wind speed in knots'),
  currentDirection: z.number().optional().describe('Current direction in degrees'),
  currentSpeed: z.number().optional().describe('Current speed in knots'),
  boatClass: z.string().optional().describe('Boat class for polar data'),
});

/**
 * Register all tools with the MCP server
 */
export function registerTools(server: McpServer) {
  // Start line analysis tool
  server.registerTool(
    {
      name: 'analyze_start_line',
      description: 'Analyze race start line to determine favored end and optimal positioning',
      inputSchema: analyzeStartLineSchema,
    },
    async (args: z.infer<typeof analyzeStartLineSchema>) => {
      const { raceId, windDirection, windSpeed, currentDirection, currentSpeed } = args;
      const supabase = createSupabaseClient();

      // Fetch race course data
      const { data: course, error } = await supabase
        .from('race_courses')
        .select('*')
        .eq('race_id', raceId)
        .single();

      if (error || !course) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ error: 'Race course not found' }),
          }],
        };
      }

      // Calculate line bias
      const lineBearing = calculateLineBearing(course);
      const windAngle = normalizeAngle(windDirection - lineBearing);
      const bias = windAngle > 0 ? 'pin' : 'boat';
      const biasAngle = Math.abs(windAngle);

      // Factor in current if provided
      let currentEffect = 'neutral';
      if (currentDirection !== undefined && currentSpeed !== undefined) {
        const currentAngle = normalizeAngle(currentDirection - lineBearing);
        currentEffect = currentAngle > 0 ? 'favors pin end' : 'favors boat end';
      }

      const analysis = {
        favoredEnd: bias,
        biasAngle: Math.round(biasAngle),
        boatLengthAdvantage: Math.round((biasAngle / 5) * 2),
        currentEffect,
        windDirection,
        windSpeed,
        currentDirection,
        currentSpeed,
        recommendation: `Start at ${bias} end. Line bias is ${biasAngle}° giving ~${Math.round((biasAngle / 5) * 2)} boat length advantage.`,
        tactics: [
          `Approach on starboard tack from ${bias} end`,
          `Be at full speed ${Math.round(windSpeed * 5)} seconds before gun`,
          currentEffect !== 'neutral' ? `Current ${currentEffect} - adjust timing accordingly` : null,
        ].filter(Boolean),
      };

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(analysis, null, 2),
        }],
      };
    }
  );

  // Tidal opportunities analysis tool
  server.registerTool(
    {
      name: 'analyze_tidal_opportunities',
      description: 'Identify current-driven advantages, eddies, and slack windows during race',
      inputSchema: analyzeTidalOpportunitiesSchema,
    },
    async (args: z.infer<typeof analyzeTidalOpportunitiesSchema>) => {
      const { raceId, startTime, duration, location } = args;
      const supabase = createSupabaseClient();

      // Fetch tidal predictions for race window
      const endTime = new Date(new Date(startTime).getTime() + duration * 60000).toISOString();

      const { data: tides, error } = await supabase
        .from('tidal_predictions')
        .select('*')
        .eq('location', location)
        .gte('timestamp', startTime)
        .lte('timestamp', endTime)
        .order('timestamp', { ascending: true });

      if (error) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ error: error.message }),
          }],
        };
      }

      // Analyze tidal windows
      const opportunities = analyzeTidalWindows(tides || [], startTime, duration);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(opportunities, null, 2),
        }],
      };
    }
  );

  // Optimal route calculation tool
  server.registerTool(
    {
      name: 'calculate_optimal_route',
      description: 'Calculate the fastest route between two points considering wind, current, and boat polars',
      inputSchema: calculateOptimalRouteSchema,
    },
    async (args: z.infer<typeof calculateOptimalRouteSchema>) => {
      const {
        startLat,
        startLon,
        endLat,
        endLon,
        windDirection,
        windSpeed,
        currentDirection,
        currentSpeed,
        boatClass,
      } = args;

      const supabase = createSupabaseClient();

      // Fetch boat polars if boat class provided
      let polars = null;
      if (boatClass) {
        const { data } = await supabase
          .from('boat_polars')
          .select('*')
          .eq('boat_class', boatClass)
          .single();
        polars = data;
      }

      // Calculate bearing and distance
      const bearing = calculateBearing(startLat, startLon, endLat, endLon);
      const distance = calculateDistance(startLat, startLon, endLat, endLon);

      // Calculate optimal angles
      const route = calculateOptimalAngles({
        bearing,
        distance,
        windDirection,
        windSpeed,
        currentDirection,
        currentSpeed,
        polars,
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(route, null, 2),
        }],
      };
    }
  );

  console.error('✅ Registered tools: analyze_start_line, analyze_tidal_opportunities, calculate_optimal_route');
}

// Helper functions

function calculateLineBearing(course: any): number {
  // Simplified - real implementation would calculate from course marks
  return course.start_line_bearing || 0;
}

function normalizeAngle(angle: number): number {
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateOptimalAngles(params: any) {
  const {
    bearing,
    distance,
    windDirection,
    windSpeed,
    currentDirection,
    currentSpeed,
    polars,
  } = params;

  // Simplified routing calculation
  const windAngle = normalizeAngle(bearing - windDirection);
  const isUpwind = Math.abs(windAngle) < 60;

  return {
    bearing,
    distance,
    windAngle,
    legType: isUpwind ? 'upwind' : 'downwind',
    recommendedAngles: isUpwind
      ? [windDirection - 45, windDirection + 45]
      : [windDirection - 135, windDirection + 135],
    currentEffect: currentSpeed
      ? `${currentSpeed} kts from ${currentDirection}°`
      : 'none',
    estimatedTime: distance / (windSpeed * 0.8), // Rough estimate
  };
}

function analyzeTidalWindows(tides: any[], startTime: string, duration: number) {
  if (!tides.length) {
    return { error: 'No tidal data available' };
  }

  // Find slack windows (when current speed < 0.5 kts)
  const slackWindows = [];
  const opportunities = [];

  for (let i = 0; i < tides.length; i++) {
    const tide = tides[i];

    if (Math.abs(tide.current_speed) < 0.5) {
      slackWindows.push({
        time: tide.timestamp,
        type: tide.tide_type,
        currentSpeed: tide.current_speed,
      });
    }

    // Identify favorable currents
    if (tide.current_speed > 1.0) {
      opportunities.push({
        time: tide.timestamp,
        type: 'strong_current',
        direction: tide.current_direction,
        speed: tide.current_speed,
        advice: 'Plan maneuvers to leverage this current',
      });
    }
  }

  return {
    slackWindows,
    opportunities,
    analysis: {
      hasSlackDuringRace: slackWindows.length > 0,
      strongCurrentPeriods: opportunities.length,
      recommendation: slackWindows.length > 0
        ? 'Schedule critical maneuvers during slack windows'
        : 'No slack during race - plan continuous current compensation',
    },
  };
}
