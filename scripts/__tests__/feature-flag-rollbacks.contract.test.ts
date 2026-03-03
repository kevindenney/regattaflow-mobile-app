import fs from 'node:fs';
import path from 'node:path';

function readSource(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('feature flag rollback contract', () => {
  it('defines required blueprint v2 flags and rollback runbook markers', () => {
    const flagsSource = readSource('lib/featureFlags.ts');
    const runbookSource = readSource('docs/feature-flag-rollback-runbook.md');

    expect(flagsSource).toContain('PROGRAM_DATA_MODEL_V1');
    expect(flagsSource).toContain('COACH_SHELL_V1');
    expect(flagsSource).toContain('DOMAIN_GATE_AI_STRICT_V1');
    expect(flagsSource).toContain('SECONDARY_PACKS_V1');
    expect(flagsSource).toContain('EXPO_PUBLIC_FF_PROGRAM_DATA_MODEL_V1');
    expect(flagsSource).toContain('EXPO_PUBLIC_FF_COACH_SHELL_V1');
    expect(flagsSource).toContain('EXPO_PUBLIC_FF_DOMAIN_GATE_AI_STRICT_V1');
    expect(flagsSource).toContain('EXPO_PUBLIC_FF_SECONDARY_PACKS_V1');

    expect(runbookSource).toContain('PROGRAM_DATA_MODEL_V1');
    expect(runbookSource).toContain('COACH_SHELL_V1');
    expect(runbookSource).toContain('DOMAIN_GATE_AI_STRICT_V1');
    expect(runbookSource).toContain('SECONDARY_PACKS_V1');
    expect(runbookSource).toContain('EXPO_PUBLIC_FF_PROGRAM_DATA_MODEL_V1');
    expect(runbookSource).toContain('EXPO_PUBLIC_FF_COACH_SHELL_V1');
    expect(runbookSource).toContain('EXPO_PUBLIC_FF_DOMAIN_GATE_AI_STRICT_V1');
    expect(runbookSource).toContain('EXPO_PUBLIC_FF_SECONDARY_PACKS_V1');
    expect(runbookSource).toContain('Rollback Procedure');
    expect(runbookSource).toContain('Restore Procedure');
  });
});
