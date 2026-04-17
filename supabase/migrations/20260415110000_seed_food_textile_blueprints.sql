-- Expand org interest_slug constraint for food-processing and textile-weaving
ALTER TABLE organizations DROP CONSTRAINT organizations_interest_slug_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_interest_slug_check
  CHECK (interest_slug = ANY (ARRAY[
    'general', 'nursing', 'sail-racing', 'drawing', 'design',
    'fitness', 'health-and-fitness', 'knitting', 'fiber-arts',
    'painting-printing', 'lifelong-learning', 'regenerative-agriculture',
    'global-health', 'self-mastery', 'lac-craft-business',
    'food-processing', 'textile-weaving'
  ]));

-- Create orgs for food-processing and textile-weaving under PRADAN umbrella
INSERT INTO organizations (id, name, slug, interest_slug, is_active)
VALUES
  ('a1b2c3d4-1111-4000-8000-000000000001', 'PRADAN — Ranchi Food Hub', 'pradan-ranchi-food', 'food-processing', true),
  ('a1b2c3d4-2222-4000-8000-000000000002', 'PRADAN — Hazaribagh Textiles', 'pradan-hazaribagh-textiles', 'textile-weaving', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- FOOD PROCESSING blueprints (total beginners, no business yet)
-- Author: Suman Tirkey (fe401f10-7298-4d46-921b-fed3df41398e)
-- Interest: food-processing (bbcd1321-d840-4f00-9653-d01eb9cf17d3)
-- Org: pradan-ranchi-food (a1b2c3d4-1111-4000-8000-000000000001)
-- ============================================================

-- Blueprint 1: Starting a Puffed Rice (Murmura) Business from Home
INSERT INTO timeline_blueprints (id, user_id, interest_id, organization_id, slug, title, description, is_published, subscriber_count, access_level)
VALUES (
  'b1000001-0001-4000-8000-000000000001',
  'fe401f10-7298-4d46-921b-fed3df41398e',
  'bbcd1321-d840-4f00-9653-d01eb9cf17d3',
  'a1b2c3d4-1111-4000-8000-000000000001',
  'puffed-rice-from-home',
  'Starting Puffed Rice (Murmura) from Home',
  'Zero-investment guide to making and selling murmura from your kitchen. No equipment needed to start — just rice, sand, and a kadhai.',
  true, 3, 'public'
) ON CONFLICT (slug) DO NOTHING;

-- Steps for Blueprint 1
INSERT INTO timeline_steps (id, user_id, interest_id, source_type, title, description, category, status, visibility, sort_order, collaborator_user_ids)
VALUES
  ('51000001-0001-4000-8000-000000000001', 'fe401f10-7298-4d46-921b-fed3df41398e', 'bbcd1321-d840-4f00-9653-d01eb9cf17d3', 'blueprint', 'Learn the basic murmura technique', 'Watch how experienced women puff rice in sand. You need: a kadhai, clean sand, and parboiled rice. Practice with 1 kg first.', 'lesson', 'pending', 'organization', 0, '{}'),
  ('51000001-0002-4000-8000-000000000002', 'fe401f10-7298-4d46-921b-fed3df41398e', 'bbcd1321-d840-4f00-9653-d01eb9cf17d3', 'blueprint', 'Source rice and packaging locally', 'Buy parboiled rice from the weekly haat. Small plastic bags cost ₹20-30 per 100. Start with 5 kg of rice for your first batch.', 'drill', 'pending', 'organization', 1, '{}'),
  ('51000001-0003-4000-8000-000000000003', 'fe401f10-7298-4d46-921b-fed3df41398e', 'bbcd1321-d840-4f00-9653-d01eb9cf17d3', 'blueprint', 'Make your first batch and taste-test', 'Puff 2 kg of rice. Give samples to 5 neighbours. Ask: is it crispy enough? Too salty? Would you buy this?', 'drill', 'pending', 'organization', 2, '{}'),
  ('51000001-0004-4000-8000-000000000004', 'fe401f10-7298-4d46-921b-fed3df41398e', 'bbcd1321-d840-4f00-9653-d01eb9cf17d3', 'blueprint', 'Get FSSAI basic registration', 'FSSAI basic registration is free for small producers earning under ₹12 lakh/year. Apply online or at the block office. Takes 7-14 days.', 'drill', 'pending', 'organization', 3, '{}'),
  ('51000001-0005-4000-8000-000000000005', 'fe401f10-7298-4d46-921b-fed3df41398e', 'bbcd1321-d840-4f00-9653-d01eb9cf17d3', 'blueprint', 'Sell your first 10 packets', 'Pack in 100g or 200g bags. Sell at the weekly haat or door-to-door in your village. Price: ₹10-15 per 100g packet.', 'drill', 'pending', 'organization', 4, '{}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO blueprint_steps (blueprint_id, step_id, sort_order)
VALUES
  ('b1000001-0001-4000-8000-000000000001', '51000001-0001-4000-8000-000000000001', 0),
  ('b1000001-0001-4000-8000-000000000001', '51000001-0002-4000-8000-000000000002', 1),
  ('b1000001-0001-4000-8000-000000000001', '51000001-0003-4000-8000-000000000003', 2),
  ('b1000001-0001-4000-8000-000000000001', '51000001-0004-4000-8000-000000000004', 3),
  ('b1000001-0001-4000-8000-000000000001', '51000001-0005-4000-8000-000000000005', 4)
ON CONFLICT DO NOTHING;

-- Blueprint 2: Pickle & Chutney — Your First Product
INSERT INTO timeline_blueprints (id, user_id, interest_id, organization_id, slug, title, description, is_published, subscriber_count, access_level)
VALUES (
  'b1000001-0002-4000-8000-000000000002',
  'fe401f10-7298-4d46-921b-fed3df41398e',
  'bbcd1321-d840-4f00-9653-d01eb9cf17d3',
  'a1b2c3d4-1111-4000-8000-000000000001',
  'pickle-chutney-first-product',
  'Pickle & Chutney — Your First Product',
  'Turn seasonal fruits and vegetables into shelf-stable products you can sell year-round. No special equipment needed.',
  true, 5, 'public'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO timeline_steps (id, user_id, interest_id, source_type, title, description, category, status, visibility, sort_order, collaborator_user_ids)
VALUES
  ('51000002-0001-4000-8000-000000000001', 'fe401f10-7298-4d46-921b-fed3df41398e', 'bbcd1321-d840-4f00-9653-d01eb9cf17d3', 'blueprint', 'Pick one recipe you already know', 'Start with a pickle or chutney your family already makes well. Mango, tomato, or mixed vegetable — whatever grows nearby and you know the taste of.', 'lesson', 'pending', 'organization', 0, '{}'),
  ('51000002-0002-4000-8000-000000000002', 'fe401f10-7298-4d46-921b-fed3df41398e', 'bbcd1321-d840-4f00-9653-d01eb9cf17d3', 'blueprint', 'Learn proper hygiene and shelf life', 'Clean jars with boiling water. Use clean spoons only. Oil must cover the pickle surface. These steps decide if your product lasts 1 week or 6 months.', 'lesson', 'pending', 'organization', 1, '{}'),
  ('51000002-0003-4000-8000-000000000003', 'fe401f10-7298-4d46-921b-fed3df41398e', 'bbcd1321-d840-4f00-9653-d01eb9cf17d3', 'blueprint', 'Make 10 sample jars and give away', 'Use small 100ml jars. Give to neighbours, relatives, and the local shop owner. Ask each person: would you pay ₹30-50 for this?', 'drill', 'pending', 'organization', 2, '{}'),
  ('51000002-0004-4000-8000-000000000004', 'fe401f10-7298-4d46-921b-fed3df41398e', 'bbcd1321-d840-4f00-9653-d01eb9cf17d3', 'blueprint', 'Design a simple label', 'Write product name, ingredients, your name, date, and "best before 3 months" on a sticker. This builds trust and is required by FSSAI.', 'drill', 'pending', 'organization', 3, '{}'),
  ('51000002-0005-4000-8000-000000000005', 'fe401f10-7298-4d46-921b-fed3df41398e', 'bbcd1321-d840-4f00-9653-d01eb9cf17d3', 'blueprint', 'Sell at the weekly haat', 'Start with 20 jars at ₹40-60 each. Bring samples for tasting. Put your FSSAI number on the label once you have it.', 'drill', 'pending', 'organization', 4, '{}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO blueprint_steps (blueprint_id, step_id, sort_order)
VALUES
  ('b1000001-0002-4000-8000-000000000002', '51000002-0001-4000-8000-000000000001', 0),
  ('b1000001-0002-4000-8000-000000000002', '51000002-0002-4000-8000-000000000002', 1),
  ('b1000001-0002-4000-8000-000000000002', '51000002-0003-4000-8000-000000000003', 2),
  ('b1000001-0002-4000-8000-000000000002', '51000002-0004-4000-8000-000000000004', 3),
  ('b1000001-0002-4000-8000-000000000002', '51000002-0005-4000-8000-000000000005', 4)
ON CONFLICT DO NOTHING;

-- Blueprint 3: Understanding FSSAI for Home Food Makers
INSERT INTO timeline_blueprints (id, user_id, interest_id, organization_id, slug, title, description, is_published, subscriber_count, access_level)
VALUES (
  'b1000001-0003-4000-8000-000000000003',
  'fe401f10-7298-4d46-921b-fed3df41398e',
  'bbcd1321-d840-4f00-9653-d01eb9cf17d3',
  'a1b2c3d4-1111-4000-8000-000000000001',
  'fssai-home-food-makers',
  'Understanding FSSAI for Home Food Makers',
  'Step-by-step guide to food safety registration. Required for selling any packaged food — but it is simple and free for small producers.',
  true, 2, 'public'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO timeline_steps (id, user_id, interest_id, source_type, title, description, category, status, visibility, sort_order, collaborator_user_ids)
VALUES
  ('51000003-0001-4000-8000-000000000001', 'fe401f10-7298-4d46-921b-fed3df41398e', 'bbcd1321-d840-4f00-9653-d01eb9cf17d3', 'blueprint', 'Understand which FSSAI license you need', 'Three types: Basic (free, under ₹12 lakh turnover), State (₹2000, ₹12-20 lakh), Central (above ₹20 lakh). You almost certainly need Basic only.', 'lesson', 'pending', 'organization', 0, '{}'),
  ('51000003-0002-4000-8000-000000000002', 'fe401f10-7298-4d46-921b-fed3df41398e', 'bbcd1321-d840-4f00-9653-d01eb9cf17d3', 'blueprint', 'Gather documents for Basic registration', 'You need: Aadhaar card, one passport photo, and a simple form. No inspection required for Basic registration.', 'drill', 'pending', 'organization', 1, '{}'),
  ('51000003-0003-4000-8000-000000000003', 'fe401f10-7298-4d46-921b-fed3df41398e', 'bbcd1321-d840-4f00-9653-d01eb9cf17d3', 'blueprint', 'Apply online or at the block office', 'Go to foscos.fssai.gov.in or ask at the block office. The form takes 10 minutes. Registration number comes in 7 days.', 'drill', 'pending', 'organization', 2, '{}'),
  ('51000003-0004-4000-8000-000000000004', 'fe401f10-7298-4d46-921b-fed3df41398e', 'bbcd1321-d840-4f00-9653-d01eb9cf17d3', 'blueprint', 'Put your FSSAI number on every product', 'Print or write your 14-digit number on all labels. This is legally required and builds customer trust.', 'drill', 'pending', 'organization', 3, '{}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO blueprint_steps (blueprint_id, step_id, sort_order)
VALUES
  ('b1000001-0003-4000-8000-000000000003', '51000003-0001-4000-8000-000000000001', 0),
  ('b1000001-0003-4000-8000-000000000003', '51000003-0002-4000-8000-000000000002', 1),
  ('b1000001-0003-4000-8000-000000000003', '51000003-0003-4000-8000-000000000003', 2),
  ('b1000001-0003-4000-8000-000000000003', '51000003-0004-4000-8000-000000000004', 3)
ON CONFLICT DO NOTHING;

-- ============================================================
-- TEXTILE & WEAVING blueprints (total beginners)
-- Interest: textile-weaving (d1af7e82-cb99-4b7b-98f4-367233fddcc5)
-- Org: pradan-hazaribagh-textiles (a1b2c3d4-2222-4000-8000-000000000002)
-- ============================================================

-- Blueprint 4: Tasar Silk Thread — From Cocoon to First Skein
INSERT INTO timeline_blueprints (id, user_id, interest_id, organization_id, slug, title, description, is_published, subscriber_count, access_level)
VALUES (
  'b1000001-0004-4000-8000-000000000004',
  'fe401f10-7298-4d46-921b-fed3df41398e',
  'd1af7e82-cb99-4b7b-98f4-367233fddcc5',
  'a1b2c3d4-2222-4000-8000-000000000002',
  'tasar-silk-cocoon-to-skein',
  'Tasar Silk Thread — Cocoon to First Skein',
  'Learn to reel tasar silk from wild cocoons. Jharkhand produces 60% of India tasar silk — this is a skill that can earn ₹200-400/day.',
  true, 4, 'public'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO timeline_steps (id, user_id, interest_id, source_type, title, description, category, status, visibility, sort_order, collaborator_user_ids)
VALUES
  ('51000004-0001-4000-8000-000000000001', 'fe401f10-7298-4d46-921b-fed3df41398e', 'd1af7e82-cb99-4b7b-98f4-367233fddcc5', 'blueprint', 'Understand the tasar silk cycle', 'Tasar silkworms feed on Asan and Arjun trees. Cocoons are collected June-July and Oct-Nov. You need to know the seasons to plan your work.', 'lesson', 'pending', 'organization', 0, '{}'),
  ('51000004-0002-4000-8000-000000000002', 'fe401f10-7298-4d46-921b-fed3df41398e', 'd1af7e82-cb99-4b7b-98f4-367233fddcc5', 'blueprint', 'Learn cocoon sorting and grading', 'Not all cocoons are equal. Learn to sort by size, colour, and shell thickness. Good sorting doubles your thread quality and price.', 'lesson', 'pending', 'organization', 1, '{}'),
  ('51000004-0003-4000-8000-000000000003', 'fe401f10-7298-4d46-921b-fed3df41398e', 'd1af7e82-cb99-4b7b-98f4-367233fddcc5', 'blueprint', 'Practice reeling on a hand charkha', 'Soak cocoons in hot water to loosen the thread. Pull the thread end and wind on the charkha. Your first skein will be uneven — that is normal.', 'drill', 'pending', 'organization', 2, '{}'),
  ('51000004-0004-4000-8000-000000000004', 'fe401f10-7298-4d46-921b-fed3df41398e', 'd1af7e82-cb99-4b7b-98f4-367233fddcc5', 'blueprint', 'Reel your first 100g of usable thread', 'Aim for even thickness. 100g of good tasar thread sells for ₹800-1200 to weavers. Keep practicing until your thread does not break easily.', 'drill', 'pending', 'organization', 3, '{}'),
  ('51000004-0005-4000-8000-000000000005', 'fe401f10-7298-4d46-921b-fed3df41398e', 'd1af7e82-cb99-4b7b-98f4-367233fddcc5', 'blueprint', 'Find your first buyer', 'Sell to local weavers, the PRADAN collection centre, or the Jharkhand Silk Textile & Handicraft Corporation. Ask PRADAN for current buyer contacts.', 'drill', 'pending', 'organization', 4, '{}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO blueprint_steps (blueprint_id, step_id, sort_order)
VALUES
  ('b1000001-0004-4000-8000-000000000004', '51000004-0001-4000-8000-000000000001', 0),
  ('b1000001-0004-4000-8000-000000000004', '51000004-0002-4000-8000-000000000002', 1),
  ('b1000001-0004-4000-8000-000000000004', '51000004-0003-4000-8000-000000000003', 2),
  ('b1000001-0004-4000-8000-000000000004', '51000004-0004-4000-8000-000000000004', 3),
  ('b1000001-0004-4000-8000-000000000004', '51000004-0005-4000-8000-000000000005', 4)
ON CONFLICT DO NOTHING;

-- Blueprint 5: Basic Weaving — Your First Fabric Piece
INSERT INTO timeline_blueprints (id, user_id, interest_id, organization_id, slug, title, description, is_published, subscriber_count, access_level)
VALUES (
  'b1000001-0005-4000-8000-000000000005',
  'fe401f10-7298-4d46-921b-fed3df41398e',
  'd1af7e82-cb99-4b7b-98f4-367233fddcc5',
  'a1b2c3d4-2222-4000-8000-000000000002',
  'basic-weaving-first-fabric',
  'Basic Weaving — Your First Fabric Piece',
  'Learn to weave a simple cotton gamcha (towel) on a frame loom. No experience needed — just patience and practice.',
  true, 6, 'public'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO timeline_steps (id, user_id, interest_id, source_type, title, description, category, status, visibility, sort_order, collaborator_user_ids)
VALUES
  ('51000005-0001-4000-8000-000000000001', 'fe401f10-7298-4d46-921b-fed3df41398e', 'd1af7e82-cb99-4b7b-98f4-367233fddcc5', 'blueprint', 'Understand warp and weft', 'Warp = vertical threads (the skeleton). Weft = horizontal threads (the filling). Every fabric in the world is just these two directions.', 'lesson', 'pending', 'organization', 0, '{}'),
  ('51000005-0002-4000-8000-000000000002', 'fe401f10-7298-4d46-921b-fed3df41398e', 'd1af7e82-cb99-4b7b-98f4-367233fddcc5', 'blueprint', 'Set up your first warp on a frame loom', 'Use a simple wooden frame (2ft x 2ft). Wind cotton thread vertically with equal spacing. This is the hardest step — take your time.', 'drill', 'pending', 'organization', 1, '{}'),
  ('51000005-0003-4000-8000-000000000003', 'fe401f10-7298-4d46-921b-fed3df41398e', 'd1af7e82-cb99-4b7b-98f4-367233fddcc5', 'blueprint', 'Weave your first 6 inches', 'Pass the shuttle with weft thread over-under-over-under. Push each row tight with a comb. Your first inches will be uneven — keep going.', 'drill', 'pending', 'organization', 2, '{}'),
  ('51000005-0004-4000-8000-000000000004', 'fe401f10-7298-4d46-921b-fed3df41398e', 'd1af7e82-cb99-4b7b-98f4-367233fddcc5', 'blueprint', 'Complete a small gamcha (hand towel)', 'Finish a full 18x36 inch piece. Cut from loom and tie the fringe. This is your first finished product — keep it or gift it with pride.', 'drill', 'pending', 'organization', 3, '{}'),
  ('51000005-0005-4000-8000-000000000005', 'fe401f10-7298-4d46-921b-fed3df41398e', 'd1af7e82-cb99-4b7b-98f4-367233fddcc5', 'blueprint', 'Learn about natural dyes from local plants', 'Mahua flowers = yellow, Palash = orange, Indigo = blue. Natural-dyed fabric sells for 2-3x more. Ask PRADAN for a dyeing workshop schedule.', 'lesson', 'pending', 'organization', 4, '{}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO blueprint_steps (blueprint_id, step_id, sort_order)
VALUES
  ('b1000001-0005-4000-8000-000000000005', '51000005-0001-4000-8000-000000000001', 0),
  ('b1000001-0005-4000-8000-000000000005', '51000005-0002-4000-8000-000000000002', 1),
  ('b1000001-0005-4000-8000-000000000005', '51000005-0003-4000-8000-000000000003', 2),
  ('b1000001-0005-4000-8000-000000000005', '51000005-0004-4000-8000-000000000004', 3),
  ('b1000001-0005-4000-8000-000000000005', '51000005-0005-4000-8000-000000000005', 4)
ON CONFLICT DO NOTHING;

-- Blueprint 6: Government Schemes for Jharkhand Weavers
INSERT INTO timeline_blueprints (id, user_id, interest_id, organization_id, slug, title, description, is_published, subscriber_count, access_level)
VALUES (
  'b1000001-0006-4000-8000-000000000006',
  'fe401f10-7298-4d46-921b-fed3df41398e',
  'd1af7e82-cb99-4b7b-98f4-367233fddcc5',
  'a1b2c3d4-2222-4000-8000-000000000002',
  'govt-schemes-jharkhand-weavers',
  'Government Schemes for Jharkhand Weavers',
  'Three schemes every new weaver should know about — subsidised looms, yarn supply, and marketing support from the state government.',
  true, 3, 'public'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO timeline_steps (id, user_id, interest_id, source_type, title, description, category, status, visibility, sort_order, collaborator_user_ids)
VALUES
  ('51000006-0001-4000-8000-000000000001', 'fe401f10-7298-4d46-921b-fed3df41398e', 'd1af7e82-cb99-4b7b-98f4-367233fddcc5', 'blueprint', 'Check if you qualify for a subsidised loom', 'The National Handloom Development Programme gives 90% subsidy on looms for BPL weavers. You need: BPL card or SHG membership, and a weaver ID from the Textile Department.', 'lesson', 'pending', 'organization', 0, '{}'),
  ('51000006-0002-4000-8000-000000000002', 'fe401f10-7298-4d46-921b-fed3df41398e', 'd1af7e82-cb99-4b7b-98f4-367233fddcc5', 'blueprint', 'Apply for yarn supply through your SHG', 'The Yarn Supply Scheme provides mill-quality yarn at subsidised rates. Apply through your SHG or Weavers Service Centre.', 'drill', 'pending', 'organization', 1, '{}'),
  ('51000006-0003-4000-8000-000000000003', 'fe401f10-7298-4d46-921b-fed3df41398e', 'd1af7e82-cb99-4b7b-98f4-367233fddcc5', 'blueprint', 'Register for a Weaver ID card', 'Visit the District Textile Office with your Aadhaar card and proof of weaving (photos of your work). The ID card unlocks all government weaver benefits.', 'drill', 'pending', 'organization', 2, '{}'),
  ('51000006-0004-4000-8000-000000000004', 'fe401f10-7298-4d46-921b-fed3df41398e', 'd1af7e82-cb99-4b7b-98f4-367233fddcc5', 'blueprint', 'Join the Handloom Marketing Assistance programme', 'Get support to sell at state exhibitions and melas. The government pays for your stall, transport, and daily allowance. Ask PRADAN to nominate you.', 'drill', 'pending', 'organization', 3, '{}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO blueprint_steps (blueprint_id, step_id, sort_order)
VALUES
  ('b1000001-0006-4000-8000-000000000006', '51000006-0001-4000-8000-000000000001', 0),
  ('b1000001-0006-4000-8000-000000000006', '51000006-0002-4000-8000-000000000002', 1),
  ('b1000001-0006-4000-8000-000000000006', '51000006-0003-4000-8000-000000000003', 2),
  ('b1000001-0006-4000-8000-000000000006', '51000006-0004-4000-8000-000000000004', 3)
ON CONFLICT DO NOTHING;
