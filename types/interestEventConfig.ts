/**
 * Interest Event Configuration Types
 *
 * Defines the per-interest configuration for event cards, content modules,
 * debrief interviews, AI analysis, drills, and the reflect tab.
 *
 * Each interest (sailing, nursing, drawing, fitness) provides its own
 * InterestEventConfig that drives the entire event card experience.
 */

import type { RacePhase } from '@/components/cards/types'
import type {
  ContentModuleId,
  PhaseModuleConfig,
  RaceTypeModuleConfig,
  ContentModuleInfo,
  ModuleHeightConfig,
} from '@/types/raceCardContent'
import type {
  DebriefPhase,
  DebriefQuestionType,
} from '@/components/races/review/debriefQuestions'

// =============================================================================
// PHASE LABELS
// =============================================================================

/**
 * Display labels for the 3 temporal phases, customized per interest.
 * Internal phase keys (days_before, on_water, after_race) remain unchanged.
 */
export interface PhaseLabels {
  full: string
  short: string
}

// =============================================================================
// EVENT SUBTYPES
// =============================================================================

/**
 * An event subtype within an interest (e.g., fleet/match/team/distance for sailing,
 * clinical_shift/skills_lab/simulation for nursing).
 */
export interface EventSubtypeConfig {
  id: string
  label: string
  icon: string
  description: string
  /** Form fields specific to this subtype (rendered in Add Event flow) */
  formFields?: EventFormField[]
}

export interface EventFormField {
  id: string
  type: 'text' | 'number' | 'date' | 'time' | 'select' | 'multi-select' | 'boolean' | 'duration'
  label: string
  placeholder?: string
  required?: boolean
  options?: Array<{ value: string; label: string }>
}

// =============================================================================
// CONTENT MODULES (Interest-specific)
// =============================================================================

/**
 * Content module definition for an interest.
 * Extends the sailing ContentModuleId concept to any interest.
 */
export interface InterestContentModuleInfo {
  id: string
  label: string
  shortLabel: string
  icon: string
  description: string
}

export interface InterestPhaseModuleConfig {
  phase: RacePhase
  availableModules: string[]
  defaultModules: string[]
  maxModules: number
}

export interface InterestSubtypeModuleOverrides {
  subtypeId: string
  additionalModules?: string[]
  excludedModules?: string[]
  labelOverrides?: Record<string, string>
  /** Override defaults for specific phases */
  phaseDefaultOverrides?: Partial<Record<RacePhase, string[]>>
}

// =============================================================================
// EVIDENCE CAPTURE
// =============================================================================

export interface EvidenceCaptureConfig {
  /** Primary capture method for this interest */
  primaryCapture: EvidenceCaptureMethod
  /** Additional capture methods available */
  secondaryCapture: EvidenceCaptureMethod[]
  /** Privacy restrictions (e.g., HIPAA for nursing) */
  privacyNote?: string
}

export interface EvidenceCaptureMethod {
  id: string
  label: string
  icon: string
  type: 'photo' | 'video' | 'audio' | 'gps' | 'text' | 'timer' | 'health_data' | 'activity_log'
  description: string
}

// =============================================================================
// AI ANALYSIS
// =============================================================================

export interface AIAnalysisSectionConfig {
  id: string
  label: string
  description: string
}

export interface FrameworkScoreConfig {
  id: string
  label: string
  description: string
}

// =============================================================================
// DRILL / PRACTICE CATEGORIES
// =============================================================================

export interface DrillCategoryMeta {
  id: string
  label: string
  icon: string
}

export interface SkillAreaConfig {
  id: string
  label: string
}

// =============================================================================
// REFLECT TAB
// =============================================================================

export interface ReflectSegmentConfig {
  value: string
  label: string
}

export interface ReflectProgressLabels {
  /** Weekly calendar */
  seeMoreText: string        // "See more of your sailing" / "See more of your clinical work"
  primaryLegend: string      // "Race" / "Clinical"
  secondaryLegend: string    // "Training" / "Study"
  /** Monthly card */
  eventVerb: string          // "raced" / "completed" / "practiced" / "trained"
  stat1Label: string         // "Races" / "Shifts" / "Sessions" / "Workouts"
  stat2Label: string         // "Podiums" / "Skills Practiced" / "Pieces" / "PRs"
  stat3Label: string         // "On Water" / "Clinical Hours" / "In Studio" / "Training"
  stat4Label: string         // "Avg Finish" / "Competencies" / "Critique Score" / "Avg Intensity"
  comparisonNoun: string     // "races" / "shifts" / "sessions" / "workouts"
  /** Performance chart */
  performanceSubtitle: string // "Your average finish position over time"
  performanceEmpty: string    // "Complete some races to see your performance trend"
  /** Empty state */
  emptyIcon: string           // "boat-outline" / "medkit-outline" / "brush-outline" / "barbell-outline"
}

export interface ReflectTabConfig {
  /** Segment labels (e.g., Progress / Race Log / Profile → Progress / Shift Log / Profile) */
  segments: ReflectSegmentConfig[]
  /** Stats labels for the progress view */
  progressStats: {
    eventsLabel: string
    hoursLabel: string
    skillsLabel: string
    streakLabel: string
  }
  /** Labels used by progress view components (weekly calendar, monthly card, etc.) */
  progressLabels?: ReflectProgressLabels
}

// =============================================================================
// TILE SECTIONS (visual grouping for config-driven phase content)
// =============================================================================

/**
 * A visual section of tiles within a phase tab.
 * Groups related modules for display in the tile grid.
 */
export interface TileSectionConfig {
  /** Unique section id (e.g., 'race-intel', 'patient-care') */
  id: string
  /** Uppercase display label (e.g., 'RACE INTEL', 'PATIENT CARE') */
  label: string
  /** Brief subtitle describing the section */
  subtitle: string
  /** Ordered list of module IDs from moduleInfo to render in this section */
  moduleIds: string[]
}

// =============================================================================
// TOP-LEVEL CONFIG
// =============================================================================

/**
 * Complete event configuration for a single interest.
 * One config object per interest drives all event-related UI.
 */
export interface InterestEventConfig {
  /** Interest slug (e.g., 'sail-racing', 'nursing') */
  interestSlug: string

  /** Display labels for the 3 temporal phases */
  phaseLabels: Record<RacePhase, PhaseLabels>

  /** "Add Event" button label (e.g., "Add Race", "Add Shift") */
  addEventLabel: string

  /** Event type noun (e.g., "Race", "Shift", "Session", "Workout") */
  eventNoun: string

  /** Route to navigate when "Browse {eventNoun} Catalog" is tapped */
  catalogRoute?: string

  /** Subtitle shown below "Browse {eventNoun} Catalog" menu option */
  catalogSubtitle?: string

  /** Event subtypes (e.g., fleet/match/team/distance for sailing) */
  eventSubtypes: EventSubtypeConfig[]

  /** Default event subtype id */
  defaultSubtype: string

  /** Content module metadata for this interest */
  moduleInfo: Record<string, InterestContentModuleInfo>

  /** Module height configs */
  moduleHeights: Record<string, ModuleHeightConfig>

  /** Phase → module configuration (available + defaults + max) */
  phaseModuleConfig: Record<RacePhase, InterestPhaseModuleConfig>

  /** Subtype-specific module overrides */
  subtypeOverrides: Record<string, InterestSubtypeModuleOverrides>

  /** AI analysis sections for this interest */
  aiAnalysisSections: AIAnalysisSectionConfig[]

  /** Framework / scoring dimensions for this interest */
  frameworkScores: FrameworkScoreConfig[]

  /** Structured debrief phases + questions for this interest */
  debriefPhases: DebriefPhase[]

  /** Drill/practice categories for this interest */
  drillCategories: DrillCategoryMeta[]

  /** Skill areas tracked for this interest */
  skillAreas: SkillAreaConfig[]

  /** Evidence capture configuration for the "Do" phase */
  evidenceCapture: EvidenceCaptureConfig

  /** Reflect tab configuration */
  reflectConfig: ReflectTabConfig

  /**
   * Visual tile section groupings per phase.
   * Used by ConfigDrivenPhaseContent to render interest-specific tiles.
   * Optional — if omitted, falls back to rendering defaultModules in a single section.
   */
  tileSections?: Partial<Record<RacePhase, TileSectionConfig[]>>
}
