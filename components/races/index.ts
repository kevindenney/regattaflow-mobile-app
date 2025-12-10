// Legacy components
export { RaceCard } from './RaceCard';
export { RaceCardWithTuning } from './RaceCardWithTuning';
export { AddRaceModal } from './AddRaceModal';
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
export { RaceTypeSelector, RaceTypeBadge } from './RaceTypeSelector';
export { DistanceRaceCard } from './DistanceRaceCard';
export { DistanceRouteMap } from './DistanceRouteMap';
export { PreRaceBriefingCard } from './PreRaceBriefingCard';
export type { RaceType } from './RaceTypeSelector';
export type { RouteWaypoint } from './DistanceRouteMap';
export type { DistanceRaceCardProps } from './DistanceRaceCard';

// Re-export types
export type { Document } from './DocumentList';
export type { ExtractedData, FieldConfidenceMap, MultiRaceExtractedData } from './AIValidationScreen';
export type { ExtractionMetadata } from './ComprehensiveRaceEntry';
export type { TacticalTactic, TacticalPlaybookProps } from './TacticalPlaybook';
export type { TacticalCoachingProps } from '@/types/raceAnalysis';
export type { StartSequenceEntry } from './MyStartSection';
