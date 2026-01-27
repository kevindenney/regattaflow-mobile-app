/**
 * Weather Routing Service
 *
 * Provides weather analysis along sailing routes including:
 * - Weather conditions at each waypoint/leg
 * - Multi-model weather comparison
 * - Decision point identification
 * - Optimal timing recommendations
 */

import type { RouteWaypoint } from '@/types/raceEvents';
import type {
  WeatherRoutingAnalysis,
  LegWeatherAnalysis,
  LegWeatherConditions,
  ModelForecast,
  HourlyModelData,
  ModelAgreementSummary,
  AgreementLevel,
  DisagreementPeriod,
  DecisionPoint,
  DecisionPointType,
  SailChangePlan,
  OptimalTimingWindow,
  RiskLevel,
  RoutingRecommendation,
  GetRouteWeatherParams,
  GetModelComparisonParams,
  WeatherModelName,
} from '@/types/weatherRouting';
import { OpenMeteoService } from './weather/OpenMeteoService';
import { StormGlassService } from './weather/StormGlassService';
import Constants from 'expo-constants';

// =============================================================================
// Types
// =============================================================================

interface GeoLocation {
  latitude: number;
  longitude: number;
}

// =============================================================================
// Service Implementation
// =============================================================================

export class WeatherRoutingService {
  private openMeteoService: OpenMeteoService;
  private stormGlassService: StormGlassService | null = null;

  constructor() {
    this.openMeteoService = new OpenMeteoService();
    this.initializeStormGlass();
  }

  private initializeStormGlass(): void {
    const apiKey =
      Constants.expoConfig?.extra?.stormglassApiKey ||
      process.env.EXPO_PUBLIC_STORMGLASS_API_KEY;

    if (apiKey) {
      this.stormGlassService = new StormGlassService({
        apiKey,
        baseUrl: 'https://api.stormglass.io/v2',
        timeout: 10000,
        retryAttempts: 3,
      });
    }
  }

  // ===========================================================================
  // Main Analysis Methods
  // ===========================================================================

  /**
   * Get comprehensive weather routing analysis for a route
   */
  async getRouteWeatherAnalysis(
    params: GetRouteWeatherParams
  ): Promise<WeatherRoutingAnalysis> {
    const {
      raceEventId,
      waypoints,
      startTime,
      avgBoatSpeedKts = 6,
      models = ['OPENMETEO', 'GFS'],
      hoursAhead = 72,
    } = params;

    // Calculate leg information
    const legs = await this.calculateLegWeather(
      waypoints,
      startTime,
      avgBoatSpeedKts
    );

    // Get multi-model forecasts at route centroid
    const centroid = this.calculateRouteCentroid(waypoints);
    const modelForecasts = await this.getMultiModelForecasts({
      location: { lat: centroid.latitude, lng: centroid.longitude },
      startTime,
      hours: hoursAhead,
      models,
    });

    // Calculate model agreement
    const modelAgreement = this.calculateModelAgreement(modelForecasts);

    // Identify decision points
    const decisionPoints = this.identifyDecisionPoints(legs);

    // Calculate sail change plan
    const sailPlan = this.calculateSailPlan(legs);

    // Calculate overall risk
    const overallRisk = this.calculateOverallRisk(legs, modelAgreement);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      legs,
      modelAgreement,
      decisionPoints
    );

    // Calculate totals
    const totalDistanceNm = legs.reduce((sum, leg) => sum + leg.distanceNm, 0);
    const estimatedDurationHours = legs.reduce(
      (sum, leg) => sum + leg.estimatedDurationHours,
      0
    );

    return {
      id: `wr-${Date.now()}`,
      raceEventId,
      analyzedAt: new Date(),
      legs,
      models: modelForecasts,
      modelAgreement,
      decisionPoints,
      sailPlan,
      overallRisk,
      recommendations,
      totalDistanceNm,
      estimatedDurationHours,
    };
  }

  /**
   * Get weather forecasts from multiple models
   */
  async getMultiModelForecasts(
    params: GetModelComparisonParams
  ): Promise<ModelForecast[]> {
    const { location, startTime, hours, models = ['OPENMETEO', 'GFS'] } = params;
    const geoLocation: GeoLocation = { latitude: location.lat, longitude: location.lng };

    const forecasts: ModelForecast[] = [];

    // Always fetch OpenMeteo (free, always available)
    if (models.includes('OPENMETEO')) {
      try {
        const openMeteoData = await this.fetchOpenMeteoForecast(
          geoLocation,
          startTime,
          hours
        );
        if (openMeteoData) {
          forecasts.push(openMeteoData);
        }
      } catch (err) {
        console.warn('[WeatherRoutingService] OpenMeteo fetch failed:', err);
      }
    }

    // Fetch StormGlass if available (provides access to multiple models)
    if (this.stormGlassService) {
      const stormGlassModels = models.filter((m) =>
        ['GFS', 'ECMWF', 'ICON', 'STORMGLASS'].includes(m)
      );

      for (const modelName of stormGlassModels) {
        try {
          const sgData = await this.fetchStormGlassForecast(
            geoLocation,
            startTime,
            hours,
            modelName as WeatherModelName
          );
          if (sgData) {
            forecasts.push(sgData);
          }
        } catch (err) {
          console.warn(
            `[WeatherRoutingService] StormGlass ${modelName} fetch failed:`,
            err
          );
        }
      }
    }

    return forecasts;
  }

  // ===========================================================================
  // Leg Weather Calculation
  // ===========================================================================

  /**
   * Calculate weather conditions for each leg of the route
   */
  private async calculateLegWeather(
    waypoints: RouteWaypoint[],
    startTime: Date,
    avgBoatSpeedKts: number
  ): Promise<LegWeatherAnalysis[]> {
    const legs: LegWeatherAnalysis[] = [];
    let cumulativeTime = new Date(startTime);

    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];

      // Calculate leg geometry
      const distanceNm = this.calculateDistanceNm(
        from.latitude,
        from.longitude,
        to.latitude,
        to.longitude
      );
      const bearingDeg = this.calculateBearing(
        from.latitude,
        from.longitude,
        to.latitude,
        to.longitude
      );

      // Estimate duration based on boat speed
      const estimatedDurationHours = distanceNm / avgBoatSpeedKts;

      // Get weather at leg midpoint
      const midLat = (from.latitude + to.latitude) / 2;
      const midLng = (from.longitude + to.longitude) / 2;

      const legEta = new Date(
        cumulativeTime.getTime() + estimatedDurationHours * 60 * 60 * 1000
      );

      // Fetch weather for this leg
      const weather = await this.fetchLegWeather(
        { latitude: midLat, longitude: midLng },
        cumulativeTime,
        legEta
      );

      // Assess risk level
      const riskLevel = this.assessLegRisk(weather);

      // Get sail recommendation
      const sailRecommendation = this.getSailRecommendation(weather);

      legs.push({
        legIndex: i,
        fromWaypoint: from,
        toWaypoint: to,
        distanceNm,
        bearingDeg,
        estimatedDurationHours,
        eta: legEta,
        weather,
        riskLevel,
        sailRecommendation,
      });

      // Update cumulative time for next leg
      cumulativeTime = legEta;
    }

    return legs;
  }

  /**
   * Fetch weather conditions for a specific leg
   */
  private async fetchLegWeather(
    location: GeoLocation,
    startTime: Date,
    endTime: Date
  ): Promise<LegWeatherConditions> {
    try {
      const forecasts = await this.openMeteoService.getMarineWeather(location, 72);

      // Filter forecasts to leg time window
      const legForecasts = forecasts.filter((f) => {
        const forecastTime = new Date(f.timestamp);
        return forecastTime >= startTime && forecastTime <= endTime;
      });

      if (legForecasts.length === 0) {
        // Return default conditions if no data
        return this.getDefaultLegConditions();
      }

      // Calculate aggregated conditions
      const windSpeeds = legForecasts.map((f) => f.wind.speed);
      const windDirections = legForecasts.map((f) => f.wind.direction);
      const waveHeights = legForecasts
        .map((f) => f.waves?.height)
        .filter((h): h is number => h !== undefined);

      return {
        wind: {
          speedMin: Math.min(...windSpeeds),
          speedMax: Math.max(...windSpeeds),
          speedAvg: windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length,
          directionStart: windDirections[0],
          directionEnd: windDirections[windDirections.length - 1],
          shift: this.calculateDirectionShift(
            windDirections[0],
            windDirections[windDirections.length - 1]
          ),
          gusts: legForecasts[0]?.wind.gusts,
        },
        waves:
          waveHeights.length > 0
            ? {
                heightMin: Math.min(...waveHeights),
                heightMax: Math.max(...waveHeights),
                heightAvg:
                  waveHeights.reduce((a, b) => a + b, 0) / waveHeights.length,
                period: legForecasts[0]?.waves?.period || 0,
                direction: legForecasts[0]?.waves?.direction || 0,
              }
            : undefined,
        visibility: 'good',
      };
    } catch (err) {
      console.warn('[WeatherRoutingService] Error fetching leg weather:', err);
      return this.getDefaultLegConditions();
    }
  }

  private getDefaultLegConditions(): LegWeatherConditions {
    return {
      wind: {
        speedMin: 10,
        speedMax: 15,
        speedAvg: 12,
        directionStart: 180,
        directionEnd: 180,
        shift: 0,
      },
      visibility: 'good',
    };
  }

  // ===========================================================================
  // Model Comparison
  // ===========================================================================

  /**
   * Calculate agreement summary between multiple weather models
   */
  calculateModelAgreement(forecasts: ModelForecast[]): ModelAgreementSummary {
    if (forecasts.length < 2) {
      return {
        overallAgreement: 'high',
        agreementScore: 100,
        disagreementPeriods: [],
        consensusWindSpeed: { min: 0, max: 0, avg: 0 },
        consensusWindDirection: { min: 0, max: 0, avg: 0 },
        modelCount: forecasts.length,
      };
    }

    const disagreementPeriods: DisagreementPeriod[] = [];
    const allWindSpeeds: number[] = [];
    const allWindDirections: number[] = [];

    // Get common time range
    const allTimes = forecasts.flatMap((f) =>
      f.hourlyData.map((h) => h.time.getTime())
    );
    const minTime = Math.max(...forecasts.map((f) => f.hourlyData[0]?.time.getTime() || 0));
    const maxTime = Math.min(
      ...forecasts.map(
        (f) => f.hourlyData[f.hourlyData.length - 1]?.time.getTime() || Infinity
      )
    );

    // Compare at each hour
    let totalSpread = 0;
    let hourCount = 0;

    for (let t = minTime; t <= maxTime; t += 3600000) {
      // hourly
      const hourData = forecasts.map((f) => {
        const match = f.hourlyData.find(
          (h) => Math.abs(h.time.getTime() - t) < 1800000
        );
        return match;
      });

      const validData = hourData.filter(
        (d): d is HourlyModelData => d !== undefined
      );
      if (validData.length < 2) continue;

      const speeds = validData.map((d) => d.windSpeed);
      const directions = validData.map((d) => d.windDirection);

      allWindSpeeds.push(...speeds);
      allWindDirections.push(...directions);

      const speedSpread = Math.max(...speeds) - Math.min(...speeds);
      const dirSpread = this.calculateDirectionSpread(directions);

      totalSpread += speedSpread;
      hourCount++;

      // Flag significant disagreement (>5kt wind speed or >30deg direction)
      if (speedSpread > 5 || dirSpread > 30) {
        const existingPeriod = disagreementPeriods.find(
          (p) => p.endTime.getTime() === t - 3600000
        );

        if (existingPeriod) {
          existingPeriod.endTime = new Date(t);
          existingPeriod.windSpeedSpread = Math.max(
            existingPeriod.windSpeedSpread,
            speedSpread
          );
          existingPeriod.directionSpread = Math.max(
            existingPeriod.directionSpread,
            dirSpread
          );
        } else {
          disagreementPeriods.push({
            startTime: new Date(t),
            endTime: new Date(t + 3600000),
            windSpeedSpread: speedSpread,
            directionSpread: dirSpread,
            concern: `Models disagree on wind speed by ${speedSpread.toFixed(0)} kts`,
            recommendation:
              speedSpread > 8
                ? 'Plan for stronger conditions'
                : 'Monitor forecasts closely',
          });
        }
      }
    }

    // Calculate overall agreement score
    const avgSpread = hourCount > 0 ? totalSpread / hourCount : 0;
    const agreementScore = Math.max(0, 100 - avgSpread * 10);

    let overallAgreement: AgreementLevel = 'high';
    if (agreementScore < 60) overallAgreement = 'low';
    else if (agreementScore < 80) overallAgreement = 'moderate';

    return {
      overallAgreement,
      agreementScore: Math.round(agreementScore),
      disagreementPeriods,
      consensusWindSpeed: {
        min: Math.min(...allWindSpeeds),
        max: Math.max(...allWindSpeeds),
        avg: allWindSpeeds.reduce((a, b) => a + b, 0) / allWindSpeeds.length,
      },
      consensusWindDirection: {
        min: Math.min(...allWindDirections),
        max: Math.max(...allWindDirections),
        avg:
          allWindDirections.reduce((a, b) => a + b, 0) / allWindDirections.length,
      },
      modelCount: forecasts.length,
    };
  }

  // ===========================================================================
  // Decision Points
  // ===========================================================================

  /**
   * Identify key decision points along the route
   */
  identifyDecisionPoints(legs: LegWeatherAnalysis[]): DecisionPoint[] {
    const decisionPoints: DecisionPoint[] = [];

    legs.forEach((leg, index) => {
      // Check for significant wind shifts
      if (Math.abs(leg.weather.wind.shift) > 20) {
        decisionPoints.push({
          id: `dp-shift-${index}`,
          type: 'wind_shift',
          location: {
            lat: leg.toWaypoint.latitude,
            lng: leg.toWaypoint.longitude,
          },
          legIndex: index,
          estimatedTime: leg.eta,
          description: `${leg.weather.wind.shift > 0 ? 'Veering' : 'Backing'} ${Math.abs(leg.weather.wind.shift).toFixed(0)}° wind shift`,
          conditions: leg.weather,
          recommendation: this.getWindShiftRecommendation(leg.weather.wind.shift),
          priority: Math.abs(leg.weather.wind.shift) > 40 ? 'critical' : 'important',
        });
      }

      // Check for large wind speed changes
      const speedChange = leg.weather.wind.speedMax - leg.weather.wind.speedMin;
      if (speedChange > 8) {
        decisionPoints.push({
          id: `dp-speed-${index}`,
          type: 'sail_change',
          location: {
            lat: (leg.fromWaypoint.latitude + leg.toWaypoint.latitude) / 2,
            lng: (leg.fromWaypoint.longitude + leg.toWaypoint.longitude) / 2,
          },
          legIndex: index,
          estimatedTime: new Date(
            leg.eta.getTime() - (leg.estimatedDurationHours * 30 * 60 * 1000)
          ),
          description: `Wind changing ${speedChange.toFixed(0)} kts - prepare for sail change`,
          conditions: leg.weather,
          recommendation: this.getSailChangeRecommendation(leg.weather),
          priority: speedChange > 12 ? 'critical' : 'important',
        });
      }

      // Check waypoint types
      if (leg.toWaypoint.type === 'gate') {
        decisionPoints.push({
          id: `dp-gate-${index}`,
          type: 'route_decision',
          location: {
            lat: leg.toWaypoint.latitude,
            lng: leg.toWaypoint.longitude,
          },
          legIndex: index,
          estimatedTime: leg.eta,
          description: `Gate at ${leg.toWaypoint.name} - evaluate conditions`,
          conditions: leg.weather,
          recommendation: 'Assess current and wind conditions for optimal gate choice',
          priority: 'important',
        });
      }
    });

    // Sort by time
    return decisionPoints.sort(
      (a, b) => a.estimatedTime.getTime() - b.estimatedTime.getTime()
    );
  }

  // ===========================================================================
  // Sail Planning
  // ===========================================================================

  /**
   * Calculate sail change plan based on leg conditions
   */
  calculateSailPlan(legs: LegWeatherAnalysis[]): SailChangePlan[] {
    const plan: SailChangePlan[] = [];
    let currentSail = 'Main + Jib'; // Default starting sail

    legs.forEach((leg, index) => {
      const recommendedSail = this.getSailRecommendation(leg.weather) || currentSail;

      if (recommendedSail !== currentSail) {
        plan.push({
          legIndex: index,
          atDistanceNm: 0, // At leg start
          atTime: new Date(
            leg.eta.getTime() - leg.estimatedDurationHours * 60 * 60 * 1000
          ),
          fromSail: currentSail,
          toSail: recommendedSail,
          reason: this.getSailChangeReason(leg.weather),
          windConditions: {
            speed: leg.weather.wind.speedAvg,
            direction: leg.weather.wind.directionStart,
          },
        });
        currentSail = recommendedSail;
      }
    });

    return plan;
  }

  // ===========================================================================
  // Risk Assessment
  // ===========================================================================

  /**
   * Calculate overall risk level for the route
   */
  calculateOverallRisk(
    legs: LegWeatherAnalysis[],
    modelAgreement: ModelAgreementSummary
  ): RiskLevel {
    const legRisks = legs.map((l) => l.riskLevel);

    // Count risk levels
    const riskCounts = {
      extreme: legRisks.filter((r) => r === 'extreme').length,
      high: legRisks.filter((r) => r === 'high').length,
      medium: legRisks.filter((r) => r === 'medium').length,
      low: legRisks.filter((r) => r === 'low').length,
    };

    // Any extreme = extreme overall
    if (riskCounts.extreme > 0) return 'extreme';

    // Multiple high or low model agreement = high
    if (riskCounts.high > 1 || modelAgreement.overallAgreement === 'low')
      return 'high';

    // Any high or moderate agreement issues = medium
    if (riskCounts.high > 0 || modelAgreement.overallAgreement === 'moderate')
      return 'medium';

    return 'low';
  }

  /**
   * Assess risk level for a single leg
   */
  private assessLegRisk(weather: LegWeatherConditions): RiskLevel {
    const maxWind = weather.wind.speedMax;
    const maxWave = weather.waves?.heightMax || 0;

    if (maxWind > 35 || maxWave > 4) return 'extreme';
    if (maxWind > 25 || maxWave > 2.5) return 'high';
    if (maxWind > 18 || maxWave > 1.5) return 'medium';
    return 'low';
  }

  // ===========================================================================
  // Recommendations
  // ===========================================================================

  /**
   * Generate routing recommendations based on analysis
   */
  generateRecommendations(
    legs: LegWeatherAnalysis[],
    modelAgreement: ModelAgreementSummary,
    decisionPoints: DecisionPoint[]
  ): RoutingRecommendation[] {
    const recommendations: RoutingRecommendation[] = [];

    // Model disagreement warning
    if (modelAgreement.overallAgreement !== 'high') {
      recommendations.push({
        category: 'weather',
        title: 'Model Uncertainty',
        description:
          modelAgreement.overallAgreement === 'low'
            ? 'Weather models show significant disagreement. Update forecasts frequently and plan for worst-case conditions.'
            : 'Some model disagreement detected. Monitor forecast updates.',
        priority: modelAgreement.overallAgreement === 'low' ? 'critical' : 'important',
      });
    }

    // High risk leg warnings
    const highRiskLegs = legs.filter(
      (l) => l.riskLevel === 'high' || l.riskLevel === 'extreme'
    );
    highRiskLegs.forEach((leg) => {
      recommendations.push({
        category: 'safety',
        title: `Challenging Conditions - Leg ${leg.legIndex + 1}`,
        description: `${leg.fromWaypoint.name} to ${leg.toWaypoint.name}: Winds ${leg.weather.wind.speedMin.toFixed(0)}-${leg.weather.wind.speedMax.toFixed(0)} kts${leg.weather.waves ? `, waves ${leg.weather.waves.heightMax.toFixed(1)}m` : ''}`,
        priority: leg.riskLevel === 'extreme' ? 'critical' : 'important',
        legIndex: leg.legIndex,
      });
    });

    // Sail change reminders
    const criticalDecisions = decisionPoints.filter(
      (dp) => dp.priority === 'critical'
    );
    criticalDecisions.forEach((dp) => {
      recommendations.push({
        category: 'sail',
        title: dp.description,
        description: dp.recommendation,
        priority: 'critical',
        legIndex: dp.legIndex,
        relatedDecisionPointId: dp.id,
      });
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, important: 1, consider: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // ===========================================================================
  // Data Fetching Helpers
  // ===========================================================================

  private async fetchOpenMeteoForecast(
    location: GeoLocation,
    startTime: Date,
    hours: number
  ): Promise<ModelForecast | null> {
    try {
      const forecasts = await this.openMeteoService.getMarineWeather(
        location,
        hours
      );

      const hourlyData: HourlyModelData[] = forecasts.map((f) => ({
        time: new Date(f.timestamp),
        windSpeed: f.wind.speed,
        windDirection: f.wind.direction,
        gusts: f.wind.gusts,
        waveHeight: f.waves?.height,
        waveDirection: f.waves?.direction,
        wavePeriod: f.waves?.period,
        cloudCover: f.cloudCover,
        pressure: f.pressure?.sealevel ?? 1013.25,
      }));

      return {
        modelName: 'OPENMETEO',
        modelDisplayName: 'Open-Meteo',
        source: 'openmeteo',
        forecastTime: new Date(),
        modelRunTime: new Date(),
        confidence: 75,
        hourlyData,
      };
    } catch (err) {
      console.error('[WeatherRoutingService] OpenMeteo fetch error:', err);
      return null;
    }
  }

  private async fetchStormGlassForecast(
    location: GeoLocation,
    startTime: Date,
    hours: number,
    modelName: WeatherModelName
  ): Promise<ModelForecast | null> {
    if (!this.stormGlassService) return null;

    try {
      const forecasts = await this.stormGlassService.getMarineWeather(
        location,
        hours
      );

      if (!forecasts || forecasts.length === 0) return null;

      const hourlyData: HourlyModelData[] = forecasts.map((f) => ({
        time: new Date(f.timestamp),
        windSpeed: f.wind.speed,
        windDirection: f.wind.direction,
        gusts: f.wind.gusts,
        waveHeight: f.waves?.height,
        waveDirection: f.waves?.direction,
        wavePeriod: f.waves?.period,
        cloudCover: f.cloudCover,
        pressure: f.pressure?.sealevel ?? 1013.25,
      }));

      return {
        modelName,
        modelDisplayName: this.getModelDisplayName(modelName),
        source: 'stormglass',
        forecastTime: new Date(),
        modelRunTime: new Date(),
        confidence: 85,
        hourlyData,
      };
    } catch (err) {
      console.error(`[WeatherRoutingService] StormGlass ${modelName} error:`, err);
      return null;
    }
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  private calculateRouteCentroid(waypoints: RouteWaypoint[]): GeoLocation {
    const sumLat = waypoints.reduce((sum, wp) => sum + wp.latitude, 0);
    const sumLng = waypoints.reduce((sum, wp) => sum + wp.longitude, 0);
    return {
      latitude: sumLat / waypoints.length,
      longitude: sumLng / waypoints.length,
    };
  }

  private calculateDistanceNm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3440.065; // Earth radius in nautical miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private calculateBearing(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const dLon = this.toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(this.toRad(lat2));
    const x =
      Math.cos(this.toRad(lat1)) * Math.sin(this.toRad(lat2)) -
      Math.sin(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.cos(dLon);
    let bearing = this.toDeg(Math.atan2(y, x));
    return (bearing + 360) % 360;
  }

  private calculateDirectionShift(dir1: number, dir2: number): number {
    let diff = dir2 - dir1;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
  }

  private calculateDirectionSpread(directions: number[]): number {
    if (directions.length < 2) return 0;
    let maxSpread = 0;
    for (let i = 0; i < directions.length; i++) {
      for (let j = i + 1; j < directions.length; j++) {
        const spread = Math.abs(
          this.calculateDirectionShift(directions[i], directions[j])
        );
        maxSpread = Math.max(maxSpread, spread);
      }
    }
    return maxSpread;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  private toDeg(rad: number): number {
    return (rad * 180) / Math.PI;
  }

  private getSailRecommendation(weather: LegWeatherConditions): string | undefined {
    const avgWind = weather.wind.speedAvg;

    if (avgWind < 8) return 'Light Air Sails';
    if (avgWind < 14) return 'Full Main + Genoa';
    if (avgWind < 20) return 'Full Main + Jib';
    if (avgWind < 28) return 'Reefed Main + Jib';
    if (avgWind < 35) return 'Double Reef + Storm Jib';
    return 'Storm Sails';
  }

  private getSailChangeReason(weather: LegWeatherConditions): string {
    const avgWind = weather.wind.speedAvg;
    if (avgWind < 8) return 'Light conditions require larger sail area';
    if (avgWind > 25) return 'Strong winds require reduced sail area';
    return 'Optimizing for expected conditions';
  }

  private getSailChangeRecommendation(weather: LegWeatherConditions): string {
    const newSail = this.getSailRecommendation(weather);
    return newSail
      ? `Prepare ${newSail} configuration`
      : 'Assess conditions and adjust sail plan';
  }

  private getWindShiftRecommendation(shift: number): string {
    const direction = shift > 0 ? 'right' : 'left';
    const magnitude = Math.abs(shift);

    if (magnitude > 40) {
      return `Major wind shift. Expect significant course changes to ${direction}.`;
    }
    return `Moderate wind shift. Favors ${direction} side of course.`;
  }

  private getModelDisplayName(modelName: WeatherModelName): string {
    const names: Record<string, string> = {
      GFS: 'NOAA GFS',
      ECMWF: 'ECMWF IFS',
      NAM: 'NOAA NAM',
      ICON: 'DWD ICON',
      UKMO: 'UK Met Office',
      STORMGLASS: 'StormGlass',
      OPENMETEO: 'Open-Meteo',
    };
    return names[modelName] || modelName;
  }
}

// Export singleton instance
export const weatherRoutingService = new WeatherRoutingService();
