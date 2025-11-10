/**
 * Post-Race Analysis Types
 * Structured analysis with RegattaFlow Playbook framework integration
 */

export interface RaceTimerSessionSummary {
  id: string;
  start_time: string;
  regattas?: {
    id: string;
    name?: string | null;
    start_date?: string | null;
  } | null;
  fleet_size?: number | null;
  position?: number | null;
  duration_seconds?: number | null;
  wind_speed?: number | null;
  wind_direction?: number | null;
  wave_height?: number | null;
}

export interface AiCoachAnalysisSummary {
  timer_session_id: string;
  confidence_score?: number | null;
  overall_summary?: string | null;
  start_analysis?: string | null;
  upwind_analysis?: string | null;
  downwind_analysis?: string | null;
  tactical_decisions?: string | null;
  boat_handling?: string | null;
  recommendations?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface RaceAnalysis {
  id: string;
  race_id: string;
  sailor_id: string;
  created_at: string;
  updated_at: string;

  // Equipment & Planning
  equipment_rating?: number; // 1-5
  equipment_notes?: string;
  planning_rating?: number; // 1-5
  planning_notes?: string;

  // Crew Performance
  crew_rating?: number; // 1-5
  crew_notes?: string;

  // Pre-Start Phase
  prestart_rating?: number; // 1-5
  prestart_notes?: string;
  prestart_tactics?: string[];

  // Start
  start_rating?: number; // 1-5
  start_notes?: string;
  start_position?: StartPosition;
  start_speed?: StartSpeed;

  // Upwind Leg
  upwind_rating?: number; // 1-5
  upwind_notes?: string;
  upwind_puff_handling?: PuffHandling;
  upwind_shift_awareness?: number; // 1-5
  upwind_tactics_used?: UpwindTactic[];

  // Windward Mark
  windward_mark_rating?: number; // 1-5
  windward_mark_notes?: string;
  windward_mark_approach_tack?: ApproachTack;

  // Downwind Leg
  downwind_rating?: number; // 1-5
  downwind_notes?: string;
  downwind_shift_detection?: ShiftDetectionMethod;
  downwind_jibe_count?: number;
  downwind_in_phase?: boolean;

  // Leeward Mark
  leeward_mark_rating?: number; // 1-5
  leeward_mark_notes?: string;

  // Finish
  finish_rating?: number; // 1-5
  finish_notes?: string;

  // Rules & Protests
  rules_violations?: string[];
  protests_filed?: string[];
  protests_received?: string[];

  // AI Analysis
  ai_coaching_feedback?: CoachingFeedback[];
  framework_scores?: FrameworkScores;
  ai_analysis_version?: number;

  // Overall
  overall_satisfaction?: number; // 1-5
  key_learnings?: string[];
}

// Enums and Types

export type StartPosition = 'pin_end' | 'middle' | 'boat_end';

export type StartSpeed = 'full_speed' | 'moderate' | 'slow';

export type PuffHandling = 'traveler' | 'mainsheet' | 'feathered' | 'not_sure';

export type UpwindTactic =
  | 'delayed_tack'
  | 'cross_and_cover'
  | 'slam_dunk'
  | 'lee_bow'
  | 'tack_on_header'
  | 'loose_cover';

export type ApproachTack =
  | 'starboard_lifted'
  | 'starboard_headed'
  | 'port_lifted'
  | 'port_headed'
  | 'not_sure';

export type ShiftDetectionMethod =
  | 'compass'
  | 'apparent_wind'
  | 'schooled_upwind_boats'
  | 'didnt_track';

// AI Coaching Feedback Types

export interface CoachingFeedback {
  phase: RacePhase;
  playbook_framework: RegattaFlowPlaybookFramework;
  your_approach: string;
  playbook_recommendation: string;

  // RegattaFlow Coach Execution Analysis (Phase 3 Enhancement)
  coach_execution_technique?: string; // Champion execution technique that applies
  execution_score?: number; // 0-100: How well sailor executed the technique
  execution_feedback?: string; // Specific execution coaching from RegattaFlow Coach's methods
  champion_story?: string; // Relevant champion story (Stearns, Fogh, Cox, etc.)

  confidence: number; // 0-100
  impact: 'high' | 'medium' | 'low';
  next_race_focus: string;
  demo_reference?: string; // e.g., "./playbook-demo 2"
}

export type RacePhase =
  | 'equipment'
  | 'planning'
  | 'prestart'
  | 'start'
  | 'upwind'
  | 'windward_mark'
  | 'downwind'
  | 'leeward_mark'
  | 'finish'
  | 'overall';

export type RegattaFlowPlaybookFramework =
  | 'Puff Response Framework'
  | 'Delayed Tack'
  | 'Wind Shift Mathematics'
  | 'Shift Frequency Formula'
  | 'Downwind Shift Detection'
  | 'Getting In Phase'
  | 'Performance Pyramid';

export interface FrameworkScores {
  puff_response?: number; // 0-100
  shift_awareness?: number; // 0-100
  delayed_tack_usage?: number; // 0-100
  downwind_detection?: number; // 0-100
  getting_in_phase?: number; // 0-100
  covering_tactics?: number; // 0-100 (RegattaFlow Coach execution score)
  overall_framework_adoption?: number; // 0-100
}

// Framework Trend Analysis

export interface FrameworkTrend {
  framework: RegattaFlowPlaybookFramework;
  races_analyzed: number;
  trend: 'improving' | 'stable' | 'declining';
  average_score: number;
  latest_score: number;
  change_percentage: number; // positive = improvement
}

export interface PerformanceCorrelation {
  framework: RegattaFlowPlaybookFramework;
  races_using_framework: number;
  races_not_using_framework: number;
  average_finish_with: number;
  average_finish_without: number;
  improvement: number; // positions gained
  statistical_significance: number; // 0-100
}

// Form Step Configuration

export interface AnalysisStep {
  id: string;
  title: string;
  description?: string;
  questions: AnalysisQuestion[];
  playbook_context?: string; // RegattaFlow Playbook framework hint for this section
}

export interface AnalysisQuestion {
  id: keyof RaceAnalysis;
  type: QuestionType;
  label: string;
  hint?: string;
  playbook_framework_reference?: RegattaFlowPlaybookFramework;
  required?: boolean;
  options?: QuestionOption[];
  validation?: ValidationRule;
}

export type QuestionType =
  | 'rating' // 1-5 stars
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multi-select'
  | 'boolean'
  | 'text-array'; // Dynamic list of text inputs

export interface QuestionOption {
  value: string;
  label: string;
  playbook_framework_note?: string; // "✅ Playbook recommendation" or "⚠️ Consider playbook adjustment"
}

export interface ValidationRule {
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

// Database Query Results

export interface FrameworkTrendData {
  race_date: string;
  puff_response_score: number | null;
  shift_awareness_score: number | null;
  tactics_score: number | null;
  downwind_detection_score: number | null;
  overall_score: number | null;
}

// API Request/Response Types

export interface CreateRaceAnalysisRequest {
  race_id: string;
  analysis_data: Partial<RaceAnalysis>;
}

export interface UpdateRaceAnalysisRequest {
  analysis_id: string;
  analysis_data: Partial<RaceAnalysis>;
}

export interface GetCoachingFeedbackRequest {
  analysis_id: string;
  race_id: string;
  sailor_id: string;
}

export interface GetCoachingFeedbackResponse {
  coaching_feedback: CoachingFeedback[];
  framework_scores: FrameworkScores;
  overall_assessment: string;
  next_race_priorities: string[];
}

// UI Component Props

export interface PostRaceAnalysisFormProps {
  raceId: string;
  existingAnalysis?: RaceAnalysis;
  onComplete: (analysis: RaceAnalysis) => void;
  onCancel?: () => void;
}

export interface TacticalCoachingProps {
  analysis: RaceAnalysis;
  coachingFeedback: CoachingFeedback[];
  frameworkScores: FrameworkScores;
  onViewPlaybook?: () => void;
}

/** @deprecated Use TacticalCoachingProps instead */
export interface RegattaFlowPlaybookCoachingProps {
  analysis: RaceAnalysis;
  coachingFeedback: CoachingFeedback[];
  frameworkScores: FrameworkScores;
  onDemoClick?: (demoNumber: number) => void;
}

export interface FrameworkTrendsProps {
  sailorId: string;
  trends: FrameworkTrend[];
  correlations: PerformanceCorrelation[];
}
