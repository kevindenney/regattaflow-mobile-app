/**
 * useRaceCountdown - Shared countdown hook for race timing
 *
 * Extracted from RaceSummaryCard.tsx calculateCountdown().
 * Auto-updates every 60 seconds.
 *
 * Returns countdown data including days, hours, minutes,
 * temporal flags, and urgency color for visual display.
 */

import { useState, useEffect, useMemo } from 'react';
import { IOS_COLORS, REGATTA_SEMANTIC_COLORS } from '@/lib/design-tokens-ios';

// =============================================================================
// TYPES
// =============================================================================

export interface CountdownResult {
  /** Days remaining (or since race if isPast) */
  days: number;
  /** Hours remaining */
  hours: number;
  /** Minutes remaining */
  minutes: number;
  /** Whether the race date has passed */
  isPast: boolean;
  /** Whether the race is today */
  isToday: boolean;
  /** Whether the race is tomorrow */
  isTomorrow: boolean;
  /** Days since race completed (only when isPast) */
  daysSince: number;
  /** Urgency-based color from iOS system palette */
  urgencyColor: string;
  /** Human-readable countdown label */
  label: string;
}

// =============================================================================
// PURE FUNCTION (usable outside React)
// =============================================================================

/**
 * Calculate countdown to a race date/time.
 * Pure function — no React dependencies.
 */
export function calculateCountdown(date: string, startTime?: string): CountdownResult {
  const now = new Date();
  const raceDate = new Date(date);

  // Set start time if provided
  if (startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    raceDate.setHours(hours || 0, minutes || 0, 0, 0);
  }

  const diffMs = raceDate.getTime() - now.getTime();
  const isPast = diffMs < 0;

  const absDiffMs = Math.abs(diffMs);
  const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));

  // Days since race (for past races)
  const daysSince = isPast ? days : 0;

  // Check if today or tomorrow
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const raceDayStart = new Date(raceDate);
  raceDayStart.setHours(0, 0, 0, 0);

  const isToday = raceDayStart.getTime() === today.getTime();
  const isTomorrow = raceDayStart.getTime() === tomorrow.getTime();

  // Determine urgency color and label
  let urgencyColor: string;
  let label: string;

  if (isPast) {
    urgencyColor = IOS_COLORS.systemGray;
    label = daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince}d ago`;
  } else if (isToday && hours < 2) {
    urgencyColor = IOS_COLORS.systemRed;
    label = minutes < 60 ? `${minutes}m` : `${hours}h ${minutes}m`;
  } else if (isToday) {
    urgencyColor = IOS_COLORS.systemBlue;
    label = 'Today';
  } else if (isTomorrow) {
    urgencyColor = IOS_COLORS.systemBlue;
    label = 'Tomorrow';
  } else if (days <= 7) {
    urgencyColor = IOS_COLORS.systemBlue;
    label = `${days}d`;
  } else {
    urgencyColor = IOS_COLORS.systemBlue;
    label = `${days}d`;
  }

  return { days, hours, minutes, isPast, isToday, isTomorrow, daysSince, urgencyColor, label };
}

// =============================================================================
// REACT HOOK
// =============================================================================

/**
 * useRaceCountdown - Auto-updating countdown hook.
 *
 * @param date - Race date (ISO string)
 * @param startTime - Optional start time (HH:MM)
 * @param intervalMs - Update interval in ms (default: 60000 = 1 minute)
 */
export function useRaceCountdown(
  date: string | undefined,
  startTime?: string,
  intervalMs = 60_000,
): CountdownResult | null {
  const [tick, setTick] = useState(0);

  // Auto-update every intervalMs
  useEffect(() => {
    if (!date) return;

    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [date, intervalMs]);

  // Recalculate on each tick
  const result = useMemo(() => {
    if (!date) return null;
    return calculateCountdown(date, startTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, startTime, tick]);

  return result;
}
