#!/usr/bin/env node

/**
 * Johns Hopkins School of Nursing Demo Seed
 * ------------------------------------------
 * Populates a realistic nursing institution demo:
 *   - 1 organization (JHU School of Nursing)
 *   - 30 students, 4 preceptors, 2 faculty (1 dean/admin)
 *   - 1 cohort with all students
 *   - 50 AACN competency definitions
 *   - Competency progress with realistic distribution
 *   - Attempt history with preceptor validations
 *   - Faculty reviews for competent-status rows
 *   - Timeline steps (clinical shifts, skills labs, simulations)
 *
 * Run:  node scripts/seed-jhu-nursing-demo.mjs
 * Requires: EXPO_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + DEMO_PASSWORD in .env
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createHash, randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_PASSWORD = process.env.DEMO_PASSWORD;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!DEMO_PASSWORD) {
  console.error('❌ DEMO_PASSWORD environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const log = {
  info: (msg, ...args) => console.log(`🏥 ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`⚠️  ${msg}`, ...args),
  error: (msg, ...args) => console.error(`❌ ${msg}`, ...args),
  success: (msg, ...args) => console.log(`✅ ${msg}`, ...args),
};

// ---------------------------------------------------------------------------
// Deterministic UUID helper
// ---------------------------------------------------------------------------
const deterministicUuid = (namespace, value) => {
  const hash = createHash('sha1').update(`jhu-nursing:${namespace}:${value}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ORG_ID = deterministicUuid('org', 'jhu-nursing');
const COHORT_ID = deterministicUuid('cohort', 'bsn-2027-a');
const INTEREST_SLUG = 'nursing';

// 50 AACN competencies (must match configs/competencies/nursing-core-v1.ts)
const NURSING_CAPABILITIES = [
  { id: 'nurs-kp-clinical-reasoning-foundations', domain: 'knowledge-for-nursing-practice', title: 'Clinical Reasoning Foundations', cat: 'Knowledge for Nursing Practice' },
  { id: 'nurs-kp-prioritization-frameworks', domain: 'knowledge-for-nursing-practice', title: 'Prioritization Frameworks', cat: 'Knowledge for Nursing Practice' },
  { id: 'nurs-kp-medication-knowledge-application', domain: 'knowledge-for-nursing-practice', title: 'Medication Knowledge Application', cat: 'Knowledge for Nursing Practice' },
  { id: 'nurs-kp-lab-and-diagnostic-interpretation', domain: 'knowledge-for-nursing-practice', title: 'Lab and Diagnostic Interpretation', cat: 'Knowledge for Nursing Practice' },
  { id: 'nurs-kp-evidence-to-bedside-linkage', domain: 'knowledge-for-nursing-practice', title: 'Evidence-to-Bedside Linkage', cat: 'Knowledge for Nursing Practice' },
  { id: 'nurs-pcc-therapeutic-communication', domain: 'person-centered-care', title: 'Therapeutic Communication', cat: 'Person-Centered Care' },
  { id: 'nurs-pcc-shared-decision-support', domain: 'person-centered-care', title: 'Shared Decision Support', cat: 'Person-Centered Care' },
  { id: 'nurs-pcc-teach-back-education', domain: 'person-centered-care', title: 'Teach-Back Education', cat: 'Person-Centered Care' },
  { id: 'nurs-pcc-cultural-humility-in-care', domain: 'person-centered-care', title: 'Cultural Humility in Care', cat: 'Person-Centered Care' },
  { id: 'nurs-pcc-family-care-partnership', domain: 'person-centered-care', title: 'Family Care Partnership', cat: 'Person-Centered Care' },
  { id: 'nurs-ph-risk-screening-and-referral', domain: 'population-health', title: 'Risk Screening and Referral', cat: 'Population Health' },
  { id: 'nurs-ph-health-equity-awareness', domain: 'population-health', title: 'Health Equity Awareness', cat: 'Population Health' },
  { id: 'nurs-ph-prevention-and-health-promotion', domain: 'population-health', title: 'Prevention and Health Promotion', cat: 'Population Health' },
  { id: 'nurs-ph-transition-of-care-planning', domain: 'population-health', title: 'Transition of Care Planning', cat: 'Population Health' },
  { id: 'nurs-ph-community-resource-navigation', domain: 'population-health', title: 'Community Resource Navigation', cat: 'Population Health' },
  { id: 'nurs-sch-clinical-question-formulation', domain: 'scholarship-for-the-nursing-discipline', title: 'Clinical Question Formulation', cat: 'Scholarship for the Nursing Discipline' },
  { id: 'nurs-sch-evidence-appraisal-basics', domain: 'scholarship-for-the-nursing-discipline', title: 'Evidence Appraisal Basics', cat: 'Scholarship for the Nursing Discipline' },
  { id: 'nurs-sch-reflective-practice-depth', domain: 'scholarship-for-the-nursing-discipline', title: 'Reflective Practice Depth', cat: 'Scholarship for the Nursing Discipline' },
  { id: 'nurs-sch-learning-goal-planning', domain: 'scholarship-for-the-nursing-discipline', title: 'Learning Goal Planning', cat: 'Scholarship for the Nursing Discipline' },
  { id: 'nurs-sch-practice-change-rationale', domain: 'scholarship-for-the-nursing-discipline', title: 'Practice Change Rationale', cat: 'Scholarship for the Nursing Discipline' },
  { id: 'nurs-qs-patient-safety-vigilance', domain: 'quality-and-safety', title: 'Patient Safety Vigilance', cat: 'Quality and Safety' },
  { id: 'nurs-qs-medication-safety-practices', domain: 'quality-and-safety', title: 'Medication Safety Practices', cat: 'Quality and Safety' },
  { id: 'nurs-qs-infection-prevention-consistency', domain: 'quality-and-safety', title: 'Infection Prevention Consistency', cat: 'Quality and Safety' },
  { id: 'nurs-qs-near-miss-reporting', domain: 'quality-and-safety', title: 'Near-Miss Reporting', cat: 'Quality and Safety' },
  { id: 'nurs-qs-improvement-cycle-participation', domain: 'quality-and-safety', title: 'Improvement Cycle Participation', cat: 'Quality and Safety' },
  { id: 'nurs-ip-sbar-handoff-clarity', domain: 'interprofessional-partnerships', title: 'SBAR Handoff Clarity', cat: 'Interprofessional Partnerships' },
  { id: 'nurs-ip-closed-loop-communication', domain: 'interprofessional-partnerships', title: 'Closed-Loop Communication', cat: 'Interprofessional Partnerships' },
  { id: 'nurs-ip-team-role-awareness', domain: 'interprofessional-partnerships', title: 'Team Role Awareness', cat: 'Interprofessional Partnerships' },
  { id: 'nurs-ip-conflict-management', domain: 'interprofessional-partnerships', title: 'Conflict Management', cat: 'Interprofessional Partnerships' },
  { id: 'nurs-ip-interprofessional-care-planning', domain: 'interprofessional-partnerships', title: 'Interprofessional Care Planning', cat: 'Interprofessional Partnerships' },
  { id: 'nurs-sbp-workflow-and-throughput-awareness', domain: 'systems-based-practice', title: 'Workflow and Throughput Awareness', cat: 'Systems-Based Practice' },
  { id: 'nurs-sbp-policy-and-protocol-adherence', domain: 'systems-based-practice', title: 'Policy and Protocol Adherence', cat: 'Systems-Based Practice' },
  { id: 'nurs-sbp-escalation-and-chain-of-command', domain: 'systems-based-practice', title: 'Escalation and Chain of Command', cat: 'Systems-Based Practice' },
  { id: 'nurs-sbp-resource-stewardship', domain: 'systems-based-practice', title: 'Resource Stewardship', cat: 'Systems-Based Practice' },
  { id: 'nurs-sbp-documentation-for-continuity', domain: 'systems-based-practice', title: 'Documentation for Continuity', cat: 'Systems-Based Practice' },
  { id: 'nurs-inf-ehr-documentation-quality', domain: 'informatics-and-healthcare-technologies', title: 'EHR Documentation Quality', cat: 'Informatics and Healthcare Technologies' },
  { id: 'nurs-inf-data-trend-recognition', domain: 'informatics-and-healthcare-technologies', title: 'Data Trend Recognition', cat: 'Informatics and Healthcare Technologies' },
  { id: 'nurs-inf-clinical-decision-support-use', domain: 'informatics-and-healthcare-technologies', title: 'Clinical Decision Support Use', cat: 'Informatics and Healthcare Technologies' },
  { id: 'nurs-inf-digital-professional-communication', domain: 'informatics-and-healthcare-technologies', title: 'Digital Professional Communication', cat: 'Informatics and Healthcare Technologies' },
  { id: 'nurs-inf-information-privacy-security', domain: 'informatics-and-healthcare-technologies', title: 'Information Privacy and Security', cat: 'Informatics and Healthcare Technologies' },
  { id: 'nurs-pro-ethical-practice-judgment', domain: 'professionalism', title: 'Ethical Practice Judgment', cat: 'Professionalism' },
  { id: 'nurs-pro-accountability-and-follow-through', domain: 'professionalism', title: 'Accountability and Follow-Through', cat: 'Professionalism' },
  { id: 'nurs-pro-boundaries-and-therapeutic-use-of-self', domain: 'professionalism', title: 'Boundaries and Therapeutic Use of Self', cat: 'Professionalism' },
  { id: 'nurs-pro-advocacy-for-patient-needs', domain: 'professionalism', title: 'Advocacy for Patient Needs', cat: 'Professionalism' },
  { id: 'nurs-pro-inclusive-and-respectful-practice', domain: 'professionalism', title: 'Inclusive and Respectful Practice', cat: 'Professionalism' },
  { id: 'nurs-lpd-self-assessment-accuracy', domain: 'personal-professional-and-leadership-development', title: 'Self-Assessment Accuracy', cat: 'Personal, Professional, and Leadership Development' },
  { id: 'nurs-lpd-resilience-and-stress-management', domain: 'personal-professional-and-leadership-development', title: 'Resilience and Stress Management', cat: 'Personal, Professional, and Leadership Development' },
  { id: 'nurs-lpd-feedback-integration', domain: 'personal-professional-and-leadership-development', title: 'Feedback Integration', cat: 'Personal, Professional, and Leadership Development' },
  { id: 'nurs-lpd-leadership-in-micro-moments', domain: 'personal-professional-and-leadership-development', title: 'Leadership in Micro-Moments', cat: 'Personal, Professional, and Leadership Development' },
  { id: 'nurs-lpd-career-readiness-planning', domain: 'personal-professional-and-leadership-development', title: 'Career Readiness Planning', cat: 'Personal, Professional, and Leadership Development' },
];

// ---------------------------------------------------------------------------
// Demo Users
// ---------------------------------------------------------------------------
const STUDENTS = [
  { first: 'Emily', last: 'Rodriguez' }, { first: 'Aiden', last: 'Chen' },
  { first: 'Sofia', last: 'Patel' }, { first: 'Marcus', last: 'Johnson' },
  { first: 'Olivia', last: 'Kim' }, { first: 'Ethan', last: 'Williams' },
  { first: 'Isabella', last: 'Nguyen' }, { first: 'Noah', last: 'Brown' },
  { first: 'Mia', last: 'Davis' }, { first: 'Liam', last: 'Garcia' },
  { first: 'Ava', last: 'Martinez' }, { first: 'Jackson', last: 'Lee' },
  { first: 'Charlotte', last: 'Thomas' }, { first: 'Lucas', last: 'Taylor' },
  { first: 'Amelia', last: 'Moore' }, { first: 'Mason', last: 'Anderson' },
  { first: 'Harper', last: 'Jackson' }, { first: 'Logan', last: 'White' },
  { first: 'Ella', last: 'Harris' }, { first: 'James', last: 'Clark' },
  { first: 'Lily', last: 'Lewis' }, { first: 'Benjamin', last: 'Robinson' },
  { first: 'Grace', last: 'Walker' }, { first: 'Henry', last: 'Hall' },
  { first: 'Chloe', last: 'Allen' }, { first: 'Alexander', last: 'Young' },
  { first: 'Zoe', last: 'King' }, { first: 'Daniel', last: 'Wright' },
  { first: 'Nora', last: 'Scott' }, { first: 'Sebastian', last: 'Adams' },
];

const PRECEPTORS = [
  { first: 'Sarah', last: 'Chen', unit: 'Med-Surg' },
  { first: 'Michael', last: 'Torres', unit: 'ICU' },
  { first: 'Jennifer', last: 'Park', unit: 'Emergency' },
  { first: 'David', last: 'Okafor', unit: 'Pediatrics' },
];

const FACULTY = [
  { first: 'Patricia', last: 'Morrison', role: 'admin', title: 'Dean' },
  { first: 'Robert', last: 'Huang', role: 'faculty', title: 'Clinical Faculty' },
];

// Student performance tiers
const TIERS = {
  high:       { count: 5,  validatedMin: 0.75, validatedMax: 0.90, label: 'High Performer' },
  onTrack:    { count: 10, validatedMin: 0.45, validatedMax: 0.65, label: 'On Track' },
  developing: { count: 10, validatedMin: 0.25, validatedMax: 0.45, label: 'Developing' },
  atRisk:     { count: 5,  validatedMin: 0.08, validatedMax: 0.25, label: 'At Risk' },
};

// Status distribution probabilities by tier
const STATUS_WEIGHTS = {
  high:       { competent: 0.25, validated: 0.50, checkoff_ready: 0.10, practicing: 0.10, learning: 0.05, not_started: 0.00 },
  onTrack:    { competent: 0.05, validated: 0.40, checkoff_ready: 0.15, practicing: 0.20, learning: 0.15, not_started: 0.05 },
  developing: { competent: 0.00, validated: 0.15, checkoff_ready: 0.15, practicing: 0.25, learning: 0.30, not_started: 0.15 },
  atRisk:     { competent: 0.00, validated: 0.05, checkoff_ready: 0.05, practicing: 0.15, learning: 0.30, not_started: 0.45 },
};

// Clinical contexts for attempts
const CLINICAL_CONTEXTS = [
  'Med-Surg floor, 4 patients', 'ICU, 2 patients with ventilators',
  'Emergency department, 8-hour shift', 'Pediatric unit, school-age patients',
  'OB/Labor & Delivery rotation', 'Community health clinic',
  'Skills lab simulation', 'High-fidelity Code Blue simulation',
  'Psychiatric unit, group therapy day', 'Rehab facility, post-surgical patients',
  'PACU recovery, post-anesthesia monitoring', 'Wound care clinic rotation',
];

const SELF_RATINGS = ['needs_practice', 'developing', 'proficient', 'confident'];
const PRECEPTOR_RATINGS = ['needs_improvement', 'satisfactory', 'satisfactory', 'excellent']; // weighted toward satisfactory

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeEmail(first, last, suffix = 'jhu-demo.edu') {
  return `${first.toLowerCase()}.${last.toLowerCase()}@${suffix}`;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function randomDaysAgo(minDays, maxDays) {
  return daysAgo(Math.floor(Math.random() * (maxDays - minDays)) + minDays);
}

// Map status to number of attempts (rough)
function attemptsForStatus(status) {
  switch (status) {
    case 'not_started': return 0;
    case 'learning': return Math.floor(Math.random() * 2) + 1; // 1-2
    case 'practicing': return Math.floor(Math.random() * 3) + 2; // 2-4
    case 'checkoff_ready': return Math.floor(Math.random() * 3) + 3; // 3-5
    case 'validated': return Math.floor(Math.random() * 4) + 4; // 4-7
    case 'competent': return Math.floor(Math.random() * 3) + 5; // 5-7
    default: return 0;
  }
}

function selfRatingForStatus(status) {
  switch (status) {
    case 'learning': return pickRandom(['needs_practice', 'developing']);
    case 'practicing': return pickRandom(['developing', 'proficient']);
    case 'checkoff_ready': return pickRandom(['proficient', 'confident']);
    case 'validated': return pickRandom(['proficient', 'confident']);
    case 'competent': return 'confident';
    default: return 'needs_practice';
  }
}

function preceptorRatingForStatus(status) {
  switch (status) {
    case 'validated': return pickRandom(['satisfactory', 'excellent']);
    case 'competent': return pickRandom(['satisfactory', 'excellent', 'excellent']);
    case 'checkoff_ready': return pickRandom(['satisfactory', 'satisfactory', 'needs_improvement']);
    default: return null;
  }
}

// ---------------------------------------------------------------------------
// 1. Create or find auth users
// ---------------------------------------------------------------------------
async function ensureUser(email, fullName, metadata = {}) {
  // Check if user already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing?.id) {
    log.info(`  ↳ User exists: ${email}`);
    return existing.id;
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, ...metadata },
  });

  if (authError) {
    // If already exists in auth but not in users table
    if (authError.message?.includes('already been registered')) {
      const { data: listData } = await supabase.auth.admin.listUsers();
      const found = listData?.users?.find(u => u.email === email);
      if (found) {
        log.info(`  ↳ Auth user exists: ${email}`);
        return found.id;
      }
    }
    throw new Error(`Failed to create user ${email}: ${authError.message}`);
  }

  log.info(`  ↳ Created user: ${email}`);
  return authData.user.id;
}

// ---------------------------------------------------------------------------
// 2. Seed organization
// ---------------------------------------------------------------------------
async function seedOrganization() {
  log.info('Creating JHU School of Nursing organization...');

  const { error } = await supabase
    .from('organizations')
    .upsert({
      id: ORG_ID,
      name: 'Johns Hopkins School of Nursing',
      organization_type: 'institution',
      join_mode: 'invite_only',
      interest_slug: 'nursing',
      metadata: {
        workspace_domain: 'nursing',
        institution_type: 'university',
        programs: ['BSN', 'MSN', 'DNP', 'CNL'],
        description: 'Johns Hopkins School of Nursing - BSN, MSN, DNP programs',
      },
    }, { onConflict: 'id' });

  if (error) throw new Error(`Org upsert failed: ${error.message}`);
  log.success('Organization created');
}

// ---------------------------------------------------------------------------
// 3. Seed users and memberships
// ---------------------------------------------------------------------------
async function seedUsers() {
  log.info('Creating demo users...');
  const userIds = { students: [], preceptors: [], faculty: [] };

  // Students
  for (const s of STUDENTS) {
    const email = makeEmail(s.first, s.last);
    const id = await ensureUser(email, `${s.first} ${s.last}`, { user_type: 'student' });
    userIds.students.push({ id, ...s });

    await supabase.from('organization_memberships').upsert({
      id: deterministicUuid('membership', email),
      organization_id: ORG_ID,
      user_id: id,
      role: 'member',
      membership_status: 'active',
    }, { onConflict: 'id' });
  }

  // Preceptors
  for (const p of PRECEPTORS) {
    const email = makeEmail(p.first, p.last, 'jhu-hospital-demo.edu');
    const id = await ensureUser(email, `${p.first} ${p.last}`, { user_type: 'preceptor' });
    userIds.preceptors.push({ id, ...p });

    await supabase.from('organization_memberships').upsert({
      id: deterministicUuid('membership', email),
      organization_id: ORG_ID,
      user_id: id,
      role: 'preceptor',
      membership_status: 'active',
    }, { onConflict: 'id' });
  }

  // Faculty
  for (const f of FACULTY) {
    const email = makeEmail(f.first, f.last, 'jhu-faculty-demo.edu');
    const id = await ensureUser(email, `${f.first} ${f.last}`, { user_type: 'faculty', title: f.title });
    userIds.faculty.push({ id, ...f });

    await supabase.from('organization_memberships').upsert({
      id: deterministicUuid('membership', email),
      organization_id: ORG_ID,
      user_id: id,
      role: f.role,
      membership_status: 'active',
    }, { onConflict: 'id' });
  }

  log.success(`Created ${STUDENTS.length} students, ${PRECEPTORS.length} preceptors, ${FACULTY.length} faculty`);
  return userIds;
}

// ---------------------------------------------------------------------------
// 4. Seed cohort
// ---------------------------------------------------------------------------
async function seedCohort(studentIds) {
  log.info('Creating BSN cohort...');

  await supabase.from('betterat_org_cohorts').upsert({
    id: COHORT_ID,
    org_id: ORG_ID,
    name: 'BSN Class of 2027 — Cohort A',
    description: 'Spring 2026 clinical rotation cohort, 30 BSN students',
    interest_slug: INTEREST_SLUG,
  }, { onConflict: 'id' });

  // Add all students to cohort
  const members = studentIds.map(s => ({
    id: deterministicUuid('cohort-member', s.id),
    cohort_id: COHORT_ID,
    user_id: s.id,
  }));

  const { error } = await supabase
    .from('betterat_org_cohort_members')
    .upsert(members, { onConflict: 'id' });

  if (error) log.warn(`Cohort member upsert: ${error.message}`);
  log.success(`Cohort created with ${studentIds.length} members`);
}

// ---------------------------------------------------------------------------
// 5. Seed competency definitions (find existing or create for a shared interest)
// ---------------------------------------------------------------------------
async function seedCompetencies() {
  log.info('Seeding competency definitions...');

  // Find or create a nursing interest to attach competencies to
  // First check if competencies already exist for this org
  const { data: existingComps } = await supabase
    .from('betterat_competencies')
    .select('id, title')
    .eq('organization_id', ORG_ID)
    .limit(1);

  if (existingComps && existingComps.length > 0) {
    log.info('  ↳ Competencies already exist for this org, fetching...');
    const { data: allComps } = await supabase
      .from('betterat_competencies')
      .select('id, title')
      .eq('organization_id', ORG_ID);
    return allComps;
  }

  // We need an interest_id. Look for any nursing interest or use a placeholder.
  // The competencies table requires an interest_id. We'll look for an existing
  // nursing interest or create entries with a deterministic interest_id.
  // Use the existing nursing interest in the database
  const INTEREST_ID = 'bec249c5-6412-4d16-bb84-bfcfb887ff67';

  const competencyRows = NURSING_CAPABILITIES.map((cap, idx) => ({
    id: deterministicUuid('competency', cap.id),
    interest_id: INTEREST_ID,
    organization_id: ORG_ID,
    category: cap.cat,
    competency_number: idx + 1,
    title: cap.title,
    description: `AACN Domain: ${cap.cat}`,
    requires_supervision: idx < 25, // First 25 require supervision
    sort_order: idx + 1,
  }));

  const { error } = await supabase
    .from('betterat_competencies')
    .upsert(competencyRows, { onConflict: 'id' });

  if (error) throw new Error(`Competency upsert failed: ${error.message}`);

  log.success(`Seeded ${competencyRows.length} competencies`);
  return competencyRows.map(r => ({ id: r.id, title: r.title }));
}

// ---------------------------------------------------------------------------
// 6. Seed competency progress, attempts, and reviews
// ---------------------------------------------------------------------------
async function seedCompetencyData(userIds, competencies) {
  log.info('Seeding competency progress and attempts...');

  const allProgress = [];
  const allAttempts = [];
  const allReviews = [];

  // Assign tiers to students
  const tieredStudents = [];
  let idx = 0;
  for (const [tierKey, tier] of Object.entries(TIERS)) {
    for (let i = 0; i < tier.count; i++) {
      tieredStudents.push({ ...userIds.students[idx], tier: tierKey });
      idx++;
    }
  }

  for (const student of tieredStudents) {
    const weights = STATUS_WEIGHTS[student.tier];

    for (const comp of competencies) {
      const status = weightedPick(weights);
      if (status === 'not_started') continue; // Skip — no progress row needed

      const numAttempts = attemptsForStatus(status);
      const progressId = deterministicUuid('progress', `${student.id}:${comp.id}`);

      // Determine validation info
      const isValidated = ['validated', 'competent'].includes(status);
      const preceptor = pickRandom(userIds.preceptors);
      const faculty = pickRandom(userIds.faculty);

      allProgress.push({
        id: progressId,
        user_id: student.id,
        competency_id: comp.id,
        status,
        attempts_count: numAttempts,
        last_attempt_at: randomDaysAgo(1, 14),
        validated_by: isValidated ? preceptor.id : null,
        validated_at: isValidated ? randomDaysAgo(1, 21) : null,
        approved_by: status === 'competent' ? faculty.id : null,
        approved_at: status === 'competent' ? randomDaysAgo(1, 14) : null,
        notes: null,
      });

      // Create attempts spread over 12 weeks
      for (let a = 0; a < numAttempts; a++) {
        const attemptDaysAgo = Math.floor((12 * 7) * ((numAttempts - a) / numAttempts)) + Math.floor(Math.random() * 5);
        const attemptPreceptor = pickRandom(userIds.preceptors);
        const isLaterAttempt = a >= numAttempts - 2; // Last 2 attempts might have preceptor rating

        allAttempts.push({
          id: deterministicUuid('attempt', `${student.id}:${comp.id}:${a}`),
          user_id: student.id,
          competency_id: comp.id,
          event_id: null,
          attempt_number: a + 1,
          self_rating: selfRatingForStatus(status),
          self_notes: a === numAttempts - 1 ? `Attempt ${a + 1} — feeling more confident with this skill` : null,
          preceptor_id: attemptPreceptor.id,
          preceptor_rating: (isValidated && isLaterAttempt) ? preceptorRatingForStatus(status) : null,
          preceptor_notes: (isValidated && isLaterAttempt) ? 'Good progress, continue practicing' : null,
          preceptor_reviewed_at: (isValidated && isLaterAttempt) ? randomDaysAgo(1, 21) : null,
          clinical_context: pickRandom(CLINICAL_CONTEXTS),
          created_at: daysAgo(attemptDaysAgo),
        });
      }

      // Faculty review for competent status
      if (status === 'competent') {
        allReviews.push({
          id: deterministicUuid('review', `${student.id}:${comp.id}`),
          progress_id: progressId,
          reviewer_id: faculty.id,
          decision: 'approved',
          notes: 'Student has demonstrated consistent competency across multiple clinical settings.',
          created_at: randomDaysAgo(1, 14),
        });
      }
    }
  }

  // Batch insert progress
  log.info(`  Inserting ${allProgress.length} progress rows...`);
  for (let i = 0; i < allProgress.length; i += 100) {
    const batch = allProgress.slice(i, i + 100);
    const { error } = await supabase
      .from('betterat_competency_progress')
      .upsert(batch, { onConflict: 'id' });
    if (error) log.warn(`  Progress batch ${i}: ${error.message}`);
  }

  // Batch insert attempts
  log.info(`  Inserting ${allAttempts.length} attempt rows...`);
  for (let i = 0; i < allAttempts.length; i += 100) {
    const batch = allAttempts.slice(i, i + 100);
    const { error } = await supabase
      .from('betterat_competency_attempts')
      .upsert(batch, { onConflict: 'id' });
    if (error) log.warn(`  Attempts batch ${i}: ${error.message}`);
  }

  // Insert reviews
  log.info(`  Inserting ${allReviews.length} review rows...`);
  if (allReviews.length > 0) {
    const { error } = await supabase
      .from('betterat_competency_reviews')
      .upsert(allReviews, { onConflict: 'id' });
    if (error) log.warn(`  Reviews: ${error.message}`);
  }

  log.success(`Seeded ${allProgress.length} progress, ${allAttempts.length} attempts, ${allReviews.length} reviews`);
}

// ---------------------------------------------------------------------------
// 7. Seed timeline steps (clinical shifts, skills labs, simulations)
// ---------------------------------------------------------------------------
async function seedTimelineSteps(userIds) {
  log.info('Seeding timeline steps...');

  const steps = [];
  const stepTitles = {
    clinical_shift: [
      'Med-Surg Clinical — Day {n}', 'ICU Rotation — Day {n}',
      'ER Clinical — Day {n}', 'Pediatric Rotation — Day {n}',
      'OB Clinical — Day {n}', 'Psych Nursing — Day {n}',
    ],
    skills_lab: [
      'IV Insertion Skills Lab', 'Wound Care Practice',
      'Foley Catheter Skills Lab', 'Medication Administration Lab',
      'Blood Draw Practice', 'Trach Care Skills Lab',
    ],
    simulation: [
      'Code Blue Simulation', 'Rapid Response Scenario',
      'Patient Deterioration Sim', 'OB Emergency Simulation',
    ],
  };

  for (const student of userIds.students) {
    // Each student gets 8-15 timeline steps over 12 weeks
    const numSteps = Math.floor(Math.random() * 8) + 8;

    for (let i = 0; i < numSteps; i++) {
      const type = pickRandom(['clinical_shift', 'clinical_shift', 'clinical_shift', 'skills_lab', 'simulation']);
      const titleTemplate = pickRandom(stepTitles[type]);
      const title = titleTemplate.replace('{n}', String(i + 1));
      const stepDaysAgo = Math.floor((12 * 7) * ((numSteps - i) / numSteps));
      const preceptor = pickRandom(userIds.preceptors);

      steps.push({
        id: deterministicUuid('step', `${student.id}:${i}`),
        user_id: student.id,
        organization_id: ORG_ID,
        interest_id: 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
        title,
        status: i < numSteps - 2 ? 'completed' : (i === numSteps - 2 ? 'in_progress' : 'pending'),
        category: type,
        starts_at: daysAgo(stepDaysAgo),
        metadata: {
          plan: {
            what_will_you_do: `Focus on ${pickRandom(['patient assessment', 'medication administration', 'wound care', 'IV therapy', 'patient education', 'documentation'])}`,
            how_sub_steps: [
              { id: `ss-${i}-1`, text: 'Review patient charts', sort_order: 1, completed: i < numSteps - 1 },
              { id: `ss-${i}-2`, text: 'Practice targeted skills', sort_order: 2, completed: i < numSteps - 2 },
              { id: `ss-${i}-3`, text: 'Complete documentation', sort_order: 3, completed: i < numSteps - 2 },
            ],
            collaborators: [{ name: `${preceptor.first} ${preceptor.last}`, role: 'preceptor' }],
          },
          act: {
            notes: i < numSteps - 1
              ? `Completed ${type === 'clinical_shift' ? '8-hour shift' : 'session'}. ${pickRandom([
                  'Good experience with patient assessment today.',
                  'Practiced IV insertion under supervision.',
                  'Helped with wound dressing change.',
                  'Administered medications with preceptor oversight.',
                  'Documented in EHR — improving my speed.',
                  'Participated in interdisciplinary rounds.',
                ])}`
              : null,
          },
          review: i < numSteps - 2 ? {
            overall_rating: Math.floor(Math.random() * 3) + 3, // 3-5
            went_well: 'Good clinical reasoning and patient interaction.',
            to_improve: 'Need to work on time management and documentation speed.',
          } : undefined,
        },
        created_at: daysAgo(stepDaysAgo + 1),
        updated_at: daysAgo(stepDaysAgo),
      });
    }
  }

  log.info(`  Inserting ${steps.length} timeline steps...`);
  for (let i = 0; i < steps.length; i += 50) {
    const batch = steps.slice(i, i + 50);
    const { error } = await supabase
      .from('betterat_timeline_steps')
      .upsert(batch, { onConflict: 'id' });
    if (error) log.warn(`  Steps batch ${i}: ${error.message}`);
  }

  log.success(`Seeded ${steps.length} timeline steps`);
}

// ---------------------------------------------------------------------------
// Add "Nursing" interest for all demo users
// ---------------------------------------------------------------------------
async function seedUserInterests(userIds) {
  log.info('Adding Nursing interest for all demo users...');

  const NURSING_INTEREST_ID = 'bec249c5-6412-4d16-bb84-bfcfb887ff67';
  const allUsers = [...userIds.students, ...userIds.preceptors, ...userIds.faculty];

  const rows = allUsers.map(u => ({
    user_id: u.id,
    interest_id: NURSING_INTEREST_ID,
  }));

  const { error } = await supabase
    .from('user_interests')
    .upsert(rows, { onConflict: 'user_id,interest_id' });

  if (error) log.warn(`user_interests upsert: ${error.message}`);
  else log.success(`Added Nursing interest for ${rows.length} users`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  log.info('=== JHU School of Nursing Demo Seed ===\n');

  try {
    await seedOrganization();
    const userIds = await seedUsers();
    await seedCohort(userIds.students);
    await seedUserInterests(userIds);
    const competencies = await seedCompetencies();
    await seedCompetencyData(userIds, competencies);
    await seedTimelineSteps(userIds);

    log.info('\n=== Demo Credentials ===');
    log.info(`Dean login:      ${makeEmail('Patricia', 'Morrison', 'jhu-faculty-demo.edu')} / [DEMO_PASSWORD]`);
    log.info(`Faculty login:   ${makeEmail('Robert', 'Huang', 'jhu-faculty-demo.edu')} / [DEMO_PASSWORD]`);
    log.info(`Preceptor login: ${makeEmail('Sarah', 'Chen', 'jhu-hospital-demo.edu')} / [DEMO_PASSWORD]`);
    log.info(`Student login:   ${makeEmail('Emily', 'Rodriguez')} / [DEMO_PASSWORD]`);
    log.info(`\nOrg ID: ${ORG_ID}`);
    log.info(`Cohort ID: ${COHORT_ID}`);

    log.success('\n🎉 JHU Nursing demo seed complete!');
  } catch (err) {
    log.error('Seed failed:', err.message);
    process.exit(1);
  }
}

main();
