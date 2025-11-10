# AI Strategy Insights Implementation

## Overview

Implemented AI-powered strategic planning suggestions that appear above each strategy input field when sailors create race plans. The system analyzes past race performance to provide personalized, phase-specific guidance.

## What Was Built

### 1. StrategyPhaseSuggestion Component
**File**: `components/races/StrategyPhaseSuggestion.tsx`

A beautiful, collapsible banner component that displays:
- **Performance Rating**: Average rating for the phase (e.g., "4.3/5.0")
- **Trend Indicator**: Visual icon showing if performance is improving/declining/stable
- **Strength/Focus Badge**: Automatically identifies if this is a strength (≥4.0) or focus area (≤3.0)
- **AI Suggestion**: Personalized tactical advice based on past performance
- **Sample Count**: Number of races analyzed for confidence

**Visual Design**:
- Green background for strengths with checkmark icon
- Yellow background for focus areas with alert icon
- Collapsible to reduce clutter
- Clean stats display with rating/trend/race count

### 2. PostRaceLearningService Enhancement
**File**: `services/PostRaceLearningService.ts`

Added two new methods:

#### `getPhaseSpecificInsights(userId, phase)`
Retrieves performance data and AI suggestions for a specific race phase:
- Maps phase names to rating metrics
- Builds performance patterns from race history
- Generates AI suggestions using Claude Skills
- Returns both pattern data and personalized advice

#### `generatePhaseSuggestion(phase, pattern, analyses)` (private)
Generates phase-specific AI suggestions:
- Uses Claude 3.5 Haiku for fast, cost-effective suggestions
- Leverages `race-learning-analyst` skill when available
- Provides fallback suggestions without AI (based on pattern data)
- Includes recent notes from past races for context
- Tailored messaging for strengths vs focus areas

### 3. StrategyPlanningCard Integration
**File**: `components/race-detail/StrategyPlanningCard.tsx`

Enhanced the strategy planning UI to:
- Load phase insights on component mount
- Display `StrategyPhaseSuggestion` above each phase's text input
- Support collapsible insights to reduce visual clutter
- Maintain existing AI suggestions feature (from strategic-planning-assistant)

## How It Works

### Flow Diagram

```
User creates race
    ↓
Opens strategy section
    ↓
Component loads phase insights in parallel
    ↓
PostRaceLearningService fetches race analysis history
    ↓
For each phase (8 phases total):
    ├─ Map phase to rating metric
    ├─ Build performance pattern (avg, trend, samples)
    ├─ Generate AI suggestion via Claude
    └─ Return pattern + suggestion
    ↓
Display insights above each strategy input:
    ├─ Strength (≥4.0): "You excel at starts! Leverage this..."
    ├─ Focus Area (≤3.0): "Upwind needs work. Practice shift awareness..."
    └─ Neutral: "Your mark roundings: 3.5 avg across 6 races"
```

## Example Output

### Strength Example
```
┌─────────────────────────────────────────┐
│ ✓ Strength                      4.3  ↑  │
├─────────────────────────────────────────┤
│ Avg Rating  Trend      Races            │
│   4.3/5.0   improving   8                │
│                                          │
│ 💡 AI Suggestion                         │
│ You consistently nail starts (4.3 avg). │
│ Your timing and line bias reading are   │
│ championship-caliber. Focus on using    │
│ this advantage to get clear air every   │
│ time.                                    │
└─────────────────────────────────────────┘
```

### Focus Area Example
```
┌─────────────────────────────────────────┐
│ ⚠️ Focus Area                    3.1  ↓  │
├─────────────────────────────────────────┤
│ Avg Rating  Trend      Races            │
│   3.1/5.0   declining   8                │
│                                          │
│ 💡 AI Suggestion                         │
│ Upwind execution needs work. Your shift  │
│ awareness is inconsistent. Practice the  │
│ Wind Shift Mathematics framework - tack  │
│ on headers >7°, continue on lifts. Drill│
│ this on shore before the next race.      │
└─────────────────────────────────────────┘
```

## Technical Details

### Performance Thresholds
- **Strength**: average ≥ 4.0 OR (improving trend AND latest ≥ 3.6)
- **Focus Area**: average ≤ 2.5 OR (declining trend AND latest ≤ 3.0)
- **Neutral**: Everything else

### Phase Mapping
```typescript
{
  rigTuningStrategy: 'rigTuning' → equipment_rating
  prestartStrategy: 'prestart' → prestart_rating
  startStrategy: 'start' → start_rating
  upwindStrategy: 'upwind' → upwind_rating
  windwardMarkStrategy: 'windwardMark' → windward_mark_rating
  downwindStrategy: 'downwind' → downwind_rating
  leewardMarkStrategy: 'leewardMark' → leeward_mark_rating
  finishStrategy: 'finish' → finish_rating
}
```

### AI Integration
- **Model**: Claude 3.5 Haiku (fast, cost-effective)
- **Skill**: `race-learning-analyst` (optional, reduces token usage)
- **Fallback**: Pattern-based suggestions if AI unavailable
- **Max Tokens**: 200 per suggestion
- **Temperature**: 0.4 (balanced creativity)

### Data Sources
- `race_analysis` table: Past race ratings by phase
- `sailor_race_preparation` table: Pre-race planning data (future enhancement)
- Performance patterns: Calculated in PostRaceLearningService

## Benefits

### For Sailors
1. **Personalized Guidance**: Suggestions tailored to their performance history
2. **Actionable Advice**: Specific tactics to improve, not generic tips
3. **Confidence Building**: Highlights strengths to leverage
4. **Focus Direction**: Identifies highest-leverage areas to work on
5. **Learning Loop**: See how past performance informs future strategy

### For the App
1. **Skill Utilization**: Leverages existing `race-learning-analyst` Claude Skill
2. **Cost Efficient**: Uses Haiku + Skills for minimal API costs
3. **Graceful Degradation**: Works without AI if needed
4. **Performance**: Loads insights in parallel for all phases
5. **UX Polish**: Collapsible, color-coded, visually distinct

## Future Enhancements

### Short Term
1. Add pre-race reminder notifications based on focus areas
2. Track if suggestions lead to improved ratings
3. Add "Apply to Plan" button to auto-populate strategy text
4. Show comparison to similar sailors (fleet benchmarking)

### Medium Term
1. Use `sailor_race_preparation` data to compare planning vs execution
2. Suggest specific drills based on focus areas
3. Integration with coaching feedback
4. Venue-specific insights (e.g., "At Hong Kong, you rate starts 4.5")

### Long Term
1. Real-time adaptation during races
2. Team/crew-level insights
3. Video analysis integration
4. Predictive modeling for race outcomes

## Testing

To test the implementation:

1. **Navigate to a race** with existing strategy section
2. **Verify insights load** above each phase
3. **Check data accuracy**:
   - Ratings match race analysis history
   - Trends correctly calculated (improving/declining/stable)
   - AI suggestions are relevant and specific
4. **Test collapsibility** - click to expand/collapse insights
5. **Verify colors**:
   - Green for strengths (≥4.0)
   - Yellow for focus areas (≤3.0)
   - Gray for neutral
6. **Test without race history** - should gracefully handle no data

## Files Modified

1. ✅ `components/races/StrategyPhaseSuggestion.tsx` (NEW)
2. ✅ `services/PostRaceLearningService.ts` (ENHANCED)
3. ✅ `components/race-detail/StrategyPlanningCard.tsx` (ENHANCED)
4. ✅ `components/races/index.ts` (EXPORT ADDED)

## Summary

This implementation creates a powerful learning loop where sailors see their past performance inform their future strategy. The AI doesn't just tell them what to do - it explains WHY based on their own data, making the advice more credible and actionable.

The visual design is clean and unobtrusive, using color coding to quickly identify strengths vs areas for improvement. The collapsible design prevents information overload while keeping insights readily accessible.

Most importantly, this feature transforms strategy planning from a blank-page problem into a guided experience backed by data and AI intelligence.
