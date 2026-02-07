-- Add 'boat_builder' to community_type enum
-- Must be in its own migration so the value is committed
-- before it can be used in INSERT statements.
ALTER TYPE community_type ADD VALUE IF NOT EXISTS 'boat_builder';
