# Product Requirements Document: Sailor Onboarding Flow

## Overview
**Product**: RegattaFlow Sailor Onboarding
**Target User**: Competitive sailors (Primary Persona: Bram Van Olsen - Dragon class, international competitor)
**Goal**: Onboard sailors quickly with essential profile setup, venue selection, crew management, and coach connections
**Platform**: React Native (iOS/Android/Web via Expo)

## User Flow Summary
5-step linear onboarding flow with progress indicators:
1. **Welcome & Profile Setup** - Name, sailing experience, boat class
2. **Home Venue Selection** - Primary sailing location with global venue intelligence
3. **Boat Configuration** - Boat details and equipment preferences
4. **Crew Management** - Add crew members with roles
5. **Coach Selection** - Connect with registered coaches (optional)

---

## Screen Specifications

### Step 1 of 5: Welcome & Profile Setup

**Purpose**: Capture sailor's basic information and sailing background

**Layout**:
- Progress: 1/5 (20% filled)
- Header: "Welcome to RegattaFlow"
- Subheader: "Let's set up your sailing profile"

**Form Fields**:
1. **Full Name** (required)
   - Type: Text input
   - Placeholder: "Enter your full name"
   - Validation: Minimum 2 characters

2. **Sailing Experience** (required)
   - Type: Dropdown/Select
   - Options:
     - "Beginner (0-2 years)"
     - "Intermediate (3-5 years)"
     - "Advanced (6-10 years)"
     - "Expert (10+ years)"
     - "Professional"

3. **Primary Boat Class** (required)
   - Type: Searchable dropdown
   - Popular options shown first:
     - Dragon
     - J/70
     - Etchells
     - Swan 47
     - Laser
     - 470
     - [+ search all boat classes]
   - Allow multiple selections for sailors who race multiple classes

4. **Racing Goals** (optional)
   - Type: Multi-select chips
   - Options:
     - "Local Club Racing"
     - "National Championships"
     - "International Regattas"
     - "World Championships"
     - "Olympic Campaign"
     - "Recreational/Learning"

**Actions**:
- Primary button: "Continue to Venue Setup" → Step 2
- Skip link: "Skip for now" (saves partial data, goes to Step 2)

**Validation**:
- Name, Experience, and at least one Boat Class required to proceed
- Show inline error messages for invalid inputs

---

### Step 2 of 5: Home Venue Selection

**Purpose**: Establish sailor's primary sailing location to activate venue intelligence system

**Layout**:
- Progress: 2/5 (40% filled)
- Header: "Select Your Home Venue"
- Subheader: "We'll provide local weather, race intelligence, and cultural insights for your location"

**Search & Selection**:
1. **Location Detection** (optional)
   - Button: "Use My Current Location" with GPS icon
   - Automatically detects nearby venues via GPS
   - Shows loading state: "Detecting nearby venues..."

2. **Manual Venue Search**
   - Type: Search input with autocomplete
   - Placeholder: "Search sailing venues (e.g., Hong Kong, San Francisco Bay)"
   - Shows results as user types (min 3 characters)
   - Results show:
     - Venue name
     - City, Country
     - Small map preview icon
     - Distance from current location (if GPS enabled)

3. **Popular Venues** (shown before search)
   - Display 6-8 major global venues as quick-select cards:
     - Royal Hong Kong Yacht Club
     - San Francisco Bay
     - Solent (UK)
     - Sydney Harbour
     - Newport, RI
     - Lake Garda
     - Cowes, Isle of Wight
     - Valencia, Spain

**Venue Card Display**:
- Venue name (bold)
- Location (city, country)
- Small flag icon for country
- "Select" button/tap area

**Selected Venue Preview**:
- Show selected venue with checkmark
- Display: "Your home venue: [Venue Name]"
- Option to "Change" selection

**Actions**:
- Primary button: "Continue to Boat Setup" → Step 3
- Secondary link: "Skip for now" (can add later, but reduces app value)

**Data Activated**:
- Regional intelligence loaded
- Weather API region selected (HKO, NOAA, ECMWF, etc.)
- Cultural profile applied (language, protocols)
- Offline data caching initiated

---

### Step 3 of 5: Boat Configuration

**Purpose**: Capture sailor's boat details for equipment tracking and performance analytics

**Layout**:
- Progress: 3/5 (60% filled)
- Header: "Add Your Boat"
- Subheader: "Track your equipment setup and performance"

**Form Fields**:
1. **Boat Name** (optional)
   - Type: Text input
   - Placeholder: "e.g., 'Dragon Fire', 'Windward Bound'"
   - Info tooltip: "Give your boat a name for easy identification"

2. **Boat Class** (pre-filled from Step 1, editable)
   - Type: Dropdown
   - Pre-populated with primary boat class from Step 1
   - Allow change if different boat

3. **Sail Number** (optional)
   - Type: Text input
   - Placeholder: "Enter sail number"
   - Format: Alphanumeric, 2-10 characters

4. **Boat Owner** (required)
   - Type: Radio buttons
   - Options:
     - "I own this boat"
     - "I crew on this boat"
     - "Club/Team boat"

5. **Equipment Preferences** (optional)
   - Type: Multi-select section
   - Expandable section: "Track my equipment setup"
   - Options:
     - Sails (inventory)
     - Rigging (mast, boom, etc.)
     - Electronics (instruments)
     - Safety gear
   - Note: "You can add detailed equipment inventory later"

**Actions**:
- Primary button: "Continue to Crew" → Step 4
- Secondary link: "Skip boat setup" (not recommended for full experience)
- Tertiary link: "Add another boat" (for multi-boat sailors)

**Multi-Boat Support**:
- If user selects "Add another boat", repeat form
- Show list of added boats with edit/remove options
- Set one boat as "Primary"

---

### Step 4 of 5: Manage Your Crew

**Purpose**: Add crew members and assign roles for team coordination

**Layout**:
- Progress: 4/5 (80% filled)
- Header: "Manage Your Crew"
- Subheader: "Add crew members, assign roles, and set communication preferences"

**Crew List Display**:
- Show added crew members as cards:
  - Avatar/initials circle
  - Name
  - Role (e.g., "Tactician", "Trimmer")
  - Edit/Remove icons

**Add New Crew Member Form**:
1. **Crew Member Name** (required)
   - Type: Text input or email search
   - Placeholder: "Enter crew member name"
   - Search RegattaFlow users by email (auto-link if registered)

2. **Crew Role** (required)
   - Type: Dropdown
   - Options:
     - Helmsman/Skipper
     - Tactician
     - Trimmer
     - Bowman
     - Pit
     - Grinder
     - Navigator
     - General Crew
     - Other (custom)

3. **Contact Information** (optional, expandable)
   - Email address
   - Phone number
   - Note: "Invite them to RegattaFlow" option if not registered

**Actions**:
- Secondary button: "+ Add Crew Member" (repeatable)
- Primary button: "Continue to Review" → Step 5
- Skip link: "Skip crew setup" (solo sailors or add later)

**Validation**:
- At least name and role required per crew member
- Duplicate detection: "This person is already on your crew"
- RegattaFlow user detection: "This user is registered! They'll be notified."

---

### Step 5 of 5: Add Your Coaches

**Purpose**: Connect sailors with registered coaches for lessons and performance analysis

**Layout**:
- Progress: 5/5 (100% filled)
- Header: "Add Your Coaches"
- Subheader: "Select coaches already registered in RegattaFlow"

**Coach Selection Method**:

**Option A: Select from Registered Coaches**
1. **Search Coaches**
   - Type: Search input
   - Placeholder: "Search coaches..."
   - Filters:
     - By name
     - By boat class expertise
     - By location/venue
     - By coaching style (tactical, technical, mental, fitness)

2. **Available Coaches List**
   - Display as cards:
     - Coach avatar/photo
     - Coach name
     - Coaching role (e.g., "Head Coach", "Tactical Coach")
     - Expertise tags (e.g., "Dragon", "Starts", "Downwind")
     - Location/venue (e.g., "Hong Kong")
     - Select/Add button (+ icon or "Add" button)

3. **Selected Coaches Section**
   - Header: "Selected Coaches (X)"
   - Show selected coaches with:
     - Avatar
     - Name
     - Role
     - "Remove" button

**Option B: Invite Coach (Not Registered)**
- Link: "My coach isn't listed - Send invitation"
- Form:
  - Coach name
  - Coach email
  - Optional message
- Action: "Send Invitation" (sends RegattaFlow invite)

**Pre-Selected Coaches** (from Step 4 context):
- If crew members are also coaches, suggest them
- Show as "Sarah Johnson - Head Coach" (already selected in screenshot)

**Actions**:
- Primary button: "Complete Setup" → Dashboard
- Skip link: "Skip for now" (coaches are optional)
- Secondary button: "+ Invite Coach" (for non-registered coaches)

**Post-Selection**:
- Show confirmation: "You've added X coaches!"
- Note: "Coaches will be notified and can access your performance data (you can manage permissions later)"

---

## Success Criteria

**Completion Metrics**:
- 80%+ of sailors complete all 5 steps
- Average completion time: < 3 minutes
- Venue selection rate: 90%+ (critical for app value)
- Coach connection rate: 40%+ (aspirational)

**Data Quality**:
- 95%+ have valid name and boat class
- 85%+ have home venue selected
- 60%+ have at least one crew member added

**User Experience**:
- Mobile-responsive design (works on phones, tablets, desktop)
- Smooth animations between steps
- Clear progress indication
- Easy back navigation (not starting over)

---

## Technical Requirements

### Data Models

**User Profile** (created/updated in Step 1):
```typescript
{
  id: uuid,
  full_name: string,
  sailing_experience: enum,
  primary_boat_class: string,
  boat_classes: string[],
  racing_goals: string[],
  created_at: timestamp
}
```

**Sailor Boats** (Step 3):
```typescript
{
  id: uuid,
  user_id: uuid (FK),
  boat_name: string | null,
  boat_class: string,
  sail_number: string | null,
  ownership_type: enum,
  is_primary: boolean,
  created_at: timestamp
}
```

**Crew Members** (Step 4):
```typescript
{
  id: uuid,
  boat_id: uuid (FK),
  user_id: uuid | null (if registered),
  name: string,
  role: string,
  email: string | null,
  phone: string | null,
  created_at: timestamp
}
```

**Saved Venues** (Step 2):
```typescript
{
  id: uuid,
  user_id: uuid (FK),
  venue_id: uuid (FK to sailing_venues),
  is_home_venue: boolean,
  created_at: timestamp
}
```

**Coach Connections** (Step 5):
```typescript
{
  id: uuid,
  sailor_id: uuid (FK),
  coach_id: uuid (FK),
  status: enum ('pending', 'accepted', 'declined'),
  created_at: timestamp
}
```

### API Endpoints

**Onboarding Service**:
- `POST /api/onboarding/profile` - Create/update sailor profile (Step 1)
- `POST /api/onboarding/venue` - Save home venue (Step 2)
- `POST /api/onboarding/boat` - Add boat configuration (Step 3)
- `POST /api/onboarding/crew` - Add crew members (Step 4)
- `POST /api/onboarding/coaches` - Connect coaches (Step 5)
- `POST /api/onboarding/complete` - Mark onboarding complete

**Venue Intelligence Service**:
- `GET /api/venues/search?q={query}` - Search venues
- `GET /api/venues/nearby?lat={lat}&lng={lng}` - GPS-based venue detection
- `GET /api/venues/{id}/intelligence` - Load regional intelligence

**Coach Discovery Service**:
- `GET /api/coaches?boat_class={class}&location={venue}` - Search coaches
- `POST /api/coaches/invite` - Invite non-registered coach

### RLS Policies

**Supabase Row Level Security**:
- Users can only view/edit their own profile
- Users can only view/edit boats they own/crew on
- Crew members visible only to boat owner
- Coach connections visible to both sailor and coach
- Venue data is public (read-only for all)

### Offline Support (Mobile)

**Critical Data to Cache**:
- User profile (all steps)
- Home venue intelligence data
- Boat configurations
- Crew member list
- Coach connections

**Sync Strategy**:
- Queue onboarding actions if offline
- Sync when connection restored
- Show "Saved locally - will sync when online" message

---

## Design Guidelines (RapidNative Context)

### Visual Design
- **Progress Bar**: Linear, 5 segments, blue fill, 20% increment per step
- **Primary Button**: Blue (#2563EB), full-width on mobile, min-width 200px on desktop
- **Input Fields**: Rounded corners, subtle border, focus state with blue ring
- **Skip Links**: Gray text, smaller font, positioned below primary button

### Responsive Breakpoints
- **Mobile**: < 768px (stacked layout, full-width inputs)
- **Tablet**: 768px - 1024px (centered form, max-width 600px)
- **Desktop**: > 1024px (centered form, max-width 700px, sidebar navigation)

### Accessibility
- **WCAG AA compliance** for all form inputs
- **Keyboard navigation** support (tab order, Enter to submit)
- **Screen reader** labels for all form fields
- **Error messages** clearly associated with inputs

### Animations
- **Step transitions**: Slide left (forward) / slide right (back)
- **Progress bar**: Smooth fill animation (0.3s ease)
- **Form validation**: Shake animation on error, green checkmark on success

---

## Implementation Phases

### Phase 1: Core Flow (MVP)
- Steps 1-2 (Profile + Venue) - CRITICAL for app value
- Basic form validation
- Supabase integration
- Mobile responsive design

### Phase 2: Team Features
- Steps 3-4 (Boat + Crew)
- Multi-boat support
- Crew invitations

### Phase 3: Coach Marketplace Integration
- Step 5 (Coach Selection)
- Coach search and filtering
- Coach invitation system

### Phase 4: Enhancements
- GPS venue detection
- Offline support
- Onboarding analytics
- A/B testing for conversion optimization

---

## Open Questions / Decisions Needed

1. **Venue Database**: Do we have 147+ venues loaded and ready for Step 2? (per CLAUDE.md context)
2. **Coach Approval Flow**: Do coaches need to approve sailor connections, or auto-accept?
3. **Multi-Boat Priority**: Should we encourage single boat in onboarding, add more later?
4. **Skip Behavior**: If sailors skip steps, when/how do we prompt them to complete?
5. **Social Proof**: Should we show "X sailors from your venue" or "Y coaches in your area" to drive completion?

---

## RapidNative Integration Notes

**Copy/Paste to RapidNative**:
1. Create new project: "RegattaFlow Sailor Onboarding"
2. Set screen count: 5 screens
3. For each screen (Step 1-5):
   - Copy the "Layout" section as screen description
   - Copy "Form Fields" as input specifications
   - Copy "Actions" as button configurations
4. Set data models from "Technical Requirements"
5. Configure navigation: Linear flow (1→2→3→4→5→Dashboard)

**Design System Export**:
- Request RapidNative to match RegattaFlow brand colors
- Primary: #2563EB (blue)
- Font: System default (SF Pro on iOS, Roboto on Android)
- Spacing: 16px grid system

---

**Document Version**: 1.0
**Last Updated**: 2025-10-03
**Author**: RegattaFlow Product Team
