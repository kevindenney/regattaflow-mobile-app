# BetterAt Universal Model Mapping

> How RegattaFlow's sailing-specific data model maps to the universal BetterAt platform,
> with NurseFlow equivalents and identified gaps.

## Table of Contents

1. [Universal Model Overview](#1-universal-model-overview)
2. [Entity-by-Entity Mapping Table](#2-entity-by-entity-mapping-table)
3. [Detailed Findings per Dimension](#3-detailed-findings-per-dimension)
4. [Schema Reference Table](#4-schema-reference-table)
5. [Gaps and New Universal Entities](#5-gaps-and-new-universal-entities)
6. [Key Architectural Decisions](#6-key-architectural-decisions)

---

## 1. Universal Model Overview

BetterAt is a platform where people get better at their interests (sailing, nursing, drawing, fitness). The architecture uses a unified data model with these universal entities:

| Entity | Description | Purpose |
|--------|-------------|---------|
| **User** | A person on the platform | Identity, authentication, profile |
| **Interest** | A domain the user is learning (sailing, nursing, drawing) | Scopes all data; one user can have multiple interests |
| **LearningEvent** | A time-bounded activity with 3 phases (Plan/Do/Review) | The atomic unit of improvement — races, clinical shifts, drawing sessions |
| **Institution** | An organization that manages events and members (club, hospital, studio) | Provides structure, scoring, administration |
| **Coach** | A person who guides learners, independent of institutions | 1:many mentorship, marketplace, session-based |
| **Network** | Social graph and community layer | Follow graph, feeds, discussion forums |
| **Passport** | Career progression, competency tracking, achievements | The "resume" — milestones, skills, certifications |
| **Period** | Time-bounded container grouping LearningEvents with scoring | Seasons, semesters, rotations — aggregated standings |

---

## 2. Entity-by-Entity Mapping Table

### Core Entities

| Universal Entity | RegattaFlow Implementation | NurseFlow Equivalent |
|-----------------|---------------------------|---------------------|
| **User** | `auth.users` + `profiles` table | Same — student nurse account |
| **Interest** | Implicit (the whole app is "sailing") | Explicit — nursing, with specialties as sub-interests |
| **LearningEvent** | `race_events` (fleet/distance/match/team) + `practice_sessions` + club events (regatta/training/social/meeting) | Clinical shift, simulation lab, lecture, study session |
| **LearningEvent.Plan** | `days_before` phase / `practice_prepare` + `practice_launch` | Pre-shift preparation, patient research |
| **LearningEvent.Do** | `on_water` phase / `practice_train` | On-unit clinical time |
| **LearningEvent.Review** | `after_race` phase / `practice_reflect` | Post-shift reflection, debrief |
| **Institution** | `clubs` table (yacht_club/sailing_club/class_association/racing_organization) | Hospital, nursing school, clinical site |
| **Institution.Role** | `club_members.role` (admin/race_admin/volunteer_results/member/guest) | Faculty, charge nurse, preceptor, student, observer |
| **Coach** | `coach_profiles` + `coaching_sessions` (standalone marketplace) | Clinical instructor, preceptor, mentor |
| **Network** | `user_follows` + `follower_posts` + `communities` + `venue_discussions` | Student cohort feed, unit discussions, study groups |
| **Passport** | `sailor_stats` + `sailor_achievements` + excellence_metrics | Competency passport (skill tracking + clinical hours log) |
| **Period** | `seasons` table + `season_regattas` + `season_standings` | Semester, clinical rotation, cohort year |

### Sub-Entity Mappings

| Universal Sub-Entity | RegattaFlow | NurseFlow |
|---------------------|-------------|-----------|
| **LearningEvent.subtype** | `race_type`: fleet/distance/match/team; `practice_session`; club event: regatta/training/social/meeting | shift/simulation/lecture/lab/study_group |
| **LearningEvent.content_modules** | conditions, strategy, rig_setup, course, fleet_analysis, checklist, start_sequence, tide_currents, etc. | patient_assignment, medication_prep, vitals_protocol, handoff_report |
| **Period.scoring_rules** | `seasons.scoring_rules` (sum/average/best_n, championship_multiplier) | Clinical grading rubric, competency checklist completion rates |
| **Period.discard_rules** | `seasons.discard_rules` (worst_n/percentage) | Drop lowest quiz, clinical attendance policy |
| **Passport.Milestone** | `sailor_achievements` (first_race, first_win, race_milestone_10, series_champion, etc.) | First IV start, first code response, 100 clinical hours |
| **Passport.Skill** | Not implemented (biggest gap) | Competency states: not_started → learning → practicing → checkoff_ready → competent |
| **Coach.Session** | `coaching_sessions` with payment (hourly_rate, platform_fee, stripe_payment_intent_id) | Clinical instruction hours, preceptor shifts |
| **Network.Community** | `communities` (venue/boat_class/race/sailmaker/gear/rules/tactics/tuning) | Unit communities, specialty forums, cohort groups |
| **Network.Post** | `follower_posts` (general/race_recap/tip/gear_update/milestone) | shift_recap/study_tip/resource_share/milestone |

---

## 3. Detailed Findings per Dimension

### 3.1 Seasons (→ Period)

**Seasons are a proper database entity, not just a time filter.** They have their own table, scoring rules, standings, and analytics.

**Key files:**
- Schema: `supabase/migrations/20260107100444_add_seasons_tables.sql`
- Types: `types/season.ts`
- Components: `components/seasons/` (SeasonHeader, SeasonPickerModal, SeasonSlopeGraph, SeasonTableView, SeasonArchive)
- Hook: `hooks/useSeason.ts`

**Database tables:**
- `seasons` — name, year, year_end, start_date, end_date, status (draft/upcoming/active/completed/archived), scoring_rules (JSONB), discard_rules (JSONB)
- `season_regattas` — junction linking seasons to regattas with sequence, weight, is_championship
- `season_standings` — materialized standings: rank, total_points, net_points, races_sailed, races_counted, wins, podiums, best_finish, worst_finish, regatta_results[], race_results[], discards[]

**Ownership is dual:** A season has either `user_id` (personal season) or `club_id` (club season). DB functions `get_current_season(user_id)` and `get_season_summary(season_id, user_id)` compute aggregates on demand.

**Season analytics include:** User standing (rank, wins, podiums), results sparkline array, and aggregated weather conditions (avg wind speed, wind range, light/heavy days). `SeasonSlopeGraph` visualizes cross-regatta performance trends.

**Universal mapping:** Season is a **hybrid entity** — a time-bucket for the Passport (aggregated standings), an Institution feature when `club_id` is set (club-managed series), and a personal container when `user_id` is set (sailor's own grouping).

**NurseFlow equivalent:** Semester or rotation sequence. A nursing "season" would be "Med-Surg II, Spring 2025" — a time-bounded container of clinical shifts with aggregated competency metrics. The scoring_rules/discard_rules pattern maps to clinical grading rubrics.

---

### 3.2 Event Types (→ LearningEvent subtypes)

There are **two distinct event systems** plus an admin event layer:

#### A. Race Events (primary LearningEvent)
- Types: `types/raceEvents.ts` — `race_type?: 'fleet' | 'distance' | 'match' | 'team'`
- Single card type (`race_summary`) with content modules varying by race type
- Content modules: conditions, strategy, rig_setup, course, fleet_analysis, regulatory, checklist, start_sequence, tide_currents, competitor_notes, team_assignments, match_opponent, distance_waypoints, results_preview, learning_notes, share_with_team

#### B. Practice Sessions (parallel LearningEvent)
- Types: `types/practice.ts` — `PracticeSessionType = 'scheduled' | 'logged'`
- Distinct purple card vs blue/gray for races
- Drills organized by category: starting, upwind, downwind, mark_rounding, boat_handling, crew_work, rules, fitness, general
- 4Q Framework: WHAT (focus areas + drills), WHO (crew + task assignments), WHY (AI reasoning + linked races), HOW (custom instructions + success criteria)

#### C. Club Events (Institution-managed)
- `EventType = 'regatta' | 'race_series' | 'training' | 'social' | 'meeting' | 'maintenance'`
- Admin-created, not directly LearningEvents (social/meeting/maintenance are non-learning)

**Universal mapping:** All map to **LearningEvent subtypes**:
- Race → competitive LearningEvent
- Practice → deliberate practice LearningEvent
- Training → structured learning LearningEvent
- Social/Meeting → Institution events (outside LearningEvent scope)

---

### 3.3 Phases (→ Plan / Do / Review)

**Two separate phase systems exist, both time-based and automatic:**

#### Race Phases (3 phases)
- Defined in `components/cards/types.ts`
- `RacePhase = 'days_before' | 'on_water' | 'after_race'`
- Labels: Before / Racing / Review
- Transition logic (purely time-based, fully automatic):
  - `days_before`: now < raceStart - 2 hours
  - `on_water`: raceStart - 2h ≤ now < raceStart + 8h
  - `after_race`: now ≥ raceStart + 8 hours

Phase components:
- `DaysBeforeContent.tsx` — checklists, crew, weather, equipment, wizards (SafetyGear, Rigging, StartPlanner, TideStrategy)
- On-water: timer, tactical data (inline)
- `AfterRaceContent.tsx` — result logging, debrief interview, AI analysis, coaching suggestions

#### Practice Phases (4 phases)
- Defined in `types/practice.ts`
- `PracticePhase = 'practice_prepare' | 'practice_launch' | 'practice_train' | 'practice_reflect'`
- Transition logic (time + status hybrid):
  - `practice_prepare`: >24h before session
  - `practice_launch`: 0-24h before session
  - `practice_train`: 0-8h after start (or status === 'in_progress')
  - `practice_reflect`: >8h after start, or status completed/cancelled

**Universal mapping:** The universal Plan/Do/Review maps cleanly:
- `days_before` / `practice_prepare` + `practice_launch` → **Plan**
- `on_water` / `practice_train` → **Do**
- `after_race` / `practice_reflect` → **Review**

The 4-phase practice system is more granular than the 3-phase race system. **The universal model should use 3 phases (Plan/Do/Review) with optional sub-phases per interest.** The time-based auto-transition pattern is universally applicable.

---

### 3.4 Institution (→ Club)

**Key files:**
- Types: `types/club.ts`
- Services: `ClubMemberService.ts`, `ClubOnboardingService.ts`, `ClubEntryAdminService.ts`, `ClubDiscoveryService.ts`

**Club stores:** name, short_name, description, club_type (yacht_club/sailing_club/class_association/racing_organization/marina/community), location (country, region, city, lat/lng, timezone), contact (website, email, phone, social_links), branding (logo_url, banner_url, primary_color), established_year, member_count, official affiliations (world_sailing_member_id, us_sailing_id, rya_id), typical_classes[], facilities[], verification status.

**Club ↔ Race relationship:** Races optionally link to a club via `regattas.club_id`. **The sailor owns the race. Clubs are optional.** A sailor can create a race with no club. A club-managed regatta has `club_id` set.

This is critical for the universal model: **LearningEvents are user-owned, optionally linked to an Institution.**

**Roles** (simplified 5-tier):
- `admin` → full control (clubs.manage, regattas.manage, members.manage, finance.manage)
- `race_admin` → race operations (races.configure, documents.manage, entries.manage, results.certify)
- `volunteer_results` → capture provisional results only
- `member` → register for events, view documents
- `guest` → request entry

**Sailor-facing features:** Club directory, membership card, signature series, fleet spotlights, history timeline, upcoming regattas, bulletins.

**Admin-facing features:** Events management, entries & payments, documents, volunteers, results & scoring, publishing/microsites, member management.

---

### 3.5 Coach

**Key files:**
- Types: `types/coach.ts`
- Screens: `app/coach/` directory (20+ screens)
- AI: `CoachMatchingAgent` for compatibility scoring

**CoachProfile stores:** bio, photo, video, location, timezone, languages[], years_coaching, students_coached, certifications[], racing_achievements[], boat_classes[], specialties[], skill_levels[], hourly_rate (cents), package_rates, currency, status, is_verified, average_rating, total_reviews, total_sessions, response_time_hours.

**Coach-sailor relationship:** Many-to-many through `coaching_sessions`. A session stores: coach_id, student_id, scheduled times, actual times, status (pending/confirmed/in_progress/completed/cancelled/no_show), session_notes, coach_notes, student_goals, shared_data (JSONB), payment details (total_amount, platform_fee, coach_payout, stripe_payment_intent_id).

**Coaching is independent of clubs.** Coaches exist in a standalone marketplace with a 5% platform fee model. AI matching scores compatibility 0-100% based on skill gaps from race performance.

**User capability model:** `types/capabilities.ts` defines an additive system where sailors can add capabilities (like coaching) to their account via `user_capabilities` table.

---

### 3.6 Network / Connect

**Key schema:**
- `user_follows` — follower_id, following_id (one-way Twitter-style follow)
- `follower_posts` — content, image_urls[], linked_race_id, post_type (general/race_recap/tip/gear_update/milestone), like_count, comment_count
- `communities` — community_type (venue/boat_class/race/sailmaker/gear/rules/tactics/tuning/general), polymorphic linked_entity_type + linked_entity_id
- `venue_discussions` — posts with post_type (tip/question/report/discussion/safety_alert), threaded comments, upvotes/downvotes, condition tags, resolved/accepted_answer status

**Connect tab** (`app/(tabs)/connect.tsx`): Two segments — Follow (activity feed from followed sailors) and Discuss (community browser with Reddit-style feeds).

**Universal mapping:** The follow graph and follower_posts are universal. Communities are interest-specific (sailing community types like "boat_class" or "tactics" need parameterization per interest). The condition-tagging system is sailing-specific.

---

### 3.7 Passport / Reflect

**Key files:**
- Screen: `app/(tabs)/reflect.tsx` (3 segments: Progress, Race Log, Profile)
- Components: `components/dashboard/sailor/` (SailorOverview, AnalyticsTab)
- Hooks: `hooks/useReflectData.ts`, `hooks/useReflectProfile.ts`

**Data sources are mixed — computed + stored:**

Computed at query time:
- Sailing days per month (from `regattas` dates)
- Monthly stats, weekly trends, relative effort scores
- Streak calculations
- Time on water (from `race_timer_sessions`)

Stored in dedicated tables:
- `sailor_stats` — career totals (wins, podiums, averages)
- `sailor_achievements` — earned badges with timestamps and linked regattas
- `sailor_boats` — boat inventory
- `sailor_profiles` — display name, avatar, bio
- `sailor_media` — photo gallery

**Achievement types:** first_race, first_win, first_podium, race_milestone_10/50/100, win_streak_3/5, series_champion, regatta_champion, year_end_champion, perfect_season, comeback_victory, most_improved.

**These are milestone badges only — no skill-based competency tracking, no progressive certification, no formal passport framework.** This is the biggest gap between RegattaFlow and the universal Passport model.

**NurseFlow's Competency Passport** (from `NURSEFLOW_STUDENT_CONCEPT.md`) describes skill status states: not_started → learning → practicing → checkoff_ready → competent. RegattaFlow has nothing equivalent.

---

### 3.8 Edge Cases — Things That Don't Fit

#### Clearly interest-specific (no universal home):

| Feature | Key Files | Why It's Domain-Specific |
|---------|-----------|------------------------|
| Weather/tide/current intelligence | `services/weather/*`, `services/tides/*` | Environmental data specific to outdoor water sports |
| Map/GPS/bathymetry | `components/map/*` | Course visualization, 3D seafloor, tactical zones |
| Boat management | `SailorBoatService.ts`, `types/entries.ts` | Equipment with complex tuning/rigging domain |
| Document hierarchy (NOR/SSI) | `DocumentExtractionService.ts`, `types/ssi.ts` | Sailing rules inheritance (club SSI → race NOR) |
| Tactical analysis frameworks | `types/raceAnalysis.ts` | Sailing-specific playbooks: Puff Response, Delayed Tack, Wind Shift Mathematics |

#### Could be universal with abstraction:

| Feature | Key Files | How to Generalize |
|---------|-----------|-------------------|
| AI coaching feedback | `services/ai/*` | Universal coaching engine with domain-specific prompt libraries per interest |
| Practice 4Q framework | `types/practice.ts` | Activity-agnostic deliberate practice structure (WHAT/WHO/WHY/HOW) |
| Academy/courses | `components/learn/*` | Module → Lesson → Interactive → Quiz pattern works for any interest |
| Real-time collaboration | `types/raceCollaboration.ts` | Event-scoped collaboration (crew/team/study group) |
| Subscriptions | `lib/subscriptions/*` | Billing infrastructure, currently sailing-only tiers |
| Post-event structured reflection | `AfterRaceContent.tsx` | Debrief interview + AI analysis pattern is universal |
| Adaptive learning / nudges | `types/adaptiveLearning.ts` | LearnableEvent extraction + nudge delivery is interest-agnostic |
| Excellence framework | `types/excellenceFramework.ts` | Phase mastery scores + framework adoption tracking |

---

## 4. Schema Reference Table

Every significant RegattaFlow table mapped to its universal entity:

### User Layer

| RegattaFlow Table | Universal Entity | Notes |
|-------------------|-----------------|-------|
| `auth.users` | User | Supabase auth |
| `profiles` | User.profile | Display name, avatar, bio |
| `user_capabilities` | User.capabilities | Additive capability model (e.g., coaching) |
| `sailor_profiles` | User.interest_profile | Interest-specific profile extensions |

### LearningEvent Layer

| RegattaFlow Table | Universal Entity | Notes |
|-------------------|-----------------|-------|
| `regattas` | LearningEvent (container) | Multi-race event container |
| `race_events` | LearningEvent | Individual race with phases |
| `race_entries` | LearningEvent.registration | User registration for an event |
| `race_results` | LearningEvent.outcome | Finishing position, points |
| `race_timer_sessions` | LearningEvent.timing | Start/stop timing data |
| `race_courses` | LearningEvent.context | Course configuration |
| `course_marks` | LearningEvent.context.detail | Mark positions and types |
| `environmental_forecasts` | LearningEvent.conditions | Weather/tide at event time |
| `race_checklist_items` | LearningEvent.Plan | Phase-specific checklist items |
| `race_analyses` | LearningEvent.Review | Post-event structured analysis |
| `ai_coach_analysis` | LearningEvent.Review.ai | AI-generated coaching feedback |
| `race_shares` | LearningEvent.sharing | Shared race data with coaches/crew |
| `practice_sessions` | LearningEvent (practice subtype) | Deliberate practice event |
| `practice_session_members` | LearningEvent.participants | Crew/coach/observer for practice |
| `practice_session_drills` | LearningEvent.activities | Drills performed in practice |
| `practice_session_focus_areas` | LearningEvent.goals | Skill areas targeted |
| `practice_skill_progress` | Passport.skill_progress | Aggregated practice metrics per skill |
| `drills` | Interest.activity_library | Reusable drill catalog |
| `drill_skill_mappings` | Interest.skill_activity_map | Links drills to skill areas |
| `practice_templates` | Interest.template_library | Pre-built practice plans |
| `club_events` | Institution.event | Club-managed events (non-learning types too) |

### Institution Layer

| RegattaFlow Table | Universal Entity | Notes |
|-------------------|-----------------|-------|
| `clubs` | Institution | Sailing clubs with type, location, branding |
| `club_members` | Institution.membership | Role-based membership |
| `club_onboarding_state` | Institution.onboarding | Setup wizard progress |
| `fleets` | Institution.group | Sub-groups within a club |
| `fleet_members` | Institution.group.membership | Fleet membership |
| `fleet_followers` | Institution.group.followers | Following a fleet's activity |
| `race_documents` / `nor_documents` | Institution.documents | Official documents (NOR, SSI, amendments) |
| `race_suggestions` | Institution.ai_suggestions | AI-suggested races for club members |

### Coach Layer

| RegattaFlow Table | Universal Entity | Notes |
|-------------------|-----------------|-------|
| `coach_profiles` | Coach | Marketplace profile with rates, credentials |
| `coach_services` | Coach.service_catalog | Available service types and pricing |
| `coach_availability` | Coach.availability | Weekly availability schedule |
| `coaching_sessions` | Coach.session | Booked session with payment |
| `session_reviews` | Coach.review | Post-session ratings and feedback |
| `coach_race_annotations` | Coach.annotation | Inline feedback on sailor's race data |

### Network Layer

| RegattaFlow Table | Universal Entity | Notes |
|-------------------|-----------------|-------|
| `user_follows` | Network.follow | One-way follow graph |
| `follower_posts` | Network.post | Activity feed content |
| `communities` | Network.community | Interest-scoped discussion groups |
| `community_memberships` | Network.community.membership | Community membership with role |
| `community_flairs` | Network.community.flair | Post categorization tags |
| `venue_discussions` | Network.community.post | Discussion posts with threading |
| `discussion_comments` | Network.community.comment | Threaded replies |
| `discussion_votes` | Network.community.vote | Upvote/downvote system |
| `crew_availability` | Network.availability | Crew finding and scheduling |

### Passport Layer

| RegattaFlow Table | Universal Entity | Notes |
|-------------------|-----------------|-------|
| `sailor_stats` | Passport.career_stats | Aggregated career totals |
| `sailor_achievements` | Passport.milestones | Earned badges with timestamps |
| `excellence_metrics` | Passport.mastery_scores | Phase mastery + framework adoption scores |
| `sailor_boats` | Passport.equipment | Boat inventory (interest-specific) |
| `sailor_media` | Passport.media | Photo/video gallery |
| `sail_inspections` | Passport.equipment.inspection | Equipment condition tracking |
| `equipment_issues` | Passport.equipment.issues | Maintenance log |

### Period Layer

| RegattaFlow Table | Universal Entity | Notes |
|-------------------|-----------------|-------|
| `seasons` | Period | Time container with scoring rules |
| `season_regattas` | Period.events | Junction linking periods to events |
| `season_standings` | Period.standings | Materialized rankings within period |

### Adaptive Learning Layer

| RegattaFlow Table | Universal Entity | Notes |
|-------------------|-----------------|-------|
| `learnable_events` | Passport.learning_insights | AI-extracted insights from feedback |
| `nudge_deliveries` | Passport.nudge_history | Tracking of personalized reminders |
| `learning_modules` | Interest.curriculum | Course modules |
| `learning_lessons` | Interest.curriculum.lesson | Individual lessons |
| `learning_interactives` | Interest.curriculum.interactive | Interactive exercises |
| `learning_progress` | Passport.curriculum_progress | User progress through courses |

---

## 5. Gaps and New Universal Entities

The RegattaFlow analysis exposes several concepts that don't have a clean home in the initial universal model:

### 5.1 Equipment (NEW: `User → Interest → Equipment`)

**Problem:** Boats, tuning guides, rig settings, sail inspections have no universal home.

**RegattaFlow tables:** `sailor_boats`, `sail_inspections`, `equipment_issues`, rig/tuning data in race_events

**NurseFlow equivalent:** Stethoscope, badge reel, clinical site access credentials, uniform requirements.

**Fitness equivalent:** Running shoes, GPS watch, gym membership.

**Recommendation:** Add `Equipment` as a universal entity under `User → Interest → Equipment` with:
- `equipment_items` — inventory with type, status, metadata
- `equipment_inspections` — condition checks with due dates
- `equipment_issues` — maintenance/repair log

### 5.2 Conditions / Context (NEW: `LearningEvent → Conditions`)

**Problem:** Weather, venue conditions, tidal data are the "world state" around a LearningEvent. The universal model needs a way to capture environmental context.

**RegattaFlow tables:** `environmental_forecasts`, wind/tide/wave data, venue intelligence

**NurseFlow equivalent:** Patient acuity, unit census, staffing ratio, code status.

**Drawing equivalent:** Medium, lighting conditions, reference material.

**Recommendation:** Add `Conditions` as a universal sub-entity of LearningEvent:
- `LearningEvent.conditions` — JSONB with interest-specific schema
- Interest modules define their own condition types
- Enables condition-aware nudges and analytics across interests

### 5.3 Rules / Regulatory (NEW: `Institution → RuleSet`)

**Problem:** Sailing Instructions, Notice of Race, racing rules form a document hierarchy. Any competitive or professional interest has rules.

**RegattaFlow tables:** `race_documents`, `nor_documents`, SSI extraction system

**NurseFlow equivalent:** Clinical protocols, hospital policies, scope of practice, state board requirements.

**Recommendation:** Add `RuleSet` under Institution:
- `Institution → RuleSet → Document` hierarchy
- Supports extraction/parsing for AI consumption
- Rules scope to events (which rules apply to this LearningEvent?)

### 5.4 Skill Progression (GAP in RegattaFlow, exists in NurseFlow concept)

**Problem:** RegattaFlow has milestone badges but no progressive skill tracking. NurseFlow's Competency Passport concept defines skill states: not_started → learning → practicing → checkoff_ready → competent.

**RegattaFlow has partially:** `practice_skill_progress` (sessions_count, average_rating, trend per skill area), `excellence_metrics` (phase mastery scores 0-100). But these are numeric scores, not formal competency states.

**Recommendation:** The universal Passport needs both:
- `Passport.Milestone` — event-triggered badges (what RegattaFlow has today)
- `Passport.Skill` — progressive competency tracking with states (what NurseFlow needs)
- Skills link to LearningEvents that evidence progression
- Interest modules define their own skill taxonomies

### 5.5 Community Topic Types (parameterization needed)

**Problem:** RegattaFlow's community types (venue, boat_class, sailmaker, gear, tactics, tuning) are sailing-specific. The universal Network needs parameterized community categories.

**Recommendation:** `Network.Community.type` should be interest-defined:
- Sailing: venue, boat_class, sailmaker, gear, tactics, tuning
- Nursing: unit, specialty, hospital, study_topic, nclex_prep
- Each interest module registers its community type taxonomy

---

## 6. Key Architectural Decisions

### 6.1 LearningEvents are user-owned, optionally linked to Institutions

RegattaFlow proves this pattern works. Sailors create races independently; clubs are optional. This is critical — learners shouldn't need an institution to track improvement.

```
LearningEvent.user_id  → required (owner)
LearningEvent.institution_id → optional (club/hospital association)
```

### 6.2 Three universal phases with optional interest-specific sub-phases

RegattaFlow uses 3 race phases and 4 practice phases, but both collapse to Plan/Do/Review. The universal model should define 3 phases as the standard, with interests able to add granularity.

```
Universal:  Plan → Do → Review
Sailing:    days_before → on_water → after_race
            practice_prepare + practice_launch → practice_train → practice_reflect
Nursing:    pre_shift → on_unit → post_shift
```

Phase transitions should be **time-based and automatic** by default (RegattaFlow's pattern), with optional status-based overrides.

### 6.3 Period is a hybrid entity (User or Institution scope)

Seasons in RegattaFlow have dual ownership — `user_id` OR `club_id`. The universal Period entity should follow this pattern:
- User-owned periods: personal groupings ("My 2025 Season")
- Institution-owned periods: managed series with scoring ("Club Winter Series 2024-25")
- Both compute standings and aggregate analytics

### 6.4 Coach is independent of Institution

RegattaFlow's coach marketplace is completely separate from clubs. Coaches have their own profiles, services, availability, and payment processing. This separation should be universal — coaching relationships exist outside institutional boundaries.

### 6.5 Passport has two dimensions: Milestones + Skills

RegattaFlow implements milestones (achievement badges). NurseFlow needs skills (competency states). The universal Passport should support both:
- **Milestones**: event-triggered, binary (earned or not), linked to specific LearningEvents
- **Skills**: progressive, multi-state, evidenced by multiple LearningEvents over time

### 6.6 Content modules are interest-specific, loaded dynamically

RegattaFlow's race cards load different content modules per phase and race type (conditions, strategy, course, fleet_analysis, etc.). The universal model should define a content module registry:
- Each interest registers its module types
- LearningEvent cards compose from available modules
- Phase determines which modules are active

### 6.7 AI services are universal engines with interest-specific prompts

RegattaFlow's AI coaching, race analysis, practice suggestions, and adaptive nudges all follow the same pattern: universal infrastructure + sailing-specific prompt context. The universal model should provide:
- AI coaching engine (universal)
- AI analysis framework (universal)
- Prompt libraries (per interest)
- Extraction pipelines (per interest, for documents/conditions)

### 6.8 Adaptive learning (nudges) is universally applicable

The `learnable_events` → `nudge_deliveries` pattern extracts insights from post-event feedback and resurfaces them before future events with matching conditions. This is fully interest-agnostic and should be a core universal feature:
1. Extract insights from Review phase feedback
2. Match insights to upcoming events by conditions
3. Deliver nudges during Plan phase
4. Track acknowledgment and effectiveness

---

## Appendix: Source File Index

Key RegattaFlow files referenced in this document:

| File | Contains |
|------|----------|
| `types/season.ts` | Season, SeasonSummary, SeasonStanding, scoring/discard rules |
| `types/raceEvents.ts` | RaceEvent, CourseMark, EnvironmentalForecast, StrategyAnalysis |
| `types/practice.ts` | PracticeSession, Drill, 4Q Framework types, phase logic |
| `types/coach.ts` | CoachProfile, CoachingSession, SessionReview, AI matching |
| `types/club.ts` | ClubRole definitions, permissions, role normalization |
| `types/community.ts` | Community, CommunityMembership, discussion types |
| `types/entries.ts` | ClubEntryRow, payment/status types |
| `types/ssi.ts` | SSI extraction types, document processing |
| `types/raceAnalysis.ts` | RaceAnalysis, CoachingFeedback, framework scores |
| `types/excellenceFramework.ts` | RacePhase, ChecklistCategory, ExcellenceMetrics, PhaseMastery |
| `types/adaptiveLearning.ts` | LearnableEvent, NudgeDelivery, PersonalizedNudge |
| `types/raceLearning.ts` | LearningProfile, PerformancePattern, AILearningSummary |
| `types/capabilities.ts` | UserCapability, additive capability model |
| `hooks/useSeason.ts` | Season data fetching and computation |
| `hooks/useReflectData.ts` | Passport/Reflect data aggregation |
| `services/ClubMemberService.ts` | Institution membership operations |
| `app/(tabs)/connect.tsx` | Network tab (Follow + Discuss) |
| `app/(tabs)/reflect.tsx` | Passport tab (Progress, Race Log, Profile) |
| `app/club-dashboard.tsx` | Institution admin dashboard |
| `components/cards/content/phases/` | Phase-specific UI components |
| `components/practice/phases/` | Practice phase UI components |
