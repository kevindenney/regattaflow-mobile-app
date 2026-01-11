-- ============================================
-- Excellence Framework Migration
-- Creates unified checklist, learnable events, and excellence metrics tables
-- ============================================

-- ============================================
-- 1. Race Checklist Items (Unified across all phases)
-- ============================================
CREATE TABLE IF NOT EXISTS public.race_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  race_event_id UUID REFERENCES public.race_events(id) ON DELETE CASCADE,

  -- Phase tracking (Prep -> Launch -> Race -> Review)
  phase TEXT NOT NULL CHECK (phase IN ('prep', 'launch', 'race', 'review')),

  -- Item content
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,  -- forecast, equipment, tactics, safety, rigging, start, upwind, downwind, marks, finish, reflection, learning

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,

  -- Outcome rating (filled during Review phase)
  outcome_rating INTEGER CHECK (outcome_rating IS NULL OR (outcome_rating BETWEEN 1 AND 5)),
  outcome_notes TEXT,

  -- Source tracking
  source TEXT NOT NULL CHECK (source IN ('template', 'ai_generated', 'manual', 'learning_nudge')),
  source_learning_event_id UUID,  -- Reference to learnable_events if from adaptive learning

  -- Personalization metadata
  is_personalized BOOLEAN DEFAULT false,
  personalization_reason TEXT,
  confidence_score FLOAT CHECK (confidence_score IS NULL OR (confidence_score BETWEEN 0 AND 1)),

  -- Template reference (for reusable items)
  template_item_id UUID,

  -- Ordering
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for race_checklist_items
CREATE INDEX idx_checklist_items_sailor ON public.race_checklist_items(sailor_id);
CREATE INDEX idx_checklist_items_race ON public.race_checklist_items(race_event_id);
CREATE INDEX idx_checklist_items_race_phase ON public.race_checklist_items(race_event_id, phase);
CREATE INDEX idx_checklist_items_sailor_status ON public.race_checklist_items(sailor_id, status) WHERE status = 'pending';

-- ============================================
-- 2. Learnable Events (Extracted insights from races)
-- ============================================
CREATE TABLE IF NOT EXISTS public.learnable_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  race_event_id UUID REFERENCES public.race_events(id) ON DELETE SET NULL,
  venue_id TEXT REFERENCES public.sailing_venues(id) ON DELETE SET NULL,

  -- Classification
  event_type TEXT NOT NULL CHECK (event_type IN (
    'forgotten_item',
    'performance_issue',
    'successful_strategy',
    'venue_learning',
    'equipment_issue',
    'timing_issue',
    'weather_adaptation',
    'crew_coordination',
    'decision_outcome'
  )),
  phase TEXT,  -- Which race phase this relates to
  category TEXT,

  -- Content
  original_text TEXT NOT NULL,  -- Source quote from user
  title TEXT NOT NULL,
  action_text TEXT NOT NULL,  -- Imperative nudge text for future races
  outcome TEXT CHECK (outcome IN ('positive', 'negative', 'neutral')),
  impact_rating INTEGER CHECK (impact_rating IS NULL OR (impact_rating BETWEEN 1 AND 5)),

  -- Conditions context for matching (JSONB for flexibility)
  conditions_context JSONB DEFAULT '{}'::jsonb,
  -- Example: { "wind_speed_range": [8, 15], "venue_specific": true, "tide_sensitive": false }

  -- AI extraction metadata
  ai_extracted BOOLEAN DEFAULT false,
  ai_confidence FLOAT CHECK (ai_confidence IS NULL OR (ai_confidence BETWEEN 0 AND 1)),
  sailor_confirmed BOOLEAN DEFAULT false,

  -- Nudge delivery tracking
  nudge_eligible BOOLEAN DEFAULT true,
  times_surfaced INTEGER DEFAULT 0,
  last_surfaced_at TIMESTAMPTZ,
  dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,

  -- Effectiveness feedback
  effectiveness_rating INTEGER CHECK (effectiveness_rating IS NULL OR (effectiveness_rating BETWEEN 1 AND 5)),

  -- Timestamps
  event_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for learnable_events
CREATE INDEX idx_learnable_events_sailor ON public.learnable_events(sailor_id);
CREATE INDEX idx_learnable_events_venue ON public.learnable_events(venue_id);
CREATE INDEX idx_learnable_events_type ON public.learnable_events(event_type);
CREATE INDEX idx_learnable_events_nudge_eligible ON public.learnable_events(sailor_id, nudge_eligible)
  WHERE nudge_eligible = true AND dismissed = false;
CREATE INDEX idx_learnable_events_conditions ON public.learnable_events USING GIN (conditions_context);

-- ============================================
-- 3. Excellence Metrics (Aggregated progress tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS public.excellence_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL,

  -- Phase mastery scores (0-100, calculated from checklist completion + ratings)
  prep_mastery FLOAT DEFAULT 0 CHECK (prep_mastery BETWEEN 0 AND 100),
  launch_mastery FLOAT DEFAULT 0 CHECK (launch_mastery BETWEEN 0 AND 100),
  start_mastery FLOAT DEFAULT 0 CHECK (start_mastery BETWEEN 0 AND 100),
  upwind_mastery FLOAT DEFAULT 0 CHECK (upwind_mastery BETWEEN 0 AND 100),
  downwind_mastery FLOAT DEFAULT 0 CHECK (downwind_mastery BETWEEN 0 AND 100),
  mark_rounding_mastery FLOAT DEFAULT 0 CHECK (mark_rounding_mastery BETWEEN 0 AND 100),
  finish_mastery FLOAT DEFAULT 0 CHECK (finish_mastery BETWEEN 0 AND 100),
  review_mastery FLOAT DEFAULT 0 CHECK (review_mastery BETWEEN 0 AND 100),

  -- Framework adoption scores (JSONB for flexibility)
  framework_scores JSONB DEFAULT '{}'::jsonb,
  -- Example: { "puff_response": 0.7, "delayed_tack": 0.5, "wind_shift_awareness": 0.6 }

  -- Outcome metrics
  races_completed INTEGER DEFAULT 0,
  average_position FLOAT,
  position_trend TEXT CHECK (position_trend IS NULL OR position_trend IN ('improving', 'stable', 'declining')),
  best_finish INTEGER,
  best_finish_race_id UUID,

  -- Recent results for sparkline (last 10 races)
  recent_results JSONB DEFAULT '[]'::jsonb,
  -- Example: [{ "race_id": "...", "position": 3, "date": "2026-01-05" }, ...]

  -- Focus areas (AI-generated recommendations)
  focus_recommendations JSONB DEFAULT '[]'::jsonb,
  -- Example: [{ "phase": "downwind", "title": "Improve VMG", "reason": "...", "priority": "high" }]

  -- Learning velocity
  events_last_30_days INTEGER DEFAULT 0,
  improvement_trend TEXT CHECK (improvement_trend IS NULL OR improvement_trend IN ('improving', 'stable', 'declining')),

  -- Last calculated timestamp
  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one metrics record per sailor per season (or null season for all-time)
  UNIQUE (sailor_id, season_id)
);

-- Indexes for excellence_metrics
CREATE INDEX idx_excellence_metrics_sailor ON public.excellence_metrics(sailor_id);
CREATE INDEX idx_excellence_metrics_season ON public.excellence_metrics(season_id);

-- ============================================
-- 4. Checklist Templates (Reusable item templates)
-- ============================================
CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template metadata
  name TEXT NOT NULL,
  description TEXT,
  phase TEXT NOT NULL CHECK (phase IN ('prep', 'launch', 'race', 'review')),
  category TEXT,

  -- Ownership (null = global/system template)
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_system_template BOOLEAN DEFAULT false,

  -- Item content
  title TEXT NOT NULL,
  default_description TEXT,

  -- Ordering
  sort_order INTEGER DEFAULT 0,

  -- Applicability
  boat_class_id UUID REFERENCES public.boat_classes(id) ON DELETE SET NULL,
  race_type TEXT,  -- fleet, team, match, distance

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for checklist_templates
CREATE INDEX idx_checklist_templates_phase ON public.checklist_templates(phase);
CREATE INDEX idx_checklist_templates_system ON public.checklist_templates(is_system_template) WHERE is_system_template = true;

-- ============================================
-- 5. Nudge Deliveries (Track when nudges are shown)
-- ============================================
CREATE TABLE IF NOT EXISTS public.nudge_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learnable_event_id UUID NOT NULL REFERENCES public.learnable_events(id) ON DELETE CASCADE,
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  race_event_id UUID REFERENCES public.race_events(id) ON DELETE SET NULL,

  -- Delivery info
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery_channel TEXT NOT NULL CHECK (delivery_channel IN ('in_app', 'push', 'checklist', 'briefing')),

  -- Sailor response
  acknowledged BOOLEAN,
  acknowledged_at TIMESTAMPTZ,
  action_taken BOOLEAN,
  action_taken_at TIMESTAMPTZ,

  -- Effectiveness tracking
  outcome_rating INTEGER CHECK (outcome_rating IS NULL OR (outcome_rating BETWEEN 1 AND 5)),
  outcome_notes TEXT,
  issue_recurred BOOLEAN,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for nudge_deliveries
CREATE INDEX idx_nudge_deliveries_event ON public.nudge_deliveries(learnable_event_id);
CREATE INDEX idx_nudge_deliveries_sailor ON public.nudge_deliveries(sailor_id);
CREATE INDEX idx_nudge_deliveries_race ON public.nudge_deliveries(race_event_id);

-- ============================================
-- 6. Row Level Security Policies
-- ============================================

-- race_checklist_items RLS
ALTER TABLE public.race_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sailors can view own checklist items"
  ON public.race_checklist_items FOR SELECT
  USING (auth.uid() = sailor_id);

CREATE POLICY "Sailors can insert own checklist items"
  ON public.race_checklist_items FOR INSERT
  WITH CHECK (auth.uid() = sailor_id);

CREATE POLICY "Sailors can update own checklist items"
  ON public.race_checklist_items FOR UPDATE
  USING (auth.uid() = sailor_id);

CREATE POLICY "Sailors can delete own checklist items"
  ON public.race_checklist_items FOR DELETE
  USING (auth.uid() = sailor_id);

-- learnable_events RLS
ALTER TABLE public.learnable_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sailors can view own learnable events"
  ON public.learnable_events FOR SELECT
  USING (auth.uid() = sailor_id);

CREATE POLICY "Sailors can insert own learnable events"
  ON public.learnable_events FOR INSERT
  WITH CHECK (auth.uid() = sailor_id);

CREATE POLICY "Sailors can update own learnable events"
  ON public.learnable_events FOR UPDATE
  USING (auth.uid() = sailor_id);

CREATE POLICY "Sailors can delete own learnable events"
  ON public.learnable_events FOR DELETE
  USING (auth.uid() = sailor_id);

-- excellence_metrics RLS
ALTER TABLE public.excellence_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sailors can view own excellence metrics"
  ON public.excellence_metrics FOR SELECT
  USING (auth.uid() = sailor_id);

CREATE POLICY "Sailors can insert own excellence metrics"
  ON public.excellence_metrics FOR INSERT
  WITH CHECK (auth.uid() = sailor_id);

CREATE POLICY "Sailors can update own excellence metrics"
  ON public.excellence_metrics FOR UPDATE
  USING (auth.uid() = sailor_id);

-- checklist_templates RLS (read: anyone, write: creator or system)
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view checklist templates"
  ON public.checklist_templates FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own templates"
  ON public.checklist_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update own templates"
  ON public.checklist_templates FOR UPDATE
  USING (auth.uid() = created_by);

-- nudge_deliveries RLS
ALTER TABLE public.nudge_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sailors can view own nudge deliveries"
  ON public.nudge_deliveries FOR SELECT
  USING (auth.uid() = sailor_id);

CREATE POLICY "Sailors can insert own nudge deliveries"
  ON public.nudge_deliveries FOR INSERT
  WITH CHECK (auth.uid() = sailor_id);

CREATE POLICY "Sailors can update own nudge deliveries"
  ON public.nudge_deliveries FOR UPDATE
  USING (auth.uid() = sailor_id);

-- ============================================
-- 7. Updated_at Triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_race_checklist_items_updated_at
  BEFORE UPDATE ON public.race_checklist_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learnable_events_updated_at
  BEFORE UPDATE ON public.learnable_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_excellence_metrics_updated_at
  BEFORE UPDATE ON public.excellence_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_templates_updated_at
  BEFORE UPDATE ON public.checklist_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nudge_deliveries_updated_at
  BEFORE UPDATE ON public.nudge_deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. Foreign Key for source_learning_event_id
-- ============================================
ALTER TABLE public.race_checklist_items
  ADD CONSTRAINT fk_checklist_learning_event
  FOREIGN KEY (source_learning_event_id)
  REFERENCES public.learnable_events(id)
  ON DELETE SET NULL;
