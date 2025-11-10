# Boat Tuning Analyst Skill

## Overview
- Converts RegattaFlow's structured tuning guides into an Anthropic Claude Skill.
- Uses the new generator at `skills/tuning-guides/boatTuningSkill.ts` to keep the skill synchronized with `data/default-tuning-guides.ts`.
- Outputs machine-consumable rig, sail, and hull settings aligned with the existing `RaceTuningService` schema.

## Key Files
- `skills/tuning-guides/boatTuningSkill.ts` — programmatic skill definition derived from default guides.
- `skills/boat-tuning-analyst/SKILL.md` — Markdown skill file produced by the export script.
- `scripts/export-boat-tuning-skill.js` — transpiles the TypeScript definition and writes `SKILL.md`.
- `services/ai/SkillManagementService.ts` — registers `boat-tuning-analyst` for automatic initialization.
- `scripts/initialize-skills.ts` — now uploads the boat tuning skill alongside existing tactical skills.

## Usage
1. Regenerate the markdown skill after updating tuning guides:
   ```bash
   node scripts/export-boat-tuning-skill.js
   ```
2. Upload to Anthropic via existing tooling:
   ```bash
   node upload-single-skill.mjs boat-tuning-analyst
   ```
3. Or initialize automatically inside the app:
   ```ts
   const service = new SkillManagementService();
   await service.initializeBoatTuningSkill();
   ```

## Output Contract
- Designed to mirror `RaceTuningRecommendation` objects:
  - `class`, `guideTitle`, `guideSource`, `sectionTitle`, `conditionSummary`
  - `settings`: array of `{ key, rawKey, label, value }`
  - `notes`, `tags`, `confidence`, `matchScore`, `caveats`
- Emphasizes wind-speed matching, point-of-sail filters, and rig package assumptions.

## Next Steps
- Wire the new skill into a `RaceTuningEngine` service for AI-powered tuning recommendations.
- Extend `DEFAULT_GUIDES` with additional classes or sections as new material is ingested.

