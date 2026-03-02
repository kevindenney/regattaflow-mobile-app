import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

function buildReport(checkRows: Array<{ checkId: string; status: string }>): string {
  const lines = [
    '# Integration Validation Report',
    '',
    '## Checks',
    '| Check | Category | Status | Details | Reference |',
    '|---|---|---|---|---|',
    ...checkRows.map((row) => `| ${row.checkId} | smoke | ${row.status} | ok | n/a |`),
    '',
  ];
  return lines.join('\n');
}

function runGate(reportPath: string, expectedSkipIds = '') {
  const scriptPath = path.resolve(process.cwd(), 'scripts/check-integration-validation-gate.mjs');
  return spawnSync('node', [scriptPath, '--report', reportPath], {
    encoding: 'utf8',
    env: { ...process.env, EXPECTED_SKIP_IDS: expectedSkipIds },
  });
}

describe('check-integration-validation-gate', () => {
  it('fails closed when checks table is missing or unparsable', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'integration-gate-malformed-'));
    const reportPath = path.join(tempDir, 'integration-validation-latest.md');
    fs.writeFileSync(
      reportPath,
      '# Integration Validation Report\n\n## Checks\n\nNo markdown table present.\n',
      'utf8'
    );

    const result = runGate(reportPath);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('No check rows were parsed');
  });

  it('passes when report has only PASS rows', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'integration-gate-pass-'));
    const reportPath = path.join(tempDir, 'integration-validation-latest.md');
    fs.writeFileSync(
      reportPath,
      buildReport([
        { checkId: 'api-smoke', status: 'PASS' },
        { checkId: 'db-assertions-availability', status: 'PASS' },
      ]),
      'utf8'
    );

    const result = runGate(reportPath);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Integration validation gate: PASS');
  });

  it('uses the first valid checks table when extra markdown tables exist', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'integration-gate-extra-tables-'));
    const reportPath = path.join(tempDir, 'integration-validation-latest.md');
    fs.writeFileSync(
      reportPath,
      [
        '# Integration Validation Latest',
        '',
        '| Name | Value |',
        '|---|---|',
        '| foo | bar |',
        '',
        '## Results',
        '| Check | Category | Status | Details | Reference |',
        '|---|---|---|---|---|',
        '| api-smoke | API Smoke | PASS | ok | n/a |',
        '',
        '## Additional Checks Snapshot',
        '| Check | Category | Status | Details | Reference |',
        '|---|---|---|---|---|',
        '| api-smoke | API Smoke | FAIL | regressed | n/a |',
        '',
        '## Notes',
        '| Key | Value |',
        '|---|---|',
        '| baz | qux |',
        '',
      ].join('\n'),
      'utf8'
    );

    const result = runGate(reportPath);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Integration validation gate: PASS');
  });

  it('parses checks table when sections are reordered', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'integration-gate-reordered-'));
    const reportPath = path.join(tempDir, 'integration-validation-latest.md');
    fs.writeFileSync(
      reportPath,
      [
        '# Integration Validation Latest',
        '',
        '## Notes',
        '- Some note first',
        '',
        '## Environment',
        '- strictApiSmoke=true',
        '',
        '## Final',
        '- summary comes first in this format',
        '',
        '## Results',
        '| Check | Category | Status | Details | Reference |',
        '|---|---|---|---|---|',
        '| domain-gate | Domain Gating | PASS | ok | n/a |',
        '',
      ].join('\n'),
      'utf8'
    );

    const result = runGate(reportPath);
    expect(result.status).toBe(0);
  });

  it('handles CRLF reports', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'integration-gate-crlf-'));
    const reportPath = path.join(tempDir, 'integration-validation-latest.md');
    const lines = [
      '# Integration Validation Latest',
      '',
      '## Results',
      '| Check | Category | Status | Details | Reference |',
      '|---|---|---|---|---|',
      '| api-smoke | API Smoke | PASS | ok | n/a |',
      '',
    ];
    fs.writeFileSync(reportPath, `${lines.join('\r\n')}\r\n`, 'utf8');

    const result = runGate(reportPath);
    expect(result.status).toBe(0);
  });

  it('fails on duplicate check ids with deterministic sorted diagnostics', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'integration-gate-duplicates-'));
    const reportPath = path.join(tempDir, 'integration-validation-latest.md');
    fs.writeFileSync(
      reportPath,
      buildReport([
        { checkId: 'z-check', status: 'PASS' },
        { checkId: 'a-check', status: 'PASS' },
        { checkId: 'z-check', status: 'FAIL' },
        { checkId: 'a-check', status: 'FAIL' },
      ]),
      'utf8'
    );

    const result = runGate(reportPath);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Duplicate check IDs detected');
    const idxA = result.stderr.indexOf('- a-check');
    const idxZ = result.stderr.indexOf('- z-check');
    expect(idxA).toBeGreaterThan(-1);
    expect(idxZ).toBeGreaterThan(-1);
    expect(idxA).toBeLessThan(idxZ);
  });

  it('fails when report contains FAIL rows', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'integration-gate-fail-'));
    const reportPath = path.join(tempDir, 'integration-validation-latest.md');
    fs.writeFileSync(
      reportPath,
      buildReport([
        { checkId: 'api-smoke', status: 'PASS' },
        { checkId: 'domain-gating', status: 'FAIL' },
      ]),
      'utf8'
    );

    const result = runGate(reportPath);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL checks detected');
    expect(result.stderr).toContain('domain-gating');
  });

  it('fails on unexpected SKIP and passes on allowlisted SKIP', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'integration-gate-skip-'));
    const reportPath = path.join(tempDir, 'integration-validation-latest.md');
    fs.writeFileSync(
      reportPath,
      buildReport([
        { checkId: 'db-assertions-availability', status: 'SKIP' },
        { checkId: 'api-smoke', status: 'SKIP' },
      ]),
      'utf8'
    );

    const blocked = runGate(reportPath, 'db-assertions-availability');
    expect(blocked.status).toBe(1);
    expect(blocked.stderr).toContain('Unexpected SKIP checks detected');
    expect(blocked.stderr).toContain('api-smoke');

    const allowed = runGate(reportPath, 'db-assertions-availability,api-smoke');
    expect(allowed.status).toBe(0);
    expect(allowed.stdout).toContain('Integration validation gate: PASS');
  });
});
