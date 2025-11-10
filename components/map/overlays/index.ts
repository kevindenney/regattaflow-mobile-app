/**
 * Map Overlay Components Index
 *
 * Enhanced weather and marine overlays leveraging Storm Glass data
 * Complete professional racing visualization suite
 */

// Phase 1: Enhanced Weather Overlays
export { SwellOverlay, getSwellLayerSpec } from './SwellOverlay';
export { WaveHeightHeatmap, getWaveHeightHeatmapLayerSpec, getWaveHeightLegend, generateWaveDataPoints } from './WaveHeightHeatmap';
export { OceanCurrentParticles, generateCurrentField } from './OceanCurrentParticles';
export { VisibilityZones, getVisibilityZonesLayerSpec, getVisibilityStats, isVisibilitySafeForRacing } from './VisibilityZones';

// Phase 2: Enhanced Marine Features
export { ContinuousTideDisplay } from './ContinuousTideDisplay';
export { SeaTemperatureGradient, getSeaTemperatureGradientLayerSpec, getTemperatureLegend, getTemperatureStats, detectThermalBoundaries } from './SeaTemperatureGradient';
export { WeatherConfidenceIndicator, generateConfidenceMetrics } from './WeatherConfidenceIndicator';

// Phase 3: Professional Racing Features
export { LayeredWindField, getLayeredWindFieldLayerSpec } from './LayeredWindField';
export { PredictiveCurrentsOverlay, getPredictiveCurrentsLayerSpec } from './PredictiveCurrentsOverlay';
export { WavePeriodPressureViz } from './WavePeriodPressureViz';

// Re-export types
export type { SwellConditions, Region } from './SwellOverlay';
export type { GeoPoint as WaveDataPoint } from './WaveHeightHeatmap';
export type { CurrentField, OceanCurrentParticlesProps } from './OceanCurrentParticles';
export type { VisibilityData, VisibilityZonesProps } from './VisibilityZones';
export type { TideDataPoint, TideExtreme, ContinuousTideDisplayProps } from './ContinuousTideDisplay';
export type { TemperatureDataPoint, SeaTemperatureGradientProps } from './SeaTemperatureGradient';
export type { ConfidenceMetrics, WeatherConfidenceIndicatorProps } from './WeatherConfidenceIndicator';
export type { WindLayer, WindFieldPoint, LayeredWindFieldProps } from './LayeredWindField';
export type { CurrentPrediction, TacticalWindow, PredictiveCurrentsOverlayProps } from './PredictiveCurrentsOverlay';
export type { WavePeriodData, PressureData, WavePeriodPressureVizProps } from './WavePeriodPressureViz';
