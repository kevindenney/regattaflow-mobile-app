/**
 * Mock Data for RegattaFlow
 * Used to populate empty states for first-time users
 *
 * ⚠️ IMPORTANT: This is MOCK DATA with hardcoded values
 *
 * To get REAL weather and tide data:
 * 1. Use the `useRaceWeather` hook from @/hooks/useRaceWeather
 * 2. Pass a SailingVenue object and race date
 * 3. The hook automatically fetches real-time data from regional weather services:
 *    - Hong Kong → Hong Kong Observatory (HKO) - 93% reliability
 *    - North America → NOAA GFS/NAM
 *    - Europe → ECMWF, UK Met Office
 *    - Asia-Pacific → JMA, Hong Kong Observatory, Australian BOM
 *
 * Example usage:
 * ```typescript
 * import { useRaceWeather } from '@/hooks/useRaceWeather';
 *
 * const { weather, loading, error } = useRaceWeather(venue, raceDate);
 *
 * if (weather) {
 *   // Use real weather data
 *   <RaceCard wind={weather.wind} tide={weather.tide} />
 * } else {
 *   // Fallback to mock data
 *   <RaceCard wind={MOCK_RACES[0].wind} tide={MOCK_RACES[0].tide} />
 * }
 * ```
 */

export interface MockRace {
  id: string;
  name: string;
  venue: string;
  venueId?: string;
  date: string; // ISO date
  startTime: string;
  countdown: {
    days: number;
    hours: number;
    minutes: number;
  };
  wind: {
    direction: string;
    speedMin: number;
    speedMax: number;
  };
  tide: {
    state: 'flooding' | 'ebbing' | 'slack';
    height: number; // meters
    direction?: string;
  };
  strategy: string;
  critical_details?: {
    vhf_channel?: string;
    warning_signal?: string;
    first_start?: string;
  };
  // Phase 6: Race-Course-Boat Linking
  courseId?: string; // Links to MockCourse
  boatId?: string; // Links to MockBoat
}

export interface MockBoat {
  id: string;
  name: string;
  class: string;
  classId?: string;
  sailNumber: string;
  isPrimary: boolean;
  model3D?: string; // Path to 3D model file
  tuning: {
    shrouds: number; // tension units
    backstay: number;
    forestay: number; // mm
    mastButtPosition: number; // mm aft
  };
  equipment?: {
    hull_maker?: string;
    rig_maker?: string;
    sail_maker?: string;
  };
}

export interface MockCourse {
  id: string;
  name: string;
  venue: string;
  venueId?: string;
  courseType: 'windward_leeward' | 'olympic' | 'trapezoid' | 'coastal' | 'custom';
  marks: Array<{
    name: string;
    lat: number;
    lng: number;
  }>;
  windRange: {
    min: number; // knots
    max: number;
    preferredDirection?: number; // degrees
  };
  length: number; // nautical miles
  lastUsed?: string; // ISO date
}

// Phase 6: Helper interface for linked race data
export interface LinkedRaceData {
  race: MockRace;
  course?: MockCourse;
  boat?: MockBoat;
}

// ============================================================================
// MOCK RACES
// ============================================================================

export const MOCK_RACES: MockRace[] = [
  {
    id: 'mock-race-1',
    name: 'Hong Kong Dragon Championship',
    venue: 'Royal Hong Kong Yacht Club',
    venueId: 'rhkyc',
    date: '2025-10-15T10:00:00Z',
    startTime: '10:00',
    countdown: {
      days: 7,
      hours: 14,
      minutes: 23,
    },
    wind: {
      direction: 'NE',
      speedMin: 12,
      speedMax: 18,
    },
    tide: {
      state: 'flooding',
      height: 1.8,
      direction: 'N',
    },
    strategy: 'Start pin-favored 5°, favor right side 60%, tack on shifts >10°. Watch for current around Mark 1.',
    critical_details: {
      vhf_channel: '72',
      warning_signal: '09:55',
      first_start: '10:00',
    },
    // Phase 6: Linked to course and boat
    courseId: 'mock-course-1',
    boatId: 'mock-boat-1',
  },
  {
    id: 'mock-race-2',
    name: 'Autumn Series Race 3',
    venue: 'Aberdeen Boat Club',
    venueId: 'abc',
    date: '2025-10-20T14:00:00Z',
    startTime: '14:00',
    countdown: {
      days: 12,
      hours: 6,
      minutes: 45,
    },
    wind: {
      direction: 'SW',
      speedMin: 8,
      speedMax: 14,
    },
    tide: {
      state: 'ebbing',
      height: 1.2,
    },
    strategy: 'Left side pressure in SW breeze, watch current around Mark 1. Pin-end start likely.',
    critical_details: {
      vhf_channel: '77',
      warning_signal: '13:55',
      first_start: '14:00',
    },
    // Phase 6: Linked to different course and boat
    courseId: 'mock-course-2',
    boatId: 'mock-boat-2',
  },
  {
    id: 'mock-race-3',
    name: 'Mid-Winter Championship',
    venue: 'Victoria Harbour',
    venueId: 'vharbour',
    date: '2025-11-11T08:00:00Z',
    startTime: '08:00',
    countdown: {
      days: 34,
      hours: 10,
      minutes: 15,
    },
    wind: {
      direction: 'Variable',
      speedMin: 8,
      speedMax: 15,
    },
    tide: {
      state: 'slack',
      height: 1.0,
    },
    strategy: 'Variable conditions expected. Stay flexible with strategy, favor center of course.',
    critical_details: {
      vhf_channel: '68',
      warning_signal: '07:55',
      first_start: '08:00',
    },
    courseId: 'mock-course-1',
    boatId: 'mock-boat-1',
  },
];

// ============================================================================
// MOCK BOATS
// ============================================================================

export const MOCK_BOATS: MockBoat[] = [
  {
    id: 'mock-boat-1',
    name: 'Dragonfly',
    class: 'Dragon',
    classId: 'dragon',
    sailNumber: 'HKG 123',
    isPrimary: true,
    model3D: 'dragon-class-model.glb',
    tuning: {
      shrouds: 28, // units
      backstay: 32,
      forestay: 10800, // mm
      mastButtPosition: 50, // mm aft
    },
    equipment: {
      hull_maker: 'Petticrows',
      rig_maker: 'Selden',
      sail_maker: 'North Sails',
    },
  },
  {
    id: 'mock-boat-2',
    name: 'Blue Dragon',
    class: 'Dragon',
    classId: 'dragon',
    sailNumber: 'HKG 456',
    isPrimary: false,
    model3D: 'dragon-class-model.glb',
    tuning: {
      shrouds: 26,
      backstay: 30,
      forestay: 10750,
      mastButtPosition: 45,
    },
    equipment: {
      hull_maker: 'Borresens',
      rig_maker: 'Selden',
      sail_maker: 'Quantum',
    },
  },
];

// ============================================================================
// MOCK COURSES
// ============================================================================

export const MOCK_COURSES: MockCourse[] = [
  {
    id: 'mock-course-1',
    name: 'RHKYC Windward-Leeward',
    venue: 'Royal Hong Kong Yacht Club',
    venueId: 'rhkyc',
    courseType: 'windward_leeward',
    marks: [
      { name: 'Start Pin', lat: 22.2793, lng: 114.1628 },
      { name: 'Mark 1 (Windward)', lat: 22.285, lng: 114.165 },
      { name: 'Leeward Gate Left', lat: 22.278, lng: 114.162 },
      { name: 'Leeward Gate Right', lat: 22.278, lng: 114.164 },
      { name: 'Finish', lat: 22.2793, lng: 114.1628 },
    ],
    windRange: {
      min: 8,
      max: 18,
      preferredDirection: 45, // NE
    },
    length: 1.2, // nautical miles
    lastUsed: '2025-09-28',
  },
  {
    id: 'mock-course-2',
    name: 'ABC Olympic Triangle',
    venue: 'Aberdeen Boat Club',
    venueId: 'abc',
    courseType: 'olympic',
    marks: [
      { name: 'Start', lat: 22.245, lng: 114.155 },
      { name: 'Mark 1', lat: 22.252, lng: 114.158 },
      { name: 'Mark 2 (Offset)', lat: 22.251, lng: 114.16 },
      { name: 'Mark 3 (Leeward)', lat: 22.244, lng: 114.157 },
      { name: 'Finish', lat: 22.245, lng: 114.155 },
    ],
    windRange: {
      min: 10,
      max: 20,
      preferredDirection: 225, // SW
    },
    length: 1.8,
    lastUsed: '2025-10-01',
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate countdown from current time to race date
 */
export function calculateCountdown(raceDate: string): { days: number; hours: number; minutes: number } {
  const now = new Date();
  const race = new Date(raceDate);
  const diff = race.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
}

/**
 * Get mock data based on user's empty state
 */
export function getMockDataForUser(userId: string) {
  return {
    races: MOCK_RACES,
    boats: MOCK_BOATS,
    courses: MOCK_COURSES,
  };
}

/**
 * Phase 6: Get race with linked course and boat data
 */
export function getRaceWithLinks(raceId: string): LinkedRaceData | null {
  const race = MOCK_RACES.find((r) => r.id === raceId);
  if (!race) return null;

  const course = race.courseId ? MOCK_COURSES.find((c) => c.id === race.courseId) : undefined;
  const boat = race.boatId ? MOCK_BOATS.find((b) => b.id === race.boatId) : undefined;

  return {
    race,
    course,
    boat,
  };
}

/**
 * Phase 6: Get all races for a specific boat
 */
export function getRacesForBoat(boatId: string): MockRace[] {
  return MOCK_RACES.filter((r) => r.boatId === boatId);
}

/**
 * Phase 6: Get all races using a specific course
 */
export function getRacesForCourse(courseId: string): MockRace[] {
  return MOCK_RACES.filter((r) => r.courseId === courseId);
}
