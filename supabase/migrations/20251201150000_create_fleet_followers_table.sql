-- Fleet Followers Table
-- Enables users to follow fleets and receive notifications about fleet activity

CREATE TABLE IF NOT EXISTS fleet_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fleet_id UUID NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notify_on_documents BOOLEAN DEFAULT TRUE,
  notify_on_announcements BOOLEAN DEFAULT TRUE,
  notify_on_events BOOLEAN DEFAULT TRUE,
  notify_on_race_results BOOLEAN DEFAULT TRUE,
  notify_on_tuning_guides BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fleet_id, follower_id)
);

-- Indexes for fleet_followers
CREATE INDEX IF NOT EXISTS idx_fleet_followers_fleet_id ON fleet_followers(fleet_id);
CREATE INDEX IF NOT EXISTS idx_fleet_followers_follower_id ON fleet_followers(follower_id);

-- Enable RLS
ALTER TABLE fleet_followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view fleet followers"
  ON fleet_followers FOR SELECT
  USING (true);

CREATE POLICY "Users can follow fleets they are members of"
  ON fleet_followers FOR INSERT
  WITH CHECK (
    follower_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM fleet_members
      WHERE fleet_members.fleet_id = fleet_followers.fleet_id
      AND fleet_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own follow preferences"
  ON fleet_followers FOR UPDATE
  USING (follower_id = auth.uid());

CREATE POLICY "Users can unfollow fleets"
  ON fleet_followers FOR DELETE
  USING (follower_id = auth.uid());
