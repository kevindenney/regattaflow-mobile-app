-- =============================================================================
-- Seed Activity Templates for all four interests
-- =============================================================================
-- Demo templates published by organizations and coaches.
-- Uses the real interest UUIDs from the remote Supabase instance.
--
-- Interest UUIDs:
--   sail-racing: 5e6b64c3-ea92-42a1-baf5-9342c53eb7d9
--   nursing:     bec249c5-6412-4d16-bb84-bfcfb887ff67
--   drawing:     b31dbc01-7892-4f63-9697-84b05546f595
--   fitness:     f138e519-7ac9-4497-a0ee-fba242482bce
-- =============================================================================

-- We need publisher IDs. Since we don't know exact org UUIDs at seed time,
-- we generate deterministic UUIDs for demo publishers and reference them.

DO $$
DECLARE
  -- Publisher UUIDs (deterministic for idempotent re-runs)
  rhkyc_org_id       uuid := 'a1000001-0000-0000-0000-000000000001';
  jhu_org_id         uuid := 'a1000002-0000-0000-0000-000000000002';
  urban_sketch_org_id uuid := 'a1000003-0000-0000-0000-000000000003';
  crossfit_box_org_id uuid := 'a1000004-0000-0000-0000-000000000004';

  -- Coach publisher UUIDs
  coach_sailing_id   uuid := 'c1000001-0000-0000-0000-000000000001';
  coach_nursing_id   uuid := 'c1000002-0000-0000-0000-000000000002';
  coach_drawing_id   uuid := 'c1000003-0000-0000-0000-000000000003';
  coach_fitness_id   uuid := 'c1000004-0000-0000-0000-000000000004';

  -- Interest UUIDs
  sailing_id  uuid := '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9';
  nursing_id  uuid := 'bec249c5-6412-4d16-bb84-bfcfb887ff67';
  drawing_id  uuid := 'b31dbc01-7892-4f63-9697-84b05546f595';
  fitness_id  uuid := 'f138e519-7ac9-4497-a0ee-fba242482bce';

BEGIN
  -- =========================================================================
  -- SAILING — RHKYC Organization Templates
  -- =========================================================================

  INSERT INTO betterat_activity_templates
    (publisher_type, publisher_id, interest_id, event_type, event_subtype, title, description, scheduled_date, recurrence, location, prefilled_data, tags, published, enrollment_count)
  VALUES
    -- Wednesday Night Race Series
    ('organization', rhkyc_org_id, sailing_id, 'race', 'fleet',
     'Wednesday Night Race — Spring Series Race 8',
     'Weekly fleet racing in Victoria Harbour. Warning signal at 1830. All fleets start on the same line, staggered 5-minute intervals. Course set by RC on the day based on conditions.',
     '2026-03-11 18:30:00+08',
     '{"frequency":"weekly","dayOfWeek":3,"startDate":"2026-01-15","endDate":"2026-05-27"}'::jsonb,
     'Victoria Harbour, Hong Kong',
     '{"race_format":"fleet","start_time":"18:30","expected_wind":"8-14 kts E","course_type":"windward_leeward","num_races":1}'::jsonb,
     ARRAY['fleet', 'wednesday-nights', 'harbour-racing', 'spring-series'],
     true, 42),

    -- Around the Island Race
    ('organization', rhkyc_org_id, sailing_id, 'race', 'distance',
     'Around the Island Race 2026',
     'Annual circumnavigation of Hong Kong Island. 28nm course. All classes start from Victoria Harbour, round the island clockwise, finish in the harbour.',
     '2026-04-19 09:00:00+08',
     NULL,
     'Victoria Harbour → Hong Kong Island circumnavigation',
     '{"race_format":"distance","distance_nm":28,"start_time":"09:00","expected_duration":"4-7 hours","course_description":"Start Victoria Harbour, Lei Yue Mun, Shek O, Stanley, Aberdeen, Green Island, Finish Victoria Harbour"}'::jsonb,
     ARRAY['distance', 'annual', 'hong-kong-island', 'offshore'],
     true, 78),

    -- Dragon Gold Cup Qualifier
    ('organization', rhkyc_org_id, sailing_id, 'race', 'fleet',
     'Dragon Class Spring Regatta — Day 1',
     'Two-day regatta for Dragon class boats. Three races per day. Gold Cup selection series points apply.',
     '2026-03-22 10:00:00+08',
     NULL,
     'Port Shelter, Hong Kong',
     '{"race_format":"fleet","boat_class":"Dragon","num_races":3,"start_time":"10:00","series":"Gold Cup Qualifier"}'::jsonb,
     ARRAY['dragon', 'regatta', 'gold-cup', 'port-shelter'],
     true, 24),

    -- Drill Session
    ('organization', rhkyc_org_id, sailing_id, 'drill', NULL,
     'Saturday Morning Start Practice',
     'Open start line practice session for all fleets. RC will set a start line and run 10-minute sequences. Focus on timing, acceleration, and line bias reading.',
     '2026-03-15 09:00:00+08',
     '{"frequency":"biweekly","dayOfWeek":6,"startDate":"2026-01-04","endDate":"2026-06-28"}'::jsonb,
     'Kellett Island, Hong Kong',
     '{"drill_type":"starting","duration_minutes":120,"num_starts":8}'::jsonb,
     ARRAY['drill', 'starting', 'saturday', 'all-fleets'],
     true, 31)
  ON CONFLICT DO NOTHING;

  -- Sailing Coach Templates
  INSERT INTO betterat_activity_templates
    (publisher_type, publisher_id, interest_id, event_type, event_subtype, title, description, location, prefilled_data, tags, published, enrollment_count)
  VALUES
    ('user', coach_sailing_id, sailing_id, 'drill', NULL,
     'Upwind VMG Optimization Drill',
     'Focused session on upwind boat speed and VMG. We will practice hiking technique, sail trim adjustments, and layline judgment. Bring your Velocitek or GPS watch.',
     'Kellett Island, Hong Kong',
     '{"drill_type":"upwind","focus_areas":["hiking","sail_trim","laylines"],"duration_minutes":90}'::jsonb,
     ARRAY['drill', 'upwind', 'boat-speed', 'vmg'],
     true, 15),

    ('user', coach_sailing_id, sailing_id, 'race', 'fleet',
     'Coached Fleet Race — Tactical Focus',
     'Coached racing with pre-race briefing and post-race video debrief. I will follow on the coach boat and provide real-time radio commentary on tactical situations.',
     'Victoria Harbour, Hong Kong',
     '{"race_format":"fleet","coaching":true,"video_debrief":true,"radio_channel":"72"}'::jsonb,
     ARRAY['coached', 'tactical', 'video-debrief', 'fleet'],
     true, 12)
  ON CONFLICT DO NOTHING;

  -- =========================================================================
  -- NURSING — JHU Organization Templates
  -- =========================================================================

  INSERT INTO betterat_activity_templates
    (publisher_type, publisher_id, interest_id, event_type, event_subtype, title, description, scheduled_date, recurrence, location, prefilled_data, tags, published, enrollment_count)
  VALUES
    -- Clinical Shift
    ('organization', jhu_org_id, nursing_id, 'shift', 'clinical_shift',
     'NR.210 Med-Surg Clinical — Week 9',
     'Clinical rotation day on assigned unit. Pre-shift prep required: review patient charts, anticipate medications, set competency goals for the day. Post-shift reflection due by 2100.',
     '2026-03-10 07:00:00-05',
     '{"frequency":"weekly","dayOfWeek":2,"startDate":"2026-01-14","endDate":"2026-04-29"}'::jsonb,
     'Johns Hopkins Hospital / JH Bayview',
     '{"course":"NR.210","unit_type":"med-surg","shift_hours":8,"patient_count":3,"competencies_focus":[17,19,25],"required_prep":["Review patient charts","Medication reconciliation","Set learning objectives"]}'::jsonb,
     ARRAY['med-surg', 'clinical', 'NR210', 'semester-2'],
     true, 16),

    -- Skills Lab
    ('organization', jhu_org_id, nursing_id, 'shift', 'skills_lab',
     'Skills Lab: IV Insertion & Venipuncture',
     'Hands-on practice with IV insertion and venipuncture on simulation arms. Each student will perform 5 insertions. Preceptor validation available for competency #19.',
     '2026-03-14 13:00:00-05',
     NULL,
     'JHSON Skills Lab, Room 204',
     '{"skills":["IV insertion","venipuncture"],"competency_ids":[19,20],"duration_minutes":120,"equipment_needed":["Gloves","Tourniquet","IV catheter kit","Sharps container"],"validation_available":true}'::jsonb,
     ARRAY['skills-lab', 'IV', 'venipuncture', 'hands-on'],
     true, 16),

    -- Simulation
    ('organization', jhu_org_id, nursing_id, 'shift', 'simulation',
     'High-Fidelity Sim: Sepsis Recognition & Response',
     'Simulated scenario: 68-year-old post-op patient showing early signs of sepsis. Work through assessment, SBAR communication, intervention, and team response. Full debrief follows.',
     '2026-03-17 09:00:00-05',
     NULL,
     'JHSON Center for Simulation & Immersive Learning',
     '{"scenario":"sepsis_recognition","fidelity":"high","patient_age":68,"patient_context":"post-op day 2","competency_ids":[29,31,25],"team_size":4,"duration_minutes":90,"debrief_included":true}'::jsonb,
     ARRAY['simulation', 'sepsis', 'high-fidelity', 'critical-thinking'],
     true, 16),

    -- Competency Checkoff
    ('organization', jhu_org_id, nursing_id, 'shift', 'competency_checkoff',
     'Competency Checkoff: Foley Catheter Insertion',
     'Supervised competency validation for Foley catheter insertion. Review sterile technique before arriving. Instructor will evaluate using the standard rubric.',
     '2026-03-12 10:00:00-05',
     NULL,
     'JHSON Skills Lab, Room 202',
     '{"competency_id":15,"skill":"foley_catheter_insertion","evaluator_type":"clinical_faculty","rubric":"standard","attempt_limit":3,"prerequisites":["skills_lab_attendance","procedure_video_watched"]}'::jsonb,
     ARRAY['checkoff', 'foley', 'competency', 'supervised'],
     true, 8),

    -- NCLEX Practice
    ('organization', jhu_org_id, nursing_id, 'shift', 'nclex_practice',
     'NCLEX Prep: Pharmacology Deep Dive',
     'Focused practice session on cardiovascular and respiratory pharmacology. 75 questions from UWorld question bank. Post-session review of commonly missed concepts.',
     '2026-03-13 14:00:00-05',
     '{"frequency":"weekly","dayOfWeek":4,"startDate":"2026-02-06","endDate":"2026-04-24"}'::jsonb,
     'JHSON Library, Study Room 3',
     '{"topics":["cardiovascular_pharmacology","respiratory_pharmacology"],"question_count":75,"source":"UWorld","duration_minutes":120,"review_session":true}'::jsonb,
     ARRAY['nclex', 'pharmacology', 'practice', 'UWorld'],
     true, 12),

    -- Post-clinical debrief
    ('organization', jhu_org_id, nursing_id, 'shift', 'clinical_shift',
     'Post-Clinical Debrief — Group A',
     'Weekly group debrief with Clinical Faculty. Each student presents one key learning moment from the week. Open discussion on clinical challenges, ethical dilemmas, and professional development.',
     '2026-03-11 16:00:00-05',
     '{"frequency":"weekly","dayOfWeek":3,"startDate":"2026-01-15","endDate":"2026-04-29"}'::jsonb,
     'JHSON Room 312',
     '{"group":"A","instructor":"Linda Nakamura","format":"group_debrief","duration_minutes":60,"required_prep":["Prepare one clinical moment to share","Complete reflection journal"]}'::jsonb,
     ARRAY['debrief', 'group-A', 'reflection', 'weekly'],
     true, 8)
  ON CONFLICT DO NOTHING;

  -- Nursing Coach (Preceptor) Templates
  INSERT INTO betterat_activity_templates
    (publisher_type, publisher_id, interest_id, event_type, event_subtype, title, description, location, prefilled_data, tags, published, enrollment_count)
  VALUES
    ('user', coach_nursing_id, nursing_id, 'shift', 'clinical_shift',
     'Oncology Orientation — Chemo Safety Protocol',
     'Orientation shift focused on chemotherapy administration safety. We will review PPE for chemo, double-check protocols, BSA calculations, and extravasation management. Must complete before handling chemo agents.',
     'Johns Hopkins Hospital, Oncology 6N',
     '{"unit":"oncology_6N","focus":"chemo_safety","competency_ids":[12,13,28],"required_certifications":["ONS Chemo Provider"],"duration_hours":8}'::jsonb,
     ARRAY['oncology', 'chemo', 'safety', 'orientation'],
     true, 6),

    ('user', coach_nursing_id, nursing_id, 'shift', 'skills_lab',
     'Assessment Skills Bootcamp',
     'Intensive half-day session covering head-to-toe, respiratory, cardiac, neuro, and abdominal focused assessments. Practice on standardized patients with immediate feedback.',
     'JHSON Skills Lab',
     '{"skills":["head_to_toe","respiratory","cardiac","neuro","abdominal"],"competency_ids":[1,2,3,4,5],"duration_minutes":240,"standardized_patients":true}'::jsonb,
     ARRAY['assessment', 'bootcamp', 'intensive', 'skills'],
     true, 14)
  ON CONFLICT DO NOTHING;

  -- =========================================================================
  -- DRAWING — Urban Sketchers Organization Templates
  -- =========================================================================

  INSERT INTO betterat_activity_templates
    (publisher_type, publisher_id, interest_id, event_type, event_subtype, title, description, scheduled_date, recurrence, location, prefilled_data, tags, published, enrollment_count)
  VALUES
    -- Drawing Session
    ('organization', urban_sketch_org_id, drawing_id, 'session', 'drawing_session',
     'Sunday Morning Urban Sketch — Central Market',
     'Meet at the main entrance at 10am. We will sketch the market interior for 2 hours, then share and discuss over coffee. Bring your preferred medium — all welcome from beginners to advanced.',
     '2026-03-15 10:00:00+08',
     '{"frequency":"weekly","dayOfWeek":0,"startDate":"2026-01-05","endDate":"2026-06-28"}'::jsonb,
     'Central Market, Hong Kong',
     '{"subject":"architecture_interior","medium_suggestions":["pen_and_ink","watercolor","pencil"],"duration_minutes":120,"share_session":true,"beginner_friendly":true}'::jsonb,
     ARRAY['urban-sketch', 'architecture', 'sunday', 'group'],
     true, 28),

    -- Technique Drill
    ('organization', urban_sketch_org_id, drawing_id, 'session', 'technique_drill',
     '30-Day Perspective Challenge — Day 15: Two-Point',
     'Draw a street scene using two-point perspective. Focus on accurate vanishing points and consistent recession. Post your result in the group for peer feedback.',
     '2026-03-15 00:00:00+08',
     NULL,
     'Anywhere (self-directed)',
     '{"technique":"two_point_perspective","challenge_day":15,"challenge_total":30,"duration_minutes":45,"reference_type":"plein_air_or_photo","submission_required":true}'::jsonb,
     ARRAY['perspective', 'challenge', '30-day', 'technique'],
     true, 45),

    -- Critique Session
    ('organization', urban_sketch_org_id, drawing_id, 'session', 'critique_session',
     'Monthly Portfolio Review & Critique',
     'Bring 3-5 pieces from the past month. Each member gets 10 minutes for group feedback. Focus this month: composition and value structure. Constructive and supportive environment.',
     '2026-03-29 14:00:00+08',
     '{"frequency":"monthly","dayOfMonth":29,"startDate":"2026-01-29","endDate":"2026-12-29"}'::jsonb,
     'PMQ, Aberdeen Street, Hong Kong',
     '{"pieces_to_bring":5,"time_per_person_minutes":10,"focus":"composition_and_values","format":"group_critique"}'::jsonb,
     ARRAY['critique', 'portfolio', 'monthly', 'group'],
     true, 18),

    -- Master Copy
    ('organization', urban_sketch_org_id, drawing_id, 'session', 'master_copy',
     'Master Study: John Singer Sargent — Watercolor Landscapes',
     'Study session focused on Sargent''s loose watercolor technique. We will analyze three of his landscape watercolors, then attempt our own studies. Materials: watercolor set, 300gsm cold-press paper.',
     '2026-03-22 10:00:00+08',
     NULL,
     'Hong Kong Museum of Art, study room',
     '{"artist":"John Singer Sargent","medium":"watercolor","focus":"loose_technique","reference_works":["White Ships","Muddy Alligators","Gondoliers Siesta"],"materials":["watercolor_set","cold_press_300gsm","round_brushes"]}'::jsonb,
     ARRAY['master-study', 'sargent', 'watercolor', 'landscape'],
     true, 14)
  ON CONFLICT DO NOTHING;

  -- Drawing Coach Templates
  INSERT INTO betterat_activity_templates
    (publisher_type, publisher_id, interest_id, event_type, event_subtype, title, description, location, prefilled_data, tags, published, enrollment_count)
  VALUES
    ('user', coach_drawing_id, drawing_id, 'session', 'drawing_session',
     'Life Drawing: Long Pose — 3 Hours',
     'Studio session with a professional model. 20-minute poses with 5-minute breaks. Focus on proportion, gesture, and sustained observation. All media welcome.',
     'Art Central, Wong Chuk Hang',
     '{"subject":"life_model","pose_type":"long","pose_duration_minutes":20,"break_minutes":5,"total_duration_minutes":180,"medium_suggestions":["charcoal","conte","graphite"]}'::jsonb,
     ARRAY['life-drawing', 'long-pose', 'figure', 'studio'],
     true, 22),

    ('user', coach_drawing_id, drawing_id, 'session', 'study_sketch',
     'Gesture Drawing Warm-Up: 100 Gestures',
     'Quick-fire gesture drawing session. 30-second to 2-minute poses. Goal: capture the essence of movement and weight distribution in minimal marks. Great warmup before longer sessions.',
     'Online (Zoom)',
     '{"subject":"gesture","pose_durations":[30,60,120],"total_gestures":100,"duration_minutes":60,"medium":"any_dry","online":true}'::jsonb,
     ARRAY['gesture', 'warmup', 'figure', 'online'],
     true, 35)
  ON CONFLICT DO NOTHING;

  -- =========================================================================
  -- FITNESS — CrossFit / Gym Organization Templates
  -- =========================================================================

  INSERT INTO betterat_activity_templates
    (publisher_type, publisher_id, interest_id, event_type, event_subtype, title, description, scheduled_date, recurrence, location, prefilled_data, tags, published, enrollment_count)
  VALUES
    -- Strength Workout
    ('organization', crossfit_box_org_id, fitness_id, 'workout', 'strength',
     '12-Week Strength Program — Week 6, Day 2: Pull',
     'Back and bicep focused session. Main lifts: Barbell rows 5x5, weighted pull-ups 4x6, then accessory work. Progressive overload from Week 5 — add 2.5kg to rows.',
     '2026-03-11 06:00:00+08',
     '{"frequency":"weekly","dayOfWeek":3,"startDate":"2026-01-29","endDate":"2026-04-22"}'::jsonb,
     'Coastal Fitness, Kennedy Town',
     '{"program":"12_week_strength","week":6,"day":2,"focus":"pull","main_lifts":[{"exercise":"barbell_row","sets":5,"reps":5,"progression":"+2.5kg"},{"exercise":"weighted_pullup","sets":4,"reps":6}],"accessories":[{"exercise":"dumbbell_curl","sets":3,"reps":12},{"exercise":"face_pull","sets":3,"reps":15},{"exercise":"hammer_curl","sets":3,"reps":10}],"warmup":"5 min row + band pull-aparts","cooldown":"lat stretch + foam roll"}'::jsonb,
     ARRAY['strength', 'pull', 'back', 'program'],
     true, 34),

    -- HIIT
    ('organization', crossfit_box_org_id, fitness_id, 'workout', 'hiit',
     'WOD: "Fran" — Benchmark Workout',
     'Classic CrossFit benchmark. 21-15-9 reps of thrusters (43kg/30kg) and pull-ups. Scale as needed. Record your time — we will retest in 8 weeks.',
     '2026-03-12 07:00:00+08',
     NULL,
     'Coastal Fitness, Kennedy Town',
     '{"wod_name":"Fran","format":"21-15-9","exercises":[{"exercise":"thruster","rx_weight_kg":43,"scaled_weight_kg":30},{"exercise":"pullup","scaling":"banded_or_ring_rows"}],"time_cap_minutes":10,"benchmark":true,"retest_date":"2026-05-07"}'::jsonb,
     ARRAY['hiit', 'benchmark', 'fran', 'crossfit'],
     true, 48),

    -- Cardio
    ('organization', crossfit_box_org_id, fitness_id, 'workout', 'cardio',
     'Saturday Morning Run Club — 10K Tempo',
     'Group run along the waterfront. Warm-up jog 1km, then 8km at tempo pace (target: 5:00-5:30/km), 1km cool-down. All paces welcome — we have pace groups.',
     '2026-03-15 07:00:00+08',
     '{"frequency":"weekly","dayOfWeek":6,"startDate":"2026-01-04","endDate":"2026-06-27"}'::jsonb,
     'Kennedy Town Waterfront Promenade',
     '{"type":"tempo_run","distance_km":10,"warmup_km":1,"main_km":8,"cooldown_km":1,"target_pace":"5:00-5:30/km","pace_groups":["sub_4:30","4:30-5:00","5:00-5:30","5:30+"],"terrain":"flat_waterfront"}'::jsonb,
     ARRAY['cardio', 'running', 'tempo', 'group-run', 'saturday'],
     true, 26),

    -- Fitness Test
    ('organization', crossfit_box_org_id, fitness_id, 'workout', 'fitness_test',
     'Quarterly Fitness Assessment — Q1 2026',
     'Standardized fitness test: 1RM back squat, 1RM deadlift, max unbroken pull-ups, 2000m row, and body composition (optional). Compare against your Q4 2025 results.',
     '2026-03-28 08:00:00+08',
     NULL,
     'Coastal Fitness, Kennedy Town',
     '{"test_type":"quarterly_assessment","tests":[{"name":"back_squat_1rm","type":"strength"},{"name":"deadlift_1rm","type":"strength"},{"name":"max_pullups","type":"endurance"},{"name":"2000m_row","type":"cardio"},{"name":"body_composition","type":"measurement","optional":true}],"comparison_period":"Q4 2025"}'::jsonb,
     ARRAY['fitness-test', 'quarterly', 'assessment', '1RM'],
     true, 30),

    -- Competition
    ('organization', crossfit_box_org_id, fitness_id, 'workout', 'competition',
     'Hong Kong CrossFit League — Round 3',
     'Team competition: 3 workouts over the day. Teams of 4 (2M/2F). Registration closes March 20. Points count toward season standings.',
     '2026-04-05 09:00:00+08',
     NULL,
     'Asia World Expo, Hong Kong',
     '{"event_name":"HK CrossFit League","round":3,"format":"team","team_size":4,"team_composition":"2M_2F","num_workouts":3,"registration_deadline":"2026-03-20","points":"season_standings"}'::jsonb,
     ARRAY['competition', 'team', 'crossfit-league', 'hong-kong'],
     true, 16)
  ON CONFLICT DO NOTHING;

  -- Fitness Coach Templates
  INSERT INTO betterat_activity_templates
    (publisher_type, publisher_id, interest_id, event_type, event_subtype, title, description, location, prefilled_data, tags, published, enrollment_count)
  VALUES
    ('user', coach_fitness_id, fitness_id, 'workout', 'strength',
     'Olympic Lifting Technique Session',
     'Small group session focused on clean & jerk and snatch technique. We will work from the hang position, drilling the second pull and catch. Video analysis included. Max 6 athletes.',
     'Coastal Fitness, Kennedy Town',
     '{"focus":"olympic_lifting","exercises":["hang_clean","hang_snatch","clean_and_jerk"],"format":"technique","max_participants":6,"video_analysis":true,"duration_minutes":90}'::jsonb,
     ARRAY['olympic-lifting', 'technique', 'small-group', 'coached'],
     true, 18),

    ('user', coach_fitness_id, fitness_id, 'workout', 'sport',
     'Trail Running: Wilson Trail Section 2',
     'Guided trail run on Wilson Trail Section 2. Moderate difficulty, ~10km, ~600m elevation gain. We will work on uphill running form, descent technique, and pacing strategy.',
     'Wilson Trail Section 2, Quarry Bay → Tai Tam',
     '{"sport":"trail_running","route":"wilson_trail_section_2","distance_km":10,"elevation_gain_m":600,"difficulty":"moderate","focus":["uphill_form","descent_technique","pacing"],"duration_minutes":120}'::jsonb,
     ARRAY['trail-running', 'wilson-trail', 'outdoor', 'coached'],
     true, 12)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seeded activity templates for all four interests.';
END $$;
