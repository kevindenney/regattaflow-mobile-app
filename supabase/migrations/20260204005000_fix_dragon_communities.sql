-- ============================================
-- Fix Dragon Class Community Data
--
-- Corrections based on official IDA website:
-- - 2025 Worlds: Vilamoura, Portugal (May 10-17)
-- - 2026 Europeans: Helsinki, Finland (June 27 - July 3)
-- - 2026 Gold Cup: Puerto Portals, Spain (March 16-21)
-- - 2025 Gold Cup: Douarnenez, France (August 25-30)
-- ============================================

-- Delete incorrect entries from previous migration
DELETE FROM communities WHERE slug IN (
    '2025-kuhlungsborn-dragon-worlds',
    '2026-cascais-dragon-worlds',
    '2026-sanremo-dragon-europeans',
    '2026-dragon-gold-cup-marstrand'
);

-- Insert corrected Grade 0 events
INSERT INTO communities (name, slug, description, community_type, category_id, is_official, metadata) VALUES

-- 2025 World Championship (CORRECT: Vilamoura, Portugal)
('2025 Vilamoura Dragon World Championship', '2025-vilamoura-dragon-worlds',
 'Official community for the 2025 Dragon Class World Championship in Vilamoura, Portugal (May 10-17, 2025).',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"year": 2025, "location": "Vilamoura, Portugal", "boat_class": "Dragon", "event_type": "World Championship", "grade": 0, "dates": "May 10-17"}'),

-- 2026 European Championship (CORRECT: Helsinki, Finland)
('2026 Helsinki Dragon European Championship', '2026-helsinki-dragon-europeans',
 'Official community for the 2026 Dragon Class European Championship in Helsinki, Finland (June 27 - July 3, 2026).',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"year": 2026, "location": "Helsinki, Finland", "boat_class": "Dragon", "event_type": "European Championship", "grade": 0, "dates": "Jun 27 - Jul 3"}'),

-- 2025 European Championship (Kühlungsborn is actually Europeans, not Worlds)
('2025 Kühlungsborn Dragon European Championship', '2025-kuhlungsborn-dragon-europeans',
 'Official community for the 2025 Dragon Class European Championship in Kühlungsborn, Germany.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"year": 2025, "location": "Kühlungsborn, Germany", "boat_class": "Dragon", "event_type": "European Championship", "grade": 0}')

ON CONFLICT (slug) DO NOTHING;

-- Insert corrected Gold Cup events
INSERT INTO communities (name, slug, description, community_type, category_id, is_official, metadata) VALUES

-- 2026 Gold Cup (CORRECT: Puerto Portals, Spain)
('2026 Puerto Portals Dragon Gold Cup', '2026-puerto-portals-gold-cup',
 'Official community for the 2026 Dragon Gold Cup in Puerto Portals, Spain (March 16-21, 2026).',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"year": 2026, "location": "Puerto Portals, Mallorca, Spain", "boat_class": "Dragon", "event_type": "Gold Cup", "grade": 1, "dates": "Mar 16-21"}'),

-- 2025 Gold Cup (CORRECT: Douarnenez, France)
('2025 Douarnenez Dragon Gold Cup', '2025-douarnenez-gold-cup',
 'Official community for the 2025 Dragon Gold Cup in Douarnenez, France (August 25-30, 2025).',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"year": 2025, "location": "Douarnenez, France", "boat_class": "Dragon", "event_type": "Gold Cup", "grade": 1, "dates": "Aug 25-30"}')

ON CONFLICT (slug) DO NOTHING;

-- Insert 2025 Grand Prix events with correct dates from IDA calendar
INSERT INTO communities (name, slug, description, community_type, category_id, is_official, metadata) VALUES

('2025 Cascais Dragon Grand Prix', '2025-cascais-dragon-gp',
 'Dragon Grand Prix Cascais 2025 (April 5-12, 2025). World-class racing on the Portuguese Riviera.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"year": 2025, "location": "Cascais, Portugal", "boat_class": "Dragon", "event_type": "Grand Prix", "grade": 2, "dates": "Apr 5-12"}'),

('2025 Attersee Dragon Grand Prix', '2025-attersee-dragon-gp',
 'Dragon Grand Prix Attersee 2025 (July 7-12, 2025). Racing on Austria''s beautiful lake.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"year": 2025, "location": "Attersee, Austria", "boat_class": "Dragon", "event_type": "Grand Prix", "grade": 2, "dates": "Jul 7-12"}'),

('2025 Skanör Dragon Grand Prix', '2025-skanor-dragon-gp',
 'Dragon Grand Prix Skanör-Falsterbo 2025 (July 14-20, 2025). Swedish summer racing.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"year": 2025, "location": "Skanör-Falsterbo, Sweden", "boat_class": "Dragon", "event_type": "Grand Prix", "grade": 2, "dates": "Jul 14-20"}'),

('2025 Cannes Dragon Grand Prix', '2025-cannes-dragon-gp',
 'Dragon Grand Prix Cannes 2025 (September 23-27, 2025). Régates Royales - one of the most prestigious Dragon regattas.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"year": 2025, "location": "Cannes, France", "boat_class": "Dragon", "event_type": "Grand Prix", "grade": 2, "dates": "Sep 23-27"}')

ON CONFLICT (slug) DO NOTHING;

-- Add more yacht clubs that were missing
INSERT INTO communities (name, slug, description, community_type, category_id, metadata) VALUES

('Skanör-Falsterbo Segelsällskap Dragons', 'sfss-dragons',
 'Dragon fleet at Skanör-Falsterbo - venue for the annual Grand Prix.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Skanör-Falsterbo SS", "location": "Skanör, Sweden", "fleet": "Dragon"}'),

('Union Yacht Club Attersee Dragons', 'uyca-dragons',
 'Dragon fleet at Attersee - venue for annual Grand Prix.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Union Yacht Club Attersee", "location": "Attersee, Austria", "fleet": "Dragon"}'),

('Vilamoura Sailing Dragons', 'vilamoura-dragons',
 'Dragon fleet at Vilamoura, Portugal - host of World Championship 2025.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Vilamoura Sailing", "location": "Vilamoura, Portugal", "fleet": "Dragon"}')

ON CONFLICT (slug) DO NOTHING;

-- Add national associations that were missing
INSERT INTO communities (name, slug, description, community_type, category_id, is_official, metadata) VALUES

('Portuguese Dragon Association', 'portuguese-dragon-association',
 'Portuguese Dragon Association. Host of World Championship 2025 in Vilamoura.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Portugal", "parent_organization": "International Dragon Class"}'),

('Spanish Dragon Association', 'spanish-dragon-association',
 'Spanish Dragon Association. Host of Gold Cup 2026 in Puerto Portals.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Spain", "parent_organization": "International Dragon Class"}'),

('Finnish Dragon Association', 'finnish-dragon-association',
 'Finnish Dragon Association. Host of European Championship 2026 in Helsinki.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Finland", "parent_organization": "International Dragon Class"}'),

('Dutch Dragon Association', 'dutch-dragon-association',
 'Dutch Dragon Association (Nederlandse Draken Klassenorganisatie). Fleet of 94+ boats.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Netherlands", "parent_organization": "International Dragon Class", "fleet_size": 94}'),

('Swiss Dragon Association', 'swiss-dragon-association',
 'Swiss Dragon Association. Fleet of 94+ boats on Swiss lakes.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Switzerland", "parent_organization": "International Dragon Class", "fleet_size": 94}'),

('Swedish Dragon Association', 'swedish-dragon-association',
 'Swedish Dragon Association (Svenska Drakklubbens).',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Sweden", "parent_organization": "International Dragon Class"}'),

('Danish Dragon Association', 'danish-dragon-association',
 'Danish Dragon Association.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Denmark", "parent_organization": "International Dragon Class"}'),

('Norwegian Dragon Association', 'norwegian-dragon-association',
 'Norwegian Dragon Association.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Norway", "parent_organization": "International Dragon Class"}'),

('Italian Dragon Association', 'italian-dragon-association',
 'Italian Dragon Association (Classe Dragon Italia).',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Italy", "parent_organization": "International Dragon Class"}'),

('Austrian Dragon Association', 'austrian-dragon-association',
 'Austrian Dragon Association. Host of annual Attersee Grand Prix.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Austria", "parent_organization": "International Dragon Class"}'),

('Belgian Dragon Association', 'belgian-dragon-association',
 'Belgian Dragon Association.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Belgium", "parent_organization": "International Dragon Class"}'),

('Australian Dragon Association', 'australian-dragon-association',
 'Australian Dragon Association.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Australia", "parent_organization": "International Dragon Class"}'),

('Irish Dragon Association', 'irish-dragon-association',
 'Irish Dragon Association.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Ireland", "parent_organization": "International Dragon Class"}'),

('Greek Dragon Association', 'greek-dragon-association',
 'Greek Dragon Association.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Greece", "parent_organization": "International Dragon Class"}'),

('Turkish Dragon Association', 'turkish-dragon-association',
 'Turkish Dragon Association.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Turkey", "parent_organization": "International Dragon Class"}'),

('Russian Dragon Association', 'russian-dragon-association',
 'Russian Dragon Association.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Russia", "parent_organization": "International Dragon Class"}'),

('Japanese Dragon Association', 'japanese-dragon-association',
 'Japanese Dragon Association.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Japan", "parent_organization": "International Dragon Class"}')

ON CONFLICT (slug) DO NOTHING;

-- Update the IDA website URL in the main International Dragon Class community
UPDATE communities
SET metadata = '{"website": "https://internationaldragonsailing.net", "founded": 1929, "olympic_years": "1948-1972", "countries": 31, "boats": 1300}'::jsonb
WHERE slug = 'international-dragon-class';
