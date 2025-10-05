# Product Requirements Document: Coach Experience (Post-Onboarding)

## Overview
**Product**: RegattaFlow Coach Application (Post-Onboarding)
**Target User**: Professional sailing coaches (Primary Persona: Sarah Johnson - Olympic-level coach, multi-venue expertise, established client base)
**Goal**: Deliver professional coaching management platform with client tracking, session scheduling, performance analytics, and marketplace tools
**Platform**: React Native (iOS/Android/Web via Expo)
**Vision**: Transform sailing coaching from scattered spreadsheets and manual tracking into unified professional coaching business management

---

## Navigation Structure & Information Architecture

### Bottom Tab Navigation (Coach Mode)
```typescript
interface CoachTabNavigation {
  visibleTabs: [
    'Dashboard',      // Home - Coaching command center
    'Calendar',       // Schedule - Sessions and availability
    'Clients',        // Client - Sailor roster and progress
    'Sessions',       // Sessions - Session history and planning
    'Marketplace',    // Marketplace - Profile and bookings
    'More'            // Hamburger menu - Additional features
  ];

  hamburgerMenuItems: [
    'Profile',              // Coach profile and marketplace settings
    'Settings',             // App preferences and notifications
    'Earnings',             // Revenue, payments, and invoicing
    'Analytics',            // Business performance metrics
    'Resources',            // Coaching materials and content library
    'Certifications',       // Manage credentials and renewals
    'Availability',         // Detailed availability management
    'Messages'              // Client communication
  ];
}
```

### User Journey Architecture
```
Post-Onboarding Entry → Dashboard (Coaching Command Center)
├── Upcoming Session Preparation
├── Client Performance Tracking
├── Marketplace Inquiries & Bookings
└── Revenue & Business Metrics

Daily Use Patterns:
1. Morning: Review day's sessions → Check messages → Prepare session plans
2. Pre-Session: Review client history → Load session materials → Check conditions
3. During Session: GPS tracking → Voice notes → Client feedback capture
4. Post-Session: Log session notes → Rate client progress → Schedule follow-up
5. Evening: Respond to marketplace inquiries → Plan tomorrow → Review earnings
```

---

## Screen-by-Screen Specifications

## 1. Dashboard Tab - Coaching Command Center

### Purpose
Central hub for session management, client insights, marketplace activity, and business metrics.

### Layout Structure
```typescript
interface CoachDashboardScreen {
  header: {
    greeting: 'Welcome back, Coach [Name]';
    quickStats: {
      todaySessions: number;
      weekRevenue: number;
      activeClients: number;
      marketplaceRating: number;
    };
  };

  sections: [
    'Today\'s Sessions',
    'Pending Marketplace Inquiries',
    'Recent Client Progress',
    'Week Revenue Summary',
    'Quick Actions',
    'Upcoming Sessions Preview'
  ];
}
```

### Today's Sessions Card (Top Priority)
**Visual Design**: Hero card with session timeline and preparation status

**Content**:
```
┌─────────────────────────────────────────┐
│ TODAY'S COACHING SESSIONS (3)           │
│ Thursday, March 15, 2025                │
│                                         │
│ ⏰ 9:00 AM - 11:00 AM (2 hrs)          │
│ 📍 Royal Hong Kong Yacht Club          │
│ 👤 Bram Van Olsen - Dragon             │
│ 🎯 Focus: Start line tactics           │
│ Status: ✅ Session plan ready           │
│ Weather: 12-15kt NE, ideal conditions  │
│ [View Plan] [Contact Client] [Start]   │
│                                         │
│ ⏰ 2:00 PM - 4:00 PM (2 hrs)           │
│ 📍 RHKYC (On-water)                    │
│ 👤 Michael Chen - Dragon                │
│ 🎯 Focus: Downwind technique           │
│ Status: ⚠️ Client requested changes     │
│ [Update Plan] [Message]                │
│                                         │
│ ⏰ 6:00 PM - 7:30 PM (1.5 hrs)         │
│ 📍 Virtual Session (Zoom)              │
│ 👤 Emma Wilson - J/70                   │
│ 🎯 Focus: Race video analysis          │
│ Status: ✅ Video uploaded by client     │
│ [Review Video] [Join Call]             │
└─────────────────────────────────────────┘
```

**Actions**:
- Quick-access session controls
- One-tap communication with clients
- Session preparation checklist
- GPS tracking for on-water sessions

### Pending Marketplace Inquiries Card
**Visual**: Notification-style card with inquiry count

**Content**:
```
┌─────────────────────────────────────────┐
│ 📬 NEW BOOKING REQUESTS (5)             │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ David Lee • 2 hours ago            │  │
│ │ Dragon Class • Tactical Coaching   │  │
│ │ Location: RHKYC                    │  │
│ │ Requested: March 20, 10am-12pm     │  │
│ │ Rate: $120 USD (2 hrs)             │  │
│ │ Message: "Preparing for Spring..." │  │
│ │ [Accept] [Decline] [Message]       │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ Sarah Kim • 4 hours ago            │  │
│ │ J/70 Class • Start Line Practice   │  │
│ │ Location: Willing to travel to you │  │
│ │ Requested: March 18, 1pm-3pm       │  │
│ │ Rate: $100 USD + travel            │  │
│ │ [Accept] [Counter-Offer] [Decline] │  │
│ └───────────────────────────────────┘  │
│                                         │
│ + 3 more requests                       │
│ [View All Inquiries]                    │
└─────────────────────────────────────────┘
```

**Business Logic**:
- 24-hour response time goal (affects marketplace ranking)
- Auto-decline if calendar conflict detected
- Smart pricing suggestions based on market rates
- Inquiry-to-booking conversion tracking

### Recent Client Progress Card
**Visual**: Performance trend visualization

**Content**:
```
┌─────────────────────────────────────────┐
│ 🏆 CLIENT PROGRESS HIGHLIGHTS           │
│                                         │
│ Bram Van Olsen - Dragon                 │
│ • 12 sessions completed (since Jan)     │
│ • Performance: 5.5 → 4.2 avg position ↑ │
│ • Progress: +23% improvement            │
│ • Next Goal: Break into top 3           │
│ • Upcoming: World Championship prep     │
│ [View Full Progress] [Plan Next Session]│
│                                         │
│ Michael Chen - Dragon                   │
│ • 8 sessions completed                  │
│ • Performance: 7.2 → 6.0 avg position ↑ │
│ • Focus Area: Downwind speed improved   │
│ • Challenge: Start consistency needed   │
│ [Review Sessions] [Schedule Follow-up]  │
│                                         │
│ [View All Clients (24)]                 │
└─────────────────────────────────────────┘
```

**AI Coaching Insights**:
- Automated progress tracking
- Session effectiveness scoring
- Skill gap identification
- Recommended focus areas for next session

### Week Revenue Summary
**Visual**: Revenue chart with breakdown

**Content**:
```
┌─────────────────────────────────────────┐
│ 💰 THIS WEEK'S REVENUE                  │
│ March 12-18, 2025                       │
│                                         │
│ Total Earned: $2,450 USD                │
│ (15% commission) Net: $2,082.50         │
│                                         │
│ Breakdown:                              │
│ • Individual Sessions: $1,800 (12 hrs)  │
│ • Group Sessions: $400 (4 hrs)          │
│ • Virtual Sessions: $250 (3 hrs)        │
│ • Package Revenue: $0                   │
│                                         │
│ Sessions Delivered: 19 hours            │
│ Avg Rate: $129/hour                     │
│                                         │
│ Compared to Last Week: +18% ↑           │
│ Monthly Goal Progress: 62% of $12k      │
│                                         │
│ [View Detailed Earnings] [Download Invoice]│
└─────────────────────────────────────────┘
```

**Payment Status**:
- Completed sessions (paid)
- Pending payouts (processing)
- Upcoming sessions (confirmed)
- Refunds/cancellations

### Quick Actions Grid
```
┌─────────────────┬─────────────────┬─────────────────┐
│ 📅 Block         │ 📝 Session      │ 💬 Message      │
│ Time Off        │ Notes           │ Clients         │
├─────────────────┼─────────────────┼─────────────────┤
│ 📊 View         │ 🎥 Upload       │ ⚙️ Update       │
│ Analytics       │ Content         │ Profile         │
└─────────────────┴─────────────────┴─────────────────┘
```

### Marketplace Performance (Bottom Section)
```
┌─────────────────────────────────────────┐
│ 📈 MARKETPLACE STATS (Last 30 Days)     │
│                                         │
│ Profile Views: 247                      │
│ Inquiry Rate: 18% (45 inquiries)        │
│ Booking Conversion: 62% (28 bookings)   │
│ Average Rating: ⭐ 4.9 (from 23 reviews)│
│                                         │
│ Ranking: #3 in Dragon coaches (HK)      │
│ Response Time: 2.3 hours (excellent)    │
│                                         │
│ Opportunities:                          │
│ • 5 sailors viewed your profile today   │
│ • Consider lowering rate by $10 to      │
│   match top competitor                  │
│ • Update profile with recent success    │
│   (Bram's improvement)                  │
└─────────────────────────────────────────┘
```

---

## 2. Calendar Tab - Session Scheduling & Availability

### Purpose
Unified calendar showing all coaching sessions, availability blocks, and personal commitments with intelligent scheduling.

### Layout Structure
```typescript
interface CoachCalendarScreen {
  views: ['Week', 'Day', 'Month', 'List'];
  filters: ['All Sessions', 'Confirmed', 'Pending', 'Availability', 'Personal'];

  sessionTypes: {
    confirmed: 'Booked and paid sessions';
    pending: 'Pending client confirmation';
    blocked: 'Unavailable time (personal/travel)';
    available: 'Open for booking';
    recurring: 'Regular client sessions';
  };
}
```

### Week View (Default)
**Visual**: Calendar grid with color-coded session types

**Session Color Coding**:
- **Blue**: Confirmed individual sessions
- **Purple**: Confirmed group sessions
- **Green**: Available booking slots
- **Orange**: Pending confirmations
- **Red**: Blocked/unavailable
- **Gray**: Personal time off

**Session Card (on tap)**:
```
┌─────────────────────────────────────────┐
│ COACHING SESSION                        │
│ Thursday, March 15 • 9:00-11:00 AM      │
│                                         │
│ 👤 Bram Van Olsen                       │
│ ⛵ Dragon Class                         │
│ 📍 Royal Hong Kong Yacht Club          │
│                                         │
│ Session Type: Individual (On-water)     │
│ Duration: 2 hours                       │
│ Rate: $120 USD                          │
│ Status: ✅ Confirmed & Paid             │
│                                         │
│ Focus Areas:                            │
│ • Start line positioning                │
│ • Port vs starboard tack starts         │
│ • Fleet management off the line         │
│                                         │
│ Client Notes:                           │
│ "Struggling with pin-end starts in      │
│ strong current - need tactical help"    │
│                                         │
│ Weather Forecast:                       │
│ 12-15kt NE, Flood tide 0.8kt           │
│ Ideal conditions for starts practice    │
│                                         │
│ Session Plan:                           │
│ ✅ Start line analysis (30 min)         │
│ ✅ 5 practice starts (60 min)           │
│ ✅ Video review & debrief (30 min)      │
│                                         │
│ [Edit Session] [Cancel] [Contact Client]│
│ [Start GPS Tracking] [Session Notes]    │
└─────────────────────────────────────────┘
```

### Availability Management
**Visual**: Weekly grid editor

```
┌─────────────────────────────────────────┐
│ MANAGE AVAILABILITY                     │
│ Set your regular coaching hours         │
│                                         │
│        Mon  Tue  Wed  Thu  Fri  Sat  Sun│
│ 6-9am   ⬜   ⬜   ⬜   ⬜   ⬜   ✅   ✅  │
│ 9-12pm  ✅   ✅   ✅   ✅   ✅   ✅   ✅  │
│ 12-3pm  ✅   ✅   ⬜   ✅   ✅   ✅   ⬜  │
│ 3-6pm   ✅   ✅   ✅   ✅   ✅   ⬜   ⬜  │
│ 6-9pm   ⬜   ⬜   ✅   ⬜   ⬜   ⬜   ⬜  │
│                                         │
│ Venue: RHKYC (default)                  │
│ Max Sessions/Day: 3                     │
│ Break Between: 30 minutes               │
│                                         │
│ [Copy to All Weeks] [Set Exceptions]    │
│ [Block Time Off] [Save Changes]         │
└─────────────────────────────────────────┘
```

**Smart Scheduling Features**:
- Auto-decline conflicts
- Travel time buffer between venues
- Weather-based availability (auto-suggest indoor sessions on bad weather days)
- Recurring client bookings (weekly/biweekly patterns)
- Group session coordination (multiple clients, same time)

### Block Time Off
```
┌─────────────────────────────────────────┐
│ BLOCK UNAVAILABLE TIME                  │
│                                         │
│ Reason: [Dropdown]                      │
│ • Personal time off                     │
│ • Competing in regatta                  │
│ • Attending coaching course             │
│ • Travel (unavailable)                  │
│ • Sick/Emergency                        │
│                                         │
│ Start Date: March 20, 2025              │
│ End Date: March 24, 2025                │
│                                         │
│ ⚠️ Impact:                               │
│ • 3 pending inquiries will be declined  │
│ • 1 client has requested this period    │
│   (contact to reschedule)               │
│                                         │
│ Auto-Response:                          │
│ "I'm unavailable during this period.    │
│ I'll be back coaching on March 25.      │
│ Please book a session for after that    │
│ date. Thanks!"                          │
│                                         │
│ [Block Calendar] [Cancel]               │
└─────────────────────────────────────────┘
```

---

## 3. Clients Tab - Sailor Roster & Progress Tracking

### Purpose
Comprehensive client management with performance tracking, session history, and progress analytics.

### Client Roster Screen
```
┌─────────────────────────────────────────┐
│ MY CLIENTS (24 Active)                  │
│ Sort: [Most Recent] Last Session | Name │
│ Filter: [All] Active | Package | Archive│
│                                         │
│ Search clients...                       │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ Bram Van Olsen ⭐ VIP               │  │
│ │ Dragon Class • RHKYC               │  │
│ │                                    │  │
│ │ Sessions: 12 (since Jan 2025)      │  │
│ │ Last Session: March 13 (2 days ago)│  │
│ │ Next Session: March 15, 9am        │  │
│ │                                    │  │
│ │ Performance: 5.5 → 4.2 avg ↑       │  │
│ │ Progress: +23% improvement         │  │
│ │ Focus: Start line tactics          │  │
│ │                                    │  │
│ │ Package: Championship Prep (8 left)│  │
│ │ Revenue (YTD): $1,440              │  │
│ │                                    │  │
│ │ [View Progress] [Message] [Book]   │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ Michael Chen                       │  │
│ │ Dragon Class • RHKYC               │  │
│ │                                    │  │
│ │ Sessions: 8 (since Feb 2025)       │  │
│ │ Last Session: March 10 (5 days ago)│  │
│ │ Next Session: March 15, 2pm        │  │
│ │                                    │  │
│ │ Performance: 7.2 → 6.0 avg ↑       │  │
│ │ Challenge: Start consistency       │  │
│ │                                    │  │
│ │ Revenue (YTD): $800                │  │
│ │                                    │  │
│ │ [View Progress] [Message]          │  │
│ └───────────────────────────────────┘  │
│                                         │
│ [+ Add Client Manually] [Import Clients]│
└─────────────────────────────────────────┘
```

**Client Tags/Segments**:
- VIP (high-value, long-term clients)
- Package clients (prepaid sessions)
- Trial (first 1-3 sessions)
- Inactive (no sessions in 60+ days)
- Group participants

### Client Detail View
**Tabs**: Overview | Performance | Sessions | Notes | Billing

#### Overview Tab
```
┌─────────────────────────────────────────┐
│ BRAM VAN OLSEN                          │
│ Dragon Class Sailor                     │
│                                         │
│ CLIENT PROFILE:                         │
│ • Home Venue: Royal Hong Kong YC        │
│ • Experience: Expert (15+ years)        │
│ • Racing Goals: World Championship      │
│ • Coaching Since: January 2025          │
│                                         │
│ COACHING RELATIONSHIP:                  │
│ • Total Sessions: 12                    │
│ • Hours Coached: 24 hours               │
│ • Session Frequency: 2x per week        │
│ • Preferred Time: Mornings (9-11am)     │
│ • Payment Method: Package (prepaid)     │
│                                         │
│ CURRENT FOCUS:                          │
│ 🎯 Primary: Start line tactics          │
│ 🎯 Secondary: Downwind speed            │
│ 🎯 Mental: Pressure management          │
│                                         │
│ RECENT ACHIEVEMENTS:                    │
│ ✅ RHKYC Spring R1: 3rd place           │
│ ✅ Improved start timing by 40%         │
│ ✅ Consistent top-5 finishes (6 races)  │
│                                         │
│ EQUIPMENT:                              │
│ • Boat: Borsboom Dragon #1247           │
│ • Sails: North DNM-2024 (optimal)       │
│ • Setup: Light-medium air configured    │
│                                         │
│ GOALS PROGRESS:                         │
│ Short-term: Top 3 in RHKYC fleet        │
│ → Status: 8th → 4th (on track) ✅       │
│                                         │
│ Long-term: World Championship qualify   │
│ → Status: 5 of 8 events complete (62%)  │
│                                         │
│ [Edit Profile] [Message] [Schedule]     │
└─────────────────────────────────────────┘
```

#### Performance Tab
```
┌─────────────────────────────────────────┐
│ PERFORMANCE ANALYTICS                   │
│ Bram Van Olsen • Dragon Class           │
│                                         │
│ OVERALL PROGRESS:                       │
│ ┌───────────────────────────────────┐  │
│ │  [Graph: Avg Position Over Time]   │  │
│ │  Jan  Feb  Mar                     │  │
│ │  5.5  4.9  4.2  (↓ is better)      │  │
│ │                                    │  │
│ │  Trend: -1.3 positions (23% ↑)     │  │
│ └───────────────────────────────────┘  │
│                                         │
│ SKILL DEVELOPMENT:                      │
│ ┌───────────────────────────────────┐  │
│ │ Start Line: ████████░░ 80% ↑       │  │
│ │ Upwind: ██████░░░░ 60%             │  │
│ │ Downwind: ████░░░░░░ 40% ⚠️        │  │
│ │ Mark Rounding: ███████░░░ 70%      │  │
│ │ Tactical: ██████████ 100% ✅       │  │
│ └───────────────────────────────────┘  │
│                                         │
│ COACHING SESSION IMPACT:                │
│ ┌───────────────────────────────────┐  │
│ │ Sessions Focused on Starts: 6      │  │
│ │ → Start Performance: +40%          │  │
│ │ → Race Impact: +2 positions        │  │
│ │ ROI: Excellent ✅                   │  │
│ └───────────────────────────────────┘  │
│                                         │
│ RECOMMENDED NEXT FOCUS:                 │
│ 🎯 Downwind speed (biggest opportunity) │
│ 🎯 Heavy air technique (weakness)       │
│ 🎯 Race psychology (championship prep)  │
│                                         │
│ COMPARATIVE ANALYSIS:                   │
│ vs RHKYC Fleet: +18% above average      │
│ vs Your Other Dragon Clients: Top 3     │
│ Improvement Rate: Faster than 80% of    │
│                   your clients          │
│                                         │
│ [Export Performance Report] [Share]     │
└─────────────────────────────────────────┘
```

#### Sessions Tab
```
┌─────────────────────────────────────────┐
│ SESSION HISTORY                         │
│ Bram Van Olsen • 12 sessions            │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ March 13, 2025 • 9:00-11:00 AM     │  │
│ │ Start Line Tactics (On-water)      │  │
│ │ Duration: 2 hours • RHKYC          │  │
│ │                                    │  │
│ │ Focus: Port tack starts, pin end   │  │
│ │ Conditions: 12-15kt NE, flood tide │  │
│ │ Exercises: 5 practice starts       │  │
│ │                                    │  │
│ │ Coach Notes:                       │  │
│ │ "Excellent session. Bram nailed 4  │  │
│ │ of 5 starts. Timing much improved. │  │
│ │ Continue practicing countdown."    │  │
│ │                                    │  │
│ │ Client Feedback: ⭐⭐⭐⭐⭐ (5/5)    │  │
│ │ "Best start practice yet!"         │  │
│ │                                    │  │
│ │ Skill Progress:                    │  │
│ │ Start Line: 70% → 80% ↑            │  │
│ │                                    │  │
│ │ [View Full Notes] [GPS Track]      │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ March 10, 2025 • 9:00-11:00 AM     │  │
│ │ Race Video Analysis (Virtual)      │  │
│ │ Duration: 1.5 hours • Zoom         │  │
│ │                                    │  │
│ │ Focus: RHKYC Spring R1 debrief     │  │
│ │ Results: 3rd of 12 boats           │  │
│ │                                    │  │
│ │ Key Insights:                      │  │
│ │ ✅ Start: Excellent execution       │  │
│ │ ⚠️ Beat: Late tack cost position    │  │
│ │ ✅ Run: Good route choice           │  │
│ │                                    │  │
│ │ Client Feedback: ⭐⭐⭐⭐⭐ (5/5)    │  │
│ │                                    │  │
│ │ [View Recording] [Notes]           │  │
│ └───────────────────────────────────┘  │
│                                         │
│ [View All Sessions (12)]                │
└─────────────────────────────────────────┘
```

#### Notes Tab
```
┌─────────────────────────────────────────┐
│ CLIENT NOTES                            │
│ Private coaching observations           │
│                                         │
│ [+ Add Note]                            │
│                                         │
│ March 13, 2025                          │
│ "Bram's start timing has significantly  │
│ improved. He's now consistently hitting │
│ the line within 2 seconds of gun with   │
│ speed. Next focus should be on choosing │
│ the correct end based on current bias.  │
│ Also noticed he's hesitant in heavy air │
│ - recommend dedicated heavy air session."│
│                                         │
│ March 6, 2025                           │
│ "Discussed World Championship prep plan.│
│ Bram needs 3 more qualifying events.    │
│ Suggested Hiroshima (Apr), Sydney (May),│
│ and Newport (Jul). Work on mental prep  │
│ for high-pressure racing."              │
│                                         │
│ Feb 28, 2025                            │
│ "Initial assessment: Strong tactical    │
│ knowledge but inconsistent starts.      │
│ Equipment setup is good. Recommended    │
│ focus on start line practice and        │
│ downwind speed optimization."           │
│                                         │
│ [Search Notes] [Export Notes]           │
└─────────────────────────────────────────┘
```

---

## 4. Sessions Tab - Session Management & Delivery

### Purpose
Manage all coaching sessions from planning through delivery to post-session analysis.

### Session List View
```
┌─────────────────────────────────────────┐
│ ALL SESSIONS                            │
│ Filter: [Upcoming] Past | All           │
│ Sort: [Date] Client | Type | Venue      │
│                                         │
│ UPCOMING (8 sessions)                   │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ TODAY - March 15, 9:00 AM          │  │
│ │ Bram Van Olsen • Dragon • RHKYC    │  │
│ │ Start Line Tactics (2 hrs)         │  │
│ │ Status: ✅ Ready to start           │  │
│ │ [Start Session] [View Plan]        │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ TODAY - March 15, 2:00 PM          │  │
│ │ Michael Chen • Dragon • RHKYC      │  │
│ │ Downwind Technique (2 hrs)         │  │
│ │ Status: ⚠️ Session plan pending     │  │
│ │ [Create Plan] [Contact]            │  │
│ └───────────────────────────────────┘  │
│                                         │
│ TOMORROW (2 sessions)                   │
│ THIS WEEK (5 sessions)                  │
│                                         │
│ [Create Manual Session] [View Calendar] │
└─────────────────────────────────────────┘
```

### Session Planning Interface
```
┌─────────────────────────────────────────┐
│ SESSION PLAN                            │
│ Bram Van Olsen • March 15, 9-11am       │
│                                         │
│ SESSION OBJECTIVES:                     │
│ Primary: Master port tack pin starts    │
│ Secondary: Fleet positioning off line   │
│                                         │
│ PLANNED STRUCTURE: (120 minutes)        │
│ ┌───────────────────────────────────┐  │
│ │ 1. Warm-up & Briefing (15 min)     │  │
│ │    • Review conditions              │  │
│ │    • Explain start line theory      │  │
│ │    • Q&A on previous race           │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ 2. Start Line Setup (15 min)       │  │
│ │    • Set practice start line        │  │
│ │    • Analyze wind/current bias      │  │
│ │    • Identify pin vs boat end       │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ 3. Practice Starts (60 min)        │  │
│ │    • 5 timed starts                 │  │
│ │    • Focus on port tack approach    │  │
│ │    • Video record each attempt      │  │
│ │    • Debrief after each start       │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ 4. Video Review (20 min)           │  │
│ │    • Analyze timing                 │  │
│ │    • Position assessment            │  │
│ │    • Fleet interaction review       │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ 5. Wrap-up & Action Items (10 min) │  │
│ │    • Key takeaways                  │  │
│ │    • Practice homework              │  │
│ │    • Schedule next session          │  │
│ └───────────────────────────────────┘  │
│                                         │
│ MATERIALS NEEDED:                       │
│ ✅ Start line marks (2 buoys)           │
│ ✅ GoPro for video recording            │
│ ✅ Countdown timer                      │
│ ✅ Coaching launch (booked)             │
│                                         │
│ CONDITIONS FORECAST:                    │
│ Wind: 12-15kt NE (ideal)                │
│ Current: Flood 0.8kt (factor in starts) │
│ Temp: 22°C (comfortable)                │
│                                         │
│ CLIENT PREP INSTRUCTIONS:               │
│ "Arrive at 8:45am for gear setup.       │
│ Bring boat setup for 12-15kt conditions.│
│ Review start line diagram I sent."      │
│                                         │
│ [Save Plan] [Share with Client] [Start] │
└─────────────────────────────────────────┘
```

### Active Session Interface (During Session)
```
┌─────────────────────────────────────────┐
│ 🏁 ACTIVE SESSION                       │
│ Bram Van Olsen • Start Line Tactics     │
│                                         │
│ ⏱️ Session Time: 00:45:23 / 02:00:00   │
│ 📍 GPS Tracking: Active                 │
│ 🎥 Video Recording: ON                  │
│                                         │
│ Current Phase: Practice Starts (3/5)    │
│ ┌───────────────────────────────────┐  │
│ │   [Simplified Map View]            │  │
│ │   • Coach position (blue)          │  │
│ │   • Client boat (green)            │  │
│ │   • Start line (red)               │  │
│ │   • Wind direction arrow           │  │
│ └───────────────────────────────────┘  │
│                                         │
│ QUICK ACTIONS:                          │
│ [🎤 Voice Note] [📷 Photo] [⏸️ Pause]   │
│ [✓ Mark Drill Complete] [📝 Note]       │
│                                         │
│ RECENT VOICE NOTES:                     │
│ • 00:42:15 "Good approach, but 2 sec   │
│   early. Try counting down louder."    │
│ • 00:35:40 "Perfect timing! Note the   │
│   boat speed at the gun."              │
│                                         │
│ WEATHER (Live):                         │
│ Wind: 14kt @ 045° NE                    │
│ Current: 0.9kt Flood ↗                  │
│                                         │
│ [End Session] [Emergency Contact]       │
└─────────────────────────────────────────┘
```

### Post-Session Summary Interface
```
┌─────────────────────────────────────────┐
│ 📋 SESSION SUMMARY                      │
│ Bram Van Olsen • March 15, 2025         │
│ Start Line Tactics • 2 hours            │
│                                         │
│ ATTENDANCE:                             │
│ ✅ Client attended (on-time)            │
│ Duration: 2:00:15 (as planned)          │
│                                         │
│ SESSION NOTES:                          │
│ [Rich text editor]                      │
│                                         │
│ "Excellent session overall. Bram        │
│ completed 5 practice starts with        │
│ significant improvement:                │
│                                         │
│ Start 1: 5 sec early, poor approach     │
│ Start 2: 3 sec early, better            │
│ Start 3: 1 sec early, good speed        │
│ Start 4: Perfect timing! ✅             │
│ Start 5: Perfect timing! ✅             │
│                                         │
│ Key achievements:                       │
│ • Mastered countdown timing             │
│ • Improved port tack approach           │
│ • Better fleet awareness                │
│                                         │
│ Areas for continued work:               │
│ • Start line bias assessment            │
│ • Acceleration off the line             │
│                                         │
│ Homework:                               │
│ • Practice countdown drills (daily)     │
│ • Review start video before next race   │
│ • Read provided article on current bias"│
│                                         │
│ SKILL PROGRESS UPDATE:                  │
│ Start Line: 70% → 80% (+10%) ↑          │
│ Tactical Awareness: 85% → 88% (+3%) ↑   │
│                                         │
│ MEDIA ATTACHMENTS:                      │
│ 🎥 Session video (45 min)               │
│ 📸 5 photos (start sequences)           │
│ 🎤 8 voice notes                        │
│                                         │
│ CLIENT FEEDBACK REQUEST:                │
│ "How would you rate this session?"      │
│ [Send feedback request to Bram]         │
│                                         │
│ NEXT STEPS:                             │
│ ☐ Schedule follow-up session            │
│ ☐ Send session video to client          │
│ ☐ Update client's training plan         │
│                                         │
│ [Save & Send to Client] [Save Draft]    │
└─────────────────────────────────────────┘
```

---

## 5. Marketplace Tab - Profile & Booking Management

### Purpose
Manage marketplace presence, respond to inquiries, optimize pricing, and track business performance.

### Marketplace Dashboard
```
┌─────────────────────────────────────────┐
│ 📊 MARKETPLACE PERFORMANCE              │
│ Last 30 Days                            │
│                                         │
│ PROFILE STATS:                          │
│ Views: 247 (+18% vs last month)         │
│ Clicks: 45 (18% CTR)                    │
│ Inquiries: 45 (100% inquiry rate)       │
│ Bookings: 28 (62% conversion) ✅        │
│                                         │
│ RANKING:                                │
│ Overall: #8 of 43 (Hong Kong)           │
│ Dragon Coaches: #3 of 12 (Hong Kong)    │
│ J/70 Coaches: #5 of 8 (Hong Kong)       │
│                                         │
│ RATINGS & REVIEWS:                      │
│ Average: ⭐ 4.9/5.0 (from 23 reviews)   │
│ Response Rate: 96% (excellent)          │
│ Response Time: 2.3 hours (excellent)    │
│                                         │
│ COMPETITIVE ANALYSIS:                   │
│ Your Rate: $120/hr (avg for Dragon HK)  │
│ Market Range: $80-150/hr                │
│ Top Competitor: $110/hr (#1 ranked)     │
│                                         │
│ 💡 OPTIMIZATION SUGGESTIONS:            │
│ • Add recent success story (Bram's      │
│   improvement) to boost credibility     │
│ • Consider $110/hr intro rate for new   │
│   clients to match top competitor       │
│ • Upload video introduction (40% more   │
│   bookings for coaches with video)      │
│ • Respond within 1 hour to improve      │
│   ranking (currently 2.3 hrs)           │
│                                         │
│ [Update Profile] [View Public Profile]  │
└─────────────────────────────────────────┘
```

### Inquiry Management
```
┌─────────────────────────────────────────┐
│ 📬 BOOKING INQUIRIES                    │
│ Filter: [Pending] Accepted | Declined   │
│                                         │
│ PENDING RESPONSE (5)                    │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ David Lee • 2 hours ago 🔥         │  │
│ │ Dragon Class • Tactical Coaching   │  │
│ │                                    │  │
│ │ Requested:                         │  │
│ │ • Date: March 20, 2025             │  │
│ │ • Time: 10:00 AM - 12:00 PM        │  │
│ │ • Duration: 2 hours                │  │
│ │ • Location: RHKYC                  │  │
│ │ • Rate: $120 USD                   │  │
│ │                                    │  │
│ │ Sailor Profile:                    │  │
│ │ • Experience: Advanced (8 years)   │  │
│ │ • Avg Position: 5.5 (RHKYC fleet)  │  │
│ │ • Racing Goals: Championship prep  │  │
│ │                                    │  │
│ │ Message:                           │  │
│ │ "I'm preparing for the Spring      │  │
│ │ Championship and need help with    │  │
│ │ tactical decision-making. Your     │  │
│ │ approach with Bram sounds perfect  │  │
│ │ for what I need."                  │  │
│ │                                    │  │
│ │ ✅ Calendar: Available (no conflicts)│  │
│ │ 💰 Rate Match: Standard rate        │  │
│ │ 📍 Location: Your primary venue     │  │
│ │ 🎯 Expertise Match: 100%            │  │
│ │                                    │  │
│ │ RECOMMENDED: ACCEPT ✅              │  │
│ │                                    │  │
│ │ [Accept Booking] [Counter-Offer]   │  │
│ │ [Message] [Decline]                │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ Sarah Kim • 4 hours ago            │  │
│ │ J/70 Class • Start Line Practice   │  │
│ │                                    │  │
│ │ Requested: March 18, 1-3pm         │  │
│ │ Location: Willing to meet at RHKYC │  │
│ │ Rate: $100 + travel (??)           │  │
│ │                                    │  │
│ │ ⚠️ Calendar: Potential conflict     │  │
│ │ ⚠️ Rate: Non-standard (clarify)     │  │
│ │ ✅ Expertise Match: 90%             │  │
│ │                                    │  │
│ │ [Review Details] [Counter-Offer]   │  │
│ └───────────────────────────────────┘  │
│                                         │
│ + 3 more pending                        │
│                                         │
│ RESPONSE TIMER: ⏰ 21h 37m remaining    │
│ (Respond within 24hrs for best ranking) │
└─────────────────────────────────────────┘
```

### Profile Management
```
┌─────────────────────────────────────────┐
│ 👤 MARKETPLACE PROFILE                  │
│ [Preview as Sailors See It]             │
│                                         │
│ PROFILE PHOTO:                          │
│ [Current photo displayed]               │
│ Last updated: Jan 15, 2025              │
│ [Upload New Photo]                      │
│                                         │
│ COACH BIO: (489 / 500 words)            │
│ [Rich text editor with current bio]     │
│ [Edit Bio]                              │
│                                         │
│ VIDEO INTRODUCTION:                     │
│ ⚠️ Not uploaded (40% more bookings!)    │
│ [Upload Video] [Record Now]             │
│                                         │
│ SPECIALTIES:                            │
│ ✅ Dragon Class (Expert)                 │
│ ✅ J/70 (Advanced)                       │
│ ✅ Start Line Tactics                    │
│ ✅ Race Strategy                         │
│ ✅ Boat Setup/Tuning                     │
│ [Edit Specialties]                      │
│                                         │
│ CERTIFICATIONS: (3 verified)            │
│ ✅ US Sailing Level 3 Coach              │
│ ✅ RYA Yachting Instructor               │
│ ✅ SafeSport Certified                   │
│ [Manage Certifications]                 │
│                                         │
│ RATES:                                  │
│ Individual: $120/hr                     │
│ Group: $80/hr per person                │
│ Half-Day: $220 (4 hrs)                  │
│ Full-Day: $400 (8 hrs)                  │
│ [Edit Pricing]                          │
│                                         │
│ REVIEWS: ⭐ 4.9/5.0 (23 reviews)         │
│ Latest: "Sarah is incredible! ..."      │
│ [View All Reviews]                      │
│                                         │
│ AVAILABILITY STATUS:                    │
│ 🟢 Available this week (12 slots open)  │
│ [Manage Availability]                   │
│                                         │
│ [Save Changes] [Preview Public Profile] │
└─────────────────────────────────────────┘
```

---

## 6. More Menu - Additional Coach Features

### Menu Structure
```
┌─────────────────────────────────────────┐
│ MORE OPTIONS                            │
│                                         │
│ 💰 Earnings & Payments                  │
│    Revenue tracking, payouts, invoicing │
│                                         │
│ 📊 Business Analytics                   │
│    Performance metrics, trends, insights│
│                                         │
│ 📚 Resource Library                     │
│    Coaching materials, templates, guides│
│                                         │
│ 🎓 Certifications                       │
│    Manage credentials, renewals         │
│                                         │
│ 📅 Availability Manager                 │
│    Detailed scheduling controls         │
│                                         │
│ 💬 Messages                             │
│    Client communication inbox           │
│                                         │
│ 👤 Profile & Settings                   │
│    Account settings, preferences        │
│                                         │
│ ⚙️ App Settings                          │
│    Notifications, privacy, preferences  │
│                                         │
│ ❓ Help & Support                        │
│    FAQs, coaching best practices, contact│
└─────────────────────────────────────────┘
```

### Earnings & Payments Screen
```
┌─────────────────────────────────────────┐
│ 💰 EARNINGS & PAYMENTS                  │
│                                         │
│ CURRENT MONTH (March 2025):             │
│ Total Earned: $8,450 USD                │
│ Commission (15%): -$1,267.50            │
│ Net Earnings: $7,182.50                 │
│                                         │
│ Hours Coached: 65.5 hours               │
│ Sessions: 32                            │
│ Avg Rate: $129/hour                     │
│                                         │
│ BREAKDOWN:                              │
│ • Individual Sessions: $6,400 (50 hrs)  │
│ • Group Sessions: $1,200 (12 hrs)       │
│ • Virtual Sessions: $850 (8.5 hrs)      │
│ • Package Revenue: $0                   │
│                                         │
│ PAYOUT STATUS:                          │
│ ┌───────────────────────────────────┐  │
│ │ Next Payout: March 31, 2025        │  │
│ │ Amount: $7,182.50 USD              │  │
│ │ Method: Bank Transfer (****1234)   │  │
│ │ Status: Scheduled ✅                │  │
│ └───────────────────────────────────┘  │
│                                         │
│ YEAR-TO-DATE (2025):                    │
│ Total Earnings: $24,680                 │
│ Net (after commission): $20,978         │
│ Hours: 191.5                            │
│ Clients: 24                             │
│                                         │
│ REVENUE TRENDS:                         │
│ ┌───────────────────────────────────┐  │
│ │  [Graph: Monthly Revenue]          │  │
│ │  Jan   Feb   Mar   (projected)     │  │
│ │  $7.2k $9.3k $8.5k                 │  │
│ │                                    │  │
│ │  Trend: +15% growth rate           │  │
│ └───────────────────────────────────┘  │
│                                         │
│ PENDING PAYMENTS: (3)                   │
│ • Session with Bram (March 15): $120    │
│ • Session with David (March 20): $120   │
│ • Package from Emma: $600               │
│ Total Pending: $840                     │
│                                         │
│ [Payment History] [Update Bank Info]    │
│ [Download Tax Summary] [Invoices]       │
└─────────────────────────────────────────┘
```

---

## Success Metrics

### Coach Engagement
- **Daily Active Coaches**: 60% of verified coaches
- **Sessions Delivered**: 15+ hours per week per active coach
- **Response Time**: <3 hours average (marketplace ranking factor)
- **Client Retention**: 80%+ of clients book 5+ sessions
- **Calendar Fill Rate**: 70%+ of available slots booked

### Business Performance
- **Average Coach Revenue**: $3,000+/month
- **Inquiry-to-Booking Conversion**: 65%+
- **Session Completion Rate**: 95%+
- **Client Satisfaction**: 4.7+ star average rating
- **Repeat Booking Rate**: 75%+

### Platform Metrics
- **Free → Coach Verification**: 80% within 7 days
- **Profile Completion**: 90%+ have complete profiles
- **Marketplace Listing**: 85%+ coaches visible and accepting bookings
- **Annual Coach Retention**: 85%+

---

## Technical Requirements

### Real-Time Features
- Live session tracking with GPS
- Real-time calendar updates (Supabase subscriptions)
- Instant inquiry notifications (push + in-app)
- Live marketplace ranking updates

### Payment Integration (Stripe Connect)
- Coach onboarding to Stripe Connect
- Automated payouts (weekly or monthly)
- Transaction history and invoicing
- Tax document generation (1099, etc.)
- Multi-currency support

### Calendar Sync
- Google Calendar integration (optional)
- iCal feed export
- Outlook Calendar sync
- Two-way sync for availability

### Communication System
- In-app messaging (coach ↔ sailor)
- Email notifications (configurable)
- SMS alerts for urgent updates (opt-in)
- Push notifications for inquiries/bookings

---

**Document Version**: 1.0
**Last Updated**: 2025-10-03
**Author**: RegattaFlow Product Team

**Related Documents**:
- [Coach Onboarding PRD](./PRD-COACH-ONBOARDING.md)
- [Sailor Experience PRD](./PRD-POST-ONBOARDING-EXPERIENCE.md)
- [Master Plan](./plans/regattaflow-master-plan.md)
- [Coach Marketplace](./plans/coach-marketplace.md)
