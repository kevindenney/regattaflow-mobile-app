-- Fix search_path security warning on focus intents trigger function
CREATE OR REPLACE FUNCTION public.update_sailor_focus_intents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';
