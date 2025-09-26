/**
 * Regional Intelligence Service
 * Provides venue-specific intelligence, weather integration, and cultural adaptation
 * Core of the "OnX Maps for Sailing" global intelligence system
 */

import type {
  SailingVenue,
  VenueCulturalProfile,
  WeatherSourceConfig,
  CulturalBriefing,
  RegionalIntelligenceData,
} from '@/src/lib/types/global-venues';

// Extended type for complete regional intelligence
export interface RegionalIntelligenceData {
  venue: SailingVenue;
  weatherIntelligence: WeatherIntelligence;
  tacticalIntelligence: TacticalIntelligence;
  culturalIntelligence: CulturalIntelligence;
  logisticalIntelligence: LogisticalIntelligence;
  lastUpdated: Date;
}

export interface WeatherIntelligence {
  currentConditions: {
    windSpeed: number;
    windDirection: number;
    gusts: number;
    temperature: number;
    barometricPressure: number;
    visibility: number;
  };
  forecast: WeatherForecast[];
  localPatterns: LocalWeatherPattern[];
  racingRecommendations: string[];
}

export interface WeatherForecast {
  time: Date;
  windSpeed: number;
  windDirection: number;
  gusts: number;
  confidence: number;
  racingConditions: 'excellent' | 'good' | 'challenging' | 'difficult';
}

export interface LocalWeatherPattern {
  name: string;
  description: string;
  indicators: string[];
  racingImplications: string;
  seasonality: string[];
}

export interface TacticalIntelligence {
  courseKnowledge: CourseKnowledge[];
  localTactics: LocalTactic[];
  equipmentRecommendations: EquipmentRecommendation[];
  performanceFactors: PerformanceFactor[];
}

export interface CourseKnowledge {
  courseName: string;
  layout: string;
  keyFeatures: string[];
  tacticalConsiderations: string[];
  historicalTrends: string[];
}

export interface LocalTactic {
  situation: string;
  recommendation: string;
  confidence: 'high' | 'moderate' | 'low';
  source: 'expert' | 'data_analysis' | 'community';
}

export interface EquipmentRecommendation {
  category: 'sails' | 'rigging' | 'electronics' | 'safety';
  item: string;
  reasoning: string;
  priority: 'essential' | 'recommended' | 'optional';
  localAvailability: 'readily_available' | 'limited' | 'ship_in' | 'bring_own';
}

export interface PerformanceFactor {
  factor: string;
  impact: 'high' | 'moderate' | 'low';
  description: string;
  optimization: string;
}

export interface CulturalIntelligence {
  briefing: CulturalBriefing;
  protocolReminders: ProtocolReminder[];
  languageSupport: LanguageSupport;
  networkingOpportunities: NetworkingOpportunity[];
}

export interface ProtocolReminder {
  situation: string;
  protocol: string;
  importance: 'critical' | 'important' | 'helpful';
  timing: 'before_arrival' | 'on_arrival' | 'during_event' | 'after_event';
}

export interface LanguageSupport {
  primaryLanguage: string;
  translationAvailable: boolean;
  keyPhrases: Array<{
    english: string;
    local: string;
    pronunciation?: string;
    context: string;
  }>;
  sailingTerminology: Array<{
    term: string;
    localEquivalent: string;
    usage: string;
  }>;
}

export interface NetworkingOpportunity {
  type: 'social_event' | 'technical_seminar' | 'cultural_activity' | 'business_meeting';
  name: string;
  description: string;
  value: 'high' | 'moderate' | 'low';
  attendance: 'expected' | 'recommended' | 'optional';
}

export interface LogisticalIntelligence {
  transportation: TransportationIntel;
  accommodation: AccommodationIntel;
  services: ServiceIntel[];
  sailingServices?: SailingServices;
  costEstimates: CostEstimate[];
  timeline: LogisticalTimeline[];
}

export interface TransportationIntel {
  airport: string;
  transferOptions: TransferOption[];
  localTransport: LocalTransportOption[];
  equipmentShipping: EquipmentShippingOption[];
}

export interface TransferOption {
  method: string;
  duration: string;
  cost: number;
  convenience: 'high' | 'moderate' | 'low';
  notes?: string;
}

export interface LocalTransportOption {
  type: 'rental_car' | 'taxi' | 'rideshare' | 'public_transport' | 'shuttle';
  availability: 'excellent' | 'good' | 'limited' | 'poor';
  cost: 'low' | 'moderate' | 'high' | 'very_high';
  recommendation: string;
}

export interface EquipmentShippingOption {
  carrier: string;
  estimatedCost: number;
  transitTime: string;
  reliability: 'high' | 'moderate' | 'low';
  notes: string;
}

export interface AccommodationIntel {
  recommendedAreas: string[];
  options: AccommodationOption[];
  bookingAdvice: string[];
}

export interface AccommodationOption {
  type: 'hotel' | 'yacht_club' | 'private' | 'budget';
  name?: string;
  priceRange: { min: number; max: number };
  pros: string[];
  cons: string[];
  sailorFriendly: boolean;
}

export interface ServiceIntel {
  category: 'rigging' | 'sail_repair' | 'boat_repair' | 'chandlery' | 'coaching';
  providers: ServiceProvider[];
  recommendations: string[];
}

export interface ServiceProvider {
  name: string;
  specialties: string[];
  reputation: 'excellent' | 'good' | 'average' | 'unknown';
  priceLevel: 'budget' | 'moderate' | 'premium';
  languages: string[];
  contact: string;
}

export interface CostEstimate {
  category: string;
  item: string;
  estimatedCost: number;
  currency: string;
  confidence: 'high' | 'moderate' | 'low';
  notes?: string;
}

export interface LogisticalTimeline {
  task: string;
  recommendedTiming: string;
  importance: 'critical' | 'important' | 'helpful';
  dependencies?: string[];
}

export interface SailingServices {
  yachtClubs?: YachtClub[];
  sailmakers?: Sailmaker[];
  chandleries?: Chandlery[];
  foulWeatherGear?: FoulWeatherGearStore[];
  riggingServices?: RiggingService[];
}

export interface YachtClub {
  name: string;
  specialty: string;
  contact: string;
  location: string;
  reputation: 'excellent' | 'high' | 'good';
}

export interface Sailmaker {
  name: string;
  specialty: string;
  contact: string;
  languages: string[];
  pricing: 'premium' | 'moderate' | 'competitive' | 'affordable';
}

export interface Chandlery {
  name: string;
  specialty: string;
  contact: string;
  location: string;
  pricing: 'premium' | 'moderate' | 'competitive' | 'affordable';
}

export interface FoulWeatherGearStore {
  name: string;
  specialty: string;
  contact: string;
  languages: string[];
  pricing: 'premium' | 'moderate' | 'competitive' | 'affordable';
}

export interface RiggingService {
  name: string;
  specialty: string;
  contact: string;
  languages: string[];
  pricing: 'premium' | 'moderate' | 'competitive' | 'affordable';
}

export class RegionalIntelligenceService {
  private venueIntelligence: Map<string, RegionalIntelligenceData> = new Map();
  private intelligenceCallbacks: ((data: RegionalIntelligenceData) => void)[] = [];

  constructor() {
    console.log('🧠 RegionalIntelligenceService initialized');
  }

  /**
   * Load complete regional intelligence for a venue
   */
  async loadVenueIntelligence(venue: SailingVenue): Promise<RegionalIntelligenceData> {
    console.log(`🧠 Loading intelligence for ${venue.name}`);

    try {
      // Check cache first
      const cached = this.venueIntelligence.get(venue.id);
      if (cached && this.isIntelligenceFresh(cached)) {
        console.log(`🧠 Using cached intelligence for ${venue.name}`);
        return cached;
      }

      console.log(`🧠 Generating new intelligence for ${venue.name}...`);
      // Generate comprehensive intelligence
      const intelligence = await this.generateRegionalIntelligence(venue);
      console.log(`🧠 Intelligence generation completed for ${venue.name}`);

      // Cache the intelligence
      this.venueIntelligence.set(venue.id, intelligence);

      // Notify listeners
      this.notifyIntelligenceUpdate(intelligence);

      console.log(`🧠 Intelligence loaded for ${venue.name}: ${Object.keys(intelligence).length} categories`);

      return intelligence;
    } catch (error) {
      console.error(`🧠 Failed to load intelligence for ${venue.name}:`, error);
      throw error;
    }
  }

  /**
   * Generate comprehensive regional intelligence
   */
  private async generateRegionalIntelligence(venue: SailingVenue): Promise<RegionalIntelligenceData> {
    console.log(`🧠 Generating regional intelligence for ${venue.name} (${venue.id})`);
    // For now, return mock data for San Francisco Bay
    // TODO: Load from Supabase intelligence database

    const weatherIntelligence: WeatherIntelligence = {
      currentConditions: {
        windSpeed: 15,
        windDirection: 270,
        gusts: 20,
        temperature: 18,
        barometricPressure: 1013,
        visibility: 10,
      },
      forecast: this.generateWeatherForecast(),
      localPatterns: [
        {
          name: 'Thermal Gradient',
          description: 'Daily thermal wind cycle with strongest winds in afternoon',
          indicators: ['Morning calm', 'Midday pressure drop', 'Westerly building'],
          racingImplications: 'Best racing 1-6 PM. Plan for significant wind shifts.',
          seasonality: ['spring', 'summer', 'early_fall'],
        },
        {
          name: 'Ebb Tide Current',
          description: 'Strong southbound current during ebb tide',
          indicators: ['Tide dropping', 'Current lines visible'],
          racingImplications: 'Favor south side of course. Current advantage > wind advantage.',
          seasonality: ['year_round'],
        },
      ],
      racingRecommendations: [
        'Expect 15-25kt in afternoon thermal',
        'Current is critical - check tide charts',
        'Fog possible in morning - be prepared',
        'Wind typically shifts right throughout day',
      ],
    };

    const tacticalIntelligence: TacticalIntelligence = {
      courseKnowledge: [
        {
          courseName: 'Berkeley Circle',
          layout: 'Windward-Leeward with offset finish',
          keyFeatures: ['Strong current influence', 'Geographic wind shifts', 'Deep water'],
          tacticalConsiderations: [
            'Left side favored in flood tide',
            'Right side favored in ebb tide',
            'Shore effect from Berkeley hills',
          ],
          historicalTrends: ['Consistent thermal pattern', 'Current predictable by tide'],
        },
      ],
      localTactics: [
        {
          situation: 'Light air start',
          recommendation: 'Stay near shore for first thermal fill-in',
          confidence: 'high',
          source: 'expert',
        },
        {
          situation: 'Ebb tide upwind',
          recommendation: 'Go left early, stay in favorable current',
          confidence: 'high',
          source: 'data_analysis',
        },
      ],
      equipmentRecommendations: [
        {
          category: 'sails',
          item: 'Medium-weight jib',
          reasoning: 'Typical 12-20kt range with chop',
          priority: 'recommended',
          localAvailability: 'readily_available',
        },
        {
          category: 'electronics',
          item: 'Depth sounder',
          reasoning: 'Shallow areas affect current flow',
          priority: 'essential',
          localAvailability: 'readily_available',
        },
      ],
      performanceFactors: [
        {
          factor: 'Current awareness',
          impact: 'high',
          description: 'Tidal current is the dominant tactical factor',
          optimization: 'Study tide charts, watch current lines, favor advantageous side',
        },
        {
          factor: 'Thermal timing',
          impact: 'high',
          description: 'Wind strength varies dramatically by time of day',
          optimization: 'Plan race schedule around thermal cycle',
        },
      ],
    };

    const culturalIntelligence: CulturalIntelligence = {
      briefing: await this.generateCulturalBriefing(venue),
      protocolReminders: [
        {
          situation: 'Club dining',
          protocol: 'Yacht club attire expected at dinner',
          importance: 'important',
          timing: 'during_event',
        },
        {
          situation: 'Crew introductions',
          protocol: 'Introduce crew to race committee',
          importance: 'helpful',
          timing: 'on_arrival',
        },
      ],
      languageSupport: {
        primaryLanguage: 'English',
        translationAvailable: false,
        keyPhrases: [], // Not needed for English-speaking venue
        sailingTerminology: [], // Standard English terms
      },
      networkingOpportunities: [
        {
          type: 'social_event',
          name: 'Welcome drinks at yacht club',
          description: 'Informal gathering to meet local sailors and officials',
          value: 'high',
          attendance: 'recommended',
        },
      ],
    };

    const logisticalIntelligence: LogisticalIntelligence = {
      transportation: {
        airport: venue.id === 'hong-kong' ? 'Hong Kong International Airport (HKG)' : 'San Francisco International (SFO)',
        transferOptions: venue.id === 'hong-kong' ? [
          {
            method: 'Airport Express + Taxi',
            duration: '45-60 min',
            cost: 60,
            convenience: 'high',
            notes: 'Fastest route to Central/Admiralty area',
          },
          {
            method: 'Bus + MTR',
            duration: '60-90 min',
            cost: 15,
            convenience: 'moderate',
            notes: 'Most economical option',
          },
        ] : [
          {
            method: 'Rental car',
            duration: '45-60 min',
            cost: 50,
            convenience: 'high',
            notes: 'Recommended for equipment transport',
          },
          {
            method: 'BART + Uber',
            duration: '75-90 min',
            cost: 25,
            convenience: 'moderate',
            notes: 'Good for light travel',
          },
        ],
        localTransport: [
          {
            type: 'rental_car',
            availability: 'excellent',
            cost: 'moderate',
            recommendation: 'Best for sailing venues access',
          },
        ],
        equipmentShipping: [
          {
            carrier: 'FedEx',
            estimatedCost: 200,
            transitTime: '3-5 days',
            reliability: 'high',
            notes: 'Reliable for sail delivery',
          },
        ],
      },
      accommodation: {
        recommendedAreas: venue.id === 'hong-kong' ? ['Central', 'Admiralty', 'Causeway Bay', 'Tsim Sha Tsui'] : ['Sausalito', 'Tiburon', 'Berkeley Marina'],
        options: [
          {
            type: venue.id === 'hong-kong' ? 'hotel' : 'yacht_club',
            name: venue.id === 'hong-kong' ? 'Conrad Hong Kong' : 'San Francisco Yacht Club',
            priceRange: venue.id === 'hong-kong' ? { min: 300, max: 500 } : { min: 150, max: 250 },
            pros: venue.id === 'hong-kong' ? ['Central location', 'Harbor views', 'Business district'] : ['Walking distance to docks', 'Sailor community'],
            cons: venue.id === 'hong-kong' ? ['Premium pricing'] : ['Limited availability'],
            sailorFriendly: true,
          },
        ],
        bookingAdvice: [
          'Book early for major events',
          'Consider staying near your sailing venue',
          'Ask about sailor discounts at yacht clubs',
        ],
      },
      services: venue.id === 'hong-kong' ? [
        {
          category: 'yacht_clubs',
          providers: [
            {
              name: 'Hong Kong Yacht Club',
              specialties: ['Racing', 'Dragon Class', 'Social events'],
              reputation: 'premier',
              priceLevel: 'premium',
              languages: ['English', 'Cantonese'],
              contact: '+852 2832-2817',
              website: 'hkyc.org.hk',
              location: 'Kellett Island, Causeway Bay',
            },
            {
              name: 'Royal Hong Kong Yacht Club',
              specialties: ['International racing', 'Corporate events'],
              reputation: 'excellent',
              priceLevel: 'premium',
              languages: ['English', 'Cantonese'],
              contact: '+852 2832-2817',
              location: 'Causeway Bay',
            },
          ],
          recommendations: ['Reciprocal club arrangements available', 'Advance booking recommended for racing events'],
        },
        {
          category: 'sailmakers',
          providers: [
            {
              name: 'North Sails Hong Kong',
              specialties: ['Racing sails', 'Dragon Class', 'Sail repair'],
              reputation: 'excellent',
              priceLevel: 'premium',
              languages: ['English', 'Cantonese'],
              contact: '+852 2555-4430',
              location: 'Aberdeen',
            },
            {
              name: 'Doyle Sails Hong Kong',
              specialties: ['Custom sails', 'Racing optimization'],
              reputation: 'excellent',
              priceLevel: 'moderate',
              languages: ['English', 'Cantonese'],
              location: 'Aberdeen Marina',
            },
          ],
          recommendations: ['Book sail services well ahead of major regattas', 'Local knowledge of Hong Kong conditions valuable'],
        },
        {
          category: 'chandleries',
          providers: [
            {
              name: 'Simpson Marine',
              specialties: ['Premium yacht equipment', 'Electronics', 'Safety gear'],
              reputation: 'excellent',
              priceLevel: 'premium',
              languages: ['English', 'Cantonese', 'Mandarin'],
              contact: '+852 2555-8377',
              location: 'Aberdeen Marina',
            },
            {
              name: 'Asia Pacific Marine Supplies',
              specialties: ['Hardware', 'Rigging', 'Engine parts'],
              reputation: 'good',
              priceLevel: 'moderate',
              languages: ['English', 'Cantonese'],
              location: 'Aberdeen',
            },
          ],
          recommendations: ['Stock up before typhoon season', 'Good selection but premium pricing'],
        },
        {
          category: 'foul_weather_gear',
          providers: [
            {
              name: 'Musto Hong Kong',
              specialties: ['Racing gear', 'Offshore equipment', 'Team orders'],
              reputation: 'excellent',
              priceLevel: 'premium',
              languages: ['English', 'Cantonese'],
              location: 'Central, IFC Mall',
            },
            {
              name: 'Henri Lloyd at Simpson Marine',
              specialties: ['Professional sailing gear', 'Corporate outfitting'],
              reputation: 'excellent',
              priceLevel: 'premium',
              languages: ['English', 'Cantonese'],
              location: 'Aberdeen Marina',
            },
          ],
          recommendations: ['Essential for monsoon season sailing', 'Try before buying - sizing can vary'],
        },
        {
          category: 'rigging',
          providers: [
            {
              name: 'Composite Rigging HK',
              specialties: ['Carbon rigging', 'Racing optimization', 'Dragon Class'],
              reputation: 'excellent',
              priceLevel: 'premium',
              languages: ['English', 'Cantonese'],
              location: 'Aberdeen',
            },
          ],
          recommendations: ['Book rigging services well in advance', 'Excellent local knowledge of HK conditions'],
        },
      ] : [
        {
          category: 'rigging',
          providers: [
            {
              name: 'Marchal Sailmakers',
              specialties: ['Rigging', 'Sail repair'],
              reputation: 'excellent',
              priceLevel: 'premium',
              languages: ['English'],
              contact: '(415) 332-8020',
            },
          ],
          recommendations: ['Book rigging services in advance', 'Bring backup equipment'],
        },
      ],
      sailingServices: venue.id === 'hong-kong' ? {
        yachtClubs: [
          {
            name: 'Royal Hong Kong Yacht Club',
            specialty: 'International racing, Corporate events, Dragon Class',
            contact: '+852 2832-2817',
            location: 'Causeway Bay',
            reputation: 'excellent',
          },
          {
            name: 'Hong Kong Yacht Club',
            specialty: 'Racing, Dragon Class, Social events',
            contact: '+852 2832-2817',
            location: 'Kellett Island, Causeway Bay',
            reputation: 'excellent',
          },
        ],
        sailmakers: [
          {
            name: 'North Sails Hong Kong',
            specialty: 'Racing sails, Dragon Class, Sail repair',
            contact: '+852 2555-4430',
            languages: ['English', 'Cantonese'],
            pricing: 'premium',
          },
          {
            name: 'Doyle Sails Hong Kong',
            specialty: 'Custom sails, Racing optimization',
            contact: 'doylehongkong@doyle.com',
            languages: ['English', 'Cantonese'],
            pricing: 'moderate',
          },
        ],
        chandleries: [
          {
            name: 'Simpson Marine',
            specialty: 'Premium yacht equipment, Electronics, Safety gear',
            contact: '+852 2555-8377',
            location: 'Aberdeen Marina',
            pricing: 'premium',
          },
          {
            name: 'Asia Pacific Marine Supplies',
            specialty: 'Hardware, Rigging, Engine parts',
            contact: '+852 2555-1234',
            location: 'Aberdeen',
            pricing: 'moderate',
          },
        ],
        foulWeatherGear: [
          {
            name: 'Musto Hong Kong',
            specialty: 'Racing gear, Offshore equipment, Team orders',
            contact: '+852 2234-7128',
            languages: ['English', 'Cantonese'],
            pricing: 'premium',
          },
          {
            name: 'Henri Lloyd at Simpson Marine',
            specialty: 'Professional sailing gear, Corporate outfitting',
            contact: '+852 2555-8377',
            languages: ['English', 'Cantonese'],
            pricing: 'premium',
          },
        ],
        riggingServices: [
          {
            name: 'Composite Rigging HK',
            specialty: 'Carbon rigging, Performance optimization, Dragon Class specialists',
            contact: '+852 9123-4567',
            languages: ['English', 'Cantonese'],
            pricing: 'premium',
          },
        ],
      } : undefined,
      costEstimates: [
        {
          category: 'accommodation',
          item: 'Hotel per night',
          estimatedCost: 200,
          currency: 'USD',
          confidence: 'moderate',
        },
        {
          category: 'dining',
          item: 'Dinner at yacht club',
          estimatedCost: 60,
          currency: 'USD',
          confidence: 'high',
        },
      ],
      timeline: [
        {
          task: 'Book accommodation',
          recommendedTiming: '8 weeks before event',
          importance: 'critical',
        },
        {
          task: 'Ship equipment',
          recommendedTiming: '2 weeks before event',
          importance: 'critical',
          dependencies: ['Confirm venue address'],
        },
      ],
    };

    return {
      venue,
      weatherIntelligence,
      tacticalIntelligence,
      culturalIntelligence,
      logisticalIntelligence,
      lastUpdated: new Date(),
    };
  }

  /**
   * Generate weather forecast
   */
  private generateWeatherForecast(): WeatherForecast[] {
    const forecast: WeatherForecast[] = [];
    const now = new Date();

    for (let i = 0; i < 72; i += 3) {
      const time = new Date(now.getTime() + i * 60 * 60 * 1000);
      const hour = time.getHours();

      // Simulate San Francisco Bay thermal cycle
      let windSpeed = 8;
      if (hour >= 12 && hour <= 18) {
        windSpeed = 15 + Math.sin((hour - 12) * Math.PI / 6) * 8; // Peak at 3 PM
      }

      forecast.push({
        time,
        windSpeed: Math.round(windSpeed),
        windDirection: 270 + (Math.random() - 0.5) * 30,
        gusts: Math.round(windSpeed * 1.3),
        confidence: 0.8,
        racingConditions: windSpeed > 12 ? 'good' : windSpeed > 8 ? 'challenging' : 'difficult',
      });
    }

    return forecast;
  }

  /**
   * Generate cultural briefing for venue
   */
  private async generateCulturalBriefing(venue: SailingVenue): Promise<CulturalBriefing> {
    console.log(`🧠 Generating cultural briefing for ${venue.name}`);
    console.log(`🧠 Venue culturalContext:`, venue.culturalContext);

    // Mock cultural briefing for San Francisco Bay
    return {
      venueId: venue.id,
      languageInfo: {
        primaryLanguage: venue.culturalContext?.primaryLanguages?.[0] || 'English',
        commonPhrases: [],
        sailingTerminology: [],
      },
      culturalProtocols: [
        {
          situation: 'Yacht club dining',
          expectedBehavior: 'Dress code enforced - no shorts or flip-flops at dinner',
          importance: 'important',
          consequences: 'May be refused service',
        },
      ],
      economicInfo: {
        currency: venue.culturalContext?.economicFactors?.currency || 'USD',
        tippingCustoms: [
          {
            service: 'Restaurant',
            expected: true,
            rate: 18,
            rateType: 'percentage',
            notes: 'Standard in US',
          },
        ],
        typicalCosts: [
          {
            category: 'dining',
            description: 'Yacht club dinner',
            cost: 60,
            currency: 'USD',
          },
        ],
        paymentMethods: [
          {
            type: 'card',
            acceptance: 'universal',
            notes: 'Credit cards accepted everywhere',
          },
        ],
      },
      practicalTips: [
        {
          category: 'transport',
          tip: 'Rental car is best for accessing multiple sailing venues',
          importance: 'helpful',
          source: 'verified',
        },
        {
          category: 'cultural',
          tip: 'Sailing community is very welcoming to visitors',
          importance: 'helpful',
          source: 'community',
        },
      ],
    };
  }

  /**
   * Check if cached intelligence is still fresh
   */
  private isIntelligenceFresh(intelligence: RegionalIntelligenceData): boolean {
    const ageHours = (Date.now() - intelligence.lastUpdated.getTime()) / (1000 * 60 * 60);
    const isFresh = ageHours < 6; // Refresh every 6 hours
    console.log(`🧠 Intelligence age: ${ageHours.toFixed(2)} hours, fresh: ${isFresh}`);
    return isFresh;
  }

  /**
   * Get weather intelligence for venue
   */
  async getWeatherIntelligence(venueId: string): Promise<WeatherIntelligence | null> {
    const intelligence = this.venueIntelligence.get(venueId);
    return intelligence?.weatherIntelligence || null;
  }

  /**
   * Get tactical intelligence for venue
   */
  async getTacticalIntelligence(venueId: string): Promise<TacticalIntelligence | null> {
    const intelligence = this.venueIntelligence.get(venueId);
    return intelligence?.tacticalIntelligence || null;
  }

  /**
   * Get cultural intelligence for venue
   */
  async getCulturalIntelligence(venueId: string): Promise<CulturalIntelligence | null> {
    const intelligence = this.venueIntelligence.get(venueId);
    return intelligence?.culturalIntelligence || null;
  }

  /**
   * Register callback for intelligence updates
   */
  onIntelligenceUpdate(callback: (data: RegionalIntelligenceData) => void): void {
    this.intelligenceCallbacks.push(callback);
  }

  /**
   * Notify listeners of intelligence updates
   */
  private notifyIntelligenceUpdate(data: RegionalIntelligenceData): void {
    this.intelligenceCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('🧠 Error in intelligence update callback:', error);
      }
    });
  }

  /**
   * Clear cached intelligence
   */
  clearCache(): void {
    console.log('🧠 Clearing intelligence cache');
    this.venueIntelligence.clear();
  }
}

// Export singleton instance
export const regionalIntelligenceService = new RegionalIntelligenceService();