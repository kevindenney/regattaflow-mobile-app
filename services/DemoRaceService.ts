import {
  DemoRace,
  DemoSeason,
  getDemoRaces as getRawDemoRaces,
  createUpcomingDemoRace,
  createPastDemoRace,
  createDemoSeason,
  isDemoRaceId,
  DEMO_SAILS_IRC3,
  type DemoRaceResults,
  type DemoRaceAnalysis,
  type DemoRaceWeather,
  type DemoRaceStrategy,
} from '@/lib/demo/demoRaceData';
import type { RaceIntentions } from '@/types/raceIntentions';
import { subDays, format } from 'date-fns';

/**
 * Demo race details for historical reflection
 */
export interface DemoRaceDetails {
  results?: DemoRaceResults;
  analysis?: DemoRaceAnalysis;
  weather?: DemoRaceWeather;
  strategy?: DemoRaceStrategy;
}

/**
 * Service for managing demo races in the freemium guest experience
 * Demo races are pre-populated sample races that showcase app features
 */
export class DemoRaceService {
  private static cachedRaces: DemoRace[] | null = null;
  private static cacheTimestamp: number | null = null;
  private static readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour cache

  /**
   * Get all demo races with dates adjusted to current time
   * Results are cached for performance but will refresh daily
   */
  static getDemoRaces(): DemoRace[] {
    const now = Date.now();

    // Check if cache is still valid
    if (
      this.cachedRaces &&
      this.cacheTimestamp &&
      now - this.cacheTimestamp < this.CACHE_TTL
    ) {
      return this.cachedRaces;
    }

    // Regenerate demo races with current dates
    this.cachedRaces = getRawDemoRaces();
    this.cacheTimestamp = now;

    return this.cachedRaces;
  }

  /**
   * Get the upcoming demo race (Cowes Week Day 3)
   */
  static getUpcomingDemoRace(): DemoRace {
    return createUpcomingDemoRace();
  }

  /**
   * Get the past demo race (Round the Island)
   */
  static getPastDemoRace(): DemoRace {
    return createPastDemoRace();
  }

  /**
   * Get a specific demo race by ID
   * @param id The demo race ID ('demo-upcoming' or 'demo-past')
   * @returns The demo race or null if not found
   */
  static getDemoRaceById(id: string): DemoRace | null {
    if (id === 'demo-upcoming') {
      return this.getUpcomingDemoRace();
    }
    if (id === 'demo-past') {
      return this.getPastDemoRace();
    }
    return null;
  }

  /**
   * Check if a race ID belongs to a demo race
   */
  static isDemoRace(raceId: string): boolean {
    return isDemoRaceId(raceId);
  }

  /**
   * Get detailed race data for reflection (results, analysis, weather, strategy)
   * Used for the Race tab historical view to show rich reflection content
   */
  static getDemoRaceDetails(raceId: string): DemoRaceDetails | null {
    const race = this.getDemoRaceById(raceId);
    if (!race) return null;

    return {
      results: race.results,
      analysis: race.analysis,
      weather: race.weather,
      strategy: race.strategy,
    };
  }

  /**
   * Clear the demo race cache (useful for testing)
   */
  static clearCache(): void {
    this.cachedRaces = null;
    this.cacheTimestamp = null;
  }

  /**
   * Convert a DemoRace to the format expected by the races list
   * This maps demo race fields to the standard race/regatta interface
   */
  static toRaceListItem(demoRace: DemoRace): {
    id: string;
    name: string;
    start_date: string;
    status: string;
    race_type: string;
    latitude: number;
    longitude: number;
    isDemo: true;
    boat_id: string;
    class_id: string;
    metadata: Record<string, unknown>;
  } {
    return {
      id: demoRace.id,
      name: demoRace.name,
      start_date: demoRace.start_date,
      status: demoRace.status,
      race_type: demoRace.race_type,
      latitude: demoRace.latitude,
      longitude: demoRace.longitude,
      isDemo: true,
      boat_id: demoRace.boat_id,
      class_id: demoRace.class_id,
      metadata: {
        ...demoRace.metadata,
        startTime: demoRace.startTime,
        venue: demoRace.venue,
        weather: demoRace.weather,
        tide: demoRace.tide,
        strategy: demoRace.strategy,
        results: demoRace.results,
        analysis: demoRace.analysis,
        checklist: demoRace.checklist,
      },
    };
  }

  /**
   * Get demo races formatted for the races list
   */
  static getDemoRacesForList(): ReturnType<typeof DemoRaceService.toRaceListItem>[] {
    return this.getDemoRaces().map((race) => this.toRaceListItem(race));
  }

  /**
   * Get demo season for guest users
   * Returns a season object compatible with SeasonWithSummary type
   */
  static getDemoSeason(): DemoSeason {
    return createDemoSeason();
  }

  /**
   * Get default preparation data for demo races
   * This provides pre-populated checklist completions, sail selections, and strategy notes
   * to showcase the historical view features
   */
  static getDemoRacePreparation(raceId: string): RaceIntentions | null {
    if (raceId === 'demo-past') {
      return this.getPastDemoPreparation();
    }
    // Upcoming race has partial preparation (user is expected to complete it)
    if (raceId === 'demo-upcoming') {
      return this.getUpcomingDemoPreparation();
    }
    return null;
  }

  /**
   * Get preparation data for the past demo race (Round the Island)
   * Shows a fully prepared race with completed checklists and strategy
   */
  private static getPastDemoPreparation(): RaceIntentions {
    const raceDate = subDays(new Date(), 7);
    const dayBefore = subDays(raceDate, 1);
    const twoDaysBefore = subDays(raceDate, 2);

    const demoSailerId = '262fa4fe-c641-48ce-a236-bf34697639e0';
    const demoSailorName = 'Demo Sailor';

    return {
      // Checklist completions for days_before and race_morning phases
      checklistCompletions: {
        // Days Before - Documents & Weather
        pre_race_briefing: {
          itemId: 'pre_race_briefing',
          completedAt: format(twoDaysBefore, "yyyy-MM-dd'T'10:00:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
          notes: 'Reviewed NOR and SI, noted tidal gates at St Catherines',
        },
        check_weather_forecast: {
          itemId: 'check_weather_forecast',
          completedAt: format(dayBefore, "yyyy-MM-dd'T'08:30:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
          notes: 'W 18-24kt forecast, building through the day',
        },
        // Days Before - Equipment
        sails: {
          itemId: 'sails',
          completedAt: format(twoDaysBefore, "yyyy-MM-dd'T'14:00:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
        },
        lines: {
          itemId: 'lines',
          completedAt: format(twoDaysBefore, "yyyy-MM-dd'T'14:30:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
        },
        battery: {
          itemId: 'battery',
          completedAt: format(dayBefore, "yyyy-MM-dd'T'20:00:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
        },
        safety: {
          itemId: 'safety',
          completedAt: format(twoDaysBefore, "yyyy-MM-dd'T'15:00:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
          notes: 'EPIRB checked, flares in date',
        },
        // Days Before - Crew
        confirm_crew: {
          itemId: 'confirm_crew',
          completedAt: format(twoDaysBefore, "yyyy-MM-dd'T'09:00:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
        },
        // Distance Racing - Days Before
        provisions_planning: {
          itemId: 'provisions_planning',
          completedAt: format(dayBefore, "yyyy-MM-dd'T'16:00:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
          notes: 'Food and water for 12hrs plus reserve',
        },
        nav_prep: {
          itemId: 'nav_prep',
          completedAt: format(dayBefore, "yyyy-MM-dd'T'18:00:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
          notes: 'Waypoints entered, backup on phone',
        },
        offshore_safety: {
          itemId: 'offshore_safety',
          completedAt: format(twoDaysBefore, "yyyy-MM-dd'T'15:30:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
        },
        // Race Morning
        check_forecast: {
          itemId: 'check_forecast',
          completedAt: format(raceDate, "yyyy-MM-dd'T'04:30:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
          notes: 'Confirmed W 18kt, building to 22kt by afternoon',
        },
        tune_rig: {
          itemId: 'tune_rig',
          completedAt: format(raceDate, "yyyy-MM-dd'T'05:00:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
          notes: 'Heavy air setup - extra backstay tension',
        },
        select_sails: {
          itemId: 'select_sails',
          completedAt: format(raceDate, "yyyy-MM-dd'T'05:15:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
        },
        route_briefing: {
          itemId: 'route_briefing',
          completedAt: format(raceDate, "yyyy-MM-dd'T'04:45:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
          notes: 'Tidal gates key - St Catherines and The Needles',
        },
        // On Water
        check_in: {
          itemId: 'check_in',
          completedAt: format(raceDate, "yyyy-MM-dd'T'05:45:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
        },
      },

      // Strategy notes for key sections
      strategyNotes: {
        start: 'Pin end favored for access to the right side. Plan port approach, tack to starboard with 90 seconds to go.',
        first_beat: 'Stay right early for the building westerly. Tack on headers, protect against boats to windward.',
        upwind: 'Work the pressure bands. Expect shifts of 10-15 degrees. Stay in phase with the oscillations.',
        downwind: 'Gybe angles critical in this breeze. No dead runs - keep the apparent wind forward for speed.',
        tidal_gates: 'St Catherines gate opens at 10:30. Need to be past The Needles by 14:00 for favorable current.',
      },

      // Strategy brief with race intention
      strategyBrief: {
        raceIntention: 'Conservative start, execute tidal gates perfectly, protect top 10 position',
        intentionUpdatedAt: format(raceDate, "yyyy-MM-dd'T'04:00:00'Z'"),
      },

      // Sail selection from demo inventory
      sailSelection: {
        mainsail: DEMO_SAILS_IRC3[0].id, // Main #1
        mainsailName: DEMO_SAILS_IRC3[0].custom_name,
        jib: DEMO_SAILS_IRC3[1].id, // G1 Heavy
        jibName: DEMO_SAILS_IRC3[1].custom_name,
        spinnaker: DEMO_SAILS_IRC3[4].id, // A1 Light Runner
        spinnakerName: DEMO_SAILS_IRC3[4].custom_name,
        notes: 'Heavy air selection for 18-24kt W',
        windRangeContext: '18-24kt W',
      },

      // Rig intentions
      rigIntentions: {
        settings: {
          upper_shrouds: { status: 'adjusted', value: '30', notes: 'Heavy air base' },
          lower_shrouds: { status: 'adjusted', value: '26' },
          forestay: { status: 'monitoring', notes: 'Check tension before start' },
          backstay: { status: 'adjusted', value: 'Firm', notes: 'More bend for heavy air' },
          mast_rake: { status: 'default' },
        },
        overallNotes: 'Heavy air setup - flattening main for depowering',
      },

      updatedAt: format(raceDate, "yyyy-MM-dd'T'05:30:00'Z'"),
    };
  }

  /**
   * Get preparation data for the upcoming demo race
   * Shows partial preparation (user can complete the rest)
   */
  private static getUpcomingDemoPreparation(): RaceIntentions {
    const raceDate = new Date();
    raceDate.setDate(raceDate.getDate() + 3);
    const yesterday = subDays(new Date(), 1);

    const demoSailerId = '262fa4fe-c641-48ce-a236-bf34697639e0';
    const demoSailorName = 'Demo Sailor';

    return {
      checklistCompletions: {
        // A few items pre-completed to show progress
        pre_race_briefing: {
          itemId: 'pre_race_briefing',
          completedAt: format(yesterday, "yyyy-MM-dd'T'19:00:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
          notes: 'NOR and SI reviewed',
        },
        check_weather_forecast: {
          itemId: 'check_weather_forecast',
          completedAt: format(yesterday, "yyyy-MM-dd'T'20:00:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
          notes: 'SW 12-16kt looking good',
        },
        confirm_crew: {
          itemId: 'confirm_crew',
          completedAt: format(yesterday, "yyyy-MM-dd'T'18:00:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
        },
        sails: {
          itemId: 'sails',
          completedAt: format(yesterday, "yyyy-MM-dd'T'14:00:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
        },
        lines: {
          itemId: 'lines',
          completedAt: format(yesterday, "yyyy-MM-dd'T'14:30:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
        },
        battery: {
          itemId: 'battery',
          completedAt: format(yesterday, "yyyy-MM-dd'T'15:00:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
        },
        safety: {
          itemId: 'safety',
          completedAt: format(yesterday, "yyyy-MM-dd'T'15:30:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
        },
        meeting_point: {
          itemId: 'meeting_point',
          completedAt: format(yesterday, "yyyy-MM-dd'T'18:30:00'Z'"),
          completedBy: demoSailerId,
          completedByName: demoSailorName,
          notes: '9am at the RYS lawn',
        },
      },

      strategyNotes: {
        start: 'Pin looks favored for right side access',
      },

      strategyBrief: {
        raceIntention: 'Work the right side on first beat, stay in the pressure',
        intentionUpdatedAt: format(yesterday, "yyyy-MM-dd'T'20:30:00'Z'"),
      },

      updatedAt: format(yesterday, "yyyy-MM-dd'T'21:00:00'Z'"),
    };
  }
}
