-- ============================================================================
-- Seed: Sailing Courses & Lessons (new), Drawing Course 4, Fitness Course 4
-- ============================================================================

-- =============================================================================
-- SECTION 1 — SAILING: 4 Courses (interest a1000000-...-000000000001)
-- =============================================================================

INSERT INTO betterat_courses (id, interest_id, title, description, level, topic, sort_order, lesson_count, published)
VALUES
  ('d5000000-0000-0000-0000-000000000001', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Racing Starts & Pre-Start Strategy',
   'Master the critical first minutes of a race. Understand flags, horns, line bias, positioning, and strategies for every condition.',
   'beginner', 'Starts', 1, 4, true),

  ('d5000000-0000-0000-0000-000000000002', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Upwind Tactics & Boatspeed',
   'Sail faster and smarter upwind. Trim sails for speed, read wind shifts, optimize VMG, and tack with precision.',
   'intermediate', 'Upwind', 2, 4, true),

  ('d5000000-0000-0000-0000-000000000003', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Downwind Strategy & Mark Roundings',
   'Sail optimal angles downwind, execute smooth gybes, round marks tactically, and make winning decisions on the run.',
   'intermediate', 'Downwind', 3, 4, true),

  ('d5000000-0000-0000-0000-000000000004', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Race Management & Advanced Tactics',
   'Think strategically about the full race — weather, current, fleet management, rules, and structured post-race analysis.',
   'advanced', 'Strategy', 4, 4, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  level = EXCLUDED.level, topic = EXCLUDED.topic,
  lesson_count = EXCLUDED.lesson_count, published = EXCLUDED.published, updated_at = now();

-- =============================================================================
-- SAILING — 16 Lessons
-- =============================================================================

INSERT INTO betterat_lessons (id, course_id, title, description, lesson_data, interactive_type, sort_order, published)
VALUES

  -- ---------------------------------------------------------------------------
  -- Course 1: Racing Starts & Pre-Start Strategy
  -- ---------------------------------------------------------------------------

  ('d5100000-0000-0000-0000-000000000001', 'd5000000-0000-0000-0000-000000000001',
   'Understanding the Starting Sequence',
   'Flags, horns, and timing from 5 minutes to go. Know exactly what each signal means and when to act.',
   '{"lessonId": "sailing-1-1", "steps": [
     {"stepNumber": 1, "label": "Pre-Start Preparation", "description": "The 5-minute warning flag goes up. Time to shift from warm-up to race mode.", "details": ["Class flag raised — your race is next", "Check sail controls: outhaul, cunningham, vang set for conditions", "Survey the course: identify windward mark, nearby boats, current", "Start your countdown timer and confirm against the committee boat", "Identify the favored end by sailing close-hauled on each tack"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Starts"},
     {"stepNumber": 2, "label": "4-Minute Signal", "description": "The preparatory signal (P flag) goes up. Your start plan must be forming now.", "details": ["P flag (or I, Z, U, Black flag) raised with one horn", "Decide which end of the line you will start at", "Begin your time-on-distance runs to calibrate approach speed", "Watch other boats to gauge where the fleet will stack up", "Communicate your plan to crew: target position, approach angle"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Starts"},
     {"stepNumber": 3, "label": "1-Minute Intensification", "description": "The P flag drops — one minute to go. Final approach begins.", "details": ["P flag lowered with one long horn blast", "You must be in your final approach zone", "Hold your lane and protect your position from other boats", "Check your transit on the line — are you above or below?", "Accelerate timing: plan when to sheet in and build speed"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Starts"},
     {"stepNumber": 4, "label": "Start Execution", "description": "The class flag drops — go! Cross the line at full speed on time.", "details": ["Class flag drops with one horn at zero", "Sheet in hard and accelerate to full speed", "Aim to cross the line at maximum velocity, not drifting", "If over early (OCS), the X flag flies — return and restart", "First 30 seconds after the start: clear air is everything"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Starts"}
   ]}'::jsonb, 'start-sequence-timer', 1, true),

  ('d5100000-0000-0000-0000-000000000002', 'd5000000-0000-0000-0000-000000000001',
   'Reading the Start Line',
   'Determine line bias, identify the favored end, and use that knowledge to gain an advantage off the line.',
   '{"lessonId": "sailing-1-2", "steps": [
     {"stepNumber": 1, "label": "Sighting the Line", "description": "Before you can exploit bias, you need to see the line accurately.", "details": ["Sail to one end and sight across to the other end", "The perpendicular test: head to wind on the line and see which end is farther upwind", "Take a compass bearing along the line", "Compare to the close-hauled heading on each tack", "Line rarely changes during the sequence unless the committee adjusts"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Starts"},
     {"stepNumber": 2, "label": "Determining Bias", "description": "Figure out which end is closer to the wind — the favored end.", "details": ["Wind angle method: compare line bearing to wind direction", "If wind is left of perpendicular, pin end is favored", "If wind is right of perpendicular, boat end is favored", "Flag method: observe committee boat flags for quick reference", "Even 3-5 degrees of bias creates a meaningful advantage"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Starts"},
     {"stepNumber": 3, "label": "Mid-Line Sag", "description": "Most fleets sag in the middle of the line — learn to exploit it.", "details": ["Boats in the middle often end up a boat-length behind the ends", "Sag increases as the line gets longer and the fleet gets bigger", "Starting mid-line can give clear air if others sag behind you", "Sight the line from behind to see the sag before the start", "A disciplined mid-line start in a sagging fleet is surprisingly powerful"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Starts"},
     {"stepNumber": 4, "label": "Choosing Your Position", "description": "Combine bias knowledge with fleet positioning to pick your start.", "details": ["Favored end gives a geometric advantage — prioritize it", "But crowding at the favored end means risk of being squeezed", "Balance: best available position vs risk tolerance", "Consider your first-beat strategy when choosing position", "If unsure, a clean start in clear air beats a jammed favored-end start"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Starts"}
   ]}'::jsonb, 'line-bias-analyzer', 2, true),

  ('d5100000-0000-0000-0000-000000000003', 'd5000000-0000-0000-0000-000000000001',
   'Start Line Positioning',
   'Approach angles, acceleration timing, and defensive positioning to hit the line at full speed.',
   '{"lessonId": "sailing-1-3", "steps": [
     {"stepNumber": 1, "label": "The Approach", "description": "Set up your final run to the line with controlled speed and options.", "details": ["Reach back from the line on port or starboard to create distance", "Time-on-distance: know how long it takes to reach the line from various distances", "Keep the boat moving — never stop completely in the pre-start", "Maintain awareness of boats around you and their intentions", "Stay below the line to avoid being OCS (over the line early)"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Starts"},
     {"stepNumber": 2, "label": "Acceleration Zone", "description": "The critical 3 boat-lengths where you build to full speed.", "details": ["Begin acceleration roughly 3 boat-lengths from the line", "Sheet in progressively — don''t just cleat and forget", "Bear away slightly to build speed before heading up to close-hauled", "Crew weight placement: forward in light air, aft in heavy air", "Goal: cross the line at target speed, not still accelerating"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Starts"},
     {"stepNumber": 3, "label": "Defending Your Spot", "description": "Protect the space you have earned in the pre-start maneuvers.", "details": ["Luffing rights: if you are to leeward and overlapped, you may luff", "Windward boat must keep clear (Rule 11)", "Establish overlap early to lock in your position", "Don''t let boats roll over you to windward — luff them if needed", "Communication: firm but fair, call out overlaps clearly"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Starts"},
     {"stepNumber": 4, "label": "Common Mistakes", "description": "Avoid the errors that ruin otherwise good starts.", "details": ["Being early (OCS): the most costly mistake — you lose a minute returning", "Being late: arriving with no speed as others sail away", "Pinching off the line: pointing too high, no speed, sliding sideways", "Starting in bad air: directly behind or to leeward of another boat", "Not committing: indecision in the last 30 seconds leads to a poor position"], "action": "VERIFY", "criticalAction": false, "competencyArea": "Starts"}
   ]}'::jsonb, 'positioning-simulator', 3, true),

  ('d5100000-0000-0000-0000-000000000004', 'd5000000-0000-0000-0000-000000000001',
   'Starting Strategies for Different Conditions',
   'Port vs starboard approach, heavy air vs light air. Choose the right strategy for the conditions.',
   '{"lessonId": "sailing-1-4", "steps": [
     {"stepNumber": 1, "label": "Pin-End Start", "description": "Starting at the pin (port-end) when it is favored.", "details": ["Best when pin is clearly favored by 5+ degrees", "Approach on port tack, tack to starboard near the pin", "Risk: you must find a gap in the starboard-tack parade", "Timing is critical — too early and you''re over, too late and you''re buried", "Reward: first boat to the left side of the course with clear air"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Starts"},
     {"stepNumber": 2, "label": "Boat-End Start", "description": "Starting near the committee boat when it is favored.", "details": ["Safe approach: reach along the line, round up at the committee boat", "Aggressive approach: hold position right at the boat, accelerate on the gun", "Being at the boat gives you freedom to tack to port immediately", "Watch for a crowd — everyone wants the committee boat end when it''s favored", "Barging is a foul — you must give mark room to boats to leeward"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Starts"},
     {"stepNumber": 3, "label": "Mid-Line Starts", "description": "When starting in the middle of the line is the smart play.", "details": ["When bias is minimal, the middle offers options to go left or right", "Less crowded than the ends in most fleets", "Exploit mid-line sag to punch out ahead of the fleet", "Good when you want to keep tactical options open on the first beat", "Requires discipline: hold your lane and don''t get pulled to the ends"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Starts"},
     {"stepNumber": 4, "label": "Port Tack Approach", "description": "The high-risk, high-reward option of starting on port tack.", "details": ["You cross behind the entire starboard-tack fleet", "Only works when the left side is heavily favored", "Must find a gap or cross the fleet before the pin", "If it works, you''re in clear air on the favored side instantly", "If it fails, you''re at the back of the fleet — use sparingly"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Starts"}
   ]}'::jsonb, 'strategy-selector', 4, true),

  -- ---------------------------------------------------------------------------
  -- Course 2: Upwind Tactics & Boatspeed
  -- ---------------------------------------------------------------------------

  ('d5100000-0000-0000-0000-000000000005', 'd5000000-0000-0000-0000-000000000002',
   'Sail Trim Fundamentals',
   'Main, jib, and vang settings for different conditions. The controls that make your boat go fast.',
   '{"lessonId": "sailing-2-1", "steps": [
     {"stepNumber": 1, "label": "Mainsail Trim", "description": "The mainsail is your primary power source upwind. Learn the four key controls.", "details": ["Mainsheet: controls leech tension and boom angle", "Traveler: moves the boom side-to-side without changing leech tension", "Vang (kicker): locks the boom down, controls leech twist off the wind", "Cunningham: tensions the luff, moves draft forward in heavy air", "In light air: loose leech, open twist. In heavy air: tight leech, flat sail"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Upwind"},
     {"stepNumber": 2, "label": "Jib Trim", "description": "The jib drives the boat forward and creates the slot between sails.", "details": ["Lead position: forward for fuller shape, aft for flatter shape", "Sheet tension: ease until the luff just stops breaking (telltale dance)", "Top telltale should break slightly before the bottom", "If the slot between jib and main is too tight, the main backwinds", "In a gust, ease the jib slightly before easing the main"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Upwind"},
     {"stepNumber": 3, "label": "Coordinating Main and Jib", "description": "The two sails work together. Trim them as a system, not independently.", "details": ["The slot: the gap between the jib leech and the main luff", "Too narrow: main backwinds, boat stalls", "Too wide: you lose the acceleration effect of the slot", "Adjust both sails together when wind strength changes", "Telltales on shrouds and main leech tell the story"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Upwind"},
     {"stepNumber": 4, "label": "Adjusting for Wind Strength", "description": "Change your sail setup as conditions change throughout the race.", "details": ["Light air (0-8 kts): full sails, loose leech, crew weight forward and low", "Medium air (8-15 kts): moderate tension, balanced helm, crew hiking", "Heavy air (15+ kts): flat sails, tight cunningham, heavy vang, max hike or trapeze", "In gusts: ease mainsheet to depower instantly, hike harder", "In lulls: ease outhaul to add power, move crew inboard"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Upwind"}
   ]}'::jsonb, 'sail-trim-guide', 1, true),

  ('d5100000-0000-0000-0000-000000000006', 'd5000000-0000-0000-0000-000000000002',
   'Wind Shifts & Tactical Sailing',
   'Headers, lifts, oscillating vs persistent shifts. The tactical decisions that win races.',
   '{"lessonId": "sailing-2-2", "steps": [
     {"stepNumber": 1, "label": "Identifying Headers and Lifts", "description": "Use your compass and landmarks to detect wind shifts in real time.", "details": ["A header pushes your bow away from the mark — you can''t point as high", "A lift lets you point closer to the mark — your heading improves", "Compass method: note your close-hauled heading, compare continuously", "Landmark method: pick a point on shore, see if your heading changes relative to it", "Even a 5-degree shift can make a significant difference over a beat"], "action": "OBSERVE", "criticalAction": true, "competencyArea": "Upwind"},
     {"stepNumber": 2, "label": "Oscillating Shifts", "description": "Wind that swings back and forth around a median direction. Tack on the headers.", "details": ["The golden rule: tack on headers, sail the lifts", "Each tack on a header gains distance toward the windward mark", "The wind will shift back — be ready to tack again", "Don''t over-tack: wait for a meaningful header (5+ degrees)", "Track the oscillation period to anticipate the next shift"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Upwind"},
     {"stepNumber": 3, "label": "Persistent Shifts", "description": "Wind that gradually moves in one direction. Sail toward the new wind first.", "details": ["Persistent shifts trend left or right over the leg", "Sail toward the shift: if the wind is shifting left, go left early", "The boats on the side the wind shifts to gain massively", "Look for clues: sea breeze building, weather front approaching, cloud lines", "Getting this right (or wrong) can make or break your race"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Upwind"},
     {"stepNumber": 4, "label": "Laylines and When to Approach", "description": "The imaginary lines from the mark back to the fleet. Approach with caution.", "details": ["The layline is the course you would sail to fetch the mark in one tack", "Arriving at the layline early means you can''t benefit from further shifts", "If you get headed on the layline, you overshoot; if lifted, you''re short", "Stay in the middle of the beat as long as possible", "Approach the layline only in the final third of the beat"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Upwind"}
   ]}'::jsonb, 'wind-shift-diagram', 2, true),

  ('d5100000-0000-0000-0000-000000000007', 'd5000000-0000-0000-0000-000000000002',
   'Upwind Boatspeed',
   'Target speeds, pointing vs footing, and wave technique. Go fast in every condition.',
   '{"lessonId": "sailing-2-3", "steps": [
     {"stepNumber": 1, "label": "VMG Concept", "description": "Velocity Made Good — the speed that actually counts toward the mark.", "details": ["VMG measures your progress directly toward the windward mark", "It combines your boat speed and pointing angle into one number", "High pointing but slow speed = poor VMG", "Fast speed but wide angle = poor VMG", "The sweet spot maximizes the combination of both"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Upwind"},
     {"stepNumber": 2, "label": "Pointing High vs Footing Fast", "description": "Two modes of upwind sailing. Know when to use each.", "details": ["Pointing mode: sail higher, sacrifice some speed for angle", "Footing mode: bear off slightly, sail faster through the water", "Foot in light air and waves — you need flow over the foils", "Point in flat water and medium breeze — the boat can handle it", "Foot to escape bad air from a boat to windward and ahead"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Upwind"},
     {"stepNumber": 3, "label": "Wave Technique", "description": "Use waves to your advantage instead of fighting them.", "details": ["Head up slightly on the crest (less resistance, boat is fast)", "Bear away slightly in the trough (build speed, avoid stalling into the next wave)", "Pump the sails with the waves in classes where it is permitted", "In steep chop, you must foot more to maintain speed through the waves", "Smooth, rhythmic steering keeps the boat in the groove"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Upwind"},
     {"stepNumber": 4, "label": "Heavy Air vs Light Air Mode", "description": "Completely different technique is needed at each end of the wind range.", "details": ["Light air: smooth movements, don''t over-steer, let the sails breathe", "Light air body position: weight forward, leeward heel to fill sails", "Heavy air: hike hard, flatten sails, depower in gusts", "Heavy air body position: weight aft and outboard, control heel angle", "Transition zone (10-14 kts): constantly adjusting between modes"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Upwind"}
   ]}'::jsonb, 'speed-target-display', 3, true),

  ('d5100000-0000-0000-0000-000000000008', 'd5000000-0000-0000-0000-000000000002',
   'Tacking Technique & Timing',
   'Roll tacks, smooth transitions, and knowing exactly when to tack.',
   '{"lessonId": "sailing-2-4", "steps": [
     {"stepNumber": 1, "label": "Pre-Tack Preparation", "description": "Before you turn the helm, make sure everything is ready.", "details": ["Check to leeward: is there clear air on the new tack?", "Look for approaching boats — don''t tack into traffic", "Alert the crew: ready about", "Ease the vang slightly in light air for a smoother rotation", "Pick a target heading for the new tack using your compass"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Upwind"},
     {"stepNumber": 2, "label": "Initiation", "description": "Turn the boat through the wind with smooth, deliberate helm movement.", "details": ["Push the tiller or turn the wheel smoothly — not jerky", "In light air: slow turn, keep the boat moving through the tack", "In heavy air: faster turn, cross quickly before the boat stalls", "Weight begins shifting to the new high side as the bow crosses the wind", "Don''t overturn — the new close-hauled heading should be mirrored from the old one"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Upwind"},
     {"stepNumber": 3, "label": "Through the Tack", "description": "The critical moment when the boat crosses head to wind.", "details": ["Body crosses the boat smoothly — low to avoid the boom", "Release the old jib sheet as the sail starts to back", "Trim the new jib sheet as the bow passes through the wind", "Roll tack in light air: use body weight to roll the boat and pump out of the tack", "In dinghies, the roll tack can actually accelerate you through the maneuver"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Upwind"},
     {"stepNumber": 4, "label": "Exit", "description": "Accelerate smoothly onto the new tack and get back up to speed.", "details": ["Don''t pinch immediately — bear off slightly to rebuild speed", "Trim sails to the new close-hauled setting", "Settle into the groove: compass heading, telltales flowing, speed building", "Fine-tune: once at speed, come up to target pointing angle", "Good tacks lose less than 1 boat-length; bad tacks lose 3-5"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Upwind"}
   ]}'::jsonb, 'tacking-sequence', 4, true),

  -- ---------------------------------------------------------------------------
  -- Course 3: Downwind Strategy & Mark Roundings
  -- ---------------------------------------------------------------------------

  ('d5100000-0000-0000-0000-000000000009', 'd5000000-0000-0000-0000-000000000003',
   'Downwind Sailing Angles',
   'VMG downwind, hot angles vs deep angles. Sail the fastest path to the leeward mark.',
   '{"lessonId": "sailing-3-1", "steps": [
     {"stepNumber": 1, "label": "Downwind VMG", "description": "Dead downwind is rarely the fastest route. Angles matter.", "details": ["Just like upwind, VMG measures your progress toward the leeward mark", "Sailing at an angle (broad reach) is usually faster than dead downwind", "The extra distance is more than compensated by higher speed", "Exception: very light air where you can''t build enough speed to gybe", "Watch boats around you — if they''re sailing angles and gaining, follow suit"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Downwind"},
     {"stepNumber": 2, "label": "Determining Optimal Angle", "description": "The best downwind angle depends on wind speed and wave conditions.", "details": ["Light air (0-8 kts): sail deeper, closer to dead downwind — speed difference is small", "Medium air (8-15 kts): sail hot angles (broad reach) and gybe frequently", "Heavy air (15+ kts): surf waves on broad reach for massive speed gains", "Planing boats: once on a plane, the hot angle can be 30+ degrees off dead downwind", "Use your speed instruments or watch the GPS VMG readout"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Downwind"},
     {"stepNumber": 3, "label": "Gybing Angles", "description": "Know when to gybe to stay on the optimal angle toward the mark.", "details": ["Gybe when headed (wind shifts so you point farther from the mark)", "Gybe when you reach the downwind layline on one side", "Don''t sail past the layline — every meter past is wasted", "In oscillating shifts, gybe on the headers (same principle as upwind)", "Pre-plan your gybes: connect pressure lines across the course"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Downwind"},
     {"stepNumber": 4, "label": "When to Sail Deep vs Hot", "description": "Tactical decisions about angle depend on more than just VMG.", "details": ["Sail hot to get to a pressure line (more wind) quickly", "Sail deep to protect a lead or avoid gybing in unstable conditions", "Sail hot to escape dirty air from boats behind and above you", "Sail deep to block a competitor by keeping your wind shadow on them", "Mix modes throughout the leg based on what the race situation demands"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Downwind"}
   ]}'::jsonb, 'vmg-calculator', 1, true),

  ('d5100000-0000-0000-0000-000000000010', 'd5000000-0000-0000-0000-000000000003',
   'Gybe Technique',
   'Smooth, controlled gybes in all conditions. The maneuver that separates good sailors from great ones.',
   '{"lessonId": "sailing-3-2", "steps": [
     {"stepNumber": 1, "label": "Pre-Gybe Preparation", "description": "A good gybe starts well before the helm goes over.", "details": ["Check the area to leeward — is there room to gybe safely?", "Alert the crew: ready to gybe", "Trim the mainsheet in partially to reduce the distance the boom travels", "In heavy air, bear away slightly to reduce apparent wind before the gybe", "Crew prepares to switch sides and handle the spinnaker or jib"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Downwind"},
     {"stepNumber": 2, "label": "Initiating the Gybe", "description": "Bear away through dead downwind to bring the wind across the stern.", "details": ["Push the tiller to windward (or turn the wheel to leeward) smoothly", "Keep your body low — the boom is about to swing across", "The boat should be nearly dead downwind as the boom crosses", "In dinghies, grab the mainsheet parts and throw the boom across", "In keelboats, a controlled sheet release and re-trim is safer"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Downwind"},
     {"stepNumber": 3, "label": "Boom Transition", "description": "The critical seconds as the boom crosses the centerline.", "details": ["Catch the boom at the centerline to prevent it from slamming across", "In light air: roll the boat to help the boom across", "In heavy air: steer aggressively through the turn to keep the boat under the rig", "The main danger is a crash gybe — the boom slamming with full force", "Controlled, centered boom catch is the mark of a skilled sailor"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Downwind"},
     {"stepNumber": 4, "label": "Exit and Retrim", "description": "Settle onto the new gybe and get back up to speed.", "details": ["Steer onto the new reaching angle immediately — don''t round up", "Ease the mainsheet to the new broad reach setting", "Trim the jib or spinnaker for the new angle", "Crew weight transitions to the new windward side", "Check your heading: are you on the optimal angle for the leeward mark?"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Downwind"}
   ]}'::jsonb, 'gybe-sequence', 2, true),

  ('d5100000-0000-0000-0000-000000000011', 'd5000000-0000-0000-0000-000000000003',
   'Mark Roundings',
   'Windward marks, leeward marks, and gate choices. Smooth roundings gain (or lose) multiple places.',
   '{"lessonId": "sailing-3-3", "steps": [
     {"stepNumber": 1, "label": "Windward Mark Approach", "description": "Arriving at the windward mark with control and tactical awareness.", "details": ["Approach on the layline — don''t overstand or understand", "Establish inside overlap 3 boat-lengths from the mark (zone rules)", "If overlapped inside, you have mark room rights", "If approaching on port, you must keep clear of starboard tackers", "Call out your position clearly to other boats: overlap, no overlap"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Downwind"},
     {"stepNumber": 2, "label": "Rounding Technique", "description": "The wide-tight arc that gains you distance on every rounding.", "details": ["Wide approach: swing wide as you enter the turn", "Tight exit: cut close to the mark as you leave", "This wide-in, tight-out arc keeps your speed through the rounding", "Ease sails as you bear away around the mark", "Set the spinnaker or gybe set as smoothly as possible"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Downwind"},
     {"stepNumber": 3, "label": "Leeward Mark", "description": "The leeward mark rounding sets up your entire next beat.", "details": ["Approach wide from below to set up a tight exit at the mark", "Tight exit means you come out close-hauled, pointing high, with speed", "Trim sails in progressively as you round up — don''t shock-load them", "The boat that exits closest to the wind gains an immediate advantage", "Crew weight moves to the hiking position as you round up to close-hauled"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Downwind"},
     {"stepNumber": 4, "label": "Gate Mark Selection", "description": "When there are two leeward marks, pick the one that gives you the best next leg.", "details": ["Choose the mark that lets you start the next beat on the favored tack", "If the wind has shifted left, round the port gate mark to go left", "If the wind has shifted right, round the starboard gate mark to go right", "Consider fleet traffic: which mark has fewer boats?", "If no strong preference, choose the mark that avoids rounding in another boat''s dirty air"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Downwind"}
   ]}'::jsonb, 'mark-rounding-diagram', 3, true),

  ('d5100000-0000-0000-0000-000000000012', 'd5000000-0000-0000-0000-000000000003',
   'Tactical Decisions Downwind',
   'Covering, wave riding, pressure hunting. Make winning decisions on every run.',
   '{"lessonId": "sailing-3-4", "steps": [
     {"stepNumber": 1, "label": "Pressure Hunting", "description": "Look upwind to find puffs of stronger wind and sail toward them.", "details": ["Dark patches on the water indicate more wind (pressure)", "Sail toward the pressure — it will reach you sooner and you ride it longer", "Connect the dots: sail from puff to puff across the run", "When a puff hits, bear away to accelerate and surf it", "In light air, pressure hunting is the single biggest speed differentiator"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Downwind"},
     {"stepNumber": 2, "label": "Wave Riding", "description": "Catch waves and surf them for bursts of speed that transform your downwind legs.", "details": ["Watch for waves approaching from behind and to windward", "As a wave reaches your stern, bear away to catch it and accelerate", "Pump the sails (where class rules allow) to help the boat onto the wave", "Once surfing, steer to stay on the wave face as long as possible", "In planing boats, wave riding can double your speed for short bursts"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Downwind"},
     {"stepNumber": 3, "label": "Covering Opponents", "description": "Control the boats behind you by keeping them in your wind shadow.", "details": ["Your wind shadow extends behind and to leeward of your boat", "Position yourself so trailing boats sail in your disturbed air", "Mirror their gybes: when they gybe, you gybe to maintain the cover", "Tight covering works best when leading by a small margin", "Don''t cover so aggressively that you lose contact with the rest of the fleet"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Downwind"},
     {"stepNumber": 4, "label": "Strategic Gybing", "description": "Connect pressure lines and use gybes to sail the fastest path.", "details": ["Plan gybes to connect areas of stronger wind pressure", "Gybe when a new pressure line appears on the opposite side", "Minimize total gybes in light air — each one costs speed", "In heavy air, gybe confidently and frequently to stay in the best lanes", "The best downwind sailors gybe on shifts just like upwind sailors tack on headers"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Downwind"}
   ]}'::jsonb, 'tactical-overlay', 4, true),

  -- ---------------------------------------------------------------------------
  -- Course 4: Race Management & Advanced Tactics
  -- ---------------------------------------------------------------------------

  ('d5100000-0000-0000-0000-000000000013', 'd5000000-0000-0000-0000-000000000004',
   'Race Course Strategy',
   'Weather analysis, current effects, and course bias. Build your race plan before the gun fires.',
   '{"lessonId": "sailing-4-1", "steps": [
     {"stepNumber": 1, "label": "Pre-Race Weather Analysis", "description": "Study the forecast, look at the sky, and form a wind prediction for the race.", "details": ["Check the forecast for wind direction, strength, and trends", "Look for signs: cumulus clouds (thermal activity), high cirrus (front approaching)", "Note the current wind vs forecast — is the breeze ahead or behind schedule?", "Sea breeze usually fills in the afternoon and shifts right (in the Northern Hemisphere)", "Your weather prediction drives your entire first-beat strategy"], "action": "OBSERVE", "criticalAction": true, "competencyArea": "Strategy"},
     {"stepNumber": 2, "label": "Current and Tide Effects", "description": "Water movement can be as important as wind in determining the winning strategy.", "details": ["Current pushing you upwind is favorable — it effectively increases wind speed", "Current pushing you downwind is unfavorable — it decreases apparent wind", "Sail toward the favorable current when possible", "Near shore, current is usually weaker — use this when current opposes you", "Check tide tables before the race: ebb vs flood changes everything"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Strategy"},
     {"stepNumber": 3, "label": "Course Geometry", "description": "Understand how offset marks, gate options, and course bias affect your plan.", "details": ["Offset marks after the windward mark let you bear away without traffic", "Gates at the leeward mark give you a choice — pre-plan which side you want", "Course bias: if the windward mark is off to one side, that side of the beat is shorter", "Multiple windward-leeward legs: adjust strategy each leg as conditions change", "Reaching legs: inside overlap at the mark, sail low then come up for speed"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Strategy"},
     {"stepNumber": 4, "label": "First Beat Strategy", "description": "Your plan for the first leg — the most important strategic decision of the race.", "details": ["Identify the favored side: where is more wind, favorable shift, or favorable current?", "Start at the end that gives you the quickest path to the favored side", "Don''t go to the corner — stay in phase with the shifts and near the fleet", "First beat is about positioning — get to the windward mark in good shape", "Adjust the plan as the beat unfolds — be willing to adapt if conditions change"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Strategy"}
   ]}'::jsonb, 'course-strategy-map', 1, true),

  ('d5100000-0000-0000-0000-000000000014', 'd5000000-0000-0000-0000-000000000004',
   'Fleet Management',
   'When to be conservative vs aggressive, and how to assess risk throughout a race.',
   '{"lessonId": "sailing-4-2", "steps": [
     {"stepNumber": 1, "label": "Risk Assessment", "description": "Evaluate how much risk is appropriate based on your position in the race and series.", "details": ["Leading the series: play it safe, protect your standing", "Behind in the series: take more risks to gain positions", "Early in a regatta: moderate risk, learn the venue", "Final race with everything on the line: match your risk to what you need", "Ask yourself: what is the cost of getting this wrong vs the reward of getting it right?"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Strategy"},
     {"stepNumber": 2, "label": "Conservative Sailing", "description": "How to protect a good position and avoid unnecessary losses.", "details": ["Stay between the fleet and the next mark — don''t let boats get inside you", "Sail in the middle of the course — avoid the corners and laylines", "Cover the boats closest to you in the standings", "Tack on shifts but don''t over-tack — steady sailing preserves position", "Minimize maneuvers: every tack and gybe is a chance to lose speed"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Strategy"},
     {"stepNumber": 3, "label": "Aggressive Moves", "description": "When you need to gain places, calculated aggression can pay off.", "details": ["Go to the side of the course that the fleet is ignoring", "Take a flyer to a corner if you believe a persistent shift is coming", "Port tack start for clear air to the favored side", "Lee-bow opponents to force them to tack away from the favored side", "Aggressive sailing works best when you have a clear tactical reason, not desperation"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Strategy"},
     {"stepNumber": 4, "label": "Fleet Awareness", "description": "Always know where your key competitors are on the course.", "details": ["Identify the 3-5 boats closest to you in the series standings", "Track their position on every leg — where are they relative to you?", "Match their moves if you''re ahead; diverge if you''re behind", "Look behind as well as ahead — threats come from everywhere", "After each mark rounding, take stock: where is the fleet, where am I?"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Strategy"}
   ]}'::jsonb, 'fleet-position-tracker', 2, true),

  ('d5100000-0000-0000-0000-000000000015', 'd5000000-0000-0000-0000-000000000004',
   'Rules & Protest Situations',
   'Key racing rules, room at marks, and penalty turns. Know your rights and obligations.',
   '{"lessonId": "sailing-4-3", "steps": [
     {"stepNumber": 1, "label": "Port-Starboard (Rule 10)", "description": "The most fundamental rule of sailing: port tack keeps clear of starboard tack.", "details": ["A boat on port tack must keep clear of a boat on starboard tack", "This applies in all situations: upwind, downwind, reaching, at marks", "Port tack boat must act early enough so starboard never has to alter course", "Calling starboard loudly and clearly protects your rights", "If in doubt about whether you can cross, duck (pass behind) the starboard boat"], "action": "OBSERVE", "criticalAction": true, "competencyArea": "Strategy"},
     {"stepNumber": 2, "label": "Windward-Leeward (Rule 11)", "description": "When boats are on the same tack, the windward boat must keep clear.", "details": ["Windward boat: the one farther from the wind", "The windward boat must keep clear at all times when overlapped on same tack", "Leeward boat may luff (head up) as long as she gives the windward boat room to keep clear", "This rule applies at the start line, on beats, on runs, and at marks", "If you are the windward boat and it gets tight, bail early"], "action": "OBSERVE", "criticalAction": true, "competencyArea": "Strategy"},
     {"stepNumber": 3, "label": "Room at Marks (Rule 18)", "description": "The rule that governs who gets room to round a mark.", "details": ["If boats are overlapped when the first enters the 3-length zone, inside boat gets room", "Mark room includes room to round or pass the mark in a seamanlike way", "If not overlapped at the zone, outside boat has no obligation to give room", "At a windward mark approached on opposite tacks, Rule 10 (port-starboard) applies first", "Call for room early and clearly — don''t assume the other boat knows you''re there"], "action": "OBSERVE", "criticalAction": true, "competencyArea": "Strategy"},
     {"stepNumber": 4, "label": "Proper Course, Finishing, and Penalty Turns", "description": "Other essential rules for racing cleanly and handling fouls.", "details": ["After the start, a leeward boat may not sail above proper course if the windward boat is affected", "To finish, any part of the boat must cross the line in the direction from the last mark", "If you foul another boat, take a Two-Turns Penalty (one tack, one gybe = 360) promptly", "In some events, a One-Turn Penalty (360) applies for minor fouls", "Taking your penalty quickly is sportsmanlike and often costs less than a protest hearing"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Strategy"}
   ]}'::jsonb, 'rules-diagram', 3, true),

  ('d5100000-0000-0000-0000-000000000016', 'd5000000-0000-0000-0000-000000000004',
   'Post-Race Analysis',
   'Structured debrief, what to record, and how to improve continuously between races.',
   '{"lessonId": "sailing-4-4", "steps": [
     {"stepNumber": 1, "label": "Immediate Notes", "description": "Capture your observations within 30 minutes of finishing, while the details are fresh.", "details": ["Write down the wind direction and strength during the race", "Note which side of the course was favored on each beat and run", "Record your start: what end, how was your timing, did you get clear air?", "Note any key moments: a shift you caught, a rounding that gained places", "How did the conditions change during the race?"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Strategy"},
     {"stepNumber": 2, "label": "Structured Debrief Questions", "description": "Ask yourself (and your crew) these questions systematically after every race.", "details": ["Start: was I at the right end, with good speed, on time?", "Upwind: did I tack on the shifts, stay in pressure, avoid the corners?", "Downwind: did I sail the right angles, gybe on the shifts, find pressure?", "Mark roundings: smooth or sloppy? Did I gain or lose places?", "Key decisions: what was my best decision? What would I do differently?"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Strategy"},
     {"stepNumber": 3, "label": "Key Metrics to Track", "description": "Build a simple dataset that reveals patterns over time.", "details": ["Finish position and fleet size (e.g. 5th out of 30)", "Start quality rating (1-5 scale): timing, speed, position, clear air", "Number of shifts you tacked on vs missed", "Number of places gained or lost at mark roundings", "One-sentence summary of what made the biggest difference"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Strategy"},
     {"stepNumber": 4, "label": "Building Your Race Journal", "description": "Over time, your race journal becomes your most valuable coaching tool.", "details": ["Review your journal weekly during the racing season", "Look for patterns: do you consistently lose places at starts? Downwind? Mark roundings?", "Set one specific goal for the next race based on your journal", "Share your journal with a coach or training partner for outside perspective", "The best sailors in the world still debrief every single race"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Strategy"}
   ]}'::jsonb, 'debrief-framework', 4, true)

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  lesson_data = EXCLUDED.lesson_data, interactive_type = EXCLUDED.interactive_type,
  sort_order = EXCLUDED.sort_order, published = EXCLUDED.published, updated_at = now();


-- =============================================================================
-- SECTION 2 — DRAWING: Course 4 + 4 Lessons
-- =============================================================================

-- Update lesson_count on existing drawing courses (safety — ensure they are 4)
UPDATE betterat_courses SET lesson_count = 4, updated_at = now()
WHERE id IN (
  'd3000000-0000-0000-0000-000000000001',
  'd3000000-0000-0000-0000-000000000002',
  'd3000000-0000-0000-0000-000000000003'
);

-- Insert Course 4
INSERT INTO betterat_courses (id, interest_id, title, description, level, topic, sort_order, lesson_count, published)
VALUES
  ('d3000000-0000-0000-0000-000000000004', 'b31dbc01-7892-4f63-9697-84b05546f595',
   'Composition & Design',
   'Arrange elements with intention. Master compositional frameworks, visual weight, eye movement, and the power of negative space.',
   'advanced', 'Composition', 4, 4, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  level = EXCLUDED.level, topic = EXCLUDED.topic,
  lesson_count = EXCLUDED.lesson_count, published = EXCLUDED.published, updated_at = now();

-- Drawing Course 4 — 4 Lessons

INSERT INTO betterat_lessons (id, course_id, title, description, lesson_data, interactive_type, sort_order, published)
VALUES
  ('d3100000-0000-0000-0000-000000000013', 'd3000000-0000-0000-0000-000000000004',
   'Rule of Thirds & Golden Ratio',
   'Compositional frameworks for placing focal points. Move beyond centering everything.',
   '{"lessonId": "drawing-4-1", "steps": [
     {"stepNumber": 1, "label": "Rule of Thirds Grid", "description": "Divide the picture plane into a 3x3 grid and place key elements at intersections.", "details": ["Draw two horizontal and two vertical lines equally spaced", "The four intersection points are natural focal areas", "Place your subject''s most important feature at one of these points", "Horizons work best on the top or bottom third line, not centered", "This simple grid instantly improves most compositions"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Composition"},
     {"stepNumber": 2, "label": "Golden Ratio", "description": "The proportional relationship (~1:1.618) found throughout nature and classical art.", "details": ["The golden ratio creates a spiral that guides the eye through a composition", "Used in Renaissance paintings, architecture, and modern design", "The golden rectangle subdivides into smaller golden rectangles infinitely", "Place your focal point near the tightest part of the spiral", "Don''t force it — use it as a guide, not a rigid rule"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Composition"},
     {"stepNumber": 3, "label": "Breaking the Rules", "description": "Centered compositions and symmetry have their place — know when to break the grid.", "details": ["Centered composition conveys stability, formality, and power", "Perfect symmetry feels calm but can feel static", "Deliberate rule-breaking creates tension and visual interest", "Know the rules so you can break them with purpose, not ignorance", "Exercise: draw the same subject three ways — thirds, golden ratio, centered"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Composition"}
   ]}'::jsonb, 'drawing-exercise', 1, true),

  ('d3100000-0000-0000-0000-000000000014', 'd3000000-0000-0000-0000-000000000004',
   'Visual Weight & Balance',
   'How value, contrast, size, and detail create balance in a composition.',
   '{"lessonId": "drawing-4-2", "steps": [
     {"stepNumber": 1, "label": "What Creates Visual Weight", "description": "Certain properties make elements feel heavier in a composition.", "details": ["Dark values feel heavier than light values", "Large shapes feel heavier than small shapes", "High contrast areas attract the eye more than low contrast", "Detailed areas feel heavier than empty or simplified areas", "Warm or saturated colors feel heavier than cool or muted ones"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Composition"},
     {"stepNumber": 2, "label": "Symmetrical vs Asymmetrical Balance", "description": "Two fundamental approaches to distributing visual weight.", "details": ["Symmetrical: equal weight on both sides of a central axis", "Feels formal, stable, monumental — think classical architecture", "Asymmetrical: unequal elements balance through contrast", "A large light shape can balance a small dark shape", "Asymmetrical balance feels more dynamic and natural"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Composition"},
     {"stepNumber": 3, "label": "Balance Study", "description": "Create compositions that feel balanced using different strategies.", "details": ["Draw a large shape on one side and balance it with a smaller, darker shape", "Use value contrast to create a focal point that anchors the composition", "Try an asymmetrical composition with three elements of different sizes", "Squint at your drawing — does it feel weighted to one side?", "Adjust until the composition feels settled, not tipping"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Composition"},
     {"stepNumber": 4, "label": "Intentional Imbalance", "description": "Sometimes unbalanced compositions create powerful effects.", "details": ["An off-balance composition creates tension and unease", "Useful for dynamic, dramatic, or unsettling subjects", "A figure at the very edge of the frame implies motion or departure", "Empty space on one side can create loneliness or vastness", "Intentional imbalance only works if the viewer senses it was a deliberate choice"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Composition"}
   ]}'::jsonb, 'drawing-exercise', 2, true),

  ('d3100000-0000-0000-0000-000000000015', 'd3000000-0000-0000-0000-000000000004',
   'Leading the Eye',
   'Directional lines, value contrast, and focal hierarchy. Control where the viewer looks.',
   '{"lessonId": "drawing-4-3", "steps": [
     {"stepNumber": 1, "label": "Leading Lines", "description": "Use directional lines to guide the viewer through your composition.", "details": ["Roads, rivers, fences, and edges all act as leading lines", "Lines that converge toward the focal point draw the eye inward", "Diagonal lines create energy; horizontal lines create calm", "Curved lines lead the eye more gently than straight lines", "Avoid lines that lead the eye out of the composition at the edges"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Composition"},
     {"stepNumber": 2, "label": "Value Contrast as a Guide", "description": "The eye goes to the area of highest contrast first.", "details": ["Place your strongest light-dark contrast at the focal point", "Reduce contrast in secondary areas so they don''t compete", "A bright white next to a deep black is irresistible to the eye", "Atmospheric perspective: reduce contrast for distant elements", "This principle works in every medium — pencil, charcoal, ink, paint"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Composition"},
     {"stepNumber": 3, "label": "Focal Hierarchy", "description": "Create a clear primary, secondary, and tertiary focus in every composition.", "details": ["Primary focal point: highest contrast, most detail, strongest edges", "Secondary elements: moderate contrast and detail, support the story", "Background: lowest contrast, least detail, softest edges", "The viewer should be able to read your hierarchy instantly", "Exercise: draw a scene with three levels of focal importance"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Composition"}
   ]}'::jsonb, 'drawing-exercise', 3, true),

  ('d3100000-0000-0000-0000-000000000016', 'd3000000-0000-0000-0000-000000000004',
   'Negative Space & Cropping',
   'Using empty space as a design element. What you leave out is as important as what you include.',
   '{"lessonId": "drawing-4-4", "steps": [
     {"stepNumber": 1, "label": "Seeing Negative Space", "description": "Train yourself to see the shapes between and around objects, not just the objects.", "details": ["Negative space is the area around and between subjects", "Drawing negative space forces accurate observation of shapes", "The shape of the background is a shape too — make it interesting", "Exercise: draw only the negative space around a chair without drawing the chair itself", "When negative space is well-designed, the whole composition improves"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Composition"},
     {"stepNumber": 2, "label": "Using Empty Space", "description": "Empty areas of a composition are not wasted — they are active design elements.", "details": ["Open space gives the eye a place to rest", "It creates breathing room around the focal point", "Large areas of empty space can convey isolation, calm, or scale", "The ratio of filled-to-empty space sets the mood of the piece", "Don''t fill every corner — restraint is a sign of confidence"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Composition"},
     {"stepNumber": 3, "label": "Cropping for Impact", "description": "Where you place the edges of your composition changes everything.", "details": ["Tight cropping creates intimacy and intensity", "Wide cropping gives context and environment", "Cropping into a figure (cutting off feet, top of head) creates immediacy", "Avoid awkward crops at joints — don''t cut at wrists, knees, or ankles", "Use thumbnail sketches to test different crops before committing"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Composition"},
     {"stepNumber": 4, "label": "Thumbnail Composition Studies", "description": "Plan compositions quickly with small, rough value sketches before starting the final piece.", "details": ["Thumbnails are 1-2 inch sketches — no detail, just shapes and values", "Do 6-9 thumbnails for every composition to find the strongest one", "Limit yourself to 3 values: light, medium, dark", "Test different crops, placements, and value distributions", "The 5 minutes spent on thumbnails saves hours on the final drawing"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Composition"}
   ]}'::jsonb, 'drawing-exercise', 4, true)

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  lesson_data = EXCLUDED.lesson_data, interactive_type = EXCLUDED.interactive_type,
  sort_order = EXCLUDED.sort_order, published = EXCLUDED.published, updated_at = now();


-- =============================================================================
-- SECTION 3 — FITNESS: Course 4 + 4 Lessons
-- =============================================================================

-- Update lesson_count on existing fitness courses (safety — ensure they are 4)
UPDATE betterat_courses SET lesson_count = 4, updated_at = now()
WHERE id IN (
  'd4000000-0000-0000-0000-000000000001',
  'd4000000-0000-0000-0000-000000000002',
  'd4000000-0000-0000-0000-000000000003'
);

-- Insert Course 4
INSERT INTO betterat_courses (id, interest_id, title, description, level, topic, sort_order, lesson_count, published)
VALUES
  ('d4000000-0000-0000-0000-000000000004', 'f138e519-7ac9-4497-a0ee-fba242482bce',
   'Performance & Competition Prep',
   'Peak for competition day. Taper strategies, testing protocols, mental preparation, and execution under pressure.',
   'advanced', 'Competition', 4, 4, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  level = EXCLUDED.level, topic = EXCLUDED.topic,
  lesson_count = EXCLUDED.lesson_count, published = EXCLUDED.published, updated_at = now();

-- Fitness Course 4 — 4 Lessons

INSERT INTO betterat_lessons (id, course_id, title, description, lesson_data, interactive_type, sort_order, published)
VALUES
  ('d4100000-0000-0000-0000-000000000013', 'd4000000-0000-0000-0000-000000000004',
   'Peaking for Competition',
   'Taper strategies and meet-day preparation. Arrive at competition day fully recovered and primed to perform.',
   '{"lessonId": "fitness-4-1", "steps": [
     {"stepNumber": 1, "label": "The Taper", "description": "Reduce training volume while maintaining intensity to shed fatigue without losing fitness.", "details": ["Begin taper 1-3 weeks before competition depending on sport and training age", "Reduce volume (sets, reps, total work) by 40-60%", "Maintain or slightly increase intensity (weight on the bar)", "Reduce training frequency slightly — drop accessory work first", "Fatigue dissipates faster than fitness — trust the process"], "action": "OBSERVE", "criticalAction": true, "competencyArea": "Competition"},
     {"stepNumber": 2, "label": "Peaking Protocols", "description": "Different sports and goals require different peaking strategies.", "details": ["Strength peaking: last heavy session 7-10 days out, then light openers", "Endurance peaking: reduce long sessions, keep short intense work", "Linear taper: gradual reduction over 2-3 weeks", "Step taper: sudden large reduction 1 week out", "Overshoot then taper: push hard 3-4 weeks out, then drop dramatically"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Competition"},
     {"stepNumber": 3, "label": "Meet-Day Preparation", "description": "The 24 hours before competition require careful planning.", "details": ["Eat familiar foods — nothing new on competition day", "Hydrate well the day before — don''t try to catch up on race morning", "Pack all equipment the night before with a checklist", "Plan travel to arrive with time to spare — rushing increases anxiety", "Visualize your performance: walk through the day mentally"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Competition"},
     {"stepNumber": 4, "label": "Common Peaking Mistakes", "description": "Avoid the errors that sabotage months of preparation.", "details": ["Testing maxes too close to competition — you peak for the test, not the event", "Trying a new training stimulus in the final 2 weeks", "Under-eating during the taper because training volume drops", "Panicking that you are losing fitness and adding extra sessions", "Neglecting sleep — the taper works best with extra sleep, not just less training"], "action": "VERIFY", "criticalAction": false, "competencyArea": "Competition"}
   ]}'::jsonb, 'training-concept', 1, true),

  ('d4100000-0000-0000-0000-000000000014', 'd4000000-0000-0000-0000-000000000004',
   'Testing & Benchmarks',
   'Standardized fitness tests and 1RM protocols. Measure progress accurately and safely.',
   '{"lessonId": "fitness-4-2", "steps": [
     {"stepNumber": 1, "label": "Why Test?", "description": "Regular testing provides objective data to drive training decisions.", "details": ["Testing removes guesswork from program design", "It reveals strengths and weaknesses to address", "Benchmark data shows whether your training is working", "Testing also practices the skill of performing under pressure", "Test every 8-12 weeks for meaningful comparison"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Competition"},
     {"stepNumber": 2, "label": "1RM Testing Protocol", "description": "Safely find your one-rep max on the major lifts.", "details": ["Only test 1RM on well-practiced lifts with good technique", "Warm up thoroughly: bar x 10, 50% x 5, 70% x 3, 80% x 2, 90% x 1", "First attempt: a weight you know you can make (opener)", "Second attempt: a moderate jump (5-10 lbs / 2.5-5 kg)", "Third attempt: the target max — go for it", "Rest 3-5 minutes between max attempts"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Competition"},
     {"stepNumber": 3, "label": "Estimated vs Actual Max", "description": "Use rep-max formulas when testing a true 1RM is impractical or risky.", "details": ["Brzycki formula: 1RM = weight x (36 / (37 - reps))", "Most accurate in the 3-5 rep range", "Becomes less accurate above 10 reps", "Use the same formula consistently for valid comparisons", "Estimated max is useful for programming percentages"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Competition"},
     {"stepNumber": 4, "label": "Benchmark Tests Beyond Strength", "description": "Assess conditioning, mobility, and body composition alongside strength.", "details": ["Conditioning: 2000m row, 500m row, or timed run (choose one and repeat)", "Vertical jump: measures power output", "Sit-and-reach or overhead squat assessment: baseline mobility", "Body composition: use the same method each time (scale, tape, calipers)", "Record all results in the same format for easy comparison over months"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Competition"}
   ]}'::jsonb, 'training-concept', 2, true),

  ('d4100000-0000-0000-0000-000000000015', 'd4000000-0000-0000-0000-000000000004',
   'Mental Preparation',
   'Visualization, arousal control, and pre-competition routines. Train the mind alongside the body.',
   '{"lessonId": "fitness-4-3", "steps": [
     {"stepNumber": 1, "label": "Visualization", "description": "Mentally rehearse your performance in vivid detail before it happens.", "details": ["Close your eyes and see yourself performing each movement perfectly", "Include all senses: feel the bar, hear the crowd, smell the chalk", "Visualize from first person (your own eyes) for motor skill rehearsal", "Visualize from third person (watching yourself) for technique correction", "Practice visualization daily in the weeks before competition"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Competition"},
     {"stepNumber": 2, "label": "Arousal Control", "description": "Get psyched up enough to perform, but not so much that you lose control.", "details": ["Under-aroused: sluggish, unfocused, flat — needs activation", "Over-aroused: anxious, shaky, rushed — needs calming", "Activation techniques: loud music, power poses, ammonia salts, self-talk", "Calming techniques: deep breathing (box breathing: 4-4-4-4), progressive muscle relaxation", "Find your optimal arousal zone through practice — it is individual"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Competition"},
     {"stepNumber": 3, "label": "Pre-Competition Routines", "description": "Build a repeatable sequence that puts you in your optimal mental state.", "details": ["Develop a pre-event routine: music, warm-up, visualization, cue words", "Practice the routine before every training session so it becomes automatic", "The routine is an anchor — it signals your brain that it is time to perform", "Keep it simple: 3-5 steps that take 10-15 minutes", "Don''t skip the routine on competition day — that is exactly when you need it most"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Competition"},
     {"stepNumber": 4, "label": "Dealing with Nerves", "description": "Competition anxiety is normal. Channel it instead of fighting it.", "details": ["Reframe anxiety as excitement — the physiological response is identical", "Focus on process goals (hit depth on every squat) not outcome goals (win)", "Accept that some nervousness is performance-enhancing up to a point", "Have a reset strategy: if you lose focus, take a breath and return to your cue word", "Experience is the best teacher — the more you compete, the better you manage nerves"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Competition"}
   ]}'::jsonb, 'training-concept', 3, true),

  ('d4100000-0000-0000-0000-000000000016', 'd4000000-0000-0000-0000-000000000004',
   'Competition Day Execution',
   'Attempt selection, warm-up timing, and between-attempts strategy. Perform when it counts.',
   '{"lessonId": "fitness-4-4", "steps": [
     {"stepNumber": 1, "label": "Attempt Selection", "description": "Choose attempts that maximize your total while minimizing risk.", "details": ["Opener: a weight you can hit on your worst day (90-92% of max)", "Second attempt: a moderate jump that builds confidence (95-97%)", "Third attempt: go for a PR or strategic weight (100-103%)", "Never open heavier than planned because you feel good in warm-ups", "Write down your attempts beforehand — don''t decide in the moment"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Competition"},
     {"stepNumber": 2, "label": "Warm-Up Timing", "description": "Time your warm-up so you are primed when your name is called.", "details": ["Know the flight order and approximate timing for your attempts", "Begin warming up 30-45 minutes before your first attempt", "Follow the same warm-up progression you used in training", "Last warm-up should be at or near your opener weight", "Finish your last warm-up 5-10 minutes before you are called — not 20"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Competition"},
     {"stepNumber": 3, "label": "Between-Attempts Strategy", "description": "Manage your time, energy, and focus between lifts.", "details": ["Stay warm: light movement, don''t sit down and get cold", "Eat and drink small amounts — don''t eat a meal between attempts", "Review your plan for the next attempt: what cues, what weight", "Avoid watching other competitors if it makes you anxious", "Stay in your routine: music, visualization, cue words"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Competition"},
     {"stepNumber": 4, "label": "Adapting Your Plan", "description": "When competition day does not go as planned, adjust intelligently.", "details": ["Missed opener: repeat the same weight or take a small reduction", "Easy opener: stick to the planned second attempt — don''t jump too much", "If you feel much better or worse than expected, adjust by 2-5% maximum", "Equipment issues: have backups for everything (belt, shoes, wraps)", "Bad day? Focus on going 6 for 9 or better — every made lift counts"], "action": "VERIFY", "criticalAction": false, "competencyArea": "Competition"}
   ]}'::jsonb, 'training-concept', 4, true)

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  lesson_data = EXCLUDED.lesson_data, interactive_type = EXCLUDED.interactive_type,
  sort_order = EXCLUDED.sort_order, published = EXCLUDED.published, updated_at = now();
