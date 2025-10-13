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
