/**
 * Race Detail Components
 * Apple Weather-inspired scrollable race detail components
 */

// Legacy components
export { CourseSelector } from './CourseSelector';
export { CurrentTideCard } from './CurrentTideCard';
export { MarkManager } from './MarkManager';
export { PostRaceAnalysisCard } from './PostRaceAnalysisCard';
export { RaceDetailMapHero } from './RaceDetailMapHero';
export { StartStrategyCard } from './StartStrategyCard';
export { StrategyCard } from './StrategyCard';
export { TacticalPlanCard } from './TacticalPlanCard';
export { WindWeatherCard } from './WindWeatherCard';

// New redesigned components
export { CommunicationsCard } from './CommunicationsCard';
export { CourseCard } from './CourseCard';
export { RaceOverviewCard } from './RaceOverviewCard';
export { TideCard } from './TideCard';
export { TimingCard } from './TimingCard';
export { WeatherCard } from './WeatherCard';

// Compact Mac Weather-style components
export { CompactCommsCard } from './CompactCommsCard';
export { CompactCourseCard } from './CompactCourseCard';
export { CompactRaceInfoCard } from './CompactRaceInfoCard';
export { CompactTideCard } from './CompactTideCard';
export { CompactWaveCard } from './CompactWaveCard';
export { CompactWindCard } from './CompactWindCard';
export { WeatherMetricCard } from './WeatherMetricCard';

// Enhanced race detail components (new)
export { ContingencyPlansCard, type ContingencyScenario } from './ContingencyPlansCard';
export { CrewEquipmentCard } from './CrewEquipmentCard';
export { FleetRacersCard } from './FleetRacersCard';
export { RaceConditionsCard } from './RaceConditionsCard';
export { RaceDocumentsCard } from './RaceDocumentsCard';
export { RigTuningCard } from './RigTuningCard';

// Phase-based strategy components (Race Lifecycle UX)
export { DownwindStrategyCard } from './DownwindStrategyCard';
export { MarkRoundingCard } from './MarkRoundingCard';
export { RacePhaseHeader } from './RacePhaseHeader';
export { UpwindStrategyCard } from './UpwindStrategyCard';

// Strategic Planning & Execution Evaluation
export { ExecutionEvaluationCard } from './ExecutionEvaluationCard';
export { PreRaceStrategySection } from './PreRaceStrategySection';
export { StrategyPlanningCard } from './StrategyPlanningCard';

// Map components - NOTE: Import directly from '@/components/race-detail/map' for native apps only
// react-native-maps doesn't support web, so these are not exported here to avoid bundler errors
// export * from './map';

// Weather components
export { WindCompass } from './weather/WindCompass';
