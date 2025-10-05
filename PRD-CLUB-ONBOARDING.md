# Product Requirements Document: Club/Race Committee Onboarding Flow

## Overview
**Product**: RegattaFlow Club & Race Committee Onboarding
**Target User**: Sailing clubs, race committees, and regatta organizers (Primary Persona: John Smith - Race Committee Chair, Royal Hong Kong Yacht Club)
**Goal**: Onboard clubs quickly with organization setup, race management tools, results publishing, and fleet management
**Platform**: React Native (iOS/Android/Web via Expo)

## User Flow Summary
7-step linear onboarding flow with progress indicators:
1. **Welcome & Organization Profile** - Club name, type, location
2. **Venue & Facilities Setup** - Sailing venue configuration, marina details
3. **Fleet & Class Management** - Configure boat classes, divisions
4. **Race Committee Setup** - Add officials, roles, permissions
5. **Racing Calendar** - Add regattas, series, and events
6. **Subscription & Billing** - Select plan and payment method
7. **Integration & Launch** - Connect systems, publish club profile

---

## Screen Specifications

### Step 1 of 7: Welcome & Organization Profile

**Purpose**: Capture club's basic information and organization type

**Layout**:
- Progress: 1/7 (14.3% filled)
- Header: "Welcome to RegattaFlow Clubs"
- Subheader: "Streamline your race management and grow your sailing community"

**Form Fields**:
1. **Organization Name** (required)
   - Type: Text input
   - Placeholder: "e.g., Royal Hong Kong Yacht Club"
   - Validation: Minimum 3 characters

2. **Organization Type** (required)
   - Type: Dropdown/Select
   - Options:
     - "Yacht Club (Private membership)"
     - "Yacht Club (Public/Community)"
     - "Sailing School/Academy"
     - "Class Association (e.g., Dragon Class)"
     - "Regatta Organizing Authority"
     - "National/Regional Sailing Federation"
     - "University/College Sailing Team"
     - "Other"

3. **Organization Acronym/Short Name** (optional)
   - Type: Text input
   - Placeholder: "e.g., RHKYC, SFYC, NYYC"
   - Note: "Used in race results and communications"

4. **Founded Year** (optional)
   - Type: Number input
   - Placeholder: "e.g., 1849"
   - Range: 1800-2025

5. **Total Members** (optional)
   - Type: Number input
   - Placeholder: "e.g., 2400"
   - Used for pricing tier suggestions

6. **Contact Information** (required)
   - Primary Contact Name
   - Email (pre-filled from auth)
   - Phone number (with country code picker)
   - Website URL (optional)

7. **Organization Logo** (optional but recommended)
   - Type: Image upload
   - Requirements: Min 200x200px, max 5MB
   - Formats: PNG, JPG, SVG
   - Display: Used in race documents, website, results

**Actions**:
- Primary button: "Continue to Venue Setup" → Step 2
- Skip link: "Complete later" (saves partial data)

**Validation**:
- Organization name and type required
- Email validation with domain check
- Phone number international format validation

---

### Step 2 of 7: Venue & Facilities Setup

**Purpose**: Configure sailing venue, location, and club facilities

**Layout**:
- Progress: 2/7 (28.6% filled)
- Header: "Set Up Your Sailing Venue"
- Subheader: "Define your racing area and club facilities"

**Venue Configuration**:

1. **Venue Location** (required)
   - Option A: **Select Existing Venue**
     - Search from 147+ global sailing venues
     - Placeholder: "Search existing venues..."
     - Shows: Venue name, city, country, coordinates
     - If found: "Use existing venue data" (pre-populated)

   - Option B: **Create New Venue**
     - Venue name
     - Street address
     - City
     - State/Province
     - Country (dropdown)
     - GPS Coordinates (auto-detected or manual)
     - Timezone (auto-detected from location)

2. **Racing Areas** (required)
   - Type: Multi-area configuration
   ```
   Primary Racing Area:
   - Name: e.g., "Victoria Harbour East"
   - Typical Wind Conditions: dropdown
     • Inland protected
     • Coastal moderate
     • Open ocean
     • Lake/reservoir
   - Tidal Influence: Yes/No
   - Current Strength: 0-5+ knots

   [+ Add Additional Racing Area]
   (for clubs with multiple courses)
   ```

3. **Marina & Facilities** (optional):
   ```
   Marina Information:
   ☐ Dinghy storage (capacity: ___ boats)
   ☐ Keelboat marina (berths: ___ slips)
   ☐ Boat ramp/hoist (max weight: ___ tons)
   ☐ Dry storage (capacity: ___ boats)

   Clubhouse Facilities:
   ☐ Restaurant/Bar
   ☐ Changing rooms/Showers
   ☐ Race office
   ☐ Classroom/Training room
   ☐ Chandlery/Pro shop
   ☐ Boat repair/Rigging services

   Parking:
   • Spots available: ___ spaces
   • Trailer parking: Yes/No
   ```

4. **Venue Intelligence** (auto-populated if existing venue):
   - Display: "We've loaded regional intelligence for this venue"
   - Shows:
     - Weather data sources (HK Observatory, NOAA, etc.)
     - Tidal/current data availability
     - Historical racing data
     - Cultural/language settings

**Map Integration**:
- Interactive map to define racing area boundaries
- Drop pins for common mark locations
- Visualize wind patterns (if available)
- Set restricted zones (shipping lanes, etc.)

**Actions**:
- Primary button: "Continue to Fleet Setup" → Step 3
- Secondary button: "Back" → Step 1
- Link: "I'll configure venue details later"

**Validation**:
- Venue location (existing or new) required
- At least one racing area configured
- GPS coordinates validated (if manual entry)

---

### Step 3 of 7: Fleet & Class Management

**Purpose**: Configure boat classes, divisions, and fleet organization

**Layout**:
- Progress: 3/7 (42.9% filled)
- Header: "Configure Your Fleets"
- Subheader: "Set up boat classes and racing divisions"

**Fleet Configuration**:

1. **Primary Boat Classes** (required, min 1):
   - Type: Multi-select with search
   - Popular classes shown first:
     - Dragon
     - J/70
     - Etchells
     - Laser/ILCA
     - 420
     - Optimist
     - [+ search all boat classes]

   For each selected class:
   ```
   ┌───────────────────────────────────┐
   │ Dragon Class                       │
   │                                    │
   │ Fleet Size: ____ boats (active)    │
   │ Handicap System:                   │
   │ • ☐ One-Design (no handicap)       │
   │ • ☐ Portsmouth Yardstick           │
   │ • ☐ PHRF                           │
   │ • ☐ IRC                            │
   │ • ☐ ORC                            │
   │ • ☐ Custom club handicap           │
   │                                    │
   │ Racing Format:                     │
   │ • ☐ Fleet racing                   │
   │ • ☐ Match racing                   │
   │ • ☐ Team racing                    │
   │                                    │
   │ Typical Course:                    │
   │ • Windward-Leeward (laps: ___)     │
   │ • Trapezoid                        │
   │ • Olympic Triangle                 │
   │ • Round-the-buoys                  │
   │ • Distance race                    │
   │                                    │
   │ [Remove Class] [Configure Details] │
   └───────────────────────────────────┘
   ```

2. **Racing Divisions** (optional):
   - Create custom divisions for mixed fleets
   - Examples:
     - "Cruising Division"
     - "Racing Division"
     - "Junior Division (U18)"
     - "Women's Division"
     - "Novice Division"

   For each division:
   - Division name
   - Eligible boat classes (multi-select)
   - Start sequence (separate start, combined, pursuit)
   - Handicap system (if applicable)

3. **Series & Championships** (optional):
   - Configure regular racing series
   - Examples:
     - "Spring Series" (8 races, March-May)
     - "Wednesday Night Beer Can" (weekly)
     - "Club Championship" (10 races, year-long)

   For each series:
   ```
   Series Name: ________________
   Format:
   • ☐ Points series (drop worst races)
   • ☐ Cumulative points
   • ☐ Championship final

   Scoring:
   • Low Point System (RRS Appendix A)
   • Bonus Point System
   • Custom scoring

   Drops: ___ worst races dropped
   Minimum Races: ___ to qualify
   ```

4. **Fleet Captain/Coordinators** (optional):
   - Assign fleet captains per boat class
   - Name, email, phone
   - Responsibilities: Fleet communications, social events

**Class Association Integration**:
- Option to link to official class associations
- Import class rules and restrictions
- Auto-update boat database with new members

**Actions**:
- Primary button: "Continue to Race Committee" → Step 4
- Secondary button: "Back" → Step 2
- Link: "+ Add Custom Boat Class" (for unique boats)

**Validation**:
- At least one boat class required
- Handicap system required for mixed-class divisions

---

### Step 4 of 7: Race Committee Setup

**Purpose**: Add race officials and configure permissions

**Layout**:
- Progress: 4/7 (57.1% filled)
- Header: "Build Your Race Committee"
- Subheader: "Add officials and assign race management roles"

**Race Official Roles**:

1. **Principal Race Officer (PRO)** (required):
   ```
   ┌───────────────────────────────────┐
   │ PRIMARY PRO                        │
   │                                    │
   │ Name: John Smith                   │
   │ Email: john@rhkyc.org.hk          │
   │ Phone: +852-XXXX-XXXX             │
   │                                    │
   │ Certifications:                    │
   │ • World Sailing Race Officer       │
   │ • National Judge Level 3           │
   │                                    │
   │ RegattaFlow Permissions:           │
   │ ✅ Create races                     │
   │ ✅ Modify courses                   │
   │ ✅ Post results                     │
   │ ✅ Manage entries                   │
   │ ✅ Publish SIs/NORs                 │
   │ ✅ Admin dashboard access           │
   │                                    │
   │ [Edit] [Remove]                    │
   └───────────────────────────────────┘

   [+ Add Backup PRO]
   ```

2. **Additional Race Committee Positions** (optional):
   - Type: Multi-person assignment

   Available Roles:
   ```
   ☐ Assistant Race Officer
   ☐ Starting Line Judge
   ☐ Finishing Line Judge
   ☐ Mark Boat Captain
   ☐ Safety Officer
   ☐ Race Committee Secretary
   ☐ Timekeeper
   ☐ Weather Observer
   ☐ VHF Radio Operator
   ☐ Results Coordinator
   ```

   For each role:
   - Assign person (name, email, phone)
   - Permissions level:
     - View only
     - View + Edit assigned duties
     - Full race management
   - Certification info (optional)

3. **Jury & Protest Committee** (optional):
   ```
   International Jury Members:
   • Name, certification level
   • Judge number (World Sailing/National)
   • Experience level

   Protest Committee:
   • Chairperson
   • Members (min 3 recommended)
   • Schedule/availability
   ```

4. **Support Crew** (optional):
   ```
   Volunteers & Support:
   • Shore crew coordinator
   • Registration desk staff
   • Social event coordinators
   • Communications/media team
   ```

**Permission System**:
```
┌───────────────────────────────────────┐
│ ROLE-BASED PERMISSIONS                │
│                                       │
│ Admin (Club Manager):                 │
│ • Full system access                  │
│ • Billing and subscription            │
│ • User management                     │
│ • All race management functions       │
│                                       │
│ Race Officer (PRO):                   │
│ • Create/edit races                   │
│ • Manage entries                      │
│ • Post results                        │
│ • Publish documents                   │
│ • View reports                        │
│                                       │
│ Race Committee Member:                │
│ • View race details                   │
│ • Edit assigned duties                │
│ • Update race status                  │
│                                       │
│ Results Coordinator:                  │
│ • Enter results                       │
│ • Edit scores                         │
│ • Publish standings                   │
│ • Manage protests/redress             │
│                                       │
│ Read-Only (General Staff):            │
│ • View races and results              │
│ • Export reports                      │
└───────────────────────────────────────┘
```

**Invite System**:
- Send email invites to race committee members
- They create RegattaFlow accounts (free for officials)
- Accept role assignment
- Access appropriate dashboard/tools

**Actions**:
- Primary button: "Continue to Calendar" → Step 5
- Secondary button: "Back" → Step 3
- Link: "I'll add race committee later"

**Validation**:
- At least one PRO required
- Valid email for all officials
- Permission levels assigned

---

### Step 5 of 7: Racing Calendar

**Purpose**: Add initial regattas, series, and events to populate calendar

**Layout**:
- Progress: 5/7 (71.4% filled)
- Header: "Set Up Your Racing Calendar"
- Subheader: "Add regattas, series, and club events"

**Quick Start Options**:

1. **Import Existing Calendar** (recommended):
   - Type: File upload or URL
   - Formats supported:
     - Excel/CSV (regatta list)
     - iCal (.ics file)
     - Google Calendar sync
     - Existing website scrape (with permission)
   - Maps columns: Date, Event Name, Class, Type

2. **Create First Regatta Manually**:
   ```
   ┌───────────────────────────────────┐
   │ CREATE REGATTA                     │
   │                                    │
   │ Event Name: ___________________    │
   │ e.g., "Spring Series 2025 R1"     │
   │                                    │
   │ Event Type:                        │
   │ • ☐ Single race                    │
   │ • ☐ Race series (multiple races)   │
   │ • ☐ Championship                   │
   │ • ☐ Invitational regatta           │
   │ • ☐ Training/Practice              │
   │                                    │
   │ Date & Time:                       │
   │ Start Date: March 15, 2025         │
   │ First Warning: 13:00 HKT          │
   │ Number of Races: ___ (series)      │
   │                                    │
   │ Boat Classes:                      │
   │ ✅ Dragon                           │
   │ ☐ J/70                             │
   │ ☐ Etchells                         │
   │                                    │
   │ Entry Method:                      │
   │ • ☐ Online registration (RegattaFlow)│
   │ • ☐ Manual entry (RC manages)      │
   │ • ☐ Class-based (open to all)      │
   │                                    │
   │ Entry Fee: $___ USD (optional)     │
   │ Entry Limit: ___ boats (optional)  │
   │ Entry Deadline: March 10, 2025     │
   │                                    │
   │ Documents:                         │
   │ ☐ Notice of Race (NOR)             │
   │ ☐ Sailing Instructions (SIs)       │
   │ ☐ Course diagrams                  │
   │                                    │
   │ [Create Regatta] [Save as Draft]   │
   └───────────────────────────────────┘
   ```

3. **Add Regular Series** (optional):
   ```
   Series Template:

   Series Name: Wednesday Night Beer Can
   Frequency: Weekly
   Day of Week: Wednesday
   Start Time: 18:00
   Duration: 8 weeks
   Start Date: April 3, 2025
   End Date: May 22, 2025

   → Auto-generates 8 individual races

   [Create Series] [Customize Each Race]
   ```

4. **Add Championship Events** (optional):
   ```
   Championship Configuration:

   Event: RHKYC Dragon Championship 2025
   Dates: June 15-17, 2025
   Races: 6 races over 3 days
   Format: Fleet racing, low point scoring
   Qualifying: Top 3 qualify for Nationals

   Schedule:
   Day 1: Races 1-2 (Saturday)
   Day 2: Races 3-4 (Sunday)
   Day 3: Races 5-6 (Monday, reserve day)

   [Create Championship] [Configure Details]
   ```

**Calendar Preview**:
- Visual calendar showing added events
- Color-coded by event type
- Click to edit/delete
- Drag-and-drop to reschedule (desktop)

**Integration Options**:
```
☐ Publish to club website (embed widget)
☐ Sync to Google Calendar (public)
☐ Export iCal feed (for sailors)
☐ Send to RegattaNetwork.com
☐ Send to SailRaceWin
```

**Actions**:
- Primary button: "Continue to Subscription" → Step 6
- Secondary button: "Back" → Step 4
- Link: "Skip for now - Add races later"

**Validation**:
- At least one race/event recommended (not required)
- Valid dates (not in past)
- Boat class assignment

---

### Step 6 of 7: Subscription & Billing

**Purpose**: Select pricing plan and configure payment method

**Layout**:
- Progress: 6/7 (85.7% filled)
- Header: "Choose Your Plan"
- Subheader: "Select the best plan for your club's needs"

**Pricing Tiers**:

```
┌─────────────────────────────────────────┐
│ STARTER (FREE)                          │
│ Perfect for small clubs just getting    │
│ started                                 │
│                                         │
│ ✅ Up to 50 members                      │
│ ✅ Basic race results posting            │
│ ✅ Simple regatta calendar               │
│ ✅ Email entry management                │
│ ✅ Export results (CSV)                  │
│ ❌ Advanced scoring systems              │
│ ❌ Online sailor registration            │
│ ❌ Custom branding                       │
│ ❌ API access                            │
│                                         │
│ $0/month                                │
│ [Select Starter]                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ CLUB PRO ($299/month) ⭐ RECOMMENDED    │
│ For active clubs running regular racing │
│                                         │
│ ✅ Up to 500 members                     │
│ ✅ Advanced race management              │
│ ✅ Online sailor registration            │
│ ✅ Multiple scoring systems              │
│ ✅ Automated results publishing          │
│ ✅ Custom club branding                  │
│ ✅ Email communications                  │
│ ✅ Member management tools               │
│ ✅ Analytics dashboard                   │
│ ❌ API access                            │
│ ❌ White-label solution                  │
│                                         │
│ $299/month or $2,990/year (save 17%)    │
│ [Select Club Pro]                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ENTERPRISE ($999/month)                 │
│ For major clubs and regatta organizers  │
│                                         │
│ ✅ Unlimited members                     │
│ ✅ Everything in Club Pro, plus:         │
│ ✅ API access & integrations             │
│ ✅ White-label solution                  │
│ ✅ Multi-venue support                   │
│ ✅ Priority support (24/7)               │
│ ✅ Custom features & development         │
│ ✅ Dedicated account manager             │
│ ✅ Advanced analytics & reporting        │
│ ✅ Live timing integration               │
│                                         │
│ $999/month or $9,990/year (save 17%)    │
│ [Contact Sales]                         │
└─────────────────────────────────────────┘
```

**Volume Discounts** (auto-calculated):
```
Based on your profile (2,400 members):

Recommended: Club Pro
Estimated races/year: ~80 races
Cost per race: $44.85

Enterprise may be better if:
• You run 100+ races per year
• You manage multiple venues
• You need API integrations
• You want white-label branding

[See Detailed Comparison]
```

**Payment Configuration**:

1. **Billing Frequency**:
   - Monthly ($299/month)
   - Annual ($2,990/year - Save $598!)

2. **Payment Method**:
   - Credit Card (Stripe)
     - Card number
     - Expiry date
     - CVV
     - Cardholder name
     - Billing address
   - Bank Transfer (ACH/SEPA)
   - Invoice (Enterprise only)

3. **Billing Contact**:
   - Billing email (for invoices)
   - Phone number
   - Tax ID/VAT number (optional)

**Trial Period**:
```
🎁 FREE 30-DAY TRIAL
Try Club Pro free for 30 days
No credit card required
Cancel anytime

[Start Free Trial] [Skip Trial → Pay Now]
```

**Add-Ons** (optional):
```
☐ Additional Race Officials ($49/month per 5 officials)
☐ Advanced Timing Integration ($99/month)
☐ Custom Mobile App ($499/month)
☐ Professional Results Website ($199/month)
☐ SMS Notifications ($0.10 per message)
```

**Actions**:
- Primary button: "Continue to Integration" → Step 7
- Secondary button: "Back" → Step 5
- Link: "Start with Free Plan" (skip payment)

**Validation**:
- Plan selection required
- Payment method validation (if paid plan)
- Billing email confirmation

---

### Step 7 of 7: Integration & Launch

**Purpose**: Connect external systems and publish club profile

**Layout**:
- Progress: 7/7 (100% filled)
- Header: "Finalize Your Setup"
- Subheader: "Connect systems and launch your club on RegattaFlow"

**System Integrations** (optional):

1. **Website Integration**:
   ```
   ☐ Embed race calendar widget
   → Copy code snippet for your website

   ☐ Add results iframe
   → Auto-updating results on your site

   ☐ Connect domain
   → Use results.rhkyc.org (custom subdomain)
   ```

2. **Email System**:
   ```
   ☐ Connect email provider
   • Gmail/Google Workspace
   • Microsoft 365/Outlook
   • Custom SMTP server

   → Send race notifications from club email
   → Automated entry confirmations
   → Results distribution
   ```

3. **Member Management Systems**:
   ```
   ☐ Import member database
   • Upload CSV/Excel
   • Connect to existing system (API)
   • Manual entry

   Fields: Name, Email, Boat, Sail Number, Class
   ```

4. **Timing & Scoring Systems**:
   ```
   ☐ SailWave integration
   ☐ RaceQs integration
   ☐ Sailrace integration
   ☐ Custom API connection

   → Auto-import race results
   → Sync scoring data
   ```

5. **Social Media**:
   ```
   ☐ Facebook page connection
   ☐ Instagram integration
   ☐ Twitter/X auto-posting

   → Auto-post race results
   → Share regatta announcements
   ```

**Public Profile Setup**:

1. **Club Profile Page**:
   ```
   Your club will be listed at:
   regattaflow.app/clubs/rhkyc

   Preview:
   ┌───────────────────────────────────┐
   │ [Club Logo]                        │
   │ Royal Hong Kong Yacht Club         │
   │ 🇭🇰 Hong Kong                       │
   │                                    │
   │ Founded: 1849 • Members: 2,400    │
   │ Active Fleets: Dragon, J/70, etc. │
   │                                    │
   │ Upcoming Events (3)                │
   │ Recent Results                     │
   │ About the Club                     │
   │ Contact & Membership Info          │
   └───────────────────────────────────┘

   Visibility:
   • ☐ Public (searchable by all sailors)
   • ☐ Members only (login required)
   • ☐ Private (invite only)
   ```

2. **Sailor Discovery**:
   ```
   ☐ List club in RegattaFlow directory
   ☐ Allow sailors to join/register online
   ☐ Show upcoming events in sailor app
   ☐ Enable marketplace features (coaching, etc.)
   ```

**Onboarding Checklist** (Pre-Launch):
```
✅ Organization profile complete
✅ Venue configured
✅ Fleets and classes set up
✅ Race committee assigned
✅ First regatta created
✅ Subscription activated
⚠️ Recommended next steps:
   ☐ Import member database (243 members found)
   ☐ Upload club logo and photos
   ☐ Create Notice of Race template
   ☐ Configure email notifications
   ☐ Test online registration flow
   ☐ Train race committee on system
```

**Launch Options**:

1. **Soft Launch** (recommended):
   - Enable for race committee only
   - Test with upcoming race
   - Collect feedback
   - Full launch after validation

2. **Full Launch**:
   - Immediately available to all sailors
   - Public profile visible
   - Online registrations open
   - Notifications enabled

**Setup Completion**:
```
┌─────────────────────────────────────────┐
│ 🎉 SETUP COMPLETE!                      │
│                                         │
│ Your club is ready to launch on         │
│ RegattaFlow.                            │
│                                         │
│ What's Next:                            │
│ 1. Invite your race committee           │
│ 2. Create your first race               │
│ 3. Test online registration             │
│ 4. Publish results from existing race   │
│ 5. Explore analytics dashboard          │
│                                         │
│ Need Help?                              │
│ • Watch setup tutorial (5 min)          │
│ • Schedule onboarding call              │
│ • Browse help documentation             │
│ • Contact support: support@regattaflow  │
│                                         │
│ [Launch Dashboard] [Schedule Training]  │
└─────────────────────────────────────────┘
```

**Post-Launch Communication**:
- Email sent to admin: "Welcome to RegattaFlow - Setup Complete"
- Email sent to race committee: "Invitation to join [Club Name] on RegattaFlow"
- Optional: Social media announcement templates provided

**Actions**:
- Primary button: "Launch Club Dashboard" → Club Dashboard
- Secondary button: "Back" → Step 6
- Link: "Save as draft - Finish setup later"

---

## Success Criteria

**Completion Metrics**:
- 80%+ of clubs complete all 7 steps
- Average completion time: < 15 minutes
- Payment conversion: 60%+ select paid plans
- Trial-to-paid conversion: 70%+ after 30-day trial

**Data Quality**:
- 95%+ have complete venue configuration
- 90%+ have at least one fleet/class configured
- 85%+ have race committee assigned
- 75%+ create first regatta during onboarding

**User Experience**:
- Mobile and desktop responsive
- Inline help and tooltips throughout
- Progress saving (can resume later)
- Clear validation and error messages

---

## Technical Requirements

### Data Models

**Club Organization**:
```typescript
{
  id: uuid,
  name: string,
  acronym: string | null,
  type: enum,
  founded_year: number | null,
  total_members: number | null,
  contact_name: string,
  contact_email: string,
  contact_phone: string,
  website_url: string | null,
  logo_url: string | null,

  venue_id: uuid (FK),
  subscription_tier: 'starter' | 'club_pro' | 'enterprise',
  subscription_status: 'trial' | 'active' | 'cancelled' | 'expired',

  public_profile_visible: boolean,
  allow_online_registration: boolean,

  created_at: timestamp,
  updated_at: timestamp
}
```

**Venue Configuration**:
```typescript
{
  id: uuid,
  club_id: uuid (FK),
  venue_id: uuid (FK to sailing_venues) | null,
  racing_areas: {
    name: string,
    wind_conditions: enum,
    tidal_influence: boolean,
    current_strength: number
  }[],
  facilities: json,
  created_at: timestamp
}
```

**Fleet Configuration**:
```typescript
{
  id: uuid,
  club_id: uuid (FK),
  boat_class: string,
  fleet_size: number | null,
  handicap_system: enum | null,
  racing_format: enum,
  typical_course: enum,
  fleet_captain_id: uuid | null,
  created_at: timestamp
}
```

**Race Officials**:
```typescript
{
  id: uuid,
  club_id: uuid (FK),
  user_id: uuid (FK) | null,
  name: string,
  email: string,
  phone: string | null,
  role: enum,
  permissions: json,
  certifications: string[],
  invitation_status: 'pending' | 'accepted' | 'declined',
  created_at: timestamp
}
```

### API Endpoints

**Onboarding Service**:
- `POST /api/club/onboarding/organization` - Create club profile (Step 1)
- `POST /api/club/onboarding/venue` - Configure venue (Step 2)
- `POST /api/club/onboarding/fleets` - Add fleets/classes (Step 3)
- `POST /api/club/onboarding/officials` - Add race committee (Step 4)
- `POST /api/club/onboarding/calendar` - Add events (Step 5)
- `POST /api/club/onboarding/subscription` - Select plan & payment (Step 6)
- `POST /api/club/onboarding/integrate` - Connect systems (Step 7)
- `POST /api/club/onboarding/complete` - Mark onboarding complete & launch

**Integration Service**:
- `POST /api/club/integration/website` - Generate embed codes
- `POST /api/club/integration/email` - Connect email provider
- `POST /api/club/integration/members` - Import member database
- `POST /api/club/integration/timing` - Connect timing system

### RLS Policies

**Club Data Access**:
- Club admins can view/edit their own club data
- Race officials can view club data, edit based on permissions
- Sailors can view public club profiles
- Results are public unless club sets private

### Payment Integration (Stripe)

**Subscription Management**:
- Stripe Checkout for initial subscription
- Stripe Billing for recurring payments
- Webhook handlers for subscription events
- Trial period tracking
- Usage-based billing for add-ons
- Invoice generation and delivery

---

## Implementation Phases

### Phase 1: Core Onboarding (MVP)
- Steps 1-3 (Organization, Venue, Fleets)
- Basic subscription (Starter free, paid plans)
- Simple race committee setup
- Email invitations

### Phase 2: Advanced Features
- Full calendar integration (Step 5)
- Advanced race official permissions
- Website embed widgets
- Member database import

### Phase 3: Integrations
- Timing system connections
- Email provider integrations
- Social media auto-posting
- Custom domain support

### Phase 4: Enterprise Features
- API access for custom integrations
- White-label solutions
- Multi-venue support
- Advanced analytics

---

**Document Version**: 1.0
**Last Updated**: 2025-10-03
**Author**: RegattaFlow Product Team
