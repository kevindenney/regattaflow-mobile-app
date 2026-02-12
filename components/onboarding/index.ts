/**
 * Onboarding Components Barrel Export
 * Unified exports for the new onboarding system
 */

// New unified onboarding components
export { PersonaTabBar, type PersonaType } from './PersonaTabBar';
export { OnboardingProgressBar } from './OnboardingProgressBar';
export { OnboardingSection } from './OnboardingSection';
export { FreeformInputField } from './FreeformInputField';
export { ExtractedDataPreview, type ExtractedEntity } from './ExtractedDataPreview';
export { QuickPasteOptions } from './QuickPasteOptions';
export { OnboardingFormFields, type SailorFormData } from './OnboardingFormFields';

// Legacy exports (for backward compatibility during migration)
export { OnboardingProgress } from './OnboardingProgress';
export { OnboardingCompletion } from './OnboardingCompletion';
export { OnboardingDataTally } from './OnboardingDataTally';
export { OnboardingSummary } from './OnboardingSummary';

// Sailor onboarding components
export { SailorSubscriptionChoice } from './SailorSubscriptionChoice';

// Feature Tour components
export { ContextualHint } from './ContextualHint';
export { TourStep, TourStepIndicator } from './TourStep';
export { TourOverlay } from './FeatureTour';
export { WelcomeCard } from './WelcomeCard';
export { TourBackdrop } from './TourBackdrop';
export { TabSweepCard } from './TabSweepCard';
export { TourPricingCard } from './TourPricingCard';
