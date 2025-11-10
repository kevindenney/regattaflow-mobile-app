# How to See Finishing Tactics in RegattaFlow 🏆

## Quick Answer
The **Finishing Tactics** skill is now visible in **3 places** in your app!

---

## Option 1: Quick Skill Buttons (Horizontal Scroll) 📱

### Location
Any screen with the `<QuickSkillButtons />` component

### What You'll See
A horizontal scrollable row of skill buttons:

```
🏁 Start → 🧭 Upwind → ⛵ Upwind → 🌊 Downwind → 🎯 Mark → 🏆 Finish → 🌀 Tidal
```

### The New Button
```
┌─────────────────┐
│       🏆        │  ← Trophy icon (red #ef4444)
│  Finish Tactics │
│ Favored end,    │
│ laylines,       │
│ ducking         │
└─────────────────┘
```

### How to Use
1. **Scroll horizontally** to the "Finish Tactics" button
2. **Tap the button** to invoke finishing advice
3. Get instant coaching on:
   - Which end is favored (port vs starboard)
   - Four-laylines navigation
   - Whether to duck competitors
   - Head reaching techniques
   - Buddy Friedrichs-style tactical moves

---

## Option 2: Smart Race Coach (Auto Phase Detection) 🤖

### Location
Screens with `<SmartRaceCoach />` component - automatically provides advice based on race phase

### When It Appears
The finishing tactics skill is **automatically selected** during:
- **Final Beat** (approaching finish from leeward mark)
- **Finish** (within finish line zone)

### What You'll See
```
┌────────────────────────────────────────┐
│ 🏆 Finish Phase Detected               │
│                                        │
│ Favored End: PORT (8 boat lengths)    │
│                                        │
│ Recommendation:                        │
│ Duck 2 starboard tackers to reach     │
│ port end. Net gain: 3.5 boat lengths  │
│                                        │
│ Action Items:                          │
│ ✓ Tack on first layline               │
│ ✓ Monitor competitors on starboard    │
│ ✓ Prepare for tactical ducking        │
│                                        │
│ Confidence: HIGH                       │
└────────────────────────────────────────┘
```

### How It Works
1. **GPS/Phase Detection**: App detects you're on final beat or approaching finish
2. **Auto-Invoke**: Finishing-line-tactics skill is automatically called
3. **Real-Time Advice**: Get RegattaFlow Coach-proven tactics based on current conditions

---

## Option 3: Coaching Tab 📊

### Navigation
```
Bottom Tabs → 🎓 Coaching
```

### What's Available
- **All skills accessible** via Quick Skill Buttons
- Includes the new **🏆 Finish Tactics** button
- Manual invocation anytime you want finishing advice

---

## Demo/Testing Screen 🧪

### Navigate To
```typescript
router.push('/race/ai-coach-demo')
```

**File**: `app/race/ai-coach-demo.tsx`

### What It Shows
- **Both** QuickSkillButtons and SmartRaceCoach components
- Fully interactive demo with simulated race data
- Test all skills including Finish Tactics

### Features
- Toggle auto-refresh on/off
- Simulate GPS position
- See phase-based skill selection in action
- Manually invoke any skill with Quick Buttons

---

## What Finishing Tactics Provides 🎯

When you tap the Finish Tactics button or it's auto-invoked, you'll get:

### 1. Favored End Analysis
```json
{
  "favoredEnd": {
    "end": "port",
    "advantage": "8 boat lengths",
    "methods": ["long_tack", "sindle", "visual"]
  }
}
```

### 2. Four-Laylines Navigation
```json
{
  "fourLaylines": {
    "portToPort": "225° true",
    "starboardToPort": "045° true",
    "portToStarboard": "135° true",
    "starboardToStarboard": "315° true",
    "firstLaylineReached": "starboard tack to port end"
  }
}
```

### 3. Tactical Decisions
```json
{
  "tacticalDecisions": [
    {
      "scenario": "Duck 2 starboard tackers to reach port end",
      "action": "duck",
      "expectedGain": "3.5 boat lengths net",
      "risk": "low",
      "triggers": ["Favored end saves 8+ lengths"]
    }
  ]
}
```

### 4. Championship Examples
- **Buddy Friedrichs 1968 Olympics**: How ducking 4 sterns won gold
- **Harry Sindle Technique**: Check finish bias 2 legs early
- **Sleuth vs Whirlwind**: Precise tack timing to pin competitors

---

## Quick Test Right Now ⚡

### Steps to See It Immediately

1. **Open the Demo Screen**
   ```typescript
   // In your app, navigate to:
   router.push('/race/ai-coach-demo')
   ```

2. **Scroll the Quick Skills**
   - Look for the horizontal scroll of skill buttons
   - Find the **🏆 Finish Tactics** button (red, at position 6)

3. **Tap the Button**
   - See simulated finishing advice appear
   - View favored end analysis
   - Get tactical recommendations

4. **Change Phase to "Finish"**
   - If demo allows phase simulation
   - Watch SmartRaceCoach auto-select finishing tactics

---

## File Locations (for Development)

### UI Components
- **QuickSkillButtons**: `components/coaching/QuickSkillButtons.tsx` ✅ UPDATED
- **SmartRaceCoach**: `components/coaching/SmartRaceCoach.tsx` ✅ UPDATED

### Skill Definition
- **Built-In Skill**: `services/ai/SkillManagementService.ts` ✅ INTEGRATED
- **Markdown Source**: `skills/finishing-line-tactics/SKILL.md`

### Demo/Test Screens
- **AI Coach Demo**: `app/race/ai-coach-demo.tsx`
- **Coaching Tab**: `app/(tabs)/coaching.tsx`

---

## Phase-Based Auto Selection

The skill is automatically selected during:

| Race Phase | Primary Skill | Secondary Skills |
|------------|---------------|------------------|
| **Final Beat** | finishing-line-tactics 🏆 | upwind-tactical-combat, upwind-strategic-positioning |
| **Finish** | finishing-line-tactics 🏆 | mark-rounding-execution |

---

## Visual Location Map

```
┌─────────────────────────────────────────────┐
│           RegattaFlow App                   │
├─────────────────────────────────────────────┤
│                                             │
│  Bottom Tab Bar:                            │
│  [Home] [Races] [Fleet] [🎓 Coaching]      │
│                              ↑              │
│                              │              │
│                        Tap here!            │
│                                             │
└─────────────────────────────────────────────┘

         ↓ Inside Coaching Tab ↓

┌─────────────────────────────────────────────┐
│        🎓 AI Race Coaching                  │
├─────────────────────────────────────────────┤
│                                             │
│  Quick AI Coaching                          │
│  ┌────────────────────────────────────┐    │
│  │ <─ Scroll horizontally ──────────> │    │
│  │                                     │    │
│  │ 🏁  🧭  ⛵  🌊  🎯  🏆  🌀        │    │
│  │                     ↑               │    │
│  │              NEW! Finish Tactics    │    │
│  └────────────────────────────────────┘    │
│                                             │
│  Smart Race Coach                           │
│  ┌────────────────────────────────────┐    │
│  │ 🏆 Finish Phase Detected           │    │
│  │                                     │    │
│  │ Auto-provides finishing tactics     │    │
│  │ when you're on final beat/finish   │    │
│  └────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Success! 🎉

**Your finishing tactics are now live** in the app with:
- ✅ Manual access via Quick Skill Buttons
- ✅ Auto-invocation during final beat & finish
- ✅ Championship-proven RegattaFlow Coach tactics
- ✅ Built-in skill (works offline!)

**Start using it today** to master finish line tactics like Buddy Friedrichs! 🏆⛵

