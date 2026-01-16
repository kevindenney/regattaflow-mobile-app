-- Add mock race analysis data for demo-sailor@regattaflow.app
-- This enables testing of AI strategy recommendations

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
-- Race 1: Strong start, weak downwind (30 days ago)
(
  gen_random_uuid(),
  '207197d9-d362-49d1-84ff-5c3bbfad215b',
  '262fa4fe-c641-48ce-a236-bf34697639e0',
  NOW() - INTERVAL '30 days',
  4, 'Great pin end start, hit the line with speed',
  4, 'Good time-distance approach',
  3, 'Lost some ground on left side shift',
  4, 'Clean rounding, good exit angle',
  2, 'Struggled in the light patches',
  3, 'Slightly wide approach',
  4, 'Good finish line bias read',
  4,
  ARRAY['Need to work on downwind pressure hunting', 'Starts are becoming more consistent']
),
-- Race 2: Improving starts, downwind still weak (21 days ago)
(
  gen_random_uuid(),
  'c5c4b901-648b-4159-a912-522bb632cdb9',
  '262fa4fe-c641-48ce-a236-bf34697639e0',
  NOW() - INTERVAL '21 days',
  5, 'Nailed the boat end, clear air immediately',
  4, 'Timing was spot on',
  4, 'Played the shifts well today',
  4, 'Inside overlap at the mark',
  2, 'Still struggling with VMG angles',
  4, 'Good set at the leeward mark',
  3, 'Could have been more aggressive at finish',
  4,
  ARRAY['Starting is really improving', 'Downwind angles need work']
),
-- Race 3: Consistent performance (14 days ago)
(
  gen_random_uuid(),
  '89a198d0-3a7d-4503-a984-8ff03f9250b8',
  '262fa4fe-c641-48ce-a236-bf34697639e0',
  NOW() - INTERVAL '14 days',
  4, 'Good mid-line start in clear air',
  3, 'A bit rushed in the final minute',
  4, 'Solid tacking on headers',
  5, 'Perfect layline approach',
  3, 'Getting better at reading pressure',
  4, 'Smooth rounding',
  4, 'Read the favored end correctly',
  4,
  ARRAY['Mark roundings are a strength', 'Downwind improving slowly']
),
-- Race 4: Strong overall (7 days ago)
(
  gen_random_uuid(),
  '5f99ee50-27f0-457a-9273-86a8c88e7599',
  '262fa4fe-c641-48ce-a236-bf34697639e0',
  NOW() - INTERVAL '7 days',
  5, 'Best start of the series, perfect timing',
  5, 'Controlled approach, hit the line at speed',
  4, 'Good lane management upwind',
  4, 'Clean rounding with inside overlap',
  3, 'Sailed the puffs better today',
  5, 'Excellent tactical rounding',
  5, 'Crossed finish line at committee boat',
  5,
  ARRAY['Everything clicked today', 'Confidence at starts is high']
),
-- Race 5: Most recent (2 days ago)
(
  gen_random_uuid(),
  '8a80375d-b6f0-4bf8-b556-d136b06f6f6a',
  '262fa4fe-c641-48ce-a236-bf34697639e0',
  NOW() - INTERVAL '2 days',
  4, 'Solid start at favored end',
  4, 'Good setup routine',
  5, 'Best upwind leg - sailed the lifts',
  4, 'Good approach angle',
  4, 'Finally found the right angles',
  4, 'Smooth set',
  4, 'Finished well',
  4,
  ARRAY['Upwind and starts are strengths', 'Downwind is coming together']
)
ON CONFLICT (id) DO NOTHING;
