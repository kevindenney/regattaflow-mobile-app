-- Playbook system — replaces Library with a compiled, AI-editable knowledge space
-- per (user, interest). See /Users/kdenney/.claude/plans/sleepy-jingling-flask.md
-- for the full design and phased plan.
--
-- This migration:
--   1. Renames user_libraries → playbooks and library_resources → playbook_resources
--      (FK column library_id → playbook_id, all indexes/constraints renamed)
--   2. Creates playbook_concepts / patterns / reviews / qa / suggestions /
--      inbox_items / shares / step_playbook_links
--   3. Backfills step_playbook_links from timeline_steps.metadata->'plan'->'linked_resource_ids'
--   4. Sets up owner RLS on everything and adds shared-read RLS (via playbook_shares)
--      on the user-facing sections that coaches/teammates can view
--   5. Rewrites copy_library_resources_for_adoption to use the new table names
--
-- Vision is NOT a column on playbooks — it lives in user_interest_manifesto.content
-- already. The VisionCard component reads from that existing table.
--
-- Idempotent: safe to re-run. See rollback note at the bottom.

-- ---------------------------------------------------------------------------
-- 1. Rename user_libraries → playbooks
-- ---------------------------------------------------------------------------

ALTER TABLE IF EXISTS user_libraries RENAME TO playbooks;

-- Rename the existing index
ALTER INDEX IF EXISTS idx_user_libraries_user_interest RENAME TO idx_playbooks_user_interest;

-- The unique constraint was named auto; it moves with the table. Rename the
-- default constraint name if present for clarity.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_libraries_user_id_interest_id_key') THEN
    ALTER TABLE playbooks RENAME CONSTRAINT user_libraries_user_id_interest_id_key TO playbooks_user_id_interest_id_key;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_libraries_pkey') THEN
    ALTER TABLE playbooks RENAME CONSTRAINT user_libraries_pkey TO playbooks_pkey;
  END IF;
END $$;

-- Drop old policies and recreate with new names
DROP POLICY IF EXISTS "Users can view their own libraries" ON playbooks;
DROP POLICY IF EXISTS "Users can create their own libraries" ON playbooks;
DROP POLICY IF EXISTS "Users can update their own libraries" ON playbooks;
DROP POLICY IF EXISTS "Users can delete their own libraries" ON playbooks;

CREATE POLICY "Users can view own playbooks"
  ON playbooks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own playbooks"
  ON playbooks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playbooks"
  ON playbooks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playbooks"
  ON playbooks FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. Rename library_resources → playbook_resources
--    and its library_id column → playbook_id
-- ---------------------------------------------------------------------------

ALTER TABLE IF EXISTS library_resources RENAME TO playbook_resources;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playbook_resources' AND column_name = 'library_id'
  ) THEN
    ALTER TABLE playbook_resources RENAME COLUMN library_id TO playbook_id;
  END IF;
END $$;

-- Rename FK constraint (best-effort — names vary)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'library_resources_library_id_fkey') THEN
    ALTER TABLE playbook_resources RENAME CONSTRAINT library_resources_library_id_fkey TO playbook_resources_playbook_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'library_resources_user_id_fkey') THEN
    ALTER TABLE playbook_resources RENAME CONSTRAINT library_resources_user_id_fkey TO playbook_resources_user_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'library_resources_pkey') THEN
    ALTER TABLE playbook_resources RENAME CONSTRAINT library_resources_pkey TO playbook_resources_pkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'library_resources_resource_type_check') THEN
    ALTER TABLE playbook_resources RENAME CONSTRAINT library_resources_resource_type_check TO playbook_resources_resource_type_check;
  END IF;
END $$;

-- Rename indexes
ALTER INDEX IF EXISTS idx_library_resources_library_id RENAME TO idx_playbook_resources_playbook_id;
ALTER INDEX IF EXISTS idx_library_resources_user_id RENAME TO idx_playbook_resources_user_id;
ALTER INDEX IF EXISTS idx_library_resources_type RENAME TO idx_playbook_resources_type;

-- Refresh policies
DROP POLICY IF EXISTS "Users can view their own resources" ON playbook_resources;
DROP POLICY IF EXISTS "Users can create their own resources" ON playbook_resources;
DROP POLICY IF EXISTS "Users can update their own resources" ON playbook_resources;
DROP POLICY IF EXISTS "Users can delete their own resources" ON playbook_resources;

CREATE POLICY "Users can view own playbook resources"
  ON playbook_resources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own playbook resources"
  ON playbook_resources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playbook resources"
  ON playbook_resources FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playbook resources"
  ON playbook_resources FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. playbook_concepts — the wiki, with three-tier inheritance
--    Baseline rows have playbook_id = NULL. Personal/forked rows reference
--    a playbook_id.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS playbook_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID REFERENCES playbooks(id) ON DELETE CASCADE,  -- NULL for baselines
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,     -- NULL for baselines
  origin TEXT NOT NULL CHECK (origin IN ('platform_baseline','pathway_baseline','personal','forked')),
  source_concept_id UUID REFERENCES playbook_concepts(id) ON DELETE SET NULL,
  interest_id UUID,
  pathway_id UUID,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  body_md TEXT NOT NULL DEFAULT '',
  summary TEXT,
  tags JSONB NOT NULL DEFAULT '[]',
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Slug unique per playbook; baselines unique per (interest_id, pathway_id, slug)
  CONSTRAINT playbook_concepts_personal_slug_unique UNIQUE (playbook_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_playbook_concepts_playbook ON playbook_concepts(playbook_id) WHERE playbook_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_playbook_concepts_baseline ON playbook_concepts(interest_id, pathway_id) WHERE playbook_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_playbook_concepts_source ON playbook_concepts(source_concept_id) WHERE source_concept_id IS NOT NULL;

ALTER TABLE playbook_concepts ENABLE ROW LEVEL SECURITY;

-- Baselines (playbook_id IS NULL) are world-readable
CREATE POLICY "Baseline concepts are world-readable"
  ON playbook_concepts FOR SELECT
  USING (playbook_id IS NULL);

-- Owner full access to their own concepts
CREATE POLICY "Users can view own concepts"
  ON playbook_concepts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own concepts"
  ON playbook_concepts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own concepts"
  ON playbook_concepts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own concepts"
  ON playbook_concepts FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. playbook_patterns — AI-detected correlations across debriefs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS playbook_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body_md TEXT NOT NULL DEFAULT '',
  evidence JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','pinned','dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playbook_patterns_playbook ON playbook_patterns(playbook_id) WHERE status <> 'dismissed';

ALTER TABLE playbook_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own patterns"
  ON playbook_patterns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patterns"
  ON playbook_patterns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own patterns"
  ON playbook_patterns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own patterns"
  ON playbook_patterns FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5. playbook_reviews — weekly compiled cards
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS playbook_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  summary_md TEXT NOT NULL,
  focus_suggestion_md TEXT,
  updated_pages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playbook_reviews_playbook ON playbook_reviews(playbook_id, period_end DESC);

ALTER TABLE playbook_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reviews"
  ON playbook_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reviews"
  ON playbook_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews"
  ON playbook_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews"
  ON playbook_reviews FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6. playbook_qa — saved Q&A
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS playbook_qa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer_md TEXT NOT NULL,
  sources JSONB NOT NULL DEFAULT '[]',
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playbook_qa_playbook ON playbook_qa(playbook_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playbook_qa_pinned ON playbook_qa(playbook_id) WHERE pinned = true;

ALTER TABLE playbook_qa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own qa"
  ON playbook_qa FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own qa"
  ON playbook_qa FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own qa"
  ON playbook_qa FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own qa"
  ON playbook_qa FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7. playbook_suggestions — the queue
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS playbook_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN (
    'concept_update','concept_create','pattern_detected',
    'weekly_review','focus_suggestion','cross_interest_idea'
  )),
  payload JSONB NOT NULL DEFAULT '{}',
  provenance JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','edited','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_playbook_suggestions_pending
  ON playbook_suggestions(playbook_id, created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_playbook_suggestions_kind
  ON playbook_suggestions(playbook_id, kind);

ALTER TABLE playbook_suggestions ENABLE ROW LEVEL SECURITY;

-- Suggestions stay owner-only (coaches do NOT see the AI queue in v1)
CREATE POLICY "Users can view own suggestions"
  ON playbook_suggestions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own suggestions"
  ON playbook_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own suggestions"
  ON playbook_suggestions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own suggestions"
  ON playbook_suggestions FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 8. playbook_inbox_items — raw captures awaiting ingest
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS playbook_inbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('file','url','photo','voice','text')),
  title TEXT,
  source_url TEXT,
  storage_path TEXT,
  raw_text TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','ingesting','ingested','dismissed','failed')),
  ingested_at TIMESTAMPTZ,
  created_resource_id UUID REFERENCES playbook_resources(id) ON DELETE SET NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playbook_inbox_pending
  ON playbook_inbox_items(playbook_id, created_at DESC) WHERE status = 'pending';

ALTER TABLE playbook_inbox_items ENABLE ROW LEVEL SECURITY;

-- Inbox stays owner-only (raw captures are private to the owner)
CREATE POLICY "Users can view own inbox"
  ON playbook_inbox_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inbox"
  ON playbook_inbox_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inbox"
  ON playbook_inbox_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inbox"
  ON playbook_inbox_items FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 9. playbook_shares — coach/teammate read-only grants
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS playbook_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email TEXT,
  role TEXT NOT NULL DEFAULT 'view' CHECK (role IN ('view')),
  invite_status TEXT NOT NULL DEFAULT 'pending' CHECK (invite_status IN ('pending','accepted','revoked')),
  invite_token TEXT UNIQUE,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  CONSTRAINT playbook_shares_target_present CHECK (shared_with_user_id IS NOT NULL OR shared_with_email IS NOT NULL),
  CONSTRAINT playbook_shares_unique_user UNIQUE (playbook_id, shared_with_user_id)
);

CREATE INDEX IF NOT EXISTS idx_playbook_shares_playbook ON playbook_shares(playbook_id);
CREATE INDEX IF NOT EXISTS idx_playbook_shares_shared_with ON playbook_shares(shared_with_user_id) WHERE invite_status = 'accepted';

ALTER TABLE playbook_shares ENABLE ROW LEVEL SECURITY;

-- Owner manages shares
CREATE POLICY "Owners manage shares"
  ON playbook_shares FOR ALL
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Invitee can read rows targeted at them (so they know what they have access to)
CREATE POLICY "Invitees can read own shares"
  ON playbook_shares FOR SELECT
  USING (auth.uid() = shared_with_user_id);

-- ---------------------------------------------------------------------------
-- 10. Shared-read RLS: accepted shared_with users can SELECT the playbook's
--     public-facing sections (playbooks, concepts, resources, patterns,
--     reviews, qa). Suggestions and inbox stay owner-only.
-- ---------------------------------------------------------------------------

CREATE POLICY "Shared viewers can read playbook"
  ON playbooks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playbook_shares ps
      WHERE ps.playbook_id = playbooks.id
        AND ps.shared_with_user_id = auth.uid()
        AND ps.invite_status = 'accepted'
    )
  );

CREATE POLICY "Shared viewers can read playbook resources"
  ON playbook_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playbook_shares ps
      WHERE ps.playbook_id = playbook_resources.playbook_id
        AND ps.shared_with_user_id = auth.uid()
        AND ps.invite_status = 'accepted'
    )
  );

CREATE POLICY "Shared viewers can read playbook concepts"
  ON playbook_concepts FOR SELECT
  USING (
    playbook_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM playbook_shares ps
      WHERE ps.playbook_id = playbook_concepts.playbook_id
        AND ps.shared_with_user_id = auth.uid()
        AND ps.invite_status = 'accepted'
    )
  );

CREATE POLICY "Shared viewers can read playbook patterns"
  ON playbook_patterns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playbook_shares ps
      WHERE ps.playbook_id = playbook_patterns.playbook_id
        AND ps.shared_with_user_id = auth.uid()
        AND ps.invite_status = 'accepted'
    )
  );

CREATE POLICY "Shared viewers can read playbook reviews"
  ON playbook_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playbook_shares ps
      WHERE ps.playbook_id = playbook_reviews.playbook_id
        AND ps.shared_with_user_id = auth.uid()
        AND ps.invite_status = 'accepted'
    )
  );

CREATE POLICY "Shared viewers can read playbook qa"
  ON playbook_qa FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playbook_shares ps
      WHERE ps.playbook_id = playbook_qa.playbook_id
        AND ps.shared_with_user_id = auth.uid()
        AND ps.invite_status = 'accepted'
    )
  );

-- ---------------------------------------------------------------------------
-- 11. step_playbook_links — typed step ↔ playbook item join
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS step_playbook_links (
  step_id UUID NOT NULL REFERENCES timeline_steps(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('resource','concept','past_learning','qa')),
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (step_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_step_playbook_links_step ON step_playbook_links(step_id);
CREATE INDEX IF NOT EXISTS idx_step_playbook_links_item ON step_playbook_links(item_type, item_id);

ALTER TABLE step_playbook_links ENABLE ROW LEVEL SECURITY;

-- Access follows the parent step's RLS
CREATE POLICY "Access step playbook links via parent step"
  ON step_playbook_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM timeline_steps ts
      WHERE ts.id = step_playbook_links.step_id
        AND ts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM timeline_steps ts
      WHERE ts.id = step_playbook_links.step_id
        AND ts.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 12. Backfill step_playbook_links from timeline_steps.metadata->plan->linked_resource_ids
--     One row per resource id, item_type = 'resource'. Idempotent via PK.
-- ---------------------------------------------------------------------------

INSERT INTO step_playbook_links (step_id, item_type, item_id)
SELECT
  ts.id AS step_id,
  'resource' AS item_type,
  (resource_id)::uuid AS item_id
FROM timeline_steps ts,
     jsonb_array_elements_text(
       COALESCE(ts.metadata->'plan'->'linked_resource_ids', '[]'::jsonb)
     ) AS resource_id
WHERE ts.metadata ? 'plan'
  AND ts.metadata->'plan' ? 'linked_resource_ids'
  AND jsonb_array_length(ts.metadata->'plan'->'linked_resource_ids') > 0
ON CONFLICT (step_id, item_type, item_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 13. updated_at triggers on new tables
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION playbook_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS tr_playbook_concepts_updated_at ON playbook_concepts;
CREATE TRIGGER tr_playbook_concepts_updated_at
  BEFORE UPDATE ON playbook_concepts
  FOR EACH ROW EXECUTE FUNCTION playbook_touch_updated_at();

DROP TRIGGER IF EXISTS tr_playbook_patterns_updated_at ON playbook_patterns;
CREATE TRIGGER tr_playbook_patterns_updated_at
  BEFORE UPDATE ON playbook_patterns
  FOR EACH ROW EXECUTE FUNCTION playbook_touch_updated_at();

-- ---------------------------------------------------------------------------
-- 14. Update copy_library_resources_for_adoption to use new table names
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION copy_library_resources_for_adoption(
  p_source_resource_ids UUID[],
  p_adopter_user_id UUID,
  p_interest_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_playbook_id UUID;
  v_resource RECORD;
  v_new_id UUID;
  v_id_map JSONB := '{}'::JSONB;
BEGIN
  IF array_length(p_source_resource_ids, 1) IS NULL THEN
    RETURN v_id_map;
  END IF;

  -- Ensure adopter has a playbook for this interest
  SELECT id INTO v_playbook_id
  FROM playbooks
  WHERE user_id = p_adopter_user_id AND interest_id = p_interest_id
  LIMIT 1;

  IF v_playbook_id IS NULL THEN
    INSERT INTO playbooks (user_id, interest_id, name)
    VALUES (p_adopter_user_id, p_interest_id, 'My Playbook')
    RETURNING id INTO v_playbook_id;
  END IF;

  FOR v_resource IN
    SELECT * FROM playbook_resources
    WHERE id = ANY(p_source_resource_ids)
  LOOP
    INSERT INTO playbook_resources (
      playbook_id, user_id, title, url, resource_type,
      source_platform, author_or_creator, description,
      thumbnail_url, capability_goals, tags, metadata
    ) VALUES (
      v_playbook_id, p_adopter_user_id, v_resource.title, v_resource.url,
      COALESCE(v_resource.resource_type, 'other'),
      v_resource.source_platform, v_resource.author_or_creator,
      v_resource.description, v_resource.thumbnail_url,
      COALESCE(v_resource.capability_goals, '[]'::JSONB),
      COALESCE(v_resource.tags, '[]'::JSONB),
      COALESCE(v_resource.metadata, '{}'::JSONB) || jsonb_build_object('copied_from', v_resource.id)
    )
    RETURNING id INTO v_new_id;

    v_id_map := v_id_map || jsonb_build_object(v_resource.id::TEXT, v_new_id::TEXT);
  END LOOP;

  RETURN v_id_map;
END;
$$;

-- ---------------------------------------------------------------------------
-- Rollback note (manual, not scripted):
--   1. DROP the copy_library_resources_for_adoption function and recreate the
--      old version from migration 20260324200000_copy_library_resources_for_adoption.sql
--   2. DROP TABLE step_playbook_links, playbook_shares, playbook_inbox_items,
--      playbook_suggestions, playbook_qa, playbook_reviews, playbook_patterns,
--      playbook_concepts CASCADE.
--   3. Rename playbook_resources back to library_resources and column
--      playbook_id back to library_id. Restore the old policy names.
--   4. Rename playbooks back to user_libraries. Restore the old policy names.
--   5. The backfilled step_playbook_links rows vanish with the table drop; the
--      original timeline_steps.metadata->plan->linked_resource_ids field was
--      never touched and remains the source of truth during the dual-write
--      window. Rollback is therefore lossless.
-- ---------------------------------------------------------------------------
