/**
 * Mock Racing Data Service
 *
 * Generates realistic mock data for racing console demos and testing.
 * Simulates environmental conditions, tactical zones, and AI recommendations.
 */

import type {
  Position,
  Wind,
  Current,
  Tide,
  Depth,
  Course,
  Fleet,
  TacticalZone,
  AIChip
} from '@/stores/raceConditionsStore';

/**
 * Hong Kong Sailing Venue
 */
const HONG_KONG_VENUE = {
  center: { latitude: 22.28, longitude: 114.15 },
  name: 'Victoria Harbour',
  waterDepth: 12.5,
  tidalRange: 2.1
};

/**
 * Generate mock position data
 */
export function generateMockPosition(): Position {
  return {
    latitude: HONG_KONG_VENUE.center.latitude + (Math.random() - 0.5) * 0.01,
    longitude: HONG_KONG_VENUE.center.longitude + (Math.random() - 0.5) * 0.01,
    speed: 5 + Math.random() * 2, // 5-7 knots
    heading: 45 + (Math.random() - 0.5) * 20, // ~45° with variation
    timestamp: new Date()
  };
}

/**
 * Generate mock wind data
 */
export function generateMockWind(): Wind {
  const baseSpeed = 12;
  const baseDirection = 45;
  const trueSpeed = baseSpeed + (Math.random() - 0.5) * 4; // 10-14 knots
  const trueDirection = baseDirection + (Math.random() - 0.5) * 20; // ~45° with shifts

  return {
    trueSpeed,
    trueDirection,
    apparentSpeed: trueSpeed * 0.85, // Approximate AWS
    apparentAngle: 30 + (Math.random() - 0.5) * 10, // ~30° AWA
    forecast: [
      {
        time: new Date(Date.now() + 5 * 60 * 1000),
        speed: baseSpeed + (Math.random() - 0.5) * 3,
        direction: baseDirection + (Math.random() - 0.5) * 15,
        confidence: 'high' as const
      },
      {
        time: new Date(Date.now() + 10 * 60 * 1000),
        speed: baseSpeed + (Math.random() - 0.5) * 3,
        direction: baseDirection + (Math.random() - 0.5) * 15,
        confidence: 'moderate' as const
      }
    ]
  };
}

/**
 * Generate mock current data
 */
export function generateMockCurrent(): Current {
  const baseSpeed = 1.2;
  const baseDirection = 180; // Opposing wind
  const currentSpeed = baseSpeed + (Math.random() - 0.5) * 0.6; // 0.9-1.5 knots

  return {
    speed: currentSpeed,
    direction: baseDirection + (Math.random() - 0.5) * 30,
    phase: currentSpeed > 1.0 ? 'flood' : currentSpeed < 0.3 ? 'slack' : 'ebb',
    strength: currentSpeed > 1.2 ? 'strong' : currentSpeed > 0.6 ? 'moderate' : 'weak',
    trend: currentSpeed > baseSpeed ? 'rising' : currentSpeed < baseSpeed - 0.3 ? 'falling' : 'slack',
    predictions: [
      {
        time: new Date(Date.now() + 5 * 60 * 1000),
        speed: baseSpeed + (Math.random() - 0.5) * 0.4,
        direction: baseDirection + (Math.random() - 0.5) * 20,
        phase: 'flood' as const
      },
      {
        time: new Date(Date.now() + 10 * 60 * 1000),
        speed: baseSpeed - 0.2 + Math.random() * 0.3, // Slowing
        direction: baseDirection + (Math.random() - 0.5) * 20,
        phase: 'ebb' as const
      },
      {
        time: new Date(Date.now() + 15 * 60 * 1000),
        speed: baseSpeed - 0.4 + Math.random() * 0.2, // Near slack
        direction: baseDirection + (Math.random() - 0.5) * 40,
        phase: 'slack' as const
      }
    ]
  };
}

/**
 * Generate mock tide data
 */
export function generateMockTide(): Tide {
  const now = new Date();
  const height = 1.2 + Math.random() * 0.3; // 1.2-1.5m (mid-tide)
  const rate = -0.3 + Math.random() * 0.1; // Falling tide

  return {
    height,
    trend: rate < -0.1 ? 'falling' : rate > 0.1 ? 'rising' : 'slack',
    rate,
    nextHigh: { time: new Date(now.getTime() + 5 * 60 * 60 * 1000), height: 2.1 }, // 5 hours
    nextLow: { time: new Date(now.getTime() + 2 * 60 * 60 * 1000), height: 0.3 }, // 2 hours
    range: 2.1, // Hong Kong typical range
    coefficient: 0.75 // Mid-range tidal coefficient
  };
}

/**
 * Generate mock depth data
 */
export function generateMockDepth(): Depth {
  const baseDepth = 12.5;
  const currentDepth = baseDepth + (Math.random() - 0.5) * 2;
  const minimumDepth = baseDepth - 3 + Math.random() * 1; // Shoaling ahead
  const draft = 2.5; // Typical boat draft

  return {
    current: currentDepth,
    minimum: minimumDepth,
    trend: -0.2 + Math.random() * 0.1, // m/min - slightly shoaling
    clearance: currentDepth - draft, // meters above keel
    forecast: [
      {
        time: new Date(Date.now() + 5 * 60 * 1000),
        location: { lat: 22.28 + 0.002, lng: 114.15 + 0.001 },
        depth: baseDepth - 1 + (Math.random() - 0.5) * 1,
        warning: 'safe' as const
      },
      {
        time: new Date(Date.now() + 10 * 60 * 1000),
        location: { lat: 22.28 + 0.004, lng: 114.15 + 0.002 },
        depth: baseDepth - 1.5 + (Math.random() - 0.5) * 1,
        warning: 'caution' as const
      },
      {
        time: new Date(Date.now() + 15 * 60 * 1000),
        location: { lat: 22.28 + 0.006, lng: 114.15 + 0.003 },
        depth: baseDepth - 0.5 + (Math.random() - 0.5) * 1, // Deepening again
        warning: 'safe' as const
      }
    ]
  };
}

/**
 * Generate mock course data
 */
export function generateMockCourse(): Course {
  const center = HONG_KONG_VENUE.center;

  return {
    id: 'course-olympic-triangle-hk',
    name: 'Olympic Triangle',
    startLine: {
      port: {
        latitude: center.latitude - 0.002,
        longitude: center.longitude - 0.001
      },
      starboard: {
        latitude: center.latitude - 0.002,
        longitude: center.longitude + 0.001
      },
      centerLat: center.latitude - 0.002,
      centerLon: center.longitude,
      heading: 45,
      length: 150
    },
    marks: [
      {
        id: 'mark-windward',
        name: 'Windward Mark',
        position: {
          lat: center.latitude + 0.01,
          lng: center.longitude
        },
        type: 'windward',
        rounding: 'port'
      },
      {
        id: 'mark-leeward-port',
        name: 'Leeward Gate - Port',
        position: {
          lat: center.latitude - 0.005,
          lng: center.longitude - 0.003
        },
        type: 'leeward',
        rounding: 'starboard'
      },
      {
        id: 'mark-leeward-stbd',
        name: 'Leeward Gate - Starboard',
        position: {
          lat: center.latitude - 0.005,
          lng: center.longitude + 0.003
        },
        type: 'leeward',
        rounding: 'starboard'
      }
    ],
    legs: [
      {
        id: 'leg-1',
        name: 'Beat to Windward',
        from: 'mark-start',
        to: 'mark-windward',
        type: 'upwind',
        distance: 1.2,
        heading: 45,
        estimatedTime: 15
      },
      {
        id: 'leg-2',
        name: 'Run to Leeward',
        from: 'mark-windward',
        to: 'mark-leeward-port',
        type: 'downwind',
        distance: 1.2,
        heading: 225,
        estimatedTime: 12
      }
    ],
    distance: 5.2,
    laps: 3
  };
}

/**
 * Generate mock fleet data
 */
export function generateMockFleet(): Fleet {
  const boats = [];
  const center = HONG_KONG_VENUE.center;

  for (let i = 0; i < 12; i++) {
    boats.push({
      id: `boat-${i}`,
      name: `Competitor ${i + 1}`,
      sail: `HKG ${1000 + i}`,
      position: {
        lat: center.latitude + (Math.random() - 0.5) * 0.005,
        lng: center.longitude + (Math.random() - 0.5) * 0.005
      },
      speed: 5 + Math.random() * 3,
      heading: 40 + (Math.random() - 0.5) * 30,
      isUser: i === 0 // First boat is user
    });
  }

  return {
    boats
  };
}

/**
 * Generate mock tactical zones
 */
export function generateMockTacticalZones(): TacticalZone[] {
  const center = HONG_KONG_VENUE.center;

  return [
    // Relief lane on port side
    {
      id: 'zone-relief-1',
      type: 'relief',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [center.longitude - 0.004, center.latitude - 0.001],
          [center.longitude - 0.004, center.latitude + 0.008],
          [center.longitude - 0.002, center.latitude + 0.008],
          [center.longitude - 0.002, center.latitude - 0.001],
          [center.longitude - 0.004, center.latitude - 0.001]
        ]]
      },
      properties: {
        name: 'Port Relief Lane',
        description: 'Favorable current corridor along western shore',
        advantage: '+2.5 BL',
        confidence: 'high' as const,
        validTime: {
          start: new Date(),
          end: new Date(Date.now() + 30 * 60 * 1000)
        }
      }
    },
    // Acceleration zone mid-course
    {
      id: 'zone-accel-1',
      type: 'acceleration',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [center.longitude - 0.001, center.latitude + 0.003],
          [center.longitude - 0.001, center.latitude + 0.006],
          [center.longitude + 0.002, center.latitude + 0.006],
          [center.longitude + 0.002, center.latitude + 0.003],
          [center.longitude - 0.001, center.latitude + 0.003]
        ]]
      },
      properties: {
        name: 'Mid-Course Acceleration',
        description: 'Current accelerates through channel constriction',
        advantage: '+1.8 BL',
        confidence: 'moderate' as const,
        validTime: {
          start: new Date(),
          end: new Date(Date.now() + 45 * 60 * 1000)
        }
      }
    },
    // Shear boundary starboard side
    {
      id: 'zone-shear-1',
      type: 'shear',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [center.longitude + 0.003, center.latitude],
          [center.longitude + 0.003, center.latitude + 0.007],
          [center.longitude + 0.004, center.latitude + 0.007],
          [center.longitude + 0.004, center.latitude],
          [center.longitude + 0.003, center.latitude]
        ]]
      },
      properties: {
        name: 'Starboard Shear',
        description: 'Current direction changes abruptly - use with caution',
        advantage: 'Variable',
        confidence: 'moderate' as const,
        validTime: {
          start: new Date(),
          end: new Date(Date.now() + 20 * 60 * 1000)
        }
      }
    },
    // Lee-bow zone near windward mark
    {
      id: 'zone-leebow-1',
      type: 'lee-bow',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [center.longitude - 0.002, center.latitude + 0.008],
          [center.longitude - 0.002, center.latitude + 0.011],
          [center.longitude + 0.001, center.latitude + 0.011],
          [center.longitude + 0.001, center.latitude + 0.008],
          [center.longitude - 0.002, center.latitude + 0.008]
        ]]
      },
      properties: {
        name: 'Windward Lee-Bow',
        description: 'Optimal zone to lee-bow port tackers approaching mark',
        advantage: '+3.0 BL',
        confidence: 'high' as const,
        validTime: {
          start: new Date(Date.now() + 8 * 60 * 1000),
          end: new Date(Date.now() + 15 * 60 * 1000)
        }
      }
    },
    // Anchoring zone (minimal current)
    {
      id: 'zone-anchor-1',
      type: 'anchoring',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [center.longitude, center.latitude + 0.001],
          [center.longitude, center.latitude + 0.004],
          [center.longitude + 0.002, center.latitude + 0.004],
          [center.longitude + 0.002, center.latitude + 0.001],
          [center.longitude, center.latitude + 0.001]
        ]]
      },
      properties: {
        name: 'Calm Pocket',
        description: 'Minimal current - maintain height easily',
        advantage: '0 BL (stable)',
        confidence: 'moderate' as const,
        validTime: {
          start: new Date(),
          end: new Date(Date.now() + 60 * 60 * 1000)
        }
      }
    }
  ];
}

/**
 * Generate mock AI recommendations
 */
export function generateMockAIChips(): AIChip[] {
  return [
    {
      id: 'chip-1',
      type: 'opportunity',
      priority: 'high',
      title: 'Favor Port Side',
      theory: 'Relief lane along western shore provides 2-3 boat length advantage due to favorable eddy current.',
      execution: 'Tack onto port soon after start. Sail close to shore boundary to maximize current benefit. Exit relief lane at mid-point to layline.',
      timing: 'Next 10 minutes',
      confidence: 0.85,
      isPinned: false,
      timestamp: new Date()
    },
    {
      id: 'chip-2',
      type: 'caution',
      priority: 'medium',
      title: 'Avoid Starboard Shear',
      theory: 'Current direction changes abruptly on starboard side creating unfavorable conditions and unpredictable boat handling.',
      execution: 'If forced right, stay outside the shear boundary. Tack back to center as soon as possible. Extra crew communication needed.',
      timing: 'Throughout leg',
      confidence: 0.7,
      isPinned: false,
      timestamp: new Date()
    },
    {
      id: 'chip-3',
      type: 'strategic',
      priority: 'high',
      title: 'Lee-Bow Setup at Mark',
      theory: 'Current vector creates ideal lee-bow opportunity for port-tack approach to windward mark.',
      execution: 'Time your final approach to arrive on port tack 8-12 minutes from now. Position to cross ahead of starboard tackers with current pushing you up.',
      timing: '8-12 minutes',
      confidence: 0.9,
      isPinned: true,
      timestamp: new Date()
    },
    {
      id: 'chip-4',
      type: 'alert',
      priority: 'medium',
      title: 'Slack Water Window',
      theory: 'Current transitioning to slack water in 18 minutes. Tactical zones will shift significantly.',
      execution: 'Plan to complete first beat before slack. If delayed, expect relief lane advantage to diminish and shear boundary to become more volatile.',
      timing: '15-20 minutes',
      confidence: 0.75,
      isPinned: false,
      timestamp: new Date()
    },
    {
      id: 'chip-5',
      type: 'opportunity',
      priority: 'low',
      title: 'Acceleration Zone Mid-Course',
      theory: 'Channel constriction creates local current acceleration providing speed boost.',
      execution: 'Route through center of course to capture 1-2 boat length advantage. Trade slight VMG loss for current boost.',
      timing: 'Next 15 minutes',
      confidence: 0.75,
      isPinned: false,
      timestamp: new Date()
    }
  ];
}

/**
 * Generate complete mock racing scenario
 */
export function generateMockRacingScenario() {
  return {
    position: generateMockPosition(),
    wind: generateMockWind(),
    current: generateMockCurrent(),
    tide: generateMockTide(),
    depth: generateMockDepth(),
    course: generateMockCourse(),
    fleet: generateMockFleet(),
    tacticalZones: generateMockTacticalZones(),
    aiChips: generateMockAIChips(),
    timestamp: new Date()
  };
}

/**
 * Simulate live data updates
 */
export function createLiveDataSimulator(
  updateCallback: (data: ReturnType<typeof generateMockRacingScenario>) => void,
  intervalMs: number = 5000
) {
  const interval = setInterval(() => {
    updateCallback(generateMockRacingScenario());
  }, intervalMs);

  return () => clearInterval(interval);
}
