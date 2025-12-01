-- Create crew_availability table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_crew_availability_crew_member ON public.crew_availability(crew_member_id);
CREATE INDEX IF NOT EXISTS idx_crew_availability_dates ON public.crew_availability(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_crew_availability_status ON public.crew_availability(status);

-- Enable RLS
ALTER TABLE public.crew_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can manage their own crew's availability
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

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_crew_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crew_availability_updated_at
  BEFORE UPDATE ON public.crew_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_crew_availability_updated_at();
