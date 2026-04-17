-- Add lac-craft-business to the allowed interest_slug values for organizations
ALTER TABLE organizations DROP CONSTRAINT organizations_interest_slug_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_interest_slug_check
  CHECK (interest_slug = ANY (ARRAY[
    'general', 'nursing', 'sail-racing', 'drawing', 'design',
    'fitness', 'health-and-fitness', 'knitting', 'fiber-arts',
    'painting-printing', 'lifelong-learning', 'regenerative-agriculture',
    'global-health', 'self-mastery', 'lac-craft-business'
  ]));

-- Update PRADAN org to use lac-craft-business interest_slug
UPDATE organizations
SET interest_slug = 'lac-craft-business'
WHERE slug = 'pradan-khunti';
