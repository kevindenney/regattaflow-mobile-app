-- =============================================================================
-- Migration: Activity Catalog + Plan Cards + Cross-Interest AI Suggestions
-- Part D of the BetterAt multi-interest implementation
-- =============================================================================

-- =============================================================================
-- 1. Plan Cards table (Blank Plan Card — universal event type)
-- =============================================================================

CREATE TABLE IF NOT EXISTS betterat_plan_cards (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL,
  interest_id     uuid        NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  status          text        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft', 'planned', 'in_progress', 'completed', 'cancelled')),
  plan_data       jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_plan_cards_user ON betterat_plan_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_cards_interest ON betterat_plan_cards(interest_id);
CREATE INDEX IF NOT EXISTS idx_plan_cards_status ON betterat_plan_cards(status);

-- RLS
ALTER TABLE betterat_plan_cards ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'betterat_plan_cards' AND policyname = 'plan_cards_select_own'
  ) THEN
    CREATE POLICY plan_cards_select_own ON betterat_plan_cards
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'betterat_plan_cards' AND policyname = 'plan_cards_insert_own'
  ) THEN
    CREATE POLICY plan_cards_insert_own ON betterat_plan_cards
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'betterat_plan_cards' AND policyname = 'plan_cards_update_own'
  ) THEN
    CREATE POLICY plan_cards_update_own ON betterat_plan_cards
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'betterat_plan_cards' AND policyname = 'plan_cards_delete_own'
  ) THEN
    CREATE POLICY plan_cards_delete_own ON betterat_plan_cards
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;


-- =============================================================================
-- 2. Activity Templates (published by orgs and coaches)
-- =============================================================================

CREATE TABLE IF NOT EXISTS betterat_activity_templates (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_type    text        NOT NULL CHECK (publisher_type IN ('organization', 'user')),
  publisher_id      uuid        NOT NULL,
  interest_id       uuid        NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  event_type        text        NOT NULL,
  event_subtype     text,
  title             text        NOT NULL,
  description       text,
  scheduled_date    timestamptz,
  recurrence        jsonb,
  location          text,
  prefilled_data    jsonb       DEFAULT '{}'::jsonb,
  tags              text[]      DEFAULT '{}',
  published         boolean     DEFAULT true,
  enrollment_count  integer     DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_templates_interest ON betterat_activity_templates(interest_id);
CREATE INDEX IF NOT EXISTS idx_activity_templates_publisher ON betterat_activity_templates(publisher_type, publisher_id);
CREATE INDEX IF NOT EXISTS idx_activity_templates_published ON betterat_activity_templates(published) WHERE published = true;

-- RLS
ALTER TABLE betterat_activity_templates ENABLE ROW LEVEL SECURITY;

-- Published templates are readable by anyone
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'betterat_activity_templates' AND policyname = 'activity_templates_select_published'
  ) THEN
    CREATE POLICY activity_templates_select_published ON betterat_activity_templates
      FOR SELECT USING (published = true);
  END IF;
END $$;

-- Publishers can manage their own templates
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'betterat_activity_templates' AND policyname = 'activity_templates_manage_own'
  ) THEN
    CREATE POLICY activity_templates_manage_own ON betterat_activity_templates
      FOR ALL USING (
        publisher_type = 'user' AND publisher_id = auth.uid()
      );
  END IF;
END $$;


-- =============================================================================
-- 3. Activity Enrollments (user → template → created event)
-- =============================================================================

CREATE TABLE IF NOT EXISTS betterat_activity_enrollments (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL,
  template_id     uuid        NOT NULL REFERENCES betterat_activity_templates(id) ON DELETE CASCADE,
  event_id        uuid,
  enrolled_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_enrollments_user ON betterat_activity_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_enrollments_template ON betterat_activity_enrollments(template_id);

-- RLS
ALTER TABLE betterat_activity_enrollments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'betterat_activity_enrollments' AND policyname = 'enrollments_own'
  ) THEN
    CREATE POLICY enrollments_own ON betterat_activity_enrollments
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;


-- =============================================================================
-- 4. Cross-Interest AI Suggestions
-- =============================================================================

CREATE TABLE IF NOT EXISTS betterat_ai_suggestions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL,
  source_interest_id  uuid        NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  target_interest_id  uuid        NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  suggestion_type     text        NOT NULL
                                  CHECK (suggestion_type IN (
                                    'skill_transfer', 'mental_model', 'practice_method',
                                    'recovery_insight', 'metacognitive'
                                  )),
  title               text        NOT NULL,
  body                text        NOT NULL,
  source_evidence     jsonb,
  status              text        NOT NULL DEFAULT 'active'
                                  CHECK (status IN ('active', 'applied', 'dismissed', 'saved')),
  applied_to_event_id uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  expires_at          timestamptz DEFAULT (now() + interval '14 days')
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user ON betterat_ai_suggestions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_target ON betterat_ai_suggestions(target_interest_id);

-- RLS
ALTER TABLE betterat_ai_suggestions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'betterat_ai_suggestions' AND policyname = 'ai_suggestions_own'
  ) THEN
    CREATE POLICY ai_suggestions_own ON betterat_ai_suggestions
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;


-- =============================================================================
-- 5. Updated_at triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION betterat_update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trg_plan_cards_updated_at' AND event_object_table = 'betterat_plan_cards'
  ) THEN
    CREATE TRIGGER trg_plan_cards_updated_at
      BEFORE UPDATE ON betterat_plan_cards
      FOR EACH ROW EXECUTE FUNCTION betterat_update_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trg_activity_templates_updated_at' AND event_object_table = 'betterat_activity_templates'
  ) THEN
    CREATE TRIGGER trg_activity_templates_updated_at
      BEFORE UPDATE ON betterat_activity_templates
      FOR EACH ROW EXECUTE FUNCTION betterat_update_updated_at();
  END IF;
END $$;
