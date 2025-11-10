# Skills Upload Summary - November 2, 2025

## Successfully Uploaded Skills ✅

| # | Skill Name | Skill ID | Description |
|---|------------|----------|-------------|
| 1 | race-strategy-analyst | `skill_01KGEyGE97qaPmquNwc48MqT` | Expert sailing race strategy analyst combining the RegattaFlow Playbook principles |
| 2 | tidal-opportunism-analyst | `skill_01859NpM6B8cz7E1NdpbdZzC` | Identifies current-driven opportunities, eddies, and anchoring decisions |
| 3 | slack-window-planner | `skill_01FCQFcE8NTV1eouW4pjoutE` | Builds maneuver timelines around upcoming slack, high, and low tide windows |
| 4 | current-counterplay-advisor | `skill_01PefwFB6ANCctXtzn4G1kj8` | Advises on current-based tactics against opponents (lee bow, safe leeward, etc.) |
| 5 | starting-line-mastery | `skill_012pEW2MsTCL43kPzqAR21Km` | Execute championship-level starts through line bias analysis and positioning |
| 6 | upwind-strategic-positioning | `skill_01AuNhbjToKmtQtUes4VJRW9` | Master upwind strategy through wind pattern recognition and ladder theory |
| 7 | upwind-tactical-combat | `skill_011j4LTzxf7c1Fn4nwZbLWA7` | Master boat-on-boat tactical confrontations through covering and defense |
| 8 | downwind-speed-and-position | `skill_01EEj8tqRPPsopupvpiBmzyD` | Master reaching and running through optimal VMG angles and puff tactics |
| 9 | mark-rounding-execution | `skill_01HeDxSUo8fm1Re7fdqCGhMi` | Master mark roundings through wide-and-close technique |

**Total Uploaded: 9/10 skills**

## New Skill Ready for Upload 🚧

| Skill Name | Status | How to Upload |
|------------|--------|---------------|
| boat-tuning-analyst | Generated locally (not yet uploaded) | `node scripts/export-boat-tuning-skill.js` then `node upload-single-skill.mjs boat-tuning-analyst` |

**Skill Definition:** `skills/boat-tuning-analyst/SKILL.md` (auto-generated from RegattaFlow tuning guides)  
**Initialization Helper:** `SkillManagementService.initializeBoatTuningSkill()`

## Failed Upload ❌

| Skill Name | Status | Error | Request ID |
|------------|--------|-------|------------|
| finishing-line-tactics | Failed | Internal server error | req_011CUissSuo8465AH8uCoGjo |

### Troubleshooting Steps for finishing-line-tactics

**File Details:**
- Size: 13,093 bytes (13KB)
- Format: Markdown with YAML frontmatter
- Location: `skills/finishing-line-tactics/SKILL.md`

**Possible Issues:**
1. **API Rate Limiting**: Uploading 10 skills rapidly may have triggered rate limits
2. **Temporary API Issue**: Anthropic's Skills API may be experiencing issues
3. **Content Validation**: Some content may not meet API validation rules

**Next Steps:**
1. Wait 5-10 minutes and retry upload
2. Check Anthropic status page for API incidents
3. Verify YAML frontmatter format matches other skills
4. Try uploading with modified content (shorter description)

## Deployment Notes

### Skills Now Available in Claude
All 9 successfully uploaded skills are now accessible via the Anthropic Skills API and can be invoked in Claude conversations using the extended thinking features.

### Integration with RegattaFlow
These skills are designed to be called by:
- `services/ai/SkillManagementService.ts` - Skill discovery and invocation
- `supabase/functions/anthropic-skills-proxy/index.ts` - Edge function proxy
- AI coaching components throughout the app

### Skill Metadata Location
The skills are now stored in:
- **Anthropic Cloud**: Accessible via Skills API with the IDs above
- **Local Backup**: `skills/` directory in regattaflow-app

## Upload Script Reference

**Batch Upload (all skills):**
```bash
node upload-skills-zip.mjs
```

**Single Skill Upload:**
```bash
node upload-single-skill.mjs <skill-name>
```

## RegattaFlow Coach Racing Tactics Integration

The new `finishing-line-tactics` skill (currently pending upload) completes the tactical knowledge base extracted from RegattaFlow Coach's "The Yachtsman's Guide to Racing Tactics" PDF.

**Coverage Map:**
- ✅ Starting: `starting-line-mastery`
- ✅ Upwind Strategy: `upwind-strategic-positioning`  
- ✅ Upwind Tactics: `upwind-tactical-combat`
- ✅ Mark Rounding: `mark-rounding-execution`
- ✅ Downwind: `downwind-speed-and-position`
- ⏳ Finishing: `finishing-line-tactics` (pending)
- ✅ Tidal Racing: `tidal-opportunism-analyst`, `slack-window-planner`, `current-counterplay-advisor`

## Next Actions

1. **Retry finishing-line-tactics upload** after waiting period
2. **Test skill invocation** in Claude Code or app
3. **Monitor skill usage** via Anthropic API logs
4. **Document skill interaction patterns** for coaching AI

---
Generated: November 2, 2025 18:07 PST
