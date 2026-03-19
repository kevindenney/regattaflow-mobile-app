/**
 * Onboarding Interest Context
 *
 * Static config map that adapts onboarding copy and options to the visitor's
 * interest domain. Used by the signup page, CTA components, and club
 * onboarding chat to show contextual language (e.g. "school" instead of
 * "club", "Programs" instead of "Boat Classes").
 *
 * Follows the same pattern as lib/vocabulary.ts.
 */

export interface OnboardingInterestContext {
  interestSlug: string;
  interestName: string;
  color: string;
  organizationLabel: string;       // "school" / "academy" / "club" / "studio"
  memberLabel: string;             // "student" / "player" / "sailor" / "artist"
  leaderRoles: { id: string; label: string }[];
  programLabel: string;            // "Programs" / "Courses" / "Fleets"
  programSuggestions: string[];
  cta: { headline: string; subtext: string; buttonLabel: string };
  signupSubtitle: string;
  onboarding: {
    chatGreeting: string;          // Opening message for AI chat onboarding
    organizationPrompt: string;    // "What's your school's name?"
  };
}

// ---------------------------------------------------------------------------
// Interest configs
// ---------------------------------------------------------------------------

const NURSING: OnboardingInterestContext = {
  interestSlug: 'nursing',
  interestName: 'Nursing',
  color: '#6366F1',
  organizationLabel: 'school',
  memberLabel: 'student',
  leaderRoles: [
    { id: 'dean', label: 'Dean' },
    { id: 'program-director', label: 'Program Director' },
    { id: 'department-chair', label: 'Department Chair' },
    { id: 'faculty', label: 'Faculty' },
    { id: 'staff', label: 'Staff' },
  ],
  programLabel: 'Programs',
  programSuggestions: ['MSN', 'DNP', 'BSN', 'PhD', 'RN-to-BSN', 'Nurse Practitioner'],
  cta: {
    headline: 'Ready to track progress in Nursing?',
    subtext: 'Set up your school with programs, cohorts, and competency tracking.',
    buttonLabel: 'Set Up Your School',
  },
  signupSubtitle: 'Set up your nursing school with programs, cohorts, and competency tracking',
  onboarding: {
    chatGreeting: "Welcome! I'll help you set up your nursing school on BetterAt in about 5 minutes.\n\nWhat's your school's name?",
    organizationPrompt: "What's your school's name or website?",
  },
};

const SAIL_RACING: OnboardingInterestContext = {
  interestSlug: 'sail-racing',
  interestName: 'Sail Racing',
  color: '#0EA5E9',
  organizationLabel: 'club',
  memberLabel: 'sailor',
  leaderRoles: [
    { id: 'commodore', label: 'Commodore' },
    { id: 'race-officer', label: 'Race Officer' },
    { id: 'fleet-captain', label: 'Fleet Captain' },
    { id: 'sailing-secretary', label: 'Sailing Secretary' },
    { id: 'member', label: 'Club Member' },
  ],
  programLabel: 'Boat Classes',
  programSuggestions: ['Laser/ILCA', 'Optimist', 'J/70', '420', '49er', 'Hobie 16'],
  cta: {
    headline: 'Ready to manage your racing?',
    subtext: 'Set up your club with fleets, race management, and results tracking.',
    buttonLabel: 'Set Up Your Club',
  },
  signupSubtitle: 'Get your club set up with race management tools',
  onboarding: {
    chatGreeting: "Welcome to BetterAt Clubs! I'll help you set up your sailing club in about 5 minutes.\n\nWhat's your club's name or website?",
    organizationPrompt: "What's your club's name or location?",
  },
};

const DRAWING: OnboardingInterestContext = {
  interestSlug: 'drawing',
  interestName: 'Drawing',
  color: '#F59E0B',
  organizationLabel: 'studio',
  memberLabel: 'artist',
  leaderRoles: [
    { id: 'director', label: 'Studio Director' },
    { id: 'lead-instructor', label: 'Lead Instructor' },
    { id: 'instructor', label: 'Instructor' },
    { id: 'coordinator', label: 'Program Coordinator' },
    { id: 'staff', label: 'Staff' },
  ],
  programLabel: 'Courses',
  programSuggestions: ['Life Drawing', 'Figure Drawing', 'Illustration', 'Portraiture', 'Sketching', 'Digital Art'],
  cta: {
    headline: 'Ready to track progress in Drawing?',
    subtext: 'Set up your studio with courses, portfolios, and skill tracking.',
    buttonLabel: 'Set Up Your Studio',
  },
  signupSubtitle: 'Set up your drawing studio with courses, portfolios, and skill tracking',
  onboarding: {
    chatGreeting: "Welcome! I'll help you set up your drawing studio on BetterAt in about 5 minutes.\n\nWhat's your studio's name?",
    organizationPrompt: "What's your studio's name or website?",
  },
};

const DESIGN: OnboardingInterestContext = {
  interestSlug: 'design',
  interestName: 'Design',
  color: '#EC4899',
  organizationLabel: 'school',
  memberLabel: 'student',
  leaderRoles: [
    { id: 'dean', label: 'Dean' },
    { id: 'program-director', label: 'Program Director' },
    { id: 'department-head', label: 'Department Head' },
    { id: 'faculty', label: 'Faculty' },
    { id: 'staff', label: 'Staff' },
  ],
  programLabel: 'Programs',
  programSuggestions: ['Graphic Design', 'UX/UI Design', 'Industrial Design', 'Interior Design', 'Motion Design', 'Brand Design'],
  cta: {
    headline: 'Ready to track progress in Design?',
    subtext: 'Set up your school with programs, portfolios, and critique tracking.',
    buttonLabel: 'Set Up Your School',
  },
  signupSubtitle: 'Set up your design school with programs, portfolios, and critique tracking',
  onboarding: {
    chatGreeting: "Welcome! I'll help you set up your design school on BetterAt in about 5 minutes.\n\nWhat's your school's name?",
    organizationPrompt: "What's your school's name or website?",
  },
};

const GOLF: OnboardingInterestContext = {
  interestSlug: 'golf',
  interestName: 'Golf',
  color: '#22C55E',
  organizationLabel: 'academy',
  memberLabel: 'player',
  leaderRoles: [
    { id: 'head-pro', label: 'Head Professional' },
    { id: 'director', label: 'Academy Director' },
    { id: 'instructor', label: 'Teaching Professional' },
    { id: 'manager', label: 'Club Manager' },
    { id: 'staff', label: 'Staff' },
  ],
  programLabel: 'Programs',
  programSuggestions: ['Junior Development', 'Adult Beginner', 'Tournament Prep', 'Short Game', 'Swing Analysis', 'Course Management'],
  cta: {
    headline: 'Ready to track progress in Golf?',
    subtext: 'Set up your academy with programs, player progress, and performance tracking.',
    buttonLabel: 'Set Up Your Academy',
  },
  signupSubtitle: 'Set up your golf academy with programs, player progress, and performance tracking',
  onboarding: {
    chatGreeting: "Welcome! I'll help you set up your golf academy on BetterAt in about 5 minutes.\n\nWhat's your academy's name?",
    organizationPrompt: "What's your academy's name or website?",
  },
};

const FITNESS: OnboardingInterestContext = {
  interestSlug: 'health-and-fitness',
  interestName: 'Health & Fitness',
  color: '#EF4444',
  organizationLabel: 'gym',
  memberLabel: 'member',
  leaderRoles: [
    { id: 'owner', label: 'Gym Owner' },
    { id: 'head-trainer', label: 'Head Trainer' },
    { id: 'trainer', label: 'Personal Trainer' },
    { id: 'manager', label: 'Operations Manager' },
    { id: 'staff', label: 'Staff' },
  ],
  programLabel: 'Programs',
  programSuggestions: ['CrossFit', 'Strength Training', 'HIIT', 'Yoga', 'Pilates', 'Olympic Lifting'],
  cta: {
    headline: 'Ready to track progress in Health & Fitness?',
    subtext: 'Set up your gym with programs, member progress, and performance tracking.',
    buttonLabel: 'Set Up Your Gym',
  },
  signupSubtitle: 'Set up your gym with programs, member progress, and performance tracking',
  onboarding: {
    chatGreeting: "Welcome! I'll help you set up your gym on BetterAt in about 5 minutes.\n\nWhat's your gym's name?",
    organizationPrompt: "What's your gym's name or website?",
  },
};

// ---------------------------------------------------------------------------
// Generic default (no interest context)
// ---------------------------------------------------------------------------

const GENERIC: OnboardingInterestContext = {
  interestSlug: '',
  interestName: '',
  color: '#1A1A1A',
  organizationLabel: 'organization',
  memberLabel: 'member',
  leaderRoles: [
    { id: 'director', label: 'Director' },
    { id: 'manager', label: 'Manager' },
    { id: 'instructor', label: 'Instructor' },
    { id: 'coordinator', label: 'Coordinator' },
    { id: 'staff', label: 'Staff' },
  ],
  programLabel: 'Programs',
  programSuggestions: [],
  cta: {
    headline: 'Ready to get better?',
    subtext: 'Join organizations already tracking progress with BetterAt.',
    buttonLabel: 'Get Started Free',
  },
  signupSubtitle: 'Get your organization set up with progress tracking tools',
  onboarding: {
    chatGreeting: "Welcome! I'll help you set up your organization on BetterAt in about 5 minutes.\n\nWhat's your organization's name?",
    organizationPrompt: "What's your organization's name or website?",
  },
};

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

const INTEREST_CONTEXTS: Record<string, OnboardingInterestContext> = {
  nursing: NURSING,
  'sail-racing': SAIL_RACING,
  drawing: DRAWING,
  design: DESIGN,
  golf: GOLF,
  fitness: FITNESS,
  'health-and-fitness': FITNESS,
};

/**
 * Get onboarding context for an interest slug.
 * Returns a generic default when no slug is provided or the slug is unknown.
 */
export function getOnboardingContext(interestSlug?: string | null): OnboardingInterestContext {
  if (!interestSlug) return GENERIC;
  return INTEREST_CONTEXTS[interestSlug] ?? GENERIC;
}
