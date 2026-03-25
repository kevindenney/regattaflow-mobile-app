-- Interest Hierarchy: Two-level domain → interest grouping
-- Adds domain rows and links existing interests to their parent domain.

-- 1. Allow 'domain' in the type column
ALTER TABLE interests
  DROP CONSTRAINT IF EXISTS interests_type_check;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'interests_type_check'
      AND conrelid = 'interests'::regclass
  ) THEN
    ALTER TABLE interests DROP CONSTRAINT interests_type_check;
  END IF;
END $$;

ALTER TABLE interests
  ADD CONSTRAINT interests_type_check
  CHECK (type IN ('official', 'org', 'user_proposed', 'private', 'domain'));

-- 2. Add organization_id for future org-proposed interests
ALTER TABLE interests
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);

-- 3. Insert domain rows
INSERT INTO interests (slug, name, type, status, visibility, accent_color, description)
VALUES
  ('healthcare',                'Healthcare',                  'domain', 'active', 'public', '#6366F1', 'Healthcare and medical education'),
  ('creative-arts',             'Creative Arts',               'domain', 'active', 'public', '#F59E0B', 'Visual arts, design, and crafts'),
  ('sports-outdoors',           'Sports & Outdoors',           'domain', 'active', 'public', '#0EA5E9', 'Athletic pursuits and outdoor activities'),
  ('education-learning',        'Education & Learning',        'domain', 'active', 'public', '#5C6BC0', 'Lifelong learning and personal development'),
  ('agriculture-environment',   'Agriculture & Environment',   'domain', 'active', 'public', '#2E7D32', 'Farming, sustainability, and environmental stewardship')
ON CONFLICT (slug) DO NOTHING;

-- 4. Set parent_id on existing interests
-- Healthcare
UPDATE interests SET parent_id = (SELECT id FROM interests WHERE slug = 'healthcare')
WHERE slug IN ('nursing', 'global-health') AND parent_id IS NULL;

-- Creative Arts
UPDATE interests SET parent_id = (SELECT id FROM interests WHERE slug = 'creative-arts')
WHERE slug IN ('drawing', 'design', 'knitting', 'fiber-arts', 'painting-printing') AND parent_id IS NULL;

-- Sports & Outdoors
UPDATE interests SET parent_id = (SELECT id FROM interests WHERE slug = 'sports-outdoors')
WHERE slug IN ('sail-racing', 'golf', 'fitness', 'health-and-fitness', 'dragon-class') AND parent_id IS NULL;

-- Education & Learning
UPDATE interests SET parent_id = (SELECT id FROM interests WHERE slug = 'education-learning')
WHERE slug IN ('lifelong-learning') AND parent_id IS NULL;

-- Agriculture & Environment
UPDATE interests SET parent_id = (SELECT id FROM interests WHERE slug = 'agriculture-environment')
WHERE slug IN ('regenerative-agriculture') AND parent_id IS NULL;

-- 5. Index for efficient grouping queries
CREATE INDEX IF NOT EXISTS idx_interests_parent_id ON interests(parent_id);
