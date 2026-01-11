-- Migration: Add Practice 4 Questions Framework
-- Purpose: Restructure practice system around What/Who/Why/How framework
--          - Practice templates (pre-built practice plans)
--          - Per-drill crew task assignments
--          - Enhanced AI reasoning storage
--
-- Tables created:
-- 1. practice_templates - Pre-built practice plan templates
-- 2. practice_template_drills - Drills within a template
-- 3. drill_crew_tasks - Per-drill crew task assignments for sessions
--
-- Tables modified:
-- 1. practice_sessions - Add template_id, ai_reasoning
-- 2. practice_session_drills - Add custom_instructions, success_criteria

-- =============================================================================
-- TABLE: practice_templates
-- Pre-built practice plan templates that users can select from catalog
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.practice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- e.g., 'starting-fundamentals', 'upwind-tactics'

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,

  -- Categorization (matches drill categories)
  category TEXT NOT NULL CHECK (category IN (
    'starting', 'upwind', 'downwind', 'mark_rounding',
    'boat_handling', 'crew_work', 'rules', 'fitness', 'general'
  )),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),

  -- Duration and crew
  estimated_duration_minutes INTEGER NOT NULL DEFAULT 30,
  recommended_crew_size INTEGER DEFAULT 2,

  -- Requirements
  requires_marks BOOLEAN DEFAULT FALSE,
  requires_coach_boat BOOLEAN DEFAULT FALSE,

  -- Curation
  is_featured BOOLEAN DEFAULT FALSE, -- Show in featured section
  source TEXT DEFAULT 'regattaflow' CHECK (source IN ('regattaflow', 'user', 'ai', 'coach')),

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_practice_templates_category ON practice_templates(category);
CREATE INDEX idx_practice_templates_difficulty ON practice_templates(difficulty);
CREATE INDEX idx_practice_templates_slug ON practice_templates(slug);
CREATE INDEX idx_practice_templates_featured ON practice_templates(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_practice_templates_active ON practice_templates(is_active) WHERE is_active = TRUE;

-- =============================================================================
-- TABLE: practice_template_drills
-- Drills that make up a practice template with default crew task assignments
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.practice_template_drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.practice_templates(id) ON DELETE CASCADE,
  drill_id UUID NOT NULL REFERENCES public.drills(id) ON DELETE CASCADE,

  -- Order and timing
  order_index INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER, -- Override drill default duration
  repetitions INTEGER, -- Suggested repetitions

  -- Default crew task assignments (JSONB array)
  -- Format: [{"role": "skipper", "task": "Call laylines"}, {"role": "crew", "task": "Trim main"}]
  default_crew_tasks JSONB DEFAULT '[]',

  -- Custom instructions for this template (override drill instructions)
  custom_instructions TEXT,
  success_criteria TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_template_drill_order UNIQUE(template_id, order_index)
);

CREATE INDEX idx_practice_template_drills_template ON practice_template_drills(template_id);
CREATE INDEX idx_practice_template_drills_drill ON practice_template_drills(drill_id);

-- =============================================================================
-- TABLE: drill_crew_tasks
-- Per-drill crew task assignments for actual practice sessions
-- Tracks who does what for each drill during execution
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.drill_crew_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_drill_id UUID NOT NULL REFERENCES public.practice_session_drills(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.practice_session_members(id) ON DELETE CASCADE,

  -- Task assignment
  task_description TEXT NOT NULL, -- e.g., "Call laylines", "Trim main", "Watch for puffs"
  is_primary BOOLEAN DEFAULT FALSE, -- Primary responsibility for this drill

  -- Execution tracking
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT, -- Post-execution notes

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_member_task_per_drill UNIQUE(session_drill_id, member_id)
);

CREATE INDEX idx_drill_crew_tasks_session_drill ON drill_crew_tasks(session_drill_id);
CREATE INDEX idx_drill_crew_tasks_member ON drill_crew_tasks(member_id);

-- =============================================================================
-- ALTER: practice_sessions
-- Add template reference and AI reasoning fields
-- =============================================================================
ALTER TABLE public.practice_sessions
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.practice_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ai_reasoning TEXT; -- Detailed AI explanation for WHY section

CREATE INDEX IF NOT EXISTS idx_practice_sessions_template ON practice_sessions(template_id) WHERE template_id IS NOT NULL;

-- =============================================================================
-- ALTER: practice_session_drills
-- Add fields for HOW section customization
-- =============================================================================
ALTER TABLE public.practice_session_drills
  ADD COLUMN IF NOT EXISTS custom_instructions TEXT, -- Override drill instructions
  ADD COLUMN IF NOT EXISTS success_criteria TEXT; -- Custom success criteria

-- =============================================================================
-- RLS POLICIES: practice_templates
-- Templates are public read, admin write
-- =============================================================================
ALTER TABLE public.practice_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can read active templates
CREATE POLICY "Templates are publicly readable"
  ON public.practice_templates
  FOR SELECT
  USING (is_active = TRUE);

-- =============================================================================
-- RLS POLICIES: practice_template_drills
-- Template drills follow parent template access
-- =============================================================================
ALTER TABLE public.practice_template_drills ENABLE ROW LEVEL SECURITY;

-- Anyone can read template drills for active templates
CREATE POLICY "Template drills are publicly readable"
  ON public.practice_template_drills
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.practice_templates t
      WHERE t.id = practice_template_drills.template_id
      AND t.is_active = TRUE
    )
  );

-- =============================================================================
-- RLS POLICIES: drill_crew_tasks
-- Users can manage tasks for sessions they're part of
-- =============================================================================
ALTER TABLE public.drill_crew_tasks ENABLE ROW LEVEL SECURITY;

-- Session participants can view drill tasks
CREATE POLICY "Session participants can view drill tasks"
  ON public.drill_crew_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.practice_session_drills psd
      JOIN public.practice_sessions ps ON ps.id = psd.session_id
      LEFT JOIN public.practice_session_members psm ON psm.session_id = ps.id
      WHERE psd.id = drill_crew_tasks.session_drill_id
      AND (ps.created_by = auth.uid() OR psm.user_id = auth.uid())
    )
  );

-- Session creator can manage drill tasks
CREATE POLICY "Session creator can manage drill tasks"
  ON public.drill_crew_tasks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.practice_session_drills psd
      JOIN public.practice_sessions ps ON ps.id = psd.session_id
      WHERE psd.id = drill_crew_tasks.session_drill_id
      AND ps.created_by = auth.uid()
    )
  );

-- Members can update their own task completion
CREATE POLICY "Members can update own task completion"
  ON public.drill_crew_tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.practice_session_members psm
      WHERE psm.id = drill_crew_tasks.member_id
      AND psm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.practice_session_members psm
      WHERE psm.id = drill_crew_tasks.member_id
      AND psm.user_id = auth.uid()
    )
  );

-- =============================================================================
-- SEED: Initial Practice Templates
-- =============================================================================
INSERT INTO public.practice_templates (slug, name, description, category, difficulty, estimated_duration_minutes, recommended_crew_size, requires_marks, is_featured, tags) VALUES
  ('starting-fundamentals', 'Starting Fundamentals', 'Master the basics of race starts with acceleration drills and line positioning', 'starting', 'beginner', 30, 2, FALSE, TRUE, ARRAY['starts', 'acceleration', 'timing']),
  ('gate-start-practice', 'Gate Start Practice', 'Practice gate starts with rabbit boat setup and approach timing', 'starting', 'intermediate', 45, 3, TRUE, TRUE, ARRAY['gate', 'starts', 'positioning']),
  ('upwind-tactics', 'Upwind Tactics', 'Improve upwind performance with tacking drills and lane protection', 'upwind', 'intermediate', 45, 2, FALSE, TRUE, ARRAY['tacking', 'lanes', 'vmg']),
  ('mark-rounding-clinic', 'Mark Rounding Clinic', 'Sharpen your mark rounding technique for windward and leeward marks', 'mark_rounding', 'intermediate', 40, 2, TRUE, TRUE, ARRAY['marks', 'rounding', 'spinnaker']),
  ('downwind-speed', 'Downwind Speed', 'Build downwind boat speed with gybe practice and pressure hunting', 'downwind', 'intermediate', 35, 2, FALSE, FALSE, ARRAY['gybing', 'vmg', 'angles']),
  ('crew-communication', 'Crew Communication Drills', 'Improve crew coordination with role-specific exercises', 'crew_work', 'beginner', 30, 2, FALSE, TRUE, ARRAY['communication', 'teamwork', 'coordination']),
  ('race-simulation', 'Full Race Simulation', 'Put it all together with a simulated race covering all phases', 'general', 'advanced', 60, 2, TRUE, FALSE, ARRAY['racing', 'simulation', 'complete']),
  ('quick-tack-workout', 'Quick Tack Workout', 'High-intensity tacking drill for boat handling improvement', 'boat_handling', 'intermediate', 20, 2, FALSE, FALSE, ARRAY['tacking', 'fitness', 'handling']),
  ('pre-race-warmup', 'Pre-Race Warmup', 'Standard warmup routine before a race day', 'general', 'beginner', 20, 2, FALSE, TRUE, ARRAY['warmup', 'routine', 'race-day']),
  ('rules-scenarios', 'Rules & Scenarios', 'Practice right-of-way situations and protest scenarios', 'rules', 'advanced', 45, 3, TRUE, FALSE, ARRAY['rules', 'protest', 'scenarios'])
ON CONFLICT (slug) DO NOTHING;

-- Link templates to drills (if drills exist)
-- Starting Fundamentals template
INSERT INTO public.practice_template_drills (template_id, drill_id, order_index, duration_minutes, default_crew_tasks)
SELECT
  t.id,
  d.id,
  CASE d.slug
    WHEN 'line-sight-drill' THEN 0
    WHEN 'acceleration-runs' THEN 1
    WHEN 'gate-start-drill' THEN 2
  END,
  CASE d.slug
    WHEN 'line-sight-drill' THEN 10
    WHEN 'acceleration-runs' THEN 10
    WHEN 'gate-start-drill' THEN 10
  END,
  CASE d.slug
    WHEN 'line-sight-drill' THEN '[{"role": "skipper", "task": "Call line bias"}, {"role": "crew", "task": "Time runs"}]'::jsonb
    WHEN 'acceleration-runs' THEN '[{"role": "skipper", "task": "Drive acceleration"}, {"role": "crew", "task": "Trim for power"}]'::jsonb
    WHEN 'gate-start-drill' THEN '[{"role": "skipper", "task": "Judge timing"}, {"role": "crew", "task": "Call rabbit position"}]'::jsonb
  END
FROM public.practice_templates t
CROSS JOIN public.drills d
WHERE t.slug = 'starting-fundamentals'
AND d.slug IN ('line-sight-drill', 'acceleration-runs', 'gate-start-drill')
ON CONFLICT DO NOTHING;

-- Upwind Tactics template
INSERT INTO public.practice_template_drills (template_id, drill_id, order_index, duration_minutes, default_crew_tasks)
SELECT
  t.id,
  d.id,
  CASE d.slug
    WHEN 'roll-tack-refinement' THEN 0
    WHEN 'tack-on-headers' THEN 1
    WHEN 'lane-protection-drill' THEN 2
  END,
  15,
  CASE d.slug
    WHEN 'roll-tack-refinement' THEN '[{"role": "skipper", "task": "Execute roll"}, {"role": "crew", "task": "Cross and hike"}]'::jsonb
    WHEN 'tack-on-headers' THEN '[{"role": "skipper", "task": "Call headers"}, {"role": "crew", "task": "Track compass"}]'::jsonb
    WHEN 'lane-protection-drill' THEN '[{"role": "skipper", "task": "Maintain lane"}, {"role": "crew", "task": "Call traffic"}]'::jsonb
  END
FROM public.practice_templates t
CROSS JOIN public.drills d
WHERE t.slug = 'upwind-tactics'
AND d.slug IN ('roll-tack-refinement', 'tack-on-headers', 'lane-protection-drill')
ON CONFLICT DO NOTHING;

-- Crew Communication template
INSERT INTO public.practice_template_drills (template_id, drill_id, order_index, duration_minutes, default_crew_tasks)
SELECT
  t.id,
  d.id,
  CASE d.slug
    WHEN 'crew-communication-drill' THEN 0
    WHEN 'role-swap-practice' THEN 1
    WHEN 'weight-placement-drill' THEN 2
  END,
  10,
  CASE d.slug
    WHEN 'crew-communication-drill' THEN '[{"role": "skipper", "task": "Lead calls"}, {"role": "crew", "task": "Respond and confirm"}]'::jsonb
    WHEN 'role-swap-practice' THEN '[{"role": "skipper", "task": "Take crew position"}, {"role": "crew", "task": "Helm and call"}]'::jsonb
    WHEN 'weight-placement-drill' THEN '[{"role": "skipper", "task": "Call weight moves"}, {"role": "crew", "task": "Execute moves"}]'::jsonb
  END
FROM public.practice_templates t
CROSS JOIN public.drills d
WHERE t.slug = 'crew-communication'
AND d.slug IN ('crew-communication-drill', 'role-swap-practice', 'weight-placement-drill')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- UPDATE TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION update_practice_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER practice_templates_updated_at
  BEFORE UPDATE ON public.practice_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_practice_templates_updated_at();

CREATE OR REPLACE FUNCTION update_drill_crew_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER drill_crew_tasks_updated_at
  BEFORE UPDATE ON public.drill_crew_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_drill_crew_tasks_updated_at();
