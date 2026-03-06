export const SAILING_CORE_V1_CATALOG_ID = 'sailing-core-v1' as const;

export const SAILING_RYA_CORE_ELEMENTS = [
  {id: 'starts', title: 'Starts'},
  {id: 'boat-handling', title: 'Boat-Handling'},
  {id: 'speed', title: 'Speed'},
  {id: 'tactics', title: 'Tactics'},
  {id: 'strategy', title: 'Strategy'},
] as const;

export type SailingRyaElementId = typeof SAILING_RYA_CORE_ELEMENTS[number]['id'];

export type SailingCoreV1Skill = {
  id: string;
  domain: SailingRyaElementId;
  title: string;
  shortDescription: string;
};

export const SAILING_CORE_V1_SKILLS: SailingCoreV1Skill[] = [
  {id: 'sail-start-time-distance-judgment', domain: 'starts', title: 'Time-Distance Judgment', shortDescription: 'Matches approach speed to the line with minimal late acceleration.'},
  {id: 'sail-start-line-bias-reads', domain: 'starts', title: 'Line Bias Reads', shortDescription: 'Assesses favored end and adjusts setup before final approach.'},
  {id: 'sail-start-gap-creation-and-protection', domain: 'starts', title: 'Gap Creation and Protection', shortDescription: 'Creates a defendable hole and prevents leeward overlap collapse.'},
  {id: 'sail-start-acceleration-timing', domain: 'starts', title: 'Acceleration Timing', shortDescription: 'Executes final acceleration sequence from low-speed control to full mode.'},
  {id: 'sail-start-high-risk-management', domain: 'starts', title: 'High-Risk Management', shortDescription: 'Chooses conservative vs aggressive start plans based on fleet context.'},
  {id: 'sail-start-comms-under-sequence', domain: 'starts', title: 'Comms Under Sequence', shortDescription: 'Uses concise call-outs for line, traffic, and countdown priorities.'},
  {id: 'sail-hndl-tack-exit-quality', domain: 'boat-handling', title: 'Tack Exit Quality', shortDescription: 'Maintains flow and target mode through tack entry, turn, and exit.'},
  {id: 'sail-hndl-gybe-exit-quality', domain: 'boat-handling', title: 'Gybe Exit Quality', shortDescription: 'Controls heel and angle to preserve pressure through gybe exit.'},
  {id: 'sail-hndl-mark-rounding-entries', domain: 'boat-handling', title: 'Mark Rounding Entries', shortDescription: 'Sets clean approach lanes with stable speed and right-of-way control.'},
  {id: 'sail-hndl-spinnaker-or-ape-hoists', domain: 'boat-handling', title: 'Hoist Execution', shortDescription: 'Executes hoists with minimal speed loss and coordinated crew timing.'},
  {id: 'sail-hndl-spinnaker-or-ape-douses', domain: 'boat-handling', title: 'Douse Execution', shortDescription: 'Performs douses cleanly with maintained control into next mode.'},
  {id: 'sail-hndl-boathandling-in-traffic', domain: 'boat-handling', title: 'Boat-Handling in Traffic', shortDescription: 'Completes maneuvers predictably while managing nearby boats and rules.'},
  {id: 'sail-hndl-boat-balance-control', domain: 'boat-handling', title: 'Boat Balance Control', shortDescription: 'Maintains trim and heel targets across maneuvers and sea states.'},
  {id: 'sail-speed-upwind-target-mode', domain: 'speed', title: 'Upwind Target Mode', shortDescription: 'Holds target speed-angle balance for prevailing pressure and chop.'},
  {id: 'sail-speed-downwind-target-mode', domain: 'speed', title: 'Downwind Target Mode', shortDescription: 'Sustains target VMG mode with controlled angle and pressure response.'},
  {id: 'sail-speed-sail-shape-adjustment', domain: 'speed', title: 'Sail Shape Adjustment', shortDescription: 'Adjusts controls to keep efficient sail shape as wind changes.'},
  {id: 'sail-speed-crew-weight-placement', domain: 'speed', title: 'Crew Weight Placement', shortDescription: 'Positions crew weight for balance and reduced drag in each condition.'},
  {id: 'sail-speed-pressure-connection', domain: 'speed', title: 'Pressure Connection', shortDescription: 'Finds and stays connected to pressure lines that build gains.'},
  {id: 'sail-speed-wave-and-chop-technique', domain: 'speed', title: 'Wave and Chop Technique', shortDescription: 'Adjusts steering and trim rhythm to maintain flow through waves.'},
  {id: 'sail-speed-mode-shift-discipline', domain: 'speed', title: 'Mode Shift Discipline', shortDescription: 'Switches between point and speed modes deliberately and on time.'},
  {id: 'sail-tact-lane-protection', domain: 'tactics', title: 'Lane Protection', shortDescription: 'Protects clear air and maneuver options after starts and roundings.'},
  {id: 'sail-tact-cross-or-tack-decisions', domain: 'tactics', title: 'Cross-or-Tack Decisions', shortDescription: 'Chooses crosses or tacks based on closure, risk, and phase.'},
  {id: 'sail-tact-leverage-management', domain: 'tactics', title: 'Leverage Management', shortDescription: 'Uses fleet leverage intentionally without overexposing to losses.'},
  {id: 'sail-tact-covering-when-ahead', domain: 'tactics', title: 'Covering When Ahead', shortDescription: 'Balances control and speed to protect lead against nearest threats.'},
  {id: 'sail-tact-breaking-cover-when-behind', domain: 'tactics', title: 'Breaking Cover When Behind', shortDescription: 'Finds credible separation opportunities to recover from deficits.'},
  {id: 'sail-tact-mark-room-and-rules-use', domain: 'tactics', title: 'Mark-Room and Rules Use', shortDescription: 'Uses rules knowledge proactively to defend or gain tactical position.'},
  {id: 'sail-tact-fleet-position-awareness', domain: 'tactics', title: 'Fleet Position Awareness', shortDescription: 'Tracks key boats and fleet shape to avoid local tactical traps.'},
  {id: 'sail-strat-wind-shift-modeling', domain: 'strategy', title: 'Wind Shift Modeling', shortDescription: 'Builds a working shift model and updates it as new data appears.'},
  {id: 'sail-strat-course-side-selection', domain: 'strategy', title: 'Course Side Selection', shortDescription: 'Selects side based on pressure, shift probability, and race state.'},
  {id: 'sail-strat-current-and-tide-integration', domain: 'strategy', title: 'Current and Tide Integration', shortDescription: 'Integrates current effects into laylines, start setup, and crossings.'},
  {id: 'sail-strat-risk-profile-by-series-state', domain: 'strategy', title: 'Risk Profile by Series State', shortDescription: 'Adjusts strategic risk based on discard profile and standings.'},
  {id: 'sail-strat-pre-race-plan-quality', domain: 'strategy', title: 'Pre-Race Plan Quality', shortDescription: 'Creates a clear pre-race plan with triggers and fallback options.'},
  {id: 'sail-strat-post-race-debrief-quality', domain: 'strategy', title: 'Post-Race Debrief Quality', shortDescription: 'Produces useful debriefs that convert race evidence into next actions.'},
  {id: 'sail-strat-adaptation-speed', domain: 'strategy', title: 'Adaptation Speed', shortDescription: 'Updates strategy quickly when observed conditions diverge from plan.'},
];
