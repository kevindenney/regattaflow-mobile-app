# Yacht Club Logistics & Intelligence System
*Living Document - Last Updated: January 2025*

## Overview
Comprehensive yacht club intelligence system that automatically extracts, maps, and visualizes club venues, race courses, and logistics information. This system transforms RegattaFlow into the definitive resource for yacht club operations and racing logistics worldwide.

## Vision Statement
**"Every yacht club's racing operations, from RHKYC's three venues across Hong Kong to St. Francis YC's Big Boat Series, should be automatically mapped, tracked, and accessible through RegattaFlow's intelligent nautical charts."**

## Core Components

### 1. Multi-Venue Club Architecture
Many prestigious yacht clubs operate across multiple locations, each serving different purposes. Our system must intelligently map and connect these venues.

#### Example: Royal Hong Kong Yacht Club
```typescript
interface RHKYC_Network {
  headquarters: {
    name: 'Kellett Island';
    location: 'Victoria Harbor, Causeway Bay';
    coordinates: [22.2950, 114.1794];
    purpose: 'Social hub, administration';
    facilities: {
      dining: ['Main restaurant', 'Deck bar', 'Coffee shop'];
      recreation: ['Swimming pool', 'Gym', 'Billiards'];
      marine: ['Guest moorings', 'Tender service'];
      events: ['Function rooms', 'Rooftop terrace'];
    };
    accessibility: {
      public: 'MTR Causeway Bay, Taxi, Bus';
      marine: 'Club launch from Wan Chai';
      parking: 'Limited, valet available';
    };
  };

  racingStations: {
    middleIsland: {
      name: 'Middle Island';
      location: 'Repulse Bay';
      coordinates: [22.2178, 114.2467];
      purpose: 'Primary race management center';
      facilities: {
        racing: ['Race committee deck', 'Start boat berths'];
        storage: ['Mark boats', 'Race equipment'];
        training: ['Dinghy park', 'Junior sailing'];
        social: ['BBQ area', 'Beach bar'];
      };
      raceCourses: {
        area: 'Southern waters of Hong Kong Island';
        marks: ['Permanent and inflatable marks'];
        typical: ['Windward-leeward', 'Triangle-sausage'];
      };
    };

    shelterCove: {
      name: 'Shelter Cove Marina';
      location: 'Port Shelter, Sai Kung';
      coordinates: [22.3583, 114.2897];
      purpose: 'Marina and cruising base';
      facilities: {
        marine: ['250 wet berths', 'Hardstand storage'];
        technical: ['Haul-out', 'Repairs', 'Fuel dock'];
        amenities: ['Restaurant', 'Chandlery', 'Parking'];
      };
      advantages: {
        protection: 'Typhoon shelter certified';
        access: 'Direct access to eastern waters';
        cruising: 'Gateway to outlying islands';
      };
    };
  };

  racingProgram: {
    harborRacing: {
      location: 'Victoria Harbor';
      series: ['Wednesday Night Series', 'Saturday Races'];
      classes: ['IRC', 'HKPN', 'J/80', 'Etchells'];
    };

    offshoreRacing: {
      signature: 'Around the Island Race';
      international: {
        chinaSeaRace: {
          destination: 'Manila, Philippines';
          distance: '565 nautical miles';
          timing: 'Easter period';
        };
        southChinaRegatta: {
          destinations: ['Nha Trang, Vietnam', 'Sanya, China'];
          format: 'Rally with competitive divisions';
        };
        rolex: {
          event: 'Rolex China Sea Race';
          status: 'Biennial blue water classic';
        };
      };
    };
  };
}
```

### 2. Race Course Intelligence System

#### Automated Course Extraction
```typescript
interface CourseExtractionSystem {
  dataSources: {
    primary: {
      noticeOfRace: 'PDF parsing for course descriptions';
      sailingInstructions: 'Waypoint and mark extraction';
      amendments: 'Real-time update monitoring';
    };

    secondary: {
      clubWebsites: 'HTML scraping for standard courses';
      resultsPortals: 'Historical course usage patterns';
      socialMedia: 'Course photos and descriptions';
      raceTracking: 'GPS tracks from previous races';
    };
  };

  extraction: {
    textParsing: {
      gpsCoordinates: 'Regex pattern matching';
      markNames: 'Named entity recognition';
      courseSequence: 'Order and rounding instructions';
      restrictions: 'Exclusion zones and boundaries';
    };

    visualParsing: {
      courseDiagrams: 'Computer vision for course maps';
      chartAnnotations: 'Mark position extraction';
      handDrawn: 'Sketch recognition algorithms';
    };
  };

  mapping: {
    coordinate: {
      formats: ['Decimal degrees', 'Degrees minutes', 'DMS'];
      datum: 'WGS84 standardization';
      accuracy: 'Sub-meter precision';
    };

    visualization: {
      rendering: '2D and 3D course display';
      animation: 'Course sequence playback';
      conditions: 'Wind and current overlays';
    };
  };
}
```

#### Standard Racing Courses
```typescript
interface StandardRaceCourses {
  windwardLeeward: {
    configuration: 'Upwind-downwind legs';
    variations: [2, 3, 4, 5, 6, 8];
    marks: {
      start: 'Committee boat and pin';
      windward: 'Weather mark';
      offset: 'Optional reaching mark';
      gate: 'Leeward gate or single mark';
      finish: 'Upwind or downwind';
    };
  };

  triangle: {
    olympic: 'Classic triangle-sausage';
    modified: 'Triangle with windward finish';
    angles: {
      reach1: 60;
      reach2: 120;
      beat: 0;
      run: 180;
    };
  };

  coastal: {
    islands: 'Round the cans racing';
    passage: 'Point to point';
    distance: 'Overnight and ocean';
    navigation: 'Government marks and islands';
  };

  custom: {
    permanent: 'Club-specific fixed courses';
    seasonal: 'Condition-dependent variations';
    special: 'Regatta-specific designs';
  };
}
```

### 3. Race Builder Integration Architecture

#### Visual Race Builder Intelligence Integration
```typescript
interface RaceBuilderIntelligenceIntegration {
  venueIntelligence: {
    autoLoad: {
      venue: 'Automatic venue detection when race officer opens builder';
      bathymetry: 'Real-time depth data for mark placement validation';
      hazards: 'Known obstacles and restricted areas overlay';
      infrastructure: 'Permanent marks and racing infrastructure display';
    };

    conditions: {
      weather: 'Live weather integration for course orientation';
      tidal: 'Current predictions for tactical course design';
      historical: 'Seasonal patterns and condition intelligence';
      microclimate: 'Venue-specific wind and current patterns';
    };

    optimization: {
      markPlacement: 'AI-suggested optimal mark positions';
      courseLength: 'Fleet size and skill-appropriate distances';
      safetyZones: 'Automatic hazard avoidance and escape routes';
      spectatorViewing: 'Optimal positioning for family engagement';
    };
  };

  clubCustomization: {
    templates: {
      saved: 'Club library of frequently used course configurations';
      optimized: 'AI-learned optimal courses for specific conditions';
      seasonal: 'Condition-specific course variations';
      class: 'Fleet-specific course designs and requirements';
    };

    intelligence: {
      local: 'Accumulated local knowledge and racing patterns';
      performance: 'Historical race quality and participant feedback';
      safety: 'Incident patterns and risk mitigation strategies';
      logistics: 'Optimal timing and operational considerations';
    };
  };

  distributionOptimization: {
    sailorIntegration: {
      automatic: 'Instant delivery to registered sailor RegattaFlow accounts';
      notification: 'Push alerts for course publication and amendments';
      intelligence: 'Enhanced AI strategy using precise club data';
      feedback: 'Sailor performance data shared back with clubs';
    };

    dataQuality: {
      precision: 'GPS-precise coordinates from visual builder';
      validation: 'Automated safety and compliance checking';
      versioning: 'Amendment tracking and change management';
      standardization: 'Consistent data formats across all clubs';
    };
  };
}
```

#### RHKYC Multi-Venue Race Builder Integration
```typescript
interface RHKYCMultiVenueIntegration {
  venueSelection: {
    kellett: {
      use: 'Social events, presentations, post-race gatherings';
      raceBuilder: 'Administrative interface for race planning';
      integration: 'Seamless switching between RHKYC venues';
    };

    middleIsland: {
      use: 'Primary race management and course building';
      intelligence: {
        courses: 'Library of Middle Island racing configurations';
        conditions: 'Repulse Bay-specific weather and current patterns';
        optimization: 'AI-learned optimal mark positions';
        safety: 'Local hazard awareness and emergency procedures';
      };
      workflow: {
        design: 'Visual course builder with Middle Island intelligence';
        validation: 'Automatic depth and hazard checking';
        distribution: 'Instant delivery to sailor apps';
        execution: 'Real-time course amendments and updates';
      };
    };

    shelterCove: {
      use: 'Alternative venue for specific conditions';
      intelligence: {
        access: 'Eastern waters course configurations';
        protection: 'Typhoon-safe alternative racing';
        logistics: 'Marina-based race management';
        conditions: 'Port Shelter-specific environmental data';
      };
    };
  };

  crossVenueIntelligence: {
    comparison: 'Optimal venue selection based on conditions';
    switching: 'Seamless venue changes with course reconfiguration';
    logistics: 'Participant notification and coordination';
    analytics: 'Performance comparison across RHKYC venues';
  };
}
```

### 4. Web Scraping Architecture (Enhanced for Race Builder Support)

#### Intelligent Data Collection
```typescript
interface WebScrapingEngine {
  targets: {
    yachtClubs: {
      urls: string[];
      selectors: {
        calendar: '.race-calendar';
        documents: '.notice-of-race, .sailing-instructions';
        results: '.race-results';
        courses: '.course-descriptions';
      };
      frequency: 'Daily synchronization';
    };

    nationalAuthorities: {
      urls: Map<Country, URL>;
      apis: 'Where available';
      format: 'Standardized data feeds';
    };

    racingPlatforms: {
      yachtScoring: 'Results and entries';
      regattaNetwork: 'Event listings';
      sailracer: 'Live tracking data';
      tractrac: 'Historical tracks';
    };
  };

  processing: {
    documentParsing: {
      pdf: 'Apache Tika extraction';
      word: 'Document parsing';
      html: 'Beautiful Soup scraping';
      images: 'OCR for scanned documents';
    };

    dataExtraction: {
      courses: {
        waypoints: 'GPS coordinate extraction';
        marks: 'Named mark identification';
        restrictions: 'Exclusion zone parsing';
        instructions: 'Rounding sequences';
      };

      logistics: {
        dates: 'Event scheduling';
        contacts: 'Race officials';
        facilities: 'Venue information';
        requirements: 'Entry prerequisites';
      };
    };

    validation: {
      coordinates: 'Boundary checking';
      dates: 'Logical sequencing';
      duplicates: 'Deduplication';
      updates: 'Change detection';
    };
  };

  storage: {
    database: {
      courses: 'Versioned course library';
      events: 'Calendar synchronization';
      documents: 'Archived NORs and SIs';
      changes: 'Amendment tracking';
    };

    caching: {
      frequency: 'Smart refresh intervals';
      priority: 'Upcoming events first';
      offline: 'Local storage for app';
    };
  };
}
```

### 4. Logistics Intelligence

#### Comprehensive Venue Information
```typescript
interface VenueLogistics {
  marine: {
    approach: {
      channels: 'Navigation routes';
      depths: 'Minimum depths';
      hazards: 'Rocks, shoals, currents';
      tides: 'Tidal restrictions';
    };

    berthing: {
      visitor: {
        moorings: number;
        alongside: 'Pontoon/wall space';
        anchoring: 'Designated areas';
        rafting: 'Permitted locations';
      };

      facilities: {
        water: boolean;
        power: '110V/220V/380V';
        fuel: 'Diesel/gasoline';
        pumpout: boolean;
        wifi: 'Coverage and speed';
      };
    };

    technical: {
      haulOut: {
        travelift: 'Capacity in tons';
        crane: 'Reach and capacity';
        hardstand: 'DIY allowed?';
        contractors: 'Available services';
      };

      repairs: {
        rigging: 'Specialist availability';
        sails: 'Loft on site';
        engine: 'Dealer networks';
        electronics: 'Technical support';
      };
    };
  };

  landside: {
    transportation: {
      airport: {
        distance: 'km to club';
        transfer: 'Options and costs';
        customs: 'Clearance for equipment';
      };

      local: {
        parking: 'Capacity and fees';
        public: 'Bus, train, metro';
        taxi: 'Availability and apps';
        rental: 'Car hire options';
      };
    };

    accommodation: {
      onsite: 'Club rooms available';
      nearby: {
        hotels: 'Partnership rates';
        apartments: 'Crew houses';
        camping: 'For youth events';
      };
    };

    provisioning: {
      chandlery: 'Marine supplies';
      supermarkets: 'Provisioning options';
      dining: 'Restaurants and delivery';
      laundry: 'Services available';
    };
  };

  emergency: {
    medical: {
      firstAid: 'On-site capabilities';
      hospital: 'Nearest emergency';
      pharmacy: '24-hour availability';
      doctor: 'English-speaking';
    };

    marine: {
      coastGuard: 'VHF channels';
      salvage: 'Towing services';
      divers: 'Emergency underwater';
      weather: 'Storm warnings';
    };
  };
}
```

### 5. Regional Circuit Management

#### Circuit Planning Tools
```typescript
interface CircuitPlanning {
  mediterraneanCircuit: {
    season: 'April to October';
    keyVenues: [
      'Palma de Mallorca',
      'Porto Cervo',
      'Saint-Tropez',
      'Monaco',
      'Cannes'
    ];
    logistics: {
      transport: 'EU road network';
      shipping: 'Container routes';
      crew: 'Schengen visa considerations';
      equipment: 'VAT and customs';
    };
  };

  caribbeanCircuit: {
    season: 'November to May';
    keyVenues: [
      'Antigua',
      'St. Maarten',
      'BVI',
      'Barbados',
      'Grenada'
    ];
    logistics: {
      shipping: 'Atlantic crossing timing';
      hurricanes: 'Insurance requirements';
      customs: 'Cruising permits';
      crew: 'Immigration procedures';
    };
  };

  asianCircuit: {
    season: 'October to April';
    keyVenues: [
      'Hong Kong',
      'Singapore',
      'Phuket',
      'Langkawi',
      'Subic Bay'
    ];
    logistics: {
      typhoons: 'Seasonal considerations';
      languages: 'Communication challenges';
      shipping: 'Inter-Asia logistics';
      visas: 'Country requirements';
    };
  };
}
```

### 6. Integration with Map Visualization

#### Map Layer Architecture
```typescript
interface LogisticsMapLayers {
  clubLayer: {
    markers: {
      main: 'Primary clubhouse icon';
      satellite: 'Secondary venue markers';
      connections: 'Visual relationships';
    };

    popups: {
      summary: 'Club overview card';
      facilities: 'Quick facility icons';
      contact: 'Direct communication';
      directions: 'Navigation launch';
    };
  };

  courseLayer: {
    rendering: {
      active: 'Today\'s race courses';
      permanent: 'Fixed course marks';
      historical: 'Past race tracks';
    };

    interaction: {
      selection: 'Tap to view details';
      measurement: 'Leg distances and bearings';
      conditions: 'Wind/current at marks';
      tactics: 'Layline calculations';
    };
  };

  logisticsLayer: {
    services: {
      marine: 'Fuel, water, repairs';
      shore: 'Parking, dining, lodging';
      emergency: 'Medical, coastguard';
    };

    routing: {
      approach: 'Safe navigation routes';
      land: 'Driving directions';
      transit: 'Public transport options';
    };
  };

  intelligenceLayer: {
    conditions: {
      typical: 'Seasonal patterns';
      current: 'Real-time weather';
      forecast: 'Race day predictions';
    };

    activity: {
      racing: 'Current and upcoming';
      training: 'Practice areas';
      cruising: 'Popular anchorages';
    };
  };
}
```

## Implementation Strategy (Race Builder Integrated)

### Phase 1: Foundation (Week 1-2)
1. **Venue Intelligence Database**: Comprehensive venue data models
2. **Race Builder Integration APIs**: Real-time data feeds to visual builders
3. **Multi-Venue Architecture**: Support for clubs with multiple locations
4. **Condition Intelligence**: Live weather and environmental data integration

### Phase 2: Race Builder Support (Week 3-4)
1. **Intelligent Course Templates**: Venue-optimized course configurations
2. **AI Optimization Engine**: Automated mark placement and validation
3. **Real-time Distribution**: Instant sailor app data delivery
4. **Cross-Venue Intelligence**: Multi-location club support

### Phase 3: Enhanced Intelligence (Week 5-6)
1. **Machine Learning Integration**: AI-powered course optimization
2. **Predictive Analytics**: Race quality and safety predictions
3. **Community Intelligence**: Crowdsourced venue knowledge
4. **Performance Analytics**: Race builder effectiveness metrics

### Phase 4: Global Expansion (Week 7-8)
1. **International Venue Database**: Global yacht club integration
2. **Multi-Language Support**: International race builder localization
3. **Cultural Intelligence**: Regional sailing customs and protocols
4. **Scale Architecture**: Support for thousands of clubs worldwide

## Success Metrics

### Coverage
- **Clubs Mapped**: 500+ worldwide with all venues
- **Courses Extracted**: 5,000+ race courses
- **Logistics Data**: 90% completeness for major venues
- **Update Frequency**: Daily synchronization

### Quality
- **Accuracy**: 99% coordinate precision
- **Freshness**: <24 hour update lag
- **Completeness**: All critical logistics covered
- **Reliability**: 99.9% uptime

### User Impact
- **Time Saved**: 10+ hours per regatta planning
- **Discovery**: 3x increase in venue exploration
- **Confidence**: 90% feel better prepared
- **Engagement**: 2x session time on map

## Technical Requirements

### Infrastructure
- **Scraping**: Distributed crawler network
- **Storage**: PostgreSQL with PostGIS
- **Processing**: Queue-based job system
- **Caching**: Redis for quick access
- **CDN**: Global map tile delivery

### APIs & Services
- **Maps**: MapLibre GL JS for visualization
- **Geocoding**: Location search and routing
- **Weather**: Multi-source aggregation
- **Translation**: Multi-language support
- **Analytics**: Usage and pattern tracking

## Risk Mitigation

### Data Quality
- **Validation**: Multi-source verification
- **Crowdsourcing**: User corrections
- **Versioning**: Track all changes
- **Rollback**: Revert bad updates

### Legal & Compliance
- **Copyright**: Respect data ownership
- **Privacy**: GDPR compliance
- **Terms**: Club partnership agreements
- **Attribution**: Proper source credits

## Future Enhancements

### AI-Powered Features
- **Course Prediction**: Likely race configurations
- **Logistics Optimization**: Best routing and timing
- **Anomaly Detection**: Unusual conditions alerts
- **Natural Language**: Conversational queries

### Community Features
- **Reviews**: Venue and service ratings
- **Photos**: Crowd-sourced imagery
- **Tips**: Local knowledge sharing
- **Updates**: Real-time condition reports

### Advanced Integration
- **Booking Systems**: Direct berth reservations
- **Payment**: Integrated fee payments
- **Documents**: Digital clearance papers
- **Communication**: Club messaging systems

## Related Documents
- [Yacht Club Race Builder System](../RegattaFlowWebsite/plans/yacht-club-race-builder-system.md) - Visual race builder specifications
- [Club Management](../RegattaFlowWebsite/plans/club-management.md) - Enhanced club features with race builder
- [Race Strategy Planning](../RegattaFlowWebsite/plans/race-strategy-planning.md) - OnXMaps-style interface integration
- [Global Sailing Venues](./global-sailing-venues.md) - Venue intelligence database
- [OnX Maps Advanced Mapping](./onx-maps-advanced-mapping-system.md) - Interface design patterns
- [Master Plan](../RegattaFlowWebsite/plans/regattaflow-master-plan.md) - Updated club-centric strategy

---
*This document defines the comprehensive yacht club logistics and intelligence system that will make RegattaFlow the essential tool for sailing logistics worldwide.*