-- Create user_preferences table for notification and language settings
-- This fixes PGRST205 errors on notifications.tsx and language.tsx screens

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_preferences JSONB DEFAULT '{
    "race_reminders": true,
    "weather_alerts": true,
    "crew_messages": true,
    "race_results": true,
    "coaching_updates": true,
    "fleet_activity": true,
    "venue_intelligence": true,
    "email_notifications": true,
    "push_notifications": true
  }'::jsonb,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own preferences
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Updated at trigger (uses existing function from earlier migrations)
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.user_preferences IS 'Stores user notification preferences and language settings';
