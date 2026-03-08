#!/usr/bin/env node

import { chromium } from 'playwright';
import path from 'path';

const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:8081';
const profileDir = process.env.SMOKE_PROFILE_DIR || path.resolve('.chrome-devtools');

const checks = [];

const push = (id, ok, detail) => {
  checks.push({id, status: ok ? 'PASS' : 'FAIL', detail});
};

const run = async () => {
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: true,
    viewport: {width: 1440, height: 980},
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    await page.goto(`${baseUrl}/learn`, {waitUntil: 'networkidle', timeout: 120000});
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

    await page.goto(`${baseUrl}/social-notifications`, {waitUntil: 'networkidle', timeout: 120000});
    const approvedCount = await page.locator('text=Membership approved').count();
    const welcomeCount = await page.locator('text=organization access is now active').count();
    push('activity_approval_notification', approvedCount > 0 || welcomeCount > 0, `approved=${approvedCount}, welcome=${welcomeCount}`);

    await page.goto(`${baseUrl}/organization/members`, {waitUntil: 'networkidle', timeout: 120000});
    push('members_route', (await page.locator('text=Members').count()) > 0, 'Members route reachable');

    await page.goto(`${baseUrl}/organization/cohorts`, {waitUntil: 'networkidle', timeout: 120000});
    push('cohorts_route', (await page.locator('text=Cohorts').count()) > 0, 'Cohorts route reachable');

    await page.goto(`${baseUrl}/organization/templates`, {waitUntil: 'networkidle', timeout: 120000});
    const hasInterestSelector = (await page.getByPlaceholder('Interest slug (optional)').count()) > 0;
    push('templates_route', (await page.locator('text=Templates').count()) > 0, 'Templates route reachable');
    push('templates_interest_locked', !hasInterestSelector, `interest selector present=${hasInterestSelector}`);

    await page.goto(`${baseUrl}/learn`, {waitUntil: 'networkidle', timeout: 120000});
    const debugCount = await page.locator('text=activeOrgId=').count();
    push('cleanup_no_dev_text', debugCount === 0, `debug text count=${debugCount}`);

    await page.screenshot({path: '/tmp/multi-org-smoke.png', fullPage: true});

    for (const check of checks) {
      console.log(`${check.id}|${check.status}|${check.detail}`);
    }
    console.log('artifact|INFO|/tmp/multi-org-smoke.png');
  } finally {
    await context.close();
  }
};

run().catch((error) => {
  console.error(`smoke_error|FAIL|${error?.message || error}`);
  process.exit(1);
});
