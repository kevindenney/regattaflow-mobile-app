# Boat Tuning AI - Quick Reference

## ✅ Status: READY TO USE

The boat tuning AI is fully operational and ready for testing!

## 🚀 Quick Test

```bash
# Test with any boat class
node scripts/test-boat-tuning-simple.mjs J/70 12
node scripts/test-boat-tuning-simple.mjs Dragon 15
node scripts/test-boat-tuning-simple.mjs ILCA7 8
```

## 📦 What's Included

✅ **Skill Uploaded:** `skill_01LwivxRwARQY3ga2LwUJNCj` (boat-tuning-analyst)
✅ **AI Engine:** `services/ai/RaceTuningEngine.ts`
✅ **Service Integration:** `services/RaceTuningService.ts`
✅ **React Hook:** `hooks/useRaceTuningRecommendation.ts`
✅ **Test Scripts:** `scripts/test-boat-tuning-simple.mjs`
✅ **Skill Export:** `scripts/export-boat-tuning-skill.js`

## 🎯 Boat Classes Available

| Class | Guides | Sections |
|-------|--------|----------|
| **J/70** | World Circuit Playbook | Base Rig (8-12 kts), Light Air (4-7 kts) |
| **Dragon** | European Trim Reference | Medium Air (10-14 kts), Heavy Air (18-24 kts) |
| **Etchells** | Grand Prix Settings | Standard Rake (15-18 kts) |
| **ILCA 7** | Olympic Tuning Matrix | Medium Breeze (12-16 kts), Light Air (4-7 kts) |
| **Optimist** | Gold Fleet Fast Pack | Medium Breeze (9-13 kts), Light Air (4-7 kts) |

## 🔧 How to Use in App

```typescript
// In any component
const { recommendation, settings, loading } = useRaceTuningRecommendation({
  className: 'J/70',
  averageWindSpeed: 12,
  pointsOfSail: 'upwind',
  limit: 1
});

// Display the results
if (recommendation) {
  console.log(recommendation.guideTitle);     // "J/70 World Circuit Playbook"
  console.log(recommendation.sectionTitle);   // "Base Rig Tune (8-12 kts)"

  settings.forEach(setting => {
    console.log(`${setting.label}: ${setting.value}`);
    // Upper Shrouds: Loos PT-1M 26
    // Lower Shrouds: Loos PT-1M 23
  });
}
```

## 🐛 Troubleshooting

### No recommendations?
```bash
# Check if guides exist for your class
grep -r "j70\|J/70" data/default-tuning-guides.ts
```

### AI not working?
```bash
# Check API key
echo $EXPO_PUBLIC_ANTHROPIC_API_KEY

# Test the skill directly
node scripts/test-boat-tuning-simple.mjs J/70 12
```

### Settings look generic?
The fallback mode is working. AI mode returns more structured output. Check logs for:
```
🤖 Using AI-generated tuning recommendations  ← AI is working!
✅ Built recommendations                       ← Using fallback
```

## 📝 Key Logs to Watch

In the app console:

```
[RaceTuningService] 🔍 getRecommendations called
[RaceTuningService] 📡 Fetching guides from tuningGuideService
[RaceTuningService] 📚 Retrieved guides: { count: 1 }
[RaceTuningService] 🎯 Candidate sections: { count: 2 }
[RaceTuningService] 🤖 Using AI-generated tuning recommendations  ← Success!
[RaceTuningService] ✅ Built recommendations: { count: 1 }
```

## 🔄 Update the Skill

If you modify tuning guides:

```bash
# 1. Edit the source
vim skills/tuning-guides/boatTuningSkill.ts

# 2. Export
node scripts/export-boat-tuning-skill.js

# 3. Upload (gets new ID)
node upload-single-skill.mjs boat-tuning-analyst

# 4. Update ID in services/ai/SkillManagementService.ts
```

## 🎨 Example Output

```json
{
  "guideTitle": "J/70 World Circuit Playbook",
  "guideSource": "One Design Speed Lab",
  "sectionTitle": "Base Rig Tune (8-12 kts)",
  "conditionSummary": "Baseline that most pro teams lock in before small adjustments for venue",
  "settings": [
    { "label": "Upper Shrouds", "value": "Loos PT-1M 26" },
    { "label": "Lower Shrouds", "value": "Loos PT-1M 23" },
    { "label": "Mast Rake", "value": "21' 7 3/4\" (masthead to transom corner)" },
    { "label": "Forestay Length", "value": "3122 mm (turnbuckle exposed 7 threads)" }
  ],
  "confidence": 0.92
}
```

## 🌐 Where It's Used

- **Race Detail Screen**: Shows tuning card with recommended settings
- **Race Preparation**: Pre-race tuning checklist
- **Dashboard**: Quick tuning overview for upcoming races
- **AI Coach**: Can request tuning advice via chat

## 📚 Full Documentation

See `BOAT_TUNING_AI_GUIDE.md` for complete details on:
- Architecture diagrams
- Performance optimization
- Advanced testing
- Maintenance procedures
- Integration examples

---

**Ready to test?** Run: `node scripts/test-boat-tuning-simple.mjs J/70 12` 🚀
