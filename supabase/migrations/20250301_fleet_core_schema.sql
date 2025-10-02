-- Fleet Core Schema
-- Introduces fleet-centric tables for sailor communities and activity tracking

CREATE TABLE IF NOT EXISTS fleets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  class_id UUID REFERENCES boat_classes(id) ON DELETE SET NULL,
  club_id UUID REFERENCES users(id) ON DELETE SET NULL,
  region TEXT,
  whatsapp_link TEXT,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public','private','club')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fleets_club_class
  ON fleets(club_id, class_id)
  WHERE club_id IS NOT NULL AND class_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fleets_class ON fleets(class_id);
CREATE INDEX IF NOT EXISTS idx_fleets_visibility ON fleets(visibility);

CREATE TABLE IF NOT EXISTS fleet_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fleet_id UUID NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','owner','captain','coach','support')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','invited','inactive')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(fleet_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_fleet_members_user ON fleet_members(user_id);
CREATE INDEX IF NOT EXISTS idx_fleet_members_status ON fleet_members(status);

CREATE TABLE IF NOT EXISTS fleet_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fleet_id UUID NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notify_on_documents BOOLEAN DEFAULT true,
  notify_on_announcements BOOLEAN DEFAULT true,
  notify_on_events BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fleet_id, follower_id)
);

CREATE INDEX IF NOT EXISTS idx_fleet_followers_follower ON fleet_followers(follower_id);

CREATE TABLE IF NOT EXISTS fleet_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fleet_id UUID NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('document_uploaded','announcement','event_created','status_update','member_joined','member_left','resource_shared')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  visibility TEXT NOT NULL DEFAULT 'fleet' CHECK (visibility IN ('fleet','followers','public')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fleet_activity_fleet ON fleet_activity(fleet_id);
CREATE INDEX IF NOT EXISTS idx_fleet_activity_type ON fleet_activity(activity_type);

CREATE TABLE IF NOT EXISTS fleet_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fleet_id UUID NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notify_followers BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fleet_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_fleet_documents_fleet ON fleet_documents(fleet_id);


-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

ALTER TABLE fleets ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_documents ENABLE ROW LEVEL SECURITY;

-- Fleets can be viewed if public or if the user is a member
DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Public fleets are viewable" ON fleets
  FOR SELECT USING (visibility = 'public');

DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Fleet members can view fleet" ON fleets
  FOR SELECT USING (
    visibility != 'public' AND EXISTS (
      SELECT 1 FROM fleet_members
      WHERE fleet_members.fleet_id = id
        AND fleet_members.user_id = auth.uid()
        AND fleet_members.status = 'active'
    )
  );

-- Allow authenticated users to create fleets they own
DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Users can create fleets" ON fleets
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Allow fleet owners/captains to update fleet metadata
DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Fleet admins can update fleet" ON fleets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM fleet_members
      WHERE fleet_members.fleet_id = id
        AND fleet_members.user_id = auth.uid()
        AND fleet_members.role IN ('owner','captain')
        AND fleet_members.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fleet_members
      WHERE fleet_members.fleet_id = id
        AND fleet_members.user_id = auth.uid()
        AND fleet_members.role IN ('owner','captain')
        AND fleet_members.status = 'active'
    )
  );

-- Fleet Members policies
DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Members can view fleet roster" ON fleet_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fleet_members fm
      WHERE fm.fleet_id = fleet_members.fleet_id
        AND fm.user_id = auth.uid()
        AND fm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Users can join fleets" ON fleet_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Members can update their membership" ON fleet_members
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Fleet admins manage members" ON fleet_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM fleet_members fm
      WHERE fm.fleet_id = fleet_members.fleet_id
        AND fm.user_id = auth.uid()
        AND fm.role IN ('owner','captain')
        AND fm.status = 'active'
    )
  );

-- Fleet Followers policies
DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Followers can view follower entries" ON fleet_followers
  FOR SELECT USING (follower_id = auth.uid());

DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Users can follow fleets" ON fleet_followers
  FOR INSERT WITH CHECK (follower_id = auth.uid());

DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Followers can update preferences" ON fleet_followers
  FOR UPDATE USING (follower_id = auth.uid())
  WITH CHECK (follower_id = auth.uid());

DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Followers can unfollow" ON fleet_followers
  FOR DELETE USING (follower_id = auth.uid());

-- Fleet Activity policies
DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Fleet members see activity" ON fleet_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fleet_members
      WHERE fleet_members.fleet_id = fleet_activity.fleet_id
        AND fleet_members.user_id = auth.uid()
        AND fleet_members.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM fleet_followers
      WHERE fleet_followers.fleet_id = fleet_activity.fleet_id
        AND fleet_followers.follower_id = auth.uid()
    )
    OR visibility = 'public'
  );

-- Fleet Documents policies
DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Fleet members see documents" ON fleet_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fleet_members
      WHERE fleet_members.fleet_id = fleet_documents.fleet_id
        AND fleet_members.user_id = auth.uid()
        AND fleet_members.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM fleet_followers
      WHERE fleet_followers.fleet_id = fleet_documents.fleet_id
        AND fleet_followers.follower_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Authenticated users can share documents" ON fleet_documents
  FOR INSERT WITH CHECK (shared_by = auth.uid());

