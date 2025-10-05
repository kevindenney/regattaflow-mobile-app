-- Migration: Coaching Marketplace
-- Creates tables for coach profiles, availability, session bookings, and coaching sessions

-- ============================================================================
-- 1. Coach Profiles Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  specializations TEXT[], -- e.g., ['match_racing', 'boat_handling', 'tactics']
  experience_years INTEGER,
  hourly_rate_usd INTEGER, -- in cents
  profile_photo_url TEXT,
  verification_status TEXT DEFAULT 'pending', -- 'pending' | 'verified' | 'rejected'
  rating DECIMAL(3,2) DEFAULT 0.0, -- Average rating 0.0 - 5.0
  total_sessions INTEGER DEFAULT 0,
  location_name TEXT,
  location_region TEXT,
  languages TEXT[], -- e.g., ['english', 'spanish', 'french']
  certifications TEXT[], -- e.g., ['US Sailing Level 3', 'RYA Yachtmaster']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one coach profile per user
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view verified coach profiles"
  ON public.coach_profiles
  FOR SELECT
  USING (verification_status = 'verified');

CREATE POLICY "Coaches can view their own profile"
  ON public.coach_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches can create their own profile"
  ON public.coach_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can update their own profile"
  ON public.coach_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_coach_profiles_user_id ON public.coach_profiles(user_id);
CREATE INDEX idx_coach_profiles_verification ON public.coach_profiles(verification_status);
CREATE INDEX idx_coach_profiles_location ON public.coach_profiles(location_name, location_region);

-- ============================================================================
-- 2. Coach Availability Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coach_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_available BOOLEAN DEFAULT true,
  recurring_pattern TEXT, -- 'none' | 'weekly' | 'biweekly' | 'monthly'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure start_time is before end_time
  CHECK (start_time < end_time)
);

-- Enable RLS
ALTER TABLE public.coach_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view available slots"
  ON public.coach_availability
  FOR SELECT
  USING (is_available = true);

CREATE POLICY "Coaches can view their own availability"
  ON public.coach_availability
  FOR SELECT
  USING (
    coach_id IN (
      SELECT id FROM public.coach_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can manage their own availability"
  ON public.coach_availability
  FOR ALL
  USING (
    coach_id IN (
      SELECT id FROM public.coach_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    coach_id IN (
      SELECT id FROM public.coach_profiles WHERE user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_coach_availability_coach_id ON public.coach_availability(coach_id);
CREATE INDEX idx_coach_availability_time_range ON public.coach_availability(start_time, end_time);
CREATE INDEX idx_coach_availability_available ON public.coach_availability(is_available);

-- ============================================================================
-- 3. Session Bookings Table (Booking Requests)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.session_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
  availability_slot_id UUID REFERENCES public.coach_availability(id) ON DELETE SET NULL,
  requested_start_time TIMESTAMPTZ NOT NULL,
  requested_end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending' | 'accepted' | 'rejected' | 'cancelled'
  session_type TEXT, -- 'one_on_one' | 'group' | 'video_analysis' | 'race_debrief'
  sailor_message TEXT,
  coach_response TEXT,
  total_amount_cents INTEGER, -- Total booking amount in cents
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure requested_start_time is before requested_end_time
  CHECK (requested_start_time < requested_end_time)
);

-- Enable RLS
ALTER TABLE public.session_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Sailors can view their own bookings"
  ON public.session_bookings
  FOR SELECT
  USING (auth.uid() = sailor_id);

CREATE POLICY "Coaches can view bookings for their sessions"
  ON public.session_bookings
  FOR SELECT
  USING (
    coach_id IN (
      SELECT id FROM public.coach_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Sailors can create bookings"
  ON public.session_bookings
  FOR INSERT
  WITH CHECK (auth.uid() = sailor_id);

CREATE POLICY "Sailors can update their own pending bookings"
  ON public.session_bookings
  FOR UPDATE
  USING (auth.uid() = sailor_id AND status = 'pending')
  WITH CHECK (auth.uid() = sailor_id);

CREATE POLICY "Coaches can update bookings for their sessions"
  ON public.session_bookings
  FOR UPDATE
  USING (
    coach_id IN (
      SELECT id FROM public.coach_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    coach_id IN (
      SELECT id FROM public.coach_profiles WHERE user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_session_bookings_sailor_id ON public.session_bookings(sailor_id);
CREATE INDEX idx_session_bookings_coach_id ON public.session_bookings(coach_id);
CREATE INDEX idx_session_bookings_status ON public.session_bookings(status);
CREATE INDEX idx_session_bookings_time_range ON public.session_bookings(requested_start_time, requested_end_time);

-- ============================================================================
-- 4. Coaching Sessions Table (Confirmed Sessions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.session_bookings(id) ON DELETE CASCADE,
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  session_type TEXT NOT NULL, -- 'one_on_one' | 'group' | 'video_analysis' | 'race_debrief'
  status TEXT DEFAULT 'scheduled', -- 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  venue_id UUID REFERENCES public.sailing_venues(id),
  session_notes TEXT, -- Coach's notes during/after session
  sailor_notes TEXT, -- Sailor's notes/feedback
  rating INTEGER, -- Sailor's rating 1-5
  review TEXT, -- Sailor's written review
  total_amount_cents INTEGER NOT NULL, -- Total session cost in cents
  stripe_payment_id TEXT, -- Stripe payment intent ID
  payment_status TEXT DEFAULT 'pending', -- 'pending' | 'paid' | 'refunded'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure start_time is before end_time
  CHECK (start_time < end_time),
  -- Ensure rating is between 1 and 5
  CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
);

-- Enable RLS
ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Sailors can view their own sessions"
  ON public.coaching_sessions
  FOR SELECT
  USING (auth.uid() = sailor_id);

CREATE POLICY "Coaches can view their own sessions"
  ON public.coaching_sessions
  FOR SELECT
  USING (
    coach_id IN (
      SELECT id FROM public.coach_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create sessions (via booking acceptance)"
  ON public.coaching_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sailors can update their notes and reviews"
  ON public.coaching_sessions
  FOR UPDATE
  USING (auth.uid() = sailor_id)
  WITH CHECK (auth.uid() = sailor_id);

CREATE POLICY "Coaches can update session notes and status"
  ON public.coaching_sessions
  FOR UPDATE
  USING (
    coach_id IN (
      SELECT id FROM public.coach_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    coach_id IN (
      SELECT id FROM public.coach_profiles WHERE user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_coaching_sessions_sailor_id ON public.coaching_sessions(sailor_id);
CREATE INDEX idx_coaching_sessions_coach_id ON public.coaching_sessions(coach_id);
CREATE INDEX idx_coaching_sessions_status ON public.coaching_sessions(status);
CREATE INDEX idx_coaching_sessions_time_range ON public.coaching_sessions(start_time, end_time);
CREATE INDEX idx_coaching_sessions_payment_status ON public.coaching_sessions(payment_status);

-- ============================================================================
-- 5. Helper Functions
-- ============================================================================

-- Function to accept a booking and create a coaching session
CREATE OR REPLACE FUNCTION accept_booking(
  p_booking_id UUID,
  p_coach_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_booking RECORD;
  v_coach_id UUID;
  v_session_id UUID;
BEGIN
  -- Get coach profile ID
  SELECT id INTO v_coach_id
  FROM public.coach_profiles
  WHERE user_id = p_coach_user_id;

  IF v_coach_id IS NULL THEN
    RAISE EXCEPTION 'Coach profile not found';
  END IF;

  -- Get booking details
  SELECT * INTO v_booking
  FROM public.session_bookings
  WHERE id = p_booking_id
    AND coach_id = v_coach_id
    AND status = 'pending';

  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'Booking not found or already processed';
  END IF;

  -- Update booking status
  UPDATE public.session_bookings
  SET status = 'accepted', updated_at = NOW()
  WHERE id = p_booking_id;

  -- Create coaching session
  INSERT INTO public.coaching_sessions (
    booking_id,
    sailor_id,
    coach_id,
    start_time,
    end_time,
    session_type,
    total_amount_cents,
    status
  )
  VALUES (
    p_booking_id,
    v_booking.sailor_id,
    v_booking.coach_id,
    v_booking.requested_start_time,
    v_booking.requested_end_time,
    v_booking.session_type,
    v_booking.total_amount_cents,
    'scheduled'
  )
  RETURNING id INTO v_session_id;

  -- Mark availability slot as unavailable
  IF v_booking.availability_slot_id IS NOT NULL THEN
    UPDATE public.coach_availability
    SET is_available = false, updated_at = NOW()
    WHERE id = v_booking.availability_slot_id;
  END IF;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION accept_booking(UUID, UUID) TO authenticated;

-- Function to reject a booking
CREATE OR REPLACE FUNCTION reject_booking(
  p_booking_id UUID,
  p_coach_user_id UUID,
  p_response TEXT
)
RETURNS void AS $$
DECLARE
  v_coach_id UUID;
BEGIN
  -- Get coach profile ID
  SELECT id INTO v_coach_id
  FROM public.coach_profiles
  WHERE user_id = p_coach_user_id;

  IF v_coach_id IS NULL THEN
    RAISE EXCEPTION 'Coach profile not found';
  END IF;

  -- Update booking status
  UPDATE public.session_bookings
  SET
    status = 'rejected',
    coach_response = p_response,
    updated_at = NOW()
  WHERE id = p_booking_id
    AND coach_id = v_coach_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or already processed';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reject_booking(UUID, UUID, TEXT) TO authenticated;

-- Function to update coach rating after session review
CREATE OR REPLACE FUNCTION update_coach_rating_after_review()
RETURNS TRIGGER AS $$
DECLARE
  v_avg_rating DECIMAL(3,2);
  v_total_sessions INTEGER;
BEGIN
  -- Only update if rating was added/changed
  IF NEW.rating IS NOT NULL AND (OLD.rating IS NULL OR NEW.rating != OLD.rating) THEN
    -- Calculate new average rating
    SELECT
      COALESCE(AVG(rating), 0.0),
      COUNT(*)
    INTO v_avg_rating, v_total_sessions
    FROM public.coaching_sessions
    WHERE coach_id = NEW.coach_id
      AND rating IS NOT NULL
      AND status = 'completed';

    -- Update coach profile
    UPDATE public.coach_profiles
    SET
      rating = v_avg_rating,
      total_sessions = v_total_sessions,
      updated_at = NOW()
    WHERE id = NEW.coach_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rating updates
CREATE TRIGGER trg_update_coach_rating
  AFTER INSERT OR UPDATE OF rating
  ON public.coaching_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_rating_after_review();

-- ============================================================================
-- 6. Comments for documentation
-- ============================================================================

COMMENT ON TABLE public.coach_profiles IS 'Coach profiles for the coaching marketplace';
COMMENT ON TABLE public.coach_availability IS 'Coach availability slots for booking';
COMMENT ON TABLE public.session_bookings IS 'Booking requests from sailors to coaches';
COMMENT ON TABLE public.coaching_sessions IS 'Confirmed coaching sessions';
COMMENT ON FUNCTION accept_booking(UUID, UUID) IS 'Accepts a booking request and creates a coaching session';
COMMENT ON FUNCTION reject_booking(UUID, UUID, TEXT) IS 'Rejects a booking request with optional response';
COMMENT ON FUNCTION update_coach_rating_after_review() IS 'Trigger function to update coach rating after session review';
