#!/usr/bin/env node

/**
 * ============================================================================
 * NurseFlow Entity Renaming Script
 * ============================================================================
 *
 * Performs find-and-replace across the codebase to rename sailing terms
 * to nursing terms.
 *
 * Usage:
 *   node scripts/rename-entities.mjs --dry-run    # Preview changes
 *   node scripts/rename-entities.mjs              # Apply changes
 *   node scripts/rename-entities.mjs --verbose    # Show all changes
 *
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse arguments
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

/**
 * Renaming pairs: [find, replace]
 *
 * Order matters! More specific patterns should come first to avoid
 * partial replacements (e.g., "RaceCard" before "Race").
 */
const REPLACEMENTS = [
  // =========================================================================
  // DISPLAY TEXT (user-facing strings in UI)
  // =========================================================================

  // Race -> Clinical Shift
  ['Add Next Race', 'Add Clinical Shift'],
  ['Add New Race', 'Add Clinical Shift'],
  ['Add Race', 'Add Clinical Shift'],
  ['Race Details', 'Shift Details'],
  ['Race Preparation', 'Shift Preparation'],
  ['Race Analysis', 'Shift Analysis'],
  ['Race Strategy', 'Shift Strategy'],
  ['Race Card', 'Shift Card'],
  ['Race Timer', 'Shift Timer'],
  ['Race Morning', 'Shift Morning'],
  ['Race Day', 'Shift Day'],
  ['Post-Race', 'Post-Shift'],
  ['Pre-Race', 'Pre-Shift'],
  ['My Races', 'My Shifts'],
  ['Upcoming Races', 'Upcoming Shifts'],
  ['Past Races', 'Past Shifts'],
  ['No races', 'No shifts'],
  ['race briefing', 'shift briefing'],

  // Practice -> Skills Lab
  ['Add Practice Session', 'Add Skills Lab'],
  ['Add Practice', 'Add Skills Lab'],
  ['Practice Session', 'Skills Lab'],
  ['Practice Sessions', 'Skills Labs'],
  ['My Practice', 'My Skills Labs'],

  // Sailor -> Student
  ['Sailor Profile', 'Student Profile'],
  ['Sailor Dashboard', 'Student Dashboard'],
  ['Sailor Overview', 'Student Overview'],
  ['My Sailors', 'My Students'],
  ['for sailors', 'for students'],
  ['As a sailor', 'As a student'],

  // Coach -> Faculty
  ['Coach Profile', 'Faculty Profile'],
  ['Coach Dashboard', 'Faculty Dashboard'],
  ['Coach Overview', 'Faculty Overview'],
  ['Find a Coach', 'Find Faculty'],
  ['Coach Matching', 'Faculty Assignment'],
  ['My Coaches', 'My Faculty'],
  ['coaching session', 'supervision session'],

  // Club -> Program
  ['Club Dashboard', 'Program Dashboard'],
  ['Club Overview', 'Program Overview'],
  ['Club Members', 'Program Students'],
  ['Club Settings', 'Program Settings'],
  ['My Club', 'My Program'],
  ['Join a Club', 'Join a Program'],
  ['yacht club', 'nursing program'],
  ['Yacht Club', 'Nursing Program'],
  ['sailing club', 'nursing program'],

  // Boat -> Specialty (careful with this one)
  ['Boat Class', 'Specialty Area'],
  ['boat class', 'specialty area'],
  ['My Boats', 'My Specialties'],
  ['Add Boat', 'Add Specialty'],
  ['boat tuning', 'clinical focus'],

  // Venue -> Clinical Site
  ['Venue Details', 'Clinical Site Details'],
  ['Select Venue', 'Select Clinical Site'],
  ['venue location', 'clinical site location'],
  ['Venue Map', 'Site Map'],
  ['racing venue', 'clinical site'],

  // Regatta -> Rotation
  ['Regatta Series', 'Rotation Schedule'],
  ['regatta', 'rotation'],
  ['Regatta', 'Rotation'],

  // Fleet -> Cohort
  ['Fleet Analysis', 'Cohort Analysis'],
  ['fleet', 'cohort'],
  ['Fleet', 'Cohort'],

  // Sailing-specific terms
  ['wind conditions', 'patient conditions'],
  ['weather forecast', 'shift preparation'],
  ['tide times', 'schedule times'],
  ['course map', 'unit map'],
  ['mark rounding', 'procedure steps'],
  ['start line', 'shift start'],
  ['finish line', 'shift end'],
  ['VHF channel', 'communication protocol'],

  // =========================================================================
  // CODE IDENTIFIERS - PascalCase (types, components, classes)
  // =========================================================================

  // Race-related
  ['RaceEventService', 'ShiftEventService'],
  ['RaceWeatherService', 'ShiftConditionsService'],
  ['RaceCoachingService', 'ShiftFacultyService'],
  ['RaceAnalysisAgent', 'ShiftAnalysisAgent'],
  ['RaceExtractionAgent', 'ShiftExtractionAgent'],
  ['RacePreparation', 'ShiftPreparation'],
  ['RaceTimerService', 'ShiftTimerService'],
  ['RaceChecklistService', 'ShiftChecklistService'],
  ['RaceDataUtils', 'ShiftDataUtils'],
  ['RaceSelection', 'ShiftSelection'],
  ['RaceResults', 'ShiftResults'],
  ['RaceEvent', 'ClinicalShift'],
  ['RaceCard', 'ShiftCard'],
  ['RaceTimer', 'ShiftTimer'],
  ['RaceDetail', 'ShiftDetail'],
  ['RaceList', 'ShiftList'],
  ['RaceService', 'ShiftService'],
  ['RaceAnalysis', 'ShiftAnalysis'],
  ['RacePhase', 'ShiftPhase'],
  ['RaceType', 'ShiftType'],
  ['RaceData', 'ShiftData'],

  // Practice-related
  ['PracticeSession', 'SkillsLabSession'],
  ['PracticeService', 'SkillsLabService'],
  ['PracticeTemplate', 'SkillsLabTemplate'],

  // Sailor-related
  ['SailorProfile', 'StudentProfile'],
  ['SailorDashboard', 'StudentDashboard'],
  ['SailorOverview', 'StudentOverview'],
  ['SailorService', 'StudentService'],
  ['SailorBoatService', 'StudentSpecialtyService'],
  ['SailorRacePreparation', 'StudentShiftPreparation'],

  // Coach-related
  ['CoachProfile', 'FacultyProfile'],
  ['CoachDashboard', 'FacultyDashboard'],
  ['CoachOverview', 'FacultyOverview'],
  ['CoachService', 'FacultyService'],
  ['CoachingSession', 'SupervisionSession'],
  ['CoachingClient', 'FacultyStudent'],
  ['AICoachMatchingService', 'AIFacultyAssignmentService'],
  ['AICoachingAssistant', 'AIFacultyAssistant'],
  ['AISessionPlanningService', 'AISupervisionPlanningService'],

  // Club-related
  ['ClubDashboard', 'ProgramDashboard'],
  ['ClubOverview', 'ProgramOverview'],
  ['ClubService', 'ProgramService'],
  ['ClubMember', 'ProgramStudent'],
  ['ClubMemberService', 'ProgramStudentService'],
  ['ClubOnboarding', 'ProgramOnboarding'],

  // Boat-related
  ['BoatClass', 'SpecialtyArea'],
  ['BoatService', 'SpecialtyService'],

  // Venue-related
  ['VenueService', 'ClinicalSiteService'],
  ['VenueIntelligence', 'SiteIntelligence'],
  ['VenueInsights', 'SiteInsights'],

  // Regatta-related
  ['RegattaService', 'RotationService'],

  // Fleet-related
  ['FleetService', 'CohortService'],
  ['FleetAnalysis', 'CohortAnalysis'],

  // =========================================================================
  // CODE IDENTIFIERS - camelCase (variables, functions, properties)
  // =========================================================================

  // Race-related
  ['raceEvent', 'clinicalShift'],
  ['raceCard', 'shiftCard'],
  ['raceTimer', 'shiftTimer'],
  ['raceDetail', 'shiftDetail'],
  ['raceList', 'shiftList'],
  ['raceService', 'shiftService'],
  ['raceAnalysis', 'shiftAnalysis'],
  ['racePhase', 'shiftPhase'],
  ['raceType', 'shiftType'],
  ['raceData', 'shiftData'],
  ['raceId', 'shiftId'],
  ['raceDate', 'shiftDate'],
  ['raceResults', 'shiftResults'],
  ['racePreparation', 'shiftPreparation'],
  ['useRace', 'useShift'],
  ['getRace', 'getShift'],
  ['addRace', 'addShift'],
  ['editRace', 'editShift'],
  ['deleteRace', 'deleteShift'],

  // Practice-related
  ['practiceSession', 'skillsLabSession'],
  ['practiceService', 'skillsLabService'],
  ['usePractice', 'useSkillsLab'],

  // Sailor-related
  ['sailorProfile', 'studentProfile'],
  ['sailorId', 'studentId'],
  ['sailorData', 'studentData'],
  ['useSailor', 'useStudent'],

  // Coach-related
  ['coachProfile', 'facultyProfile'],
  ['coachId', 'facultyId'],
  ['coachData', 'facultyData'],
  ['coachingSession', 'supervisionSession'],
  ['useCoach', 'useFaculty'],

  // Club-related
  ['clubId', 'programId'],
  ['clubData', 'programData'],
  ['clubMember', 'programStudent'],
  ['useClub', 'useProgram'],

  // Boat-related
  ['boatClass', 'specialtyArea'],
  ['boatId', 'specialtyId'],
  ['useBoat', 'useSpecialty'],

  // Venue-related
  ['venueId', 'clinicalSiteId'],
  ['venueData', 'clinicalSiteData'],
  ['useVenue', 'useClinicalSite'],

  // Regatta-related
  ['regattaId', 'rotationId'],
  ['regattaData', 'rotationData'],
  ['useRegatta', 'useRotation'],

  // Fleet-related
  ['fleetId', 'cohortId'],
  ['fleetData', 'cohortData'],
  ['useFleet', 'useCohort'],

  // =========================================================================
  // CODE IDENTIFIERS - snake_case (database columns, API params)
  // =========================================================================

  ['race_event', 'clinical_shift'],
  ['race_id', 'shift_id'],
  ['race_date', 'shift_date'],
  ['race_type', 'shift_type'],
  ['race_series', 'rotation_schedule'],
  ['race_results', 'shift_results'],
  ['race_entries', 'shift_entries'],

  ['practice_session', 'skills_lab'],
  ['practice_sessions', 'skills_labs'],

  ['sailor_id', 'student_id'],
  ['sailor_profile', 'student_profile'],
  ['sailor_boats', 'student_specialties'],

  ['coach_id', 'faculty_id'],
  ['coach_profile', 'faculty_profile'],
  ['coaching_session', 'supervision_session'],
  ['coaching_sessions', 'supervision_sessions'],
  ['coaching_clients', 'faculty_students'],

  ['club_id', 'program_id'],
  ['club_member', 'program_student'],
  ['club_members', 'program_students'],

  ['boat_class', 'specialty_area'],
  ['boat_classes', 'specialty_areas'],
  ['boat_id', 'specialty_id'],

  ['venue_id', 'clinical_site_id'],
  ['venues', 'clinical_sites'],

  ['regatta_id', 'rotation_id'],
  ['regattas', 'rotations'],

  ['fleet_id', 'cohort_id'],
  ['fleets', 'cohorts'],

  // =========================================================================
  // PHASE NAMES
  // =========================================================================

  ['days_before', 'prep'],
  ['race_morning', 'launch'],
  ['on_water', 'care'],
  ['after_race', 'reflect'],

  ['DaysBeforeContent', 'PrepContent'],
  ['RaceMorningContent', 'LaunchContent'],
  ['OnWaterContent', 'CareContent'],
  ['AfterRaceContent', 'ReflectContent'],
];

// Directories to skip
const EXCLUDE_DIRS = new Set([
  'node_modules',
  '.git',
  '.expo',
  'dist',
  '.next',
  'ios',
  'android',
  'coverage',
  '.turbo',
  '__pycache__',
]);

// File extensions to process
const INCLUDE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.sql',
  '.mdx',
]);

// Files to skip
const EXCLUDE_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
]);

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dir, files = []) {
  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);

      try {
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!EXCLUDE_DIRS.has(item)) {
            getAllFiles(fullPath, files);
          }
        } else {
          const ext = path.extname(item);
          if (INCLUDE_EXTENSIONS.has(ext) && !EXCLUDE_FILES.has(item)) {
            files.push(fullPath);
          }
        }
      } catch (err) {
        // Skip files we can't access
      }
    }
  } catch (err) {
    // Skip directories we can't access
  }

  return files;
}

/**
 * Escape special regex characters
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Process a single file
 */
function processFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return null;
  }

  const originalContent = content;
  const changes = [];

  for (const [find, replace] of REPLACEMENTS) {
    if (content.includes(find)) {
      const regex = new RegExp(escapeRegex(find), 'g');
      const matches = content.match(regex);
      const count = matches ? matches.length : 0;

      if (count > 0) {
        content = content.split(find).join(replace);
        changes.push({ find, replace, count });
      }
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

/**
 * Format file path for display
 */
function formatPath(filePath) {
  const cwd = process.cwd();
  if (filePath.startsWith(cwd)) {
    return filePath.slice(cwd.length + 1);
  }
  return filePath;
}

// ============================================================================
// Main Execution
// ============================================================================

console.log('');
console.log(`${colors.blue}╔══════════════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.blue}║           NurseFlow Entity Renaming Script                       ║${colors.reset}`);
console.log(`${colors.blue}╚══════════════════════════════════════════════════════════════════╝${colors.reset}`);
console.log('');

if (DRY_RUN) {
  console.log(`${colors.yellow}DRY RUN - No files will be modified${colors.reset}`);
  console.log('');
}

console.log(`${colors.cyan}Scanning files...${colors.reset}`);

const projectRoot = path.resolve(__dirname, '..');
const files = getAllFiles(projectRoot);

console.log(`Found ${files.length} files to process`);
console.log('');

let totalChanges = 0;
let filesChanged = 0;
const summary = {};

for (const file of files) {
  const changes = processFile(file);

  if (changes && changes.length > 0) {
    filesChanged++;
    const displayPath = formatPath(file);

    if (VERBOSE || filesChanged <= 20) {
      console.log(`${colors.green}✓${colors.reset} ${displayPath}`);

      for (const { find, replace, count } of changes) {
        console.log(`  ${colors.dim}${find}${colors.reset} → ${colors.cyan}${replace}${colors.reset} (${count}x)`);
        totalChanges += count;

        // Track summary
        const key = `${find} → ${replace}`;
        summary[key] = (summary[key] || 0) + count;
      }
    } else {
      // Just count without printing every file
      for (const { find, replace, count } of changes) {
        totalChanges += count;
        const key = `${find} → ${replace}`;
        summary[key] = (summary[key] || 0) + count;
      }
    }
  }
}

if (filesChanged > 20 && !VERBOSE) {
  console.log(`${colors.dim}... and ${filesChanged - 20} more files${colors.reset}`);
}

// Print summary
console.log('');
console.log(`${colors.blue}═══════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.green}Summary${colors.reset}`);
console.log(`${colors.blue}═══════════════════════════════════════════════════════════════════${colors.reset}`);
console.log('');
console.log(`  Files processed:  ${files.length}`);
console.log(`  Files changed:    ${filesChanged}`);
console.log(`  Total replacements: ${totalChanges}`);
console.log('');

if (VERBOSE && Object.keys(summary).length > 0) {
  console.log(`${colors.cyan}Top replacements:${colors.reset}`);
  const sortedSummary = Object.entries(summary)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  for (const [replacement, count] of sortedSummary) {
    console.log(`  ${count.toString().padStart(4)}x  ${replacement}`);
  }
  console.log('');
}

if (DRY_RUN) {
  console.log(`${colors.yellow}This was a dry run. No files were modified.${colors.reset}`);
  console.log(`Run without --dry-run to apply changes.`);
} else {
  console.log(`${colors.green}Done! Entity renaming complete.${colors.reset}`);
}

console.log('');
