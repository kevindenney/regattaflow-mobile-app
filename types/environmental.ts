/**
 * Shared environmental intelligence types
 * Defines wind, tide, wave and forecast data structures used across weather services.
 */

export enum TideState {
  HIGH = 'high',
  LOW = 'low',
  FLOOD = 'flood',
  EBB = 'ebb',
  SLACK = 'slack',
  UNKNOWN = 'unknown'
}

export enum ConfidenceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface WindData {
  speed: number; // knots
  direction: number; // degrees (0-360)
  gust?: number; // knots
}

export interface TideData {
  height: number; // meters
  current_speed?: number; // knots
  current_direction?: number; // degrees (0-360)
  state: TideState;
}

export interface WaveData {
  height: number; // meters
  direction: number; // degrees (0-360)
  period: number; // seconds
  swell_height?: number; // meters
  swell_direction?: number; // degrees (0-360)
}

export interface EnvironmentalSnapshot {
  wind: WindData;
  tide: TideData;
  wave?: WaveData;
  temperature?: number;
  pressure?: number;
  timestamp: string;
}

export interface WeatherForecast {
  time: string;
  wind: WindData;
  tide?: TideData;
  wave?: WaveData;
  temperature?: number;
  pressure?: number;
  cloud_cover?: number;
  confidence: ConfidenceLevel;
  provider: string;
}

export interface TacticalAlert {
  type: 'wind_shift' | 'tide_change' | 'weather_front' | 'current_advantage';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: string;
}

export interface EnvironmentalIntelligence {
  current: EnvironmentalSnapshot;
  forecast: WeatherForecast[];
  summary: string;
  alerts?: TacticalAlert[];
}
