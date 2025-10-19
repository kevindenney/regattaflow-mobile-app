# RegattaFlow Frontend Skill

## Overview

This skill teaches AI agents the RegattaFlow React Native/Expo frontend development patterns, conventions, and best practices. It ensures consistent component structure, proper navigation, platform-specific implementations, and adherence to our design system.

## What This Skill Covers

1. **Component Patterns** - Structure, interfaces, styling conventions
2. **Screen Patterns** - Loading/error/empty/success states, navigation
3. **Platform-Specific Code** - Web vs. Native implementations
4. **Navigation** - Expo Router file-based routing patterns
5. **State Management** - Local state, Zustand, Context patterns
6. **Styling** - Color palette, spacing, typography, shadows
7. **Data Fetching** - Service integration, error handling, optimistic updates

## Token Savings

### Before (Without Skill):
Agent generates full component structure, styling conventions, error handling patterns, and navigation logic from scratch.
- Component creation: ~1,200 tokens
- Screen creation: ~1,800 tokens
- Navigation setup: ~600 tokens

### After (With Skill):
Agent references established patterns from skill documentation.
- Component creation: ~400 tokens (reference template, modify for use case)
- Screen creation: ~600 tokens (reference template, modify for use case)
- Navigation setup: ~200 tokens (reference pattern)

**Savings:** 66-75% reduction in generated code tokens

### Cost Impact (Projected)

```bash
Typical development session: 10 components/screens created

Before: 10 × 1,500 tokens avg = 15,000 output tokens
After: 10 × 500 tokens avg = 5,000 output tokens

Savings per session: 10,000 tokens
Cost savings: 10k × $0.005/1k = $0.05 per session

Annual (100 sessions): 100 × $0.05 = $5.00/year
```

**Note:** Primary value is code consistency and quality, not just cost savings.

## Resources

### Templates

1. **component-template.tsx** - Starting point for new components
   - Demonstrates interface conventions
   - Shows proper styling structure
   - Includes common patterns (optional props, status indicators, actions)

2. **screen-template.tsx** - Starting point for new screens
   - Four states pattern (loading, error, empty, success)
   - Service integration
   - FlatList with pull-to-refresh
   - Navigation patterns

### How to Use Templates

1. Copy template file to your target location
2. Rename to match your component/screen name
3. Update interface with your data structure
4. Modify render logic for your use case
5. Adjust styling as needed

The templates are designed to be ~80% complete for typical use cases, requiring only minimal modification.

## Integration with Development

### When Agent Uses This Skill

The AI agent automatically references this skill when:
- Creating new React Native components
- Implementing new Expo Router screens
- Setting up navigation flows
- Applying styling and design system
- Implementing state management
- Handling data fetching and loading states

### Example Usage

**User Request:**
"Create a RaceCard component that displays race information"

**Without Skill:**
Agent generates ~1,200 tokens of boilerplate including import structure, interface definition, component logic, styling, etc.

**With Skill:**
Agent references component template and conventions:
- "Use component-template.tsx as base"
- "Follow RegattaFlow interface conventions (RaceCardProps)"
- "Apply standard card styling from design system"
- "Use Ionicons for race type icon"

Output: ~400 tokens with references to established patterns

## Maintenance

### Updating This Skill

When frontend conventions change:

1. Update `skill.md` with new patterns
2. Update templates if structure changes
3. Document breaking changes in README
4. Version the skill (see Version History below)

### Version History

- **v1.0** (2025-10-18): Initial creation with component/screen templates

## Best Practices

### For Developers

1. **Follow the patterns** - Use templates as starting points
2. **Update when needed** - If you find better patterns, update the skill
3. **Stay consistent** - Deviations should be rare and documented

### For AI Agent

1. **Reference, don't copy** - Use skill as guide, adapt to specific needs
2. **Maintain conventions** - Follow import order, naming, styling patterns
3. **Validate against templates** - Ensure output matches established structure

## Related Skills

- **regattaflow-data-models** - Database patterns and RLS conventions
- **regattaflow-maplibre** - 3D visualization patterns
- **sailing-document-parser** - Document extraction utilities

---

**Maintained by:** RegattaFlow Development Team
**Last Updated:** 2025-10-18
