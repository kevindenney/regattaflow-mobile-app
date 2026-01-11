// Navigation Components (Tufte-inspired card pager)
export {
  CardNavigationPager,
  AnimatedRaceCard,
  NavigationIndicators,
  DetailStack,
} from './navigation';
export type {
  CardNavigationPagerProps,
  RaceData as NavigationRaceData,
  AnimatedRaceCardProps,
  NavigationIndicatorsProps,
  DetailStackProps,
} from './navigation';

// Legacy components
export { RaceCard } from './RaceCard';
export { RaceCardWithTuning } from './RaceCardWithTuning';
export { AddRaceModal } from './AddRaceModal';

// Tufte-style enhanced components
export { RaceCardEnhanced } from './RaceCardEnhanced';
export type { RaceCardEnhancedProps, RaceConditionsTimeline } from './RaceCardEnhanced';
export { AccordionSection, AccordionGroup } from './AccordionSection';
export type { AccordionSectionProps } from './AccordionSection';
export { RaceTimer } from './RaceTimer';
export { PostRaceInterview } from './PostRaceInterview';
export { RaceAnalysisView } from './RaceAnalysisView';
export { RaceDetailsView } from './RaceDetailsView';
export { default as CourseVisualization } from './CourseVisualization'; // Fixed: re-export default export
export { ComprehensiveRaceEntry } from './ComprehensiveRaceEntry';
export { BoatSelector } from './BoatSelector';
export { CreateRaceEventScreen } from './CreateRaceEventScreen';
export { DocumentList } from './DocumentList';
export { DocumentViewer } from './DocumentViewer';
export { ExtractionStatusBadge } from './ExtractionStatusBadge';

// New redesigned components
export { AppleRaceCard } from './AppleRaceCard';
export type { AppleRaceCardProps } from './AppleRaceCard';
export { AppleStyleRaceCard } from './AppleStyleRaceCard';
export type { AppleStyleRaceCardProps } from './AppleStyleRaceCard';
export { EnhancedRaceCard } from './EnhancedRaceCard';
export { CountdownTimer } from './CountdownTimer';
export { StartSequenceTimer } from './StartSequenceTimer';
export { MyStartSection } from './MyStartSection';
export { ExternalResourceLinks } from './ExternalResourceLinks';
export { ActualRigSettings } from './ActualRigSettings';
export { ConditionBadge } from './ConditionBadge';
export { AddRaceBottomSheet } from './AddRaceBottomSheet';
export { RaceDetailCards } from './RaceDetailCards';
export { PhaseHeader } from './PhaseHeader';
export { PhaseSkillButtons } from './PhaseSkillButtons';
export { PrimaryAICoach } from './PrimaryAICoach';

// AI-First Add Race Components
export { AIQuickEntry } from './AIQuickEntry';
export { ExtractionProgress } from './ExtractionProgress';
export { ExtractionResults } from './ExtractionResults';
export { ManualRaceForm } from './ManualRaceForm';
export type { InputMethod } from './AIQuickEntry';
export type { ExtractionStep } from './ExtractionProgress';
export type { ExtractedRaceData, ExtractedField, FieldConfidence } from './ExtractionResults';
export type { ManualRaceFormData } from './ManualRaceForm';

// AI Validation Components (Phase 3)
export { AIValidationScreen } from './AIValidationScreen';
export { MultiRaceSelectionScreen } from './MultiRaceSelectionScreen';
export { FieldConfidenceBadge } from './FieldConfidenceBadge';
export { EditableField } from './EditableField';
export { ValidationSummary } from './ValidationSummary';
export { ExtractionPreferencesDialog } from './ExtractionPreferencesDialog';
export type { ExtractionPreferences } from './ExtractionPreferencesDialog';

// Course Setup Components (Phase 2)
export { CourseSetupPrompt } from './CourseSetupPrompt';
export { CourseSelector } from './CourseSelector';

// Post-Race Analysis Components (Championship Racing Tactics)
export { PostRaceAnalysisForm } from './PostRaceAnalysisForm';
export { TacticalCoaching } from './TacticalCoaching';
export { TacticalPlaybook } from './TacticalPlaybook';
export { FleetPostRaceInsights } from './FleetPostRaceInsights';
export { AIPatternDetection } from './debrief/AIPatternDetection';
export { RegattaFlowPlaybookCoaching } from './RegattaFlowPlaybookCoaching';

// Race Learning & Insights Components
export { RaceLearningInsights, PreRaceReminderCard } from './RaceLearningInsights';
export { RacePrepLearningCard } from './RacePrepLearningCard';
export { StrategyPhaseSuggestion } from './StrategyPhaseSuggestion';

// Race Type Components
export { RaceTypeSelector, RaceTypeBadge, RACE_TYPE_COLORS } from './RaceTypeSelector';
export { DistanceRaceCard } from './DistanceRaceCard';
export { DistanceRouteMap } from './DistanceRouteMap';
export { PreRaceBriefingCard } from './PreRaceBriefingCard';
export type { RaceType } from './RaceTypeSelector';
export type { RouteWaypoint } from './DistanceRouteMap';
export type { DistanceRaceCardProps } from './DistanceRaceCard';

// Add Race Dialog Components
export { AddRaceDialog } from './AddRaceDialog';
export { RaceTypeStep } from './AddRaceDialog/RaceTypeStep';
export { InputMethodStep } from './AddRaceDialog/InputMethodStep';
export { AIExtractionStep } from './AddRaceDialog/AIExtractionStep';
export { RaceDetailsStep } from './AddRaceDialog/RaceDetailsStep';
export { FleetRaceFields } from './AddRaceDialog/FleetRaceFields';
export { DistanceRaceFields } from './AddRaceDialog/DistanceRaceFields';
export { MatchRaceFields } from './AddRaceDialog/MatchRaceFields';
export { TeamRaceFields } from './AddRaceDialog/TeamRaceFields';
export type { RaceFormData, CommonRaceData } from './AddRaceDialog/RaceDetailsStep';
export type { FleetRaceData } from './AddRaceDialog/FleetRaceFields';
export type { DistanceRaceData } from './AddRaceDialog/DistanceRaceFields';
export type { MatchRaceData } from './AddRaceDialog/MatchRaceFields';
export type { TeamRaceData } from './AddRaceDialog/TeamRaceFields';
export type { InputMethod } from './AddRaceDialog/InputMethodStep';

// Match Racing Components
export { MatchRaceCard } from './MatchRaceCard';
export type { MatchRaceCardProps } from '@/types/matchRacing';

// Team Racing Components
export { TeamRaceCard } from './TeamRaceCard';
export type { TeamRaceCardProps } from '@/types/teamRacing';

// Compact Row Components (for list views)
export {
  CompactRaceRow,
  CompactFleetRow,
  CompactDistanceRow,
  CompactMatchRow,
  CompactTeamRow,
} from './compact';
export type {
  CompactRaceRowProps,
  CompactFleetRowProps,
  CompactDistanceRowProps,
  CompactMatchRowProps,
  CompactTeamRowProps,
} from './compact';

// Extracted inline components (from races.tsx refactor)
export { RigPlannerCard } from './RigPlannerCard';
export type { RigPlannerCardProps } from './RigPlannerCard';
export { AddRaceTimelineCard } from './AddRaceTimelineCard';
export type { AddRaceTimelineCardProps } from './AddRaceTimelineCard';
export { RegulatoryDigestCard } from './RegulatoryDigestCard';
export type { RegulatoryDigestCardProps } from './RegulatoryDigestCard';
export { CourseOutlineCard } from './CourseOutlineCard';
export type { CourseOutlineCardProps } from './CourseOutlineCard';
export { AddRaceFamilyButton } from './AddRaceFamilyButton';
export type { AddRaceFamilyButtonProps } from './AddRaceFamilyButton';
export { RacesFloatingHeader } from './RacesFloatingHeader';
export type { RacesFloatingHeaderProps } from './RacesFloatingHeader';
export { DemoNotice } from './DemoNotice';
export type { DemoNoticeProps } from './DemoNotice';
export { RaceDetailZone } from './RaceDetailZone';
export type { RaceDetailZoneProps, RaceDocument as RaceDetailDocument, RaceMark } from './RaceDetailZone';
export { RaceDetailHeader } from './RaceDetailHeader';
export type { RaceDetailHeaderProps } from './RaceDetailHeader';
export { TimelineIndicators } from './TimelineIndicators';
export type { TimelineIndicatorsProps, TimelineRace } from './TimelineIndicators';
export { CarouselNavArrows } from './CarouselNavArrows';
export type { CarouselNavArrowsProps } from './CarouselNavArrows';
export { DemoAddRaceHeader } from './DemoAddRaceHeader';
export type { DemoAddRaceHeaderProps } from './DemoAddRaceHeader';
export { FleetStrategySection } from './FleetStrategySection';
export type { FleetStrategySectionProps } from './FleetStrategySection';
export { BoatSetupSection } from './BoatSetupSection';
export type { BoatSetupSectionProps } from './BoatSetupSection';
export { PostRaceAnalysisSection } from './PostRaceAnalysisSection';
export type { PostRaceAnalysisSectionProps } from './PostRaceAnalysisSection';
export { DemoRacesCarousel } from './DemoRacesCarousel';
export type { DemoRacesCarouselProps } from './DemoRacesCarousel';
export { TeamLogisticsSection } from './TeamLogisticsSection';
export type { TeamLogisticsSectionProps } from './TeamLogisticsSection';
export { RaceModalsSection } from './RaceModalsSection';
export type { RaceModalsSectionProps } from './RaceModalsSection';
export { RealRacesCarousel } from './RealRacesCarousel';
export type { RealRacesCarouselProps, UserRaceResult } from './RealRacesCarousel';
export { DistanceRaceContentSection } from './DistanceRaceContentSection';
export type { DistanceRaceContentSectionProps } from './DistanceRaceContentSection';
export { FleetRaceContentSection } from './FleetRaceContentSection';
export type { FleetRaceContentSectionProps } from './FleetRaceContentSection';
export { DocumentTypePickerModal } from './DocumentTypePickerModal';
export type { DocumentTypePickerModalProps } from './DocumentTypePickerModal';
export { AIVenueInsightsCard } from './AIVenueInsightsCard';
export type { AIVenueInsightsCardProps, VenueInsights } from './AIVenueInsightsCard';

// Sail Inspection Components
export { SailAlertBanner } from './SailAlertBanner';
export type { SailAlert as SailAlertBannerAlert } from './SailAlertBanner';
export { PreRaceSailCheck } from './PreRaceSailCheck';

// Expanded Race Card Components
export { ExpandedContentZone } from './ExpandedContentZone';
export { ContentConfigModal } from './ContentConfigModal';

// Re-export types
export type { Document } from './DocumentList';
export type { ExtractedData, FieldConfidenceMap, MultiRaceExtractedData } from './AIValidationScreen';
export type { ExtractionMetadata } from './ComprehensiveRaceEntry';
export type { TacticalTactic, TacticalPlaybookProps } from './TacticalPlaybook';
export type { TacticalCoachingProps } from '@/types/raceAnalysis';
export type { StartSequenceEntry } from './MyStartSection';
