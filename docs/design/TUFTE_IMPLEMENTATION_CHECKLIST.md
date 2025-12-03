# Tufte Implementation Checklist
## RegattaFlow - Action Items for Color, Contrast, Repetition, Alignment & Proximity

**Purpose**: Quick reference for implementing Tufte visual design principles
**Full Details**: See `TUFTE_VISUAL_DESIGN_PLAN.md`
**Status**: Ready to Start

---

## WEEK 1: FOUNDATION SYSTEMS

### Day 1-2: Color System

- [ ] **Create** `constants/TufteFunctionalColors.ts`
  ```typescript
  export const FunctionalColors = {
    windSpeed: { /* 6 levels */ },
    tactical: { favorable, neutral, unfavorable },
    performance: { /* quartile-based */ },
    racePhase: { /* phase colors */ },
    // NO decorative colors
  };
  ```

- [ ] **Test** all colors in sunlight
- [ ] **Verify** WCAG AAA (7:1+) for all text
- [ ] **Remove** all gradient backgrounds from codebase
- [ ] **Audit** existing color usage - flag decorative use

### Day 3-4: Contrast & Typography System

- [ ] **Create** `constants/TufteContrastSystem.ts`
  ```typescript
  export const TypographicHierarchy = {
    critical: { size: 32, weight: '700' },  // Wind, position
    primary: { size: 16, weight: '600' },   // Race name
    secondary: { size: 13, weight: '500' }, // Labels
    tertiary: { size: 11, weight: '500' },  // Metadata
  };
  ```

- [ ] **Define** exactly 4 contrast levels (no more)
- [ ] **Test** contrast ratios for outdoor readability
- [ ] **Reduce** all shadows to single level: `opacity: 0.05, radius: 2`
- [ ] **Remove** shadows from inline elements

### Day 5: Data Formatters

- [ ] **Create** `utils/tufteFormatters.ts`
  ```typescript
  export const formatWindSpeed = (speed: number) => `${speed.toFixed(1)} kts`;
  export const formatTime = (date: Date) => /* "13:45:32" */;
  export const formatDirection = (deg: number) => /* "NE (055°)" */;
  export const formatPosition = (pos: number, total: number) => /* "3/12" */;
  ```

- [ ] **Document** format standards
- [ ] **Replace** all inconsistent formatting
- [ ] **Add** TypeScript types for all formatters

### Day 6-7: Grid & Proximity Systems

- [ ] **Create** `constants/TufteGrid.ts`
  ```typescript
  export const TufteGrid = {
    columns: 12,
    gutterWidth: 16,
    marginWidth: 16,
  };
  ```

- [ ] **Create** `constants/TufteProximity.ts`
  ```typescript
  export const TufteProximity = {
    veryClose: 2,   // Label + value
    close: 8,       // Related data
    moderate: 16,   // Categories
    far: 32,        // Sections
    veryFar: 48,    // Cards
  };
  ```

- [ ] **Enforce** 8-point spacing grid (no arbitrary values)

---

## WEEK 2: STANDARD COMPONENTS

### Day 8-9: Standard Card Template

- [ ] **Create** `components/viz/StandardCard.tsx`
  - Header (title + metadata + status)
  - Primary data (value + unit + sparkline)
  - Secondary data array
  - Comparison context

- [ ] **Apply** all 5 principles to template:
  - ✅ Functional color only
  - ✅ High contrast hierarchy
  - ✅ Consistent format
  - ✅ Grid-aligned
  - ✅ Proper proximity grouping

### Day 10-11: Layout Components

- [ ] **Create** `components/layout/GridContainer.tsx`
  ```typescript
  export function GridContainer({ span = 12, children }) {
    // Snap to 12-column grid
  }
  ```

- [ ] **Create** `components/layout/AlignedText.tsx`
  ```typescript
  export function AlignedNumber({ value, unit }) {
    // Right-align, tabular nums, baseline
  }
  ```

- [ ] **Create** `components/layout/DataGroup.tsx`
  ```typescript
  export function DataGroup({ relationship, children }) {
    // Proximity-based grouping
  }
  ```

### Day 12-14: Color Components

- [ ] **Create** `components/viz/ColorScale.tsx`
  - Wind speed indicator with functional color
  - Performance indicator
  - Tactical advantage indicator

- [ ] **Create** `components/viz/FunctionalColorKey.tsx`
  - Only show when color meaning isn't obvious
  - Compact, inline with data

---

## WEEK 3: CONVERT EXISTING COMPONENTS

### Priority 1: NextRaceCard (Day 15-16)

- [ ] **Remove**:
  - ❌ Gradient background
  - ❌ Emoji icons
  - ❌ Heavy shadows
  - ❌ Arbitrary spacing

- [ ] **Apply COLORATION**:
  - [ ] Border color = race phase (functional)
  - [ ] Remove all decorative color
  - [ ] Test in sunlight

- [ ] **Apply CONTRAST**:
  - [ ] Countdown: 32px, 700 weight, #111827
  - [ ] Race name: 16px, 600 weight, #111827
  - [ ] Venue: 13px, 500 weight, #374151
  - [ ] Metadata: 11px, 500 weight, #6B7280

- [ ] **Apply REPETITION**:
  - [ ] Use `formatWindSpeed()` for all wind
  - [ ] Use `formatTime()` for all times
  - [ ] Use `formatDirection()` for all directions
  - [ ] Consistent spacing (8pt grid)

- [ ] **Apply ALIGNMENT**:
  - [ ] Snap to 12-column grid
  - [ ] Right-align all numbers
  - [ ] Left-align all labels
  - [ ] Baseline align value + unit

- [ ] **Apply PROXIMITY**:
  - [ ] Label + value: 2px gap
  - [ ] Related values: 8px gap
  - [ ] Categories: 16px gap
  - [ ] Sections: 32px gap

### Priority 2: WeatherCard (Day 17-18)

- [ ] **Remove**:
  - ❌ 120x120px decorative compass
  - ❌ Separated sections
  - ❌ Low contrast text

- [ ] **Apply COLORATION**:
  - [ ] Wind speed color = intensity (functional)
  - [ ] Favorable/unfavorable = green/red
  - [ ] Border top = current conditions

- [ ] **Apply CONTRAST**:
  - [ ] Current: 32px, 700, #111827
  - [ ] Forecast: 13px, 500, #374151
  - [ ] Confidence: 11px, 500, #6B7280

- [ ] **Apply REPETITION**:
  - [ ] All forecasts: identical format
  - [ ] All rows: same height
  - [ ] Consistent data formatting

- [ ] **Apply ALIGNMENT**:
  - [ ] Forecast table: proper column alignment
  - [ ] Numbers: right-align, tabular
  - [ ] Grid-based layout

- [ ] **Apply PROXIMITY**:
  - [ ] Current conditions: tight (2-8px)
  - [ ] Forecast section: moderate (16px separation)
  - [ ] Comparison: grouped with primary data

### Priority 3: Race Dashboard (Day 19-21)

- [ ] **Remove**:
  - ❌ Tab-based progressive disclosure
  - ❌ Excessive cards
  - ❌ Inconsistent layouts

- [ ] **Apply COLORATION**:
  - [ ] Phase color = race state
  - [ ] Performance color = quartile
  - [ ] Tactical color = advantage

- [ ] **Apply CONTRAST**:
  - [ ] 4-level hierarchy (critical/primary/secondary/tertiary)
  - [ ] Test all combinations

- [ ] **Apply REPETITION**:
  - [ ] All cards use StandardCard template
  - [ ] Consistent data formats
  - [ ] Uniform spacing

- [ ] **Apply ALIGNMENT**:
  - [ ] Cards snap to grid
  - [ ] All numbers right-aligned
  - [ ] Consistent margins

- [ ] **Apply PROXIMITY**:
  - [ ] Group related performance metrics
  - [ ] Separate unrelated sections
  - [ ] Use whitespace, not borders

---

## WEEK 4: REMAINING COMPONENTS

### Day 22-23: Data Cards

**TideCard**:
- [ ] Functional color (tide phase)
- [ ] Sparkline inline with current level
- [ ] High contrast for critical times
- [ ] Proper proximity grouping

**CourseCard**:
- [ ] Mark colors = function (windward/leeward)
- [ ] Distance numbers right-aligned
- [ ] Consistent bearing format
- [ ] Grid-based mark layout

**PerformanceCard**:
- [ ] Performance color = quartile
- [ ] Sparklines for each metric
- [ ] Small multiples for race comparison
- [ ] Tight metric grouping

### Day 24-25: Navigation & Layout

**TabBar**:
- [ ] Consistent tab spacing
- [ ] Aligned labels
- [ ] Active state = contrast only (no decoration)

**Header**:
- [ ] High contrast title
- [ ] Proper hierarchy
- [ ] Grid-aligned

**Card Grid**:
- [ ] Perfect column alignment
- [ ] Consistent card heights
- [ ] Proper gutters (16px)

### Day 26-28: Polish & Refinement

- [ ] Audit ALL components for 5 principles
- [ ] Fix any inconsistencies
- [ ] Remove remaining chartjunk
- [ ] Ensure grid compliance

---

## WEEK 5: TESTING & VALIDATION

### Day 29-30: Contrast Testing

- [ ] Test EVERY text element in sunlight
- [ ] Verify 7:1+ contrast ratio
- [ ] Test at different times of day
- [ ] Test with polarized sunglasses
- [ ] Document any failures
- [ ] Fix failures immediately

### Day 31-32: Color Testing

- [ ] Test with colorblind simulator
- [ ] Verify patterns as backup
- [ ] Test in different lighting
- [ ] Validate functional meanings are clear
- [ ] Get feedback from sailors

### Day 33-34: A/B Testing

- [ ] Old design vs. new design
- [ ] Time to find information
- [ ] Comprehension accuracy
- [ ] User preference
- [ ] Outdoor usability

### Day 35: Metrics Review

- [ ] **Color**: % functional vs decorative
- [ ] **Contrast**: All elements meet 7:1+
- [ ] **Repetition**: Format consistency %
- [ ] **Alignment**: Grid compliance %
- [ ] **Proximity**: Relationship accuracy

---

## WEEK 6: DOCUMENTATION & TRAINING

### Day 36-37: Design System Update

- [ ] Update `DESIGN_SYSTEM.md` with new standards
- [ ] Document all 5 principles
- [ ] Add before/after examples
- [ ] Create usage guidelines

### Day 38-39: Component Guide

- [ ] Document StandardCard usage
- [ ] Create layout component guide
- [ ] Add color usage guide
- [ ] Write formatting standards

### Day 40-42: Team Training

- [ ] Present Tufte principles
- [ ] Demo new components
- [ ] Code review session
- [ ] Q&A and feedback

---

## QUICK REFERENCE: THE 5 PRINCIPLES

### ✅ COLORATION Checklist

Every color must answer: **"What does this color represent?"**

- [ ] Wind speed = intensity (light → dark)
- [ ] Performance = quartile (red → green)
- [ ] Tactical = advantage (red/gray/green)
- [ ] Phase = race state
- [ ] NO decorative color

### ✅ CONTRAST Checklist

Every element fits ONE of 4 levels:

- [ ] **Critical**: 32px, 700, #111827 (wind, position)
- [ ] **Primary**: 16px, 600, #111827 (race name)
- [ ] **Secondary**: 13px, 500, #374151 (labels)
- [ ] **Tertiary**: 11px, 500, #6B7280 (metadata)

### ✅ REPETITION Checklist

Same data = same format EVERYWHERE:

- [ ] Wind: always `"X.X kts"`
- [ ] Time: always `"HH:MM:SS"`
- [ ] Direction: always `"XX (XXX°)"`
- [ ] Position: always `"X/XX"`
- [ ] Spacing: always 8pt grid

### ✅ ALIGNMENT Checklist

Everything snaps to grid:

- [ ] 12-column grid system
- [ ] Labels: left-align
- [ ] Numbers: right-align, tabular
- [ ] Values + units: baseline align
- [ ] NO centering (except headings)

### ✅ PROXIMITY Checklist

Distance = relationship:

- [ ] Label + value: **2px** (very close)
- [ ] Related data: **8px** (close)
- [ ] Categories: **16px** (moderate)
- [ ] Sections: **32px** (far)
- [ ] Cards: **48px** (very far)

---

## COMMON MISTAKES TO AVOID

### ❌ COLOR

- Using color decoratively
- Gradient backgrounds
- Arbitrary theme colors
- Low contrast colors

### ❌ CONTRAST

- Too many font weights (stick to 4)
- Low contrast text (< 7:1)
- Everything bold = nothing bold
- Excessive shadows

### ❌ REPETITION

- Inconsistent data formats ("15 kts" vs "15 knots")
- Different spacing everywhere
- Varying card structures
- Arbitrary values (marginBottom: 13)

### ❌ ALIGNMENT

- Center-aligning everything
- Numbers not tabular
- Ignoring grid
- Baseline misalignment

### ❌ PROXIMITY

- Equal spacing everywhere
- Related data far apart
- Unrelated data too close
- No grouping hierarchy

---

## FILES TO CREATE

### Week 1 (Foundation):
```
constants/
  ├── TufteFunctionalColors.ts
  ├── TufteContrastSystem.ts
  ├── TufteGrid.ts
  └── TufteProximity.ts

utils/
  └── tufteFormatters.ts
```

### Week 2 (Components):
```
components/
  ├── viz/
  │   ├── StandardCard.tsx
  │   ├── ColorScale.tsx
  │   └── FunctionalColorKey.tsx
  └── layout/
      ├── GridContainer.tsx
      ├── AlignedText.tsx
      └── DataGroup.tsx
```

### Week 3-4 (Conversions):
```
components/
  ├── dashboard/
  │   └── NextRaceCard.tsx (update)
  └── race-detail/
      ├── WeatherCard.tsx (update)
      ├── TideCard.tsx (update)
      ├── CourseCard.tsx (update)
      └── PerformanceCard.tsx (update)
```

---

## SUCCESS CRITERIA

### Must Achieve:

- [ ] **90%+** of colors are functional (not decorative)
- [ ] **100%** of text meets 7:1 contrast (WCAG AAA)
- [ ] **95%+** format consistency across app
- [ ] **90%+** grid compliance (8pt spacing)
- [ ] **Zero** arbitrary spacing values

### User Experience:

- [ ] Faster information finding in outdoor conditions
- [ ] Higher comprehension accuracy
- [ ] Positive sailor feedback
- [ ] Preference for new design

---

## TRACKING PROGRESS

Use this checklist daily:

**Daily Review Questions**:
1. Did I add any decorative color? (Remove it)
2. Did I check contrast ratios? (Must be 7:1+)
3. Did I use standard formatters? (Never custom)
4. Did I snap to grid? (8pt increments only)
5. Did I group by proximity? (2/8/16/32/48px)

**Weekly Goals**:
- Week 1: Foundation systems complete
- Week 2: Standard components built
- Week 3: Priority components converted
- Week 4: All components updated
- Week 5: Testing complete
- Week 6: Documented and trained

---

**Start Date**: ___________
**Target Completion**: 6 weeks from start
**Lead**: ___________
**Status**: Ready to begin

**Questions?**: See `TUFTE_VISUAL_DESIGN_PLAN.md` for full details
