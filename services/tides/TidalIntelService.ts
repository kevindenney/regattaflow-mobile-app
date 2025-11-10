import type { GeoLocation } from '@/lib/types/advanced-map';
import { StormGlassService } from '../weather/StormGlassService';

const DEFAULT_TIMEOUT = 10000;
const DEFAULT_RETRIES = 2;

export interface SlackWindow {
  isSlackNow: boolean;
  slackType: 'high' | 'low' | null;
  nextSlackTime: Date | null;
  minutesUntilSlack: number | null;
  windowStart: Date | null;
  windowEnd: Date | null;
}

export interface TideExtremeInfo {
  time: Date;
  minutesUntil: number;
  height: number;
}

export interface TideIntel {
  location: GeoLocation;
  fetchedAt: Date;
  current: {
    height: number;
    trend: 'rising' | 'falling' | 'slack';
    flow: 'flood' | 'ebb' | 'slack';
    speed: number;
    coefficient: number;
  };
  extremes: {
    nextHigh: TideExtremeInfo | null;
    nextLow: TideExtremeInfo | null;
  };
  slack: SlackWindow;
  range: number;
}

function createStormGlassClient(): StormGlassService | null {
  const apiKey =
    process.env.EXPO_PUBLIC_STORMGLASS_API_KEY ||
    process.env.STORMGLASS_API_KEY;

  if (!apiKey || apiKey === 'demo-key') {
    return null;
  }

  return new StormGlassService({
    apiKey,
    timeout: DEFAULT_TIMEOUT,
    retryAttempts: DEFAULT_RETRIES
  });
}

function minutesBetween(target: Date, reference: Date): number {
  return Math.round((target.getTime() - reference.getTime()) / (1000 * 60));
}

function buildExtremeInfo(target: Date | undefined, reference: Date, height?: number): TideExtremeInfo | null {
  if (!target) return null;

  return {
    time: target,
    minutesUntil: minutesBetween(target, reference),
    height: typeof height === 'number' ? Math.round(height * 10) / 10 : Number.NaN
  };
}

export class TidalIntelService {
  private stormGlass?: StormGlassService | null;

  constructor(stormGlassClient?: StormGlassService | null) {
    this.stormGlass = stormGlassClient ?? createStormGlassClient();
  }

  isConfigured(): boolean {
    return Boolean(this.stormGlass);
  }

  async getTideIntel(location: GeoLocation, referenceTime: Date = new Date()): Promise<TideIntel | null> {
    if (!this.stormGlass) {
      return null;
    }

    try {
      // Get tide extremes and current height from Storm Glass
      const [tideExtremes, currentHeight] = await Promise.all([
        this.stormGlass.getTideExtremes(location, 2), // Get 2 days of extremes
        this.stormGlass.getTideHeightAtTime(location, referenceTime)
      ]);

      return this.transformStormGlassTideData(tideExtremes, currentHeight, location, referenceTime);
    } catch (error) {
      console.error('[TidalIntelService] Failed to fetch tide intel from Storm Glass:', error);
      return null;
    }
  }

  private transformStormGlassTideData(
    tideExtremes: Array<{ type: 'high' | 'low'; time: Date; height: number }>,
    currentHeight: number,
    location: GeoLocation,
    referenceTime: Date
  ): TideIntel {
    // Find next high and low tides
    const futureExtremes = tideExtremes.filter(e => e.time > referenceTime);
    const nextHighExtreme = futureExtremes.find(e => e.type === 'high');
    const nextLowExtreme = futureExtremes.find(e => e.type === 'low');

    const nextHigh = nextHighExtreme ? buildExtremeInfo(nextHighExtreme.time, referenceTime, nextHighExtreme.height) : null;
    const nextLow = nextLowExtreme ? buildExtremeInfo(nextLowExtreme.time, referenceTime, nextLowExtreme.height) : null;

    // Calculate tide range from extremes
    const range = nextHigh && nextLow ? Math.abs(nextHigh.height - nextLow.height) : 2.0;

    // Determine trend based on which extreme is next
    const currentTrend: 'rising' | 'falling' | 'slack' =
      nextHigh && nextLow
        ? nextHigh.minutesUntil < nextLow.minutesUntil
          ? 'rising'
          : 'falling'
        : 'slack';

    const currentFlow: 'flood' | 'ebb' | 'slack' = currentTrend === 'rising' ? 'flood' : currentTrend === 'falling' ? 'ebb' : 'slack';

    // Estimate tide speed based on range and time to next extreme
    const minutesToNext = nextHigh ? nextHigh.minutesUntil : nextLow ? nextLow.minutesUntil : 360;
    const speed = range / (minutesToNext / 60); // meters per hour to knots (rough estimate)

    // Calculate tide coefficient (simplified)
    const coefficient = Math.min(120, Math.max(20, 70 + (range - 2.0) * 10));

    const slackInfo = this.calculateSlackWindow(referenceTime, nextHigh, nextLow);

    return {
      location,
      fetchedAt: referenceTime,
      current: {
        height: Math.round(currentHeight * 100) / 100,
        trend: currentTrend,
        flow: currentFlow,
        speed: Math.round(speed * 0.5 * 10) / 10, // Convert to knots (rough approximation)
        coefficient: Math.round(coefficient)
      },
      extremes: {
        nextHigh,
        nextLow
      },
      slack: slackInfo,
      range: Math.round(range * 10) / 10
    };
  }

  private calculateSlackWindow(
    referenceTime: Date,
    nextHigh: TideExtremeInfo | null,
    nextLow: TideExtremeInfo | null
  ): SlackWindow {
    const SLACK_BUFFER_MINUTES = 30;
    const SLACK_THRESHOLD_MINUTES = 15;

    // Determine if we're currently in slack period
    let isSlackNow = false;
    let nextSlackTime: Date | null = null;
    let slackType: 'high' | 'low' | null = null;

    const upcomingExtremes: Array<{ type: 'high' | 'low'; info: TideExtremeInfo }> = [
      ...(nextHigh ? [{ type: 'high' as const, info: nextHigh }] : []),
      ...(nextLow ? [{ type: 'low' as const, info: nextLow }] : [])
    ].filter(entry => entry.info.minutesUntil >= 0);

    if (upcomingExtremes.length > 0) {
      upcomingExtremes.sort((a, b) => a.info.minutesUntil - b.info.minutesUntil);
      const next = upcomingExtremes[0];

      // Check if we're within slack window of next extreme
      isSlackNow = next.info.minutesUntil <= SLACK_THRESHOLD_MINUTES;
      nextSlackTime = next.info.time;
      slackType = next.type;
    }

    const windowStart = nextSlackTime ? new Date(nextSlackTime.getTime() - SLACK_BUFFER_MINUTES * 60000) : null;
    const windowEnd = nextSlackTime ? new Date(nextSlackTime.getTime() + SLACK_BUFFER_MINUTES * 60000) : null;

    return {
      isSlackNow,
      slackType,
      nextSlackTime,
      minutesUntilSlack: nextSlackTime ? minutesBetween(nextSlackTime, referenceTime) : null,
      windowStart,
      windowEnd
    };
  }
}

export const tidalIntelService = new TidalIntelService();
