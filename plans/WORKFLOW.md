# Living Document Planning Workflow - Expo Universal App

This document outlines how to use the living document planning methodology for RegattaFlow development using the Expo Universal architecture.

## Quick Start

### 1. Starting a New Feature
```
I want to implement [feature description]. Check out the previous plan in @plans/example-feature.md to understand the Expo Universal architecture. Write a plan in @plans/[feature-name].md, and let me validate it before starting implementation.
```

### 2. Reviewing and Refining the Plan
- Read through the generated plan carefully
- Provide feedback on implementation approach for universal app
- Discuss platform-specific considerations (mobile vs web)
- Approve the plan before implementation begins

### 3. During Implementation
```
Continue implementing the feature documented in @plans/[feature-name].md. Test on mobile and web, update the plan, and commit changes.
```

### 4. Starting Fresh Sessions
```
Continue the implementation documented in @plans/[feature-name].md.
```

## Detailed Workflow - Expo Universal

### Phase 1: Initial Planning

#### What to Include in Your Request
- **Feature Description**: Clear explanation of what needs to be built
- **User Requirements**: Who will use it and how (mobile vs web users)
- **Platform Considerations**: Any mobile-specific or web-specific needs
- **Reference Plans**: Point to similar existing plans for context
- **Implementation Hints**: Any specific technical preferences (optional)

#### Example Initial Prompt
```
I want to implement a sailor profile management system for the Expo Universal app. Users should be able to:
- Create and edit their sailing profiles on mobile and web
- Add boat information and certifications
- Upload profile photos using camera (mobile) or file picker (web)
- Set privacy settings for profile visibility
- Sync data across all devices

The feature should work seamlessly on iOS, Android, and web using React Native components. Check out @plans/example-feature.md for architectural reference.

Write a plan in @plans/sailor-profiles.md, and let me validate it before starting implementation.
```

### Phase 2: Plan Validation

#### Review Checklist
- [ ] Feature description matches your requirements
- [ ] Implementation works on mobile (iOS/Android) and web
- [ ] React Native components are used appropriately
- [ ] Platform-specific optimizations are included
- [ ] File structure follows Expo Router conventions
- [ ] Authentication/authorization is properly handled
- [ ] Quality checks include all platforms
- [ ] Performance considerations address mobile and web

#### Common Refinements
- Route structure adjustments for Expo Router
- Component organization for universal compatibility
- Data model modifications
- Authentication scope clarifications
- Platform-specific feature variations

### Phase 3: Implementation

#### Living Document Updates
The plan should be updated during implementation to reflect:
- **Discovery**: New requirements or constraints found during development
- **Platform Differences**: Different behaviors on mobile vs web
- **Changes**: Modifications to original approach
- **Issues**: Problems encountered and their resolutions
- **Decisions**: Technical choices made during implementation

#### Regular Check-ins
```
Test the feature on mobile and web, make sure the plan is up to date, run quality checks, and commit changes.
```

#### Quality Commands for Expo Universal
Always run after implementation:
```bash
# Linting and formatting
expo lint                    # ESLint checks for React Native
npx tsc --noEmit            # TypeScript type checking

# Test builds
expo export:web             # Test web build
eas build --platform all --local  # Test mobile builds (optional)

# Platform testing
expo start --web           # Test web version
expo start --ios           # Test iOS simulator
expo start --android       # Test Android emulator
```

### Phase 4: Completion

#### Final Plan Update
- Mark status as "Complete"
- Document any deviations from original plan
- Add testing notes for all platforms
- Include any future enhancement ideas
- Note platform-specific considerations for future reference

#### Documentation Review
- Ensure plan accurately reflects what was built
- Update implementation log with final status
- Note any technical debt or follow-up items
- Document performance characteristics on different platforms

## Best Practices - Expo Universal

### Planning Phase
- **Be Specific**: Include detailed requirements for mobile and web
- **Reference Existing Work**: Point to similar features for consistency
- **Consider Platform Differences**: Think about mobile vs web user experiences
- **Plan for Universal Components**: Use React Native components that work everywhere
- **Plan for Testing**: Include testing approach for all platforms

### During Implementation
- **Test on All Platforms**: Regularly test on iOS, Android, and web
- **Update Frequently**: Don't let the plan become stale
- **Document Platform Differences**: Note any platform-specific implementations
- **Track Issues**: Note problems and their solutions for future reference
- **Validate Quality**: Run linting and type checking regularly

### Plan Organization
- **Use Clear Headers**: Make plans easy to scan and navigate
- **Include Code Examples**: Show React Native component structure
- **Maintain History**: Keep an update log for complex features
- **Link Related Plans**: Reference other plans that influenced this one
- **Platform Notes**: Include sections for platform-specific considerations

## Common Patterns for RegattaFlow Expo Universal

### Authentication Integration (Universal)
```typescript
// Standard pattern for protected features - works on all platforms
import { useAuth } from '@/src/lib/contexts/AuthContext'
import { View, Text } from 'react-native'

export function ProtectedFeature() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!user) return <AuthRequired />

  return <FeatureContent />
}
```

### Platform-Specific Components
```typescript
// Universal component with platform adaptations
import { Platform, View } from 'react-native'

export function UniversalButton({ onPress, title }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        // Universal styling
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#007AFF',
        // Platform-specific adjustments
        ...(Platform.OS === 'web' && {
          cursor: 'pointer',
          userSelect: 'none',
        }),
      }}
    >
      <Text style={{ color: 'white', textAlign: 'center' }}>
        {title}
      </Text>
    </TouchableOpacity>
  )
}
```

### Supabase Data Patterns (Universal)
```typescript
// Standard collection naming and structure (unchanged)
const collections = {
  users: 'users',
  regattas: 'regattas',
  results: 'regatta-results',
  sailors: 'sailor-profiles'
}

// Universal data fetching
import { supabase } from '@/src/lib/supabase'

export async function fetchUserData(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  return { data, error }
}
```

### Component Structure (Expo Universal)
```
src/components/[feature]/
├── index.ts              # Barrel exports
├── [Feature]List.tsx     # Data display (universal)
├── [Feature]Form.tsx     # Data input (universal)
├── [Feature]Card.tsx     # Summary display (universal)
├── [Feature]Screen.tsx   # Full screen component
└── types.ts              # Local type definitions
```

### File Organization (Expo Router)
```
app/                      # Expo Router - file-based routing
├── (tabs)/              # Tab navigation
│   ├── _layout.tsx      # Tab layout
│   ├── index.tsx        # Home screen
│   └── [feature].tsx    # Feature screens
├── (modal)/             # Modal screens
├── [feature]/           # Feature detail screens
│   └── [id].tsx         # Dynamic routes
└── _layout.tsx          # Root layout

src/                     # Source code
├── components/          # Universal React Native components
├── lib/                 # Utilities and configurations
├── contexts/            # React contexts (universal)
├── hooks/               # Custom hooks (universal)
├── services/            # API services (universal)
└── types/               # TypeScript definitions
```

## Platform Testing Strategy

### Development Testing
```bash
# Test all platforms simultaneously
expo start               # Choose platform from menu

# Platform-specific testing
expo start --web        # Web browser testing
expo start --ios        # iOS simulator
expo start --android    # Android emulator
```

### Build Testing
```bash
# Web build testing
expo export:web
cd dist && npx serve    # Test production web build

# Mobile build testing (optional during development)
eas build --platform ios --local
eas build --platform android --local
```

### Quality Assurance Checklist
- [ ] Feature works on web browsers (Chrome, Safari, Firefox)
- [ ] Feature works on iOS simulator/device
- [ ] Feature works on Android emulator/device
- [ ] Responsive design adapts to different screen sizes
- [ ] Navigation works consistently across platforms
- [ ] Performance is acceptable on all platforms
- [ ] Accessibility standards are met

## Troubleshooting Expo Universal

### Plan Getting Out of Sync
- Clear the conversation and start fresh with: "Continue the implementation documented in @plans/[feature-name].md"
- Update the plan with current status before continuing
- Test on all platforms after updates

### Platform-Specific Issues
- Check if issue is platform-specific using `Platform.OS`
- Use platform-specific code when necessary
- Test solutions on affected platforms
- Document platform differences in the plan

### Implementation Stuck
- Review the plan's implementation steps
- Break down current task into smaller steps
- Check if requirements have changed since planning
- Test on different platforms to isolate issues

### Quality Issues
- Ensure `expo lint` and `npx tsc --noEmit` pass
- Test `expo export:web` builds successfully
- Review plan's quality checklist for all platforms
- Add missing error handling or edge cases

## Integration with Git

### Commit Messages
Include plan references in commit messages:
```
feat: implement sailor profile creation for universal app (see @plans/sailor-profiles.md)
fix: resolve web-specific navigation issue in race results
refactor: optimize universal component performance
```

### Branch Naming
Use plan-based branch names:
```
feature/sailor-profiles-universal
fix/web-navigation-issue
refactor/universal-components
```

## Deployment Considerations

### Web Deployment (Vercel)
```bash
# Build and deploy web version
expo export:web
vercel deploy
```

### Mobile Deployment (EAS)
```bash
# Build and submit mobile versions
eas build --platform all
eas submit --platform all
```

### Testing Deployments
- Test web deployment on multiple browsers
- Test mobile builds on physical devices when possible
- Verify feature parity across all platforms

This workflow ensures that every feature is thoughtfully planned for universal compatibility, properly implemented across all platforms, and thoroughly tested before deployment.