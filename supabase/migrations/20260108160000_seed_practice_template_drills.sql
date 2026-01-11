-- Seed practice_template_drills to properly link templates with drills
-- This enables the wizard to populate drills when a template is selected

-- First, clear existing template drills to avoid conflicts, then re-seed all
DELETE FROM practice_template_drills;

-- 1. Starting Fundamentals
INSERT INTO practice_template_drills (template_id, drill_id, order_index, duration_minutes, default_crew_tasks)
VALUES
  ('500d4489-6be7-4623-919d-4a0dac0d2734', '0d4226eb-7d21-4dff-a4af-74c894156eef', 0, 15,
   '[{"role": "skipper", "task": "Build speed before start"}, {"role": "crew", "task": "Trim for max acceleration"}]'::jsonb),
  ('500d4489-6be7-4623-919d-4a0dac0d2734', '63a6f096-cf25-4e8c-a8ae-62265285599a', 1, 10,
   '[{"role": "skipper", "task": "Call favored end"}, {"role": "crew", "task": "Watch time to line"}]'::jsonb),
  ('500d4489-6be7-4623-919d-4a0dac0d2734', 'df94e331-a3fa-4bbd-b5de-a3a6c490511b', 2, 20,
   '[{"role": "skipper", "task": "Execute clean starts"}, {"role": "crew", "task": "Call time and gaps"}]'::jsonb);

-- 2. Gate Start Practice
INSERT INTO practice_template_drills (template_id, drill_id, order_index, duration_minutes, default_crew_tasks)
VALUES
  ('dd039b13-3ec6-4a46-8a42-d6bdb386f6a5', '7055f162-761e-47af-8be3-1ac411229d94', 0, 15,
   '[{"role": "skipper", "task": "Time gate boat crossing"}, {"role": "crew", "task": "Call gate boat position"}]'::jsonb),
  ('dd039b13-3ec6-4a46-8a42-d6bdb386f6a5', '0326d0c5-b671-4adf-a7ba-7872451681e1', 1, 20,
   '[{"role": "skipper", "task": "Execute rabbit start entries"}, {"role": "crew", "task": "Track pathfinder boat"}]'::jsonb),
  ('dd039b13-3ec6-4a46-8a42-d6bdb386f6a5', '0d4226eb-7d21-4dff-a4af-74c894156eef', 2, 15,
   '[{"role": "skipper", "task": "Maximize acceleration"}, {"role": "crew", "task": "Coordinate trim for speed"}]'::jsonb);

-- 3. Mark Rounding Clinic
INSERT INTO practice_template_drills (template_id, drill_id, order_index, duration_minutes, default_crew_tasks)
VALUES
  ('0d148214-5f8e-4b10-871c-f7a4beb74b5b', '76d8d41b-186c-4b76-94a7-78088cefd70a', 0, 15,
   '[{"role": "skipper", "task": "Approach wide, exit tight"}, {"role": "crew", "task": "Call layline"}]'::jsonb),
  ('0d148214-5f8e-4b10-871c-f7a4beb74b5b', 'aa9a6243-7c44-4bae-929f-2c2180b4a9d9', 1, 15,
   '[{"role": "skipper", "task": "Clean bear-away"}, {"role": "crew", "task": "Execute spinnaker set"}]'::jsonb),
  ('0d148214-5f8e-4b10-871c-f7a4beb74b5b', '5fa3272e-f81b-4d1b-b136-53ec38ded9ac', 2, 15,
   '[{"role": "skipper", "task": "Time the drop"}, {"role": "crew", "task": "Clean spinnaker drop"}]'::jsonb),
  ('0d148214-5f8e-4b10-871c-f7a4beb74b5b', 'd7e97691-ba19-4f28-b8d7-8feaacacfd05', 3, 20,
   '[{"role": "skipper", "task": "Establish rights early"}, {"role": "crew", "task": "Call overlaps"}]'::jsonb);

-- 4. Upwind Tactics
INSERT INTO practice_template_drills (template_id, drill_id, order_index, duration_minutes, default_crew_tasks)
VALUES
  ('e9659a0e-5c98-416f-97af-92d462a5a067', '1a8f570c-8e90-42d4-a817-e140145a24ba', 0, 15,
   '[{"role": "skipper", "task": "Maintain target VMG"}, {"role": "crew", "task": "Call target numbers"}]'::jsonb),
  ('e9659a0e-5c98-416f-97af-92d462a5a067', 'b7dec931-a19f-4f55-8396-4c7d35e68d55', 1, 20,
   '[{"role": "skipper", "task": "React to headers"}, {"role": "crew", "task": "Call wind shifts"}]'::jsonb),
  ('e9659a0e-5c98-416f-97af-92d462a5a067', '768213e4-4849-4c5a-8ca9-65e064516db9', 2, 15,
   '[{"role": "skipper", "task": "Protect your lane"}, {"role": "crew", "task": "Watch fleet positions"}]'::jsonb),
  ('e9659a0e-5c98-416f-97af-92d462a5a067', '6d15efbc-3190-4410-86fe-7736f54d6a37', 3, 15,
   '[{"role": "skipper", "task": "Mode shift decisions"}, {"role": "crew", "task": "Adjust trim for mode"}]'::jsonb);

-- 5. Downwind Speed
INSERT INTO practice_template_drills (template_id, drill_id, order_index, duration_minutes, default_crew_tasks)
VALUES
  ('89f3887b-760a-4fba-a57a-cdd15c6d589e', '24c6552b-5c73-4eff-8915-b7bfb59edc00', 0, 20,
   '[{"role": "skipper", "task": "Find pressure"}, {"role": "crew", "task": "Spot puffs ahead"}]'::jsonb),
  ('89f3887b-760a-4fba-a57a-cdd15c6d589e', '076d3a94-8354-474c-8759-6c4241af2678', 1, 15,
   '[{"role": "skipper", "task": "Optimize VMG angles"}, {"role": "crew", "task": "Trim for target speed"}]'::jsonb),
  ('89f3887b-760a-4fba-a57a-cdd15c6d589e', 'd33ee238-5173-429a-9e2b-ded214f62be6', 2, 15,
   '[{"role": "skipper", "task": "Clean gybes"}, {"role": "crew", "task": "Coordinate pole/sheet"}]'::jsonb);

-- 6. Crew Communication Drills
INSERT INTO practice_template_drills (template_id, drill_id, order_index, duration_minutes, default_crew_tasks)
VALUES
  ('bc6faf5c-74d7-44c8-b9a2-3bba375b44d5', 'dae892c1-8057-4cc7-a443-11f00f875ff3', 0, 15,
   '[{"role": "skipper", "task": "Listen and respond"}, {"role": "crew", "task": "Clear, concise calls"}]'::jsonb),
  ('bc6faf5c-74d7-44c8-b9a2-3bba375b44d5', '6fafcc5e-3bbd-4062-8c61-96ef71a28544', 1, 15,
   '[{"role": "skipper", "task": "Call weight positions"}, {"role": "crew", "task": "Move smoothly"}]'::jsonb),
  ('bc6faf5c-74d7-44c8-b9a2-3bba375b44d5', '83aa7076-b913-4432-9d71-e3f78e0c21f7', 2, 30,
   '[{"role": "skipper", "task": "Try crew role"}, {"role": "crew", "task": "Try helm"}]'::jsonb);

-- 7. Quick Tack Workout
INSERT INTO practice_template_drills (template_id, drill_id, order_index, duration_minutes, default_crew_tasks)
VALUES
  ('32d3c2b9-7e9e-49cb-b945-eafe84d466da', '190fb8b2-7090-4d73-bd6f-86caf5710f49', 0, 10,
   '[{"role": "skipper", "task": "Execute roll tacks"}, {"role": "crew", "task": "Coordinate roll timing"}]'::jsonb),
  ('32d3c2b9-7e9e-49cb-b945-eafe84d466da', 'd33ee238-5173-429a-9e2b-ded214f62be6', 1, 15,
   '[{"role": "skipper", "task": "Smooth gybe transitions"}, {"role": "crew", "task": "Handle sheets cleanly"}]'::jsonb);

-- 8. Pre-Race Warmup
INSERT INTO practice_template_drills (template_id, drill_id, order_index, duration_minutes, default_crew_tasks)
VALUES
  ('43c7273e-86d2-420b-9048-71993a0cb66e', '190fb8b2-7090-4d73-bd6f-86caf5710f49', 0, 10,
   '[{"role": "skipper", "task": "Warm up maneuvers"}, {"role": "crew", "task": "Check all systems"}]'::jsonb),
  ('43c7273e-86d2-420b-9048-71993a0cb66e', '0d4226eb-7d21-4dff-a4af-74c894156eef', 1, 15,
   '[{"role": "skipper", "task": "Get boat up to speed"}, {"role": "crew", "task": "Dial in trim"}]'::jsonb),
  ('43c7273e-86d2-420b-9048-71993a0cb66e', '63a6f096-cf25-4e8c-a8ae-62265285599a', 2, 10,
   '[{"role": "skipper", "task": "Check line bias"}, {"role": "crew", "task": "Time line runs"}]'::jsonb);

-- 9. Rules & Scenarios
INSERT INTO practice_template_drills (template_id, drill_id, order_index, duration_minutes, default_crew_tasks)
VALUES
  ('944c7e8d-d19c-4df3-94f0-5939103d53d1', 'd7e97691-ba19-4f28-b8d7-8feaacacfd05', 0, 20,
   '[{"role": "skipper", "task": "Practice zone entries"}, {"role": "crew", "task": "Call rights situations"}]'::jsonb),
  ('944c7e8d-d19c-4df3-94f0-5939103d53d1', 'df94e331-a3fa-4bbd-b5de-a3a6c490511b', 1, 20,
   '[{"role": "skipper", "task": "Practice port/starboard"}, {"role": "crew", "task": "Call conflicts"}]'::jsonb);

-- 10. Full Race Simulation
INSERT INTO practice_template_drills (template_id, drill_id, order_index, duration_minutes, default_crew_tasks)
VALUES
  ('55c7bcad-b446-4ddc-85a2-332a06315b74', '63a6f096-cf25-4e8c-a8ae-62265285599a', 0, 10,
   '[{"role": "skipper", "task": "Pre-start routine"}, {"role": "crew", "task": "Check line bias"}]'::jsonb),
  ('55c7bcad-b446-4ddc-85a2-332a06315b74', '0d4226eb-7d21-4dff-a4af-74c894156eef', 1, 15,
   '[{"role": "skipper", "task": "Clean start"}, {"role": "crew", "task": "Accelerate off line"}]'::jsonb),
  ('55c7bcad-b446-4ddc-85a2-332a06315b74', 'b7dec931-a19f-4f55-8396-4c7d35e68d55', 2, 20,
   '[{"role": "skipper", "task": "Work shifts upwind"}, {"role": "crew", "task": "Call headers/lifts"}]'::jsonb),
  ('55c7bcad-b446-4ddc-85a2-332a06315b74', '76d8d41b-186c-4b76-94a7-78088cefd70a', 3, 15,
   '[{"role": "skipper", "task": "Clean rounding"}, {"role": "crew", "task": "Set up for downwind"}]'::jsonb);
