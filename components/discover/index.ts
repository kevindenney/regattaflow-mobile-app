/**
 * Discover Components
 *
 * Components for the Discover tab - finding and following fellow sailors.
 */

export { DiscoverScreen, default } from './DiscoverScreen';
export { ClassExpertCard } from './ClassExpertCard';
export { FleetActivityCard } from './FleetActivityCard';
export { DiscoveryFeedCard } from './DiscoveryFeedCard';
export { BoatClassCard } from './BoatClassCard';
export { PublicFleetCard } from './PublicFleetCard';
export { SailorRow } from './SailorRow';
export type { SailorSummary } from './SailorRow';
export { SailorTimelineModal } from './SailorTimelineModal';
export { SharedRaceContentView } from './SharedRaceContentView';

// Sailor Race Journey Components
export { SailorRaceJourneyScreen } from './SailorRaceJourneyScreen';
export { JourneyPhaseSelector } from './JourneyPhaseSelector';
export type { JourneyPhase } from './JourneyPhaseSelector';
export { ReadOnlyJourneyContent } from './ReadOnlyJourneyContent';
export { TemplateActionBar } from './TemplateActionBar';

// TikTok-style vertical feed components
export { FullScreenRaceCard } from './FullScreenRaceCard';
export type { FullScreenRaceCardData } from './FullScreenRaceCard';
export { VerticalRacePager } from './VerticalRacePager';
export { RaceCardSailorHeader } from './RaceCardSailorHeader';
export { RaceCardContentSections } from './RaceCardContentSections';
export { RaceCardActionBar } from './RaceCardActionBar';

// Read-only content components
export * from './read-only';
