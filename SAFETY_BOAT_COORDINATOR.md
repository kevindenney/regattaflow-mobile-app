# Safety Boat Coordinator

## Overview

The Safety Boat Coordinator provides comprehensive safety coverage management for race day operations. It enables race committees to track rescue boats, manage crew assignments, log incidents, and maintain communication with safety personnel.

## Features

### 🚤 Safety Fleet Management

- **Boat Roster**: Register and manage safety boats with equipment details
- **Position Assignment**: Assign boats to course positions (marks, start line, etc.)
- **Status Tracking**: Real-time status (deployed, standby, responding, off duty)
- **Equipment Tracking**: VHF radio, first aid kit, tow lines, anchor

### 👥 Crew Management

- **Crew Assignments**: Assign crew members to safety boats
- **Role Types**: Driver, crew, first aid, rescue swimmer
- **Certifications**: Track powerboat, first aid, rescue certifications
- **Check-in/out**: Track crew attendance and duty hours

### 📻 Radio Communications

- **Radio Check Log**: Record communication status with each boat
- **Signal Quality**: Track excellent/good/fair/poor reception
- **Check All**: Perform radio check across entire fleet
- **Channel Tracking**: VHF channel assignments per boat

### 🆘 Incident Reporting

- **Quick Reporting**: Fast incident entry with type selection
- **Incident Types**: Capsize, collision, MOB, medical, tow request, etc.
- **Severity Levels**: Minor, moderate, serious, critical
- **Response Tracking**: Assign responders, track response time
- **Resolution**: Record actions taken and outcome

### 📊 Dashboard & Analytics

- **Coverage Status**: Real-time readiness indicator (green/yellow/red)
- **Position Coverage**: Track required vs. covered positions
- **Incident Summary**: Total, open, resolved, with injuries
- **Response Time**: Average response time tracking

### 📋 Debrief & Reporting

- **Day Summary**: Boats used, incidents, crew hours
- **Debrief Checklist**: End-of-day review items
- **Report Generation**: Export daily safety report

## Database Schema

### Tables

```sql
-- Safety boat roster
safety_boats (
  id, club_id, name, boat_number, boat_type,
  registration_number, hull_color, max_persons,
  has_vhf, vhf_channel, has_first_aid, has_tow_line, has_anchor,
  equipment_notes, status, notes, is_active
)

-- Standard positions around the course
safety_positions (
  id, club_id, name, code, position_type,
  description, latitude, longitude,
  priority, required_for_racing, sort_order
)

-- Boat assignments to positions for a regatta
safety_assignments (
  id, regatta_id, boat_id, position_id,
  custom_position_name, assignment_date,
  start_time, end_time, status,
  deployed_at, returned_at, notes
)

-- Crew members on safety boats
safety_crew (
  id, assignment_id, user_id, name, role,
  phone, vhf_callsign,
  powerboat_certified, first_aid_certified, rescue_certified,
  checked_in, checked_in_at, checked_out_at
)

-- Radio communication log
safety_radio_checks (
  id, assignment_id, check_time, initiated_by,
  status, signal_quality, notes, checked_by
)

-- Incident reports
safety_incidents (
  id, regatta_id, incident_number,
  reported_at, incident_time, resolved_at,
  location, latitude, longitude, near_mark,
  incident_type, severity,
  race_entry_ids, sail_numbers,
  responding_boat_id, responding_assignment_id, response_time_seconds,
  description, actions_taken, outcome,
  injuries_reported, injury_details, medical_attention_required,
  equipment_damage, equipment_lost,
  status, reported_by, reported_by_name,
  log_entry_id  -- Links to committee boat log
)
```

### Views

```sql
-- Real-time safety dashboard data
safety_dashboard (
  regatta_id, assignment_date,
  boat_id, boat_name, boat_number, boat_type, vhf_channel,
  assignment_id, assignment_status,
  position_name, position_code, position_type,
  deployed_at, returned_at,
  crew, recent_radio_checks, last_radio_status
)

-- Incident statistics summary
incident_summary (
  regatta_id, total_incidents,
  open_incidents, in_progress, resolved,
  critical_count, serious_count,
  with_injuries, medical_required,
  avg_response_seconds
)
```

### Auto-Logging Triggers

1. **Incident Creation** → Creates committee boat log entry with severity emoji
2. **Incident Resolution** → Logs resolution with outcome and actions taken

## Service Methods

### Boat Management
- `getBoats(clubId)` - Get all safety boats for a club
- `createBoat(boat)` - Register a new safety boat
- `updateBoat(boatId, updates)` - Update boat details
- `getAvailableBoats(clubId, date)` - Get boats available for assignment

### Assignment Management
- `getAssignments(regattaId, date)` - Get assignments for a day
- `createAssignment(assignment)` - Create boat assignment
- `updateAssignmentStatus(id, status)` - Update status
- `deployBoat(assignmentId)` - Deploy a boat
- `markResponding(assignmentId)` - Mark as responding to incident
- `returnToStation(assignmentId)` - Return to standby
- `endAssignment(assignmentId)` - End duty for the day

### Crew Management
- `addCrew(crew)` - Add crew member to assignment
- `updateCrew(crewId, updates)` - Update crew details
- `checkInCrew(crewId)` - Check in crew member
- `checkOutCrew(crewId)` - Check out crew member

### Radio Communications
- `recordRadioCheck(check)` - Record a radio check
- `quickRadioCheck(assignmentId, quality)` - Quick successful check
- `recordNoContact(assignmentId, notes)` - Record failed contact
- `checkAllBoats(regattaId)` - Perform fleet-wide radio check

### Incident Management
- `getIncidents(regattaId)` - Get all incidents
- `getOpenIncidents(regattaId)` - Get active incidents
- `reportIncident(incident)` - Create new incident
- `quickReport(regattaId, type, description, options)` - Quick incident report
- `assignResponder(incidentId, assignmentId)` - Assign responder
- `resolveIncident(incidentId, outcome, actions)` - Close incident
- `recordInjury(incidentId, details, medicalRequired)` - Record injury

### Dashboard & Analytics
- `getDashboard(regattaId)` - Get dashboard data
- `getIncidentSummary(regattaId)` - Get incident statistics
- `getCoverageStatus(regattaId)` - Get coverage readiness
- `generateDebrief(regattaId, date)` - Generate day summary

## UI Components

### Safety Dashboard (`/club/safety/[regattaId]`)

**Tabs:**
1. **Fleet** - Boat assignments with status controls
2. **Incidents** - Active incidents with response management
3. **Radio** - Communication status and check log
4. **Debrief** - Day summary and checklist

**Features:**
- Readiness indicator (green/yellow/red)
- Quick action buttons (Assign Boat, Report Incident)
- Real-time status updates
- Vibration alerts for critical actions

### Modals

1. **Assign Boat Modal** - Select available boat for assignment
2. **Report Incident Modal** - Type, severity, details form
3. **Add Crew Modal** - Name, role, certifications

## Integration Points

### Committee Boat Log
- All incidents automatically logged with severity-based emoji
- Resolution events logged with outcome
- Links maintained between incident and log entry

### Race Management
- Incidents can reference race entries by ID
- Sail numbers linked for quick identification

## Position Types

| Type | Example |
|------|---------|
| mark | Windward Mark, Leeward Mark |
| start_line | Start/Finish Line, Pin End |
| gate | Leeward Gate |
| course | Mid-Course |
| shore | Shore Support |
| roving | Mobile Coverage |

## Incident Types

| Type | Icon | Use Case |
|------|------|----------|
| capsize | ⛵ | Boat overturned |
| dismasting | 🔧 | Mast failure |
| collision | 💥 | Boat-to-boat contact |
| man_overboard | 🆘 | Person in water |
| medical | 🏥 | Injury or illness |
| equipment_failure | ⚠️ | Gear malfunction |
| grounding | 🏝️ | Boat aground |
| tow_request | 🚤 | Needs tow assistance |
| retirement | 🏁 | Voluntary withdrawal |
| search | 🔍 | Missing boat/person |
| other | 📋 | Other incident |

## Severity Levels

| Level | Color | Description |
|-------|-------|-------------|
| Minor | Green | Quick resolution, no injury |
| Moderate | Yellow | Some assistance needed |
| Serious | Orange | Significant intervention |
| Critical | Red | Emergency, may need external help |

## Assignment Status Flow

```
assigned → deployed → responding → standby → off_duty
    ↓                      ↓
    └──────────────────────┘
         (can cycle)
```

## Usage Example

```typescript
import safetyBoatService from '../services/SafetyBoatService';

// Assign a safety boat
const assignment = await safetyBoatService.createAssignment({
  regatta_id: 'regatta-123',
  boat_id: 'boat-456',
  position_id: 'position-789',
  assignment_date: '2025-12-02',
});

// Deploy the boat
await safetyBoatService.deployBoat(assignment.id);

// Report an incident
const incident = await safetyBoatService.quickReport(
  'regatta-123',
  'capsize',
  'Single-handed dinghy capsized near mark 2',
  { sailNumbers: ['12345'], location: 'Near Mark 2', severity: 'minor' }
);

// Assign responder
await safetyBoatService.assignResponder(incident.id, assignment.id);

// Resolve incident
await safetyBoatService.resolveIncident(
  incident.id,
  'resumed_racing',
  'Boat righted, sailor OK, continued racing'
);
```

## Navigation

```
Race Committee Console
        ↓
   /club/safety/[regattaId]
        ↓
   Fleet | Incidents | Radio | Debrief
```

## File Structure

```
migrations/
  20251202_safety_boat_coordinator.sql

services/
  SafetyBoatService.ts

app/club/safety/
  _layout.tsx
  [regattaId].tsx
```

