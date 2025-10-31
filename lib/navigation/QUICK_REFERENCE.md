# Type-Safe Navigation Quick Reference

## Import

```typescript
import { navigateTo, buildHref } from '@/lib/navigation/routes';
```

## Basic Usage

| Old (Unsafe) | New (Type-Safe) |
|--------------|-----------------|
| `router.push('/(auth)/login')` | `navigateTo(router, '/(auth)/login')` |
| `router.replace('/(tabs)/races')` | `navigateTo(router, '/(tabs)/races', { replace: true })` |
| `router.push(\`/boat/${id}\`)` | `navigateTo(router, '/boat/[id]', { id })` |
| `router.push(route as any)` | `navigateTo(router, route)` |

## Common Routes

### Auth Routes
```typescript
navigateTo(router, '/(auth)/login');
navigateTo(router, '/(auth)/signup');
navigateTo(router, '/(auth)/callback');
```

### Tab Routes
```typescript
navigateTo(router, '/(tabs)/dashboard');
navigateTo(router, '/(tabs)/races');
navigateTo(router, '/(tabs)/schedule');
navigateTo(router, '/(tabs)/settings');
```

### Dynamic Routes
```typescript
// Boat detail
navigateTo(router, '/boat/[id]', { id: boatId });

// Race timer
navigateTo(router, '/race/timer/[id]', { id: raceId });

// Race registration
navigateTo(router, '/(tabs)/race/register/[id]', { id: raceId });

// Club results
navigateTo(router, '/club/results/[raceId]', { raceId: raceId });
```

## With Options

```typescript
// Replace instead of push
navigateTo(router, '/(tabs)/dashboard', { replace: true });

// Dynamic route with replace
navigateTo(router, '/boat/[id]', { id: '123' }, { replace: true });
```

## For Link Components

```typescript
import { Link } from 'expo-router';
import { buildHref } from '@/lib/navigation/routes';

// Static
<Link href={buildHref('/(tabs)/races')}>Races</Link>

// Dynamic
<Link href={buildHref('/boat/[id]', { id: boatId })}>View Boat</Link>
```

## Benefits Checklist

- ✅ Autocomplete in IDE
- ✅ Compile-time route validation
- ✅ Type-checked parameters
- ✅ No more `as any` casts
- ✅ Refactoring safety
- ✅ Self-documenting code

## Migration Command

Find files to migrate:
```bash
grep -r "router\.(push|replace)" app components --include="*.tsx"
```

## Need Help?

- Full docs: `lib/navigation/README.md`
- Migration examples: `lib/navigation/MIGRATION_EXAMPLES.md`
- Add new routes: Edit `lib/navigation/routes.ts`
