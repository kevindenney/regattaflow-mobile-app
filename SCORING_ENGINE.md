# Scoring Engine Implementation

## Overview

RegattaFlow includes a comprehensive scoring engine that implements the Racing Rules of Sailing (RRS) Appendix A scoring systems. The engine supports low-point, high-point, bonus point, and custom scoring configurations with full tie-breaking logic.

## Features

### Scoring Systems

| System | Description | Default |
|--------|-------------|---------|
| **Low Point** | RRS A4 - Position = Points (1st = 1 pt, 2nd = 2 pts, etc.) | ✅ |
| **High Point** | RRS A8 - Points decrease with position | |
| **Bonus Point** | RRS A8.2 - First place gets 0 points | |
| **Custom** | User-defined formula | |

### Discard Rules

Configurable discard rules allow dropping worst races after a threshold:

```typescript
discards: [
  { after_races: 0, discards: 0 },  // No discards before 5 races
  { after_races: 5, discards: 1 },  // 1 discard after 5 races
  { after_races: 10, discards: 2 }, // 2 discards after 10 races
]
```

### Score Codes (Penalties)

| Code | Description | Default Points |
|------|-------------|----------------|
| DNC | Did Not Come to starting area | Entries + 1 |
| DNS | Did Not Start | Entries + 1 |
| OCS | On Course Side at start | Entries + 1 |
| ZFP | 20% penalty under rule 30.2 | Entries + 1 |
| UFD | U flag disqualification | Entries + 1 |
| BFD | Black flag disqualification | Entries + 1 |
| SCP | Scoring penalty | DNF equivalent |
| DNF | Did Not Finish | Entries + 1 |
| RET | Retired | Entries + 1 |
| DSQ | Disqualified | Entries + 1 |
| DNE | Disqualified (not excludable) | Entries + 1 |
| RDG | Redress given | Assigned position |
| DPI | Discretionary penalty imposed | Varies |

### Tie-Breaking (RRS A8)

Ties are broken using these rules in order:

1. **Last Race Position** - Best position in the last race sailed
2. **Most Firsts** - Count of first place finishes
3. **Most Seconds** - Count of second place finishes
4. **Best in Last** - Best score excluding worst
5. **Head to Head** - Direct comparison in shared races

## Architecture

### Files

```
services/
├── scoring/
│   └── ScoringEngine.ts       # Core scoring calculations
├── ScoringService.ts          # High-level service wrapper
│
components/
├── scoring/
│   ├── QuickResultsEntry.tsx  # Fast finish recording
│   └── SeriesStandingsTable.tsx # Standings display
│
app/
├── club/
│   └── scoring/
│       ├── _layout.tsx        # Route layout
│       └── [regattaId].tsx    # Scoring dashboard
│
migrations/
└── 20251202_scoring_system_tables.sql
```

### Database Schema

#### `series_standings`
Stores calculated standings for each competitor:
- `rank` - Current position
- `total_points` - Sum of all race points
- `net_points` - Points after discards applied
- `race_scores` - JSONB array of race-by-race scores
- `tied` - Whether tied with another competitor
- `tie_breaker` - Rule used to break tie

#### `regatta_races`
Individual race tracking:
- `race_number` - Sequential race number
- `status` - scheduled/started/completed/abandoned
- `protest_deadline` - Calculated from finish time
- `weight` - For weighted scoring systems

#### `scoring_templates`
Reusable scoring configurations per club:
- `config` - Full ScoringConfiguration JSON
- `is_default` - Club's default template

#### `results_change_log`
Audit trail for all result changes:
- `change_type` - position/penalty/redress/etc
- `old_value` / `new_value` - Before and after
- `reason` - Explanation for change

## Usage

### Calculate Standings

```typescript
import { ScoringEngine } from '@/services/scoring/ScoringEngine';

const engine = new ScoringEngine(config);
const standings = await engine.calculateSeriesStandings(regattaId);
```

### Using the Service Layer

```typescript
import { scoringService } from '@/services/ScoringService';

// Get full scoring data
const scoring = await scoringService.getRegattaScoring(regattaId);

// Enter race results quickly
await scoringService.enterRaceResults(regattaId, raceNumber, [
  { entryId: 'abc', sailNumber: '123', position: 1 },
  { entryId: 'def', sailNumber: '456', position: 2 },
  { entryId: 'ghi', sailNumber: '789', scoreCode: 'DNS' },
]);

// Apply penalty
await scoringService.applyPenalty(
  regattaId, 
  raceNumber, 
  entryId, 
  'DSQ',
  'Protest upheld - rule 18 infringement'
);

// Grant redress
await scoringService.grantRedress(
  regattaId,
  raceNumber,
  entryId,
  3, // Position to assign
  'Redress granted - safety boat interference'
);

// Publish results
await scoringService.publishResults(regattaId, 'provisional');
await scoringService.publishResults(regattaId, 'final');
```

## Scoring Dashboard

Access at: `/club/scoring/[regattaId]`

### Tabs

1. **Standings** - View current standings with race-by-race breakdown
2. **Config** - Configure scoring system, discards, penalties
3. **Publish** - Manage results publication workflow

### Publication Workflow

```
Draft → Provisional → Final
```

- **Draft**: Results being entered, not publicly visible
- **Provisional**: Visible, can still be changed (during protest period)
- **Final**: Locked, no further changes without admin override

## Preset Configurations

| Preset | Description |
|--------|-------------|
| Standard Low Point | 1 discard after 5 races, 2 after 10 |
| No Discards | All races count |
| Generous Discards | 1 after 3, 2 after 6, 3 after 9 |
| Championship | No discards in qualifying, 1 in finals |

## Export Formats

- **CSV** - Basic standings export
- **Sailwave BLW** - Import/export with Sailwave software

## RLS Policies

- **Public**: Can view published results (`results_published = TRUE`)
- **Club Members**: Can view all standings for their club
- **Race Officers/Scorers**: Can modify results and standings
- **Admins**: Full access including template management

## Future Enhancements

- [ ] Live scoring updates via Supabase Realtime
- [ ] Photo finish integration
- [ ] Rating certificate verification
- [ ] Handicap calculator (PHRF, IRC, ORC)
- [ ] Multi-fleet pursuit race calculations
- [ ] Automatic Sailwave import/export
- [ ] US Sailing integration

