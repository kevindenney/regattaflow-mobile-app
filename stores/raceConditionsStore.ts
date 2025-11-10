/**
 * Race Conditions Store
 *
 * Central state management for racing tactical console
 * Manages environment data, position, course, and AI recommendations
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export interface Position {
  latitude: number;
  longitude: number;
  heading: number; // True heading in degrees
  speed: number; // Speed over ground in knots
  timestamp: Date;
}

export interface Wind {
  trueSpeed: number; // TWS in knots
  trueDirection: number; // TWD in degrees
  apparentSpeed: number; // AWS in knots
  apparentAngle: number; // AWA in degrees
  forecast?: WindForecast[];
}

export interface WindForecast {
  time: Date;
  speed: number;
  direction: number;
  confidence: 'high' | 'moderate' | 'low';
}

export interface Current {
  speed: number; // knots
  direction: number; // degrees
  phase: 'flood' | 'ebb' | 'slack';
  strength: 'weak' | 'moderate' | 'strong';
  trend: 'rising' | 'falling' | 'slack';
  predictions?: CurrentPrediction[];
}

export interface CurrentPrediction {
  time: Date;
  speed: number;
  direction: number;
  phase: 'flood' | 'ebb' | 'slack';
}

export interface Tide {
  height: number; // meters
  trend: 'rising' | 'falling' | 'slack';
  rate: number; // m/hour
  nextHigh?: { time: Date; height: number };
  nextLow?: { time: Date; height: number };
  range: number; // meters
  coefficient?: number; // 0-1
}

export interface Depth {
  current: number; // meters
  minimum: number; // meters (ahead on course)
  trend: number; // m/min (rate of change)
  clearance: number; // meters (current - draft)
  forecast?: DepthForecast[];
}

export interface DepthForecast {
  time: Date;
  location: { lat: number; lng: number };
  depth: number;
  warning?: 'safe' | 'caution' | 'danger';
}

export interface Environment {
  wind: Wind;
  current: Current;
  tide: Tide;
  depth: Depth;
  lastUpdated: Date;
}

export interface Mark {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  type: 'start-pin' | 'start-boat' | 'windward' | 'leeward' | 'offset' | 'finish';
  rounding?: 'port' | 'starboard';
}

export interface Leg {
  id: string;
  name: string;
  from: string; // mark ID
  to: string; // mark ID
  type: 'upwind' | 'downwind' | 'reach';
  distance: number; // nautical miles
  heading: number; // degrees
  estimatedTime?: number; // minutes
}

export interface Course {
  id: string;
  name: string;
  marks: Mark[];
  legs: Leg[];
  startTime?: Date;
  boundaries?: GeoJSON.Polygon;
  restrictedZones?: GeoJSON.Polygon[];
  startLine?: {
    port: { latitude: number; longitude: number };
    starboard: { latitude: number; longitude: number };
    centerLat: number;
    centerLon: number;
    heading: number;
    length: number;
  };
  distance?: number;
  laps?: number;
}

export interface Boat {
  id: string;
  name: string;
  sail: string;
  position: { lat: number; lng: number };
  heading: number;
  speed: number;
  isUser?: boolean;
}

export interface Fleet {
  boats: Boat[];
  density?: {
    lat: number;
    lng: number;
    count: number;
  }[];
}

export interface TacticalZone {
  id: string;
  type: 'relief' | 'acceleration' | 'shear' | 'lee-bow' | 'anchoring' | 'eddy';
  geometry: GeoJSON.Polygon | GeoJSON.LineString;
  properties: {
    name: string;
    description: string;
    advantage?: string; // e.g., "+2 BL"
    confidence: 'high' | 'moderate' | 'low';
    validTime?: { start: Date; end: Date };
  };
}

export interface AIChip {
  id: string;
  type: 'opportunity' | 'caution' | 'alert' | 'strategic';
  skill: string; // Which Anthropic skill generated this
  theory: string; // Why this matters
  execution: string; // How to execute (RegattaFlow Coach-style)
  timing?: string; // When to act
  confidence: 'high' | 'moderate' | 'low';
  priority: number; // 1-10 (10 = most urgent)
  isPinned: boolean;
  alert?: {
    time: Date;
    triggered: boolean;
  };
  actions?: {
    viewOnMap?: boolean;
    setAlert?: boolean;
    viewPlaybook?: boolean;
  };
  createdAt: Date;
}

export interface Scenario {
  active: boolean;
  timeOffset: number; // minutes from now (+/- 15)
  modifiedAt?: Date;
}

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface RaceConditionsState {
  // Core data
  position: Position | null;
  environment: Environment | null;
  course: Course | null;
  fleet: Fleet | null;
  draft: number; // boat draft in meters (user-configurable)

  // Derived state
  tacticalZones: TacticalZone[];
  aiRecommendations: AIChip[];

  // Scenario mode
  scenario: Scenario;

  // Loading states
  isLoading: {
    position: boolean;
    environment: boolean;
    ai: boolean;
  };

  // Errors
  errors: {
    position?: string;
    environment?: string;
    ai?: string;
  };

  // Actions
  updatePosition: (position: Position) => void;
  updateEnvironment: (env: Partial<Environment>) => void;
  updateCourse: (course: Course) => void;
  updateFleet: (fleet: Fleet) => void;
  setDraft: (draft: number) => void;

  setTacticalZones: (zones: TacticalZone[]) => void;
  addTacticalZone: (zone: TacticalZone) => void;
  removeTacticalZone: (zoneId: string) => void;

  setAIRecommendations: (chips: AIChip[]) => void;
  addAIChip: (chip: AIChip) => void;
  removeAIChip: (chipId: string) => void;
  pinChip: (chipId: string) => void;
  unpinChip: (chipId: string) => void;
  setChipAlert: (chipId: string, time: Date) => void;

  setScenarioMode: (offset: number) => void;
  clearScenario: () => void;

  refreshAI: () => Promise<void>;

  setLoading: (key: keyof RaceConditionsState['isLoading'], loading: boolean) => void;
  setError: (key: keyof RaceConditionsState['errors'], error: string | undefined) => void;

  reset: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState = {
  position: null,
  environment: null,
  course: null,
  fleet: null,
  draft: 2.5, // Default 2.5m draft

  tacticalZones: [],
  aiRecommendations: [],

  scenario: {
    active: false,
    timeOffset: 0
  },

  isLoading: {
    position: false,
    environment: false,
    ai: false
  },

  errors: {}
};

// ============================================================================
// STORE
// ============================================================================

export const useRaceConditions = create<RaceConditionsState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Position updates
      updatePosition: (position) => {
        set({ position }, false, 'updatePosition');
      },

      // Environment updates
      updateEnvironment: (envUpdate) => {
        const current = get().environment;
        const updated: Environment = current
          ? {
              ...current,
              ...envUpdate,
              lastUpdated: new Date()
            }
          : {
              wind: envUpdate.wind || { trueSpeed: 0, trueDirection: 0, apparentSpeed: 0, apparentAngle: 0 },
              current: envUpdate.current || { speed: 0, direction: 0, phase: 'slack', strength: 'weak', trend: 'slack' },
              tide: envUpdate.tide || { height: 0, trend: 'slack', rate: 0, range: 0 },
              depth: envUpdate.depth || { current: 0, minimum: 0, trend: 0, clearance: 0 },
              lastUpdated: new Date()
            };

        set({ environment: updated }, false, 'updateEnvironment');

        // Trigger AI refresh if significant change
        const shouldRefresh = get().shouldRefreshAI(envUpdate);
        if (shouldRefresh && !get().isLoading.ai) {
          void get().refreshAI();
        }
      },

      // Course updates
      updateCourse: (course) => {
        set({ course }, false, 'updateCourse');
      },

      // Fleet updates
      updateFleet: (fleet) => {
        set({ fleet }, false, 'updateFleet');
      },

      // Draft setting
      setDraft: (draft) => {
        set({ draft }, false, 'setDraft');

        // Recalculate depth clearance
        const env = get().environment;
        if (env?.depth) {
          get().updateEnvironment({
            depth: {
              ...env.depth,
              clearance: env.depth.current - draft
            }
          });
        }
      },

      // Tactical zones
      setTacticalZones: (zones) => {
        set({ tacticalZones: zones }, false, 'setTacticalZones');
      },

      addTacticalZone: (zone) => {
        set(state => ({
          tacticalZones: [...state.tacticalZones, zone]
        }), false, 'addTacticalZone');
      },

      removeTacticalZone: (zoneId) => {
        set(state => ({
          tacticalZones: state.tacticalZones.filter(z => z.id !== zoneId)
        }), false, 'removeTacticalZone');
      },

      // AI recommendations
      setAIRecommendations: (chips) => {
        set({ aiRecommendations: chips }, false, 'setAIRecommendations');
      },

      addAIChip: (chip) => {
        set(state => ({
          aiRecommendations: [...state.aiRecommendations, chip]
            .sort((a, b) => b.priority - a.priority)
        }), false, 'addAIChip');
      },

      removeAIChip: (chipId) => {
        set(state => ({
          aiRecommendations: state.aiRecommendations.filter(c => c.id !== chipId)
        }), false, 'removeAIChip');
      },

      pinChip: (chipId) => {
        set(state => ({
          aiRecommendations: state.aiRecommendations.map(chip =>
            chip.id === chipId ? { ...chip, isPinned: true } : chip
          )
        }), false, 'pinChip');
      },

      unpinChip: (chipId) => {
        set(state => ({
          aiRecommendations: state.aiRecommendations.map(chip =>
            chip.id === chipId ? { ...chip, isPinned: false } : chip
          )
        }), false, 'unpinChip');
      },

      setChipAlert: (chipId, time) => {
        set(state => ({
          aiRecommendations: state.aiRecommendations.map(chip =>
            chip.id === chipId
              ? { ...chip, alert: { time, triggered: false } }
              : chip
          )
        }), false, 'setChipAlert');
      },

      // Scenario mode
      setScenarioMode: (offset) => {
        set({
          scenario: {
            active: true,
            timeOffset: offset,
            modifiedAt: new Date()
          }
        }, false, 'setScenarioMode');

        // Trigger AI refresh with scenario context
        void get().refreshAI();
      },

      clearScenario: () => {
        set({
          scenario: {
            active: false,
            timeOffset: 0
          }
        }, false, 'clearScenario');

        // Refresh AI with live data
        void get().refreshAI();
      },

      // AI refresh
      refreshAI: async () => {
        const state = get();

        // Don't refresh if already loading
        if (state.isLoading.ai) {
          return;
        }

        set({ isLoading: { ...state.isLoading, ai: true } }, false, 'refreshAI:start');

        try {
          console.log('[RaceConditionsStore] AI refresh triggered');

          // Import TacticalAIService dynamically to avoid circular dependencies
          const { TacticalAIService } = await import('@/services/TacticalAIService');

          // Build context
          const context = {
            position: state.position,
            environment: state.environment,
            course: state.course,
            fleet: state.fleet,
            draft: state.draft,
            scenario: state.scenario.active ? state.scenario : undefined
          };

          // Get recommendations
          const chips = await TacticalAIService.getRecommendations(context);

          set({
            aiRecommendations: chips,
            isLoading: { ...state.isLoading, ai: false },
            errors: { ...state.errors, ai: undefined }
          }, false, 'refreshAI:success');

          console.log(`[RaceConditionsStore] AI refresh complete: ${chips.length} chips`);
        } catch (error) {
          console.error('[RaceConditionsStore] AI refresh failed:', error);
          set({
            isLoading: { ...state.isLoading, ai: false },
            errors: { ...state.errors, ai: error instanceof Error ? error.message : 'Unknown error' }
          }, false, 'refreshAI:error');
        }
      },

      // Helper: determine if env change warrants AI refresh
      shouldRefreshAI: (envUpdate: Partial<Environment>): boolean => {
        const current = get().environment;
        if (!current) return true;

        // Significant wind change (> 2 knots or > 10°)
        if (envUpdate.wind) {
          const windSpeedDelta = Math.abs((envUpdate.wind.trueSpeed || current.wind.trueSpeed) - current.wind.trueSpeed);
          const windDirDelta = Math.abs((envUpdate.wind.trueDirection || current.wind.trueDirection) - current.wind.trueDirection);
          if (windSpeedDelta > 2 || windDirDelta > 10) return true;
        }

        // Significant current change (> 0.3 knots or phase change)
        if (envUpdate.current) {
          const currentSpeedDelta = Math.abs((envUpdate.current.speed || current.current.speed) - current.current.speed);
          const phaseChanged = envUpdate.current.phase && envUpdate.current.phase !== current.current.phase;
          if (currentSpeedDelta > 0.3 || phaseChanged) return true;
        }

        // Depth drops into danger zone
        if (envUpdate.depth) {
          const draft = get().draft;
          const oldClearance = current.depth.clearance;
          const newClearance = (envUpdate.depth.current || current.depth.current) - draft;
          const wasSafe = oldClearance > draft + 1.5;
          const nowCaution = newClearance < draft + 1.5;
          if (wasSafe && nowCaution) return true;
        }

        return false;
      },

      // Loading/Error state
      setLoading: (key, loading) => {
        set(state => ({
          isLoading: { ...state.isLoading, [key]: loading }
        }), false, `setLoading:${key}`);
      },

      setError: (key, error) => {
        set(state => ({
          errors: error ? { ...state.errors, [key]: error } : { ...state.errors, [key]: undefined }
        }), false, `setError:${key}`);
      },

      // Reset
      reset: () => {
        set(initialState, false, 'reset');
      }
    }),
    { name: 'RaceConditions' }
  )
);

// ============================================================================
// SELECTORS (for optimized component re-renders)
// ============================================================================

export const selectPosition = (state: RaceConditionsState) => state.position;
export const selectEnvironment = (state: RaceConditionsState) => state.environment;
export const selectWind = (state: RaceConditionsState) => state.environment?.wind;
export const selectCurrent = (state: RaceConditionsState) => state.environment?.current;
export const selectTide = (state: RaceConditionsState) => state.environment?.tide;
export const selectDepth = (state: RaceConditionsState) => state.environment?.depth;
export const selectCourse = (state: RaceConditionsState) => state.course;
export const selectFleet = (state: RaceConditionsState) => state.fleet;
export const selectTacticalZones = (state: RaceConditionsState) => state.tacticalZones;
export const selectAIRecommendations = (state: RaceConditionsState) => state.aiRecommendations;

// Cache pinned chips so useSyncExternalStore sees a stable reference while the underlying
// aiRecommendations array is unchanged. Without this we create a new array on every read,
// which React treats as a continuously changing snapshot and warns about infinite loops.
let lastPinnedSource: AIChip[] | null = null;
let lastPinnedResult: AIChip[] = [];
export const selectPinnedChips = (state: RaceConditionsState) => {
  if (state.aiRecommendations === lastPinnedSource) {
    return lastPinnedResult;
  }
  lastPinnedSource = state.aiRecommendations;
  lastPinnedResult = state.aiRecommendations.filter(chip => chip.isPinned);
  return lastPinnedResult;
};
export const selectScenario = (state: RaceConditionsState) => state.scenario;
export const selectIsScenarioActive = (state: RaceConditionsState) => state.scenario.active;
export const selectDraft = (state: RaceConditionsState) => state.draft;
export const selectClearance = (state: RaceConditionsState) => state.environment?.depth.clearance || 0;
