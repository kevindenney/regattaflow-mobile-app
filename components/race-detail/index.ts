/**
 * Race Detail Components
 * Apple Weather-inspired scrollable race detail components
 */

// Legacy components
export { RaceDetailMapHero } from './RaceDetailMapHero';
export { StrategyCard } from './StrategyCard';
export { StartStrategyCard } from './StartStrategyCard';
export { WindWeatherCard } from './WindWeatherCard';
export { CurrentTideCard } from './CurrentTideCard';
export { TacticalPlanCard } from './TacticalPlanCard';
export { PostRaceAnalysisCard } from './PostRaceAnalysisCard';
export { CourseSelector } from './CourseSelector';
export { MarkManager } from './MarkManager';

// New redesigned components
export { RaceOverviewCard } from './RaceOverviewCard';
export { TimingCard } from './TimingCard';
export { CourseCard } from './CourseCard';
export { CommunicationsCard } from './CommunicationsCard';
export { WeatherCard } from './WeatherCard';
export { TideCard } from './TideCard';

// Compact Mac Weather-style components
export { WeatherMetricCard } from './WeatherMetricCard';
export { CompactWindCard } from './CompactWindCard';
export { CompactTideCard } from './CompactTideCard';
export { CompactWaveCard } from './CompactWaveCard';
export { CompactRaceInfoCard } from './CompactRaceInfoCard';
export { CompactCourseCard } from './CompactCourseCard';
export { CompactCommsCard } from './CompactCommsCard';

// Enhanced race detail components (new)
export { ContingencyPlansCard } from './ContingencyPlansCard';
export { RaceDocumentsCard } from './RaceDocumentsCard';
export { CrewEquipmentCard } from './CrewEquipmentCard';
export { FleetRacersCard } from './FleetRacersCard';
export { RigTuningCard } from './RigTuningCard';

// Phase-based strategy components (Race Lifecycle UX)
export { RacePhaseHeader } from './RacePhaseHeader';
export { UpwindStrategyCard } from './UpwindStrategyCard';
export { DownwindStrategyCard } from './DownwindStrategyCard';
export { MarkRoundingCard } from './MarkRoundingCard';

// Map components - NOTE: Import directly from '@/components/race-detail/map' for native apps only
// react-native-maps doesn't support web, so these are not exported here to avoid bundler errors
// export * from './map';

// Weather components
export { WindCompass } from './weather/WindCompass';
