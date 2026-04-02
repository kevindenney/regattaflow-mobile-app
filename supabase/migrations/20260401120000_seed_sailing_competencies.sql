-- ============================================================================
-- Seed: 34 Sail Racing Competencies (RYA-based framework)
--
-- Maps the SAILING_CORE_V1_SKILLS from configs/competencies/sailing-core-v1.ts
-- into betterat_competencies so the Personal Achievement Matrix can display
-- sailing competency progress alongside other interests.
--
-- Interest: Sail Racing (5e6b64c3-ea92-42a1-baf5-9342c53eb7d9)
-- ============================================================================

INSERT INTO betterat_competencies (id, interest_id, category, competency_number, title, description, requires_supervision, sort_order)
VALUES
  -- Starts (1-6)
  ('c0000000-0002-0000-0000-000000000001', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Starts', 1, 'Time-Distance Judgment',
   'Matches approach speed to the line with minimal late acceleration.',
   false, 1),

  ('c0000000-0002-0000-0000-000000000002', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Starts', 2, 'Line Bias Reads',
   'Assesses favored end and adjusts setup before final approach.',
   false, 2),

  ('c0000000-0002-0000-0000-000000000003', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Starts', 3, 'Gap Creation and Protection',
   'Creates a defendable hole and prevents leeward overlap collapse.',
   false, 3),

  ('c0000000-0002-0000-0000-000000000004', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Starts', 4, 'Acceleration Timing',
   'Executes final acceleration sequence from low-speed control to full mode.',
   false, 4),

  ('c0000000-0002-0000-0000-000000000005', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Starts', 5, 'High-Risk Management',
   'Chooses conservative vs aggressive start plans based on fleet context.',
   false, 5),

  ('c0000000-0002-0000-0000-000000000006', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Starts', 6, 'Comms Under Sequence',
   'Uses concise call-outs for line, traffic, and countdown priorities.',
   false, 6),

  -- Boat-Handling (7-13)
  ('c0000000-0002-0000-0000-000000000007', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Boat-Handling', 7, 'Tack Exit Quality',
   'Maintains flow and target mode through tack entry, turn, and exit.',
   false, 7),

  ('c0000000-0002-0000-0000-000000000008', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Boat-Handling', 8, 'Gybe Exit Quality',
   'Controls heel and angle to preserve pressure through gybe exit.',
   false, 8),

  ('c0000000-0002-0000-0000-000000000009', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Boat-Handling', 9, 'Mark Rounding Entries',
   'Sets clean approach lanes with stable speed and right-of-way control.',
   false, 9),

  ('c0000000-0002-0000-0000-000000000010', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Boat-Handling', 10, 'Hoist Execution',
   'Executes hoists with minimal speed loss and coordinated crew timing.',
   false, 10),

  ('c0000000-0002-0000-0000-000000000011', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Boat-Handling', 11, 'Douse Execution',
   'Performs douses cleanly with maintained control into next mode.',
   false, 11),

  ('c0000000-0002-0000-0000-000000000012', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Boat-Handling', 12, 'Boat-Handling in Traffic',
   'Completes maneuvers predictably while managing nearby boats and rules.',
   false, 12),

  ('c0000000-0002-0000-0000-000000000013', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Boat-Handling', 13, 'Boat Balance Control',
   'Maintains trim and heel targets across maneuvers and sea states.',
   false, 13),

  -- Speed (14-20)
  ('c0000000-0002-0000-0000-000000000014', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Speed', 14, 'Upwind Target Mode',
   'Holds target speed-angle balance for prevailing pressure and chop.',
   false, 14),

  ('c0000000-0002-0000-0000-000000000015', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Speed', 15, 'Downwind Target Mode',
   'Sustains target VMG mode with controlled angle and pressure response.',
   false, 15),

  ('c0000000-0002-0000-0000-000000000016', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Speed', 16, 'Sail Shape Adjustment',
   'Adjusts controls to keep efficient sail shape as wind changes.',
   false, 16),

  ('c0000000-0002-0000-0000-000000000017', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Speed', 17, 'Crew Weight Placement',
   'Positions crew weight for balance and reduced drag in each condition.',
   false, 17),

  ('c0000000-0002-0000-0000-000000000018', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Speed', 18, 'Pressure Connection',
   'Finds and stays connected to pressure lines that build gains.',
   false, 18),

  ('c0000000-0002-0000-0000-000000000019', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Speed', 19, 'Wave and Chop Technique',
   'Adjusts steering and trim rhythm to maintain flow through waves.',
   false, 19),

  ('c0000000-0002-0000-0000-000000000020', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Speed', 20, 'Mode Shift Discipline',
   'Switches between point and speed modes deliberately and on time.',
   false, 20),

  -- Tactics (21-27)
  ('c0000000-0002-0000-0000-000000000021', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Tactics', 21, 'Lane Protection',
   'Protects clear air and maneuver options after starts and roundings.',
   false, 21),

  ('c0000000-0002-0000-0000-000000000022', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Tactics', 22, 'Cross-or-Tack Decisions',
   'Chooses crosses or tacks based on closure, risk, and phase.',
   false, 22),

  ('c0000000-0002-0000-0000-000000000023', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Tactics', 23, 'Leverage Management',
   'Uses fleet leverage intentionally without overexposing to losses.',
   false, 23),

  ('c0000000-0002-0000-0000-000000000024', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Tactics', 24, 'Covering When Ahead',
   'Balances control and speed to protect lead against nearest threats.',
   false, 24),

  ('c0000000-0002-0000-0000-000000000025', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Tactics', 25, 'Breaking Cover When Behind',
   'Finds credible separation opportunities to recover from deficits.',
   false, 25),

  ('c0000000-0002-0000-0000-000000000026', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Tactics', 26, 'Mark-Room and Rules Use',
   'Uses rules knowledge proactively to defend or gain tactical position.',
   false, 26),

  ('c0000000-0002-0000-0000-000000000027', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Tactics', 27, 'Fleet Position Awareness',
   'Tracks key boats and fleet shape to avoid local tactical traps.',
   false, 27),

  -- Strategy (28-34)
  ('c0000000-0002-0000-0000-000000000028', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Strategy', 28, 'Wind Shift Modeling',
   'Builds a working shift model and updates it as new data appears.',
   false, 28),

  ('c0000000-0002-0000-0000-000000000029', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Strategy', 29, 'Course Side Selection',
   'Selects side based on pressure, shift probability, and race state.',
   false, 29),

  ('c0000000-0002-0000-0000-000000000030', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Strategy', 30, 'Current and Tide Integration',
   'Integrates current effects into laylines, start setup, and crossings.',
   false, 30),

  ('c0000000-0002-0000-0000-000000000031', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Strategy', 31, 'Risk Profile by Series State',
   'Adjusts strategic risk based on discard profile and standings.',
   false, 31),

  ('c0000000-0002-0000-0000-000000000032', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Strategy', 32, 'Pre-Race Plan Quality',
   'Creates a clear pre-race plan with triggers and fallback options.',
   false, 32),

  ('c0000000-0002-0000-0000-000000000033', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Strategy', 33, 'Post-Race Debrief Quality',
   'Produces useful debriefs that convert race evidence into next actions.',
   false, 33),

  ('c0000000-0002-0000-0000-000000000034', '5e6b64c3-ea92-42a1-baf5-9342c53eb7d9',
   'Strategy', 34, 'Adaptation Speed',
   'Updates strategy quickly when observed conditions diverge from plan.',
   false, 34)

ON CONFLICT DO NOTHING;
