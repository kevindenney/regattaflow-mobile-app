# Migration Skip Triage (`supabase/migrations/*.skip`)

Generated: 2026-03-02

## Scope
- Reviewed all `14` `.skip` files in `supabase/migrations`.
- Classified each file as one of:
  - `convert to active`
  - `keep archived`
  - `delete`
- Inferred dependencies from active migrations and current app/service usage.

## Executive Summary
- `convert to active`: 5
- `keep archived`: 6
- `delete`: 3

## Per-File Triage

| File | Classification | Why | Dependencies / References | Risk Notes |
|---|---|---|---|---|
| `20251105000000_seed_demo_race_analysis.sql.skip` | keep archived | Demo seed only with hardcoded IDs; not schema-critical. | `race_analysis` exists; later demo seeds exist (`20260113100000_add_demo_sailor_race_analysis.sql`, `20260113100001_add_demo_sailor2_race_analysis.sql`). | Low runtime risk; activating adds non-prod data to prod-like DBs. |
| `20251106121000_create_mock_coach_data.sql.skip` | keep archived | Test/demo data with fixed user IDs and profile assumptions. | Coach cleanup path exists (`20260219124617_remove_demo_coaches.sql`). | Medium if activated accidentally (pollutes production data, FK assumptions). |
| `20251109000000_seed_fleet_race_prep_data.sql.skip` | keep archived | Demo-only fleet/race feed seed with fixed UUIDs. | Depends on specific fleet/users/boat class rows. | Medium data pollution risk; low schema value. |
| `20251109130000_add_coaching_clients_fkeys_and_mock_data.sql.skip` | delete | Mixed concerns (schema + mock data), duplicates FK intent in `202511091400...skip`, and embeds non-portable demo inserts. | Overlaps `20251109140000_add_coaching_clients_foreign_keys.sql.skip`. | High accidental data-seed risk; keep logic in separated migrations only. |
| `20251109140000_add_coaching_clients_foreign_keys.sql.skip` | convert to active | `coaching_clients` table is active in base coaching migrations but FK integrity is still missing in active chain. This is the clean FK-only version. | `coaching_clients` created in `20251101100000_adapt_existing_coaching_schema.sql` (+ variants). Views/functions join against this table in active migrations. | Medium: may fail if orphan rows exist. Recommendation: activate as a new migration with pre-check/cleanup (`NOT VALID` + validate). |
| `20251109150000_sync_sailor_boats_to_classes.sql.skip` | keep archived | One-time data backfill to repair legacy inconsistency; not required for greenfield schema. | `sailor_boats`, `sailor_classes` are active and secured in later migrations. | Low-medium: harmless idempotent insert, but historical repair best left manual/on-demand. |
| `20251201000001_create_race_crew_assignments_table.sql.skip` | convert to active | App services actively query this table (`services/crewManagementService.ts`), but no active migration creates it. | References in code; only function hardening appears in active migration (`20260107103500_fix_security_warnings.sql`), not table DDL. | High functional risk if kept skipped (runtime failures/feature disabled). Activate via new timestamped migration. |
| `20251201100000_create_venue_knowledge_platform.sql.skip` | convert to active | Foundational venue knowledge tables are used by app services and later active migrations alter them. | `services/venue/VenueDocumentService.ts` uses `venue_knowledge_documents`, `venue_knowledge_insights`, `venue_content_freshness`. Active migration `20260101000000_add_racing_area_scoping.sql` alters these tables. `20260127120000_community_knowledge_feed.sql` explicitly says it extends the `.skip` platform. | High migration-chain risk if skipped in clean environments; activating should be done with policy review/hardening pass. |
| `20251202000001_rule42_tracking.sql.skip` | convert to active | Feature service exists and reads/writes `rule42_infractions`; no active migration creates table/views. | `services/Rule42Service.ts` references `rule42_infractions`. | Medium-high: feature breakage if absent. Validate RLS role list against current org role model before activation. |
| `20251202000002_live_race_signals.sql.skip` | convert to active | Feature services and UI rely on `race_signals`, `live_race_state`, and `saved_regattas`; no active migration creates them. | `services/RaceSignalService.ts` and `app/(tabs)/my-events.tsx` (`saved_regattas`). | High functional risk if kept skipped. Review RLS for `club_members` role assumptions before activation. |
| `20260102000000_add_fleet_notifications_foreign_keys.sql.skip` | keep archived | FK retarget to `profiles(id)` is optional and can conflict with existing `auth.users` assumptions depending on data hygiene. Not required for current runtime behavior. | Base table created in `20251109150000_create_fleet_social_schema.sql` with `auth.users` FKs. | Medium if activated blindly (constraint failures where profile rows are missing). Consider separate audited migration if needed. |
| `20260102000000_email_confirmation_welcome.sql.skip` | keep archived | Superseded by active trigger/function evolution. | Active alternatives: `20260102100000_fix_welcome_email_trigger_for_auto_confirm.sql`, later hardened in `20260107103500_fix_security_warnings.sql` (`schedule_onboarding_emails_on_confirmation`, `get_pending_emails_to_send`). | High if reactivated (trigger drift, duplicate scheduling logic, auth schema trigger complexity). |
| `20260209200000_delete_demo_users.sql.skip` | delete | Highly destructive one-off cleanup with broad hardcoded deletes; not safe as versioned migration. | Partially superseded by safer optional cleanup `20260219124617_remove_demo_coaches.sql`. | Critical risk if run in wrong environment. Replace with controlled runbook/script outside migration chain. |
| `99999999999999_fix_timeline_events_constraint.sql.skip` | delete | Diagnostic/manual script, not deterministic migration (contains notices and commented optional DDL). | No active migration depends on this file. | High operational ambiguity; should live in troubleshooting docs/scripts, not migrations. |

## Recommended Action Plan
1. Create new active migrations (new timestamps, do not rename old `.skip` files) for:
   - `race_crew_assignments` table + policies
   - venue knowledge platform tables (with security hardening pass)
   - `rule42_infractions` + views/policies
   - `race_signals` / `live_race_state` / `saved_regattas`
   - `coaching_clients` FK integrity (separate, guarded)
2. Keep historical/demo `.skip` files archived for traceability where marked `keep archived`.
3. Remove files marked `delete` from migration directory after documenting in release notes/changelog.

## Pre-Activation Checks (for `convert to active`)
- Validate existing object presence to avoid drift conflicts:
  - `to_regclass('public.<table>')`
  - existing policy names in `pg_policies`
  - trigger/function name collisions
- For FK activation (`coaching_clients`):
  - orphan scan on `coach_id` / `sailor_id` against `auth.users`
  - prefer `NOT VALID` FK add + `VALIDATE CONSTRAINT` after cleanup
- For RLS policies using legacy role names (`club_members` role checks):
  - reconcile with current role model (`owner/admin/manager/...`) before activation

## Risk Register
- Highest risk if not addressed: missing runtime tables behind existing service code (`race_crew_assignments`, venue knowledge tables, race signals, rule42).
- Highest risk if accidentally executed: destructive/demo migrations (`delete_demo_users`, mixed mock-data migrations).
- Drift risk: current active chain appears to include migrations that alter tables originally defined only in `.skip` files (notably venue knowledge objects), indicating historical application drift across environments.
