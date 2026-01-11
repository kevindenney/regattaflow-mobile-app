/**
 * ForecastCheckService
 *
 * Handles weather forecast snapshot capture and AI-powered analysis
 * for the race prep checklist weather check feature.
 */

import { EnhancedClaudeClient } from './ai/EnhancedClaudeClient';
import type {
  ForecastSnapshot,
  ForecastAnalysis,
  ForecastIntention,
} from '@/types/raceIntentions';
import type {
  RaceWeatherForecastData,
  HourlyDataPoint,
  TideTimeData,
  RaceWindowData,
} from '@/hooks/useRaceWeatherForecast';
import type { SailingVenue } from '@/lib/types/global-venues';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ForecastCheckService');

/** Maximum number of snapshots to keep per race */
const MAX_SNAPSHOTS = 3;

/**
 * Service for managing weather forecast snapshots and AI analysis
 */
export class ForecastCheckService {
  private static claudeClient: EnhancedClaudeClient | null = null;

  /**
   * Get or create the Claude client instance
   */
  private static getClaudeClient(): EnhancedClaudeClient {
    if (!this.claudeClient) {
      this.claudeClient = new EnhancedClaudeClient();
    }
    return this.claudeClient;
  }

  /**
   * Create a snapshot from the current forecast data
   */
  static createSnapshot(
    raceEventId: string,
    venue: SailingVenue,
    forecastData: RaceWeatherForecastData
  ): ForecastSnapshot {
    if (!forecastData.raceWindow) {
      throw new Error('Forecast data missing race window information');
    }

    const snapshot: ForecastSnapshot = {
      id: `snapshot-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      capturedAt: new Date().toISOString(),
      raceEventId,
      venueId: venue.id,
      windForecast: forecastData.hourlyWind || [],
      tideForecast: forecastData.hourlyTide || [],
      raceWindow: forecastData.raceWindow,
      windTrend: forecastData.windTrend || 'steady',
      highTide: forecastData.highTide,
      lowTide: forecastData.lowTide,
      source: 'stormglass',
      confidence: 0.8,
    };

    logger.info('Created forecast snapshot', {
      snapshotId: snapshot.id,
      raceEventId,
      windAtStart: snapshot.raceWindow.windAtStart,
      windTrend: snapshot.windTrend,
    });

    return snapshot;
  }

  /**
   * Add a snapshot to the forecast intention, maintaining max 3 snapshots (FIFO)
   */
  static addSnapshotToIntention(
    existing: ForecastIntention | undefined,
    newSnapshot: ForecastSnapshot
  ): ForecastSnapshot[] {
    const existingSnapshots = existing?.snapshots || [];
    const updatedSnapshots = [...existingSnapshots, newSnapshot];

    // Keep only the last MAX_SNAPSHOTS
    if (updatedSnapshots.length > MAX_SNAPSHOTS) {
      return updatedSnapshots.slice(-MAX_SNAPSHOTS);
    }

    return updatedSnapshots;
  }

  /**
   * Analyze changes between two forecast snapshots using Claude AI
   */
  static async analyzeChanges(
    previousSnapshot: ForecastSnapshot,
    currentSnapshot: ForecastSnapshot,
    venueName: string,
    raceDate: string
  ): Promise<ForecastAnalysis> {
    logger.info('Starting forecast analysis', {
      previousId: previousSnapshot.id,
      currentId: currentSnapshot.id,
    });

    const prompt = this.buildAnalysisPrompt(
      previousSnapshot,
      currentSnapshot,
      venueName,
      raceDate
    );

    try {
      const client = this.getClaudeClient();
      const response = await client.createEnhancedMessage({
        model: 'claude-3-haiku-20240307',
        system: `You are an expert sailing meteorologist helping sailors understand how weather forecast changes affect their race preparation. Be concise and practical. Focus on tactical implications.`,
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 1024,
        temperature: 0.3,
      });

      const analysis = this.parseAnalysisResponse(
        response.text,
        previousSnapshot.id,
        currentSnapshot.id
      );

      logger.info('Forecast analysis complete', {
        alertLevel: analysis.alertLevel,
        implicationCount: analysis.implications.length,
      });

      return analysis;
    } catch (error) {
      logger.error('Error analyzing forecast changes', { error });

      // Return a fallback analysis
      return this.createFallbackAnalysis(
        previousSnapshot,
        currentSnapshot
      );
    }
  }

  /**
   * Build the prompt for Claude to analyze forecast changes
   */
  private static buildAnalysisPrompt(
    previous: ForecastSnapshot,
    current: ForecastSnapshot,
    venueName: string,
    raceDate: string
  ): string {
    const prevWind = previous.raceWindow;
    const currWind = current.raceWindow;

    const timeSincePrevious = this.formatTimeDiff(
      new Date(previous.capturedAt),
      new Date(current.capturedAt)
    );

    return `Compare these two weather forecasts for a sailing race at ${venueName} on ${raceDate}:

PREVIOUS FORECAST (captured ${timeSincePrevious} ago):
- Wind at race start: ${prevWind.windAtStart} knots from ${prevWind.windDirectionAtStart}
- Wind at race end: ${prevWind.windAtEnd} knots
- Overall trend: ${previous.windTrend}
- Beaufort scale: ${prevWind.beaufortAtStart}
- Tide at start: ${prevWind.tideAtStart.toFixed(2)}m
- Tide at end: ${prevWind.tideAtEnd.toFixed(2)}m
${prevWind.hasTurnDuringRace ? `- Tide turn during race: ${prevWind.turnTimeDuringRace}` : '- No tide turn during race window'}

CURRENT FORECAST (just captured):
- Wind at race start: ${currWind.windAtStart} knots from ${currWind.windDirectionAtStart}
- Wind at race end: ${currWind.windAtEnd} knots
- Overall trend: ${current.windTrend}
- Beaufort scale: ${currWind.beaufortAtStart}
- Tide at start: ${currWind.tideAtStart.toFixed(2)}m
- Tide at end: ${currWind.tideAtEnd.toFixed(2)}m
${currWind.hasTurnDuringRace ? `- Tide turn during race: ${currWind.turnTimeDuringRace}` : '- No tide turn during race window'}

Analyze the changes and respond with ONLY a valid JSON object (no markdown, no explanation):
{
  "summary": "One sentence describing the most important change and its impact",
  "alertLevel": "stable" | "minor_change" | "significant_change",
  "implications": ["tactical implication 1", "tactical implication 2", "up to 4 implications"],
  "changes": {
    "wind": { "from": "description", "to": "description", "impact": "tactical impact" } or null if no change,
    "tide": { "from": "description", "to": "description", "impact": "tactical impact" } or null if no change,
    "conditions": { "from": "description", "to": "description", "impact": "tactical impact" } or null if no overall conditions change
  }
}

Guidelines for alertLevel:
- "stable": Wind changed <2 knots, direction within 15°, no trend change
- "minor_change": Wind changed 2-5 knots OR direction 15-30° OR trend changed
- "significant_change": Wind changed >5 knots OR direction >30° OR Beaufort scale changed`;
  }

  /**
   * Parse the AI response into a ForecastAnalysis object
   */
  private static parseAnalysisResponse(
    responseText: string,
    previousId: string,
    currentId: string
  ): ForecastAnalysis {
    try {
      // Try to extract JSON from the response
      let jsonText = responseText.trim();

      // Handle markdown code blocks
      if (jsonText.startsWith('```')) {
        const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) {
          jsonText = match[1].trim();
        }
      }

      const parsed = JSON.parse(jsonText);

      return {
        analyzedAt: new Date().toISOString(),
        previousSnapshotId: previousId,
        currentSnapshotId: currentId,
        summary: parsed.summary || 'Forecast analysis complete.',
        implications: Array.isArray(parsed.implications)
          ? parsed.implications.slice(0, 4)
          : [],
        alertLevel: this.validateAlertLevel(parsed.alertLevel),
        changes: {
          wind: parsed.changes?.wind || null,
          tide: parsed.changes?.tide || null,
          conditions: parsed.changes?.conditions || null,
        },
      };
    } catch (error) {
      logger.error('Error parsing analysis response', {
        error,
        responseText: responseText.substring(0, 200),
      });

      // Return a minimal valid analysis
      return {
        analyzedAt: new Date().toISOString(),
        previousSnapshotId: previousId,
        currentSnapshotId: currentId,
        summary: 'Forecast has been updated since your last check.',
        implications: ['Review the new forecast carefully before race day.'],
        alertLevel: 'minor_change',
        changes: {
          wind: null,
          tide: null,
          conditions: null,
        },
      };
    }
  }

  /**
   * Create a fallback analysis when AI is unavailable
   */
  private static createFallbackAnalysis(
    previous: ForecastSnapshot,
    current: ForecastSnapshot
  ): ForecastAnalysis {
    const windChange = Math.abs(
      current.raceWindow.windAtStart - previous.raceWindow.windAtStart
    );
    const directionChanged =
      current.raceWindow.windDirectionAtStart !==
      previous.raceWindow.windDirectionAtStart;
    const trendChanged = current.windTrend !== previous.windTrend;

    let alertLevel: 'stable' | 'minor_change' | 'significant_change' = 'stable';
    if (windChange > 5 || (directionChanged && windChange > 2)) {
      alertLevel = 'significant_change';
    } else if (windChange > 2 || directionChanged || trendChanged) {
      alertLevel = 'minor_change';
    }

    const implications: string[] = [];

    if (windChange > 0) {
      const direction = current.raceWindow.windAtStart > previous.raceWindow.windAtStart
        ? 'increased'
        : 'decreased';
      implications.push(
        `Wind has ${direction} by ${windChange.toFixed(1)} knots since last check.`
      );
    }

    if (directionChanged) {
      implications.push(
        `Wind direction changed from ${previous.raceWindow.windDirectionAtStart} to ${current.raceWindow.windDirectionAtStart}.`
      );
    }

    if (trendChanged) {
      implications.push(
        `Wind trend changed from ${previous.windTrend} to ${current.windTrend}.`
      );
    }

    if (implications.length === 0) {
      implications.push('Forecast remains stable since last check.');
    }

    return {
      analyzedAt: new Date().toISOString(),
      previousSnapshotId: previous.id,
      currentSnapshotId: current.id,
      summary:
        alertLevel === 'stable'
          ? 'Forecast is stable with no significant changes.'
          : `Forecast has ${alertLevel === 'significant_change' ? 'significant' : 'minor'} changes since last check.`,
      implications,
      alertLevel,
      changes: {
        wind:
          windChange > 0 || directionChanged
            ? {
                from: `${previous.raceWindow.windAtStart}kt ${previous.raceWindow.windDirectionAtStart}`,
                to: `${current.raceWindow.windAtStart}kt ${current.raceWindow.windDirectionAtStart}`,
                impact:
                  windChange > 5
                    ? 'May require sail change'
                    : 'Minor adjustment to tactics',
              }
            : null,
        tide: null,
        conditions: trendChanged
          ? {
              from: previous.windTrend,
              to: current.windTrend,
              impact: 'Consider timing implications for race strategy',
            }
          : null,
      },
    };
  }

  /**
   * Validate and normalize alert level
   */
  private static validateAlertLevel(
    level: string | undefined
  ): 'stable' | 'minor_change' | 'significant_change' {
    if (level === 'stable' || level === 'minor_change' || level === 'significant_change') {
      return level;
    }
    return 'minor_change';
  }

  /**
   * Format time difference in a human-readable way
   */
  private static formatTimeDiff(earlier: Date, later: Date): string {
    const diffMs = later.getTime() - earlier.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours >= 24) {
      const days = Math.floor(diffHours / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
    return 'just now';
  }

  /**
   * Get a summary of changes between snapshots without AI
   * Useful for quick display or when AI is disabled
   */
  static getQuickChangeSummary(
    snapshots: ForecastSnapshot[]
  ): {
    hasChanges: boolean;
    windDelta: number;
    directionChanged: boolean;
    trendChanged: boolean;
  } {
    if (snapshots.length < 2) {
      return {
        hasChanges: false,
        windDelta: 0,
        directionChanged: false,
        trendChanged: false,
      };
    }

    const latest = snapshots[snapshots.length - 1];
    const previous = snapshots[snapshots.length - 2];

    const windDelta =
      latest.raceWindow.windAtStart - previous.raceWindow.windAtStart;
    const directionChanged =
      latest.raceWindow.windDirectionAtStart !==
      previous.raceWindow.windDirectionAtStart;
    const trendChanged = latest.windTrend !== previous.windTrend;

    return {
      hasChanges: Math.abs(windDelta) > 1 || directionChanged || trendChanged,
      windDelta,
      directionChanged,
      trendChanged,
    };
  }
}

// Export singleton instance for convenience
export const forecastCheckService = ForecastCheckService;
