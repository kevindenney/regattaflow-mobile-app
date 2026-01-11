/**
 * Bathymetric and Tidal Analysis Service
 *
 * Provides underwater topography and tidal current analysis for sailing race strategy.
 * Integrates bathymetric data, tidal predictions, and Claude AI with the
 * bathymetric-tidal-analyst Skill to generate strategic recommendations.
 */

import Anthropic from '@anthropic-ai/sdk';
import { feature } from '@turf/helpers';
import centroid from '@turf/centroid';
import {
  BathymetrySource,
  TidalDataSource,
  type BathymetricData,
  type TidalAnalysis,
  type TidalPrediction,
  type UnderwaterAnalysis,
  type UnderwaterAnalysisRequest,
  type BathymetryFetchConfig,
  type TidalFetchConfig,
  type StrategicZone,
  type DepthContour,
  type CurrentVector
} from '../types/bathymetry';
import type { SailingVenue } from '@/lib/types/global-venues';
import { createLogger } from '@/lib/utils/logger';
import { skillManagementService } from './ai/SkillManagementService';

/**
 * Main service for bathymetric and tidal analysis
 */

const logger = createLogger('BathymetricTidalService');
export class BathymetricTidalService {
  private anthropic?: Anthropic;

  constructor() {
    const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('BathymetricTidalService: EXPO_PUBLIC_ANTHROPIC_API_KEY not configured. Proceeding with rule-based analysis only.');
      this.anthropic = undefined;
      return;
    }
    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Perform complete underwater analysis for a racing area
   *
   * This is the main entry point for bathymetric/tidal analysis.
   * It fetches bathymetric data, tidal predictions, and uses Claude AI
   * with the bathymetric-tidal-analyst Skill to generate strategic recommendations.
   */
  async analyzeRacingArea(
    request: UnderwaterAnalysisRequest
  ): Promise<UnderwaterAnalysis> {
    try {
      // Calculate race time window (race duration defaults to 90 minutes)
      const raceDuration = request.raceDuration || 90;
      const startTime = request.raceTime;
      const endTime = new Date(startTime.getTime() + raceDuration * 60 * 1000);

      // Add buffer before/after for tidal context (±2 hours)
      const tidalStartTime = new Date(startTime.getTime() - 2 * 60 * 60 * 1000);
      const tidalEndTime = new Date(endTime.getTime() + 2 * 60 * 60 * 1000);

      // Fetch bathymetric data
      logger.debug('Fetching bathymetric data...');
      const bathymetry = await this.fetchBathymetry(
        request.racingArea,
        request.venue,
        request.bathymetryConfig
      );

      // Fetch tidal predictions
      logger.debug('Fetching tidal predictions...');
      const centerPoint = this.calculateCenterPoint(request.racingArea);
      const tidal = await this.fetchTidalPredictions(
        centerPoint,
        tidalStartTime,
        tidalEndTime,
        request.venue,
        request.tidalConfig
      );

      // Identify strategic features from bathymetry and tidal data
      logger.debug('Identifying strategic features...');
      const strategicFeatures = this.identifyStrategicFeatures(
        bathymetry,
        tidal,
        request.racingArea,
        startTime
      );

      // Call Claude API with bathymetric-tidal-analyst Skill
      logger.debug('Generating AI analysis with bathymetric-tidal-analyst Skill...');
      const aiResult = await this.callClaudeWithSkill({
        bathymetry,
        tidal,
        venue: request.venue,
        raceTime: startTime,
        raceDuration,
        racingArea: request.racingArea,
        strategicFeatures
      });

      return {
        bathymetry,
        tidal,
        strategicFeatures,
        aiAnalysis: aiResult.analysis,
        recommendations: aiResult.recommendations,
        confidence: aiResult.confidence,
        caveats: aiResult.caveats,
        timestamp: new Date().toISOString(),
        venue: request.venue
      };
    } catch (error) {
      console.error('Error in analyzeRacingArea:', error);
      throw new Error(`Failed to analyze racing area: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch bathymetric data for a racing area
   */
  async fetchBathymetry(
    racingArea: GeoJSON.Polygon,
    venue: SailingVenue,
    config?: Partial<BathymetryFetchConfig>
  ): Promise<BathymetricData> {
    const bounds = this.calculateBounds(racingArea);
    const buffer = config?.buffer || 500; // 500m buffer by default

    // Expand bounds by buffer
    const bufferedBounds = {
      north: bounds.north + (buffer / 111320), // ~111km per degree latitude
      south: bounds.south - (buffer / 111320),
      east: bounds.east + (buffer / (111320 * Math.cos(bounds.north * Math.PI / 180))),
      west: bounds.west - (buffer / (111320 * Math.cos(bounds.north * Math.PI / 180)))
    };

    // Determine best data source for this venue
    const source = config?.preferredSource || this.getBathymetrySource(venue.region);

    // Fetch from appropriate API
    try {
      const data = await this.fetchBathymetryFromSource(source, bufferedBounds, config?.desiredResolution);
      return data;
    } catch (error) {
      console.warn(`Failed to fetch from ${source}, falling back to GEBCO...`, error);
      // Fallback to GEBCO global coverage
      return await this.fetchBathymetryFromSource(BathymetrySource.GEBCO, bufferedBounds, config?.desiredResolution);
    }
  }

  /**
   * Fetch bathymetric data from a specific source
   */
  private async fetchBathymetryFromSource(
    source: BathymetrySource,
    bounds: { north: number; south: number; east: number; west: number },
    desiredResolution?: number
  ): Promise<BathymetricData> {
    switch (source) {
      case BathymetrySource.GEBCO:
        return await this.fetchGEBCO(bounds, desiredResolution);

      case BathymetrySource.NOAA_NCEI:
        return await this.fetchNOAA(bounds, desiredResolution);

      case BathymetrySource.EMODnet:
        return await this.fetchEMODnet(bounds, desiredResolution);

      case BathymetrySource.HKO:
        return await this.fetchHKO(bounds, desiredResolution);

      default:
        throw new Error(`Unsupported bathymetry source: ${source}`);
    }
  }

  /**
   * Fetch bathymetric data from GEBCO (global coverage)
   */
  private async fetchGEBCO(
    bounds: { north: number; south: number; east: number; west: number },
    desiredResolution?: number
  ): Promise<BathymetricData> {
    // GEBCO Web Map Service (WMS) - free global coverage
    // Resolution: 15 arc-seconds (~450m at equator)

    // For proof-of-concept, return simulated data based on Hong Kong bathymetry
    // In production, would call GEBCO WMS API: https://www.gebco.net/data_and_products/gebco_web_services/

    const synthetic = this.generateSyntheticBathymetry(bounds, desiredResolution ?? 100);

    try {
      const geotiffData = await this.tryFetchGEBCOGeoTiff(bounds, desiredResolution);
      if (geotiffData) {
        return geotiffData;
      }
      logger.debug('GEBCO GeoTIFF unavailable, using synthetic bathymetry fallback.');
    } catch (error) {
      logger.warn('Failed to fetch GEBCO GeoTIFF, using synthetic fallback.', error);
    }

    return synthetic;
  }

  /**
   * Fetch bathymetric data from NOAA (US waters)
   */
  private async fetchNOAA(
    bounds: { north: number; south: number; east: number; west: number },
    desiredResolution?: number
  ): Promise<BathymetricData> {
    // NOAA Bathymetric Data Viewer API
    // https://www.ncei.noaa.gov/maps/bathymetry/
    throw new Error('NOAA bathymetry not yet implemented - use GEBCO fallback');
  }

  /**
   * Fetch bathymetric data from EMODnet (Europe)
   */
  private async fetchEMODnet(
    bounds: { north: number; south: number; east: number; west: number },
    desiredResolution?: number
  ): Promise<BathymetricData> {
    // EMODnet Bathymetry WMS
    // https://rest.emodnet-bathymetry.eu
    throw new Error('EMODnet bathymetry not yet implemented - use GEBCO fallback');
  }

  /**
   * Fetch bathymetric data from Hong Kong Hydrographic Office
   */
  private async fetchHKO(
    bounds: { north: number; south: number; east: number; west: number },
    desiredResolution?: number
  ): Promise<BathymetricData> {
    // Hong Kong Hydrographic Office - would require API access
    throw new Error('HKO bathymetry not yet implemented - use GEBCO fallback');
  }

  /**
   * Fetch tidal predictions for a location and time range
   */
  async fetchTidalPredictions(
    centerPoint: { lat: number; lng: number },
    startTime: Date,
    endTime: Date,
    venue: SailingVenue,
    config?: Partial<TidalFetchConfig>
  ): Promise<TidalAnalysis> {
    const source = config?.preferredSource || this.getTidalService(venue.region);
    const interval = config?.interval || 15; // 15-minute intervals by default

    try {
      return await this.fetchTidalPredictionsFromSource(
        source,
        centerPoint,
        startTime,
        endTime,
        interval
      );
    } catch (error) {
      console.warn(`Failed to fetch tidal predictions from ${source}, using fallback...`, error);
      return this.generateFallbackTidalPredictions(centerPoint, startTime, endTime, interval);
    }
  }

  /**
   * Fetch tidal predictions from a specific source
   */
  private async fetchTidalPredictionsFromSource(
    source: TidalDataSource,
    centerPoint: { lat: number; lng: number },
    startTime: Date,
    endTime: Date,
    interval: number
  ): Promise<TidalAnalysis> {
    switch (source) {
      case TidalDataSource.HKO:
        return await this.fetchHKOTides(centerPoint, startTime, endTime, interval);

      case TidalDataSource.NOAA_COOPS:
        return await this.fetchNOAATides(centerPoint, startTime, endTime, interval);

      default:
        throw new Error(`Unsupported tidal source: ${source}`);
    }
  }

  /**
   * Fetch tidal predictions from Hong Kong Observatory
   */
  private async fetchHKOTides(
    centerPoint: { lat: number; lng: number },
    startTime: Date,
    endTime: Date,
    interval: number
  ): Promise<TidalAnalysis> {
    // Hong Kong Observatory Tidal Info
    // https://www.hko.gov.hk/tide/

    // For proof-of-concept, return simulated Hong Kong tidal data
    const predictions: TidalPrediction[] = [];
    const currentTime = new Date(startTime);

    while (currentTime <= endTime) {
      // Simulate Hong Kong flood/ebb cycle (mixed semi-diurnal)
      const hoursSinceStart = (currentTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const tidalPhase = (hoursSinceStart % 12.42); // ~12.42 hour tidal period

      // Simulate flood (first 6 hours) and ebb (next 6 hours)
      let type: 'flood' | 'ebb' | 'slack';
      let direction: number;
      let speed: number;

      if (tidalPhase < 0.5 || (tidalPhase > 6 && tidalPhase < 6.5)) {
        // Slack water
        type = 'slack';
        direction = tidalPhase < 0.5 ? 30 : 210; // Northeast for flood, southwest for ebb
        speed = 0.1 + Math.random() * 0.1;
      } else if (tidalPhase < 6) {
        // Flood tide (northeast-flowing)
        type = 'flood';
        // Direction rotates during flood: NW → NNE → ENE
        direction = 315 + (tidalPhase / 6) * 90; // 315° → 45°
        if (direction >= 360) direction -= 360;

        // Speed builds from slack, peaks at mid-tide, decreases
        const cyclePosition = (tidalPhase - 0.5) / 5.5; // 0 to 1
        const speedCurve = Math.sin(cyclePosition * Math.PI); // 0 → 1 → 0
        speed = 0.8 + speedCurve * 1.0; // 0.8kt to 1.8kt (spring tide)
      } else {
        // Ebb tide (southwest-flowing)
        type = 'ebb';
        // Direction rotates during ebb: SE → SSW → WSW
        direction = 135 + ((tidalPhase - 6.5) / 5.5) * 90; // 135° → 225°

        // Speed builds from slack, peaks at mid-tide, decreases
        const cyclePosition = (tidalPhase - 6.5) / 5.5; // 0 to 1
        const speedCurve = Math.sin(cyclePosition * Math.PI); // 0 → 1 → 0
        speed = 0.6 + speedCurve * 0.8; // 0.6kt to 1.4kt (ebb typically weaker)
      }

      predictions.push({
        timestamp: currentTime.toISOString(),
        type,
        direction,
        speed,
        coefficient: 0.75 // Moderate spring tide
      });

      currentTime.setMinutes(currentTime.getMinutes() + interval);
    }

    return {
      predictions,
      characteristics: {
        type: 'mixed',
        range: 'mesotidal',
        description: 'Hong Kong has mixed semi-diurnal tides with multi-directional rotary currents in Victoria Harbour',
        rotary: true
      },
      source: TidalDataSource.HKO
    };
  }

  /**
   * Fetch tidal predictions from NOAA (US waters)
   */
  private async fetchNOAATides(
    centerPoint: { lat: number; lng: number },
    startTime: Date,
    endTime: Date,
    interval: number
  ): Promise<TidalAnalysis> {
    // NOAA Tides and Currents API
    // https://api.tidesandcurrents.noaa.gov/api/prod/datagetter
    throw new Error('NOAA tidal predictions not yet implemented');
  }

  /**
   * Generate fallback tidal predictions when API unavailable
   */
  private generateFallbackTidalPredictions(
    centerPoint: { lat: number; lng: number },
    startTime: Date,
    endTime: Date,
    interval: number
  ): TidalAnalysis {
    console.warn('Using fallback simulated tidal predictions');

    // Simple semi-diurnal simulation
    const predictions: TidalPrediction[] = [];
    const currentTime = new Date(startTime);

    while (currentTime <= endTime) {
      const hoursSinceStart = (currentTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const tidalPhase = (hoursSinceStart % 12.42);

      let type: 'flood' | 'ebb' | 'slack';
      let direction: number;
      let speed: number;

      if (tidalPhase < 0.5 || (tidalPhase > 6 && tidalPhase < 6.5)) {
        type = 'slack';
        direction = tidalPhase < 0.5 ? 0 : 180;
        speed = 0.1;
      } else if (tidalPhase < 6) {
        type = 'flood';
        direction = 0; // North
        const cyclePosition = (tidalPhase - 0.5) / 5.5;
        speed = Math.sin(cyclePosition * Math.PI) * 1.5;
      } else {
        type = 'ebb';
        direction = 180; // South
        const cyclePosition = (tidalPhase - 6.5) / 5.5;
        speed = Math.sin(cyclePosition * Math.PI) * 1.2;
      }

      predictions.push({
        timestamp: currentTime.toISOString(),
        type,
        direction,
        speed,
        coefficient: 0.6
      });

      currentTime.setMinutes(currentTime.getMinutes() + interval);
    }

    return {
      predictions,
      characteristics: {
        type: 'semi-diurnal',
        range: 'mesotidal',
        description: 'Simulated semi-diurnal tidal pattern (fallback data)'
      },
      source: TidalDataSource.Manual
    };
  }

  /**
   * Identify strategic features from bathymetry and tidal data
   */
  private identifyStrategicFeatures(
    bathymetry: BathymetricData,
    tidal: TidalAnalysis,
    racingArea: GeoJSON.Polygon,
    raceTime: Date
  ): UnderwaterAnalysis['strategicFeatures'] {
    const accelerationZones: StrategicZone[] = [];
    const eddyZones: StrategicZone[] = [];
    const favoredAreas: StrategicZone[] = [];
    const adverseAreas: StrategicZone[] = [];

    // Find tidal prediction closest to race start time
    const racePrediction = this.findClosestPrediction(tidal.predictions, raceTime);

    // Analyze depth grid for gradients and features
    const depthGrid = bathymetry.depths;
    const { north, south, east, west } = bathymetry.bounds;

    for (let i = 5; i < depthGrid.length - 5; i += 5) {
      for (let j = 5; j < depthGrid[i].length - 5; j += 5) {
        const gradient = this.calculateGradient(depthGrid, i, j);

        // Significant depth gradient detected
        if (gradient.magnitude > 0.05) {
          const lat = south + (i / depthGrid.length) * (north - south);
          const lng = west + (j / depthGrid[i].length) * (east - west);

          // Create small polygon around this point
          const size = 0.001; // ~100m
          const polygon: GeoJSON.Polygon = {
            type: 'Polygon',
            coordinates: [[
              [lng - size, lat - size],
              [lng + size, lat - size],
              [lng + size, lat + size],
              [lng - size, lat + size],
              [lng - size, lat - size]
            ]]
          };

          // Check if gradient aligns with tidal flow (acceleration zone)
          if (racePrediction && this.isAlignedWithTidal(gradient.direction, racePrediction)) {
            const currentDepth = depthGrid[i][j];
            const estimatedCurrent = racePrediction.speed! * (1 + gradient.magnitude * 2);

            accelerationZones.push({
              polygon,
              type: 'acceleration',
              description: `Current accelerates to ${estimatedCurrent.toFixed(1)}kt over shallow area (${currentDepth.toFixed(0)}m depth)`,
              estimatedCurrent,
              confidence: 0.7
            });
          }
        }
      }
    }

    return {
      accelerationZones,
      eddyZones,
      favoredAreas,
      adverseAreas
    };
  }

  /**
   * Calculate depth gradient at a grid point
   */
  private calculateGradient(
    depthGrid: number[][],
    i: number,
    j: number
  ): { magnitude: number; direction: number } {
    const depth = depthGrid[i][j];
    const depthNorth = depthGrid[Math.max(0, i - 1)][j];
    const depthSouth = depthGrid[Math.min(depthGrid.length - 1, i + 1)][j];
    const depthEast = depthGrid[i][Math.min(depthGrid[i].length - 1, j + 1)];
    const depthWest = depthGrid[i][Math.max(0, j - 1)];

    const dLat = (depthNorth - depthSouth) / 2;
    const dLng = (depthEast - depthWest) / 2;

    const magnitude = Math.sqrt(dLat * dLat + dLng * dLng) / depth;
    const direction = (Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360;

    return { magnitude, direction };
  }

  /**
   * Check if gradient direction aligns with tidal flow direction
   */
  private isAlignedWithTidal(
    gradientDirection: number,
    prediction: TidalPrediction
  ): boolean {
    if (!prediction.direction) return false;

    const angleDiff = Math.abs(gradientDirection - prediction.direction);
    const normalizedDiff = Math.min(angleDiff, 360 - angleDiff);

    // Aligned if within 45° of tidal direction
    return normalizedDiff < 45;
  }

  /**
   * Find tidal prediction closest to a specific time
   */
  private findClosestPrediction(
    predictions: TidalPrediction[],
    targetTime: Date
  ): TidalPrediction | null {
    if (predictions.length === 0) return null;

    return predictions.reduce((closest, pred) => {
      const predTime = new Date(pred.timestamp);
      const closestTime = new Date(closest.timestamp);

      const predDiff = Math.abs(predTime.getTime() - targetTime.getTime());
      const closestDiff = Math.abs(closestTime.getTime() - targetTime.getTime());

      return predDiff < closestDiff ? pred : closest;
    });
  }

  /**
   * Call Claude API with bathymetric-tidal-analyst Skill loaded
   */
  private async callClaudeWithSkill(data: {
    bathymetry: BathymetricData;
    tidal: TidalAnalysis;
    venue: SailingVenue;
    raceTime: Date;
    raceDuration: number;
    racingArea: GeoJSON.Polygon;
    strategicFeatures: UnderwaterAnalysis['strategicFeatures'];
  }): Promise<{
    analysis: string;
    recommendations: UnderwaterAnalysis['recommendations'];
    confidence: 'high' | 'moderate' | 'low';
    caveats: string[];
  }> {
    if (!this.anthropic) {
      logger.debug('BathymetricTidalService: Anthropic client unavailable, generating heuristic analysis.');
      return this.generateFallbackAnalysis(data);
    }

    // Prepare bathymetric summary
    const depths = data.bathymetry.depths.flat();
    const minDepth = Math.min(...depths);
    const maxDepth = Math.max(...depths);
    const avgDepth = depths.reduce((a, b) => a + b, 0) / depths.length;

    // Prepare tidal summary
    const raceStartPred = this.findClosestPrediction(data.tidal.predictions, data.raceTime);
    const raceMidTime = new Date(data.raceTime.getTime() + (data.raceDuration / 2) * 60 * 1000);
    const raceMidPred = this.findClosestPrediction(data.tidal.predictions, raceMidTime);
    const raceEndTime = new Date(data.raceTime.getTime() + data.raceDuration * 60 * 1000);
    const raceEndPred = this.findClosestPrediction(data.tidal.predictions, raceEndTime);

    const prompt = `Analyze this racing area's underwater topography and tidal conditions for strategic sailing race recommendations.

**Venue**: ${data.venue.name} (${data.venue.region})
**Race Time**: ${data.raceTime.toISOString()} (${data.raceDuration} minutes duration)

**Bathymetric Data**:
- Source: ${data.bathymetry.source}
- Depth range: ${minDepth.toFixed(1)}m to ${maxDepth.toFixed(1)}m
- Average depth: ${avgDepth.toFixed(1)}m
- Resolution: ${data.bathymetry.resolution}m grid
- Grid size: ${data.bathymetry.depths.length}×${data.bathymetry.depths[0].length} cells
- Notable features: ${data.strategicFeatures.accelerationZones.length} acceleration zones identified

**Tidal Predictions**:
- Tidal type: ${data.tidal.characteristics.type}
- Tidal range: ${data.tidal.characteristics.range}
- ${data.tidal.characteristics.rotary ? 'Rotary current (direction rotates vs simple reversal)' : 'Simple flood/ebb reversal'}

**Race Start** (${data.raceTime.toISOString()}):
- Current: ${raceStartPred?.speed?.toFixed(1)}kt at ${raceStartPred?.direction}°T (${raceStartPred?.type})

**Race Mid-Point** (+${data.raceDuration / 2} min):
- Current: ${raceMidPred?.speed?.toFixed(1)}kt at ${raceMidPred?.direction}°T (${raceMidPred?.type})

**Race End** (+${data.raceDuration} min):
- Current: ${raceEndPred?.speed?.toFixed(1)}kt at ${raceEndPred?.direction}°T (${raceEndPred?.type})

**Racing Area** (GeoJSON):
${JSON.stringify(data.racingArea, null, 2)}

Please provide a comprehensive analysis with the following structure:

1. **Bathymetric Summary**: Key underwater features relevant to racing
2. **Tidal Analysis**: Current behavior during the race window
3. **Combined Analysis**: How depth affects tidal currents in this specific area
4. **Strategic Recommendations**:
   - Start line strategy (favored end, approach, timing)
   - Upwind strategy (favored side, features to leverage/avoid, laylines)
   - Downwind strategy (favored side, features to leverage/avoid)
   - Mark roundings (approach angles, current sets)
   - Overall timing (is this a good tidal window? if not, when would be optimal?)
5. **Confidence & Caveats**: How confident are you? What factors could change the analysis?

Format your response as JSON:
{
  "analysis": "Full natural language analysis covering all 5 sections...",
  "recommendations": {
    "startStrategy": "...",
    "upwindStrategy": "...",
    "downwindStrategy": "...",
    "markRoundings": "...",
    "timing": "..."
  },
  "confidence": "high" | "moderate" | "low",
  "caveats": ["caveat 1", "caveat 2", ...]
}`;

    try {
      // Try to get the tidal-opportunism-analyst skill ID
      let tidalSkillId: string | null = null;
      try {
        tidalSkillId = await skillManagementService.getSkillId('tidal-opportunism-analyst');
      } catch (skillError) {
        console.warn('BathymetricTidalService: Unable to load tidal-opportunism-analyst skill, continuing without it.', skillError);
      }

      // Build the message creation params
      const messageParams: any = {
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: prompt
        }]
      };

      // If we have the skill ID, use it
      if (tidalSkillId) {
        console.log(`🎯 BathymetricTidalService: Using tidal-opportunism-analyst skill (${tidalSkillId})`);
        messageParams.betas = ['skills-2025-10-02'];
        messageParams.skills = [{ type: 'custom', id: tidalSkillId }];
      } else {
        console.warn('⚠️ BathymetricTidalService: tidal-opportunism-analyst skill not found, proceeding without skill');
      }

      const response = await this.anthropic.messages.create(messageParams);

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }

      // Parse JSON response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Fallback: parse as structured text
        return {
          analysis: content.text,
          recommendations: {
            startStrategy: 'See full analysis',
            upwindStrategy: 'See full analysis',
            downwindStrategy: 'See full analysis',
            markRoundings: 'See full analysis',
            timing: 'See full analysis'
          },
          confidence: 'moderate',
          caveats: ['Response format not in expected JSON structure']
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;

    } catch (error) {
      console.error('Error calling Claude API:', error);
      return this.generateFallbackAnalysis(data, error);
    }
  }

  /**
   * Generate heuristic analysis when Anthropic is unavailable
   */
  private generateFallbackAnalysis(
    data: {
      bathymetry: BathymetricData;
      tidal: TidalAnalysis;
      venue: SailingVenue;
      raceTime: Date;
      raceDuration: number;
      racingArea: GeoJSON.Polygon;
      strategicFeatures: UnderwaterAnalysis['strategicFeatures'];
    },
    error?: unknown
  ): {
    analysis: string;
    recommendations: UnderwaterAnalysis['recommendations'];
    confidence: 'high' | 'moderate' | 'low';
    caveats: string[];
  } {
    if (error) {
      console.warn('BathymetricTidalService: Falling back to heuristic analysis due to error.', error);
    }

    const snapshot =
      data.tidal.currentSnapshot ||
      this.findClosestPrediction(data.tidal.predictions, data.raceTime) ||
      null;

    const snapshotPhase = snapshot && 'phase' in snapshot ? snapshot.phase : undefined;
    const snapshotSpeed = snapshot && 'speed' in snapshot ? snapshot.speed : undefined;
    const snapshotDirection = snapshot && 'direction' in snapshot ? snapshot.direction : undefined;

    const phase = snapshotPhase ?? data.tidal.currentSummary?.dominantPhase ?? 'slack';
    const speed: number = snapshotSpeed ?? data.tidal.currentSummary?.averageSpeed ?? 0.4;
    const direction: number = snapshotDirection ?? data.tidal.currentSummary?.averageDirection ?? 0;

    const directionLabel = this.bearingToCardinal(direction);
    const accelerationZones = data.strategicFeatures.accelerationZones || [];
    const zoneSummaries = accelerationZones
      .slice(0, 3)
      .map((zone) => this.describeZone(zone, data.racingArea))
      .filter(Boolean) as string[];

    const analysisLines = [
      `Prevailing current around start: ${speed.toFixed(1)}kt flowing ${directionLabel} (${phase}).`,
      accelerationZones.length > 0
        ? `Bathymetry reveals ${accelerationZones.length} faster-water seams where depth shoals into the main channel${zoneSummaries.length ? `, including ${zoneSummaries.join('; ')}` : ''}.`
        : 'Depth profile is relatively uniform; expect broadly even flow with only weak acceleration near the channel edges.',
      'Use the depth layer to visualize the deeper mid-channel lanes versus shallower shelves that bleed speed.'
    ];

    const recommendations = {
      startStrategy: this.buildStartStrategy(phase, directionLabel, zoneSummaries),
      upwindStrategy: this.buildUpwindStrategy(zoneSummaries),
      downwindStrategy: this.buildDownwindStrategy(zoneSummaries),
      markRoundings: 'Plan roundings so you exit marks into the faster lane; anticipate set toward the shallower shoreline when crossing the harbour.',
      timing: speed > 1.2
        ? 'Expect a punchy tide; timing layline crossings with a lull or slack will be valuable.'
        : 'With moderate current, timing is flexible—focus on linking acceleration lanes rather than waiting for slack.'
    };

    return {
      analysis: `Depth–current synthesis for ${data.venue.name}:\n- ${analysisLines[0]}\n- ${analysisLines[1]}\n- ${analysisLines[2]}`,
      recommendations,
      confidence: accelerationZones.length > 0 ? 'moderate' : 'low',
      caveats: [
        'Generated with simulated bathymetry/tide data—verify against local observations.',
        error ? `AI analysis unavailable: ${error instanceof Error ? error.message : 'unknown error'}` : 'AI assistant unavailable; provided rule-based guidance instead.'
      ]
    };
  }

  private buildStartStrategy(
    phase: string,
    directionLabel: string,
    zoneSummaries: string[]
  ): string {
    const lane = zoneSummaries[0] ?? 'the deepest mid-channel lane';
    if (phase === 'flood') {
      return `Bias the start toward the upstream (${directionLabel} flowing) end so you can punch into ${lane} immediately. Protect the boat that can reach that conveyor first.`;
    }
    if (phase === 'ebb') {
      return `Set up closer to the downstream escape lane so you are not swept over early; accelerate cleanly then slide into ${lane}. Watch for lee eddies near the harbor edges.`;
    }
    return `With slack tide focus on accelerating cleanly; as flow builds, slide into ${lane} to ride the developing stream.`;
  }

  private buildUpwindStrategy(zoneSummaries: string[]): string {
    if (zoneSummaries.length === 0) {
      return 'Sail the shifts and minimize extra tacks; current differentials look small so positioning takes priority over conveyor hunting.';
    }
    return `After the start, link into ${zoneSummaries[0]} and stay in velocity bands longer than the fleet. Cross the harbour only where the depth contour keeps flow attached; avoid shallows that bleed speed.`;
  }

  private buildDownwindStrategy(zoneSummaries: string[]): string {
    if (zoneSummaries.length === 0) {
      return 'Downwind VMG will be mostly wind-driven—sail pressure and keep the boat rumbling while watching for localized shear near piers.';
    }
    const secondary = zoneSummaries[1] ? `, then transition toward ${zoneSummaries[1]} as you approach the leeward gate` : '';
    return `Downwind, soak along ${zoneSummaries[0]} to keep the boat in boosted flow${secondary}. Guard against being pushed toward the shallower shore on gybes.`;
  }

  private describeZone(zone: StrategicZone, racingArea: GeoJSON.Polygon): string | null {
    if (!zone?.polygon?.coordinates?.[0]) {
      return null;
    }

    const coords = zone.polygon.coordinates[0];
    const latSum = coords.reduce((sum, [lng, lat]) => sum + lat, 0);
    const lngSum = coords.reduce((sum, [lng]) => sum + lng, 0);
    const centroidLat = latSum / coords.length;
    const centroidLng = lngSum / coords.length;

    const bounds = this.calculateBounds(racingArea);
    const latNormalized = (centroidLat - bounds.south) / Math.max(1e-6, bounds.north - bounds.south);
    const lngNormalized = (centroidLng - bounds.west) / Math.max(1e-6, bounds.east - bounds.west);

    const northSouth = latNormalized > 0.66 ? 'north' : latNormalized < 0.33 ? 'south' : 'central';
    const eastWest = lngNormalized > 0.66 ? 'east' : lngNormalized < 0.33 ? 'west' : 'central';

    let quadrant: string;
    if (northSouth === 'central' && eastWest === 'central') quadrant = 'mid-channel';
    else if (northSouth === 'central') quadrant = `${eastWest} lane`;
    else if (eastWest === 'central') quadrant = `${northSouth} corridor`;
    else quadrant = `${northSouth}-${eastWest} quadrant`;

    const speed = zone.estimatedCurrent.toFixed(1);
    return `${quadrant} (${speed}kt)`;
  }

  private bearingToCardinal(direction: number): string {
    if (!Number.isFinite(direction)) {
      return 'variable';
    }
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const normalized = ((direction % 360) + 360) % 360;
    const index = Math.round(normalized / 45) % 8;
    return dirs[(index + 8) % 8];
  }

  /**
   * Calculate geographic bounds from a GeoJSON polygon
   */
  private calculateBounds(polygon: GeoJSON.Polygon): {
    north: number;
    south: number;
    east: number;
    west: number;
  } {
    const coords = polygon.coordinates[0]; // Outer ring

    let north = -90;
    let south = 90;
    let east = -180;
    let west = 180;

    for (const [lng, lat] of coords) {
      north = Math.max(north, lat);
      south = Math.min(south, lat);
      east = Math.max(east, lng);
      west = Math.min(west, lng);
    }

    return { north, south, east, west };
  }

  /**
   * Calculate center point of a GeoJSON polygon
   */
  private calculateCenterPoint(polygon: GeoJSON.Polygon): { lat: number; lng: number } {
    const featureObj = feature(polygon);
    const center = centroid(featureObj);
    return {
      lng: center.geometry.coordinates[0],
      lat: center.geometry.coordinates[1]
    };
  }

  /**
   * Determine appropriate bathymetry data source for a region
   */
  private getBathymetrySource(region: string): BathymetrySource {
    const sources: Record<string, BathymetrySource> = {
      'asia-pacific': BathymetrySource.GEBCO, // Would use JODC if available
      'north-america': BathymetrySource.NOAA_NCEI,
      'europe': BathymetrySource.EMODnet,
      'global': BathymetrySource.GEBCO
    };

    return sources[region.toLowerCase()] || sources.global;
  }

  /**
   * Determine appropriate tidal prediction service for a region
   */
  private getTidalService(region: string): TidalDataSource {
    const services: Record<string, TidalDataSource> = {
      'north-america': TidalDataSource.NOAA_COOPS,
      'europe': TidalDataSource.UKHO,
      'asia-pacific': TidalDataSource.HKO, // Fallback; would route to JMA for Japan, BOM for Australia
      'hong-kong': TidalDataSource.HKO
    };

    return services[region.toLowerCase()] || TidalDataSource.HKO;
  }

  /**
   * Generate depth contours for visualization
   */
  generateDepthContours(bathymetry: BathymetricData, contourIntervals: number[]): DepthContour[] {
    // This would use a contouring algorithm (marching squares) to generate GeoJSON LineStrings
    // for each depth contour. For PoC, returning empty array.
    // In production, would use library like 'd3-contour' or 'turf-isolines'

    console.warn('Depth contour generation not yet implemented');
    return [];
  }

  /**
   * Attempt to fetch GEBCO bathymetry as GeoTIFF and decode to depth grid.
   * Returns null when network or decoding is unavailable.
   */
  private async tryFetchGEBCOGeoTiff(
    bounds: { north: number; south: number; east: number; west: number },
    desiredResolution?: number
  ): Promise<BathymetricData | null> {
    const resolutionMeters = desiredResolution ?? 120;
    const mercatorBounds = this.projectBoundsToMercator(bounds);
    if (!mercatorBounds) {
      return null;
    }

    const width = Math.max(64, Math.min(1024, Math.round((mercatorBounds.maxX - mercatorBounds.minX) / resolutionMeters)));
    const height = Math.max(64, Math.min(1024, Math.round((mercatorBounds.maxY - mercatorBounds.minY) / resolutionMeters)));

    const url = new URL('https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv');
    url.searchParams.set('request', 'GetMap');
    url.searchParams.set('service', 'WMS');
    url.searchParams.set('version', '1.3.0');
    url.searchParams.set('layers', 'GEBCO_LATEST');
    url.searchParams.set('crs', 'EPSG:3857');
    url.searchParams.set('bbox', `${mercatorBounds.minX},${mercatorBounds.minY},${mercatorBounds.maxX},${mercatorBounds.maxY}`);
    url.searchParams.set('width', String(width));
    url.searchParams.set('height', String(height));
    url.searchParams.set('format', 'image/geotiff');

    let arrayBuffer: ArrayBuffer;
    try {
      const response = await fetch(url.toString(), { cache: 'no-store' });
      if (!response.ok) {
        logger.warn('GEBCO WMS request failed', { status: response.status });
        return null;
      }
      arrayBuffer = await response.arrayBuffer();
    } catch (error: any) {
      if (error?.cause?.code === 'ENOTFOUND' || error?.code === 'ENOTFOUND') {
        logger.warn('Network unavailable for GEBCO WMS, skipping remote fetch.');
        return null;
      }
      logger.warn('Error fetching GEBCO GeoTIFF', error);
      return null;
    }

    const geoTiffModule = await this.safeImportGeoTiff();
    if (!geoTiffModule) {
      logger.warn('geotiff module not available, cannot decode GEBCO data.');
      return null;
    }

    try {
      const tiff = await geoTiffModule.fromArrayBuffer(arrayBuffer);
      const image = await tiff.getImage();
      const [raster] = await image.readRasters({ interleave: true });
      const imgWidth = image.getWidth();
      const imgHeight = image.getHeight();

      const depths: number[][] = [];
      for (let y = 0; y < imgHeight; y++) {
        const row: number[] = [];
        for (let x = 0; x < imgWidth; x++) {
          const value = raster[y * imgWidth + x];
          // GEBCO uses negative values for depth below sea level
          const depth = value < 0 ? Math.abs(value) : value;
          row.push(depth);
        }
        depths.push(row);
      }

      return {
        resolution: (mercatorBounds.maxX - mercatorBounds.minX) / imgWidth,
        depths,
        bounds,
        source: BathymetrySource.GEBCO,
        date: new Date().toISOString()
      };
    } catch (error) {
      logger.warn('Failed to decode GEBCO GeoTIFF, reverting to synthetic data.', error);
      return null;
    }
  }

  /**
   * Gracefully import the geotiff decoding library when available.
   */
  private async safeImportGeoTiff(): Promise<any | null> {
    try {
      // Prefer default export, fallback to module namespace
      const module = await import('geotiff');
      return module.default ?? module;
    } catch (error) {
      logger.debug('geotiff module import failed', error);
      return null;
    }
  }

  /**
   * Convert latitude/longitude bounds to Web Mercator meters.
   */
  private projectBoundsToMercator(bounds: { north: number; south: number; east: number; west: number }) {
    const minX = this.lonToWebMercator(bounds.west);
    const maxX = this.lonToWebMercator(bounds.east);
    const minY = this.latToWebMercator(bounds.south);
    const maxY = this.latToWebMercator(bounds.north);

    if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY)) {
      return null;
    }

    return { minX, maxX, minY, maxY };
  }

  private lonToWebMercator(lon: number): number {
    return (lon * 20037508.34) / 180;
  }

  private latToWebMercator(lat: number): number {
    const clampedLat = Math.max(-89.9999, Math.min(89.9999, lat));
    const rad = (clampedLat * Math.PI) / 180;
    return Math.log(Math.tan(Math.PI / 4 + rad / 2)) * (20037508.34 / Math.PI);
  }

  /**
   * Generate deterministic synthetic bathymetry when remote data is not available.
   */
  private generateSyntheticBathymetry(
    bounds: { north: number; south: number; east: number; west: number },
    resolutionMeters: number
  ): BathymetricData {
    const latStep = resolutionMeters / 111320;
    const lngStep = resolutionMeters / (111320 * Math.cos(((bounds.north + bounds.south) / 2) * Math.PI / 180));

    const rows = Math.max(16, Math.ceil((bounds.north - bounds.south) / latStep));
    const cols = Math.max(16, Math.ceil((bounds.east - bounds.west) / lngStep));

    const depths: number[][] = [];
    for (let i = 0; i < rows; i++) {
      const lat = bounds.south + (i / rows) * (bounds.north - bounds.south);
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        const lng = bounds.west + (j / cols) * (bounds.east - bounds.west);

        const latFactor = (lat - bounds.south) / (bounds.north - bounds.south);
        const lngFactor = (lng - bounds.west) / (bounds.east - bounds.west);

        let depth = 8 + 10 * (1 - Math.abs(latFactor - 0.5) * 2);

        if (latFactor > 0.65 && lngFactor > 0.55) {
          const bankCenterLat = 0.78;
          const bankCenterLng = 0.68;
          const distToBank = Math.hypot(latFactor - bankCenterLat, lngFactor - bankCenterLng);
          if (distToBank < 0.12) {
            depth = 3 + 2 * (distToBank / 0.12);
          }
        }

        const trenchCenterLng = 0.82;
        const trenchFactor = Math.max(0, 1 - Math.abs(lngFactor - trenchCenterLng) * 5);
        depth += trenchFactor * 6;

        row.push(Math.max(1.5, Math.min(40, depth)));
      }
      depths.push(row);
    }

    return {
      resolution: resolutionMeters,
      depths,
      bounds,
      source: BathymetrySource.GEBCO,
      date: new Date().toISOString()
    };
  }

  /**
   * Generate current vectors for visualization
   */
  generateCurrentVectors(
    tidal: TidalAnalysis,
    racingArea: GeoJSON.Polygon,
    timestamp: Date,
    gridSpacing: number = 200
  ): CurrentVector[] {
    const prediction = this.findClosestPrediction(tidal.predictions, timestamp);
    if (!prediction || !prediction.direction || !prediction.speed) {
      return [];
    }

    const bounds = this.calculateBounds(racingArea);
    const vectors: CurrentVector[] = [];

    // Create grid of current vectors
    const latStep = gridSpacing / 111320; // ~111km per degree
    const lngStep = gridSpacing / (111320 * Math.cos((bounds.north + bounds.south) / 2 * Math.PI / 180));

    for (let lat = bounds.south; lat <= bounds.north; lat += latStep) {
      for (let lng = bounds.west; lng <= bounds.east; lng += lngStep) {
        vectors.push({
          position: [lng, lat],
          direction: prediction.direction,
          speed: prediction.speed,
          timestamp: prediction.timestamp,
          phase: prediction.type as 'flood' | 'ebb' | 'slack'
        });
      }
    }

    return vectors;
  }
}
