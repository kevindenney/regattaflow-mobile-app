-- Seed HKIS & HKSF organizations with programs, blueprints, and steps
-- HKIS: Hong Kong International School (a1000005-0000-0000-0000-000000000005)
-- HKSF: Hong Kong Sailing Federation (a1000006-0000-0000-0000-000000000006)
-- Interest: sail-racing (5e6b64c3-ea92-42a1-baf5-9342c53eb7d9)
-- Author: d67f765e-7fe6-4f79-b514-f1b7f9a1ba3f

-- ═══════════════════════════════════════════════════════
-- 0. ORGANIZATIONS
-- ═══════════════════════════════════════════════════════

INSERT INTO organizations (id, name, slug, organization_type, join_mode, interest_slug)
VALUES
  ('a1000005-0000-0000-0000-000000000005', 'Hong Kong International School', 'hong-kong-international-school', 'institution', 'request_to_join', 'sail-racing'),
  ('a1000006-0000-0000-0000-000000000006', 'Hong Kong Sailing Federation', 'hong-kong-sailing-federation', 'association', 'open_join', 'sail-racing')
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  v_hkis_id     uuid := 'a1000005-0000-0000-0000-000000000005';
  v_hksf_id     uuid := 'a1000006-0000-0000-0000-000000000006';
  v_interest_id uuid := '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9';
  v_author_id   uuid := 'd67f765e-7fe6-4f79-b514-f1b7f9a1ba3f';

  -- HKIS Program IDs
  v_prog_school     uuid := gen_random_uuid();
  v_prog_interschool uuid := gen_random_uuid();
  v_prog_watersports uuid := gen_random_uuid();

  -- HKSF Program IDs
  v_prog_junior     uuid := gen_random_uuid();
  v_prog_dinghy     uuid := gen_random_uuid();
  v_prog_instructor uuid := gen_random_uuid();
  v_prog_hp         uuid := gen_random_uuid();

  -- HKIS Blueprint IDs
  v_bp_school       uuid := gen_random_uuid();
  v_bp_interschool  uuid := gen_random_uuid();
  v_bp_watersports  uuid := gen_random_uuid();

  -- HKSF Blueprint IDs
  v_bp_junior       uuid := gen_random_uuid();
  v_bp_dinghy       uuid := gen_random_uuid();
  v_bp_instructor   uuid := gen_random_uuid();
  v_bp_hp           uuid := gen_random_uuid();

  -- HKIS Step IDs — School Sailing Programme
  v_s_js1           uuid := gen_random_uuid();
  v_s_js2           uuid := gen_random_uuid();
  v_s_js3           uuid := gen_random_uuid();
  v_s_js4           uuid := gen_random_uuid();
  v_s_afterschool   uuid := gen_random_uuid();

  -- HKIS Step IDs — Inter-School Racing Squad
  v_s_selection     uuid := gen_random_uuid();
  v_s_training_blk  uuid := gen_random_uuid();
  v_s_issf          uuid := gen_random_uuid();
  v_s_hhyc24        uuid := gen_random_uuid();

  -- HKIS Step IDs — Water Sports Pathway
  v_s_swim          uuid := gen_random_uuid();
  v_s_comp_swim     uuid := gen_random_uuid();
  v_s_intro_sail    uuid := gen_random_uuid();
  v_s_rowing        uuid := gen_random_uuid();

  -- HKSF Step IDs — Junior Dinghy Scheme
  v_s_jds1          uuid := gen_random_uuid();
  v_s_jds2          uuid := gen_random_uuid();
  v_s_jds3          uuid := gen_random_uuid();
  v_s_jds4          uuid := gen_random_uuid();

  -- HKSF Step IDs — Dinghy Sail Training Scheme
  v_s_intro         uuid := gen_random_uuid();
  v_s_l1            uuid := gen_random_uuid();
  v_s_l2            uuid := gen_random_uuid();
  v_s_l3            uuid := gen_random_uuid();
  v_s_l4            uuid := gen_random_uuid();

  -- HKSF Step IDs — Instructor Development
  v_s_asst_instr    uuid := gen_random_uuid();
  v_s_dinghy_instr  uuid := gen_random_uuid();
  v_s_senior_instr  uuid := gen_random_uuid();
  v_s_trainer       uuid := gen_random_uuid();

  -- HKSF Step IDs — Youth High Performance
  v_s_dev_squad     uuid := gen_random_uuid();
  v_s_regional      uuid := gen_random_uuid();
  v_s_elite         uuid := gen_random_uuid();
  v_s_olympic       uuid := gen_random_uuid();
  v_s_selection_reg uuid := gen_random_uuid();

BEGIN

-- ═══════════════════════════════════════════════════════
-- 1. PROGRAMS
-- ═══════════════════════════════════════════════════════

-- HKIS Programs
INSERT INTO programs (id, organization_id, domain, title, description, type, status, metadata, interest_id) VALUES

(v_prog_school, v_hkis_id, 'sailing', 'School Sailing Programme',
 'Progressive after-school sailing programme following the HKSSA Junior Sail scheme. From first-time sailors through to race-ready students, with sessions at RHKYC Middle Island.',
 'training_pathway', 'active',
 '{"unit":"term","max_participants":24,"location":"RHKYC Middle Island","certification_body":"HKSSA/HKSF"}'::jsonb,
 v_interest_id),

(v_prog_interschool, v_hkis_id, 'sailing', 'Inter-School Racing Squad',
 'Competitive sailing squad representing HKIS at inter-school events. Weekend training at RHKYC Middle Island with professional coaches, competing at the RHKYC Inter-School Sailing Festival and HHYC 24-Hour Race.',
 'competitive_squad', 'active',
 '{"unit":"season","max_participants":16,"location":"RHKYC Middle Island","selection":"tryout"}'::jsonb,
 v_interest_id),

(v_prog_watersports, v_hkis_id, 'sailing', 'Water Sports Pathway',
 'Multi-sport aquatic pathway showing how students can progress through swimming, sailing, and rowing across school seasons. Demonstrates breadth of water sports available at HKIS.',
 'multi_sport', 'active',
 '{"unit":"academic_year","sports":["swimming","sailing","rowing"]}'::jsonb,
 v_interest_id);

-- HKSF Programs
INSERT INTO programs (id, organization_id, domain, title, description, type, status, metadata, interest_id) VALUES

(v_prog_junior, v_hksf_id, 'sailing', 'Junior Dinghy Scheme JS1–JS4',
 'Government-subsidised junior sailing scheme for ages 8-12. Four progressive stages from water confidence to racing readiness in Optimist dinghies. The national standard for youth sailing development.',
 'training_pathway', 'active',
 '{"unit":"course","age_range":"8-12","certification_body":"HKSF","subsidy":"govt_subsidised","boat_class":"Optimist"}'::jsonb,
 v_interest_id),

(v_prog_dinghy, v_hksf_id, 'sailing', 'Dinghy Sail Training Scheme L1–L4',
 'The national dinghy sailing standard for Hong Kong. Four progressive levels from introduction to advanced sailing. This is the same syllabus taught at all HKSF-approved centres including RHKYC.',
 'training_pathway', 'active',
 '{"unit":"course","certification_body":"HKSF","approved_centres":["RHKYC","HHYC","ABC"]}'::jsonb,
 v_interest_id),

(v_prog_instructor, v_hksf_id, 'sailing', 'Instructor Development Pathway',
 'Professional development pathway from Assistant Instructor to Dinghy Trainer. Certifies sailing instructors to teach at HKSF-approved centres across Hong Kong.',
 'professional_development', 'active',
 '{"unit":"certification","certification_body":"HKSF","validity_years":5}'::jsonb,
 v_interest_id),

(v_prog_hp, v_hksf_id, 'sailing', 'Youth High Performance Pathway',
 'Elite youth sailing development pathway from talent identification through to Olympic Development. Partnership with Hong Kong Sports Institute (HKSI) for full-time elite athletes.',
 'high_performance', 'active',
 '{"unit":"season","partner":"HKSI","selection":"squad_selection","boat_classes":["Optimist","ILCA 4","ILCA 7","29er","49er"]}'::jsonb,
 v_interest_id);

-- ═══════════════════════════════════════════════════════
-- 2. TIMELINE STEPS
-- ═══════════════════════════════════════════════════════

-- ── HKIS: School Sailing Programme ──

INSERT INTO timeline_steps (id, user_id, interest_id, organization_id, source_type, title, description, category, status, visibility, sort_order, location_name, metadata) VALUES

(v_s_js1, v_author_id, v_interest_id, v_hkis_id, 'blueprint', 'HKSSA Junior Sail 1 — Introduction to Sailing',
 'First-time sailing experience for HKIS students. Learn basic boat parts, wind awareness, and steering with an instructor aboard. Safety-focused sessions in sheltered Deep Water Bay.',
 'general', 'pending', 'organization', 1, 'RHKYC Middle Island, Deep Water Bay',
 '{"plan":{"what_will_you_do":"Complete HKSSA Junior Sail 1 — your first time on the water","how_sub_steps":["Learn the parts of a dinghy (hull, tiller, mainsheet, boom)","Understand where the wind comes from","Steer a boat with a tiller under instructor guidance","Go sailing in a double-handed dinghy","Capsize drill in shallow water — safe and supervised"],"where_location":"RHKYC Middle Island","duration":"4 after-school sessions","prerequisites":"None — absolute beginners","certification":"HKSSA Junior Sail 1","cross_org":"Equivalent to HKSF JS1 at federation level"}}'::jsonb),

(v_s_js2, v_author_id, v_interest_id, v_hkis_id, 'blueprint', 'HKSSA Junior Sail 2 — Building Skills',
 'Progress from JS1. Students begin sailing with less instructor assistance, learn to tack, and develop awareness of wind shifts. Emphasis on teamwork in double-handed boats.',
 'general', 'pending', 'organization', 2, 'RHKYC Middle Island, Deep Water Bay',
 '{"plan":{"what_will_you_do":"Build independence and core sailing skills","how_sub_steps":["Tacking without instructor help","Basic sail trim — pulling in and letting out","Sailing a short course around marks","Introduction to right-of-way through games","Rigging and de-rigging with minimal supervision"],"where_location":"RHKYC Middle Island","duration":"4 after-school sessions","prerequisites":"Junior Sail 1","certification":"HKSSA Junior Sail 2"}}'::jsonb),

(v_s_js3, v_author_id, v_interest_id, v_hkis_id, 'blueprint', 'HKSSA Junior Sail 3 — Confident Sailing',
 'Students sail independently in light to moderate conditions. Covers gybing, points of sail, and basic racing concepts. Students ready for JS3 can participate in fun regattas.',
 'general', 'pending', 'organization', 3, 'RHKYC Middle Island, Deep Water Bay',
 '{"plan":{"what_will_you_do":"Become a confident independent sailor","how_sub_steps":["Sail all points of sail including a beam reach and run","Confident gybing in light conditions","Understand the racing course — upwind, reaching, downwind","Participate in fun regatta races with classmates","Self-rescue and capsize recovery without help"],"where_location":"RHKYC Middle Island","duration":"6 after-school sessions","prerequisites":"Junior Sail 2","certification":"HKSSA Junior Sail 3","cross_org":"Equivalent to HKSF JS3 — qualifies for HKSF Level 1 entry"}}'::jsonb),

(v_s_js4, v_author_id, v_interest_id, v_hkis_id, 'blueprint', 'HKSSA Junior Sail 4 — Race Ready',
 'Advanced junior sailing covering racing rules, start-line technique, and mark rounding. Graduates are ready for inter-school competition and can trial for the HKIS Racing Squad.',
 'general', 'pending', 'organization', 4, 'RHKYC Middle Island, Deep Water Bay',
 '{"plan":{"what_will_you_do":"Develop racing skills and prepare for competitive sailing","how_sub_steps":["Racing Rules of Sailing basics (port/starboard, windward/leeward)","Start-line positioning and timing","Mark rounding technique","Tactical awareness — wind shifts and current","Sail in moderate conditions (10-15 knots) confidently"],"where_location":"RHKYC Middle Island","duration":"6 after-school sessions","prerequisites":"Junior Sail 3","certification":"HKSSA Junior Sail 4","cross_org":"HKSF JS4 graduates feed into RHKYC SHARKS and HKIS Inter-School Squad"}}'::jsonb),

(v_s_afterschool, v_author_id, v_interest_id, v_hkis_id, 'blueprint', 'After-School Practice Sessions',
 'Regular Wednesday afternoon sailing practice for all JS1-JS4 students. Unstructured water time supervised by HKIS sailing coordinator and RHKYC instructors. Build confidence and log hours.',
 'general', 'pending', 'organization', 5, 'RHKYC Middle Island, Deep Water Bay',
 '{"plan":{"what_will_you_do":"Log sailing hours and practise skills in a relaxed setting","how_sub_steps":["Free sailing in Deep Water Bay","Practise skills from your current JS level","Informal races and sailing games","Log sailing hours toward HKSF certification","Build friendships with fellow HKIS sailors"],"where_location":"RHKYC Middle Island","duration":"Wednesday afternoons, term-time","prerequisites":"Currently enrolled in JS1 or above"}}'::jsonb);

-- ── HKIS: Inter-School Racing Squad ──

INSERT INTO timeline_steps (id, user_id, interest_id, organization_id, source_type, title, description, category, status, visibility, sort_order, location_name, metadata) VALUES

(v_s_selection, v_author_id, v_interest_id, v_hkis_id, 'blueprint', 'Squad Selection & Fitness Testing',
 'Annual tryout for the HKIS Inter-School Racing Squad. Includes on-water sailing assessment, fitness testing (swimming, running), and interview. Open to students who have completed JS3 or above.',
 'general', 'pending', 'organization', 1, 'RHKYC Middle Island / HKIS Campus',
 '{"plan":{"what_will_you_do":"Trial for a place on the HKIS Inter-School Racing Squad","how_sub_steps":["On-water sailing assessment — boat handling and racing skills","Swim test — 50m in sailing gear","Fitness assessment — beep test and core strength","Interview with coaching team — commitment and availability","Selection announcement and squad confirmation"],"where_location":"RHKYC Middle Island / HKIS Campus","duration":"1 day tryout (September)","prerequisites":"HKSSA Junior Sail 3 minimum, JS4 preferred"}}'::jsonb),

(v_s_training_blk, v_author_id, v_interest_id, v_hkis_id, 'blueprint', 'Squad Training Block (weekend at RHKYC Middle Island)',
 'Intensive weekend training blocks with professional coaches. Covers race starts, mark rounding, boat speed, and fleet tactics. Training in Optimist, ILCA 4, and RS Feva depending on age and ability.',
 'general', 'pending', 'organization', 2, 'RHKYC Middle Island, Deep Water Bay',
 '{"plan":{"what_will_you_do":"Train intensively as a squad for upcoming inter-school events","how_sub_steps":["Race starts — timing, positioning, and acceleration","Mark rounding drills — inside overlap and tactical approaches","Boat speed testing — sail trim, hiking, and VMG","Fleet racing practice — 6-8 short races per session","Video debrief and tactical discussion"],"where_location":"RHKYC Middle Island","duration":"Weekends, Oct-Apr (6 blocks)","prerequisites":"Squad selection","cross_org":"Training at RHKYC facility alongside RHKYC SHARKS squad members"}}'::jsonb),

(v_s_issf, v_author_id, v_interest_id, v_hkis_id, 'blueprint', 'RHKYC Inter-School Sailing Festival',
 'The marquee inter-school sailing event in Hong Kong. HKIS placed 3rd in 2025. Two-day regatta at RHKYC Middle Island with teams from international and local schools competing in Optimist and ILCA classes.',
 'general', 'pending', 'organization', 3, 'RHKYC Middle Island, Deep Water Bay',
 '{"plan":{"what_will_you_do":"Represent HKIS at the RHKYC Inter-School Sailing Festival","how_sub_steps":["Pre-regatta boat preparation and equipment check","Practice race and course familiarisation","Day 1: fleet racing (4-6 races)","Day 2: fleet racing and medal race","Prize-giving and team debrief"],"where_location":"RHKYC Middle Island","duration":"2 days (February/March)","prerequisites":"Squad member, selected by coach","cross_org":"Hosted by RHKYC — HKIS placed 3rd in 2025. HKSF-sanctioned event"}}'::jsonb),

(v_s_hhyc24, v_author_id, v_interest_id, v_hkis_id, 'blueprint', 'HHYC 24-Hour Charity Dinghy Race',
 'Annual 24-hour team relay dinghy race at Hebe Haven Yacht Club. A test of endurance, teamwork, and sailing in all conditions including night sailing. Great team-building event for the squad.',
 'general', 'pending', 'organization', 4, 'Hebe Haven Yacht Club, Sai Kung',
 '{"plan":{"what_will_you_do":"Compete as a team in the 24-hour relay dinghy race","how_sub_steps":["Team roster and rotation planning","Day sailing legs — maximize speed","Night sailing legs — navigation lights and safety","Pit crew duties — boat changeover, food, rest","Final sprint and finish celebrations"],"where_location":"Hebe Haven Yacht Club, Sai Kung","duration":"24 hours (November)","prerequisites":"Squad member, parental consent for overnight"}}'::jsonb);

-- ── HKIS: Water Sports Pathway ──

INSERT INTO timeline_steps (id, user_id, interest_id, organization_id, source_type, title, description, category, status, visibility, sort_order, location_name, metadata) VALUES

(v_s_swim, v_author_id, v_interest_id, v_hkis_id, 'blueprint', 'Learn to Swim — School Aquatics',
 'Foundation water confidence through the HKIS aquatics programme. All students develop swimming proficiency as part of the PE curriculum. Strong swimmers have an advantage entering sailing.',
 'general', 'pending', 'organization', 1, 'HKIS Repulse Bay Campus Pool',
 '{"plan":{"what_will_you_do":"Build water confidence and swimming skills through school PE","how_sub_steps":["Learn four competitive strokes","Treading water and survival floating","50m swim test — prerequisite for all water sports","Water safety and rescue awareness","Pool-based kayak and paddleboard introduction"],"where_location":"HKIS Repulse Bay Campus","duration":"PE curriculum, Year 5-8","prerequisites":"None"}}'::jsonb),

(v_s_comp_swim, v_author_id, v_interest_id, v_hkis_id, 'blueprint', 'Competitive Swimming — Season Sport',
 'HKIS varsity and JV swimming programme. Season sport that builds fitness, water confidence, and competitive mindset — all transferable to sailing performance.',
 'general', 'pending', 'organization', 2, 'HKIS Repulse Bay Campus Pool',
 '{"plan":{"what_will_you_do":"Compete in the HKIS swim team to build fitness and competitive experience","how_sub_steps":["Daily squad training — endurance and speed sets","ISSFHK swim meets — individual and relay events","Build aerobic fitness applicable to hiking and trapezing","Develop competitive mindset and race-day preparation","Earn varsity letter in swimming"],"where_location":"HKIS Repulse Bay Campus","duration":"Season 1 (Sep-Nov)","prerequisites":"Swim team tryout"}}'::jsonb),

(v_s_intro_sail, v_author_id, v_interest_id, v_hkis_id, 'blueprint', 'Introduction to Sailing — After School',
 'Entry point into the HKIS sailing programme. After-school activity introducing students to dinghy sailing at RHKYC Middle Island. Feeds into the School Sailing Programme (JS1-JS4).',
 'general', 'pending', 'organization', 3, 'RHKYC Middle Island, Deep Water Bay',
 '{"plan":{"what_will_you_do":"Try sailing for the first time through the HKIS after-school programme","how_sub_steps":["Bus transport from HKIS to RHKYC Middle Island","Safety briefing and equipment fitting","Instructor-led sailing in double-handed dinghies","Learn basic steering and wind awareness","Decide whether to continue into the JS1-JS4 programme"],"where_location":"RHKYC Middle Island","duration":"After-school activity, 6 sessions","prerequisites":"50m swim test passed","cross_org":"Sessions delivered by RHKYC instructors at RHKYC Middle Island"}}'::jsonb),

(v_s_rowing, v_author_id, v_interest_id, v_hkis_id, 'blueprint', 'Rowing — Spring Sport',
 'HKIS rowing programme in Sai Kung waters. Complementary water sport that builds endurance, teamwork, and boat-handling instincts applicable across all water sports.',
 'general', 'pending', 'organization', 4, 'Sai Kung / HKIS Boathouse',
 '{"plan":{"what_will_you_do":"Learn to row and compete with the HKIS rowing team","how_sub_steps":["Learn sculling technique in singles and doubles","Progress to sweep rowing in fours and eights","Build endurance and power applicable to sailing","Compete in ISSFHK rowing regattas","Develop boat feel and balance transferable to dinghy sailing"],"where_location":"Sai Kung","duration":"Season 3 (Mar-May)","prerequisites":"Fitness assessment, 50m swim test"}}'::jsonb);

-- ── HKSF: Junior Dinghy Scheme JS1-JS4 ──

INSERT INTO timeline_steps (id, user_id, interest_id, organization_id, source_type, title, description, category, status, visibility, sort_order, location_name, metadata) VALUES

(v_s_jds1, v_author_id, v_interest_id, v_hksf_id, 'blueprint', 'JS1 — Water Confidence & Boat Familiarisation',
 'Government-subsidised introductory course for children aged 8-12. Build water confidence and learn basic boat familiarisation in Optimist dinghies. All equipment provided. Available at approved centres across Hong Kong.',
 'general', 'pending', 'organization', 1, 'HKSF Approved Centres across Hong Kong',
 '{"plan":{"what_will_you_do":"Complete Junior Sail 1 — build water confidence in an Optimist dinghy","how_sub_steps":["Water confidence exercises and swimming assessment","Learn parts of an Optimist dinghy","Sit in the boat and understand balance","Basic steering with tiller — going where you want","Capsize drill — getting back in the boat safely"],"where_location":"HKSF Approved Centres","duration":"2 sessions","prerequisites":"Able to swim 25m, ages 8-12","certification":"HKSF Junior Sail 1","subsidy":"Government-subsidised — reduced fee for eligible children","cross_org":"Same JS scheme taught at HKIS school programme and RHKYC youth academy"}}'::jsonb),

(v_s_jds2, v_author_id, v_interest_id, v_hksf_id, 'blueprint', 'JS2 — Basic Sailing Skills',
 'Build on JS1 foundations. Children sail with decreasing instructor assistance, learn to tack, and begin understanding wind direction. Emphasis on fun, safety, and building good habits.',
 'general', 'pending', 'organization', 2, 'HKSF Approved Centres across Hong Kong',
 '{"plan":{"what_will_you_do":"Develop basic sailing skills and start sailing more independently","how_sub_steps":["Tacking — changing direction through the wind","Understanding where the wind comes from","Sail trim basics — pulling in and letting out the mainsheet","Sailing a short course with instructor alongside","Rigging and launching with help"],"where_location":"HKSF Approved Centres","duration":"4 sessions","prerequisites":"HKSF JS1","certification":"HKSF Junior Sail 2"}}'::jsonb),

(v_s_jds3, v_author_id, v_interest_id, v_hksf_id, 'blueprint', 'JS3 — Independent Sailing',
 'Sailors begin sailing independently without instructor in the boat. Covers all points of sail, gybing, and introduction to racing through games. JS3 graduates can enter HKSF Level 1.',
 'general', 'pending', 'organization', 3, 'HKSF Approved Centres across Hong Kong',
 '{"plan":{"what_will_you_do":"Sail independently and learn all points of sail","how_sub_steps":["Sail all points of sail — close-hauled to run","Gybing in light conditions","Self-rescue without instructor assistance","Introduction to racing through games and fun regattas","Understand right-of-way basics"],"where_location":"HKSF Approved Centres","duration":"6 sessions","prerequisites":"HKSF JS2","certification":"HKSF Junior Sail 3","cross_org":"JS3 is the entry requirement for HKSF Level 1 adult scheme"}}'::jsonb),

(v_s_jds4, v_author_id, v_interest_id, v_hksf_id, 'blueprint', 'JS4 — Racing Readiness',
 'Advanced junior sailing covering racing rules, start technique, and mark rounding. Graduates are ready for youth racing at any Hong Kong club and can feed into RHKYC SHARKS or school racing squads.',
 'general', 'pending', 'organization', 4, 'HKSF Approved Centres across Hong Kong',
 '{"plan":{"what_will_you_do":"Become race-ready and prepare for competitive youth sailing","how_sub_steps":["Racing Rules of Sailing — port/starboard, windward/leeward","Start-line technique and countdown timing","Mark rounding — tactical approaches","Sail in moderate conditions (10-15 knots)","Compete in HKSF-sanctioned youth regattas"],"where_location":"HKSF Approved Centres","duration":"6 sessions","prerequisites":"HKSF JS3","certification":"HKSF Junior Sail 4","cross_org":"JS4 graduates feed into RHKYC SHARKS squad, HKIS Inter-School squad, and club youth programmes"}}'::jsonb);

-- ── HKSF: Dinghy Sail Training Scheme L1-L4 ──

INSERT INTO timeline_steps (id, user_id, interest_id, organization_id, source_type, title, description, category, status, visibility, sort_order, location_name, metadata) VALUES

(v_s_intro, v_author_id, v_interest_id, v_hksf_id, 'blueprint', 'Introduction to Sailing (pre-Level 1 taster)',
 'Half-day taster session for adults and older youth who want to try sailing before committing to the full Level 1 course. No experience required. Available at all HKSF-approved centres.',
 'general', 'pending', 'organization', 1, 'HKSF Approved Centres across Hong Kong',
 '{"plan":{"what_will_you_do":"Try sailing for the first time in a guided taster session","how_sub_steps":["Safety briefing and equipment fitting","Go sailing with an instructor in a double-handed dinghy","Feel the wind and understand basic steering","Learn three knots — figure of eight, reef knot, bowline","Decide if you want to continue to Level 1"],"where_location":"HKSF Approved Centres","duration":"Half day (3-4 hours)","prerequisites":"None — absolute beginners welcome"}}'::jsonb),

(v_s_l1, v_author_id, v_interest_id, v_hksf_id, 'blueprint', 'HKSF Level 1 — Learn to Sail',
 'The national standard introductory sailing course. Two-day course (14 hours) covering basic sailing theory, rigging, launching, steering, tacking, and capsize recovery. This is the same syllabus taught at RHKYC and all approved centres.',
 'general', 'pending', 'organization', 2, 'HKSF Approved Centres across Hong Kong',
 '{"plan":{"what_will_you_do":"Complete the HKSF Level 1 national sailing certificate","how_sub_steps":["Understand wind direction and points of sail","Rig and launch a training dinghy","Helm upwind and downwind in light conditions","Perform tacking manoeuvre","Capsize recovery drill — self-rescue"],"where_location":"HKSF Approved Centres","duration":"2 days (14 hours)","prerequisites":"None, or JS3 for youth","certification":"HKSF Level 1 Certificate","cross_org":"Same syllabus as RHKYC Learn to Sail — HKSF Level 1. Recognised at all approved centres in Hong Kong"}}'::jsonb),

(v_s_l2, v_author_id, v_interest_id, v_hksf_id, 'blueprint', 'HKSF Level 2 — Basic Skills',
 'Four-day course (28 hours) building on Level 1. Sail a dinghy without instructor assistance in light to moderate winds. Covers five essentials, gybing, sailing backwards, and lee-shore landings.',
 'general', 'pending', 'organization', 3, 'HKSF Approved Centres across Hong Kong',
 '{"plan":{"what_will_you_do":"Achieve competent dinghy helm in moderate conditions","how_sub_steps":["Master the five essentials of dinghy sailing","Confident tacking and gybing in varying wind","Lee shore launching and landing","Man overboard recovery","Navigate a simple course"],"where_location":"HKSF Approved Centres","duration":"4 days (28 hours)","prerequisites":"HKSF Level 1 or Junior Sail 3","certification":"HKSF Level 2 Certificate","cross_org":"Same syllabus as RHKYC HKSF Level 2 course"}}'::jsonb),

(v_s_l3, v_author_id, v_interest_id, v_hksf_id, 'blueprint', 'HKSF Level 3 — Intermediate Sailing',
 'Five-day advanced course. Confident sailing in moderate to fresh conditions. Covers asymmetric spinnaker introduction, seamanship, weather, and passage planning. Required for instructor pathway entry.',
 'general', 'pending', 'organization', 4, 'HKSF Approved Centres across Hong Kong',
 '{"plan":{"what_will_you_do":"Become an intermediate-level dinghy sailor","how_sub_steps":["Sail confidently in 15+ knot winds","Introduction to asymmetric spinnaker","Weather interpretation for sailing decisions","Seamanship and rope work","Log 40 sailing hours between Level 2 and 3"],"where_location":"HKSF Approved Centres","duration":"5 days","prerequisites":"HKSF Level 2 + 40 logged sailing hours","certification":"HKSF Level 3 Certificate","cross_org":"Level 3 is the prerequisite for HKSF Assistant Instructor qualification"}}'::jsonb),

(v_s_l4, v_author_id, v_interest_id, v_hksf_id, 'blueprint', 'HKSF Level 4 — Advanced Sailing',
 'The highest level of the HKSF Dinghy Sail Training Scheme. Advanced boat handling, racing tactics, and independent seamanship. Graduates are competent to sail in challenging conditions and compete at club level.',
 'general', 'pending', 'organization', 5, 'HKSF Approved Centres across Hong Kong',
 '{"plan":{"what_will_you_do":"Achieve the highest HKSF dinghy sailing certification","how_sub_steps":["Advanced boat handling in strong winds (20+ knots)","Symmetric spinnaker handling","Racing tactics and strategy","Passage planning and navigation","Independent decision-making in challenging conditions"],"where_location":"HKSF Approved Centres","duration":"5 days","prerequisites":"HKSF Level 3 + significant sailing experience","certification":"HKSF Level 4 Certificate","cross_org":"Level 4 holders can teach at assistant level and compete at national regattas"}}'::jsonb);

-- ── HKSF: Instructor Development Pathway ──

INSERT INTO timeline_steps (id, user_id, interest_id, organization_id, source_type, title, description, category, status, visibility, sort_order, location_name, metadata) VALUES

(v_s_asst_instr, v_author_id, v_interest_id, v_hksf_id, 'blueprint', 'Assistant Instructor',
 'Entry-level instructor qualification for sailors aged 14+. Assist qualified instructors in delivering JS and Level 1-2 courses. Requires HKSF Level 3 and first aid certification.',
 'general', 'pending', 'organization', 1, 'HKSF Training Centre',
 '{"plan":{"what_will_you_do":"Qualify as an HKSF Assistant Instructor","how_sub_steps":["Teaching theory — how people learn to sail","Assisting on-water sessions under supervision","Safety and rescue boat handling","Group management and communication skills","Assessment: practical teaching demonstration"],"where_location":"HKSF Training Centre","duration":"3-day course + assessment","prerequisites":"Age 14+, HKSF Level 3, valid first aid certificate","certification":"HKSF Assistant Instructor","cross_org":"Can assist at any HKSF-approved centre including RHKYC"}}'::jsonb),

(v_s_dinghy_instr, v_author_id, v_interest_id, v_hksf_id, 'blueprint', 'Dinghy Instructor',
 'Full instructor qualification to teach HKSF Level 1-2 courses independently. Five-year validity with CPD requirements. The core qualification for professional sailing instructors in Hong Kong.',
 'general', 'pending', 'organization', 2, 'HKSF Training Centre',
 '{"plan":{"what_will_you_do":"Qualify as a full HKSF Dinghy Instructor","how_sub_steps":["Advanced teaching methodology","Session planning and delivery for L1-2 courses","On-water coaching techniques and demonstrations","Safety management and risk assessment","Assessment: full teaching session observation and viva"],"where_location":"HKSF Training Centre","duration":"5-day course + assessment","prerequisites":"Assistant Instructor + 30 hours assisting + HKSF Level 3","certification":"HKSF Dinghy Instructor (5-year validity)","cross_org":"Teaches at all approved centres — RHKYC, HHYC, ABC, school programmes including HKIS"}}'::jsonb),

(v_s_senior_instr, v_author_id, v_interest_id, v_hksf_id, 'blueprint', 'Senior Instructor',
 'Advanced instructor qualification to teach the full HKSF L1-4 syllabus and manage sailing centre operations. Can supervise and mentor Dinghy Instructors.',
 'general', 'pending', 'organization', 3, 'HKSF Training Centre',
 '{"plan":{"what_will_you_do":"Qualify as an HKSF Senior Instructor","how_sub_steps":["Teaching Level 3-4 syllabus — advanced boat handling and racing","Centre management and operations","Instructor supervision and mentoring","Fleet management and maintenance oversight","Assessment: advanced teaching and centre management scenarios"],"where_location":"HKSF Training Centre","duration":"5-day course + assessment","prerequisites":"Dinghy Instructor + 100 hours teaching + HKSF Level 4","certification":"HKSF Senior Instructor","cross_org":"Can manage sailing programmes at any approved centre"}}'::jsonb),

(v_s_trainer, v_author_id, v_interest_id, v_hksf_id, 'blueprint', 'Dinghy Trainer',
 'The highest instructor qualification in Hong Kong. Trains and assesses new instructors on behalf of HKSF. Appointed by HKSF — not a course you can simply sign up for.',
 'general', 'pending', 'organization', 4, 'HKSF Headquarters',
 '{"plan":{"what_will_you_do":"Be appointed as an HKSF Dinghy Trainer — training the trainers","how_sub_steps":["Deliver Assistant Instructor and Dinghy Instructor courses","Assess instructor candidates on behalf of HKSF","Develop and update HKSF syllabus materials","Represent HKSF at national and international instructor conferences","Mentor Senior Instructors across approved centres"],"where_location":"HKSF Headquarters / various centres","duration":"By HKSF appointment","prerequisites":"Senior Instructor + significant teaching and assessment experience","certification":"HKSF Dinghy Trainer (by appointment)","cross_org":"Trains instructors who teach at RHKYC, HKIS, HHYC, and all approved centres across HK"}}'::jsonb);

-- ── HKSF: Youth High Performance Pathway ──

INSERT INTO timeline_steps (id, user_id, interest_id, organization_id, source_type, title, description, category, status, visibility, sort_order, location_name, metadata) VALUES

(v_s_dev_squad, v_author_id, v_interest_id, v_hksf_id, 'blueprint', 'Development Squad — Talent Identification',
 'Entry-level squad for promising young sailors aged 10-14. Talent identification through club racing results and HKSF selection regattas. Training in Optimist and ILCA 4 classes.',
 'general', 'pending', 'organization', 1, 'Various Hong Kong sailing venues',
 '{"plan":{"what_will_you_do":"Be identified and selected for the HKSF Development Squad","how_sub_steps":["Compete in HKSF selection regattas and club championships","Performance tracking — race results and improvement trajectory","Squad training camps during school holidays","Boat speed development in Optimist or ILCA 4","Represent Hong Kong at regional junior events"],"where_location":"Various HK venues","duration":"Year-round, 2-3 sessions per week","prerequisites":"HKSF JS4 or Level 2+, competitive club racing record","boat_class":"Optimist / ILCA 4","cross_org":"Scouts talent from RHKYC SHARKS, HKIS squads, and all club youth programmes"}}'::jsonb),

(v_s_regional, v_author_id, v_interest_id, v_hksf_id, 'blueprint', 'Regional Squad — National Representation',
 'Selection for Hong Kong national team representation at Asian and World Championship events. Transition from Optimist to ILCA and 29er classes. Intensive training 4-5 times per week.',
 'general', 'pending', 'organization', 2, 'HKSI / Middle Island / various international venues',
 '{"plan":{"what_will_you_do":"Represent Hong Kong at regional and world championship events","how_sub_steps":["Transition to high-performance class — ILCA 6 or 29er","Train 4-5 times per week with national coach","Compete at Asian Sailing Championships","Attend ISAF Youth Worlds","Sports science support — fitness testing and nutrition"],"where_location":"HKSI / RHKYC Middle Island","duration":"Year-round, 4-5 sessions per week","prerequisites":"Development Squad results, HKSF selection criteria","boat_class":"ILCA 6 / 29er"}}'::jsonb),

(v_s_elite, v_author_id, v_interest_id, v_hksf_id, 'blueprint', 'HKSI Elite Programme — Skiff Pathway',
 'Full-time elite training programme at Hong Kong Sports Institute. Partnership between HKSF and HKSI. Athletes train daily with professional coaches, sports science, and full funding.',
 'general', 'pending', 'organization', 3, 'Hong Kong Sports Institute, Sha Tin',
 '{"plan":{"what_will_you_do":"Train full-time as an elite sailor at HKSI","how_sub_steps":["Full-time daily training programme (6 days/week)","Professional coaching team — sailing, fitness, psychology","Compete on international 29er circuit","Sports science — biomechanics, nutrition, physiology","Education support — balance studies with training"],"where_location":"HKSI, Sha Tin","duration":"Full-time, multi-year programme","prerequisites":"Regional Squad selection, HKSF/HKSI approval","boat_class":"29er","cross_org":"Partnership with HKSI — Hong Kong government elite sport funding"}}'::jsonb),

(v_s_olympic, v_author_id, v_interest_id, v_hksf_id, 'blueprint', 'Olympic Development — Senior Transition',
 'Transition from youth to senior international competition. Athletes move to Olympic-class boats (49er or ILCA 7) and target Asian Games and Olympic qualification.',
 'general', 'pending', 'organization', 4, 'HKSI / International training venues',
 '{"plan":{"what_will_you_do":"Transition to Olympic-class sailing and target major games","how_sub_steps":["Transition to 49er or ILCA 7 Olympic class","International regatta calendar — World Cups, Europeans, Worlds","Asian Games and Olympic qualifying pathway","Overseas training camps — Europe and Australia","Professional athlete lifestyle management"],"where_location":"HKSI / International","duration":"Full-time, 4-year Olympic cycle","prerequisites":"HKSI Elite Programme graduate","boat_class":"49er / ILCA 7"}}'::jsonb),

(v_s_selection_reg, v_author_id, v_interest_id, v_hksf_id, 'blueprint', 'Selection Regatta & National Championships',
 'Annual HKSF National Championships and selection regattas that determine squad places and national team representation. Open to all competitive sailors in Hong Kong.',
 'general', 'pending', 'organization', 5, 'Various Hong Kong sailing venues',
 '{"plan":{"what_will_you_do":"Compete at the HKSF National Championships and selection regattas","how_sub_steps":["Enter the HKSF National Dinghy Championships","Compete across multiple classes — Optimist, ILCA, 29er","Results determine Development and Regional squad selection","Top performers invited to HKSI assessment","National ranking updated after each selection event"],"where_location":"Various HK venues — typically RHKYC or HHYC","duration":"2-3 events per year","prerequisites":"HKSF Level 2 minimum, active club racing record","cross_org":"Results from RHKYC, HHYC, and all clubs count toward HKSF national ranking"}}'::jsonb);

-- ═══════════════════════════════════════════════════════
-- 3. BLUEPRINTS
-- ═══════════════════════════════════════════════════════

-- HKIS Blueprints
INSERT INTO timeline_blueprints (id, user_id, interest_id, slug, title, description, is_published, subscriber_count, organization_id, access_level, program_id) VALUES

(v_bp_school, v_author_id, v_interest_id,
 'hkis-school-sailing-programme',
 'School Sailing Programme',
 'Progressive after-school sailing programme following the HKSSA Junior Sail scheme (JS1-JS4). From first-time sailors through to race-ready students at RHKYC Middle Island.',
 true, 0, v_hkis_id, 'org_members', v_prog_school),

(v_bp_interschool, v_author_id, v_interest_id,
 'hkis-inter-school-racing-squad',
 'Inter-School Racing Squad',
 'Competitive sailing squad representing HKIS at the RHKYC Inter-School Sailing Festival (3rd place 2025) and HHYC 24-Hour Charity Race. Selection-based, weekend training at RHKYC Middle Island.',
 true, 0, v_hkis_id, 'org_members', v_prog_interschool),

(v_bp_watersports, v_author_id, v_interest_id,
 'hkis-water-sports-pathway',
 'Water Sports Pathway',
 'Multi-sport aquatic pathway showing progression through swimming, sailing, and rowing across school seasons. Demonstrates the breadth of water sports available at HKIS.',
 true, 0, v_hkis_id, 'org_members', v_prog_watersports);

-- HKSF Blueprints
INSERT INTO timeline_blueprints (id, user_id, interest_id, slug, title, description, is_published, subscriber_count, organization_id, access_level, program_id) VALUES

(v_bp_junior, v_author_id, v_interest_id,
 'hksf-junior-dinghy-scheme',
 'Junior Dinghy Scheme JS1–JS4',
 'Government-subsidised junior sailing scheme for ages 8-12. Four progressive stages from water confidence to racing readiness in Optimist dinghies. The HKSF national standard for youth development.',
 true, 0, v_hksf_id, 'public', v_prog_junior),

(v_bp_dinghy, v_author_id, v_interest_id,
 'hksf-dinghy-sail-training',
 'Dinghy Sail Training Scheme L1–L4',
 'The national dinghy sailing standard for Hong Kong. Four progressive levels plus an introductory taster. The same syllabus taught at RHKYC and all HKSF-approved centres.',
 true, 0, v_hksf_id, 'public', v_prog_dinghy),

(v_bp_instructor, v_author_id, v_interest_id,
 'hksf-instructor-development',
 'Instructor Development Pathway',
 'Professional instructor pathway from Assistant Instructor (age 14+) to Dinghy Trainer. Certifies all sailing instructors teaching at approved centres across Hong Kong.',
 true, 0, v_hksf_id, 'public', v_prog_instructor),

(v_bp_hp, v_author_id, v_interest_id,
 'hksf-youth-high-performance',
 'Youth High Performance Pathway',
 'Elite youth development from talent identification through HKSI full-time training to Olympic Development. Partnership with Hong Kong Sports Institute.',
 true, 0, v_hksf_id, 'org_members', v_prog_hp);

-- ═══════════════════════════════════════════════════════
-- 4. BLUEPRINT STEPS (link steps to blueprints)
-- ═══════════════════════════════════════════════════════

-- HKIS: School Sailing Programme
INSERT INTO blueprint_steps (blueprint_id, step_id, sort_order) VALUES
(v_bp_school, v_s_js1, 1),
(v_bp_school, v_s_js2, 2),
(v_bp_school, v_s_js3, 3),
(v_bp_school, v_s_js4, 4),
(v_bp_school, v_s_afterschool, 5);

-- HKIS: Inter-School Racing Squad
INSERT INTO blueprint_steps (blueprint_id, step_id, sort_order) VALUES
(v_bp_interschool, v_s_selection, 1),
(v_bp_interschool, v_s_training_blk, 2),
(v_bp_interschool, v_s_issf, 3),
(v_bp_interschool, v_s_hhyc24, 4);

-- HKIS: Water Sports Pathway
INSERT INTO blueprint_steps (blueprint_id, step_id, sort_order) VALUES
(v_bp_watersports, v_s_swim, 1),
(v_bp_watersports, v_s_comp_swim, 2),
(v_bp_watersports, v_s_intro_sail, 3),
(v_bp_watersports, v_s_rowing, 4);

-- HKSF: Junior Dinghy Scheme
INSERT INTO blueprint_steps (blueprint_id, step_id, sort_order) VALUES
(v_bp_junior, v_s_jds1, 1),
(v_bp_junior, v_s_jds2, 2),
(v_bp_junior, v_s_jds3, 3),
(v_bp_junior, v_s_jds4, 4);

-- HKSF: Dinghy Sail Training Scheme
INSERT INTO blueprint_steps (blueprint_id, step_id, sort_order) VALUES
(v_bp_dinghy, v_s_intro, 1),
(v_bp_dinghy, v_s_l1, 2),
(v_bp_dinghy, v_s_l2, 3),
(v_bp_dinghy, v_s_l3, 4),
(v_bp_dinghy, v_s_l4, 5);

-- HKSF: Instructor Development
INSERT INTO blueprint_steps (blueprint_id, step_id, sort_order) VALUES
(v_bp_instructor, v_s_asst_instr, 1),
(v_bp_instructor, v_s_dinghy_instr, 2),
(v_bp_instructor, v_s_senior_instr, 3),
(v_bp_instructor, v_s_trainer, 4);

-- HKSF: Youth High Performance
INSERT INTO blueprint_steps (blueprint_id, step_id, sort_order) VALUES
(v_bp_hp, v_s_dev_squad, 1),
(v_bp_hp, v_s_regional, 2),
(v_bp_hp, v_s_elite, 3),
(v_bp_hp, v_s_olympic, 4),
(v_bp_hp, v_s_selection_reg, 5);

END $$;
