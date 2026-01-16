import { addDays, subDays, format, setHours, setMinutes } from 'date-fns';

/**
 * Demo race data for the freemium guest experience
 * Two fully-populated demo races for exploration:
 * 1. Upcoming race (~3 days ahead) - shows pre-race preparation workflow
 * 2. Past race (~7 days ago) - shows results, AI analysis, performance data
 */

export interface DemoRaceWeather {
  wind_speed: number;
  wind_direction: string;
  wind_gusts: number;
  wave_height: number;
  temperature: number;
  conditions: string;
  pressure?: number;
  visibility?: string;
  forecast_hours?: Array<{
    time: string;
    wind_speed: number;
    wind_direction: string;
    wind_gusts: number;
    temperature: number;
  }>;
}

export interface DemoRaceTide {
  high_tide: string;
  low_tide: string;
  tidal_range: number;
  current_direction: string;
  current_speed: number;
  tide_chart?: Array<{
    time: string;
    height: number;
  }>;
}

export interface DemoRaceStrategy {
  overall_recommendation: string;
  start_strategy: {
    favored_end: 'pin' | 'boat' | 'middle';
    approach: string;
    risk_level: 'low' | 'medium' | 'high';
  };
  weather_strategy: string;
  tactical_notes: string[];
}

export interface DemoRaceResults {
  position: number;
  total_boats: number;
  elapsed_time: string;
  corrected_time: string;
  distance_sailed: number;
  average_speed: number;
  max_speed: number;
}

export interface DemoRaceAnalysis {
  overall_score: number;
  performance_summary: string;
  highlights: string[];
  areas_for_improvement: string[];
  speed_analysis: {
    upwind: { target: number; actual: number; delta: number };
    downwind: { target: number; actual: number; delta: number };
    reaching: { target: number; actual: number; delta: number };
  };
  tactical_analysis: {
    start: { grade: string; notes: string };
    mark_roundings: { grade: string; notes: string };
    strategy_execution: { grade: string; notes: string };
  };
  comparison_to_fleet: {
    beat_performance: string;
    reach_performance: string;
    run_performance: string;
  };
}

export interface DemoRaceChecklist {
  days_before: { completed: number; total: number };
  race_morning: { completed: number; total: number };
  on_water: { completed: number; total: number };
  post_race: { completed: number; total: number };
}

export interface DemoRaceWaypoint {
  name: string;
  lat: number;
  lng: number;
  order?: number;
}

export interface DemoRaceDocument {
  type: 'NOR' | 'SI' | 'COURSE' | 'OTHER';
  name: string;
  url: string;
}

/**
 * Demo boat data for sail selection and equipment features
 */
export interface DemoBoat {
  id: string;
  name: string;
  class_name: string;
  class_id: string;
  sail_number: string;
}

/**
 * Demo sail inventory item
 */
export interface DemoSailInventoryItem {
  id: string;
  boat_id: string;
  category: 'mainsail' | 'jib' | 'genoa' | 'spinnaker' | 'code_zero';
  custom_name?: string;
  manufacturer?: string;
  model?: string;
  condition_rating?: number;
  status: 'active' | 'retired' | 'repair';
  total_races_used?: number;
  last_used_date?: string;
}

/**
 * Demo boat for J/70 class (upcoming demo race)
 */
export const DEMO_BOAT_J70: DemoBoat = {
  id: 'demo-boat-j70',
  name: 'Velocity',
  class_name: 'J/70',
  class_id: 'demo-class-j70',
  sail_number: 'GBR 1234',
};

/**
 * Demo boat for IRC Class 3 (past demo race)
 */
export const DEMO_BOAT_IRC3: DemoBoat = {
  id: 'demo-boat-irc3',
  name: 'Midnight Runner',
  class_name: 'IRC Class 3',
  class_id: 'demo-class-irc3',
  sail_number: 'GBR 5678',
};

/**
 * Demo sail inventory for J/70
 */
export const DEMO_SAILS_J70: DemoSailInventoryItem[] = [
  {
    id: 'demo-sail-main-j70',
    boat_id: 'demo-boat-j70',
    category: 'mainsail',
    custom_name: 'Race Main',
    manufacturer: 'North Sails',
    model: '3Di RAW 760',
    condition_rating: 92,
    status: 'active',
    total_races_used: 45,
  },
  {
    id: 'demo-sail-jib-j70-1',
    boat_id: 'demo-boat-j70',
    category: 'jib',
    custom_name: 'Heavy Jib',
    manufacturer: 'North Sails',
    model: '3Di RAW 760',
    condition_rating: 88,
    status: 'active',
    total_races_used: 32,
  },
  {
    id: 'demo-sail-jib-j70-2',
    boat_id: 'demo-boat-j70',
    category: 'jib',
    custom_name: 'Light Jib',
    manufacturer: 'Quantum Sails',
    model: 'Fusion M',
    condition_rating: 95,
    status: 'active',
    total_races_used: 18,
  },
  {
    id: 'demo-sail-spi-j70-1',
    boat_id: 'demo-boat-j70',
    category: 'spinnaker',
    custom_name: 'A2 Runner',
    manufacturer: 'North Sails',
    model: 'A2',
    condition_rating: 85,
    status: 'active',
    total_races_used: 40,
  },
  {
    id: 'demo-sail-spi-j70-2',
    boat_id: 'demo-boat-j70',
    category: 'spinnaker',
    custom_name: 'A3 Reacher',
    manufacturer: 'Quantum Sails',
    model: 'A3',
    condition_rating: 90,
    status: 'active',
    total_races_used: 25,
  },
];

/**
 * Demo sail inventory for IRC Class 3
 */
export const DEMO_SAILS_IRC3: DemoSailInventoryItem[] = [
  {
    id: 'demo-sail-main-irc3',
    boat_id: 'demo-boat-irc3',
    category: 'mainsail',
    custom_name: 'Main #1',
    manufacturer: 'Doyle Sails',
    model: 'Stratis ICE',
    condition_rating: 85,
    status: 'active',
    total_races_used: 67,
  },
  {
    id: 'demo-sail-genoa-irc3-1',
    boat_id: 'demo-boat-irc3',
    category: 'genoa',
    custom_name: 'G1 Heavy',
    manufacturer: 'Doyle Sails',
    model: 'Stratis ICE',
    condition_rating: 82,
    status: 'active',
    total_races_used: 54,
  },
  {
    id: 'demo-sail-genoa-irc3-2',
    boat_id: 'demo-boat-irc3',
    category: 'genoa',
    custom_name: 'G2 Medium',
    manufacturer: 'North Sails',
    model: '3Di RAW',
    condition_rating: 90,
    status: 'active',
    total_races_used: 28,
  },
  {
    id: 'demo-sail-jib-irc3',
    boat_id: 'demo-boat-irc3',
    category: 'jib',
    custom_name: 'J3 Storm',
    manufacturer: 'Doyle Sails',
    model: 'Delta',
    condition_rating: 95,
    status: 'active',
    total_races_used: 12,
  },
  {
    id: 'demo-sail-spi-irc3-1',
    boat_id: 'demo-boat-irc3',
    category: 'spinnaker',
    custom_name: 'A1 Light Runner',
    manufacturer: 'North Sails',
    model: 'A1',
    condition_rating: 78,
    status: 'active',
    total_races_used: 45,
  },
  {
    id: 'demo-sail-spi-irc3-2',
    boat_id: 'demo-boat-irc3',
    category: 'spinnaker',
    custom_name: 'A2 Heavy Runner',
    manufacturer: 'Doyle Sails',
    model: 'A2',
    condition_rating: 88,
    status: 'active',
    total_races_used: 35,
  },
  {
    id: 'demo-sail-code0-irc3',
    boat_id: 'demo-boat-irc3',
    category: 'code_zero',
    custom_name: 'Code Zero',
    manufacturer: 'Quantum Sails',
    model: 'Fusion',
    condition_rating: 92,
    status: 'active',
    total_races_used: 22,
  },
];

/**
 * Get demo sails for a given demo boat ID
 */
export function getDemoSailsForBoat(boatId: string): DemoSailInventoryItem[] {
  if (boatId === DEMO_BOAT_J70.id) {
    return DEMO_SAILS_J70;
  }
  if (boatId === DEMO_BOAT_IRC3.id) {
    return DEMO_SAILS_IRC3;
  }
  return [];
}

/**
 * Check if a boat ID is a demo boat
 */
export function isDemoBoatId(boatId: string): boolean {
  return boatId === DEMO_BOAT_J70.id || boatId === DEMO_BOAT_IRC3.id;
}

export interface DemoRace {
  id: string;
  name: string;
  start_date: string;
  startTime: string;
  venue: string;
  latitude: number;
  longitude: number;
  race_type: 'fleet' | 'distance' | 'match' | 'team';
  status: 'upcoming' | 'in_progress' | 'completed';
  isDemo: true;
  /** Demo boat ID for equipment features */
  boat_id: string;
  /** Demo class ID for tuning features */
  class_id: string;
  metadata: {
    venue_name: string;
    class_name: string;
    expected_fleet_size?: number;
    course_type?: string;
    number_of_laps?: number;
    vhf_channel?: string;
    start_area_name?: string;
    start_area_description?: string;
    prohibited_areas?: Array<{ name: string; description: string }>;
    race_documents?: DemoRaceDocument[];
    entry_deadline?: string;
    entry_fees?: string;
    total_distance_nm?: number;
    time_limit_hours?: number;
    route_description?: string;
    route_waypoints?: DemoRaceWaypoint[];
    schedule?: Array<{
      date: string;
      time: string;
      event: string;
      location?: string;
      mandatory?: boolean;
    }>;
  };
  weather: DemoRaceWeather;
  tide: DemoRaceTide;
  strategy?: DemoRaceStrategy;
  results?: DemoRaceResults;
  analysis?: DemoRaceAnalysis;
  checklist: DemoRaceChecklist;
}

/**
 * Generate a 24-hour weather forecast starting from race time
 */
function generateForecastHours(baseDate: Date, baseWind: number, baseDir: string): DemoRaceWeather['forecast_hours'] {
  const hours: DemoRaceWeather['forecast_hours'] = [];
  const directions = ['SW', 'SW', 'SSW', 'SW', 'WSW', 'SW', 'SW', 'SSW'];

  for (let i = 0; i < 24; i++) {
    const time = setMinutes(setHours(baseDate, 6 + i), 0);
    // Add some variation to wind speed
    const variation = Math.sin(i / 4) * 3 + (Math.random() - 0.5) * 2;
    hours.push({
      time: format(time, 'HH:mm'),
      wind_speed: Math.round(baseWind + variation),
      wind_direction: directions[i % directions.length],
      wind_gusts: Math.round(baseWind + variation + 4 + Math.random() * 2),
      temperature: Math.round(16 + Math.sin(i / 6) * 3),
    });
  }
  return hours;
}

/**
 * Generate tide chart data for a day
 */
function generateTideChart(highTideTime: string, lowTideTime: string, range: number): DemoRaceTide['tide_chart'] {
  const chart: DemoRaceTide['tide_chart'] = [];
  const highHour = parseInt(highTideTime.split(':')[0]);
  const lowHour = parseInt(lowTideTime.split(':')[0]);

  for (let hour = 0; hour < 24; hour++) {
    // Simple sinusoidal tide model
    const phase = ((hour - highHour + 24) % 24) / 12.42 * Math.PI;
    const height = (range / 2) * Math.cos(phase) + (range / 2) + 0.5;
    chart.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      height: Math.round(height * 10) / 10,
    });
  }
  return chart;
}

/**
 * Creates the upcoming demo race (Cowes Week Day 3)
 * Adjusted to be 3 days from current date
 */
export function createUpcomingDemoRace(): DemoRace {
  const raceDate = addDays(new Date(), 3);
  const startDate = setMinutes(setHours(raceDate, 10), 30);

  return {
    id: 'demo-upcoming',
    name: 'Cowes Week Day 3 - Fleet Race',
    start_date: startDate.toISOString(),
    startTime: '10:30',
    venue: 'Cowes, Isle of Wight',
    latitude: 50.7604,
    longitude: -1.2986,
    race_type: 'fleet',
    status: 'upcoming',
    isDemo: true,
    boat_id: DEMO_BOAT_J70.id,
    class_id: DEMO_BOAT_J70.class_id,

    metadata: {
      venue_name: 'Royal Yacht Squadron, Cowes',
      class_name: 'J/70',
      expected_fleet_size: 24,
      course_type: 'Windward-Leeward',
      number_of_laps: 3,
      vhf_channel: 'Channel 72',
      start_area_name: 'Royal Yacht Squadron Line',
      start_area_description: 'Between RYS flagstaff and outer distance mark. Line is laid 090°-270° approximately 200m offshore.',
      total_distance_nm: 4.5,
      route_waypoints: [
        { name: 'Start/Finish Line', lat: 50.7604, lng: -1.2986, order: 1 },
        { name: 'Windward Mark', lat: 50.7750, lng: -1.2900, order: 2 },
        { name: 'Leeward Gate (Port)', lat: 50.7580, lng: -1.3000, order: 3 },
        { name: 'Leeward Gate (Starboard)', lat: 50.7580, lng: -1.2970, order: 4 },
      ],
      prohibited_areas: [
        { name: 'Cowes Harbour Entrance', description: 'Keep clear of commercial traffic in the main channel' },
        { name: 'East Cowes Marina', description: 'No sailing within 50m of marina entrance' },
      ],
      race_documents: [
        { type: 'NOR', name: 'Notice of Race', url: '#demo-nor' },
        { type: 'SI', name: 'Sailing Instructions', url: '#demo-si' },
        { type: 'COURSE', name: 'Course Chart', url: '#demo-course' },
      ],
      entry_deadline: addDays(new Date(), 1).toISOString(),
      entry_fees: '£150 per boat',
      schedule: [
        {
          date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
          time: '18:00',
          event: 'Registration & Measurement',
          location: 'Royal Yacht Squadron',
          mandatory: true,
        },
        {
          date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
          time: '09:00',
          event: 'Skippers Briefing',
          location: 'Royal Yacht Squadron Lawn',
          mandatory: true,
        },
        {
          date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
          time: '10:30',
          event: 'First Warning Signal',
          location: 'Cowes Roads',
          mandatory: false,
        },
        {
          date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
          time: '18:00',
          event: 'Prize Giving',
          location: 'Royal Yacht Squadron',
          mandatory: false,
        },
      ],
    },

    weather: {
      wind_speed: 14,
      wind_direction: 'SW',
      wind_gusts: 18,
      wave_height: 0.8,
      temperature: 16,
      conditions: 'Partly cloudy with good visibility',
      pressure: 1018,
      visibility: 'Good (>10nm)',
      forecast_hours: generateForecastHours(raceDate, 14, 'SW'),
    },

    tide: {
      high_tide: '08:45',
      low_tide: '15:20',
      tidal_range: 3.2,
      current_direction: 'E',
      current_speed: 1.2,
      tide_chart: generateTideChart('08:45', '15:20', 3.2),
    },

    strategy: {
      overall_recommendation: 'Favor the right side of the course on the first beat. The easterly current will push boats right, and a 15° right shift is expected around 11:00. Start at the pin end for clean air and immediate access to the right side.',
      start_strategy: {
        favored_end: 'pin',
        approach: 'Sail the line in the final minutes to gauge bias. The pin appears favored by 5-8°. Approach on port, tack to starboard with 90 seconds to go, and accelerate to hit the line at speed.',
        risk_level: 'medium',
      },
      weather_strategy: 'SW breeze expected to build throughout the morning from 12-14 kts to 16-18 kts by early afternoon. Plan for an increasing breeze and flatter water conditions as tide turns. Consider heavier crew weight for the later races.',
      tactical_notes: [
        'Current will push boats right on the upwind leg - use this to your advantage',
        'Expect a 15° right shift around 11:00 based on thermal development',
        'Tide turns favorable at low water (15:20) - be in phase with shifts',
        'Left side tends to get headed as sea breeze develops',
        'Mark roundings will be crowded - approach with speed and room',
      ],
    },

    checklist: {
      days_before: { completed: 8, total: 12 },
      race_morning: { completed: 0, total: 8 },
      on_water: { completed: 0, total: 6 },
      post_race: { completed: 0, total: 4 },
    },
  };
}

/**
 * Creates the past demo race (Round the Island Race)
 * Adjusted to be 7 days in the past with full results and analysis
 */
export function createPastDemoRace(): DemoRace {
  const raceDate = subDays(new Date(), 7);
  const startDate = setMinutes(setHours(raceDate, 6), 0);

  return {
    id: 'demo-past',
    name: 'Round the Island Race 2024',
    start_date: startDate.toISOString(),
    startTime: '06:00',
    venue: 'Cowes, Isle of Wight',
    latitude: 50.7604,
    longitude: -1.2986,
    race_type: 'distance',
    status: 'completed',
    isDemo: true,
    boat_id: DEMO_BOAT_IRC3.id,
    class_id: DEMO_BOAT_IRC3.class_id,

    metadata: {
      venue_name: 'Royal Yacht Squadron, Cowes',
      class_name: 'IRC Class 3',
      total_distance_nm: 50,
      time_limit_hours: 12,
      start_area_name: 'Royal Yacht Squadron Line',
      start_area_description: 'Mass start from Cowes Roads. Classes start at 5-minute intervals from 06:00.',
      route_description: 'Anti-clockwise circumnavigation of the Isle of Wight',
      prohibited_areas: [
        { name: 'Bembridge Harbour', description: 'Keep clear of harbour entrance and moorings' },
        { name: 'Nab Tower exclusion zone', description: '200m radius exclusion around Nab Tower' },
        { name: 'Needles Channel TSS', description: 'Observe traffic separation scheme rules' },
      ],
      route_waypoints: [
        { name: 'Start Line', lat: 50.7604, lng: -1.2986, order: 1 },
        { name: 'No Mans Land Fort', lat: 50.7400, lng: -1.0900, order: 2 },
        { name: 'Bembridge Ledge', lat: 50.6833, lng: -1.0667, order: 3 },
        { name: 'St. Catherine\'s Point', lat: 50.5756, lng: -1.2975, order: 4 },
        { name: 'The Needles', lat: 50.6617, lng: -1.5883, order: 5 },
        { name: 'Hurst Castle', lat: 50.7083, lng: -1.5500, order: 6 },
        { name: 'Finish Line', lat: 50.7604, lng: -1.2986, order: 7 },
      ],
      race_documents: [
        { type: 'NOR', name: 'Notice of Race', url: '#demo-nor' },
        { type: 'SI', name: 'Sailing Instructions', url: '#demo-si' },
      ],
      schedule: [
        {
          date: format(subDays(new Date(), 8), 'yyyy-MM-dd'),
          time: '17:00',
          event: 'Boat Registration',
          location: 'Royal Yacht Squadron',
          mandatory: true,
        },
        {
          date: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
          time: '04:30',
          event: 'Skippers Briefing',
          location: 'Royal Yacht Squadron',
          mandatory: true,
        },
        {
          date: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
          time: '06:00',
          event: 'First Start',
          location: 'Cowes Roads',
          mandatory: false,
        },
        {
          date: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
          time: '19:00',
          event: 'Prize Giving & Party',
          location: 'Cowes Yacht Haven',
          mandatory: false,
        },
      ],
    },

    weather: {
      wind_speed: 18,
      wind_direction: 'W',
      wind_gusts: 24,
      wave_height: 1.5,
      temperature: 14,
      conditions: 'Fresh breeze with building seas',
      pressure: 1012,
      visibility: 'Moderate (5-10nm)',
    },

    tide: {
      high_tide: '05:30',
      low_tide: '12:00',
      tidal_range: 3.8,
      current_direction: 'W',
      current_speed: 2.1,
    },

    results: {
      position: 8,
      total_boats: 42,
      elapsed_time: '6:34:22',
      corrected_time: '5:12:45',
      distance_sailed: 52.3,
      average_speed: 7.9,
      max_speed: 14.2,
    },

    analysis: {
      overall_score: 78,
      performance_summary: 'Strong overall performance in challenging conditions. Excellent start execution and tactical decision-making at key waypoints. Downwind legs were particularly strong, with VMG consistently above target. Some speed lost on the beat to Bembridge due to conservative tacking strategy.',
      highlights: [
        'Excellent start execution - crossed line at speed in clear air',
        'Good tactical decision to stay inshore at St. Catherine\'s Point',
        'Strong downwind VMG in the final leg back to Cowes (+4% vs target)',
        'Efficient mark roundings with minimal distance lost',
        'Good sail trim in the building breeze',
      ],
      areas_for_improvement: [
        'Lost 2 positions on the beat to Bembridge - consider more tacks to stay in pressure',
        'Could have been more aggressive at The Needles transition',
        'Spinnaker hoist at Bembridge was slow - practice drills needed',
        'Tidal gate timing at St. Catherine\'s was 15 minutes early',
      ],
      speed_analysis: {
        upwind: { target: 6.2, actual: 5.9, delta: -5 },
        downwind: { target: 8.5, actual: 8.8, delta: 4 },
        reaching: { target: 9.0, actual: 8.7, delta: -3 },
      },
      tactical_analysis: {
        start: { grade: 'A', notes: 'Clean start at favored pin end with excellent acceleration' },
        mark_roundings: { grade: 'B+', notes: 'Smooth roundings overall, minor hesitation at Bembridge mark' },
        strategy_execution: { grade: 'B', notes: 'Good overall execution but missed opportunity at right shift' },
      },
      comparison_to_fleet: {
        beat_performance: 'Top 25%',
        reach_performance: 'Top 15%',
        run_performance: 'Top 10%',
      },
    },

    checklist: {
      days_before: { completed: 12, total: 12 },
      race_morning: { completed: 8, total: 8 },
      on_water: { completed: 6, total: 6 },
      post_race: { completed: 4, total: 4 },
    },
  };
}

/**
 * Get both demo races with dates adjusted to current time
 */
export function getDemoRaces(): DemoRace[] {
  return [
    createUpcomingDemoRace(),
    createPastDemoRace(),
  ];
}

/**
 * Check if a race ID belongs to a demo race
 */
export function isDemoRaceId(raceId: string): boolean {
  return raceId === 'demo-upcoming' || raceId === 'demo-past';
}

/**
 * Demo season for guest users
 * Provides the same season context experience as authenticated users
 */
export interface DemoSeason {
  id: string;
  name: string;
  short_name: string;
  year: number;
  year_end?: number;
  start_date: string;
  end_date: string;
  status: 'active';
  summary: {
    regatta_count: number;
    total_races: number;
    completed_races: number;
    upcoming_races: number;
    user_standing?: {
      rank: number;
      total_entries: number;
      net_points: number;
      wins: number;
      podiums: number;
      best_finish: number;
    };
  };
}

/**
 * Creates the demo season for guest users
 * Shows a realistic sailing season with races
 */
export function createDemoSeason(): DemoSeason {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Season runs from October to March (typical UK winter series)
  const startDate = new Date(currentYear, 9, 1); // October 1
  const endDate = new Date(currentYear + 1, 2, 31); // March 31

  return {
    id: 'demo-season',
    name: `Winter Series ${currentYear}-${(currentYear + 1).toString().slice(2)}`,
    short_name: `Winter ${currentYear.toString().slice(2)}-${(currentYear + 1).toString().slice(2)}`,
    year: currentYear,
    year_end: currentYear + 1,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    status: 'active',
    summary: {
      regatta_count: 2,
      total_races: 2,
      completed_races: 1,
      upcoming_races: 1,
      user_standing: {
        rank: 8,
        total_entries: 42,
        net_points: 24,
        wins: 0,
        podiums: 1,
        best_finish: 3,
      },
    },
  };
}
