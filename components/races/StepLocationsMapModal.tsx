import { Platform } from 'react-native';

export const StepLocationsMapModal = Platform.select({
  native: () => require('./StepLocationsMapModal.native').StepLocationsMapModal,
  default: () => require('./StepLocationsMapModal.web').StepLocationsMapModal,
})();

export type { StepLocationMarker, StepLocationsMapModalProps } from './StepLocationsMapModal.web';

