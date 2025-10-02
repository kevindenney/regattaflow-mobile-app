# Sailor Fleet Experience Plan

## Objective
Deliver a dedicated fleet experience for sailors that connects class-based communities (e.g., Dragon Fleet – Hong Kong), streamlines sharing of race intel and documents, and layers in lightweight social features while respecting existing WhatsApp communication habits.

## Success Criteria
- Sailors can view and switch between fleets tied to their registered classes.
- Dedicated Fleet tab with clear sub-navigation (Overview, Members, Resources, Activity).
- Fleet activity (uploads, posts, events) is surfaced in dashboard summaries and via notifications.
- Followers see updates when individuals they follow add new fleet resources.
- Fleet WhatsApp entry points exist so members can jump into existing chat groups.

## Personas & Scenarios
- **Active sailor (Bram):** Competes in Dragon fleet, wants to share tuning guides and see what other owners upload.
- **Fleet captain:** Curates events, pins essential resources, manages membership and WhatsApp links.
- **Club admin:** Oversees multiple fleets, needs insights into engagement and content.

## UX Architecture
- **Sailor Dashboard Enhancements**
  - Insert "Your Fleet" card under boat context, showing fleet name, next event, quick actions (Open Fleet, Upload Resource, Message Fleet).
  - Activity preview (latest 3 items) with link to full Fleet tab.
- **New Fleet Tab** (within sailor tab router)
  1. **Overview** – hero banner, KPI pills (members, followers, upcoming events, new resources), pinned announcements, WhatsApp quick action.
  2. **Members** – filterable directory (Owners, Crew, Coaches), follow buttons, role badges, invite CTA.
  3. **Resources** – list/grid of documents, tuning guides, strategy notes, with share + notify toggles.
  4. **Activity** – chronological feed (uploads, posts, events, follow actions), comment/applause.
  5. **Settings** (visible to admins) – fleet profile, WhatsApp link, membership management.
- **WhatsApp Touchpoints**
  - Fleet overview quick action: `Open WhatsApp` (deep link) + `Copy group link` fallback.
  - Member cards show optional WhatsApp contact icon when user opts in.
  - Upload/announcement confirmation includes "Share to WhatsApp".

## Data & Domain Model
- `fleets` (id, name, class_id, club_id, region, whatsApp_link, description, created_by, visibility, created_at, updated_at)
- `fleet_members` (fleet_id, user_id, role, status, is_admin, joined_at)
- `fleet_followers` (fleet_id, follower_id, notify_on_documents, notify_on_announcements)
- `fleet_activity` (id, fleet_id, actor_id, type, payload JSONB, visibility, created_at)
- `fleet_documents` (id, fleet_id, document_id, tagged_by, notify_followers)
- `fleet_events` (optional future iteration; reuse existing events schema with fleet_id reference)

### Supabase Tasks (Phase 1)
1. Create migrations for fleets, members, followers, activity, documents tables.
2. Add RLS policies ensuring only fleet members can view private fleets; allow public read for open fleets.
3. Extend existing document uploads to emit `fleet_documents` entries and `fleet_activity` log.
4. Seed example data (Dragon Fleet – Hong Kong, etc.) for testing.

## Backend Services
- `FleetService`
  - `getFleetsForSailor(userId)` – returns fleets + membership roles.
  - `getFleetOverview(fleetId)` – metrics, upcoming events, WhatsApp link.
  - `followFleet(userId, fleetId)` / `unfollowFleet`.
  - `logFleetActivity(event)` – normalizes uploads/posts into feed entries.
  - `notifyFollowers(activityId)` – publishes in-app notifications + optional push/email.
- `FleetActivityPublisher`
  - Hooks into document uploads, strategy posts, event updates.
- `FleetNotificationService`
  - Formats messages, respects user notification preferences.

## Frontend Components
- `src/components/dashboard/fleet/FleetOverviewCard.tsx`
- `FleetQuickActions.tsx`
- `FleetActivityFeed.tsx`
- `FleetMemberList.tsx`
- `FleetResourcesGrid.tsx`
- `FleetSettingsPanel.tsx`
- Shared `FollowButton`, `WhatsAppLinkButton` components.

## Integration Points
- Update `useSailorDashboardData` to fetch fleet summary + activity slice.
- Extend document upload flow to associate fleet context and show notify toggles.
- Notification center: add filters for `fleet` events.
- Analytics: log fleet engagement metrics (views, uploads, follows).

## Implementation Roadmap
1. **Foundations**
   - Database migrations & Supabase types update.
   - Backend services scaffolding (`src/services/fleetService.ts`).
   - Hooks: `useFleetOverview`, `useFleetActivity`.
2. **UI Skeleton**
   - Add Fleet tab route + layout.
   - Implement overview section & quick actions; wire to data hook with mock data.
   - Create members/resources/activity components with placeholders.
3. **Data Wiring**
   - Connect hooks to Supabase queries.
   - Populate dashboard fleet summary and quick actions.
   - Integrate document upload + activity feed.
4. **Follow & Notifications**
   - Add follow/unfollow UI and service endpoints.
   - Write notification triggers and in-app alerts.
5. **WhatsApp Enhancements**
   - Fleet overview quick action using `Linking.openURL(fleet.whatsAppLink)`.
   - Share-to-WhatsApp action in upload success dialogs (`Linking.openURL('https://wa.me/?text=...')`).
   - Optional member-level WhatsApp link (requires user opt-in field `users.whatsappNumber`).
6. **Polish & QA**
   - Accessibility review, responsive tweaks, skeleton/loading states.
   - Unit tests for hooks/services; integration tests for fleet workflows.
   - Documentation updates (README, onboarding guides).

## Risks & Mitigations
- **Permission complexity:** ensure RLS policies thoroughly tested.
- **Notification fatigue:** default to digest mode, allow granular toggles per follower.
- **WhatsApp link validity:** validate URLs before saving; provide fallback instructions.
- **Performance:** paginate activity feed; use edge functions or Supabase realtime sparingly.

## Open Questions
- Should fleets support subchannels (e.g., practice vs racing)?
- Do we need moderation tools (reporting content)?
- How to handle multi-club sailors sharing across fleets?
- Do we integrate live chat beyond WhatsApp links in Phase 1?

## Dependencies
- Supabase roles & existing document storage pipeline.
- Notification center infrastructure.
- `Linking` permissions for external apps on native platforms.

## Next Actions
1. Draft database migration scripts and update Supabase types.
2. Scaffold FleetService with stubbed methods + tests.
3. Build Fleet tab route and overview card (using mock data).
4. Confirm WhatsApp link handling requirements with product/ops.

## Venue Intelligence Alignment
- Extend venue intelligence seeding to include fleets per venue (e.g., yacht clubs → supported classes → fleets).
- When a sailor selects a home venue, pre-populate available fleets from this dataset so they can join quickly.
- Ensure 147+ global venue records include associated fleets where known (Dragon, Flying Fifteen, Etchells, etc.).
- Expose venue → fleet relationships via `supabaseVenueService` so fleet suggestions appear in onboarding and fleet selection flows.
