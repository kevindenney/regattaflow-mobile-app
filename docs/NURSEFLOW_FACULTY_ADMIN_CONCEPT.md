# NurseFlow: Faculty & Program Admin Personas

## Mapping RegattaFlow Personas to Nursing Education

| RegattaFlow | NurseFlow | Primary Users |
|-------------|-----------|---------------|
| **Yacht Club** | **Nursing Program / College** | Program Directors, Deans, Admin Staff |
| **Coach** | **Faculty / Clinical Instructor** | Professors, Preceptors, TAs, Simulation Instructors |
| **Sailor** | **Student** | BSN/MSN students |

---

# PART 1: NURSING PROGRAM ADMIN (≈ Yacht Club)

## Overview

The Nursing Program Admin manages the institutional side: cohorts, clinical placements, competency tracking across all students, accreditation compliance, and program analytics.

---

## 1. Program Admin Dashboard

### Key Performance Indicators (KPIs)

| RegattaFlow Club KPI | NurseFlow Program KPI |
|----------------------|----------------------|
| Total Members | Active Students (by cohort) |
| Active Events | Active Clinical Rotations |
| Monthly Revenue | Clinical Hours Logged This Month |
| Facility Utilization | Clinical Site Utilization |
| Upcoming Events | Upcoming Checkoffs/Simulations |
| New Members | New Admits This Semester |

### Additional Program KPIs
- **NCLEX Pass Rate** (predicted and historical)
- **Competency Completion Rate** (skills checkoffs on track)
- **At-Risk Students** (flagged for intervention)
- **Clinical Site Capacity** vs Demand
- **Preceptor Availability**
- **Accreditation Metrics** (AACN Essentials coverage)

### Dashboard Sections

```
Program Dashboard
├── Cohort Overview (students by year, track, status)
├── Clinical Rotation Status (current placements)
├── Competency Tracker (program-wide skill completion)
├── At-Risk Alerts (students needing intervention)
├── NCLEX Readiness (cohort prediction scores)
├── Upcoming Events (simulations, checkoffs, exams)
├── Faculty Workload (student assignments per instructor)
└── Quick Actions
```

### Quick Actions
- Schedule Simulation
- Assign Clinical Placements
- View Competency Reports
- Generate Accreditation Report
- Message Cohort

---

## 2. Student Cohort Management (≈ Member Management)

### Student Lifecycle States

| State | Description |
|-------|-------------|
| **Admitted** | Accepted to program, not yet started |
| **Active** | Currently enrolled and progressing |
| **Clinical** | In clinical rotation phase |
| **At-Risk** | Flagged for academic/clinical concerns |
| **Leave** | Temporary leave of absence |
| **Graduated** | Completed program |
| **Withdrawn** | Left program before completion |

### Student Profile Data

```typescript
interface StudentProfile {
  id: string;
  programId: string;
  cohortYear: number;
  track: 'bsn' | 'msn' | 'dnp' | 'accelerated';
  status: StudentStatus;

  // Academic
  gpa: number;
  coursesCompleted: Course[];
  currentCourses: Course[];

  // Clinical
  clinicalHoursRequired: number;
  clinicalHoursCompleted: number;
  currentPlacement?: ClinicalPlacement;
  placementHistory: ClinicalPlacement[];

  // Competencies
  skillsRequired: Skill[];
  skillsCompleted: SkillCompetency[];
  skillsPending: Skill[];

  // NCLEX
  nclexReadinessScore: number;
  nclexCategoryScores: NCLEXCategoryScore[];

  // Flags
  atRiskFlags: AtRiskFlag[];
  accommodations: Accommodation[];
  advisorId: string;
}
```

### Bulk Operations
- Export cohort data (CSV, PDF)
- Mass email by cohort/status/placement
- Clinical placement batch assignment
- Competency report generation
- FERPA-compliant data sharing

---

## 3. Clinical Placement Management (≈ Event/Race Management)

### Clinical Site Management

```typescript
interface ClinicalSite {
  id: string;
  facilityName: string;
  facilityType: 'hospital' | 'clinic' | 'community' | 'long_term_care' | 'school' | 'home_health';
  address: string;
  units: ClinicalUnit[];

  // Capacity
  maxStudentsPerUnit: number;
  maxStudentsTotal: number;
  currentStudents: number;

  // Contacts
  clinicalCoordinator: Contact;
  preceptors: Preceptor[];

  // Requirements
  onboardingRequirements: Requirement[];
  backgroundCheckRequired: boolean;
  drugScreenRequired: boolean;
  immunizationRequirements: string[];

  // Status
  affiliationStatus: 'active' | 'pending' | 'expired';
  affiliationExpiry: Date;
}
```

### Clinical Rotation Scheduling

| RegattaFlow Event | NurseFlow Clinical |
|-------------------|-------------------|
| Create Event | Schedule Rotation |
| Event Type | Rotation Type (med-surg, peds, OB, psych, community) |
| Registration Open/Close | Placement Request Period |
| Max Participants | Student Capacity |
| Entry Fee | N/A (or clinical fee tracking) |

### Rotation Workflow

```
1. Program creates rotation slots
   ↓
2. Students request preferences
   ↓
3. Algorithm/admin assigns placements
   ↓
4. Students complete site onboarding
   ↓
5. Rotation begins → Active tracking
   ↓
6. Rotation ends → Evaluation collection
   ↓
7. Hours verified → Competencies updated
```

### Rotation Types & Requirements

| Rotation | Hours Required | Skills Focus | Typical Semester |
|----------|---------------|--------------|------------------|
| Fundamentals | 90 | Basic care, vitals, hygiene | 1 |
| Med-Surg I | 135 | Adult medical care | 2 |
| Med-Surg II | 135 | Complex adult care | 3 |
| Pediatrics | 90 | Child/adolescent care | 3 |
| OB/Maternity | 90 | Maternal-newborn | 3 |
| Psych/Mental Health | 90 | Psychiatric nursing | 4 |
| Community/Public Health | 90 | Population health | 4 |
| Leadership/Preceptorship | 180 | Independent practice | 5 |

---

## 4. Competency & Skills Tracking (≈ Results Management)

### Program-Wide Competency Dashboard

```
Competency Overview
├── By Cohort
│   ├── 2024 Cohort: 87% on track
│   ├── 2025 Cohort: 92% on track
│   └── 2026 Cohort: 78% on track (flagged)
│
├── By Skill Category
│   ├── Assessment Skills: 94% completion
│   ├── Medication Administration: 88% completion
│   ├── IV Therapy: 72% completion (bottleneck)
│   ├── Wound Care: 85% completion
│   └── Emergency Response: 91% completion
│
├── Checkoff Schedule
│   ├── Upcoming checkoffs this week
│   ├── Overdue checkoffs (students behind)
│   └── Faculty availability for checkoffs
│
└── Export Options
    ├── Individual student competency reports
    ├── Cohort completion matrix
    └── Accreditation-ready documentation
```

### Skills Checkoff Scheduling

Similar to RegattaFlow's race check-in system:
- Faculty availability slots
- Student sign-up for checkoff times
- Real-time check-in/completion tracking
- Pass/remediation workflow
- Automatic competency passport update

---

## 5. Simulation Lab Management

### Simulation Scheduling (≈ Race Day Management)

```typescript
interface SimulationSession {
  id: string;
  title: string;
  scenarioType: 'high_fidelity' | 'low_fidelity' | 'standardized_patient' | 'virtual';

  // Scheduling
  date: Date;
  duration: number; // minutes
  labRoom: string;

  // Participants
  maxStudents: number;
  enrolledStudents: Student[];
  facilitators: Faculty[];

  // Scenario
  scenarioId: string;
  learningObjectives: string[];
  prerequisiteSkills: Skill[];
  nclexCategories: NCLEXCategory[];

  // Status
  status: 'scheduled' | 'in_progress' | 'debriefing' | 'completed';
}
```

### Simulation Workflow

```
Pre-Simulation (≈ Race Prep)
├── Student receives scenario brief
├── Reviews relevant content
├── Completes pre-sim quiz
└── Arrives prepared

Simulation (≈ Race)
├── Facilitator runs scenario
├── Real-time performance capture
├── Critical action tracking
└── Time-stamped events

Debriefing (≈ Review)
├── Structured reflection (Gibbs cycle)
├── Peer feedback
├── Facilitator evaluation
├── AI analysis of performance
└── Learning points documented
```

---

## 6. Accreditation & Compliance (≈ Results Export)

### Export Types

| Export | Content | Use Case |
|--------|---------|----------|
| Clinical Hours Report | All students, all rotations | CCNE/ACEN accreditation |
| Competency Matrix | Skills by student by semester | Program review |
| NCLEX Readiness Report | Predicted pass rates by cohort | Board reporting |
| Preceptor Evaluation Summary | Aggregated site feedback | Clinical site review |
| Curriculum Mapping | Courses → AACN Essentials | Accreditation self-study |
| Student Outcome Report | Graduation, employment, NCLEX rates | Institutional effectiveness |

### Compliance Tracking

- Student immunization status
- Background check expiry
- CPR certification currency
- Clinical site affiliation agreements
- HIPAA training completion
- Mandatory reporter training

---

## 7. Program Admin User Flow

```
Program Admin Journey

1. Login → Program Dashboard
   ↓
2. Review KPIs
   ├── At-risk students requiring attention
   ├── Clinical capacity vs. demand
   ├── Upcoming simulation/checkoff schedule
   └── NCLEX readiness trends
   ↓
3. Daily Tasks
   ├── Process clinical placement requests
   ├── Review flagged student concerns
   ├── Coordinate with clinical sites
   ├── Schedule faculty for checkoffs
   └── Generate reports as needed
   ↓
4. Periodic Tasks
   ├── Cohort progression review
   ├── Clinical site evaluation
   ├── Accreditation documentation
   └── Curriculum assessment
```

---

# PART 2: FACULTY / CLINICAL INSTRUCTOR (≈ Coach)

## Overview

Faculty members supervise students in clinical settings, conduct skills checkoffs, facilitate simulations, and provide formative feedback. They are the "coaches" of nursing education.

---

## 1. Faculty Dashboard

### Key Performance Indicators

| RegattaFlow Coach KPI | NurseFlow Faculty KPI |
|-----------------------|----------------------|
| Active Clients | Assigned Students |
| Sessions This Month | Clinical Hours Supervised |
| Monthly Earnings | N/A (or adjunct pay tracking) |
| Client Retention | Student Progression Rate |
| Average Rating | Student Evaluation Scores |
| Marketplace Views | N/A |

### Additional Faculty KPIs
- **Students On Track** (competencies current)
- **Students At Risk** (needing intervention)
- **Pending Evaluations** (forms to complete)
- **Checkoffs Scheduled** (this week)
- **Simulation Sessions** (upcoming)

### Dashboard Sections

```
Faculty Dashboard
├── My Students (assigned clinical group)
├── Today's Schedule (clinical, checkoffs, simulations)
├── Pending Actions
│   ├── Evaluations to complete
│   ├── Competency sign-offs needed
│   └── Student concerns to address
├── Student Performance Overview
│   ├── On track vs. at risk
│   ├── Recent shift reflections
│   └── Skill progression
├── Quick Actions
│   ├── Schedule Checkoff
│   ├── Complete Evaluation
│   ├── Flag Student Concern
│   └── Send Cohort Message
└── AI Insights (patterns across students)
```

---

## 2. Student Supervision (≈ Client Management)

### Assigned Students View

```typescript
interface AssignedStudent {
  student: StudentProfile;
  assignmentType: 'clinical_instructor' | 'advisor' | 'preceptor' | 'simulation_facilitator';

  // Current Status
  currentRotation?: ClinicalRotation;
  clinicalHoursThisRotation: number;
  clinicalHoursRemaining: number;

  // Performance
  overallProgress: 'on_track' | 'needs_attention' | 'at_risk';
  recentReflectionQuality: number; // AI-scored
  skillsCompletedThisRotation: number;
  pendingCompetencies: Skill[];

  // Interactions
  lastShiftObserved: Date;
  lastFeedbackGiven: Date;
  upcomingCheckoffs: SkillCheckoff[];

  // Concerns
  activeFlags: StudentFlag[];
  interventionPlan?: InterventionPlan;
}
```

### Student Card (Faculty View)

```
┌─────────────────────────────────────────┐
│ Sarah Chen                    BSN '25   │
│ Med-Surg II @ City Hospital             │
├─────────────────────────────────────────┤
│ Hours: 68/135 (50%)          ████░░░░░░ │
│ Skills: 12/18 complete       ██████░░░░ │
│ NCLEX Readiness: 72%         ███████░░░ │
├─────────────────────────────────────────┤
│ Last Shift: Jan 10 - "Complex CHF pt"   │
│ Reflection Quality: ★★★★☆              │
│ Areas of strength: Assessment, patient  │
│   communication                         │
│ Growth areas: Time management, IV       │
│   therapy confidence                    │
├─────────────────────────────────────────┤
│ [View Details] [Complete Eval] [Message]│
└─────────────────────────────────────────┘
```

### Bulk Student Actions
- View all assigned students
- Filter by rotation, status, risk level
- Sort by hours remaining, checkoffs due, last contact
- Batch evaluation completion
- Cohort messaging

---

## 3. Clinical Evaluation (≈ Session Feedback)

### Formative Evaluation (Ongoing)

After each clinical shift observed:

```typescript
interface ClinicalObservation {
  id: string;
  studentId: string;
  facultyId: string;
  shiftDate: Date;

  // Performance Ratings (1-5 scale)
  ratings: {
    preparation: number;
    clinicalJudgment: number;
    patientSafety: number;
    communication: number;
    professionalism: number;
    documentation: number;
    skillExecution: number;
  };

  // Narrative
  strengths: string;
  areasForGrowth: string;
  specificIncidents: CriticalIncident[];

  // Alignment Check
  studentReflectionId?: string; // Link to student's self-reflection
  alignmentNotes: string; // Where faculty and student perceptions differ

  // Follow-up
  learningGoalsSet: string[];
  nextShiftFocus: string;
  requiresFollowUp: boolean;
}
```

### Summative Evaluation (End of Rotation)

```typescript
interface RotationEvaluation {
  id: string;
  studentId: string;
  rotationId: string;
  evaluatorId: string;

  // Overall Assessment
  overallGrade: 'pass' | 'pass_with_concerns' | 'fail' | 'incomplete';

  // AACN Essentials Mapping
  essentialsAssessment: {
    essential: AACNEssential;
    competencyLevel: 'not_met' | 'developing' | 'meets' | 'exceeds';
    evidence: string;
  }[];

  // Clinical Judgment
  clinicalJudgmentLevel: 'novice' | 'advanced_beginner' | 'competent' | 'proficient';

  // Narrative
  summaryStatement: string;
  recommendationsForNextRotation: string;

  // Signatures
  facultySignature: Date;
  studentSignature?: Date;
  studentResponse?: string; // Student can respond to evaluation
}
```

---

## 4. Skills Checkoff (≈ Session Management)

### Checkoff Scheduling

Faculty can:
- Set availability windows for checkoffs
- Students sign up for slots
- View pending checkoff requests
- Confirm/reschedule appointments

### Checkoff Execution

```typescript
interface SkillCheckoff {
  id: string;
  studentId: string;
  evaluatorId: string;
  skillId: string;

  // Scheduling
  scheduledTime: Date;
  location: string;

  // Evaluation
  status: 'scheduled' | 'in_progress' | 'passed' | 'needs_remediation' | 'cancelled';

  // Checklist Items
  criticalSteps: {
    step: string;
    isCritical: boolean; // Auto-fail if missed
    completed: boolean;
    notes?: string;
  }[];

  // Outcome
  attemptNumber: number;
  passedOn: Date | null;
  remediationPlan?: string;
  nextAttemptDate?: Date;

  // Competency Update
  competencyUnlocked: boolean;
}
```

### Checkoff Results Flow

```
Student Attempts Skill
    ↓
Faculty Evaluates (checklist + observation)
    ↓
├── PASS → Competency added to passport
│         → Student notified
│         → Hours logged (if applicable)
│
└── NEEDS REMEDIATION
          → Specific feedback provided
          → Remediation plan created
          → Practice resources assigned
          → Next attempt scheduled
```

---

## 5. AI-Powered Faculty Tools (≈ AI Coaching Services)

### AI Analysis of Student Performance

Similar to RegattaFlow's Race Coaching Service, but for nursing:

```typescript
interface StudentPerformanceAnalysis {
  studentId: string;
  analysisDate: Date;

  // Pattern Detection (across multiple shifts)
  patterns: {
    strengths: string[];
    consistentChallenges: string[];
    improvementTrends: string[];
    regressionAreas: string[];
  };

  // Clinical Reasoning Assessment
  clinicalReasoningScore: number; // Based on reflection quality
  reasoningPatterns: {
    assessmentSkills: number;
    diagnosisAccuracy: number;
    interventionSelection: number;
    evaluationCompleteness: number;
  };

  // NCLEX Readiness Factors
  nclexStrengths: NCLEXCategory[];
  nclexWeaknesses: NCLEXCategory[];
  recommendedFocus: string[];

  // Comparison to Cohort
  cohortPercentile: number;
  aheadOfPeersIn: string[];
  behindPeersIn: string[];

  // Recommendations for Faculty
  suggestedInterventions: string[];
  assignedLearningResources: LearningResource[];
  checkoffReadiness: { [skillId: string]: boolean };
}
```

### AI-Generated Feedback Suggestions

When faculty completes an observation, AI suggests:
- Specific, actionable feedback based on ratings
- Learning resources aligned to growth areas
- NCLEX questions relevant to patient conditions seen
- Comparison to student's self-reflection (alignment check)

### Early Warning System

AI flags students who show:
- Declining reflection quality over time
- Repeated struggles with same skill areas
- Lower-than-expected NCLEX quiz performance
- Attendance or professionalism concerns
- Misalignment between self-perception and faculty observation

---

## 6. Simulation Facilitation (≈ Race Day Coaching)

### Facilitator Role

```typescript
interface SimulationFacilitation {
  sessionId: string;
  facilitatorId: string;

  // Real-Time During Simulation
  criticalActionsObserved: {
    action: string;
    timestamp: Date;
    performedCorrectly: boolean;
    notes: string;
  }[];

  // Communication Assessment
  sbarQuality: number;
  teamCommunication: number;
  patientCommunication: number;

  // Clinical Judgment
  prioritizationAccuracy: number;
  interventionTimeliness: number;
  safetyAwareness: number;

  // Debriefing Notes
  debriefingPoints: string[];
  studentInsights: string[]; // What students identified
  teachableMoments: string[];

  // Outcome
  overallPerformance: 'below_expectations' | 'meets_expectations' | 'exceeds_expectations';
  followUpRequired: boolean;
}
```

### Debriefing Framework (Gibbs Reflective Cycle)

```
Structured Debrief Flow
├── Description: "What happened?"
├── Feelings: "What were you thinking/feeling?"
├── Evaluation: "What was good/bad?"
├── Analysis: "What sense can you make of it?"
├── Conclusion: "What else could you have done?"
└── Action Plan: "What will you do next time?"
```

---

## 7. Faculty User Flow

```
Faculty Journey

1. Login → Faculty Dashboard
   ↓
2. Review Today's Schedule
   ├── Clinical supervision (which students, which unit)
   ├── Scheduled checkoffs
   ├── Simulation facilitation
   └── Office hours / advising
   ↓
3. During Clinical Day
   ├── Monitor student activities
   ├── Provide real-time feedback
   ├── Complete brief observation notes
   ├── Sign off on skills as performed
   └── Flag concerns as they arise
   ↓
4. Post-Clinical
   ├── Complete formal observations/evaluations
   ├── Review student reflections (AI-highlighted insights)
   ├── Set learning goals for next shift
   └── Update competency records
   ↓
5. Periodic Tasks
   ├── Complete summative evaluations (end of rotation)
   ├── Meet with at-risk students
   ├── Participate in cohort progression meetings
   └── Review AI insights across assigned students
```

---

## 8. Preceptor Portal (External Clinical Instructors)

### Simplified Interface for Hospital Preceptors

Since preceptors are busy RNs, they get a minimal interface:

```
Preceptor Quick Actions
├── [✓] Student completed shift satisfactorily
├── [!] Flag a concern (opens brief form)
├── [★] Highlight a strength (quick note)
└── [📝] Add detailed note (optional)

Weekly Summary Email
├── Hours verified for each student
├── Concerns flagged
├── Strengths observed
└── One-click confirmation
```

### Preceptor Evaluation (End of Rotation)

Simple rating form (not comprehensive like faculty):
- Professional behavior
- Clinical competence
- Initiative/engagement
- Communication skills
- Overall recommendation
- Narrative comments (optional)

---

# PART 3: MULTI-PERSONA INTEGRATION

## How the Personas Connect

```
                    ┌─────────────────────┐
                    │   Program Admin     │
                    │  (Institutional)    │
                    └─────────┬───────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
    │   Faculty   │    │  Preceptor  │    │    Site     │
    │ (Internal)  │    │ (External)  │    │ Coordinator │
    └──────┬──────┘    └──────┬──────┘    └─────────────┘
           │                  │
           └────────┬─────────┘
                    │
                    ▼
             ┌─────────────┐
             │   Student   │
             │ (Learner)   │
             └─────────────┘
```

## Data Flow

```
Student completes Clinical Shift
    │
    ├─→ Student enters reflection (NurseFlow app)
    │       │
    │       └─→ AI analyzes reflection quality
    │           AI suggests NCLEX questions
    │           AI identifies knowledge gaps
    │
    ├─→ Preceptor confirms hours (Preceptor portal)
    │       │
    │       └─→ Hours verified → Competency progress updated
    │
    ├─→ Faculty reviews reflection + preceptor notes
    │       │
    │       ├─→ AI highlights alignment/misalignment
    │       ├─→ Faculty completes observation form
    │       └─→ Competency sign-offs as appropriate
    │
    └─→ Program Admin sees aggregated data
            │
            ├─→ Student progress in cohort context
            ├─→ At-risk flags for intervention
            ├─→ Clinical site utilization metrics
            └─→ Accreditation compliance status
```

## Shared Features Across Personas

| Feature | Student | Faculty | Admin |
|---------|---------|---------|-------|
| View student progress | Own only | Assigned students | All students |
| Complete reflections | ✓ | Read student reflections | Aggregate analytics |
| Clinical hours | View own | Verify for students | Report all |
| Competency tracking | Own passport | Sign off skills | Program-wide |
| NCLEX questions | Answer | Assign additional | View readiness |
| Scheduling | Request placements | Set checkoff availability | Manage all scheduling |
| Messaging | To faculty/peers | To students/admin | To all |
| AI insights | Personal recommendations | Per-student analysis | Cohort patterns |

---

# PART 4: DATA MODEL SUMMARY

## Core Entities

```
NursingProgram (≈ Club)
├── programId, name, type (BSN, MSN, DNP)
├── accreditationStatus
├── clinicalSites: ClinicalSite[]
├── faculty: Faculty[]
├── students: Student[]
├── cohorts: Cohort[]
└── competencyRequirements: Skill[]

Faculty (≈ Coach)
├── facultyId, userId
├── role: 'professor' | 'clinical_instructor' | 'simulation_facilitator' | 'preceptor'
├── assignedStudents: AssignedStudent[]
├── availability: AvailabilitySlot[]
├── evaluationsCompleted: Evaluation[]
└── specializations: string[]

Student (≈ Sailor)
├── studentId, userId
├── programId, cohortYear, track
├── clinicalHours: ClinicalHoursLog
├── competencyPassport: SkillCompetency[]
├── shifts: ClinicalShift[]
├── reflections: ShiftReflection[]
├── nclexProgress: NCLEXProgress
└── advisorId, preceptorId

ClinicalShift (≈ Race)
├── shiftId, studentId
├── siteId, unitType
├── date, startTime, endTime
├── preceptorId
├── patientEncounters: PatientEncounter[]
├── skillsPerformed: Skill[]
├── reflection: ShiftReflection
├── facultyObservation?: FacultyObservation
└── aiAnalysis: ShiftAnalysis

ClinicalSite (≈ Venue)
├── siteId, name, type
├── units: Unit[]
├── capacity
├── preceptors: Preceptor[]
├── affiliationStatus
└── requirements: Requirement[]
```

---

## App Structure: better.at/nursing

```
better.at/nursing
├── /student          ← Student app (main user flow)
│   ├── Dashboard
│   ├── Clinical Shifts (timeline)
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
│   ├── My Students
│   ├── Quick Feedback
│   ├── Hours Verification
│   └── Evaluation Form
│
└── /admin            ← Program administration
    ├── Dashboard
    ├── Students (all cohorts)
    ├── Clinical Placements
    ├── Competency Tracking
    ├── Simulations
    ├── Reports
    └── Settings
```

---

## MVP Prioritization (Faculty/Admin Features)

### Phase 1: Core Faculty Tools
1. Faculty dashboard with assigned students
2. Student progress view (hours, competencies, reflections)
3. Basic observation/evaluation forms
4. Checkoff scheduling and completion

### Phase 2: AI Enhancement
5. AI analysis of student reflections
6. Early warning system for at-risk students
7. Feedback suggestion engine
8. NCLEX readiness insights per student

### Phase 3: Program Admin
9. Admin dashboard with cohort KPIs
10. Clinical placement management
11. Competency tracking across program
12. Basic reporting/exports

### Phase 4: Advanced Features
13. Simulation scheduling and facilitation tools
14. Preceptor portal
15. Accreditation reporting
16. Advanced analytics

---

*This document extends the NurseFlow concept to include faculty and administrative personas, enabling a complete nursing education platform at better.at/nursing*
