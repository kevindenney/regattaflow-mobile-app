/**
 * Race Course Service
 * Manages race course data and course visualization
 */

import raceCoursesData from '@/data/race-courses.json';
import sailingLocations from '@/data/sailing-locations.json';

export interface CourseCoordinates {
  center?: [number, number];
  bounds?: {
    southwest: [number, number];
    northeast: [number, number];
  };
  marks?: { [markName: string]: [number, number] };
  checkpoints?: {
    name: string;
    coordinates: [number, number];
    rounding?: string;
    type?: string;
  }[];
  start?: [number, number];
  finish?: [number, number];
  waypoints?: {
    name: string;
    coordinates: [number, number];
    type: string;
  }[];
}

export interface RaceCourse {
  id: string;
  name: string;
  type: 'windward-leeward' | 'triangle' | 'coastal' | 'distance' | 'mixed';
  venue: string;
  region: string;
  description?: string;
  distance?: string;
  coordinates?: CourseCoordinates;
  conditions?: {
    wind?: string;
    current?: string;
    challenges?: string[];
  };
  timing?: string;
  clubs?: string[];
  classes?: string[];
  records?: { [key: string]: string };
  schedule?: string;
  characteristics?: string[];
  hazards?: string[];
  courses?: string[];
}

export interface StandardCourseConfiguration {
  type: string;
  description: string;
  variations?: { [key: string]: any };
  marks?: { [key: string]: any };
  tactics?: { [key: string]: string };
}

export class RaceCourseService {
  private courses: Map<string, RaceCourse> = new Map();
  private standardCourses: Map<string, StandardCourseConfiguration> = new Map();
  private coursesByVenue: Map<string, RaceCourse[]> = new Map();

  constructor() {
    this.initializeCourseData();
  }

  private initializeCourseData() {
    // Load standard course configurations
    Object.entries(raceCoursesData.standardCourses).forEach(([courseType, config]) => {
      this.standardCourses.set(courseType, config as StandardCourseConfiguration);
    });

    // Load venue-specific courses
    Object.entries(raceCoursesData.specificCourses).forEach(([venue, venueData]: [string, any]) => {
      const venueCourses: RaceCourse[] = [];

      Object.entries(venueData.courses).forEach(([courseId, courseData]: [string, any]) => {
        const course: RaceCourse = {
          id: courseId,
          venue,
          region: venueData.region,
          ...courseData as any
        };

        this.courses.set(courseId, course);
        venueCourses.push(course);
      });

      this.coursesByVenue.set(venue, venueCourses);
    });

  }

  /**
   * Get all race courses
   */
  getAllCourses(): RaceCourse[] {
    return Array.from(this.courses.values());
  }

  /**
   * Get course by ID
   */
  getCourseById(courseId: string): RaceCourse | null {
    return this.courses.get(courseId) || null;
  }

  /**
   * Get courses for a specific venue
   */
  getCoursesForVenue(venueId: string): RaceCourse[] {
    // First check direct venue courses
    const directCourses = this.coursesByVenue.get(venueId) || [];

    // Also check venue data for additional courses
    const venueData = (sailingLocations.venues as any)[venueId];
    const additionalCourses: RaceCourse[] = [];

    if (venueData?.racingFeatures) {
      Object.entries(venueData.racingFeatures).forEach(([featureId, featureData]: [string, any]) => {
        if (featureData.courseArea || featureData.startLine) {
          additionalCourses.push({
            id: `${venueId}-${featureId}`,
            name: featureId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            type: 'mixed' as const,
            venue: venueId,
            region: venueData.region || 'unknown',
            coordinates: {
              center: featureData.courseArea ? [
                (featureData.courseArea.southwest.longitude + featureData.courseArea.northeast.longitude) / 2,
                (featureData.courseArea.southwest.latitude + featureData.courseArea.northeast.latitude) / 2
              ] : undefined,
              bounds: featureData.courseArea ? {
                southwest: [featureData.courseArea.southwest.longitude, featureData.courseArea.southwest.latitude],
                northeast: [featureData.courseArea.northeast.longitude, featureData.courseArea.northeast.latitude]
              } : undefined,
              marks: featureData.startLine ? {
                start_committee_boat: [featureData.startLine.start.longitude, featureData.startLine.start.latitude],
                start_pin: [featureData.startLine.end.longitude, featureData.startLine.end.latitude]
              } : undefined
            },
            schedule: featureData.schedule,
            clubs: venueData.yachtClubs?.map((club: any) => club.id) || []
          });
        }
      });
    }

    return [...directCourses, ...additionalCourses];
  }

  /**
   * Get courses by type
   */
  getCoursesByType(type: string): RaceCourse[] {
    return Array.from(this.courses.values()).filter(course =>
      course.type === type
    );
  }

  /**
   * Get courses by region
   */
  getCoursesByRegion(region: string): RaceCourse[] {
    return Array.from(this.courses.values()).filter(course =>
      course.region === region
    );
  }

  /**
   * Get standard course configurations
   */
  getStandardCourses(): StandardCourseConfiguration[] {
    return Array.from(this.standardCourses.values());
  }

  /**
   * Get standard course by type
   */
  getStandardCourse(courseType: string): StandardCourseConfiguration | null {
    return this.standardCourses.get(courseType) || null;
  }

  /**
   * Search courses by name or description
   */
  searchCourses(query: string): RaceCourse[] {
    const searchTerm = query.toLowerCase();
    return Array.from(this.courses.values()).filter(course =>
      course.name.toLowerCase().includes(searchTerm) ||
      course.description?.toLowerCase().includes(searchTerm) ||
      course.venue.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get course marks for mapping
   */
  getCourseMarks(courseId: string): {
    id: string;
    name: string;
    coordinates: [number, number];
    type: 'start' | 'finish' | 'turning' | 'waypoint';
    color?: string;
  }[] {
    const course = this.courses.get(courseId);
    if (!course?.coordinates?.marks) return [];

    const marks: {
      id: string;
      name: string;
      coordinates: [number, number];
      type: 'start' | 'finish' | 'turning' | 'waypoint';
      color?: string;
    }[] = [];

    Object.entries(course.coordinates.marks as Record<string, [number, number]>).forEach(([markName, coords]) => {
      const markType =
        markName.includes('start') ? 'start' :
        markName.includes('finish') ? 'finish' :
        markName.includes('waypoint') ? 'waypoint' : 'turning';

      const color =
        markType === 'start' ? '#00FF00' :
        markType === 'finish' ? '#FF0000' :
        markType === 'waypoint' ? '#FFFF00' : '#FFA500';

      marks.push({
        id: `${courseId}-${markName}`,
        name: markName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        coordinates: [coords[0], coords[1]],
        type: markType,
        color
      });
    });

    return marks;
  }

  /**
   * Get course bounds for map centering
   */
  getCourseBounds(courseId: string): {
    southwest: [number, number];
    northeast: [number, number];
  } | null {
    const course = this.courses.get(courseId);

    if (course?.coordinates?.bounds) {
      return course.coordinates.bounds;
    }

    if (course?.coordinates?.marks) {
      // Calculate bounds from marks
      const coords = Object.values(course.coordinates.marks);
      const lngs = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);

      return {
        southwest: [Math.min(...lngs), Math.min(...lats)],
        northeast: [Math.max(...lngs), Math.max(...lats)]
      };
    }

    return null;
  }

  /**
   * Get course statistics
   */
  getCourseStatistics() {
    const stats = {
      totalCourses: this.courses.size,
      coursesByType: {} as { [key: string]: number },
      coursesByRegion: {} as { [key: string]: number },
      venuesWithCourses: this.coursesByVenue.size,
      averageMarksPerCourse: 0
    };

    let totalMarks = 0;

    this.courses.forEach(course => {
      stats.coursesByType[course.type] =
        (stats.coursesByType[course.type] || 0) + 1;

      stats.coursesByRegion[course.region] =
        (stats.coursesByRegion[course.region] || 0) + 1;

      if (course.coordinates?.marks) {
        totalMarks += Object.keys(course.coordinates.marks).length;
      }
    });

    stats.averageMarksPerCourse = Math.round(totalMarks / this.courses.size);

    return stats;
  }

  /**
   * Get courses for a specific yacht club
   */
  getCoursesForClub(clubId: string): RaceCourse[] {
    return Array.from(this.courses.values()).filter(course =>
      course.clubs?.includes(clubId)
    );
  }

  /**
   * Get signature races/courses
   */
  getSignatureCourses(): RaceCourse[] {
    return Array.from(this.courses.values()).filter(course =>
      course.name.toLowerCase().includes('around') ||
      course.name.toLowerCase().includes('hobart') ||
      course.name.toLowerCase().includes('race') ||
      course.distance && parseInt(course.distance) > 100
    );
  }

  /**
   * Get course recommendations based on conditions
   */
  getRecommendedCourses(conditions: {
    windSpeed?: number;
    windDirection?: number;
    venue?: string;
    experience?: 'beginner' | 'intermediate' | 'advanced';
  }): RaceCourse[] {
    let candidates = Array.from(this.courses.values());

    // Filter by venue if specified
    if (conditions.venue) {
      candidates = candidates.filter(course => course.venue === conditions.venue);
    }

    // Filter by experience level
    if (conditions.experience) {
      candidates = candidates.filter(course => {
        const isChallengingCourse =
          course.type === 'distance' ||
          course.hazards?.length > 0 ||
          course.conditions?.challenges?.length > 0;

        switch (conditions.experience) {
          case 'beginner':
            return course.type === 'windward-leeward' && !isChallengingCourse;
          case 'intermediate':
            return course.type !== 'distance' || !isChallengingCourse;
          case 'advanced':
            return true; // All courses available
          default:
            return true;
        }
      });
    }

    return candidates.slice(0, 5); // Return top 5 recommendations
  }

  /**
   * Get course hazards and safety information
   */
  getCourseHazards(courseId: string): string[] {
    const course = this.courses.get(courseId);
    return course?.hazards || [];
  }

  /**
   * Get course records
   */
  getCourseRecords(courseId: string): { [key: string]: string } {
    const course = this.courses.get(courseId);
    return course?.records || {};
  }
}
