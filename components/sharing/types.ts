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
  raceType?: 'fleet' | 'distance';
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
