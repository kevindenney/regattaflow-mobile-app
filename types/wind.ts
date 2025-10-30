/**
 * Topographic and Wind Analysis Types
 *
 * Types for terrain elevation, building data, and wind-terrain interaction analysis
 * used for strategic racing recommendations.
 */

import type { SailingVenue } from '@/lib/types/global-venues';
import type { UnderwaterAnalysis } from './bathymetry';

/**
 * Terrain elevation data for a racing area
 */
export interface TerrainData {
  /** Resolution in meters per grid cell */
  resolution: number;

  /** 2D array of elevation values in meters (above sea level) */
  elevations: number[][];

  /** Geographic bounds of the data */
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };

  /** Data source name */
  source: TerrainDataSource;

  /** Date the data was collected/published */
  date?: string;
}

/**
 * Available terrain data sources
 */
export enum TerrainDataSource {
  /** Shuttle Radar Topography Mission (global, 30m resolution) */
  SRTM = 'SRTM',

  /** ASTER Global Digital Elevation Model (global, 30m resolution) */
  ASTER_GDEM = 'ASTER_GDEM',

  /** LiDAR data (high resolution, limited coverage) */
  LiDAR = 'LiDAR',

  /** Manual user input */
  Manual = 'Manual'
}

/**
 * Single building with location and height
 */
export interface Building {
  /** Building ID (from OSM or other source) */
  id: string;

  /** Building name (if known) */
  name?: string;

  /** Building footprint (polygon) */
  footprint: GeoJSON.Polygon;

  /** Building height in meters */
  height: number;

  /** Number of floors (if known) */
  floors?: number;

  /** Building type (residential, commercial, etc.) */
  type?: string;

  /** Center point of building */
  center: {
    lat: number;
    lng: number;
  };
}

/**
 * Collection of buildings in a racing area
 */
export interface BuildingData {
  /** Array of buildings */
  buildings: Building[];

  /** Data source */
  source: BuildingDataSource;

  /** Date the data was retrieved */
  date: string;

  /** Total count of buildings */
  count: number;
}

/**
 * Available building data sources
 */
export enum BuildingDataSource {
  /** OpenStreetMap crowd-sourced data */
  OpenStreetMap = 'OpenStreetMap',

  /** Google Buildings API */
  Google = 'Google',

  /** Microsoft Building Footprints */
  Microsoft = 'Microsoft',

  /** Municipal GIS data */
  Municipal_GIS = 'Municipal_GIS',

  /** LiDAR-derived building data */
  LiDAR = 'LiDAR',

  /** Manual user input */
  Manual = 'Manual'
}

/**
 * Wind forecast at a specific time
 */
export interface WindForecast {
  /** ISO timestamp of forecast */
  timestamp: string;

  /** Wind direction in degrees true (0-360, where 0=north, 90=east) */
  direction: number;

  /** Wind speed in knots */
  speed: number;

  /** Wind gust speed in knots (if available) */
  gusts?: number;

  /** Wind type */
  type: 'gradient' | 'thermal' | 'combined';

  /** Data source */
  source: WindDataSource;

  /** Confidence in forecast (0-1) */
  confidence?: number;
}

/**
 * Available wind data sources
 */
export enum WindDataSource {
  /** NOAA weather forecasts */
  NOAA_GFS = 'NOAA_GFS',

  /** ECMWF weather model */
  ECMWF = 'ECMWF',

  /** NOAA NAM model (North America) */
  NOAA_NAM = 'NOAA_NAM',

  /** WRF high-resolution model */
  WRF = 'WRF',

  /** Weather station observation */
  Observed = 'Observed',

  /** Manual user input */
  Manual = 'Manual'
}

/**
 * Wind shadow zone created by an obstacle
 */
export interface WindShadowZone {
  /** GeoJSON Polygon defining the shadow */
  polygon: GeoJSON.Polygon;

  /** Obstacle that creates this shadow */
  obstacle: {
    type: 'building' | 'terrain' | 'island';
    id: string;
    name?: string;
    height: number;
  };

  /** Wind speed reduction percentage (0-1, where 0.7 = 70% reduction) */
  reduction: number;

  /** Estimated wind speed in shadow (knots) */
  estimatedSpeed: number;

  /** Shadow severity */
  severity: 'severe' | 'moderate' | 'weak';

  /** Distance downwind from obstacle (meters) */
  distanceDownwind: number;

  /** Human-readable description */
  description: string;

  /** Confidence in this prediction (0-1) */
  confidence: number;
}

/**
 * Wind acceleration zone (gap, channel, etc.)
 */
export interface WindAccelerationZone {
  /** GeoJSON Polygon defining the zone */
  polygon: GeoJSON.Polygon;

  /** Type of acceleration */
  type: 'gap' | 'channel' | 'headland' | 'venturi';

  /** Wind speed increase percentage (0-1, where 0.5 = 50% increase) */
  increase: number;

  /** Estimated wind speed in zone (knots) */
  estimatedSpeed: number;

  /** Human-readable description */
  description: string;

  /** Confidence in this prediction (0-1) */
  confidence: number;
}

/**
 * Thermal wind (sea breeze or land breeze) prediction
 */
export interface ThermalWindPrediction {
  /** Type of thermal wind */
  type: 'sea_breeze' | 'land_breeze' | 'anabatic' | 'katabatic';

  /** ISO timestamp when thermal wind develops */
  development: string;

  /** ISO timestamp when thermal wind peaks */
  peak: string;

  /** ISO timestamp when thermal wind dissipates */
  dissipation?: string;

  /** Thermal wind direction in degrees true */
  direction: number;

  /** Thermal wind speed in knots */
  speed: number;

  /** Temperature differential driving the thermal wind (°C) */
  temperatureDifferential: number;

  /** Confidence in this prediction (0-1) */
  confidence: number;

  /** Human-readable description */
  description: string;
}

/**
 * Wind battle zone where gradient and thermal winds compete
 */
export interface WindBattleZone {
  /** GeoJSON Polygon defining the battle zone (shear line) */
  polygon: GeoJSON.Polygon;

  /** Gradient wind characteristics */
  gradientWind: {
    direction: number;
    speed: number;
  };

  /** Thermal wind characteristics */
  thermalWind: {
    direction: number;
    speed: number;
  };

  /** Expected behavior in the battle zone */
  behavior: 'gradual_transition' | 'sharp_shear' | 'oscillating';

  /** Human-readable description */
  description: string;
}

/**
 * Complete wind-terrain analysis for a racing area
 */
export interface WindAnalysis {
  /** Terrain elevation data */
  terrain: TerrainData;

  /** Building data */
  buildings: BuildingData;

  /** Gradient wind forecast */
  gradientWind: WindForecast;

  /** Average wind speed (knots) across race area */
  averageWindSpeed?: number;

  /** Average wind direction (degrees true) */
  averageWindDirection?: number;

  /** Wind variability factor (0-1) */
  variability?: number;

  /** Wind shadow zones */
  windShadowZones: WindShadowZone[];

  /** Wind acceleration zones */
  accelerationZones: WindAccelerationZone[];

  /** Thermal wind prediction (if applicable) */
  thermalWindPrediction?: ThermalWindPrediction;

  /** Wind battle zones (if thermal wind present) */
  windBattleZones?: WindBattleZone[];

  /** AI-generated analysis text from Claude with topographic-wind-analyst Skill */
  aiAnalysis: string;

  /** Strategic recommendations */
  recommendations: {
    /** Start line strategy and favored end */
    startStrategy: string;

    /** Upwind tactical recommendations */
    upwindStrategy: string;

    /** Downwind tactical recommendations */
    downwindStrategy: string;

    /** Mark rounding approach recommendations */
    markRoundings: string;

    /** Is this an optimal time to race? */
    timingOptimal: boolean;

    /** If not optimal, when would be better? */
    bestRaceTime?: string;

    /** Overall timing assessment */
    timing: string;
  };

  /** Confidence level in this analysis */
  confidence: 'high' | 'moderate' | 'low';

  /** Caveats and factors that could change the analysis */
  caveats?: string[];

  /** Timestamp of analysis */
  timestamp: string;

  /** Venue context */
  venue: SailingVenue;
}

/**
 * Configuration for terrain data fetching
 */
export interface TerrainFetchConfig {
  /** Racing area polygon */
  racingArea: GeoJSON.Polygon;

  /** Preferred data source (will fallback if unavailable) */
  preferredSource?: TerrainDataSource;

  /** Desired resolution in meters (will use best available) */
  desiredResolution?: number;

  /** Buffer around racing area in meters (default: 1000m) */
  buffer?: number;
}

/**
 * Configuration for building data fetching
 */
export interface BuildingFetchConfig {
  /** Racing area polygon */
  racingArea: GeoJSON.Polygon;

  /** Preferred data source (will fallback if unavailable) */
  preferredSource?: BuildingDataSource;

  /** Minimum building height to include in meters (default: 20m) */
  minHeight?: number;

  /** Buffer around racing area in meters (default: 2000m for wind shadows) */
  buffer?: number;
}

/**
 * Configuration for wind forecast fetching
 */
export interface WindFetchConfig {
  /** Center point of racing area */
  centerPoint: {
    lat: number;
    lng: number;
  };

  /** Forecast time */
  time: Date;

  /** Preferred data source (will fallback if unavailable) */
  preferredSource?: WindDataSource;
}

/**
 * Request for complete wind-terrain analysis
 */
export interface WindAnalysisRequest {
  /** Racing area boundary */
  racingArea: GeoJSON.Polygon;

  /** Scheduled race time (start) */
  raceTime: Date;

  /** Estimated race duration in minutes */
  raceDuration?: number;

  /** Venue context */
  venue: SailingVenue;

  /** Terrain fetch configuration */
  terrainConfig?: Partial<TerrainFetchConfig>;

  /** Building fetch configuration */
  buildingConfig?: Partial<BuildingFetchConfig>;

  /** Wind fetch configuration */
  windConfig?: Partial<WindFetchConfig>;
}

/**
 * Elevation contour for visualization
 */
export interface ElevationContour {
  /** Elevation value in meters */
  elevation: number;

  /** GeoJSON LineString for the contour */
  contour: GeoJSON.LineString;

  /** Label position (lat, lng) */
  labelPosition?: [number, number];
}

/**
 * Wind arrow for visualization
 */
export interface WindArrow {
  /** Position (lat, lng) */
  position: [number, number];

  /** Direction in degrees true */
  direction: number;

  /** Speed in knots */
  speed: number;

  /** Wind type */
  type: 'gradient' | 'thermal' | 'shadow' | 'acceleration';

  /** Timestamp */
  timestamp: string;
}

/**
 * Combined environmental analysis (bathymetric + wind)
 */
export interface EnvironmentalAnalysis {
  /** Water environment analysis */
  water?: UnderwaterAnalysis | null;

  /** Air environment analysis */
  air?: WindAnalysis | null;

  /** Combined strategic recommendations */
  combinedRecommendations: {
    startStrategy: string;
    upwindStrategy: string;
    downwindStrategy: string;
    markRoundings: string;
    timing: string;
    optimalConditions: boolean;
  };

  /** Overall confidence */
  confidence: 'high' | 'moderate' | 'low';

  /** Timestamp */
  timestamp: string;

  /** Venue */
  venue: SailingVenue;
}
