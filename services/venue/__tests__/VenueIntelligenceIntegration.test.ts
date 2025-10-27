/**
 * Venue Intelligence Integration Tests
 * Tests the complete integration between GlobalVenueDatabase and SupabaseVenueService
 */

import { supabaseVenueService } from '../SupabaseVenueService';
import { globalVenueDatabase } from '../GlobalVenueDatabase';
import { Coordinates, SailingVenue } from '@/lib/types/global-venues';

describe('Venue Intelligence Integration', () => {
  beforeAll(async () => {
    // Initialize both services
    await globalVenueDatabase.initialize();
    await supabaseVenueService.initializeVenueSchema();
  });

  describe('Location-based Venue Detection', () => {
    test('should find Hong Kong venue by coordinates', async () => {
      const hongKongCoords: Coordinates = [114.1694, 22.3193];

      // Test local database
      const localVenue = globalVenueDatabase.findVenueByLocation(hongKongCoords, 50);
      expect(localVenue).toBeTruthy();
      expect(localVenue?.name).toContain('Hong Kong');

      // Test Supabase integration
      const supabaseVenue = await supabaseVenueService.findVenueByLocation(hongKongCoords, 50);
      expect(supabaseVenue).toBeTruthy();
      expect(supabaseVenue?.name).toContain('Hong Kong');
    });

    test('should return null for middle of ocean', async () => {
      const oceanCoords: Coordinates = [180.0, 0.0]; // Middle of Pacific

      const localVenue = globalVenueDatabase.findVenueByLocation(oceanCoords, 50);
      expect(localVenue).toBeNull();

      const supabaseVenue = await supabaseVenueService.findVenueByLocation(oceanCoords, 50);
      expect(supabaseVenue).toBeNull();
    });
  });

  describe('Venue Search Functionality', () => {
    test('should search venues by name', async () => {
      // Test local database
      const localResults = globalVenueDatabase.searchVenues('Hong Kong', 5);
      expect(localResults.length).toBeGreaterThan(0);

      // Test Supabase integration
      const supabaseResults = await supabaseVenueService.searchVenues('Hong Kong');
      expect(supabaseResults.length).toBeGreaterThan(0);
    });

    test('should find venues by region', async () => {
      // Test local database
      const localResults = globalVenueDatabase.getVenuesByRegion('asia-pacific');
      expect(localResults.length).toBeGreaterThan(0);

      // Test Supabase integration with search filters
      const supabaseResults = await supabaseVenueService.searchVenues('', {
        region: 'asia-pacific'
      });
      expect(supabaseResults.length).toBeGreaterThan(0);
    });
  });

  describe('Nearby Venues Circuit Planning', () => {
    test('should find nearby venues for Hong Kong', async () => {
      const hongKongCoords: Coordinates = [114.1694, 22.3193];

      // Test local database
      const localNearby = globalVenueDatabase.getNearbyVenues(hongKongCoords, 500);
      expect(localNearby.length).toBeGreaterThan(0);

      // Test Supabase integration
      const supabaseNearby = await supabaseVenueService.getNearbyVenues(hongKongCoords, 500, 10);
      expect(supabaseNearby.length).toBeGreaterThan(0);

      // Verify distance calculation
      supabaseNearby.forEach(venue => {
        expect(venue.distance_km).toBeDefined();
        expect(venue.distance_km).toBeLessThanOrEqual(500);
      });
    });
  });

  describe('Venue Intelligence Data', () => {
    test('should provide complete venue intelligence', async () => {
      const venue = globalVenueDatabase.getVenueById('hong-kong-victoria-harbor');
      expect(venue).toBeTruthy();

      if (venue) {
        // Test venue has comprehensive data
        expect(venue.yachtClubs).toBeDefined();
        expect(venue.conditions).toBeDefined();
        expect(venue.culturalContext).toBeDefined();
        expect(venue.weatherSources).toBeDefined();

        // Test cultural context completeness
        expect(venue.culturalContext.primaryLanguages).toBeDefined();
        expect(venue.culturalContext.economicFactors).toBeDefined();
        expect(venue.culturalContext.sailingCulture).toBeDefined();

        // Test Supabase integration
        const supabaseVenue = await supabaseVenueService.getVenueWithIntelligence(venue.id);
        expect(supabaseVenue).toBeTruthy();
      }
    });
  });

  describe('User Profile Integration', () => {
    const testUserId = 'test-user-123';
    const testVenueId = 'hong-kong-victoria-harbor';

    test('should create and update user venue profile', async () => {
      const profile = await supabaseVenueService.upsertUserVenueProfile(
        testUserId,
        testVenueId,
        {
          familiarityLevel: 'intermediate',
          visitCount: 1,
          lastVisit: new Date(),
          preferences: {
            preferredBoatClasses: ['Dragon', 'Etchells'],
            racingFocus: 'fleet_racing'
          }
        }
      );

      expect(profile).toBeTruthy();
      expect(profile?.familiarityLevel).toBe('intermediate');
    });

    test('should record venue transitions', async () => {
      const venue = globalVenueDatabase.getVenueById(testVenueId);
      if (venue) {
        await supabaseVenueService.recordVenueTransition(testUserId, {
          fromVenue: null, // First visit
          toVenue: venue,
          transitionType: 'first_visit',
          adaptationRequired: ['language', 'currency'],
          culturalBriefing: {
            venueId: venue.id,
            languageInfo: {
              primaryLanguage: 'English',
              commonPhrases: [],
              sailingTerminology: []
            },
            culturalProtocols: [],
            economicInfo: {
              currency: 'HKD',
              tippingCustoms: [],
              typicalCosts: [],
              paymentMethods: []
            },
            practicalTips: []
          }
        });

        // Should not throw error
        expect(true).toBe(true);
      }
    });

    test('should retrieve user venue history', async () => {
      const history = await supabaseVenueService.getUserVenueHistory(testUserId);

      expect(history).toBeDefined();
      expect(history.visitedVenues).toBeDefined();
      expect(history.favoriteVenues).toBeDefined();
      expect(history.recentTransitions).toBeDefined();
    });
  });

  describe('Analytics and Statistics', () => {
    test('should provide global venue analytics', async () => {
      const analytics = await supabaseVenueService.getVenueAnalytics();

      expect(analytics.totalVenues).toBeGreaterThan(0);
      expect(analytics.venuesByType).toBeDefined();
      expect(analytics.venuesByRegion).toBeDefined();
      expect(analytics.topVenuesByVisits).toBeDefined();
      expect(analytics.recentTransitions).toBeDefined();
    });

    test('should match global database statistics', async () => {
      const globalStats = globalVenueDatabase.getGlobalStats();
      const supabaseAnalytics = await supabaseVenueService.getVenueAnalytics();

      // Should have similar venue counts (allowing for test data differences)
      expect(Math.abs(globalStats.totalVenues - supabaseAnalytics.totalVenues)).toBeLessThan(10);
    });
  });

  describe('Racing Events Integration', () => {
    test('should find racing events for venue', async () => {
      const events = await supabaseVenueService.getVenueRacingEvents(
        'hong-kong-victoria-harbor',
        new Date('2024-01-01'),
        new Date('2024-12-31')
      );

      expect(events).toBeDefined();
      expect(Array.isArray(events)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid coordinates gracefully', async () => {
      const invalidCoords: Coordinates = [999, 999];

      const venue = await supabaseVenueService.findVenueByLocation(invalidCoords, 50);
      expect(venue).toBeNull(); // Should not throw, just return null
    });

    test('should handle non-existent venue IDs', async () => {
      const venue = await supabaseVenueService.getVenueWithIntelligence('non-existent-venue');
      expect(venue).toBeNull();
    });

    test('should handle empty search queries', async () => {
      const results = await supabaseVenueService.searchVenues('');
      expect(Array.isArray(results)).toBe(true);
    });
  });
});

/**
 * Integration Test Scenarios
 *
 * These tests verify the complete venue intelligence system works as intended:
 *
 * 1. Location Detection: GPS coordinates → venue identification
 * 2. Search Functionality: Text/filter queries → relevant venues
 * 3. Circuit Planning: Nearby venue discovery for race campaigns
 * 4. Cultural Intelligence: Complete venue context and adaptation
 * 5. User Personalization: Profiles, history, and preferences
 * 6. Performance Analytics: Statistics and trending data
 * 7. Racing Calendar: Event discovery and planning
 * 8. Error Resilience: Graceful handling of edge cases
 *
 * This creates the foundation for the "OnX Maps for Sailing" experience.
 */