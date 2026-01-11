# NurseFlow: Adapting RegattaFlow for Nursing Graduate Students

## Concept Overview

RegattaFlow's core architecture translates remarkably well to nursing education. The sailing metaphor of preparation → execution → reflection maps directly to clinical competency development.

---

## 1. Card Types: "Add Race" & "Add Practice Session" Equivalents

### Primary Timeline Cards

| RegattaFlow | NurseFlow | Description |
|-------------|-----------|-------------|
| **Add Race** | **Add Clinical Shift** | Real patient care experience in hospital/clinic |
| **Add Practice Session** | **Add Skills Lab** | Deliberate practice on specific competencies |

### Additional Card Types (Nursing-Specific)

| Card Type | Description |
|-----------|-------------|
| **Add Simulation** | High-fidelity simulation scenario (mannequin/standardized patient) |
| **Add Skills Checkoff** | Formal competency evaluation on procedure |
| **Add Case Study** | Written patient case analysis |
| **Add NCLEX Prep Block** | Focused exam preparation session |

---

## 2. Phase Mapping: Clinical Shift (The "Race")

### Temporal Phases

| Phase | Sailing | Nursing Clinical | Time Window |
|-------|---------|------------------|-------------|
| **days_before** | Weather research, boat prep | Patient research, care plan prep | 24-48h before shift |
| **shift_morning** | Race morning rigging | Handoff, initial assessments | Day of, before patient care |
| **on_shift** | Racing | Active patient care | During shift |
| **after_shift** | Post-race analysis | Charting, reflection | After shift ends |

### Excellence Framework Phases

| Phase | Focus | Key Activities |
|-------|-------|----------------|
| **Prep** | Knowledge & Planning | Research patients, review conditions, prepare care plans |
| **Launch** | Orientation & Assessment | Receive handoff, prioritize, initial patient contact |
| **Care** | Clinical Execution | Medications, assessments, interventions, documentation |
| **Reflect** | Learning & Growth | Debrief, identify gaps, plan improvements |

---

## 3. Checklists by Phase

### Prep Phase (Days Before Shift)

**Patient Research Checklist**
- [ ] Review assigned patient diagnoses
- [ ] Study unfamiliar conditions/pathophysiology
- [ ] Research prescribed medications (mechanism, side effects, nursing considerations)
- [ ] Review relevant lab values and their implications
- [ ] Understand ordered procedures/interventions
- [ ] Identify potential complications to monitor

**Care Plan Preparation**
- [ ] Draft nursing diagnoses for each patient
- [ ] Outline expected interventions
- [ ] Identify patient education needs
- [ ] Prepare questions for preceptor

**Logistics Checklist**
- [ ] Confirm clinical site and unit
- [ ] Review dress code compliance
- [ ] Prepare required equipment (stethoscope, badge, pen lights, etc.)
- [ ] Set alarm for arrival 15 min early
- [ ] Review parking/access procedures

### Launch Phase (Shift Morning)

**Handoff Checklist**
- [ ] Attend shift report (SBAR format)
- [ ] Clarify questions with off-going nurse
- [ ] Review MAR for due medications
- [ ] Check pending orders
- [ ] Note isolation precautions

**Initial Assessment Checklist**
- [ ] Introduce self to each patient
- [ ] Complete head-to-toe assessment
- [ ] Verify patient identity (2 identifiers)
- [ ] Check IV sites, wounds, drains
- [ ] Assess pain level
- [ ] Verify fall risk status
- [ ] Check call light within reach

**Prioritization Tool**
- [ ] Identify unstable patients (ABCs)
- [ ] Map time-sensitive medications
- [ ] Plan assessment order
- [ ] Identify delegation opportunities

### Care Phase (On Shift)

**Medication Administration (5 Rights)**
- [ ] Right patient
- [ ] Right medication
- [ ] Right dose
- [ ] Right route
- [ ] Right time

**Hourly Rounding Checklist**
- [ ] Pain assessment
- [ ] Position change
- [ ] Personal needs (bathroom, water)
- [ ] Possessions within reach

**Safety Monitoring**
- [ ] Fall precautions in place
- [ ] Bed alarm active (if indicated)
- [ ] IV site checked
- [ ] Skin integrity monitored

**Documentation Prompts**
- [ ] Assessment findings documented
- [ ] Interventions recorded
- [ ] Patient responses noted
- [ ] Education provided documented

### Reflect Phase (After Shift)

**Handoff Given Checklist**
- [ ] Complete report to oncoming nurse
- [ ] All charting finished
- [ ] Pending tasks communicated
- [ ] Questions answered

**Structured Reflection Questions**
Rating 1-5 plus notes:

1. **Preparation Quality**: How well did my research prepare me for today's patients?
2. **Clinical Reasoning**: How effectively did I use the nursing process (ADPIE)?
3. **Time Management**: How well did I prioritize and manage my patient load?
4. **Communication**: How effective was my communication with team and patients?
5. **Technical Skills**: How confident was I in procedures performed?
6. **Patient Safety**: Did I maintain safety standards throughout?
7. **Learning Achieved**: What new knowledge/skills did I gain?
8. **Overall Shift Experience**: How do I feel about my performance?

---

## 4. Tools & Wizards

### Nursing-Specific Tools (Equivalent to RegattaFlow Wizards)

| Tool | Purpose | Triggers |
|------|---------|----------|
| **Med Lookup Wizard** | Quick drug reference with nursing implications | Before med pass |
| **Lab Values Interpreter** | Normal ranges, critical values, nursing actions | During patient research |
| **SBAR Generator** | Structured communication builder | Before calling provider |
| **Nursing Diagnosis Helper** | NANDA diagnosis selection with interventions | Care plan prep |
| **Procedure Checklist** | Step-by-step for skills (IV, Foley, etc.) | Before performing procedure |
| **Documentation Helper** | Charting templates and prompts | During/after care |
| **Critical Thinking Pathway** | Decision trees for common scenarios | When facing clinical decisions |

### Interactive Learning Modules (Like Sailing Interactives)

- **Medication Calculation Trainer** - Practice dosage calculations
- **Heart Sound Simulator** - Auscultation practice
- **ECG Rhythm Recognition** - Identify arrhythmias
- **Prioritization Scenarios** - "Which patient first?" exercises
- **NCLEX Question Bank** - Linked to clinical experiences

---

## 5. AI Review Analysis

### Post-Shift AI Analysis (Like Post-Race Analysis)

**What It Analyzes:**
- Reflection responses and patterns across shifts
- Knowledge gaps based on patient conditions encountered
- Skill confidence trends over time
- Clinical reasoning patterns
- Time management insights

**Output Structure:**
```
Shift Summary
├── Conditions Encountered: [list with mastery level]
├── Skills Performed: [with confidence ratings]
├── Knowledge Gaps Identified: [with study resources]
├── Clinical Reasoning Score: [based on reflection quality]
└── Recommendations: [personalized next steps]
```

**AI Coaching Feedback Types:**

1. **Clinical Reasoning Analysis**
   - "Your reflection shows strong assessment skills but consider..."
   - Pattern recognition across multiple shifts
   - NCLEX-style reasoning reinforcement

2. **Knowledge Gap Detection**
   - Links unfamiliar conditions to study resources
   - Generates targeted NCLEX questions
   - Suggests simulation scenarios for practice

3. **Skill Progression Tracking**
   - Confidence trend charts per procedure
   - Readiness indicators for checkoffs
   - Practice recommendations

4. **Communication Effectiveness**
   - SBAR quality analysis
   - Patient education effectiveness
   - Team communication patterns

### Learning Loop Integration

```
Clinical Shift → AI Analysis → Knowledge Gaps →
→ NCLEX Questions → Study Focus → Skills Lab Practice →
→ Next Clinical Shift (improved)
```

---

## 6. Live Coaching Features

### Preceptor Integration

**During Shift:**
- Quick feedback capture (thumbs up/down on interactions)
- Voice memo for detailed observations
- Real-time skill demonstration requests

**Post-Shift:**
- Structured preceptor evaluation form
- Alignment check: Student reflection vs Preceptor observation
- Goal setting for next shift

### Peer Learning

- **Buddy System**: Pair students on same unit
- **Case Sharing**: Anonymized interesting cases
- **Study Groups**: Coordinated prep sessions

### Instructor Dashboard

- **Progress Overview**: All students' shift summaries
- **Red Flag Alerts**: Struggling students or safety concerns
- **Competency Tracking**: Skills checkoff readiness
- **NCLEX Readiness Indicators**: Based on clinical + quiz performance

---

## 7. Unique Nursing Features (Beyond Sailing Adaptation)

### NCLEX Integration Layer

Every clinical experience maps to NCLEX content areas:
- Management of Care
- Safety and Infection Control
- Health Promotion and Maintenance
- Psychosocial Integrity
- Basic Care and Comfort
- Pharmacological Therapies
- Reduction of Risk Potential
- Physiological Adaptation

After each shift, students receive 3-5 NCLEX questions based on:
- Conditions encountered
- Procedures performed
- Knowledge gaps identified

### Competency Passport

Visual tracker showing:
- Required skills vs. completed
- Clinical hours by specialty
- Simulation completions
- NCLEX readiness score

### Safety Event Tracking

- Near-miss documentation (learning without blame)
- Root cause reflection prompts
- Pattern identification across cohort

### Patient Population Diversity

Ensures students gain experience across:
- Age groups (pediatric → geriatric)
- Acuity levels
- Cultural backgrounds
- Care settings (acute, ambulatory, community)

---

## 8. Data Model Sketch

### Core Entities

```
ClinicalShift (≈ Race)
├── id, studentId, programId
├── facilityId, unitType
├── shiftDate, startTime, endTime
├── preceptorId
├── patients: PatientEncounter[]
├── skills: SkillPerformed[]
├── reflections: ShiftReflection
└── aiAnalysis: ShiftAnalysis

SkillsLab (≈ Practice)
├── id, studentId
├── focusSkills: Skill[]
├── 4Q Framework: What/Who/Why/How
├── simulationId (optional)
├── outcomes: SkillOutcome[]
└── reflections: LabReflection

PatientEncounter
├── diagnosisCategories
├── interventionsPerformed
├── medicationsAdministered
├── educationProvided
├── studentConfidenceRating
└── linkedNCLEXDomains

SkillCompetency
├── skillId, studentId
├── status: learning | practicing | checkoff_ready | competent
├── practiceCount
├── lastPerformed
└── checkoffDate
```

---

## 9. Design Decisions (Confirmed)

| Decision | Choice | Implication |
|----------|--------|-------------|
| **Program Level** | Both BSN & MSN | Flexible competency tracking, role-based features |
| **NCLEX Integration** | Core feature | Every experience maps to NCLEX domains, questions after each shift |
| **System Integration** | Standalone + EHR + Export | Primary standalone app, optional EHR training hooks, portfolio exports |
| **Device Context** | Mobile + Laptop equally | Full responsive design, offline capability for clinical sites |

---

## 10. NCLEX-Centered Architecture

Since NCLEX is a **core feature**, the data model centers around NCLEX content areas:

### NCLEX Content Area Mapping

Every clinical experience automatically tags to these 8 NCLEX categories:

| NCLEX Category | Clinical Activities That Map |
|----------------|------------------------------|
| **Management of Care** | Delegation, prioritization, care coordination, advocacy |
| **Safety & Infection Control** | Hand hygiene, isolation, fall prevention, med safety |
| **Health Promotion** | Patient education, disease prevention, lifestyle counseling |
| **Psychosocial Integrity** | Mental health, coping, therapeutic communication, crisis |
| **Basic Care & Comfort** | Hygiene, nutrition, mobility, pain management, rest |
| **Pharmacological Therapies** | Med administration, IV therapy, adverse effects, calculations |
| **Reduction of Risk** | Lab values, complications, pre/post-op care, vital signs |
| **Physiological Adaptation** | Acute illness, chronic conditions, emergency response |

### NCLEX Question Generation Flow

```
Clinical Shift Completed
    ↓
AI analyzes: conditions, meds, procedures, reflections
    ↓
Maps to NCLEX categories
    ↓
Generates 3-5 targeted NCLEX-style questions
    ↓
Student answers (optional but encouraged)
    ↓
Tracks readiness score per category
    ↓
Identifies weak areas → suggests study focus
```

### Competency-to-NCLEX Tracker

Visual dashboard showing:
- Clinical hours logged per specialty
- Skills performed with confidence ratings
- NCLEX category coverage heat map
- Predicted NCLEX readiness score
- Gaps requiring additional clinical exposure

---

## 11. Export & Portfolio Features

### Accreditation-Ready Exports

| Export Type | Content | Format |
|-------------|---------|--------|
| **Clinical Hours Log** | Shifts, facilities, units, hours | PDF, CSV |
| **Competency Checklist** | Skills performed, dates, supervisor sign-off | PDF |
| **Reflection Portfolio** | Selected reflections with AI insights | PDF |
| **NCLEX Readiness Report** | Category scores, question history, trends | PDF |
| **Preceptor Evaluations** | Compiled feedback from all preceptors | PDF |

### Integration Points

- **EHR Training Systems**: Optional webhook to log simulation completions
- **Learning Management Systems**: LTI integration for grade passback
- **Portfolio Platforms**: Export structured data for nursing portfolios

---

## 12. MVP Feature Prioritization

### Phase 1: Core Loop (MVP)
1. **Clinical Shift Card** with 4 phases (Prep → Launch → Care → Reflect)
2. **Basic Checklists** per phase
3. **Structured Reflection** with ratings
4. **NCLEX Question Integration** (3-5 questions post-shift)
5. **Competency Tracker** (skills performed with confidence)

### Phase 2: AI & Insights
6. **AI Shift Analysis** (pattern detection, gap identification)
7. **Personalized Study Recommendations**
8. **Trend Visualization** (progress over time)

### Phase 3: Skills Lab & Practice
9. **Skills Lab Card** with 4Q framework
10. **Simulation Integration**
11. **Checkoff Readiness Indicators**

### Phase 4: Collaboration & Export
12. **Preceptor Feedback Capture**
13. **Portfolio Exports**
14. **Cohort/Peer Features**

---

## 13. Key Adaptations from RegattaFlow

| RegattaFlow Pattern | NurseFlow Adaptation |
|---------------------|----------------------|
| Race phases (days_before → after_race) | Clinical phases (prep → reflect) |
| Weather forecasting | Patient condition research |
| Boat tuning recommendations | Care plan recommendations |
| Tactical frameworks (puff response, etc.) | Clinical reasoning frameworks (ADPIE, SBAR) |
| Post-race AI analysis | Post-shift AI analysis with NCLEX mapping |
| Sailing academy interactives | Skills practice interactives (med calc, ECG, etc.) |
| Equipment carryover | Learning carryover (what to study next) |
| Race results entry | Shift outcomes & patient encounters |
| Course map visualization | Unit/facility familiarity map |
| VHF channel reference | SBAR communication templates |

---

*This plan adapts RegattaFlow's proven race preparation → execution → analysis loop to the nursing clinical education context, where deliberate practice and reflection are equally critical for developing competent practitioners.*

*Target URL: better.at/nursing*
