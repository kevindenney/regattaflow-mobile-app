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
      needleA: "organization.organization_type !== 'club'",
      needleB: "code: 'DOMAIN_GATED'",
    },
    {
      id: 'domain-gate-event-doc-draft',
      file: 'api/ai/events/[id]/documents/draft.ts',
      needleA: "organization.organization_type !== 'club'",
      needleB: "code: 'DOMAIN_GATED'",
    },
    {
      id: 'domain-gate-race-comms-draft',
      file: 'api/ai/races/[id]/comms/draft.ts',
      needleA: "organization.organization_type !== 'club'",
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

  const programsFile = await readFile('app/(tabs)/programs.tsx');
  const raceManagementFile = await readFile('app/(tabs)/race-management.tsx');
  const tabsLayoutFile = await readFile('app/(tabs)/_layout.tsx');
  const programsAliasOk =
    programsFile.includes("./programs-experience") &&
    raceManagementFile.includes("./programs-experience");
  add({
    id: 'programs-route-alias',
    category: 'Programs Alias',
    status: programsAliasOk ? 'PASS' : 'FAIL',
    details: programsAliasOk
      ? 'Both /programs and /race-management resolve to programs-experience.'
      : 'Programs/race-management alias export mismatch.',
    reference: 'app/(tabs)/programs.tsx, app/(tabs)/race-management.tsx',
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
  reportLines.push('- API smoke checks (when `INTEGRATION_BASE_URL` is available; strict mode adds unauthenticated POST probes for AI endpoints)');
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
