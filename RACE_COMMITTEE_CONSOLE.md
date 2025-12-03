# Race Committee Console

A professional-grade race management interface for PROs and race committee members.

## Features

### 1. Start Sequence Timer

- **Configurable Sequences**: 5-minute or 3-minute start sequences
- **Visual Countdown**: Large timer display with color coding
  - White: Normal countdown
  - Yellow: Last minute warning
  - Red: Last 10 seconds
- **Automatic Sound Signals**:
  - Warning signal at sequence start
  - Preparatory signal at -4 min (5-min) or -2 min (3-min)
  - One minute signal
  - Start signal (longer horn)
  - Beeps for last 10 seconds
- **Vibration Feedback**: Haptic feedback on mobile devices
- **Pulse Animation**: Timer pulses during countdown

### 2. Finish Line Recording

- **Quick-Tap Interface**: Large buttons for each boat
- **Sail Number Search**: Filter boats by sail number or name
- **Auto-Positioning**: Automatic position assignment
- **Elapsed Time Calculation**: From start to finish
- **Recent Finishes Display**: Shows last 5 finishes
- **Status Codes**: DNF, DNS, OCS, DSQ, RET, BFD

### 3. Signal Flags Board

- **All Standard Flags**: AP, N, 1st Sub, I, Z, U, Black, S, L, M, Y, C
- **Visual Indicators**: Color-coded flag cards
- **Active Flag Display**: Shows currently displayed flags
- **Course Designation**: Enter and signal course (e.g., W3)
- **Sound on Display**: Horn sounds when flags are displayed

### 4. Announcements

- **Quick Messages**: Pre-defined common announcements
- **Custom Messages**: Free-form text input
- **Priority Levels**: Normal, Important, Urgent
- **Broadcast to Competitors**: Publishes to race notices

### 5. Results View

- **Live Results**: Real-time standings
- **Position Highlighting**: Gold/Silver/Bronze for top 3
- **Statistics**: Finished/Racing counts

## Navigation

Access the console at:

```
/race-committee/console?regattaId={regattaId}
```

Or from the existing race control:

```
/club/race/control/{regattaId}
```

## Database Tables

Created in `migrations/20251202_race_committee_tables.sql`:

| Table | Purpose |
|-------|---------|
| `race_start_sequences` | Start sequence tracking |
| `race_flags` | Signal flag history |
| `race_course_signals` | Course designations |
| `race_ocs_tracking` | OCS/BFD/UFD violations |
| `race_protests` | Formal protests |
| `race_finish_records` | Detailed finish records |

## Sound Requirements

The console uses web audio for horn signals. For a custom sound:

1. Add `horn.mp3` to `/assets/sounds/`
2. Update the `playHorn` function to use local file

Currently uses a fallback web URL for audio.

## Real-Time Updates

The console subscribes to Supabase real-time for:
- Race results changes
- Start sequence updates

## Permissions

Required club roles:
- `admin`
- `race_officer`
- `race_committee`

## Usage Tips

### Starting a Race

1. Navigate to Timer tab
2. Select sequence type (5 or 3 min)
3. Tap "Start Sequence"
4. Signals play automatically
5. Race starts when countdown reaches 0

### Recording Finishes

1. Navigate to Finishes tab during racing
2. Search or scroll to find boat
3. Tap the boat tile to record finish
4. Position assigned automatically
5. Assign status codes if needed (DNF, etc.)

### Signaling Course

1. Navigate to Signals tab
2. Enter course designation (e.g., "W3")
3. Tap "Signal" button
4. Course is recorded and displayed

### Handling Recalls

During countdown:
- **Postpone**: Displays AP flag
- **General Recall**: Displays 1st Substitute

## Mobile Optimization

- Large touch targets for on-water use
- Vibration feedback when sound unavailable
- Landscape support for wider displays
- Works offline (with sync when connected)

## Future Enhancements

- [ ] Photo/video finish integration
- [ ] Transponder integration (for clubs with equipment)
- [ ] Multi-class start sequences
- [ ] Automatic OCS detection with GPS
- [ ] Results export to CSV/PDF
- [ ] SMS/Push notifications to competitors

