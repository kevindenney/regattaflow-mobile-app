-- Create comprehensive mock coach profiles and client relationships for testing

-- First, create coach users if they don't exist (via auth.users mock)
-- We'll use existing coach users from the auth system

-- Get existing user IDs
DO $$
DECLARE
  coach1_user_id uuid := 'd6c95c89-43e6-4d69-8f2c-58d392c22d16'; -- coach-test@regattaflow.com
  coach2_user_id uuid := 'b92a8ffd-6c11-4ebb-b6e8-12b7de58f5eb'; -- coachkdenney@icloud.com
  demo_sailor_user_id uuid := '72865178-17c5-43aa-b93e-b2d0d20cb76b'; -- 01kdenney@icloud.com

  coach1_profile_id uuid;
  coach2_profile_id uuid;
  sailor_profile_id uuid;
BEGIN
  -- Check if coach profiles already exist, if so skip creation
  IF EXISTS (SELECT 1 FROM coach_profiles WHERE user_id = coach1_user_id) THEN
    RAISE NOTICE 'Coach profile for Sarah Chen already exists, skipping...';
    SELECT id INTO coach1_profile_id FROM coach_profiles WHERE user_id = coach1_user_id;
  ELSE
    -- Create Coach Profile 1: Sarah Chen - Olympic Coach
    INSERT INTO coach_profiles (
    id,
    user_id,
    display_name,
    bio,
    experience_years,
    certifications,
    specializations,
    hourly_rate,
    currency,
    is_verified,
    is_active,
    rating,
    total_sessions,
    location_name,
    location_region,
    languages,
    profile_image_url
  ) VALUES (
    gen_random_uuid(),
    coach1_user_id,
    'Sarah Chen',
    'Olympic-level sailing coach with 15+ years of experience coaching at the highest levels of competitive sailing. Specialized in match racing, fleet racing strategy, and mental performance. Former Laser Radial World Champion and 470 Olympic medalist. Known for data-driven coaching approach and personalized tactical development.',
    15,
    '["World Sailing Level 3 Coach", "Olympic Team Coach 2016-2020", "US Sailing Level 4", "Mental Performance Certified", "Tactical Racing Specialist"]'::jsonb,
    ARRAY['Match Racing', 'Fleet Racing', 'Olympic Classes', 'Tactical Strategy', 'Mental Performance', 'Start Line Mastery'],
    150.00,
    'USD',
    true,
    true,
    4.9,
    247,
    'San Francisco',
    'North America',
    ARRAY['English', 'Mandarin'],
    'https://i.pravatar.cc/150?img=5'
  ) RETURNING id INTO coach1_profile_id;
  END IF;

  -- Check if coach profile 2 already exists
  IF EXISTS (SELECT 1 FROM coach_profiles WHERE user_id = coach2_user_id) THEN
    RAISE NOTICE 'Coach profile for Jimmy Wilson already exists, skipping...';
    SELECT id INTO coach2_profile_id FROM coach_profiles WHERE user_id = coach2_user_id;
  ELSE
    -- Create Coach Profile 2: James "Jimmy" Wilson - Youth Development Expert
    INSERT INTO coach_profiles (
    id,
    user_id,
    display_name,
    bio,
    experience_years,
    certifications,
    specializations,
    hourly_rate,
    currency,
    is_verified,
    is_active,
    rating,
    total_sessions,
    location_name,
    location_region,
    languages,
    profile_image_url
  ) VALUES (
    gen_random_uuid(),
    coach2_user_id,
    'James "Jimmy" Wilson',
    'Youth sailing development coach specializing in Optimist, 420, and 29er classes. 12 years coaching junior sailors from beginner to national championship level. Expert in foundational skills, boat handling, and building racing confidence. Multiple national championship-winning coach. Creates fun, engaging learning environments while maintaining competitive edge.',
    12,
    '["RYA Senior Instructor", "World Sailing Youth Coach", "US Sailing Level 3", "Safeguarding Certified", "First Aid at Sea"]'::jsonb,
    ARRAY['Youth Development', 'Optimist', '420', '29er', 'Boat Handling', 'Racing Fundamentals'],
    95.00,
    'USD',
    true,
    true,
    4.8,
    189,
    'Newport',
    'North America',
    ARRAY['English'],
    'https://i.pravatar.cc/150?img=12'
  ) RETURNING id INTO coach2_profile_id;
  END IF;

  -- Get the demo sailor's profile ID
  SELECT id INTO sailor_profile_id
  FROM sailor_profiles
  WHERE user_id = demo_sailor_user_id
  LIMIT 1;

  -- Create client relationship: Demo Sailor -> Sarah Chen (Primary Coach)
  IF sailor_profile_id IS NOT NULL THEN
    INSERT INTO coaching_sessions (
      id,
      coach_id,
      sailor_id,
      session_type,
      status,
      scheduled_at,
      duration_minutes,
      location_type,
      notes,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      coach1_profile_id,
      sailor_profile_id,
      'strategy_review',
      'completed',
      NOW() - INTERVAL '7 days',
      60,
      'virtual',
      'Reviewed start line strategy and wind shift patterns. Sailor showing good improvement in line bias recognition.',
      NOW() - INTERVAL '7 days',
      NOW() - INTERVAL '7 days'
    );

    -- Add another session to establish relationship
    INSERT INTO coaching_sessions (
      id,
      coach_id,
      sailor_id,
      session_type,
      status,
      scheduled_at,
      duration_minutes,
      location_type,
      notes,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      coach1_profile_id,
      sailor_profile_id,
      'race_debrief',
      'completed',
      NOW() - INTERVAL '14 days',
      45,
      'virtual',
      'Post-race analysis of Hong Kong regatta. Discussed upwind positioning and mark rounding technique.',
      NOW() - INTERVAL '14 days',
      NOW() - INTERVAL '14 days'
    );
  END IF;

  RAISE NOTICE 'Mock coach profiles created successfully';
  RAISE NOTICE 'Coach 1 (Sarah Chen) ID: %', coach1_profile_id;
  RAISE NOTICE 'Coach 2 (Jimmy Wilson) ID: %', coach2_profile_id;
  RAISE NOTICE 'Sailor Profile ID: %', sailor_profile_id;
END $$;

-- Note: Additional mock coach users should be created via Supabase Auth API or dashboard
-- Direct inserts into auth.users are not recommended in production Supabase projects
-- The coach profiles below reference placeholder user IDs that can be replaced with real users

-- Create Coach Profile 3: Maria Rodriguez - Offshore Racing Specialist
-- Note: This will only insert if a user with this ID exists in auth.users
INSERT INTO coach_profiles (
  id,
  user_id,
  display_name,
  bio,
  experience_years,
  certifications,
  specializations,
  hourly_rate,
  currency,
  is_verified,
  is_active,
  rating,
  total_sessions,
  location_name,
  location_region,
  languages,
  profile_image_url
) VALUES (
  gen_random_uuid(),
  'a1b2c3d4-e5f6-4789-a1b2-c3d4e5f67890',
  'Maria Rodriguez',
  'Offshore and oceanic racing specialist with extensive experience in long-distance racing including multiple Transpac, Fastnet, and Sydney-Hobart campaigns. Expert in weather routing, crew management, and offshore race strategy. Focuses on navigation, tactical decision-making under pressure, and offshore safety.',
  18,
  '["Offshore Yachtmaster", "World Sailing Offshore Instructor", "Coastal Navigation Certified", "Crew Resource Management", "Weather Routing Specialist"]'::jsonb,
  ARRAY['Offshore Racing', 'Weather Routing', 'Navigation', 'Crew Management', 'Long Distance Racing', 'Heavy Weather'],
  175.00,
  'USD',
  true,
  true,
  4.9,
  156,
  'San Diego',
  'North America',
  ARRAY['English', 'Spanish'],
  'https://i.pravatar.cc/150?img=9'
) ON CONFLICT (user_id) DO NOTHING;

-- Create Coach Profile 4: Tom Blackwell - Keelboat Racing Expert
INSERT INTO coach_profiles (
  id,
  user_id,
  display_name,
  bio,
  experience_years,
  certifications,
  specializations,
  hourly_rate,
  currency,
  is_verified,
  is_active,
  rating,
  total_sessions,
  location_name,
  location_region,
  languages,
  profile_image_url
) VALUES (
  gen_random_uuid(),
  'b2c3d4e5-f6a7-4890-b2c3-d4e5f6a78901',
  'Tom Blackwell',
  'Professional keelboat racing coach specializing in J/70, Melges 24, and one-design keelboats. 20+ years at the top level of the sport including America''s Cup campaign experience. Expert in crew coordination, boatspeed optimization, and tactical racing in tight fleets. Known for his systematic approach to performance improvement.',
  20,
  '["World Sailing Level 4", "Americas Cup Coach", "J/70 World Champion Coach", "Performance Analysis Expert", "Team Building Specialist"]'::jsonb,
  ARRAY['Keelboat Racing', 'J/70', 'Melges 24', 'Crew Coordination', 'Boatspeed', 'Performance Analysis'],
  200.00,
  'USD',
  true,
  true,
  5.0,
  312,
  'Newport',
  'North America',
  ARRAY['English'],
  'https://i.pravatar.cc/150?img=13'
) ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE coach_profiles IS 'Mock coach data created for testing coach selection and strategy sharing features';
