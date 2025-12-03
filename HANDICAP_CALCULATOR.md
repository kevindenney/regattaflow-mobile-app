# Handicap Calculator Implementation

## Overview

The Handicap Calculator provides corrected time scoring for mixed fleet racing using PHRF, IRC, ORC, and custom rating systems. It converts elapsed times to corrected times based on boat ratings.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     HANDICAP CALCULATOR                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │    Rating     │ ── │   Calculate  │ ── │    Results &    │  │
│  │   Database    │    │   Corrected  │    │   Standings     │  │
│  └───────────────┘    └──────────────┘    └─────────────────┘  │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  HandicapService                           │  │
│  │  • Manage rating systems                                   │  │
│  │  • Store/retrieve boat ratings                             │  │
│  │  • Calculate corrected times                               │  │
│  │  • Generate standings                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Database Layer                          │  │
│  │                                                            │  │
│  │  handicap_systems        boat_ratings                      │  │
│  │  ├── code                ├── sail_number                   │  │
│  │  ├── calculation_type    ├── system_id                     │  │
│  │  ├── base_rating         ├── rating                        │  │
│  │  └── lower_is_faster     └── tcf (calculated)              │  │
│  │                                                            │  │
│  │  race_handicap_results                                     │  │
│  │  ├── elapsed_seconds                                       │  │
│  │  ├── corrected_seconds                                     │  │
│  │  ├── corrected_position                                    │  │
│  │  └── time_behind_seconds                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Calculation Methods

### Time-on-Time (ToT)

```
Corrected Time = Elapsed Time × Time Correction Factor (TCF)
```

**PHRF TCF Formula:**
```
TCF = 650 / (550 + Rating)
```

Example:
- Elapsed: 1:30:00 (5400 seconds)
- Rating: 120
- TCF = 650 / (550 + 120) = 0.9701
- Corrected = 5400 × 0.9701 = 5238.7 seconds = 1:27:19

### Time-on-Distance (ToD)

```
Corrected Time = Elapsed Time - (Distance × Rating)
```

Example:
- Elapsed: 1:30:00 (5400 seconds)
- Distance: 5.2 nm
- Rating: 120 sec/nm
- Correction = 5.2 × 120 = 624 seconds
- Corrected = 5400 - 624 = 4776 seconds = 1:19:36

## Supported Rating Systems

| System | Type | Rating Unit | Description |
|--------|------|-------------|-------------|
| PHRF | Time-on-Time | sec/mile | Most common US system |
| PHRF ToD | Time-on-Distance | sec/mile | Distance-based PHRF |
| IRC | Time-on-Time | TCC factor | International rule |
| ORC | Time-on-Time | sec/mile | VPP-based system |
| ORR | Time-on-Time | sec/mile | Offshore racing |
| Club | Time-on-Time | custom | Simple club handicap |

## Features

### ✅ Implemented

1. **Rating Systems**
   - PHRF (Time-on-Time)
   - PHRF (Time-on-Distance)
   - IRC (TCC is rating)
   - ORC, ORR
   - Custom club systems

2. **Boat Ratings**
   - Store per-boat ratings
   - Auto-calculate TCF
   - Rating history tracking
   - Certificate information
   - Bulk import

3. **Corrected Times**
   - Calculate per-race
   - Calculate full regatta
   - Support for course distance
   - Position assignment
   - Time-behind calculation

4. **Results View**
   - Race-by-race results
   - Scratch vs. corrected positions
   - Time deltas from winner
   - System selector

5. **Series Standings**
   - Points totals
   - Win counts
   - Average position
   - Races sailed

6. **What-If Analysis**
   - Test different ratings
   - Calculate rating needed to win

## Database Schema

### handicap_systems
```sql
CREATE TABLE handicap_systems (
    id UUID PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    calculation_type TEXT NOT NULL, -- 'time_on_time', 'time_on_distance'
    rating_unit TEXT,
    lower_is_faster BOOLEAN DEFAULT TRUE,
    base_rating DECIMAL(10,4),
    rating_precision INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_builtin BOOLEAN DEFAULT FALSE
);
```

### boat_ratings
```sql
CREATE TABLE boat_ratings (
    id UUID PRIMARY KEY,
    sail_number TEXT NOT NULL,
    boat_name TEXT,
    boat_class TEXT,
    club_id UUID REFERENCES clubs(id),
    system_id UUID REFERENCES handicap_systems(id),
    rating DECIMAL(10,4) NOT NULL,
    tcf DECIMAL(10,6), -- Auto-calculated
    certificate_number TEXT,
    certificate_expiry DATE,
    previous_rating DECIMAL(10,4),
    is_active BOOLEAN DEFAULT TRUE,
    verified BOOLEAN DEFAULT FALSE,
    UNIQUE(sail_number, system_id)
);
```

### race_handicap_results
```sql
CREATE TABLE race_handicap_results (
    id UUID PRIMARY KEY,
    regatta_id UUID REFERENCES regattas(id),
    race_number INTEGER NOT NULL,
    entry_id UUID NOT NULL,
    system_id UUID REFERENCES handicap_systems(id),
    rating_value DECIMAL(10,4),
    tcf_value DECIMAL(10,6),
    elapsed_seconds INTEGER NOT NULL,
    corrected_seconds DECIMAL(12,3) NOT NULL,
    course_distance_nm DECIMAL(6,3),
    scratch_position INTEGER,
    corrected_position INTEGER,
    time_behind_seconds DECIMAL(12,3),
    UNIQUE(regatta_id, race_number, entry_id, system_id)
);
```

## Service API

### HandicapService

```typescript
// Rating Systems
getSystems(): Promise<HandicapSystem[]>
getSystemByCode(code): Promise<HandicapSystem>
getSystem(id): Promise<HandicapSystem>
createSystem(system): Promise<HandicapSystem>

// Boat Ratings
getClubRatings(clubId): Promise<BoatRating[]>
getRatingsBySystem(systemId, clubId?): Promise<BoatRating[]>
getBoatRating(sailNumber, systemId): Promise<BoatRating>
upsertRating(rating): Promise<BoatRating>
updateRating(ratingId, updates): Promise<BoatRating>
deactivateRating(ratingId): Promise<void>
verifyRating(ratingId): Promise<void>
importRatings(systemId, clubId, ratings[]): Promise<{imported, errors}>

// Calculations
calculatePhrfTcf(rating, baseRating?): number
calculateCorrectedTime(input): number
calculateRaceResults(regattaId, raceNumber, systemCode, distance?): Promise<HandicapResult[]>
calculateRegattaResults(regattaId, systemCode, distance?): Promise<{races, results}>

// Results & Standings
getRaceResultsWithHandicap(regattaId, raceNumber, systemCode?): Promise<RaceResultWithHandicap[]>
getStandings(regattaId, systemCode): Promise<HandicapStanding[]>

// What-If Analysis
whatIfRating(elapsed, currentRating, newRating, system, distance?): Analysis
ratingToWin(myElapsed, targetCorrected, system, baseRating?): number

// Helpers
formatTime(seconds): string
formatDelta(seconds): string
getSystemInfo(code): {name, color, description}
```

## UI Components

### Main Dashboard (`/club/handicap/[regattaId]`)

**Results Tab**
- Race selector
- Corrected times table
- Position, elapsed, rating, corrected, delta columns
- Calculate button

**Ratings Tab**
- Search ratings
- Add new rating
- Rating cards with TCF
- Delete option

**Standings Tab**
- Series standings
- Points, wins, races sailed
- Podium highlighting

## File Structure

```
app/
└── club/
    └── handicap/
        ├── _layout.tsx
        └── [regattaId].tsx    # Main dashboard

services/
└── HandicapService.ts         # Handicap calculations

migrations/
└── 20251202_handicap_calculator.sql
```

## PHRF TCF Reference

| Rating | TCF | Example Corrected (1:30:00 elapsed) |
|--------|-----|-------------------------------------|
| 0 | 1.182 | 1:46:19 |
| 50 | 1.083 | 1:37:29 |
| 100 | 1.000 | 1:30:00 |
| 150 | 0.929 | 1:23:36 |
| 200 | 0.867 | 1:18:01 |
| 250 | 0.813 | 1:13:08 |

## Usage Examples

### Calculate Race Results

```typescript
import { handicapService } from '@/services/HandicapService';

// Calculate corrected times for race 1 using PHRF
const results = await handicapService.calculateRaceResults(
  regattaId,
  1,        // race number
  'PHRF',   // system code
  5.2       // course distance (optional, for ToD)
);

// Results are sorted by corrected time
results.forEach(r => {
  console.log(`${r.corrected_position}: ${r.sail_number} - ${r.corrected_seconds}s`);
});
```

### Add Boat Rating

```typescript
await handicapService.upsertRating({
  system_id: phrfSystemId,
  sail_number: 'USA 12345',
  boat_name: 'Sea Breeze',
  boat_class: 'J/105',
  rating: 84,
  club_id: clubId,
});
```

### What-If Analysis

```typescript
const analysis = handicapService.whatIfRating(
  5400,     // elapsed seconds
  120,      // current rating
  100,      // what if rating was 100?
  'PHRF'
);

console.log(`Current: ${analysis.currentCorrected}s`);
console.log(`With 100: ${analysis.newCorrected}s`);
console.log(`Difference: ${analysis.difference}s`);
console.log(`Faster: ${analysis.faster}`);
```

### Rating Needed to Win

```typescript
const neededRating = handicapService.ratingToWin(
  5400,    // my elapsed time
  5000,    // winner's corrected time
  'PHRF'
);

console.log(`Need rating of ${neededRating} to have won`);
```

## Integration with Scoring Engine

The Handicap Calculator integrates with the Scoring Engine:

```
Elapsed Times (from finish recording)
        │
        ▼
   Handicap Calculator
   • Apply ratings
   • Calculate corrected times
        │
        ▼
   Corrected Results
   • Positions assigned
   • Points calculated
        │
        ▼
   Scoring Engine
   • Apply discards
   • Calculate series standings
```

## Future Enhancements

- [ ] Certificate import (IRC, ORC files)
- [ ] Rating recommendation based on results
- [ ] Fleet rating audit tools
- [ ] Performance analysis trends
- [ ] Weather-adjusted ratings
- [ ] Split starts by handicap group

