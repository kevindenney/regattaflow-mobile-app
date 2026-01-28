-- Create sailor_focus_intents table
-- Tracks focus intents set by sailors after race reviews to carry into future races.
-- Supports the deliberate practice loop: Review → Set Focus → Prep → Race → Evaluate.

CREATE TABLE public.sailor_focus_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_race_id UUID REFERENCES public.regattas(id) ON DELETE SET NULL,
  target_race_id UUID REFERENCES public.regattas(id) ON DELETE SET NULL,
  focus_text TEXT NOT NULL,
  phase TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  evaluation_rating INTEGER CHECK (evaluation_rating BETWEEN 1 AND 5),
  evaluation_notes TEXT,
  evaluated_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  streak_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sailor_focus_intents_sailor ON public.sailor_focus_intents(sailor_id);
CREATE INDEX idx_sailor_focus_intents_source_race ON public.sailor_focus_intents(source_race_id);
CREATE INDEX idx_sailor_focus_intents_target_race ON public.sailor_focus_intents(target_race_id);
CREATE INDEX idx_sailor_focus_intents_status ON public.sailor_focus_intents(sailor_id, status);

-- Enable RLS
ALTER TABLE public.sailor_focus_intents ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own focus intents
CREATE POLICY "Users can view own focus intents"
  ON public.sailor_focus_intents
  FOR SELECT
  USING (auth.uid() = sailor_id);

CREATE POLICY "Users can insert own focus intents"
  ON public.sailor_focus_intents
  FOR INSERT
  WITH CHECK (auth.uid() = sailor_id);

CREATE POLICY "Users can update own focus intents"
  ON public.sailor_focus_intents
  FOR UPDATE
  USING (auth.uid() = sailor_id)
  WITH CHECK (auth.uid() = sailor_id);

CREATE POLICY "Users can delete own focus intents"
  ON public.sailor_focus_intents
  FOR DELETE
  USING (auth.uid() = sailor_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_sailor_focus_intents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

CREATE TRIGGER trigger_update_sailor_focus_intents_updated_at
  BEFORE UPDATE ON public.sailor_focus_intents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sailor_focus_intents_updated_at();
