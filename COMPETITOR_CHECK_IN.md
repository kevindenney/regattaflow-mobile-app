# Competitor Check-In System

## Overview

The Competitor Check-In system completes the race-day operations pipeline by tracking which boats are ready to race before the start. It supports multiple check-in methods and automatically handles DNS (Did Not Start) entries.

## Complete Race-Day Pipeline

```
Check-In → Start → Finish → Score → Publish
    ↓
Auto-DNS for no-shows
```

## Features

### 📋 Pre-Race Roster
- View all registered entries for each race
- Filter by status (pending, checked in, scratched, DNS)
- Search by sail number, boat name, or skipper
- Group by division or class

### ✅ Quick-Tap Check-In
- One-tap check-in for race officers
- Batch check-in for multiple boats
- Undo capability for mistakes
- Visual status indicators

### 📱 QR Code Self-Check-In
- Auto-generated unique QR codes per race
- Shareable check-in links
- GPS location capture (optional)
- Works on mobile devices

### ⏰ Check-In Deadline
- Configurable check-in window
- Countdown timer display
- Late check-in tracking
- Warning notifications

### 🚫 Auto-DNS on Race Start
- Automatic DNS marking for no-shows
- Integrates with scoring system
- Database trigger for reliability
- Manual override available

### 📊 Fleet Status Dashboard
- Real-time check-in progress
- Breakdown by division/class
- Percentage visualization
- Live updates via Supabase Realtime

## Architecture

### Files

```
services/
└── CheckInService.ts              # Check-in operations

app/club/check-in/
├── _layout.tsx                    # Route layout
└── [raceId].tsx                   # Check-in dashboard

app/check-in/
├── _layout.tsx                    # Public route layout
└── [token].tsx                    # Self check-in page

migrations/
└── 20251202_competitor_check_in.sql
```

### Database Schema

#### `race_check_ins`
- `status` - pending/checked_in/late/scratched/dns_auto/dns_manual
- `checked_in_at` - Timestamp of check-in
- `checked_in_by` - User who checked them in
- `check_in_method` - manual/self_qr/self_app/radio/visual
- `latitude`, `longitude` - GPS location (optional)
- `scratch_reason` - Reason if withdrawn

#### `regatta_races` (Extended)
- `check_in_enabled` - Whether check-in required
- `check_in_opens_at` - When check-in opens
- `check_in_closes_at` - Deadline (usually race start)
- `auto_dns_on_start` - Auto-mark DNS on start
- `self_check_in_enabled` - Allow QR code check-in
- `check_in_qr_token` - Unique token for QR codes

#### `check_in_notifications`
- Tracks reminders and warnings sent
- Prevents duplicate notifications

#### `race_check_in_summary` (View)
- Aggregate statistics per race
- Total, checked in, pending, DNS counts
- Check-in percentage

### Database Triggers

| Trigger | Action |
|---------|--------|
| `create_check_in_records` | Auto-creates pending records for all entries |
| `generate_check_in_qr_token` | Auto-generates QR token when self-check-in enabled |
| `auto_dns_on_race_start` | Marks pending entries as DNS when race starts |

## Usage

### Check In a Competitor

```typescript
import { checkInService } from '@/services/CheckInService';

// Single check-in
await checkInService.checkIn(regattaId, raceNumber, entryId, {
  method: 'manual',
  location: 'Committee Boat',
});

// Batch check-in
const count = await checkInService.batchCheckIn(
  regattaId, 
  raceNumber, 
  entryIds
);
```

### Self Check-In (via QR code)

```typescript
// Competitor scans QR code and calls:
await checkInService.selfCheckIn(qrToken, entryId, {
  latitude: 37.7749,
  longitude: -122.4194,
});
```

### Get Fleet Status

```typescript
const status = await checkInService.getFleetStatus(regattaId, raceNumber);
// Returns:
// {
//   total: 45,
//   checkedIn: 38,
//   pending: 5,
//   scratched: 1,
//   dns: 1,
//   percentage: 84,
//   byDivision: { ... },
//   byClass: { ... }
// }
```

### Scratch/Withdraw

```typescript
await checkInService.scratch(regattaId, raceNumber, entryId, 'Equipment failure');
```

### Generate QR Code URL

```typescript
const url = checkInService.getQRCodeUrl(qrToken);
// Returns: https://regattaflow.com/check-in/{token}
```

### Real-Time Updates

```typescript
// Subscribe to check-in changes
checkInService.subscribeToCheckIns(regattaId, raceNumber, (checkIn) => {
  console.log('Check-in updated:', checkIn);
});

// Unsubscribe when done
checkInService.unsubscribeFromCheckIns(regattaId, raceNumber);
```

## UI Screens

### Check-In Dashboard (`/club/check-in/[raceId]`)

**Tabs:**
1. **Roster** - Full entry list with search and filters
2. **Pending** - Quick view of boats not checked in (tap to check in)
3. **Status** - Visual fleet status with breakdowns

**Features:**
- Quick stats bar (Ready/Pending/Total)
- Check-in deadline countdown
- QR code modal for sharing
- Real-time updates

### Self Check-In Page (`/check-in/[token]`)

**Features:**
- Validates QR token
- Shows user's entries for that regatta
- One-tap check-in
- GPS location capture
- Deadline warning
- Success confirmation

## Check-In Methods

| Method | Description | Who Uses |
|--------|-------------|----------|
| `manual` | Race officer taps check-in | Race Committee |
| `self_qr` | Scanned QR code | Competitors |
| `self_app` | In-app check-in | Competitors |
| `radio` | Via radio communication | On-water |
| `visual` | Visual confirmation | Race Committee |

## Status Flow

```
pending → checked_in (or late if past deadline)
pending → scratched (voluntary withdrawal)
pending → dns_auto (race started without check-in)
pending → dns_manual (manually marked DNS)
checked_in → pending (undo check-in)
```

## RLS Policies

| Action | Who |
|--------|-----|
| View check-ins | Competitors (own), Staff (all) |
| Update check-ins | Competitors (self check-in), Staff |
| Manage config | Admin, Race Officers |

## Integration Points

### Scoring Engine
- DNS entries receive penalty points
- Auto-DNS integrates with race results

### Race Committee Console
- Check-in status visible before start
- DNS count in race summary

### Notifications
- Reminder notifications before deadline
- DNS notice after race start

## Configuration Options

```typescript
interface RaceCheckInConfig {
  check_in_enabled: boolean;      // Require check-in
  check_in_opens_at: Date | null; // When check-in opens
  check_in_closes_at: Date | null;// Deadline (usually race start)
  auto_dns_on_start: boolean;     // Auto-mark DNS
  self_check_in_enabled: boolean; // Allow QR code check-in
}
```

## Future Enhancements

- [ ] Push notifications for reminders
- [ ] SMS check-in option
- [ ] Transponder integration
- [ ] Photo check-in (visual confirmation)
- [ ] Fleet stats analytics
- [ ] Historical check-in data
- [ ] Late arrival predictions

