import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

function runLint(migrationsDir: string) {
  const scriptPath = path.resolve(process.cwd(), 'scripts/lint-20260302-migration-conventions.mjs');
  return spawnSync('node', [scriptPath], {
    encoding: 'utf8',
    env: { ...process.env, MIGRATIONS_DIR: migrationsDir },
  });
}

describe('lint-20260302-migration-conventions', () => {
  it('passes when 20260302 migrations include canonical header markers', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rf-mig-lint-pass-'));
    const migrationPath = path.join(tempDir, '20260302123456_valid_header.sql');
    fs.writeFileSync(
      migrationPath,
      [
        '-- =============================================================================',
        '-- Example migration',
        '--',
        '-- Canonical ownership:',
        '-- - Owns example_symbol.',
        '-- Override intent:',
        '-- - None; additive migration.',
        '-- =============================================================================',
        '',
        'BEGIN;',
        'SELECT 1;',
        'COMMIT;',
        '',
      ].join('\n'),
      'utf8'
    );

    const result = runLint(tempDir);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[lint-20260302] PASS');
  });

  it('fails when canonical header markers are missing', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rf-mig-lint-fail-'));
    const migrationPath = path.join(tempDir, '20260302123457_missing_header.sql');
    fs.writeFileSync(
      migrationPath,
      [
        '-- =============================================================================',
        '-- Missing canonical markers',
        '-- =============================================================================',
        '',
        'BEGIN;',
        'SELECT 1;',
        'COMMIT;',
        '',
      ].join('\n'),
      'utf8'
    );

    const result = runLint(tempDir);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('missing header marker "-- Canonical ownership:"');
    expect(result.stderr).toContain('missing header marker "-- Override intent:"');
  });
});

