-- Seed Fleet Race Prep Data
-- Creates sample race_result posts and upcoming shared races for fleet dashboard testing

-- First, ensure we have fleet members (add demo users to Hong Kong Etchells Fleet)
INSERT INTO fleet_members (fleet_id, user_id, role, status, joined_at)
VALUES
  ('27c63e2c-189f-4195-8256-810c454fc4c1', '76069517-bf07-485a-b470-4baa9b9c87a7', 'member', 'active', NOW()),
  ('27c63e2c-189f-4195-8256-810c454fc4c1', '162a7a57-c598-443f-98f9-c27f5e5289e7', 'member', 'active', NOW()),
  ('27c63e2c-189f-4195-8256-810c454fc4c1', 'e9945201-bdd6-4934-abc6-7b49dc445929', 'member', 'active', NOW()),
  ('27c63e2c-189f-4195-8256-810c454fc4c1', 'f5224556-60d1-446f-912a-44ee68a499f3', 'member', 'active', NOW())
ON CONFLICT (fleet_id, user_id) DO NOTHING;

-- Get the class_id for Etchells
DO $$
DECLARE
  v_etchells_class_id uuid;
  v_fleet_id uuid := '27c63e2c-189f-4195-8256-810c454fc4c1';
  v_user1_id uuid := '76069517-bf07-485a-b470-4baa9b9c87a7';
  v_user2_id uuid := '162a7a57-c598-443f-98f9-c27f5e5289e7';
  v_user3_id uuid := 'e9945201-bdd6-4934-abc6-7b49dc445929';
  v_user4_id uuid := 'f5224556-60d1-446f-912a-44ee68a499f3';
BEGIN
  -- Get Etchells class ID
  SELECT id INTO v_etchells_class_id FROM boat_classes WHERE name = 'Etchells' LIMIT 1;

  -- If no Etchells class, use the fleet's class_id
  IF v_etchells_class_id IS NULL THEN
    SELECT class_id INTO v_etchells_class_id FROM fleets WHERE id = v_fleet_id;
  END IF;

  -- Insert upcoming races
  INSERT INTO races (name, start_time, class, racing_area_name, race_series, location)
  VALUES
    ('Saturday Club Race - Race 1', NOW() + INTERVAL '2 days', v_etchells_class_id, 'Eastern Course', 'Winter Series 2025', 'Victoria Harbour'),
    ('Sunday Championship - Heat 2', NOW() + INTERVAL '3 days', v_etchells_class_id, 'Western Course', 'Hong Kong Championship', 'Stanley Bay'),
    ('Midweek Pursuit Race', NOW() + INTERVAL '6 days', v_etchells_class_id, 'Central Course', 'Weekday Regatta', 'Aberdeen Harbour'),
    ('Next Weekend Qualifier', NOW() + INTERVAL '9 days', v_etchells_class_id, 'Northern Course', 'Regional Qualifiers', 'Tolo Harbour');

  -- Insert race_result posts
  INSERT INTO fleet_posts (fleet_id, author_id, post_type, content, metadata, visibility, is_pinned, created_at)
  VALUES
    (
      v_fleet_id,
      v_user1_id,
      'race_result',
      'Great day on the water! Nailed the start and stayed in clear air most of the race. Port tack approach on final beat paid off massively.',
      jsonb_build_object(
        'finish_position', 3,
        'fleet_size', 24,
        'race_name', 'Saturday Series - Race 12',
        'conditions', 'Light and shifty, 8-12 knots'
      ),
      'fleet',
      false,
      NOW() - INTERVAL '2 days'
    ),
    (
      v_fleet_id,
      v_user2_id,
      'race_result',
      'Tough race today - had to dig out from a bad start. Learned a lot about playing the shifts on the second beat. Finished mid-fleet but gained 8 positions after being last at mark 1.',
      jsonb_build_object(
        'finish_position', 12,
        'fleet_size', 26,
        'race_name', 'Sunday Championship - Heat 1',
        'conditions', 'Puffy 15-20 knots with big shifts'
      ),
      'fleet',
      false,
      NOW() - INTERVAL '5 days'
    ),
    (
      v_fleet_id,
      v_user3_id,
      'race_result',
      'First podium of the season! 🥈 Conservative start paid off - stayed patient and picked off boats one by one. Thanks to everyone who shared tuning notes before the event.',
      jsonb_build_object(
        'finish_position', 2,
        'fleet_size', 18,
        'race_name', 'Midweek Pursuit',
        'conditions', 'Moderate breeze, 12-15 knots'
      ),
      'fleet',
      false,
      NOW() - INTERVAL '7 days'
    ),
    (
      v_fleet_id,
      v_user4_id,
      'race_result',
      'Race abandoned after 2 legs due to lightning. Was sitting 5th at the time. Looking forward to the resail next weekend.',
      jsonb_build_object(
        'fleet_size', 22,
        'race_name', 'Regional Qualifier',
        'conditions', 'Building breeze, thunderstorms',
        'status', 'abandoned'
      ),
      'fleet',
      false,
      NOW() - INTERVAL '10 days'
    );

END $$;
