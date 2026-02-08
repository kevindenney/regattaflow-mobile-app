import { createLogger } from '@/lib/utils/logger';

/**
 * Course Template Service
 * AI-powered race course generation based on:
 * - Wind forecast at race time
 * - Racing area boundaries
 * - Boat class requirements
 */

export interface CourseTemplate {
  id: string;
  name: string;
  type: 'windward_leeward' | 'triangle' | 'olympic' | 'trapezoid';
  description: string;
  marks: CourseMark[];
  windOrientation: number; // degrees
  confidence: number; // 0-100
}

export interface CourseMark {
  name: string;
  type: 'windward' | 'leeward' | 'start_pin' | 'start_boat' | 'finish' | 'wing' | 'gate';
  latitude: number;
  longitude: number;
  color?: string;
  sequence_order: number;
}

export interface RacingAreaBounds {
  north: number;
  south: number;
  east: number;
  west: number;
  center: { lat: number; lng: number };
}

export interface WindForecast {
  direction: number; // degrees
  speed: number; // knots
  time: string;
  source: string;
}

export interface BoatClassRequirements {
  name: string;
  minWindwardDistance: number; // nautical miles
  minLeewardDistance: number; // nautical miles
  minMarkSeparation: number; // nautical miles
  preferredCourseTypes: string[];
}

const logger = createLogger('CourseTemplateService');
export class CourseTemplateService {
  /**
   * Generate course templates based on wind forecast and racing area
   */
  async generateTemplates(
    racingArea: RacingAreaBounds,
    windForecast: WindForecast,
    boatClass: string,
    raceStartTime: string
  ): Promise<CourseTemplate[]> {
    logger.debug('[CourseTemplateService] Generating templates...');
    logger.debug('Racing area:', racingArea);
    logger.debug('Wind forecast:', windForecast);
    logger.debug('Boat class:', boatClass);

    const templates: CourseTemplate[] = [];

    // Get boat class requirements
    const requirements = this.getBoatClassRequirements(boatClass);

    // Calculate area dimensions
    const areaDimensions = this.calculateAreaDimensions(racingArea);
    logger.debug('Area dimensions:', areaDimensions);

    // Generate Windward/Leeward template (most common)
    const wlTemplate = this.generateWindwardLeewardTemplate(
      racingArea,
      windForecast,
      requirements,
      areaDimensions
    );
    templates.push(wlTemplate);

    // Generate Triangle template
    const triangleTemplate = this.generateTriangleTemplate(
      racingArea,
      windForecast,
      requirements,
      areaDimensions
    );
    templates.push(triangleTemplate);

    // Generate Olympic/Trapezoid template for championship racing
    if (areaDimensions.length > requirements.minWindwardDistance * 2) {
      const olympicTemplate = this.generateOlympicTemplate(
        racingArea,
        windForecast,
        requirements,
        areaDimensions
      );
      templates.push(olympicTemplate);
    }

    return templates;
  }

  /**
   * Get boat class specific requirements
   */
  private getBoatClassRequirements(boatClass: string): BoatClassRequirements {
    // Standard distances in nautical miles
    const defaults: Record<string, BoatClassRequirements> = {
      Dragon: {
        name: 'Dragon',
        minWindwardDistance: 0.8,
        minLeewardDistance: 0.6,
        minMarkSeparation: 0.1,
        preferredCourseTypes: ['windward_leeward', 'triangle', 'olympic'],
      },
      '420': {
        name: '420',
        minWindwardDistance: 0.5,
        minLeewardDistance: 0.4,
        minMarkSeparation: 0.05,
        preferredCourseTypes: ['windward_leeward', 'triangle'],
      },
      Laser: {
        name: 'Laser',
        minWindwardDistance: 0.6,
        minLeewardDistance: 0.5,
        minMarkSeparation: 0.05,
        preferredCourseTypes: ['windward_leeward', 'trapezoid'],
      },
    };

    return (
      defaults[boatClass] ||
      defaults.Dragon || // Default to Dragon if unknown
      {
        name: boatClass,
        minWindwardDistance: 0.7,
        minLeewardDistance: 0.5,
        minMarkSeparation: 0.1,
        preferredCourseTypes: ['windward_leeward'],
      }
    );
  }

  /**
   * Calculate racing area dimensions
   */
  private calculateAreaDimensions(area: RacingAreaBounds): {
    width: number;
    length: number;
    area: number;
  } {
    // Convert lat/lng to approximate nautical miles
    const latDistance = (area.north - area.south) * 60; // 1 degree lat ≈ 60 NM
    const lngDistance =
      (area.east - area.west) * 60 * Math.cos((area.center.lat * Math.PI) / 180);

    return {
      width: lngDistance,
      length: latDistance,
      area: latDistance * lngDistance,
    };
  }

  /**
   * Generate Windward/Leeward course template
   */
  private generateWindwardLeewardTemplate(
    racingArea: RacingAreaBounds,
    wind: WindForecast,
    requirements: BoatClassRequirements,
    dimensions: { width: number; length: number }
  ): CourseTemplate {
    const windDirection = wind.direction;
    const marks: CourseMark[] = [];

    // Standard windward-leeward course layout:
    // Wind blows FROM windDirection, so upwind bearing = windDirection,
    // downwind bearing = windDirection + 180
    //
    // Start line perpendicular to wind:
    //   Port end (pin buoy, orange) - starboard end (committee boat)
    // Windward mark (orange) upwind
    // Leeward gate: two marks parallel to start line, slightly upwind of start
    // Finish mark (white) on start line, opposite side of committee boat

    const startLineBearing = (windDirection + 90) % 360; // perpendicular to wind
    const startLineHalfLength = 0.05; // ~100m half-width

    // Pin Buoy (port end of start line) - orange inflatable
    const pinPosition = this.calculateMarkPosition(
      racingArea.center,
      (startLineBearing + 180) % 360, // port side
      startLineHalfLength,
      windDirection
    );
    marks.push({
      name: 'Pin',
      type: 'start_pin',
      ...pinPosition,
      color: '#FF8C00', // Orange
      sequence_order: 1,
    });

    // Committee Boat (starboard end of start line)
    const committeePosition = this.calculateMarkPosition(
      racingArea.center,
      startLineBearing, // starboard side
      startLineHalfLength,
      windDirection
    );
    marks.push({
      name: 'Committee Boat',
      type: 'start_boat',
      ...committeePosition,
      color: '#1E3A5F', // Dark navy
      sequence_order: 2,
    });

    // Windward Mark - orange, upwind from center
    marks.push({
      name: 'Windward Mark',
      type: 'windward',
      ...this.calculateMarkPosition(
        racingArea.center,
        windDirection,
        requirements.minWindwardDistance,
        windDirection
      ),
      color: '#FF8C00', // Orange
      sequence_order: 3,
    });

    // Leeward Gate - two orange marks parallel to start line,
    // positioned slightly upwind of the start line (offset ~0.02 NM upwind)
    const gateCenter = this.calculateMarkPosition(
      racingArea.center,
      windDirection, // slightly upwind of start center
      0.02,
      windDirection
    );
    const gateHalfWidth = 0.03; // ~60m half-width

    // Leeward Gate Port
    marks.push({
      name: 'Gate Port',
      type: 'gate',
      ...this.calculateMarkPosition(
        { lat: gateCenter.latitude, lng: gateCenter.longitude },
        (startLineBearing + 180) % 360,
        gateHalfWidth,
        windDirection
      ),
      color: '#FF8C00', // Orange
      sequence_order: 4,
    });

    // Leeward Gate Starboard
    marks.push({
      name: 'Gate Starboard',
      type: 'gate',
      ...this.calculateMarkPosition(
        { lat: gateCenter.latitude, lng: gateCenter.longitude },
        startLineBearing,
        gateHalfWidth,
        windDirection
      ),
      color: '#FF8C00', // Orange
      sequence_order: 5,
    });

    // Finish Mark - white, on the starboard side beyond the committee boat
    marks.push({
      name: 'Finish',
      type: 'finish',
      ...this.calculateMarkPosition(
        racingArea.center,
        startLineBearing, // starboard side, past committee boat
        startLineHalfLength + 0.02, // slightly beyond committee boat
        windDirection
      ),
      color: '#FFFFFF', // White
      sequence_order: 6,
    });

    return {
      id: 'wl-' + Date.now(),
      name: 'Windward/Leeward',
      type: 'windward_leeward',
      description: `Classic windward/leeward course oriented to ${Math.round(
        wind.direction
      )}° wind at ${wind.speed} knots`,
      marks,
      windOrientation: windDirection,
      confidence: 95,
    };
  }

  /**
   * Generate Triangle course template
   */
  private generateTriangleTemplate(
    racingArea: RacingAreaBounds,
    wind: WindForecast,
    requirements: BoatClassRequirements,
    dimensions: { width: number; length: number }
  ): CourseTemplate {
    const windDirection = wind.direction;
    const marks: CourseMark[] = [];

    // Start line
    const startLineBearing = (windDirection + 90) % 360;

    marks.push({
      name: 'Start Pin',
      type: 'start_pin',
      ...this.calculateMarkPosition(
        racingArea.center,
        startLineBearing - 180,
        0.05,
        windDirection
      ),
      color: 'Orange',
      sequence_order: 1,
    });

    marks.push({
      name: 'Start Boat',
      type: 'start_boat',
      ...this.calculateMarkPosition(
        racingArea.center,
        startLineBearing,
        0.05,
        windDirection
      ),
      color: 'Blue',
      sequence_order: 2,
    });

    // Windward Mark
    marks.push({
      name: 'Windward Mark',
      type: 'windward',
      ...this.calculateMarkPosition(
        racingArea.center,
        windDirection,
        requirements.minWindwardDistance,
        windDirection
      ),
      color: 'Yellow',
      sequence_order: 3,
    });

    // Wing Mark (reaching leg)
    marks.push({
      name: 'Wing Mark',
      type: 'wing',
      ...this.calculateMarkPosition(
        racingArea.center,
        windDirection + 120,
        requirements.minWindwardDistance * 0.8,
        windDirection
      ),
      color: 'Green',
      sequence_order: 4,
    });

    // Leeward Mark
    marks.push({
      name: 'Leeward Mark',
      type: 'leeward',
      ...this.calculateMarkPosition(
        racingArea.center,
        windDirection + 180,
        requirements.minLeewardDistance,
        windDirection
      ),
      color: 'Red',
      sequence_order: 5,
    });

    return {
      id: 'triangle-' + Date.now(),
      name: 'Triangle',
      type: 'triangle',
      description: `Traditional triangle course with reaching leg, oriented to ${Math.round(
        wind.direction
      )}° wind`,
      marks,
      windOrientation: windDirection,
      confidence: 85,
    };
  }

  /**
   * Generate Olympic/Trapezoid course template
   */
  private generateOlympicTemplate(
    racingArea: RacingAreaBounds,
    wind: WindForecast,
    requirements: BoatClassRequirements,
    dimensions: { width: number; length: number }
  ): CourseTemplate {
    const windDirection = wind.direction;
    const marks: CourseMark[] = [];

    // Start line
    const startLineBearing = (windDirection + 90) % 360;

    marks.push({
      name: 'Start Pin',
      type: 'start_pin',
      ...this.calculateMarkPosition(
        racingArea.center,
        startLineBearing - 180,
        0.05,
        windDirection
      ),
      color: 'Orange',
      sequence_order: 1,
    });

    marks.push({
      name: 'Start Boat',
      type: 'start_boat',
      ...this.calculateMarkPosition(
        racingArea.center,
        startLineBearing,
        0.05,
        windDirection
      ),
      color: 'Blue',
      sequence_order: 2,
    });

    // Windward Mark
    marks.push({
      name: 'Windward Mark',
      type: 'windward',
      ...this.calculateMarkPosition(
        racingArea.center,
        windDirection,
        requirements.minWindwardDistance * 1.2,
        windDirection
      ),
      color: 'Yellow',
      sequence_order: 3,
    });

    // Wing Marks (trapezoid reaching legs)
    marks.push({
      name: 'Wing Mark 1',
      type: 'wing',
      ...this.calculateMarkPosition(
        racingArea.center,
        windDirection + 90,
        requirements.minWindwardDistance * 0.7,
        windDirection
      ),
      color: 'Green',
      sequence_order: 4,
    });

    marks.push({
      name: 'Wing Mark 2',
      type: 'wing',
      ...this.calculateMarkPosition(
        racingArea.center,
        windDirection - 90,
        requirements.minWindwardDistance * 0.7,
        windDirection
      ),
      color: 'Green',
      sequence_order: 5,
    });

    // Leeward Gate
    marks.push({
      name: 'Leeward Gate Port',
      type: 'gate',
      ...this.calculateMarkPosition(
        racingArea.center,
        windDirection + 180 - 10,
        requirements.minLeewardDistance,
        windDirection
      ),
      color: 'Red',
      sequence_order: 6,
    });

    marks.push({
      name: 'Leeward Gate Starboard',
      type: 'gate',
      ...this.calculateMarkPosition(
        racingArea.center,
        windDirection + 180 + 10,
        requirements.minLeewardDistance,
        windDirection
      ),
      color: 'Red',
      sequence_order: 7,
    });

    return {
      id: 'olympic-' + Date.now(),
      name: 'Olympic/Trapezoid',
      type: 'olympic',
      description: `Championship trapezoid course with reaching legs, oriented to ${Math.round(
        wind.direction
      )}° wind`,
      marks,
      windOrientation: windDirection,
      confidence: 90,
    };
  }

  /**
   * Calculate mark position based on bearing and distance from center
   */
  private calculateMarkPosition(
    center: { lat: number; lng: number },
    bearing: number,
    distanceNM: number,
    windDirection: number
  ): { latitude: number; longitude: number } {
    // Haversine "destination point" formula
    // Angular distance in radians = distance / Earth's radius (same units)
    const R = 3440.065; // Earth's radius in nautical miles
    const lat1 = (center.lat * Math.PI) / 180;
    const lon1 = (center.lng * Math.PI) / 180;
    const brng = (bearing * Math.PI) / 180;
    const distRad = distanceNM / R;

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distRad) +
        Math.cos(lat1) * Math.sin(distRad) * Math.cos(brng)
    );

    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(brng) * Math.sin(distRad) * Math.cos(lat1),
        Math.cos(distRad) - Math.sin(lat1) * Math.sin(lat2)
      );

    return {
      latitude: (lat2 * 180) / Math.PI,
      longitude: (lon2 * 180) / Math.PI,
    };
  }

  /**
   * Get weather forecast for race time
   * TODO: Integrate with real weather API (HKO, NOAA, etc.)
   */
  async getWindForecast(
    latitude: number,
    longitude: number,
    raceTime: string
  ): Promise<WindForecast> {
    // Placeholder - will integrate with WeatherAggregationService
    logger.debug('[CourseTemplateService] Getting wind forecast for race time:', raceTime);

    // Default: SW wind at 12 knots (common Hong Kong conditions)
    return {
      direction: 225, // SW
      speed: 12,
      time: raceTime,
      source: 'Placeholder',
    };
  }
}

export const courseTemplateService = new CourseTemplateService();
