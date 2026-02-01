/**
 * Onboarding Types
 * Type definitions for the onboarding flow
 */

export type ExperienceLevel =
  | 'beginner'      // Just starting - new to racing
  | 'learning'      // A few races under my belt
  | 'intermediate'  // Regular club racer
  | 'advanced'      // Competitive circuit racing
  | 'expert';       // National/International level

export interface BoatClassSelection {
  id: string;
  name: string;
  type?: string;
}

export interface ClubSelection {
  id: string;
  name: string;
  venueId?: string;
  venueName?: string;
  region?: string;
}

export interface FleetSelection {
  id: string;
  name: string;
  classId?: string;
  clubId?: string;
}

export interface RaceSelection {
  id: string;
  name: string;
  startDate: string;
  venueName?: string;
}

/**
 * Complete onboarding preferences collected during the full setup flow
 */
export interface OnboardingPreferences {
  // User info (from earlier steps)
  userId: string;
  userName: string;
  avatarUrl?: string;

  // Setup path
  setupPath: 'quick' | 'full';

  // Experience (full setup only)
  experienceLevel?: ExperienceLevel;

  // Boat class (full setup only)
  boatClass?: BoatClassSelection;
  hasNoBoat?: boolean;

  // Home club (full setup only)
  homeClub?: ClubSelection;
  hasNoClub?: boolean;

  // Primary fleet (full setup only)
  primaryFleet?: FleetSelection;
  hasNoFleet?: boolean;

  // Races (full setup only)
  selectedRaces?: RaceSelection[];
}

/**
 * Onboarding step information
 */
export type OnboardingStep =
  // Legacy flow steps
  | 'welcome'
  | 'features'
  | 'auth-choice'
  | 'register'
  | 'profile-setup'
  | 'setup-choice'
  | 'experience'
  | 'boat-class'
  | 'home-club'
  | 'primary-fleet'
  | 'find-races'
  | 'complete'
  // Returning user flow
  | 'welcome-back'
  // New Strava-inspired flow steps
  | 'value-track-races'
  | 'value-prepare-pro'
  | 'value-join-crew'
  | 'auth-choice-new'
  | 'name-photo'
  | 'boat-picker'
  | 'location-permission'
  | 'club-nearby'
  | 'find-sailors'
  | 'race-calendar'
  | 'add-race';

/**
 * New onboarding flow type for feature flag
 */
export type OnboardingFlow = 'legacy' | 'strava-inspired';

/**
 * Onboarding state for tracking progress
 */
export interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  preferences: Partial<OnboardingPreferences>;
  startedAt: string;
  lastUpdatedAt: string;
}

/**
 * Experience level display configuration
 */
export interface ExperienceLevelConfig {
  value: ExperienceLevel;
  label: string;
  description: string;
  icon: string;
}

export const EXPERIENCE_LEVELS: ExperienceLevelConfig[] = [
  {
    value: 'beginner',
    label: 'Just Starting',
    description: 'New to racing, learning the basics',
    icon: 'school',
  },
  {
    value: 'learning',
    label: 'Learning',
    description: 'A few races under my belt',
    icon: 'trending-up',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Regular club racer',
    icon: 'boat',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Competitive circuit racing',
    icon: 'trophy',
  },
  {
    value: 'expert',
    label: 'Expert',
    description: 'National/International level',
    icon: 'medal',
  },
];
