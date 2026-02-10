/**
 * Team Racing Comparison Data
 *
 * Compares fleet racing, match racing, and team racing across
 * eight dimensions. Designed to help sailors understand what
 * makes team racing unique by contrasting it with the other
 * two major racing formats.
 */

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export type RacingFormat = 'fleet' | 'match' | 'team';

export interface ComparisonDimension {
  id: string;
  dimension: string;
  icon: string;
  fleet: { summary: string; detail: string };
  match: { summary: string; detail: string };
  team: { summary: string; detail: string };
  teamHighlight: string;
}

// ---------------------------------------------------------------------------
// Comparison Dimensions
// ---------------------------------------------------------------------------

export const COMPARISON_DIMENSIONS: ComparisonDimension[] = [
  // 1. Goal
  {
    id: 'goal',
    dimension: 'Goal',
    icon: 'flag-outline',
    fleet: {
      summary: 'Finish as high as possible',
      detail:
        'Each sailor races independently to achieve the best individual finishing position. There are no teammates on the water; every other boat is a competitor. Success is measured solely by where you cross the finish line relative to the fleet.',
    },
    match: {
      summary: 'Beat the other boat',
      detail:
        'Two boats race head-to-head. The only goal is to cross the finish line ahead of your single opponent. Position relative to any other boat is irrelevant. Races are typically sailed in a first-to-win series format.',
    },
    team: {
      summary: 'Win as a team of three',
      detail:
        'Three boats per team race together against three opponents. The goal is not individual finishing order but the combined finishing positions of all three teammates. A team wins when their combined positions total 10 or less out of 21.',
    },
    teamHighlight:
      'In team racing, a boat in 1st place can still lose if their teammates finish poorly. Individual performance only matters in how it affects the team combination.',
  },

  // 2. Scoring
  {
    id: 'scoring',
    dimension: 'Scoring',
    icon: 'calculator-outline',
    fleet: {
      summary: 'Points per finishing place',
      detail:
        'Low-point scoring: 1st place gets 1 point, 2nd gets 2, and so on. Points accumulate across a series of races. The sailor with the lowest total after all races (with possible discards) wins the regatta.',
    },
    match: {
      summary: 'Win or lose each match',
      detail:
        'Each race is binary: the boat that finishes first wins the match. In a series, the first boat to reach a set number of wins (e.g., first to 3) advances. There are no points for how close the race was.',
    },
    team: {
      summary: 'Combined positions must total 10 or less',
      detail:
        'In a 3v3 race with 6 boats, the total of all positions is always 21. A team wins if their three boats\' combined finishing positions total 10 or less (giving the opponent 11 or more). For example, finishing 1-2-6 gives a total of 9, which is a win.',
    },
    teamHighlight:
      'The magic number is 10. Any three finishing positions that sum to 10 or less means a win. This creates 10 winning combinations and 10 losing ones out of the 20 possible position sets.',
  },

  // 3. Fleet Size
  {
    id: 'fleet-size',
    dimension: 'Fleet Size',
    icon: 'boat-outline',
    fleet: {
      summary: 'Large fleets (10-200+ boats)',
      detail:
        'Fleet racing involves many boats racing at once, from small club fleets of 10-20 boats to major championship events with over 200 entries. The large numbers create complex tactical situations with many boats to navigate around.',
    },
    match: {
      summary: '2 boats per race',
      detail:
        'Exactly two boats race against each other in each match. This creates an intense one-on-one duel where every move is focused on a single opponent. Events use round-robin or knockout formats to determine an overall winner.',
    },
    team: {
      summary: '6 boats per race (3 vs 3)',
      detail:
        'Each race has exactly 6 boats: 3 from one team and 3 from the other. The small fleet means every boat is significant and there is nowhere to hide. Events use round-robin formats where teams race against every other team.',
    },
    teamHighlight:
      'With only 6 boats, every single position change matters. There is no safety in numbers like fleet racing. Each boat must be aware of all five other boats at every moment.',
  },

  // 4. Rules
  {
    id: 'rules',
    dimension: 'Rules',
    icon: 'book-outline',
    fleet: {
      summary: 'Standard Racing Rules of Sailing',
      detail:
        'Fleet racing uses the Racing Rules of Sailing (RRS) as the base rulebook. Protests are filed after racing and heard by a protest committee. Standard penalties are two turns. The rules are designed for large fleets with boats approaching from many angles.',
    },
    match: {
      summary: 'RRS + Appendix C',
      detail:
        'Match racing uses Appendix C of the RRS, which modifies certain rules for the two-boat format. Key differences include simplified starting procedures, umpired calls instead of post-race protests, and specific penalties for the match racing context.',
    },
    team: {
      summary: 'RRS + Appendix D',
      detail:
        'Team racing uses Appendix D of the RRS, tailored for the 3v3 format. Penalties are reduced to one turn (one tack and one gybe). Umpires make calls on the water in real time. Scoring penalties can adjust finishing positions without requiring turns.',
    },
    teamHighlight:
      'Appendix D reduces penalties to one turn because team racing is faster-paced with boats in closer quarters. On-water umpiring ensures immediate decisions without disrupting the rapid flow of play.',
  },

  // 5. Umpiring
  {
    id: 'umpiring',
    dimension: 'Umpiring',
    icon: 'shield-checkmark-outline',
    fleet: {
      summary: 'Post-race protest committee',
      detail:
        'In fleet racing, disputes are resolved after the race through a formal protest hearing. Sailors file written protests, present evidence, and a committee of judges decides the outcome. This process can take hours and results in disqualification or exoneration.',
    },
    match: {
      summary: 'On-water umpires (match)',
      detail:
        'Match racing uses dedicated umpire boats that follow the two racers. Decisions are made immediately on the water using flag signals. Sailors hail for umpire decisions, and the umpires signal penalties or no penalties in real time.',
    },
    team: {
      summary: 'On-water umpires (team)',
      detail:
        'Team racing uses on-water umpires similar to match racing, but the umpires must track all 6 boats simultaneously. Multiple umpire boats are required. Decisions are instantaneous: red flag for a penalty, green and white for no penalty, black flag for disqualification.',
    },
    teamHighlight:
      'Team racing umpires must make split-second decisions with 6 boats maneuvering in close proximity. The speed and complexity of umpiring team racing is considered the most demanding in sailing.',
  },

  // 6. Tactics
  {
    id: 'tactics',
    dimension: 'Tactics',
    icon: 'bulb-outline',
    fleet: {
      summary: 'Individual strategy',
      detail:
        'Fleet racing tactics focus on boat speed, wind shifts, current, and positioning relative to the fleet. Key decisions include which side of the course to sail, when to tack, and how to navigate traffic. There is no coordination with other boats.',
    },
    match: {
      summary: 'One-on-one dueling',
      detail:
        'Match racing tactics revolve around controlling the opponent: dial-ups in the pre-start, tacking duels upwind, and gybing duels downwind. The goal is always to stay between your opponent and the next mark or to force them into a penalty.',
    },
    team: {
      summary: 'Coordinated 3-boat team plays',
      detail:
        'Team racing tactics include mark traps, pass-backs, screens, dial-ups, and dial-downs that require precise coordination between all three boats. A boat in first may deliberately slow down to help a teammate. Individual sacrifice for team gain is fundamental.',
    },
    teamHighlight:
      'Team racing is the only format where a boat may intentionally lose positions for the team. Mark traps, screening, and pass-back plays require all three boats to work as a coordinated unit, making it the most tactically complex format.',
  },

  // 7. Communication
  {
    id: 'communication',
    dimension: 'Communication',
    icon: 'chatbubbles-outline',
    fleet: {
      summary: 'Minimal or none',
      detail:
        'In fleet racing, boats race independently and there is typically no communication between competitors (unless sailing double-handed where crew and helm communicate). Sailors make individual decisions based on their own observations of wind, waves, and fleet position.',
    },
    match: {
      summary: 'Between helm and crew',
      detail:
        'Match racing communication is primarily between the helm and crew on each boat. In keelboat match racing, tactical decisions are discussed between the helm, tactician, and crew. There is no need to coordinate with other boats since it is a one-on-one contest.',
    },
    team: {
      summary: 'Constant 3-boat coordination',
      detail:
        'Team racing requires continuous communication between all three boats on a team. Boats call out positions, announce tactical plays, and coordinate maneuvers. Hails like "trap!", "screen!", or "I have them" are constant. Communication is as important as boat handling.',
    },
    teamHighlight:
      'Team racing is often called "the thinking sailor\'s game" because of the constant communication required. All three boats must share position information, call plays, and adjust in real time. Poor communication defeats even fast sailors.',
  },

  // 8. Duration
  {
    id: 'duration',
    dimension: 'Race Duration',
    icon: 'time-outline',
    fleet: {
      summary: 'Long series over days',
      detail:
        'Fleet racing regattas typically span multiple days with several races per day. Each race may last 45 minutes to over an hour. A series might include 6-12 races, with results accumulated over the full event. Championship events can last a week or more.',
    },
    match: {
      summary: 'First-to-X wins format',
      detail:
        'Match racing uses a knockout or round-robin format. Each flight (pair of boats) races until one reaches the required wins (typically first-to-2 or first-to-3). Individual races are relatively short (15-25 minutes) but a full event can span several days.',
    },
    team: {
      summary: 'Short races, round-robin format',
      detail:
        'Individual team races are very short, typically 8 to 15 minutes on a compact windward-leeward course. Events feature round-robin play where every team races every other team, often completing 20-30 races in a single day. The action is fast, intense, and continuous.',
    },
    teamHighlight:
      'The short race duration means there is no time to recover from mistakes. Every maneuver counts. A single penalty turn can lose the race. This intensity, combined with the high volume of races per day, makes team racing uniquely demanding.',
  },
];

// ---------------------------------------------------------------------------
// Overview Metadata
// ---------------------------------------------------------------------------

export const TEAM_RACING_COMPARISON = {
  title: 'Fleet vs Match vs Team Racing',
  description:
    'Compare the three major racing formats across eight key dimensions to understand what makes team racing a unique and demanding discipline.',
};
