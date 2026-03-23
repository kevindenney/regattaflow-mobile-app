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
  /** Labels shown on persona pills during signup (maps to internal sailor/coach/club roles). */
  personaLabels: { sailor: string; coach: string; club: string };
  /** Subtitles shown below persona pills during signup. */
  personaSubtitles: { sailor: string; coach: string; club: string };
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
  personaLabels: { sailor: 'Student', coach: 'Instructor', club: 'School' },
  personaSubtitles: {
    sailor: 'Start learning and tracking your nursing progress',
    coach: 'Set up your instructor profile and manage students',
    club: 'Set up your nursing school with programs and cohorts',
  },
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
  personaLabels: { sailor: 'Sailor', coach: 'Coach', club: 'Club' },
  personaSubtitles: {
    sailor: 'Start with 14 days of full Pro access — no card required',
    coach: 'Set up your coaching profile and start managing clients',
    club: 'Get your club set up with race management tools',
  },
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
  personaLabels: { sailor: 'Artist', coach: 'Instructor', club: 'Studio' },
  personaSubtitles: {
    sailor: 'Start learning and tracking your drawing progress',
    coach: 'Set up your instructor profile and manage students',
    club: 'Set up your studio with courses and portfolios',
  },
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
  personaLabels: { sailor: 'Student', coach: 'Instructor', club: 'School' },
  personaSubtitles: {
    sailor: 'Start learning and tracking your design progress',
    coach: 'Set up your instructor profile and manage students',
    club: 'Set up your design school with programs and portfolios',
  },
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
  personaLabels: { sailor: 'Player', coach: 'Coach', club: 'Academy' },
  personaSubtitles: {
    sailor: 'Start tracking your golf progress and performance',
    coach: 'Set up your coaching profile and manage players',
    club: 'Set up your academy with programs and player tracking',
  },
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
  personaLabels: { sailor: 'Member', coach: 'Trainer', club: 'Gym' },
  personaSubtitles: {
    sailor: 'Start tracking your fitness progress and goals',
    coach: 'Set up your trainer profile and manage clients',
    club: 'Set up your gym with programs and member tracking',
  },
  onboarding: {
    chatGreeting: "Welcome! I'll help you set up your gym on BetterAt in about 5 minutes.\n\nWhat's your gym's name?",
    organizationPrompt: "What's your gym's name or website?",
  },
};

const KNITTING: OnboardingInterestContext = {
  interestSlug: 'knitting',
  interestName: 'Knitting',
  color: '#E91E63',
  organizationLabel: 'guild',
  memberLabel: 'knitter',
  leaderRoles: [
    { id: 'guild-president', label: 'Guild President' },
    { id: 'workshop-leader', label: 'Workshop Leader' },
    { id: 'instructor', label: 'Instructor' },
    { id: 'pattern-designer', label: 'Pattern Designer' },
    { id: 'staff', label: 'Staff' },
  ],
  programLabel: 'Workshops',
  programSuggestions: ['Beginner Knitting', 'Socks & Small Circumference', 'Colorwork', 'Lace Knitting', 'Garment Construction', 'Design Your Own Pattern'],
  cta: {
    headline: 'Ready to track progress in Knitting?',
    subtext: 'Set up your guild with workshops, patterns, and skill tracking.',
    buttonLabel: 'Set Up Your Guild',
  },
  signupSubtitle: 'Set up your knitting guild with workshops, patterns, and skill tracking',
  personaLabels: { sailor: 'Knitter', coach: 'Instructor', club: 'Guild' },
  personaSubtitles: {
    sailor: 'Start tracking your knitting projects and skills',
    coach: 'Set up your instructor profile and lead workshops',
    club: 'Set up your guild with workshops and pattern libraries',
  },
  onboarding: {
    chatGreeting: "Welcome! I'll help you set up your knitting guild on BetterAt in about 5 minutes.\n\nWhat's your guild's name?",
    organizationPrompt: "What's your guild's name or website?",
  },
};

const FIBER_ARTS: OnboardingInterestContext = {
  interestSlug: 'fiber-arts',
  interestName: 'Fiber Arts',
  color: '#8E24AA',
  organizationLabel: 'guild',
  memberLabel: 'fiber artist',
  leaderRoles: [
    { id: 'guild-master', label: 'Guild Master' },
    { id: 'workshop-leader', label: 'Workshop Leader' },
    { id: 'instructor', label: 'Instructor' },
    { id: 'studio-manager', label: 'Studio Manager' },
    { id: 'staff', label: 'Staff' },
  ],
  programLabel: 'Programs',
  programSuggestions: ['Spinning Fundamentals', 'Floor Loom Weaving', 'Rigid Heddle Weaving', 'Natural Dyeing', 'Wet Felting', 'Tapestry'],
  cta: {
    headline: 'Ready to track progress in Fiber Arts?',
    subtext: 'Set up your guild with programs, projects, and skill tracking.',
    buttonLabel: 'Set Up Your Guild',
  },
  signupSubtitle: 'Set up your fiber arts guild with programs, projects, and skill tracking',
  personaLabels: { sailor: 'Fiber Artist', coach: 'Instructor', club: 'Guild' },
  personaSubtitles: {
    sailor: 'Start tracking your fiber arts projects and skills',
    coach: 'Set up your instructor profile and lead workshops',
    club: 'Set up your guild with programs and project galleries',
  },
  onboarding: {
    chatGreeting: "Welcome! I'll help you set up your fiber arts guild on BetterAt in about 5 minutes.\n\nWhat's your guild's name?",
    organizationPrompt: "What's your guild's name or website?",
  },
};

const PAINTING_PRINTING: OnboardingInterestContext = {
  interestSlug: 'painting-printing',
  interestName: 'Painting & Printing',
  color: '#FF6F00',
  organizationLabel: 'studio',
  memberLabel: 'artist',
  leaderRoles: [
    { id: 'studio-director', label: 'Studio Director' },
    { id: 'master-printer', label: 'Master Printer' },
    { id: 'lead-instructor', label: 'Lead Instructor' },
    { id: 'instructor', label: 'Instructor' },
    { id: 'staff', label: 'Staff' },
  ],
  programLabel: 'Programs',
  programSuggestions: ['Oil Painting', 'Watercolor', 'Printmaking Fundamentals', 'Lithography', 'Screen Printing', 'Plein Air Painting'],
  cta: {
    headline: 'Ready to track progress in Painting & Printing?',
    subtext: 'Set up your studio with programs, portfolios, and skill tracking.',
    buttonLabel: 'Set Up Your Studio',
  },
  signupSubtitle: 'Set up your painting studio with programs, portfolios, and skill tracking',
  personaLabels: { sailor: 'Artist', coach: 'Instructor', club: 'Studio' },
  personaSubtitles: {
    sailor: 'Start learning and tracking your painting progress',
    coach: 'Set up your instructor profile and manage students',
    club: 'Set up your studio with programs and portfolios',
  },
  onboarding: {
    chatGreeting: "Welcome! I'll help you set up your painting studio on BetterAt in about 5 minutes.\n\nWhat's your studio's name?",
    organizationPrompt: "What's your studio's name or website?",
  },
};

const LIFELONG_LEARNING: OnboardingInterestContext = {
  interestSlug: 'lifelong-learning',
  interestName: 'Lifelong Learning',
  color: '#5C6BC0',
  organizationLabel: 'center',
  memberLabel: 'learner',
  leaderRoles: [
    { id: 'director', label: 'Center Director' },
    { id: 'program-director', label: 'Program Director' },
    { id: 'facilitator', label: 'Lead Facilitator' },
    { id: 'instructor', label: 'Instructor' },
    { id: 'staff', label: 'Staff' },
  ],
  programLabel: 'Programs',
  programSuggestions: ['Meditation & Mindfulness', 'Yoga Intensive', 'Watercolour Workshop', 'Creative Writing', 'Leadership & Facilitation', 'Weaving & Fiber Arts'],
  cta: {
    headline: 'Ready to track progress in Lifelong Learning?',
    subtext: 'Set up your center with programs, cohorts, and growth tracking.',
    buttonLabel: 'Set Up Your Center',
  },
  signupSubtitle: 'Set up your learning center with programs, cohorts, and growth tracking',
  personaLabels: { sailor: 'Learner', coach: 'Facilitator', club: 'Center' },
  personaSubtitles: {
    sailor: 'Start learning and tracking your growth across topics',
    coach: 'Set up your facilitator profile and lead programs',
    club: 'Set up your center with programs and cohort tracking',
  },
  onboarding: {
    chatGreeting: "Welcome! I'll help you set up your learning center on BetterAt in about 5 minutes.\n\nWhat's your center's name?",
    organizationPrompt: "What's your center's name or website?",
  },
};

const REGENERATIVE_AGRICULTURE: OnboardingInterestContext = {
  interestSlug: 'regenerative-agriculture',
  interestName: 'Regenerative Agriculture',
  color: '#2E7D32',
  organizationLabel: 'farm',
  memberLabel: 'grower',
  leaderRoles: [
    { id: 'farm-director', label: 'Farm Director' },
    { id: 'head-grower', label: 'Head Grower' },
    { id: 'workshop-leader', label: 'Workshop Leader' },
    { id: 'chef', label: 'Head Chef' },
    { id: 'staff', label: 'Staff' },
  ],
  programLabel: 'Programs',
  programSuggestions: ['Organic Farming', 'Soil Health', 'Rainwater Harvesting', 'Nursery Management', 'Farm-to-Table Cooking', 'Seed Saving'],
  cta: {
    headline: 'Ready to track progress in Regenerative Agriculture?',
    subtext: 'Set up your farm with programs, crews, and growing tracking.',
    buttonLabel: 'Set Up Your Farm',
  },
  signupSubtitle: 'Set up your farm with programs, crews, and growing tracking',
  personaLabels: { sailor: 'Grower', coach: 'Workshop Leader', club: 'Farm' },
  personaSubtitles: {
    sailor: 'Start tracking your growing practices and progress',
    coach: 'Set up your workshop leader profile and programs',
    club: 'Set up your farm with programs and crew management',
  },
  onboarding: {
    chatGreeting: "Welcome! I'll help you set up your farm on BetterAt in about 5 minutes.\n\nWhat's your farm's name?",
    organizationPrompt: "What's your farm's name or website?",
  },
};

const GLOBAL_HEALTH: OnboardingInterestContext = {
  interestSlug: 'global-health',
  interestName: 'Global Health',
  color: '#00897B',
  organizationLabel: 'initiative',
  memberLabel: 'volunteer',
  leaderRoles: [
    { id: 'executive-director', label: 'Executive Director' },
    { id: 'medical-director', label: 'Medical Director' },
    { id: 'program-director', label: 'Program Director' },
    { id: 'board-member', label: 'Board Member' },
    { id: 'volunteer-coordinator', label: 'Volunteer Coordinator' },
  ],
  programLabel: 'Programs',
  programSuggestions: ['Rehabilitation', 'Nutrition', 'Medical Relief', 'Feto-Maternal Ultrasound', 'Medical Missions', 'Fundraising'],
  cta: {
    headline: 'Ready to amplify your global health impact?',
    subtext: 'Set up your initiative with programs, mission tracking, and donor reporting.',
    buttonLabel: 'Set Up Your Initiative',
  },
  signupSubtitle: 'Set up your health initiative with programs, missions, and impact tracking',
  personaLabels: { sailor: 'Volunteer', coach: 'Director', club: 'Initiative' },
  personaSubtitles: {
    sailor: 'Join a health initiative and track your volunteer impact',
    coach: 'Set up your director profile and manage programs',
    club: 'Set up your initiative with programs and mission tracking',
  },
  onboarding: {
    chatGreeting: "Welcome! I'll help you set up your global health initiative on BetterAt in about 5 minutes.\n\nWhat's your initiative's name?",
    organizationPrompt: "What's your initiative's name or website?",
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
  personaLabels: { sailor: 'Individual', coach: 'Coach', club: 'Organization' },
  personaSubtitles: {
    sailor: 'Start learning and tracking your progress',
    coach: 'Set up your coaching profile',
    club: 'Set up your organization',
  },
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
  knitting: KNITTING,
  'fiber-arts': FIBER_ARTS,
  'painting-printing': PAINTING_PRINTING,
  'lifelong-learning': LIFELONG_LEARNING,
  'regenerative-agriculture': REGENERATIVE_AGRICULTURE,
  'global-health': GLOBAL_HEALTH,
};

/**
 * Get onboarding context for an interest slug.
 * Returns a generic default when no slug is provided or the slug is unknown.
 */
export function getOnboardingContext(interestSlug?: string | null): OnboardingInterestContext {
  if (!interestSlug) return GENERIC;
  return INTEREST_CONTEXTS[interestSlug] ?? GENERIC;
}
