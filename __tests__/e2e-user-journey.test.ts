/**
 * End-to-End User Journey Test
 * Complete flow from onboarding to race analysis
 */

import { OnboardingAgent } from '@/src/services/agents/OnboardingAgent';
import { CoursePredictionAgent } from '@/src/services/agents/CoursePredictionAgent';
import { RaceAnalysisAgent } from '@/src/services/agents/RaceAnalysisAgent';
import { LocationDetectionService } from '@/src/services/LocationDetectionService';
import { FleetDiscoveryService } from '@/src/services/FleetDiscoveryService';
import { ClubDiscoveryService } from '@/src/services/ClubDiscoveryService';
import { RaceTimerService } from '@/src/services/RaceTimerService';
import { supabase } from '@/src/services/supabase';

describe('End-to-End User Journey', () => {
  const testUser = {
    id: 'e2e-test-sailor-789',
    email: 'test@regattaflow.com',
    name: 'Test Sailor',
  };

  const hongKongGPS = {
    lat: 22.2793,
    lng: 114.1628,
  };

  let venueId: string;
  let fleetId: string;
  let clubId: string;
  let regattaId: string;
  let timerSessionId: string;

  describe('Step 1: User Onboarding', () => {
    it('should complete GPS-powered onboarding flow', async () => {
      console.log('\n🚀 Starting E2E Test: Sailor Onboarding Journey\n');

      // Step 1.1: Detect location via GPS
      console.log('📍 Step 1.1: Detecting location via GPS...');
      const locationResult = await LocationDetectionService.detectCurrentLocation();

      expect(locationResult).toBeTruthy();
      expect(locationResult?.venue).toBeTruthy();

      venueId = locationResult!.venue!.id;

      console.log('  ✅ Location detected:', {
        venue: locationResult?.venue?.name,
        confidence: locationResult?.confidence,
      });

      // Step 1.2: Add location to sailor profile
      console.log('📝 Step 1.2: Adding location to profile...');
      const location = await LocationDetectionService.addSailorLocation(
        testUser.id,
        venueId,
        true // primary
      );

      expect(location).toBeTruthy();
      console.log('  ✅ Location added');

      // Step 1.3: Discover fleets
      console.log('👥 Step 1.3: Discovering fleets...');
      const fleets = await FleetDiscoveryService.discoverFleets(venueId, 'dragon-class-id');

      expect(fleets.length).toBeGreaterThan(0);
      fleetId = fleets[0].id;

      console.log('  ✅ Fleets discovered:', {
        count: fleets.length,
        topFleet: fleets[0].name,
        members: fleets[0].member_count,
      });

      // Step 1.4: Join fleet
      console.log('🤝 Step 1.4: Joining fleet...');
      const membership = await FleetDiscoveryService.joinFleet(testUser.id, fleetId, true);

      expect(membership).toBeTruthy();
      console.log('  ✅ Joined fleet');

      // Step 1.5: Discover clubs
      console.log('🏛️ Step 1.5: Discovering clubs...');
      const clubSuggestions = await ClubDiscoveryService.getSuggestedClubs(testUser.id);

      expect(clubSuggestions.clubs.length).toBeGreaterThan(0);
      clubId = clubSuggestions.clubs[0].id;

      console.log('  ✅ Clubs discovered:', {
        clubs: clubSuggestions.clubs.length,
        associations: clubSuggestions.associations.length,
      });

      // Step 1.6: Join club with auto-import
      console.log('📅 Step 1.6: Joining club with auto-import...');
      const clubMembership = await ClubDiscoveryService.addYachtClubMembership(
        testUser.id,
        clubId,
        true // auto-import races
      );

      expect(clubMembership).toBeTruthy();
      console.log('  ✅ Club joined with auto-import enabled');

      console.log('\n✅ Onboarding Complete!\n');
    }, 90000);
  });

  describe('Step 2: View Dashboard', () => {
    beforeAll(async () => {
      // Create test regatta for dashboard
      const { data: regatta } = await supabase
        .from('regattas')
        .insert({
          name: 'Hong Kong Dragon Championship',
          start_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          venue_id: venueId,
          club_id: clubId,
          vhf_channel: 'Channel 72',
          num_races: 3,
          starting_sequence: '5-4-1-0',
        })
        .select()
        .single();

      regattaId = regatta!.id;
    });

    it('should load next race card data', async () => {
      console.log('📊 Step 2.1: Loading next race card...');

      const { data: nextRace } = await supabase
        .from('regattas')
        .select(`
          *,
          sailing_venues(name, city),
          yacht_clubs(name)
        `)
        .eq('id', regattaId)
        .single();

      expect(nextRace).toBeTruthy();
      expect(nextRace?.vhf_channel).toBe('Channel 72');
      expect(nextRace?.num_races).toBe(3);

      console.log('  ✅ Next race loaded:', {
        name: nextRace?.name,
        date: nextRace?.start_date,
        races: nextRace?.num_races,
      });
    });

    it('should predict race course with AI', async () => {
      console.log('🗺️ Step 2.2: Predicting race course...');

      const agent = new CoursePredictionAgent();
      const result = await agent.predictCourse({
        regattaId,
        venueId,
        raceDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(result.success).toBe(true);
      console.log('  ✅ Course predicted:', {
        success: result.success,
        toolsUsed: result.toolsUsed?.length,
      });
    }, 60000);
  });

  describe('Step 3: Race Day', () => {
    it('should start GPS-tracked race timer', async () => {
      console.log('⏱️ Step 3.1: Starting race timer...');

      const session = await RaceTimerService.startSession(testUser.id, regattaId, {
        wind_direction: 225,
        wind_speed: 15,
        wave_height: 0.5,
      });

      expect(session).toBeTruthy();
      timerSessionId = session!.id;

      console.log('  ✅ Timer started:', {
        sessionId: timerSessionId,
        conditions: 'SW 15kts, 0.5m waves',
      });

      // Simulate racing (wait 2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const trackPoints = RaceTimerService.getTrackPointCount();
      console.log('  📍 GPS tracking active:', {
        points: trackPoints,
      });
    });

    it('should finish race and save GPS data', async () => {
      console.log('🏁 Step 3.2: Finishing race...');

      const finishedSession = await RaceTimerService.endSession(
        timerSessionId,
        3, // position
        15 // fleet size
      );

      expect(finishedSession).toBeTruthy();
      expect(finishedSession?.position).toBe(3);
      expect(finishedSession?.fleet_size).toBe(15);

      console.log('  ✅ Race finished:', {
        position: '3rd of 15',
        duration: finishedSession?.duration_seconds + ' seconds',
        trackPoints: finishedSession?.track_points?.length,
      });
    });
  });

  describe('Step 4: Post-Race Analysis', () => {
    it('should analyze race with AI', async () => {
      console.log('🤖 Step 4.1: Analyzing race with AI...');

      const agent = new RaceAnalysisAgent();
      const result = await agent.analyzeRace({
        timerSessionId,
      });

      expect(result.success).toBe(true);
      console.log('  ✅ Race analyzed:', {
        success: result.success,
        toolsUsed: result.toolsUsed?.length,
      });
    }, 90000);

    it('should retrieve AI analysis', async () => {
      console.log('📖 Step 4.2: Retrieving AI analysis...');

      const { data: analysis } = await supabase
        .from('ai_coach_analysis')
        .select('*')
        .eq('timer_session_id', timerSessionId)
        .single();

      expect(analysis).toBeTruthy();
      expect(analysis?.overall_summary).toBeTruthy();
      expect(analysis?.recommendations).toBeTruthy();

      console.log('  ✅ Analysis retrieved:', {
        confidence: Math.round(analysis!.confidence_score * 100) + '%',
        recommendations: analysis?.recommendations.length,
      });
    });
  });

  describe('Step 5: Profile Verification', () => {
    it('should verify complete sailor profile', async () => {
      console.log('✅ Step 5: Verifying complete profile...');

      const [locations, fleets, clubs] = await Promise.all([
        LocationDetectionService.getSailorLocations(testUser.id),
        FleetDiscoveryService.getSailorFleets(testUser.id),
        ClubDiscoveryService.getSailorClubs(testUser.id),
      ]);

      expect(locations.length).toBeGreaterThan(0);
      expect(fleets.length).toBeGreaterThan(0);
      expect(clubs.length).toBeGreaterThan(0);

      console.log('  ✅ Profile complete:', {
        locations: locations.length,
        fleets: fleets.length,
        clubs: clubs.length,
      });

      console.log('\n🎉 E2E Test Complete! User journey successful!\n');
    });
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up test data...');

    // Cleanup in reverse order of creation
    await supabase.from('ai_coach_analysis').delete().eq('timer_session_id', timerSessionId);
    await supabase.from('race_timer_sessions').delete().eq('id', timerSessionId);
    await supabase.from('race_predictions').delete().eq('regatta_id', regattaId);
    await supabase.from('regattas').delete().eq('id', regattaId);
    await supabase.from('sailor_clubs').delete().eq('sailor_id', testUser.id);
    await supabase.from('fleet_members').delete().eq('user_id', testUser.id);
    await supabase.from('sailor_locations').delete().eq('sailor_id', testUser.id);

    console.log('✅ Cleanup complete\n');
  });
});
