/**
 * useResponsiveLayout - Hook for responsive layout decisions
 *
 * Returns layout information based on platform and window width.
 * Used by MasterDetailLayout and other responsive components.
 */

import { Platform, useWindowDimensions } from 'react-native';
import { FEATURE_FLAGS } from '@/lib/featureFlags';

const MASTER_DETAIL_BREAKPOINT = 1024;
const MASTER_WIDTH = 380;

export type LayoutMode = 'single' | 'master-detail';

export interface ResponsiveLayout {
  /** Whether to show master-detail split view */
  showMasterDetail: boolean;
  /** Width of the master (list) pane */
  masterWidth: number;
  /** Layout mode for the current screen */
  layoutMode: LayoutMode;
  /** Current window width */
  windowWidth: number;
  /** Current window height */
  windowHeight: number;
}

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();

  const isWeb = Platform.OS === 'web';
  const featureEnabled = FEATURE_FLAGS.USE_MASTER_DETAIL_LAYOUT;
  const isWideEnough = width >= MASTER_DETAIL_BREAKPOINT;

  const showMasterDetail = isWeb && featureEnabled && isWideEnough;

  return {
    showMasterDetail,
    masterWidth: MASTER_WIDTH,
    layoutMode: showMasterDetail ? 'master-detail' : 'single',
    windowWidth: width,
    windowHeight: height,
  };
}
