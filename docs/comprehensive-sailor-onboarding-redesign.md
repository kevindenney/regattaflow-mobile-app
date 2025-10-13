# Comprehensive Sailor Onboarding Redesign

## Overview
Complete redesign of sailor onboarding to collect all sailing information upfront in a structured form, then deliver immediate value with next race strategy.

## New Onboarding Flow

### Step 1: Comprehensive Profile Form (Single Page)
**Replace:** `sailor-onboarding-freeform.tsx`

**Sections:**

#### 1. Personal Sailing Info
- **Name** (text)
- **Role** (dropdown: Owner / Crew / Both)
- **Years Sailing** (number)
- **Experience Level** (dropdown: Beginner / Intermediate / Advanced / Expert)

#### 2. Boats & Equipment
- **Boat Class(es)** (multi-input with + button)
  - Class name
  - Sail number
  - Boat name (optional)
  - Hull maker
  - Rig/mast maker
  - Role on this boat (Owner/Crew)
  - Primary boat? (checkbox)

#### 3. Where You Sail
- **Home Yacht Club** (text + URL field)
  - Club name
  - Club website URL
- **Additional Clubs** (+ to add more)
- **Home Venue** (text)
  - Venue name
  - GPS coordinates (optional)
- **Regular Racing Venues** (+ to add more)

#### 4. Sailing Organizations & Documents
**Class Associations:**
- Class association URL (e.g., https://intdragon.net)
- Auto-detect: Class rules, tuning guides, fleet lists

**Equipment Tuning Guides:**
- Sail maker tuning guide URLs (North Sails, Quantum, etc.)
- Rig tuning guides

**Racing Documents:**
- Race calendar CSV/URL
- Standard sailing instructions URL
- Race area maps URL
- Other documents (+ to add more)

#### 5. Next Race (REQUIRED)
**Must complete before proceeding:**
- **Race Name** (text) *
- **Date** (date picker) *
- **Start Time** (time picker) *
- **Location** (text with autocomplete from venues) *
- **Notice of Race URL** (optional but recommended)
- **Sailing Instructions URL** (optional but recommended)
- **Course Map URL** (optional)

**Visual Indicator:** "Required for strategy recommendations"

---

### Step 2: Processing & Web Scraping
**Enhanced `sailor-onboarding-processing.tsx`**

Shows progress:
1. ✓ Extracting information from form
2. ⏳ Scraping club websites (3/5 complete)
3. ⏳ Parsing race documents (2/4 complete)
4. ⏳ Loading class information
5. ⏳ Loading tuning guides
6. Pending: Generating race strategy

**What Gets Scraped:**
- **Club websites** → Events, race calendars, member info
- **Class associations** → Fleet lists, class rules, upcoming events
- **Race documents** → Course details, marks, procedures
- **Tuning guides** → Settings for forecasted conditions

---

### Step 3: Review & Confirm
**Enhanced `sailor-onboarding-confirm.tsx`**

**Show extracted data organized by category:**

1. **Your Profile**
   - Name, role, experience
   - Edit buttons for each field

2. **Your Boats** (cards)
   - Dragon #D59 "Phoenix"
   - Owner | Hull: Petticrows | Rig: Selden
   - [Edit] [Remove]

3. **Where You Sail**
   - Royal Hong Kong Yacht Club
   - Victoria Harbour, Hong Kong
   - [Edit]

4. **Fleet Mates Discovered** (if any)
   - Found 24 Dragon sailors at RHKYC
   - [View List]

5. **Upcoming Races Found** (from scraped data)
   - Croucher Series - Race 3 (Mar 15)
   - Lipton Trophy (Apr 2)
   - Select races you're entering ☑️

6. **Next Race Details** ⭐
   **Required fields highlighted:**
   - ✓ Race: Croucher Series Race 3
   - ✓ Date: March 15, 2025
   - ✓ Time: 14:00
   - ✓ Location: Victoria Harbour
   - ✓ Documents: NOR, SIs, Course Map attached

   **Missing Required Info:**
   - ⚠️ Please confirm next race start time
   - ⚠️ Add race location coordinates for accurate weather

**Action Buttons:**
- [Back to Edit Form]
- [Continue to Race Strategy] (enabled only when next race complete)

---

### Step 4: Next Race Strategy Screen (NEW)
**Replace dashboard as primary post-onboarding destination**

**File:** `src/app/(tabs)/next-race-strategy.tsx`

**Layout:**

#### Hero Section
```
🏆 CROUCHER SERIES - RACE 3
📅 Saturday, March 15, 2025
⏰ Start: 14:00 HKT
📍 Victoria Harbour, Hong Kong

[📄 View Documents] [⚙️ Race Settings]
```

#### Weather Forecast (Primary)
```
┌─────────────────────────────────────┐
│  RACE DAY FORECAST                  │
│  Updated: 2 hours ago               │
├─────────────────────────────────────┤
│  🌬️  WIND                           │
│  12-15 knots                        │
│  Direction: NE (45°)                │
│  Gusts: Up to 18 knots              │
│                                     │
│  🌊  WAVES                          │
│  0.5-0.8m                           │
│  Period: 4s                         │
│                                     │
│  🌊  TIDE                           │
│  High: 13:45 (1.8m)                │
│  Current: Flooding 0.5kts NE       │
│  at race start                      │
│                                     │
│  ☁️  CONDITIONS                     │
│  Partly cloudy, 24°C               │
│  Visibility: 10km                   │
└─────────────────────────────────────┘
```

#### Recommended Setup
```
┌─────────────────────────────────────┐
│  🎯 RECOMMENDED BOAT SETUP          │
│  For Dragon in 12-15 kts           │
├─────────────────────────────────────┤
│  HULL                               │
│  • Mast rake: 6520mm               │
│  • Shroud tension: 350 lbs         │
│  • Forestay: 400 lbs               │
│                                     │
│  SAILS                              │
│  • Main: Full cunningham           │
│  • Jib: Medium tension             │
│  • Spinnaker: All-purpose          │
│                                     │
│  TRIM                               │
│  • Traveler: 2-4" to windward     │
│  • Backstay: Medium                │
│  • Vang: Moderate                  │
│                                     │
│  [View Full Tuning Guide]          │
└─────────────────────────────────────┘
```

#### Race Strategy
```
┌─────────────────────────────────────┐
│  📋 TACTICAL RECOMMENDATIONS        │
├─────────────────────────────────────┤
│  START                              │
│  • Pin end favored by 5° with NE   │
│  • Current pushing to starboard    │
│  • Target: Pin end, timed run      │
│                                     │
│  UPWIND                             │
│  • Right side favored (less tide)  │
│  • Expect 5-10° right shift        │
│  • Avoid middle - stronger current │
│                                     │
│  DOWNWIND                           │
│  • Jibe early to avoid current     │
│  • Stay right for pressure         │
│                                     │
│  [View Course Map] [View Full Strategy] │
└─────────────────────────────────────┘
```

#### Quick Actions
```
[⏱️ Start Race Timer]
[📍 View Course Map 3D]
[👥 See Fleet Mates]
[📊 Past Performance at This Venue]
```

#### Bottom Nav (Modified)
```
[🏁 Next Race] [📅 Calendar] [📈 Analytics] [⚙️ Profile]
     (ACTIVE)
```

---

## Data Requirements

### For Weather Forecast:
- Race location (GPS coordinates)
- Race date & time
- Integration with weather APIs:
  - Hong Kong Observatory (HKO) for HK
  - NOAA for US
  - Met Office for UK
  - Regional weather services

### For Tuning Recommendations:
- Boat class
- Hull/rig maker
- Tuning guide URLs (scraped)
- Weather conditions (wind speed/direction)

### For Tactical Strategy:
- Course map (from SIs/NOR)
- Tide tables (location-based)
- Current patterns (venue-specific)
- Wind patterns (historical + forecast)
- Mark locations

---

## Implementation Priority

### Phase 1: Comprehensive Form (Week 1)
1. Build single-page form with all sections
2. Add validation for required fields
3. Ensure next race section is complete
4. Add document URL fields with type selectors

### Phase 2: Enhanced Processing (Week 1-2)
1. Scrape all provided URLs
2. Extract race calendars, fleet lists
3. Parse racing documents
4. Load tuning guides

### Phase 3: Review Screen (Week 2)
1. Show all extracted data
2. Allow editing before confirmation
3. Validate next race completeness
4. Show preview of what strategy will include

### Phase 4: Next Race Strategy Screen (Week 2-3)
1. Create new primary screen
2. Integrate weather API
3. Display forecast prominently
4. Generate tuning recommendations
5. Create tactical strategy based on conditions

### Phase 5: Intelligence Layer (Week 3-4)
1. AI-powered tuning recommendations
2. Course analysis from documents
3. Tactical suggestions based on conditions
4. Learn from past performance

---

## User Experience Flow

```
Sign Up → Select "Sailor" →
  ↓
Comprehensive Form (all fields) →
  ↓
Processing & Scraping (loading screen) →
  ↓
Review & Confirm (edit extracted data) →
  ↓
Next Race Strategy Screen (PRIMARY DESTINATION) →
  ↓
[Race Timer] or [View Calendar] or [Analytics]
```

**Key Principle:** User cannot proceed without complete next race info. This ensures everyone gets immediate value: a race strategy with weather-based recommendations.

---

## Success Metrics

1. **Onboarding Completion Rate:** % who complete full form
2. **Next Race Data Quality:** % with complete weather-ready data
3. **Strategy Engagement:** % who view recommendations
4. **Time to Value:** Minutes from signup to seeing strategy
5. **Retention:** % who return before race day

---

## Technical Notes

- **Form State Management:** Use React Hook Form for validation
- **Weather API:** Integrate HKO, NOAA, OpenWeather based on location
- **Document Parsing:** Use existing AI document parsing tools
- **Course Visualization:** MapLibre GL for 3D course maps
- **Real-time Updates:** Weather updates every 2 hours before race
