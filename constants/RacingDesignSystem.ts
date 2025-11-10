/**
 * Racing Design System
 *
 * Centralized design tokens for the Racing Tactical Console
 * Ensures consistent visual language across all racing modules
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const Colors = {
  // Primary (Racing)
  primary: {
    blue: '#3B82F6',      // Information, current
    green: '#10B981',     // Advantage, relief
    yellow: '#F59E0B',    // Caution
    red: '#EF4444',       // Danger, adverse
    purple: '#8B5CF6',    // Scenario mode
    cyan: '#06B6D4',      // Secondary info
  },

  // Depth Gradient (Shallow → Deep)
  depth: {
    veryShallow: '#E0F2FE',  // 0-5m
    shallow: '#BAE6FD',       // 5-10m
    moderate: '#7DD3FC',      // 10-20m
    deep: '#38BDF8',          // 20-30m
    deeper: '#0EA5E9',        // 30-50m
    veryDeep: '#0284C7',      // 50-100m
    extremelyDeep: '#0C4A6E', // 100m+
  },

  // Tactical Zones (with transparency)
  zones: {
    relief: 'rgba(16, 185, 129, 0.3)',        // Green 30%
    reliefBorder: 'rgba(16, 185, 129, 0.6)',  // Green 60%
    acceleration: 'rgba(239, 68, 68, 0.3)',   // Red 30%
    accelerationBorder: 'rgba(239, 68, 68, 0.6)', // Red 60%
    shear: 'rgba(139, 92, 246, 0.5)',         // Purple 50%
    shearBorder: 'rgba(139, 92, 246, 0.8)',   // Purple 80%
    leeBow: 'rgba(59, 130, 246, 0.3)',        // Blue 30%
    leeBowBorder: 'rgba(59, 130, 246, 0.6)',  // Blue 60%
    anchoring: 'rgba(245, 158, 11, 0.3)',     // Orange 30%
    anchoringBorder: 'rgba(245, 158, 11, 0.6)', // Orange 60%
    eddy: 'rgba(6, 182, 212, 0.3)',           // Cyan 30%
    eddyBorder: 'rgba(6, 182, 212, 0.6)',     // Cyan 60%
  },

  // Status Colors
  status: {
    safe: '#10B981',      // Green
    caution: '#F59E0B',   // Yellow
    danger: '#EF4444',    // Red
    info: '#3B82F6',      // Blue
    neutral: '#94A3B8',   // Gray
  },

  // Chip Types
  chip: {
    opportunity: {
      bg: '#D1FAE5',      // Light green
      border: '#6EE7B7',  // Green
      text: '#059669',    // Dark green
    },
    caution: {
      bg: '#FEF3C7',      // Light yellow
      border: '#FCD34D',  // Yellow
      text: '#D97706',    // Dark yellow
    },
    alert: {
      bg: '#FEE2E2',      // Light red
      border: '#FCA5A5',  // Red
      text: '#DC2626',    // Dark red
    },
    strategic: {
      bg: '#DBEAFE',      // Light blue
      border: '#60A5FA',  // Blue
      text: '#2563EB',    // Dark blue
    },
  },

  // UI Base Colors
  ui: {
    background: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceElevated: '#FFFFFF',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    divider: '#CBD5E1',
  },

  // Text Colors
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    tertiary: '#64748B',
    disabled: '#94A3B8',
    inverse: '#FFFFFF',
  },

  // Scenario Mode
  scenario: {
    overlay: 'rgba(139, 92, 246, 0.1)',
    border: '#8B5CF6',
    badge: '#A78BFA',
  },

  // Current Flow (Blue tones)
  current: {
    slow: '#BFDBFE',      // 0-0.5kt
    moderate: '#93C5FD',  // 0.5-1.0kt
    fast: '#60A5FA',      // 1.0-1.5kt
    veryFast: '#3B82F6',  // 1.5-2.0kt
    extreme: '#2563EB',   // 2.0+kt
  },

  // Wind (Gray/White tones)
  wind: {
    light: '#F1F5F9',
    moderate: '#CBD5E1',
    strong: '#94A3B8',
    veryStrong: '#64748B',
  },

  // Tide Phase
  tide: {
    flood: '#3B82F6',
    ebb: '#10B981',
    slack: '#94A3B8',
  },

  // Data Freshness
  freshness: {
    live: '#10B981',
    recent: '#F59E0B',
    stale: '#EF4444',
  },
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const Typography = {
  // Font Families
  fontFamily: {
    default: 'System',
    mono: 'Courier', // Fallback for Expo, will use system monospace
  },

  // Font Sizes
  fontSize: {
    // Instrument displays (large numbers)
    instrument: 36,

    // Headers
    h1: 24,
    h2: 20,
    h3: 18,
    h4: 16,

    // Body
    body: 14,
    bodySmall: 12,

    // Labels/Captions
    label: 14,
    caption: 11,
    micro: 10,
  },

  // Font Weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

// ============================================================================
// SPACING
// ============================================================================

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// ============================================================================
// SHADOWS
// ============================================================================

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2, // Android
  },

  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4, // Android
  },

  alert: {
    shadowColor: Colors.primary.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8, // Android
  },

  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

// ============================================================================
// OPACITY
// ============================================================================

export const Opacity = {
  transparent: 0,
  faint: 0.1,
  light: 0.3,
  medium: 0.5,
  heavy: 0.7,
  almostOpaque: 0.9,
  opaque: 1,
};

// ============================================================================
// Z-INDEX
// ============================================================================

export const ZIndex = {
  background: -1,
  base: 0,
  overlay: 10,
  chip: 20,
  modal: 30,
  dropdown: 40,
  tooltip: 50,
  alert: 60,
  safetyStrip: 100,
};

// ============================================================================
// ANIMATION
// ============================================================================

export const Animation = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 500,
  },

  easing: {
    linear: 'linear' as const,
    easeIn: 'ease-in' as const,
    easeOut: 'ease-out' as const,
    easeInOut: 'ease-in-out' as const,
  },
};

// ============================================================================
// BREAKPOINTS (for responsive layouts)
// ============================================================================

export const Breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};

// ============================================================================
// TOUCH TARGETS
// ============================================================================

export const TouchTargets = {
  minimum: 44,  // iOS Human Interface Guidelines minimum
  button: 44,
  toggle: 50,
  sliderThumb: 32,
  mapMarker: 40,
};

// ============================================================================
// COMPONENT-SPECIFIC CONSTANTS
// ============================================================================

export const Components = {
  // Map
  map: {
    defaultZoom: 13,
    minZoom: 8,
    maxZoom: 18,
    vectorOpacity: 0.7,
    particleOpacity: 0.45,
  },

  // Cards
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },

  // Chips
  chip: {
    height: 36,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    iconSize: 16,
  },

  // Timeline
  timeline: {
    height: 120,
    segmentMinWidth: 80,
    trackHeight: 4,
  },

  // Polar Dial
  polarDial: {
    size: 200,
    lineWidth: 2,
    targetZoneOpacity: 0.2,
  },

  // VMG Gauge
  vmgGauge: {
    height: 40,
    arcWidth: 8,
  },

  // Depth Safety Strip
  safetyStrip: {
    height: 48,
    heightExpanded: 320,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get depth color based on depth value
 */
export function getDepthColor(depth: number): string {
  if (depth >= 0) return Colors.depth.veryShallow;
  if (depth >= -5) return Colors.depth.shallow;
  if (depth >= -10) return Colors.depth.moderate;
  if (depth >= -20) return Colors.depth.deep;
  if (depth >= -30) return Colors.depth.deeper;
  if (depth >= -50) return Colors.depth.veryDeep;
  return Colors.depth.extremelyDeep;
}

/**
 * Get current color based on speed
 */
export function getCurrentColor(speed: number): string {
  if (speed < 0.5) return Colors.current.slow;
  if (speed < 1.0) return Colors.current.moderate;
  if (speed < 1.5) return Colors.current.fast;
  if (speed < 2.0) return Colors.current.veryFast;
  return Colors.current.extreme;
}

/**
 * Get status color based on clearance
 */
export function getClearanceStatus(clearance: number, draft: number): {
  status: 'safe' | 'caution' | 'danger';
  color: string;
} {
  if (clearance > draft + 3) {
    return { status: 'safe', color: Colors.status.safe };
  }
  if (clearance > draft + 1.5) {
    return { status: 'caution', color: Colors.status.caution };
  }
  return { status: 'danger', color: Colors.status.danger };
}

/**
 * Get chip colors based on type
 */
export function getChipColors(type: 'opportunity' | 'caution' | 'alert' | 'strategic') {
  return Colors.chip[type];
}

/**
 * Get tactical zone colors based on type
 */
export function getTacticalZoneColors(type: 'relief' | 'acceleration' | 'shear' | 'lee-bow' | 'anchoring' | 'eddy'): {
  fill: string;
  border: string;
} {
  switch (type) {
    case 'relief':
      return { fill: Colors.zones.relief, border: Colors.zones.reliefBorder };
    case 'acceleration':
      return { fill: Colors.zones.acceleration, border: Colors.zones.accelerationBorder };
    case 'shear':
      return { fill: Colors.zones.shear, border: Colors.zones.shearBorder };
    case 'lee-bow':
      return { fill: Colors.zones.leeBow, border: Colors.zones.leeBowBorder };
    case 'anchoring':
      return { fill: Colors.zones.anchoring, border: Colors.zones.anchoringBorder };
    case 'eddy':
      return { fill: Colors.zones.eddy, border: Colors.zones.eddyBorder };
  }
}

/**
 * Get tide phase color
 */
export function getTidePhaseColor(phase: 'flood' | 'ebb' | 'slack'): string {
  return Colors.tide[phase];
}

/**
 * Get data freshness color
 */
export function getFreshnessColor(minutes: number): string {
  if (minutes < 2) return Colors.freshness.live;
  if (minutes < 10) return Colors.freshness.recent;
  return Colors.freshness.stale;
}
