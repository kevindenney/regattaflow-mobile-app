/**
 * Tactical AI Service
 *
 * Integrates with Anthropic skills to generate racing tactical recommendations
 * Converts skill outputs into actionable AI chips for the racing console
 */

import type {
  Environment,
  Position,
  Course,
  Fleet,
  AIChip,
  Scenario
} from '@/stores/raceConditionsStore';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

// ============================================================================
// TYPES
// ============================================================================

export interface RaceContext {
  position: Position | null;
  environment: Environment | null;
  course: Course | null;
  fleet: Fleet | null;
  draft: number;
  scenario?: Scenario;
}

interface SkillResponse {
  analysis?: string;
  opportunisticMoves?: Array<{
    window: { start: string; end: string };
    location: string;
    maneuver: string;
    whyItWorks: string;
    expectedGain: string;
    risk: 'low' | 'medium' | 'high';
  }>;
  reliefLanes?: Array<{
    leg: string;
    side: string;
    reason: string;
    proof: string;
  }>;
  schedule?: Array<{
    window: string;
    targetTime: string;
    recommendedActions: string[];
    reason: string;
  }>;
  plays?: Array<{
    name: string;
    situation: string;
    execution: string[];
    currentEffect: string;
    expectedOutcome: string;
    risk: 'low' | 'medium' | 'high';
  }>;
  confidence: 'high' | 'moderate' | 'low';
}

// ============================================================================
// SERVICE
// ============================================================================

class TacticalAIServiceClass {
  private cache: Map<string, { chips: AIChip[]; timestamp: number }> = new Map();
  private cacheTimeout = 120000; // 2 minutes

  /**
   * Get tactical recommendations for current race conditions
   */
  async getRecommendations(context: RaceContext): Promise<AIChip[]> {
    // Check cache first
    const cacheKey = this.getCacheKey(context);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.chips;
    }

    // Validate context
    if (!context.environment || !context.course) {
      console.warn('[TacticalAIService] Insufficient context for AI recommendations');
      return [];
    }

    try {
      // Call multiple skills in parallel
      const [
        tidalOpportunism,
        slackWindow,
        currentCounterplay
      ] = await Promise.allSettled([
        this.callSkill('tidal-opportunism-analyst', context),
        this.callSkill('slack-window-planner', context),
        this.callSkill('current-counterplay-advisor', context)
      ]);

      // Convert skill responses to chips
      const chips: AIChip[] = [];

      if (tidalOpportunism.status === 'fulfilled' && tidalOpportunism.value) {
        chips.push(...this.convertTidalOpportunismToChips(tidalOpportunism.value));
      }

      if (slackWindow.status === 'fulfilled' && slackWindow.value) {
        chips.push(...this.convertSlackWindowToChips(slackWindow.value));
      }

      if (currentCounterplay.status === 'fulfilled' && currentCounterplay.value) {
        chips.push(...this.convertCurrentCounterplayToChips(currentCounterplay.value));
      }

      // Sort by priority
      const prioritized = this.prioritizeChips(chips);

      // Cache results
      this.cache.set(cacheKey, {
        chips: prioritized,
        timestamp: Date.now()
      });

      return prioritized;
    } catch (error) {
      console.error('[TacticalAIService] Failed to get recommendations:', error);
      return [];
    }
  }

  /**
   * Call a specific Anthropic skill via Supabase Edge Function
   */
  private async callSkill(
    skillName: string,
    context: RaceContext
  ): Promise<SkillResponse | null> {
    try {
      const payload = this.buildSkillPayload(skillName, context);

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/anthropic-skills-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            skill: skillName,
            ...payload
          })
        }
      );

      if (!response.ok) {
        console.error(`[TacticalAIService] Skill ${skillName} returned ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`[TacticalAIService] Error calling skill ${skillName}:`, error);
      return null;
    }
  }

  /**
   * Build payload for specific skill
   */
  private buildSkillPayload(skillName: string, context: RaceContext): any {
    const { environment, course, position, draft } = context;

    switch (skillName) {
      case 'tidal-opportunism-analyst':
        return {
          bathymetry: {
            // TODO: Extract from current location
            depthGrid: [],
            contours: [],
            notableShoals: []
          },
          tidalIntel: {
            currentSpeed: environment?.current.speed || 0,
            currentDirection: environment?.current.direction || 0,
            phase: environment?.current.phase || 'slack',
            trend: environment?.current.trend || 'slack',
            range: environment?.tide.range || 0,
            slackWindows: this.extractSlackWindows(environment)
          },
          raceMeta: {
            marks: course?.marks || [],
            legs: course?.legs || [],
            startTime: course?.startTime || new Date(),
            duration: this.estimateRaceDuration(course),
            fleetDensity: 'medium',
            restrictedAreas: course?.restrictedZones || []
          },
          weather: {
            windDirection: environment?.wind.trueDirection || 0,
            windSpeed: environment?.wind.trueSpeed || 0
          }
        };

      case 'slack-window-planner':
        return {
          timeline: this.buildTidalTimeline(environment),
          racePlan: {
            startTime: course?.startTime || new Date(),
            legs: course?.legs || [],
            markApproaches: this.buildMarkApproaches(course)
          },
          tidalIntel: {
            currentStrength: environment?.current.speed || 0,
            trend: environment?.current.trend || 'slack',
            slackWindows: this.extractSlackWindows(environment)
          },
          operationalTasks: [
            'cross channel',
            'round mark',
            'tack sequence'
          ]
        };

      case 'current-counterplay-advisor':
        return {
          fleetState: {
            myPosition: position,
            competitors: context.fleet?.boats || []
          },
          tidalIntel: {
            currentSpeed: environment?.current.speed || 0,
            currentDirection: environment?.current.direction || 0,
            slackWindows: this.extractSlackWindows(environment)
          },
          racePlan: {
            remainingLegs: course?.legs || [],
            distanceToMarks: this.calculateDistancesToMarks(position, course)
          }
        };

      default:
        return {};
    }
  }

  /**
   * Convert Tidal Opportunism skill response to chips
   */
  private convertTidalOpportunismToChips(response: SkillResponse): AIChip[] {
    const chips: AIChip[] = [];

    if (response.opportunisticMoves) {
      response.opportunisticMoves.forEach((move, index) => {
        const riskPriority = move.risk === 'low' ? 7 : move.risk === 'medium' ? 5 : 3;
        chips.push({
          id: `tidal-opp-${index}-${Date.now()}`,
          type: move.risk === 'low' ? 'opportunity' : move.risk === 'high' ? 'caution' : 'strategic',
          skill: 'tidal-opportunism-analyst',
          theory: move.whyItWorks,
          execution: this.formatManeuverExecution(move.maneuver, move.location),
          timing: `${move.window.start} - ${move.window.end}`,
          confidence: response.confidence || 'moderate',
          priority: riskPriority,
          isPinned: false,
          createdAt: new Date()
        });
      });
    }

    if (response.reliefLanes) {
      response.reliefLanes.forEach((lane, index) => {
        chips.push({
          id: `relief-lane-${index}-${Date.now()}`,
          type: 'opportunity',
          skill: 'tidal-opportunism-analyst',
          theory: lane.reason,
          execution: `Sail ${lane.side} side of ${lane.leg}`,
          timing: `During ${lane.leg}`,
          confidence: response.confidence || 'moderate',
          priority: 6,
          isPinned: false,
          createdAt: new Date()
        });
      });
    }

    return chips;
  }

  /**
   * Convert Slack Window skill response to chips
   */
  private convertSlackWindowToChips(response: SkillResponse): AIChip[] {
    const chips: AIChip[] = [];

    if (response.schedule) {
      response.schedule.forEach((item, index) => {
        const isUrgent = item.window.includes('start') || item.window.includes('leg-1');
        chips.push({
          id: `slack-${index}-${Date.now()}`,
          type: isUrgent ? 'alert' : 'strategic',
          skill: 'slack-window-planner',
          theory: item.reason,
          execution: item.recommendedActions.join('. '),
          timing: item.targetTime,
          confidence: response.confidence || 'moderate',
          priority: isUrgent ? 9 : 5,
          isPinned: false,
          alert: isUrgent ? { time: new Date(item.targetTime), triggered: false } : undefined,
          createdAt: new Date()
        });
      });
    }

    return chips;
  }

  /**
   * Convert Current Counterplay skill response to chips
   */
  private convertCurrentCounterplayToChips(response: SkillResponse): AIChip[] {
    const chips: AIChip[] = [];

    if (response.plays) {
      response.plays.forEach((play, index) => {
        chips.push({
          id: `counterplay-${index}-${Date.now()}`,
          type: play.risk === 'low' ? 'opportunity' : 'caution',
          skill: 'current-counterplay-advisor',
          theory: `${play.situation}. ${play.currentEffect}`,
          execution: play.execution.join('. '),
          timing: 'When opportunity presents',
          confidence: response.confidence || 'moderate',
          priority: play.risk === 'low' ? 8 : 6,
          isPinned: false,
          createdAt: new Date()
        });
      });
    }

    return chips;
  }

  /**
   * Prioritize chips by urgency and confidence
   */
  private prioritizeChips(chips: AIChip[]): AIChip[] {
    return chips.sort((a, b) => {
      // Pinned chips always first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // Then by priority
      if (a.priority !== b.priority) return b.priority - a.priority;

      // Then by confidence
      const confWeight = { high: 3, moderate: 2, low: 1 };
      return confWeight[b.confidence] - confWeight[a.confidence];
    });
  }

  /**
   * Generate cache key from context
   */
  private getCacheKey(context: RaceContext): string {
    const envKey = context.environment
      ? `${Math.round(context.environment.current.speed * 10)}${context.environment.current.phase}${Math.round(context.environment.wind.trueSpeed)}`
      : 'no-env';
    const scenarioKey = context.scenario?.active ? `scenario-${context.scenario.timeOffset}` : 'live';
    return `${envKey}-${scenarioKey}`;
  }

  // Helper methods

  private extractSlackWindows(environment: Environment | null) {
    if (!environment?.tide.nextHigh || !environment?.tide.nextLow) {
      return [];
    }

    return [
      {
        time: environment.tide.nextHigh.time,
        type: 'high',
        windowStart: new Date(environment.tide.nextHigh.time.getTime() - 30 * 60000),
        windowEnd: new Date(environment.tide.nextHigh.time.getTime() + 30 * 60000)
      },
      {
        time: environment.tide.nextLow.time,
        type: 'low',
        windowStart: new Date(environment.tide.nextLow.time.getTime() - 30 * 60000),
        windowEnd: new Date(environment.tide.nextLow.time.getTime() + 30 * 60000)
      }
    ];
  }

  private buildTidalTimeline(environment: Environment | null) {
    // Build ordered slack/high/low events
    const events = [];
    if (environment?.tide.nextHigh) {
      events.push({
        time: environment.tide.nextHigh.time,
        type: 'high',
        height: environment.tide.nextHigh.height
      });
    }
    if (environment?.tide.nextLow) {
      events.push({
        time: environment.tide.nextLow.time,
        type: 'low',
        height: environment.tide.nextLow.height
      });
    }
    return events.sort((a, b) => a.time.getTime() - b.time.getTime());
  }

  private buildMarkApproaches(course: Course | null) {
    if (!course) return [];
    return course.marks.map(mark => ({
      markId: mark.id,
      name: mark.name,
      position: mark.position,
      rounding: mark.rounding
    }));
  }

  private estimateRaceDuration(course: Course | null): number {
    if (!course?.legs) return 60; // Default 1 hour
    const totalDistance = course.legs.reduce((sum, leg) => sum + leg.distance, 0);
    const avgSpeed = 5; // knots (conservative)
    return (totalDistance / avgSpeed) * 60; // minutes
  }

  private calculateDistancesToMarks(position: Position | null, course: Course | null) {
    if (!position || !course) return {};

    const distances: Record<string, number> = {};
    course.marks.forEach(mark => {
      const dist = this.haversineDistance(
        position.latitude,
        position.longitude,
        mark.position.lat,
        mark.position.lng
      );
      distances[mark.id] = dist;
    });
    return distances;
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3440.065; // Earth radius in nautical miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private formatManeuverExecution(maneuver: string, location: string): string {
    const maneuverMap: Record<string, string> = {
      'cross_the_race': `Cross channel at ${location}`,
      'hug_shore': `Hug shoreline near ${location}`,
      'play_eddy': `Enter eddy at ${location}`,
      'anchor': `Prepare to anchor at ${location}`,
      'delay_start': `Delay start sequence, position at ${location}`,
      'other': location
    };

    return maneuverMap[maneuver] || maneuver;
  }

  /**
   * Clear cache (useful when race conditions change significantly)
   */
  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
export const TacticalAIService = new TacticalAIServiceClass();
