-- Add foreign key constraints to coaching_clients table
-- This enables Supabase to understand the relationship for JOIN queries

-- Add foreign key for coach_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'coaching_clients_coach_id_fkey'
  ) THEN
    ALTER TABLE coaching_clients
    ADD CONSTRAINT coaching_clients_coach_id_fkey
    FOREIGN KEY (coach_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added coach_id foreign key';
  ELSE
    RAISE NOTICE 'coach_id foreign key already exists';
  END IF;
END $$;

-- Add foreign key for sailor_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'coaching_clients_sailor_id_fkey'
  ) THEN
    ALTER TABLE coaching_clients
    ADD CONSTRAINT coaching_clients_sailor_id_fkey
    FOREIGN KEY (sailor_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added sailor_id foreign key';
  ELSE
    RAISE NOTICE 'sailor_id foreign key already exists';
  END IF;
END $$;
