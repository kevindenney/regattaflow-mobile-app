// Platform-specific CourseMapView
// This file automatically loads .native.tsx on iOS/Android and .web.tsx on web
import { Platform } from 'react-native';

const CourseMapView = Platform.select({
  native: () => require('./CourseMapView.native').default,
  web: () => require('./CourseMapView.web').default,
  default: () => require('./CourseMapView.native').default,
})();

export default CourseMapView;
