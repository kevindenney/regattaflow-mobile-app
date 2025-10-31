/**
 * Basic Venue Intelligence Integration Test
 * Tests core functionality between services
 */

import { globalVenueDatabase } from '../GlobalVenueDatabase';
import type { Coordinates } from '@/lib/types/global-venues';

describe('Venue Intelligence Basic Integration', () => {
  beforeAll(async () => {
    await globalVenueDatabase.initialize();
  });

  describe('Global Venue Database', () => {
    test('should initialize successfully', async () => {
      const stats = globalVenueDatabase.getGlobalStats();

      expect(stats.totalVenues).toBeGreaterThan(0);
      expect(Object.keys(stats.venuesByType)).toContain('premier');
      expect(Object.keys(stats.venuesByRegion)).toContain('asia-pacific');
      expect(Object.keys(stats.venuesByRegion).length).toBeGreaterThan(0);
    });

    test('should find Hong Kong venue by coordinates', () => {
      const hongKongCoords: Coordinates = [114.1694, 22.3193];

      const venue = globalVenueDatabase.findVenueByLocation(hongKongCoords, 50);

      expect(venue).toBeTruthy();
      expect(venue?.name).toContain('Hong Kong');
      expect(venue?.region).toBe('asia-pacific');
      expect(venue?.venueType).toBe('premier');
    });

    test('should search venues by name', () => {
      const results = globalVenueDatabase.searchVenues('Hong Kong', 5);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Hong Kong');
    });

    test('should find nearby venues', () => {
      const hongKongCoords: Coordinates = [114.1694, 22.3193];

      const nearby = globalVenueDatabase.getNearbyVenues(hongKongCoords, 500);

      expect(nearby.length).toBeGreaterThan(0);
      // Should include Hong Kong itself
      expect(nearby.some(venue => venue.name.includes('Hong Kong'))).toBe(true);
    });

    test('should get venues by region', () => {
      const asiaPacificVenues = globalVenueDatabase.getVenuesByRegion('asia-pacific');

      expect(asiaPacificVenues.length).toBeGreaterThan(0);
      asiaPacificVenues.forEach(venue => {
        expect(venue.region).toBe('asia-pacific');
      });
    });

    test('should get venue by ID', () => {
      const venue = globalVenueDatabase.getVenueById('hong-kong-victoria-harbor');

      expect(venue).toBeTruthy();
      expect(venue?.id).toBe('hong-kong-victoria-harbor');
      expect(venue?.name).toContain('Hong Kong');
    });

    test('should have comprehensive venue data', () => {
      const venue = globalVenueDatabase.getVenueById('hong-kong-victoria-harbor');

      if (venue) {
        // Check required properties
        expect(venue.coordinates).toBeDefined();
        expect(venue.coordinates).toHaveLength(2);
        expect(venue.country).toBeDefined();
        expect(venue.region).toBeDefined();
        expect(venue.timeZone).toBeDefined();

        // Check yacht clubs
        expect(venue.primaryClubs).toBeDefined();
        expect(venue.primaryClubs.length).toBeGreaterThan(0);

        // Check sailing conditions
        expect(venue.sailingConditions).toBeDefined();
        expect(venue.sailingConditions.windPatterns).toBeDefined();
        expect(venue.sailingConditions.typicalConditions).toBeDefined();

        // Check cultural context
        expect(venue.culturalContext).toBeDefined();
        expect(venue.culturalContext.primaryLanguages).toBeDefined();
        expect(venue.culturalContext.economicFactors).toBeDefined();
        expect(venue.culturalContext.sailingCulture).toBeDefined();

        // Check weather sources
        expect(venue.weatherSources).toBeDefined();
        expect(venue.weatherSources.primary).toBeDefined();
      }
    });

    test('should return null for non-existent venue', () => {
      const venue = globalVenueDatabase.getVenueById('non-existent-venue');
      expect(venue).toBeNull();
    });

    test('should return null for middle of ocean', () => {
      const oceanCoords: Coordinates = [180.0, 0.0]; // Middle of Pacific
      const venue = globalVenueDatabase.findVenueByLocation(oceanCoords, 50);
      expect(venue).toBeNull();
    });

    test('should return empty array for invalid search', () => {
      const results = globalVenueDatabase.searchVenues('xyz123nonexistent', 5);
      expect(results).toHaveLength(0);
    });
  });

  describe('Distance Calculations', () => {
    test('should calculate distances correctly', () => {
      const hongKongCoords: Coordinates = [114.1694, 22.3193];
      const cowesCoords: Coordinates = [-1.2982, 50.7612]; // Cowes, UK

      // These two venues should be thousands of kilometers apart
      const distance = globalVenueDatabase.getDistanceBetweenCoordinates(hongKongCoords, cowesCoords);

      expect(distance).toBeGreaterThan(8000); // Should be ~9600km
      expect(distance).toBeLessThan(12000);
    });

    test('should calculate zero distance for same coordinates', () => {
      const coords: Coordinates = [114.1694, 22.3193];

      const distance = globalVenueDatabase.getDistanceBetweenCoordinates(coords, coords);

      expect(distance).toBe(0);
    });
  });

  describe('Venue Data Quality', () => {
    test('all venues should have required fields', () => {
      const allVenues = globalVenueDatabase.getAllVenues();

      allVenues.forEach(venue => {
        expect(venue.id).toBeTruthy();
        expect(venue.name).toBeTruthy();
        expect(venue.coordinates).toBeDefined();
        expect(venue.coordinates).toHaveLength(2);
        expect(venue.country).toBeTruthy();
        expect(venue.region).toBeTruthy();
        expect(venue.venueType).toBeTruthy();
        expect(venue.timeZone).toBeTruthy();
        expect(venue.primaryClubs).toBeDefined();
        expect(venue.sailingConditions).toBeDefined();
        expect(venue.culturalContext).toBeDefined();
        expect(venue.weatherSources).toBeDefined();
      });
    });

    test('coordinates should be valid', () => {
      const allVenues = globalVenueDatabase.getAllVenues();

      allVenues.forEach(venue => {
        const [lng, lat] = venue.coordinates;
        expect(lng).toBeGreaterThanOrEqual(-180);
        expect(lng).toBeLessThanOrEqual(180);
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);
      });
    });

    test('yacht clubs should have valid data', () => {
      const venue = globalVenueDatabase.getVenueById('hong-kong-victoria-harbor');

      if (venue && venue.primaryClubs.length > 0) {
        venue.primaryClubs.forEach(club => {
          expect(club.id).toBeTruthy();
          expect(club.name).toBeTruthy();
          expect(club.prestigeLevel).toBeTruthy();
          expect(['international', 'national', 'regional', 'local']).toContain(club.prestigeLevel);
        });
      }
    });
  });
});

/**
 * This test suite validates the core venue intelligence functionality:
 *
 * 1. Database initialization and basic statistics
 * 2. GPS-based venue detection (core feature)
 * 3. Text-based venue search
 * 4. Nearby venue discovery for circuit planning
 * 5. Regional venue filtering
 * 6. Direct venue access by ID
 * 7. Data completeness and quality validation
 * 8. Geographic distance calculations
 * 9. Error handling for edge cases
 *
 * This ensures the foundation for "OnX Maps for Sailing" works correctly.
 */
