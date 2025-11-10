/**
 * Race Phase Detection Hook
 * Automatically detects current race phase based on time and GPS position
 */

import { useState, useEffect } from 'react';
import type { RacePhase } from '@/services/ai/SkillManagementService';

interface RacePhaseContext {
  phase: RacePhase;
  timeInPhase: number; // seconds
  nextPhase?: RacePhase;
  timeToNextPhase?: number; // seconds
  confidence: 'high' | 'medium' | 'low';
}

interface RaceData {
  startTime?: Date | string;
  currentPosition?: { lat: number; lon: number };
  course?: any;
  marks?: Array<{
    name: string;
    type: 'start' | 'windward' | 'leeward' | 'jibe' | 'finish';
    coordinates: { lat: number; lon: number };
  }>;
  heading?: number; // degrees
  speed?: number; // knots
}

/**
 * Hook to detect current race phase
 * Updates every second to track phase transitions
 */
export function useRacePhaseDetection(raceData: RaceData): RacePhaseContext {
  const [phase, setPhase] = useState<RacePhase>('pre-race');
  const [timeInPhase, setTimeInPhase] = useState(0);
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('medium');

  // Serialize raceData dependencies to prevent infinite loops
  const startTimeKey = raceData.startTime ? new Date(raceData.startTime).getTime() : null;
  const positionKey = raceData.currentPosition
    ? `${raceData.currentPosition.lat},${raceData.currentPosition.lon}`
    : null;
  const marksKey = raceData.marks
    ? JSON.stringify(raceData.marks.map(m => ({ name: m.name, type: m.type })))
    : null;

  useEffect(() => {
    const interval = setInterval(() => {
      const detected = detectPhase(raceData);

      if (detected.phase !== phase) {
        setPhase(detected.phase);
        setTimeInPhase(0);
        setConfidence(detected.confidence);
      } else {
        setTimeInPhase(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTimeKey, positionKey, marksKey, phase]);

  return {
    phase,
    timeInPhase,
    nextPhase: getNextPhase(phase),
    timeToNextPhase: estimateTimeToNextPhase(phase, raceData),
    confidence
  };
}

/**
 * Detect current race phase from race data
 */
function detectPhase(raceData: RaceData): { phase: RacePhase; confidence: 'high' | 'medium' | 'low' } {
  const now = new Date();
  const startTime = raceData.startTime ? new Date(raceData.startTime) : null;

  // No start time = pre-race planning
  if (!startTime) {
    return { phase: 'pre-race', confidence: 'high' };
  }

  const minutesToStart = (startTime.getTime() - now.getTime()) / 1000 / 60;

  // Pre-race planning (>10 min before start)
  if (minutesToStart > 10) {
    return { phase: 'pre-race', confidence: 'high' };
  }

  // Start sequence (10 min to 0)
  if (minutesToStart > 0) {
    return { phase: 'start-sequence', confidence: 'high' };
  }

  // After start - use GPS position if available
  if (raceData.currentPosition && raceData.marks && raceData.marks.length > 0) {
    return detectPhaseFromPosition(
      raceData.currentPosition,
      raceData.marks,
      raceData.heading,
      raceData.speed
    );
  }

  // Default to first beat if no GPS
  return { phase: 'first-beat', confidence: 'low' };
}

/**
 * Detect phase from GPS position relative to marks
 */
function detectPhaseFromPosition(
  position: { lat: number; lon: number },
  marks: Array<{ name: string; type: string; coordinates: { lat: number; lon: number } }>,
  heading?: number,
  speed?: number
): { phase: RacePhase; confidence: 'high' | 'medium' | 'low' } {
  // Find nearest mark
  const distancesToMarks = marks.map(mark => ({
    mark,
    distance: calculateDistance(position, mark.coordinates)
  }));

  distancesToMarks.sort((a, b) => a.distance - b.distance);
  const nearestMark = distancesToMarks[0];

  // Within 30 meters (~3 boat lengths) of a mark
  if (nearestMark.distance < 30) {
    if (nearestMark.mark.type === 'windward') {
      return { phase: 'weather-mark', confidence: 'high' };
    } else if (nearestMark.mark.type === 'leeward') {
      return { phase: 'leeward-mark', confidence: 'high' };
    } else if (nearestMark.mark.type === 'finish') {
      return { phase: 'finish', confidence: 'high' };
    }
  }

  // Determine if sailing upwind or downwind based on heading
  // This is simplified - real implementation would use true wind direction
  const windwardMark = marks.find(m => m.type === 'windward');
  const leewardMark = marks.find(m => m.type === 'leeward');

  if (!windwardMark || !leewardMark) {
    return { phase: 'first-beat', confidence: 'low' };
  }

  const distToWindward = calculateDistance(position, windwardMark.coordinates);
  const distToLeeward = calculateDistance(position, leewardMark.coordinates);

  // Closer to windward mark = sailing upwind
  if (distToWindward < distToLeeward) {
    // Check if this is first or final beat
    // For now, assume first beat if early in race
    return { phase: 'first-beat', confidence: 'medium' };
  } else {
    // Closer to leeward mark = sailing downwind
    // Determine if reaching or running based on heading
    // This is simplified - would need true wind angle
    if (heading !== undefined) {
      // If heading varies significantly, likely reaching
      // If heading relatively steady downwind, likely running
      return { phase: 'reaching', confidence: 'medium' };
    }
    return { phase: 'running', confidence: 'low' };
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(
  p1: { lat: number; lon: number },
  p2: { lat: number; lon: number }
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (p1.lat * Math.PI) / 180;
  const φ2 = (p2.lat * Math.PI) / 180;
  const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
  const Δλ = ((p2.lon - p1.lon) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Get next phase in race sequence
 */
function getNextPhase(current: RacePhase): RacePhase | undefined {
  const sequence: RacePhase[] = [
    'pre-race',
    'start-sequence',
    'first-beat',
    'weather-mark',
    'reaching',
    'leeward-mark',
    'final-beat',
    'finish'
  ];

  const currentIndex = sequence.indexOf(current);
  return sequence[currentIndex + 1];
}

/**
 * Estimate time to next phase
 * Returns time in seconds
 */
function estimateTimeToNextPhase(phase: RacePhase, raceData: RaceData): number | undefined {
  if (phase === 'pre-race' && raceData.startTime) {
    const startTime = new Date(raceData.startTime);
    return Math.max(0, (startTime.getTime() - Date.now()) / 1000);
  }

  if (phase === 'start-sequence' && raceData.startTime) {
    const startTime = new Date(raceData.startTime);
    return Math.max(0, (startTime.getTime() - Date.now()) / 1000);
  }

  // For other phases, would need GPS position and course layout
  // Simplified for now
  return undefined;
}

/**
 * Helper to get phase label for display
 */
export function getPhaseLabel(phase: RacePhase): string {
  const labels: Record<RacePhase, string> = {
    'pre-race': 'Pre-Race Planning',
    'start-sequence': 'Starting Soon',
    'first-beat': 'First Beat',
    'weather-mark': 'Weather Mark',
    'reaching': 'Reaching',
    'running': 'Running',
    'leeward-mark': 'Leeward Mark',
    'final-beat': 'Final Beat',
    'finish': 'Finish Line'
  };
  return labels[phase];
}

/**
 * Helper to format time remaining
 */
export function formatTimeRemaining(seconds?: number): string {
  if (seconds === undefined) return '';

  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (minutes < 60) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
