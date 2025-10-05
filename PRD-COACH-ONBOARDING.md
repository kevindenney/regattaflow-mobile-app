# Product Requirements Document: Coach Onboarding Flow

## Overview
**Product**: RegattaFlow Coach Onboarding
**Target User**: Professional sailing coaches and instructors (Primary Persona: Sarah Johnson - Olympic-level Dragon coach, multi-venue expertise)
**Goal**: Onboard coaches quickly with profile setup, expertise specification, availability management, and pricing configuration
**Platform**: React Native (iOS/Android/Web via Expo)

## User Flow Summary
6-step linear onboarding flow with progress indicators:
1. **Welcome & Coach Profile** - Name, experience, certifications
2. **Expertise & Specializations** - Boat classes, coaching styles, skill areas
3. **Venue Coverage** - Geographic availability and travel preferences
4. **Pricing & Availability** - Session rates, scheduling, payment setup
5. **Verification & Credentials** - Upload certifications, background check
6. **Marketplace Profile** - Bio, photos, marketing materials

---

## Screen Specifications

### Step 1 of 6: Welcome & Coach Profile

**Purpose**: Capture coach's basic information and coaching background

**Layout**:
- Progress: 1/6 (16.7% filled)
- Header: "Welcome to RegattaFlow Coaches"
- Subheader: "Join the world's premier sailing coaching marketplace"

**Form Fields**:
1. **Full Name** (required)
   - Type: Text input
   - Placeholder: "Enter your full name"
   - Validation: Minimum 2 characters

2. **Professional Title** (required)
   - Type: Text input
   - Placeholder: "e.g., Head Coach, Tactical Coach, Olympic Coach"
   - Examples shown: "Head Coach", "Performance Coach", "Tactical Specialist"

3. **Coaching Experience** (required)
   - Type: Dropdown/Select
   - Options:
     - "1-2 years"
     - "3-5 years"
     - "6-10 years"
     - "10-15 years"
     - "15+ years"
     - "Olympic/Professional Level"

4. **Coaching Organization** (optional)
   - Type: Text input
   - Placeholder: "Your club, team, or organization"
   - Examples: "Royal Hong Kong Yacht Club", "US Sailing Team", "Independent"

5. **Contact Information** (required)
   - Email (pre-filled from auth)
   - Phone number (with country code picker)
   - Preferred contact method (Email/Phone/WhatsApp/WeChat)

6. **Languages Spoken** (required)
   - Type: Multi-select
   - Common options shown first:
     - English
     - Spanish
     - French
     - Mandarin
     - Cantonese
     - Portuguese
     - [+ add other languages]

**Actions**:
- Primary button: "Continue to Expertise" → Step 2
- Skip link: "Complete later" (saves partial data)

**Validation**:
- Name, title, experience, and at least one language required
- Phone number validation with international format

---

### Step 2 of 6: Expertise & Specializations

**Purpose**: Define coaching expertise to match with appropriate sailors

**Layout**:
- Progress: 2/6 (33.3% filled)
- Header: "Your Coaching Expertise"
- Subheader: "Help sailors find the right coach for their needs"

**Boat Class Expertise**:
1. **Primary Boat Classes** (required, min 1)
   - Type: Multi-select with search
   - Popular classes shown first:
     - Dragon
     - J/70
     - Etchells
     - Swan 47
     - 470
     - Laser/ILCA
     - 49er/49erFX
     - [+ search all boat classes]
   - For each selected class:
     - Experience level: "Beginner", "Intermediate", "Advanced", "Expert"
     - Years coaching this class
     - Notable achievements (optional)

**Coaching Specializations** (select all that apply):
- Type: Multi-select chips

**Categories**:
1. **Technical Skills**:
   - Boat handling
   - Sail trim
   - Boat setup/tuning
   - Equipment optimization
   - Rig tuning
   - Downwind techniques

2. **Tactical Skills**:
   - Race strategy
   - Start line tactics
   - Weather routing
   - Current/tide analysis
   - Mark rounding
   - Fleet positioning

3. **Mental Performance**:
   - Race psychology
   - Focus/concentration
   - Pressure management
   - Team dynamics
   - Goal setting

4. **Physical Performance**:
   - Fitness training
   - Hiking/trimming technique
   - Endurance building
   - Injury prevention

5. **Other Specializations**:
   - Youth coaching
   - Beginner/learn-to-sail
   - Championship preparation
   - Olympic campaign support
   - Team building
   - Video analysis

**Coaching Levels** (select all that apply):
- Beginner/Recreational
- Intermediate/Club Racing
- Advanced/Regional Competition
- Expert/National Championship
- Professional/International/Olympic

**Actions**:
- Primary button: "Continue to Venues" → Step 3
- Secondary button: "Back" → Step 1
- Skip link: "Add more expertise later"

**Validation**:
- At least one boat class required
- At least two specializations recommended
- At least one coaching level required

---

### Step 3 of 6: Venue Coverage & Travel

**Purpose**: Define geographic availability and travel preferences for coaching sessions

**Layout**:
- Progress: 3/6 (50% filled)
- Header: "Where Do You Coach?"
- Subheader: "Set your primary locations and travel preferences"

**Primary Coaching Venues** (required):
1. **Home Base Venue**
   - Type: Searchable venue dropdown
   - Placeholder: "Select your primary coaching venue"
   - GPS detection: "Use my current location"
   - Shows: Venue name, city, country
   - Mark as: "My home venue where I'm regularly available"

2. **Additional Regular Venues**
   - Type: Multi-select venue search
   - Example: "I also coach regularly at these locations..."
   - Shows distance from home base
   - Set availability schedule per venue (optional)

**Travel Preferences**:
1. **Willing to Travel for Coaching?** (required)
   - Radio buttons:
     - "Yes - I travel for coaching sessions"
     - "Limited - Only for special events/camps"
     - "No - I only coach at my regular venues"

2. **Travel Radius** (if willing to travel):
   - Type: Slider or dropdown
   - Options:
     - Local only (within 50km)
     - Regional (within 200km)
     - National (within country)
     - International (worldwide)
   - Can set different rates for travel sessions

3. **Travel Minimum Requirements** (optional):
   - Minimum session duration (e.g., "Half-day minimum for travel")
   - Minimum advance booking (e.g., "2 weeks notice")
   - Travel cost coverage: "Client covers travel expenses"
   - Group session preference: "Prefer group sessions when traveling"

**Venue-Specific Expertise** (optional, but recommended):
```
For each selected venue, optionally add:
- Years coaching at this venue
- Notable local knowledge (currents, wind patterns, etc.)
- Local sailor testimonials
- Preferred conditions/seasons
```

**Virtual Coaching**:
- Toggle: "I offer virtual/remote coaching sessions"
- If yes:
  - Platforms used (Zoom, FaceTime, WhatsApp, etc.)
  - Types of virtual coaching (video analysis, strategy planning, Q&A)
  - Time zone availability

**Actions**:
- Primary button: "Continue to Pricing" → Step 4
- Secondary button: "Back" → Step 2
- Skip link: "Set availability later"

**Validation**:
- At least one home venue required
- Travel preference selection required

---

### Step 4 of 6: Pricing & Availability

**Purpose**: Configure coaching session pricing, availability calendar, and payment preferences

**Layout**:
- Progress: 4/6 (66.7% filled)
- Header: "Set Your Rates & Availability"
- Subheader: "Configure pricing and when you're available to coach"

**Pricing Structure**:

1. **Session Types & Rates** (required):

   **Individual Coaching**:
   - Hourly Rate: $____ USD/hour
     - Suggested range shown: "$80-150/hr for experienced coaches"
     - Auto-convert to local currency at each venue
   - Half-Day Rate: $____ USD (4 hours)
   - Full-Day Rate: $____ USD (8 hours)

   **Group Coaching** (optional):
   - Group Rate (2-4 sailors): $____ USD/hour
   - Team Rate (5+ sailors): $____ USD/hour
   - Group discount: "X% off individual rate"

   **Specialized Sessions** (optional):
   - Race Day Coaching: $____ USD/race
   - Video Analysis: $____ USD/session
   - Boat Setup/Tuning: $____ USD/session
   - Championship Prep: $____ USD/day
   - Virtual Session: $____ USD/hour

2. **Travel Session Pricing** (if applicable):
   - Travel day rate: $____ USD
   - Travel expenses: "Client covers" or "Included in rate"
   - Minimum booking: ___ days/sessions

3. **Package Deals** (optional but recommended):
   ```
   Create coaching packages for better value:
   - 5-Session Package: $____ (X% savings)
   - 10-Session Package: $____ (X% savings)
   - Monthly Unlimited: $____ USD/month
   - Championship Season Package: $____ (custom)
   ```

**Currency & Payment**:
- Primary currency: Auto-detected from home venue
- Accept multiple currencies: Yes/No
- Payment methods:
  - ✅ Stripe (credit/debit cards)
  - ✅ Bank transfer (direct)
  - ⬜ PayPal
  - ⬜ Cash (in-person only)
- Commission: "RegattaFlow 15% commission (already factored into displayed rates)"

**Availability Settings**:

1. **General Availability**:
   - Type: Weekly calendar grid
   ```
   Mon: [Morning] [Afternoon] [Evening]
   Tue: [Morning] [Afternoon] [Evening]
   Wed: [Morning] [Afternoon] [Evening]
   Thu: [Morning] [Afternoon] [Evening]
   Fri: [Morning] [Afternoon] [Evening]
   Sat: [Morning] [Afternoon] [Evening]
   Sun: [Morning] [Afternoon] [Evening]
   ```
   - Time blocks configurable (e.g., Morning = 6am-12pm)

2. **Booking Lead Time**:
   - Minimum advance booking: ___ hours/days
     - Options: "Same day", "1 day", "3 days", "1 week", "2 weeks"
   - Maximum advance booking: ___ months (default: 3 months)

3. **Session Duration Preferences**:
   - Minimum session length: ___ hours (default: 1 hour)
   - Maximum sessions per day: ___ (default: 2)
   - Break time between sessions: ___ minutes (default: 30)

4. **Blackout Dates** (optional):
   - Add specific dates when unavailable
   - Recurring unavailability (e.g., "Major regattas I'm competing in")

**Cancellation Policy**:
- Type: Dropdown
- Options:
  - "Flexible - Full refund up to 24 hours before"
  - "Moderate - 50% refund 48 hours before, full refund 1 week before"
  - "Strict - 50% refund 1 week before, no refund within 7 days"
  - "Custom - [Define your policy]"

**Actions**:
- Primary button: "Continue to Verification" → Step 5
- Secondary button: "Back" → Step 3
- Link: "I'll set pricing later" (not recommended)

**Validation**:
- At least one session type with pricing required
- General availability with minimum 10 hours/week recommended
- Cancellation policy required

---

### Step 5 of 6: Verification & Credentials

**Purpose**: Verify coaching credentials, certifications, and background to build trust

**Layout**:
- Progress: 5/6 (83.3% filled)
- Header: "Verify Your Credentials"
- Subheader: "Build trust with sailors by verifying your qualifications"

**Coaching Certifications** (highly recommended):

1. **Upload Certifications**:
   - Type: File upload (PDF, JPG, PNG)
   - Examples:
     - US Sailing Instructor Certification
     - RYA Yachting Instructor
     - World Sailing Level 1/2/3 Coach
     - National Sailing Federation certifications
     - First Aid/CPR certification
     - SafeSport certification
   - For each certification:
     - Certification name
     - Issuing organization
     - Certification number (optional)
     - Issue date
     - Expiry date (if applicable)
     - Upload document (required)

2. **Verification Status**:
   - Status: "Pending verification" (reviewed within 48 hours)
   - Display: "Verified Coach" badge when approved
   - Icons: ✅ for verified, ⏳ for pending, ⚠️ for issues

**Background Check** (required for youth coaching):
- Toggle: "I will coach youth sailors (under 18)"
- If yes:
  - Background check required
  - Process: "Third-party verification (Safe Sport, NCSI, or equivalent)"
  - Cost: "$45 USD (one-time, valid 2 years)"
  - Timeline: "5-7 business days"
  - Required documents:
    - Government-issued ID
    - Proof of address
    - Criminal background consent form

**Professional References** (optional but recommended):
- Add 2-3 professional references
- For each reference:
  - Name
  - Relationship (e.g., "Former client", "Sailing organization director")
  - Contact email
  - RegattaFlow will send verification request

**Insurance Coverage** (recommended):
- Toggle: "I have professional liability insurance"
- If yes:
  - Insurance provider
  - Policy number
  - Coverage amount
  - Expiry date
  - Upload certificate of insurance
- If no:
  - Info message: "Consider professional liability insurance to protect yourself"
  - Link to recommended providers

**Notable Achievements** (optional):
- Add sailing achievements to boost credibility:
  - Olympic medals/participation
  - World Championship results
  - National championship wins
  - Professional sailing career highlights
  - Coaching success stories (sailors you've coached to championships)

**Social Proof**:
- Connect professional profiles (optional):
  - LinkedIn profile
  - Sailing organization profile
  - Personal website
  - Instagram/YouTube (sailing content)

**Actions**:
- Primary button: "Continue to Profile" → Step 6
- Secondary button: "Back" → Step 4
- Skip link: "I'll verify later" (limits marketplace visibility)

**Validation**:
- At least one certification recommended for marketplace visibility
- Background check required if coaching youth
- Government ID verification required

---

### Step 6 of 6: Marketplace Profile & Bio

**Purpose**: Create compelling marketplace profile to attract sailors

**Layout**:
- Progress: 6/6 (100% filled)
- Header: "Complete Your Coach Profile"
- Subheader: "Make a great first impression with sailors"

**Profile Photo** (required):
- Type: Image upload
- Requirements:
  - Minimum: 400x400px
  - Maximum: 5MB
  - Format: JPG, PNG
  - Guidelines: "Professional photo, preferably sailing-related"
- Live preview shown

**Coach Bio** (required):
- Type: Rich text editor (max 500 words)
- Placeholder/Template:
  ```
  Hi, I'm [Name], a [experience level] sailing coach specializing in [boat classes].

  With [X years] of coaching experience, I've helped sailors from [beginner to championship]
  level achieve their racing goals. My coaching philosophy focuses on [technical/tactical/mental/etc.].

  Notable achievements:
  - [Achievement 1]
  - [Achievement 2]
  - [Achievement 3]

  I'm passionate about [specific aspects of sailing/coaching] and pride myself on
  [what makes you unique as a coach].

  When you work with me, you can expect [your coaching approach/style].

  Let's work together to improve your sailing!
  ```
- Character counter shown
- Tips: "Highlight unique expertise, coaching philosophy, and success stories"

**Additional Photos** (optional but recommended):
- Type: Gallery upload (up to 10 photos)
- Examples to include:
  - Action shots coaching on water
  - Sailors you've coached (with permission)
  - You competing/sailing (demonstrates expertise)
  - Whiteboard/teaching sessions
  - Awards/achievements
  - Venue photos where you coach

**Video Introduction** (optional):
- Type: Video upload or YouTube link
- Duration: 30-90 seconds recommended
- Content suggestions:
  - Introduce yourself
  - Explain coaching philosophy
  - Show coaching in action
  - Testimonial from satisfied sailor
- Format: MP4, MOV (max 50MB if uploaded)

**Coaching Specialties Summary** (auto-generated from Step 2):
- Display: Tag cloud or chip list
- Shows: Boat classes, coaching styles, specializations
- Editable: Can refine from this screen

**Success Stories / Testimonials** (optional):
- Add 1-3 success stories:
  - Sailor name (or "Anonymous")
  - Achievement (e.g., "Improved from 10th to 3rd in club fleet")
  - Timeframe (e.g., "6 months of coaching")
  - Quote (optional)
  - Sailor's permission to display

**Coaching Philosophy Tags** (select up to 5):
- Suggested tags:
  - "Data-driven approach"
  - "Holistic athlete development"
  - "Technical precision"
  - "Tactical mastery"
  - "Mental strength"
  - "Fun and engaging"
  - "Championship-focused"
  - "Personalized coaching"
  - "Team building"
  - "Continuous improvement"

**Marketplace Preview**:
- Live preview of how profile appears to sailors
- Shows:
  - Profile photo
  - Name and title
  - Rating (0 stars initially)
  - Specialties
  - Starting price
  - Availability indicator
  - Bio excerpt
- Toggle: "Profile visible to sailors" (default: ON)

**Actions**:
- Primary button: "Complete Setup & Go Live" → Coach Dashboard
- Secondary button: "Back" → Step 5
- Link: "Save as draft - Finish later"

**Post-Completion**:
- Confirmation message: "Welcome to RegattaFlow Coaches! 🎉"
- Next steps:
  - "Your profile is now live in the marketplace"
  - "Complete your calendar availability"
  - "Respond to sailor inquiries promptly"
  - "Check our coaching best practices guide"
- Email sent: "Welcome to RegattaFlow Coaches - Get Started Guide"

---

## Success Criteria

**Completion Metrics**:
- 85%+ of coaches complete all 6 steps
- Average completion time: < 8 minutes
- Certification upload rate: 70%+ (critical for trust)
- Background check completion: 100% for youth coaches

**Data Quality**:
- 95%+ have complete profile with photo and bio
- 80%+ have at least one certification uploaded
- 90%+ have pricing and availability set
- 85%+ have professional photos

**User Experience**:
- Mobile-responsive design (works on phones, tablets, desktop)
- Smooth step transitions with save progress
- Clear validation messages
- Preview functionality for marketplace profile

---

## Technical Requirements

### Data Models

**Coach Profile** (created across all steps):
```typescript
{
  id: uuid,
  user_id: uuid (FK to auth.users),
  full_name: string,
  professional_title: string,
  coaching_experience_years: number,
  organization: string | null,
  languages: string[],
  contact_phone: string,
  contact_preferences: string[],

  // Expertise (Step 2)
  boat_classes: {
    class_name: string,
    experience_level: enum,
    years_coaching: number,
    achievements: string[]
  }[],
  specializations: string[],
  coaching_levels: string[],

  // Venues (Step 3)
  home_venue_id: uuid,
  additional_venues: uuid[],
  travel_preference: enum,
  travel_radius: enum,
  virtual_coaching: boolean,

  // Pricing (Step 4)
  hourly_rate: number,
  half_day_rate: number | null,
  full_day_rate: number | null,
  group_rate: number | null,
  currency: string,
  availability_schedule: json,
  cancellation_policy: string,

  // Verification (Step 5)
  certifications: {
    name: string,
    issuer: string,
    issue_date: date,
    expiry_date: date | null,
    document_url: string,
    verified: boolean
  }[],
  background_check_status: enum,
  insurance_verified: boolean,

  // Profile (Step 6)
  profile_photo_url: string,
  bio: string,
  additional_photos: string[],
  video_url: string | null,
  success_stories: json[],
  philosophy_tags: string[],
  marketplace_visible: boolean,

  // Metadata
  verification_status: 'pending' | 'verified' | 'rejected',
  onboarding_completed: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

**Coach Availability**:
```typescript
{
  id: uuid,
  coach_id: uuid (FK),
  day_of_week: number (0-6),
  time_slot: 'morning' | 'afternoon' | 'evening',
  available: boolean,
  venue_id: uuid | null,
  created_at: timestamp
}
```

**Coach Certifications**:
```typescript
{
  id: uuid,
  coach_id: uuid (FK),
  certification_name: string,
  issuing_organization: string,
  certification_number: string | null,
  issue_date: date,
  expiry_date: date | null,
  document_url: string,
  verification_status: 'pending' | 'verified' | 'rejected',
  verified_by: uuid | null,
  verified_at: timestamp | null
}
```

### API Endpoints

**Onboarding Service**:
- `POST /api/coach/onboarding/profile` - Create/update coach profile (Step 1)
- `POST /api/coach/onboarding/expertise` - Save expertise and specializations (Step 2)
- `POST /api/coach/onboarding/venues` - Save venue coverage (Step 3)
- `POST /api/coach/onboarding/pricing` - Save pricing and availability (Step 4)
- `POST /api/coach/onboarding/verification` - Upload certifications (Step 5)
- `POST /api/coach/onboarding/profile-complete` - Complete marketplace profile (Step 6)
- `POST /api/coach/onboarding/complete` - Mark onboarding complete

**Verification Service**:
- `POST /api/coach/verification/upload-cert` - Upload certification document
- `POST /api/coach/verification/background-check` - Initiate background check
- `GET /api/coach/verification/status` - Check verification status

**Marketplace Service**:
- `GET /api/coach/marketplace/preview` - Preview profile as sailors see it
- `PATCH /api/coach/marketplace/visibility` - Toggle marketplace visibility

### RLS Policies (Supabase)

**Coach Profile Access**:
- Coaches can only view/edit their own profile
- Sailors can view verified coach profiles (marketplace_visible = true)
- Admins can view/edit all profiles for verification

**Certification Documents**:
- Only coach and admins can view certification documents
- Public can see verification status (verified badge) but not documents

**Availability Data**:
- Coaches can edit their own availability
- Sailors can view availability for booking
- Real-time updates via Supabase subscriptions

### File Storage (Supabase Storage)

**Buckets**:
- `coach-profiles`: Profile photos (public)
- `coach-galleries`: Additional photos (public)
- `coach-videos`: Video introductions (public)
- `coach-certifications`: Certification documents (private)
- `coach-insurance`: Insurance certificates (private)

**Security**:
- Profile images: Public read, coach-only write
- Certification documents: Coach and admin only
- File size limits: Images 5MB, Videos 50MB, PDFs 10MB
- Virus scanning on all uploads

---

## Implementation Phases

### Phase 1: Core Onboarding (MVP)
- Steps 1-3 (Profile, Expertise, Venues)
- Basic pricing setup (Step 4 - hourly rate only)
- Simple availability calendar
- Profile completion (Step 6 - basic bio and photo)

### Phase 2: Advanced Pricing & Verification
- Full pricing options (packages, group rates)
- Certification upload and verification system
- Background check integration
- Insurance verification

### Phase 3: Marketplace Optimization
- Rich bio editor with templates
- Video introduction upload
- Success stories and testimonials
- Advanced availability management
- Profile optimization suggestions

### Phase 4: Enhancements
- AI-assisted bio writing
- Automated certification expiry reminders
- Dynamic pricing recommendations
- Marketplace analytics for coaches
- A/B testing for profile optimization

---

## Open Questions / Decisions Needed

1. **Verification Timeline**: How fast can we verify certifications? (Target: 48 hours)
2. **Background Check Provider**: Which third-party service? (SafeSport, NCSI, Checkr?)
3. **Commission Structure**: 15% standard - do we offer volume discounts for busy coaches?
4. **Multi-Currency**: How to handle exchange rates and display pricing?
5. **Cancellation Enforcement**: How to handle disputes between coaches and sailors?
6. **Video Hosting**: Self-host videos or integrate with YouTube/Vimeo?
7. **Calendar Integration**: Support Google Calendar/iCal sync?

---

## Design Guidelines

### Visual Design
- **Progress Bar**: Linear, 6 segments, blue fill
- **Primary Button**: Blue (#2563EB), clear call-to-action
- **Certification Badges**: Professional gold/blue verification icons
- **Photo Guidelines**: Professional sailing imagery emphasis

### Responsive Breakpoints
- **Mobile**: < 768px (stacked layout, simplified uploads)
- **Tablet**: 768px - 1024px (centered form, max-width 700px)
- **Desktop**: > 1024px (wider form, live preview sidebar)

### Accessibility
- **WCAG AA compliance** for all inputs
- **Screen reader** support for certifications and verification status
- **Keyboard navigation** through all form fields
- **File upload** drag-and-drop + click-to-browse

---

## Coach Marketplace Integration Notes

**How Coaches Appear to Sailors**:
1. Search results show: Photo, name, title, rating, price, specialties, availability
2. Profile page shows: Full bio, certifications (verified badge), photos/video, reviews
3. Booking flow: Select session type → Choose date/time → Payment → Confirmation

**Coach Discovery Factors**:
- Specialization match (boat class, coaching style)
- Venue proximity or travel availability
- Price range fit
- Availability match
- Rating and review score
- Verification status (certified coaches rank higher)
- Response time to inquiries

---

**Document Version**: 1.0
**Last Updated**: 2025-10-03
**Author**: RegattaFlow Product Team
