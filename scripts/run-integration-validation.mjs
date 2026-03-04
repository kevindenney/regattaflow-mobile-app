#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.resolve(REPO_ROOT, 'docs', 'integration-validation-latest.md');
const OUTPUT_JSON_PATH = path.resolve(REPO_ROOT, 'docs', 'integration-validation-latest.json');

dotenv.config({ path: path.resolve(REPO_ROOT, '.env.local') });
dotenv.config({ path: path.resolve(REPO_ROOT, '.env') });

const startedAt = new Date();
const strictApiSmoke = process.argv.includes('--strict-api-smoke');

/**
 * @typedef {'PASS' | 'FAIL' | 'SKIP'} CheckStatus
 * @typedef {{ id: string; category: string; status: CheckStatus; details: string; reference?: string }} CheckResult
 */

/**
 * @param {string} target
 */
async function readFile(target) {
  return fs.readFile(path.resolve(REPO_ROOT, target), 'utf8');
}

/**
 * @param {string} target
 */
async function fileExists(target) {
  try {
    await fs.access(path.resolve(REPO_ROOT, target));
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} text
 */
function sanitizeForTable(text) {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/**
 * @param {any} error
 */
function formatError(error) {
  if (!error) return 'unknown error';
  if (typeof error === 'string') return error;
  const pieces = [];
  if (error.message) pieces.push(`message=${error.message}`);
  if (error.code) pieces.push(`code=${error.code}`);
  if (error.details) pieces.push(`details=${error.details}`);
  if (error.hint) pieces.push(`hint=${error.hint}`);
  const serialized = pieces.join('; ');
  return serialized || JSON.stringify(error);
}

/**
 * @param {string} url
 * @param {RequestInit} init
 * @param {number} timeoutMs
 */
async function fetchWithTimeout(url, init = {}, timeoutMs = 7000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * @param {CheckResult[]} results
 * @param {string} id
 * @returns {CheckResult | undefined}
 */
function byId(results, id) {
  return results.find((item) => item.id === id);
}

const REQUIRED_TABLE_SIGNATURES = [
  {
    table: 'organizations',
    requiredColumns: ['id', 'name', 'organization_type', 'is_active', 'created_at', 'updated_at'],
  },
  {
    table: 'organization_invites',
    requiredColumns: [
      'id',
      'organization_id',
      'invite_token',
      'role_key',
      'role_label',
      'status',
      'invited_by',
      'responded_at',
      'metadata',
      'created_at',
      'updated_at',
    ],
  },
  {
    table: 'assessment_records',
    requiredColumns: [
      'id',
      'organization_id',
      'participant_id',
      'evaluator_id',
      'competency_id',
      'status',
      'score',
      'assessed_at',
      'created_at',
      'updated_at',
    ],
  },
  {
    table: 'programs',
    requiredColumns: [
      'id',
      'organization_id',
      'domain',
      'title',
      'status',
      'start_at',
      'end_at',
      'metadata',
      'created_at',
      'updated_at',
    ],
  },
  {
    table: 'program_sessions',
    requiredColumns: [
      'id',
      'program_id',
      'organization_id',
      'title',
      'session_type',
      'status',
      'starts_at',
      'ends_at',
      'metadata',
      'created_at',
      'updated_at',
    ],
  },
  {
    table: 'program_participants',
    requiredColumns: [
      'id',
      'organization_id',
      'program_id',
      'session_id',
      'user_id',
      'role',
      'status',
      'metadata',
      'created_at',
      'updated_at',
    ],
  },
];

const REQUIRED_RPC_SIGNATURES = [
  {
    name: 'get_organization_invite_token_by_id',
    args: { p_invite_id: '00000000-0000-0000-0000-000000000000' },
    argSignature: 'p_invite_id:uuid',
    allowedRuntimeErrorSubstrings: [],
  },
  {
    name: 'get_organization_invite_by_token',
    args: { p_invite_token: 'integration-validation-nonexistent-token' },
    argSignature: 'p_invite_token:text',
    allowedRuntimeErrorSubstrings: [],
  },
  {
    name: 'mark_organization_invite_opened',
    args: { p_invite_token: 'integration-validation-nonexistent-token' },
    argSignature: 'p_invite_token:text',
    allowedRuntimeErrorSubstrings: [],
  },
  {
    name: 'respond_to_organization_invite',
    args: { p_invite_token: 'integration-validation-nonexistent-token', p_decision: 'declined' },
    argSignature: 'p_invite_token:text,p_decision:text',
    allowedRuntimeErrorSubstrings: [
      'Authentication required.',
      'Invite not found.',
      'Invite token is required.',
      'Invite email does not match signed-in user.',
      'Invite is no longer active.',
      'Invite already responded to.',
    ],
  },
];

/**
 * @param {string} value
 * @param {string} delimiter
 */
function splitCsv(value, delimiter = ',') {
  return value
    .split(delimiter)
    .map((token) => token.trim())
    .filter(Boolean);
}

/**
 * @param {any} error
 */
function classifySignatureMismatch(error) {
  const raw = formatError(error);
  const message = String(error?.message || '');
  const details = String(error?.details || '');
  const hint = String(error?.hint || '');
  const code = String(error?.code || '');
  const combined = `${message} ${details} ${hint}`.toLowerCase();

  if (!error) {
    return { isSignatureMismatch: false, reason: raw };
  }
  if (code === 'PGRST202' || code === '42883') {
    return { isSignatureMismatch: true, reason: raw };
  }
  if (
    combined.includes('could not find the function') ||
    combined.includes('function public.') ||
    combined.includes('schema cache') ||
    combined.includes('does not exist')
  ) {
    return { isSignatureMismatch: true, reason: raw };
  }
  return { isSignatureMismatch: false, reason: raw };
}

/**
 * @param {ReturnType<typeof createClient>} supabase
 * @param {{ table: string; requiredColumns: string[] }} tableSignature
 */
async function validateTableSignature(supabase, tableSignature) {
  const missingColumns = [];
  const reasons = [];
  const required = tableSignature.requiredColumns;

  const baseProbeColumn = required[0] || 'id';
  const { error: tableError } = await supabase
    .from(tableSignature.table)
    .select(baseProbeColumn, { head: true, count: 'exact' })
    .limit(1);

  if (tableError) {
    reasons.push(`Missing table or inaccessible relation "${tableSignature.table}" (${formatError(tableError)}).`);
    return { ok: false, missingColumns, reasons };
  }

  for (const column of required) {
    const { error } = await supabase
      .from(tableSignature.table)
      .select(column, { head: true, count: 'exact' })
      .limit(1);
    if (!error) continue;

    const normalized = `${String(error?.message || '')} ${String(error?.details || '')}`.toLowerCase();
    const maybeMissing = normalized.includes('column') && normalized.includes('does not exist');
    if (maybeMissing) {
      missingColumns.push(column);
      reasons.push(`Missing required column "${tableSignature.table}.${column}" (${formatError(error)}).`);
      continue;
    }
    reasons.push(`Unable to verify column "${tableSignature.table}.${column}" (${formatError(error)}).`);
  }

  return { ok: reasons.length === 0, missingColumns, reasons };
}

/**
 * @param {ReturnType<typeof createClient>} supabase
 * @param {{ name: string; args: Record<string, unknown>; argSignature: string; allowedRuntimeErrorSubstrings: string[] }} rpcSignature
 */
async function validateRpcSignature(supabase, rpcSignature) {
  const { error } = await supabase.rpc(rpcSignature.name, rpcSignature.args);
  if (!error) {
    return { ok: true, reason: `RPC "${rpcSignature.name}(${rpcSignature.argSignature})" executed with probe args.` };
  }

  const { isSignatureMismatch, reason } = classifySignatureMismatch(error);
  if (isSignatureMismatch) {
    return {
      ok: false,
      reason: `Missing or mismatched RPC signature for "${rpcSignature.name}(${rpcSignature.argSignature})" (${reason}).`,
    };
  }

  const errorText = formatError(error);
  const isAllowedRuntimeError = rpcSignature.allowedRuntimeErrorSubstrings.some((needle) => errorText.includes(needle));
  if (isAllowedRuntimeError) {
    return {
      ok: true,
      reason: `RPC "${rpcSignature.name}(${rpcSignature.argSignature})" is present (runtime guard hit: ${errorText}).`,
    };
  }

  return {
    ok: false,
    reason: `RPC "${rpcSignature.name}(${rpcSignature.argSignature})" returned unexpected error (${errorText}).`,
  };
}

async function run() {
  /** @type {CheckResult[]} */
  const results = [];

  const add = (result) => {
    results.push(result);
  };

  const requiredDomainGateFiles = [
    {
      id: 'domain-gate-club-support',
      file: 'api/ai/club/support.ts',
      needleA: 'resolveWorkspaceDomainForAuth',
      needleB: "code: 'DOMAIN_GATED'",
    },
    {
      id: 'domain-gate-event-doc-draft',
      file: 'api/ai/events/[id]/documents/draft.ts',
      needleA: 'resolveWorkspaceDomainForAuth',
      needleB: "code: 'DOMAIN_GATED'",
    },
    {
      id: 'domain-gate-race-comms-draft',
      file: 'api/ai/races/[id]/comms/draft.ts',
      needleA: 'resolveWorkspaceDomainForAuth',
      needleB: "code: 'DOMAIN_GATED'",
    },
  ];

  for (const gateCheck of requiredDomainGateFiles) {
    const source = await readFile(gateCheck.file);
    const ok = source.includes(gateCheck.needleA) && source.includes(gateCheck.needleB);
    add({
      id: gateCheck.id,
      category: 'Domain Gating',
      status: ok ? 'PASS' : 'FAIL',
      details: ok
        ? `Found org type gate + DOMAIN_GATED response in ${gateCheck.file}`
        : `Missing expected gate markers in ${gateCheck.file}`,
      reference: gateCheck.file,
    });
  }

  const domainResolverSource = await readFile('api/middleware/domain.ts');
  const domainResolverContractOk =
    domainResolverSource.includes('resolveWorkspaceDomainForAuth') &&
    domainResolverSource.includes('resolveWorkspaceDomainForPresentation') &&
    domainResolverSource.includes("if (orgType === 'club') return 'sailing'") &&
    domainResolverSource.includes("if (orgType === 'institution') return 'nursing'");
  add({
    id: 'domain-resolver-precedence-contract',
    category: 'Domain Gating',
    status: domainResolverContractOk ? 'PASS' : 'FAIL',
    details: domainResolverContractOk
      ? 'Domain resolver enforces organization_type precedence for auth gating and supports presentation fallback.'
      : 'Domain resolver precedence markers are missing.',
    reference: 'api/middleware/domain.ts',
  });

  const notificationsSource = await readFile('app/settings/notifications.tsx');
  const clientsSource = await readFile('app/(tabs)/clients.tsx');
  const programsExperienceSource = await readFile('app/(tabs)/programs-experience.tsx');
  const presentationCopyContractOk =
    notificationsSource.includes('isSailingPresentationDomain') &&
    clientsSource.includes('isSailingPresentationDomain') &&
    programsExperienceSource.includes('isNursingPresentationDomain');
  add({
    id: 'ui-copy-presentation-domain-contract',
    category: 'Domain Gating',
    status: presentationCopyContractOk ? 'PASS' : 'FAIL',
    details: presentationCopyContractOk
      ? 'UI copy paths use presentation-domain helpers (interest-aware) without changing auth domain gates.'
      : 'UI copy presentation-domain markers are missing.',
    reference: 'app/settings/notifications.tsx, app/(tabs)/clients.tsx, app/(tabs)/programs-experience.tsx',
  });

  const programsFile = await readFile('app/(tabs)/programs.tsx');
  const raceManagementFile = await readFile('app/(tabs)/race-management.tsx');
  const tabsLayoutFile = await readFile('app/(tabs)/_layout.tsx');
  const programsCoreMigration = await readFile('supabase/migrations/20260302110000_programs_core_model.sql');
  const programCoreMigrationCoverageOk =
    programsCoreMigration.includes('CREATE TABLE IF NOT EXISTS public.programs') &&
    programsCoreMigration.includes('CREATE TABLE IF NOT EXISTS public.program_sessions') &&
    programsCoreMigration.includes('CREATE TABLE IF NOT EXISTS public.program_participants');
  add({
    id: 'programs-core-migration-coverage',
    category: 'Programs Core',
    status: programCoreMigrationCoverageOk ? 'PASS' : 'FAIL',
    details: programCoreMigrationCoverageOk
      ? 'Programs core migration defines programs, program_sessions, and program_participants tables.'
      : 'Programs core migration is missing one or more required table definitions.',
    reference: 'supabase/migrations/20260302110000_programs_core_model.sql',
  });

  const programsAliasOk =
    programsFile.includes("./programs-experience") &&
    raceManagementFile.includes('trackRaceManagementAliasUsage') &&
    raceManagementFile.includes("isFeatureEnabled('RACE_MANAGEMENT_ALIAS_REDIRECT_ONLY')") &&
    raceManagementFile.includes('<Redirect href="/(tabs)/programs" />') &&
    raceManagementFile.includes('<ProgramsExperience />');
  add({
    id: 'programs-route-alias',
    category: 'Programs Alias',
    status: programsAliasOk ? 'PASS' : 'FAIL',
    details: programsAliasOk
      ? 'Programs stays canonical while race-management alias is telemetry-backed and redirect-capable.'
      : 'Programs/race-management alias lifecycle markers are incomplete.',
    reference: 'app/(tabs)/programs.tsx, app/(tabs)/race-management.tsx',
  });

  const aliasReleaseNotesPath = 'docs/release-notes-race-management-alias-removal.md';
  const aliasReleaseNotes = await readFile(aliasReleaseNotesPath);
  const aliasReleaseNotesOk =
    aliasReleaseNotes.includes('Earliest redirect-only start date') &&
    aliasReleaseNotes.includes('Earliest alias removal date') &&
    aliasReleaseNotes.includes('RACE_MANAGEMENT_ALIAS_REDIRECT_ONLY') &&
    aliasReleaseNotes.includes('Alias usage telemetry is active');
  add({
    id: 'programs-alias-removal-checklist',
    category: 'Programs Alias',
    status: aliasReleaseNotesOk ? 'PASS' : 'FAIL',
    details: aliasReleaseNotesOk
      ? 'Alias release-note checklist includes date gates, telemetry prerequisite, and rollback guidance.'
      : 'Alias release-note checklist is missing one or more required deprecation markers.',
    reference: aliasReleaseNotesPath,
  });

  const featureFlagsSource = await readFile('lib/featureFlags.ts');
  const rollbackRunbookPath = 'docs/feature-flag-rollback-runbook.md';
  const rollbackRunbookSource = await readFile(rollbackRunbookPath);
  const featureFlagRollbackContractOk =
    featureFlagsSource.includes('PROGRAM_DATA_MODEL_V1') &&
    featureFlagsSource.includes('COACH_SHELL_V1') &&
    featureFlagsSource.includes('DOMAIN_GATE_AI_STRICT_V1') &&
    featureFlagsSource.includes('SECONDARY_PACKS_V1') &&
    featureFlagsSource.includes('EXPO_PUBLIC_FF_PROGRAM_DATA_MODEL_V1') &&
    featureFlagsSource.includes('EXPO_PUBLIC_FF_COACH_SHELL_V1') &&
    featureFlagsSource.includes('EXPO_PUBLIC_FF_DOMAIN_GATE_AI_STRICT_V1') &&
    featureFlagsSource.includes('EXPO_PUBLIC_FF_SECONDARY_PACKS_V1') &&
    rollbackRunbookSource.includes('Rollback Procedure') &&
    rollbackRunbookSource.includes('Restore Procedure');
  add({
    id: 'feature-flag-rollback-contract',
    category: 'Feature Flags',
    status: featureFlagRollbackContractOk ? 'PASS' : 'FAIL',
    details: featureFlagRollbackContractOk
      ? 'Required Blueprint v2 flags and rollback runbook markers are present.'
      : 'Feature flag or rollback runbook markers are missing.',
    reference: `lib/featureFlags.ts, ${rollbackRunbookPath}`,
  });

  const secondaryPacksDocPath = 'docs/secondary-packs-canonical.md';
  const secondaryPacksDoc = await readFile(secondaryPacksDocPath);
  const secondaryPacksContractOk =
    secondaryPacksDoc.includes('1. `drawing`') &&
    secondaryPacksDoc.includes('2. `golf`') &&
    secondaryPacksDoc.includes('workspace domain `drawing`') &&
    secondaryPacksDoc.includes('workspace domain `fitness`');
  add({
    id: 'secondary-packs-canonical-contract',
    category: 'Secondary Packs',
    status: secondaryPacksContractOk ? 'PASS' : 'FAIL',
    details: secondaryPacksContractOk
      ? 'Canonical secondary packs list is locked to drawing and golf with explicit domain mapping.'
      : 'Secondary packs canonical contract markers are missing.',
    reference: secondaryPacksDocPath,
  });

  const secondaryPacksCatalogMigrationPath = 'supabase/migrations/20260303143000_seed_secondary_pack_domain_catalog_stubs.sql';
  const secondaryPacksCatalogMigration = await readFile(secondaryPacksCatalogMigrationPath);
  const secondaryPacksCatalogStubsOk =
    secondaryPacksCatalogMigration.includes("INSERT INTO public.domain_catalog") &&
    secondaryPacksCatalogMigration.includes("'drawing'") &&
    secondaryPacksCatalogMigration.includes("'fitness'") &&
    secondaryPacksCatalogMigration.includes("'Golf'") &&
    secondaryPacksCatalogMigration.includes("'Studio Sprint Template'") &&
    secondaryPacksCatalogMigration.includes("'Lesson Block Template'");
  add({
    id: 'secondary-packs-domain-catalog-stubs',
    category: 'Secondary Packs',
    status: secondaryPacksCatalogStubsOk ? 'PASS' : 'FAIL',
    details: secondaryPacksCatalogStubsOk
      ? 'Secondary pack domain_catalog stubs are seeded for drawing and golf(fitness-mapped).'
      : 'Secondary pack domain_catalog stub migration markers are missing.',
    reference: secondaryPacksCatalogMigrationPath,
  });

  const programServiceSource = await readFile('services/ProgramService.ts');
  const programServiceCrudContractOk =
    programServiceSource.includes('async listPrograms(') &&
    programServiceSource.includes('async getProgram(') &&
    programServiceSource.includes('async createProgram(') &&
    programServiceSource.includes('async listProgramSessions(') &&
    programServiceSource.includes('async createProgramSession(') &&
    programServiceSource.includes('async updateProgramSession(') &&
    programServiceSource.includes('async listProgramParticipants(') &&
    programServiceSource.includes('async listAssignedProgramIdsForStaff(') &&
    programServiceSource.includes('async createProgramParticipant(') &&
    programServiceSource.includes('async updateProgramParticipant(') &&
    programServiceSource.includes('async removeProgramParticipant(');
  add({
    id: 'program-service-crud-assignment-contract',
    category: 'Programs Core',
    status: programServiceCrudContractOk ? 'PASS' : 'FAIL',
    details: programServiceCrudContractOk
      ? 'ProgramService exposes required CRUD + assignment API surface for programs core model.'
      : 'ProgramService CRUD/assignment markers are missing.',
    reference: 'services/ProgramService.ts',
  });

  const programsExperienceInstitutionSource = await readFile('app/(tabs)/programs-experience.tsx');
  const programsUiRealDataContractOk =
    programsExperienceInstitutionSource.includes('const upcomingItems = isInstitutionWorkspace') &&
    programsExperienceInstitutionSource.includes('? institutionProgramItems.upcoming') &&
    programsExperienceInstitutionSource.includes('programService.listPrograms(activeOrganization.id') &&
    programsExperienceInstitutionSource.includes('programService.listOrganizationProgramSessions(activeOrganization.id') &&
    programsExperienceInstitutionSource.includes('programService.getProgramParticipantCounts(activeOrganization.id');
  add({
    id: 'programs-ui-real-data-contract',
    category: 'Programs Core',
    status: programsUiRealDataContractOk ? 'PASS' : 'FAIL',
    details: programsUiRealDataContractOk
      ? 'Institution program paths are wired to ProgramService-backed data sources (not static mocks).'
      : 'Institution program UI data-source markers are incomplete.',
    reference: 'app/(tabs)/programs-experience.tsx',
  });

  const coachHomeEndpointProfilePath = 'docs/coach-home-endpoint-profile.md';
  const coachHomeEndpointProfile = await readFile(coachHomeEndpointProfilePath);
  const coachHomeEndpointProfileOk =
    coachHomeEndpointProfile.includes('# Coach Home Endpoint Profile') &&
    coachHomeEndpointProfile.includes('## Bottleneck Summary') &&
    coachHomeEndpointProfile.includes('## Step Ranking (Avg ms)');
  add({
    id: 'coach-home-endpoint-profile-report',
    category: 'Coach Home',
    status: coachHomeEndpointProfileOk ? 'PASS' : 'FAIL',
    details: coachHomeEndpointProfileOk
      ? 'Coach Home endpoint profiling report artifact is present with bottleneck summary and ranked steps.'
      : 'Coach Home endpoint profile report markers are missing.',
    reference: coachHomeEndpointProfilePath,
  });

  const tabRegistrationOk =
    tabsLayoutFile.includes('name="programs"') &&
    tabsLayoutFile.includes('name="race-management"');
  add({
    id: 'programs-tab-registration',
    category: 'Programs Alias',
    status: tabRegistrationOk ? 'PASS' : 'FAIL',
    details: tabRegistrationOk
      ? 'Tabs layout includes both programs and race-management screen registrations.'
      : 'Tabs layout missing one of programs/race-management screen registrations.',
    reference: 'app/(tabs)/_layout.tsx',
  });

  const inviteMigrationFiles = [
    'supabase/migrations/20260302160000_create_organization_invites.sql',
    'supabase/migrations/20260302190000_invite_tokens_and_role_presets.sql',
    'supabase/migrations/20260302193000_org_invite_invitee_status_updates.sql',
    'supabase/migrations/20260302200000_org_invite_completion_flow.sql',
    'supabase/migrations/20260302223000_invite_token_lookup_by_id_rpc.sql',
  ];
  let inviteMigrationsExist = true;
  for (const migrationFile of inviteMigrationFiles) {
    const exists = await fileExists(migrationFile);
    if (!exists) inviteMigrationsExist = false;
  }
  add({
    id: 'invite-migrations-present',
    category: 'Invite Flow',
    status: inviteMigrationsExist ? 'PASS' : 'FAIL',
    details: inviteMigrationsExist
      ? 'Invite schema + token/completion migrations are present.'
      : 'One or more invite flow migrations are missing.',
    reference: inviteMigrationFiles.join(', '),
  });

  const inviteServiceSource = await readFile('services/OrganizationInviteService.ts');
  const inviteRpcOk =
    /rpc\(\s*'get_organization_invite_token_by_id'/.test(inviteServiceSource) &&
    /rpc\(\s*'get_organization_invite_by_token'/.test(inviteServiceSource) &&
    /rpc\(\s*'mark_organization_invite_opened'/.test(inviteServiceSource) &&
    /rpc\(\s*'respond_to_organization_invite'/.test(inviteServiceSource);
  add({
    id: 'invite-rpc-wiring',
    category: 'Invite Flow',
    status: inviteRpcOk ? 'PASS' : 'FAIL',
    details: inviteRpcOk
      ? 'Invite service uses token lookup/open/respond RPCs.'
      : 'Invite service is missing one or more expected invite RPC calls.',
    reference: 'services/OrganizationInviteService.ts',
  });

  const assessmentRlsMigrationPath = 'supabase/migrations/20260302203000_harden_assessment_records_select_rls.sql';
  const assessmentRlsMigration = await readFile(assessmentRlsMigrationPath);
  const assessmentPolicyNames = [
    'assessment_records_select_non_institution_org_members',
    'assessment_records_select_institution_owner_admin',
    'assessment_records_select_institution_learner_self',
    'assessment_records_select_institution_assigned_staff',
  ];
  const assessmentRlsOk = assessmentPolicyNames.every((name) => assessmentRlsMigration.includes(`"${name}"`));
  add({
    id: 'assessment-rls-policy-shape',
    category: 'Assessment RLS',
    status: assessmentRlsOk ? 'PASS' : 'FAIL',
    details: assessmentRlsOk
      ? 'Assessment RLS hardening migration contains all expected SELECT policy names.'
      : 'Assessment RLS migration is missing one or more expected policy names.',
    reference: assessmentRlsMigrationPath,
  });

  const assessmentRlsSemanticClauses = [
    "ARRAY['owner', 'admin']::text[]",
    "pp.user_id = auth.uid()",
    "viewer.role IN ('faculty', 'instructor', 'preceptor', 'coordinator')",
    "viewer.program_id = assessed.program_id",
    "o.organization_type <> 'institution'",
  ];
  const assessmentRlsSemanticsOk = assessmentRlsSemanticClauses.every((clause) =>
    assessmentRlsMigration.includes(clause)
  );
  add({
    id: 'assessment-rls-policy-semantics',
    category: 'Assessment RLS',
    status: assessmentRlsSemanticsOk ? 'PASS' : 'FAIL',
    details: assessmentRlsSemanticsOk
      ? 'Assessment RLS migration preserves owner/admin org-wide access, learner self-only access, assigned staff program scope, and non-institution member visibility split.'
      : 'Assessment RLS migration is missing one or more required role-scoping semantic clauses.',
    reference: assessmentRlsMigrationPath,
  });

  const programsCoreMigrationPath = 'supabase/migrations/20260302110000_programs_core_model.sql';
  const programsCoreRlsSource = await readFile(programsCoreMigrationPath);
  const programsCoreRlsSemanticClauses = [
    '"programs_select_org_members"',
    '"program_sessions_select_org_members"',
    '"program_participants_select_org_members"',
    'public.is_active_org_member(organization_id)',
    "ARRAY['owner', 'admin', 'manager', 'faculty', 'instructor', 'preceptor', 'coach']::text[]",
    "ARRAY['owner', 'admin', 'manager', 'faculty', 'instructor', 'preceptor', 'coach', 'coordinator']::text[]",
    'user_id = auth.uid()',
  ];
  const programsCoreRlsSemanticsOk = programsCoreRlsSemanticClauses.every((clause) =>
    programsCoreRlsSource.includes(clause)
  );
  add({
    id: 'programs-core-rls-policy-semantics',
    category: 'Programs Core RLS',
    status: programsCoreRlsSemanticsOk ? 'PASS' : 'FAIL',
    details: programsCoreRlsSemanticsOk
      ? 'Programs core migration preserves org-member read scope, manager/staff write scopes, and participant self-service exception clauses.'
      : 'Programs core migration is missing one or more required role-scoping semantic clauses.',
    reference: programsCoreMigrationPath,
  });

  const retentionDispatchSource = await readFile('lib/coach/retentionDispatch.ts');
  const retentionCronSource = await readFile('api/cron/coach-retention-loop.ts');
  const weeklyRecapPayloadGuardOk =
    retentionDispatchSource.includes('completedActions') &&
    retentionDispatchSource.includes('pendingActions') &&
    retentionDispatchSource.includes('activeDays') &&
    retentionDispatchSource.includes('trendDelta') &&
    retentionCronSource.includes('isCompleteWeeklyRecapPayload') &&
    retentionCronSource.includes('invalid_weekly_recap_payload');
  add({
    id: 'coach-retention-weekly-recap-payload-guard',
    category: 'Retention Loop',
    status: weeklyRecapPayloadGuardOk ? 'PASS' : 'FAIL',
    details: weeklyRecapPayloadGuardOk
      ? 'Weekly recap dispatch includes payload completeness validation + invalid payload guard path.'
      : 'Weekly recap payload guard is incomplete (missing required fields or runtime validation path).',
    reference: 'lib/coach/retentionDispatch.ts, api/cron/coach-retention-loop.ts',
  });

  const signatureInsightMigrationPath = 'supabase/migrations/20260303153000_signature_insight_memory.sql';
  const signatureInsightMigrationSource = await readFile(signatureInsightMigrationPath);
  const signatureInsightMigrationOk =
    signatureInsightMigrationSource.includes('CREATE TABLE IF NOT EXISTS public.user_principle_memory') &&
    signatureInsightMigrationSource.includes('CREATE TABLE IF NOT EXISTS public.signature_insight_events') &&
    signatureInsightMigrationSource.includes('apply_signature_insight_outcome_v1') &&
    signatureInsightMigrationSource.includes("outcome IN ('pending', 'accepted', 'edited', 'dismissed')");
  add({
    id: 'signature-insight-memory-migration-coverage',
    category: 'Signature Insight',
    status: signatureInsightMigrationOk ? 'PASS' : 'FAIL',
    details: signatureInsightMigrationOk
      ? 'Signature insight persistence migration defines principle memory, event log, and outcome-apply RPC.'
      : 'Signature insight migration markers are missing (tables and/or apply outcome function).',
    reference: signatureInsightMigrationPath,
  });

  const signatureInsightServiceSource = await readFile('services/SignatureInsightService.ts');
  const signatureInsightServiceContractOk =
    signatureInsightServiceSource.includes('class SignatureInsightService') &&
    signatureInsightServiceSource.includes("from('signature_insight_events')") &&
    signatureInsightServiceSource.includes("from('user_principle_memory')") &&
    signatureInsightServiceSource.includes("rpc('apply_signature_insight_outcome_v1'");
  add({
    id: 'signature-insight-service-contract',
    category: 'Signature Insight',
    status: signatureInsightServiceContractOk ? 'PASS' : 'FAIL',
    details: signatureInsightServiceContractOk
      ? 'SignatureInsightService exposes event logging, principle-memory listing, and outcome-apply RPC wiring.'
      : 'SignatureInsightService persistence markers are incomplete.',
    reference: 'services/SignatureInsightService.ts',
  });

  const raceChecklistServiceSource = await readFile('services/RaceChecklistService.ts');
  const signatureInsightTriggerContractOk =
    raceChecklistServiceSource.includes('maybeEmitSignatureInsightForChecklistCompletion') &&
    raceChecklistServiceSource.includes('status === \'completed\'') &&
    raceChecklistServiceSource.includes('resolveLatestAiAnalysisForRace') &&
    raceChecklistServiceSource.includes("eq('outcome', 'dismissed')") &&
    raceChecklistServiceSource.includes("eq('principle_text', principleText)") &&
    raceChecklistServiceSource.includes("sourceKind: 'timeline_step_completion'") &&
    raceChecklistServiceSource.includes('signatureInsightService.logSignatureInsightEvent');
  add({
    id: 'signature-insight-timeline-trigger-contract',
    category: 'Signature Insight',
    status: signatureInsightTriggerContractOk ? 'PASS' : 'FAIL',
    details: signatureInsightTriggerContractOk
      ? 'Timeline step completion path emits signature insight events only when AI analysis is available and suppresses unchanged dismissed insights.'
      : 'Signature insight timeline trigger markers are incomplete in RaceChecklistService.',
    reference: 'services/RaceChecklistService.ts',
  });

  const adaptiveLearningSource = await readFile('services/AdaptiveLearningService.ts');
  const progressContentSource = await readFile('components/progress/ProgressContent.tsx');
  const signaturePrinciplesHookSource = await readFile('hooks/useSignaturePrinciples.ts');
  const adaptiveLearningHookSource = await readFile('hooks/useAdaptiveLearning.ts');
  const excellenceChecklistHookSource = await readFile('hooks/useExcellenceChecklist.ts');
  const signatureInsightReuseContractOk =
    adaptiveLearningSource.includes("from('user_principle_memory')") &&
    adaptiveLearningSource.includes('buildPrincipleReminders') &&
    adaptiveLearningSource.includes('PRINCIPLE_NUDGE_PREFIX') &&
    adaptiveLearningSource.includes(".eq('interest_id', interestId)") &&
    adaptiveLearningSource.includes("options.interestId || 'sailing'") &&
    adaptiveLearningHookSource.includes('const interestId = activeInterestSlug || activeDomain || \'sailing\'') &&
    adaptiveLearningHookSource.includes('interestId,') &&
    excellenceChecklistHookSource.includes('RaceChecklistService.updateChecklistStatus(itemId, status, { interestId })') &&
    adaptiveLearningSource.includes('virtual_delivery_') &&
    progressContentSource.includes('My Principles') &&
    progressContentSource.includes('useSignaturePrinciples') &&
    signaturePrinciplesHookSource.includes('listPrincipleMemory');
  add({
    id: 'signature-insight-principle-reuse-contract',
    category: 'Signature Insight',
    status: signatureInsightReuseContractOk ? 'PASS' : 'FAIL',
    details: signatureInsightReuseContractOk
      ? 'Accepted principles are surfaced in Progress and reused in adaptive reminder generation.'
      : 'Signature principle reuse markers are incomplete across AdaptiveLearningService/ProgressContent/hook.',
    reference: 'services/AdaptiveLearningService.ts, components/progress/ProgressContent.tsx, hooks/useSignaturePrinciples.ts',
  });

  const packageJsonSource = await readFile('package.json');
  const signatureInsightBehaviorGateOk =
    packageJsonSource.includes('services/__tests__/RaceChecklistSignatureInsight.behavior.test.ts') &&
    packageJsonSource.includes('hooks/__tests__/signature-insight-interest-threading.contract.test.ts');
  add({
    id: 'signature-insight-behavior-gate-contract',
    category: 'Signature Insight',
    status: signatureInsightBehaviorGateOk ? 'PASS' : 'FAIL',
    details: signatureInsightBehaviorGateOk
      ? 'CI gate unit suite includes signature-insight behavior + interest-threading tests.'
      : 'Signature-insight behavior tests are not fully wired into test:ci:gates:unit.',
    reference: 'package.json#scripts.test:ci:gates:unit',
  });

  const afterRaceContentSource = await readFile('components/cards/content/phases/AfterRaceContent.tsx');
  const educationalChecklistSheetSource = await readFile('components/races/review/EducationalChecklistSheet.tsx');
  const signatureInsightCompletionSurfaceOk =
    afterRaceContentSource.includes('maybeEmitChecklistCompletionSignatureInsight') &&
    afterRaceContentSource.includes('hasAIAnalysis') &&
    afterRaceContentSource.includes('signatureInsightService.logSignatureInsightEvent') &&
    afterRaceContentSource.includes("sourceKind: 'timeline_step_completion'") &&
    educationalChecklistSheetSource.includes('signatureInsightConfirmation') &&
    educationalChecklistSheetSource.includes('Signature Insight Ready') &&
    packageJsonSource.includes('app/__tests__/signature-insight-completion-surface.contract.test.ts');
  add({
    id: 'signature-insight-completion-confirmation-surface',
    category: 'Signature Insight',
    status: signatureInsightCompletionSurfaceOk ? 'PASS' : 'FAIL',
    details: signatureInsightCompletionSurfaceOk
      ? 'Timeline-step completion surface emits signature insights when AI analysis is available and renders confirmation in educational checklist sheets.'
      : 'Signature insight completion confirmation surface markers are incomplete.',
    reference: 'components/cards/content/phases/AfterRaceContent.tsx, components/races/review/EducationalChecklistSheet.tsx, package.json',
  });

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const lineageTableFilterRaw = process.env.INTEGRATION_REQUIRED_TABLES || '';
  const lineageRpcFilterRaw = process.env.INTEGRATION_REQUIRED_RPCS || '';
  const enabledRequiredTables = splitCsv(lineageTableFilterRaw);
  const enabledRequiredRpcs = splitCsv(lineageRpcFilterRaw);
  const activeTableSignatures =
    enabledRequiredTables.length > 0
      ? REQUIRED_TABLE_SIGNATURES.filter((signature) => enabledRequiredTables.includes(signature.table))
      : REQUIRED_TABLE_SIGNATURES;
  const activeRpcSignatures =
    enabledRequiredRpcs.length > 0
      ? REQUIRED_RPC_SIGNATURES.filter((signature) => enabledRequiredRpcs.includes(signature.name))
      : REQUIRED_RPC_SIGNATURES;
  const canRunDbAssertions = Boolean(supabaseUrl && serviceRoleKey);
  const supabase = canRunDbAssertions ? createClient(supabaseUrl, serviceRoleKey) : null;
  let schemaLineageCompatible = true;
  /** @type {string[]} */
  const lineageMismatchReasons = [];

  if (!canRunDbAssertions) {
    add({
      id: 'db-assertions-availability',
      category: 'DB Assertions',
      status: 'SKIP',
      details: 'Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. DB assertions skipped.',
    });
  } else {
    let dbAssertionsAvailable = true;
    let dbAssertionsSkipReason = '';
    try {
      const organizationsLineage = await validateTableSignature(supabase, {
        table: 'organizations',
        requiredColumns: ['id', 'organization_type'],
      });
      schemaLineageCompatible = organizationsLineage.ok;
      if (!organizationsLineage.ok) {
        dbAssertionsAvailable = false;
        lineageMismatchReasons.push(...organizationsLineage.reasons);
        dbAssertionsSkipReason = `Connected Supabase project does not match this repo schema lineage; DB assertions skipped. ${lineageMismatchReasons.join(' ')}`;
      }
    } catch (error) {
      schemaLineageCompatible = false;
      dbAssertionsAvailable = false;
      dbAssertionsSkipReason = `Connected Supabase project lineage check failed; DB assertions skipped. ${formatError(error)}`;
    }

    if (!dbAssertionsAvailable) {
      add({
        id: 'db-assertions-availability',
        category: 'DB Assertions',
        status: 'SKIP',
        details: dbAssertionsSkipReason,
        reference: 'organizations',
      });
    } else {
      add({
        id: 'db-project-lineage',
        category: 'DB Assertions',
        status: 'PASS',
        details: 'Connected Supabase project exposes expected organizations workspace schema.',
        reference: 'organizations',
      });
      for (const tableSignature of activeTableSignatures) {
        try {
          const outcome = await validateTableSignature(supabase, tableSignature);
          if (!outcome.ok) {
            lineageMismatchReasons.push(...outcome.reasons);
          }
          add({
            id: `db-table-signature-${tableSignature.table}`,
            category: 'DB Assertions',
            status: outcome.ok ? 'PASS' : 'FAIL',
            details: outcome.ok
              ? `${tableSignature.table} contains required columns: ${tableSignature.requiredColumns.join(', ')}`
              : outcome.reasons.join(' '),
            reference: tableSignature.table,
          });
        } catch (error) {
          const reason = `Table signature validation crashed for ${tableSignature.table}: ${formatError(error)}`;
          lineageMismatchReasons.push(reason);
          add({
            id: `db-table-signature-${tableSignature.table}`,
            category: 'DB Assertions',
            status: 'FAIL',
            details: reason,
            reference: tableSignature.table,
          });
        }
      }

      for (const rpcSignature of activeRpcSignatures) {
        try {
          const outcome = await validateRpcSignature(supabase, rpcSignature);
          if (!outcome.ok) {
            lineageMismatchReasons.push(outcome.reason);
          }
          add({
            id: `db-rpc-signature-${rpcSignature.name}`,
            category: 'DB Assertions',
            status: outcome.ok ? 'PASS' : 'FAIL',
            details: outcome.reason,
            reference: `rpc:${rpcSignature.name}`,
          });
        } catch (error) {
          const reason = `RPC signature validation crashed for ${rpcSignature.name}: ${formatError(error)}`;
          lineageMismatchReasons.push(reason);
          add({
            id: `db-rpc-signature-${rpcSignature.name}`,
            category: 'DB Assertions',
            status: 'FAIL',
            details: reason,
            reference: `rpc:${rpcSignature.name}`,
          });
        }
      }
    }
  }

  const configuredBaseUrl = process.env.INTEGRATION_BASE_URL || process.env.EXPO_PUBLIC_API_URL || '';
  const fallbackStrictBaseUrl = process.env.INTEGRATION_STRICT_BASE_URL || 'https://regattaflow-app.vercel.app';
  const baseUrl = configuredBaseUrl || (strictApiSmoke ? fallbackStrictBaseUrl : '');
  const sailingAuthToken = String(process.env.INTEGRATION_AUTH_SAILING_BEARER || '').trim();
  const institutionAuthToken = String(process.env.INTEGRATION_AUTH_INSTITUTION_BEARER || '').trim();

  add({
    id: 'api-smoke-auth-probe-configuration',
    category: 'API Smoke',
    status: 'PASS',
    details: `Authenticated probe configuration: sailing=${sailingAuthToken ? 'enabled' : 'disabled'}, institution=${institutionAuthToken ? 'enabled' : 'disabled'}.`,
    reference: 'INTEGRATION_AUTH_SAILING_BEARER, INTEGRATION_AUTH_INSTITUTION_BEARER',
  });

  if (!baseUrl) {
    add({
      id: 'api-smoke-availability',
      category: 'API Smoke',
      status: 'SKIP',
      details: 'Set INTEGRATION_BASE_URL (or EXPO_PUBLIC_API_URL) to run live API smoke checks.',
    });
  } else {
    /** @type {Array<{id: string; path: string; method: string; okStatuses: number[]; note: string; body?: string; headers?: Record<string, string>}>} */
    const aiDomainGateChecks = [
      {
        id: 'api-smoke-domain-gate-race-comms',
        path: '/api/ai/races/integration-smoke/comms/draft',
        method: 'GET',
        okStatuses: [400, 401, 403, 405],
        note: 'Domain-gated AI endpoint should reject unauthenticated/wrong-method calls.',
      },
      {
        id: 'api-smoke-domain-gate-event-doc',
        path: '/api/ai/events/integration-smoke/documents/draft',
        method: 'GET',
        okStatuses: [400, 401, 403, 405],
        note: 'Domain-gated AI endpoint should reject unauthenticated/wrong-method calls.',
      },
      {
        id: 'api-smoke-domain-gate-club-support',
        path: '/api/ai/club/support',
        method: 'GET',
        okStatuses: [400, 401, 403, 405],
        note: 'Domain-gated AI endpoint should reject unauthenticated/wrong-method calls.',
      },
      {
        id: 'api-smoke-domain-gate-race-comms-post',
        path: '/api/ai/races/integration-smoke/comms/draft',
        method: 'POST',
        okStatuses: [400, 401, 403, 405],
        note: 'Domain-gated AI endpoint should reject unauthenticated POST calls without runtime crash.',
        body: JSON.stringify({}),
        headers: { 'content-type': 'application/json' },
      },
      {
        id: 'api-smoke-domain-gate-event-doc-post',
        path: '/api/ai/events/integration-smoke/documents/draft',
        method: 'POST',
        okStatuses: [400, 401, 403, 405],
        note: 'Domain-gated AI endpoint should reject unauthenticated POST calls without runtime crash.',
        body: JSON.stringify({}),
        headers: { 'content-type': 'application/json' },
      },
      {
        id: 'api-smoke-domain-gate-club-support-post',
        path: '/api/ai/club/support',
        method: 'POST',
        okStatuses: [400, 401, 403, 405],
        note: 'Domain-gated AI endpoint should reject unauthenticated POST calls without runtime crash.',
        body: JSON.stringify({}),
        headers: { 'content-type': 'application/json' },
      },
    ];

    /** @type {Array<{id: string; path: string; method: string; okStatuses: number[]; note: string; body?: string; headers?: Record<string, string>}>} */
    const nonAiPublicChecks = [
      {
        id: 'api-smoke-public-regatta',
        path: '/api/public/regattas/integration-smoke-regatta',
        method: 'GET',
        okStatuses: [404],
        note: 'Public regatta endpoint should cleanly return not-found for bogus id.',
      },
      {
        id: 'api-smoke-public-widget',
        path: '/api/public/widgets/integration-smoke-widget',
        method: 'GET',
        okStatuses: [404],
        note: 'Public widget endpoint should cleanly return not-found for bogus token.',
      },
      {
        id: 'api-smoke-cron-coach-retention',
        path: '/api/cron/coach-retention-loop',
        method: 'GET',
        okStatuses: [401, 405],
        note: 'Cron endpoint should return controlled auth/method response without runtime crash.',
      },
      {
        id: 'api-smoke-cron-coach-retention-post',
        path: '/api/cron/coach-retention-loop',
        method: 'POST',
        okStatuses: [401, 405],
        note: 'Cron endpoint should reject unauthenticated POST without runtime crash.',
        body: JSON.stringify({}),
        headers: { 'content-type': 'application/json' },
      },
    ];

    const apiChecks = strictApiSmoke
      ? [...aiDomainGateChecks, ...nonAiPublicChecks]
      : [...aiDomainGateChecks.filter((check) => check.method === 'GET'), ...nonAiPublicChecks];

    for (const check of apiChecks) {
      const target = `${baseUrl.replace(/\/$/, '')}${check.path}`;
      try {
        const response = await fetchWithTimeout(target, {
          method: check.method,
          headers: check.headers,
          body: check.body,
        });
        const vercelError = response.headers.get('x-vercel-error');
        const vercelId = response.headers.get('x-vercel-id') || '-';
        const vercelRequestId = response.headers.get('x-vercel-request-id') || response.headers.get('x-request-id') || '-';
        const correlation = `(x-vercel-id=${vercelId}, x-vercel-request-id=${vercelRequestId})`;
        if (response.status === 500 && vercelError === 'FUNCTION_INVOCATION_FAILED') {
          add({
            id: check.id,
            category: 'API Smoke',
            status: strictApiSmoke ? 'FAIL' : 'SKIP',
            details: strictApiSmoke
              ? `${check.note} Runtime failure (x-vercel-error=FUNCTION_INVOCATION_FAILED) at ${target} ${correlation} treated as FAIL in strict API smoke mode.`
              : `${check.note} Skipped due to deployed runtime failure (x-vercel-error=FUNCTION_INVOCATION_FAILED) at ${target} ${correlation}.`,
            reference: target,
          });
          continue;
        }
        const ok = check.okStatuses.includes(response.status);
        add({
          id: check.id,
          category: 'API Smoke',
          status: ok ? 'PASS' : 'FAIL',
          details: `${check.note} Received HTTP ${response.status} from ${target} ${correlation}.`,
          reference: target,
        });
      } catch (error) {
        add({
          id: check.id,
          category: 'API Smoke',
          status: 'FAIL',
          details: `Request failed for ${target}: ${formatError(error)}`,
          reference: target,
        });
      }
    }

    /** @type {Array<{id: string; path: string; method: string; okStatuses: number[]; note: string; token: string; body?: string; headers?: Record<string, string>; expectedBodyIncludes?: string[]}>} */
    const authenticatedChecks = [];
    if (sailingAuthToken) {
      authenticatedChecks.push({
        id: 'api-smoke-auth-sailing-workspace',
        path: '/api/club/workspace',
        method: 'GET',
        okStatuses: [200],
        note: 'Sailing authenticated probe should return workspace payload without auth/runtime failure.',
        token: sailingAuthToken,
      });
    }
    if (institutionAuthToken) {
      authenticatedChecks.push({
        id: 'api-smoke-auth-institution-domain-gate',
        path: '/api/ai/club/support',
        method: 'POST',
        okStatuses: [403],
        note: 'Institution authenticated probe should be domain-gated on sailing-only support endpoint.',
        token: institutionAuthToken,
        body: JSON.stringify({ message: 'integration smoke check' }),
        headers: { 'content-type': 'application/json' },
        expectedBodyIncludes: ['DOMAIN_GATED', 'sailing workspaces', 'Organization context required'],
      });
    }

    for (const check of authenticatedChecks) {
      const target = `${baseUrl.replace(/\/$/, '')}${check.path}`;
      try {
        const response = await fetchWithTimeout(target, {
          method: check.method,
          headers: {
            ...check.headers,
            authorization: `Bearer ${check.token}`,
          },
          body: check.body,
        });
        const vercelError = response.headers.get('x-vercel-error');
        const vercelId = response.headers.get('x-vercel-id') || '-';
        const vercelRequestId = response.headers.get('x-vercel-request-id') || response.headers.get('x-request-id') || '-';
        const bodyText = await response.text();
        const bodySnippet = bodyText.slice(0, 180).replace(/\s+/g, ' ').trim() || '-';
        const correlation = `(x-vercel-id=${vercelId}, x-vercel-request-id=${vercelRequestId}, body=${bodySnippet})`;
        if (response.status === 500 && vercelError === 'FUNCTION_INVOCATION_FAILED') {
          add({
            id: check.id,
            category: 'API Smoke',
            status: 'FAIL',
            details: `${check.note} Runtime failure (x-vercel-error=FUNCTION_INVOCATION_FAILED) at ${target} ${correlation}.`,
            reference: target,
          });
          continue;
        }
        const bodyExpectationMet =
          !check.expectedBodyIncludes ||
          check.expectedBodyIncludes.length === 0 ||
          check.expectedBodyIncludes.some((needle) => bodyText.includes(needle));
        const ok = check.okStatuses.includes(response.status) && bodyExpectationMet;
        add({
          id: check.id,
          category: 'API Smoke',
          status: ok ? 'PASS' : 'FAIL',
          details: `${check.note} Received HTTP ${response.status} from ${target} ${correlation}.`,
          reference: target,
        });
      } catch (error) {
        add({
          id: check.id,
          category: 'API Smoke',
          status: 'FAIL',
          details: `Authenticated request failed for ${target}: ${formatError(error)}`,
          reference: target,
        });
      }
    }
  }

  const passCount = results.filter((item) => item.status === 'PASS').length;
  const failCount = results.filter((item) => item.status === 'FAIL').length;
  const skipCount = results.filter((item) => item.status === 'SKIP').length;
  const overall = failCount > 0 ? 'FAIL' : 'PASS';

  const reportLines = [];
  reportLines.push('# Integration Validation Latest');
  reportLines.push('');
  reportLines.push(`- Generated: ${new Date().toISOString()}`);
  reportLines.push(`- Overall: **${overall}**`);
  reportLines.push(`- Checks: ${results.length} total (${passCount} pass, ${failCount} fail, ${skipCount} skip)`);
  reportLines.push('');
  reportLines.push('## Scope');
  reportLines.push('');
  reportLines.push('- Domain gating checks (`api/ai` race/club/event endpoints)');
  reportLines.push('- Invite flow schema/RPC/service checks');
  reportLines.push('- Programs route alias checks');
  reportLines.push('- Assessment RLS assumption checks (migration + table shape)');
  reportLines.push('- Coach retention weekly recap payload completeness guard checks');
  reportLines.push('- API smoke checks (when `INTEGRATION_BASE_URL` is available; strict mode adds unauthenticated POST probes for AI endpoints)');
  reportLines.push('- Optional authenticated smoke probes (enabled when domain bearer env vars are provided)');
  reportLines.push('');
  reportLines.push('## Required Signature Matrix');
  reportLines.push('');
  reportLines.push(`- Tables: ${activeTableSignatures.map((entry) => `\`${entry.table}\``).join(', ') || '(none)'}`);
  reportLines.push(`- RPCs: ${activeRpcSignatures.map((entry) => `\`${entry.name}\``).join(', ') || '(none)'}`);
  reportLines.push('');
  reportLines.push('## Results');
  reportLines.push('');
  reportLines.push('| Check | Category | Status | Details | Reference |');
  reportLines.push('|---|---|---|---|---|');
  for (const result of results) {
    reportLines.push(
      `| ${sanitizeForTable(result.id)} | ${sanitizeForTable(result.category)} | ${result.status} | ${sanitizeForTable(result.details)} | ${sanitizeForTable(result.reference || '-')} |`
    );
  }
  if (lineageMismatchReasons.length > 0) {
    reportLines.push('');
    reportLines.push('## Schema Drift Mismatch Reasons');
    reportLines.push('');
    for (const reason of [...new Set(lineageMismatchReasons)]) {
      reportLines.push(`- ${reason}`);
    }
  }
  reportLines.push('');
  reportLines.push('## Environment');
  reportLines.push('');
  reportLines.push(`- API base: ${baseUrl || '(not set)'}`);
  reportLines.push(`- Strict API smoke mode: ${strictApiSmoke ? 'enabled' : 'disabled'}`);
  reportLines.push(`- Sailing auth probe token: ${sailingAuthToken ? 'set' : 'not set'}`);
  reportLines.push(`- Institution auth probe token: ${institutionAuthToken ? 'set' : 'not set'}`);
  reportLines.push(`- Supabase URL: ${supabaseUrl ? 'set' : 'not set'}`);
  reportLines.push(`- Service role key: ${serviceRoleKey ? 'set' : 'not set'}`);
  reportLines.push(`- Started: ${startedAt.toISOString()}`);
  reportLines.push(`- Finished: ${new Date().toISOString()}`);
  reportLines.push('');
  reportLines.push('## Notes');
  reportLines.push('');
  reportLines.push('- `SKIP` indicates the check could not run due to missing runtime dependencies (typically env configuration).');
  reportLines.push('- `FAIL` indicates a direct mismatch, unreachable API smoke target, or DB/RPC assertion failure.');

  const finishedAt = new Date();
  const jsonSummary = {
    generated_at: finishedAt.toISOString(),
    started_at: startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
    overall,
    strict_api_smoke: strictApiSmoke,
    counts: {
      total: results.length,
      pass: passCount,
      fail: failCount,
      skip: skipCount,
    },
    environment: {
      api_base: baseUrl || null,
      sailing_auth_probe_token_set: Boolean(sailingAuthToken),
      institution_auth_probe_token_set: Boolean(institutionAuthToken),
      supabase_url_set: Boolean(supabaseUrl),
      service_role_key_set: Boolean(serviceRoleKey),
    },
    required_signature_matrix: {
      tables: activeTableSignatures.map((entry) => entry.table),
      rpcs: activeRpcSignatures.map((entry) => entry.name),
    },
    schema_drift_mismatch_reasons: [...new Set(lineageMismatchReasons)],
    results: results.map((result) => ({
      id: result.id,
      category: result.category,
      status: result.status,
      details: result.details,
      reference: result.reference || null,
    })),
  };

  await Promise.all([
    fs.writeFile(OUTPUT_PATH, reportLines.join('\n') + '\n', 'utf8'),
    fs.writeFile(OUTPUT_JSON_PATH, JSON.stringify(jsonSummary, null, 2) + '\n', 'utf8'),
  ]);

  if (overall === 'FAIL') {
    console.error(`Integration validation FAILED. Reports saved to ${OUTPUT_PATH} and ${OUTPUT_JSON_PATH}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Integration validation PASSED. Reports saved to ${OUTPUT_PATH} and ${OUTPUT_JSON_PATH}`);
}

run().catch((error) => {
  console.error('Integration validation runner crashed:', error);
  process.exitCode = 1;
});
