/**
 * Venue Detection Service
 * Handles GPS-based venue detection with timezone fallback
 * Fixes the "Location Unknown" issue for Hong Kong users
 * Universal support for React Native (mobile) and Web (browser)
 */

import { Platform } from 'react-native';
import { supabaseVenueService } from './SupabaseVenueService';
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
  private watchId: number | null = null; // Browser watchId is number, not Location.LocationSubscription
  private detectionCallbacks: ((venue: SailingVenue | null) => void)[] = [];
  private transitionCallbacks: ((transition: VenueTransition) => void)[] = [];
  private isInitialized: boolean = false;

  constructor() {
    console.log('🌍 VenueDetectionService initialized');
  }

  /**
   * Initialize venue detection with browser and mobile support
   */
  async initialize(): Promise<boolean> {
    console.log('🌍 Initializing venue detection...');

    try {
      // Initialize the Supabase venue service first
      await supabaseVenueService.initializeVenueSchema();

      if (Platform.OS === 'web') {
        // Browser-based detection
        return await this.initializeBrowserDetection();
      } else {
        // React Native mobile detection
        return await this.initializeMobileDetection();
      }
    } catch (error) {
      console.error('🌍 Failed to initialize venue detection:', error);
      // Fallback to timezone detection
      await this.performTimezoneBasedDetection();
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Initialize browser-based geolocation
   */
  private async initializeBrowserDetection(): Promise<boolean> {
    console.log('🌍 Initializing browser geolocation...');

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      console.warn('🌍 Geolocation not supported, using timezone detection');
      await this.performTimezoneBasedDetection();
      this.isInitialized = true;
      return false;
    }

    // Request location permission and get current position
    const hasPermission = await this.requestBrowserLocationPermission();

    if (hasPermission) {
      this.startBrowserLocationWatching();
      this.isInitialized = true;
      console.log('✅ Browser GPS venue detection initialized');
      return true;
    } else {
      console.warn('🌍 GPS permission denied, falling back to timezone detection');
      await this.performTimezoneBasedDetection();
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Initialize React Native mobile detection (fallback to original Expo implementation)
   */
  private async initializeMobileDetection(): Promise<boolean> {
    console.log('🌍 Mobile geolocation not implemented yet, using timezone detection');

    // For now, use timezone detection for mobile as well
    // TODO: Implement proper Expo Location integration for mobile
    await this.performTimezoneBasedDetection();
    this.isInitialized = true;
    return false;
  }

  /**
   * Request browser location permission and get current position
   */
  private async requestBrowserLocationPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log('✅ Browser location permission granted');

          // Immediately detect venue from current position
          const coordinates: Coordinates = [
            position.coords.longitude,
            position.coords.latitude
          ];

          console.log(`🌍 Browser GPS location: ${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`);
          this.currentLocation = coordinates;

          try {
            await this.detectVenueFromCoordinates(coordinates);
            resolve(true);
          } catch (error) {
            console.warn('🌍 Venue detection failed:', error);
            resolve(true); // Still resolve true since location was obtained
          }
        },
        (error) => {
          console.warn('🌍 Browser location permission denied or failed:', error.message);
          resolve(false);
        },
        {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 60000 // 1 minute cache
        }
      );
    });
  }

  /**
   * Start watching browser location changes
   */
  private startBrowserLocationWatching(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coordinates: Coordinates = [
          position.coords.longitude,
          position.coords.latitude
        ];

        // Only process if location changed significantly
        if (this.hasLocationChangedSignificantly(coordinates)) {
          console.log(`🌍 Browser GPS update: ${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`);
          this.currentLocation = coordinates;
          this.detectVenueFromCoordinates(coordinates).catch(error => {
            console.error('🌍 GPS venue detection failed:', error);
          });
        }
      },
      (error) => {
        console.warn('🌍 Browser GPS watch error:', error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000, // 30 seconds
        timeout: 15000
      }
    );

    console.log('🌍 Browser location watching started');
  }

  /**
   * Perform timezone-based venue detection for Hong Kong and other regions
   */
  private async performTimezoneBasedDetection(): Promise<void> {
    console.log('🌍 Performing timezone-based venue detection...');

    try {
      // Get user's timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log(`🌍 Detected timezone: ${timezone}`);

      // Map common sailing locations to timezones - Hong Kong specifically!
      const timezoneVenueMap: Record<string, string> = {
        // Hong Kong - Your specific case!
        'Asia/Hong_Kong': 'hong-kong-victoria-harbor',

        // Other major sailing venues
        'America/New_York': 'new-york-ny-usa',
        'America/Los_Angeles': 'san-francisco-bay-usa',
        'Europe/London': 'cowes-england-uk',
        'Europe/Paris': 'la-rochelle-france',
        'Australia/Sydney': 'sydney-harbor-australia',
        'Europe/Rome': 'porto-cervo-sardinia',
        'America/Vancouver': 'vancouver-bc-canada',
        'Asia/Tokyo': 'tokyo-bay-japan',
        'Europe/Amsterdam': 'medemblik-ijsselmeer-netherlands',
        'America/Chicago': 'chicago-il-usa'
      };

      const venueId = timezoneVenueMap[timezone];

      if (venueId) {
        // Try to find venue by ID in Supabase database
        const allVenues = await supabaseVenueService.getAllVenues();
        const venue = allVenues.find(v => v.id === venueId);
        if (venue) {
          console.log(`🌍 Venue detected from timezone (${timezone}): ${venue.name}`);
          this.updateCurrentVenue(venue);
          return;
        }
      }

      // Fallback: try to detect region from timezone
      const region = this.detectRegionFromTimezone(timezone);
      if (region) {
        const allVenues = await supabaseVenueService.getAllVenues();
        const regionalVenues = allVenues.filter(v => v.region === region);
        if (regionalVenues.length > 0) {
          // Select the most prominent venue in the region
          const primaryVenue = regionalVenues.find(v => v.venueType === 'premier') || regionalVenues[0];
          console.log(`🌍 Regional venue detected (${region}): ${primaryVenue.name}`);
          this.updateCurrentVenue(primaryVenue);
          return;
        }
      }

      console.log('🌍 Could not detect venue from timezone:', timezone);
      this.updateCurrentVenue(null);

    } catch (error) {
      console.error('❌ Timezone detection failed:', error);
      this.updateCurrentVenue(null);
    }
  }

  /**
   * Detect sailing region from timezone
   */
  private detectRegionFromTimezone(timezone: string): string | null {
    if (timezone.startsWith('Asia/')) return 'asia-pacific';
    if (timezone.startsWith('Europe/')) return 'europe';
    if (timezone.startsWith('America/')) return 'north-america';
    if (timezone.startsWith('Australia/') || timezone.startsWith('Pacific/')) return 'asia-pacific';
    if (timezone.startsWith('Africa/')) return 'europe'; // Most African sailing is Mediterranean-adjacent
    return null;
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
   * Detect venue from GPS coordinates using the Supabase database
   */
  private async detectVenueFromCoordinates(coordinates: Coordinates): Promise<void> {
    console.log(`🌍 Detecting venue at coordinates: [${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}]`);

    try {
      // Try different radius sizes for detection
      const radiusSizes = [25, 50, 100]; // km
      let detectedVenue: SailingVenue | null = null;

      for (const radius of radiusSizes) {
        detectedVenue = await supabaseVenueService.findVenueByLocation(coordinates, radius);
        if (detectedVenue) {
          console.log(`🌍 Venue detected within ${radius}km: ${detectedVenue.name}`);
          break;
        }
      }

      if (!detectedVenue) {
        console.log('🌍 No venue found near current location');
      }

      this.updateCurrentVenue(detectedVenue);
    } catch (error) {
      console.error('🌍 Failed to detect venue from coordinates:', error);
      this.updateCurrentVenue(null);
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
   * Update the current venue and handle transitions
   */
  private updateCurrentVenue(venue: SailingVenue | null): void {
    const previousVenue = this.currentVenue;

    // Only update if venue has actually changed
    if (venue?.id === previousVenue?.id) {
      return;
    }

    console.log(`🌍 Venue transition: ${previousVenue?.name || 'Unknown'} → ${venue?.name || 'Unknown'}`);

    // Handle venue transition
    if (previousVenue && venue && previousVenue.id !== venue.id) {
      const transition: VenueTransition = {
        fromVenue: previousVenue,
        toVenue: venue,
        timestamp: new Date(),
        detectionMethod: 'gps',
        confidence: 0.9
      };

      // Notify transition callbacks
      this.transitionCallbacks.forEach(callback => {
        try {
          callback(transition);
        } catch (error) {
          console.error('❌ Venue transition callback error:', error);
        }
      });
    }

    // Update current venue
    this.currentVenue = venue;

    // Notify detection callbacks
    this.detectionCallbacks.forEach(callback => {
      try {
        callback(venue);
      } catch (error) {
        console.error('❌ Venue detection callback error:', error);
      }
    });

    // Log venue intelligence
    if (venue) {
      console.log(`🌍 Now at: ${venue.name} (${venue.country})`);
      console.log(`🌍 Venue type: ${venue.venueType}`);
      console.log(`🌍 Cultural context: ${venue.culturalContext?.sailingCulture?.tradition || 'Unknown'}`);
      console.log(`🌍 Primary language: ${venue.culturalContext?.primaryLanguages?.[0]?.name || 'Unknown'}`);
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
        description: `Switch to ${to.weatherSources?.primary?.name || 'local weather source'} for local weather`,
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
    if (from.culturalContext?.primaryLanguages?.[0]?.code !== to.culturalContext?.primaryLanguages?.[0]?.code) {
      adaptations.push({
        category: 'language',
        description: `Language change: ${from.culturalContext?.primaryLanguages?.[0]?.name || 'Unknown'} → ${to.culturalContext?.primaryLanguages?.[0]?.name || 'Unknown'}`,
        priority: 'important',
        actionRequired: 'Load language pack and sailing terminology',
        userCanConfigure: true,
      });
    }

    // Currency adaptation
    if (from.culturalContext?.economicFactors?.currency !== to.culturalContext?.economicFactors?.currency) {
      adaptations.push({
        category: 'currency',
        description: `Currency change: ${from.culturalContext?.economicFactors?.currency || 'Unknown'} → ${to.culturalContext?.economicFactors?.currency || 'Unknown'}`,
        priority: 'important',
        actionRequired: 'Update currency display and cost estimates',
        userCanConfigure: false,
      });
    }

    // Weather source adaptation
    if (from.weatherSources?.primary?.name !== to.weatherSources?.primary?.name) {
      adaptations.push({
        category: 'weather_source',
        description: `Weather source change: ${from.weatherSources?.primary?.name || 'Unknown'} → ${to.weatherSources?.primary?.name || 'Unknown'}`,
        priority: 'critical',
        actionRequired: 'Switch weather data providers',
        userCanConfigure: false,
      });
    }

    // Cultural adaptation
    if (from.culturalContext?.sailingCulture?.formality !== to.culturalContext?.sailingCulture?.formality) {
      adaptations.push({
        category: 'cultural',
        description: `Cultural shift: ${from.culturalContext?.sailingCulture?.formality || 'Unknown'} → ${to.culturalContext?.sailingCulture?.formality || 'Unknown'}`,
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
   * Manually select a venue
   */
  async selectVenue(venueId: string): Promise<boolean> {
    console.log(`🌍 Manually selecting venue: ${venueId}`);

    try {
      const allVenues = await supabaseVenueService.getAllVenues();
      const venue = allVenues.find(v => v.id === venueId);

      if (!venue) {
        console.error(`❌ Venue not found: ${venueId}`);
        return false;
      }

      this.updateCurrentVenue(venue);
      return true;
    } catch (error) {
      console.error(`❌ Failed to select venue ${venueId}:`, error);
      return false;
    }
  }

  /**
   * Manually set venue (alias for selectVenue for hook compatibility)
   */
  async setVenueManually(venueId: string): Promise<void> {
    await this.selectVenue(venueId);
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
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Force a venue detection attempt
   */
  async forceDetection(): Promise<void> {
    console.log('🌍 Forcing venue detection...');

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            await this.detectVenueFromCoordinates([
              position.coords.longitude,
              position.coords.latitude
            ]);
            resolve();
          },
          async (error) => {
            console.warn('🌍 GPS detection failed, using timezone fallback:', error.message);
            await this.performTimezoneBasedDetection();
            resolve();
          },
          {
            timeout: 5000,
            enableHighAccuracy: true,
            maximumAge: 0 // Force fresh reading
          }
        );
      });
    } else {
      await this.performTimezoneBasedDetection();
    }
  }

  /**
   * Stop venue detection and cleanup
   */
  stop(): void {
    console.log('🌍 Cleaning up venue detection service');

    if (this.watchId !== null) {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(this.watchId);
        console.log('🌍 Browser location monitoring stopped');
      }
      this.watchId = null;
    }

    this.detectionCallbacks.length = 0;
    this.transitionCallbacks.length = 0;
    this.currentVenue = null;
    this.currentLocation = null;
    this.isInitialized = false;

    console.log('🌍 Venue detection service stopped');
  }

  /**
   * Add cleanup method as alias for stop (for backward compatibility)
   */
  cleanup(): void {
    console.log('🌍 [DEBUG] cleanup() called, delegating to stop()');
    this.stop();
  }
}

export default VenueDetectionService;

// Export singleton instance
export const venueDetectionService = new VenueDetectionService();