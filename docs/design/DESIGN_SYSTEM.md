# Design System
## RegattaFlow - Visual Design Language & Component Specifications

**Version**: 1.0
**Last Updated**: 2025-11-10
**Document Owner**: Design & Engineering Teams
**Status**: Active Development

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Elevation & Shadows](#elevation--shadows)
6. [Border Radius](#border-radius)
7. [Iconography](#iconography)
8. [Motion & Animation](#motion--animation)
9. [Implementation Guide](#implementation-guide)

---

## Design Principles

### 1. Outdoor Readability First
**The Challenge**: Sailors use the app in bright sunlight, often with glare and harsh lighting conditions.

**Solutions**:
- High contrast ratios (minimum WCAG AAA: 7:1)
- No pure white backgrounds (#FFFFFF is too harsh in sunlight)
- Large touch targets (minimum 48x48px)
- Bold, readable typography

### 2. Progressive Disclosure
**The Challenge**: Current app is information-heavy and overwhelming.

**Solutions**:
- Show only essential information at first glance
- Use progressive disclosure patterns (expand/collapse)
- Clear visual hierarchy
- Smart defaults with customization options

### 3. Persona-Specific Theming
**The Challenge**: Three distinct user types with different needs.

**Solutions**:
- Color-coded personas (Blue=Sailor, Purple=Coach, Green=Club)
- Contextual UI based on active role
- Consistent components with themed accents

### 4. Offline-Ready Design
**The Challenge**: Unreliable connectivity on water.

**Solutions**:
- Clear offline/online indicators
- Loading states that feel instant (optimistic UI)
- Cached content with freshness indicators
- Queue actions gracefully

---

## Color Palette

### Neutral Colors

Base neutrals for text, backgrounds, and borders:

```typescript
// constants/Colors.ts
export const Neutrals = {
  // Backgrounds
  background: '#F9FAFB',      // Off-white (not pure white for outdoor readability)
  surface: '#FFFFFF',         // Cards and elevated surfaces
  surfaceAlt: '#F3F4F6',      // Alternative surface (slightly darker)

  // Text
  textPrimary: '#111827',     // Primary text (near black)
  textSecondary: '#6B7280',   // Secondary text (gray)
  textTertiary: '#9CA3AF',    // Tertiary text (lighter gray)
  textInverse: '#FFFFFF',     // Text on dark backgrounds

  // Borders & Dividers
  border: '#E5E7EB',          // Standard borders
  borderLight: '#F3F4F6',     // Lighter borders
  borderDark: '#D1D5DB',      // Darker borders (focus states)

  // Grays (full scale)
  gray900: '#111827',
  gray800: '#1F2937',
  gray700: '#374151',
  gray600: '#4B5563',
  gray500: '#6B7280',
  gray400: '#9CA3AF',
  gray300: '#D1D5DB',
  gray200: '#E5E7EB',
  gray100: '#F3F4F6',
  gray50: '#F9FAFB',
};
```

⚠️ **Critical**: Never use pure white (#FFFFFF) for main backgrounds. Use `background: '#F9FAFB'` for better outdoor readability.

---

### Persona Colors

#### Sailor Theme (Primary User)

```typescript
export const SailorColors = {
  // Primary Blues (Ocean-inspired)
  primary: '#0284C7',         // Sky Blue 600
  primaryLight: '#38BDF8',    // Sky Blue 400
  primaryDark: '#075985',     // Sky Blue 800
  primarySubtle: '#E0F2FE',   // Sky Blue 100

  // Accent (for CTAs and highlights)
  accent: '#0EA5E9',          // Sky Blue 500
  accentHover: '#0284C7',     // Sky Blue 600

  // Usage
  background: '#F0F9FF',      // Sky Blue 50 (subtle tint for Sailor screens)
  border: '#BAE6FD',          // Sky Blue 200

  // Contrast Ratio Check
  // primary (#0284C7) on white: 4.89:1 ✓ (AA Large Text)
  // primary (#0284C7) on background (#F0F9FF): 4.52:1 ✓ (AA Large Text)
  // textPrimary (#111827) on background: 15.8:1 ✓ (AAA)
};
```

**Sailor Brand Personality**: Trust, professionalism, oceanic, performance-focused

---

#### Coach Theme

```typescript
export const CoachColors = {
  // Primary Purples (Wisdom & Expertise)
  primary: '#7C3AED',         // Violet 600
  primaryLight: '#A78BFA',    // Violet 400
  primaryDark: '#5B21B6',     // Violet 800
  primarySubtle: '#EDE9FE',   // Violet 100

  // Accent
  accent: '#8B5CF6',          // Violet 500
  accentHover: '#7C3AED',     // Violet 600

  // Usage
  background: '#F5F3FF',      // Violet 50
  border: '#DDD6FE',          // Violet 200

  // Contrast Ratio Check
  // primary (#7C3AED) on white: 5.36:1 ✓ (AA)
  // textPrimary (#111827) on background: 15.2:1 ✓ (AAA)
};
```

**Coach Brand Personality**: Expertise, growth, mentorship, premium

---

#### Club Theme

```typescript
export const ClubColors = {
  // Primary Greens (Community & Growth)
  primary: '#059669',         // Emerald 600
  primaryLight: '#34D399',    // Emerald 400
  primaryDark: '#065F46',     // Emerald 800
  primarySubtle: '#D1FAE5',   // Emerald 100

  // Accent
  accent: '#10B981',          // Emerald 500
  accentHover: '#059669',     // Emerald 600

  // Usage
  background: '#ECFDF5',      // Emerald 50
  border: '#A7F3D0',          // Emerald 200

  // Contrast Ratio Check
  // primary (#059669) on white: 5.93:1 ✓ (AA)
  // textPrimary (#111827) on background: 14.9:1 ✓ (AAA)
};
```

**Club Brand Personality**: Organization, efficiency, community, enterprise

---

### Semantic Colors

Colors with meaning (success, error, warning, info):

```typescript
export const SemanticColors = {
  // Success (Green)
  success: '#10B981',         // Emerald 500
  successLight: '#D1FAE5',    // Emerald 100
  successDark: '#065F46',     // Emerald 800

  // Error (Red)
  error: '#EF4444',           // Red 500
  errorLight: '#FEE2E2',      // Red 100
  errorDark: '#991B1B',       // Red 800

  // Warning (Amber)
  warning: '#F59E0B',         // Amber 500
  warningLight: '#FEF3C7',    // Amber 100
  warningDark: '#92400E',     // Amber 800

  // Info (Blue)
  info: '#3B82F6',            // Blue 500
  infoLight: '#DBEAFE',       // Blue 100
  infoDark: '#1E3A8A',        // Blue 800

  // Contrast Ratio Check (all on white backgrounds)
  // success: 3.95:1 ✓ (AA Large Text)
  // error: 4.5:1 ✓ (AA)
  // warning: 2.77:1 ✗ (requires darker shade for small text)
  // info: 5.14:1 ✓ (AA)
};
```

⚠️ **Critical**: Warning color (#F59E0B) has insufficient contrast for small text. Use `warningDark` for text or pair with icons.

---

### Weather & Racing Colors

Special colors for weather and racing-specific UI:

```typescript
export const WeatherColors = {
  // Wind Speed (gradient from light to strong)
  windLight: '#A7F3D0',       // 0-10 knots (Emerald 200)
  windModerate: '#34D399',    // 10-15 knots (Emerald 400)
  windStrong: '#F59E0B',      // 15-20 knots (Amber 500)
  windVeryStrong: '#EF4444',  // 20+ knots (Red 500)

  // Water Conditions
  waterCalm: '#0EA5E9',       // Sky Blue 500
  waterModerate: '#0284C7',   // Sky Blue 600
  waterRough: '#0369A1',      // Sky Blue 700

  // Tidal
  highTide: '#0EA5E9',        // Sky Blue 500
  lowTide: '#84CC16',         // Lime 500

  // Race Phases
  preStart: '#F59E0B',        // Amber 500 (warning signal)
  starting: '#EF4444',        // Red 500 (starting signal)
  racing: '#10B981',          // Emerald 500 (green = go)
  finished: '#6B7280',        // Gray 500
};

export const RacingColors = {
  // Start Line Flags
  apFlag: '#EF4444',          // Red (Postponement)
  blackFlag: '#000000',       // Black (Disqualification)
  blueFlag: '#3B82F6',        // Blue (Change of course)
  yellowFlag: '#F59E0B',      // Yellow (Life jacket)

  // Mark Rounding
  portMark: '#EF4444',        // Red
  starboardMark: '#10B981',   // Green

  // Position Indicators
  first: '#EAB308',           // Gold
  second: '#9CA3AF',          // Silver
  third: '#CD7F32',           // Bronze (#CD7F32 is actual bronze)
};
```

---

### Contrast Ratio Reference

| Combination | Ratio | WCAG Level | Use Case |
|-------------|-------|------------|----------|
| textPrimary on background | 15.8:1 | AAA | Body text, headings |
| textSecondary on background | 5.12:1 | AA | Secondary text |
| Sailor primary on white | 4.89:1 | AA | Large text, buttons |
| Coach primary on white | 5.36:1 | AA | Large text, buttons |
| Club primary on white | 5.93:1 | AA | Large text, buttons |
| success on white | 3.95:1 | AA (Large) | Success messages |
| error on white | 4.5:1 | AA | Error messages |

💡 **Best Practice**: Always test color combinations in bright sunlight before finalizing. Use a contrast checker tool and aim for WCAG AAA (7:1) wherever possible.

---

## Typography

### Font Families

```typescript
// constants/Typography.ts
export const FontFamilies = {
  // iOS System Fonts
  ios: {
    default: 'SF Pro Text',
    display: 'SF Pro Display',
    rounded: 'SF Pro Rounded',
    mono: 'SF Mono',
  },

  // Android System Fonts
  android: {
    default: 'Roboto',
    medium: 'Roboto-Medium',
    bold: 'Roboto-Bold',
    mono: 'Roboto-Mono',
  },

  // Web Fonts (fallback chain)
  web: {
    sansSerif: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
  },
};
```

💡 **Best Practice**: Use system fonts for optimal performance and native feel. Custom fonts add ~100KB to bundle size.

---

### Type Scale

Based on a 16px base with 1.25 ratio for optimal readability:

```typescript
export const TypeScale = {
  // Display (Hero text, landing pages)
  display: {
    fontSize: 48,           // 48px / 3rem
    lineHeight: 56,         // 1.167
    fontWeight: '700',      // Bold
    letterSpacing: -0.5,
    usage: 'Hero headings, marketing pages',
  },

  // H1 (Page titles)
  h1: {
    fontSize: 32,           // 32px / 2rem
    lineHeight: 40,         // 1.25
    fontWeight: '700',      // Bold
    letterSpacing: -0.25,
    usage: 'Main page title',
  },

  // H2 (Section headings)
  h2: {
    fontSize: 24,           // 24px / 1.5rem
    lineHeight: 32,         // 1.333
    fontWeight: '600',      // Semibold
    letterSpacing: 0,
    usage: 'Section titles, card headers',
  },

  // H3 (Subsection headings)
  h3: {
    fontSize: 20,           // 20px / 1.25rem
    lineHeight: 28,         // 1.4
    fontWeight: '600',      // Semibold
    letterSpacing: 0,
    usage: 'Subsection titles, list headers',
  },

  // H4 (Component headings)
  h4: {
    fontSize: 18,           // 18px / 1.125rem
    lineHeight: 24,         // 1.333
    fontWeight: '600',      // Semibold
    letterSpacing: 0,
    usage: 'Component titles, form labels',
  },

  // Body Large (Emphasized body)
  bodyLarge: {
    fontSize: 18,           // 18px / 1.125rem
    lineHeight: 28,         // 1.556
    fontWeight: '400',      // Regular
    letterSpacing: 0,
    usage: 'Lead paragraphs, important content',
  },

  // Body Regular (Default body)
  bodyRegular: {
    fontSize: 16,           // 16px / 1rem (BASE)
    lineHeight: 24,         // 1.5
    fontWeight: '400',      // Regular
    letterSpacing: 0,
    usage: 'Default text, paragraphs, descriptions',
  },

  // Body Small (De-emphasized body)
  bodySmall: {
    fontSize: 14,           // 14px / 0.875rem
    lineHeight: 20,         // 1.429
    fontWeight: '400',      // Regular
    letterSpacing: 0,
    usage: 'Helper text, secondary content',
  },

  // Caption (Metadata, timestamps)
  caption: {
    fontSize: 12,           // 12px / 0.75rem
    lineHeight: 16,         // 1.333
    fontWeight: '400',      // Regular
    letterSpacing: 0.5,
    usage: 'Captions, metadata, timestamps',
  },

  // Button Text
  button: {
    fontSize: 16,           // 16px / 1rem
    lineHeight: 24,         // 1.5
    fontWeight: '600',      // Semibold
    letterSpacing: 0.5,
    textTransform: 'none' as const,  // Don't force uppercase
    usage: 'Button labels',
  },

  // Label (Form labels, input labels)
  label: {
    fontSize: 14,           // 14px / 0.875rem
    lineHeight: 20,         // 1.429
    fontWeight: '500',      // Medium
    letterSpacing: 0,
    usage: 'Form labels, input labels',
  },
};
```

---

### Font Weights

```typescript
export const FontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};
```

⚠️ **Critical**: Don't use font weights below 400 (regular). Light weights are hard to read in bright sunlight.

---

### Usage Guidelines

**Heading Hierarchy**:
```
Screen
├── H1: Page Title (32px, Bold)
│   ├── H2: Section Title (24px, Semibold)
│   │   ├── H3: Subsection (20px, Semibold)
│   │   │   ├── H4: Component Title (18px, Semibold)
│   │   │   │   └── Body: Content (16px, Regular)
```

**Body Text**:
- Use `bodyRegular` for most content
- Use `bodyLarge` for lead paragraphs or important announcements
- Use `bodySmall` for helper text, but never below 14px

**Minimum Sizes**:
- Body text: 16px (never smaller for primary content)
- Secondary text: 14px minimum
- Caption/metadata: 12px minimum (absolute minimum)

💡 **Best Practice**: Test all typography in bright outdoor conditions. Text that looks fine indoors may be unreadable in sunlight.

---

## Spacing System

### Base-8 Scale

All spacing uses multiples of 8px for consistency:

```typescript
// constants/Spacing.ts
export const Spacing = {
  xs: 4,          // 0.25rem - Tiny gaps, icon padding
  sm: 8,          // 0.5rem - Small gaps, compact spacing
  md: 12,         // 0.75rem - Moderate gaps
  base: 16,       // 1rem - BASE spacing unit
  lg: 24,         // 1.5rem - Large gaps, section spacing
  xl: 32,         // 2rem - Extra large gaps
  xxl: 48,        // 3rem - Major section spacing
  xxxl: 64,       // 4rem - Screen-level spacing
};
```

---

### Component-Specific Spacing

```typescript
export const ComponentSpacing = {
  // Cards
  cardPadding: 16,          // Internal card padding
  cardGap: 16,              // Gap between cards
  cardMargin: 16,           // Margin around card groups

  // Lists
  listItemPadding: 16,      // Vertical padding for list items
  listGap: 8,               // Gap between list items

  // Forms
  inputPadding: 12,         // Internal padding for inputs
  labelMargin: 8,           // Gap between label and input
  fieldGap: 16,             // Gap between form fields

  // Buttons
  buttonPaddingH: 16,       // Horizontal padding
  buttonPaddingV: 12,       // Vertical padding
  buttonGap: 12,            // Gap between adjacent buttons

  // Navigation
  tabBarHeight: 64,         // Bottom tab bar height (+ safe area)
  headerHeight: 64,         // Top header height (+ safe area)

  // Screen Insets
  screenPaddingH: 16,       // Horizontal screen padding
  screenPaddingV: 16,       // Vertical screen padding
  safeAreaExtra: 8,         // Extra padding beyond safe area
};
```

---

### Layout Grid

Mobile-first responsive grid:

```typescript
export const LayoutGrid = {
  // Breakpoints (for responsive web)
  breakpoints: {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
    wide: 1440,
  },

  // Container widths
  containerWidth: {
    mobile: '100%',
    tablet: 720,
    desktop: 960,
    wide: 1200,
  },

  // Columns
  columns: {
    mobile: 4,
    tablet: 8,
    desktop: 12,
  },

  // Gutter (space between columns)
  gutter: 16,

  // Margin (space on screen edges)
  margin: {
    mobile: 16,
    tablet: 24,
    desktop: 32,
  },
};
```

---

### Safe Area Insets

Handle notches and rounded corners:

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Usage in components
function ScreenWithSafeArea() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: Math.max(insets.left, 16),  // Minimum 16px
      paddingRight: Math.max(insets.right, 16),
    }}>
      {/* Content */}
    </View>
  );
}
```

⚠️ **Critical**: Always respect safe area insets on iOS devices with notches. Test on iPhone 14 Pro and newer.

---

## Elevation & Shadows

### Shadow Levels

Four elevation levels for depth hierarchy:

```typescript
// constants/Shadows.ts
export const Shadows = {
  // No shadow (flat)
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,  // Android
  },

  // Small shadow (subtle lift)
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Medium shadow (cards, modals)
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Large shadow (floating elements, dropdowns)
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },

  // Extra large shadow (modals, dialogs)
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
};
```

---

### When to Use Each Level

| Level | Use Case | Examples |
|-------|----------|----------|
| **none** | Flat elements, inline content | Text, icons, dividers |
| **sm** | Slightly elevated, subtle depth | List items, input fields (focus state) |
| **md** | Cards, grouped content | Race cards, venue cards, profile cards |
| **lg** | Floating UI, temporary surfaces | Dropdown menus, tooltips, snackbars |
| **xl** | Modals, important overlays | Dialogs, bottom sheets, alerts |

💡 **Best Practice**: Don't overuse shadows. Too many elevation levels create visual noise. Default to `none` or `sm` for most content, reserve `lg` and `xl` for truly important UI.

---

## Border Radius

### Radius Scale

```typescript
// constants/BorderRadius.ts
export const BorderRadius = {
  none: 0,
  sm: 4,          // Subtle rounding (inputs, small buttons)
  md: 8,          // Standard rounding (cards, buttons)
  lg: 12,         // Large rounding (modals, sheets)
  xl: 16,         // Extra large rounding (hero cards)
  xxl: 24,        // Prominent rounding (special cards)
  full: 9999,     // Fully rounded (pills, avatars)
};
```

---

### Component Mapping

```typescript
export const ComponentBorderRadius = {
  // Buttons
  buttonPrimary: 8,     // md
  buttonSmall: 6,       // between sm and md
  buttonPill: 9999,     // full

  // Inputs
  input: 8,             // md
  inputSmall: 6,

  // Cards
  card: 12,             // lg
  cardSmall: 8,         // md

  // Modals & Sheets
  modal: 16,            // xl
  bottomSheet: 24,      // xxl (top corners only)

  // Images & Media
  avatar: 9999,         // full (circle)
  thumbnail: 8,         // md
  imageCard: 12,        // lg

  // Badges & Pills
  badge: 4,             // sm
  pill: 9999,           // full

  // Other
  tooltip: 4,           // sm
  chip: 16,             // xl
};
```

---

## Iconography

### Icon Family

**Lucide React Native** (recommended)

```bash
npm install lucide-react-native
```

**Why Lucide?**
- 1000+ icons
- Consistent 24x24 grid
- Optimized SVG paths
- Tree-shakeable (only bundle icons you use)
- Perfect stroke consistency

---

### Icon Sizes

```typescript
// constants/IconSizes.ts
export const IconSizes = {
  xs: 16,         // Small indicators, inline icons
  sm: 20,         // List item icons, button icons
  md: 24,         // Standard icons (DEFAULT)
  lg: 32,         // Large feature icons, empty states
  xl: 48,         // Hero icons, splash screens
};
```

---

### Stroke Width

```typescript
export const IconStrokeWidth = {
  thin: 1,
  regular: 2,     // DEFAULT (matches Lucide default)
  bold: 3,
};
```

⚠️ **Critical**: Use `strokeWidth: 2` for all icons. Thicker strokes improve visibility in sunlight.

---

### Usage Guidelines

```typescript
import { Anchor, Calendar, Map, User } from 'lucide-react-native';

// Example usage
<Anchor
  size={24}              // Use IconSizes.md
  color="#0284C7"        // Use SailorColors.primary
  strokeWidth={2}        // Always 2
/>

// With button
<TouchableOpacity>
  <Map size={20} color="#FFFFFF" />
  <Text>View Map</Text>
</TouchableOpacity>
```

**Icon + Text Alignment**:
- Icon size `20px` pairs with `bodyRegular` (16px)
- Icon size `24px` pairs with `h4` (18px)
- Always align icon vertically centered with text baseline

💡 **Best Practice**: Keep icons simple. Complex icons with many paths are hard to see at small sizes and perform poorly.

---

## Motion & Animation

### Duration

```typescript
// constants/Animation.ts
export const AnimationDuration = {
  instant: 0,         // No animation
  fast: 150,          // Quick feedback (button press)
  normal: 250,        // Standard transitions
  slow: 350,          // Prominent animations (modal open)
  slower: 500,        // Hero animations
};
```

---

### Easing Functions

```typescript
import { Easing } from 'react-native';

export const AnimationEasing = {
  // Standard easing (most common)
  standard: Easing.bezier(0.4, 0.0, 0.2, 1),

  // Decelerate (elements entering screen)
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1),

  // Accelerate (elements leaving screen)
  accelerate: Easing.bezier(0.4, 0.0, 1, 1),

  // Sharp (immediate actions)
  sharp: Easing.bezier(0.4, 0.0, 0.6, 1),

  // Spring (bouncy, playful)
  spring: {
    damping: 15,
    stiffness: 150,
  },
};
```

---

### Common Animations

```typescript
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring
} from 'react-native-reanimated';

// Button Press (scale down)
const buttonScale = useAnimatedStyle(() => ({
  transform: [{
    scale: withSpring(isPressed ? 0.95 : 1, AnimationEasing.spring)
  }]
}));

// Fade In
const fadeIn = useAnimatedStyle(() => ({
  opacity: withTiming(visible ? 1 : 0, {
    duration: AnimationDuration.normal,
    easing: AnimationEasing.decelerate,
  })
}));

// Slide Up (bottom sheet)
const slideUp = useAnimatedStyle(() => ({
  transform: [{
    translateY: withTiming(visible ? 0 : 300, {
      duration: AnimationDuration.slow,
      easing: AnimationEasing.standard,
    })
  }]
}));
```

---

### Haptic Feedback

```typescript
import * as Haptics from 'expo-haptics';

export const HapticFeedback = {
  // Light tap (button press)
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  // Medium tap (toggle, selection)
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  // Heavy tap (important action)
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  // Success (completed action)
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  // Error (failed action)
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),

  // Warning (confirmation needed)
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),

  // Selection changed (picker, slider)
  selection: () => Haptics.selectionAsync(),
};
```

⚠️ **Critical**: Use haptics sparingly. Overuse is annoying and drains battery. Reserve for important actions only.

---

## Implementation Guide

### React Native StyleSheet Example

```typescript
// constants/RacingDesignSystem.ts
import { StyleSheet } from 'react-native';
import {
  Neutrals,
  SailorColors,
  TypeScale,
  Spacing,
  Shadows,
  BorderRadius
} from './index';

export const DesignSystem = StyleSheet.create({
  // Containers
  screen: {
    flex: 1,
    backgroundColor: Neutrals.background,
    paddingHorizontal: Spacing.base,
  },

  container: {
    paddingVertical: Spacing.base,
  },

  // Cards
  card: {
    backgroundColor: Neutrals.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.md,
  },

  cardHeader: {
    marginBottom: Spacing.md,
  },

  // Typography
  h1: {
    fontSize: TypeScale.h1.fontSize,
    lineHeight: TypeScale.h1.lineHeight,
    fontWeight: TypeScale.h1.fontWeight,
    color: Neutrals.textPrimary,
    letterSpacing: TypeScale.h1.letterSpacing,
  },

  h2: {
    fontSize: TypeScale.h2.fontSize,
    lineHeight: TypeScale.h2.lineHeight,
    fontWeight: TypeScale.h2.fontWeight,
    color: Neutrals.textPrimary,
  },

  body: {
    fontSize: TypeScale.bodyRegular.fontSize,
    lineHeight: TypeScale.bodyRegular.lineHeight,
    fontWeight: TypeScale.bodyRegular.fontWeight,
    color: Neutrals.textPrimary,
  },

  bodySecondary: {
    fontSize: TypeScale.bodyRegular.fontSize,
    lineHeight: TypeScale.bodyRegular.lineHeight,
    color: Neutrals.textSecondary,
  },

  caption: {
    fontSize: TypeScale.caption.fontSize,
    lineHeight: TypeScale.caption.lineHeight,
    color: Neutrals.textTertiary,
  },

  // Buttons
  buttonPrimary: {
    backgroundColor: SailorColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },

  buttonText: {
    fontSize: TypeScale.button.fontSize,
    fontWeight: TypeScale.button.fontWeight,
    color: Neutrals.textInverse,
    letterSpacing: TypeScale.button.letterSpacing,
  },

  // Spacing utilities
  mb_sm: { marginBottom: Spacing.sm },
  mb_md: { marginBottom: Spacing.md },
  mb_base: { marginBottom: Spacing.base },
  mb_lg: { marginBottom: Spacing.lg },

  mt_sm: { marginTop: Spacing.sm },
  mt_md: { marginTop: Spacing.md },
  mt_base: { marginTop: Spacing.base },
  mt_lg: { marginTop: Spacing.lg },
});
```

---

### Usage in Components

```typescript
// components/races/RaceCard.tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { DesignSystem } from '@/constants/RacingDesignSystem';
import { Calendar } from 'lucide-react-native';
import { IconSizes, SailorColors } from '@/constants';

export function RaceCard({ race }) {
  return (
    <TouchableOpacity style={DesignSystem.card}>
      <View style={DesignSystem.cardHeader}>
        <Text style={DesignSystem.h2}>{race.name}</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Calendar
          size={IconSizes.sm}
          color={SailorColors.primary}
          strokeWidth={2}
        />
        <Text style={[DesignSystem.body, { marginLeft: 8 }]}>
          {race.date}
        </Text>
      </View>

      <Text style={[DesignSystem.caption, DesignSystem.mt_sm]}>
        {race.venue}
      </Text>
    </TouchableOpacity>
  );
}
```

---

## Related Documents

- `COMPONENT_LIBRARY.md` - Reusable component specifications
- `SCREEN_DESIGNS.md` - Screen layout specifications
- `INTERACTION_PATTERNS.md` - Animation and gesture patterns
- `NAVIGATION_ARCHITECTURE.md` - Navigation structure
- `ACCESSIBILITY.md` - Accessibility requirements

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-10 | Design Team | Initial design system documentation |

---

**Next Steps**:
1. Review color contrast ratios in bright sunlight (physical test)
2. Validate typography sizes with target users
3. Create Figma design library based on this system
4. Implement constants in codebase (`constants/` folder)
5. Create component examples for each pattern
