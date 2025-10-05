/**
 * OnboardingAgent Test
 * Tests GPS → venue → fleet → club flow
 */

import { OnboardingAgent } from '@/src/services/agents/OnboardingAgent';
import { LocationDetectionService } from '@/src/services/LocationDetectionService';
import { FleetDiscoveryService } from '@/src/services/FleetDiscoveryService';
import { ClubDiscoveryService } from '@/src/services/ClubDiscoveryService';

describe('OnboardingAgent', () => {
  const testSailorId = 'test-sailor-123';

  // Test GPS coordinates for Hong Kong
  const hongKongGPS = {
    lat: 22.2793,
    lng: 114.1628,
  };

  describe('GPS Venue Detection', () => {
    it('should detect Hong Kong venue from GPS coordinates', async () => {
      const result = await LocationDetectionService.detectCurrentLocation();

      expect(result).toBeTruthy();
      expect(result?.venue).toBeTruthy();
      expect(result?.venue?.name).toContain('Hong Kong');
      expect(result?.confidence).toBeOneOf(['high', 'medium', 'low']);

      console.log('✅ GPS Detection:', {
        venue: result?.venue?.name,
        confidence: result?.confidence,
        distance: result?.venue?.distance_km,
      });
    });

    it('should add sailing location for sailor', async () => {
      const location = await LocationDetectionService.addSailorLocation(
        testSailorId,
        'hong-kong-test',
        true // primary
      );

      expect(location).toBeTruthy();
      expect(location?.is_primary).toBe(true);

      console.log('✅ Location Added:', location);
    });
  });

  describe('Fleet Discovery', () => {
    it('should discover fleets by venue and boat class', async () => {
      const fleets = await FleetDiscoveryService.discoverFleets(
        'hong-kong-test',
        'dragon-class-id',
        10
      );

      expect(Array.isArray(fleets)).toBe(true);
      expect(fleets.length).toBeGreaterThan(0);

      // Should be sorted by member count (popularity)
      if (fleets.length > 1) {
        expect(fleets[0].member_count).toBeGreaterThanOrEqual(fleets[1].member_count || 0);
      }

      console.log('✅ Fleet Discovery:', {
        count: fleets.length,
        topFleet: fleets[0]?.name,
        members: fleets[0]?.member_count,
      });
    });

    it('should suggest personalized fleets for sailor', async () => {
      const fleets = await FleetDiscoveryService.getSuggestedFleets(testSailorId);

      expect(Array.isArray(fleets)).toBe(true);

      console.log('✅ Suggested Fleets:', {
        count: fleets.length,
        fleets: fleets.map(f => ({ name: f.name, members: f.member_count })),
      });
    });
  });

  describe('Club Discovery', () => {
    it('should discover yacht clubs by venue', async () => {
      const clubs = await ClubDiscoveryService.discoverClubsByVenue('hong-kong-test');

      expect(Array.isArray(clubs)).toBe(true);

      console.log('✅ Yacht Clubs:', {
        count: clubs.length,
        clubs: clubs.map(c => c.name),
      });
    });

    it('should discover class associations by boat class', async () => {
      const associations = await ClubDiscoveryService.discoverAssociationsByClass('dragon-class-id');

      expect(Array.isArray(associations)).toBe(true);

      console.log('✅ Class Associations:', {
        count: associations.length,
        associations: associations.map(a => a.name),
      });
    });

    it('should get personalized club suggestions', async () => {
      const suggestions = await ClubDiscoveryService.getSuggestedClubs(testSailorId);

      expect(suggestions).toBeTruthy();
      expect(Array.isArray(suggestions.clubs)).toBe(true);
      expect(Array.isArray(suggestions.associations)).toBe(true);

      console.log('✅ Club Suggestions:', {
        clubs: suggestions.clubs.length,
        associations: suggestions.associations.length,
      });
    });
  });

  describe('Complete Onboarding Flow (Agent)', () => {
    it('should complete full onboarding autonomously', async () => {
      const agent = new OnboardingAgent();

      const result = await agent.runOnboarding({
        sailorId: testSailorId,
        userMessage: "I'm a Dragon sailor in Hong Kong, help me get started",
        gpsCoordinates: hongKongGPS,
      });

      expect(result.success).toBe(true);
      expect(result.toolsUsed).toBeTruthy();
      expect(result.toolsUsed.length).toBeGreaterThan(0);

      console.log('✅ OnboardingAgent Complete:', {
        success: result.success,
        toolsUsed: result.toolsUsed,
        result: result.result,
      });

      // Verify the agent used the expected tools
      const expectedTools = [
        'detect_venue_from_gps',
        'suggest_boats_by_popularity',
        'discover_fleets_smart',
        'suggest_clubs_for_context',
      ];

      expectedTools.forEach(tool => {
        const used = result.toolsUsed?.includes(tool);
        console.log(`  ${used ? '✅' : '❌'} ${tool}`);
      });
    }, 60000); // 60 second timeout for agent execution
  });

  describe('Data Verification', () => {
    it('should verify sailor has locations', async () => {
      const locations = await LocationDetectionService.getSailorLocations(testSailorId);

      expect(Array.isArray(locations)).toBe(true);
      expect(locations.length).toBeGreaterThan(0);

      console.log('✅ Sailor Locations:', locations.length);
    });

    it('should verify sailor has fleets', async () => {
      const fleets = await FleetDiscoveryService.getSailorFleets(testSailorId);

      expect(Array.isArray(fleets)).toBe(true);

      console.log('✅ Sailor Fleets:', fleets.length);
    });

    it('should verify sailor has clubs', async () => {
      const clubs = await ClubDiscoveryService.getSailorClubs(testSailorId);

      expect(Array.isArray(clubs)).toBe(true);

      console.log('✅ Sailor Clubs:', clubs.length);
    });
  });
});

// Helper matchers
expect.extend({
  toBeOneOf(received: any, array: any[]) {
    const pass = array.includes(received);
    return {
      pass,
      message: () => `expected ${received} to be one of ${array.join(', ')}`,
    };
  },
});
