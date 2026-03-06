# BetterAt V1 Wireframes (Markdown)

Date: 2026-03-06

## Global UX Contract (applies to all screens)
- Timeline is the default home for every interest.
- Learner controls Steps (what and when).
- Solo-first: nursing loop works fully without coach/admin.
- Nursing artifacts auto-save as drafts; progress only updates on `Get feedback`.
- Clinical Reasoning feedback uses Claude (Anthropic) in V1 only.
- Cross-interest transfer is subtle and automatic; no extra tasks/screens.
- Domain differences come from vocabulary/modules/microcopy/templates, not different home IA.

---

## 1) Timeline (Nursing Selected)
- **Persona:** Learner
- **Route:** `app/(tabs)/races.tsx`
- **Primary JTBD:** See and manage learner-created nursing Steps in one place.
- **Key objects:** Step, Evidence summary, Competency progress chip, Transfer spark (rare)
- **Primary actions:** `+` create Step, open Step, switch interest, reorder, mark planned/done
- **States:**
  - Loading: skeleton timeline cards
  - Empty: first-step prompt (`Create your first clinical Step`)
  - Error: inline retry banner
  - Offline: cached timeline + sync badge
  - Permission denied: if auth missing, route to login
- **Markdown wireframe:**

```text
┌──────────────────────────────────────────────────────────────┐
│ [Interest: Nursing ▼]                    [Search] [Profile] │
│ Timeline                                                      │
│ Calm helper: “Build your week one Step at a time.”          │
├──────────────────────────────────────────────────────────────┤
│ [ + New ]                                                    │
├──────────────────────────────────────────────────────────────┤
│ STEP CARD: Med-Surg Shift Prep                              │
│ When: Tue 07:00 • Unit: Med-Surg                            │
│ Chips: [Advanced 2] [Feedback pending] [Planned]            │
│ Focus: Clinical Reasoning • Therapeutic Communication       │
│ (rare) Transfer spark: “Your race debrief habits transfer.” │
│ CTA: [Open Step]                                             │
├──────────────────────────────────────────────────────────────┤
│ STEP CARD: Skills Lab IV Practice                            │
│ Chips: [Planned]                                              │
│ CTA: [Open Step]                                              │
└──────────────────────────────────────────────────────────────┘
```

- **Microcopy notes:** short, steady, non-judgmental. Avoid “incomplete/failed”.
- **Counts toward progress?** No, timeline viewing/reordering does not count.
- **Telemetry events:** `timeline_viewed`, `interest_switched`, `step_opened`, `step_create_tapped`

---

## 2) Create New Modal (from +)
- **Persona:** Learner
- **Route:** Existing flow trigger in `app/(tabs)/races.tsx` (`+` button)
- **Primary JTBD:** Quickly create a learner-owned Step.
- **Key objects:** Step draft metadata (title, date/time, setting, optional template)
- **Primary actions:** `Create Step`, `Cancel`, optional `Use template`
- **States:** loading templates, empty templates, offline create (local queued), validation errors
- **Markdown wireframe:**

```text
┌──────────── Create New Step ────────────┐
│ Title *                                 │
│ [______________________________]        │
│ Date/Time                               │
│ [ Tue Mar 10, 07:00 ]                   │
│ Type                                    │
│ (•) Clinical Shift  ( ) Skills Lab      │
│ Optional template                        │
│ [ None ▼ ]                               │
│                                          │
│ [Cancel]                  [Create Step]  │
└──────────────────────────────────────────┘
```

- **Microcopy notes:** “You can change details later.”
- **Counts toward progress?** No.
- **Telemetry events:** `step_create_modal_opened`, `step_created`, `step_create_failed`

---

## 3) Step Card (Nursing) with “Advanced X”
- **Persona:** Learner
- **Route:** card inside `app/(tabs)/races.tsx` + `components/cards/TimelineGridView.tsx`
- **Primary JTBD:** Understand quick status + competency movement for that Step.
- **Key objects:** Step, advanced count, focus chips, status chips
- **Primary actions:** tap card, long-press actions, overdue quick action
- **States:** no advancement, advancement present, pending feedback, overdue
- **Markdown wireframe:**

```text
┌──────────────────────────────────────┐
│ Med-Surg Shift — Unit 4A             │
│ Tue 07:00                            │
│ [Advanced 3] [Feedback pending]      │
│ Focus: Prioritization • SBAR Handoff │
│ [Open Step]                          │
└──────────────────────────────────────┘
```

- **Microcopy notes:** chip language: “Advanced X”, “Feedback pending”.
- **Counts toward progress?** `Advanced X` reflects counted submissions only.
- **Telemetry events:** `step_card_rendered`, `advanced_chip_viewed`

---

## 4) Module Drawer (Nursing)
- **Persona:** Learner
- **Route:** `components/races/ModuleDetailBottomSheet.tsx`
- **Primary JTBD:** Draft evidence, map competencies, submit intentionally.
- **Key objects:** Artifact draft, module tool values, candidate competencies, feedback actions, optional review
- **Primary actions:** edit tool content, select competencies, `Get feedback`, `Request coach review`
- **States:**
  - Saving: `Saving…`
  - Saved: `Saved`
  - Offline: `Saved locally • will sync`
  - Error: `Couldn’t save draft`
  - No coach: review action disabled/hidden
- **Markdown wireframe:**

```text
┌──────────── Clinical Reasoning ────────────┐
│ Draft status: Saving… / Saved              │
├─────────────────────────────────────────────┤
│ [Tool inputs: cues, options, decision, why]│
│                                             │
│ Maps to (module-scoped)                     │
│ [x] Clinical Reasoning Foundations          │
│ [x] Prioritization Frameworks               │
│ [ ] SBAR Handoff Clarity                    │
│                                             │
│ Actions                                     │
│ [Get feedback]   [Request coach review]     │
│ note: Drafts don’t count until Get feedback │
├─────────────────────────────────────────────┤
│ AI Coach card (existing)                    │
│ Network tips (existing)                     │
└─────────────────────────────────────────────┘
```

- **Microcopy notes:** “Drafts don’t count until Get feedback.” “You’re in control of when this counts.”
- **Counts toward progress?**
  - Draft typing/selecting: No
  - `Get feedback`: Yes (creates counted submission)
  - `Request coach review` only: No additional count by itself
- **Telemetry events:** `artifact_draft_saved`, `maps_to_selected`, `get_feedback_tapped`, `coach_review_requested`

- **Transfer spark placement rule:**
  - Allowed: one line below chips in drawer header (rare)
  - Not allowed: inside every module input block, not in repeated toasts

---

## 5) Reflect (Job-Ready Outcome + Interview Pack)
- **Persona:** Learner
- **Route:** `app/(tabs)/reflect.tsx`
- **Primary JTBD:** Turn evidence history into job-ready outputs.
- **Key objects:** Evidence rollup, competency trend summaries, Interview Pack output list
- **Primary actions:** `Generate Interview Pack`, open/download pack item
- **States:** loading analytics, no evidence yet, generation in progress, generation failed, offline read-only
- **Markdown wireframe:**

```text
┌──────────────────────── Reflect ────────────────────────┐
│ Outcome focus: Job-ready evidence from your own Steps   │
├──────────────────────────────────────────────────────────┤
│ Interview Pack                                           │
│ [Generate Interview Pack]                                │
│                                                          │
│ Outputs                                                  │
│ - STAR Story: Escalation and handoff                     │
│ - Competency Snapshot PDF                                │
│ - Evidence Timeline (last 8 weeks)                       │
└──────────────────────────────────────────────────────────┘
```

- **Microcopy notes:** emphasize ownership and readiness, not compliance.
- **Counts toward progress?** No (this is summarization of existing counted submissions).
- **Telemetry events:** `reflect_viewed`, `interview_pack_generate_tapped`, `interview_pack_generated`

---

## 6) Connect to Organization Flow (Join JHU later)
- **Persona:** Learner
- **Route:** `app/settings/organization-access.tsx` (existing), optional entry from `app/(tabs)/connect.tsx`
- **Primary JTBD:** Join org without losing learner-owned history.
- **Key objects:** org invite/token, role preset, ownership statement
- **Primary actions:** enter token, accept/decline, set visibility defaults
- **States:** token invalid, invite expired, membership pending, network error
- **Markdown wireframe:**

```text
┌──────────── Connect Organization ────────────┐
│ Join a club or institution later (optional). │
│ Your existing Steps and evidence stay yours. │
│                                               │
│ Invite token                                  │
│ [________________________] [Find]             │
│                                               │
│ Invite found: Johns Hopkins School of Nursing │
│ Role: Student / Learner                       │
│ [Decline]                      [Accept Invite]│
└───────────────────────────────────────────────┘
```

- **Microcopy notes:** “Optional”, “Your history stays yours.”
- **Counts toward progress?** No.
- **Telemetry events:** `org_connect_opened`, `org_invite_lookup`, `org_invite_accepted`

---

## 7) Timeline (Sailing Selected)
- **Persona:** Learner
- **Route:** `app/(tabs)/races.tsx`
- **Primary JTBD:** Same home, sailing vocabulary/modules.
- **Key objects:** Step (race session), tactical modules, learning chips
- **Primary actions:** same as nursing timeline
- **States:** same as nursing timeline
- **Markdown wireframe:**

```text
┌──────────────────────────────────────────────┐
│ [Interest: Sailing ▼]                        │
│ Race Session: Harbor Series R3               │
│ Chips: [Advanced 1] [Planned]                │
│ Focus: Starts • Tactics                       │
│ CTA: [Open Session]                           │
└──────────────────────────────────────────────┘
```

- **Microcopy notes:** sailing terms (`Session`, `Debrief`, `Starts`).
- **Counts toward progress?** Same rule: counted on feedback submission points.
- **Telemetry events:** `timeline_interest_sailing_viewed`

---

## 8) Timeline (Drawing Selected)
- **Persona:** Learner
- **Route:** `app/(tabs)/races.tsx`
- **Primary JTBD:** Same home, drawing vocabulary/modules.
- **Key objects:** practice step, portfolio modules, reflection chips
- **Markdown wireframe:**

```text
┌──────────────────────────────────────────────┐
│ [Interest: Drawing ▼]                        │
│ Study Step: Figure Session 12                │
│ Chips: [Advanced 2] [Planned]                │
│ Focus: Value Structure • Composition          │
│ CTA: [Open Step]                              │
└──────────────────────────────────────────────┘
```

- **Microcopy notes:** `Study`, `Portfolio`, `Technique`.
- **Counts toward progress?** Same submit-to-count behavior.
- **Telemetry events:** `timeline_interest_drawing_viewed`

---

## 9) Timeline (Fitness Selected)
- **Persona:** Learner
- **Route:** `app/(tabs)/races.tsx`
- **Primary JTBD:** Same home, fitness vocabulary/modules.
- **Key objects:** training step, session notes, growth chips
- **Markdown wireframe:**

```text
┌──────────────────────────────────────────────┐
│ [Interest: Fitness ▼]                        │
│ Training Step: Strength Block A              │
│ Chips: [Advanced 1] [Planned]                │
│ Focus: Technique Control • Self-Assessment    │
│ CTA: [Open Step]                              │
└──────────────────────────────────────────────┘
```

- **Microcopy notes:** `Training`, `Recovery`, `Session`.
- **Counts toward progress?** Same submit-to-count behavior.
- **Telemetry events:** `timeline_interest_fitness_viewed`

---

## 10) Coach Review Queue
- **Persona:** Coach
- **Route:** new route proposed: `app/coach/artifact-queue.tsx`
- **Primary JTBD:** Pull pending learner requests and triage quickly.
- **Key objects:** Review request, Artifact summary, learner, module, due age
- **Primary actions:** open review, filter by module/status, approve/adjust from list (optional)
- **States:** loading queue, empty queue, error retry, offline cached queue
- **Markdown wireframe:**

```text
┌──────────────────── Coach Review Queue ───────────────────┐
│ Filters: [Pending ▼] [Module ▼] [Org ▼]                   │
├────────────────────────────────────────────────────────────┤
│ Learner: A. Patel • Module: Clinical Reasoning            │
│ Requested: 3h ago • Maps to: Prioritization, SBAR         │
│ [Open Review]                                              │
├────────────────────────────────────────────────────────────┤
│ Learner: J. Rivera • Module: Learning Notes               │
│ Requested: 1d ago                                          │
│ [Open Review]                                              │
└────────────────────────────────────────────────────────────┘
```

- **Microcopy notes:** actionable and supportive; no punitive language.
- **Counts toward progress?** Queue view itself: No.
- **Telemetry events:** `coach_queue_viewed`, `coach_queue_item_opened`

---

## 11) Artifact Review (Clinical Reasoning)
- **Persona:** Coach
- **Route:** new route proposed: `app/coach/artifact-review/[artifactId].tsx`
- **Primary JTBD:** Review learner artifact with AI rubric context and provide decision.
- **Key objects:** Artifact content, AI rubric output, mapped competencies, coach decision
- **Primary actions:** `Approve`, `Adjust`, add note, assign next action
- **States:** evaluator missing, evaluator failed, review conflict (newer artifact version), offline decision queued
- **Markdown wireframe:**

```text
┌──────────── Artifact Review: Clinical Reasoning ───────────┐
│ Learner: A. Patel • Step: Med-Surg Shift Prep             │
│ Version: v2 (latest)                                       │
├─────────────────────────────────────────────────────────────┤
│ Learner artifact                                            │
│ - Cues observed                                             │
│ - Differential options considered                           │
│ - Decision + rationale                                      │
├─────────────────────────────────────────────────────────────┤
│ Claude rubric (V1 clinical reasoning only)                  │
│ Overall: Proficient                                         │
│ Strength: cue prioritization                                │
│ Improve: escalation framing                                 │
├─────────────────────────────────────────────────────────────┤
│ Coach note                                                   │
│ [______________________________________________]            │
│ Next action: [SBAR handoff rehearsal ▼]                     │
│ [Adjust]                                 [Approve]          │
└─────────────────────────────────────────────────────────────┘
```

- **Microcopy notes:** direct, growth-oriented (“Next action”).
- **Counts toward progress?**
  - Learner already counted at `Get feedback` submit.
  - Coach decision updates validation/review state, not initial count event.
- **Telemetry events:** `artifact_review_viewed`, `artifact_review_approved`, `artifact_review_adjusted`

---

## 12) Learner Summary (Coach Minimal)
- **Persona:** Coach
- **Route:** new route proposed: `app/coach/learner/[userId].tsx`
- **Primary JTBD:** Quick context before/after review decisions.
- **Key objects:** recent Steps, recent artifacts, evidence highlights, current focus areas
- **Primary actions:** open artifact, send note, request resubmission
- **States:** empty history, private learner (permission denied), offline cached
- **Markdown wireframe:**

```text
┌──────────────── Learner Summary ────────────────┐
│ Learner: A. Patel                                │
│ Focus now: Prioritization • Communication        │
├──────────────────────────────────────────────────┤
│ Recent Steps                                     │
│ - Med-Surg Shift Prep [Advanced 2]              │
│ - Skills Lab: IV Push [Advanced 1]              │
├──────────────────────────────────────────────────┤
│ Evidence highlights                              │
│ - Strong cue clustering in acute scenarios       │
│ - Needs cleaner escalation language              │
└──────────────────────────────────────────────────┘
```

- **Microcopy notes:** concise summary, avoid heavy dashboard framing.
- **Counts toward progress?** No.
- **Telemetry events:** `coach_learner_summary_viewed`

---

## 13) Org Home / Program Setup (JHU)
- **Persona:** Org-Admin
- **Route:** existing likely entry `app/organization/home.tsx`
- **Primary JTBD:** Manage catalog versions and publish program defaults.
- **Key objects:** catalog version, active template packs, publish state
- **Primary actions:** set active catalog, publish template pack, view last sync
- **States:** loading, no templates, publish failed, permission denied
- **Markdown wireframe:**

```text
┌──────────── JHU Program Home ────────────┐
│ Active catalog: Nursing Core v1          │
│ Candidate sets: module-scoped (enabled)  │
│                                           │
│ Template packs                            │
│ - Clinical Shift Core (Published)         │
│ - Sim Lab Intensive (Draft)               │
│                                           │
│ [Publish changes] [View Cohort]           │
└───────────────────────────────────────────┘
```

- **Microcopy notes:** “recommended defaults”, not rigid mandates.
- **Counts toward progress?** No.
- **Telemetry events:** `org_home_viewed`, `org_catalog_published`

---

## 14) Templates (Recommended Steps/Modules/Targets)
- **Persona:** Org-Admin
- **Route:** new route proposed: `app/organization/templates.tsx`
- **Primary JTBD:** Define recommended Step/module target sets learners can adopt.
- **Key objects:** template, module set, competency targets, optional accelerators
- **Primary actions:** create/edit template, publish/unpublish, preview learner view
- **States:** no templates, validation errors, duplicate name, save conflict
- **Markdown wireframe:**

```text
┌──────────────── Templates ────────────────┐
│ [New Template]                            │
├───────────────────────────────────────────┤
│ Clinical Shift Core                        │
│ Modules: Gibbs, Clinical Reasoning, Notes  │
│ Targets: 6 competencies                    │
│ Status: Published                          │
│ [Edit] [Unpublish]                         │
├───────────────────────────────────────────┤
│ Optional accelerators (toggle)             │
│ [ ] Add interview-pack reminder             │
└───────────────────────────────────────────┘
```

- **Microcopy notes:** “recommended”, “optional accelerators”.
- **Counts toward progress?** No (templates guide, not direct progress events).
- **Telemetry events:** `org_template_viewed`, `org_template_saved`, `org_template_published`

---

## 15) Cohort View (Light Health)
- **Persona:** Org-Admin
- **Route:** new route proposed: `app/organization/cohort.tsx`
- **Primary JTBD:** Identify drift risk and domain coverage gaps quickly.
- **Key objects:** learner rows, drift flag, coverage by domain/module
- **Primary actions:** filter cohort, open learner summary, export filtered list
- **States:** loading, empty cohort, partial data, permission denied
- **Markdown wireframe:**

```text
┌──────────────── Cohort View ────────────────┐
│ Filters: [Cohort 2026 ▼] [Risk ▼] [Module ▼]│
├──────────────────────────────────────────────┤
│ A. Patel    Coverage: 72%   Risk: Low        │
│ J. Rivera   Coverage: 41%   Risk: Drift       │
│ M. Chen     Coverage: 63%   Risk: Medium      │
│                                              │
│ Domain coverage                               │
│ - Clinical Reasoning: 68%                     │
│ - Reflection Depth: 54%                       │
│ [Open Learner] [Export]                       │
└──────────────────────────────────────────────┘
```

- **Microcopy notes:** neutral risk labels, no shaming language.
- **Counts toward progress?** No.
- **Telemetry events:** `org_cohort_viewed`, `org_cohort_filter_changed`

---

## 16) Export (Accreditation-friendly Minimal)
- **Persona:** Org-Admin
- **Route:** new route proposed: `app/organization/export.tsx`
- **Primary JTBD:** Produce compact per-learner evidence exports.
- **Key objects:** export scope, columns, file history
- **Primary actions:** select scope, generate CSV, download
- **States:** generating, empty result, failed generation, permission denied
- **Markdown wireframe:**

```text
┌──────────────── Export ────────────────┐
│ Scope                                  │
│ [ Cohort 2026 ▼ ] [ Date range ▼ ]     │
│ Include                                │
│ [x] Learner summary                    │
│ [x] Artifact counts                    │
│ [x] Competency advancements            │
│ [ ] Full artifact text                 │
│                                        │
│ [Generate CSV]                         │
│ Recent exports                         │
│ - cohort_2026_2026-03-06.csv [Download]│
└────────────────────────────────────────┘
```

- **Microcopy notes:** plain-language data scope warnings.
- **Counts toward progress?** No.
- **Telemetry events:** `org_export_generate_tapped`, `org_export_downloaded`

---

## Cross-Interest Transfer Spark Placement Rules (V1)

Show (rare):
- Learner Timeline Step card subtitle area (single line).
- Learner module drawer header area above action row.

Do NOT show:
- Modal popups.
- Repeated in every module section.
- Coach queue/review screens.
- Org cohort/export screens.

Frequency guard:
- Max 1 visible spark per Step card render context.
- Cooldown before resurfacing similar spark.

---

## Existing vs Proposed Route Map Summary

Existing routes used:
- `app/(tabs)/races.tsx`
- `components/races/ModuleDetailBottomSheet.tsx`
- `app/(tabs)/reflect.tsx`
- `app/settings/organization-access.tsx`
- `app/organization/home.tsx`

New routes proposed:
- `app/coach/artifact-queue.tsx`
- `app/coach/artifact-review/[artifactId].tsx`
- `app/coach/learner/[userId].tsx`
- `app/organization/templates.tsx`
- `app/organization/cohort.tsx`
- `app/organization/export.tsx`
