/**
 * Topographic and Wind Analysis Service
 *
 * Provides terrain elevation and wind-building interaction analysis for sailing race strategy.
 * Integrates terrain data, building heights, wind forecasts, and Claude AI with the
 * topographic-wind-analyst Skill to generate strategic recommendations.
 */

import Anthropic from '@anthropic-ai/sdk';
import { feature } from '@turf/helpers';
import { featureCollection } from '@turf/helpers';
import intersect from '@turf/intersect';
import centroid from '@turf/centroid';
import { point } from '@turf/helpers';
import distance from '@turf/distance';
import {
  TerrainDataSource,
  BuildingDataSource,
  WindDataSource,
  type TerrainData,
  type BuildingData,
  type Building,
  type WindForecast,
  type WindAnalysis,
  type WindAnalysisRequest,
  type TerrainFetchConfig,
  type BuildingFetchConfig,
  type WindFetchConfig,
  type WindShadowZone,
  type WindAccelerationZone,
  type ThermalWindPrediction,
  type WindBattleZone,
  type ElevationContour,
  type WindArrow
} from '../types/wind';
import type { SailingVenue } from '@/lib/types/global-venues';
import { createLogger } from '@/lib/utils/logger';

/**
 * Main service for topographic and wind analysis
 */

const logger = createLogger('TopographicWindService');
export class TopographicWindService {
  private anthropic: Anthropic;

  constructor() {
    const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Perform complete wind-terrain analysis for a racing area
   *
   * This is the main entry point for wind-terrain analysis.
   * It fetches terrain, buildings, wind forecast, and uses Claude AI
   * with the topographic-wind-analyst Skill to generate strategic recommendations.
   */
  async analyzeWindTerrain(
    request: WindAnalysisRequest
  ): Promise<WindAnalysis> {
    try {
      // Fetch terrain elevation data
      logger.debug('Fetching terrain elevation data...');
      const terrain = await this.fetchTerrain(
        request.racingArea,
        request.venue,
        request.terrainConfig
      );

      // Fetch building data
      logger.debug('Fetching building data...');
      const buildings = await this.fetchBuildings(
        request.racingArea,
        request.venue,
        request.buildingConfig
      );

      // Fetch wind forecast
      logger.debug('Fetching wind forecast...');
      const centerPoint = this.calculateCenterPoint(request.racingArea);
      const gradientWind = await this.fetchWindForecast(
        centerPoint,
        request.raceTime,
        request.venue,
        request.windConfig
      );

      // Calculate wind shadow zones
      logger.debug('Calculating wind shadow zones...');
      const windShadowZones = this.calculateWindShadows(
        buildings,
        terrain,
        gradientWind,
        request.racingArea
      );

      // Calculate wind acceleration zones
      logger.debug('Calculating wind acceleration zones...');
      const accelerationZones = this.calculateAccelerationZones(
        buildings,
        terrain,
        gradientWind,
        request.racingArea
      );

      // Predict thermal wind (if applicable)
      logger.debug('Predicting thermal wind...');
      const thermalWindPrediction = await this.predictThermalWind(
        request.venue,
        request.raceTime
      );

      // Identify wind battle zones (if thermal wind present)
      const windBattleZones = thermalWindPrediction
        ? this.identifyWindBattleZones(gradientWind, thermalWindPrediction, request.racingArea)
        : undefined;

      // Call Claude API with topographic-wind-analyst Skill
      logger.debug('Generating AI analysis with topographic-wind-analyst Skill...');
      const aiResult = await this.callClaudeWithSkill({
        terrain,
        buildings,
        gradientWind,
        windShadowZones,
        accelerationZones,
        thermalWindPrediction,
        windBattleZones,
        racingArea: request.racingArea,
        raceTime: request.raceTime,
        raceDuration: request.raceDuration || 90,
        venue: request.venue
      });

      return {
        terrain,
        buildings,
        gradientWind,
        windShadowZones,
        accelerationZones,
        thermalWindPrediction,
        windBattleZones,
        aiAnalysis: aiResult.analysis,
        recommendations: aiResult.recommendations,
        confidence: aiResult.confidence,
        caveats: aiResult.caveats,
        timestamp: new Date().toISOString(),
        venue: request.venue
      };
    } catch (error) {
      console.error('Error in analyzeWindTerrain:', error);
      throw new Error(`Failed to analyze wind-terrain: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch terrain elevation data for a racing area
   */
  async fetchTerrain(
    racingArea: GeoJSON.Polygon,
    venue: SailingVenue,
    config?: Partial<TerrainFetchConfig>
  ): Promise<TerrainData> {
    const bounds = this.calculateBounds(racingArea);
    const buffer = config?.buffer || 1000; // 1km buffer by default

    // Expand bounds by buffer
    const bufferedBounds = {
      north: bounds.north + (buffer / 111320),
      south: bounds.south - (buffer / 111320),
      east: bounds.east + (buffer / (111320 * Math.cos(bounds.north * Math.PI / 180))),
      west: bounds.west - (buffer / (111320 * Math.cos(bounds.north * Math.PI / 180)))
    };

    // Determine best data source for this venue
    const source = config?.preferredSource || TerrainDataSource.SRTM;

    // For proof-of-concept, return simulated data based on Hong Kong terrain
    // In production, would call SRTM API: https://portal.opentopography.org/

    const resolution = 30; // meters (SRTM resolution)
    const latStep = resolution / 111320;
    const lngStep = resolution / (111320 * Math.cos((bounds.north + bounds.south) / 2 * Math.PI / 180));

    const rows = Math.ceil((bufferedBounds.north - bufferedBounds.south) / latStep);
    const cols = Math.ceil((bufferedBounds.east - bufferedBounds.west) / lngStep);

    // Generate simulated elevation grid (Hong Kong Victoria Harbour + Peak)
    const elevations: number[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      const lat = bufferedBounds.south + i * latStep;

      for (let j = 0; j < cols; j++) {
        const lng = bufferedBounds.west + j * lngStep;

        // Simulate Hong Kong terrain:
        // - Water level (0m) in harbor (north)
        // - Rising terrain toward Victoria Peak (south)
        // - Victoria Peak at ~552m

        const latFactor = (lat - bufferedBounds.south) / (bufferedBounds.north - bufferedBounds.south);

        // Harbor area (north): 0m
        // Gradual rise toward Peak (south): 0m → 552m
        let elevation = 0;

        if (latFactor < 0.3) {
          // Northern harbor area: water level
          elevation = 0;
        } else if (latFactor < 0.6) {
          // Mid-level: gentle rise (0-100m)
          const riseProgress = (latFactor - 0.3) / 0.3;
          elevation = riseProgress * 100;
        } else {
          // Southern area: steep rise to Victoria Peak (100-552m)
          const riseProgress = (latFactor - 0.6) / 0.4;
          elevation = 100 + riseProgress * 452;
        }

        // Add some noise for realism
        elevation += (Math.random() - 0.5) * 10;

        row.push(Math.max(0, elevation));
      }

      elevations.push(row);
    }

    return {
      resolution,
      elevations,
      bounds: bufferedBounds,
      source,
      date: new Date().toISOString()
    };
  }

  /**
   * Fetch building data for a racing area
   */
  async fetchBuildings(
    racingArea: GeoJSON.Polygon,
    venue: SailingVenue,
    config?: Partial<BuildingFetchConfig>
  ): Promise<BuildingData> {
    const bounds = this.calculateBounds(racingArea);
    const buffer = config?.buffer || 2000; // 2km buffer for wind shadows
    const minHeight = config?.minHeight || 20; // Minimum 20m buildings

    // Expand bounds by buffer
    const bufferedBounds = {
      north: bounds.north + (buffer / 111320),
      south: bounds.south - (buffer / 111320),
      east: bounds.east + (buffer / (111320 * Math.cos(bounds.north * Math.PI / 180))),
      west: bounds.west - (buffer / (111320 * Math.cos(bounds.north * Math.PI / 180)))
    };

    // For proof-of-concept, return simulated Hong Kong buildings
    // In production, would call OpenStreetMap Overpass API

    const buildings: Building[] = [];

    // Simulate major Hong Kong skyscrapers
    const majorBuildings = [
      {
        id: 'icc',
        name: 'International Commerce Centre',
        lat: 22.303,
        lng: 114.161,
        height: 484,
        floors: 118
      },
      {
        id: 'ifc',
        name: 'Two International Finance Centre',
        lat: 22.285,
        lng: 114.158,
        height: 412,
        floors: 88
      },
      {
        id: 'central_plaza',
        name: 'Central Plaza',
        lat: 22.278,
        lng: 114.173,
        height: 374,
        floors: 78
      },
      {
        id: 'bank_of_china',
        name: 'Bank of China Tower',
        lat: 22.279,
        lng: 114.161,
        height: 315,
        floors: 72
      },
      {
        id: 'the_center',
        name: 'The Center',
        lat: 22.282,
        lng: 114.154,
        height: 346,
        floors: 73
      }
    ];

    // Add major buildings
    for (const bldg of majorBuildings) {
      // Check if building is within buffered bounds
      if (
        bldg.lat >= bufferedBounds.south &&
        bldg.lat <= bufferedBounds.north &&
        bldg.lng >= bufferedBounds.west &&
        bldg.lng <= bufferedBounds.east
      ) {
        // Create simple rectangular footprint (50m × 50m)
        const size = 0.00045; // ~50m in degrees
        const footprint: GeoJSON.Polygon = {
          type: 'Polygon',
          coordinates: [[
            [bldg.lng - size, bldg.lat - size],
            [bldg.lng + size, bldg.lat - size],
            [bldg.lng + size, bldg.lat + size],
            [bldg.lng - size, bldg.lat + size],
            [bldg.lng - size, bldg.lat - size]
          ]]
        };

        buildings.push({
          id: bldg.id,
          name: bldg.name,
          footprint,
          height: bldg.height,
          floors: bldg.floors,
          type: 'commercial',
          center: { lat: bldg.lat, lng: bldg.lng }
        });
      }
    }

    // Simulate Kowloon waterfront buildings (200-300m cluster)
    for (let i = 0; i < 10; i++) {
      const lat = 22.30 + (Math.random() - 0.5) * 0.02;
      const lng = 114.16 + (Math.random() - 0.5) * 0.03;

      if (
        lat >= bufferedBounds.south &&
        lat <= bufferedBounds.north &&
        lng >= bufferedBounds.west &&
        lng <= bufferedBounds.east
      ) {
        const height = 200 + Math.random() * 100; // 200-300m
        const size = 0.0003; // ~30m in degrees

        const footprint: GeoJSON.Polygon = {
          type: 'Polygon',
          coordinates: [[
            [lng - size, lat - size],
            [lng + size, lat - size],
            [lng + size, lat + size],
            [lng - size, lat + size],
            [lng - size, lat - size]
          ]]
        };

        buildings.push({
          id: `kowloon_${i}`,
          name: `Kowloon Tower ${i + 1}`,
          footprint,
          height,
          floors: Math.floor(height / 3),
          type: 'residential',
          center: { lat, lng }
        });
      }
    }

    return {
      buildings: buildings.filter((building: any) => building.height >= minHeight),
      source: BuildingDataSource.OpenStreetMap,
      date: new Date().toISOString(),
      count: buildings.filter((building: any) => building.height >= minHeight).length
    };
  }

  /**
   * Fetch wind forecast for a location and time
   */
  async fetchWindForecast(
    centerPoint: { lat: number; lng: number },
    time: Date,
    venue: SailingVenue,
    config?: Partial<WindFetchConfig>
  ): Promise<WindForecast> {
    // For proof-of-concept, return simulated Hong Kong wind
    // In production, would call weather API (reuse existing WeatherAggregationService)

    // Simulate Hong Kong summer monsoon (SW wind)
    const month = time.getMonth();
    const hour = time.getHours();

    let direction: number;
    let speed: number;
    let type: 'gradient' | 'thermal' | 'combined' = 'gradient';

    if (month >= 4 && month <= 9) {
      // Summer monsoon (May-Sep)
      direction = 225; // SW
      speed = 10 + Math.random() * 5; // 10-15kt

      // If afternoon, may have sea breeze component
      if (hour >= 13 && hour <= 17) {
        type = 'combined';
        direction = 210; // Veering toward S (sea breeze influence)
        speed = 11 + Math.random() * 4; // 11-15kt
      }
    } else {
      // Winter monsoon (Nov-Mar)
      direction = 55; // NE
      speed = 12 + Math.random() * 8; // 12-20kt
    }

    return {
      timestamp: time.toISOString(),
      direction,
      speed,
      gusts: speed + 3 + Math.random() * 3,
      type,
      source: WindDataSource.Manual,
      confidence: 0.7
    };
  }

  /**
   * Calculate wind shadow zones from buildings and terrain
   */
  private calculateWindShadows(
    buildings: BuildingData,
    terrain: TerrainData,
    wind: WindForecast,
    racingArea: GeoJSON.Polygon
  ): WindShadowZone[] {
    const shadows: WindShadowZone[] = [];

    // For each building, calculate wind shadow
    for (const building of buildings.buildings) {
      const shadow = this.projectWindShadow(
        building,
        wind.direction,
        wind.speed
      );

      // Check if shadow intersects racing area
      if (this.shadowIntersectsRacingArea(shadow.polygon, racingArea)) {
        shadows.push(shadow);
      }
    }

    // Sort by severity (most severe first)
    shadows.sort((a, b) => {
      const severityOrder = { severe: 0, moderate: 1, weak: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return shadows;
  }

  /**
   * Project wind shadow from a building
   */
  private projectWindShadow(
    building: Building,
    windDirection: number,
    windSpeed: number
  ): WindShadowZone {
    // Calculate downwind direction (opposite of wind)
    const downwindAngle = (windDirection + 180) % 360;

    // Wind shadow length = building height × (5 to 10)
    // Use 7 as average, could adjust based on atmospheric stability
    const shadowLengthMeters = building.height * 7;

    // Convert to degrees
    const shadowLengthDegrees = shadowLengthMeters / 111320; // ~111km per degree lat

    // Calculate shadow polygon
    // Start at building center, extend downwind
    const dx = Math.sin(downwindAngle * Math.PI / 180) * shadowLengthDegrees;
    const dy = Math.cos(downwindAngle * Math.PI / 180) * shadowLengthDegrees;

    // Shadow endpoint
    const shadowEndLat = building.center.lat + dy;
    const shadowEndLng = building.center.lng + dx;

    // Shadow width (starts at building width, diverges 15% per km)
    const buildingWidthDegrees = 0.0005; // Assume ~50m building width
    const divergenceRate = 0.15; // 15% per km
    const shadowEndWidthDegrees = buildingWidthDegrees * (1 + divergenceRate * (shadowLengthMeters / 1000));

    // Calculate perpendicular vector for width
    const perpAngle = downwindAngle + 90;
    const perpDx = Math.sin(perpAngle * Math.PI / 180);
    const perpDy = Math.cos(perpAngle * Math.PI / 180);

    // Create shadow polygon (trapezoid shape)
    const shadowPolygon: GeoJSON.Polygon = {
      type: 'Polygon',
      coordinates: [[
        // Start (near building), left side
        [
          building.center.lng - perpDx * buildingWidthDegrees / 2,
          building.center.lat - perpDy * buildingWidthDegrees / 2
        ],
        // Start (near building), right side
        [
          building.center.lng + perpDx * buildingWidthDegrees / 2,
          building.center.lat + perpDy * buildingWidthDegrees / 2
        ],
        // End (downwind), right side
        [
          shadowEndLng + perpDx * shadowEndWidthDegrees / 2,
          shadowEndLat + perpDy * shadowEndWidthDegrees / 2
        ],
        // End (downwind), left side
        [
          shadowEndLng - perpDx * shadowEndWidthDegrees / 2,
          shadowEndLat - perpDy * shadowEndWidthDegrees / 2
        ],
        // Close polygon
        [
          building.center.lng - perpDx * buildingWidthDegrees / 2,
          building.center.lat - perpDy * buildingWidthDegrees / 2
        ]
      ]]
    };

    // Calculate wind speed reduction
    // Severe: 70-80% reduction (0-2× height downwind)
    // Moderate: 40-60% reduction (2-5× height downwind)
    // Weak: 20-30% reduction (5-10× height downwind)

    const distanceDownwind = shadowLengthMeters;
    const heightMultiple = distanceDownwind / building.height;

    let reduction: number;
    let severity: 'severe' | 'moderate' | 'weak';

    if (heightMultiple < 2) {
      reduction = 0.75; // 75% reduction
      severity = 'severe';
    } else if (heightMultiple < 5) {
      reduction = 0.50; // 50% reduction
      severity = 'moderate';
    } else {
      reduction = 0.25; // 25% reduction
      severity = 'weak';
    }

    const estimatedSpeed = windSpeed * (1 - reduction);

    return {
      polygon: shadowPolygon,
      obstacle: {
        type: 'building',
        id: building.id,
        name: building.name,
        height: building.height
      },
      reduction,
      estimatedSpeed,
      severity,
      distanceDownwind,
      description: `${building.name || 'Building'} (${building.height}m) creates ${severity} wind shadow extending ${(distanceDownwind / 1000).toFixed(1)}km downwind. Wind reduced to ${estimatedSpeed.toFixed(1)}kt (${(reduction * 100).toFixed(0)}% reduction).`,
      confidence: 0.7
    };
  }

  /**
   * Check if shadow intersects racing area
   */
  private shadowIntersectsRacingArea(
    shadowPolygon: GeoJSON.Polygon,
    racingArea: GeoJSON.Polygon
  ): boolean {
    try {
      const shadowFeature = feature(shadowPolygon);
      const racingFeature = feature(racingArea);

      const intersection = intersect(
        featureCollection([shadowFeature, racingFeature])
      );

      return intersection !== null;
    } catch {
      return false;
    }
  }

  /**
   * Calculate wind acceleration zones
   */
  private calculateAccelerationZones(
    buildings: BuildingData,
    terrain: TerrainData,
    wind: WindForecast,
    racingArea: GeoJSON.Polygon
  ): WindAccelerationZone[] {
    const zones: WindAccelerationZone[] = [];

    // For proof-of-concept, identify gaps between buildings
    // In production, would do more sophisticated analysis

    // Simple implementation: Look for building pairs with gaps aligned with wind
    for (let i = 0; i < buildings.buildings.length; i++) {
      for (let j = i + 1; j < buildings.buildings.length; j++) {
        const b1 = buildings.buildings[i];
        const b2 = buildings.buildings[j];

        // Calculate distance between buildings
        const distance = this.distanceBetweenPoints(b1.center, b2.center);

        // If buildings are close (50-200m) and gap is roughly aligned with wind
        if (distance > 50 && distance < 200) {
          const angleBetween = this.angleBetweenPoints(b1.center, b2.center);
          const windAngle = wind.direction;
          const angleDiff = this.angleDifference(angleBetween, windAngle);

          // If gap is aligned with wind (within 30°)
          if (angleDiff < 30) {
            // Create acceleration zone polygon (simple box between buildings)
            const midLat = (b1.center.lat + b2.center.lat) / 2;
            const midLng = (b1.center.lng + b2.center.lng) / 2;

            const size = 0.0003; // ~30m
            const zonePolygon: GeoJSON.Polygon = {
              type: 'Polygon',
              coordinates: [[
                [midLng - size, midLat - size],
                [midLng + size, midLat - size],
                [midLng + size, midLat + size],
                [midLng - size, midLat + size],
                [midLng - size, midLat - size]
              ]]
            };

            // Estimate acceleration (20-50% increase for narrow gaps)
            const increase = 0.30; // 30% average
            const estimatedSpeed = wind.speed * (1 + increase);

            zones.push({
              polygon: zonePolygon,
              type: 'gap',
              increase,
              estimatedSpeed,
              description: `Wind acceleration through gap between buildings. Wind increases to ${estimatedSpeed.toFixed(1)}kt (${(increase * 100).toFixed(0)}% boost).`,
              confidence: 0.6
            });
          }
        }
      }
    }

    return zones;
  }

  /**
   * Predict thermal wind (sea breeze or land breeze)
   */
  private async predictThermalWind(
    venue: SailingVenue,
    raceTime: Date
  ): Promise<ThermalWindPrediction | undefined> {
    const month = raceTime.getMonth();
    const hour = raceTime.getHours();

    // Sea breeze typically develops in summer (May-Sep) during afternoon (11:00-18:00)
    if (month >= 4 && month <= 9 && hour >= 10 && hour <= 18) {
      // Simulate sea breeze for Hong Kong
      // In production, would fetch land/sea surface temperatures and calculate

      const tempDifferential = 4 + Math.random() * 4; // 4-8°C differential

      return {
        type: 'sea_breeze',
        development: new Date(raceTime).setHours(12, 0, 0, 0).toString(),
        peak: new Date(raceTime).setHours(15, 0, 0, 0).toString(),
        dissipation: new Date(raceTime).setHours(18, 0, 0, 0).toString(),
        direction: 180, // From south (perpendicular to HK coastline)
        speed: 8 + tempDifferential * 0.5, // 8-12kt
        temperatureDifferential: tempDifferential,
        confidence: 0.7,
        description: `Sea breeze develops from south starting 12:00, peaks at 15:00 with ${(8 + tempDifferential * 0.5).toFixed(1)}kt, driven by ${tempDifferential.toFixed(1)}°C land-sea temperature differential.`
      };
    }

    return undefined;
  }

  /**
   * Identify wind battle zones where gradient and thermal winds compete
   */
  private identifyWindBattleZones(
    gradientWind: WindForecast,
    thermalWind: ThermalWindPrediction,
    racingArea: GeoJSON.Polygon
  ): WindBattleZone[] {
    // Simple implementation: If wind directions differ significantly, create shear zone

    const angleDiff = this.angleDifference(gradientWind.direction, thermalWind.direction);

    if (angleDiff > 20) {
      // Significant difference → wind battle zone exists

      // Create simple battle zone polygon (centered in racing area)
      const bounds = this.calculateBounds(racingArea);
      const centerLat = (bounds.north + bounds.south) / 2;
      const centerLng = (bounds.east + bounds.west) / 2;

      const size = 0.005; // ~500m zone
      const battlePolygon: GeoJSON.Polygon = {
        type: 'Polygon',
        coordinates: [[
          [centerLng - size, centerLat - size],
          [centerLng + size, centerLat - size],
          [centerLng + size, centerLat + size],
          [centerLng - size, centerLat + size],
          [centerLng - size, centerLat - size]
        ]]
      };

      return [{
        polygon: battlePolygon,
        gradientWind: {
          direction: gradientWind.direction,
          speed: gradientWind.speed
        },
        thermalWind: {
          direction: thermalWind.direction,
          speed: thermalWind.speed
        },
        behavior: 'gradual_transition',
        description: `Wind battle zone where ${gradientWind.direction}° gradient wind (${gradientWind.speed.toFixed(1)}kt) meets ${thermalWind.direction}° sea breeze (${thermalWind.speed.toFixed(1)}kt). Expect shifty, variable conditions.`
      }];
    }

    return [];
  }

  /**
   * Call Claude API with topographic-wind-analyst Skill loaded
   */
  private async callClaudeWithSkill(data: {
    terrain: TerrainData;
    buildings: BuildingData;
    gradientWind: WindForecast;
    windShadowZones: WindShadowZone[];
    accelerationZones: WindAccelerationZone[];
    thermalWindPrediction?: ThermalWindPrediction;
    windBattleZones?: WindBattleZone[];
    racingArea: GeoJSON.Polygon;
    raceTime: Date;
    raceDuration: number;
    venue: SailingVenue;
  }): Promise<{
    analysis: string;
    recommendations: WindAnalysis['recommendations'];
    confidence: 'high' | 'moderate' | 'low';
    caveats: string[];
  }> {
    // Prepare terrain summary
    const elevations = data.terrain.elevations.flat();
    const minElevation = Math.min(...elevations);
    const maxElevation = Math.max(...elevations);

    // Prepare building summary
    const tallestBuilding = data.buildings.buildings.reduce((max, b) =>
      b.height > max.height ? b : max
    , data.buildings.buildings[0]);

    const prompt = `Analyze this racing area's wind patterns considering terrain, buildings, and thermal effects for strategic sailing race recommendations.

**Venue**: ${data.venue.name} (${data.venue.region})
**Race Time**: ${data.raceTime.toISOString()} (${data.raceDuration} minutes duration)

**Terrain Data**:
- Source: ${data.terrain.source}
- Elevation range: ${minElevation.toFixed(0)}m to ${maxElevation.toFixed(0)}m
- Resolution: ${data.terrain.resolution}m grid
- Notable features: ${maxElevation > 100 ? `Significant terrain up to ${maxElevation.toFixed(0)}m` : 'Mostly flat/water level'}

**Building Data**:
- Source: ${data.buildings.source}
- Buildings: ${data.buildings.count} structures ≥20m height
- Tallest: ${tallestBuilding?.name || 'Unknown'} (${tallestBuilding?.height.toFixed(0)}m)
- Major obstacles: ${data.buildings.buildings.filter(b => b.height > 200).length} buildings >200m

**Gradient Wind Forecast**:
- Direction: ${data.gradientWind.direction}°T
- Speed: ${data.gradientWind.speed.toFixed(1)}kt
- Type: ${data.gradientWind.type}
- Gusts: ${data.gradientWind.gusts?.toFixed(1)}kt

**Wind Shadow Zones**: ${data.windShadowZones.length} identified
${data.windShadowZones.slice(0, 3).map(z => `- ${z.description}`).join('\n')}

**Wind Acceleration Zones**: ${data.accelerationZones.length} identified
${data.accelerationZones.slice(0, 3).map(z => `- ${z.description}`).join('\n')}

${data.thermalWindPrediction ? `
**Thermal Wind Prediction**:
- Type: ${data.thermalWindPrediction.type}
- Development: ${new Date(data.thermalWindPrediction.development).toLocaleTimeString()}
- Peak: ${new Date(data.thermalWindPrediction.peak).toLocaleTimeString()}
- Direction: ${data.thermalWindPrediction.direction}°T at ${data.thermalWindPrediction.speed.toFixed(1)}kt
- Temperature differential: ${data.thermalWindPrediction.temperatureDifferential.toFixed(1)}°C
` : ''}

${data.windBattleZones && data.windBattleZones.length > 0 ? `
**Wind Battle Zones**: ${data.windBattleZones.length} identified
${data.windBattleZones.map(z => `- ${z.description}`).join('\n')}
` : ''}

**Racing Area** (GeoJSON):
${JSON.stringify(data.racingArea, null, 2)}

Please provide a comprehensive wind-terrain analysis with the following structure:

1. **Wind-Terrain Summary**: Key obstacles and wind patterns
2. **Wind Shadow Analysis**: Shadow zones to avoid
3. **Wind Acceleration Analysis**: Zones to favor
4. **Thermal Wind Forecast** (if applicable): Sea breeze timing and impact
5. **Strategic Recommendations**:
   - Start line strategy (favored end, approach, timing)
   - Upwind strategy (favored side, features to leverage/avoid)
   - Downwind strategy (favored side, features to leverage/avoid)
   - Mark roundings (expected wind behavior, approach recommendations)
   - Overall timing (is this a good time to race? if not, when would be optimal?)
6. **Confidence & Caveats**: How confident are you? What factors could change the analysis?

Format your response as JSON:
{
  "analysis": "Full natural language analysis covering all 6 sections...",
  "recommendations": {
    "startStrategy": "...",
    "upwindStrategy": "...",
    "downwindStrategy": "...",
    "markRoundings": "...",
    "timingOptimal": true/false,
    "bestRaceTime": "..." (if not optimal),
    "timing": "..."
  },
  "confidence": "high" | "moderate" | "low",
  "caveats": ["caveat 1", "caveat 2", ...]
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: prompt
        }]
        // Note: Skills will be loaded via project configuration in production
      });

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
            timingOptimal: true,
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
      throw new Error(`Failed to generate AI analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods

  private calculateBounds(polygon: GeoJSON.Polygon): {
    north: number;
    south: number;
    east: number;
    west: number;
  } {
    const coords = polygon.coordinates[0];

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

  private calculateCenterPoint(polygon: GeoJSON.Polygon): { lat: number; lng: number } {
    const featureObj = feature(polygon);
    const center = centroid(featureObj);
    return {
      lng: center.geometry.coordinates[0],
      lat: center.geometry.coordinates[1]
    };
  }

  private distanceBetweenPoints(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): number {
    const from = point([p1.lng, p1.lat]);
    const to = point([p2.lng, p2.lat]);
    return distance(from, to, { units: 'meters' });
  }

  private angleBetweenPoints(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): number {
    const dy = p2.lat - p1.lat;
    const dx = p2.lng - p1.lng;
    const angle = Math.atan2(dx, dy) * 180 / Math.PI;
    return (angle + 360) % 360;
  }

  private angleDifference(angle1: number, angle2: number): number {
    const diff = Math.abs(angle1 - angle2);
    return Math.min(diff, 360 - diff);
  }
}
