-- =====================================================
-- Seed Dragon Worlds 2027 Community
-- Official community for Dragon Worlds Championship in Hong Kong
-- =====================================================

-- ============================================
-- 1. CREATE DRAGON WORLDS 2027 COMMUNITY
-- ============================================

-- First ensure we have a 'racing' category
INSERT INTO community_categories (name, display_name, description, icon, color, sort_order)
VALUES ('events', 'Events', 'Major sailing events and championships', 'calendar-outline', '#2563EB', 0)
ON CONFLICT (name) DO NOTHING;

-- Insert the Dragon Worlds 2027 community
INSERT INTO communities (
  name,
  slug,
  description,
  community_type,
  category_id,
  is_official,
  is_verified,
  linked_entity_type,
  linked_entity_id,
  metadata
) VALUES (
  '2027 HK Dragon Worlds',
  '2027-hk-dragon-worlds',
  'Official community for the 2027 Dragon World Championship in Hong Kong. Connect with fellow competitors, discuss race strategy, share local knowledge, and stay updated on event information.',
  'race',
  (SELECT id FROM community_categories WHERE name = 'events' LIMIT 1),
  true,
  true,
  'catalog_race',
  'dragon-worlds-2027',
  jsonb_build_object(
    'event_name', '2027 Dragon World Championship',
    'location', 'Hong Kong',
    'venue', 'Royal Hong Kong Yacht Club',
    'dates', '2027-11-15 to 2027-11-22',
    'boat_class', 'Dragon',
    'expected_entries', 50,
    'website', 'https://dragonworlds2027.hk',
    'integration', 'dragon_worlds_app'
  )
)
ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  is_official = true,
  is_verified = true;

-- ============================================
-- 2. CREATE DEFAULT FLAIRS FOR THE COMMUNITY
-- ============================================

-- Get the community ID
DO $$
DECLARE
  v_community_id UUID;
BEGIN
  SELECT id INTO v_community_id FROM communities WHERE slug = '2027-hk-dragon-worlds';

  IF v_community_id IS NOT NULL THEN
    -- Insert flairs for organizing discussions
    INSERT INTO community_flairs (community_id, name, display_name, color, sort_order)
    VALUES
      (v_community_id, 'official', 'Official', '#DC2626', 1),
      (v_community_id, 'weather', 'Weather Update', '#0891B2', 2),
      (v_community_id, 'race-day', 'Race Day', '#EA580C', 3),
      (v_community_id, 'local-tips', 'Local Tips', '#059669', 4),
      (v_community_id, 'equipment', 'Equipment', '#7C3AED', 5),
      (v_community_id, 'social', 'Social', '#D97706', 6),
      (v_community_id, 'results', 'Results', '#2563EB', 7),
      (v_community_id, 'question', 'Question', '#6B7280', 8)
    ON CONFLICT (community_id, name) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- 3. COMMENTS
-- ============================================

COMMENT ON TABLE communities IS 'Communities table with Dragon Worlds 2027 event seeded';
