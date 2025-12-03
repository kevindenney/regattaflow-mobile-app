-- ============================================================================
-- Apply Crew Management Tables
-- Run this in Supabase Studio SQL Editor
-- ============================================================================

-- 1. Create crew_availability table
CREATE TABLE IF NOT EXISTS public.crew_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_member_id UUID NOT NULL REFERENCES public.crew_members(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'unavailable', 'tentative')),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for crew_availability
CREATE INDEX IF NOT EXISTS idx_crew_availability_crew_member ON public.crew_availability(crew_member_id);
CREATE INDEX IF NOT EXISTS idx_crew_availability_dates ON public.crew_availability(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_crew_availability_status ON public.crew_availability(status);

-- Enable RLS on crew_availability
ALTER TABLE public.crew_availability ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors)
DROP POLICY IF EXISTS "Users can view their crew's availability" ON public.crew_availability;
DROP POLICY IF EXISTS "Users can insert their crew's availability" ON public.crew_availability;
DROP POLICY IF EXISTS "Users can update their crew's availability" ON public.crew_availability;
DROP POLICY IF EXISTS "Users can delete their crew's availability" ON public.crew_availability;

-- Create RLS policies for crew_availability
CREATE POLICY "Users can view their crew's availability"
  ON public.crew_availability
  FOR SELECT
  USING (
    crew_member_id IN (
      SELECT id FROM public.crew_members
      WHERE sailor_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their crew's availability"
  ON public.crew_availability
  FOR INSERT
  WITH CHECK (
    crew_member_id IN (
      SELECT id FROM public.crew_members
      WHERE sailor_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their crew's availability"
  ON public.crew_availability
  FOR UPDATE
  USING (
    crew_member_id IN (
      SELECT id FROM public.crew_members
      WHERE sailor_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their crew's availability"
  ON public.crew_availability
  FOR DELETE
  USING (
    crew_member_id IN (
      SELECT id FROM public.crew_members
      WHERE sailor_id = auth.uid()
    )
  );

-- Create update trigger for crew_availability
CREATE OR REPLACE FUNCTION public.update_crew_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS crew_availability_updated_at ON public.crew_availability;
CREATE TRIGGER crew_availability_updated_at
  BEFORE UPDATE ON public.crew_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_crew_availability_updated_at();

-- ============================================================================

-- 2. Create race_crew_assignments table
CREATE TABLE IF NOT EXISTS public.race_crew_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID NOT NULL REFERENCES public.regatta_races(id) ON DELETE CASCADE,
  crew_member_id UUID NOT NULL REFERENCES public.crew_members(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure a crew member can only be assigned once per race
  UNIQUE(race_id, crew_member_id)
);

-- Create indexes for race_crew_assignments
CREATE INDEX IF NOT EXISTS idx_race_crew_assignments_race ON public.race_crew_assignments(race_id);
CREATE INDEX IF NOT EXISTS idx_race_crew_assignments_crew_member ON public.race_crew_assignments(crew_member_id);
CREATE INDEX IF NOT EXISTS idx_race_crew_assignments_assigned_at ON public.race_crew_assignments(assigned_at);

-- Enable RLS on race_crew_assignments
ALTER TABLE public.race_crew_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view crew assignments for their races" ON public.race_crew_assignments;
DROP POLICY IF EXISTS "Users can assign crew to their races" ON public.race_crew_assignments;
DROP POLICY IF EXISTS "Users can update crew assignments for their races" ON public.race_crew_assignments;
DROP POLICY IF EXISTS "Users can delete crew assignments for their races" ON public.race_crew_assignments;

-- Create RLS policies for race_crew_assignments
CREATE POLICY "Users can view crew assignments for their races"
  ON public.race_crew_assignments
  FOR SELECT
  USING (
    -- User owns the race (via regatta)
    race_id IN (
      SELECT rr.id FROM public.regatta_races rr
      INNER JOIN public.regattas r ON rr.regatta_id = r.id
      WHERE r.owner_id = auth.uid()
    )
    OR
    -- User is the crew member or owns the crew member
    crew_member_id IN (
      SELECT id FROM public.crew_members
      WHERE sailor_id = auth.uid() OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can assign crew to their races"
  ON public.race_crew_assignments
  FOR INSERT
  WITH CHECK (
    -- User owns the race (via regatta)
    race_id IN (
      SELECT rr.id FROM public.regatta_races rr
      INNER JOIN public.regattas r ON rr.regatta_id = r.id
      WHERE r.owner_id = auth.uid()
    )
    AND
    -- User owns the crew member
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

-- Create update trigger for race_crew_assignments
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

-- Add table comments
COMMENT ON TABLE public.crew_availability IS 'Tracks crew member availability for date ranges';
COMMENT ON TABLE public.race_crew_assignments IS 'Tracks crew member assignments to specific races';

-- Done!
SELECT 'Crew tables created successfully!' AS status;
