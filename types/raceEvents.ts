/**
 * Race Events and Course Intelligence Types
 *
 * Powers the race strategy data gathering UX
 * See: plans/race-strategy-data-gathering-ux.md
 */

import { Database } from './supabase';

// =============================================================================
// Database Types (from Supabase schema)
// =============================================================================

export type RaceEvent = Database['public']['Tables']['race_events']['Row'];
export type RaceEventInsert = Database['public']['Tables']['race_events']['Insert'];
export type RaceEventUpdate = Database['public']['Tables']['race_events']['Update'];

export type CourseMark = Database['public']['Tables']['course_marks']['Row'];
export type CourseMarkInsert = Database['public']['Tables']['course_marks']['Insert'];
export type CourseMarkUpdate = Database['public']['Tables']['course_marks']['Update'];

export type VenueCourseCorrection = Database['public']['Tables']['venue_course_corrections']['Row'];
export type EnvironmentalForecast = Database['public']['Tables']['environmental_forecasts']['Row'];
export type DocumentProcessingJob = Database['public']['Tables']['document_processing_jobs']['Row'];

// =============================================================================
// Enhanced Types with Relationships
// =============================================================================

export interface RaceEventWithDetails extends RaceEvent {
  venue?: {
    id: string;
    name: string;
    coordinates_lat: number;
    coordinates_lng: number;
    country: string;
    region: string;
  };
  marks?: CourseMark[];
  forecasts?: EnvironmentalForecast[];
  processing_jobs?: DocumentProcessingJob[];
}

export interface RaceEventSummary {
  id: string;
  race_name: string;
  race_series?: string;
  boat_class?: string;
  start_time: string;
  venue_name?: string;
  racing_area_name?: string;
  extraction_status: ExtractionStatus;
  confidence_score?: number;
  weather_summary?: string; // e.g., "15-18kt NE, Flood Tide"
}

// =============================================================================
// Enums
// =============================================================================

export enum ExtractionMethod {
  AI_AUTO = 'ai_auto',
  QUICK_DRAW = 'quick_draw',
  MANUAL = 'manual'
}

export enum ExtractionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum RaceStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum MarkType {
  START = 'start',
  FINISH = 'finish',
  WINDWARD = 'windward',
  LEEWARD = 'leeward',
  GATE_LEFT = 'gate_left',
  GATE_RIGHT = 'gate_right',
  OFFSET = 'offset',
  COMMITTEE_BOAT = 'committee_boat',
  PIN = 'pin'
}

export enum RoundingDirection {
  PORT = 'port',
  STARBOARD = 'starboard',
  EITHER = 'either'
}

export enum CourseConfiguration {
  WINDWARD_LEEWARD = 'windward_leeward',
  TRIANGLE = 'triangle',
  OLYMPIC = 'olympic',
  RANDOM = 'random'
}

export enum DocumentType {
  NOR = 'NOR',
  SSI = 'SSI',
  APPENDIX = 'appendix',
  CALENDAR = 'calendar',
  SAILING_INSTRUCTIONS = 'sailing_instructions',
  OTHER = 'other'
}

export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum TideState {
  HIGH = 'high',
  LOW = 'low',
  FLOOD = 'flood',
  EBB = 'ebb',
  SLACK = 'slack'
}

export enum ConfidenceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// =============================================================================
// Document Processing Types
// =============================================================================

export interface SourceDocument {
  type: DocumentType;
  url?: string;
  filename?: string;
  content?: string;
  extracted_at?: string;
}

export interface DocumentProcessingInput {
  race_event_id: string;
  document_type: DocumentType;
  document_url?: string;
  document_filename?: string;
  document_content?: string;
}

export interface DocumentProcessingResult {
  success: boolean;
  extracted_data: ExtractedRaceData;
  confidence: number;
  processing_duration_ms: number;
  errors?: string[];
}

export interface ExtractedRaceData {
  race_name?: string;
  race_series?: string;
  boat_class?: string;
  start_time?: string;
  racing_area_name?: string;
  marks?: ExtractedMark[];
  course_configuration?: CourseConfiguration;
  course_description?: string;
  weather_info?: string;
}

export interface ExtractedMark {
  name: string;
  type: MarkType;
  lat: number;
  lng: number;
  rounding?: RoundingDirection;
  sequence?: number;
  color?: string;
  shape?: string;
  confidence: number;
}

// =============================================================================
// Course Visualization Types (GeoJSON)
// =============================================================================

export interface CourseGeoJSON {
  type: 'FeatureCollection';
  features: CourseFeature[];
}

export interface CourseFeature {
  type: 'Feature';
  geometry: PointGeometry | PolygonGeometry;
  properties: MarkProperties | RacingAreaProperties;
}

export interface PointGeometry {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface PolygonGeometry {
  type: 'Polygon';
  coordinates: [number, number][][]; // [[lng, lat], [lng, lat], ...]
}

export interface MarkProperties {
  id: string;
  name: string;
  type: MarkType;
  rounding?: RoundingDirection;
  sequence?: number;
  color?: string;
  confidence?: number;
}

export interface RacingAreaProperties {
  type: 'racing_area';
  name: string;
  venue_id: string;
}

// =============================================================================
// Environmental Data Types
// =============================================================================

export interface EnvironmentalSnapshot {
  wind: WindData;
  tide: TideData;
  wave?: WaveData;
  temperature?: number;
  pressure?: number;
  timestamp: string;
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

export interface EnvironmentalIntelligence {
  current: EnvironmentalSnapshot;
  forecast: WeatherForecast[];
  summary: string; // e.g., "15-18kt NE, building throughout race. Flood tide."
  alerts?: TacticalAlert[];
}

export interface TacticalAlert {
  type: 'wind_shift' | 'tide_change' | 'weather_front' | 'current_advantage';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: string;
}

// =============================================================================
// AI Strategy Types
// =============================================================================

export interface StrategyAnalysis {
  start_strategy: StartStrategy;
  upwind_strategy: UpwindStrategy;
  downwind_strategy?: DownwindStrategy;
  mark_rounding?: MarkRoundingAdvice[];
  overall_recommendation: string;
  confidence: number;
  factors_considered: string[];
}

export interface StartStrategy {
  recommended_end: 'pin' | 'boat' | 'middle';
  reasoning: string;
  timing_notes: string;
  confidence: number;
}

export interface UpwindStrategy {
  favored_side: 'left' | 'right' | 'middle';
  tack_strategy: string;
  layline_approach: string;
  confidence: number;
}

export interface DownwindStrategy {
  recommended_side: 'left' | 'right' | 'middle';
  gybe_strategy: string;
  wave_riding_opportunities?: string;
  confidence: number;
}

export interface MarkRoundingAdvice {
  mark_name: string;
  approach: string;
  exit: string;
  tactical_notes: string;
}

// =============================================================================
// Venue Learning Types
// =============================================================================

export interface VenueCorrection {
  venue_id: string;
  race_event_id: string;
  original_marks: CourseMark[];
  corrected_marks: CourseMark[];
  correction_type: CorrectionType;
  notes?: string;
}

export enum CorrectionType {
  POSITION_ADJUSTMENT = 'position_adjustment',
  MARK_ADDED = 'mark_added',
  MARK_REMOVED = 'mark_removed',
  MARK_TYPE_CHANGED = 'mark_type_changed',
  COURSE_CONFIG_CHANGED = 'course_config_changed'
}

export interface VenueCourseTemplate {
  venue_id: string;
  racing_area_name: string;
  marks: CourseMark[];
  course_configuration: CourseConfiguration;
  confidence: number;
  usage_count: number; // How many times this template has been used
  last_used: string;
}

// =============================================================================
// Race Day Types
// =============================================================================

export interface RaceDayData {
  race_event: RaceEventWithDetails;
  current_position?: GPSPosition;
  live_environmental?: EnvironmentalSnapshot;
  tactical_updates?: TacticalAlert[];
  race_timer?: RaceTimer;
}

export interface GPSPosition {
  lat: number;
  lng: number;
  accuracy: number; // meters
  timestamp: string;
}

export interface RaceTimer {
  race_event_id: string;
  started_at: string;
  elapsed_seconds: number;
  current_leg?: string; // e.g., "Upwind Leg 1", "Downwind Leg 2"
  next_mark?: {
    name: string;
    distance_nm: number;
    bearing: number;
  };
}

// =============================================================================
// UI Component Props Types
// =============================================================================

export interface RaceEventCardProps {
  race: RaceEventSummary;
  onPress: () => void;
  showWeatherPreview?: boolean;
}

export interface CourseValidationProps {
  race_event_id: string;
  extracted_data: ExtractedRaceData;
  confidence_score: number;
  onApprove: () => void;
  onEdit: () => void;
  onManualMode: () => void;
}

export interface RaceIntelligenceDashboardProps {
  race_event_id: string;
  race_event: RaceEventWithDetails;
  environmental: EnvironmentalIntelligence;
  strategy: StrategyAnalysis;
  onStartRace: () => void;
}

export interface CourseEditorProps {
  race_event_id: string;
  marks: CourseMark[];
  racing_area_boundary?: PolygonGeometry;
  onSave: (marks: CourseMark[]) => void;
  onCancel: () => void;
}

export interface QuickDrawProps {
  venue_id?: string;
  onComplete: (racing_area: PolygonGeometry, suggested_marks?: ExtractedMark[]) => void;
  onCancel: () => void;
}

export interface RaceDayTacticalViewProps {
  race_event_id: string;
  current_position: GPSPosition;
  live_environmental: EnvironmentalSnapshot;
  tactical_alerts: TacticalAlert[];
  on_log_event: (event_type: string, notes?: string) => void;
}

// =============================================================================
// Service Method Types
// =============================================================================

export interface CreateRaceEventParams {
  race_name: string;
  race_series?: string;
  boat_class?: string;
  start_time: string;
  venue_id?: string;
  racing_area_name?: string;
  source_url?: string;
  source_documents?: SourceDocument[];
}

export interface ProcessDocumentsParams {
  race_event_id: string;
  documents: SourceDocument[];
}

export interface GetEnvironmentalIntelligenceParams {
  venue_id: string;
  start_time: string;
  duration_minutes: number;
}

export interface GenerateStrategyParams {
  race_event_id: string;
  course_data: CourseGeoJSON;
  environmental_data: EnvironmentalIntelligence;
  boat_class: string;
}

export interface SaveCorrectionParams {
  venue_id: string;
  race_event_id: string;
  original_marks: CourseMark[];
  corrected_marks: CourseMark[];
  correction_type: CorrectionType;
  notes?: string;
}
