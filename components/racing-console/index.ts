/**
 * Racing Tactical Console
 *
 * Complete racing tactical console system integrating:
 * - AI-powered tactical recommendations
 * - Real-time environmental data visualization
 * - Safety monitoring and alerts
 * - Racing-specific calculations and insights
 * - Tactical zone visualization
 *
 * Core Components:
 * - PreStartConsole: Main racing interface
 * - AITacticalChips: AI recommendations
 * - DepthSafetyStrip: Safety monitoring
 * - Telemetry Cards: Bias, Current, Clearance
 * - TacticalZoneRenderer: Map layer visualization
 *
 * Built with:
 * - RaceConditionsStore (Zustand) for state management
 * - TacticalAIService for Anthropic skills integration
 * - RacingDesignSystem for consistent UI
 * - MapLibre GL for tactical zone rendering
 */

// Main Console
export { PreStartConsole } from './PreStartConsole';

// AI Components
export { AITacticalChips, TacticalChip } from './AITacticalChips';

// Safety Components
export { DepthSafetyStrip } from './DepthSafetyStrip';

// Telemetry Cards
export {
  BiasAdvantageCard,
  WaterPushCard,
  ClearanceOutlookCard,
  TacticalMapView
} from './PreStartConsole';

// Map Integration (re-export for convenience)
export { TacticalZoneRenderer } from '../map/TacticalZoneRenderer';
export {
  TacticalCurrentZones,
  getAllTacticalZoneLayers
} from '../map/layers/TacticalCurrentZones';
