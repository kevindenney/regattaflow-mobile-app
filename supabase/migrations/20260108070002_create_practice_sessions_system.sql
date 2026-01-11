-- Migration: Create Practice Sessions System
-- Purpose: Enable scheduled and ad-hoc practice sessions with AI-suggested drills
--          and crew coordination for deliberate practice
--
-- Tables created:
-- 1. drills - Library of practice drills (reference data)
-- 2. drill_skill_mappings - Maps drills to skill areas for AI matching
-- 3. practice_sessions - Core practice session data
-- 4. practice_session_members - Crew participation (mirrors team_race_entry_members)
-- 5. practice_session_focus_areas - Skills being practiced in a session
-- 6. practice_session_drills - Drills performed in a session
-- 7. practice_skill_progress - Aggregated practice impact on skill development

-- =============================================================================
-- TABLE: drills
-- Library of practice drills (reference data)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- e.g., 'gate-start', 'roll-tack'

  -- Basic info
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT, -- Detailed how-to (markdown supported)

  -- Categorization
  category TEXT NOT NULL CHECK (category IN (
    'starting', 'upwind', 'downwind', 'mark_rounding',
    'boat_handling', 'crew_work', 'rules', 'fitness'
  )),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),

  -- Requirements
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  min_crew INTEGER DEFAULT 1,
  max_crew INTEGER DEFAULT 4,
  requires_marks BOOLEAN DEFAULT FALSE,
  requires_coach_boat BOOLEAN DEFAULT FALSE,
  solo_friendly BOOLEAN DEFAULT TRUE,

  -- Learning integration
  linked_interactive_id TEXT, -- e.g., 'StartingSequenceInteractive'
  linked_lesson_id TEXT, -- Course lesson slug
  linked_module_id TEXT, -- Course module slug

  -- Media
  video_url TEXT,
  diagram_url TEXT,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  source TEXT, -- e.g., 'RegattaFlow Playbook', 'NorthU', 'Custom'
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drills_category ON drills(category);
CREATE INDEX idx_drills_difficulty ON drills(difficulty);
CREATE INDEX idx_drills_slug ON drills(slug);
CREATE INDEX idx_drills_active ON drills(is_active) WHERE is_active = TRUE;

-- =============================================================================
-- TABLE: drill_skill_mappings
-- Maps drills to skill areas (for AI matching)
-- Skill areas match PostRaceLearningService metrics
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.drill_skill_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drill_id UUID NOT NULL REFERENCES public.drills(id) ON DELETE CASCADE,

  -- Skill area (matches PostRaceLearningService metrics)
  skill_area TEXT NOT NULL CHECK (skill_area IN (
    'equipment-prep', 'pre-race-planning', 'crew-coordination',
    'prestart-sequence', 'start-execution', 'upwind-execution',
    'shift-awareness', 'windward-rounding', 'downwind-speed',
    'leeward-rounding', 'finish-execution'
  )),

  -- How strongly this drill addresses the skill (for ranking)
  relevance_score INTEGER NOT NULL DEFAULT 50 CHECK (relevance_score >= 0 AND relevance_score <= 100),

  -- Framework connection (optional - links to RegattaFlow Playbook frameworks)
  framework TEXT CHECK (framework IN (
    'Puff Response Framework', 'Delayed Tack', 'Wind Shift Mathematics',
    'Shift Frequency Formula', 'Downwind Shift Detection',
    'Getting In Phase', 'Performance Pyramid', NULL
  )),

  CONSTRAINT unique_drill_skill UNIQUE(drill_id, skill_area)
);

CREATE INDEX idx_drill_skill_mappings_drill ON drill_skill_mappings(drill_id);
CREATE INDEX idx_drill_skill_mappings_skill ON drill_skill_mappings(skill_area);

-- =============================================================================
-- TABLE: practice_sessions
-- Core practice session data - supports both scheduled and logged sessions
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Session ownership
  created_by UUID NOT NULL REFERENCES auth.users(id),
  sailor_id UUID, -- Links to performance tracking (FK to sailor_profiles omitted for compatibility)

  -- Session type and status
  session_type TEXT NOT NULL CHECK (session_type IN ('scheduled', 'logged')),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),

  -- Scheduling
  scheduled_date DATE,
  scheduled_start_time TIME,
  duration_minutes INTEGER, -- Planned duration
  actual_duration_minutes INTEGER, -- Logged after completion

  -- Location (optional - for on-water practice)
  venue_id UUID, -- Optional link to venue (FK omitted as venues table may not exist)
  venue_name TEXT, -- Fallback if no venue record
  location_lat DECIMAL(10, 7),
  location_lng DECIMAL(10, 7),

  -- Conditions (logged or forecast)
  wind_speed_min INTEGER,
  wind_speed_max INTEGER,
  wind_direction INTEGER,

  -- Session metadata
  title TEXT, -- Optional custom title
  notes TEXT,

  -- Team/crew coordination (mirrors team_race_entries pattern)
  invite_code TEXT UNIQUE, -- 8-character code for joining
  max_crew_size INTEGER DEFAULT 4,

  -- AI suggestion tracking
  ai_suggested BOOLEAN DEFAULT FALSE,
  ai_suggestion_context JSONB, -- Stores the learning profile snapshot used for suggestion

  -- Post-session reflection
  reflection_notes TEXT,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_practice_sessions_created_by ON practice_sessions(created_by);
CREATE INDEX idx_practice_sessions_sailor ON practice_sessions(sailor_id) WHERE sailor_id IS NOT NULL;
CREATE INDEX idx_practice_sessions_date ON practice_sessions(scheduled_date) WHERE scheduled_date IS NOT NULL;
CREATE INDEX idx_practice_sessions_status ON practice_sessions(status);
CREATE INDEX idx_practice_sessions_invite_code ON practice_sessions(invite_code) WHERE invite_code IS NOT NULL;

-- =============================================================================
-- TABLE: practice_session_members
-- Crew/partner participation (mirrors team_race_entry_members pattern)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.practice_session_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Member info
  display_name TEXT,
  role TEXT CHECK (role IN ('organizer', 'skipper', 'crew', 'coach', 'observer')),

  -- Attendance tracking
  rsvp_status TEXT DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'maybe')),
  attended BOOLEAN, -- Set after session

  -- Timestamps
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each user can only join once
  CONSTRAINT unique_member_per_session UNIQUE(session_id, user_id)
);

CREATE INDEX idx_practice_members_user ON practice_session_members(user_id);
CREATE INDEX idx_practice_members_session ON practice_session_members(session_id);

-- =============================================================================
-- TABLE: practice_session_focus_areas
-- Links sessions to skill areas being practiced
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.practice_session_focus_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,

  -- Skill area being practiced
  skill_area TEXT NOT NULL CHECK (skill_area IN (
    'equipment-prep', 'pre-race-planning', 'crew-coordination',
    'prestart-sequence', 'start-execution', 'upwind-execution',
    'shift-awareness', 'windward-rounding', 'downwind-speed',
    'leeward-rounding', 'finish-execution'
  )),

  -- Priority (1 = primary focus)
  priority INTEGER NOT NULL DEFAULT 1,

  -- Pre/post session assessment
  pre_session_confidence INTEGER CHECK (pre_session_confidence >= 1 AND pre_session_confidence <= 5),
  post_session_rating INTEGER CHECK (post_session_rating >= 1 AND post_session_rating <= 5),
  improvement_notes TEXT,

  -- AI context
  ai_suggested BOOLEAN DEFAULT FALSE,
  suggestion_reason TEXT, -- e.g., 'Declining trend in last 3 races'

  CONSTRAINT unique_session_skill UNIQUE(session_id, skill_area)
);

CREATE INDEX idx_focus_areas_session ON practice_session_focus_areas(session_id);
CREATE INDEX idx_focus_areas_skill ON practice_session_focus_areas(skill_area);

-- =============================================================================
-- TABLE: practice_session_drills
-- Drills performed in a session with outcomes
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.practice_session_drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  drill_id UUID NOT NULL REFERENCES public.drills(id),

  -- Execution
  order_index INTEGER NOT NULL DEFAULT 0,
  planned_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  repetitions INTEGER,

  -- Outcomes
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  skipped BOOLEAN DEFAULT FALSE,
  skip_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_drills_session ON practice_session_drills(session_id);
CREATE INDEX idx_session_drills_drill ON practice_session_drills(drill_id);

-- =============================================================================
-- TABLE: practice_skill_progress
-- Aggregates practice impact on skill development (separate from race analysis)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.practice_skill_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sailor_id UUID NOT NULL, -- FK to sailor_profiles omitted for compatibility
  skill_area TEXT NOT NULL,

  -- Aggregated metrics
  sessions_count INTEGER NOT NULL DEFAULT 0,
  total_practice_minutes INTEGER NOT NULL DEFAULT 0,
  average_rating DECIMAL(3, 2),
  latest_rating INTEGER,
  trend TEXT CHECK (trend IN ('improving', 'stable', 'declining')),

  -- Timestamps
  last_practiced_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_sailor_skill UNIQUE(sailor_id, skill_area)
);

CREATE INDEX idx_skill_progress_sailor ON practice_skill_progress(sailor_id);
CREATE INDEX idx_skill_progress_skill ON practice_skill_progress(skill_area);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drill_skill_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_session_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_session_focus_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_session_drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_skill_progress ENABLE ROW LEVEL SECURITY;

-- Drills are public read (reference data)
CREATE POLICY "drills_public_read" ON drills FOR SELECT USING (true);
CREATE POLICY "drill_mappings_public_read" ON drill_skill_mappings FOR SELECT USING (true);

-- Practice sessions: creator and members can read
CREATE POLICY "practice_sessions_member_read" ON practice_sessions
  FOR SELECT USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM practice_session_members
      WHERE practice_session_members.session_id = practice_sessions.id
      AND practice_session_members.user_id = auth.uid()
    )
  );

-- Anyone can read by invite code (for joining)
CREATE POLICY "practice_sessions_invite_read" ON practice_sessions
  FOR SELECT USING (invite_code IS NOT NULL);

-- Creator can insert
CREATE POLICY "practice_sessions_creator_insert" ON practice_sessions
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Creator can update
CREATE POLICY "practice_sessions_creator_update" ON practice_sessions
  FOR UPDATE USING (created_by = auth.uid());

-- Creator can delete
CREATE POLICY "practice_sessions_creator_delete" ON practice_sessions
  FOR DELETE USING (created_by = auth.uid());

-- Session members: members can read other members in the same session
CREATE POLICY "practice_members_member_read" ON practice_session_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM practice_session_members AS my_membership
      WHERE my_membership.session_id = practice_session_members.session_id
      AND my_membership.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM practice_sessions
      WHERE practice_sessions.id = practice_session_members.session_id
      AND practice_sessions.created_by = auth.uid()
    )
  );

-- Users can insert themselves (joining via invite code)
CREATE POLICY "practice_members_self_insert" ON practice_session_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own membership
CREATE POLICY "practice_members_self_update" ON practice_session_members
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own membership (leaving session)
CREATE POLICY "practice_members_self_delete" ON practice_session_members
  FOR DELETE USING (user_id = auth.uid());

-- Session creator can delete any member
CREATE POLICY "practice_members_creator_delete" ON practice_session_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM practice_sessions
      WHERE practice_sessions.id = practice_session_members.session_id
      AND practice_sessions.created_by = auth.uid()
    )
  );

-- Focus areas: session creator and members can manage
CREATE POLICY "focus_areas_read" ON practice_session_focus_areas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM practice_sessions
      WHERE practice_sessions.id = practice_session_focus_areas.session_id
      AND (
        practice_sessions.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM practice_session_members
          WHERE practice_session_members.session_id = practice_sessions.id
          AND practice_session_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "focus_areas_creator_manage" ON practice_session_focus_areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM practice_sessions
      WHERE practice_sessions.id = practice_session_focus_areas.session_id
      AND practice_sessions.created_by = auth.uid()
    )
  );

-- Session drills: same access as focus areas
CREATE POLICY "session_drills_read" ON practice_session_drills
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM practice_sessions
      WHERE practice_sessions.id = practice_session_drills.session_id
      AND (
        practice_sessions.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM practice_session_members
          WHERE practice_session_members.session_id = practice_sessions.id
          AND practice_session_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "session_drills_creator_manage" ON practice_session_drills
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM practice_sessions
      WHERE practice_sessions.id = practice_session_drills.session_id
      AND practice_sessions.created_by = auth.uid()
    )
  );

-- Skill progress: sailors can view/update their own
CREATE POLICY "skill_progress_own_read" ON practice_skill_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sailor_profiles
      WHERE sailor_profiles.id = practice_skill_progress.sailor_id
      AND sailor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "skill_progress_own_manage" ON practice_skill_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sailor_profiles
      WHERE sailor_profiles.id = practice_skill_progress.sailor_id
      AND sailor_profiles.user_id = auth.uid()
    )
  );

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update updated_at timestamp on practice_sessions
CREATE OR REPLACE FUNCTION update_practice_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_practice_session_updated_at
  BEFORE UPDATE ON practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_practice_session_updated_at();

-- Update updated_at on drills
CREATE TRIGGER trigger_drills_updated_at
  BEFORE UPDATE ON drills
  FOR EACH ROW
  EXECUTE FUNCTION update_practice_session_updated_at();

-- Auto-add creator as first member (organizer role)
CREATE OR REPLACE FUNCTION add_practice_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO practice_session_members (session_id, user_id, role, rsvp_status)
  VALUES (NEW.id, NEW.created_by, 'organizer', 'accepted');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_add_practice_creator_as_member
  AFTER INSERT ON practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION add_practice_creator_as_member();

-- Update skill progress when session is completed
CREATE OR REPLACE FUNCTION update_practice_skill_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_sailor_id UUID;
  v_focus_area RECORD;
  v_session_duration INTEGER;
BEGIN
  -- Only process on session completion
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    v_sailor_id := NEW.sailor_id;
    v_session_duration := COALESCE(NEW.actual_duration_minutes, NEW.duration_minutes, 0);

    IF v_sailor_id IS NOT NULL THEN
      -- Update progress for each focus area with a rating
      FOR v_focus_area IN
        SELECT skill_area, post_session_rating
        FROM practice_session_focus_areas
        WHERE session_id = NEW.id
        AND post_session_rating IS NOT NULL
      LOOP
        INSERT INTO practice_skill_progress (
          sailor_id, skill_area, sessions_count, total_practice_minutes,
          latest_rating, last_practiced_at
        )
        VALUES (
          v_sailor_id, v_focus_area.skill_area, 1, v_session_duration,
          v_focus_area.post_session_rating, NOW()
        )
        ON CONFLICT (sailor_id, skill_area) DO UPDATE SET
          sessions_count = practice_skill_progress.sessions_count + 1,
          total_practice_minutes = practice_skill_progress.total_practice_minutes + v_session_duration,
          latest_rating = v_focus_area.post_session_rating,
          last_practiced_at = NOW(),
          updated_at = NOW(),
          -- Recalculate average (simple running average)
          average_rating = (
            COALESCE(practice_skill_progress.average_rating, 0) * practice_skill_progress.sessions_count
            + v_focus_area.post_session_rating
          ) / (practice_skill_progress.sessions_count + 1);
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_skill_progress
  AFTER UPDATE ON practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_practice_skill_progress();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to set invite code on practice session (reuses generate_invite_code)
CREATE OR REPLACE FUNCTION set_practice_invite_code(session_id UUID)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
BEGIN
  -- Generate unique code (reuses existing generate_invite_code function)
  LOOP
    new_code := generate_invite_code();
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM practice_sessions WHERE invite_code = new_code
    ) AND NOT EXISTS (
      SELECT 1 FROM team_race_entries WHERE invite_code = new_code
    );
  END LOOP;

  -- Update session with new code
  UPDATE practice_sessions
  SET invite_code = new_code
  WHERE id = session_id;

  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join practice session via invite code
CREATE OR REPLACE FUNCTION join_practice_by_invite(
  p_invite_code TEXT,
  p_display_name TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'crew'
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_new_member_id UUID;
BEGIN
  -- Find session by invite code
  SELECT id INTO v_session_id
  FROM practice_sessions
  WHERE invite_code = p_invite_code;

  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM practice_session_members
    WHERE session_id = v_session_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Already a member of this practice session';
  END IF;

  -- Add user as member
  INSERT INTO practice_session_members (session_id, user_id, display_name, role, rsvp_status)
  VALUES (v_session_id, auth.uid(), p_display_name, p_role, 'accepted')
  RETURNING id INTO v_new_member_id;

  RETURN v_new_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION set_practice_invite_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION join_practice_by_invite(TEXT, TEXT, TEXT) TO authenticated;

-- =============================================================================
-- REALTIME
-- =============================================================================

-- Enable Supabase Realtime for practice session members (for crew coordination)
ALTER PUBLICATION supabase_realtime ADD TABLE practice_session_members;

-- =============================================================================
-- SEED DATA: Initial Drill Library
-- =============================================================================

-- Starting Drills
INSERT INTO public.drills (slug, name, description, instructions, category, difficulty, duration_minutes, min_crew, solo_friendly, linked_interactive_id, tags)
VALUES
('gate-start', 'Gate Start Drill',
 'Practice port-tack approach to the pin end, accelerating through the gate with proper timing.',
 E'1. Set up a windward mark and pin end mark\n2. Start from behind the line on port tack\n3. Practice acceleration timing to cross the line at full speed\n4. Focus on judging the layline to the pin\n5. Repeat 10-15 times, varying approach angles',
 'starting', 'intermediate', 15, 1, true, 'TimedRunInteractive', ARRAY['starts', 'acceleration', 'timing']),

('rabbit-start', 'Rabbit Start Practice',
 'Simulated rabbit starts with a partner boat acting as pathfinder.',
 E'1. One boat acts as the rabbit (pathfinder)\n2. Other boats line up behind on starboard\n3. Rabbit sails a beam reach across the starting area\n4. Other boats bear away and duck behind, then head up to close-hauled\n5. Practice timing to cross close behind the rabbit',
 'starting', 'intermediate', 20, 2, false, NULL, ARRAY['starts', 'timing', 'boat handling']),

('line-sight', 'Line Sight Drill',
 'Practice judging distance to the line from different positions along the line.',
 E'1. Set up a practice starting line\n2. Approach from different angles and distances\n3. Stop and estimate your distance to the line\n4. Sail to the line to verify your estimate\n5. Build mental calibration for line distance',
 'starting', 'beginner', 10, 1, true, 'FavoredEndInteractive', ARRAY['starts', 'spatial awareness', 'line']),

('acceleration-runs', 'Acceleration Runs',
 'Repeated from-stop accelerations, timing to reach target speed in minimum distance.',
 E'1. Come to a complete stop with sails luffing\n2. Sheet in and accelerate as quickly as possible\n3. Time how long it takes to reach target speed\n4. Note the distance traveled during acceleration\n5. Repeat 10 times, trying to reduce time and distance',
 'starting', 'beginner', 15, 1, true, NULL, ARRAY['starts', 'acceleration', 'boat speed']),

('crowded-start', 'Crowded Start Simulation',
 'Practice maintaining lane and acceleration in close proximity to other boats.',
 E'1. Line up 3+ boats on the line with tight spacing\n2. Practice starts with boats converging\n3. Focus on protecting your lane and maintaining speed\n4. Work on responding to boats attempting to roll over you\n5. Debrief after each start on positioning decisions',
 'starting', 'advanced', 20, 3, false, 'StartingStrategiesInteractive', ARRAY['starts', 'tactics', 'fleet racing']);

-- Upwind Drills
INSERT INTO public.drills (slug, name, description, instructions, category, difficulty, duration_minutes, min_crew, solo_friendly, linked_interactive_id, tags)
VALUES
('roll-tack', 'Roll Tack Refinement',
 'Repeated roll tacks focusing on speed preservation through the maneuver.',
 E'1. Sail upwind at target speed\n2. Initiate tack with a smooth roll to windward\n3. Cross the boat maintaining momentum\n4. Exit the tack with a counter-roll for acceleration\n5. Check boat speed immediately after tack\n6. Target: no more than 0.2kt loss through the tack',
 'boat_handling', 'beginner', 10, 1, true, NULL, ARRAY['tacking', 'boat handling', 'speed']),

('tack-on-header', 'Tack on Headers',
 'Practice immediate response to wind shifts with confident decision-making.',
 E'1. Sail upwind focusing on compass heading\n2. When you detect a header (5+ degrees), commit to tacking\n3. Execute the tack smoothly without hesitation\n4. After tacking, verify you are now lifted\n5. Track your gains over multiple shifts',
 'upwind', 'intermediate', 20, 1, true, 'UpwindTacticsInteractive', ARRAY['tactics', 'wind shifts', 'upwind']),

('lane-protection', 'Lane Protection Drill',
 'Practice defending your lane against boats attempting lee-bow or slam-dunk.',
 E'1. Partner boat attempts to tack into lee-bow position\n2. Practice pinching up to close the gap\n3. Practice bearing off for speed to drive through\n4. Learn to recognize when you can defend vs. when to tack away\n5. Switch roles and repeat',
 'upwind', 'intermediate', 15, 2, false, NULL, ARRAY['tactics', 'upwind', 'defense']),

('vmg-focus', 'VMG Target Practice',
 'Sail target boat speeds in varying conditions while monitoring polar performance.',
 E'1. Note the target VMG for current conditions\n2. Sail upwind focusing on hitting target numbers\n3. Experiment with pointing vs. footing modes\n4. Find the optimal balance for maximum VMG\n5. Track your performance over 10-minute legs',
 'upwind', 'intermediate', 15, 1, true, NULL, ARRAY['boat speed', 'upwind', 'performance']),

('pointing-vs-footing', 'Point vs Foot Mode Changes',
 'Practice smooth transitions between high and low gears.',
 E'1. Start in pointing mode (high, slow)\n2. On command, transition to footing mode (low, fast)\n3. Practice making the transition smooth and quick\n4. Learn to recognize when each mode is appropriate\n5. Work on sail trim changes for each mode',
 'upwind', 'intermediate', 15, 1, true, NULL, ARRAY['boat speed', 'upwind', 'gears']);

-- Mark Rounding Drills
INSERT INTO public.drills (slug, name, description, instructions, category, difficulty, duration_minutes, min_crew, solo_friendly, linked_interactive_id, tags)
VALUES
('windward-approach', 'Windward Mark Approach',
 'Practice layline judgment and final approach to the windward mark.',
 E'1. Set up a windward mark with offset mark\n2. Practice approaches from both laylines\n3. Focus on judging the layline accurately\n4. Work on speed through the final approach\n5. Practice both inside and outside rounding positions',
 'mark_rounding', 'intermediate', 15, 1, true, 'BuoyRoundingLesson', ARRAY['marks', 'laylines', 'approach']),

('zone-entry', 'Zone Entry Rights',
 'Practice establishing and defending overlap at the zone.',
 E'1. Set up a mark with 3-boat-length zone\n2. Practice entering the zone with overlap\n3. Practice defending against boats trying to establish overlap\n4. Work on calling for room vs. keeping clear\n5. Review rules after each round',
 'mark_rounding', 'advanced', 20, 2, false, 'MarkRoomInteractive', ARRAY['marks', 'rules', 'tactics']),

('bear-away-set', 'Bear-Away Spinnaker Set',
 'Practice coordinated mark rounding with immediate spinnaker deployment.',
 E'1. Approach windward mark on starboard layline\n2. Coordinate spinnaker prep in final approach\n3. Bear away smoothly while crew sets spinnaker\n4. Aim for spinnaker filling within 3 boat lengths of mark\n5. Time your sets and work on reducing delay',
 'mark_rounding', 'intermediate', 15, 2, false, NULL, ARRAY['marks', 'spinnaker', 'crew work']),

('gybe-set', 'Gybe Set at Windward',
 'Practice gybe set for when approaching on port layline.',
 E'1. Approach windward mark on port layline\n2. Coordinate gybe set preparation\n3. Round the mark with immediate gybe\n4. Set spinnaker on new gybe\n5. Practice smooth coordination between helm and crew',
 'mark_rounding', 'advanced', 15, 2, false, NULL, ARRAY['marks', 'spinnaker', 'gybe']),

('leeward-drop', 'Leeward Mark Drop Timing',
 'Practice spinnaker drop timing for clean leeward mark roundings.',
 E'1. Approach leeward mark under spinnaker\n2. Call drop timing based on approach angle\n3. Execute drop cleanly while maintaining speed\n4. Round the mark and accelerate onto new tack\n5. Practice from different approach angles',
 'mark_rounding', 'intermediate', 15, 2, false, NULL, ARRAY['marks', 'spinnaker', 'drop']);

-- Downwind Drills
INSERT INTO public.drills (slug, name, description, instructions, category, difficulty, duration_minutes, min_crew, solo_friendly, linked_interactive_id, tags)
VALUES
('gybe-progression', 'Gybe Progression',
 'Build from slow gybes to full-speed gybes with minimal speed loss.',
 E'1. Start with slow, controlled gybes\n2. Focus on timing and coordination\n3. Gradually increase entry speed\n4. Work on maintaining speed through the gybe\n5. Target: less than 10% speed loss through gybe',
 'boat_handling', 'beginner', 15, 2, false, NULL, ARRAY['gybing', 'boat handling', 'downwind']),

('pressure-hunting', 'Pressure Hunting',
 'Practice reading and sailing to visible pressure on the water.',
 E'1. Sail downwind scanning for pressure\n2. Identify dark patches indicating more wind\n3. Adjust course to sail through pressure\n4. Practice predicting where pressure will move\n5. Compare your routes with competitors',
 'downwind', 'intermediate', 20, 1, true, 'DownwindBasicsInteractive', ARRAY['downwind', 'wind', 'tactics']),

('vmg-angles', 'VMG Angle Awareness',
 'Practice sailing optimal downwind angles by feel and instruments.',
 E'1. Note target downwind VMG angle for conditions\n2. Sail downwind trying to maintain optimal angle\n3. Use apparent wind and boat feel as guides\n4. Experiment with higher and lower angles\n5. Compare VMG at different angles',
 'downwind', 'intermediate', 15, 1, true, NULL, ARRAY['downwind', 'VMG', 'performance']);

-- Crew Work Drills
INSERT INTO public.drills (slug, name, description, instructions, category, difficulty, duration_minutes, min_crew, solo_friendly, linked_interactive_id, tags)
VALUES
('communication-drill', 'Crew Communication Drill',
 'Practice clear, concise tactical communication under pressure.',
 E'1. Establish standard calls for common situations\n2. Practice calling wind shifts, gusts, competitors\n3. Work on timing of calls (early enough to act)\n4. Keep calls short and actionable\n5. Debrief on communication effectiveness',
 'crew_work', 'beginner', 15, 2, false, NULL, ARRAY['crew work', 'communication', 'tactics']),

('role-swap', 'Role Swap Practice',
 'Switch skipper/crew roles to build mutual understanding.',
 E'1. Swap positions completely\n2. Sail a practice race or time trial\n3. Experience the other role challenges\n4. Discuss insights after swapping back\n5. Use learnings to improve communication',
 'crew_work', 'intermediate', 30, 2, false, NULL, ARRAY['crew work', 'communication', 'teamwork']),

('weight-placement', 'Weight Placement Drill',
 'Practice coordinated weight movement for different conditions.',
 E'1. Establish standard weight positions for each mode\n2. Practice quick transitions between positions\n3. Focus on timing moves with waves and gusts\n4. Work on subtle adjustments vs. large moves\n5. Time your response to changing conditions',
 'crew_work', 'intermediate', 15, 2, false, NULL, ARRAY['crew work', 'boat handling', 'trim'])

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  instructions = EXCLUDED.instructions,
  updated_at = NOW();

-- =============================================================================
-- SEED DATA: Drill Skill Mappings
-- =============================================================================

-- Starting drill mappings
INSERT INTO public.drill_skill_mappings (drill_id, skill_area, relevance_score, framework)
SELECT d.id, 'start-execution', 90, NULL FROM drills d WHERE d.slug = 'gate-start'
UNION ALL
SELECT d.id, 'prestart-sequence', 70, NULL FROM drills d WHERE d.slug = 'gate-start'
UNION ALL
SELECT d.id, 'start-execution', 85, NULL FROM drills d WHERE d.slug = 'rabbit-start'
UNION ALL
SELECT d.id, 'prestart-sequence', 60, NULL FROM drills d WHERE d.slug = 'rabbit-start'
UNION ALL
SELECT d.id, 'start-execution', 75, NULL FROM drills d WHERE d.slug = 'line-sight'
UNION ALL
SELECT d.id, 'prestart-sequence', 80, NULL FROM drills d WHERE d.slug = 'line-sight'
UNION ALL
SELECT d.id, 'start-execution', 80, NULL FROM drills d WHERE d.slug = 'acceleration-runs'
UNION ALL
SELECT d.id, 'start-execution', 95, NULL FROM drills d WHERE d.slug = 'crowded-start'
UNION ALL
SELECT d.id, 'prestart-sequence', 85, NULL FROM drills d WHERE d.slug = 'crowded-start';

-- Upwind drill mappings
INSERT INTO public.drill_skill_mappings (drill_id, skill_area, relevance_score, framework)
SELECT d.id, 'upwind-execution', 80, NULL FROM drills d WHERE d.slug = 'roll-tack'
UNION ALL
SELECT d.id, 'shift-awareness', 90, 'Wind Shift Mathematics' FROM drills d WHERE d.slug = 'tack-on-header'
UNION ALL
SELECT d.id, 'upwind-execution', 70, NULL FROM drills d WHERE d.slug = 'tack-on-header'
UNION ALL
SELECT d.id, 'upwind-execution', 85, NULL FROM drills d WHERE d.slug = 'lane-protection'
UNION ALL
SELECT d.id, 'upwind-execution', 75, NULL FROM drills d WHERE d.slug = 'vmg-focus'
UNION ALL
SELECT d.id, 'upwind-execution', 70, NULL FROM drills d WHERE d.slug = 'pointing-vs-footing';

-- Mark rounding drill mappings
INSERT INTO public.drill_skill_mappings (drill_id, skill_area, relevance_score, framework)
SELECT d.id, 'windward-rounding', 90, NULL FROM drills d WHERE d.slug = 'windward-approach'
UNION ALL
SELECT d.id, 'windward-rounding', 85, NULL FROM drills d WHERE d.slug = 'zone-entry'
UNION ALL
SELECT d.id, 'windward-rounding', 80, NULL FROM drills d WHERE d.slug = 'bear-away-set'
UNION ALL
SELECT d.id, 'crew-coordination', 70, NULL FROM drills d WHERE d.slug = 'bear-away-set'
UNION ALL
SELECT d.id, 'windward-rounding', 75, NULL FROM drills d WHERE d.slug = 'gybe-set'
UNION ALL
SELECT d.id, 'leeward-rounding', 85, NULL FROM drills d WHERE d.slug = 'leeward-drop'
UNION ALL
SELECT d.id, 'crew-coordination', 65, NULL FROM drills d WHERE d.slug = 'leeward-drop';

-- Downwind drill mappings
INSERT INTO public.drill_skill_mappings (drill_id, skill_area, relevance_score, framework)
SELECT d.id, 'downwind-speed', 70, NULL FROM drills d WHERE d.slug = 'gybe-progression'
UNION ALL
SELECT d.id, 'downwind-speed', 85, 'Downwind Shift Detection' FROM drills d WHERE d.slug = 'pressure-hunting'
UNION ALL
SELECT d.id, 'shift-awareness', 60, 'Downwind Shift Detection' FROM drills d WHERE d.slug = 'pressure-hunting'
UNION ALL
SELECT d.id, 'downwind-speed', 80, NULL FROM drills d WHERE d.slug = 'vmg-angles';

-- Crew work drill mappings
INSERT INTO public.drill_skill_mappings (drill_id, skill_area, relevance_score, framework)
SELECT d.id, 'crew-coordination', 80, NULL FROM drills d WHERE d.slug = 'communication-drill'
UNION ALL
SELECT d.id, 'crew-coordination', 90, NULL FROM drills d WHERE d.slug = 'role-swap'
UNION ALL
SELECT d.id, 'crew-coordination', 75, NULL FROM drills d WHERE d.slug = 'weight-placement'
ON CONFLICT (drill_id, skill_area) DO NOTHING;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE drills IS 'Library of practice drills with instructions and learning links';
COMMENT ON TABLE drill_skill_mappings IS 'Maps drills to skill areas for AI-powered practice suggestions';
COMMENT ON TABLE practice_sessions IS 'Scheduled or logged practice sessions with crew coordination';
COMMENT ON TABLE practice_session_members IS 'Crew members participating in practice sessions';
COMMENT ON TABLE practice_session_focus_areas IS 'Skill areas targeted in a practice session';
COMMENT ON TABLE practice_session_drills IS 'Drills performed during a practice session';
COMMENT ON TABLE practice_skill_progress IS 'Aggregated practice progress per skill area per sailor';
COMMENT ON COLUMN practice_sessions.invite_code IS '8-character code for crew to join the practice session';
COMMENT ON COLUMN practice_sessions.ai_suggestion_context IS 'JSONB storing learning profile snapshot when AI suggested this practice';
