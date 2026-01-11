/**
 * Sharing Module Types
 * Unified types for pre-race and post-race content sharing
 */

import type { RaceAnalysis, CoachingFeedback, FrameworkScores } from '@/types/raceAnalysis';

export type ShareContext = 'pre-race' | 'post-race' | 'result-only';

export type ShareChannel =
  | 'whatsapp'
  | 'email'
  | 'native'
  | 'copy'
  | 'coach'
  | 'crew';

export interface WeatherForecast {
  windSpeed?: number;
  windSpeedMax?: number;
  windDirection?: string;
  temperature?: number;
  waveHeight?: number;
  tideState?: string;
  tideHeight?: number;
  currentSpeed?: number;
  currentDirection?: string;
}

export interface RigTuning {
  preset?: string;
  windRange?: string;
  settings?: {
    upperShrouds?: string;
    lowerShrouds?: string;
    forestay?: string;
    backstay?: string;
    mast?: string;
    cunningham?: string;
    outhaul?: string;
    vang?: string;
  };
  notes?: string;
}

export interface RaceInfo {
  id: string;
  name: string;
  date: string;
  venue?: string;
  boatClass?: string;
  weather?: WeatherForecast;
  rigTuning?: RigTuning;
  raceType?: 'fleet' | 'distance' | 'match' | 'team';
  totalDistanceNm?: number;
  startTime?: string;
  courseName?: string;
}

export interface RaceResult {
  position: number;
  fleetSize: number;
  status?: 'DNF' | 'DNS' | 'DSQ' | 'OCS' | 'RET' | null;
  points?: number;
}

export interface PostRaceShareContent {
  raceInfo: RaceInfo;
  result?: RaceResult;
  narrative?: string;
  keyMoment?: string;
  analysis?: Partial<RaceAnalysis>;
  coachingFeedback?: CoachingFeedback[];
  frameworkScores?: FrameworkScores;
  keyLearning?: string;
  focusNextRace?: string;
}

/**
 * Schedule event from NOR/SI extraction
 */
export interface ScheduleEvent {
  date: string;
  time: string;
  event: string;
  location?: string;
  mandatory?: boolean;
}

/**
 * Entry fee from NOR/SI extraction
 */
export interface EntryFee {
  type: string;
  amount: string;
  deadline?: string;
}

/**
 * Route waypoint from NOR/SI extraction (distance races)
 */
export interface RouteWaypoint {
  name: string;
  order?: number;
  notes?: string;
}

/**
 * VHF channel info from NOR/SI extraction
 */
export interface VHFChannel {
  channel: string;
  purpose: string;
  classes?: string[];
}

/**
 * Prohibited area from NOR/SI extraction
 */
export interface ProhibitedArea {
  name: string;
  description?: string;
  consequence?: string;
}

/**
 * Watch group for distance races
 */
export interface WatchGroupData {
  id: string;
  name: string;
  color: string;
  crewIds: string[];
}

/**
 * Watch schedule data for distance/offshore races
 */
export interface WatchScheduleData {
  raceDurationHours: number;
  watchLengthHours: number;
  watches: WatchGroupData[];
  watchMode: 'full_24h' | 'night_only';
  scheduleStartTime?: string;
  nightStartHour?: number;
  nightEndHour?: number;
  raceDate?: string;
}

/**
 * Document data extracted from NOR/SI for sharing with crew
 */
export interface DocumentShareData {
  // Schedule & Dates
  schedule?: ScheduleEvent[];
  warningSignalTime?: string;

  // Entry Requirements
  entryDeadline?: string;
  entryFees?: EntryFee[];
  crewRequirements?: string;
  minimumCrew?: number;
  minorSailorRules?: string;
  eligibilityRequirements?: string;

  // Location & Route
  startAreaName?: string;
  racingAreaName?: string;
  routeWaypoints?: RouteWaypoint[];
  totalDistanceNm?: number;

  // Communications
  vhfChannels?: VHFChannel[];

  // Safety & Rules
  safetyRequirements?: string;
  prohibitedAreas?: ProhibitedArea[];
  penaltySystem?: string;
  timeLimitHours?: number;
}

export interface PreRaceShareContent {
  raceInfo: RaceInfo;
  userNotes?: string;
  startStrategy?: string;
  upwindStrategy?: string;
  downwindStrategy?: string;
  windwardMarkStrategy?: string;
  leewardMarkStrategy?: string;
  finishStrategy?: string;
  aiInsights?: string[];
  windStrategy?: string;
  tideStrategy?: string;
  currentStrategy?: string;

  /** Extracted NOR/SI data for crew briefing */
  documentData?: DocumentShareData;

  /** Watch schedule for distance/offshore races */
  watchSchedule?: WatchScheduleData;
}

export interface ShareableContent {
  context: ShareContext;
  raceId: string;
  raceName: string;
  raceDate: string;
  venue?: string;
  boatClass?: string;

  // Pre-race specific
  preRace?: PreRaceShareContent;

  // Post-race specific
  postRace?: PostRaceShareContent;
}

export interface CoachProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio?: string;
  experience_years?: number;
  certifications?: string[];
  specializations?: string[];
  hourly_rate?: number;
  currency?: string;
  is_verified?: boolean;
  is_active?: boolean;
  rating?: number;
  total_sessions?: number;
  profile_image_url?: string;
}

export interface CrewShareRecipient {
  id: string;
  name: string;
  role: string;
  userId?: string;
  email?: string;
  avatarUrl?: string;
}

export interface ShareConfig {
  title: string;
  channels: ShareChannel[];
  defaultChannel?: ShareChannel;
  showPreview?: boolean;
  showCoachOption?: boolean;
  showCrewOption?: boolean;
}

export interface ShareResult {
  success: boolean;
  channel: ShareChannel;
  recipientName?: string;
  error?: string;
}

// Props for the unified sharing sheet
export interface UnifiedSharingSheetProps {
  visible: boolean;
  onClose: () => void;
  onShareComplete?: (result: ShareResult) => void;
  context: ShareContext;
  content: ShareableContent;
  sailorId: string;
  primaryCoachId?: string;
  primaryCoachName?: string;
  config?: Partial<ShareConfig>;
}
