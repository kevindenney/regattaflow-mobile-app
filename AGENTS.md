# Repository Guidelines

## Project Structure & Module Organization
- Expo Router lives in `src/app`, grouped by feature folders such as `src/app/(auth)`; shared UI sits in `src/components`, reusable hooks in `src/hooks`.
- Business logic belongs in `src/services`, `src/providers`, and `src/utils`; Supabase SQL, migrations, and generated types stay within `supabase/`.
- Static media is in `assets/`, automation scripts in `scripts/`, while reference docs and implementation summaries sit under `docs/` and root-level `*_GUIDE.md`. Review them before large refactors.

## Build, Test, and Development Commands
- `npm run start` launches Expo Dev Tools; add `-- --clear` to flush the Metro cache when artifacts linger.
- `npm run android`, `npm run ios`, and `npm run web` build the same bundle for platform-specific targets.
- `npm run lint` enforces `eslint.config.js`; treat warnings as blockers.
- Reset the project with `node scripts/reset-project.js` after dependency bumps or schema resets.
- Run Supabase integrity checks with `node test_supabase_connection.js` and data-focused scripts such as `node test_users_table.js`.

## Coding Style & Naming Conventions
- Favour TypeScript: create `.tsx` components and `.ts` utilities, keeping JSX inside functional components.
- Indent with two spaces; use camelCase for functions and variables, PascalCase for components, SCREAMING_SNAKE_CASE for constants.
- Prefer named exports unless a module exposes a single default component; colocate styles with their component file.

## Testing Guidelines
- UI flows use Playwright (`npx playwright test`); record new journeys with `npx playwright codegen` and keep fixtures small.
- Backend checks live as Node scripts named `test_<scope>.js`; fail fast with non-zero exits and document required env vars at the top of each file.
- Load `.env.local` before running anything against Supabase to supply keys without committing secrets.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `refactor:`, etc.) with subjects under 72 characters; reference Linear or GitHub issues in the body.
- PRs must summarise behaviour changes, note schema or environment impacts, and attach screenshots for UI updates.
- Verify `npm run lint`, targeted platform runs, and Supabase scripts before requesting review; list any migration files added to `supabase/`.

## Security & Configuration Tips
- Do not hard-code Supabase or Stripe credentials; load them via Expo config or `.env.local`, and document new variables in `README.md`.
- Version-control migrations and schema helpers under `supabase/`, and coordinate with ops before running production updates.
- Scrub third-party tokens from logs, screenshots, and recorded demo sessions prior to sharing.
