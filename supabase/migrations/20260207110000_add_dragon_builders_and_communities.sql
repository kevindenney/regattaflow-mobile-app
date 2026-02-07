-- ============================================
-- Add Dragon Class boat builders, missing national
-- associations, and additional yacht club communities
-- ============================================

-- NOTE: 'boat_builder' enum value added in 20260207105900_add_boat_builder_enum.sql

-- 1. ADD 'Boat Builders' CATEGORY
-- ============================================
INSERT INTO community_categories (name, display_name, description, icon, color, sort_order) VALUES
  ('boat_builders', 'Boat Builders', 'Boat builders and manufacturers', 'hammer-outline', '#8B5CF6', 8)
ON CONFLICT (name) DO NOTHING;

-- 3. DRAGON CLASS BOAT BUILDERS (Active)
-- ============================================
INSERT INTO communities (name, slug, description, community_type, category_id, is_official, metadata) VALUES

('Petticrows', 'petticrows',
 'Petticrows - the leading Dragon builder with 800+ boats built. Founded in Burnham-on-Crouch, now based in Cascais, Portugal. Led by Tim Tavinor.',
 'boat_builder', (SELECT id FROM community_categories WHERE name = 'boat_builders'), true,
 '{"location": "Cascais, Portugal", "founded_location": "Burnham-on-Crouch, UK", "boats_built": 800, "website": "https://petticrows.com", "boat_class": "Dragon", "status": "active"}'),

('Doomernik Dragons', 'doomernik-dragons',
 'Doomernik Yachts - the only Dragon builder in the Netherlands. Founded 1990 by Joop Doomernik in Zaltbommel. Dragons sold worldwide.',
 'boat_builder', (SELECT id FROM community_categories WHERE name = 'boat_builders'), true,
 '{"location": "Zaltbommel, Netherlands", "founded": 1990, "website": "https://www.doomernikyachts.com", "boat_class": "Dragon", "status": "active"}'),

('Børresen Bådebyggeri', 'borresen-badebyggeri',
 'BB Sailing / Børresen Bådebyggeri - Danish Dragon builder since 1935. 760+ Dragons built (wood and GRP). Pioneered fiberglass Dragon construction in 1971-72.',
 'boat_builder', (SELECT id FROM community_categories WHERE name = 'boat_builders'), true,
 '{"location": "Vejle, Denmark", "founded": 1935, "boats_built": 760, "website": "http://www.borresen.com", "boat_class": "Dragon", "status": "active"}'),

('Bootswerft Glas', 'bootswerft-glas',
 'Bootswerft Markus Glas - Bavarian Dragon builder since 1924. 200+ Dragons built. Markus Wolfgang Glas won 1x Worlds, 5x Europeans, 12x German Championship.',
 'boat_builder', (SELECT id FROM community_categories WHERE name = 'boat_builders'), true,
 '{"location": "Possenhofen, Bavaria, Germany", "founded": 1924, "boats_built": 200, "website": "https://www.bootswerft-glas.de", "boat_class": "Dragon", "status": "active"}'),

('Premier Composite Technologies', 'premier-composite-technologies',
 'PCT Dragon - Premier Composite Technologies, Dubai. Launched the Premier Dragon after 2-year R&D with designers Klaus Roeder and Andy Claughton.',
 'boat_builder', (SELECT id FROM community_categories WHERE name = 'boat_builders'), true,
 '{"location": "Dubai, UAE", "founded": 2006, "website": "https://www.pct.ae", "boat_class": "Dragon", "status": "active"}'),

('Royal Dragon / Vejle Yacht Services', 'royal-dragon-vejle',
 'Royal Dragon by Vejle Yacht Services - Danish Dragon builder led by Thomas Egeskov. World Sailing licensed builder.',
 'boat_builder', (SELECT id FROM community_categories WHERE name = 'boat_builders'), true,
 '{"location": "Vejle, Denmark", "website": "https://vys.dk", "boat_class": "Dragon", "status": "active"}'),

('Ridgeway Dragons', 'ridgeway-dragons',
 'Ridgeway Dragons / Pinnacle Yachts - licensed Dragon builder based in Tasmania, Australia.',
 'boat_builder', (SELECT id FROM community_categories WHERE name = 'boat_builders'), true,
 '{"location": "Tasmania, Australia", "boat_class": "Dragon", "status": "active"}')

ON CONFLICT (slug) DO NOTHING;

-- 4. HISTORICAL / NOTABLE DRAGON BUILDERS
-- ============================================
INSERT INTO communities (name, slug, description, community_type, category_id, is_official, metadata) VALUES

('Chang Boats Hong Kong', 'chang-boats-hong-kong',
 'Chang Boats - Hong Kong Dragon builder active 1985-1995. Built 31 Dragons for the Asian fleet.',
 'boat_builder', (SELECT id FROM community_categories WHERE name = 'boat_builders'), false,
 '{"location": "Hong Kong", "years_active": "1985-1995", "boats_built": 31, "boat_class": "Dragon", "status": "historical"}'),

('Abeking & Rasmussen Dragons', 'abeking-rasmussen-dragons',
 'Abeking & Rasmussen - legendary German shipyard that built 148 Dragons from 1934-1971.',
 'boat_builder', (SELECT id FROM community_categories WHERE name = 'boat_builders'), false,
 '{"location": "Lemwerder, Germany", "years_active": "1934-1971", "boats_built": 148, "boat_class": "Dragon", "status": "historical"}'),

('Bonnin Dragons', 'bonnin-dragons',
 'Bonnin - French Dragon builder in Arcachon. Built 74 Dragons from 1950-1968.',
 'boat_builder', (SELECT id FROM community_categories WHERE name = 'boat_builders'), false,
 '{"location": "Arcachon, France", "years_active": "1950-1968", "boats_built": 74, "boat_class": "Dragon", "status": "historical"}'),

('Bjarne Aas Dragons', 'bjarne-aas-dragons',
 'Bjarne Aas - Norwegian Dragon builder in Fredrikstad. Built 62 Dragons from 1939-1968.',
 'boat_builder', (SELECT id FROM community_categories WHERE name = 'boat_builders'), false,
 '{"location": "Fredrikstad, Norway", "years_active": "1939-1968", "boats_built": 62, "boat_class": "Dragon", "status": "historical"}'),

('Pedersen & Thuesen Dragons', 'pedersen-thuesen-dragons',
 'Pedersen & Thuesen - Danish Dragon builder. Built 62 Dragons from 1952-1970.',
 'boat_builder', (SELECT id FROM community_categories WHERE name = 'boat_builders'), false,
 '{"location": "Bramdrupdam, Denmark", "years_active": "1952-1970", "boats_built": 62, "boat_class": "Dragon", "status": "historical"}'),

('Wirz Dragons', 'wirz-dragons',
 'Wirz - Swiss Dragon builder on Lake Constance. Built 69 Dragons from 1961-1983.',
 'boat_builder', (SELECT id FROM community_categories WHERE name = 'boat_builders'), false,
 '{"location": "Steinach, Switzerland", "years_active": "1961-1983", "boats_built": 69, "boat_class": "Dragon", "status": "historical"}'),

('Anker & Jensen Dragons', 'anker-jensen-dragons',
 'Anker & Jensen - Norwegian Dragon builder in Vollen. Built 69 Dragons from 1930-1953 including the very first Dragons.',
 'boat_builder', (SELECT id FROM community_categories WHERE name = 'boat_builders'), false,
 '{"location": "Vollen, Norway", "years_active": "1930-1953", "boats_built": 69, "boat_class": "Dragon", "status": "historical"}'),

('McGruer Dragons', 'mcgruer-dragons',
 'McGruer & Co - Scottish Dragon builder in Clynder. Built 46 Dragons from 1936-1951.',
 'boat_builder', (SELECT id FROM community_categories WHERE name = 'boat_builders'), false,
 '{"location": "Clynder, Scotland", "years_active": "1936-1951", "boats_built": 46, "boat_class": "Dragon", "status": "historical"}'),

('St. Georges Dragons', 'st-georges-dragons',
 'St. Georges - UK Dragon builder in Aldeburgh. Built 45 Dragons from 1978-1994.',
 'boat_builder', (SELECT id FROM community_categories WHERE name = 'boat_builders'), false,
 '{"location": "Aldeburgh, UK", "years_active": "1978-1994", "boats_built": 45, "boat_class": "Dragon", "status": "historical"}'),

('Van de Stadt Dragons', 'van-de-stadt-dragons',
 'Van de Stadt - Dutch Dragon builder in Zaandam. Built 35 Dragons from 1935-1961.',
 'boat_builder', (SELECT id FROM community_categories WHERE name = 'boat_builders'), false,
 '{"location": "Zaandam, Netherlands", "years_active": "1935-1961", "boats_built": 35, "boat_class": "Dragon", "status": "historical"}')

ON CONFLICT (slug) DO NOTHING;

-- 5. MISSING NATIONAL DRAGON ASSOCIATIONS
-- ============================================
INSERT INTO communities (name, slug, description, community_type, category_id, is_official, metadata) VALUES

('North American Dragon Association', 'north-american-dragon-association',
 'North American Dragon Association - representing Dragon sailors in the USA and Canada.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"region": "North America", "countries": ["United States", "Canada"], "parent_organization": "International Dragon Class", "website": "https://nadragons.org"}'),

('Estonian Dragon Association', 'estonian-dragon-association',
 'Estonian Dragon Association. Host of 2024 European Championship in Pärnu.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Estonia", "parent_organization": "International Dragon Class"}'),

('Monaco Dragon Association', 'monaco-dragon-association',
 'Monaco Dragon Association - racing in the prestigious waters of Monte Carlo.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Monaco", "parent_organization": "International Dragon Class"}'),

('Hungarian Dragon Association', 'hungarian-dragon-association',
 'Hungarian Dragon Association.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Hungary", "parent_organization": "International Dragon Class"}'),

('UAE Dragon Association', 'uae-dragon-association',
 'UAE Dragon Association - Dragon sailing in the United Arab Emirates.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "United Arab Emirates", "parent_organization": "International Dragon Class"}'),

('Antiguan Dragon Association', 'antiguan-dragon-association',
 'Antiguan Dragon Association - Caribbean Dragon sailing.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Antigua and Barbuda", "parent_organization": "International Dragon Class"}'),

('Sri Lanka Dragon Association', 'sri-lanka-dragon-association',
 'Sri Lanka Dragon Association.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Sri Lanka", "parent_organization": "International Dragon Class"}'),

('Canadian Dragon Association', 'canadian-dragon-association',
 'Canadian Dragon Association - Dragon sailing across Canada.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'), true,
 '{"country": "Canada", "parent_organization": "International Dragon Class"}')

ON CONFLICT (slug) DO NOTHING;

-- 6. ADDITIONAL YACHT CLUB DRAGON FLEETS
-- ============================================
INSERT INTO communities (name, slug, description, community_type, category_id, metadata) VALUES

-- UK & Ireland
('Royal Burnham Yacht Club Dragons', 'rbyc-burnham-dragons',
 'Dragon fleet at Royal Burnham Yacht Club, Essex.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'),
 '{"club": "Royal Burnham Yacht Club", "location": "Burnham-on-Crouch, UK", "fleet": "Dragon"}'),

('Medway Yacht Club Dragons', 'myc-dragons',
 'Dragon fleet at Medway Yacht Club, Kent.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'),
 '{"club": "Medway Yacht Club", "location": "Medway, Kent, UK", "fleet": "Dragon"}'),

('Royal Torbay Yacht Club Dragons', 'rtyc-dragons',
 'Dragon fleet at Royal Torbay Yacht Club, Torquay.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'),
 '{"club": "Royal Torbay Yacht Club", "location": "Torquay, UK", "fleet": "Dragon"}'),

('Royal Forth Yacht Club Dragons', 'rfyc-forth-dragons',
 'Dragon fleet at Royal Forth Yacht Club, Edinburgh.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'),
 '{"club": "Royal Forth Yacht Club", "location": "Edinburgh, Scotland", "fleet": "Dragon"}'),

('National Yacht Club Dragons', 'nyc-dun-laoghaire-dragons',
 'Dragon fleet at National Yacht Club, Dún Laoghaire, Ireland.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'),
 '{"club": "National Yacht Club", "location": "Dún Laoghaire, Ireland", "fleet": "Dragon"}'),

('Kinsale Yacht Club Dragons', 'kyc-kinsale-dragons',
 'Dragon fleet at Kinsale Yacht Club, Co Cork, Ireland.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'),
 '{"club": "Kinsale Yacht Club", "location": "Kinsale, Ireland", "fleet": "Dragon"}'),

-- France
('Cercle de la Voile d''Arcachon Dragons', 'cva-dragons',
 'Dragon fleet at Cercle de la Voile d''Arcachon, Brittany.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'),
 '{"club": "Cercle de la Voile d''Arcachon", "location": "Arcachon, France", "fleet": "Dragon"}'),

-- Scandinavia
('Hornbæk Sejlklub Dragons', 'hornbaek-dragons',
 'Dragon fleet at Hornbæk Sejlklub, Denmark.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'),
 '{"club": "Hornbæk Sejlklub", "location": "Hornbæk, Denmark", "fleet": "Dragon"}'),

('Hellerup Sejlklub Dragons', 'hellerup-dragons',
 'Dragon fleet at Hellerup Sejlklub, Denmark.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'),
 '{"club": "Hellerup Sejlklub", "location": "Hellerup, Denmark", "fleet": "Dragon"}'),

('Pärnu Yacht Club Dragons', 'parnu-dragons',
 'Dragon fleet at Pärnu Yacht Club, Estonia. Host of 2024 European Championship.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'),
 '{"club": "Pärnu Yacht Club", "location": "Pärnu, Estonia", "fleet": "Dragon"}'),

-- Australia & Pacific
('Royal Freshwater Bay Yacht Club Dragons', 'rfbyc-dragons',
 'Dragon fleet at Royal Freshwater Bay Yacht Club, Perth.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'),
 '{"club": "Royal Freshwater Bay Yacht Club", "location": "Perth, Australia", "fleet": "Dragon"}'),

('Royal Geelong Yacht Club Dragons', 'rgyc-dragons',
 'Dragon fleet at Royal Geelong Yacht Club, Victoria.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'),
 '{"club": "Royal Geelong Yacht Club", "location": "Geelong, Australia", "fleet": "Dragon"}'),

-- Canada
('Royal Vancouver Yacht Club Dragons', 'rvyc-dragons',
 'Dragon fleet at Royal Vancouver Yacht Club.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'),
 '{"club": "Royal Vancouver Yacht Club", "location": "Vancouver, Canada", "fleet": "Dragon"}'),

('Royal Canadian Yacht Club Dragons', 'rcyc-toronto-dragons',
 'Dragon fleet at Royal Canadian Yacht Club, Toronto.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'),
 '{"club": "Royal Canadian Yacht Club", "location": "Toronto, Canada", "fleet": "Dragon"}'),

-- Japan
('Kansai Yacht Club Dragons', 'kansai-yc-dragons',
 'Dragon fleet at Kansai Yacht Club, Kobe, Japan.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'),
 '{"club": "Kansai Yacht Club", "location": "Kobe, Japan", "fleet": "Dragon"}'),

('Lake Biwa Dragon Fleet', 'lake-biwa-dragons',
 'Dragon fleet on Lake Biwa, Japan. Home of the Biwako Dragon Invitation.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'),
 '{"club": "Lake Biwa Sunset Yacht Club", "location": "Moriyama City, Japan", "fleet": "Dragon"}'),

-- Caribbean
('Antigua Yacht Club Dragons', 'antigua-yc-dragons',
 'Dragon fleet at Antigua Yacht Club, Falmouth Harbour.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'),
 '{"club": "Antigua Yacht Club", "location": "Falmouth Harbour, Antigua", "fleet": "Dragon"}'),

-- Portugal & Spain
('Club de Regatas Puerto Portals Dragons', 'crpp-dragons',
 'Dragon fleet at Club de Regatas Puerto Portals, Mallorca. Host of Gold Cup 2026.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'),
 '{"club": "Club de Regatas Puerto Portals", "location": "Puerto Portals, Mallorca", "fleet": "Dragon"}'),

-- Germany
('Hamburger Segel-Club Dragons', 'hsc-dragons',
 'Dragon fleet at Hamburger Segel-Club.',
 'boat_class', (SELECT id FROM community_categories WHERE name = 'boat_classes'),
 '{"club": "Hamburger Segel-Club", "location": "Hamburg, Germany", "fleet": "Dragon"}')

ON CONFLICT (slug) DO NOTHING;

-- 7. DRAGON SAILMAKERS (Dragon-specific)
-- ============================================
INSERT INTO communities (name, slug, description, community_type, category_id, is_official, metadata) VALUES

('FRITZ Sails Dragons', 'fritz-sails-dragons',
 'FRITZ Sails - German sailmaker specializing in Dragon Class sails.',
 'sailmaker', (SELECT id FROM community_categories WHERE name = 'sailmakers'), true,
 '{"location": "Germany", "boat_class": "Dragon", "website": "https://www.fritzsails.com"}'),

('WB Sails Dragons', 'wb-sails-dragons',
 'WB Sails Finland - sailmaker with strong Dragon Class program.',
 'sailmaker', (SELECT id FROM community_categories WHERE name = 'sailmakers'), true,
 '{"location": "Finland", "boat_class": "Dragon", "website": "https://www.wb-sails.fi"}'),

('Hoj Jensen Design Sails', 'hoj-jensen-design-sails',
 'Hoj Jensen Design Sails - sails designed by Poul Richard Høj-Jensen, double Olympic gold medalist and Dragon legend.',
 'sailmaker', (SELECT id FROM community_categories WHERE name = 'sailmakers'), true,
 '{"location": "Denmark", "boat_class": "Dragon"}')

ON CONFLICT (slug) DO NOTHING;
