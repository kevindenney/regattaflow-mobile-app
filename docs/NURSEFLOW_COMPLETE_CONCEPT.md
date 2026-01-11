# NurseFlow: Complete Platform Concept

**Target URL: better.at/nursing**

A comprehensive nursing education platform adapting RegattaFlow's race preparation → execution → analysis loop for clinical competency development.

---

## Persona Mapping

| RegattaFlow | NurseFlow | Primary Users |
|-------------|-----------|---------------|
| **Sailor** | **Student** | BSN/MSN nursing students |
| **Coach** | **Faculty / Clinical Instructor** | Professors, Preceptors, TAs |
| **Yacht Club** | **Nursing Program / College** | Program Directors, Deans, Admin Staff |

---

## App Structure

```
better.at/nursing
├── /student          ← Student app (main learner experience)
│   ├── Dashboard
│   ├── Clinical Shifts (timeline cards)
│   ├── Skills Lab sessions
│   ├── Competency Passport
│   ├── NCLEX Prep
│   └── Profile
│
├── /faculty          ← Faculty/Instructor app
│   ├── Dashboard
│   ├── My Students
│   ├── Schedule (checkoffs, simulations)
│   ├── Evaluations
│   ├── AI Insights
│   └── Profile
│
├── /preceptor        ← Simplified preceptor portal
│   ├── My Students (this rotation)
│   ├── Quick Feedback
│   ├── Hours Verification
│   └── End-of-Rotation Evaluation
│
└── /admin            ← Program administration
    ├── Dashboard
    ├── Cohort Management
    ├── Clinical Placements
    ├── Competency Tracking
    ├── Simulation Lab Scheduling
    ├── Reports & Accreditation
    └── Settings
```

---

# PART 1: STUDENT EXPERIENCE

## Card Types on Student Timeline

| Card Type | Description | Phases |
|-----------|-------------|--------|
| **Clinical Shift** | Real patient care in hospital/clinic | Prep → Launch → Care → Reflect |
| **Skills Lab** | Deliberate practice session | Plan → Practice → Review |
| **Simulation** | High-fidelity scenario | Brief → Execute → Debrief |
| **Skills Checkoff** | Formal competency evaluation | Prep → Perform → Result |
| **NCLEX Prep Block** | Focused exam preparation | Study → Quiz → Review |

---

## Clinical Shift Phases

### Phase 1: Prep (Days Before)

**Patient Research Checklist**
- [ ] Review assigned patient diagnoses
- [ ] Study unfamiliar conditions/pathophysiology
- [ ] Research prescribed medications
- [ ] Review relevant lab values
- [ ] Identify potential complications

**Care Plan Preparation**
- [ ] Draft nursing diagnoses
- [ ] Outline expected interventions
- [ ] Identify patient education needs
- [ ] Prepare questions for preceptor

**Logistics**
- [ ] Confirm clinical site and unit
- [ ] Prepare equipment (stethoscope, badge, etc.)
- [ ] Review parking/access procedures

### Phase 2: Launch (Shift Morning)

**Handoff Checklist**
- [ ] Attend shift report (SBAR format)
- [ ] Review MAR for due medications
- [ ] Check pending orders
- [ ] Note isolation precautions

**Initial Assessment**
- [ ] Introduce self to patients
- [ ] Complete head-to-toe assessment
- [ ] Verify patient identity (2 identifiers)
- [ ] Assess pain, fall risk, IV sites

**Prioritization**
- [ ] Identify unstable patients (ABCs)
- [ ] Map time-sensitive medications
- [ ] Plan assessment order

### Phase 3: Care (On Shift)

**Medication Administration (5 Rights)**
- [ ] Right patient
- [ ] Right medication
- [ ] Right dose
- [ ] Right route
- [ ] Right time

**Hourly Rounding**
- [ ] Pain assessment
- [ ] Position change
- [ ] Personal needs
- [ ] Possessions within reach

**Documentation**
- [ ] Assessment findings
- [ ] Interventions performed
- [ ] Patient responses
- [ ] Education provided

### Phase 4: Reflect (After Shift)

**Handoff Completed**
- [ ] Report given to oncoming nurse
- [ ] All charting finished
- [ ] Pending tasks communicated

**Structured Reflection** (1-5 rating + notes)
1. How well did my preparation serve me?
2. How effectively did I use clinical reasoning (ADPIE)?
3. How well did I manage my time?
4. How was my communication with team and patients?
5. How confident was I in procedures performed?
6. Did I maintain patient safety throughout?
7. What did I learn today?
8. Overall shift experience?

**AI Analysis Generates**
- Knowledge gaps identified → study resources
- Skills trending → checkoff readiness
- NCLEX questions based on conditions seen
- Personalized recommendations

---

## NCLEX Integration (Core Feature)

Every clinical experience maps to NCLEX categories:

| NCLEX Category | Clinical Activities |
|----------------|---------------------|
| Management of Care | Delegation, prioritization, coordination |
| Safety & Infection Control | Hand hygiene, isolation, fall prevention |
| Health Promotion | Patient education, prevention counseling |
| Psychosocial Integrity | Mental health, coping, therapeutic communication |
| Basic Care & Comfort | Hygiene, nutrition, mobility, pain |
| Pharmacological Therapies | Med administration, IV therapy, calculations |
| Reduction of Risk | Lab values, complications, vital signs |
| Physiological Adaptation | Acute illness, chronic conditions, emergencies |

**Post-Shift Flow:**
```
Shift Completed
    ↓
AI analyzes reflection + encounters
    ↓
Maps to NCLEX categories
    ↓
Generates 3-5 targeted questions
    ↓
Student answers (encouraged)
    ↓
Tracks readiness per category
    ↓
Identifies weak areas → study focus
```

---

## Competency Passport

Visual tracker showing:
- Required skills vs. completed
- Clinical hours by specialty
- Simulation completions
- NCLEX readiness score by category
- Next checkoffs due

---

## Student User Flow

```
Student Journey

1. Login → Student Dashboard
   ├── Upcoming shifts/labs/simulations
   ├── NCLEX readiness score
   ├── Competencies due
   └── Recent AI insights
   ↓
2. Before Clinical Shift
   ├── Review assigned patients
   ├── Complete Prep checklist
   ├── AI suggests focus areas
   └── Review care plan resources
   ↓
3. After Shift
   ├── Complete structured reflection
   ├── Answer NCLEX questions
   ├── Review AI analysis
   └── Update competency log
   ↓
4. Ongoing
   ├── Track progress in passport
   ├── Schedule skills checkoffs
   ├── Complete NCLEX prep blocks
   └── Review faculty feedback
```

---

# PART 2: FACULTY EXPERIENCE

## Faculty Dashboard

### KPIs
- **Assigned Students**: Total count
- **On Track**: Students meeting milestones
- **At Risk**: Students needing intervention
- **Pending Evaluations**: Forms to complete
- **Checkoffs This Week**: Scheduled sessions

### Dashboard Sections
```
Faculty Dashboard
├── My Students (assigned clinical group)
│   ├── Progress indicators (hours, skills, NCLEX)
│   ├── Recent reflections (AI-highlighted insights)
│   └── Concerns flagged
│
├── Today's Schedule
│   ├── Clinical supervision
│   ├── Checkoffs scheduled
│   └── Simulations to facilitate
│
├── Pending Actions
│   ├── Evaluations to complete
│   ├── Competency sign-offs
│   └── Student meetings
│
└── Quick Actions
    ├── Schedule Checkoff
    ├── Complete Evaluation
    ├── Flag Student Concern
    └── Message Students
```

---

## Student Management

### Student Card View

```
┌─────────────────────────────────────────┐
│ Sarah Chen                    BSN '25   │
│ Med-Surg II @ City Hospital             │
├─────────────────────────────────────────┤
│ Hours: 68/135 (50%)          ████░░░░░░ │
│ Skills: 12/18 complete       ██████░░░░ │
│ NCLEX Readiness: 72%         ███████░░░ │
├─────────────────────────────────────────┤
│ Last Shift: Jan 10                      │
│ Reflection Quality: ★★★★☆              │
│ Strengths: Assessment, communication    │
│ Growth: Time management, IV confidence  │
├─────────────────────────────────────────┤
│ [View Details] [Complete Eval] [Message]│
└─────────────────────────────────────────┘
```

### Student Detail View
- Full profile and stats
- Session history with progress charts
- All reflections with AI analysis
- Competency passport status
- Faculty notes (private)
- Intervention plans if at-risk

---

## Clinical Evaluation

### Formative (After Each Observed Shift)

**Performance Ratings (1-5)**
- Preparation
- Clinical judgment
- Patient safety
- Communication
- Professionalism
- Documentation
- Skill execution

**Narrative**
- Strengths observed
- Areas for growth
- Specific incidents
- Learning goals for next shift

**AI Assistance**
- Suggests feedback based on ratings
- Highlights alignment/misalignment with student reflection
- Recommends resources for growth areas

### Summative (End of Rotation)

- Overall grade: Pass / Pass with Concerns / Fail / Incomplete
- AACN Essentials mapping
- Clinical judgment level: Novice → Advanced Beginner → Competent → Proficient
- Summary narrative
- Recommendations for next rotation
- Student signature and response option

---

## Skills Checkoff

### Scheduling
- Faculty sets availability windows
- Students sign up for slots
- Confirmation workflow

### Execution
```
Student Performs Skill
    ↓
Faculty Evaluates
├── Critical steps checklist
├── Safety considerations
├── Professional behavior
└── Overall execution
    ↓
├── PASS → Competency unlocked
│         → Passport updated
│         → Student notified
│
└── NEEDS REMEDIATION
    → Specific feedback
    → Remediation plan
    → Practice resources
    → Next attempt scheduled
```

---

## AI-Powered Tools

### Student Analysis
- Pattern detection across shifts
- Improvement trends
- Regression alerts
- Cohort comparison

### Early Warning System
Flags students showing:
- Declining reflection quality
- Repeated skill struggles
- Lower NCLEX quiz performance
- Attendance concerns
- Self-perception vs faculty observation gaps

### Feedback Suggestions
When completing observations, AI suggests:
- Specific, actionable feedback
- Relevant learning resources
- NCLEX questions for the conditions seen
- Alignment notes with student reflection

---

## Faculty User Flow

```
Faculty Journey

1. Login → Faculty Dashboard
   ↓
2. Review Today
   ├── Which students am I supervising?
   ├── Any checkoffs scheduled?
   ├── Simulations to facilitate?
   └── Pending evaluations?
   ↓
3. During Clinical Day
   ├── Monitor student activities
   ├── Provide real-time feedback
   ├── Quick observation notes
   ├── Sign off skills as performed
   └── Flag concerns immediately
   ↓
4. Post-Clinical
   ├── Complete formal observations
   ├── Review student reflections
   │   └── AI highlights key insights
   ├── Set learning goals
   └── Update competency records
   ↓
5. Periodic
   ├── Complete summative evaluations
   ├── Meet with at-risk students
   ├── Cohort progression meetings
   └── Review AI insights
```

---

# PART 3: PRECEPTOR EXPERIENCE

## Simplified Portal for Hospital RNs

Preceptors are busy clinicians. They need minimal interface:

### Quick Actions (Mobile-First)

```
Today's Students: 2

┌─────────────────────────────────┐
│ Sarah Chen - Day shift         │
│ ┌───────────────────────────┐  │
│ │ [✓] Shift completed OK    │  │
│ │ [!] Flag a concern        │  │
│ │ [★] Highlight strength    │  │
│ └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Weekly Summary Email
- Hours to verify per student
- One-click confirmation
- Flag any concerns
- Optional detailed notes

### End-of-Rotation Evaluation
Simple rating form:
- Professional behavior
- Clinical competence
- Initiative/engagement
- Communication skills
- Overall recommendation
- Comments (optional)

---

## Preceptor User Flow

```
Preceptor Journey

1. Receive notification: "Sarah Chen assigned to you"
   ↓
2. During Shift
   └── Focus on patient care and student supervision
   ↓
3. End of Shift (30 seconds)
   ├── Tap "Shift completed OK" or
   ├── Tap "Flag concern" with brief note or
   └── Tap "Highlight strength" with brief note
   ↓
4. Weekly
   └── Confirm hours via email (one-click)
   ↓
5. End of Rotation
   └── Complete 5-minute evaluation form
```

---

# PART 4: PROGRAM ADMIN EXPERIENCE

## Admin Dashboard

### KPIs
- **Active Students** (by cohort)
- **Clinical Hours** (logged this month)
- **Competency Rate** (students on track)
- **NCLEX Readiness** (cohort prediction)
- **At-Risk Count** (students flagged)
- **Site Utilization** (clinical capacity)

### Dashboard Sections
```
Program Admin Dashboard
├── Cohort Overview
│   ├── 2024: 45 students, 87% on track
│   ├── 2025: 52 students, 92% on track
│   └── 2026: 48 students, 78% on track (!)
│
├── Clinical Operations
│   ├── Active placements this week
│   ├── Sites at capacity
│   ├── Unassigned students
│   └── Preceptor availability
│
├── Competency Status
│   ├── Skills completion by cohort
│   ├── Bottleneck skills (low completion)
│   └── Checkoff schedule capacity
│
├── Alerts
│   ├── At-risk students (3)
│   ├── Expiring site affiliations (1)
│   ├── Overdue evaluations (5)
│   └── NCLEX concern students (2)
│
└── Quick Actions
    ├── Schedule Simulation
    ├── Assign Placements
    ├── View Reports
    └── Message Cohort
```

---

## Cohort Management

### Student Lifecycle States
- **Admitted** → **Active** → **Clinical** → **Graduated**
- Side paths: At-Risk, Leave, Withdrawn

### Bulk Operations
- Filter by cohort, track, status, placement
- Mass email/notification
- Batch placement assignment
- Export reports (FERPA-compliant)
- Progress comparison across cohorts

---

## Clinical Placement Management

### Site Management
```
City Hospital
├── Med-Surg Unit A: 4/6 students
├── Med-Surg Unit B: 6/6 students (full)
├── ICU: 2/3 students
├── ED: 3/4 students
└── Peds: 2/4 students

Affiliation Status: Active (expires Dec 2026)
Preceptors: 12 active
Requirements: BLS, immunizations, background check
```

### Placement Workflow
```
1. Program creates rotation slots
   ↓
2. Students submit preferences
   ↓
3. Algorithm/admin assigns placements
   ↓
4. Students complete site onboarding
   ↓
5. Rotation begins → tracking active
   ↓
6. Rotation ends → evaluations collected
   ↓
7. Hours verified → records updated
```

### Rotation Types
| Rotation | Hours | Focus | Semester |
|----------|-------|-------|----------|
| Fundamentals | 90 | Basic care | 1 |
| Med-Surg I | 135 | Adult medical | 2 |
| Med-Surg II | 135 | Complex adult | 3 |
| Pediatrics | 90 | Child/adolescent | 3 |
| OB/Maternity | 90 | Maternal-newborn | 3 |
| Psych | 90 | Mental health | 4 |
| Community | 90 | Population health | 4 |
| Preceptorship | 180 | Independent | 5 |

---

## Competency Tracking

### Program-Wide View
```
Skills Completion Matrix

                    Cohort 2024  2025   2026
Vital Signs         100%        100%   98%
IV Insertion        94%         88%    45%  ← bottleneck
Foley Catheter      91%         75%    --
Wound Care          89%         82%    52%
Med Administration  100%        95%    78%
...
```

### Checkoff Scheduling
- View faculty availability
- Schedule batch checkoff sessions
- Track completion rates
- Identify scheduling conflicts

---

## Simulation Lab

### Scheduling
```
Simulation Lab A - High Fidelity
├── Mon 8am: Code Blue (Cohort 2025, 8 students)
├── Mon 2pm: Post-op Complication (Cohort 2024, 6 students)
├── Tue 8am: Available
└── ...

Facilitators Available: 4
Scenarios Library: 45 scenarios
```

### Scenario Management
- Learning objectives
- Prerequisite skills
- NCLEX category mapping
- Equipment requirements
- Debrief guide

---

## Reports & Accreditation

### Available Reports
| Report | Content | Audience |
|--------|---------|----------|
| Clinical Hours | All hours by student, site, rotation | CCNE/ACEN |
| Competency Matrix | Skills by student by semester | Accreditation |
| NCLEX Readiness | Predicted pass rates | Board reporting |
| Site Utilization | Capacity vs. demand | Operations |
| Faculty Workload | Students per instructor | HR/scheduling |
| At-Risk Summary | Intervention status | Academic affairs |

### Accreditation Export
One-click exports for:
- AACN Essentials coverage
- Clinical hour verification
- Competency documentation
- Program outcomes (graduation, NCLEX, employment)

### Compliance Dashboard
- Student immunizations
- Background checks
- CPR certifications
- HIPAA training
- Site affiliation agreements

---

## Admin User Flow

```
Program Admin Journey

1. Login → Admin Dashboard
   ↓
2. Daily Review
   ├── Check at-risk alerts
   ├── Review placement status
   ├── Monitor capacity
   └── Address urgent issues
   ↓
3. Operational Tasks
   ├── Process placement requests
   ├── Schedule simulations
   ├── Coordinate with sites
   ├── Faculty checkoff assignments
   └── Student communications
   ↓
4. Periodic Tasks
   ├── Cohort progression review
   ├── Clinical site evaluation
   ├── Accreditation prep
   ├── Curriculum assessment
   └── Strategic planning
   ↓
5. Reporting
   ├── Generate accreditation docs
   ├── Board reports
   ├── Faculty workload analysis
   └── Outcome tracking
```

---

# PART 5: DATA FLOW & INTEGRATION

## How Personas Connect

```
                    ┌─────────────────────┐
                    │   Program Admin     │
                    │   (Institutional)   │
                    └─────────┬───────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
    │   Faculty   │    │  Preceptor  │    │    Site     │
    │  (Internal) │    │ (External)  │    │ Coordinator │
    └──────┬──────┘    └──────┬──────┘    └─────────────┘
           │                  │
           └────────┬─────────┘
                    │
                    ▼
             ┌─────────────┐
             │   Student   │
             │  (Learner)  │
             └─────────────┘
```

## Data Flow After Clinical Shift

```
Student completes Clinical Shift
    │
    ├─→ Student enters reflection
    │       │
    │       └─→ AI analysis
    │           ├─→ NCLEX questions generated
    │           ├─→ Knowledge gaps identified
    │           └─→ Study recommendations
    │
    ├─→ Preceptor verifies hours (quick tap)
    │       │
    │       └─→ Hours logged → Progress updated
    │
    ├─→ Faculty reviews reflection + preceptor notes
    │       │
    │       ├─→ AI highlights insights
    │       ├─→ Faculty completes observation
    │       └─→ Competencies signed off
    │
    └─→ Program Admin sees aggregated data
            │
            ├─→ Cohort progress metrics
            ├─→ At-risk alerts
            ├─→ Site utilization
            └─→ Accreditation tracking
```

---

# PART 6: MVP ROADMAP

## Phase 1: Student Core
1. Clinical Shift card with 4 phases
2. Basic checklists per phase
3. Structured reflection with ratings
4. NCLEX question integration (3-5 per shift)
5. Competency passport (view progress)

## Phase 2: AI Enhancement
6. AI shift analysis (pattern detection)
7. Personalized study recommendations
8. Trend visualization over time

## Phase 3: Faculty Tools
9. Faculty dashboard with students
10. Student progress view
11. Observation/evaluation forms
12. Checkoff scheduling and completion

## Phase 4: Preceptor Portal
13. Simplified mobile interface
14. Quick shift verification
15. End-of-rotation evaluation

## Phase 5: Program Admin
16. Admin dashboard with KPIs
17. Cohort management
18. Clinical placement scheduling
19. Basic reporting

## Phase 6: Advanced Features
20. Simulation lab management
21. Accreditation export
22. Advanced analytics
23. EHR training integration

---

# PART 7: KEY ADAPTATIONS FROM REGATTAFLOW

| RegattaFlow | NurseFlow |
|-------------|-----------|
| Race timeline card | Clinical Shift timeline card |
| Practice session | Skills Lab session |
| Race phases (days_before → after_race) | Shift phases (prep → reflect) |
| Weather forecasting | Patient condition research |
| Boat tuning recommendations | Care plan recommendations |
| Tactical frameworks (puff response, etc.) | Clinical reasoning (ADPIE, SBAR) |
| Post-race AI analysis | Post-shift AI with NCLEX mapping |
| Sailing academy interactives | Skills practice interactives |
| Equipment carryover | Learning carryover (study next) |
| Race results entry | Shift outcomes & encounters |
| Course map visualization | Unit/facility orientation |
| VHF channel reference | SBAR communication templates |
| Coach-athlete matching | Faculty-student assignment |
| Session planning | Clinical supervision planning |
| Race committee signals | Simulation scenario facilitation |
| Club member management | Cohort management |
| Event/regatta scheduling | Rotation scheduling |
| Results publishing | Evaluation completion |
| Fleet management | Track/specialty management |

---

## Design Decisions

| Decision | Choice |
|----------|--------|
| Program Level | Both BSN & MSN (flexible) |
| NCLEX Integration | Core feature |
| System Integration | Standalone + EHR training + Portfolio export |
| Device Context | Mobile + Laptop equally |

---

*NurseFlow adapts RegattaFlow's proven preparation → execution → analysis loop for nursing education, where deliberate practice and reflection are equally critical for developing competent practitioners.*

*Target URL: better.at/nursing*
