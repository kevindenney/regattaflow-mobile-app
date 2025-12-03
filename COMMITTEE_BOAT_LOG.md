# Committee Boat Log Implementation

## Overview

The Committee Boat Log is an official timestamped event log for race management documentation. It provides a complete audit trail of all race events for use in appeals, official records, and race review.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMMITTEE BOAT LOG                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │ Quick Actions │ ── │ Log Timeline │ ── │  Daily Summary  │  │
│  └───────────────┘    └──────────────┘    └─────────────────┘  │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  CommitteeLogService                       │  │
│  │  • Create/Update/Delete entries                            │  │
│  │  • Quick log methods (signals, weather, incidents)         │  │
│  │  • Template management                                     │  │
│  │  • Verification workflow                                   │  │
│  │  • Export to text/CSV                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Database Layer                          │  │
│  │                                                            │  │
│  │  committee_boat_log      committee_log_templates           │  │
│  │  ├── id                  ├── id                            │  │
│  │  ├── regatta_id          ├── club_id                       │  │
│  │  ├── race_number         ├── name                          │  │
│  │  ├── entry_number        ├── category                      │  │
│  │  ├── log_time            ├── title_template                │  │
│  │  ├── category            └── flags_displayed               │  │
│  │  ├── title                                                 │  │
│  │  ├── description                                           │  │
│  │  ├── flags_displayed                                       │  │
│  │  ├── wind_direction                                        │  │
│  │  ├── wind_speed                                            │  │
│  │  ├── logged_by                                             │  │
│  │  └── verified                                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Auto-Logging Triggers                   │  │
│  │  • auto_log_start_sequence (warning/prep/start)            │  │
│  │  • auto_log_flag_signal (flag displays)                    │  │
│  │  • auto_log_protest (protests filed/decided)               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Event Flow

```
Race Event Occurs
       │
       ├──► Manual Entry (Quick Log / Full Form)
       │         │
       │         ▼
       │    Create log entry with:
       │    • Timestamp
       │    • Category
       │    • Title/Description
       │    • Flags/Signals
       │    • Author info
       │
       └──► Auto-Logged (Triggers)
                 │
                 ▼
            Events automatically logged:
            • Start sequence signals
            • Flag displays
            • Protests filed/decided
            • Race starts/finishes
                 │
                 ▼
       ┌─────────────────┐
       │  Log Timeline   │
       │  • Filterable   │
       │  • Searchable   │
       │  • Verifiable   │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │  Export/Archive │
       │  • Text format  │
       │  • CSV format   │
       │  • PDF (future) │
       └─────────────────┘
```

## Features

### ✅ Implemented

1. **Timestamped Entries**
   - Precise log_time and recorded_at timestamps
   - Sequential entry numbering per day
   - Race number association

2. **Event Categories**
   - `signal` - Flag signals, sounds
   - `course` - Course changes, marks
   - `weather` - Wind, conditions
   - `incident` - On-water incidents
   - `protest` - Protest-related
   - `safety` - Safety matters
   - `announcement` - Public announcements
   - `timing` - Start/finish times
   - `penalty` - Penalties applied
   - `equipment` - Equipment issues
   - `committee` - Committee decisions
   - `general` - Other entries

3. **Author Tracking**
   - User ID, name, and role recorded
   - Cached for historical accuracy
   - Audit trail preserved

4. **Quick Log Actions**
   - One-tap common entries
   - General/Individual recall
   - Postponement, course change
   - Weather update, incident

5. **Auto-Logging**
   - Start sequence events (warning, prep, start)
   - Flag signal displays
   - Protests filed and decided

6. **Templates**
   - Pre-configured quick entries
   - Club-specific templates
   - Usage tracking

7. **Verification Workflow**
   - Entries can be verified by officials
   - Verified entries show checkmark
   - Verification timestamp recorded

8. **Filtering & Search**
   - By category
   - By date
   - By race number
   - Text search
   - Auto-logged toggle

9. **Export**
   - Text format for official records
   - CSV format for spreadsheets
   - Daily summary view

10. **Soft Delete**
    - Entries preserved for audit
    - Delete reason recorded
    - Hidden from normal view

## Database Schema

### committee_boat_log
```sql
CREATE TABLE committee_boat_log (
    id UUID PRIMARY KEY,
    regatta_id UUID REFERENCES regattas(id),
    race_number INTEGER,
    entry_number SERIAL,
    log_time TIMESTAMPTZ,
    recorded_at TIMESTAMPTZ,
    category TEXT,
    event_type TEXT,
    title TEXT,
    description TEXT,
    flags_displayed TEXT[],
    sound_signals INTEGER,
    related_entry_ids UUID[],
    related_protest_id UUID,
    location TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    wind_direction INTEGER,
    wind_speed DECIMAL,
    logged_by UUID,
    logged_by_name TEXT,
    logged_by_role TEXT,
    verified BOOLEAN,
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    is_auto_logged BOOLEAN,
    auto_log_source TEXT,
    is_deleted BOOLEAN,
    deleted_by UUID,
    delete_reason TEXT
);
```

### committee_log_templates
```sql
CREATE TABLE committee_log_templates (
    id UUID PRIMARY KEY,
    club_id UUID REFERENCES clubs(id),
    name TEXT,
    category TEXT,
    event_type TEXT,
    title_template TEXT,
    description_template TEXT,
    flags_displayed TEXT[],
    sound_signals INTEGER,
    icon TEXT,
    color TEXT,
    sort_order INTEGER,
    is_active BOOLEAN
);
```

## Service API

### CommitteeLogService

```typescript
// Create entries
createEntry(entry: LogEntryInput): Promise<LogEntry>
createFromTemplate(templateId, regattaId, overrides): Promise<LogEntry>

// Quick log methods
logSignal(regattaId, raceNumber, flagCode, meaning, signals): Promise<LogEntry>
logWeather(regattaId, windDirection, windSpeed, notes): Promise<LogEntry>
logIncident(regattaId, raceNumber, title, description, entryIds): Promise<LogEntry>
logAnnouncement(regattaId, message, raceNumber): Promise<LogEntry>
logTiming(regattaId, raceNumber, eventType, description): Promise<LogEntry>
logCourseChange(regattaId, raceNumber, changeType, description): Promise<LogEntry>
logSafety(regattaId, title, description, entryIds, location): Promise<LogEntry>

// Read entries
getEntry(entryId): Promise<LogEntry>
getEntries(regattaId, filters): Promise<LogEntry[]>
getRaceEntries(regattaId, raceNumber): Promise<LogEntry[]>
getTodayEntries(regattaId): Promise<LogEntry[]>

// Verification
verifyEntry(entryId): Promise<void>
unverifyEntry(entryId): Promise<void>

// Summaries & Export
getDailySummary(regattaId, date): Promise<DailySummary>
getAllDailySummaries(regattaId): Promise<DailySummary[]>
exportToText(regattaId, date): Promise<string>
exportToCSV(entries): string

// Templates
getTemplates(clubId): Promise<LogTemplate[]>
```

## UI Components

### Main Log View (`/club/log/[regattaId]`)
- Timeline view of all entries
- Category filter chips
- Search functionality
- Date selector
- Summary tab with export

### Quick Log Button (`QuickLogButton.tsx`)
- Floating action button
- Quick access to common entries
- Description modal for details
- Race number context

## File Structure

```
app/
├── club/
│   └── log/
│       ├── _layout.tsx
│       └── [regattaId].tsx     # Main log view

components/
└── log/
    └── QuickLogButton.tsx      # FAB for quick logging

services/
└── CommitteeLogService.ts      # All log operations

migrations/
└── 20251202_committee_boat_log.sql
```

## Auto-Logging Triggers

### Start Sequence Events
- Warning signal (class flag displayed)
- Preparatory signal (P flag displayed)
- Start signal (race started)

### Flag Signals
- When any flag status changes to 'displayed'
- Captures flag code, meaning, sound signals

### Protests
- When protest is filed
- When decision is made

## Default Templates

| Template | Category | Flags | Signals |
|----------|----------|-------|---------|
| General Recall | signal | 1st Sub | 2 |
| Individual Recall | signal | X | 1 |
| Postponement | signal | AP | 2 |
| Course Change | course | C | 1 |
| Shortened Course | course | S | 2 |
| Abandonment | signal | N | 3 |
| Race Finish | timing | - | 1 |
| Weather Update | weather | - | 0 |
| Safety Incident | safety | - | 0 |
| Mark Move | course | - | 0 |

## Integration Points

### Race Committee Console
- Quick Log button floats over console
- Context-aware race number
- One-tap logging during race

### Protest System
- Auto-logs protest filings
- Auto-logs decisions
- Links to protest records

### Scoring System
- Provides official timing records
- Supports appeals documentation

## Export Formats

### Text Export
```
COMMITTEE BOAT LOG
============================================================
Generated: 12/2/2025, 2:30:45 PM

------------------------------------------------------------
DATE: 12/2/2025
------------------------------------------------------------

[10:00:00] #1 - SIGNAL
  Warning Signal
  Warning signal for Race 1 (PHRF)
  Flags: ClassFlag
  Sound signals: 1
  Logged by: John Smith
  ✓ Verified

[10:05:00] #2 - TIMING
  Race Start
  Race 1 (PHRF) started
  Sound signals: 1
  Logged by: Auto
```

### CSV Export
```csv
Entry #,Time,Category,Race,Title,Description,Flags,Signals,Logged By,Verified
1,2024-12-02T10:00:00Z,signal,1,"Warning Signal","Warning signal for Race 1","ClassFlag",1,"John Smith",Yes
2,2024-12-02T10:05:00Z,timing,1,"Race Start","Race 1 started","",1,"Auto",No
```

## Usage Examples

### Log a Signal
```typescript
await committeeLogService.logSignal(
  regattaId,
  1,                    // race number
  'AP',                 // flag code
  'Race postponed 30 minutes',
  2                     // sound signals
);
```

### Log Weather
```typescript
await committeeLogService.logWeather(
  regattaId,
  225,                  // wind direction (degrees)
  12.5,                 // wind speed (knots)
  'Building sea breeze'
);
```

### Export Day's Log
```typescript
const text = await committeeLogService.exportToText(
  regattaId,
  new Date('2024-12-02')
);
// Share or save text...
```

## Future Enhancements

- [ ] PDF export with official formatting
- [ ] Photo/attachment support
- [ ] GPS location capture
- [ ] Voice-to-text entry
- [ ] Multi-device sync
- [ ] Digital signature for verification
- [ ] Integration with race timing systems

