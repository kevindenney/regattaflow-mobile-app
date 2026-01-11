export { useSailorDashboardData } from './useSailorDashboardData';
export { useCoachDashboardData } from './useCoachDashboardData';
export { useClubDashboardData } from './useClubDashboardData';
export { useUserFleets, useFleetOverview, useFleetActivity } from './useFleetData';
export { useFleetSuggestions, useTrendingFleets } from './useFleetDiscovery';
export { useFleetResources } from './useFleetResources';
export { useFleetSharedContent } from './useFleetSharedContent';
export { useRaces } from './useRaces';
export { useRaceTuningRecommendation } from './useRaceTuningRecommendation';
export { useEnrichedRaces } from './useEnrichedRaces';
export { useTidalIntel } from './useTidalIntel';
export { useUnderwaterAnalysis } from './useUnderwaterAnalysis';
export { useTacticalZones, useTacticalZoneLayerConfig } from './useTacticalZones';
export { useClaudeDraft } from './ai/useClaudeDraft';
export { useAIChatSession } from './ai/useAIChatSession';
export { useRaceCommsDraft } from './ai/useRaceCommsDraft';

// Practice Hooks
export { usePracticeSessions, usePastPracticeSessions } from './usePracticeSessions';
export { usePracticeSession } from './usePracticeSession';
export { usePracticeChecklist } from './usePracticeChecklist';
export type { PracticeChecklistItemWithState, CarryoverItem } from './usePracticeChecklist';
export { useDrillLibrary } from './useDrillLibrary';
export {
  usePracticeSuggestions,
  useSuggestionForSkillArea,
  useRegenerateSuggestions,
} from './usePracticeSuggestions';

// Venue Racing Enhancement Hooks
export { useVenueLiveWeather } from './useVenueLiveWeather';
export type { LiveWeatherData, UseVenueLiveWeatherResult } from './useVenueLiveWeather';

// Race Weather Forecast for Sparklines
export { useRaceWeatherForecast, extractForecastForSparklines } from './useRaceWeatherForecast';
export type {
  RaceWeatherForecastData,
  UseRaceWeatherForecastResult,
  RaceWindowData,
  HourlyDataPoint,
  TideTimeData,
} from './useRaceWeatherForecast';

export { useVenueRaces } from './useVenueRaces';
export type { VenueRace, UseVenueRacesResult } from './useVenueRaces';

export { useVenueRacingAreas } from './useVenueRacingAreas';
export type { VenueRacingArea, RacingAreaGeometry, UseVenueRacingAreasResult } from './useVenueRacingAreas';

export { useVenueFleetInfo, getFrequencyLabel } from './useVenueFleetInfo';
export type { VenueFleet, UseVenueFleetInfoResult } from './useVenueFleetInfo';

export type {
  SailorDashboardData,
} from './useSailorDashboardData';

export type {
  CoachDashboardData,
} from './useCoachDashboardData';

export type {
  ClubDashboardData,
} from './useClubDashboardData';

// Equipment Flow for Cross-Race Tracking
export { useEquipmentFlow } from './useEquipmentFlow';
export type { EquipmentIssue } from './useEquipmentFlow';

// Race-Type-Specific Checklists
export { useRaceChecklist } from './useRaceChecklist';
export type { ChecklistItemWithState } from './useRaceChecklist';

// Forecast Check (Weather Snapshots & AI Analysis)
export { useForecastCheck } from './useForecastCheck';
export type { UseForecastCheckOptions, UseForecastCheckReturn } from './useForecastCheck';

// Team Racing Collaboration
export { useTeamRaceEntry } from './useTeamRaceEntry';
export { useTeamChecklist } from './useTeamChecklist';
export type { TeamChecklistItemWithState } from './useTeamChecklist';

// Content Module Preferences (Expanded Race Card)
export { useContentModules } from './useContentModules';
export { useContentPreferences } from './useContentPreferences';
export type { UseContentModulesReturn, UseContentPreferencesReturn } from '@/types/raceCardContent';

// Pre-Race Team Sharing
export { useTeamSharing } from './useTeamSharing';
export type { UseTeamSharingResult, UseTeamSharingParams, RaceShare } from './useTeamSharing';

// Structured Debrief Phase Ratings
export { usePhaseRatings, PHASE_KEYS } from './usePhaseRatings';
export type { PhaseRatings, PhaseRating, PhaseKey, UsePhaseRatingsReturn } from './usePhaseRatings';
