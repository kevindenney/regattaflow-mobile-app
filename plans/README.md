# RegattaFlow Plans Directory

This directory contains living documents for feature planning and implementation tracking.

## Planning Methodology

This project uses a living document planning methodology to ensure better code quality, clearer thinking, and maintainable development processes.

### How It Works

1. **Initial Planning**: Before implementing any feature, create a plan document in this directory
2. **Collaborative Design**: Use the planning phase to refine approach through discussion
3. **Living Document**: Update the plan during implementation as requirements change
4. **Source of Truth**: The plan becomes the authoritative reference instead of sprawling conversations
5. **Fresh Sessions**: Can start new development sessions with just the plan as context

### Plan Structure

Each plan should include:
- **Feature Description**: Clear rephrasing of what needs to be built
- **Implementation Details**: Technical approach with code examples/pseudo-code
- **Quality Checks**: Commands for linting, type checking, and testing
- **Progress Tracking**: Updated during implementation

### File Naming

Use kebab-case for plan filenames:
- `user-authentication.md`
- `regatta-results-display.md`
- `sailor-profile-management.md`

### Example Plans

See `example-feature.md` for a template and complete example.

## Quality Commands

For this project, always run these commands after implementation:

```bash
npm run lint        # ESLint checks
npm run build       # Type checking and build verification
```