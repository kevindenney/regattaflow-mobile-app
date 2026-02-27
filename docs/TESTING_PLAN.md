# BetterAt Platform — Testing Plan

Covers all work across Parts A–D and Expo steps E1–E11.

---

## Table of Contents

1. [Prerequisites & Test Accounts](#1-prerequisites--test-accounts)
2. [Part A: Next.js Marketing Frontend](#2-part-a-nextjs-marketing-frontend)
3. [Part B: Expo Multi-Interest Refactor](#3-part-b-expo-multi-interest-refactor)
4. [Part C: Multi-Interest Event Cards](#4-part-c-multi-interest-event-cards)
5. [Part D: Plan Card, Activity Catalog & Cross-Interest AI](#5-part-d-plan-card-activity-catalog--cross-interest-ai)
6. [Nursing Interactive Lesson Components](#6-nursing-interactive-lesson-components)
7. [Database & Migration Verification](#7-database--migration-verification)
8. [Cross-Cutting Concerns](#8-cross-cutting-concerns)

---

## 1. Prerequisites & Test Accounts

### Environment Setup

| Item | Command / Location |
|------|--------------------|
| Next.js dev server | `cd betterat-sail-racing && npm run dev` → `http://localhost:3000` |
| Expo dev server | `cd regattaflow-app && npx expo start` → Expo Go or simulator |
| Supabase dashboard | `https://supabase.com/dashboard/project/qavekrwdbsobecwrfxwu` |
| Type-check (Next.js) | `npm run build` in betterat-sail-racing |
| Type-check (Expo) | `npx tsc --noEmit` in regattaflow-app |

### Interest UUIDs (remote DB)

| Interest | UUID | Accent Color |
|----------|------|-------------|
| Sail Racing | `5e6b64c3-ea92-42a1-baf5-9342c53eb7d9` | `#003DA5` |
| Nursing | `bec249c5-6412-4d16-bb84-bfcfb887ff67` | `#0097A7` |
| Drawing | `b31dbc01-7892-4f63-9697-84b05546f595` | `#E64A19` |
| Fitness | `f138e519-7ac9-4497-a0ee-fba242482bce` | `#2E7D32` |

### Test Scenarios Notation

- **[PASS]** = Expected pass condition
- **[VERIFY]** = Manual visual verification needed
- **[DATA]** = Verify data in Supabase dashboard

---

## 2. Part A: Next.js Marketing Frontend

### 2.1 Design System & Theme

| # | Test | Steps | Expected |
|---|------|-------|----------|
| A1 | Warm light background | Load `localhost:3000` | [VERIFY] Background is `#FAF8F5` (warm cream), not dark navy |
| A2 | Text color | Inspect body text | [VERIFY] Primary text is `#1A1A1A`, secondary is `#6B6B6B` |
| A3 | Font rendering | Check headlines vs body | [VERIFY] Headlines use Playfair Display bold, body uses DM Sans |
| A4 | No dark theme remnants | Search page source for old dark colors | [PASS] No `#0A1628`, `#1B2B4B`, or dark navy references |

### 2.2 Navigation

| # | Test | Steps | Expected |
|---|------|-------|----------|
| A5 | Wordmark renders | Load homepage | [VERIFY] "BetterAt" wordmark in Playfair Display, left-aligned |
| A6 | Scroll behavior | Scroll down 200px | [VERIFY] Nav gets backdrop blur + hairline border |
| A7 | Interest dropdown | Click interest dropdown in nav | [VERIFY] Shows 4 interests with accent color dots |
| A8 | Interest link navigation | Click "Nursing" in dropdown | [PASS] Routes to `/nursing` |
| A9 | Auth state — logged out | Visit while logged out | [VERIFY] Shows "Sign In" / "Sign Up" buttons |
| A10 | Auth state — logged in | Visit while logged in | [VERIFY] Shows profile avatar linking to `/dashboard` |

### 2.3 Homepage Sections

| # | Test | Steps | Expected |
|---|------|-------|----------|
| A11 | Hero section | Load homepage | [VERIFY] "Get *better at* what matters to you" headline + 2x2 interest cards |
| A12 | Interest cards | Check all 4 cards | [VERIFY] Each shows name, tagline, accent color, links to `/[interest]` |
| A13 | Three Phases | Scroll to Plan/Do/Review section | [VERIFY] Three columns with per-interest bullets |
| A14 | Vocabulary Table | Scroll to vocabulary section | [VERIFY] "Same structure. Different words." with tabbed interest grid |
| A15 | Vocab tab switching | Click each interest tab | [PASS] Table content changes to show interest-specific terms |
| A16 | Community Cascade | Scroll to cascade | [VERIFY] "Valuable alone. Better together." four-step progression |
| A17 | Interest Pills CTA | Scroll to CTA section | [VERIFY] "Which interest are you improving?" with tappable pills |
| A18 | Footer | Scroll to bottom | [VERIFY] Footer renders with links |

### 2.4 Interest Sub-Pages

| # | Test | Steps | Expected |
|---|------|-------|----------|
| A19 | Sail Racing page | Visit `/sail-racing` | [VERIFY] Sailing hero, audience tabs, phone mockups with race prep UI |
| A20 | Nursing page | Visit `/nursing` | [VERIFY] Nursing hero, tagline, clinical shift mockups, competency courses |
| A21 | Drawing page | Visit `/drawing` | [VERIFY] Drawing hero, session mockups, technique courses |
| A22 | Fitness page | Visit `/fitness` | [VERIFY] Fitness hero, workout mockups, training programs |
| A23 | Audience tabs | Click each audience tab on any interest page | [PASS] Tab content changes, value props update |
| A24 | Phone mockups | Check mockup screens | [VERIFY] 3 angled phone frames with interest-specific screen content |
| A25 | Dynamic metadata | View page source / head tags | [PASS] Title and description reflect the specific interest |
| A26 | Invalid interest | Visit `/invalid-slug` | [PASS] Returns 404 or redirect, not a crash |
| A27 | Data from Supabase | Check network tab on interest page | [DATA] Queries hit Supabase for audiences, content, vocabulary |

### 2.5 Auth Pages

| # | Test | Steps | Expected |
|---|------|-------|----------|
| A28 | Login page | Visit `/login` | [VERIFY] Warm light theme, BetterAt branding, Supabase auth form |
| A29 | Signup page | Visit `/signup` | [VERIFY] Generic copy (not sailing-specific) |
| A30 | Login → dashboard | Sign in with valid credentials | [PASS] Redirects to `/dashboard` |
| A31 | Dashboard | Visit `/dashboard` while logged in | [VERIFY] Warm light theme, generic welcome, interest-agnostic |

### 2.6 Build & Deploy

| # | Test | Steps | Expected |
|---|------|-------|----------|
| A32 | Build passes | `npm run build` | [PASS] Zero TypeScript errors, zero build errors |
| A33 | No dead imports | Check build output | [PASS] No "module not found" warnings |

---

## 3. Part B: Expo Multi-Interest Refactor

### 3.1 Interest Provider & Selection (E2, E11)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| B1 | First launch — no interest | Clear AsyncStorage, open app as new user | [VERIFY] InterestSelection modal appears automatically |
| B2 | Interest grid | View modal | [VERIFY] Shows 4 interests (Sail Racing, Nursing, Drawing, Fitness) with accent colors and taglines |
| B3 | Select interest | Tap "Nursing" → tap "Continue" | [PASS] Modal closes, app loads with nursing context |
| B4 | Persistence — AsyncStorage | Force-close app, reopen | [PASS] Nursing still selected (no modal reappears) |
| B5 | Persistence — DB | Check `user_preferences` table | [DATA] `preferred_interest_id` = nursing UUID |
| B6 | Guest mode | Use app as guest, select interest | [PASS] Interest persists via AsyncStorage only (no DB write) |

### 3.2 Interest Switcher (E4)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| B7 | Switcher visible | Open app with interest selected | [VERIFY] Interest indicator visible in header/drawer |
| B8 | Switch interest | Tap switcher → select "Drawing" | [PASS] All content reloads for drawing context |
| B9 | Tab labels update | After switching to Nursing | [VERIFY] "Race" tab → "Shift", "Reflect" label unchanged |
| B10 | Switch to Fitness | Tap switcher → select "Fitness" | [VERIFY] "Race" tab → "Workout" |
| B11 | Switch to Drawing | Tap switcher → select "Drawing" | [VERIFY] "Race" tab → "Session" |
| B12 | Switch back to Sailing | Tap switcher → select "Sail Racing" | [VERIFY] "Race" tab → "Race" (original labels restored) |
| B13 | React Query invalidation | Switch interest, check network | [DATA] New queries fire with updated `interest_id` filter |

### 3.3 Vocabulary Layer (E3, E5)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| B14 | Tab labels — Sailing | Select Sail Racing | [VERIFY] Tabs: Race, Connect, Learn, Reflect, Search |
| B15 | Tab labels — Nursing | Select Nursing | [VERIFY] Tabs: Shift, Connect, Learn, Reflect, Search |
| B16 | Tab labels — Drawing | Select Drawing | [VERIFY] Tabs: Session, Connect, Learn, Reflect, Search |
| B17 | Tab labels — Fitness | Select Fitness | [VERIFY] Tabs: Workout, Connect, Learn, Reflect, Search |
| B18 | Vocabulary fallback | Disconnect internet, switch interest | [PASS] Falls back to sail-racing vocabulary, no crash |

### 3.4 Course Catalog from DB (E7, E8, E10)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| B19 | Nursing courses | Select Nursing → Learn tab | [VERIFY] 5 courses visible: Foundations of Patient Assessment, Medication Administration, Clinical Procedures, Patient Care Management, Clinical Reasoning & Emergency Response |
| B20 | Nursing lesson count | Tap any nursing course | [VERIFY] Correct number of lessons (7, 5, 5, 5, 4 = 24 total) |
| B21 | Drawing courses | Select Drawing → Learn tab | [VERIFY] 3 courses: Foundations of Drawing, Light Shadow & Form, Figure Drawing Essentials |
| B22 | Drawing lesson count | Tap any drawing course | [VERIFY] 4 lessons per course (12 total) |
| B23 | Fitness courses | Select Fitness → Learn tab | [VERIFY] 3 courses: Training Science Fundamentals, Strength Training Fundamentals, Recovery & Performance |
| B24 | Fitness lesson count | Tap any fitness course | [VERIFY] 4 lessons per course (12 total) |
| B25 | Sailing courses | Select Sail Racing → Learn tab | [VERIFY] Sailing courses appear (migrated from static JSON) |
| B26 | Course scoping | Switch interests, check Learn tab | [PASS] Only courses for the active interest appear, no cross-contamination |

### 3.5 Database Tables (E1)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| B27 | betterat_courses table | Query in Supabase | [DATA] Contains courses for all 4 interests |
| B28 | betterat_lessons table | Query in Supabase | [DATA] Each lesson has valid `lesson_data` JSONB with `steps` array |
| B29 | betterat_lesson_progress table | Complete a lesson, check table | [DATA] Row created with `user_id`, `lesson_id`, `status`, `completed_at` |
| B30 | preferred_interest_id column | Check user_preferences table | [DATA] Column exists, nullable, references `interests(id)` |

---

## 4. Part C: Multi-Interest Event Cards

### 4.1 Phase Labels (C1, C3)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| C1 | Sailing phase tabs | View a sailing race card | [VERIFY] Tabs: Before / Racing / Review |
| C2 | Nursing phase tabs | Switch to Nursing, view a shift card | [VERIFY] Tabs: Prep / Clinical / Review |
| C3 | Drawing phase tabs | Switch to Drawing, view a session card | [VERIFY] Tabs: Plan / Draw / Critique |
| C4 | Fitness phase tabs | Switch to Fitness, view a workout card | [VERIFY] Tabs: Prep / Train / Review |

### 4.2 Content Modules (C4-C7)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| C5 | Nursing Prep modules | Open nursing shift Prep tab | [VERIFY] Default tiles: Patient Overview, Medications, Procedures, Clinical Objectives, Shift Checklist |
| C6 | Nursing Clinical modules | Open Clinical tab | [VERIFY] Default tiles: Patient Status, Active Objectives |
| C7 | Nursing Review modules | Open Review tab | [VERIFY] Default tiles: Competency Log, Learning Notes |
| C8 | Drawing Plan modules | Open drawing session Plan tab | [VERIFY] Default tiles: References, Composition, Technique Focus, Materials, Session Checklist |
| C9 | Drawing Critique modules | Open Critique tab | [VERIFY] Default tiles: Progress Photos, Session Notes |
| C10 | Fitness Prep modules | Open fitness workout Prep tab | [VERIFY] Default tiles: Workout Plan, Warmup, Nutrition, Session Goals, Gear Checklist |
| C11 | Fitness Review modules | Open Review tab | [VERIFY] Default tiles: Session Results, Session Notes |
| C12 | Module customization | Tap "Edit Modules" on any phase | [PASS] Can add/remove optional modules, persists |

### 4.3 InterestEventConfig (C1, C2)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| C13 | Config loads per interest | Call `useInterestEventConfig()` in each interest | [PASS] Returns correct config with phase labels, subtypes, modules |
| C14 | Event subtypes — Nursing | Check nursing config | [PASS] Subtypes: clinical_shift, skills_lab, simulation, competency_checkoff, nclex_practice |
| C15 | Event subtypes — Drawing | Check drawing config | [PASS] Subtypes: drawing_session, study_sketch, technique_drill, master_copy, critique_session, portfolio_piece |
| C16 | Event subtypes — Fitness | Check fitness config | [PASS] Subtypes: strength, cardio, hiit, sport, fitness_test, competition |
| C17 | Fallback to sailing | No interest selected | [PASS] Defaults to sail-racing config |

### 4.4 Structured Debrief (C8)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| C18 | Sailing debrief phases | Complete a race → debrief | [VERIFY] 8 phases: prep, prestart, start, upwind, marks, downwind, rules, finish |
| C19 | Nursing debrief phases | Complete a shift → debrief | [VERIFY] 7 phases: Preparation, Assessment, Interventions, Communication, Time Management, Safety, Overall Reflection |
| C20 | Drawing debrief phases | Complete a session → debrief | [VERIFY] 6 phases: Setup, Composition, Technique Execution, Observation & Accuracy, Process, Overall Assessment |
| C21 | Fitness debrief phases | Complete a workout → debrief | [VERIFY] 6 phases: Preparation, Warmup, Main Session, Intensity, Recovery, Overall |

### 4.5 AI Analysis (C9)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| C22 | Nursing AI sections | Complete debrief → view AI analysis | [VERIFY] Sections: overall_summary, clinical_reasoning, patient_safety, communication, time_management, technical_skills, documentation, recommendations, plan_vs_execution |
| C23 | Drawing AI sections | Complete debrief → view AI analysis | [VERIFY] Sections include composition_analysis, proportion_accuracy, value_structure, line_quality |
| C24 | Fitness AI sections | Complete debrief → view AI analysis | [VERIFY] Sections include volume_analysis, intensity_analysis, form_analysis, progressive_overload |

### 4.6 Add Event Flow (C11)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| C25 | Add button label — Sailing | Select Sail Racing, tap add | [VERIFY] Button says "Add Race" |
| C26 | Add button label — Nursing | Select Nursing, tap add | [VERIFY] Button says "Add Shift" |
| C27 | Add button label — Drawing | Select Drawing, tap add | [VERIFY] Button says "Add Session" |
| C28 | Add button label — Fitness | Select Fitness, tap add | [VERIFY] Button says "Add Workout" |
| C29 | Nursing subtypes | Tap "Add Shift" | [VERIFY] Options: Clinical Shift, Skills Lab, Simulation, Competency Checkoff, NCLEX Practice |
| C30 | Drawing subtypes | Tap "Add Session" | [VERIFY] Options: Drawing Session, Study Sketch, Technique Drill, Master Copy, Critique Session, Portfolio Piece |
| C31 | Fitness subtypes | Tap "Add Workout" | [VERIFY] Options: Workout (strength/cardio/HIIT/sport/mobility/mixed), Practice Set, Fitness Test, Competition |

---

## 5. Part D: Plan Card, Activity Catalog & Cross-Interest AI

### 5.1 Blank Plan Card (D1-D4)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| D1 | Plan card option | Tap "Add Event" in any interest | [VERIFY] "Plan" card option appears alongside typed events |
| D2 | What tab | Create Plan card → What tab | [VERIFY] Shows title, description, date/time, location, notes fields |
| D3 | Who tab | Switch to Who tab | [VERIFY] Can tag connections, add external names, assign roles |
| D4 | Why tab | Switch to Why tab | [VERIFY] Learning objectives, competency links, personal motivation |
| D5 | How tab | Switch to How tab | [VERIFY] Step-by-step plan, materials, timeline fields |
| D6 | Media Capture — Nursing | Create nursing plan card → Capture | [VERIFY] Voice memo and text only, NO photo/video (HIPAA) |
| D7 | Media Capture — Drawing | Create drawing plan card → Capture | [VERIFY] Photo capture prominent (progress shots, time-lapse) |
| D8 | Media Capture — Fitness | Create fitness plan card → Capture | [VERIFY] Watch sync, photo, video, voice memo available |
| D9 | Plan Review | Complete capture → Review tab | [VERIFY] Media gallery + "What happened? / What learned? / What's next?" |

### 5.2 Activity Catalog (D5-D9)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| D10 | Catalog in Add Event | Tap "Add Race" (or equivalent) | [VERIFY] "From your organizations and coaches" section appears above "Create from scratch" |
| D11 | Templates grouped | View catalog section | [VERIFY] Templates grouped by publisher (org logo + name) |
| D12 | Template filtering | Switch interest, open Add Event | [PASS] Only templates for current interest shown |
| D13 | Template preview | Tap a template | [VERIFY] TemplatePreview modal with title, description, date, location, enrollment count |
| D14 | Enroll in template | Tap "Add to my timeline" | [PASS] Creates pre-filled event card, enrollment_count increments |
| D15 | Pre-filled fields | After enrollment, check event card | [PASS] Template data populates form fields |
| D16 | Empty catalog | Interest with no templates | [VERIFY] Catalog section hidden, "Create from scratch" still accessible |
| D17 | Loading state | Open Add Event with slow connection | [VERIFY] Catalog shows loading spinner while fetching |

### 5.3 Activity Catalog — Database (D5)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| D18 | Templates table | Query `betterat_activity_templates` | [DATA] 24 seed templates across 4 interests (6 per interest) |
| D19 | Template by interest | Filter by nursing interest_id | [DATA] Returns only nursing templates |
| D20 | Enrollments table | Enroll in a template, check `betterat_activity_enrollments` | [DATA] Row created with user_id, template_id, enrolled_at |

### 5.4 Cross-Interest AI Suggestions (D10-D13)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| D21 | Suggestion generation — trigger | Complete an event in one interest | [DATA] `onEventCompleted()` runs, check `betterat_ai_suggestions` table |
| D22 | Suggestion generation — multi-interest | User has activity in 2+ interests | [DATA] Suggestions generated for non-source interests |
| D23 | Suggestion generation — single interest | User has activity in only 1 interest | [PASS] No suggestions generated (needs 2+ interests) |
| D24 | CrossInterestInsight card | View Plan/Prep tab with active suggestions | [VERIFY] Insight cards appear with source interest, suggestion text, Apply/Dismiss/Save buttons |
| D25 | Apply suggestion | Tap "Apply to Plan" | [DATA] Suggestion status → `applied`, `applied_to_event_id` set |
| D26 | Dismiss suggestion | Tap "Dismiss" | [DATA] Suggestion status → `dismissed` |
| D27 | Save suggestion | Tap "Save" | [DATA] Suggestion status → `saved` |
| D28 | Suggestion expiry | Check suggestion with `expires_at` in past | [PASS] Not shown in UI |
| D29 | Interest switch trigger | Switch to a different interest | [PASS] `onInterestSwitch()` fires, may generate new suggestions |
| D30 | Skill taxonomy coverage | Check `lib/skillTaxonomy.ts` | [PASS] Maps universal skills across all 4 interests |

### 5.5 AI Suggestions — Database (D10)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| D31 | Suggestions table | Query `betterat_ai_suggestions` | [DATA] Table exists with correct schema: user_id, source_interest_id, target_interest_id, suggestion_type, title, body, status, expires_at |
| D32 | Suggestion types | Check constraint | [DATA] Only valid: skill_transfer, mental_model, practice_method, recovery_insight, metacognitive |
| D33 | Suggestion statuses | Check constraint | [DATA] Only valid: active, applied, dismissed, saved |

---

## 6. Nursing Interactive Lesson Components

### 6.1 BetterAtLessonPlayer Routing

| # | Test | Steps | Expected |
|---|------|-------|----------|
| N1 | Routing — body-assessment | Open lesson 1.1 (Head-to-Toe Assessment) | [PASS] Renders `BodyAssessmentInteractive`, NOT generic NursingStepViewer |
| N2 | Routing — auscultation-simulator | Open lesson 1.2 or 1.3 | [PASS] Renders `AuscultationSimulator` |
| N3 | Routing — gcs-calculator | Open lesson 1.4 (Neurological) | [PASS] Renders `GCSCalculatorInteractive` |
| N4 | Routing — med-admin | Open lesson 2.1 (6 Rights) | [PASS] Renders `MedAdminInteractive` |
| N5 | Routing — sbar-builder | Open lesson 4.3 (SBAR Handoff) | [PASS] Renders `SBARBuilderInteractive` |
| N6 | Routing — generic fallback | Open any other nursing lesson (e.g., 1.5 Abdominal) | [PASS] Renders generic `NursingStepViewer` |
| N7 | Routing — non-nursing | Open a drawing or fitness lesson | [PASS] Renders generic `NursingStepViewer` (step-based) |
| N8 | Accent color | Open nursing lesson | [VERIFY] Uses nursing accent `#0097A7` throughout |

### 6.2 BodyAssessmentInteractive

| # | Test | Steps | Expected |
|---|------|-------|----------|
| N9 | SVG body renders | Open lesson 1.1 | [VERIFY] Front-facing body silhouette with 8 colored region overlays |
| N10 | Tap head region | Tap head area on SVG | [VERIFY] Detail panel expands showing Head & Neck assessment steps |
| N11 | Tap cardiac region | Tap chest area | [VERIFY] Shows cardiac assessment steps with appropriate details |
| N12 | Step navigation | In detail panel, tap Next/Back | [PASS] Steps cycle through the region's assessment steps |
| N13 | Region completion | View all steps in a region → "Mark Complete" | [VERIFY] Region turns green, checkmark appears |
| N14 | Progress tracking | Complete 3 of 8 regions | [VERIFY] Progress bar shows 3/8, completed regions have green checkmarks |
| N15 | All regions complete | Mark all 8 regions complete | [VERIFY] Completion summary with trophy icon, "Continue" button |
| N16 | onComplete fires | Tap "Continue" on completion | [PASS] `onComplete()` callback fires |
| N17 | Region chips | Tap a chip label below body | [PASS] Same as tapping the SVG region |
| N18 | Action badges | View step details | [VERIFY] OBSERVE/PERFORM/VERIFY/DOCUMENT badges with correct colors |

### 6.3 AuscultationSimulator

| # | Test | Steps | Expected |
|---|------|-------|----------|
| N19 | Mode tabs | Open lesson | [VERIFY] Respiratory and Cardiac mode tabs visible |
| N20 | Respiratory — anterior | Select Respiratory, anterior view | [VERIFY] SVG chest with ~6 auscultation points, torso outline with rib guidelines |
| N21 | Respiratory — posterior | Toggle to posterior view | [VERIFY] SVG back view with additional auscultation points |
| N22 | Cardiac mode | Switch to Cardiac tab | [VERIFY] 5 auscultation points: Aortic, Pulmonic, Erb's, Tricuspid, Mitral |
| N23 | Tap auscultation point | Tap any point on diagram | [VERIFY] Info card shows: point name, anatomical landmark, normal findings, abnormal findings, clinical note |
| N24 | Pulsing animation | Tap a point | [VERIFY] Selected point has animated pulsing ring |
| N25 | Point reviewed | Mark point as reviewed | [VERIFY] Point turns green with checkmark |
| N26 | Mode completion | Review all points in Respiratory | [VERIFY] Respiratory tab shows checkmark, completion banner |
| N27 | Full completion | Complete both Respiratory and Cardiac | [VERIFY] Trophy banner, `onComplete()` fires |
| N28 | Technique reminder | Check collapsible card at top | [VERIFY] Shows diaphragm/bell guidance, bilateral comparison tip |
| N29 | Progress per mode | Check progress bar | [VERIFY] Shows "X/Y points reviewed" separately for each mode |

### 6.4 GCSCalculatorInteractive

| # | Test | Steps | Expected |
|---|------|-------|----------|
| N30 | Calculator renders | Open lesson | [VERIFY] E/V/M scoring sections with tappable options |
| N31 | Score calculation | Select E4, V5, M6 | [VERIFY] Total shows 15, green "Mild/Normal" badge |
| N32 | Moderate severity | Select E3, V4, M5 = 12 | [VERIFY] Amber "Moderate" color and label |
| N33 | Severe severity | Select E1, V2, M3 = 6 | [VERIFY] Red "Severe" color and label, "Consider intubation" note |
| N34 | Clinical implications | Score ≤ 8 | [VERIFY] Shows "Consider intubation for airway protection" |
| N35 | Pupil assessment | Adjust pupil size and reactivity | [VERIFY] Pupil circles resize, reactivity color changes, equality indicator updates |
| N36 | Scenario 1 | Select "Post-op confusion" scenario | [VERIFY] Description shows 68yo male post hip replacement |
| N37 | Scenario 1 — correct | Select E3, V4, M5 → Submit | [VERIFY] Green "Correct!" with clinical explanation |
| N38 | Scenario 1 — incorrect | Select wrong scores → Submit | [VERIFY] Red feedback per wrong category, "Try Again" button |
| N39 | Scenario 2 | Complete stroke assessment scenario | [PASS] Correct: E1, V2, M4 = 7 |
| N40 | Scenario 3 | Complete head trauma scenario | [PASS] Correct: E4, V5, M6 = 15 |
| N41 | All scenarios done | Complete all 3 correctly | [VERIFY] Completion banner with accuracy score, `onComplete()` fires |

### 6.5 MedAdminInteractive

| # | Test | Steps | Expected |
|---|------|-------|----------|
| N42 | 6 Rights overview | Open lesson | [VERIFY] Circular progress ring or step indicator showing 6 Rights |
| N43 | Right 1 — Patient | Expand Right Patient card | [VERIFY] Shows 2-identifier verification, armband check, patient verification |
| N44 | Right acknowledgment | Tap "I understand this Right" | [VERIFY] Card shows green checkmark, progress updates |
| N45 | All 6 acknowledged | Acknowledge all 6 Rights | [VERIFY] "Proceed to Practice Scenarios" button appears |
| N46 | Scenario 1 — wrong patient | View scenario, select violated Right(s) | [PASS] Correct answer: Right Patient |
| N47 | Scenario 2 — dose error | View Morphine calculation scenario | [PASS] Correct answer: Right Dose (should be 0.4mL not 4mL) |
| N48 | Scenario 3 — timing | View Metoprolol + Diltiazem scenario | [PASS] Correct: Right Time (hold both, HR 52 / BP 98/60) |
| N49 | Correct answer feedback | Submit correct answer | [VERIFY] Green feedback with teaching point |
| N50 | Wrong answer feedback | Submit wrong answer | [VERIFY] Red feedback with consequence description |
| N51 | Completion | Finish all 6 Rights + all 3 scenarios | [VERIFY] Score summary, `onComplete()` fires |

### 6.6 SBARBuilderInteractive

| # | Test | Steps | Expected |
|---|------|-------|----------|
| N52 | Patient chart | Open lesson | [VERIFY] Margaret Johnson's chart data visible (demographics, vitals, meds, labs, notes) |
| N53 | Chart collapsible | Toggle patient chart | [PASS] Chart collapses/expands |
| N54 | Quick reference | Check SBAR reference card | [VERIFY] Shows SBAR acronym, when to use, key tip |
| N55 | S section | Expand Situation section | [VERIFY] Red accent, guided prompts ("I am calling about..."), hint chips |
| N56 | Hint chips | Tap a hint chip | [PASS] Text appended to input, chip shows checkmark |
| N57 | B section | Fill Background section | [VERIFY] Blue accent, diagnosis/PMH/treatment prompts |
| N58 | A section | Fill Assessment section | [VERIFY] Amber accent, clinical interpretation prompts |
| N59 | R section | Fill Recommendation section | [VERIFY] Green accent, action/anticipatory/interim prompts |
| N60 | Minimum length | Try submitting with < 10 chars | [PASS] Submit button disabled or validation error |
| N61 | Submit SBAR | Fill all 4 sections → Submit | [VERIFY] Expert comparison panel appears |
| N62 | Expert comparison | View comparison | [VERIFY] Side-by-side (wide) or stacked (narrow) layout showing student vs expert |
| N63 | Rubric scoring | Check key elements checklist | [VERIFY] Green checkmarks for matched elements, red X for missed |
| N64 | Score calculation | Check total score | [VERIFY] X/12 elements matched with percentage and color-coded verdict |
| N65 | Re-compare | Tap "Edit & Re-compare" | [PASS] Returns to edit mode, can revise and resubmit |
| N66 | Completion | Compare all 4 sections → "Complete Lesson" | [PASS] `onComplete()` fires |

---

## 7. Database & Migration Verification

### 7.1 Core Tables

| # | Test | Query | Expected |
|---|------|-------|----------|
| DB1 | interests table | `SELECT * FROM interests WHERE status = 'active'` | [DATA] 4 rows: sail-racing, nursing, drawing, fitness |
| DB2 | betterat_organizations | `SELECT * FROM betterat_organizations` | [DATA] Includes JHU Nursing org (slug: jhu-nursing) |
| DB3 | betterat_vocabulary | `SELECT COUNT(*) FROM betterat_vocabulary` | [DATA] 13 universal terms × 4 interests = 52+ rows |
| DB4 | betterat_audiences | `SELECT * FROM betterat_audiences` | [DATA] 3 audiences per interest (12 total) |
| DB5 | betterat_courses | `SELECT interest_id, COUNT(*) FROM betterat_courses GROUP BY interest_id` | [DATA] Nursing: 5, Drawing: 3, Fitness: 3, Sailing: varies |
| DB6 | betterat_lessons | `SELECT c.title, COUNT(l.id) FROM betterat_lessons l JOIN betterat_courses c ON l.course_id = c.id GROUP BY c.title` | [DATA] Nursing: 24, Drawing: 12, Fitness: 12 |
| DB7 | betterat_activity_templates | `SELECT interest_id, COUNT(*) FROM betterat_activity_templates GROUP BY interest_id` | [DATA] ~6 templates per interest |
| DB8 | betterat_ai_suggestions | `SELECT COUNT(*) FROM betterat_ai_suggestions` | [DATA] Table exists (may be empty until events generate suggestions) |

### 7.2 Lesson Data Integrity

| # | Test | Query | Expected |
|---|------|-------|----------|
| DB9 | Steps array present | `SELECT id, title FROM betterat_lessons WHERE lesson_data->'steps' IS NULL` | [DATA] Zero rows (all lessons have steps) |
| DB10 | Interactive types set | `SELECT interactive_type, COUNT(*) FROM betterat_lessons GROUP BY interactive_type` | [DATA] Various types including body-assessment, auscultation-simulator, gcs-calculator, med-admin, sbar-builder |
| DB11 | Step schema valid | `SELECT id, title, jsonb_array_length(lesson_data->'steps') as step_count FROM betterat_lessons ORDER BY step_count` | [DATA] All lessons have 3-10 steps |
| DB12 | No orphaned lessons | `SELECT l.id FROM betterat_lessons l LEFT JOIN betterat_courses c ON l.course_id = c.id WHERE c.id IS NULL` | [DATA] Zero rows |

### 7.3 RLS Policies

| # | Test | Steps | Expected |
|---|------|-------|----------|
| DB13 | Public interest read | Query interests as anon user | [PASS] Can read public interests |
| DB14 | Org-only interest read | Query org interest as non-member | [PASS] Cannot read org-only interests |
| DB15 | User preferences isolation | Query user_preferences as different user | [PASS] Can only see own preferences |
| DB16 | Course read access | Query courses as any authenticated user | [PASS] Can read all published courses |

---

## 8. Cross-Cutting Concerns

### 8.1 TypeScript Compilation

| # | Test | Command | Expected |
|---|------|---------|----------|
| X1 | Expo type-check | `npx tsc --noEmit` in regattaflow-app | [PASS] Zero errors |
| X2 | Next.js build | `npm run build` in betterat-sail-racing | [PASS] Zero errors |

### 8.2 Performance

| # | Test | Steps | Expected |
|---|------|-------|----------|
| X3 | Interest switch speed | Switch interest, measure content reload | [VERIFY] Content appears within 2 seconds |
| X4 | Learn tab load | Open Learn tab with 24 nursing lessons | [VERIFY] Course list renders within 1 second |
| X5 | SVG body diagram perf | Open BodyAssessmentInteractive | [VERIFY] No frame drops, smooth tapping |
| X6 | Auscultation pulse animation | View pulsing dot on auscultation point | [VERIFY] Smooth 60fps animation |
| X7 | Large lesson data | Open lesson with 10+ steps | [VERIFY] No scroll jank in step viewer |

### 8.3 Responsive Layout

| # | Test | Steps | Expected |
|---|------|-------|----------|
| X8 | Next.js mobile | View homepage at 375px width | [VERIFY] All sections stack vertically, no horizontal overflow |
| X9 | Next.js tablet | View homepage at 768px | [VERIFY] Two-column layouts where appropriate |
| X10 | Next.js desktop | View homepage at 1440px | [VERIFY] Max-width containers, centered content |
| X11 | Interest page mobile | View `/nursing` at 375px | [VERIFY] Phone mockups stack, audience tabs scroll |
| X12 | Expo phone | Test on iPhone SE (smallest) | [VERIFY] All nursing interactives fit without clipping |
| X13 | Expo tablet | Test on iPad | [VERIFY] Wider layouts used where available |
| X14 | SBAR wide layout | View SBARBuilder on tablet/web | [VERIFY] Side-by-side comparison at ≥700px |

### 8.4 Error Handling

| # | Test | Steps | Expected |
|---|------|-------|----------|
| X15 | No internet — interest load | Disconnect wifi, open app | [PASS] Falls back to cached interest, no crash |
| X16 | No internet — courses | Disconnect wifi, open Learn tab | [PASS] Shows error state or cached data |
| X17 | Empty lesson data | Lesson with no steps | [VERIFY] Fallback UI: "This lesson does not have interactive content yet." |
| X18 | Invalid interest slug | Manually set invalid slug in AsyncStorage | [PASS] Falls back to interest selection modal |
| X19 | Missing activity templates | Interest with no templates in catalog | [PASS] Catalog section hidden gracefully |
| X20 | AI suggestion error | Force error in suggestion generation | [PASS] Non-critical: logged, no user-facing crash |

### 8.5 Accessibility

| # | Test | Steps | Expected |
|---|------|-------|----------|
| X21 | SVG body tap targets | Test body regions with large finger | [VERIFY] Tap targets are at least 44x44pt |
| X22 | Auscultation tap targets | Tap small auscultation points | [VERIFY] Hit area is padded beyond visible circle |
| X23 | Screen reader labels | Enable VoiceOver, navigate nursing lesson | [VERIFY] All interactive elements have accessibilityLabels |
| X24 | Color contrast | Check text on colored backgrounds | [VERIFY] All text meets WCAG AA contrast (4.5:1) |
| X25 | Keyboard navigation (web) | Tab through SBAR builder on web | [VERIFY] All inputs focusable via keyboard |

### 8.6 Data Isolation

| # | Test | Steps | Expected |
|---|------|-------|----------|
| X26 | No cross-interest leakage | Switch from Nursing to Drawing, check all tabs | [PASS] No nursing content appears in drawing context |
| X27 | Event scoping | Create events in different interests, verify | [PASS] Each interest's event tab shows only its own events |
| X28 | Course scoping | Verify Learn tab after multiple switches | [PASS] Only active interest's courses shown |
| X29 | Suggestion scoping | View AI suggestions in target interest | [PASS] Suggestions reference source interest correctly |

---

## Test Execution Checklist

### Phase 1: Static Verification (no runtime needed)
- [ ] X1 — Expo type-check passes
- [ ] X2 — Next.js build passes

### Phase 2: Database Verification (Supabase dashboard)
- [ ] DB1-DB8 — All tables populated
- [ ] DB9-DB12 — Lesson data integrity
- [ ] DB13-DB16 — RLS policies

### Phase 3: Next.js Marketing Site
- [ ] A1-A4 — Design system
- [ ] A5-A10 — Navigation
- [ ] A11-A18 — Homepage sections
- [ ] A19-A27 — Interest sub-pages
- [ ] A28-A31 — Auth pages
- [ ] X8-X11 — Responsive layout

### Phase 4: Expo — Core Infrastructure
- [ ] B1-B6 — Interest selection
- [ ] B7-B13 — Interest switching
- [ ] B14-B18 — Vocabulary
- [ ] B19-B26 — Course catalog
- [ ] X3-X4 — Performance

### Phase 5: Expo — Event Cards
- [ ] C1-C4 — Phase labels
- [ ] C5-C12 — Content modules
- [ ] C13-C17 — Config loading
- [ ] C25-C31 — Add Event flow

### Phase 6: Expo — Nursing Lessons (most complex)
- [ ] N1-N8 — Lesson player routing
- [ ] N9-N18 — BodyAssessmentInteractive
- [ ] N19-N29 — AuscultationSimulator
- [ ] N30-N41 — GCSCalculatorInteractive
- [ ] N42-N51 — MedAdminInteractive
- [ ] N52-N66 — SBARBuilderInteractive

### Phase 7: Expo — Plan Card & Catalog
- [ ] D1-D9 — Blank Plan Card
- [ ] D10-D17 — Activity Catalog
- [ ] D21-D30 — Cross-Interest AI

### Phase 8: Cross-Cutting
- [ ] X5-X7 — Component performance
- [ ] X12-X14 — Responsive layout (Expo)
- [ ] X15-X20 — Error handling
- [ ] X21-X25 — Accessibility
- [ ] X26-X29 — Data isolation

---

**Total test cases: 132**
- Part A (Next.js): 33
- Part B (Expo infra): 30
- Part C (Event cards): 31
- Part D (Plan/Catalog/AI): 30
- Nursing Lessons: 58
- Cross-cutting: 29

*Some tests counted in multiple categories where they overlap.*
