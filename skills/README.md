# RegattaFlow Claude Skills

This directory contains Claude Skills for specialized AI operations in RegattaFlow.

## What are Claude Skills?

Skills are "folders that include instructions, scripts, and resources that Claude can load when needed" to perform specialized tasks more effectively. They provide:

- **Composable**: Skills can stack together
- **Portable**: Same format across Claude platforms
- **Efficient**: Only loads necessary information (3-level loading system)
- **Powerful**: Includes executable code for precise tasks

## Available Skills

### sailing-document-parser

Expert sailing document extraction for race courses, notices of race, and sailing instructions.

**Purpose:** Extract comprehensive race course information from sailing documents with domain-specific expertise.

**Structure:**
```
sailing-document-parser/
├── SKILL.md                      # Core skill definition (metadata + instructions)
├── sailing-terminology.json      # Comprehensive sailing vocabulary
├── coordinate-patterns.json      # GPS format extraction patterns
├── class-formats.json           # Boat class-specific formats
└── extraction-schemas.json      # Output schemas and validation
```

**Features:**
- Recognizes all standard course types (windward/leeward, triangle, Olympic, etc.)
- Parses GPS coordinates in multiple formats (decimal, DMS, DDM)
- Extracts complete race schedules and timing sequences
- Identifies mark types, colors, and positions
- Parses VHF channels and communication details
- Understands boat class-specific format variations
- Supports regional terminology and format differences

**Token Savings:**
- Traditional: ~2,500 instruction tokens per request
- With Skills: ~100 metadata tokens per request (after initial load)
- **Savings: 94% on recurring extractions**

## Cost Analysis

### Per-Document Extraction (Claude 3.5 Haiku)

**Traditional Approach:**
- Input: 9,500 tokens × $0.80/MTok = $0.0076
- Output: 2,000 tokens × $4.00/MTok = $0.008
- **Total: $0.0156 per extraction**

**With Skills (in session):**
- First extraction: $0.0156 (loads skill)
- Subsequent: ~$0.0048 each (skill cached)
- **Savings: 69% per subsequent extraction**

### Annual Savings Projection

**Scenario: 1,000 active sailors, 50 docs/sailor/year, 5 sessions/sailor**

- Traditional: 50,000 extractions × $0.0156 = **$780/year**
- With Skills: (5,000 × $0.0156) + (45,000 × $0.0048) = **$294/year**
- **Annual Savings: $486 (62%)**

At 10,000 sailors: **$4,860/year savings**
At 100,000 sailors: **$48,600/year savings**

## How Skills Work

### Three-Level Loading System

1. **Level 1: Metadata** (~100 tokens, always loaded)
   - Skill name and description
   - Quick reference for Claude to decide if skill is relevant

2. **Level 2: Instructions** (~2,500 tokens, loaded when triggered)
   - Detailed expertise and extraction guidelines
   - Domain knowledge and patterns
   - Processing instructions

3. **Level 3: Resources** (unlimited size, loaded as needed)
   - JSON reference files
   - Terminology databases
   - Pattern libraries
   - Validation schemas

## Integration with RegattaFlow

### Current Implementation

The `sailing-document-parser` skill is integrated with the Supabase Edge Function:

```typescript
// supabase/functions/extract-race-details/index.ts

// Feature flag to enable Skills
const USE_SKILLS = Deno.env.get('USE_CLAUDE_SKILLS') === 'true';

if (USE_SKILLS) {
  // Simplified prompt - Skills provide domain expertise
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    headers: {
      'anthropic-beta': 'skills-2025-10-02',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-latest',
      // TODO: Add skills parameter when Files API available
      // skills: [{ type: 'file', file_id: 'skill-file-id' }],
      messages: [{ role: 'user', content: simplePrompt }]
    })
  });
}
```

### Enabling Skills

Set the environment variable in Supabase:

```bash
# Via Supabase CLI
supabase secrets set USE_CLAUDE_SKILLS=true

# Or via Supabase Dashboard
# Project Settings → Edge Functions → Environment Variables
# Add: USE_CLAUDE_SKILLS = true
```

## Development Workflow

### Adding a New Skill

1. **Create skill directory:**
   ```bash
   mkdir skills/your-skill-name
   ```

2. **Create SKILL.md with frontmatter:**
   ```markdown
   ---
   name: your-skill-name
   description: Brief description (max 1024 chars)
   ---

   # Your Skill Name

   Detailed instructions and expertise...

   ## Resources Available
   - resource-file.json
   ```

3. **Add resource files:**
   ```bash
   # Add JSON files with domain knowledge
   touch skills/your-skill-name/resource-file.json
   ```

4. **Deploy skill:**
   ```bash
   npx tsx scripts/deploy-sailing-skill.ts
   ```

5. **Update Edge Function to reference skill**

### Testing Skills Locally

```bash
# Test skill structure
npx tsx scripts/deploy-sailing-skill.ts

# Test edge function with Skills
# Set environment variable
export USE_CLAUDE_SKILLS=true
export ANTHROPIC_API_KEY=your-key

# Deploy and test
supabase functions deploy extract-race-details
```

## Future Skills (Planned)

### venue-intelligence
Global sailing venue expertise with regional intelligence.

**Features:**
- 147+ major sailing venues worldwide
- Regional weather API mapping
- Cultural protocols and customs
- Tactical venue-specific knowledge

**Strategic Value:** Supports RegattaFlow's "OnX Maps for Sailing" vision

### race-strategy-analyst
Tactical analysis and strategic recommendations.

**Features:**
- Wind/tide/current analysis frameworks
- Start line strategy patterns
- Performance metrics and KPIs
- Post-race analysis templates

## References

- [Claude Skills Documentation](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)
- [Anthropic Skills Announcement](https://www.anthropic.com/news/skills)
- [Skills Cookbook](https://github.com/anthropics/claude-cookbooks/tree/main/skills)

## Best Practices

1. **Skill Design:**
   - Keep SKILL.md focused and concise
   - Use resource files for large datasets
   - Include confidence scoring guidelines
   - Provide clear examples in instructions

2. **Resource Files:**
   - Use JSON for structured data
   - Keep files focused on single concerns
   - Include validation schemas
   - Document file purposes in SKILL.md

3. **Versioning:**
   - Use Git for skill version control
   - Test thoroughly before deploying
   - Keep backward compatibility when updating
   - Document breaking changes

4. **Security:**
   - Only use Skills from trusted sources
   - Review all Skills before deployment
   - Keep API keys secure (server-side only)
   - Audit Skills regularly

## Troubleshooting

### Skills Not Loading

1. Check beta header is set: `'anthropic-beta': 'skills-2025-10-02'`
2. Verify SKILL.md frontmatter is valid YAML
3. Ensure skill name matches exactly
4. Check Claude API tier supports Skills (Pro, Max, Team, Enterprise)

### Extraction Quality Issues

1. Compare with traditional extraction (set `USE_CLAUDE_SKILLS=false`)
2. Check confidence scores in extraction results
3. Review SKILL.md instructions for clarity
4. Add more examples to resource files
5. Consider upgrading to Claude 3.5 Sonnet for complex documents

### Cost Not Reducing

1. Verify Skills are actually being used (check logs)
2. Ensure requests are in same session (skill caching)
3. Check token counts in API responses
4. Monitor skill loading overhead

## Support

For issues or questions about Skills:
- RegattaFlow: See project CLAUDE.md
- Claude Skills: https://docs.claude.com
- Anthropic Support: https://support.anthropic.com
