# Multi-Class Start Scheduler Implementation

## Overview

The Multi-Class Start Scheduler provides rolling start sequence management for regattas with multiple fleets. It automates the timing of staggered starts and handles complex scenarios like general recalls.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 MULTI-CLASS START SCHEDULER                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │    Schedule   │ ── │   Timeline   │ ── │    Control      │  │
│  │  Configuration│    │     View     │    │    Console      │  │
│  └───────────────┘    └──────────────┘    └─────────────────┘  │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                 StartSchedulerService                      │  │
│  │  • Create/manage schedules                                 │  │
│  │  • Add/reorder fleet entries                               │  │
│  │  • Signal warning/prep/start                               │  │
│  │  • Handle general recalls                                  │  │
│  │  • Auto-advance to next fleet                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Database Layer                          │  │
│  │                                                            │  │
│  │  race_start_schedules        fleet_start_entries           │  │
│  │  ├── id                      ├── id                        │  │
│  │  ├── regatta_id              ├── schedule_id               │  │
│  │  ├── name                    ├── fleet_name                │  │
│  │  ├── scheduled_date          ├── class_flag                │  │
│  │  ├── start_interval          ├── start_order               │  │
│  │  ├── sequence_type           ├── race_number               │  │
│  │  ├── first_warning_time      ├── planned_warning_time      │  │
│  │  └── status                  ├── actual_start_time         │  │
│  │                              └── status                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                Integration Points                          │  │
│  │  • Committee Boat Log (auto-log all signals)               │  │
│  │  • Time Limit Tracker (per-fleet limits)                   │  │
│  │  • Race Results (link to race numbers)                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Start Sequence Flow

```
ROLLING START SEQUENCE
══════════════════════

Time   │ PHRF A     │ PHRF B     │ J/70       │ Laser
───────┼────────────┼────────────┼────────────┼────────────
10:00  │ WARNING    │            │            │
       │ Class Flag │            │            │
       │ 🔊 1       │            │            │
───────┼────────────┼────────────┼────────────┼────────────
10:01  │ PREP       │            │            │
       │ P Flag     │            │            │
       │ 🔊 1       │            │            │
───────┼────────────┼────────────┼────────────┼────────────
10:04  │ 1 MINUTE   │            │            │
       │ P down     │            │            │
───────┼────────────┼────────────┼────────────┼────────────
10:05  │ START      │ WARNING    │            │
       │ Class down │ Class Flag │            │
       │ 🔊 1       │ 🔊 1       │            │
───────┼────────────┼────────────┼────────────┼────────────
10:06  │            │ PREP       │            │
       │            │ P Flag     │            │
───────┼────────────┼────────────┼────────────┼────────────
10:09  │            │ 1 MINUTE   │            │
───────┼────────────┼────────────┼────────────┼────────────
10:10  │            │ START      │ WARNING    │
       │            │ 🔊 1       │ Class Flag │
───────┼────────────┼────────────┼────────────┼────────────
       │            │            │   ...      │   ...

Legend: 🔊 = Sound signal
```

## Sequence Types

| Type | Warning | Prep | 1-Min | Total |
|------|---------|------|-------|-------|
| 5-4-1-go | 5:00 | 4:00 | 1:00 | 5 min |
| 3-2-1-go | 3:00 | 2:00 | 1:00 | 3 min |
| 5-1-go | 5:00 | - | 1:00 | 5 min |
| custom | configurable | configurable | configurable | varies |

## Features

### ✅ Implemented

1. **Schedule Configuration**
   - Name and date
   - Start interval between classes (3/5/10 min)
   - Sequence type selection
   - First warning time

2. **Fleet Management**
   - Add/remove fleets
   - Drag to reorder
   - Custom class flags
   - Custom intervals per fleet

3. **Timeline View**
   - Visual fleet order
   - Planned times
   - Status badges
   - Quick actions

4. **Control Console**
   - Active fleet display
   - Live countdown
   - Phase indicators (warning/prep/final)
   - Signal buttons

5. **Rolling Starts**
   - Auto-advance to next fleet
   - Calculated timing
   - Parallel tracking

6. **General Recall**
   - Move fleet to end of sequence
   - Preserve other fleet timing
   - Auto-logging
   - Recall counter

7. **Individual Recall**
   - Record OCS boats
   - Race continues
   - X flag signal

8. **Postpone/Abandon**
   - AP/N flag signals
   - Reset timing
   - Status tracking

9. **Committee Log Integration**
   - All signals auto-logged
   - Timestamps preserved
   - Linked to race numbers

## Database Schema

### race_start_schedules
```sql
CREATE TABLE race_start_schedules (
    id UUID PRIMARY KEY,
    regatta_id UUID REFERENCES regattas(id),
    name TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    start_interval_minutes INTEGER DEFAULT 5,
    sequence_type TEXT DEFAULT '5-4-1-go',
    warning_minutes INTEGER DEFAULT 5,
    preparatory_minutes INTEGER DEFAULT 4,
    one_minute_signal BOOLEAN DEFAULT TRUE,
    first_warning_time TIME,
    actual_first_warning TIMESTAMPTZ,
    status TEXT DEFAULT 'draft',
    notes TEXT,
    created_by UUID
);
```

### fleet_start_entries
```sql
CREATE TABLE fleet_start_entries (
    id UUID PRIMARY KEY,
    schedule_id UUID REFERENCES race_start_schedules(id),
    fleet_id UUID REFERENCES fleets(id),
    fleet_name TEXT NOT NULL,
    class_flag TEXT,
    start_order INTEGER NOT NULL,
    race_number INTEGER NOT NULL,
    planned_warning_time TIMESTAMPTZ,
    planned_prep_time TIMESTAMPTZ,
    planned_start_time TIMESTAMPTZ,
    actual_warning_time TIMESTAMPTZ,
    actual_prep_time TIMESTAMPTZ,
    actual_start_time TIMESTAMPTZ,
    status TEXT DEFAULT 'pending',
    recall_count INTEGER DEFAULT 0,
    last_recall_at TIMESTAMPTZ,
    recall_notes TEXT,
    custom_interval_minutes INTEGER,
    start_sequence_id UUID,
    time_limit_id UUID,
    UNIQUE(schedule_id, start_order)
);
```

## Service API

### StartSchedulerService

```typescript
// Schedule Management
createSchedule(input): Promise<StartSchedule>
updateSchedule(scheduleId, updates): Promise<StartSchedule>
deleteSchedule(scheduleId): Promise<void>
getSchedule(scheduleId): Promise<StartSchedule>
getSchedules(regattaId): Promise<StartSchedule[]>
getScheduleStatus(scheduleId): Promise<ScheduleStatus>

// Fleet Management
addFleets(scheduleId, fleets[]): Promise<FleetStartEntry[]>
removeFleet(fleetEntryId): Promise<void>
reorderFleets(scheduleId, fleetIds[]): Promise<FleetStartEntry[]>
getFleetEntries(scheduleId): Promise<FleetStartEntry[]>
getTimeline(scheduleId): Promise<TimelineEntry[]>
updateFleetEntry(entryId, updates): Promise<FleetStartEntry>

// Sequence Control
markReady(scheduleId): Promise<StartSchedule>
startSequence(scheduleId): Promise<FleetStartEntry>
signalWarning(fleetEntryId): Promise<FleetStartEntry>
signalPreparatory(fleetEntryId): Promise<FleetStartEntry>
signalOneMinute(fleetEntryId): Promise<FleetStartEntry>
signalStart(fleetEntryId): Promise<FleetStartEntry>

// Recall Handling
generalRecall(fleetEntryId, notes?): Promise<void>
individualRecall(fleetEntryId, boatIds[]): Promise<FleetStartEntry>
postponeFleet(fleetEntryId, reason?): Promise<FleetStartEntry>
abandonFleet(fleetEntryId, reason?): Promise<FleetStartEntry>

// Helpers
getSequenceIntervals(type): { warning, preparatory, oneMinute }
calculateCountdown(entry, sequenceType): CountdownData
getStatusDisplay(status): { label, color, bgColor }
```

## UI Components

### Main View (`/club/starts/[scheduleId]`)

**Timeline View**
- Ordered fleet list
- Drag-drop reordering (draft mode)
- Status badges
- Quick signal actions

**Control View**
- Active fleet header with phase color
- Large countdown display
- Signal buttons (Prep, 1-Min, Start)
- Emergency actions (Recall, Postpone)

## File Structure

```
app/
└── club/
    └── starts/
        ├── _layout.tsx
        └── [scheduleId].tsx     # Main scheduler UI

services/
└── StartSchedulerService.ts    # Scheduling operations

migrations/
└── 20251202_multi_class_starts.sql
```

## Fleet Status Flow

```
pending ──► warning ──► preparatory ──► one_minute ──► started
   │           │            │              │
   │           └────────────┴──────────────┘
   │                        │
   │                        ▼
   │                 general_recall ──► (move to end) ──► pending
   │
   └──► postponed ──► pending
   │
   └──► abandoned
```

## General Recall Handling

When a general recall occurs:

1. **Current fleet** status → `general_recall`
2. **Fleet moved** to end of sequence
3. **Other fleets** continue normally
4. **Committee log** auto-entry with First Substitute flag
5. **Recall counter** incremented
6. **New warning time** calculated based on new position

```
Before Recall:          After Recall:
1. PHRF A (recalled)    1. PHRF B (continues)
2. PHRF B               2. J/70 (continues)
3. J/70                 3. PHRF A (restarted)
```

## Integration Examples

### Create Schedule for Race Day

```typescript
import { startSchedulerService } from '@/services/StartSchedulerService';

// Create schedule
const schedule = await startSchedulerService.createSchedule({
  regatta_id: regattaId,
  name: 'Saturday Races 1-3',
  scheduled_date: '2024-12-02',
  start_interval_minutes: 5,
  sequence_type: '5-4-1-go',
  first_warning_time: '10:00',
});

// Add fleets
await startSchedulerService.addFleets(schedule.id, [
  { fleet_name: 'PHRF A', class_flag: 'A', race_number: 1 },
  { fleet_name: 'PHRF B', class_flag: 'B', race_number: 1 },
  { fleet_name: 'J/70', class_flag: 'J', race_number: 1 },
]);

// Mark ready
await startSchedulerService.markReady(schedule.id);
```

### Run Start Sequence

```typescript
// Start sequence (signals first fleet warning)
const firstFleet = await startSchedulerService.startSequence(schedule.id);

// Manual signal controls
await startSchedulerService.signalPreparatory(firstFleet.id);
await startSchedulerService.signalOneMinute(firstFleet.id);
await startSchedulerService.signalStart(firstFleet.id);
// Next fleet warning is auto-triggered
```

### Handle General Recall

```typescript
// General recall moves fleet to end
await startSchedulerService.generalRecall(
  fleetEntryId,
  'Multiple boats OCS'
);
// Fleet is now at end of sequence
// Other fleets continue normally
```

## Committee Log Entries

The scheduler automatically logs:

| Signal | Category | Flags | Sounds |
|--------|----------|-------|--------|
| Warning | signal | Class flag | 1 |
| Preparatory | signal | P | 1 |
| One Minute | signal | - | 0 |
| Start | timing | - | 1 |
| General Recall | signal | 1st Sub | 2 |
| Individual Recall | signal | X | 1 |
| Postponement | signal | AP | 2 |
| Abandonment | signal | N | 3 |

## Future Enhancements

- [ ] Audio/horn integration
- [ ] Multiple race day support
- [ ] Template schedules
- [ ] Pursuit start calculations
- [ ] Handicap-adjusted start times
- [ ] Weather-based postponement rules
- [ ] Push notifications to competitors
- [ ] Live spectator view

