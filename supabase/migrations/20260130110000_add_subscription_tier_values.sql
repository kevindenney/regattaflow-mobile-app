-- Add new subscription tier enum values: individual, team
-- These replace the old 'basic' and 'pro' values

-- Add new enum values
ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'individual';
ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'team';

-- Note: We keep 'basic' and 'pro' for backward compatibility
-- The application code maps: basic -> individual, pro -> team
