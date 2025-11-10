# AI Rig Tuning UI Visual Guide

## Before vs After Comparison

### BEFORE: No Tuning Guide Exists
```
┌─────────────────────────────────────────────────────┐
│ 🔧 Rig Tuning Checklist              [Not Set]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│              📚 [Book Icon]                         │
│         No tuning data yet                          │
│                                                     │
│  Add a tuning guide to your J/70 library to        │
│  unlock race-day rig checklists.                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### AFTER: AI-Generated Recommendations
```
┌─────────────────────────────────────────────────────┐
│ 🔧 Rig Tuning Checklist              [Ready]       │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🤖 AI-Generated Recommendations • 75% confidence │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 🤖 Race Day Setup for 12-16kt      [🤖 AI Analysis]│
│    Target wind: 12-16 knots                         │
│                                                     │
│ ┌──────────────┐  ┌──────────────┐                │
│ │ SHROUD TENSION│  │   FORESTAY   │                │
│ │ Loos PT-1M 27 │  │   3122mm     │                │
│ │ Medium +1 for │  │ Standard for │                │
│ │ gusts         │  │ balanced jib │                │
│ └──────────────┘  └──────────────┘                │
│                                                     │
│ ┌──────────────┐  ┌──────────────┐                │
│ │  BACKSTAY    │  │     VANG     │                │
│ │ Medium, ↑ in │  │ Tight downwind│               │
│ │ gusts        │  │ for stability │                │
│ │ Control sag  │  │ in 12-16kt   │                │
│ └──────────────┘  └──────────────┘                │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🌤️ Weather-Specific Notes                       │ │
│ │ • 1-2ft waves need power - favor fuller sails   │ │
│ │ • 16kt gusts need quick depower - practice      │ │
│ │   backstay rhythm                               │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ⚠️ Important                                     │ │
│ │ • AI-generated based on class standards         │ │
│ │ • Upload boat-specific guide for precision      │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ─────────────────────────────────────────────────── │
│ Source: RegattaFlow AI Rig Tuning Analyst          │
└─────────────────────────────────────────────────────┘
```

## Color Scheme Guide

### AI-Generated Theme (Purple)
- **AI Badge**: Purple background (#F3E8FF) with purple text (#7C3AED)
- **Robot Icon**: Purple (#7C3AED)
- **Source Badge**: Purple background (#F3E8FF) with purple text (#7C3AED)
- **Setting Reasoning**: Purple italic text (#7C3AED)

### Guide-Based Theme (Blue)
- **Check Icon**: Blue (#3B82F6)
- **Source Badge**: Blue background (#E0F2FE) with blue text (#2563EB)
- **No AI badge or reasoning text**

### Weather Notes (Yellow)
- **Background**: Light yellow (#FEF3C7)
- **Border**: Yellow (#FDE68A)
- **Text**: Dark yellow/brown (#92400E)
- **Icon**: Weather icon (#F59E0B)

### Caveats (Orange)
- **Background**: Light orange (#FFF7ED)
- **Border**: Orange (#FFEDD5)
- **Text**: Dark orange/brown (#9A3412)
- **Icon**: Alert icon (#F59E0B)

## Component Hierarchy

```
RigTuningCard
├─ StrategyCard (wrapper)
│  ├─ Icon: "wrench-clock"
│  ├─ Title: "Rig Tuning Checklist"
│  └─ Status: ready | generating | not_set
│
└─ Content
   ├─ AI Badge (if isAIGenerated)
   │  ├─ Robot icon
   │  └─ "AI-Generated • X% confidence"
   │
   ├─ Header
   │  ├─ Icon (robot if AI, check if guide)
   │  ├─ Section title + conditions
   │  └─ Source badge (purple if AI, blue if guide)
   │
   ├─ Settings Grid
   │  └─ Setting Cards (2 columns)
   │     ├─ Label (uppercase)
   │     ├─ Value (bold)
   │     ├─ Reasoning (if AI, purple italic)
   │     └─ Raw key (if different)
   │
   ├─ Weather Notes (if AI)
   │  ├─ Weather icon
   │  └─ Bulleted list (yellow box)
   │
   ├─ General Notes
   │  ├─ Note icon
   │  └─ Text content
   │
   ├─ Caveats (if AI)
   │  ├─ Alert icon
   │  └─ Bulleted list (orange box)
   │
   └─ Footer
      └─ Source attribution
```

## Key UI Patterns

### 1. AI Badge (Top)
```tsx
{recommendation.isAIGenerated && (
  <View style={styles.aiBadge}>
    <MaterialCommunityIcons name="robot-outline" size={16} color="#7C3AED" />
    <Text style={styles.aiBadgeText}>
      AI-Generated Recommendations • 75% confidence
    </Text>
  </View>
)}
```

### 2. Dynamic Icon & Color
```tsx
<MaterialCommunityIcons
  name={recommendation.isAIGenerated ? "robot-outline" : "text-box-check-outline"}
  size={20}
  color={recommendation.isAIGenerated ? "#7C3AED" : "#3B82F6"}
/>
```

### 3. Setting with Reasoning
```tsx
<View style={styles.settingCard}>
  <Text style={styles.settingLabel}>BACKSTAY</Text>
  <Text style={styles.settingValue}>Medium, increase in gusts</Text>
  {setting.reasoning && (
    <Text style={styles.settingReasoning}>
      Control headstay sag in gusts
    </Text>
  )}
</View>
```

### 4. Weather-Specific Notes
```tsx
{recommendation.weatherSpecificNotes && (
  <View style={styles.weatherNotes}>
    <MaterialCommunityIcons name="weather-partly-cloudy" size={16} />
    <View style={styles.weatherNotesList}>
      {recommendation.weatherSpecificNotes.map((note, idx) => (
        <Text key={idx} style={styles.weatherNoteText}>• {note}</Text>
      ))}
    </View>
  </View>
)}
```

### 5. Caveats Warning Box
```tsx
{recommendation.caveats && (
  <View style={styles.caveats}>
    <MaterialCommunityIcons name="alert-circle-outline" size={16} />
    <View style={styles.caveatsList}>
      {recommendation.caveats.map((caveat, idx) => (
        <Text key={idx} style={styles.caveatText}>• {caveat}</Text>
      ))}
    </View>
  </View>
)}
```

## Mobile Responsiveness

### Settings Grid
- **Layout**: 2-column grid (`flexBasis: '48%'`)
- **Gap**: 12px between cards
- **Wrapping**: Automatically wraps on small screens
- **Cards**: Equal width, flexible height

### Text Sizing
- **Labels**: 12px, uppercase, bold
- **Values**: 16px, bold
- **Reasoning**: 11px, italic
- **Notes**: 12-13px, regular

### Touch Targets
- **Source Badge**: Tappable (refresh action)
- **Minimum size**: 44x44 for accessibility
- **Visual feedback**: Opacity on press

## Accessibility

### Screen Reader Support
- **AI Badge**: "AI-Generated Recommendations, 75% confidence"
- **Settings**: "Shroud Tension, Loos PT-1M 27, Reasoning: Medium air base setting"
- **Weather Notes**: "Weather-Specific Notes: ..."
- **Caveats**: "Important warnings: ..."

### Color Contrast
- All text meets WCAG AA standards
- Purple/blue vs white: 4.5:1+ ratio
- Dark text on yellow/orange: High contrast

### Icons
- All icons paired with text labels
- Descriptive accessibility labels
- Color not sole indicator of meaning

## Animation States

### Loading State
```
┌─────────────────────────────────────────┐
│ 🔧 Rig Tuning Checklist   [Generating] │
├─────────────────────────────────────────┤
│            [Spinner]                    │
│   Loading rig recommendations…          │
└─────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────┐
│ 🔧 Rig Tuning Checklist   [Not Set]    │
├─────────────────────────────────────────┤
│            📚 [Icon]                    │
│      No tuning data yet                 │
│  Add a tuning guide to unlock...        │
└─────────────────────────────────────────┘
```

### Ready State (AI)
```
┌─────────────────────────────────────────┐
│ 🔧 Rig Tuning Checklist   [Ready]      │
├─────────────────────────────────────────┤
│ [🤖 AI Badge with confidence]          │
│ [🤖 Header with settings]              │
│ [⚙️  Settings grid]                    │
│ [🌤️ Weather notes]                    │
│ [⚠️ Caveats]                           │
└─────────────────────────────────────────┘
```

## Developer Notes

### Styling Conventions
- All colors use hex codes (not named colors)
- Border radius: 8-10px for cards, 999px for badges
- Padding: 12-14px standard, 6-8px compact
- Gap: 8-16px depending on density

### Performance
- Settings memoized with `useMemo`
- Sorted by priority order
- Conditional rendering for AI-specific elements
- No unnecessary re-renders

### Type Safety
- All props typed via interfaces
- Optional fields properly handled
- Type guards for array/object checks

### Testing Points
1. AI badge only shows when `isAIGenerated === true`
2. Purple theme only applies to AI recommendations
3. Reasoning only shows if present in settings
4. Weather notes only show if array has items
5. Caveats only show if array has items
6. Empty state shows when no recommendation
7. Loading state shows during fetch
