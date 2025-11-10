---
name: finishing-line-tactics
description: Master finish line strategy using the four-laylines concept, favored end identification, tactical ducking decisions, and momentum techniques from RegattaFlow championship doctrine
---

# Finishing Line Tactics

Master the often-overlooked final leg of the race where positions are won or lost. Apply the RegattaFlow championship doctrine to identify the favored end, manage the four-laylines approach, and execute tactical finishes under pressure.

## Inputs
- **lineGeometry**  –  finish line bearing, committee boat position, pin/buoy coordinates, line length.
- **windData**  –  true wind direction at finish, comparison to course axis from last mark.
- **courseHistory**  –  wind direction changes since weather mark, long tack orientation.
- **competitorPositions**  –  boats ahead/behind, their current tacks, crossing angles.
- **boatCharacteristics**  –  momentum capacity (displacement/weight), tacking speed, acceleration.
- **tidalCurrent**  –  set and drift at finish line (may affect favored end).

If any field is missing or estimated, call it out explicitly in caveats.

## Doctrine (Championship Principles)

### Core Principle: The Downwind End is Favored
Just as the **upwind end** is favored at the start, the **downwind end** is favored at the finish. This principle accounts for more places won or lost than any other finishing tactic.

**Historical Example (Buddy Friedrichs, 1968 Olympics, Dragon Class):**
- On port tack laying the starboard end of a long finish line
- Met four Dragons on starboard tack sequentially
- Ducked all four sterns rather than tacking
- Competitors continued toward port (buoy) end
- **Result**: Went from 5th to 1st in ~200 yards, won gold medal

**Key Insight**: Be willing to take multiple sterns if it means reaching the heavily favored downwind end. The geometric advantage overwhelms the tactical disadvantage of ducking.

### The Four-Laylines Concept

Every upwind finish has **four critical laylines**:
1. **Port tack layline to starboard end** (committee boat)
2. **Starboard tack layline to starboard end**
3. **Port tack layline to port end** (buoy/pin)
4. **Starboard tack layline to port end**

**Fundamental Rule**: Never sail past the first layline you reach.

**Application**:
- **Starboard tack boat** � Tack on the port tack layline to the starboard end
- **Port tack boat** � Tack on the starboard tack layline to the port end

**Why**: Sailing past the first layline means sailing parallel to the finish line (extra distance) rather than across it (shortest distance).

### Determining the Favored End

Unlike the start, you rarely have time to take line bearings and compare to wind direction. Use these methods:

#### Method 1: The Harry Sindle Technique
When tacking around the **weather mark** (which often becomes the finish line 2 legs later):
1. While head-to-wind during your tack around the mark, observe the finish line
2. Note which end is **abaft abeam** (behind your beam)
3. That end will be the **downwind end at the finish** (barring major wind shifts)
4. Mental note: "Port end abaft abeam = port end favored at finish"

**Timing**: Performed at the start of the run, giving you 2 legs to formulate finish strategy.

#### Method 2: Long Tack Analysis
On the final weather leg:
- **If port tack is the long tack** (takes you closer to finish) � wind has backed � **starboard end is downwind**
- **If starboard tack is the long tack** � wind has veered � **port end is downwind**

**Logic**: The long tack points more directly upwind. If port is long, you're heading "higher" on port, meaning wind has backed (counterclockwise), making starboard end downwind.

#### Method 3: Visual Comparison
Approaching the finish line:
- Compare visual distance to **pin/buoy** vs **committee boat**
- The closer-appearing end is usually favored
- **Caveat**: Distances are deceiving when comparing disparate objects (small buoy vs large yacht)
- **Cross-check**: Which layline will you reach first? That indicates favored end direction.

#### Method 4: Race Committee Bias
Modern race committees typically:
- Split the difference between "square to wind" and "square to course line"
- If wind has **veered** (clockwise from course axis) � **port end favored**
- If wind has **backed** (counterclockwise) � **starboard end favored**

**Rule**: If the wind has shifted right relative to the course, favor port end; if left, favor starboard end.

## Analysis Checklist
1. Identify finish line geometry (bearing, ends, length).
2. Determine favored end using 2+ methods (long tack + visual + Sindle technique).
3. Calculate four laylines based on current wind and your closehauled angles.
4. Assess competitor positions: Who's between you and favored end? On what tacks?
5. Evaluate risk/reward: Is ducking sterns worth reaching favored end?
6. Plan tacking strategy: When/where to tack to cross the line optimally.
7. Consider momentum techniques (head reaching) if finish is close.

## Output (JSON)
```json
{
  "favoredEnd": {
    "end": "port | starboard | neutral",
    "advantage": "boat lengths or time gained by using favored end",
    "confidence": "high | medium | low",
    "methods": ["List of determination methods used: long_tack | sindle | visual | wind_analysis"]
  },
  "fourLaylines": {
    "portToPort": "bearing degrees true",
    "starboardToPort": "bearing degrees true",
    "portToStarboard": "bearing degrees true",
    "starboardToStarboard": "bearing degrees true",
    "firstLaylineReached": "Which layline you'll hit first on current course"
  },
  "approachStrategy": {
    "currentTack": "port | starboard",
    "recommendedTack": "stay | tack_now | tack_at_layline",
    "laylineTiming": "Distance or time to layline",
    "reasoning": "Explanation linking favored end, competitors, and geometry"
  },
  "tacticalDecisions": [
    {
      "scenario": "e.g., 'Duck 2 starboard tackers to reach port end'",
      "action": "duck | tack | lee_bow | cover",
      "expectedGain": "positions or boat lengths",
      "risk": "low | medium | high",
      "triggers": ["Conditions that make this the right move"]
    }
  ],
  "competitorManagement": {
    "boatsAhead": "count and positions",
    "keyThreat": "Boat name/number and their current advantage",
    "coveringPlan": "If leading: how to pin them away from favored end",
    "breakawayPlan": "If trailing: how to split for favored end"
  },
  "momentumTechniques": {
    "headReaching": {
      "applicable": true,
      "triggerDistance": "1 boat length from line",
      "conditions": "Light air, displacement boat, flat water",
      "expectedGain": "0.5-1 boat lengths",
      "risk": "Shoot too early = stall before line; too late = no benefit"
    }
  },
  "callouts": [
    {
      "distance": "5 minutes | 2 minutes | layline | 5 lengths | 1 length",
      "crew": "Identify favored end | Confirm layline | Prepare for tack | Ready to shoot"
    }
  ],
  "caveats": ["Data limitations, competitor uncertainties, wind shift risks"],
  "confidence": "high | moderate | low"
}
```

## Tactical Scenarios

### Scenario 1: Multiple Starboard Tackers Between You and Favored End
**Situation**: You're on port tack, favored (downwind) end requires crossing 3-4 starboard tackers.

**Decision Framework**:
```
IF favored end advantage > (2 � number of boats to duck) boat lengths:
  � Duck all sterns, reach favored end
ELSE IF advantage marginal:
  � Tack on first or second boat, accept sub-optimal position
ELSE:
  � Continue to unfavored end (fewer losses)
```

**Buddy Friedrichs Example**: 4 ducks for heavily favored end = worth it (5th � 1st).

**Quantifiable Trigger**: If favored end saves 8+ boat lengths and you must duck 3 boats, each costing ~1-1.5 lengths � net gain of 3.5-5 lengths. **Do it.**

### Scenario 2: Close Finish with Competitor
**Situation**: Boat-for-boat finish, both approaching on starboard, line is neutral or slight bias.

**Technique**: Head Reaching (Shooting the Line)
1. Approach at full close-hauled speed
2. At **1 boat length** from line, shoot dead into wind
3. Boat slows but sails much shorter distance (straight to line vs angled)
4. Timing critical:
   - **Too early**: Lose all momentum before crossing � massive loss
   - **Too late**: No benefit, sailed extra distance
   - **Just right**: Win by 1-2 feet

**Conditions**:
- **Boat type**: Large displacement keelboats (high momentum)
- **Wind**: Light to moderate (heavy wind/seas stop boat too quickly)
- **Geometry**: Approaching at closehauled angle (not reaching)

**Common Error**: Shooting too early. Instinct says "I'm at the line" when you're still 1.5 lengths away. **Sail farther than instinct suggests** before shooting.

### Scenario 3: Leading and Defending
**Situation**: You're ahead of key competitor, approaching finish on opposite tacks.

**Classic Example (Sleuth vs Whirlwind)**:
- Whirlwind on port, Sleuth on starboard
- Buoy end heavily favored
- **Wrong move**: Tack ahead and to windward too early � Whirlwind pinches up, forces Sleuth to tack too close, Whirlwind wins
- **Right move**: Tack **just as Whirlwind's mast comes abeam** � Whirlwind has no luffing rights, pinned to leeward, Sleuth controls finish

**Principle**: Tack on covering boat at precise moment they lose luffing rights (mast abeam) but are still too close to duck. Pins them away from favored end.

**Execution Challenge**: Large, heavy boats (Sleuth = 54 footer) accelerate slowly post-tack. Tacking too early allows competitor to drive through your lee and luff. Tacking too late allows them to drive through and shoot across.

**Decision Trigger**: Tack when competitor's **mast is within 0.5-1 boat length of being abeam**. Requires precise timing and boat handling.

## Risk Assessment

### High Risk Moves (90% commitment)
- Ducking 4+ sterns to reach heavily favored end (Friedrichs scenario)
- Head reaching in moderate-heavy air or choppy seas
- Tacking at the last second to pin competitor (Sleuth vs Whirlwind)

**When justified**: Must-win situation, large favored end bias (10+ boat lengths), championship race.

### Moderate Risk (60% commitment)
- Ducking 2-3 sterns for moderately favored end (4-8 boat length advantage)
- Splitting from fleet to opposite end based on wind analysis
- Head reaching in light air with displacement boat

**When justified**: Significant advantage expected, confident in favored end determination, fleet race positioning.

### Low Risk (Conservative)
- Tacking on first layline reached (standard procedure)
- Continuing on favorable tack to obvious favored end
- Covering key competitor to same end you're approaching

**When justified**: Leading and protecting, uncertain favored end, neutral line bias.

## Integration with Strategy

**Connect to Upwind Strategy**:
- If you identified long tack on final beat, you've already determined favored finish end
- Plan finish approach while sailing weather leg, not in final 30 seconds

**Link to Mark Rounding**:
- Exit leeward mark on tack that sets up optimal finish line approach
- Don't round leeward mark perfectly only to be on wrong tack for finish

**Coordinate with Current/Tide**:
- Use `tidal-opportunism-analyst` to assess current effect on line bias
- Cross-line current may shift "effective" favored end

## Common Mistakes and Recovery

### Mistake 1: Sailing Parallel to Line
**Symptom**: Sailing way past first layline, staying on same tack too long.
**Cost**: Extra distance = lost positions.
**Recovery**: Tack immediately on first layline reached. "Cross the line, don't sail along it."

### Mistake 2: Ignoring Favored End
**Symptom**: Finishing at nearest end, not downwind end.
**Cost**: 1-5 positions depending on bias.
**Recovery**: Pre-race: Set mental reminder to check favored end 5 min before finish. Post-race: Review and learn.

### Mistake 3: Refusing to Duck Sterns
**Symptom**: Tacking to avoid ducking when favored end is heavily biased.
**Cost**: Finish at wrong end, lose 3-10 positions.
**Recovery**: Reframe mindset: "Ducking is tactical surrender" � "Ducking is strategic positioning." Calculate net gain.

### Mistake 4: Premature Head Reaching
**Symptom**: Shooting the line 2-3 lengths out, boat stalls.
**Cost**: Lose 2-10 boat lengths, multiple positions.
**Recovery**: Practice distance estimation. Use landmarks, stern staff, or GPS if allowed. Default to sailing farther than instinct suggests.

## Expected Outcomes
- **Immediate**: Consistent favored end identification (70%+ accuracy)
- **Short-term**: Net gain of 0.5-1 positions per finish on average
- **Long-term**: Strategic finish planning integrated into weather leg tactics
- **Advanced**: Willingness to take calculated high-risk moves (ducking multiple boats) when justified

## Source Attribution
Curated from the RegattaFlow Championship Playbook's *The Yachtsman's Guide to Racing Tactics*, Chapter 13: Finishing. Includes the Buddy Friedrichs 1968 Olympics example, Harry Sindle's weather mark technique, and the Sleuth vs Whirlwind tactical finish scenario. Enhanced with quantifiable decision frameworks and risk assessment protocols.
