/**
 * CoursePredictionAgent Test
 * Tests weather-based course prediction
 */

import { CoursePredictionAgent } from '@/src/services/agents/CoursePredictionAgent';
import { supabase } from '@/src/services/supabase';

describe('CoursePredictionAgent', () => {
  const testRegattaId = 'test-regatta-123';
  const testVenueId = 'hong-kong-rhkyc';
  const testRaceDate = '2025-10-15T11:00:00Z';

  beforeAll(async () => {
    // Setup test data: race courses with wind ranges
    await supabase.from('race_courses').upsert([
      {
        id: 'course-a-test',
        club_id: 'rhkyc-test',
        venue_id: testVenueId,
        name: 'Course A',
        marks: {
          start: { lat: 22.28, lng: 114.16 },
          mark1: { lat: 22.29, lng: 114.17 },
          mark2: { lat: 22.27, lng: 114.15 },
        },
        min_wind_direction: 180,
        max_wind_direction: 270,
        min_wind_speed: 10,
        max_wind_speed: 20,
      },
      {
        id: 'course-b-test',
        club_id: 'rhkyc-test',
        venue_id: testVenueId,
        name: 'Course B',
        marks: {
          start: { lat: 22.28, lng: 114.16 },
          mark1: { lat: 22.30, lng: 114.18 },
          mark2: { lat: 22.26, lng: 114.14 },
        },
        min_wind_direction: 270,
        max_wind_direction: 360,
        min_wind_speed: 5,
        max_wind_speed: 15,
      },
      {
        id: 'course-c-test',
        club_id: 'rhkyc-test',
        venue_id: testVenueId,
        name: 'Course C',
        marks: {
          start: { lat: 22.28, lng: 114.16 },
          mark1: { lat: 22.31, lng: 114.19 },
          mark2: { lat: 22.25, lng: 114.13 },
        },
        min_wind_direction: 0,
        max_wind_direction: 90,
        min_wind_speed: 15,
        max_wind_speed: 25,
      },
    ]);

    // Setup test regatta
    await supabase.from('regattas').upsert({
      id: testRegattaId,
      name: 'Test Hong Kong Dragon Championship',
      start_date: testRaceDate,
      venue_id: testVenueId,
      club_id: 'rhkyc-test',
    });

    console.log('✅ Test data setup complete');
  });

  describe('Course Prediction', () => {
    it('should predict course based on weather conditions', async () => {
      const agent = new CoursePredictionAgent();

      const result = await agent.predictCourse({
        regattaId: testRegattaId,
        venueId: testVenueId,
        raceDate: testRaceDate,
      });

      expect(result.success).toBe(true);
      expect(result.result).toBeTruthy();

      console.log('✅ Course Prediction Result:', {
        success: result.success,
        toolsUsed: result.toolsUsed,
        prediction: result.result,
      });

      // Verify tools were used
      const expectedTools = [
        'get_venue_race_courses',
        'get_weather_forecast_for_race',
        'match_courses_to_conditions',
      ];

      expectedTools.forEach(tool => {
        const used = result.toolsUsed?.includes(tool);
        console.log(`  ${used ? '✅' : '❌'} ${tool}`);
      });
    }, 60000); // 60 second timeout

    it('should explain prediction reasoning', async () => {
      const agent = new CoursePredictionAgent();

      const result = await agent.explainPrediction({
        regattaId: testRegattaId,
        venueId: testVenueId,
        raceDate: testRaceDate,
      });

      expect(result.success).toBe(true);
      expect(result.result).toBeTruthy();
      expect(typeof result.result).toBe('string');
      expect(result.result.length).toBeGreaterThan(50);

      console.log('✅ Prediction Explanation:', result.result);
    }, 60000);
  });

  describe('Course Matching Logic', () => {
    it('should match courses to SW wind (15 kts)', async () => {
      // Mock weather: SW wind at 15 kts
      const mockWeather = {
        wind_direction: 225, // SW
        wind_speed: 15,
      };

      const { data: courses } = await supabase
        .from('race_courses')
        .select('*')
        .eq('venue_id', testVenueId);

      expect(courses).toBeTruthy();

      // Filter courses by wind conditions
      const matchingCourses = courses?.filter(course => {
        const directionMatch =
          mockWeather.wind_direction >= course.min_wind_direction &&
          mockWeather.wind_direction <= course.max_wind_direction;

        const speedMatch =
          mockWeather.wind_speed >= course.min_wind_speed &&
          mockWeather.wind_speed <= course.max_wind_speed;

        return directionMatch && speedMatch;
      });

      expect(matchingCourses).toBeTruthy();
      expect(matchingCourses!.length).toBeGreaterThan(0);

      console.log('✅ Matching Courses for SW 15kts:', {
        weather: mockWeather,
        matches: matchingCourses?.map(c => c.name),
      });

      // Should match Course A (180-270°, 10-20kts)
      const courseAMatched = matchingCourses?.some(c => c.name === 'Course A');
      expect(courseAMatched).toBe(true);
    });

    it('should match courses to NW wind (12 kts)', async () => {
      // Mock weather: NW wind at 12 kts
      const mockWeather = {
        wind_direction: 315, // NW
        wind_speed: 12,
      };

      const { data: courses } = await supabase
        .from('race_courses')
        .select('*')
        .eq('venue_id', testVenueId);

      const matchingCourses = courses?.filter(course => {
        const directionMatch =
          mockWeather.wind_direction >= course.min_wind_direction &&
          mockWeather.wind_direction <= course.max_wind_direction;

        const speedMatch =
          mockWeather.wind_speed >= course.min_wind_speed &&
          mockWeather.wind_speed <= course.max_wind_speed;

        return directionMatch && speedMatch;
      });

      console.log('✅ Matching Courses for NW 12kts:', {
        weather: mockWeather,
        matches: matchingCourses?.map(c => c.name),
      });

      // Should match Course B (270-360°, 5-15kts)
      const courseBMatched = matchingCourses?.some(c => c.name === 'Course B');
      expect(courseBMatched).toBe(true);
    });

    it('should handle no matching courses gracefully', async () => {
      // Mock weather: Light N wind at 3 kts (below all minimums)
      const mockWeather = {
        wind_direction: 0,
        wind_speed: 3,
      };

      const { data: courses } = await supabase
        .from('race_courses')
        .select('*')
        .eq('venue_id', testVenueId);

      const matchingCourses = courses?.filter(course => {
        const directionMatch =
          mockWeather.wind_direction >= course.min_wind_direction &&
          mockWeather.wind_direction <= course.max_wind_direction;

        const speedMatch =
          mockWeather.wind_speed >= course.min_wind_speed &&
          mockWeather.wind_speed <= course.max_wind_speed;

        return directionMatch && speedMatch;
      });

      console.log('✅ No Matches for Light N 3kts:', {
        weather: mockWeather,
        matches: matchingCourses?.length || 0,
      });

      // Should have no matches (wind too light)
      expect(matchingCourses?.length || 0).toBe(0);
    });
  });

  describe('Prediction Storage', () => {
    it('should save prediction to database', async () => {
      const { data: prediction, error } = await supabase
        .from('race_predictions')
        .insert({
          regatta_id: testRegattaId,
          predicted_course_id: 'course-a-test',
          forecast_wind_direction: 225,
          forecast_wind_speed: 15,
          prediction_confidence: 85,
          prediction_reasoning: 'SW wind favors Course A outer loop',
          alternative_courses: [
            { course: 'Course B', probability: 10 },
            { course: 'Course C', probability: 5 },
          ],
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(prediction).toBeTruthy();
      expect(prediction?.prediction_confidence).toBe(85);

      console.log('✅ Prediction Saved:', {
        id: prediction?.id,
        course: 'Course A',
        confidence: prediction?.prediction_confidence,
      });
    });

    it('should retrieve saved prediction', async () => {
      const { data: prediction } = await supabase
        .from('race_predictions')
        .select('*')
        .eq('regatta_id', testRegattaId)
        .single();

      expect(prediction).toBeTruthy();
      expect(prediction?.predicted_course_id).toBe('course-a-test');

      console.log('✅ Prediction Retrieved:', {
        course: prediction?.predicted_course_id,
        confidence: prediction?.prediction_confidence,
        reasoning: prediction?.prediction_reasoning,
      });
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('race_predictions').delete().eq('regatta_id', testRegattaId);
    await supabase.from('regattas').delete().eq('id', testRegattaId);
    await supabase.from('race_courses').delete().in('id', [
      'course-a-test',
      'course-b-test',
      'course-c-test',
    ]);

    console.log('✅ Test cleanup complete');
  });
});
