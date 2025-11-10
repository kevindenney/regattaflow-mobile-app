# RegattaFlow Claude Skills Reference

This document lists all available Claude Skills in the RegattaFlow app and their locations.

## Skills Directory Structure

All skills are located in: `/skills/`

Each skill has its own directory containing a `SKILL.md` file with YAML frontmatter that defines:
- **name**: The skill identifier
- **description**: What the skill does
- **Content**: Detailed instructions, input/output contracts, and examples

## Available Skills

### 1. **Boat Tuning Analyst** 
📁 `skills/boat-tuning-analyst/SKILL.md`

**Purpose**: Championship rig tuning recommendations automatically assembled from RegattaFlow tuning guides

**Key Features**:
- Converts tuning guides into race-ready rig setups
- Matches boat class, forecast breeze, and point of sail
- Returns structured JSON with specific settings (shrouds, forestay, mast rake, etc.)
- Includes confidence scores and caveats

**Boat Classes Supported**: J/70, Dragon, ILCA 7, and more

---

### 2. **Tidal Opportunism Analyst**
📁 `skills/tidal-opportunism-analyst/SKILL.md`

**Purpose**: Identifies current-driven opportunities, eddies, and anchoring decisions using bathymetry and WorldTides intel

**Key Features**:
- Maps current vectors at start, mid-race, and finish
- Identifies acceleration zones, eddies, and relief lanes
- Provides anchoring protocols for adverse currents
- Analyzes wind-current interactions

**Output**: Opportunistic moves, relief lanes, anchoring plan with JSON structure

---

### 3. **Slack Window Planner**
📁 `skills/slack-window-planner/SKILL.md`

**Purpose**: Plans optimal timing around tidal slack windows

**Key Features**:
- Identifies slack water periods
- Recommends timing for critical maneuvers
- Coordinates with race timeline

---

### 4. **Current Counterplay Advisor**
📁 `skills/current-counterplay-advisor/SKILL.md`

**Purpose**: Tactical advice for racing in adverse current conditions

**Key Features**:
- Strategies for fighting foul tide
- Relief lane identification
- Course routing in current

---

### 5. **Race Learning Analyst**
📁 `skills/race-learning-analyst/SKILL.md`

**Purpose**: Learns recurring post-race patterns and delivers personalized coaching summaries

**Key Features**:
- Analyzes race history and performance patterns
- Identifies consistent strengths ("keep doing")
- Surfaces highest-leverage focus areas
- Provides actionable practice drills
- Blends RegattaFlow Playbook theory with RegattaFlow Coach execution details

**Output**: Structured coaching with headline, keepDoing, focusNext, practiceIdeas

---

### 6. **Race Strategy Analyst**
📁 `skills/race-strategy-analyst/SKILL.md`

**Purpose**: General race strategy and tactical planning

**Key Features**:
- Pre-race strategy recommendations
- Weather and course analysis
- Fleet positioning advice

---

### 7. **Starting Line Mastery**
📁 `skills/starting-line-mastery/SKILL.md`

**Purpose**: Start line tactics and timing optimization

**Key Features**:
- Bias analysis
- Timing sequences
- Line positioning strategies

---

### 8. **Upwind Strategic Positioning**
📁 `skills/upwind-strategic-positioning/SKILL.md`

**Purpose**: Strategic upwind leg planning

**Key Features**:
- Layline calculations
- Shift detection
- Passing lane identification

---

### 9. **Upwind Tactical Combat**
📁 `skills/upwind-tactical-combat/SKILL.md`

**Purpose**: Close-quarters upwind tactics

**Key Features**:
- Boat-on-boat tactics
- Covering and splitting decisions
- Defensive and offensive moves

---

### 10. **Mark Rounding Execution**
📁 `skills/mark-rounding-execution/SKILL.md`

**Purpose**: Perfect mark rounding technique and tactics

**Key Features**:
- Approach planning
- Inside/outside strategies
- Speed management through turns

---

### 11. **Downwind Speed and Position**
📁 `skills/downwind-speed-and-position/SKILL.md`

**Purpose**: Downwind leg optimization

**Key Features**:
- VMG vs. angle decisions
- Gybe angles
- Surf and planing techniques

---

### 12. **Finishing Line Tactics**
📁 `skills/finishing-line-tactics/SKILL.md`

**Purpose**: Optimal finish line approach and tactics

**Key Features**:
- Finish line bias
- Pin-end vs. RC-end decisions
- Final approach timing

---

## How Skills Are Used

### In Code
Skills are initialized and managed by:
- `services/ai/SkillManagementService.ts` - Core skill management
- `services/ai/EnhancedClaudeClient.ts` - Claude API integration with skills
- `services/ai/RaceTuningEngine.ts` - Boat tuning specific integration
- `services/ai/RaceStrategyEngine.ts` - Race strategy integration

### Skill Upload Process
1. Skills are defined as `SKILL.md` files with YAML frontmatter
2. `SkillManagementService` reads the skill files
3. Skills are uploaded to Anthropic via the Edge Function: `supabase/functions/anthropic-skills-proxy/index.ts`
4. Skills are cached locally for quick access

### API Integration
Skills are invoked through the Anthropic Messages API with:
- Beta header: `skills-2025-10-02`
- Container configuration with skill IDs
- Code execution enabled (required for skills)

## Additional Resources

### Tuning Guides Directory
📁 `skills/tuning-guides/` - Raw tuning guide content for various boat classes

### Generated Skills
📁 `skills/generated/` - Auto-generated skills from PDF processing (RegattaFlow Playbook tactics, etc.)

## Environment Setup

Skills require the following environment variable:
```bash
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key
```

This is configured in:
- `.env` - Local environment variables
- `app.config.js` - Expo configuration (exposes via Constants)
- Edge Function secrets - For Supabase function access

## Recent Fixes

### API Key Access (Fixed Nov 5, 2024)
- Updated `ClaudeClient.ts` and `EnhancedClaudeClient.ts` to properly access API key from Expo Constants
- Supports web/mobile environments via `Constants.expoConfig.extra.anthropicApiKey`

### Skills Upload Format (Fixed Nov 5, 2024)
- Updated Edge Function to use correct form field: `files[]` instead of `files`
- Fixes "No files provided" error from Anthropic API
- Edge Function deployed to Supabase

---

**Note**: To view any skill's full content, read the `SKILL.md` file in the respective skill directory.
