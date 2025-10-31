/**
 * Tactical Playbook Database
 *
 * Comprehensive championship racing tactics organized by phase.
 * De-branded tactical knowledge that feels native to RegattaFlow.
 */

import type { TacticalTactic } from '@/components/races/TacticalPlaybook';

export const TACTICAL_PLAYBOOK_DATA: TacticalTactic[] = [
  // ==================== STARTING TACTICS ====================
  {
    id: 'three-minute-pattern',
    name: 'Three-Minute Starting Pattern',
    category: 'start',
    difficulty: 'intermediate',
    theory:
      'The three-minute pattern provides optimal timing control for larger boats. Be near the line at 3 minutes, sail away for half that time, then make final approach with 1+ minute remaining. This gives room to luff if early while maintaining speed.',
    execution:
      'Set TWO stopwatches at visual signal (not gun sound). At 3 minutes: position near line. At 1:30: turn and sail away. At 1:00+: begin final approach with proper spacing. Monitor speed and adjust position. If over early: luff hard, head straight across at right angles for fast rerounding (35s better than killing speed).',
    championExample:
      'Championship sailors demonstrate this at Antigua racing: When over early, plowed ahead determined to reround fast. 35-second reround not much worse than poorly timed start. Competitors who didn\'t return were disqualified.',
    whenToUse: [
      'Larger displacement keelboats',
      'Series races where conservative start is valuable',
      'Crowded starting lines',
      'When you need precise timing control',
    ],
    commonMistakes: [
      'Relying only on sound of gun (visual signal is earlier)',
      'Not having backup timing system',
      'Killing speed when over early instead of rerounding',
      'Misjudging turn-around time in final approach',
    ],
    relatedTactics: ['Shore Range Positioning', 'Fast Rerounding Technique', 'Line Bias Calculation'],
  },

  {
    id: 'shore-range-positioning',
    name: 'Shore Range Positioning',
    category: 'start',
    difficulty: 'beginner',
    theory:
      'Use shore ranges to hold exact position on the starting line. Line up starting flag with fixed objects on shore (buoy, bridge span, building). This creates a visual reference that shows drift instantly.',
    execution:
      'Before start: Identify two fixed shore objects that line up with pin end of line. Throughout pre-start: Check range frequently. If objects separate, you\'ve drifted. Adjust position to re-align range. In final minute: Use range plus compass heading to hold exact position.',
    championExample:
      'Championship frostbite racers demonstrate holding dinghies within 3 feet of committee boat in 12-15 knots using shore ranges combined with traveler control and weight movement while competitors drift off.',
    whenToUse: [
      'All starting situations with visible shore',
      'Windy conditions where holding position is difficult',
      'When practicing boat handling',
      'Pin-end starts where position is critical',
    ],
    commonMistakes: [
      'Not setting up range early enough',
      'Choosing moving objects (boats, clouds)',
      'Ignoring compass heading (range only shows lateral drift)',
      'Not practicing range technique before race start',
    ],
    relatedTactics: ['Three-Minute Starting Pattern', 'Boat Control Mastery'],
  },

  {
    id: 'line-bias-calculation',
    name: 'Line Bias Calculation',
    category: 'start',
    difficulty: 'intermediate',
    theory:
      'Calculate starting line bias using geometry: 7° pin bias = 12ft advantage per 100ft of line. Even small bias (3-5°) creates significant advantage. Pin bias favors left side of course, boat bias favors right side.',
    execution:
      'Point boat head-to-wind on starting line. Read compass heading. Subtract 90° to get perpendicular to wind. Compare to actual line angle. Difference = bias in degrees. 7° or more = significant bias. Choose favored end unless tactical reasons override.',
    whenToUse: [
      'Every race start (always check bias)',
      'When deciding pin vs boat end strategy',
      'Calculating risk/reward of different starting positions',
      'Evaluating whether to tack after start',
    ],
    commonMistakes: [
      'Ignoring small bias (even 3° matters)',
      'Not accounting for current pushing line',
      'Forgetting that bias changes if wind shifts',
      'Choosing favored end even when too crowded',
    ],
    relatedTactics: ['Three-Minute Starting Pattern', 'Port Tack Start Timing'],
  },

  // ==================== UPWIND TACTICS ====================
  {
    id: 'puff-response-traveler',
    name: 'Puff Response (Traveler Control)',
    category: 'upwind',
    difficulty: 'intermediate',
    theory:
      'Respond to puffs with TRIM, not HELM. When puff hits: traveler down → boat accelerates → traveler up. This maintains pointing while controlling heel. Feathering (helm response) slows the boat significantly.',
    execution:
      'Feel puff approaching. Traveler DOWN just before excessive heel develops. Hold briefly during acceleration. Traveler UP as puff passes. Practice timing: down BEFORE heel, up AS boat speeds up. Maintain straight helm throughout. For hot boats (J70, Melges): mainsheet works better than traveler.',
    championExample:
      'Championship frostbite racers demonstrate boat control mastery by keeping dinghies within 3 feet of committee boats in 12-15 knots using traveler control, weight movement, and centerboard adjustments while competitors drift off.',
    whenToUse: [
      'Moderate displacement keelboats in 10-18 knots',
      'When maximizing VMG upwind',
      'Oscillating puff patterns',
      'Maintaining consistent pointing angle',
    ],
    commonMistakes: [
      'Reacting too late (after excessive heel)',
      'Using helm instead of trim (feathering)',
      'Not bringing traveler back up quickly enough',
      'Using mainsheet on displacement boats (less effective)',
    ],
    relatedTactics: ['Boat Control Mastery', 'Shift Detection', 'Compass Discipline'],
  },

  {
    id: 'delayed-tack',
    name: 'Delayed Tack',
    category: 'upwind',
    difficulty: 'advanced',
    theory:
      'After crossing opponent by 1 boat length: sail SHORT distance (<1 length) → THEN tack to lee-bow position. This creates geometric advantage and forces opponent into no-win choice at layline. Can turn 1-length lead into 3-4 lengths at windward mark.',
    execution:
      'Cross opponent cleanly. Resist urge to tack immediately. Sail exactly <1 boat length. Tack smoothly to lee-bow. Timing is critical: Too soon = they get safe leeward. Too late = advantage lost. Watch opponent\'s bow - tack when just past it. Practice distance judgment.',
    championExample:
      'This signature tactical move is widely recognized in championship racing for turning small advantages into commanding leads through geometric leverage and tactical positioning.',
    whenToUse: [
      'After crossing opponent by 1-2 boat lengths',
      'When you want to consolidate lead',
      'Approaching windward mark layline',
      'When opponent has no escape routes',
    ],
    commonMistakes: [
      'Tacking too far past opponent (loses geometric advantage)',
      'Tacking too soon (opponent gets safe leeward)',
      'Not considering third boats in vicinity',
      'Executing on layline where opponent can overstay',
    ],
    relatedTactics: ['Tight Cover Timing', 'Loose Cover Herding', 'Shift Detection'],
  },

  {
    id: 'shift-watching',
    name: 'Shift Watching (Hull Angle Method)',
    category: 'upwind',
    difficulty: 'advanced',
    theory:
      '10° wind shift = 25% leverage. Wind shifts hit windward boat first. When covering boat appears LIFTED (hull angle changes), tack immediately. When they tack to cover, they\'re in HEADER. Shift takes moments to travel down - you have heading advantage until new wind reaches you.',
    execution:
      'Watch covering boat\'s hull angle constantly. When they appear lifted (boat looks higher/more bow up): tack immediately. Don\'t wait to feel shift yourself. Tack while they\'re still lifted. When they tack to cover, you\'re sailing in header they just left. Repeat procedure - eventually break cover.',
    championExample:
      'Dick Stearns vs Tom Blackaller at Bacardi Cup Star Series: Despite Tom having good boat speed, Dick watched Tom\'s Star hull angle. When Tom lifted, Dick tacked. Tom tacked to cover but was in header. Shifty offshore 15 mph breeze - Dick had heading advantage until shift reached him. Repeated over and over, ate up Tom\'s lead.',
    whenToUse: [
      'Being covered by opponent',
      'Oscillating wind conditions (8-15° shifts)',
      'Shifty breeze with regular patterns',
      'When you need to break cover urgently',
    ],
    commonMistakes: [
      'Waiting to feel shift yourself (too late)',
      'Not tacking decisively when covering boat lifts',
      'Giving up after one or two attempts',
      'Not combining with compass discipline',
    ],
    relatedTactics: ['Three Tacks Rule', 'Compass Discipline', 'Delayed Tack'],
  },

  {
    id: 'compass-discipline',
    name: 'Compass Discipline',
    category: 'upwind',
    difficulty: 'beginner',
    theory:
      'Call out upwind heading on EVERY tack. This builds shift pattern recognition and tactical awareness. "Championship sailors ALWAYS know their numbers." Tracking numbers consistently reveals shift patterns naturally over time.',
    execution:
      'Install compass visible from helm. On every tack: call heading out loud. Write on deck if possible (grease pencil on non-skid). Build habit: tack → check compass → call number. After several tacks: compare numbers to identify shifts. 5° difference = shift. 10° difference = major shift.',
    championExample:
      'Every champion sailor from Olympic medalists to America\'s Cup crews started with compass discipline. No shortcuts - this is the foundation of tactical racing. Modern racing demands numerical precision.',
    whenToUse: [
      'Every race, every time sailing upwind',
      'Building shift awareness (beginner sailors)',
      'Unfamiliar venues with unknown shift patterns',
      'Teaching crew to call numbers consistently',
    ],
    commonMistakes: [
      'Not calling numbers on every tack',
      'Checking compass only when convenient',
      'Not recording or remembering previous headings',
      'Ignoring small shifts (5° matters)',
    ],
    relatedTactics: ['Shift Watching', 'Shift Mathematics', 'Puff Response'],
  },

  // ==================== COVERING TACTICS ====================
  {
    id: 'tight-cover',
    name: 'Tight Cover Timing',
    category: 'covering',
    difficulty: 'expert',
    theory:
      'After crossing opponent, tack at RIGHT location/moment so you\'re dead on their wind by the time momentum is regained. Timing errors: Too late = they get safe leeward. Too early = they get safe leeward when they tack. Master boat control to execute perfectly.',
    execution:
      'Cross opponent. Immediately assess: turning radius, momentum loss, acceleration rate. Tack when geometry places you perfectly upwind after momentum pickup. Practice makes perfect - know your boat\'s characteristics. "Best starting skippers have complete control" of boat handling.',
    championExample:
      'Championship covering principle: "Many races lost by NOT covering when chance exists. After crossing on starboard near finish, tack IMMEDIATELY to cover - splitting tacks very risky with wind shifts."',
    whenToUse: [
      'Leading near finish',
      'Opponent sailing away from fleet direction',
      'When you want to control opponent completely',
      'Protecting small lead in shifty conditions',
    ],
    commonMistakes: [
      'Tacking too late (opponent escapes to leeward)',
      'Tacking too early (lose positioning during momentum recovery)',
      'Not knowing your boat\'s turn radius and acceleration',
      'Tight covering when loose cover is more appropriate',
    ],
    relatedTactics: ['Delayed Tack', 'Loose Cover Herding', 'Three Tacks Rule'],
  },

  {
    id: 'loose-cover-herding',
    name: 'Loose Cover Herding',
    category: 'covering',
    difficulty: 'advanced',
    theory:
      'When going same direction as fleet, stay between opponent and finish but give clear air. "Herd them where you want to go." This prevents them from tacking away while maintaining fleet positioning. Less risky than tight cover in shifty conditions.',
    execution:
      'Position yourself 3-5 boat lengths ahead and upwind of opponent. Give them clean air so they don\'t tack away. Monitor fleet direction - if they\'re going wrong way, switch to tight cover. Maintain loose cover until approaching finish or layline.',
    whenToUse: [
      'Leading in oscillating conditions',
      'Same direction as rest of fleet',
      'When tight cover would push you away from fleet',
      'Protecting lead without excessive risk',
    ],
    commonMistakes: [
      'Giving too much room (not actually covering)',
      'Not switching to tight cover when opponent goes wrong way',
      'Losing track of fleet while covering',
      'Covering too tightly and forcing opponent to tack',
    ],
    relatedTactics: ['Tight Cover Timing', 'Fleet Positioning', 'Delayed Tack'],
  },

  {
    id: 'three-tacks-rule',
    name: 'Three Tacks Rule (Breaking Cover)',
    category: 'covering',
    difficulty: 'advanced',
    theory:
      '"Never give up after 2 tacks. Usually break away after THIRD tack." Covered boat has choice of WHEN to tack, covering boat only reacts. By watching wave patterns, covered boat can choose smooth patch to accelerate rapidly. Covering boat tacks on reaction, often in worse conditions. Magic number is THREE.',
    execution:
      'Being covered: Plan sequence of 3+ tacks. First tack: establish pattern. Second tack: opponent still following. Third tack: Choose good wave pattern, accelerate hard. Opponent decides tacking duel not worth distance to fleet. Persist with determination - show you won\'t give up easily.',
    championExample:
      'Championship racing principle: "Covered boat has choice of WHEN to tack, covering boat only reacts. By watching wave patterns, covered boat can choose smooth patch to accelerate rapidly while covering boat tacks on reaction in worse conditions."',
    whenToUse: [
      'Being covered by single opponent',
      'When initial tacking attempts haven\'t worked',
      'Showing determination and persistence',
      'Wavy or choppy conditions (pick smooth patches)',
    ],
    commonMistakes: [
      'Giving up after one or two tacks',
      'Not choosing wave patterns strategically',
      'Tacking predictably (opponent anticipates)',
      'Not combining with shift watching technique',
    ],
    relatedTactics: ['Shift Watching', 'Tight Cover Timing', 'Compass Discipline'],
  },

  // ==================== MARK ROUNDING TACTICS ====================
  {
    id: 'getting-in-phase',
    name: 'Getting In Phase (Windward Mark)',
    category: 'mark_rounding',
    difficulty: 'intermediate',
    theory:
      'Round windward mark on the LIFTED tack to set up entire downwind leg. If you round on headed tack, you start downwind out of phase and spend whole leg trying to recover. Check compass 5 boat lengths before mark.',
    execution:
      'Approaching windward mark (5 lengths away): Check compass. Compare to earlier upwind headings. If headed: consider tacking before mark to approach on lifted. If lifted: round as-is. After rounding: commit to corresponding jibe based on which tack you rounded on.',
    championExample:
      'Championship mark rounding strategy emphasizes early decision making (4-5 lengths away) rather than last-second reactions at the mark. This prevents being forced into bad tactical positions.',
    whenToUse: [
      'Every windward mark approach',
      'Oscillating wind conditions',
      'When tactical positioning matters downwind',
      'Series racing where consistency is key',
    ],
    commonMistakes: [
      'Not checking compass approaching mark',
      'Rounding on headed tack because convenient',
      'Making decision at mark instead of 5 lengths away',
      'Not committing to jibe after rounding',
    ],
    relatedTactics: ['Compass Discipline', 'Delayed Spinnaker Set', 'Downwind Shift Detection'],
  },

  {
    id: 'delayed-spinnaker',
    name: 'Delayed Spinnaker Set',
    category: 'mark_rounding',
    difficulty: 'expert',
    theory:
      'Round weather mark close behind another boat. Instead of immediately falling to course and setting spinnaker, sail across wind on close reach with main/jib trimmed properly. Boat ahead falls to course - speed slowed by crew bouncing around and windage of spinnaker. Get on their wind, making their spinnaker difficult to fly. Once in controlling position, set your chute.',
    execution:
      'Round mark close behind leader. Maintain close reach on main/jib (don\'t fall to course yet). Trim perfectly while their crew is chaotic. Sail into their wind shadow. Once you\'ve blanketed them: set spinnaker smoothly. Both boats slowed but relative positions maintained.',
    championExample:
      'Kevin Cox (American Eagle 1968 America\'s Cup) used this tactic widely. Defense: Lead boat sails close reach to discourage this maneuver. Widely adopted in fleet racing when rounding close behind.',
    whenToUse: [
      'Rounding close behind another boat (<2 lengths)',
      'Reaching spinnaker leg',
      'When you have boat speed advantage',
      'Fleet congestion at mark',
    ],
    commonMistakes: [
      'Setting spinnaker immediately (losing speed advantage)',
      'Not trimming main/jib properly on reach',
      'Trying from too far behind (>3 lengths)',
      'Not having crew ready for quick set after gaining position',
    ],
    relatedTactics: ['Getting In Phase', 'Smooth Mark Rounding', 'Hans Fogh Reverse'],
  },

  {
    id: 'smooth-mark-rounding',
    name: 'Smooth Mark Rounding Mechanics',
    category: 'mark_rounding',
    difficulty: 'intermediate',
    theory:
      'Minimize rudder angle (wide smooth arc), keep boat speed up through turn, set spinnaker when stable (not mid-turn). Speed differential created by smooth crew work creates tactical opportunities.',
    execution:
      'Approaching mark: Set up wide arc (3-4 boat lengths). Begin turn early. Minimize rudder input (wide arc = less rudder). Crew: prepare spinnaker but don\'t start hoisting until bow passes mark and boat is stable. Maintain speed through turn. Hoist only when stable on new course.',
    whenToUse: [
      'Every mark rounding',
      'When maintaining boat speed is critical',
      'Teaching crew proper mark rounding technique',
      'Congested mark roundings (speed = maneuvering room)',
    ],
    commonMistakes: [
      'Turning too sharply (excessive rudder = drag)',
      'Hoisting spinnaker mid-turn (destabilizes boat)',
      'Crew moving around before boat settled',
      'Not preparing spinnaker early enough',
    ],
    relatedTactics: ['Delayed Spinnaker Set', 'Getting In Phase', 'Pre-Mark Decision Making'],
  },

  {
    id: 'hans-fogh-reverse',
    name: 'Hans Fogh Reverse Psychology',
    category: 'mark_rounding',
    difficulty: 'advanced',
    theory:
      'After mark rounding, confidently sail chosen direction even if fleet goes opposite way. Confidence convinces others you know something they don\'t. Often fleet follows, giving you tactical control. "Confidence in execution creates tactical opportunities."',
    execution:
      'Round mark on lifted tack (per Getting In Phase). Commit to corresponding jibe with confidence. Sail decisively even if uncomfortable or against fleet. Project confidence through boat handling and trim. Others often follow thinking you have local knowledge or see something they don\'t.',
    championExample:
      'Hans Fogh (Olympic Gold, Star World Champion): After mark rounding, confidently sailed chosen direction even when fleet went opposite way. Confidence convinced others he knew something they didn\'t. Fleet often followed, giving him tactical control.',
    whenToUse: [
      'When you\'ve done proper pre-mark analysis',
      'Confident in your tactical decision',
      'Fleet is uncertain about correct course',
      'You have local knowledge or better information',
    ],
    commonMistakes: [
      'Second-guessing and joining fleet',
      'Not projecting confidence through boat handling',
      'Using tactic when you don\'t have solid reasoning',
      'Ignoring obvious course changes (wind shifts)',
    ],
    relatedTactics: ['Getting In Phase', 'Loose Cover Herding', 'Fleet Positioning'],
  },

  // ==================== DOWNWIND TACTICS ====================
  {
    id: 'downwind-shift-detection',
    name: 'Downwind Shift Detection (Apparent Wind)',
    category: 'downwind',
    difficulty: 'advanced',
    theory:
      '"Apparent wind goes AFT WITHOUT feeling stronger = TRUE LIFT → JIBE IMMEDIATELY." Downwind sees 1-2 shifts per 15 minutes (upwind sees 3-4). Each shift is CRITICAL. Velocity change would feel STRONGER, but pure lift goes aft without strength change.',
    execution:
      'Feel apparent wind on face/ears constantly. When wind goes aft but doesn\'t feel stronger: JIBE immediately. Practice distinguishing: Puff = stronger + maybe aft. Lift = aft but NOT stronger. Combine with telltale watching for confirmation. Make this feel automatic.',
    championExample:
      'Championship racing emphasizes: "Downwind shift detection paired with fast jibing separates good sailors from champions. Detect + Execute = Winning combination."',
    whenToUse: [
      'All downwind sailing',
      'Oscillating conditions',
      'When maximizing VMG downwind',
      'Championship-level racing',
    ],
    commonMistakes: [
      'Confusing puff with lift',
      'Not jibing immediately when detecting shift',
      'Relying only on compass (slower than feel)',
      'Not practicing this specific awareness skill',
    ],
    relatedTactics: ['Rhythmic Jibing', 'Getting In Phase', 'Compass Discipline'],
  },

  {
    id: 'rhythmic-jibing',
    name: 'Rhythmic Jibing with Speed',
    category: 'downwind',
    difficulty: 'intermediate',
    theory:
      'Once shift detected, execute smooth jibe maintaining speed. Keep telltales flowing through jibe, minimize rudder angle, crew weight movement synchronized. "Fast jibing = competitive downwind." Practice makes jibes automatic so focus stays on shift detection.',
    execution:
      'Preparation: Crew ready, spinnaker trimmed. Execution: Minimal rudder input, crew moves smoothly, maintain speed throughout. Trim immediately on new jibe. Goal: <5% speed loss through jibe. Practice until automatic - then shift detection becomes primary focus.',
    whenToUse: [
      'All downwind shift jibing',
      'When shift detection demands focus',
      'Teaching crew smooth jibe technique',
      'Maintaining VMG in shifty conditions',
    ],
    commonMistakes: [
      'Excessive rudder angle (kills speed)',
      'Crew moving too early or too late',
      'Not trimming immediately after jibe',
      'Accepting slow jibes as "good enough"',
    ],
    relatedTactics: ['Downwind Shift Detection', 'Smooth Mark Rounding', 'Telltale Awareness'],
  },

  {
    id: 'visual-shift-detection',
    name: 'Visual Shift Detection (Upwind Boats)',
    category: 'downwind',
    difficulty: 'beginner',
    theory:
      'Watch upwind boats to detect shifts. They can see shifts with compass. Combine with anticipatory positioning - when upwind boats lift, prepare for jibe BEFORE shift reaches you. This combines observation with proactive execution.',
    execution:
      'Assign crew to watch upwind boats. When they lift: immediately prepare for jibe (set crew, trim spinnaker, get ready). When shift arrives: execute immediately. This gives 10-30 seconds preparation time vs reactive jibing.',
    whenToUse: [
      'Learning downwind shift detection',
      'Backup for apparent wind detection',
      'Teaching less experienced crew',
      'Conditions where upwind fleet clearly visible',
    ],
    commonMistakes: [
      'Only watching, not preparing crew',
      'Not combining with apparent wind feel',
      'Waiting too long after seeing upwind boats shift',
      'Losing focus on primary (apparent wind) detection',
    ],
    relatedTactics: ['Downwind Shift Detection', 'Rhythmic Jibing', 'Compass Discipline'],
  },

  // ==================== GENERAL TACTICS ====================
  {
    id: 'boat-control-mastery',
    name: 'Boat Control Mastery',
    category: 'general',
    difficulty: 'intermediate',
    theory:
      'Boat control mastery is foundation of racing. Championship sailors can hold position within 3 feet for minutes using traveler, weight, and centerboard. Complete control means knowing turning radius, stopping ability, acceleration rate.',
    execution:
      'Practice holding exact position: Line up with fixed object. Hold position for 2+ minutes using only traveler and weight. Feel boat response to every control input. Master stopping: from full speed to dead stop in <2 lengths. Know acceleration: from stopped to full speed timing.',
    championExample:
      'Championship frostbite racers demonstrate this by keeping dinghies within 3 feet of committee boats in 12-15 knots using traveler control, weight movement, and centerboard adjustments while competitors drift off.',
    whenToUse: [
      'Pre-start positioning',
      'Mark approach timing',
      'Learning boat limits and capabilities',
      'Building fundamental racing skills',
    ],
    commonMistakes: [
      'Not practicing boat control specifically',
      'Accepting sloppy boat handling',
      'Not learning boat\'s exact characteristics',
      'Skipping fundamentals to practice "advanced" tactics',
    ],
    relatedTactics: ['Shore Range Positioning', 'Three-Minute Starting Pattern', 'Puff Response'],
  },

  {
    id: 'shift-mathematics',
    name: 'Wind Shift Mathematics',
    category: 'general',
    difficulty: 'intermediate',
    theory:
      '10° shift = 25% of boat separation leverage. If two boats split for 2 minutes at 6 knots, 10° shift creates 9-boat-length advantage. Even 5° shift has massive impact. Understanding quantified leverage helps decision-making.',
    execution:
      'Use compass discipline to track shifts. When seeing shift magnitude: calculate approximate leverage. 5° = ~12% leverage. 10° = 25% leverage. 15° = 40% leverage. This quantified understanding improves tactical decisions about when to split vs cover.',
    whenToUse: [
      'Evaluating whether to split from fleet',
      'Deciding when to cover vs extend',
      'Understanding why shifts matter so much',
      'Teaching crew shift importance',
    ],
    commonMistakes: [
      'Ignoring small shifts (5° matters)',
      'Not calculating leverage before decisions',
      'Underestimating compound effect over time',
      'Splitting fleet without solid shift prediction',
    ],
    relatedTactics: ['Compass Discipline', 'Shift Watching', 'Fleet Positioning'],
  },

  {
    id: 'fleet-positioning',
    name: 'Fleet Positioning Awareness',
    category: 'general',
    difficulty: 'intermediate',
    theory:
      'Always know where you are relative to fleet. Leading: stay between fleet and finish. Mid-pack: find clear air and opportunity. Trailing: take calculated risks and different routes. Fleet position determines tactical choices.',
    execution:
      'Every 2-3 minutes: look around and assess fleet position. Leading by a lot: cover and protect. Leading by little: loose cover. Mid-pack: find clear air lane. Trailing: split for different conditions or shifts. Adjust tactics based on position.',
    whenToUse: [
      'Every race throughout the race',
      'Deciding when to split vs cover',
      'Risk management decisions',
      'Series racing position management',
    ],
    commonMistakes: [
      'Not looking around regularly',
      'Racing as if leading when mid-pack',
      'Not taking risks when trailing',
      'Covering too tightly when leading big',
    ],
    relatedTactics: ['Loose Cover Herding', 'Tight Cover Timing', 'Hans Fogh Reverse'],
  },
];
