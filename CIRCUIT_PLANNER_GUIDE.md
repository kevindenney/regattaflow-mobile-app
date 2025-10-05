# Circuit Planner - Multi-Venue Racing Campaign Tool

## Overview

The Circuit Planner helps serious sailors plan and optimize international racing campaigns across multiple venues. It provides comprehensive logistics optimization, cost analysis, and qualification tracking for championship circuits.

## Features

### 1. Multi-Venue Campaign Planning
- **Drag-and-Drop Timeline**: Visual circuit builder with event sequencing
- **Smart Route Optimization**: Automatic travel order optimization to minimize distance
- **Date Range Management**: Plan circuits spanning weeks or months

### 2. Cost Optimization

#### Comprehensive Budget Breakdown
- **Entry Fees**: Automatic currency conversion (HKD, JPY, AUD, USD, etc.)
- **Travel Costs**: Flight, ferry, train, or driving estimates based on distance
- **Accommodation**: Per-venue estimates with regional pricing
- **Equipment**: Multiple transport strategy options with cost comparison
- **Meals**: Daily meal allowances ($50/day default)
- **Visa Fees**: Country-specific visa costs and requirements
- **Contingency**: Automatic 10% buffer for unexpected expenses

#### Equipment Transport Strategies
The system compares multiple equipment transport options:

1. **Container Shipping**
   - Cost: $3,000 base + $0.80/km
   - Prep time: 21 days
   - Best for: Owning your boat, familiar equipment
   - Considerations: Long lead time, customs, potential delays

2. **Charter Boats**
   - Cost: $2,500 per event
   - Prep time: 3 days
   - Best for: Quick setup, no shipping logistics
   - Considerations: Unfamiliar boats, limited practice time

3. **Buy & Sell**
   - Cost: ~$8,000 (depreciation + transaction costs)
   - Prep time: 7 days
   - Best for: Extended circuits, potential to break even
   - Considerations: Market risk, finding buyers

4. **Trailer Transport** (for circuits < 2,000 km)
   - Cost: $0.40/km towing
   - Prep time: 2 days
   - Best for: Full control, flexible timing
   - Considerations: Driving time, fatigue

### 3. Travel Logistics

#### Automatic Travel Method Selection
Based on distance and geography:
- **< 200 km**: Driving ($0.50/km, 1 day)
- **200-500 km**: Train ($0.30/km, 1 day)
- **500-1,000 km** (coastal): Ferry ($200 + $0.20/km, 2 days)
- **> 1,000 km**: Flight ($300 + $0.15/km, 1 day)

#### Carbon Footprint Tracking
- **Drive**: 120g CO2/km
- **Train**: 41g CO2/km
- **Ferry**: 19g CO2/km
- **Flight**: 255g CO2/km

### 4. Visa Management

Automated visa requirement tracking for each destination:
- **Required vs. Visa-Free**: Country-specific rules
- **Processing Time**: Days needed for approval
- **Cost**: Visa application fees
- **Status Tracking**: Application → Approval → Expiry dates

Example visa requirements:
- **Hong Kong**: Visa-free for most (90 days)
- **Japan**: Tourist visa ($30, 7 days processing)
- **Australia**: eVisitor/ETA required ($145, 14 days)
- **Thailand**: Visa on arrival (30 days)
- **Singapore**: Visa-free for most

### 5. Qualification Tracking

#### Championship Qualification Impact
- **Qualifier Events**: Flag events that count toward championships
- **Points System**: Track qualification points per event
- **Circuit Bonus**: +10% bonus for completing full 3+ event circuits
- **Progress Visualization**: Real-time qualification percentage

Example circuit impact:
```
Hong Kong Spring Series: +10 pts (qualifier)
Hiroshima Dragon Cup: 0 pts (not qualifier)
Sydney Gold Cup: +25 pts (qualifier)
Circuit Completion Bonus: +10 pts
------------------------
Total Impact: +35% toward World Championship qualification
```

### 6. Accommodation Planning

Per-venue accommodation estimates with:
- **Event Duration**: Calculated from start/end dates
- **Prep Days**: +2 days before event
- **Travel Day**: +1 day after event
- **Regional Pricing**: Location-specific nightly rates
- **Recommendations**:
  - Yacht club accommodation (when available)
  - Airbnb for longer stays
  - Team houses for 4+ sailors

### 7. Circuit Sharing & Export

- **PDF Export**: Complete itinerary with timeline, costs, and logistics
- **Share with Crew**: Collaborative planning with crew/coach
- **Calendar Integration**: Export events to device calendar
- **Public Circuits**: Share template circuits with sailing community

## Example: Asia-Pacific Spring Circuit 2025

### Circuit Overview
**Hong Kong → Japan → Australia**
- **Duration**: 56 days (March 15 - May 14, 2025)
- **Events**: 3 regattas
- **Distance**: 8,420 km
- **Budget**: $21,000 USD
- **Qualification Impact**: +35%

### Detailed Breakdown

#### Event 1: RHKYC Spring Series
- **Venue**: Royal Hong Kong Yacht Club
- **Dates**: March 15-17, 2025
- **Entry Fee**: HKD 2,500 ($325 USD)
- **Qualifier**: Yes (+10 points)
- **Accommodation**: 5 nights × $120 = $600
- **Notes**: Home venue, familiar conditions

#### Travel Leg 1: Hong Kong → Japan
- **Method**: Flight
- **Distance**: 2,890 km
- **Travel Time**: 1 day (4 hours flight)
- **Cost**: $734 USD
- **Prep Time**: 18 days between events
- **Equipment**: Ship Dragon to Hiroshima (arrives 2 weeks before)

#### Event 2: Hiroshima Dragon Cup
- **Venue**: Hiroshima Yacht Club
- **Dates**: April 5-7, 2025
- **Entry Fee**: JPY 35,000 ($235 USD)
- **Qualifier**: No
- **Accommodation**: 5 nights × $100 = $500
- **Notes**: Strong competition, tactical course

#### Travel Leg 2: Japan → Australia
- **Method**: Flight
- **Distance**: 4,800 km
- **Travel Time**: 1 day (9 hours flight)
- **Cost**: $1,020 USD
- **Prep Time**: 33 days between events
- **Equipment**: Ship to Sydney ($4,800, 4-week transit)

#### Event 3: Sydney Gold Cup
- **Venue**: Royal Sydney Yacht Squadron
- **Dates**: May 10-14, 2025
- **Entry Fee**: AUD 1,200 ($780 USD)
- **Qualifier**: Yes (+25 points)
- **Accommodation**: 7 nights × $110 = $770
- **Notes**: Championship qualifying event

### Complete Budget
```
Entry Fees:              $3,200
Travel (flights):        $4,500
Accommodation:           $2,800
Equipment (shipping):    $8,000
Meals (56 days × $50):   $2,800
Visa (Japan + AU):       $175
Contingency (10%):       $1,000
--------------------------------
TOTAL:                  $21,475 USD
```

### Equipment Strategy: Container Shipping
**Chosen Option**: Ship Dragon boat to each venue

**Logistics Plan**:
1. Ship from HK to Hiroshima (2 weeks, $3,200)
2. Ship from Hiroshima to Sydney (4 weeks, $4,800)
3. Total shipping: $8,000 (vs. $7,500 charter)

**Rationale**: Own boat familiarity outweighs $500 extra cost

## Database Schema

### Tables Created
1. **racing_circuits**: Main circuit metadata and summary
2. **circuit_events**: Individual events within circuits
3. **circuit_visa_requirements**: Visa tracking per country
4. **circuit_accommodation**: Accommodation bookings
5. **circuit_equipment_transport**: Equipment shipping logistics

### Key Features
- **JSONB Storage**: Flexible event and budget data
- **RLS Policies**: User privacy and sharing controls
- **Calculated Metrics**: Auto-computed totals and impacts
- **Audit Trails**: Created/updated timestamps
- **Public Sharing**: Optional circuit templates

## API Integration Opportunities

### Future Enhancements
1. **Flight Search APIs** (Skyscanner, Kayak)
   - Real-time flight pricing
   - Multi-city booking optimization

2. **Accommodation APIs** (Booking.com, Airbnb)
   - Live availability and pricing
   - Direct booking integration

3. **Shipping APIs** (Schenker, DHL)
   - Real-time shipping quotes
   - Container tracking

4. **Visa APIs** (iVisa, VisaHQ)
   - Live visa requirements
   - Application assistance

5. **Weather APIs** (per venue)
   - Historical wind/wave data for planning
   - Forecast integration for timing

6. **Regatta Calendars**
   - Automatic event discovery
   - Entry deadline reminders

## Usage Tips

### Best Practices
1. **Plan Early**: Create circuits 6+ months in advance for best pricing
2. **Compare Options**: Review all equipment strategies before committing
3. **Buffer Time**: Add 2-3 days between events for travel/prep
4. **Visa Planning**: Apply for visas 2+ months before departure
5. **Equipment Lead Time**: Ship containers 3+ weeks before events
6. **Crew Coordination**: Share circuit with crew for collaborative planning

### Common Circuit Types
1. **Regional Series** (2-4 events, < 2,000 km)
   - Trailer or charter equipment
   - Weekend warrior schedule
   - $5,000-$10,000 budget

2. **Continental Circuit** (3-5 events, 2,000-10,000 km)
   - Ship or charter equipment
   - 2-3 month duration
   - $15,000-$30,000 budget

3. **World Championship Qualifying** (5+ events, global)
   - Ship equipment strategically
   - 4-6 month season
   - $40,000+ budget

## Mobile Experience

### Key Screens
1. **Circuit List**: Overview of all saved circuits
2. **Circuit Detail**: Timeline, budget, logistics
3. **Event Editor**: Add/edit individual events
4. **Budget Analyzer**: Interactive cost breakdown
5. **Equipment Comparison**: Side-by-side strategy costs
6. **Travel Map**: Visual route on map
7. **Export/Share**: PDF and sharing options

### Navigation
- Access from Calendar screen → "Plan Circuit" button
- Deep links to specific circuits
- Calendar integration for event reminders

## Technical Implementation

### Files Created
1. `/src/app/calendar/circuit-planner.tsx` - Main UI screen
2. `/src/services/CircuitPlanningService.ts` - Business logic and calculations
3. `/supabase/migrations/20251003_racing_circuits.sql` - Database schema

### Key Dependencies
- `useSavedVenues` hook for venue data
- `lucide-react-native` for icons
- React Native built-in components
- Supabase for backend storage

### Calculation Algorithms
- **Haversine Formula**: Great-circle distance between venues
- **Nearest-Neighbor TSP**: Circuit order optimization
- **Regional Pricing**: Country-specific cost estimates
- **Currency Conversion**: Multi-currency support

## Future Roadmap

### Phase 2 Features
- [ ] AI-powered circuit optimization
- [ ] Real-time pricing APIs
- [ ] Equipment marketplace integration
- [ ] Crew coordination tools
- [ ] Weather-based scheduling
- [ ] Insurance cost estimates
- [ ] Team fundraising integration
- [ ] Sponsor management

### Phase 3 Features
- [ ] Live circuit leaderboards
- [ ] Social sharing and discovery
- [ ] Circuit templates library
- [ ] Carbon offset programs
- [ ] Mobile app offline support
- [ ] Apple/Google Wallet integration

---

**Ready to Plan Your Championship Season?** 🏆⛵

Access the Circuit Planner from the Calendar tab to start building your multi-venue racing campaign today!
