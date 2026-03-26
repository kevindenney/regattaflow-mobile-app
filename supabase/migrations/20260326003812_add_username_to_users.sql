-- Add username column to users table for unique, discoverable handles
ALTER TABLE public.users ADD COLUMN username TEXT;

-- Case-insensitive uniqueness (only for non-null usernames)
CREATE UNIQUE INDEX users_username_unique ON public.users (lower(username)) WHERE username IS NOT NULL;

-- Format constraint: 3-30 chars, alphanumeric + underscores only
ALTER TABLE public.users ADD CONSTRAINT users_username_format
  CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$');
