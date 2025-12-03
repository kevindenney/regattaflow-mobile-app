# Course Signal Board

## Overview

The Course Signal Board provides a full-screen visual display for the race committee signal boat. It shows current race flags, countdown timer, and integrates horn signals for the start sequence.

## Features

### 🚩 Flag Display

- **Class Flag** - Fleet-specific color-coded flag
- **Preparatory Flags** - P, I, Z, U, Black flag
- **Signal Flags** - AP (postpone), N (abandon), X (individual recall)
- **General Recall** - First Substitute flag
- **Committee Flag** - Orange flag always displayed

### ⏱️ Start Sequence Timer

- **5-Minute Sequence** - Standard RRS start
- **3-Minute Sequence** - Short course option
- **Phase Display** - Warning, Preparatory, One Minute, Start
- **Large Countdown** - Easily visible from distance

### 🔊 Horn Signals

- **Automatic Horns** - At signal transitions
- **Manual Horn** - Large button for additional signals
- **Countdown Indicator** - Shows seconds until next horn
- **Vibration Feedback** - Haptic confirmation

### 📱 Display Modes

- **Full Screen** - Maximized flag visibility
- **Dark Mode** - For low-light conditions
- **Tap to Toggle** - Show/hide control panel

## Start Sequence

```
5:00  ─┬─  WARNING         Class flag UP + Horn
       │
4:00  ─┼─  PREPARATORY     Prep flag UP + Horn
       │
1:00  ─┼─  ONE MINUTE      Prep flag DOWN + Horn
       │
0:00  ─┴─  START           Class flag DOWN + Horn
```

## Flags Supported

### Signal Flags

| Code | Name | Meaning |
|------|------|---------|
| P | Papa | Preparatory Signal |
| I | India | Round-an-end Rule |
| Z | Zulu | 20% Penalty Rule |
| U | Uniform | UFD Rule |
| BLACK | Black Flag | Black Flag Rule |
| AP | Answering Pennant | Races Postponed |
| N | November | Races Abandoned |
| 1st SUB | First Substitute | General Recall |
| X | X-Ray | Individual Recall |
| Y | Yankee | Life Jackets Required |
| S | Sierra | Shortened Course |
| L | Lima | Come Within Hail |

### Class Flags

Pre-configured colors for common classes:
- J/70 (Red)
- Laser (Green)
- 420 (Blue)
- Optimist (Yellow)
- Flying Scot (Purple)

## UI Layout

```
┌─────────────────────────────────────┐
│                                     │
│        [ WARNING SIGNAL ]           │  ← Phase indicator
│                                     │
│            4:32                     │  ← Large countdown
│        🔊 Horn in: 28s             │  ← Horn countdown
│                                     │
│   ┌─────┐  ┌─────┐  ┌─────┐       │
│   │J/70 │  │  P  │  │COMM │       │  ← Flags
│   └─────┘  └─────┘  └─────┘       │
│                                     │
│         J/70 Fleet                  │  ← Class name
│                                     │
│    "Tap anywhere to show controls"  │
│                                     │
├─────────────────────────────────────┤
│  [5 Min] [3 Min] [Stop]            │  ← Start controls
│  [AP] [N] [1st] [X]                │  ← Signal flags
│  [P] [I] [Z] [U] [BLK] [Y] [S]     │  ← Prep flags
│  [══════ SOUND HORN ══════]        │  ← Manual horn
└─────────────────────────────────────┘
```

## Control Panel

### Start Sequence
- **5 Min Start** - Begin 5-minute sequence
- **3 Min Start** - Begin 3-minute sequence
- **Stop** - Cancel current sequence

### Quick Signals
- **AP** - Postpone races
- **N** - Abandon races
- **1st** - General recall (2 horns)
- **X** - Individual recall (1 horn)

### Preparatory Flags
Toggle individual flags:
- P, I, Z, U, Black, Y, S

### Manual Horn
Large button for additional horn signals

## Usage

### Basic Start Sequence

1. Open Signal Board
2. Tap screen to show controls
3. Press "5 Min Start"
4. Flags and timer automatically manage the sequence
5. Horns sound at each signal change

### Postponement

1. Press "AP" button
2. All other signals clear
3. AP flag displays
4. Horn sounds

### General Recall

1. Press "1st" button
2. First Substitute flag displays
3. Two horn signals
4. Timer stops

### Individual Recall

1. Press "X" button during start
2. X flag displays
3. One horn signal
4. Continue with sequence

## Display Features

### Dark Mode
- Toggle via moon/sun icon
- Dark background for night sailing
- Reduced glare on water

### Full Screen
- Tap anywhere to toggle controls
- Maximum flag visibility
- Large timer display

### Horn Countdown
- Appears in last 10 seconds of each minute
- Red indicator with seconds remaining
- Visual and haptic alert

## Navigation

```
Race Committee Console
        ↓
  /race-committee/signal-board
        ↓
   Full Screen Display
        ↓
   Tap → Control Panel
```

## File Structure

```
app/race-committee/
  signal-board.tsx    ← Main component
```

## Integration Points

### Start Scheduler
- Can receive class/fleet info via params
- Syncs with multi-class start scheduler

### Race Committee Console
- Accessible from console menu
- Shares race state

### Committee Boat Log
- Signal changes can be logged
- Horn signals tracked

## Class Configuration

Pass class name via URL params:

```
/race-committee/signal-board?className=J/70
```

Default classes with colors:
```typescript
const CLASS_COLORS = {
  'J/70': { bg: '#DC143C', text: '#FFFFFF' },
  'Laser': { bg: '#00FF00', text: '#000000' },
  '420': { bg: '#0047AB', text: '#FFFFFF' },
  'Optimist': { bg: '#FFD700', text: '#000000' },
  'Flying Scot': { bg: '#800080', text: '#FFFFFF' },
};
```

## Best Practices

1. **Position tablet** where visible to competitors
2. **Use dark mode** to reduce glare
3. **Test horn sounds** before racing
4. **Keep controls hidden** during sequence for clean display
5. **Use full screen** for maximum visibility

