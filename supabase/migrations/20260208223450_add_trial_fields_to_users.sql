-- Add reverse trial fields to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- Comment for documentation
COMMENT ON COLUMN public.users.trial_started_at IS 'When the 14-day Pro reverse trial was started';
COMMENT ON COLUMN public.users.trial_ends_at IS 'When the 14-day Pro reverse trial expires';
