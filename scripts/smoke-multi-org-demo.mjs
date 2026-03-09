#!/usr/bin/env node

import { chromium } from 'playwright';
import path from 'path';
import { spawnSync } from 'node:child_process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:8081';
const profileDir = process.env.SMOKE_PROFILE_DIR || path.resolve('.chrome-devtools');
const dbUrl =
  process.env.SMOKE_DB_URL ||
  process.env.DEMO_RESET_DB_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.DATABASE_URL ||
  '';
const adminEmail = process.env.SMOKE_ADMIN_EMAIL || process.env.DEMO_ADMIN_EMAIL || 'kevin@oceanflow.io';
const requesterEmail = process.env.SMOKE_REQUESTER_EMAIL || process.env.DEMO_REQUESTER_EMAIL || 'jhu2@jhu.edu';
const skipBrowser = process.env.SMOKE_SKIP_BROWSER === '1';
const autoContinue = process.env.SMOKE_AUTO_CONTINUE === '1';

const checks = [];

const push = (id, ok, detail) => {
  checks.push({ id, status: ok ? 'PASS' : 'FAIL', detail });
};

const info = (id, detail) => {
  checks.push({ id, status: 'INFO', detail });
};

function q(value) {
  return String(value).replace(/'/g, "''");
}

function hasPsql() {
  const result = spawnSync('psql', ['--version'], { encoding: 'utf8' });
  return result.status === 0;
}

function runPsqlScalar(sql, label) {
  if (!dbUrl) {
    throw new Error('SMOKE_DB_URL/DEMO_RESET_DB_URL is required for dual-session DB checks');
  }

  const result = spawnSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-At', '-c', sql], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim().split('\n').slice(-4).join(' | ');
    throw new Error(`${label} query failed: ${stderr || 'unknown psql error'}`);
  }

  return (result.stdout || '').trim();
}

async function waitForOperatorStep(id, promptText) {
  info(id, promptText);
  if (autoContinue || !input.isTTY) return;

  const rl = readline.createInterface({ input, output });
  try {
    await rl.question('Press Enter when complete... ');
  } finally {
    rl.close();
  }
}

function resolveDualSessionContext() {
  const sql = `
    SELECT
      COALESCE(
        (SELECT id::text FROM public.organizations WHERE name ILIKE '%Johns Hopkins School of Nursing%' AND COALESCE(is_active,true)=true ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST LIMIT 1),
        ''
      ) AS jhson_org_id,
      COALESCE(
        (SELECT id::text FROM public.organizations WHERE (name ILIKE '%Royal Hong Kong Yacht Club%' OR name ILIKE '%RHKYC%') AND COALESCE(is_active,true)=true ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST LIMIT 1),
        ''
      ) AS rhkyc_org_id,
      COALESCE(
        (SELECT id::text FROM public.users WHERE lower(email)=lower('${q(adminEmail)}') LIMIT 1),
        (SELECT id::text FROM auth.users WHERE lower(email)=lower('${q(adminEmail)}') LIMIT 1),
        ''
      ) AS admin_user_id,
      COALESCE(
        (SELECT id::text FROM public.users WHERE lower(email)=lower('${q(requesterEmail)}') LIMIT 1),
        (SELECT id::text FROM auth.users WHERE lower(email)=lower('${q(requesterEmail)}') LIMIT 1),
        ''
      ) AS requester_user_id
  `;

  const row = runPsqlScalar(sql, 'resolve_context');
  const [jhsonOrgId, rhkycOrgId, adminUserId, requesterUserId] = row.split('|');
  const ok = Boolean(jhsonOrgId && rhkycOrgId && adminUserId && requesterUserId);
  push(
    'dual_context_resolve',
    ok,
    `jhson=${jhsonOrgId || 'missing'}, rhkyc=${rhkycOrgId || 'missing'}, admin=${adminUserId || 'missing'}, requester=${requesterUserId || 'missing'}`
  );

  if (!ok) {
    throw new Error('Missing org/user IDs for dual-session checks');
  }

  return { jhsonOrgId, rhkycOrgId, adminUserId, requesterUserId };
}

function readMembershipState(orgId, userId, label) {
  const sql = `
    SELECT COALESCE(membership_status, status, '')
    FROM public.organization_memberships
    WHERE organization_id = '${q(orgId)}'::uuid
      AND user_id = '${q(userId)}'::uuid
    ORDER BY created_at DESC NULLS LAST
    LIMIT 1
  `;
  return runPsqlScalar(sql, label).toLowerCase();
}

function readDecisionNotificationCount(requesterUserId) {
  const sql = `
    SELECT COUNT(*)::text
    FROM public.social_notifications
    WHERE user_id = '${q(requesterUserId)}'::uuid
      AND type = 'org_membership_decision'
      AND created_at > (now() - interval '2 days')
  `;
  return Number(runPsqlScalar(sql, 'notification_count') || '0');
}

async function runDualSessionChecks() {
  if (!dbUrl) {
    push('dual_db_prereq', false, 'Set SMOKE_DB_URL (or DEMO_RESET_DB_URL) for DB-backed dual-session checks');
    return;
  }

  if (!hasPsql()) {
    push('dual_db_prereq', false, 'psql is not available in PATH');
    return;
  }

  push('dual_db_prereq', true, 'DB URL and psql available');
  info('dual_mode', `admin=${adminEmail}; requester=${requesterEmail}`);

  const context = resolveDualSessionContext();

  await waitForOperatorStep(
    'dual_open_requester_window',
    `Open requester session at ${baseUrl}/learn and sign in as ${requesterEmail}.`
  );

  await waitForOperatorStep(
    'dual_open_admin_window',
    `Open admin session at ${baseUrl}/organization/access-requests and sign in as ${adminEmail}.`
  );

  await waitForOperatorStep(
    'dual_request_access_action',
    'In requester window, click "Request access" for RHKYC (or reset to pending first).'
  );

  const pendingState = readMembershipState(context.rhkycOrgId, context.requesterUserId, 'pending_state');
  push('dual_pending_state', pendingState === 'pending', `rhkyc_status=${pendingState || 'none'}`);

  await waitForOperatorStep(
    'dual_admin_approve_action',
    'In admin window, approve requester from Access Requests.'
  );

  const activeState = readMembershipState(context.rhkycOrgId, context.requesterUserId, 'active_state');
  push('dual_active_state', activeState === 'active', `rhkyc_status=${activeState || 'none'}`);

  const notifCount = readDecisionNotificationCount(context.requesterUserId);
  push('dual_decision_notification', notifCount > 0, `org_membership_decision_recent=${notifCount}`);
}

async function runBrowserSmoke() {
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: true,
    viewport: { width: 1440, height: 980 },
  });

  const page = context.pages()[0] || (await context.newPage());

  try {
    await page.goto(`${baseUrl}/learn`, { waitUntil: 'networkidle', timeout: 120000 });
    push('learn_load', (await page.locator('text=Learn').count()) > 0, 'Learn page rendered');

    const adminToolsCount = await page.locator('text=Admin tools').count();
    push('learn_admin_tools', adminToolsCount > 0, `Admin tools count=${adminToolsCount}`);

    const searchInput = page.getByPlaceholder('Search by name or slug');
    if (await searchInput.count()) {
      await searchInput.fill('john');
      await page.waitForTimeout(1200);
    }

    const jhsonCount = await page.locator('text=Johns Hopkins School of Nursing').count();
    const memberCount = await page.locator('text=Member').count();
    push('learn_jhson_visible', jhsonCount > 0, `JHSON count=${jhsonCount}`);
    push('learn_membership_first', memberCount > 0, `Member pill count=${memberCount}`);

    await page.goto(`${baseUrl}/social-notifications`, { waitUntil: 'networkidle', timeout: 120000 });
    const approvedCount = await page.locator('text=Membership approved').count();
    const welcomeCount = await page.locator('text=organization access is now active').count();
    push('activity_approval_notification', approvedCount > 0 || welcomeCount > 0, `approved=${approvedCount}, welcome=${welcomeCount}`);
    const groupedToggleCount = await page.locator('text=Grouped').count();
    const allToggleCount = await page.locator('text=All').count();
    push('activity_view_toggle_controls', groupedToggleCount > 0 && allToggleCount > 0, `grouped=${groupedToggleCount}, all=${allToggleCount}`);

    await page.goto(`${baseUrl}/organization/members`, { waitUntil: 'networkidle', timeout: 120000 });
    push('members_route', (await page.locator('text=Members').count()) > 0, 'Members route reachable');

    await page.goto(`${baseUrl}/organization/cohorts`, { waitUntil: 'networkidle', timeout: 120000 });
    push('cohorts_route', (await page.locator('text=Cohorts').count()) > 0, 'Cohorts route reachable');

    await page.goto(`${baseUrl}/organization/templates`, { waitUntil: 'networkidle', timeout: 120000 });
    const hasInterestSelector = (await page.getByPlaceholder('Interest slug (optional)').count()) > 0;
    push('templates_route', (await page.locator('text=Templates').count()) > 0, 'Templates route reachable');
    push('templates_interest_locked', !hasInterestSelector, `interest selector present=${hasInterestSelector}`);
    const templateContextHintCount = await page.locator('text=Using organization context:').count();
    push('templates_context_hint', templateContextHintCount > 0, `context hint count=${templateContextHintCount}`);

    await page.goto(`${baseUrl}/settings/organization-access`, { waitUntil: 'networkidle', timeout: 120000 });
    const invitePanelCount = await page.locator('text=Invite People').count();
    push('org_access_invite_panel', invitePanelCount > 0, `invite panel count=${invitePanelCount}`);

    await page.goto(`${baseUrl}/learn`, { waitUntil: 'networkidle', timeout: 120000 });
    const debugCount = await page.locator('text=activeOrgId=').count();
    push('cleanup_no_dev_text', debugCount === 0, `debug text count=${debugCount}`);

    await page.screenshot({ path: '/tmp/multi-org-smoke.png', fullPage: true });
    info('artifact', '/tmp/multi-org-smoke.png');
  } finally {
    await context.close();
  }
}

async function run() {
  await runDualSessionChecks();

  if (skipBrowser) {
    info('browser_smoke', 'skipped (SMOKE_SKIP_BROWSER=1)');
  } else {
    await runBrowserSmoke();
  }

  for (const check of checks) {
    console.log(`${check.id}|${check.status}|${check.detail}`);
  }

  if (checks.some((check) => check.status === 'FAIL')) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(`smoke_error|FAIL|${error?.message || error}`);
  process.exit(1);
});
