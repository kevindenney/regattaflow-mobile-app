#!/usr/bin/env node

/**
 * Apply race_crew_assignments migration to Supabase
 * Run with: node apply-race-crew-migration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  console.error('\nMake sure these are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const migrationSql = `
-- Create race_crew_assignments table
CREATE TABLE IF NOT EXISTS public.race_crew_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID NOT NULL REFERENCES public.regatta_races(id) ON DELETE CASCADE,
  crew_member_id UUID NOT NULL REFERENCES public.crew_members(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(race_id, crew_member_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_race_crew_assignments_race ON public.race_crew_assignments(race_id);
CREATE INDEX IF NOT EXISTS idx_race_crew_assignments_crew_member ON public.race_crew_assignments(crew_member_id);
CREATE INDEX IF NOT EXISTS idx_race_crew_assignments_assigned_at ON public.race_crew_assignments(assigned_at);

-- Enable RLS
ALTER TABLE public.race_crew_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view crew assignments for their races" ON public.race_crew_assignments;
DROP POLICY IF EXISTS "Users can assign crew to their races" ON public.race_crew_assignments;
DROP POLICY IF EXISTS "Users can update crew assignments for their races" ON public.race_crew_assignments;
DROP POLICY IF EXISTS "Users can delete crew assignments for their races" ON public.race_crew_assignments;

-- RLS Policies
CREATE POLICY "Users can view crew assignments for their races"
  ON public.race_crew_assignments
  FOR SELECT
  USING (
    race_id IN (
      SELECT rr.id FROM public.regatta_races rr
      INNER JOIN public.regattas r ON rr.regatta_id = r.id
      WHERE r.owner_id = auth.uid()
    )
    OR
    crew_member_id IN (
      SELECT id FROM public.crew_members
      WHERE sailor_id = auth.uid() OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can assign crew to their races"
  ON public.race_crew_assignments
  FOR INSERT
  WITH CHECK (
    race_id IN (
      SELECT rr.id FROM public.regatta_races rr
      INNER JOIN public.regattas r ON rr.regatta_id = r.id
      WHERE r.owner_id = auth.uid()
    )
    AND
    crew_member_id IN (
      SELECT id FROM public.crew_members
      WHERE sailor_id = auth.uid()
    )
  );

CREATE POLICY "Users can update crew assignments for their races"
  ON public.race_crew_assignments
  FOR UPDATE
  USING (
    race_id IN (
      SELECT rr.id FROM public.regatta_races rr
      INNER JOIN public.regattas r ON rr.regatta_id = r.id
      WHERE r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete crew assignments for their races"
  ON public.race_crew_assignments
  FOR DELETE
  USING (
    race_id IN (
      SELECT rr.id FROM public.regatta_races rr
      INNER JOIN public.regattas r ON rr.regatta_id = r.id
      WHERE r.owner_id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_race_crew_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS race_crew_assignments_updated_at ON public.race_crew_assignments;
CREATE TRIGGER race_crew_assignments_updated_at
  BEFORE UPDATE ON public.race_crew_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_race_crew_assignments_updated_at();

COMMENT ON TABLE public.race_crew_assignments IS 'Tracks crew member assignments to specific races';
`;

async function applyMigration() {
  console.log('🚀 Applying race_crew_assignments migration...\n');

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSql });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
    console.log('\n📊 race_crew_assignments table is now ready');
    console.log('   - Table created with RLS enabled');
    console.log('   - Indexes created for performance');
    console.log('   - Policies configured for secure access\n');
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

applyMigration();
