-- ============================================
-- Seed Race Communities
--
-- Comprehensive coverage of Dragon Class events
-- verified from official IDA website (internationaldragonsailing.net)
--
-- Grade System:
-- - Grade 0: World Championship, Continental Championships
-- - Grade 1: Gold Cup, Major International Events
-- - Grade 2: Grand Prix, National Championships
-- ============================================

-- ============================================
-- 1. DRAGON CLASS WORLD & CONTINENTAL CHAMPIONSHIPS (Grade 0)
-- ============================================

INSERT INTO communities (name, slug, description, community_type, category_id, is_official, metadata) VALUES

-- World Championships (verified from IDA calendar)
('2027 Hong Kong Dragon World Championship', '2027-hong-kong-dragon-worlds',
 'Official community for the 2027 Dragon Class World Championship in Hong Kong (November 24-30, 2027). Race discussions, local knowledge, and event updates.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"year": 2027, "location": "Hong Kong", "boat_class": "Dragon", "event_type": "World Championship", "grade": 0, "dates": "Nov 24-30"}'),

('2026 Vilamoura Dragon World Championship', '2026-vilamoura-dragon-worlds',
 'Official community for the 2026 Dragon Class World Championship in Vilamoura, Portugal.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"year": 2026, "location": "Vilamoura, Portugal", "boat_class": "Dragon", "event_type": "World Championship", "grade": 0}'),

('2025 Vilamoura Dragon World Championship', '2025-vilamoura-dragon-worlds',
 'Official community for the 2025 Dragon Class World Championship in Vilamoura, Portugal (May 10-17, 2025).',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"year": 2025, "location": "Vilamoura, Portugal", "boat_class": "Dragon", "event_type": "World Championship", "grade": 0, "dates": "May 10-17"}'),

-- European Championships (verified from IDA calendar)
('2026 Helsinki Dragon European Championship', '2026-helsinki-dragon-europeans',
 'Official community for the 2026 Dragon Class European Championship in Helsinki, Finland (June 27 - July 3, 2026).',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"year": 2026, "location": "Helsinki, Finland", "boat_class": "Dragon", "event_type": "European Championship", "grade": 0, "dates": "Jun 27 - Jul 3"}'),

('2025 Kühlungsborn Dragon European Championship', '2025-kuhlungsborn-dragon-europeans',
 'Official community for the 2025 Dragon Class European Championship in Kühlungsborn, Germany.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"year": 2025, "location": "Kühlungsborn, Germany", "boat_class": "Dragon", "event_type": "European Championship", "grade": 0}'),

-- Asia Pacific Championship (verified from IDA calendar)
('Asia Pacific Dragon Cup 2026', 'asia-pacific-dragon-cup-2026',
 'Official community for the 2026 Asia Pacific Dragon Cup in Hong Kong (November 17-21, 2026). Connect with sailors from across the Asia Pacific region.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"year": 2026, "location": "Hong Kong", "boat_class": "Dragon", "event_type": "Continental Championship", "region": "Asia Pacific", "grade": 0, "dates": "Nov 17-21"}'),

('Asia Pacific Dragon Cup 2027', 'asia-pacific-dragon-cup-2027',
 'Official community for the 2027 Asia Pacific Dragon Cup.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"year": 2027, "boat_class": "Dragon", "event_type": "Continental Championship", "region": "Asia Pacific", "grade": 0}')

ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 2. DRAGON GOLD CUP (Grade 1) - The oldest Dragon trophy
-- ============================================

INSERT INTO communities (name, slug, description, community_type, category_id, is_official, metadata) VALUES

('Dragon Gold Cup', 'dragon-gold-cup',
 'The Dragon Gold Cup - the oldest and most prestigious trophy in Dragon Class racing, first awarded in 1937. Annual event discussions and history.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"boat_class": "Dragon", "event_type": "Gold Cup", "grade": 1, "established": 1937}'),

('2027 Dragon Gold Cup', '2027-dragon-gold-cup',
 'Official community for the 2027 Dragon Gold Cup.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"year": 2027, "boat_class": "Dragon", "event_type": "Gold Cup", "grade": 1}'),

('2026 Puerto Portals Dragon Gold Cup', '2026-puerto-portals-gold-cup',
 'Official community for the 2026 Dragon Gold Cup in Puerto Portals, Spain (March 16-21, 2026).',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"year": 2026, "location": "Puerto Portals, Mallorca, Spain", "boat_class": "Dragon", "event_type": "Gold Cup", "grade": 1, "dates": "Mar 16-21"}'),

('2025 Douarnenez Dragon Gold Cup', '2025-douarnenez-gold-cup',
 'Official community for the 2025 Dragon Gold Cup in Douarnenez, France (August 25-30, 2025).',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"year": 2025, "location": "Douarnenez, France", "boat_class": "Dragon", "event_type": "Gold Cup", "grade": 1, "dates": "Aug 25-30"}')

ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 3. DRAGON GRAND PRIX SERIES (Grade 2)
-- Verified from IDA 2025/2026 calendar
-- ============================================

INSERT INTO communities (name, slug, description, community_type, category_id, is_official, metadata) VALUES

('Dragon Grand Prix Series', 'dragon-grand-prix-series',
 'The Dragon Grand Prix Series - premier racing circuit for Dragon Class sailors worldwide.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"boat_class": "Dragon", "event_type": "Grand Prix Series", "grade": 2}'),

-- 2025 Grand Prix Events (verified from IDA calendar)
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
 '{"year": 2025, "location": "Cannes, France", "boat_class": "Dragon", "event_type": "Grand Prix", "grade": 2, "dates": "Sep 23-27"}'),

-- Classic Grand Prix Venues (annual events)
('Dragon Grand Prix Cascais', 'dragon-grand-prix-cascais',
 'Annual Dragon Grand Prix in Cascais, Portugal. World-class racing on the Portuguese Riviera.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Cascais, Portugal", "boat_class": "Dragon", "event_type": "Grand Prix", "grade": 2}'),

('Dragon Grand Prix Douarnenez', 'dragon-grand-prix-douarnenez',
 'Annual Dragon Grand Prix in Douarnenez, Brittany, France.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Douarnenez, France", "boat_class": "Dragon", "event_type": "Grand Prix", "grade": 2}'),

('Dragon Grand Prix Medemblik', 'dragon-grand-prix-medemblik',
 'Annual Dragon Grand Prix in Medemblik, Netherlands.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Medemblik, Netherlands", "boat_class": "Dragon", "event_type": "Grand Prix", "grade": 2}'),

('Dragon Grand Prix Sanremo', 'dragon-grand-prix-sanremo',
 'Annual Dragon Grand Prix in Sanremo, Italy. Racing on the Italian Riviera.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Sanremo, Italy", "boat_class": "Dragon", "event_type": "Grand Prix", "grade": 2}'),

('Dragon Grand Prix Cannes', 'dragon-grand-prix-cannes',
 'Annual Dragon Grand Prix in Cannes, France. Home of the famous Régates Royales.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Cannes, France", "boat_class": "Dragon", "event_type": "Grand Prix", "grade": 2}'),

('Régates Royales Cannes Dragon', 'regates-royales-cannes-dragon',
 'The prestigious Régates Royales in Cannes - one of the most iconic Dragon regattas since 1929.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Cannes, France", "boat_class": "Dragon", "event_type": "Classic Regatta", "established": 1929}')

ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 4. DRAGON CLASS NATIONAL CHAMPIONSHIPS
-- Countries verified from IDA National Associations list
-- 31 countries with Class Associations, ~1300 registered boats
-- ============================================

INSERT INTO communities (name, slug, description, community_type, category_id, is_official, metadata) VALUES

-- Major Dragon Nations (by fleet size from IDA data)
-- Germany: 429 boats, UK: 110, France: 99, Netherlands: 94, Switzerland: 94, Hong Kong: 116

('German Dragon Championship', 'german-dragon-championship',
 'The German Dragon Championship (Deutsche Meisterschaft). Germany has the largest Dragon fleet in the world with 429+ boats.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Germany", "boat_class": "Dragon", "event_type": "National Championship", "fleet_size": 429}'),

('British Dragon Championship', 'british-dragon-championship',
 'The British Dragon Championship - annual national championship for UK Dragon sailors. Fleet of 110+ boats.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "United Kingdom", "boat_class": "Dragon", "event_type": "National Championship", "fleet_size": 110}'),

('Hong Kong Dragon Championship', 'hong-kong-dragon-championship',
 'The Hong Kong Dragon Championship - premier Dragon racing in Asia. Fleet of 116+ boats.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Hong Kong", "boat_class": "Dragon", "event_type": "National Championship", "fleet_size": 116}'),

('French Dragon Championship', 'french-dragon-championship',
 'The French Dragon Championship (Championnat de France). Fleet of 99+ boats.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "France", "boat_class": "Dragon", "event_type": "National Championship", "fleet_size": 99}'),

('Dutch Dragon Championship', 'dutch-dragon-championship',
 'The Dutch Dragon Championship (Nederlands Kampioenschap). Fleet of 94+ boats.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Netherlands", "boat_class": "Dragon", "event_type": "National Championship", "fleet_size": 94}'),

('Swiss Dragon Championship', 'swiss-dragon-championship',
 'The Swiss Dragon Championship on Lake Geneva and other Swiss waters. Fleet of 94+ boats.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Switzerland", "boat_class": "Dragon", "event_type": "National Championship", "fleet_size": 94}'),

-- Other European National Championships (verified IDA members)
('Austrian Dragon Championship', 'austrian-dragon-championship',
 'The Austrian Dragon Championship on Austrian lakes.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Austria", "boat_class": "Dragon", "event_type": "National Championship"}'),

('Belgian Dragon Championship', 'belgian-dragon-championship',
 'The Belgian Dragon Championship.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Belgium", "boat_class": "Dragon", "event_type": "National Championship"}'),

('Danish Dragon Championship', 'danish-dragon-championship',
 'The Danish Dragon Championship (Danmarksmesterskab).',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Denmark", "boat_class": "Dragon", "event_type": "National Championship"}'),

('Finnish Dragon Championship', 'finnish-dragon-championship',
 'The Finnish Dragon Championship (Suomen Mestaruus).',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Finland", "boat_class": "Dragon", "event_type": "National Championship"}'),

('Italian Dragon Championship', 'italian-dragon-championship',
 'The Italian Dragon Championship (Campionato Italiano).',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Italy", "boat_class": "Dragon", "event_type": "National Championship"}'),

('Norwegian Dragon Championship', 'norwegian-dragon-championship',
 'The Norwegian Dragon Championship (Norgesmesterskap).',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Norway", "boat_class": "Dragon", "event_type": "National Championship"}'),

('Portuguese Dragon Championship', 'portuguese-dragon-championship',
 'The Portuguese Dragon Championship (Campeonato de Portugal).',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Portugal", "boat_class": "Dragon", "event_type": "National Championship"}'),

('Spanish Dragon Championship', 'spanish-dragon-championship',
 'The Spanish Dragon Championship (Campeonato de España).',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Spain", "boat_class": "Dragon", "event_type": "National Championship"}'),

('Swedish Dragon Championship', 'swedish-dragon-championship',
 'The Swedish Dragon Championship (Svenska Mästerskapen).',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Sweden", "boat_class": "Dragon", "event_type": "National Championship"}'),

('Irish Dragon Championship', 'irish-dragon-championship',
 'The Irish Dragon Championship - annual national championship for Irish Dragon sailors.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Ireland", "boat_class": "Dragon", "event_type": "National Championship"}'),

('Greek Dragon Championship', 'greek-dragon-championship',
 'The Greek Dragon Championship.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Greece", "boat_class": "Dragon", "event_type": "National Championship"}'),

('Monaco Dragon Championship', 'monaco-dragon-championship',
 'The Monaco Dragon Championship - racing in the prestigious waters of Monte Carlo.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Monaco", "boat_class": "Dragon", "event_type": "National Championship"}'),

('Turkish Dragon Championship', 'turkish-dragon-championship',
 'The Turkish Dragon Championship.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Turkey", "boat_class": "Dragon", "event_type": "National Championship"}'),

('Russian Dragon Championship', 'russian-dragon-championship',
 'The Russian Dragon Championship.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Russia", "boat_class": "Dragon", "event_type": "National Championship"}'),

('Polish Dragon Championship', 'polish-dragon-championship',
 'The Polish Dragon Championship.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Poland", "boat_class": "Dragon", "event_type": "National Championship"}'),

-- Other Regions
('Australian Dragon Championship', 'australian-dragon-championship',
 'The Australian Dragon Championship.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Australia", "boat_class": "Dragon", "event_type": "National Championship"}'),

('Japanese Dragon Championship', 'japanese-dragon-championship',
 'The Japanese Dragon Championship.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Japan", "boat_class": "Dragon", "event_type": "National Championship"}'),

('US Dragon Championship', 'us-dragon-championship',
 'The United States Dragon Championship.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "United States", "boat_class": "Dragon", "event_type": "National Championship"}'),

('Canadian Dragon Championship', 'canadian-dragon-championship',
 'The Canadian Dragon Championship.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"country": "Canada", "boat_class": "Dragon", "event_type": "National Championship"}')

ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 5. DRAGON CLASS REGIONAL EVENTS
-- Major recurring regattas from IDA calendar
-- ============================================

INSERT INTO communities (name, slug, description, community_type, category_id, is_official, metadata) VALUES

-- UK Regional Events
('Edinburgh Cup Dragon', 'edinburgh-cup-dragon',
 'The Edinburgh Cup - one of the oldest and most prestigious Dragon trophies in British sailing.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "United Kingdom", "boat_class": "Dragon", "event_type": "Classic Trophy"}'),

('South Coast Dragon Championship', 'south-coast-dragon-championship',
 'South Coast Dragon Championship - racing along the English south coast.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "South Coast, UK", "boat_class": "Dragon", "event_type": "Regional Championship"}'),

('East Coast Dragon Championship', 'east-coast-dragon-championship',
 'East Coast Dragon Championship - racing on the UK east coast.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "East Coast, UK", "boat_class": "Dragon", "event_type": "Regional Championship"}'),

-- German Events (from IDA calendar)
('Travemünder Woche Dragon', 'travemuender-woche-dragon',
 'Dragon Class racing at Travemünder Woche - one of the largest sailing events in the world.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Travemünde, Germany", "boat_class": "Dragon", "event_type": "Regatta"}'),

('Kieler Woche Dragon', 'kieler-woche-dragon',
 'Dragon Class racing at Kieler Woche - the world''s largest sailing event.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Kiel, Germany", "boat_class": "Dragon", "event_type": "Regatta"}'),

('Warnemünder Woche Dragon', 'warnemuender-woche-dragon',
 'Dragon Class racing at Warnemünder Woche.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Warnemünde, Germany", "boat_class": "Dragon", "event_type": "Regatta"}'),

-- French Events
('Dragon Deauville Week', 'dragon-deauville-week',
 'Dragon Week in Deauville - classic racing in Normandy.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Deauville, France", "boat_class": "Dragon", "event_type": "Regatta"}'),

-- Scandinavian Events
('Sandhamn Regatta Dragon', 'sandhamn-regatta-dragon',
 'Dragon Class racing at the classic Sandhamn Regatta in the Stockholm archipelago.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Sandhamn, Sweden", "boat_class": "Dragon", "event_type": "Regatta"}'),

-- Mediterranean Events
('Palma Vela Dragon', 'palma-vela-dragon',
 'Dragon Class at PalmaVela - spring racing in Mallorca.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Palma de Mallorca, Spain", "boat_class": "Dragon", "event_type": "Regatta"}'),

('Copa del Rey Dragon', 'copa-del-rey-dragon',
 'Dragon Class at Copa del Rey in Palma - one of the most prestigious Mediterranean regattas.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Palma de Mallorca, Spain", "boat_class": "Dragon", "event_type": "Regatta"}'),

-- Switzerland
('Bol d''Or Dragon', 'bol-dor-dragon',
 'Dragon Class at Bol d''Or - the famous Lake Geneva regatta.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Lake Geneva, Switzerland", "boat_class": "Dragon", "event_type": "Regatta"}'),

-- Hong Kong & Asia Events
('Hong Kong Dragon Open', 'hong-kong-dragon-open',
 'Hong Kong Dragon Open - premier Dragon racing in Asia.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Hong Kong", "boat_class": "Dragon", "event_type": "Open Championship"}'),

('Around the Island Race Hong Kong Dragon', 'around-island-race-hk-dragon',
 'Dragon Class at the Around the Island Race in Hong Kong.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Hong Kong", "boat_class": "Dragon", "event_type": "Distance Race"}'),

('China Coast Regatta Dragon', 'china-coast-regatta-dragon',
 'Dragon Class at the China Coast Regatta.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Hong Kong", "boat_class": "Dragon", "event_type": "Regatta"}')

ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 6. DRAGON CLASS YACHT CLUBS & FLEETS
-- Verified active Dragon fleets from IDA
-- ============================================

INSERT INTO communities (name, slug, description, community_type, category_id, metadata) VALUES

-- UK Dragon Clubs (strong Dragon presence)
('Royal Corinthian Yacht Club Dragons', 'rcyc-dragons',
 'Dragon fleet at the Royal Corinthian Yacht Club, Burnham-on-Crouch - one of the strongest Dragon fleets in the UK.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Royal Corinthian Yacht Club", "location": "Burnham-on-Crouch, UK", "fleet": "Dragon"}'),

('Royal Yacht Squadron Dragons', 'rys-dragons',
 'Dragon fleet at the Royal Yacht Squadron, Cowes - the most prestigious yacht club in the world.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Royal Yacht Squadron", "location": "Cowes, UK", "fleet": "Dragon"}'),

('Aldeburgh Yacht Club Dragons', 'ayc-dragons',
 'Dragon fleet at Aldeburgh Yacht Club - active racing on the Suffolk coast.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Aldeburgh Yacht Club", "location": "Aldeburgh, UK", "fleet": "Dragon"}'),

('Royal Fowey Yacht Club Dragons', 'rfyc-dragons',
 'Dragon fleet at Royal Fowey Yacht Club, Cornwall.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Royal Fowey Yacht Club", "location": "Fowey, UK", "fleet": "Dragon"}'),

('Abersoch Sailing Club Dragons', 'abersoch-dragons',
 'Dragon fleet at Abersoch on the Llyn Peninsula, Wales.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "South Caernarvonshire Yacht Club", "location": "Abersoch, Wales", "fleet": "Dragon"}'),

('Royal St George Yacht Club Dragons', 'rsgyc-dragons',
 'Dragon fleet at Royal St George Yacht Club, Dún Laoghaire, Ireland.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Royal St George Yacht Club", "location": "Dún Laoghaire, Ireland", "fleet": "Dragon"}'),

-- German Dragon Clubs (largest Dragon nation)
('Norddeutscher Regatta Verein Dragons', 'nrv-dragons',
 'Dragon fleet at NRV Hamburg - one of Germany''s premier Dragon clubs.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Norddeutscher Regatta Verein", "location": "Hamburg, Germany", "fleet": "Dragon"}'),

('Kieler Yacht-Club Dragons', 'kyc-dragons',
 'Dragon fleet at Kieler Yacht-Club.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Kieler Yacht-Club", "location": "Kiel, Germany", "fleet": "Dragon"}'),

('Bayerischer Yacht-Club Dragons', 'byc-dragons',
 'Dragon fleet at Bayerischer Yacht-Club on Starnberger See.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Bayerischer Yacht-Club", "location": "Starnberg, Germany", "fleet": "Dragon"}'),

('Flensburger Segel-Club Dragons', 'fsc-dragons',
 'Dragon fleet at Flensburger Segel-Club.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Flensburger Segel-Club", "location": "Flensburg, Germany", "fleet": "Dragon"}'),

('Yacht-Club Langenargen Dragons', 'ycl-dragons',
 'Dragon fleet at Yacht-Club Langenargen on Lake Constance.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Yacht-Club Langenargen", "location": "Lake Constance, Germany", "fleet": "Dragon"}'),

-- Scandinavian Dragon Clubs
('Kongelig Dansk Yachtklub Dragons', 'kdy-dragons',
 'Dragon fleet at the Royal Danish Yacht Club.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Kongelig Dansk Yachtklub", "location": "Copenhagen, Denmark", "fleet": "Dragon"}'),

('Kungliga Svenska Segelsällskapet Dragons', 'ksss-dragons',
 'Dragon fleet at the Royal Swedish Yacht Club.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Kungliga Svenska Segelsällskapet", "location": "Stockholm, Sweden", "fleet": "Dragon"}'),

('Göteborgs Kungliga Segelsällskap Dragons', 'gkss-dragons',
 'Dragon fleet at GKSS Gothenburg.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Göteborgs Kungliga Segelsällskap", "location": "Gothenburg, Sweden", "fleet": "Dragon"}'),

('Skanör-Falsterbo Segelsällskap Dragons', 'sfss-dragons',
 'Dragon fleet at Skanör-Falsterbo - venue for the annual Grand Prix.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Skanör-Falsterbo SS", "location": "Skanör, Sweden", "fleet": "Dragon"}'),

('Kongelig Norsk Seilforening Dragons', 'kns-dragons',
 'Dragon fleet at the Royal Norwegian Yacht Club.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Kongelig Norsk Seilforening", "location": "Oslo, Norway", "fleet": "Dragon"}'),

('Nyländska Jaktklubben Dragons', 'njk-dragons',
 'Dragon fleet at NJK Helsinki - will host 2026 European Championship.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Nyländska Jaktklubben", "location": "Helsinki, Finland", "fleet": "Dragon"}'),

-- Dutch Dragon Clubs
('Koninklijke Nederlandsche Zeil en Roei Vereeniging Dragons', 'knzrv-dragons',
 'Dragon fleet at the Royal Netherlands Yacht Club.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "KNZ&RV", "location": "Muiden, Netherlands", "fleet": "Dragon"}'),

('Watersportvereniging Bruinisse Dragons', 'wvb-dragons',
 'Dragon fleet at Bruinisse, one of the strongest Dutch Dragon locations.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "WV Bruinisse", "location": "Bruinisse, Netherlands", "fleet": "Dragon"}'),

-- Belgian Dragon Clubs
('Royal Belgian Sailing Club Dragons', 'rbsc-dragons',
 'Dragon fleet at the Royal Belgian Sailing Club.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Royal Belgian Sailing Club", "location": "Ostend, Belgium", "fleet": "Dragon"}'),

-- French Dragon Clubs
('Yacht Club de France Dragons', 'ycf-dragons',
 'Dragon fleet at the prestigious Yacht Club de France.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Yacht Club de France", "location": "Paris, France", "fleet": "Dragon"}'),

('Yacht Club de Cannes Dragons', 'ycc-dragons',
 'Dragon fleet at Yacht Club de Cannes - host of the famous Régates Royales.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Yacht Club de Cannes", "location": "Cannes, France", "fleet": "Dragon"}'),

('Yacht Club de Douarnenez Dragons', 'ycd-dragons',
 'Dragon fleet at Yacht Club de Douarnenez, Brittany - host of Gold Cup 2025.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Yacht Club de Douarnenez", "location": "Douarnenez, France", "fleet": "Dragon"}'),

-- Mediterranean Dragon Clubs
('Yacht Club Italiano Dragons', 'yci-dragons',
 'Dragon fleet at Yacht Club Italiano, Genoa.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Yacht Club Italiano", "location": "Genoa, Italy", "fleet": "Dragon"}'),

('Yacht Club Sanremo Dragons', 'ycs-dragons',
 'Dragon fleet at Yacht Club Sanremo.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Yacht Club Sanremo", "location": "Sanremo, Italy", "fleet": "Dragon"}'),

('Real Club Náutico de Palma Dragons', 'rcnp-dragons',
 'Dragon fleet at the Royal Yacht Club of Palma - host of Gold Cup 2026.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Real Club Náutico de Palma", "location": "Puerto Portals, Mallorca", "fleet": "Dragon"}'),

('Yacht Club de Monaco Dragons', 'ycm-dragons',
 'Dragon fleet at the prestigious Yacht Club de Monaco.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Yacht Club de Monaco", "location": "Monaco", "fleet": "Dragon"}'),

('Clube Naval de Cascais Dragons', 'cnc-dragons',
 'Dragon fleet at Clube Naval de Cascais, Portugal - host of World Championship 2025.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Clube Naval de Cascais", "location": "Cascais, Portugal", "fleet": "Dragon"}'),

('Vilamoura Sailing Dragons', 'vilamoura-dragons',
 'Dragon fleet at Vilamoura, Portugal - host of World Championship 2025.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Vilamoura Sailing", "location": "Vilamoura, Portugal", "fleet": "Dragon"}'),

('Hellenic Offshore Racing Club Dragons', 'horc-dragons',
 'Dragon fleet at HORC, Athens.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Hellenic Offshore Racing Club", "location": "Athens, Greece", "fleet": "Dragon"}'),

-- Swiss Dragon Clubs
('Société Nautique de Genève Dragons', 'sng-dragons',
 'Dragon fleet at Société Nautique de Genève on Lake Geneva.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Société Nautique de Genève", "location": "Geneva, Switzerland", "fleet": "Dragon"}'),

-- Austrian Dragon Clubs
('Union Yacht Club Attersee Dragons', 'uyca-dragons',
 'Dragon fleet at Attersee - venue for annual Grand Prix.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Union Yacht Club Attersee", "location": "Attersee, Austria", "fleet": "Dragon"}'),

-- Hong Kong Dragon Clubs (strong Asian fleet)
('Royal Hong Kong Yacht Club Dragons', 'rhkyc-dragons',
 'Dragon fleet at the Royal Hong Kong Yacht Club - the heart of Asian Dragon sailing with 116+ boats. Host of 2026 Asia Pacific Cup and 2027 Worlds.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Royal Hong Kong Yacht Club", "location": "Hong Kong", "fleet": "Dragon", "fleet_size": 116}'),

('Aberdeen Boat Club Dragons', 'abc-dragons',
 'Dragon fleet at Aberdeen Boat Club, Hong Kong.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Aberdeen Boat Club", "location": "Hong Kong", "fleet": "Dragon"}'),

-- Australian Dragon Clubs
('Royal Sydney Yacht Squadron Dragons', 'rsys-dragons',
 'Dragon fleet at Royal Sydney Yacht Squadron.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Royal Sydney Yacht Squadron", "location": "Sydney, Australia", "fleet": "Dragon"}'),

('Royal Brighton Yacht Club Dragons', 'rbyc-dragons',
 'Dragon fleet at Royal Brighton Yacht Club, Melbourne.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Royal Brighton Yacht Club", "location": "Melbourne, Australia", "fleet": "Dragon"}'),

-- Russian Dragon Clubs
('Yacht Club of Saint Petersburg Dragons', 'ycsp-dragons',
 'Dragon fleet at Yacht Club of Saint Petersburg.',
 'venue', (SELECT id FROM community_categories WHERE name = 'locations'),
 '{"club": "Yacht Club of Saint Petersburg", "location": "St. Petersburg, Russia", "fleet": "Dragon"}')

ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 7. MAJOR INTERNATIONAL REGATTAS (NON-DRAGON)
-- ============================================

INSERT INTO communities (name, slug, description, community_type, category_id, is_official, metadata) VALUES

-- Classic Ocean Races
('Newport Bermuda Race', 'newport-bermuda-race',
 'The Newport Bermuda Race - one of the oldest regularly scheduled ocean races. Biennial 635nm race from Newport, RI to Bermuda.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"distance": "635nm", "type": "Ocean Race", "frequency": "Biennial", "start": "Newport, RI", "finish": "Bermuda"}'),

('Rolex Fastnet Race', 'rolex-fastnet-race',
 'The Rolex Fastnet Race - one of the classic offshore races. 695nm from Cowes around Fastnet Rock to Cherbourg.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"distance": "695nm", "type": "Ocean Race", "frequency": "Biennial"}'),

('Rolex Sydney Hobart', 'rolex-sydney-hobart',
 'The Rolex Sydney Hobart Yacht Race - Australia''s premier offshore race. 628nm from Sydney to Hobart.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"distance": "628nm", "type": "Ocean Race", "frequency": "Annual"}'),

('Rolex Middle Sea Race', 'rolex-middle-sea-race',
 'The Rolex Middle Sea Race - 606nm race from Malta around Sicily and back.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"distance": "606nm", "type": "Ocean Race", "location": "Mediterranean"}'),

('Transpac', 'transpac-race',
 'The Transpac - Los Angeles to Honolulu yacht race. 2,225nm across the Pacific.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"distance": "2225nm", "type": "Ocean Race", "start": "Los Angeles", "finish": "Honolulu"}'),

('Chicago Mackinac Race', 'chicago-mackinac-race',
 'The Chicago Yacht Club Race to Mackinac - one of the longest freshwater races in the world.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"distance": "333nm", "type": "Lake Race", "location": "Lake Michigan"}'),

-- Major Race Weeks
('Charleston Race Week', 'charleston-race-week',
 'Charleston Race Week - one of the largest keelboat regattas in North America. Racing in Charleston Harbor.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Charleston, SC", "type": "Race Week"}'),

('Key West Race Week', 'key-west-race-week',
 'Key West Race Week - premier winter racing event in the Florida Keys.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Key West, FL", "type": "Race Week"}'),

('Cowes Week', 'cowes-week',
 'Cowes Week - the oldest and largest annual sailing regatta in the world.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Cowes, UK", "type": "Race Week", "established": 1826}'),

('Antigua Sailing Week', 'antigua-sailing-week',
 'Antigua Sailing Week - one of the Caribbean''s top regattas.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Antigua", "type": "Race Week", "region": "Caribbean"}'),

('Block Island Race Week', 'block-island-race-week',
 'Block Island Race Week - premier New England sailing event.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"location": "Block Island, RI", "type": "Race Week"}'),

-- Professional Racing
('SailGP', 'sailgp',
 'SailGP - the world''s most exciting racing on water. F50 foiling catamarans.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"type": "Professional Circuit", "boat": "F50 Foiling Catamaran"}'),

('The Ocean Race', 'the-ocean-race',
 'The Ocean Race (formerly Volvo Ocean Race) - the ultimate ocean racing challenge around the world.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"type": "Round the World Race", "professional": true}'),

('America''s Cup', 'americas-cup',
 'The America''s Cup - the oldest trophy in international sport. Discuss the latest teams, technology, and racing.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"type": "Match Racing", "established": 1851}'),

('Vendée Globe', 'vendee-globe',
 'Vendée Globe - the ultimate solo non-stop around the world race.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"type": "Solo Round the World", "non_stop": true}'),

('Route du Rhum', 'route-du-rhum',
 'Route du Rhum - transatlantic single-handed race from Saint-Malo to Guadeloupe.',
 'race', (SELECT id FROM community_categories WHERE name = 'events'), true,
 '{"type": "Transatlantic", "solo": true}')

ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 8. INTERNATIONAL DRAGON CLASS ASSOCIATION
-- Official governing body and national associations
-- ============================================

INSERT INTO communities (name, slug, description, community_type, category_id, is_official, metadata) VALUES

('International Dragon Class', 'international-dragon-class',
 'Official community of the International Dragon Class Association. News, rules, events, and global Dragon sailing discussion. 31 countries, ~1,300 registered boats.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"website": "https://internationaldragonsailing.net", "founded": 1929, "olympic_years": "1948-1972", "countries": 31, "boats": 1300}'),

('British Dragon Association', 'british-dragon-association',
 'British Dragon Association - the national Dragon Class organization for the UK. Fleet of 110+ boats.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "United Kingdom", "parent_organization": "International Dragon Class", "fleet_size": 110}'),

('German Dragon Association', 'german-dragon-association',
 'German Dragon Association (Deutsche Drachen Klassenvereinigung). Largest Dragon fleet in the world with 429+ boats.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Germany", "parent_organization": "International Dragon Class", "fleet_size": 429}'),

('French Dragon Association', 'french-dragon-association',
 'French Dragon Association (Association Française du Dragon). Fleet of 99+ boats.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "France", "parent_organization": "International Dragon Class", "fleet_size": 99}'),

('Dutch Dragon Association', 'dutch-dragon-association',
 'Dutch Dragon Association (Nederlandse Draken Klassenorganisatie). Fleet of 94+ boats.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Netherlands", "parent_organization": "International Dragon Class", "fleet_size": 94}'),

('Swiss Dragon Association', 'swiss-dragon-association',
 'Swiss Dragon Association. Fleet of 94+ boats on Swiss lakes.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Switzerland", "parent_organization": "International Dragon Class", "fleet_size": 94}'),

('Hong Kong Dragon Association', 'hong-kong-dragon-association',
 'Hong Kong Dragon Association - the home of Asian Dragon sailing. Fleet of 116+ boats. Host of 2027 World Championship.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Hong Kong", "region": "Asia Pacific", "parent_organization": "International Dragon Class", "fleet_size": 116}'),

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
