import fs from 'fs';
import path from 'path';

type PackageJson = {
  scripts?: Record<string, string>;
};

function readPackageJson(): PackageJson {
  const packagePath = path.resolve(process.cwd(), 'package.json');
  return JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;
}

describe('package CI gates contract', () => {
  it('keeps CI gate scripts wired with unit + sql security + smoke checks', () => {
    const pkg = readPackageJson();
    const scripts = pkg.scripts || {};

    expect(scripts['test:security:sql:full']).toContain('AssessmentRecordsRls.sql-security.test.ts');
    expect(scripts['test:security:sql:full']).toContain('OrganizationInviteTokenLookup.sql-security.test.ts');
    expect(scripts['test:security:sql']).toContain('npm run test:security:sql:full');

    expect(scripts['test:ci:gates:unit']).toContain('api/__tests__/auth.middleware.regression.test.ts');
    expect(scripts['test:ci:gates:unit']).toContain('api/__tests__/ai-endpoints.contract.test.ts');
    expect(scripts['test:ci:gates:unit']).toContain('scripts/__tests__/run-api-smoke-deploy.contract.test.ts');
    expect(scripts['test:ci:gates:unit']).toContain('scripts/__tests__/report-coach-home-query-baseline.contract.test.ts');
    expect(scripts['test:ci:gates:unit']).toContain('scripts/__tests__/report-coach-home-endpoint-profile.contract.test.ts');
    expect(scripts['test:ci:gates:unit']).toContain('scripts/__tests__/check-coach-home-baseline-budget.contract.test.ts');
    expect(scripts['test:ci:gates:unit']).toContain('scripts/__tests__/coach-home-index-migration.contract.test.ts');
    expect(scripts['test:ci:gates:unit']).toContain('scripts/__tests__/feature-flag-rollbacks.contract.test.ts');
    expect(scripts['test:ci:gates:unit']).toContain('scripts/__tests__/secondary-packs-canonical.contract.test.ts');
    expect(scripts['test:ci:gates:unit']).toContain('api/__tests__/domain-resolution.contract.test.ts');
    expect(scripts['test:ci:gates:unit']).toContain('app/__tests__/coach-home-assessments-drilldown-route.e2e.test.ts');
    expect(scripts['test:ci:gates:unit']).toContain('app/__tests__/programs-experience-assessment-scope.contract.test.ts');
    expect(scripts['test:ci:gates:unit']).toContain('app/__tests__/communications-route.contract.test.ts');
    expect(scripts['test:ci:gates:unit']).toContain('app/__tests__/tabs-programs-route-regression.test.ts');
    expect(scripts['test:ci:gates:unit']).toContain('app/__tests__/race-management-alias-lifecycle.contract.test.ts');
    expect(scripts['test:ci:gates:unit']).toContain('app/__tests__/secondary-packs-route-api.contract.test.ts');
    expect(scripts['test:ci:gates:unit']).toContain('hooks/__tests__/useWorkspaceDomain.test.ts');
    expect(scripts['test:ci:gates:unit']).toContain('services/__tests__/ProgramService.contract.test.ts');
    expect(scripts['report:coach-home-query-baseline']).toContain('scripts/report-coach-home-query-baseline.mjs');
    expect(scripts['report:coach-home-endpoint-profile']).toContain('scripts/report-coach-home-endpoint-profile.mjs');
    expect(scripts['gate:coach-home-baseline-budget']).toContain('scripts/check-coach-home-baseline-budget.mjs');

    expect(scripts['test:ci:gates']).toContain('npm run test:ci:gates:unit');
    expect(scripts['test:ci:gates']).toContain('npm run test:security:sql');
    expect(scripts['test:ci:gates']).toContain('npm run smoke:gate:integration-validation');
  });
});
