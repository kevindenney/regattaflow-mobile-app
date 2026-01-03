-- Fix fleet_notifications foreign keys to reference profiles instead of auth.users
-- This is required for Supabase's join syntax to work with profiles table columns

-- Drop existing FKs that reference auth.users (if they exist)
ALTER TABLE fleet_notifications
  DROP CONSTRAINT IF EXISTS fleet_notifications_user_id_fkey,
  DROP CONSTRAINT IF EXISTS fleet_notifications_actor_id_fkey;

-- Recreate them to reference profiles
ALTER TABLE fleet_notifications
  ADD CONSTRAINT fleet_notifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT fleet_notifications_actor_id_fkey
    FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index for performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_fleet_notifications_user_id
  ON fleet_notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_fleet_notifications_created_at
  ON fleet_notifications(created_at DESC);
