# Coach Marketplace Plan
*Living Document - Last Updated: September 25, 2025*

## Overview
Two-sided marketplace connecting sailing coaches with sailors seeking professional instruction and performance improvement.

## Market Opportunity

### Problem Statement
- Sailors struggle to find qualified coaches
- Coaches lack platforms to monetize expertise
- No integrated performance data sharing
- Manual scheduling and payment processing
- Limited reach for coaching services

### Solution
Professional coaching marketplace with integrated performance analytics, seamless booking, and payment processing.

## User Personas

### Coach Persona: Mike Thompson
- **Background**: 2x Dragon World Champion, America's Cup tactician
- **Location**: Sydney, Australia
- **Expertise**: Dragon class, tactical development, heavy weather
- **Goals**: Monetize expertise, help sailors improve, flexible schedule
- **Services**: Race analysis, live coaching, race day support

### Student Persona: Bram Van Olsen
- **Need**: World Championship preparation
- **Budget**: $200-500/month for coaching
- **Preferences**: Dragon-specific expertise, flexible timing
- **Goals**: Improve spinnaker work, tactical decisions

## Marketplace Features

### 1. Coach Onboarding

#### Profile Creation
```typescript
interface CoachProfile {
  personalInfo: {
    name: string;
    location: string;
    languages: string[];
    timezone: string;
  };
  credentials: {
    certifications: Certification[];
    racingCV: Achievement[];
    coaching Experience: number; // years
    studentsCoached: number;
  };
  expertise: {
    classes: string[]; // 'Dragon', 'J/80', etc
    specialties: string[]; // 'Heavy weather', 'Tactics'
    levels: ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
  };
  media: {
    profilePhoto: URL;
    introVideo: URL;
    actionPhotos: URL[];
  };
}
```

#### Verification System
- Credential verification (certificates, results)
- Identity verification
- Background checks for youth coaching
- Reference validation

### 2. Service Offerings

#### Service Types
```typescript
interface ServiceOffering {
  raceAnalysis: {
    description: 'Post-race video and data analysis';
    deliverables: ['Video review', 'Written report', 'Action items'];
    pricing: { hourly: 75, package: 250 };
    turnaround: '24-48 hours';
  };
  liveCoaching: {
    description: '1-on-1 video coaching sessions';
    deliverables: ['Live instruction', 'Q&A', 'Session notes'];
    pricing: { hourly: 120, package: 500 };
    availability: Calendar;
  };
  raceDaySupport: {
    description: 'Real-time race strategy and support';
    deliverables: ['Pre-race brief', 'Live support', 'Debrief'];
    pricing: { perEvent: 200 };
    availability: 'Limited';
  };
  trainingPrograms: {
    description: 'Multi-week structured programs';
    deliverables: ['Custom curriculum', 'Weekly sessions', 'Progress tracking'];
    pricing: { monthly: 800 };
    duration: '4-12 weeks';
  };
}
```

#### Pricing Models
- Hourly rates
- Package deals
- Subscription plans
- Performance-based pricing
- Group coaching rates

### 3. Discovery & Matching

#### Search & Filter System
```typescript
interface CoachSearch {
  filters: {
    class: string[];
    location: 'Local' | 'Regional' | 'Global';
    priceRange: [min: number, max: number];
    availability: DateRange;
    language: string[];
    specialty: string[];
    rating: number; // minimum stars
  };
  sorting: 'Relevance' | 'Price' | 'Rating' | 'Experience';
  recommendations: 'AI-powered matching based on goals';
}
```

#### AI Matching Algorithm
- Analyzes sailor's performance data
- Matches weaknesses to coach strengths
- Considers schedule compatibility
- Factors in budget and goals
- Personality/teaching style matching

### 4. Booking & Scheduling

#### Booking Flow
```typescript
interface BookingProcess {
  steps: {
    1: 'Select service type';
    2: 'Choose date/time from availability';
    3: 'Describe goals and focus areas';
    4: 'Share performance data';
    5: 'Payment authorization';
    6: 'Confirmation and calendar integration';
  };
  features: {
    instantBooking: boolean;
    approvalRequired: boolean;
    cancellationPolicy: '24 hours notice';
    rescheduling: 'Free up to 12 hours before';
  };
}
```

#### Calendar Integration
- Sync with Google/Apple calendars
- Time zone handling
- Availability management
- Automated reminders
- Buffer time between sessions

### 5. Session Management

#### Pre-Session
```typescript
interface SessionPreparation {
  studentDataAccess: {
    recentRaces: RaceData[];
    performanceMetrics: Analytics;
    equipment: BoatSetup;
    goals: string[];
  };
  coachPrep: {
    reviewTime: '30 minutes allocated';
    notes: 'Pre-session observations';
    focusAreas: string[];
    resources: Document[];
  };
  communication: {
    confirmationEmail: '24 hours before';
    reminderPush: '1 hour before';
    techCheck: 'Link to test connection';
  };
}
```

#### During Session
- Video conferencing integration
- Screen sharing for data review
- Interactive whiteboard
- Session recording option
- Real-time note-taking
- Timer and billing tracker

#### Post-Session
- Automatic session summary
- Action items and homework
- Session recording access (48 hours)
- Follow-up scheduling
- Payment processing
- Review and rating system

### 6. Performance Integration

#### Data Sharing
```typescript
interface PerformanceDataSharing {
  automatic: {
    raceResults: 'Last 10 races';
    tracks: 'GPS data and analysis';
    equipment: 'Current setup';
    trends: 'Performance over time';
  };
  manual: {
    videos: 'Upload race footage';
    notes: 'Personal observations';
    goals: 'Specific objectives';
  };
  privacy: {
    coachAccess: 'Duration of engagement + 30 days';
    dataControl: 'Student can revoke anytime';
    anonymization: 'For coach portfolio';
  };
}
```

#### Progress Tracking
- Measurable improvement metrics
- Before/after comparisons
- Goal achievement tracking
- Session-by-session progress
- Long-term development curves

### 7. Payment & Revenue

#### Payment Processing
```typescript
interface PaymentSystem {
  methods: ['Credit card', 'PayPal', 'Bank transfer'];
  currency: 'Multi-currency support';
  processing: {
    platform_fee: '15%';
    payment_processing: '2.9% + $0.30';
    coach_payout: '~82% of student payment';
  };
  schedule: {
    studentCharge: 'At booking';
    coachPayout: 'Weekly on Mondays';
    disputes: '30-day resolution window';
  };
}
```

#### Revenue Model
- Platform commission: 15% of coaching fees
- Premium coach features: $49/month
- Promoted listings: $20-50/month
- Group coaching commission: 20%
- Certification programs: $299-999

### 8. Quality Assurance

#### Review System
```typescript
interface ReviewSystem {
  studentReview: {
    rating: '1-5 stars';
    categories: ['Knowledge', 'Communication', 'Value', 'Results'];
    text: 'Written feedback';
    verified: 'Only after completed session';
  };
  coachFeedback: {
    privateNotes: 'Student engagement and progress';
    recommendations: 'For future sessions';
  };
  moderation: {
    inappropriate: 'Flagging system';
    disputes: 'Platform mediation';
  };
}
```

#### Performance Standards
- Minimum 4.0 star rating to remain active
- Response time requirements (<24 hours)
- Session completion rate (>95%)
- Student satisfaction metrics
- Continuous improvement tracking

## Marketing & Growth

### Coach Acquisition
1. **Direct Recruitment**: Target world champions and Olympic coaches
2. **Certification Programs**: Partner with World Sailing
3. **Ambassador Program**: High-profile coaches as spokespersons
4. **Revenue Share**: Higher rates for early adopters

### Student Acquisition
1. **Free Trial Sessions**: First 30 minutes free
2. **Bundle Deals**: Coaching + RegattaFlow subscription
3. **Club Partnerships**: Group coaching for yacht clubs
4. **Content Marketing**: Free tips and tutorials

### Retention Strategies
- Progressive pricing (loyalty discounts)
- Achievement badges and certifications
- Community features
- Exclusive content from top coaches
- Performance improvement guarantees

## Success Metrics

### Marketplace Health
- **GMV**: $100,000/month by Month 12
- **Active Coaches**: 100 by Month 6
- **Active Students**: 1,000 by Month 12
- **Sessions/Month**: 500 by Month 12

### Quality Metrics
- **Average Rating**: 4.5+ stars
- **Completion Rate**: 95%+
- **Repeat Bookings**: 60%+
- **Student Improvement**: +1.5 positions average

### Financial Metrics
- **Take Rate**: 15% platform fee
- **CAC/LTV Ratio**: 1:3 minimum
- **Coach Earnings**: $2,000/month average
- **Platform Revenue**: $15,000/month by Month 12

## Technical Requirements

### Platform Infrastructure
- Video conferencing API (Zoom/Agora)
- Payment processing (Stripe)
- Calendar integration (CalDAV)
- Email/SMS notifications
- Real-time messaging

### Coach Tools
- Availability management
- Batch messaging
- Performance analytics dashboard
- Revenue reporting
- Student management CRM

### Student Experience
- Easy discovery and filtering
- One-click booking
- Integrated performance data
- Progress tracking
- Mobile-optimized interface

## Implementation Phases

### Phase 1: MVP (Month 1-3)
- Basic coach profiles
- Simple booking system
- Manual payment processing
- Video call links
- Review system

### Phase 2: Enhancement (Month 4-6)
- AI matching algorithm
- Integrated video platform
- Automated payments
- Performance data sharing
- Mobile app support

### Phase 3: Scale (Month 7-12)
- Group coaching
- Training programs
- Certification system
- Advanced analytics
- International expansion

## Risk Management

### Quality Control
- Thorough vetting process
- Continuous monitoring
- Student protection policies
- Money-back guarantee
- Insurance requirements

### Platform Risks
- Disintermediation prevention
- Terms of service enforcement
- Dispute resolution system
- Fraud detection
- Data privacy compliance

## Competitive Advantages
1. **Integration**: Seamless performance data sharing
2. **Specialization**: Sailing-specific vs generic tutoring
3. **Network Effects**: More coaches attract more students
4. **Data Advantage**: AI-powered matching and insights
5. **Trust**: Verified credentials and reviews

## Related Documents
- [Master Plan](./regattaflow-master-plan.md)
- [Sailor Experience](./sailor-experience.md)
- [Technical Architecture](./technical-architecture.md)

---
*This is a living document that will be updated based on market feedback and platform evolution*