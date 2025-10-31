# Type-Safe Navigation

This module provides type-safe navigation helpers for Expo Router to eliminate runtime errors and remove the need for `as any` casts.

## Quick Start

```typescript
import { useRouter } from 'expo-router';
import { navigateTo } from '@/lib/navigation/routes';

function MyComponent() {
  const router = useRouter();

  // Static routes - just pass the route
  navigateTo(router, '/(auth)/login');
  navigateTo(router, '/(tabs)/races');

  // Dynamic routes - pass params as second argument
  navigateTo(router, '/boat/[id]', { id: boatId });
  navigateTo(router, '/race/timer/[id]', { id: raceId });

  // Use replace instead of push
  navigateTo(router, '/(tabs)/dashboard', { replace: true });
}
```

## Migration Guide

### Before (unsafe)

```typescript
// String literals - no compile-time checking
router.push('/(auth)/login');
router.push('/boat/' + id); // Runtime concatenation

// Type casts to avoid Href errors
router.replace(destination as any);
router.push(step.route as any);

// Dynamic routes with template literals
router.push(`/race/timer/${raceId}`);
```

### After (type-safe)

```typescript
// Static routes - compile-time checked
navigateTo(router, '/(auth)/login');

// Dynamic routes - params are type-checked
navigateTo(router, '/boat/[id]', { id: id });

// No more type casts needed!
navigateTo(router, destination);

// Replace option
navigateTo(router, '/(auth)/login', { replace: true });
navigateTo(router, '/race/timer/[id]', { id: raceId }, { replace: true });
```

## Using with Link Components

For `<Link>` components, use the `buildHref` helper:

```typescript
import { Link } from 'expo-router';
import { buildHref } from '@/lib/navigation/routes';

// Static routes
<Link href={buildHref('/(tabs)/races')}>View Races</Link>

// Dynamic routes
<Link href={buildHref('/boat/[id]', { id: boatId })}>View Boat</Link>
```

## Benefits

1. **Compile-time safety** - Typos in routes are caught by TypeScript
2. **Autocomplete** - Your IDE will suggest valid routes
3. **Refactoring** - Rename routes confidently with IDE refactoring tools
4. **Documentation** - Route structure is self-documenting
5. **No more `as any`** - Proper typing eliminates unsafe casts

## Common Patterns

### Conditional Navigation

```typescript
const handleNavigation = (userType: string) => {
  if (userType === 'coach') {
    navigateTo(router, '/(tabs)/dashboard');
  } else {
    navigateTo(router, '/(tabs)/races');
  }
};
```

### With Dynamic Data

```typescript
const viewBoat = (boatId: string) => {
  navigateTo(router, '/boat/[id]', { id: boatId });
};

const startRaceTimer = (raceId: string) => {
  navigateTo(router, '/race/timer/[id]', { id: raceId });
};
```

### Replace Navigation (Login/Logout)

```typescript
// After login
navigateTo(router, '/(tabs)/dashboard', { replace: true });

// After logout
navigateTo(router, '/(auth)/login', { replace: true });
```

## Adding New Routes

When you add a new route to your app:

1. Add the route pattern to `StaticRoute` or `DynamicRoute` in `lib/navigation/routes.ts`
2. TypeScript will now recognize it throughout your app
3. No other changes needed

Example:

```typescript
// Add to StaticRoute
export type StaticRoute =
  | '/'
  | '/(auth)/login'
  | '/my-new-route'  // <-- Add here
  // ... rest

// Add to DynamicRoute for routes with parameters
export type DynamicRoute =
  | '/boat/[id]'
  | '/my-new-route/[param]'  // <-- Add here
  // ... rest
```

## TypeScript Tips

The helper provides intelligent type inference:

```typescript
// TypeScript knows static routes don't need params
navigateTo(router, '/(tabs)/races');
// ✅ Valid

navigateTo(router, '/(tabs)/races', { id: '123' });
// ❌ Error: Static routes don't take params

// TypeScript knows dynamic routes require params
navigateTo(router, '/boat/[id]', { id: '123' });
// ✅ Valid

navigateTo(router, '/boat/[id]');
// ❌ Error: Expected params argument

// TypeScript checks param names
navigateTo(router, '/boat/[id]', { wrongParam: '123' });
// ❌ Error: Property 'id' is missing
```

## ESLint Integration

To prevent direct `router.push('/string')` calls, add this ESLint rule:

```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "CallExpression[callee.property.name='push'] > Literal",
        "message": "Use navigateTo() helper instead of router.push() with string literals"
      },
      {
        "selector": "CallExpression[callee.property.name='replace'] > Literal",
        "message": "Use navigateTo() helper instead of router.replace() with string literals"
      }
    ]
  }
}
```

## Troubleshooting

### "Type instantiation is excessively deep"

If you get this error, it usually means there's a route with multiple parameters. Make sure all dynamic segments are captured in the type.

### Route not recognized

Make sure the route is added to either `StaticRoute` or `DynamicRoute` in `routes.ts`.

### Existing code using `as any`

The most common places to migrate:

1. **OnboardingCompletion.tsx** - Replace `router.replace(step.route as any)`
2. **AuthProvider.tsx** - Replace `router.replace('/')` with typed version
3. **NavigationHeader.tsx** - Replace string literals with typed calls

Search for these patterns to find migration targets:

```bash
# Find router calls with 'as any'
grep -r "router\.(push|replace).*as any" --include="*.tsx" --include="*.ts"

# Find router calls with string literals
grep -r "router\.(push|replace)(['\"]" --include="*.tsx" --include="*.ts"
```
