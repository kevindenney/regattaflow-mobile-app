-- Migrate existing coach users to the new capabilities model
-- This converts users with user_type='coach' to user_type='sailor' with a coaching capability

-- Step 1: Insert coaching capabilities for all existing coach users
-- This preserves their coaching status while changing to the new model
INSERT INTO user_capabilities (user_id, capability_type, is_active, activated_at, metadata)
SELECT
  id as user_id,
  'coaching' as capability_type,
  true as is_active,
  created_at as activated_at,
  jsonb_build_object(
    'migrated_from_user_type', 'coach',
    'migration_date', NOW(),
    'original_created_at', created_at
  ) as metadata
FROM users
WHERE user_type = 'coach'
ON CONFLICT (user_id, capability_type)
DO UPDATE SET
  is_active = true,
  metadata = user_capabilities.metadata || jsonb_build_object('re_migrated', NOW());

-- Step 2: Update the user_type from 'coach' to 'sailor'
-- Their coach_profiles remain intact and linked by user_id
UPDATE users
SET
  user_type = 'sailor',
  updated_at = NOW()
WHERE user_type = 'coach';

-- Verify migration (this will show in logs)
DO $$
DECLARE
  migrated_count INTEGER;
  capability_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO capability_count
  FROM user_capabilities
  WHERE capability_type = 'coaching' AND is_active = true;

  SELECT COUNT(*) INTO migrated_count
  FROM users
  WHERE user_type = 'coach';

  RAISE NOTICE 'Migration complete: % users with coaching capability, % remaining coach user_type (should be 0)',
    capability_count, migrated_count;
END $$;

-- Add comment for documentation
COMMENT ON TABLE user_capabilities IS
  'Tracks additive capabilities for users. Migrated from user_type=coach model on 2026-01-14.';
