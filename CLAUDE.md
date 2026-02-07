# CLAUDE.md - RegattaFlow App

This file provides context for Claude Code when working on this project.

## Project Overview

RegattaFlow is a comprehensive sailing race management and training platform built with Expo/React Native. It serves three main user personas:
- **Sailors**: Race preparation, performance tracking, learning resources
- **Coaches**: Athlete management, session planning, analytics
- **Clubs/Race Officers**: Race management, results, fleet administration

## Tech Stack

- **Framework**: Expo SDK 54 with React Native 0.81
- **Router**: Expo Router (file-based routing in `app/` directory)
- **Styling**: NativeWind (TailwindCSS for React Native)
- **UI Components**: Gluestack UI
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- **State Management**: TanStack React Query
- **AI**: Anthropic Claude SDK, Google Generative AI
- **Maps**: MapLibre GL, react-map-gl, Google Maps
- **Payments**: Stripe (native and web implementations)
- **Language**: TypeScript

## Project Structure

```
app/                    # Expo Router pages (file-based routing)
  (auth)/              # Auth flow screens (login, signup, callback)
  (tabs)/              # Main tab navigation screens
  club/                # Club management screens
  coach/               # Coach-specific screens
  race/                # Race-related screens

components/            # React components organized by feature
  dashboard/           # Dashboard components per persona
  landing/             # Marketing/landing page components
  learn/               # Learning/academy components
  map/                 # Map visualization components
  races/               # Race-related UI components
  ui/                  # Shared UI primitives (Gluestack-based)
  venue/               # Venue intelligence components

services/              # Business logic and API services
  ai/                  # AI-powered services
  venue/               # Venue-related services
  weather/             # Weather data services
  tides/               # Tidal data services

hooks/                 # Custom React hooks
  useData.ts           # Primary data fetching hook
  useEnrichedRaces.ts  # Race data with enrichments
  useApi.ts            # API utility hooks

lib/                   # Utilities and configuration
  auth/                # Auth utilities
  subscriptions/       # Subscription management
  i18n/                # Internationalization

providers/             # React Context providers
  AuthProvider.tsx     # Authentication state

types/                 # TypeScript type definitions

supabase/              # Supabase configuration
  migrations/          # SQL migration files

api/                   # Vercel serverless functions
  public/              # Public API endpoints

skills/                # Claude Skills for AI features
```

## Common Commands

```bash
# Development
npm start                    # Start Expo dev server (with 12GB memory)
npm run start:reset          # Reset cache and start fresh
npm run web                  # Start web only

# Building
npm run build:web            # Build for web (Vercel deployment)

# Code Quality
npm run typecheck            # Run TypeScript type checking
npm run lint                 # Run ESLint

# Database
npm run seed:rhkyc           # Seed demo data for RHKYC

# Supabase
npx supabase db push         # Push migrations to remote
npx supabase functions deploy # Deploy edge functions
```

## Database (Supabase)

### Environment Variables
```
EXPO_PUBLIC_SUPABASE_URL     # Supabase project URL
EXPO_PUBLIC_SUPABASE_ANON_KEY # Supabase anon/public key
```

### Key Tables
- `users` / `profiles` - User accounts and profiles
- `clubs` - Sailing clubs
- `fleets` - Fleet groups within clubs
- `races` / `race_series` - Race events and series
- `race_entries` - Race registrations
- `race_results` - Race results and scoring
- `venues` / `racing_areas` - Venue and racing area data
- `coaching_sessions` - Coach session records
- `boats` / `boat_classes` - Boat information

### Migrations
Migrations are in `supabase/migrations/`. Use timestamped naming:
```
YYYYMMDDHHMMSS_description.sql
```

## Key Patterns

### Data Fetching
Use TanStack React Query via custom hooks:
```typescript
// hooks/useData.ts provides primary data access
const { data, isLoading, error } = useData<Type>('queryKey', fetchFn);
```

### Services Pattern
Services in `services/` encapsulate business logic:
```typescript
// Singleton pattern with static methods
export class MyService {
  static async getData(): Promise<Data> { ... }
}
```

### Platform-Specific Files
Use file extensions for platform code:
```
Component.tsx          # Shared
Component.native.tsx   # iOS/Android only
Component.web.tsx      # Web only
```

### Environment Variables
Prefix with `EXPO_PUBLIC_` for client-side access:
```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_ANTHROPIC_API_KEY
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
```

## Coding Conventions

### TypeScript
- Strict mode enabled
- Prefer interfaces over types for objects
- Use explicit return types on exported functions

### Web Compatibility

⚠️ **Alert Usage**: Never use `Alert.alert()` directly - it doesn't work on web!

**Use instead:**
```typescript
import { showAlert, showConfirm } from '@/lib/utils/crossPlatformAlert';

// Simple alert
showAlert('Error', 'Something went wrong');

// Confirmation dialog
showConfirm('Delete', 'Are you sure?', () => handleDelete(), { destructive: true });
```

See [docs/WEB_COMPATIBILITY.md](docs/WEB_COMPATIBILITY.md) for complete API reference and migration guide.

### Styling
- Use NativeWind/Tailwind classes: `className="flex-1 bg-white"`
- Design tokens in `lib/design-tokens.ts`
- Responsive: use `web:` prefix for web-specific styles

### File Naming
- Components: PascalCase (`RaceCard.tsx`)
- Hooks: camelCase with `use` prefix (`useRaceData.ts`)
- Services: PascalCase with `Service` suffix (`RaceService.ts`)
- Types: PascalCase in dedicated files

### Imports
- Use `@/` alias for project root imports
- Group: React, external libs, internal modules, types

## AI Integration

### Claude Skills
Skills are in `skills/` directory with `SKILL.md` files defining capabilities.
Upload via `upload-all-skills.mjs`.

### AI Services
- `services/aiService.ts` - Core AI interactions
- `services/ai/` - Specialized AI services
- Uses Anthropic SDK and Google Generative AI

## Deployment

### Web (Vercel)
- Config in `vercel.json`
- API routes in `api/` directory
- Build: `npm run build:web`

### Mobile (EAS)
- Config in `eas.json`
- App config in `app.json` and `app.config.js`

## Testing Demo Users

See `DEMO_USERS_QUICK_REF.md` for test account credentials.

## Key Files to Know

- `app/_layout.tsx` - Root layout with providers
- `providers/AuthProvider.tsx` - Auth state management
- `services/supabase.ts` - Supabase client setup
- `hooks/useData.ts` - Primary data hook
- `tailwind.config.js` - Tailwind/NativeWind config
- `metro.config.js` - Metro bundler config

## Notes

- Memory limit: Node runs with `--max-old-space-size=12288` for large builds
- Web platform uses `react-native-web` for compatibility
- MapLibre GL used for map rendering (open-source alternative to Mapbox)
