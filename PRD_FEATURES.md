# Product Requirements Document: Features
## RegattaFlow - Comprehensive Feature Specifications

**Version**: 1.0
**Last Updated**: 2025-11-10
**Document Owner**: Product Team
**Status**: Active Development

---

## Table of Contents

1. [Feature Overview Matrix](#feature-overview-matrix)
2. [Core Platform Features](#core-platform-features)
3. [Sailor Features (B2C)](#sailor-features-b2c)
4. [Championship Organizer Features (B2B)](#championship-organizer-features-b2b)
5. [Championship Participant Features](#championship-participant-features)
6. [AI & Intelligence Features](#ai--intelligence-features)
7. [API Requirements](#api-requirements)
8. [Non-Functional Requirements](#non-functional-requirements)

---

## Feature Overview Matrix

### Legend
- **User Type**: S=Sailor, O=Organizer, P=Participant, A=All
- **Priority**: P0=Must have (MVP), P1=Important (V1), P2=Nice to have (V2+)
- **Tier**: F=Free, PR=Pro (€100/yr), CH=Championship (€250/yr), B=B2B Paid
- **Phase**: Foundation, Core, Championship, Organizer, Learning, Polish, Post-Launch

| # | Feature Name | User Type | Priority | Tier | Phase | Status |
|---|--------------|-----------|----------|------|-------|--------|
| 1 | User Authentication & Profiles | A | P0 | F | Foundation | ✅ Complete |
| 2 | Subscription Management | S | P0 | PR/CH | Core | ✅ Complete |
| 3 | Venue Intelligence Database | S | P0 | PR/CH | Core | ✅ Complete |
| 4 | 3D Bathymetry Visualization | S | P1 | CH | Core | ✅ Complete |
| 5 | Weather Data Integration | S | P0 | PR/CH | Core | ✅ Complete |
| 6 | Tidal & Current Analysis | S | P0 | PR/CH | Core | ✅ Complete |
| 7 | Multi-Championship Support | A | P0 | F | Championship | ✅ Complete |
| 8 | Custom Championship Branding | O | P0 | B | Organizer | 🚧 In Progress |
| 9 | Competitor Registration System | O | P0 | B | Organizer | ✅ Complete |
| 10 | Schedule Management | O/P | P0 | B/F | Championship | ✅ Complete |
| 11 | Real-Time Push Notifications | O/P | P0 | B/F | Championship | ✅ Complete |
| 12 | Notice Board System | O/P | P0 | B/F | Championship | ✅ Complete |
| 13 | Race Results Entry & Publication | O | P0 | B | Organizer | ✅ Complete |
| 14 | Series Standings Calculation | O/P | P0 | B/F | Organizer | ✅ Complete |
| 15 | Logistics Tracking (Boat Shipments) | O/P | P1 | B | Organizer | 🚧 In Progress |
| 16 | Offline-First Architecture | P | P0 | F | Championship | ✅ Complete |
| 17 | Offline Content Sync | P | P0 | F | Championship | ✅ Complete |
| 18 | Online Course Platform | S | P1 | PR/CH | Learning | 📋 Planned |
| 19 | Video Learning Player | S | P1 | PR/CH | Learning | 📋 Planned |
| 20 | Coach Discovery & Booking | S | P1 | CH | Learning | ✅ Complete |
| 21 | AI Race Strategy Generation | S | P0 | CH | Core | ✅ Complete |
| 22 | AI Tactical Analysis | S | P0 | CH | Core | ✅ Complete |
| 23 | AI Post-Race Coaching | S | P1 | CH | Core | ✅ Complete |
| 24 | Claude Skills Integration | S | P1 | CH | Core | ✅ Complete |
| 25 | GPS Track Recording | S | P1 | PR/CH | Core | ✅ Complete |
| 26 | Race Timer with Phase Detection | S | P1 | PR/CH | Core | ✅ Complete |
| 27 | Fleet Management | S | P1 | F | Core | ✅ Complete |
| 28 | Fleet Insights & Analytics | S | P1 | PR/CH | Core | ✅ Complete |
| 29 | Race Document Management (NOR) | O/P | P1 | B/F | Championship | ✅ Complete |
| 30 | Document AI Processing | O | P2 | B | Organizer | 🚧 In Progress |
| 31 | Multi-Language Support | P | P2 | F | Polish | 📋 Planned |
| 32 | Course Mark Editor | O/S | P1 | PR/B | Organizer | ✅ Complete |
| 33 | Venue Maps (Offline) | P | P0 | F | Championship | ✅ Complete |
| 34 | QR Code App Distribution | O | P0 | B | Organizer | 📋 Planned |
| 35 | Email Notifications | A | P0 | F | Foundation | ✅ Complete |
| 36 | In-App Messaging | O/P | P2 | B/F | Post-Launch | 📋 Planned |
| 37 | Social Sharing | S | P2 | F | Post-Launch | 📋 Planned |
| 38 | Protest Management | O/P | P2 | B/F | Post-Launch | 📋 Planned |
| 39 | Live Race Tracking (GPS) | S/P | P2 | CH/B | Post-Launch | 📋 Planned |
| 40 | Video Analysis Tools | S | P2 | CH | Post-Launch | 📋 Planned |
| 41 | Analytics Dashboard (Organizer) | O | P1 | B | Organizer | 🚧 In Progress |
| 42 | Bulk Data Import/Export | O | P1 | B | Organizer | ✅ Complete |
| 43 | Payment Processing (Stripe) | S/O | P0 | PR/CH | Foundation | ✅ Complete |
| 44 | Team Collaboration (Organizers) | O | P1 | B | Organizer | 📋 Planned |
| 45 | Certificate Generation (Courses) | S | P1 | PR/CH | Learning | 📋 Planned |

**Status Legend**:
- ✅ Complete: Fully implemented and tested
- 🚧 In Progress: Partially implemented or in active development
- 📋 Planned: Designed but not yet implemented

---

## Core Platform Features

### Feature 1: User Authentication & Profiles

**Feature ID**: CORE-001
**Priority**: P0 (Must Have)
**User Type**: All
**Tier**: Free (baseline), enhanced for paid tiers

#### Overview
Secure authentication system with social login support and comprehensive user profile management.

#### Functional Requirements

**1.1 Authentication Methods**
- Email + Password (Supabase Auth)
- Google OAuth 2.0
- Apple Sign In
- Magic Link (passwordless email)
- Session management with JWT tokens
- Auto-refresh token rotation

**1.2 Profile Management**
- **Sailor Profiles** (table: `sailor_profiles`):
  - Name, email, profile photo
  - Primary boat class
  - Home sailing club/region
  - Experience level (Beginner, Intermediate, Advanced, Expert)
  - Sailing resume (years sailing, major championships)
  - Boat details (make, model, sail number)
  - Emergency contact information

- **Coach Profiles** (table: `coach_profiles`):
  - All sailor fields plus:
  - Certifications (World Sailing, national federation)
  - Specialties (boat classes, skill areas)
  - Bio and experience
  - Hourly rate and availability
  - Student testimonials

- **Organizer Profiles** (table: `organizer_profiles`):
  - Organization name
  - Role (Race Officer, Technical Delegate, Club Manager)
  - Championships managed (history)
  - Contact details

**1.3 Password Management**
- Password reset via email
- Password strength requirements (min 8 chars, mixed case, numbers)
- Account recovery flow

**1.4 Multi-Role Support**
- Single user can have multiple roles (sailor + coach, sailor + organizer)
- Role switcher in app navigation
- Separate workspaces per role

#### Technical Specifications

**Database Tables**:
```sql
-- Core auth handled by Supabase auth.users

CREATE TABLE sailor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  boat_class TEXT,
  home_club TEXT,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  bio TEXT,
  emergency_contact JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE coach_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  certifications TEXT[],
  specialties TEXT[],
  hourly_rate_eur INTEGER,
  availability JSONB,
  total_sessions INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies**:
- Users can read their own profile
- Users can update their own profile
- Public can read coach profiles (for discovery)
- Only authenticated users can create profiles

**API Endpoints**:
- `POST /auth/signup` - Create account
- `POST /auth/login` - Authenticate
- `POST /auth/reset-password` - Password reset
- `GET /profile/:userId` - Get profile
- `PATCH /profile/:userId` - Update profile
- `GET /profile/:userId/role` - Get user roles

#### Acceptance Criteria
- [ ] User can sign up with email/password in <30 seconds
- [ ] User can sign in with Google in <10 seconds
- [ ] User can reset password and receive email within 2 minutes
- [ ] User profile loads in <500ms
- [ ] Profile photo upload supports images up to 5MB
- [ ] All form fields have proper validation
- [ ] Role switching works without re-authentication

---

### Feature 2: Subscription Management

**Feature ID**: CORE-002
**Priority**: P0 (Must Have)
**User Type**: Sailors
**Tier**: Pro (€100/yr), Championship (€250/yr)

#### Overview
Flexible subscription system with multiple tiers, free trials, and seamless payment integration.

#### Functional Requirements

**2.1 Subscription Tiers**

**Free Tier**:
- Access to 10 venues (limited preview)
- Basic race tracking
- Community features (fleet membership)
- Limited AI suggestions (3 per month)

**Pro Tier** (€100/year or €8.33/month):
- Full access to 147+ venues
- Complete weather and tidal data
- Unlimited AI race suggestions
- Advanced race tracking
- 1 online course included
- Priority support

**Championship Tier** (€250/year or €20.83/month):
- Everything in Pro
- Personal AI coaching (unlimited)
- Custom race analysis reports
- All online courses included (unlimited access)
- Priority booking for in-person coaching
- 20% discount on coaching sessions
- Early access to new features

**2.2 Free Trial**
- 14-day free trial for Pro and Championship tiers
- No credit card required to start trial
- Automated email reminders at Day 7, Day 13, Day 14
- Auto-convert to paid at end of trial (if payment method on file)
- Can cancel anytime during trial

**2.3 Payment Processing**
- Stripe integration for all payments
- Support payment methods:
  - Credit/debit cards (Visa, Mastercard, Amex)
  - Apple Pay
  - Google Pay
  - SEPA Direct Debit (Europe)
- Currency: EUR (primary), USD, GBP
- Invoicing: Automatic invoice generation and email
- VAT handling for EU customers

**2.4 Subscription Management**
- View current plan and billing details
- Upgrade/downgrade between tiers
- Cancel subscription (retain access until period end)
- Reactivate cancelled subscription
- Update payment method
- View billing history and download invoices
- Proration for mid-cycle upgrades

**2.5 Grace Period & Dunning**
- Failed payment: Retry 3 times over 7 days
- Email notifications on failed payment
- 7-day grace period with continued access
- Account downgrade to Free tier after grace period

#### Technical Specifications

**Database Tables**:
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  tier TEXT CHECK (tier IN ('free', 'pro', 'championship')) DEFAULT 'free',
  status TEXT CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  stripe_invoice_id TEXT UNIQUE,
  amount_eur INTEGER NOT NULL,
  status TEXT CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  invoice_pdf TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Stripe Integration**:
- Webhook endpoint: `/api/webhooks/stripe`
- Handle events:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
- Price IDs (Stripe):
  - `price_pro_yearly`
  - `price_pro_monthly`
  - `price_championship_yearly`
  - `price_championship_monthly`

**API Endpoints**:
- `GET /subscription` - Get user's subscription
- `POST /subscription/checkout` - Create Stripe checkout session
- `POST /subscription/upgrade` - Upgrade tier
- `POST /subscription/cancel` - Cancel subscription
- `POST /subscription/reactivate` - Reactivate subscription
- `GET /subscription/invoices` - List invoices
- `POST /subscription/portal` - Generate Stripe Customer Portal link

#### Acceptance Criteria
- [ ] User can start free trial without payment in <30 seconds
- [ ] User can upgrade to paid tier with 3 clicks
- [ ] Payment processing completes in <10 seconds
- [ ] Failed payment triggers email within 5 minutes
- [ ] Subscription status updates in real-time via webhooks
- [ ] Invoice PDF generation works 100% of the time
- [ ] Prorated charges calculated correctly for mid-cycle changes
- [ ] Access restrictions apply immediately on downgrade/cancellation

---

### Feature 3: Venue Intelligence Database

**Feature ID**: CORE-003
**Priority**: P0 (Must Have)
**User Type**: Sailors
**Tier**: Free (preview), Pro (full access), Championship (full + AI analysis)

#### Overview
Comprehensive database of 147+ global sailing venues with detailed environmental data, historical weather, tidal information, and local knowledge.

#### Functional Requirements

**3.1 Venue Data**

Each venue includes:
- **Basic Information**:
  - Name, location (city, country, coordinates)
  - Water type (harbor, bay, ocean, lake, river)
  - Venue type (yacht club, public beach, marina)
  - Photos (minimum 3 high-quality images)
  - Description and notable characteristics

- **Environmental Data**:
  - Typical wind patterns (prevailing direction, average speed)
  - Wind rose (historical data visualization)
  - Wave conditions (average height, period)
  - Water depth and bathymetry
  - Current patterns and tidal ranges
  - Water temperature by season

- **Venue Characteristics**:
  - Race area boundaries
  - Launch facilities
  - Parking availability
  - Sailing season (best months)
  - Local rules and regulations
  - Navigation hazards

- **Historical Data**:
  - Past championships held
  - Notable race results
  - Weather during major events
  - Statistical trends

**3.2 Content Gating by Tier**

**Free Tier**:
- Access to 10 venues (popular/nearest)
- Venue name, location, basic description
- 1 photo
- Limited weather preview (7-day forecast only)

**Pro Tier**:
- Access to all 147+ venues
- Full environmental data
- All photos and detailed descriptions
- 12-month weather history
- Tidal data and charts
- Bathymetry (2D maps)

**Championship Tier**:
- Everything in Pro
- 3D bathymetry visualization
- AI-powered tactical analysis
- Custom race strategy generation for venue
- Unlimited venue report exports (PDF)

**3.3 Search & Discovery**
- **Search Methods**:
  - Text search (name, location)
  - Map-based search (interactive map)
  - Nearby venues (geolocation)
  - Filter by characteristics (water type, race history)

- **Sorting**:
  - Alphabetical
  - Distance from user
  - Popularity (races held)
  - Recently added

- **Favorites**:
  - Save unlimited favorites
  - Organize into lists (e.g., "2025 Race Calendar")
  - Quick access from dashboard

**3.4 Venue Reports**
- Generate PDF report with:
  - Full venue intelligence
  - Weather forecast for selected dates
  - Tidal charts
  - Bathymetry map
  - Tactical recommendations (Championship tier)
- Export and email report
- Share with crew/team

#### Technical Specifications

**Database Tables**:
```sql
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  city TEXT,
  country TEXT,
  country_code TEXT,
  water_type TEXT CHECK (water_type IN ('harbor', 'bay', 'ocean', 'lake', 'river')),
  description TEXT,
  characteristics JSONB,
  photos TEXT[],
  weather_data JSONB,
  tidal_data JSONB,
  bathymetry_tiles JSONB,
  race_area_boundaries GEOGRAPHY(POLYGON, 4326),
  metadata JSONB,
  popularity_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venues_location ON venues USING GIST(location);
CREATE INDEX idx_venues_slug ON venues(slug);
CREATE INDEX idx_venues_popularity ON venues(popularity_score DESC);

CREATE TABLE venue_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  venue_id UUID NOT NULL REFERENCES venues(id),
  list_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, venue_id)
);
```

**External Integrations**:
- **StormGlass API**: Weather and ocean data
- **GEBCO**: Bathymetric data (Global Bathymetry)
- **OpenStreetMap**: Base maps and facility data

**API Endpoints**:
- `GET /venues` - List venues (with pagination, filters)
- `GET /venues/:venueId` - Get venue details
- `GET /venues/search?q=` - Search venues
- `GET /venues/nearby?lat=&lng=&radius=` - Nearby venues
- `POST /venues/:venueId/favorite` - Add to favorites
- `DELETE /venues/:venueId/favorite` - Remove from favorites
- `POST /venues/:venueId/report` - Generate PDF report

**Supabase Edge Functions**:
- `venue-report-generator` - PDF generation
- `venue-weather-sync` - Scheduled weather data updates
- `venue-ai-analysis` - AI tactical analysis (Championship tier)

#### Acceptance Criteria
- [ ] All 147+ venues have complete data (no missing required fields)
- [ ] Venue list loads in <1 second (with pagination)
- [ ] Venue detail page loads in <2 seconds
- [ ] Search returns results in <500ms
- [ ] Map view displays all venues with smooth panning/zooming
- [ ] Favorites sync across devices in <5 seconds
- [ ] PDF report generates in <30 seconds
- [ ] 3D bathymetry renders on Championship tier devices without lag
- [ ] Tier restrictions enforced correctly (Free users see upgrade prompt)

---

## Sailor Features (B2C)

### Feature 4: 3D Bathymetry Visualization

**Feature ID**: SAILOR-001
**Priority**: P1 (Important)
**User Type**: Sailors
**Tier**: Championship (€250/yr)

#### Overview
Interactive 3D underwater terrain visualization showing depth contours, hazards, and tactical zones at race venues.

#### Functional Requirements

**4.1 3D Visualization**
- Real-time 3D rendering of underwater topography
- Smooth camera controls (pan, zoom, rotate, tilt)
- Depth color gradient (deep blue → shallow green → beach yellow)
- Adjustable vertical exaggeration (1x - 10x)
- Toggle between 2D and 3D views

**4.2 Data Layers**
- **Depth Contours**: Isolines at configurable intervals (5m, 10m, 20m)
- **Hazards**: Rocks, wrecks, reefs marked with icons
- **Tactical Zones**: Overlays showing depth-based advantages
- **Current Patterns**: Arrows showing flow direction
- **Race Course**: Overlay of course marks and boundaries

**4.3 Interaction**
- Tap any point to see exact depth
- Measure distances between points
- Create depth profiles along a line
- Screenshot/export current view
- Share tactical insights with team

**4.4 Performance**
- Progressive loading for large datasets
- Tile-based rendering (load only visible area)
- Cached tiles for offline use
- Adaptive quality based on device performance

#### Technical Specifications

**Database**:
```sql
CREATE TABLE bathymetry_tiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id),
  zoom_level INTEGER,
  tile_x INTEGER,
  tile_y INTEGER,
  depth_data BYTEA, -- Compressed elevation data
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id, zoom_level, tile_x, tile_y)
);
```

**Technology Stack**:
- **3D Library**: deck.gl (WebGL-based)
- **Tile Server**: Custom Supabase Edge Function
- **Data Format**: PMTiles (compressed tile format)
- **Offline Storage**: SQLite with compressed tiles

**API Endpoints**:
- `GET /bathymetry/:venueId/tiles/:z/:x/:y` - Get tile
- `GET /bathymetry/:venueId/depth?lat=&lng=` - Get depth at point
- `POST /bathymetry/:venueId/profile` - Generate depth profile

#### Acceptance Criteria
- [ ] 3D view renders in <3 seconds on high-end devices
- [ ] 3D view renders in <8 seconds on mid-range devices
- [ ] Smooth interaction (60 FPS on high-end, 30 FPS on mid-range)
- [ ] Tiles cache successfully for offline use
- [ ] Depth accuracy within ±1 meter vs GEBCO source data
- [ ] Feature restricted to Championship tier (clear upgrade prompt for others)

---

### Feature 5: Weather Data Integration

**Feature ID**: SAILOR-002
**Priority**: P0 (Must Have)
**User Type**: Sailors
**Tier**: Pro (basic), Championship (advanced)

#### Overview
Real-time and historical weather data from StormGlass API, including wind, waves, temperature, and precipitation.

#### Functional Requirements

**5.1 Current Conditions**
- Wind speed and direction
- Gusts
- Wave height and period
- Water temperature
- Air temperature
- Visibility
- Precipitation
- Cloud cover

**5.2 Forecasts**
- 7-day forecast (Pro tier)
- 14-day forecast (Championship tier)
- Hourly granularity
- Updated every 3 hours
- Confidence intervals for forecasts

**5.3 Historical Data**
- 12-month history (Pro tier)
- 5-year history (Championship tier)
- Statistical analysis (averages, extremes)
- Seasonal patterns
- Wind rose charts

**5.4 Visualizations**
- Wind arrow maps
- Wave height heatmaps
- Time-series charts (wind speed over time)
- Comparison charts (current vs historical)

**5.5 Alerts**
- Custom weather alerts (e.g., "Notify if wind >20 kts")
- Push notifications for significant changes
- Safety warnings (storms, lightning)

#### Technical Specifications

**Database**:
```sql
CREATE TABLE weather_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  timestamp TIMESTAMPTZ NOT NULL,
  forecast_data JSONB,
  source TEXT DEFAULT 'stormglass',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id, timestamp)
);

CREATE INDEX idx_weather_venue_timestamp ON weather_cache(venue_id, timestamp DESC);
```

**External API**:
- **StormGlass API**: Primary weather source
- **Rate Limits**: 10,000 requests/day (paid plan)
- **Caching Strategy**: Cache forecasts for 3 hours, historical data for 24 hours

**API Endpoints**:
- `GET /weather/:venueId/current` - Current conditions
- `GET /weather/:venueId/forecast?days=7` - Forecast
- `GET /weather/:venueId/history?start=&end=` - Historical data
- `POST /weather/alerts` - Create weather alert

**Supabase Edge Functions**:
- `weather-sync-cron` - Scheduled updates (every 3 hours)
- `weather-alert-processor` - Process and send alerts

#### Acceptance Criteria
- [ ] Current conditions load in <1 second (from cache)
- [ ] Forecast accuracy >80% for 24-hour predictions
- [ ] Historical data charts render in <2 seconds
- [ ] Weather alerts sent within 5 minutes of trigger
- [ ] Offline mode shows last cached data with timestamp
- [ ] Graceful degradation if StormGlass API unavailable

---

### Feature 21: AI Race Strategy Generation

**Feature ID**: AI-001
**Priority**: P0 (Must Have)
**User Type**: Sailors
**Tier**: Championship (€250/yr)

#### Overview
AI-powered comprehensive race strategy generation using Claude with custom sailing skills, incorporating venue intelligence, weather, tides, and competitor analysis.

#### Functional Requirements

**21.1 Strategy Components**
- **Pre-Race Analysis**:
  - Venue assessment (depth, current, wind patterns)
  - Weather forecast interpretation
  - Tidal timing analysis
  - Start line positioning recommendations

- **Leg-by-Leg Strategy**:
  - Upwind tactics (tack angles, laylines)
  - Downwind tactics (jibing angles, VMG optimization)
  - Reaching strategies
  - Mark rounding techniques

- **Contingency Planning**:
  - Wind shift scenarios (left vs right)
  - Weather change responses
  - Tactical options if behind/ahead
  - Alternative routing suggestions

**21.2 AI Skills Integration**
- **Built-in Skills** (15+ custom Claude skills):
  - `race-strategy-analyst` - Comprehensive strategy
  - `tidal-opportunism-analyst` - Tidal advantage analysis
  - `current-counterplay-advisor` - Current tactics
  - `slack-window-planner` - Tidal slack optimization
  - `boat-tuning-analyst` - Rig tuning recommendations
  - `wind-shift-predictor` - Shift pattern analysis
  - Plus 9 more specialized skills

- **Dynamic Context Injection**:
  - Venue intelligence automatically loaded
  - Weather forecast injected
  - User's historical performance considered
  - Competitor data (if available)

**21.3 Strategy Delivery**
- **Format**: Markdown report with sections
- **Sections**:
  1. Executive Summary
  2. Venue Analysis
  3. Weather & Tidal Summary
  4. Recommended Start Strategy
  5. Leg-by-Leg Tactics
  6. Contingency Plans
  7. Key Reminders

- **Export Options**:
  - PDF download
  - Email to crew
  - Save to race preparation notes

- **Interactive Chat**:
  - Ask follow-up questions
  - Request specific scenario analysis
  - Refine strategy based on new information

**21.4 Learning & Improvement**
- AI learns from user feedback
- Post-race analysis compares strategy vs actual performance
- Iterative improvement suggestions
- Builds user-specific knowledge base

#### Technical Specifications

**Database**:
```sql
CREATE TABLE ai_race_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  race_id UUID REFERENCES races(id),
  venue_id UUID REFERENCES venues(id),
  strategy_markdown TEXT,
  skills_used TEXT[],
  context_data JSONB,
  user_feedback JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  activity_type TEXT CHECK (activity_type IN ('strategy', 'coaching', 'analysis', 'chat')),
  skill_name TEXT,
  input_data JSONB,
  output_data JSONB,
  tokens_used INTEGER,
  cost_usd DECIMAL(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**AI Integration**:
- **Model**: Claude 3.5 Sonnet (Anthropic)
- **MCP Skills**: Custom skills deployed to Anthropic Platform
- **Proxy**: Supabase Edge Function (`anthropic-skills-proxy`)
- **Cost Control**: Monthly token limits by tier

**API Endpoints**:
- `POST /ai/strategy/generate` - Generate strategy
- `POST /ai/strategy/chat` - Chat about strategy
- `GET /ai/strategy/:strategyId` - Get saved strategy
- `PATCH /ai/strategy/:strategyId/feedback` - Submit feedback

**Supabase Edge Functions**:
```typescript
// supabase/functions/anthropic-skills-proxy/index.ts
import Anthropic from '@anthropic-ai/sdk';

Deno.serve(async (req) => {
  const { raceId, venueId, customQuestions } = await req.json();

  // Load context
  const venue = await getVenue(venueId);
  const weather = await getWeather(venueId);
  const tides = await getTides(venueId);

  // Call Claude with skills
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: buildStrategyPrompt(venue, weather, tides, customQuestions)
    }],
    skills: [
      { type: 'skill', name: 'race-strategy-analyst' },
      { type: 'skill', name: 'tidal-opportunism-analyst' },
      // ... other skills
    ]
  });

  return new Response(JSON.stringify(response));
});
```

#### Acceptance Criteria
- [ ] Strategy generates in <30 seconds (90th percentile)
- [ ] Strategy quality rated 4.5+ stars by users
- [ ] All relevant skills execute successfully
- [ ] Cost per strategy generation <$0.50 USD
- [ ] Monthly token usage stays within budget
- [ ] Offline mode shows cached strategies with staleness indicator
- [ ] User can regenerate strategy with different parameters

---

## Championship Organizer Features (B2B)

### Feature 8: Custom Championship Branding

**Feature ID**: ORG-001
**Priority**: P0 (Must Have)
**User Type**: Championship Organizers
**Tier**: B2B Project-Based (€15k-25k)

#### Overview
Fully customized championship mobile apps with organizer's branding, distributed via App Store and Play Store.

#### Functional Requirements

**8.1 Branding Elements**
- **Logo**:
  - Upload square logo (1024x1024 PNG)
  - Used in app icon, splash screen, headers
  - Validation: File size <2MB, transparent background

- **Colors**:
  - Primary brand color (HEX picker)
  - Secondary brand color
  - Accent color
  - Background colors (light/dark mode)
  - Preview of color application

- **Typography**:
  - Optional custom font upload
  - Fallback to system fonts

- **App Icon**:
  - Auto-generated from logo + background color
  - Preview for iOS and Android
  - Adaptive icon for Android

- **Splash Screen**:
  - Logo + championship name
  - Customizable background
  - Loading animation

**8.2 App Configuration**
- **Naming**:
  - App name (e.g., "Dragon Worlds 2027")
  - Bundle ID (e.g., `com.regattaflow.dragonworlds2027`)

- **Platform Selection**:
  - iOS only
  - Android only
  - Both (default)

- **Features Toggle**:
  - Enable/disable specific features:
    - Schedule management
    - Notice board
    - Results
    - Logistics tracking
    - Venue maps
    - Weather data

- **Content**:
  - Welcome message
  - About the championship
  - Sponsor logos
  - External links (website, social media)

**8.3 Build & Deployment**
- **Automated Build Pipeline**:
  - Triggered upon branding approval
  - Expo EAS build for iOS/Android
  - Estimated time: 30-45 minutes

- **App Store Submission**:
  - RegattaFlow manages submission process
  - Organizer provides:
    - App Store description
    - Screenshots (we can generate templates)
    - Privacy policy (template provided)

- **Distribution**:
  - QR code for easy download
  - Deep links for email campaigns
  - Web landing page with download buttons

**8.4 Updates & Maintenance**
- Over-the-air (OTA) updates for content changes
- Full rebuild for branding changes
- Post-event archival (app remains functional but read-only)

#### Technical Specifications

**Database**:
```sql
CREATE TABLE championships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  venue_id UUID REFERENCES venues(id),
  boat_class TEXT,
  expected_competitors INTEGER,
  app_config JSONB NOT NULL, -- Branding and feature toggles
  build_status TEXT CHECK (build_status IN ('draft', 'building', 'published', 'archived')),
  ios_bundle_id TEXT,
  android_package_name TEXT,
  app_store_url TEXT,
  play_store_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- app_config JSONB structure:
{
  "branding": {
    "logo_url": "https://...",
    "primary_color": "#1E40AF",
    "secondary_color": "#FBBF24",
    "accent_color": "#10B981"
  },
  "features": {
    "schedule": true,
    "notices": true,
    "results": true,
    "logistics": true,
    "venue_maps": true,
    "weather": true
  },
  "content": {
    "welcome_message": "Welcome to Dragon Worlds 2027!",
    "about": "The premier dragon class championship...",
    "sponsors": ["https://logo1.png", "https://logo2.png"]
  }
}
```

**Build Process**:
```yaml
# Expo app.config.js (dynamic)
export default ({ config }) => {
  const championship = loadChampionshipConfig();

  return {
    ...config,
    name: championship.name,
    slug: championship.slug,
    icon: championship.branding.logo_url,
    splash: {
      image: generateSplashScreen(championship),
      backgroundColor: championship.branding.primary_color
    },
    ios: {
      bundleIdentifier: championship.ios_bundle_id
    },
    android: {
      package: championship.android_package_name,
      adaptiveIcon: {
        foregroundImage: championship.branding.logo_url,
        backgroundColor: championship.branding.primary_color
      }
    }
  };
};
```

**Expo EAS Build**:
```bash
# Triggered via GitHub Actions
eas build --platform all --profile production --non-interactive
```

**API Endpoints**:
- `POST /organizer/championships` - Create championship
- `PATCH /organizer/championships/:id/branding` - Update branding
- `POST /organizer/championships/:id/build` - Trigger app build
- `GET /organizer/championships/:id/build-status` - Check build progress
- `POST /organizer/championships/:id/publish` - Submit to app stores

#### Acceptance Criteria
- [ ] Organizer can complete branding setup in <15 minutes
- [ ] Logo upload supports PNG, JPG, SVG up to 5MB
- [ ] Color picker provides real-time preview
- [ ] App build completes in <45 minutes
- [ ] Build process has <2% failure rate
- [ ] App passes App Store review 95%+ of the time
- [ ] QR code generation is instant
- [ ] OTA updates deploy in <5 minutes

---

### Feature 13: Race Results Entry & Publication

**Feature ID**: ORG-002
**Priority**: P0 (Must Have)
**User Type**: Championship Organizers
**Tier**: B2B Project-Based

#### Overview
Efficient race results entry system with multiple input methods, automated scoring, and instant publication to competitors.

#### Functional Requirements

**13.1 Results Entry Methods**

**Manual Entry**:
- Drag-and-drop finish order
- Autocomplete sail numbers from competitor list
- Automatic position numbering
- Finish time entry (optional)
- Status codes (DNF, DSQ, OCS, DNS, RAF, BFD, etc.)
- Penalty points entry
- Quick add/remove boats

**Import from File**:
- Supported formats:
  - CSV (standard format)
  - TackTracker export
  - SailRace XML
  - Manage2Sail export
- Field mapping interface
- Validation and error reporting
- Preview before import

**Sail Number Scanner**:
- Camera-based QR code scanning
- Sequential scan for finish order
- Manual override if scan fails
- Bluetooth hardware scanner support (optional)

**13.2 Validation & Error Checking**
- All registered boats accounted for
- No duplicate finish positions
- No invalid sail numbers
- Logical finish time progression
- Missing data warnings
- Auto-fix suggestions

**13.3 Scoring Systems**
- **Low Point System** (default):
  - 1st place = 1 point, 2nd = 2 points, etc.
  - DNF = boats in race + 1
  - DNS/DNC = boats in race + 1
  - DSQ/RAF = boats in race + 2

- **High Point System**:
  - 1st place = N points (N = boats in race)
  - Decrementing scores

- **Custom Scoring**:
  - Define custom point allocation
  - Import from Notice of Race (NOR)

**13.4 Series Standings**
- Automatic calculation after each race
- Drop races (e.g., drop worst 2 results)
- Tie-breaking rules
- Qualification cutoffs (if applicable)
- Real-time leaderboard updates

**13.5 Publication Options**
- **Provisional Results**:
  - Published immediately
  - Protest period timer starts
  - Can be amended if protests upheld

- **Final Results**:
  - Locked after protest period
  - Cannot be changed (admin override only)
  - Triggers final standings recalculation

**13.6 Notifications**
- Push notification to all competitors
- Customizable notification message
- Batch notifications (don't spam)
- Email summary (optional)

#### Technical Specifications

**Database**:
```sql
CREATE TABLE races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id UUID NOT NULL REFERENCES championships(id),
  race_number INTEGER NOT NULL,
  race_date DATE,
  scheduled_time TIME,
  division TEXT,
  course_config JSONB,
  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'postponed', 'cancelled')),
  weather_conditions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(championship_id, race_number, division)
);

CREATE TABLE race_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID NOT NULL REFERENCES races(id),
  competitor_id UUID NOT NULL REFERENCES race_participants(id),
  finish_position INTEGER,
  finish_time TIME,
  status_code TEXT DEFAULT 'OK',
  penalty_points INTEGER DEFAULT 0,
  points_scored DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(race_id, competitor_id)
);

CREATE TABLE series_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id UUID NOT NULL REFERENCES championships(id),
  competitor_id UUID NOT NULL REFERENCES race_participants(id),
  division TEXT,
  total_points DECIMAL(7,2),
  races_completed INTEGER,
  dropped_races INTEGER[],
  position INTEGER,
  tie_breaker_position INTEGER,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(championship_id, competitor_id)
);
```

**Scoring Engine**:
```typescript
// services/ScoringService.ts
export class ScoringService {
  calculateRacePoints(
    results: RaceResult[],
    scoringSystem: 'low-point' | 'high-point',
    boatsInRace: number
  ): ScoredResult[] {
    // Implement scoring logic
  }

  calculateSeriesStandings(
    raceResults: RaceResult[][],
    dropCount: number,
    tieBreakRules: TieBreakRule[]
  ): SeriesStanding[] {
    // Implement series calculation
  }
}
```

**API Endpoints**:
- `POST /organizer/races/:raceId/results` - Enter results
- `POST /organizer/races/:raceId/results/import` - Import from file
- `PATCH /organizer/races/:raceId/results/:resultId` - Update result
- `POST /organizer/races/:raceId/results/publish` - Publish results
- `GET /organizer/championships/:id/standings` - Get series standings
- `POST /organizer/races/:raceId/results/calculate` - Recalculate scores

**Supabase Edge Functions**:
- `results-scoring-engine` - Server-side scoring calculation
- `results-publication` - Handle publication and notifications

#### Acceptance Criteria
- [ ] Manual entry: Add 50 boats in <5 minutes
- [ ] CSV import: 150 boats in <30 seconds
- [ ] Validation runs in <1 second for 200 boats
- [ ] Scoring calculation completes in <2 seconds
- [ ] Series standings update in <5 seconds after results published
- [ ] Push notifications sent to all competitors in <10 seconds
- [ ] 100% accuracy in scoring (verified against manual calculation)
- [ ] Concurrent editors prevented (locking mechanism)
- [ ] Audit log tracks all changes (who, when, what)

---

## Championship Participant Features

### Feature 16: Offline-First Architecture

**Feature ID**: PART-001
**Priority**: P0 (Must Have)
**User Type**: Championship Participants
**Tier**: Free (baseline for championship apps)

#### Overview
Robust offline-first architecture ensuring full app functionality without internet connectivity, critical for on-water usage.

#### Functional Requirements

**16.1 Offline Capabilities**
- **Fully Functional Offline**:
  - View schedule (previously synced)
  - View notices (previously synced)
  - View race results (previously synced)
  - View venue maps and sailing instructions
  - View race documents (PDFs)
  - Add reminders and calendar events
  - Access saved favorites

- **Limited Offline**:
  - Cannot receive real-time updates (requires connection)
  - Cannot post to notice board
  - Cannot submit protests
  - Cannot share content externally

**16.2 Data Sync Strategy**
- **Initial Sync**: Download all championship data on first launch
- **Background Sync**: Sync every 15 minutes when online and app active
- **Foreground Sync**: Pull-to-refresh manual sync
- **Smart Sync**: Only download changes (delta sync)
- **Conflict Resolution**: Server always wins (organizer updates authoritative)

**16.3 Offline Storage**
- **SQLite Database**:
  - Store schedule, notices, results
  - Indexed for fast queries
  - Encrypted at rest

- **File Storage**:
  - Venue maps (PNG tiles)
  - PDF documents (NOR, sailing instructions)
  - Images (venue photos, sponsor logos)

- **Storage Limits**:
  - Max 500MB total per championship
  - Automatic cleanup of old championships
  - User control to delete cached data

**16.4 Offline Indicators**
- Network status banner when offline
- "Last updated X min ago" timestamps
- Visual indicators on potentially stale data
- Retry buttons on failed sync

**16.5 Queued Actions**
- Queue actions performed offline
- Auto-sync when connection restored
- Examples:
  - Favorited item
  - Calendar event created
  - Reminder set
  - Feedback submitted

#### Technical Specifications

**Local Database Schema** (SQLite):
```sql
-- On-device SQLite schema
CREATE TABLE IF NOT EXISTS local_schedule (
  id TEXT PRIMARY KEY,
  championship_id TEXT NOT NULL,
  race_number INTEGER,
  race_date TEXT,
  scheduled_time TEXT,
  division TEXT,
  status TEXT,
  synced_at INTEGER,
  data_json TEXT
);

CREATE TABLE IF NOT EXISTS local_notices (
  id TEXT PRIMARY KEY,
  championship_id TEXT NOT NULL,
  title TEXT,
  body TEXT,
  priority TEXT,
  posted_at INTEGER,
  read_at INTEGER,
  synced_at INTEGER
);

CREATE TABLE IF NOT EXISTS local_results (
  id TEXT PRIMARY KEY,
  race_id TEXT,
  results_json TEXT,
  status TEXT,
  synced_at INTEGER
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action_type TEXT,
  data_json TEXT,
  created_at INTEGER,
  retry_count INTEGER DEFAULT 0
);
```

**Sync Service**:
```typescript
// services/OfflineSyncService.ts
export class OfflineSyncService {
  private db: SQLite.Database;

  async syncChampionship(championshipId: string): Promise<SyncResult> {
    const lastSync = await this.getLastSyncTimestamp(championshipId);

    // Fetch only changes since last sync
    const changes = await supabase
      .from('championship_schedule')
      .select('*')
      .eq('championship_id', championshipId)
      .gt('updated_at', lastSync);

    // Update local database
    await this.updateLocalDB(changes.data);

    // Process queued actions
    await this.processQueue();

    return { success: true, itemsSynced: changes.data.length };
  }

  async addToQueue(action: QueuedAction): Promise<void> {
    await this.db.runAsync(
      'INSERT INTO sync_queue (action_type, data_json, created_at) VALUES (?, ?, ?)',
      [action.type, JSON.stringify(action.data), Date.now()]
    );
  }

  async processQueue(): Promise<void> {
    const queued = await this.db.getAllAsync('SELECT * FROM sync_queue ORDER BY created_at');

    for (const item of queued) {
      try {
        await this.executeQueuedAction(item);
        await this.db.runAsync('DELETE FROM sync_queue WHERE id = ?', [item.id]);
      } catch (error) {
        // Retry logic
        if (item.retry_count < 3) {
          await this.db.runAsync(
            'UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?',
            [item.id]
          );
        }
      }
    }
  }
}
```

**Offline Detection**:
```typescript
import NetInfo from '@react-native-community/netinfo';

// Network status hook
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });

    return unsubscribe;
  }, []);

  return isOnline;
}
```

#### Acceptance Criteria
- [ ] App fully functional after initial sync without any network
- [ ] Initial sync completes in <60 seconds for typical championship (150 competitors, 12 races)
- [ ] Background sync completes in <5 seconds for incremental changes
- [ ] Queued actions execute successfully when network restored (100% success rate for idempotent actions)
- [ ] Offline indicator appears within 1 second of losing connection
- [ ] SQLite queries execute in <100ms for typical datasets
- [ ] Storage usage stays under 500MB for large championships
- [ ] No data loss during offline usage
- [ ] Conflict resolution handles concurrent updates correctly

---

## AI & Intelligence Features

### Feature 24: Claude Skills Integration

**Feature ID**: AI-002
**Priority**: P1 (Important)
**User Type**: Sailors
**Tier**: Championship (€250/yr)

#### Overview
Integration with Anthropic's Claude AI using custom sailing-specific skills for specialized coaching and analysis.

#### Functional Requirements

**24.1 Custom Skills**

RegattaFlow includes 15+ custom Claude skills for specialized coaching:

1. **race-strategy-analyst**: Comprehensive race strategy generation
2. **tidal-opportunism-analyst**: Tidal advantage analysis
3. **current-counterplay-advisor**: Current tactics and routing
4. **slack-window-planner**: Tidal slack optimization
5. **boat-tuning-analyst**: Rig tuning recommendations
6. **wind-shift-predictor**: Wind pattern analysis
7. **start-line-tactician**: Starting strategy
8. **mark-rounding-coach**: Mark rounding technique
9. **layline-calculator**: Optimal layline determination
10. **race-learning-analyst**: Post-race insights and lessons
11. **finishing-tactics-advisor**: Final leg optimization
12. **fleet-positioning-guide**: Fleet management tactics
13. **weather-routing-optimizer**: Weather-based routing
14. **performance-data-analyst**: Telemetry analysis
15. **rules-advisor**: Racing rules interpretation

**24.2 Skill Deployment**
- Skills hosted on Anthropic Platform
- Accessed via RegattaFlow Supabase Edge Function (proxy)
- Automatic context injection (venue, weather, user history)
- Secure API key management (never exposed to client)

**24.3 Usage Patterns**

**Conversational AI**:
- Chat interface for questions
- Multi-turn conversations
- Context retention across messages
- Example: "What's the best tidal strategy for this venue?"

**Automated Generation**:
- Strategy auto-generation for upcoming races
- Post-race analysis triggers automatically
- Daily briefings during championships

**On-Demand Analysis**:
- Analyze specific scenarios
- "What if" questions
- Comparative analysis (e.g., "Compare tacking on left vs right shift")

**24.4 Cost Management**
- Monthly token limits by tier:
  - Pro: 100,000 tokens/month (~25 strategy generations)
  - Championship: 500,000 tokens/month (unlimited for practical purposes)
- Usage dashboard for users
- Graceful degradation if limit reached (show cached responses)

#### Technical Specifications

**Skill Structure** (Example):
```markdown
<!-- skills/race-strategy-analyst/SKILL.md -->
# Race Strategy Analyst

You are an expert sailing race strategist providing comprehensive pre-race analysis and tactical recommendations.

## Context You'll Receive
- Venue intelligence (bathymetry, typical conditions)
- Weather forecast (wind, waves, tides, currents)
- Race course configuration
- Competitor information (if available)
- Sailor's historical performance at this venue

## Your Task
Generate a detailed race strategy including:
1. Pre-race venue assessment
2. Start line strategy
3. Leg-by-leg tactical plan
4. Contingency plans for wind shifts
5. Key reminders and priorities

## Output Format
Use clear Markdown formatting with:
- Executive summary
- Numbered sections
- Bullet points for tactics
- Bold for key points
- Tables for comparisons

## Constraints
- Strategies must be practical and actionable
- Assume club-level competitive sailor
- Prioritize simplicity over complexity
- Include confidence levels for predictions
```

**Deployment**:
```bash
# Upload skill to Anthropic Platform
./scripts/upload-skills.sh race-strategy-analyst
```

**Proxy Edge Function**:
```typescript
// supabase/functions/anthropic-skills-proxy/index.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')
});

Deno.serve(async (req) => {
  const { userId, skillName, prompt, context } = await req.json();

  // Check user's tier and token budget
  const usage = await getUserTokenUsage(userId);
  if (usage.tokensUsedThisMonth >= usage.monthlyLimit) {
    return new Response(
      JSON.stringify({ error: 'Monthly token limit reached' }),
      { status: 429 }
    );
  }

  // Build context-enriched prompt
  const enrichedPrompt = buildPromptWithContext(prompt, context);

  // Call Claude with skill
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [{ role: 'user', content: enrichedPrompt }],
    skills: [{ type: 'skill', name: skillName }]
  });

  // Log usage
  await logAIActivity(userId, skillName, response.usage.input_tokens, response.usage.output_tokens);

  return new Response(JSON.stringify(response));
});
```

**API Endpoints**:
- `POST /ai/chat` - Send message to Claude (with skill selection)
- `POST /ai/generate/:skillName` - Trigger specific skill
- `GET /ai/usage` - Get token usage stats
- `GET /ai/history` - Get conversation history

#### Acceptance Criteria
- [ ] Skill responses generate in <30 seconds (90th percentile)
- [ ] Response quality rated 4.5+ stars by users
- [ ] Token usage tracking accurate within 1%
- [ ] Cost per request <$0.50 USD
- [ ] Skills handle errors gracefully (malformed context, API failures)
- [ ] Cached responses used when appropriate (reduce costs)
- [ ] Audit log captures all AI interactions

---

## API Requirements

### Supabase Database Schema

**Core Tables**:
- `auth.users` - User authentication (Supabase managed)
- `sailor_profiles` - Sailor user details
- `coach_profiles` - Coach user details
- `organizer_profiles` - Organizer user details
- `subscriptions` - Subscription status and billing
- `invoices` - Payment history

**Venue & Weather**:
- `venues` - Sailing venue database
- `venue_favorites` - User saved venues
- `weather_cache` - Cached weather data
- `bathymetry_tiles` - 3D depth data

**Championships**:
- `championships` - Championship/event configuration
- `championship_roles` - Team member permissions
- `race_participants` - Competitor registrations
- `championship_schedule` - Race schedule
- `championship_notices` - Notice board posts
- `race_documents` - NOR, sailing instructions, etc.

**Racing**:
- `races` - Individual race events
- `race_results` - Finish positions and points
- `series_standings` - Overall championship standings
- `race_courses` - Course mark layouts
- `race_marks` - Individual mark coordinates

**Logistics**:
- `boat_shipments` - Logistics tracking
- `shipment_updates` - Status timeline

**AI & Coaching**:
- `ai_race_strategies` - Generated strategies
- `ai_activity` - AI usage logging
- `coaching_sessions` - Booked coaching
- `coaching_feedback` - Session reviews

**Learning**:
- `courses` - Online course catalog
- `course_enrollments` - User enrollments
- `course_progress` - Completion tracking
- `certificates` - Earned certificates

**Fleet Management**:
- `fleets` - Fleet/group definitions
- `fleet_members` - Fleet memberships
- `fleet_insights` - Shared race data

### Row Level Security (RLS) Policies

**Principle**: Strict RLS on all tables, no public access by default

**Example Policies**:

```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON sailor_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON sailor_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Championship organizers can manage their championships
CREATE POLICY "Organizers can manage their championships"
  ON championships FOR ALL
  USING (
    organizer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM championship_roles
      WHERE championship_id = championships.id
      AND user_id = auth.uid()
      AND role IN ('admin', 'race_officer')
    )
  );

-- Participants can view championship data
CREATE POLICY "Participants can view championship"
  ON championship_schedule FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM race_participants
      WHERE championship_id = championship_schedule.championship_id
      AND user_id = auth.uid()
    )
  );

-- Subscription tier enforcement
CREATE POLICY "Pro users can access all venues"
  ON venues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE user_id = auth.uid()
      AND tier IN ('pro', 'championship')
      AND status = 'active'
    ) OR
    id IN (
      SELECT venue_id FROM venue_favorites
      WHERE user_id = auth.uid()
      LIMIT 10 -- Free tier: 10 venues
    )
  );
```

### Supabase Edge Functions

Required Edge Functions:

1. **anthropic-skills-proxy** - AI request proxy with authentication
2. **venue-report-generator** - PDF generation for venue reports
3. **venue-weather-sync** - Scheduled weather data updates (cron)
4. **results-scoring-engine** - Race results calculation
5. **results-publication** - Results publish and notification
6. **championship-analytics** - Generate organizer dashboards
7. **bulk-import-processor** - Handle CSV imports (competitors, results)
8. **document-ai-extractor** - Extract data from NOR PDFs
9. **payment-webhook-handler** - Stripe webhook receiver
10. **notification-sender** - Push notification dispatcher

**Example Edge Function**:
```typescript
// supabase/functions/results-scoring-engine/index.ts
import { createClient } from '@supabase/supabase-js';
import { ScoringService } from './scoring.ts';

Deno.serve(async (req) => {
  const { raceId, scoringSystem } = await req.json();

  // Fetch race results
  const supabase = createClient(/* ... */);
  const { data: results } = await supabase
    .from('race_results')
    .select('*')
    .eq('race_id', raceId);

  // Calculate scores
  const scoringService = new ScoringService();
  const scored = scoringService.calculateRacePoints(
    results,
    scoringSystem,
    results.length
  );

  // Update database
  for (const result of scored) {
    await supabase
      .from('race_results')
      .update({ points_scored: result.points })
      .eq('id', result.id);
  }

  // Recalculate series standings
  await scoringService.updateSeriesStandings(raceId);

  return new Response(JSON.stringify({ success: true }));
});
```

### External API Integrations

**1. StormGlass API** (Weather Data)
- Base URL: `https://api.stormglass.io/v2`
- Authentication: API Key in header
- Endpoints Used:
  - `/weather/point` - Forecast and current conditions
  - `/tide/extremes/point` - Tidal predictions
  - `/bio/point` - Water temperature
- Rate Limit: 10,000 requests/day
- Cost: $99/month (paid plan)

**2. Stripe** (Payments)
- Stripe.js (client-side)
- Stripe Node SDK (server-side)
- Webhooks:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `payment_intent.succeeded`

**3. Anthropic Claude** (AI)
- Model: Claude 3.5 Sonnet
- Custom Skills: 15+ deployed
- Proxy via Edge Function (secure API key)
- Rate Limit: Subject to Anthropic tier limits
- Cost: ~$0.015 per 1K input tokens, ~$0.075 per 1K output tokens

**4. GEBCO** (Bathymetry)
- Download tiles from GEBCO Grid (one-time)
- Process and serve via RegattaFlow tile server
- No API calls during runtime (all cached)

**5. Expo Notifications** (Push Notifications)
- Expo Push Notification Service
- Free tier: Unlimited notifications
- Delivery tracking via receipts

**6. Supabase Storage** (File Storage)
- Store venue photos, logos, documents
- CDN-backed for fast delivery
- RLS policies for access control

---

## Non-Functional Requirements

### Performance Requirements

**Page Load Times**:
- Dashboard: <1 second
- Venue detail: <2 seconds
- Championship home: <1.5 seconds
- Race results: <1 second
- 3D bathymetry: <3 seconds (initial render)

**API Response Times** (95th percentile):
- Database queries: <100ms
- Edge Functions: <500ms
- AI generation: <30 seconds
- PDF generation: <30 seconds

**Mobile App**:
- App launch (cold start): <3 seconds
- App launch (warm start): <1 second
- Tab switching: <300ms
- Scroll performance: 60 FPS (high-end devices), 30 FPS (mid-range)

**Offline Performance**:
- Cached data load: <500ms
- SQLite queries: <100ms
- Background sync: <5 seconds (delta changes)

### Scalability Requirements

**User Scale**:
- Support 50,000 sailors (Year 2)
- Support 500 concurrent championships
- Support championships with 200+ competitors
- Support 10,000+ concurrent users during major events

**Database Scale**:
- Handle 10M+ rows in main tables
- Query performance maintained with indexes
- Connection pooling for Supabase (up to 100 connections)

**Storage Scale**:
- 1TB total storage capacity
- 500MB per championship maximum
- CDN for static assets (photos, documents)

**Push Notifications**:
- Send 10,000 notifications in <30 seconds
- 99%+ delivery success rate
- Handle retries for failed deliveries

### Security Requirements

**Authentication**:
- Supabase Auth (JWT tokens)
- Token expiration: 1 hour (auto-refresh)
- Session timeout: 30 days (inactive)
- Password requirements: 8+ chars, mixed case, numbers
- Rate limiting: 10 login attempts per IP per hour

**Data Protection**:
- All API calls over HTTPS/TLS 1.3
- Database encryption at rest (Supabase managed)
- Sensitive data (payment info) never stored client-side
- RLS policies on all tables
- API key rotation: Every 90 days

**Privacy**:
- GDPR compliant
- Data export functionality (GDPR right to data portability)
- Account deletion removes all personal data
- Analytics anonymized (no PII in tracking)

**API Security**:
- Rate limiting on all endpoints
- CORS configured for allowed origins only
- API keys stored in environment variables
- Supabase service role key never exposed to client

### Accessibility Requirements

**WCAG 2.1 Level AA Compliance**:
- Color contrast ratio ≥4.5:1 for text
- All interactive elements keyboard accessible
- Screen reader support (iOS VoiceOver, Android TalkBack)
- Focus indicators visible
- Alt text for all images
- Form labels and error messages

**Responsive Design**:
- Support screen sizes 320px - 2560px width
- Touch targets minimum 44x44 pixels
- Text scalable up to 200% without breaking layout

**Internationalization** (Future):
- i18n framework in place
- Initial support: English
- Planned: Spanish, French, Portuguese, Chinese

### Reliability Requirements

**Uptime**:
- Target: 99.9% uptime (43 minutes downtime/month)
- Supabase SLA: 99.9%
- Vercel SLA: 99.9%

**Error Handling**:
- Graceful degradation when APIs unavailable
- User-friendly error messages (no stack traces)
- Automatic retry for transient errors
- Error tracking with Sentry

**Data Integrity**:
- Database backups: Daily (Supabase managed)
- Point-in-time recovery: 7 days
- Audit logs for critical operations (results entry, subscription changes)

**Disaster Recovery**:
- Recovery Time Objective (RTO): <4 hours
- Recovery Point Objective (RPO): <24 hours
- Incident response plan documented

### Monitoring & Analytics

**Application Monitoring**:
- Error tracking: Sentry
- Performance monitoring: Expo Performance API
- Crash reporting: Sentry

**User Analytics**:
- Event tracking: Mixpanel or Amplitude
- Funnel analysis for key flows
- Cohort retention tracking
- A/B testing framework

**Business Metrics**:
- Subscription MRR dashboard
- User acquisition tracking
- Feature adoption rates
- Championship creation and completion rates

**Alerts**:
- Critical error alert: Email + SMS
- Performance degradation: Slack notification
- Failed payment: Email to support team
- API rate limit approaching: Slack notification

### Compliance & Legal

**Terms of Service**:
- User agreement for sailors
- Separate agreement for organizers (B2B contract)
- Acceptable use policy

**Privacy Policy**:
- GDPR compliant
- Clear data collection disclosure
- Cookie policy
- Third-party service disclosure (Stripe, Anthropic)

**Data Residency**:
- Supabase region: EU (for European customers)
- Alternative: US region (for US customers)
- Compliance with regional regulations

**App Store Requirements**:
- iOS App Store Guidelines compliance
- Google Play Store compliance
- Age rating: 4+ (no restricted content)
- Privacy nutrition labels (iOS)

---

## Feature Prioritization Summary

### Must Have (P0) - MVP Launch

**Foundation** (Week 1-2):
1. User authentication and profiles
2. Subscription management with Stripe
3. Basic venue database (50+ venues)
4. Multi-championship support
5. Payment processing

**Core Sailor Features** (Week 3-5):
6. Venue intelligence database (147+ venues)
7. Weather data integration
8. Tidal & current analysis
9. AI race strategy generation
10. GPS track recording

**Championship Features** (Week 6-8):
11. Schedule management
12. Real-time push notifications
13. Notice board system
14. Offline-first architecture
15. Offline content sync
16. Venue maps (offline)

**Organizer Features** (Week 9-11):
17. Competitor registration system
18. Race results entry & publication
19. Series standings calculation
20. Bulk data import/export

### Important (P1) - V1 Release (Within 3 Months)

21. Custom championship branding
22. 3D bathymetry visualization
23. AI tactical analysis
24. Claude skills integration
25. Coach discovery & booking
26. Race timer with phase detection
27. Fleet management
28. Fleet insights & analytics
29. Race document management (NOR)
30. Logistics tracking (boat shipments)
31. Course mark editor
32. Analytics dashboard (Organizer)
33. Online course platform
34. Video learning player
35. Certificate generation

### Nice to Have (P2) - V2+ (Post-Launch)

36. Document AI processing
37. Multi-language support
38. In-app messaging
39. Social sharing
40. Protest management
41. Live race tracking (GPS)
42. Video analysis tools
43. Team collaboration (Organizers)
44. AI post-race coaching (enhanced)
45. Advanced competitor analytics

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-10 | Product Team | Initial comprehensive features document |

---

**Next Steps**:
1. Technical architecture review with engineering team
2. API endpoint design and documentation
3. Database schema finalization and migration scripts
4. Edge Function implementation plan
5. Feature flag configuration for phased rollout

**Related Documents**:
- `PRD_USER_FLOWS.md` - Detailed user journey documentation
- `TECH_ARCHITECTURE.md` - Technical implementation details
- `TODO_IMPLEMENTATION.md` - Development roadmap and task breakdown
