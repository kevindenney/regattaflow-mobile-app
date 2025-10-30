/**
 * Environmental Analysis Service
 *
 * Unified service that combines bathymetric-tidal analysis and topographic-wind analysis
 * to provide complete environmental intelligence for sailing race strategy.
 *
 * This is the main entry point for "OnX Maps for Sailing" environmental intelligence.
 */

import { BathymetricTidalService } from './BathymetricTidalService';
import { TopographicWindService } from './TopographicWindService';
import type { UnderwaterAnalysis, UnderwaterAnalysisRequest } from '../types/bathymetry';
import type { WindAnalysis, WindAnalysisRequest } from '../types/wind';
import type { SailingVenue } from '@/lib/types/global-venues';
import { createLogger } from '@/lib/utils/logger';

/**
 * Complete environmental analysis result
 */
export interface EnvironmentalAnalysis {
  /** Water environment (bathymetry + tides) */
  water: UnderwaterAnalysis;

  /** Air environment (terrain + wind) */
  air: WindAnalysis;

  /** Combined strategic recommendations */
  combinedRecommendations: {
    /** Overall strategic priority (water vs air) */
    primaryFactor: 'water' | 'air' | 'both';

    /** Start line strategy combining both environments */
    startStrategy: string;

    /** Upwind strategy combining both environments */
    upwindStrategy: string;

    /** Downwind strategy combining both environments */
    downwindStrategy: string;

    /** Mark rounding recommendations */
    markRoundings: string;

    /** Overall timing assessment */
    timing: string;

    /** Are conditions optimal for racing? */
    optimalConditions: boolean;

    /** Estimated performance advantage for correct strategy */
    estimatedAdvantage: string;
  };

  /** Overall confidence in combined analysis */
  confidence: 'high' | 'moderate' | 'low';

  /** Combined caveats */
  caveats: string[];

  /** Timestamp of analysis */
  timestamp: string;

  /** Venue context */
  venue: SailingVenue;
}

/**
 * Request for complete environmental analysis
 */
export interface EnvironmentalAnalysisRequest {
  /** Racing area boundary */
  racingArea: GeoJSON.Polygon;

  /** Scheduled race time (start) */
  raceTime: Date;

  /** Estimated race duration in minutes */
  raceDuration?: number;

  /** Venue context */
  venue: SailingVenue;

  /** Options for analysis */
  options?: {
    /** Skip water analysis (bathymetry + tides) */
    skipWater?: boolean;

    /** Skip air analysis (terrain + wind) */
    skipAir?: boolean;

    /** Use cached results if available (within 1 hour) */
    useCache?: boolean;
  };
}

/**
 * Main environmental analysis service
 */

const logger = createLogger('EnvironmentalAnalysisService');
export class EnvironmentalAnalysisService {
  private bathymetricService: BathymetricTidalService;
  private windService: TopographicWindService;

  constructor() {
    this.bathymetricService = new BathymetricTidalService();
    this.windService = new TopographicWindService();
  }

  /**
   * Perform complete environmental analysis (water + air)
   *
   * This is the primary method for getting comprehensive environmental intelligence.
   */
  async analyzeEnvironment(
    request: EnvironmentalAnalysisRequest
  ): Promise<EnvironmentalAnalysis> {
    logger.debug('='.repeat(80));
    logger.debug('ENVIRONMENTAL ANALYSIS - WATER + AIR');
    logger.debug('='.repeat(80));
    logger.debug();

    const startTime = Date.now();

    try {
      // Run both analyses in parallel for performance
      const [waterAnalysis, airAnalysis] = await Promise.all([
        // Water environment (bathymetry + tides)
        !request.options?.skipWater
          ? this.analyzeWater(request)
          : Promise.resolve(null),

        // Air environment (terrain + wind)
        !request.options?.skipAir
          ? this.analyzeAir(request)
          : Promise.resolve(null)
      ]);

      if (!waterAnalysis && !airAnalysis) {
        throw new Error('Both water and air analyses were skipped');
      }

      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
      logger.debug(`\nBoth analyses completed in ${elapsedTime}s`);
      logger.debug();

      // Combine analyses and generate unified recommendations
      const combinedRecommendations = this.combineRecommendations(
        waterAnalysis,
        airAnalysis,
        request
      );

      // Combine caveats
      const combinedCaveats = [
        ...(waterAnalysis?.caveats || []),
        ...(airAnalysis?.caveats || [])
      ];

      // Overall confidence (lowest of the two)
      const confidenceLevels = { high: 3, moderate: 2, low: 1 };
      const waterConf = waterAnalysis?.confidence || 'high';
      const airConf = airAnalysis?.confidence || 'high';
      const overallConfidence = confidenceLevels[waterConf] < confidenceLevels[airConf]
        ? waterConf
        : airConf;

      return {
        water: waterAnalysis!,
        air: airAnalysis!,
        combinedRecommendations,
        confidence: overallConfidence,
        caveats: combinedCaveats,
        timestamp: new Date().toISOString(),
        venue: request.venue
      };

    } catch (error) {
      console.error('Error in environmental analysis:', error);
      throw new Error(`Failed to analyze environment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze water environment (bathymetry + tides)
   */
  private async analyzeWater(
    request: EnvironmentalAnalysisRequest
  ): Promise<UnderwaterAnalysis> {
    logger.debug('1/2: Analyzing WATER environment (bathymetry + tides)...');

    const waterRequest: UnderwaterAnalysisRequest = {
      racingArea: request.racingArea,
      raceTime: request.raceTime,
      raceDuration: request.raceDuration,
      venue: request.venue
    };

    const result = await this.bathymetricService.analyzeRacingArea(waterRequest);
    return result;
  }

  /**
   * Analyze air environment (terrain + wind)
   */
  private async analyzeAir(
    request: EnvironmentalAnalysisRequest
  ): Promise<WindAnalysis> {
    logger.debug('2/2: Analyzing AIR environment (terrain + wind)...');

    const airRequest: WindAnalysisRequest = {
      racingArea: request.racingArea,
      raceTime: request.raceTime,
      raceDuration: request.raceDuration,
      venue: request.venue
    };

    const result = await this.windService.analyzeWindTerrain(airRequest);
    return result;
  }

  /**
   * Combine water and air recommendations into unified strategy
   */
  private combineRecommendations(
    water: UnderwaterAnalysis | null,
    air: WindAnalysis | null,
    request: EnvironmentalAnalysisRequest
  ): EnvironmentalAnalysis['combinedRecommendations'] {
    // Determine primary factor
    const primaryFactor = this.determinePrimaryFactor(water, air);

    // Combine start strategies
    const startStrategy = this.combineStartStrategy(water, air, primaryFactor);

    // Combine upwind strategies
    const upwindStrategy = this.combineUpwindStrategy(water, air, primaryFactor);

    // Combine downwind strategies
    const downwindStrategy = this.combineDownwindStrategy(water, air, primaryFactor);

    // Combine mark rounding recommendations
    const markRoundings = this.combineMarkRoundings(water, air);

    // Combine timing assessments
    const timing = this.combineTiming(water, air);

    // Determine if conditions are optimal
    const optimalConditions = this.areConditionsOptimal(water, air);

    // Estimate performance advantage
    const estimatedAdvantage = this.estimateAdvantage(water, air, primaryFactor);

    return {
      primaryFactor,
      startStrategy,
      upwindStrategy,
      downwindStrategy,
      markRoundings,
      timing,
      optimalConditions,
      estimatedAdvantage
    };
  }

  /**
   * Determine which environment is the primary strategic factor
   */
  private determinePrimaryFactor(
    water: UnderwaterAnalysis | null,
    air: WindAnalysis | null
  ): 'water' | 'air' | 'both' {
    if (!water) return 'air';
    if (!air) return 'water';

    // Calculate strategic significance of each environment

    // Water: Check current differential
    const currentRange = this.calculateCurrentRange(water);
    const waterSignificance = currentRange > 0.5; // >0.5kt differential is significant

    // Air: Check wind shadow severity
    const severeWindShadows = air.windShadowZones.filter(z => z.severity === 'severe').length;
    const airSignificance = severeWindShadows > 0 || (air.thermalWindPrediction !== undefined);

    if (waterSignificance && airSignificance) return 'both';
    if (waterSignificance) return 'water';
    if (airSignificance) return 'air';
    return 'both'; // Default to both if neither is dominant
  }

  /**
   * Calculate current speed range (max - min)
   */
  private calculateCurrentRange(water: UnderwaterAnalysis): number {
    const speeds = water.tidal.predictions.map(p => p.speed || 0);
    return Math.max(...speeds) - Math.min(...speeds);
  }

  /**
   * Combine start line strategies
   */
  private combineStartStrategy(
    water: UnderwaterAnalysis | null,
    air: WindAnalysis | null,
    primaryFactor: 'water' | 'air' | 'both'
  ): string {
    if (primaryFactor === 'water' && water) {
      return `PRIMARY: ${water.recommendations.startStrategy}\n${air ? `SECONDARY (Wind): ${air.recommendations.startStrategy}` : ''}`;
    }

    if (primaryFactor === 'air' && air) {
      return `PRIMARY: ${air.recommendations.startStrategy}\n${water ? `SECONDARY (Current): ${water.recommendations.startStrategy}` : ''}`;
    }

    // Both factors significant
    return `WATER: ${water?.recommendations.startStrategy || 'N/A'}\nAIR: ${air?.recommendations.startStrategy || 'N/A'}\n\nCOMBINED: Balance current and wind factors. Prioritize positioning that optimizes both, favoring the end that provides access to favorable current AND clean wind.`;
  }

  /**
   * Combine upwind strategies
   */
  private combineUpwindStrategy(
    water: UnderwaterAnalysis | null,
    air: WindAnalysis | null,
    primaryFactor: 'water' | 'air' | 'both'
  ): string {
    if (primaryFactor === 'water' && water) {
      return `PRIMARY FACTOR: Current differential\n\n${water.recommendations.upwindStrategy}\n\n${air ? `Wind considerations: ${air.recommendations.upwindStrategy}` : ''}`;
    }

    if (primaryFactor === 'air' && air) {
      return `PRIMARY FACTOR: Wind shadows and acceleration zones\n\n${air.recommendations.upwindStrategy}\n\n${water ? `Current considerations: ${water.recommendations.upwindStrategy}` : ''}`;
    }

    // Both factors significant
    return `COMBINED STRATEGY:\n\nWATER (Current): ${water?.recommendations.upwindStrategy || 'N/A'}\n\nAIR (Wind): ${air?.recommendations.upwindStrategy || 'N/A'}\n\nOPTIMAL APPROACH: Sail toward areas with BOTH favorable current AND clean wind. If forced to choose, prioritize ${primaryFactor === 'water' ? 'current advantage' : 'wind advantage'} as it has greater impact in these conditions.`;
  }

  /**
   * Combine downwind strategies
   */
  private combineDownwindStrategy(
    water: UnderwaterAnalysis | null,
    air: WindAnalysis | null,
    primaryFactor: 'water' | 'air' | 'both'
  ): string {
    const waterStrat = water?.recommendations.downwindStrategy || 'N/A';
    const airStrat = air?.recommendations.downwindStrategy || 'N/A';

    if (primaryFactor === 'both') {
      return `WATER (Current): ${waterStrat}\n\nAIR (Wind): ${airStrat}\n\nCOMBINED: Optimize routing for both favorable current and clean wind. Downwind, current typically matters less than upwind, so favor clean wind zones.`;
    }

    if (primaryFactor === 'water') {
      return `PRIMARY: ${waterStrat}\n\nWind: ${airStrat}`;
    }

    return `PRIMARY: ${airStrat}\n\nCurrent: ${waterStrat}`;
  }

  /**
   * Combine mark rounding recommendations
   */
  private combineMarkRoundings(
    water: UnderwaterAnalysis | null,
    air: WindAnalysis | null
  ): string {
    const waterRounding = water?.recommendations.markRoundings || '';
    const airRounding = air?.recommendations.markRoundings || '';

    return `CURRENT effects: ${waterRounding}\n\nWIND effects: ${airRounding}\n\nCOMBINED: Account for both current set and wind shadows/gusts at marks. Approach conservatively, giving extra room for combined effects.`;
  }

  /**
   * Combine timing assessments
   */
  private combineTiming(
    water: UnderwaterAnalysis | null,
    air: WindAnalysis | null
  ): string {
    const waterTiming = water?.recommendations.timing || '';
    const airTiming = air?.recommendations.timing || '';

    return `WATER (Tides): ${waterTiming}\n\nAIR (Wind/Thermal): ${airTiming}\n\nOVERALL: ${this.areConditionsOptimal(water, air) ? 'EXCELLENT timing - both water and air conditions are favorable' : 'CONDITIONS ACCEPTABLE - see specific recommendations above for optimization'}`;
  }

  /**
   * Determine if conditions are optimal for racing
   */
  private areConditionsOptimal(
    water: UnderwaterAnalysis | null,
    air: WindAnalysis | null
  ): boolean {
    // Optimal if:
    // 1. Current is favorable (flood for northbound, ebb for southbound)
    // 2. No severe wind shadows covering racing area
    // 3. Thermal wind (if present) is favorable

    const waterOptimal = water
      ? water.tidal.predictions.some(p => (p.speed || 0) > 0.8) // Meaningful current present
      : true;

    const airOptimal = air
      ? air.windShadowZones.filter(z => z.severity === 'severe').length === 0 // No severe shadows
      : true;

    return waterOptimal && airOptimal;
  }

  /**
   * Estimate performance advantage of correct strategy
   */
  private estimateAdvantage(
    water: UnderwaterAnalysis | null,
    air: WindAnalysis | null,
    primaryFactor: 'water' | 'air' | 'both'
  ): string {
    const advantages: string[] = [];

    // Calculate water advantage
    if (water) {
      const currentRange = this.calculateCurrentRange(water);
      if (currentRange > 0.5) {
        const percentAdvantage = Math.round((currentRange / 1.5) * 50); // Rough estimate
        advantages.push(`Current: ${percentAdvantage}% speed advantage on favorable side`);
      }
    }

    // Calculate air advantage
    if (air) {
      const severeWindShadows = air.windShadowZones.filter(z => z.severity === 'severe');
      if (severeWindShadows.length > 0) {
        const avgReduction = severeWindShadows.reduce((sum, z) => sum + z.reduction, 0) / severeWindShadows.length;
        const percentAdvantage = Math.round(avgReduction * 100);
        advantages.push(`Wind: ${percentAdvantage}% speed advantage avoiding shadows`);
      }
    }

    if (advantages.length === 0) {
      return 'Minimal - conditions are relatively uniform across racing area';
    }

    if (advantages.length === 1) {
      return advantages[0];
    }

    return `COMBINED: ${advantages.join(' + ')}\n\nEstimated total advantage: ${primaryFactor === 'both' ? '100-150%' : '50-100%'} faster on optimal side vs suboptimal side.\n\nTime savings in 60-minute race: ${primaryFactor === 'both' ? '5-10 minutes' : '3-5 minutes'}`;
  }

  /**
   * Generate summary report for display
   */
  generateSummaryReport(analysis: EnvironmentalAnalysis): string {
    const lines: string[] = [];

    lines.push('='.repeat(80));
    lines.push('ENVIRONMENTAL INTELLIGENCE REPORT');
    lines.push('='.repeat(80));
    lines.push('');
    lines.push(`Venue: ${analysis.venue.name} (${analysis.venue.region})`);
    lines.push(`Analysis Time: ${new Date(analysis.timestamp).toLocaleString()}`);
    lines.push(`Confidence: ${analysis.confidence.toUpperCase()}`);
    lines.push('');

    // Water summary
    lines.push('WATER ENVIRONMENT (Bathymetry + Tides)');
    lines.push('-'.repeat(80));
    lines.push(`Depth Range: ${this.getDepthRange(analysis.water)}`);
    lines.push(`Tidal Current: ${this.getCurrentSummary(analysis.water)}`);
    lines.push(`Strategic Features: ${analysis.water.strategicFeatures.accelerationZones.length} acceleration zones identified`);
    lines.push('');

    // Air summary
    lines.push('AIR ENVIRONMENT (Terrain + Wind)');
    lines.push('-'.repeat(80));
    lines.push(`Terrain: ${this.getTerrainSummary(analysis.air)}`);
    lines.push(`Wind: ${analysis.air.gradientWind.speed.toFixed(1)}kt from ${analysis.air.gradientWind.direction}°`);
    lines.push(`Wind Shadows: ${analysis.air.windShadowZones.length} zones identified (${analysis.air.windShadowZones.filter(z => z.severity === 'severe').length} severe)`);
    if (analysis.air.thermalWindPrediction) {
      lines.push(`Thermal Wind: ${analysis.air.thermalWindPrediction.type} developing at ${new Date(analysis.air.thermalWindPrediction.development).toLocaleTimeString()}`);
    }
    lines.push('');

    // Combined recommendations
    lines.push('STRATEGIC RECOMMENDATIONS');
    lines.push('='.repeat(80));
    lines.push('');
    lines.push(`Primary Factor: ${analysis.combinedRecommendations.primaryFactor.toUpperCase()}`);
    lines.push('');
    lines.push('START:');
    lines.push(analysis.combinedRecommendations.startStrategy);
    lines.push('');
    lines.push('UPWIND:');
    lines.push(analysis.combinedRecommendations.upwindStrategy);
    lines.push('');
    lines.push('ESTIMATED ADVANTAGE:');
    lines.push(analysis.combinedRecommendations.estimatedAdvantage);
    lines.push('');

    return lines.join('\n');
  }

  // Helper methods for summary generation

  private getDepthRange(water: UnderwaterAnalysis): string {
    const depths = water.bathymetry.depths.flat();
    const min = Math.min(...depths);
    const max = Math.max(...depths);
    return `${min.toFixed(0)}m to ${max.toFixed(0)}m`;
  }

  private getCurrentSummary(water: UnderwaterAnalysis): string {
    const predictions = water.tidal.predictions;
    if (predictions.length === 0) return 'No data';

    const firstPred = predictions[0];
    return `${firstPred.type} at ${(firstPred.speed || 0).toFixed(1)}kt to ${firstPred.direction}°`;
  }

  private getTerrainSummary(air: WindAnalysis): string {
    const elevations = air.terrain.elevations.flat();
    const max = Math.max(...elevations);

    if (max < 10) return 'Flat/water level';
    if (max < 100) return `Low terrain (max ${max.toFixed(0)}m)`;
    return `Significant terrain (max ${max.toFixed(0)}m)`;
  }
}
