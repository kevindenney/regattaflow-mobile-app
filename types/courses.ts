/**
 * Course Types
 * TypeScript definitions for racing courses and marks
 */

export type CourseType =
  | 'windward_leeward'
  | 'triangle'
  | 'olympic'
  | 'trapezoid'
  | 'custom';

export type MarkType =
  | 'start'
  | 'windward'
  | 'leeward'
  | 'wing'
  | 'offset'
  | 'finish'
  | 'gate';

export type MarkColor =
  | 'red'
  | 'yellow'
  | 'green'
  | 'orange'
  | 'blue'
  | 'white'
  | 'black';

export type MarkShape =
  | 'sphere'
  | 'cylinder'
  | 'can'
  | 'nun'
  | 'triangle'
  | 'inflatable';

export interface Mark {
  id?: string;
  name: string;
  type: MarkType;
  latitude: number;
  longitude: number;
  color?: MarkColor;
  shape?: MarkShape;
  description?: string;
}

export interface CourseLayout {
  sequence: string[]; // Array of mark names in rounding order
  roundingInstructions?: {
    [markName: string]: 'port' | 'starboard' | 'either';
  };
  laps?: number;
  gates?: {
    [gateName: string]: {
      leftMark: string;
      rightMark: string;
    };
  };
}

export interface RaceCourse {
  id: string;
  club_id?: string;
  venue_id?: string;
  name: string;
  description?: string;
  course_type: CourseType;
  marks: Mark[];
  layout?: CourseLayout;
  min_wind_direction?: number;
  max_wind_direction?: number;
  min_wind_speed?: number;
  max_wind_speed?: number;
  typical_length_nm?: number;
  estimated_duration_minutes?: number;
  last_used_date?: string;
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface CourseFilterOptions {
  userId?: string;
  clubId?: string;
  venueId?: string;
  courseType?: CourseType;
  searchQuery?: string;
  windDirection?: number; // Filter courses suitable for this wind direction
  windSpeed?: number; // Filter courses suitable for this wind speed
}

export interface CourseValidation {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export interface CourseStats {
  totalLength: number; // nautical miles
  estimatedDuration: number; // minutes
  windAngles: {
    upwind: number[];
    downwind: number[];
  };
}

// Helper type for course scope in UI
export type CourseScope = 'personal' | 'club' | 'venue';
