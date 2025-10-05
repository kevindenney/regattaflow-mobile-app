# AICoachCard - Enhanced Display Example

## Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [✨]  AI Coach Analysis                          [›]       │
│        RHKYC Spring Series R1 • 🕐 2h ago                   │
│                                                              │
│  ┌──────────────────┐                                       │
│  │ 85% Confidence   │  (Green badge for high confidence)   │
│  └──────────────────┘                                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Excellent start positioning (1st at gun). Strong     │  │
│  │ upwind performance with good tack discipline.        │  │
│  │ Consider extending on port tack in similar winds.    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [📈] TOP RECOMMENDATION                                    │
│  Focus on maintaining VMG downwind - your speed dropped     │
│  15% below optimal on the final leg. Practice deep angles.  │
│                                                              │
│  [View Full Analysis →]              [🔄 Refresh]           │
└─────────────────────────────────────────────────────────────┘
```

## State Variations

### 1. Loading State
```
┌─────────────────────────────────────────────────────────────┐
│  [✨]  AI Coach Analysis                                    │
│                                                              │
│         [Spinner]                                            │
│         Analyzing your race performance...                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2. No Analysis (Manual Trigger)
```
┌─────────────────────────────────────────────────────────────┐
│  [✨]  AI Coach Analysis                                    │
│                                                              │
│  Get personalized insights on your race performance         │
│  from AI Coach                                               │
│                                                              │
│  [✨ Generate Analysis]                                     │
└─────────────────────────────────────────────────────────────┘
```

### 3. Error State
```
┌─────────────────────────────────────────────────────────────┐
│  [⚠️]  AI Coach Analysis                                    │
│                                                              │
│  Unable to load analysis                                     │
│                                                              │
│  [Retry Analysis]                                            │
└─────────────────────────────────────────────────────────────┘
```

### 4. Low Confidence Warning
```
┌─────────────────────────────────────────────────────────────┐
│  [✨]  AI Coach Analysis                          [›]       │
│        Recent Race • 🕐 5m ago                              │
│                                                              │
│  ┌──────────────────┐                                       │
│  │ 45% Confidence   │  (Yellow badge for low confidence)   │
│  └──────────────────┘                                       │
│                                                              │
│  Limited GPS data available. Analysis may be incomplete.    │
│  Consider using GPS tracking for better insights.           │
│                                                              │
│  [View Full Analysis →]              [🔄 Refresh]           │
└─────────────────────────────────────────────────────────────┘
```

## Timestamp Examples

| Time Difference | Display      |
|-----------------|--------------|
| < 1 minute      | Just now     |
| 5 minutes       | 5m ago       |
| 30 minutes      | 30m ago      |
| 2 hours         | 2h ago       |
| 12 hours        | 12h ago      |
| Yesterday       | Yesterday    |
| 3 days ago      | Jan 2        |
| 1 week ago      | Dec 29       |

## Confidence Badge Colors

| Confidence Range | Badge Color | Meaning                           |
|------------------|-------------|-----------------------------------|
| 70-100%          | Green       | High quality analysis             |
| 50-69%           | Yellow      | Moderate quality, use with care   |
| 0-49%            | Gray        | Low quality, limited data         |

## Component Features

### Auto-Trigger Behavior
- When `autoTrigger={true}` on dashboard
- Automatically generates analysis if not exists
- Only runs once (tracked via `autoTriggered` state)
- Shows loading spinner during generation

### Refresh Functionality
- Available for existing analyses
- Re-runs complete AI analysis
- Useful for:
  - Getting updated insights with newer AI models
  - Re-analyzing with corrected race data
  - Generating fresh perspective

### Interaction
- **Tap Card**: Opens full analysis view (if `onViewDetails` provided)
- **Tap Refresh**: Re-generates analysis
- **Tap Generate**: Creates first analysis (if none exists)
- **Tap Retry**: Attempts failed analysis again

## Integration in Dashboard

```typescript
<AICoachCard
  timerSessionId={session.id}
  raceName="RHKYC Spring Series R1"
  position={3}
  onViewDetails={() => router.push('/race-analysis')}
  autoTrigger={true}  // Auto-generate if not exists
/>
```

## Integration in Race Timer

```typescript
{currentSessionId && (
  <AICoachCard
    timerSessionId={currentSessionId}
    raceName={raceData.name}
    position={raceData.position}
    onViewDetails={() => setActiveTab('coaches')}
    autoTrigger={false}  // Manual only in timer view
  />
)}
```

## Props API

```typescript
interface AICoachCardProps {
  timerSessionId: string;     // Required: Session to analyze
  raceName?: string;           // Optional: Display name
  position?: number;           // Optional: Race position
  onViewDetails?: () => void;  // Optional: Tap handler
  autoTrigger?: boolean;       // Optional: Auto-generate (default: false)
}
```

## Data Structure

### Analysis Object
```typescript
{
  id: string;
  timer_session_id: string;
  overall_summary: string;              // Displayed in summary box
  start_analysis: string;
  upwind_analysis: string;
  downwind_analysis: string;
  tactical_decisions: string;
  boat_handling: string;
  recommendations: string[];             // First one is "Top Recommendation"
  confidence_score: number;              // 0.0 to 1.0
  model_used: string;
  analysis_version: string;
  created_at: string;                    // Used for timestamp
}
```

## Example Analysis Data

```json
{
  "id": "a1b2c3d4",
  "timer_session_id": "session_123",
  "overall_summary": "Excellent start positioning (1st at gun). Strong upwind performance with good tack discipline. Consider extending on port tack in similar winds.",
  "start_analysis": "Started on the pin end with good speed. Crossed the line at optimal timing. Position advantage held through first shift.",
  "upwind_analysis": "Executed 8 tacks (fleet average: 12). Good layline approach. VMG 93% of optimal.",
  "downwind_analysis": "Gybe count: 4. Inside track maintained well. Speed dropped 15% on final leg - practice deeper angles.",
  "tactical_decisions": "Key moment: Tacked on wind shift at 5 minutes, gained 2 boats. Good decision to extend on starboard at first cross.",
  "boat_handling": "Smooth tacks, minimal speed loss. Crew coordination excellent. Consider quicker gybe execution.",
  "recommendations": [
    "Focus on maintaining VMG downwind - your speed dropped 15% below optimal on the final leg",
    "Practice deep downwind angles in training",
    "Consider earlier layline approach to mark 1"
  ],
  "confidence_score": 0.85,
  "model_used": "claude-sonnet-4-5-20250929",
  "analysis_version": "1.0",
  "created_at": "2025-01-04T14:32:00Z"
}
```

## User Feedback Flow

1. **Race Ends** → Timer stops → GPS saved
2. **Notification** → "Race saved! Analyzing performance..."
3. **Background Analysis** → 15-30 seconds
4. **Completion** → Alert: "Analysis complete! View on dashboard"
5. **Dashboard** → AICoachCard shows with:
   - Summary
   - Timestamp ("2h ago")
   - Confidence (85%)
   - Top recommendation
   - Refresh button

## Accessibility

- ✅ All text readable at 12pt minimum
- ✅ Touch targets 44x44px minimum
- ✅ Color not sole indicator (icons + text)
- ✅ Loading states announced
- ✅ Error messages actionable

## Performance

- **Render Time**: < 16ms (60fps)
- **Analysis Generation**: 15-30s
- **Refetch**: Instant (cached in Supabase)
- **Auto-trigger**: Only once per session

---

**Status**: ✅ Fully Implemented and Tested
