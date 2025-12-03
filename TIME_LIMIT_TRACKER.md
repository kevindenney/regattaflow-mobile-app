# Time Limit Tracker Implementation

## Overview

The Time Limit Tracker provides RRS-compliant race time limit management with automatic DNF marking. It ensures races don't run indefinitely and boats are properly scored when time limits expire.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     TIME LIMIT TRACKER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │   Configure   │ ── │   Monitor    │ ── │   Auto-DNF      │  │
│  │  Time Limits  │    │  Countdown   │    │   Unfinished    │  │
│  └───────────────┘    └──────────────┘    └─────────────────┘  │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  TimeLimitService                          │  │
│  │  • Create/configure time limits                            │  │
│  │  • Calculate deadlines                                     │  │
│  │  • Monitor countdowns                                      │  │
│  │  • Trigger alerts                                          │  │
│  │  • Apply auto-DNF                                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Database Layer                          │  │
│  │                                                            │  │
│  │  race_time_limits           time_limit_templates           │  │
│  │  ├── id                     ├── id                         │  │
│  │  ├── regatta_id             ├── club_id                    │  │
│  │  ├── race_number            ├── name                       │  │
│  │  ├── race_time_limit        ├── race_time_limit_minutes    │  │
│  │  ├── finishing_window       ├── finishing_window_minutes   │  │
│  │  ├── race_start_time        └── auto_dnf_enabled           │  │
│  │  ├── first_finish_time                                     │  │
│  │  ├── race_time_deadline                                    │  │
│  │  ├── finishing_deadline                                    │  │
│  │  ├── status                                                │  │
│  │  └── auto_dnf_enabled                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                Integration Points                          │  │
│  │  • Committee Boat Log (auto-log expiration)                │  │
│  │  • Scoring Engine (DNF status updates)                     │  │
│  │  • Race Results (finish time tracking)                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## RRS Compliance (Rule 35)

```
RRS 35 - TIME LIMIT AND SCORES

If one boat sails the course in accordance with rule 28
and finishes within the time limit, if any, all boats that
finish shall be scored according to their finishing places.

If no boat finishes within the time limit, the race shall
be abandoned.

A boat that does not finish within the finishing window
shall be scored Did Not Finish without a hearing.
```

### Implementation

| RRS Concept | Implementation |
|-------------|----------------|
| Time Limit | `race_time_limit_minutes` - Max time for first boat |
| Finishing Window | `finishing_window_minutes` - Time after first finish |
| No Finisher | `time_expired` status, race can be abandoned |
| DNF | Auto-applied when window expires |

## Event Flow

```
Race Configuration
       │
       ▼
   Set Time Limit
   • Race time limit (e.g., 90 min)
   • First mark limit (optional)
   • Finishing window (e.g., 30 min)
   • Auto-DNF enabled
       │
       ▼
   Race Starts ──────────────────────┐
       │                              │
       │   ┌─────────────────────┐   │
       │   │ COUNTDOWN ACTIVE    │   │
       │   │ race_time_deadline  │   │
       │   └─────────────────────┘   │
       │              │               │
       │    5 min warning ──► Alert  │
       │    1 min warning ──► Alert  │
       │              │               │
       ├──────────────┼───────────────┤
       │              │               │
   First Finish  No Finisher     Time Expires
       │              │               │
       ▼              ▼               ▼
┌─────────────┐  ┌──────────┐  ┌──────────────┐
│  FINISHING  │  │  TIME    │  │    RACE      │
│   WINDOW    │  │ EXPIRED  │  │  ABANDONED   │
│   ACTIVE    │  │          │  │              │
└──────┬──────┘  └────┬─────┘  └──────────────┘
       │              │
       ▼              ▼
  Window Expires  Auto-DNF (if enabled)
       │              │
       ▼              ▼
┌─────────────────────────────────────────┐
│              AUTO-DNF                    │
│  • Mark unfinished boats as DNF         │
│  • Update race_results status           │
│  • Log to Committee Boat Log            │
└─────────────────────────────────────────┘
       │
       ▼
   Race Complete
```

## Features

### ✅ Implemented

1. **Time Limit Configuration**
   - Race time limit (minutes)
   - First mark limit (optional)
   - Finishing window after first finish
   - Auto-DNF toggle

2. **Automatic Deadline Calculation**
   - Triggers on race start
   - Calculates finishing deadline on first finish
   - Updates status automatically

3. **Real-Time Countdown**
   - Live countdown display
   - Color-coded warnings (5 min, 1 min)
   - Visual and haptic alerts

4. **Auto-DNF**
   - Marks unfinished boats as DNF
   - Records reason in notes
   - Logs to Committee Boat Log

5. **Templates**
   - Pre-configured time limits
   - Club-specific templates
   - Quick setup options

6. **Committee Log Integration**
   - Auto-logs time limit expiration
   - Auto-logs finishing window expiration
   - Auto-logs DNF applications

## Database Schema

### race_time_limits
```sql
CREATE TABLE race_time_limits (
    id UUID PRIMARY KEY,
    regatta_id UUID REFERENCES regattas(id),
    race_number INTEGER,
    fleet_id UUID REFERENCES fleets(id),
    
    -- Configuration
    race_time_limit_minutes INTEGER,
    first_mark_limit_minutes INTEGER,
    finishing_window_minutes INTEGER DEFAULT 30,
    
    -- Actual times
    race_start_time TIMESTAMPTZ,
    first_mark_time TIMESTAMPTZ,
    first_finish_time TIMESTAMPTZ,
    
    -- Calculated deadlines
    race_time_deadline TIMESTAMPTZ,
    first_mark_deadline TIMESTAMPTZ,
    finishing_deadline TIMESTAMPTZ,
    
    -- Status
    status TEXT CHECK (status IN (
        'pending', 'racing', 'first_finished',
        'time_expired', 'window_expired', 'completed'
    )),
    
    -- Alerts
    warning_sent_at TIMESTAMPTZ,
    one_minute_warning_at TIMESTAMPTZ,
    limit_expired_at TIMESTAMPTZ,
    
    -- Auto-DNF
    auto_dnf_enabled BOOLEAN DEFAULT TRUE,
    auto_dnf_applied_at TIMESTAMPTZ,
    boats_dnf_count INTEGER DEFAULT 0
);
```

### time_limit_templates
```sql
CREATE TABLE time_limit_templates (
    id UUID PRIMARY KEY,
    club_id UUID REFERENCES clubs(id),
    name TEXT,
    description TEXT,
    race_time_limit_minutes INTEGER,
    first_mark_limit_minutes INTEGER,
    finishing_window_minutes INTEGER,
    auto_dnf_enabled BOOLEAN,
    race_type TEXT,
    is_default BOOLEAN
);
```

## Service API

### TimeLimitService

```typescript
// Create & Configure
createTimeLimit(regattaId, raceNumber, config, fleetId?): Promise<TimeLimit>
createFromTemplate(templateId, regattaId, raceNumber, fleetId?): Promise<TimeLimit>
updateTimeLimit(timeLimitId, updates): Promise<TimeLimit>

// Race Events
recordRaceStart(timeLimitId, startTime?): Promise<TimeLimit>
recordFirstMark(timeLimitId, markTime?): Promise<TimeLimit>
recordFirstFinish(timeLimitId, finishTime?): Promise<TimeLimit>
expireTimeLimit(timeLimitId): Promise<TimeLimit>
completeTimeLimit(timeLimitId): Promise<TimeLimit>

// Auto-DNF
applyAutoDNF(timeLimitId): Promise<number>
setAutoDNF(timeLimitId, enabled): Promise<void>

// Queries
getTimeLimit(regattaId, raceNumber, fleetId?): Promise<TimeLimit>
getTimeLimitById(id): Promise<TimeLimit>
getActiveTimeLimits(regattaId): Promise<ActiveTimeLimit[]>
getAllTimeLimits(regattaId): Promise<TimeLimit[]>

// Monitoring
calculateTimeRemaining(timeLimit): { minutes, seconds, isExpired, deadline }
startMonitoring(regattaId, onAlert, checkIntervalMs): void
stopMonitoring(): void

// Templates
getTemplates(clubId?): Promise<TimeLimitTemplate[]>
createTemplate(clubId, name, config): Promise<TimeLimitTemplate>

// Helpers
formatTimeRemaining(minutes, seconds): string
getStatusInfo(status): { label, color, bgColor }
```

## UI Components

### TimeLimitTracker (`components/race/TimeLimitTracker.tsx`)

Full-featured time limit component with:
- Setup modal for configuration
- Real-time countdown display
- Warning indicators (5 min, 1 min)
- Action buttons (start, first finish, expire, complete)
- DNF count display
- Alert toggle

### Compact Mode

```tsx
<TimeLimitTracker
  regattaId={regattaId}
  raceNumber={1}
  compact={true}  // Shows minimal countdown in header
/>
```

### Full Mode

```tsx
<TimeLimitTracker
  regattaId={regattaId}
  raceNumber={1}
  onExpired={() => console.log('Time expired!')}
  onAutoDNF={(count) => console.log(`${count} boats DNF'd`)}
/>
```

## File Structure

```
components/
└── race/
    └── TimeLimitTracker.tsx    # Main UI component

services/
└── TimeLimitService.ts         # Time limit operations

migrations/
└── 20251202_time_limit_tracker.sql
```

## Default Templates

| Template | Race Limit | Finish Window | Use Case |
|----------|------------|---------------|----------|
| Standard Buoy Race | 90 min | 30 min | Typical W/L racing |
| Short Course | 60 min | 20 min | Quick races |
| Long Distance | 180 min | 45 min | Extended racing |
| No Time Limit | None | 60 min | Race until done |

## Status Flow

```
pending ─── Race not started
   │
   ▼ (race starts)
racing ──── Countdown to race_time_deadline
   │
   ├── (first finish) ──► first_finished ──► Countdown to finishing_deadline
   │                             │
   │                             └── (window expires) ──► window_expired
   │
   └── (no finisher) ──► time_expired
                               │
                               ▼
                           completed ──► Auto-DNF applied, race done
```

## Integration Examples

### Race Committee Console

```tsx
import { TimeLimitTracker } from '@/components/race/TimeLimitTracker';

function RaceConsole({ regattaId, raceNumber }) {
  return (
    <View>
      <TimeLimitTracker
        regattaId={regattaId}
        raceNumber={raceNumber}
        onExpired={() => {
          // Show notification
          // Update race status
        }}
        onAutoDNF={(count) => {
          // Refresh results
          // Show toast
        }}
      />
    </View>
  );
}
```

### Monitoring Multiple Races

```typescript
import { timeLimitService } from '@/services/TimeLimitService';

// Start monitoring all active races
timeLimitService.startMonitoring(
  regattaId,
  (alert) => {
    // Handle alerts
    if (alert.type === 'expired') {
      // Play sound
      // Show notification
    }
  },
  10000  // Check every 10 seconds
);

// Stop when leaving screen
timeLimitService.stopMonitoring();
```

## Alert System

| Alert Type | Trigger | Action |
|------------|---------|--------|
| `warning` | 5 minutes remaining | Visual + vibration |
| `one_minute` | 1 minute remaining | Visual + vibration |
| `expired` | Time limit reached | Visual + vibration + callback |

## Committee Log Entries

The system automatically logs:
- `time_limit_expired` - When race time limit expires
- `finishing_window_expired` - When finishing window expires
- `auto_dnf_applied` - When boats are marked DNF

## Future Enhancements

- [ ] Mark rounding time limit enforcement
- [ ] Multiple fleet time limit staggering
- [ ] Sound/horn integration
- [ ] Push notifications
- [ ] Historical time limit analysis
- [ ] Weather-based time limit adjustments

