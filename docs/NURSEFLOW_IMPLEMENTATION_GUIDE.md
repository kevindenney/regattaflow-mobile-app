# NurseFlow Implementation Guide

## Quick Start: Fork & Adapt Approach

This guide walks through forking RegattaFlow to create NurseFlow (better.at/nursing).

---

## Prerequisites

- Node.js 18+
- Git
- Supabase CLI (`npx supabase`)
- Access to RegattaFlow source

---

## Step 1: Run Setup Script

Save this script as `scripts/setup-nurseflow.sh` and run it:

```bash
#!/bin/bash

# NurseFlow Setup Script
# Forks RegattaFlow and performs initial entity renaming

set -e  # Exit on error

# Configuration
SOURCE_DIR="/Users/kdenney/Developer/RegattaFlow/regattaflow-app"
TARGET_DIR="/Users/kdenney/Developer/NurseFlow/nurseflow-app"
APP_NAME="NurseFlow"

echo "🏥 Setting up $APP_NAME..."

# 1. Create target directory
echo "📁 Creating project directory..."
mkdir -p "$(dirname "$TARGET_DIR")"

# 2. Copy codebase (excluding node_modules, .git, etc.)
echo "📋 Copying codebase..."
rsync -av --progress "$SOURCE_DIR/" "$TARGET_DIR/" \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.expo' \
  --exclude 'dist' \
  --exclude '.next' \
  --exclude 'ios' \
  --exclude 'android' \
  --exclude '.env' \
  --exclude '.env.local'

cd "$TARGET_DIR"

# 3. Initialize fresh git repo
echo "🔧 Initializing git..."
git init
git add .
git commit -m "Initial fork from RegattaFlow for NurseFlow"

# 4. Update package.json
echo "📦 Updating package.json..."
sed -i '' 's/"name": "regattaflow-app"/"name": "nurseflow-app"/g' package.json
sed -i '' 's/RegattaFlow/NurseFlow/g' package.json

# 5. Update app.json
echo "📱 Updating app.json..."
sed -i '' 's/RegattaFlow/NurseFlow/g' app.json
sed -i '' 's/regattaflow/nurseflow/g' app.json

# 6. Create .env template
echo "🔐 Creating .env template..."
cat > .env.example << 'EOF'
# NurseFlow Environment Variables

# Supabase (create new project at supabase.com)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Services
EXPO_PUBLIC_ANTHROPIC_API_KEY=your-anthropic-key

# Optional: Google Maps (for clinical site mapping)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
EOF

# 7. Install dependencies
echo "📥 Installing dependencies..."
npm install

echo ""
echo "✅ NurseFlow setup complete!"
echo ""
echo "Next steps:"
echo "  1. cd $TARGET_DIR"
echo "  2. Copy .env.example to .env and fill in values"
echo "  3. Run: npm run rename-entities (see below)"
echo "  4. Create new Supabase project"
echo "  5. Run: npm start"
echo ""
```

---

## Step 2: Entity Renaming

### Renaming Map

| RegattaFlow Term | NurseFlow Term | Context |
|------------------|----------------|---------|
| `Race` | `ClinicalShift` | Main timeline event |
| `race` | `clinicalShift` | Variable/property names |
| `races` | `clinicalShifts` | Plural/collections |
| `Practice` | `SkillsLab` | Practice session |
| `practice` | `skillsLab` | Variable names |
| `Sailor` | `Student` | Primary learner |
| `sailor` | `student` | Variable names |
| `Coach` | `Faculty` | Instructor/mentor |
| `coach` | `faculty` | Variable names |
| `Club` | `Program` | Institution |
| `club` | `program` | Variable names |
| `Boat` | `Specialty` | Area of focus (was boat class) |
| `boat` | `specialty` | Variable names |
| `Venue` | `ClinicalSite` | Location |
| `venue` | `clinicalSite` | Variable names |
| `Regatta` | `Rotation` | Multi-event series |
| `regatta` | `rotation` | Variable names |
| `Fleet` | `Cohort` | Group of learners |
| `fleet` | `cohort` | Variable names |

### Renaming Script

Save as `scripts/rename-entities.mjs`:

```javascript
#!/usr/bin/env node

/**
 * NurseFlow Entity Renaming Script
 *
 * Performs find-and-replace across the codebase to rename
 * sailing terms to nursing terms.
 *
 * Usage: node scripts/rename-entities.mjs [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DRY_RUN = process.argv.includes('--dry-run');

// Renaming pairs: [find, replace]
// Order matters! More specific patterns first.
const REPLACEMENTS = [
  // === DISPLAY TEXT (user-facing strings) ===
  // These use word boundaries and proper casing for UI text

  // Race -> Clinical Shift
  ['Add Race', 'Add Clinical Shift'],
  ['Add New Race', 'Add New Clinical Shift'],
  ['Race Details', 'Shift Details'],
  ['Race Card', 'Shift Card'],
  ['Race Timer', 'Shift Timer'],
  ['Race Morning', 'Shift Morning'],
  ['Race Day', 'Shift Day'],
  ['Post-Race', 'Post-Shift'],
  ['Pre-Race', 'Pre-Shift'],
  ['My Races', 'My Shifts'],
  ['Upcoming Races', 'Upcoming Shifts'],
  ['Past Races', 'Past Shifts'],

  // Practice -> Skills Lab
  ['Add Practice', 'Add Skills Lab'],
  ['Practice Session', 'Skills Lab Session'],
  ['Practice Sessions', 'Skills Lab Sessions'],

  // Sailor -> Student
  ['Sailor Profile', 'Student Profile'],
  ['Sailor Dashboard', 'Student Dashboard'],
  ['My Sailors', 'My Students'],

  // Coach -> Faculty
  ['Coach Profile', 'Faculty Profile'],
  ['Coach Dashboard', 'Faculty Dashboard'],
  ['Find a Coach', 'Find Faculty'],
  ['Coach Matching', 'Faculty Matching'],

  // Club -> Program
  ['Club Dashboard', 'Program Dashboard'],
  ['Club Members', 'Program Students'],
  ['My Club', 'My Program'],
  ['Club Settings', 'Program Settings'],

  // Boat -> Specialty
  ['Boat Class', 'Specialty Area'],
  ['My Boats', 'My Specialties'],
  ['Add Boat', 'Add Specialty'],

  // Venue -> Clinical Site
  ['Venue Details', 'Clinical Site Details'],
  ['Select Venue', 'Select Clinical Site'],
  ['Venue Map', 'Site Map'],

  // Regatta -> Rotation
  ['Regatta', 'Rotation'],
  ['Regattas', 'Rotations'],

  // Fleet -> Cohort
  ['Fleet', 'Cohort'],
  ['Fleets', 'Cohorts'],

  // === CODE IDENTIFIERS ===
  // PascalCase (types, components, classes)
  ['RaceEvent', 'ClinicalShiftEvent'],
  ['RaceCard', 'ShiftCard'],
  ['RaceTimer', 'ShiftTimer'],
  ['RaceDetail', 'ShiftDetail'],
  ['RaceList', 'ShiftList'],
  ['RaceService', 'ShiftService'],
  ['RaceAnalysis', 'ShiftAnalysis'],
  ['PracticeSession', 'SkillsLabSession'],
  ['SailorProfile', 'StudentProfile'],
  ['SailorDashboard', 'StudentDashboard'],
  ['CoachProfile', 'FacultyProfile'],
  ['CoachDashboard', 'FacultyDashboard'],
  ['CoachService', 'FacultyService'],
  ['ClubDashboard', 'ProgramDashboard'],
  ['ClubService', 'ProgramService'],
  ['ClubMember', 'ProgramStudent'],
  ['BoatClass', 'SpecialtyArea'],
  ['VenueService', 'ClinicalSiteService'],
  ['RegattaService', 'RotationService'],
  ['FleetService', 'CohortService'],

  // camelCase (variables, functions, properties)
  ['raceEvent', 'clinicalShiftEvent'],
  ['raceCard', 'shiftCard'],
  ['raceTimer', 'shiftTimer'],
  ['raceDetail', 'shiftDetail'],
  ['raceList', 'shiftList'],
  ['raceService', 'shiftService'],
  ['raceAnalysis', 'shiftAnalysis'],
  ['raceId', 'shiftId'],
  ['raceData', 'shiftData'],
  ['practiceSession', 'skillsLabSession'],
  ['sailorProfile', 'studentProfile'],
  ['sailorId', 'studentId'],
  ['coachProfile', 'facultyProfile'],
  ['coachId', 'facultyId'],
  ['clubId', 'programId'],
  ['clubData', 'programData'],
  ['boatClass', 'specialtyArea'],
  ['boatId', 'specialtyId'],
  ['venueId', 'clinicalSiteId'],
  ['venueData', 'clinicalSiteData'],
  ['regattaId', 'rotationId'],
  ['fleetId', 'cohortId'],

  // snake_case (database columns, API params)
  ['race_event', 'clinical_shift'],
  ['race_id', 'shift_id'],
  ['race_date', 'shift_date'],
  ['race_type', 'shift_type'],
  ['practice_session', 'skills_lab'],
  ['sailor_id', 'student_id'],
  ['sailor_profile', 'student_profile'],
  ['coach_id', 'faculty_id'],
  ['coach_profile', 'faculty_profile'],
  ['club_id', 'program_id'],
  ['club_member', 'program_student'],
  ['boat_class', 'specialty_area'],
  ['boat_id', 'specialty_id'],
  ['venue_id', 'clinical_site_id'],
  ['regatta_id', 'rotation_id'],
  ['fleet_id', 'cohort_id'],

  // === GENERIC TERMS (careful - most specific first) ===
  // Only replace when clearly in sailing context
  // These are done last and more cautiously
];

// File patterns to process
const INCLUDE_PATTERNS = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.js',
  '**/*.jsx',
  '**/*.json',
  '**/*.md',
  '**/*.sql',
];

// Directories to skip
const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  '.expo',
  'dist',
  '.next',
  'ios',
  'android',
];

function getAllFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(item)) {
        getAllFiles(fullPath, files);
      }
    } else {
      const ext = path.extname(item);
      if (['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.sql'].includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let changes = [];

  for (const [find, replace] of REPLACEMENTS) {
    if (content.includes(find)) {
      const count = (content.match(new RegExp(escapeRegex(find), 'g')) || []).length;
      content = content.split(find).join(replace);
      changes.push({ find, replace, count });
    }
  }

  if (content !== originalContent) {
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, content);
    }
    return changes;
  }

  return null;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Main execution
console.log(DRY_RUN ? '🔍 DRY RUN - No files will be modified\n' : '🔧 Renaming entities...\n');

const files = getAllFiles('.');
let totalChanges = 0;
let filesChanged = 0;

for (const file of files) {
  const changes = processFile(file);
  if (changes) {
    filesChanged++;
    console.log(`📝 ${file}`);
    for (const { find, replace, count } of changes) {
      console.log(`   ${find} → ${replace} (${count}x)`);
      totalChanges += count;
    }
  }
}

console.log(`\n✅ Complete!`);
console.log(`   Files changed: ${filesChanged}`);
console.log(`   Total replacements: ${totalChanges}`);

if (DRY_RUN) {
  console.log('\n💡 Run without --dry-run to apply changes');
}
```

### Run the renaming:

```bash
# Preview changes (no files modified)
node scripts/rename-entities.mjs --dry-run

# Apply changes
node scripts/rename-entities.mjs
```

---

## Step 3: Phase Renaming

Update phase constants in `/components/cards/types.ts`:

```typescript
// Before (RegattaFlow)
export type RacePhase = 'days_before' | 'race_morning' | 'on_water' | 'after_race';

// After (NurseFlow)
export type ShiftPhase = 'prep' | 'launch' | 'care' | 'reflect';
```

Update phase content components:
- `DaysBeforeContent.tsx` → `PrepContent.tsx`
- `RaceMorningContent.tsx` → `LaunchContent.tsx`
- `OnWaterContent.tsx` → `CareContent.tsx`
- `AfterRaceContent.tsx` → `ReflectContent.tsx`

---

## Step 4: New Supabase Project

### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project: "nurseflow-prod"
3. Copy URL and anon key to `.env`

### Initial Migration

Create `supabase/migrations/00000000000000_nurseflow_init.sql`:

```sql
-- NurseFlow Initial Schema
-- Adapted from RegattaFlow for nursing education

-- Students (was sailors)
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  program_id UUID,
  cohort_year INTEGER,
  track TEXT CHECK (track IN ('bsn', 'msn', 'dnp', 'accelerated')),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Programs (was clubs)
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('bsn', 'msn', 'dnp', 'certificate')),
  accreditation_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinical Sites (was venues)
CREATE TABLE clinical_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  facility_type TEXT CHECK (facility_type IN ('hospital', 'clinic', 'community', 'long_term_care', 'school', 'home_health')),
  address TEXT,
  capacity INTEGER,
  affiliation_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinical Shifts (was races)
CREATE TABLE clinical_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  clinical_site_id UUID REFERENCES clinical_sites(id),
  rotation_id UUID,
  shift_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  unit_type TEXT,
  preceptor_id UUID,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shift Reflections (was race_results + analysis)
CREATE TABLE shift_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES clinical_shifts(id),
  student_id UUID REFERENCES students(id),

  -- Structured ratings (1-5)
  preparation_rating INTEGER,
  clinical_reasoning_rating INTEGER,
  time_management_rating INTEGER,
  communication_rating INTEGER,
  technical_skills_rating INTEGER,
  patient_safety_rating INTEGER,
  learning_rating INTEGER,
  overall_rating INTEGER,

  -- Narrative
  notes TEXT,
  key_learnings TEXT,
  challenges TEXT,

  -- AI Analysis
  ai_analysis JSONB,
  nclex_categories_touched TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skills Labs (was practice_sessions)
CREATE TABLE skills_labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  scheduled_date DATE,
  duration_minutes INTEGER,
  focus_skills TEXT[],
  status TEXT DEFAULT 'planned',
  reflection_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competency Passport (new for nursing)
CREATE TABLE competency_passport (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  skill_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  category TEXT,
  status TEXT CHECK (status IN ('not_started', 'learning', 'practicing', 'checkoff_ready', 'competent')),
  practice_count INTEGER DEFAULT 0,
  last_practiced TIMESTAMPTZ,
  checkoff_date TIMESTAMPTZ,
  checkoff_evaluator_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, skill_id)
);

-- NCLEX Progress (new for nursing)
CREATE TABLE nclex_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  category TEXT NOT NULL, -- management_of_care, safety_infection_control, etc.
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  readiness_score DECIMAL(5,2),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, category)
);

-- Clinical Hours Log (new for nursing)
CREATE TABLE clinical_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  shift_id UUID REFERENCES clinical_shifts(id),
  rotation_type TEXT, -- med_surg, peds, ob, psych, community, etc.
  hours DECIMAL(4,2),
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Faculty (was coaches)
CREATE TABLE faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  program_id UUID REFERENCES programs(id),
  role TEXT CHECK (role IN ('professor', 'clinical_instructor', 'simulation_facilitator', 'preceptor', 'ta')),
  specializations TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Faculty-Student Assignments
CREATE TABLE faculty_student_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID REFERENCES faculty(id),
  student_id UUID REFERENCES students(id),
  assignment_type TEXT CHECK (assignment_type IN ('clinical_instructor', 'advisor', 'preceptor', 'simulation_facilitator')),
  rotation_id UUID,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_passport ENABLE ROW LEVEL SECURITY;
ALTER TABLE nclex_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_student_assignments ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (students can see their own data)
CREATE POLICY "Students can view own data" ON students FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students can view own shifts" ON clinical_shifts FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
CREATE POLICY "Students can view own reflections" ON shift_reflections FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
CREATE POLICY "Students can insert own reflections" ON shift_reflections FOR INSERT WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
```

### Push to Supabase

```bash
npx supabase db push
```

---

## Step 5: Update Checklists

Replace sailing checklists with nursing checklists.

### File: `lib/checklists/shiftPrepChecklist.ts`

```typescript
export const shiftPrepChecklist = {
  id: 'shift-prep',
  phase: 'prep',
  title: 'Pre-Shift Preparation',
  categories: [
    {
      id: 'patient-research',
      title: 'Patient Research',
      items: [
        { id: 'review-diagnoses', label: 'Review assigned patient diagnoses', critical: true },
        { id: 'study-conditions', label: 'Study unfamiliar conditions/pathophysiology', critical: false },
        { id: 'research-meds', label: 'Research prescribed medications', critical: true },
        { id: 'review-labs', label: 'Review relevant lab values', critical: false },
        { id: 'identify-complications', label: 'Identify potential complications to monitor', critical: false },
      ]
    },
    {
      id: 'care-plan',
      title: 'Care Plan Preparation',
      items: [
        { id: 'nursing-diagnoses', label: 'Draft nursing diagnoses', critical: false },
        { id: 'interventions', label: 'Outline expected interventions', critical: false },
        { id: 'education-needs', label: 'Identify patient education needs', critical: false },
        { id: 'questions', label: 'Prepare questions for preceptor', critical: false },
      ]
    },
    {
      id: 'logistics',
      title: 'Logistics',
      items: [
        { id: 'confirm-site', label: 'Confirm clinical site and unit', critical: true },
        { id: 'equipment', label: 'Prepare equipment (stethoscope, badge, etc.)', critical: true },
        { id: 'parking', label: 'Review parking/access procedures', critical: false },
      ]
    }
  ]
};
```

---

## Step 6: NCLEX Integration

### File: `services/NCLEXService.ts`

```typescript
export const NCLEX_CATEGORIES = [
  { id: 'management_of_care', name: 'Management of Care', weight: 0.17 },
  { id: 'safety_infection_control', name: 'Safety and Infection Control', weight: 0.12 },
  { id: 'health_promotion', name: 'Health Promotion and Maintenance', weight: 0.09 },
  { id: 'psychosocial_integrity', name: 'Psychosocial Integrity', weight: 0.09 },
  { id: 'basic_care_comfort', name: 'Basic Care and Comfort', weight: 0.09 },
  { id: 'pharmacological_therapies', name: 'Pharmacological Therapies', weight: 0.15 },
  { id: 'reduction_of_risk', name: 'Reduction of Risk Potential', weight: 0.12 },
  { id: 'physiological_adaptation', name: 'Physiological Adaptation', weight: 0.14 },
];

export class NCLEXService {
  static mapShiftToCategories(shift: ClinicalShift): string[] {
    // AI-powered mapping of shift activities to NCLEX categories
    // ...
  }

  static async generateQuestions(
    studentId: string,
    categories: string[],
    count: number = 5
  ): Promise<NCLEXQuestion[]> {
    // Generate NCLEX-style questions based on categories
    // ...
  }

  static calculateReadinessScore(studentId: string): Promise<number> {
    // Calculate overall NCLEX readiness based on progress
    // ...
  }
}
```

---

## File Structure After Setup

```
nurseflow-app/
├── app/
│   ├── (auth)/           # Login, signup, onboarding
│   ├── (tabs)/
│   │   ├── index.tsx     # Student dashboard
│   │   ├── shifts.tsx    # Clinical shifts timeline (was races)
│   │   ├── skills-lab.tsx # Skills lab sessions (was practice)
│   │   ├── passport.tsx  # Competency passport
│   │   └── nclex.tsx     # NCLEX prep
│   ├── faculty/          # Faculty dashboard
│   ├── admin/            # Program admin dashboard
│   └── shift/            # Shift detail screens
│
├── components/
│   ├── cards/            # Timeline card components
│   │   ├── content/
│   │   │   └── phases/   # Phase content (prep, launch, care, reflect)
│   │   └── ShiftCard.tsx # Main shift card
│   ├── checklist-tools/  # Checklists and wizards
│   ├── dashboard/
│   │   ├── student/      # Student dashboard components
│   │   ├── faculty/      # Faculty dashboard components
│   │   └── admin/        # Admin dashboard components
│   └── nclex/            # NCLEX integration components
│
├── services/
│   ├── ShiftService.ts   # Clinical shift operations
│   ├── NCLEXService.ts   # NCLEX question generation
│   ├── CompetencyService.ts # Skill tracking
│   └── ai/
│       └── ShiftAnalysisService.ts # AI post-shift analysis
│
├── lib/
│   └── checklists/       # Nursing checklists by phase
│
├── supabase/
│   └── migrations/       # Database migrations
│
├── docs/
│   ├── NURSEFLOW_COMPLETE_CONCEPT.md
│   └── NURSEFLOW_IMPLEMENTATION_GUIDE.md (this file)
│
└── scripts/
    ├── setup-nurseflow.sh
    └── rename-entities.mjs
```

---

## Verification Checklist

After setup, verify:

- [ ] App builds without errors (`npm run typecheck`)
- [ ] Can start dev server (`npm start`)
- [ ] Entity names updated in UI
- [ ] New Supabase project connected
- [ ] Migrations applied successfully
- [ ] Can create a test student account
- [ ] Can add a clinical shift
- [ ] Checklists display nursing content
- [ ] Phase transitions work (prep → launch → care → reflect)

---

## Next Steps After Setup

1. **Week 1**: Complete entity renaming, basic UI adaptation
2. **Week 2**: NCLEX integration, nursing checklists
3. **Week 3**: Faculty dashboard, evaluation forms
4. **Week 4**: Testing, polish, deploy to better.at/nursing

---

## Reference Documents

- `docs/NURSEFLOW_COMPLETE_CONCEPT.md` - Full concept with all personas
- `docs/NURSEFLOW_STUDENT_CONCEPT.md` - Student experience deep dive
- `docs/NURSEFLOW_FACULTY_ADMIN_CONCEPT.md` - Faculty/Admin deep dive

---

*This guide enables forking RegattaFlow to create NurseFlow with minimal friction while preserving the core architecture that makes the app effective.*
