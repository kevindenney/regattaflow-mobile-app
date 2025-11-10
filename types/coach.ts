// Coach Marketplace TypeScript Types

export interface CoachProfile {
  id: string;
  user_id: string;

  // Personal Information
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profile_photo_url?: string;
  intro_video_url?: string;
  bio?: string;

  // Location and availability
  location: string;
  time_zone: string;
  languages: string[];

  // Credentials and experience
  years_coaching: number;
  students_coached: number;
  certifications: string[];
  racing_achievements: string[];

  // Expertise
  boat_classes: string[];
  specialties: string[];
  skill_levels: SkillLevel[];

  // Business information
  hourly_rate?: number; // cents
  package_rates?: PackageRates;
  currency: string;

  // Status and verification
  status: CoachStatus;
  is_verified: boolean;
  verification_documents?: any;

  // Performance metrics
  average_rating: number;
  total_reviews: number;
  total_sessions: number;
  response_time_hours: number;

  created_at: string;
  updated_at: string;
}

export interface CoachService {
  id: string;
  coach_id: string;

  service_type: ServiceType;
  title: string;
  description: string;
  deliverables: string[];

  // Pricing
  base_price: number; // cents
  package_price?: number; // cents
  currency: string;

  // Availability and logistics
  duration_minutes: number;
  turnaround_hours?: number;
  is_active: boolean;
  max_participants: number;

  created_at: string;
  updated_at: string;
}

export interface CoachAvailability {
  id: string;
  coach_id: string;

  day_of_week: number; // 0 = Sunday
  start_time: string; // HH:MM format
  end_time: string;   // HH:MM format

  is_recurring: boolean;
  valid_from?: string; // Date string
  valid_until?: string; // Date string

  created_at: string;
}

export interface CoachingSession {
  id: string;

  // Participants
  coach_id: string;
  student_id: string;
  service_id?: string;

  // Session details
  title: string;
  description?: string;
  scheduled_start: string; // ISO date string
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;

  // Status and logistics
  status: SessionStatus;
  meeting_url?: string;
  meeting_id?: string;
  session_notes?: string;
  coach_notes?: string;
  student_goals?: string;

  // Payment information
  total_amount: number; // cents
  platform_fee?: number | null; // cents
  coach_payout: number; // cents
  currency: string;
  payment_status: PaymentStatus;
  stripe_payment_intent_id?: string;

  // Data sharing
  shared_data?: any;

  created_at: string;
  updated_at: string;
}

export interface SessionReview {
  id: string;

  session_id: string;
  reviewer_id: string;
  reviewee_id: string;
  reviewer_type: 'student' | 'coach';

  // Rating categories
  overall_rating: number; // 1-5
  knowledge_rating?: number;
  communication_rating?: number;
  value_rating?: number;
  results_rating?: number;

  // Review content
  review_text?: string;
  helpful_count: number;

  // Moderation
  is_verified: boolean;
  is_featured: boolean;
  moderation_status: ModerationStatus;

  created_at: string;
  updated_at: string;
}

export interface SailingSpecialty {
  id: string;
  name: string;
  category: 'boat_class' | 'skill' | 'condition' | 'role';
  description?: string;
}

// Enums and Union Types
export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional';

export type CoachStatus = 'pending' | 'active' | 'suspended' | 'inactive';

export type ServiceType = 'race_analysis' | 'live_coaching' | 'race_day_support' | 'training_program' | 'on_water' | 'video_review' | 'strategy_session';

export type SessionStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'refunded';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

// Helper interfaces
export interface PackageRates {
  [key: string]: number; // e.g., "4_sessions": 48000 (4 sessions for $480)
}

export interface CoachSearchFilters {
  boat_classes?: string[];
  specialties?: string[];
  skill_levels?: SkillLevel[];
  price_range?: [number, number]; // [min, max] in cents
  location?: string;
  time_zone?: string; // Filter by coach's time zone (e.g., "America/New_York")
  availability?: {
    date?: string;
    time_range?: [string, string]; // [start_time, end_time]
  };
  rating?: number; // minimum rating
  languages?: string[];
  session_types?: ServiceType[]; // Filter by service types (on_water, video_review, strategy_session)
  min_match_score?: number; // Minimum AI match score threshold (0-1)
}

export interface CoachSearchResult extends CoachProfile {
  services: CoachService[];
  next_available?: string; // ISO date string
  match_score?: number; // AI matching score 0-1
}

// Form interfaces for registration
export interface CoachRegistrationForm {
  // Step 1: Personal Info
  personal_info: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    location: string;
    time_zone: string;
    languages: string[];
    bio: string;
  };

  // Step 2: Credentials
  credentials: {
    years_coaching: number;
    students_coached: number;
    certifications: string[];
    racing_achievements: string[];
  };

  // Step 3: Expertise
  expertise: {
    boat_classes: string[];
    specialties: string[];
    skill_levels: SkillLevel[];
  };

  // Step 4: Services & Pricing
  services: Omit<CoachService, 'id' | 'coach_id' | 'created_at' | 'updated_at'>[];

  // Step 5: Availability
  availability: Omit<CoachAvailability, 'id' | 'coach_id' | 'created_at'>[];

  // Step 6: Media
  media: {
    profile_photo?: File | string;
    intro_video?: File | string;
  };
}

// API Response types
export interface CoachProfileResponse {
  coach: CoachProfile;
  services: CoachService[];
  availability: CoachAvailability[];
  reviews: SessionReview[];
}

export interface SearchResponse {
  coaches: CoachSearchResult[];
  total_count: number;
  page: number;
  per_page: number;
  filters_applied: CoachSearchFilters;
}

// Dashboard types
export interface CoachDashboardData {
  profile: CoachProfile;
  upcoming_sessions: CoachingSession[];
  pending_reviews: SessionReview[];
  monthly_earnings: number;
  session_stats: {
    total_this_month: number;
    completed_this_month: number;
    avg_rating_this_month: number;
  };
  recent_reviews: SessionReview[];
}

export interface StudentDashboardData {
  upcoming_sessions: CoachingSession[];
  recent_sessions: CoachingSession[];
  favorite_coaches: CoachProfile[];
  recommended_coaches: CoachSearchResult[];
  pending_reviews: SessionReview[];
}

// Sailor Profile for AI Matching
export interface SailorProfile {
  id: string;
  user_id: string;
  sailing_experience: number; // years
  boat_classes: string[];
  goals: string;
  competitive_level: string;
  learning_style?: string;
  location?: string;
  budget_range?: [number, number]; // [min, max] in cents per session
}

// AI Coach Matching Result
export interface AICoachMatchResult {
  coach: CoachSearchResult;
  overallScore: number;
  breakdown: {
    experienceMatch: number;
    teachingStyleMatch: number;
    specialtyAlignment: number;
    successRateRelevance: number;
    availabilityMatch: number;
    locationConvenience: number;
    valueScore: number;
  };
  reasoning: string;
  recommendations: string[];
  sessionPlan?: string;
  focusAreas?: string[];
  expectedOutcomes?: string[];
  preparationTips?: string[];
}
