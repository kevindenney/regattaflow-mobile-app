-- Create race_crew_assignments table (simplified - no FK constraints)
CREATE TABLE IF NOT EXISTS public.race_crew_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID NOT NULL,
  crew_member_id UUID NOT NULL REFERENCES public.crew_members(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure a crew member can only be assigned once per race
  UNIQUE(race_id, crew_member_id)
);

-- Create indexes for performance
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

-- Create RLS policies
CREATE POLICY "Users can view crew assignments for their races"
  ON public.race_crew_assignments
  FOR SELECT
  USING (
    crew_member_id IN (
      SELECT id FROM public.crew_members
      WHERE sailor_id = auth.uid() OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can assign crew to their races"
  ON public.race_crew_assignments
  FOR INSERT
  WITH CHECK (
    crew_member_id IN (
      SELECT id FROM public.crew_members
      WHERE sailor_id = auth.uid()
    )
  );

CREATE POLICY "Users can update crew assignments for their races"
  ON public.race_crew_assignments
  FOR UPDATE
  USING (
    crew_member_id IN (
      SELECT id FROM public.crew_members
      WHERE sailor_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete crew assignments for their races"
  ON public.race_crew_assignments
  FOR DELETE
  USING (
    crew_member_id IN (
      SELECT id FROM public.crew_members
      WHERE sailor_id = auth.uid()
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

-- Add comment
COMMENT ON TABLE public.race_crew_assignments IS 'Tracks crew member assignments to specific races';

-- Success message
SELECT 'race_crew_assignments table created successfully!' AS status;
