-- Seed RHKYC programs, blueprints, and steps for demo
-- Org: Royal Hong Kong Yacht Club (a1000001-0000-0000-0000-000000000001)
-- Interest: sail-racing (5e6b64c3-ea92-42a1-baf5-9342c53eb7d9)
-- Author: use the JHU Admin 1 user as blueprint author (d67f765e-7fe6-4f79-b514-f1b7f9a1ba3f)

DO $$
DECLARE
  v_org_id      uuid := 'a1000001-0000-0000-0000-000000000001';
  v_interest_id uuid := '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9';
  v_author_id   uuid := 'd67f765e-7fe6-4f79-b514-f1b7f9a1ba3f';

  -- Program IDs
  v_prog_dinghy    uuid := gen_random_uuid();
  v_prog_keelboat  uuid := gen_random_uuid();
  v_prog_youth     uuid := gen_random_uuid();

  -- Blueprint IDs
  v_bp_dinghy      uuid := gen_random_uuid();
  v_bp_keelboat    uuid := gen_random_uuid();
  v_bp_youth       uuid := gen_random_uuid();

  -- Step IDs — Learn to Sail (Dinghy) pathway
  v_s_hksf1        uuid := gen_random_uuid();
  v_s_hksf2        uuid := gen_random_uuid();
  v_s_hksf3        uuid := gen_random_uuid();
  v_s_spinnaker    uuid := gen_random_uuid();
  v_s_laser        uuid := gen_random_uuid();
  v_s_club_racing  uuid := gen_random_uuid();

  -- Step IDs — Keelboat Skipper pathway
  v_s_start_yacht  uuid := gen_random_uuid();
  v_s_comp_crew    uuid := gen_random_uuid();
  v_s_dayskip_thy  uuid := gen_random_uuid();
  v_s_dayskip_prac uuid := gen_random_uuid();
  v_s_coastal_thy  uuid := gen_random_uuid();
  v_s_coastal_prac uuid := gen_random_uuid();
  v_s_yachtmaster  uuid := gen_random_uuid();

  -- Step IDs — Youth Sailing pathway
  v_s_jr_step1     uuid := gen_random_uuid();
  v_s_jr_step2     uuid := gen_random_uuid();
  v_s_youth_l1     uuid := gen_random_uuid();
  v_s_youth_l2     uuid := gen_random_uuid();
  v_s_youth_l3     uuid := gen_random_uuid();
  v_s_sharks       uuid := gen_random_uuid();

BEGIN

-- ═══════════════════════════════════════════════════════
-- 1. PROGRAMS
-- ═══════════════════════════════════════════════════════

INSERT INTO programs (id, organization_id, domain, title, description, type, status, metadata, interest_id) VALUES
(v_prog_dinghy, v_org_id, 'sailing', 'Learn to Sail — Adult Dinghy',
 'Progressive dinghy sailing pathway following the HKSF Sail Training Scheme. From absolute beginner to confident club racer, trained at RHKYC Middle Island.',
 'training_pathway', 'active',
 '{"unit":"course","max_participants":12,"location":"Middle Island, Deep Water Bay","certification_body":"HKSF"}'::jsonb,
 v_interest_id),

(v_prog_keelboat, v_org_id, 'sailing', 'Keelboat Skipper — RYA Pathway',
 'RYA Sail Cruising scheme from Start Yachting through to Yachtmaster. Theory and practical courses run on Beneteau 37 and Bavaria 47 training yachts in Hong Kong waters.',
 'training_pathway', 'active',
 '{"unit":"course","max_participants":6,"certification_body":"RYA","training_vessels":["Beneteau 37","Bavaria 47"]}'::jsonb,
 v_interest_id),

(v_prog_youth, v_org_id, 'sailing', 'Youth Sailing Academy',
 'Structured youth development from first-time Junior sailors (age 6) through HKSF levels to the competitive SHARKS Racing Squad. Weekend and holiday programs at Middle Island.',
 'training_pathway', 'active',
 '{"unit":"course","max_participants":20,"age_range":"6-18","location":"Middle Island","squad":"SHARKS Racing Squad"}'::jsonb,
 v_interest_id);

-- ═══════════════════════════════════════════════════════
-- 2. TIMELINE STEPS (blueprint template content)
-- ═══════════════════════════════════════════════════════

-- ── Learn to Sail (Adult Dinghy) ──

INSERT INTO timeline_steps (id, user_id, interest_id, organization_id, source_type, title, description, category, status, visibility, sort_order, location_name, metadata) VALUES

(v_s_hksf1, v_author_id, v_interest_id, v_org_id, 'blueprint', 'HKSF Level 1 — Introduction to Sailing',
 'Two-day introductory course (14 hours). Learn basic sailing theory, rigging, launching, steering, tacking, and capsize recovery. No experience required. Buoyancy aid and helmet provided.',
 'general', 'pending', 'organization', 1, 'RHKYC Middle Island, Deep Water Bay',
 '{"plan":{"what_will_you_do":"Complete the HKSF Level 1 dinghy sailing course","how_sub_steps":["Understand wind direction and points of sail","Rig and launch a training dinghy","Helm upwind and downwind in light conditions","Perform tacking manoeuvre","Capsize recovery drill"],"where_location":"RHKYC Middle Island","duration":"2 days (14 hours)","prerequisites":"None — absolute beginners welcome","certification":"HKSF Level 1 Certificate"}}'::jsonb),

(v_s_hksf2, v_author_id, v_interest_id, v_org_id, 'blueprint', 'HKSF Level 2 — Basic Skills',
 'Four-day course (28 hours) building on Level 1. Sail a dinghy without instructor assistance in light to moderate winds. Covers five essentials, gybing, sailing backwards, and lee-shore landings.',
 'general', 'pending', 'organization', 2, 'RHKYC Middle Island, Deep Water Bay',
 '{"plan":{"what_will_you_do":"Achieve competent dinghy helm in moderate conditions","how_sub_steps":["Master the five essentials of dinghy sailing","Confident tacking and gybing in varying wind","Lee shore launching and landing","Man overboard recovery","Navigate a simple course"],"where_location":"RHKYC Middle Island","duration":"4 days (28 hours)","prerequisites":"HKSF Level 1 or Junior Sail 3","certification":"HKSF Level 2 Certificate"}}'::jsonb),

(v_s_hksf3, v_author_id, v_interest_id, v_org_id, 'blueprint', 'HKSF Level 3 — Intermediate Sailing',
 'Five-day advanced course. Confident sailing in moderate to fresh conditions. Covers asymmetric spinnaker introduction, seamanship, weather, and passage planning. Requires 40 logged sailing hours.',
 'general', 'pending', 'organization', 3, 'RHKYC Middle Island, Deep Water Bay',
 '{"plan":{"what_will_you_do":"Become an intermediate-level dinghy sailor","how_sub_steps":["Sail confidently in 15+ knot winds","Introduction to asymmetric spinnaker","Weather interpretation for sailing decisions","Seamanship and rope work","Log 40 sailing hours between Level 2 and 3"],"where_location":"RHKYC Middle Island","duration":"5 days","prerequisites":"HKSF Level 2 + 40 logged sailing hours","certification":"HKSF Level 3 Certificate"}}'::jsonb),

(v_s_spinnaker, v_author_id, v_interest_id, v_org_id, 'blueprint', 'Spinnaker & Trapeze Technique',
 'Specialist course covering symmetric spinnaker rigging, hoisting, gybing, and recovery plus trapeze technique. Prerequisite: Level 3 and 40 hours with minimum 20 as helm.',
 'general', 'pending', 'organization', 4, 'RHKYC Middle Island, Deep Water Bay',
 '{"plan":{"what_will_you_do":"Master spinnaker and trapeze skills for high-performance dinghy sailing","how_sub_steps":["Rig and hoist a symmetric spinnaker","Sail and gybe with spinnaker set","Spinnaker drop and recovery","Trapeze technique — getting out and back","Combining spinnaker and trapeze in racing conditions"],"where_location":"RHKYC Middle Island","prerequisites":"HKSF Level 3 + 40 hrs (20 as helm)"}}'::jsonb),

(v_s_laser, v_author_id, v_interest_id, v_org_id, 'blueprint', 'ILCA / Laser Helm Course',
 'Two-day course focused on single-handed ILCA (Laser) sailing. Covers boat-specific rigging, tuning, hiking technique, and Laser-specific racing tactics.',
 'general', 'pending', 'organization', 5, 'RHKYC Middle Island, Deep Water Bay',
 '{"plan":{"what_will_you_do":"Sail an ILCA/Laser confidently as a single-handed helm","how_sub_steps":["ILCA-specific rigging and tuning","Hiking technique and fitness","Upwind and downwind in an ILCA","Roll tacking and gybing","Introduction to Laser fleet racing"],"where_location":"RHKYC Middle Island","duration":"2 days","prerequisites":"HKSF Levels 1, 2, 3 complete"}}'::jsonb),

(v_s_club_racing, v_author_id, v_interest_id, v_org_id, 'blueprint', 'First Club Race — Social Racing at Middle Island',
 'Put your skills into practice at RHKYC Social Racing on Friday evenings. Casual 40-minute passage race, free entry, dinghy hire available. Warning signal at 17:30. The perfect first taste of racing.',
 'general', 'pending', 'organization', 6, 'RHKYC Middle Island',
 '{"plan":{"what_will_you_do":"Complete your first club race","how_sub_steps":["Understand Racing Rules of Sailing basics (Part 2)","Pre-race briefing and course familiarisation","Start line technique — timing and positioning","Race the course: upwind, reaching, downwind legs","Post-race debrief and scoring"],"where_location":"RHKYC Middle Island","duration":"Friday evenings, Oct-Nov","prerequisites":"HKSF Level 2 minimum recommended"}}'::jsonb);

-- ── Keelboat Skipper (RYA) ──

INSERT INTO timeline_steps (id, user_id, interest_id, organization_id, source_type, title, description, category, status, visibility, sort_order, location_name, metadata) VALUES

(v_s_start_yacht, v_author_id, v_interest_id, v_org_id, 'blueprint', 'RYA Start Yachting',
 'Weekend introduction to crewing on a yacht. Learn the ropes — literally. Covers basic ropework, helming, sail handling, and safety aboard. Taught on Beneteau 37 in Hong Kong waters.',
 'general', 'pending', 'organization', 1, 'RHKYC Kellett Island / Victoria Harbour',
 '{"plan":{"what_will_you_do":"Experience yacht sailing as crew","how_sub_steps":["Safety briefing and life jacket drill","Basic knots: bowline, cleat hitch, figure of eight","Helming under supervision","Winch handling and sheet trimming","Man overboard awareness"],"duration":"2 days","certification":"RYA Start Yachting Certificate","training_vessel":"Beneteau 37"}}'::jsonb),

(v_s_comp_crew, v_author_id, v_interest_id, v_org_id, 'blueprint', 'RYA Competent Crew',
 'Five-day practical course to become a useful crew member. Covers sail changes, helming, ropework, basic navigation, night sailing, and watchkeeping. Includes a short coastal passage.',
 'general', 'pending', 'organization', 2, 'Hong Kong waters',
 '{"plan":{"what_will_you_do":"Become a competent yacht crew member","how_sub_steps":["Confident helming in all conditions","Sail handling: reefing, headsail changes","Basic pilotage and chart reading","Night sailing and watchkeeping","Mooring and anchoring techniques"],"duration":"5 days","certification":"RYA Competent Crew Certificate","training_vessel":"Beneteau 37"}}'::jsonb),

(v_s_dayskip_thy, v_author_id, v_interest_id, v_org_id, 'blueprint', 'RYA Day Skipper Theory',
 'Classroom-based navigation and theory course. Covers chart work, tides, pilotage, weather, IRPCS collision regulations, and passage planning. Can be completed as evening classes or intensive weekend.',
 'general', 'pending', 'organization', 3, 'RHKYC Kellett Island',
 '{"plan":{"what_will_you_do":"Master coastal navigation theory","how_sub_steps":["Chart work: plotting position, course to steer","Tidal calculations and tidal streams","Pilotage planning and execution","Weather forecasts and interpretation","IRPCS collision regulations"],"duration":"40 hours (evenings or intensive)","certification":"RYA Day Skipper Theory Certificate"}}'::jsonb),

(v_s_dayskip_prac, v_author_id, v_interest_id, v_org_id, 'blueprint', 'RYA Day Skipper Practical',
 'Five-day practical course to skipper a yacht in familiar waters by day. Pilotage, passage planning, boat handling under power and sail, and emergency procedures. Taught on Beneteau 37.',
 'general', 'pending', 'organization', 4, 'Hong Kong to Sai Kung / outlying islands',
 '{"plan":{"what_will_you_do":"Skipper a yacht safely in daylight","how_sub_steps":["Plan and execute a coastal day passage","Skipper the yacht in and out of harbour","Anchoring and mooring under various conditions","Engine handling and close-quarters manoeuvring","Emergency procedures: fire, flooding, grounding"],"duration":"5 days","prerequisites":"Competent Crew + Day Skipper Theory","certification":"RYA Day Skipper Practical Certificate","training_vessel":"Beneteau 37"}}'::jsonb),

(v_s_coastal_thy, v_author_id, v_interest_id, v_org_id, 'blueprint', 'RYA Coastal Skipper / Yachtmaster Offshore Theory',
 'Advanced navigation theory covering ocean passage planning, astro navigation basics, advanced meteorology, and passage-making strategy. Required before Coastal Skipper practical.',
 'general', 'pending', 'organization', 5, 'RHKYC Kellett Island',
 '{"plan":{"what_will_you_do":"Advanced navigation and passage planning theory","how_sub_steps":["Advanced chart work and position fixing","Passage planning for multi-day voyages","Advanced meteorology and weather routing","Electronic navigation and radar","Collision regulations — complex scenarios"],"duration":"40 hours","prerequisites":"Day Skipper Theory","certification":"RYA Coastal Skipper / Yachtmaster Offshore Theory"}}'::jsonb),

(v_s_coastal_prac, v_author_id, v_interest_id, v_org_id, 'blueprint', 'RYA Coastal Skipper Practical',
 'Five-day advanced practical course. Skipper a yacht on coastal passages by day and night. Covers crew management, passage planning execution, and adverse weather handling. Taught on Bavaria 47.',
 'general', 'pending', 'organization', 6, 'Hong Kong coastal waters / South China Sea',
 '{"plan":{"what_will_you_do":"Skipper a yacht on coastal passages including night sailing","how_sub_steps":["Multi-leg coastal passage with night pilotage","Crew management and watch system","Heavy weather sailing techniques","Radar navigation and plotting","Emergency scenarios under exam conditions"],"duration":"5 days","prerequisites":"Day Skipper Practical + Coastal Theory + 15 days, 2 as skipper, 300nm, 8 night hours","certification":"RYA Coastal Skipper Practical Certificate","training_vessel":"Bavaria 47"}}'::jsonb),

(v_s_yachtmaster, v_author_id, v_interest_id, v_org_id, 'blueprint', 'RYA Yachtmaster Offshore Exam',
 'Independent examination by an RYA examiner. Two-day assessment covering all aspects of yacht skippering: passage planning, navigation, boat handling, safety, and seamanship. The gold standard.',
 'general', 'pending', 'organization', 7, 'Hong Kong waters',
 '{"plan":{"what_will_you_do":"Achieve the RYA Yachtmaster Offshore qualification","how_sub_steps":["Passage plan examination and viva","Practical boat handling assessment","Night pilotage under exam conditions","Emergency procedures demonstration","Seamanship and crew management assessment"],"duration":"2-day exam","prerequisites":"Coastal Skipper Practical + 50 days, 5 as skipper, 2500nm, 5 passages over 60nm","certification":"RYA/MCA Yachtmaster Offshore Certificate of Competence"}}'::jsonb);

-- ── Youth Sailing Academy ──

INSERT INTO timeline_steps (id, user_id, interest_id, organization_id, source_type, title, description, category, status, visibility, sort_order, location_name, metadata) VALUES

(v_s_jr_step1, v_author_id, v_interest_id, v_org_id, 'blueprint', 'Junior Sailing Step 1 — First Time on the Water',
 'Fun, safe introduction to sailing for children aged 6-10. Learn basic boat parts, wind awareness, and steering in a safe harbour environment. All equipment provided. No experience needed.',
 'general', 'pending', 'organization', 1, 'RHKYC Middle Island, Deep Water Bay',
 '{"plan":{"what_will_you_do":"Get comfortable on the water and learn sailing basics","how_sub_steps":["Learn the parts of a dinghy","Understand where the wind comes from","Steer a boat with a tiller","Go sailing with an instructor in the boat","Capsize drill in shallow water (fun, not scary!)"],"age_range":"6-10","duration":"Weekend sessions","prerequisites":"None — first-time sailors"}}'::jsonb),

(v_s_jr_step2, v_author_id, v_interest_id, v_org_id, 'blueprint', 'Junior Sailing Step 2 — Building Confidence',
 'Progress from Step 1. Children sail with less instructor assistance, learn to tack, and begin to understand basic racing concepts through fun games on the water.',
 'general', 'pending', 'organization', 2, 'RHKYC Middle Island, Deep Water Bay',
 '{"plan":{"what_will_you_do":"Build independence and sailing confidence","how_sub_steps":["Tacking without instructor help","Understanding sail trim basics","Sailing a short course around marks","Introduction to right-of-way through games","Rigging and de-rigging with supervision"],"age_range":"6-10","prerequisites":"Junior Sailing Step 1"}}'::jsonb),

(v_s_youth_l1, v_author_id, v_interest_id, v_org_id, 'blueprint', 'Youth HKSF Level 1 — Learn to Sail',
 'Structured HKSF Level 1 course for youth (ages 10-18). Same syllabus as adult Level 1 but taught in age-appropriate Optimist or RS Tera dinghies. Weekend or holiday intensive format.',
 'general', 'pending', 'organization', 3, 'RHKYC Middle Island, Deep Water Bay',
 '{"plan":{"what_will_you_do":"Complete HKSF Level 1 in youth-appropriate boats","how_sub_steps":["Sail an Optimist or RS Tera solo","Understand points of sail and no-go zone","Tacking and basic boat handling","Capsize recovery — self-rescue","Basic ropework: figure of eight, reef knot"],"age_range":"10-18","duration":"2 days or weekend sessions","certification":"HKSF Level 1 Certificate"}}'::jsonb),

(v_s_youth_l2, v_author_id, v_interest_id, v_org_id, 'blueprint', 'Youth HKSF Level 2 — Independent Sailing',
 'Four-day course building independent sailing skills. Youth sailors learn to helm confidently without instructor, handle moderate wind, and begin to understand racing marks and courses.',
 'general', 'pending', 'organization', 4, 'RHKYC Middle Island, Deep Water Bay',
 '{"plan":{"what_will_you_do":"Sail independently in moderate conditions","how_sub_steps":["Confident tacking and gybing in 10-15 knots","Lee shore awareness and safety","Sail a triangular course around marks","Introduction to fleet racing starts","Sailing fitness and hiking technique"],"age_range":"10-18","duration":"4 days (28 hours)","prerequisites":"HKSF Level 1","certification":"HKSF Level 2 Certificate"}}'::jsonb),

(v_s_youth_l3, v_author_id, v_interest_id, v_org_id, 'blueprint', 'Youth HKSF Level 3 — Advanced & Race Ready',
 'Five-day advanced course. Master sailing in fresh conditions, understand racing rules, and prepare for competitive youth events like Hong Kong Race Week and the Inter-School Sailing Festival.',
 'general', 'pending', 'organization', 5, 'RHKYC Middle Island / Lamma waters',
 '{"plan":{"what_will_you_do":"Become race-ready in ILCA, Optimist, or 29er class","how_sub_steps":["Confident sailing in 15-20 knot conditions","Racing Rules of Sailing — Part 2 fundamentals","Start line technique and timing","Mark rounding strategy","Transition to race-class boat (ILCA 4, Optimist, or 29er)"],"age_range":"10-18","duration":"5 days","prerequisites":"HKSF Level 2 + 40 logged hours","certification":"HKSF Level 3 Certificate"}}'::jsonb),

(v_s_sharks, v_author_id, v_interest_id, v_org_id, 'blueprint', 'SHARKS Racing Squad — Competitive Youth Programme',
 'Application-based elite youth racing squad. Season-long weekend training with professional coaches, competing in Hong Kong Race Week, Autumn/Spring Regattas, Inter-School Festival, and international events.',
 'general', 'pending', 'organization', 6, 'RHKYC Middle Island / race venues across HK',
 '{"plan":{"what_will_you_do":"Train and compete as part of RHKYC SHARKS racing squad","how_sub_steps":["Weekend squad training sessions (9-session blocks)","Boat speed testing and tuning","Race strategy and tactics clinics","Compete in Hong Kong Race Week","Compete in Autumn & Spring Regattas and Inter-School Festival"],"age_range":"10-18","prerequisites":"HKSF Level 3 + application and selection","season":"Sep-May, weekend training blocks"}}'::jsonb);

-- ═══════════════════════════════════════════════════════
-- 3. BLUEPRINTS
-- ═══════════════════════════════════════════════════════

INSERT INTO timeline_blueprints (id, user_id, interest_id, slug, title, description, is_published, subscriber_count, organization_id, access_level, program_id) VALUES

(v_bp_dinghy, v_author_id, v_interest_id,
 'rhkyc-learn-to-sail-dinghy',
 'Learn to Sail — HKSF Dinghy Pathway',
 'From absolute beginner to club racer. Follow the HKSF Sail Training Scheme at RHKYC Middle Island: Level 1 (2 days) → Level 2 (4 days) → Level 3 (5 days) → Spinnaker/Trapeze → ILCA Helm → your first club race.',
 true, 0, v_org_id, 'org_members', v_prog_dinghy),

(v_bp_keelboat, v_author_id, v_interest_id,
 'rhkyc-keelboat-skipper-rya',
 'Keelboat Skipper — RYA Pathway',
 'The complete RYA Sail Cruising pathway from Start Yachting to Yachtmaster Offshore. Theory and practical courses on Beneteau 37 and Bavaria 47 training yachts in Hong Kong and South China Sea waters.',
 true, 0, v_org_id, 'org_members', v_prog_keelboat),

(v_bp_youth, v_author_id, v_interest_id,
 'rhkyc-youth-sailing-academy',
 'Youth Sailing Academy',
 'Structured youth development from Junior Step 1 (age 6) through HKSF certification levels to the competitive SHARKS Racing Squad. Weekend and school holiday programs at Middle Island.',
 true, 0, v_org_id, 'org_members', v_prog_youth);

-- ═══════════════════════════════════════════════════════
-- 4. BLUEPRINT STEPS (link steps to blueprints)
-- ═══════════════════════════════════════════════════════

-- Dinghy pathway
INSERT INTO blueprint_steps (blueprint_id, step_id, sort_order) VALUES
(v_bp_dinghy, v_s_hksf1, 1),
(v_bp_dinghy, v_s_hksf2, 2),
(v_bp_dinghy, v_s_hksf3, 3),
(v_bp_dinghy, v_s_spinnaker, 4),
(v_bp_dinghy, v_s_laser, 5),
(v_bp_dinghy, v_s_club_racing, 6);

-- Keelboat pathway
INSERT INTO blueprint_steps (blueprint_id, step_id, sort_order) VALUES
(v_bp_keelboat, v_s_start_yacht, 1),
(v_bp_keelboat, v_s_comp_crew, 2),
(v_bp_keelboat, v_s_dayskip_thy, 3),
(v_bp_keelboat, v_s_dayskip_prac, 4),
(v_bp_keelboat, v_s_coastal_thy, 5),
(v_bp_keelboat, v_s_coastal_prac, 6),
(v_bp_keelboat, v_s_yachtmaster, 7);

-- Youth pathway
INSERT INTO blueprint_steps (blueprint_id, step_id, sort_order) VALUES
(v_bp_youth, v_s_jr_step1, 1),
(v_bp_youth, v_s_jr_step2, 2),
(v_bp_youth, v_s_youth_l1, 3),
(v_bp_youth, v_s_youth_l2, 4),
(v_bp_youth, v_s_youth_l3, 5),
(v_bp_youth, v_s_sharks, 6);

END $$;
