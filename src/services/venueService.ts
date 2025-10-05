/**
 * Venue Intelligence Service
 * Unified service for GPS-based venue detection and regional adaptation
 * Integrates with existing SupabaseVenueService for data operations
 */

import * as Location from 'expo-location';
import { supabaseVenueService } from '@/src/services/venue/SupabaseVenueService';
import { OfflineService } from '@/src/services/offlineService';
import type { SailingVenue, Coordinates } from '@/src/lib/types/global-venues';

// ==================== Type Definitions ====================

export interface VenueDetectionResult {
  venue: SailingVenue | null;
  distance_km: number;
  confidence: number;
  method: 'gps' | 'manual' | 'network';
}

export interface RegionalAdaptation {
  currency: string;
  timezone: string;
  language: string;
  weather_sources: string[];
  date_format: string;
  temperature_unit: 'celsius' | 'fahrenheit';
  distance_unit: 'nautical_miles' | 'kilometers';
  speed_unit: 'knots' | 'kmh';
}

export interface VenueSwitchResult {
  previous_venue: SailingVenue | null;
  new_venue: SailingVenue;
  adaptations: RegionalAdaptation;
  cultural_briefing: string[];
  offline_data_cached: boolean;
}

// ==================== Weather Source Configuration ====================

const REGIONAL_WEATHER_SOURCES = {
  'north-america': ['NOAA', 'Environment_Canada', 'NWS'],
  'europe': ['ECMWF', 'Met_Office', 'Meteo_France', 'DWD'],
  'asia-pacific': ['JMA', 'Hong_Kong_Observatory', 'BOM', 'Korea_Met'],
  'oceania': ['BOM', 'MetService_NZ'],
  'south-america': ['INMET', 'SMN_Argentina'],
  'africa': ['SAWS']
};

const CURRENCY_BY_COUNTRY: Record<string, string> = {
  'United States': 'USD',
  'United Kingdom': 'GBP',
  'Hong Kong': 'HKD',
  'Australia': 'AUD',
  'New Zealand': 'NZD',
  'Singapore': 'SGD',
  'Japan': 'JPY',
  'France': 'EUR',
  'Germany': 'EUR',
  'Italy': 'EUR',
  'Spain': 'EUR'
};

// ==================== Venue Service ====================

export class VenueService {
  private static currentVenue: SailingVenue | null = null;
  private static locationSubscription: Location.LocationSubscription | null = null;

  /**
   * Detect venue from current GPS position
   */
  static async detectVenueFromGPS(
    userId: string,
    radiusKm: number = 50
  ): Promise<VenueDetectionResult> {
    try {
      console.log('📍 Detecting venue from GPS...');

      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Get current position with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const coordinates: Coordinates = [
        location.coords.longitude,
        location.coords.latitude
      ];

      // Search for venues in database
      const venue = await supabaseVenueService.findVenueByLocation(
        coordinates,
        radiusKm,
        userId
      );

      if (venue) {
        const distance = this.calculateDistance(
          coordinates,
          venue.coordinates as Coordinates
        );

        return {
          venue,
          distance_km: distance,
          confidence: this.calculateConfidence(distance, radiusKm),
          method: 'gps'
        };
      }

      console.log('ℹ️ No venue found within radius');
      return {
        venue: null,
        distance_km: 0,
        confidence: 0,
        method: 'gps'
      };
    } catch (error) {
      console.error('❌ GPS venue detection failed:', error);
      throw error;
    }
  }

  /**
   * Switch to a new venue with full regional adaptation
   */
  static async switchVenue(
    venueId: string,
    userId: string,
    options?: {
      cacheOffline?: boolean;
      loadIntelligence?: boolean;
    }
  ): Promise<VenueSwitchResult> {
    try {
      console.log('🌍 Switching venue...', venueId);

      const previousVenue = this.currentVenue;

      // Get venue with intelligence
      const venue = await supabaseVenueService.getVenueWithIntelligence(venueId, userId);

      if (!venue) {
        throw new Error('Venue not found');
      }

      // Calculate regional adaptations
      const adaptations = this.calculateRegionalAdaptations(venue);

      // Generate cultural briefing
      const cultural_briefing = this.generateCulturalBriefing(venue, previousVenue);

      // Cache for offline use
      let offline_data_cached = false;
      if (options?.cacheOffline !== false) {
        await OfflineService.cacheVenue(
          venue,
          venue.sailingConditions,
          venue.weatherSources
        );
        offline_data_cached = true;
      }

      // Record venue transition
      if (previousVenue) {
        await supabaseVenueService.recordVenueTransition(userId, {
          fromVenue: previousVenue,
          toVenue: venue,
          transitionType: 'manual',
          adaptationRequired: this.identifyAdaptations(previousVenue, venue),
          culturalBriefing: cultural_briefing
        });
      }

      // Update current venue
      this.currentVenue = venue;

      console.log('✅ Venue switched:', venue.name);

      return {
        previous_venue: previousVenue,
        new_venue: venue,
        adaptations,
        cultural_briefing,
        offline_data_cached
      };
    } catch (error) {
      console.error('❌ Venue switch failed:', error);
      throw error;
    }
  }

  /**
   * Start automatic venue detection
   */
  static async startAutoDetection(
    userId: string,
    onVenueDetected: (result: VenueDetectionResult) => void
  ): Promise<void> {
    try {
      console.log('🔄 Starting automatic venue detection...');

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Watch position with moderate accuracy
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000, // Check every 30 seconds
          distanceInterval: 500 // Or when moved 500m
        },
        async (location) => {
          const coordinates: Coordinates = [
            location.coords.longitude,
            location.coords.latitude
          ];

          // Check if we're near a different venue
          const venue = await supabaseVenueService.findVenueByLocation(
            coordinates,
            50, // 50km radius
            userId
          );

          if (venue && venue.id !== this.currentVenue?.id) {
            const distance = this.calculateDistance(coordinates, venue.coordinates as Coordinates);

            onVenueDetected({
              venue,
              distance_km: distance,
              confidence: this.calculateConfidence(distance, 50),
              method: 'gps'
            });
          }
        }
      );

      console.log('✅ Auto-detection started');
    } catch (error) {
      console.error('❌ Failed to start auto-detection:', error);
      throw error;
    }
  }

  /**
   * Stop automatic venue detection
   */
  static stopAutoDetection(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
      console.log('✅ Auto-detection stopped');
    }
  }

  /**
   * Get current venue
   */
  static getCurrentVenue(): SailingVenue | null {
    return this.currentVenue;
  }

  /**
   * Search venues globally
   */
  static async searchVenues(
    query: string,
    filters?: {
      venueType?: any[];
      region?: string;
      country?: string;
      limit?: number;
    }
  ): Promise<SailingVenue[]> {
    return supabaseVenueService.searchVenues(query, filters);
  }

  /**
   * Get nearby venues for circuit planning
   */
  static async getNearbyVenues(
    coordinates: Coordinates,
    maxDistanceKm: number = 500,
    limit: number = 10
  ): Promise<Array<SailingVenue & { distance_km: number }>> {
    return supabaseVenueService.getNearbyVenues(coordinates, maxDistanceKm, limit);
  }

  // ==================== Regional Adaptation ====================

  private static calculateRegionalAdaptations(venue: SailingVenue): RegionalAdaptation {
    const region = venue.region;
    const country = venue.country;

    // Determine currency
    const currency = CURRENCY_BY_COUNTRY[country] || 'USD';

    // Determine timezone
    const timezone = venue.timeZone || 'UTC';

    // Determine language (from cultural context)
    const language = venue.culturalContext?.primaryLanguages?.[0]?.code || 'en';

    // Select weather sources for region
    const weather_sources = REGIONAL_WEATHER_SOURCES[region] || ['Generic'];

    // Regional preferences
    const useMetric = region !== 'north-america';

    return {
      currency,
      timezone,
      language,
      weather_sources,
      date_format: useMetric ? 'DD/MM/YYYY' : 'MM/DD/YYYY',
      temperature_unit: useMetric ? 'celsius' : 'fahrenheit',
      distance_unit: 'nautical_miles', // Always nautical for sailing
      speed_unit: 'knots' // Always knots for sailing
    };
  }

  private static generateCulturalBriefing(
    newVenue: SailingVenue,
    previousVenue: SailingVenue | null
  ): string[] {
    const briefing: string[] = [];

    // Welcome message
    briefing.push(`Welcome to ${newVenue.name} in ${newVenue.country}`);

    // Language considerations
    const primaryLang = newVenue.culturalContext?.primaryLanguages?.[0];
    if (primaryLang && primaryLang.code !== 'en') {
      briefing.push(`Primary language: ${primaryLang.name} - English prevalence: ${primaryLang.prevalence}`);
    }

    // Racing culture
    const culture = newVenue.culturalContext?.sailingCulture;
    if (culture) {
      briefing.push(`Sailing culture: ${culture.tradition} tradition, ${culture.formality} formality`);
      briefing.push(`Competitiveness level: ${culture.competitiveness}`);
    }

    // Economic factors
    const econ = newVenue.culturalContext?.economicFactors;
    if (econ) {
      briefing.push(`Local currency: ${econ.currency} (${econ.costLevel} cost level)`);
      briefing.push(`Typical entry fee: ${econ.entryFees.typical} ${econ.currency}`);
    }

    // Racing customs
    const customs = newVenue.culturalContext?.racingCustoms;
    if (customs && customs.length > 0) {
      briefing.push(`Key customs: ${customs.slice(0, 3).map(c => c.custom).join(', ')}`);
    }

    // Venue-specific notes
    if (previousVenue && previousVenue.region !== newVenue.region) {
      briefing.push('⚠️ Regional change - review weather sources and local protocols');
    }

    return briefing;
  }

  private static identifyAdaptations(
    fromVenue: SailingVenue,
    toVenue: SailingVenue
  ): string[] {
    const adaptations: string[] = [];

    // Region change
    if (fromVenue.region !== toVenue.region) {
      adaptations.push('weather_sources');
      adaptations.push('timezone');
    }

    // Country change
    if (fromVenue.country !== toVenue.country) {
      adaptations.push('currency');
      adaptations.push('language');
      adaptations.push('regulations');
    }

    // Venue type change
    if (fromVenue.venueType !== toVenue.venueType) {
      adaptations.push('racing_format');
      adaptations.push('facility_access');
    }

    return adaptations;
  }

  // ==================== Utility Methods ====================

  private static calculateDistance(from: Coordinates, to: Coordinates): number {
    const [lon1, lat1] = from;
    const [lon2, lat2] = to;

    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
      Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private static calculateConfidence(distance: number, maxRadius: number): number {
    // Confidence decreases with distance
    // 100% at 0km, 50% at half radius, 0% at max radius
    return Math.max(0, 100 - (distance / maxRadius) * 100);
  }
}

export default VenueService;
