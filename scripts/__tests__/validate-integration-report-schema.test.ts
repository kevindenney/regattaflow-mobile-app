import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

function runSchemaCheck(reportPath: string) {
  const scriptPath = path.resolve(process.cwd(), 'scripts/validate-integration-report-schema.mjs');
  return spawnSync('node', [scriptPath, '--report', reportPath], {
    encoding: 'utf8',
  });
}

function buildReport(rows: Array<{ checkId: string; status: string }>): string {
  return [
    '# Integration Validation Latest',
    '',
    '- Generated: 2026-03-03T00:00:00.000Z',
    '- Overall: **PASS**',
    `- Checks: ${rows.length} total (${rows.length} pass, 0 fail, 0 skip)`,
    '',
    '## Scope',
    '',
    '- test scope',
    '',
    '## Required Signature Matrix',
    '',
    '- Tables: `organizations`',
    '- RPCs: `respond_to_organization_invite`',
    '',
    '## Results',
    '',
    '| Check | Category | Status | Details | Reference |',
    '|---|---|---|---|---|',
    ...rows.map((row) => `| ${row.checkId} | API Smoke | ${row.status} | ok | n/a |`),
    '',
    '## Environment',
    '',
    '- API base: https://example.test',
    '',
    '## Notes',
    '',
    '- note',
    '',
  ].join('\n');
}

describe('validate-integration-report-schema', () => {
  it('passes when required auth-probe configuration check id is present', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rf-schema-pass-'));
    const reportPath = path.join(tempDir, 'integration-validation-latest.md');
    fs.writeFileSync(
      reportPath,
      buildReport([
        { checkId: 'api-smoke-auth-probe-configuration', status: 'PASS' },
        { checkId: 'api-smoke-domain-gate-race-comms', status: 'PASS' },
      ]),
      'utf8'
    );

    const result = runSchemaCheck(reportPath);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Integration report schema: PASS');
  });

  it('fails when required auth-probe configuration check id is missing', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rf-schema-fail-'));
    const reportPath = path.join(tempDir, 'integration-validation-latest.md');
    fs.writeFileSync(
      reportPath,
      buildReport([{ checkId: 'api-smoke-domain-gate-race-comms', status: 'PASS' }]),
      'utf8'
    );

    const result = runSchemaCheck(reportPath);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Required results check id "api-smoke-auth-probe-configuration"');
  });
});

