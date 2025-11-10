-- Fix fleet_members table schema
-- Add missing role column and unique constraint

-- Add role column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fleet_members' AND column_name = 'role'
  ) THEN
    ALTER TABLE fleet_members
    ADD COLUMN role TEXT DEFAULT 'member';
  END IF;
END $$;

-- Add invited_by column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fleet_members' AND column_name = 'invited_by'
  ) THEN
    ALTER TABLE fleet_members
    ADD COLUMN invited_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add metadata column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fleet_members' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE fleet_members
    ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Add notify_fleet_on_join column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fleet_members' AND column_name = 'notify_fleet_on_join'
  ) THEN
    ALTER TABLE fleet_members
    ADD COLUMN notify_fleet_on_join BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add unique constraint on (fleet_id, user_id) if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fleet_members_fleet_id_user_id_key'
  ) THEN
    ALTER TABLE fleet_members
    ADD CONSTRAINT fleet_members_fleet_id_user_id_key UNIQUE (fleet_id, user_id);
  END IF;
END $$;

-- Add check constraint for role values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fleet_members_role_check'
  ) THEN
    ALTER TABLE fleet_members
    ADD CONSTRAINT fleet_members_role_check
    CHECK (role IN ('member', 'owner', 'captain', 'coach', 'support'));
  END IF;
END $$;

-- Add check constraint for status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fleet_members_status_check'
  ) THEN
    ALTER TABLE fleet_members
    ADD CONSTRAINT fleet_members_status_check
    CHECK (status IN ('active', 'pending', 'invited', 'inactive'));
  END IF;
END $$;

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_fleet_members_user_id ON fleet_members(user_id);

-- Create index on status for filtered queries
CREATE INDEX IF NOT EXISTS idx_fleet_members_status ON fleet_members(status);

-- Create composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_fleet_members_user_status ON fleet_members(user_id, status);
