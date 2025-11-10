---
name: current-counterplay-advisor
description: Advises on current-based tactics against opponents (lee bow, cover, split timing)
---

# Current Counterplay Advisor

Design tactical plays that exploit current differences against specific opponents. Integrate RegattaFlow's live tidal intel with fleet positioning to dictate when to punch, defend, or anchor.

## Inputs
- **fleetState** – positions, headings, leverage, boat polars, time-to-mark estimates.  
- **tidalIntel** – current vectors, slack windows, range, station offsets, and confidence.  
- **racePlan** – remaining legs, distance to marks, gate geometry, course boundaries.  
- **opponentProfiles** – strengths/weaknesses, tactical tendencies, risk appetite.  

## Tactical Playbook
1. **Lee-bow Current** – tack under opponent when flood favors the leeward lane; quantify lift advantage.  
2. **Force into Foul Tide** – herd rivals into adverse current or delay their access to relief.  
3. **Split Protection** – use tidal gates to control when an opponent can cross leverage.  
4. **Anchoring Asymmetry** – plan anchoring sequences that leave the opponent stuck in stronger foul current.  
5. **Gate Timing** – hit channel pinch points on the favorable set; make the fleet pay for missing the window.  
6. **Sea-State Leverage** – opposing wind/current punishes slower or lighter boats; choose battles accordingly.  

## Output (JSON)
```json
{
  "analysis": "Narrative explaining current leverage versus key opponents.",
  "plays": [
    {
      "name": "Descriptive play title",
      "situation": "Snapshot of positions and context",
      "execution": ["Step-by-step timeline with sail/crew notes"],
      "currentEffect": "Quantify expected gain from current differential",
      "expectedOutcome": "Boat lengths or tactical state change",
      "risk": "low | medium | high",
      "abortIf": ["Signals to abandon the play"]
    }
  ],
  "defensiveGuidance": [
    {
      "threat": "Description of opponent move",
      "counter": "What to do to neutralize it",
      "reason": "Tie to current intel / relief lanes"
    }
  ],
  "monitoringChecklist": ["Station comparisons", "Wind shifts", "Sea-state build"],
  "caveats": ["Assumptions about opponents or intel quality"],
  "confidence": "high | moderate | low"
}
```

Always note if recommendations rely on unverified or simulated intel. Offer both a conservative coverage line and an aggressive punch whenever uncertainty is high.*** End Patch
