# Club & Sailor Experience Execution Backlog

This backlog translates the product playbook into actionable work. Epics align with the phased roadmap and each story includes high-level acceptance criteria (AC). Use this as the seed backlog for Jira/Linear or similar tooling.

---

## Epic A – Foundations & Governance
- **A1: Define Club Data Model**
  - AC: Entities for club, member, role, regatta, race, entry, payment defined in schema; migrations created; ERD circulated.
- **A2: Role-Based Access Control**
  - AC: Roles (admin, race officer, scorer, communications, sailor) mapped to permissions; enforcement middleware in place; end-to-end tests cover role gating.
- **A3: Design System Alignment**
  - AC: Shared admin + sailor component library documented; typography, color tokens, and layout patterns approved; Storybook entries created.

---

## Epic B – Club Admin MVP
- **B1: Season & Regatta Planner**
  - AC: Admin can create/edit/delete regattas with dates, fleets, scoring rules, capacity; calendar auto-updates.
- **B2: Document & Notice Management**
  - AC: Admin uploads NOR/SI; version history tracked; visibility (public/member/entrants) selectable; scheduled publish/expire supported.
- **B3: Entry Configuration**
  - AC: Pricing tiers, discount codes, waivers, entry caps configurable per regatta; preview flow validates logic.
- **B4: Payment Processing**
  - AC: Checkout handles card payments via selected gateway; receipts emailed; refund/credit note flow available; payout report exportable.
- **B5: Results Capture Workflow**
  - AC: Race officers record finishes; scoring engine calculates provisional/official results; export to CSV/PDF.

---

## Epic C – Sailor Experience
- **C1: Sailor Authentication & Onboarding**
  - AC: Sailors invited via email or microsite; account creation ties to club membership or open regatta entry; profile completion tracked.
- **C2: Sailor Dashboard**
  - AC: Dashboard shows upcoming races, tasks (waivers, payments), latest notices; widgets responsive on mobile.
- **C3: Entry & Payment Management**
  - AC: Sailors view entry status, pay outstanding balances, download receipts, manage crew slots.
- **C4: Race Day Center**
  - AC: Mobile view displays course assignment, start sequence, live PRO notices; offline cache for poor connectivity.
- **C5: Results & History**
  - AC: Sailors access regatta results, series standings, personal analytics; can download certificates.

---

## Epic D – Notifications & Communications
- **D1: Notification Service Layer**
  - AC: Unified service sends email/push/SMS; templates configurable; message logs/audit trail available.
- **D2: Notice Targeting**
  - AC: Admin selects audience segments; sailors manage channel preferences; unsubscribe compliance enforced.
- **D3: Automation Rules**
  - AC: System triggers reminders (registration deadlines, unpaid balances), race-day alerts, and result announcements.

---

## Epic E – White-Label Publishing
- **E1: Microsite Generator**
  - AC: Clubs create branded microsites with custom domain support; choose themes; preview before publish.
- **E2: Embeddable Widgets**
  - AC: Provide scripts/components for calendar, results, notices, entry list; embed tokens respect access rules.
- **E3: Public APIs & Webhooks**
  - AC: External developers access REST/GraphQL endpoints; webhooks deliver real-time updates; API keys scoped with rate limits.

---

## Epic F – Analytics & Monetization Enhancements
- **F1: Financial Dashboard**
  - AC: Admin view of payments volume, fees, refunds; export ledger for accounting.
- **F2: Participation Insights**
  - AC: Reports on entries per fleet, attendance trends, retention; filter by regatta/series.
- **F3: Sponsorship & Upsell**
  - AC: Clubs configure sponsorship placements on microsite/widgets; track impressions/clicks.

---

## Cross-Cutting Tasks
- **Security & Compliance Reviews** – Quarterly audit of payments, data privacy, and access controls.
- **Performance & Reliability** – Load testing for entry spikes, autoscaling guidance, incident response playbooks.
- **Feedback Loop** – Collect product feedback from pilot clubs and sailors; integrate into backlog refinement.

---

## Implementation Notes
- Sequence Epics A → B → C → E with Epic D running in parallel once foundations are stable.
- Maintain a living RACI chart so owners for admin workflows vs sailor surfaces are clear.
- Review and update this backlog at the end of each phase; retire completed stories and add discovery tickets as needed.

## Kickoff Checklist (Next 2 Sprints)
- Stand up shared club role constants in app + API layers and audit permissions enforcement.
- Draft database migration for unified `club_members` schema (roles, status, payment fields) and line up Supabase migration window.
- Prototype club admin dashboard shell (navigation, role-aware feature toggles, placeholder panels for events, entries, documents).
- Integrate payment gateway sandbox keys and map entry fee flows end to end (create -> pay -> receipt -> refund).
- Define microsite publishing MVP surface (public regatta page, results module, document feed) and capture required API responses.
