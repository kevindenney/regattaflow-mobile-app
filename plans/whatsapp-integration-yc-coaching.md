# WhatsApp Integration Plan for Yacht Club & Coaching Flows

## Objective
Embed WhatsApp touchpoints across yacht club and coaching user experiences so teams can keep their established communication channels while RegattaFlow handles structured data, scheduling, and insights.

## Success Criteria
- Yacht club staff can attach WhatsApp group links to fleets, events, and operational teams (race committee, volunteers).
- Coaches can add personal/business WhatsApp contact links to availability listings, session summaries, and client profiles.
- Key workflows expose "Share via WhatsApp" actions without breaking in-app audit trails.
- All WhatsApp launches respect platform constraints (deep links on iOS/Android/web) and fall back gracefully.

## Integration Targets
### Yacht Club Personas
- **Club Administrator:** Manages fleets, logistics, volunteer crews.
- **Race Officer / PRO:** Sends race-day updates to fleets or committee.
- **Volunteer Coordinator:** Notifies volunteers of shifts and documents.

### Coaching Personas
- **Head Coach:** Publishes availability, groups students, shares tuning notes.
- **Assistant Coach / Specialist:** Communicates session updates and safety notices.
- **Sailor Client:** Receives session summaries, resource links, reminders.

## High-Level UX Strategy
- Introduce `WhatsAppLinkButton` component with consistent iconography and labeling (“Open WhatsApp Group”, “Message Coach”).
- Compose share sheets that summarize the relevant entity (event, session, document) before launching WhatsApp to ensure users understand what is being shared.
- Provide admin settings pages where staff/coaches can register and verify WhatsApp links/numbers.
- Display privacy warnings when personal numbers are shared; require explicit opt-in per user.

## Touchpoint Matrix
| Workflow | WhatsApp Action | UI Placement |
| --- | --- | --- |
| Fleet management (club) | Open fleet WhatsApp group; copy link | Fleet settings, member directory, event details |
| Event dashboard | Share NOR/updates via WhatsApp | Event detail header quick actions |
| Volunteer assignments | Send shift reminders | Volunteer roster list item actions |
| Incident reporting | Quick message to safety group | Safety panel CTA |
| Coach availability | Message coach | Coach card, schedule modal |
| Session summary | Share summary snippet | Post-session modal, history list |
| Resource uploads | Share resource link | Upload success toast + action sheet |
| Client onboarding | Send welcome message | Client profile action bar |

## Data & Settings Requirements
- Add `whatsapp_link` fields:
  - `fleets`, `club_departments`, `events`, `volunteer_teams`.
- Add `whatsapp_number` and `allow_whatsapp_contact` to `profiles` (coaches, admins, sailors).
- Create settings UI for managing these fields:
  - Yacht Club Portal > Communication Settings (per fleet/team).
  - Coach Profile > Contact Preferences.

## Technical Implementation
### Shared Utility
- `utils/whatsapp.ts`
  - `buildWhatsAppLink({ phone, text, type })`
  - Validate numbers (E.164) and encode text for URL.
- `components/shared/WhatsAppLinkButton.tsx`
  - Props: `href`, `label`, `variant`, `iconPlacement`.
  - Handles disabled state when link missing.

### Backend / Supabase
1. **Schema updates**
   - Extend relevant tables with nullable `whatsapp_link`/`whatsapp_number` columns.
   - RLS updates to allow owners/admins to write these values.
2. **Validation**
   - Edge function or service-level validation to ensure sanitized inputs.
3. **Audit logging**
   - Log when WhatsApp links are added/edited for compliance.

### Frontend Entry Points
- **Yacht Club**
  - `ClubOverview` – Add communication card with WhatsApp quick links.
  - `FleetManagementScreen` – Settings form fields, status badges (Verified/Unverified).
  - `EventDetailScreen` – Quick actions row: `Open WhatsApp`, `Share Update`.
  - `VolunteerRoster` – Row actions; optional bulk notify.
- **Coaching**
  - `CoachOverview` (dashboard) – Personal contact row with “Message on WhatsApp”.
  - `CoachSchedule` – Session cards include WhatsApp icons for quick pings.
  - `ClientProfile` – Coaches can tap to message clients (respecting opt-in).
  - `Paywall / Marketing` – Add WhatsApp CTA for prospective clients (if enabled).

## Notifications & Share Flow
- On key events (document upload, event update, session summary), show a confirmation modal with:
  - In-app share options (RegattaFlow notifications, email).
  - `Share via WhatsApp` button -> uses utility to prefill text (title, link, TL;DR).
- Optionally store a record when share triggered (e.g., `shared_to_whatsapp` flag) for analytics.

## Privacy & Compliance Considerations
- Display disclaimer: WhatsApp communications leave the RegattaFlow platform.
- Allow users to revoke WhatsApp contact permission; hide icons immediately when revoked.
- For shared fleet links, recommend private group settings within WhatsApp to avoid spam.
- Document handling: do not auto-upload files to WhatsApp; sharing uses hyperlink summaries instead.

## Rollout Phases
1. **Phase 1 – Passive Links**
   - Surface existing fleet/coach WhatsApp links where available.
   - Add settings fields and UI in admin/coach portals.
   - Implement share buttons without analytics.
2. **Phase 2 – Share Enhancements**
   - Rich share copy templates (events, sessions). 
   - Share-to-WhatsApp actions in upload/summary flows.
   - Basic analytics (count shares per entity).
3. **Phase 3 – Automation & Integrations**
   - Optional: Webhooks or integration with WhatsApp Business API for automated reminders (requires compliance review).
   - Template management for repeated updates.
   - Notification rules (auto-suggest WhatsApp share when certain triggers fire).

## Implementation Checklist
- [ ] Draft Supabase migration for new WhatsApp fields.
- [ ] Update TypeScript types + Supabase client typings.
- [ ] Build `WhatsAppLinkButton` shared component.
- [ ] Integrate into fleet settings and overview (reuse from sailor fleet plan).
- [ ] Add yacht club communication settings section.
- [ ] Decorate event detail, volunteer, and coach views with WhatsApp quick actions.
- [ ] Extend upload/session completion flows with share modals.
- [ ] Write unit tests for utility + components.
- [ ] Update documentation and onboarding guides.

## Open Questions
- Should we require verification (e.g., sending test link) before exposing WhatsApp contacts publicly?
- Do we need distinct links per role (crew vs committee) or allow multiple links per entity?
- Any jurisdictions where WhatsApp use triggers additional compliance requirements?
- How do we surface analytics to admins (share counts, click-through)?

## Next Steps
1. Align with product/ops on verification + privacy messaging.
2. Implement shared WhatsApp utilities and UI components.
3. Roll changes into fleet plan to maintain consistent experience across sailor, club, and coaching personas.
