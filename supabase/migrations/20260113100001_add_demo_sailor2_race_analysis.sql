-- Add mock race analysis data for demo-sailor2@regattaflow.app
-- sailor_profile_id: 886408b4-ae56-4399-bf37-1552bef7cc8b

-- First, create some regattas for this user if they don't have any
INSERT INTO regattas (id, name, description, start_date, status, created_by)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Spring Regatta 2025', 'Club spring series race 1', NOW() - INTERVAL '35 days', 'completed', '2fc71e4b-3e1c-4f6f-9c26-731de74dce7b'),
  ('a2222222-2222-2222-2222-222222222222', 'Spring Regatta 2025 R2', 'Club spring series race 2', NOW() - INTERVAL '28 days', 'completed', '2fc71e4b-3e1c-4f6f-9c26-731de74dce7b'),
  ('a3333333-3333-3333-3333-333333333333', 'Club Championship R1', 'Championship series opener', NOW() - INTERVAL '21 days', 'completed', '2fc71e4b-3e1c-4f6f-9c26-731de74dce7b'),
  ('a4444444-4444-4444-4444-444444444444', 'Club Championship R2', 'Championship series race 2', NOW() - INTERVAL '14 days', 'completed', '2fc71e4b-3e1c-4f6f-9c26-731de74dce7b'),
  ('a5555555-5555-5555-5555-555555555555', 'Memorial Cup', 'Annual memorial race', NOW() - INTERVAL '7 days', 'completed', '2fc71e4b-3e1c-4f6f-9c26-731de74dce7b')
ON CONFLICT (id) DO NOTHING;

-- Add race analysis data showing a pattern:
-- - Strong starts (4.4 avg, improving)
-- - Solid upwind (4.0 avg, stable)
-- - Weak downwind (2.6 avg, but improving)
-- - Good mark roundings (4.2 avg)
-- - Solid finishes (4.0 avg)

INSERT INTO race_analysis (
  id, race_id, sailor_id, created_at,
  start_rating, start_notes,
  prestart_rating, prestart_notes,
  upwind_rating, upwind_notes,
  windward_mark_rating, windward_mark_notes,
  downwind_rating, downwind_notes,
  leeward_mark_rating, leeward_mark_notes,
  finish_rating, finish_notes,
  overall_satisfaction, key_learnings
) VALUES
-- Race 1: Learning starts, struggling downwind
(
  gen_random_uuid(),
  'a1111111-1111-1111-1111-111111111111',
  '886408b4-ae56-4399-bf37-1552bef7cc8b',
  NOW() - INTERVAL '35 days',
  3, 'Late to the line, need better timing',
  3, 'Approach was rushed',
  4, 'Good shift work on port tack',
  4, 'Clean rounding',
  2, 'Lost boats in the light spots',
  3, 'Wide approach cost position',
  4, 'Good line read',
  3,
  ARRAY['Start timing needs work', 'Downwind pressure reading is weak']
),
-- Race 2: Starts improving, downwind still weak
(
  gen_random_uuid(),
  'a2222222-2222-2222-2222-222222222222',
  '886408b4-ae56-4399-bf37-1552bef7cc8b',
  NOW() - INTERVAL '28 days',
  4, 'Better timing, hit the line with speed',
  4, 'Time-distance approach was solid',
  4, 'Sailed the shifts well',
  4, 'Inside at the mark',
  2, 'Still losing ground on runs',
  4, 'Smooth set',
  3, 'Rushed the finish approach',
  4,
  ARRAY['Starts are clicking', 'Need to work on VMG angles']
),
-- Race 3: Strong start, downwind improving slightly
(
  gen_random_uuid(),
  'a3333333-3333-3333-3333-333333333333',
  '886408b4-ae56-4399-bf37-1552bef7cc8b',
  NOW() - INTERVAL '21 days',
  5, 'Pin end start in clear air - perfect!',
  4, 'Calm and controlled approach',
  4, 'Good lane management',
  5, 'Perfect layline, inside overlap',
  3, 'Better angles but still losing in lulls',
  4, 'Good tactical rounding',
  4, 'Sailed to the favored end',
  4,
  ARRAY['Confidence at starts is growing', 'Downwind VMG improving']
),
-- Race 4: Consistent performance
(
  gen_random_uuid(),
  'a4444444-4444-4444-4444-444444444444',
  '886408b4-ae56-4399-bf37-1552bef7cc8b',
  NOW() - INTERVAL '14 days',
  5, 'Another great start at the boat',
  5, 'Perfect setup routine',
  4, 'Solid upwind, good height',
  4, 'Clean rounding with good exit',
  3, 'Better puff hunting today',
  5, 'Excellent set at leeward',
  4, 'Good finish',
  4,
  ARRAY['Starts are a real strength now', 'Mark roundings are improving']
),
-- Race 5: Most recent - strong overall
(
  gen_random_uuid(),
  'a5555555-5555-5555-5555-555555555555',
  '886408b4-ae56-4399-bf37-1552bef7cc8b',
  NOW() - INTERVAL '7 days',
  5, 'Best start of the season',
  5, 'Totally dialed in',
  4, 'Played the right side perfectly',
  4, 'Inside at windward, good exit',
  3, 'VMG angles getting better',
  4, 'Smooth rounding',
  5, 'Won the boat to finish',
  5,
  ARRAY['Everything coming together', 'Keep working on downwind']
)
ON CONFLICT (id) DO NOTHING;
