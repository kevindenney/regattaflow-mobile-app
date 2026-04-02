-- Create crew_members table
-- This table was referenced by code and crew_availability but never created

CREATE TABLE IF NOT EXISTS public.crew_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'crew' CHECK (role IN ('helmsman', 'tactician', 'trimmer', 'bowman', 'pitman', 'grinder', 'navigator', 'crew', 'skipper', 'other')),
  access_level TEXT NOT NULL DEFAULT 'view' CHECK (access_level IN ('view', 'edit', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'inactive', 'removed')),
  is_primary BOOLEAN DEFAULT false,
  certifications JSONB DEFAULT '[]',
  invite_token TEXT,
  invite_sent_at TIMESTAMP WITH TIME ZONE,
  invite_accepted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  performance_notes JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crew_members_sailor_id ON public.crew_members(sailor_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_class_id ON public.crew_members(class_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_email ON public.crew_members(email);
CREATE INDEX IF NOT EXISTS idx_crew_members_status ON public.crew_members(status);

-- Enable RLS
ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own crew" ON public.crew_members;
CREATE POLICY "Users can view their own crew"
  ON public.crew_members
  FOR SELECT
  USING (sailor_id = auth.uid() OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own crew" ON public.crew_members;
CREATE POLICY "Users can insert their own crew"
  ON public.crew_members
  FOR INSERT
  WITH CHECK (sailor_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own crew" ON public.crew_members;
CREATE POLICY "Users can update their own crew"
  ON public.crew_members
  FOR UPDATE
  USING (sailor_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own crew" ON public.crew_members;
CREATE POLICY "Users can delete their own crew"
  ON public.crew_members
  FOR DELETE
  USING (sailor_id = auth.uid());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_crew_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS crew_members_updated_at ON public.crew_members;
CREATE TRIGGER crew_members_updated_at
  BEFORE UPDATE ON public.crew_members
  FOR EACH ROW
  EXECUTE FUNCTION update_crew_members_updated_at();
