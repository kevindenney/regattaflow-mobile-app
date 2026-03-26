-- Add configurable onboarding content for organizations
-- Allows org admins to set welcome message, key links, and orientation text
-- for new members joining during onboarding.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS onboarding_config jsonb DEFAULT NULL;

COMMENT ON COLUMN organizations.onboarding_config IS
  'Org-configurable onboarding: {welcome_message, key_links: [{label,url}], orientation_text}';
