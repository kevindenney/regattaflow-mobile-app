/**
 * Weather Routing Types
 *
 * Types for the Weather Routing Check wizard that provides:
 * - Weather conditions along the route at each waypoint/leg
 * - Multi-model weather comparison (GFS, ECMWF, etc.)
 * - Decision points and timing recommendations
 * - GRIB file visualization (Phase 2)
 */

import type { RouteWaypoint, WindData, WaveData, TideData } from './raceEvents';

// =============================================================================
// Core Analysis Types
// =============================================================================

/**
 * Main weather routing analysis result
 */
export interface WeatherRoutingAnalysis {
  id: string;
  raceEventId: string;
  analyzedAt: Date;
  legs: LegWeatherAnalysis[];
  models: ModelForecast[];
  modelAgreement: ModelAgreementSummary;
  decisionPoints: DecisionPoint[];
  optimalDeparture?: OptimalTimingWindow;
  sailPlan: SailChangePlan[];
  overallRisk: RiskLevel;
  recommendations: RoutingRecommendation[];
  totalDistanceNm: number;
  estimatedDurationHours: number;
}

/**
 * Weather analysis for a single leg of the route
 */
export interface LegWeatherAnalysis {
  legIndex: number;
  fromWaypoint: RouteWaypoint;
  toWaypoint: RouteWaypoint;
  distanceNm: number;
  bearingDeg: number;
  estimatedDurationHours: number;
  eta: Date;
  weather: LegWeatherConditions;
  tacticalAdvice?: string;
  riskLevel: RiskLevel;
  sailRecommendation?: string;
}

/**
 * Weather conditions for a route leg
 */
export interface LegWeatherConditions {
  wind: {
    speedMin: number;
    speedMax: number;
    speedAvg: number;
    directionStart: number;
    directionEnd: number;
    shift: number; // Degrees of shift during leg
    gusts?: number;
  };
  waves?: {
    heightMin: number;
    heightMax: number;
    heightAvg: number;
    period: number;
    direction: number;
  };
  current?: {
    speed: number;
    direction: number;
    favorable: boolean; // True if current helps progress
  };
  visibility?: 'good' | 'moderate' | 'poor';
  precipitation?: number; // mm
}

// =============================================================================
// Model Comparison Types
// =============================================================================

/**
 * Forecast from a single weather model
 */
export interface ModelForecast {
  modelName: WeatherModelName;
  modelDisplayName: string;
  source: WeatherSource;
  forecastTime: Date;
  modelRunTime: Date;
  confidence: number; // 0-100
  hourlyData: HourlyModelData[];
}

/**
 * Hourly data point from a weather model
 */
export interface HourlyModelData {
  time: Date;
  windSpeed: number;
  windDirection: number;
  gusts?: number;
  waveHeight?: number;
  waveDirection?: number;
  wavePeriod?: number;
  precipitation?: number;
  cloudCover?: number;
  pressure?: number;
}

/**
 * Known weather model names
 */
export type WeatherModelName =
  | 'GFS'      // NOAA Global Forecast System
  | 'ECMWF'    // European Centre for Medium-Range Weather Forecasts
  | 'NAM'      // North American Mesoscale Model
  | 'ICON'     // German DWD model
  | 'UKMO'     // UK Met Office
  | 'JMA'      // Japan Meteorological Agency
  | 'HKO'      // Hong Kong Observatory
  | 'BOM'      // Australia Bureau of Meteorology
  | 'STORMGLASS' // StormGlass aggregated
  | 'OPENMETEO'  // Open-Meteo
  | string;      // Allow custom models

/**
 * Weather data source/provider
 */
export type WeatherSource =
  | 'noaa'
  | 'ecmwf'
  | 'stormglass'
  | 'openmeteo'
  | 'hko'
  | 'ukmo'
  | 'dwd'
  | 'bom'
  | 'grib'  // User-uploaded GRIB file
  | string;

/**
 * Summary of agreement between weather models
 */
export interface ModelAgreementSummary {
  overallAgreement: AgreementLevel;
  agreementScore: number; // 0-100
  disagreementPeriods: DisagreementPeriod[];
  consensusWindSpeed: { min: number; max: number; avg: number };
  consensusWindDirection: { min: number; max: number; avg: number };
  modelCount: number;
}

export type AgreementLevel = 'high' | 'moderate' | 'low';

/**
 * Period where models significantly disagree
 */
export interface DisagreementPeriod {
  startTime: Date;
  endTime: Date;
  location?: { lat: number; lng: number };
  legIndex?: number;
  windSpeedSpread: number;  // Max difference between models (kts)
  directionSpread: number;  // Max direction difference (degrees)
  concern: string;          // "Models disagree on wind speed by 8 kts"
  recommendation: string;   // "Plan for stronger conditions"
}

// =============================================================================
// Decision Point Types
// =============================================================================

/**
 * Strategic decision point along the route
 */
export interface DecisionPoint {
  id: string;
  type: DecisionPointType;
  location: { lat: number; lng: number };
  legIndex: number;
  estimatedTime: Date;
  description: string;
  conditions: LegWeatherConditions;
  options?: DecisionOption[];
  recommendation: string;
  priority: DecisionPriority;
}

export type DecisionPointType =
  | 'sail_change'
  | 'route_decision'
  | 'weather_window'
  | 'tack_point'
  | 'gybe_point'
  | 'current_change'
  | 'wind_shift'
  | 'landfall'
  | 'departure';

export type DecisionPriority = 'critical' | 'important' | 'consider';

/**
 * Option at a decision point
 */
export interface DecisionOption {
  label: string;
  description: string;
  pros: string[];
  cons: string[];
  recommended: boolean;
}

// =============================================================================
// Planning Types
// =============================================================================

/**
 * Planned sail change along the route
 */
export interface SailChangePlan {
  legIndex: number;
  atDistanceNm: number;    // nm from leg start
  atTime: Date;
  fromSail: string;
  toSail: string;
  reason: string;
  windConditions: {
    speed: number;
    direction: number;
  };
}

/**
 * Optimal timing window for departure
 */
export interface OptimalTimingWindow {
  optimalStartTime: Date;
  windowStart: Date;
  windowEnd: Date;
  reasoning: string;
  weatherAdvantages: string[];
  risks: string[];
}

/**
 * Risk level assessment
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';

/**
 * Routing recommendation
 */
export interface RoutingRecommendation {
  category: RecommendationCategory;
  title: string;
  description: string;
  priority: DecisionPriority;
  legIndex?: number;
  relatedDecisionPointId?: string;
}

export type RecommendationCategory = 'timing' | 'sail' | 'route' | 'safety' | 'weather';

// =============================================================================
// GRIB Data Types (Phase 2)
// =============================================================================

/**
 * Parsed GRIB file data
 */
export interface GribData {
  sourceFile: string;
  modelName: string;
  modelRunTime: Date;
  validTime: Date;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  resolution: number; // degrees
  grid: GribGridPoint[];
}

/**
 * Single GRIB grid point
 */
export interface GribGridPoint {
  lat: number;
  lng: number;
  windU: number;     // U component (m/s)
  windV: number;     // V component (m/s)
  windSpeed: number; // Calculated speed (kts)
  windDirection: number; // Calculated direction (degrees)
  waveHeight?: number;
  pressure?: number;
}

// =============================================================================
// Service Request/Response Types
// =============================================================================

/**
 * Parameters for requesting route weather analysis
 */
export interface GetRouteWeatherParams {
  raceEventId: string;
  waypoints: RouteWaypoint[];
  startTime: Date;
  boatId?: string;
  avgBoatSpeedKts?: number;
  models?: WeatherModelName[];
  hoursAhead?: number;
}

/**
 * Parameters for model comparison
 */
export interface GetModelComparisonParams {
  location: { lat: number; lng: number };
  startTime: Date;
  hours: number;
  models?: WeatherModelName[];
}

/**
 * Wizard state for saving/restoring
 */
export interface WeatherRoutingWizardState {
  step: WeatherRoutingStep;
  analysis: WeatherRoutingAnalysis | null;
  selectedModels: WeatherModelName[];
  avgBoatSpeedKts: number;
  userNotes: string;
  savedAt?: Date;
}

export type WeatherRoutingStep =
  | 'loading'
  | 'overview'
  | 'legs'
  | 'models'
  | 'decisions'
  | 'confirm';
