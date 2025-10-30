-- Quick fix for remaining FK constraints
-- Run this in Supabase SQL Editor

-- race_participants
ALTER TABLE public.race_participants DROP CONSTRAINT IF EXISTS race_participants_user_id_fkey;
ALTER TABLE public.race_participants ADD CONSTRAINT race_participants_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- race_documents
ALTER TABLE public.race_documents DROP CONSTRAINT IF EXISTS race_documents_user_id_fkey;
ALTER TABLE public.race_documents ADD CONSTRAINT race_documents_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ai_analyses
ALTER TABLE public.ai_analyses DROP CONSTRAINT IF EXISTS ai_analyses_user_id_fkey;
ALTER TABLE public.ai_analyses ADD CONSTRAINT ai_analyses_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ai_usage_logs
ALTER TABLE public.ai_usage_logs DROP CONSTRAINT IF EXISTS ai_usage_logs_user_id_fkey;
ALTER TABLE public.ai_usage_logs ADD CONSTRAINT ai_usage_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- subscriptions
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- weather_insights
ALTER TABLE public.weather_insights DROP CONSTRAINT IF EXISTS weather_insights_user_id_fkey;
ALTER TABLE public.weather_insights ADD CONSTRAINT weather_insights_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
