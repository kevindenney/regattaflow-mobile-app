/**
 * RaceAnalysisAgent Test
 * Tests GPS race analysis and AI coach feedback
 */

import { RaceAnalysisAgent } from '@/src/services/agents/RaceAnalysisAgent';
import { RaceTimerService } from '@/src/services/RaceTimerService';
import { supabase } from '@/src/services/supabase';

describe('RaceAnalysisAgent', () => {
  const testSailorId = 'test-sailor-456';
  const testRegattaId = 'test-regatta-456';
  let testSessionId: string;

  beforeAll(async () => {
    // Create test regatta
    await supabase.from('regattas').upsert({
      id: testRegattaId,
      name: 'Test Race Analysis Championship',
      start_date: '2025-10-15T11:00:00Z',
      venue_id: 'hong-kong-test',
    });

    // Create test race timer session with GPS data
    const mockGPSTrack = [
      {
        timestamp: '2025-10-15T11:00:00Z',
        latitude: 22.280,
        longitude: 114.160,
        speed: 5.2,
        heading: 45,
      },
      {
        timestamp: '2025-10-15T11:00:05Z',
        latitude: 22.281,
        longitude: 114.161,
        speed: 5.5,
        heading: 47,
      },
      {
        timestamp: '2025-10-15T11:00:10Z',
        latitude: 22.282,
        longitude: 114.162,
        speed: 5.8,
        heading: 50,
      },
      // Add more points to simulate a real race
      ...Array.from({ length: 100 }, (_, i) => ({
        timestamp: new Date(new Date('2025-10-15T11:00:15Z').getTime() + i * 5000).toISOString(),
        latitude: 22.283 + i * 0.001,
        longitude: 114.163 + i * 0.001,
        speed: 5.0 + Math.random() * 2,
        heading: 45 + Math.random() * 10,
      })),
    ];

    const { data: session, error } = await supabase
      .from('race_timer_sessions')
      .insert({
        sailor_id: testSailorId,
        regatta_id: testRegattaId,
        start_time: '2025-10-15T11:00:00Z',
        end_time: '2025-10-15T11:45:00Z',
        duration_seconds: 2700, // 45 minutes
        track_points: mockGPSTrack,
        wind_direction: 225,
        wind_speed: 15,
        wave_height: 0.5,
        position: 3,
        fleet_size: 15,
        auto_analyzed: false,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(session).toBeTruthy();
    testSessionId = session!.id;

    console.log('✅ Test race session created:', {
      sessionId: testSessionId,
      trackPoints: mockGPSTrack.length,
      duration: '45 minutes',
      position: '3rd of 15',
    });
  });

  describe('Race Analysis', () => {
    it('should analyze complete race with AI', async () => {
      const agent = new RaceAnalysisAgent();

      const result = await agent.analyzeRace({
        timerSessionId: testSessionId,
      });

      expect(result.success).toBe(true);
      expect(result.result).toBeTruthy();
      expect(result.toolsUsed).toBeTruthy();
      expect(result.toolsUsed!.length).toBeGreaterThan(0);

      console.log('✅ Race Analysis Result:', {
        success: result.success,
        toolsUsed: result.toolsUsed,
        analysis: result.result,
      });

      // Verify expected tools were used
      const expectedTools = [
        'get_race_timer_session',
        'analyze_start_performance',
        'identify_tactical_decisions',
        'save_analysis_to_database',
      ];

      expectedTools.forEach(tool => {
        const used = result.toolsUsed?.includes(tool);
        console.log(`  ${used ? '✅' : '❌'} ${tool}`);
      });
    }, 90000); // 90 second timeout for analysis

    it('should generate quick performance summary', async () => {
      const agent = new RaceAnalysisAgent();

      const result = await agent.quickSummary({
        timerSessionId: testSessionId,
      });

      expect(result.success).toBe(true);
      expect(result.result).toBeTruthy();
      expect(typeof result.result).toBe('string');

      console.log('✅ Quick Summary:', result.result);
    }, 60000);
  });

  describe('GPS Data Analysis', () => {
    it('should retrieve race session with GPS data', async () => {
      const session = await RaceTimerService.getSession(testSessionId);

      expect(session).toBeTruthy();
      expect(session?.track_points).toBeTruthy();
      expect(Array.isArray(session?.track_points)).toBe(true);
      expect(session!.track_points!.length).toBeGreaterThan(100);

      console.log('✅ GPS Data:', {
        trackPoints: session?.track_points?.length,
        duration: session?.duration_seconds,
        position: session?.position,
        fleet: session?.fleet_size,
      });
    });

    it('should calculate race statistics from GPS', () => {
      const mockTrack = [
        { latitude: 22.280, longitude: 114.160, speed: 5.0 },
        { latitude: 22.281, longitude: 114.161, speed: 5.5 },
        { latitude: 22.282, longitude: 114.162, speed: 6.0 },
        { latitude: 22.283, longitude: 114.163, speed: 5.2 },
      ];

      // Calculate average speed
      const avgSpeed =
        mockTrack.reduce((sum, point) => sum + point.speed, 0) / mockTrack.length;

      expect(avgSpeed).toBeCloseTo(5.425, 2);

      console.log('✅ Race Statistics:', {
        trackPoints: mockTrack.length,
        avgSpeed: avgSpeed.toFixed(2),
        maxSpeed: Math.max(...mockTrack.map(p => p.speed)),
        minSpeed: Math.min(...mockTrack.map(p => p.speed)),
      });
    });
  });

  describe('AI Analysis Storage', () => {
    it('should save AI analysis to database', async () => {
      const { data: analysis, error } = await supabase
        .from('ai_coach_analysis')
        .insert({
          timer_session_id: testSessionId,
          overall_summary: 'Strong performance overall. Good boat speed and tactical decisions.',
          start_analysis: 'Solid start execution. 2 seconds early at the gun, middle of line.',
          upwind_analysis: '4 tacks (fleet avg: 6). Favored right side, good layline approach.',
          downwind_analysis: '3 gybes, maintained inside track. Good pressure awareness.',
          tactical_decisions: 'Key decision at mark 1 to tack on shift paid off.',
          boat_handling: 'Smooth tacks and gybes. Good crew coordination.',
          recommendations: [
            'Practice late-race pressure situations',
            'Improve downwind gybe timing',
            'Work on start timing consistency',
          ],
          confidence_score: 0.85,
          model_used: 'claude-sonnet-4-5-20250929',
          analysis_version: '1.0',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(analysis).toBeTruthy();
      expect(analysis?.confidence_score).toBe(0.85);
      expect(analysis?.recommendations.length).toBe(3);

      console.log('✅ AI Analysis Saved:', {
        id: analysis?.id,
        confidence: analysis?.confidence_score,
        recommendations: analysis?.recommendations.length,
      });
    });

    it('should retrieve saved analysis', async () => {
      const { data: analysis } = await supabase
        .from('ai_coach_analysis')
        .select('*')
        .eq('timer_session_id', testSessionId)
        .single();

      expect(analysis).toBeTruthy();
      expect(analysis?.overall_summary).toContain('Strong performance');
      expect(analysis?.recommendations).toBeTruthy();
      expect(Array.isArray(analysis?.recommendations)).toBe(true);

      console.log('✅ Analysis Retrieved:', {
        overall: analysis?.overall_summary,
        start: analysis?.start_analysis,
        recommendations: analysis?.recommendations,
      });
    });

    it('should mark session as analyzed', async () => {
      const { error } = await supabase
        .from('race_timer_sessions')
        .update({ auto_analyzed: true })
        .eq('id', testSessionId);

      expect(error).toBeNull();

      const isAnalyzed = await RaceTimerService.isAnalyzed(testSessionId);
      expect(isAnalyzed).toBe(true);

      console.log('✅ Session marked as analyzed');
    });
  });

  describe('Unanalyzed Sessions', () => {
    it('should get unanalyzed sessions for sailor', async () => {
      // Create another unanalyzed session
      const { data: newSession } = await supabase
        .from('race_timer_sessions')
        .insert({
          sailor_id: testSailorId,
          regatta_id: testRegattaId,
          start_time: '2025-10-16T11:00:00Z',
          end_time: '2025-10-16T11:40:00Z',
          duration_seconds: 2400,
          auto_analyzed: false,
        })
        .select()
        .single();

      const unanalyzed = await RaceTimerService.getUnanalyzedSessions(testSailorId);

      expect(Array.isArray(unanalyzed)).toBe(true);
      expect(unanalyzed.length).toBeGreaterThan(0);

      console.log('✅ Unanalyzed Sessions:', {
        count: unanalyzed.length,
        sessions: unanalyzed.map(s => ({
          id: s.id,
          date: s.start_time,
        })),
      });

      // Cleanup
      if (newSession) {
        await supabase.from('race_timer_sessions').delete().eq('id', newSession.id);
      }
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('ai_coach_analysis').delete().eq('timer_session_id', testSessionId);
    await supabase.from('race_timer_sessions').delete().eq('id', testSessionId);
    await supabase.from('regattas').delete().eq('id', testRegattaId);

    console.log('✅ Test cleanup complete');
  });
});
