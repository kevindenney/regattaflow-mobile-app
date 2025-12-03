# Competitor Dashboard

## Overview

The Competitor Dashboard provides a personal command center for sailors, transforming them from passive participants to engaged users with full visibility into their racing career.

## Features

### 📊 My Racing Stats

- **Total Races**: Lifetime race count
- **Podiums**: 1st, 2nd, 3rd place finishes
- **Wins**: First place count
- **Average Finish**: Mean finish position
- **This Year**: Current year statistics
- **Recent Form**: Last 10 races average

### 📅 My Races (Upcoming)

- **Race Schedule**: All registered upcoming races
- **Check-In Status**: Shows if checked in or pending
- **Quick Check-In**: One-tap check-in button
- **Regatta Details**: Venue, date, time
- **Countdown**: Days until next race

### 🏆 My Results (History)

- **Complete History**: All race results
- **Position Display**: Medal emojis for podiums
- **Points Tracking**: Score per race
- **Filter Options**: By year, class, club
- **Performance Metrics**: Best finish, recent form

### ⛵ My Boats

- **Boat Profiles**: Multiple boats supported
- **Primary Boat**: Quick selection for entries
- **Handicap Ratings**: PHRF, IRC, ORC tracking
- **Certificate Management**: Expiry date tracking
- **Ownership Types**: Owner, co-owner, charter, crew

### 🔔 Alerts & Notifications

- **Results Posted**: When your results are available
- **Protest Filed**: If protested against
- **Check-In Reminder**: Deadline approaching
- **Schedule Changes**: Postponements, abandonments
- **Weather Alerts**: Conditions warnings
- **Registration**: Open/closing notifications

### ⭐ Favorites

- **Favorite Clubs**: Follow clubs for updates
- **Favorite Regattas**: Track specific events
- **Notification Preferences**: Per-favorite settings

## Database Schema

### Tables

```sql
-- Boats owned/sailed by competitors
competitor_boats (
  id, user_id, name, sail_number, hull_number,
  boat_class, class_association,
  year_built, builder, designer, hull_color,
  ownership_type, -- owner, co_owner, charter, crew
  phrf_rating, phrf_certificate_number, phrf_expiry,
  irc_rating, irc_certificate_number, irc_expiry,
  orc_rating, orc_certificate_number, orc_expiry,
  custom_rating, custom_rating_system,
  measurement_certificate_url, insurance_certificate_url,
  photo_urls, is_active, is_primary, notes
)

-- Notifications for competitors
competitor_alerts (
  id, user_id, alert_type, regatta_id, race_id, club_id,
  title, message, priority, is_read, read_at,
  action_url, push_sent, email_sent, expires_at
)

-- Saved clubs/regattas
competitor_favorites (
  id, user_id, favorite_type, club_id, regatta_id,
  notify_new_events, notify_results, notify_schedule_changes
)
```

### Views

```sql
-- Complete race history with joined data
competitor_race_history (
  result_id, race_id, entry_id, user_id,
  sail_number, boat_name, boat_class,
  finish_position, corrected_position, points, status_code,
  race_name, race_number, scheduled_start,
  regatta_name, regatta_id, club_name, club_id
)

-- Upcoming registered races
competitor_upcoming_races (
  entry_id, user_id, sail_number, boat_name, boat_class,
  entry_status, race_id, race_name, scheduled_start,
  regatta_name, venue, club_name, club_logo,
  check_in_status, checked_in_at
)

-- Aggregated statistics
competitor_statistics (
  user_id, total_races, total_regattas,
  first_places, second_places, third_places, podiums,
  dnf_count, dsq_count, dns_count, ocs_count,
  avg_finish, best_finish,
  races_this_year, podiums_this_year,
  recent_avg_finish
)
```

### Functions

```sql
-- Get standings in active series
get_competitor_series_standings(user_id) 
  → series_id, series_name, position, total_entries, points, races_sailed, races_remaining

-- Send alert to a competitor
send_competitor_alert(user_id, type, title, message, ...)
  → alert_id
```

### Auto-Alert Triggers

1. **Results Posted** → Alert sent when race_results row inserted
2. **Protest Filed** → Alert sent when race_protests targets competitor

## Service Methods

### Boat Management
- `getMyBoats()` - Get all user's boats
- `getBoat(boatId)` - Get single boat
- `addBoat(boat)` - Add new boat
- `updateBoat(boatId, updates)` - Update boat
- `deleteBoat(boatId)` - Soft delete boat
- `setPrimaryBoat(boatId)` - Set as primary
- `updateRating(boatId, type, rating, cert, expiry)` - Update handicap

### Race History
- `getRaceHistory(options)` - Get results with filters
- `getUpcomingRaces()` - Get registered future races
- `getStats()` - Get aggregated statistics
- `getSeriesStandings()` - Get active series positions

### Alerts
- `getAlerts(options)` - Get alerts with filters
- `getUnreadCount()` - Count unread alerts
- `markAlertRead(alertId)` - Mark as read
- `markAllAlertsRead()` - Mark all read
- `deleteAlert(alertId)` - Delete alert

### Favorites
- `getFavorites()` - Get all favorites
- `favoriteClub(clubId)` - Add club to favorites
- `favoriteRegatta(regattaId)` - Add regatta to favorites
- `removeFavorite(favoriteId)` - Remove favorite
- `updateFavoriteSettings(id, settings)` - Update notifications

### Dashboard
- `getDashboardData()` - Get all dashboard data in one call

### Performance Analysis
- `getPerformanceByClass()` - Stats grouped by boat class
- `getPerformanceTrend(races)` - Recent performance trend

## UI Components

### Main Dashboard (`/competitor/dashboard`)

**5 Tabs:**

| Tab | Content |
|-----|---------|
| 🏠 **Home** | Stats summary, next race, active series, recent results |
| 🏁 **Races** | Upcoming registered races with check-in |
| 🏆 **Results** | Complete race history with performance card |
| ⛵ **Boats** | Boat profiles with ratings |
| 🔔 **Alerts** | All notifications |

### Add/Edit Boat (`/competitor/boats/add`)

- Basic info: name, sail number, class
- Details: hull number, year, builder, color
- Ownership selection
- Handicap ratings (PHRF, IRC, ORC)
- Certificate tracking

## Alert Types

| Type | Trigger | Priority |
|------|---------|----------|
| race_reminder | Scheduled | Normal |
| results_posted | Results inserted | High (if podium) |
| schedule_change | Event updated | Normal |
| recall | Race recall | Urgent |
| postponement | Race postponed | Normal |
| abandonment | Race abandoned | High |
| protest_filed | Protest targets you | Urgent |
| protest_hearing | Hearing scheduled | High |
| protest_decision | Decision made | High |
| check_in_reminder | Deadline approaching | Normal |
| registration_open | New event | Normal |
| registration_closing | Closing soon | Normal |
| weather_alert | Weather warning | High |
| notice_posted | New notice | Low |
| standings_update | Series updated | Normal |

## User Journey Completion

```
Before (Passive):
├── Find events → ✅ Public pages
├── Register → ✅ Event registration
├── Check in → ✅ QR check-in
├── Race → (on the water)
├── View results → ✅ Public results
└── Track progress → ❌ No dashboard

After (Active Command Center):
├── Find events → ✅ Public pages + Favorites
├── Register → ✅ Event registration
├── Check in → ✅ QR check-in + Dashboard reminder
├── Race → (on the water)
├── View results → ✅ Personal results + Stats
├── Track progress → ✅ Full dashboard
├── Manage boats → ✅ Boat profiles + Ratings
└── Stay informed → ✅ Alerts + Notifications
```

## Usage Example

```typescript
import competitorService from '../services/CompetitorService';

// Get dashboard data
const dashboard = await competitorService.getDashboardData();
console.log(`You have ${dashboard.upcomingRaces.length} upcoming races`);
console.log(`Your stats: ${dashboard.stats?.podiums} podiums`);

// Add a boat
const boat = await competitorService.addBoat({
  name: 'Sea Breeze',
  sail_number: 'USA 12345',
  boat_class: 'J/70',
  ownership_type: 'owner',
  phrf_rating: 108,
});

// Set as primary
await competitorService.setPrimaryBoat(boat.id);

// Check alerts
const unreadCount = await competitorService.getUnreadCount();
if (unreadCount > 0) {
  const alerts = await competitorService.getAlerts({ unreadOnly: true });
  // Show alerts...
  await competitorService.markAllAlertsRead();
}
```

## Navigation

```
Tab Bar
  └── Competitor Dashboard (/competitor/dashboard)
        ├── Home Tab
        │     ├── Stats Summary
        │     ├── Next Race Card
        │     ├── Active Series
        │     └── Recent Results
        ├── Races Tab
        │     └── Upcoming Race Cards (with check-in)
        ├── Results Tab
        │     ├── Performance Card
        │     └── Race History List
        ├── Boats Tab
        │     ├── Boat Cards
        │     └── Add Boat → /competitor/boats/add
        └── Alerts Tab
              └── Alert Cards (with unread indicator)
```

## File Structure

```
migrations/
  20251202_competitor_dashboard.sql

services/
  CompetitorService.ts

app/competitor/
  _layout.tsx
  dashboard.tsx
  boats/
    _layout.tsx
    add.tsx
    [id].tsx (future)
```

## Integration Points

### Check-In System
- Dashboard shows check-in status
- Quick check-in button on race cards

### Results System
- Results automatically appear in history
- Alerts triggered when results posted

### Protest System
- Alerts sent when protested against
- Links to protest details

### Scoring System
- Series standings shown in dashboard
- Points displayed per race

