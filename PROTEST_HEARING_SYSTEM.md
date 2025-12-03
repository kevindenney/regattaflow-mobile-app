# Protest Hearing System

## Overview

The Protest Hearing System provides a complete workflow for managing sailing protests from filing through hearing to decision and penalty application. It implements the requirements of the Racing Rules of Sailing (RRS) Part 5.

## Complete Race-to-Results Pipeline

```
Race → Finish → Protest → Hearing → Decision → Score → Publish
```

## Features

### 📋 Protest Filing
- Multi-step filing wizard
- Time limit validation (90-minute default)
- Protest type selection:
  - Boat vs Boat
  - Boat vs Race Committee
  - Race Committee vs Boat
  - Request for Redress
  - Equipment Inspection/Measurement
- Common RRS rules quick-select
- Hail/flag/notification tracking

### 📅 Hearing Scheduling
- Room/time assignment
- Panel member assignment
- Virtual hearing support
- Scheduling conflicts detection
- Postponement handling with rescheduling

### 👥 Protest Committee Management
- Member roster with qualifications
- Role assignment (Chair, Vice Chair, Member, Alternate)
- International/National/Regional Judge tracking
- Conflict of interest tracking
- Availability management

### 📝 Evidence Management
- Multiple evidence types:
  - Diagrams
  - Photos/Videos
  - Documents
  - Track data (GPS)
  - Witness statements
  - Official statements
- Admissibility control
- Source tracking (protestor/protestee/committee)

### 👤 Witness Management
- Witness registration
- Called-by tracking
- Role identification
- Testimony recording

### ⚖️ Decision Entry
- Decision types:
  - Protest Upheld
  - Protest Dismissed
  - Protest Withdrawn
  - No Valid Protest
  - Redress Granted/Denied
- Facts found & conclusions
- Rules applied tracking
- Penalty assignment:
  - DSQ (Disqualification)
  - DNS/DNF
  - Scoring penalty
  - Time penalty
  - Warning

### 🔄 Auto-Penalty Application
When a decision is entered with a penalty, the system automatically:
1. Updates race results with the appropriate score code
2. Updates the protest status
3. Records the change in the audit log
4. Triggers scoring recalculation

### 📄 Decision Documents
- Auto-generated formal decision documents
- Chair signature tracking
- Appeal deadline calculation
- Export-ready format

## Architecture

### Files

```
services/
└── ProtestService.ts              # Service layer for all protest operations

app/club/protests/
├── _layout.tsx                    # Route layout
├── [regattaId].tsx               # Main protest dashboard
├── file/
│   ├── _layout.tsx
│   └── [regattaId].tsx           # Protest filing form
└── hearing/
    ├── _layout.tsx
    └── [hearingId].tsx           # Hearing room view

migrations/
└── 20251202_protest_hearing_system.sql
```

### Database Schema

#### `race_protests` (Extended)
- `protest_number` - Auto-generated (P1, P2, etc.)
- `hail_given` - Whether "Protest" was hailed
- `red_flag_displayed` - Flag requirement met
- `informed_protestee` - Notification given
- `time_limit_validated` - Within time limit

#### `protest_hearings`
- `hearing_number` - Order for the day
- `scheduled_time` - When scheduled
- `room_name` / `room_location`
- `is_virtual` / `virtual_meeting_url`
- `status` - scheduled/in_progress/completed/postponed

#### `protest_committee_members`
- Judge qualifications (International/National/Regional)
- Certifications
- Role (Chair/Vice Chair/Member/Alternate)
- Conflicts tracking

#### `hearing_panel_assignments`
- Links members to specific hearings
- Role in that hearing
- Attendance tracking

#### `protest_evidence`
- Evidence type and content
- Submitted by whom
- Admissibility status

#### `protest_witnesses`
- Witness details
- Called by whom
- Testimony summary

#### `protest_decisions`
- Decision type and details
- Facts found & conclusions
- Rules applied
- Penalty information
- Appeal deadline
- Chair signature

#### `hearing_rooms`
- Room inventory per regatta
- Capacity and facilities

## Usage

### Filing a Protest

```typescript
import { protestService } from '@/services/ProtestService';

// Check time limit first
const { isExpired, minutesRemaining } = await protestService.getProtestDeadline(regattaId, raceNumber);

// File protest
const protest = await protestService.fileProtest({
  regatta_id: regattaId,
  race_number: 3,
  protest_type: 'boat_vs_boat',
  protestor_entry_id: myBoatId,
  protestee_entry_ids: [otherBoatId],
  rule_infringed: 'RRS 10',
  description: 'On port tack, failed to keep clear...',
  hail_given: true,
  red_flag_displayed: true,
  informed_protestee: true,
});
```

### Scheduling a Hearing

```typescript
const hearing = await protestService.scheduleHearing({
  protest_id: protestId,
  regatta_id: regattaId,
  scheduled_time: new Date('2024-06-15T14:00:00'),
  room_name: 'Protest Room A',
  room_location: 'Clubhouse 2nd Floor',
});

// Assign panel
await protestService.assignPanel(hearing.id, [
  { memberId: chairId, role: 'chair' },
  { memberId: member1Id, role: 'member' },
  { memberId: member2Id, role: 'member' },
]);
```

### Conducting a Hearing

```typescript
// Start hearing
await protestService.startHearing(hearingId);

// Record testimony
await protestService.recordTestimony(witnessId, 'Summary of what witness said...');

// End hearing
await protestService.endHearing(hearingId);
```

### Entering a Decision

```typescript
const decision = await protestService.enterDecision(protestId, hearingId, {
  decision_type: 'protest_upheld',
  facts_found: 'Boat A was on starboard tack...',
  conclusions: 'Boat B failed to keep clear as required by RRS 10...',
  rules_applied: ['RRS 10', 'RRS 14'],
  penalty_type: 'dsq',
  penalty_details: 'Disqualified from Race 3',
  affected_entry_ids: [protesteeEntryId],
});

// Sign the decision
await protestService.signDecision(decision.id);
```

### Generating Decision Document

```typescript
const documentText = protestService.generateDecisionDocument(protest, decision, panel);
```

## Time Limits

- **Default protest deadline**: 90 minutes after race finish
- **Appeal deadline**: 24 hours after decision
- Auto-validation of time limits on filing
- Time limit extension requires manual waiver

## RLS Policies

| Table | Read | Write |
|-------|------|-------|
| race_protests | Participants (their own), Staff | Participants (file), Staff (manage) |
| protest_hearings | Participants (their protests), Staff | Staff |
| protest_committee_members | Staff | Admin, Race Officer |
| protest_evidence | Participants (their protests), Staff | Participants, Staff |
| protest_witnesses | Staff | Staff |
| protest_decisions | Public (signed), Staff | Staff |
| hearing_rooms | Staff | Staff |

## Database Triggers

### Auto-generate Protest Numbers
```sql
-- Automatically assigns P1, P2, etc. per regatta
```

### Time Limit Validation
```sql
-- Checks if protest is filed within deadline
```

### Apply Decision Penalties
```sql
-- Automatically updates race_results when decision is entered
```

## UI Screens

### Protest Dashboard (`/club/protests/[regattaId]`)
- **Protests Tab**: List of all protests with filtering
- **Hearings Tab**: Scheduled hearings by date
- **Schedule Tab**: Today's timeline view
- **Committee Tab**: Setup and management links

### Protest Filing (`/club/protests/file/[regattaId]`)
- Step 1: Type & Race selection
- Step 2: Parties (protestor/protestee)
- Step 3: Incident details & actions taken

### Hearing Room (`/club/protests/hearing/[hearingId]`)
- **Overview Tab**: Protest summary, panel, status
- **Evidence Tab**: All submitted evidence
- **Witnesses Tab**: Witness list with testimony
- **Decision Tab**: Enter/view decision

## Future Enhancements

- [ ] Diagram drawing tool
- [ ] Video evidence playback
- [ ] GPS track overlay
- [ ] Appeal workflow
- [ ] US Sailing integration
- [ ] Decision templates
- [ ] Statistics and analytics
- [ ] Email notifications

