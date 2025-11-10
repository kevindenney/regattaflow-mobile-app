-- Fix missing INSERT policy for race_suggestions_cache
-- This policy is needed for the RaceSuggestionService to create suggestions

DROP POLICY IF EXISTS "Users can insert own suggestions" ON public.race_suggestions_cache;
CREATE POLICY "Users can insert own suggestions"
    ON public.race_suggestions_cache FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Also add INSERT policies for patterns and templates if needed
DROP POLICY IF EXISTS "Users can insert own patterns" ON public.race_patterns;
CREATE POLICY "Users can insert own patterns"
    ON public.race_patterns FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own templates" ON public.race_templates;
CREATE POLICY "Users can insert own templates"
    ON public.race_templates FOR INSERT
    WITH CHECK (user_id = auth.uid());
