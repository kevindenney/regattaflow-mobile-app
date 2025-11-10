# Race Learning Integration Guide

## Overview
This guide explains how the Race Learning Analyst skill is integrated into RegattaFlow to provide personalized, AI-powered coaching insights to sailors.

## Architecture

### 1. **Skill Upload & Registration**
- **Skill ID**: `skill_01NsZX8FL8JfeNhqQ7qFQLLW`
- **Location**: Uploaded to Anthropic Skills API
- **Registry**: `services/ai/SkillManagementService.ts:464`

### 2. **Backend Service**
**File**: `services/PostRaceLearningService.ts`

**Key Features**:
- Aggregates race history from `race_analysis` table
- Calculates performance patterns (strengths, focus areas)
- Tracks framework adoption trends (RegattaFlow Playbook frameworks)
- Generates AI-powered summaries using the race-learning-analyst skill

**Main Method**:
```typescript
await postRaceLearningService.getLearningProfileForUser(userId)
```

**Returns**:
```typescript
interface LearningProfile {
  sailorId: string;
  racesAnalyzed: number;
  strengths: PerformancePattern[];
  focusAreas: PerformancePattern[];
  frameworkTrends: FrameworkTrend[];
  recurringWins: RecurringInsight[];
  recurringChallenges: RecurringInsight[];
  aiSummary?: AILearningSummary; // ← AI-powered insights
  lastUpdated: string;
}
```

### 3. **UI Components**

#### **RaceLearningInsights** (`components/races/RaceLearningInsights.tsx`)
Full-screen component displaying:
- ✅ **Keep Doing** - Celebrates strengths with data
- 🎯 **Focus Next** - Priority improvements
- 💪 **Practice Ideas** - Actionable drills
- ⏰ **Pre-Race Reminder** - Motivational message
- 📊 **Framework Progress** - RegattaFlow Playbook adoption trends

#### **PreRaceReminderCard** (`components/races/RaceLearningInsights.tsx`)
Compact card showing just the pre-race reminder.

### 4. **Integration Points**

#### **A. Settings Screen** (`app/(tabs)/settings.tsx:209-221`)
Adds "My Learning" section for sailors:
```tsx
<SettingItem
  icon="analytics-outline"
  title="Race Learning Insights"
  subtitle="View personalized coaching and practice recommendations"
  onPress={() => router.push('/my-learning')}
/>
```

#### **B. My Learning Screen** (`app/(tabs)/my-learning.tsx`)
Dedicated full-screen view of learning insights.

#### **C. Race Detail Cards** (`components/races/RaceDetailCards.tsx:209`)
Shows pre-race reminder on race detail screens:
```tsx
{user?.id && <PreRaceReminderCard userId={user.id} />}
```

## User Flow

### **Post-Race Flow**
1. Sailor completes race
2. Fills out post-race analysis form (ratings for start, upwind, marks, etc.)
3. Data saved to `race_analysis` table
4. Next time they open "My Learning" → AI analyzes ALL their races
5. Generates personalized insights

### **Pre-Race Flow**
1. Sailor opens race detail screen
2. Sees their personalized reminder: "You own the start line - carry that confidence through marks"
3. Can tap to save or view full insights

## Data Flow

```
┌─────────────────────┐
│  Race Analysis Form │
│  (Post-race ratings)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  race_analysis      │
│  table (Supabase)   │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────┐
│ PostRaceLearningService  │
│ - Aggregate patterns     │
│ - Calculate trends       │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Anthropic Skills API    │
│  race-learning-analyst   │
│  skill_01NsZX8FL...     │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│   AILearningSummary      │
│   - headline             │
│   - keepDoing[]          │
│   - focusNext[]          │
│   - practiceIdeas[]      │
│   - preRaceReminder      │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  RaceLearningInsights UI │
│  Beautiful card display  │
└──────────────────────────┘
```

## Example Output

### **AI Summary**:
```json
{
  "headline": "Strong starts are your competitive advantage - now unlock speed gains by mastering mark approach timing",
  "keepDoing": [
    "Your start game is championship-level with a 4.3 average rating (improving)",
    "Clean starts with excellent line bias assessment",
    "Puff Response Framework score of 78 (improving)"
  ],
  "focusNext": [
    "Mark rounding execution (2.8 average, declining) is costing 2-3 boat lengths",
    "Late tacks to layline - practice the 45° bearing rule",
    "Recent pattern: great starts, poor mark rounding"
  ],
  "practiceIdeas": [
    "Shore drill: Mark should be 2-3 mast widths inside shrouds when you tack",
    "On-water: Set a practice mark, sail 5 approaches at 3-boat-length tacks",
    "Pre-mark routine: Count down '10 lengths assess, 6 lengths commit'"
  ],
  "preRaceReminder": "You own the start line - now carry that confidence through every mark rounding with early, committed layline decisions"
}
```

## Configuration

### **Enable AI Summaries**
Requires `EXPO_PUBLIC_ANTHROPIC_API_KEY` in `.env`:
```bash
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-api03-...
```

### **Skill Initialization**
The skill is automatically initialized on app startup via:
```typescript
await skillManagementService.initializeRaceLearningSkill()
```

## Database Schema

### **race_analysis** table
Stores post-race ratings and notes:
- `sailor_id` (FK to sailor_profiles)
- `race_id` (FK to races)
- `start_rating` (1-5)
- `upwind_rating` (1-5)
- `windward_mark_rating` (1-5)
- `downwind_rating` (1-5)
- `leeward_mark_rating` (1-5)
- `finish_rating` (1-5)
- `framework_scores` (JSONB with RegattaFlow Playbook framework scores)
- `start_notes`, `upwind_notes`, etc.
- `key_learnings` (text array)
- `ai_coaching_feedback` (JSONB)

## Testing

### **Test Skill Directly**:
```bash
node test-race-learning-fixed.mjs
```

### **Test in App**:
1. Complete 3-5 races with post-race analysis
2. Navigate to Settings → My Learning
3. Should see AI-generated insights

## Performance

- **Caching**: Learning profiles are cached in AsyncStorage
- **Lazy Loading**: Skill initialization happens in background
- **Graceful Degradation**: If AI fails, shows raw pattern data

## Future Enhancements

1. **Race-Specific Insights**: Show learning relevant to the current race type
2. **Comparative Analysis**: Compare against club/fleet averages
3. **Video Drills**: Link practice ideas to instructional videos
4. **Progress Tracking**: Chart improvement over time
5. **Share Insights**: Export as PDF or share with coach

## Troubleshooting

### **No insights showing**
- Check if sailor has completed races with post-race analysis
- Verify `EXPO_PUBLIC_ANTHROPIC_API_KEY` is set
- Check console for skill initialization errors

### **Skill not found**
- Run skill upload script: `node upload-final.mjs`
- Verify skill ID in `SKILL_REGISTRY`

### **AI summary missing**
- Check Anthropic API quota
- Verify skill initialization succeeded
- Check `PostRaceLearningService` logs

## Related Files

### **Core Files**:
- `services/PostRaceLearningService.ts` - Data aggregation & AI generation
- `services/ai/SkillManagementService.ts` - Skill registry & initialization
- `components/races/RaceLearningInsights.tsx` - UI components
- `types/raceLearning.ts` - TypeScript interfaces
- `skills/race-learning-analyst/SKILL.md` - Skill definition

### **Integration Points**:
- `app/(tabs)/settings.tsx` - Settings entry point
- `app/(tabs)/my-learning.tsx` - Full learning screen
- `components/races/RaceDetailCards.tsx` - Pre-race reminder card
- `supabase/functions/anthropic-skills-proxy/index.ts` - API proxy

## Support

For questions or issues:
- Check Claude Code documentation
- Review `SKILL.md` for skill behavior
- Inspect browser console / logs for errors
- Verify Supabase edge function deployment

---

**Last Updated**: November 5, 2025
**Skill Version**: `skill_01NsZX8FL8JfeNhqQ7qFQLLW`
