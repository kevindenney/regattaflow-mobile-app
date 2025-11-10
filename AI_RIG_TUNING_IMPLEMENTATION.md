# AI Rig Tuning System Implementation

## Overview

The RegattaFlow app now features an **AI-powered rig tuning system** that generates intelligent sail trim and rig setup recommendations even when no uploaded tuning guides exist. The system uses Anthropic's Claude AI with a custom `rig-tuning-analyst` skill to provide physics-based recommendations tailored to race-day weather forecasts.

## Key Features

### 1. AI Fallback When No Guides Exist
- **Previous behavior**: If no tuning guide existed for a boat class, the rig tuning card showed "No tuning data yet"
- **New behavior**: AI automatically generates intelligent recommendations based on:
  - Boat class standards and specifications
  - Weather forecast (wind speed, gusts, waves, current)
  - Racing physics and sail trim principles
  - Point of sail requirements

### 2. Weather-Integrated Recommendations
The AI system receives comprehensive weather context:
- Wind speed (average, min, max, gusts)
- Wind direction
- Wave height
- Current speed and direction
- Point of sail focus (upwind, downwind, reach, all)

### 3. Visual Distinction for AI Recommendations
AI-generated recommendations are clearly marked in the UI:
- **Purple robot icon** vs blue document icon for guide-based
- **Purple AI badge** showing "AI-Generated Recommendations" with confidence score
- **Weather-specific notes** in yellow callout boxes
- **Reasoning for each setting** (e.g., "Medium air base setting, slight increase for 16kt gusts")
- **Caveats** in orange boxes encouraging users to upload boat-specific guides

### 4. User Guide Upload Priority
- Uploaded tuning guides always take priority over AI recommendations
- AI encourages users to upload guides for maximum precision
- Seamless transition between AI and guide-based recommendations

## Implementation Details

### New Files Created

#### 1. `skills/rig-tuning-analyst/SKILL.md`
Custom Anthropic skill with expert knowledge of:
- **Rig tension principles** by wind speed (light/medium/heavy)
- **Point of sail considerations** (upwind/reaching/downwind)
- **Sea state adaptations** (flat water vs choppy)
- **Class-specific knowledge** (J/70, Dragon, Etchells, ILCA 7, Optimist)
- **Physics-based recommendations** for shrouds, forestay, backstay, vang, etc.

### Modified Files

#### 1. `services/RaceTuningService.ts`
**Enhanced interfaces:**
```typescript
export interface RaceTuningRequest {
  // ... existing fields
  windMin?: number | null;
  windMax?: number | null;
  windDirection?: number | null;
  gusts?: number | null;
  waveHeight?: string | null;
  currentSpeed?: number | null;
  currentDirection?: number | null;
}

export interface RaceTuningSetting {
  // ... existing fields
  reasoning?: string; // AI-generated reasoning
}

export interface RaceTuningRecommendation {
  // ... existing fields
  isAIGenerated?: boolean;
  confidence?: number; // 0-1 scale
  weatherSpecificNotes?: string[];
  caveats?: string[];
}
```

**New method:**
- `tryGenerateAIOnlyRecommendations()`: Called when NO tuning guides exist

#### 2. `services/ai/RaceTuningEngine.ts`
**New method:**
- `generateAIOnlyRecommendations(request)`: Generates physics-based recommendations using Claude Sonnet 3.5

**AI prompt structure:**
- Provides weather context (wind, waves, current)
- Requests specific rig settings with reasoning
- Includes confidence scoring
- Adds weather-specific notes and caveats

**Response parsing:**
- `transformAIOnlyRecommendation()`: Transforms AI JSON to app format
- `transformSettingWithReasoning()`: Includes reasoning field for settings

#### 3. `components/race-detail/RigTuningCard.tsx`
**Visual enhancements:**
- Purple AI badge with confidence score
- Robot icons for AI recommendations
- Setting cards now show reasoning in italic purple text
- Weather-specific notes in yellow callout boxes
- Caveats in orange warning boxes
- Purple-themed source badge for AI vs blue for guides

**New styles:**
- `aiBadge`, `aiBadgeText`
- `aiSourceBadge`, `aiSourceText`
- `settingReasoning`
- `weatherNotes`, `weatherNotesList`, `weatherNoteText`
- `caveats`, `caveatsList`, `caveatText`

## User Experience Flow

### Scenario 1: No Tuning Guide Exists
1. User views race detail for a boat class without uploaded guide
2. **Previous**: "No tuning data yet" empty state
3. **Now**: AI automatically generates recommendations:
   - Shroud tension (with gauge reading if known)
   - Forestay setup
   - Backstay usage guidance
   - Vang settings
   - Cunningham, outhaul, jib leads
   - Weather-specific tactical notes
   - Caveat encouraging guide upload

### Scenario 2: Tuning Guide Exists
1. User views race detail for a boat class with uploaded guide
2. System matches guide sections to forecast wind/conditions
3. Shows guide-based recommendations (blue theme)
4. **Unchanged behavior** - guides always take priority

### Scenario 3: Testing AI Quality
1. Users can compare AI recommendations with their knowledge
2. Confidence scores indicate AI certainty (typically 70-80% for AI-only)
3. Clear labeling prevents confusion about recommendation source

## Technical Architecture

```
Race Detail Screen
  ↓
useRaceWeather (fetches forecast)
  ↓
useRaceTuningRecommendation (passes weather context)
  ↓
RaceTuningService.getRecommendations()
  ↓
Check for uploaded guides
  ↓
If guides exist: Match sections to conditions
If NO guides: tryGenerateAIOnlyRecommendations()
  ↓
RaceTuningEngine.generateAIOnlyRecommendations()
  ↓
Anthropic API (Claude Sonnet 3.5)
  ↓
Transform response to RaceTuningRecommendation
  ↓
RigTuningCard (displays with AI visual theme)
```

## Confidence Scoring System

- **0.90-1.00**: Uploaded tuning guide perfectly matched to conditions
- **0.80-0.89**: Uploaded guide with close condition match
- **0.70-0.79**: AI-generated with strong class knowledge
- **0.60-0.69**: AI-generated with limited class data
- **0.50-0.59**: Generic recommendations only

## Example AI Output

```json
{
  "source": "ai-generated",
  "className": "J/70",
  "confidence": 0.75,
  "isAIGenerated": true,
  "guideTitle": "AI Rig Tuning Analysis",
  "sectionTitle": "Race Day Setup for 12-16kt with gusts",
  "conditionSummary": "Medium-heavy air, choppy conditions",
  "settings": [
    {
      "key": "shrouds",
      "label": "Shroud Tension",
      "value": "Loos PT-1M 27-28",
      "reasoning": "Medium air base +1 for 16kt gusts"
    },
    {
      "key": "backstay",
      "label": "Backstay",
      "value": "Medium tension, increase in gusts",
      "reasoning": "Control headstay sag in gusts, ease between puffs"
    }
  ],
  "weatherSpecificNotes": [
    "1-2ft waves require power through chop - favor slightly fuller sails",
    "16kt gusts need quick depowering - practice backstay rhythm"
  ],
  "caveats": [
    "AI-generated based on class standards and physics",
    "Verify against your rig package and crew weight",
    "Upload boat-specific guide for precision"
  ]
}
```

## Next Steps / Future Enhancements

1. **Learn from uploaded guides**: Train on user-uploaded guides over time
2. **Crew weight adjustments**: Factor in crew weight for settings
3. **Rig package variations**: Account for different mast/sail combinations
4. **Historical performance**: Learn from past race results
5. **Coach review**: Allow coaches to review/approve AI recommendations
6. **Venue-specific tuning**: Add local knowledge overlays

## Testing Instructions

1. **Find a race without tuning guide**:
   - Go to /races tab
   - Select a race for a boat class without uploaded guide
   - Scroll to "Rig Tuning Checklist" card

2. **Verify AI generation**:
   - Should see purple "AI-Generated Recommendations" badge
   - Settings should include reasoning in purple italic text
   - Weather notes should appear in yellow boxes
   - Caveats should appear in orange warning boxes

3. **Compare with guide-based**:
   - Upload a tuning guide for same class
   - Refresh race detail
   - Should now see blue theme, guide-based recommendations

## API Requirements

- Anthropic API key must be configured (`EXPO_PUBLIC_ANTHROPIC_API_KEY`)
- Uses Claude Sonnet 3.5 model for AI generation
- Approximately 2000-3000 tokens per recommendation

## Files Modified Summary

- ✅ `skills/rig-tuning-analyst/SKILL.md` (created)
- ✅ `services/RaceTuningService.ts` (enhanced)
- ✅ `services/ai/RaceTuningEngine.ts` (new AI-only method)
- ✅ `components/race-detail/RigTuningCard.tsx` (visual enhancements)

## Success Metrics

- **Coverage**: Rig tuning recommendations available for ALL boat classes (not just those with guides)
- **Quality**: AI recommendations receive 70-80% confidence scores
- **User feedback**: Clear visual distinction between AI and guide-based
- **Conversion**: Caveats encourage users to upload guides for precision
