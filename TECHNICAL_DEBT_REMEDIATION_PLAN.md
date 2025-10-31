# RegattaFlow TypeScript Remediation Plan

## 1. Domain Map & Scope

| Domain | Primary Surfaces | Key Pain Points | Priority |
| --- | --- | --- | --- |
| Auth & Navigation | `(auth)` stack, `app/index.tsx`, settings flows | Expo Router `Href` union errors, string routes scattered across stacks | 1 |
| Shared API Hooks | `hooks/useApi.ts`, `hooks/useData.ts`, services importing Supabase | `useApi`/`useMutation` return `{ data, error, loading }` objects but callers expect typed payloads; pervasive `unknown` casts | 1 |
| Race Analysis & Timer | `app/race-analysis.tsx`, `app/race/timer`, `services/RaceAnalysisService.ts` | Missing interfaces for analysis payloads, inconsistent Supabase selects | 2 |
| Venue Intelligence | `services/venue/*`, `components/venue/*` | Enum/name drift (`primaryClubs` vs `yachtClubs`), tests accessing private helpers | 2 |
| Tactical & Forecast Services | `services/tactical/*`, `services/TimeBasedForecastService.ts` | Prototype data shapes not aligned with shared types; optional chaining gaps | 3 |
| Legacy Screens (experimental) | `components/map/*`, `race-strategy` stack | Reference stale services; should be quarantined or feature-flagged | 3 |

## 2. Remediation Strategy

1. **Freeze scope**
   - Pause new feature work touching domains above until `tsc` is green.
   - Gate branches on lint/tsc before merge (Git hook or CI).

2. **Normalize API layer**
   - Regenerate Supabase types (`supabase gen types typescript --project ...`) into `types/database.d.ts`.
   - Update `useApi<T>` signature to accept `() => Promise<T>` and wrap legacy services with an adapter returning `{ data, error }`.
   - Incrementally update callers (start with auth/profile hooks) replacing `as` casts with typed responses.

3. **Router compliance sweep**
   - Add helper `navigateTo(path: RouteKey, params?: Record<string, string>)` returning `Href`.
   - Script (`scripts/find-raw-routes.ts`) to surface plain string pushes.
   - Fix `(auth)`, settings, onboarding first; then run script until clean.

4. **Race analysis domain**
   - Define `RaceTimerSession` and `AiCoachAnalysis` interfaces in `types/race.ts`.
   - Adjust `hooks/useData.ts` selects to match shape (explicit fields, no `*`).
   - Update consumer screens (`app/race-analysis.tsx`, etc.) and services to use new types.

5. **Venue/forecast cleanup**
   - Align enum literal sets (`primaryClubs`, `SocialProtocol.importance`, etc.) and expose getters (`getAllVenues`, `getDistanceBetweenCoordinates`) via public API instead of private methods.
   - Update tests to rely on public methods only.
   - Quarantine unfinished services (move under `services/experimental` or behind feature flag) if they still fail after type alignment.

6. **Verification cadence**
   - After each domain pass: run `npx tsc --noEmit` and `npm run lint`.
   - Add CI job to enforce TS before merge.

## 3. Sequencing & Owners

| Sprint | Focus | Deliverables | Owner |
| --- | --- | --- | --- |
| Week 1 | Auth/Router + API layer | Regenerated Supabase types, updated `useApi`, router helper, clean `npx tsc` for auth stack | Platform squad |
| Week 2 | Race analysis domain | Typed data structures, passing `app/race-analysis.tsx`, timer screens | Data/Insights squad |
| Week 3 | Venue intelligence + tests | Enum alignment, public API usage, venue tests green | Maps squad |
| Week 4 | Tactical/forecast + experimental quarantine | Either typed or feature-flagged modules, doc of remaining debt | R&D squad |

## 4. Tooling Changes

- Enable **TypeScript project references** to isolate surface areas (optional).
- Add ESLint rule banning `router.push('/foo')` literal strings (`no-restricted-syntax`).
- Introduce `ts-prune` or similar to flag dead services when quarantining.

## 5. Communication

- Share plan in next engineering sync; assign domain owners.
- Track progress in Linear/Jira with linked tasks per domain.
- Publish weekly update (status, next blockers, ts errors count).

## 6. Exit Criteria

- `npx tsc --noEmit` completes without errors.
- Router helper ensures compile-time safety; lint rule enforced.
- API hooks & core domains operate on typed payloads—no `any` casts in touched code.
- Remaining experimental modules documented and optionally excluded from production builds.
