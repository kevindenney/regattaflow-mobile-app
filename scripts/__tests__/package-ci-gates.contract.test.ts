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
    expect(scripts['test:ci:gates:unit']).toContain('scripts/__tests__/check-coach-home-baseline-budget.contract.test.ts');
    expect(scripts['test:ci:gates:unit']).toContain('scripts/__tests__/coach-home-index-migration.contract.test.ts');
    expect(scripts['report:coach-home-query-baseline']).toContain('scripts/report-coach-home-query-baseline.mjs');
    expect(scripts['gate:coach-home-baseline-budget']).toContain('scripts/check-coach-home-baseline-budget.mjs');

    expect(scripts['test:ci:gates']).toContain('npm run test:ci:gates:unit');
    expect(scripts['test:ci:gates']).toContain('npm run test:security:sql');
    expect(scripts['test:ci:gates']).toContain('npm run smoke:gate:integration-validation');
  });
});
