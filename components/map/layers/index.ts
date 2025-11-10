/**
 * Map Layers Index
 *
 * Exports all environmental and tactical map layers
 */

// Current layers
export { CurrentAccelerationLayer } from './CurrentAccelerationLayer';
export { CurrentParticleLayer } from './CurrentParticleLayer';

// Wind layers
export { WindParticleLayer } from './WindParticleLayer';
export { WindShadowLayer } from './WindShadowLayer';

// Bathymetry layers
export { BathymetryContourLayer } from './BathymetryContourLayer';

// Tactical layers
export {
  TacticalCurrentZones,
  getTacticalZoneFillLayerSpec,
  getTacticalZoneBorderLayerSpec,
  getTacticalZoneLabelLayerSpec,
  getTacticalZoneConfidenceLayerSpec,
  getAllTacticalZoneLayers,
  getZonesByType,
  getHighConfidenceZones,
  getActiveZones,
  sortZonesByAdvantage
} from './TacticalCurrentZones';
