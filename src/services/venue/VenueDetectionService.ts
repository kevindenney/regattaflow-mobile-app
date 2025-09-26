/**
 * Venue Detection Service
 * Implements GPS-based automatic venue detection and switching for global sailing intelligence
 * Inspired by OnX Maps location awareness for sailing venues
 */

import { Platform } from 'react-native';
import * as Location from 'expo-location';
import type {
  SailingVenue,
  Coordinates,
  LocationDetection,
  VenueTransition,
  AdaptationRequirement,
} from '@/src/lib/types/global-venues';

export class VenueDetectionService {
  private currentLocation: Coordinates | null = null;
  private currentVenue: SailingVenue | null = null;
  private watchId: Location.LocationSubscription | null = null;
  private detectionCallbacks: ((venue: SailingVenue | null) => void)[] = [];
  private transitionCallbacks: ((transition: VenueTransition) => void)[] = [];

  constructor() {
    console.log('🌍 VenueDetectionService initialized');
  }

  /**
   * Initialize GPS-based venue detection
   */
  async initialize(): Promise<boolean> {
    console.log('🌍 Initializing venue detection...');

    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('🌍 Location permission denied');
        return false;
      }

      // Get current location for initial venue detection
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      this.currentLocation = [location.coords.longitude, location.coords.latitude];
      console.log('🌍 Current location:', this.currentLocation);

      // Detect initial venue
      await this.detectVenueFromLocation(this.currentLocation);

      // Start continuous location monitoring
      this.startLocationMonitoring();

      return true;
    } catch (error) {
      console.error('🌍 Failed to initialize venue detection:', error);
      return false;
    }
  }

  /**
   * Start continuous GPS monitoring for venue changes
   */
  private startLocationMonitoring() {
    console.log('🌍 Starting continuous location monitoring');

    this.watchId = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30000, // Check every 30 seconds
        distanceInterval: 1000, // Check when moved 1km
      },
      async (location) => {
        const newLocation: Coordinates = [location.coords.longitude, location.coords.latitude];

        // Only process if location changed significantly
        if (this.hasLocationChangedSignificantly(newLocation)) {
          console.log('🌍 Location changed significantly:', newLocation);
          this.currentLocation = newLocation;
          await this.detectVenueFromLocation(newLocation);
        }
      }
    );
  }

  /**
   * Check if location has changed significantly (>500m)
   */
  private hasLocationChangedSignificantly(newLocation: Coordinates): boolean {
    if (!this.currentLocation) return true;

    const distance = this.calculateDistance(this.currentLocation, newLocation);
    return distance > 0.5; // 500 meters
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  private calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;

    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Detect venue from GPS coordinates
   */
  private async detectVenueFromLocation(coordinates: Coordinates): Promise<void> {
    console.log('🌍 Detecting venue for coordinates:', coordinates);

    try {
      // Load venue database and find nearest venue
      const nearestVenue = await this.findNearestVenue(coordinates);

      if (nearestVenue && this.isWithinVenueBounds(coordinates, nearestVenue)) {
        await this.switchToVenue(nearestVenue);
      } else {
        // No venue detected - clear current venue if exists
        if (this.currentVenue) {
          console.log('🌍 Left venue bounds, clearing current venue');
          await this.switchToVenue(null);
        }
      }
    } catch (error) {
      console.error('🌍 Error detecting venue:', error);
    }
  }

  /**
   * Find the nearest sailing venue from the database
   */
  private async findNearestVenue(coordinates: Coordinates): Promise<SailingVenue | null> {
    try {
      // Load global sailing venues database
      const venuesData = await import('../../data/sailing-locations.json');
      const venues = venuesData.venues;

      let nearestVenue: SailingVenue | null = null;
      let minDistance = Infinity;
      const DETECTION_RADIUS_KM = 25; // 25km radius for venue detection

      // Check all venues in the database
      for (const [venueId, venueData] of Object.entries(venues)) {
        const venueCoordinates: Coordinates = [
          venueData.coordinates.center.longitude,
          venueData.coordinates.center.latitude
        ];

        const distance = this.calculateDistance(coordinates, venueCoordinates);

        console.log(`🌍 Distance to ${venueData.name}: ${distance.toFixed(2)}km`);

        // Find the closest venue within detection radius
        if (distance < DETECTION_RADIUS_KM && distance < minDistance) {
          minDistance = distance;

          // Convert venue data to SailingVenue format
          nearestVenue = {
            id: venueData.id,
            name: venueData.name,
            coordinates: venueCoordinates,
            country: venueData.country,
            region: venueData.region,
            venueType: venueData.priority === 1 ? 'premier' : 'regional',
            timeZone: this.getTimeZoneForRegion(venueData.region),
            primaryClubs: [],
            sailingConditions: {
              windPatterns: [],
              typicalConditions: {
                windSpeed: { min: 5, max: 25, average: 12 },
                windDirection: { primary: 270 },
                waveHeight: { typical: 1, maximum: 3 },
                visibility: { typical: 10, minimum: 2 },
              },
              seasonalVariations: [],
              hazards: [],
              racingAreas: [],
            },
            culturalContext: venueData.culturalContext || {
              primaryLanguages: [{ code: 'en', name: 'English', prevalence: 'primary' }],
              sailingCulture: {
                tradition: 'historic',
                competitiveness: 'international',
                formality: 'casual',
                inclusivity: 'welcoming',
                characteristics: ['competitive', 'innovative', 'welcoming'],
              },
              racingCustoms: [],
              socialProtocols: [],
              economicFactors: {
                currency: 'USD',
                costLevel: 'moderate',
                entryFees: { typical: 100, range: { min: 30, max: 300 } },
                accommodation: { budget: 100, moderate: 200, luxury: 400 },
                dining: { budget: 20, moderate: 50, upscale: 120 },
                services: { rigger: 80, sail_repair: 60, chandlery: 'moderate' },
                tipping: { expected: false, rate: 10, contexts: ['dining'] },
              },
              regulatoryEnvironment: {
                racingRules: { authority: 'World Sailing', variations: [] },
                safetyRequirements: [],
                environmentalRestrictions: [],
                entryRequirements: [],
              },
            },
            weatherSources: {
              primary: {
                name: 'Regional Weather Service',
                type: 'regional_model',
                region: venueData.region,
                accuracy: 'high',
                forecastHorizon: 72,
                updateFrequency: 6,
                specialties: ['marine', 'wind'],
              },
              updateFrequency: 6,
              reliability: 0.85,
            },
            localServices: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            dataQuality: 'verified',
          };
        }
      }

      if (nearestVenue) {
        console.log(`🌍 Nearest venue found: ${nearestVenue.name} at ${minDistance.toFixed(2)}km`);
      } else {
        console.log(`🌍 No venues found within ${DETECTION_RADIUS_KM}km radius`);
      }

      return nearestVenue;

    } catch (error) {
      console.error('🌍 Error loading venues database:', error);
      return null;
    }
  }

  /**
   * Get appropriate timezone for a region
   */
  private getTimeZoneForRegion(region: string): string {
    const timezones: Record<string, string> = {
      'us-east-coast': 'America/New_York',
      'us-west-coast': 'America/Los_Angeles',
      'uk-solent': 'Europe/London',
      'mediterranean-west': 'Europe/Paris',
      'mediterranean-east': 'Europe/Istanbul',
      'australia-east-coast': 'Australia/Sydney',
      'australia-west-coast': 'Australia/Perth',
      'asia-pacific': 'Asia/Hong_Kong',
      'new-zealand': 'Pacific/Auckland',
      'atlantic-mid': 'Atlantic/Bermuda',
      'baltic-sea': 'Europe/Stockholm',
      'south-america-east': 'America/Sao_Paulo',
      'middle-east': 'Asia/Dubai',
      'south-africa': 'Africa/Cape_Town',
      'north-america-west': 'America/Vancouver',
      'atlantic-europe': 'Europe/Paris',
      'great-lakes': 'America/Chicago',
    };

    return timezones[region] || 'UTC';
  }

  /**
   * Check if coordinates are within venue bounds
   */
  private isWithinVenueBounds(coordinates: Coordinates, venue: SailingVenue): boolean {
    const distance = this.calculateDistance(coordinates, venue.coordinates);

    // Define venue bounds based on venue type
    const bounds = {
      championship: 30, // 30km radius for major championship venues
      premier: 25,      // 25km radius for premier venues
      regional: 15,     // 15km radius for regional venues
      local: 10,        // 10km radius for local venues
      club: 5,          // 5km radius for club venues
    };

    const boundRadius = bounds[venue.venueType] || 15;
    return distance <= boundRadius;
  }

  /**
   * Switch to a new venue (or null to clear)
   */
  private async switchToVenue(newVenue: SailingVenue | null): Promise<void> {
    const previousVenue = this.currentVenue;

    // Check if venue actually changed
    if (previousVenue?.id === newVenue?.id) return;

    console.log(`🌍 Venue transition: ${previousVenue?.name || 'None'} → ${newVenue?.name || 'None'}`);

    // Create transition object
    const transition: VenueTransition = {
      fromVenue: previousVenue || undefined,
      toVenue: newVenue!,
      transitionType: this.determineTransitionType(previousVenue, newVenue),
      transitionDate: new Date(),
      adaptationRequired: newVenue ? await this.calculateAdaptationRequirements(previousVenue, newVenue) : [],
    };

    // Update current venue
    this.currentVenue = newVenue;

    // Notify listeners
    this.notifyVenueDetection(newVenue);
    if (newVenue) {
      this.notifyVenueTransition(transition);
    }

    // Log venue intelligence
    if (newVenue) {
      console.log(`🌍 Now at: ${newVenue.name} (${newVenue.country})`);
      console.log(`🌍 Venue type: ${newVenue.venueType}`);
      console.log(`🌍 Cultural context: ${newVenue.culturalContext.sailingCulture.tradition}`);
      console.log(`🌍 Primary language: ${newVenue.culturalContext.primaryLanguages[0]?.name}`);
    }
  }

  /**
   * Determine the type of venue transition
   */
  private determineTransitionType(
    from: SailingVenue | null,
    to: SailingVenue | null
  ): VenueTransition['transitionType'] {
    if (!from && to) return 'first_visit';
    if (from && to && from.id !== to.id) return 'traveling';
    return 'returning';
  }

  /**
   * Calculate what adaptations are needed for the new venue
   */
  private async calculateAdaptationRequirements(
    from: SailingVenue | null,
    to: SailingVenue
  ): Promise<AdaptationRequirement[]> {
    const adaptations: AdaptationRequirement[] = [];

    if (!from) {
      // First venue - basic adaptations
      adaptations.push({
        category: 'weather_source',
        description: `Switch to ${to.weatherSources.primary.name} for local weather`,
        priority: 'important',
        actionRequired: 'Automatic weather source configuration',
        userCanConfigure: false,
      });

      adaptations.push({
        category: 'cultural',
        description: `Learn about ${to.name} sailing culture`,
        priority: 'helpful',
        actionRequired: 'Review cultural briefing',
        userCanConfigure: true,
      });

      return adaptations;
    }

    // Compare venues for specific adaptations needed

    // Language adaptation
    if (from.culturalContext.primaryLanguages[0]?.code !== to.culturalContext.primaryLanguages[0]?.code) {
      adaptations.push({
        category: 'language',
        description: `Language change: ${from.culturalContext.primaryLanguages[0]?.name} → ${to.culturalContext.primaryLanguages[0]?.name}`,
        priority: 'important',
        actionRequired: 'Load language pack and sailing terminology',
        userCanConfigure: true,
      });
    }

    // Currency adaptation
    if (from.culturalContext.economicFactors.currency !== to.culturalContext.economicFactors.currency) {
      adaptations.push({
        category: 'currency',
        description: `Currency change: ${from.culturalContext.economicFactors.currency} → ${to.culturalContext.economicFactors.currency}`,
        priority: 'important',
        actionRequired: 'Update currency display and cost estimates',
        userCanConfigure: false,
      });
    }

    // Weather source adaptation
    if (from.weatherSources.primary.name !== to.weatherSources.primary.name) {
      adaptations.push({
        category: 'weather_source',
        description: `Weather source change: ${from.weatherSources.primary.name} → ${to.weatherSources.primary.name}`,
        priority: 'critical',
        actionRequired: 'Switch weather data providers',
        userCanConfigure: false,
      });
    }

    // Cultural adaptation
    if (from.culturalContext.sailingCulture.formality !== to.culturalContext.sailingCulture.formality) {
      adaptations.push({
        category: 'cultural',
        description: `Cultural shift: ${from.culturalContext.sailingCulture.formality} → ${to.culturalContext.sailingCulture.formality}`,
        priority: 'helpful',
        actionRequired: 'Review cultural protocols and etiquette',
        userCanConfigure: true,
      });
    }

    return adaptations;
  }

  /**
   * Register callback for venue detection events
   */
  onVenueDetected(callback: (venue: SailingVenue | null) => void): void {
    this.detectionCallbacks.push(callback);
  }

  /**
   * Register callback for venue transition events
   */
  onVenueTransition(callback: (transition: VenueTransition) => void): void {
    this.transitionCallbacks.push(callback);
  }

  /**
   * Notify all detection listeners
   */
  private notifyVenueDetection(venue: SailingVenue | null): void {
    this.detectionCallbacks.forEach(callback => {
      try {
        callback(venue);
      } catch (error) {
        console.error('🌍 Error in venue detection callback:', error);
      }
    });
  }

  /**
   * Notify all transition listeners
   */
  private notifyVenueTransition(transition: VenueTransition): void {
    this.transitionCallbacks.forEach(callback => {
      try {
        callback(transition);
      } catch (error) {
        console.error('🌍 Error in venue transition callback:', error);
      }
    });
  }

  /**
   * Manually set venue (for testing or user override)
   */
  async setVenueManually(venueId: string): Promise<void> {
    console.log(`🌍 Manual venue selection: ${venueId}`);

    // Find the venue by ID from our venue database
    const venueData = this.venues[venueId];
    if (!venueData) {
      console.error(`🌍 Venue not found: ${venueId}`);
      return;
    }

    // Create venue object
    const venue: SailingVenue = {
      id: venueData.id,
      name: venueData.name,
      coordinates: venueData.coordinates.center,
      country: venueData.country,
      venueType: venueData.priority === 1 ? 'premier' : 'regional',
      culturalContext: venueData.culturalContext,
    };

    console.log(`🌍 Manually switching to venue: ${venue.name}`);
    await this.switchToVenue(venue);
  }

  /**
   * Get current venue
   */
  getCurrentVenue(): SailingVenue | null {
    return this.currentVenue;
  }

  /**
   * Get current location
   */
  getCurrentLocation(): Coordinates | null {
    return this.currentLocation;
  }

  /**
   * Get detection status
   */
  getDetectionStatus(): LocationDetection | null {
    if (!this.currentLocation) return null;

    return {
      currentLocation: this.currentLocation,
      detectedVenue: this.currentVenue || undefined,
      confidence: this.currentVenue ? 0.9 : 0.0,
      detectionMethod: 'gps',
      lastUpdated: new Date(),
    };
  }

  /**
   * Stop venue detection and cleanup
   */
  async cleanup(): Promise<void> {
    console.log('🌍 Cleaning up venue detection service');

    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }

    this.detectionCallbacks = [];
    this.transitionCallbacks = [];
    this.currentVenue = null;
    this.currentLocation = null;
  }
}

// Export singleton instance
export const venueDetectionService = new VenueDetectionService();