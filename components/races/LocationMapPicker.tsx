/**
 * LocationMapPicker - Platform-aware map picker for race location selection
 *
 * Routes to native (react-native-maps) or web (Leaflet) implementation.
 */

import { Platform } from 'react-native';

// Platform-specific imports using require to avoid bundling issues
export const LocationMapPicker = Platform.select({
  native: () => require('./LocationMapPicker.native').LocationMapPicker,
  default: () => require('./LocationMapPicker.web').LocationMapPicker,
})();

// Re-export types for convenience
export type { LocationMapPickerProps } from './LocationMapPicker.native';
