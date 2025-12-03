# Tufte Visual Design Implementation Plan
## RegattaFlow - Color, Contrast, Repetition, Alignment & Proximity

**Version**: 1.0
**Date**: 2025-11-29
**Based on**: Edward Tufte's "Envisioning Information" + "Beautiful Evidence"
**Status**: Planning Phase
**Team**: Design & Engineering

---

## Table of Contents

1. [Coloration](#1-coloration)
2. [Contrast](#2-contrast)
3. [Repetition](#3-repetition)
4. [Alignment](#4-alignment)
5. [Proximity](#5-proximity)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Component-by-Component Plan](#component-by-component-plan)

---

## 1. COLORATION

### Tufte's Teachings on Color

> "Color is a difficult visual variable, more difficult than most practitioners recognize." - Tufte, Envisioning Information

**Key Principles from Tufte**:
- Use color to **label** (identify classes of information)
- Use color to **measure** (represent quantity)
- Use color to **represent reality** (natural mappings)
- Use color to **enliven or decorate** ONLY after functional use
- Avoid "color gratuitous" - color without information purpose

### Current State Analysis

**Issues in RegattaFlow**:
```tsx
// ❌ Decorative gradients (no data meaning)
<LinearGradient colors={['#1E3A8A', '#3B82F6', '#60A5FA']} />

// ❌ Arbitrary theme colors
const SailorColors = { primary: '#0284C7' } // Why blue? What does it mean?

// ❌ Emoji substitutes for data
<Text>📍 {venue}</Text>
```

### Tufte-Inspired Color Strategy

#### A. Functional Color Mapping

**Wind Speed** (measure quantity):
```typescript
const WindColorScale = {
  // Natural progression: light → dark as intensity increases
  calm: '#A7F3D0',      // 0-5 kts  (light green - calm)
  light: '#34D399',      // 5-10 kts (green - light)
  moderate: '#0EA5E9',   // 10-15 kts (blue - moderate)
  fresh: '#F59E0B',      // 15-20 kts (amber - fresh)
  strong: '#EF4444',     // 20-25 kts (red - strong)
  gale: '#991B1B',       // 25+ kts (dark red - danger)
};

// Functional usage:
const getWindColor = (speed: number) => {
  if (speed < 5) return WindColorScale.calm;
  if (speed < 10) return WindColorScale.light;
  if (speed < 15) return WindColorScale.moderate;
  if (speed < 20) return WindColorScale.fresh;
  if (speed < 25) return WindColorScale.strong;
  return WindColorScale.gale;
};
```

**Tactical Advantage** (measure favorability):
```typescript
const TacticalColorScale = {
  favorable: '#10B981',    // Green = go, advantage
  neutral: '#6B7280',      // Gray = neither
  unfavorable: '#EF4444',  // Red = avoid, disadvantage
};

// Applied to:
// - Current flow (favorable/unfavorable)
// - Wind shifts (lift/header)
// - Tidal zones
// - Strategic positions on course
```

**Performance vs Fleet** (measure relative position):
```typescript
const PerformanceColorScale = {
  topQuartile: '#10B981',     // Green (top 25%)
  aboveAverage: '#84CC16',    // Light green (25-50%)
  belowAverage: '#F59E0B',    // Amber (50-75%)
  bottomQuartile: '#EF4444',  // Red (bottom 25%)
};
```

#### B. Color for Labeling (Classes)

**Race Phases** (label distinct states):
```typescript
const RacePhaseColors = {
  preStart: '#F59E0B',    // Amber (warning)
  starting: '#EF4444',    // Red (alert)
  racing: '#10B981',      // Green (go)
  finished: '#6B7280',    // Gray (complete)
  postponed: '#8B5CF6',   // Purple (exception)
};
```

**Mark Types** (label course features):
```typescript
const MarkColors = {
  windward: '#0EA5E9',     // Blue (upwind)
  leeward: '#10B981',      // Green (downwind)
  offset: '#F59E0B',       // Amber (offset)
  gate: '#8B5CF6',         // Purple (gate)
  finish: '#000000',       // Black (finish)
};
```

#### C. Natural Color Mappings

**Environmental Reality**:
```typescript
const NaturalColors = {
  // Water depth (natural gradient)
  shallowWater: '#93C5FD',    // Light blue
  deepWater: '#1E3A8A',       // Dark blue

  // Land/shoreline
  land: '#78716C',            // Stone gray
  beach: '#FEF3C7',           // Sand

  // Weather
  clearSky: '#DBEAFE',        // Light blue
  cloudySky: '#9CA3AF',       // Gray
  stormSky: '#374151',        // Dark gray
};
```

### Implementation Plan: Color

**Phase 1: Establish Functional Color System**
```typescript
// File: constants/TufteFunctionalColors.ts

export const FunctionalColors = {
  // MEASURE: Quantitative scales
  windSpeed: WindColorScale,
  performance: PerformanceColorScale,
  tactical: TacticalColorScale,

  // LABEL: Categorical classes
  racePhase: RacePhaseColors,
  markType: MarkColors,

  // REALITY: Natural mappings
  environment: NaturalColors,

  // NEUTRAL: Non-data elements (minimal use)
  neutral: {
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    background: '#F9FAFB',
  },
};
```

**Phase 2: Remove Decorative Color**
- ❌ Remove all gradient backgrounds
- ❌ Remove arbitrary theme colors (sailor=blue, coach=purple)
- ❌ Remove colored backgrounds that don't encode data
- ✅ Keep ONLY functional color (measure, label, reality)

**Phase 3: Color Testing**
- Test all colors in bright sunlight (outdoor use case)
- Verify WCAG AAA contrast (7:1 minimum)
- Test colorblind accessibility (use patterns as backup)

---

## 2. CONTRAST

### Tufte's Teachings on Contrast

> "Confusion and clutter are failures of design, not attributes of information." - Tufte

**Key Principles**:
- High contrast for critical information
- Subtle contrast for supporting elements
- Use contrast to create hierarchy, not decoration
- Typography contrast > color contrast

### Current State Analysis

**Issues**:
```tsx
// ❌ Low contrast text (poor outdoor readability)
color: '#9CA3AF' // On #FFFFFF background = 2.9:1 (FAIL)

// ❌ Excessive shadows creating false hierarchy
shadowOpacity: 0.2, shadowRadius: 16 // Too heavy

// ❌ Everything emphasized = nothing emphasized
fontWeight: '700' // on every text element
```

### Tufte-Inspired Contrast Strategy

#### A. Typographic Contrast Hierarchy

**Information Importance Levels**:
```typescript
const TypographicHierarchy = {
  critical: {
    // Race-critical data (current wind, countdown, position)
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',        // Near-black (21:1 contrast)
    letterSpacing: -0.5,
  },

  primary: {
    // Primary data (race name, time, conditions)
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',        // Near-black
    letterSpacing: 0,
  },

  secondary: {
    // Supporting data (labels, context)
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',        // Dark gray (12:1 contrast)
    letterSpacing: 0,
  },

  tertiary: {
    // Metadata (timestamps, sources)
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',        // Medium gray (5.7:1 contrast - AA)
    letterSpacing: 0.3,
  },
};
```

**Usage Rules**:
- Use ONLY 3-4 contrast levels (avoid middle-ground weights)
- Increase contrast through **size + weight**, not just color
- Reserve bold (700) for critical information only

#### B. Visual Contrast Grid

**Contrast Ratios for Outdoor Use**:
```typescript
const ContrastRatios = {
  // WCAG AAA (7:1+) - Required for outdoor
  critical: {
    foreground: '#111827',  // 21:1 on white
    background: '#FFFFFF',
  },

  // WCAG AA (4.5:1) - Acceptable for secondary
  secondary: {
    foreground: '#374151',  // 12.6:1 on white
    background: '#FFFFFF',
  },

  // Minimum readable (3:1) - ONLY for tertiary metadata
  tertiary: {
    foreground: '#6B7280',  // 5.7:1 on white
    background: '#FFFFFF',
  },
};
```

**Testing Matrix**:
| Element Type | Foreground | Background | Ratio | Pass? | Use Case |
|-------------|------------|------------|-------|-------|----------|
| Critical data | #111827 | #FFFFFF | 21:1 | AAA | Wind speed, position |
| Primary data | #111827 | #F9FAFB | 19.3:1 | AAA | Race name, times |
| Secondary | #374151 | #FFFFFF | 12.6:1 | AAA | Labels, context |
| Tertiary | #6B7280 | #FFFFFF | 5.7:1 | AA | Timestamps |
| Error | #991B1B | #FFFFFF | 10.4:1 | AAA | Warnings |

#### C. Layering Through Subtle Contrast

**Tufte's "Layering and Separation" Technique**:
```typescript
const LayeringContrast = {
  // Layer 1: Background
  layer1: '#FFFFFF',

  // Layer 2: Surface (cards)
  layer2: '#F9FAFB',        // Barely perceptible (1.04:1)

  // Layer 3: Grouped elements
  layer3: '#F3F4F6',        // Subtle (1.08:1)

  // Borders: Minimal, functional only
  borderSubtle: '#F3F4F6',  // Barely visible
  borderVisible: '#E5E7EB', // Clearly visible when needed
};
```

**Application**:
- Use subtle background tints to group related data
- Avoid heavy borders (use whitespace instead)
- Reserve strong borders for critical boundaries only

### Implementation Plan: Contrast

**Phase 1: Establish Contrast Scale**
```typescript
// File: constants/TufteContrastSystem.ts

export const ContrastSystem = {
  typography: TypographicHierarchy,
  ratios: ContrastRatios,
  layering: LayeringContrast,
};
```

**Phase 2: Audit & Fix Low Contrast**
- Identify all text with < 7:1 contrast
- Replace with appropriate hierarchy level
- Test in actual sunlight

**Phase 3: Simplify Shadows**
- Reduce all shadows to single level: `shadowOpacity: 0.05, shadowRadius: 2`
- Remove shadows entirely from inline elements
- Keep only for true elevation (modals, overlays)

---

## 3. REPETITION

### Tufte's Teachings on Repetition

> "What is to be sought in designs for the display of information is the clear portrayal of complexity through consistency." - Tufte

**Key Principles**:
- Consistent representation = easier comprehension
- Small multiples require identical formats
- Repetition creates predictability (cognitive ease)
- Break repetition ONLY to signal exceptions

### Current State Analysis

**Issues**:
```tsx
// ❌ Inconsistent data formatting
<Text>15 kts</Text>          // Sometimes abbreviated
<Text>15 knots</Text>        // Sometimes full word
<Text>~15</Text>             // Sometimes approximate

// ❌ Inconsistent layouts across similar cards
<RaceCard /> // Different structure than
<WeatherCard /> // Different structure

// ❌ Inconsistent spacing
marginBottom: 8  // Some cards
marginBottom: 12 // Other cards
marginBottom: 16 // Still others
```

### Tufte-Inspired Repetition Strategy

#### A. Data Format Standards

**Wind Speed** (always same format):
```typescript
const formatWindSpeed = (speed: number): string => {
  return `${speed.toFixed(1)} kts`;  // ALWAYS: "15.2 kts"
};

// Never vary:
// ❌ "15 knots"
// ❌ "~15 kts"
// ❌ "15kts"
```

**Time** (always same precision):
```typescript
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  // ALWAYS: "13:45:32"
};
```

**Direction** (always same format):
```typescript
const formatDirection = (degrees: number): string => {
  const cardinal = getCardinal(degrees);
  return `${cardinal} (${degrees.toString().padStart(3, '0')}°)`;
  // ALWAYS: "NE (055°)"
};
```

#### B. Component Repetition Patterns

**Card Structure Template**:
```typescript
// Every card follows SAME structure:
interface StandardCardLayout {
  header: {
    title: string;
    metadata: string;      // "Updated 2m ago"
    status?: 'live' | 'forecast' | 'historical';
  };

  primaryData: {
    value: number;
    unit: string;
    sparkline?: number[];
  };

  secondaryData: Array<{
    label: string;
    value: string;
  }>;

  comparison?: {
    baseline: number;
    delta: number;
    context: string;       // "vs. historical avg"
  };
}
```

**Small Multiples Consistency**:
```typescript
// ALL small multiples use IDENTICAL:
const SmallMultipleStandard = {
  width: 120,              // Always same width
  height: 80,              // Always same height
  sparklineHeight: 30,     // Always same sparkline
  fontSize: 13,            // Always same text size
  layout: 'vertical',      // Always same layout
};
```

#### C. Spacing Repetition

**8-Point Grid System** (Tufte advocates mathematical consistency):
```typescript
const SpacingScale = {
  xs: 4,    // 0.5 × base
  sm: 8,    // 1 × base (BASE UNIT)
  md: 16,   // 2 × base
  lg: 24,   // 3 × base
  xl: 32,   // 4 × base
  xxl: 48,  // 6 × base
};

// NEVER use arbitrary values:
// ❌ marginBottom: 13
// ❌ padding: 18
// ✅ marginBottom: 16  (md)
// ✅ padding: 24       (lg)
```

### Implementation Plan: Repetition

**Phase 1: Standardize Data Formatters**
```typescript
// File: utils/tufteFormatters.ts

export const TufteFormatters = {
  windSpeed: formatWindSpeed,
  time: formatTime,
  direction: formatDirection,
  distance: formatDistance,
  position: formatPosition,
};

// Use EVERYWHERE - no exceptions
```

**Phase 2: Create Standard Card Template**
```typescript
// File: components/viz/StandardCard.tsx

export function StandardCard({
  header,
  primaryData,
  secondaryData,
  comparison,
}: StandardCardLayout) {
  // ALL cards use this template
  // Consistent structure, spacing, typography
}
```

**Phase 3: Enforce Spacing Grid**
```typescript
// File: constants/TufteSpacing.ts

export const TufteSpacing = SpacingScale;

// ESLint rule: Flag any spacing not in scale
// "no-arbitrary-spacing": ["error"]
```

---

## 4. ALIGNMENT

### Tufte's Teachings on Alignment

> "Good design is as little design as possible." - Tufte (paraphrasing Dieter Rams)

**Key Principles**:
- Align to a precise grid
- Minimize alignment points (complexity)
- Left-align text, right-align numbers
- Use alignment to show relationships

### Current State Analysis

**Issues**:
```tsx
// ❌ Centered everything (weak alignment)
textAlign: 'center'

// ❌ No grid system (random positioning)
marginLeft: 23
paddingRight: 17

// ❌ Numbers not aligned (hard to compare)
<Text>15.2 kts</Text>
<Text>8 kts</Text>  // Not tabular, hard to compare
```

### Tufte-Inspired Alignment Strategy

#### A. Grid-Based Alignment

**12-Column Responsive Grid**:
```typescript
const TufteGrid = {
  columns: 12,
  gutterWidth: 16,     // Between columns
  marginWidth: 16,     // Screen edges

  // Breakpoints (responsive)
  mobile: {
    containerWidth: '100%',
    columnWidth: (screenWidth - 32) / 12,  // Account for margins
  },

  tablet: {
    containerWidth: 720,
    columnWidth: (720 - 32) / 12,
  },

  desktop: {
    containerWidth: 960,
    columnWidth: (960 - 32) / 12,
  },
};
```

**Column Spans**:
```typescript
// Example: Weather card layout
<View style={{ flexDirection: 'row' }}>
  {/* Primary data: 4 columns */}
  <View style={{ width: columnWidth * 4 }}>
    <Text>Wind: 15.2 kts</Text>
  </View>

  {/* Sparkline: 6 columns */}
  <View style={{ width: columnWidth * 6 }}>
    <Sparkline data={history} />
  </View>

  {/* Metadata: 2 columns */}
  <View style={{ width: columnWidth * 2 }}>
    <Text>2m ago</Text>
  </View>
</View>
```

#### B. Text Alignment Rules

**Tufte's Alignment Principles**:
```typescript
const TextAlignment = {
  // Labels: Always left-align
  labels: {
    textAlign: 'left',
  },

  // Numbers: Always right-align (for comparison)
  numbers: {
    textAlign: 'right',
    fontVariant: ['tabular-nums'],  // Monospace digits
  },

  // Mixed (label + value): Justify
  labelValue: {
    justifyContent: 'space-between',
  },

  // NEVER center (except headings)
  // ❌ textAlign: 'center'
};
```

**Table Example**:
```
Label          Value
─────────────────────
Wind Speed     15.2  ← Right-aligned
Direction       055  ← Right-aligned
Gusts          18.1  ← Right-aligned
─────────────────────
```

#### C. Baseline Alignment

**Align to text baseline** (not container edges):
```typescript
const BaselineAlignment = {
  // Value + unit should share baseline
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',  // NOT 'center'
  },

  // Example:
  // 15.2 kts  ← Both on same baseline
  //     ↑↑↑
};
```

### Implementation Plan: Alignment

**Phase 1: Establish Grid System**
```typescript
// File: constants/TufteGrid.ts

export const TufteGrid = { /* as above */ };

// Helper functions
export const getColumnWidth = (span: number) => columnWidth * span;
export const getGutterWidth = () => gutterWidth;
```

**Phase 2: Create Alignment Components**
```typescript
// File: components/layout/GridContainer.tsx

export function GridContainer({ children, span = 12 }) {
  return (
    <View style={{ width: getColumnWidth(span) }}>
      {children}
    </View>
  );
}

// File: components/layout/AlignedText.tsx

export function AlignedNumber({ value, unit }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end' }}>
      <Text style={{ fontVariant: ['tabular-nums'] }}>{value}</Text>
      <Text style={{ marginLeft: 4 }}>{unit}</Text>
    </View>
  );
}
```

**Phase 3: Enforce Alignment Rules**
- Left-align all labels
- Right-align all numbers
- Use tabular nums for comparisons
- Snap all elements to 8pt grid

---

## 5. PROXIMITY

### Tufte's Teachings on Proximity

> "Closely position together elements of information that belong together functionally." - Tufte

**Key Principles**:
- Group related data closely
- Separate unrelated data with whitespace
- Reduce space between related items
- Increase space between different groups

### Current State Analysis

**Issues**:
```tsx
// ❌ Related data far apart
<Text>Wind Speed</Text>
<View style={{ marginTop: 16 }} />
<Text>15 kts</Text>  // Too far from label

// ❌ Unrelated data too close
<Text>Wind: 15 kts</Text>
<Text style={{ marginTop: 4 }}>Race: Championship</Text>  // Unrelated

// ❌ Equal spacing everywhere (no grouping signal)
gap: 16  // Between ALL elements
```

### Tufte-Inspired Proximity Strategy

#### A. Proximity Hierarchy

**Distance = Relationship Strength**:
```typescript
const ProximityScale = {
  // Tightly related (same data point)
  veryClose: 2,      // Label + value

  // Related (same category)
  close: 8,          // Multiple values in same category

  // Loosely related (different categories, same section)
  moderate: 16,      // Between data categories

  // Unrelated (different sections)
  far: 32,           // Between major sections

  // Completely separate (different contexts)
  veryFar: 48,       // Between cards/screens
};
```

**Visual Example**:
```
Wind Speed          ← Label
15.2 kts           ← Value (2px gap - VERY CLOSE)
                   (8px gap)
Direction          ← Related label
NE (055°)          ← Value (2px gap)
                   (16px gap)
Gusts              ← Different category
18.1 kts           ← Value
                   (32px gap - FAR)
═══════════════════
RACE INFORMATION   ← Different section (48px gap - VERY FAR)
```

#### B. Grouping Patterns

**Data Point Group**:
```typescript
// TIGHT grouping (label + value + unit)
<View style={{ gap: 2 }}>
  <Text style={styles.label}>Wind Speed</Text>
  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
    <Text style={styles.value}>15.2</Text>
    <Text style={styles.unit}>kts</Text>
  </View>
</View>
```

**Category Group**:
```typescript
// MODERATE grouping (multiple related data points)
<View style={{ gap: 8 }}>
  <DataPoint label="Wind Speed" value="15.2" unit="kts" />
  <DataPoint label="Direction" value="NE (055°)" />
  <DataPoint label="Gusts" value="18.1" unit="kts" />
</View>
```

**Section Group**:
```typescript
// FAR separation (different sections)
<View style={{ gap: 32 }}>
  <Section title="Wind Conditions">
    {/* Wind data points */}
  </Section>

  <Section title="Race Information">
    {/* Race data points */}
  </Section>
</View>
```

#### C. Tufte's "Small Multiples" Proximity

**Tight repetition with minimal separation**:
```typescript
// Small multiples should be VERY close together
<View style={{ gap: 0 }}>  {/* NO gap - share borders */}
  <SmallMultiple data={race1} />
  <SmallMultiple data={race2} />
  <SmallMultiple data={race3} />
</View>

// NOT:
<View style={{ gap: 16 }}>  {/* ❌ Too much separation */}
```

### Implementation Plan: Proximity

**Phase 1: Define Proximity Constants**
```typescript
// File: constants/TufteProximity.ts

export const TufteProximity = ProximityScale;

// Helper function
export const getProximity = (relationship: 'veryClose' | 'close' | 'moderate' | 'far' | 'veryFar') => {
  return TufteProximity[relationship];
};
```

**Phase 2: Create Grouping Components**
```typescript
// File: components/layout/DataGroup.tsx

export function DataGroup({
  children,
  relationship = 'close',
}: {
  children: React.ReactNode;
  relationship?: keyof typeof TufteProximity;
}) {
  return (
    <View style={{ gap: getProximity(relationship) }}>
      {children}
    </View>
  );
}
```

**Phase 3: Audit & Regroup**
- Identify related data scattered across layouts
- Bring related items closer (reduce gaps)
- Separate unrelated items (increase gaps)
- Use whitespace, not borders

---

## IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1)
**Establish Systems**
- [ ] Create `TufteFunctionalColors.ts`
- [ ] Create `TufteContrastSystem.ts`
- [ ] Create `TufteFormatters.ts`
- [ ] Create `TufteSpacing.ts`
- [ ] Create `TufteGrid.ts`
- [ ] Create `TufteProximity.ts`

### Phase 2: Components (Week 2)
**Build Standardized Components**
- [ ] `StandardCard.tsx` - Template for all cards
- [ ] `GridContainer.tsx` - Grid-based layouts
- [ ] `AlignedText.tsx` - Proper text alignment
- [ ] `DataGroup.tsx` - Proximity grouping
- [ ] `ColorScale.tsx` - Functional color displays

### Phase 3: Conversion (Week 3-4)
**Apply to Existing Components**

**Priority 1: High-Traffic Components**
- [ ] NextRaceCard → Apply all 5 principles
- [ ] WeatherCard → Apply all 5 principles
- [ ] RaceDashboard → Apply all 5 principles

**Priority 2: Data-Heavy Components**
- [ ] TideCard → Functional color, proximity
- [ ] PerformanceCard → Contrast, alignment
- [ ] CourseCard → Repetition, alignment

**Priority 3: Navigation & Layout**
- [ ] TabBar → Repetition, alignment
- [ ] Header → Contrast, proximity
- [ ] Cards grid → Alignment, proximity

### Phase 4: Testing (Week 5)
**Validation**
- [ ] Outdoor sunlight testing (contrast)
- [ ] Colorblind testing (functional color)
- [ ] A/B testing with sailors (all principles)
- [ ] Performance benchmarking

### Phase 5: Documentation (Week 6)
**Finalize Guidelines**
- [ ] Update design system docs
- [ ] Create component usage guide
- [ ] Record design decisions
- [ ] Train team on principles

---

## COMPONENT-BY-COMPONENT PLAN

### NextRaceCard - Full Tufte Treatment

**Current Issues**:
- Decorative gradient (color)
- Low contrast text (contrast)
- Inconsistent spacing (repetition)
- Centered alignment (alignment)
- Scattered data (proximity)

**Improvements**:

**1. COLORATION**:
```typescript
// Remove gradient
// Add functional color for race phase:
const phaseColor = RacePhaseColors[phase];
<View style={{ borderLeftWidth: 3, borderLeftColor: phaseColor }} />
```

**2. CONTRAST**:
```typescript
// Critical data (countdown):
<Text style={{ fontSize: 32, fontWeight: '700', color: '#111827' }}>
  2d 14h 23m
</Text>

// Secondary data (venue):
<Text style={{ fontSize: 13, fontWeight: '500', color: '#374151' }}>
  Royal Hong Kong Yacht Club
</Text>

// Tertiary metadata:
<Text style={{ fontSize: 11, fontWeight: '500', color: '#6B7280' }}>
  Updated 2m ago
</Text>
```

**3. REPETITION**:
```typescript
// Standardize ALL data formatting:
const windFormatted = formatWindSpeed(wind.speed);  // "15.2 kts"
const timeFormatted = formatTime(race.startTime);   // "13:45:32"
const dirFormatted = formatDirection(wind.dir);     // "NE (055°)"
```

**4. ALIGNMENT**:
```typescript
// Grid-based layout (12 columns):
<View style={{ flexDirection: 'row' }}>
  <GridContainer span={8}>
    {/* Race info */}
  </GridContainer>
  <GridContainer span={4}>
    {/* Countdown (right-aligned) */}
  </GridContainer>
</View>

// Numbers right-aligned:
<AlignedNumber value={15.2} unit="kts" />
```

**5. PROXIMITY**:
```typescript
// Tight grouping (label + value):
<View style={{ gap: 2 }}>
  <Text>First Warning</Text>
  <Text>13:45:32</Text>
</View>

// Moderate separation (different categories):
<View style={{ gap: 16 }}>
  <TimeGroup />
  <ConditionsGroup />
  <DetailsGroup />
</View>
```

---

### WeatherCard - Full Tufte Treatment

**1. COLORATION**:
```typescript
// Functional wind speed color:
const windColor = getWindColor(wind.speed);

<View style={{ borderTopWidth: 3, borderTopColor: windColor }}>
  <Text style={{ color: windColor }}>{wind.speed.toFixed(1)} kts</Text>
</View>

// Remove decorative compass (no data value)
```

**2. CONTRAST**:
```typescript
// Primary data (current wind):
fontSize: 32, fontWeight: '700', color: '#111827'

// Forecast (secondary):
fontSize: 13, fontWeight: '500', color: '#374151'

// Confidence (tertiary):
fontSize: 11, fontWeight: '500', color: '#6B7280'
```

**3. REPETITION**:
```typescript
// Consistent forecast row format:
forecasts.map(f => (
  <ForecastRow
    time={formatTime(f.time)}      // Always "HH:MM:SS"
    speed={formatWindSpeed(f.speed)} // Always "X.X kts"
    direction={formatDirection(f.dir)} // Always "XX (XXX°)"
    confidence={`${f.confidence}%`}   // Always "XX%"
  />
))
```

**4. ALIGNMENT**:
```typescript
// Table with proper alignment:
<DataTable
  columns={[
    { id: 'time', align: 'left' },
    { id: 'speed', align: 'right' },     // Numbers right
    { id: 'direction', align: 'left' },
    { id: 'confidence', align: 'right' }, // Numbers right
  ]}
/>
```

**5. PROXIMITY**:
```typescript
// Tight: Current conditions
<View style={{ gap: 2 }}>
  <Text>Wind Speed</Text>
  <Text>15.2 kts</Text>
</View>

// Close: Related conditions (wind + gusts)
<View style={{ gap: 8 }}>
  <CurrentWind />
  <Gusts />
</View>

// Moderate: Forecast section
<View style={{ gap: 16, marginTop: 16 }}>
  <Text>FORECAST</Text>
  <ForecastTable />
</View>
```

---

## SUCCESS METRICS

### Quantitative Targets

| Metric | Current | Target | Method |
|--------|---------|--------|--------|
| Color contrast ratio | 4.5:1 avg | 7:1+ all | WCAG AAA |
| Functional color use | 20% | 80% | Audit |
| Format consistency | 30% | 95% | Code review |
| Grid compliance | 0% | 90% | Lint rules |
| Proximity accuracy | - | 90% | Design review |

### Qualitative Goals

- [ ] All colors have functional purpose
- [ ] No text below 7:1 contrast
- [ ] All similar data formatted identically
- [ ] All elements snap to 8pt grid
- [ ] Related items grouped tightly

---

## REFERENCE

### Tufte Books
1. **Envisioning Information** (1990) - COLOR, LAYERING, SEPARATION
2. **Visual Explanations** (1997) - COMPARATIVE REASONING
3. **Beautiful Evidence** (2006) - EVIDENCE PRESENTATION

### Key Quotes

**On Color**:
> "Regard color variation as a language. Use color to compare and contrast, to represent quantity, to enliven or decorate."

**On Contrast**:
> "Use the smallest effective difference. Subtlety is the best art."

**On Repetition**:
> "Small multiples, whether tabular or pictorial, move to the heart of visual reasoning."

**On Alignment**:
> "The grid system is an aid, not a guarantee. It permits a number of possible uses and each designer can look for a solution appropriate to his personal style."

**On Proximity**:
> "Closely position together elements of information that belong together functionally."

---

## NEXT STEPS

1. **Review & Approve** - Design team reviews this plan
2. **Create Systems** - Build foundation files (Phase 1)
3. **Build Components** - Create standardized components (Phase 2)
4. **Convert Existing** - Apply to current components (Phase 3)
5. **Test & Refine** - Validate in real conditions (Phase 4)
6. **Document** - Finalize guidelines (Phase 5)

---

**Last Updated**: 2025-11-29
**Status**: Planning Complete - Ready for Implementation
**Questions?**: Reference Tufte books or consult design team
