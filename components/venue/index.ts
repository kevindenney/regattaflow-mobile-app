/**
 * Venue Components Barrel Export
 * All venue tab components for easy importing
 */

// ===========================================================================
// NEW: Apple/Tufte-Inspired Venue Components
// ===========================================================================

// Hero map with racing areas as first-class citizens
export { VenueHeroMap, VenueHeroMapCompact } from './VenueHeroMap';

// Racing area components
export { RacingAreaCard, RacingAreaCardList } from './RacingAreaCard';
export { RacingAreaCircleOverlay, useRacingAreasAsGeoJSON } from './RacingAreaCircleOverlay';

// Community area creation
export { UnknownAreaPrompt, UnknownAreaBanner } from './UnknownAreaPrompt';
export { CommunityAreaBadge } from './CommunityAreaBadge';

// Preview card (for map-unavailable state)
export { VenuePreviewCard } from './VenuePreviewCard';

// Tufte-style sparklines
export {
  ConditionsSparkline,
  WindSparkline,
  TideSparkline,
  CurrentSparkline,
  ConditionsBar,
} from './ConditionsSparkline';

// Unified knowledge feed
export { UnifiedKnowledgeFeed } from './UnifiedKnowledgeFeed';

// Redesigned knowledge hub
export { VenueKnowledgeHubRedesigned } from './VenueKnowledgeHubRedesigned';

// ===========================================================================
// EXISTING: Legacy Venue Components
// ===========================================================================

// Core Components
export { VenueMapView } from './VenueMapView';
export { VenueDetailsSheet } from './VenueDetailsSheet';
export { VenueHeroCard } from './VenueHeroCard';
export { QuickAccessPanel } from './QuickAccessPanel';
export { MapControls, type MapLayers } from './MapControls';
export { TravelResourceChips } from './TravelResourceChips';

// Phase 1: Live Conditions & Races
export { LiveConditionsCard } from './LiveConditionsCard';
export { UpcomingRacesSection } from './UpcomingRacesSection';

// Phase 2: Tide, Wind & Racing Areas
export { TideCurrentPanel } from './TideCurrentPanel';
export { WindPatternCard } from './WindPatternCard';
export { RacingAreaOverlay, RacingAreaLegend, RacingAreaInfoCard } from './RacingAreaOverlay';

// Phase 3: Fleet Community & Intel
export { FleetCommunityCard } from './FleetCommunityCard';
export { RacingIntelSection } from './RacingIntelSection';
export { VenueComparisonModal, CompareVenuesButton } from './VenueComparisonModal';

