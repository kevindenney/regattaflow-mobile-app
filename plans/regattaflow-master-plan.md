# RegattaFlow Master Plan
*Living Document - Last Updated: September 25, 2025*

## Vision Statement
RegattaFlow is a comprehensive sailing ecosystem that unifies the fragmented world of competitive sailing through three interconnected platforms serving sailors, coaches, and racing organizations.

## Platform Overview

### Three Interconnected User Groups
1. **Sailors** - Individual racers and crew members tracking their racing journey
2. **Coaches** - Professional coaches offering services through our marketplace
3. **Clubs/Classes/Regattas** - Race organizers managing events and results

### Multi-Channel Frontend Architecture
1. **RegattaFlow Website** - Next.js intelligence hub and conversion engine (WatchDuty-inspired)
2. **RegattaFlow Mobile App** - Expo-based core racing product (OnX Maps-inspired)
3. **Seamless Cross-Platform Experience** - Shared design system with platform-optimized features

## Core Value Propositions

### For Sailors
"From scattered PDFs to unified racing intelligence - your complete sailing command center with OnX Maps-level strategic planning"
- AI-powered race strategy planning and simulation
- Document management and intelligent course extraction
- Real-time tactical guidance and environmental intelligence
- Equipment optimization and maintenance tracking
- World championship preparation tools

### For Coaches
"Turn your sailing expertise into income while helping sailors achieve their dreams"
- Professional coaching marketplace
- Integrated performance analytics
- Session management and payments
- Student progress tracking

### For Clubs/Regattas
"Professional race management made simple - from registration to results"
- Complete event management system
- Live tracking and timing
- Automated results and protests
- Spectator engagement tools

## User Personas

### Primary Persona: Bram Van Olsen
- **Profile**: Dragon class sailor, Hong Kong-based, international competitor
- **Goals**: World Championship preparation, performance improvement
- **Pain Points**: Fragmented information, manual tracking, crew coordination
- **Solution**: Unified platform for all racing needs

### Secondary Personas
1. **Mike Thompson** - Professional coach, 2x world champion
2. **Sarah Liu** - RHKYC Sailing Manager, event organizer
3. **Family Members** - Spectators wanting live updates

## Frontend Experience Strategy

### Multi-Channel User Behavior
```typescript
interface UserChannelPreferences {
  bram_sailor: {
    discovery: '60% mobile social, 40% web search';
    signup: '70% mobile, 30% web';
    dailyUse: '90% mobile (GPS, race day), 10% web (analysis)';
    preference: 'Mobile-first with web for complex analysis';
  };
  mike_coach: {
    discovery: '80% web (professional research)';
    signup: '70% web, 30% mobile';
    dailyUse: '60% web (student analysis), 40% mobile (coaching)';
    preference: 'Web-primary with mobile for client interaction';
  };
  sarah_club: {
    discovery: '90% web (B2B decision making)';
    signup: '95% web, 5% mobile';
    dailyUse: '70% web (management), 30% mobile (race day)';
    preference: 'Web-exclusive with mobile for operational execution';
  };
}
```

### Platform Role Definitions

#### Website: Intelligence Hub & Conversion Engine
- **Inspiration**: WatchDuty's real-time emergency intelligence platform
- **Primary Role**: Marketing, conversion, desktop workflows, enterprise features
- **Core Experience**: Live sailing data dashboard with real-time global intelligence
- **Key Features**:
  - Real-time global wind and weather visualization
  - Interactive 3D race strategy demonstrations
  - Professional coach marketplace and applications
  - Enterprise yacht club management and sales
  - Comprehensive venue intelligence for 147+ locations

#### Mobile App: Core Racing Product
- **Inspiration**: OnX Maps' field-ready outdoor intelligence platform
- **Primary Role**: Daily sailing use, race day execution, GPS tracking, social engagement
- **Core Experience**: Full-screen map interface with layers and tactical overlay
- **Key Features**:
  - GPS race tracking with AI tactical guidance
  - OnX-style layer system for conditions and intelligence
  - Offline functionality for remote sailing locations
  - Social features and sailing community integration
  - Real-time race day tools and crew coordination

### Cross-Platform Design System
- **Shared Components**: Weather cards, race results, venue intelligence, coach profiles
- **Design Tokens**: Ocean-inspired color palette, sailing-specific typography, consistent spacing
- **Data Synchronization**: Real-time sync between web analysis and mobile execution
- **Authentication**: Single sign-on with seamless platform switching

## Feature Roadmap

### Phase 1: Core Sailor Experience (Q1 2025)
- [ ] AI document parsing and course extraction
- [ ] 3D race course visualization (Mapbox integration)
- [ ] Basic race strategy generation
- [ ] Enhanced race tracking with tactical guidance
- [ ] Equipment database with setup correlation

### Phase 2: Club Integration (Q2 2025)
- [ ] Event creation and management
- [ ] Registration system
- [ ] Race committee tools
- [ ] Results calculation and publication
- [ ] Live tracking for spectators

### Phase 3: Coach Marketplace (Q3 2025)
- [ ] Coach onboarding and profiles
- [ ] Service offerings and pricing
- [ ] Booking and session management
- [ ] Performance data sharing
- [ ] Payment processing

### Phase 4: Advanced Features (Q4 2025)
- [ ] Advanced AI tactical simulation (Monte Carlo)
- [ ] Multi-model weather ensemble forecasting
- [ ] OnX Maps-level environmental intelligence
- [ ] International event planning tools
- [ ] Team/fleet management and coaching integration

## Revenue Model

### Subscription Tiers
1. **Free Tier**
   - Basic race tracking
   - 5 document uploads/month
   - Limited performance history

2. **Sailor Pro** ($29/month)
   - Unlimited document storage and AI parsing
   - Full performance analytics
   - Basic race strategy generation
   - Equipment tracking and optimization
   - Crew management and priority support

3. **Championship** ($49/month)
   - Everything in Pro
   - Advanced AI strategy simulation
   - OnX Maps-level environmental intelligence
   - Multi-layer weather and tactical overlays
   - International event planning tools
   - Coach marketplace integration

### Additional Revenue Streams
- **Coach Marketplace**: 15% commission on coaching fees
- **Club Licenses**: $299-999/month based on event volume
- **Custom Apps**: $5,000-25,000 for white-label solutions
- **Data Analytics**: Premium fleet analytics for sailmakers/manufacturers

## Technical Architecture

### Shared Services (Supabase Backend)
- Supabase Authentication with RLS
- PostgreSQL database with real-time subscriptions
- Supabase Storage for documents and media
- Edge Functions for AI processing
- Real-time subscriptions for live tracking

### Platform-Specific
**Next.js Website**:
- Marketing pages and SEO optimization
- Web application with PostgREST integration
- Admin dashboards for coaches and clubs
- AI strategy visualization

**Expo App**:
- Native mobile features with offline capability
- GPS tracking and race timing
- Push notifications and real-time updates
- 3D mapping with Mapbox GL JS
- OnX Maps-style layer management

## Success Metrics

### User Acquisition
- Target: 10,000 active sailors by end of Year 1
- 100 professional coaches
- 50 yacht clubs/organizations

### Engagement
- Daily active users: 30%
- Race tracking: 5+ races/user/month
- Document uploads: 10+ per user/month

### Revenue
- MRR Target: $50,000 by Month 12
- Coach marketplace GMV: $100,000/month
- Club licenses: 20 active by Year 1

## Marketing Strategy

### Multi-Channel Go-to-Market
1. **Website-Driven B2B**: Target yacht clubs and coaches with professional demos
2. **Mobile-First B2C**: Target sailors through social media and app stores
3. **Cross-Platform Conversion**: Website discovery → mobile app retention
4. **Pilot Program**: Partner with 3-5 yacht clubs for comprehensive testing

### Channel-Specific User Acquisition

#### Website Channels
- **SEO/Content Marketing**: Sailing guides, venue intelligence, tactical content
- **B2B Outreach**: Direct sales to yacht clubs and sailing organizations
- **Professional Networks**: LinkedIn targeting for coaches and club managers
- **Industry Publications**: Sailing media partnerships and thought leadership

#### Mobile App Channels
- **Social Media**: Instagram sailing content, TikTok race highlights
- **App Store Optimization**: Racing and sailing keyword optimization
- **Event Marketing**: QR codes and demos at major regattas
- **Referral Program**: In-app sailing community referrals
- **Influencer Strategy**: World champions and sailing personalities

### Cross-Platform User Journey
1. **Discovery**: 40% web search, 60% mobile social for sailors
2. **Research**: Website demos and feature exploration
3. **Conversion**: Mobile app download with web account sync
4. **Retention**: Daily mobile use with web analysis sessions
5. **Advocacy**: Social sharing and community referrals

## Risk Mitigation

### Technical Risks
- **Data accuracy**: Multiple validation layers
- **Scalability**: Cloud-native architecture
- **Offline functionality**: Progressive web app features

### Business Risks
- **Adoption**: Start with single yacht club pilot
- **Competition**: Focus on integration, not individual features
- **International expansion**: Multi-language support from day 1

## Development Principles

### User Experience
- Mobile-first design
- One-click workflows
- Minimal manual data entry
- Progressive disclosure of features

### Technical Excellence
- Type-safe development (TypeScript)
- Comprehensive testing
- Living documentation
- Continuous deployment with Vercel

## Next Steps

1. Complete detailed planning documents for each user group
2. Design component library and design system
3. Implement Phase 1 core features
4. Launch pilot program with RHKYC
5. Iterate based on user feedback

## Related Documents

### Frontend Strategy
- [Frontend User Experience Strategy](./frontend-ux-strategy.md) - Multi-channel user experience architecture
- [Website Conversion Strategy](./website-conversion-strategy.md) - Next.js marketing and intelligence hub
- [Mobile App Experience Design](./mobile-app-experience.md) - OnX Maps-inspired mobile racing product

### User Experience Plans
- [Sailor Experience Plan](./sailor-experience.md) - Enhanced with mobile-first journey
- [Race Strategy Planning](./race-strategy-planning.md) - OnX Maps for Sailing with regional intelligence
- [Coach Marketplace Plan](./coach-marketplace.md) - Web-mobile coaching ecosystem
- [Club Management Plan](./club-management.md) - Enterprise web + mobile execution

### Technical Implementation
- [Technical Architecture Plan](./technical-architecture.md) - Cross-platform development architecture
- [Global Sailing Venues](./global-sailing-venues.md) - Location intelligence system

---
*This is a living document that will be updated throughout the development process*