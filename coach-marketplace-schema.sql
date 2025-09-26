-- Coach Marketplace Database Schema
-- Execute this SQL in your Supabase Dashboard SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Coach profiles table
CREATE TABLE IF NOT EXISTS coach_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  profile_photo_url TEXT,
  intro_video_url TEXT,
  bio TEXT,

  -- Location and availability
  location TEXT NOT NULL,
  time_zone TEXT NOT NULL,
  languages TEXT[] NOT NULL DEFAULT ARRAY['English'],

  -- Credentials and experience
  years_coaching INTEGER NOT NULL DEFAULT 0,
  students_coached INTEGER NOT NULL DEFAULT 0,
  certifications TEXT[] DEFAULT ARRAY[]::TEXT[],
  racing_achievements TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Expertise
  boat_classes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[], -- 'Heavy weather', 'Tactics', 'Spinnaker work'
  skill_levels TEXT[] NOT NULL DEFAULT ARRAY['Intermediate'], -- 'Beginner', 'Intermediate', 'Advanced', 'Professional'

  -- Business information
  hourly_rate INTEGER, -- cents (e.g., 12000 = $120.00)
  package_rates JSONB, -- flexible pricing options
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Status and verification
  status TEXT CHECK (status IN ('pending', 'active', 'suspended', 'inactive')) NOT NULL DEFAULT 'pending',
  is_verified BOOLEAN DEFAULT false,
  verification_documents JSONB,

  -- Performance metrics
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  response_time_hours INTEGER DEFAULT 24,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service offerings table
CREATE TABLE IF NOT EXISTS coach_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES coach_profiles(id) ON DELETE CASCADE,

  service_type TEXT CHECK (service_type IN ('race_analysis', 'live_coaching', 'race_day_support', 'training_program')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  deliverables TEXT[] NOT NULL,

  -- Pricing
  base_price INTEGER NOT NULL, -- cents
  package_price INTEGER, -- optional package deal
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Availability and logistics
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  turnaround_hours INTEGER, -- for async services like race analysis
  is_active BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 1, -- for group coaching

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coach availability table
CREATE TABLE IF NOT EXISTS coach_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES coach_profiles(id) ON DELETE CASCADE,

  -- Time slots
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6) NOT NULL, -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Recurrence and exceptions
  is_recurring BOOLEAN DEFAULT true,
  valid_from DATE,
  valid_until DATE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Booking sessions table
CREATE TABLE IF NOT EXISTS coaching_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Participants
  coach_id UUID REFERENCES coach_profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES coach_services(id),

  -- Session details
  title TEXT NOT NULL,
  description TEXT,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,

  -- Status and logistics
  status TEXT CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')) NOT NULL DEFAULT 'pending',
  meeting_url TEXT,
  meeting_id TEXT,
  session_notes TEXT,
  coach_notes TEXT,
  student_goals TEXT,

  -- Payment information
  total_amount INTEGER NOT NULL, -- cents
  platform_fee INTEGER NOT NULL, -- cents
  coach_payout INTEGER NOT NULL, -- cents
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_status TEXT CHECK (payment_status IN ('pending', 'authorized', 'captured', 'refunded')) NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,

  -- Data sharing
  shared_data JSONB, -- performance data shared by student

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews and ratings table
CREATE TABLE IF NOT EXISTS session_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  session_id UUID REFERENCES coaching_sessions(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_type TEXT CHECK (reviewer_type IN ('student', 'coach')) NOT NULL,

  -- Rating categories
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5) NOT NULL,
  knowledge_rating INTEGER CHECK (knowledge_rating >= 1 AND knowledge_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  results_rating INTEGER CHECK (results_rating >= 1 AND results_rating <= 5),

  -- Review content
  review_text TEXT,
  helpful_count INTEGER DEFAULT 0,

  -- Moderation
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  moderation_status TEXT CHECK (moderation_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coach specialization lookup table
CREATE TABLE IF NOT EXISTS sailing_specialties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'boat_class', 'skill', 'condition', 'role'
  description TEXT
);

-- Insert common sailing specialties
INSERT INTO sailing_specialties (id, name, category, description)
VALUES
  -- Boat classes
  ('dragon', 'Dragon Class', 'boat_class', 'Classic one-design keelboat racing'),
  ('j80', 'J/80', 'boat_class', 'Popular sportboat for team racing'),
  ('melges-24', 'Melges 24', 'boat_class', 'High-performance sportboat'),
  ('optimist', 'Optimist', 'boat_class', 'Youth sailing development'),
  ('laser', 'Laser/ILCA', 'boat_class', 'Single-handed Olympic class'),
  ('470', '470', 'boat_class', 'Two-person Olympic dinghy'),
  ('49er', '49er/49erFX', 'boat_class', 'High-performance skiff sailing'),

  -- Skills and techniques
  ('tactics', 'Tactical Racing', 'skill', 'Fleet racing strategy and tactics'),
  ('spinnaker', 'Spinnaker Work', 'skill', 'Downwind sailing and spinnaker handling'),
  ('heavy-weather', 'Heavy Weather', 'skill', 'Sailing in challenging conditions'),
  ('light-air', 'Light Air', 'skill', 'Performance in minimal wind conditions'),
  ('match-racing', 'Match Racing', 'skill', '1v1 competitive sailing'),
  ('team-racing', 'Team Racing', 'skill', 'Multi-boat team competition'),
  ('boat-handling', 'Boat Handling', 'skill', 'Crew coordination and boat control'),
  ('boat-tuning', 'Boat Tuning', 'skill', 'Equipment optimization and setup'),

  -- Roles
  ('skipper', 'Skipper Development', 'role', 'Leadership and decision making'),
  ('crew', 'Crew Training', 'role', 'Crew skills and coordination'),
  ('tactician', 'Tactician Training', 'role', 'Strategic planning and execution')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS coach_profiles_user_id_idx ON coach_profiles (user_id);
CREATE INDEX IF NOT EXISTS coach_profiles_status_idx ON coach_profiles (status);
CREATE INDEX IF NOT EXISTS coach_profiles_location_idx ON coach_profiles (location);
CREATE INDEX IF NOT EXISTS coach_profiles_boat_classes_idx ON coach_profiles USING GIN (boat_classes);
CREATE INDEX IF NOT EXISTS coach_profiles_specialties_idx ON coach_profiles USING GIN (specialties);
CREATE INDEX IF NOT EXISTS coach_profiles_rating_idx ON coach_profiles (average_rating DESC);

CREATE INDEX IF NOT EXISTS coach_services_coach_id_idx ON coach_services (coach_id);
CREATE INDEX IF NOT EXISTS coach_services_type_idx ON coach_services (service_type);
CREATE INDEX IF NOT EXISTS coach_services_active_idx ON coach_services (is_active);

CREATE INDEX IF NOT EXISTS coach_availability_coach_id_idx ON coach_availability (coach_id);
CREATE INDEX IF NOT EXISTS coach_availability_day_idx ON coach_availability (day_of_week, start_time);

CREATE INDEX IF NOT EXISTS coaching_sessions_coach_id_idx ON coaching_sessions (coach_id);
CREATE INDEX IF NOT EXISTS coaching_sessions_student_id_idx ON coaching_sessions (student_id);
CREATE INDEX IF NOT EXISTS coaching_sessions_status_idx ON coaching_sessions (status);
CREATE INDEX IF NOT EXISTS coaching_sessions_scheduled_idx ON coaching_sessions (scheduled_start);

CREATE INDEX IF NOT EXISTS session_reviews_session_id_idx ON session_reviews (session_id);
CREATE INDEX IF NOT EXISTS session_reviews_reviewee_idx ON session_reviews (reviewee_id);

-- Enable Row Level Security
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE sailing_specialties ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Coach profiles: Anyone can view active coaches, coaches can edit their own
CREATE POLICY "Anyone can view active coach profiles" ON coach_profiles
  FOR SELECT USING (status = 'active');

CREATE POLICY "Coaches can update their own profile" ON coach_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coach profile" ON coach_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Coach services: Anyone can view active services, coaches manage their own
CREATE POLICY "Anyone can view active coach services" ON coach_services
  FOR SELECT USING (is_active = true AND EXISTS (
    SELECT 1 FROM coach_profiles WHERE id = coach_id AND status = 'active'
  ));

CREATE POLICY "Coaches can manage their own services" ON coach_services
  FOR ALL USING (EXISTS (
    SELECT 1 FROM coach_profiles WHERE id = coach_id AND user_id = auth.uid()
  ));

-- Coach availability: Only coaches can manage their availability
CREATE POLICY "Coaches can manage their own availability" ON coach_availability
  FOR ALL USING (EXISTS (
    SELECT 1 FROM coach_profiles WHERE id = coach_id AND user_id = auth.uid()
  ));

-- Coaching sessions: Participants can view/manage their sessions
CREATE POLICY "Participants can view their coaching sessions" ON coaching_sessions
  FOR SELECT USING (
    auth.uid() = student_id OR
    EXISTS (SELECT 1 FROM coach_profiles WHERE id = coach_id AND user_id = auth.uid())
  );

CREATE POLICY "Students can book coaching sessions" ON coaching_sessions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Participants can update their coaching sessions" ON coaching_sessions
  FOR UPDATE USING (
    auth.uid() = student_id OR
    EXISTS (SELECT 1 FROM coach_profiles WHERE id = coach_id AND user_id = auth.uid())
  );

-- Session reviews: Public read, participants can write
CREATE POLICY "Anyone can view approved session reviews" ON session_reviews
  FOR SELECT USING (moderation_status = 'approved');

CREATE POLICY "Session participants can write reviews" ON session_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM coaching_sessions
      WHERE id = session_id
      AND (student_id = auth.uid() OR coach_id IN (
        SELECT id FROM coach_profiles WHERE user_id = auth.uid()
      ))
      AND status = 'completed'
    )
  );

-- Sailing specialties: Public read-only
CREATE POLICY "Anyone can view sailing specialties" ON sailing_specialties
  FOR SELECT USING (true);

-- Functions for automatic updates

-- Update coach profile metrics when reviews are added/updated
CREATE OR REPLACE FUNCTION update_coach_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'session_reviews' AND NEW.reviewer_type = 'student' THEN
    UPDATE coach_profiles
    SET
      average_rating = (
        SELECT AVG(overall_rating)::DECIMAL(3,2)
        FROM session_reviews sr
        JOIN coaching_sessions cs ON sr.session_id = cs.id
        WHERE cs.coach_id = (
          SELECT coach_id FROM coaching_sessions WHERE id = NEW.session_id
        )
        AND sr.reviewer_type = 'student'
        AND sr.moderation_status = 'approved'
      ),
      total_reviews = (
        SELECT COUNT(*)
        FROM session_reviews sr
        JOIN coaching_sessions cs ON sr.session_id = cs.id
        WHERE cs.coach_id = (
          SELECT coach_id FROM coaching_sessions WHERE id = NEW.session_id
        )
        AND sr.reviewer_type = 'student'
        AND sr.moderation_status = 'approved'
      )
    WHERE id = (SELECT coach_id FROM coaching_sessions WHERE id = NEW.session_id);
  END IF;

  IF TG_TABLE_NAME = 'coaching_sessions' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE coach_profiles
    SET total_sessions = total_sessions + 1
    WHERE id = NEW.coach_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_coach_metrics_on_review
  AFTER INSERT OR UPDATE ON session_reviews
  FOR EACH ROW EXECUTE FUNCTION update_coach_metrics();

CREATE TRIGGER update_coach_metrics_on_session
  AFTER UPDATE ON coaching_sessions
  FOR EACH ROW EXECUTE FUNCTION update_coach_metrics();

-- Verification query
SELECT 'Coach Marketplace Schema deployed successfully! 🚀' as result;

-- Display table counts
SELECT 'Coach profiles table created' as result;
SELECT 'Coach services table created' as result;
SELECT 'Coach availability table created' as result;
SELECT 'Coaching sessions table created' as result;
SELECT 'Session reviews table created' as result;
SELECT
  'Sailing specialties: ' || COUNT(*) as specialties_count
FROM sailing_specialties;