-- Migration: Fix regattas.created_by foreign key to reference users instead of profiles
-- Date: 2025-10-29
-- Issue: Race creation fails because created_by references legacy profiles table instead of users
--
-- Run this migration in your Supabase SQL Editor or via CLI:
-- supabase db push migrations/20251029_fix_regattas_fk_to_users.sql

-- Step 1: Drop the old foreign key constraint that references profiles
ALTER TABLE public.regattas
  DROP CONSTRAINT IF EXISTS regattas_created_by_fkey;

-- Step 2: Create new foreign key constraint that references users
ALTER TABLE public.regattas
  ADD CONSTRAINT regattas_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- Step 3: Create index for better query performance (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_regattas_created_by ON public.regattas(created_by);

-- Step 4: Add helpful comment
COMMENT ON CONSTRAINT regattas_created_by_fkey ON public.regattas IS
  'References users table (migrated from profiles on 2025-10-29)';

-- Verification query (optional - run after migration)
-- SELECT
--   con.conname AS constraint_name,
--   pg_get_constraintdef(con.oid) AS definition
-- FROM pg_constraint con
-- JOIN pg_class rel ON rel.oid = con.conrelid
-- WHERE rel.relname = 'regattas'
--   AND con.conname = 'regattas_created_by_fkey';
