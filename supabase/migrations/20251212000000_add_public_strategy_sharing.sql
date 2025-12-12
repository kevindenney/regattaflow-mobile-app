-- Add public sharing columns to sailor_race_preparation table
-- This enables sailors to generate a public URL to share their race strategy
-- with anyone (read-only access without RegattaFlow login)

-- Add share_token column for unique public URL identifier
ALTER TABLE public.sailor_race_preparation 
  ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Add share_enabled flag to control public visibility
ALTER TABLE public.sailor_race_preparation 
  ADD COLUMN IF NOT EXISTS share_enabled BOOLEAN DEFAULT false;

-- Add public_shared_at timestamp for when public sharing was first enabled
ALTER TABLE public.sailor_race_preparation 
  ADD COLUMN IF NOT EXISTS public_shared_at TIMESTAMPTZ;

-- Create index for efficient token lookups (only on enabled shares)
CREATE INDEX IF NOT EXISTS idx_sailor_race_prep_share_token 
  ON public.sailor_race_preparation(share_token) 
  WHERE share_enabled = true;

-- Add RLS policy for public read access via share token
-- This allows unauthenticated access when accessed through the public API
-- The actual public access is handled via service role key in the API endpoint

-- Add comments for documentation
COMMENT ON COLUMN public.sailor_race_preparation.share_token IS
  'Unique token for public shareable URL (e.g., /s/{token})';
COMMENT ON COLUMN public.sailor_race_preparation.share_enabled IS
  'Whether public sharing is currently enabled for this strategy';
COMMENT ON COLUMN public.sailor_race_preparation.public_shared_at IS
  'Timestamp when public sharing was first enabled';
