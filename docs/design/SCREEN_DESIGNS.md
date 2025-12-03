# RegattaFlow Screen Designs

## Table of Contents
1. [Design Principles](#design-principles)
2. [Sailor Persona Screens](#sailor-persona-screens)
3. [Coach Persona Screens](#coach-persona-screens)
4. [Club Persona Screens](#club-persona-screens)
5. [Shared Screens](#shared-screens)
6. [Implementation Guidelines](#implementation-guidelines)

---

## Design Principles

### Core Principles for All Personas

1. **Outdoor First**
   - High contrast (7:1 minimum)
   - Large touch targets (minimum 44x44px iOS, 48x48px Android)
   - Glanceable information - critical data visible without scrolling
   - Works in bright sunlight (no pure white, no low-contrast grays)

2. **Progressive Disclosure**
   - Show 20% of information upfront (the essentials)
   - Reveal 80% on demand (via expand, drill-down, or "Show more")
   - Use collapsible sections, bottom sheets, and modals
   - Never hide critical actions

3. **Action-Oriented**
   - Every screen has ONE clear primary CTA
   - Secondary actions are visually de-emphasized
   - Destructive actions require confirmation
   - Success states show "What's next?"

4. **Scannable**
   - F-pattern layout (important info top-left)
   - Visual hierarchy with size, weight, color
   - Card-based layouts with clear boundaries
   - Icons reinforce meaning, not replace text

5. **Forgiving**
   - Autosave all forms (no manual save required)
   - Draft states for incomplete actions
   - Undo for destructive actions
   - Clear error recovery paths

6. **Fast**
   - Smart defaults (pre-fill forms)
   - One-tap actions for common tasks
   - Minimize keyboard inputs
   - Offline-first (sync when connected)

7. **Consistent**
   - Same patterns across all 3 personas
   - Consistent navigation structure
   - Reusable components from Component Library
   - Familiar interactions (standard platform patterns)

### Persona-Specific Principles

**Sailor (Blue):**
- **Performance-Focused**: Every screen relates to improving race results
- **Data-Rich**: Charts, graphs, and trends prominent
- **Training-Centric**: Emphasis on learning and skill development
- **Social**: Connect with other sailors, coaches, and clubs

**Coach (Purple):**
- **Efficiency First**: Manage multiple clients with minimal taps
- **Mobile Office**: Complete workflows in 30 seconds between sessions
- **Clear Money Trail**: Earnings always transparent
- **Client-Centered**: Every screen answers "How is [Client] progressing?"

**Club (Green):**
- **Mission Control**: Dashboard prioritizes what needs action NOW
- **Delegation-Friendly**: Multiple admins, clear permissions
- **Member-Facing**: Members see schedule/results, admins see operations
- **Event-Centric**: Every feature relates to creating/running/analyzing events

---

## Sailor Persona Screens

### 1. Dashboard / Home Screen

**Purpose**: Quick overview of upcoming races, recent performance, and actionable items.

**Layout:**
```
┌─────────────────────────────────────┐
│ [≡] Dashboard            [🔔][👤]  │ ← Header (56px)
├─────────────────────────────────────┤
│ 🏁 Next Race                        │
│ ┌─────────────────────────────────┐ │
│ │ Winter Championship              │ │
│ │ Royal Hong Kong YC               │ │
│ │ 📅 Dec 20 • ⏰ 10:00 AM         │ │ ← RaceCard component
│ │ 👥 24 participants               │ │
│ │                                  │ │
│ │ [View Details]                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📊 Recent Performance               │
│ ┌───────┬───────┬───────┬───────┐  │
│ │ Races │  Avg  │  Best │ Trend │  │
│ │  12   │  5.3  │  1st  │  ↑8%  │  │ ← DataCard grid (2x2)
│ └───────┴───────┴───────┴───────┘  │
│                                     │
│ ⚡ Quick Actions                    │
│ ┌─────────┐ ┌─────────┐ ┌────────┐│
│ │ Log     │ │ Weather │ │ Find   ││
│ │ Training│ │ Check   │ │ Coach  ││ ← Button grid
│ └─────────┘ └─────────┘ └────────┘│
│                                     │
│ 🎯 Recommendations                  │
│ ┌─────────────────────────────────┐ │
│ │ 💡 Review your last race         │ │
│ │ You haven't analyzed Dec 15 race│ │ ← Actionable card
│ │ [Start Analysis] [Dismiss]      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📅 Upcoming Races (3)               │
│ [View All Races →]                  │
└─────────────────────────────────────┘
```

**Components Used:**
- `Header` with notification badge and avatar
- `RaceCard` for next race (with status badge)
- `DataCard` grid for performance metrics
- `Button` grid for quick actions
- Alert card for recommendations
- `SimpleList` for upcoming races preview

**Interactions:**
- Pull-to-refresh updates data
- Tap race card → Race Details
- Tap quick action → Respective flow
- Swipe dismiss on recommendations
- Tap "View All Races" → Race List

**States:**
- **Empty State** (no upcoming races):
  ```
  🏁 No Upcoming Races
  Browse events near you or create your own race session
  [Find Races] [Create Training Session]
  ```

---

### 2. Race List Screen

**Purpose**: Browse and filter all available races (SOLVES PROBLEM 4).

**Layout:**
```
┌─────────────────────────────────────┐
│ [←] Races                 [🔍][+]  │ ← Header with search & create
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [All] [Upcoming] [Past] [Saved] │ │ ← ChipSelector for filters
│ └─────────────────────────────────┘ │
│                                     │
│ 📍 Near You                         │
│ ┌─────────────────────────────────┐ │
│ │ Winter Championship         LIVE │ │
│ │ Royal Hong Kong YC               │ │
│ │ 📅 Today • ⏰ 2:00 PM           │ │ ← Status: "LIVE" badge
│ │ 👥 24 participants               │ │
│ │ 🌊 15kts SW • ⛅ Partly Cloudy  │ │ ← Weather preview
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Spring Series - Race 3  UPCOMING │ │
│ │ Aberdeen Marina Club             │ │
│ │ 📅 Dec 22 • ⏰ 10:00 AM         │ │
│ │ 👥 18 participants               │ │
│ │ 🌊 12kts E • ☀️ Clear           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📆 This Month                       │
│ ┌─────────────────────────────────┐ │
│ │ New Year Regatta        Dec 28  │ │
│ │ Middle Island Yacht Club         │ │
│ │ 👥 32 participants               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Load More Races]                   │
└─────────────────────────────────────┘
```

**Key Features (PROBLEM 4 SOLUTIONS):**

1. **Visual Hierarchy**: Status badges (LIVE, UPCOMING, COMPLETED) use color and position
2. **Weather at a Glance**: Wind and conditions visible without drilling down
3. **Smart Grouping**: "Near You", "This Month", "Saved" sections
4. **Quick Registration**: Swipe left on race card → [Register] [Save] [Share]
5. **Search & Filter**: Top-right search icon opens filter bottom sheet
6. **Live Updates**: "LIVE" races auto-refresh position

**Filter Bottom Sheet** (when tapped 🔍):
```
┌─────────────────────────────────────┐
│           Filter Races          [X] │
├─────────────────────────────────────┤
│ Date Range                          │
│ ○ All Dates                         │
│ ● This Week                         │
│ ○ This Month                        │
│ ○ Custom Range                      │
│                                     │
│ Distance                            │
│ [―――●―――――――――] 50km                │
│                                     │
│ Boat Class                          │
│ [Laser] [470] [Finn] [Dragon]      │ ← Multi-select chips
│                                     │
│ Event Type                          │
│ ☐ Regattas                          │
│ ☑ Club Races                        │
│ ☐ Training Sessions                 │
│                                     │
│ [Reset]              [Apply (12)]   │
└─────────────────────────────────────┘
```

---

### 3. Race Details Screen

**Purpose**: Complete information about a specific race, with clear registration CTA (SOLVES PROBLEM 4).

**Layout:**
```
┌─────────────────────────────────────┐
│ [←] Race Details            [⋮]    │ ← Header with overflow menu
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │   [Map image or venue photo]    │ │ ← Hero image (160px tall)
│ │   📍 Royal Hong Kong YC          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Winter Championship Series - R1     │ ← H1 title
│ ┌──────────────┐ ┌────────────────┐│
│ │  UPCOMING    │ │  ⭐ Featured   ││ ← Badges
│ └──────────────┘ └────────────────┘│
│                                     │
│ 📅 Details                          │
│ ┌─────────────────────────────────┐ │
│ │ 📆 Saturday, Dec 20, 2025        │ │
│ │ ⏰ First Warning: 10:00 AM       │ │
│ │ 📍 Victoria Harbour               │ │
│ │ ⛵ Classes: Laser, 470, Finn     │ │ ← SimpleList with icons
│ │ 👥 24/50 Registered              │ │
│ │ 💰 $50 Entry Fee                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🌊 Conditions                       │
│ ┌─────────────────────────────────┐ │
│ │ [Wind icon] 12-15 kts SW        │ │
│ │ [Cloud] Partly Cloudy            │ │ ← WeatherCard
│ │ [Waves] 0.5-1m swell             │ │
│ │ Last updated: 2 hours ago        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ℹ️ Description                      │
│ First race of the winter series.    │
│ Olympic-style courses...            │
│ [Read More ↓]                       │ ← Expandable text
│                                     │
│ 👥 Participants (24)                │
│ [Emma Wilson] [Mike Chen] [+22]    │ ← Avatar row, tap → full list
│                                     │
│ 📋 Race Documents                   │
│ • Sailing Instructions (PDF)        │
│ • Notice of Race (PDF)              │ ← Download links
│ • Course Chart (PDF)                │
│                                     │
│ [Register for Race]                 │ ← Primary CTA (fixed bottom)
└─────────────────────────────────────┘
```

**Key Features (PROBLEM 4 SOLUTIONS):**

1. **Hero Image**: Visual context immediately
2. **Status Badge**: UPCOMING/LIVE/COMPLETED prominent at top
3. **Progressive Disclosure**: Description expandable, documents collapsible
4. **Weather Integration**: Live conditions with timestamp
5. **Social Proof**: Participant count and avatars
6. **Clear CTA**: Register button fixed at bottom (always visible)

**Overflow Menu (⋮):**
- Save Race
- Share Race
- Add to Calendar
- Report Issue

**Registration States:**

**Not Registered** → Shows: `[Register for Race]` (Primary button)

**Registered** → Shows:
```
┌─────────────────────────────────────┐
│ ✅ You're Registered                │
│ Boat: USA 12345 (Laser)             │
│ [View Registration] [Withdraw]      │
└─────────────────────────────────────┘
```

**Full / Waitlist** → Shows: `[Join Waitlist]` (Secondary button)

**Past Race** → Shows: `[View Results]` (Primary button)

---

### 4. Create Race Screen (Simplified)

**Purpose**: Quick race creation in 3 steps max (SOLVES PROBLEM 1).

**Step 1: Basic Info** (Single screen, no wizard)
```
┌─────────────────────────────────────┐
│ [X] Create Race             [Save] │ ← Close = save draft
├─────────────────────────────────────┤
│ 📝 Basic Information                │
│                                     │
│ Race Name *                         │
│ [Winter Training Session____]      │ ← Auto-suggest based on date
│                                     │
│ Venue *                             │
│ [Royal Hong Kong Yacht Club_] [📍] │ ← Search + current location
│                                     │
│ Date & Time *                       │
│ [Dec 20, 2025_______] [10:00 AM__] │ ← Date/Time pickers
│                                     │
│ ⛵ Race Format                       │
│ ┌──────────┐ ┌──────────┐          │
│ │ Fleet    │ │ Match    │          │ ← Radio cards
│ │ Racing ● │ │ Racing ○ │          │
│ └──────────┘ └──────────┘          │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                     │
│ 🎯 Optional Details (Tap to expand)│ ← Collapsed by default
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                     │
│ [Create Race]                       │ ← Primary CTA
│ or [Save as Draft]                  │ ← Text link
└─────────────────────────────────────┘
```

**Optional Details Expanded:**
```
│ 🎯 Optional Details                 │
│                                     │
│ Boat Classes (tap to add)           │
│ [Laser] [470] [+]                  │ ← Chip selector
│                                     │
│ Max Participants                    │
│ [50_________________________]       │
│                                     │
│ Entry Fee                           │
│ [$ 50________________________]      │
│                                     │
│ Description                         │
│ [Winter series race 1. Olympic...] │ ← Text area
│                                     │
│ Registration Deadline               │
│ [Dec 19, 2025_______________]       │
│                                     │
│ 📎 Attach Documents                 │
│ [+ Add Notice of Race]              │ ← File upload
│ [+ Add Sailing Instructions]        │
└─────────────────────────────────────┘
```

**Key Features (PROBLEM 1 SOLUTIONS):**

1. **Only 3 Required Fields**: Name, Venue, Date/Time
2. **Smart Defaults**: Race name auto-suggests (e.g., "Saturday Training - Dec 20")
3. **Current Location**: "Use Current Location" pre-fills nearest venue
4. **Progressive Disclosure**: Optional fields collapsed by default
5. **Auto-Save Draft**: Close button = save draft, no explicit "Save Draft" needed
6. **One Screen**: No multi-step wizard unless creating regatta series

**Success State:**
```
┌─────────────────────────────────────┐
│ ✅ Race Created                     │
│                                     │
│ Winter Training Session is now live │
│                                     │
│ [Share with Friends]                │
│ [View Race Details]                 │
└─────────────────────────────────────┘
```

---

### 5. Race Analysis Screen (3-Step Flow)

**Purpose**: Post-race analysis in 3 simple steps (SOLVES PROBLEM 2).

**Step 1: Select Race** (if coming from dashboard)
```
┌─────────────────────────────────────┐
│ [←] Analyze Race                    │
├─────────────────────────────────────┤
│ 📊 Which race would you like to     │
│    analyze?                         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Winter Championship              │ │
│ │ Dec 15, 2025 • 6th Place        │ │ ← Recently completed
│ │ [Analyze] ────────────────────→ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Club Race #5                    │ │
│ │ Dec 8, 2025 • 3rd Place         │ │
│ │ [Analyze] ────────────────────→ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [View All Past Races]               │
└─────────────────────────────────────┘
```

**Step 2: Quick Input** (GPS track auto-loaded if available)
```
┌─────────────────────────────────────┐
│ [←] Winter Championship Analysis    │
├─────────────────────────────────────┤
│ ✅ GPS Track Loaded                 │
│ [View Track on Map ↗]               │
│                                     │
│ 📝 Quick Notes                      │
│                                     │
│ How was the start?                  │
│ ○ Great  ○ Good  ● OK  ○ Poor      │ ← Quick rating
│                                     │
│ Windward leg performance?           │
│ ○ Great  ● Good  ○ OK  ○ Poor      │
│                                     │
│ Key challenge?                      │
│ [Boat speed on reaches_____]        │ ← Text input
│                                     │
│ What would you do differently?      │
│ [Start more aggressively___]        │
│                                     │
│ [Generate AI Analysis]              │ ← Primary CTA
│ or [Skip to Results]                │
└─────────────────────────────────────┘
```

**Step 3: AI Analysis Results**
```
┌─────────────────────────────────────┐
│ [←] Analysis Results          [⋮]  │
├─────────────────────────────────────┤
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                     │
│ 🎯 Overall Score: 7.2/10            │ ← Large, prominent
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                     │
│ 💪 Strengths                        │
│ ┌─────────────────────────────────┐ │
│ │ ✅ Consistent upwind speed       │ │
│ │ ✅ Good tactical positioning     │ │ ← Bulleted list
│ │ ✅ Clean tacks                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🎓 Areas to Improve                 │
│ ┌─────────────────────────────────┐ │
│ │ ⚠️ Start line positioning        │ │
│ │    You were 4th row at gun       │ │
│ │    [Watch Start Tutorial →]      │ │ ← Actionable link
│ │                                  │ │
│ │ ⚠️ Downwind speed                │ │
│ │    -8% vs race average           │ │
│ │    [Downwind Drills →]           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📈 Performance vs Race Average      │
│ ┌─────────────────────────────────┐ │
│ │ Upwind: ████████░ 95%            │ │ ← Progress bars
│ │ Downwind: ██████░░ 78%           │ │
│ │ Tactics: ████████░ 92%           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🗺️ Track Visualization              │
│ [View Map Analysis →]               │ ← Opens detailed map
│                                     │
│ [Save Analysis] [Share with Coach]  │
└─────────────────────────────────────┘
```

**Key Features (PROBLEM 2 SOLUTIONS):**

1. **3 Taps Max**: Select race → Quick input → See results
2. **GPS Auto-Load**: If track exists, skip manual input
3. **Quick Ratings**: Radio buttons, not text entry
4. **Actionable Insights**: Each weakness links to training content
5. **Visual Scoring**: Progress bars, not just numbers
6. **Coach Integration**: "Share with Coach" button if coach connected

**Empty State** (no GPS track):
```
📍 No GPS Track Available

You can still analyze this race:
• Answer a few questions about performance
• Add notes and observations
• Get AI recommendations

[Start Manual Analysis]
```

---

### 6. AI Coaching Screen

**Purpose**: Interactive coaching with voice + chat (SOLVES PROBLEM 3).

**Main Screen:**
```
┌─────────────────────────────────────┐
│ [←] AI Coach                 [⚙️]  │ ← Settings = voice/model prefs
├─────────────────────────────────────┤
│ 💬 Chat History                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🤖 How can I help you improve?  │ │ ← AI message
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ How do I improve my starts? 👤  │ │ ← User message
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🤖 Great question! Starting well │ │
│ │ requires three key skills:       │ │
│ │                                  │ │
│ │ 1. Line bias assessment          │ │
│ │ 2. Speed and acceleration        │ │ ← Rich text with formatting
│ │ 3. Tactical positioning          │ │
│ │                                  │ │
│ │ Which one would you like to      │ │
│ │ focus on?                        │ │
│ │                                  │ │
│ │ [Line Bias] [Speed] [Tactics]   │ │ ← Quick reply chips
│ └─────────────────────────────────┘ │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ [Type your question________] [🎤]  │ ← Input with voice button
└─────────────────────────────────────┘
```

**Voice Mode Active:**
```
┌─────────────────────────────────────┐
│ [←] AI Coach - Voice Mode     [⚙️] │
├─────────────────────────────────────┤
│                                     │
│         ┌─────────────┐             │
│         │             │             │
│         │   🎤 ████   │             │ ← Animated waveform
│         │             │             │
│         └─────────────┘             │
│                                     │
│    "Analyzing your question..."     │ ← Live transcription
│                                     │
│    [⏸️ Pause] [⏹️ Stop]             │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                     │
│ 💡 Quick Coaching Topics            │
│ • Upwind technique                  │
│ • Starting strategies               │ ← Suggested topics
│ • Mark roundings                    │
│ • Race tactics                      │
└─────────────────────────────────────┘
```

**Race-Specific Coaching Context:**
```
┌─────────────────────────────────────┐
│ 🏁 Coaching: Winter Championship    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🤖 I've analyzed your Dec 15     │ │
│ │ race. You finished 6th but had   │ │
│ │ the speed to finish 3rd.         │ │
│ │                                  │ │
│ │ Your biggest loss was at the     │ │
│ │ start (-15 seconds) and first    │ │ ← Context-aware coaching
│ │ downwind leg (-8 seconds).       │ │
│ │                                  │ │
│ │ Want me to explain what          │ │
│ │ happened?                        │ │
│ │                                  │ │
│ │ [Yes, explain] [Show me data]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ At the start, you were too far  │ │
│ │ from the line... [+] [🔊]       │ │ ← Expandable, read aloud
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Key Features (PROBLEM 3 SOLUTIONS):**

1. **Voice + Chat**: Both input methods available always
2. **Quick Replies**: Common responses as tappable chips
3. **Context-Aware**: Analyzes recent races automatically
4. **Rich Responses**: Formatted text, not just plain chat
5. **Actionable**: Links to drills, videos, training plans
6. **Persistent**: Chat history saved per topic/race

**Settings (⚙️):**
- Voice speed (0.5x - 2x)
- Voice type (Male/Female)
- Coaching style (Beginner/Intermediate/Advanced)
- Auto-analyze races (on/off)
- Notification preferences

---

### 7. Training Log Screen

**Purpose**: Quick training session logging (SOLVES PROBLEM 6).

**Main Screen:**
```
┌─────────────────────────────────────┐
│ [≡] Training Log              [+]  │
├─────────────────────────────────────┤
│ 📊 This Month                       │
│ ┌───────┬───────┬───────┬───────┐  │
│ │  12   │  8.5  │  90%  │  ↑15% │  │
│ │ Hours │Avg/Wk │ Goal  │ Trend │  │ ← Stats cards
│ └───────┴───────┴───────┴───────┘  │
│                                     │
│ 📅 Recent Sessions                  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⛵ On-Water Practice             │ │
│ │ Dec 18, 2025 • 2h 30m           │ │
│ │ Upwind drills, tacks            │ │ ← Session card
│ │ 💪 High Intensity                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🏋️ Gym Workout                  │ │
│ │ Dec 17, 2025 • 1h 15m           │ │
│ │ Core strength, cardio           │ │
│ │ 💪 Medium Intensity              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📹 Video Analysis               │ │
│ │ Dec 15, 2025 • 45m              │ │
│ │ Reviewed race footage           │ │
│ │ 🧠 Mental Training               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [View All Sessions]                 │
└─────────────────────────────────────┘
```

**Quick Log (Tap + button):**
```
┌─────────────────────────────────────┐
│ [X] Log Training            [Save] │
├─────────────────────────────────────┤
│ What did you do? *                  │
│ ┌──────────┐ ┌──────────┐          │
│ │ ⛵ Sailing│ │ 🏋️ Gym   │          │ ← Quick select
│ │    ●     │ │          │          │
│ └──────────┘ └──────────┘          │
│ ┌──────────┐ ┌──────────┐          │
│ │ 📹 Video │ │ 📚 Theory│          │
│ │          │ │          │          │
│ └──────────┘ └──────────┘          │
│                                     │
│ Duration (auto-detected)            │
│ [2h 30m__________] [⏱️ Running]    │ ← Timer running in background
│                                     │
│ Quick Notes (optional)              │
│ [Worked on tacks and starts___]    │
│                                     │
│ Intensity                           │
│ ○ Light ● Medium ○ High            │
│                                     │
│ [Log Session]                       │
└─────────────────────────────────────┘
```

**Key Features (PROBLEM 6 SOLUTIONS):**

1. **Quick Log**: 2 taps + duration = logged
2. **Auto-Timer**: Timer runs in background during session
3. **Smart Defaults**: Pre-fills based on time of day
4. **Minimal Fields**: Only type and duration required
5. **Visual Stats**: Monthly summary at top

---

### 8. Find Coach Screen

**Purpose**: Browse and connect with coaches (SOLVES PROBLEM 7).

**Layout:**
```
┌─────────────────────────────────────┐
│ [←] Find a Coach            [🔍]   │
├─────────────────────────────────────┤
│ 🎯 What are you looking for?        │
│ [Starting][Tactics][Speed][Mental] │ ← Quick filter chips
│                                     │
│ 📍 Near Royal Hong Kong YC          │
│ [Change Location ↗]                 │
│                                     │
│ ⭐ Top Rated Coaches                │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Photo]  Sarah Chen              │ │
│ │          ⭐⭐⭐⭐⭐ 4.9 (24)       │ │
│ │                                  │ │
│ │ Olympic 470 Coach                │ │ ← ProfileCard variant
│ │ Specialties: Starts, Tactics     │ │
│ │                                  │ │
│ │ 💰 $80/hr • 📍 Hong Kong        │ │
│ │                                  │ │
│ │ [View Profile] [Book Session]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Photo]  Mike Thompson           │ │
│ │          ⭐⭐⭐⭐⭐ 4.8 (18)       │ │
│ │                                  │ │
│ │ Laser Performance Coach          │ │
│ │ Specialties: Boat speed, Tuning  │ │
│ │                                  │ │
│ │ 💰 $60/hr • 📍 Hong Kong        │ │
│ │                                  │ │
│ │ [View Profile] [Book Session]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Show More Coaches]                 │
└─────────────────────────────────────┘
```

**Coach Profile:**
```
┌─────────────────────────────────────┐
│ [←] Sarah Chen              [⋮]    │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │   [Profile Photo]                │ │
│ │                                  │ │
│ │   Sarah Chen                     │ │
│ │   ⭐⭐⭐⭐⭐ 4.9 (24 reviews)     │ │
│ │   Olympic 470 Coach              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📋 About                            │
│ Former Olympic 470 sailor with 15   │
│ years coaching experience...        │
│ [Read More ↓]                       │
│                                     │
│ 🎯 Specialties                      │
│ [Starts][Tactics][Race Strategy]   │
│                                     │
│ 💰 Pricing                          │
│ • 1 Hour: $80                       │
│ • 5-Pack: $350 (save $50)          │
│ • 10-Pack: $650 (save $150)        │
│                                     │
│ 📅 Availability                     │
│ ┌─────────────────────────────────┐ │
│ │ Mon  Tue  Wed  Thu  Fri  Sat    │ │
│ │  ✓    ✓    ✓    ✓    ✓    ✓    │ │ ← Simple week view
│ │ AM   AM   PM   AM   PM   All Day│ │
│ └─────────────────────────────────┘ │
│ [See Full Calendar]                 │
│                                     │
│ ⭐ Reviews (24)                     │
│ ┌─────────────────────────────────┐ │
│ │ ⭐⭐⭐⭐⭐ Emma Wilson           │ │
│ │ "Sarah helped me improve my      │ │
│ │  starts dramatically..."         │ │ ← Review card
│ │  Dec 10, 2025                    │ │
│ └─────────────────────────────────┘ │
│ [Read All Reviews]                  │
│                                     │
│ [Book a Session]                    │ ← Fixed bottom CTA
└─────────────────────────────────────┘
```

---

### 9. Profile / Settings Screen

**Purpose**: User profile and app settings (SOLVES PROBLEM 10).

**Layout:**
```
┌─────────────────────────────────────┐
│ [≡] Profile                 [✏️]   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │   [Avatar]                       │ │
│ │                                  │ │
│ │   Alex Morgan                    │ │
│ │   alex.morgan@email.com          │ │ ← ProfileCard
│ │   ⛵ Laser Sailor                 │ │
│ │   📍 Hong Kong                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📊 My Performance                   │
│ ├─ Races & Results                 │
│ ├─ Training Log                    │ ← SectionedList
│ ├─ Personal Records                │
│ └─ Performance Trends              │
│                                     │
│ ⛵ Boats & Equipment                │
│ ├─ My Boats                        │
│ ├─ Sail Inventory                  │
│ └─ Maintenance Log                 │
│                                     │
│ 🔔 Preferences                      │
│ ├─ Notifications                   │
│ ├─ Units (Metric/Imperial)         │
│ ├─ Language                        │
│ └─ Privacy Settings                │
│                                     │
│ 💼 Subscriptions                    │
│ ├─ Pro Features (Active)           │
│ └─ Manage Subscription             │
│                                     │
│ ℹ️ Support                          │
│ ├─ Help Center                     │
│ ├─ Contact Support                 │
│ ├─ Report a Bug                    │
│ └─ About RegattaFlow               │
│                                     │
│ 🚪 Sign Out                         │
└─────────────────────────────────────┘
```

**Key Features (PROBLEM 10 SOLUTIONS):**

1. **Visual Hierarchy**: Profile card at top, then grouped sections
2. **Inline Values**: Show current settings without drill-down
3. **Minimal Depth**: Most settings 1 tap away
4. **Grouped Logically**: Performance, Equipment, App Settings, Support

**Notifications Settings** (Example Subscreen):
```
┌─────────────────────────────────────┐
│ [←] Notifications                   │
├─────────────────────────────────────┤
│ 🔔 Race Reminders                   │
│ ├─ 24 hours before         [🔘 On] │
│ ├─ 1 hour before           [🔘 On] │ ← Switch components
│ └─ At start time           [🔘 Off]│
│                                     │
│ 📊 Performance Updates              │
│ ├─ New analysis ready      [🔘 On] │
│ ├─ Weekly summary          [🔘 On] │
│ └─ Personal records        [🔘 On] │
│                                     │
│ 👥 Social                           │
│ ├─ Friend registered       [🔘 On] │
│ ├─ Coach messages          [🔘 On] │
│ └─ Club announcements      [🔘 Off]│
│                                     │
│ 🎯 AI Coaching                      │
│ ├─ Training suggestions    [🔘 On] │
│ └─ Race analysis ready     [🔘 On] │
└─────────────────────────────────────┘
```

---

### 10. Empty States (SOLVES PROBLEM 5)

**No Races:**
```
┌─────────────────────────────────────┐
│                                     │
│         🏁                          │
│                                     │
│   No Upcoming Races                 │
│                                     │
│   Start your sailing journey by     │
│   finding races near you or         │
│   creating a training session       │
│                                     │
│   [Find Races Near Me]              │
│   [Create Training Session]         │
│                                     │
│   or [Browse Popular Venues]        │
└─────────────────────────────────────┘
```

**No Training Log:**
```
┌─────────────────────────────────────┐
│                                     │
│         ⛵                           │
│                                     │
│   Start Tracking Your Training      │
│                                     │
│   Log your sailing sessions and     │
│   watch your progress grow          │
│                                     │
│   [Log Your First Session]          │
│                                     │
│   💡 Tip: Turn on auto-tracking to  │
│   log sessions automatically        │
└─────────────────────────────────────┘
```

**Search No Results:**
```
┌─────────────────────────────────────┐
│                                     │
│         🔍                          │
│                                     │
│   No races found                    │
│                                     │
│   Try adjusting your filters or     │
│   search in a different area        │
│                                     │
│   [Clear Filters]                   │
│   [Expand Search Area]              │
└─────────────────────────────────────┘
```

**No Internet:**
```
┌─────────────────────────────────────┐
│                                     │
│         📡                          │
│                                     │
│   You're Offline                    │
│                                     │
│   Some features are unavailable     │
│   but you can still:                │
│                                     │
│   • View cached races               │
│   • Log training (syncs later)      │
│   • Read saved content              │
│                                     │
│   [Try Again]                       │
└─────────────────────────────────────┘
```

---

## Coach Persona Screens

### 11. Coach Dashboard

**Purpose**: Overview of clients, sessions, and earnings (SOLVES PROBLEM 11).

**Layout:**
```
┌─────────────────────────────────────┐
│ [≡] Coach HQ                [🔔][👤]│
├─────────────────────────────────────┤
│ 👋 Good morning, Sarah              │
│ You have 2 sessions today           │
│                                     │
│ 📊 Quick Stats                      │
│ ┌───────┬───────┬───────┬───────┐  │
│ │  8    │  12   │ $960  │  4.9  │  │
│ │Clients│Sessions│ Week │Rating │  │ ← DataCard grid
│ └───────┴───────┴───────┴───────┘  │
│                                     │
│ ⏰ Today's Schedule                 │
│ ┌─────────────────────────────────┐ │
│ │ 10:00 AM - 11:00 AM              │ │
│ │ Emma Wilson                      │ │
│ │ Starting technique review        │ │
│ │                                  │ │ ← Session card
│ │ 📍 Aberdeen Marina                │ │
│ │ [Start Session] [Reschedule]    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 2:00 PM - 3:00 PM                │ │
│ │ Mike Chen                        │ │
│ │ Race tactics coaching            │ │
│ │ 📍 Victoria Harbour               │ │
│ │ [Start Session] [Reschedule]    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 👥 Active Clients (8)               │
│ [View All Clients →]                │
│                                     │
│ ⚡ Quick Actions                    │
│ ┌─────────┐ ┌─────────┐ ┌────────┐│
│ │ Block   │ │ Session │ │ Send   ││
│ │ Time    │ │ Notes   │ │ Invoice││
│ └─────────┘ └─────────┘ └────────┘│
└─────────────────────────────────────┘
```

**Key Features:**
- **Action-Oriented**: Today's sessions front and center
- **Visual Stats**: Key metrics at a glance
- **Quick Actions**: Common tasks one tap away

---

### 12. Client Management (SOLVES PROBLEM 11)

**Client List:**
```
┌─────────────────────────────────────┐
│ [←] My Clients              [+]    │ ← Add new client
├─────────────────────────────────────┤
│ 🔍 [Search clients_________]        │
│                                     │
│ ⭐ Active Clients                   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Avatar] Emma Wilson         →  │ │
│ │                                  │ │
│ │ ┌─────────────────────┐          │ │
│ │ │ Progress: ████████░░ 78%      │ │ ← Visual progress
│ │ └─────────────────────┘          │ │
│ │                                  │ │
│ │ 8 sessions • Last: Dec 15        │ │
│ │ Focus: Starting, Tactics         │ │
│ │                                  │ │
│ │ 📅 Next: Dec 22 at 10:00 AM     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Avatar] Mike Chen           →  │ │
│ │                                  │ │
│ │ ┌─────────────────────┐          │ │
│ │ │ Progress: ██████░░░░ 65%      │ │
│ │ └─────────────────────┘          │ │
│ │                                  │ │
│ │ 5 sessions • Last: Dec 18        │ │
│ │ Focus: Boat speed, Tuning        │ │
│ │                                  │ │
│ │ 📅 Next: Dec 20 at 2:00 PM      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📋 Pending Requests (2)             │
│ [View Requests →]                   │
└─────────────────────────────────────┘
```

**Client Detail Screen:**
```
┌─────────────────────────────────────┐
│ [←] Emma Wilson             [✏️]   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [Avatar]  Emma Wilson            │ │
│ │           emma@email.com         │ │
│ │           +852 9123 4567         │ │ ← ProfileCard
│ │           ⛵ Laser Standard       │ │
│ │           Member since: Oct 2025 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Sessions][Progress][Notes][Goals] │ ← Tabs
│                                     │
│ ━━━━━━━ SESSIONS TAB ━━━━━━━━━━━━━│
│                                     │
│ 📅 Upcoming (1)                     │
│ ┌─────────────────────────────────┐ │
│ │ Dec 22, 2025 • 10:00 AM          │ │
│ │ Starting technique review        │ │
│ │ 📍 Aberdeen Marina                │ │
│ │ [Edit] [Cancel]                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📋 Past Sessions (8)                │
│ ┌─────────────────────────────────┐ │
│ │ Dec 15, 2025 • ✅ Completed      │ │
│ │ Race tactics - Starting          │ │
│ │ "Emma improved port approach..." │ │ ← Preview of notes
│ │ [View Details]                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Dec 8, 2025 • ✅ Completed       │ │
│ │ Boat speed drills                │ │
│ │ "Focused on upwind trim..."      │ │
│ │ [View Details]                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Load More]                         │
└─────────────────────────────────────┘
```

**Progress Tab:**
```
┌─────────────────────────────────────┐
│ [←] Emma Wilson - Progress          │
├─────────────────────────────────────┤
│ 📈 Overall Progress                 │
│ ┌─────────────────────────────────┐ │
│ │ ████████████████░░░░░░░ 78%      │ │
│ │                                  │ │
│ │ 8 sessions completed             │ │
│ │ Joined 2 months ago              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🎯 Skill Improvement                │
│ ┌─────────────────────────────────┐ │
│ │                                  │ │
│ │   [Line chart showing progress]  │ │
│ │   over time for different skills │ │ ← Chart visualization
│ │                                  │ │
│ │ — Starting                       │ │
│ │ — Tactics                        │ │
│ │ — Boat Speed                     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🏆 Recent Achievements              │
│ ┌─────────────────────────────────┐ │
│ │ ✅ First podium finish            │ │
│ │    Club Race • Dec 12            │ │
│ │                                  │ │
│ │ ✅ Consistent starts              │ │
│ │    4/5 good starts last month    │ │
│ │                                  │ │
│ │ ✅ Speed improvement              │ │
│ │    +12% upwind VMG               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📊 Race Results                     │
│ ┌─────────────────────────────────┐ │
│ │ Winter Series R3 • 3rd place    │ │
│ │ Club Race #8 • 2nd place        │ │
│ │ Training Race • 5th place        │ │ ← SimpleList
│ │ [View All Results]               │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Notes Tab:**
```
┌─────────────────────────────────────┐
│ [←] Emma Wilson - Notes       [+]  │
├─────────────────────────────────────┤
│ 📝 Private Coach Notes              │
│    (Only you can see these)         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Dec 15, 2025                     │ │
│ │                                  │ │
│ │ Emma's starting has improved     │ │
│ │ significantly. She now reads     │ │
│ │ line bias well and positions...  │ │ ← Note card
│ │                                  │ │
│ │ Next focus: port tack approach   │ │
│ │                                  │ │
│ │ [Edit] [Delete]                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Dec 8, 2025                      │ │
│ │                                  │ │
│ │ Worked on boat speed drills.     │ │
│ │ Emma is getting better at trim...│ │
│ │                                  │ │
│ │ [Edit] [Delete]                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Add New Note]                      │
└─────────────────────────────────────┘
```

**Goals Tab:**
```
┌─────────────────────────────────────┐
│ [←] Emma Wilson - Goals       [+]  │
├─────────────────────────────────────┤
│ 🎯 Active Goals                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Top 3 in Winter Championship    │ │
│ │                                  │ │
│ │ Progress: ████████░░░░ 60%       │ │
│ │                                  │ │
│ │ Target: Dec 28, 2025             │ │
│ │ Status: On track                 │ │
│ │                                  │ │
│ │ [Edit Goal]                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Consistent top-row starts        │ │
│ │                                  │ │
│ │ Progress: ████████████░░ 75%     │ │
│ │                                  │ │
│ │ 6/8 good starts this month       │ │
│ │ Target: 8/10 starts              │ │
│ │                                  │ │
│ │ [Mark Complete] [Edit]           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ✅ Completed Goals (3)              │
│ [View Completed →]                  │
│                                     │
│ [Add New Goal]                      │
└─────────────────────────────────────┘
```

---

### 13. Schedule Screen (SOLVES PROBLEM 12)

**Weekly Calendar View:**
```
┌─────────────────────────────────────┐
│ [←] Schedule                [+]    │
├─────────────────────────────────────┤
│ 📅 Week of Dec 16 - 22, 2025        │
│ [← Prev Week]      [Next Week →]    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │     Mon   Tue   Wed   Thu   Fri │ │
│ │      16    17    18    19    20 │ │
│ │                                  │ │
│ │ 9am                              │ │
│ │ 10am [Emma]            [Mike]   │ │ ← Sessions as blocks
│ │ 11am [█████]           [████]   │ │
│ │ 12pm       [Sarah]              │ │
│ │ 1pm        [█████]              │ │
│ │ 2pm                    [Emma]   │ │
│ │ 3pm                    [████]   │ │
│ │ 4pm  [Tom]                      │ │
│ │ 5pm  [███]                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🔗 Booking Link                     │
│ regattaflow.com/coach/sarah        │
│ [Copy Link] [Share]                 │
│                                     │
│ ⏰ Open Availability (12 slots)     │
│ Drag on calendar to block time      │
│                                     │
│ 📬 Booking Requests (2)             │
│ [Review Requests →]                 │
└─────────────────────────────────────┘
```

**Day View (Tap on a day):**
```
┌─────────────────────────────────────┐
│ [←] Monday, Dec 16              [+] │
├─────────────────────────────────────┤
│ 📅 3 Sessions                       │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 10:00 AM - 11:00 AM              │ │
│ │ Emma Wilson                      │ │
│ │ Starting technique               │ │
│ │ 📍 Aberdeen Marina                │ │
│ │                                  │ │
│ │ [Start] [Reschedule] [Cancel]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 12:00 PM - 1:00 PM               │ │
│ │ Sarah Lee                        │ │
│ │ Race tactics                     │ │
│ │ 📍 Victoria Harbour               │ │
│ │                                  │ │
│ │ [Start] [Reschedule] [Cancel]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 4:00 PM - 5:00 PM                │ │
│ │ Tom Richards                     │ │
│ │ Boat speed drills                │ │
│ │ 📍 Aberdeen Marina                │ │
│ │                                  │ │
│ │ [Start] [Reschedule] [Cancel]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⏰ Available Slots                  │
│ 2:00 PM - 3:00 PM                   │
│ 5:00 PM - 6:00 PM                   │
│                                     │
│ [Block Time]                        │
└─────────────────────────────────────┘
```

**Session Quick Actions (Swipe left on session):**
```
│ [Reschedule] [Add Notes] [Cancel] │
```

**Booking Requests:**
```
┌─────────────────────────────────────┐
│ [←] Booking Requests                │
├─────────────────────────────────────┤
│ 📬 Pending (2)                      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ John Smith                       │ │
│ │ ⛵ Laser Sailor                   │ │
│ │                                  │ │
│ │ Requested: Dec 22 at 10:00 AM   │ │
│ │ Topic: Starting technique        │ │
│ │                                  │ │
│ │ "I struggle with port tack       │ │
│ │  approaches..."                  │ │
│ │                                  │ │
│ │ [Accept] [Suggest Time] [Decline]│ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Lisa Chen                        │ │
│ │ ⛵ 470 Crew                       │ │
│ │                                  │ │
│ │ Requested: Dec 23 at 2:00 PM    │ │
│ │ Topic: Spinnaker handling        │ │
│ │                                  │ │
│ │ [Accept] [Suggest Time] [Decline]│ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

### 14. Earnings Dashboard (SOLVES PROBLEM 13)

**Main Screen:**
```
┌─────────────────────────────────────┐
│ [←] Earnings                  [📊] │ ← Export reports
├─────────────────────────────────────┤
│ 💰 This Month                       │
│ ┌─────────────────────────────────┐ │
│ │      $2,840                      │ │
│ │                                  │ │
│ │      ↑ 15% vs last month         │ │ ← Large number prominent
│ │                                  │ │
│ │ 36 sessions • $78.89 avg         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📊 Earnings Trend                   │
│ ┌─────────────────────────────────┐ │
│ │                                  │ │
│ │   [Monthly line chart]           │ │
│ │   showing earnings over          │ │ ← Chart visualization
│ │   last 6 months                  │ │
│ │                                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌───────┬───────┬───────┬───────┐  │
│ │  36   │ $2840 │  $640 │ $2200 │  │
│ │Session│ Total │Pending│ Paid  │  │ ← DataCard grid
│ └───────┴───────┴───────┴───────┘  │
│                                     │
│ 💳 Recent Transactions              │
│ ┌─────────────────────────────────┐ │
│ │ Emma Wilson                  $80 │ │
│ │ Dec 15 • Paid ✅                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Mike Chen                    $60 │ │
│ │ Dec 18 • Pending ⏱️             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Sarah Lee                    $80 │ │
│ │ Dec 14 • Paid ✅                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [View All Transactions]             │
│                                     │
│ ⚡ Quick Actions                    │
│ ┌──────────────┐ ┌───────────────┐ │
│ │ Send Invoice │ │ Export Report │ │
│ └──────────────┘ └───────────────┘ │
└─────────────────────────────────────┘
```

**Filter View (tap 📊):**
```
┌─────────────────────────────────────┐
│ [←] Filter Earnings           [×]  │
├─────────────────────────────────────┤
│ 📅 Date Range                       │
│ ○ This Week                         │
│ ● This Month                        │
│ ○ Last 3 Months                     │
│ ○ This Year                         │
│ ○ Custom                            │
│                                     │
│ 👥 By Client                        │
│ ☐ Show all clients                  │
│ ☑ Emma Wilson                       │
│ ☑ Mike Chen                         │
│ ☐ Sarah Lee                         │
│ [Select All] [Clear]                │
│                                     │
│ 💳 Status                           │
│ ☑ Paid                              │
│ ☑ Pending                           │
│ ☐ Overdue                           │
│                                     │
│ [Apply Filters]                     │
└─────────────────────────────────────┘
```

**Transaction Detail:**
```
┌─────────────────────────────────────┐
│ [←] Transaction Details             │
├─────────────────────────────────────┤
│ Emma Wilson                         │
│ emma@email.com                      │
│                                     │
│ 📅 Date                             │
│ December 15, 2025                   │
│                                     │
│ 💰 Amount                           │
│ $80.00                              │
│                                     │
│ 📝 Description                      │
│ 1-hour coaching session             │
│ Starting technique review           │
│                                     │
│ ✅ Status: Paid                     │
│ Payment method: Credit Card         │
│ Transaction ID: #RF-2025-1234       │
│                                     │
│ 📄 Invoice                          │
│ [View Invoice PDF]                  │
│ [Email Invoice]                     │
│                                     │
│ [Mark as Refunded]                  │
└─────────────────────────────────────┘
```

---

### 15. Post-Session Workflow (SOLVES PROBLEM 14)

**Notification After Session:**
```
┌─────────────────────────────────────┐
│ ⏰ Session Completed                │
│                                     │
│ Emma Wilson - Starting Technique    │
│ Dec 15, 2025 • 10:00 AM - 11:00 AM │
│                                     │
│ [Leave Feedback] [Not Now]          │
└─────────────────────────────────────┘
```

**Quick Feedback Form:**
```
┌─────────────────────────────────────┐
│ [X] Session Feedback          [Send]│
├─────────────────────────────────────┤
│ Session with Emma Wilson            │
│ Dec 15, 2025 • 1 hour               │
│                                     │
│ What did you work on? *             │
│ [Starting][Tactics][Boat Speed]    │ ← Multi-select chips
│ [Mark Rounding][Mental][+]          │
│                                     │
│ Key improvement this session *      │
│ (280 characters max)                │
│ ┌─────────────────────────────────┐ │
│ │ Emma showed great progress on    │ │
│ │ port tack approaches. She now    │ │
│ │ reads line bias well and...      │ │ ← Text area
│ └─────────────────────────────────┘ │
│                                     │
│ Homework for next session           │
│ (Optional)                          │
│ ┌─────────────────────────────────┐ │
│ │ Practice 10 port tack starts     │ │
│ │ Watch starting video (link)      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📎 Attach files (optional)          │
│ [+ Add Photo/Video/Document]        │
│                                     │
│ [Send to Emma]                      │
│                                     │
│ ℹ️ Emma will receive a notification │
│    and can reply with questions     │
└─────────────────────────────────────┘
```

**Client's View (Sailor receives this):**
```
┌─────────────────────────────────────┐
│ 🔔 New Feedback from Sarah Chen     │
│                                     │
│ Session: Starting Technique         │
│ Dec 15, 2025                        │
│                                     │
│ Topics Covered:                     │
│ • Starting                          │
│ • Tactics                           │
│                                     │
│ Key Improvement:                    │
│ "Emma showed great progress on      │
│  port tack approaches..."           │
│                                     │
│ Homework:                           │
│ • Practice 10 port tack starts      │
│ • Watch starting video (link)       │
│                                     │
│ [Reply to Sarah] [View Full Notes]  │
└─────────────────────────────────────┘
```

**Feedback History (in Client Detail → Notes tab):**
```
│ 📬 Sent to Client                   │
│ ┌─────────────────────────────────┐ │
│ │ ✉️ Dec 15, 2025                  │ │
│ │ Starting technique review        │ │
│ │ "Emma showed great progress..."  │ │
│ │                                  │ │
│ │ ✅ Read by Emma                  │ │
│ │ 💬 1 reply                       │ │ ← Client replied
│ │                                  │ │
│ │ [View Conversation]              │ │
│ └─────────────────────────────────┘ │
```

---

## Club Persona Screens

### 16. Club Operations Dashboard (SOLVES PROBLEM 15)

**Focused Priority Dashboard:**
```
┌─────────────────────────────────────┐
│ [≡] Club Operations HQ      [🔔][👤]│
├─────────────────────────────────────┤
│ 👋 Good afternoon                   │
│ Royal Hong Kong Yacht Club          │
│                                     │
│ 🚨 Needs Attention (3)              │ ← Priority inbox
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⚠️ Winter Championship - R1      │ │
│ │ Tomorrow • 24 registered         │ │
│ │                                  │ │
│ │ Missing: Race Officer            │ │
│ │ Action: Assign RO                │ │
│ │                                  │ │
│ │ [Assign RO] [View Details]      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⚠️ 3 Membership Applications     │ │
│ │ Pending since Dec 10             │ │
│ │                                  │ │
│ │ [Review Applications]            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⚠️ Equipment Maintenance Due     │ │
│ │ Safety boat #2                   │ │
│ │                                  │ │
│ │ [Schedule Maintenance]           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📅 This Week                        │
│ ┌───────┬───────┬───────┬───────┐  │
│ │   5   │  120  │   2   │  $15K │  │
│ │Events │Sailors│  New  │Revenue│  │ ← Collapsed by default
│ └───────┴───────┴───────┴───────┘  │
│ [View Details]                      │
│                                     │
│ ⚡ Quick Actions                    │
│ ┌─────────┐ ┌─────────┐ ┌────────┐│
│ │ Create  │ │ Member  │ │ Race   ││
│ │ Event   │ │ Roster  │ │Command ││
│ └─────────┘ └─────────┘ └────────┘│
│                                     │
│ 📋 Upcoming Events (5)              │
│ [View Calendar →]                   │
└─────────────────────────────────────┘
```

**Key Features (PROBLEM 15 SOLUTIONS):**

1. **Priority Inbox**: Action-needed items at top
2. **Stats Collapsed**: Show summary, expand for details
3. **Clear Actions**: Every card has a primary CTA
4. **Quick Access**: Common tasks in quick actions grid

---

### 17. Membership Management (SOLVES PROBLEM 16)

**Active Member Dashboard:**
```
┌─────────────────────────────────────┐
│ [←] Membership HQ           [+]    │ ← Add new member
├─────────────────────────────────────┤
│ 📊 Membership Stats                 │
│ ┌───────┬───────┬───────┬───────┐  │
│ │  245  │  238  │   7   │ $98K  │  │
│ │ Total │Active │Pending│Revenue│  │
│ └───────┴───────┴───────┴───────┘  │
│                                     │
│ 🔍 [Search members_________] [🔍]  │
│                                     │
│ 📋 Filter by:                       │
│ [All][Active][Pending][Inactive]   │ ← Chip filters
│                                     │
│ 👥 Active Members (238)             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Avatar] Emma Wilson         →  │ │
│ │                                  │ │
│ │ Member #1234 • Active            │ │
│ │ ⛵ Laser • 🏆 12 races this year  │ │
│ │ 📧 emma@email.com                │ │
│ │ 💳 Paid through Dec 2025         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Avatar] Mike Chen           →  │ │
│ │                                  │ │
│ │ Member #1235 • Active            │ │
│ │ ⛵ 470 • 🏆 8 races this year     │ │
│ │ 📧 mike@email.com                │ │
│ │ 💳 Paid through Jun 2026         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Load More Members]                 │
│                                     │
│ ⚠️ Pending Applications (7)         │
│ [Review Applications →]             │
│                                     │
│ 📤 Actions                          │
│ [Export Roster] [Send Email Blast]  │
└─────────────────────────────────────┘
```

**Member Profile (Club Admin View):**
```
┌─────────────────────────────────────┐
│ [←] Emma Wilson             [✏️]   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [Avatar]  Emma Wilson            │ │
│ │           Member #1234           │ │
│ │           ✅ Active               │ │
│ │                                  │ │
│ │ 📧 emma@email.com                │ │
│ │ 📱 +852 9123 4567                │ │
│ │ 📍 Hong Kong                     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Profile][Boats][Activity][Payment] │ ← Tabs
│                                     │
│ ━━━━━━━ PROFILE TAB ━━━━━━━━━━━━━━│
│                                     │
│ 👤 Personal Information             │
│ Joined: October 15, 2023            │
│ Member Type: Full                   │
│ Emergency Contact: John Wilson      │
│ Phone: +852 9123 9999               │
│                                     │
│ ⛵ Sailing Information               │
│ Primary Boat: Laser Standard        │
│ Sail Number: HKG 12345              │
│ Certifications: ISAF Level 2        │
│                                     │
│ 🏆 Activity Summary                 │
│ Races this year: 12                 │
│ Training sessions: 24               │
│ Club events attended: 8             │
│ [View Details →]                    │
│                                     │
│ 💳 Membership Status                │
│ Status: Active                      │
│ Paid through: December 31, 2025     │
│ Last payment: $400 on Oct 15, 2025  │
│ [View Payment History]              │
│                                     │
│ 📝 Admin Notes (Private)            │
│ [Add Note]                          │
│                                     │
│ ⚡ Quick Actions                    │
│ [Send Email] [Edit Profile] [Suspend]│
└─────────────────────────────────────┘
```

**Membership Breakdown (Expandable Section):**
```
┌─────────────────────────────────────┐
│ 📊 Membership Breakdown             │
│                                     │
│ By Type:                            │
│ Full Members: ████████████░ 180     │
│ Junior: ██████░░░░░░░░░░░ 45       │ ← Progress bars
│ Social: ████░░░░░░░░░░░░░ 20       │
│                                     │
│ By Activity:                        │
│ Active (last 30d): ████████ 180    │
│ Inactive: ███░░░░░░░░░░░░ 58       │
│                                     │
│ By Boat Class:                      │
│ Laser: ██████████░░░░░░ 95         │
│ 470: ████████░░░░░░░░░░ 55         │
│ Finn: ████░░░░░░░░░░░░░ 30         │
│ Dragon: ██████░░░░░░░░░░ 42         │
│ Other: ███░░░░░░░░░░░░░░ 23        │
└─────────────────────────────────────┘
```

**Pending Applications:**
```
┌─────────────────────────────────────┐
│ [←] Membership Applications         │
├─────────────────────────────────────┤
│ ⏳ Pending Review (7)               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ John Smith                       │ │
│ │ Applied: Dec 10, 2025            │ │
│ │                                  │ │
│ │ Type: Full Member                │ │
│ │ Boat Class: Laser                │ │
│ │ Experience: 5 years              │ │
│ │                                  │ │
│ │ "I've been sailing Lasers for... │ │
│ │                                  │ │
│ │ [Approve] [Request Info] [Deny] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Lisa Chen                        │ │
│ │ Applied: Dec 12, 2025            │ │
│ │                                  │ │
│ │ [Approve] [Request Info] [Deny] │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

### 18. Race Command Center (SOLVES PROBLEM 17)

**Live Race Operations:**
```
┌─────────────────────────────────────┐
│ [←] Race Command Center      [⚙️]  │
├─────────────────────────────────────┤
│ 🏁 Winter Championship - Race 1     │
│ Status: ON WATER 🔴 LIVE            │ ← Animated live indicator
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                     │
│ ⏱️ Race Clock                       │
│ ┌─────────────────────────────────┐ │
│ │          00:15:23                │ │ ← Large timer
│ │       Since First Start          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 👥 Boats on Water: 24/24            │
│ ⚠️ Incidents: 0                     │
│ 🚩 Protests: 0                      │
│                                     │
│ 🌊 Current Conditions               │
│ ┌─────────────────────────────────┐ │
│ │ 🌬️ Wind: 12 kts SW               │ │
│ │ ☁️ Weather: Partly Cloudy        │ │
│ │ 🌊 Seas: 0.5m                    │ │
│ │ Updated: 2 min ago 🔄            │ │ ← Auto-refresh
│ └─────────────────────────────────┘ │
│                                     │
│ ⚡ Quick Actions                    │
│ ┌──────────────┐ ┌───────────────┐ │
│ │ General      │ │ Abandon       │ │
│ │ Recall       │ │ Race          │ │
│ └──────────────┘ └───────────────┘ │
│                                     │
│ ┌──────────────┐ ┌───────────────┐ │
│ │ Broadcast    │ │ Log           │ │
│ │ Message      │ │ Incident      │ │
│ └──────────────┘ └───────────────┘ │
│                                     │
│ 📡 Live Tracking                    │
│ [View Race Map →]                   │
│                                     │
│ 📋 Finish Order Entry               │
│ [Start Recording Finishes →]        │
│                                     │
│ 🚩 Protests & Requests              │
│ [View Protest Forms →]              │
└─────────────────────────────────────┘
```

**Finish Order Entry:**
```
┌─────────────────────────────────────┐
│ [←] Finish Order Entry        [✓]  │
├─────────────────────────────────────┤
│ 🏁 Winter Championship - Race 1     │
│                                     │
│ Finished: 8/24 boats                │
│                                     │
│ 🔍 [Search sail number or name...] │ ← Quick search
│                                     │
│ Recent Finishers:                   │
│ ┌─────────────────────────────────┐ │
│ │ 1st • HKG 12345 • Emma Wilson   │ │
│ │     11:23:45                     │ │
│ │     [Edit] [Remove]              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 2nd • HKG 67890 • Mike Chen     │ │
│ │     11:24:12                     │ │
│ │     [Edit] [Remove]              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 3rd • HKG 11111 • Sarah Lee     │ │
│ │     11:24:45                     │ │
│ │     [Edit] [Remove]              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⚡ Quick Add                        │
│ [Scan Sail Number] [Manual Entry]   │
│                                     │
│ ℹ️ Tap [✓] when all boats finished │
└─────────────────────────────────────┘
```

**Broadcast Message:**
```
┌─────────────────────────────────────┐
│ [X] Broadcast to Fleet        [Send]│
├─────────────────────────────────────┤
│ 📣 Send message to all boats        │
│                                     │
│ Quick Messages:                     │
│ [RC Boat Issue]                     │
│ [Course Change]                     │
│ [Weather Warning]                   │ ← Pre-written templates
│ [Safety Alert]                      │
│ [Race Postponed]                    │
│ [Custom Message]                    │
│                                     │
│ ━━━━━━ OR CUSTOM ━━━━━━━━━━━━━━━━━│
│                                     │
│ Message:                            │
│ ┌─────────────────────────────────┐ │
│ │ Course change: Mark 3 moved     │ │
│ │ 50m north due to wind shift     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Send to:                            │
│ ● All boats on water (24)           │
│ ○ Specific class/division           │
│                                     │
│ [Send Broadcast]                    │
│                                     │
│ 📜 Recent Broadcasts:               │
│ • "10 min warning" - 11:50 AM       │
│ • "Race starts in 5" - 11:55 AM     │
└─────────────────────────────────────┘
```

**Safety Incident Log:**
```
┌─────────────────────────────────────┐
│ [X] Log Safety Incident       [Save]│
├─────────────────────────────────────┤
│ ⚠️ Type of Incident *               │
│ ○ Collision                         │
│ ○ Capsize                           │
│ ● Equipment Failure                 │
│ ○ Medical                           │
│ ○ Other                             │
│                                     │
│ Boat(s) Involved *                  │
│ [HKG 12345 - Emma Wilson____]      │ ← Auto-suggest
│                                     │
│ Severity                            │
│ ● Minor  ○ Moderate  ○ Serious     │
│                                     │
│ Description                         │
│ ┌─────────────────────────────────┐ │
│ │ Mainsheet block failed during   │ │
│ │ downwind leg. Boat safe, no     │ │
│ │ injuries.                        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Action Taken                        │
│ ┌─────────────────────────────────┐ │
│ │ Safety boat escorted to shore.  │ │
│ │ Boat retired from race.         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📸 Photo (Optional)                 │
│ [Take Photo] [Choose from Library]  │
│                                     │
│ [Save Incident Report]              │
└─────────────────────────────────────┘
```

---

### 19. Event Calendar (SOLVES PROBLEM 18)

**Calendar + List Hybrid View:**
```
┌─────────────────────────────────────┐
│ [←] Events                  [+][⚙️] │ ← Create + View options
├─────────────────────────────────────┤
│ 📅 December 2025                    │
│ [← Nov]                    [Jan →]  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Sun Mon Tue Wed Thu Fri Sat     │ │
│ │  1   2   3   4   5   6   7      │ │
│ │                  🔵             │ │
│ │  8   9  10  11  12  13  14      │ │
│ │ 🟢  🔵                      🔴   │ │ ← Color dots by type
│ │ 15  16  17  18  19  20  21      │ │
│ │     🔵          🔴  🔵      🟢  │ │
│ │ 22  23  24  25  26  27  28      │ │
│ │ 🔴                          🔵  │ │
│ │ 29  30  31                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🔵 Regattas  🔴 Club Races  🟢 Social│
│                                     │
│ 📋 Selected: December 20            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔵 Winter Championship - R1      │ │
│ │ 10:00 AM • 24 registered         │ │
│ │ RO: John Smith                   │ │
│ │                                  │ │
│ │ [View] [Edit] [Cancel]          │ │ ← Swipe for actions
│ └─────────────────────────────────┘ │
│                                     │
│ 📅 Upcoming Events (12)             │
│ [View All →]                        │
│                                     │
│ ⚡ Quick Actions                    │
│ [Create Event] [Export Calendar]    │
└─────────────────────────────────────┘
```

**List View (Alternative, toggle via ⚙️):**
```
┌─────────────────────────────────────┐
│ [←] Events                  [+][📅] │ ← Switch to calendar
├─────────────────────────────────────┤
│ [All][Regattas][Races][Social]     │ ← Filter chips
│                                     │
│ 📅 This Week                        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔵 Winter Championship - R1      │ │
│ │ Dec 20 • 10:00 AM                │ │
│ │ 👥 24 registered                 │ │
│ │ 👮 RO: John Smith                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🟢 Christmas Dinner              │ │
│ │ Dec 21 • 7:00 PM                 │ │
│ │ 👥 45 attending                  │ │
│ │ 📍 Clubhouse                     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📅 Next Week                        │
│ ┌─────────────────────────────────┐ │
│ │ 🔴 Club Race #12                 │ │
│ │ Dec 27 • 2:00 PM                 │ │
│ │ 👥 18 registered                 │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Export Options:**
```
┌─────────────────────────────────────┐
│ [X] Export Calendar                 │
├─────────────────────────────────────┤
│ 📅 Export Options                   │
│                                     │
│ Format:                             │
│ ○ iCal (.ics)                       │
│ ● Google Calendar                   │
│ ○ PDF Schedule                      │
│                                     │
│ Date Range:                         │
│ ● This Month                        │
│ ○ Next 3 Months                     │
│ ○ This Year                         │
│ ○ Custom                            │
│                                     │
│ Include:                            │
│ ☑ Regattas                          │
│ ☑ Club Races                        │
│ ☑ Social Events                     │
│ ☐ Training Sessions                 │
│                                     │
│ [Export]                            │
└─────────────────────────────────────┘
```

---

### 20. Club Onboarding (SOLVES PROBLEM 19)

**First-Time Setup Wizard:**

**Welcome Screen:**
```
┌─────────────────────────────────────┐
│              ⛵                      │
│                                     │
│      Welcome to RegattaFlow         │
│                                     │
│  Let's set up your club account     │
│  in just a few steps                │
│                                     │
│  ○ ● ○ ○                           │ ← Progress dots
│                                     │
│  [Get Started]                      │
│  or [Skip Setup]                    │
└─────────────────────────────────────┘
```

**Step 1: Club Profile:**
```
┌─────────────────────────────────────┐
│ [←] Club Setup              1 of 4  │
├─────────────────────────────────────┤
│ 🏛️ Your Club Profile               │
│                                     │
│ Club Logo                           │
│ ┌─────────────────┐                 │
│ │                 │                 │
│ │   [📷 Upload]   │                 │ ← Image upload
│ │                 │                 │
│ └─────────────────┘                 │
│                                     │
│ Club Name *                         │
│ [Royal Hong Kong Yacht Club__]     │
│                                     │
│ Location *                          │
│ [Hong Kong_______________] [📍]    │ ← Map picker
│                                     │
│ Website                             │
│ [https://rhkyc.org.hk______]       │
│                                     │
│ Contact Email *                     │
│ [admin@rhkyc.org.hk_________]      │
│                                     │
│ Phone Number                        │
│ [+852 2832 2817_____________]      │
│                                     │
│ [Save & Continue]                   │
│ or [Skip for Now]                   │
└─────────────────────────────────────┘
```

**Step 2: Classes & Boats:**
```
┌─────────────────────────────────────┐
│ [←] Club Setup              2 of 4  │
├─────────────────────────────────────┤
│ ⛵ What boat classes do you sail?   │
│                                     │
│ Popular Classes:                    │
│ ┌──────────┐ ┌──────────┐          │
│ │ Laser  ☑ │ │ 470    ☑ │          │
│ └──────────┘ └──────────┘          │
│ ┌──────────┐ ┌──────────┐          │
│ │ Finn   ☑ │ │ Dragon ☐ │          │ ← Multi-select
│ └──────────┘ └──────────┘          │
│ ┌──────────┐ ┌──────────┐          │
│ │ 420    ☐ │ │ RS:X   ☐ │          │
│ └──────────┘ └──────────┘          │
│                                     │
│ [+ Add Custom Class]                │
│                                     │
│ [Continue]                          │
│ or [Skip for Now]                   │
└─────────────────────────────────────┘
```

**Step 3: Import Members:**
```
┌─────────────────────────────────────┐
│ [←] Club Setup              3 of 4  │
├─────────────────────────────────────┤
│ 👥 Add Your Members                 │
│                                     │
│ Choose how to add members:          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📄 Upload CSV File               │ │
│ │ Import from spreadsheet          │ │
│ │ [Download Template]              │ │
│ │ [Choose File]                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✏️ Manual Entry                  │ │
│ │ Add members one by one           │ │
│ │ [Add Manually]                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔗 Send Join Link                │ │
│ │ Members sign up themselves       │ │
│ │ [Get Join Link]                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Continue]                          │
│ or [Skip - Add Members Later]       │
└─────────────────────────────────────┘
```

**Step 4: Create First Event:**
```
┌─────────────────────────────────────┐
│ [←] Club Setup              4 of 4  │
├─────────────────────────────────────┤
│ 🏁 Create Your First Event          │
│                                     │
│ Let's create a practice event so    │
│ you can see how it works            │
│                                     │
│ Event Name                          │
│ [Practice Regatta___________]      │
│                                     │
│ Date                                │
│ [Tomorrow, Dec 21___________]      │
│                                     │
│ Time                                │
│ [10:00 AM___________________]      │
│                                     │
│ Classes                             │
│ [Laser][470][Finn]                 │ ← Pre-filled from Step 2
│                                     │
│ ℹ️ This is just practice - you can │
│    edit or delete it anytime        │
│                                     │
│ [Create Event]                      │
│ or [Skip - Create Later]            │
└─────────────────────────────────────┘
```

**Completion Screen:**
```
┌─────────────────────────────────────┐
│                                     │
│             ✅                      │
│                                     │
│      You're All Set!                │
│                                     │
│  Your club account is ready         │
│                                     │
│  You can always change these        │
│  settings later in Club Settings    │
│                                     │
│  [Go to Dashboard]                  │
│                                     │
│  or [Watch Tutorial Video]          │
└─────────────────────────────────────┘
```

**Progress Saved (if user exits):**
```
┌─────────────────────────────────────┐
│ ⚠️ Setup Incomplete                 │
│                                     │
│ You're at step 2 of 4               │
│                                     │
│ Your progress has been saved.       │
│ Continue anytime from:              │
│                                     │
│ Settings → Complete Club Setup      │
│                                     │
│ [Continue Setup] [Not Now]          │
└─────────────────────────────────────┘
```

---

## Shared Screens

### 21. Login / Authentication

**Login Screen:**
```
┌─────────────────────────────────────┐
│                                     │
│              ⛵                      │
│         RegattaFlow                 │
│                                     │
│    Your Sailing Performance Hub     │
│                                     │
│ Email                               │
│ [your@email.com_____________]      │
│                                     │
│ Password                            │
│ [••••••••••••••••••••••••] [👁️]   │
│                                     │
│ [Sign In]                           │
│                                     │
│ [Forgot Password?]                  │
│                                     │
│ ━━━━━━━━━ OR ━━━━━━━━━━━━━━━━━━━━│
│                                     │
│ 🎯 Try Demo Accounts                │
│ ┌──────────────┐ ┌───────────────┐ │
│ │ Sailor Demo  │ │ Coach Demo    │ │
│ │ [Try It]     │ │ [Try It]      │ │
│ └──────────────┘ └───────────────┘ │
│ ┌──────────────┐                    │
│ │ Club Demo    │                    │
│ │ [Try It]     │                    │
│ └──────────────┘                    │
│                                     │
│ Don't have an account?              │
│ [Sign Up]                           │
└─────────────────────────────────────┘
```

**Sign Up - Role Selection:**
```
┌─────────────────────────────────────┐
│ [←] Create Account                  │
├─────────────────────────────────────┤
│ 👤 I am a...                        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │           ⛵                      │ │
│ │        Sailor                    │ │
│ │                                  │ │
│ │ Track races, analyze performance,│ │
│ │ and improve your skills          │ │
│ │                                  │ │
│ │ [Select] ─────────────────────→ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │           👨‍🏫                     │ │
│ │        Coach                     │ │
│ │                                  │ │
│ │ Manage clients, schedule         │ │
│ │ sessions, and track progress     │ │
│ │                                  │ │
│ │ [Select] ─────────────────────→ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │           🏛️                     │ │
│ │      Club Admin                  │ │
│ │                                  │ │
│ │ Organize events, manage members, │ │
│ │ and run races                    │ │
│ │                                  │ │
│ │ [Select] ─────────────────────→ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

### 22. Notifications Center

```
┌─────────────────────────────────────┐
│ [←] Notifications           [⚙️]   │
├─────────────────────────────────────┤
│ [All][Races][Social][System]       │ ← Filter tabs
│                                     │
│ 🆕 Today                            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🏁 Race Starting Soon            │ │
│ │ Winter Championship starts in 1h │ │
│ │ 10 minutes ago                   │ │
│ │                                  │ │ ← Notification card
│ │ [View Race] [Dismiss]           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💬 New Feedback from Coach       │ │
│ │ Sarah left feedback on your      │ │
│ │ Dec 15 session                   │ │
│ │ 2 hours ago                      │ │
│ │                                  │ │
│ │ [View Feedback] [Dismiss]       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📅 Yesterday                        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎯 AI Analysis Ready             │ │
│ │ Your Dec 15 race has been        │ │
│ │ analyzed                         │ │
│ │ Yesterday at 8:45 PM             │ │
│ │                                  │ │
│ │ [View Analysis] [Dismiss]       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Mark All as Read]                  │
└─────────────────────────────────────┘
```

---

## Implementation Guidelines

### Screen State Patterns

Every screen should handle these states:

1. **Loading State**: Skeleton screens or shimmer effect
2. **Empty State**: Helpful illustration + primary CTA
3. **Error State**: Clear message + retry action
4. **Success State**: Confirmation + next action
5. **Offline State**: Indicate offline mode + available actions

### Form Best Practices

1. **Smart Defaults**: Pre-fill fields when possible
2. **Inline Validation**: Real-time feedback on errors
3. **Progress Indicators**: Show completion percentage
4. **Auto-Save**: Save drafts automatically
5. **Clear CTAs**: One primary button per screen

### Navigation Patterns

1. **Bottom Tabs**: Main sections (Dashboard, Races, Profile)
2. **Stack Navigation**: Drill-down flows (List → Detail)
3. **Modal**: Temporary tasks (Create, Filter, Settings)
4. **Bottom Sheet**: Quick actions and filters

### Performance Considerations

1. **Lazy Loading**: Load data as needed
2. **Image Optimization**: Use appropriate sizes
3. **List Virtualization**: For long lists (>50 items)
4. **Debounce Search**: Wait 300ms after typing
5. **Cache Data**: Offline-first approach

### Accessibility Requirements

1. **Min Touch Target**: 44x44px (iOS), 48x48px (Android)
2. **Color Contrast**: 7:1 for outdoor visibility
3. **Screen Readers**: Proper labels and hints
4. **Dynamic Type**: Support system font sizes
5. **Reduced Motion**: Respect accessibility settings

---

## Next Documents

With screen designs complete, the remaining documents will cover:

1. **INTERACTION_PATTERNS.md**: Animations, transitions, and micro-interactions
2. **NAVIGATION_ARCHITECTURE.md**: Complete navigation flows and information architecture
3. **ACCESSIBILITY.md**: Comprehensive accessibility guidelines and testing

All designs follow the established Design System and use components from the Component Library.
