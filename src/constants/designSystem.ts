/**
 * RegattaFlow Design System
 *
 * Semantic color definitions, component patterns, and usage guidelines
 * for consistent UI across the entire application.
 *
 * Last Updated: October 2025
 */

// =============================================================================
// COLOR SYSTEM
// =============================================================================

/**
 * Semantic Color Palette
 *
 * Each color has a specific purpose in the application.
 * Use these semantic names instead of raw color values.
 */
export const colors = {
  // PRIMARY - Core brand color (Blue)
  // Use for: Main navigation, primary CTAs, brand elements
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // Primary brand blue
    600: '#2563eb',  // Primary button background
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // AI & INTELLIGENCE - Purple gradient
  // Use for: ALL AI features, intelligent recommendations, agent-powered features
  ai: {
    50: '#faf5ff',
    100: '#f3e8ff',  // AI badge background
    200: '#e9d5ff',  // AI badge border
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',  // AI button background, AI card accents
    700: '#7e22ce',  // AI badge text
    800: '#6b21a8',
    900: '#581c87',
    gradient: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',  // AI card backgrounds
  },

  // SUCCESS - Green
  // Use for: Success states, confirmations, positive metrics
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',  // Success badge background
    200: '#bbf7d0',  // Success badge border
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',  // Success button background
    700: '#15803d',  // Success badge text
    800: '#166534',
    900: '#14532d',
  },

  // WARNING - Amber
  // Use for: Warnings, alerts that need attention but aren't errors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',  // Warning badge background
    200: '#fde68a',  // Warning badge border
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',  // Warning button background
    700: '#b45309',
    800: '#92400e',  // Warning badge text
    900: '#78350f',
  },

  // DANGER - Red
  // Use for: Destructive actions, errors, critical alerts
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',  // Error badge background
    200: '#fecaca',  // Error badge border
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',  // Danger button background
    700: '#b91c1c',  // Error badge text
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // INFO - Blue (lighter than primary)
  // Use for: Informational badges, tips, neutral highlights
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',  // Info badge background
    200: '#bae6fd',  // Info badge border
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',  // Info badge text
    800: '#075985',
    900: '#0c4a6e',
  },

  // NEUTRAL - Gray
  // Use for: Text, borders, backgrounds, secondary elements
  neutral: {
    50: '#f9fafb',   // Light backgrounds
    100: '#f3f4f6',  // Card backgrounds
    200: '#e5e7eb',  // Secondary button background, borders
    300: '#d1d5db',  // Disabled states
    400: '#9ca3af',  // Placeholder text
    500: '#6b7280',  // Secondary text (MINIMUM for readability)
    600: '#4b5563',  // Primary text
    700: '#374151',  // Headings
    800: '#1f2937',  // Dark text
    900: '#111827',  // Darkest text
  },

  // SEMANTIC COLORS - Use these for specific purposes
  text: {
    primary: '#111827',      // Main text (neutral-900)
    secondary: '#6b7280',    // Secondary text (neutral-500)
    tertiary: '#9ca3af',     // Tertiary text (neutral-400)
    disabled: '#d1d5db',     // Disabled text (neutral-300)
    inverse: '#ffffff',      // Text on dark backgrounds
    link: '#2563eb',         // Links (primary-600)
  },

  background: {
    primary: '#ffffff',      // Main background
    secondary: '#f9fafb',    // Secondary background (neutral-50)
    tertiary: '#f3f4f6',     // Card backgrounds (neutral-100)
    overlay: 'rgba(0, 0, 0, 0.5)',  // Modal overlays
  },

  border: {
    light: '#e5e7eb',        // Light borders (neutral-200)
    medium: '#d1d5db',       // Medium borders (neutral-300)
    dark: '#9ca3af',         // Dark borders (neutral-400)
  },
} as const;

// =============================================================================
// BUTTON SYSTEM
// =============================================================================

/**
 * Button Color Decision Tree:
 *
 * 1. Is this an AI-powered action?
 *    → YES: Use ai.600 (purple)
 *    → NO: Continue
 *
 * 2. Is this a destructive action (delete, remove, cancel subscription)?
 *    → YES: Use danger.600 (red)
 *    → NO: Continue
 *
 * 3. Is this the primary action on the page/screen?
 *    → YES: Use primary.600 (blue)
 *    → NO: Continue
 *
 * 4. Is this a secondary or cancel action?
 *    → YES: Use neutral.200 with text.primary
 */
export const buttons = {
  // PRIMARY - Main call-to-action
  // Examples: "Save", "Continue", "Submit", "Create Race"
  primary: {
    background: colors.primary[600],
    text: colors.text.inverse,
    hover: colors.primary[700],
    disabled: colors.neutral[300],
  },

  // AI - AI-powered actions
  // Examples: "Generate AI Strategy", "AI Course Prediction", "Ask AI Coach"
  ai: {
    background: colors.ai[600],
    text: colors.text.inverse,
    hover: colors.ai[700],
    gradient: colors.ai.gradient,
  },

  // DANGER - Destructive actions
  // Examples: "Delete", "Remove", "Cancel Subscription"
  danger: {
    background: colors.danger[600],
    text: colors.text.inverse,
    hover: colors.danger[700],
  },

  // SUCCESS - Confirmation actions
  // Examples: "Confirm", "Approve", "Accept"
  success: {
    background: colors.success[600],
    text: colors.text.inverse,
    hover: colors.success[700],
  },

  // SECONDARY - Secondary actions
  // Examples: "Cancel", "Back", "Skip"
  secondary: {
    background: colors.neutral[200],
    text: colors.text.primary,
    hover: colors.neutral[300],
  },

  // GHOST - Tertiary actions
  // Examples: "Learn More", "View Details"
  ghost: {
    background: 'transparent',
    text: colors.primary[600],
    hover: colors.neutral[100],
  },
} as const;

// =============================================================================
// BADGE SYSTEM
// =============================================================================

/**
 * Badge Color Decision Tree:
 *
 * 1. Does this badge indicate AI/intelligent feature?
 *    → YES: Use ai variant (purple)
 *    → NO: Continue
 *
 * 2. Does this indicate success/completion/active?
 *    → YES: Use success variant (green)
 *    → NO: Continue
 *
 * 3. Does this indicate warning/attention needed?
 *    → YES: Use warning variant (amber)
 *    → NO: Continue
 *
 * 4. Does this indicate error/critical?
 *    → YES: Use danger variant (red)
 *    → NO: Continue
 *
 * 5. Is this informational/neutral?
 *    → YES: Use info variant (blue)
 */
export const badges = {
  // AI - AI-powered features
  // Examples: "AI Generated", "AI Prediction", "AI Matched"
  ai: {
    background: colors.ai[100],
    border: colors.ai[200],
    text: colors.ai[700],
  },

  // SUCCESS - Positive states
  // Examples: "Active", "Completed", "Verified", "Published"
  success: {
    background: colors.success[100],
    border: colors.success[200],
    text: colors.success[700],
  },

  // WARNING - Attention needed
  // Examples: "Pending", "Expiring Soon", "Action Required"
  warning: {
    background: colors.warning[100],
    border: colors.warning[200],
    text: colors.warning[800],
  },

  // DANGER - Critical/Error states
  // Examples: "Failed", "Expired", "Cancelled", "Overdue"
  danger: {
    background: colors.danger[100],
    border: colors.danger[200],
    text: colors.danger[700],
  },

  // INFO - Informational
  // Examples: "Draft", "Scheduled", "In Progress", "Optional"
  info: {
    background: colors.info[100],
    border: colors.info[200],
    text: colors.info[700],
  },

  // NEUTRAL - Default/Generic
  // Examples: "New", "Member", "Standard"
  neutral: {
    background: colors.neutral[100],
    border: colors.neutral[200],
    text: colors.neutral[700],
  },
} as const;

// =============================================================================
// COMPONENT PATTERNS
// =============================================================================

/**
 * Common component color patterns
 */
export const components = {
  // CARDS
  card: {
    background: colors.background.tertiary,
    border: colors.border.light,
    shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  },

  // AI CARDS - Special styling for AI-powered features
  aiCard: {
    background: colors.background.tertiary,
    border: colors.ai[200],
    gradient: colors.ai.gradient,
    shadow: '0 4px 6px -1px rgba(147, 51, 234, 0.1), 0 2px 4px -1px rgba(147, 51, 234, 0.06)',
  },

  // INPUTS
  input: {
    background: colors.background.primary,
    border: colors.border.light,
    borderFocus: colors.primary[600],
    text: colors.text.primary,
    placeholder: colors.neutral[400],
    disabled: colors.neutral[100],
  },

  // NAVIGATION
  navigation: {
    background: colors.background.primary,
    border: colors.border.light,
    activeBackground: colors.primary[50],
    activeText: colors.primary[600],
    inactiveText: colors.text.secondary,
  },
} as const;

// =============================================================================
// USAGE GUIDELINES
// =============================================================================

/**
 * ACCESSIBILITY GUIDELINES
 *
 * All text must meet WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
 *
 * SAFE COMBINATIONS:
 * - text.primary (neutral-900) on background.primary (white) ✓
 * - text.secondary (neutral-500) on background.primary (white) ✓
 * - text.inverse (white) on primary.600 (blue) ✓
 * - text.inverse (white) on ai.600 (purple) ✓
 * - text.inverse (white) on danger.600 (red) ✓
 *
 * UNSAFE COMBINATIONS (DO NOT USE):
 * - text-primary-100 on bg-primary-500 ✗ (insufficient contrast)
 * - text-gray-400 on bg-white ✗ (use text-gray-500 minimum)
 * - text-gray-300 on bg-white ✗ (disabled states only)
 */

/**
 * AI FEATURE GUIDELINES
 *
 * ALL AI-powered features must use purple (ai) colors:
 * - AI buttons → bg-purple-600 (ai.600)
 * - AI badges → bg-purple-100, border-purple-200, text-purple-700
 * - AI cards → purple border or gradient accent
 * - AI icons → text-purple-600
 *
 * Examples:
 * - "Generate AI Strategy" button
 * - "AI Course Prediction" card
 * - "AI Venue Intelligence" section
 * - "AI Matched" badge on coaches
 * - "Ask AI Coach" feature
 */

/**
 * COLOR DECISION TREE FOR NEW FEATURES
 *
 * 1. Identify the element type:
 *    - Button? → Use buttons.* variants
 *    - Badge? → Use badges.* variants
 *    - Card? → Use components.card or components.aiCard
 *    - Text? → Use text.* variants
 *    - Background? → Use background.* variants
 *
 * 2. Identify the purpose:
 *    - AI feature? → Use ai colors (purple)
 *    - Primary action? → Use primary colors (blue)
 *    - Destructive? → Use danger colors (red)
 *    - Success/positive? → Use success colors (green)
 *    - Warning? → Use warning colors (amber)
 *    - Info/neutral? → Use info or neutral colors
 *
 * 3. Check accessibility:
 *    - Verify contrast ratio meets WCAG AA (4.5:1 minimum)
 *    - Use text.inverse (white) on colored backgrounds
 *    - Use text.secondary minimum for body text
 */

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get button styles based on variant
 */
export function getButtonStyles(variant: keyof typeof buttons) {
  return buttons[variant];
}

/**
 * Get badge styles based on variant
 */
export function getBadgeStyles(variant: keyof typeof badges) {
  return badges[variant];
}

/**
 * Check if a color combination meets WCAG AA contrast requirements
 */
export function hasValidContrast(foreground: string, background: string): boolean {
  // This is a placeholder - in production, use a proper contrast checker library
  // like 'wcag-contrast' or similar
  return true;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  colors,
  buttons,
  badges,
  components,
  getButtonStyles,
  getBadgeStyles,
  hasValidContrast,
};
